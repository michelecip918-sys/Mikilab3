import os, json, asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
load_dotenv('/app/backend/.env')

def ing(name, de, en, es, fr, fa, pct):
    return {"name": name, "percent": pct, "name_de": de, "name_en": en, "name_es": es, "name_fr": fr, "name_fa": fa}

OIL_DOUGH = ing("Olio extravergine (nell'impasto)", "Natives Olivenöl (im Teig)", "Extra virgin olive oil (in the dough)", "Aceite virgen extra (en la masa)", "Huile d'olive vierge (dans la pâte)", "روغن زیتون فرابکر (در خمیر)", 4)
MALT = ing("Malto d'orzo", "Gerstenmalz", "Barley malt", "Malta de cebada", "Malt d'orge", "مالت جو", 1)

NOTE = {
 "procedure": "\n\nUN FILO D'OLIO NELL'IMPASTO: aggiungo sempre un filo d'olio extravergine direttamente nell'impasto (verso fine impasto) per una mollica più soffice e profumata, e un pizzico di malto d'orzo per crosta dorata.",
 "procedure_de": "\n\nEIN SCHUSS ÖL IM TEIG: Ich gebe stets etwas natives Olivenöl direkt in den Teig (gegen Ende) für eine weichere, aromatischere Krume, und eine Prise Gerstenmalz für eine goldene Kruste.",
 "procedure_en": "\n\nA DRIZZLE OF OIL IN THE DOUGH: I always add a drizzle of extra virgin olive oil straight into the dough (near the end) for a softer, more fragrant crumb, plus a pinch of barley malt for a golden crust.",
 "procedure_es": "\n\nUN CHORRITO DE ACEITE EN LA MASA: siempre añado un chorrito de aceite de oliva virgen extra directamente en la masa (al final) para una miga más suave y aromática, y una pizca de malta de cebada para una corteza dorada.",
 "procedure_fr": "\n\nUN FILET D'HUILE DANS LA PÂTE : j'ajoute toujours un filet d'huile d'olive vierge extra directement dans la pâte (en fin de pétrissage) pour une mie plus moelleuse et parfumée, et une pincée de malt d'orge pour une croûte dorée.",
 "procedure_fa": "\n\nکمی روغن در خمیر: همیشه کمی روغن زیتون فرابکر مستقیم به خمیر (اواخر ورز) اضافه می‌کنم تا مغز نان نرم‌تر و معطرتر شود، و کمی مالت جو برای پوستهٔ طلایی.",
}
FIELDS = list(NOTE.keys())

def has(exi, key):
    return any(key in str(i.get("name") or "").lower() for i in (exi or []))

def patch(r):
    exi = r.get("extra_ingredients")
    if not isinstance(exi, list):
        exi = []
    changed = False
    if not has(exi, "nell'impasto") and not has(exi, "in the dough") and not has(exi, "im teig") and not has(exi, "en la masa") and not has(exi, "dans la pâte") and not has(exi, "در خمیر"):
        exi = exi + [dict(OIL_DOUGH)]; changed = True
    if not has(exi, "malto") and not has(exi, "malt") and not has(exi, "malta") and not has(exi, "مالت"):
        exi = exi + [dict(MALT)]; changed = True
    if changed:
        r["extra_ingredients"] = exi
        for f, note in NOTE.items():
            v = r.get(f)
            if isinstance(v, str) and v.strip() and "NELL'IMPASTO" not in v and "IN THE DOUGH" not in v and "IM TEIG" not in v and "EN LA MASA" not in v and "DANS LA PÂTE" not in v and "روغن در خمیر" not in v:
                r[f] = v + note
    return changed

async def main():
    c = AsyncIOMotorClient(os.environ["MONGO_URL"]); db = c[os.environ["DB_NAME"]]
    n = 0
    async for doc in db.recipes.find({"menu_category": "focacce", "collection_name": "mikilab"}):
        if patch(doc):
            upd = {"extra_ingredients": doc["extra_ingredients"]}
            for f in FIELDS:
                if f in doc: upd[f] = doc[f]
            await db.recipes.update_one({"_id": doc["_id"]}, {"$set": upd}); n += 1
    print("DB focacce arricchite:", n)
    c.close()
    d = json.load(open("/app/backend/mikilab_seed_data.json"))
    m = sum(1 for r in d if str(r.get("menu_category")) == "focacce" and patch(r))
    json.dump(d, open("/app/backend/mikilab_seed_data.json", "w"), ensure_ascii=False, indent=2)
    print("Seed focacce arricchite:", m)

asyncio.run(main())
