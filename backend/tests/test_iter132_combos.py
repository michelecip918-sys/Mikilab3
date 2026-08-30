"""Iteration 132 — Laboratorio combos account sync (GET/POST sync/DELETE /api/combos)."""
import os
import re
from pathlib import Path

import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
base_url = os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")
if not base_url:
    raise RuntimeError("REACT_APP_BACKEND_URL missing")
BASE_URL = base_url.rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def creds():
    content = Path("/app/memory/test_credentials.md").read_text(encoding="utf-8")
    m = re.search(r"`(admin@mikilab\.de)`\s*/\s*`([^`]+)`", content)
    if not m:
        pytest.skip("admin credentials not found")
    return {"email": m.group(1), "password": m.group(2)}


@pytest.fixture(scope="module")
def token(creds):
    r = requests.post(f"{API}/auth/login", json=creds, timeout=30)
    if r.status_code != 200:
        pytest.fail(f"login failed {r.status_code}: {r.text[:300]}")
    tok = r.json().get("session_token")
    if not tok:
        pytest.fail("no session_token in login response")
    return tok


@pytest.fixture(scope="module")
def client(token):
    s = requests.Session()
    s.headers.update({"Authorization": f"Bearer {token}", "Content-Type": "application/json"})
    return s


# --- auth guard ---
class TestComboAuth:
    def test_get_requires_auth(self):
        assert requests.get(f"{API}/combos", timeout=30).status_code == 401

    def test_sync_requires_auth(self):
        r = requests.post(f"{API}/combos/sync", json={"combos": []}, timeout=30)
        assert r.status_code == 401

    def test_delete_requires_auth(self):
        assert requests.delete(f"{API}/combos/xyz", timeout=30).status_code == 401


# --- CRUD + persistence ---
class TestComboCrud:
    COMBO_ID = "TEST_c_iter132"

    def test_list_shape(self, client):
        r = client.get(f"{API}/combos")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        for c in data:
            assert "_id" not in c
            assert set(["id", "name", "items"]).issubset(c.keys())

    def test_sync_creates_and_get_persists(self, client):
        payload = {"combos": [{
            "id": self.COMBO_ID,
            "name": "TEST_Sync132",
            "items": [{"recipe_id": "r1", "name": "Pane", "qty": 10, "unit": "pezzi", "gpp": 80, "day": "", "start": False}],
        }]}
        r = client.post(f"{API}/combos/sync", json=payload)
        assert r.status_code == 200, r.text[:300]
        lst = r.json()
        assert isinstance(lst, list)
        mine = [c for c in lst if c["id"] == self.COMBO_ID]
        assert len(mine) == 1
        assert mine[0]["name"] == "TEST_Sync132"
        assert mine[0]["items"][0]["recipe_id"] == "r1"
        assert mine[0]["items"][0]["qty"] == 10

        # GET verifies DB persistence
        g = client.get(f"{API}/combos")
        assert g.status_code == 200
        got = [c for c in g.json() if c["id"] == self.COMBO_ID]
        assert len(got) == 1
        assert got[0]["items"][0]["name"] == "Pane"

    def test_sync_upsert_updates_no_duplicate(self, client):
        payload = {"combos": [{"id": self.COMBO_ID, "name": "TEST_Sync132_v2", "items": []}]}
        r = client.post(f"{API}/combos/sync", json=payload)
        assert r.status_code == 200
        mine = [c for c in r.json() if c["id"] == self.COMBO_ID]
        assert len(mine) == 1
        assert mine[0]["name"] == "TEST_Sync132_v2"
        assert mine[0]["items"] == []

    def test_sync_empty_returns_full_list(self, client):
        r = client.post(f"{API}/combos/sync", json={"combos": []})
        assert r.status_code == 200
        assert any(c["id"] == self.COMBO_ID for c in r.json())

    def test_sync_rejects_bad_payload(self, client):
        r = client.post(f"{API}/combos/sync", json={"combos": [{"name": "no id"}]})
        assert r.status_code == 422

    def test_delete_removes(self, client):
        d = client.delete(f"{API}/combos/{self.COMBO_ID}")
        assert d.status_code == 200
        assert d.json().get("success") is True
        g = client.get(f"{API}/combos")
        assert g.status_code == 200
        assert not any(c["id"] == self.COMBO_ID for c in g.json())

    def test_delete_unknown_is_idempotent(self, client):
        d = client.delete(f"{API}/combos/TEST_does_not_exist")
        assert d.status_code == 200
        assert d.json().get("success") is True


# --- isolation between users ---
class TestComboIsolation:
    def test_other_user_does_not_see_admin_combo(self, client):
        cid = "TEST_c_iso132"
        client.post(f"{API}/combos/sync", json={"combos": [{"id": cid, "name": "TEST_Iso", "items": []}]})
        r = requests.post(f"{API}/auth/login", json={"email": "fornaio@mikilab.de", "password": "Mikilab2026!"}, timeout=30)
        if r.status_code != 200:
            client.delete(f"{API}/combos/{cid}")
            pytest.skip("secondary user login unavailable")
        tok2 = r.json()["session_token"]
        g = requests.get(f"{API}/combos", headers={"Authorization": f"Bearer {tok2}"}, timeout=30)
        assert g.status_code == 200
        assert not any(c["id"] == cid for c in g.json())
        client.delete(f"{API}/combos/{cid}")


@pytest.fixture(scope="module", autouse=True)
def cleanup(client):
    yield
    for c in client.get(f"{API}/combos").json():
        if str(c.get("name", "")).startswith("TEST_") or str(c.get("id", "")).startswith("TEST_"):
            client.delete(f"{API}/combos/{c['id']}")
