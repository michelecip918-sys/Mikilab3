import os, requests
from dotenv import dotenv_values
BASE = dotenv_values("/app/frontend/.env")["REACT_APP_BACKEND_URL"].rstrip("/")
s = requests.Session()
r = s.post(f"{BASE}/api/auth/login", json={"email": "admin@mikilab.de", "password": "Mikilab2026!"})
tok = r.json().get("session_token")
h = {"Authorization": f"Bearer {tok}"}
recs = s.get(f"{BASE}/api/recipes?collection_name=personal", headers=h).json()
print("personal count:", len(recs))
for rec in recs:
    if rec.get("name") in ("Pane Rustico", "Focaccia"):
        d = s.delete(f"{BASE}/api/recipes/{rec['id']}", headers=h)
        print("deleted", rec["name"], d.status_code)
