"""Iter 191 - BakoMix conversational governance tests"""
import os
import requests

BASE = os.environ.get("REACT_APP_BACKEND_URL", "https://edit-33.preview.emergentagent.com").rstrip("/")
ADMIN_EMAIL = "admin@mikilab.de"
ADMIN_PASS = "Mikilab2026!"


def _login():
    s = requests.Session()
    r = s.post(f"{BASE}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS}, timeout=20)
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text[:200]}"
    return s


def test_govern_chat_natural_it():
    s = _login()
    r = s.post(f"{BASE}/api/master/govern", json={"command_text": "Ciao, come va la produzione oggi?", "lang": "it"}, timeout=60)
    assert r.status_code == 200, r.text[:300]
    data = r.json()
    reply = (data.get("reply") or "").strip()
    print("IT chat reply:", reply[:200])
    assert data.get("intent") == "chat", f"expected chat intent got {data.get('intent')}"
    assert reply, "empty reply"
    assert "non ho capito" not in reply.lower(), f"still returns 'Non ho capito': {reply}"


def test_govern_assign_leader():
    s = _login()
    r = s.post(f"{BASE}/api/master/govern", json={"command_text": "metti Antonio responsabile della linea baguette", "lang": "it"}, timeout=60)
    assert r.status_code == 200, r.text[:300]
    data = r.json()
    print("assign_leader response:", data)
    assert data.get("intent") == "assign_leader", f"got {data.get('intent')}"
    assert data.get("executed") is True, f"not executed: {data}"


def test_govern_chat_en():
    s = _login()
    r = s.post(f"{BASE}/api/master/govern", json={"command_text": "Hi, how is production doing today?", "lang": "en"}, timeout=60)
    assert r.status_code == 200
    data = r.json()
    print("EN chat reply:", (data.get("reply") or "")[:200])
    assert data.get("intent") == "chat"
    assert data.get("reply")


def test_recipes_still_loading():
    s = _login()
    r = s.get(f"{BASE}/api/recipes", timeout=20)
    assert r.status_code == 200, r.text[:200]
    data = r.json()
    # backend returns list or wrapped
    items = data if isinstance(data, list) else data.get("items") or data.get("recipes") or []
    print(f"Recipes count: {len(items)}")
    assert len(items) > 0, "no recipes returned (data intact expected)"
