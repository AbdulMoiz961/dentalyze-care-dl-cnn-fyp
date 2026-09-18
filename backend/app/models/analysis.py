"""
SQLAlchemy ORM Model - AnalysisHistory
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class AnalysisHistory(Base):
    __tablename__ = "analysis_history"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    patient_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("patients.id", ondelete="SET NULL"), nullable=True, index=True
    )
    image_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    image_base64: Mapped[str | None] = mapped_column(Text, nullable=True)
    image_mime_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    report_json: Mapped[dict] = mapped_column(JSON, nullable=False)
    analysis_method: Mapped[str] = mapped_column(
        String(20), default="cnn"  # "cnn" or "gemini"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    user = relationship("User", back_populates="analyses")
    patient = relationship("Patient", back_populates="analyses")
