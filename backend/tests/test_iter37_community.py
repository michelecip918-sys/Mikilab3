"""Iteration 37 — Community B2B endpoints (/api/community/posts)."""
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
USER = {"email": "fornaio@mikilab.de", "password": "Mikilab2026!"}


def login(creds):
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json=creds, timeout=30)
    if r.status_code != 200:
        pytest.fail(f"login failed {creds['email']}: {r.status_code} {r.text[:300]}")
    tok = r.json().get("session_token") or r.json().get("token")
    if not tok:
        pytest.fail(f"no token in login response: {r.text[:300]}")
    s.headers.update({"Authorization": f"Bearer {tok}"})
    return s


@pytest.fixture(scope="module")
def admin_client():
    return login(ADMIN)


@pytest.fixture(scope="module")
def user_client():
    return login(USER)


@pytest.fixture(scope="module")
def anon_client():
    return requests.Session()


class TestCommunityPublicRead:
    def test_list_anonymous(self, anon_client):
        r = anon_client.get(f"{API}/community/posts", timeout=30)
        assert r.status_code == 200, r.text[:300]
        data = r.json()
        assert isinstance(data, list)
        for p in data:
            assert "_id" not in p
            assert p["liked_by_me"] is False
            assert p["can_delete"] is False


class TestCommunityAuthGating:
    def test_create_requires_auth(self, anon_client):
        r = anon_client.post(f"{API}/community/posts", json={"category": "consiglio", "text": "TEST_anon"}, timeout=30)
        assert r.status_code in (401, 403), r.status_code

    def test_like_requires_auth(self, anon_client):
        r = anon_client.post(f"{API}/community/posts/does-not-exist/like", timeout=30)
        assert r.status_code in (401, 403), r.status_code


class TestCommunityCRUD:
    created = []

    def test_create_and_persist(self, admin_client):
        payload = {"category": "consiglio", "text": "TEST_post iterazione 37"}
        r = admin_client.post(f"{API}/community/posts", json=payload, timeout=30)
        assert r.status_code == 200, r.text[:300]
        p = r.json()
        assert p["text"] == payload["text"]
        assert p["category"] == "consiglio"
        assert p["like_count"] == 0
        assert p["liked_by_me"] is False
        assert p["can_delete"] is True
        assert isinstance(p["author_name"], str) and p["author_name"]
        assert "_id" not in p
        TestCommunityCRUD.created.append(p["id"])

        lst = admin_client.get(f"{API}/community/posts", timeout=30).json()
        assert any(x["id"] == p["id"] and x["text"] == payload["text"] for x in lst)

    def test_empty_post_rejected(self, admin_client):
        r = admin_client.post(f"{API}/community/posts", json={"category": "consiglio", "text": "   "}, timeout=30)
        assert r.status_code == 400, r.status_code

    def test_invalid_category_falls_back(self, admin_client):
        r = admin_client.post(f"{API}/community/posts", json={"category": "hacked", "text": "TEST_cat"}, timeout=30)
        assert r.status_code == 200, r.text[:300]
        p = r.json()
        assert p["category"] == "consiglio"
        TestCommunityCRUD.created.append(p["id"])

    def test_like_toggle(self, admin_client):
        pid = TestCommunityCRUD.created[0]
        r = admin_client.post(f"{API}/community/posts/{pid}/like", timeout=30)
        assert r.status_code == 200, r.text[:300]
        assert r.json()["like_count"] == 1
        assert r.json()["liked_by_me"] is True
        r = admin_client.post(f"{API}/community/posts/{pid}/like", timeout=30)
        assert r.json()["like_count"] == 0
        assert r.json()["liked_by_me"] is False

    def test_like_not_found(self, admin_client):
        r = admin_client.post(f"{API}/community/posts/nope-xyz/like", timeout=30)
        assert r.status_code == 404, r.status_code

    def test_comment(self, admin_client):
        pid = TestCommunityCRUD.created[0]
        r = admin_client.post(f"{API}/community/posts/{pid}/comments", json={"text": "TEST_commento"}, timeout=30)
        assert r.status_code == 200, r.text[:300]
        p = r.json()
        assert len(p["comments"]) >= 1
        assert p["comments"][-1]["text"] == "TEST_commento"
        # persisted
        lst = admin_client.get(f"{API}/community/posts", timeout=30).json()
        target = next(x for x in lst if x["id"] == pid)
        assert any(c["text"] == "TEST_commento" for c in target["comments"])

    def test_empty_comment_rejected(self, admin_client):
        pid = TestCommunityCRUD.created[0]
        r = admin_client.post(f"{API}/community/posts/{pid}/comments", json={"text": " "}, timeout=30)
        assert r.status_code == 400, r.status_code

    def test_other_user_cannot_delete(self, user_client, admin_client):
        pid = TestCommunityCRUD.created[0]
        # normal user sees post but can_delete False
        lst = user_client.get(f"{API}/community/posts", timeout=30).json()
        target = next(x for x in lst if x["id"] == pid)
        assert target["can_delete"] is False
        r = user_client.delete(f"{API}/community/posts/{pid}", timeout=30)
        assert r.status_code == 403, r.status_code

    def test_owner_delete_and_verify(self, admin_client):
        for pid in list(TestCommunityCRUD.created):
            r = admin_client.delete(f"{API}/community/posts/{pid}", timeout=30)
            assert r.status_code == 200, r.text[:300]
            TestCommunityCRUD.created.remove(pid)
        lst = admin_client.get(f"{API}/community/posts", timeout=30).json()
        ids = [x["id"] for x in lst]
        assert not any("TEST_post iterazione 37" == x["text"] for x in lst), "post still present after delete"
        assert all(i not in ids for i in TestCommunityCRUD.created)

    def test_delete_not_found(self, admin_client):
        r = admin_client.delete(f"{API}/community/posts/nope-xyz", timeout=30)
        assert r.status_code == 404, r.status_code


@pytest.fixture(scope="module", autouse=True)
def cleanup(admin_client):
    yield
    for pid in list(TestCommunityCRUD.created):
        admin_client.delete(f"{API}/community/posts/{pid}", timeout=30)
