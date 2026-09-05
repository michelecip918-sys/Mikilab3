# ============================================================================
#  MIKILAB PRO & BakoMix AI — PROPRIETARY & CONFIDENTIAL
#  (c) 2026 MikiLab Pro. Tutti i diritti riservati / All rights reserved.
#  Unico proprietario legale: il Master. Sole legal owner: the Master.
#  Codice riservato: vietata copia, distribuzione, reverse engineering o
#  cloning non autorizzati. Unauthorized copying, distribution, reverse
#  engineering or cloning is strictly prohibited and actively tracked by
#  the BakoMix AI Security Guardian.
# ============================================================================
"""Seed helper: crea 3 diagnosi di test per admin@mikilab.de (usato dal test UI Diagnosi Recenti)."""
import base64
import io
import os

import requests
from dotenv import dotenv_values

BASE = (os.environ.get("REACT_APP_BACKEND_URL") or dotenv_values("/app/frontend/.env")["REACT_APP_BACKEND_URL"]).rstrip("/")


def tiny_jpeg_data_url():
    try:
        from PIL import Image
        img = Image.new("RGB", (60, 60), (94, 139, 126))
        buf = io.BytesIO()
        img.save(buf, format="JPEG")
        return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()
    except Exception:
        return None


def main():
    s = requests.Session()
    r = s.post(f"{BASE}/api/auth/login", json={"email": "admin@mikilab.de", "password": "Mikilab2026!"})
    r.raise_for_status()
    token = r.json()["session_token"]
    h = {"Authorization": f"Bearer {token}"}
    thumb = tiny_jpeg_data_url()
    items = [
        {"mode": "difetti", "result": "## Causa\nTEST_ Alveolatura irregolare da **sottolievitazione**.\n\n## Soluzione\n- Prolunga la puntata di 30 min\n- Abbassa il TA a 24 gradi", "thumb": thumb},
        {"mode": "impasto", "result": "## Causa\nTEST_ Impasto sotto-incordato.\n\n## Soluzione\nProlunga 3 min a velocita 2.", "thumb": thumb},
        {"mode": "macchine", "result": "TEST_ Diagnosi senza miniatura (fallback icona camera).", "thumb": None},
    ]
    for it in items:
        rr = s.post(f"{BASE}/api/diagnosi/save", json=it, headers=h)
        print(it["mode"], rr.status_code, rr.json())
    print("recent:", [(d["mode"], bool(d.get("thumb")), (d.get("thumb") or "")[:30]) for d in s.get(f"{BASE}/api/diagnosi/recent", headers=h).json()])


if __name__ == "__main__":
    main()
