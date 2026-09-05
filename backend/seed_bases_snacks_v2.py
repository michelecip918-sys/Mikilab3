# ============================================================================
#  MIKILAB PRO & BakoMix AI — PROPRIETARY & CONFIDENTIAL
#  (c) 2026 MikiLab Pro. Tutti i diritti riservati / All rights reserved.
#  Unico proprietario legale: il Master. Sole legal owner: the Master.
#  Codice riservato: vietata copia, distribuzione, reverse engineering o
#  cloning non autorizzati. Unauthorized copying, distribution, reverse
#  engineering or cloning is strictly prohibited and actively tracked by
#  the BakoMix AI Security Guardian.
# ============================================================================
"""Migrazione ricette (giugno 2026):
- Brezel + Brezel Integrali: pane -> snack
- Rimuove doppione base 'Kochstück' (resta 'Farina Cotta (Kochstück)')
- Porta gli snack esistenti (solo-DB) dentro il seed JSON per la persistenza
- Aggiunge 3 ricette con Farina Cotta (Kochstück) + 3 snack farciti
Esecuzione: python seed_bases_snacks_v2.py
"""
import asyncio, os, json, copy
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

ROOT = Path(__file__).parent
load_dotenv(ROOT / ".env")
SEED_FILE = ROOT / "mikilab_seed_data.json"

IMG = {
    "cassetta": "https://images.unsplash.com/photo-1598373182133-52452f7691ef?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "cereali": "https://images.unsplash.com/photo-1706954622635-939539dd9246?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "panini_latte": "https://images.pexels.com/photos/26584413/pexels-photo-26584413.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    "croissant": "https://images.unsplash.com/photo-1639667852145-466e29aa49fd?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "panino_it": "https://images.pexels.com/photos/6416558/pexels-photo-6416558.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    "laugen": "https://images.pexels.com/photos/38699417/pexels-photo-38699417.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
}

KOCH = {"name": "Farina Cotta (Kochstück) — 15% sul peso farina", "percent": 15}

NEW_RECIPES = [
    {
        "name": "Pan Latte in Cassetta (Kochstück)",
        "name_de": "Toastbrot mit Kochstück",
        "name_en": "Milk Sandwich Loaf (Kochstück)",
        "real_name": "Pane in cassetta soffice con farina cotta",
        "real_name_de": "Weiches Toastbrot mit Kochstück",
        "real_name_en": "Soft pan loaf with cooked-flour",
        "flour_type": "Farina di grano tenero tipo 0 (W300)",
        "flour_type_de": "Weizenmehl Type 550 (W300)",
        "flour_type_en": "Soft wheat type 0 (W300)",
        "hydration_percent": 65, "flour_grams": 1000, "water_grams": 500,
        "sourdough_grams": 0, "salt_grams": 18, "preferment_type": "diretto",
        "method_type": "diretto", "dough_category": "diretto",
        "mix_minutes": 14, "bulk_fermentation_hours": 1, "proofing_hours": 1.5,
        "bake_temp": 175, "bake_minutes": 35, "oven_type": "statico",
        "image_url": IMG["cassetta"], "origin": "IT", "menu_category": "pane",
        "extra_ingredients": [KOCH, {"name": "Latte intero", "percent": 15}, {"name": "Burro", "percent": 8}, {"name": "Zucchero", "percent": 6}, {"name": "Lievito di birra fresco (Hefe)", "percent": 2.5}],
        "notes": "La Farina Cotta (Kochstück) trattiene l'acqua e regala una mollica sofficissima e a lunga conservazione. Perfetto per toast, tramezzini e colazione.",
        "notes_de": "Das Kochstück bindet Wasser und sorgt für eine extrem weiche, lange frisch bleibende Krume. Ideal für Toast, Sandwiches und Frühstück.",
        "notes_en": "The Kochstück (cooked flour) binds water and gives an ultra-soft, long-keeping crumb. Perfect for toast, tramezzini and breakfast.",
        "procedure": "1) Prepara la Farina Cotta (Kochstück): scalda 150 g farina con 300 g acqua/latte fino a 65°C mescolando, ottieni una crema; copri e raffredda.\n2) Impasta farina, acqua, latte, zucchero e lievito 6 min; aggiungi la farina cotta e il sale, poi il burro poco alla volta fino a impasto liscio e incordato.\n3) Puntata 60 min.\n4) Forma un filone, mettilo nello stampo da cassetta imburrato.\n5) Appretto 90 min fino a 1 cm dal bordo.\n6) Cuoci a 175°C statico 35 min.\n7) Sforma subito e raffredda su griglia.",
        "procedure_de": "1) Kochstück zubereiten: 150 g Mehl mit 300 g Wasser/Milch unter Rühren auf 65°C erhitzen, bis eine Creme entsteht; abgedeckt abkühlen.\n2) Mehl, Wasser, Milch, Zucker und Hefe 6 Min. kneten; Kochstück und Salz zugeben, dann Butter nach und nach bis zur vollen Teigentwicklung.\n3) Stockgare 60 Min.\n4) Zu einem Laib formen, in die gefettete Kastenform legen.\n5) Stückgare 90 Min. bis 1 cm unter den Rand.\n6) Bei 175°C Ober-/Unterhitze 35 Min. backen.\n7) Sofort stürzen und auf einem Gitter auskühlen.",
        "procedure_en": "1) Make the Kochstück: heat 150 g flour with 300 g water/milk to 65°C, stirring to a paste; cover and cool.\n2) Knead flour, water, milk, sugar and yeast 6 min; add the cooked flour and salt, then butter little by little to full development.\n3) Bulk 60 min.\n4) Shape a loaf, place in a buttered pan mould.\n5) Final proof 90 min to 1 cm from the rim.\n6) Bake at 175°C 35 min.\n7) Turn out immediately and cool on a rack.",
    },
    {
        "name": "Pane Morbido ai Cereali (Kochstück)",
        "name_de": "Weiches Mehrkornbrot mit Kochstück",
        "name_en": "Soft Multigrain Bread (Kochstück)",
        "real_name": "Pane morbido multicereali con farina cotta",
        "real_name_de": "Weiches Mehrkornbrot mit Kochstück",
        "real_name_en": "Soft multigrain loaf with cooked-flour",
        "flour_type": "Farina tipo 1 + cereali (W280)",
        "flour_type_de": "Weizenmehl Type 812 + Körner",
        "flour_type_en": "Type 1 flour + grains",
        "hydration_percent": 72, "flour_grams": 1000, "water_grams": 560,
        "sourdough_grams": 0, "salt_grams": 20, "preferment_type": "diretto",
        "method_type": "diretto", "dough_category": "diretto",
        "mix_minutes": 12, "bulk_fermentation_hours": 1.5, "proofing_hours": 1.5,
        "bake_temp": 210, "bake_minutes": 40, "oven_type": "statico",
        "image_url": IMG["cereali"], "origin": "DE", "menu_category": "pane",
        "extra_ingredients": [KOCH, {"name": "Mix semi (girasole, lino, sesamo)", "percent": 18}, {"name": "Miele", "percent": 4}, {"name": "Lievito di birra fresco (Hefe)", "percent": 2}],
        "notes": "Con farina cotta e semi in ammollo (Quellstück) resta morbido per giorni. Il Kochstück aumenta idratazione e digeribilità.",
        "notes_de": "Mit Kochstück und eingeweichten Saaten (Quellstück) bleibt es tagelang weich. Das Kochstück erhöht Hydratation und Bekömmlichkeit.",
        "notes_en": "With cooked flour and soaked seeds (Quellstück) it stays soft for days. The Kochstück boosts hydration and digestibility.",
        "procedure": "1) Farina Cotta: scalda 150 g farina con 300 g acqua a 65°C, crea la crema, raffredda.\n2) Ammolla i semi in 100 g acqua tiepida (Quellstück) 1 ora.\n3) Impasta farina, acqua, miele e lievito 6 min; unisci farina cotta, semi ammollati e sale, impasta fino a liscio.\n4) Puntata 90 min con 2 pieghe.\n5) Forma un filone, cospargi di semi, metti in stampo o su teglia.\n6) Appretto 90 min.\n7) Cuoci a 210°C con vapore i primi 10 min, poi 200°C fino a 40 min totali.",
        "procedure_de": "1) Kochstück: 150 g Mehl mit 300 g Wasser auf 65°C erhitzen, Creme bilden, abkühlen.\n2) Saaten 1 Std. in 100 g lauwarmem Wasser einweichen (Quellstück).\n3) Mehl, Wasser, Honig und Hefe 6 Min. kneten; Kochstück, Saaten und Salz zugeben, glatt kneten.\n4) Stockgare 90 Min. mit 2 Faltungen.\n5) Laib formen, mit Saaten bestreuen, in Form oder auf Blech.\n6) Stückgare 90 Min.\n7) Bei 210°C mit Dampf 10 Min. anbacken, dann 200°C bis 40 Min. gesamt.",
        "procedure_en": "1) Kochstück: heat 150 g flour with 300 g water to 65°C, make the paste, cool.\n2) Soak the seeds in 100 g warm water 1 h (Quellstück).\n3) Knead flour, water, honey and yeast 6 min; add cooked flour, soaked seeds and salt, knead smooth.\n4) Bulk 90 min with 2 folds.\n5) Shape a loaf, sprinkle with seeds, into a mould or on a tray.\n6) Final proof 90 min.\n7) Bake at 210°C with steam 10 min, then 200°C to 40 min total.",
    },
    {
        "name": "Panini al Latte Soffici (Kochstück)",
        "name_de": "Weiche Milchbrötchen mit Kochstück",
        "name_en": "Soft Milk Rolls (Kochstück)",
        "real_name": "Panini al latte super soffici con farina cotta",
        "real_name_de": "Super weiche Milchbrötchen mit Kochstück",
        "real_name_en": "Ultra-soft milk rolls with cooked-flour",
        "flour_type": "Farina di grano tenero tipo 0 (W300)",
        "flour_type_de": "Weizenmehl Type 550 (W300)",
        "flour_type_en": "Soft wheat type 0 (W300)",
        "hydration_percent": 60, "flour_grams": 1000, "water_grams": 380,
        "sourdough_grams": 0, "salt_grams": 16, "preferment_type": "diretto",
        "method_type": "diretto", "dough_category": "diretto",
        "mix_minutes": 14, "bulk_fermentation_hours": 1, "proofing_hours": 1.5,
        "bake_temp": 180, "bake_minutes": 16, "oven_type": "statico",
        "image_url": IMG["panini_latte"], "origin": "IT", "menu_category": "panini",
        "extra_ingredients": [KOCH, {"name": "Latte intero", "percent": 20}, {"name": "Burro", "percent": 10}, {"name": "Zucchero", "percent": 8}, {"name": "Uovo", "percent": 8}, {"name": "Lievito di birra fresco (Hefe)", "percent": 3}],
        "notes": "Panini al latte da colazione o merenda, sofficissimi grazie alla farina cotta. Ottimi anche come base per mini-hamburger o panini dolci.",
        "notes_de": "Milchbrötchen für Frühstück oder Snack, dank Kochstück extrem weich. Auch ideal für Mini-Burger oder süße Brötchen.",
        "notes_en": "Milk rolls for breakfast or snack, ultra-soft thanks to the cooked flour. Great also as a base for mini-burgers or sweet rolls.",
        "procedure": "1) Farina Cotta: scalda 150 g farina con 300 g latte a 65°C, crea la crema, raffredda.\n2) Impasta farina, latte, zucchero, uovo e lievito 6 min; unisci farina cotta e sale, poi il burro fino a incordatura.\n3) Puntata 60 min.\n4) Dividi in pezzi da 60 g, forma palline lisce.\n5) Disponi su teglia, appretto 90 min.\n6) Spennella con latte o uovo.\n7) Cuoci a 180°C statico 15-17 min fino a doratura.",
        "procedure_de": "1) Kochstück: 150 g Mehl mit 300 g Milch auf 65°C erhitzen, Creme bilden, abkühlen.\n2) Mehl, Milch, Zucker, Ei und Hefe 6 Min. kneten; Kochstück und Salz zugeben, dann Butter bis zur Teigentwicklung.\n3) Stockgare 60 Min.\n4) In 60-g-Stücke teilen, glatte Kugeln formen.\n5) Auf Blech setzen, Stückgare 90 Min.\n6) Mit Milch oder Ei bestreichen.\n7) Bei 180°C Ober-/Unterhitze 15-17 Min. goldbraun backen.",
        "procedure_en": "1) Kochstück: heat 150 g flour with 300 g milk to 65°C, make the paste, cool.\n2) Knead flour, milk, sugar, egg and yeast 6 min; add cooked flour and salt, then butter to full development.\n3) Bulk 60 min.\n4) Divide into 60 g pieces, shape smooth balls.\n5) Place on a tray, final proof 90 min.\n6) Brush with milk or egg.\n7) Bake at 180°C 15-17 min until golden.",
    },
    {
        "name": "Croissant Farcito Salato",
        "name_de": "Herzhaft gefülltes Croissant",
        "name_en": "Savoury Filled Croissant",
        "real_name": "Cornetto sfogliato farcito (prosciutto e formaggio)",
        "real_name_de": "Gefülltes Plunder-Croissant (Schinken & Käse)",
        "real_name_en": "Filled laminated croissant (ham & cheese)",
        "flour_type": "Farina forte per sfoglia (W330)",
        "flour_type_de": "Starkes Mehl für Plunder (W330)",
        "flour_type_en": "Strong laminating flour (W330)",
        "hydration_percent": 52, "flour_grams": 1000, "water_grams": 300,
        "sourdough_grams": 0, "salt_grams": 20, "preferment_type": "none",
        "method_type": "diretto", "dough_category": "sfogliato",
        "mix_minutes": 8, "bulk_fermentation_hours": 1, "proofing_hours": 2,
        "bake_temp": 195, "bake_minutes": 18, "oven_type": "ventilato",
        "image_url": IMG["croissant"], "origin": "IT", "menu_category": "snack",
        "extra_ingredients": [{"name": "Burro per sfoglia", "percent": 28}, {"name": "Latte", "percent": 20}, {"name": "Zucchero", "percent": 8}, {"name": "Lievito di birra fresco (Hefe)", "percent": 3}, {"name": "Farcitura: prosciutto cotto e formaggio", "percent": 0}],
        "notes": "Croissant sfogliato salato, farcito dopo cottura con prosciutto e formaggio (o versione veg). Ottimo per aperitivo e pausa pranzo. Pieghe in FRIGO 2-4°C.",
        "notes_de": "Herzhaftes Plunder-Croissant, nach dem Backen mit Schinken und Käse gefüllt (auch veggie). Ideal für Aperitif und Mittagspause. Touren im KÜHLSCHRANK 2-4°C.",
        "notes_en": "Savoury laminated croissant, filled after baking with ham and cheese (or veg). Great for aperitivo and lunch break. Folds in the FRIDGE 2-4°C.",
        "procedure": "1) Impasta farina, latte, acqua, zucchero, lievito e sale fino a impasto liscio; riposo in frigo 1 h.\n2) Incassa il panetto di burro e fai 3 pieghe a 3, con riposi in frigo 2-4°C tra una piega e l'altra.\n3) Stendi a 4 mm, taglia triangoli, arrotola formando i croissant.\n4) Appretto 2 h a 26°C.\n5) Spennella con uovo.\n6) Cuoci a 195°C ventilato 16-18 min.\n7) Raffredda, taglia e farcisci con prosciutto e formaggio.",
        "procedure_de": "1) Mehl, Milch, Wasser, Zucker, Hefe und Salz glatt kneten; 1 Std. im Kühlschrank ruhen.\n2) Butterplatte einschlagen und 3 einfache Touren geben, dazwischen im Kühlschrank 2-4°C ruhen.\n3) Auf 4 mm ausrollen, Dreiecke schneiden, zu Croissants aufrollen.\n4) Stückgare 2 Std. bei 26°C.\n5) Mit Ei bestreichen.\n6) Bei 195°C Umluft 16-18 Min. backen.\n7) Abkühlen, aufschneiden und mit Schinken und Käse füllen.",
        "procedure_en": "1) Knead flour, milk, water, sugar, yeast and salt until smooth; rest 1 h in the fridge.\n2) Enclose the butter block and give 3 single folds, resting in the fridge 2-4°C between folds.\n3) Roll to 4 mm, cut triangles, roll up into croissants.\n4) Final proof 2 h at 26°C.\n5) Brush with egg.\n6) Bake at 195°C fan 16-18 min.\n7) Cool, slice and fill with ham and cheese.",
    },
    {
        "name": "Panino Farcito all'Italiana",
        "name_de": "Gefülltes Panino auf italienische Art",
        "name_en": "Italian-Style Filled Panino",
        "real_name": "Panino con mortadella, stracciatella e pistacchio",
        "real_name_de": "Panino mit Mortadella, Stracciatella & Pistazie",
        "real_name_en": "Panino with mortadella, stracciatella & pistachio",
        "flour_type": "Farina di grano tenero tipo 0 (W280)",
        "flour_type_de": "Weizenmehl Type 550 (W280)",
        "flour_type_en": "Soft wheat type 0 (W280)",
        "hydration_percent": 62, "flour_grams": 1000, "water_grams": 500,
        "sourdough_grams": 0, "salt_grams": 20, "preferment_type": "none",
        "method_type": "diretto", "dough_category": "diretto",
        "mix_minutes": 12, "bulk_fermentation_hours": 1.5, "proofing_hours": 1,
        "bake_temp": 220, "bake_minutes": 14, "oven_type": "statico",
        "image_url": IMG["panino_it"], "origin": "IT", "menu_category": "snack",
        "extra_ingredients": [{"name": "Olio extravergine d'oliva", "percent": 5}, {"name": "Lievito di birra fresco (Hefe)", "percent": 2}, {"name": "Farcitura: mortadella, stracciatella, granella di pistacchio", "percent": 0}],
        "notes": "Panino soffice all'olio, farcito all'italiana dopo cottura. Puoi variare con prosciutto crudo e fichi, o caprese. Da servire tiepido.",
        "notes_de": "Weiches Olivenöl-Panino, nach dem Backen italienisch gefüllt. Variiere mit Rohschinken und Feigen oder Caprese. Lauwarm servieren.",
        "notes_en": "Soft olive-oil panino, filled Italian-style after baking. Vary with prosciutto and figs, or caprese. Serve warm.",
        "procedure": "1) Impasta farina, acqua, olio, lievito e sale 12 min fino a liscio.\n2) Puntata 90 min con 1 piega.\n3) Dividi in pezzi da 100 g, forma panini ovali.\n4) Appretto 60 min.\n5) Cuoci a 220°C statico 12-14 min con leggero vapore iniziale.\n6) Raffredda, apri e farcisci con mortadella, stracciatella e pistacchio.",
        "procedure_de": "1) Mehl, Wasser, Öl, Hefe und Salz 12 Min. glatt kneten.\n2) Stockgare 90 Min. mit 1 Faltung.\n3) In 100-g-Stücke teilen, ovale Brötchen formen.\n4) Stückgare 60 Min.\n5) Bei 220°C Ober-/Unterhitze 12-14 Min. mit etwas Anfangsdampf backen.\n6) Abkühlen, aufschneiden und mit Mortadella, Stracciatella und Pistazie füllen.",
        "procedure_en": "1) Knead flour, water, oil, yeast and salt 12 min until smooth.\n2) Bulk 90 min with 1 fold.\n3) Divide into 100 g pieces, shape oval rolls.\n4) Final proof 60 min.\n5) Bake at 220°C 12-14 min with a little initial steam.\n6) Cool, open and fill with mortadella, stracciatella and pistachio.",
    },
    {
        "name": "Panino Bavarese al Bretzel Farcito",
        "name_de": "Gefülltes Laugenbrötchen (bayrisch)",
        "name_en": "Bavarian Filled Pretzel Bun",
        "real_name": "Laugenbrötchen farcito con affettati e senape dolce",
        "real_name_de": "Laugenbrötchen mit Aufschnitt & süßem Senf",
        "real_name_en": "Lye roll filled with cold cuts & sweet mustard",
        "flour_type": "Farina di grano tenero tipo 0 (W280)",
        "flour_type_de": "Weizenmehl Type 550 (W280)",
        "flour_type_en": "Soft wheat type 0 (W280)",
        "hydration_percent": 55, "flour_grams": 1000, "water_grams": 450,
        "sourdough_grams": 0, "salt_grams": 20, "preferment_type": "none",
        "method_type": "diretto", "dough_category": "diretto",
        "mix_minutes": 12, "bulk_fermentation_hours": 1, "proofing_hours": 0.75,
        "bake_temp": 210, "bake_minutes": 18, "oven_type": "statico",
        "image_url": IMG["laugen"], "origin": "DE", "menu_category": "snack",
        "extra_ingredients": [{"name": "Burro", "percent": 6}, {"name": "Malto (Malz)", "percent": 1}, {"name": "Lievito di birra fresco (Hefe)", "percent": 2.5}, {"name": "Soda per Lauge (bagno alcalino 4%)", "percent": 0}, {"name": "Farcitura: Leberkäse o affettati, senape dolce, sottaceti", "percent": 0}],
        "notes": "Il classico panino bavarese: pasta da Laugengebäck con bagno alcalino, farcito con affettati e senape dolce. Sale grosso in superficie.",
        "notes_de": "Der bayrische Klassiker: Laugenteig mit Lauge, gefüllt mit Aufschnitt und süßem Senf. Grobes Salz obenauf.",
        "notes_en": "The Bavarian classic: lye-bath dough, filled with cold cuts and sweet mustard. Coarse salt on top.",
        "procedure": "1) Impasta farina, acqua, burro, malto, lievito e sale 12 min.\n2) Puntata 60 min.\n3) Dividi in pezzi da 90 g, forma panini, appretto 45 min.\n4) Prepara il bagno alcalino (soda 4% in acqua fredda, usa i guanti) e immergi i panini 10 sec.\n5) Incidi la superficie, cospargi di sale grosso.\n6) Cuoci a 210°C statico 16-18 min.\n7) Raffredda, apri e farcisci con Leberkäse o affettati, senape dolce e sottaceti.",
        "procedure_de": "1) Mehl, Wasser, Butter, Malz, Hefe und Salz 12 Min. kneten.\n2) Stockgare 60 Min.\n3) In 90-g-Stücke teilen, Brötchen formen, Stückgare 45 Min.\n4) Lauge ansetzen (4% Natronlauge in kaltem Wasser, Handschuhe!) und Brötchen 10 Sek. tauchen.\n5) Einschneiden, mit grobem Salz bestreuen.\n6) Bei 210°C Ober-/Unterhitze 16-18 Min. backen.\n7) Abkühlen, aufschneiden und mit Leberkäse oder Aufschnitt, süßem Senf und Gurken füllen.",
        "procedure_en": "1) Knead flour, water, butter, malt, yeast and salt 12 min.\n2) Bulk 60 min.\n3) Divide into 90 g pieces, shape rolls, final proof 45 min.\n4) Prepare the lye bath (4% soda in cold water, wear gloves!) and dip the rolls 10 sec.\n5) Score the top, sprinkle with coarse salt.\n6) Bake at 210°C 16-18 min.\n7) Cool, open and fill with Leberkäse or cold cuts, sweet mustard and pickles.",
    },
]


async def main():
    client = AsyncIOMotorClient(os.environ["MONGO_URL"])
    db = client[os.environ["DB_NAME"]]

    # 1) Rimuovi doppione base 'Kochstück' dal DB (resta 'Farina Cotta (Kochstück)')
    r = await db.recipes.delete_many({"collection_name": "mikilab", "name": "Kochstück"})
    print("Kochstück doppioni rimossi dal DB:", r.deleted_count)

    # 2) Carica JSON seed
    data = json.load(open(SEED_FILE, encoding="utf-8"))
    by_name = {r.get("name"): r for r in data}

    # 3) Brezel + Brezel Integrali -> snack (JSON)
    for nm in ("Brezel", "Brezel Integrali"):
        if nm in by_name:
            by_name[nm]["menu_category"] = "snack"
            print(f"{nm}: menu_category -> snack (JSON)")

    # 4) Porta gli snack esistenti solo-DB dentro il JSON (persistenza produzione)
    db_snacks = await db.recipes.find(
        {"collection_name": "mikilab", "menu_category": "snack"}, {"_id": 0}
    ).to_list(1000)
    added_from_db = 0
    for doc in db_snacks:
        nm = doc.get("name")
        if nm in ("Brezel", "Brezel Integrali"):
            continue  # gestiti dal JSON
        if nm not in by_name:
            doc.pop("created_at", None); doc.pop("updated_at", None)
            data.append(doc); by_name[nm] = doc; added_from_db += 1
    print("Snack esistenti aggiunti al JSON:", added_from_db)

    # 5) Aggiungi/aggiorna le 6 nuove ricette nel JSON
    for rec in NEW_RECIPES:
        if rec["name"] in by_name:
            by_name[rec["name"]].update(rec)
        else:
            data.append(rec); by_name[rec["name"]] = rec
    print("Nuove ricette nel JSON:", len(NEW_RECIPES))

    # 6) Scrivi JSON
    json.dump(data, open(SEED_FILE, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    from collections import Counter
    print("TOT JSON:", len(data), "| categorie:", dict(Counter(r.get("menu_category") for r in data)))
    print("DONE. Ricorda: bump SEED_VERSION in server.py e chiama /api/seed-mikilab per sincronizzare.")


if __name__ == "__main__":
    asyncio.run(main())
