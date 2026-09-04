"""Iteration 178 — TTS translation before synthesis + core regression (auth, floor-plan, recipes)."""
import os
import glob
import time

import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
base_url = os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")
if not base_url:
    raise RuntimeError("REACT_APP_BACKEND_URL missing")
BASE_URL = base_url.rstrip("/")
API = f"{BASE_URL}/api"

TR_DIR = "/tmp/mikilab_tts_tr"
IT_TEXT = "Ciao Capo, prepara trenta baguette."


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


def _cache_files():
    return set(glob.glob(os.path.join(TR_DIR, "*.txt")))


def _speak(client, lang, text=IT_TEXT):
    before = _cache_files()
    r = client.post(f"{API}/tts/speak", json={"text": text, "lang": lang, "voice": "bakemix"}, timeout=180)
    time.sleep(1)
    new = _cache_files() - before
    return r, new


# ---- TTS translation ----
class TestTTSTranslation:
    def test_de_translation_cache(self, client):
        r, new = _speak(client, "de")
        assert r.status_code in (200, 424), f"unexpected {r.status_code}: {r.text[:300]}"
        if r.status_code == 200:
            assert r.headers.get("content-type", "").startswith("audio/mpeg")
            assert len(r.content) > 1000
        # translation cache must exist for this text+lang (new or pre-existing)
        files = _cache_files()
        assert files, "no translation cache files created in /tmp/mikilab_tts_tr"
        contents = []
        for f in (new or files):
            try:
                contents.append(open(f, encoding="utf-8").read())
            except Exception:
                pass
        joined = " ".join(contents).lower()
        assert joined.strip(), "translation cache empty"
        # German indicators, and NOT the original Italian sentence
        assert IT_TEXT.lower() not in joined, f"text not translated: {joined[:200]}"
        assert any(k in joined for k in ["chef", "baguette", "dreißig", "bereite", "hallo"]), joined[:200]

    def test_en_translation(self, client):
        r, new = _speak(client, "en")
        assert r.status_code in (200, 424)
        found = False
        for f in _cache_files():
            txt = open(f, encoding="utf-8").read().lower()
            if "prepare" in txt or "thirty" in txt or "boss" in txt or "make thirty" in txt:
                found = True
        assert found, "no English translation cache content found"

    def test_fr_translation(self, client):
        r, _ = _speak(client, "fr")
        assert r.status_code in (200, 424)
        found = False
        for f in _cache_files():
            txt = open(f, encoding="utf-8").read().lower()
            if "prépare" in txt or "prepare" in txt and "baguettes" in txt:
                found = True
        assert found, "no French translation cache content found"

    def test_it_no_translation(self, client):
        before = _cache_files()
        r = client.post(f"{API}/tts/speak", json={"text": IT_TEXT, "lang": "it", "voice": "bakemix"}, timeout=120)
        assert r.status_code in (200, 424)
        time.sleep(1)
        assert not (_cache_files() - before), "translation cache created for lang=it (should pass through)"

    def test_empty_text_400(self, client):
        r = client.post(f"{API}/tts/speak", json={"text": "   ", "lang": "de", "voice": "bakemix"}, timeout=60)
        assert r.status_code == 400


# ---- Auth (Capo login) ----
class TestAuth:
    def test_login_capo(self, client):
        r = client.post(f"{API}/auth/login", json={"email": "admin@mikilab.de", "password": "Mikilab2026!"}, timeout=60)
        assert r.status_code == 200, r.text[:300]
        data = r.json()
        assert data.get("user", {}).get("email") == "admin@mikilab.de"
        assert '"_id"' not in r.text and "'_id'" not in r.text

    def test_login_wrong_password(self, client):
        r = requests.post(f"{API}/auth/login", json={"email": "admin@mikilab.de", "password": "wrong-pass-xyz"}, timeout=60)
        assert r.status_code in (400, 401, 403, 429), r.status_code


# ---- Floor plan (used by MamoAssistant + OrdiniExtra) ----
class TestFloorPlan:
    def test_get_public(self, client):
        r = client.get(f"{API}/lab/floor-plan", timeout=60)
        assert r.status_code == 200, r.text[:300]
        assert isinstance(r.json(), dict)
        assert "_id" not in r.text


# ---- Recipes ----
class TestRecipes:
    def test_list_recipes(self, client):
        r = client.get(f"{API}/recipes", timeout=60)
        assert r.status_code == 200, r.text[:300]
        data = r.json()
        items = data if isinstance(data, list) else data.get("items") or data.get("recipes")
        assert items and len(items) > 0
        assert "_id" not in r.text
