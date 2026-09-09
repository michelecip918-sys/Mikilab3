"""Iteration 220: guest gate + Mike observe/alerts ecosystem."""
import os
import time
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://edit-33.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@mikilab.de"
ADMIN_PW = "Mikilab2026!"
MASTER_PIN = "198505"
GUEST_PIN = "202020"


@pytest.fixture(scope="module")
def gate_master_session():
    s = requests.Session()
    r = s.post(f"{API}/admin-gate/verify", json={"pin": MASTER_PIN}, timeout=15)
    assert r.status_code == 200, r.text
    assert r.json().get("ok") is True
    assert r.json().get("level") == "master"
    return s


@pytest.fixture(scope="module")
def admin_session(gate_master_session):
    s = gate_master_session
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PW}, timeout=15)
    assert r.status_code == 200, r.text
    return s


# --- gate levels ------------------------------------------------------------
class TestAdminGateLevels:
    def test_master_pin(self):
        r = requests.post(f"{API}/admin-gate/verify", json={"pin": MASTER_PIN}, timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d["ok"] is True and d["level"] == "master"

    def test_guest_pin(self):
        r = requests.post(f"{API}/admin-gate/verify", json={"pin": GUEST_PIN}, timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d["ok"] is True and d["level"] == "guest"

    def test_bad_pin(self):
        # avoid rate limit: use one clearly wrong pin
        r = requests.post(f"{API}/admin-gate/verify", json={"pin": "000000"}, timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d["ok"] is False and d["level"] in (None, "null")

    def test_guest_put_requires_admin(self):
        # unauthenticated (no gate, no login)
        r = requests.put(f"{API}/admin-gate/guest", json={"pin": "202020"}, timeout=15)
        assert r.status_code in (401, 403)

    def test_guest_put_as_admin(self, admin_session):
        r = admin_session.put(f"{API}/admin-gate/guest", json={"pin": GUEST_PIN}, timeout=15)
        assert r.status_code == 200
        assert r.json().get("ok") is True


# --- mike observe / alerts --------------------------------------------------
class TestMikeEcosystem:
    def test_observe_requires_action(self, gate_master_session):
        r = gate_master_session.post(f"{API}/mike/observe", json={"action": ""}, timeout=15)
        assert r.status_code == 400

    def test_observe_anomaly_creates_alert(self, admin_session):
        # clear existing alerts first (marks read; alerts feed still ordered)
        admin_session.post(f"{API}/mike/alerts/read", timeout=15)
        before = admin_session.get(f"{API}/mike/alerts", timeout=15).json()
        before_count = len(before.get("alerts", []))

        payload = {
            "action": "Ho impastato a 32 gradi e saltato completamente la puntata e la lievitazione",
            "recipe_name": "TEST_pane_iter220",
            "operator": "TEST_operator",
            "lang": "it",
        }
        r = admin_session.post(f"{API}/mike/observe", json=payload, timeout=90)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "status" in data and "advice" in data
        # LLM may sometimes say ok; if so we cannot force alert. But we assert schema.
        if data["status"] == "anomalia" or data.get("alert_capo"):
            time.sleep(1)
            after = admin_session.get(f"{API}/mike/alerts", timeout=15).json()
            assert len(after["alerts"]) >= before_count + 1
            top = after["alerts"][0]
            assert top["action"] == payload["action"]
            assert top["recipe_name"] == payload["recipe_name"]

    def test_alerts_requires_admin(self, gate_master_session):
        # Fresh session with gate cookie only (no admin login)
        s = requests.Session()
        s.post(f"{API}/admin-gate/verify", json={"pin": MASTER_PIN}, timeout=15)
        r = s.get(f"{API}/mike/alerts", timeout=15)
        assert r.status_code in (401, 403)

    def test_alerts_read_marks_all(self, admin_session):
        r = admin_session.post(f"{API}/mike/alerts/read", timeout=15)
        assert r.status_code == 200
        assert r.json().get("ok") is True
        feed = admin_session.get(f"{API}/mike/alerts", timeout=15).json()
        assert feed.get("unread", 0) == 0


# --- cleanup ---------------------------------------------------------------
def test_zzz_cleanup(admin_session):
    # Nothing to hard-delete; alerts list is small in-memory feed. Just mark read.
    admin_session.post(f"{API}/mike/alerts/read", timeout=15)
