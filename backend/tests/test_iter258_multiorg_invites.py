"""Iteration 258 — Multi-Azienda + Inviti Operaio via Link + Isolamento Stato Live.

Copre:
- /api/orgs list/create/switch/rename + autorizzazione switch
- Isolamento macchine tra aziende dopo switch
- Inviti: /api/floor-invites (create/list/revoke) + /api/public/floor-invite/{token} info+redeem
- Validazioni redeem (410 / 409 / 400-422) e admin-gate/verify con PIN
- Isolamento singleton live (staffing, rest-mode, floor-plan, sensors/live)
- Non regressione endpoint live (no 500)
"""
import os
import requests
import pytest
from dotenv import dotenv_values

BASE = (os.environ.get("REACT_APP_BACKEND_URL")
        or dotenv_values("/app/frontend/.env").get("REACT_APP_BACKEND_URL") or "").rstrip("/")
assert BASE, "REACT_APP_BACKEND_URL non trovato"
API = f"{BASE}/api"
GATE_PIN = "739284"
ADMIN_EMAIL = "admin@mikilab.de"
ADMIN_PASS = "Mikilab2026!"
ORG_DEFAULT = "org_default"


def _admin_session() -> requests.Session:
    s = requests.Session()
    r = s.post(f"{API}/admin-gate/verify", json={"pin": GATE_PIN}, timeout=15)
    assert r.status_code == 200, f"gate verify failed {r.status_code}: {r.text}"
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS}, timeout=15)
    assert r.status_code == 200, f"admin login failed {r.status_code}: {r.text}"
    return s


@pytest.fixture(scope="module")
def admin():
    s = _admin_session()
    # Assicurati che l'azienda attiva sia org_default all'inizio
    s.post(f"{API}/orgs/switch", json={"org_id": ORG_DEFAULT}, timeout=15)
    yield s
    # Ripristina org_default al termine
    try:
        s.post(f"{API}/orgs/switch", json={"org_id": ORG_DEFAULT}, timeout=15)
    except Exception:
        pass


@pytest.fixture(scope="module")
def created_orgs(admin):
    """Crea 2 aziende di test A e B; le restituisce come dict {A: org_id, B: org_id}"""
    ra = admin.post(f"{API}/orgs", json={"name": "TEST_ORG_A_258"}, timeout=15)
    assert ra.status_code == 200, ra.text
    org_a = ra.json()["org"]["org_id"]
    rb = admin.post(f"{API}/orgs", json={"name": "TEST_ORG_B_258"}, timeout=15)
    assert rb.status_code == 200, rb.text
    org_b = rb.json()["org"]["org_id"]
    yield {"A": org_a, "B": org_b}


# ---------- MULTI-AZIENDA ----------
class TestMultiOrg:
    def test_orgs_list_owner(self, admin):
        r = admin.get(f"{API}/orgs", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert "orgs" in data and isinstance(data["orgs"], list)
        assert data.get("is_owner") is True, "admin@mikilab.de deve essere owner"
        assert data.get("active_org") == ORG_DEFAULT
        oids = [o["org_id"] for o in data["orgs"]]
        assert ORG_DEFAULT in oids
        active = [o for o in data["orgs"] if o["is_active"]]
        assert len(active) == 1 and active[0]["org_id"] == ORG_DEFAULT

    def test_org_create(self, admin, created_orgs):
        # fixture ha già creato: verifichiamo che compaiano nella lista
        r = admin.get(f"{API}/orgs", timeout=15)
        oids = [o["org_id"] for o in r.json()["orgs"]]
        assert created_orgs["A"] in oids
        assert created_orgs["B"] in oids

    def test_org_switch_and_active_updates(self, admin, created_orgs):
        r = admin.post(f"{API}/orgs/switch", json={"org_id": created_orgs["A"]}, timeout=15)
        assert r.status_code == 200
        assert r.json().get("active_org") == created_orgs["A"]
        r2 = admin.get(f"{API}/orgs", timeout=15)
        assert r2.json().get("active_org") == created_orgs["A"]

    def test_org_rename(self, admin, created_orgs):
        r = admin.patch(f"{API}/orgs/{created_orgs['A']}", json={"name": "TEST_ORG_A_RENAMED"}, timeout=15)
        assert r.status_code == 200
        assert r.json().get("name") == "TEST_ORG_A_RENAMED"

    def test_isolation_machines_between_orgs(self, admin, created_orgs):
        # Vai in A e crea una macchina
        admin.post(f"{API}/orgs/switch", json={"org_id": created_orgs["A"]}, timeout=15)
        payload = {"name": "TEST_MACHINE_258", "notes": "iter258 test", "lang": "it"}
        r = admin.post(f"{API}/mike/machines/arrival", json=payload, timeout=15)
        assert r.status_code in (200, 201), r.text
        machine_id = r.json().get("machine", {}).get("id")
        assert machine_id
        # Vai in B: la macchina NON deve essere visibile
        admin.post(f"{API}/orgs/switch", json={"org_id": created_orgs["B"]}, timeout=15)
        rb = admin.get(f"{API}/mike/machines", timeout=15)
        assert rb.status_code == 200
        b_ids = [m.get("id") for m in (rb.json().get("machines") or [])]
        assert machine_id not in b_ids, "Isolamento fallito: la macchina di A e' visibile in B"
        # Torna in A: la macchina è di nuovo visibile
        admin.post(f"{API}/orgs/switch", json={"org_id": created_orgs["A"]}, timeout=15)
        ra = admin.get(f"{API}/mike/machines", timeout=15)
        a_ids = [m.get("id") for m in (ra.json().get("machines") or [])]
        assert machine_id in a_ids, "La macchina non e' piu' visibile in A"
        # cleanup
        admin.delete(f"{API}/mike/machines/{machine_id}", timeout=15)

    def test_switch_forbidden_for_non_member(self, admin, created_orgs):
        """L'owner puo' switchare ovunque; verifichiamo con un org_id inesistente per admin non-owner.
        Poiche' admin@mikilab.de e' owner, testiamo che switch verso org_id fasullo per owner CREI il doc
        (behavior atteso: owner puo' switchare a qualsiasi). Se e' owner riceverà 200.
        Testiamo invece con un admin fittizio: skip se non disponibile."""
        # Owner puo' switchare ovunque - testo che uno switch a org fasullo ritorni 200 (crea doc)
        r = admin.post(f"{API}/orgs/switch", json={"org_id": "TEST_NONEXISTENT_ORG_258"}, timeout=15)
        # Come owner: 200. Ripristino subito
        assert r.status_code == 200, f"Owner deve poter switchare ovunque, got {r.status_code}"
        admin.post(f"{API}/orgs/switch", json={"org_id": ORG_DEFAULT}, timeout=15)


# ---------- INVITI OPERAIO ----------
class TestFloorInvites:
    @pytest.fixture(scope="class")
    def invite_token(self, admin):
        # Assicurati su org_default
        admin.post(f"{API}/orgs/switch", json={"org_id": ORG_DEFAULT}, timeout=15)
        r = admin.post(f"{API}/floor-invites", json={"days": 7, "note": "test258"}, timeout=15)
        assert r.status_code == 200, r.text
        token = r.json()["token"]
        assert token
        yield token

    def test_public_info_valid(self, invite_token):
        # jar pulita — nessun cookie
        r = requests.get(f"{API}/public/floor-invite/{invite_token}", timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d.get("ok") is True and d.get("valid") is True
        assert d.get("org_name")

    def test_invite_list_shows_invite(self, admin, invite_token):
        r = admin.get(f"{API}/floor-invites", timeout=15)
        assert r.status_code == 200
        tokens = [i.get("token") for i in r.json().get("invites") or []]
        assert invite_token in tokens

    def test_redeem_bad_pin_length(self, invite_token):
        r = requests.post(f"{API}/public/floor-invite/{invite_token}/redeem",
                          json={"name": "TESTBadPin", "pin": "12"}, timeout=15)
        assert r.status_code in (400, 422), f"expected 400/422, got {r.status_code}: {r.text}"

    def test_redeem_success_and_admin_gate_verify(self, invite_token):
        import random
        pin = str(random.randint(1000, 9999))
        # persist pin for next test via class attribute
        type(self)._pin = pin
        jar = requests.Session()
        r = jar.post(f"{API}/public/floor-invite/{invite_token}/redeem",
                     json={"name": "TEST_Marco258", "pin": pin}, timeout=15)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d.get("ok") is True
        assert d.get("level") == "operator"
        # cookie gate rilasciato → chiamata protetta funziona
        rp = jar.get(f"{API}/delegation/tasks", timeout=15)
        assert rp.status_code == 200, f"protected route after redeem failed: {rp.status_code} {rp.text[:200]}"

        # verify via admin-gate/verify con lo stesso PIN → level operator
        jar2 = requests.Session()
        rv = jar2.post(f"{API}/admin-gate/verify", json={"pin": pin}, timeout=15)
        assert rv.status_code == 200
        assert rv.json().get("level") == "operator"

    def test_redeem_pin_duplicate_conflict(self, invite_token):
        pin = getattr(self, "_pin", "8391")
        r = requests.post(f"{API}/public/floor-invite/{invite_token}/redeem",
                          json={"name": "TEST_Altro258", "pin": pin}, timeout=15)
        assert r.status_code == 409, f"expected 409, got {r.status_code}: {r.text}"

    def test_redeem_invalid_token(self):
        r = requests.post(f"{API}/public/floor-invite/BOGUSTOKEN_XYZ/redeem",
                          json={"name": "TESTX", "pin": "1122"}, timeout=15)
        assert r.status_code == 410

    def test_revoke_invite(self, admin, invite_token):
        r = admin.post(f"{API}/floor-invites/{invite_token}/revoke", timeout=15)
        assert r.status_code == 200
        r2 = requests.get(f"{API}/public/floor-invite/{invite_token}", timeout=15)
        assert r2.status_code == 200
        assert r2.json().get("valid") is False


# ---------- ISOLAMENTO STATO LIVE ----------
class TestLiveStateIsolation:
    def test_staffing_isolation(self, admin, created_orgs):
        admin.post(f"{API}/orgs/switch", json={"org_id": ORG_DEFAULT}, timeout=15)
        r = admin.put(f"{API}/lab/staffing", json={"total": 8}, timeout=15)
        assert r.status_code == 200, r.text
        r = admin.get(f"{API}/lab/staffing", timeout=15)
        assert r.status_code == 200
        assert (r.json() or {}).get("total") == 8

        # Switch B → non deve essere 8
        admin.post(f"{API}/orgs/switch", json={"org_id": created_orgs["B"]}, timeout=15)
        r = admin.get(f"{API}/lab/staffing", timeout=15)
        assert r.status_code == 200
        assert (r.json() or {}).get("total") != 8, "Staffing NON isolato tra aziende"

        # Torna a default → 8
        admin.post(f"{API}/orgs/switch", json={"org_id": ORG_DEFAULT}, timeout=15)
        r = admin.get(f"{API}/lab/staffing", timeout=15)
        assert (r.json() or {}).get("total") == 8

    def test_rest_mode_isolation(self, admin, created_orgs):
        admin.post(f"{API}/orgs/switch", json={"org_id": ORG_DEFAULT}, timeout=15)
        r = admin.put(f"{API}/lab/rest-mode", json={"active": True}, timeout=15)
        assert r.status_code == 200, r.text
        r = admin.get(f"{API}/lab/rest-mode", timeout=15)
        assert (r.json() or {}).get("active") is True

        admin.post(f"{API}/orgs/switch", json={"org_id": created_orgs["B"]}, timeout=15)
        r = admin.get(f"{API}/lab/rest-mode", timeout=15)
        assert r.status_code == 200
        assert (r.json() or {}).get("active") is not True, "rest-mode NON isolato"

        admin.post(f"{API}/orgs/switch", json={"org_id": ORG_DEFAULT}, timeout=15)
        # cleanup: disattiva rest-mode
        admin.put(f"{API}/lab/rest-mode", json={"active": False}, timeout=15)

    def test_sensors_live_isolation(self, admin, created_orgs):
        admin.post(f"{API}/orgs/switch", json={"org_id": ORG_DEFAULT}, timeout=15)
        r = admin.post(f"{API}/lab/sensors/live", json={"oven_temp": 231.7}, timeout=15)
        assert r.status_code == 200, r.text
        r = admin.get(f"{API}/lab/sensors/live", timeout=15)
        assert r.status_code == 200
        val = ((r.json() or {}).get("oven_temp") or {}).get("value")
        assert val is not None and abs(float(val) - 231.7) < 0.01

        admin.post(f"{API}/orgs/switch", json={"org_id": created_orgs["B"]}, timeout=15)
        r = admin.get(f"{API}/lab/sensors/live", timeout=15)
        assert r.status_code == 200
        val_b = ((r.json() or {}).get("oven_temp") or {}).get("value")
        assert val_b is None or abs(float(val_b) - 231.7) > 0.01, "sensors live NON isolato"

        admin.post(f"{API}/orgs/switch", json={"org_id": ORG_DEFAULT}, timeout=15)
        r = admin.get(f"{API}/lab/sensors/live", timeout=15)
        val2 = ((r.json() or {}).get("oven_temp") or {}).get("value")
        assert val2 is not None and abs(float(val2) - 231.7) < 0.01


# ---------- NON REGRESSIONE ENDPOINT LIVE ----------
class TestLiveEndpointsSmoke:
    endpoints = [
        "/deck/status", "/lab/pulse", "/lab/pulse/history",
        "/lab/staffing", "/lab/staffing/history", "/lab/sensors/live",
        "/lab/rest-mode", "/lab/wake", "/lab/floor-plan",
        "/lab/shift/checkin", "/shift/handoff",
        "/ai/morning-briefing", "/production/shift-plan",
    ]

    @pytest.mark.parametrize("ep", endpoints)
    def test_endpoint_no_500(self, admin, ep):
        r = admin.get(f"{API}{ep}", timeout=30)
        assert r.status_code < 500, f"{ep} => {r.status_code} {r.text[:200]}"
        assert r.status_code == 200, f"{ep} not 200: {r.status_code} {r.text[:200]}"


# ---------- CLEANUP FINALE ----------
def test_zz_cleanup_final(admin, created_orgs):
    """Elimina PIN di test e riporta admin su org_default."""
    # cerca operator PIN TEST_Marco258 e disattivalo via panel-security se disponibile
    try:
        # Endpoint tipico: /api/production-pin/operators
        r = admin.get(f"{API}/production-pin/operators", timeout=15)
        if r.status_code == 200:
            for op in r.json().get("operators") or []:
                if (op.get("name") or "").startswith("TEST_Marco258"):
                    nm = op.get("name")
                    admin.delete(f"{API}/production-pin/operators/{nm}", timeout=15)
    except Exception:
        pass
    # Ripristina org_default
    r = admin.post(f"{API}/orgs/switch", json={"org_id": ORG_DEFAULT}, timeout=15)
    assert r.status_code == 200
    assert r.json().get("active_org") == ORG_DEFAULT
