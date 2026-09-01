import os
import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
base_url = os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")
if not base_url:
    raise RuntimeError("REACT_APP_BACKEND_URL missing")
BASE_URL = base_url.rstrip("/") + "/api"


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# --- /api/lab/fault-log (anonymous access) ---
class TestFaultLog:
    def test_get_anonymous(self, client):
        r = client.get(f"{BASE_URL}/lab/fault-log", timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert isinstance(data, list)
        for item in data:
            assert "_id" not in item

    def test_post_creates_entry_with_id_and_at(self, client):
        payload = {"type": "macchina", "name": "TEST_Impastatrice QA", "note": "TEST_nota guasto"}
        r = client.post(f"{BASE_URL}/lab/fault-log", json=payload, timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["id"] and isinstance(d["id"], str)
        assert d["at"]
        assert d["name"] == payload["name"]
        assert d["type"] == "macchina"
        assert "_id" not in d

        # GET verifies persistence + desc order by 'at'
        g = client.get(f"{BASE_URL}/lab/fault-log", timeout=30)
        assert g.status_code == 200
        entries = g.json()
        ids = [e["id"] for e in entries]
        assert d["id"] in ids
        ats = [e.get("at") or "" for e in entries]
        assert ats == sorted(ats, reverse=True), "fault-log not sorted desc by at"
        # newest first
        assert entries[0]["id"] == d["id"]

    def test_post_cella_type_defaults(self, client):
        r = client.post(f"{BASE_URL}/lab/fault-log", json={"type": "cella", "name": "TEST_Cella QA"}, timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert d["type"] == "cella"
        assert d["note"] == ""


# --- /api/lab/shift-state ---
class TestShiftState:
    def test_get_shape(self, client):
        r = client.get(f"{BASE_URL}/lab/shift-state", timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        for k in ["work_mode", "batches", "bases", "machines_down", "cold_down", "shift_notes"]:
            assert k in d
        assert "_id" not in d

    def test_put_and_persist_autonomy(self, client):
        payload = {
            "work_mode": "autonomia",
            "batches": [{"id": "TEST_b1", "recipe_name": "TEST_Ciabatta", "pieces": 30,
                         "status": "in_cella", "updated_at": "2026-07-01T02:00:00Z"}],
            "bases": [], "machines_down": [], "cold_down": False, "cold_note": "", "shift_notes": [],
        }
        r = client.put(f"{BASE_URL}/lab/shift-state", json=payload, timeout=30)
        assert r.status_code == 200, r.text
        assert r.json()["work_mode"] == "autonomia"

        g = client.get(f"{BASE_URL}/lab/shift-state", timeout=30)
        d = g.json()
        assert d["work_mode"] == "autonomia"
        assert len(d["batches"]) == 1
        assert d["batches"][0]["status"] == "in_cella"

    def test_put_invalid_type_422(self, client):
        r = client.put(f"{BASE_URL}/lab/shift-state", json={"batches": "notalist"}, timeout=30)
        assert r.status_code == 422, r.status_code

    def test_reset_continuo(self, client):
        r = client.put(f"{BASE_URL}/lab/shift-state", json={"work_mode": "continuo"}, timeout=30)
        assert r.status_code == 200
        assert client.get(f"{BASE_URL}/lab/shift-state", timeout=30).json()["work_mode"] == "continuo"
