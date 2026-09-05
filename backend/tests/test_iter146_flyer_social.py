# ============================================================================
#  MIKILAB PRO & BakoMix AI — PROPRIETARY & CONFIDENTIAL
#  (c) 2026 MikiLab Pro. Tutti i diritti riservati / All rights reserved.
#  Unico proprietario legale: il Master. Sole legal owner: the Master.
#  Codice riservato: vietata copia, distribuzione, reverse engineering o
#  cloning non autorizzati. Unauthorized copying, distribution, reverse
#  engineering or cloning is strictly prohibited and actively tracked by
#  the BakoMix AI Security Guardian.
# ============================================================================
"""Iteration 146 — flyer assets ES/FR, social click tracking, admin social report, IG/FB settings."""
import os
import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
base_url = os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")
if not base_url:
    raise RuntimeError("REACT_APP_BACKEND_URL missing")
BASE_URL = base_url.rstrip("/")
API = f"{BASE_URL}/api"

ADMIN = {"email": "admin@mikilab.de", "password": "Mikilab2026!"}


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def admin_client(client):
    r = client.post(f"{API}/auth/login", json=ADMIN)
    if r.status_code != 200:
        pytest.fail(f"Admin login failed {r.status_code}: {r.text[:300]}")
    token = r.json().get("session_token") or r.json().get("token")
    if not token:
        pytest.fail(f"No session token in login response: {r.text[:300]}")
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json", "Authorization": f"Bearer {token}"})
    return s


# --- Flyer assets -----------------------------------------------------------
@pytest.mark.parametrize("f", [
    "locandina-mikilab.png", "locandina-mikilab-de.png", "locandina-mikilab-en.png",
    "locandina-mikilab-es.png", "locandina-mikilab-fr.png",
])
def test_flyer_assets_served(client, f):
    r = client.get(f"{BASE_URL}/{f}", timeout=60)
    assert r.status_code == 200, f"{f} -> {r.status_code}"
    assert r.headers.get("content-type", "").startswith("image/"), r.headers.get("content-type")
    assert len(r.content) > 10000


# --- Social click tracking --------------------------------------------------
def test_social_click_increments(client, admin_client):
    before = admin_client.get(f"{API}/admin/social-report")
    assert before.status_code == 200
    b = before.json()
    start = int(b.get("totals", {}).get("tiktok", 0))

    r = client.post(f"{API}/social/click", json={"channel": "tiktok"})
    assert r.status_code == 200
    assert r.json() == {"ok": True}

    after = admin_client.get(f"{API}/admin/social-report").json()
    assert int(after["totals"]["tiktok"]) == start + 1


def test_social_click_empty_channel(client):
    r = client.post(f"{API}/social/click", json={"channel": "  "})
    assert r.status_code == 200
    assert r.json().get("ok") is False


def test_social_click_missing_body(client):
    r = client.post(f"{API}/social/click", json={})
    assert r.status_code == 422


# --- Admin social report ----------------------------------------------------
def test_social_report_shape(admin_client):
    r = admin_client.get(f"{API}/admin/social-report")
    assert r.status_code == 200
    d = r.json()
    assert isinstance(d.get("totals"), dict)
    daily = d.get("tiktok_daily")
    assert isinstance(daily, list) and len(daily) == 7
    dates = [x["date"] for x in daily]
    assert dates == sorted(dates)
    for x in daily:
        assert isinstance(x["count"], int)


def test_social_report_requires_admin():
    r = requests.get(f"{API}/admin/social-report")
    assert r.status_code in (401, 403)


# --- Site settings IG/FB ----------------------------------------------------
def test_site_settings_defaults_present(client):
    r = client.get(f"{API}/site-settings")
    assert r.status_code == 200
    d = r.json()
    for k in ("whatsapp_number", "tiktok_handle", "instagram_url", "facebook_url"):
        assert k in d, f"missing {k}"
    assert d["tiktok_handle"] == "mikilab.de"


def test_admin_set_ig_fb_and_reset(client, admin_client):
    try:
        r = admin_client.put(f"{API}/admin/site-settings", json={
            "instagram_url": "https://www.instagram.com/TEST_mikilab/",
            "facebook_url": "https://www.facebook.com/TEST_mikilab/",
        })
        assert r.status_code == 200
        assert r.json()["instagram_url"] == "https://www.instagram.com/TEST_mikilab/"

        g = client.get(f"{API}/site-settings").json()
        assert g["instagram_url"] == "https://www.instagram.com/TEST_mikilab/"
        assert g["facebook_url"] == "https://www.facebook.com/TEST_mikilab/"
    finally:
        rst = admin_client.put(f"{API}/admin/site-settings", json={
            "instagram_url": "", "facebook_url": "", "tiktok_handle": "mikilab.de"})
        assert rst.status_code == 200
        g2 = client.get(f"{API}/site-settings").json()
        assert g2["instagram_url"] == ""
        assert g2["facebook_url"] == ""
        assert g2["tiktok_handle"] == "mikilab.de"


def test_site_settings_write_requires_admin(admin_client):
    r = requests.put(f"{API}/admin/site-settings", json={"instagram_url": "https://x.test/"})
    assert r.status_code in (401, 403)
    # safety: ensure IG/FB remain empty at the end of the suite
    admin_client.put(f"{API}/admin/site-settings", json={
        "instagram_url": "", "facebook_url": "", "tiktok_handle": "mikilab.de"})
    g = requests.get(f"{API}/site-settings").json()
    assert g["instagram_url"] == "" and g["facebook_url"] == ""
