import os
from datetime import datetime, timezone
from pymongo import MongoClient
from dotenv import load_dotenv
load_dotenv("/app/backend/.env")
db = MongoClient(os.environ["MONGO_URL"])[os.environ["DB_NAME"]]
now = datetime.now(timezone.utc).isoformat()

# Le 8 ricette nuove -> tutte a IMPASTO INDIRETTO con prefermento (biga/poolish/madre), metodo di Michele.
BIGA = {"flour_g": 350, "water_g": 155, "yeast_g": 3.5, "hours": "16-18 ore a 18°C", "hours_de": "16-18 Std bei 18°C", "hours_en": "16-18 h at 18°C"}
POOLISH = {"flour_g": 300, "water_g": 300, "yeast_g": 1.0, "hours": "12-16 ore a 20°C", "hours_de": "12-16 Std bei 20°C", "hours_en": "12-16 h at 20°C"}

PLAN = {
 "Danese alla Crema (Plunder)": ("biga", BIGA),
 "Brioche Francese (col burro)": ("biga", BIGA),
 "Pane da Hamburger (bun soffice)": ("biga", BIGA),
 "Saccottino alla Crema": ("biga", BIGA),
 "Girella all'Uvetta (Pain aux Raisins)": ("biga", BIGA),
 "Pain au Chocolat (Saccottino al Cioccolato)": ("poolish", POOLISH),
 "Pan di Kristall (alta idratazione 95%)": ("poolish", POOLISH),
 "Veneziana (grande lievitato dolce)": ("lievito madre", None),  # madre = indiretto naturale
}

NOTE_IND = {
 "it": " • METODO INDIRETTO ({p}): prepara prima il prefermento e usalo nell'impasto finale, per più aroma, forza e digeribilità.",
 "de": " • INDIREKTE METHODE ({p}): zuerst den Vorteig ansetzen und in den Hauptteig geben.",
 "en": " • INDIRECT METHOD ({p}): prepare the preferment first and use it in the final dough for more aroma and strength.",
 "es": " • MÉTODO INDIRECTO ({p}): prepara antes el prefermento y úsalo en la masa final.",
}
PROC_IND = {
 "it": "PREFERMENTO ({p}): impasta gli ingredienti del prefermento e lascia maturare come indicato, poi procedi con l'impasto finale.\n\n",
 "de": "VORTEIG ({p}): Zutaten mischen, reifen lassen, dann Hauptteig.\n\n",
 "en": "PREFERMENT ({p}): mix the preferment, let it mature, then proceed with the final dough.\n\n",
 "es": "PREFERMENTO ({p}): mezcla el prefermento, deja madurar y luego la masa final.\n\n",
}

for name, (ptype, biga) in PLAN.items():
    r = db.recipes.find_one({"collection_name": "mikilab", "name": name}, {"_id": 0})
    if not r:
        print("assente:", name); continue
    upd = {"method_type": "indiretto", "preferment_type": ptype, "oven_type": r.get("oven_type") or "statico", "updated_at": now}
    if biga:
        upd["biga"] = dict(biga)
    for lg in ["it", "de", "en", "es"]:
        nk = "notes" if lg == "it" else f"notes_{lg}"
        pk = "procedure" if lg == "it" else f"procedure_{lg}"
        cur_n = r.get(nk) or ""
        if "INDIRETTO" not in cur_n.upper() and "INDIRECT" not in cur_n.upper() and "INDIREKT" not in cur_n.upper():
            upd[nk] = cur_n + NOTE_IND[lg].format(p=ptype)
        cur_p = r.get(pk) or ""
        if "PREFERMENTO" not in cur_p.upper() and "VORTEIG" not in cur_p.upper() and "PREFERMENT" not in cur_p.upper():
            upd[pk] = PROC_IND[lg].format(p=ptype) + cur_p
    db.recipes.update_one({"collection_name": "mikilab", "name": name}, {"$set": upd})
    print(f"INDIRETTO -> {name}  ({ptype})")

print("Fatto.")
