# ============================================================================
#  MIKILAB PRO & BakoMix AI — PROPRIETARY & CONFIDENTIAL
#  (c) 2026 MikiLab Pro. Tutti i diritti riservati / All rights reserved.
#  Unico proprietario legale: il Master. Sole legal owner: the Master.
#  Codice riservato: vietata copia, distribuzione, reverse engineering o
#  cloning non autorizzati. Unauthorized copying, distribution, reverse
#  engineering or cloning is strictly prohibited and actively tracked by
#  the BakoMix AI Security Guardian.
# ============================================================================
"""Iteration 21 — Blindatura server-side API PRO, ricette 'assaggio', admin coupon/VIP, reset password."""
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


def _login(creds):
    r = requests.post(f"{API}/auth/login", json=creds, timeout=30)
    assert r.status_code == 200, f"login failed {r.status_code} {r.text[:300]}"
    data = r.json()
    token = data.get("session_token") or data.get("token")
    assert token, f"no token in login response: {data}"
    return token


@pytest.fixture(scope="module")
def admin_token():
    return _login(ADMIN)


@pytest.fixture(scope="module")
def user_token():
    return _login(USER)


def H(tok):
    return {"Authorization": f"Bearer {tok}"}


# --- BLINDATURA: anonimo ---------------------------------------------------
class TestAnonBlindatura:
    def test_vision_requires_auth(self):
        r = requests.post(f"{API}/maestro/vision", json={"image_base64": "x", "question": "?"}, timeout=30)
        assert r.status_code == 401, f"expected 401 got {r.status_code}: {r.text[:200]}"

    def test_scan_recipe_requires_auth(self):
        r = requests.post(f"{API}/maestro/scan-recipe", json={"image_base64": "x"}, timeout=30)
        assert r.status_code == 401, f"expected 401 got {r.status_code}: {r.text[:200]}"

    def test_capo_plan_pro_forbidden(self):
        payload = {"mode": "pro", "goal": "test", "lang": "it"}
        r = requests.post(f"{API}/capo/plan", json=payload, timeout=60)
        assert r.status_code == 403, f"expected 403 got {r.status_code}: {r.text[:300]}"

    def test_capo_plan_home_public(self):
        payload = {"mode": "home", "goal": "pane semplice per 2 persone", "lang": "it"}
        r = requests.post(f"{API}/capo/plan", json=payload, timeout=180)
        assert r.status_code == 200, f"expected 200 got {r.status_code}: {r.text[:300]}"

    def test_subscription_status_anon(self):
        r = requests.get(f"{API}/subscription/status", timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert d["pro"] is False
        assert d["is_admin"] is False

    def test_admin_endpoints_require_auth(self):
        r = requests.get(f"{API}/admin/entitlements", timeout=30)
        assert r.status_code == 401, f"expected 401 got {r.status_code}"


# --- BLINDATURA: utente non-PRO -------------------------------------------
class TestNonProUser:
    def test_status_not_pro(self, user_token):
        r = requests.get(f"{API}/subscription/status", headers=H(user_token), timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert d["is_admin"] is False, d
        # potrebbe essere PRO se una prova/VIP e' attiva da test precedenti
        print("non-pro user status:", d)

    def test_vision_403_when_not_pro(self, user_token):
        st = requests.get(f"{API}/subscription/status", headers=H(user_token), timeout=30).json()
        r = requests.post(f"{API}/maestro/vision", json={"image_base64": "x", "question": "?"},
                          headers=H(user_token), timeout=60)
        if st.get("pro"):
            pytest.skip(f"utente ha PRO attivo ({st.get('source')}), 403 non applicabile")
        assert r.status_code == 403, f"expected 403 got {r.status_code}: {r.text[:200]}"

    def test_admin_endpoint_403_for_user(self, user_token):
        r = requests.get(f"{API}/admin/entitlements", headers=H(user_token), timeout=30)
        assert r.status_code == 403, f"expected 403 got {r.status_code}"


# --- ADMIN è sempre PRO ----------------------------------------------------
class TestAdminPro:
    def test_status_admin(self, admin_token):
        r = requests.get(f"{API}/subscription/status", headers=H(admin_token), timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert d["pro"] is True, d
        assert d["is_admin"] is True, d

    def test_vision_works_for_admin(self, admin_token):
        # 1x1 png
        img = ("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/"
               "q842iQAAAABJRU5ErkJggg==")
        r = requests.post(f"{API}/maestro/vision",
                          json={"mode": "difetti", "image_base64": img, "lang": "it"},
                          headers=H(admin_token), timeout=180)
        assert r.status_code == 200, f"expected 200 got {r.status_code}: {r.text[:300]}"


# --- RICETTE ASSAGGIO ------------------------------------------------------
class TestTeaserRecipes:
    def test_anon_recipes_locked(self):
        r = requests.get(f"{API}/recipes", params={"collection_name": "mikilab"}, timeout=60)
        assert r.status_code == 200, r.text[:200]
        docs = r.json()
        assert isinstance(docs, list) and len(docs) > 0, "nessuna ricetta mikilab"
        for d in docs:
            assert d.get("locked") is True, f"{d.get('name')} not locked"
            assert not d.get("procedure"), f"{d.get('name')} procedure leaked"
            assert d.get("extra_ingredients") == [], f"{d.get('name')} extra leaked"
            assert d.get("work_phases") == [], f"{d.get('name')} work_phases leaked"
            assert "_id" not in d
            assert d.get("name"), "nome mancante nel teaser"

    def test_admin_recipes_full(self, admin_token):
        r = requests.get(f"{API}/recipes", params={"collection_name": "mikilab"},
                         headers=H(admin_token), timeout=60)
        assert r.status_code == 200
        docs = r.json()
        assert len(docs) > 0
        assert not any(d.get("locked") for d in docs), "admin vede ricette locked"
        assert any(d.get("procedure") for d in docs), "nessuna procedure per admin"


# --- ADMIN COUPON / VIP ----------------------------------------------------
TEST_EMAIL = "test_vip_iter21@example.com"


class TestAdminGrantRevoke:
    def test_grant_and_list(self, admin_token):
        r = requests.post(f"{API}/admin/grant", json={"email": TEST_EMAIL, "days": 7},
                          headers=H(admin_token), timeout=30)
        assert r.status_code == 200, r.text[:200]
        assert r.json()["email"] == TEST_EMAIL
        assert r.json()["expires_at"]

        lst = requests.get(f"{API}/admin/entitlements", headers=H(admin_token), timeout=30).json()
        row = next((e for e in lst if e["email"] == TEST_EMAIL), None)
        assert row is not None, "grant non persistito"
        assert row["active"] is True and row["pro"] is True
        assert row["source"] == "vip"

    def test_grant_invalid_email(self, admin_token):
        r = requests.post(f"{API}/admin/grant", json={"email": "notanemail"},
                          headers=H(admin_token), timeout=30)
        assert r.status_code == 400

    def test_revoke(self, admin_token):
        r = requests.post(f"{API}/admin/revoke", json={"email": TEST_EMAIL},
                          headers=H(admin_token), timeout=30)
        assert r.status_code == 200
        lst = requests.get(f"{API}/admin/entitlements", headers=H(admin_token), timeout=30).json()
        row = next((e for e in lst if e["email"] == TEST_EMAIL), None)
        assert row is not None
        assert row["pro"] is False and row["active"] is False

    def test_grant_unlimited(self, admin_token):
        r = requests.post(f"{API}/admin/grant", json={"email": TEST_EMAIL, "days": None},
                          headers=H(admin_token), timeout=30)
        assert r.status_code == 200
        assert r.json().get("expires_at") in (None, "")
        requests.post(f"{API}/admin/revoke", json={"email": TEST_EMAIL},
                      headers=H(admin_token), timeout=30)


# --- TRIAL -----------------------------------------------------------------
class TestTrial:
    def test_trial_requires_auth(self):
        r = requests.post(f"{API}/trial/activate", json={"hours": 1}, timeout=30)
        assert r.status_code == 401

    def test_trial_activate_or_already_used(self, user_token):
        r = requests.post(f"{API}/trial/activate", json={"hours": 1}, headers=H(user_token), timeout=30)
        assert r.status_code in (200, 400), f"{r.status_code} {r.text[:200]}"
        if r.status_code == 200:
            assert r.json()["pro"] is True
            assert r.json()["source"] == "trial"
            st = requests.get(f"{API}/subscription/status", headers=H(user_token), timeout=30).json()
            assert st["pro"] is True and st["trial_used"] is True
        else:
            assert "già" in r.text or "gia" in r.text.lower()
        # seconda attivazione deve fallire
        r2 = requests.post(f"{API}/trial/activate", json={"hours": 24}, headers=H(user_token), timeout=30)
        assert r2.status_code == 400


# --- CHECKOUT --------------------------------------------------------------
class TestCheckout:
    def test_checkout_requires_auth(self):
        r = requests.post(f"{API}/subscription/checkout",
                          json={"plan": "monthly", "origin_url": BASE_URL}, timeout=30)
        assert r.status_code == 401

    def test_checkout_returns_url(self, admin_token):
        r = requests.post(f"{API}/subscription/checkout",
                          json={"plan": "monthly", "origin_url": BASE_URL},
                          headers=H(admin_token), timeout=60)
        assert r.status_code == 200, f"{r.status_code} {r.text[:300]}"
        d = r.json()
        assert d.get("url", "").startswith("http"), d


# --- RESET PASSWORD --------------------------------------------------------
class TestPasswordReset:
    def test_forgot_password_always_ok(self):
        r = requests.post(f"{API}/auth/forgot-password",
                          json={"email": "nonexistent_iter21@example.com",
                                "origin_url": BASE_URL, "lang": "it"}, timeout=60)
        assert r.status_code == 200, r.text[:300]
        assert r.json().get("ok") is True

    def test_forgot_password_real_user(self):
        r = requests.post(f"{API}/auth/forgot-password",
                          json={"email": USER["email"], "origin_url": BASE_URL, "lang": "it"}, timeout=60)
        assert r.status_code == 200, r.text[:300]
        assert r.json().get("ok") is True

    def test_reset_invalid_token(self):
        r = requests.post(f"{API}/auth/reset-password",
                          json={"token": "TOKENFINTO", "password": "Nuova123!"}, timeout=30)
        assert r.status_code in (400, 404), f"{r.status_code} {r.text[:200]}"

    def test_credentials_still_valid_after_forgot(self):
        # la password non deve cambiare per un forgot
        assert _login(USER)
