"""Ricette colorate NATURALMENTE: zafferano (giallo), spirulina (blu-verde), rapa rossa (rosa).
Metodo INDIRETTO, procedimenti lunghi. Scrive nel seed JSON + sincronizza il DB."""
import os, json, uuid
from datetime import datetime, timezone

ROOT = os.path.dirname(os.path.abspath(__file__))
SEED = os.path.join(ROOT, "mikilab_seed_data.json")
now = datetime.now(timezone.utc).isoformat()

IMG = {
    "zafferano": "https://static.prod-images.emergentagent.com/jobs/a3a8adf3-0daf-4c97-b252-e649a2b2f60f/images/c267746549ecf1b531c4a6f20b6746620b2ddd7259e1c38bdfa46cba0f206a2b.jpeg",
    "spirulina": "https://static.prod-images.emergentagent.com/jobs/a3a8adf3-0daf-4c97-b252-e649a2b2f60f/images/d0664d568f89e62dfeff51d26cac622ecdbe57d64fb129b0ddbd2422c75e1b54.jpeg",
    "rosa": "https://static.prod-images.emergentagent.com/jobs/a3a8adf3-0daf-4c97-b252-e649a2b2f60f/images/c2b5458abad1242cedb754aa43fc3508da58e20e6b813032e409e7fa30435edd.jpeg",
}

RECIPES = [
 {
  "name": "Pane allo Zafferano",
  "name_de": "Safran-Brot",
  "name_en": "Saffron Bread",
  "flour_type": "Farina tipo 1 W280",
  "flour_type_de": "Mehl Type 1 W280",
  "flour_type_en": "Type 1 flour W280",
  "hydration_percent": 70, "preferment_type": "biga", "method_type": "indiretto",
  "menu_category": "pane", "origin": "it", "bake_temp": 235, "bake_minutes": 42,
  "image_url": IMG["zafferano"],
  "extra_ingredients": [
    {"name": "Zafferano in pistilli (colore giallo-arancio naturale)", "percent": 0.2},
    {"name": "Olio d'oliva", "percent": 3},
    {"name": "Miele", "percent": 2},
    {"name": "Miglioratore Naturale Pro (2% sul peso della farina)", "percent": 2},
  ],
  "notes": "Pane dal colore GIALLO-ARANCIO naturale e dal profumo caldo dato dallo zafferano in pistilli (nessun colorante). Metodo indiretto con BIGA (18 h a 18°C). I pistilli si mettono in infusione la sera prima nell'acqua dell'impasto per estrarre colore e aroma.",
  "notes_de": "Brot mit natürlicher gelb-oranger Farbe und warmem Aroma durch Safranfäden (keine Farbstoffe). Indirekt mit BIGA (18 Std. bei 18°C). Safran am Vorabend im Teigwasser ziehen lassen.",
  "notes_en": "Bread with a natural yellow-orange colour and warm aroma from saffron threads (no dyes). Indirect method with BIGA (18 h at 18°C). Infuse the threads the night before in the dough water.",
  "procedure": (
    "1) INFUSIONE: la sera prima, metti i pistilli di zafferano nell'acqua tiepida dell'impasto per estrarre colore e aroma.\n"
    "2) BIGA (indiretto): impasta 100% farina forte, 44% acqua e 1% lievito; matura 18 ore a 18°C.\n"
    "3) AUTOLISI: mescola la farina restante con l'acqua allo zafferano, riposo 40 minuti.\n"
    "4) IMPASTO: unisci la biga e il lievito madre rinfrescato, poi miele, olio e Miglioratore Naturale Pro; incorda.\n"
    "5) PUNTATA: 1,5 ore a temperatura ambiente con 2 pieghe di rinforzo.\n"
    "6) CELLA 16°C: matura la massa 14-18 ore (o frigo 4-6°C) per aroma e alveolatura.\n"
    "7) FORMATURA: forma le pagnotte e metti in appretto 2-2,5 ore in cestino infarinato.\n"
    "8) COTTURA: 235°C con vapore i primi 15 minuti, poi 215°C, totale ~42 minuti."
  ),
  "procedure_de": (
    "1) INFUSION: am Vorabend Safranfäden in lauwarmem Teigwasser ziehen lassen.\n"
    "2) BIGA: 100% starkes Mehl, 44% Wasser, 1% Hefe; 18 Std. bei 18°C.\n"
    "3) AUTOLYSE: restliches Mehl mit Safranwasser, 40 Min.\n"
    "4) TEIG: Biga und Sauerteig, dann Honig, Öl, Backmittel; auskneten.\n"
    "5) STOCKGARE: 1,5 Std., 2 Dehn-und-Faltungen.\n"
    "6) 16°C GÄRKAMMER: 14-18 Std. reifen (oder Kühlschrank).\n"
    "7) FORMEN: Laibe, 2-2,5 Std. Stückgare.\n"
    "8) BACKEN: 235°C mit Schwaden 15 Min., dann 215°C, ~42 Min."
  ),
  "procedure_en": (
    "1) INFUSION: the night before, steep the saffron threads in the warm dough water for colour and aroma.\n"
    "2) BIGA (indirect): mix 100% strong flour, 44% water, 1% yeast; mature 18 h at 18°C.\n"
    "3) AUTOLYSE: mix remaining flour with the saffron water, rest 40 min.\n"
    "4) DOUGH: incorporate biga and refreshed sourdough, then honey, oil and Natural Improver Pro; develop gluten.\n"
    "5) BULK: 1.5 h at room temperature with 2 stretch-and-folds.\n"
    "6) 16°C RETARD: mature 14-18 h (or fridge 4-6°C) for aroma and open crumb.\n"
    "7) SHAPE: shape the loaves and proof 2-2.5 h in a floured banneton.\n"
    "8) BAKE: 235°C with steam for the first 15 min, then 215°C, ~42 min total."
  ),
 },
 {
  "name": "Pane alla Spirulina",
  "name_de": "Spirulina-Brot",
  "name_en": "Spirulina Bread",
  "flour_type": "Farina tipo 1 W280",
  "flour_type_de": "Mehl Type 1 W280",
  "flour_type_en": "Type 1 flour W280",
  "hydration_percent": 70, "preferment_type": "poolish", "method_type": "indiretto",
  "menu_category": "pane", "origin": "it", "bake_temp": 230, "bake_minutes": 40,
  "image_url": IMG["spirulina"],
  "extra_ingredients": [
    {"name": "Spirulina in polvere (colore blu-verde naturale)", "percent": 1.5},
    {"name": "Olio d'oliva", "percent": 3},
    {"name": "Miglioratore Naturale Pro (2% sul peso della farina)", "percent": 2},
  ],
  "notes": "Pane dal colore BLU-VERDE naturale e ricco di proteine dato dall'alga spirulina (nessun colorante). Metodo indiretto con POOLISH. La spirulina teme il calore eccessivo: cottura non troppo aggressiva per mantenere il colore vivo.",
  "notes_de": "Proteinreiches Brot mit natürlicher blau-grüner Farbe durch Spirulina-Alge (keine Farbstoffe). Indirekt mit POOLISH. Spirulina mag keine zu starke Hitze: nicht zu aggressiv backen.",
  "notes_en": "Protein-rich bread with a natural blue-green colour from spirulina algae (no dyes). Indirect method with POOLISH. Spirulina dislikes excessive heat: keep the bake gentle to preserve the colour.",
  "procedure": (
    "1) POOLISH (indiretto): 0,3% lievito + acqua (30% farina) + pari peso di farina; matura 12-16 ore a 18°C.\n"
    "2) SOLUZIONE COLORE: sciogli la spirulina in poca acqua per distribuirla senza grumi.\n"
    "3) AUTOLISI: mescola farina restante e acqua, riposo 40 minuti.\n"
    "4) IMPASTO: unisci il poolish e il lievito madre rinfrescato, poi la spirulina, olio e Miglioratore Naturale Pro; incorda.\n"
    "5) PUNTATA: 1 ora a temperatura ambiente con 2 pieghe.\n"
    "6) CELLA 16°C: matura 12-16 ore (o frigo 4-6°C).\n"
    "7) FORMATURA: forma le pagnotte, appretto 2 ore in cestino.\n"
    "8) COTTURA: 230°C con vapore i primi 12 minuti, poi 210°C, totale ~40 minuti; evita cotture troppo scure."
  ),
  "procedure_de": (
    "1) POOLISH: 0,3% Hefe + Wasser (30% Mehl) + gleiches Gewicht Mehl; 12-16 Std. bei 18°C.\n"
    "2) FARBLÖSUNG: Spirulina in wenig Wasser klümpchenfrei lösen.\n"
    "3) AUTOLYSE: restliches Mehl + Wasser, 40 Min.\n"
    "4) TEIG: Poolish und Sauerteig, dann Spirulina, Öl, Backmittel; auskneten.\n"
    "5) STOCKGARE: 1 Std., 2 Faltungen.\n"
    "6) 16°C GÄRKAMMER: 12-16 Std. (oder Kühlschrank).\n"
    "7) FORMEN: Laibe, 2 Std. Stückgare.\n"
    "8) BACKEN: 230°C mit Schwaden 12 Min., dann 210°C, ~40 Min.; nicht zu dunkel."
  ),
  "procedure_en": (
    "1) POOLISH (indirect): 0.3% yeast + water (30% flour) + equal weight of flour; mature 12-16 h at 18°C.\n"
    "2) COLOUR SOLUTION: dissolve the spirulina in a little water to avoid lumps.\n"
    "3) AUTOLYSE: mix remaining flour and water, rest 40 min.\n"
    "4) DOUGH: incorporate poolish and refreshed sourdough, then spirulina, oil and Natural Improver Pro; develop gluten.\n"
    "5) BULK: 1 h at room temperature with 2 folds.\n"
    "6) 16°C RETARD: mature 12-16 h (or fridge 4-6°C).\n"
    "7) SHAPE: shape the loaves and proof 2 h in a banneton.\n"
    "8) BAKE: 230°C with steam for the first 12 min, then 210°C, ~40 min total; avoid over-baking."
  ),
 },
 {
  "name": "Cornetto Bicolore Rosa (Rapa Rossa) e Vaniglia",
  "name_de": "Zweifarbiges Hörnchen Rosa (Rote Bete) & Vanille",
  "name_en": "Two-Tone Pink (Beetroot) & Vanilla Croissant",
  "flour_type": "Farina W330 + 00 + uova",
  "flour_type_de": "Mehl W330 + 00 + Eier",
  "flour_type_en": "Flour W330 + 00 + eggs",
  "hydration_percent": 53, "preferment_type": "biga", "method_type": "indiretto",
  "menu_category": "viennoiserie", "origin": "it", "bake_temp": 188, "bake_minutes": 18,
  "image_url": IMG["rosa"],
  "extra_ingredients": [
    {"name": "Uova (Eier)", "percent": 6}, {"name": "Zucchero", "percent": 12},
    {"name": "Burro per sfoglia (tourage) 2x20%", "percent": 40},
    {"name": "Rapa rossa in polvere/purea (per la pasta rosa)", "percent": 4},
    {"name": "Vaniglia in bacca (per la pasta chiara)", "percent": 0.5},
    {"name": "Miglioratore Naturale Pro (2% sul peso della farina)", "percent": 2},
    {"name": "Lievito di birra (Hefe)", "percent": 1},
  ],
  "notes": "Cornetto sfogliato ROSA/CHIARO: pasta chiara alla vaniglia e pasta rosa alla rapa rossa, laminate insieme per righe delicate. Metodo indiretto con BIGA + lievito madre. Il rosa naturale della rapa rossa resta più vivo con cottura dolce (188°C).",
  "notes_de": "Rosa/hell geblättertes Hörnchen: heller Vanilleteig und rosa Rote-Bete-Teig, zusammen touriert. Indirekt mit BIGA + Sauerteig. Das natürliche Rosa bleibt bei sanftem Backen (188°C) lebendiger.",
  "notes_en": "Pink/light laminated croissant: light vanilla dough and pink beetroot dough laminated together for delicate stripes. Indirect method with BIGA + sourdough. The natural pink stays brighter with a gentle bake (188°C).",
  "procedure": (
    "1) BIGA (indiretto): impasta 100% farina forte, 44% acqua e 1% lievito; matura 18 ore a 18°C.\n"
    "2) AUTOLISI: mescola la farina restante con acqua e uova, riposo 40 minuti.\n"
    "3) IMPASTO BASE: unisci la biga e il lievito madre rinfrescato, poi zucchero e Miglioratore Naturale Pro; incorda a velo.\n"
    "4) DIVISIONE E COLORE: dividi in due. In una metà lavora la vaniglia (pasta chiara), nell'altra la rapa rossa in polvere/purea (pasta rosa).\n"
    "5) CELLA 16°C: pirla entrambe le masse e riposa 12-18 ore a 16°C (o frigo 4-6°C).\n"
    "6) SFOGLIATURA BICOLORE: sovrapponi pasta chiara e rosa, incassa il burro e dai 3 pieghe con riposo in frigo, mantenendo le righe.\n"
    "7) FORMATURA: stendi a 3,5 mm, taglia i triangoli lasciando visibili le due paste e arrotola.\n"
    "8) APPRETTO: 2,5-3 ore a 26°C.\n"
    "9) COTTURA: uovo (solo sulla parte chiara) e cuoci a 188°C per 18 minuti per non spegnere il rosa."
  ),
  "procedure_de": (
    "1) BIGA: 100% starkes Mehl, 44% Wasser, 1% Hefe; 18 Std. bei 18°C.\n"
    "2) AUTOLYSE: restliches Mehl mit Wasser und Eiern, 40 Min.\n"
    "3) TEIG: Biga und Sauerteig, dann Zucker, Backmittel; auskneten.\n"
    "4) TEILEN & FÄRBEN: halbieren; eine Hälfte Vanille (hell), die andere Rote Bete (rosa).\n"
    "5) 16°C GÄRKAMMER: rundwirken, 12-18 Std. (oder Kühlschrank).\n"
    "6) ZWEIFARBIGES TOURIEREN: hell und rosa überlagern, Butter einschlagen, 3 Touren mit Kühlpausen.\n"
    "7) FORMEN: 3,5 mm, Dreiecke, Hörnchen rollen.\n"
    "8) GARE: 2,5-3 Std. bei 26°C.\n"
    "9) BACKEN: Ei (nur hell), 188°C 18 Min."
  ),
  "procedure_en": (
    "1) BIGA (indirect): mix 100% strong flour, 44% water, 1% yeast; mature 18 h at 18°C.\n"
    "2) AUTOLYSE: mix remaining flour with water and eggs, rest 40 min.\n"
    "3) DOUGH: incorporate biga and refreshed sourdough, then sugar and Natural Improver Pro; develop the gluten.\n"
    "4) SPLIT & COLOUR: divide in two. Work vanilla into one half (light), beetroot powder/purée into the other (pink).\n"
    "5) 16°C RETARD: round both masses, rest 12-18 h at 16°C (or fridge 4-6°C).\n"
    "6) TWO-TONE LAMINATION: stack light and pink doughs, encase the butter and give 3 folds with fridge rests, keeping the stripes.\n"
    "7) SHAPE: sheet to 3.5 mm, cut triangles keeping both colours visible, roll.\n"
    "8) PROOF: 2.5-3 h at 26°C.\n"
    "9) BAKE: egg wash (light part only) and bake at 188°C for 18 min to keep the pink."
  ),
 },
]

with open(SEED, "r", encoding="utf-8") as f:
    data = json.load(f)

names = {r["name"] for r in RECIPES}
data = [d for d in data if d.get("name") not in names]
for r in RECIPES:
    entry = dict(r)
    entry["id"] = str(uuid.uuid4())
    entry["collection_name"] = "mikilab"
    entry["created_at"] = now
    entry["updated_at"] = now
    entry.setdefault("real_name", r["name"])
    entry.setdefault("real_name_de", r["name_de"])
    entry.setdefault("real_name_en", r["name_en"])
    data.append(entry)

with open(SEED, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=1)

print("Ricette totali nel seed:", len(data))
print("Aggiunte:", ", ".join(names))
