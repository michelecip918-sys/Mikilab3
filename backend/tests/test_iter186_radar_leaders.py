"""Iter 186 — Radar Spaziale (solo Master) + Delega Caposquadra per linea prodotto."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # fallback: read frontend .env
    with open("/app/frontend/.env") as f:
        for ln in f:
            if ln.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = ln.split("=", 1)[1].strip().rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@mikilab.de"
ADMIN_PASSWORD = "Mikilab2026!"


@pytest.fixture(scope="module")
def anon():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def admin():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    return s


# --- Radar auth gating ---
def test_radar_requires_admin(anon):
    r = anon.get(f"{API}/plant/radar")
    assert r.status_code in (401, 403), f"expected 401/403 got {r.status_code}"


def test_radar_admin_ok(admin):
    r = admin.get(f"{API}/plant/radar")
    assert r.status_code == 200
    data = r.json()
    assert "zones" in data and "workers" in data
    assert len(data["zones"]) == 7
    assert isinstance(data["workers"], list) and len(data["workers"]) >= 1
    assert "anomalies" in data and isinstance(data["anomalies"], int)
    assert "count" in data and data["count"] == len(data["workers"])
    for w in data["workers"]:
        for k in ("name", "zone", "x", "y", "color", "task", "is_leader", "anomaly", "aura_effect"):
            assert k in w, f"missing {k} in worker {w}"
        assert 2 <= w["x"] <= 98
        assert 2 <= w["y"] <= 98


# --- Layout ---
def test_layout_get(anon):
    r = anon.get(f"{API}/plant/layout")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data.get("zones"), list) and len(data["zones"]) >= 7


def test_layout_put_admin(admin):
    # save empty list -> should fall back to default zones
    r = admin.put(f"{API}/plant/layout", json={"zones": []})
    assert r.status_code == 200
    data = r.json()
    assert data.get("ok") is True
    assert len(data.get("zones", [])) == 7


# --- Line leaders ---
def test_line_leaders_get(anon):
    r = anon.get(f"{API}/plant/line-leaders")
    assert r.status_code == 200
    data = r.json()
    line_ids = {l["id"] for l in data["lines"]}
    assert {"baguette", "pane", "pizzeria", "pasticceria"} <= line_ids
    assert isinstance(data.get("leaders"), dict)


def test_line_leaders_set_christoph_baguette(admin):
    r = admin.post(f"{API}/plant/line-leaders", json={"line": "baguette", "leader": "Christoph"})
    assert r.status_code == 200
    data = r.json()
    assert data.get("ok") is True
    assert data["leaders"].get("baguette") == "Christoph"

    # verify persistence via GET
    r2 = admin.get(f"{API}/plant/line-leaders")
    assert r2.status_code == 200
    assert r2.json()["leaders"].get("baguette") == "Christoph"


def test_leader_tasks_christoph(admin):
    r = admin.get(f"{API}/plant/leader-tasks", params={"leader": "Christoph"})
    assert r.status_code == 200
    data = r.json()
    assert "baguette" in data["lines"]
    titles = [t["title"] for t in data["tasks"]]
    assert any("Validazione qualità" in t and "Baguette" in t for t in titles)
    assert any("Controllo lievitazione" in t for t in titles)


def test_line_leaders_remove(admin):
    r = admin.post(f"{API}/plant/line-leaders", json={"line": "baguette", "leader": ""})
    assert r.status_code == 200
    data = r.json()
    assert "baguette" not in data["leaders"]

    # verify leader tasks now empty
    r2 = admin.get(f"{API}/plant/leader-tasks", params={"leader": "Christoph"})
    assert r2.status_code == 200
    assert r2.json()["tasks"] == []
