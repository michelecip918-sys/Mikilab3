"""E2E tests: autoplan/dispatch → coordination_trigger integration."""
import os
import time
import pytest
import requests

def _load_backend_url():
    v = os.environ.get("REACT_APP_BACKEND_URL")
    if not v:
        try:
            with open("/app/frontend/.env") as f:
                for ln in f:
                    if ln.startswith("REACT_APP_BACKEND_URL="):
                        v = ln.strip().split("=", 1)[1]
                        break
        except Exception:
            pass
    assert v, "REACT_APP_BACKEND_URL is not configured"
    return v.rstrip("/")


BASE_URL = _load_backend_url()
GATE_PIN = "198505"
ADMIN_EMAIL = "admin@mikilab.de"
ADMIN_PASS = "Mikilab2026!"

TEST_TAG = f"TEST_DISP_{int(time.time())}"


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    # 1) gate
    r = s.post(f"{BASE_URL}/api/admin-gate/verify", json={"pin": GATE_PIN}, timeout=15)
    assert r.status_code == 200, f"gate: {r.status_code} {r.text}"
    # 2) admin login
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS}, timeout=15)
    assert r.status_code == 200, f"login: {r.status_code} {r.text}"
    # ensure autonomous mode (capo away) so trigger creates real 'pending' calls not proposals
    try:
        s.post(f"{BASE_URL}/api/coordination/capo-presence", json={"action": "leave"}, timeout=15)
    except Exception:
        pass
    return s


def _dispatch(client, batches):
    r = client.post(f"{BASE_URL}/api/mike/autoplan/dispatch", json={"batches": batches}, timeout=30)
    assert r.status_code == 200, f"dispatch fail {r.status_code} {r.text}"
    return r.json()


def _active_calls(client):
    r = client.get(f"{BASE_URL}/api/coordination/active", timeout=15)
    assert r.status_code == 200, f"active fail {r.status_code} {r.text}"
    data = r.json()
    calls = data.get("calls") if isinstance(data, dict) else data
    return calls or []


# ---------- Non-regression: bare endpoints still 200 ----------
def test_non_regression_endpoints_200(client):
    # POST /api/mike/autoplan (preview) with empty body should not 500
    r = client.post(f"{BASE_URL}/api/mike/autoplan", json={}, timeout=30)
    assert r.status_code in (200, 400, 422), f"/api/mike/autoplan -> {r.status_code} {r.text[:200]}"
    for path in ["/api/coordination/active", "/api/coordination/settings", "/api/delivery/run"]:
        r = client.get(f"{BASE_URL}{path}", timeout=20)
        assert r.status_code == 200, f"{path} -> {r.status_code} {r.text[:200]}"


# ---------- E2E: dispatch panificio piccolo → call in /coordination/active ----------
def test_dispatch_panificio_creates_call(client):
    task_desc = f"{TEST_TAG} Pane di semola"
    resp = _dispatch(client, [{
        "product": task_desc, "line": "Linea Arion", "start": "05:30", "qty": "6 kg"
    }])
    assert resp.get("coordination_triggered", 0) >= 1, f"coordination_triggered not >=1: {resp}"

    calls = _active_calls(client)
    match = [c for c in calls if c.get("task_desc") == task_desc and c.get("dept") == "panificio"]
    assert match, f"expected call for {task_desc} in /coordination/active, got: {[(c.get('dept'), c.get('task_desc'), c.get('source')) for c in calls]}"
    c = match[0]
    assert c.get("source") == "piano"
    # operator call (qty 6kg < threshold) => status pending or uncovered
    assert c.get("status") in ("pending", "uncovered"), f"unexpected status: {c.get('status')}"


# ---------- Deduzione reparto (mapping) ----------
@pytest.mark.parametrize("prod,line,expected_dept", [
    ("Pizza Margherita", "Linea Pizza", "pizzeria"),
    ("Cornetto sfoglia", "Pasticceria", "pasticceria"),
    ("Laugen brezel", "Linea Laugen", "laugen"),
    ("Pane integrale", "Forno 1", "panificio"),
])
def test_dept_mapping(client, prod, line, expected_dept):
    tag = f"{TEST_TAG} {prod}"
    resp = _dispatch(client, [{"product": tag, "line": line, "start": "06:00", "qty": "5 kg"}])
    assert resp.get("coordination_triggered", 0) >= 1
    calls = _active_calls(client)
    m = [c for c in calls if c.get("task_desc") == tag]
    assert m, f"call missing for {tag}"
    assert m[0].get("dept") == expected_dept, f"expected dept {expected_dept}, got {m[0].get('dept')}"


# ---------- Batch senza reparto: no error, no coordination_triggered ----------
def test_unknown_dept_no_error(client):
    resp = _dispatch(client, [{"product": f"{TEST_TAG} xyzzy foo", "line": "Zeta", "start": "07:00", "qty": "3 kg"}])
    # allowed (no exception) & this batch does not increment coord (dept None)
    assert "coordination_triggered" in resp
    # If ONLY this batch dispatched, coord_triggered should be 0
    assert resp.get("coordination_triggered", 0) == 0, f"unexpected coord for unknown dept: {resp}"


# ---------- Soglia macchina: qty grande => call 'machine' (o fallback) ----------
def test_machine_threshold_large_qty(client):
    """qty >= 25 kg va a macchina: la call va in 'machine' e non genera operatore.
    /coordination/active elenca solo pending/uncovered → il task_desc NON deve comparire come pending."""
    tag = f"{TEST_TAG} Pane grosso"
    resp = _dispatch(client, [{"product": tag, "line": "Linea Arion", "start": "06:00", "qty": "50 kg"}])
    assert resp.get("coordination_triggered", 0) >= 1
    calls = _active_calls(client)
    m = [c for c in calls if c.get("task_desc") == tag]
    # 50kg è sopra soglia: la call viene risolta a MACCHINA e potrebbe non apparire in /active
    # (o compare con status 'machine'). NON deve essere 'uncovered' o 'pending' per operatore.
    if m:
        st = m[0].get("status")
        assert st == "machine", f"expected 'machine' resolution, got {st}"


# ---------- Operatore proposto: abilita e verifica 'pending' con operator ----------
def test_operator_assigned_when_skilled_available(client):
    # find an operator name from the pool
    r = client.get(f"{BASE_URL}/api/operators/skills", timeout=15)
    assert r.status_code == 200
    ops = (r.json() or {}).get("operators") or []
    # pick a free one
    free = [o for o in ops if (o.get("status") or "free") == "free"]
    if not free:
        pytest.skip("no free operator in shift plan pool")
    op_name = free[0]["name"]
    # enable panificio skill
    r = client.put(f"{BASE_URL}/api/operators/skills",
                   json={"name": op_name, "departments": ["panificio"], "is_driver": False}, timeout=15)
    assert r.status_code == 200

    tag = f"{TEST_TAG} Pane assign"
    resp = _dispatch(client, [{"product": tag, "line": "Linea Arion", "start": "05:30", "qty": "6 kg"}])
    assert resp.get("coordination_triggered", 0) >= 1
    calls = _active_calls(client)
    m = [c for c in calls if c.get("task_desc") == tag]
    assert m, "call missing"
    c = m[0]
    # status should be 'pending' with current_operator assigned
    if c.get("status") == "uncovered":
        pytest.fail(f"expected 'pending' with operator, got 'uncovered'. queue={c.get('queue')}")
    assert c.get("status") == "pending"
    assert c.get("current_operator"), f"no current_operator set: {c}"


# ---------- Cleanup: rimuovi tasks/calls creati dai test ----------
def test_zz_cleanup(client):
    """Rimuove i dati di test creati (best-effort tramite endpoint pubblici)."""
    # Prova a chiudere tutte le call attive create dai test
    calls = _active_calls(client)
    removed = 0
    for c in calls:
        td = c.get("task_desc") or ""
        if TEST_TAG in td:
            # tenta un dismiss/cancel se esistente
            for path in [f"/api/coordination/calls/{c.get('id')}/dismiss",
                         f"/api/coordination/calls/{c.get('id')}/cancel",
                         f"/api/coordination/calls/{c.get('id')}"]:
                try:
                    if path.endswith(c.get('id') or ''):
                        rr = client.delete(f"{BASE_URL}{path}", timeout=10)
                    else:
                        rr = client.post(f"{BASE_URL}{path}", json={}, timeout=10)
                    if rr.status_code < 400:
                        removed += 1
                        break
                except Exception:
                    pass
    print(f"cleanup: attempted to close {removed} test calls (TAG={TEST_TAG})")
