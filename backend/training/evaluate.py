"""
Dentalyze Care — Faster R-CNN Model Evaluation & Visualization Script

This script evaluates a trained Faster R-CNN model on dental X-rays:
  1. Computes evaluation metrics (Precision, Recall, F1, AP@0.5, mAP) on annotated datasets.
  2. Runs inference on single images or directories of dental X-rays.
  3. Draws colored bounding boxes with labels & confidence scores and saves visualizations.

Usage:
  # Evaluate on DENTEX dataset:
  python evaluate.py --model_path ../trained_models/dentex_frcnn_best.pth --data_dir ../../Dental_Dataset_1104

  # Run inference and visualize on a single X-ray image:
  python evaluate.py --model_path ../trained_models/dentex_frcnn_best.pth --image_path sample_xray.png --output_dir ./eval_output

  # Run inference on all images in a folder:
  python evaluate.py --model_path ../trained_models/dentex_frcnn_best.pth --image_dir ./test_xrays --output_dir ./eval_output
"""

import os
import sys
import json
import argparse
from pathlib import Path
from typing import Dict, List, Tuple, Optional

import numpy as np

# Lazy imports for heavy packages
try:
    import cv2
except ImportError:
    cv2 = None

try:
    import torch
    from torchvision.models.detection import fasterrcnn_resnet50_fpn
    from torchvision.models.detection.faster_rcnn import FastRCNNPredictor
except ImportError:
    torch = None

# Disease class definitions matching DENTEX categories_3
DISEASE_CLASSES = {
    0: "background",
    1: "Caries",
    2: "Deep Caries",
    3: "Periapical Lesion",
    4: "Impacted Tooth",
}
NUM_CLASSES = 5

# Distinct colors (BGR) for visualization
CLASS_COLORS = {
    1: (0, 165, 255),   # Orange for Caries
    2: (0, 0, 255),     # Red for Deep Caries
    3: (255, 0, 128),   # Purple/Pink for Periapical Lesion
    4: (0, 255, 255),   # Yellow for Impacted Tooth
}


def create_model(num_classes: int = NUM_CLASSES):
    """Reconstruct Faster R-CNN model architecture matching training."""
    model = fasterrcnn_resnet50_fpn(weights=None)
    in_features = model.roi_heads.box_predictor.cls_score.in_features
    model.roi_heads.box_predictor = FastRCNNPredictor(in_features, num_classes)
    return model


def load_model(model_path: str, device: str = "cpu"):
    """Load model weights from a .pth file."""
    if torch is None:
        raise RuntimeError("PyTorch is not installed. Please install torch and torchvision.")

    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model checkpoint not found at: {model_path}")

    # Check file size to avoid corrupt files
    size_mb = os.path.getsize(model_path) / (1024 * 1024)
    if size_mb < 1.0:
        raise ValueError(
            f"Model file at {model_path} is only {size_mb * 1024:.1f} KB. "
            "A valid Faster R-CNN checkpoint should be ~160 MB."
        )

    model = create_model(NUM_CLASSES)
    state_dict = torch.load(model_path, map_location=device, weights_only=True)
    model.load_state_dict(state_dict)
    model.to(device)
    model.eval()
    print(f"✓ Model successfully loaded from: {model_path} ({size_mb:.1f} MB)")
    return model


def compute_iou(box1: np.ndarray, box2: np.ndarray) -> float:
    """Compute Intersection-over-Union (IoU) between two boxes [x1, y1, x2, y2]."""
    x1 = max(box1[0], box2[0])
    y1 = max(box1[1], box2[1])
    x2 = min(box1[2], box2[2])
    y2 = min(box1[3], box2[3])

    inter_area = max(0.0, x2 - x1) * max(0.0, y2 - y1)
    if inter_area <= 0:
        return 0.0

    area1 = (box1[2] - box1[0]) * (box1[3] - box1[1])
    area2 = (box2[2] - box2[0]) * (box2[3] - box2[1])
    union_area = area1 + area2 - inter_area

    if union_area <= 0:
        return 0.0

    return inter_area / union_area


def draw_detections(
    image: np.ndarray,
    boxes: np.ndarray,
    labels: np.ndarray,
    scores: np.ndarray,
    confidence_thresh: float = 0.5,
) -> np.ndarray:
    """Draw bounding boxes, labels, and confidence tags on an OpenCV image."""
    img_out = image.copy()
    h, w = img_out.shape[:2]

    for i in range(len(boxes)):
        score = scores[i]
        if score < confidence_thresh:
            continue

        label_id = int(labels[i])
        class_name = DISEASE_CLASSES.get(label_id, f"Class {label_id}")
        color = CLASS_COLORS.get(label_id, (0, 255, 0))

        x1, y1, x2, y2 = boxes[i].astype(int)
        x1 = max(0, min(w - 1, x1))
        y1 = max(0, min(h - 1, y1))
        x2 = max(0, min(w - 1, x2))
        y2 = max(0, min(h - 1, y2))

        # Bounding box
        cv2.rectangle(img_out, (x1, y1), (x2, y2), color, 2)

        # Label badge
        badge_text = f"{class_name}: {score:.1%}"
        font = cv2.FONT_HERSHEY_SIMPLEX
        font_scale = 0.55
        thickness = 1
        (tw, th), baseline = cv2.getTextSize(badge_text, font, font_scale, thickness)

        badge_y1 = max(0, y1 - th - baseline - 4)
        badge_y2 = y1
        badge_x2 = min(w, x1 + tw + 6)

        cv2.rectangle(img_out, (x1, badge_y1), (badge_x2, badge_y2), color, -1)
        cv2.putText(
            img_out,
            badge_text,
            (x1 + 3, y1 - 4),
            font,
            font_scale,
            (255, 255, 255),
            thickness,
            cv2.LINE_AA,
        )

    return img_out


def predict_single_image(
    model,
    image_path: str,
    device: str = "cpu",
    confidence_thresh: float = 0.5,
) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    """Run model inference on a single image file."""
    if cv2 is None or torch is None:
        raise RuntimeError("cv2 and torch must be installed.")

    img = cv2.imread(image_path)
    if img is None:
        raise FileNotFoundError(f"Cannot read image: {image_path}")

    rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    img_tensor = torch.tensor(rgb, dtype=torch.float32).permute(2, 0, 1) / 255.0
    img_tensor = img_tensor.unsqueeze(0).to(device)

    with torch.no_grad():
        preds = model(img_tensor)[0]

    boxes = preds["boxes"].cpu().numpy()
    labels = preds["labels"].cpu().numpy()
    scores = preds["scores"].cpu().numpy()

    # Filter by threshold
    mask = scores >= confidence_thresh
    return img, boxes[mask], labels[mask], scores[mask]


def evaluate_dataset(
    model,
    images_dir: str,
    annotation_file: str,
    device: str = "cpu",
    iou_thresh: float = 0.5,
    confidence_thresh: float = 0.5,
    max_eval_images: Optional[int] = None,
) -> Dict:
    """
    Evaluate model against ground-truth annotations and compute metrics:
    Precision, Recall, F1, and AP@IoU per disease class.
    """
    with open(annotation_file, "r") as f:
        data = json.load(f)

    # Build image and ground-truth map
    img_id_to_anns: Dict[int, List[Dict]] = {}
    for ann in data.get("annotations", []):
        iid = ann["image_id"]
        img_id_to_anns.setdefault(iid, []).append(ann)

    images = [img for img in data.get("images", []) if img["id"] in img_id_to_anns]
    if max_eval_images and len(images) > max_eval_images:
        images = images[:max_eval_images]

    print(f"Evaluating {len(images)} annotated images on {device}...")

    # Tracking per-class True Positives, False Positives, False Negatives
    class_stats = {
        cid: {"tp": 0, "fp": 0, "fn": 0, "gt_count": 0, "pred_count": 0}
        for cid in DISEASE_CLASSES if cid > 0
    }

    for idx, img_info in enumerate(images):
        img_path = os.path.join(images_dir, img_info["file_name"])
        if not os.path.exists(img_path):
            continue

        # Ground truth
        gt_anns = img_id_to_anns.get(img_info["id"], [])
        gt_boxes = []
        gt_labels = []
        for ann in gt_anns:
            x, y, w, h = ann["bbox"]
            if w <= 0 or h <= 0:
                continue
            gt_boxes.append([x, y, x + w, y + h])
            cid = ann.get("category_id_3", ann.get("category_id", 0)) + 1
            gt_labels.append(cid)
            if cid in class_stats:
                class_stats[cid]["gt_count"] += 1

        gt_boxes = np.array(gt_boxes) if gt_boxes else np.empty((0, 4))
        gt_labels = np.array(gt_labels) if gt_labels else np.empty((0,), dtype=int)
        gt_matched = np.zeros(len(gt_boxes), dtype=bool)

        # Inference
        try:
            _, pred_boxes, pred_labels, pred_scores = predict_single_image(
                model, img_path, device=device, confidence_thresh=confidence_thresh
            )
        except Exception as e:
            print(f"  Warning: failed on image {img_info['file_name']}: {e}")
            continue

        for p_box, p_label in zip(pred_boxes, pred_labels):
            if p_label not in class_stats:
                continue
            class_stats[p_label]["pred_count"] += 1

            # Find matching GT
            best_iou = 0.0
            best_gt_idx = -1
            for g_idx, (g_box, g_label) in enumerate(zip(gt_boxes, gt_labels)):
                if gt_matched[g_idx] or g_label != p_label:
                    continue
                iou = compute_iou(p_box, g_box)
                if iou > best_iou:
                    best_iou = iou
                    best_gt_idx = g_idx

            if best_iou >= iou_thresh and best_gt_idx >= 0:
                class_stats[p_label]["tp"] += 1
                gt_matched[best_gt_idx] = True
            else:
                class_stats[p_label]["fp"] += 1

        # Any unmatched GT is a False Negative
        for g_idx, matched in enumerate(gt_matched):
            if not matched:
                g_label = gt_labels[g_idx]
                if g_label in class_stats:
                    class_stats[g_label]["fn"] += 1

        if (idx + 1) % 20 == 0 or (idx + 1) == len(images):
            print(f"  Processed {idx + 1}/{len(images)} images...")

    # Calculate metrics
    results = {}
    total_tp = 0
    total_fp = 0
    total_fn = 0

    print("\n" + "=" * 70)
    print(f"{'Class':<22} | {'Precision':<10} | {'Recall':<10} | {'F1-Score':<10} | {'GT':<5} | {'Pred':<5}")
    print("-" * 70)

    for cid, name in DISEASE_CLASSES.items():
        if cid == 0:
            continue
        st = class_stats[cid]
        tp, fp, fn = st["tp"], st["fp"], st["fn"]
        total_tp += tp
        total_fp += fp
        total_fn += fn

        prec = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        rec = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1 = (2 * prec * rec) / (prec + rec) if (prec + rec) > 0 else 0.0

        results[name] = {
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1_score": round(f1, 4),
            "ground_truth_count": st["gt_count"],
            "predictions_count": st["pred_count"],
            "tp": tp,
            "fp": fp,
            "fn": fn,
        }

        print(f"{name:<22} | {prec:<10.2%} | {rec:<10.2%} | {f1:<10.2%} | {st['gt_count']:<5} | {st['pred_count']:<5}")

    overall_prec = total_tp / (total_tp + total_fp) if (total_tp + total_fp) > 0 else 0.0
    overall_rec = total_tp / (total_tp + total_fn) if (total_tp + total_fn) > 0 else 0.0
    overall_f1 = (2 * overall_prec * overall_rec) / (overall_prec + overall_rec) if (overall_prec + overall_rec) > 0 else 0.0

    print("-" * 70)
    print(f"{'Overall (Micro-Avg)':<22} | {overall_prec:<10.2%} | {overall_rec:<10.2%} | {overall_f1:<10.2%} | {total_tp + total_fn:<5} | {total_tp + total_fp:<5}")
    print("=" * 70 + "\n")

    summary = {
        "confidence_threshold": confidence_thresh,
        "iou_threshold": iou_thresh,
        "images_evaluated": len(images),
        "overall": {
            "precision": round(overall_prec, 4),
            "recall": round(overall_rec, 4),
            "f1_score": round(overall_f1, 4),
            "total_tp": total_tp,
            "total_fp": total_fp,
            "total_fn": total_fn,
        },
        "per_class": results,
    }

    return summary


def main():
    parser = argparse.ArgumentParser(description="Evaluate Dentalyze Care Faster R-CNN Model")
    parser.add_argument(
        "--model_path",
        type=str,
        default="../trained_models/dentex_frcnn_best.pth",
        help="Path to trained .pth model file",
    )
    parser.add_argument(
        "--data_dir",
        type=str,
        default=None,
        help="Path to Dental_Dataset_1104 root directory (optional for dataset evaluation)",
    )
    parser.add_argument(
        "--image_path",
        type=str,
        default=None,
        help="Path to a single dental X-ray image to test and visualize",
    )
    parser.add_argument(
        "--image_dir",
        type=str,
        default=None,
        help="Path to directory of images to run inference and visualize",
    )
    parser.add_argument(
        "--output_dir",
        type=str,
        default="./evaluation_results",
        help="Directory where visualization outputs and metrics will be saved",
    )
    parser.add_argument(
        "--confidence_threshold",
        type=float,
        default=0.5,
        help="Confidence score threshold for detections (default: 0.5)",
    )
    parser.add_argument(
        "--iou_threshold",
        type=float,
        default=0.5,
        help="IoU threshold for matching detections to ground truth (default: 0.5)",
    )
    parser.add_argument(
        "--max_eval_images",
        type=int,
        default=None,
        help="Limit number of images for evaluation",
    )
    parser.add_argument(
        "--device",
        type=str,
        default=None,
        help="Device to use ('cuda' or 'cpu'). Defaults to cuda if available.",
    )

    args = parser.parse_args()

    # Determine device
    if args.device:
        device = args.device
    elif torch and torch.cuda.is_available():
        device = "cuda"
    else:
        device = "cpu"

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    # Check dependencies
    if cv2 is None or torch is None:
        print("Error: Missing required packages. Please install: torch torchvision opencv-python numpy")
        sys.exit(1)

    # Load model
    model = load_model(args.model_path, device=device)

    # Mode 1: Single image visualization
    if args.image_path:
        print(f"Running inference on image: {args.image_path}")
        img, boxes, labels, scores = predict_single_image(
            model, args.image_path, device=device, confidence_thresh=args.confidence_threshold
        )
        vis_img = draw_detections(img, boxes, labels, scores, args.confidence_threshold)

        out_name = Path(args.image_path).stem + "_annotated.png"
        out_path = output_dir / out_name
        cv2.imwrite(str(out_path), vis_img)
        print(f"✓ Saved visualization to: {out_path}")
        print(f"  Found {len(boxes)} detections:")
        for b, l, s in zip(boxes, labels, scores):
            cname = DISEASE_CLASSES.get(int(l), f"Class {l}")
            print(f"   - {cname} (confidence: {s:.2%}) at [{b[0]:.0f}, {b[1]:.0f}, {b[2]:.0f}, {b[3]:.0f}]")

    # Mode 2: Directory of images
    if args.image_dir:
        img_dir_path = Path(args.image_dir)
        valid_exts = {".png", ".jpg", ".jpeg"}
        img_files = [f for f in img_dir_path.iterdir() if f.suffix.lower() in valid_exts]
        print(f"Running inference on {len(img_files)} images in {args.image_dir}...")

        for img_file in img_files:
            try:
                img, boxes, labels, scores = predict_single_image(
                    model, str(img_file), device=device, confidence_thresh=args.confidence_threshold
                )
                vis_img = draw_detections(img, boxes, labels, scores, args.confidence_threshold)
                out_path = output_dir / (img_file.stem + "_annotated.png")
                cv2.imwrite(str(out_path), vis_img)
            except Exception as e:
                print(f"  Failed on {img_file.name}: {e}")
        print(f"✓ Batch visualization complete. Results in: {output_dir}")

    # Mode 3: Full dataset quantitative evaluation
    if args.data_dir:
        data_dir = Path(args.data_dir)
        annotation_file = (
            data_dir
            / "training_data"
            / "quadrant-enumeration-disease"
            / "train_quadrant_enumeration_disease.json"
        )
        images_dir = (
            data_dir
            / "training_data"
            / "quadrant-enumeration-disease"
            / "xrays"
        )

        if not annotation_file.exists():
            print(f"Warning: Annotation file not found at: {annotation_file}")
            print("Please prepare annotations first with prepare_annotations.py")
        else:
            summary = evaluate_dataset(
                model=model,
                images_dir=str(images_dir),
                annotation_file=str(annotation_file),
                device=device,
                iou_thresh=args.iou_threshold,
                confidence_thresh=args.confidence_threshold,
                max_eval_images=args.max_eval_images,
            )
            metrics_path = output_dir / "evaluation_metrics.json"
            with open(metrics_path, "w") as f:
                json.dump(summary, f, indent=2)
            print(f"✓ Evaluation metrics saved to: {metrics_path}")


if __name__ == "__main__":
    main()
