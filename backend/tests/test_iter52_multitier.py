"""Iteration 52 — Monetizzazione multi-tier (LAB/HOME), diagnosi gating,
acquisto singolo ricette, pulizia legale (no 'Stoccarda')."""
import base64
import os

import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
base_url = os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")
if not base_url:
    raise RuntimeError("REACT_APP_BACKEND_URL missing")
BASE_URL = base_url.rstrip("/")
API = BASE_URL + "/api"

ADMIN = {"email": "admin@mikilab.de", "password": "Mikilab2026!"}
USER = {"email": "fornaio@mikilab.de", "password": "Mikilab2026!"}
ORIGIN = BASE_URL

# 1x1 png
TINY_PNG = base64.b64encode(bytes.fromhex(
    "89504e470d0a1a0a0000000d4948445200000001000000010806000000"
    "1f15c4890000000a49444154789c6360000002000154a24f5f0000000049454e44ae426082"
)).decode()


def _login(creds):
    r = requests.post(f"{API}/auth/login", json=creds, timeout=30)
    assert r.status_code == 200, f"login failed {r.status_code} {r.text[:200]}"
    return r.json()["session_token"]


def _h(tok):
    return {"Authorization": f"Bearer {tok}"}


@pytest.fixture(scope="module")
def admin_token():
    return _login(ADMIN)


@pytest.fixture(scope="module")
def user_token():
    return _login(USER)


@pytest.fixture(scope="module", autouse=True)
def cleanup(admin_token):
    yield
    requests.post(f"{API}/admin/revoke", json={"email": USER["email"]}, headers=_h(admin_token), timeout=30)


# --- subscription/status ---------------------------------------------------
class TestSubscriptionStatus:
    def test_anon_status(self):
        r = requests.get(f"{API}/subscription/status", timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert d["pro"] is False
        assert d["academy"] is False
        assert d["plan_tier"] is None
        assert d["unlock_all"] is False
        assert d["unlocked_recipes"] == []
        assert d["diagnosi_limit"] == 0, f"anon diagnosi_limit should be 0, got {d['diagnosi_limit']}"

    def test_admin_status_pro(self, admin_token):
        d = requests.get(f"{API}/subscription/status", headers=_h(admin_token), timeout=30).json()
        assert d["pro"] is True and d["is_admin"] is True
        assert d["plan_tier"] == "lab"
        assert d["diagnosi_limit"] is None  # illimitato


# --- admin grant tier home ------------------------------------------------
class TestGrantHomeTier:
    def test_grant_home_then_status(self, admin_token, user_token):
        r = requests.post(f"{API}/admin/grant", json={"email": USER["email"], "tier": "home", "days": 30},
                          headers=_h(admin_token), timeout=30)
        assert r.status_code == 200, r.text[:300]
        assert r.json()["ok"] is True
        d = requests.get(f"{API}/subscription/status", headers=_h(user_token), timeout=30).json()
        assert d["pro"] is False, f"home tier must not be pro: {d}"
        assert d["academy"] is True
        assert d["plan_tier"] == "home"
        assert d["diagnosi_limit"] == 10

    def test_grant_requires_admin(self, user_token):
        r = requests.post(f"{API}/admin/grant", json={"email": "x@y.de", "tier": "lab"},
                          headers=_h(user_token), timeout=30)
        assert r.status_code == 403

    def test_grant_lab_then_pro(self, admin_token, user_token):
        requests.post(f"{API}/admin/grant", json={"email": USER["email"], "tier": "lab", "days": 1},
                      headers=_h(admin_token), timeout=30)
        d = requests.get(f"{API}/subscription/status", headers=_h(user_token), timeout=30).json()
        assert d["pro"] is True and d["plan_tier"] == "lab" and d["diagnosi_limit"] is None
        # restore home for later tests
        requests.post(f"{API}/admin/grant", json={"email": USER["email"], "tier": "home", "days": 30},
                      headers=_h(admin_token), timeout=30)

    def test_revoke_clears_academy(self, admin_token, user_token):
        requests.post(f"{API}/admin/grant", json={"email": USER["email"], "tier": "home", "days": 30},
                      headers=_h(admin_token), timeout=30)
        r = requests.post(f"{API}/admin/revoke", json={"email": USER["email"]}, headers=_h(admin_token), timeout=30)
        assert r.status_code == 200
        d = requests.get(f"{API}/subscription/status", headers=_h(user_token), timeout=30).json()
        assert d["pro"] is False
        assert d["academy"] is False, f"revoke must also clear Academy access, got {d}"
        assert d["plan_tier"] is None


# --- subscription checkout ------------------------------------------------
class TestSubscriptionCheckout:
    @pytest.mark.parametrize("tier,plan", [("home", "monthly"), ("home", "yearly"),
                                           ("lab", "monthly"), ("lab", "yearly")])
    def test_checkout_url(self, user_token, tier, plan):
        r = requests.post(f"{API}/subscription/checkout",
                          json={"plan": plan, "tier": tier, "origin_url": ORIGIN},
                          headers=_h(user_token), timeout=60)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        assert d["url"].startswith("https://checkout.stripe.com"), d["url"]
        assert d["session_id"].startswith("cs_test"), d["session_id"]

    def test_checkout_requires_auth(self):
        r = requests.post(f"{API}/subscription/checkout",
                          json={"plan": "monthly", "tier": "home", "origin_url": ORIGIN}, timeout=30)
        assert r.status_code == 401


# --- recipe single purchase ----------------------------------------------
@pytest.fixture(scope="module")
def mikilab_recipes():
    r = requests.get(f"{API}/recipes?collection_name=mikilab", timeout=60)
    assert r.status_code == 200
    return r.json()


class TestRecipeCheckout:
    def test_single_requires_recipe_id(self, user_token):
        r = requests.post(f"{API}/recipe/checkout", json={"kind": "single", "origin_url": ORIGIN},
                          headers=_h(user_token), timeout=30)
        assert r.status_code == 400, r.text[:200]

    def test_invalid_kind(self, user_token):
        r = requests.post(f"{API}/recipe/checkout", json={"kind": "bogus", "origin_url": ORIGIN},
                          headers=_h(user_token), timeout=30)
        assert r.status_code == 400

    def test_single_unknown_recipe_404(self, user_token):
        r = requests.post(f"{API}/recipe/checkout",
                          json={"kind": "single", "recipe_id": "does-not-exist", "origin_url": ORIGIN},
                          headers=_h(user_token), timeout=30)
        assert r.status_code == 404

    def test_single_checkout_url(self, user_token, mikilab_recipes):
        rid = mikilab_recipes[0]["id"]
        r = requests.post(f"{API}/recipe/checkout",
                          json={"kind": "single", "recipe_id": rid, "origin_url": ORIGIN},
                          headers=_h(user_token), timeout=60)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        assert d["session_id"].startswith("cs_test")
        assert d["url"].startswith("https://checkout.stripe.com")

    @pytest.mark.parametrize("kind", ["panettoni", "all"])
    def test_bundle_checkout_url(self, user_token, kind):
        r = requests.post(f"{API}/recipe/checkout", json={"kind": kind, "origin_url": ORIGIN},
                          headers=_h(user_token), timeout=60)
        assert r.status_code == 200, r.text[:300]
        assert r.json()["session_id"].startswith("cs_test")


# --- teaser / lock logic --------------------------------------------------
DEMO = {"Cuore Italiano", "Panettone Artigianale MikiLab — Uvetta e Canditi (Classico)"}


class TestRecipeLocking:
    def test_anon_sees_locked_except_demo(self, mikilab_recipes):
        assert len(mikilab_recipes) > 3
        for r in mikilab_recipes:
            if r["name"] in DEMO:
                assert not r.get("locked"), f"DEMO recipe should be unlocked: {r['name']}"
                assert (r.get("procedure") or "") != "", f"DEMO must keep procedure: {r['name']}"
            else:
                assert r.get("locked") is True, f"expected locked: {r['name']}"
                assert (r.get("procedure") or "") == ""
                assert r.get("work_phases") in ([], None)

    def test_admin_sees_all_unlocked(self, admin_token):
        docs = requests.get(f"{API}/recipes?collection_name=mikilab", headers=_h(admin_token), timeout=60).json()
        assert all(not d.get("locked") for d in docs)

    def test_unlock_all_via_entitlement(self, admin_token, user_token):
        # grant full lab -> everything unlocked
        requests.post(f"{API}/admin/grant", json={"email": USER["email"], "tier": "lab", "days": 1},
                      headers=_h(admin_token), timeout=30)
        docs = requests.get(f"{API}/recipes?collection_name=mikilab", headers=_h(user_token), timeout=60).json()
        assert all(not d.get("locked") for d in docs)
        requests.post(f"{API}/admin/revoke", json={"email": USER["email"]}, headers=_h(admin_token), timeout=30)

    def test_home_tier_recipes_still_locked(self, admin_token, user_token):
        """tier home = Academy only, il ricettario PRO resta bloccato."""
        requests.post(f"{API}/admin/grant", json={"email": USER["email"], "tier": "home", "days": 30},
                      headers=_h(admin_token), timeout=30)
        docs = requests.get(f"{API}/recipes?collection_name=mikilab", headers=_h(user_token), timeout=60).json()
        locked = [d for d in docs if d.get("locked")]
        assert len(locked) > 0


# --- diagnosi gating ------------------------------------------------------
class TestDiagnosiGating:
    def test_no_access_403(self, admin_token):
        requests.post(f"{API}/admin/revoke", json={"email": USER["email"]}, headers=_h(admin_token), timeout=30)
        tok = _login(USER)
        r = requests.post(f"{API}/maestro/vision",
                          json={"mode": "difetti", "image_base64": TINY_PNG, "lang": "it"},
                          headers=_h(tok), timeout=60, stream=True)
        r.close()
        assert r.status_code == 403, f"non-subscriber must get 403, got {r.status_code}"

    def test_anon_401(self):
        r = requests.post(f"{API}/maestro/vision",
                          json={"mode": "difetti", "image_base64": TINY_PNG, "lang": "it"}, timeout=60, stream=True)
        r.close()
        assert r.status_code == 401

    def test_home_tier_allowed_and_counts(self, admin_token, user_token):
        requests.post(f"{API}/admin/grant", json={"email": USER["email"], "tier": "home", "days": 30},
                      headers=_h(admin_token), timeout=30)
        before = requests.get(f"{API}/subscription/status", headers=_h(user_token), timeout=30).json()["diagnosi_used"]
        r = requests.post(f"{API}/maestro/vision",
                          json={"mode": "difetti", "image_base64": TINY_PNG, "lang": "it"},
                          headers=_h(user_token), timeout=120, stream=True)
        status = r.status_code
        r.close()
        assert status == 200, f"home tier should be allowed, got {status}"
        after = requests.get(f"{API}/subscription/status", headers=_h(user_token), timeout=30).json()["diagnosi_used"]
        assert after == before + 1, f"diagnosi_used {before} -> {after}"


# --- legal cleanup --------------------------------------------------------
class TestLegalCleanup:
    def test_news_regions(self):
        r = requests.get(f"{API}/news", timeout=60)
        assert r.status_code == 200
        items = r.json()
        regions = {i.get("region") for i in items}
        assert "stoccarda" not in regions, f"regions={regions}"
        assert regions <= {"germania", "italia"}, f"unexpected regions {regions}"

    def test_announcements_no_stuttgart(self):
        r = requests.get(f"{API}/announcements", timeout=30)
        assert r.status_code == 200
        blob = str(r.json()).lower()
        assert "stoccarda" not in blob
        assert "stuttgart" not in blob
