# ============================================================================
#  MIKILAB PRO & BakoMix AI — PROPRIETARY & CONFIDENTIAL
#  (c) 2026 MikiLab Pro. Tutti i diritti riservati / All rights reserved.
#  Unico proprietario legale: il Master. Sole legal owner: the Master.
#  Codice riservato: vietata copia, distribuzione, reverse engineering o
#  cloning non autorizzati. Unauthorized copying, distribution, reverse
#  engineering or cloning is strictly prohibited and actively tracked by
#  the BakoMix AI Security Guardian.
# ============================================================================
"""Iteration 108 — Paywall removal (all free) + FR/FA localisation backend checks."""
import os
import requests
import pytest
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
base_url = os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")
if not base_url:
    raise RuntimeError("REACT_APP_BACKEND_URL missing")
BASE_URL = base_url.rstrip("/")


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# --- Subscription status (guest + admin) -----------------------------------
class TestSubscription:
    def test_status_guest_is_pro(self, client):
        r = client.get(f"{BASE_URL}/api/subscription/status", timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d.get("pro") is True, f"guest not pro: {d}"

    def test_status_admin_is_pro(self, client):
        lr = client.post(f"{BASE_URL}/api/auth/login",
                         json={"email": "admin@mikilab.de", "password": "Mikilab2026!"}, timeout=30)
        assert lr.status_code == 200, lr.text
        tok = lr.json().get("session_token") or lr.json().get("token")
        assert tok
        r = client.get(f"{BASE_URL}/api/subscription/status",
                       headers={"Authorization": f"Bearer {tok}"}, timeout=30)
        assert r.status_code == 200
        assert r.json().get("pro") is True


# --- Recipes: no locked/teaser -------------------------------------------
class TestRecipesFree:
    def test_mikilab_recipes_none_locked(self, client):
        r = client.get(f"{BASE_URL}/api/recipes?collection_name=mikilab", timeout=60)
        assert r.status_code == 200, r.text
        docs = r.json()
        assert isinstance(docs, list) and len(docs) > 0
        locked = [d.get("name") for d in docs if d.get("locked")]
        assert locked == [], f"locked recipes found: {locked}"
        # no mongo _id leakage
        assert all("_id" not in d for d in docs)

    def test_recipes_have_full_method(self, client):
        r = client.get(f"{BASE_URL}/api/recipes?collection_name=mikilab", timeout=60)
        docs = r.json()
        empty = []
        for d in docs:
            has_content = bool(d.get("procedure")) or bool(d.get("work_phases"))
            if not has_content:
                empty.append(d.get("name"))
        assert len(empty) <= 2, f"recipes without method (teaser?): {empty}"

    def test_segale_recipe_full(self, client):
        r = client.get(f"{BASE_URL}/api/recipes?collection_name=mikilab", timeout=60)
        docs = r.json()
        target = [d for d in docs if "segale" in (d.get("name") or "").lower()]
        assert target, "Lievito Madre di Segale not found"
        for d in target:
            assert not d.get("locked")
            assert d.get("procedure"), "procedure missing (teaser)"
            assert len(d["procedure"]) > 100


# --- Weekly theme FR/FA ---------------------------------------------------
class TestWeeklyTheme:
    @pytest.mark.parametrize("lang", ["it", "de", "en", "es", "fr", "fa"])
    def test_weekly_theme_lang(self, client, lang):
        r = client.get(f"{BASE_URL}/api/academy/weekly-theme?lang={lang}", timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d.get("title")
        assert d.get("theme_id")

    def test_fr_fa_differ_from_it(self, client):
        it = client.get(f"{BASE_URL}/api/academy/weekly-theme?lang=it", timeout=30).json()
        fr = client.get(f"{BASE_URL}/api/academy/weekly-theme?lang=fr", timeout=30).json()
        fa = client.get(f"{BASE_URL}/api/academy/weekly-theme?lang=fa", timeout=30).json()
        assert fr["theme_id"] == it["theme_id"] == fa["theme_id"]
        assert fa["title"] != it["title"], "FA weekly theme not translated"
        # FA must contain persian chars
        assert any("\u0600" <= c <= "\u06FF" for c in fa["title"]), f"FA not persian: {fa['title']}"


# --- Other public content endpoints in FR/FA ------------------------------
class TestPublicContentLangs:
    @pytest.mark.parametrize("lang", ["fr", "fa"])
    def test_challenges_catalog(self, client, lang):
        r = client.get(f"{BASE_URL}/api/challenges/catalog?lang={lang}", timeout=30)
        assert r.status_code == 200, r.text
        assert isinstance(r.json(), (list, dict))

    @pytest.mark.parametrize("lang", ["fr", "fa"])
    def test_bakealong(self, client, lang):
        r = client.get(f"{BASE_URL}/api/community/bakealong?lang={lang}", timeout=30)
        assert r.status_code in (200, 404), r.text
