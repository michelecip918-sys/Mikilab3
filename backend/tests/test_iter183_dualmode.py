"""
Iteration 183 - Dual-Mode Protocol backend testing
- Recipe audit (sovereign matrix)
- Production line-status (6 sectors)
- Omni-intelligence
- Weekly challenge
- Guided add-site (create + verify + delete + 401 anon)
- Regression: /lab/pulse mood sereno
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@mikilab.de"
ADMIN_PWD = "Mikilab2026!"


@pytest.fixture(scope="session")
def admin_token():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PWD}, timeout=15)
    assert r.status_code == 200, r.text
    data = r.json()
    tok = data.get("session_token") or data.get("access_token") or data.get("token")
    assert tok, data
    return tok


@pytest.fixture(scope="session")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


# ---------- Recipe Audit ----------
class TestRecipeAudit:
    def test_audit_requires_admin(self):
        r = requests.post(f"{API}/lab/recipe-audit", json={"ingredients": []}, timeout=10)
        assert r.status_code in (401, 403)

    def test_audit_with_ingredients(self, admin_headers):
        body = {"ingredients": [
            {"name": "Farina Tipo 0", "target_weight_kg": 10},
            {"name": "Acqua", "target_weight_kg": 6.5},
            {"name": "Sale", "target_weight_kg": 0.28},
        ]}
        r = requests.post(f"{API}/lab/recipe-audit", json=body, headers=admin_headers, timeout=15)
        assert r.status_code == 200, r.text
        d = r.json()
        assert isinstance(d.get("critique"), list) and len(d["critique"]) >= 2
        metrics = {c["metric"]: c for c in d["critique"]}
        assert "Idratazione" in metrics
        assert metrics["Idratazione"]["level"] == "ok"
        assert "65%" in metrics["Idratazione"]["value"]
        assert "Sale" in metrics
        assert metrics["Sale"]["level"] == "warn"
        # 2.8% -> warn -> recommended = modify
        assert d["recommended"] == "modify"
        mat = d["matrix"]
        for k in ("approve", "modify", "reject"):
            assert k in mat and "label" in mat[k] and "reason" in mat[k]

    def test_audit_with_recipe_id(self, admin_headers):
        r = requests.get(f"{API}/recipes", timeout=15)
        if r.status_code != 200:
            pytest.skip("no recipes endpoint")
        data = r.json()
        recs = data if isinstance(data, list) else data.get("recipes", [])
        if not recs:
            pytest.skip("no recipes available")
        rid = recs[0].get("id")
        if not rid:
            pytest.skip("no recipe id")
        r2 = requests.post(f"{API}/lab/recipe-audit", json={"recipe_id": rid}, headers=admin_headers, timeout=15)
        assert r2.status_code == 200, r2.text
        d = r2.json()
        assert "critique" in d and "matrix" in d and d["recommended"] in ("approve", "modify", "reject")


# ---------- Production Line ----------
class TestProductionLine:
    def test_line_hydration_80_delicato(self):
        r = requests.get(f"{API}/production/line-status", params={"dough_temp": 24, "hydration": 80}, timeout=10)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["gluten"] == "delicato"
        ids = [s["id"] for s in d["sectors"]]
        assert ids == ["dosaggio", "autolisi", "formatura", "fermo", "cottura", "abbattimento"]
        for s in d["sectors"]:
            assert s.get("param") and s.get("handoff")

    def test_line_hydration_60_forte(self):
        r = requests.get(f"{API}/production/line-status", params={"dough_temp": 24, "hydration": 60}, timeout=10)
        assert r.status_code == 200
        assert r.json()["gluten"] == "forte"


# ---------- Omni Intelligence ----------
class TestOmni:
    def test_omni(self):
        r = requests.get(f"{API}/enterprise/omni-intelligence", timeout=15)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "network_avg" in d
        assert d.get("top_site") and d.get("struggling_site")
        assert isinstance(d.get("cross_site_strategies"), list) and len(d["cross_site_strategies"]) >= 1
        # top site should be Stoccarda
        assert "Stoccarda" in (d["top_site"]["name"] or "")


# ---------- Weekly Challenge ----------
class TestWeekly:
    def test_weekly(self):
        r = requests.get(f"{API}/enterprise/weekly-challenge", timeout=15)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d.get("week") and "-W" in d["week"]
        assert "days_remaining" in d
        assert d.get("prize")
        rk = d.get("ranking") or []
        assert len(rk) >= 1
        # sorted descending
        for a, b in zip(rk, rk[1:]):
            assert a["avg_score"] >= b["avg_score"]
        assert d.get("leader") and d["leader"]["rank"] == 1


# ---------- Guided Add-Site ----------
class TestAddSite:
    def test_anon_cannot_create(self):
        r = requests.post(f"{API}/enterprise/sites", json={"name": "Anon Site", "width": 5, "length": 5}, timeout=10)
        assert r.status_code in (401, 403)

    def test_create_verify_delete(self, admin_headers):
        payload = {"name": "TEST_Berlino_i183", "width": 8, "length": 10}
        r = requests.post(f"{API}/enterprise/sites", json=payload, headers=admin_headers, timeout=15)
        assert r.status_code == 200, r.text
        created = r.json()
        sid = created.get("site_id")
        assert sid
        # verify in list
        rlist = requests.get(f"{API}/enterprise/sites", timeout=15)
        assert rlist.status_code == 200
        sites = rlist.json().get("sites", [])
        found = next((s for s in sites if s.get("site_id") == sid), None)
        assert found is not None
        dims = (found.get("spatial_layout") or {}).get("room_dimensions_m") or {}
        assert dims.get("width") == 8.0 and dims.get("length") == 10.0
        # cleanup
        rd = requests.delete(f"{API}/enterprise/sites/{sid}", headers=admin_headers, timeout=15)
        assert rd.status_code == 200
        # confirm removed
        rlist2 = requests.get(f"{API}/enterprise/sites", timeout=15)
        assert not any(s.get("site_id") == sid for s in rlist2.json().get("sites", []))


# ---------- Regression pulse ----------
class TestPulseRegression:
    def test_pulse_sereno(self):
        r = requests.get(f"{API}/lab/pulse", timeout=15)
        assert r.status_code == 200, r.text
        d = r.json()
        mood = d.get("mood") or (d.get("pulse") or {}).get("mood")
        assert mood == "sereno", f"Expected mood sereno, got: {d}"
