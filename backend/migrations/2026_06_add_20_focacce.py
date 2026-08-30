import os, json, uuid, asyncio
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
load_dotenv('/app/backend/.env')

now = datetime.now(timezone.utc).isoformat()
IMG = "/recipes/r_focaccia.jpg"

def ing(name, de, en, es, fr, fa, pct):
    return {"name": name, "percent": pct, "name_de": de, "name_en": en, "name_es": es, "name_fr": fr, "name_fa": fa}

OIL = ing("Olio extravergine d'oliva", "Natives Olivenöl extra", "Extra virgin olive oil", "Aceite de oliva virgen extra", "Huile d'olive vierge extra", "روغن زیتون فرابکر", 6)
MIGL = ing("Miglioratore Naturale", "Natürlicher Verbesserer", "Natural Improver", "Mejorador Natural", "Améliorant Naturel", "بهبوددهندهٔ طبیعی", 3)

# Libreria condimenti (chiave -> ingrediente tradotto)
T = {
 "pomodorini": ing("Pomodorini", "Kirschtomaten", "Cherry tomatoes", "Tomatitos", "Tomates cerises", "گوجه گیلاسی", 25),
 "olive": ing("Olive taggiasche", "Taggiasca-Oliven", "Taggiasca olives", "Aceitunas taggiasca", "Olives taggiasca", "زیتون تاجاسکا", 12),
 "rosmarino": ing("Rosmarino fresco", "Frischer Rosmarin", "Fresh rosemary", "Romero fresco", "Romarin frais", "رزماری تازه", 1),
 "cipolla": ing("Cipolla di Tropea", "Tropea-Zwiebel", "Tropea onion", "Cebolla de Tropea", "Oignon de Tropea", "پیاز تروپه‌آ", 20),
 "patate": ing("Patate a fette", "Kartoffelscheiben", "Sliced potatoes", "Patatas en rodajas", "Pommes de terre en tranches", "سیب‌زمینی ورقه‌ای", 25),
 "zucca": ing("Zucca a fette", "Kürbisscheiben", "Sliced pumpkin", "Calabaza en rodajas", "Courge en tranches", "کدو حلوایی ورقه‌ای", 25),
 "salvia": ing("Salvia", "Salbei", "Sage", "Salvia", "Sauge", "مریم‌گلی", 1),
 "zucchine": ing("Zucchine a nastro", "Zucchini-Streifen", "Ribboned zucchini", "Calabacín en tiras", "Courgette en rubans", "کدوسبز نواری", 22),
 "melanzane": ing("Melanzane grigliate", "Gegrillte Auberginen", "Grilled eggplant", "Berenjena a la parrilla", "Aubergines grillées", "بادمجان کبابی", 22),
 "peperoni": ing("Peperoni arrostiti", "Geröstete Paprika", "Roasted peppers", "Pimientos asados", "Poivrons rôtis", "فلفل دلمه‌ای کبابی", 22),
 "pesto": ing("Pesto alla genovese", "Genueser Pesto", "Genoese pesto", "Pesto genovés", "Pesto génois", "پستوی جنووا", 12),
 "stracchino": ing("Stracchino", "Stracchino", "Stracchino cheese", "Queso stracchino", "Stracchino", "پنیر استراکینو", 20),
 "gorgonzola": ing("Gorgonzola & noci", "Gorgonzola & Walnüsse", "Gorgonzola & walnuts", "Gorgonzola y nueces", "Gorgonzola & noix", "گورگونزولا و گردو", 18),
 "mortadella": ing("Mortadella & pistacchio", "Mortadella & Pistazie", "Mortadella & pistachio", "Mortadela y pistacho", "Mortadelle & pistache", "مورتادلا و پسته", 20),
 "prosciutto": ing("Prosciutto crudo", "Rohschinken", "Cured ham", "Jamón curado", "Jambon cru", "ژامبون خشک‌شده", 15),
 "friarielli": ing("Friarielli (cime di rapa)", "Stängelkohl", "Broccoli rabe", "Grelos", "Brocoli-rave", "بروکلی رابه", 20),
 "funghi": ing("Funghi porcini", "Steinpilze", "Porcini mushrooms", "Setas porcini", "Cèpes", "قارچ پورچینی", 18),
 "acciughe": ing("Acciughe & capperi", "Sardellen & Kapern", "Anchovies & capers", "Anchoas y alcaparras", "Anchois & câpres", "آنچوی و کبر", 10),
 "fichi": ing("Fichi & miele", "Feigen & Honig", "Figs & honey", "Higos y miel", "Figues & miel", "انجیر و عسل", 20),
 "uvetta": ing("Uvetta & noci", "Rosinen & Walnüsse", "Raisins & walnuts", "Pasas y nueces", "Raisins secs & noix", "کشمش و گردو", 18),
 "semi": ing("Semi misti (sesamo, lino, girasole)", "Saatenmix", "Mixed seeds", "Semillas variadas", "Graines mélangées", "دانه‌های مخلوط", 8),
 "curcuma": ing("Curcuma & pepe nero", "Kurkuma & schwarzer Pfeffer", "Turmeric & black pepper", "Cúrcuma y pimienta negra", "Curcuma & poivre noir", "زردچوبه و فلفل سیاه", 2),
 "olive_verdi": ing("Olive verdi & origano", "Grüne Oliven & Oregano", "Green olives & oregano", "Aceitunas verdes y orégano", "Olives vertes & origan", "زیتون سبز و پونه", 12),
 "pere": ing("Pere & gorgonzola", "Birne & Gorgonzola", "Pear & gorgonzola", "Pera y gorgonzola", "Poire & gorgonzola", "گلابی و گورگونزولا", 20),
 "cipollotto": ing("Cipollotto & speck", "Frühlingszwiebel & Speck", "Spring onion & speck", "Cebolleta y speck", "Ciboule & speck", "پیازچه و اشپک", 18),
}

# 20 focacce: (flavor IT, idratazione, [chiavi condimenti])
F = [
 ("Zucca e Rosmarino", 78, ["zucca", "rosmarino"]),
 ("Patate e Rosmarino", 75, ["patate", "rosmarino"]),
 ("Cipolla di Tropea", 80, ["cipolla", "rosmarino"]),
 ("Zucchine e Stracchino", 80, ["zucchine", "stracchino"]),
 ("Melanzane e Pomodorini", 78, ["melanzane", "pomodorini"]),
 ("Peperoni Arrostiti", 78, ["peperoni", "olive"]),
 ("Pesto e Pomodorini", 80, ["pesto", "pomodorini"]),
 ("Gorgonzola e Noci", 75, ["gorgonzola"]),
 ("Mortadella e Pistacchio", 78, ["mortadella"]),
 ("Prosciutto Crudo e Stracchino", 78, ["prosciutto", "stracchino"]),
 ("Friarielli", 78, ["friarielli", "olive"]),
 ("Funghi Porcini", 76, ["funghi", "rosmarino"]),
 ("Acciughe e Capperi", 80, ["acciughe", "pomodorini"]),
 ("Fichi e Miele", 72, ["fichi"]),
 ("Uvetta e Noci", 70, ["uvetta"]),
 ("Multi-Semi", 74, ["semi"]),
 ("alla Curcuma", 76, ["curcuma", "olive_verdi"]),
 ("Olive Verdi e Origano", 80, ["olive_verdi"]),
 ("Pere e Gorgonzola", 74, ["pere"]),
 ("Cipollotto e Speck", 78, ["cipollotto"]),
]

def proc(lang, tops):
    joined = ", ".join(tops)
    P = {
     "it": "1) Sciogli il lievito madre nell'acqua tiepida, unisci le farine (semola rimacinata + tipo 0) e il Miglioratore Naturale; il sale a fine impasto.\n2) Puntata ~2 ore a temperatura ambiente.\n3) Ungi bene una teglia con olio extravergine, stendi l'impasto con le mani unte e lascia lievitare 1,5-2 ore.\n4) Affonda con le dita per creare gli alveoli, condisci con {t} e un filo d'olio.\n5) Cottura ~230°C per 22-25 minuti fino a doratura. Servi tiepida.",
     "de": "1) Sauerteig im lauwarmen Wasser lösen, Mehle (Hartweizengrieß + Typ 0) und den Natürlichen Verbesserer zugeben; Salz zum Schluss.\n2) Stockgare ~2 Std. bei Raumtemperatur.\n3) Blech mit Olivenöl einfetten, Teig mit geölten Händen ausziehen, 1,5-2 Std. gehen lassen.\n4) Mit den Fingern Mulden eindrücken, mit {t} und etwas Öl belegen.\n5) Bei ~230°C 22-25 Min. goldbraun backen. Lauwarm servieren.",
     "en": "1) Dissolve the sourdough in lukewarm water, add the flours (durum semolina + type 0) and the Natural Improver; salt at the end.\n2) Bulk ferment ~2 hours at room temperature.\n3) Oil a tray well, stretch the dough with oiled hands and proof 1.5-2 hours.\n4) Dimple with your fingers, top with {t} and a drizzle of oil.\n5) Bake ~230°C for 22-25 minutes until golden. Serve warm.",
     "es": "1) Disuelve la masa madre en agua tibia, añade las harinas (sémola + tipo 0) y el Mejorador Natural; la sal al final.\n2) Fermentación en bloque ~2 horas a temperatura ambiente.\n3) Engrasa bien una bandeja con aceite, estira la masa con las manos aceitadas y deja levar 1,5-2 horas.\n4) Hunde con los dedos, cubre con {t} y un chorrito de aceite.\n5) Hornea a ~230°C durante 22-25 minutos hasta dorar. Sirve templada.",
     "fr": "1) Dissolvez le levain dans l'eau tiède, ajoutez les farines (semoule + type 0) et l'Améliorant Naturel ; le sel à la fin.\n2) Pointage ~2 heures à température ambiante.\n3) Huilez bien une plaque, étalez la pâte avec les mains huilées et laissez pousser 1,5-2 heures.\n4) Formez les alvéoles avec les doigts, garnissez de {t} et d'un filet d'huile.\n5) Cuisson ~230°C pendant 22-25 minutes jusqu'à dorure. Servez tiède.",
     "fa": "۱) خمیرمایه را در آب ولرم حل کن، آردها (سمولینا + تیپ ۰) و بهبوددهندهٔ طبیعی را اضافه کن؛ نمک در انتها.\n۲) تخمیر حجمی حدود ۲ ساعت در دمای محیط.\n۳) سینی را خوب با روغن زیتون چرب کن، خمیر را با دست چرب پهن کن و ۱٫۵ تا ۲ ساعت استراحت بده.\n۴) با انگشتان حفره ایجاد کن، با {t} و کمی روغن تزئین کن.\n۵) در حدود ۲۳۰ درجه ۲۲ تا ۲۵ دقیقه تا طلایی شدن بپز. ولرم سرو کن.",
    }
    return P[lang].replace("{t}", joined)

def build(flavor, hyd, keys):
    name = f"Focaccia {flavor}"
    tops = [T[k] for k in keys]
    exi = tops + [OIL, MIGL]
    def tj(field):
        return ", ".join(t[field] for t in tops)
    rid = str(uuid.uuid4())
    return {
        "id": rid, "collection_name": "mikilab", "costing": None, "created_at": now, "updated_at": now,
        "name": name, "name_de": name, "name_en": name, "name_es": name, "name_fr": name, "name_fa": f"فوکاچیا {flavor}",
        "real_name": name, "real_name_de": name, "real_name_en": name, "real_name_es": name, "real_name_fr": name, "real_name_fa": f"فوکاچیا {flavor}",
        "flour_type": "Semola rimacinata + tipo 0", "flour_type_de": "Hartweizengrieß + Typ 0", "flour_type_en": "Durum semolina + type 0", "flour_type_es": "Sémola + tipo 0", "flour_type_fr": "Semoule + type 0", "flour_type_fa": "سمولینا + تیپ ۰",
        "hydration_percent": float(hyd), "flour_grams": 1000.0, "water_grams": float(hyd) * 10.0,
        "sourdough_grams": 100.0, "salt_grams": 20.0, "preferment_type": "none", "method_type": "diretto",
        "dough_category": "pre", "menu_category": "focacce", "water_temp_c": 20.0, "mix_minutes": 12.0,
        "bake_temp": 230.0, "bake_minutes": 24.0, "oven_type": "statico", "bulk_fermentation_hours": 2.0,
        "proofing_hours": 1.8, "rest_minutes": 0.0, "origin": "IT", "biga": None, "label": None,
        "extra_ingredients": exi,
        "procedure": proc("it", [t["name"] for t in tops]),
        "procedure_de": proc("de", [t["name_de"] for t in tops]),
        "procedure_en": proc("en", [t["name_en"] for t in tops]),
        "procedure_es": proc("es", [t["name_es"] for t in tops]),
        "procedure_fr": proc("fr", [t["name_fr"] for t in tops]),
        "procedure_fa": proc("fa", [t["name_fa"] for t in tops]),
        "notes": f"Focaccia soffice e alveolata con {tj('name')}.",
        "notes_de": f"Lockere Focaccia mit {tj('name_de')}.",
        "notes_en": f"Soft, airy focaccia with {tj('name_en')}.",
        "notes_es": f"Focaccia suave y alveolada con {tj('name_es')}.",
        "notes_fr": f"Focaccia moelleuse et alvéolée avec {tj('name_fr')}.",
        "notes_fa": f"فوکاچیای نرم و پُرحفره با {tj('name_fa')}.",
        "image_url": IMG, "work_phases": None, "locked": False, "hidden": False,
    }

async def main():
    c = AsyncIOMotorClient(os.environ["MONGO_URL"]); db = c[os.environ["DB_NAME"]]
    recs = [build(*f) for f in F]
    # idempotenza: salta se il nome esiste già
    inserted = 0
    for r in recs:
        if await db.recipes.find_one({"name": r["name"], "collection_name": "mikilab"}):
            continue
        await db.recipes.insert_one(dict(r))
        inserted += 1
    print("DB focacce inserite:", inserted)
    c.close()
    d = json.load(open("/app/backend/mikilab_seed_data.json"))
    existing = {x.get("name") for x in d}
    add = [r for r in recs if r["name"] not in existing]
    d.extend(add)
    json.dump(d, open("/app/backend/mikilab_seed_data.json", "w"), ensure_ascii=False, indent=2)
    print("Seed focacce aggiunte:", len(add))

asyncio.run(main())
