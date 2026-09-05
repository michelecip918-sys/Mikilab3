# ============================================================================
#  MIKILAB PRO & BakoMix AI — PROPRIETARY & CONFIDENTIAL
#  (c) 2026 MikiLab Pro. Tutti i diritti riservati / All rights reserved.
#  Unico proprietario legale: il Master. Sole legal owner: the Master.
#  Codice riservato: vietata copia, distribuzione, reverse engineering o
#  cloning non autorizzati. Unauthorized copying, distribution, reverse
#  engineering or cloning is strictly prohibited and actively tracked by
#  the BakoMix AI Security Guardian.
# ============================================================================
import os
import json
import re
import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
base_url = os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")
if not base_url:
    raise RuntimeError("REACT_APP_BACKEND_URL missing")
BASE_URL = base_url.rstrip("/")

ADMIN = {"email": "admin@mikilab.de", "password": "Mikilab2026!"}


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{BASE_URL}/api/auth/login", json=ADMIN, timeout=60)
    if r.status_code != 200:
        pytest.fail(f"Admin login failed {r.status_code}: {r.text[:300]}")
    tok = r.json().get("session_token") or r.json().get("token")
    if not tok:
        pytest.fail(f"No token in login response: {r.text[:300]}")
    return tok


@pytest.fixture(scope="module")
def admin_client(admin_token):
    s = requests.Session()
    s.headers.update({"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"})
    return s


# ---------- Recipes: v7.8 panettone renaming ----------
class TestMikilabRecipes:
    def test_42_recipes_and_panettone_naming(self, admin_client):
        r = admin_client.get(f"{BASE_URL}/api/recipes", params={"collection_name": "mikilab"}, timeout=60)
        assert r.status_code == 200, r.text[:300]
        data = r.json()
        assert isinstance(data, list)
        names = [x.get("name", "") for x in data]
        assert len(data) == 42, f"Expected 42 recipes, got {len(data)}: {sorted(names)}"
        pan = [n for n in names if n.startswith("Panettone Artigianale MikiLab —")]
        assert len(pan) == 11, f"Expected 11 'Panettone Artigianale MikiLab —' recipes, got {len(pan)}: {pan}"
        assert "Panettone Mikilab" not in names, "Old generic 'Panettone Mikilab' still present"
        # no mongo _id leakage
        assert all("_id" not in x for x in data)

    def test_panettone_detail_fields(self, admin_client):
        r = admin_client.get(f"{BASE_URL}/api/recipes", params={"collection_name": "mikilab"}, timeout=60)
        pan = [x for x in r.json() if x.get("name", "").startswith("Panettone Artigianale MikiLab —")]
        assert pan
        p = pan[0]
        assert p.get("locked") in (None, False), "Admin should not get locked recipe"
        assert p.get("flour_grams") or p.get("ingredients"), f"Panettone missing base data: {list(p.keys())}"


# ---------- Capo plan: preferment_choice ----------
def _stream_plan(token, preferment):
    payload = {
        "items": [{"name": "Panettone test", "quantity": 2, "unit": "pezzi"}],
        "mode": "pro",
        "phase": "weekly",
        "preferment_choice": preferment,
        "lang": "it",
    }
    txt = ""
    done = False
    with requests.post(
        f"{BASE_URL}/api/capo/plan",
        json=payload,
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        stream=True,
        timeout=180,
    ) as resp:
        assert resp.status_code == 200, f"{resp.status_code}: {resp.text[:300]}"
        for line in resp.iter_lines(decode_unicode=True):
            if not line or not line.startswith("data: "):
                continue
            try:
                obj = json.loads(line[6:])
            except Exception:
                continue
            if "d" in obj:
                txt += obj["d"]
            if obj.get("done"):
                done = True
                break
            if obj.get("error"):
                pytest.fail(f"stream error: {obj}")
    return txt, done


class TestCapoPreferment:
    @pytest.mark.parametrize("pref", ["poolish", "licoli"])
    def test_plan_stream_mentions_water_reduction(self, admin_token, pref):
        txt, done = _stream_plan(admin_token, pref)
        assert done, f"Stream did not end with done:true (len={len(txt)})"
        assert len(txt) > 200, f"Plan too short: {txt[:200]}"
        low = txt.lower()
        assert pref[:4] in low or ("licoli" if pref == "licoli" else "poolish") in low, \
            f"Plan does not mention preferment {pref}: {txt[:400]}"
        assert re.search(r"(riduc|scomput|idratazion|acqua)", low), \
            f"Plan does not mention water/hydration reduction: {txt[:600]}"
