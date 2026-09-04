import os
import uuid

import pytest
import requests
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


@pytest.fixture(scope="module")
def created_ids():
    return []


@pytest.fixture(scope="module", autouse=True)
def cleanup(client, created_ids):
    yield
    for i in created_ids:
        client.delete(f"{BASE_URL}/api/lab/warehouse/{i}", timeout=30)


# --- Warehouse (Magazzino) CRUD + min_kg threshold ---
class TestWarehouse:
    def test_list(self, client):
        r = client.get(f"{BASE_URL}/api/lab/warehouse", timeout=30)
        assert r.status_code == 200, r.text[:300]
        data = r.json()
        assert isinstance(data, list)
        for it in data:
            assert "_id" not in it

    def test_create_with_min_kg_persists(self, client, created_ids):
        name = f"TEST_Farina_{uuid.uuid4().hex[:6]}"
        payload = {"name": name, "kind": "farina", "force_w": "W300",
                   "quantity_kg": 5, "unit": "kg", "min_kg": 10}
        r = client.post(f"{BASE_URL}/api/lab/warehouse", json=payload, timeout=30)
        assert r.status_code == 200, r.text[:300]
        body = r.json()
        item = body.get("item", body)
        assert item.get("id")
        created_ids.append(item["id"])
        assert item["name"] == name
        assert float(item["min_kg"]) == 10
        assert float(item["quantity_kg"]) == 5
        assert "_id" not in item

        lst = client.get(f"{BASE_URL}/api/lab/warehouse", timeout=30).json()
        found = [x for x in lst if x["id"] == item["id"]]
        assert found, "created item not persisted"
        assert float(found[0]["min_kg"]) == 10
        assert float(found[0]["quantity_kg"]) == 5

    def test_update_quantity_upsert(self, client, created_ids):
        item_id = created_ids[0]
        lst = client.get(f"{BASE_URL}/api/lab/warehouse", timeout=30).json()
        item = [x for x in lst if x["id"] == item_id][0]
        item["quantity_kg"] = 12
        r = client.post(f"{BASE_URL}/api/lab/warehouse", json=item, timeout=30)
        assert r.status_code == 200, r.text[:300]
        lst2 = client.get(f"{BASE_URL}/api/lab/warehouse", timeout=30).json()
        upd = [x for x in lst2 if x["id"] == item_id][0]
        assert float(upd["quantity_kg"]) == 12
        assert float(upd["min_kg"]) == 10
        assert len([x for x in lst2 if x["id"] == item_id]) == 1

    def test_delete_removes(self, client):
        name = f"TEST_Del_{uuid.uuid4().hex[:6]}"
        r = client.post(f"{BASE_URL}/api/lab/warehouse",
                        json={"name": name, "kind": "ingrediente", "quantity_kg": 1, "min_kg": 2}, timeout=30)
        assert r.status_code == 200
        body = r.json()
        item_id = (body.get("item") or body)["id"]
        d = client.delete(f"{BASE_URL}/api/lab/warehouse/{item_id}", timeout=30)
        assert d.status_code in (200, 204), d.text[:200]
        lst = client.get(f"{BASE_URL}/api/lab/warehouse", timeout=30).json()
        assert not [x for x in lst if x["id"] == item_id]

    def test_create_invalid_missing_name(self, client):
        r = client.post(f"{BASE_URL}/api/lab/warehouse", json={"kind": "farina"}, timeout=30)
        assert r.status_code == 422, r.status_code


# --- Static multi-language PDFs ---
class TestDocs:
    @pytest.mark.parametrize("lang", ["IT", "DE", "EN", "ES", "FR", "FA"])
    def test_pdf_available(self, client, lang):
        url = f"{BASE_URL}/MikiLab_v14_Ecosystem_Document_{lang}.pdf"
        r = client.get(url, timeout=60)
        assert r.status_code == 200, f"{url} -> {r.status_code}"
        ctype = r.headers.get("content-type", "")
        assert "pdf" in ctype.lower() or r.content[:4] == b"%PDF", f"{url} ctype={ctype} head={r.content[:20]}"
