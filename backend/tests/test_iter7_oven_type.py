# ============================================================================
#  MIKILAB PRO & BakoMix AI — PROPRIETARY & CONFIDENTIAL
#  (c) 2026 MikiLab Pro. Tutti i diritti riservati / All rights reserved.
#  Unico proprietario legale: il Master. Sole legal owner: the Master.
#  Codice riservato: vietata copia, distribuzione, reverse engineering o
#  cloning non autorizzati. Unauthorized copying, distribution, reverse
#  engineering or cloning is strictly prohibited and actively tracked by
#  the BakoMix AI Security Guardian.
# ============================================================================
"""Iteration 7: oven_type field on oven profiles + weekly plan pieces link."""
import os
import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
base_url = os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")
if not base_url:
    raise RuntimeError("REACT_APP_BACKEND_URL missing")
API = base_url.rstrip("/") + "/api"


@pytest.fixture(scope="module")
def api_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def created(api_client):
    ids = []
    yield ids
    for pid in ids:
        api_client.delete(f"{API}/oven-profiles/{pid}", timeout=30)


# --- Oven type persistence -------------------------------------------------
class TestOvenType:
    def test_create_ventilato(self, api_client, created):
        r = api_client.post(f"{API}/oven-profiles", json={
            "name": "TEST_ventilato", "oven_type": "ventilato", "preheat_temp": 250,
            "phase1_temp": 240, "phase1_minutes": 10,
        }, timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        created.append(d["id"])
        assert d["oven_type"] == "ventilato"
        assert d["name"] == "TEST_ventilato"
        # GET verify persistence
        lst = api_client.get(f"{API}/oven-profiles", timeout=30).json()
        found = [p for p in lst if p["id"] == d["id"]]
        assert found and found[0]["oven_type"] == "ventilato"
        assert "_id" not in found[0]

    def test_default_statico_when_omitted(self, api_client, created):
        r = api_client.post(f"{API}/oven-profiles", json={"name": "TEST_default"}, timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        created.append(d["id"])
        assert d["oven_type"] == "statico"
        lst = api_client.get(f"{API}/oven-profiles", timeout=30).json()
        assert [p for p in lst if p["id"] == d["id"]][0]["oven_type"] == "statico"

    def test_update_oven_type(self, api_client, created):
        c = api_client.post(f"{API}/oven-profiles", json={"name": "TEST_upd", "oven_type": "statico"}, timeout=30).json()
        created.append(c["id"])
        u = api_client.put(f"{API}/oven-profiles/{c['id']}", json={
            "name": "TEST_upd2", "oven_type": "ventilato", "preheat_temp": 230,
        }, timeout=30)
        assert u.status_code == 200, u.text
        assert u.json()["oven_type"] == "ventilato"
        lst = api_client.get(f"{API}/oven-profiles", timeout=30).json()
        got = [p for p in lst if p["id"] == c["id"]][0]
        assert got["oven_type"] == "ventilato"
        assert got["name"] == "TEST_upd2"
        assert got["preheat_temp"] == 230


# --- Weekly plan pieces (source for 'Quando impastare') --------------------
class TestWeeklyPieces:
    def test_weekly_plan_roundtrip_with_pieces(self, api_client):
        original = api_client.get(f"{API}/weekly-plan", timeout=30).json()
        rec = api_client.post(f"{API}/recipes", json={
            "name": "TEST_wp_recipe", "category": "personal", "flour_grams": 1000,
            "bulk_fermentation_hours": 0.25, "proofing_hours": 0,
        }, timeout=30)
        assert rec.status_code == 200, rec.text
        rid = rec.json()["id"]
        try:
            payload = {"items": [
                {"id": "t1", "day": "mar", "recipe_id": rid, "recipe_name": "TEST_wp_recipe", "pieces": 5000, "note": ""},
                {"id": "t2", "day": "mar", "recipe_id": rid, "recipe_name": "TEST_wp_recipe", "pieces": 19, "note": ""},
            ]}
            p = api_client.put(f"{API}/weekly-plan", json=payload, timeout=30)
            assert p.status_code == 200, p.text
            g = api_client.get(f"{API}/weekly-plan", timeout=30).json()
            items = {i["id"]: i for i in g["items"]}
            assert items["t1"]["pieces"] == 5000
            assert items["t2"]["pieces"] == 19
            assert items["t1"]["day"] == "mar"
            assert items["t1"]["recipe_id"] == rid
        finally:
            api_client.delete(f"{API}/recipes/{rid}", timeout=30)
            restore = {"items": (original or {}).get("items", []) if original else []}
            api_client.put(f"{API}/weekly-plan", json=restore, timeout=30)
