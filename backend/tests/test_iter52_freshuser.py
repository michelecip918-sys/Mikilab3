"""Iteration 52 — gating diagnosi/ricette per un utente NUOVO senza entitlement."""
import base64
import os
import uuid

import pytest
import requests
from dotenv import dotenv_values

BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL")
            or dotenv_values("/app/frontend/.env").get("REACT_APP_BACKEND_URL")).rstrip("/")
API = BASE_URL + "/api"
TINY_PNG = base64.b64encode(bytes.fromhex(
    "89504e470d0a1a0a0000000d4948445200000001000000010806000000"
    "1f15c4890000000a49444154789c6360000002000154a24f5f0000000049454e44ae426082"
)).decode()


@pytest.fixture(scope="module")
def fresh():
    email = f"test_{uuid.uuid4().hex[:8]}@mikilab.test"
    r = requests.post(f"{API}/auth/register", json={"email": email, "password": "Test1234!", "name": "TEST_user"}, timeout=30)
    assert r.status_code == 200, r.text[:200]
    return {"email": email, "token": r.json()["session_token"]}


def test_fresh_user_status(fresh):
    d = requests.get(f"{API}/subscription/status", headers={"Authorization": f"Bearer {fresh['token']}"}, timeout=30).json()
    assert d["pro"] is False and d["academy"] is False and d["plan_tier"] is None
    assert d["diagnosi_limit"] == 0, d


def test_fresh_user_diagnosi_403(fresh):
    r = requests.post(f"{API}/maestro/vision", json={"mode": "difetti", "image_base64": TINY_PNG, "lang": "it"},
                      headers={"Authorization": f"Bearer {fresh['token']}"}, timeout=60, stream=True)
    code = r.status_code
    r.close()
    assert code == 403, f"expected 403, got {code}"


def test_fresh_user_recipes_locked(fresh):
    docs = requests.get(f"{API}/recipes?collection_name=mikilab",
                        headers={"Authorization": f"Bearer {fresh['token']}"}, timeout=60).json()
    demo = {"Cuore Italiano", "Panettone Artigianale MikiLab — Uvetta e Canditi (Classico)"}
    assert all(d.get("locked") for d in docs if d["name"] not in demo)
    assert all(not d.get("locked") for d in docs if d["name"] in demo)


def test_cleanup(fresh):
    from pymongo import MongoClient
    c = MongoClient(os.environ.get("MONGO_URL") or dotenv_values("/app/backend/.env")["MONGO_URL"])
    db = c[dotenv_values("/app/backend/.env")["DB_NAME"]]
    db.users.delete_many({"email": fresh["email"]})
    db.entitlements.delete_many({"email": fresh["email"]})
    assert db.users.count_documents({"email": fresh["email"]}) == 0
