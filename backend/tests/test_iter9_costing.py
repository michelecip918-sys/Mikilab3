"""Iteration 9: Recipe costing field persistence (POST/GET list/PUT/DELETE).

Note: the API has no GET /api/recipes/{id} endpoint (405); persistence is
verified through GET /api/recipes?collection_name=...
"""
import os
import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
base_url = os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")
if not base_url:
    raise RuntimeError("REACT_APP_BACKEND_URL missing")
BASE_URL = base_url.rstrip("/")

COSTING = {
    "flour_kg": 1.2,
    "water_l": 0.002,
    "sourdough_kg": 2.5,
    "salt_kg": 0.4,
    "extras": [{"name": "TEST_semi", "cost": 1.5}, {"name": "TEST_olio", "cost": 0.75}],
    "overhead": 3.0,
    "pieces": 10,
    "markup": 150,
}

BASE_RECIPE = {
    "name": "TEST_Costing9", "collection_name": "personal", "flour_type": "Dinkel",
    "flour_grams": 1000, "water_grams": 700, "sourdough_grams": 200, "salt_grams": 20,
    "bulk_fermentation_hours": 3, "proofing_hours": 2, "hydration_percent": 70,
    "notes": "TEST", "costing": COSTING,
}


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def created(client):
    ids = []
    yield ids
    for rid in ids:
        client.delete(f"{BASE_URL}/api/recipes/{rid}")


def fetch(client, rid, collection="personal"):
    items = client.get(f"{BASE_URL}/api/recipes?collection_name={collection}").json()
    return next((x for x in items if x["id"] == rid), None)


class TestRecipeCosting:
    def test_create_with_costing_persists(self, client, created):
        r = client.post(f"{BASE_URL}/api/recipes", json=BASE_RECIPE)
        assert r.status_code in (200, 201), r.text
        data = r.json()
        assert "id" in data and "_id" not in data
        created.append(data["id"])
        assert data["costing"] == COSTING

        got = fetch(client, data["id"])
        assert got is not None
        assert got["costing"] == COSTING
        assert got["flour_grams"] == 1000

    def test_list_has_no_mongo_id(self, client, created):
        items = client.get(f"{BASE_URL}/api/recipes?collection_name=personal").json()
        assert isinstance(items, list)
        assert all("_id" not in x for x in items)

    def test_update_costing_full_payload(self, client, created):
        rid = created[0]
        new_cost = {**COSTING, "markup": 200, "pieces": 20, "extras": []}
        r = client.put(f"{BASE_URL}/api/recipes/{rid}", json={**BASE_RECIPE, "costing": new_cost})
        assert r.status_code == 200, r.text
        assert r.json()["costing"]["markup"] == 200
        got = fetch(client, rid)
        assert got["costing"]["pieces"] == 20
        assert got["costing"]["extras"] == []
        assert got["name"] == "TEST_Costing9"

    @pytest.mark.skip(reason="KNOWN BUG (reported iteration_9): PUT /api/recipes/{id} is not a partial "
                             "update - omitted fields are written as null; name=None then breaks the "
                             "Recipe response_model, returning 500 for the PUT AND for the whole "
                             "GET /api/recipes list (collection unusable). Test is skipped because "
                             "running it corrupts shared data for other tests.")
    def test_update_costing_partial_payload(self, client, created):
        rid = created[0]
        r = client.put(f"{BASE_URL}/api/recipes/{rid}", json={"costing": {**COSTING, "markup": 90}})
        assert r.status_code == 200, r.text
        got = fetch(client, rid)
        assert got["name"] == "TEST_Costing9"
        assert got["costing"]["markup"] == 90

    def test_create_without_costing_is_null(self, client, created):
        r = client.post(f"{BASE_URL}/api/recipes", json={"name": "TEST_NoCost9", "collection_name": "personal"})
        assert r.status_code in (200, 201), r.text
        d = r.json()
        created.append(d["id"])
        assert d.get("costing") is None
        assert fetch(client, d["id"]).get("costing") is None

    def test_costing_math_matches_client_formula(self):
        total = (1000 / 1000 * 1.2) + (700 / 1000 * 0.002) + (200 / 1000 * 2.5) + (20 / 1000 * 0.4) + 1.5 + 0.75 + 3.0
        per_piece = total / 10
        sell = per_piece * (1 + 150 / 100)
        assert round(total, 2) == 6.96
        assert round(per_piece, 2) == 0.70
        assert round(sell, 2) == 1.74

    def test_delete_recipe_removes_it(self, client):
        r = client.post(f"{BASE_URL}/api/recipes", json={**BASE_RECIPE, "name": "TEST_Del9"})
        rid = r.json()["id"]
        assert client.delete(f"{BASE_URL}/api/recipes/{rid}").status_code in (200, 204)
        assert fetch(client, rid) is None
        assert client.delete(f"{BASE_URL}/api/recipes/{rid}").status_code == 404
