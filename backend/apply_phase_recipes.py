# ============================================================================
#  MIKILAB PRO & BakoMix AI — PROPRIETARY & CONFIDENTIAL
#  (c) 2026 MikiLab Pro. Tutti i diritti riservati / All rights reserved.
#  Unico proprietario legale: il Master. Sole legal owner: the Master.
#  Codice riservato: vietata copia, distribuzione, reverse engineering o
#  cloning non autorizzati. Unauthorized copying, distribution, reverse
#  engineering or cloning is strictly prohibited and actively tracked by
#  the BakoMix AI Security Guardian.
# ============================================================================
# -*- coding: utf-8 -*-
"""FASE ricette: miglioratore unico, basi, categorie, Brezel, sostituzioni globali."""
import json, re
from pathlib import Path

SEED = Path(__file__).parent / "mikilab_seed_data.json"
data = json.load(open(SEED, encoding="utf-8"))
by = {r["name"]: r for r in data}

# ---------------------------------------------------------------------------
# 1) MIGLIORATORE NATURALE PRO (unico) — rimuovo i vecchi
# ---------------------------------------------------------------------------
data = [r for r in data if r["name"] not in ("Miglioratore Naturale al Malto", "Miglioratore Naturale", "Miglioratore al Malto")]

MIG_DESC = ("Formula unica 100% naturale a quadrupla azione: il malto nutre i lieviti e dona colore e "
            "croccantezza; lupino e vitamina C rinforzano la maglia glutinica e la tenuta; lo psillio "
            "trattiene l'idratazione mantenendo il pane morbido più a lungo.")
MIG_DESC_DE = ("Einzigartige, 100% natürliche Formel mit vierfacher Wirkung: Malz nährt die Hefen und gibt "
               "Farbe und Kruste; Lupine und Vitamin C stärken das Glutennetz; Flohsamenschalen halten die "
               "Feuchtigkeit und das Brot länger weich.")
MIG_PROC = ("1) Pesa gli ingredienti e mescolali bene a secco.\n"
            "2) Conserva in un barattolo chiuso al fresco e all'asciutto.\n"
            "3) USO: aggiungi il 2% del mix totale direttamente alla farina all'inizio dell'impasto.")
MIG_PROC_DE = ("1) Zutaten abwiegen und trocken gut vermischen.\n"
               "2) In einem geschlossenen Glas kühl und trocken lagern.\n"
               "3) VERWENDUNG: 2% der Mischung direkt zu Beginn des Knetens zum Mehl geben.")

miglioratore = {
    "name": "Miglioratore Naturale Pro", "name_de": "Natürlicher Pro-Backmittel",
    "real_name": "Miglioratore universale", "real_name_de": "Universal-Backmittel",
    "flour_type": "Universale (Diretto e Indiretto)", "flour_type_de": "Universell (Direkt & Indirekt)",
    "preferment_type": "diretto", "method_type": "diretto", "menu_category": "basi",
    "image_url": "/recipes/r_panettone_base.jpg",
    "extra_ingredients": [
        {"name": "Farina di lupino dolce", "percent": 1},
        {"name": "Malto diastasico in polvere", "percent": 0.5},
        {"name": "Buccia di psillio", "percent": 0.5},
        {"name": "Vitamina C (Acido ascorbico)", "percent": 0.02},
    ],
    "notes": MIG_DESC, "notes_de": MIG_DESC_DE,
    "procedure": MIG_PROC, "procedure_de": MIG_PROC_DE,
}

# ---------------------------------------------------------------------------
# 2) NUOVE BASI & LIEVITI (bozze professionali standard, modificabili)
# ---------------------------------------------------------------------------
lievito_madre = {
    "name": "Lievito Madre", "name_de": "Lievito Madre (Sauerteig)",
    "real_name": "Pasta madre solida", "real_name_de": "Fester Sauerteig",
    "flour_type": "Farina 0 / W300", "flour_type_de": "Mehl Typ 550 / W300",
    "preferment_type": "lm", "method_type": "lm", "menu_category": "basi",
    "image_url": "/recipes/r_cuore.jpg",
    "notes": "Base viva del laboratorio. Idratazione 45-50%. Da conservare a 4°C tra un rinfresco e l'altro.",
    "notes_de": "Lebende Basis der Backstube. Hydration 45-50%. Zwischen den Auffrischungen bei 4°C lagern.",
    "procedure": ("RINFRESCO (rapporto 1:1:0,5)\n"
                  "1) 100 g lievito madre + 100 g farina forte + 45-50 g acqua a 24°C.\n"
                  "2) Impasta 4-5', forma un cilindro, incidi a croce.\n"
                  "3) Lievitazione 3-4 h a 26-28°C fino al raddoppio.\n"
                  "4) Pronto all'uso; l'eccedenza torna in frigo a 4°C.\n"
                  "ESEMPI D'USO: pani 15-20% sul peso farina; grandi lievitati 25-30%."),
    "procedure_de": ("AUFFRISCHUNG (Verhältnis 1:1:0,5)\n"
                     "1) 100 g Sauerteig + 100 g starkes Mehl + 45-50 g Wasser bei 24°C.\n"
                     "2) 4-5' kneten, zu einer Rolle formen, kreuzweise einschneiden.\n"
                     "3) 3-4 h bei 26-28°C bis zur Verdopplung.\n"
                     "4) Einsatzbereit; Rest zurück in den Kühlschrank bei 4°C.\n"
                     "ANWENDUNG: Brote 15-20% auf das Mehl; große Hefegebäcke 25-30%."),
}
lievito_segale = {
    "name": "Lievito Madre di Segale", "name_de": "Roggen-Sauerteig",
    "real_name": "Pasta madre di segale", "real_name_de": "Roggensauerteig",
    "flour_type": "Farina di segale integrale", "flour_type_de": "Roggenvollkornmehl",
    "preferment_type": "lm", "method_type": "lm", "menu_category": "basi",
    "image_url": "/recipes/r_bruno.jpg",
    "notes": "Sauerteig di segale, più acido e attivo. Idratazione 100% (liquido). Ideale per pani di segale e misti.",
    "notes_de": "Roggensauerteig, säuerlicher und aktiver. Hydration 100% (flüssig). Ideal für Roggen- und Mischbrote.",
    "procedure": ("RINFRESCO (rapporto 1:1:1)\n"
                  "1) 50 g madre di segale + 100 g farina di segale + 100 g acqua a 30°C.\n"
                  "2) Mescola bene fino a pastella liscia.\n"
                  "3) Fermentazione 12-16 h a 26-28°C.\n"
                  "4) Pronto quando è gonfio, bolloso e profuma di acido lattico.\n"
                  "USO: 20-30% sul peso della farina nei pani di segale."),
    "procedure_de": ("AUFFRISCHUNG (Verhältnis 1:1:1)\n"
                     "1) 50 g Roggenanstellgut + 100 g Roggenmehl + 100 g Wasser bei 30°C.\n"
                     "2) Zu einem glatten Brei verrühren.\n"
                     "3) 12-16 h bei 26-28°C reifen lassen.\n"
                     "4) Reif, wenn aufgegangen, blasig und milchsauer im Duft.\n"
                     "ANWENDUNG: 20-30% auf das Mehl bei Roggenbroten."),
}
poolish = {
    "name": "Poolish", "name_de": "Poolish",
    "real_name": "Prefermento liquido", "real_name_de": "Flüssiger Vorteig",
    "flour_type": "Farina forte W300", "flour_type_de": "Starkes Mehl W300",
    "preferment_type": "pre", "method_type": "indiretto", "menu_category": "basi",
    "image_url": "/recipes/r_baguette.jpg",
    "notes": "Prefermento liquido (idratazione 100%). Dona alveolatura, digeribilità e aroma. Lievito in base alle ore.",
    "notes_de": "Flüssiger Vorteig (100% Hydration). Gibt Porung, Bekömmlichkeit und Aroma. Hefe je nach Reifezeit.",
    "procedure": ("RICETTA (parti uguali farina/acqua)\n"
                  "1) 500 g farina + 500 g acqua a 20°C + lievito di birra fresco:\n"
                  "   • 1,5 g per 12-16 h a 18°C  • 3 g per 8 h  • 7 g per 3-4 h.\n"
                  "2) Mescola fino a pastella, copri.\n"
                  "3) Pronto quando è cupolato e sta per cedere al centro.\n"
                  "USO: 30-40% di poolish sul peso totale della farina."),
    "procedure_de": ("REZEPT (Mehl/Wasser gleiche Teile)\n"
                     "1) 500 g Mehl + 500 g Wasser bei 20°C + frische Hefe:\n"
                     "   • 1,5 g für 12-16 h bei 18°C  • 3 g für 8 h  • 7 g für 3-4 h.\n"
                     "2) Zu einem Teigbrei verrühren, abdecken.\n"
                     "3) Reif, wenn gewölbt und in der Mitte gerade einsinkend.\n"
                     "ANWENDUNG: 30-40% Poolish auf das Gesamtmehl."),
}
kochstueck = {
    "name": "Kochstück", "name_de": "Kochstück",
    "real_name": "Farinata cotta (con fiocchi d'avena)", "real_name_de": "Kochstück mit Haferflocken",
    "flour_type": "Fiocchi d'avena (Haferflocken)", "flour_type_de": "Haferflocken",
    "preferment_type": "diretto", "method_type": "diretto", "menu_category": "basi",
    "image_url": "/recipes/r_sinfonia.jpg",
    "notes": "Impasto cotto (tipo tangzhong) con fiocchi d'avena: trattiene acqua, dona morbidezza e lunga conservazione.",
    "notes_de": "Gekochtes Stück (wie Tangzhong) mit Haferflocken: bindet Wasser, macht weich und länger haltbar.",
    "procedure": ("RICETTA (rapporto 1:4 avena/acqua)\n"
                  "1) 100 g fiocchi d'avena (Haferflocken) + 400 g acqua + 10 g sale.\n"
                  "2) Porta a bollore e cuoci 3-4' mescolando fino a crema densa.\n"
                  "3) Copri a contatto e raffredda a 4°C (meglio la sera prima).\n"
                  "4) USO: aggiungi il Kochstück all'impasto principale (10-20% sul peso farina),\n"
                  "   riducendo un po' l'acqua della ricetta."),
    "procedure_de": ("REZEPT (Verhältnis 1:4 Hafer/Wasser)\n"
                     "1) 100 g Haferflocken + 400 g Wasser + 10 g Salz.\n"
                     "2) Aufkochen und 3-4' unter Rühren zu einer dicken Creme kochen.\n"
                     "3) Mit Folie bedecken und auf 4°C abkühlen (am besten über Nacht).\n"
                     "4) VERWENDUNG: Kochstück in den Hauptteig geben (10-20% auf das Mehl),\n"
                     "   dabei die Wassermenge etwas reduzieren."),
}
new_bases = [miglioratore, lievito_madre, lievito_segale, poolish, kochstueck]

# ---------------------------------------------------------------------------
# 3) BREZEL: rinomino l'attuale in "Brezel" (classico) + creo "Brezel Integrali"
# ---------------------------------------------------------------------------
brezel = by.get("Bretzel del Maestro")
brezel_integrali = None
if brezel:
    import copy
    brezel_integrali = copy.deepcopy(brezel)
    brezel["name"] = "Brezel"
    brezel["name_de"] = "Brezel"
    brezel["real_name"] = "Bretzel classico"
    brezel["real_name_de"] = "Klassische Brezel"
    brezel_integrali["name"] = "Brezel Integrali"
    brezel_integrali["name_de"] = "Vollkorn-Brezel"
    brezel_integrali["real_name"] = "Bretzel integrale"
    brezel_integrali["real_name_de"] = "Vollkorn-Brezel"
    brezel_integrali["flour_type"] = "Farina Integrale"
    brezel_integrali["flour_type_de"] = "Vollkornmehl"
    brezel_integrali["image_url"] = brezel.get("image_url")
    # aggiungo/aggiorno miglioratore Pro 2% negli integrali
    ei = [e for e in (brezel_integrali.get("extra_ingredients") or []) if "igliorator" not in e.get("name","").lower() and "backmittel" not in e.get("name","").lower()]
    ei.append({"name": "Miglioratore Naturale Pro (2% sul peso della farina)", "percent": 2})
    brezel_integrali["extra_ingredients"] = ei
    data.append(brezel_integrali)

# ---------------------------------------------------------------------------
# 4) CATEGORIE (menu_category) + sostituzioni globali
# ---------------------------------------------------------------------------
PANINI = {"Taralli Pugliesi", "Friselle Pugliesi", "Puccia Salentina", "Focaccia Barese"}

def improver_ref(name):
    n = (name or "").lower()
    return "igliorator" in n or "backmittel" in n

for r in data:
    nm = r["name"]
    # categoria
    if nm in ("Miglioratore Naturale Pro", "Lievito Madre", "Lievito Madre di Segale", "Poolish", "Kochstück"):
        r["menu_category"] = "basi"
    elif nm.startswith("Panettone"):
        r["menu_category"] = "panettoni"
    elif nm in PANINI:
        r["menu_category"] = "panini"
    else:
        r["menu_category"] = "pane"

    # sostituzione miglioratore negli extra_ingredients
    if r.get("extra_ingredients"):
        seen = False
        new_ei = []
        for e in r["extra_ingredients"]:
            if improver_ref(e.get("name")):
                if not seen:
                    new_ei.append({"name": "Miglioratore Naturale Pro (2% sul peso della farina)", "percent": 2})
                    seen = True
            else:
                new_ei.append(e)
        r["extra_ingredients"] = new_ei

    # sostituzione testo IT (Backmittel -> Miglioratore Naturale Pro) + Vollkorn -> Farina Integrale
    for f in ("procedure", "notes", "name", "flour_type", "real_name"):
        if r.get(f):
            r[f] = r[f].replace("Backmittel", "Miglioratore Naturale Pro")
            r[f] = r[f].replace("Miglioratore naturale (Miglioratore Naturale Pro)", "Miglioratore Naturale Pro")
            r[f] = re.sub(r"Vollkorn", "Farina Integrale", r[f])

# inserisco le nuove basi in testa
data = new_bases + data

json.dump(data, open(SEED, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
from collections import Counter
print("TOT ricette:", len(data), "| categorie:", dict(Counter(r.get("menu_category") for r in data)))
print("nomi basi:", [r["name"] for r in data if r.get("menu_category") == "basi"])
print("brezel presenti:", [r["name"] for r in data if "rezel" in r["name"]])
