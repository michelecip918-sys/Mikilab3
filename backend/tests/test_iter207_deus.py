"""Iter 207 - BakoMix Deus + Capo Plan backend tests"""
import os, requests, pytest

BASE = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE:
    # fallback: read from frontend .env
    with open("/app/frontend/.env") as f:
        for l in f:
            if l.startswith("REACT_APP_BACKEND_URL="):
                BASE = l.split("=", 1)[1].strip().rstrip("/")

GATE_PIN = "1985"
ADMIN_EMAIL = "admin@mikilab.de"
ADMIN_PW = "Mikilab2026!"


@pytest.fixture(scope="module")
def auth_session():
    s = requests.Session()
    r = s.post(f"{BASE}/api/admin-gate/verify", json={"pin": GATE_PIN}, timeout=15)
    assert r.status_code == 200, f"gate verify failed: {r.status_code} {r.text}"
    r = s.post(f"{BASE}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PW}, timeout=15)
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    return s


def test_bond_get(auth_session):
    r = auth_session.get(f"{BASE}/api/bako/deus/bond?lang=it", timeout=15)
    assert r.status_code == 200, r.text
    d = r.json()
    for k in ("xp", "level", "level_name", "external_unlocked", "external_unlock_xp", "progress_pct"):
        assert k in d, f"missing key {k}"
    assert d["external_unlock_xp"] == 650


def test_ask_locked_when_low_bond(auth_session):
    # Read current xp
    b = auth_session.get(f"{BASE}/api/bako/deus/bond", timeout=15).json()
    r = auth_session.post(f"{BASE}/api/bako/deus/ask",
                          json={"question": "Come gestisco un fornitore in ritardo?", "lang": "it"},
                          timeout=30)
    assert r.status_code == 200, r.text
    d = r.json()
    if b["xp"] < 650:
        assert d.get("locked") is True, f"expected locked at xp={b['xp']}, got {d}"
        assert "reply" in d and len(d["reply"]) > 20
        # xp should not increase while locked
        b2 = auth_session.get(f"{BASE}/api/bako/deus/bond", timeout=15).json()
        assert b2["xp"] == b["xp"], f"XP changed while locked: {b['xp']} -> {b2['xp']}"
    else:
        assert d.get("locked") is False


def test_master_plan_and_xp_gain(auth_session):
    b_before = auth_session.get(f"{BASE}/api/bako/deus/bond", timeout=15).json()
    r = auth_session.post(f"{BASE}/api/bako/deus/master-plan",
                          json={"orders": "300 baguette + 120 croissant per domani 7:00",
                                "constraints": "2 forni, 1 impastatrice, 3 operatori, turno 6h",
                                "lang": "it"},
                          timeout=90)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d.get("ok") is True
    assert d.get("reply"), "reply missing"
    assert d.get("plan_markdown"), "plan_markdown missing"
    assert "bond" in d
    # XP increased by 40
    assert d["bond"]["xp"] == b_before["xp"] + 40, f"xp expected {b_before['xp']+40}, got {d['bond']['xp']}"


def test_broadcast_and_capo_plan(auth_session):
    r = auth_session.post(f"{BASE}/api/bako/deus/broadcast",
                          json={"plan_markdown": "## Piano di Test\n- step 1\n- step 2",
                                "headline": "TEST_iter207 headline"},
                          timeout=15)
    assert r.status_code == 200, r.text
    assert r.json().get("ok") is True

    # capo-plan is public floor endpoint - use fresh session (no admin cookie needed but gate maybe)
    r2 = requests.get(f"{BASE}/api/floor/capo-plan", timeout=15)
    # If gate required, use auth
    if r2.status_code == 401:
        r2 = auth_session.get(f"{BASE}/api/floor/capo-plan", timeout=15)
    assert r2.status_code == 200, r2.text
    d = r2.json()
    assert "TEST_iter207" in (d.get("headline") or "") or "Piano di Test" in (d.get("plan_markdown") or "")
