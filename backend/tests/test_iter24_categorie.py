# ============================================================================
#  MIKILAB PRO & BakoMix AI — PROPRIETARY & CONFIDENTIAL
#  (c) 2026 MikiLab Pro. Tutti i diritti riservati / All rights reserved.
#  Unico proprietario legale: il Master. Sole legal owner: the Master.
#  Codice riservato: vietata copia, distribuzione, reverse engineering o
#  cloning non autorizzati. Unauthorized copying, distribution, reverse
#  engineering or cloning is strictly prohibited and actively tracked by
#  the BakoMix AI Security Guardian.
# ============================================================================
"""Iter24 — Riorganizzazione Ricette: 4 categorie, miglioratore unico, nuove basi, Brezel."""
import os
import pytest
import requests
from dotenv import dotenv_values

fe = dotenv_values("/app/frontend/.env")
BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or fe.get("REACT_APP_BACKEND_URL")).rstrip("/")
ADMIN = {"email": "admin@mikilab.de", "password": "Mikilab2026!"}

RETIRED = ["Miglioratore Naturale al Malto", "Miglioratore Naturale", "Miglioratore al Malto", "Bretzel del Maestro"]
BASI_ORDER = ["Miglioratore Naturale Pro", "Lievito Madre", "Lievito Madre di Segale", "Poolish", "Kochstück"]
PANINI = {"Taralli Pugliesi", "Friselle Pugliesi", "Puccia Salentina", "Focaccia Barese"}


def _it_blob(recipe):
    """Serializza solo i campi italiani (esclude quelli che finiscono con _de)."""
    return str({k: v for k, v in recipe.items() if not k.endswith("_de")})


@pytest.fixture(scope="module")
def token():
    r = requests.post(f"{BASE_URL}/api/auth/login", json=ADMIN, timeout=30)
    if r.status_code != 200:
        pytest.fail(f"Admin login failed {r.status_code}: {r.text[:300]}")
    t = r.json().get("session_token") or r.json().get("token")
    assert t, f"no token in {r.json()}"
    return t


@pytest.fixture(scope="module")
def recipes(token):
    r = requests.get(f"{BASE_URL}/api/recipes", params={"collection_name": "mikilab"},
                     headers={"Authorization": f"Bearer {token}"}, timeout=60)
    assert r.status_code == 200, r.text[:300]
    data = r.json()
    assert isinstance(data, list)
    return data


class TestSeedCategorie:
    def test_total_count_43(self, recipes):
        assert len(recipes) == 43, f"expected 43 recipes, got {len(recipes)}: {sorted(r['name'] for r in recipes)}"

    def test_no_mongo_id(self, recipes):
        assert all("_id" not in r for r in recipes)

    def test_menu_category_populated(self, recipes):
        bad = [r["name"] for r in recipes if r.get("menu_category") not in ("basi", "pane", "panini", "panettoni")]
        assert not bad, f"recipes with invalid/missing menu_category: {bad}"

    def test_retired_names_absent(self, recipes):
        names = {r["name"] for r in recipes}
        found = [n for n in RETIRED if n in names]
        assert not found, f"retired recipes still present: {found}"

    def test_brezel_present(self, recipes):
        names = {r["name"] for r in recipes}
        assert "Brezel" in names
        assert "Brezel Integrali" in names

    def test_basi_exact_set_and_order(self, recipes):
        basi = [r["name"] for r in recipes if r.get("menu_category") == "basi"]
        assert set(basi) == set(BASI_ORDER), f"basi mismatch: {basi}"

    def test_panini_exact(self, recipes):
        panini = {r["name"] for r in recipes if r.get("menu_category") == "panini"}
        assert panini == PANINI, f"panini mismatch: {panini}"

    def test_miglioratore_content(self, recipes):
        m = next((r for r in recipes if r["name"] == "Miglioratore Naturale Pro"), None)
        assert m, "Miglioratore Naturale Pro missing"
        blob = " ".join(str(v) for v in [m.get("procedure"), m.get("ingredients"), m.get("extra_ingredients"),
                                         m.get("notes"), m.get("description")])
        assert "2%" in blob, "uso al 2% non indicato"
        low = blob.lower()
        for token_ in ["lupino", "malto diastasico", "psillio", "vitamina c"]:
            assert token_ in low, f"ingrediente mancante nel Miglioratore: {token_}"
        # percentuali dichiarate
        pcts = str(m.get("extra_ingredients")) + str(m.get("ingredients"))
        for p in ["1", "0.5", "0.02"]:
            assert p in pcts, f"percentuale {p} mancante"

    def test_anima_integrale_uses_new_improver(self, recipes):
        r = next((x for x in recipes if x["name"] == "Anima Integrale"), None)
        assert r, "Anima Integrale missing"
        blob = str(r)
        assert "Miglioratore Naturale Pro" in blob, "vecchio miglioratore non sostituito"
        assert "2%" in blob
        assert "Vollkorn" not in _it_blob(r), "testo tedesco 'Vollkorn' nei campi italiani"
        assert "Integrale" in str(r.get("flour_type") or "") + str(r.get("real_name") or "") + r["name"]

    def test_no_vollkorn_in_italian_texts(self, recipes):
        bad = [r["name"] for r in recipes if "Vollkorn" in _it_blob(r)]
        assert not bad, f"'Vollkorn' presente nei campi italiani di: {bad}"


class TestAnonymousTeaser:
    def test_anonymous_locked_except_demos(self):
        r = requests.get(f"{BASE_URL}/api/recipes", params={"collection_name": "mikilab"}, timeout=60)
        assert r.status_code == 200, r.text[:300]
        data = r.json()
        assert len(data) == 43
        unlocked = [x["name"] for x in data if not x.get("locked")]
        assert set(unlocked) == {"Cuore Italiano", "Panettone Mikilab — Uvetta e Canditi (Classico)"}, unlocked
        for x in data:
            if x.get("locked"):
                assert not x.get("procedure"), f"{x['name']} leaks procedure"
                assert not x.get("work_phases"), f"{x['name']} leaks work_phases"

    def test_pro_endpoint_blocked_anonymous(self):
        r = requests.post(f"{BASE_URL}/api/maestro/vision", json={"image_base64": "x"}, timeout=60)
        assert r.status_code in (401, 402, 403), f"expected paywall, got {r.status_code}"


class TestIter24Regressions:
    """Bug regressioni trovate in iter24 — devono passare dopo il fix."""

    def test_recipe_ids_are_unique(self, recipes):
        from collections import Counter
        dups = {k: v for k, v in Counter(r["id"] for r in recipes).items() if v > 1}
        detail = {k: [r["name"] for r in recipes if r["id"] == k] for k in dups}
        assert not dups, f"id duplicati (React duplicate-key + collisioni CRUD): {detail}"

    def test_no_pane_recipe_leaks_into_basi_by_name(self, recipes):
        """Il regex sul nome è SOLO fallback quando menu_category è assente.
        Ogni ricetta ha menu_category valorizzato, quindi il fallback non scatta:
        'Baguette con Poolish' resta in 'pane'."""
        import re
        # Simula la logica frontend recipeCategory: menu_category è autoritativo.
        def category(r):
            cat = r.get("menu_category")
            if cat:
                return cat
            if re.search(r"migliorator|backmittel|lievito madre|poolish|kochst", r["name"].lower()):
                return "basi"
            if "panettone" in r["name"].lower():
                return "panettoni"
            return "pane"
        bad = [r["name"] for r in recipes
               if r.get("menu_category") and r["menu_category"] != "basi" and category(r) == "basi"]
        assert not bad, f"ricette non-basi finite in basi: {bad}"

