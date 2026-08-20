import requests
from dotenv import dotenv_values

BASE = dotenv_values("/app/frontend/.env")["REACT_APP_BACKEND_URL"].rstrip("/")
r = requests.post(f"{BASE}/api/auth/login", json={"email": "admin@mikilab.de", "password": "Mikilab2026!"}, timeout=30)
tok = r.json().get("session_token") or r.json().get("token")
h = {"Authorization": f"Bearer {tok}"}
recs = requests.get(f"{BASE}/api/recipes?collection_name=mikilab", headers=h, timeout=30).json()
for x in recs:
    if x.get("notes") and "TEST_" in str(x.get("notes")):
        print("cleaning", x["name"], repr(x["notes"]))
        print(requests.put(f"{BASE}/api/recipes/{x['id']}", json={"notes": ""}, headers=h, timeout=30).status_code)
print("done")
