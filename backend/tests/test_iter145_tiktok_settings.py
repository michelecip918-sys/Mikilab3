# ============================================================================
#  MIKILAB PRO & BakoMix AI — PROPRIETARY & CONFIDENTIAL
#  (c) 2026 MikiLab Pro. Tutti i diritti riservati / All rights reserved.
#  Unico proprietario legale: il Master. Sole legal owner: the Master.
#  Codice riservato: vietata copia, distribuzione, reverse engineering o
#  cloning non autorizzati. Unauthorized copying, distribution, reverse
#  engineering or cloning is strictly prohibited and actively tracked by
#  the BakoMix AI Security Guardian.
# ============================================================================
"""Iteration 145 — site-settings tiktok_handle (public GET, admin PUT) + flyer assets."""
import os
import pytest
import requests
from dotenv import dotenv_values

fe = dotenv_values("/app/frontend/.env")
BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or fe.get("REACT_APP_BACKEND_URL")).rstrip("/")
ADMIN = {"email": "admin@mikilab.de", "password": "Mikilab2026!"}


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def admin_client(client):
    r = client.post(f"{BASE_URL}/api/auth/login", json=ADMIN)
    if r.status_code != 200:
        pytest.fail(f"Admin login failed {r.status_code}: {r.text[:300]}")
    tok = r.json().get("session_token") or r.json().get("token")
    if not tok:
        pytest.fail(f"No token in login response: {r.text[:300]}")
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json", "Authorization": f"Bearer {tok}"})
    return s


@pytest.fixture(scope="module", autouse=True)
def restore_handle(admin_client):
    yield
    r = admin_client.put(f"{BASE_URL}/api/admin/site-settings", json={"tiktok_handle": "mikilab.de"})
    assert r.status_code == 200
    assert r.json().get("tiktok_handle") == "mikilab.de"


# --- public GET ---
def test_public_site_settings(client):
    r = client.get(f"{BASE_URL}/api/site-settings")
    assert r.status_code == 200
    d = r.json()
    assert "tiktok_handle" in d
    assert "whatsapp_number" in d
    assert isinstance(d["tiktok_handle"], str) and d["tiktok_handle"]
    assert not d["tiktok_handle"].startswith("@")
    assert "_id" not in d


# --- admin PUT: strip @ ---
def test_admin_put_strips_at(admin_client, client):
    r = admin_client.put(f"{BASE_URL}/api/admin/site-settings", json={"tiktok_handle": "@prova.mikilab"})
    assert r.status_code == 200
    assert r.json()["tiktok_handle"] == "prova.mikilab"
    g = client.get(f"{BASE_URL}/api/site-settings")
    assert g.status_code == 200
    assert g.json()["tiktok_handle"] == "prova.mikilab"


# --- admin PUT: extract from full URL ---
def test_admin_put_extracts_from_url(admin_client, client):
    r = admin_client.put(f"{BASE_URL}/api/admin/site-settings",
                         json={"tiktok_handle": "https://www.tiktok.com/@prova.mikilab?lang=it"})
    assert r.status_code == 200
    assert r.json()["tiktok_handle"] == "prova.mikilab"
    assert client.get(f"{BASE_URL}/api/site-settings").json()["tiktok_handle"] == "prova.mikilab"


# --- auth guard ---
def test_admin_put_requires_auth():
    # fresh session: no cookies / no bearer token
    r = requests.put(f"{BASE_URL}/api/admin/site-settings", json={"tiktok_handle": "hacker"}, timeout=30)
    assert r.status_code in (401, 403), r.text[:200]


def test_admin_put_non_admin_forbidden():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    lr = s.post(f"{BASE_URL}/api/auth/login", json={"email": "fornaio@mikilab.de", "password": "Mikilab2026!"})
    if lr.status_code != 200:
        pytest.skip("normal user login unavailable")
    tok = lr.json().get("session_token") or lr.json().get("token")
    r = requests.put(f"{BASE_URL}/api/admin/site-settings", json={"tiktok_handle": "hacker"},
                     headers={"Authorization": f"Bearer {tok}"})
    assert r.status_code in (401, 403), f"non-admin allowed to write settings: {r.status_code}"


# --- flyer assets exist ---
@pytest.mark.parametrize("f", ["locandina-mikilab.png", "locandina-mikilab-de.png", "locandina-mikilab-en.png"])
def test_flyer_assets(f):
    r = requests.get(f"{BASE_URL}/{f}", timeout=60)
    assert r.status_code == 200, f"{f} -> {r.status_code}"
    assert r.headers.get("content-type", "").startswith("image"), r.headers.get("content-type")
    assert len(r.content) > 5000
