"""Iter 196 — MikiLab Pro FASE A: Food Cost, Ambiente predittivo, Gate TTL config,
Timeclock col PIN operatore, Avviso intrusione BakoMix."""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@mikilab.de"
ADMIN_PASS = "Mikilab2026!"
GATE_PIN = "1985"


@pytest.fixture(scope="module")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    # Gate
    r = sess.post(f"{API}/admin-gate/verify", json={"pin": GATE_PIN}, timeout=15)
    assert r.status_code == 200 and r.json().get("ok") is True, f"gate: {r.status_code} {r.text}"
    # Login admin
    r = sess.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS}, timeout=15)
    assert r.status_code == 200, f"login: {r.status_code} {r.text}"
    return sess


# --- Food Cost ------------------------------------------------------------
def test_food_cost_basic(s):
    payload = {
        "flour_grams": 1000, "water_grams": 700, "salt_grams": 20,
        "yeast_grams": 5, "sourdough_grams": 100,
        "pieces": 20, "sell_price_piece": 1.50,
    }
    r = s.post(f"{API}/lab/food-cost", json=payload, timeout=15)
    assert r.status_code == 200, r.text
    d = r.json()
    for k in ("material_cost", "cost_per_gram", "cost_per_piece", "food_cost_pct", "margin", "breakdown"):
        assert k in d, f"missing {k} in {d}"
    assert d["material_cost"] > 0
    assert d["cost_per_gram"] > 0
    assert d["cost_per_piece"] > 0
    assert 0 < d["food_cost_pct"] < 100
    assert d["margin"] > 0


# --- Environment predictive ----------------------------------------------
def test_env_cold_lengthens(s):
    r = s.post(f"{API}/lab/environment",
               json={"base_proof_hours": 3.0, "base_hydration_percent": 70.0,
                     "temp_c": 18.0, "humidity_pct": 40.0, "reference_temp_c": 24.0},
               timeout=15)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["adjusted_proof_hours"] > 3.0, f"18°C should LENGTHEN proof, got {d}"
    # low humidity → higher hydration
    assert d["hydration_percent"] > 70.0, f"low humidity should raise hydration, got {d}"
    assert "note" in d and d["note"]


def test_env_hot_shortens(s):
    r = s.post(f"{API}/lab/environment",
               json={"base_proof_hours": 3.0, "base_hydration_percent": 70.0,
                     "temp_c": 30.0, "humidity_pct": 80.0, "reference_temp_c": 24.0},
               timeout=15)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["adjusted_proof_hours"] < 3.0, f"30°C should SHORTEN proof, got {d}"
    assert d["hydration_percent"] < 70.0


# --- Gate TTL configurabile ----------------------------------------------
def test_gate_ttl_config_get_put(s):
    r = s.get(f"{API}/admin-gate/config", timeout=10)
    assert r.status_code == 200, r.text
    orig = int(r.json().get("ttl_days") or 30)

    r = s.put(f"{API}/admin-gate/config", json={"ttl_days": 7}, timeout=10)
    assert r.status_code == 200 and r.json().get("ttl_days") == 7, r.text

    r = s.get(f"{API}/admin-gate/config", timeout=10)
    assert r.json().get("ttl_days") == 7

    # clamps
    r = s.put(f"{API}/admin-gate/config", json={"ttl_days": 9999}, timeout=10)
    assert r.status_code == 200 and r.json().get("ttl_days") == 365

    # restore
    s.put(f"{API}/admin-gate/config", json={"ttl_days": orig}, timeout=10)


def test_gate_config_requires_admin():
    r = requests.get(f"{API}/admin-gate/config", timeout=10)
    assert r.status_code in (401, 403)


# --- Timeclock col PIN operatore -----------------------------------------
@pytest.fixture(scope="module")
def op_pin(s):
    name = "TEST_Iter196Op"
    pin = "7419"
    r = s.put(f"{API}/operator-pins", json={"name": name, "pin": pin}, timeout=10)
    assert r.status_code == 200, r.text
    yield {"name": name, "pin": pin}
    # cleanup
    try:
        s.delete(f"{API}/operator-pins/{name}", timeout=10)
    except Exception:
        pass


def test_timeclock_valid_pin(s, op_pin):
    r = s.post(f"{API}/compliance/timeclock",
               json={"action": "in", "pin": op_pin["pin"]}, timeout=10)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d.get("ok") is True
    assert d.get("verified") is True
    assert d.get("worker") == op_pin["name"]


def test_timeclock_invalid_pin(s):
    r = s.post(f"{API}/compliance/timeclock",
               json={"action": "in", "pin": "0000"}, timeout=10)
    assert r.status_code == 401


def test_timeclock_no_pin_unverified(s):
    r = s.post(f"{API}/compliance/timeclock",
               json={"action": "break_start", "worker": "Anonimo"}, timeout=10)
    assert r.status_code == 200
    d = r.json()
    assert d.get("verified") is False


# --- BakoMix intrusion alert ---------------------------------------------
def test_intrusion_alert_after_3_wrong_master(s):
    # fire 3 wrong PIN attempts (rate limit 8/300s; we already used 1 correct at fixture)
    for _ in range(3):
        rr = requests.post(f"{API}/admin-gate/verify", json={"pin": "0000"}, timeout=10)
        # 200 with ok:false, or 429; accept both but need db log
        if rr.status_code not in (200, 429):
            pytest.skip(f"gate verify unexpected {rr.status_code}: {rr.text}")
        time.sleep(0.3)

    r = s.get(f"{API}/bako/proactive?lang=it", timeout=15)
    assert r.status_code == 200, r.text
    alerts = r.json().get("alerts") or r.json().get("items") or []
    # response may be list or dict
    if isinstance(r.json(), list):
        alerts = r.json()
    has_intrusion = any(a.get("kind") == "intrusion" and a.get("severity") == "alert" for a in alerts)
    assert has_intrusion, f"expected intrusion alert, got: {alerts}"
