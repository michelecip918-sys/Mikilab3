"""Iter231 — Freezer auto-scale on AutoPlan dispatch."""
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


def _put_freezer(session, items):
    r = session.put(f"{BASE_URL}/api/freezer", json={"items": items}, timeout=15)
    assert r.status_code == 200, r.text
    return r.json()


def _get_freezer(session):
    r = session.get(f"{BASE_URL}/api/freezer", timeout=15)
    assert r.status_code == 200, r.text
    data = r.json()
    return data.get("items") if isinstance(data, dict) else data


def test_freezer_autoscale_on_dispatch(session):
    # Seed freezer
    _put_freezer(session, [{"name": "Baguette semilavorate", "qty": 120, "dept": "panificio"}])
    items = _get_freezer(session)
    assert any(i.get("name") == "Baguette semilavorate" and i.get("qty") == 120 for i in items), items

    body = {
        "batches": [{"product": "Baguette", "qty": "80", "line": "pane"}]
    }
    r = session.post(f"{BASE_URL}/api/mike/autoplan/dispatch", json=body, timeout=30)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data.get("ok") is True, data
    assert data.get("created") == 1, data
    fs = data.get("freezer_scaled") or []
    assert len(fs) == 1, data
    assert fs[0]["name"] == "Baguette semilavorate"
    assert fs[0]["used"] == 80
    assert fs[0]["left"] == 40

    # Verify persistence
    items = _get_freezer(session)
    row = [i for i in items if i.get("name") == "Baguette semilavorate"]
    assert row and row[0]["qty"] == 40, items


def test_freezer_no_match_no_change(session):
    _put_freezer(session, [{"name": "Baguette semilavorate", "qty": 40, "dept": "panificio"}])
    body = {"batches": [{"product": "Panettone", "qty": "10", "line": "pane"}]}
    r = session.post(f"{BASE_URL}/api/mike/autoplan/dispatch", json=body, timeout=30)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data.get("ok") is True, data
    fs = data.get("freezer_scaled") or []
    assert fs == [], data
    items = _get_freezer(session)
    row = [i for i in items if i.get("name") == "Baguette semilavorate"]
    assert row and row[0]["qty"] == 40, items


def test_cleanup_freezer(session):
    _put_freezer(session, [])
    items = _get_freezer(session)
    assert items == [] or items is None or len(items) == 0
