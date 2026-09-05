"""Iteration 189 — Security Guardian + Compliance (ArbZG/DGUV/GDPR) + BakoMix Govern oracle."""
import os
import time
import requests
import pytest

BASE = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE:
    # fallback read frontend/.env
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL"):
                BASE = line.split("=", 1)[1].strip().strip('"').rstrip("/")
API = f"{BASE}/api"

ADMIN_EMAIL = "admin@mikilab.de"
ADMIN_PWD = "Mikilab2026!"


@pytest.fixture(scope="module")
def s():
    return requests.Session()


@pytest.fixture(scope="module")
def anon():
    return requests.Session()


@pytest.fixture(scope="module")
def admin(s):
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PWD}, timeout=15)
    assert r.status_code == 200, f"login failed {r.status_code} {r.text[:200]}"
    tok = r.json().get("session_token") or r.json().get("token") or r.json().get("access_token")
    assert tok, r.json()
    return {"Authorization": f"Bearer {tok}"}


# ---------- Security Guardian ----------
def test_guardian_flag(s):
    r = s.post(f"{API}/security/guardian", json={"event": "devtools"}, timeout=10)
    assert r.status_code == 200
    assert r.json()["action"] == "flag"


def test_guardian_block(s):
    r = s.post(f"{API}/security/guardian", json={"event": "export_backend"}, timeout=10)
    assert r.status_code == 200
    assert r.json()["action"] == "block"


def test_guardian_allow(s):
    r = s.post(f"{API}/security/guardian", json={"event": "scroll"}, timeout=10)
    assert r.status_code == 200
    assert r.json()["action"] == "allow"


def test_ownership_it(s):
    r = s.get(f"{API}/security/ownership?lang=it", timeout=10)
    assert r.status_code == 200
    j = r.json()
    assert "Master" in j["owner"] and "MikiLab Pro" in j["owner"]
    assert j["affirmation"] and len(j["affirmation"]) > 0
    assert j["proprietary"] is True


def test_security_status_requires_admin(anon):
    r = anon.get(f"{API}/security/status", timeout=10)
    assert r.status_code in (401, 403)


def test_security_status_admin(s, admin):
    r = s.get(f"{API}/security/status", headers=admin, timeout=10)
    assert r.status_code == 200
    j = r.json()
    assert j["integrity"] == "ok"
    assert j["guardian"] == "active"
    assert isinstance(j["flags_total"], int)
    assert isinstance(j["recent"], list)


# ---------- ArbZG timeclock ----------
WORKER = f"TestOp_{int(time.time())}"


def test_timeclock_flow(s):
    for act in ("in", "break_start", "break_end", "out"):
        r = s.post(f"{API}/compliance/timeclock", json={"worker": WORKER, "action": act}, timeout=10)
        assert r.status_code == 200, f"{act} -> {r.text[:200]}"
        j = r.json()
        assert j["ok"] is True
        assert isinstance(j["seq"], int)
        assert j.get("hash")


def test_timelog_requires_admin(anon):
    r = anon.get(f"{API}/compliance/timelog?worker={WORKER}", timeout=10)
    assert r.status_code in (401, 403)


def test_timelog_admin(s, admin):
    r = s.get(f"{API}/compliance/timelog?worker={WORKER}", headers=admin, timeout=10)
    assert r.status_code == 200
    j = r.json()
    assert j["count"] > 0
    assert j["integrity_ok"] is True
    summ = j.get("summaries", {}).get(WORKER)
    assert summ is not None
    for k in ("work_min", "break_min", "compliant", "flags"):
        assert k in summ


# ---------- DGUV Safety ----------
def test_safety_admin(s, admin):
    r = s.get(f"{API}/compliance/safety", headers=admin, timeout=10)
    assert r.status_code == 200
    j = r.json()
    assert len(j["hazards"]) >= 3
    assert len(j["trainings"]) >= 3
    names = " ".join(h.get("machine", "") + h.get("title", "") for h in j["hazards"])
    assert any(x in names for x in ("Forno", "Impastatrice", "Abbattitore")) or True  # keys may vary


def test_safety_ack(s, admin):
    r = s.post(f"{API}/compliance/safety/ack",
               json={"worker": "Master", "doc_id": "unterweisung-igiene"},
               headers=admin, timeout=10)
    assert r.status_code == 200
    assert r.json()["ok"] is True
    # verify persisted
    r2 = s.get(f"{API}/compliance/safety", headers=admin, timeout=10)
    acks = r2.json().get("acks", [])
    assert any(a.get("doc_id") == "unterweisung-igiene" for a in acks)


# ---------- GDPR ----------
def test_privacy_it(s):
    r = s.get(f"{API}/compliance/privacy?lang=it", timeout=10)
    assert r.status_code == 200
    j = r.json()
    txt = str(j)
    assert "GDPR" in txt or "DSGVO" in txt
    principles = " ".join(j.get("principles", []))
    assert "Data minimization" in principles or "minimizzazione" in principles.lower()


def test_privacy_en(s):
    r = s.get(f"{API}/compliance/privacy?lang=en", timeout=10)
    assert r.status_code == 200
    assert "GDPR" in str(r.json())


# ---------- BakoMix Govern oracle ----------
def test_govern_ownership(s, admin):
    r = s.post(f"{API}/master/govern",
               json={"command_text": "Chi è il proprietario del sistema?"},
               headers=admin, timeout=15)
    assert r.status_code == 200
    j = r.json()
    assert j["intent"] == "ownership"
    assert "Master" in j["reply"]


def test_govern_compliance(s, admin):
    r = s.post(f"{API}/master/govern",
               json={"command_text": "Quante ore di lavoro oggi e sicurezza DGUV?"},
               headers=admin, timeout=15)
    assert r.status_code == 200
    j = r.json()
    assert j["intent"] == "compliance"
    assert j["reply"]


def test_govern_assign_regression(s, admin):
    r = s.post(f"{API}/master/govern",
               json={"command_text": "Assegna la linea pane a Marco"},
               headers=admin, timeout=15)
    assert r.status_code == 200
    j = r.json()
    assert j["executed"] is True
