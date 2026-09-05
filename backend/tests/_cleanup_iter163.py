# ============================================================================
#  MIKILAB PRO & BakoMix AI — PROPRIETARY & CONFIDENTIAL
#  (c) 2026 MikiLab Pro. Tutti i diritti riservati / All rights reserved.
#  Unico proprietario legale: il Master. Sole legal owner: the Master.
#  Codice riservato: vietata copia, distribuzione, reverse engineering o
#  cloning non autorizzati. Unauthorized copying, distribution, reverse
#  engineering or cloning is strictly prohibited and actively tracked by
#  the BakoMix AI Security Guardian.
# ============================================================================
"""Cleanup for iteration 163: reset shared shift-state and remove seeded TEST weekly-plan item."""
import os
import requests
from dotenv import dotenv_values

BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL")
            or dotenv_values("/app/frontend/.env").get("REACT_APP_BACKEND_URL")).rstrip("/")
s = requests.Session()
s.headers.update({"Content-Type": "application/json"})
r = s.post(f"{BASE_URL}/api/auth/login", json={"email": "admin@mikilab.de", "password": "Mikilab2026!"}, timeout=30)
tok = r.json().get("session_token") or r.json().get("token")
if tok:
    s.headers.update({"Authorization": f"Bearer {tok}"})

print("shift reset:", s.put(f"{BASE_URL}/api/lab/shift-state", json={"work_mode": "continuo"}, timeout=30).status_code)
plan = s.get(f"{BASE_URL}/api/weekly-plan", timeout=30).json() or {}
items = [i for i in (plan.get("items") or []) if not str(i.get("id", "")).startswith("TEST_")]
print("weekly plan cleanup:", s.put(f"{BASE_URL}/api/weekly-plan", json={"items": items}, timeout=30).status_code,
      "remaining items:", len(items))
print("final shift state:", s.get(f"{BASE_URL}/api/lab/shift-state", timeout=30).json())
