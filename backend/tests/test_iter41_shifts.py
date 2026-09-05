# ============================================================================
#  MIKILAB PRO & BakoMix AI — PROPRIETARY & CONFIDENTIAL
#  (c) 2026 MikiLab Pro. Tutti i diritti riservati / All rights reserved.
#  Unico proprietario legale: il Master. Sole legal owner: the Master.
#  Codice riservato: vietata copia, distribuzione, reverse engineering o
#  cloning non autorizzati. Unauthorized copying, distribution, reverse
#  engineering or cloning is strictly prohibited and actively tracked by
#  the BakoMix AI Security Guardian.
# ============================================================================
"""Enterprise (e) — Pianificazione Turni: /api/shifts CRUD, ore, scope, PRO gating."""
import os
import re
from pathlib import Path

import pytest
import requests
from dotenv import dotenv_values

fe = dotenv_values("/app/frontend/.env")
BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or fe.get("REACT_APP_BACKEND_URL")).rstrip("/")
API = f"{BASE_URL}/api"


def _creds():
    txt = Path("/app/memory/test_credentials.md").read_text(encoding="utf-8")
    return txt


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{API}/auth/login", json={"email": "admin@mikilab.de", "password": "Mikilab2026!"}, timeout=30)
    if r.status_code != 200:
        pytest.fail(f"admin login failed {r.status_code}: {r.text[:300]}")
    return r.json().get("session_token") or r.json().get("token")


@pytest.fixture(scope="module")
def nonpro_token():
    r = requests.post(f"{API}/auth/login", json={"email": "fornaio@mikilab.de", "password": "Mikilab2026!"}, timeout=30)
    if r.status_code != 200:
        pytest.fail(f"non-pro login failed {r.status_code}: {r.text[:300]}")
    return r.json().get("session_token") or r.json().get("token")


@pytest.fixture(scope="module")
def admin(admin_token):
    s = requests.Session()
    s.headers.update({"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def store(admin):
    r = admin.post(f"{API}/stores", json={"name": "TEST_Turni_Store"}, timeout=30)
    assert r.status_code in (200, 201), r.text[:300]
    sid = r.json()["id"]
    yield sid
    admin.delete(f"{API}/stores/{sid}", timeout=30)


@pytest.fixture(scope="module")
def created(admin):
    ids = []
    yield ids
    for i in ids:
        admin.delete(f"{API}/shifts/{i}", timeout=30)


class TestShiftsCrud:
    def test_create_day_shift_hours(self, admin, store, created):
        r = admin.post(f"{API}/shifts", json={"store_id": store, "employee": " TEST_Luca ", "role": "Fornaio",
                                              "day": "2026-07-06", "start": "06:00", "end": "14:30",
                                              "station": "Forno"}, timeout=30)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        created.append(d["id"])
        assert d["hours"] == 8.5
        assert d["employee"] == "TEST_Luca"
        assert d["store_id"] == store
        assert "_id" not in d
        # verify persistence
        g = admin.get(f"{API}/shifts", params={"store_id": store}, timeout=30)
        assert g.status_code == 200
        rows = g.json()
        assert any(x["id"] == d["id"] and x["hours"] == 8.5 for x in rows)

    def test_night_shift_wrap(self, admin, store, created):
        r = admin.post(f"{API}/shifts", json={"store_id": store, "employee": "TEST_Luca",
                                              "day": "2026-07-08", "start": "22:00", "end": "06:00"}, timeout=30)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        created.append(d["id"])
        assert d["hours"] == 8.0

    def test_store_scope_filter(self, admin, store, created):
        r = admin.post(f"{API}/stores", json={"name": "TEST_Other_Store"}, timeout=30)
        other = r.json()["id"]
        try:
            s2 = admin.post(f"{API}/shifts", json={"store_id": other, "employee": "TEST_Other",
                                                   "day": "2026-07-07", "start": "08:00", "end": "12:00"}, timeout=30).json()
            created.append(s2["id"])
            rows = admin.get(f"{API}/shifts", params={"store_id": store}, timeout=30).json()
            assert all(x["store_id"] == store for x in rows)
            assert s2["id"] not in [x["id"] for x in rows]
        finally:
            admin.delete(f"{API}/stores/{other}", timeout=30)

    def test_update_shift_recomputes_hours(self, admin, store, created):
        d = admin.post(f"{API}/shifts", json={"store_id": store, "employee": "TEST_Upd",
                                              "day": "2026-07-09", "start": "08:00", "end": "12:00"}, timeout=30).json()
        created.append(d["id"])
        u = admin.put(f"{API}/shifts/{d['id']}", json={"store_id": store, "employee": "TEST_Upd2",
                                                       "day": "2026-07-09", "start": "08:00", "end": "17:15"}, timeout=30)
        assert u.status_code == 200, u.text[:300]
        assert u.json()["hours"] == 9.25
        rows = admin.get(f"{API}/shifts", params={"store_id": store}, timeout=30).json()
        row = [x for x in rows if x["id"] == d["id"]][0]
        assert row["hours"] == 9.25 and row["employee"] == "TEST_Upd2"

    def test_delete_shift(self, admin, store):
        d = admin.post(f"{API}/shifts", json={"store_id": store, "employee": "TEST_Del",
                                              "day": "2026-07-10", "start": "09:00", "end": "10:00"}, timeout=30).json()
        r = admin.delete(f"{API}/shifts/{d['id']}", timeout=30)
        assert r.status_code == 200
        rows = admin.get(f"{API}/shifts", params={"store_id": store}, timeout=30).json()
        assert d["id"] not in [x["id"] for x in rows]
        assert admin.delete(f"{API}/shifts/{d['id']}", timeout=30).status_code == 404

    def test_invalid_payload_422(self, admin, store):
        r = admin.post(f"{API}/shifts", json={"store_id": store, "day": "2026-07-06"}, timeout=30)
        assert r.status_code == 422


class TestShiftsGating:
    def test_anonymous_blocked(self):
        r = requests.get(f"{API}/shifts", timeout=30)
        assert r.status_code in (401, 403)

    def test_non_pro_403(self, nonpro_token):
        h = {"Authorization": f"Bearer {nonpro_token}"}
        assert requests.get(f"{API}/shifts", headers=h, timeout=30).status_code == 403
        assert requests.post(f"{API}/shifts", headers=h, json={"employee": "X", "day": "2026-07-06",
                                                               "start": "08:00", "end": "10:00"}, timeout=30).status_code == 403

    def test_cross_owner_delete_404(self, nonpro_token, admin, store, created):
        d = admin.post(f"{API}/shifts", json={"store_id": store, "employee": "TEST_Scope",
                                              "day": "2026-07-11", "start": "08:00", "end": "10:00"}, timeout=30).json()
        created.append(d["id"])
        h = {"Authorization": f"Bearer {nonpro_token}"}
        # non-pro is blocked before ownership check
        assert requests.delete(f"{API}/shifts/{d['id']}", headers=h, timeout=30).status_code in (403, 404)
