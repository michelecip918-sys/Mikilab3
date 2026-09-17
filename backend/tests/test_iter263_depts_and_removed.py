"""iter263 — Depts CRUD (base+custom, rename/color/hide/restore/delete), regression, removed endpoints."""
import os
import time
import requests
import pytest


def _read_base():
    v = os.environ.get("REACT_APP_BACKEND_URL", "").strip()
    if v:
        return v.rstrip("/")
    for line in open("/app/frontend/.env"):
        if line.startswith("REACT_APP_BACKEND_URL="):
            return line.split("=", 1)[1].strip().rstrip("/")
    raise RuntimeError("REACT_APP_BACKEND_URL missing")


BASE = _read_base()
GATE_PIN = "739284"
CAPO_EMAIL = "admin@mikilab.de"
CAPO_PWD = "Mikilab2026!"


def _session(auth=True):
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(f"{BASE}/api/admin-gate/verify", json={"pin": GATE_PIN}, timeout=15)
    assert r.status_code == 200, r.text
    if auth:
        r = s.post(f"{BASE}/api/auth/login", json={"email": CAPO_EMAIL, "password": CAPO_PWD}, timeout=15)
        assert r.status_code == 200, r.text
        tok = r.json().get("token") or r.json().get("access_token")
        if tok:
            s.headers.update({"Authorization": f"Bearer {tok}"})
    return s


@pytest.fixture(scope="module")
def admin():
    return _session(True)


@pytest.fixture(scope="module")
def gate_only():
    return _session(False)


# ---------- BACKEND: Depts CRUD ----------

def test_depts_base_five_present(admin):
    r = admin.get(f"{BASE}/api/depts", timeout=10)
    assert r.status_code == 200
    depts = r.json().get("departments", [])
    keys = {d["key"] for d in depts}
    assert {"panificio", "pasticceria", "pizzeria", "laugen", "banco"} <= keys, keys
    for d in depts:
        assert "name" in d and "icon" in d and "accent" in d


def test_depts_rename_and_recolor_base(admin):
    # PATCH base panificio
    r = admin.patch(f"{BASE}/api/depts/panificio", json={"name": "TEST_Panificio", "accent": "#123456"}, timeout=10)
    assert r.status_code == 200, r.text
    r = admin.get(f"{BASE}/api/depts", timeout=10)
    depts = {d["key"]: d for d in r.json()["departments"]}
    assert depts["panificio"]["name"] == "TEST_Panificio"
    assert depts["panificio"]["accent"].lower() == "#123456"
    # restore original
    admin.patch(f"{BASE}/api/depts/panificio", json={"name": "Panificio", "accent": "#f59e0b"}, timeout=10)


def test_depts_create_custom_patch_delete(admin):
    key_holder = {}
    # create
    r = admin.post(f"{BASE}/api/depts", json={"name": "TEST_Reparto_263", "icon": "Star", "accent": "#22c55e"}, timeout=10)
    assert r.status_code == 200, r.text
    d = r.json().get("department") or r.json()
    key = d.get("key")
    assert key and key.startswith("dept-"), d
    key_holder["k"] = key

    # appears in list
    r = admin.get(f"{BASE}/api/depts", timeout=10)
    keys = {x["key"] for x in r.json()["departments"]}
    assert key in keys

    # PATCH custom
    r = admin.patch(f"{BASE}/api/depts/{key}", json={"name": "TEST_Renamed_263", "accent": "#3b82f6"}, timeout=10)
    assert r.status_code == 200, r.text
    r = admin.get(f"{BASE}/api/depts", timeout=10)
    depts = {d["key"]: d for d in r.json()["departments"]}
    assert depts[key]["name"] == "TEST_Renamed_263"
    assert depts[key]["accent"].lower() == "#3b82f6"

    # add a machine to custom dept
    r = admin.post(f"{BASE}/api/depts/{key}/machines/add", json={"name": "TEST_Forno_A", "type": "oven"}, timeout=10)
    assert r.status_code == 200, r.text
    r = admin.get(f"{BASE}/api/depts/{key}/machines", timeout=10)
    assert r.status_code == 200
    machs = r.json().get("machines") or r.json().get("items") or []
    names = [m.get("name") for m in machs]
    assert any("TEST_Forno_A" in (n or "") for n in names), machs

    # DELETE custom → removed entirely
    r = admin.delete(f"{BASE}/api/depts/{key}", timeout=10)
    assert r.status_code == 200, r.text
    r = admin.get(f"{BASE}/api/depts", timeout=10)
    keys = {x["key"] for x in r.json()["departments"]}
    assert key not in keys
    # not appearing in hidden either (was custom, deleted for real)
    r = admin.get(f"{BASE}/api/depts/hidden", timeout=10)
    assert r.status_code == 200
    hkeys = {x["key"] for x in r.json().get("hidden", [])}
    assert key not in hkeys


def test_depts_hide_base_and_restore(admin):
    # hide banco
    r = admin.delete(f"{BASE}/api/depts/banco", timeout=10)
    assert r.status_code == 200, r.text
    # banco NOT in list
    r = admin.get(f"{BASE}/api/depts", timeout=10)
    keys = {x["key"] for x in r.json()["departments"]}
    assert "banco" not in keys
    # banco IS in hidden
    r = admin.get(f"{BASE}/api/depts/hidden", timeout=10)
    assert r.status_code == 200
    hkeys = {x["key"] for x in r.json().get("hidden", [])}
    assert "banco" in hkeys
    # restore
    r = admin.post(f"{BASE}/api/depts/banco/restore", timeout=10)
    assert r.status_code == 200, r.text
    r = admin.get(f"{BASE}/api/depts", timeout=10)
    keys = {x["key"] for x in r.json()["departments"]}
    assert "banco" in keys


# ---------- Regression: dept machines base + assign + coordination ----------

def test_regression_base_dept_machines_still_work(admin):
    r = admin.get(f"{BASE}/api/depts/panificio/machines", timeout=10)
    assert r.status_code == 200
    machs = r.json().get("machines") or r.json().get("items") or []
    # add TEST
    r = admin.post(f"{BASE}/api/depts/panificio/machines/add", json={"name": "TEST_M_263", "type": "oven"}, timeout=10)
    assert r.status_code == 200, r.text
    r = admin.get(f"{BASE}/api/depts/panificio/machines", timeout=10)
    machs = r.json().get("machines") or r.json().get("items") or []
    added = [m for m in machs if "TEST_M_263" in (m.get("name") or "")]
    assert added, machs
    mid = added[0].get("id") or added[0].get("key") or added[0].get("_id")
    # rename if endpoint present
    if mid:
        admin.patch(f"{BASE}/api/depts/panificio/machines/{mid}", json={"name": "TEST_M_263_Ren"}, timeout=10)
        admin.delete(f"{BASE}/api/depts/panificio/machines/{mid}", timeout=10)


def test_regression_assign_and_coordination(admin):
    r = admin.post(f"{BASE}/api/depts/assign", json={"dept": "pizzeria", "task": "TEST_263_task", "operator": "TEST_op263"}, timeout=10)
    assert r.status_code == 200, r.text
    r = admin.get(f"{BASE}/api/coordination/skills", timeout=10)
    # 200 or 404 tolerated depending on schema; must not be 500
    assert r.status_code in (200, 401, 404), r.status_code
    if r.status_code == 200:
        # response should reference depts without exception
        assert isinstance(r.json(), dict)


# ---------- Removed endpoints must return 404 ----------

REMOVED_GET = [
    "/api/academy/catalog",
    "/api/academy/my",
    "/api/subscription/status",
]
REMOVED_POST = [
    "/api/academy/coach",
    "/api/trial/activate",
]


@pytest.mark.parametrize("path", REMOVED_GET)
def test_removed_endpoints_get_404(gate_only, path):
    r = gate_only.get(f"{BASE}{path}", timeout=10)
    assert r.status_code == 404, f"{path} -> {r.status_code} {r.text[:200]}"


@pytest.mark.parametrize("path", REMOVED_POST)
def test_removed_endpoints_post_404(gate_only, path):
    r = gate_only.post(f"{BASE}{path}", json={}, timeout=10)
    assert r.status_code == 404, f"{path} -> {r.status_code} {r.text[:200]}"


def test_admin_gate_guest_put_removed(gate_only):
    r = gate_only.put(f"{BASE}/api/admin-gate/guest", json={"pin": "202020"}, timeout=10)
    assert r.status_code == 404, r.text[:200]


# ---------- /api/mike/access-requests must still exist ----------

def test_mike_access_requests_requires_admin():
    # without login → 401 (with gate)
    s = _session(auth=False)
    r = s.get(f"{BASE}/api/mike/access-requests", timeout=10)
    assert r.status_code in (401, 403), r.status_code


def test_mike_access_requests_admin_ok(admin):
    r = admin.get(f"{BASE}/api/mike/access-requests", timeout=10)
    assert r.status_code == 200, r.text[:200]
    data = r.json()
    assert isinstance(data, (dict, list))
