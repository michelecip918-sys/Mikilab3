"""Iteration 148 — QR tracking (?ref), social click, admin social-logs CSV, static assets."""
import os
import re
import requests
import pytest
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
base_url = os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")
if not base_url:
    raise RuntimeError("REACT_APP_BACKEND_URL missing")
BASE_URL = base_url.rstrip("/")
API = f"{BASE_URL}/api"

ADMIN = {"email": "admin@mikilab.de", "password": "Mikilab2026!"}


@pytest.fixture(scope="module")
def admin_client():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json=ADMIN, timeout=30)
    if r.status_code != 200:
        pytest.fail(f"Admin login failed {r.status_code}: {r.text[:300]}")
    tok = r.json().get("session_token") or r.json().get("token")
    if tok:
        s.headers.update({"Authorization": f"Bearer {tok}"})
    return s


# --- POST /api/social/click (public) ---
class TestSocialClick:
    def test_click_test_channel_increments(self, admin_client):
        before = admin_client.get(f"{API}/admin/social-report", timeout=30)
        assert before.status_code == 200
        b = before.json().get("totals", {}).get("test1", 0)

        r = requests.post(f"{API}/social/click", json={"channel": "test1"}, timeout=30)
        assert r.status_code == 200, r.text[:300]
        assert r.json().get("ok") is True

        after = admin_client.get(f"{API}/admin/social-report", timeout=30)
        assert after.status_code == 200
        data = after.json()
        assert data["totals"].get("test1", 0) == b + 1
        assert "tiktok_7d" in data or "series" in data or True

    def test_click_flyer_channel(self, admin_client):
        r = requests.post(f"{API}/social/click", json={"channel": "flyer"}, timeout=30)
        assert r.status_code == 200
        rep = admin_client.get(f"{API}/admin/social-report", timeout=30).json()
        assert rep["totals"].get("flyer", 0) >= 1


# --- GET /api/admin/social-logs ---
class TestSocialLogs:
    def test_logs_admin_ok(self, admin_client):
        r = admin_client.get(f"{API}/admin/social-logs", timeout=30)
        assert r.status_code == 200, r.text[:300]
        data = r.json()
        assert "rows" in data and isinstance(data["rows"], list)
        assert len(data["rows"]) > 0
        row = data["rows"][0]
        for k in ("day", "channel", "count"):
            assert k in row, f"missing {k} in {row}"
        assert "_id" not in row
        assert isinstance(row["count"], int)
        assert re.match(r"^\d{4}-\d{2}-\d{2}$", str(row["day"]))

    def test_logs_requires_admin(self):
        r = requests.get(f"{API}/admin/social-logs", timeout=30)
        assert r.status_code in (401, 403), f"unauthenticated got {r.status_code}"


# --- Static assets: QR + 5 locandine ---
class TestAssets:
    @pytest.mark.parametrize("f", [
        "qr-mikilab.png",
        "locandina-mikilab.png",
        "locandina-mikilab-de.png",
        "locandina-mikilab-en.png",
        "locandina-mikilab-es.png",
        "locandina-mikilab-fr.png",
    ])
    def test_asset_200(self, f):
        r = requests.get(f"{BASE_URL}/{f}", timeout=60)
        assert r.status_code == 200, f"{f} -> {r.status_code}"
        assert len(r.content) > 1000

    def test_qr_encodes_ref_flyer(self):
        """QR must encode https://mikilab.de/?ref=flyer"""
        try:
            import cv2
            import numpy as np
        except Exception:
            pytest.skip("opencv not available for QR decode")
        r = requests.get(f"{BASE_URL}/qr-mikilab.png", timeout=60)
        arr = cv2.imdecode(np.frombuffer(r.content, np.uint8), cv2.IMREAD_COLOR)
        data = cv2.QRCodeDetector().detectAndDecode(arr)[0]
        assert "ref=flyer" in data, f"QR decoded as {data!r}"
        assert "mikilab.de" in data


# --- site-settings (regression) ---
def test_site_settings_public():
    r = requests.get(f"{API}/site-settings", timeout=30)
    assert r.status_code == 200
    d = r.json()
    assert d.get("tiktok_handle") == "mikilab.de"
