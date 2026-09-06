"""iter211 — verify departments/assignment/objective/progress/board endpoints."""
import os
import requests

def _read_base():
    v = os.environ.get("REACT_APP_BACKEND_URL", "").strip()
    if v:
        return v.rstrip("/")
    try:
        for line in open("/app/frontend/.env"):
            if line.startswith("REACT_APP_BACKEND_URL="):
                return line.split("=", 1)[1].strip().rstrip("/")
    except Exception:
        pass
    raise RuntimeError("REACT_APP_BACKEND_URL missing")

BASE = _read_base()
ADMIN_PIN = "1985"
CAPO_EMAIL = "admin@mikilab.de"
CAPO_PWD = "Mikilab2026!"


def _session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    # gate
    r = s.post(f"{BASE}/api/admin-gate/verify", json={"pin": ADMIN_PIN}, timeout=15)
    assert r.status_code == 200, r.text
    # login
    r = s.post(f"{BASE}/api/auth/login", json={"email": CAPO_EMAIL, "password": CAPO_PWD}, timeout=15)
    assert r.status_code == 200, r.text
    tok = r.json().get("token") or r.json().get("access_token")
    if tok:
        s.headers.update({"Authorization": f"Bearer {tok}"})
    return s


def test_depts_catalog_five():
    s = _session()
    r = s.get(f"{BASE}/api/depts", timeout=10)
    assert r.status_code == 200
    depts = r.json().get("departments", [])
    keys = {d["key"] for d in depts}
    assert {"panificio", "pasticceria", "pizzeria", "laugen", "banco"} <= keys, keys


def test_depts_assign_objective_progress_board():
    s = _session()
    # assign pizzeria
    r = s.post(f"{BASE}/api/depts/assign", json={"dept": "pizzeria", "task": "stesura", "operator": "MohaLab"}, timeout=10)
    assert r.status_code == 200, r.text
    assert r.json()["assignment"]["dept"] == "pizzeria"

    # objective 100
    r = s.post(f"{BASE}/api/depts/objective", json={"dept": "pizzeria", "target": 100, "unit": "pezzi", "label": "stesura"}, timeout=10)
    assert r.status_code == 200, r.text
    obj = r.json()["objective"]
    assert obj["target"] == 100

    # progress +15 by PIN 7788 (no auth required, but gate needed)
    s2 = requests.Session()
    s2.headers.update({"Content-Type": "application/json"})
    s2.post(f"{BASE}/api/admin-gate/verify", json={"pin": ADMIN_PIN}, timeout=15)
    r = s2.post(f"{BASE}/api/depts/progress", json={"dept": "pizzeria", "qty": 15, "pin": "7788", "operator": "Operaio 3"}, timeout=10)
    assert r.status_code == 200, r.text
    obj = r.json()["objective"]
    assert obj["done"] >= 15
    entries = obj.get("entries", [])
    assert any(e.get("pin") == "7788" for e in entries), entries

    # board contains pizzeria
    r = s.get(f"{BASE}/api/depts/board", timeout=10)
    assert r.status_code == 200
    pz = [o for o in r.json()["objectives"] if o["dept"] == "pizzeria"]
    assert pz and pz[0]["target"] == 100 and pz[0]["done"] >= 15


def test_depts_reject_unknown():
    s = _session()
    r = s.post(f"{BASE}/api/depts/assign", json={"dept": "nope", "task": "x"}, timeout=10)
    assert r.status_code == 400
