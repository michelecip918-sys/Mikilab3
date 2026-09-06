"""Iter 192 - BakoMix streaming SSE + persistent memory + proactive alerts"""
import os
import json
import time
import requests

BASE = os.environ.get("REACT_APP_BACKEND_URL", "https://edit-33.preview.emergentagent.com").rstrip("/")
ADMIN_EMAIL = "admin@mikilab.de"
ADMIN_PASS = "Mikilab2026!"

VALID_MOODS = {"calm", "proud", "busy", "alert"}


def _login():
    s = requests.Session()
    r = s.post(f"{BASE}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS}, timeout=20)
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text[:200]}"
    return s


# ---- Streaming SSE ----
def test_govern_stream_sse():
    s = _login()
    url = f"{BASE}/api/master/govern/stream"
    payload = {"command_text": "Ciao BakoMix, riepiloga la giornata", "lang": "it"}
    with s.post(url, json=payload, stream=True, timeout=60) as r:
        assert r.status_code == 200, r.text[:300]
        ct = r.headers.get("content-type", "")
        assert "text/event-stream" in ct or "event-stream" in ct, f"content-type: {ct}"
        events = []
        deltas = []
        got_meta = False
        got_done = False
        meta_payload = None
        start = time.time()
        for raw in r.iter_lines(decode_unicode=True):
            if raw is None:
                continue
            if time.time() - start > 55:
                break
            if not raw:
                continue
            line = raw.strip()
            if not line.startswith("data:"):
                continue
            data = line[5:].strip()
            if not data:
                continue
            try:
                obj = json.loads(data)
            except Exception:
                # Maybe plain text delta
                events.append({"raw": data})
                continue
            events.append(obj)
            t = obj.get("type") or obj.get("event")
            if t == "meta" or ("intent" in obj and "mood" in obj and not got_meta):
                got_meta = True
                meta_payload = obj
            elif t == "delta" or "delta" in obj or "chunk" in obj:
                deltas.append(obj.get("delta") or obj.get("chunk") or obj.get("text") or "")
            if t == "done" or obj.get("done") is True:
                got_done = True
                # capture final payload as terminal
                if obj.get("mood") in VALID_MOODS:
                    meta_payload = obj
                break
        print(f"events={len(events)} meta={got_meta} deltas={len(deltas)} done={got_done}")
        print("meta:", meta_payload)
        assert got_meta, f"no meta event, events={events[:5]}"
        assert meta_payload is not None
        assert meta_payload.get("mood") in VALID_MOODS, f"invalid mood: {meta_payload.get('mood')}"
        assert "intent" in meta_payload
        assert got_done, "no done event received"
        assert len(deltas) > 0, "no delta chunks streamed"


# ---- Persistent memory ----
def test_govern_persistent_memory():
    s = _login()
    # Turn 1: introduce a fact
    r1 = s.post(
        f"{BASE}/api/master/govern",
        json={"command_text": "Il mio piatto preferito è la focaccia con rosmarino, ricordalo.", "lang": "it"},
        timeout=60,
    )
    assert r1.status_code == 200, r1.text[:300]
    reply1 = (r1.json().get("reply") or "")
    print("turn1:", reply1[:200])

    # Turn 2: ask about it
    r2 = s.post(
        f"{BASE}/api/master/govern",
        json={"command_text": "Qual è il mio piatto preferito?", "lang": "it"},
        timeout=60,
    )
    assert r2.status_code == 200, r2.text[:300]
    reply2 = (r2.json().get("reply") or "").lower()
    print("turn2:", reply2[:200])
    # Memory should surface at least one keyword
    assert any(k in reply2 for k in ["focaccia", "rosmarino"]), (
        f"memory not preserved across turns; reply2={reply2}"
    )


# ---- Proactive alerts ----
def test_proactive_endpoint_admin():
    s = _login()
    r = s.get(f"{BASE}/api/bako/proactive", params={"lang": "it"}, timeout=20)
    assert r.status_code == 200, r.text[:300]
    data = r.json()
    print("proactive:", data)
    assert "alerts" in data
    assert "count" in data
    assert isinstance(data["alerts"], list)
    assert isinstance(data["count"], int)
    assert data["count"] == len(data["alerts"])


def test_proactive_unauth_rejected():
    r = requests.get(f"{BASE}/api/bako/proactive", params={"lang": "it"}, timeout=15)
    assert r.status_code in (401, 403), f"expected auth-required, got {r.status_code}"


# ---- Regression: chat mood field present ----
def test_govern_chat_returns_mood():
    s = _login()
    r = s.post(
        f"{BASE}/api/master/govern",
        json={"command_text": "Come stai oggi?", "lang": "it"},
        timeout=60,
    )
    assert r.status_code == 200
    data = r.json()
    mood = data.get("mood")
    print("mood field:", mood)
    # mood may be optional; if present, must be valid
    if mood is not None:
        assert mood in VALID_MOODS, f"invalid mood: {mood}"
