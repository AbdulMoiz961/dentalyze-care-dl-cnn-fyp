"""
Pydantic Schemas - Analysis
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class DetectedConditionReport(BaseModel):
    conditionName: str
    location: Optional[str] = None
    severity: Optional[str] = None
    description: str
    box: Optional[List[float]] = None  # [x1, y1, x2, y2]
    confidence: Optional[float] = None  # e.g. 0.97
    classId: Optional[int] = None
    color: Optional[str] = None  # Hex color for bounding box border and badge


class ImageDimensions(BaseModel):
    width: int
    height: int


class ParsedAnalysisReport(BaseModel):
    imageQuality: Optional[str] = None
    summary: Optional[str] = None
    detectedConditions: List[DetectedConditionReport] = []
    recommendations: Optional[str] = None
    imageDimensions: Optional[ImageDimensions] = None


class AnalyzeRequest(BaseModel):
    imageBase64: str
    mimeType: str = Field(..., pattern="^image/(jpeg|png|webp)$")
    patientId: Optional[str] = None
    useFallback: bool = False  # Force Gemini fallback


class AnalyzeResponse(BaseModel):
    report: ParsedAnalysisReport
    analysisId: str
    method: str  # "cnn" or "gemini"


class AnalysisHistoryResponse(BaseModel):
    id: str
    date: str
    imageMimeType: Optional[str] = None
    imageBase64: Optional[str] = None
    report: ParsedAnalysisReport
    patientId: Optional[str] = None
    method: str = "cnn"

    model_config = {"from_attributes": True}


class AnalysisHistoryListResponse(BaseModel):
    items: List[AnalysisHistoryResponse]
    total: int
    page: int
    per_page: int
