# ============================================================================
#  MIKILAB PRO & BakoMix AI — PROPRIETARY & CONFIDENTIAL
#  (c) 2026 MikiLab Pro. Tutti i diritti riservati / All rights reserved.
#  Unico proprietario legale: il Master. Sole legal owner: the Master.
#  Codice riservato: vietata copia, distribuzione, reverse engineering o
#  cloning non autorizzati. Unauthorized copying, distribution, reverse
#  engineering or cloning is strictly prohibited and actively tracked by
#  the BakoMix AI Security Guardian.
# ============================================================================
"""Iteration 147 — Reset statistiche social + normalizzazione IG/FB URL."""
import os
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
def admin_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(f"{BASE_URL}/api/auth/login", json=ADMIN, timeout=30)
    if r.status_code != 200:
        pytest.fail(f"Admin login failed {r.status_code}: {r.text[:300]}")
    token = r.json().get("session_token") or r.json().get("token")
    assert token, f"No token in login response: {r.json()}"
    s.headers.update({"Authorization": f"Bearer {token}"})
    return s


@pytest.fixture(scope="module")
def anon_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# --- Social click / report / reset ---
class TestSocialReport:
    def test_social_click_public(self, anon_client):
        r = anon_client.post(f"{BASE_URL}/api/social/click", json={"channel": "tiktok"}, timeout=30)
        assert r.status_code == 200, r.text[:300]
        assert r.json().get("ok") is True

    def test_report_shows_click(self, admin_client):
        r = admin_client.get(f"{BASE_URL}/api/admin/social-report", timeout=30)
        assert r.status_code == 200, r.text[:300]
        data = r.json()
        assert "totals" in data and "tiktok_daily" in data
        assert data["totals"].get("tiktok", 0) >= 1
        assert len(data["tiktok_daily"]) == 7
        assert all("date" in d and "count" in d for d in data["tiktok_daily"])

    def test_reset_requires_admin(self, anon_client):
        r = anon_client.post(f"{BASE_URL}/api/admin/social-report/reset", timeout=30)
        assert r.status_code in (401, 403), f"expected auth error, got {r.status_code}"

    def test_reset_clears_counters(self, admin_client):
        r = admin_client.post(f"{BASE_URL}/api/admin/social-report/reset", timeout=30)
        assert r.status_code == 200, r.text[:300]
        body = r.json()
        assert body.get("ok") is True
        assert isinstance(body.get("deleted"), int) and body["deleted"] >= 1
        # verify persistence
        g = admin_client.get(f"{BASE_URL}/api/admin/social-report", timeout=30)
        assert g.status_code == 200
        assert g.json()["totals"] == {}
        assert all(d["count"] == 0 for d in g.json()["tiktok_daily"])

    def test_reset_idempotent_empty(self, admin_client):
        r = admin_client.post(f"{BASE_URL}/api/admin/social-report/reset", timeout=30)
        assert r.status_code == 200
        assert r.json().get("deleted") == 0


# --- Normalizzazione instagram_url / facebook_url ---
class TestSocialUrlNormalization:
    @pytest.mark.parametrize("field,raw,expected", [
        ("instagram_url", "@mikilab.de", "https://instagram.com/mikilab.de"),
        ("instagram_url", "mikilab.de", "https://instagram.com/mikilab.de"),
        ("instagram_url", "https://instagram.com/xyz", "https://instagram.com/xyz"),
        ("instagram_url", "  @spaced  ", "https://instagram.com/spaced"),
        ("instagram_url", "", ""),
        ("facebook_url", "mikilab.official", "https://facebook.com/mikilab.official"),
        ("facebook_url", "@mikilab.official", "https://facebook.com/mikilab.official"),
        ("facebook_url", "http://facebook.com/abc", "http://facebook.com/abc"),
        ("facebook_url", "", ""),
    ])
    def test_normalize(self, admin_client, anon_client, field, raw, expected):
        r = admin_client.put(f"{BASE_URL}/api/admin/site-settings", json={field: raw}, timeout=30)
        assert r.status_code == 200, r.text[:300]
        assert r.json().get(field) == expected, f"PUT returned {r.json().get(field)}"
        g = anon_client.get(f"{BASE_URL}/api/site-settings", timeout=30)
        assert g.status_code == 200
        assert g.json().get(field) == expected, "not persisted"

    def test_non_admin_cannot_set(self, anon_client):
        r = anon_client.put(f"{BASE_URL}/api/admin/site-settings", json={"instagram_url": "hack"}, timeout=30)
        assert r.status_code in (401, 403)

    def test_tiktok_handle_untouched(self, anon_client):
        g = anon_client.get(f"{BASE_URL}/api/site-settings", timeout=30)
        assert g.json().get("tiktok_handle") == "mikilab.de"


# --- Cleanup: stato finale richiesto ---
def test_zz_cleanup_final_state(admin_client, anon_client):
    r = admin_client.put(f"{BASE_URL}/api/admin/site-settings",
                         json={"instagram_url": "", "facebook_url": "", "tiktok_handle": "mikilab.de"}, timeout=30)
    assert r.status_code == 200
    admin_client.post(f"{BASE_URL}/api/admin/social-report/reset", timeout=30)
    g = anon_client.get(f"{BASE_URL}/api/site-settings", timeout=30).json()
    assert g["instagram_url"] == "" and g["facebook_url"] == "" and g["tiktok_handle"] == "mikilab.de"
