"""Cleanup of iteration-77 frontend test data (admin day closures / haccp logs / inventory)."""
import asyncio
import os

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv("/app/backend/.env")


async def main():
    client = AsyncIOMotorClient(os.environ["MONGO_URL"])
    db = client[os.environ["DB_NAME"]]
    admin = await db.users.find_one({"email": "admin@mikilab.de"})
    uid = admin["user_id"]
    print("admin uid:", uid)
    for coll in ("day_closures", "haccp_logs", "inventory_items", "inventory"):
        names = await db.list_collection_names()
        if coll not in names:
            continue
        cur = db[coll].find({"$or": [{"owner_id": uid}, {"user_id": uid}]})
        docs = await cur.to_list(200)
        print(coll, "docs for admin:", len(docs))
        r = await db[coll].delete_many({"$or": [{"owner_id": uid}, {"user_id": uid}]})
        print(coll, "deleted:", r.deleted_count)
    # verify
    for coll in ("day_closures", "haccp_logs", "inventory_items", "inventory"):
        if coll in await db.list_collection_names():
            n = await db[coll].count_documents({"$or": [{"owner_id": uid}, {"user_id": uid}]})
            print("remaining", coll, n)
    client.close()


asyncio.run(main())
