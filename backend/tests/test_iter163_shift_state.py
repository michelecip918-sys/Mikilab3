"""Iteration 163 — Lab shift-state (shared doc) + weekly-plan setup for RicettaDelGiorno."""
import os
import datetime

import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
base_url = os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")
if not base_url:
    raise RuntimeError("REACT_APP_BACKEND_URL missing")
BASE_URL = base_url.rstrip("/")

ADMIN = {"email": "admin@mikilab.de", "password": "Mikilab2026!"}
DAY_KEYS = ["dom", "lun", "mar", "mer", "gio", "ven", "sab"]


@pytest.fixture(scope="module")
def anon():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def admin_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(f"{BASE_URL}/api/auth/login", json=ADMIN, timeout=30)
    if r.status_code != 200:
        pytest.fail(f"Admin login failed {r.status_code}: {r.text[:300]}")
    token = r.json().get("session_token") or r.json().get("token") or r.json().get("access_token")
    if token:
        s.headers.update({"Authorization": f"Bearer {token}"})
    return s


DEFAULT_KEYS = ["work_mode", "batches", "bases", "machines_down", "cold_down", "cold_note", "shift_notes"]


# --- GET /api/lab/shift-state (anonymous) ---
class TestShiftStateGet:
    def test_get_anonymous_ok(self, anon):
        r = anon.get(f"{BASE_URL}/api/lab/shift-state", timeout=30)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        for k in DEFAULT_KEYS:
            assert k in d, f"missing key {k}"
        assert d["work_mode"] in ("continuo", "autonomia")
        assert isinstance(d["batches"], list)
        assert "_id" not in d and "_key" not in d


# --- PUT /api/lab/shift-state ---
class TestShiftStatePut:
    def test_put_anonymous_persists(self, anon):
        payload = {
            "work_mode": "autonomia",
            "batches": [{"id": "TEST_b1", "recipe_id": "r1", "recipe_name": "TEST_Focaccia",
                         "pieces": 10, "status": "precotto"}],
            "bases": [{"id": "TEST_base1", "product": "TEST_Base", "qty": 5, "unit": "pz", "kind": "base_pronta"}],
            "machines_down": [{"id": "m1", "name": "TEST_Impastatrice", "at": "2026-07-01T00:00:00Z"}],
            "cold_down": True,
            "cold_note": "TEST cella spenta",
            "shift_notes": [{"id": "n1", "text": "TEST nota turno", "kind": "guasto", "at": "2026-07-01T00:00:00Z"}],
        }
        r = anon.put(f"{BASE_URL}/api/lab/shift-state", json=payload, timeout=30)
        assert r.status_code == 200, r.text[:300]
        body = r.json()
        assert body["updated_at"], "updated_at not populated"
        assert body["work_mode"] == "autonomia"

        g = anon.get(f"{BASE_URL}/api/lab/shift-state", timeout=30)
        assert g.status_code == 200
        d = g.json()
        assert d["work_mode"] == "autonomia"
        assert d["cold_down"] is True
        assert d["cold_note"] == "TEST cella spenta"
        assert len(d["batches"]) == 1 and d["batches"][0]["status"] == "precotto"
        assert len(d["bases"]) == 1 and d["bases"][0]["product"] == "TEST_Base"
        assert len(d["machines_down"]) == 1 and d["machines_down"][0]["name"] == "TEST_Impastatrice"
        assert len(d["shift_notes"]) == 1 and d["shift_notes"][0]["text"] == "TEST nota turno"
        assert d["updated_at"]

    def test_shared_across_clients(self, anon, admin_client):
        """Same document visible to a different (authenticated) client."""
        anon.put(f"{BASE_URL}/api/lab/shift-state",
                 json={"work_mode": "continuo", "cold_down": False}, timeout=30)
        d = admin_client.get(f"{BASE_URL}/api/lab/shift-state", timeout=30).json()
        assert d["work_mode"] == "continuo"
        assert d["cold_down"] is False
        assert d["batches"] == [] and d["machines_down"] == []

    def test_put_invalid_type_rejected(self, anon):
        r = anon.put(f"{BASE_URL}/api/lab/shift-state",
                     json={"work_mode": "continuo", "batches": "not-a-list"}, timeout=30)
        assert r.status_code == 422, f"expected 422, got {r.status_code}"


# --- Weekly plan setup (needed by RicettaDelGiorno UI test) ---
class TestWeeklyPlanToday:
    def test_weekly_plan_requires_auth(self, anon):
        r = anon.get(f"{BASE_URL}/api/weekly-plan", timeout=30)
        assert r.status_code in (401, 403), f"got {r.status_code}"

    def test_seed_today_item(self, admin_client):
        recs = admin_client.get(f"{BASE_URL}/api/recipes?scope=mikilab", timeout=60)
        assert recs.status_code == 200, recs.text[:300]
        rlist = recs.json()
        assert isinstance(rlist, list) and len(rlist) > 0, "no mikilab recipes available"
        rec = rlist[0]
        rid = rec.get("id") or rec.get("recipe_id")
        day = DAY_KEYS[int(datetime.datetime.now().strftime("%w"))]
        payload = {"items": [{"id": "TEST_wp1", "day": day, "recipe_id": rid,
                             "recipe_name": rec.get("name") or rec.get("title") or "TEST_Recipe",
                             "pieces": 24}]}
        p = admin_client.put(f"{BASE_URL}/api/weekly-plan", json=payload, timeout=30)
        assert p.status_code == 200, p.text[:300]
        g = admin_client.get(f"{BASE_URL}/api/weekly-plan", timeout=30)
        assert g.status_code == 200
        items = g.json().get("items", [])
        assert any(i["id"] == "TEST_wp1" and i["day"] == day for i in items), items
        print(f"SEEDED weekly plan day={day} recipe_id={rid}")


@pytest.fixture(scope="module", autouse=True)
def cleanup(anon):
    yield
    anon.put(f"{BASE_URL}/api/lab/shift-state", json={"work_mode": "continuo"}, timeout=30)
