"""
Dentalyze Care Backend - Analysis Router
Handles X-ray analysis (CNN + Gemini fallback) and analysis history.
"""

import base64
import logging
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database import get_db
from app.models.user import User
from app.models.patient import Patient
from app.models.analysis import AnalysisHistory
from app.schemas.analysis import (
    AnalyzeRequest,
    AnalyzeResponse,
    AnalysisHistoryResponse,
    AnalysisHistoryListResponse,
    ParsedAnalysisReport,
)
from app.services.auth_service import get_current_user
from app.services import inference as cnn_service
from app.services.gemini_fallback import analyze_with_gemini
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

router = APIRouter(prefix="/api/analysis", tags=["Analysis"])


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_xray(
    data: AnalyzeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Analyze a dental X-ray image.
    Uses the CNN model by default, falls back to Gemini if:
    - CNN model is not loaded
    - useFallback is explicitly requested
    - CNN inference fails
    """
    # Validate patient ownership for dentists
    patient_id = data.patientId
    if patient_id and current_user.role == "dentist":
        patient = (
            db.query(Patient)
            .filter(Patient.id == patient_id, Patient.dentist_id == current_user.id)
            .first()
        )
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found or does not belong to you.",
            )

    # Decode image
    try:
        image_bytes = base64.b64decode(data.imageBase64)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid base64 image data.",
        )

    # Determine analysis method
    report = None
    method = "cnn"

    use_cnn = (
        settings.USE_CNN_MODEL
        and cnn_service.is_model_loaded()
        and not data.useFallback
    )

    if use_cnn:
        try:
            report = cnn_service.run_inference(image_bytes)
            method = "cnn"
            logger.info("Analysis completed using CNN model")
        except Exception as e:
            logger.warning(f"CNN inference failed, falling back to Gemini: {e}")
            use_cnn = False

    if not use_cnn or report is None:
        # Fallback to Gemini
        try:
            report = await analyze_with_gemini(data.imageBase64, data.mimeType)
            method = "gemini"
            logger.info("Analysis completed using Gemini fallback")
        except Exception as e:
            logger.error(f"Gemini fallback also failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Analysis failed: {str(e)}",
            )

    # Save to database
    history_entry = AnalysisHistory(
        user_id=current_user.id,
        patient_id=patient_id,
        image_base64=data.imageBase64,
        image_mime_type=data.mimeType,
        report_json=report,
        analysis_method=method,
    )
    db.add(history_entry)
    db.commit()
    db.refresh(history_entry)

    return AnalyzeResponse(
        report=ParsedAnalysisReport(**report),
        analysisId=history_entry.id,
        method=method,
    )


@router.get("/history", response_model=AnalysisHistoryListResponse)
def get_history(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    patient_id: str | None = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get paginated analysis history for the current user.
    Optionally filter by patient_id.
    """
    query = db.query(AnalysisHistory).filter(AnalysisHistory.user_id == current_user.id)

    if patient_id:
        query = query.filter(AnalysisHistory.patient_id == patient_id)

    total = query.count()
    items = (
        query.order_by(desc(AnalysisHistory.created_at))
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )

    history_items = []
    for item in items:
        history_items.append(
            AnalysisHistoryResponse(
                id=item.id,
                date=item.created_at.isoformat(),
                imageMimeType=item.image_mime_type,
                imageBase64=item.image_base64,
                report=ParsedAnalysisReport(**item.report_json),
                patientId=item.patient_id,
                method=item.analysis_method,
            )
        )

    return AnalysisHistoryListResponse(
        items=history_items,
        total=total,
        page=page,
        per_page=per_page,
    )


@router.get("/history/{analysis_id}", response_model=AnalysisHistoryResponse)
def get_analysis(
    analysis_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a specific analysis by ID."""
    item = (
        db.query(AnalysisHistory)
        .filter(
            AnalysisHistory.id == analysis_id,
            AnalysisHistory.user_id == current_user.id,
        )
        .first()
    )
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found.")

    return AnalysisHistoryResponse(
        id=item.id,
        date=item.created_at.isoformat(),
        imageMimeType=item.image_mime_type,
        imageBase64=item.image_base64,
        report=ParsedAnalysisReport(**item.report_json),
        patientId=item.patient_id,
        method=item.analysis_method,
    )


@router.delete("/history/{analysis_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_analysis(
    analysis_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a specific analysis from history."""
    item = (
        db.query(AnalysisHistory)
        .filter(
            AnalysisHistory.id == analysis_id,
            AnalysisHistory.user_id == current_user.id,
        )
        .first()
    )
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found.")

    db.delete(item)
    db.commit()
