import pytest
import httpx
import uuid

BASE_URL = "http://localhost:8000"


@pytest.fixture
def unique_email():
    return f"test_chat_{uuid.uuid4()}@example.com"


@pytest.fixture
def admin_email():
    return f"test_admin_{uuid.uuid4()}@example.com"


@pytest.fixture
def auth_header(unique_email):
    password = "password123"
    import time

    reg_resp = None
    for attempt in range(5):
        reg_resp = httpx.post(
            f"{BASE_URL}/auth/register",
            json={"email": unique_email, "password": password, "name": "Chat User"},
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

    reg_resp = None
    for attempt in range(5):
        reg_resp = httpx.post(
            f"{BASE_URL}/auth/register",
            json={
                "email": admin_email,
                "password": password,
                "name": "Admin User",
                "role": "admin",
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
        assert reg_resp.status_code == 200, (
            f"Admin registration failed: {reg_resp.status_code}"
        )

    login_resp = httpx.post(
        f"{BASE_URL}/auth/token",
        data={"username": admin_email, "password": password},
        timeout=30.0,
    )
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


class TestChatTicket:
    def test_create_chat_ticket(self, auth_header):
        payload = {
            "subject": "Live Chat Request",
            "priority": "high",
            "type": "chat",
            "messages": [
                {
                    "sender": "user",
                    "text": "I need help with my project",
                    "date": "2024-01-01",
                }
            ],
        }
        resp = httpx.post(f"{BASE_URL}/tickets", json=payload, headers=auth_header)
        assert resp.status_code == 200
        data = resp.json()
        assert data["subject"] == "Live Chat Request"
        assert data["type"] == "chat"
        assert data["priority"] == "high"

    def test_create_regular_ticket(self, auth_header):
        payload = {
            "subject": "Support Ticket",
            "priority": "medium",
            "type": "ticket",
            "messages": [
                {"sender": "user", "text": "I have a question", "date": "2024-01-01"}
            ],
        }
        resp = httpx.post(f"{BASE_URL}/tickets", json=payload, headers=auth_header)
        assert resp.status_code == 200
        data = resp.json()
        assert data["subject"] == "Support Ticket"
        assert data["type"] == "ticket"

    def test_list_all_tickets(self, auth_header):
        resp = httpx.get(f"{BASE_URL}/tickets", headers=auth_header)
        assert resp.status_code == 200
        tickets = resp.json()
        assert isinstance(tickets, list)

    def test_get_ticket_by_id(self, auth_header):
        create_resp = httpx.post(
            f"{BASE_URL}/tickets",
            json={"subject": "Test Ticket", "priority": "low", "messages": []},
            headers=auth_header,
        )
        assert create_resp.status_code == 200
        ticket_id = create_resp.json()["id"]

        resp = httpx.get(f"{BASE_URL}/tickets/{ticket_id}", headers=auth_header)
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == ticket_id


class TestChatReply:
    def test_reply_to_chat(self, auth_header):
        create_resp = httpx.post(
            f"{BASE_URL}/tickets",
            json={
                "subject": "Chat Thread",
                "priority": "medium",
                "messages": [
                    {"sender": "user", "text": "Initial message", "date": "2024-01-01"}
                ],
            },
            headers=auth_header,
        )
        assert create_resp.status_code == 200
        ticket_id = create_resp.json()["id"]

        reply_resp = httpx.post(
            f"{BASE_URL}/tickets/{ticket_id}/reply",
            json={"text": "This is a reply from user", "sender": "user"},
            headers=auth_header,
        )
        assert reply_resp.status_code == 200
        updated = reply_resp.json()
        assert len(updated["messages"]) == 2
        assert updated["messages"][1]["text"] == "This is a reply from user"

    def test_multiple_replies(self, auth_header):
        create_resp = httpx.post(
            f"{BASE_URL}/tickets",
            json={
                "subject": "Multi Reply Test",
                "priority": "low",
                "messages": [{"sender": "user", "text": "First", "date": "2024-01-01"}],
            },
            headers=auth_header,
        )
        ticket_id = create_resp.json()["id"]

        for i in range(3):
            reply_resp = httpx.post(
                f"{BASE_URL}/tickets/{ticket_id}/reply",
                json={"text": f"Reply {i + 1}", "sender": "user"},
                headers=auth_header,
            )
            assert reply_resp.status_code == 200

        get_resp = httpx.get(f"{BASE_URL}/tickets/{ticket_id}", headers=auth_header)
        assert len(get_resp.json()["messages"]) == 4


class TestChatStatus:
    def test_update_chat_status_open(self, auth_header):
        create_resp = httpx.post(
            f"{BASE_URL}/tickets",
            json={"subject": "Status Test", "priority": "medium", "messages": []},
            headers=auth_header,
        )
        ticket_id = create_resp.json()["id"]

        update_resp = httpx.put(
            f"{BASE_URL}/tickets/{ticket_id}",
            json={"status": "open"},
            headers=auth_header,
        )
        assert update_resp.status_code == 200
        assert update_resp.json()["status"] == "open"

    def test_update_chat_status_closed(self, auth_header):
        create_resp = httpx.post(
            f"{BASE_URL}/tickets",
            json={"subject": "Close Test", "priority": "medium", "messages": []},
            headers=auth_header,
        )
        ticket_id = create_resp.json()["id"]

        update_resp = httpx.put(
            f"{BASE_URL}/tickets/{ticket_id}",
            json={"status": "closed"},
            headers=auth_header,
        )
        assert update_resp.status_code == 200

    def test_update_priority(self, auth_header):
        create_resp = httpx.post(
            f"{BASE_URL}/tickets",
            json={"subject": "Priority Test", "priority": "low", "messages": []},
            headers=auth_header,
        )
        ticket_id = create_resp.json()["id"]

        update_resp = httpx.put(
            f"{BASE_URL}/tickets/{ticket_id}",
            json={"priority": "high"},
            headers=auth_header,
        )
        assert update_resp.status_code == 200
        assert update_resp.json()["priority"] == "high"


class TestChatDelete:
    def test_delete_chat(self, auth_header):
        create_resp = httpx.post(
            f"{BASE_URL}/tickets",
            json={"subject": "Delete Me", "priority": "low", "messages": []},
            headers=auth_header,
        )
        ticket_id = create_resp.json()["id"]

        delete_resp = httpx.delete(
            f"{BASE_URL}/tickets/{ticket_id}", headers=auth_header
        )
        assert delete_resp.status_code == 200

        get_resp = httpx.get(f"{BASE_URL}/tickets/{ticket_id}", headers=auth_header)
        assert get_resp.status_code == 404


class TestChatSequentialFlow:
    def test_full_chat_flow_user_to_admin(self, auth_header, admin_auth_header):
        user_resp = httpx.post(
            f"{BASE_URL}/tickets",
            json={
                "subject": "Need Help",
                "priority": "high",
                "type": "chat",
                "messages": [
                    {
                        "sender": "user",
                        "text": "Hello, I need help",
                        "date": "2024-01-01",
                    }
                ],
            },
            headers=auth_header,
        )
        assert user_resp.status_code == 200
        ticket_id = user_resp.json()["id"]

        admin_reply = httpx.post(
            f"{BASE_URL}/tickets/{ticket_id}/reply",
            json={"text": "How can I help you?", "sender": "admin"},
            headers=admin_auth_header,
        )
        assert admin_reply.status_code == 200

        user_reply = httpx.post(
            f"{BASE_URL}/tickets/{ticket_id}/reply",
            json={"text": "My project is not working", "sender": "user"},
            headers=auth_header,
        )
        assert user_reply.status_code == 200

        final = httpx.get(f"{BASE_URL}/tickets/{ticket_id}", headers=auth_header)
        messages = final.json()["messages"]
        assert len(messages) == 3
        assert messages[0]["text"] == "Hello, I need help"
        assert messages[1]["text"] == "How can I help you?"
        assert messages[1]["sender"] == "admin"
        assert messages[2]["text"] == "My project is not working"
