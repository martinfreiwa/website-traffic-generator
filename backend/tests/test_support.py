import pytest
import httpx
import uuid
import os
import tempfile

BASE_URL = "http://localhost:8000"


@pytest.fixture
def unique_email():
    return f"test_support_{uuid.uuid4()}@example.com"


@pytest.fixture
def admin_email():
    return f"test_admin_support_{uuid.uuid4()}@example.com"


@pytest.fixture
def auth_header(unique_email):
    password = "password123"
    import time

    reg_resp = None
    for attempt in range(5):
        reg_resp = httpx.post(
            f"{BASE_URL}/auth/register",
            json={"email": unique_email, "password": password, "name": "Support User"},
            timeout=30.0,
        )
        if reg_resp.status_code == 429:
            time.sleep(5 * (attempt + 1))
            continue
        break

    if reg_resp and reg_resp.status_code == 400:
        pass
    elif reg_resp:
        assert reg_resp.status_code == 200, (
            f"Registration failed: {reg_resp.status_code} {reg_resp.text}"
        )

    login_resp = httpx.post(
        f"{BASE_URL}/auth/token",
        data={"username": unique_email, "password": password},
        timeout=30.0,
    )
    assert login_resp.status_code == 200, (
        f"Login failed: {login_resp.status_code} {login_resp.text}"
    )
    token = login_resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def admin_auth_header(admin_email):
    password = "admin123"
    import time
    import sqlite3

    reg_resp = None
    for attempt in range(5):
        reg_resp = httpx.post(
            f"{BASE_URL}/auth/register",
            json={
                "email": admin_email,
                "password": password,
                "name": "Admin Support",
            },
            timeout=30.0,
        )
        if reg_resp.status_code == 429:
            time.sleep(5 * (attempt + 1))
            continue
        break

    if reg_resp and reg_resp.status_code == 400:
        pass
    elif reg_resp:
        assert reg_resp.status_code == 200

    # Update user role to admin in database
    conn = sqlite3.connect("traffic_nexus.db")
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET role = 'admin' WHERE email = ?", (admin_email,))
    conn.commit()
    conn.close()

    login_resp = httpx.post(
        f"{BASE_URL}/auth/token",
        data={"username": admin_email, "password": password},
        timeout=30.0,
    )
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


class TestTicketCategory:
    def test_create_ticket_with_category(self, auth_header):
        payload = {
            "subject": "Billing Question",
            "priority": "high",
            "category": "billing",
            "messages": [
                {
                    "sender": "user",
                    "text": "I have a billing question",
                    "date": "2024-01-01",
                }
            ],
        }
        resp = httpx.post(f"{BASE_URL}/tickets", json=payload, headers=auth_header)
        assert resp.status_code == 200
        data = resp.json()
        assert data["category"] == "billing"

    def test_create_ticket_default_category(self, auth_header):
        payload = {
            "subject": "General Question",
            "priority": "low",
            "messages": [],
        }
        resp = httpx.post(f"{BASE_URL}/tickets", json=payload, headers=auth_header)
        assert resp.status_code == 200
        data = resp.json()
        assert data["category"] == "general"

    def test_filter_tickets_by_category(self, auth_header):
        payload = {
            "subject": "Technical Issue",
            "priority": "medium",
            "category": "technical",
            "messages": [],
        }
        resp = httpx.post(f"{BASE_URL}/tickets", json=payload, headers=auth_header)
        assert resp.status_code == 200

        resp = httpx.get(f"{BASE_URL}/tickets?category=technical", headers=auth_header)
        assert resp.status_code == 200
        tickets = resp.json()
        assert all(t["category"] == "technical" for t in tickets)


class TestTicketProjectAssociation:
    def test_create_ticket_with_project(self, auth_header):
        project_resp = httpx.post(
            f"{BASE_URL}/projects",
            json={
                "name": "Test Project for Ticket",
                "plan_type": "Custom",
                "settings": {},
            },
            headers=auth_header,
        )
        assert project_resp.status_code == 200
        project_id = project_resp.json()["id"]

        payload = {
            "subject": "Project Issue",
            "priority": "high",
            "project_id": project_id,
            "messages": [
                {
                    "sender": "user",
                    "text": "Issue with this project",
                    "date": "2024-01-01",
                }
            ],
        }
        resp = httpx.post(f"{BASE_URL}/tickets", json=payload, headers=auth_header)
        assert resp.status_code == 200
        data = resp.json()
        assert data["project_id"] == project_id
        assert data["project_name"] == "Test Project for Ticket"


class TestTicketSearch:
    def test_search_tickets_by_subject(self, auth_header):
        payload = {
            "subject": "Unique Search Term XYZ",
            "priority": "low",
            "messages": [],
        }
        resp = httpx.post(f"{BASE_URL}/tickets", json=payload, headers=auth_header)
        assert resp.status_code == 200

        resp = httpx.get(
            f"{BASE_URL}/tickets?search=Unique%20Search%20Term", headers=auth_header
        )
        assert resp.status_code == 200
        tickets = resp.json()
        assert len(tickets) >= 1
        assert any("Unique Search Term" in t["subject"] for t in tickets)

    def test_search_tickets_by_message_content(self, auth_header):
        payload = {
            "subject": "Another Ticket",
            "priority": "low",
            "messages": [
                {
                    "sender": "user",
                    "text": "This contains special message content ABC123",
                    "date": "2024-01-01",
                }
            ],
        }
        resp = httpx.post(f"{BASE_URL}/tickets", json=payload, headers=auth_header)
        assert resp.status_code == 200

        resp = httpx.get(f"{BASE_URL}/tickets?search=ABC123", headers=auth_header)
        assert resp.status_code == 200
        tickets = resp.json()
        assert len(tickets) >= 1


class TestTicketStatusFilter:
    def test_filter_tickets_by_status_open(self, auth_header):
        payload = {
            "subject": "Open Status Test",
            "priority": "low",
            "messages": [],
        }
        resp = httpx.post(f"{BASE_URL}/tickets", json=payload, headers=auth_header)
        assert resp.status_code == 200

        resp = httpx.get(f"{BASE_URL}/tickets?status=open", headers=auth_header)
        assert resp.status_code == 200
        tickets = resp.json()
        assert all(t["status"] == "open" for t in tickets)

    def test_filter_tickets_by_status_closed(self, auth_header):
        payload = {
            "subject": "To Be Closed",
            "priority": "low",
            "messages": [],
        }
        create_resp = httpx.post(
            f"{BASE_URL}/tickets", json=payload, headers=auth_header
        )
        ticket_id = create_resp.json()["id"]

        httpx.put(
            f"{BASE_URL}/tickets/{ticket_id}",
            json={"status": "closed"},
            headers=auth_header,
        )

        resp = httpx.get(f"{BASE_URL}/tickets?status=closed", headers=auth_header)
        assert resp.status_code == 200
        tickets = resp.json()
        assert all(t["status"] == "closed" for t in tickets)


class TestTicketClose:
    def test_user_can_close_own_ticket(self, auth_header):
        payload = {
            "subject": "User Close Test",
            "priority": "low",
            "messages": [],
        }
        create_resp = httpx.post(
            f"{BASE_URL}/tickets", json=payload, headers=auth_header
        )
        ticket_id = create_resp.json()["id"]

        close_resp = httpx.post(
            f"{BASE_URL}/tickets/{ticket_id}/close",
            headers=auth_header,
        )
        assert close_resp.status_code == 200
        assert close_resp.json()["status"] == "closed"

    def test_user_cannot_close_others_ticket(self, auth_header):
        other_email = f"other_user_{uuid.uuid4()}@example.com"
        httpx.post(
            f"{BASE_URL}/auth/register",
            json={"email": other_email, "password": "pass123", "name": "Other"},
        )
        login_resp = httpx.post(
            f"{BASE_URL}/auth/token",
            data={"username": other_email, "password": "pass123"},
        )
        other_token = login_resp.json()["access_token"]
        other_header = {"Authorization": f"Bearer {other_token}"}

        create_resp = httpx.post(
            f"{BASE_URL}/tickets",
            json={"subject": "Other User Ticket", "priority": "low", "messages": []},
            headers=other_header,
        )
        ticket_id = create_resp.json()["id"]

        close_resp = httpx.post(
            f"{BASE_URL}/tickets/{ticket_id}/close",
            headers=auth_header,
        )
        assert close_resp.status_code == 403

    def test_admin_can_close_any_ticket(self, auth_header, admin_auth_header):
        payload = {
            "subject": "Admin Close Test",
            "priority": "low",
            "messages": [],
        }
        create_resp = httpx.post(
            f"{BASE_URL}/tickets", json=payload, headers=auth_header
        )
        ticket_id = create_resp.json()["id"]

        close_resp = httpx.post(
            f"{BASE_URL}/tickets/{ticket_id}/close",
            headers=admin_auth_header,
        )
        assert close_resp.status_code == 200
        assert close_resp.json()["status"] == "closed"


class TestTicketAttachment:
    def test_create_ticket_with_attachments(self, auth_header):
        payload = {
            "subject": "Attachment Test",
            "priority": "medium",
            "attachment_urls": ["/static/test_file.pdf"],
            "messages": [
                {"sender": "user", "text": "See attached file", "date": "2024-01-01"}
            ],
        }
        resp = httpx.post(f"{BASE_URL}/tickets", json=payload, headers=auth_header)
        assert resp.status_code == 200
        data = resp.json()
        assert "/static/test_file.pdf" in data["attachment_urls"]

    def test_reply_with_attachments(self, auth_header):
        create_resp = httpx.post(
            f"{BASE_URL}/tickets",
            json={"subject": "Reply Attachment", "priority": "low", "messages": []},
            headers=auth_header,
        )
        ticket_id = create_resp.json()["id"]

        reply_resp = httpx.post(
            f"{BASE_URL}/tickets/{ticket_id}/reply",
            json={
                "text": "Here is my reply",
                "attachments": ["/static/reply_file.jpg"],
            },
            headers=auth_header,
        )
        assert reply_resp.status_code == 200
        messages = reply_resp.json()["messages"]
        assert len(messages) == 1
        assert "/static/reply_file.jpg" in messages[0]["attachments"]


class TestFileUpload:
    def test_upload_file(self, auth_header):
        with tempfile.NamedTemporaryFile(suffix=".txt", delete=False) as f:
            f.write(b"Test file content for upload")
            f.flush()
            file_path = f.name

        try:
            with open(file_path, "rb") as f:
                resp = httpx.post(
                    f"{BASE_URL}/tickets/upload",
                    files={"file": ("test_upload.txt", f, "text/plain")},
                    headers=auth_header,
                )
            assert resp.status_code == 200
            data = resp.json()
            assert "url" in data
            assert "filename" in data
            assert data["filename"] == "test_upload.txt"
            assert "/static/ticket_attachments/" in data["url"]
        finally:
            os.unlink(file_path)

    def test_upload_requires_auth(self):
        with tempfile.NamedTemporaryFile(suffix=".txt", delete=False) as f:
            f.write(b"Test file")
            f.flush()
            file_path = f.name

        try:
            with open(file_path, "rb") as f:
                resp = httpx.post(
                    f"{BASE_URL}/tickets/upload",
                    files={"file": ("test.txt", f, "text/plain")},
                )
            assert resp.status_code == 401
        finally:
            os.unlink(file_path)


class TestTicketUpdateCategory:
    def test_update_ticket_category(self, auth_header):
        create_resp = httpx.post(
            f"{BASE_URL}/tickets",
            json={"subject": "Category Update Test", "priority": "low", "messages": []},
            headers=auth_header,
        )
        ticket_id = create_resp.json()["id"]

        update_resp = httpx.put(
            f"{BASE_URL}/tickets/{ticket_id}",
            json={"category": "sales"},
            headers=auth_header,
        )
        assert update_resp.status_code == 200
        assert update_resp.json()["category"] == "sales"


class TestCombinedFilters:
    def test_filter_by_status_and_category(self, auth_header):
        httpx.post(
            f"{BASE_URL}/tickets",
            json={
                "subject": "Billing Open",
                "priority": "low",
                "category": "billing",
                "messages": [],
            },
            headers=auth_header,
        )

        resp = httpx.get(
            f"{BASE_URL}/tickets?status=open&category=billing",
            headers=auth_header,
        )
        assert resp.status_code == 200
        tickets = resp.json()
        for t in tickets:
            assert t["status"] == "open"
            assert t["category"] == "billing"
