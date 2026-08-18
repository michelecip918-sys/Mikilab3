"""Se una ricetta contiene SEMI, aggiunge in cima al procedimento la nota Quellstück
(ammollo dei semi la sera prima). Idempotente."""
import asyncio
import os
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).parent / ".env")

QUELL_NOTE = (
    "🌙 SE CI SONO SEMI, FAI IL QUELLSTÜCK: la sera prima pesa i semi e coprili con pari peso di acqua tiepida "
    "(1:1). Copri e lascia riposare tutta la notte. Il giorno dopo scolali e aggiungili all'impasto: così i semi "
    "non rubano acqua all'impasto e la mollica resta morbida e umida a lungo.\n\n"
)

SEED_WORDS = ["semi", "canapa", "girasole", "sesamo", "zucca", "papavero", "cereali", "lino"]


async def main():
    c = AsyncIOMotorClient(os.environ["MONGO_URL"])
    db = c[os.environ["DB_NAME"]]
    docs = await db.recipes.find({"collection_name": "mikilab"}, {"_id": 0}).to_list(1000)
    updated = 0
    for d in docs:
        text = (d.get("name", "") + " " + (d.get("flour_type") or "") + " " +
                " ".join((e.get("name") or "") for e in (d.get("extra_ingredients") or []))).lower()
        # 'lino dorato' come miglioratore non conta da solo: richiedi un vero seme
        has_seed = any(w in text for w in SEED_WORDS if w != "lino") or ("semi di lino" in text)
        if not has_seed:
            continue
        proc = d.get("procedure") or ""
        if "QUELLSTÜCK" in proc.upper():
            continue
        new_proc = QUELL_NOTE + proc
        await db.recipes.update_one(
            {"id": d["id"]},
            {"$set": {"procedure": new_proc, "updated_at": datetime.now(timezone.utc).isoformat()}},
        )
        updated += 1
        print(f"QUELL -> {d.get('name')}")
    print(f"\nAggiornate: {updated}")
    c.close()


if __name__ == "__main__":
    asyncio.run(main())
