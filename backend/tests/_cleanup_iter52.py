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
from dotenv import dotenv_values
from pymongo import MongoClient

env = dotenv_values("/app/backend/.env")
c = MongoClient(env["MONGO_URL"])
db = c[env["DB_NAME"]]
print("before:", db.entitlements.find_one({"email": "fornaio@mikilab.de"}, {"_id": 0}))
db.entitlements.delete_many({"email": "fornaio@mikilab.de"})
print("after:", db.entitlements.find_one({"email": "fornaio@mikilab.de"}, {"_id": 0}))
