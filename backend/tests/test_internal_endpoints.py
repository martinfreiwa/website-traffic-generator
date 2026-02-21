import pytest
from fastapi.testclient import TestClient
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app
from database import engine, SessionLocal
import models

API_KEY = os.getenv("INTERNAL_API_KEY", "dev-internal-key-change-in-prod")
HEADERS = {"X-Internal-API-Key": API_KEY}


@pytest.fixture(scope="module")
def db():
    models.Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    yield db
    db.close()


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


class TestInternalEndpoints:
    def test_health_endpoint(self, client):
        response = client.get("/health")
        assert response.status_code == 200

    def test_internal_project_not_found(self, client):
        response = client.get(
            "/internal/project/nonexistent-id",
            headers=HEADERS,
        )
        assert response.status_code == 404

    def test_internal_project_unauthorized(self, client):
        response = client.get("/internal/project/test-id")
        assert response.status_code == 403

    def test_internal_traffic_log_unauthorized(self, client):
        response = client.post(
            "/internal/traffic-log",
            json={
                "project_id": "test",
                "url": "https://example.com",
                "event_type": "pageview",
                "status": "success",
            },
        )
        assert response.status_code == 403

    def test_internal_project_stats_unauthorized(self, client):
        response = client.post(
            "/internal/project-stats",
            json={"project_id": "test", "hits_increment": 1},
        )
        assert response.status_code == 403

    def test_internal_proxy_provider_unauthorized(self, client):
        response = client.get("/internal/proxy-provider")
        assert response.status_code == 403

    def test_internal_custom_proxies_unauthorized(self, client):
        response = client.get("/internal/custom-proxies")
        assert response.status_code == 403

    def test_internal_traffic_log_authorized(self, client, db):
        user = models.User(
            id="test-user-internal",
            email="internal-test@example.com",
            role="user",
            balance=1000,
        )
        db.add(user)
        db.commit()

        project = models.Project(
            id="test-project-internal",
            user_id=user.id,
            name="Test Internal Project",
            url="https://example.com",
            status="active",
            daily_limit=1000,
            plan_type="economy",
        )
        db.add(project)
        db.commit()

        response = client.post(
            "/internal/traffic-log",
            headers=HEADERS,
            json={
                "project_id": project.id,
                "url": "https://example.com/page",
                "event_type": "pageview",
                "status": "success",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"

        db.delete(project)
        db.delete(user)
        db.commit()

    def test_internal_project_stats_authorized(self, client, db):
        user = models.User(
            id="test-user-stats",
            email="stats-test@example.com",
            role="user",
            balance=1000,
            balance_economy=500,
        )
        db.add(user)
        db.commit()

        project = models.Project(
            id="test-project-stats",
            user_id=user.id,
            name="Test Stats Project",
            url="https://example.com",
            status="active",
            daily_limit=1000,
            total_hits=10,
            plan_type="economy",
        )
        db.add(project)
        db.commit()

        response = client.post(
            "/internal/project-stats",
            headers=HEADERS,
            json={
                "project_id": project.id,
                "hits_increment": 5,
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["total_hits"] == 15

        db.refresh(user)
        assert user.balance_economy == 495

        db.delete(project)
        db.delete(user)
        db.commit()

    def test_internal_custom_proxies_authorized(self, client, db):
        response = client.get(
            "/internal/custom-proxies",
            headers=HEADERS,
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_internal_proxy_provider_authorized(self, client, db):
        response = client.get(
            "/internal/proxy-provider",
            headers=HEADERS,
        )
        assert response.status_code == 200
        data = response.json()
        assert "active" in data
