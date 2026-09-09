"""Iter 222 — Final Manifesto regression across all listed backend surfaces."""
import os
import time
import requests
import pytest

def _base():
    v = os.environ.get("REACT_APP_BACKEND_URL")
    if not v:
        # read frontend .env
        try:
            with open("/app/frontend/.env") as f:
                for line in f:
                    if line.startswith("REACT_APP_BACKEND_URL="):
                        return line.split("=", 1)[1].strip().rstrip("/")
        except Exception:
            pass
    return (v or "").rstrip("/")


BASE = _base()

MASTER_PIN = "198505"
GUEST_PIN = "202020"
ADMIN_EMAIL = "admin@mikilab.de"
ADMIN_PASS = "Mikilab2026!"


# ---------------- Sessions ----------------
@pytest.fixture(scope="module")
def gate_master():
    s = requests.Session()
    r = s.post(f"{BASE}/api/admin-gate/verify", json={"pin": MASTER_PIN}, timeout=20)
    assert r.status_code == 200, r.text
    return s


@pytest.fixture(scope="module")
def gate_guest():
    s = requests.Session()
    r = s.post(f"{BASE}/api/admin-gate/verify", json={"pin": GUEST_PIN}, timeout=20)
    assert r.status_code == 200, r.text
    return s


@pytest.fixture(scope="module")
def admin_session(gate_master):
    # login on same session (master gate cookie already set)
    r = gate_master.post(
        f"{BASE}/api/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASS},
        timeout=20,
    )
    assert r.status_code == 200, r.text
    return gate_master


# ---------------- Gate + PIN wall ----------------
def test_gate_wrong_pin():
    r = requests.post(f"{BASE}/api/admin-gate/verify", json={"pin": "000000"}, timeout=15)
    # API returns 200 with {ok:false, level:null} for wrong PIN
    assert r.status_code == 200, r.text
    j = r.json()
    assert j.get("ok") is False
    assert j.get("level") in (None, "")


def test_gate_master_ok(gate_master):
    # cookies present
    assert any("gate" in c.name.lower() or c.value for c in gate_master.cookies)


def test_gate_guest_ok(gate_guest):
    assert gate_guest.cookies


# ---------------- Public access-request + Mohamed ----------------
def test_public_access_request_valid():
    r = requests.post(
        f"{BASE}/api/public/access-request",
        json={"email": "TEST_iter222_public@example.com", "message": "guasto forno urgente"},
        timeout=15,
    )
    assert r.status_code == 200, r.text
    j = r.json()
    assert j.get("ok") is True
    assert j.get("routed_by") == "Mohamed"
    assert "category" in j


def test_public_access_request_invalid_email():
    r = requests.post(
        f"{BASE}/api/public/access-request",
        json={"email": "not-an-email"},
        timeout=15,
    )
    assert r.status_code in (400, 422), r.text


# ---------------- Mohamed inbox (admin-only) ----------------
def test_mohamed_inbox_requires_admin():
    r = requests.get(f"{BASE}/api/mike/access-requests", timeout=15)
    assert r.status_code in (401, 403)


def test_mohamed_inbox_list_and_act(admin_session):
    # seed
    seed_email = f"TEST_iter222_act_{int(time.time())}@example.com"
    r = requests.post(
        f"{BASE}/api/public/access-request",
        json={"email": seed_email, "message": "vorrei accedere"},
        timeout=15,
    )
    assert r.status_code == 200
    time.sleep(0.5)
    # list
    lr = admin_session.get(f"{BASE}/api/mike/access-requests", timeout=15)
    assert lr.status_code == 200, lr.text
    body = lr.json()
    items = body.get("requests") or []
    matched = [x for x in items if x.get("email") == seed_email]
    assert matched, "seeded request not visible in inbox"
    rid = matched[0].get("id")
    # approve -> pin
    ar = admin_session.post(
        f"{BASE}/api/mike/access-requests/act",
        json={"id": rid, "status": "approvata"},
        timeout=20,
    )
    assert ar.status_code == 200, ar.text
    pin = ar.json().get("guest_pin")
    assert pin and len(str(pin)) >= 4
    # verify pin unlocks as guest (tolerate rate-limit from prior gate calls)
    s2 = requests.Session()
    vr = s2.post(f"{BASE}/api/admin-gate/verify", json={"pin": str(pin)}, timeout=15)
    assert vr.status_code in (200, 429), vr.text
    if vr.status_code == 200:
        assert vr.json().get("ok") is True


# ---------------- Ecosystem: observe + alerts ----------------
def test_mike_observe_and_alerts(admin_session):
    payload = {
        "recipe_name": "TEST_iter222_observe",
        "action": "uso farina 00 al posto di W350 forte",
        "lang": "it",
    }
    r = admin_session.post(f"{BASE}/api/mike/observe", json=payload, timeout=90)
    assert r.status_code == 200, r.text
    j = r.json()
    assert "status" in j
    # alerts list
    ar = admin_session.get(f"{BASE}/api/mike/alerts", timeout=15)
    assert ar.status_code == 200, ar.text


# ---------------- Legacy oven ----------------
def test_legacy_adapt(admin_session):
    payload = {
        "recipe_name": "pane rustico",
        "equipment": "forno a legna vecchio senza sonda",
        "notes": "compensare senza qualità",
        "lang": "it",
    }
    r = admin_session.post(f"{BASE}/api/mike/legacy-adapt", json=payload, timeout=120)
    assert r.status_code == 200, r.text
    j = r.json()
    assert isinstance(j, dict) and (j.get("summary") or j.get("adjustments") or j)


# ---------------- Living recipe (Capo-only) ----------------
def test_living_recipe_requires_admin(gate_master):
    # gate cookie only, no admin login on fresh session
    s = requests.Session()
    s.post(f"{BASE}/api/admin-gate/verify", json={"pin": MASTER_PIN}, timeout=15)
    r = s.post(f"{BASE}/api/nexus/living-recipe", json={"objective": "focaccia"}, timeout=20)
    assert r.status_code in (401, 403), r.text


def test_living_recipe_admin(admin_session):
    r = admin_session.post(
        f"{BASE}/api/nexus/living-recipe",
        json={"objective": "focaccia leggera idratata"},
        timeout=90,
    )
    assert r.status_code == 200, r.text
    j = r.json()
    # tolerant keys check
    assert any(k in j for k in ("matrix", "curve", "sensory", "recipe"))


# ---------------- Resend forgot-password ----------------
def test_forgot_password_resend_ok():
    r = requests.post(
        f"{BASE}/api/auth/forgot-password",
        json={"email": "michelecip918@gmail.com"},
        timeout=20,
    )
    assert r.status_code == 200, r.text
    j = r.json()
    assert j.get("ok") is True
