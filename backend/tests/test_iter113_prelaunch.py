"""Iteration 113 — pre-launch smoke tests for the flows in the review request.

Covered modules: auth (login/me), recipes list (guest + auth), site-settings,
community posts (guest gate vs logged), academy quiz (AI, no-login), weekly plan,
challenges catalog/state, bake-along current, newsletter count.
"""
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

EMAIL = "fornaio@mikilab.de"
PASSWORD = "Mikilab2026!"


@pytest.fixture(scope="module")
def guest():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def token(guest):
    r = guest.post(f"{API}/auth/login", json={"email": EMAIL, "password": PASSWORD}, timeout=30)
    if r.status_code != 200:
        pytest.fail(f"login failed {r.status_code}: {r.text[:300]}")
    data = r.json()
    tok = data.get("session_token") or data.get("token")
    assert tok, f"no token in login response: {list(data.keys())}"
    return tok


@pytest.fixture(scope="module")
def auth(token):
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json", "Authorization": f"Bearer {token}"})
    return s


# ---------- auth ----------
class TestAuth:
    def test_login_and_me(self, auth):
        r = auth.get(f"{API}/auth/me", timeout=30)
        assert r.status_code == 200, r.text[:300]
        me = r.json()
        assert me.get("email") == EMAIL
        assert "_id" not in me

    def test_login_wrong_password(self, guest):
        r = guest.post(f"{API}/auth/login", json={"email": EMAIL, "password": "WRONG_pw_123"}, timeout=30)
        assert r.status_code in (400, 401, 403, 429), r.status_code

    def test_me_guest_401(self, guest):
        r = requests.get(f"{API}/auth/me", timeout=30)
        assert r.status_code in (401, 403)


# ---------- recipes ----------
class TestRecipes:
    def test_recipes_guest(self, guest):
        r = guest.get(f"{API}/recipes", timeout=60)
        assert r.status_code == 200, r.text[:300]
        items = r.json()
        assert isinstance(items, list) and len(items) > 0
        assert all("_id" not in it for it in items[:20])
        assert "id" in items[0]

    def test_recipes_have_category_and_titles(self, auth):
        r = auth.get(f"{API}/recipes", timeout=60)
        assert r.status_code == 200
        items = r.json()
        assert len(items) > 5
        # section/category grouping data must exist for the grouped selects
        with_cat = [i for i in items if i.get("menu_category")]
        assert with_cat, "no recipe carries menu_category -> optgroup grouping impossible"
        # localized titles needed for translated optgroup entries
        assert any(i.get("name_en") or i.get("name_de") for i in items)

    def test_recipe_single_get_not_exposed(self, auth):
        # no GET /recipes/{id} route by design; detail comes from the list payload
        items = auth.get(f"{API}/recipes", timeout=60).json()
        r = auth.get(f"{API}/recipes/{items[0]['id']}", timeout=30)
        assert r.status_code == 405


# ---------- public content ----------
class TestPublicContent:
    @pytest.mark.parametrize("path", [
        "/site-settings", "/news", "/shop/products", "/newsletter/count",
        "/challenges/catalog", "/bakealong/current",
    ])
    def test_public_get(self, guest, path):
        r = guest.get(f"{API}{path}", timeout=45)
        assert r.status_code == 200, f"{path} -> {r.status_code} {r.text[:200]}"


# ---------- community ----------
class TestCommunity:
    def test_posts_guest(self, guest):
        r = requests.get(f"{API}/community/posts", timeout=45)
        assert r.status_code in (200, 401, 403), r.status_code

    def test_posts_logged(self, auth):
        r = auth.get(f"{API}/community/posts", timeout=45)
        assert r.status_code == 200, r.text[:300]
        posts = r.json()
        assert isinstance(posts, list)
        for p in posts[:5]:
            assert "_id" not in p

    def test_market_logged(self, auth):
        r = auth.get(f"{API}/community/market", timeout=45)
        assert r.status_code == 200, r.text[:300]
        data = r.json()
        assert isinstance(data.get("items"), list)


# ---------- weekly plan ----------
class TestWeekly:
    def test_weekly_get(self, auth):
        r = auth.get(f"{API}/weekly-plan", timeout=45)
        assert r.status_code == 200, r.text[:300]
        data = r.json()
        assert isinstance(data, dict)
        assert "_id" not in data


# ---------- challenges ----------
class TestChallenges:
    def test_state_logged(self, auth):
        r = auth.get(f"{API}/challenges/state", timeout=45)
        assert r.status_code == 200, r.text[:300]


# ---------- AI quiz (must work without login) ----------
class TestQuiz:
    def test_quiz_guest(self, guest):
        r = requests.post(f"{API}/academy/quiz", json={"lang": "it", "level": "base"}, timeout=120)
        assert r.status_code == 200, f"guest quiz -> {r.status_code}: {r.text[:400]}"
        data = r.json()
        q = data.get("question") or (data.get("questions") or [{}])[0].get("question")
        assert q, f"no question in payload: {str(data)[:300]}"

    def test_quiz_logged(self, auth):
        r = auth.post(f"{API}/academy/quiz", json={"lang": "it", "level": "base"}, timeout=120)
        assert r.status_code == 200, r.text[:400]
