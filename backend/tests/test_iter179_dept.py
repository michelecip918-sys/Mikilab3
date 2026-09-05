# ============================================================================
#  MIKILAB PRO & BakoMix AI — PROPRIETARY & CONFIDENTIAL
#  (c) 2026 MikiLab Pro. Tutti i diritti riservati / All rights reserved.
#  Unico proprietario legale: il Master. Sole legal owner: the Master.
#  Codice riservato: vietata copia, distribuzione, reverse engineering o
#  cloning non autorizzati. Unauthorized copying, distribution, reverse
#  engineering or cloning is strictly prohibited and actively tracked by
#  the BakoMix AI Security Guardian.
# ============================================================================
"""Iteration 179 — Filtro Reparto globale: campo `department` su ricette e magazzino."""
import os
import pytest
import requests
from dotenv import dotenv_values

fe = dotenv_values("/app/frontend/.env")
BASE = (os.environ.get("REACT_APP_BACKEND_URL") or fe.get("REACT_APP_BACKEND_URL")).rstrip("/")
EMAIL = "admin@mikilab.de"
PWD = "Mikilab2026!"


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(f"{BASE}/api/auth/login", json={"email": EMAIL, "password": PWD}, timeout=30)
    if r.status_code != 200:
        pytest.fail(f"login failed {r.status_code}: {r.text[:300]}")
    data = r.json()
    tok = data.get("access_token") or data.get("token")
    if tok:
        s.headers.update({"Authorization": f"Bearer {tok}"})
    return s


@pytest.fixture(scope="module")
def created():
    return {"recipes": [], "wh": []}


# --- GET /api/recipes returns department field ---
def test_recipes_list_has_department(client):
    r = client.get(f"{BASE}/api/recipes", params={"collection_name": "mikilab"}, timeout=30)
    assert r.status_code == 200, r.text[:300]
    items = r.json()
    assert isinstance(items, list) and len(items) > 0
    assert "_id" not in items[0]
    missing = [i.get("name") for i in items if "department" not in i]
    assert not missing, f"recipes without department key: {missing[:5]}"


# --- POST/PUT recipe persists department ---
def test_create_update_recipe_department(client, created):
    payload = {
        "collection_name": "mikilab",
        "name": "TEST_Dept Pizza Teglia",
        "flour_type": "tipo 1",
        "department": "pizzeria",
        "notes": "test",
        "procedure": "test",
    }
    r = client.post(f"{BASE}/api/recipes", json=payload, timeout=30)
    assert r.status_code in (200, 201), f"{r.status_code} {r.text[:300]}"
    rec = r.json()
    rid = rec.get("id")
    assert rid
    created["recipes"].append(rid)
    assert rec.get("department") == "pizzeria"

    # GET verify persistence
    g = client.get(f"{BASE}/api/recipes", params={"collection_name": "mikilab"}, timeout=30)
    found = [x for x in g.json() if x.get("id") == rid]
    assert found and found[0]["department"] == "pizzeria"

    # PUT update
    u = client.put(f"{BASE}/api/recipes/{rid}", json={"department": "pasticceria"}, timeout=30)
    assert u.status_code == 200, u.text[:300]
    assert u.json().get("department") == "pasticceria"
    g2 = client.get(f"{BASE}/api/recipes", params={"collection_name": "mikilab"}, timeout=30)
    found2 = [x for x in g2.json() if x.get("id") == rid]
    assert found2 and found2[0]["department"] == "pasticceria"


# --- Warehouse department ---
def test_warehouse_department(client, created):
    r = client.post(f"{BASE}/api/lab/warehouse", json={
        "name": "TEST_Farina Pizza Dept", "kind": "farina", "quantity_kg": 5,
        "unit": "kg", "min_kg": 1, "department": "pizzeria",
    }, timeout=30)
    assert r.status_code in (200, 201), f"{r.status_code} {r.text[:300]}"
    body = r.json()
    item = body.get("item") if isinstance(body, dict) and "item" in body else body
    wid = item.get("id") if isinstance(item, dict) else None
    if wid:
        created["wh"].append(wid)
    g = client.get(f"{BASE}/api/lab/warehouse", timeout=30)
    assert g.status_code == 200
    lst = g.json()
    lst = lst.get("items") if isinstance(lst, dict) else lst
    mine = [x for x in lst if x.get("name") == "TEST_Farina Pizza Dept"]
    assert mine, "warehouse item not persisted"
    assert mine[0].get("department") == "pizzeria", f"department not saved: {mine[0]}"
    assert "_id" not in mine[0]


def test_cleanup(client, created):
    for rid in created["recipes"]:
        client.delete(f"{BASE}/api/recipes/{rid}", timeout=30)
    for wid in created["wh"]:
        client.delete(f"{BASE}/api/lab/warehouse/{wid}", timeout=30)
