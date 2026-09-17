"""Backend tests for CRUD macchine reparto + shift templates regression.

Preconditions:
- Master gate PIN 739284
- Admin: admin@mikilab.de / Mikilab2026!
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
GATE_PIN = "739284"
ADMIN_EMAIL = "admin@mikilab.de"
ADMIN_PASSWORD = "Mikilab2026!"

DEPARTMENTS = ["panificio", "pasticceria", "pizzeria", "laugen", "banco"]


@pytest.fixture(scope="module")
def admin_session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(f"{BASE_URL}/api/admin-gate/verify", json={"pin": GATE_PIN}, timeout=15)
    assert r.status_code == 200, f"gate verify failed: {r.status_code} {r.text[:200]}"
    r = s.post(f"{BASE_URL}/api/auth/login",
               json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text[:200]}"
    return s


# --- Depts catalog --------------------------------------------------------

def test_depts_catalog(admin_session):
    r = admin_session.get(f"{BASE_URL}/api/depts", timeout=15)
    assert r.status_code == 200
    data = r.json()
    keys = {d["key"] for d in data["departments"]}
    for d in DEPARTMENTS:
        assert d in keys, f"missing {d}"


def test_panificio_base_machines(admin_session):
    r = admin_session.get(f"{BASE_URL}/api/depts/panificio/machines", timeout=15)
    assert r.status_code == 200
    ids = {m["id"] for m in r.json()["machines"] if not m.get("custom")}
    expected = {"imp-spirale-80", "imp-forcella", "forno-rotativo",
                "forno-deck", "linea-arion", "gruppo-pane"}
    # subset (some may be hidden by previous tests but at least 4 base)
    assert len(ids & expected) >= 4, f"panificio base machines missing, got {ids}"


# --- Add / Rename / Delete flow ------------------------------------------

def test_machine_add_rename_delete_custom(admin_session):
    dept = "pasticceria"
    # ADD
    r = admin_session.post(f"{BASE_URL}/api/depts/{dept}/machines/add",
                           json={"name": "TEST_Forno Nuovo", "type": "forno"}, timeout=15)
    assert r.status_code == 200, r.text[:200]
    body = r.json()
    assert body["ok"] is True
    mid = body["machine"]["id"]
    assert mid.startswith("cst-")
    assert body["machine"]["name"] == "TEST_Forno Nuovo"

    # Verify GET reflects
    r = admin_session.get(f"{BASE_URL}/api/depts/{dept}/machines", timeout=15)
    machines = r.json()["machines"]
    m = next((x for x in machines if x["id"] == mid), None)
    assert m is not None and m["custom"] is True and m["name"] == "TEST_Forno Nuovo"

    # RENAME
    r = admin_session.patch(f"{BASE_URL}/api/depts/{dept}/machines/{mid}",
                            json={"name": "TEST_Forno Rinominato"}, timeout=15)
    assert r.status_code == 200
    machines = r.json()["machines"]
    m = next((x for x in machines if x["id"] == mid), None)
    assert m and m["name"] == "TEST_Forno Rinominato"

    # DELETE
    r = admin_session.delete(f"{BASE_URL}/api/depts/{dept}/machines/{mid}", timeout=15)
    assert r.status_code == 200
    ids = {x["id"] for x in r.json()["machines"]}
    assert mid not in ids


def test_base_machine_rename_and_hide(admin_session):
    dept = "panificio"
    mid = "linea-arion"

    # RENAME base machine via override
    new_name = "TEST_Linea Arion Rinominata"
    r = admin_session.patch(f"{BASE_URL}/api/depts/{dept}/machines/{mid}",
                            json={"name": new_name}, timeout=15)
    assert r.status_code == 200
    m = next((x for x in r.json()["machines"] if x["id"] == mid), None)
    assert m and m["name"] == new_name

    # HIDE (delete base machine)
    r = admin_session.delete(f"{BASE_URL}/api/depts/{dept}/machines/{mid}", timeout=15)
    assert r.status_code == 200
    ids = {x["id"] for x in r.json()["machines"]}
    assert mid not in ids, "base machine should be hidden"

    # RESTORE by removing hidden override via direct patch (rename brings it back? No:
    # hidden=true is a separate override. To restore, we rename which clears hidden? No.)
    # To cleanup we set hidden=false — we can't via API. Rename does NOT clear hidden.
    # For test cleanup, we call a rename to restore original name; hidden persists.
    # Documenting: base "hide" is only reversible by DB reset. We'll skip cleanup here.


def test_invalid_dept(admin_session):
    r = admin_session.post(f"{BASE_URL}/api/depts/xxx/machines/add",
                           json={"name": "x"}, timeout=15)
    assert r.status_code == 404


def test_add_requires_name(admin_session):
    r = admin_session.post(f"{BASE_URL}/api/depts/pizzeria/machines/add",
                           json={"name": ""}, timeout=15)
    assert r.status_code == 400


def test_requires_admin():
    s = requests.Session()
    # only gate cookie, no admin
    s.post(f"{BASE_URL}/api/admin-gate/verify", json={"pin": GATE_PIN}, timeout=15)
    r = s.post(f"{BASE_URL}/api/depts/pizzeria/machines/add",
               json={"name": "x"}, timeout=15)
    assert r.status_code in (401, 403)


# --- Shift templates regression ------------------------------------------

def test_shift_templates_flow(admin_session):
    r = admin_session.get(f"{BASE_URL}/api/depts/templates", timeout=15)
    assert r.status_code == 200
    initial = r.json().get("templates", [])

    r = admin_session.post(f"{BASE_URL}/api/depts/templates",
                           json={"name": "TEST_Template",
                                 "items": [{"dept": "panificio", "operator": "Sitor", "task": "Test task"}]},
                           timeout=15)
    assert r.status_code == 200, r.text[:200]
    body = r.json()
    tid = body.get("template", {}).get("id") or body.get("id")
    assert tid, f"no template id returned: {body}"

    # apply
    r = admin_session.post(f"{BASE_URL}/api/depts/templates/{tid}/apply", timeout=15)
    assert r.status_code == 200

    # delete
    r = admin_session.delete(f"{BASE_URL}/api/depts/templates/{tid}", timeout=15)
    assert r.status_code == 200

    # verify gone
    r = admin_session.get(f"{BASE_URL}/api/depts/templates", timeout=15)
    ids = {t.get("id") for t in r.json().get("templates", [])}
    assert tid not in ids
