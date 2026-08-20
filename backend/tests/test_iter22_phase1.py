"""Iteration 22 — FASE 1: demo recipes unlocked for anonymous/non-PRO, PRO/admin full access."""
import os
import requests
import pytest
from dotenv import dotenv_values

fe = dotenv_values("/app/frontend/.env")
BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or fe.get("REACT_APP_BACKEND_URL")).rstrip("/")

DEMO = {"Cuore Italiano", "Panettone Mikilab — Uvetta e Canditi (Classico)"}
ADMIN = {"email": "admin@mikilab.de", "password": "Mikilab2026!"}
USER = {"email": "fornaio@mikilab.de", "password": "Mikilab2026!"}


def _login(creds):
    r = requests.post(f"{BASE_URL}/api/auth/login", json=creds, timeout=30)
    assert r.status_code == 200, f"login failed {r.status_code} {r.text[:300]}"
    tok = r.json().get("session_token") or r.json().get("token")
    assert tok, f"no token in {r.json()}"
    return {"Authorization": f"Bearer {tok}"}


def _recipes(headers=None):
    r = requests.get(f"{BASE_URL}/api/recipes", params={"collection_name": "mikilab"},
                     headers=headers or {}, timeout=60)
    assert r.status_code == 200, f"{r.status_code} {r.text[:300]}"
    return r.json()


class TestDemoRecipes:
    def test_anonymous_two_demo_unlocked(self):
        docs = _recipes()
        assert isinstance(docs, list) and len(docs) > 10
        unlocked = [d for d in docs if not d.get("locked")]
        locked = [d for d in docs if d.get("locked")]
        names = {d["name"] for d in unlocked}
        assert names == DEMO, f"unlocked names={names}"
        assert len(locked) == len(docs) - 2
        print(f"total={len(docs)} unlocked={len(unlocked)} locked={len(locked)}")

    def test_demo_recipes_have_full_content(self):
        docs = _recipes()
        demo = [d for d in docs if d["name"] in DEMO]
        assert len(demo) == 2
        for d in demo:
            assert not d.get("locked")
            has_proc = bool(d.get("procedure")) or bool(d.get("work_phases")) or bool(d.get("steps"))
            assert has_proc, f"{d['name']} has no procedure/work_phases: keys={list(d.keys())}"

    def test_locked_recipes_hide_procedure(self):
        docs = _recipes()
        locked = [d for d in docs if d.get("locked")]
        assert locked
        for d in locked[:5]:
            assert not d.get("procedure"), f"{d['name']} leaks procedure"
            assert not d.get("work_phases"), f"{d['name']} leaks work_phases"

    def test_nonpro_user_same_as_anonymous(self):
        h = _login(USER)
        docs = _recipes(h)
        unlocked = {d["name"] for d in docs if not d.get("locked")}
        assert unlocked == DEMO, f"non-PRO unlocked={unlocked}"

    def test_admin_sees_all_unlocked(self):
        h = _login(ADMIN)
        docs = _recipes(h)
        locked = [d["name"] for d in docs if d.get("locked")]
        assert locked == [], f"admin should see all unlocked, locked={locked[:5]}"

    def test_admin_subscription_status_pro(self):
        h = _login(ADMIN)
        r = requests.get(f"{BASE_URL}/api/subscription/status", headers=h, timeout=30)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        assert d.get("pro") is True and d.get("is_admin") is True, d

    def test_nonpro_subscription_status(self):
        h = _login(USER)
        r = requests.get(f"{BASE_URL}/api/subscription/status", headers=h, timeout=30)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        assert d.get("is_admin") is False
        print(f"fornaio status: {d}")

    def test_no_mongo_object_id(self):
        docs = _recipes()
        assert all("_id" not in d for d in docs)
