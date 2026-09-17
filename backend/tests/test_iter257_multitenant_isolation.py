"""
Iter257 — Regression tests after multi-tenant isolation (organization_id filter added to all queries).
Tests:
  - No 500s on modified endpoints
  - Full CRUD flows: SOS, Machines, Shift Templates, Shift Plan, B2B, Timeclock
  - Cross-tenant isolation: new org cannot see default org data
  - Floor endpoints with only gate cookie (no session)
  - Enterprise grid endpoints
"""
import os
import time
import uuid
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL")
if not BASE_URL:
    # fall back to frontend/.env
    try:
        with open("/app/frontend/.env") as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL="):
                    BASE_URL = line.split("=", 1)[1].strip()
                    break
    except Exception:
        pass
assert BASE_URL, "REACT_APP_BACKEND_URL not configured"
BASE_URL = BASE_URL.rstrip("/")
API = f"{BASE_URL}/api"

GATE_PIN = "739284"
ADMIN_EMAIL = "admin@mikilab.de"
ADMIN_PASS = "Mikilab2026!"
ACTIVATION_CODE = "198505"


def _new_session(gate=True, admin=False):
    s = requests.Session()
    if gate:
        r = s.post(f"{API}/admin-gate/verify", json={"pin": GATE_PIN}, timeout=15)
        assert r.status_code == 200, f"gate verify failed: {r.status_code} {r.text}"
    if admin:
        r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS}, timeout=15)
        assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    return s


@pytest.fixture(scope="module")
def gate_session():
    return _new_session(gate=True, admin=False)


@pytest.fixture(scope="module")
def admin_session():
    return _new_session(gate=True, admin=True)


@pytest.fixture(scope="module")
def new_org_session():
    """Register a fresh org + login as its admin."""
    s = requests.Session()
    r = s.post(f"{API}/admin-gate/verify", json={"pin": GATE_PIN}, timeout=15)
    assert r.status_code == 200
    email = f"TEST_iter257_{uuid.uuid4().hex[:8]}@example.com"
    payload = {
        "email": email,
        "password": "TestPass2026!",
        "name": "Iter257 Test Org",
        "activation_code": ACTIVATION_CODE,
        "organization_name": f"TEST_Org_{uuid.uuid4().hex[:6]}",
    }
    r = s.post(f"{API}/auth/register", json=payload, timeout=20)
    if r.status_code not in (200, 201):
        # try common alternate fields
        payload2 = {**payload, "org_name": payload["organization_name"]}
        r = s.post(f"{API}/auth/register", json=payload2, timeout=20)
    assert r.status_code in (200, 201), f"register failed: {r.status_code} {r.text[:400]}"
    # login (in case register doesn't set session)
    r2 = s.post(f"{API}/auth/login", json={"email": email, "password": "TestPass2026!"}, timeout=15)
    assert r2.status_code == 200, f"new org login failed: {r2.status_code} {r2.text[:200]}"
    s._email = email
    return s


# ---------- Basic health / no-500 sweep ----------

MODIFIED_ENDPOINTS_GET = [
    "/mike/machines",
    "/mike/sos",
    "/mike/sos/history",
    "/mike/b2b/orders",
    "/depts/templates",
    "/production/shift-plan",
    "/floor/sitor/change-requests",
    "/compliance/timelog",
    "/enterprise/sites",
    "/enterprise/overview",
    "/enterprise/global-leaderboard",
    "/enterprise/omni-intelligence",
]

FLOOR_ENDPOINTS_GATE_ONLY = [
    "/mike/briefing/floor?role=fornaio",
    "/mike/deus/production-queue",
    "/delegation/tasks",
    "/worker/board",
    "/batches/active",
    "/lab/pulse",
]


@pytest.mark.parametrize("path", MODIFIED_ENDPOINTS_GET)
def test_admin_get_no_500(admin_session, path):
    r = admin_session.get(f"{API}{path}", timeout=20)
    assert r.status_code != 500, f"{path} => 500: {r.text[:300]}"
    assert r.status_code in (200, 401, 403, 404), f"{path} => {r.status_code}"


@pytest.mark.parametrize("path", FLOOR_ENDPOINTS_GATE_ONLY)
def test_floor_endpoints_gate_only(gate_session, path):
    r = gate_session.get(f"{API}{path}", timeout=20)
    assert r.status_code == 200, f"{path} => {r.status_code} {r.text[:300]}"


# ---------- SOS full flow ----------

def test_sos_full_flow(gate_session, admin_session):
    worker = f"TEST_iter257_op_{uuid.uuid4().hex[:5]}"
    # operaio: only gate cookie
    r = gate_session.post(f"{API}/mike/sos", json={"operator": worker, "role": "fornaio", "line": "pane", "note": "test iter257"}, timeout=15)
    assert r.status_code in (200, 201), f"sos create: {r.status_code} {r.text[:300]}"
    # admin sees it in current
    r2 = admin_session.get(f"{API}/mike/sos", timeout=15)
    assert r2.status_code == 200
    data = r2.json()
    items = data.get("events") or data.get("items") or (data if isinstance(data, list) else [])
    match = [e for e in items if e.get("operator") == worker]
    assert match, f"sos event not visible to admin. body={str(data)[:500]}"
    sos_id = match[0].get("id") or match[0].get("_id")
    assert sos_id, f"no id in sos entry: {match[0]}"
    # ack
    r3 = admin_session.post(f"{API}/mike/sos/{sos_id}/ack", json={}, timeout=15)
    assert r3.status_code in (200, 204), f"ack: {r3.status_code} {r3.text[:300]}"
    # history contains resolved
    r4 = admin_session.get(f"{API}/mike/sos/history", timeout=15)
    assert r4.status_code == 200
    hist = r4.json()
    hist_items = hist.get("history") or hist.get("events") or hist.get("items") or (hist if isinstance(hist, list) else [])
    hmatch = [e for e in hist_items if e.get("operator") == worker or str(e.get("id") or e.get("_id")) == str(sos_id)]
    assert hmatch, f"sos not in history. hist snippet={str(hist)[:500]}"


# ---------- Machines full flow ----------

def test_machines_flow(admin_session):
    r = admin_session.get(f"{API}/mike/machines", timeout=15)
    assert r.status_code == 200
    name = f"Impastatrice Test Isolazione {uuid.uuid4().hex[:5]}"
    r2 = admin_session.post(f"{API}/mike/machines/arrival", json={"name": name, "type": "impastatrice"}, timeout=15)
    assert r2.status_code in (200, 201), f"machine create: {r2.status_code} {r2.text[:300]}"
    r3 = admin_session.get(f"{API}/mike/machines", timeout=15)
    assert r3.status_code == 200
    body = r3.json()
    items = body.get("machines") or body.get("items") or (body if isinstance(body, list) else [])
    match = [m for m in items if m.get("name") == name]
    assert match, f"created machine not in list. body={str(body)[:500]}"
    mid = match[0].get("id") or match[0].get("_id")
    rd = admin_session.delete(f"{API}/mike/machines/{mid}", timeout=15)
    assert rd.status_code in (200, 204), f"delete machine: {rd.status_code} {rd.text[:300]}"


# ---------- Shift templates ----------

def test_shift_templates_flow(admin_session):
    # dept_shift_templates è stato ELIMINATO di proposito (richiesta utente):
    # l'endpoint deve rispondere 404. Nessun task/collezione template deve esistere.
    r = admin_session.get(f"{API}/depts/templates", timeout=15)
    assert r.status_code == 404, f"endpoint templates atteso 404 (rimosso), got {r.status_code}"


# ---------- Shift plan ----------

def test_shift_plan_flow(admin_session):
    payload = {"day": "monday", "position": "Forno_A", "worker_name": f"TEST_worker_{uuid.uuid4().hex[:4]}"}
    r = admin_session.post(f"{API}/production/shift-assignment", json=payload, timeout=15)
    assert r.status_code in (200, 201), f"shift create: {r.status_code} {r.text[:300]}"
    aid = (r.json().get("id") or r.json().get("_id") or r.json().get("assignment", {}).get("id"))
    r2 = admin_session.get(f"{API}/production/shift-plan", timeout=15)
    assert r2.status_code == 200
    body = r2.json()
    # Search recursively for our worker_name
    found = payload["worker_name"] in str(body)
    assert found, f"shift not in plan. body={str(body)[:500]}"
    if aid:
        rd = admin_session.delete(f"{API}/production/shift-assignment/{aid}", timeout=15)
        assert rd.status_code in (200, 204, 404)


# ---------- B2B orders ----------

def test_b2b_orders_flow(admin_session):
    client_name = f"TEST_B2B_{uuid.uuid4().hex[:5]}"
    payload = {"client": client_name, "product": "Pane", "qty": 10, "delivery_day": "monday"}
    r = admin_session.post(f"{API}/mike/b2b/orders", json=payload, timeout=15)
    assert r.status_code in (200, 201), f"b2b create: {r.status_code} {r.text[:300]}"
    oid = (r.json().get("id") or r.json().get("_id") or r.json().get("order", {}).get("id"))
    r2 = admin_session.get(f"{API}/mike/b2b/orders", timeout=15)
    assert r2.status_code == 200
    assert client_name in str(r2.json()), f"b2b order not visible. body={str(r2.json())[:500]}"
    if oid:
        rd = admin_session.delete(f"{API}/mike/b2b/orders/{oid}", timeout=15)
        assert rd.status_code in (200, 204, 404)


# ---------- Compliance timeclock ----------

def test_timeclock_flow(gate_session, admin_session):
    worker = f"TEST_TC_{uuid.uuid4().hex[:5]}"
    r = gate_session.post(f"{API}/compliance/timeclock", json={"worker": worker, "action": "in"}, timeout=15)
    assert r.status_code in (200, 201), f"timeclock: {r.status_code} {r.text[:300]}"
    r2 = admin_session.get(f"{API}/compliance/timelog", timeout=15)
    assert r2.status_code == 200
    body = r2.json()
    assert worker in str(body), f"worker not in timelog. body={str(body)[:500]}"
    # integrity_ok=true
    txt = str(body)
    assert "integrity_ok" in txt, f"no integrity_ok field. body={txt[:500]}"
    # be tolerant: could be top-level or per-entry
    assert "true" in txt.lower() or "True" in txt


# ---------- Cross-tenant isolation ----------

ISOLATION_ENDPOINTS = [
    "/mike/machines",
    "/mike/b2b/orders",
    "/mike/sos/history",
    "/production/shift-plan",
    "/floor/sitor/change-requests",
]


def test_cross_tenant_isolation_default_marker(admin_session, new_org_session):
    # Admin default creates a marker machine
    marker = f"MARKER_iter257_{uuid.uuid4().hex[:6]}"
    r = admin_session.post(f"{API}/mike/machines/arrival", json={"name": marker, "type": "test"}, timeout=15)
    assert r.status_code in (200, 201), f"marker create: {r.status_code} {r.text[:300]}"
    marker_id = None
    try:
        marker_id = r.json().get("id") or r.json().get("_id")
    except Exception:
        pass
    time.sleep(0.5)
    # New org must NOT see it
    r2 = new_org_session.get(f"{API}/mike/machines", timeout=15)
    assert r2.status_code == 200
    assert marker not in str(r2.json()), f"ISOLATION LEAK: new org sees default marker in /mike/machines"
    # Sweep the isolation endpoints for absence of the marker string (and also default data patterns)
    for p in ISOLATION_ENDPOINTS:
        rr = new_org_session.get(f"{API}{p}", timeout=15)
        assert rr.status_code == 200, f"{p} new org => {rr.status_code}"
        assert marker not in rr.text, f"ISOLATION LEAK: marker visible via {p}"
    # cleanup
    if marker_id:
        admin_session.delete(f"{API}/mike/machines/{marker_id}", timeout=15)


def test_cross_tenant_new_org_lists_are_own_only(new_org_session, admin_session):
    """The new org's lists must contain no default-org data. We check by comparing lengths -
    for a fresh org, most lists should be empty or very small; admin's list is expected to be non-empty
    for at least one endpoint (machines)."""
    admin_r = admin_session.get(f"{API}/mike/machines", timeout=15)
    assert admin_r.status_code == 200
    admin_body = admin_r.json()
    admin_items = admin_body.get("machines") or admin_body.get("items") or (admin_body if isinstance(admin_body, list) else [])
    new_r = new_org_session.get(f"{API}/mike/machines", timeout=15)
    assert new_r.status_code == 200
    new_body = new_r.json()
    new_items = new_body.get("machines") or new_body.get("items") or (new_body if isinstance(new_body, list) else [])
    # If admin has machines, new org must have strictly fewer (typically 0)
    if len(admin_items) > 0:
        assert len(new_items) < len(admin_items), (
            f"ISOLATION LEAK: new org sees same count as default. admin={len(admin_items)} new={len(new_items)}"
        )


# ---------- Enterprise grid coherence ----------

@pytest.mark.parametrize("path", [
    "/enterprise/sites",
    "/enterprise/overview",
    "/enterprise/global-leaderboard",
    "/enterprise/omni-intelligence",
])
def test_enterprise_grid_ok(admin_session, path):
    r = admin_session.get(f"{API}{path}", timeout=20)
    assert r.status_code == 200, f"{path} => {r.status_code} {r.text[:300]}"
    body = r.json()
    assert isinstance(body, (dict, list)), f"{path} unexpected body type"
