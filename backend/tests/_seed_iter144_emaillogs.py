# ============================================================================
#  MIKILAB PRO & BakoMix AI — PROPRIETARY & CONFIDENTIAL
#  (c) 2026 MikiLab Pro. Tutti i diritti riservati / All rights reserved.
#  Unico proprietario legale: il Master. Sole legal owner: the Master.
#  Codice riservato: vietata copia, distribuzione, reverse engineering o
#  cloning non autorizzati. Unauthorized copying, distribution, reverse
#  engineering or cloning is strictly prohibited and actively tracked by
#  the BakoMix AI Security Guardian.
# ============================================================================
"""Seed/cleanup TEST email_logs for iteration 144 UI verification."""
import asyncio
import os
import sys
from datetime import date, datetime, timedelta, timezone

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv("/app/backend/.env")


async def main(action):
    client = AsyncIOMotorClient(os.environ["MONGO_URL"])
    db = client[os.environ["DB_NAME"]]
    if action == "seed":
        docs = []
        for i in (0, 2, 20):
            docs.append({
                "day": (date.today() - timedelta(days=i)).isoformat(),
                "kind": "digest" if i % 2 == 0 else "instant",
                "to": "TEST_iter144@example.test",
                "meta": {"channel": "TEST_channel"},
                "count": 2 + i,
                "created_at": datetime.now(timezone.utc).isoformat(),
            })
        await db.email_logs.insert_many(docs)
        print("seeded", len(docs))
    else:
        r = await db.email_logs.delete_many({"to": "TEST_iter144@example.test"})
        print("deleted", r.deleted_count)
    client.close()


asyncio.run(main(sys.argv[1]))
