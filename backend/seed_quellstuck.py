"""Aggiunge il Pane ai 5 Cereali con Quellstück (semi ammollati la sera prima)."""
import asyncio
import os
import uuid
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).parent / ".env")


def now_iso():
    return datetime.now(timezone.utc).isoformat()


PROC = (
    "🌙 LA SERA PRIMA — Quellstück (semi ammollati): pesa il mix di 5 cereali/semi (girasole, lino, sesamo, "
    "avena, miglio) e coprilo con pari peso di acqua tiepida (rapporto 1:1). Copri e lascia riposare tutta la notte "
    "a temperatura ambiente: i semi si ammorbidiscono, non rubano acqua all'impasto e rendono la mollica morbida e umida.\n\n"
    "IL GIORNO DOPO:\n"
    "1) Prefermento: rinfresca lievito madre / poolish e fallo maturare fino a raddoppio.\n"
    "2) Autolisi: mescola farina e acqua, riposo 30 minuti.\n"
    "3) Impasto: unisci il prefermento, poi gli ingredienti secchi (glutine, malto, lino dorato, miglioratore) e incorda.\n"
    "4) Aggiungi il Quellstück scolato e i semi; poi il Kokosfett a palla; per ultimi olio, aceto e sale.\n"
    "5) CELLA A 16°C subito dopo l'impasto: riposo MASSIMO 6 ore.\n"
    "6) Spezza, forma (o fai i panini), rotola nei semi e metti in appretto.\n"
    "7) Cottura: 225°C per 40 minuti (panini ~18′), con vapore nei primi 10 minuti.\n\n"
    "👉 Panini ai cereali con lo STESSO impasto: pezzi da ~90 g, arrotondati e passati nei semi."
)


def E(name, pct):
    return {"name": name, "percent": pct}


RECIPE = {
    "id": str(uuid.uuid4()),
    "collection_name": "mikilab",
    "name": "Sinfonia di Cereali",
    "flour_type": "Mix 5 cereali + Quellstück (semi ammollati)",
    "origin": "de",
    "hydration_percent": 76,
    "flour_grams": 1000, "water_grams": 760, "sourdough_grams": 200, "salt_grams": 20,
    "preferment_type": "poolish", "method_type": "indiretto",
    "mix_minutes": 12, "bake_temp": 225, "bake_minutes": 40, "oven_type": "ventilato",
    "image_url": "https://images.unsplash.com/photo-1628809643534-b3d1faffe8d2?crop=entropy&cs=srgb&fm=jpg&w=800&q=70",
    "extra_ingredients": [
        E("Quellstück (5 cereali ammollati)", 40),
        E("Kokosfett", 1), E("Olio d'oliva (Öl)", 1), E("Aceto di mele (Essig)", 1),
        E("Miglioratore naturale (Backmittel)", 2), E("Malto (Malz)", 1),
        E("Lino dorato (Gold)", 1), E("Glutine (Di.Glutin)", 2), E("Lievito di birra (Hefe)", 0.7),
    ],
    "notes": ("Pane multicereale con Quellstück: i semi ammollati la sera prima danno una mollica morbida e "
              "una lunga conservazione. Amatissimo in Germania."),
    "procedure": PROC,
    "costing": None,
    "created_at": now_iso(), "updated_at": now_iso(),
}


async def main():
    c = AsyncIOMotorClient(os.environ["MONGO_URL"])
    db = c[os.environ["DB_NAME"]]
    exists = await db.recipes.find_one({"collection_name": "mikilab", "name": RECIPE["name"]})
    if exists:
        print("Esiste gia', salto.")
    else:
        await db.recipes.insert_one(RECIPE)
        print(f"ADD: {RECIPE['name']}")
    c.close()


if __name__ == "__main__":
    asyncio.run(main())
