# ============================================================================
#  MIKILAB PRO & BakoMix AI — PROPRIETARY & CONFIDENTIAL
#  (c) 2026 MikiLab Pro. Tutti i diritti riservati / All rights reserved.
#  Unico proprietario legale: il Master. Sole legal owner: the Master.
#  Codice riservato: vietata copia, distribuzione, reverse engineering o
#  cloning non autorizzati. Unauthorized copying, distribution, reverse
#  engineering or cloning is strictly prohibited and actively tracked by
#  the BakoMix AI Security Guardian.
# ============================================================================
"""Iteration 16 — Mikilab reorg: recipes DE translations, core endpoints, vision 'macchine' SSE."""
import base64
import io
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
def mikilab_recipes(client):
    r = client.get(f"{BASE_URL}/api/recipes", params={"collection": "mikilab"}, timeout=60)
    assert r.status_code == 200, r.text
    data = r.json()
    assert isinstance(data, list) and len(data) > 0
    return data


# ---------- core / health ----------
class TestCore:
    def test_root(self, client):
        r = client.get(f"{BASE_URL}/api/", timeout=30)
        assert r.status_code == 200
        assert isinstance(r.json(), dict)

    @pytest.mark.parametrize("path", [
        "/api/oven-profiles", "/api/production-plan", "/api/weekly-plan",
        "/api/lab-config", "/api/recipe-temp", "/api/announcements", "/api/news",
    ])
    def test_get_endpoints(self, client, path):
        r = client.get(f"{BASE_URL}{path}", timeout=60)
        assert r.status_code == 200, f"{path} -> {r.status_code} {r.text[:200]}"

    def test_no_mongo_id_leak(self, mikilab_recipes):
        assert all("_id" not in x for x in mikilab_recipes)


# ---------- recipes: seed + german translations ----------
class TestRecipesDE:
    def test_seed_count(self, mikilab_recipes):
        assert len(mikilab_recipes) >= 30, f"only {len(mikilab_recipes)} mikilab recipes"

    def test_de_fields_present_on_most(self, mikilab_recipes):
        with_de = [r for r in mikilab_recipes if (r.get("name_de") or "").strip()]
        ratio = len(with_de) / len(mikilab_recipes)
        assert ratio >= 0.9, f"only {len(with_de)}/{len(mikilab_recipes)} recipes have name_de"

    def test_procedure_and_notes_de(self, mikilab_recipes):
        proc = [r for r in mikilab_recipes if (r.get("procedure") or "").strip()]
        proc_de = [r for r in proc if (r.get("procedure_de") or "").strip()]
        assert len(proc_de) / max(len(proc), 1) >= 0.8, (
            f"procedure_de missing: {len(proc_de)}/{len(proc)}"
        )
        notes = [r for r in mikilab_recipes if (r.get("notes") or "").strip()]
        notes_de = [r for r in notes if (r.get("notes_de") or "").strip()]
        assert len(notes_de) / max(len(notes), 1) >= 0.8, (
            f"notes_de missing: {len(notes_de)}/{len(notes)}"
        )

    @pytest.mark.parametrize("it_name,de_expected", [
        ("Dolce Cipolla", "Süße Zwiebel"),
        ("Bretzel del Maestro", "Bretzel des Meisters"),
    ])
    def test_specific_translations(self, mikilab_recipes, it_name, de_expected):
        match = [r for r in mikilab_recipes if r.get("name") == it_name]
        assert match, f"recipe '{it_name}' not found in seed"
        assert match[0].get("name_de") == de_expected, (
            f"{it_name}: name_de={match[0].get('name_de')!r}"
        )

    def test_de_differs_from_it(self, mikilab_recipes):
        """DE names should not just be copies of IT names."""
        pairs = [r for r in mikilab_recipes if r.get("name_de")]
        identical = [r["name"] for r in pairs if r["name_de"] == r["name"]]
        assert len(identical) <= len(pairs) * 0.35, f"too many untranslated names: {identical[:10]}"


# ---------- CRUD sanity ----------
class TestRecipeCRUD:
    def test_create_update_delete(self, client):
        payload = {
            "collection": "personal", "name": "TEST_iter16", "flour_grams": 1000,
            "water_grams": 650, "salt_grams": 20, "name_de": "TEST_iter16_de",
        }
        c = client.post(f"{BASE_URL}/api/recipes", json=payload, timeout=60)
        assert c.status_code in (200, 201), c.text
        rid = c.json()["id"]
        assert c.json()["name_de"] == "TEST_iter16_de"

        g = client.get(f"{BASE_URL}/api/recipes", params={"collection": "personal"}, timeout=60)
        assert any(x["id"] == rid and x["name"] == "TEST_iter16" for x in g.json())

        u = client.put(f"{BASE_URL}/api/recipes/{rid}", json={"name": "TEST_iter16b"}, timeout=60)
        assert u.status_code == 200, u.text
        assert u.json()["name"] == "TEST_iter16b"

        d = client.delete(f"{BASE_URL}/api/recipes/{rid}", timeout=60)
        assert d.status_code in (200, 204)
        g2 = client.get(f"{BASE_URL}/api/recipes", params={"collection": "personal"}, timeout=60)
        assert not any(x["id"] == rid for x in g2.json())

    def test_update_missing_recipe_404(self, client):
        r = client.put(f"{BASE_URL}/api/recipes/does-not-exist-xyz", json={"name": "x"}, timeout=30)
        assert r.status_code == 404, r.status_code


# ---------- AI vision: mode 'macchine' (SSE) ----------
def _tiny_png_b64():
    # 1x1 white PNG
    return base64.b64encode(bytes.fromhex(
        "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4"
        "890000000a49444154789c6300010000050001"
        "0d0a2db40000000049454e44ae426082"
    )).decode()


class TestVisionMacchine:
    def test_vision_macchine_sse(self, client):
        payload = {"mode": "macchine", "image_base64": _tiny_png_b64(), "lang": "it"}
        with requests.post(f"{BASE_URL}/api/maestro/vision", json=payload,
                           stream=True, timeout=180) as resp:
            assert resp.status_code == 200, resp.text[:300]
            chunks = []
            got_done = False
            for raw in resp.iter_lines(decode_unicode=True):
                if raw:
                    chunks.append(raw)
                    if "done" in raw:
                        got_done = True
                        break
                if len(chunks) > 400:
                    break
        body = "\n".join(chunks)
        assert chunks, "no SSE events received"
        assert '"d"' in body or "'d'" in body or got_done, f"unexpected SSE payload: {body[:300]}"
        assert got_done, f"stream did not emit done: {body[-300:]}"

    def test_vision_invalid_mode_falls_back(self, client):
        payload = {"mode": "nonexistent", "image_base64": _tiny_png_b64(), "lang": "it"}
        r = client.post(f"{BASE_URL}/api/maestro/vision", json=payload, timeout=180)
        assert r.status_code == 200, r.text[:300]
