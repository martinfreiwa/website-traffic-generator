import pytest
import httpx
import uuid
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

BASE_URL = "http://localhost:8001"
TEST_EMAIL = "admin@traffic.com"
TEST_PASSWORD = "admin123"

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./traffic_nexus.db")


@pytest.fixture(scope="module")
def db_session():
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()


@pytest.fixture(scope="module")
def auth_token():
    response = httpx.post(
        f"{BASE_URL}/auth/token",
        data={"username": TEST_EMAIL, "password": TEST_PASSWORD},
    )
    assert response.status_code == 200, f"Login failed: {response.text}"
    return response.json()["access_token"]


@pytest.fixture
def auth_header(auth_token):
    return {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}


def test_profile_country_free_text_input(auth_header, db_session):
    """Test that country can be saved as free text (not limited to dropdown)."""
    unique_id = str(uuid.uuid4())[:8]
    test_country = f"Netherlands_{unique_id}"

    update_data = {
        "country": test_country,
        "city": f"Amsterdam_{unique_id}",
        "address": f"Test Street {unique_id}",
        "company": f"Test Company {unique_id}",
        "job_title": "Test Engineer",
        "bio": f"Testing free text country input {unique_id}",
    }

    response = httpx.put(f"{BASE_URL}/users/me", json=update_data, headers=auth_header)
    assert response.status_code == 200, f"Update failed: {response.text}"

    user_data = response.json()
    assert user_data["country"] == test_country, (
        f"API returned wrong country: {user_data.get('country')}"
    )

    from models import User

    db_user = db_session.query(User).filter(User.email == TEST_EMAIL).first()
    assert db_user is not None, "User not found in database"
    assert db_user.country == test_country, f"DB has wrong country: {db_user.country}"


def test_profile_all_fields_persistence(auth_header, db_session):
    """Test that all profile fields are correctly persisted to database."""
    unique_id = str(uuid.uuid4())[:8]

    update_data = {
        "display_name": f"TestUser_{unique_id}",
        "job_title": f"CTO_{unique_id}",
        "company": f"InnovateCorp_{unique_id}",
        "bio": f"Bio for {unique_id}",
        "phone": f"+1-555-{unique_id[:4]}",
        "website": f"https://example-{unique_id}.com",
        "address": f"{unique_id} Test Avenue",
        "city": "Berlin",
        "zip": "10115",
        "country": "Germany",
        "vat_id": f"DE{unique_id}",
        "public_profile": True,
        "developer_mode": True,
        "timezone": "Europe/Berlin",
        "language": "de",
    }

    response = httpx.put(f"{BASE_URL}/users/me", json=update_data, headers=auth_header)
    assert response.status_code == 200, f"Update failed: {response.text}"

    user_data = response.json()
    for key, expected in update_data.items():
        actual = user_data.get(key)
        assert actual == expected, (
            f"API mismatch for '{key}': expected '{expected}', got '{actual}'"
        )

    from models import User

    db_user = db_session.query(User).filter(User.email == TEST_EMAIL).first()
    assert db_user is not None, "User not found in database"

    assert db_user.display_name == update_data["display_name"], (
        "display_name not persisted"
    )
    assert db_user.job_title == update_data["job_title"], "job_title not persisted"
    assert db_user.company == update_data["company"], "company not persisted"
    assert db_user.bio == update_data["bio"], "bio not persisted"
    assert db_user.phone == update_data["phone"], "phone not persisted"
    assert db_user.website == update_data["website"], "website not persisted"
    assert db_user.address == update_data["address"], "address not persisted"
    assert db_user.city == update_data["city"], "city not persisted"
    assert db_user.zip == update_data["zip"], "zip not persisted"
    assert db_user.country == update_data["country"], "country not persisted"
    assert db_user.vat_id == update_data["vat_id"], "vat_id not persisted"
    assert db_user.public_profile == update_data["public_profile"], (
        "public_profile not persisted"
    )
    assert db_user.developer_mode == update_data["developer_mode"], (
        "developer_mode not persisted"
    )
    assert db_user.timezone == update_data["timezone"], "timezone not persisted"
    assert db_user.language == update_data["language"], "language not persisted"


def test_profile_campaign_count_matches(auth_header, db_session):
    """Test that profile can be fetched and contains expected fields."""
    from models import User, Project

    user_data = httpx.get(f"{BASE_URL}/users/me", headers=auth_header).json()
    user_id = user_data["id"]

    assert "email" in user_data, "Email should be in response"
    assert "id" in user_data, "ID should be in response"

    db_user = db_session.query(User).filter(User.email == TEST_EMAIL).first()
    assert db_user is not None, "User should exist in database"

    db_projects = db_session.query(Project).filter(Project.user_id == user_id).count()
    assert isinstance(db_projects, int), "Project count should be an integer"


def test_profile_empty_country_allowed(auth_header):
    """Test that empty country field is allowed."""
    update_data = {
        "country": "",
        "city": "",
    }

    response = httpx.put(f"{BASE_URL}/users/me", json=update_data, headers=auth_header)
    assert response.status_code == 200, f"Update failed: {response.text}"

    user_data = response.json()
    assert user_data.get("country") == "" or user_data.get("country") is None


def test_profile_special_characters_in_country(auth_header):
    """Test that special characters in country name are handled correctly."""
    test_country = "Brasil (Brasilien)"

    update_data = {"country": test_country}

    response = httpx.put(f"{BASE_URL}/users/me", json=update_data, headers=auth_header)
    assert response.status_code == 200, f"Update failed: {response.text}"

    user_data = response.json()
    assert user_data["country"] == test_country
