import asyncio, os, uuid, bcrypt
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
load_dotenv()

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]

def now_iso():
    return datetime.now(timezone.utc).isoformat()

async def main():
    db = AsyncIOMotorClient(MONGO_URL)[DB_NAME]
    email = "operatore@mikilab.de"
    pw = "Test1234!"
    ph = bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()
    doc = {
        "user_id": str(uuid.uuid4()), "email": email, "name": "Operatore Forni",
        "password_hash": ph, "created_at": now_iso(), "email_verified": True,
        "auth_provider": "email", "role": "operatore", "picture": "",
        "operator_name": "Operatore Forni", "department": "forni",
    }
    await db.users.update_one({"email": email}, {"$set": doc}, upsert=True)
    print("Seeded operator:", email, "/ role=operatore / department=forni")

asyncio.run(main())
