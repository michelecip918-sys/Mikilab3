import os
from dotenv import dotenv_values
from pymongo import MongoClient

env = dotenv_values("/app/backend/.env")
c = MongoClient(env["MONGO_URL"])
db = c[env["DB_NAME"]]
print("before:", db.entitlements.find_one({"email": "fornaio@mikilab.de"}, {"_id": 0}))
db.entitlements.delete_many({"email": "fornaio@mikilab.de"})
print("after:", db.entitlements.find_one({"email": "fornaio@mikilab.de"}, {"_id": 0}))
