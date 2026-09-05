# ============================================================================
#  MIKILAB PRO & BakoMix AI — PROPRIETARY & CONFIDENTIAL
#  (c) 2026 MikiLab Pro. Tutti i diritti riservati / All rights reserved.
#  Unico proprietario legale: il Master. Sole legal owner: the Master.
#  Codice riservato: vietata copia, distribuzione, reverse engineering o
#  cloning non autorizzati. Unauthorized copying, distribution, reverse
#  engineering or cloning is strictly prohibited and actively tracked by
#  the BakoMix AI Security Guardian.
# ============================================================================
import asyncio, re
from dotenv import dotenv_values
from motor.motor_asyncio import AsyncIOMotorClient

env = dotenv_values("/app/backend/.env")

async def main():
    cl = AsyncIOMotorClient(env["MONGO_URL"]); db = cl[env["DB_NAME"]]
    p = await db.community_posts.delete_many({"text": {"$regex": "TEST_notif|TEST_iter42"}})
    n = await db.notifications.delete_many({"snippet": {"$regex": "TEST_notif|TEST_iter42|TEST_self"}})
    # rimuovi commenti/notifiche di test dal post "campanella"
    c = await db.community_posts.update_many({}, {"$pull": {"comments": {"text": {"$regex": "TEST_iter42"}}}})
    n2 = await db.notifications.delete_many({"snippet": "Post per test notifiche campanella"})
    print("posts", p.deleted_count, "notifs", n.deleted_count + n2.deleted_count, "posts_upd", c.modified_count)
    left = await db.notifications.count_documents({})
    print("notifications left:", left)

asyncio.run(main())
