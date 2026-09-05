# ============================================================================
#  MIKILAB PRO & BakoMix AI — PROPRIETARY & CONFIDENTIAL
#  (c) 2026 MikiLab Pro. Tutti i diritti riservati / All rights reserved.
#  Unico proprietario legale: il Master. Sole legal owner: the Master.
#  Codice riservato: vietata copia, distribuzione, reverse engineering o
#  cloning non autorizzati. Unauthorized copying, distribution, reverse
#  engineering or cloning is strictly prohibited and actively tracked by
#  the BakoMix AI Security Guardian.
# ============================================================================
"""Temporarily set/restore admin streak to verify streak-reward badge rendering."""
import asyncio
import os
import sys
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import dotenv_values

env = dotenv_values("/app/backend/.env")
MONGO_URL = os.environ.get("MONGO_URL") or env.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME") or env.get("DB_NAME")


async def main(mode):
    db = AsyncIOMotorClient(MONGO_URL)[DB_NAME]
    q = {"email": "admin@mikilab.de"}
    if mode == "set":
        u = await db.users.find_one(q, {"_id": 0, "streak_current": 1, "streak_best": 1, "activity_last": 1})
        print("BEFORE:", u)
        from datetime import date
        await db.users.update_one(q, {"$set": {"streak_current": 7, "streak_best": 9, "activity_last": date.today().isoformat()}})
        print("SET streak_current=7")
    else:
        await db.users.update_one(q, {"$set": {"streak_current": 0, "streak_best": 0}, "$unset": {"activity_last": ""}})
        print("RESTORED streak to 0")
    print(await db.users.find_one(q, {"_id": 0, "streak_current": 1, "streak_best": 1, "activity_last": 1}))


asyncio.run(main(sys.argv[1]))
