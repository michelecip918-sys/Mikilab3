# ============================================================================
#  MIKILAB PRO & BakoMix AI — PROPRIETARY & CONFIDENTIAL
#  (c) 2026 MikiLab Pro. Tutti i diritti riservati / All rights reserved.
#  Unico proprietario legale: il Master. Sole legal owner: the Master.
#  Codice riservato: vietata copia, distribuzione, reverse engineering o
#  cloning non autorizzati. Unauthorized copying, distribution, reverse
#  engineering or cloning is strictly prohibited and actively tracked by
#  the BakoMix AI Security Guardian.
# ============================================================================
import os
import requests
from dotenv import dotenv_values

BASE = (os.environ.get("REACT_APP_BACKEND_URL") or dotenv_values("/app/frontend/.env")["REACT_APP_BACKEND_URL"]).rstrip("/")
IDS = ["18ec13d5-dbd5-41bf-a478-1f3ed65dba46", "e5e6fa92-d9db-4ed6-af88-089340ab3a40"]

s = requests.Session()
r = s.post(f"{BASE}/api/auth/login", json={"email": "admin@mikilab.de", "password": "Mikilab2026!"}, timeout=30)
tok = r.json().get("session_token") or r.json().get("token")
if tok:
    s.headers.update({"Authorization": f"Bearer {tok}"})
cur = set(s.get(f"{BASE}/api/favorites", timeout=30).json())
print("before:", cur)
for rid in IDS + [i for i in cur if str(i).startswith("custodite:") and "matera" in str(i)]:
    if rid in cur:
        print(rid, s.post(f"{BASE}/api/favorites/toggle", json={"recipe_id": rid}, timeout=30).json())
print("after:", s.get(f"{BASE}/api/favorites", timeout=30).json())
