# ============================================================================
#  MIKILAB PRO & BakoMix AI — PROPRIETARY & CONFIDENTIAL
#  (c) 2026 MikiLab Pro. Tutti i diritti riservati / All rights reserved.
#  Unico proprietario legale: il Master. Sole legal owner: the Master.
#  Codice riservato: vietata copia, distribuzione, reverse engineering o
#  cloning non autorizzati. Unauthorized copying, distribution, reverse
#  engineering or cloning is strictly prohibited and actively tracked by
#  the BakoMix AI Security Guardian.
# ============================================================================
"""Iteration 80 — Spanish (ES) support: bundle-checkout lang metadata, recipes _es fields, shop products _es."""
import os
import pytest
import requests
from dotenv import dotenv_values

fe = dotenv_values("/app/frontend/.env")
BASE = (os.environ.get("REACT_APP_BACKEND_URL") or fe.get("REACT_APP_BACKEND_URL")).rstrip("/")
API = f"{BASE}/api"

USER = {"email": "fornaio@mikilab.de", "password": "Mikilab2026!"}
ADMIN = {"email": "admin@mikilab.de", "password": "Mikilab2026!"}


def _login(creds):
    r = requests.post(f"{API}/auth/login", json=creds, timeout=60)
    if r.status_code != 200:
        pytest.fail(f"login failed {creds['email']}: {r.status_code} {r.text[:300]}")
    tok = r.json().get("session_token") or r.json().get("token")
    assert tok, f"no token in login response: {r.text[:300]}"
    return tok


@pytest.fixture(scope="module")
def user_tok():
    return _login(USER)


@pytest.fixture(scope="module")
def admin_tok():
    return _login(ADMIN)


def _h(tok):
    return {"Authorization": f"Bearer {tok}", "Content-Type": "application/json"}


# ---------- BUNDLE CHECKOUT: lang persisted ----------
@pytest.mark.parametrize("lang", ["es", "de", "en", "it"])
def test_bundle_checkout_lang(user_tok, lang):
    r = requests.post(f"{API}/recipes/bundle-checkout",
                      json={"bundle": "pane", "origin_url": BASE, "lang": lang},
                      headers=_h(user_tok), timeout=90)
    assert r.status_code == 200, r.text[:400]
    d = r.json()
    assert d.get("url", "").startswith("http"), d
    sid = d.get("session_id")
    assert sid and sid.startswith("cs_"), d
    # verify persisted lang in transaction
    st = requests.get(f"{API}/recipes/bundle-checkout/status/{sid}?lang={lang}",
                      headers=_h(user_tok), timeout=90)
    assert st.status_code in (200, 404), st.text[:300]


def test_bundle_checkout_invalid_bundle(user_tok):
    r = requests.post(f"{API}/recipes/bundle-checkout",
                      json={"bundle": "nope", "origin_url": BASE, "lang": "es"},
                      headers=_h(user_tok), timeout=60)
    assert r.status_code == 400, r.text[:200]


def test_bundle_checkout_unauth():
    r = requests.post(f"{API}/recipes/bundle-checkout",
                      json={"bundle": "pane", "origin_url": BASE, "lang": "es"}, timeout=60)
    assert r.status_code in (401, 403), r.status_code


def test_bundle_checkout_bad_lang_falls_back(user_tok):
    r = requests.post(f"{API}/recipes/bundle-checkout",
                      json={"bundle": "pane", "origin_url": BASE, "lang": "zz"},
                      headers=_h(user_tok), timeout=90)
    assert r.status_code == 200, r.text[:300]


# ---------- RECIPES: _es fields ----------
def test_mikilab_recipes_es_fields(admin_tok):
    r = requests.get(f"{API}/recipes?collection=mikilab", headers=_h(admin_tok), timeout=120)
    assert r.status_code == 200, r.text[:300]
    recs = r.json()
    assert isinstance(recs, list)
    print(f"mikilab recipes count = {len(recs)}")
    assert len(recs) >= 94, f"expected >=94 recipes, got {len(recs)}"
    missing = {"name_es": [], "flour_type_es": [], "notes_es": [], "procedure_es": []}
    for rec in recs:
        for f in missing:
            v = rec.get(f)
            if not (isinstance(v, str) and v.strip()):
                missing[f].append(rec.get("name") or rec.get("id"))
    for f, lst in missing.items():
        print(f"{f}: missing on {len(lst)} recipes -> {lst[:5]}")
    assert not missing["name_es"], f"name_es missing on {len(missing['name_es'])}"
    assert not missing["procedure_es"], f"procedure_es missing on {len(missing['procedure_es'])}"
    # notes/flour may legitimately be empty when the IT source is empty
    for f in ("notes_es", "flour_type_es"):
        for name in missing[f]:
            src = next((x for x in recs if (x.get("name") or x.get("id")) == name), {})
            base = f.replace("_es", "")
            assert not (src.get(base) or "").strip(), f"{f} empty but {base} populated for {name}"


def test_recipe_es_not_italian(admin_tok):
    """Spot check: ES procedure should differ from IT procedure."""
    r = requests.get(f"{API}/recipes?collection=mikilab", headers=_h(admin_tok), timeout=120)
    recs = r.json()
    same = [x.get("name") for x in recs if (x.get("procedure_es") or "").strip() == (x.get("procedure") or "").strip()]
    print(f"recipes with procedure_es == procedure (untranslated): {len(same)} -> {same[:5]}")
    assert len(same) == 0, f"{len(same)} recipes have untranslated ES procedure"


# ---------- SHOP PRODUCTS ----------
def test_shop_products_es():
    r = requests.get(f"{API}/shop/products", timeout=60)
    assert r.status_code == 200, r.text[:200]
    d = r.json()
    prods = d.get("products", [])
    assert prods, "no products"
    for p in prods:
        assert (p.get("name_es") or "").strip(), f"name_es missing for {p.get('id')}"
        assert (p.get("desc_es") or "").strip(), f"desc_es missing for {p.get('id')}"
        assert "_id" not in p
        assert p["name_es"] != p["name"] or p["id"].startswith("p-"), p["id"]


# ---------- COMMUNITY accessible (no paywall) ----------
def test_community_accessible(user_tok):
    r = requests.get(f"{API}/community/posts", headers=_h(user_tok), timeout=60)
    assert r.status_code == 200, f"{r.status_code} {r.text[:200]}"
