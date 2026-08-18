"""Ricettario autentico di Michele, trascritto dalle sue tabelle + panettone scritto a mano.
Sostituisce la collezione mikilab con le ricette reali: ingredienti in ORDINE di aggiunta
(extra_ingredients con %), procedimento passo-passo (cella 16°C, riposo max 6h) e, dove serve,
come fare i panini dallo stesso impasto. Nessuna nota 'extra': solo info utili del procedimento."""
import asyncio
import os
import uuid
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def E(name, pct):
    return {"name": name, "percent": pct}


IMG = {
    "rustic": "https://images.unsplash.com/photo-1549413468-cd78edb7e75c?crop=entropy&cs=srgb&fm=jpg&w=800&q=70",
    "boule": "https://images.unsplash.com/photo-1616841888027-89693dec0827?crop=entropy&cs=srgb&fm=jpg&w=800&q=70",
    "rye": "https://images.pexels.com/photos/11214699/pexels-photo-11214699.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    "potato": "https://images.pexels.com/photos/12669855/pexels-photo-12669855.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    "toast": "https://images.unsplash.com/photo-1620921568790-c1cf8984624c?crop=entropy&cs=srgb&fm=jpg&w=800&q=70",
    "baguette": "https://images.unsplash.com/photo-1728670212431-ac192413f4b1?crop=entropy&cs=srgb&fm=jpg&w=800&q=70",
    "croissant": "https://images.unsplash.com/photo-1555507036-ab1f4038808a?crop=entropy&cs=srgb&fm=jpg&w=800&q=70",
    "brezel": "https://images.unsplash.com/photo-1593114630203-4dc0e6bf3f0a?crop=entropy&cs=srgb&fm=jpg&w=800&q=70",
    "zopf": "https://images.unsplash.com/photo-1509440159596-0249088772ff?crop=entropy&cs=srgb&fm=jpg&w=800&q=70",
    "italian": "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?crop=entropy&cs=srgb&fm=jpg&w=800&q=70",
    "panettone": "https://images.pexels.com/photos/30767689/pexels-photo-30767689.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    "seed": "https://images.unsplash.com/photo-1628809643534-b3d1faffe8d2?crop=entropy&cs=srgb&fm=jpg&w=800&q=70",
    "onion": "https://images.unsplash.com/photo-1549413468-cd78edb7e75c?crop=entropy&cs=srgb&fm=jpg&w=800&q=70",
    "walnut": "https://images.pexels.com/photos/1255097/pexels-photo-1255097.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
}

# Procedimento base (metodo indiretto) — con CELLA a 16°C e riposo max 6h
STEP = ("1) Prefermento: rinfresca lievito madre / Sauerteig / poolish e fallo maturare fino a raddoppio.\n"
        "2) Autolisi: mescola farina e acqua, riposo 30 minuti.\n"
        "3) Impasto: unisci il prefermento, poi gli ingredienti secchi (glutine, malto, lino dorato, psillio, fiocchi di patate, Backmittel) e incorda bene.\n"
        "4) Aggiungi il Kokosfett quando l'impasto è a palla; per ultimi olio d'oliva, aceto di mele e sale.\n"
        "{rest}\n"
        "6) Spezza, forma e metti in appretto fino a lievitazione pronta.\n"
        "7) Cottura: {temp}°C per {min} minuti, con vapore nei primi 10 minuti.")

REST_CELLA = "5) CELLA A 16°C subito dopo l'impasto: riposo MASSIMO 6 ore."
REST_FRIGO = "5) FRIGO subito dopo l'impasto: matura in frigorifero (4-6°C) tutta la notte (12-18 h), poi lavora."

PANINI = ("\n\n👉 Panini (Brötchen) con lo STESSO impasto: dopo il riposo, spezza in pezzi da ~90 g, "
          "arrotonda in palline strette, lascia lievitare, incidi in superficie e cuoci a 230°C per ~18 minuti con vapore.")


def proc(temp, mins, panini=False, rest="cella"):
    r = REST_FRIGO if rest == "frigo" else REST_CELLA
    p = STEP.format(temp=temp, min=mins, rest=r)
    return p + (PANINI if panini else "")


RECIPES = [
    {
        "name": "Vk Teig — Pane e Panini Integrali", "flour_type": "Vollkorn 900 + 630 100 (Dinkel)",
        "hydration_percent": 88, "flour_grams": 1000, "water_grams": 880, "sourdough_grams": 200, "salt_grams": 20,
        "preferment_type": "poolish", "bake_temp": 230, "bake_minutes": 22, "oven_type": "ventilato", "image_url": IMG["seed"],
        "extra": [E("Psyllium (Psy)", 1), E("Fiocchi di patate (Kart.Fl)", 1), E("Kokosfett", 1), E("Aceto di mele (Essig)", 1),
                  E("Olio d'oliva (Öl)", 1), E("Backmittel (Back)", 2), E("Malto (Malz)", 1), E("Lino dorato (Gold)", 1),
                  E("Glutine (Di.Glutin)", 2), E("Lievito di birra (Hefe)", 0.7)],
        "notes": "Impasto integrale con 20% di poolish. Alveolatura fitta e mollica umida.", "panini": True,
    },
    {
        "name": "Kart. Teig — Pane di Patate", "flour_type": "630 + Vollkorn (50/50) + patate lessate",
        "hydration_percent": 52, "flour_grams": 1000, "water_grams": 520, "sourdough_grams": 100, "salt_grams": 28,
        "preferment_type": "lm", "bake_temp": 230, "bake_minutes": 45, "oven_type": "statico", "image_url": IMG["potato"],
        "extra": [E("Patate lessate (Kart.Fr)", 30), E("Kokosfett", 1), E("Olio d'oliva (Öl)", 1), E("Aceto di mele (Essig)", 1),
                  E("Backmittel (Back)", 2), E("Lino dorato (Gold)", 1), E("Malto (Malz)", 1), E("Lievito di birra (Hefe)", 1)],
        "notes": "Sauerteig 10%. Patate lavate e lessate con la buccia, usate il giorno dopo. Mollica soffice, lunga conservazione.",
    },
    {
        "name": "Mittern. — Pane Mezzanotte", "flour_type": "630 + Vollkorn + segale integrale (Rg.Vk)",
        "hydration_percent": 42, "flour_grams": 1000, "water_grams": 420, "sourdough_grams": 100, "salt_grams": 24,
        "preferment_type": "lm", "bake_temp": 230, "bake_minutes": 45, "oven_type": "statico", "image_url": IMG["rye"],
        "extra": [E("Segale integrale (Rg.Vk)", 5), E("Quellstück (semi ammollati)", 25), E("Patate lessate (Kart.Fr)", 7),
                  E("Kokosfett", 1), E("Olio d'oliva (Öl)", 1), E("Aceto di mele (Essig)", 1), E("Backmittel (Back)", 2),
                  E("Lino dorato (Gold)", 1), E("Malto (Malz)", 1), E("Glutine (Di.Glutin)", 2), E("Quark", 5), E("Lievito di birra (Hefe)", 0.6)],
        "notes": "Sauerteig 10%. Pane scuro e saporito, con semi ammollati (Quellstück).",
    },
    {
        "name": "Di-Spezial — Pane Speciale", "flour_type": "630 30% + Vollkorn 60% + segale (Rg.Vk)",
        "hydration_percent": 82, "flour_grams": 1000, "water_grams": 820, "sourdough_grams": 100, "salt_grams": 20,
        "preferment_type": "lm", "bake_temp": 230, "bake_minutes": 42, "oven_type": "statico", "image_url": IMG["boule"],
        "extra": [E("Segale integrale (Rg.Vk)", 5), E("Patate lessate (Kart.Fr)", 7), E("Kokosfett", 1), E("Olio d'oliva (Öl)", 1),
                  E("Aceto di mele (Essig)", 1), E("Backmittel (Back)", 2), E("Lino dorato (Gold)", 1), E("Malto (Malz)", 1),
                  E("Glutine (Di.Glutin)", 2), E("Quark", 5), E("Lievito di birra (Hefe)", 0.6)],
        "notes": "Sauerteig 10%. Pane rustico ad alta idratazione, mollica aperta.",
    },
    {
        "name": "Toast — Pane in Cassetta", "flour_type": "630 + Vollkorn",
        "hydration_percent": 87, "flour_grams": 1000, "water_grams": 870, "sourdough_grams": 200, "salt_grams": 20,
        "preferment_type": "poolish", "bake_temp": 200, "bake_minutes": 30, "oven_type": "statico", "image_url": IMG["toast"],
        "extra": [E("Psyllium (Psy)", 1), E("Latte in polvere (Milk.Pu)", 2), E("Fiocchi di patate (Kart.Fl)", 1),
                  E("Kokosfett", 1), E("Olio d'oliva (Öl)", 1), E("Aceto di mele (Essig)", 1), E("Backmittel (Back)", 2),
                  E("Lino dorato (Gold)", 1), E("Malto (Malz)", 1), E("Glutine (Di.Glutin)", 2), E("Quark", 5),
                  E("Zucchero (Zucker)", 2), E("Margarina", 5), E("Lievito di birra (Hefe)", 1.1)],
        "notes": "Poolish 20%. Pane morbido da toast, mollica soffice e regolare. Cuoci nello stampo con coperchio.",
    },
    {
        "name": "Ital. Teig — Pane Italiano", "flour_type": "Semola 800 + W550 200",
        "hydration_percent": 75, "flour_grams": 1000, "water_grams": 750, "sourdough_grams": 200, "salt_grams": 27,
        "preferment_type": "lm", "bake_temp": 240, "bake_minutes": 40, "oven_type": "statico", "image_url": IMG["italian"],
        "extra": [E("Malto (Malz)", 1), E("Lino dorato (Gold)", 1), E("Aceto di mele (Essig)", 1), E("Olio d'oliva (Öl)", 2),
                  E("Lievito di birra (Hefe)", 0.5)],
        "notes": "Lievito madre 20%. Stile italiano con semola: crosta croccante e alveoli aperti.", "panini": True,
    },
    {
        "name": "Diguette — Baguette", "flour_type": "Farina 630 / W550",
        "hydration_percent": 72, "flour_grams": 1000, "water_grams": 720, "sourdough_grams": 200, "salt_grams": 20,
        "preferment_type": "lm", "bake_temp": 240, "bake_minutes": 22, "oven_type": "ventilato", "image_url": IMG["baguette"],
        "extra": [E("Malto (Malz)", 1), E("Lino dorato (Gold)", 1), E("Olio d'oliva (Öl)", 1), E("Aceto di mele (Essig)", 1),
                  E("Backmittel (Back)", 2), E("Lievito di birra (Hefe)", 0.5)],
        "notes": "Lievito madre 20%. Crosta sottile e cantante, alveoli aperti. Vapore abbondante.",
    },
    {
        "name": "Hefeteig — Pane a Lievito di Birra", "flour_type": "Farina 630",
        "hydration_percent": 70, "flour_grams": 1000, "water_grams": 700, "sourdough_grams": 200, "salt_grams": 24,
        "preferment_type": "poolish", "bake_temp": 230, "bake_minutes": 35, "oven_type": "ventilato", "image_url": IMG["rustic"],
        "extra": [E("Psyllium (Psy)", 0.5), E("Fiocchi di patate (Kart.Fl)", 1), E("Kokosfett", 1), E("Aceto di mele (Essig)", 1),
                  E("Olio d'oliva (Öl)", 1), E("Backmittel (Back)", 2), E("Malto (Malz)", 1), E("Lino dorato (Gold)", 1),
                  E("Lievito di birra (Hefe)", 1)],
        "notes": "Poolish / L.M 20%. Pane da tutti i giorni, morbido e leggero.", "panini": True,
    },
    {
        "name": "Lg Brezel — Bretzel", "flour_type": "630 1,5kg + Vollkorn 1,3kg",
        "hydration_percent": 50, "flour_grams": 1000, "water_grams": 500, "sourdough_grams": 0, "salt_grams": 22,
        "preferment_type": "none", "bake_temp": 220, "bake_minutes": 15, "oven_type": "ventilato", "image_url": IMG["brezel"],
        "extra": [E("Glutine (Di.Glutin)", 2), E("Psyllium (Psy)", 1), E("Fiocchi di patate (Kart.Fl)", 1), E("Margarina", 5),
                  E("Kokosfett", 1), E("Olio d'oliva (Öl)", 1), E("Aceto di mele (Essig)", 1), E("Backmittel (Back)", 2),
                  E("Malto (Malz)", 1), E("Latte in polvere (Milk.Pu)", 2), E("Lievito di birra (Hefe)", 1)],
        "notes": "Con Vorteig (H2o Vk 850 g). Immergi in soluzione di soda (Lauge) prima di infornare, sale grosso in superficie.",
    },
    {
        "name": "Croissant", "flour_type": "Farina 630 + uova",
        "hydration_percent": 60, "flour_grams": 1000, "water_grams": 600, "sourdough_grams": 0, "salt_grams": 20,
        "preferment_type": "none", "bake_temp": 190, "bake_minutes": 20, "oven_type": "statico", "image_url": IMG["croissant"],
        "extra": [E("Margarina (Marg)", 10), E("Kokosfett", 1), E("Olio d'oliva (Öl)", 1), E("Aceto di mele (Essig)", 1),
                  E("Backmittel (Back)", 2), E("Malto (Malz)", 1), E("Latte in polvere (Milk.Pu)", 4),
                  E("Burro per sfoglia (Fett) 2x20%", 40), E("Lievito di birra (Hefe)", 1)],
        "notes": "Impasto con acqua + uova (60%). Sfogliatura con burro/margarina (2 pieghe da 20%). Riposo in cella 16°C tra le pieghe.",
    },
    {
        "name": "Mürbe Br — Pane Dolce Morbido", "flour_type": "Farina 630 + Vorteig",
        "hydration_percent": 50, "flour_grams": 1000, "water_grams": 500, "sourdough_grams": 0, "salt_grams": 24,
        "preferment_type": "biga", "bake_temp": 180, "bake_minutes": 30, "oven_type": "statico", "image_url": IMG["zopf"],
        "extra": [E("Psyllium (Psy)", 1.1), E("Backmittel (Back)", 2), E("Malto (Malz)", 1), E("Latte in polvere (Milk.P)", 5),
                  E("Zucchero (Zucker)", 4), E("Quark", 10), E("Kokosfett", 1), E("Olio d'oliva (Öl)", 4),
                  E("Aceto di mele (Essig)", 1), E("Burro (Butter)", 15), E("Margarina", 5), E("Lievito di birra (Hefe)", 1.5)],
        "notes": "Con Vorteig (Mehl 10% + Wasser 5% + Hefe 10%). Impasto arricchito e soffice, dolce.",
    },
    {
        "name": "HefeZopf — Treccia Dolce", "flour_type": "Farina 630 + Vorteig + uova",
        "hydration_percent": 50, "flour_grams": 1000, "water_grams": 500, "sourdough_grams": 0, "salt_grams": 11,
        "preferment_type": "biga", "bake_temp": 180, "bake_minutes": 30, "oven_type": "statico", "image_url": IMG["zopf"],
        "extra": [E("Uova (Eier) 4", 0), E("Backmittel (Back)", 2), E("Malto (Malz)", 1), E("Latte in polvere (Milk.P)", 3),
                  E("Zucchero (Zucker)", 20), E("Quark", 8), E("Kokosfett", 1), E("Olio d'oliva (Öl)", 1),
                  E("Aceto di mele (Essig)", 1), E("Burro (Butter)", 20), E("Margarina", 5), E("Succo di limone (Zit.Saft)", 5),
                  E("Scorza di limone (Zitr.)", 0.5), E("Lievito di birra (Hefe)", 1.5)],
        "notes": "Con Vorteig. Treccia dolce profumata al limone. Spennella con uovo prima di cuocere.",
    },
]

# Specialità richieste (noci, cipolle, canapa) — mantenute
SPECIALS = [
    {"name": "Pane alle Noci e Uvetta", "flour_type": "Farina Tipo 1", "hydration_percent": 70, "flour_grams": 1000,
     "water_grams": 700, "sourdough_grams": 180, "salt_grams": 18, "preferment_type": "lm", "bake_temp": 220,
     "bake_minutes": 38, "oven_type": "statico", "image_url": IMG["walnut"],
     "extra": [E("Noci tostate", 15), E("Uvetta ammollata", 12), E("Olio d'oliva (Öl)", 1), E("Aceto di mele (Essig)", 1),
               E("Kokosfett", 1), E("Backmittel (Back)", 2)],
     "notes": "Lievito madre. Noci e uvetta a fine impasto. Ottimo con formaggi."},
    {"name": "Pane alle Cipolle Caramellate", "flour_type": "Farina Tipo 1", "hydration_percent": 72, "flour_grams": 1000,
     "water_grams": 720, "sourdough_grams": 180, "salt_grams": 20, "preferment_type": "lm", "bake_temp": 225,
     "bake_minutes": 40, "oven_type": "ventilato", "image_url": IMG["onion"],
     "extra": [E("Cipolle stufate dolci", 20), E("Olio d'oliva (Öl)", 1), E("Aceto di mele (Essig)", 1),
               E("Kokosfett", 1), E("Backmittel (Back)", 2)],
     "notes": "Lievito madre. Cipolle stufate dorate aggiunte durante le pieghe."},
    {"name": "Pane ai Semi di Canapa", "flour_type": "Farina Tipo 1 + semi di canapa", "hydration_percent": 75,
     "flour_grams": 1000, "water_grams": 750, "sourdough_grams": 180, "salt_grams": 20, "preferment_type": "lm",
     "bake_temp": 220, "bake_minutes": 40, "oven_type": "ventilato", "image_url": IMG["seed"],
     "extra": [E("Semi di canapa decorticati", 8), E("Olio d'oliva (Öl)", 1), E("Aceto di mele (Essig)", 1),
               E("Kokosfett", 1), E("Backmittel (Back)", 2)],
     "notes": "Lievito madre. Semi di canapa in impasto e in copertura."},
]

BACKMITTEL = {
    "name": "Backmittel naturale (miglioratore)",
    "flour_type": "Mix naturale — nessun additivo chimico",
    "preferment_type": "none", "image_url": IMG["panettone"],
    "extra": [E("Malto (Malz)", 0.3), E("Farina di lupino dolce (Süßlupinen)", 1), E("Acerola in polvere", 0.3),
              E("Lino dorato macinato (Gold)", 2), E("Buccia di psillio (Flohsamen)", 0.5)],
    "notes": ("Il mio miglioratore 100% naturale. Dose consigliata ~2-3% sul peso della farina. "
              "Mescola tutto a secco e aggiungi con le farine all'inizio dell'impasto. Rende l'impasto piu' forte, "
              "migliora crosta, colore e alveolatura e mantiene il pane morbido piu' a lungo."),
    "procedure": ("Preparazione: pesa i componenti nelle percentuali indicate (sul peso della farina della ricetta), "
                  "mescolali bene a secco e conservali in un barattolo chiuso, al fresco e all'asciutto. "
                  "Uso: aggiungi tutto alla farina all'inizio dell'impasto."),
}

PANETTONE = {
    "name": "Panettone (due impasti)",
    "flour_type": "Farina alta forza W380 + lievito madre",
    "hydration_percent": 40, "flour_grams": 446, "water_grams": 179, "sourdough_grams": 140, "salt_grams": 7,
    "preferment_type": "lm", "bake_temp": 165, "bake_minutes": 50, "oven_type": "statico", "image_url": IMG["panettone"],
    "extra": [E("Zucchero", 41), E("Tuorlo", 61), E("Burro", 66), E("Miele", 5.6),
              E("Sospensione (canditi + uvetta)", 101), E("Pasta d'arancia", 2.2)],
    "notes": ("Il mio panettone, metodo classico a DUE IMPASTI su lievito madre. Dosi totali per ~2 kg di impasto:\n"
              "Farina 446 g · Acqua 179 g · Lievito madre 140 g · Zucchero 184 g · Tuorlo 279 g · Burro 295 g · "
              "Miele 25 g · Sale 7 g · Sospensione 450 g · Pasta d'arancia 10 g."),
    "procedure": (
        "GESTIONE LIEVITO MADRE: bagnetto 15 min in acqua a 31°C, poi 3 rinfreschi ravvicinati (1:1:0,5) a 28°C ogni 3-4 h, "
        "fino a triplicare in ~3 h e pH 4,1-4,3.\n\n"
        "1° IMPASTO (sera) — Farina 223 g, Acqua 123 g, Lievito madre 140 g, Zucchero 83 g, Tuorlo 87 g, Burro 123 g:\n"
        "acqua + zucchero + LM ~4 min, poi farina ~4 min, infine tuorli e burro a filo. Impasto liscio ma NON elastico. "
        "Lievitazione ~12 h a 24-26°C fino a TRIPLICARE.\n\n"
        "2° IMPASTO (mattina) — aggiungi Farina 223 g, Zucchero 101 g, Tuorlo 192 g, Burro 172 g, Miele 25 g, Sale 7 g, "
        "Pasta d'arancia 10 g, poi la Sospensione (canditi + uvetta) 450 g:\n"
        "riprendi corda con farina, poi zucchero/tuorli in piu' volte, miele e sale sciolti in poca acqua, burro a filo; "
        "per ultima la sospensione.\n"
        "Puntata ~45 min a 28°C, pirlatura, appretto ~6 h a 28°C fino a ~2 cm dal bordo del pirottino.\n"
        "Cottura 165°C statico ~50 min, cuore 92-94°C. Capovolgi subito e fai riposare 12 h a testa in giu'."),
}


async def main():
    client = AsyncIOMotorClient(os.environ["MONGO_URL"])
    db = client[os.environ["DB_NAME"]]

    await db.recipes.delete_many({"collection_name": "mikilab"})
    print("Collezione mikilab svuotata.")

    all_recipes = []
    fridge = {"Croissant", "Lg Brezel — Bretzel", "Hefeteig — Pane a Lievito di Birra",
              "Mürbe Br — Pane Dolce Morbido", "HefeZopf — Treccia Dolce"}
    for r in RECIPES + SPECIALS:
        r = dict(r)
        extra = r.pop("extra", [])
        panini = r.pop("panini", False)
        rest = "frigo" if r["name"] in fridge else "cella"
        r["method_type"] = "indiretto"
        r["procedure"] = proc(r.get("bake_temp", 230), r.get("bake_minutes", 35), panini, rest)
        r["extra_ingredients"] = extra
        all_recipes.append(r)

    for r in (BACKMITTEL, PANETTONE):
        r = dict(r)
        r.setdefault("method_type", "indiretto")
        r["extra_ingredients"] = r.pop("extra", [])
        all_recipes.append(r)

    for r in all_recipes:
        doc = {
            "id": str(uuid.uuid4()), "collection_name": "mikilab", "costing": None,
            "created_at": now_iso(), "updated_at": now_iso(), **r,
        }
        await db.recipes.insert_one(doc)
        print(f"ADD: {r['name']}")

    total = await db.recipes.count_documents({"collection_name": "mikilab"})
    print(f"\nTotale ricette mikilab: {total}")
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
