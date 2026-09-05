# ============================================================================
#  MIKILAB PRO & BakoMix AI — PROPRIETARY & CONFIDENTIAL
#  (c) 2026 MikiLab Pro. Tutti i diritti riservati / All rights reserved.
#  Unico proprietario legale: il Master. Sole legal owner: the Master.
#  Codice riservato: vietata copia, distribuzione, reverse engineering o
#  cloning non autorizzati. Unauthorized copying, distribution, reverse
#  engineering or cloning is strictly prohibited and actively tracked by
#  the BakoMix AI Security Guardian.
# ============================================================================
"""Iteration 143: community stats, admin email report, channel-email preference."""
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
USER = {"email": "fornaio@mikilab.de", "password": "Mikilab2026!"}


def _login(creds):
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login", json=creds, timeout=30)
    if r.status_code != 200:
        pytest.fail(f"login failed {creds['email']}: {r.status_code} {r.text[:300]}")
    tok = r.json().get("session_token") or r.json().get("token")
    if tok:
        s.headers.update({"Authorization": f"Bearer {tok}"})
    return s


@pytest.fixture(scope="module")
def admin_client():
    return _login(ADMIN)


@pytest.fixture(scope="module")
def user_client():
    return _login(USER)


# --- GET /api/community/stats (public) ---
class TestCommunityStats:
    def test_public_stats(self):
        r = requests.get(f"{BASE_URL}/api/community/stats", timeout=30)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        for k in ("bakers", "recipes", "posts"):
            assert k in d, f"missing {k}"
            assert isinstance(d[k], int), f"{k} not int: {d[k]}"
        assert d["bakers"] > 0
        assert "_id" not in d


# --- GET /api/admin/email-report ---
class TestEmailReport:
    def test_admin_email_report(self, admin_client):
        r = admin_client.get(f"{BASE_URL}/api/admin/email-report", timeout=30)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        for k in ("queue_items", "queue_users", "total", "users", "by_type", "daily"):
            assert k in d, f"missing {k}"
        assert isinstance(d["daily"], list) and len(d["daily"]) == 7
        for row in d["daily"]:
            assert "date" in row and "count" in row
            assert isinstance(row["count"], int)
        # dates sorted ascending
        dates = [row["date"] for row in d["daily"]]
        assert dates == sorted(dates)
        assert isinstance(d["by_type"], dict)

    def test_non_admin_forbidden(self, user_client):
        r = user_client.get(f"{BASE_URL}/api/admin/email-report", timeout=30)
        assert r.status_code == 403, f"expected 403 got {r.status_code}"

    def test_unauth_rejected(self):
        r = requests.get(f"{BASE_URL}/api/admin/email-report", timeout=30)
        assert r.status_code in (401, 403), r.status_code


# --- GET/PUT /api/me/channel-email ---
class TestChannelEmailPref:
    def test_get_default(self, user_client):
        r = user_client.get(f"{BASE_URL}/api/me/channel-email", timeout=30)
        assert r.status_code == 200, r.text[:300]
        assert r.json().get("mode") in ("off", "instant", "daily")

    @pytest.mark.parametrize("mode", ["daily", "off", "instant"])
    def test_set_and_persist(self, user_client, mode):
        r = user_client.put(f"{BASE_URL}/api/me/channel-email", json={"mode": mode}, timeout=30)
        assert r.status_code == 200, r.text[:300]
        assert r.json()["mode"] == mode
        g = user_client.get(f"{BASE_URL}/api/me/channel-email", timeout=30)
        assert g.status_code == 200
        assert g.json()["mode"] == mode, "preference not persisted"

    def test_invalid_mode(self, user_client):
        r = user_client.put(f"{BASE_URL}/api/me/channel-email", json={"mode": "bogus"}, timeout=30)
        assert r.status_code == 400, f"expected 400 got {r.status_code}"

    def test_unauth(self):
        r = requests.get(f"{BASE_URL}/api/me/channel-email", timeout=30)
        assert r.status_code in (401, 403)


# --- streak (used by streak-badge card) ---
class TestStreak:
    def test_streak(self, user_client):
        r = user_client.get(f"{BASE_URL}/api/streak", timeout=30)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        assert "current" in d and "milestones" in d
        assert isinstance(d["milestones"], list) and len(d["milestones"]) > 0
