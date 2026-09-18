"""
SQLAlchemy ORM Model - Patient
"""

import uuid
from sqlalchemy import String, Integer, ForeignKey, Text, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Patient(Base):
    __tablename__ = "patients"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    dentist_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    age: Mapped[int | None] = mapped_column(Integer, nullable=True)
    gender: Mapped[str | None] = mapped_column(
        SAEnum("male", "female", "other", "prefer_not_to_say", name="gender_enum"),
        nullable=True,
    )
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    avatar_seed: Mapped[str] = mapped_column(
        String(255), default=lambda: str(uuid.uuid4())[:8]
    )
    medical_notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    dentist = relationship("User", back_populates="patients")
    analyses = relationship("AnalysisHistory", back_populates="patient", cascade="all, delete-orphan")
