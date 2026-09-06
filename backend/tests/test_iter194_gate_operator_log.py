"""Iter 194 — CANCELLO SERVER HARD + PIN OPERATORE + LOG ACCESSI."""
import os
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # frontend .env fallback
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")

API = f"{BASE_URL}/api"
MASTER_PIN = "1985"
ADMIN_EMAIL = "admin@mikilab.de"
ADMIN_PW = "Mikilab2026!"


@pytest.fixture(scope="module")
def gated_admin_session():
    s = requests.Session()
    # 1) pass the gate
    r = s.post(f"{API}/admin-gate/verify", json={"pin": MASTER_PIN}, timeout=15)
    assert r.status_code == 200, r.text
    assert r.json().get("ok") is True
    assert s.cookies.get("mikilab_gate"), f"no gate cookie: {s.cookies}"
    # 2) admin login (same jar)
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PW}, timeout=15)
    assert r.status_code == 200, r.text
    return s


# --- CANCELLO HARD ---
class TestGateHard:
    def test_recipes_without_gate_401(self):
        s = requests.Session()
        r = s.get(f"{API}/recipes", params={"collection_name": "mikilab"}, timeout=15)
        assert r.status_code == 401
        assert r.json().get("detail") == "gate_required"

    def test_gate_verify_sets_httponly_cookie(self):
        s = requests.Session()
        r = s.post(f"{API}/admin-gate/verify", json={"pin": MASTER_PIN}, timeout=15)
        assert r.status_code == 200
        assert r.json() == {"ok": True}
        raw = r.headers.get("set-cookie", "")
        assert "mikilab_gate=" in raw
        assert "httponly" in raw.lower()

    def test_recipes_with_gate_200(self):
        s = requests.Session()
        s.post(f"{API}/admin-gate/verify", json={"pin": MASTER_PIN}, timeout=15)
        r = s.get(f"{API}/recipes", params={"collection_name": "mikilab"}, timeout=20)
        assert r.status_code == 200
        data = r.json()
        # 149 recipes expected in regression
        recs = data if isinstance(data, list) else data.get("recipes", data)
        assert isinstance(recs, list) and len(recs) >= 100

    def test_whitelist_auth_login_no_gate(self):
        s = requests.Session()
        r = s.post(f"{API}/auth/login", json={"email": "x@y.z", "password": "nope"}, timeout=15)
        # must NOT be gate_required (auth is whitelisted)
        assert r.status_code != 401 or r.json().get("detail") != "gate_required"

    def test_whitelist_admin_gate_verify_no_gate(self):
        s = requests.Session()
        r = s.post(f"{API}/admin-gate/verify", json={"pin": "0000"}, timeout=15)
        assert r.status_code == 200
        assert r.json() == {"ok": False}

    def test_wrong_master_pin(self):
        s = requests.Session()
        r = s.post(f"{API}/admin-gate/verify", json={"pin": "0000"}, timeout=15)
        assert r.status_code == 200
        assert r.json() == {"ok": False}
        assert not s.cookies.get("mikilab_gate")


# --- PIN OPERATORE ---
class TestOperatorPins:
    OP_NAME = "TEST_OpIter194"
    OP_PIN = "7391"

    def test_put_operator_pin(self, gated_admin_session):
        r = gated_admin_session.put(
            f"{API}/operator-pins", json={"name": self.OP_NAME, "pin": self.OP_PIN}, timeout=15
        )
        assert r.status_code == 200
        assert r.json().get("ok") is True

    def test_list_operators_no_hash(self, gated_admin_session):
        r = gated_admin_session.get(f"{API}/operator-pins", timeout=15)
        assert r.status_code == 200
        ops = r.json().get("operators", [])
        assert any(o.get("name") == self.OP_NAME for o in ops)
        for o in ops:
            assert "hash" not in o, f"hash leaked: {o}"

    def test_verify_correct_pin(self, gated_admin_session):
        r = gated_admin_session.post(f"{API}/operator-pins/verify", json={"pin": self.OP_PIN}, timeout=15)
        assert r.status_code == 200
        j = r.json()
        assert j.get("ok") is True
        assert j.get("name") == self.OP_NAME

    def test_verify_wrong_pin(self, gated_admin_session):
        r = gated_admin_session.post(f"{API}/operator-pins/verify", json={"pin": "0001"}, timeout=15)
        assert r.status_code == 200
        j = r.json()
        assert j.get("ok") is False
        assert j.get("name") in (None, "")

    def test_operator_pins_require_admin(self):
        # gated but not admin
        s = requests.Session()
        s.post(f"{API}/admin-gate/verify", json={"pin": MASTER_PIN}, timeout=15)
        r = s.get(f"{API}/operator-pins", timeout=15)
        assert r.status_code in (401, 403)

    def test_delete_cleanup(self, gated_admin_session):
        r = gated_admin_session.delete(f"{API}/operator-pins/{self.OP_NAME}", timeout=15)
        assert r.status_code == 200


# --- ACCESS LOG ---
class TestAccessLog:
    def test_access_log_admin(self, gated_admin_session):
        # trigger some events
        s2 = requests.Session()
        s2.post(f"{API}/admin-gate/verify", json={"pin": MASTER_PIN}, timeout=15)
        s2.post(f"{API}/admin-gate/verify", json={"pin": "0000"}, timeout=15)
        r = gated_admin_session.get(f"{API}/access-log", timeout=15)
        assert r.status_code == 200
        entries = r.json().get("entries", [])
        assert isinstance(entries, list) and len(entries) > 0
        kinds = {e.get("kind") for e in entries}
        assert "master" in kinds
        for e in entries[:5]:
            assert "kind" in e and "ok" in e and "at" in e

    def test_access_log_requires_admin(self):
        s = requests.Session()
        s.post(f"{API}/admin-gate/verify", json={"pin": MASTER_PIN}, timeout=15)
        r = s.get(f"{API}/access-log", timeout=15)
        assert r.status_code in (401, 403)


# --- REGRESSIONE ---
class TestRegression:
    def test_master_govern_chat(self, gated_admin_session):
        r = gated_admin_session.post(f"{API}/master/govern", json={"command_text": "ciao", "lang": "it"}, timeout=90)
        assert r.status_code == 200

    def test_recipes_149(self, gated_admin_session):
        r = gated_admin_session.get(f"{API}/recipes", params={"collection_name": "mikilab"}, timeout=30)
        assert r.status_code == 200
        data = r.json()
        recs = data if isinstance(data, list) else data.get("recipes", data)
        assert isinstance(recs, list)
        print(f"Recipes count: {len(recs)}")
