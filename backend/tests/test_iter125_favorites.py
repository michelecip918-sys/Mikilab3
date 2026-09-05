# ============================================================================
#  MIKILAB PRO & BakoMix AI — PROPRIETARY & CONFIDENTIAL
#  (c) 2026 MikiLab Pro. Tutti i diritti riservati / All rights reserved.
#  Unico proprietario legale: il Master. Sole legal owner: the Master.
#  Codice riservato: vietata copia, distribuzione, reverse engineering o
#  cloning non autorizzati. Unauthorized copying, distribution, reverse
#  engineering or cloning is strictly prohibited and actively tracked by
#  the BakoMix AI Security Guardian.
# ============================================================================
"""Iteration 125 — Favorites on account: GET /api/favorites, POST toggle, POST sync, GET counts (public)."""
import os
import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
base_url = os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")
if not base_url:
    raise RuntimeError("REACT_APP_BACKEND_URL missing")
BASE_URL = base_url.rstrip("/")

ADMIN = {"email": "admin@mikilab.de", "password": "Mikilab2026!"}
TEST_IDS = ["TEST_fav_r1", "TEST_fav_r2", "custodite:TEST_fav_c1"]


@pytest.fixture(scope="module")
def admin_client():
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login", json=ADMIN, timeout=30)
    if r.status_code != 200:
        pytest.fail(f"admin login failed {r.status_code}: {r.text[:300]}")
    tok = r.json().get("session_token") or r.json().get("token")
    if tok:
        s.headers.update({"Authorization": f"Bearer {tok}"})
    yield s
    # cleanup: remove any TEST_ favorites left
    cur = set(s.get(f"{BASE_URL}/api/favorites", timeout=30).json())
    for rid in TEST_IDS:
        if rid in cur:
            s.post(f"{BASE_URL}/api/favorites/toggle", json={"recipe_id": rid}, timeout=30)


class TestFavoritesApi:
    def test_counts_public(self):
        r = requests.get(f"{BASE_URL}/api/favorites/counts", timeout=30)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, dict)
        counts = data.get("counts", data)
        assert isinstance(counts, dict)
        for v in list(counts.values())[:10]:
            assert isinstance(v, int) and v > 0

    def test_favorites_requires_auth(self):
        r = requests.get(f"{BASE_URL}/api/favorites", timeout=30)
        assert r.status_code in (401, 403), r.status_code

    def test_toggle_persist_and_counts(self, admin_client):
        rid = TEST_IDS[0]
        before = admin_client.get(f"{BASE_URL}/api/favorites", timeout=30)
        assert before.status_code == 200
        ids_before = set(before.json())
        if rid in ids_before:
            admin_client.post(f"{BASE_URL}/api/favorites/toggle", json={"recipe_id": rid}, timeout=30)

        t = admin_client.post(f"{BASE_URL}/api/favorites/toggle", json={"recipe_id": rid}, timeout=30)
        assert t.status_code == 200, t.text[:300]
        assert t.json().get("favorite") is True

        # GET verifies persistence
        after = admin_client.get(f"{BASE_URL}/api/favorites", timeout=30).json()
        assert rid in after

        # public counts reflect it
        counts = requests.get(f"{BASE_URL}/api/favorites/counts", timeout=30).json()
        counts = counts.get("counts", counts)
        assert counts.get(rid, 0) >= 1

        # untoggle
        t2 = admin_client.post(f"{BASE_URL}/api/favorites/toggle", json={"recipe_id": rid}, timeout=30)
        assert t2.status_code == 200 and t2.json().get("favorite") is False
        assert rid not in admin_client.get(f"{BASE_URL}/api/favorites", timeout=30).json()
        counts2 = requests.get(f"{BASE_URL}/api/favorites/counts", timeout=30).json()
        counts2 = counts2.get("counts", counts2)
        assert counts2.get(rid, 0) == 0

    def test_sync_merges_and_returns_ids(self, admin_client):
        rid = TEST_IDS[1]
        r = admin_client.post(f"{BASE_URL}/api/favorites/sync", json={"ids": [rid]}, timeout=30)
        assert r.status_code == 200, r.text[:300]
        ids = r.json()
        assert rid in ids
        # persisted server-side
        assert rid in admin_client.get(f"{BASE_URL}/api/favorites", timeout=30).json()
        # idempotent: sync empty must NOT delete server favorites
        ids2 = admin_client.post(f"{BASE_URL}/api/favorites/sync", json={"ids": []}, timeout=30).json()
        assert rid in ids2
        # cleanup
        admin_client.post(f"{BASE_URL}/api/favorites/toggle", json={"recipe_id": rid}, timeout=30)

    def test_custodite_key_supported(self, admin_client):
        rid = TEST_IDS[2]
        assert admin_client.post(f"{BASE_URL}/api/favorites/toggle", json={"recipe_id": rid}, timeout=30).status_code == 200
        assert rid in admin_client.get(f"{BASE_URL}/api/favorites", timeout=30).json()
        admin_client.post(f"{BASE_URL}/api/favorites/toggle", json={"recipe_id": rid}, timeout=30)

    def test_toggle_invalid_payload(self, admin_client):
        r = admin_client.post(f"{BASE_URL}/api/favorites/toggle", json={}, timeout=30)
        assert r.status_code in (400, 422), r.status_code
