# ============================================================================
#  MIKILAB PRO & BakoMix AI — PROPRIETARY & CONFIDENTIAL
#  (c) 2026 MikiLab Pro. Tutti i diritti riservati / All rights reserved.
#  Unico proprietario legale: il Master. Sole legal owner: the Master.
#  Codice riservato: vietata copia, distribuzione, reverse engineering o
#  cloning non autorizzati. Unauthorized copying, distribution, reverse
#  engineering or cloning is strictly prohibited and actively tracked by
#  the BakoMix AI Security Guardian.
# ============================================================================
"""Iter 185 backend tests:
- Audio Handoff Offline: GET /api/shift/handoff (audio_base64 not null, ~200k) + history persistence
- Voice Translate: POST /api/voice/translate (target en/de/it, empty→400)
"""
import os
import pytest
import requests

def _load_frontend_env():
    p = "/app/frontend/.env"
    if os.path.exists(p):
        with open(p) as f:
            for line in f:
                line = line.strip()
                if line.startswith("REACT_APP_BACKEND_URL="):
                    return line.split("=", 1)[1].strip().strip('"')
    return None


BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or _load_frontend_env() or "").rstrip("/")
assert BASE_URL, "REACT_APP_BACKEND_URL missing"
API = f"{BASE_URL}/api"


# ---------- Audio Handoff ----------
class TestShiftHandoffAudio:
    def _fetch(self, lang):
        r = requests.get(f"{API}/shift/handoff", params={"lang": lang}, timeout=60)
        return r

    @pytest.mark.parametrize("lang", ["en", "it", "de"])
    def test_handoff_returns_audio_base64(self, lang):
        r = self._fetch(lang)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("status") == "success"
        assert isinstance(data.get("text"), str) and len(data["text"]) > 10
        ab = data.get("audio_base64")
        assert ab is not None, f"audio_base64 is None for lang={lang}"
        assert isinstance(ab, str)
        # Expected ~200k; require at least 30k to be safe across providers
        assert len(ab) > 30000, f"audio_base64 too short ({len(ab)}) for lang={lang}"
        assert data.get("audio_mime") == "audio/mpeg"

    def test_handoff_history_persists_audio(self):
        # Trigger one
        r = requests.get(f"{API}/shift/handoff", params={"lang": "en"}, timeout=60)
        assert r.status_code == 200
        h = requests.get(f"{API}/shift/handoff/history", timeout=30)
        assert h.status_code == 200
        items = h.json().get("items", [])
        assert len(items) >= 1
        with_audio = [i for i in items if i.get("audio_base64")]
        assert len(with_audio) >= 1, "No history items have audio_base64"
        assert with_audio[0].get("audio_mime") == "audio/mpeg"


# ---------- Voice Translate ----------
class TestVoiceTranslate:
    def test_translate_it_to_en(self):
        r = requests.post(
            f"{API}/voice/translate",
            json={"text": "Prepara la teglia e inforna tra dieci minuti", "target": "en"},
            timeout=60,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("target") == "en"
        assert isinstance(data.get("text"), str) and data["text"]
        assert data["text"].strip().lower() != "prepara la teglia e inforna tra dieci minuti".lower()

    def test_translate_it_to_de(self):
        r = requests.post(
            f"{API}/voice/translate",
            json={"text": "Prepara la teglia e inforna tra dieci minuti", "target": "de"},
            timeout=60,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("target") == "de"
        assert data.get("text")

    def test_translate_it_to_it_unchanged(self):
        original = "Prepara la teglia e inforna tra dieci minuti"
        r = requests.post(f"{API}/voice/translate", json={"text": original, "target": "it"}, timeout=60)
        assert r.status_code == 200
        data = r.json()
        # Substantially unchanged
        assert original.lower()[:20] in data["text"].lower() or data["text"].lower() == original.lower()

    def test_translate_empty_text_400(self):
        r = requests.post(f"{API}/voice/translate", json={"text": "", "target": "en"}, timeout=30)
        assert r.status_code == 400
