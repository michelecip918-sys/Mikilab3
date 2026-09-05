# ============================================================================
#  MIKILAB PRO & BakoMix AI — PROPRIETARY & CONFIDENTIAL
#  (c) 2026 MikiLab Pro. Tutti i diritti riservati / All rights reserved.
#  Unico proprietario legale: il Master. Sole legal owner: the Master.
#  Codice riservato: vietata copia, distribuzione, reverse engineering o
#  cloning non autorizzati. Unauthorized copying, distribution, reverse
#  engineering or cloning is strictly prohibited and actively tracked by
#  the BakoMix AI Security Guardian.
# ============================================================================
"""Iteration 12: recipe new fields (dough_category, water_temp_c, work_phases, image_url, costing)."""
import os
import base64
import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
base_url = os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")
if not base_url:
    raise RuntimeError("REACT_APP_BACKEND_URL missing")
BASE_URL = base_url.rstrip("/")

TINY_JPEG = "data:image/jpeg;base64," + base64.b64encode(b"\xff\xd8\xff\xdb" + b"\x00" * 40 + b"\xff\xd9").decode()


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# --- GET mikilab recipes ---------------------------------------------------
class TestMikilabList:
    def test_list_mikilab(self, client):
        r = client.get(f"{BASE_URL}/api/recipes", params={"collection_name": "mikilab"}, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert isinstance(data, list)
        print(f"mikilab recipe count = {len(data)}")
        assert len(data) >= 3
        # no mongo _id leaking
        assert all("_id" not in d for d in data)
        # sorted by name ascending (server-side sort)
        names = [d["name"] for d in data]
        assert names == sorted(names), f"not sorted: {names[:5]}"
        # new optional fields present in schema
        for key in ["origin", "dough_category", "water_temp_c", "procedure",
                    "extra_ingredients", "work_phases", "image_url", "costing"]:
            assert key in data[0], f"missing field {key}"
        with_costing = [d for d in data if d.get("costing")]
        print(f"recipes with costing: {len(with_costing)}/{len(data)}")

    def test_list_personal(self, client):
        r = client.get(f"{BASE_URL}/api/recipes", params={"collection_name": "personal"}, timeout=30)
        assert r.status_code == 200
        assert isinstance(r.json(), list)


# --- Full CRUD with new fields --------------------------------------------
class TestRecipeNewFieldsCRUD:
    payload = {
        "collection_name": "personal",
        "name": "TEST_Iter12 Nuovi Campi",
        "flour_type": "Tipo 1",
        "flour_grams": 1000,
        "water_grams": 700,
        "sourdough_grams": 200,
        "salt_grams": 20,
        "dough_category": "pre",
        "water_temp_c": 18.5,
        "origin": "IT",
        "procedure": "1) Autolisi 2) Impasto",
        "work_phases": [
            {"name": "Autolisi", "time": "30", "temp": "22"},
            {"name": "Puntata", "time": "4h", "temp": "16"},
        ],
        "extra_ingredients": [{"name": "Olio", "percent": 2}],
        "image_url": TINY_JPEG,
        "costing": {
            "flour_kg": 1.2, "water_l": 0, "sourdough_kg": 2, "salt_kg": 0.5,
            "extras": [{"name": "Olio", "cost": 0.3}],
            "overhead": 0.5, "pieces": 10, "price": 0, "markup": 0,
        },
    }

    def test_create_get_update_delete(self, client):
        # CREATE
        cr = client.post(f"{BASE_URL}/api/recipes", json=self.payload, timeout=30)
        assert cr.status_code == 200, cr.text
        created = cr.json()
        rid = created["id"]
        assert created["dough_category"] == "pre"
        assert created["water_temp_c"] == 18.5
        assert created["work_phases"] == self.payload["work_phases"]
        assert created["extra_ingredients"] == self.payload["extra_ingredients"]
        assert created["image_url"] == TINY_JPEG
        assert created["costing"]["pieces"] == 10
        assert created["costing"]["extras"] == [{"name": "Olio", "cost": 0.3}]

        try:
            # GET back (persistence)
            gr = client.get(f"{BASE_URL}/api/recipes", params={"collection_name": "personal"}, timeout=30)
            assert gr.status_code == 200
            fetched = next((x for x in gr.json() if x["id"] == rid), None)
            assert fetched is not None, "created recipe not returned by GET"
            assert fetched["dough_category"] == "pre"
            assert fetched["water_temp_c"] == 18.5
            assert fetched["origin"] == "IT"
            assert fetched["procedure"] == "1) Autolisi 2) Impasto"
            assert fetched["work_phases"][1]["name"] == "Puntata"
            assert fetched["work_phases"][1]["time"] == "4h"
            assert fetched["work_phases"][1]["temp"] == "16"
            assert fetched["extra_ingredients"][0]["percent"] == 2
            assert fetched["image_url"] == TINY_JPEG
            assert fetched["costing"]["flour_kg"] == 1.2
            assert fetched["costing"]["overhead"] == 0.5
            assert fetched["costing"]["pieces"] == 10

            # UPDATE water_temp_c
            ur = client.put(f"{BASE_URL}/api/recipes/{rid}", json={"water_temp_c": 20}, timeout=30)
            assert ur.status_code == 200, ur.text
            assert ur.json()["water_temp_c"] == 20
            gr2 = client.get(f"{BASE_URL}/api/recipes", params={"collection_name": "personal"}, timeout=30)
            f2 = next(x for x in gr2.json() if x["id"] == rid)
            assert f2["water_temp_c"] == 20
            # untouched fields intact
            assert f2["work_phases"][0]["name"] == "Autolisi"
            assert f2["costing"]["pieces"] == 10

            # UPDATE work phases
            ur2 = client.put(f"{BASE_URL}/api/recipes/{rid}",
                             json={"work_phases": [{"name": "Appretto", "time": "2h", "temp": "28"}]}, timeout=30)
            assert ur2.status_code == 200
            gr3 = client.get(f"{BASE_URL}/api/recipes", params={"collection_name": "personal"}, timeout=30)
            f3 = next(x for x in gr3.json() if x["id"] == rid)
            assert len(f3["work_phases"]) == 1 and f3["work_phases"][0]["name"] == "Appretto"
        finally:
            dr = client.delete(f"{BASE_URL}/api/recipes/{rid}", timeout=30)
            assert dr.status_code == 200, dr.text
            gr4 = client.get(f"{BASE_URL}/api/recipes", params={"collection_name": "personal"}, timeout=30)
            assert all(x["id"] != rid for x in gr4.json()), "recipe still present after DELETE"

    def test_update_unknown_id_404(self, client):
        r = client.put(f"{BASE_URL}/api/recipes/does-not-exist-123", json={"water_temp_c": 5}, timeout=30)
        assert r.status_code == 404

    def test_delete_unknown_id_404(self, client):
        r = client.delete(f"{BASE_URL}/api/recipes/does-not-exist-123", timeout=30)
        assert r.status_code == 404

    def test_create_missing_name_422(self, client):
        r = client.post(f"{BASE_URL}/api/recipes", json={"collection_name": "personal"}, timeout=30)
        assert r.status_code == 422
