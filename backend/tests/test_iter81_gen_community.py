"""Iteration 81 — Recipe Generator (PRO), Community auto-translation, new recipes/categories, bundles."""
import os
import re
import pytest
import requests
from dotenv import dotenv_values

fe = dotenv_values("/app/frontend/.env")
BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or fe.get("REACT_APP_BACKEND_URL")).rstrip("/")
API = f"{BASE_URL}/api"

ADMIN = {"email": "admin@mikilab.de", "password": "Mikilab2026!"}
USER = {"email": "fornaio@mikilab.de", "password": "Mikilab2026!"}


def _login(creds):
    r = requests.post(f"{API}/auth/login", json=creds, timeout=60)
    if r.status_code != 200:
        pytest.fail(f"login {creds['email']} failed {r.status_code}: {r.text[:300]}")
    tok = r.json().get("session_token") or r.json().get("token")
    assert tok, f"no token in login response: {r.json()}"
    return tok


@pytest.fixture(scope="session")
def admin_h():
    return {"Authorization": f"Bearer {_login(ADMIN)}"}


@pytest.fixture(scope="session")
def user_h():
    return {"Authorization": f"Bearer {_login(USER)}"}


# ---------------- Recipe Generator ----------------
class TestRecipeGenerator:
    def test_generate_poolish_es(self, admin_h):
        body = {"product": "Pane rustico", "preferment": "poolish", "hydration": 75,
                "extras": ["olio_oliva", "semi_misti"], "total_weight": 1000, "lang": "es"}
        r = requests.post(f"{API}/recipes/generate", json=body, headers=admin_h, timeout=180)
        assert r.status_code == 200, r.text[:400]
        d = r.json()
        assert d["lang"] == "es"
        assert "Hidrataci" in d["title"] and "75%" in d["title"], d["title"]
        ing = d["ingredients"]
        # water = hydration% of total flour
        assert abs(ing["water_total_g"] - ing["flour_total_g"] * 0.75) <= 1.5, ing
        # salt ~2% of flour
        assert abs(ing["salt_g"] - ing["flour_total_g"] * 0.02) <= 0.6, ing
        assert ing["hydration_percent"] == 75
        pf = ing["preferment"]
        assert pf and pf["type"] == "Poolish"
        assert abs(pf["flour_g"] - ing["flour_total_g"] * 0.30) <= 1.5, pf
        assert abs(pf["water_g"] - pf["flour_g"]) <= 1.5, pf
        assert abs(ing["final_flour_g"] + pf["flour_g"] - ing["flour_total_g"]) <= 2
        names = [e["name"] for e in ing["extras"]]
        assert len(ing["extras"]) == 2 and all(e["grams"] > 0 for e in ing["extras"]), ing["extras"]
        assert any("oliva" in n for n in names)
        # total weight coherence
        tot = (ing["flour_total_g"] + ing["water_total_g"] + ing["salt_g"] + ing["yeast_g"]
               + ing["sourdough_g"] + sum(e["grams"] for e in ing["extras"]))
        assert abs(tot - 1000) <= 15, tot
        assert isinstance(d["procedure"], str) and len(d["procedure"]) > 200, d["procedure"][:200]

    def test_generate_biga_it(self, admin_h):
        body = {"product": "Focaccia", "preferment": "biga", "hydration": 80, "extras": [],
                "total_weight": 2000, "lang": "it"}
        r = requests.post(f"{API}/recipes/generate", json=body, headers=admin_h, timeout=180)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        ing = d["ingredients"]
        pf = ing["preferment"]
        assert pf["type"] == "Biga"
        assert abs(pf["flour_g"] - ing["flour_total_g"] * 0.40) <= 2
        assert abs(pf["water_g"] - pf["flour_g"] * 0.45) <= 2
        assert "Idratazione" in d["title"]
        assert len(d["procedure"]) > 150

    def test_generate_lm_de(self, admin_h):
        body = {"product": "Panettone", "preferment": "lm", "hydration": 65, "extras": ["burro", "uvetta"],
                "total_weight": 1500, "lang": "de"}
        r = requests.post(f"{API}/recipes/generate", json=body, headers=admin_h, timeout=180)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        ing = d["ingredients"]
        assert ing["preferment"] is None
        assert abs(ing["sourdough_g"] - ing["flour_total_g"] * 0.25) <= 2, ing
        assert "Hydration" in d["title"]
        assert len(d["procedure"]) > 150

    def test_hydration_clamped(self, admin_h):
        r = requests.post(f"{API}/recipes/generate",
                          json={"product": "Test", "preferment": "diretto", "hydration": 200,
                                "total_weight": 1000, "lang": "it"}, headers=admin_h, timeout=180)
        assert r.status_code == 200
        assert r.json()["ingredients"]["hydration_percent"] == 100

    def test_non_pro_403(self, user_h):
        st = requests.get(f"{API}/subscription/status", headers=user_h, timeout=30).json()
        if st.get("pro") or st.get("plan_tier") == "lab":
            pytest.skip(f"fornaio@ is PRO ({st}); cannot assert 403")
        r = requests.post(f"{API}/recipes/generate",
                          json={"product": "Pane", "preferment": "diretto", "hydration": 70,
                                "total_weight": 1000, "lang": "it"}, headers=user_h, timeout=60)
        assert r.status_code == 403, f"{r.status_code}: {r.text[:200]}"

    def test_unauth_401(self):
        r = requests.post(f"{API}/recipes/generate",
                          json={"product": "Pane", "preferment": "diretto", "hydration": 70,
                                "total_weight": 1000}, timeout=60)
        assert r.status_code in (401, 403)


# ---------------- Community auto-translation ----------------
class TestCommunityTranslate:
    created = []

    @classmethod
    def teardown_class(cls):
        tok = _login(ADMIN)
        h = {"Authorization": f"Bearer {tok}"}
        for pid in cls.created:
            requests.delete(f"{API}/community/posts/{pid}", headers=h, timeout=30)

    def test_post_and_comment_translated(self, admin_h):
        txt = "TEST_iter81 Oggi ho sfornato un pane con lievito madre e crosta croccante."
        r = requests.post(f"{API}/community/posts", json={"text": txt, "category": "consiglio"},
                          headers=admin_h, timeout=180)
        assert r.status_code == 200, r.text[:300]
        p = r.json()
        TestCommunityTranslate.created.append(p["id"])
        assert p["text"] == txt
        for k in ("text_de", "text_en", "text_es"):
            assert p.get(k), f"{k} missing: {p}"
            assert p[k] != txt, f"{k} not translated"
        assert "_id" not in p

        c = requests.post(f"{API}/community/posts/{p['id']}/comments",
                          json={"text": "Bellissimo alveolo, complimenti!"}, headers=admin_h, timeout=180)
        assert c.status_code == 200, c.text[:300]
        com = c.json()["comments"][-1]
        for k in ("text_de", "text_en", "text_es"):
            assert com.get(k), f"comment {k} missing: {com}"

        # persistence via list
        lst = requests.get(f"{API}/community/posts", headers=admin_h, timeout=60).json()
        found = [x for x in lst if x["id"] == p["id"]]
        assert found and found[0].get("text_es")


# ---------------- Recipes / categories ----------------
NEW_RECIPES = [
    ("Croissant Sfogliati Classici Senza Zucchero", "viennoiserie"),
    ("Croissant Sfogliati Tradizionali con Zucchero", "viennoiserie"),
    ("Cornetti all'Italiana", "viennoiserie"),
    ("Stollen", "viennoiserie"),
    ("Danish", "viennoiserie"),
    ("Pane di Cristallo", "pane"),
]


class TestRecipesCategories:
    def test_new_recipes_present_and_categorized(self, admin_h):
        r = requests.get(f"{API}/recipes?collection=mikilab", headers=admin_h, timeout=60)
        assert r.status_code == 200, r.text[:300]
        recipes = r.json()
        assert isinstance(recipes, list) and len(recipes) > 50
        for frag, cat in NEW_RECIPES:
            key = frag.lower()[:20]
            match = [x for x in recipes if key in (x.get("name") or "").lower()]
            assert match, f"recipe not found: {frag}"
            rec = match[0]
            assert rec.get("menu_category") == cat, f"{rec['name']} -> {rec.get('menu_category')} (expected {cat})"
            # content + translations
            assert len(rec.get("procedure") or "") > 100, f"{rec['name']} procedure empty"
            assert (rec.get("flour_grams") or 0) > 0, f"{rec['name']} no flour_grams"
            assert rec.get("flour_type"), f"{rec['name']} no flour_type"
            for suffix in ("_de", "_en", "_es"):
                assert rec.get("name" + suffix), f"{rec['name']} missing name{suffix}"
                assert rec.get("procedure" + suffix), f"{rec['name']} missing procedure{suffix}"
            assert "_id" not in rec

    def test_no_viennoiserie_in_bread_categories(self, admin_h):
        recipes = requests.get(f"{API}/recipes?collection=mikilab", headers=admin_h, timeout=60).json()
        vre = re.compile(r"croissant|cornett|panettone|colomba|pandoro|stollen|danish|plunder", re.I)
        bad = [(x.get("name"), x.get("menu_category")) for x in recipes
               if vre.search(x.get("name") or "") and x.get("menu_category") in ("pane", "panini")]
        assert not bad, f"viennoiserie products misfiled under pane/panini: {bad}"


class TestBundles:
    def test_pasticceria_bundle_checkout(self, admin_h):
        r = requests.post(f"{API}/recipes/bundle-checkout",
                          json={"bundle": "pasticceria", "origin_url": BASE_URL, "lang": "it"},
                          headers=admin_h, timeout=90)
        assert r.status_code == 200, r.text[:400]
        d = r.json()
        assert d.get("url", "").startswith("https://") and d.get("session_id")

    def test_invalid_bundle_400(self, admin_h):
        r = requests.post(f"{API}/recipes/bundle-checkout",
                          json={"bundle": "panettoni_old_xyz", "origin_url": BASE_URL},
                          headers=admin_h, timeout=60)
        assert r.status_code == 400, r.status_code
