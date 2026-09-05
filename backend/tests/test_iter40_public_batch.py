# ============================================================================
#  MIKILAB PRO & BakoMix AI — PROPRIETARY & CONFIDENTIAL
#  (c) 2026 MikiLab Pro. Tutti i diritti riservati / All rights reserved.
#  Unico proprietario legale: il Master. Sole legal owner: the Master.
#  Codice riservato: vietata copia, distribuzione, reverse engineering o
#  cloning non autorizzati. Unauthorized copying, distribution, reverse
#  engineering or cloning is strictly prohibited and actively tracked by
#  the BakoMix AI Security Guardian.
# ============================================================================
"""Iteration 40 — QR pubblico del lotto: POST/GET/DELETE /api/batches (PRO) + GET /api/public/batch/{id} (pubblico)."""
import os
import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
base_url = os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")
if not base_url:
    raise RuntimeError("REACT_APP_BACKEND_URL missing")
BASE_URL = base_url.rstrip("/")
API = f"{BASE_URL}/api"

ADMIN = {"email": "admin@mikilab.de", "password": "Mikilab2026!"}


def _login(creds):
    r = requests.post(f"{API}/auth/login", json=creds, timeout=30)
    if r.status_code != 200:
        pytest.fail(f"login failed {r.status_code}: {r.text[:300]}")
    tok = r.json().get("session_token") or r.json().get("token")
    assert tok, f"no token in {r.json()}"
    s = requests.Session()
    s.headers.update({"Authorization": f"Bearer {tok}", "Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def admin():
    return _login(ADMIN)


@pytest.fixture(scope="module")
def created():
    ids = []
    yield ids
    s = _login(ADMIN)
    for i in ids:
        s.delete(f"{API}/batches/{i}", timeout=30)


PAYLOAD = {
    "code": "TEST_LOT-40A",
    "product": "TEST_Pane di Matera",
    "prod_date": "2026-07-01",
    "expiry": "2026-07-05",
    "flour": "Semola rimacinata",
    "flour_lot": "TEST_SF-991",
    "qty": "40 pezzi",
    "operator": "TEST_Miki",
    "note": "HACCP 22C",
    "store_name": "TEST_Forno Centro",
}


# --- POST /api/batches (create, PRO) ---
class TestBatchPublish:
    def test_auth_required(self):
        r = requests.post(f"{API}/batches", json=PAYLOAD, timeout=30)
        assert r.status_code in (401, 403), r.text[:300]

    def test_create_and_public_read(self, admin, created):
        r = admin.post(f"{API}/batches", json=PAYLOAD, timeout=30)
        assert r.status_code == 200, r.text[:400]
        d = r.json()
        assert isinstance(d.get("id"), str) and len(d["id"]) > 10
        created.append(d["id"])
        assert d["product"] == PAYLOAD["product"]
        assert d["code"] == PAYLOAD["code"]
        assert "owner_id" not in d and "_id" not in d

        # lettura PUBBLICA senza auth
        pub = requests.get(f"{API}/public/batch/{d['id']}", timeout=30)
        assert pub.status_code == 200, pub.text[:300]
        p = pub.json()
        for k, v in PAYLOAD.items():
            assert p.get(k) == v, f"{k}: {p.get(k)} != {v}"
        assert "owner_id" not in p and "_id" not in p

    def test_list_contains_created(self, admin, created):
        r = admin.get(f"{API}/batches", timeout=30)
        assert r.status_code == 200, r.text[:300]
        items = r.json()
        assert isinstance(items, list)
        assert created[0] in [x["id"] for x in items]
        assert all("owner_id" not in x for x in items)

    def test_validation_missing_product(self, admin):
        r = admin.post(f"{API}/batches", json={"code": "TEST_X"}, timeout=30)
        assert r.status_code == 422, r.text[:300]

    def test_public_get_unknown_404(self):
        r = requests.get(f"{API}/public/batch/does-not-exist-xyz", timeout=30)
        assert r.status_code == 404, r.text[:200]


# --- DELETE /api/batches/{id} ---
class TestBatchDelete:
    def test_delete_then_public_404(self, admin):
        r = admin.post(f"{API}/batches", json={**PAYLOAD, "code": "TEST_LOT-40B"}, timeout=30)
        assert r.status_code == 200
        bid = r.json()["id"]
        d = admin.delete(f"{API}/batches/{bid}", timeout=30)
        assert d.status_code == 200, d.text[:300]
        assert requests.get(f"{API}/public/batch/{bid}", timeout=30).status_code == 404
        assert admin.delete(f"{API}/batches/{bid}", timeout=30).status_code == 404
