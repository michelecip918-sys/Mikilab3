"""Iteration 144 — community stats cache + admin email logs/report."""
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

ADMIN = {"email": "admin@mikilab.de", "password": "Mikilab2026!"}
USER = {"email": "fornaio@mikilab.de", "password": "Mikilab2026!"}


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


def _login(client, creds):
    r = client.post(f"{BASE_URL}/api/auth/login", json=creds, timeout=30)
    if r.status_code != 200:
        pytest.fail(f"login {creds['email']} -> {r.status_code}: {r.text[:300]}")
    tok = r.json().get("session_token") or r.json().get("token")
    assert tok, f"no token in {r.json().keys()}"
    return tok


@pytest.fixture(scope="module")
def admin_token(client):
    return _login(client, ADMIN)


@pytest.fixture(scope="module")
def user_token(client):
    return _login(client, USER)


# --- community stats (public + 60s cache) ---
class TestCommunityStats:
    def test_stats_public_shape(self, client):
        r = requests.get(f"{BASE_URL}/api/community/stats", timeout=30)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        for k in ("bakers", "recipes", "posts", "countries"):
            assert k in d, f"missing {k}"
        assert isinstance(d["bakers"], int) and d["bakers"] >= 0
        assert isinstance(d["countries"], list) and len(d["countries"]) >= 1
        assert all(isinstance(c, str) and len(c) == 2 and c.isupper() for c in d["countries"]), d["countries"]
        assert "IT" in d["countries"] and "DE" in d["countries"]
        assert len(d["countries"]) <= 6

    def test_stats_cached_within_60s(self, client):
        r1 = requests.get(f"{BASE_URL}/api/community/stats", timeout=30)
        time.sleep(1.5)
        r2 = requests.get(f"{BASE_URL}/api/community/stats", timeout=30)
        assert r1.status_code == r2.status_code == 200
        assert r1.json() == r2.json(), f"cache mismatch {r1.json()} vs {r2.json()}"


# --- admin email logs (CSV source) ---
class TestAdminEmailLogs:
    def test_email_logs_requires_auth(self, client):
        r = requests.get(f"{BASE_URL}/api/admin/email-logs?days=30", timeout=30)
        assert r.status_code in (401, 403), r.status_code

    def test_email_logs_forbidden_for_normal_user(self, client, user_token):
        r = requests.get(f"{BASE_URL}/api/admin/email-logs?days=30",
                         headers={"Authorization": f"Bearer {user_token}"}, timeout=30)
        assert r.status_code == 403, f"{r.status_code} {r.text[:200]}"

    @pytest.mark.parametrize("days,expected", [(7, 7), (30, 30), (1, 7), (365, 30)])
    def test_email_logs_admin(self, client, admin_token, days, expected):
        r = requests.get(f"{BASE_URL}/api/admin/email-logs?days={days}",
                         headers={"Authorization": f"Bearer {admin_token}"}, timeout=30)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        assert d["days"] == expected
        assert isinstance(d["rows"], list)
        for row in d["rows"][:5]:
            for k in ("day", "kind", "to", "channel", "count", "created_at"):
                assert k in row, f"row missing {k}: {row}"
            assert "_id" not in row


# --- admin email report (7/30 toggle) ---
class TestAdminEmailReport:
    @pytest.mark.parametrize("days,expected", [(7, 7), (30, 30)])
    def test_report_days(self, client, admin_token, days, expected):
        r = requests.get(f"{BASE_URL}/api/admin/email-report?days={days}",
                         headers={"Authorization": f"Bearer {admin_token}"}, timeout=30)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        assert d["days"] == expected
        assert len(d["daily"]) == expected, f"daily len {len(d['daily'])}"
        assert isinstance(d["by_channel"], dict)
        assert isinstance(d["total"], int)
        dates = [x["date"] for x in d["daily"]]
        assert dates == sorted(dates), "daily not sorted ascending"

    def test_report_forbidden_for_user(self, client, user_token):
        r = requests.get(f"{BASE_URL}/api/admin/email-report?days=7",
                         headers={"Authorization": f"Bearer {user_token}"}, timeout=30)
        assert r.status_code == 403


# --- regression: channel email pref persistence ---
class TestChannelEmailPref:
    @pytest.mark.parametrize("mode", ["instant", "off", "daily"])
    def test_set_and_persist(self, client, user_token, mode):
        h = {"Authorization": f"Bearer {user_token}"}
        r = requests.put(f"{BASE_URL}/api/me/channel-email", json={"mode": mode}, headers=h, timeout=30)
        assert r.status_code == 200, r.text[:300]
        assert r.json().get("mode") == mode
        got = requests.get(f"{BASE_URL}/api/me/channel-email", headers=h, timeout=30)
        assert got.status_code == 200
        assert got.json().get("mode") == mode, f"persisted={got.json()} expected={mode}"
