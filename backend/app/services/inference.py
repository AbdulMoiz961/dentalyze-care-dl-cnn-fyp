"""
Dentalyze Care Backend - CNN Inference Service
Loads the trained Faster R-CNN model and runs inference on dental X-ray images.
"""

import io
import logging
from typing import Optional
from pathlib import Path

import numpy as np
from PIL import Image

logger = logging.getLogger(__name__)

# Lazy imports — torch/torchvision are heavy, only import when needed
_model = None
_device = None
_model_loaded = False

# Disease class mapping (matches the DENTEX dataset categories_3)
# Index 0 = background (implicit in Faster R-CNN)
DISEASE_CLASSES = {
    1: "Dental Caries",
    2: "Deep Caries",
    3: "Periapical Lesion",
    4: "Impacted Tooth",
}

# Map model class names to frontend-expected condition names
CONDITION_NAME_MAP = {
    "Dental Caries": "Dental Caries",
    "Deep Caries": "Dental Caries",  # Group deep caries under Dental Caries with severity
    "Periapical Lesion": "Periapical Abscess",
    "Impacted Tooth": "Impacted Tooth",
}

SEVERITY_MAP = {
    "Dental Caries": "Moderate",
    "Deep Caries": "Advanced",
    "Periapical Lesion": "Moderate",
    "Impacted Tooth": "Requires Evaluation",
}

COLOR_MAP = {
    "Dental Caries": "#F59E0B",      # Amber / Yellow
    "Deep Caries": "#EF4444",        # Red
    "Periapical Lesion": "#D946EF",  # Magenta / Purple
    "Periapical Abscess": "#D946EF", # Magenta / Purple
    "Impacted Tooth": "#06B6D4",     # Cyan / Blue
}


def load_model(model_path: str) -> bool:
    """
    Load the trained Faster R-CNN model from the given path.
    Returns True if successful, False otherwise.
    """
    global _model, _device, _model_loaded

    try:
        import torch
        import torchvision
        from torchvision.models.detection import fasterrcnn_resnet50_fpn
        from torchvision.models.detection.faster_rcnn import FastRCNNPredictor

        _device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        logger.info(f"Using device: {_device}")

        # Create model architecture (must match training config)
        num_classes = 5  # background + 4 disease classes
        model = fasterrcnn_resnet50_fpn(weights=None)
        in_features = model.roi_heads.box_predictor.cls_score.in_features
        model.roi_heads.box_predictor = FastRCNNPredictor(in_features, num_classes)

        # Load trained weights
        model_file = Path(model_path)
        if not model_file.exists():
            logger.warning(f"Model file not found at {model_path}. CNN inference will be unavailable.")
            _model_loaded = False
            return False

        state_dict = torch.load(model_path, map_location=_device, weights_only=True)
        model.load_state_dict(state_dict)
        model.to(_device)
        model.eval()

        _model = model
        _model_loaded = True
        logger.info(f"Successfully loaded model from {model_path}")
        return True

    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        _model_loaded = False
        return False


def is_model_loaded() -> bool:
    """Check if the CNN model is currently loaded and ready."""
    return _model_loaded


def preprocess_image(image_bytes: bytes) -> tuple["torch.Tensor", tuple[int, int], float]:
    """
    Preprocess a dental X-ray image for Faster R-CNN inference.
    - Open with PIL
    - Convert to RGB
    - Resize (maintaining aspect ratio, max 1024px)
    - Normalize to [0, 1] float tensor
    - Return as (tensor, (orig_w, orig_h), scale)
    """
    import torch

    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    orig_w, orig_h = image.size

    # Resize maintaining aspect ratio (max side = 1024)
    max_size = 1024
    scale = min(max_size / orig_w, max_size / orig_h, 1.0)
    if scale < 1.0:
        new_w, new_h = int(orig_w * scale), int(orig_h * scale)
        image = image.resize((new_w, new_h), Image.LANCZOS)

    # Convert to numpy, then to tensor
    img_array = np.array(image, dtype=np.float32) / 255.0
    tensor = torch.tensor(img_array).permute(2, 0, 1)  # [H, W, C] -> [C, H, W]

    return tensor, (orig_w, orig_h), scale


def validate_dental_xray(image_bytes: bytes) -> tuple[bool, str]:
    """
    Basic validation to check if the image looks like a dental X-ray.
    Returns (is_valid, quality_assessment).
    """
    try:
        image = Image.open(io.BytesIO(image_bytes))
        w, h = image.size

        # Check minimum size
        if w < 100 or h < 100:
            return False, "Invalid image format or corrupted"

        # Check if image is too small to be useful
        if w < 200 or h < 200:
            return True, "Poor, blurry"

        # Convert to grayscale to check contrast
        gray = image.convert("L")
        gray_array = np.array(gray)
        std_dev = np.std(gray_array)

        if std_dev < 10:
            return False, "Poor, blurry"

        return True, "Good"

    except Exception:
        return False, "Invalid image format or corrupted"


def run_inference(image_bytes: bytes, confidence_threshold: float = 0.3) -> dict:
    """
    Run CNN inference on an X-ray image.
    Returns a ParsedAnalysisReport-compatible dictionary.
    """
    import torch

    if not _model_loaded or _model is None:
        raise RuntimeError("CNN model is not loaded")

    # Validate image first
    is_valid, quality = validate_dental_xray(image_bytes)
    if not is_valid:
        return {
            "imageQuality": quality,
            "summary": f"The uploaded image appears to be: {quality}. Please upload a clear dental X-ray for analysis.",
            "detectedConditions": [],
            "recommendations": "Please upload a valid dental X-ray image for analysis.",
        }

    # Preprocess and run model
    input_tensor, (orig_w, orig_h), scale = preprocess_image(image_bytes)
    input_tensor = input_tensor.to(_device)

    with torch.no_grad():
        outputs = _model([input_tensor])[0]

    # Extract predictions above confidence threshold
    boxes = outputs["boxes"].cpu().numpy()
    labels = outputs["labels"].cpu().numpy()
    scores = outputs["scores"].cpu().numpy()

    # Filter by confidence
    mask = scores >= confidence_threshold
    boxes = boxes[mask]
    labels = labels[mask]
    scores = scores[mask]

    # Build detected conditions
    detected_conditions = []
    for i in range(len(labels)):
        class_id = int(labels[i])
        class_name = DISEASE_CLASSES.get(class_id, "Unknown")
        condition_name = CONDITION_NAME_MAP.get(class_name, class_name)
        severity = SEVERITY_MAP.get(class_name, "N/A")
        confidence = float(scores[i])

        # Rescale bounding box to original coordinates
        x1, y1, x2, y2 = boxes[i]
        orig_x1 = max(0.0, float(x1 / scale))
        orig_y1 = max(0.0, float(y1 / scale))
        orig_x2 = min(float(orig_w), float(x2 / scale))
        orig_y2 = min(float(orig_h), float(y2 / scale))

        cx = (orig_x1 + orig_x2) / 2
        cy = (orig_y1 + orig_y2) / 2

        # Simple quadrant-based location description
        h_pos = "left" if cx < orig_w / 2 else "right"
        v_pos = "upper" if cy < orig_h / 2 else "lower"
        location = f"{v_pos.capitalize()} {h_pos} region of the jaw"

        # Enhance severity for deep caries
        if class_name == "Deep Caries":
            severity = "Advanced"

        color = COLOR_MAP.get(class_name, COLOR_MAP.get(condition_name, "#3B82F6"))

        detected_conditions.append({
            "conditionName": condition_name,
            "location": location,
            "severity": f"{severity} (confidence: {confidence:.0%})",
            "description": f"AI model detected {class_name.lower()} in the {v_pos} {h_pos} region with {confidence:.0%} confidence.",
            "box": [round(orig_x1, 1), round(orig_y1, 1), round(orig_x2, 1), round(orig_y2, 1)],
            "confidence": round(confidence, 4),
            "classId": class_id,
            "color": color,
        })

    # Build summary
    if len(detected_conditions) == 0:
        summary = "No significant abnormalities detected among the analyzed conditions."
        detected_conditions.append({
            "conditionName": "No Significant Abnormalities",
            "location": "N/A",
            "severity": "N/A",
            "description": "The X-ray shows no visual evidence of dental caries, periapical lesions, or impacted teeth according to the AI analysis criteria.",
        })
        recommendations = "Regular dental check-ups are recommended."
    else:
        condition_names = list(set(c["conditionName"] for c in detected_conditions))
        summary = f"AI analysis detected {len(detected_conditions)} finding(s): {', '.join(condition_names)}. Professional clinical evaluation is recommended."
        recommendations = (
            "The AI analysis has identified potential dental conditions. "
            "Please consult with a qualified dental professional for clinical evaluation, "
            "as AI analysis is a screening tool and should not replace professional diagnosis."
        )

    return {
        "imageQuality": quality,
        "summary": summary,
        "detectedConditions": detected_conditions,
        "recommendations": recommendations,
        "imageDimensions": {"width": orig_w, "height": orig_h},
    }
