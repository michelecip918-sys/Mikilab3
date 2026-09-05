"""Backend tests for iter187 - Master-only governance via BakoMix."""
import os
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # Fallback local for container
    BASE_URL = "http://localhost:8001"
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@mikilab.de"
ADMIN_PASS = "Mikilab2026!"


@pytest.fixture(scope="module")
def anon_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def admin_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS})
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    tok = r.json().get("session_token")
    if tok:
        s.headers.update({"Authorization": f"Bearer {tok}"})
    return s


# --- Governance: auth guard ---
def test_govern_requires_admin(anon_client):
    r = anon_client.post(f"{API}/master/govern", json={"command_text": "Assegna la linea baguette ad Antonio", "lang": "it"})
    assert r.status_code == 401, f"Expected 401, got {r.status_code}: {r.text}"


# --- Governance: assign_leader ---
def test_assign_leader(admin_client):
    r = admin_client.post(f"{API}/master/govern",
                          json={"command_text": "Assegna la linea baguette ad Antonio", "lang": "it"})
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["intent"] == "assign_leader"
    assert data["executed"] is True
    assert data["state"]["leaders"].get("baguette") == "Antonio"
    assert isinstance(data.get("reply"), str) and len(data["reply"]) > 0

    # Verify via GET /plant/line-leaders
    r2 = admin_client.get(f"{API}/plant/line-leaders")
    assert r2.status_code == 200
    leaders = r2.json().get("leaders") or {}
    assert leaders.get("baguette") == "Antonio"


# --- Governance: remove_leader ---
def test_remove_leader(admin_client):
    r = admin_client.post(f"{API}/master/govern",
                          json={"command_text": "Togli il leader dalla linea baguette", "lang": "it"})
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["executed"] is True
    assert "baguette" not in (data["state"].get("leaders") or {})


# --- Governance: create_section / delete_section ---
def test_create_and_delete_section(admin_client):
    section_name = "Controllo Allergeni"
    # create
    r = admin_client.post(f"{API}/master/govern",
                          json={"command_text": f"Crea sezione {section_name}", "lang": "it"})
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["executed"] is True
    assert data["intent"] == "create_section"

    r2 = admin_client.get(f"{API}/master/sections")
    assert r2.status_code == 200
    secs = r2.json().get("sections") or []
    assert any(section_name.lower() in (s.get("name") or "").lower() for s in secs), f"Section not found: {secs}"

    # delete
    r3 = admin_client.post(f"{API}/master/govern",
                           json={"command_text": f"Elimina sezione {section_name}", "lang": "it"})
    assert r3.status_code == 200, r3.text
    d3 = r3.json()
    assert d3["executed"] is True
    assert d3["intent"] == "delete_section"

    r4 = admin_client.get(f"{API}/master/sections")
    secs2 = r4.json().get("sections") or []
    assert not any((s.get("name") or "").lower() == section_name.lower() for s in secs2)


# --- Governance: ambiguous command ---
def test_ambiguous_command(admin_client):
    r = admin_client.post(f"{API}/master/govern",
                          json={"command_text": "ciao", "lang": "it"})
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["intent"] == "unknown"
    assert data["executed"] is False
    assert isinstance(data.get("reply"), str) and len(data["reply"]) > 0
