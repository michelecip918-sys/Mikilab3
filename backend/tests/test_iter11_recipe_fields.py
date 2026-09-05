# ============================================================================
#  MIKILAB PRO & BakoMix AI — PROPRIETARY & CONFIDENTIAL
#  (c) 2026 MikiLab Pro. Tutti i diritti riservati / All rights reserved.
#  Unico proprietario legale: il Master. Sole legal owner: the Master.
#  Codice riservato: vietata copia, distribuzione, reverse engineering o
#  cloning non autorizzati. Unauthorized copying, distribution, reverse
#  engineering or cloning is strictly prohibited and actively tracked by
#  the BakoMix AI Security Guardian.
# ============================================================================
"""Iteration 11 backend tests: recipe new fields (preferment/work/bake) + seeded recipes."""
import os
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
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def created_ids():
    return []


@pytest.fixture(scope="module", autouse=True)
def cleanup(client, created_ids):
    yield
    for rid in created_ids:
        r = client.delete(f"{API}/recipes/{rid}")
        assert r.status_code in (200, 204, 404)


# --- health / seeded data ---
def test_root(client):
    r = client.get(f"{API}/")
    assert r.status_code == 200


def test_seeded_mikilab_recipes_have_bake_fields(client):
    r = client.get(f"{API}/recipes", params={"collection_name": "mikilab"})
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list) and len(data) > 0
    for rec in data:
        assert "_id" not in rec
        assert "id" in rec
    with_bake = [x for x in data if x.get("bake_temp") is not None and x.get("bake_minutes") is not None]
    assert len(with_bake) > 0, "no seeded recipe carries bake_temp/bake_minutes"
    assert any(x.get("oven_type") in ("statico", "ventilato", "rotor") for x in data)
    assert any(x.get("preferment_type") for x in data)


# --- CRUD with new fields ---
def test_create_recipe_with_new_fields_persists(client, created_ids):
    payload = {
        "name": "TEST_iter11 pane",
        "collection_name": "personal",
        "flour_type": "Type 550",
        "flour_grams": 1000,
        "water_grams": 700,
        "sourdough_grams": 200,
        "salt_grams": 20,
        "hydration_percent": 70,
        "preferment_type": "biga",
        "mix_minutes": 17,
        "rest_minutes": 90,
        "bake_temp": 240,
        "bake_minutes": 35,
        "oven_type": "rotor",
        "costing": {"flour_kg": 1.2, "water_l": 0.002, "sourdough_kg": 1.0, "salt_kg": 0.5,
                    "extras": [{"name": "olio", "cost": 0.35}], "overhead": 1, "pieces": 10, "markup": 200},
    }
    r = client.post(f"{API}/recipes", json=payload)
    assert r.status_code in (200, 201), r.text
    body = r.json()
    rid = body["id"]
    created_ids.append(rid)
    for k in ["preferment_type", "mix_minutes", "rest_minutes", "bake_temp", "bake_minutes", "oven_type"]:
        assert body[k] == payload[k], f"{k} mismatch on create response"

    # GET verify persistence
    lst = client.get(f"{API}/recipes", params={"collection_name": "personal"})
    assert lst.status_code == 200
    got = next((x for x in lst.json() if x["id"] == rid), None)
    assert got is not None
    assert got["preferment_type"] == "biga"
    assert got["oven_type"] == "rotor"
    assert got["bake_temp"] == 240
    assert got["bake_minutes"] == 35
    assert got["mix_minutes"] == 17
    assert got["costing"]["extras"][0]["name"] == "olio"


def test_update_recipe_new_fields_persists(client, created_ids):
    r = client.post(f"{API}/recipes", json={"name": "TEST_iter11 upd", "collection_name": "personal"})
    assert r.status_code in (200, 201)
    rid = r.json()["id"]
    created_ids.append(rid)

    upd = {"preferment_type": "poolish", "oven_type": "ventilato", "bake_temp": 225,
           "bake_minutes": 18, "mix_minutes": 12}
    u = client.put(f"{API}/recipes/{rid}", json=upd)
    assert u.status_code == 200, u.text
    ub = u.json()
    for k, v in upd.items():
        assert ub[k] == v

    got = next((x for x in client.get(f"{API}/recipes", params={"collection_name": "personal"}).json()
                if x["id"] == rid), None)
    assert got is not None
    for k, v in upd.items():
        assert got[k] == v, f"{k} not persisted"
    assert got["name"] == "TEST_iter11 upd"


def test_delete_recipe_removed(client):
    r = client.post(f"{API}/recipes", json={"name": "TEST_iter11 del", "collection_name": "personal"})
    rid = r.json()["id"]
    d = client.delete(f"{API}/recipes/{rid}")
    assert d.status_code in (200, 204)
    got = next((x for x in client.get(f"{API}/recipes", params={"collection_name": "personal"}).json()
                if x["id"] == rid), None)
    assert got is None


def test_update_missing_recipe_404(client):
    r = client.put(f"{API}/recipes/does-not-exist-iter11", json={"bake_temp": 200})
    assert r.status_code == 404


def test_invalid_payload_422(client):
    r = client.post(f"{API}/recipes", json={"collection_name": "personal"})
    assert r.status_code == 422


def test_weekly_plan_and_announcements_reachable(client):
    assert client.get(f"{API}/weekly-plan").status_code == 200
    assert client.get(f"{API}/announcements").status_code == 200
