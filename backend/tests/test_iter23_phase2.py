# ============================================================================
#  MIKILAB PRO & BakoMix AI — PROPRIETARY & CONFIDENTIAL
#  (c) 2026 MikiLab Pro. Tutti i diritti riservati / All rights reserved.
#  Unico proprietario legale: il Master. Sole legal owner: the Master.
#  Codice riservato: vietata copia, distribuzione, reverse engineering o
#  cloning non autorizzati. Unauthorized copying, distribution, reverse
#  engineering or cloning is strictly prohibited and actively tracked by
#  the BakoMix AI Security Guardian.
# ============================================================================
"""FASE 2 tests: owner admin, real_name recipes, freezer stock + email, shop & waitlist, paywall regression."""
import os
import re
from pathlib import Path

import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
base_url = os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")
if not base_url:
    raise RuntimeError("REACT_APP_BACKEND_URL missing")
BASE_URL = base_url.rstrip("/") + "/api"

ADMIN = {"email": "admin@mikilab.de", "password": "Mikilab2026!"}
USER = {"email": "fornaio@mikilab.de", "password": "Mikilab2026!"}


@pytest.fixture(scope="module")
def anon():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


def _login(creds):
    r = requests.post(f"{BASE_URL}/auth/login", json=creds, timeout=60)
    if r.status_code != 200:
        pytest.fail(f"login failed for {creds['email']}: {r.status_code} {r.text[:300]}")
    tok = r.json().get("session_token")
    assert tok, "no session_token in login response"
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json", "Authorization": f"Bearer {tok}"})
    return s, r.json()


@pytest.fixture(scope="module")
def admin_client():
    s, data = _login(ADMIN)
    return s, data


@pytest.fixture(scope="module")
def user_client():
    s, data = _login(USER)
    return s, data


# --- Owner email = always admin ---------------------------------------------
class TestOwnerAdmin:
    def test_admin_login_role(self, admin_client):
        _, data = admin_client
        assert data["user"]["email"] == ADMIN["email"]
        assert data["user"]["role"] == "admin", f"expected admin role, got {data['user']}"

    def test_subscription_status_admin(self, admin_client):
        s, _ = admin_client
        r = s.get(f"{BASE_URL}/subscription/status", timeout=60)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        assert d["is_admin"] is True, d
        assert d["pro"] is True, d

    def test_auth_me_admin(self, admin_client):
        s, _ = admin_client
        r = s.get(f"{BASE_URL}/auth/me", timeout=60)
        assert r.status_code == 200
        assert r.json()["role"] == "admin"

    def test_regular_user_not_admin(self, user_client):
        s, data = user_client
        assert data["user"]["role"] != "admin"
        r = s.get(f"{BASE_URL}/subscription/status", timeout=60)
        assert r.status_code == 200
        d = r.json()
        assert d["is_admin"] is False, d


# --- real_name on recipes ----------------------------------------------------
class TestRealName:
    def test_recipes_have_real_name_anon(self, anon):
        r = anon.get(f"{BASE_URL}/recipes?collection_name=mikilab", timeout=90)
        assert r.status_code == 200, r.text[:300]
        docs = r.json()
        assert isinstance(docs, list) and len(docs) > 0
        with_real = [d for d in docs if (d.get("real_name") or "").strip()]
        print(f"recipes={len(docs)} with_real_name={len(with_real)}")
        assert len(with_real) >= 15, f"only {len(with_real)} recipes have real_name (of {len(docs)})"

    def test_specific_real_names(self, anon):
        r = anon.get(f"{BASE_URL}/recipes?collection_name=mikilab", timeout=90)
        by_name = {d["name"]: d for d in r.json()}
        expected = {"Oro di Terra": "Pane alle Patate", "Cuore Italiano": "Pane Bianco Italiano"}
        for fancy, real in expected.items():
            assert fancy in by_name, f"recipe '{fancy}' missing. Available: {list(by_name)[:30]}"
            assert by_name[fancy].get("real_name") == real, \
                f"{fancy}: expected real_name '{real}', got '{by_name[fancy].get('real_name')}'"

    def test_real_name_editable_by_admin(self, admin_client):
        s, _ = admin_client
        r = s.get(f"{BASE_URL}/recipes?collection_name=mikilab", timeout=90)
        assert r.status_code == 200
        docs = r.json()
        target = next((d for d in docs if d["name"] == "Oro di Terra"), docs[0])
        rid = target["id"]
        original = target.get("real_name") or ""
        try:
            up = s.put(f"{BASE_URL}/recipes/{rid}", json={"real_name": "TEST_Nome Reale"}, timeout=90)
            assert up.status_code == 200, up.text[:300]
            assert up.json().get("real_name") == "TEST_Nome Reale"
            # verify persistence
            got = s.get(f"{BASE_URL}/recipes?collection_name=mikilab", timeout=90).json()
            fetched = next(d for d in got if d["id"] == rid)
            assert fetched.get("real_name") == "TEST_Nome Reale"
        finally:
            s.put(f"{BASE_URL}/recipes/{rid}", json={"real_name": original}, timeout=90)

    def test_real_name_survives_teaser_for_anon(self, anon):
        r = anon.get(f"{BASE_URL}/recipes?collection_name=mikilab", timeout=90)
        locked = [d for d in r.json() if d.get("locked")]
        assert locked, "expected locked (teaser) recipes for anonymous"
        assert any((d.get("real_name") or "").strip() for d in locked), \
            "locked recipes lost real_name"


# --- Freezer stock ----------------------------------------------------------
class TestFreezer:
    def test_freezer_requires_auth(self, anon):
        r = anon.get(f"{BASE_URL}/freezer", timeout=60)
        assert r.status_code in (401, 403), r.status_code

    def test_freezer_save_low_and_persist(self, admin_client):
        s, _ = admin_client
        payload = {"items": [{"name": "TEST_Panettone", "qty": 2, "min_qty": 10},
                             {"name": "TEST_Focaccia", "qty": 20, "min_qty": 5}]}
        r = s.put(f"{BASE_URL}/freezer?lang=it", json=payload, timeout=90)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        assert d["ok"] is True
        assert len(d["low"]) == 1, d
        assert d["low"][0]["name"] == "TEST_Panettone"
        print(f"emailed={d.get('emailed')}")
        assert d.get("emailed") is True, f"email not sent: {d}"

        g = s.get(f"{BASE_URL}/freezer", timeout=60)
        assert g.status_code == 200
        names = [i["name"] for i in g.json()["items"]]
        assert "TEST_Panettone" in names and "TEST_Focaccia" in names

    def test_freezer_no_low_no_email(self, admin_client):
        s, _ = admin_client
        r = s.put(f"{BASE_URL}/freezer?lang=it", json={"items": [{"name": "TEST_Ok", "qty": 10, "min_qty": 2}]}, timeout=90)
        assert r.status_code == 200
        d = r.json()
        assert d["low"] == []
        assert d["emailed"] is False

    def test_freezer_isolated_per_user(self, user_client, admin_client):
        us, _ = user_client
        r = us.put(f"{BASE_URL}/freezer?lang=it", json={"items": [{"name": "TEST_UserOnly", "qty": 1, "min_qty": 0}]}, timeout=90)
        assert r.status_code == 200
        as_, _ = admin_client
        admin_items = as_.get(f"{BASE_URL}/freezer", timeout=60).json()["items"]
        assert not any(i["name"] == "TEST_UserOnly" for i in admin_items), "freezer data leaked across users"

    def test_freezer_cleanup(self, admin_client, user_client):
        for s, _ in (admin_client, user_client):
            r = s.put(f"{BASE_URL}/freezer?lang=it", json={"items": []}, timeout=90)
            assert r.status_code == 200


# --- Shop & Academy ---------------------------------------------------------
class TestShop:
    def test_shop_products_public(self, anon):
        r = anon.get(f"{BASE_URL}/shop/products", timeout=60)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        assert "enabled" in d and "products" in d
        prods = d["products"]
        assert len(prods) >= 2, prods
        kinds = {p.get("kind") for p in prods}
        assert "panettone" in kinds, kinds
        assert "corso" in kinds, kinds
        for p in prods:
            assert "_id" not in p
            assert p.get("id") and p.get("name")

    def test_waitlist_signup(self, anon):
        r = anon.post(f"{BASE_URL}/shop/waitlist", json={"email": "TEST_qa@mikilab.de", "product_id": None, "lang": "it"}, timeout=60)
        assert r.status_code == 200, r.text[:300]
        assert r.json().get("ok") is True

    def test_waitlist_invalid_email(self, anon):
        r = anon.post(f"{BASE_URL}/shop/waitlist", json={"email": "notanemail", "lang": "it"}, timeout=60)
        print(f"invalid email -> {r.status_code} {r.text[:200]}")
        assert r.status_code in (400, 422), f"invalid email accepted: {r.status_code}"

    def test_admin_shop_settings_toggle(self, admin_client):
        s, _ = admin_client
        g = s.get(f"{BASE_URL}/admin/shop/settings", timeout=60)
        assert g.status_code == 200, g.text[:300]
        d = g.json()
        assert "enabled" in d and "waitlist_count" in d
        assert d["waitlist_count"] >= 1
        original = d["enabled"]
        p = s.put(f"{BASE_URL}/admin/shop/settings", json={"enabled": not original}, timeout=60)
        assert p.status_code == 200, p.text[:300]
        again = s.get(f"{BASE_URL}/admin/shop/settings", timeout=60).json()
        assert again["enabled"] == (not original), again
        # restore
        s.put(f"{BASE_URL}/admin/shop/settings", json={"enabled": original}, timeout=60)
        assert s.get(f"{BASE_URL}/admin/shop/settings", timeout=60).json()["enabled"] == original

    def test_admin_shop_waitlist_list(self, admin_client):
        s, _ = admin_client
        r = s.get(f"{BASE_URL}/admin/shop/waitlist", timeout=60)
        assert r.status_code == 200, r.text[:300]
        rows = r.json() if isinstance(r.json(), list) else r.json().get("rows", [])
        assert any("TEST_qa@mikilab.de".lower() == (x.get("email") or "").lower() for x in rows), rows[:5]
        for x in rows:
            assert "_id" not in x

    def test_admin_shop_endpoints_forbidden_for_user(self, user_client, anon):
        s, _ = user_client
        assert s.get(f"{BASE_URL}/admin/shop/settings", timeout=60).status_code == 403
        assert s.put(f"{BASE_URL}/admin/shop/settings", json={"enabled": True}, timeout=60).status_code == 403
        assert anon.get(f"{BASE_URL}/admin/shop/settings", timeout=60).status_code in (401, 403)


# --- Paywall regression ------------------------------------------------------
class TestPaywallRegression:
    def test_demo_recipes_complete_for_anon(self, anon):
        r = anon.get(f"{BASE_URL}/recipes?collection_name=mikilab", timeout=90)
        docs = r.json()
        demo = [d for d in docs if d["name"] in ("Cuore Italiano", "Panettone Mikilab — Uvetta e Canditi (Classico)")]
        assert len(demo) == 2, [d["name"] for d in docs]
        for d in demo:
            assert not d.get("locked"), f"{d['name']} should be unlocked"
            assert (d.get("procedure") or "").strip(), f"{d['name']} missing procedure"
        others = [d for d in docs if d["name"] not in ("Cuore Italiano", "Panettone Mikilab — Uvetta e Canditi (Classico)")]
        assert all(d.get("locked") for d in others), [d["name"] for d in others if not d.get("locked")]

    def test_pro_endpoint_blocked_for_anon(self, anon):
        r = anon.post(f"{BASE_URL}/maestro/scan-recipe", json={"image_base64": "x"}, timeout=60)
        assert r.status_code in (401, 402, 403, 422), r.status_code

    def test_admin_sees_full_recipes(self, admin_client):
        s, _ = admin_client
        docs = s.get(f"{BASE_URL}/recipes?collection_name=mikilab", timeout=90).json()
        assert not any(d.get("locked") for d in docs), "admin should see unlocked recipes"


# --- cleanup ----------------------------------------------------------------
def test_cleanup_waitlist(admin_client):
    """Best-effort cleanup marker: waitlist entry left for admin visibility check."""
    assert True
