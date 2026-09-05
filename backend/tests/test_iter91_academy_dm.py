# ============================================================================
#  MIKILAB PRO & BakoMix AI — PROPRIETARY & CONFIDENTIAL
#  (c) 2026 MikiLab Pro. Tutti i diritti riservati / All rights reserved.
#  Unico proprietario legale: il Master. Sole legal owner: the Master.
#  Codice riservato: vietata copia, distribuzione, reverse engineering o
#  cloning non autorizzati. Unauthorized copying, distribution, reverse
#  engineering or cloning is strictly prohibited and actively tracked by
#  the BakoMix AI Security Guardian.
# ============================================================================
"""Iteration 91 — Academy Coach (SSE), Evolving Quiz (AI), DM regression (conversations/unread)."""
import json
import os
import re

import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
base_url = os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")
if not base_url:
    raise RuntimeError("REACT_APP_BACKEND_URL missing")
BASE_URL = base_url.rstrip("/")
API = f"{BASE_URL}/api"

AMICO1 = {"email": "amico1@mikilab.de", "password": "Test1234!"}
AMICO2 = {"email": "amico2@mikilab.de", "password": "Test1234!"}


def login(creds):
    r = requests.post(f"{API}/auth/login", json=creds, timeout=30)
    assert r.status_code == 200, f"login failed {r.status_code}: {r.text[:300]}"
    tok = r.json().get("session_token")
    assert tok, "no session_token in login response"
    return tok, r.json().get("user", {})


def hdr(tok):
    return {"Authorization": f"Bearer {tok}", "Content-Type": "application/json"}


# --- Academy Quiz ---------------------------------------------------------
class TestAcademyQuiz:
    @pytest.mark.parametrize("level", ["apprendista", "avanzato", "master"])
    @pytest.mark.parametrize("lang", ["it", "en"])
    def test_quiz_levels_langs(self, level, lang):
        r = requests.post(f"{API}/academy/quiz", json={"level": level, "lang": lang}, timeout=120)
        assert r.status_code == 200, f"{r.status_code}: {r.text[:300]}"
        d = r.json()
        assert d["level"] == level
        assert isinstance(d["question"], str) and len(d["question"]) > 10
        assert isinstance(d["options"], list) and 2 <= len(d["options"]) <= 4
        assert all(isinstance(o, str) and o.strip() for o in d["options"])
        assert isinstance(d["correct"], int) and 0 <= d["correct"] < len(d["options"])
        assert isinstance(d["explanation"], str) and len(d["explanation"]) > 10

    def test_quiz_invalid_level_falls_back(self):
        r = requests.post(f"{API}/academy/quiz", json={"level": "bogus", "lang": "it"}, timeout=120)
        assert r.status_code == 200
        assert r.json()["level"] == "apprendista"

    def test_quiz_avoid_repetition(self):
        r1 = requests.post(f"{API}/academy/quiz", json={"level": "apprendista", "lang": "it"}, timeout=120)
        q1 = r1.json()["question"]
        r2 = requests.post(f"{API}/academy/quiz", json={"level": "apprendista", "lang": "it", "asked": [q1]}, timeout=120)
        assert r2.status_code == 200
        assert r2.json()["question"] != q1


# --- Academy Coach (SSE) --------------------------------------------------
def collect_sse(payload, timeout=180):
    text, done = "", False
    with requests.post(f"{API}/academy/coach", json=payload, stream=True, timeout=timeout) as r:
        assert r.status_code == 200, f"{r.status_code}: {r.text[:300]}"
        assert "text/event-stream" in r.headers.get("content-type", "")
        for line in r.iter_lines(decode_unicode=True):
            if not line or not line.startswith("data:"):
                continue
            obj = json.loads(line[5:].strip())
            if obj.get("done"):
                done = True
                break
            if obj.get("d"):
                text += obj["d"]
    return text, done


class TestAcademyCoach:
    @pytest.mark.parametrize("lang", ["it", "en"])
    def test_coach_stream(self, lang):
        msg = {
            "it": "Voglio sfornare pane domenica alle 12:30 con pasta madre, calcolami la timeline a ritroso.",
            "en": "I want to bake bread Sunday at 12:30 with sourdough, calculate the backwards timeline.",
        }[lang]
        text, done = collect_sse({"session_id": f"test-iter91-{lang}", "message": msg, "lang": lang})
        assert done, "stream did not send done:true"
        assert len(text) > 100, f"answer too short: {text[:200]}"
        emojis = [e for e in ("⚡", "🥖", "⏱️", "🔘") if e in text]
        assert len(emojis) >= 3, f"missing structure emojis, found {emojis} in: {text[:400]}"


# --- DM regression --------------------------------------------------------
class TestDirectMessages:
    @classmethod
    def setup_class(cls):
        cls.t1, cls.u1 = login(AMICO1)
        cls.t2, cls.u2 = login(AMICO2)
        cls.id1 = cls.u1.get("user_id") or cls.u1.get("id")
        cls.id2 = cls.u2.get("user_id") or cls.u2.get("id")
        assert cls.id1 and cls.id2
        # ensure friendship
        fr = requests.get(f"{API}/friends", headers=hdr(cls.t1), timeout=30)
        friends = fr.json() if fr.status_code == 200 else []
        ids = [f.get("user_id") or f.get("id") for f in (friends.get("friends") if isinstance(friends, dict) else friends) or []]
        if cls.id2 not in ids:
            requests.post(f"{API}/friends/request", headers=hdr(cls.t1), json={"to_id": cls.id2}, timeout=30)
            rq = requests.get(f"{API}/friends/requests", headers=hdr(cls.t2), timeout=30)
            if rq.status_code == 200:
                items = rq.json()
                items = items.get("requests") if isinstance(items, dict) else items
                for it in items or []:
                    rid = it.get("request_id") or it.get("id")
                    requests.post(f"{API}/friends/respond", headers=hdr(cls.t2),
                                  json={"request_id": rid, "accept": True}, timeout=30)

    def test_send_and_unread_flow(self):
        text = f"TEST_iter91 msg {os.urandom(3).hex()}"
        # amico2 -> amico1
        r = requests.post(f"{API}/community/messages", headers=hdr(self.t2),
                          json={"to_id": self.id1, "text": text}, timeout=30)
        assert r.status_code in (200, 201), f"{r.status_code}: {r.text[:300]}"

        # amico1 conversations show unread
        c = requests.get(f"{API}/community/conversations", headers=hdr(self.t1), timeout=30)
        assert c.status_code == 200, c.text[:300]
        convos = c.json()
        convos = convos.get("conversations") if isinstance(convos, dict) else convos
        mine = [x for x in convos if x.get("other_id") == self.id2]
        assert mine, f"conversation with amico2 missing: {json.dumps(convos)[:400]}"
        conv = mine[0]
        assert "name" in conv and "last" in conv and "unread" in conv
        assert conv["unread"] >= 1, f"unread not counted: {conv}"
        assert "other_id" in conv

        # open thread -> marks read
        t = requests.get(f"{API}/community/messages/{self.id2}", headers=hdr(self.t1), timeout=30)
        assert t.status_code == 200, t.text[:300]
        th = t.json()
        assert "messages" in th and "other" in th
        assert any(m.get("text") == text for m in th["messages"]), "sent message not in thread"
        assert "_id" not in th["messages"][0]

        # unread back to 0
        c2 = requests.get(f"{API}/community/conversations", headers=hdr(self.t1), timeout=30)
        convos2 = c2.json()
        convos2 = convos2.get("conversations") if isinstance(convos2, dict) else convos2
        conv2 = [x for x in convos2 if x.get("other_id") == self.id2][0]
        assert conv2["unread"] == 0, f"unread not cleared: {conv2}"

    def test_reply_appears_both_sides(self):
        text = f"TEST_iter91 reply {os.urandom(3).hex()}"
        r = requests.post(f"{API}/community/messages", headers=hdr(self.t1),
                          json={"to_id": self.id2, "text": text}, timeout=30)
        assert r.status_code in (200, 201)
        t = requests.get(f"{API}/community/messages/{self.id1}", headers=hdr(self.t2), timeout=30)
        assert t.status_code == 200
        assert any(m.get("text") == text for m in t.json()["messages"])

    def test_message_requires_auth(self):
        r = requests.post(f"{API}/community/messages", json={"to_id": self.id1, "text": "nope"}, timeout=30)
        assert r.status_code in (401, 403), f"unauthenticated DM allowed: {r.status_code}"

    def test_empty_message_rejected(self):
        r = requests.post(f"{API}/community/messages", headers=hdr(self.t1),
                          json={"to_id": self.id2, "text": "   "}, timeout=30)
        assert r.status_code in (400, 422), f"empty message accepted: {r.status_code} {r.text[:200]}"
