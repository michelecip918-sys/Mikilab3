# ============================================================================
#  MIKILAB PRO & BakoMix AI — PROPRIETARY & CONFIDENTIAL
#  (c) 2026 MikiLab Pro. Tutti i diritti riservati / All rights reserved.
#  Unico proprietario legale: il Master. Sole legal owner: the Master.
#  Codice riservato: vietata copia, distribuzione, reverse engineering o
#  cloning non autorizzati. Unauthorized copying, distribution, reverse
#  engineering or cloning is strictly prohibited and actively tracked by
#  the BakoMix AI Security Guardian.
# ============================================================================
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


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def created(client):
    ids = []
    yield ids
    for i in ids:
        client.delete(f"{API}/lab/warehouse/{i}", timeout=30)


# ---- Module: /api/lab/warehouse CRUD ----
class TestWarehouseCrud:
    def test_list_warehouse(self, client):
        r = client.get(f"{API}/lab/warehouse", timeout=30)
        assert r.status_code == 200, r.text[:300]
        data = r.json()
        assert isinstance(data, list)
        for it in data:
            assert "_id" not in it

    def test_create_and_persist(self, client, created):
        payload = {"name": "TEST_Farina", "kind": "farina", "quantity_kg": 100, "unit": "kg", "min_kg": 20}
        r = client.post(f"{API}/lab/warehouse", json=payload, timeout=30)
        assert r.status_code == 200, r.text[:300]
        doc = r.json()
        assert doc.get("id")
        assert doc["name"] == "TEST_Farina"
        assert doc["min_kg"] == 20
        assert doc["quantity_kg"] == 100
        created.append(doc["id"])

        lst = client.get(f"{API}/lab/warehouse", timeout=30).json()
        found = [x for x in lst if x["id"] == doc["id"]]
        assert len(found) == 1
        assert found[0]["quantity_kg"] == 100

    def test_delete_removes(self, client):
        r = client.post(f"{API}/lab/warehouse", json={"name": "TEST_Delete", "kind": "farina", "quantity_kg": 3, "min_kg": 1}, timeout=30)
        iid = r.json()["id"]
        d = client.delete(f"{API}/lab/warehouse/{iid}", timeout=30)
        assert d.status_code == 200
        lst = client.get(f"{API}/lab/warehouse", timeout=30).json()
        assert not [x for x in lst if x["id"] == iid]


# ---- Module: /api/lab/warehouse/consume ----
class TestConsume:
    def test_consume_decrements_flour(self, client, created):
        r = client.post(f"{API}/lab/warehouse", json={"name": "TEST_ConsFarina", "kind": "farina", "quantity_kg": 100, "min_kg": 20}, timeout=30)
        iid = r.json()["id"]
        created.append(iid)
        res = client.post(f"{API}/lab/warehouse/consume", json={"items": [{"name": "TEST_ConsFarina", "kg": 12.4, "kind": "farina"}]}, timeout=30)
        assert res.status_code == 200, res.text[:300]
        body = res.json()
        assert body["shortfalls"] == []
        assert any(u["name"] == "TEST_ConsFarina" and abs(u["quantity_kg"] - 87.6) < 0.01 for u in body["updated"]), body
        lst = client.get(f"{API}/lab/warehouse", timeout=30).json()
        item = [x for x in lst if x["id"] == iid][0]
        assert abs(item["quantity_kg"] - 87.6) < 0.01

    def test_consume_missing_item_reports_shortfall(self, client):
        res = client.post(f"{API}/lab/warehouse/consume", json={"items": [{"name": "TEST_NoSuchThing_zzz", "kg": 1, "kind": "ingrediente"}]}, timeout=30)
        assert res.status_code == 200
        body = res.json()
        assert body["shortfalls"] and body["shortfalls"][0]["reason"] == "not_found"

    def test_consume_over_stock_clamps_to_zero(self, client, created):
        r = client.post(f"{API}/lab/warehouse", json={"name": "TEST_Small", "kind": "ingrediente", "quantity_kg": 2, "min_kg": 1}, timeout=30)
        iid = r.json()["id"]
        created.append(iid)
        res = client.post(f"{API}/lab/warehouse/consume", json={"items": [{"name": "TEST_Small", "kg": 5, "kind": "ingrediente"}]}, timeout=30)
        assert res.status_code == 200
        body = res.json()
        assert any(s.get("missing") == 3 for s in body["shortfalls"]), body
        lst = client.get(f"{API}/lab/warehouse", timeout=30).json()
        assert [x for x in lst if x["id"] == iid][0]["quantity_kg"] == 0

    def test_consume_zero_kg_ignored(self, client):
        res = client.post(f"{API}/lab/warehouse/consume", json={"items": [{"name": "TEST_Small", "kg": 0, "kind": "ingrediente"}]}, timeout=30)
        assert res.status_code == 200
        assert res.json() == {"updated": [], "shortfalls": []}


# ---- Module: /api/lab/warehouse/stats + consumption log ----
class TestStats:
    def test_stats_structure_and_days_left(self, client, created):
        r = client.post(f"{API}/lab/warehouse", json={"name": "TEST_StatFarina", "kind": "farina", "quantity_kg": 140, "min_kg": 20}, timeout=30)
        iid = r.json()["id"]
        created.append(iid)
        # consume 14 kg -> daily = 1 kg/day over 14 day window -> days_left = 140-14=126
        client.post(f"{API}/lab/warehouse/consume", json={"items": [{"name": "TEST_StatFarina", "kg": 14, "kind": "farina"}]}, timeout=30)
        st = client.get(f"{API}/lab/warehouse/stats", timeout=30)
        assert st.status_code == 200, st.text[:300]
        body = st.json()
        assert body["window_days"] == 14
        rec = [x for x in body["items"] if x["id"] == iid]
        assert rec, body
        rec = rec[0]
        assert abs(rec["daily_kg"] - 1.0) < 0.001, rec
        assert rec["days_left"] == 126, rec

    def test_stats_no_consumption_days_left_none(self, client, created):
        r = client.post(f"{API}/lab/warehouse", json={"name": "TEST_Idle_zzz", "kind": "ingrediente", "quantity_kg": 9, "min_kg": 2}, timeout=30)
        iid = r.json()["id"]
        created.append(iid)
        body = client.get(f"{API}/lab/warehouse/stats", timeout=30).json()
        rec = [x for x in body["items"] if x["id"] == iid][0]
        assert rec["daily_kg"] == 0
        assert rec["days_left"] is None

    def test_consumption_log(self, client):
        r = client.get(f"{API}/lab/warehouse/consumption", timeout=30)
        assert r.status_code == 200
        logs = r.json()
        assert isinstance(logs, list)
        for lg in logs:
            assert "_id" not in lg


# ---- Static PDF docs ----
class TestDocs:
    @pytest.mark.parametrize("lang", ["IT", "DE", "EN", "ES", "FR", "FA"])
    def test_pdf_available(self, client, lang):
        r = client.get(f"{BASE_URL}/MikiLab_v14_Ecosystem_Document_{lang}.pdf", timeout=60)
        assert r.status_code == 200, f"{lang}: {r.status_code}"
        assert r.content[:4] == b"%PDF", f"{lang}: not a pdf ({r.content[:20]!r})"


# ---- TTS used by briefing ----
class TestTTS:
    def test_tts_speak(self, client):
        r = client.post(f"{API}/tts/speak", json={"text": "Briefing scorte test", "lang": "it"}, timeout=90)
        assert r.status_code in (200, 400, 503), r.text[:300]
