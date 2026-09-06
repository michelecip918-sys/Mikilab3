"""Iter 206 - COLLAUDO FINALE: packaging sync + SOS challenge (backend)."""
import os
import requests
import pytest

BASE = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")


@pytest.fixture(scope="module")
def admin_session():
    s = requests.Session()
    g = s.post(f"{BASE}/api/admin-gate/verify", json={"pin": "1985"}, timeout=15)
    assert g.status_code == 200, g.text
    r = s.post(f"{BASE}/api/auth/login",
               json={"email": "admin@mikilab.de", "password": "Mikilab2026!"},
               timeout=15)
    assert r.status_code == 200, r.text
    return s


# --- Packaging / affettatrici sync sulla curva di raffreddamento ---
@pytest.mark.parametrize("temp,mode,speed", [
    (70, "attendi", 0),
    (55, "attendi", 0),
    (45, "rallenta", 68),
    (33, "nominale", 100),
    (35, "nominale", 100),
])
def test_packaging_curve(admin_session, temp, mode, speed):
    r = admin_session.get(f"{BASE}/api/bako/packaging",
                          params={"bread_temp_c": temp, "lang": "it"}, timeout=15)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["mode"] == mode, f"temp={temp} expected {mode}, got {d}"
    assert d["slicer_speed_pct"] == speed, f"temp={temp} expected {speed}%, got {d}"
    assert d["target_c"] == 35.0
    assert "spoken" in d


def test_packaging_en_wait_label(admin_session):
    r = admin_session.get(f"{BASE}/api/bako/packaging",
                          params={"bread_temp_c": 60, "lang": "en"}, timeout=15)
    assert r.status_code == 200
    assert "WAIT" in r.json()["mode_label"]


# --- Sfida SOS (settimanale) ---
def test_sos_challenge_shape(admin_session):
    r = admin_session.get(f"{BASE}/api/bako/sos/challenge",
                          params={"lang": "it"}, timeout=15)
    assert r.status_code == 200, r.text
    d = r.json()
    assert "leaderboard" in d and isinstance(d["leaderboard"], list)
    assert "champion" in d
    assert "week_start" in d
    assert "title" in d
    # If there is leaderboard content, each row must have badges list
    for row in d["leaderboard"]:
        assert "shift" in row and "count" in row and "avg_response_s" in row
        assert "badges" in row and isinstance(row["badges"], list)


def test_sos_challenge_after_seeded_event(admin_session):
    # Create a SOS then resolve it → make sure endpoint stays healthy
    c = admin_session.post(f"{BASE}/api/bako/sos",
                           json={"machine": "TEST_final", "level": "high",
                                 "note": "iter206 challenge seed"}, timeout=15)
    assert c.status_code in (200, 201), c.text
    sid = c.json().get("id") or c.json().get("event", {}).get("id")
    assert sid, c.json()
    a = admin_session.post(f"{BASE}/api/bako/sos/{sid}/ack",
                           json={"note": "cleanup"}, timeout=15)
    assert a.status_code in (200, 204), a.text
    r = admin_session.get(f"{BASE}/api/bako/sos/challenge", timeout=15)
    assert r.status_code == 200
    d = r.json()
    # After at least one resolved SOS this week, leaderboard should not be empty
    assert len(d["leaderboard"]) >= 1
    assert d["champion"] is not None
    # At least one row carries 🥇
    assert any("🥇" in r.get("badges", []) for r in d["leaderboard"])
