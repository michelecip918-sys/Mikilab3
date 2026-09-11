"""Iter230 — AutoPlan with freezer_stock + machines; /lab/sensors GET/POST."""
import os
import pytest
import requests
from pathlib import Path


def _load_frontend_url():
    envp = Path("/app/frontend/.env")
    for ln in envp.read_text().splitlines():
        if ln.startswith("REACT_APP_BACKEND_URL="):
            return ln.split("=", 1)[1].strip().rstrip("/")
    raise RuntimeError("REACT_APP_BACKEND_URL missing")


BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/") or _load_frontend_url()


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/admin-gate/verify", json={"pin": "198505"}, timeout=15)
    assert r.status_code == 200, r.text
    r = s.post(f"{BASE_URL}/api/auth/login",
               json={"email": "admin@mikilab.de", "password": "Mikilab2026!"}, timeout=15)
    assert r.status_code == 200, r.text
    return s


# --- (b) AutoPlan freezer_stock ---
def test_autoplan_accepts_machines_and_freezer_stock(session):
    body = {
        "orders_text": "200 baguette",
        "lang": "it",
        "machines": [],
        "freezer_stock": [
            {"name": "Baguette semilavorate", "qty": 120, "dept": "panificio"}
        ],
    }
    r = session.post(f"{BASE_URL}/api/mike/autoplan", json=body, timeout=60)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data.get("ok") is True, data
    # Plan should reflect freezer use
    plan = data.get("plan") or data
    text = str(plan).lower()
    # Expect mention of 120 or freezer usage / missing 80
    assert ("120" in text) or ("freezer" in text) or ("semilavorat" in text) or ("80" in text), \
        f"Freezer context not reflected in plan: {text[:500]}"


def test_autoplan_options_accepts_freezer_stock(session):
    body = {
        "orders_text": "200 baguette",
        "lang": "it",
        "machines": [],
        "freezer_stock": [
            {"name": "Baguette semilavorate", "qty": 120, "dept": "panificio"}
        ],
    }
    r = session.post(f"{BASE_URL}/api/mike/autoplan/options", json=body, timeout=60)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data.get("ok") is True or "options" in data or "plans" in data, data


def test_autoplan_extra_fields_no_longer_ignored(session):
    """Ensure the request model accepts new fields without validation error."""
    body = {
        "orders_text": "100 croissant",
        "lang": "it",
        "machines": ["forno1"],
        "freezer_stock": [],
    }
    r = session.post(f"{BASE_URL}/api/mike/autoplan", json=body, timeout=60)
    assert r.status_code == 200, r.text


# --- (d) /lab/sensors GET/POST ---
def test_sensors_post_and_readings(session):
    # Post a reading
    r = session.post(f"{BASE_URL}/api/lab/sensors",
                     json={"device_id": "TEST_t1", "type": "freezer", "value": -4},
                     timeout=15)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body.get("ok") is True or "id" in body or "reading" in body or body.get("device_id") == "TEST_t1"

    # GET readings
    r = session.get(f"{BASE_URL}/api/lab/sensors", timeout=15)
    assert r.status_code == 200, r.text
    data = r.json()
    # accept list or dict shape
    if isinstance(data, dict):
        readings = data.get("readings") or data.get("items") or []
    else:
        readings = data
    assert isinstance(readings, list), data
    # find our reading
    found = [x for x in readings if str(x.get("device_id", "")) == "TEST_t1"]
    assert len(found) >= 1, f"TEST_t1 reading not found among {readings[:5]}"
    # Value & type
    assert found[0].get("type") == "freezer"


def test_sensors_cleanup(session):
    """No delete endpoint expected; leave test data or app should filter. Non-fatal."""
    # If a delete endpoint exists, try it; otherwise pass
    try:
        session.delete(f"{BASE_URL}/api/lab/sensors?device_id=TEST_t1", timeout=10)
    except Exception:
        pass
