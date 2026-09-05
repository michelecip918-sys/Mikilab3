"""Iter 179 — BakoMix Sesto Senso backend tests.

Covers:
- GET /api/lab/pulse (clean & anomaly scenarios)
- Multilingual alert payloads (6 languages)
- Shift check-in flow + admin notification
- Rest mode admin-gate
- Predictive wake calculation incl. wrap-around
- Auth boundaries
"""
import os
import pytest
import requests


def _load_base_url():
    v = os.environ.get("REACT_APP_BACKEND_URL", "").strip()
    if not v:
        try:
            with open("/app/frontend/.env") as f:
                for ln in f:
                    if ln.startswith("REACT_APP_BACKEND_URL="):
                        v = ln.split("=", 1)[1].strip()
                        break
        except Exception:
            pass
    return v.rstrip("/")


BASE_URL = _load_base_url()
ADMIN_EMAIL = "admin@mikilab.de"
ADMIN_PASS = "Mikilab2026!"
LANGS = ("it", "de", "en", "es", "fr", "fa")


@pytest.fixture(scope="module")
def anon():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def admin(anon):
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS})
    if r.status_code != 200:
        pytest.skip(f"Admin login failed: {r.status_code} {r.text[:200]}")
    tok = r.json().get("access_token") or r.json().get("token") or r.json().get("session_token")
    assert tok, f"No token in login response: {r.json()}"
    s.headers.update({"Authorization": f"Bearer {tok}"})
    return s


@pytest.fixture(scope="module", autouse=True)
def _reset_state(admin):
    """Ensure clean state before + after this module."""
    def clean():
        try:
            admin.put(f"{BASE_URL}/api/lab/shift-state",
                      json={"machines_down": [], "cold_down": False, "batches": []})
            admin.delete(f"{BASE_URL}/api/lab/shift/checkin")
            admin.put(f"{BASE_URL}/api/lab/rest-mode", json={"active": False, "allow_critical": True})
        except Exception:
            pass
    clean()
    yield
    clean()


# --- Pulse: clean state ---
def test_pulse_clean_state(admin, anon):
    admin.put(f"{BASE_URL}/api/lab/shift-state",
              json={"machines_down": [], "cold_down": False, "batches": []})
    admin.delete(f"{BASE_URL}/api/lab/shift/checkin")
    r = anon.get(f"{BASE_URL}/api/lab/pulse")
    assert r.status_code == 200
    d = r.json()
    assert d["mood"] == "sereno", f"expected sereno, got {d.get('mood')} — alerts={d.get('alerts')}"
    # In clean state (no active plan, no checkin) alerts should be 0
    assert isinstance(d["alerts"], list)
    # If no floor_plan is active, no_checkin alert should not appear either
    assert len([a for a in d["alerts"] if a["level"] in ("critical", "warn")]) == 0
    for k in ("mood", "heartbeat", "score", "alerts", "checkin", "rest_mode", "plan_active"):
        assert k in d


# --- Pulse: anomaly detection + i18n ---
def test_pulse_anomalies_multilang(admin):
    payload = {
        "machines_down": [{"id": "m1", "name": "Impastatrice", "since": None}],
        "cold_down": True,
        "batches": [{"id": "b1", "recipe_id": "r1", "recipe_name": "Baguette", "status": "in_ritardo"}],
    }
    r = admin.put(f"{BASE_URL}/api/lab/shift-state", json=payload)
    assert r.status_code == 200, r.text

    r = admin.get(f"{BASE_URL}/api/lab/pulse")
    assert r.status_code == 200
    d = r.json()
    assert d["mood"] == "critico", f"got {d['mood']}, alerts={d['alerts']}"
    alerts = d["alerts"]
    codes = {a["code"] for a in alerts}
    assert "machine_down" in codes
    assert "cold_down" in codes
    assert "batch_late" in codes
    crit = [a for a in alerts if a["level"] == "critical"]
    warn = [a for a in alerts if a["level"] == "warn"]
    assert len(crit) == 2
    assert len(warn) == 1
    # 6-language keys
    for a in alerts:
        assert isinstance(a["text"], dict), f"text not dict for {a['code']}"
        assert isinstance(a["suggestion"], dict)
        for lg in LANGS:
            assert lg in a["text"] and a["text"][lg], f"missing text.{lg} in {a['code']}"
            assert lg in a["suggestion"] and a["suggestion"][lg], f"missing suggestion.{lg} in {a['code']}"
    # Score should be lowered from 100
    assert d["score"] < 60


# --- Silent check-in + admin notification ---
def test_checkin_creates_notification(admin, anon):
    # ensure cleared
    admin.delete(f"{BASE_URL}/api/lab/shift/checkin")
    r = anon.post(f"{BASE_URL}/api/lab/shift/checkin",
                  json={"operator": "TEST_Mohamed", "role": "impasto"})
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["active"] is True
    assert d["by"] == "TEST_Mohamed"

    # GET returns active checkin
    r = anon.get(f"{BASE_URL}/api/lab/shift/checkin")
    assert r.status_code == 200
    assert r.json().get("active") is True

    # Admin notifications include a checkin entry
    r = admin.get(f"{BASE_URL}/api/notifications")
    assert r.status_code == 200
    body = r.json()
    items = body if isinstance(body, list) else body.get("items", body.get("notifications", []))
    assert any(
        (n.get("type") == "checkin") and ("TEST_Mohamed" in (n.get("body") or n.get("snippet") or n.get("text") or ""))
        for n in items
    ), f"No checkin notification found. sample={items[:3]}"


# --- Rest mode auth boundaries ---
def test_rest_mode_requires_admin(anon):
    r = anon.put(f"{BASE_URL}/api/lab/rest-mode", json={"active": True})
    assert r.status_code in (401, 403), f"expected 401/403 got {r.status_code}"


def test_rest_mode_admin_toggle(admin, anon):
    r = admin.put(f"{BASE_URL}/api/lab/rest-mode", json={"active": True, "allow_critical": True})
    assert r.status_code == 200
    r = anon.get(f"{BASE_URL}/api/lab/rest-mode")
    assert r.status_code == 200
    assert r.json()["active"] is True
    r = admin.put(f"{BASE_URL}/api/lab/rest-mode", json={"active": False})
    assert r.status_code == 200
    r = anon.get(f"{BASE_URL}/api/lab/rest-mode")
    assert r.json()["active"] is False


# --- Wake alarm ---
def test_wake_basic(admin, anon):
    r = admin.put(f"{BASE_URL}/api/lab/wake",
                  json={"enabled": True, "first_start": "05:00", "prep_minutes": 25})
    assert r.status_code == 200, r.text
    assert r.json()["wake_at"] == "04:35"
    r = anon.get(f"{BASE_URL}/api/lab/wake")
    assert r.status_code == 200
    assert r.json()["wake_at"] == "04:35"


def test_wake_wrap_around(admin):
    r = admin.put(f"{BASE_URL}/api/lab/wake",
                  json={"enabled": True, "first_start": "00:10", "prep_minutes": 20})
    assert r.status_code == 200
    assert r.json()["wake_at"] == "23:50", r.json()


def test_wake_requires_admin(anon):
    r = anon.put(f"{BASE_URL}/api/lab/wake",
                 json={"enabled": True, "first_start": "05:00", "prep_minutes": 25})
    assert r.status_code in (401, 403)


def test_checkin_delete_requires_admin(anon):
    r = anon.delete(f"{BASE_URL}/api/lab/shift/checkin")
    assert r.status_code in (401, 403)


# --- Public GETs ---
def test_public_gets(anon):
    for path in ("/api/lab/pulse", "/api/lab/wake", "/api/lab/shift/checkin", "/api/lab/rest-mode"):
        r = anon.get(f"{BASE_URL}{path}")
        assert r.status_code == 200, f"{path} -> {r.status_code}"
