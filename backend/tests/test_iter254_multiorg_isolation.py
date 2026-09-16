"""Iter 254 — Multi-tenant isolation tests.

Verifies that organization_id isolation prevents data leakage between two
distinct organizations for:
  - inventory_items (GET/PUT /api/inventory)
  - favorites (GET/POST /api/favorites, /api/favorites/counts)
  - day_closures (POST /api/day-close, GET /api/day-close/list|last|{id}/pdf)
  - recipes personal (POST/GET/PUT/DELETE/translate/promote /api/recipes)
  - weekly_plan (GET/PUT /api/weekly-plan)
And regression: org_default still sees its own data and MikiLab public recipes.
"""
import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://edit-33.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@mikilab.de"
ADMIN_PASSWORD = "Mikilab2026!"
MASTER_PIN = "198505"


def _new_session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


def _gate(s):
    r = s.post(f"{API}/admin-gate/verify", json={"pin": MASTER_PIN}, timeout=30)
    assert r.status_code == 200, f"gate failed: {r.status_code} {r.text}"
    assert r.json().get("ok") is True


def _login_admin(s):
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=30)
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    return r.json()["user"]


def _register_new_org(s):
    email = f"test_iso_{uuid.uuid4().hex[:8]}@example.com"
    pw = "TestPass1234!"
    r = s.post(
        f"{API}/auth/register",
        json={"email": email, "password": pw, "name": "Iso Tester", "activation_code": MASTER_PIN, "lang": "it"},
        timeout=30,
    )
    assert r.status_code == 200, f"register failed: {r.status_code} {r.text}"
    return r.json()["user"], email, pw


@pytest.fixture(scope="module")
def sess_a():
    """Session A = admin@mikilab.de → org_default."""
    s = _new_session()
    _gate(s)
    u = _login_admin(s)
    return {"s": s, "user": u}


@pytest.fixture(scope="module")
def sess_b():
    """Session B = new user with activation_code → brand-new org."""
    s = _new_session()
    _gate(s)
    u, email, pw = _register_new_org(s)
    return {"s": s, "user": u, "email": email}


# ============================================================
# 0. sanity: A and B are different users (and different orgs if possible)
# ============================================================
def test_00_sessions_distinct(sess_a, sess_b):
    assert sess_a["user"]["user_id"] != sess_b["user"]["user_id"]
    # /auth/me must reflect distinct identities
    ra = sess_a["s"].get(f"{API}/auth/me", timeout=20)
    rb = sess_b["s"].get(f"{API}/auth/me", timeout=20)
    assert ra.status_code == 200 and rb.status_code == 200
    assert ra.json()["email"] != rb.json()["email"]


# ============================================================
# 1. INVENTORY isolation
# ============================================================
def test_10_inventory_isolation(sess_a, sess_b):
    name_a = f"TEST_ISO_A_{uuid.uuid4().hex[:6]}"
    name_b = f"TEST_ISO_B_{uuid.uuid4().hex[:6]}"

    # A saves its own inventory (this will delete-then-insert A's items only)
    ra = sess_a["s"].put(
        f"{API}/inventory",
        json={"items": [{"name": name_a, "category": "farine", "qty": 10, "unit": "kg", "threshold": 2}]},
        timeout=30,
    )
    assert ra.status_code == 200, ra.text
    assert any(it["name"] == name_a for it in ra.json()["items"])

    # B saves its own inventory
    rb = sess_b["s"].put(
        f"{API}/inventory",
        json={"items": [{"name": name_b, "category": "farine", "qty": 5, "unit": "kg", "threshold": 1}]},
        timeout=30,
    )
    assert rb.status_code == 200, rb.text

    # GET: B must NOT see A's items and vice versa
    ga = sess_a["s"].get(f"{API}/inventory", timeout=30).json()["items"]
    gb = sess_b["s"].get(f"{API}/inventory", timeout=30).json()["items"]
    names_a = {it["name"] for it in ga}
    names_b = {it["name"] for it in gb}
    assert name_a in names_a, f"A missing own item: {names_a}"
    assert name_b in names_b, f"B missing own item: {names_b}"
    assert name_b not in names_a, f"LEAK: A sees B item: {names_a}"
    assert name_a not in names_b, f"LEAK: B sees A item: {names_b}"


# ============================================================
# 2. FAVORITES isolation
# ============================================================
def test_20_favorites_isolation(sess_a, sess_b):
    rid_a = f"TEST_ISO_REC_A_{uuid.uuid4().hex[:6]}"
    rid_b = f"TEST_ISO_REC_B_{uuid.uuid4().hex[:6]}"

    # A toggles a favorite
    ra = sess_a["s"].post(f"{API}/favorites/toggle", json={"recipe_id": rid_a}, timeout=20)
    assert ra.status_code == 200 and ra.json()["favorite"] is True, ra.text
    # B toggles a different favorite
    rb = sess_b["s"].post(f"{API}/favorites/toggle", json={"recipe_id": rid_b}, timeout=20)
    assert rb.status_code == 200 and rb.json()["favorite"] is True, rb.text

    fa = sess_a["s"].get(f"{API}/favorites", timeout=20).json()
    fb = sess_b["s"].get(f"{API}/favorites", timeout=20).json()
    assert rid_a in fa and rid_b not in fa, f"A favorites leak: {fa}"
    assert rid_b in fb and rid_a not in fb, f"B favorites leak: {fb}"

    # counts must be scoped per organization
    ca = sess_a["s"].get(f"{API}/favorites/counts", timeout=20).json()
    cb = sess_b["s"].get(f"{API}/favorites/counts", timeout=20).json()
    # A must include rid_a but NOT rid_b (B belongs to another org)
    assert rid_a in ca and rid_b not in ca, f"A counts leak: {ca}"
    assert rid_b in cb and rid_a not in cb, f"B counts leak: {cb}"


# ============================================================
# 3. DAY CLOSURES isolation
# ============================================================
def test_30_day_close_isolation(sess_a, sess_b):
    op_a = f"TEST_ISO_OP_A_{uuid.uuid4().hex[:6]}"
    op_b = f"TEST_ISO_OP_B_{uuid.uuid4().hex[:6]}"

    ra = sess_a["s"].post(
        f"{API}/day-close",
        json={"produced": [], "consume": [], "temps": [], "cleaning": {}, "operator": op_a, "note": "A", "lang": "it"},
        timeout=30,
    )
    assert ra.status_code == 200, ra.text
    id_a = ra.json()["closure"]["id"]

    rb = sess_b["s"].post(
        f"{API}/day-close",
        json={"produced": [], "consume": [], "temps": [], "cleaning": {}, "operator": op_b, "note": "B", "lang": "it"},
        timeout=30,
    )
    assert rb.status_code == 200, rb.text
    id_b = rb.json()["closure"]["id"]

    la = sess_a["s"].get(f"{API}/day-close/list", timeout=30).json()["closures"]
    lb = sess_b["s"].get(f"{API}/day-close/list", timeout=30).json()["closures"]
    ids_a = {c["id"] for c in la}
    ids_b = {c["id"] for c in lb}
    assert id_a in ids_a and id_b not in ids_a, f"A list leak: {ids_a} (id_b={id_b})"
    assert id_b in ids_b and id_a not in ids_b, f"B list leak: {ids_b} (id_a={id_a})"

    # /last for B must not be A's closure
    last_b = sess_b["s"].get(f"{API}/day-close/last", timeout=30).json()
    assert last_b and last_b.get("id") == id_b, f"B last leak: {last_b}"

    # PDF of A closure from B must be 404
    pdf_cross = sess_b["s"].get(f"{API}/day-close/{id_a}/pdf", timeout=60)
    assert pdf_cross.status_code == 404, f"LEAK: B fetched A's PDF: {pdf_cross.status_code}"

    # PDF of own closure works
    pdf_own = sess_a["s"].get(f"{API}/day-close/{id_a}/pdf", timeout=60)
    assert pdf_own.status_code == 200


# ============================================================
# 4. RECIPES (personal) isolation
# ============================================================
def test_40_recipes_personal_isolation(sess_a, sess_b):
    name_a = f"TEST_ISO_REC_PERS_A_{uuid.uuid4().hex[:6]}"
    name_b = f"TEST_ISO_REC_PERS_B_{uuid.uuid4().hex[:6]}"

    # NOTE: create_recipe may translate via LLM (slow). Keep body minimal.
    ca = sess_a["s"].post(
        f"{API}/recipes",
        json={"collection_name": "personal", "name": name_a},
        timeout=180,
    )
    assert ca.status_code == 200, ca.text
    rec_a = ca.json()
    id_a = rec_a["id"]

    cb = sess_b["s"].post(
        f"{API}/recipes",
        json={"collection_name": "personal", "name": name_b},
        timeout=180,
    )
    assert cb.status_code == 200, cb.text
    rec_b = cb.json()
    id_b = rec_b["id"]

    # B lists personal (+include_mine) — must NOT see A's recipe
    lb = sess_b["s"].get(f"{API}/recipes?collection_name=personal&include_mine=true", timeout=60)
    assert lb.status_code == 200
    ids_b = {r["id"] for r in lb.json()}
    assert id_a not in ids_b, f"LEAK: B sees A's personal recipe in list"
    # A lists personal — must NOT see B's
    la = sess_a["s"].get(f"{API}/recipes?collection_name=personal&include_mine=true", timeout=60)
    ids_a = {r["id"] for r in la.json()}
    assert id_b not in ids_a, f"LEAK: A sees B's personal recipe in list"

    # PUT by B on A recipe → 403 or 404
    put_cross = sess_b["s"].put(f"{API}/recipes/{id_a}", json={"name": "hacked"}, timeout=60)
    assert put_cross.status_code in (403, 404), f"expected 403/404, got {put_cross.status_code}"

    # DELETE by B on A recipe → 403 or 404
    del_cross = sess_b["s"].delete(f"{API}/recipes/{id_a}", timeout=30)
    assert del_cross.status_code in (403, 404), f"expected 403/404, got {del_cross.status_code}"

    # TRANSLATE by B on A recipe → 403 or 404
    tr_cross = sess_b["s"].post(f"{API}/recipes/{id_a}/translate?lang=en", timeout=120)
    assert tr_cross.status_code in (403, 404), f"expected 403/404, got {tr_cross.status_code} {tr_cross.text[:200]}"

    # PROMOTE by B on A recipe → 403 (B is not admin anyway) or 404
    pr_cross = sess_b["s"].post(f"{API}/recipes/{id_a}/promote", timeout=30)
    assert pr_cross.status_code in (403, 404), f"expected 403/404, got {pr_cross.status_code}"

    # cleanup: A can delete own
    sess_a["s"].delete(f"{API}/recipes/{id_a}", timeout=30)
    sess_b["s"].delete(f"{API}/recipes/{id_b}", timeout=30)


# ============================================================
# 5. WEEKLY PLAN isolation
# ============================================================
def test_50_weekly_plan_isolation(sess_a, sess_b):
    marker_a = f"TEST_ISO_WP_A_{uuid.uuid4().hex[:6]}"
    marker_b = f"TEST_ISO_WP_B_{uuid.uuid4().hex[:6]}"

    payload_a = {"items": [], "option_label": marker_a}
    payload_b = {"items": [], "option_label": marker_b}

    ra = sess_a["s"].put(f"{API}/weekly-plan", json=payload_a, timeout=30)
    assert ra.status_code == 200, ra.text
    rb = sess_b["s"].put(f"{API}/weekly-plan", json=payload_b, timeout=30)
    assert rb.status_code == 200, rb.text

    ga = sess_a["s"].get(f"{API}/weekly-plan", timeout=30).json() or {}
    gb = sess_b["s"].get(f"{API}/weekly-plan", timeout=30).json() or {}
    sa = str(ga)
    sb = str(gb)
    assert marker_a in sa and marker_b not in sa, f"A plan leak: {sa[:400]}"
    assert marker_b in sb and marker_a not in sb, f"B plan leak: {sb[:400]}"


# ============================================================
# 6. REGRESSION: org_default still sees MikiLab public recipes
# ============================================================
def test_60_regression_mikilab_public(sess_a):
    r = sess_a["s"].get(f"{API}/recipes?collection_name=mikilab", timeout=60)
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list) and len(data) > 0, "org_default should still see MikiLab recipes"
