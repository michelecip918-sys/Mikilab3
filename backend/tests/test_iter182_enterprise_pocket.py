"""
Iteration 182 backend tests — Enterprise Grid / Pocket layer + universal-command bugfix + regression.
Run serially: pytest /app/backend/tests/test_iter182_enterprise_pocket.py -n 0 -v

Cleanup: delete test-created sites, reset oven_main_01 coords to (10.2, 3.1), delete test recipe,
delete test features/devices. LEAVE seeded lab_sites (Stoccarda+Monaco) intact.
"""
import os
import json
import asyncio
import pytest
import requests
import websockets
from urllib.parse import urlparse
from pymongo import MongoClient

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
API = f"{BASE_URL}/api"
ADMIN_EMAIL = "admin@mikilab.de"
ADMIN_PASS = "Mikilab2026!"
MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME")

TEST_RECIPE_ID = "test_iter182_recipe"


@pytest.fixture(scope="module")
def admin_headers():
    r = requests.post(f"{API}/auth/login",
                      json={"email": ADMIN_EMAIL, "password": ADMIN_PASS}, timeout=15)
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    data = r.json()
    tok = data.get("session_token") or data.get("token") or data.get("access_token")
    assert tok, f"no token: {data}"
    return {"Authorization": f"Bearer {tok}", "Content-Type": "application/json"}


@pytest.fixture(scope="module")
def mongo():
    if not (MONGO_URL and DB_NAME):
        pytest.skip("Mongo env not set")
    c = MongoClient(MONGO_URL)
    yield c[DB_NAME]
    c.close()


@pytest.fixture(scope="module", autouse=True)
def final_cleanup(admin_headers, mongo):
    yield
    try:
        # Reset oven_main_01 back to (10.2, 3.1)
        requests.post(f"{API}/enterprise/sites/bakery_01_stuttgart/layout/optimize",
                      headers=admin_headers,
                      json={"equipment_id": "oven_main_01", "target_x": 10.2, "target_y": 3.1},
                      timeout=10)
        # Delete any TEST_ sites (POST /enterprise/sites creates site_{uuid8})
        mongo.lab_sites.delete_many({"name": {"$regex": "^TEST_"}})
        # Delete workers added to seeded site during test (worker name TEST_)
        mongo.lab_sites.update_many({}, {"$pull": {"workers": {"name": {"$regex": "^TEST_"}}}})
        # Delete test recipe
        mongo.recipes.delete_many({"id": TEST_RECIPE_ID})
        # Delete test devices/features from universal-command
        mongo.lab_devices.delete_many({"type": "smart_scale_with_display"})
        mongo.lab_user_features.delete_many({"feature": {"$in": ["address_book", "custom_widget"]}})
    except Exception as e:
        print(f"cleanup error: {e}")


# ============================================================
# BUGFIX: universal-command bilancia priority over aggiungi
# ============================================================
class TestUniversalCommandBugfix:
    def test_bilancia_returns_device_added(self, admin_headers):
        r = requests.post(f"{API}/ai/universal-command", headers=admin_headers,
                          json={"command_text": "aggiungi una bilancia"}, timeout=15)
        assert r.status_code == 200, r.text
        j = r.json()
        assert j.get("action_type") == "device_added", j
        dev = j.get("device") or {}
        assert dev.get("id") and dev.get("type") == "smart_scale_with_display"

    def test_rubrica_returns_ui_personalization_and_listed(self, admin_headers):
        r = requests.post(f"{API}/ai/universal-command", headers=admin_headers,
                          json={"command_text": "aggiungi rubrica"}, timeout=15)
        assert r.status_code == 200
        j = r.json()
        assert j.get("action_type") == "ui_personalization"
        assert j.get("target_feature") == "address_book"

        r = requests.get(f"{API}/ai/my-features", headers=admin_headers, timeout=10)
        assert r.status_code == 200
        feats = r.json().get("features", [])
        assert any(f.get("feature") == "address_book" for f in feats)


# ============================================================
# ENTERPRISE OVERVIEW + SITES
# ============================================================
class TestEnterpriseOverviewAndSites:
    def test_overview_shape_and_seeded(self):
        r = requests.get(f"{API}/enterprise/overview", timeout=15)
        assert r.status_code == 200, r.text
        j = r.json()
        for k in ("total_active_sites", "global_efficiency_avg", "critical_alerts_count", "total_workers"):
            assert k in j, f"missing {k}"
        assert j["total_active_sites"] >= 2
        assert j["total_workers"] >= 3
        assert j["critical_alerts_count"] >= 1  # Monaco warning

    def test_sites_list_with_aura_and_avg(self):
        r = requests.get(f"{API}/enterprise/sites", timeout=15)
        assert r.status_code == 200
        sites = r.json().get("sites", [])
        by_id = {s["site_id"]: s for s in sites}
        assert "bakery_01_stuttgart" in by_id
        assert "bakery_02_munich" in by_id

        stg = by_id["bakery_01_stuttgart"]
        mun = by_id["bakery_02_munich"]

        # avg_score computed
        assert stg["avg_score"] > 90
        assert mun["avg_score"] == 82

        # Aura shape
        aura = stg["aura"]
        for k in ("aura_effect", "color", "stage", "label"):
            assert k in aura
        # Label has 6 langs
        for lang in ("it", "de", "en", "es", "fr", "fa"):
            assert lang in aura["label"]

        # Stoccarda Super Saiyan, Monaco Aura Bianca
        assert stg["aura"]["aura_effect"] == "Super Saiyan"
        assert mun["aura"]["aura_effect"] == "Aura Bianca"

        # status
        assert stg["status"] == "normal"
        assert mun["status"] != "normal"


# ============================================================
# ENTERPRISE CRUD
# ============================================================
class TestEnterpriseCRUD:
    def test_add_site_anon_forbidden(self):
        r = requests.post(f"{API}/enterprise/sites", json={"name": "TEST_Anonymous"}, timeout=10)
        assert r.status_code in (401, 403)

    def test_create_site_shift_and_delete(self, admin_headers):
        # Create test site
        r = requests.post(f"{API}/enterprise/sites", headers=admin_headers,
                          json={"name": "TEST_Milano"}, timeout=15)
        assert r.status_code == 200, r.text
        created = r.json()
        sid = created["site_id"]
        assert sid.startswith("site_")

        # Add a worker via site-shift
        r = requests.post(f"{API}/enterprise/site-shift", headers=admin_headers,
                          json={"site_id": sid, "worker_name": "TEST_Marco",
                                "position": "Forno", "score": 88}, timeout=15)
        assert r.status_code == 200, r.text
        assert r.json().get("status") == "success"

        # Verify present in sites list
        r = requests.get(f"{API}/enterprise/sites", timeout=15)
        sites = r.json().get("sites", [])
        target = next((s for s in sites if s["site_id"] == sid), None)
        assert target and len(target.get("workers", [])) == 1
        assert target["workers"][0]["name"] == "TEST_Marco"

        # Delete
        r = requests.delete(f"{API}/enterprise/sites/{sid}", headers=admin_headers, timeout=10)
        assert r.status_code == 200
        assert r.json().get("ok") is True

        # Confirm removed
        r = requests.get(f"{API}/enterprise/sites", timeout=15)
        sites = r.json().get("sites", [])
        assert not any(s["site_id"] == sid for s in sites)


# ============================================================
# LEADERBOARD / BRIEFING / FLEET ADVICE
# ============================================================
class TestEnterpriseInsights:
    def test_global_leaderboard(self):
        r = requests.get(f"{API}/enterprise/global-leaderboard", timeout=15)
        assert r.status_code == 200
        lb = r.json().get("global_leaderboard", [])
        assert len(lb) >= 3
        # Sorted desc by score
        scores = [w["score"] for w in lb]
        assert scores == sorted(scores, reverse=True)
        assert lb[0]["global_rank"] == 1
        assert lb[0]["title"] == "Grandmaster of the Network"
        # Michele highest (96)
        assert lb[0]["worker_name"] == "Michele"

    def test_global_morning_briefing(self):
        r = requests.get(f"{API}/enterprise/global-morning-briefing", timeout=15)
        assert r.status_code == 200
        j = r.json()
        assert j.get("greeting")
        assert j.get("total_sites") >= 2
        assert "global_efficiency" in j
        exc = j.get("exceptions_requiring_boss", [])
        assert any(e.get("site_id") == "bakery_02_munich" for e in exc), exc

    def test_strategic_fleet_advice_flags_low_scores(self):
        r = requests.get(f"{API}/enterprise/strategic-fleet-advice", timeout=15)
        assert r.status_code == 200
        j = r.json()
        recs = j.get("fleet_recommendations", [])
        assert any("Hans" in (rec.get("worker") or "") for rec in recs), recs


# ============================================================
# SPATIAL LAYOUT
# ============================================================
class TestSpatialLayout:
    def test_get_layout(self):
        r = requests.get(f"{API}/enterprise/sites/bakery_01_stuttgart/layout", timeout=10)
        assert r.status_code == 200
        j = r.json()
        sl = j.get("spatial_layout") or {}
        eq_ids = [e["id"] for e in sl.get("equipment", [])]
        assert "oven_main_01" in eq_ids
        assert "mixer_01" in eq_ids
        assert j.get("detected_assets_count") == 2

    def test_optimize_layout_anon_forbidden(self):
        r = requests.post(f"{API}/enterprise/sites/bakery_01_stuttgart/layout/optimize",
                          json={"equipment_id": "oven_main_01", "target_x": 6.0, "target_y": 9.0},
                          timeout=10)
        assert r.status_code in (401, 403)

    def test_optimize_layout_move(self, admin_headers):
        r = requests.post(f"{API}/enterprise/sites/bakery_01_stuttgart/layout/optimize",
                          headers=admin_headers,
                          json={"equipment_id": "oven_main_01", "target_x": 6.0, "target_y": 9.0},
                          timeout=15)
        assert r.status_code == 200, r.text
        j = r.json()
        assert j["new_coordinates"] == {"x": 6.0, "y": 9.0}
        assert "bakomix_simulation" in j
        assert "%" in j["bakomix_simulation"]

        # Verify persisted
        r = requests.get(f"{API}/enterprise/sites/bakery_01_stuttgart/layout", timeout=10)
        eqs = r.json()["spatial_layout"]["equipment"]
        oven = next(e for e in eqs if e["id"] == "oven_main_01")
        assert oven["x"] == 6.0 and oven["y"] == 9.0

    def test_optimize_layout_unknown_equipment_404(self, admin_headers):
        r = requests.post(f"{API}/enterprise/sites/bakery_01_stuttgart/layout/optimize",
                          headers=admin_headers,
                          json={"equipment_id": "no_such_eq", "target_x": 1.0, "target_y": 1.0},
                          timeout=10)
        assert r.status_code == 404


# ============================================================
# POCKET
# ============================================================
class TestPocket:
    def test_master_command_vision(self, admin_headers):
        r = requests.post(f"{API}/pocket/master-command", headers=admin_headers,
                          json={"command_text": "scansiona il forno",
                                "active_site_id": "bakery_01_stuttgart"}, timeout=15)
        assert r.status_code == 200
        j = r.json()
        assert j.get("action_type") == "vision_spatial_scan"
        assert "equipment" in (j.get("data") or {})

    def test_master_command_hr(self, admin_headers):
        r = requests.post(f"{API}/pocket/master-command", headers=admin_headers,
                          json={"command_text": "sposta Michele",
                                "active_site_id": "bakery_01_stuttgart"}, timeout=15)
        assert r.status_code == 200
        assert r.json().get("action_type") == "hr_rebalance"

    def test_master_command_recipe(self, admin_headers):
        r = requests.post(f"{API}/pocket/master-command", headers=admin_headers,
                          json={"command_text": "crea ricetta"}, timeout=15)
        assert r.status_code == 200
        assert r.json().get("action_type") == "recipe_propagation"

    def test_master_command_briefing(self, admin_headers):
        r = requests.post(f"{API}/pocket/master-command", headers=admin_headers,
                          json={"command_text": "briefing"}, timeout=15)
        assert r.status_code == 200
        assert r.json().get("action_type") == "executive_pulse"

    def test_pocket_dashboard(self):
        r = requests.get(f"{API}/pocket/dashboard/bakery_01_stuttgart", timeout=15)
        assert r.status_code == 200
        j = r.json()
        gnb = j.get("global_network_badge") or {}
        for k in ("total_sites", "global_aura", "global_efficiency", "active_alerts"):
            assert k in gnb
        csv = j.get("current_site_view") or {}
        assert csv.get("site_id") == "bakery_01_stuttgart"

    def test_pocket_scan_floor(self):
        r = requests.post(f"{API}/pocket/vision/scan-floor",
                          json={"site_id": "bakery_01_stuttgart"}, timeout=10)
        assert r.status_code == 200
        j = r.json()
        eq = j.get("equipment_detected", [])
        assert any(e["id"] == "oven_main_01" for e in eq)

    def test_pocket_recipes_create(self, admin_headers):
        r = requests.post(f"{API}/pocket/recipes/create", headers=admin_headers,
                          json={"recipe_id": TEST_RECIPE_ID,
                                "name": "TEST Pane iter182", "ingredients": []}, timeout=15)
        assert r.status_code == 200
        j = r.json()
        assert j.get("status") == "success"
        assert isinstance(j.get("active_recipes_count"), int)

    def test_pocket_weekly_plan(self, admin_headers):
        r = requests.post(f"{API}/pocket/site/weekly-plan", headers=admin_headers,
                          json={"site_id": "bakery_01_stuttgart",
                                "schedule_data": {"mon": []}}, timeout=15)
        assert r.status_code == 200
        assert r.json().get("status") == "success"

    def test_websocket_enterprise_scale_streaming(self):
        parsed = urlparse(BASE_URL)
        scheme = "wss" if parsed.scheme == "https" else "ws"
        ws_url = f"{scheme}://{parsed.netloc}/api/ws/enterprise-os/bakery_01_stuttgart"

        async def run():
            async with websockets.connect(ws_url, open_timeout=15, close_timeout=5) as ws:
                await ws.send(json.dumps({"action": "scale_weight_streaming",
                                          "weight": 6.5, "target": 6.5}))
                msg = json.loads(await asyncio.wait_for(ws.recv(), timeout=10))
                assert msg.get("status") == "success", msg
                assert msg.get("audio_mode") == "letz_passive_silent"
                assert msg.get("next_action_unlocked") is True

        asyncio.run(run())


# ============================================================
# REGRESSION
# ============================================================
class TestRegression:
    def test_lab_pulse_mood_sereno(self, mongo):
        # ensure clean state
        try:
            mongo.lab_seq_block.delete_many({})
            mongo.lab_sensors_live.delete_many({})
        except Exception:
            pass
        r = requests.get(f"{API}/lab/pulse", timeout=15)
        assert r.status_code == 200
        p = r.json()
        assert p.get("mood") == "sereno", p

    def test_morning_briefing(self):
        r = requests.get(f"{API}/ai/morning-briefing", timeout=15)
        assert r.status_code == 200
        j = r.json()
        assert j.get("greeting")

    def test_shift_power_board(self):
        r = requests.get(f"{API}/production/shift-plan", timeout=10)
        assert r.status_code == 200
        assert isinstance(r.json().get("weekly_plan"), list)
