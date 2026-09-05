# ============================================================================
#  MIKILAB PRO & BakoMix AI — PROPRIETARY & CONFIDENTIAL
#  (c) 2026 MikiLab Pro. Tutti i diritti riservati / All rights reserved.
#  Unico proprietario legale: il Master. Sole legal owner: the Master.
#  Codice riservato: vietata copia, distribuzione, reverse engineering o
#  cloning non autorizzati. Unauthorized copying, distribution, reverse
#  engineering or cloning is strictly prohibited and actively tracked by
#  the BakoMix AI Security Guardian.
# ============================================================================
import asyncio, os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import dotenv_values
env = dotenv_values('/app/backend/.env')

async def main():
    c = AsyncIOMotorClient(env['MONGO_URL'])
    db = c[env['DB_NAME']]
    rows = await db.payment_transactions.find({"bundle": {"$exists": True}}, {"_id":0,"session_id":1,"lang":1,"created_at":1}).sort("created_at",-1).to_list(8)
    for r in rows: print(r)
    n = await db.recipes.count_documents({"collection":"mikilab"})
    print("mikilab recipes:", n)
    r = await db.recipes.find_one({"collection":"mikilab"}, {"_id":0,"name":1,"name_es":1,"procedure_es":1})
    print(r["name"], "|", r.get("name_es"), "|", (r.get("procedure_es") or "")[:120])
asyncio.run(main())
