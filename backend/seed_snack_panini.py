# ============================================================================
#  MIKILAB PRO & BakoMix AI — PROPRIETARY & CONFIDENTIAL
#  (c) 2026 MikiLab Pro. Tutti i diritti riservati / All rights reserved.
#  Unico proprietario legale: il Master. Sole legal owner: the Master.
#  Codice riservato: vietata copia, distribuzione, reverse engineering o
#  cloning non autorizzati. Unauthorized copying, distribution, reverse
#  engineering or cloning is strictly prohibited and actively tracked by
#  the BakoMix AI Security Guardian.
# ============================================================================
"""FASE C — Migrazione categorie + 6 snack + 10 panini (IT + DE/EN via Claude)."""
import asyncio, os, uuid, datetime
from pymongo import MongoClient
from dotenv import load_dotenv
load_dotenv("/app/backend/.env")
from emergentintegrations.llm.chat import LlmChat, UserMessage

KEY = os.environ["EMERGENT_LLM_KEY"]
cli = MongoClient(os.environ["MONGO_URL"]); db = cli[os.environ["DB_NAME"]]; col = db["recipes"]
now = datetime.datetime.now(datetime.timezone.utc).isoformat()

def mk(name, mc, flour, proc, notes, extra, **kw):
    d = dict(id=str(uuid.uuid4()), collection_name="mikilab", costing=None, created_at=now, updated_at=now,
             name=name, menu_category=mc, flour_type=flour, procedure=proc, notes=notes, extra_ingredients=extra,
             hydration_percent=kw.get("hyd"), flour_grams=1000.0, water_grams=float(kw.get("water", 0)),
             sourdough_grams=float(kw.get("lm", 0)), salt_grams=float(kw.get("salt", 20)),
             preferment_type=kw.get("pref", "none"), method_type=kw.get("method", "diretto"),
             dough_category=kw.get("dc", "diretto"), water_temp_c=float(kw.get("wt", 18)),
             mix_minutes=float(kw.get("mix", 12)), bake_temp=float(kw.get("bt", 220)),
             bake_minutes=float(kw.get("bm", 18)), oven_type=kw.get("oven", "statico"), origin="IT",
             image_url="", bulk_fermentation_hours=kw.get("bulk"), proofing_hours=kw.get("proof"),
             rest_minutes=kw.get("rest"), work_phases=None)
    return d

SNACK = [
    mk("Grissini Stirati Torinesi", "snack", "Farina di grano tenero tipo 0",
       "1) Sciogli il lievito nell'acqua tiepida (18-20°C).\n2) Unisci la farina, il malto e il sale; aggiungi l'olio a filo.\n3) Impasta 10-12 minuti fino a un impasto liscio ed elastico.\n4) Stendi in un rettangolo alto ~1,5 cm su un telo unto, spennella d'olio e copri: fai lievitare 45-60 minuti.\n5) Taglia strisce da ~1 cm e stira ogni striscia con le mani fino alla lunghezza della teglia.\n6) Disponi sui vassoi leggermente distanziati.\n7) Cuoci a 200°C statico per 15-18 minuti finché dorati e croccanti fino al cuore.\n8) Lascia raffreddare su griglia: devono restare friabili.",
       "Il grissino stirato classico piemontese: sottile, rustico e friabile. Malto e olio danno colore e croccantezza. Conserva in luogo asciutto.",
       [{"name": "Olio extravergine d'oliva", "percent": 8}, {"name": "Malto d'orzo", "percent": 1}, {"name": "Lievito di birra fresco", "percent": 1.5}],
       hyd=55, water=550, salt=20, bt=200, bm=17, proof=1),
    mk("Grissini al Sesamo", "snack", "Farina di grano tenero tipo 0",
       "1) Sciogli il lievito nell'acqua tiepida.\n2) Unisci farina e sale, aggiungi olio e impasta 10 minuti fino a impasto liscio.\n3) Fai lievitare coperto 60 minuti.\n4) Stendi a rettangolo di ~1 cm, spennella d'acqua e cospargi generosamente di semi di sesamo, premendo leggermente.\n5) Taglia strisce da 1,5 cm e allungale delicatamente.\n6) Disponi sulle teglie.\n7) Cuoci a 200°C statico 15-17 minuti fino a doratura.\n8) Raffredda su griglia.",
       "Grissini profumati al sesamo, ottimi per l'aperitivo. Puoi mixare sesamo bianco e nero per un effetto elegante.",
       [{"name": "Olio extravergine d'oliva", "percent": 8}, {"name": "Semi di sesamo", "percent": 12}, {"name": "Lievito di birra fresco", "percent": 1.5}],
       hyd=54, water=540, salt=20, bt=200, bm=16, proof=1),
    mk("Crackers Croccanti ai Semi", "snack", "Farina di grano tenero tipo 1",
       "1) In una ciotola unisci farina, sale e un mix di semi (lino, girasole, sesamo).\n2) Aggiungi olio e acqua; impasta brevemente (5-6 minuti) fino a un panetto compatto.\n3) Copri e fai riposare 30 minuti.\n4) Stendi molto sottile (~2 mm) tra due fogli di carta forno.\n5) Bucherella con una forchetta e taglia a quadrotti o rombi.\n6) Spennella d'acqua e spolvera altri semi e un pizzico di sale in fiocchi.\n7) Cuoci a 180°C ventilato 14-16 minuti fino a doratura uniforme.\n8) Raffredda: saranno croccantissimi.",
       "Crackers rustici e sani ai semi: perfetti con formaggi e salumi. Regola i semi a piacere.",
       [{"name": "Olio extravergine d'oliva", "percent": 12}, {"name": "Mix di semi (lino, girasole, sesamo)", "percent": 20}],
       hyd=42, water=420, salt=18, method="diretto", bt=180, bm=15, oven="ventilato", rest=30),
    mk("Pizzette Rosse da Rosticceria", "snack", "Farina di grano tenero tipo 00",
       "1) Sciogli il lievito nell'acqua tiepida con lo zucchero.\n2) Unisci farina, sale e olio; impasta 12 minuti fino a impasto morbido e liscio.\n3) Fai lievitare coperto 1,5-2 ore fino al raddoppio.\n4) Stendi a ~5 mm e coppa dischi da 6-7 cm.\n5) Disponi sulle teglie e lascia lievitare altri 30 minuti.\n6) Condisci con passata di pomodoro, sale, un filo d'olio e origano.\n7) Cuoci a 230°C statico 10-12 minuti; a fine cottura, se vuoi, aggiungi un cubetto di mozzarella.",
       "Le pizzette rosse della rosticceria italiana: soffici e profumate. Base perfetta anche per buffet.",
       [{"name": "Olio extravergine d'oliva", "percent": 6}, {"name": "Passata di pomodoro", "percent": 40}, {"name": "Origano", "percent": 0.5}, {"name": "Lievito di birra fresco", "percent": 3}, {"name": "Zucchero", "percent": 2}],
       hyd=60, water=600, salt=22, bt=230, bm=11, proof=2),
    mk("Panzerotti Fritti Pugliesi", "snack", "Farina di grano tenero tipo 00",
       "1) Sciogli il lievito nel latte tiepido con lo zucchero.\n2) Unisci farina, sale e olio; impasta 12 minuti fino a impasto liscio ed elastico.\n3) Fai lievitare coperto 2 ore.\n4) Forma palline da 70 g e falle rilassare 20 minuti.\n5) Stendi dischi sottili, farcisci al centro con pomodoro e mozzarella ben sgocciolata.\n6) Chiudi a mezzaluna sigillando bene i bordi.\n7) Friggi in olio a 175°C, 2-3 minuti per lato, fino a doratura.\n8) Scola su carta e servi caldi.",
       "Il panzerotto pugliese fritto: scrigno dorato con cuore filante. Sigilla bene i bordi per evitare fuoriuscite.",
       [{"name": "Latte intero", "percent": 30}, {"name": "Olio extravergine d'oliva", "percent": 5}, {"name": "Pomodoro", "percent": 25}, {"name": "Mozzarella", "percent": 25}, {"name": "Lievito di birra fresco", "percent": 3}, {"name": "Zucchero", "percent": 2}],
       hyd=30, water=0, salt=20, method="diretto", bt=0, bm=0, oven="frittura", proof=2),
    mk("Rustici Sfogliati al Formaggio", "snack", "Farina di grano tenero tipo 00",
       "1) Prepara un impasto con farina, acqua fredda, sale e un po' di burro; impasta 8 minuti e fai riposare 30 minuti in frigo.\n2) Stendi e incassa il burro a piega, esegui 3 pieghe a tre con riposi di 20 minuti (sfogliatura rapida).\n3) Stendi la pasta a ~3 mm.\n4) Coppa dischi o quadrati, farcisci con besciamella e formaggio (o pomodoro e mozzarella).\n5) Spennella con uovo sbattuto.\n6) Cuoci a 200°C ventilato 20-22 minuti fino a doratura e sfoglia gonfia.\n7) Servi tiepidi.",
       "Rustici sfogliati in versione veloce: friabili e filanti. Ideali per rosticceria e buffet.",
       [{"name": "Burro (per sfogliatura)", "percent": 35}, {"name": "Besciamella", "percent": 20}, {"name": "Formaggio", "percent": 20}, {"name": "Uovo (per spennellare)", "percent": 10}],
       hyd=48, water=480, salt=18, method="sfogliato", dc="diretto", bt=200, bm=21, oven="ventilato", rest=30),
]

PANINI = [
    mk("Panino Integrale", "panini", "Farina integrale + tipo 0 (50/50)",
       "1) Sciogli il lievito nell'acqua tiepida.\n2) Unisci le farine, aggiungi acqua e impasta 8 minuti; unisci il sale e l'olio e continua fino a incordatura (12-14 min).\n3) Fai puntare l'impasto coperto 1 ora con una piega a metà.\n4) Spezza in pezzi da 80-90 g e forma i panini.\n5) Disponi su teglia e fai lievitare 60-90 minuti fino al raddoppio.\n6) Spennella d'acqua e cospargi di crusca o fiocchi d'avena; pratica un taglio.\n7) Cuoci a 220°C con vapore iniziale 16-18 minuti.\n8) Raffredda su griglia.",
       "Panino integrale rustico e digeribile, ricco di fibra. La farina integrale assorbe più acqua: regola l'idratazione.",
       [{"name": "Olio extravergine d'oliva", "percent": 4}, {"name": "Lievito di birra fresco", "percent": 2}, {"name": "Crusca (per finitura)", "percent": 3}],
       hyd=68, water=680, salt=20, bt=220, bm=17, proof=1.5, bulk=1),
    mk("Panino al Mais", "panini", "Farina tipo 0 + farina di mais fioretto (80/20)",
       "1) Scotta brevemente la farina di mais con parte dell'acqua calda e lascia intiepidire.\n2) Sciogli il lievito nell'acqua rimanente.\n3) Unisci le farine e l'impasto di mais, impasta 8 minuti; aggiungi sale e olio fino a incordatura.\n4) Punta 1 ora coperto.\n5) Forma panini da 80 g.\n6) Lievita 75 minuti.\n7) Spennella e cospargi di semola di mais; cuoci a 220°C 16-18 minuti.\n8) Raffredda.",
       "Panino al mais dal colore dorato e sapore dolce. La scottatura del mais lo rende più morbido e conservabile.",
       [{"name": "Olio extravergine d'oliva", "percent": 4}, {"name": "Lievito di birra fresco", "percent": 2}, {"name": "Semola di mais (per finitura)", "percent": 3}],
       hyd=66, water=660, salt=20, bt=220, bm=17, proof=1.3, bulk=1),
    mk("Panino alle Patate", "panini", "Farina tipo 0",
       "1) Lessa e schiaccia le patate; lasciale intiepidire.\n2) Sciogli il lievito nell'acqua tiepida.\n3) Unisci farina, purè di patate e acqua; impasta 8 minuti, poi aggiungi sale e olio fino a impasto liscio.\n4) Punta 1 ora.\n5) Forma panini da 85 g.\n6) Lievita 60-75 minuti.\n7) Cuoci a 210°C 16-18 minuti.\n8) Raffredda su griglia.",
       "Panino alle patate: mollica soffice e a lunga conservazione grazie all'amido della patata. Ottimo per hamburger.",
       [{"name": "Patate lesse", "percent": 30}, {"name": "Olio extravergine d'oliva", "percent": 5}, {"name": "Lievito di birra fresco", "percent": 2.5}],
       hyd=52, water=520, salt=20, bt=210, bm=17, proof=1.2, bulk=1),
    mk("Panino al Sesamo", "panini", "Farina tipo 0",
       "1) Sciogli il lievito nell'acqua tiepida con un cucchiaino di zucchero.\n2) Unisci farina e acqua, impasta 8 minuti; aggiungi sale, burro morbido e latte fino a incordatura.\n3) Punta 1 ora.\n4) Forma panini tondi da 80 g.\n5) Spennella con latte e cospargi di semi di sesamo.\n6) Lievita 60 minuti.\n7) Cuoci a 200°C 15-17 minuti fino a doratura.\n8) Raffredda.",
       "Il classico panino morbido al sesamo, tipo bun. Latte e burro danno una mollica soffice e vellutata.",
       [{"name": "Latte intero", "percent": 15}, {"name": "Burro", "percent": 8}, {"name": "Semi di sesamo", "percent": 6}, {"name": "Zucchero", "percent": 4}, {"name": "Lievito di birra fresco", "percent": 3}],
       hyd=58, water=580, salt=18, bt=200, bm=16, proof=1),
    mk("Panino Multicereali ai 5 Cereali", "panini", "Farina tipo 1 + mix 5 cereali",
       "1) Ammolla il mix di semi/fiocchi in acqua tiepida 20 minuti.\n2) Sciogli il lievito nell'acqua.\n3) Unisci farina, mix ammollato e acqua; impasta 8 minuti, poi sale e olio fino a incordatura.\n4) Punta 1 ora con una piega.\n5) Forma panini da 85 g.\n6) Lievita 75 minuti.\n7) Spennella e cospargi di fiocchi; cuoci a 220°C con vapore 17-19 minuti.\n8) Raffredda.",
       "Panino multicereali ricco e saporito. L'ammollo dei cereali evita che rubino acqua all'impasto.",
       [{"name": "Mix 5 cereali (avena, orzo, farro, segale, miglio)", "percent": 25}, {"name": "Olio extravergine d'oliva", "percent": 4}, {"name": "Lievito di birra fresco", "percent": 2}],
       hyd=70, water=700, salt=20, bt=220, bm=18, proof=1.3, bulk=1),
    mk("Panino al Latte per Hamburger", "panini", "Farina tipo 0 (W300)",
       "1) Sciogli il lievito nel latte tiepido con lo zucchero.\n2) Unisci farina, uovo e latte; impasta 8 minuti, poi aggiungi sale e burro morbido a pezzi fino a incordatura completa.\n3) Punta 1 ora coperto.\n4) Forma palline da 75 g ben pirlate.\n5) Disponi su teglia, spennella con uovo e latte, cospargi di sesamo.\n6) Lievita 90 minuti fino a gonfiore.\n7) Cuoci a 190°C 14-16 minuti.\n8) Raffredda: mollica sofficissima.",
       "Il bun morbido per hamburger: dolce, lucido e sofficissimo. Ottimo anche per panini gourmet.",
       [{"name": "Latte intero", "percent": 45}, {"name": "Burro", "percent": 12}, {"name": "Uovo", "percent": 10}, {"name": "Zucchero", "percent": 8}, {"name": "Semi di sesamo", "percent": 4}, {"name": "Lievito di birra fresco", "percent": 3}],
       hyd=15, water=0, salt=18, bt=190, bm=15, proof=1.5, bulk=1),
    mk("Panino alle Olive", "panini", "Farina tipo 0",
       "1) Sciogli il lievito nell'acqua tiepida.\n2) Unisci farina e acqua, impasta 8 minuti; aggiungi sale e olio fino a incordatura.\n3) Incorpora le olive taggiasche denocciolate a mano, senza rompere l'impasto.\n4) Punta 1 ora con una piega.\n5) Forma panini o filoncini da 90 g.\n6) Lievita 60-75 minuti.\n7) Cuoci a 220°C con vapore 17-19 minuti.\n8) Raffredda.",
       "Panino mediterraneo alle olive: profumato e saporito. Usa olive ben sgocciolate per non bagnare l'impasto.",
       [{"name": "Olive taggiasche denocciolate", "percent": 20}, {"name": "Olio extravergine d'oliva", "percent": 5}, {"name": "Lievito di birra fresco", "percent": 2}],
       hyd=64, water=640, salt=20, bt=220, bm=18, proof=1.2, bulk=1),
    mk("Panino alla Zucca", "panini", "Farina tipo 0",
       "1) Cuoci a vapore e frulla la zucca; lasciala intiepidire.\n2) Sciogli il lievito nell'acqua tiepida.\n3) Unisci farina, purea di zucca e poca acqua; impasta 8 minuti, poi sale e olio fino a impasto liscio.\n4) Punta 1 ora.\n5) Forma panini da 85 g; con un tarocco segna gli spicchi a zucca.\n6) Lievita 60 minuti.\n7) Cuoci a 210°C 16-18 minuti.\n8) Raffredda.",
       "Panino autunnale alla zucca: colore arancio, mollica umida e leggermente dolce. Riduci l'acqua perché la zucca ne apporta.",
       [{"name": "Purea di zucca", "percent": 35}, {"name": "Olio extravergine d'oliva", "percent": 5}, {"name": "Lievito di birra fresco", "percent": 2.5}],
       hyd=45, water=450, salt=20, bt=210, bm=17, proof=1, bulk=1),
    mk("Panino al Farro", "panini", "Farina di farro tipo 1 + tipo 0 (60/40)",
       "1) Sciogli il lievito nell'acqua tiepida.\n2) Unisci le farine e l'acqua, impasta con delicatezza 8-10 minuti (il farro ha glutine più fragile); aggiungi sale e olio.\n3) Punta 1 ora con una piega leggera.\n4) Forma panini da 85 g.\n5) Lievita 75 minuti.\n6) Spennella e cospargi di farina di farro.\n7) Cuoci a 220°C con vapore 16-18 minuti.\n8) Raffredda.",
       "Panino al farro dal gusto aromatico e rustico. Impasta con delicatezza: il glutine del farro è più tenace ma fragile.",
       [{"name": "Olio extravergine d'oliva", "percent": 4}, {"name": "Lievito di birra fresco", "percent": 2}],
       hyd=63, water=630, salt=20, bt=220, bm=17, proof=1.3, bulk=1),
    mk("Panino ai Semi di Papavero", "panini", "Farina tipo 0",
       "1) Sciogli il lievito nell'acqua tiepida con un pizzico di zucchero.\n2) Unisci farina e acqua, impasta 8 minuti; aggiungi sale, latte e burro fino a incordatura.\n3) Punta 1 ora.\n4) Forma panini ovali da 80 g.\n5) Spennella con uovo e cospargi generosamente di semi di papavero.\n6) Lievita 60 minuti.\n7) Cuoci a 200°C 15-17 minuti fino a doratura.\n8) Raffredda.",
       "Panino soffice ai semi di papavero, elegante e profumato. Perfetto per colazioni salate e buffet.",
       [{"name": "Latte intero", "percent": 15}, {"name": "Burro", "percent": 6}, {"name": "Semi di papavero", "percent": 6}, {"name": "Uovo (per spennellare)", "percent": 8}, {"name": "Lievito di birra fresco", "percent": 3}],
       hyd=58, water=580, salt=18, bt=200, bm=16, proof=1),
]

TR_SYS = ("You are a professional bakery translator. Translate Italian bakery text to natural, professional "
          "{lang} used by bakers. Keep numbers, %, °C, times, step numbering (1) 2) ...) and proper names. "
          "Return ONLY the translated text, no quotes, no notes.")

async def tr(chat, text, lang):
    text = (text or "").strip()
    if not text:
        return ""
    resp = await chat.send_message(UserMessage(text=f"Translate to {lang}:\n\n{text}"))
    return (resp or "").strip()

async def translate_recipe(r, i):
    for lc, lname in (("de", "German"), ("en", "English")):
        chat = LlmChat(api_key=KEY, session_id=f"c-{lc}-{i}", system_message=TR_SYS.format(lang=lname)).with_model("anthropic", "claude-sonnet-4-6")
        for f in ("name", "flour_type", "procedure", "notes"):
            try:
                r[f + "_" + lc] = await tr(chat, r.get(f), lname)
            except Exception as e:
                print(f"  ! {r['name']} {f}_{lc}: {e}", flush=True)
                r[f + "_" + lc] = r.get(f)
    print(f"[{i+1}] {r['name']} -> DE:{r.get('name_de')} | EN:{r.get('name_en')}", flush=True)

async def main():
    # 1) Migrazione: Focacce/Friselle/Puccia -> focacce ; Taralli -> snack
    to_focacce = ["Focaccia Barese", "Friselle Pugliesi", "Puccia Salentina"]
    col.update_many({"name": {"$in": to_focacce}}, {"$set": {"menu_category": "focacce", "updated_at": now}})
    col.update_many({"name": {"$regex": "Taralli", "$options": "i"}}, {"$set": {"menu_category": "snack", "updated_at": now}})
    print("Migrazione categorie fatta.", flush=True)

    recipes = SNACK + PANINI
    for i, r in enumerate(recipes):
        await translate_recipe(r, i)
        col.update_one({"name": r["name"]}, {"$set": r}, upsert=True)
    print(f"INSERITE {len(recipes)} ricette. Totale ora: {col.count_documents({})}", flush=True)
    print("menu_category:", col.distinct("menu_category"), flush=True)

asyncio.run(main())
