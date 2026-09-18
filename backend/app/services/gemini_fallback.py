"""
Dentalyze Care Backend - Gemini Fallback Service
Uses Google's Gemini API as a fallback when the CNN model is unavailable.
"""

import json
import re
import logging
from typing import Optional
from app.config import get_settings

logger = logging.getLogger(__name__)

settings = get_settings()

# The same prompt from the original constants.ts, adapted for Python
DENTAL_ANALYSIS_PROMPT = """
Analyze the provided dental X-ray image in detail.
Output your analysis as a single, valid JSON object. Do not include any text outside of this JSON object, including markdown fences or any other explanatory text.
Crucially, ensure all property names (keys) in the JSON object are enclosed in double quotes.
All string values must be enclosed in double quotes. Any special characters within strings (like newlines, quotes, backslashes) MUST be properly escaped.

If an array (like "detectedConditions") contains multiple objects, ensure these objects are separated by commas.
Crucially, there must be NO trailing comma after the last element in an array.
Crucially, there must be NO trailing comma after the last key-value pair in an object.

The JSON object MUST conform to the following structure:
{
  "imageQuality": "string (Possible values: 'Good', 'Fair', 'Poor, blurry', 'Not a dental X-ray', 'Invalid image format or corrupted'. Describe the quality.)",
  "summary": "string (A brief overall summary.)",
  "detectedConditions": [
    {
      "conditionName": "string (MUST be one of: 'Dental Caries', 'Periodontal Disease', 'Periapical Abscess', 'Impacted Tooth', 'Deep Caries', 'No Significant Abnormalities')",
      "location": "string (e.g., 'Occlusal surface of tooth #14'. Use 'N/A' if conditionName is 'No Significant Abnormalities'.)",
      "severity": "string (e.g., 'Incipient', 'Moderate', 'Advanced'. Use 'N/A' if conditionName is 'No Significant Abnormalities'.)",
      "description": "string (Detailed description of the finding.)"
    }
  ],
  "recommendations": "string (General observations. Avoid direct medical advice.)"
}

Based on the visual evidence in the X-ray, identify and describe:
1. Dental Caries (Cavities) and Deep Caries
2. Periodontal Disease
3. Periapical Abscesses / Lesions
4. Impacted Teeth

Ensure the entire output is ONLY the JSON object as specified.
Do NOT include any disclaimer field or text in your JSON output.
Do NOT include any markdown formatting around the JSON output.
"""


async def analyze_with_gemini(image_base64: str, mime_type: str) -> dict:
    """
    Send the X-ray image to Google Gemini for analysis.
    Returns a ParsedAnalysisReport-compatible dictionary.
    """
    if not settings.GEMINI_API_KEY:
        raise RuntimeError("Gemini API key is not configured. Set GEMINI_API_KEY in .env")

    try:
        from google import genai

        client = genai.Client(api_key=settings.GEMINI_API_KEY)

        # Build the content with the image
        import base64
        image_bytes = base64.b64decode(image_base64)

        response = client.models.generate_content(
            model=settings.GEMINI_MODEL_NAME,
            contents=[
                {
                    "parts": [
                        {"text": DENTAL_ANALYSIS_PROMPT},
                        {
                            "inline_data": {
                                "mime_type": mime_type,
                                "data": image_base64,
                            }
                        },
                    ]
                }
            ],
        )

        result_text = response.text.strip()

        # Strip markdown fences if present
        match = re.match(r"^```(\w*)?\s*\n?(.*?)\n?\s*```$", result_text, re.DOTALL)
        if match:
            result_text = match.group(2).strip()

        # Remove trailing commas (common Gemini issue)
        result_text = re.sub(r",\s*([}\]])", r"\1", result_text)

        # Parse JSON
        report = json.loads(result_text)

        # Validate required fields
        if "detectedConditions" not in report:
            report["detectedConditions"] = []
        if "imageQuality" not in report:
            report["imageQuality"] = "Unknown"
        if "summary" not in report:
            report["summary"] = "Analysis completed."
        if "recommendations" not in report:
            report["recommendations"] = "Consult with a dental professional."

        return report

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse Gemini response as JSON: {e}")
        return {
            "imageQuality": "Unknown",
            "summary": "Analysis completed but the response could not be structured properly.",
            "detectedConditions": [],
            "recommendations": "Please try again or consult with a dental professional.",
        }
    except Exception as e:
        logger.error(f"Gemini API error: {e}")
        raise RuntimeError(f"Gemini analysis failed: {str(e)}")
