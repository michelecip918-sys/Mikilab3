# ============================================================================
#  MIKILAB PRO & BakoMix AI — PROPRIETARY & CONFIDENTIAL
#  (c) 2026 MikiLab Pro. Tutti i diritti riservati / All rights reserved.
#  Unico proprietario legale: il Master. Sole legal owner: the Master.
#  Codice riservato: vietata copia, distribuzione, reverse engineering o
#  cloning non autorizzati. Unauthorized copying, distribution, reverse
#  engineering or cloning is strictly prohibited and actively tracked by
#  the BakoMix AI Security Guardian.
# ============================================================================
"""Iteration 17 — Authentication, recipe isolation and admin permissions."""
import os
import uuid

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
USER = {"email": "fornaio@mikilab.de", "password": "Mikilab2026!"}


def login(creds):
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json=creds, timeout=30)
    assert r.status_code == 200, f"login failed {r.status_code} {r.text[:300]}"
    data = r.json()
    assert "session_token" in data and isinstance(data["session_token"], str)
    assert data["user"]["email"] == creds["email"]
    return s, data


@pytest.fixture(scope="module")
def admin_sess():
    s, d = login(ADMIN)
    return s, d["user"]


@pytest.fixture(scope="module")
def user_sess():
    s, d = login(USER)
    return s, d["user"]


# --- Auth module -----------------------------------------------------------
class TestAuth:
    def test_me_unauthenticated_401(self):
        r = requests.get(f"{API}/auth/me", timeout=30)
        assert r.status_code == 401, r.text[:200]

    def test_recipes_unauthenticated_401(self):
        r = requests.get(f"{API}/recipes?collection_name=mikilab", timeout=30)
        assert r.status_code == 401, r.text[:200]

    def test_recipes_personal_unauthenticated_401(self):
        r = requests.get(f"{API}/recipes?collection_name=personal", timeout=30)
        assert r.status_code == 401

    def test_login_admin_role_and_cookie(self):
        s, d = login(ADMIN)
        assert d["user"]["role"] == "admin"
        assert "session_token" in s.cookies.get_dict(), f"cookie not set: {s.cookies.get_dict()}"

    def test_login_user_role(self, user_sess):
        _, u = user_sess
        assert u["role"] == "user"

    def test_login_wrong_password_401(self):
        r = requests.post(f"{API}/auth/login", json={"email": ADMIN["email"], "password": "wrong"}, timeout=30)
        assert r.status_code == 401
        assert "detail" in r.json()

    def test_login_unknown_email_401(self):
        r = requests.post(f"{API}/auth/login", json={"email": f"nope_{uuid.uuid4().hex}@x.de", "password": "x"}, timeout=30)
        assert r.status_code == 401

    def test_me_with_cookie(self, admin_sess):
        s, u = admin_sess
        r = s.get(f"{API}/auth/me", timeout=30)
        assert r.status_code == 200
        assert r.json()["email"] == ADMIN["email"]
        assert r.json()["role"] == "admin"

    def test_me_with_bearer_token(self):
        _, d = login(USER)
        r = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {d['session_token']}"}, timeout=30)
        assert r.status_code == 200
        assert r.json()["email"] == USER["email"]

    def test_invalid_token_401(self):
        r = requests.get(f"{API}/auth/me", headers={"Authorization": "Bearer bogustoken"}, timeout=30)
        assert r.status_code == 401

    def test_register_new_user_then_logout(self):
        email = f"test_{uuid.uuid4().hex[:8]}@mikilab.test"
        s = requests.Session()
        r = s.post(f"{API}/auth/register", json={"email": email, "password": "Passw0rd!", "name": "TEST_User"}, timeout=30)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        assert d["user"]["email"] == email
        assert d["user"]["role"] == "user"  # not first user -> not admin
        token = d["session_token"]
        # session works
        assert s.get(f"{API}/auth/me", timeout=30).status_code == 200
        # duplicate email rejected
        r2 = requests.post(f"{API}/auth/register", json={"email": email, "password": "Passw0rd!"}, timeout=30)
        assert r2.status_code == 400
        # logout invalidates session
        assert s.post(f"{API}/auth/logout", timeout=30).status_code == 200
        r3 = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {token}"}, timeout=30)
        assert r3.status_code == 401, "session token still valid after logout"

    def test_register_missing_password_400(self):
        r = requests.post(f"{API}/auth/register", json={"email": f"x_{uuid.uuid4().hex[:6]}@t.de", "password": ""}, timeout=30)
        assert r.status_code in (400, 422)

    def test_brute_force_lockout(self):
        """Playbook check: lockout after 5 failed attempts (informational)."""
        codes = []
        for _ in range(7):
            r = requests.post(f"{API}/auth/login", json={"email": USER["email"], "password": "bad"}, timeout=30)
            codes.append(r.status_code)
        assert 429 in codes, f"no rate limiting/lockout, codes={codes}"


# --- Recipes: isolation + admin permission --------------------------------
class TestRecipeScoping:
    created = []

    def test_mikilab_readable_by_normal_user(self, user_sess):
        s, _ = user_sess
        r = s.get(f"{API}/recipes?collection_name=mikilab", timeout=30)
        assert r.status_code == 200
        recipes = r.json()
        assert len(recipes) > 10
        assert all("_id" not in x for x in recipes)

    def test_personal_isolation_and_persistence(self, user_sess, admin_sess):
        us, uinfo = user_sess
        ads, _ = admin_sess
        name = f"TEST_Ricetta_{uuid.uuid4().hex[:6]}"
        payload = {"name": name, "collection_name": "personal", "category": "pane",
                   "ingredients": [{"name": "farina", "quantity": "1000", "unit": "g"}],
                   "steps": ["impasto"], "notes": "test"}
        r = us.post(f"{API}/recipes", json=payload, timeout=30)
        assert r.status_code == 200, r.text[:300]
        rid = r.json()["id"]
        TestRecipeScoping.created.append((rid, "user"))
        assert r.json()["name"] == name

        # persisted for owner
        mine = us.get(f"{API}/recipes?collection_name=personal", timeout=30).json()
        assert any(x["id"] == rid for x in mine)

        # not visible to admin (different owner)
        theirs = ads.get(f"{API}/recipes?collection_name=personal", timeout=30).json()
        assert not any(x["id"] == rid for x in theirs), "personal recipe leaked to another user"

        # admin cannot update someone else's personal recipe
        r2 = ads.put(f"{API}/recipes/{rid}", json={"name": name + "_hack"}, timeout=30)
        assert r2.status_code == 403, f"expected 403 got {r2.status_code}"

        # owner can update
        r3 = us.put(f"{API}/recipes/{rid}", json={"name": name + "_v2"}, timeout=30)
        assert r3.status_code == 200
        mine2 = us.get(f"{API}/recipes?collection_name=personal", timeout=30).json()
        assert any(x["id"] == rid and x["name"] == name + "_v2" for x in mine2)

    def test_normal_user_cannot_create_mikilab(self, user_sess):
        s, _ = user_sess
        r = s.post(f"{API}/recipes", json={"name": f"TEST_hack_{uuid.uuid4().hex[:5]}", "collection_name": "mikilab",
                                           "category": "pane", "ingredients": [], "steps": []}, timeout=30)
        assert r.status_code == 403, f"got {r.status_code}: {r.text[:200]}"

    def test_normal_user_cannot_update_mikilab(self, user_sess):
        s, _ = user_sess
        rec = s.get(f"{API}/recipes?collection_name=mikilab", timeout=30).json()[0]
        r = s.put(f"{API}/recipes/{rec['id']}", json={"notes": "hacked"}, timeout=30)
        assert r.status_code == 403, f"got {r.status_code}"
        r2 = s.delete(f"{API}/recipes/{rec['id']}", timeout=30)
        assert r2.status_code == 403

    def test_admin_can_update_mikilab(self, admin_sess):
        s, _ = admin_sess
        rec = s.get(f"{API}/recipes?collection_name=mikilab", timeout=30).json()[0]
        original = rec.get("notes", "")
        r = s.put(f"{API}/recipes/{rec['id']}", json={"notes": "TEST_admin_note"}, timeout=30)
        assert r.status_code == 200, r.text[:300]
        lst = s.get(f"{API}/recipes?collection_name=mikilab", timeout=30).json()
        again = next(x for x in lst if x["id"] == rec["id"])
        assert again.get("notes") == "TEST_admin_note"
        # restore
        s.put(f"{API}/recipes/{rec['id']}", json={"notes": original}, timeout=30)

    def test_zz_cleanup(self, user_sess):
        s, _ = user_sess
        for rid, _who in TestRecipeScoping.created:
            r = s.delete(f"{API}/recipes/{rid}", timeout=30)
            assert r.status_code in (200, 204, 404)
            left = s.get(f"{API}/recipes?collection_name=personal", timeout=30).json()
            assert not any(x["id"] == rid for x in left)


# --- Other authenticated endpoints ----------------------------------------
class TestOtherEndpoints:
    @pytest.mark.parametrize("path", [
        "/announcements", "/news", "/courses",
    ])
    def test_public_or_auth_endpoints_reachable(self, path, user_sess):
        s, _ = user_sess
        r = s.get(f"{API}{path}", timeout=60)
        assert r.status_code in (200, 401, 404), f"{path} -> {r.status_code}"
