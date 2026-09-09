"""
Iteration 223: Verify Deck Reattivo (/api/deck/status) works after 209-file color recolor.
Tests: master gate PIN, admin login, deck/status shape, dept reactivity with a live shift,
and mood=critico when machines_down is set. Cleans up all created data.
"""
import os
import requests
from datetime import datetime, timezone, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://edit-33.preview.emergentagent.com').rstrip('/')
PIN = "198505"
ADMIN_EMAIL = "admin@mikilab.de"
ADMIN_PASS = "Mikilab2026!"


def _mk_session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


def test_master_gate_pin():
    s = _mk_session()
    r = s.post(f"{BASE_URL}/api/admin-gate/verify", json={"pin": PIN})
    assert r.status_code == 200, r.text
    d = r.json()
    assert d.get("ok") is True
    assert d.get("level") == "master"
    # cookie was set
    assert any(c.name == "mikilab_gate" for c in s.cookies)


def _gated_session():
    s = _mk_session()
    r = s.post(f"{BASE_URL}/api/admin-gate/verify", json={"pin": PIN})
    assert r.status_code == 200
    return s


def _admin_session():
    s = _gated_session()
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS})
    assert r.status_code == 200, r.text
    return s


def test_admin_login():
    s = _admin_session()
    r = s.get(f"{BASE_URL}/api/auth/me")
    assert r.status_code == 200
    me = r.json()
    assert me.get("email") == ADMIN_EMAIL


def test_deck_status_shape():
    s = _gated_session()
    r = s.get(f"{BASE_URL}/api/deck/status")
    assert r.status_code == 200, r.text
    d = r.json()
    for k in ("mood", "heartbeat", "score", "depts", "critical_stations"):
        assert k in d, f"missing {k} in {d.keys()}"
    assert d["mood"] in ("sereno", "attivo", "teso", "critico")
    for dept in ("panificio", "pizzeria", "pasticceria", "banco"):
        assert dept in d["depts"], f"missing dept {dept}"
        chunk = d["depts"][dept]
        for kk in ("active", "people", "level"):
            assert kk in chunk, f"missing {kk} in dept {dept}"
    assert isinstance(d["critical_stations"], list)


def test_deck_reactivity_end_to_end():
    """Create a shift NOW on Panificio → deck panificio.active>=1; add machines_down → mood critico."""
    s = _admin_session()
    now = datetime.now()
    start_dt = now - timedelta(minutes=30)
    end_dt = now + timedelta(hours=2)
    shift_payload = {
        "employee": "TEST_DeckOp",
        "role": "Panettiere",
        "station": "Panificio",
        "day": now.strftime("%Y-%m-%d"),
        "start": start_dt.strftime("%H:%M"),
        "end": end_dt.strftime("%H:%M"),
        "notes": "TEST_iter223_deck"
    }
    r = s.post(f"{BASE_URL}/api/shifts", json=shift_payload)
    assert r.status_code in (200, 201), f"shift create failed: {r.status_code} {r.text}"
    shift = r.json()
    shift_id = shift.get("id") or shift.get("_id")
    assert shift_id, f"no shift id in {shift}"

    original_state = None
    try:
        # verify deck reflects the new active shift
        r = s.get(f"{BASE_URL}/api/deck/status")
        assert r.status_code == 200
        d = r.json()
        assert d["depts"]["panificio"]["active"] >= 1, f"panificio not active: {d['depts']['panificio']}"

        # snapshot current lab shift-state
        r = s.get(f"{BASE_URL}/api/lab/shift-state")
        if r.status_code == 200:
            original_state = r.json()

        # trigger critico via machines_down
        payload = {"machines_down": [{"id": "forno_pizzeria_1", "name": "Forno Pizzeria"}]}
        r = s.put(f"{BASE_URL}/api/lab/shift-state", json=payload)
        assert r.status_code == 200, f"shift-state PUT failed: {r.status_code} {r.text}"

        r = s.get(f"{BASE_URL}/api/deck/status")
        assert r.status_code == 200
        d = r.json()
        assert d["mood"] == "critico", f"expected critico, got {d['mood']}: crit={d.get('critical_stations')}"
        assert len(d["critical_stations"]) >= 1
    finally:
        # cleanup shift-state
        try:
            s.put(f"{BASE_URL}/api/lab/shift-state", json={"machines_down": []})
        except Exception:
            pass
        # cleanup shift
        try:
            s.delete(f"{BASE_URL}/api/shifts/{shift_id}")
        except Exception:
            pass
