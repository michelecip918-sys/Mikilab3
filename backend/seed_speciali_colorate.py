"""Aggiunge al ricettario MikiLab cornetti bicolore/doppio gusto e pani colorati naturalmente,
tutti col metodo INDIRETTO (biga/poolish + lievito madre) e procedimenti lunghi.
Scrive nel seed JSON (persistente ai redeploy) e sincronizza il DB."""
import os, json, uuid
from datetime import datetime, timezone

ROOT = os.path.dirname(os.path.abspath(__file__))
SEED = os.path.join(ROOT, "mikilab_seed_data.json")
now = datetime.now(timezone.utc).isoformat()

IMG = {
    "cacao": "https://images.pexels.com/photos/31310834/pexels-photo-31310834.jpeg",
    "pistacchio": "https://static.prod-images.emergentagent.com/jobs/a3a8adf3-0daf-4c97-b252-e649a2b2f60f/images/51cd779eb9f3577d9b6fc640183091e68080f127a68276258cbfc2a7b04ba97c.jpeg",
    "nduja": "https://images.unsplash.com/photo-1670843837159-ddae2ec115d4?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "barbabietola": "https://images.unsplash.com/photo-1663427937451-f3dd78df6840?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "pomobasilico": "https://static.prod-images.emergentagent.com/jobs/a3a8adf3-0daf-4c97-b252-e649a2b2f60f/images/64b8aa699761ba1112f174969a3ef640a419fc30686a7705fa5f27e3624ab21b.jpeg",
}

RECIPES = [
 {
  "name": "Cornetto Bicolore Cacao e Vaniglia",
  "name_de": "Zweifarbiges Hörnchen Kakao & Vanille",
  "name_en": "Two-Tone Cocoa & Vanilla Croissant",
  "flour_type": "Farina W330 + 00 + uova",
  "flour_type_de": "Mehl W330 + 00 + Eier",
  "flour_type_en": "Flour W330 + 00 + eggs",
  "hydration_percent": 54, "preferment_type": "biga", "method_type": "indiretto",
  "menu_category": "viennoiserie", "origin": "it", "bake_temp": 190, "bake_minutes": 18,
  "image_url": IMG["cacao"],
  "extra_ingredients": [
    {"name": "Uova (Eier)", "percent": 6}, {"name": "Zucchero", "percent": 12},
    {"name": "Burro per sfoglia (tourage) 2x20%", "percent": 40},
    {"name": "Cacao amaro (per la pasta scura)", "percent": 4},
    {"name": "Vaniglia in bacca (per la pasta chiara)", "percent": 0.5},
    {"name": "Miglioratore Naturale Pro (2% sul peso della farina)", "percent": 2},
    {"name": "Latte in polvere", "percent": 4}, {"name": "Lievito di birra (Hefe)", "percent": 1},
  ],
  "notes": "Cornetto sfogliato a DUE COLORI: pasta chiara alla vaniglia e pasta scura al cacao, laminate insieme per l'effetto bicolore a strati. Metodo indiretto con BIGA (18 h a 18°C) + lievito madre. Il cacao si aggiunge solo a metà impasto per ottenere due masse identiche ma di colore diverso.",
  "notes_de": "Zweifarbiges Plunderhörnchen: heller Vanilleteig und dunkler Kakaoteig, zusammen touriert für den Streifeneffekt. Indirekte Methode mit BIGA (18 Std. bei 18°C) + Sauerteig. Kakao nur in die halbe Teigmenge geben.",
  "notes_en": "Two-tone laminated croissant: light vanilla dough and dark cocoa dough laminated together for a striped effect. Indirect method with BIGA (18 h at 18°C) + sourdough. Cocoa is added only to half the dough.",
  "procedure": (
    "1) BIGA (indiretto): impasta 100% farina forte, 44% acqua e 1% lievito; matura 18 ore a 18°C fino a triplo volume.\n"
    "2) AUTOLISI: mescola la farina restante con acqua e uova, riposo 40 minuti.\n"
    "3) IMPASTO BASE: unisci la biga e il lievito madre rinfrescato, poi zucchero, latte in polvere e Miglioratore Naturale Pro; incorda a velo.\n"
    "4) DIVISIONE E COLORE: dividi l'impasto in due. In una metà lavora la vaniglia (pasta chiara), nell'altra il cacao setacciato (pasta scura), fino a colore uniforme.\n"
    "5) FRIGO/CELLA: pirla entrambe le masse e riposa in cella a 16°C (o frigo 4-6°C) per 12-18 ore.\n"
    "6) SFOGLIATURA BICOLORE: stendi le due paste, sovrapponile con un sottile strato di burro tra le due, poi incassa il panetto di burro e dai 3 pieghe (2 da tre + 1 da quattro), con riposo in frigo tra una piega e l'altra.\n"
    "7) FORMATURA: stendi a 3,5 mm, taglia i triangoli lasciando visibili le due paste e arrotola i cornetti.\n"
    "8) APPRETTO: 2,5-3 ore a 26°C fino a lievitazione pronta.\n"
    "9) COTTURA: spennella con uovo e cuoci a 190°C per 18 minuti."
  ),
  "procedure_de": (
    "1) BIGA: 100% starkes Mehl, 44% Wasser, 1% Hefe; 18 Std. bei 18°C reifen.\n"
    "2) AUTOLYSE: restliches Mehl mit Wasser und Eiern mischen, 40 Min. ruhen.\n"
    "3) TEIG: Biga und aufgefrischten Sauerteig einarbeiten, dann Zucker, Milchpulver, Backmittel; gut auskneten.\n"
    "4) TEILEN & FÄRBEN: Teig halbieren. Eine Hälfte mit Vanille (hell), die andere mit gesiebtem Kakao (dunkel).\n"
    "5) KÜHLUNG: beide Teige rundwirken, 12-18 Std. bei 16°C (oder Kühlschrank 4-6°C).\n"
    "6) ZWEIFARBIGES TOURIEREN: beide Teige ausrollen, übereinanderlegen, Butter einschlagen, 3 Touren mit Kühlpausen.\n"
    "7) FORMEN: 3,5 mm ausrollen, Dreiecke schneiden, Hörnchen rollen.\n"
    "8) GARE: 2,5-3 Std. bei 26°C.\n"
    "9) BACKEN: mit Ei bestreichen, 190°C 18 Min."
  ),
  "procedure_en": (
    "1) BIGA (indirect): mix 100% strong flour, 44% water, 1% yeast; mature 18 h at 18°C until tripled.\n"
    "2) AUTOLYSE: mix remaining flour with water and eggs, rest 40 min.\n"
    "3) DOUGH: incorporate the biga and refreshed sourdough, then sugar, milk powder and Natural Improver Pro; develop the gluten fully.\n"
    "4) SPLIT & COLOUR: divide in two. Work vanilla into one half (light), sifted cocoa into the other (dark).\n"
    "5) COLD REST: round both masses, rest 12-18 h at 16°C (or fridge 4-6°C).\n"
    "6) TWO-TONE LAMINATION: sheet both doughs, stack them, encase the butter block and give 3 folds with fridge rests.\n"
    "7) SHAPE: sheet to 3.5 mm, cut triangles keeping both colours visible, roll the croissants.\n"
    "8) PROOF: 2.5-3 h at 26°C.\n"
    "9) BAKE: egg wash, 190°C for 18 min."
  ),
 },
 {
  "name": "Cornetto Doppio Gusto Pistacchio e Cioccolato",
  "name_de": "Doppel-Hörnchen Pistazie & Schokolade",
  "name_en": "Double-Flavour Pistachio & Chocolate Croissant",
  "flour_type": "Farina W330 + 00 + uova",
  "flour_type_de": "Mehl W330 + 00 + Eier",
  "flour_type_en": "Flour W330 + 00 + eggs",
  "hydration_percent": 53, "preferment_type": "poolish", "method_type": "indiretto",
  "menu_category": "viennoiserie", "origin": "it", "bake_temp": 188, "bake_minutes": 18,
  "image_url": IMG["pistacchio"],
  "extra_ingredients": [
    {"name": "Uova (Eier)", "percent": 6}, {"name": "Zucchero", "percent": 12},
    {"name": "Burro per sfoglia (tourage) 2x20%", "percent": 40},
    {"name": "Pasta di pistacchio puro (per la pasta verde)", "percent": 5},
    {"name": "Crema al pistacchio (farcitura)", "percent": 0},
    {"name": "Barrette di cioccolato fondente 55% (farcitura)", "percent": 0},
    {"name": "Miglioratore Naturale Pro (2% sul peso della farina)", "percent": 2},
    {"name": "Lievito di birra (Hefe)", "percent": 1},
  ],
  "notes": "Cornetto bicolore a DOPPIO GUSTO: pasta chiara e pasta verde al pistacchio puro, farcito con crema al pistacchio e una barretta di cioccolato fondente. Metodo indiretto con POOLISH (100% idratazione) + lievito madre. Il colore verde è dato dalla pasta di pistacchio, non da coloranti.",
  "notes_de": "Zweifarbiges Doppel-Hörnchen: heller Teig und grüner Pistazienteig, gefüllt mit Pistaziencreme und einer Zartbitter-Schokostange. Indirekt mit POOLISH (100% Hydratation) + Sauerteig. Grün nur durch reine Pistazienpaste.",
  "notes_en": "Two-tone double-flavour croissant: light dough and green pistachio dough, filled with pistachio cream and a dark chocolate baton. Indirect method with POOLISH (100% hydration) + sourdough. Green comes from pure pistachio paste, no dyes.",
  "procedure": (
    "1) POOLISH (indiretto): sciogli 0,3% di lievito in acqua pari al 30% della farina, aggiungi la stessa quantità di farina; matura 12-16 ore a 18°C.\n"
    "2) AUTOLISI: farina restante + acqua + uova, riposo 40 minuti.\n"
    "3) IMPASTO: unisci poolish e lievito madre rinfrescato, poi zucchero e Miglioratore Naturale Pro; incorda.\n"
    "4) COLORE NATURALE: dividi in due; in una metà lavora la pasta di pistacchio puro (verde), l'altra resta chiara.\n"
    "5) CELLA 16°C: pirla e matura 12-18 ore (o frigo 4-6°C).\n"
    "6) SFOGLIATURA: sovrapponi pasta chiara e verde, incassa il burro e dai 3 pieghe con riposo in frigo, mantenendo i due colori affiancati.\n"
    "7) FORMATURA E FARCIA: stendi a 3,5 mm, taglia triangoli, deponi crema al pistacchio e una barretta di cioccolato, arrotola.\n"
    "8) APPRETTO: 2,5-3 ore a 26°C.\n"
    "9) COTTURA: uovo e cuoci a 188°C per 18 minuti; a freddo, granella di pistacchio a lucido."
  ),
  "procedure_de": (
    "1) POOLISH: 0,3% Hefe in Wasser (30% des Mehls) lösen, gleiche Menge Mehl; 12-16 Std. bei 18°C.\n"
    "2) AUTOLYSE: restliches Mehl + Wasser + Eier, 40 Min.\n"
    "3) TEIG: Poolish und Sauerteig einarbeiten, Zucker und Backmittel; auskneten.\n"
    "4) NATÜRLICHE FARBE: halbieren; eine Hälfte mit reiner Pistazienpaste (grün).\n"
    "5) 16°C GÄRKAMMER: rundwirken, 12-18 Std. (oder Kühlschrank).\n"
    "6) TOURIEREN: hell und grün überlagern, Butter einschlagen, 3 Touren mit Kühlpausen.\n"
    "7) FORMEN & FÜLLEN: 3,5 mm, Dreiecke, Pistaziencreme + Schokostange, rollen.\n"
    "8) GARE: 2,5-3 Std. bei 26°C.\n"
    "9) BACKEN: Ei, 188°C 18 Min.; kalt mit Pistaziengrieß."
  ),
  "procedure_en": (
    "1) POOLISH (indirect): dissolve 0.3% yeast in water equal to 30% of the flour, add the same amount of flour; mature 12-16 h at 18°C.\n"
    "2) AUTOLYSE: remaining flour + water + eggs, rest 40 min.\n"
    "3) DOUGH: incorporate poolish and refreshed sourdough, then sugar and Natural Improver Pro; develop gluten.\n"
    "4) NATURAL COLOUR: divide in two; work pure pistachio paste (green) into one half.\n"
    "5) 16°C RETARD: round and mature 12-18 h (or fridge 4-6°C).\n"
    "6) LAMINATION: stack light and green doughs, encase butter, 3 folds with fridge rests keeping both colours side by side.\n"
    "7) SHAPE & FILL: sheet to 3.5 mm, cut triangles, add pistachio cream and a chocolate baton, roll.\n"
    "8) PROOF: 2.5-3 h at 26°C.\n"
    "9) BAKE: egg wash, 188°C for 18 min; when cool, finish with pistachio grains."
  ),
 },
 {
  "name": "Pane all'Nduja",
  "name_de": "Nduja-Brot",
  "name_en": "'Nduja Bread",
  "flour_type": "Farina tipo 1 W280",
  "flour_type_de": "Mehl Type 1 W280",
  "flour_type_en": "Type 1 flour W280",
  "hydration_percent": 75, "preferment_type": "biga", "method_type": "indiretto",
  "menu_category": "pane", "origin": "it", "bake_temp": 240, "bake_minutes": 40,
  "image_url": IMG["nduja"],
  "extra_ingredients": [
    {"name": "Nduja calabrese", "percent": 12},
    {"name": "Paprika dolce affumicata (colore naturale)", "percent": 1},
    {"name": "Olio d'oliva", "percent": 3},
    {"name": "Miglioratore Naturale Pro (2% sul peso della farina)", "percent": 2},
  ],
  "notes": "Pane rustico colorato NATURALMENTE di rosso-arancio dalla nduja calabrese e dalla paprika affumicata (nessun colorante). Metodo indiretto con BIGA (18 h a 18°C). La nduja si incorpora a fine impasto per lasciare venature piccanti nella mollica.",
  "notes_de": "Rustikales Brot, natürlich rot-orange durch kalabrische Nduja und geräuchertes Paprikapulver (keine Farbstoffe). Indirekt mit BIGA (18 Std. bei 18°C). Nduja am Ende einarbeiten für pikante Adern.",
  "notes_en": "Rustic bread naturally coloured red-orange by Calabrian 'nduja and smoked paprika (no dyes). Indirect method with BIGA (18 h at 18°C). The 'nduja is folded in at the end for spicy veins in the crumb.",
  "procedure": (
    "1) BIGA (indiretto): impasta 100% farina, 44% acqua e 1% lievito; matura 18 ore a 18°C.\n"
    "2) AUTOLISI: farina restante + acqua (lascia da parte l'acqua di bassinage), riposo 40 minuti.\n"
    "3) IMPASTO: unisci la biga e il lievito madre rinfrescato, poi paprika affumicata, olio e Miglioratore Naturale Pro; incorda e aggiungi l'acqua di bassinage a filo.\n"
    "4) NDUJA: a fine impasto, con una piega, incorpora la nduja a fiocchi per creare venature senza smontare l'impasto.\n"
    "5) PUNTATA: 1 ora a temperatura ambiente con 2 pieghe di rinforzo.\n"
    "6) CELLA 16°C: matura la massa 12-18 ore (o frigo 4-6°C) per sviluppare aroma e alveolatura.\n"
    "7) FORMATURA: forma le pagnotte e metti in appretto 2 ore in cestino infarinato.\n"
    "8) COTTURA: 240°C con vapore i primi 15 minuti, poi 220°C, totale ~40 minuti, crosta ben colorita."
  ),
  "procedure_de": (
    "1) BIGA: 100% Mehl, 44% Wasser, 1% Hefe; 18 Std. bei 18°C.\n"
    "2) AUTOLYSE: restliches Mehl + Wasser (Bassinage zurückhalten), 40 Min.\n"
    "3) TEIG: Biga und Sauerteig, dann Paprika, Öl, Backmittel; auskneten, Bassinage-Wasser einarbeiten.\n"
    "4) NDUJA: am Ende mit einer Faltung einarbeiten (Adern).\n"
    "5) STOCKGARE: 1 Std. Raumtemperatur, 2 Dehn-und-Faltungen.\n"
    "6) 16°C GÄRKAMMER: 12-18 Std. reifen (oder Kühlschrank).\n"
    "7) FORMEN: Laibe formen, 2 Std. Stückgare im bemehlten Gärkörbchen.\n"
    "8) BACKEN: 240°C mit Schwaden 15 Min., dann 220°C, gesamt ~40 Min."
  ),
  "procedure_en": (
    "1) BIGA (indirect): mix 100% flour, 44% water, 1% yeast; mature 18 h at 18°C.\n"
    "2) AUTOLYSE: remaining flour + water (hold back bassinage water), rest 40 min.\n"
    "3) DOUGH: incorporate biga and refreshed sourdough, then smoked paprika, oil and Natural Improver Pro; develop gluten and add bassinage water gradually.\n"
    "4) 'NDUJA: at the end, with one fold, incorporate the 'nduja in flakes for veins without deflating.\n"
    "5) BULK: 1 h at room temperature with 2 stretch-and-folds.\n"
    "6) 16°C RETARD: mature 12-18 h (or fridge 4-6°C) for aroma and open crumb.\n"
    "7) SHAPE: shape the loaves and proof 2 h in a floured banneton.\n"
    "8) BAKE: 240°C with steam for the first 15 min, then 220°C, ~40 min total, deep-coloured crust."
  ),
 },
 {
  "name": "Pane alla Barbabietola",
  "name_de": "Rote-Bete-Brot",
  "name_en": "Beetroot Bread",
  "flour_type": "Farina tipo 1 W280",
  "flour_type_de": "Mehl Type 1 W280",
  "flour_type_en": "Type 1 flour W280",
  "hydration_percent": 70, "preferment_type": "lm", "method_type": "indiretto",
  "menu_category": "pane", "origin": "it", "bake_temp": 235, "bake_minutes": 42,
  "image_url": IMG["barbabietola"],
  "extra_ingredients": [
    {"name": "Purea di barbabietola cotta (colore naturale)", "percent": 25},
    {"name": "Semi di girasole", "percent": 6},
    {"name": "Olio d'oliva", "percent": 3},
    {"name": "Miglioratore Naturale Pro (2% sul peso della farina)", "percent": 2},
  ],
  "notes": "Pane dal colore rosa-magenta NATURALE dato dalla purea di barbabietola (nessun colorante). Metodo indiretto con LIEVITO MADRE. La barbabietola porta acqua e zuccheri, quindi l'idratazione dell'acqua va ridotta. Colore più vivo se la mollica resta poco cotta al cuore.",
  "notes_de": "Brot mit natürlicher magenta-rosa Farbe durch Rote-Bete-Püree (keine Farbstoffe). Indirekt mit SAUERTEIG. Die Bete bringt Wasser und Zucker, daher Wasseranteil reduzieren.",
  "notes_en": "Bread with a natural magenta-pink colour from beetroot purée (no dyes). Indirect method with SOURDOUGH. Beetroot adds water and sugars, so reduce the added water. The colour stays brighter with a gently baked crumb.",
  "procedure": (
    "1) PREFERMENTO (indiretto): rinfresca il lievito madre e fallo maturare fino a raddoppio (4-6 ore a 26°C).\n"
    "2) AUTOLISI: mescola farina e purea di barbabietola con poca acqua, riposo 40 minuti (il colore si fissa).\n"
    "3) IMPASTO: unisci il lievito madre, poi Miglioratore Naturale Pro, olio e semi di girasole; incorda regolando l'acqua (la barbabietola ne apporta molta).\n"
    "4) PUNTATA: 1,5 ore a temperatura ambiente con 2 pieghe.\n"
    "5) CELLA 16°C: matura 14-18 ore per aroma e per fissare il colore (evita cotture troppo spinte che scuriscono il rosa).\n"
    "6) FORMATURA: forma le pagnotte e appretto 2-2,5 ore in cestino.\n"
    "7) COTTURA: 235°C con vapore i primi 15 minuti, poi 215°C, totale ~42 minuti; cottura non troppo scura per mantenere il colore."
  ),
  "procedure_de": (
    "1) VORTEIG: Sauerteig auffrischen, bis zur Verdopplung (4-6 Std. bei 26°C).\n"
    "2) AUTOLYSE: Mehl und Rote-Bete-Püree mit wenig Wasser mischen, 40 Min.\n"
    "3) TEIG: Sauerteig, dann Backmittel, Öl, Sonnenblumenkerne; Wasser anpassen (Bete bringt viel).\n"
    "4) STOCKGARE: 1,5 Std., 2 Faltungen.\n"
    "5) 16°C GÄRKAMMER: 14-18 Std. reifen (Farbe fixieren).\n"
    "6) FORMEN: Laibe, 2-2,5 Std. Stückgare.\n"
    "7) BACKEN: 235°C mit Schwaden 15 Min., dann 215°C, ~42 Min.; nicht zu dunkel."
  ),
  "procedure_en": (
    "1) PRE-FERMENT (indirect): refresh the sourdough and let it mature until doubled (4-6 h at 26°C).\n"
    "2) AUTOLYSE: mix flour and beetroot purée with a little water, rest 40 min (the colour sets).\n"
    "3) DOUGH: add the sourdough, then Natural Improver Pro, oil and sunflower seeds; develop gluten adjusting water (beetroot adds a lot).\n"
    "4) BULK: 1.5 h at room temperature with 2 folds.\n"
    "5) 16°C RETARD: mature 14-18 h for aroma and to fix the colour (avoid over-baking that darkens the pink).\n"
    "6) SHAPE: shape the loaves and proof 2-2.5 h in a banneton.\n"
    "7) BAKE: 235°C with steam for the first 15 min, then 215°C, ~42 min total; keep the bake light to preserve the colour."
  ),
 },
 {
  "name": "Panini Basilico e Pomodoro",
  "name_de": "Basilikum-Tomaten-Brötchen",
  "name_en": "Basil & Tomato Rolls",
  "flour_type": "Farina 00 W260",
  "flour_type_de": "Mehl 00 W260",
  "flour_type_en": "00 flour W260",
  "hydration_percent": 68, "preferment_type": "poolish", "method_type": "indiretto",
  "menu_category": "panini", "origin": "it", "bake_temp": 220, "bake_minutes": 16,
  "image_url": IMG["pomobasilico"],
  "extra_ingredients": [
    {"name": "Concentrato di pomodoro (per la pasta rossa)", "percent": 8},
    {"name": "Pesto/basilico tritato (per la pasta verde)", "percent": 6},
    {"name": "Olio d'oliva", "percent": 4},
    {"name": "Origano e sale", "percent": 1},
    {"name": "Miglioratore Naturale Pro (2% sul peso della farina)", "percent": 2},
  ],
  "notes": "Panini bicolore NATURALI: una parte di impasto colorata di rosso col concentrato di pomodoro, una parte verde col basilico/pesto (nessun colorante). Metodo indiretto con POOLISH. Le due paste si attorcigliano per l'effetto marmorizzato rosso-verde tricolore italiano.",
  "notes_de": "Zweifarbige Brötchen, natürlich: ein Teil rot mit Tomatenmark, ein Teil grün mit Basilikum/Pesto (keine Farbstoffe). Indirekt mit POOLISH. Beide Teige verdrehen für den marmorierten Effekt.",
  "notes_en": "Naturally two-tone rolls: part of the dough coloured red with tomato paste, part green with basil/pesto (no dyes). Indirect method with POOLISH. The two doughs are twisted for a red-green marbled effect.",
  "procedure": (
    "1) POOLISH (indiretto): 0,3% lievito + acqua (30% farina) + pari peso di farina; matura 12-16 ore a 18°C.\n"
    "2) AUTOLISI: farina restante + acqua, riposo 30 minuti.\n"
    "3) IMPASTO: unisci il poolish e il lievito madre rinfrescato, poi olio, origano, sale e Miglioratore Naturale Pro; incorda.\n"
    "4) DIVISIONE E COLORE NATURALE: dividi in due. In una metà lavora il concentrato di pomodoro (rossa), nell'altra il basilico/pesto tritato (verde).\n"
    "5) PUNTATA: 1 ora a temperatura ambiente, poi CELLA 16°C per 12-16 ore (o frigo).\n"
    "6) FORMATURA MARMORIZZATA: stendi le due paste in filoni, attorcigliali insieme e taglia i panini per mostrare le venature rosse e verdi.\n"
    "7) APPRETTO: 1,5-2 ore a 26°C.\n"
    "8) COTTURA: 220°C con vapore i primi 8 minuti, totale ~16 minuti."
  ),
  "procedure_de": (
    "1) POOLISH: 0,3% Hefe + Wasser (30% Mehl) + gleiches Gewicht Mehl; 12-16 Std. bei 18°C.\n"
    "2) AUTOLYSE: restliches Mehl + Wasser, 30 Min.\n"
    "3) TEIG: Poolish und Sauerteig, dann Öl, Oregano, Salz, Backmittel; auskneten.\n"
    "4) TEILEN & FÄRBEN: halbieren; eine Hälfte mit Tomatenmark (rot), die andere mit Basilikum/Pesto (grün).\n"
    "5) STOCKGARE: 1 Std. Raumtemperatur, dann 16°C 12-16 Std. (oder Kühlschrank).\n"
    "6) MARMORIEREN: beide Teige zu Strängen, verdrehen, Brötchen schneiden.\n"
    "7) GARE: 1,5-2 Std. bei 26°C.\n"
    "8) BACKEN: 220°C mit Schwaden 8 Min., gesamt ~16 Min."
  ),
  "procedure_en": (
    "1) POOLISH (indirect): 0.3% yeast + water (30% flour) + equal weight of flour; mature 12-16 h at 18°C.\n"
    "2) AUTOLYSE: remaining flour + water, rest 30 min.\n"
    "3) DOUGH: incorporate poolish and refreshed sourdough, then oil, oregano, salt and Natural Improver Pro; develop gluten.\n"
    "4) SPLIT & NATURAL COLOUR: divide in two. Work tomato paste into one half (red), chopped basil/pesto into the other (green).\n"
    "5) BULK: 1 h at room temperature, then 16°C retard for 12-16 h (or fridge).\n"
    "6) MARBLED SHAPING: roll both doughs into logs, twist them together and cut the rolls to show red and green veins.\n"
    "7) PROOF: 1.5-2 h at 26°C.\n"
    "8) BAKE: 220°C with steam for the first 8 min, ~16 min total."
  ),
 },
]

with open(SEED, "r", encoding="utf-8") as f:
    data = json.load(f)

names = {r["name"] for r in RECIPES}
data = [d for d in data if d.get("name") not in names]  # rimuovi eventuali versioni precedenti
for r in RECIPES:
    entry = dict(r)
    entry["id"] = str(uuid.uuid4())
    entry["collection_name"] = "mikilab"
    entry["created_at"] = now
    entry["updated_at"] = now
    # real_name = nome tecnico = uguale al nome
    entry.setdefault("real_name", r["name"])
    entry.setdefault("real_name_de", r["name_de"])
    entry.setdefault("real_name_en", r["name_en"])
    data.append(entry)

with open(SEED, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=1)

print("Ricette totali nel seed:", len(data))
print("Aggiunte:", ", ".join(names))
