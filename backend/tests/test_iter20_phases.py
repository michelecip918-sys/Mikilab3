"""Iteration 20 — retest dei 3 problemi critici di iteration_19.

1) POST /api/capo/plan a due fasi (phase='weekly' / phase='daily') deve completare
   con 'done' in meno di 60s via preview URL (nessun troncamento del proxy).
2) lang='de' deve produrre contenuto in TEDESCO.
3) PUT/GET /api/weekly-plan deve persistere to_proof / to_fridge / to_freezer.
"""
import json
import os
import time

import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
base_url = os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")
if not base_url:
    raise RuntimeError("REACT_APP_BACKEND_URL missing")
BASE_URL = base_url.rstrip("/")
API = f"{BASE_URL}/api"

IT_WORDS = ["impasto", "impasti", "lievitazione", "forno", "farina", "giorno", "cottura", "frigo", "settimana"]
DE_WORDS = ["teig", "gärung", "ofen", "mehl", "tag", "backen", "kühlschrank", "woche", "stück", "backe"]


def stream_capo(payload, timeout=110):
    """Consuma lo stream SSE. Ritorna (testo, done, secondi, status)."""
    t0 = time.time()
    text, done = "", False
    with requests.post(f"{API}/capo/plan", json=payload, stream=True, timeout=timeout) as r:
        if r.status_code != 200:
            return "", False, time.time() - t0, r.status_code
        for raw in r.iter_lines(decode_unicode=True):
            if not raw:
                continue
            line = raw[5:].strip() if raw.startswith("data:") else raw.strip()
            try:
                obj = json.loads(line)
            except Exception:
                continue
            if obj.get("done"):
                done = True
                break
            if obj.get("d"):
                text += obj["d"]
    return text, done, time.time() - t0, 200


def lang_score(text):
    low = text.lower()
    return (sum(low.count(w) for w in IT_WORDS), sum(low.count(w) for w in DE_WORDS))


@pytest.fixture(scope="module")
def mikilab_recipe():
    r = requests.get(f"{API}/recipes", params={"collection_name": "mikilab"}, timeout=30)
    assert r.status_code == 200, r.text[:300]
    data = r.json()
    assert isinstance(data, list) and len(data) > 0, "nessuna ricetta mikilab pubblica"
    return data[0]


def pro_payload(recipe, phase, lang="it", use_weekly=False):
    return {
        "items": [{
            "recipe_id": recipe["id"], "name": recipe.get("name"),
            "quantity": 600, "unit": "pezzi", "day": "mer",
            "to_proof": 45, "to_fridge": 25, "to_freezer": 530,
        }],
        "mixers": [{"name": "Spirale 1", "capacity_kg": 80}],
        "cells": [{"name": "Cella A", "type": "lievitazione", "temp_c": 16},
                  {"name": "Frigo 1", "type": "frigo", "temp_c": 5}],
        "mode": "pro", "phase": phase, "use_weekly": use_weekly,
        "staff": 3, "start_time": "05:00", "lab_temp_c": 24,
        "standard_temp_c": 26, "notes": "", "lang": lang,
    }


# --- 1) Due fasi sotto i 60s -------------------------------------------------
class TestTwoPhaseTiming:
    def test_phase_weekly_completes_under_60s(self, mikilab_recipe):
        text, done, secs, status = stream_capo(pro_payload(mikilab_recipe, "weekly"))
        print(f"[weekly] status={status} done={done} secs={secs:.1f} chars={len(text)}")
        assert status == 200
        assert done, f"stream troncato senza done dopo {secs:.1f}s ({len(text)} char), coda: {text[-200:]!r}"
        assert secs < 60, f"phase=weekly ha richiesto {secs:.1f}s (>=60s limite proxy)"
        assert len(text) > 400

    def test_phase_daily_completes_under_60s(self, mikilab_recipe):
        text, done, secs, status = stream_capo(pro_payload(mikilab_recipe, "daily"))
        print(f"[daily] status={status} done={done} secs={secs:.1f} chars={len(text)}")
        assert status == 200
        assert done, f"stream troncato senza done dopo {secs:.1f}s ({len(text)} char), coda: {text[-200:]!r}"
        assert secs < 60, f"phase=daily ha richiesto {secs:.1f}s (>=60s limite proxy)"
        assert len(text) > 600

    def test_daily_respects_destinations(self, mikilab_recipe):
        text, done, secs, _ = stream_capo(pro_payload(mikilab_recipe, "daily"))
        assert done
        low = text.lower()
        hits = [w for w in ["frigo", "freezer", "cella"] if w in low]
        print(f"[dest] hits={hits} secs={secs:.1f}")
        assert len(hits) >= 2, f"il piano quotidiano non menziona le destinazioni: {hits}"


# --- 2) Lingua DE ------------------------------------------------------------
class TestLanguageDE:
    def test_weekly_in_german(self, mikilab_recipe):
        text, done, secs, _ = stream_capo(pro_payload(mikilab_recipe, "weekly", lang="de"))
        it_hits, de_hits = lang_score(text)
        print(f"[de-weekly] done={done} secs={secs:.1f} it={it_hits} de={de_hits}")
        assert done, "stream DE weekly senza done"
        assert de_hits > it_hits, f"contenuto non in tedesco (it={it_hits}, de={de_hits}): {text[:250]!r}"

    def test_daily_in_german(self, mikilab_recipe):
        text, done, secs, _ = stream_capo(pro_payload(mikilab_recipe, "daily", lang="de"))
        it_hits, de_hits = lang_score(text)
        print(f"[de-daily] done={done} secs={secs:.1f} it={it_hits} de={de_hits}")
        assert done, "stream DE daily senza done"
        assert de_hits > it_hits, f"contenuto non in tedesco (it={it_hits}, de={de_hits}): {text[:250]!r}"

    def test_home_in_german(self, mikilab_recipe):
        payload = {
            "items": [{"recipe_id": mikilab_recipe["id"], "name": mikilab_recipe.get("name"),
                       "quantity": 2, "unit": "pezzi", "day": None}],
            "mode": "home", "phase": "full", "start_time": "08:00", "lang": "de",
        }
        text, done, secs, _ = stream_capo(payload)
        it_hits, de_hits = lang_score(text)
        print(f"[de-home] done={done} secs={secs:.1f} it={it_hits} de={de_hits}")
        assert done, f"stream home DE senza done dopo {secs:.1f}s"
        assert secs < 60, f"mode=home ha richiesto {secs:.1f}s"
        assert de_hits > it_hits, f"contenuto non in tedesco (it={it_hits}, de={de_hits}): {text[:250]!r}"


# --- 3) weekly-plan destinazioni --------------------------------------------
class TestWeeklyPlanDestinations:
    def test_put_get_destinations_persisted(self, mikilab_recipe):
        payload = {"items": [{
            "id": "TEST_iter20_item",
            "day": "mer",
            "recipe_id": mikilab_recipe["id"],
            "recipe_name": mikilab_recipe.get("name"),
            "pieces": 600,
            "grams_per_piece": 500,
            "to_proof": 45, "to_fridge": 25, "to_freezer": 530,
        }]}
        put = requests.put(f"{API}/weekly-plan", json=payload, timeout=30)
        assert put.status_code == 200, put.text[:300]
        pdata = put.json()
        assert '"_id"' not in json.dumps(pdata) and '"_key"' not in json.dumps(pdata)

        get = requests.get(f"{API}/weekly-plan", timeout=30)
        assert get.status_code == 200
        gdata = get.json()
        raw = json.dumps(gdata)
        assert '"_id"' not in raw and '"_key"' not in raw, "payload contiene _id/_key"
        item = next(i for i in gdata["items"] if i["id"] == "TEST_iter20_item")
        assert item["to_proof"] == 45
        assert item["to_fridge"] == 25
        assert item["to_freezer"] == 530
        assert item["pieces"] == 600

    def test_use_weekly_plan_generation(self, mikilab_recipe):
        # il weekly-plan salvato dal test precedente viene letto da use_weekly
        payload = {
            "items": [], "mixers": [{"name": "Spirale 1", "capacity_kg": 80}],
            "cells": [{"name": "Cella A", "type": "lievitazione", "temp_c": 16}],
            "mode": "pro", "phase": "daily", "use_weekly": True,
            "staff": 3, "start_time": "05:00", "standard_temp_c": 26, "lang": "it",
        }
        text, done, secs, status = stream_capo(payload)
        low = text.lower()
        hits = [w for w in ["frigo", "freezer", "cella"] if w in low]
        print(f"[use_weekly] status={status} done={done} secs={secs:.1f} chars={len(text)} hits={hits}")
        assert status == 200
        assert done, f"use_weekly troncato dopo {secs:.1f}s"
        assert secs < 60
        assert len(hits) >= 2, f"destinazioni non menzionate: {hits}"
