"""Iteration 76 — Magazzino (inventory) CRUD, Day-close (HACCP sync + stock decrement),
bundle checkout. Cleans up its own records at the end."""
import os
import re
import uuid
from pathlib import Path

import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
base_url = os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")
if not base_url:
    raise RuntimeError("REACT_APP_BACKEND_URL missing")
BASE_URL = base_url.rstrip("/")

TEST_LOT = "TEST-ML-ITER76"


@pytest.fixture(scope="session")
def creds():
    p = Path("/app/memory/test_credentials.md")
    if not p.exists():
        pytest.skip("no credentials file")
    c = p.read_text(encoding="utf-8")
    m = re.search(r"`(admin@[^`]+)`\s*/\s*`([^`]+)`", c)
    if not m:
        pytest.skip("admin creds not parsed")
    return {"email": m.group(1), "password": m.group(2)}


@pytest.fixture(scope="session")
def client(creds):
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(f"{BASE_URL}/api/auth/login", json=creds, timeout=60)
    if r.status_code != 200:
        pytest.fail(f"login failed {r.status_code}: {r.text[:300]}")
    tok = r.json().get("session_token")
    if not tok:
        pytest.fail(f"no session_token in login response: {r.text[:300]}")
    s.headers.update({"Authorization": f"Bearer {tok}"})
    return s


@pytest.fixture(scope="session")
def original_inventory(client):
    """Snapshot real inventory and restore it after the session."""
    r = client.get(f"{BASE_URL}/api/inventory", timeout=60)
    assert r.status_code == 200, r.text[:300]
    items = r.json().get("items", [])
    yield items
    client.put(f"{BASE_URL}/api/inventory", json={"items": items}, timeout=60)


# ---------------- Magazzino / inventory ----------------
class TestInventory:
    def test_get_inventory_shape(self, client, original_inventory):
        r = client.get(f"{BASE_URL}/api/inventory", timeout=60)
        assert r.status_code == 200
        body = r.json()
        assert isinstance(body.get("items"), list)
        assert "_id" not in str(body)

    def test_put_inventory_persists(self, client, original_inventory):
        payload = {"items": [
            {"name": "TEST_Farina 0", "category": "farina", "qty": 50, "unit": "kg"},
            {"name": "TEST_Lievito madre", "category": "lievito", "qty": 3.5, "unit": "kg"},
        ]}
        r = client.put(f"{BASE_URL}/api/inventory", json=payload, timeout=60)
        assert r.status_code == 200, r.text[:300]
        saved = r.json()["items"]
        assert len(saved) == 2
        assert all(i["id"] for i in saved)

        g = client.get(f"{BASE_URL}/api/inventory", timeout=60).json()["items"]
        by = {i["name"]: i for i in g}
        assert by["TEST_Farina 0"]["qty"] == 50
        assert by["TEST_Farina 0"]["unit"] == "kg"
        assert by["TEST_Lievito madre"]["qty"] == 3.5
        assert by["TEST_Lievito madre"]["category"] == "lievito"

    def test_inventory_requires_auth(self):
        r = requests.get(f"{BASE_URL}/api/inventory", timeout=60)
        assert r.status_code in (401, 403), r.status_code


# ---------------- Day close ----------------
class TestDayClose:
    def test_full_closure(self, client, original_inventory):
        # seed inventory
        client.put(f"{BASE_URL}/api/inventory", json={"items": [
            {"name": "TEST_Farina 0", "category": "farina", "qty": 50, "unit": "kg"},
            {"name": "TEST_Lievito madre", "category": "lievito", "qty": 3.5, "unit": "kg"},
        ]}, timeout=60)

        before = len(client.get(f"{BASE_URL}/api/haccp-logs", timeout=60).json())

        temps = [{"name": "Cella frigo", "temp_c": 4}, {"name": "Freezer", "temp_c": -18}]
        body = {
            "produced": [{"name": "TEST_Pane", "qty": 20, "unit": "pz"}],
            "consume": [{"name": "TEST_Farina 0", "qty": 30}],
            "temps": temps,
            "cleaning": {"Impastatrici": True, "Piani": True},
            "anomalies": "TEST anomaly",
            "operator": "QA Bot",
            "note": "iter76",
            "production_lot": TEST_LOT,
            "lang": "it",
        }
        r = client.post(f"{BASE_URL}/api/day-close", json=body, timeout=90)
        assert r.status_code == 200, r.text[:400]
        d = r.json()
        assert d["ok"] is True
        # decrement 50 -> 20
        ded = {x["name"]: x for x in d["deducted"]}
        assert "TEST_Farina 0" in ded, d["deducted"]
        assert ded["TEST_Farina 0"]["qty"] == 30
        assert ded["TEST_Farina 0"]["remaining"] == 20
        # haccp = temps + 1
        assert d["haccp_created"] == len(temps) + 1

        inv = {i["name"]: i for i in client.get(f"{BASE_URL}/api/inventory", timeout=60).json()["items"]}
        assert inv["TEST_Farina 0"]["qty"] == 20
        assert inv["TEST_Lievito madre"]["qty"] == 3.5

        logs = client.get(f"{BASE_URL}/api/haccp-logs", timeout=60).json()
        assert len(logs) == before + 3
        mine = [l for l in logs if l.get("lot") == TEST_LOT]
        assert len(mine) >= 3
        assert any(l.get("material") == "Cella frigo" and l.get("temp_c") == 4 for l in mine)
        assert any("Sanificazione" in (l.get("note") or "") and "Anomalie" in (l.get("note") or "") for l in mine)

        last = client.get(f"{BASE_URL}/api/day-close/last", timeout=60)
        assert last.status_code == 200
        lb = last.json()
        assert lb.get("production_lot") == TEST_LOT
        assert lb.get("operator") == "QA Bot"
        assert lb.get("haccp_created") == 3
        assert "_id" not in lb
        # NOTE (minor, reported): /api/day-close/last leaks internal owner_id
        if "owner_id" in lb:
            print("MINOR: /api/day-close/last exposes owner_id in response")

    def test_over_consume_clamps_at_zero(self, client, original_inventory):
        client.put(f"{BASE_URL}/api/inventory", json={"items": [
            {"name": "TEST_Farina 0", "category": "farina", "qty": 5, "unit": "kg"},
        ]}, timeout=60)
        r = client.post(f"{BASE_URL}/api/day-close", json={
            "consume": [{"name": "TEST_Farina 0", "qty": 99}],
            "temps": [], "cleaning": {}, "production_lot": TEST_LOT, "operator": "QA Bot"}, timeout=90)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        assert d["deducted"][0]["remaining"] == 0
        assert d["haccp_created"] == 0

    def test_fuzzy_name_match(self, client, original_inventory):
        client.put(f"{BASE_URL}/api/inventory", json={"items": [
            {"name": "TEST_Farina Tipo 0", "category": "farina", "qty": 10, "unit": "kg"},
        ]}, timeout=60)
        r = client.post(f"{BASE_URL}/api/day-close", json={
            "consume": [{"name": "TEST_Farina Tipo 0 Rossa", "qty": 4}],
            "temps": [], "cleaning": {}, "production_lot": TEST_LOT}, timeout=90)
        assert r.status_code == 200
        assert r.json()["deducted"][0]["remaining"] == 6

    def test_day_close_requires_auth(self):
        r = requests.post(f"{BASE_URL}/api/day-close", json={"temps": []}, timeout=60)
        assert r.status_code in (401, 403)


# ---------------- Bundle checkout ----------------
class TestBundleCheckout:
    def test_snack_bundle_returns_stripe_url(self, client):
        r = client.post(f"{BASE_URL}/api/recipes/bundle-checkout",
                        json={"bundle": "snack", "origin_url": BASE_URL}, timeout=90)
        assert r.status_code == 200, r.text[:400]
        d = r.json()
        assert isinstance(d.get("url"), str) and d["url"].startswith("https://checkout.stripe.com"), d
        assert d.get("session_id", "").startswith("cs_"), d


# ---------------- Cleanup ----------------
def test_zz_cleanup(client, original_inventory):
    logs = client.get(f"{BASE_URL}/api/haccp-logs", timeout=60).json()
    removed = 0
    for l in logs:
        if l.get("lot") == TEST_LOT:
            resp = client.delete(f"{BASE_URL}/api/haccp-logs/{l['id']}", timeout=60)
            assert resp.status_code in (200, 204, 404)
            removed += 1
    assert removed >= 3
    left = [l for l in client.get(f"{BASE_URL}/api/haccp-logs", timeout=60).json() if l.get("lot") == TEST_LOT]
    assert left == []
