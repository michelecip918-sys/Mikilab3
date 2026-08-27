"""Iteration 94 — SOS recipe suggestion, Weekly Challenge leaderboard, chat reactions."""
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

A1 = ("amico1@mikilab.de", "Test1234!")
A2 = ("amico2@mikilab.de", "Test1234!")
ADMIN = ("admin@mikilab.de", "Mikilab2026!")


def _login(creds):
    r = requests.post(f"{API}/auth/login", json={"email": creds[0], "password": creds[1]}, timeout=30)
    if r.status_code != 200:
        pytest.fail(f"login failed {creds[0]}: {r.status_code} {r.text[:300]}")
    tok = r.json().get("session_token")
    assert tok, "no session_token in login response"
    return tok


def _sess(token):
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json", "Authorization": f"Bearer {token}"})
    return s


@pytest.fixture(scope="module")
def c1():
    return _sess(_login(A1))


@pytest.fixture(scope="module")
def c2():
    return _sess(_login(A2))


@pytest.fixture(scope="module")
def cadmin():
    return _sess(_login(ADMIN))


@pytest.fixture(scope="module")
def me1(c1):
    r = c1.get(f"{API}/auth/me", timeout=30)
    assert r.status_code == 200, r.text[:300]
    return r.json()


@pytest.fixture(scope="module")
def me2(c2):
    r = c2.get(f"{API}/auth/me", timeout=30)
    assert r.status_code == 200, r.text[:300]
    return r.json()


# --- Module: /api/academy/sos-recipe ---
class TestSosRecipe:
    def test_requires_auth(self):
        r = requests.post(f"{API}/academy/sos-recipe", json={"diagnosis": "x", "lang": "it"}, timeout=30)
        assert r.status_code in (401, 403), r.status_code

    def test_empty_diagnosis_400(self, c1):
        r = c1.post(f"{API}/academy/sos-recipe", json={"diagnosis": "   ", "lang": "it"}, timeout=30)
        assert r.status_code == 400, f"{r.status_code} {r.text[:300]}"

    def test_suggests_valid_mikilab_recipe(self, c1):
        diag = ("La mollica e' compatta e gommosa, alveolatura assente, crosta pallida. "
                "Probabile lievitazione insufficiente e impasto poco incordato.")
        r = c1.post(f"{API}/academy/sos-recipe", json={"diagnosis": diag, "lang": "it"}, timeout=180)
        assert r.status_code == 200, f"{r.status_code} {r.text[:300]}"
        d = r.json()
        assert d.get("recipe_id"), f"no recipe suggested: {d}"
        assert isinstance(d["name"], str) and d["name"].strip()
        assert isinstance(d.get("reason", ""), str) and len(d.get("reason", "")) > 3
        # recipe_id must belong to MikiLab recipes
        rl = c1.get(f"{API}/recipes?collection=mikilab", timeout=60)
        assert rl.status_code == 200, rl.text[:300]
        items = rl.json()
        items = items.get("recipes") if isinstance(items, dict) else items
        ids = {x["id"] for x in items}
        assert d["recipe_id"] in ids, f"{d['recipe_id']} not in mikilab recipes"


# --- Module: /api/academy/leaderboard (Weekly Challenge) ---
class TestLeaderboard:
    def test_requires_auth(self):
        r = requests.get(f"{API}/academy/leaderboard", timeout=30)
        assert r.status_code in (401, 403), r.status_code

    def test_structure_and_sorting(self, c1, me1):
        r = c1.get(f"{API}/academy/leaderboard", timeout=60)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        assert "week" in d and "rows" in d and "champion" in d
        assert isinstance(d["week"], str) and len(d["week"]) >= 6
        rows = d["rows"]
        assert isinstance(rows, list) and len(rows) >= 1
        for row in rows:
            for k in ("user_id", "name", "points", "diplomato", "champion", "me"):
                assert k in row, f"missing {k} in {row}"
            assert isinstance(row["diplomato"], bool)
            assert isinstance(row["champion"], bool)
            assert "_id" not in row
        pts = [x["points"] for x in rows]
        assert pts == sorted(pts, reverse=True), f"rows not sorted desc: {pts}"
        mine = [x for x in rows if x["me"]]
        assert len(mine) == 1, "current user must appear exactly once"
        assert mine[0]["user_id"] == me1.get("user_id") or mine[0]["user_id"] == me1.get("id")
        if d["champion"] is not None:
            assert "name" in d["champion"] and "points" in d["champion"]

    def test_amico1_is_leader_with_points(self, c1):
        d = c1.get(f"{API}/academy/leaderboard", timeout=60).json()
        rows = d["rows"]
        me = next(x for x in rows if x["me"])
        assert me["points"] > 0, f"amico1 expected >0 points this week: {me}"
        assert rows[0]["me"] is True, f"amico1 expected first: {rows[:3]}"
        assert me["diplomato"] is True, "amico1 expected diplomato badge"

    def test_friend_sees_shared_board(self, c2, me1):
        d = c2.get(f"{API}/academy/leaderboard", timeout=60).json()
        ids = {x["user_id"] for x in d["rows"]}
        assert (me1.get("user_id") or me1.get("id")) in ids, "amico1 must be visible to amico2 (friends)"


# --- Module: /api/community/messages/{id}/react ---
class TestReactions:
    @pytest.fixture(scope="class")
    def msg_id(self, c1, me2):
        oid = me2.get("user_id") or me2.get("id")
        r = c1.post(f"{API}/community/messages", json={"to_id": oid, "text": "TEST_iter94 reaction target"}, timeout=30)
        assert r.status_code == 200, r.text[:300]
        mid = r.json()["id"]
        yield mid
        requests.delete(f"{API}/nonexistent", timeout=5) if False else None

    def test_requires_auth(self, msg_id):
        r = requests.post(f"{API}/community/messages/{msg_id}/react", json={"emoji": "👍"}, timeout=30)
        assert r.status_code in (401, 403), r.status_code

    def test_invalid_emoji_400(self, c1, msg_id):
        r = c1.post(f"{API}/community/messages/{msg_id}/react", json={"emoji": "ZZ"}, timeout=30)
        assert r.status_code == 400, f"{r.status_code} {r.text[:300]}"

    def test_unknown_message_404(self, c1):
        r = c1.post(f"{API}/community/messages/does-not-exist/react", json={"emoji": "🔥"}, timeout=30)
        assert r.status_code == 404, r.status_code

    def test_foreign_message_404(self, c1, cadmin, me2):
        # admin -> amico2 message; amico1 is neither sender nor recipient
        oid = me2.get("user_id") or me2.get("id")
        r = cadmin.post(f"{API}/community/messages", json={"to_id": oid, "text": "TEST_iter94 foreign"}, timeout=30)
        assert r.status_code == 200, r.text[:300]
        fid = r.json()["id"]
        rr = c1.post(f"{API}/community/messages/{fid}/react", json={"emoji": "👍"}, timeout=30)
        assert rr.status_code == 404, f"expected 404 got {rr.status_code} {rr.text[:200]}"

    def test_add_change_toggle(self, c1, msg_id, me1, me2):
        uid = me1.get("user_id") or me1.get("id")
        # add
        r = c1.post(f"{API}/community/messages/{msg_id}/react", json={"emoji": "👍"}, timeout=30)
        assert r.status_code == 200, r.text[:300]
        assert r.json()["reactions"] == [{"user_id": uid, "emoji": "👍"}]
        # persisted in thread
        oid = me2.get("user_id") or me2.get("id")
        th = c1.get(f"{API}/community/messages/{oid}", timeout=30).json()
        m = next(x for x in th["messages"] if x["id"] == msg_id)
        assert m.get("reactions") == [{"user_id": uid, "emoji": "👍"}]
        # change emoji
        r = c1.post(f"{API}/community/messages/{msg_id}/react", json={"emoji": "🔥"}, timeout=30)
        assert r.json()["reactions"] == [{"user_id": uid, "emoji": "🔥"}]
        # toggle off same emoji
        r = c1.post(f"{API}/community/messages/{msg_id}/react", json={"emoji": "🔥"}, timeout=30)
        assert r.json()["reactions"] == [], r.json()
        th = c1.get(f"{API}/community/messages/{oid}", timeout=30).json()
        m = next(x for x in th["messages"] if x["id"] == msg_id)
        assert (m.get("reactions") or []) == []

    def test_both_participants_can_react(self, c1, c2, msg_id, me1, me2):
        u1 = me1.get("user_id") or me1.get("id")
        u2 = me2.get("user_id") or me2.get("id")
        c1.post(f"{API}/community/messages/{msg_id}/react", json={"emoji": "🥖"}, timeout=30)
        r = c2.post(f"{API}/community/messages/{msg_id}/react", json={"emoji": "👍"}, timeout=30)
        assert r.status_code == 200, r.text[:300]
        pairs = {(x["user_id"], x["emoji"]) for x in r.json()["reactions"]}
        assert (u1, "🥖") in pairs and (u2, "👍") in pairs, pairs
        # cleanup reactions
        c1.post(f"{API}/community/messages/{msg_id}/react", json={"emoji": "🥖"}, timeout=30)
        c2.post(f"{API}/community/messages/{msg_id}/react", json={"emoji": "👍"}, timeout=30)


# --- Regression: chat send + quiz basics ---
class TestRegression:
    def test_send_text_and_image(self, c1, me2):
        oid = me2.get("user_id") or me2.get("id")
        r = c1.post(f"{API}/community/messages", json={"to_id": oid, "text": "TEST_iter94 regression"}, timeout=30)
        assert r.status_code == 200 and r.json()["text"] == "TEST_iter94 regression"
        r = c1.post(f"{API}/community/messages", json={"to_id": oid, "image_url": "https://example.com/x.jpg"}, timeout=30)
        assert r.status_code == 200 and r.json()["image_url"]
        r = c1.post(f"{API}/community/messages", json={"to_id": oid, "text": ""}, timeout=30)
        assert r.status_code == 400

    def test_conversations_and_unread(self, c2, me1):
        r = c2.get(f"{API}/community/conversations", timeout=30)
        assert r.status_code == 200
        convos = r.json()["conversations"]
        uid = me1.get("user_id") or me1.get("id")
        c = next((x for x in convos if x["other_id"] == uid), None)
        assert c is not None, "conversation with amico1 missing"
        assert c["unread"] >= 1, f"expected unread>=1 got {c}"
        th = c2.get(f"{API}/community/messages/{uid}", timeout=30)
        assert th.status_code == 200
        r2 = c2.get(f"{API}/community/conversations", timeout=30).json()["conversations"]
        c2v = next(x for x in r2 if x["other_id"] == uid)
        assert c2v["unread"] == 0, f"unread not reset: {c2v}"

    def test_quiz_endpoint(self, c1):
        r = c1.post(f"{API}/academy/quiz", json={"lang": "it"}, timeout=180)
        assert r.status_code == 200, f"{r.status_code} {r.text[:300]}"
        d = r.json()
        assert isinstance(d, dict) and d, "empty quiz response"
