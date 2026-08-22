"""Iter 42 — Notifiche Community (like/commento sui propri post)."""
import os
import pytest
import requests
from dotenv import dotenv_values

fe = dotenv_values("/app/frontend/.env")
BASE = (os.environ.get("REACT_APP_BACKEND_URL") or fe.get("REACT_APP_BACKEND_URL")).rstrip("/")
API = f"{BASE}/api"

ADMIN = {"email": "admin@mikilab.de", "password": "Mikilab2026!"}
USER = {"email": "fornaio@mikilab.de", "password": "Mikilab2026!"}


def _login(creds):
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json=creds, timeout=30)
    assert r.status_code == 200, f"login failed {r.status_code}: {r.text[:300]}"
    tok = r.json().get("session_token") or r.json().get("token")
    assert tok, f"no token in {r.json()}"
    s.headers.update({"Authorization": f"Bearer {tok}"})
    return s


@pytest.fixture(scope="module")
def admin():
    return _login(ADMIN)


@pytest.fixture(scope="module")
def fornaio():
    return _login(USER)


@pytest.fixture(scope="module")
def admin_post(admin):
    r = admin.post(f"{API}/community/posts", json={"text": "TEST_notif post admin iter42", "category": "consiglio"}, timeout=30)
    assert r.status_code == 200, r.text[:300]
    pid = r.json()["id"]
    yield pid
    admin.delete(f"{API}/community/posts/{pid}", timeout=30)


class TestNotifications:
    def test_requires_auth(self):
        r = requests.get(f"{API}/notifications", timeout=30)
        assert r.status_code in (401, 403), r.status_code

    def test_list_shape(self, admin):
        r = admin.get(f"{API}/notifications", timeout=30)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        assert isinstance(d.get("items"), list)
        assert isinstance(d.get("unread"), int)
        for it in d["items"]:
            assert "_id" not in it
            for k in ("id", "type", "actor_name", "created_at", "read"):
                assert k in it, f"missing {k} in {it}"

    def test_self_like_no_notification(self, admin, admin_post):
        before = admin.get(f"{API}/notifications", timeout=30).json()["unread"]
        r = admin.post(f"{API}/community/posts/{admin_post}/like", timeout=30)
        assert r.status_code == 200, r.text[:300]
        after = admin.get(f"{API}/notifications", timeout=30).json()["unread"]
        assert after == before, "self-like must not notify"
        # unlike per pulizia
        admin.post(f"{API}/community/posts/{admin_post}/like", timeout=30)

    def test_self_comment_no_notification(self, admin, admin_post):
        before = admin.get(f"{API}/notifications", timeout=30).json()["unread"]
        r = admin.post(f"{API}/community/posts/{admin_post}/comments", json={"text": "TEST_self comment"}, timeout=30)
        assert r.status_code == 200, r.text[:300]
        after = admin.get(f"{API}/notifications", timeout=30).json()["unread"]
        assert after == before, "self-comment must not notify"

    def test_like_and_comment_generate_notifications(self, admin, fornaio, admin_post):
        # mark all read first
        assert admin.post(f"{API}/notifications/read", timeout=30).status_code == 200
        assert admin.get(f"{API}/notifications", timeout=30).json()["unread"] == 0

        assert fornaio.post(f"{API}/community/posts/{admin_post}/like", timeout=30).status_code == 200
        assert fornaio.post(f"{API}/community/posts/{admin_post}/comments", json={"text": "TEST_notif commento fornaio"}, timeout=30).status_code == 200

        d = admin.get(f"{API}/notifications", timeout=30).json()
        assert d["unread"] == 2, f"expected 2 unread, got {d['unread']}"
        types = [i["type"] for i in d["items"][:2]]
        assert set(types) == {"like", "comment"}, types
        assert all(i["post_id"] == admin_post for i in d["items"][:2])
        assert d["items"][0]["actor_name"], "actor_name empty"
        assert d["items"][0]["read"] is False

    def test_unlike_does_not_notify(self, admin, fornaio, admin_post):
        before = admin.get(f"{API}/notifications", timeout=30).json()
        assert fornaio.post(f"{API}/community/posts/{admin_post}/like", timeout=30).status_code == 200  # unlike
        after = admin.get(f"{API}/notifications", timeout=30).json()
        assert len(after["items"]) == len(before["items"]), "unlike must not create notification"
        # re-like to restore unread state for UI test
        fornaio.post(f"{API}/community/posts/{admin_post}/like", timeout=30)

    def test_mark_read_persists(self, admin):
        assert admin.post(f"{API}/notifications/read", timeout=30).status_code == 200
        d = admin.get(f"{API}/notifications", timeout=30).json()
        assert d["unread"] == 0
        assert all(i["read"] is True for i in d["items"])
        assert len(d["items"]) > 0, "items should remain visible after read"

    def test_recipient_isolation(self, fornaio, admin_post):
        d = fornaio.get(f"{API}/notifications", timeout=30).json()
        assert all(i.get("post_id") != admin_post for i in d["items"]), "actor should not receive own-action notifications"
