"""Altre ricette colorate NATURALMENTE (curcuma giallo, spinaci verde, carbone nero),
metodo INDIRETTO e procedimenti lunghi. Scrive nel seed JSON + sincronizza il DB."""
import os, json, uuid
from datetime import datetime, timezone

ROOT = os.path.dirname(os.path.abspath(__file__))
SEED = os.path.join(ROOT, "mikilab_seed_data.json")
now = datetime.now(timezone.utc).isoformat()

IMG = {
    "curcuma": "https://static.prod-images.emergentagent.com/jobs/a3a8adf3-0daf-4c97-b252-e649a2b2f60f/images/2ded88d706d8ceff0db8f565e26c7455d0f7b58dc1d10c4accde2879faeac57c.jpeg",
    "spinaci": "https://static.prod-images.emergentagent.com/jobs/a3a8adf3-0daf-4c97-b252-e649a2b2f60f/images/7ed95ad98ed7ecfdd079a1bad0a48384f3ab8e4a6b8817bdbb32bdfaf6c4e1b4.jpeg",
    "carbone": "https://static.prod-images.emergentagent.com/jobs/a3a8adf3-0daf-4c97-b252-e649a2b2f60f/images/2464de28638a0c645c83f4c6639d4f6cf7e5a860b3decadd721254bc0c768422.jpeg",
    "cornetto_carbone": "https://static.prod-images.emergentagent.com/jobs/a3a8adf3-0daf-4c97-b252-e649a2b2f60f/images/10b3e216b82aec81bd69c0afb9eca014f14f297ed17b5717d4019d4b4cf39479.jpeg",
}

RECIPES = [
 {
  "name": "Pane alla Curcuma e Zenzero",
  "name_de": "Kurkuma-Ingwer-Brot",
  "name_en": "Turmeric & Ginger Bread",
  "flour_type": "Farina tipo 1 W280",
  "flour_type_de": "Mehl Type 1 W280",
  "flour_type_en": "Type 1 flour W280",
  "hydration_percent": 72, "preferment_type": "biga", "method_type": "indiretto",
  "menu_category": "pane", "origin": "it", "bake_temp": 235, "bake_minutes": 42,
  "image_url": IMG["curcuma"],
  "extra_ingredients": [
    {"name": "Curcuma in polvere (colore giallo naturale)", "percent": 1.5},
    {"name": "Zenzero fresco grattugiato", "percent": 1},
    {"name": "Olio d'oliva", "percent": 3},
    {"name": "Miglioratore Naturale Pro (2% sul peso della farina)", "percent": 2},
  ],
  "notes": "Pane dal colore GIALLO ORO naturale dato dalla curcuma (nessun colorante), con una nota calda di zenzero. Metodo indiretto con BIGA (18 h a 18°C). La curcuma si scioglie in poca acqua tiepida per distribuire il colore in modo uniforme.",
  "notes_de": "Brot mit natürlicher goldgelber Farbe durch Kurkuma (keine Farbstoffe), mit warmer Ingwernote. Indirekt mit BIGA (18 Std. bei 18°C). Kurkuma in wenig lauwarmem Wasser lösen.",
  "notes_en": "Bread with a natural golden-yellow colour from turmeric (no dyes), with a warm ginger note. Indirect method with BIGA (18 h at 18°C). Dissolve the turmeric in a little warm water for an even colour.",
  "procedure": (
    "1) BIGA (indiretto): impasta 100% farina forte, 44% acqua e 1% lievito; matura 18 ore a 18°C.\n"
    "2) SOLUZIONE COLORE: sciogli la curcuma in poca acqua tiepida e aggiungi lo zenzero grattugiato.\n"
    "3) AUTOLISI: mescola la farina restante con l'acqua (tenendo da parte l'acqua di bassinage), riposo 40 minuti.\n"
    "4) IMPASTO: unisci la biga e il lievito madre rinfrescato, poi la soluzione di curcuma, l'olio e il Miglioratore Naturale Pro; incorda e aggiungi l'acqua di bassinage a filo.\n"
    "5) PUNTATA: 1,5 ore a temperatura ambiente con 2 pieghe di rinforzo.\n"
    "6) CELLA 16°C: matura la massa 14-18 ore (o frigo 4-6°C) per aroma e alveolatura.\n"
    "7) FORMATURA: forma le pagnotte e metti in appretto 2-2,5 ore in cestino infarinato.\n"
    "8) COTTURA: 235°C con vapore i primi 15 minuti, poi 215°C, totale ~42 minuti."
  ),
  "procedure_de": (
    "1) BIGA: 100% starkes Mehl, 44% Wasser, 1% Hefe; 18 Std. bei 18°C.\n"
    "2) FARBLÖSUNG: Kurkuma in wenig lauwarmem Wasser lösen, Ingwer zugeben.\n"
    "3) AUTOLYSE: restliches Mehl + Wasser (Bassinage zurückhalten), 40 Min.\n"
    "4) TEIG: Biga und Sauerteig, dann Kurkumalösung, Öl, Backmittel; auskneten, Bassinage einarbeiten.\n"
    "5) STOCKGARE: 1,5 Std., 2 Dehn-und-Faltungen.\n"
    "6) 16°C GÄRKAMMER: 14-18 Std. reifen (oder Kühlschrank).\n"
    "7) FORMEN: Laibe, 2-2,5 Std. Stückgare.\n"
    "8) BACKEN: 235°C mit Schwaden 15 Min., dann 215°C, ~42 Min."
  ),
  "procedure_en": (
    "1) BIGA (indirect): mix 100% strong flour, 44% water, 1% yeast; mature 18 h at 18°C.\n"
    "2) COLOUR SOLUTION: dissolve the turmeric in a little warm water, add grated ginger.\n"
    "3) AUTOLYSE: mix remaining flour with water (hold back bassinage), rest 40 min.\n"
    "4) DOUGH: incorporate biga and refreshed sourdough, then turmeric solution, oil and Natural Improver Pro; develop gluten and add bassinage water gradually.\n"
    "5) BULK: 1.5 h at room temperature with 2 stretch-and-folds.\n"
    "6) 16°C RETARD: mature 14-18 h (or fridge 4-6°C) for aroma and open crumb.\n"
    "7) SHAPE: shape the loaves and proof 2-2.5 h in a floured banneton.\n"
    "8) BAKE: 235°C with steam for the first 15 min, then 215°C, ~42 min total."
  ),
 },
 {
  "name": "Pane agli Spinaci",
  "name_de": "Spinat-Brot",
  "name_en": "Spinach Bread",
  "flour_type": "Farina tipo 1 W280",
  "flour_type_de": "Mehl Type 1 W280",
  "flour_type_en": "Type 1 flour W280",
  "hydration_percent": 68, "preferment_type": "poolish", "method_type": "indiretto",
  "menu_category": "pane", "origin": "it", "bake_temp": 235, "bake_minutes": 40,
  "image_url": IMG["spinaci"],
  "extra_ingredients": [
    {"name": "Purea di spinaci lessati (colore verde naturale)", "percent": 20},
    {"name": "Olio d'oliva", "percent": 3},
    {"name": "Miglioratore Naturale Pro (2% sul peso della farina)", "percent": 2},
  ],
  "notes": "Pane dal colore VERDE naturale dato dalla purea di spinaci (nessun colorante). Metodo indiretto con POOLISH. Gli spinaci apportano acqua, quindi l'idratazione va ridotta. Colore più vivo con cottura non troppo scura.",
  "notes_de": "Brot mit natürlicher grüner Farbe durch Spinatpüree (keine Farbstoffe). Indirekt mit POOLISH. Spinat bringt Wasser, daher Wasseranteil reduzieren.",
  "notes_en": "Bread with a natural green colour from spinach purée (no dyes). Indirect method with POOLISH. Spinach adds water, so reduce the added water. Keep the bake light for a brighter colour.",
  "procedure": (
    "1) POOLISH (indiretto): 0,3% lievito + acqua (30% farina) + pari peso di farina; matura 12-16 ore a 18°C.\n"
    "2) PUREA: lessa e frulla gli spinaci, poi scolali bene per non aggiungere troppa acqua.\n"
    "3) AUTOLISI: mescola farina restante e purea di spinaci, riposo 40 minuti (il colore si fissa).\n"
    "4) IMPASTO: unisci il poolish e il lievito madre rinfrescato, poi olio e Miglioratore Naturale Pro; incorda regolando l'acqua.\n"
    "5) PUNTATA: 1 ora a temperatura ambiente con 2 pieghe.\n"
    "6) CELLA 16°C: matura 12-16 ore (o frigo 4-6°C).\n"
    "7) FORMATURA: forma le pagnotte, appretto 2 ore in cestino.\n"
    "8) COTTURA: 235°C con vapore i primi 15 minuti, poi 215°C, totale ~40 minuti; non troppo scura per mantenere il verde."
  ),
  "procedure_de": (
    "1) POOLISH: 0,3% Hefe + Wasser (30% Mehl) + gleiches Gewicht Mehl; 12-16 Std. bei 18°C.\n"
    "2) PÜREE: Spinat kochen, pürieren, gut abtropfen.\n"
    "3) AUTOLYSE: restliches Mehl + Spinatpüree, 40 Min.\n"
    "4) TEIG: Poolish und Sauerteig, dann Öl, Backmittel; Wasser anpassen.\n"
    "5) STOCKGARE: 1 Std., 2 Faltungen.\n"
    "6) 16°C GÄRKAMMER: 12-16 Std. (oder Kühlschrank).\n"
    "7) FORMEN: Laibe, 2 Std. Stückgare.\n"
    "8) BACKEN: 235°C mit Schwaden 15 Min., dann 215°C, ~40 Min.; nicht zu dunkel."
  ),
  "procedure_en": (
    "1) POOLISH (indirect): 0.3% yeast + water (30% flour) + equal weight of flour; mature 12-16 h at 18°C.\n"
    "2) PURÉE: boil and blend the spinach, then drain well to avoid adding too much water.\n"
    "3) AUTOLYSE: mix remaining flour and spinach purée, rest 40 min (the colour sets).\n"
    "4) DOUGH: incorporate poolish and refreshed sourdough, then oil and Natural Improver Pro; develop gluten adjusting water.\n"
    "5) BULK: 1 h at room temperature with 2 folds.\n"
    "6) 16°C RETARD: mature 12-16 h (or fridge 4-6°C).\n"
    "7) SHAPE: shape the loaves and proof 2 h in a banneton.\n"
    "8) BAKE: 235°C with steam for the first 15 min, then 215°C, ~40 min total; keep it light to preserve the green."
  ),
 },
 {
  "name": "Pane Nero al Carbone Vegetale",
  "name_de": "Schwarzes Aktivkohle-Brot",
  "name_en": "Black Vegetable Charcoal Bread",
  "flour_type": "Farina tipo 1 W280",
  "flour_type_de": "Mehl Type 1 W280",
  "flour_type_en": "Type 1 flour W280",
  "hydration_percent": 74, "preferment_type": "lm", "method_type": "indiretto",
  "menu_category": "pane", "origin": "it", "bake_temp": 240, "bake_minutes": 42,
  "image_url": IMG["carbone"],
  "extra_ingredients": [
    {"name": "Carbone vegetale alimentare (colore nero naturale)", "percent": 1.5},
    {"name": "Semi di sesamo nero", "percent": 5},
    {"name": "Olio d'oliva", "percent": 3},
    {"name": "Miglioratore Naturale Pro (2% sul peso della farina)", "percent": 2},
  ],
  "notes": "Pane dal colore NERO intenso dato dal carbone vegetale alimentare (nessun colorante artificiale). Metodo indiretto con LIEVITO MADRE. Il carbone si idrata a parte per evitare grumi. Effetto scenografico con semi di sesamo nero.",
  "notes_de": "Brot mit intensiver schwarzer Farbe durch essbare Aktivkohle (keine künstlichen Farbstoffe). Indirekt mit SAUERTEIG. Kohle separat anrühren, um Klümpchen zu vermeiden.",
  "notes_en": "Bread with an intense black colour from edible vegetable charcoal (no artificial dyes). Indirect method with SOURDOUGH. Hydrate the charcoal separately to avoid lumps. Striking with black sesame seeds.",
  "procedure": (
    "1) PREFERMENTO (indiretto): rinfresca il lievito madre e fallo maturare fino a raddoppio (4-6 ore a 26°C).\n"
    "2) SOLUZIONE CARBONE: sciogli il carbone vegetale in una parte dell'acqua per distribuirlo bene.\n"
    "3) AUTOLISI: mescola farina e la restante acqua, riposo 40 minuti.\n"
    "4) IMPASTO: unisci il lievito madre, poi la soluzione di carbone, olio, sesamo nero e Miglioratore Naturale Pro; incorda.\n"
    "5) PUNTATA: 1,5 ore a temperatura ambiente con 2 pieghe.\n"
    "6) CELLA 16°C: matura 14-18 ore (o frigo 4-6°C) per aroma e alveolatura.\n"
    "7) FORMATURA: forma le pagnotte, appretto 2-2,5 ore in cestino.\n"
    "8) COTTURA: 240°C con vapore i primi 15 minuti, poi 220°C, totale ~42 minuti; crosta lucida e nera."
  ),
  "procedure_de": (
    "1) VORTEIG: Sauerteig auffrischen, bis zur Verdopplung (4-6 Std. bei 26°C).\n"
    "2) KOHLELÖSUNG: Aktivkohle in einem Teil des Wassers lösen.\n"
    "3) AUTOLYSE: Mehl + restliches Wasser, 40 Min.\n"
    "4) TEIG: Sauerteig, dann Kohlelösung, Öl, schwarzer Sesam, Backmittel; auskneten.\n"
    "5) STOCKGARE: 1,5 Std., 2 Faltungen.\n"
    "6) 16°C GÄRKAMMER: 14-18 Std. reifen (oder Kühlschrank).\n"
    "7) FORMEN: Laibe, 2-2,5 Std. Stückgare.\n"
    "8) BACKEN: 240°C mit Schwaden 15 Min., dann 220°C, ~42 Min."
  ),
  "procedure_en": (
    "1) PRE-FERMENT (indirect): refresh the sourdough and let it mature until doubled (4-6 h at 26°C).\n"
    "2) CHARCOAL SOLUTION: dissolve the vegetable charcoal in part of the water to spread it evenly.\n"
    "3) AUTOLYSE: mix flour and the remaining water, rest 40 min.\n"
    "4) DOUGH: add the sourdough, then charcoal solution, oil, black sesame and Natural Improver Pro; develop gluten.\n"
    "5) BULK: 1.5 h at room temperature with 2 folds.\n"
    "6) 16°C RETARD: mature 14-18 h (or fridge 4-6°C) for aroma and open crumb.\n"
    "7) SHAPE: shape the loaves and proof 2-2.5 h in a banneton.\n"
    "8) BAKE: 240°C with steam for the first 15 min, then 220°C, ~42 min total; glossy black crust."
  ),
 },
 {
  "name": "Cornetto Bicolore Carbone e Vaniglia",
  "name_de": "Zweifarbiges Hörnchen Aktivkohle & Vanille",
  "name_en": "Two-Tone Charcoal & Vanilla Croissant",
  "flour_type": "Farina W330 + 00 + uova",
  "flour_type_de": "Mehl W330 + 00 + Eier",
  "flour_type_en": "Flour W330 + 00 + eggs",
  "hydration_percent": 54, "preferment_type": "biga", "method_type": "indiretto",
  "menu_category": "viennoiserie", "origin": "it", "bake_temp": 190, "bake_minutes": 18,
  "image_url": IMG["cornetto_carbone"],
  "extra_ingredients": [
    {"name": "Uova (Eier)", "percent": 6}, {"name": "Zucchero", "percent": 12},
    {"name": "Burro per sfoglia (tourage) 2x20%", "percent": 40},
    {"name": "Carbone vegetale alimentare (per la pasta nera)", "percent": 1.5},
    {"name": "Vaniglia in bacca (per la pasta chiara)", "percent": 0.5},
    {"name": "Miglioratore Naturale Pro (2% sul peso della farina)", "percent": 2},
    {"name": "Lievito di birra (Hefe)", "percent": 1},
  ],
  "notes": "Cornetto sfogliato a forte contrasto BIANCO/NERO: pasta chiara alla vaniglia e pasta nera al carbone vegetale, laminate insieme per righe scenografiche. Metodo indiretto con BIGA + lievito madre. Il carbone colora solo metà impasto.",
  "notes_de": "Kontrastreiches Plunderhörnchen weiß/schwarz: heller Vanilleteig und schwarzer Aktivkohleteig, zusammen touriert. Indirekt mit BIGA + Sauerteig. Kohle nur in die halbe Teigmenge.",
  "notes_en": "High-contrast black/white laminated croissant: light vanilla dough and black charcoal dough laminated together for dramatic stripes. Indirect method with BIGA + sourdough. Charcoal colours only half the dough.",
  "procedure": (
    "1) BIGA (indiretto): impasta 100% farina forte, 44% acqua e 1% lievito; matura 18 ore a 18°C fino a triplo volume.\n"
    "2) AUTOLISI: mescola la farina restante con acqua e uova, riposo 40 minuti.\n"
    "3) IMPASTO BASE: unisci la biga e il lievito madre rinfrescato, poi zucchero e Miglioratore Naturale Pro; incorda a velo.\n"
    "4) DIVISIONE E COLORE: dividi in due. In una metà lavora la vaniglia (pasta chiara), nell'altra il carbone vegetale idratato (pasta nera).\n"
    "5) CELLA 16°C: pirla entrambe le masse e riposa 12-18 ore a 16°C (o frigo 4-6°C).\n"
    "6) SFOGLIATURA BICOLORE: sovrapponi pasta chiara e nera, incassa il burro e dai 3 pieghe con riposo in frigo, mantenendo le righe a contrasto.\n"
    "7) FORMATURA: stendi a 3,5 mm, taglia i triangoli lasciando visibili le due paste e arrotola.\n"
    "8) APPRETTO: 2,5-3 ore a 26°C.\n"
    "9) COTTURA: uovo (solo sulla parte chiara per non spegnere il nero) e cuoci a 190°C per 18 minuti."
  ),
  "procedure_de": (
    "1) BIGA: 100% starkes Mehl, 44% Wasser, 1% Hefe; 18 Std. bei 18°C.\n"
    "2) AUTOLYSE: restliches Mehl mit Wasser und Eiern, 40 Min.\n"
    "3) TEIG: Biga und Sauerteig, dann Zucker, Backmittel; auskneten.\n"
    "4) TEILEN & FÄRBEN: halbieren; eine Hälfte Vanille (hell), die andere Aktivkohle (schwarz).\n"
    "5) 16°C GÄRKAMMER: rundwirken, 12-18 Std. (oder Kühlschrank).\n"
    "6) ZWEIFARBIGES TOURIEREN: hell und schwarz überlagern, Butter einschlagen, 3 Touren mit Kühlpausen.\n"
    "7) FORMEN: 3,5 mm, Dreiecke, Hörnchen rollen.\n"
    "8) GARE: 2,5-3 Std. bei 26°C.\n"
    "9) BACKEN: Ei (nur hell), 190°C 18 Min."
  ),
  "procedure_en": (
    "1) BIGA (indirect): mix 100% strong flour, 44% water, 1% yeast; mature 18 h at 18°C until tripled.\n"
    "2) AUTOLYSE: mix remaining flour with water and eggs, rest 40 min.\n"
    "3) DOUGH: incorporate biga and refreshed sourdough, then sugar and Natural Improver Pro; develop the gluten.\n"
    "4) SPLIT & COLOUR: divide in two. Work vanilla into one half (light), hydrated charcoal into the other (black).\n"
    "5) 16°C RETARD: round both masses, rest 12-18 h at 16°C (or fridge 4-6°C).\n"
    "6) TWO-TONE LAMINATION: stack light and black doughs, encase the butter and give 3 folds with fridge rests, keeping the contrast stripes.\n"
    "7) SHAPE: sheet to 3.5 mm, cut triangles keeping both colours visible, roll.\n"
    "8) PROOF: 2.5-3 h at 26°C.\n"
    "9) BAKE: egg wash (on the light part only, to keep the black) and bake at 190°C for 18 min."
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
