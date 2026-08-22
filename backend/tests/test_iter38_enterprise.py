"""Iteration 38 — Enterprise module: Stores (multi-negozio) + Purchase Orders (multi-fornitore)."""
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
USER2 = {"email": "fornaio@mikilab.de", "password": "Mikilab2026!"}


def _login(creds):
    r = requests.post(f"{API}/auth/login", json=creds, timeout=30)
    if r.status_code != 200:
        pytest.fail(f"login failed {r.status_code}: {r.text[:300]}")
    tok = r.json().get("session_token") or r.json().get("token")
    assert tok, f"no token in {r.json()}"
    s = requests.Session()
    s.headers.update({"Authorization": f"Bearer {tok}", "Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def admin():
    return _login(ADMIN)


@pytest.fixture(scope="module")
def user2():
    return _login(USER2)


@pytest.fixture(scope="module")
def created():
    return {"stores": [], "orders": []}


@pytest.fixture(scope="module", autouse=True)
def cleanup(admin, created):
    yield
    for oid in created["orders"]:
        admin.delete(f"{API}/purchase-orders/{oid}", timeout=30)
    for sid in created["stores"]:
        admin.delete(f"{API}/stores/{sid}", timeout=30)


# --- Auth requirement ---
class TestAuthGuards:
    def test_stores_requires_auth(self):
        r = requests.get(f"{API}/stores", timeout=30)
        assert r.status_code in (401, 403), r.text[:200]

    def test_orders_requires_auth(self):
        r = requests.get(f"{API}/purchase-orders", timeout=30)
        assert r.status_code in (401, 403), r.text[:200]


# --- Stores CRUD ---
class TestStores:
    def test_create_and_persist(self, admin, created):
        payload = {"name": "TEST_Forno Centro", "address": "Via Roma 1", "phone": "+39 111", "note": "TEST"}
        r = admin.post(f"{API}/stores", json=payload, timeout=30)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        assert "_id" not in d
        assert d["name"] == payload["name"] and d["address"] == payload["address"]
        assert isinstance(d["id"], str)
        created["stores"].append(d["id"])
        lst = admin.get(f"{API}/stores", timeout=30).json()
        assert any(s["id"] == d["id"] and s["name"] == payload["name"] for s in lst)

    def test_update(self, admin, created):
        sid = created["stores"][0]
        r = admin.put(f"{API}/stores/{sid}", json={"name": "TEST_Forno Centro 2", "address": "Via Milano 5", "phone": "", "note": ""}, timeout=30)
        assert r.status_code == 200, r.text[:300]
        assert r.json()["name"] == "TEST_Forno Centro 2"
        lst = admin.get(f"{API}/stores", timeout=30).json()
        got = next(s for s in lst if s["id"] == sid)
        assert got["name"] == "TEST_Forno Centro 2" and got["address"] == "Via Milano 5"

    def test_update_missing_404(self, admin):
        r = admin.put(f"{API}/stores/nope-123", json={"name": "X"}, timeout=30)
        assert r.status_code == 404

    def test_validation_missing_name(self, admin):
        r = admin.post(f"{API}/stores", json={"address": "x"}, timeout=30)
        assert r.status_code == 422

    def test_scoped_by_owner(self, admin, user2, created):
        sid = created["stores"][0]
        lst = user2.get(f"{API}/stores", timeout=30).json()
        assert all(s["id"] != sid for s in lst), "store leaked to other user"
        assert user2.delete(f"{API}/stores/{sid}", timeout=30).status_code == 404

    def test_delete(self, admin):
        r = admin.post(f"{API}/stores", json={"name": "TEST_ToDelete"}, timeout=30)
        sid = r.json()["id"]
        assert admin.delete(f"{API}/stores/{sid}", timeout=30).status_code == 200
        lst = admin.get(f"{API}/stores", timeout=30).json()
        assert all(s["id"] != sid for s in lst)
        assert admin.delete(f"{API}/stores/{sid}", timeout=30).status_code == 404


# --- Purchase orders CRUD + total + status + store filter ---
class TestOrders:
    def test_create_total_and_status(self, admin, created):
        store = admin.post(f"{API}/stores", json={"name": "TEST_Stazione"}, timeout=30).json()
        created["stores"].append(store["id"])
        payload = {
            "store_id": store["id"], "supplier": "BÄKO", "supplier_email": "a@b.de",
            "items": [{"name": "Farina 0", "qty": 10, "unit": "kg", "price": 1.5},
                      {"name": "Lievito", "qty": 2, "unit": "pz", "price": 3.25}],
            "note": "TEST note", "status": "bozza",
        }
        r = admin.post(f"{API}/purchase-orders", json=payload, timeout=30)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        created["orders"].append(d["id"])
        assert "_id" not in d
        assert d["status"] == "bozza"
        assert d["total"] == pytest.approx(21.5)
        assert len(d["items"]) == 2 and d["items"][0]["name"] == "Farina 0"
        # persistence
        got = next(o for o in admin.get(f"{API}/purchase-orders", timeout=30).json() if o["id"] == d["id"])
        assert got["total"] == pytest.approx(21.5) and got["supplier"] == "BÄKO"

    def test_status_transitions(self, admin, created):
        oid = created["orders"][0]
        o = next(x for x in admin.get(f"{API}/purchase-orders", timeout=30).json() if x["id"] == oid)
        for st in ("inviato", "ricevuto"):
            body = {**{k: o[k] for k in ("store_id", "supplier", "supplier_email", "items", "note")}, "status": st}
            r = admin.put(f"{API}/purchase-orders/{oid}", json=body, timeout=30)
            assert r.status_code == 200, r.text[:300]
            assert r.json()["status"] == st
            got = next(x for x in admin.get(f"{API}/purchase-orders", timeout=30).json() if x["id"] == oid)
            assert got["status"] == st

    def test_invalid_status_falls_back(self, admin, created):
        oid = created["orders"][0]
        o = next(x for x in admin.get(f"{API}/purchase-orders", timeout=30).json() if x["id"] == oid)
        body = {**{k: o[k] for k in ("store_id", "supplier", "supplier_email", "items", "note")}, "status": "hacked"}
        r = admin.put(f"{API}/purchase-orders/{oid}", json=body, timeout=30)
        assert r.status_code == 200
        assert r.json()["status"] in ("bozza", "inviato", "ricevuto")

    def test_store_filter(self, admin, created):
        s2 = admin.post(f"{API}/stores", json={"name": "TEST_Altro"}, timeout=30).json()
        created["stores"].append(s2["id"])
        o2 = admin.post(f"{API}/purchase-orders", json={"store_id": s2["id"], "supplier": "TEST_Sup2",
                                                        "items": [{"name": "Sale", "qty": 1, "unit": "kg", "price": 2}]}, timeout=30).json()
        created["orders"].append(o2["id"])
        lst = admin.get(f"{API}/purchase-orders", params={"store_id": s2["id"]}, timeout=30).json()
        assert all(o["store_id"] == s2["id"] for o in lst)
        assert any(o["id"] == o2["id"] for o in lst)
        assert all(o["id"] != created["orders"][0] for o in lst)

    def test_null_price_total(self, admin, created):
        o = admin.post(f"{API}/purchase-orders", json={"store_id": None, "supplier": "TEST_NoPrice",
                                                      "items": [{"name": "X", "qty": 5, "unit": "kg", "price": None}]}, timeout=30).json()
        created["orders"].append(o["id"])
        assert o["total"] == 0

    def test_scoped_by_owner(self, admin, user2, created):
        oid = created["orders"][0]
        lst = user2.get(f"{API}/purchase-orders", timeout=30).json()
        assert all(o["id"] != oid for o in lst)
        assert user2.put(f"{API}/purchase-orders/{oid}", json={"supplier": "hack"}, timeout=30).status_code == 404
        assert user2.delete(f"{API}/purchase-orders/{oid}", timeout=30).status_code == 404

    def test_delete(self, admin):
        o = admin.post(f"{API}/purchase-orders", json={"supplier": "TEST_Del", "items": []}, timeout=30).json()
        assert admin.delete(f"{API}/purchase-orders/{o['id']}", timeout=30).status_code == 200
        assert admin.delete(f"{API}/purchase-orders/{o['id']}", timeout=30).status_code == 404


# --- PRO entitlement check (informational) ---
class TestProStatus:
    def test_admin_is_pro(self, admin):
        r = admin.get(f"{API}/subscription/status", timeout=30)
        assert r.status_code == 200, r.text[:200]
        assert r.json().get("pro") is True

    def test_user2_pro_flag_reported(self, user2):
        r = user2.get(f"{API}/subscription/status", timeout=30)
        assert r.status_code == 200
        print("fornaio pro =", r.json().get("pro"))
