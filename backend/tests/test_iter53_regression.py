# ============================================================================
#  MIKILAB PRO & BakoMix AI — PROPRIETARY & CONFIDENTIAL
#  (c) 2026 MikiLab Pro. Tutti i diritti riservati / All rights reserved.
#  Unico proprietario legale: il Master. Sole legal owner: the Master.
#  Codice riservato: vietata copia, distribuzione, reverse engineering o
#  cloning non autorizzati. Unauthorized copying, distribution, reverse
#  engineering or cloning is strictly prohibited and actively tracked by
#  the BakoMix AI Security Guardian.
# ============================================================================
"""Iterazione 53 — regressione: monetizzazione multi-tier, legale, sicurezza."""
import os
import pytest
import requests
from dotenv import dotenv_values

fe = dotenv_values("/app/frontend/.env")
BASE = (os.environ.get("REACT_APP_BACKEND_URL") or fe.get("REACT_APP_BACKEND_URL")).rstrip("/")
API = f"{BASE}/api"

ADMIN = {"email": "admin@mikilab.de", "password": "Mikilab2026!"}
USER = {"email": "fornaio@mikilab.de", "password": "Mikilab2026!"}


def login(creds):
    r = requests.post(f"{API}/auth/login", json=creds, timeout=30)
    assert r.status_code == 200, f"login {creds['email']} -> {r.status_code} {r.text[:300]}"
    tok = r.json().get("session_token") or r.json().get("token")
    assert tok
    return tok


@pytest.fixture(scope="module")
def admin_h():
    return {"Authorization": f"Bearer {login(ADMIN)}"}


@pytest.fixture(scope="module")
def user_h():
    return {"Authorization": f"Bearer {login(USER)}"}


# --- Monetizzazione ---------------------------------------------------------
class TestSubscription:
    def test_anon_status(self):
        r = requests.get(f"{API}/subscription/status", timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert d["pro"] is False
        assert d["academy"] is False
        assert d["plan_tier"] is None
        assert d["diagnosi_limit"] == 0

    def test_grant_home_then_status(self, admin_h, user_h):
        g = requests.post(f"{API}/admin/grant", json={"email": USER["email"], "tier": "home", "days": 30},
                          headers=admin_h, timeout=30)
        assert g.status_code == 200, g.text[:300]
        s = requests.get(f"{API}/subscription/status", headers=user_h, timeout=30)
        assert s.status_code == 200
        d = s.json()
        assert d["pro"] is False, d
        assert d["academy"] is True, d
        assert d["plan_tier"] == "home", d
        assert d["diagnosi_limit"] == 10, d

    def test_revoke_clears(self, admin_h, user_h):
        r = requests.post(f"{API}/admin/revoke", json={"email": USER["email"]}, headers=admin_h, timeout=30)
        assert r.status_code == 200
        d = requests.get(f"{API}/subscription/status", headers=user_h, timeout=30).json()
        assert d["academy"] is False, d
        assert d["plan_tier"] is None, d
        assert d["diagnosi_limit"] == 0, d

    @pytest.mark.parametrize("tier", ["home", "lab"])
    def test_checkout_subscription(self, user_h, tier):
        r = requests.post(f"{API}/subscription/checkout",
                          json={"plan": "monthly", "tier": tier, "origin_url": BASE},
                          headers=user_h, timeout=60)
        assert r.status_code == 200, r.text[:300]
        url = r.json().get("url", "")
        assert "checkout.stripe.com" in url or "cs_test" in url, url

    def test_recipe_checkout_single(self, user_h):
        rl = requests.get(f"{API}/recipes", headers=user_h, timeout=30)
        assert rl.status_code == 200
        mikilab = [x for x in rl.json() if x.get("kind") == "mikilab" or x.get("source") == "mikilab"]
        rid = (mikilab or rl.json())[0]["id"]
        r = requests.post(f"{API}/recipe/checkout",
                          json={"kind": "single", "recipe_id": rid, "origin_url": BASE},
                          headers=user_h, timeout=60)
        assert r.status_code == 200, r.text[:300]
        assert "stripe" in r.json().get("url", "")

    def test_recipe_checkout_single_missing_id(self, user_h):
        r = requests.post(f"{API}/recipe/checkout", json={"kind": "single", "origin_url": BASE},
                          headers=user_h, timeout=30)
        assert r.status_code == 400, f"{r.status_code} {r.text[:200]}"


# --- Legale -----------------------------------------------------------------
class TestLegal:
    def test_announcements_clean(self):
        r = requests.get(f"{API}/announcements", timeout=30)
        assert r.status_code == 200
        for a in r.json():
            blob = f"{a.get('title','')} {a.get('details','')}".lower()
            for bad in ["stoccarda", "stuttgart", "cannstatt"]:
                assert bad not in blob, f"{bad} in {a.get('title')}"

    def test_news_no_stoccarda_region(self):
        r = requests.get(f"{API}/news", timeout=30)
        assert r.status_code == 200
        regions = {n.get("region") for n in r.json()}
        assert "stoccarda" not in regions, regions


# --- Sicurezza --------------------------------------------------------------
class TestSecurity:
    def test_post_oven_profiles_anon_401(self):
        r = requests.post(f"{API}/oven-profiles", json={"name": "TEST_anon"}, timeout=30)
        assert r.status_code == 401, f"{r.status_code} {r.text[:200]}"

    def test_put_weekly_plan_anon_401(self):
        r = requests.put(f"{API}/weekly-plan", json={"days": []}, timeout=30)
        assert r.status_code == 401, f"{r.status_code} {r.text[:200]}"

    def test_post_announcements_anon_denied(self):
        r = requests.post(f"{API}/announcements", json={"title": "TEST_anon"}, timeout=30)
        assert r.status_code in (401, 403), f"{r.status_code} {r.text[:200]}"

    def test_post_announcements_admin_ok(self, admin_h):
        r = requests.post(f"{API}/announcements", json={"title": "TEST_iter53", "details": "TEST"},
                          headers=admin_h, timeout=30)
        assert r.status_code == 200, r.text[:300]
        aid = r.json()["id"]
        d = requests.delete(f"{API}/announcements/{aid}", headers=admin_h, timeout=30)
        assert d.status_code in (200, 204)

    def test_put_weekly_plan_admin_ok(self, admin_h):
        r = requests.put(f"{API}/weekly-plan", json={"days": []}, headers=admin_h, timeout=30)
        assert r.status_code == 200, r.text[:300]


# --- Cleanup ----------------------------------------------------------------
def test_zz_cleanup_revoke_fornaio(admin_h, user_h):
    requests.post(f"{API}/admin/revoke", json={"email": USER["email"]}, headers=admin_h, timeout=30)
    d = requests.get(f"{API}/subscription/status", headers=user_h, timeout=30).json()
    assert d["academy"] is False and d["pro"] is False
