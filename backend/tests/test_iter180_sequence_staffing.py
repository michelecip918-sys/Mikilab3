# ============================================================================
#  MIKILAB PRO & BakoMix AI — PROPRIETARY & CONFIDENTIAL
#  (c) 2026 MikiLab Pro. Tutti i diritti riservati / All rights reserved.
#  Unico proprietario legale: il Master. Sole legal owner: the Master.
#  Codice riservato: vietata copia, distribuzione, reverse engineering o
#  cloning non autorizzati. Unauthorized copying, distribution, reverse
#  engineering or cloning is strictly prohibited and actively tracked by
#  the BakoMix AI Security Guardian.
# ============================================================================
"""
Iteration 180 backend tests:
- Sequence Guard (POST /api/lab/sequence/start, /complete)
- Staffing (GET/PUT /api/lab/staffing) + absence-driven reduce_pct + pulse alert
Cleans up all changes at the end so the live app returns to baseline.
"""
import os
import pytest
import requests
from pymongo import MongoClient
from datetime import datetime, timezone

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@mikilab.de"
ADMIN_PASS = "Mikilab2026!"

# Direct mongo for cleanup
MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME")


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{API}/auth/login",
                      json={"email": ADMIN_EMAIL, "password": ADMIN_PASS}, timeout=15)
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    data = r.json()
    tok = data.get("session_token") or data.get("token") or data.get("access_token")
    assert tok, f"no token in login: {data}"
    return tok


@pytest.fixture(scope="module")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


@pytest.fixture(scope="module", autouse=True)
def cleanup_at_end(admin_headers):
    yield
    # Reset batches
    try:
        requests.put(f"{API}/lab/shift-state", headers=admin_headers,
                     json={"batches": []}, timeout=10)
    except Exception:
        pass
    # Reset staffing total to 5
    try:
        requests.put(f"{API}/lab/staffing", headers=admin_headers,
                     json={"total": 5}, timeout=10)
    except Exception:
        pass
    # Delete today's absences directly via mongo (no delete endpoint)
    try:
        if MONGO_URL and DB_NAME:
            c = MongoClient(MONGO_URL)
            today = datetime.now(timezone.utc).date().isoformat()
            c[DB_NAME].lab_absences.delete_many({"date": today})
            c.close()
    except Exception as e:
        print(f"cleanup absences error: {e}")


# ------------------------------ SEQUENCE ------------------------------
class TestSequenceGuard:
    def _seed(self, admin_headers):
        r = requests.put(f"{API}/lab/shift-state", headers=admin_headers,
                         json={"batches": [
                             {"id": "b1", "recipe_name": "Baguette", "status": ""},
                             {"id": "b2", "recipe_name": "Ciabatta", "status": ""},
                             {"id": "b3", "recipe_name": "Focaccia", "status": ""},
                         ]}, timeout=10)
        assert r.status_code == 200, r.text

    def test_full_sequence_flow(self, admin_headers):
        self._seed(admin_headers)

        # 1) Start b3 -> blocked, expected b1
        r = requests.post(f"{API}/lab/sequence/start", json={"batch_id": "b3"}, timeout=10)
        assert r.status_code == 200, r.text
        j = r.json()
        assert j.get("allowed") is False
        assert j.get("reason") == "out_of_sequence"
        assert j.get("expected", {}).get("id") == "b1"
        assert j.get("attempted", {}).get("id") == "b3"

        # 2) Start b1 -> allowed
        r = requests.post(f"{API}/lab/sequence/start", json={"batch_id": "b1"}, timeout=10)
        assert r.status_code == 200
        assert r.json().get("allowed") is True

        # verify status in_corso
        r = requests.get(f"{API}/lab/shift-state", timeout=10)
        assert r.status_code == 200
        b1 = next(b for b in r.json().get("batches", []) if b["id"] == "b1")
        assert (b1.get("status") or "").lower() == "in_corso"

        # 3) Complete b1
        r = requests.post(f"{API}/lab/sequence/complete", json={"batch_id": "b1"}, timeout=10)
        assert r.status_code == 200
        assert r.json().get("ok") is True

        r = requests.get(f"{API}/lab/shift-state", timeout=10)
        b1 = next(b for b in r.json().get("batches", []) if b["id"] == "b1")
        assert (b1.get("status") or "").lower() == "fatto"

        # 4) Start b2 -> allowed (advance)
        r = requests.post(f"{API}/lab/sequence/start", json={"batch_id": "b2"}, timeout=10)
        assert r.status_code == 200
        assert r.json().get("allowed") is True

    def test_force_bypass(self, admin_headers):
        self._seed(admin_headers)
        # Force start b3 out of order
        r = requests.post(f"{API}/lab/sequence/start",
                          json={"batch_id": "b3", "force": True}, timeout=10)
        assert r.status_code == 200
        j = r.json()
        assert j.get("allowed") is True
        assert j.get("forced") is True

    def test_unknown_batch_404(self, admin_headers):
        self._seed(admin_headers)
        r = requests.post(f"{API}/lab/sequence/start",
                         json={"batch_id": "does_not_exist"}, timeout=10)
        assert r.status_code == 404
        r = requests.post(f"{API}/lab/sequence/complete",
                         json={"batch_id": "does_not_exist"}, timeout=10)
        assert r.status_code == 404


# ------------------------------ STAFFING ------------------------------
class TestStaffing:
    def test_get_staffing_public(self):
        r = requests.get(f"{API}/lab/staffing", timeout=10)
        assert r.status_code == 200
        j = r.json()
        for k in ("total", "absent_today", "present", "factor", "reduce_pct"):
            assert k in j, f"missing {k} in {j}"
        assert isinstance(j["total"], int)

    def test_put_staffing_requires_admin(self):
        r = requests.put(f"{API}/lab/staffing", json={"total": 5}, timeout=10)
        assert r.status_code in (401, 403), f"anon PUT should be blocked, got {r.status_code}"

    def test_absence_reduces_factor_and_pulse_alert(self, admin_headers):
        # Set total=5
        r = requests.put(f"{API}/lab/staffing", headers=admin_headers,
                         json={"total": 5}, timeout=10)
        assert r.status_code == 200

        # Baseline: clean absences first
        if MONGO_URL and DB_NAME:
            c = MongoClient(MONGO_URL)
            today = datetime.now(timezone.utc).date().isoformat()
            c[DB_NAME].lab_absences.delete_many({"date": today})
            c.close()

        r = requests.get(f"{API}/lab/staffing", timeout=10)
        base = r.json()
        assert base["absent_today"] == 0
        assert base["factor"] == 1.0
        assert base["reduce_pct"] == 0

        # POST absence as admin
        r = requests.post(f"{API}/operator/absence", headers=admin_headers,
                         json={"kind": "malattia", "note": "TEST_iter180"}, timeout=15)
        assert r.status_code == 200, r.text

        # Now staffing should reflect 1 absence
        r = requests.get(f"{API}/lab/staffing", timeout=10)
        s = r.json()
        assert s["absent_today"] >= 1
        assert s["present"] == s["total"] - s["absent_today"]
        # total=5, 1 absence -> present=4, factor=0.8, reduce_pct=20
        assert s["total"] == 5
        assert s["present"] == 4
        assert s["factor"] == 0.8
        assert s["reduce_pct"] == 20

        # Pulse should contain staffing alert + staffing object
        r = requests.get(f"{API}/lab/pulse", timeout=15)
        assert r.status_code == 200
        p = r.json()
        assert "staffing" in p, "pulse missing staffing object"
        assert p["staffing"]["reduce_pct"] == 20
        alerts = p.get("alerts", [])
        staff_alert = next((a for a in alerts if a.get("code") == "staffing"), None)
        assert staff_alert, f"no staffing alert found in pulse alerts: {alerts}"
        assert staff_alert["level"] == "info"
        # text/suggestion should be dict with 6 languages
        txt = staff_alert.get("text")
        assert isinstance(txt, dict), f"text not multi-lang: {txt}"
        for lang in ("it", "de", "en", "es", "fr", "fa"):
            assert lang in txt, f"lang {lang} missing"

    def test_regression_pulse_endpoints(self):
        r = requests.get(f"{API}/lab/pulse", timeout=15)
        assert r.status_code == 200
        for k in ("mood", "heartbeat", "score", "alerts"):
            assert k in r.json()
        r = requests.get(f"{API}/lab/pulse/history", timeout=15)
        assert r.status_code == 200
