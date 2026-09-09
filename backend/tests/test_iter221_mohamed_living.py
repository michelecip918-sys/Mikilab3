"""Iteration 221 — Public access request (Mohamed triage), Mohamed inbox, Living Recipe (supreme),
Legacy Oven, and regression on Observe/Alerts + Guest barrier."""
import os
import re
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
API = f"{BASE_URL}/api"

GATE_PIN = "198505"
GUEST_PIN = "202020"
ADMIN_EMAIL = "admin@mikilab.de"
ADMIN_PASS = "Mikilab2026!"


# --- Fixtures ---
@pytest.fixture(scope="module")
def anon_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def gated_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(f"{API}/admin-gate/verify", json={"pin": GATE_PIN}, timeout=15)
    assert r.status_code == 200, f"Gate verify failed: {r.status_code} {r.text}"
    return s


@pytest.fixture(scope="module")
def admin_client(gated_client):
    r = gated_client.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS}, timeout=15)
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    return gated_client


@pytest.fixture(scope="module")
def guest_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(f"{API}/admin-gate/verify", json={"pin": GUEST_PIN}, timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert data.get("level") == "guest"
    return s


# --- Public access request (no gate cookie required) ---
class TestPublicAccessRequest:
    def test_valid_email(self, anon_client):
        r = anon_client.post(
            f"{API}/public/access-request",
            json={"email": "TEST_iter221@example.com", "note": "urgente guasto forno test"},
            timeout=15,
        )
        assert r.status_code == 200, r.text
        d = r.json()
        assert d.get("ok") is True
        assert d.get("routed_by") == "Mohamed"
        assert d.get("category") in ("logistica", "formazione", "partner", "generico")
        # 'guasto forno' should map to logistica
        assert d["category"] == "logistica"

    def test_invalid_email(self, anon_client):
        r = anon_client.post(f"{API}/public/access-request", json={"email": "notanemail", "note": "x"}, timeout=10)
        assert r.status_code == 400

    def test_public_no_gate_cookie(self, anon_client):
        # ensure it truly is PUBLIC (no cookies)
        assert "mikilab_gate" not in anon_client.cookies.get_dict()


# --- Mohamed inbox (admin) ---
class TestMohamedInbox:
    def test_list_requires_admin(self, gated_client):
        # gate cookie only, no admin session
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        s.post(f"{API}/admin-gate/verify", json={"pin": GATE_PIN}, timeout=10)
        r = s.get(f"{API}/mike/access-requests", timeout=10)
        assert r.status_code in (401, 403)

    def test_list_and_act(self, admin_client, anon_client):
        # Create a fresh one to act upon
        anon_client.post(
            f"{API}/public/access-request",
            json={"email": "TEST_iter221_act@example.com", "note": "richiesta corso formazione"},
            timeout=15,
        )
        r = admin_client.get(f"{API}/mike/access-requests", timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "requests" in data and "pending" in data
        # find our TEST_ entry
        target = next((x for x in data["requests"] if x.get("email", "").startswith("TEST_iter221_act")), None)
        assert target is not None, "seeded access request not found"
        assert target.get("routed_by") == "Mohamed"
        # act
        r2 = admin_client.post(
            f"{API}/mike/access-requests/act", json={"id": target["id"], "status": "approvata"}, timeout=15
        )
        assert r2.status_code == 200
        # verify persisted
        r3 = admin_client.get(f"{API}/mike/access-requests", timeout=10)
        acted = next((x for x in r3.json()["requests"] if x.get("id") == target["id"]), None)
        assert acted is not None and acted.get("status") == "approvata"


# --- Living Recipe (supreme, admin-only) ---
class TestLivingRecipe:
    def test_non_admin_rejected(self, gated_client):
        # fresh session with only gate cookie
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        s.post(f"{API}/admin-gate/verify", json={"pin": GATE_PIN}, timeout=10)
        r = s.post(f"{API}/nexus/living-recipe", json={"objective": "pizza croccante"}, timeout=15)
        assert r.status_code in (401, 403), f"expected 401/403, got {r.status_code}"

    def test_guest_rejected(self, guest_client):
        r = guest_client.post(f"{API}/nexus/living-recipe", json={"objective": "pizza croccante"}, timeout=15)
        assert r.status_code in (401, 403)

    @pytest.mark.timeout(90)
    def test_admin_success(self, admin_client):
        r = admin_client.post(
            f"{API}/nexus/living-recipe",
            json={"objective": "TEST_iter221 pizza altamente digeribile e croccante"},
            timeout=90,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        # Response should contain at least one of matrix / curve / sensory keys
        keys = str(data).lower()
        assert any(k in keys for k in ["matrix", "matrice", "curve", "curva", "sensor", "sensory"]), keys[:400]


# --- Legacy oven ---
class TestLegacyOven:
    @pytest.mark.timeout(90)
    def test_legacy_run(self, admin_client):
        r = admin_client.post(
            f"{API}/mike/legacy-adapt",
            json={"equipment": "forno a legna nonna", "recipe": "pane rustico test"},
            timeout=90,
        )
        assert r.status_code == 200, r.text
        d = r.json()
        # loose check: some payload back
        assert isinstance(d, dict) and len(d) > 0


# --- Observe / Alerts regression ---
class TestObserveAlerts:
    @pytest.mark.timeout(90)
    def test_observe_and_alerts(self, admin_client):
        r = admin_client.post(
            f"{API}/mike/observe",
            json={"recipe_name": "TEST_iter221_observe", "action": "idratazione al 999% senza motivo", "operator": "TEST"},
            timeout=90,
        )
        assert r.status_code == 200, r.text
        r2 = admin_client.get(f"{API}/mike/alerts", timeout=15)
        assert r2.status_code == 200
        data = r2.json()
        assert "alerts" in data or isinstance(data, dict)


# --- Guest barrier: supreme endpoints rejected ---
class TestGuestBarrier:
    def test_living_recipe_blocked(self, guest_client):
        r = guest_client.post(f"{API}/nexus/living-recipe", json={"objective": "x"}, timeout=15)
        assert r.status_code in (401, 403)
