# ============================================================================
#  MIKILAB PRO & BakoMix AI — PROPRIETARY & CONFIDENTIAL
#  (c) 2026 MikiLab Pro. Tutti i diritti riservati / All rights reserved.
#  Unico proprietario legale: il Master. Sole legal owner: the Master.
#  Codice riservato: vietata copia, distribuzione, reverse engineering o
#  cloning non autorizzati. Unauthorized copying, distribution, reverse
#  engineering or cloning is strictly prohibited and actively tracked by
#  the BakoMix AI Security Guardian.
# ============================================================================
"""Iteration-2 features: production plan persistence + announcements CRUD."""
import os
import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
base_url = os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")
if not base_url:
    raise RuntimeError("REACT_APP_BACKEND_URL missing")
BASE_URL = base_url.rstrip("/")


@pytest.fixture(scope="module")
def api_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# --- Production plan (single upsert keyed _key=default) ---
class TestProductionPlan:
    def test_get_returns_json_null_or_plan(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/production-plan")
        assert r.status_code == 200
        data = r.json()
        assert data is None or ("bake_time" in data and "phases" in data)

    def test_put_upsert_and_persist(self, api_client):
        payload = {
            "bake_time": "2026-07-10T18:00",
            "phases": [
                {"name": "TEST_Rinfresco", "hours": 4},
                {"name": "TEST_Autolisi", "hours": 0.5},
            ],
        }
        r = api_client.put(f"{BASE_URL}/api/production-plan", json=payload)
        assert r.status_code == 200, r.text
        saved = r.json()
        assert saved["bake_time"] == payload["bake_time"]
        assert len(saved["phases"]) == 2
        assert saved["phases"][0] == {"name": "TEST_Rinfresco", "hours": 4.0}
        assert isinstance(saved["updated_at"], str) and saved["updated_at"]

        # GET verifies persistence and no mongo _id/_key leakage
        g = api_client.get(f"{BASE_URL}/api/production-plan")
        assert g.status_code == 200
        got = g.json()
        assert got["bake_time"] == payload["bake_time"]
        assert got["phases"][1]["hours"] == 0.5
        assert "_id" not in got and "_key" not in got

    def test_put_overwrites_single_doc(self, api_client):
        p2 = {"bake_time": "2026-07-11T06:30", "phases": [{"name": "TEST_Solo", "hours": 1.25}]}
        assert api_client.put(f"{BASE_URL}/api/production-plan", json=p2).status_code == 200
        got = api_client.get(f"{BASE_URL}/api/production-plan").json()
        assert got["bake_time"] == "2026-07-11T06:30"
        assert len(got["phases"]) == 1
        assert got["phases"][0]["name"] == "TEST_Solo"

    def test_put_validation_422(self, api_client):
        assert api_client.put(f"{BASE_URL}/api/production-plan", json={"phases": []}).status_code == 422
        r = api_client.put(f"{BASE_URL}/api/production-plan",
                           json={"bake_time": "x", "phases": [{"name": "a", "hours": "abc"}]})
        assert r.status_code == 422

    def test_phase_hours_defaults_to_zero(self, api_client):
        r = api_client.put(f"{BASE_URL}/api/production-plan",
                           json={"bake_time": "2026-07-12T09:00", "phases": [{"name": "TEST_NoHours"}]})
        assert r.status_code == 200
        assert r.json()["phases"][0]["hours"] == 0


# --- Stuttgart announcements CRUD ---
class TestAnnouncements:
    created = []

    def test_get_seeds_defaults(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/announcements")
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list) and len(items) >= 2
        titles = [i["title"] for i in items]
        assert any("Mulini" in t for t in titles)
        assert any("lievito madre" in t for t in titles)
        for i in items:
            assert "id" in i and "created_at" in i and "_id" not in i

    def test_get_seed_idempotent(self, api_client):
        n1 = len(api_client.get(f"{BASE_URL}/api/announcements").json())
        n2 = len(api_client.get(f"{BASE_URL}/api/announcements").json())
        assert n1 == n2

    def test_crud_flow(self, api_client):
        c = api_client.post(f"{BASE_URL}/api/announcements",
                            json={"title": "TEST_Mulino Schwaben", "details": "TEST dettagli"})
        assert c.status_code == 200, c.text
        ann = c.json()
        aid = ann["id"]
        self.created.append(aid)
        assert ann["title"] == "TEST_Mulino Schwaben"
        assert ann["details"] == "TEST dettagli"

        # persisted in list
        items = api_client.get(f"{BASE_URL}/api/announcements").json()
        assert any(i["id"] == aid and i["title"] == "TEST_Mulino Schwaben" for i in items)

        # update
        u = api_client.put(f"{BASE_URL}/api/announcements/{aid}",
                           json={"title": "TEST_Aggiornato", "details": "nuovi dettagli"})
        assert u.status_code == 200
        assert u.json()["title"] == "TEST_Aggiornato"
        assert u.json()["id"] == aid
        items = api_client.get(f"{BASE_URL}/api/announcements").json()
        match = [i for i in items if i["id"] == aid][0]
        assert match["title"] == "TEST_Aggiornato"
        assert match["details"] == "nuovi dettagli"

        # delete
        d = api_client.delete(f"{BASE_URL}/api/announcements/{aid}")
        assert d.status_code == 200 and d.json().get("success") is True
        items = api_client.get(f"{BASE_URL}/api/announcements").json()
        assert all(i["id"] != aid for i in items)
        self.created.remove(aid)

    def test_create_without_details(self, api_client):
        c = api_client.post(f"{BASE_URL}/api/announcements", json={"title": "TEST_SoloTitolo"})
        assert c.status_code == 200
        assert c.json()["details"] == ""
        api_client.delete(f"{BASE_URL}/api/announcements/{c.json()['id']}")

    def test_validation_and_404s(self, api_client):
        assert api_client.post(f"{BASE_URL}/api/announcements", json={"details": "x"}).status_code == 422
        assert api_client.put(f"{BASE_URL}/api/announcements/nope", json={"title": "x"}).status_code == 404
        assert api_client.delete(f"{BASE_URL}/api/announcements/nope").status_code == 404

    @pytest.fixture(scope="class", autouse=True)
    def cleanup(self, api_client):
        yield
        for i in api_client.get(f"{BASE_URL}/api/announcements").json():
            if i["title"].startswith("TEST_"):
                api_client.delete(f"{BASE_URL}/api/announcements/{i['id']}")


# --- Duplicate / scale rely on POST /api/recipes; verify backend semantics ---
class TestDuplicateAndScaleBackend:
    def test_duplicate_creates_independent_copy(self, api_client):
        src = api_client.post(f"{BASE_URL}/api/recipes", json={
            "collection_name": "mikilab", "name": "TEST_Base", "flour_type": "T0",
            "hydration_percent": 78, "flour_grams": 1000, "water_grams": 780,
            "sourdough_grams": 200, "salt_grams": 20,
        }).json()
        copy = api_client.post(f"{BASE_URL}/api/recipes", json={
            "collection_name": "mikilab", "name": "TEST_Base (copia)", "flour_type": src["flour_type"],
            "hydration_percent": src["hydration_percent"], "flour_grams": src["flour_grams"],
            "water_grams": src["water_grams"], "sourdough_grams": src["sourdough_grams"],
            "salt_grams": src["salt_grams"],
        })
        assert copy.status_code == 200
        cp = copy.json()
        assert cp["id"] != src["id"]
        assert cp["name"] == "TEST_Base (copia)"
        assert cp["water_grams"] == src["water_grams"]
        assert cp["collection_name"] == "mikilab"

        listed = api_client.get(f"{BASE_URL}/api/recipes", params={"collection_name": "mikilab"}).json()
        ids = [r["id"] for r in listed]
        assert src["id"] in ids and cp["id"] in ids

        for rid in (src["id"], cp["id"]):
            assert api_client.delete(f"{BASE_URL}/api/recipes/{rid}").status_code == 200

    def test_scaled_recipe_keeps_hydration(self, api_client):
        src = api_client.post(f"{BASE_URL}/api/recipes", json={
            "collection_name": "mikilab", "name": "TEST_Scala", "hydration_percent": 75,
            "flour_grams": 1000, "water_grams": 750, "sourdough_grams": 200, "salt_grams": 20,
        }).json()
        total = 1000 + 750 + 200 + 20  # 1970
        factor = 1000 / total
        payload = {
            "collection_name": "mikilab", "name": "TEST_Scala (1000g)",
            "hydration_percent": 75,
            "flour_grams": round(1000 * factor), "water_grams": round(750 * factor),
            "sourdough_grams": round(200 * factor), "salt_grams": round(20 * factor),
        }
        scaled = api_client.post(f"{BASE_URL}/api/recipes", json=payload).json()
        ratio = scaled["water_grams"] / scaled["flour_grams"]
        assert abs(ratio - 0.75) < 0.01, f"hydration drifted: {ratio}"
        assert scaled["hydration_percent"] == 75
        for rid in (src["id"], scaled["id"]):
            api_client.delete(f"{BASE_URL}/api/recipes/{rid}")
