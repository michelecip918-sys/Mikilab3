"""Iter229 — Cold Chain (freezer w/ dept) + mike/machines + depts catalog."""
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
    # gate
    r = s.post(f"{BASE_URL}/api/admin-gate/verify", json={"pin": "198505"}, timeout=15)
    assert r.status_code == 200, r.text
    assert r.json().get("ok") is True
    # admin login
    r = s.post(f"{BASE_URL}/api/auth/login",
               json={"email": "admin@mikilab.de", "password": "Mikilab2026!"}, timeout=15)
    assert r.status_code == 200, r.text
    return s


def test_mike_machines(session):
    r = session.get(f"{BASE_URL}/api/mike/machines", timeout=15)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "machines" in data
    assert isinstance(data["machines"], list)


def test_depts_catalog(session):
    r = session.get(f"{BASE_URL}/api/depts", timeout=15)
    assert r.status_code == 200, r.text
    data = r.json()
    # should return department info with cells info per dept
    assert isinstance(data, (dict, list))


def test_freezer_put_and_get_with_dept(session):
    items = [
        {"name": "TEST_pain_surgel", "qty": 120, "min_qty": 200, "dept": "panificio"},
        {"name": "TEST_croissant", "qty": 300, "min_qty": 100, "dept": "pasticceria"},
    ]
    r = session.put(f"{BASE_URL}/api/freezer", json={"items": items}, timeout=15)
    assert r.status_code == 200, r.text
    resp = r.json()
    assert resp.get("ok") is True
    low = resp.get("low", [])
    assert any(i["name"] == "TEST_pain_surgel" for i in low)

    r = session.get(f"{BASE_URL}/api/freezer", timeout=15)
    assert r.status_code == 200, r.text
    got = r.json().get("items", [])
    names = [i["name"] for i in got]
    assert "TEST_pain_surgel" in names
    assert "TEST_croissant" in names
    # dept preserved
    m = {i["name"]: i for i in got}
    assert m["TEST_pain_surgel"].get("dept") == "panificio"
    assert m["TEST_croissant"].get("dept") == "pasticceria"


def test_freezer_cleanup(session):
    # remove test items — keep any pre-existing items intact
    r = session.get(f"{BASE_URL}/api/freezer", timeout=15)
    items = r.json().get("items", [])
    kept = [i for i in items if not str(i.get("name", "")).startswith("TEST_")]
    r = session.put(f"{BASE_URL}/api/freezer", json={"items": kept}, timeout=15)
    assert r.status_code == 200


def test_floor_gate_regression(session):
    """Regression: gate verify still returns level info."""
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/admin-gate/verify", json={"pin": "198505"}, timeout=15)
    assert r.status_code == 200
    body = r.json()
    assert body.get("ok") is True
    assert body.get("level") in ("master", "guest", "operator")
