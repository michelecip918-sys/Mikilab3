"""Iteration 226 — Operator floor mode + Sitor Maestro (Opus 4.8) backend tests.

Covers:
- Gate levels (master vs operator via personal PIN)
- Operator PIN CRUD with level (novizio/esperto/maestro)
- Sitor Maestro floor guide (with & without machines) in Italian
- Change requests: classification (minor auto_applied / major pending) + admin decide flow
"""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/") or "https://edit-33.preview.emergentagent.com"

ADMIN_EMAIL = "admin@mikilab.de"
ADMIN_PASSWORD = "Mikilab2026!"
MASTER_PIN = "198505"
MARCO_PIN = "7391"  # pre-created operator
QA_NAME = "QAOp"
QA_PIN = "8172"


# ----- session fixtures -----
@pytest.fixture(scope="module")
def admin_sess():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(f"{BASE_URL}/api/admin-gate/verify", json={"pin": MASTER_PIN}, timeout=15)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body.get("ok") is True and body.get("level") == "master", body
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
    assert r.status_code == 200, r.text
    return s


@pytest.fixture(scope="module")
def ensure_marco(admin_sess):
    """Ensure Marco/7391 novizio exists (recreate if a prior test deleted it)."""
    r = admin_sess.put(
        f"{BASE_URL}/api/operator-pins",
        json={"name": "Marco", "pin": MARCO_PIN, "level": "novizio"},
        timeout=15,
    )
    # 200 either created or updated; if endpoint returns 409 on duplicate, accept
    assert r.status_code in (200, 201, 409), r.text
    return True


# ----- Gate levels -----
def test_gate_master():
    r = requests.post(f"{BASE_URL}/api/admin-gate/verify", json={"pin": MASTER_PIN}, timeout=15)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body.get("ok") is True
    assert body.get("level") == "master"
    # cookie set
    assert any(c.lower() == "mikilab_gate" for c in r.cookies.keys()) or "mikilab_gate" in r.headers.get("set-cookie", "").lower()


def test_gate_operator_marco(admin_sess, ensure_marco):
    # fresh session (no cookies) — verify operator PIN yields level=operator + cookie
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/admin-gate/verify", json={"pin": MARCO_PIN}, timeout=15)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body.get("ok") is True, body
    assert body.get("level") == "operator", body
    assert body.get("name") == "Marco", body
    assert body.get("operator_level") in ("novizio", "esperto", "maestro"), body
    # gate cookie must be set for the operator too
    set_cookie = r.headers.get("set-cookie", "").lower()
    assert "mikilab_gate" in set_cookie or any(c.lower() == "mikilab_gate" for c in r.cookies.keys())


# ----- Operator PIN CRUD with level -----
def test_operator_pin_lifecycle(admin_sess):
    # Create
    r = admin_sess.put(
        f"{BASE_URL}/api/operator-pins",
        json={"name": QA_NAME, "pin": QA_PIN, "level": "esperto"},
        timeout=15,
    )
    assert r.status_code in (200, 201), r.text
    assert r.json().get("ok") is True

    # List — QAOp with esperto
    r = admin_sess.get(f"{BASE_URL}/api/operator-pins", timeout=15)
    assert r.status_code == 200, r.text
    data = r.json()
    pins = data if isinstance(data, list) else (data.get("pins") or data.get("operators") or data.get("items") or [])
    match = [p for p in pins if (p.get("name") == QA_NAME)]
    assert match, f"QAOp not found in {pins}"
    assert match[0].get("level") == "esperto", match[0]

    # Patch level to maestro
    r = admin_sess.patch(
        f"{BASE_URL}/api/operator-pins/{QA_NAME}/level",
        json={"level": "maestro"},
        timeout=15,
    )
    assert r.status_code == 200, r.text
    assert r.json().get("ok") is True

    # Verify persisted
    r = admin_sess.get(f"{BASE_URL}/api/operator-pins", timeout=15)
    pins = r.json() if isinstance(r.json(), list) else (r.json().get("pins") or r.json().get("operators") or r.json().get("items") or [])
    match = [p for p in pins if p.get("name") == QA_NAME]
    assert match and match[0].get("level") == "maestro", match

    # Verify via gate — operator_level=maestro
    s2 = requests.Session()
    r = s2.post(f"{BASE_URL}/api/admin-gate/verify", json={"pin": QA_PIN}, timeout=15)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body.get("level") == "operator" and body.get("name") == QA_NAME
    assert body.get("operator_level") == "maestro", body

    # Cleanup
    r = admin_sess.delete(f"{BASE_URL}/api/operator-pins/{QA_NAME}", timeout=15)
    assert r.status_code in (200, 204), r.text


# ----- Sitor Maestro guide (Opus 4.8) -----
def test_sitor_guide_with_machines(admin_sess):
    r = admin_sess.post(
        f"{BASE_URL}/api/floor/sitor/guide",
        json={
            "operator": "Marco",
            "level": "novizio",
            "dept": "Forno",
            "task": "Cuocere baguette",
            "has_machines": True,
            "lang": "it",
        },
        timeout=90,
    )
    assert r.status_code == 200, r.text
    data = r.json()
    spoken = data.get("spoken") or data.get("intro") or ""
    steps = data.get("steps") or []
    watch = data.get("watch") or []
    assert isinstance(spoken, str) and len(spoken) > 0, data
    assert isinstance(steps, list) and len(steps) > 0, data
    assert isinstance(watch, list), data
    # Italian heuristic: presence of common Italian tokens
    joined = (spoken + " " + " ".join(str(s) for s in steps)).lower()
    assert any(tok in joined for tok in [" il ", " la ", " di ", " per ", " con ", "forno", "impasto", "cuoci", "cottura"]), joined[:400]


def test_sitor_guide_without_machines(admin_sess):
    r = admin_sess.post(
        f"{BASE_URL}/api/floor/sitor/guide",
        json={
            "operator": "Marco",
            "level": "novizio",
            "dept": "Forno",
            "task": "Cuocere baguette",
            "has_machines": False,
            "lang": "it",
        },
        timeout=90,
    )
    assert r.status_code == 200, r.text
    data = r.json()
    steps = data.get("steps") or []
    assert isinstance(steps, list) and len(steps) > 0


# ----- Change requests -----
def test_change_request_flow(admin_sess):
    # Submit a change request
    r = admin_sess.post(
        f"{BASE_URL}/api/floor/sitor/change-request",
        json={
            "operator": "Marco",
            "level": "novizio",
            "proposal": "Anticipare le baguette di 20 minuti",
            "lang": "it",
        },
        timeout=90,
    )
    assert r.status_code == 200, r.text
    data = r.json()
    classification = data.get("classification") or data.get("class") or ""
    status = data.get("status") or ""
    ack = data.get("ack") or data.get("message") or ""
    assert classification in ("minor", "major"), data
    assert status in ("auto_applied", "pending", "approved", "rejected"), data
    assert isinstance(ack, str) and len(ack) > 0, data
    req_id = data.get("id") or data.get("request_id")

    # List
    r = admin_sess.get(f"{BASE_URL}/api/floor/sitor/change-requests", timeout=20)
    assert r.status_code == 200, r.text
    lst = r.json()
    items = lst if isinstance(lst, list) else (lst.get("items") or lst.get("requests") or [])
    pending_count = lst.get("pending") if isinstance(lst, dict) else None
    assert isinstance(items, list)
    # our request should be present (by id or proposal text)
    if req_id:
        assert any((it.get("id") == req_id) for it in items), items

    # If major/pending — try decide=approve
    if classification == "major" and status == "pending" and req_id:
        r = admin_sess.post(
            f"{BASE_URL}/api/floor/sitor/change-requests/{req_id}/decide",
            json={"decision": "approve"},
            timeout=30,
        )
        assert r.status_code == 200, r.text
        body = r.json()
        assert body.get("status") == "approved" or body.get("ok") is True, body
    else:
        # Force a "major" one to test decide path
        r = admin_sess.post(
            f"{BASE_URL}/api/floor/sitor/change-request",
            json={
                "operator": "Marco",
                "level": "novizio",
                "proposal": "Rivedere completamente il piano settimanale e cambiare tutti i turni e la produzione di domani",
                "lang": "it",
            },
            timeout=90,
        )
        assert r.status_code == 200, r.text
        d2 = r.json()
        rid = d2.get("id") or d2.get("request_id")
        if d2.get("classification") == "major" and rid:
            r = admin_sess.post(
                f"{BASE_URL}/api/floor/sitor/change-requests/{rid}/decide",
                json={"decision": "approve"},
                timeout=30,
            )
            assert r.status_code == 200, r.text
