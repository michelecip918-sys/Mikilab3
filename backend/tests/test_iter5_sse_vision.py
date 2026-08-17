"""Iteration 5 backend tests.

Modules covered:
- SSE JSON contract for POST /api/maestro/chat and /api/maestro/vision
  (every data line is JSON-parseable: {"d": str} deltas, terminated by {"done": true})
- Markdown/newline preservation across the stream (blank lines survive)
- Vision language fix: lang='de' must answer in German for both modes
"""
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
API = base_url.rstrip("/") + "/api"

IT_WORDS = ["il ", "la ", "di ", "che ", "per ", "una ", "pane", "farina", "impasto", "lievito", "cottura"]
DE_WORDS = ["der ", "die ", "das ", "und ", "ist ", "nicht", "wasser", "mehl", "brot", "backen", "kann", "eine "]


def _score(text, words):
    low = text.lower()
    return sum(low.count(w) for w in words)


def detect_lang(text):
    it, de = _score(text, IT_WORDS), _score(text, DE_WORDS)
    return ("de" if de > it else "it"), it, de


def collect_sse(resp, max_chars=8000):
    """Strictly validate the JSON SSE contract while collecting the text."""
    raw_body = ""
    deltas = []
    done = False
    bad_lines = []
    for chunk in resp.iter_content(chunk_size=None, decode_unicode=True):
        if not chunk:
            continue
        raw_body += chunk
        if len(raw_body) > max_chars and done:
            break
        if sum(len(d) for d in deltas) > max_chars:
            break
        # parse complete frames
        while "\n\n" in raw_body:
            frame, raw_body = raw_body.split("\n\n", 1)
            frame = frame.strip()
            if not frame:
                continue
            if not frame.startswith("data:"):
                bad_lines.append(frame)
                continue
            payload_raw = frame[len("data:"):].strip()
            try:
                payload = json.loads(payload_raw)
            except Exception:
                bad_lines.append(payload_raw[:80])
                continue
            if payload.get("done") is True:
                done = True
                continue
            deltas.append(payload.get("d", ""))
        if done:
            break
    return "".join(deltas), done, bad_lines


@pytest.fixture(scope="module")
def api_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def bread_jpeg_b64():
    """Real JPEG with visual features (crust gradient, crumb holes, edges, shadow)."""
    from PIL import Image, ImageDraw
    import random

    random.seed(11)
    w, h = 480, 360
    img = Image.new("RGB", (w, h), (238, 226, 200))
    d = ImageDraw.Draw(img)
    for y in range(60, 300):
        shade = int(150 - (y - 60) * 0.25)
        d.line([(70, y), (410, y)], fill=(shade + 60, shade, max(shade - 50, 20)))
    d.ellipse([70, 40, 410, 130], fill=(176, 120, 60), outline=(90, 55, 25), width=4)
    d.ellipse([60, 250, 420, 320], fill=(120, 80, 40))
    for _ in range(220):
        cx, cy = random.randint(95, 385), random.randint(150, 285)
        r = random.randint(3, 11)
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(232, 220, 190))
    d.line([(110, 95), (370, 105)], fill=(70, 40, 15), width=6)
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=88)
    data = buf.getvalue()
    assert data[:3] == b"\xff\xd8\xff", "not a real JPEG"
    return base64.b64encode(data).decode()


# --- SSE JSON contract ------------------------------------------------------
class TestSSEJsonContract:
    def test_chat_frames_are_json(self, api_client):
        r = api_client.post(f"{API}/maestro/chat", json={
            "session_id": "TEST_iter5-json",
            "message": "In una riga: qual e' l'idratazione tipica della ciabatta?",
            "lang": "it",
        }, stream=True, timeout=180)
        assert r.status_code == 200, r.text[:300]
        assert "text/event-stream" in r.headers.get("content-type", "")
        text, done, bad = collect_sse(r)
        assert not bad, f"Non-JSON SSE frames found: {bad[:3]}"
        assert done, "stream never emitted {'done': true}"
        assert len(text.strip()) > 20, f"reply too short: {text!r}"

    def test_chat_markdown_blank_lines_survive(self, api_client):
        r = api_client.post(f"{API}/maestro/chat", json={
            "session_id": "TEST_iter5-md",
            "message": ("Rispondi in markdown: un titolo con ## , un paragrafo, "
                        "poi una lista di 3 punti con '-' e una parola in **grassetto**."),
            "lang": "it",
        }, stream=True, timeout=180)
        assert r.status_code == 200
        text, done, bad = collect_sse(r)
        assert not bad, f"Non-JSON SSE frames found: {bad[:3]}"
        assert done
        assert "\n\n" in text, f"Blank-line paragraph separators lost: {text[:400]!r}"
        assert "\n" in text, "newlines lost in stream"
        assert "##" in text and "- " in text, f"markdown missing: {text[:400]!r}"

    def test_vision_frames_are_json(self, api_client, bread_jpeg_b64):
        r = api_client.post(f"{API}/maestro/vision", json={
            "mode": "difetti", "image_base64": bread_jpeg_b64, "lang": "it",
        }, stream=True, timeout=210)
        assert r.status_code == 200
        text, done, bad = collect_sse(r)
        assert not bad, f"Non-JSON SSE frames found: {bad[:3]}"
        assert done
        assert "Errore nell" not in text, text[:200]
        assert "\n" in text, "vision stream lost newlines"


# --- Vision language fix ---------------------------------------------------
class TestVisionLanguage:
    def _vision(self, api_client, mode, lang, b64):
        r = api_client.post(f"{API}/maestro/vision", json={
            "mode": mode, "image_base64": b64, "lang": lang,
        }, stream=True, timeout=210)
        assert r.status_code == 200, r.text[:300]
        text, done, bad = collect_sse(r, max_chars=5000)
        assert not bad, f"Non-JSON SSE frames: {bad[:3]}"
        assert "Errore nell" not in text, "vision returned error placeholder"
        assert len(text.strip()) > 40, f"empty vision result: {text!r}"
        return text

    def test_vision_difetti_de_is_german(self, api_client, bread_jpeg_b64):
        text = self._vision(api_client, "difetti", "de", bread_jpeg_b64)
        lang, it, de = detect_lang(text)
        assert lang == "de", f"expected German (it={it}, de={de}): {text[:400]}"

    def test_vision_difetti_it_is_italian(self, api_client, bread_jpeg_b64):
        text = self._vision(api_client, "difetti", "it", bread_jpeg_b64)
        lang, it, de = detect_lang(text)
        assert lang == "it", f"expected Italian (it={it}, de={de}): {text[:400]}"

    def test_vision_ingredienti_de_is_german(self, api_client, bread_jpeg_b64):
        text = self._vision(api_client, "ingredienti", "de", bread_jpeg_b64)
        lang, it, de = detect_lang(text)
        assert lang == "de", f"expected German (it={it}, de={de}): {text[:400]}"

    def test_vision_ingredienti_it_is_italian(self, api_client, bread_jpeg_b64):
        text = self._vision(api_client, "ingredienti", "it", bread_jpeg_b64)
        lang, it, de = detect_lang(text)
        assert lang == "it", f"expected Italian (it={it}, de={de}): {text[:400]}"


# --- Baseline data sanity (used by frontend planning tools) ----------------
class TestBaselineData:
    def test_mikilab_recipes_have_rest_hours(self, api_client):
        r = api_client.get(f"{API}/recipes", params={"collection_name": "mikilab"}, timeout=30)
        assert r.status_code == 200
        recipes = r.json()
        assert len(recipes) >= 3, f"expected >=3 seeded mikilab recipes, got {len(recipes)}"
        for rec in recipes:
            assert "_id" not in rec
            assert "bulk_fermentation_hours" in rec and "proofing_hours" in rec
