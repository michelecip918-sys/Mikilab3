# ============================================================================
#  MIKILAB PRO & BakoMix AI — PROPRIETARY & CONFIDENTIAL
#  (c) 2026 MikiLab Pro. Tutti i diritti riservati / All rights reserved.
#  Unico proprietario legale: il Master. Sole legal owner: the Master.
#  Codice riservato: vietata copia, distribuzione, reverse engineering o
#  cloning non autorizzati. Unauthorized copying, distribution, reverse
#  engineering or cloning is strictly prohibited and actively tracked by
#  the BakoMix AI Security Guardian.
# ============================================================================
"""Iteration 177 — floor-plan endpoints (Assistente Mamo shared plan)."""
import os
import re
from pathlib import Path

import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
base_url = os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")
if not base_url:
    raise RuntimeError("REACT_APP_BACKEND_URL is missing")
BASE_URL = base_url.rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def creds():
    content = Path("/app/memory/test_credentials.md").read_text(encoding="utf-8")
    m = re.search(r"(\S+@mikilab\.de)\s*/\s*(Mikilab2026!)", content)
    if not m:
        pytest.skip("admin creds not found")
    return {"email": m.group(1), "password": m.group(2)}


@pytest.fixture(scope="module")
def anon():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def admin(creds):
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(f"{API}/auth/login", json=creds, timeout=30)
    if r.status_code != 200:
        pytest.fail(f"admin login failed {r.status_code}: {r.text[:300]}")
    assert any("session" in c.name or "token" in c.name for c in s.cookies), \
        f"no session cookie set on login: {[c.name for c in s.cookies]}"
    return s


class TestFloorPlan:
    def test_00_clear_state_with_auth(self, admin):
        r = admin.delete(f"{API}/lab/floor-plan", timeout=30)
        assert r.status_code == 200, r.text[:300]

    def test_01_get_public_returns_null_when_empty(self, anon):
        r = anon.get(f"{API}/lab/floor-plan", timeout=30)
        assert r.status_code == 200, r.text[:300]
        assert r.json() is None

    def test_02_put_without_auth_401(self, anon):
        r = anon.put(f"{API}/lab/floor-plan", json={"plan": "TEST_hack", "title": "x", "lang": "it"}, timeout=30)
        assert r.status_code == 401, f"expected 401 got {r.status_code}: {r.text[:200]}"

    def test_03_delete_without_auth_401(self, anon):
        r = anon.delete(f"{API}/lab/floor-plan", timeout=30)
        assert r.status_code == 401, f"expected 401 got {r.status_code}: {r.text[:200]}"

    def test_04_put_with_auth_and_get_reflects(self, admin, anon):
        payload = {"plan": "TEST_1. Impasta 10kg\n2. Forno 240C\n3. Sforna", "title": "TEST_Piano", "lang": "de"}
        r = admin.put(f"{API}/lab/floor-plan", json=payload, timeout=30)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        assert d["plan"] == payload["plan"]
        assert d["title"] == "TEST_Piano"
        assert d["lang"] == "de"
        assert isinstance(d.get("pushed_by"), str) and d["pushed_by"]
        assert isinstance(d.get("pushed_at"), str) and d["pushed_at"]
        assert "_id" not in d and "_key" not in d

        g = anon.get(f"{API}/lab/floor-plan", timeout=30)
        assert g.status_code == 200
        gd = g.json()
        assert gd["plan"] == payload["plan"]
        assert gd["title"] == "TEST_Piano"
        assert gd["lang"] == "de"
        assert gd["pushed_by"] == d["pushed_by"]
        assert "_id" not in gd and "_key" not in gd

    def test_05_put_is_singleton_upsert(self, admin, anon):
        r = admin.put(f"{API}/lab/floor-plan", json={"plan": "TEST_second plan", "title": "TEST_2"}, timeout=30)
        assert r.status_code == 200
        assert r.json()["lang"] == "it"  # default when omitted
        gd = anon.get(f"{API}/lab/floor-plan", timeout=30).json()
        assert gd["plan"] == "TEST_second plan"
        assert gd["title"] == "TEST_2"

    def test_06_invalid_lang_falls_back_to_it(self, admin):
        r = admin.put(f"{API}/lab/floor-plan", json={"plan": "TEST_x", "lang": "zz"}, timeout=30)
        assert r.status_code == 200
        assert r.json()["lang"] == "it"

    def test_07_missing_plan_validation(self, admin):
        r = admin.put(f"{API}/lab/floor-plan", json={"title": "no plan"}, timeout=30)
        assert r.status_code in (400, 422), f"expected validation error, got {r.status_code}"

    def test_08_delete_with_auth_clears(self, admin, anon):
        r = admin.delete(f"{API}/lab/floor-plan", timeout=30)
        assert r.status_code == 200
        assert r.json().get("success") is True
        g = anon.get(f"{API}/lab/floor-plan", timeout=30)
        assert g.status_code == 200
        assert g.json() is None


class TestOrdiniExtraAI:
    """AI plan regeneration used by Ordini Extra (Capo only)."""

    def test_ordini_extra_requires_auth_or_works(self, admin):
        r = admin.post(f"{API}/lab/ordini-extra", json={"orders": "TEST_ 20 focacce extra per le 11", "current_plan": "", "lang": "it"}, timeout=180)
        assert r.status_code == 200, f"{r.status_code}: {r.text[:400]}"
        d = r.json()
        assert isinstance(d, dict)
        plan = d.get("plan") or d.get("text") or ""
        assert isinstance(plan, str) and len(plan) > 20, f"empty AI plan: {d}"
