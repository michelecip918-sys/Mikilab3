"""Iteration 13 tests: Puglia recipes seed, object-storage upload archive,
recipe CRUD with work_phases, and the new 'macchine' vision mode."""
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
API = f"{BASE_URL}/api"

NEW_RECIPES = [
    "Taralli Pugliesi",
    "Pane di Altamura DOP",
    "Pane di Matera IGP",
    "Focaccia Barese",
    "Friselle Pugliesi",
    "Puccia Salentina",
]


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    return s


def _png_bytes():
    """Small PNG with real visual features (gradient + shapes)."""
    try:
        from PIL import Image, ImageDraw
        img = Image.new("RGB", (160, 120))
        d = ImageDraw.Draw(img)
        for x in range(160):
            for y in range(0, 120, 4):
                d.point((x, y), fill=(x, (y * 2) % 255, 120))
        d.rectangle([20, 20, 90, 80], fill=(200, 80, 30), outline=(10, 10, 10), width=3)
        d.ellipse([90, 40, 150, 110], fill=(30, 120, 200), outline=(255, 255, 0), width=2)
        d.line([0, 0, 159, 119], fill=(255, 255, 255), width=2)
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        return buf.getvalue()
    except ImportError:  # pragma: no cover
        pytest.skip("Pillow not available")


# --- Mikilab recipe collection (seed) ---
class TestMikilabRecipes:
    def test_list_recipes(self, client):
        r = client.get(f"{API}/recipes", params={"collection_name": "mikilab"}, timeout=60)
        assert r.status_code == 200, r.text
        data = r.json()
        assert isinstance(data, list)
        assert len(data) == 24, f"expected 24 mikilab recipes, got {len(data)}"
        # no mongo _id leak
        assert all("_id" not in x for x in data)
        # sorted by name
        names = [x["name"] for x in data]
        assert names == sorted(names), "recipes not sorted by name"
        # new Puglia/Basilicata recipes present with procedure
        for want in NEW_RECIPES:
            match = [x for x in data if x["name"] == want]
            assert match, f"missing recipe {want}"
            rec = match[0]
            assert rec.get("procedure"), f"{want} has empty procedure"
            assert isinstance(rec.get("ingredients", []), list)


# --- Object storage image archive ---
class TestUploadArchive:
    def test_upload_and_download_roundtrip(self, client):
        payload = _png_bytes()
        r = client.post(
            f"{API}/upload",
            files={"file": ("TEST_photo.png", payload, "image/png")},
            timeout=90,
        )
        assert r.status_code == 200, r.text
        body = r.json()
        for k in ("url", "path", "id"):
            assert k in body, f"missing {k} in {body}"
        assert body["url"] == f"/api/files/{body['path']}"

        g = client.get(f"{BASE_URL}{body['url']}", timeout=90)
        assert g.status_code == 200, g.text
        assert g.headers.get("content-type", "").startswith("image/png"), g.headers.get("content-type")
        assert len(g.content) > 0

    def test_download_missing_file_404(self, client):
        g = client.get(f"{API}/files/mikilab/uploads/does-not-exist-xyz.png", timeout=30)
        assert g.status_code == 404


# --- Recipe CRUD with work_phases ---
class TestRecipeCRUD:
    created = []

    def test_crud_with_work_phases(self, client):
        phases = [
            {"name": "Autolisi", "time": "30 min", "temp": "22C"},
            {"name": "Puntatura", "time": "1 h", "temp": "24C"},
        ]
        payload = {
            "collection_name": "personal",
            "name": "TEST_Iter13 Pane",
            "procedure": "Impasto e piega",
            "ingredients": [{"name": "Farina", "qty": "1000", "unit": "g"}],
            "work_phases": phases,
        }
        c = client.post(f"{API}/recipes", json=payload, timeout=60)
        assert c.status_code == 200, c.text
        rec = c.json()
        rid = rec["id"]
        TestRecipeCRUD.created.append(rid)
        assert rec["name"] == payload["name"]
        assert rec["work_phases"] == phases

        g = client.get(f"{API}/recipes", params={"collection_name": "personal"}, timeout=60)
        assert g.status_code == 200
        found = [x for x in g.json() if x["id"] == rid]
        assert found, "created recipe not persisted"
        assert found[0]["work_phases"] == phases
        assert found[0]["procedure"] == "Impasto e piega"

        # partial update must not clobber other fields
        u = client.put(f"{API}/recipes/{rid}", json={"notes": "TEST nota"}, timeout=60)
        assert u.status_code == 200, u.text
        upd = u.json()
        assert upd["notes"] == "TEST nota"
        assert upd["work_phases"] == phases
        assert upd["name"] == payload["name"]

        g2 = client.get(f"{API}/recipes", params={"collection_name": "personal"}, timeout=60)
        after = [x for x in g2.json() if x["id"] == rid][0]
        assert after["notes"] == "TEST nota"
        assert after["work_phases"] == phases
        assert after["procedure"] == "Impasto e piega"

        d = client.delete(f"{API}/recipes/{rid}", timeout=60)
        assert d.status_code in (200, 204), d.text
        TestRecipeCRUD.created.remove(rid)
        g3 = client.get(f"{API}/recipes", params={"collection_name": "personal"}, timeout=60)
        assert not [x for x in g3.json() if x["id"] == rid], "recipe still present after delete"

    def test_update_unknown_recipe_404(self, client):
        u = client.put(f"{API}/recipes/nope-iter13", json={"notes": "x"}, timeout=30)
        assert u.status_code == 404


@pytest.fixture(scope="module", autouse=True)
def cleanup(client):
    yield
    for rid in list(TestRecipeCRUD.created):
        client.delete(f"{API}/recipes/{rid}", timeout=30)


# --- Vision: new 'macchine' machine recognition mode ---
class TestVisionMacchine:
    def test_macchine_mode_sse(self, client):
        b64 = base64.b64encode(_png_bytes()).decode()
        r = client.post(
            f"{API}/maestro/vision",
            json={"mode": "macchine", "image_base64": b64, "lang": "it"},
            stream=True,
            timeout=180,
        )
        assert r.status_code == 200, r.text
        chunks, done = [], False
        for line in r.iter_lines(decode_unicode=True):
            if not line or not line.startswith("data: "):
                continue
            obj = json.loads(line[6:])
            if obj.get("done"):
                done = True
                break
            if "d" in obj:
                chunks.append(obj["d"])
        text = "".join(chunks)
        assert done, "stream did not complete with done:true"
        assert len(text) > 30, f"too short response: {text!r}"
        assert "[Errore nell analisi" not in text, text
