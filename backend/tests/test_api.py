"""
Dentalyze Care Backend - API Integration Tests

Tests:
  - Health check
  - User signup and login (both patient and dentist roles)
  - Profile retrieval and update
  - Patient CRUD for dentists
  - Role-based authorization controls
  - Analysis history retrieval and deletion
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.models  # Ensure models are loaded
from app.database import Base, get_db
from app.main import app

# In-memory SQLite database for test isolation
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def setup_database():
    """Create all tables before each test and drop them after."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    return TestClient(app)


# ─── Health Check ─────────────────────────────────────────────

def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "app" in data
    assert "cnn_model_loaded" in data


# ─── Authentication Tests ─────────────────────────────────────

def test_signup_dentist_success(client):
    response = client.post(
        "/api/auth/signup",
        json={
            "name": "Dr. Sarah Mitchell",
            "email": "sarah@dentalclinic.com",
            "password": "SecurePassword123!",
            "role": "dentist",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["name"] == "Dr. Sarah Mitchell"
    assert data["user"]["email"] == "sarah@dentalclinic.com"
    assert data["user"]["role"] == "dentist"


def test_signup_patient_success(client):
    response = client.post(
        "/api/auth/signup",
        json={
            "name": "John Doe",
            "email": "john@example.com",
            "password": "Password123!",
            "role": "patient",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["user"]["role"] == "patient"


def test_signup_duplicate_email(client):
    payload = {
        "name": "John Doe",
        "email": "duplicate@example.com",
        "password": "Password123!",
        "role": "patient",
    }
    res1 = client.post("/api/auth/signup", json=payload)
    assert res1.status_code == 201

    res2 = client.post("/api/auth/signup", json=payload)
    assert res2.status_code == 409
    assert "already exists" in res2.json()["detail"]


def test_login_success_and_wrong_password(client):
    # Signup
    client.post(
        "/api/auth/signup",
        json={
            "name": "Alice Smith",
            "email": "alice@example.com",
            "password": "CorrectPassword123",
            "role": "patient",
        },
    )

    # Valid login
    res_ok = client.post(
        "/api/auth/login",
        json={
            "email": "alice@example.com",
            "password": "CorrectPassword123",
            "role": "patient",
        },
    )
    assert res_ok.status_code == 200
    token = res_ok.json()["access_token"]
    assert token

    # Invalid login - wrong password
    res_err = client.post(
        "/api/auth/login",
        json={
            "email": "alice@example.com",
            "password": "WrongPassword!",
            "role": "patient",
        },
    )
    assert res_err.status_code == 401

    # Invalid login - wrong role
    res_err_role = client.post(
        "/api/auth/login",
        json={
            "email": "alice@example.com",
            "password": "CorrectPassword123",
            "role": "dentist",
        },
    )
    assert res_err_role.status_code == 403


def test_get_current_user_and_profile_update(client):
    # Signup
    signup_res = client.post(
        "/api/auth/signup",
        json={
            "name": "Dr. Smith",
            "email": "smith@dental.com",
            "password": "Password123!",
            "role": "dentist",
        },
    )
    token = signup_res.json()["access_token"]
    auth_headers = {"Authorization": f"Bearer {token}"}

    # /api/auth/me
    me_res = client.get("/api/auth/me", headers=auth_headers)
    assert me_res.status_code == 200
    assert me_res.json()["name"] == "Dr. Smith"

    # /api/auth/profile update
    update_res = client.put(
        "/api/auth/profile",
        headers=auth_headers,
        json={
            "name": "Dr. Sarah Smith, DDS",
            "company_name": "Apex Dental Clinic",
        },
    )
    assert update_res.status_code == 200
    assert update_res.json()["name"] == "Dr. Sarah Smith, DDS"
    assert update_res.json()["company_name"] == "Apex Dental Clinic"


# ─── Patient Management (CRUD) ────────────────────────────────

def test_dentist_patient_crud(client):
    # Create dentist
    dentist_res = client.post(
        "/api/auth/signup",
        json={
            "name": "Dr. Evans",
            "email": "evans@clinic.com",
            "password": "Password123!",
            "role": "dentist",
        },
    )
    token = dentist_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create Patient
    create_res = client.post(
        "/api/patients/",
        headers=headers,
        json={
            "name": "Robert Johnson",
            "age": 42,
            "gender": "male",
            "phone": "+1 555-0199",
            "email": "robert@example.com",
            "medical_notes": "Mild sensitivity on upper right molar.",
        },
    )
    assert create_res.status_code == 201
    patient_data = create_res.json()
    patient_id = patient_data["id"]
    assert patient_data["name"] == "Robert Johnson"
    assert patient_data["age"] == 42
    assert patient_data["medical_notes"] == "Mild sensitivity on upper right molar."

    # 2. List Patients
    list_res = client.get("/api/patients/", headers=headers)
    assert list_res.status_code == 200
    patients = list_res.json()
    assert len(patients) == 1
    assert patients[0]["id"] == patient_id

    # 3. Get Patient by ID
    get_res = client.get(f"/api/patients/{patient_id}", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["name"] == "Robert Johnson"

    # 4. Update Patient (e.g. medical notes)
    update_res = client.put(
        f"/api/patients/{patient_id}",
        headers=headers,
        json={"medical_notes": "Treated cavity on #3. Follow-up in 6 months."},
    )
    assert update_res.status_code == 200
    assert update_res.json()["medical_notes"] == "Treated cavity on #3. Follow-up in 6 months."

    # 5. Delete Patient
    delete_res = client.delete(f"/api/patients/{patient_id}", headers=headers)
    assert delete_res.status_code == 204

    # Verify deleted
    get_deleted = client.get(f"/api/patients/{patient_id}", headers=headers)
    assert get_deleted.status_code == 404


def test_patient_role_cannot_manage_patients(client):
    # Regular patient account
    patient_res = client.post(
        "/api/auth/signup",
        json={
            "name": "Regular User",
            "email": "user@test.com",
            "password": "Password123!",
            "role": "patient",
        },
    )
    token = patient_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Cannot create patient
    res = client.post(
        "/api/patients/",
        headers=headers,
        json={"name": "Forbidden Patient"},
    )
    assert res.status_code == 403


# ─── Analysis & History ───────────────────────────────────────

def test_analysis_history_endpoints(client):
    # Create user
    res = client.post(
        "/api/auth/signup",
        json={
            "name": "Dr. Adams",
            "email": "adams@test.com",
            "password": "Password123!",
            "role": "dentist",
        },
    )
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Initial history should be empty
    hist_res = client.get("/api/analysis/history", headers=headers)
    assert hist_res.status_code == 200
    data = hist_res.json()
    assert data["items"] == []
    assert data["total"] == 0

    # Mock CNN inference to test analysis pipeline
    from unittest.mock import patch

    mock_report = {
        "imageQuality": "Good diagnostic quality panoramic dental radiograph.",
        "summary": "1 condition detected: Dental Caries",
        "detectedConditions": [
            {
                "conditionName": "Dental Caries",
                "location": "Upper right first molar (tooth #3)",
                "severity": "Moderate",
                "description": "Coronal radiolucency observed.",
            }
        ],
        "recommendations": "Recommend clinical examination and restorative treatment.",
    }

    # 1x1 transparent PNG as base64
    sample_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="

    with patch("app.services.inference.is_model_loaded", return_value=True), \
         patch("app.services.inference.run_inference", return_value=mock_report):
        analyze_res = client.post(
            "/api/analysis/analyze",
            headers=headers,
            json={
                "imageBase64": sample_base64,
                "mimeType": "image/png",
            },
        )
        assert analyze_res.status_code == 200
        analyze_data = analyze_res.json()
        assert analyze_data["method"] == "cnn"
        assert len(analyze_data["report"]["detectedConditions"]) == 1
        analysis_id = analyze_data["analysisId"]

    # History should now have 1 item
    hist_res2 = client.get("/api/analysis/history", headers=headers)
    assert hist_res2.status_code == 200
    data2 = hist_res2.json()
    assert data2["total"] == 1
    assert data2["items"][0]["id"] == analysis_id

    # Get by ID
    get_single = client.get(f"/api/analysis/history/{analysis_id}", headers=headers)
    assert get_single.status_code == 200
    assert get_single.json()["id"] == analysis_id

    # Delete
    del_res = client.delete(f"/api/analysis/history/{analysis_id}", headers=headers)
    assert del_res.status_code == 204

    # Verify deleted
    get_deleted = client.get(f"/api/analysis/history/{analysis_id}", headers=headers)
    assert get_deleted.status_code == 404

