# ============================================================================
#  MIKILAB PRO & BakoMix AI — PROPRIETARY & CONFIDENTIAL
#  (c) 2026 MikiLab Pro. Tutti i diritti riservati / All rights reserved.
#  Unico proprietario legale: il Master. Sole legal owner: the Master.
#  Codice riservato: vietata copia, distribuzione, reverse engineering o
#  cloning non autorizzati. Unauthorized copying, distribution, reverse
#  engineering or cloning is strictly prohibited and actively tracked by
#  the BakoMix AI Security Guardian.
# ============================================================================
"""Anti-Fooling Voice-Print Liveness backend tests"""
import os
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
API = f"{BASE_URL}/api"


def _get_challenge(lang="it"):
    r = requests.get(f"{API}/antifool/challenge", params={"lang": lang}, timeout=15)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d.get("challenge_id") and isinstance(d["challenge_id"], str)
    assert d.get("phrase") and isinstance(d["phrase"], str) and len(d["phrase"]) > 0
    return d


def test_challenge_it_en_de_and_varies():
    seen = set()
    for _ in range(8):
        d = _get_challenge("it")
        seen.add(d["phrase"])
    assert len(seen) > 1, f"Phrases did not vary: {seen}"
    for lang in ["en", "de"]:
        d = _get_challenge(lang)
        assert d["lang"] == lang


def test_verify_match_and_one_shot():
    d = _get_challenge("it")
    r = requests.post(f"{API}/antifool/verify", json={"challenge_id": d["challenge_id"], "transcript": d["phrase"]}, timeout=15)
    assert r.status_code == 200
    body = r.json()
    assert body["ok"] is True, body
    assert body["score"] >= 0.72, body

    # one-shot
    r2 = requests.post(f"{API}/antifool/verify", json={"challenge_id": d["challenge_id"], "transcript": d["phrase"]}, timeout=15)
    b2 = r2.json()
    assert b2["ok"] is False and b2.get("reason") == "expired", b2


def test_verify_no_match():
    d = _get_challenge("it")
    r = requests.post(f"{API}/antifool/verify", json={"challenge_id": d["challenge_id"], "transcript": "parole a caso senza senso zzz"}, timeout=15)
    b = r.json()
    assert b["ok"] is False, b
    assert b["score"] < 0.72, b


def test_verify_unknown_challenge():
    r = requests.post(f"{API}/antifool/verify", json={"challenge_id": "deadbeef00", "transcript": "qualcosa"}, timeout=15)
    b = r.json()
    assert b["ok"] is False
    assert b.get("reason") == "expired"
    assert b.get("score") == 0 or b.get("score") == 0.0
