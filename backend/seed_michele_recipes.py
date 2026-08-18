"""Aggiorna il ricettario Mikilab:
1) Rende ORIGINALI (grano, niente farro) le classiche panettone/focaccia/ciabatta/pane italiano
   e aggiunge in coda una nota 'Variante farro (Dinkel)'.
2) Aggiunge nuove ricette col metodo di Michele (indiretto + lievito madre + Backmittel),
   incluse specialita' (patate, noci, cipolle, semi di canapa, ...).
Idempotente: salta le ricette gia' presenti e aggiorna le classiche solo se serve."""
import asyncio
import os
import uuid
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

BACKMITTEL = ("Metodo indiretto con lievito madre/Sauerteig. "
              "Uso sempre il mio Backmittel naturale (~3-4% sul peso della farina) "
              "per crosta, colore, alveolatura e freschezza piu' a lungo.")

FARRO_VARIANT = ("\n\n🌾 VARIANTE FARRO (Dinkel): puoi farla anche con farina di farro (Dinkel Type 630 o 1050). "
                 "Il farro assorbe di piu': aumenta l'acqua del +3-5%. Impasta di meno e con delicatezza "
                 "(il glutine del farro e' piu' fragile) e accorcia un po' la lievitazione. "
                 "Sapore piu' rustico e digeribile.")

# --- Aggiornamento delle ricette classiche: originali con grano + variante farro ---
CLASSIC_UPDATES = [
    {
        "match": "Panettone Millebolle",
        "flour_type": "Farina di grano alta forza W380",
        "note_replace": [("Il mio panettone al Dinkel", "Il mio panettone")],
    },
    {
        "match": "Focaccia del Poolish",
        "flour_type": "Farina Tipo 0 (W280)",
        "note_replace": [],
    },
    {
        "match": "Ciabatta delle Nuvole",
        "flour_type": "Farina Tipo 0 W350",
        "note_replace": [],
    },
    {
        "match": "Cuore Italiano al Farro",
        "new_name": "Cuore Italiano",
        "flour_type": "Farina Tipo 1 (stile italiano)",
        "note_replace": [("con Dinkel e lievito madre", "con farina di grano e lievito madre"),
                          ("Il mio 'Ita Teig', impasto", "Il mio 'Ita Teig' originale, impasto")],
    },
]

# --- Nuove ricette (farro_variant=True aggiunge la nota variante farro) ---
RECIPES = [
    {
        "name": "Pane alle Patate (Kartoffelbrot)",
        "flour_type": "Farina Tipo 1 + patate lessate",
        "hydration_percent": 68,
        "flour_grams": 1000, "water_grams": 620, "sourdough_grams": 200, "salt_grams": 20,
        "bulk_fermentation_hours": 4, "proofing_hours": 2,
        "preferment_type": "lm", "method_type": "indiretto", "mix_minutes": 14,
        "bake_temp": 230, "bake_minutes": 45, "oven_type": "statico",
        "image_url": "https://images.pexels.com/photos/12669855/pexels-photo-12669855.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        "farro_variant": True,
        "notes": ("Il mio pane alle patate. LAVA bene le patate e LESSALE con la BUCCIA (cosi' trattengono amido e sapore). "
                  "Falle raffreddare e usale il GIORNO DOPO: sbucciale e schiacciale, poi aggiungile all'impasto "
                  "(circa 250-300 g di patate su 1 kg di farina). La patata rende la mollica umida, soffice e la conserva a lungo. "
                  "Riduci un po' l'acqua perche' la patata ne porta gia'. " + BACKMITTEL),
    },
    {
        "name": "Pagnotta di Matera",
        "flour_type": "Semola Rimacinata di Grano Duro",
        "hydration_percent": 76,
        "flour_grams": 1000, "water_grams": 760, "sourdough_grams": 200, "salt_grams": 20,
        "bulk_fermentation_hours": 5, "proofing_hours": 2.5,
        "preferment_type": "lm", "method_type": "indiretto", "mix_minutes": 16,
        "bake_temp": 240, "bake_minutes": 45, "oven_type": "statico",
        "image_url": "https://images.unsplash.com/photo-1616841888027-89693dec0827?crop=entropy&cs=srgb&fm=jpg&w=800&q=70",
        "farro_variant": True,
        "notes": ("La pagnotta della mia terra, Matera. Forma a cornetto alta, crosta croccante e mollica gialla e profumata. "
                  "Cottura calante: parti forte e abbassa negli ultimi minuti. " + BACKMITTEL),
    },
    {
        "name": "Pane di Segale e Miele (Roggenbrot)",
        "flour_type": "70% Segale (Roggen) + 30% Tipo 1",
        "hydration_percent": 74,
        "flour_grams": 1000, "water_grams": 740, "sourdough_grams": 250, "salt_grams": 18,
        "bulk_fermentation_hours": 3, "proofing_hours": 1.5,
        "preferment_type": "lm", "method_type": "indiretto", "mix_minutes": 10,
        "bake_temp": 220, "bake_minutes": 50, "oven_type": "statico",
        "image_url": "https://images.pexels.com/photos/11214699/pexels-photo-11214699.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        "farro_variant": False,
        "notes": ("Pane tedesco di segale, tipico della zona. La segale vuole piu' lievito madre e impasto breve. "
                  "Un cucchiaio di miele aiuta doratura e sapore. Ottimo con affettati e formaggi. " + BACKMITTEL),
    },
    {
        "name": "Baguette all'Italiana (Poolish)",
        "flour_type": "Farina Tipo 0 W300",
        "hydration_percent": 72,
        "flour_grams": 1000, "water_grams": 720, "sourdough_grams": 100, "salt_grams": 20,
        "bulk_fermentation_hours": 3, "proofing_hours": 1,
        "preferment_type": "poolish", "method_type": "indiretto", "mix_minutes": 14,
        "bake_temp": 240, "bake_minutes": 22, "oven_type": "ventilato",
        "image_url": "https://images.unsplash.com/photo-1728670212431-ac192413f4b1?crop=entropy&cs=srgb&fm=jpg&w=800&q=70",
        "farro_variant": True,
        "notes": ("Baguette con poolish (prefermento liquido) la sera prima. Crosta sottile e cantante, alveoli aperti. "
                  "Vapore abbondante nei primi 10 minuti. " + BACKMITTEL),
    },
    {
        "name": "Pane ai 5 Cereali (Mehrkorn)",
        "flour_type": "Mix 5 cereali (frumento, farro, segale, avena, orzo)",
        "hydration_percent": 76,
        "flour_grams": 1000, "water_grams": 760, "sourdough_grams": 200, "salt_grams": 20,
        "bulk_fermentation_hours": 4, "proofing_hours": 2,
        "preferment_type": "lm", "method_type": "indiretto", "mix_minutes": 12,
        "bake_temp": 225, "bake_minutes": 40, "oven_type": "ventilato",
        "image_url": "https://images.unsplash.com/photo-1628809643534-b3d1faffe8d2?crop=entropy&cs=srgb&fm=jpg&w=800&q=70",
        "farro_variant": False,
        "notes": ("Pane multicereale sostanzioso, amatissimo qui in Germania. Ammolla i cereali in fiocchi la sera prima (Bruhstuck) "
                  "per una mollica morbida. " + BACKMITTEL),
    },
    {
        "name": "Pane alle Noci e Uvetta",
        "flour_type": "Farina Tipo 1",
        "hydration_percent": 70,
        "flour_grams": 1000, "water_grams": 700, "sourdough_grams": 180, "salt_grams": 18,
        "bulk_fermentation_hours": 4, "proofing_hours": 2,
        "preferment_type": "lm", "method_type": "indiretto", "mix_minutes": 12,
        "bake_temp": 220, "bake_minutes": 38, "oven_type": "statico",
        "image_url": "https://images.pexels.com/photos/1255097/pexels-photo-1255097.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        "farro_variant": True,
        "notes": ("Pane rustico dolce-salato: noci tostate e uvetta ammollata (circa 150 g noci + 120 g uvetta su 1 kg). "
                  "Perfetto con formaggi stagionati. Aggiungi noci e uvetta a fine impasto. " + BACKMITTEL),
    },
    {
        "name": "Pane alle Cipolle Caramellate",
        "flour_type": "Farina Tipo 1",
        "hydration_percent": 72,
        "flour_grams": 1000, "water_grams": 720, "sourdough_grams": 180, "salt_grams": 20,
        "bulk_fermentation_hours": 4, "proofing_hours": 2,
        "preferment_type": "lm", "method_type": "indiretto", "mix_minutes": 13,
        "bake_temp": 225, "bake_minutes": 40, "oven_type": "ventilato",
        "image_url": "https://images.unsplash.com/photo-1549413468-cd78edb7e75c?crop=entropy&cs=srgb&fm=jpg&w=800&q=70",
        "farro_variant": True,
        "notes": ("Pane saporito con cipolle stufate dolci (circa 200 g su 1 kg). Stufa le cipolle a fuoco basso finche' "
                  "diventano dorate e dolci, falle raffreddare e aggiungile durante le pieghe. Ottimo per bruschette e taglieri. " + BACKMITTEL),
    },
    {
        "name": "Pane ai Semi di Canapa",
        "flour_type": "Farina Tipo 1 + semi di canapa decorticati",
        "hydration_percent": 75,
        "flour_grams": 1000, "water_grams": 750, "sourdough_grams": 180, "salt_grams": 20,
        "bulk_fermentation_hours": 4, "proofing_hours": 2,
        "preferment_type": "lm", "method_type": "indiretto", "mix_minutes": 12,
        "bake_temp": 220, "bake_minutes": 40, "oven_type": "ventilato",
        "image_url": "https://images.unsplash.com/photo-1706954622635-939539dd9246?crop=entropy&cs=srgb&fm=jpg&w=800&q=70",
        "farro_variant": True,
        "notes": ("Pane moderno e nutriente con semi di canapa decorticati (circa 80 g su 1 kg): ricchi di proteine e omega, "
                  "gusto delicato di nocciola. Aggiungi i semi a fine impasto e spolverali anche in copertura. " + BACKMITTEL),
    },
    {
        "name": "Pane alle Olive e Rosmarino",
        "flour_type": "Farina Tipo 0",
        "hydration_percent": 72,
        "flour_grams": 1000, "water_grams": 720, "sourdough_grams": 180, "salt_grams": 18,
        "bulk_fermentation_hours": 4, "proofing_hours": 1.5,
        "preferment_type": "lm", "method_type": "indiretto", "mix_minutes": 14,
        "bake_temp": 230, "bake_minutes": 35, "oven_type": "ventilato",
        "image_url": "https://images.unsplash.com/photo-1542482331-f0979d6616ad?crop=entropy&cs=srgb&fm=jpg&w=800&q=70",
        "farro_variant": True,
        "notes": ("Profumo mediterraneo: olive taggiasche denocciolate e rosmarino fresco (circa 150 g olive su 1 kg). "
                  "Un filo d'olio EVO nell'impasto. Aggiungi olive e rosmarino durante le pieghe. " + BACKMITTEL),
    },
    {
        "name": "Pane al Latte (Milchbrot)",
        "flour_type": "Farina forte Tipo 0 W330",
        "hydration_percent": 60,
        "flour_grams": 1000, "water_grams": 550, "sourdough_grams": 150, "salt_grams": 18,
        "bulk_fermentation_hours": 3, "proofing_hours": 2,
        "preferment_type": "lm", "method_type": "indiretto", "mix_minutes": 16,
        "bake_temp": 190, "bake_minutes": 28, "oven_type": "statico",
        "image_url": "https://images.unsplash.com/photo-1620921568790-c1cf8984624c?crop=entropy&cs=srgb&fm=jpg&w=800&q=70",
        "farro_variant": True,
        "notes": ("Pane arricchito con latte e burro: mollica soffice e filante, ideale per colazione e panini dolci. "
                  "Usa latte al posto di parte dell'acqua + 80 g burro morbido. Cottura piu' dolce per non bruciare gli zuccheri. " + BACKMITTEL),
    },
    {
        "name": "Pane di Grano Antico (Senatore Cappelli)",
        "flour_type": "Semola di grano antico Senatore Cappelli",
        "hydration_percent": 74,
        "flour_grams": 1000, "water_grams": 740, "sourdough_grams": 200, "salt_grams": 20,
        "bulk_fermentation_hours": 5, "proofing_hours": 2,
        "preferment_type": "lm", "method_type": "indiretto", "mix_minutes": 14,
        "bake_temp": 235, "bake_minutes": 42, "oven_type": "statico",
        "image_url": "https://images.unsplash.com/photo-1590301157172-7ba48dd1c2b2?crop=entropy&cs=srgb&fm=jpg&w=800&q=70",
        "farro_variant": True,
        "notes": ("Grano antico dal sapore intenso e altamente digeribile. Idratazione graduale (il grano antico assorbe piano). "
                  "Lievitazione lunga per esaltare gli aromi. " + BACKMITTEL),
    },
    {
        "name": "Panini Rustici ai Semi di Zucca",
        "flour_type": "Dinkel (farro) + semi di zucca",
        "hydration_percent": 78,
        "flour_grams": 1000, "water_grams": 780, "sourdough_grams": 180, "salt_grams": 20,
        "bulk_fermentation_hours": 4, "proofing_hours": 2,
        "preferment_type": "lm", "method_type": "indiretto", "mix_minutes": 12,
        "bake_temp": 220, "bake_minutes": 20, "oven_type": "ventilato",
        "image_url": "https://images.unsplash.com/photo-1628809643534-b3d1faffe8d2?crop=entropy&cs=srgb&fm=jpg&w=800&q=70",
        "farro_variant": False,
        "notes": ("Panini integrali di farro con semi di zucca in impasto e in copertura. Croccanti fuori, morbidi dentro. "
                  "Un pizzico di psillio aiuta la mollica. Perfetti per la colazione tedesca. " + BACKMITTEL),
    },
]


def now_iso():
    return datetime.now(timezone.utc).isoformat()


async def main():
    client = AsyncIOMotorClient(os.environ["MONGO_URL"])
    db = client[os.environ["DB_NAME"]]

    # 1) Aggiorna le classiche
    for u in CLASSIC_UPDATES:
        doc = await db.recipes.find_one({"collection_name": "mikilab", "name": u["match"]})
        if not doc:
            print(f"CLASSICA non trovata: {u['match']}")
            continue
        notes = doc.get("notes") or ""
        for old, new in u.get("note_replace", []):
            notes = notes.replace(old, new)
        if "VARIANTE FARRO" not in notes:
            notes = notes + FARRO_VARIANT
        update = {"flour_type": u["flour_type"], "notes": notes, "updated_at": now_iso()}
        if u.get("new_name"):
            update["name"] = u["new_name"]
        await db.recipes.update_one({"id": doc["id"]}, {"$set": update})
        print(f"UPDATE classica: {u['match']} -> {update.get('name', u['match'])}")

    # 2) Aggiunge le nuove ricette
    added, skipped = 0, 0
    for r in RECIPES:
        r = dict(r)
        farro = r.pop("farro_variant", False)
        if farro:
            r["notes"] = r["notes"] + FARRO_VARIANT
        existing = await db.recipes.find_one({"collection_name": "mikilab", "name": r["name"]})
        if existing:
            skipped += 1
            print(f"SKIP (esiste gia'): {r['name']}")
            continue
        doc = {
            "id": str(uuid.uuid4()),
            "collection_name": "mikilab",
            "costing": None,
            "created_at": now_iso(),
            "updated_at": now_iso(),
            **r,
        }
        await db.recipes.insert_one(doc)
        added += 1
        print(f"ADD: {r['name']}")
    print(f"\nNuove aggiunte: {added} | Saltate: {skipped}")
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
