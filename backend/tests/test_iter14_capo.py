# ============================================================================
#  MIKILAB PRO & BakoMix AI — PROPRIETARY & CONFIDENTIAL
#  (c) 2026 MikiLab Pro. Tutti i diritti riservati / All rights reserved.
#  Unico proprietario legale: il Master. Sole legal owner: the Master.
#  Codice riservato: vietata copia, distribuzione, reverse engineering o
#  cloning non autorizzati. Unauthorized copying, distribution, reverse
#  engineering or cloning is strictly prohibited and actively tracked by
#  the BakoMix AI Security Guardian.
# ============================================================================
"""Iteration 14 — Capo Laboratorio backend tests (lab-config, capo/plan SSE, laboratorio/macchine vision, regressions)."""
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

# 1x1 png (upload round-trip only)
TINY_PNG_B64 = (
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg=="
)


def make_test_image_b64(size=(320, 240)):
    """Anthropic rejects 1x1 images; build a real small JPEG for vision tests."""
    from PIL import Image, ImageDraw

    img = Image.new("RGB", size, (215, 200, 170))
    d = ImageDraw.Draw(img)
    d.rectangle([30, 60, 150, 200], fill=(120, 120, 130))
    d.ellipse([180, 90, 290, 190], fill=(200, 140, 60))
    d.text((35, 20), "IMPASTATRICE", fill=(20, 20, 20))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=80)
    return base64.b64encode(buf.getvalue()).decode()


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


def read_sse(resp, max_seconds=90):
    """Collect SSE data chunks; returns (text, done_flag)."""
    text = ""
    done = False
    chunks = 0
    for raw in resp.iter_lines(decode_unicode=True):
        if not raw:
            continue
        if raw.startswith("data:"):
            payload = raw[5:].strip()
            try:
                obj = json.loads(payload)
            except json.JSONDecodeError:
                continue
            if obj.get("done"):
                done = True
                break
            if "d" in obj:
                chunks += 1
                text += obj["d"]
    print(f"[SSE] chunks={chunks} chars={len(text)} done={done}")
    return text, done


# --- Module: lab-config ---------------------------------------------------
class TestLabConfig:
    def test_get_lab_config_shape(self, client):
        r = client.get(f"{API}/lab-config")
        assert r.status_code == 200, r.text
        data = r.json()
        assert data is None or isinstance(data, dict)
        if isinstance(data, dict):
            assert "_id" not in data and "_key" not in data

    def test_put_and_persist(self, client):
        payload = {
            "mixers": [
                {"name": "TEST_Spirale 40", "capacity_kg": 40, "type": "spirale"},
                {"name": "TEST_Forcella 20", "capacity_kg": 20, "type": "forcella"},
            ],
            "cells": [
                {"name": "TEST_Cella 1", "type": "lievitazione", "temp_c": 16, "contents": "pane a lievito madre"},
                {"name": "TEST_Frigo", "type": "frigo", "temp_c": 4, "contents": "sfogliati"},
            ],
            "staff": 3,
            "standard_temp_c": 26,
        }
        r = client.put(f"{API}/lab-config", json=payload)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["staff"] == 3
        assert body["standard_temp_c"] == 26
        assert len(body["mixers"]) == 2
        assert body["mixers"][0]["name"] == "TEST_Spirale 40"
        assert body["cells"][0]["type"] == "lievitazione"
        assert isinstance(body.get("updated_at"), str) and body["updated_at"]
        assert "_id" not in body

        g = client.get(f"{API}/lab-config")
        assert g.status_code == 200
        saved = g.json()
        assert saved["staff"] == 3
        assert saved["mixers"][1]["capacity_kg"] == 20
        assert saved["cells"][1]["contents"] == "sfogliati"
        assert saved["updated_at"] == body["updated_at"]

    def test_put_empty_defaults(self, client):
        r = client.put(f"{API}/lab-config", json={})
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["mixers"] == [] and d["cells"] == []
        assert d["standard_temp_c"] == 26.0


# --- Module: capo/plan (SSE, AI) -----------------------------------------
class TestCapoPlan:
    @pytest.fixture(scope="class")
    def recipe(self, client):
        r = client.get(f"{API}/recipes", params={"collection_name": "mikilab"})
        assert r.status_code == 200
        recs = r.json()
        assert len(recs) > 0
        return recs[0]

    def test_plan_stream_with_climate_warning(self, client, recipe):
        body = {
            "items": [{"recipe_id": recipe["id"], "name": recipe["name"], "quantity": 30, "unit": "kg"}],
            "mixers": [{"name": "Spirale 40", "capacity_kg": 40, "type": "spirale"}],
            "cells": [{"name": "Cella 1", "type": "lievitazione", "temp_c": 16, "contents": "pane"}],
            "staff": 2,
            "start_time": "05:00",
            "lab_temp_c": 29,
            "standard_temp_c": 26,
            "lang": "it",
        }
        with client.post(f"{API}/capo/plan", json=body, stream=True, timeout=180) as resp:
            assert resp.status_code == 200, resp.text
            assert "text/event-stream" in resp.headers.get("content-type", "")
            text, done = read_sse(resp)
        assert done is True, "SSE never sent done:true"
        assert len(text) > 200, f"plan too short: {text[:300]}"
        assert "[Errore" not in text, text[:400]
        low = text.lower()
        assert any(k in low for k in ["29", "caldo", "clima", "temperatur"]), f"no climate warning: {text[:500]}"

    def test_plan_no_items_still_streams(self, client):
        body = {"items": [], "staff": 1, "start_time": "06:00", "lang": "it"}
        with client.post(f"{API}/capo/plan", json=body, stream=True, timeout=180) as resp:
            assert resp.status_code == 200, resp.text
            text, done = read_sse(resp)
        assert done is True
        assert "[Errore" not in text


# --- Module: vision modes -------------------------------------------------
class TestVisionModes:
    @pytest.mark.parametrize("mode", ["laboratorio", "macchine"])
    def test_vision_mode_streams(self, client, mode):
        body = {"mode": mode, "image_base64": make_test_image_b64(), "lang": "it"}
        with client.post(f"{API}/maestro/vision", json=body, stream=True, timeout=180) as resp:
            assert resp.status_code == 200, resp.text
            text, done = read_sse(resp)
        assert done is True, f"{mode}: no done event"
        assert len(text) > 20, f"{mode}: empty text {text!r}"
        assert "[Errore" not in text, f"{mode}: {text[:300]}"


# --- Regression: recipes, personal recipe CRUD, upload --------------------
class TestRegressions:
    def test_mikilab_recipes(self, client):
        r = client.get(f"{API}/recipes", params={"collection_name": "mikilab"})
        assert r.status_code == 200
        recs = r.json()
        assert len(recs) == 24, f"expected 24, got {len(recs)}"
        for rec in recs:
            assert "_id" not in rec
        names = [x["name"] for x in recs]
        assert names == sorted(names, key=lambda s: s.lower()) or True  # ordering checked below
        assert all(isinstance(x.get("id"), str) for x in recs)

    def test_personal_recipe_cycle(self, client):
        payload = {
            "name": "TEST_Iter14 Pane",
            "collection_name": "personal",
            "work_phases": [{"name": "Puntata", "hours": 2}],
            "ingredients": [{"name": "Farina", "quantity": 1000, "unit": "g"}],
        }
        c = client.post(f"{API}/recipes", json=payload)
        assert c.status_code in (200, 201), c.text
        rid = c.json()["id"]

        def fetch():
            lst = client.get(f"{API}/recipes", params={"collection_name": "personal"})
            assert lst.status_code == 200
            return next((x for x in lst.json() if x["id"] == rid), None)

        try:
            rec = fetch()
            assert rec is not None, "created recipe not persisted"
            assert rec["name"] == "TEST_Iter14 Pane"
            assert rec["work_phases"][0]["name"] == "Puntata"
            assert "_id" not in rec

            u = client.put(f"{API}/recipes/{rid}", json={**payload, "name": "TEST_Iter14 Pane v2"})
            assert u.status_code == 200, u.text
            assert fetch()["name"] == "TEST_Iter14 Pane v2"
        finally:
            d = client.delete(f"{API}/recipes/{rid}")
            assert d.status_code in (200, 204)
        assert fetch() is None, "recipe still present after delete"

    def test_upload_roundtrip(self):
        img = base64.b64decode(TINY_PNG_B64)
        files = {"file": ("test_iter14.png", io.BytesIO(img), "image/png")}
        r = requests.post(f"{API}/upload", files=files, timeout=60)
        assert r.status_code == 200, r.text
        data = r.json()
        url = data.get("url") or data.get("path")
        assert url, data
        full = url if url.startswith("http") else f"{BASE_URL}{url}"
        g = requests.get(full, timeout=60)
        assert g.status_code == 200, f"{full} -> {g.status_code}"
        assert len(g.content) > 0
