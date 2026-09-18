"""
Dentalyze Care — Faster R-CNN Training Script for DENTEX Dataset

This script trains a Faster R-CNN (ResNet50-FPN backbone) on the DENTEX
dental X-ray dataset to detect 4 conditions:
  1. Caries
  2. Deep Caries
  3. Periapical Lesion
  4. Impacted Tooth

Dataset: DENTEX (https://github.com/ibrahimethemhamamci/DENTEX)
Format: COCO-like JSON with 'category_id_3' and 'categories_3' fields.

Usage:
    python train_dentex.py --data_dir /path/to/Dental_Dataset_1104 --epochs 30

Requirements:
    pip install torch torchvision opencv-python-headless matplotlib tqdm scikit-learn

References:
    - Original notebook: models/DXA-060.ipynb
    - DENTEX paper: https://arxiv.org/abs/2305.19478
"""

import os
import json
import argparse
import random
from pathlib import Path
from datetime import datetime

import numpy as np
import cv2
import torch
import torch.utils.data
import torchvision
from torchvision.models.detection import fasterrcnn_resnet50_fpn, FasterRCNN_ResNet50_FPN_Weights
from torchvision.models.detection.faster_rcnn import FastRCNNPredictor
from torch.utils.data import Dataset, DataLoader
from sklearn.model_selection import train_test_split

try:
    from tqdm import tqdm
except ImportError:
    # Fallback if tqdm not installed
    def tqdm(iterable, **kwargs):
        return iterable


# ─────────────────────────────────────────────────────────────
# Disease Classes (from DENTEX categories_3)
# ─────────────────────────────────────────────────────────────
DISEASE_CLASSES = {
    0: "background",
    1: "Caries",
    2: "Deep Caries",
    3: "Periapical Lesion",
    4: "Impacted",
}
NUM_CLASSES = 5  # 1 background + 4 disease classes


# ─────────────────────────────────────────────────────────────
# Dataset
# ─────────────────────────────────────────────────────────────
class DentexDataset(Dataset):
    """
    Custom Dataset for the DENTEX dental X-ray dataset.
    Expects COCO-like JSON annotations with 'category_id_3' field
    and 'categories_3' for the disease classification task.
    """

    def __init__(self, images_dir, annotations, image_ids=None, transforms=None):
        """
        Args:
            images_dir: Path to the directory containing X-ray PNG images.
            annotations: Parsed JSON annotation data dict with 'images', 'annotations' keys.
            image_ids: Optional list of image IDs to use (for train/val split).
            transforms: Optional transforms to apply.
        """
        self.images_dir = images_dir
        self.transforms = transforms

        # Build image map
        self.image_map = {img["id"]: img for img in annotations["images"]}

        # Build annotation map (image_id -> list of annotations)
        self.img_to_anns = {}
        for ann in annotations["annotations"]:
            img_id = ann["image_id"]
            if image_ids is None or img_id in image_ids:
                self.img_to_anns.setdefault(img_id, []).append(ann)

        # Only keep images that have annotations
        if image_ids is not None:
            self.ids = [iid for iid in image_ids if iid in self.img_to_anns]
        else:
            self.ids = list(self.img_to_anns.keys())

        print(f"  Dataset: {len(self.ids)} images with annotations loaded.")

    def __len__(self):
        return len(self.ids)

    def __getitem__(self, idx):
        image_id = self.ids[idx]
        img_info = self.image_map[image_id]
        img_path = os.path.join(self.images_dir, img_info["file_name"])

        # Load image
        img = cv2.imread(img_path)
        if img is None:
            raise FileNotFoundError(f"Image not found: {img_path}")
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

        # Parse bounding boxes and labels
        boxes = []
        labels = []
        for ann in self.img_to_anns[image_id]:
            x, y, w, h = ann["bbox"]
            # Skip degenerate boxes
            if w <= 0 or h <= 0:
                continue
            boxes.append([x, y, x + w, y + h])  # Convert [x,y,w,h] -> [x1,y1,x2,y2]

            # Use category_id_3 for disease classification
            # The DENTEX dataset uses 0-indexed category_id_3, but Faster R-CNN
            # expects 1-indexed labels (0 = background). Add 1 to shift.
            cat_id = ann.get("category_id_3", ann.get("category_id", 0))
            labels.append(cat_id + 1)  # +1 because 0 = background in Faster R-CNN

        # Apply data augmentation
        if self.transforms and random.random() > 0.5:
            # Horizontal flip
            h_img, w_img = img.shape[:2]
            img = cv2.flip(img, 1)
            new_boxes = []
            for bx in boxes:
                x1, y1, x2, y2 = bx
                new_boxes.append([w_img - x2, y1, w_img - x1, y2])
            boxes = new_boxes

        # Normalize to [0, 1] float
        img = img.astype(np.float32) / 255.0

        # Handle empty annotations
        if len(boxes) == 0:
            boxes = torch.zeros((0, 4), dtype=torch.float32)
            labels = torch.zeros((0,), dtype=torch.int64)
        else:
            boxes = torch.tensor(boxes, dtype=torch.float32)
            labels = torch.tensor(labels, dtype=torch.int64)

        # Clamp boxes to image dimensions
        h_img, w_img = img.shape[:2]
        boxes[:, 0] = boxes[:, 0].clamp(0, w_img)
        boxes[:, 1] = boxes[:, 1].clamp(0, h_img)
        boxes[:, 2] = boxes[:, 2].clamp(0, w_img)
        boxes[:, 3] = boxes[:, 3].clamp(0, h_img)

        target = {
            "boxes": boxes,
            "labels": labels,
            "image_id": torch.tensor([image_id]),
        }

        # Convert image to tensor [C, H, W]
        img_tensor = torch.tensor(img).permute(2, 0, 1)

        return img_tensor, target


def collate_fn(batch):
    """Custom collate to handle variable-size targets."""
    return tuple(zip(*batch))


# ─────────────────────────────────────────────────────────────
# Model
# ─────────────────────────────────────────────────────────────
def create_model(num_classes: int = NUM_CLASSES, pretrained: bool = True):
    """
    Create a Faster R-CNN model with ResNet50-FPN backbone.
    Replace the classification head for our number of classes.
    """
    if pretrained:
        model = fasterrcnn_resnet50_fpn(weights=FasterRCNN_ResNet50_FPN_Weights.COCO_V1)
    else:
        model = fasterrcnn_resnet50_fpn(weights=None)

    # Replace the box predictor head
    in_features = model.roi_heads.box_predictor.cls_score.in_features
    model.roi_heads.box_predictor = FastRCNNPredictor(in_features, num_classes)

    return model


# ─────────────────────────────────────────────────────────────
# Training
# ─────────────────────────────────────────────────────────────
def train_one_epoch(model, optimizer, data_loader, device, epoch):
    """Train for one epoch."""
    model.train()
    total_loss = 0
    num_batches = 0

    progress = tqdm(data_loader, desc=f"Epoch {epoch+1}", leave=True)
    for images, targets in progress:
        images = [img.to(device) for img in images]
        targets = [{k: v.to(device) for k, v in t.items()} for t in targets]

        # Forward pass
        loss_dict = model(images, targets)
        losses = sum(loss for loss in loss_dict.values())

        # Backward pass
        optimizer.zero_grad()
        losses.backward()

        # Gradient clipping for stability
        torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=5.0)
        optimizer.step()

        batch_loss = losses.item()
        total_loss += batch_loss
        num_batches += 1
        progress.set_postfix(loss=f"{batch_loss:.4f}")

    avg_loss = total_loss / max(num_batches, 1)
    print(f"  Epoch {epoch+1} — Average Loss: {avg_loss:.4f}")
    return avg_loss


@torch.no_grad()
def evaluate(model, data_loader, device):
    """
    Simple evaluation: compute average loss on validation set.
    For proper mAP evaluation, use pycocotools (COCOeval).
    """
    model.train()  # Need train mode to get loss_dict
    total_loss = 0
    num_batches = 0

    for images, targets in data_loader:
        images = [img.to(device) for img in images]
        targets = [{k: v.to(device) for k, v in t.items()} for t in targets]

        loss_dict = model(images, targets)
        losses = sum(loss for loss in loss_dict.values())

        total_loss += losses.item()
        num_batches += 1

    avg_loss = total_loss / max(num_batches, 1)
    return avg_loss


# ─────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description="Train Faster R-CNN on DENTEX dataset")
    parser.add_argument(
        "--data_dir",
        type=str,
        required=True,
        help="Path to Dental_Dataset_1104 root directory",
    )
    parser.add_argument("--epochs", type=int, default=30, help="Number of training epochs")
    parser.add_argument("--fine_tune_epochs", type=int, default=10, help="Number of fine-tuning epochs (lower LR)")
    parser.add_argument("--batch_size", type=int, default=2, help="Batch size")
    parser.add_argument("--lr", type=float, default=1e-4, help="Initial learning rate")
    parser.add_argument("--fine_tune_lr", type=float, default=1e-5, help="Fine-tuning learning rate")
    parser.add_argument("--val_split", type=float, default=0.2, help="Validation split ratio")
    parser.add_argument(
        "--output_dir",
        type=str,
        default="./trained_models",
        help="Directory to save trained models",
    )
    parser.add_argument("--seed", type=int, default=42, help="Random seed")
    args = parser.parse_args()

    # Seed for reproducibility
    random.seed(args.seed)
    np.random.seed(args.seed)
    torch.manual_seed(args.seed)

    # Device
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")
    if device.type == "cuda":
        print(f"  GPU: {torch.cuda.get_device_name(0)}")
        print(f"  Memory: {torch.cuda.get_device_properties(0).total_mem / 1e9:.1f} GB")

    # ─── Load Annotations ───────────────────────────────────
    annotation_file = os.path.join(
        args.data_dir,
        "training_data",
        "quadrant-enumeration-disease",
        "train_quadrant_enumeration_disease.json",
    )
    images_dir = os.path.join(
        args.data_dir,
        "training_data",
        "quadrant-enumeration-disease",
        "xrays",
    )

    if not os.path.exists(annotation_file):
        print(f"\nERROR: Annotation file not found at: {annotation_file}")
        print("\nThe DENTEX dataset annotation JSON is required for training.")
        print("You can download it from the DENTEX repository:")
        print("  https://github.com/ibrahimethemhamamci/DENTEX")
        print("\nExpected file:")
        print(f"  {annotation_file}")
        print("\nPlace the 'train_quadrant_enumeration_disease.json' file in:")
        print(f"  {os.path.dirname(annotation_file)}")
        return

    print(f"\nLoading annotations from: {annotation_file}")
    with open(annotation_file, "r") as f:
        annotations = json.load(f)

    print(f"  Total images in annotations: {len(annotations['images'])}")
    print(f"  Total annotations: {len(annotations['annotations'])}")

    # Print category info
    if "categories_3" in annotations:
        print(f"  Disease categories (categories_3):")
        for cat in annotations["categories_3"]:
            print(f"    {cat['id']}: {cat['name']}")

    # ─── Train/Val Split ────────────────────────────────────
    all_image_ids = [img["id"] for img in annotations["images"]]

    # Only keep images that have annotations
    annotated_ids = set(ann["image_id"] for ann in annotations["annotations"])
    valid_ids = [iid for iid in all_image_ids if iid in annotated_ids]

    print(f"\n  Images with annotations: {len(valid_ids)} / {len(all_image_ids)}")

    train_ids, val_ids = train_test_split(
        valid_ids, test_size=args.val_split, random_state=args.seed
    )
    print(f"  Train set: {len(train_ids)} images")
    print(f"  Val set:   {len(val_ids)} images")

    # ─── Create Datasets ────────────────────────────────────
    print("\nCreating datasets...")
    train_dataset = DentexDataset(
        images_dir=images_dir,
        annotations=annotations,
        image_ids=set(train_ids),
        transforms=True,  # Enable augmentation
    )
    val_dataset = DentexDataset(
        images_dir=images_dir,
        annotations=annotations,
        image_ids=set(val_ids),
        transforms=False,
    )

    train_loader = DataLoader(
        train_dataset,
        batch_size=args.batch_size,
        shuffle=True,
        collate_fn=collate_fn,
        num_workers=0,  # Set to 0 for Windows compatibility
        pin_memory=device.type == "cuda",
    )
    val_loader = DataLoader(
        val_dataset,
        batch_size=args.batch_size,
        shuffle=False,
        collate_fn=collate_fn,
        num_workers=0,
        pin_memory=device.type == "cuda",
    )

    # ─── Create Model ───────────────────────────────────────
    print(f"\nCreating Faster R-CNN model (num_classes={NUM_CLASSES})...")
    model = create_model(num_classes=NUM_CLASSES, pretrained=True)
    model.to(device)

    # ─── Phase 1: Initial Training ──────────────────────────
    print(f"\n{'='*60}")
    print(f"Phase 1: Initial Training ({args.epochs} epochs, lr={args.lr})")
    print(f"{'='*60}")

    optimizer = torch.optim.AdamW(
        model.parameters(), lr=args.lr, weight_decay=0.0005
    )
    scheduler = torch.optim.lr_scheduler.StepLR(optimizer, step_size=7, gamma=0.5)

    best_val_loss = float("inf")
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    for epoch in range(args.epochs):
        train_loss = train_one_epoch(model, optimizer, train_loader, device, epoch)
        val_loss = evaluate(model, val_loader, device)
        scheduler.step()

        current_lr = optimizer.param_groups[0]["lr"]
        print(f"  Val Loss: {val_loss:.4f} | LR: {current_lr:.2e}")

        # Save best model
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            save_path = output_dir / "dentex_frcnn_best.pth"
            torch.save(model.state_dict(), save_path)
            print(f"  [OK] New best model saved! (val_loss: {val_loss:.4f})")

    # Save initial training checkpoint
    initial_path = output_dir / "dentex_frcnn_initial.pth"
    torch.save(model.state_dict(), initial_path)
    print(f"\nInitial training checkpoint saved: {initial_path}")

    # ─── Phase 2: Fine-tuning ───────────────────────────────
    print(f"\n{'='*60}")
    print(f"Phase 2: Fine-tuning ({args.fine_tune_epochs} epochs, lr={args.fine_tune_lr})")
    print(f"{'='*60}")

    # Load best model from Phase 1
    model.load_state_dict(torch.load(output_dir / "dentex_frcnn_best.pth", map_location=device, weights_only=True))

    optimizer_ft = torch.optim.AdamW(
        model.parameters(), lr=args.fine_tune_lr, weight_decay=0.0005
    )
    scheduler_ft = torch.optim.lr_scheduler.CosineAnnealingLR(
        optimizer_ft, T_max=args.fine_tune_epochs
    )

    for epoch in range(args.fine_tune_epochs):
        train_loss = train_one_epoch(model, optimizer_ft, train_loader, device, epoch)
        val_loss = evaluate(model, val_loader, device)
        scheduler_ft.step()

        current_lr = optimizer_ft.param_groups[0]["lr"]
        print(f"  Val Loss: {val_loss:.4f} | LR: {current_lr:.2e}")

        if val_loss < best_val_loss:
            best_val_loss = val_loss
            save_path = output_dir / "dentex_frcnn_best.pth"
            torch.save(model.state_dict(), save_path)
            print(f"  [OK] New best model saved! (val_loss: {val_loss:.4f})")

    # Save final fine-tuned model
    finetuned_path = output_dir / "dentex_frcnn_finetuned.pth"
    torch.save(model.state_dict(), finetuned_path)
    print(f"\nFine-tuned model saved: {finetuned_path}")
    print(f"Best model (by val loss): {output_dir / 'dentex_frcnn_best.pth'} (loss: {best_val_loss:.4f})")

    # ─── Training Summary ──────────────────────────────────
    print(f"\n{'='*60}")
    print(f"Training Complete!")
    print(f"{'='*60}")
    print(f"  Best validation loss: {best_val_loss:.4f}")
    print(f"  Models saved in: {output_dir.resolve()}")
    print(f"  Files:")
    for f in output_dir.iterdir():
        if f.suffix == ".pth":
            size_mb = f.stat().st_size / (1024 * 1024)
            print(f"    {f.name}: {size_mb:.1f} MB")
    print(f"\nTo use the model in the backend, set MODEL_PATH={output_dir / 'dentex_frcnn_best.pth'}")


if __name__ == "__main__":
    main()
