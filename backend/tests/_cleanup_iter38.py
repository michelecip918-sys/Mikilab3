import requests, os
from dotenv import dotenv_values
API = (os.environ.get("REACT_APP_BACKEND_URL") or dotenv_values("/app/frontend/.env")["REACT_APP_BACKEND_URL"]).rstrip("/") + "/api"
tok = requests.post(f"{API}/auth/login", json={"email": "admin@mikilab.de", "password": "Mikilab2026!"}).json()["session_token"]
h = {"Authorization": f"Bearer {tok}"}
for o in requests.get(f"{API}/purchase-orders", headers=h).json():
    if str(o.get("supplier", "")).startswith("TEST_") or "BÄKO" in str(o.get("supplier", "")):
        print("del order", o["id"], requests.delete(f"{API}/purchase-orders/{o['id']}", headers=h).status_code)
for s in requests.get(f"{API}/stores", headers=h).json():
    if str(s.get("name", "")).startswith("TEST_"):
        print("del store", s["id"], requests.delete(f"{API}/stores/{s['id']}", headers=h).status_code)
print("stores left:", requests.get(f"{API}/stores", headers=h).json())
print("orders left:", requests.get(f"{API}/purchase-orders", headers=h).json())
