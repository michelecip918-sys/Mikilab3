"""Iteration 262 — Backend tests for:
1) Dept machine reorder persists (dept=panificio)
2) Silo preset (pizzeria) — first call adds, second call added:0 (dedup by name)
3) Coordination log records 'accepted' and 'declined' with operator + at.
"""
import os
import uuid
import pytest
import requests
from dotenv import load_dotenv

load_dotenv("/app/frontend/.env")
BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
GATE_PIN = "739284"
ADMIN_EMAIL = "admin@mikilab.de"
ADMIN_PASSWORD = "Mikilab2026!"


@pytest.fixture(scope="module")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    # 1) Verify gate PIN → sets httpOnly cookie
    r = s.post(f"{BASE_URL}/api/admin-gate/verify", json={"pin": GATE_PIN}, timeout=30)
    assert r.status_code == 200, f"gate verify failed: {r.status_code} {r.text}"
    assert r.json().get("ok"), r.text
    # 2) Login as admin
    r = s.post(f"{BASE_URL}/api/auth/login",
               json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=30)
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    return s


# --------- 1) DEPT MACHINE REORDER (panificio) ----------
class TestDeptMachineReorder:
    def test_reorder_persists(self, api):
        r = api.get(f"{BASE_URL}/api/depts/panificio/machines", timeout=30)
        assert r.status_code == 200, r.text
        machines = r.json().get("machines") or []
        assert len(machines) >= 2, f"need at least 2 machines to test reorder, got {len(machines)}"
        ids = [m["id"] for m in machines]
        # reverse order
        new_order = list(reversed(ids))
        r = api.put(f"{BASE_URL}/api/depts/panificio/machines/reorder",
                    json={"order": new_order}, timeout=30)
        assert r.status_code == 200, r.text
        # GET again — verify persistence
        r = api.get(f"{BASE_URL}/api/depts/panificio/machines", timeout=30)
        assert r.status_code == 200
        got_ids = [m["id"] for m in r.json().get("machines") or []]
        # first N should match reversed
        for i, mid in enumerate(new_order):
            assert got_ids[i] == mid, f"expected {mid} at pos {i}, got {got_ids[i]}"
        # restore original order for cleanliness
        api.put(f"{BASE_URL}/api/depts/panificio/machines/reorder",
                json={"order": ids}, timeout=30)


# --------- 2) SILO PRESET (pizzeria) — dedup ----------
class TestSiloPreset:
    def test_pizzeria_preset_dedup(self, api):
        r1 = api.post(f"{BASE_URL}/api/mike/silos/preset",
                      json={"activity": "pizzeria"}, timeout=30)
        assert r1.status_code == 200, r1.text
        d1 = r1.json()
        assert d1.get("ok") is True
        assert d1.get("activity") == "pizzeria"
        added1 = int(d1.get("added"))
        # if some were already present from previous runs added could be < 4 but >=0
        # Repeat — MUST be 0 (dedup by name)
        r2 = api.post(f"{BASE_URL}/api/mike/silos/preset",
                      json={"activity": "pizzeria"}, timeout=30)
        assert r2.status_code == 200, r2.text
        d2 = r2.json()
        assert int(d2.get("added")) == 0, f"expected added:0 on 2nd call, got {d2}"
        # GET silos → must contain the pizzeria preset names
        r3 = api.get(f"{BASE_URL}/api/mike/silos?lang=it", timeout=30)
        assert r3.status_code == 200
        names = {(s.get("name") or "").strip().lower()
                 for s in r3.json().get("silos") or r3.json().get("items") or []}
        # fallback: iterate all fields
        if not names:
            payload = r3.json()
            for k in ("silos", "items", "list", "data"):
                if isinstance(payload.get(k), list):
                    names = {(s.get("name") or "").strip().lower() for s in payload[k]}
                    break
        expected = {"farina tipo 00 pizza", "farina manitoba",
                    "semola rimacinata", "sale"}
        missing = expected - names
        assert not missing, f"missing pizzeria silos in GET: {missing}. Got names: {names}"


# --------- 3) COORDINATION LOG (accepted / declined) ----------
class TestCoordinationLog:
    OP_ACCEPT = f"TESTop_{uuid.uuid4().hex[:5]}"
    OP_DECLINE = f"TESTop_{uuid.uuid4().hex[:5]}"

    def _seed_operator(self, api, name):
        """Create a shift-plan entry (so operator is in the pool) then set skills."""
        r = api.post(f"{BASE_URL}/api/production/shift-assignment",
                     json={"day": "lunedi", "position": "panificio",
                           "worker_name": name, "efficiency_score": 90}, timeout=30)
        assert r.status_code == 200, f"shift-assignment: {r.status_code} {r.text}"
        r = api.put(f"{BASE_URL}/api/operators/skills",
                    json={"name": name, "departments": ["panificio"],
                          "is_driver": False}, timeout=30)
        assert r.status_code == 200, f"skills PUT: {r.status_code} {r.text}"

    def _force_capo_absent(self, api):
        r = api.put(f"{BASE_URL}/api/coordination/settings",
                    json={"capo_present_manual": False, "enabled": True}, timeout=30)
        assert r.status_code == 200, r.text

    def test_accepted_logged(self, api):
        self._force_capo_absent(api)
        self._seed_operator(api, self.OP_ACCEPT)
        # trigger a call (operator route because qty low, capo absent → pending)
        r = api.post(f"{BASE_URL}/api/coordination/trigger",
                     json={"dept": "panificio",
                           "task_desc": "TEST_iter262 impasto",
                           "qty": 1, "qty_unit": "kg", "eta_min": 5,
                           "source": "test"}, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("resolved") == "pending", f"expected pending, got {data}"
        call_id = data["call"]["id"]
        current_op = data["call"].get("current_operator")
        assert current_op, "no current_operator on pending call"
        # respond YES
        r = api.post(f"{BASE_URL}/api/coordination/calls/{call_id}/respond",
                     json={"operator": current_op, "answer": "si"}, timeout=30)
        assert r.status_code == 200, r.text
        assert r.json().get("status") == "accepted"
        # verify log has an "accepted" decision with operator + at
        r = api.get(f"{BASE_URL}/api/coordination/log", timeout=30)
        assert r.status_code == 200
        decisions = r.json().get("decisions") or []
        matches = [d for d in decisions
                   if d.get("kind") == "accepted" and d.get("call_id") == call_id]
        assert matches, f"no accepted log for call {call_id}. Recent: {decisions[:3]}"
        m = matches[0]
        assert m.get("operator"), f"operator missing in accepted log entry: {m}"
        assert m.get("at"), f"'at' timestamp missing in accepted log entry: {m}"

    def test_declined_logged(self, api):
        self._force_capo_absent(api)
        self._seed_operator(api, self.OP_DECLINE)
        # free the previous accept operator so pool has a free candidate
        # (also fine if OP_DECLINE is the only free one)
        r = api.post(f"{BASE_URL}/api/coordination/trigger",
                     json={"dept": "panificio",
                           "task_desc": "TEST_iter262 rifiuto",
                           "qty": 1, "qty_unit": "kg", "eta_min": 5,
                           "source": "test"}, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        # If OP_ACCEPT still busy, OP_DECLINE should be chosen. But since accepted
        # left worker busy, that's fine — pool should have OP_DECLINE free.
        assert data.get("resolved") == "pending", f"expected pending, got {data}"
        call_id = data["call"]["id"]
        current_op = data["call"].get("current_operator")
        # respond NO
        r = api.post(f"{BASE_URL}/api/coordination/calls/{call_id}/respond",
                     json={"operator": current_op, "answer": "no"}, timeout=30)
        assert r.status_code == 200, r.text
        # verify log has a "declined" decision
        r = api.get(f"{BASE_URL}/api/coordination/log", timeout=30)
        assert r.status_code == 200
        decisions = r.json().get("decisions") or []
        matches = [d for d in decisions
                   if d.get("kind") == "declined" and d.get("call_id") == call_id
                   and (d.get("operator") or "").lower() == (current_op or "").lower()]
        assert matches, f"no declined log for call {call_id} op {current_op}. Recent: {decisions[:5]}"
        m = matches[0]
        assert m.get("at"), f"'at' timestamp missing in declined log: {m}"
