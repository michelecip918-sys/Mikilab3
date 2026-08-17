"""Iteration-3 features: weekly plan persistence, vision (photo diagnosis) streaming,
announcement title validation regression."""
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

BREAD_JPEG_PATH = "/tmp/bread.jpg"
BREAD_URL = "https://images.unsplash.com/photo-1732565649629-eb4932a1ec09?fm=jpg&w=800&q=80"


@pytest.fixture(scope="module")
def api_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def bread_jpeg_b64():
    """Real bread photo, resized, encoded as JPEG base64 (per /app/image_testing.md)."""
    from PIL import Image

    if not os.path.exists(BREAD_JPEG_PATH):
        r = requests.get(BREAD_URL, timeout=60)
        if r.status_code != 200:
            pytest.skip("Unable to fetch real test image")
        with open(BREAD_JPEG_PATH, "wb") as f:
            f.write(r.content)
    img = Image.open(BREAD_JPEG_PATH).convert("RGB")
    img.thumbnail((768, 768))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=80)
    return base64.b64encode(buf.getvalue()).decode()


@pytest.fixture(scope="module")
def bread_png_b64(bread_jpeg_b64):
    """Same image transcoded to PNG (MIME re-detected after transformation)."""
    from PIL import Image

    img = Image.open(io.BytesIO(base64.b64decode(bread_jpeg_b64))).convert("RGB")
    img.thumbnail((512, 512))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    data = buf.getvalue()
    assert data[:8] == b"\x89PNG\r\n\x1a\n"
    return base64.b64encode(data).decode()


def stream_vision(mode, image_b64, timeout=180):
    """POST /api/maestro/vision and collect SSE text."""
    text = ""
    saw_done = False
    with requests.post(
        f"{BASE_URL}/api/maestro/vision",
        json={"mode": mode, "image_base64": image_b64},
        stream=True,
        timeout=timeout,
    ) as r:
        assert r.status_code == 200, r.text[:500]
        assert "text/event-stream" in r.headers.get("content-type", "")
        for line in r.iter_lines(decode_unicode=True):
            if line is None or line == "":
                continue
            if not line.startswith("data:"):
                continue
            payload = json.loads(line.split(":", 1)[1].strip())
            if payload.get("done"):
                saw_done = True
                break
            text += payload.get("d", "")
    return text, saw_done


# --- Weekly plan ---
class TestWeeklyPlan:
    def test_get_returns_null_or_plan(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/weekly-plan")
        assert r.status_code == 200
        data = r.json()
        assert data is None or "items" in data

    def test_put_upsert_and_persist(self, api_client):
        # use real recipe ids from the recipe list
        recipes = api_client.get(
            f"{BASE_URL}/api/recipes", params={"collection_name": "mikilab"}
        ).json()
        assert len(recipes) >= 1
        r0 = recipes[0]
        payload = {
            "items": [
                {"id": "TEST_w1", "day": "lun", "recipe_id": r0["id"],
                 "recipe_name": r0["name"], "pieces": 10, "grams_per_piece": 800},
                {"id": "TEST_w2", "day": "sab", "recipe_id": r0["id"],
                 "recipe_name": r0["name"], "pieces": 4, "grams_per_piece": 250},
            ]
        }
        r = api_client.put(f"{BASE_URL}/api/weekly-plan", json=payload)
        assert r.status_code == 200, r.text
        saved = r.json()
        assert len(saved["items"]) == 2
        assert saved["items"][0]["id"] == "TEST_w1"
        assert saved["items"][0]["day"] == "lun"
        assert saved["items"][0]["pieces"] == 10
        assert saved["items"][1]["grams_per_piece"] == 250
        assert isinstance(saved["updated_at"], str) and saved["updated_at"]

        g = api_client.get(f"{BASE_URL}/api/weekly-plan")
        assert g.status_code == 200
        got = g.json()
        assert "_id" not in got and "_key" not in got
        assert [i["id"] for i in got["items"]] == ["TEST_w1", "TEST_w2"]
        assert got["items"][1]["recipe_name"] == r0["name"]

    def test_put_overwrites_single_doc(self, api_client):
        p2 = {"items": [{"id": "TEST_only", "day": "mer", "recipe_id": "x",
                         "recipe_name": "TEST_R", "pieces": 2, "grams_per_piece": 500}]}
        assert api_client.put(f"{BASE_URL}/api/weekly-plan", json=p2).status_code == 200
        got = api_client.get(f"{BASE_URL}/api/weekly-plan").json()
        assert len(got["items"]) == 1
        assert got["items"][0]["id"] == "TEST_only"

    def test_put_empty_items_allowed(self, api_client):
        r = api_client.put(f"{BASE_URL}/api/weekly-plan", json={"items": []})
        assert r.status_code == 200
        assert api_client.get(f"{BASE_URL}/api/weekly-plan").json()["items"] == []

    def test_put_invalid_item_rejected(self, api_client):
        # missing required recipe_id/day
        r = api_client.put(f"{BASE_URL}/api/weekly-plan",
                           json={"items": [{"pieces": 3}]})
        assert r.status_code == 422

    def test_item_id_autogenerated_when_missing(self, api_client):
        r = api_client.put(f"{BASE_URL}/api/weekly-plan", json={"items": [
            {"day": "gio", "recipe_id": "rid", "recipe_name": "TEST_Auto"}]})
        assert r.status_code == 200
        item = r.json()["items"][0]
        assert isinstance(item["id"], str) and len(item["id"]) > 10
        assert item["pieces"] == 1 and item["grams_per_piece"] == 100


# --- Vision / photo diagnosis (AI, slow) ---
class TestVision:
    def test_vision_difetti_jpeg(self, bread_jpeg_b64):
        text, done = stream_vision("difetti", bread_jpeg_b64)
        assert done, "stream did not terminate with [DONE]"
        assert len(text.strip()) > 80, f"too short: {text!r}"
        assert "Errore nell" not in text, text[:300]
        low = text.lower()
        assert any(w in low for w in ["pane", "crosta", "mollica", "alveolatura", "cottura"]), text[:300]

    def test_vision_ingredienti_png(self, bread_png_b64):
        text, done = stream_vision("ingredienti", bread_png_b64)
        assert done
        assert len(text.strip()) > 80, f"too short: {text!r}"
        assert "Errore nell" not in text, text[:300]
        low = text.lower()
        assert any(w in low for w in ["farina", "ingredient", "acqua", "lievito"]), text[:300]

    def test_vision_accepts_data_url_prefix(self, bread_jpeg_b64):
        text, done = stream_vision("difetti", f"data:image/jpeg;base64,{bread_jpeg_b64}")
        assert done
        assert "Errore nell" not in text, text[:300]
        assert len(text.strip()) > 50

    def test_vision_missing_fields_422(self, api_client):
        r = api_client.post(f"{BASE_URL}/api/maestro/vision", json={"mode": "difetti"})
        assert r.status_code == 422

    def test_vision_invalid_image_does_not_500(self):
        r = requests.post(f"{BASE_URL}/api/maestro/vision",
                          json={"mode": "difetti", "image_base64": "not-a-real-image"},
                          stream=True, timeout=120)
        assert r.status_code == 200
        body = r.text
        assert '"done"' in body or "'done'" in body
        r.close()


# --- Announcements title validation regression ---
class TestAnnouncementValidation:
    def test_create_empty_title_422(self, api_client):
        r = api_client.post(f"{BASE_URL}/api/announcements",
                            json={"title": "   ", "details": "x"})
        assert r.status_code == 422

    def test_create_trims_title_and_delete(self, api_client):
        r = api_client.post(f"{BASE_URL}/api/announcements",
                            json={"title": "  TEST_Annuncio  ", "details": "d"})
        assert r.status_code == 200, r.text
        ann = r.json()
        assert ann["title"] == "TEST_Annuncio"
        aid = ann["id"]

        # update with blank title rejected
        u = api_client.put(f"{BASE_URL}/api/announcements/{aid}",
                           json={"title": "", "details": "d"})
        assert u.status_code == 422

        # delete works, second delete 404
        d = api_client.delete(f"{BASE_URL}/api/announcements/{aid}")
        assert d.status_code == 200 and d.json().get("success") is True
        assert api_client.delete(f"{BASE_URL}/api/announcements/{aid}").status_code == 404
        assert aid not in [a["id"] for a in api_client.get(f"{BASE_URL}/api/announcements").json()]


@pytest.fixture(scope="module", autouse=True)
def cleanup(api_client):
    yield
    # reset weekly plan doc to empty (leave DB with no meaningful saved plan)
    api_client.put(f"{BASE_URL}/api/weekly-plan", json={"items": []})
    for a in api_client.get(f"{BASE_URL}/api/announcements").json():
        if a["title"].startswith("TEST_"):
            api_client.delete(f"{BASE_URL}/api/announcements/{a['id']}")
