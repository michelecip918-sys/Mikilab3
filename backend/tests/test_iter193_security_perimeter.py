"""Iter 193 — Security perimeter tests: separate PINs (powerless), require_admin gating."""
import os
import requests
import pytest
from pathlib import Path

def _load_env():
    p = Path("/app/frontend/.env")
    if p.exists():
        for line in p.read_text().splitlines():
            if "=" in line and not line.strip().startswith("#"):
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())
_load_env()

BASE = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
ADMIN_EMAIL = "admin@mikilab.de"
ADMIN_PW = "Mikilab2026!"


@pytest.fixture(scope="module")
def anon():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def admin():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(f"{BASE}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PW})
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    return s


# ---- Perimeter: unauth must be 401/403 on admin endpoints ----
UNAUTH_MUTATIONS = [
    ("PUT", "/api/lab-config", {"foo": "bar"}),
    ("PUT", "/api/production-pin", {"pin": "1985"}),
    ("PUT", "/api/admin-gate", {"pin": "1985"}),
    ("POST", "/api/master/govern", {"command_text": "hi", "lang": "it"}),
    ("GET", "/api/bako/proactive", None),
]

@pytest.mark.parametrize("method,path,body", UNAUTH_MUTATIONS)
def test_admin_endpoints_reject_anon(anon, method, path, body):
    url = f"{BASE}{path}"
    r = anon.request(method, url, json=body) if body is not None else anon.request(method, url)
    assert r.status_code in (401, 403), f"{method} {path} expected 401/403 got {r.status_code}: {r.text[:200]}"


# ---- Public PIN verify endpoints: 200 but powerless ----
def test_admin_gate_verify_public_and_powerless(anon):
    r = anon.post(f"{BASE}/api/admin-gate/verify", json={"pin": "1985"})
    assert r.status_code == 200
    j = r.json()
    assert "ok" in j
    # No session cookie granting admin should be set
    for c in anon.cookies:
        if c.name == "session_token":
            pytest.fail(f"admin-gate/verify leaked session_token cookie: {c.value[:10]}")
    # Confirm still cannot access admin endpoint
    r2 = anon.put(f"{BASE}/api/lab-config", json={"foo": "bar"})
    assert r2.status_code in (401, 403), f"after gate verify, lab-config PUT should still be gated, got {r2.status_code}"


def test_production_pin_verify_public_and_powerless(anon):
    r = anon.post(f"{BASE}/api/production-pin/verify", json={"pin": "1985"})
    assert r.status_code == 200
    j = r.json()
    assert "ok" in j
    for c in anon.cookies:
        if c.name == "session_token":
            pytest.fail(f"production-pin/verify leaked session_token cookie: {c.value[:10]}")
    # still no admin power
    r2 = anon.put(f"{BASE}/api/production-pin", json={"pin": "1985"})
    assert r2.status_code in (401, 403), f"after prod-pin verify, PUT production-pin should be gated, got {r2.status_code}"
    r3 = anon.get(f"{BASE}/api/bako/proactive")
    assert r3.status_code in (401, 403)


def test_production_pin_verify_wrong(anon):
    r = anon.post(f"{BASE}/api/production-pin/verify", json={"pin": "0000"})
    assert r.status_code == 200
    j = r.json()
    assert j.get("ok") is False


def test_admin_gate_verify_wrong(anon):
    r = anon.post(f"{BASE}/api/admin-gate/verify", json={"pin": "0000"})
    assert r.status_code == 200
    j = r.json()
    assert j.get("ok") is False


# ---- Admin session: same endpoints work ----
def test_admin_can_put_lab_config(admin):
    # GET first to preserve current
    g = admin.get(f"{BASE}/api/lab-config")
    assert g.status_code == 200
    current = g.json() if isinstance(g.json(), dict) else {}
    r = admin.put(f"{BASE}/api/lab-config", json=current or {"probe": True})
    assert r.status_code == 200, f"admin PUT lab-config failed: {r.status_code} {r.text[:200]}"


def test_admin_can_put_production_pin(admin):
    r = admin.put(f"{BASE}/api/production-pin", json={"pin": "1985"})
    assert r.status_code == 200


def test_admin_can_put_admin_gate(admin):
    r = admin.put(f"{BASE}/api/admin-gate", json={"pin": "1985"})
    assert r.status_code == 200


def test_admin_can_call_master_govern(admin):
    r = admin.post(f"{BASE}/api/master/govern", json={"command_text": "ciao Bako", "lang": "it"})
    assert r.status_code == 200
    j = r.json()
    assert "reply" in j or "text" in j or "intent" in j


def test_admin_can_get_bako_proactive(admin):
    r = admin.get(f"{BASE}/api/bako/proactive?lang=it")
    assert r.status_code == 200


def test_admin_regression_recipes_count(admin):
    r = admin.get(f"{BASE}/api/recipes")
    assert r.status_code == 200
    j = r.json()
    items = j if isinstance(j, list) else j.get("items") or j.get("recipes") or []
    # Expected ~149
    assert len(items) >= 100, f"recipes count too low: {len(items)}"


def test_admin_govern_assign_leader(admin):
    r = admin.post(f"{BASE}/api/master/govern", json={"command_text": "assegna Mohamed come capo turno", "lang": "it"})
    assert r.status_code == 200
