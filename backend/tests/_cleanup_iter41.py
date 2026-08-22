import os, requests
from dotenv import dotenv_values
BASE = (os.environ.get("REACT_APP_BACKEND_URL") or dotenv_values("/app/frontend/.env")["REACT_APP_BACKEND_URL"]).rstrip("/")
API = f"{BASE}/api"
r = requests.post(f"{API}/auth/login", json={"email": "admin@mikilab.de", "password": "Mikilab2026!"}, timeout=30)
tok = r.json().get("session_token") or r.json().get("token")
s = requests.Session(); s.headers.update({"Authorization": f"Bearer {tok}"})
for sh in s.get(f"{API}/shifts", timeout=30).json():
    if str(sh.get("employee", "")).startswith("TEST_"):
        print("del shift", sh["id"], s.delete(f"{API}/shifts/{sh['id']}", timeout=30).status_code)
for st in s.get(f"{API}/stores", timeout=30).json():
    if str(st.get("name", "")).startswith("TEST_"):
        print("del store", st["name"], s.delete(f"{API}/stores/{st['id']}", timeout=30).status_code)
print("remaining shifts:", len(s.get(f"{API}/shifts", timeout=30).json()), "stores:", [x.get("name") for x in s.get(f"{API}/stores", timeout=30).json()])
