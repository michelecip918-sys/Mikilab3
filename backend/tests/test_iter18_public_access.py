# ============================================================================
#  MIKILAB PRO & BakoMix AI — PROPRIETARY & CONFIDENTIAL
#  (c) 2026 MikiLab Pro. Tutti i diritti riservati / All rights reserved.
#  Unico proprietario legale: il Master. Sole legal owner: the Master.
#  Codice riservato: vietata copia, distribuzione, reverse engineering o
#  cloning non autorizzati. Unauthorized copying, distribution, reverse
#  engineering or cloning is strictly prohibited and actively tracked by
#  the BakoMix AI Security Guardian.
# ============================================================================
"""Iteration 18 — Accesso libero: ricette mikilab pubbliche, personal e mutazioni protette."""
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
USER = {"email": "fornaio@mikilab.de", "password": "Mikilab2026!"}


@pytest.fixture(scope="module")
def anon():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


def _login(creds):
    r = requests.post(f"{BASE_URL}/api/auth/login", json=creds, timeout=30)
    assert r.status_code == 200, f"login failed {r.status_code}: {r.text[:300]}"
    data = r.json()
    token = data.get("session_token") or data.get("token")
    assert token, f"no token in login response: {data}"
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json", "Authorization": f"Bearer {token}"})
    return s, data


@pytest.fixture(scope="module")
def admin_client():
    s, _ = _login(ADMIN)
    return s


@pytest.fixture(scope="module")
def user_client():
    s, _ = _login(USER)
    return s


# --- Public read access (mikilab) ---
class TestPublicRecipes:
    def test_mikilab_recipes_public(self, anon):
        r = anon.get(f"{BASE_URL}/api/recipes?collection_name=mikilab", timeout=30)
        assert r.status_code == 200, r.text[:300]
        data = r.json()
        assert isinstance(data, list) and len(data) > 0
        first = data[0]
        assert "id" in first and "name" in first
        assert "_id" not in first

    def test_personal_requires_auth(self, anon):
        r = anon.get(f"{BASE_URL}/api/recipes?collection_name=personal", timeout=30)
        assert r.status_code == 401, f"expected 401, got {r.status_code}: {r.text[:200]}"

    def test_create_requires_auth(self, anon):
        r = anon.post(f"{BASE_URL}/api/recipes", json={"name": "TEST_anon", "collection_name": "personal"}, timeout=30)
        assert r.status_code == 401, r.status_code

    def test_delete_requires_auth(self, anon):
        r = anon.delete(f"{BASE_URL}/api/recipes/does-not-exist", timeout=30)
        assert r.status_code == 401, r.status_code

    def test_update_requires_auth(self, anon):
        r = anon.put(f"{BASE_URL}/api/recipes/does-not-exist", json={"name": "x"}, timeout=30)
        assert r.status_code == 401, r.status_code

    def test_me_requires_auth(self, anon):
        r = anon.get(f"{BASE_URL}/api/auth/me", timeout=30)
        assert r.status_code == 401, r.status_code


# --- Auth + permissions ---
class TestAuthPermissions:
    def test_admin_login_and_me(self, admin_client):
        r = admin_client.get(f"{BASE_URL}/api/auth/me", timeout=30)
        assert r.status_code == 200, r.text[:200]
        me = r.json()
        assert me["email"] == ADMIN["email"]
        assert me["role"] == "admin"

    def test_normal_user_role(self, user_client):
        r = user_client.get(f"{BASE_URL}/api/auth/me", timeout=30)
        assert r.status_code == 200
        assert r.json()["role"] != "admin"

    def test_normal_user_cannot_create_mikilab(self, user_client):
        r = user_client.post(f"{BASE_URL}/api/recipes", json={"name": "TEST_no_perm", "collection_name": "mikilab"}, timeout=30)
        assert r.status_code == 403, f"expected 403, got {r.status_code}: {r.text[:200]}"

    def test_admin_update_mikilab_recipe_persists(self, admin_client):
        lst = admin_client.get(f"{BASE_URL}/api/recipes?collection_name=mikilab", timeout=30).json()
        target = lst[0]
        original_notes = target.get("notes") or ""
        new_notes = "TEST_iter18_note"
        r = admin_client.put(f"{BASE_URL}/api/recipes/{target['id']}", json={"notes": new_notes}, timeout=30)
        assert r.status_code == 200, r.text[:300]
        got = admin_client.get(f"{BASE_URL}/api/recipes?collection_name=mikilab", timeout=30).json()
        updated = next(x for x in got if x["id"] == target["id"])
        assert updated.get("notes") == new_notes
        # restore
        admin_client.put(f"{BASE_URL}/api/recipes/{target['id']}", json={"notes": original_notes}, timeout=30)

    def test_personal_crud_and_isolation(self, user_client, admin_client):
        r = user_client.post(f"{BASE_URL}/api/recipes", json={"name": "TEST_iter18_personal", "collection_name": "personal"}, timeout=30)
        assert r.status_code in (200, 201), r.text[:300]
        rid = r.json()["id"]
        mine = user_client.get(f"{BASE_URL}/api/recipes?collection_name=personal", timeout=30).json()
        assert any(x["id"] == rid for x in mine)
        others = admin_client.get(f"{BASE_URL}/api/recipes?collection_name=personal", timeout=30).json()
        assert not any(x["id"] == rid for x in others), "isolamento owner_id rotto"
        d = user_client.delete(f"{BASE_URL}/api/recipes/{rid}", timeout=30)
        assert d.status_code in (200, 204)
        mine2 = user_client.get(f"{BASE_URL}/api/recipes?collection_name=personal", timeout=30).json()
        assert not any(x["id"] == rid for x in mine2)


# --- Public sections used by home hub ---
class TestPublicSections:
    @pytest.mark.parametrize("path", ["/api/", "/api/news", "/api/courses"])
    def test_public_endpoints(self, anon, path):
        r = anon.get(f"{BASE_URL}{path}", timeout=60)
        assert r.status_code in (200, 404), f"{path} -> {r.status_code}: {r.text[:200]}"
