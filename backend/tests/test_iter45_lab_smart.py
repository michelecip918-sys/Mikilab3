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
import re
import time
from pathlib import Path

import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
base_url = os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")
if not base_url:
    raise RuntimeError("REACT_APP_BACKEND_URL missing")
BASE_URL = base_url.rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="session")
def creds():
    content = Path("/app/memory/test_credentials.md").read_text(encoding="utf-8")
    m = re.search(r"`(admin@[^`]+)`\s*/\s*`([^`]+)`", content)
    if not m:
        pytest.skip("no admin creds")
    return {"email": m.group(1), "password": m.group(2)}


@pytest.fixture(scope="session")
def client(creds):
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json=creds, timeout=30)
    if r.status_code != 200:
        pytest.fail(f"login failed {r.status_code}: {r.text[:300]}")
    tok = r.json().get("session_token") or r.json().get("token")
    if tok:
        s.headers.update({"Authorization": f"Bearer {tok}"})
    return s


@pytest.fixture(scope="session")
def anon():
    return requests.Session()


# --- Auth gating ---------------------------------------------------------
class TestAnonGating:
    @pytest.mark.parametrize("method,path,body", [
        ("get", "/dough-sessions", None),
        ("post", "/dough-sessions", {"recipe_name": "TEST_x", "dough_temp_c": 25}),
        ("post", "/dough-sessions/day-after", {"recipe_name": "TEST_x"}),
        ("post", "/dough-sessions/ai-advice", {"recipe_name": "TEST_x"}),
        ("get", "/haccp-logs", None),
        ("post", "/haccp-logs", {"material": "TEST_x"}),
    ])
    def test_requires_auth(self, anon, method, path, body):
        r = getattr(anon, method)(f"{API}{path}", json=body, timeout=30)
        assert r.status_code == 401, f"{path} -> {r.status_code} {r.text[:200]}"


# --- Dough sessions CRUD + Day After -----------------------------------
class TestDoughSessions:
    created = []

    def test_create_and_persist(self, client):
        payload = {"recipe_name": "TEST_PaneWarm", "target_temp_c": 24, "dough_temp_c": 26.5,
                   "room_temp_c": 22, "humidity": 55, "water_temp_c": 18, "note": "TEST_note"}
        r = client.post(f"{API}/dough-sessions", json=payload, timeout=30)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        assert "_id" not in d
        assert d["recipe_name"] == "TEST_PaneWarm"
        assert d["dough_temp_c"] == 26.5
        assert d["target_temp_c"] == 24
        assert isinstance(d["id"], str) and d["date"]
        TestDoughSessions.created.append(d["id"])

        lst = client.get(f"{API}/dough-sessions", timeout=30)
        assert lst.status_code == 200
        ids = [x["id"] for x in lst.json()]
        assert d["id"] in ids
        assert all("_id" not in x for x in lst.json())

    def test_day_after_too_warm(self, client):
        r = client.post(f"{API}/dough-sessions/day-after",
                        json={"recipe_name": "TEST_PaneWarm", "today_room_c": 24, "today_humidity": 55, "lang": "it"},
                        timeout=30)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        assert d["has_history"] is True
        a = d["analysis"]
        assert a["verdict"] == "too_warm"
        assert a["delta"] == 2.5
        assert a["suggested_water_c"] == 11.0
        assert d["last"]["recipe_name"] == "TEST_PaneWarm"

    def test_day_after_too_cold(self, client):
        payload = {"recipe_name": "TEST_PaneCold", "target_temp_c": 24, "dough_temp_c": 21.0,
                   "room_temp_c": 20, "humidity": 50, "water_temp_c": 16}
        c = client.post(f"{API}/dough-sessions", json=payload, timeout=30)
        assert c.status_code == 200
        TestDoughSessions.created.append(c.json()["id"])
        r = client.post(f"{API}/dough-sessions/day-after",
                        json={"recipe_name": "TEST_PaneCold", "today_room_c": 20, "today_humidity": 50}, timeout=30)
        a = r.json()["analysis"]
        assert a["verdict"] == "too_cold"
        assert a["delta"] == -3.0
        # 16 - (-3)*2 = 22.0, room diff 0
        assert a["suggested_water_c"] == 22.0
        assert a["suggested_water_c"] > payload["water_temp_c"]

    def test_day_after_on_target_and_no_history(self, client):
        c = client.post(f"{API}/dough-sessions", json={"recipe_name": "TEST_PaneOk", "target_temp_c": 24,
                        "dough_temp_c": 24.2, "room_temp_c": 21, "water_temp_c": 20}, timeout=30)
        TestDoughSessions.created.append(c.json()["id"])
        r = client.post(f"{API}/dough-sessions/day-after", json={"recipe_name": "TEST_PaneOk", "today_room_c": 21}, timeout=30)
        assert r.json()["analysis"]["verdict"] == "on_target"

        r2 = client.post(f"{API}/dough-sessions/day-after", json={"recipe_name": "TEST_NoSuchDough_zzz"}, timeout=30)
        assert r2.status_code == 200
        assert r2.json() == {"has_history": False}

    def test_ai_advice(self, client):
        t0 = time.time()
        r = client.post(f"{API}/dough-sessions/ai-advice",
                        json={"recipe_name": "TEST_PaneWarm", "today_room_c": 24, "today_humidity": 55, "lang": "it"},
                        timeout=120)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        assert isinstance(d.get("advice"), str) and len(d["advice"]) > 40, d
        print(f"AI advice {len(d['advice'])} chars in {time.time()-t0:.1f}s")

    def test_validation_missing_dough_temp(self, client):
        r = client.post(f"{API}/dough-sessions", json={"recipe_name": "TEST_bad"}, timeout=30)
        assert r.status_code == 422

    def test_delete_and_404(self, client):
        c = client.post(f"{API}/dough-sessions", json={"recipe_name": "TEST_PaneDel", "target_temp_c": 24,
                        "dough_temp_c": 25.0, "water_temp_c": 18}, timeout=30)
        assert c.status_code == 200, c.text[:300]
        sid = c.json()["id"]
        r = client.delete(f"{API}/dough-sessions/{sid}", timeout=30)
        assert r.status_code == 200 and r.json().get("ok") is True
        ids = [x["id"] for x in client.get(f"{API}/dough-sessions", timeout=30).json()]
        assert sid not in ids
        assert client.delete(f"{API}/dough-sessions/{sid}", timeout=30).status_code == 404


# --- HACCP logs ---------------------------------------------------------
class TestHaccp:
    created = []

    def test_create_list_delete(self, client):
        payload = {"material": "TEST_Farina Tipo 0", "code": "8001234567890", "lot": "TEST_L123",
                   "expiry": "2026-12-31", "supplier": "TEST_Molino", "temp_c": 4.5, "qty": "25kg", "note": "TEST"}
        r = client.post(f"{API}/haccp-logs", json=payload, timeout=30)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        assert "_id" not in d
        for k in ("material", "code", "lot", "expiry", "supplier", "temp_c", "qty"):
            assert d[k] == payload[k], k
        TestHaccp.created.append(d["id"])

        lst = client.get(f"{API}/haccp-logs", timeout=30)
        assert lst.status_code == 200
        assert d["id"] in [x["id"] for x in lst.json()]

        assert client.delete(f"{API}/haccp-logs/{d['id']}", timeout=30).status_code == 200
        assert d["id"] not in [x["id"] for x in client.get(f"{API}/haccp-logs", timeout=30).json()]
        assert client.delete(f"{API}/haccp-logs/{d['id']}", timeout=30).status_code == 404
        TestHaccp.created.clear()

    def test_validation(self, client):
        assert client.post(f"{API}/haccp-logs", json={"code": "x"}, timeout=30).status_code == 422


# --- Cleanup ------------------------------------------------------------
@pytest.fixture(scope="session", autouse=True)
def cleanup(client):
    yield
    for sid in TestDoughSessions.created:
        client.delete(f"{API}/dough-sessions/{sid}", timeout=30)
    for lid in TestHaccp.created:
        client.delete(f"{API}/haccp-logs/{lid}", timeout=30)
    # remove any stray TEST_ sessions/logs
    for s in client.get(f"{API}/dough-sessions", timeout=30).json():
        if str(s.get("recipe_name", "")).startswith("TEST_"):
            client.delete(f"{API}/dough-sessions/{s['id']}", timeout=30)
    for l in client.get(f"{API}/haccp-logs", timeout=30).json():
        if str(l.get("material", "")).startswith("TEST_"):
            client.delete(f"{API}/haccp-logs/{l['id']}", timeout=30)
