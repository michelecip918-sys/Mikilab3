# ============================================================================
#  MIKILAB PRO & BakoMix AI — PROPRIETARY & CONFIDENTIAL
#  (c) 2026 MikiLab Pro. Tutti i diritti riservati / All rights reserved.
#  Unico proprietario legale: il Master. Sole legal owner: the Master.
#  Codice riservato: vietata copia, distribuzione, reverse engineering o
#  cloning non autorizzati. Unauthorized copying, distribution, reverse
#  engineering or cloning is strictly prohibited and actively tracked by
#  the BakoMix AI Security Guardian.
# ============================================================================
"""Iteration 19 — Capo Laboratorio: piano settimanale/quotidiano, use_weekly, mode=home."""
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

STREAM_TIMEOUT = 180


def consume_stream(resp):
    """Legge lo stream SSE, ritorna (testo, done_ricevuto)."""
    text = ""
    done = False
    for raw in resp.iter_lines(decode_unicode=True):
        if not raw or not raw.startswith("data: "):
            continue
        payload = json.loads(raw[6:])
        if payload.get("done"):
            done = True
            break
        text += payload.get("d", "")
    return text, done


@pytest.fixture(scope="module")
def recipes():
    r = requests.get(f"{API}/recipes", params={"collection_name": "mikilab"}, timeout=30)
    assert r.status_code == 200, r.text
    data = r.json()
    assert isinstance(data, list) and len(data) > 0, "nessuna ricetta mikilab"
    for rec in data:
        assert "_id" not in rec
    return data


# --- capo/plan mode=pro con giorni -> piano settimanale + quotidiano ---
class TestCapoPlanPro:
    def test_plan_pro_with_days(self, recipes):
        r0 = recipes[0]
        r1 = recipes[1] if len(recipes) > 1 else recipes[0]
        payload = {
            "mode": "pro",
            "lang": "it",
            "start_time": "05:00",
            "staff": 3,
            "items": [
                {"recipe_id": r0["id"], "name": r0.get("name"), "quantity": 80, "unit": "pezzi", "day": "sab"},
                {"recipe_id": r1["id"], "name": r1.get("name"), "quantity": 40, "unit": "pezzi", "day": "lun"},
            ],
            "mixers": [{"name": "Spirale 1", "capacity_kg": 60, "type": "spirale"}],
            "cells": [{"name": "Cella 1", "type": "lievitazione", "temp_c": 16, "contents": "lievito madre"}],
            "lab_temp_c": 24,
            "standard_temp_c": 26,
        }
        resp = requests.post(f"{API}/capo/plan", json=payload, stream=True, timeout=STREAM_TIMEOUT)
        assert resp.status_code == 200, resp.text
        assert "text/event-stream" in resp.headers.get("content-type", "")
        text, done = consume_stream(resp)
        assert done, "stream non terminato con done"
        assert len(text) > 500, f"piano troppo corto: {len(text)}"
        assert "[Errore nella generazione" not in text
        low = text.lower()
        assert "settiman" in low, "manca sezione SETTIMANALE"
        assert "quotidian" in low or "giorno" in low, "manca sezione QUOTIDIANA"
        # non troncato: deve arrivare alla cottura
        assert "cott" in low or "forno" in low
        print(f"[pro/days] chars={len(text)}")

    def test_plan_pro_use_weekly(self, recipes):
        rec = recipes[0]
        wp = {
            "items": [
                {
                    "day": "mer",
                    "recipe_id": rec["id"],
                    "recipe_name": rec.get("name"),
                    "pieces": 50,
                    "grams_per_piece": 500,
                }
            ]
        }
        put = requests.put(f"{API}/weekly-plan", json=wp, timeout=30)
        assert put.status_code == 200, put.text
        got = requests.get(f"{API}/weekly-plan", timeout=30)
        assert got.status_code == 200
        gdata = got.json()
        assert "_id" not in gdata and "_key" not in gdata
        assert gdata["items"][0]["recipe_id"] == rec["id"]
        assert gdata["items"][0]["pieces"] == 50

        payload = {
            "mode": "pro",
            "lang": "it",
            "start_time": "04:30",
            "staff": 2,
            "use_weekly": True,
            "items": [],
            "mixers": [{"name": "Spirale", "capacity_kg": 40}],
            "cells": [{"name": "Frigo", "type": "frigo", "temp_c": 5}],
        }
        resp = requests.post(f"{API}/capo/plan", json=payload, stream=True, timeout=STREAM_TIMEOUT)
        assert resp.status_code == 200, resp.text
        text, done = consume_stream(resp)
        assert done, "stream use_weekly non terminato con done"
        assert len(text) > 300, f"piano troppo corto: {len(text)}"
        assert "[Errore nella generazione" not in text
        print(f"[pro/use_weekly] chars={len(text)}")


# --- capo/plan mode=home ---
class TestCapoPlanHome:
    def test_plan_home(self, recipes):
        rec = recipes[0]
        payload = {
            "mode": "home",
            "lang": "it",
            "start_time": "mi serve pronto domenica a pranzo",
            "items": [{"recipe_id": rec["id"], "name": rec.get("name"), "quantity": 2, "unit": "pezzi", "day": "dom"}],
        }
        resp = requests.post(f"{API}/capo/plan", json=payload, stream=True, timeout=STREAM_TIMEOUT)
        assert resp.status_code == 200, resp.text
        text, done = consume_stream(resp)
        assert done, "stream home non terminato con done"
        assert len(text) > 300, f"piano home troppo corto: {len(text)}"
        assert "[Errore nella generazione" not in text
        print(f"[home] chars={len(text)}")


# --- edge cases ---
class TestCapoEdge:
    def test_plan_no_items(self):
        resp = requests.post(f"{API}/capo/plan", json={"mode": "pro", "lang": "it", "items": []},
                             stream=True, timeout=STREAM_TIMEOUT)
        assert resp.status_code == 200, resp.text
        text, done = consume_stream(resp)
        assert done
        print(f"[no items] chars={len(text)}")

    def test_plan_invalid_recipe_id(self):
        resp = requests.post(f"{API}/capo/plan", json={
            "mode": "pro", "lang": "it",
            "items": [{"recipe_id": "nope-does-not-exist", "name": "Pane X", "quantity": 10, "unit": "pezzi", "day": "ven"}],
        }, stream=True, timeout=STREAM_TIMEOUT)
        assert resp.status_code == 200, resp.text
        text, done = consume_stream(resp)
        assert done
        assert "[Errore nella generazione" not in text
