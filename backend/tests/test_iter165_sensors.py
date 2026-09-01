import os
import time

import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
base_url = os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")
if not base_url:
    raise RuntimeError("REACT_APP_BACKEND_URL missing")
BASE_URL = base_url.rstrip("/")
API = f"{BASE_URL}/api"

DEV = "TEST_iter165_probe"


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    yield s


@pytest.fixture(scope="module", autouse=True)
def cleanup():
    yield
    # no delete endpoint; cleanup via mongo script separately


# ---- /api/lab/sensors ----
class TestSensors:
    def test_post_sensor_anonymous(self, client):
        r = client.post(f"{API}/lab/sensors", json={
            "device_id": DEV, "name": "TEST_Sonda", "type": "temperature",
            "value": 22.5, "unit": "\u00b0C", "operator": "TEST_op"})
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["device_id"] == DEV
        assert d["type"] == "temperature"
        assert float(d["value"]) == 22.5
        assert d.get("at"), "at not populated"

    def test_get_sensors_contains_reading(self, client):
        r = client.get(f"{API}/lab/sensors")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        mine = [x for x in data if x.get("device_id") == DEV and x.get("type") == "temperature"]
        assert len(mine) == 1, f"expected 1 reading, got {len(mine)}"
        assert "_id" not in mine[0] and "_key" not in mine[0]
        # ordering desc by at
        ats = [x.get("at") or "" for x in data]
        assert ats == sorted(ats, reverse=True), "not sorted by at desc"

    def test_upsert_no_duplicate(self, client):
        time.sleep(1)
        r = client.post(f"{API}/lab/sensors", json={
            "device_id": DEV, "name": "TEST_Sonda", "type": "temperature",
            "value": 27.8, "unit": "\u00b0C"})
        assert r.status_code == 200
        g = client.get(f"{API}/lab/sensors").json()
        mine = [x for x in g if x.get("device_id") == DEV and x.get("type") == "temperature"]
        assert len(mine) == 1, "UPSERT duplicated the reading"
        assert float(mine[0]["value"]) == 27.8

    def test_multiple_types_separate_docs(self, client):
        r = client.post(f"{API}/lab/sensors", json={
            "device_id": DEV, "name": "TEST_Sonda", "type": "humidity", "value": 50, "unit": "%"})
        assert r.status_code == 200
        g = client.get(f"{API}/lab/sensors").json()
        mine = [x for x in g if x.get("device_id") == DEV]
        types = sorted(x["type"] for x in mine)
        assert types == ["humidity", "temperature"], types

    def test_missing_value_422(self, client):
        r = client.post(f"{API}/lab/sensors", json={"device_id": DEV, "type": "temperature"})
        assert r.status_code == 422, r.status_code

    def test_missing_device_id_422(self, client):
        r = client.post(f"{API}/lab/sensors", json={"type": "temperature", "value": 20})
        assert r.status_code == 422, r.status_code


# ---- regression fault-log / shift-state ----
class TestRegression:
    def test_fault_log_get(self, client):
        r = client.get(f"{API}/lab/fault-log")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_fault_log_post_and_persist(self, client):
        r = client.post(f"{API}/lab/fault-log", json={
            "type": "macchina", "name": "TEST_iter165_forno", "note": "TEST"})
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["name"] == "TEST_iter165_forno" and d.get("id") and d.get("at")
        g = client.get(f"{API}/lab/fault-log").json()
        assert any(x.get("name") == "TEST_iter165_forno" for x in g)
        assert all("_id" not in x for x in g)

    def test_shift_state_get_put(self, client):
        r = client.get(f"{API}/lab/shift-state")
        assert r.status_code == 200
        p = client.put(f"{API}/lab/shift-state", json={"work_mode": "continuo"})
        assert p.status_code == 200, p.text
        g = client.get(f"{API}/lab/shift-state").json()
        assert g.get("work_mode") == "continuo"
