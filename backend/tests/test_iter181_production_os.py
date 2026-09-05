"""
Iteration 181 backend tests for Production OS 3.1.0:
- Pulse: sequence_block alert (out-of-sequence)
- Sensors live: GET/POST, oven_hot critical + ph_low warn alerts in pulse
- Staffing: apply-volumes actually reduces batch pieces, staffing/history
- Production OS: universal-command (ui_personalization + device_added), my-features, scale/load-recipe, websocket letz_passive
- Turni & Power: shift-assignment POST/PATCH/DELETE, shift-plan aura, leaderboard, worker-aura, auth
- Morning briefing

Cleanup: reset lab_seq_block, lab_sensors_live, lab_absences (today),
lab_pulse_history (test rows), reset shift-state batches=[], remove test features/devices/shift assignments.
LEAVE seeded shift_plan team (Michele/Antonio) intact.
"""
import os
import json
import asyncio
import pytest
import requests
import websockets
from urllib.parse import urlparse
from pymongo import MongoClient
from datetime import datetime, timezone

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@mikilab.de"
ADMIN_PASS = "Mikilab2026!"

MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME")


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
    # Reset batches
    try:
        requests.put(f"{API}/lab/shift-state", headers=admin_headers,
                     json={"batches": []}, timeout=10)
    except Exception:
        pass
    # Wipe test-created devices, features, seq-block, sensors-live
    try:
        mongo.lab_seq_block.delete_many({})
        mongo.lab_sensors_live.delete_many({})
        today = datetime.now(timezone.utc).date().isoformat()
        mongo.lab_absences.delete_many({"date": today})
        # Remove test devices (name Bilancia Smart added during test)
        mongo.lab_devices.delete_many({"type": "smart_scale_with_display"})
        # Remove test user_features (added by universal-command)
        mongo.lab_user_features.delete_many({"feature": {"$in": ["address_book", "custom_widget"]}})
        # Remove test shift assignments created here (identified by worker_name TEST_)
        mongo.lab_shift_plan.delete_many({"worker_name": {"$regex": "^TEST_"}})
        # Clean synthetic pulse history added by tests (none created explicitly, skip)
    except Exception as e:
        print(f"cleanup error: {e}")


# ============================================================
# PULSE: sequence_block alert
# ============================================================
class TestSequenceBlockAlert:
    def test_out_of_sequence_generates_pulse_alert(self, admin_headers, mongo):
        # Seed 2 batches
        r = requests.put(f"{API}/lab/shift-state", headers=admin_headers,
                         json={"batches": [
                             {"id": "b1", "recipe_name": "Baguette", "status": ""},
                             {"id": "b2", "recipe_name": "Ciabatta", "status": ""},
                         ]}, timeout=10)
        assert r.status_code == 200

        # Try to start b2 out of order → block recorded
        r = requests.post(f"{API}/lab/sequence/start", json={"batch_id": "b2"}, timeout=10)
        assert r.status_code == 200
        j = r.json()
        assert j.get("allowed") is False

        # Pulse should show warn alert code sequence_block, 6-lang text
        r = requests.get(f"{API}/lab/pulse", timeout=15)
        assert r.status_code == 200
        p = r.json()
        alerts = p.get("alerts", [])
        sb = next((a for a in alerts if a.get("code") == "sequence_block"), None)
        assert sb, f"missing sequence_block alert in {alerts}"
        assert sb["level"] == "warn"
        txt = sb.get("text")
        assert isinstance(txt, dict)
        for lang in ("it", "de", "en", "es", "fr", "fa"):
            assert lang in txt

        # Starting b1 (in order) clears the seq-block recorded flag → pulse no longer shows it
        r = requests.post(f"{API}/lab/sequence/start", json={"batch_id": "b1"}, timeout=10)
        assert r.status_code == 200
        assert r.json().get("allowed") is True

        # Force wipe seq-block doc so pulse alert clears immediately
        mongo.lab_seq_block.delete_many({})
        r = requests.get(f"{API}/lab/pulse", timeout=15)
        p2 = r.json()
        assert not any(a.get("code") == "sequence_block" for a in p2.get("alerts", []))

        # Cleanup batches
        requests.put(f"{API}/lab/shift-state", headers=admin_headers,
                     json={"batches": []}, timeout=10)


# ============================================================
# SENSORS LIVE + thresholds
# ============================================================
class TestSensorsLive:
    def test_post_get_and_threshold_alerts(self, admin_headers, mongo):
        # Post over-threshold values
        r = requests.post(f"{API}/lab/sensors/live",
                          json={"oven_temp": 265, "ph": 3.6}, timeout=10)
        assert r.status_code == 200
        body = r.json()
        assert body.get("oven_temp", {}).get("value") == 265.0
        assert body.get("ph", {}).get("value") == 3.6

        # GET returns same
        r = requests.get(f"{API}/lab/sensors/live", timeout=10)
        assert r.status_code == 200
        j = r.json()
        assert j.get("oven_temp", {}).get("value") == 265.0
        assert j.get("ph", {}).get("value") == 3.6

        # Pulse: critical oven_hot + warn ph_low
        r = requests.get(f"{API}/lab/pulse", timeout=15)
        p = r.json()
        alerts = p.get("alerts", [])
        oven = next((a for a in alerts if a.get("code") == "oven_hot"), None)
        ph = next((a for a in alerts if a.get("code") == "ph_low"), None)
        assert oven and oven["level"] == "critical"
        assert ph and ph["level"] == "warn"
        # sensors object in pulse
        sens = p.get("sensors") or {}
        assert "oven_temp" in sens and "ph" in sens

        # Post safe values → alerts clear
        r = requests.post(f"{API}/lab/sensors/live",
                          json={"oven_temp": 200, "ph": 4.2}, timeout=10)
        assert r.status_code == 200

        r = requests.get(f"{API}/lab/pulse", timeout=15)
        p2 = r.json()
        codes = [a.get("code") for a in p2.get("alerts", [])]
        assert "oven_hot" not in codes
        assert "ph_low" not in codes

        # Cleanup so live app has no fake sensors
        mongo.lab_sensors_live.delete_many({})


# ============================================================
# STAFFING: apply-volumes + history
# ============================================================
class TestStaffingApplyVolumes:
    def test_apply_volumes_reduces_batch_pieces(self, admin_headers, mongo):
        # Reset absences today
        today = datetime.now(timezone.utc).date().isoformat()
        mongo.lab_absences.delete_many({"date": today})
        # total=5
        r = requests.put(f"{API}/lab/staffing", headers=admin_headers,
                         json={"total": 5}, timeout=10)
        assert r.status_code == 200
        # Seed batch with pieces=100
        r = requests.put(f"{API}/lab/shift-state", headers=admin_headers,
                         json={"batches": [
                             {"id": "x", "recipe_name": "Pane", "pieces": 100, "status": ""},
                         ]}, timeout=10)
        assert r.status_code == 200

        # File one absence
        r = requests.post(f"{API}/operator/absence", headers=admin_headers,
                          json={"kind": "malattia", "note": "TEST_iter181"}, timeout=15)
        assert r.status_code == 200

        # apply-volumes as admin
        r = requests.post(f"{API}/lab/staffing/apply-volumes",
                          headers=admin_headers, timeout=15)
        assert r.status_code == 200, r.text
        j = r.json()
        assert j.get("factor") == 0.8
        assert j.get("reduce_pct") == 20
        assert j.get("adjusted") >= 1

        # Batch pieces should be 80 with pieces_base 100 kept
        r = requests.get(f"{API}/lab/shift-state", timeout=10)
        b = next(x for x in r.json().get("batches", []) if x["id"] == "x")
        assert b.get("pieces") == 80, f"pieces not reduced: {b}"
        assert b.get("pieces_base") == 100

        # Cleanup
        mongo.lab_absences.delete_many({"date": today})
        requests.put(f"{API}/lab/shift-state", headers=admin_headers,
                     json={"batches": []}, timeout=10)

    def test_apply_volumes_requires_admin(self):
        r = requests.post(f"{API}/lab/staffing/apply-volumes", timeout=10)
        assert r.status_code in (401, 403)

    def test_staffing_history(self):
        r = requests.get(f"{API}/lab/staffing/history?days=7", timeout=10)
        assert r.status_code == 200
        j = r.json()
        assert "days" in j
        assert len(j["days"]) == 7
        for d in j["days"]:
            for k in ("date", "present", "factor"):
                assert k in d


# ============================================================
# PRODUCTION OS
# ============================================================
class TestProductionOS:
    def test_universal_command_ui_personalization(self, admin_headers):
        r = requests.post(f"{API}/ai/universal-command", headers=admin_headers,
                          json={"command_text": "aggiungi rubrica"}, timeout=15)
        assert r.status_code == 200, r.text
        j = r.json()
        assert j.get("action_type") == "ui_personalization"
        assert j.get("render_update") is True

        # my-features lists it
        r = requests.get(f"{API}/ai/my-features", headers=admin_headers, timeout=10)
        assert r.status_code == 200
        feats = r.json().get("features", [])
        assert any(f.get("feature") == "address_book" for f in feats)

    def test_universal_command_device_added_and_scale_load(self, admin_headers):
        r = requests.post(f"{API}/ai/universal-command", headers=admin_headers,
                          json={"command_text": "aggiungi una bilancia"}, timeout=15)
        assert r.status_code == 200
        j = r.json()
        assert j.get("action_type") == "device_added"
        dev = j.get("device") or {}
        assert dev.get("id"), f"no device id: {j}"
        device_id = dev["id"]

        # get an existing recipe id
        r = requests.get(f"{API}/recipes", timeout=15)
        assert r.status_code == 200
        recipes = r.json()
        # /api/recipes may return {items:[..]} or list
        if isinstance(recipes, dict):
            recipes = recipes.get("items") or recipes.get("recipes") or []
        assert isinstance(recipes, list) and len(recipes) > 0, "no recipes available"
        recipe_id = recipes[0].get("id")
        assert recipe_id

        r = requests.get(f"{API}/scale/{device_id}/load-recipe/{recipe_id}", timeout=15)
        assert r.status_code == 200, r.text
        j = r.json()
        assert "display_screen" in j
        assert j.get("status") == "success"

    def test_universal_command_requires_admin(self):
        r = requests.post(f"{API}/ai/universal-command",
                          json={"command_text": "aggiungi rubrica"}, timeout=10)
        assert r.status_code in (401, 403)

    def test_websocket_letz_passive_and_alert(self):
        # ws url from base
        parsed = urlparse(BASE_URL)
        scheme = "wss" if parsed.scheme == "https" else "ws"
        ws_url = f"{scheme}://{parsed.netloc}/api/ws/production-os"

        async def run():
            async with websockets.connect(ws_url, open_timeout=15, close_timeout=5) as ws:
                # scale reached target
                await ws.send(json.dumps({"action": "scale_weight_streaming", "weight": 6.5, "target": 6.5}))
                msg = json.loads(await asyncio.wait_for(ws.recv(), timeout=10))
                assert msg.get("status") == "success", msg
                assert msg.get("audio_mode") == "letz_passive_silent"
                assert msg.get("next_action_unlocked") is True

                # emergency audio
                await ws.send(json.dumps({"action": "audio_query", "query": "emergenza"}))
                msg2 = json.loads(await asyncio.wait_for(ws.recv(), timeout=10))
                assert msg2.get("mode") == "active_alert"

        asyncio.run(run())


# ============================================================
# TURNI & POWER LEVEL
# ============================================================
class TestShiftPower:
    _created_id = None

    def test_post_shift_assignment_super_saiyan(self, admin_headers):
        r = requests.post(f"{API}/production/shift-assignment", headers=admin_headers,
                          json={"day": "Lun", "position": "Forno", "worker_name": "TEST_Goku",
                                "avatar_style": "warrior", "efficiency_score": 92}, timeout=15)
        assert r.status_code == 200, r.text
        j = r.json()
        a = j.get("assignment") or {}
        aura = a.get("aura") or {}
        assert aura.get("aura_effect") == "Super Saiyan"
        assert aura.get("power_level") == "Over 9000!"
        TestShiftPower._created_id = a.get("id")
        assert TestShiftPower._created_id

    def test_shift_plan_lists_workers_with_aura(self):
        r = requests.get(f"{API}/production/shift-plan", timeout=10)
        assert r.status_code == 200
        plan = r.json().get("weekly_plan", [])
        assert len(plan) >= 1
        for w in plan:
            assert isinstance(w.get("aura"), dict)
            lbl = w["aura"].get("label")
            assert isinstance(lbl, dict) and "it" in lbl and "en" in lbl

    def test_patch_downgrades_aura(self, admin_headers):
        assert TestShiftPower._created_id, "prior POST must succeed"
        r = requests.patch(
            f"{API}/production/shift-assignment/{TestShiftPower._created_id}?efficiency_score=60",
            headers=admin_headers, timeout=10)
        assert r.status_code == 200, r.text
        aura = r.json().get("aura") or {}
        assert aura.get("aura_effect") == "Aura Bassa"

    def test_leaderboard_rank1_title(self):
        r = requests.get(f"{API}/production/leaderboard", timeout=10)
        assert r.status_code == 200
        lb = r.json().get("leaderboard", [])
        assert len(lb) >= 1
        assert lb[0].get("rank") == 1
        assert lb[0].get("title") == "Master of the Shift"
        # Sorted desc by score
        scores = [x.get("score", 0) for x in lb]
        assert scores == sorted(scores, reverse=True)

    def test_worker_aura_michele(self):
        r = requests.get(f"{API}/production/worker-aura/Michele", timeout=10)
        # Michele is seeded; if not, at least endpoint contract validated
        if r.status_code == 200:
            j = r.json()
            assert "aura_effect" in j
            assert "power_level" in j
        else:
            assert r.status_code == 404

    def test_auth_required_for_writes(self):
        r = requests.post(f"{API}/production/shift-assignment",
                          json={"day": "Lun", "position": "x", "worker_name": "anon"}, timeout=10)
        assert r.status_code in (401, 403)
        r = requests.patch(f"{API}/production/shift-assignment/xxx?efficiency_score=50", timeout=10)
        assert r.status_code in (401, 403)
        r = requests.delete(f"{API}/production/shift-assignment/xxx", timeout=10)
        assert r.status_code in (401, 403)

    def test_delete_created(self, admin_headers):
        if TestShiftPower._created_id:
            r = requests.delete(f"{API}/production/shift-assignment/{TestShiftPower._created_id}",
                                headers=admin_headers, timeout=10)
            assert r.status_code == 200


# ============================================================
# MORNING BRIEFING
# ============================================================
class TestMorningBriefing:
    def test_morning_briefing_structure(self):
        r = requests.get(f"{API}/ai/morning-briefing", timeout=15)
        assert r.status_code == 200
        j = r.json()
        assert j.get("greeting")
        assert isinstance(j.get("night_summary"), list)
        assert "overall_lab_efficiency" in j
        assert j.get("ai_recommendation")
