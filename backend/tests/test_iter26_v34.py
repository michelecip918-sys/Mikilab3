import os
import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")).rstrip("/")

ADMIN = {"email": "admin@mikilab.de", "password": "Mikilab2026!"}


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def admin_client(client):
    r = client.post(f"{BASE_URL}/api/auth/login", json=ADMIN)
    if r.status_code != 200:
        pytest.fail(f"Admin login failed {r.status_code}: {r.text[:300]}")
    tok = r.json().get("session_token") or r.json().get("token")
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    if tok:
        s.headers.update({"Authorization": f"Bearer {tok}"})
    return s


# --- auth regression ---
class TestAuth:
    def test_admin_login(self, client):
        r = client.post(f"{BASE_URL}/api/auth/login", json=ADMIN)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        assert d.get("user", {}).get("email") == ADMIN["email"]
        assert d["user"].get("role") == "admin"

    def test_bad_password(self, client):
        r = client.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN["email"], "password": "wrong-xyz"})
        assert r.status_code in (400, 401, 423, 429), r.status_code


# --- v34 reseed / recipes ---
class TestRecipesV34:
    def test_count_43(self, admin_client):
        r = admin_client.get(f"{BASE_URL}/api/recipes", params={"collection_name": "mikilab"})
        assert r.status_code == 200, r.text[:300]
        data = r.json()
        assert isinstance(data, list)
        assert len(data) == 43, f"expected 43 recipes, got {len(data)}"
        assert all("_id" not in x for x in data), "MongoDB _id leaked"

    def test_licoli_separate(self, admin_client):
        r = admin_client.get(f"{BASE_URL}/api/recipes", params={"collection_name": "mikilab"})
        names = [x["name"] for x in r.json()]
        assert "Lievito Madre Solido" in names
        licoli = [n for n in names if "LiCoLi" in n]
        assert licoli == ["LiCoLi (Lievito in Coltura Liquida)"], licoli
        assert not [n for n in names if "Licoli (Liko)" in n], "retired name still present"

    def test_licoli_detail(self, admin_client):
        r = admin_client.get(f"{BASE_URL}/api/recipes", params={"collection_name": "mikilab"})
        full = next(x for x in r.json() if "LiCoLi" in x["name"])
        blob = str(full).lower()
        assert "1:1:1" in blob, "refresh 1:1:1 not found in LiCoLi recipe"
        assert "4,1" in blob or "4.1" in blob, "pH 4,1-4,3 not documented"
        assert full.get("procedure") or full.get("steps"), "no procedure"

    def test_panettoni_naming(self, admin_client):
        r = admin_client.get(f"{BASE_URL}/api/recipes", params={"collection_name": "mikilab"})
        pan = [x for x in r.json() if "Panettone" in x["name"]]
        assert len(pan) == 11, f"expected 11 panettoni, got {len(pan)}: {[p['name'] for p in pan]}"
        for p in pan:
            assert p["name"].startswith("Panettone Artigianale MikiLab"), p["name"]

    def test_panettone_structure_fields(self, admin_client):
        r = admin_client.get(f"{BASE_URL}/api/recipes", params={"collection_name": "mikilab"})
        d = [x for x in r.json() if "Panettone" in x["name"]][0]
        assert d.get("locked") is not True, "admin should see full recipe"
        assert d.get("procedure"), "no procedure for panettone"
        assert d.get("work_phases") is not None or d.get("flour_grams"), "no technical structure data"

    def test_categories_basi(self, admin_client):
        r = admin_client.get(f"{BASE_URL}/api/recipes", params={"collection_name": "mikilab"})
        cats = {x.get("menu_category") for x in r.json()}
        assert "basi" in cats, cats
        basi = [x["name"] for x in r.json() if x.get("menu_category") == "basi"]
        assert "LiCoLi (Lievito in Coltura Liquida)" in basi and "Lievito Madre Solido" in basi, basi
