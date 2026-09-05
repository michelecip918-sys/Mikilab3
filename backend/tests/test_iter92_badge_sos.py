# ============================================================================
#  MIKILAB PRO & BakoMix AI — PROPRIETARY & CONFIDENTIAL
#  (c) 2026 MikiLab Pro. Tutti i diritti riservati / All rights reserved.
#  Unico proprietario legale: il Master. Sole legal owner: the Master.
#  Codice riservato: vietata copia, distribuzione, reverse engineering o
#  cloning non autorizzati. Unauthorized copying, distribution, reverse
#  engineering or cloning is strictly prohibited and actively tracked by
#  the BakoMix AI Security Guardian.
# ============================================================================
"""Iteration 92 — new features: Academy badge, SOS Impasto (SSE), coach localized labels, quiz regression."""
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

AMICO1 = {"email": "amico1@mikilab.de", "password": "Test1234!"}


def _login(creds):
    r = requests.post(f"{BASE_URL}/api/auth/login", json=creds, timeout=30)
    if r.status_code != 200:
        pytest.fail(f"login failed {r.status_code}: {r.text[:300]}")
    d = r.json()
    return d["session_token"], d["user"]["user_id"]


@pytest.fixture(scope="module")
def auth():
    token, uid = _login(AMICO1)
    return {"token": token, "user_id": uid, "headers": {"Authorization": f"Bearer {token}"}}


BREAD_IMG = "/app/.screenshots/bread_test.jpg"


def _jpeg_b64():
    """Real bread JPEG (same asset used by the vision tests)."""
    from PIL import Image
    img = Image.open(BREAD_IMG).convert("RGB")
    img.thumbnail((640, 640))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=80)
    return base64.b64encode(buf.getvalue()).decode()


# --- Badge endpoint ---
class TestBadge:
    def test_grant_badge_requires_auth(self):
        r = requests.post(f"{BASE_URL}/api/academy/badge", json={"badge": "diplomato"}, timeout=30)
        assert r.status_code in (401, 403), r.text[:300]

    def test_grant_badge_ok(self, auth):
        r = requests.post(f"{BASE_URL}/api/academy/badge", json={"badge": "diplomato"},
                          headers=auth["headers"], timeout=30)
        assert r.status_code == 200, r.text[:300]
        data = r.json()
        assert isinstance(data.get("badges"), list)
        assert "diplomato" in data["badges"]

    def test_grant_badge_idempotent(self, auth):
        r = requests.post(f"{BASE_URL}/api/academy/badge", json={"badge": "diplomato"},
                          headers=auth["headers"], timeout=30)
        assert r.status_code == 200
        assert r.json()["badges"].count("diplomato") == 1

    def test_grant_badge_invalid(self, auth):
        r = requests.post(f"{BASE_URL}/api/academy/badge", json={"badge": "nope"},
                          headers=auth["headers"], timeout=30)
        assert r.status_code == 400, r.text[:300]

    def test_grant_badge_empty(self, auth):
        r = requests.post(f"{BASE_URL}/api/academy/badge", json={"badge": ""},
                          headers=auth["headers"], timeout=30)
        assert r.status_code == 400

    def test_profile_includes_badges(self, auth):
        r = requests.get(f"{BASE_URL}/api/community/profile/{auth['user_id']}",
                         headers=auth["headers"], timeout=30)
        assert r.status_code == 200, r.text[:300]
        data = r.json()
        assert "badges" in data, data.keys()
        assert "diplomato" in data["badges"]
        assert "_id" not in data


# --- SOS Impasto (SSE, vision) ---
class TestSos:
    def test_sos_requires_auth(self):
        r = requests.post(f"{BASE_URL}/api/academy/sos",
                          json={"mode": "sos", "image_base64": _jpeg_b64(), "lang": "it"}, timeout=30)
        assert r.status_code in (401, 403), f"{r.status_code} {r.text[:300]}"

    def test_sos_stream_diagnosis(self, auth):
        r = requests.post(f"{BASE_URL}/api/academy/sos",
                          json={"mode": "sos", "image_base64": _jpeg_b64(), "lang": "it"},
                          headers=auth["headers"], stream=True, timeout=120)
        assert r.status_code == 200, r.text[:300]
        text, done = "", False
        for line in r.iter_lines(decode_unicode=True):
            if not line or not line.startswith("data: "):
                continue
            ev = json.loads(line[6:])
            if ev.get("done"):
                done = True
                break
            text += ev.get("d", "")
        assert done, "stream did not send done:true"
        assert len(text) > 50, f"answer too short: {text!r}"
        assert "[Errore nella diagnosi" not in text, text[:300]
        assert any(e in text for e in ("⚡", "🥖", "🔧")), text[:300]

    def test_sos_data_url_prefix_accepted(self, auth):
        r = requests.post(f"{BASE_URL}/api/academy/sos",
                          json={"mode": "sos", "image_base64": "data:image/jpeg;base64," + _jpeg_b64(), "lang": "en"},
                          headers=auth["headers"], stream=True, timeout=120)
        assert r.status_code == 200
        text, done = "", False
        for line in r.iter_lines(decode_unicode=True):
            if line and line.startswith("data: "):
                ev = json.loads(line[6:])
                if ev.get("done"):
                    done = True
                    break
                text += ev.get("d", "")
        assert done
        assert "[Errore nella diagnosi" not in text, text[:300]
        assert len(text) > 50


# --- Coach regression + localized labels ---
def _coach(lang, msg, session="iter92"):
    r = requests.post(f"{BASE_URL}/api/academy/coach",
                      json={"message": msg, "lang": lang, "session_id": f"{session}-{lang}"},
                      stream=True, timeout=150)
    assert r.status_code == 200, r.text[:300]
    text = ""
    for line in r.iter_lines(decode_unicode=True):
        if line and line.startswith("data: "):
            ev = json.loads(line[6:])
            if ev.get("done"):
                break
            text += ev.get("d", "")
    return text


class TestCoach:
    def test_coach_it(self):
        t = _coach("it", "Calcola gli orari a ritroso per sfornare il pane alle 8:00")
        assert len(t) > 80, t
        assert "⚡" in t and "⏱️" in t, t[:400]

    def test_coach_de_no_italian_labels(self):
        t = _coach("de", "Berechne die Zeiten rückwärts für Brot um 8:00 Uhr")
        assert len(t) > 80, t
        assert "Stato / Diagnosi" not in t, t[:400]
        assert "Impatto in cucina" not in t, t[:400]

    def test_coach_en_no_italian_labels(self):
        t = _coach("en", "Calculate the schedule backwards to bake bread at 8:00")
        assert len(t) > 80, t
        assert "Stato / Diagnosi" not in t, t[:400]
        assert "Impatto in cucina" not in t, t[:400]


# --- Quiz regression (3 levels) ---
@pytest.mark.parametrize("level", ["beginner", "intermediate", "master"])
def test_quiz_levels(level):
    r = requests.post(f"{BASE_URL}/api/academy/quiz",
                      json={"level": level, "lang": "it", "asked": []}, timeout=120)
    assert r.status_code == 200, r.text[:300]
    d = r.json()
    assert isinstance(d.get("question"), str) and len(d["question"]) > 5
    assert isinstance(d.get("options"), list) and 3 <= len(d["options"]) <= 4, d.get("options")
    assert isinstance(d.get("correct"), int) and 0 <= d["correct"] < len(d["options"])
    assert isinstance(d.get("explanation"), str) and len(d["explanation"]) > 5


def test_sos_missing_mode_returns_422(auth):
    """Documented: VisionRequest requires an unused 'mode' field; frontend sends mode='sos'."""
    r = requests.post(f"{BASE_URL}/api/academy/sos",
                      json={"image_base64": _jpeg_b64(), "lang": "it"},
                      headers=auth["headers"], timeout=30)
    assert r.status_code == 422
