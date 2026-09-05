# ============================================================================
#  MIKILAB PRO & BakoMix AI — PROPRIETARY & CONFIDENTIAL
#  (c) 2026 MikiLab Pro. Tutti i diritti riservati / All rights reserved.
#  Unico proprietario legale: il Master. Sole legal owner: the Master.
#  Codice riservato: vietata copia, distribuzione, reverse engineering o
#  cloning non autorizzati. Unauthorized copying, distribution, reverse
#  engineering or cloning is strictly prohibited and actively tracked by
#  the BakoMix AI Security Guardian.
# ============================================================================
"""Iteration 93 — chat photo messages, quiz leaderboard, web push/reminders, SOS history."""
import os

import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
base_url = os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")
if not base_url:
    raise RuntimeError("REACT_APP_BACKEND_URL missing")
BASE_URL = base_url.rstrip("/")

AMICO1 = {"email": "amico1@mikilab.de", "password": "Test1234!"}
AMICO2 = {"email": "amico2@mikilab.de", "password": "Test1234!"}

TEST_IMG = "https://customer-assets.emergentagent.com/test_image_iter93.jpg"


def _login(creds):
    r = requests.post(f"{BASE_URL}/api/auth/login", json=creds, timeout=30)
    if r.status_code != 200:
        pytest.fail(f"login failed for {creds['email']}: {r.status_code} {r.text[:300]}")
    d = r.json()
    assert d.get("session_token"), d
    return d["session_token"], d["user"]["user_id"]


@pytest.fixture(scope="module")
def a1():
    t, uid = _login(AMICO1)
    return {"headers": {"Authorization": f"Bearer {t}"}, "user_id": uid, "token": t}


@pytest.fixture(scope="module")
def a2():
    t, uid = _login(AMICO2)
    return {"headers": {"Authorization": f"Bearer {t}"}, "user_id": uid, "token": t}


# --- 1. Chat photo messages -------------------------------------------------
class TestChatPhoto:
    def test_send_requires_auth(self, a2):
        r = requests.post(f"{BASE_URL}/api/community/messages",
                          json={"to_id": a2["user_id"], "text": "TEST_noauth"}, timeout=30)
        assert r.status_code in (401, 403), r.text[:200]

    def test_send_text_message(self, a1, a2):
        r = requests.post(f"{BASE_URL}/api/community/messages",
                          json={"to_id": a2["user_id"], "text": "TEST_iter93 testo"},
                          headers=a1["headers"], timeout=30)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        assert d["text"] == "TEST_iter93 testo"
        assert d["image_url"] is None
        assert "_id" not in d
        assert d["from_id"] == a1["user_id"] and d["to_id"] == a2["user_id"]

    def test_send_photo_with_text(self, a1, a2):
        r = requests.post(f"{BASE_URL}/api/community/messages",
                          json={"to_id": a2["user_id"], "text": "TEST_iter93 foto+testo", "image_url": TEST_IMG},
                          headers=a1["headers"], timeout=30)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        assert d["image_url"] == TEST_IMG
        assert d["text"] == "TEST_iter93 foto+testo"

    def test_send_photo_only(self, a1, a2):
        r = requests.post(f"{BASE_URL}/api/community/messages",
                          json={"to_id": a2["user_id"], "text": "", "image_url": TEST_IMG},
                          headers=a1["headers"], timeout=30)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        assert d["text"] == ""
        assert d["image_url"] == TEST_IMG
        # persistence: fetch thread from receiver side
        g = requests.get(f"{BASE_URL}/api/community/messages/{a1['user_id']}",
                         headers=a2["headers"], timeout=30)
        assert g.status_code == 200, g.text[:300]
        gd = g.json()
        assert "messages" in gd and "other" in gd
        ids = [m["id"] for m in gd["messages"]]
        assert d["id"] in ids, "photo-only message not returned in thread"
        found = next(m for m in gd["messages"] if m["id"] == d["id"])
        assert found["image_url"] == TEST_IMG
        assert all("_id" not in m for m in gd["messages"])

    def test_empty_message_rejected(self, a1, a2):
        r = requests.post(f"{BASE_URL}/api/community/messages",
                          json={"to_id": a2["user_id"], "text": "", "image_url": ""},
                          headers=a1["headers"], timeout=30)
        assert r.status_code == 400, r.text[:200]

    def test_missing_to_id_rejected(self, a1):
        r = requests.post(f"{BASE_URL}/api/community/messages",
                          json={"to_id": "", "text": "hi"},
                          headers=a1["headers"], timeout=30)
        assert r.status_code == 400, r.text[:200]

    def test_conversations_lists_thread(self, a1, a2):
        r = requests.get(f"{BASE_URL}/api/community/conversations", headers=a1["headers"], timeout=30)
        assert r.status_code == 200, r.text[:300]
        convos = r.json()["conversations"]
        assert any(c["other_id"] == a2["user_id"] for c in convos), convos
        c = next(c for c in convos if c["other_id"] == a2["user_id"])
        assert c.get("name")
        # photo-only last message preview (documented behaviour check)
        print("conversation last preview:", repr(c.get("last")))


# --- 2. Quiz score + leaderboard -------------------------------------------
class TestLeaderboard:
    def test_score_requires_auth(self):
        r = requests.post(f"{BASE_URL}/api/academy/quiz-score", json={"points": 1}, timeout=30)
        assert r.status_code in (401, 403)

    def test_leaderboard_requires_auth(self):
        r = requests.get(f"{BASE_URL}/api/academy/leaderboard", timeout=30)
        assert r.status_code in (401, 403)

    def test_score_increments(self, a1):
        before = requests.get(f"{BASE_URL}/api/academy/leaderboard", headers=a1["headers"], timeout=30)
        assert before.status_code == 200, before.text[:300]
        b = before.json()
        assert "week" in b and isinstance(b["rows"], list)
        my_before = next(r for r in b["rows"] if r["me"])["points"]

        s = requests.post(f"{BASE_URL}/api/academy/quiz-score", json={"points": 2},
                          headers=a1["headers"], timeout=30)
        assert s.status_code == 200, s.text[:300]
        assert s.json().get("ok") is True
        assert s.json().get("week") == b["week"]

        after = requests.get(f"{BASE_URL}/api/academy/leaderboard", headers=a1["headers"], timeout=30)
        rows = after.json()["rows"]
        mine = next(r for r in rows if r["me"])
        assert mine["points"] == my_before + 2, (my_before, mine)
        assert mine["diplomato"] is True, "amico1 should have diplomato badge"
        assert mine.get("name")

    def test_leaderboard_sorted_and_includes_friend(self, a1, a2):
        r = requests.get(f"{BASE_URL}/api/academy/leaderboard", headers=a1["headers"], timeout=30)
        rows = r.json()["rows"]
        pts = [x["points"] for x in rows]
        assert pts == sorted(pts, reverse=True), pts
        ids = [x["user_id"] for x in rows]
        assert a1["user_id"] in ids and a2["user_id"] in ids, ids
        assert sum(1 for x in rows if x["me"]) == 1

    def test_score_zero_noop(self, a1):
        before = requests.get(f"{BASE_URL}/api/academy/leaderboard", headers=a1["headers"], timeout=30)
        p0 = next(x for x in before.json()["rows"] if x["me"])["points"]
        r = requests.post(f"{BASE_URL}/api/academy/quiz-score", json={"points": 0},
                          headers=a1["headers"], timeout=30)
        assert r.status_code == 200
        after = requests.get(f"{BASE_URL}/api/academy/leaderboard", headers=a1["headers"], timeout=30)
        assert next(x for x in after.json()["rows"] if x["me"])["points"] == p0

    def test_score_clamped_to_10(self, a1):
        before = requests.get(f"{BASE_URL}/api/academy/leaderboard", headers=a1["headers"], timeout=30)
        p0 = next(x for x in before.json()["rows"] if x["me"])["points"]
        r = requests.post(f"{BASE_URL}/api/academy/quiz-score", json={"points": 9999},
                          headers=a1["headers"], timeout=30)
        assert r.status_code == 200
        after = requests.get(f"{BASE_URL}/api/academy/leaderboard", headers=a1["headers"], timeout=30)
        assert next(x for x in after.json()["rows"] if x["me"])["points"] == p0 + 10

    def test_negative_points_ignored(self, a1):
        before = requests.get(f"{BASE_URL}/api/academy/leaderboard", headers=a1["headers"], timeout=30)
        p0 = next(x for x in before.json()["rows"] if x["me"])["points"]
        r = requests.post(f"{BASE_URL}/api/academy/quiz-score", json={"points": -5},
                          headers=a1["headers"], timeout=30)
        assert r.status_code == 200
        after = requests.get(f"{BASE_URL}/api/academy/leaderboard", headers=a1["headers"], timeout=30)
        assert next(x for x in after.json()["rows"] if x["me"])["points"] == p0


# --- 3. Web push + reminders ----------------------------------------------
class TestPushReminders:
    def test_vapid_public(self):
        r = requests.get(f"{BASE_URL}/api/push/vapid", timeout=30)
        assert r.status_code == 200, r.text[:300]
        pk = r.json().get("public_key")
        assert isinstance(pk, str) and len(pk) > 40, pk
        # stable across calls
        r2 = requests.get(f"{BASE_URL}/api/push/vapid", timeout=30)
        assert r2.json()["public_key"] == pk

    def test_subscribe_requires_auth(self):
        r = requests.post(f"{BASE_URL}/api/push/subscribe",
                          json={"subscription": {"endpoint": "https://x/y"}}, timeout=30)
        assert r.status_code in (401, 403)

    def test_subscribe_ok(self, a1):
        sub = {"endpoint": "https://fcm.googleapis.com/fcm/send/TEST_iter93",
               "keys": {"p256dh": "abc", "auth": "def"}}
        r = requests.post(f"{BASE_URL}/api/push/subscribe", json={"subscription": sub},
                          headers=a1["headers"], timeout=30)
        assert r.status_code == 200, r.text[:300]
        assert r.json()["ok"] is True

    def test_subscribe_missing_endpoint_400(self, a1):
        r = requests.post(f"{BASE_URL}/api/push/subscribe", json={"subscription": {}},
                          headers=a1["headers"], timeout=30)
        assert r.status_code == 400, r.text[:200]

    def test_reminders_requires_auth(self):
        r = requests.post(f"{BASE_URL}/api/reminders", json={"steps": []}, timeout=30)
        assert r.status_code in (401, 403)

    def test_reminders_save(self, a1):
        from datetime import datetime, timedelta, timezone
        due = (datetime.now(timezone.utc) + timedelta(hours=3)).isoformat()
        steps = [{"time": "06:00", "label": "TEST_iter93 impasto", "due": due},
                 {"time": "08:00", "label": "TEST_iter93 sfornare", "due": due}]
        r = requests.post(f"{BASE_URL}/api/reminders", json={"steps": steps},
                          headers=a1["headers"], timeout=30)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        assert d["ok"] is True and d["count"] == 2, d

    def test_reminders_empty_ok(self, a1):
        r = requests.post(f"{BASE_URL}/api/reminders", json={"steps": []},
                          headers=a1["headers"], timeout=30)
        assert r.status_code == 200
        assert r.json()["count"] == 0

    def test_reminders_invalid_payload(self, a1):
        r = requests.post(f"{BASE_URL}/api/reminders", json={"steps": [{"time": "06:00"}]},
                          headers=a1["headers"], timeout=30)
        assert r.status_code == 422, r.text[:200]


# --- 4. SOS history --------------------------------------------------------
class TestSosHistory:
    def test_history_requires_auth(self):
        r = requests.get(f"{BASE_URL}/api/academy/sos-history", timeout=30)
        assert r.status_code in (401, 403)

    def test_history_list(self, a1):
        r = requests.get(f"{BASE_URL}/api/academy/sos-history", headers=a1["headers"], timeout=30)
        assert r.status_code == 200, r.text[:300]
        items = r.json()["items"]
        assert isinstance(items, list)
        assert len(items) >= 1, "amico1 should have at least 1 saved SOS diagnosis"
        it = items[0]
        for k in ("id", "result", "created_at"):
            assert k in it, it.keys()
        assert "_id" not in it
        assert isinstance(it["result"], str) and len(it["result"]) > 20
        assert "thumb" in it
        # sorted desc by created_at
        dates = [x["created_at"] for x in items]
        assert dates == sorted(dates, reverse=True)

    def test_delete_other_user_item_no_effect(self, a1, a2):
        r = requests.get(f"{BASE_URL}/api/academy/sos-history", headers=a1["headers"], timeout=30)
        items = r.json()["items"]
        target = items[0]["id"]
        d = requests.delete(f"{BASE_URL}/api/academy/sos-history/{target}",
                            headers=a2["headers"], timeout=30)
        assert d.status_code == 200, d.text[:200]
        # still there for owner
        again = requests.get(f"{BASE_URL}/api/academy/sos-history", headers=a1["headers"], timeout=30)
        assert target in [x["id"] for x in again.json()["items"]], "item deleted by non-owner!"

    def test_delete_own_item(self, a1):
        r = requests.get(f"{BASE_URL}/api/academy/sos-history", headers=a1["headers"], timeout=30)
        items = r.json()["items"]
        if len(items) < 2:
            pytest.skip("keep the single existing SOS item for frontend testing")
        target = items[-1]["id"]
        d = requests.delete(f"{BASE_URL}/api/academy/sos-history/{target}",
                            headers=a1["headers"], timeout=30)
        assert d.status_code == 200 and d.json()["ok"] is True
        after = requests.get(f"{BASE_URL}/api/academy/sos-history", headers=a1["headers"], timeout=30)
        assert target not in [x["id"] for x in after.json()["items"]]
