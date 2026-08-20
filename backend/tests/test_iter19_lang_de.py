"""Iteration 19b — verifica lingua DE per /api/capo/plan (mode home e pro)."""
import json
import os
import re

import pytest
import requests
from dotenv import dotenv_values

BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL")
            or dotenv_values("/app/frontend/.env")["REACT_APP_BACKEND_URL"]).rstrip("/")
API = f"{BASE_URL}/api"

IT_WORDS = ["impasto", "lievitazione", "farina", "acqua", "forno", "sera prima", "cottura"]
DE_WORDS = ["teig", "gärung", "mehl", "wasser", "backofen", "abend", "backen"]


def consume(resp):
    text, done = "", False
    for raw in resp.iter_lines(decode_unicode=True):
        if not raw or not raw.startswith("data: "):
            continue
        p = json.loads(raw[6:])
        if p.get("done"):
            done = True
            break
        text += p.get("d", "")
    return text, done


@pytest.fixture(scope="module")
def recipe():
    r = requests.get(f"{API}/recipes", params={"collection_name": "mikilab"}, timeout=30)
    assert r.status_code == 200
    return r.json()[0]


def test_home_plan_lang_de(recipe):
    payload = {
        "mode": "home", "lang": "de", "start_time": "Sonntag Mittag",
        "items": [{"recipe_id": recipe["id"], "name": recipe.get("name"), "quantity": 2, "unit": "pezzi"}],
    }
    resp = requests.post(f"{API}/capo/plan", json=payload, stream=True, timeout=180)
    assert resp.status_code == 200
    text, done = consume(resp)
    assert done
    low = text.lower()
    it_hits = sum(1 for w in IT_WORDS if w in low)
    de_hits = sum(1 for w in DE_WORDS if w in low)
    print(f"[home de] chars={len(text)} it_hits={it_hits} de_hits={de_hits}")
    print("HEAD:", text[:200])
    assert de_hits > it_hits, f"risposta non in tedesco (it={it_hits}, de={de_hits})"
