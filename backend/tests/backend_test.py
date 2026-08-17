"""Backend API tests for Mikilab / Il Maestro del Pane.

Modules covered:
- Health / root
- Recipes CRUD (mikilab seed + personal collection)
- Oven profiles CRUD
- Maestro AI chat (SSE streaming) + history
"""
import os
import json
import uuid

import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
base_url = os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")
if not base_url:
    raise RuntimeError("REACT_APP_BACKEND_URL is missing")
BASE_URL = base_url.rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def api_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ---------------- Health ----------------
class TestHealth:
    def test_root(self, api_client):
        r = api_client.get(f"{API}/", timeout=30)
        assert r.status_code == 200, r.text
        assert "message" in r.json()


# ---------------- Recipes ----------------
class TestRecipes:
    def test_mikilab_seeded(self, api_client):
        r = api_client.get(f"{API}/recipes", params={"collection_name": "mikilab"}, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert isinstance(data, list)
        names = [x["name"] for x in data]
        assert "Pane di Altamura DOP" in names
        assert any("Ciabatta" in n for n in names)
        assert any("Rustico" in n for n in names)
        assert len(data) >= 3
        first = data[0]
        assert "_id" not in first
        assert first["collection_name"] == "mikilab"
        assert isinstance(first["id"], str)

    def test_mikilab_seed_idempotent(self, api_client):
        a = api_client.get(f"{API}/recipes", params={"collection_name": "mikilab"}, timeout=30).json()
        b = api_client.get(f"{API}/recipes", params={"collection_name": "mikilab"}, timeout=30).json()
        assert len(a) == len(b), "Seeding is not idempotent"

    def test_personal_collection_has_no_examples(self, api_client):
        r = api_client.get(f"{API}/recipes", params={"collection_name": "personal"}, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert isinstance(data, list)
        seeded = {"Pane di Altamura DOP", "Ciabatta ad Alta Idratazione", "Pane Rustico al Farro e Miele"}
        assert not (set(x["name"] for x in data) & seeded), "Personal collection contains example recipes"
        for x in data:
            assert x["collection_name"] == "personal"

    def test_recipe_full_crud(self, api_client):
        payload = {
            "collection_name": "personal",
            "name": "TEST_Pane Integrale",
            "flour_type": "Tipo 2",
            "hydration_percent": 72,
            "flour_grams": 1000,
            "water_grams": 720,
            "sourdough_grams": 200,
            "salt_grams": 20,
            "bulk_fermentation_hours": 4,
            "proofing_hours": 2,
            "notes": "TEST note",
        }
        c = api_client.post(f"{API}/recipes", json=payload, timeout=30)
        assert c.status_code == 200, c.text
        created = c.json()
        rid = created["id"]
        assert created["name"] == payload["name"]
        assert created["collection_name"] == "personal"
        assert created["water_grams"] == 720
        assert "_id" not in created

        # GET verifies persistence
        lst = api_client.get(f"{API}/recipes", params={"collection_name": "personal"}, timeout=30).json()
        match = [x for x in lst if x["id"] == rid]
        assert len(match) == 1
        assert match[0]["hydration_percent"] == 72

        # UPDATE — PUT is now full-state (unsent fields are cleared to null by design),
        # so the client must send the whole recipe. Send full state like RecipeDialog does.
        full = {**{k: v for k, v in payload.items() if k != "collection_name"},
                "name": "TEST_Aggiornato", "hydration_percent": 80}
        u = api_client.put(f"{API}/recipes/{rid}", json=full, timeout=30)
        assert u.status_code == 200, u.text
        assert u.json()["name"] == "TEST_Aggiornato"
        assert u.json()["hydration_percent"] == 80

        lst = api_client.get(f"{API}/recipes", params={"collection_name": "personal"}, timeout=30).json()
        got = [x for x in lst if x["id"] == rid][0]
        assert got["name"] == "TEST_Aggiornato"
        assert got["hydration_percent"] == 80
        assert got["flour_type"] == "Tipo 2"

        # Explicit null must now clear the field (iteration-1 bug fix regression)
        cleared = api_client.put(f"{API}/recipes/{rid}", json={**full, "water_grams": None}, timeout=30)
        assert cleared.status_code == 200
        got = [x for x in api_client.get(f"{API}/recipes", params={"collection_name": "personal"}, timeout=30).json()
               if x["id"] == rid][0]
        assert got["water_grams"] is None

        # DELETE
        d = api_client.delete(f"{API}/recipes/{rid}", timeout=30)
        assert d.status_code == 200, d.text
        assert d.json().get("success") is True

        lst = api_client.get(f"{API}/recipes", params={"collection_name": "personal"}, timeout=30).json()
        assert not [x for x in lst if x["id"] == rid]

    def test_update_missing_recipe_404(self, api_client):
        r = api_client.put(f"{API}/recipes/{uuid.uuid4()}", json={"name": "x"}, timeout=30)
        assert r.status_code == 404

    def test_delete_missing_recipe_404(self, api_client):
        r = api_client.delete(f"{API}/recipes/{uuid.uuid4()}", timeout=30)
        assert r.status_code == 404

    def test_create_recipe_validation(self, api_client):
        r = api_client.post(f"{API}/recipes", json={"flour_type": "x"}, timeout=30)
        assert r.status_code == 422


# ---------------- Oven profiles ----------------
class TestOvenProfiles:
    def test_list_no_examples(self, api_client):
        r = api_client.get(f"{API}/oven-profiles", timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert isinstance(data, list)
        for x in data:
            assert "_id" not in x

    def test_oven_profile_crud(self, api_client):
        payload = {
            "name": "TEST_Forno Pane",
            "preheat_temp": 250,
            "phase1_temp": 250, "phase1_minutes": 15,
            "phase2_temp": 220, "phase2_minutes": 20,
            "phase3_temp": 200, "phase3_minutes": 10,
            "notes": "TEST vapore iniziale",
        }
        c = api_client.post(f"{API}/oven-profiles", json=payload, timeout=30)
        assert c.status_code == 200, c.text
        created = c.json()
        pid = created["id"]
        assert created["name"] == payload["name"]
        assert created["phase1_minutes"] == 15

        lst = api_client.get(f"{API}/oven-profiles", timeout=30).json()
        got = [x for x in lst if x["id"] == pid]
        assert len(got) == 1
        assert got[0]["preheat_temp"] == 250

        upd = {**payload, "name": "TEST_Forno Aggiornato", "phase1_minutes": 18}
        u = api_client.put(f"{API}/oven-profiles/{pid}", json=upd, timeout=30)
        assert u.status_code == 200, u.text
        assert u.json()["name"] == "TEST_Forno Aggiornato"

        lst = api_client.get(f"{API}/oven-profiles", timeout=30).json()
        got = [x for x in lst if x["id"] == pid][0]
        assert got["phase1_minutes"] == 18

        d = api_client.delete(f"{API}/oven-profiles/{pid}", timeout=30)
        assert d.status_code == 200
        lst = api_client.get(f"{API}/oven-profiles", timeout=30).json()
        assert not [x for x in lst if x["id"] == pid]

    def test_oven_404s(self, api_client):
        bad = str(uuid.uuid4())
        assert api_client.put(f"{API}/oven-profiles/{bad}", json={"name": "x"}, timeout=30).status_code == 404
        assert api_client.delete(f"{API}/oven-profiles/{bad}", timeout=30).status_code == 404

    def test_oven_validation(self, api_client):
        r = api_client.post(f"{API}/oven-profiles", json={"preheat_temp": 200}, timeout=30)
        assert r.status_code == 422


# ---------------- Maestro AI chat ----------------
class TestMaestroChat:
    def test_chat_streams_sse(self, api_client):
        session_id = f"TEST_{uuid.uuid4()}"
        chunks = []
        with requests.post(
            f"{API}/maestro/chat",
            json={"session_id": session_id, "message": "Ciao Maestro, quale idratazione per una ciabatta?"},
            stream=True, timeout=180,
            headers={"Content-Type": "application/json"},
        ) as resp:
            assert resp.status_code == 200, resp.text
            assert "text/event-stream" in resp.headers.get("content-type", "")
            done = False
            for line in resp.iter_lines(decode_unicode=True):
                if line and line.startswith("data:"):
                    payload = json.loads(line.split(":", 1)[1].strip())
                    if payload.get("done"):
                        done = True
                        break
                    chunks.append(payload.get("d", ""))
        assert chunks, "No SSE data chunks received"
        assert done, "stream did not terminate with {'done': true}"
        text = "".join(chunks)
        assert len(text) > 20, f"AI reply too short: {text!r}"

        # history should contain user + assistant
        h = api_client.get(f"{API}/maestro/history/{session_id}", timeout=30)
        assert h.status_code == 200, h.text
        msgs = h.json()
        roles = [m["role"] for m in msgs]
        assert "user" in roles and "assistant" in roles, msgs
        assistant = [m for m in msgs if m["role"] == "assistant"][0]
        assert len(assistant["content"]) > 20
        assert "_id" not in msgs[0]

    def test_history_unknown_session_empty(self, api_client):
        r = api_client.get(f"{API}/maestro/history/{uuid.uuid4()}", timeout=30)
        assert r.status_code == 200
        assert r.json() == []

    def test_chat_validation(self, api_client):
        r = api_client.post(f"{API}/maestro/chat", json={"message": "ciao"}, timeout=30)
        assert r.status_code == 422
