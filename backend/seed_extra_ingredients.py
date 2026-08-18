"""Aggiunge gli ingredienti extra (con % sul peso farina) alle ricette Mikilab:
olio d'oliva 3%, aceto di mele (Apfelessig) 1%, Kokosfett 2% sui pani salati.
Aggiunge inoltre la composizione del Backmittel naturale come percentuali.
Il miglioratore (Backmittel 3%) è già mostrato automaticamente nella card, quindi
non viene ripetuto qui. Idempotente: sovrascrive extra_ingredients di ogni ricetta."""
import asyncio
import os
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# Extra ingredienti standard del metodo di Michele (pani salati)
SAVORY_EXTRAS = [
    {"name": "Olio d'oliva", "percent": 3},
    {"name": "Aceto di mele (Apfelessig)", "percent": 1},
    {"name": "Kokosfett (grasso di cocco)", "percent": 2},
]

PROCESS_NOTE = ("\n\n⭐ I miei extra (metodo Michele): aceto di mele + olio d'oliva + sale a fine impasto; "
                "il Kokosfett fuso e tiepido dopo aver formato la palla. Più il Backmittel naturale (~3%).")

# Ricette escluse dagli extra (dolci, sfogliati, bretzel, il miglioratore stesso)
EXCLUDE = {
    "Panettone Millebolle", "Sfoglia d'Autore", "Croissant al Farro",
    "Pane al Latte (Milchbrot)", "Laugen del Maestro", "Brezel della Tradizione",
    "Backmittel naturale (miglioratore)",
}

# Composizione del Backmittel naturale (percentuali sul peso farina della ricetta in cui si usa)
BACKMITTEL_COMPONENTS = [
    {"name": "Malto (Malz)", "percent": 0.3},
    {"name": "Farina di lupino dolce (Süßlupinenmehl)", "percent": 1},
    {"name": "Acerola in polvere (Acerolapulver)", "percent": 0.3},
    {"name": "Semi di lino dorato macinati (Goldleinsaat)", "percent": 2},
    {"name": "Buccia di psillio (Flohsamenschalen)", "percent": 0.5},
]


def now_iso():
    return datetime.now(timezone.utc).isoformat()


async def main():
    client = AsyncIOMotorClient(os.environ["MONGO_URL"])
    db = client[os.environ["DB_NAME"]]

    docs = await db.recipes.find({"collection_name": "mikilab"}, {"_id": 0}).to_list(1000)
    updated = 0
    for d in docs:
        name = d.get("name", "")
        if name == "Backmittel naturale (miglioratore)":
            update = {"extra_ingredients": BACKMITTEL_COMPONENTS, "updated_at": now_iso()}
            await db.recipes.update_one({"id": d["id"]}, {"$set": update})
            updated += 1
            print(f"BACKMITTEL composizione -> {name}")
            continue
        if name in EXCLUDE:
            print(f"SKIP (escluso): {name}")
            continue
        notes = d.get("notes") or ""
        if "I miei extra (metodo Michele)" not in notes:
            notes = notes + PROCESS_NOTE
        update = {"extra_ingredients": SAVORY_EXTRAS, "notes": notes, "updated_at": now_iso()}
        await db.recipes.update_one({"id": d["id"]}, {"$set": update})
        updated += 1
        print(f"EXTRA -> {name}")

    print(f"\nAggiornate: {updated}")
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
