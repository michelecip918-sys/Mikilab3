"""Iteration 96 — Motore Sfide (challenges) backend tests."""
import os
import pytest
import requests
from dotenv import dotenv_values
from pymongo import MongoClient

fe = dotenv_values("/app/frontend/.env")
be = dotenv_values("/app/backend/.env")
BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or fe.get("REACT_APP_BACKEND_URL")).rstrip("/")
MONGO_URL = be.get("MONGO_URL")
DB_NAME = be.get("DB_NAME")

USER = {"email": "amico2@mikilab.de", "password": "Test1234!"}
HONOR = ["whatsapp_share", "fb_comment", "share_group", "leave_review"]
INTERNAL = ["post_recipe_question", "add_2_colleagues", "upload_dough_photo", "reply_user"]


@pytest.fixture(scope="module")
def mongo():
    c = MongoClient(MONGO_URL)
    return c[DB_NAME]


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def auth(client, mongo):
    r = client.post(f"{BASE_URL}/api/auth/login", json=USER)
    if r.status_code != 200:
        pytest.fail(f"login failed {r.status_code}: {r.text[:300]}")
    data = r.json()
    token = data.get("session_token") or data.get("token")
    assert token, f"no token in {data}"
    uid = (data.get("user") or {}).get("user_id") or (data.get("user") or {}).get("id")
    # reset clean state for the challenge user
    mongo.user_challenges.delete_many({"user_id": uid})
    mongo.entitlements.delete_many({"email": USER["email"]})
    return {"token": token, "uid": uid, "h": {"Authorization": f"Bearer {token}"}}


# --- catalog ---
def test_catalog_public(client):
    r = client.get(f"{BASE_URL}/api/challenges/catalog")
    assert r.status_code == 200
    cat = r.json()["catalog"]
    assert len(cat) == 8
    ids = [c["id"] for c in cat]
    assert set(ids) == set(HONOR + INTERNAL)
    assert sum(1 for c in cat if c["type"] == "honor") == 4
    assert sum(1 for c in cat if c["type"] == "internal") == 4


def test_state_requires_auth(client):
    r = requests.get(f"{BASE_URL}/api/challenges/state")
    assert r.status_code in (401, 403), r.status_code


# --- state ---
def test_state_clean(client, auth):
    r = client.get(f"{BASE_URL}/api/challenges/state", headers=auth["h"])
    assert r.status_code == 200
    d = r.json()
    assert d["count"] == 0 and d["completed"] == []
    assert d["total"] == 8 and d["need_panettoni"] == 3 and d["need_all"] == 6
    assert d["unlocked_panettoni"] is False and d["unlocked_all"] is False


# --- complete: honor / internal / unknown ---
def test_complete_honor(client, auth):
    r = client.post(f"{BASE_URL}/api/challenges/complete", headers=auth["h"],
                    json={"challenge_id": "whatsapp_share"})
    assert r.status_code == 200, r.text[:300]
    d = r.json()
    assert d["ok"] is True and "whatsapp_share" in d["completed"] and d["count"] == 1
    # persistence
    st = client.get(f"{BASE_URL}/api/challenges/state", headers=auth["h"]).json()
    assert st["count"] == 1 and "whatsapp_share" in st["completed"]


def test_complete_honor_idempotent(client, auth):
    r = client.post(f"{BASE_URL}/api/challenges/complete", headers=auth["h"],
                    json={"challenge_id": "whatsapp_share"})
    assert r.status_code == 200
    assert r.json()["count"] == 1


def test_complete_internal_unmet_returns_400(client, auth):
    r = client.post(f"{BASE_URL}/api/challenges/complete", headers=auth["h"],
                    json={"challenge_id": "add_2_colleagues"})
    assert r.status_code == 400, f"expected 400, got {r.status_code}: {r.text[:200]}"
    assert "detail" in r.json()


def test_complete_unknown_id(client, auth):
    r = client.post(f"{BASE_URL}/api/challenges/complete", headers=auth["h"],
                    json={"challenge_id": "bogus_xyz"})
    assert r.status_code == 400


# --- thresholds ---
def test_threshold_3_grants_academy_and_panettoni(client, auth):
    for cid in ["fb_comment", "share_group"]:
        r = client.post(f"{BASE_URL}/api/challenges/complete", headers=auth["h"], json={"challenge_id": cid})
        assert r.status_code == 200, r.text[:200]
    d = r.json()
    assert d["count"] == 3 and d["unlocked_panettoni"] is True and d["unlocked_all"] is False
    s = client.get(f"{BASE_URL}/api/subscription/status", headers=auth["h"])
    assert s.status_code == 200
    sd = s.json()
    assert sd["academy"] is True, sd
    assert sd["unlock_panettoni"] is True, sd
    assert sd["unlock_all"] is False, sd
    assert sd.get("pro") is False, sd


def test_threshold_6_grants_pro_and_unlock_all(client, auth, mongo):
    # 4th honor challenge -> 4; then satisfy 2 internal via community post + photo post
    r = client.post(f"{BASE_URL}/api/challenges/complete", headers=auth["h"], json={"challenge_id": "leave_review"})
    assert r.status_code == 200 and r.json()["count"] == 4

    p = client.post(f"{BASE_URL}/api/community/posts", headers=auth["h"],
                    json={"text": "TEST_iter96 sfida post", "image_url": "https://example.com/TEST_iter96.jpg"})
    assert p.status_code in (200, 201), f"post create failed {p.status_code}: {p.text[:200]}"
    post_id = p.json().get("id") or p.json().get("post", {}).get("id")

    for cid in ["post_recipe_question", "upload_dough_photo"]:
        r = client.post(f"{BASE_URL}/api/challenges/complete", headers=auth["h"], json={"challenge_id": cid})
        assert r.status_code == 200, f"{cid}: {r.status_code} {r.text[:200]}"
    d = r.json()
    assert d["count"] == 6, d
    assert d["unlocked_all"] is True, d

    s = client.get(f"{BASE_URL}/api/subscription/status", headers=auth["h"]).json()
    assert s["pro"] is True, s
    assert s["unlock_all"] is True, s
    assert s["academy"] is True, s

    # cleanup created post
    if post_id:
        client.delete(f"{BASE_URL}/api/community/posts/{post_id}", headers=auth["h"])
        mongo.community_posts.delete_many({"id": post_id})


# --- content access gating ---
def test_content_access(client, auth):
    r = client.get(f"{BASE_URL}/api/content/access/panettone_1", headers=auth["h"])
    assert r.status_code == 200, r.text[:200]
    assert "unlocked" in r.json()
