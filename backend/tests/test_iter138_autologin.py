import os
import time

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


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ---- Registration auto-login ----
class TestRegisterAutoLogin:
    def test_register_returns_session_token(self, client):
        email = f"qa_{int(time.time())}@mikilab.de"
        r = client.post(f"{API}/auth/register", json={"email": email, "password": "Mikilab2026!", "name": "QA"})
        assert r.status_code == 200, r.text
        d = r.json()
        assert d.get("session_token"), f"no session_token: {d}"
        assert d["user"]["email"] == email
        # _public_user does not expose email_verified; if present it must be True
        assert d["user"].get("email_verified", True) is True
        assert d.get("needs_verification") in (None, False)

        # /auth/me with bearer
        me = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {d['session_token']}"})
        assert me.status_code == 200, me.text
        assert me.json()["email"] == email

        # community feed accessible with the new session
        feed = requests.get(f"{API}/community/posts", headers={"Authorization": f"Bearer {d['session_token']}"})
        assert feed.status_code == 200, feed.text

    def test_register_weak_password_rejected(self, client):
        email = f"qa_weak_{int(time.time())}@mikilab.de"
        r = client.post(f"{API}/auth/register", json={"email": email, "password": "abc", "name": "QA"})
        assert r.status_code == 400, r.text

    def test_register_duplicate_email(self, client):
        r = client.post(f"{API}/auth/register", json={"email": ADMIN["email"], "password": "Mikilab2026!", "name": "QA"})
        assert r.status_code in (400, 409), r.text


# ---- Regression: admin login ----
class TestAdminLogin:
    def test_admin_login_and_me(self, client):
        r = client.post(f"{API}/auth/login", json=ADMIN)
        assert r.status_code == 200, r.text
        d = r.json()
        token = d.get("session_token")
        assert token
        assert d["user"]["role"] == "admin"
        assert "session_token" in r.cookies, f"cookies: {r.cookies.get_dict()}"
        me = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert me.status_code == 200
        assert me.json()["email"] == ADMIN["email"]

    def test_admin_bad_password(self, client):
        r = requests.post(f"{API}/auth/login", json={"email": ADMIN["email"], "password": "wrongpass123"})
        assert r.status_code in (401, 429), r.text
