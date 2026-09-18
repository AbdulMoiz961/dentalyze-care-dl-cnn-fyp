"""
Dentalyze Care — Download and Prepare DENTEX Annotations

The DENTEX dataset annotation files are available from the official DENTEX
GitHub repository. This script helps download and prepare them for training.

Usage:
    python prepare_annotations.py --data_dir /path/to/Dental_Dataset_1104

If automatic download fails, follow the manual instructions printed.
"""

import os
import json
import argparse
from pathlib import Path

# DENTEX annotation download URLs (from the official repository)
DENTEX_ANNOTATION_URLS = {
    "train_quadrant_enumeration_disease": (
        "https://dsets.s3.amazonaws.com/dentex/train_quadrant_enumeration_disease.json"
    ),
}

# Alternative: Direct from HuggingFace (DENTEX challenge dataset)
HUGGINGFACE_URL = "https://huggingface.co/datasets/ibrahimhamamci/DENTEX/resolve/main"


def download_file(url: str, dest_path: str) -> bool:
    """Download a file from a URL."""
    try:
        import urllib.request

        print(f"  Downloading: {url}")
        print(f"  To: {dest_path}")
        urllib.request.urlretrieve(url, dest_path)
        print(f"  [OK] Downloaded successfully ({os.path.getsize(dest_path)} bytes)")
        return True
    except Exception as e:
        print(f"  [X] Download failed: {e}")
        return False


def validate_annotations(json_path: str) -> dict | None:
    """Validate that a JSON file has the expected DENTEX format."""
    try:
        with open(json_path, "r") as f:
            data = json.load(f)

        # Check required fields
        required_keys = ["images", "annotations"]
        for key in required_keys:
            if key not in data:
                print(f"  [X] Missing key: '{key}'")
                return None

        # Check for DENTEX-specific fields
        has_cat3 = "categories_3" in data
        has_catid3 = any("category_id_3" in ann for ann in data["annotations"][:5])

        print(f"  [OK] Valid annotation file:")
        print(f"    Images: {len(data['images'])}")
        print(f"    Annotations: {len(data['annotations'])}")
        print(f"    Has categories_3: {has_cat3}")
        print(f"    Has category_id_3: {has_catid3}")

        if has_cat3:
            print(f"    Disease categories:")
            for cat in data["categories_3"]:
                print(f"      {cat['id']}: {cat['name']}")

        return data

    except json.JSONDecodeError as e:
        print(f"  [X] Invalid JSON: {e}")
        return None
    except Exception as e:
        print(f"  [X] Error reading file: {e}")
        return None


def create_train_val_split(data: dict, output_dir: str, val_ratio: float = 0.2, seed: int = 42):
    """Create a separate validation annotation file from the training data."""
    import random

    random.seed(seed)

    # Get all image IDs that have annotations
    annotated_ids = list(set(ann["image_id"] for ann in data["annotations"]))
    random.shuffle(annotated_ids)

    split_idx = int(len(annotated_ids) * (1 - val_ratio))
    train_ids = set(annotated_ids[:split_idx])
    val_ids = set(annotated_ids[split_idx:])

    # Split annotations
    train_anns = [ann for ann in data["annotations"] if ann["image_id"] in train_ids]
    val_anns = [ann for ann in data["annotations"] if ann["image_id"] in val_ids]

    # Split images
    train_images = [img for img in data["images"] if img["id"] in train_ids]
    val_images = [img for img in data["images"] if img["id"] in val_ids]

    # Create validation JSON
    val_data = {
        "images": val_images,
        "annotations": val_anns,
    }

    # Copy categories
    for key in data:
        if key.startswith("categories"):
            val_data[key] = data[key]

    # Remap category_id_3 -> category_id for COCO eval compatibility
    for ann in val_data["annotations"]:
        if "category_id_3" in ann and "category_id" not in ann:
            ann["category_id"] = ann["category_id_3"]

    if "categories_3" in val_data and "categories" not in val_data:
        val_data["categories"] = val_data["categories_3"]

    val_path = os.path.join(output_dir, "val_quadrant_enumeration_disease.json")
    os.makedirs(output_dir, exist_ok=True)

    with open(val_path, "w") as f:
        json.dump(val_data, f)

    print(f"\n  [OK] Train/Val split created:")
    print(f"    Train: {len(train_images)} images, {len(train_anns)} annotations")
    print(f"    Val:   {len(val_images)} images, {len(val_anns)} annotations")
    print(f"    Val file: {val_path}")

    return val_data


def main():
    parser = argparse.ArgumentParser(description="Prepare DENTEX annotations for training")
    parser.add_argument(
        "--data_dir",
        type=str,
        required=True,
        help="Path to Dental_Dataset_1104 root directory",
    )
    parser.add_argument(
        "--create_val_split",
        action="store_true",
        default=True,
        help="Create a train/val split from the training annotations",
    )
    args = parser.parse_args()

    target_dir = os.path.join(
        args.data_dir,
        "training_data",
        "quadrant-enumeration-disease",
    )
    annotation_file = os.path.join(target_dir, "train_quadrant_enumeration_disease.json")

    print(f"\n{'='*60}")
    print("DENTEX Annotation Preparation")
    print(f"{'='*60}")

    # Check if annotation file already exists
    if os.path.exists(annotation_file):
        print(f"\n[OK] Annotation file found: {annotation_file}")
        data = validate_annotations(annotation_file)
        if data and args.create_val_split:
            val_dir = os.path.join(
                args.data_dir, "validation_data", "quadrant-enumeration-disease"
            )
            create_train_val_split(data, val_dir)
        return

    # Try to download
    print(f"\n[-] Annotation file NOT found at: {annotation_file}")
    print("\nAttempting to download from DENTEX sources...")

    os.makedirs(target_dir, exist_ok=True)
    downloaded = False

    for name, url in DENTEX_ANNOTATION_URLS.items():
        if download_file(url, annotation_file):
            downloaded = True
            break

    if not downloaded:
        # Try HuggingFace
        hf_url = f"{HUGGINGFACE_URL}/training_data/quadrant-enumeration-disease/train_quadrant_enumeration_disease.json"
        downloaded = download_file(hf_url, annotation_file)

    if downloaded:
        data = validate_annotations(annotation_file)
        if data and args.create_val_split:
            val_dir = os.path.join(
                args.data_dir, "validation_data", "quadrant-enumeration-disease"
            )
            create_train_val_split(data, val_dir)
    else:
        print(f"\n{'='*60}")
        print("MANUAL DOWNLOAD REQUIRED")
        print(f"{'='*60}")
        print()
        print("The annotation file could not be downloaded automatically.")
        print("Please download it manually from one of these sources:")
        print()
        print("1. DENTEX GitHub Repository:")
        print("   https://github.com/ibrahimethemhamamci/DENTEX")
        print()
        print("2. HuggingFace:")
        print("   https://huggingface.co/datasets/ibrahimhamamci/DENTEX")
        print()
        print("3. DENTEX Challenge Website:")
        print("   https://dentex.grand-challenge.org/")
        print()
        print(f"Place the file 'train_quadrant_enumeration_disease.json' at:")
        print(f"  {annotation_file}")
        print()
        print("The annotation file should be a JSON with 'images', 'annotations',")
        print("and 'categories_3' keys in COCO-like format.")


if __name__ == "__main__":
    main()
