"""Rinomina 'Backmittel' in 'Miglioratore naturale' (italiano) sia negli ingredienti
extra sia nel nome della ricetta, e assegna l'origine (bandiera) a ogni ricetta."""
import asyncio
import os
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).parent / ".env")

ORIGINS = {
    "Anima Integrale": "de",
    "Bretzel del Maestro": "de",
    "Bruno d'Autunno": "de",
    "Carezza Dolce": "de",
    "Cornetto Sfogliato": "fr",
    "Cuore Italiano": "it",
    "Dolce Cipolla": "it",
    "Filo di Francia": "fr",
    "Gran Riserva": "de",
    "Nuvola in Cassetta": "de",
    "Oro di Terra": "de",
    "Panettone Millebolle": "it",
    "Quotidiano del Fornaio": "de",
    "Rustico Noci e Uvetta": "it",
    "Treccia del Sole": "de",
    "Verde Canapa": "it",
}


async def main():
    c = AsyncIOMotorClient(os.environ["MONGO_URL"])
    db = c[os.environ["DB_NAME"]]
    docs = await db.recipes.find({"collection_name": "mikilab"}, {"_id": 0}).to_list(1000)
    for d in docs:
        upd = {"updated_at": datetime.now(timezone.utc).isoformat()}
        # rinomina ingrediente Backmittel -> Miglioratore naturale
        extras = d.get("extra_ingredients") or []
        changed = False
        for e in extras:
            if e.get("name") and "Backmittel" in e["name"]:
                e["name"] = "Miglioratore naturale (Backmittel)"
                changed = True
        if changed:
            upd["extra_ingredients"] = extras
        # rinomina la ricetta Backmittel Naturale
        name = d.get("name", "")
        if name == "Backmittel Naturale":
            upd["name"] = "Miglioratore Naturale"
        # origine
        new_name = upd.get("name", name)
        if new_name in ORIGINS:
            upd["origin"] = ORIGINS[new_name]
        await db.recipes.update_one({"id": d["id"]}, {"$set": upd})
        print(f"OK: {name} -> {upd.get('name', name)} | origin={upd.get('origin', d.get('origin'))}")
    c.close()


if __name__ == "__main__":
    asyncio.run(main())
