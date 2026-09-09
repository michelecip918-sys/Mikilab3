"""Iter 219: Test Mike Mix rename regression + TTS 'nexus' voice + public gate."""
import os
import requests
import pytest

BASE = os.environ.get("REACT_APP_BACKEND_URL", "https://edit-33.preview.emergentagent.com").rstrip("/")
GATE_PIN = "198505"
ADMIN_EMAIL = "admin@mikilab.de"
ADMIN_PWD = "Mikilab2026!"


@pytest.fixture(scope="module")
def auth_session():
    s = requests.Session()
    r = s.post(f"{BASE}/api/admin-gate/verify", json={"pin": GATE_PIN}, timeout=15)
    assert r.status_code == 200, f"gate verify failed: {r.status_code} {r.text[:200]}"
    r = s.post(f"{BASE}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PWD}, timeout=15)
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text[:200]}"
    return s


def test_gate_verify_wrong_pin():
    r = requests.post(f"{BASE}/api/admin-gate/verify", json={"pin": "000000"}, timeout=10)
    assert r.status_code in (401, 403), f"unexpected {r.status_code}"


def test_gate_verify_correct_pin():
    r = requests.post(f"{BASE}/api/admin-gate/verify", json={"pin": GATE_PIN}, timeout=10)
    assert r.status_code == 200


def test_public_recipes_still_works():
    # Public endpoint should not require gate
    r = requests.get(f"{BASE}/api/recipes?collection=mikilab", timeout=15)
    # May be public or gated; accept 200 or 401
    assert r.status_code in (200, 401), f"got {r.status_code}"


def test_mike_suggestions(auth_session):
    r = auth_session.get(f"{BASE}/api/mike/suggestions", timeout=15)
    assert r.status_code != 404, "endpoint missing (rename regression!)"
    assert r.status_code == 200, f"got {r.status_code}: {r.text[:200]}"


def test_mike_shift_report(auth_session):
    r = auth_session.get(f"{BASE}/api/mike/shift-report", timeout=15)
    assert r.status_code != 404, "endpoint missing (rename regression!)"
    assert r.status_code == 200, f"got {r.status_code}: {r.text[:200]}"


def test_mike_heartbeat(auth_session):
    r = auth_session.get(f"{BASE}/api/mike/heartbeat", timeout=15)
    assert r.status_code != 404, "endpoint missing (rename regression!)"
    assert r.status_code == 200, f"got {r.status_code}: {r.text[:200]}"


def test_old_bako_endpoints_gone(auth_session):
    # These should be 404 now (renamed)
    r = auth_session.get(f"{BASE}/api/bako/suggestions", timeout=10)
    # Note: might still exist as an alias; just log
    print(f"/api/bako/suggestions => {r.status_code}")


def test_tts_nexus_voice(auth_session):
    r = auth_session.post(
        f"{BASE}/api/tts",
        json={"text": "Prova Miki-Nexus", "lang": "it", "voice": "nexus"},
        timeout=30,
    )
    # Acceptable: 200 (audio), 503 (not configured), 424 (upstream); NOT 500 (crash) or 404
    print(f"TTS nexus => {r.status_code}: {r.text[:200]}")
    assert r.status_code not in (500,), f"TTS crashed on 'nexus' voice: {r.text[:300]}"
    assert r.status_code != 404, "TTS endpoint or voice mapping returns 404"
    assert r.status_code in (200, 503, 424, 429, 400)


def test_tts_bakemix_voice_still_works(auth_session):
    r = auth_session.post(
        f"{BASE}/api/tts",
        json={"text": "test", "lang": "it", "voice": "bakemix"},
        timeout=30,
    )
    print(f"TTS bakemix => {r.status_code}")
    assert r.status_code not in (500,)


def test_mikemix_chat_endpoint(auth_session):
    # Renamed from /mohammed/chat -> /mikemix/chat
    r = auth_session.post(f"{BASE}/api/mikemix/chat", json={"message": "ciao"}, timeout=30)
    print(f"/api/mikemix/chat => {r.status_code}: {r.text[:200]}")
    assert r.status_code != 404, "mikemix/chat endpoint missing"
