"""Iter 197 — Fase B: weather-now endpoint + food-cost + env compute regression."""
import os
import requests
import pytest

BASE = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")


@pytest.fixture(scope="module")
def admin_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    # Gate
    r = s.post(f"{BASE}/api/admin-gate/verify", json={"pin": "1985"})
    assert r.status_code == 200, f"gate: {r.status_code} {r.text}"
    # Login
    r = s.post(f"{BASE}/api/auth/login", json={"email": "admin@mikilab.de", "password": "Mikilab2026!"})
    assert r.status_code == 200, f"login: {r.status_code} {r.text}"
    return s


def test_weather_now_authenticated(admin_client):
    r = admin_client.get(f"{BASE}/api/lab/weather-now")
    assert r.status_code == 200, r.text
    j = r.json()
    assert j.get("ok") is True, j
    assert isinstance(j.get("temp_c"), (int, float))
    assert isinstance(j.get("humidity_pct"), (int, float))
    assert "location" in j


def test_weather_now_requires_admin():
    s = requests.Session()
    # No gate no login
    r = s.get(f"{BASE}/api/lab/weather-now")
    assert r.status_code in (401, 403), r.status_code


def test_recipes_gate_required():
    s = requests.Session()
    r = s.get(f"{BASE}/api/recipes?tier=mikilab")
    assert r.status_code == 401, r.status_code


def test_recipes_after_gate(admin_client):
    r = admin_client.get(f"{BASE}/api/recipes?tier=mikilab")
    assert r.status_code == 200, r.text
    data = r.json()
    recs = data if isinstance(data, list) else data.get("recipes", [])
    assert isinstance(recs, list)


def test_food_cost_compute(admin_client):
    payload = {"flour_grams": 1000, "water_grams": 700, "salt_grams": 20,
               "sourdough_grams": 200, "yeast_grams": 5, "pieces": 20, "sell_price_piece": 1.5}
    r = admin_client.post(f"{BASE}/api/lab/food-cost", json=payload)
    assert r.status_code == 200, r.text
    j = r.json()
    assert "material_cost" in j
    assert "cost_per_gram" in j


def test_env_compute(admin_client):
    payload = {"base_proof_hours": 3, "base_hydration_percent": 70, "temp_c": 24, "humidity_pct": 55}
    r = admin_client.post(f"{BASE}/api/lab/environment", json=payload)
    assert r.status_code == 200, r.text
    j = r.json()
    assert "adjusted_proof_hours" in j
    assert "hydration_percent" in j
