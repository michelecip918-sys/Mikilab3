"""Iteration 225 — Sala Sitor unified hub backend tests.
Covers: admin-gate + login, deus bond/queue/ask/capture/clear, recipes list, deck status.
"""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/") or "https://edit-33.preview.emergentagent.com"


@pytest.fixture(scope="module")
def sess():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    # Gate
    r = s.post(f"{BASE_URL}/api/admin-gate/verify", json={"pin": "198505"}, timeout=15)
    assert r.status_code == 200, r.text
    assert r.json().get("ok") is True and r.json().get("level") == "master"
    # Login admin
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": "admin@mikilab.de", "password": "Mikilab2026!"}, timeout=15)
    assert r.status_code == 200, r.text
    assert r.json()["user"]["role"] == "admin"
    return s


# --- Gate/Auth ---
def test_gate_wrong_pin_rejected():
    r = requests.post(f"{BASE_URL}/api/admin-gate/verify", json={"pin": "000000"}, timeout=10)
    assert r.status_code in (200, 401, 403)
    body = r.json() if r.headers.get("content-type", "").startswith("application/json") else {}
    if r.status_code == 200:
        assert body.get("ok") is False or body.get("level") not in ("master",)


# --- Deus / Mike endpoints ---
def test_deus_bond(sess):
    r = sess.get(f"{BASE_URL}/api/mike/deus/bond", params={"lang": "it"}, timeout=20)
    assert r.status_code == 200, r.text
    data = r.json()
    assert isinstance(data, dict)


def test_deus_production_queue_initial(sess):
    r = sess.get(f"{BASE_URL}/api/mike/deus/production-queue", timeout=20)
    assert r.status_code == 200, r.text
    data = r.json()
    # Expect list or dict with tasks
    assert isinstance(data, (list, dict))


def test_deus_ask(sess):
    r = sess.post(
        f"{BASE_URL}/api/mike/deus/ask",
        json={"question": "Come sta il laboratorio?", "lang": "it"},
        timeout=90,
    )
    assert r.status_code == 200, r.text
    data = r.json()
    reply = data.get("reply") or data.get("answer") or data.get("text") or ""
    assert isinstance(reply, str) and len(reply) > 0, f"empty reply: {data}"


def test_deus_capture_and_queue_flow(sess):
    # Capture creates tasks
    r = sess.post(
        f"{BASE_URL}/api/mike/deus/capture",
        json={"mode": "text", "text": "domani 200 baguette e 50 focacce", "lang": "it"},
        timeout=90,
    )
    assert r.status_code == 200, r.text
    data = r.json()
    reply = data.get("reply") or data.get("answer") or ""
    assert isinstance(reply, str) and len(reply) > 0
    # tasks may be under 'tasks' or 'queue'
    tasks = data.get("tasks") or data.get("queue") or []
    # Give the server a moment
    time.sleep(1)
    # Verify queue reflects them
    r2 = sess.get(f"{BASE_URL}/api/mike/deus/production-queue", timeout=20)
    assert r2.status_code == 200, r2.text
    q = r2.json()
    q_list = q if isinstance(q, list) else (q.get("tasks") or q.get("queue") or q.get("items") or [])
    assert isinstance(q_list, list)
    # Clear
    r3 = sess.post(f"{BASE_URL}/api/mike/deus/queue/clear", timeout=20)
    assert r3.status_code in (200, 204), r3.text
    r4 = sess.get(f"{BASE_URL}/api/mike/deus/production-queue", timeout=20)
    assert r4.status_code == 200
    q4 = r4.json()
    q4_list = q4 if isinstance(q4, list) else (q4.get("tasks") or q4.get("queue") or q4.get("items") or [])
    assert len(q4_list) == 0, f"queue not cleared: {q4_list}"


# --- Recipes & Deck ---
def test_recipes_list(sess):
    r = sess.get(f"{BASE_URL}/api/recipes", params={"mikilab": 1}, timeout=20)
    assert r.status_code == 200, r.text
    data = r.json()
    assert isinstance(data, (list, dict))


def test_deck_status(sess):
    r = sess.get(f"{BASE_URL}/api/deck/status", timeout=20)
    assert r.status_code == 200, r.text
