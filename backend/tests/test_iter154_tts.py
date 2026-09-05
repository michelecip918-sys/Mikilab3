# ============================================================================
#  MIKILAB PRO & BakoMix AI — PROPRIETARY & CONFIDENTIAL
#  (c) 2026 MikiLab Pro. Tutti i diritti riservati / All rights reserved.
#  Unico proprietario legale: il Master. Sole legal owner: the Master.
#  Codice riservato: vietata copia, distribuzione, reverse engineering o
#  cloning non autorizzati. Unauthorized copying, distribution, reverse
#  engineering or cloning is strictly prohibited and actively tracked by
#  the BakoMix AI Security Guardian.
# ============================================================================
"""Iteration 154 — POST /api/tts (ElevenLabs voices michele/momy)."""
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


@pytest.mark.parametrize("voice", ["michele", "momy", "momi", "lab"])
def test_tts_accepts_voice(client, voice):
    r = client.post(f"{BASE_URL}/api/tts", json={"text": "Ciao, sono il test.", "lang": "it", "voice": voice}, timeout=90)
    # Free ElevenLabs quota exhausted -> 502 expected; 200 if quota available.
    assert r.status_code in (200, 502), f"voice={voice} unexpected status {r.status_code}: {r.text[:300]}"
    if r.status_code == 502:
        # NOTE: the edge (Cloudflare) replaces app-generated 502 with its own HTML page.
        # Verify the app itself answers a clean JSON 502 (no unhandled 500) via localhost.
        local = requests.post(
            "http://localhost:8001/api/tts",
            json={"text": "Ciao, sono il test.", "lang": "it", "voice": voice},
            timeout=90,
        )
        assert local.status_code == 502, local.text[:300]
        assert local.json().get("detail") == "Errore TTS"
    else:
        assert r.headers.get("content-type", "").startswith("audio/")


def test_tts_empty_text_400(client):
    r = client.post(f"{BASE_URL}/api/tts", json={"text": "   ", "lang": "it", "voice": "momy"}, timeout=60)
    assert r.status_code == 400, r.text


def test_tts_missing_text_422(client):
    r = client.post(f"{BASE_URL}/api/tts", json={"lang": "it", "voice": "momy"}, timeout=60)
    assert r.status_code == 422, r.text


def test_server_alive_after_tts(client):
    r = client.get(f"{BASE_URL}/api/", timeout=30)
    assert r.status_code in (200, 404)
