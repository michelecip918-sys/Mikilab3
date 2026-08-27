"""RCA test — modulo 'infornate' nel Piano IA (/api/capo/plan streaming).

Verifica se la sezione '## 🔥 Orario Infornate' viene realmente generata
alla fine del piano quando active_modules include 'infornate'.
"""
import os
import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
base_url = os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")
if not base_url:
    raise RuntimeError("REACT_APP_BACKEND_URL missing")
BASE_URL = base_url.rstrip("/")

EMAIL = "admin@mikilab.de"
PASSWORD = "Mikilab2026!"


@pytest.fixture(scope="module")
def token():
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": EMAIL, "password": PASSWORD}, timeout=30)
    assert r.status_code == 200, r.text[:300]
    tok = r.json().get("session_token") or r.json().get("token")
    assert tok
    return tok


def _stream_plan(token, active_modules, phase="daily"):
    payload = {
        "items": [{"name": "Pane ai Cereali", "qty": 50, "unit": "pezzi"}],
        "lang": "it",
        "mode": "pro",
        "phase": phase,
        "start_time": "05:00",
        "active_modules": active_modules,
    }
    out = []
    with requests.post(f"{BASE_URL}/api/capo/plan", json=payload,
                       headers={"Authorization": f"Bearer {token}"},
                       stream=True, timeout=240) as r:
        assert r.status_code == 200, r.text[:300]
        for chunk in r.iter_content(chunk_size=None, decode_unicode=True):
            if chunk:
                out.append(chunk)
    return "".join(out)


def test_infornate_section_present_phase_daily(token):
    text = _stream_plan(token, ["celle", "orari", "freezer", "spesa", "foodcost", "infornate"])
    print("LEN:", len(text))
    print("TAIL:", text[-400:])
    assert "Orario Infornate" in text, "sezione 'Orario Infornate' assente (piano troncato prima della tabella?)"


def test_infornate_section_present_minimal_modules(token):
    """Solo 'infornate' attivo: meno testo prima, la tabella dovrebbe entrare nel budget token."""
    text = _stream_plan(token, ["infornate"])
    print("LEN:", len(text))
    print("TAIL:", text[-400:])
    assert "Orario Infornate" in text
