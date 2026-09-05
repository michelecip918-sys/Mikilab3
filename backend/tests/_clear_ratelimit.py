# ============================================================================
#  MIKILAB PRO & BakoMix AI — PROPRIETARY & CONFIDENTIAL
#  (c) 2026 MikiLab Pro. Tutti i diritti riservati / All rights reserved.
#  Unico proprietario legale: il Master. Sole legal owner: the Master.
#  Codice riservato: vietata copia, distribuzione, reverse engineering o
#  cloning non autorizzati. Unauthorized copying, distribution, reverse
#  engineering or cloning is strictly prohibited and actively tracked by
#  the BakoMix AI Security Guardian.
# ============================================================================
import asyncio
import os

from dotenv import dotenv_values
from motor.motor_asyncio import AsyncIOMotorClient

env = dotenv_values("/app/backend/.env")
MONGO_URL = os.environ.get("MONGO_URL") or env["MONGO_URL"]
DB_NAME = os.environ.get("DB_NAME") or env["DB_NAME"]


async def main():
    c = AsyncIOMotorClient(MONGO_URL)
    db = c[DB_NAME]
    r = await db.rate_limits.delete_many({"_id": {"$regex": "^register:"}})
    print("deleted register rate_limits:", r.deleted_count)
    r2 = await db.login_attempts.delete_many({})
    print("deleted login_attempts:", r2.deleted_count)


asyncio.run(main())
