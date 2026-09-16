"""Iter256 backend tests: Apprentice card, voice_daily_limit quota, endpoint cleanup, org isolation regression."""
import os
import requests
import pytest

BASE = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
GATE_PIN = "198505"
ADMIN_EMAIL = "admin@mikilab.de"
ADMIN_PW = "Mikilab2026!"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    # Gate
    r = s.post(f"{BASE}/api/admin-gate/verify", json={"pin": GATE_PIN}, timeout=15)
    assert r.status_code == 200, r.text
    # Admin login
    r = s.post(f"{BASE}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PW}, timeout=15)
    assert r.status_code == 200, r.text
    return s


@pytest.fixture(scope="module")
def a_recipe_id(session):
    r = session.get(f"{BASE}/api/recipes", timeout=15)
    assert r.status_code == 200
    data = r.json()
    recipes = data if isinstance(data, list) else data.get("recipes") or data.get("items") or []
    assert recipes, "No recipes returned"
    return recipes[0].get("id") or recipes[0].get("_id")


# ----- Apprentice info -----
def test_apprentice_put_and_get(session, a_recipe_id):
    payload = {"pieces_per_tray": "12", "tray_format": "teglia 60x40", "shaping_note": "arrotolare stretto e chiudere sotto"}
    # Snapshot recipe ingredients BEFORE
    before = session.get(f"{BASE}/api/recipes", timeout=15).json()
    before_list = before if isinstance(before, list) else (before.get("recipes") or before.get("items") or [])
    before_rec = next((x for x in before_list if (x.get("id") or x.get("_id")) == a_recipe_id), None)
    assert before_rec, "Recipe not found in list"
    before_ing = before_rec.get("ingredients")

    r = session.put(f"{BASE}/api/apprentice/recipe/{a_recipe_id}", json=payload, timeout=15)
    assert r.status_code == 200, r.text
    assert r.json().get("ok") is True

    g = session.get(f"{BASE}/api/apprentice/recipe/{a_recipe_id}", timeout=15)
    assert g.status_code == 200
    d = g.json()
    assert d["has_info"] is True
    assert d["pieces_per_tray"] == "12"
    assert d["tray_format"] == "teglia 60x40"
    assert "arrotolare" in d["shaping_note"]
    assert d["spoken"] and "12" in d["spoken"] and "60x40" in d["spoken"]

    # Ricetta NON alterata
    after = session.get(f"{BASE}/api/recipes", timeout=15).json()
    after_list = after if isinstance(after, list) else (after.get("recipes") or after.get("items") or [])
    after_rec = next((x for x in after_list if (x.get("id") or x.get("_id")) == a_recipe_id), None)
    assert after_rec is not None
    assert after_rec.get("ingredients") == before_ing, "Ingredients were changed!"


def test_apprentice_get_no_info(session):
    fake = "does-not-exist-recipe-xyz-256"
    g = session.get(f"{BASE}/api/apprentice/recipe/{fake}", timeout=15)
    assert g.status_code == 200
    d = g.json()
    assert d["has_info"] is False
    assert d["pieces_per_tray"] == ""
    assert d["shaping_note"] == ""


# ----- Voice daily quota -----
def test_voice_daily_limit_quota(session):
    # Reset usage (indirectly: use a random operator name today)
    import uuid
    op = f"TEST_op_{uuid.uuid4().hex[:6]}"

    # Set limit=2
    r = session.put(f"{BASE}/api/coordination/settings", json={"voice_daily_limit": 2}, timeout=15)
    assert r.status_code == 200, r.text
    assert int(r.json().get("voice_daily_limit")) == 2

    r1 = session.post(f"{BASE}/api/coordination/voice-quota", json={"operator": op, "critical": False}, timeout=15).json()
    r2 = session.post(f"{BASE}/api/coordination/voice-quota", json={"operator": op, "critical": False}, timeout=15).json()
    r3 = session.post(f"{BASE}/api/coordination/voice-quota", json={"operator": op, "critical": False}, timeout=15).json()
    assert r1.get("allowed") is True, r1
    assert r2.get("allowed") is True, r2
    assert r3.get("allowed") is False and r3.get("reason") == "limit_reached", r3

    # Critical bypass
    rc = session.post(f"{BASE}/api/coordination/voice-quota", json={"operator": op, "critical": True}, timeout=15).json()
    assert rc.get("allowed") is True and rc.get("reason") == "critical"

    # Unlimited (0)
    r = session.put(f"{BASE}/api/coordination/settings", json={"voice_daily_limit": 0}, timeout=15)
    assert r.status_code == 200
    for _ in range(3):
        ru = session.post(f"{BASE}/api/coordination/voice-quota", json={"operator": op, "critical": False}, timeout=15).json()
        assert ru.get("allowed") is True, ru


# ----- Cleanup dead/live endpoints -----
def test_lab_departments_removed(session):
    r = session.get(f"{BASE}/api/lab/departments", timeout=15)
    assert r.status_code == 404, f"expected 404, got {r.status_code}"


def test_depts_templates_alive(session):
    r = session.get(f"{BASE}/api/depts/templates", timeout=15)
    assert r.status_code == 200, r.text


# ----- Isolation regression: core endpoints still 200 -----
@pytest.mark.parametrize("path", [
    "/api/recipes",
    "/api/worker/board",
    "/api/delivery/run",
    "/api/coordination/settings",
])
def test_core_endpoints_alive(session, path):
    r = session.get(f"{BASE}{path}", timeout=15)
    assert r.status_code == 200, f"{path} -> {r.status_code} {r.text[:200]}"
