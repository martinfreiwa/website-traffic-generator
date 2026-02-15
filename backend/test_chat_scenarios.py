import requests
import sys

BASE_URL = "http://localhost:8000"
EMAIL = "test_chat_user@example.com"
PASSWORD = "password123"

def print_step(msg):
    print(f"\n[STEP] {msg}")

def register_or_login():
    # Try login first
    print_step("Attempting Login...")
    resp = requests.post(f"{BASE_URL}/auth/token", data={"username": EMAIL, "password": PASSWORD})
    
    if resp.status_code == 200:
        print("Login successful.")
        return resp.json()["access_token"]
    
    # If login fails, try register
    print_step("Login failed (likely user doesn't exist). Attempting Register...")
    resp = requests.post(f"{BASE_URL}/auth/register", json={"email": EMAIL, "password": PASSWORD, "name": "Test Chat User"})
    
    if resp.status_code == 200:
        print("Registration successful.")
        # Now login
        resp = requests.post(f"{BASE_URL}/auth/token", data={"username": EMAIL, "password": PASSWORD})
        if resp.status_code == 200:
             return resp.json()["access_token"]
    
    print(f"Failed to authenticate. Status: {resp.status_code}, Body: {resp.text}")
    sys.exit(1)

def run_test():
    token = register_or_login()
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Create Ticket
    print_step("Creating Ticket...")
    ticket_payload = {
        "subject": "Test Chat Ticket",
        "priority": "medium",
        "messages": [
            {"id": "msg_1", "sender": "user", "text": "Initial message", "date": "2023-01-01"}
        ]
    }
    resp = requests.post(f"{BASE_URL}/tickets", json=ticket_payload, headers=headers)
    if resp.status_code != 200:
        print(f"Create Failed: {resp.text}")
        return
    
    ticket = resp.json()
    ticket_id = ticket["id"]
    print(f"Ticket Created: ID={ticket_id}, Subject={ticket['subject']}")
    
    # 2. Reply to Ticket
    print_step("Replying to Ticket...")
    reply_payload = {
        "text": "This is a reply from the test script.",
        "sender": "user" # Backend should override/verify this but passing it anyway
    }
    resp = requests.post(f"{BASE_URL}/tickets/{ticket_id}/reply", json=reply_payload, headers=headers)
    
    if resp.status_code != 200:
        print(f"Reply Failed: {resp.text}")
        return
    
    updated_ticket = resp.json()
    messages = updated_ticket.get("messages", [])
    print(f"Reply Success. Total Messages: {len(messages)}")
    
    # Verify last message
    last_msg = messages[-1]
    print(f"Last Message: Sender={last_msg.get('sender')}, Text='{last_msg.get('text')}'")
    
    if last_msg.get("text") == "This is a reply from the test script.":
        print("\n✅ TEST PASSED: Reply correctly appended.")
    else:
        print("\n❌ TEST FAILED: Last message text mismatch.")

    # 3. Fetch Ticket (Verify Persistence)
    print_step("Fetching Ticket List to verify persistence...")
    resp = requests.get(f"{BASE_URL}/tickets", headers=headers)
    if resp.status_code == 200:
        tickets = resp.json()
        found = any(t['id'] == ticket_id for t in tickets)
        if found:
            print("✅ Ticket found in list.")
        else:
            print("❌ Ticket NOT found in list.")

if __name__ == "__main__":
    try:
        run_test()
    except requests.exceptions.ConnectionError:
        print("\n❌ ERROR: Could not connect to backend. Is 'localhost:8000' running?")
