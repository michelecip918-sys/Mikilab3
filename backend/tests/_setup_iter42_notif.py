# ============================================================================
#  MIKILAB PRO & BakoMix AI — PROPRIETARY & CONFIDENTIAL
#  (c) 2026 MikiLab Pro. Tutti i diritti riservati / All rights reserved.
#  Unico proprietario legale: il Master. Sole legal owner: the Master.
#  Codice riservato: vietata copia, distribuzione, reverse engineering o
#  cloning non autorizzati. Unauthorized copying, distribution, reverse
#  engineering or cloning is strictly prohibited and actively tracked by
#  the BakoMix AI Security Guardian.
# ============================================================================
"""Setup UI test iter42: crea post admin + like/commento da fornaio → 2 notifiche non lette per admin.
Uso: python _setup_iter42_notif.py setup | cleanup
"""
import sys, os, json, requests
from dotenv import dotenv_values

BASE = (dotenv_values("/app/frontend/.env").get("REACT_APP_BACKEND_URL")).rstrip("/")
API = f"{BASE}/api"
STATE = "/tmp/iter42_post.json"


def login(email):
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": email, "password": "Mikilab2026!"}, timeout=30)
    r.raise_for_status()
    s.headers.update({"Authorization": f"Bearer {r.json()['session_token']}"})
    return s


if sys.argv[1] == "setup":
    a = login("admin@mikilab.de")
    f = login("fornaio@mikilab.de")
    pid = a.post(f"{API}/community/posts", json={"text": "TEST_iter42 post per notifiche", "category": "consiglio"}, timeout=30).json()["id"]
    print("like", f.post(f"{API}/community/posts/{pid}/like", timeout=30).status_code)
    print("comment", f.post(f"{API}/community/posts/{pid}/comments", json={"text": "TEST_iter42 bel post!"}, timeout=30).status_code)
    d = a.get(f"{API}/notifications", timeout=30).json()
    print("unread", d["unread"], "items", len(d["items"]))
    json.dump({"post_id": pid}, open(STATE, "w"))
else:
    a = login("admin@mikilab.de")
    if os.path.exists(STATE):
        pid = json.load(open(STATE))["post_id"]
        print("delete post", a.delete(f"{API}/community/posts/{pid}", timeout=30).status_code)
    # rimuovi notifiche di test
    import asyncio
    from motor.motor_asyncio import AsyncIOMotorClient
    env = dotenv_values("/app/backend/.env")

    async def clean():
        cl = AsyncIOMotorClient(env["MONGO_URL"])
        db = cl[env["DB_NAME"]]
        r = await db.notifications.delete_many({"snippet": {"$regex": "TEST_iter42"}})
        r2 = await db.community_posts.delete_many({"text": {"$regex": "TEST_notif|TEST_iter42"}})
        print("notif deleted", r.deleted_count, "posts deleted", r2.deleted_count)
    asyncio.run(clean())
