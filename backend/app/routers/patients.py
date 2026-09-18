"""
Dentalyze Care Backend - Patient Router
CRUD operations for dentist patient management.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.user import User
from app.models.patient import Patient
from app.schemas.patient import PatientCreate, PatientUpdate, PatientResponse
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/api/patients", tags=["Patients"])


def _require_dentist(user: User):
    """Raise 403 if the user is not a dentist."""
    if user.role != "dentist":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only dentists can manage patients.",
        )


@router.get("/", response_model=List[PatientResponse])
def list_patients(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all patients belonging to the current dentist."""
    _require_dentist(current_user)
    patients = db.query(Patient).filter(Patient.dentist_id == current_user.id).all()
    return [PatientResponse.model_validate(p) for p in patients]


@router.post("/", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
def create_patient(
    data: PatientCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new patient for the current dentist."""
    _require_dentist(current_user)

    patient = Patient(
        dentist_id=current_user.id,
        name=data.name,
        age=data.age,
        gender=data.gender,
        phone=data.phone,
        email=data.email,
        medical_notes=data.medical_notes,
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)

    return PatientResponse.model_validate(patient)


@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient(
    patient_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a specific patient by ID."""
    _require_dentist(current_user)

    patient = (
        db.query(Patient)
        .filter(Patient.id == patient_id, Patient.dentist_id == current_user.id)
        .first()
    )
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found.")

    return PatientResponse.model_validate(patient)


@router.put("/{patient_id}", response_model=PatientResponse)
def update_patient(
    patient_id: str,
    data: PatientUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update an existing patient's details."""
    _require_dentist(current_user)

    patient = (
        db.query(Patient)
        .filter(Patient.id == patient_id, Patient.dentist_id == current_user.id)
        .first()
    )
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found.")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(patient, field, value)

    db.commit()
    db.refresh(patient)

    return PatientResponse.model_validate(patient)


@router.delete("/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_patient(
    patient_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a patient and all their analysis records."""
    _require_dentist(current_user)

    patient = (
        db.query(Patient)
        .filter(Patient.id == patient_id, Patient.dentist_id == current_user.id)
        .first()
    )
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found.")

    db.delete(patient)
    db.commit()
