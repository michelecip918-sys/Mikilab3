"""Rinomina le ricette Mikilab con nomi italiani curati (niente nomi banali).
Il nome tecnico originale resta nel flour_type come riferimento."""
import asyncio
import os
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).parent / ".env")

MAP = {
    "Vk Teig — Pane e Panini Integrali": "Anima Integrale",
    "Kart. Teig — Pane di Patate": "Oro di Terra",
    "Mittern. — Pane Mezzanotte": "Bruno d'Autunno",
    "Di-Spezial — Pane Speciale": "Gran Riserva",
    "Toast — Pane in Cassetta": "Nuvola in Cassetta",
    "Ital. Teig — Pane Italiano": "Cuore Italiano",
    "Diguette — Baguette": "Filo di Francia",
    "Hefeteig — Pane a Lievito di Birra": "Quotidiano del Fornaio",
    "Lg Brezel — Bretzel": "Bretzel del Maestro",
    "Croissant": "Cornetto Sfogliato",
    "Mürbe Br — Pane Dolce Morbido": "Carezza Dolce",
    "HefeZopf — Treccia Dolce": "Treccia del Sole",
    "Panettone (due impasti)": "Panettone Millebolle",
    "Backmittel naturale (miglioratore)": "Backmittel Naturale",
    "Pane alle Noci e Uvetta": "Rustico Noci e Uvetta",
    "Pane alle Cipolle Caramellate": "Dolce Cipolla",
    "Pane ai Semi di Canapa": "Verde Canapa",
}


async def main():
    c = AsyncIOMotorClient(os.environ["MONGO_URL"])
    db = c[os.environ["DB_NAME"]]
    for old, new in MAP.items():
        res = await db.recipes.update_one(
            {"collection_name": "mikilab", "name": old},
            {"$set": {"name": new, "updated_at": datetime.now(timezone.utc).isoformat()}},
        )
        print(f"{'OK' if res.modified_count else 'skip'}: {old} -> {new}")
    c.close()


if __name__ == "__main__":
    asyncio.run(main())
