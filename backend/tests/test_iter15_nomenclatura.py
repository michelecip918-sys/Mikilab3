"""Iteration 15 — nomenclatura impasti, protezione user_edited, CRUD personal, vision SSE."""
import base64
import io
import json
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
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def mikilab(client):
    r = client.get(f"{BASE_URL}/api/recipes", params={"collection_name": "mikilab"}, timeout=60)
    assert r.status_code == 200, r.text
    return r.json()


# --- Module: nomenclatura impasti (seed data) ---
class TestNomenclatura:
    def test_mikilab_count_37(self, mikilab):
        assert isinstance(mikilab, list)
        assert len(mikilab) == 37, f"expected 37 mikilab recipes, got {len(mikilab)}"

    def test_no_old_triple_string(self, mikilab):
        bad = []
        for r in mikilab:
            blob = json.dumps(r, ensure_ascii=False).lower()
            if "lievito madre / sauerteig / poolish" in blob:
                bad.append(r["name"])
        assert not bad, f"old nomenclature still present in: {bad}"

    def test_no_mongo_id_leak(self, mikilab):
        assert all("_id" not in r for r in mikilab)

    def test_sauerteig_only_in_rye_recipes(self, mikilab):
        # rye + German/Swabian recipes legitimately use "Sauerteig"
        allowed = {"Bruno d'Autunno", "Gran Riserva", "Gnetze Brot", "Wurzelbrot"}
        offenders = []
        for r in mikilab:
            blob = json.dumps(r, ensure_ascii=False)
            if "Sauerteig" in blob and r["name"] not in allowed:
                offenders.append(r["name"])
        assert not offenders, f"'Sauerteig' present in non-rye recipes: {offenders}"

    def test_oro_di_terra_notes(self, mikilab):
        rec = next((r for r in mikilab if r["name"] == "Oro di Terra"), None)
        assert rec is not None, "'Oro di Terra' not found"
        notes = (rec.get("notes") or "").strip()
        assert notes.startswith("Lievito madre 10%"), f"notes start with: {notes[:60]!r}"

    def test_procedure_refresh_wording(self, mikilab):
        """Where a refresh step exists it must use the new wording."""
        rye = {"Bruno d'Autunno", "Gran Riserva"}
        problems = []
        for r in mikilab:
            proc = r.get("procedure") or ""
            if "rinfresca" not in proc.lower():
                continue
            if r["name"] in rye:
                if "rinfresca il Sauerteig (lievito madre di segale)" not in proc:
                    problems.append((r["name"], proc[:90]))
            else:
                if "rinfresca il lievito madre (o poolish)" not in proc and "Sauerteig" in proc:
                    problems.append((r["name"], proc[:90]))
        assert not problems, f"unexpected refresh wording: {problems}"


# --- Module: protezione user_edited contro il seed ---
class TestUserEditedProtection:
    def test_edit_survives_force_seed(self, client):
        r = client.get(f"{BASE_URL}/api/recipes", params={"collection_name": "mikilab"}, timeout=60)
        recipes = r.json()
        target = next(x for x in recipes if x["name"] == "Oro di Terra")
        original_notes = target.get("notes")
        rid = target["id"]
        marker = "TEST_user_edited_marker_123"
        try:
            up = client.put(f"{BASE_URL}/api/recipes/{rid}", json={"notes": marker}, timeout=30)
            assert up.status_code == 200, up.text
            assert up.json().get("notes") == marker
            # NOTE: Recipe response_model does not declare 'user_edited', so it is
            # stripped from the API response. DB-level flag is verified below.

            seed = client.get(f"{BASE_URL}/api/seed-mikilab", timeout=120)
            assert seed.status_code == 200, seed.text
            assert seed.json().get("status") == "synced"

            after = client.get(f"{BASE_URL}/api/recipes", params={"collection_name": "mikilab"}, timeout=60).json()
            rec = next(x for x in after if x["id"] == rid)
            assert rec.get("notes") == marker, "seed overwrote a user-edited recipe!"
            # verify user_edited flag in DB
            import asyncio
            from motor.motor_asyncio import AsyncIOMotorClient
            from dotenv import dotenv_values as _dv
            env = _dv("/app/backend/.env")

            async def _check():
                cl = AsyncIOMotorClient(env["MONGO_URL"])
                doc = await cl[env["DB_NAME"]].recipes.find_one({"id": rid}, {"_id": 0, "user_edited": 1})
                cl.close()
                return doc
            doc = asyncio.get_event_loop().run_until_complete(_check()) if False else asyncio.run(_check())
            assert doc and doc.get("user_edited") is True, f"user_edited flag missing in DB: {doc}"
        finally:
            client.put(f"{BASE_URL}/api/recipes/{rid}", json={"notes": original_notes}, timeout=30)
            back = client.get(f"{BASE_URL}/api/recipes", params={"collection_name": "mikilab"}, timeout=60).json()
            rec = next(x for x in back if x["id"] == rid)
            assert rec.get("notes") == original_notes


# --- Module: CRUD ricette personali ---
class TestPersonalCRUD:
    created = []

    def test_full_crud(self, client):
        payload = {
            "collection_name": "personal",
            "name": "TEST_Pane Iter15",
            "flour_type": "Tipo 1",
            "hydration_percent": 72,
            "notes": "nota iniziale",
        }
        c = client.post(f"{BASE_URL}/api/recipes", json=payload, timeout=30)
        assert c.status_code == 200, c.text
        rec = c.json()
        rid = rec["id"]
        self.created.append(rid)
        assert rec["name"] == payload["name"]
        assert rec["collection_name"] == "personal"

        lst = client.get(f"{BASE_URL}/api/recipes", params={"collection_name": "personal"}, timeout=30).json()
        assert any(x["id"] == rid for x in lst), "created recipe not listed"

        u = client.put(f"{BASE_URL}/api/recipes/{rid}", json={"notes": "nota aggiornata", "hydration_percent": 80}, timeout=30)
        assert u.status_code == 200, u.text
        lst = client.get(f"{BASE_URL}/api/recipes", params={"collection_name": "personal"}, timeout=30).json()
        got = next(x for x in lst if x["id"] == rid)
        assert got["notes"] == "nota aggiornata"
        assert got["hydration_percent"] == 80

        d = client.delete(f"{BASE_URL}/api/recipes/{rid}", timeout=30)
        assert d.status_code == 200, d.text
        lst = client.get(f"{BASE_URL}/api/recipes", params={"collection_name": "personal"}, timeout=30).json()
        assert not any(x["id"] == rid for x in lst), "recipe still present after delete"
        self.created.remove(rid)

    def test_update_missing_recipe_404(self, client):
        r = client.put(f"{BASE_URL}/api/recipes/does-not-exist-xyz", json={"notes": "x"}, timeout=30)
        assert r.status_code == 404

    def test_delete_missing_recipe_404(self, client):
        r = client.delete(f"{BASE_URL}/api/recipes/does-not-exist-xyz", timeout=30)
        assert r.status_code == 404


def _tiny_bread_png_b64():
    """Small solid-color PNG (valid image) generated without external deps."""
    try:
        from PIL import Image
        img = Image.new("RGB", (64, 64), (196, 148, 84))
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        return base64.b64encode(buf.getvalue()).decode()
    except Exception:
        return (
            "iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAJUlEQVR4nGP8z8DAwMDAxMDAwMDA"
            "wMDAwMDAwMDAwMDAwMDAwAAAKmAB9r6yQ0kAAAAASUVORK5CYII="
        )


# --- Module: Diagnosi Vision SSE ---
class TestVisionSSE:
    @pytest.mark.parametrize("mode", ["ingredienti", "difetti"])
    def test_vision_stream(self, client, mode):
        img = _tiny_bread_png_b64()
        r = requests.post(
            f"{BASE_URL}/api/maestro/vision",
            json={"mode": mode, "image_base64": img, "lang": "it"},
            stream=True,
            timeout=180,
        )
        assert r.status_code == 200, r.text[:300]
        text = ""
        done = False
        err = None
        for raw in r.iter_lines(decode_unicode=True):
            if not raw or not raw.startswith("data:"):
                continue
            try:
                ev = json.loads(raw[5:].strip())
            except Exception:
                continue
            if "d" in ev:
                text += ev["d"]
            if ev.get("error"):
                err = ev["error"]
            if ev.get("done"):
                done = True
                break
        assert err is None, f"vision returned error: {err}"
        assert done, f"no done event; got {len(text)} chars"
        assert len(text.strip()) > 50, f"vision text too short ({len(text)}): {text[:200]!r}"
