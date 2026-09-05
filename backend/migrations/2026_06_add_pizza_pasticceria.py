# ============================================================================
#  MIKILAB PRO & BakoMix AI — PROPRIETARY & CONFIDENTIAL
#  (c) 2026 MikiLab Pro. Tutti i diritti riservati / All rights reserved.
#  Unico proprietario legale: il Master. Sole legal owner: the Master.
#  Codice riservato: vietata copia, distribuzione, reverse engineering o
#  cloning non autorizzati. Unauthorized copying, distribution, reverse
#  engineering or cloning is strictly prohibited and actively tracked by
#  the BakoMix AI Security Guardian.
# ============================================================================
"""Idempotente: aggiunge ricette PIZZA e PASTICCERIA al catalogo mikilab (DB + seed).
Serve al Piano IA + Vetrina per gestire davvero pizza e dolci, non solo pane."""
import asyncio, os, json, uuid
from datetime import datetime, timezone
from dotenv import load_dotenv
load_dotenv()
from motor.motor_asyncio import AsyncIOMotorClient

NOW = datetime.now(timezone.utc).isoformat()
SEED = "/app/backend/mikilab_seed_data.json"

def R(name, cat, img, flour, water, salt, pref, method, bt, bm, notes, proc, extra=None, names=None, notesL=None, procL=None):
    names = names or {}
    notesL = notesL or {}
    procL = procL or {}
    d = {
        "id": str(uuid.uuid4()), "collection_name": "mikilab", "created_at": NOW, "updated_at": NOW,
        "name": name, "menu_category": cat, "image_url": img,
        "flour_type": "Farina forte (W300)", "hydration_percent": (round(water / flour * 100) if flour and water else None),
        "flour_grams": float(flour) if flour else None, "water_grams": float(water) if water else None,
        "sourdough_grams": None, "salt_grams": float(salt) if salt else None,
        "preferment_type": pref, "method_type": method, "dough_category": "diretto" if method == "diretto" else "indiretto",
        "water_temp_c": None, "mix_minutes": None, "bake_temp": bt, "bake_minutes": bm, "oven_type": "Statico",
        "bulk_fermentation_hours": None, "proofing_hours": None, "origin": "IT",
        "extra_ingredients": extra or [], "procedure": proc, "notes": notes,
        "work_phases": [], "locked": False, "hidden": False,
        "name_de": names.get("de", name), "name_en": names.get("en", name), "name_es": names.get("es", name),
        "name_fr": names.get("fr", name), "name_fa": names.get("fa", name),
        "notes_de": notesL.get("de", notes), "notes_en": notesL.get("en", notes), "notes_es": notesL.get("es", notes),
        "notes_fr": notesL.get("fr", notes), "notes_fa": notesL.get("fa", notes),
        "procedure_de": procL.get("de", proc), "procedure_en": procL.get("en", proc), "procedure_es": procL.get("es", proc),
        "procedure_fr": procL.get("fr", proc), "procedure_fa": procL.get("fa", proc),
    }
    return d

IMPROVER = {"name": "Miglioratore Naturale", "percent": 3, "name_de": "Natürlicher Verbesserer", "name_en": "Natural Improver", "name_es": "Mejorador Natural", "name_fr": "Améliorant Naturel", "name_fa": "بهبوددهندهٔ طبیعی"}
OIL = {"name": "Olio extravergine d'oliva", "percent": 3, "name_de": "Natives Olivenöl extra", "name_en": "Extra virgin olive oil", "name_es": "Aceite de oliva virgen extra", "name_fr": "Huile d'olive vierge extra", "name_fa": "روغن زیتون فرابکر"}

RECIPES = [
    R("Pizza Napoletana (tonda)", "pizza", "/recipes/pz_napoletana.jpg", 1000, 620, 28, "none", "diretto", 450, 2,
      "La vera tonda napoletana: cornicione alto e alveolato, cottura velocissima in forno caldissimo. Idratazione 62%, sale 2,8%, lievito minimo per lunga maturazione.",
      "1) Sciogli il sale nell'acqua, aggiungi ~10% della farina e il lievito.\n2) Unisci la farina restante e impasta fino a incordare (T impasto ~24°C).\n3) Puntata 2 h a TA, poi staglio in panetti da 250-280 g.\n4) Appretto 6-8 h a TA (o 24 h in frigo + 2 h fuori).\n5) Stendi a mano lasciando il cornicione, condisci e cuoci 60-90 s a 450-480°C.",
      [IMPROVER],
      names={"de": "Neapolitanische Pizza (rund)", "en": "Neapolitan Pizza (round)", "es": "Pizza Napolitana (redonda)"},
      notesL={"de": "Echte runde Neapolitanerin: hoher, luftiger Rand, blitzschnelles Backen im sehr heißen Ofen. 62% Hydratation.", "en": "True round Neapolitan: tall airy cornicione, ultra-fast bake in a very hot oven. 62% hydration.", "es": "Auténtica napolitana redonda: borde alto y alveolado, cocción rapidísima en horno muy caliente. 62% hidratación."}),
    R("Pizza in Teglia alla Romana", "pizza", "/recipes/pz_teglia_romana.jpg", 1000, 800, 25, "poolish", "indiretto", 250, 15,
      "Teglia romana ad alta idratazione (80%): mollica leggera e croccante sotto. Poolish la sera prima per profumo e digeribilità.",
      "1) Poolish (300 g farina + 300 g acqua + 1 g lievito), 12-16 h a TA.\n2) Impasta poolish + farina + acqua restante, incorda, aggiungi olio e sale.\n3) Pieghe ogni 30 min (3 giri), puntata in frigo 24 h.\n4) Stendi in teglia oliata, appretto 3-4 h.\n5) Precottura bianca 8', condisci e finisci a 250°C fino a fondo croccante.",
      [OIL, IMPROVER],
      names={"de": "Römische Blechpizza", "en": "Roman Pan Pizza (teglia)", "es": "Pizza en Molde a la Romana"},
      notesL={"de": "Römische Blechpizza mit hoher Hydratation (80%): leichte Krume, knuspriger Boden. Poolish am Vorabend.", "en": "High-hydration Roman pan pizza (80%): light crumb, crispy bottom. Poolish the night before.", "es": "Pizza en molde romana de alta hidratación (80%): miga ligera, base crujiente. Poolish la víspera."}),
    R("Pizza alla Pala", "pizza", "/recipes/pz_pala.jpg", 1000, 800, 25, "poolish", "indiretto", 300, 8,
      "Lunga, ovale e leggerissima, cotta sulla pietra e servita al taglio. Idratazione 80%, grande alveolatura.",
      "1) Poolish 12-16 h.\n2) Impasta con la restante farina/acqua, incorda, olio e sale.\n3) Puntata con pieghe, maturazione 24 h in frigo.\n4) Forma i filoni, appretto 2-3 h.\n5) Stendi allungando a pala, cuoci su pietra a ~300°C 6-8'.",
      [OIL, IMPROVER],
      names={"de": "Pizza alla Pala", "en": "Pala Pizza", "es": "Pizza a la Pala"},
      notesL={"de": "Lang, oval und sehr leicht, auf Stein gebacken und in Stücken serviert. 80% Hydratation.", "en": "Long, oval and very light, baked on stone and served in slices. 80% hydration.", "es": "Larga, ovalada y muy ligera, cocida en piedra y servida en porciones. 80% hidratación."}),
    R("Pizza al Taglio Contemporanea", "pizza", "/recipes/pz_taglio.jpg", 1000, 850, 25, "biga", "indiretto", 250, 18,
      "Al taglio con biga: idratazione 85%, mollica scioglievole e crosta friabile. Perfetta per vetrina e produzione.",
      "1) Biga (1000 g farina : 450 g acqua : 10 g lievito), 18 h a 18°C.\n2) Rompi la biga con l'acqua restante (bassinage), incorda, olio e sale.\n3) Pieghe, maturazione 24-48 h in frigo.\n4) Stendi in teglia, appretto 3-4 h.\n5) Precottura bianca, condisci, finisci a 250°C.",
      [OIL, IMPROVER],
      names={"de": "Zeitgenössische Pizza al Taglio", "en": "Contemporary Pizza al Taglio", "es": "Pizza al Corte Contemporánea"},
      notesL={"de": "Al Taglio mit Biga: 85% Hydratation, zartschmelzende Krume, mürbe Kruste.", "en": "Al taglio with biga: 85% hydration, melting crumb, crisp crust.", "es": "Al corte con biga: 85% hidratación, miga fundente, corteza crujiente."}),
    R("Pan di Spagna", "pasticceria", "/recipes/pt_pandispagna.jpg", 300, None, None, "none", "diretto", 175, 30,
      "La base soffice della pasticceria: solo uova, zucchero e farina, montati a lungo. Nessun lievito chimico se ben montato.",
      "1) Monta uova (500 g) e zucchero (300 g) a lungo fino a scrittura.\n2) Incorpora a mano la farina (300 g) setacciata, dall'alto verso il basso.\n3) Versa in tortiera imburrata e infarinata.\n4) Cuoci 30' a 175°C statico, non aprire il forno.\n5) Sforna, capovolgi e fai raffreddare prima di tagliare.",
      [],
      names={"de": "Biskuit (Pan di Spagna)", "en": "Sponge Cake (Pan di Spagna)", "es": "Bizcocho (Pan di Spagna)"},
      notesL={"de": "Die luftige Basis der Konditorei: nur Eier, Zucker und Mehl, lange aufgeschlagen.", "en": "The airy pastry base: just eggs, sugar and flour, whipped at length.", "es": "La base esponjosa de la pastelería: solo huevos, azúcar y harina, bien montados."}),
    R("Crostata di Frutta (Pasta Frolla)", "pasticceria", "/recipes/pt_crostata.jpg", 500, None, None, "none", "diretto", 180, 20,
      "Guscio di frolla, crema pasticcera e frutta fresca gelatinata: il dolce da vetrina per eccellenza.",
      "1) Frolla: 500 g farina, 300 g burro freddo, 200 g zucchero, 2 tuorli, sabbiatura veloce.\n2) Riposo in frigo 1 h; stendi e fodera lo stampo.\n3) Cottura in bianco 18-20' a 180°C.\n4) Farcisci con crema pasticcera fredda.\n5) Disponi la frutta e lucida con gelatina neutra.",
      [],
      names={"de": "Obst-Tarte (Mürbeteig)", "en": "Fruit Tart (Shortcrust)", "es": "Tarta de Fruta (Masa Quebrada)"},
      notesL={"de": "Mürbeteigboden, Konditorcreme und glasiertes frisches Obst: der Vitrinen-Klassiker.", "en": "Shortcrust shell, pastry cream and glazed fresh fruit: the ultimate display dessert.", "es": "Base de masa quebrada, crema pastelera y fruta fresca glaseada: el postre de vitrina por excelencia."}),
    R("Bignè (Pasta Choux)", "pasticceria", "/recipes/pt_bigne.jpg", 150, 250, None, "none", "diretto", 190, 25,
      "Pasta choux cotta due volte: prima sul fuoco, poi in forno. Si gonfia da sola grazie al vapore.",
      "1) Porta a bollore 250 g acqua + 100 g burro + un pizzico di sale.\n2) Fuori dal fuoco unisci 150 g farina in un colpo, mescola.\n3) Asciuga l'impasto sul fuoco 2', poi trasferisci.\n4) Incorpora 4-5 uova una alla volta fino a nastro.\n5) Dressa i bignè e cuoci 25' a 190°C senza aprire; farcisci da freddi.",
      [],
      names={"de": "Windbeutel (Brandteig)", "en": "Cream Puffs (Choux)", "es": "Petisús (Pasta Choux)"},
      notesL={"de": "Brandteig, zweimal gegart: erst auf dem Herd, dann im Ofen. Bläht sich durch Dampf auf.", "en": "Choux pastry cooked twice: first on the stove, then in the oven. It puffs by steam.", "es": "Pasta choux cocida dos veces: primero al fuego, luego al horno. Se hincha con el vapor."}),
    R("Crema Pasticcera", "pasticceria", "/recipes/pt_cremapasticcera.jpg", None, None, None, "none", "diretto", None, None,
      "La crema base per farcire tutto: tuorli, zucchero, amido, latte e vaniglia. Densa, lucida e stabile.",
      "1) Scalda 500 g latte con la vaniglia (e scorza di limone).\n2) Monta 4 tuorli con 120 g zucchero e 40 g amido.\n3) Versa il latte caldo sui tuorli mescolando.\n4) Riporta sul fuoco e cuoci fino ad addensare, sempre mescolando.\n5) Raffredda velocemente coprendo a contatto con pellicola.",
      [],
      names={"de": "Konditorcreme", "en": "Pastry Cream", "es": "Crema Pastelera"},
      notesL={"de": "Die Basiscreme zum Füllen: Eigelb, Zucker, Stärke, Milch und Vanille. Dicht, glänzend, stabil.", "en": "The base cream to fill everything: yolks, sugar, starch, milk and vanilla. Thick, glossy, stable.", "es": "La crema base para rellenar todo: yemas, azúcar, almidón, leche y vainilla. Densa, brillante, estable."}),
]

async def main():
    c = AsyncIOMotorClient(os.environ["MONGO_URL"]); db = c[os.environ["DB_NAME"]]
    seed = json.load(open(SEED)); seed_names = {r.get("name") for r in seed}
    added_db = added_seed = 0
    for rec in RECIPES:
        exists = await db.recipes.find_one({"collection_name": "mikilab", "name": rec["name"]})
        if not exists:
            await db.recipes.insert_one(dict(rec)); added_db += 1
        if rec["name"] not in seed_names:
            seed.append(dict(rec)); added_seed += 1
    json.dump(seed, open(SEED, "w"), ensure_ascii=False, indent=2)
    print("added DB:", added_db, "| added seed:", added_seed, "| total seed:", len(seed))

if __name__ == "__main__":
    asyncio.run(main())
