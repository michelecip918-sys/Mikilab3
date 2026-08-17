"""Iteration 4 backend tests: bilingual (IT/DE) AI endpoints.

Modules covered:
- POST /api/maestro/chat with lang='it' | 'de' | missing | invalid
- POST /api/maestro/vision with lang='it' | 'de' (real JPEG base64)
- Regression: weekly-plan persistence used by print/share feature
"""
import base64
import io
import json
import os
import re

import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
base_url = os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")
if not base_url:
    raise RuntimeError("REACT_APP_BACKEND_URL is missing")
BASE_URL = base_url.rstrip("/")
API = f"{BASE_URL}/api"

IT_WORDS = ["il ", "la ", "che ", "per ", "una ", "sono", "acqua", "farina", "pane", "cottura", "questo"]
DE_WORDS = ["der ", "die ", "das ", "und ", "ist ", "nicht", "wasser", "mehl", "brot", "backen", "kann"]


def _score(text, words):
    low = text.lower()
    return sum(low.count(w) for w in words)


def detect_lang(text):
    it, de = _score(text, IT_WORDS), _score(text, DE_WORDS)
    return "de" if de > it else "it", it, de


def sse_collect(resp, max_chars=4000):
    """Collect SSE JSON payload deltas ({"d": str} / {"done": true}) from a stream."""
    out = []
    total = 0
    for raw in resp.iter_lines(decode_unicode=True):
        if not raw or not raw.startswith("data:"):
            continue
        try:
            payload = json.loads(raw.split(":", 1)[1].strip())
        except Exception:
            continue
        if payload.get("done"):
            break
        delta = payload.get("d", "")
        out.append(delta)
        total += len(delta)
        if total > max_chars:
            break
    return "".join(out)


@pytest.fixture(scope="module")
def api_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def bread_jpeg_b64():
    """Real JPEG with visual features (crust-like gradients, crumb holes, edges)."""
    from PIL import Image, ImageDraw
    import random

    random.seed(7)
    w, h = 480, 360
    img = Image.new("RGB", (w, h), (238, 226, 200))
    d = ImageDraw.Draw(img)
    # loaf body with gradient (edges + shading)
    for y in range(60, 300):
        shade = int(150 - (y - 60) * 0.25)
        d.line([(70, y), (410, y)], fill=(shade + 60, shade, max(shade - 50, 20)))
    d.ellipse([70, 40, 410, 130], fill=(176, 120, 60), outline=(90, 55, 25), width=4)
    d.ellipse([70, 230, 410, 320], fill=(140, 92, 46), outline=(70, 40, 18), width=4)
    # scoring cuts
    for i in range(4):
        x = 120 + i * 70
        d.line([(x, 90), (x + 30, 260)], fill=(240, 220, 180), width=6)
    # crumb holes / texture
    for _ in range(220):
        cx, cy = random.randint(80, 400), random.randint(80, 290)
        r = random.randint(2, 9)
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(random.randint(190, 235),) * 3)
    # seeds on top
    for _ in range(60):
        cx, cy = random.randint(90, 395), random.randint(55, 120)
        d.ellipse([cx, cy, cx + 4, cy + 3], fill=(60, 45, 25))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=88)
    return base64.b64encode(buf.getvalue()).decode()


# --- Maestro chat: language directive -------------------------------------
class TestChatLang:
    def _ask(self, api_client, lang, session_suffix, payload_extra=None):
        payload = {
            "session_id": f"TEST_iter4-{session_suffix}",
            "message": "In due frasi: come si migliora l'alveolatura del pane?",
        }
        if lang is not None:
            payload["lang"] = lang
        if payload_extra:
            payload.update(payload_extra)
        r = api_client.post(f"{API}/maestro/chat", json=payload, stream=True, timeout=120)
        assert r.status_code == 200, r.text[:300]
        assert "text/event-stream" in r.headers.get("content-type", "")
        text = sse_collect(r)
        assert len(text.strip()) > 40, f"Empty/short stream: {text!r}"
        return text

    def test_chat_lang_de_returns_german(self, api_client):
        text = self._ask(api_client, "de", "de")
        lang, it, de = detect_lang(text)
        assert lang == "de", f"Expected German (it={it}, de={de}): {text[:400]}"

    def test_chat_lang_it_returns_italian(self, api_client):
        text = self._ask(api_client, "it", "it")
        lang, it, de = detect_lang(text)
        assert lang == "it", f"Expected Italian (it={it}, de={de}): {text[:400]}"

    def test_chat_lang_default_is_italian(self, api_client):
        text = self._ask(api_client, None, "default")
        lang, it, de = detect_lang(text)
        assert lang == "it", f"Default should be Italian (it={it}, de={de}): {text[:400]}"

    def test_chat_invalid_lang_falls_back_no_error(self, api_client):
        text = self._ask(api_client, "xx", "invalid")
        assert "[Errore" not in text

    def test_chat_history_persisted(self, api_client):
        sid = "TEST_iter4-hist"
        r = api_client.post(f"{API}/maestro/chat", json={"session_id": sid, "message": "Ciao", "lang": "de"},
                            stream=True, timeout=120)
        assert r.status_code == 200
        sse_collect(r)
        h = api_client.get(f"{API}/maestro/history/{sid}", timeout=30)
        assert h.status_code == 200
        docs = h.json()
        assert len(docs) >= 2
        assert docs[0]["role"] == "user" and docs[0]["content"] == "Ciao"
        assert docs[-1]["role"] == "assistant" and len(docs[-1]["content"]) > 0
        assert all("_id" not in d for d in docs)

    def test_chat_markdown_present_in_reply(self, api_client):
        r = api_client.post(f"{API}/maestro/chat", json={
            "session_id": "TEST_iter4-md",
            "message": "Elenca in markdown con un titolo (##), grassetto e una lista di 3 punti i passaggi base del pane.",
            "lang": "it",
        }, stream=True, timeout=150)
        assert r.status_code == 200
        text = sse_collect(r, max_chars=6000)
        assert re.search(r"(^|\n)\s*#{1,3} ", text) or "**" in text or re.search(r"(^|\n)\s*[-*] ", text), \
            f"No markdown syntax found: {text[:400]}"


# --- Vision: language directive -------------------------------------------
class TestVisionLang:
    def _vision(self, api_client, mode, lang, b64):
        r = api_client.post(f"{API}/maestro/vision",
                            json={"mode": mode, "image_base64": b64, "lang": lang},
                            stream=True, timeout=180)
        assert r.status_code == 200, r.text[:300]
        text = sse_collect(r, max_chars=5000)
        assert "[Errore nell" not in text, "Vision stream returned error placeholder"
        assert len(text.strip()) > 40, f"Empty vision result: {text!r}"
        return text

    def test_vision_difetti_de(self, api_client, bread_jpeg_b64):
        text = self._vision(api_client, "difetti", "de", bread_jpeg_b64)
        lang, it, de = detect_lang(text)
        assert lang == "de", f"Expected German vision (it={it}, de={de}): {text[:400]}"

    def test_vision_difetti_it(self, api_client, bread_jpeg_b64):
        text = self._vision(api_client, "difetti", "it", bread_jpeg_b64)
        lang, it, de = detect_lang(text)
        assert lang == "it", f"Expected Italian vision (it={it}, de={de}): {text[:400]}"

    def test_vision_ingredienti_de(self, api_client, bread_jpeg_b64):
        text = self._vision(api_client, "ingredienti", "de", bread_jpeg_b64)
        lang, it, de = detect_lang(text)
        assert lang == "de", f"Expected German vision (it={it}, de={de}): {text[:400]}"

    def test_vision_accepts_data_url_prefix(self, api_client, bread_jpeg_b64):
        text = self._vision(api_client, "difetti", "it", f"data:image/jpeg;base64,{bread_jpeg_b64}")
        assert len(text) > 40


# --- Weekly plan persistence (backing the print/share feature) ------------
class TestWeeklyPlanForPrint:
    def test_save_and_get_weekly_plan(self, api_client):
        recipes = api_client.get(f"{API}/recipes", params={"collection": "mikilab"}, timeout=30).json()
        assert len(recipes) > 0, "No mikilab recipes seeded"
        r0 = recipes[0]
        payload = {"items": [{
            "id": "TEST_iter4-item-1", "day": "lun", "recipe_id": r0["id"],
            "recipe_name": r0["name"], "pieces": 12, "grams_per_piece": 500,
        }]}
        put = api_client.put(f"{API}/weekly-plan", json=payload, timeout=30)
        assert put.status_code == 200, put.text[:300]
        saved = put.json()
        assert saved["items"][0]["pieces"] == 12
        assert saved["items"][0]["grams_per_piece"] == 500

        got = api_client.get(f"{API}/weekly-plan", timeout=30).json()
        assert got and got.get("items")
        item = got["items"][0]
        assert item["recipe_id"] == r0["id"]
        assert item["pieces"] == 12 and item["grams_per_piece"] == 500
        assert "_id" not in got

    def test_cleanup_weekly_plan(self, api_client):
        put = api_client.put(f"{API}/weekly-plan", json={"items": []}, timeout=30)
        assert put.status_code == 200
        got = api_client.get(f"{API}/weekly-plan", timeout=30).json()
        assert (got or {}).get("items", []) == []
