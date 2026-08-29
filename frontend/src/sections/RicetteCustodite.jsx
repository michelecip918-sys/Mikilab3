import { useState, useMemo, useEffect } from "react";
import QRCode from "qrcode";
import { Landmark, Wheat, Share2, Printer, ChevronLeft, Scale, MapPin, Clock, Sparkles, ShieldCheck } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { triFR, triFA } from "@/i18n/triMaps";
import { toast } from "sonner";
import SectionHero from "@/components/SectionHero";
import MiglioratoreDetail from "@/components/MiglioratoreDetail";

// "Le Ricette Custodite" — pani del Sud d'Italia + Germania, con il metodo di Michele.
// Ogni ingrediente è in % sul peso della farina → "Adatta alle mie dosi" ricalcola tutto.
// Tutto è multilingua (it/de/en/es/fr) così anche in francese si legge in francese.

// ── Immagini ──────────────────────────────────────────────
const IMG = {
  matera: "https://images.unsplash.com/photo-1590301157172-7ba48dd1c2b2?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
  altamura: "https://images.unsplash.com/photo-1549413468-cd78edb7e75c?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
  rustic1: "https://images.unsplash.com/photo-1598616068594-93ef7202a8ca?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
  rustic2: "https://images.unsplash.com/photo-1613396874083-2d5fbe59ae79?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
  rustic3: "https://images.unsplash.com/photo-1559811814-e2c57b5e69df?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
  baguette: "https://images.unsplash.com/photo-1559811814-e2c57b5e69df?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
  foc1: "https://images.unsplash.com/photo-1784822109223-20ceba260902?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
  foc2: "https://images.unsplash.com/photo-1744988278657-5c1674813ade?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
  foc3: "https://images.unsplash.com/photo-1767065888111-7ca2b12d4944?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
  foc4: "https://images.unsplash.com/photo-1765172526530-916823d3efc9?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
  panettone: "https://images.unsplash.com/photo-1567270744868-0ceaaa42021f?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
  panettone2: "https://images.unsplash.com/photo-1606589121362-2de49373c497?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
  col1: "https://images.unsplash.com/photo-1712723247649-35dda2670f1c?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
  col2: "https://images.unsplash.com/photo-1712723246709-3d6d3fdbf4aa?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
  col3: "https://images.unsplash.com/photo-1668253738427-a72dda5b257b?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
  col4: "https://images.unsplash.com/photo-1712723246850-64d8c05dd46d?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
  ger1: "https://images.unsplash.com/photo-1509957879660-dd8846a0b43d?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
  ger2: "https://images.unsplash.com/photo-1629320119721-5a2aa9ce9dbf?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
  ger3: "https://images.unsplash.com/photo-1623725151449-dd0bd5aa213d?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
  ger4: "https://images.unsplash.com/photo-1678646142939-31a5a9e91f91?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
};

// ── Ingredienti condivisi (multilingua) ──────────────────────
const ING = {
  semola: { it: "Semola rimacinata di grano duro", de: "Hartweizengrieß (fein)", en: "Fine durum semolina", es: "Sémola remolida de trigo duro", fr: "Semoule de blé dur remoulue" },
  farina0: { it: "Farina 0 (media forza)", de: "Mehl Typ 550", en: "Bread flour", es: "Harina de fuerza media", fr: "Farine T65" },
  farinaForte: { it: "Farina forte W380", de: "Starkes Mehl W380", en: "Strong flour W380", es: "Harina de fuerza W380", fr: "Farine de force W380" },
  acqua: { it: "Acqua", de: "Wasser", en: "Water", es: "Agua", fr: "Eau" },
  lm: { it: "Lievito Madre (rinfrescato)", de: "Sauerteig (aufgefrischt)", en: "Sourdough (refreshed)", es: "Masa madre (refrescada)", fr: "Levain (rafraîchi)" },
  biga: { it: "Biga (18h)", de: "Biga (18h)", en: "Biga (18h)", es: "Biga (18h)", fr: "Biga (18h)" },
  poolish: { it: "Poolish (12h)", de: "Poolish (12h)", en: "Poolish (12h)", es: "Poolish (12h)", fr: "Poolish (12h)" },
  migl: { it: "Miglioratore Naturale MikiLab", de: "Natürlicher MikiLab-Verbesserer", en: "MikiLab Natural Improver", es: "Mejorador Natural MikiLab", fr: "Améliorant Naturel MikiLab" },
  sale: { it: "Sale", de: "Salz", en: "Salt", es: "Sal", fr: "Sel" },
  olio: { it: "Olio extravergine", de: "Olivenöl", en: "Olive oil", es: "Aceite de oliva", fr: "Huile d'olive" },
  burro: { it: "Burro", de: "Butter", en: "Butter", es: "Mantequilla", fr: "Beurre" },
  zucchero: { it: "Zucchero", de: "Zucker", en: "Sugar", es: "Azúcar", fr: "Sucre" },
  tuorli: { it: "Tuorli", de: "Eigelb", en: "Egg yolks", es: "Yemas", fr: "Jaunes d'œuf" },
  malto: { it: "Malto d'orzo", de: "Gerstenmalz", en: "Barley malt", es: "Malta de cebada", fr: "Malt d'orge" },
  latte: { it: "Latte", de: "Milch", en: "Milk", es: "Leche", fr: "Lait" },
  segale: { it: "Farina di segale", de: "Roggenmehl", en: "Rye flour", es: "Harina de centeno", fr: "Farine de seigle" },
  integrale: { it: "Farina integrale", de: "Vollkornmehl", en: "Wholemeal flour", es: "Harina integral", fr: "Farine complète" },
  vino: { it: "Vino bianco", de: "Weißwein", en: "White wine", es: "Vino blanco", fr: "Vin blanc" },
  finocchio: { it: "Semi di finocchio", de: "Fenchelsamen", en: "Fennel seeds", es: "Semillas de hinojo", fr: "Graines de fenouil" },
  patata: { it: "Patata lessa schiacciata", de: "Gekochte Kartoffel", en: "Boiled mashed potato", es: "Patata cocida", fr: "Pomme de terre écrasée" },
  cruschi: { it: "Peperoni cruschi di Senise", de: "Cruschi-Paprika (Senise)", en: "Crispy Senise peppers", es: "Pimientos cruschi de Senise", fr: "Piments cruschi de Senise" },
  uvetta: { it: "Uvetta e canditi", de: "Rosinen & Zitronat", en: "Raisins & candied peel", es: "Pasas y frutas confitadas", fr: "Raisins secs & fruits confits" },
  cioccolato: { it: "Gocce di cioccolato", de: "Schokostückchen", en: "Chocolate chips", es: "Gotas de chocolate", fr: "Pépites de chocolat" },
  purea: { it: "Purea colorante (barbabietola/curcuma/spinaci)", de: "Färbepüree (Rote Bete/Kurkuma/Spinat)", en: "Colour purée (beet/turmeric/spinach)", es: "Puré colorante (remolacha/cúrcuma/espinaca)", fr: "Purée colorante (betterave/curcuma/épinard)" },
  carbone: { it: "Carbone vegetale", de: "Aktivkohle", en: "Vegetable charcoal", es: "Carbón vegetal", fr: "Charbon végétal" },
  zucca: { it: "Purea di zucca", de: "Kürbispüree", en: "Pumpkin purée", es: "Puré de calabaza", fr: "Purée de potiron" },
  salumi: { it: "Farciture (salumi/formaggi)", de: "Belag (Wurst/Käse)", en: "Fillings (cold cuts/cheese)", es: "Rellenos (embutidos/quesos)", fr: "Garnitures (charcuterie/fromage)" },
  cumino: { it: "Semi di cumino", de: "Kümmel", en: "Caraway seeds", es: "Comino", fr: "Graines de carvi" },
  bicarbonato: { it: "Bagno di bicarbonato/soda", de: "Natron-Lauge", en: "Baking soda bath", es: "Baño de bicarbonato", fr: "Bain de bicarbonate" },
};

const g = (n, pct) => ({ n, pct });

// ── Categorie / filtri ───────────────────────────────────────
const CATS = [
  { id: "all", label: { it: "Tutte", de: "Alle", en: "All", es: "Todas", fr: "Toutes" } },
  { id: "basilicata", label: { it: "Basilicata", de: "Basilikata", en: "Basilicata", es: "Basilicata", fr: "Basilicate" } },
  { id: "puglia", label: { it: "Puglia", de: "Apulien", en: "Apulia", es: "Apulia", fr: "Pouilles" } },
  { id: "lievitati", label: { it: "Grandi Lievitati", de: "Große Hefeteige", en: "Great Leavened", es: "Grandes Levados", fr: "Grands Levés" } },
  { id: "colorati", label: { it: "Pani Colorati", de: "Bunte Brote", en: "Coloured Breads", es: "Panes de Colores", fr: "Pains Colorés" } },
  { id: "germania", label: { it: "Germania", de: "Deutschland", en: "Germany", es: "Alemania", fr: "Allemagne" } },
];

const PLACE = {
  basilicata: { it: "Basilicata", de: "Basilikata", en: "Basilicata", es: "Basilicata", fr: "Basilicate" },
  matera: { it: "Matera, Basilicata", de: "Matera, Basilikata", en: "Matera, Basilicata", es: "Matera, Basilicata", fr: "Matera, Basilicate" },
  puglia: { it: "Puglia", de: "Apulien", en: "Apulia", es: "Apulia", fr: "Pouilles" },
  altamura: { it: "Altamura, Puglia", de: "Altamura, Apulien", en: "Altamura, Apulia", es: "Altamura, Apulia", fr: "Altamura, Pouilles" },
  bari: { it: "Bari, Puglia", de: "Bari, Apulien", en: "Bari, Apulia", es: "Bari, Apulia", fr: "Bari, Pouilles" },
  salento: { it: "Salento, Puglia", de: "Salento, Apulien", en: "Salento, Apulia", es: "Salento, Apulia", fr: "Salento, Pouilles" },
  lievitati: { it: "Grandi Lievitati", de: "Große Hefeteige", en: "Great Leavened", es: "Grandes Levados", fr: "Grands Levés" },
  speciali: { it: "Pani Speciali · Innovazione", de: "Spezialbrote · Innovation", en: "Special Breads · Innovation", es: "Panes Especiales · Innovación", fr: "Pains Spéciaux · Innovation" },
  germania: { it: "Germania · MikiLab", de: "Deutschland · MikiLab", en: "Germany · MikiLab", es: "Alemania · MikiLab", fr: "Allemagne · MikiLab" },
};

// ── Le ricette ───────────────────────────────────────────────
const RECIPES = [
  // ═══════════ BASILICATA ═══════════
  {
    id: "matera", region: "basilicata", flag: "🇮🇹", img: IMG.matera, place: PLACE.matera,
    name: { it: "Pane di Matera IGP", de: "Materaner Brot", en: "Bread of Matera", es: "Pan de Matera", fr: "Pain de Matera" },
    story: {
      it: "Forma a cornetto, mollica gialla e alveolata di semola. Custodito da secoli, con Lievito Madre e il mio Miglioratore Naturale.",
      de: "Hörnchenform, gelbe Krume aus Grieß. Seit Jahrhunderten, mit Sauerteig und meinem Verbesserer.",
      en: "Croissant shape, yellow open crumb of semolina. Sourdough and my Natural Improver.",
      es: "Forma de cuerno, miga amarilla de sémola. Con masa madre y mi Mejorador Natural.",
      fr: "Forme de croissant, mie jaune de semoule. Levain et mon Améliorant Naturel.",
    },
    ing: [g(ING.semola, 100), g(ING.acqua, 78), g(ING.lm, 25), g(ING.migl, 2), g(ING.sale, 2.2), g(ING.malto, 0.5)],
    proc: {
      it: "1. Rinfresca il Lievito Madre.\n2. Autolisi semola+acqua 30 min.\n3. Impasta con LM, poi Miglioratore Naturale MikiLab e sale — senza di lui la mollica non tiene.\n4. Puntata 2-3 h a 26°C.\n5. Forma a cornetto, appretto 1 h.\n6. Cottura 250°C con vapore, poi 210°C per 55-60 min.",
      de: "1. Sauerteig auffrischen.\n2. Autolyse 30 Min.\n3. Kneten, dann MikiLab-Verbesserer und Salz — ohne ihn hält die Krume nicht.\n4. Stockgare 2-3 h bei 26°C.\n5. Hörnchen formen, 1 h.\n6. 250°C mit Dampf, dann 210°C 55-60 Min.",
      en: "1. Refresh sourdough.\n2. Autolyse 30 min.\n3. Mix, then MikiLab Natural Improver and salt — without it the crumb won't hold.\n4. Bulk 2-3 h at 26°C.\n5. Shape horn, 1 h.\n6. Bake 250°C steam, then 210°C 55-60 min.",
      es: "1. Refresca la masa madre.\n2. Autólisis 30 min.\n3. Amasa, luego Mejorador Natural MikiLab y sal — sin él la miga no aguanta.\n4. Fermenta 2-3 h a 26°C.\n5. Forma cuerno, 1 h.\n6. Hornea 250°C vapor, luego 210°C 55-60 min.",
      fr: "1. Rafraîchis le levain.\n2. Autolyse 30 min.\n3. Pétris, puis l'Améliorant Naturel MikiLab et le sel — sans lui la mie ne tient pas.\n4. Pointage 2-3 h à 26°C.\n5. Forme le croissant, 1 h.\n6. Cuisson 250°C vapeur, puis 210°C 55-60 min.",
    },
  },
  {
    id: "pane_basilicata", region: "basilicata", flag: "🇮🇹", img: IMG.rustic1, place: PLACE.basilicata,
    name: { it: "Pane Lucano di Grano Duro", de: "Lukanisches Hartweizenbrot", en: "Lucanian Durum Bread", es: "Pan Lucano de Trigo Duro", fr: "Pain Lucanien au Blé Dur" },
    story: {
      it: "Rustico lucano con Biga e Lievito Madre: crosta scura, lunga conservazione. Il Miglioratore Naturale è la mia firma.",
      de: "Rustikal mit Biga und Sauerteig: dunkle Kruste, lange haltbar. Der natürliche Verbesserer ist meine Handschrift.",
      en: "Rustic with Biga and sourdough: dark crust, keeps for days. The Natural Improver is my signature.",
      es: "Rústico con Biga y masa madre: corteza oscura, larga conservación. El Mejorador Natural es mi firma.",
      fr: "Rustique avec Biga et levain : croûte foncée, longue conservation. L'Améliorant Naturel est ma signature.",
    },
    ing: [g(ING.semola, 100), g(ING.acqua, 72), g(ING.biga, 40), g(ING.lm, 20), g(ING.migl, 2), g(ING.sale, 2.2)],
    proc: {
      it: "1. Prepara la Biga 18h.\n2. Autolisi 40 min.\n3. Impasta con Biga, LM, Miglioratore Naturale MikiLab e sale.\n4. Puntata 3 h con 2 pieghe.\n5. Forma, appretto 1,5 h.\n6. Cuoci 250°C vapore, poi 210°C 60 min.",
      de: "1. Biga 18h.\n2. Autolyse 40 Min.\n3. Kneten mit Biga, Sauerteig, MikiLab-Verbesserer, Salz.\n4. Stockgare 3 h, 2 Faltungen.\n5. Formen, 1,5 h.\n6. 250°C Dampf, dann 210°C 60 Min.",
      en: "1. Biga 18h.\n2. Autolyse 40 min.\n3. Mix with Biga, sourdough, MikiLab Natural Improver, salt.\n4. Bulk 3 h, 2 folds.\n5. Shape, 1.5 h.\n6. Bake 250°C steam, then 210°C 60 min.",
      es: "1. Biga 18h.\n2. Autólisis 40 min.\n3. Amasa con Biga, masa madre, Mejorador MikiLab, sal.\n4. Fermenta 3 h, 2 pliegues.\n5. Forma, 1,5 h.\n6. Hornea 250°C vapor, luego 210°C 60 min.",
      fr: "1. Biga 18h.\n2. Autolyse 40 min.\n3. Pétris avec Biga, levain, Améliorant MikiLab, sel.\n4. Pointage 3 h, 2 rabats.\n5. Façonne, 1,5 h.\n6. Cuisson 250°C vapeur, puis 210°C 60 min.",
    },
  },
  {
    id: "focaccia_lucana", region: "basilicata", flag: "🇮🇹", img: IMG.foc2, place: PLACE.basilicata,
    name: { it: "Focaccia Lucana ai Peperoni Cruschi", de: "Lukanische Focaccia mit Cruschi", en: "Lucanian Focaccia with Cruschi", es: "Focaccia Lucana con Cruschi", fr: "Focaccia Lucanienne aux Cruschi" },
    story: {
      it: "Soffice, con Poolish e i famosi peperoni cruschi di Senise croccanti in superficie.",
      de: "Weich, mit Poolish und knusprigen Senise-Paprika.",
      en: "Soft, with Poolish and crispy Senise peppers on top.",
      es: "Blanda, con Poolish y crujientes pimientos de Senise.",
      fr: "Moelleuse, avec Poolish et piments croustillants de Senise.",
    },
    ing: [g(ING.farina0, 70), g(ING.semola, 30), g(ING.acqua, 78), g(ING.poolish, 40), g(ING.migl, 2), g(ING.olio, 5), g(ING.sale, 2.2), g(ING.cruschi, 8)],
    proc: {
      it: "1. Poolish 12h.\n2. Impasta con Miglioratore Naturale MikiLab, puntata 2 h.\n3. Stendi in teglia oliata, fossette.\n4. Peperoni cruschi, olio, sale.\n5. Appretto 45 min.\n6. Cuoci 230°C 22 min.",
      de: "1. Poolish 12h.\n2. Kneten mit MikiLab-Verbesserer, 2 h Gare.\n3. In geölte Form ziehen, Mulden.\n4. Cruschi-Paprika, Öl, Salz.\n5. 45 Min.\n6. 230°C 22 Min.",
      en: "1. Poolish 12h.\n2. Mix with MikiLab Improver, bulk 2 h.\n3. Spread in oiled pan, dimple.\n4. Cruschi peppers, oil, salt.\n5. Proof 45 min.\n6. Bake 230°C 22 min.",
      es: "1. Poolish 12h.\n2. Amasa con Mejorador MikiLab, 2 h.\n3. Extiende en molde aceitado, hoyuelos.\n4. Pimientos cruschi, aceite, sal.\n5. 45 min.\n6. Hornea 230°C 22 min.",
      fr: "1. Poolish 12h.\n2. Pétris avec l'Améliorant MikiLab, pointage 2 h.\n3. Étale en plaque huilée, fais des creux.\n4. Piments cruschi, huile, sel.\n5. Apprêt 45 min.\n6. Cuisson 230°C 22 min.",
    },
  },
  {
    id: "pane_patate_lucano", region: "basilicata", flag: "🇮🇹", img: IMG.rustic2, place: PLACE.basilicata,
    name: { it: "Pane di Patate Lucano", de: "Lukanisches Kartoffelbrot", en: "Lucanian Potato Bread", es: "Pan de Patata Lucano", fr: "Pain de Pommes de Terre Lucanien" },
    story: {
      it: "Morbidissimo grazie alla patata, con Biga e Lievito Madre. Umido per giorni, il Miglioratore fa la differenza.",
      de: "Sehr weich dank Kartoffel, mit Biga und Sauerteig. Der Verbesserer macht den Unterschied.",
      en: "Very soft thanks to potato, with Biga and sourdough. The Improver makes the difference.",
      es: "Muy blando por la patata, con Biga y masa madre. El Mejorador marca la diferencia.",
      fr: "Très moelleux grâce à la pomme de terre, avec Biga et levain. L'Améliorant fait la différence.",
    },
    ing: [g(ING.farina0, 100), g(ING.acqua, 55), g(ING.patata, 25), g(ING.biga, 30), g(ING.lm, 15), g(ING.migl, 2), g(ING.olio, 4), g(ING.sale, 2)],
    proc: {
      it: "1. Lessa e schiaccia la patata.\n2. Impasta farina, acqua, patata, Biga, LM.\n3. Aggiungi Miglioratore Naturale MikiLab, olio e sale — senza di lui non resta soffice.\n4. Puntata 2 h.\n5. Forma, appretto 1 h.\n6. Cuoci 220°C 40 min.",
      de: "1. Kartoffel kochen, zerdrücken.\n2. Mehl, Wasser, Kartoffel, Biga, Sauerteig kneten.\n3. MikiLab-Verbesserer, Öl, Salz zugeben.\n4. 2 h Gare.\n5. Formen, 1 h.\n6. 220°C 40 Min.",
      en: "1. Boil and mash potato.\n2. Mix flour, water, potato, Biga, sourdough.\n3. Add MikiLab Improver, oil, salt — without it it won't stay soft.\n4. Bulk 2 h.\n5. Shape, 1 h.\n6. Bake 220°C 40 min.",
      es: "1. Cuece y tritura la patata.\n2. Amasa harina, agua, patata, Biga, masa madre.\n3. Añade Mejorador MikiLab, aceite, sal.\n4. 2 h.\n5. Forma, 1 h.\n6. Hornea 220°C 40 min.",
      fr: "1. Cuis et écrase la pomme de terre.\n2. Pétris farine, eau, pomme de terre, Biga, levain.\n3. Ajoute l'Améliorant MikiLab, l'huile, le sel — sans lui il ne reste pas moelleux.\n4. Pointage 2 h.\n5. Façonne, 1 h.\n6. Cuisson 220°C 40 min.",
    },
  },
  {
    id: "pane_cafone_lucano", region: "basilicata", flag: "🇮🇹", img: IMG.rustic3, place: PLACE.basilicata,
    name: { it: "Pane Cafone Lucano", de: "Lukanisches Bauernbrot", en: "Lucanian Country Bread", es: "Pan de Pueblo Lucano", fr: "Pain de Campagne Lucanien" },
    story: {
      it: "Pane contadino a lunga lievitazione con solo Lievito Madre. Crosta croccante, cuore acidulo e Miglioratore MikiLab.",
      de: "Bäuerliches Brot, lange Gare, nur Sauerteig. Knusprige Kruste, MikiLab-Verbesserer.",
      en: "Long-fermented country bread, sourdough only. Crunchy crust, MikiLab Improver.",
      es: "Pan campesino de larga fermentación, solo masa madre. Corteza crujiente, Mejorador MikiLab.",
      fr: "Pain paysan longue fermentation, levain seul. Croûte croustillante, Améliorant MikiLab.",
    },
    ing: [g(ING.farina0, 70), g(ING.semola, 30), g(ING.acqua, 75), g(ING.lm, 30), g(ING.migl, 2), g(ING.sale, 2.2)],
    proc: {
      it: "1. Rinfresca il Lievito Madre.\n2. Autolisi 1 h.\n3. Impasta con LM, Miglioratore Naturale MikiLab e sale.\n4. Puntata 4 h con 3 pieghe.\n5. Frigo 12 h.\n6. Forma e cuoci 250°C vapore, poi 220°C 55 min.",
      de: "1. Sauerteig auffrischen.\n2. Autolyse 1 h.\n3. Kneten mit Sauerteig, MikiLab-Verbesserer, Salz.\n4. Stockgare 4 h, 3 Faltungen.\n5. Kühlschrank 12 h.\n6. Formen, 250°C Dampf, dann 220°C 55 Min.",
      en: "1. Refresh sourdough.\n2. Autolyse 1 h.\n3. Mix with sourdough, MikiLab Improver, salt.\n4. Bulk 4 h, 3 folds.\n5. Fridge 12 h.\n6. Shape, bake 250°C steam, then 220°C 55 min.",
      es: "1. Refresca la masa madre.\n2. Autólisis 1 h.\n3. Amasa con masa madre, Mejorador MikiLab, sal.\n4. Fermenta 4 h, 3 pliegues.\n5. Nevera 12 h.\n6. Forma, hornea 250°C vapor, luego 220°C 55 min.",
      fr: "1. Rafraîchis le levain.\n2. Autolyse 1 h.\n3. Pétris avec levain, Améliorant MikiLab, sel.\n4. Pointage 4 h, 3 rabats.\n5. Frigo 12 h.\n6. Façonne, cuisson 250°C vapeur, puis 220°C 55 min.",
    },
  },

  // ═══════════ PUGLIA ═══════════
  {
    id: "altamura", region: "puglia", flag: "🇮🇹", img: IMG.altamura, place: PLACE.altamura,
    name: { it: "Pane di Altamura DOP", de: "Altamura-Brot DOP", en: "Altamura Bread DOP", es: "Pan de Altamura DOP", fr: "Pain d'Altamura DOP" },
    story: {
      it: "L'unico pane DOP d'Europa. Crosta spessa, si conserva per giorni, semola delle Murge e Miglioratore MikiLab.",
      de: "Das einzige DOP-Brot Europas. Dicke Kruste, hält tagelang.",
      en: "The only DOP bread in Europe. Thick crust, keeps for days.",
      es: "El único pan DOP de Europa. Corteza gruesa, dura días.",
      fr: "Le seul pain DOP d'Europe. Croûte épaisse, se conserve des jours.",
    },
    ing: [g(ING.semola, 100), g(ING.acqua, 62), g(ING.lm, 20), g(ING.migl, 1.5), g(ING.sale, 2)],
    proc: {
      it: "1. Rinfresca il Lievito Madre.\n2. Impasta semola, acqua, LM; aggiungi Miglioratore Naturale MikiLab e sale.\n3. Puntata 1 h.\n4. Forma a filone, appretto 1 h.\n5. Capovolgi prima di infornare (forma tradizionale).\n6. Cottura 250°C vapore, poi 220°C 60-70 min.",
      de: "1. Sauerteig auffrischen.\n2. Kneten, MikiLab-Verbesserer und Salz zugeben.\n3. 1 h Gare.\n4. Formen, 1 h.\n5. Vor dem Backen wenden.\n6. 250°C Dampf, dann 220°C 60-70 Min.",
      en: "1. Refresh sourdough.\n2. Mix, add MikiLab Improver and salt.\n3. Bulk 1 h.\n4. Shape loaf, 1 h.\n5. Flip before baking (traditional shape).\n6. Bake 250°C steam, then 220°C 60-70 min.",
      es: "1. Refresca la masa madre.\n2. Amasa, añade Mejorador MikiLab y sal.\n3. Fermenta 1 h.\n4. Forma, 1 h.\n5. Voltea antes de hornear.\n6. Hornea 250°C vapor, luego 220°C 60-70 min.",
      fr: "1. Rafraîchis le levain.\n2. Pétris, ajoute l'Améliorant MikiLab et le sel.\n3. Pointage 1 h.\n4. Façonne, 1 h.\n5. Retourne avant d'enfourner (forme traditionnelle).\n6. Cuisson 250°C vapeur, puis 220°C 60-70 min.",
    },
  },
  {
    id: "focaccia_barese", region: "puglia", flag: "🇮🇹", img: IMG.foc1, place: PLACE.bari,
    name: { it: "Focaccia Barese", de: "Focaccia aus Bari", en: "Bari Focaccia", es: "Focaccia de Bari", fr: "Focaccia de Bari" },
    story: {
      it: "Soffice e alta, con pomodorini e olive. La patata e il Miglioratore MikiLab la tengono umida per giorni.",
      de: "Weich und hoch, mit Tomaten und Oliven. Kartoffel und Verbesserer halten sie saftig.",
      en: "Soft and tall, with cherry tomatoes and olives. Potato and Improver keep it moist.",
      es: "Blanda y alta, con tomates y aceitunas. La patata y el Mejorador la mantienen húmeda.",
      fr: "Moelleuse et haute, tomates et olives. Pomme de terre et Améliorant la gardent humide.",
    },
    ing: [g(ING.farina0, 70), g(ING.semola, 30), g(ING.acqua, 80), g(ING.patata, 20), g(ING.poolish, 30), g(ING.migl, 2), g(ING.olio, 6), g(ING.sale, 2.2)],
    proc: {
      it: "1. Poolish 12h + patata lessa.\n2. Impasta con Miglioratore Naturale MikiLab; poi olio e sale.\n3. Puntata 2 h a 26°C.\n4. Stendi in teglia oliata, fossette.\n5. Pomodorini, olive, origano, olio, sale grosso.\n6. Appretto 45 min.\n7. Cuoci 230°C 25-30 min.",
      de: "1. Poolish 12h + Kartoffel.\n2. Kneten mit MikiLab-Verbesserer; Öl, Salz.\n3. 2 h bei 26°C.\n4. In geölte Form, Mulden.\n5. Tomaten, Oliven, Oregano, Öl, Salz.\n6. 45 Min.\n7. 230°C 25-30 Min.",
      en: "1. Poolish 12h + potato.\n2. Mix with MikiLab Improver; oil, salt.\n3. Bulk 2 h at 26°C.\n4. Spread in oiled pan, dimple.\n5. Tomatoes, olives, oregano, oil, coarse salt.\n6. Proof 45 min.\n7. Bake 230°C 25-30 min.",
      es: "1. Poolish 12h + patata.\n2. Amasa con Mejorador MikiLab; aceite, sal.\n3. 2 h a 26°C.\n4. Extiende en molde, hoyuelos.\n5. Tomates, aceitunas, orégano, aceite, sal.\n6. 45 min.\n7. Hornea 230°C 25-30 min.",
      fr: "1. Poolish 12h + pomme de terre.\n2. Pétris avec l'Améliorant MikiLab ; huile, sel.\n3. Pointage 2 h à 26°C.\n4. Étale en plaque huilée, fais des creux.\n5. Tomates, olives, origan, huile, gros sel.\n6. Apprêt 45 min.\n7. Cuisson 230°C 25-30 min.",
    },
  },
  {
    id: "taralli", region: "puglia", flag: "🇮🇹", img: IMG.rustic3, place: PLACE.puglia,
    name: { it: "Taralli Pugliesi", de: "Apulische Taralli", en: "Apulian Taralli", es: "Taralli de Apulia", fr: "Taralli des Pouilles" },
    story: {
      it: "Croccanti, sbollentati e poi cotti: il metodo del Sud. Con Poolish, semi di finocchio e Miglioratore MikiLab.",
      de: "Knusprig, blanchiert und gebacken. Mit Poolish, Fenchel und Verbesserer.",
      en: "Crunchy, boiled then baked. With Poolish, fennel and Improver.",
      es: "Crujientes, escaldados y horneados. Con Poolish, hinojo y Mejorador.",
      fr: "Croustillants, pochés puis cuits. Avec Poolish, fenouil et Améliorant.",
    },
    ing: [g(ING.farina0, 100), g(ING.poolish, 20), g(ING.vino, 30), g(ING.olio, 25), g(ING.migl, 2), g(ING.sale, 2), g(ING.finocchio, 1.5)],
    proc: {
      it: "1. Impasta con Poolish, vino, olio, Miglioratore Naturale MikiLab e finocchio.\n2. Riposo 30 min.\n3. Forma cordoncini e chiudi ad anello.\n4. Sbollenta finché salgono a galla.\n5. Asciuga.\n6. Cuoci 180°C 25-30 min.",
      de: "1. Kneten mit Poolish, Wein, Öl, MikiLab-Verbesserer, Fenchel.\n2. 30 Min Ruhe.\n3. Ringe formen.\n4. Blanchieren.\n5. Trocknen.\n6. 180°C 25-30 Min.",
      en: "1. Mix with Poolish, wine, oil, MikiLab Improver, fennel.\n2. Rest 30 min.\n3. Shape rings.\n4. Boil until they float.\n5. Dry.\n6. Bake 180°C 25-30 min.",
      es: "1. Amasa con Poolish, vino, aceite, Mejorador MikiLab, hinojo.\n2. 30 min.\n3. Forma anillos.\n4. Escalda.\n5. Seca.\n6. Hornea 180°C 25-30 min.",
      fr: "1. Pétris avec Poolish, vin, huile, Améliorant MikiLab, fenouil.\n2. Repos 30 min.\n3. Forme des anneaux.\n4. Poche jusqu'à ce qu'ils remontent.\n5. Sèche.\n6. Cuisson 180°C 25-30 min.",
    },
  },
  {
    id: "friselle", region: "puglia", flag: "🇮🇹", img: IMG.rustic1, place: PLACE.puglia,
    name: { it: "Friselle Pugliesi", de: "Apulische Friselle", en: "Apulian Friselle", es: "Friselle de Apulia", fr: "Friselle des Pouilles" },
    story: {
      it: "Ciambelle biscottate due volte, da bagnare e condire. Con Biga e Miglioratore MikiLab restano fragranti a lungo.",
      de: "Zweimal gebackene Ringe zum Einweichen. Mit Biga und Verbesserer lange knusprig.",
      en: "Twice-baked rings to soak and dress. Biga and Improver keep them crisp.",
      es: "Anillos horneados dos veces para remojar. Biga y Mejorador los mantienen crujientes.",
      fr: "Anneaux cuits deux fois à tremper. Biga et Améliorant les gardent croustillants.",
    },
    ing: [g(ING.semola, 60), g(ING.integrale, 40), g(ING.acqua, 60), g(ING.biga, 30), g(ING.migl, 2), g(ING.olio, 4), g(ING.sale, 2)],
    proc: {
      it: "1. Biga 18h.\n2. Impasta con Miglioratore Naturale MikiLab, olio e sale.\n3. Puntata 2 h.\n4. Forma ciambelle, appretto 1 h.\n5. Cuoci 220°C 25 min.\n6. Taglia a metà e biscotta a 150°C 20 min.",
      de: "1. Biga 18h.\n2. Kneten mit MikiLab-Verbesserer, Öl, Salz.\n3. 2 h.\n4. Ringe formen, 1 h.\n5. 220°C 25 Min.\n6. Halbieren, 150°C 20 Min rösten.",
      en: "1. Biga 18h.\n2. Mix with MikiLab Improver, oil, salt.\n3. Bulk 2 h.\n4. Shape rings, 1 h.\n5. Bake 220°C 25 min.\n6. Halve and re-bake 150°C 20 min.",
      es: "1. Biga 18h.\n2. Amasa con Mejorador MikiLab, aceite, sal.\n3. 2 h.\n4. Forma anillos, 1 h.\n5. Hornea 220°C 25 min.\n6. Corta y tuesta 150°C 20 min.",
      fr: "1. Biga 18h.\n2. Pétris avec l'Améliorant MikiLab, huile, sel.\n3. Pointage 2 h.\n4. Forme des anneaux, 1 h.\n5. Cuisson 220°C 25 min.\n6. Coupe en deux, biscotte 150°C 20 min.",
    },
  },
  {
    id: "puccia", region: "puglia", flag: "🇮🇹", img: IMG.rustic2, place: PLACE.salento,
    name: { it: "Puccia Salentina", de: "Puccia aus dem Salento", en: "Salento Puccia", es: "Puccia del Salento", fr: "Puccia du Salento" },
    story: {
      it: "Panino tondo e vuoto dentro, perfetto da farcire. Lievito Madre e Miglioratore MikiLab per una mollica leggera.",
      de: "Rundes, hohles Brötchen zum Füllen. Sauerteig und Verbesserer für leichte Krume.",
      en: "Round hollow bun, perfect to fill. Sourdough and Improver for a light crumb.",
      es: "Panecillo redondo y hueco para rellenar. Masa madre y Mejorador.",
      fr: "Petit pain rond et creux à garnir. Levain et Améliorant pour une mie légère.",
    },
    ing: [g(ING.farina0, 100), g(ING.acqua, 68), g(ING.lm, 20), g(ING.migl, 2), g(ING.olio, 4), g(ING.sale, 2)],
    proc: {
      it: "1. Rinfresca il Lievito Madre.\n2. Impasta con Miglioratore Naturale MikiLab, olio e sale.\n3. Puntata 2 h.\n4. Spezza in palline, appretto 1 h.\n5. Cuoci a 250°C 12-14 min (si gonfiano e restano vuote).",
      de: "1. Sauerteig auffrischen.\n2. Kneten mit MikiLab-Verbesserer, Öl, Salz.\n3. 2 h.\n4. Kugeln formen, 1 h.\n5. 250°C 12-14 Min (blähen sich auf).",
      en: "1. Refresh sourdough.\n2. Mix with MikiLab Improver, oil, salt.\n3. Bulk 2 h.\n4. Divide into balls, 1 h.\n5. Bake 250°C 12-14 min (they puff and stay hollow).",
      es: "1. Refresca la masa madre.\n2. Amasa con Mejorador MikiLab, aceite, sal.\n3. 2 h.\n4. Bolas, 1 h.\n5. Hornea 250°C 12-14 min (se inflan).",
      fr: "1. Rafraîchis le levain.\n2. Pétris avec l'Améliorant MikiLab, huile, sel.\n3. Pointage 2 h.\n4. Divise en boules, 1 h.\n5. Cuisson 250°C 12-14 min (elles gonflent et restent creuses).",
    },
  },

  // ═══════════ GRANDI LIEVITATI ═══════════
  {
    id: "panettone_classico", region: "lievitati", flag: "🇮🇹", img: IMG.panettone, place: PLACE.lievitati,
    name: { it: "Panettone Classico MikiLab", de: "Klassischer MikiLab-Panettone", en: "MikiLab Classic Panettone", es: "Panettone Clásico MikiLab", fr: "Panettone Classique MikiLab" },
    story: {
      it: "Due impasti, Lievito Madre, Miglioratore Naturale e 48 ore. Il re dei lievitati col mio metodo.",
      de: "Zwei Teige, Sauerteig, Verbesserer und 48 Stunden. Der König.",
      en: "Two doughs, sourdough, Improver and 48 hours. The king of leavened.",
      es: "Dos masas, masa madre, Mejorador y 48 horas. El rey.",
      fr: "Deux pâtes, levain, Améliorant et 48 heures. Le roi des levés.",
    },
    ing: [g(ING.farinaForte, 100), g(ING.lm, 30), g(ING.tuorli, 30), g(ING.burro, 40), g(ING.zucchero, 30), g(ING.migl, 2), g(ING.uvetta, 55)],
    proc: {
      it: "1. Primo impasto la sera: lievita 12 h (triplica).\n2. Secondo impasto: burro, Miglioratore Naturale MikiLab, aromi, uvetta e canditi.\n3. Pirlatura, in pirottino, appretto 6-8 h.\n4. Cuoci 165°C 50 min (cuore 94°C).\n5. Capovolgi 12 h.",
      de: "1. Erster Teig abends: 12 h (verdreifacht).\n2. Zweiter Teig: Butter, MikiLab-Verbesserer, Aromen, Rosinen.\n3. Rundwirken, 6-8 h.\n4. 165°C 50 Min (Kern 94°C).\n5. 12 h kopfüber.",
      en: "1. First dough evening: 12 h (triples).\n2. Second dough: butter, MikiLab Improver, aromas, raisins.\n3. Shape, proof 6-8 h.\n4. Bake 165°C 50 min (core 94°C).\n5. Hang 12 h.",
      es: "1. Primera masa noche: 12 h (triplica).\n2. Segunda masa: mantequilla, Mejorador MikiLab, aromas, pasas.\n3. Forma, 6-8 h.\n4. Hornea 165°C 50 min (94°C).\n5. Cuelga 12 h.",
      fr: "1. Première pâte le soir : 12 h (triple).\n2. Deuxième pâte : beurre, Améliorant MikiLab, arômes, raisins.\n3. Boule, apprêt 6-8 h.\n4. Cuisson 165°C 50 min (cœur 94°C).\n5. Suspends 12 h.",
    },
  },
  {
    id: "pandoro", region: "lievitati", flag: "🇮🇹", img: IMG.panettone2, place: PLACE.lievitati,
    name: { it: "Pandoro di Verona", de: "Pandoro aus Verona", en: "Pandoro of Verona", es: "Pandoro de Verona", fr: "Pandoro de Vérone" },
    story: {
      it: "Stella dorata, burrosa e vanigliata. Lievito Madre, tanto burro e Miglioratore MikiLab per lo sviluppo.",
      de: "Goldener Stern, buttrig, vanillig. Sauerteig, viel Butter, Verbesserer.",
      en: "Golden star, buttery and vanilla. Sourdough, lots of butter, Improver.",
      es: "Estrella dorada, mantecosa y vainillada. Masa madre y Mejorador.",
      fr: "Étoile dorée, beurrée et vanillée. Levain, beaucoup de beurre, Améliorant.",
    },
    ing: [g(ING.farinaForte, 100), g(ING.lm, 28), g(ING.tuorli, 35), g(ING.burro, 50), g(ING.zucchero, 35), g(ING.migl, 2)],
    proc: {
      it: "1. Primo impasto, lievita 12 h.\n2. Secondo impasto con burro, Miglioratore Naturale MikiLab, vaniglia — senza di lui la stella non si alza.\n3. Appretto nello stampo a stella 6-7 h.\n4. Cuoci 160°C 45 min.\n5. Raffredda e spolvera zucchero a velo.",
      de: "1. Erster Teig 12 h.\n2. Zweiter Teig mit Butter, MikiLab-Verbesserer, Vanille.\n3. Sterngare 6-7 h.\n4. 160°C 45 Min.\n5. Puderzucker.",
      en: "1. First dough 12 h.\n2. Second dough with butter, MikiLab Improver, vanilla — without it the star won't rise.\n3. Proof in star mould 6-7 h.\n4. Bake 160°C 45 min.\n5. Dust icing sugar.",
      es: "1. Primera masa 12 h.\n2. Segunda masa con mantequilla, Mejorador MikiLab, vainilla.\n3. Molde estrella 6-7 h.\n4. Hornea 160°C 45 min.\n5. Azúcar glas.",
      fr: "1. Première pâte 12 h.\n2. Deuxième pâte avec beurre, Améliorant MikiLab, vanille — sans lui l'étoile ne monte pas.\n3. Apprêt en moule étoile 6-7 h.\n4. Cuisson 160°C 45 min.\n5. Sucre glace.",
    },
  },
  {
    id: "colomba", region: "lievitati", flag: "🇮🇹", img: IMG.panettone2, place: PLACE.lievitati,
    name: { it: "Colomba Pasquale", de: "Oster-Colomba", en: "Easter Colomba", es: "Colomba de Pascua", fr: "Colombe de Pâques" },
    story: {
      it: "Forma a colomba, glassa di mandorle e canditi d'arancia. Lievito Madre e Miglioratore MikiLab.",
      de: "Taubenform, Mandelglasur, Orangenzitronat. Sauerteig und Verbesserer.",
      en: "Dove shape, almond glaze and orange peel. Sourdough and Improver.",
      es: "Forma de paloma, glaseado de almendra y naranja. Masa madre y Mejorador.",
      fr: "Forme de colombe, glaçage aux amandes et orange confite. Levain et Améliorant.",
    },
    ing: [g(ING.farinaForte, 100), g(ING.lm, 30), g(ING.tuorli, 28), g(ING.burro, 38), g(ING.zucchero, 28), g(ING.migl, 2), g(ING.uvetta, 40)],
    proc: {
      it: "1. Primo impasto, lievita 12 h.\n2. Secondo impasto con burro, Miglioratore Naturale MikiLab e arancia candita.\n3. Forma a colomba, appretto 6 h.\n4. Glassa di mandorle, granella e zucchero.\n5. Cuoci 160°C 50 min.\n6. Capovolgi.",
      de: "1. Erster Teig 12 h.\n2. Zweiter Teig mit Butter, Verbesserer, Orange.\n3. Taubenform, 6 h.\n4. Mandelglasur.\n5. 160°C 50 Min.\n6. Wenden.",
      en: "1. First dough 12 h.\n2. Second dough with butter, MikiLab Improver, orange.\n3. Dove shape, proof 6 h.\n4. Almond glaze, sugar.\n5. Bake 160°C 50 min.\n6. Hang.",
      es: "1. Primera masa 12 h.\n2. Segunda con mantequilla, Mejorador, naranja.\n3. Forma paloma, 6 h.\n4. Glaseado de almendra.\n5. Hornea 160°C 50 min.\n6. Cuelga.",
      fr: "1. Première pâte 12 h.\n2. Deuxième pâte avec beurre, Améliorant MikiLab, orange.\n3. Forme de colombe, apprêt 6 h.\n4. Glaçage amandes, sucre.\n5. Cuisson 160°C 50 min.\n6. Suspends.",
    },
  },
  {
    id: "panettone_cioccolato", region: "lievitati", flag: "🇮🇹", img: IMG.panettone, place: PLACE.lievitati,
    name: { it: "Panettone al Cioccolato", de: "Schoko-Panettone", en: "Chocolate Panettone", es: "Panettone de Chocolate", fr: "Panettone au Chocolat" },
    story: {
      it: "Versione golosa con gocce di cioccolato fondente. Lievito Madre e Miglioratore MikiLab per 48 ore di sviluppo.",
      de: "Schokoladige Version. Sauerteig und Verbesserer, 48 Stunden.",
      en: "Indulgent chocolate-chip version. Sourdough and Improver, 48 hours.",
      es: "Versión con chocolate. Masa madre y Mejorador, 48 horas.",
      fr: "Version gourmande aux pépites de chocolat. Levain et Améliorant, 48 heures.",
    },
    ing: [g(ING.farinaForte, 100), g(ING.lm, 30), g(ING.tuorli, 30), g(ING.burro, 40), g(ING.zucchero, 32), g(ING.migl, 2), g(ING.cioccolato, 45)],
    proc: {
      it: "1. Primo impasto, lievita 12 h.\n2. Secondo impasto con burro, Miglioratore Naturale MikiLab e gocce di cioccolato.\n3. Pirlatura, appretto 6-8 h.\n4. Taglio a croce, fiocco di burro.\n5. Cuoci 165°C 50 min.\n6. Capovolgi 12 h.",
      de: "1. Erster Teig 12 h.\n2. Zweiter Teig mit Butter, Verbesserer, Schoko.\n3. 6-8 h.\n4. Kreuzschnitt.\n5. 165°C 50 Min.\n6. 12 h wenden.",
      en: "1. First dough 12 h.\n2. Second dough with butter, MikiLab Improver, chocolate.\n3. Proof 6-8 h.\n4. Cross-cut, butter.\n5. Bake 165°C 50 min.\n6. Hang 12 h.",
      es: "1. Primera masa 12 h.\n2. Segunda con mantequilla, Mejorador, chocolate.\n3. 6-8 h.\n4. Corte en cruz.\n5. Hornea 165°C 50 min.\n6. Cuelga 12 h.",
      fr: "1. Première pâte 12 h.\n2. Deuxième pâte avec beurre, Améliorant MikiLab, chocolat.\n3. Apprêt 6-8 h.\n4. Grigne en croix, beurre.\n5. Cuisson 165°C 50 min.\n6. Suspends 12 h.",
    },
  },
  {
    id: "veneziana_salata", region: "lievitati", flag: "🇮🇹", img: IMG.panettone2, place: PLACE.lievitati,
    name: { it: "Panettone Gastronomico Salato", de: "Herzhafter Panettone", en: "Savoury Panettone", es: "Panettone Salado", fr: "Panettone Salé" },
    story: {
      it: "Soffice pan brioche salato da farcire a strati con salumi e formaggi. Lievito Madre e Miglioratore MikiLab.",
      de: "Herzhaftes Brioche zum Schichten. Sauerteig und Verbesserer.",
      en: "Savoury soft brioche to layer with cold cuts and cheese. Sourdough and Improver.",
      es: "Brioche salado para rellenar por capas. Masa madre y Mejorador.",
      fr: "Brioche salée moelleuse à garnir en couches. Levain et Améliorant.",
    },
    ing: [g(ING.farinaForte, 100), g(ING.lm, 25), g(ING.latte, 30), g(ING.burro, 25), g(ING.tuorli, 15), g(ING.migl, 2), g(ING.sale, 2), g(ING.salumi, 40)],
    proc: {
      it: "1. Primo impasto, lievita 10 h.\n2. Secondo impasto con burro, Miglioratore Naturale MikiLab e sale.\n3. In pirottino, appretto 4 h.\n4. Cuoci 165°C 45 min.\n5. Raffredda, taglia a dischi e farcisci con salumi e formaggi.",
      de: "1. Erster Teig 10 h.\n2. Zweiter Teig mit Butter, Verbesserer, Salz.\n3. 4 h.\n4. 165°C 45 Min.\n5. In Scheiben, füllen.",
      en: "1. First dough 10 h.\n2. Second dough with butter, MikiLab Improver, salt.\n3. Proof 4 h.\n4. Bake 165°C 45 min.\n5. Slice into discs, fill with cold cuts and cheese.",
      es: "1. Primera masa 10 h.\n2. Segunda con mantequilla, Mejorador, sal.\n3. 4 h.\n4. Hornea 165°C 45 min.\n5. Corta en discos y rellena.",
      fr: "1. Première pâte 10 h.\n2. Deuxième pâte avec beurre, Améliorant MikiLab, sel.\n3. Apprêt 4 h.\n4. Cuisson 165°C 45 min.\n5. Coupe en disques, garnis de charcuterie et fromage.",
    },
  },

  // ═══════════ PANI COLORATI / SPECIALI (INNOVAZIONE) ═══════════
  {
    id: "pane_colorato", region: "colorati", flag: "🌈", img: IMG.col3, place: PLACE.speciali,
    name: { it: "Pane Arcobaleno Naturale", de: "Natürliches Regenbogenbrot", en: "Natural Rainbow Bread", es: "Pan Arcoíris Natural", fr: "Pain Arc-en-ciel Naturel" },
    story: {
      it: "Tre impasti colorati con barbabietola, curcuma e spinaci. Zero coloranti: solo Lievito Madre e Miglioratore MikiLab.",
      de: "Drei Teige mit Rote Bete, Kurkuma, Spinat. Keine Farbstoffe.",
      en: "Three doughs coloured with beet, turmeric, spinach. No dyes.",
      es: "Tres masas con remolacha, cúrcuma, espinaca. Sin colorantes.",
      fr: "Trois pâtes colorées à la betterave, curcuma, épinard. Aucun colorant.",
    },
    ing: [g(ING.farina0, 100), g(ING.acqua, 60), g(ING.lm, 20), g(ING.purea, 12), g(ING.migl, 2), g(ING.sale, 2)],
    proc: {
      it: "1. Dividi la base in 3 e colora con le puree naturali.\n2. Aggiungi Miglioratore Naturale MikiLab a ogni parte.\n3. Puntata 2 h.\n4. Sovrapponi e arrotola gli strati.\n5. Appretto 1,5 h.\n6. Cuoci 230°C vapore 35 min.",
      de: "1. Basis in 3 teilen, färben.\n2. MikiLab-Verbesserer zugeben.\n3. 2 h.\n4. Schichten & rollen.\n5. 1,5 h.\n6. 230°C Dampf 35 Min.",
      en: "1. Split base in 3, colour with natural purées.\n2. Add MikiLab Improver to each.\n3. Bulk 2 h.\n4. Layer & roll.\n5. Proof 1.5 h.\n6. Bake 230°C steam 35 min.",
      es: "1. Divide en 3 y colorea.\n2. Añade Mejorador MikiLab.\n3. 2 h.\n4. Apila y enrolla.\n5. 1,5 h.\n6. Hornea 230°C vapor 35 min.",
      fr: "1. Divise la base en 3 et colore avec les purées naturelles.\n2. Ajoute l'Améliorant MikiLab à chaque part.\n3. Pointage 2 h.\n4. Superpose et roule les couches.\n5. Apprêt 1,5 h.\n6. Cuisson 230°C vapeur 35 min.",
    },
  },
  {
    id: "cornetti_colorati", region: "colorati", flag: "🌈", img: IMG.col1, place: PLACE.speciali,
    name: { it: "Cornetti Colorati (Innovazione)", de: "Bunte Croissants (Innovation)", en: "Coloured Croissants (Innovation)", es: "Cruasanes de Colores (Innovación)", fr: "Croissants Colorés (Innovation)" },
    story: {
      it: "Sfoglia laminata con velo colorato naturale che disegna venature uniche. Poolish, Lievito Madre e Miglioratore MikiLab: nessuno li fa così.",
      de: "Laminierter Teig mit natürlicher Farbschicht. Poolish, Sauerteig, Verbesserer.",
      en: "Laminated dough with a natural coloured layer forming unique veins. Poolish, sourdough, Improver.",
      es: "Masa laminada con velo de color natural. Poolish, masa madre, Mejorador.",
      fr: "Pâte feuilletée avec un voile coloré naturel aux veines uniques. Poolish, levain, Améliorant.",
    },
    ing: [g(ING.farinaForte, 100), g(ING.acqua, 50), g(ING.poolish, 25), g(ING.lm, 10), g(ING.burro, 50), g(ING.zucchero, 12), g(ING.migl, 2), g(ING.purea, 6)],
    proc: {
      it: "1. Poolish 12h.\n2. Impasta con LM, Miglioratore Naturale MikiLab; frigo 12 h.\n3. Stendi il velo colorato sul panetto.\n4. Lamina il burro con 3 pieghe.\n5. Forma i cornetti, appretto 2 h.\n6. Cuoci 190°C 16-18 min.",
      de: "1. Poolish 12h.\n2. Kneten mit Sauerteig, Verbesserer; 12 h kühlen.\n3. Farbfolie auflegen.\n4. Butter tourieren, 3 Faltungen.\n5. Croissants formen, 2 h.\n6. 190°C 16-18 Min.",
      en: "1. Poolish 12h.\n2. Mix with sourdough, MikiLab Improver; fridge 12 h.\n3. Lay coloured sheet on dough.\n4. Laminate butter, 3 folds.\n5. Shape croissants, proof 2 h.\n6. Bake 190°C 16-18 min.",
      es: "1. Poolish 12h.\n2. Amasa con masa madre, Mejorador; nevera 12 h.\n3. Coloca el velo de color.\n4. Lamina la mantequilla, 3 pliegues.\n5. Forma cruasanes, 2 h.\n6. Hornea 190°C 16-18 min.",
      fr: "1. Poolish 12h.\n2. Pétris avec levain, Améliorant MikiLab ; frigo 12 h.\n3. Pose le voile coloré sur le pâton.\n4. Feuillette le beurre, 3 tours.\n5. Façonne les croissants, apprêt 2 h.\n6. Cuisson 190°C 16-18 min.",
    },
  },
  {
    id: "baguette_colorata", region: "colorati", flag: "🌈", img: IMG.baguette, place: PLACE.speciali,
    name: { it: "Baguette Colorata (Innovazione)", de: "Bunte Baguette (Innovation)", en: "Coloured Baguette (Innovation)", es: "Baguette de Color (Innovación)", fr: "Baguette Colorée (Innovation)" },
    story: {
      it: "Baguette croccante con mollica screziata di colore naturale. Poolish e Miglioratore MikiLab per l'alveolatura selvaggia.",
      de: "Knusprige Baguette mit bunter Krume. Poolish und Verbesserer.",
      en: "Crunchy baguette with naturally-marbled crumb. Poolish and Improver for wild alveoli.",
      es: "Baguette crujiente con miga jaspeada natural. Poolish y Mejorador.",
      fr: "Baguette croustillante à la mie marbrée naturelle. Poolish et Améliorant pour un alvéolage sauvage.",
    },
    ing: [g(ING.farina0, 100), g(ING.acqua, 72), g(ING.poolish, 35), g(ING.migl, 2), g(ING.purea, 8), g(ING.sale, 2)],
    proc: {
      it: "1. Poolish 12h.\n2. Impasta e dividi: metà naturale, metà colorata con purea.\n3. Aggiungi Miglioratore Naturale MikiLab e sale.\n4. Puntata 2 h con pieghe.\n5. Forma baguette marmorizzate.\n6. Appretto 45 min, cuoci 240°C vapore 20 min.",
      de: "1. Poolish 12h.\n2. Teilen: halb natur, halb gefärbt.\n3. Verbesserer und Salz.\n4. 2 h mit Faltungen.\n5. Marmorierte Baguettes formen.\n6. 45 Min, 240°C Dampf 20 Min.",
      en: "1. Poolish 12h.\n2. Mix and split: half plain, half coloured.\n3. Add MikiLab Improver and salt.\n4. Bulk 2 h with folds.\n5. Shape marbled baguettes.\n6. Proof 45 min, bake 240°C steam 20 min.",
      es: "1. Poolish 12h.\n2. Divide: mitad natural, mitad de color.\n3. Añade Mejorador y sal.\n4. 2 h con pliegues.\n5. Forma baguettes jaspeadas.\n6. 45 min, hornea 240°C vapor 20 min.",
      fr: "1. Poolish 12h.\n2. Pétris et divise : moitié nature, moitié colorée à la purée.\n3. Ajoute l'Améliorant MikiLab et le sel.\n4. Pointage 2 h avec rabats.\n5. Façonne des baguettes marbrées.\n6. Apprêt 45 min, cuisson 240°C vapeur 20 min.",
    },
  },
  {
    id: "panettone_colorato", region: "colorati", flag: "🌈", img: IMG.col2, place: PLACE.speciali,
    name: { it: "Panettone Colorato (Innovazione)", de: "Bunter Panettone (Innovation)", en: "Coloured Panettone (Innovation)", es: "Panettone de Colores (Innovación)", fr: "Panettone Coloré (Innovation)" },
    story: {
      it: "Il panettone che nessuno ha mai visto: impasti a spirale colorati al naturale. Lievito Madre e Miglioratore MikiLab, 48 ore.",
      de: "Panettone in bunter Spirale, natürlich gefärbt. Sauerteig und Verbesserer.",
      en: "A panettone no one has ever seen: naturally-coloured spiral doughs. Sourdough and Improver, 48 hours.",
      es: "Un panettone nunca visto: masas en espiral de color natural. Masa madre y Mejorador.",
      fr: "Le panettone que personne n'a jamais vu : pâtes en spirale colorées au naturel. Levain et Améliorant, 48 heures.",
    },
    ing: [g(ING.farinaForte, 100), g(ING.lm, 30), g(ING.tuorli, 28), g(ING.burro, 40), g(ING.zucchero, 30), g(ING.migl, 2), g(ING.purea, 8)],
    proc: {
      it: "1. Primo impasto, lievita 12 h.\n2. Secondo impasto con burro e Miglioratore Naturale MikiLab.\n3. Dividi e colora al naturale, arrotola a spirale.\n4. In pirottino, appretto 6-8 h.\n5. Cuoci 165°C 50 min.\n6. Capovolgi 12 h.",
      de: "1. Erster Teig 12 h.\n2. Zweiter Teig mit Butter, Verbesserer.\n3. Teilen, färben, Spirale rollen.\n4. 6-8 h.\n5. 165°C 50 Min.\n6. 12 h wenden.",
      en: "1. First dough 12 h.\n2. Second dough with butter, MikiLab Improver.\n3. Split, colour naturally, roll a spiral.\n4. Proof 6-8 h.\n5. Bake 165°C 50 min.\n6. Hang 12 h.",
      es: "1. Primera masa 12 h.\n2. Segunda con mantequilla, Mejorador.\n3. Divide, colorea, enrolla en espiral.\n4. 6-8 h.\n5. Hornea 165°C 50 min.\n6. Cuelga 12 h.",
      fr: "1. Première pâte 12 h.\n2. Deuxième pâte avec beurre, Améliorant MikiLab.\n3. Divise, colore au naturel, roule en spirale.\n4. Apprêt 6-8 h.\n5. Cuisson 165°C 50 min.\n6. Suspends 12 h.",
    },
  },
  {
    id: "pane_carbone", region: "colorati", flag: "⚫", img: IMG.rustic1, place: PLACE.speciali,
    name: { it: "Pane Nero al Carbone Vegetale", de: "Schwarzbrot mit Aktivkohle", en: "Black Charcoal Bread", es: "Pan Negro de Carbón Vegetal", fr: "Pain Noir au Charbon Végétal" },
    story: {
      it: "Nero intenso e digeribile grazie al carbone vegetale. Biga e Miglioratore MikiLab per una mollica setosa.",
      de: "Tiefschwarz und bekömmlich dank Aktivkohle. Biga und Verbesserer.",
      en: "Deep black and easy to digest with vegetable charcoal. Biga and Improver.",
      es: "Negro intenso y digestivo con carbón vegetal. Biga y Mejorador.",
      fr: "Noir intense et digeste grâce au charbon végétal. Biga et Améliorant.",
    },
    ing: [g(ING.farina0, 100), g(ING.acqua, 70), g(ING.biga, 30), g(ING.carbone, 1.2), g(ING.migl, 2), g(ING.olio, 3), g(ING.sale, 2)],
    proc: {
      it: "1. Biga 18h.\n2. Impasta con carbone vegetale, Miglioratore Naturale MikiLab, olio e sale.\n3. Puntata 2,5 h.\n4. Forma, appretto 1 h.\n5. Cuoci 230°C vapore, poi 210°C 35 min.",
      de: "1. Biga 18h.\n2. Kneten mit Aktivkohle, Verbesserer, Öl, Salz.\n3. 2,5 h.\n4. Formen, 1 h.\n5. 230°C Dampf, dann 210°C 35 Min.",
      en: "1. Biga 18h.\n2. Mix with charcoal, MikiLab Improver, oil, salt.\n3. Bulk 2.5 h.\n4. Shape, 1 h.\n5. Bake 230°C steam, then 210°C 35 min.",
      es: "1. Biga 18h.\n2. Amasa con carbón, Mejorador, aceite, sal.\n3. 2,5 h.\n4. Forma, 1 h.\n5. Hornea 230°C vapor, luego 210°C 35 min.",
      fr: "1. Biga 18h.\n2. Pétris avec charbon végétal, Améliorant MikiLab, huile, sel.\n3. Pointage 2,5 h.\n4. Façonne, 1 h.\n5. Cuisson 230°C vapeur, puis 210°C 35 min.",
    },
  },
  {
    id: "pane_zucca", region: "colorati", flag: "🟠", img: IMG.foc3, place: PLACE.speciali,
    name: { it: "Pane alla Zucca", de: "Kürbisbrot", en: "Pumpkin Bread", es: "Pan de Calabaza", fr: "Pain au Potiron" },
    story: {
      it: "Arancione naturale, dolce e morbido. Poolish, Lievito Madre e Miglioratore MikiLab.",
      de: "Natürlich orange, süß und weich. Poolish, Sauerteig, Verbesserer.",
      en: "Naturally orange, sweet and soft. Poolish, sourdough, Improver.",
      es: "Naranja natural, dulce y suave. Poolish, masa madre, Mejorador.",
      fr: "Orange naturel, doux et moelleux. Poolish, levain, Améliorant.",
    },
    ing: [g(ING.farina0, 100), g(ING.zucca, 30), g(ING.acqua, 45), g(ING.poolish, 30), g(ING.lm, 10), g(ING.migl, 2), g(ING.olio, 4), g(ING.sale, 2)],
    proc: {
      it: "1. Poolish 12h + purea di zucca.\n2. Impasta con LM, Miglioratore Naturale MikiLab, olio e sale.\n3. Puntata 2 h.\n4. Forma, appretto 1 h.\n5. Cuoci 220°C 35 min.",
      de: "1. Poolish 12h + Kürbis.\n2. Kneten mit Sauerteig, Verbesserer, Öl, Salz.\n3. 2 h.\n4. Formen, 1 h.\n5. 220°C 35 Min.",
      en: "1. Poolish 12h + pumpkin purée.\n2. Mix with sourdough, MikiLab Improver, oil, salt.\n3. Bulk 2 h.\n4. Shape, 1 h.\n5. Bake 220°C 35 min.",
      es: "1. Poolish 12h + calabaza.\n2. Amasa con masa madre, Mejorador, aceite, sal.\n3. 2 h.\n4. Forma, 1 h.\n5. Hornea 220°C 35 min.",
      fr: "1. Poolish 12h + purée de potiron.\n2. Pétris avec levain, Améliorant MikiLab, huile, sel.\n3. Pointage 2 h.\n4. Façonne, 1 h.\n5. Cuisson 220°C 35 min.",
    },
  },

  // ═══════════ GERMANIA ═══════════
  {
    id: "brezel", region: "germania", flag: "🇩🇪", img: IMG.ger1, place: PLACE.germania,
    name: { it: "Brezel", de: "Brezel", en: "Brezel (Pretzel)", es: "Brezel", fr: "Bretzel" },
    story: {
      it: "Il mio omaggio alla Germania che mi ha accolto: lucida in soluzione alcalina, con Biga e Miglioratore MikiLab.",
      de: "Meine Hommage an Deutschland: glänzend in Lauge, mit Biga und Verbesserer.",
      en: "My tribute to Germany: shiny in soda bath, with Biga and Improver.",
      es: "Mi homenaje a Alemania: brillante en solución alcalina, con Biga y Mejorador.",
      fr: "Mon hommage à l'Allemagne : brillant en bain alcalin, avec Biga et Améliorant.",
    },
    ing: [g(ING.farina0, 100), g(ING.acqua, 52), g(ING.biga, 30), g(ING.burro, 6), g(ING.migl, 2), g(ING.sale, 2)],
    proc: {
      it: "1. Biga + impasto con Miglioratore Naturale MikiLab, puntata 1 h.\n2. Forma i bretzel.\n3. Frigo 1 h.\n4. Bagna in bicarbonato bollente.\n5. Sale grosso, incidi il ventre.\n6. Cuoci 210°C 15 min.",
      de: "1. Biga + Teig mit Verbesserer, 1 h.\n2. Brezel formen.\n3. 1 h kühlen.\n4. In kochendes Natron tauchen.\n5. Salz, einschneiden.\n6. 210°C 15 Min.",
      en: "1. Biga + dough with MikiLab Improver, bulk 1 h.\n2. Shape pretzels.\n3. Fridge 1 h.\n4. Dip in boiling soda.\n5. Coarse salt, score belly.\n6. Bake 210°C 15 min.",
      es: "1. Biga + masa con Mejorador, 1 h.\n2. Forma bretzels.\n3. Nevera 1 h.\n4. Baño de bicarbonato.\n5. Sal, corta.\n6. Hornea 210°C 15 min.",
      fr: "1. Biga + pâte avec l'Améliorant MikiLab, pointage 1 h.\n2. Façonne les bretzels.\n3. Frigo 1 h.\n4. Trempe dans le bicarbonate bouillant.\n5. Gros sel, incise le ventre.\n6. Cuisson 210°C 15 min.",
    },
  },
  {
    id: "laugenbroetchen", region: "germania", flag: "🇩🇪", img: IMG.ger2, place: PLACE.germania,
    name: { it: "Laugenbrötchen (Panini di Laugen)", de: "Laugenbrötchen", en: "Laugen Rolls", es: "Panecillos Laugen", fr: "Petits Pains Laugen" },
    story: {
      it: "Panini lucidi in soluzione alcalina, crosta ambrata e mollica soffice. Biga e Miglioratore MikiLab.",
      de: "Glänzende Laugenbrötchen, weiche Krume. Biga und Verbesserer.",
      en: "Shiny lye rolls, amber crust, soft crumb. Biga and Improver.",
      es: "Panecillos brillantes de sosa, miga suave. Biga y Mejorador.",
      fr: "Petits pains brillants au bain alcalin, mie moelleuse. Biga et Améliorant.",
    },
    ing: [g(ING.farina0, 100), g(ING.acqua, 55), g(ING.biga, 30), g(ING.burro, 5), g(ING.migl, 2), g(ING.sale, 2)],
    proc: {
      it: "1. Biga + impasto con Miglioratore Naturale MikiLab, puntata 1 h.\n2. Forma i panini.\n3. Frigo 1 h.\n4. Bagna in bicarbonato bollente.\n5. Incidi a croce, sale grosso.\n6. Cuoci 220°C 16 min.",
      de: "1. Biga + Teig mit Verbesserer, 1 h.\n2. Brötchen formen.\n3. 1 h kühlen.\n4. In Lauge tauchen.\n5. Einschneiden, Salz.\n6. 220°C 16 Min.",
      en: "1. Biga + dough with MikiLab Improver, bulk 1 h.\n2. Shape rolls.\n3. Fridge 1 h.\n4. Dip in boiling soda.\n5. Cross-score, salt.\n6. Bake 220°C 16 min.",
      es: "1. Biga + masa con Mejorador, 1 h.\n2. Forma panecillos.\n3. Nevera 1 h.\n4. Baño de sosa.\n5. Corta, sal.\n6. Hornea 220°C 16 min.",
      fr: "1. Biga + pâte avec l'Améliorant MikiLab, pointage 1 h.\n2. Façonne les petits pains.\n3. Frigo 1 h.\n4. Trempe dans le bicarbonate bouillant.\n5. Incise en croix, gros sel.\n6. Cuisson 220°C 16 min.",
    },
  },
  {
    id: "roggenbrot", region: "germania", flag: "🇩🇪", img: IMG.ger3, place: PLACE.germania,
    name: { it: "Roggenbrot (Pane di Segale)", de: "Roggenbrot", en: "Rye Bread", es: "Pan de Centeno", fr: "Pain de Seigle" },
    story: {
      it: "Pane di segale a lievitazione naturale, denso e aromatico. Lievito Madre di segale e Miglioratore MikiLab.",
      de: "Roggen-Sauerteigbrot, dicht und aromatisch. Sauerteig und Verbesserer.",
      en: "Rye sourdough bread, dense and aromatic. Rye sourdough and Improver.",
      es: "Pan de centeno con masa madre, denso y aromático. Mejorador.",
      fr: "Pain de seigle au levain, dense et aromatique. Levain de seigle et Améliorant.",
    },
    ing: [g(ING.segale, 70), g(ING.farina0, 30), g(ING.acqua, 78), g(ING.lm, 30), g(ING.migl, 2), g(ING.sale, 2), g(ING.cumino, 1)],
    proc: {
      it: "1. Rinfresca il Lievito Madre di segale.\n2. Impasta con Miglioratore Naturale MikiLab, sale e cumino.\n3. Puntata 2 h (impasto colloso).\n4. In stampo, appretto 1,5 h.\n5. Cuoci 250°C vapore, poi 200°C 60 min.",
      de: "1. Roggen-Sauerteig auffrischen.\n2. Kneten mit Verbesserer, Salz, Kümmel.\n3. 2 h.\n4. Im Kasten 1,5 h.\n5. 250°C Dampf, dann 200°C 60 Min.",
      en: "1. Refresh rye sourdough.\n2. Mix with MikiLab Improver, salt, caraway.\n3. Bulk 2 h (sticky dough).\n4. In tin, proof 1.5 h.\n5. Bake 250°C steam, then 200°C 60 min.",
      es: "1. Refresca la masa madre de centeno.\n2. Amasa con Mejorador, sal, comino.\n3. 2 h.\n4. En molde, 1,5 h.\n5. Hornea 250°C vapor, luego 200°C 60 min.",
      fr: "1. Rafraîchis le levain de seigle.\n2. Pétris avec l'Améliorant MikiLab, sel, carvi.\n3. Pointage 2 h (pâte collante).\n4. En moule, apprêt 1,5 h.\n5. Cuisson 250°C vapeur, puis 200°C 60 min.",
    },
  },
  {
    id: "vollkornbrot", region: "germania", flag: "🇩🇪", img: IMG.ger4, place: PLACE.germania,
    name: { it: "Vollkornbrot (Pane Integrale ai Semi)", de: "Vollkornbrot", en: "Wholegrain Seed Bread", es: "Pan Integral de Semillas", fr: "Pain Complet aux Graines" },
    story: {
      it: "Pane integrale tedesco carico di semi, nutriente e a lunga conservazione. Lievito Madre e Miglioratore MikiLab.",
      de: "Deutsches Vollkornbrot mit Saaten. Sauerteig und Verbesserer.",
      en: "German wholegrain bread loaded with seeds. Sourdough and Improver.",
      es: "Pan integral alemán con semillas. Masa madre y Mejorador.",
      fr: "Pain complet allemand chargé de graines. Levain et Améliorant.",
    },
    ing: [g(ING.integrale, 80), g(ING.segale, 20), g(ING.acqua, 80), g(ING.lm, 30), g(ING.migl, 2), g(ING.sale, 2), g(ING.cumino, 1)],
    proc: {
      it: "1. Rinfresca il Lievito Madre.\n2. Impasta con semi misti, Miglioratore Naturale MikiLab e sale.\n3. Puntata 2 h.\n4. In stampo, appretto 2 h.\n5. Cuoci 230°C vapore, poi 200°C 55 min.",
      de: "1. Sauerteig auffrischen.\n2. Kneten mit Saaten, Verbesserer, Salz.\n3. 2 h.\n4. Im Kasten 2 h.\n5. 230°C Dampf, dann 200°C 55 Min.",
      en: "1. Refresh sourdough.\n2. Mix with mixed seeds, MikiLab Improver, salt.\n3. Bulk 2 h.\n4. In tin, proof 2 h.\n5. Bake 230°C steam, then 200°C 55 min.",
      es: "1. Refresca la masa madre.\n2. Amasa con semillas, Mejorador, sal.\n3. 2 h.\n4. En molde, 2 h.\n5. Hornea 230°C vapor, luego 200°C 55 min.",
      fr: "1. Rafraîchis le levain.\n2. Pétris avec graines mélangées, Améliorant MikiLab, sel.\n3. Pointage 2 h.\n4. En moule, apprêt 2 h.\n5. Cuisson 230°C vapeur, puis 200°C 55 min.",
    },
  },
  {
    id: "kaisersemmel", region: "germania", flag: "🇩🇪", img: IMG.ger2, place: PLACE.germania,
    name: { it: "Kaisersemmel (Panino Kaiser)", de: "Kaisersemmel", en: "Kaiser Roll", es: "Panecillo Kaiser", fr: "Petit Pain Kaiser" },
    story: {
      it: "Il panino a stella con crosta croccante e mollica leggera. Poolish e Miglioratore MikiLab.",
      de: "Sternförmiges Brötchen, knusprig, leichte Krume. Poolish und Verbesserer.",
      en: "Star-stamped roll, crunchy crust, light crumb. Poolish and Improver.",
      es: "Panecillo en estrella, corteza crujiente. Poolish y Mejorador.",
      fr: "Petit pain en étoile, croûte croustillante, mie légère. Poolish et Améliorant.",
    },
    ing: [g(ING.farina0, 100), g(ING.acqua, 58), g(ING.poolish, 30), g(ING.malto, 1), g(ING.migl, 2), g(ING.sale, 2)],
    proc: {
      it: "1. Poolish 12h.\n2. Impasta con Miglioratore Naturale MikiLab, malto e sale.\n3. Puntata 1,5 h.\n4. Forma le palline e imprimi la stella.\n5. Appretto 45 min a testa in giù.\n6. Cuoci 230°C vapore 18 min.",
      de: "1. Poolish 12h.\n2. Kneten mit Verbesserer, Malz, Salz.\n3. 1,5 h.\n4. Kugeln, Stern prägen.\n5. 45 Min kopfüber.\n6. 230°C Dampf 18 Min.",
      en: "1. Poolish 12h.\n2. Mix with MikiLab Improver, malt, salt.\n3. Bulk 1.5 h.\n4. Shape balls, stamp star.\n5. Proof 45 min upside down.\n6. Bake 230°C steam 18 min.",
      es: "1. Poolish 12h.\n2. Amasa con Mejorador, malta, sal.\n3. 1,5 h.\n4. Bolas, marca estrella.\n5. 45 min boca abajo.\n6. Hornea 230°C vapor 18 min.",
      fr: "1. Poolish 12h.\n2. Pétris avec l'Améliorant MikiLab, malt, sel.\n3. Pointage 1,5 h.\n4. Façonne les boules, imprime l'étoile.\n5. Apprêt 45 min à l'envers.\n6. Cuisson 230°C vapeur 18 min.",
    },
  },
];

const FALLBACK_IMG = "https://images.unsplash.com/photo-1509440159596-0249088772ff?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200";
const onImgErr = (e) => { if (e.currentTarget.src !== FALLBACK_IMG) e.currentTarget.src = FALLBACK_IMG; };

export default function RicetteCustodite({ initialId = null }) {
  const { lang } = useLang();
  const L = (o) => {
    if (!o) return "";
    if (o[lang]) return o[lang];
    if (lang === "fa") return triFA(o.it) ?? o.en ?? o.it;
    if (lang === "fr") return triFR(o.it) ?? o.en ?? o.it;
    return o.en ?? o.it;
  };
  const [openId, setOpenId] = useState(initialId);
  const [cat, setCat] = useState("all");
  const [flour, setFlour] = useState(1000);
  const [qr, setQr] = useState("");
  const [miglIdx, setMiglIdx] = useState(0);

  // Sistema didascalia Miglioratore Naturale: frasi su salute e naturalezza (ruotano).
  const MIGL_PHRASES = [
    { it: "Solo ingredienti naturali: niente additivi chimici, niente conservanti artificiali.", de: "Nur natürliche Zutaten: keine chemischen Zusätze, keine künstlichen Konservierungsstoffe.", en: "Only natural ingredients: no chemical additives, no artificial preservatives.", es: "Solo ingredientes naturales: sin aditivos químicos ni conservantes artificiales.", fr: "Uniquement des ingrédients naturels : sans additifs chimiques ni conservateurs artificiels." },
    { it: "Un pane più sano e digeribile, che rispetta il tuo intestino e i tempi della vera lievitazione.", de: "Ein gesünderes, bekömmlicheres Brot, das deinen Darm und die Zeiten echter Gärung respektiert.", en: "A healthier, more digestible bread that respects your gut and the times of real fermentation.", es: "Un pan más sano y digerible, que respeta tu intestino y los tiempos de la verdadera fermentación.", fr: "Un pain plus sain et digeste, qui respecte ton intestin et les temps d'une vraie fermentation." },
    { it: "Sai sempre cosa mangi: trasparenza totale, come una volta.", de: "Du weißt immer, was du isst: völlige Transparenz, wie früher.", en: "You always know what you eat: total transparency, like the old days.", es: "Siempre sabes lo que comes: transparencia total, como antes.", fr: "Tu sais toujours ce que tu manges : transparence totale, comme autrefois." },
    { it: "La forza della natura al posto della chimica: struttura, profumo e conservazione autentici.", de: "Die Kraft der Natur statt Chemie: authentische Struktur, Duft und Haltbarkeit.", en: "The power of nature instead of chemistry: authentic structure, aroma and shelf life.", es: "La fuerza de la naturaleza en lugar de la química: estructura, aroma y conservación auténticos.", fr: "La force de la nature au lieu de la chimie : structure, arôme et conservation authentiques." },
  ];
  useEffect(() => {
    const id = setInterval(() => setMiglIdx((i) => (i + 1) % MIGL_PHRASES.length), 4500);
    return () => clearInterval(id);
  }, []);

  const recipe = RECIPES.find((r) => r.id === openId);
  const list = useMemo(() => (cat === "all" ? RECIPES : RECIPES.filter((r) => r.region === cat)), [cat]);

  const rows = useMemo(() => {
    if (!recipe) return [];
    const f = Math.max(0, Number(flour) || 0);
    return recipe.ing.filter((x) => x.pct > 0).map((x) => ({ name: L(x.n), pct: x.pct, grams: Math.round((x.pct / 100) * f) }));
  }, [recipe, flour, lang]); // eslint-disable-line

  const shareText = useMemo(() => {
    if (!recipe) return "";
    const lines = rows.map((r) => `• ${r.name}: ${r.grams} g (${r.pct}%)`).join("\n");
    return `${L(recipe.name)} — MikiLab\n${L({ it: "Farina", de: "Mehl", en: "Flour", es: "Harina", fr: "Farine" })}: ${flour} g\n\n${lines}\n\n${L(recipe.proc)}`;
  }, [recipe, rows, flour, lang]); // eslint-disable-line

  useEffect(() => {
    if (!recipe) { setQr(""); return; }
    QRCode.toDataURL(shareText.slice(0, 900), { margin: 1, width: 220 }).then(setQr).catch(() => setQr(""));
  }, [recipe, shareText]);

  const doShare = async () => {
    try {
      if (navigator.share) { await navigator.share({ title: "MikiLab", text: shareText }); return; }
    } catch { /* */ }
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank");
  };
  const copyText = async () => {
    const ok = L({ it: "Copiata!", de: "Kopiert!", en: "Copied!", es: "¡Copiada!", fr: "Copiée !" });
    const err = L({ it: "Copia non riuscita", de: "Kopieren fehlgeschlagen", en: "Copy failed", es: "No se pudo copiar", fr: "Échec de la copie" });
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareText);
      } else {
        const ta = document.createElement("textarea");
        ta.value = shareText; ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta); ta.focus(); ta.select();
        const done = document.execCommand("copy");
        document.body.removeChild(ta);
        if (!done) throw new Error("execCommand failed");
      }
      toast.success(ok);
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = shareText; ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta); ta.focus(); ta.select();
        const done = document.execCommand("copy");
        document.body.removeChild(ta);
        if (done) { toast.success(ok); return; }
      } catch { /* */ }
      toast.error(err);
    }
  };

  const inp = "bg-[#121212] dark:bg-[#181818] border border-[#2b2b2b] dark:border-[#2e2e2e] rounded-xl px-3 py-2.5 outline-none text-[#2B303B] dark:text-[#e4eff8] focus:border-[#ff6b00] font-mono-data text-center w-28";

  if (recipe) {
    return (
      <div className="pb-40" data-testid="custodite-detail">
        <button data-testid="custodite-back" onClick={() => setOpenId(null)}
          className="inline-flex items-center gap-1.5 mb-4 px-4 py-2 rounded-full bg-white dark:bg-[#1e1e1e] border border-[#2b2b2b] dark:border-[#2e2e2e] text-[#ff6b00] dark:text-[#a9d2ec] font-semibold text-sm shadow-sm active:scale-95 transition-all">
          <ChevronLeft className="w-4 h-4" /> {L({ it: "Tutte le ricette", de: "Alle Rezepte", en: "All recipes", es: "Todas", fr: "Toutes les recettes" })}
        </button>

        <div className="print-area">
          <div className="rounded-3xl overflow-hidden border border-[#2b2b2b] dark:border-[#2e2e2e] bg-white dark:bg-[#1e1e1e] shadow-sm">
            <div className="relative h-40">
              <img src={recipe.img} onError={onImgErr} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#3a2415]/80 to-transparent" />
              <div className="absolute bottom-3 left-4 right-4 text-white">
                <h1 className="font-display text-2xl font-bold drop-shadow">{recipe.flag} {L(recipe.name)}</h1>
                <p className="text-xs opacity-90 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {L(recipe.place)}</p>
              </div>
            </div>
            <div className="p-4">
              <p className="text-sm text-[#3F4A54] dark:text-[#AEB8BF] leading-relaxed italic">{L(recipe.story)}</p>
            </div>
          </div>

          {/* Arma segreta: Miglioratore Naturale — sistema didascalia (salute & naturalezza) */}
          <div className="mt-4 bg-[#ff6b00] rounded-2xl p-4 text-white" data-testid="custodite-improver-note">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-6 h-6 shrink-0 mt-0.5 text-[#f0c9a3]" />
              <p className="text-sm leading-relaxed">
                {L({
                  it: "Il Miglioratore Naturale MikiLab è la mia firma. Il pane riesce anche con altri miglioratori: io uso il mio perché l'ho creato io e amo controllare ogni ingrediente di ciò che mangio. Le percentuali nascono dal mio metodo e dalle mie prove.",
                  de: "Der natürliche MikiLab-Verbesserer ist meine Handschrift. Das Brot gelingt auch mit anderen Verbesserern: ich nehme meinen, weil ich ihn selbst entwickelt habe und gern jede Zutat kontrolliere. Die Prozente stammen aus meiner Methode und meinen Versuchen.",
                  en: "The MikiLab Natural Improver is my signature. The bread works with other improvers too: I use mine because I created it and I love controlling every ingredient I eat. The percentages come from my own method and testing.",
                  es: "El Mejorador Natural MikiLab es mi firma. El pan también sale con otros mejoradores: uso el mío porque lo creé yo y me gusta controlar cada ingrediente de lo que como. Los porcentajes nacen de mi método y mis pruebas.",
                  fr: "L'Améliorant Naturel MikiLab est ma signature. Le pain réussit aussi avec d'autres améliorants : j'utilise le mien parce que je l'ai créé et j'aime contrôler chaque ingrédient de ce que je mange. Les pourcentages viennent de ma méthode et de mes essais.",
                })}
              </p>
            </div>
            <p key={miglIdx} data-testid="custodite-improver-rotating" className="text-[13px] leading-snug text-[#f7e6d3] italic mt-3 pl-9 animate-in fade-in duration-500">
              “{L(MIGL_PHRASES[miglIdx])}”
            </p>
            <div className="flex flex-wrap gap-1.5 mt-3 pl-9">
              {[
                { it: "🌿 100% Naturale", de: "🌿 100% Natürlich", en: "🌿 100% Natural", es: "🌿 100% Natural", fr: "🌿 100% Naturel" },
                { it: "❤️ Più salutare", de: "❤️ Gesünder", en: "❤️ Healthier", es: "❤️ Más saludable", fr: "❤️ Plus sain" },
                { it: "✨ Alta digeribilità", de: "✨ Gut bekömmlich", en: "✨ Highly digestible", es: "✨ Alta digestibilidad", fr: "✨ Haute digestibilité" },
                { it: "🚫 Zero additivi chimici", de: "🚫 Keine Chemie", en: "🚫 No chemical additives", es: "🚫 Sin aditivos químicos", fr: "🚫 Sans additifs chimiques" },
              ].map((chip, i) => (
                <span key={i} data-testid={`migl-chip-${i}`} className="text-[11px] font-semibold bg-white/15 border border-white/25 rounded-full px-2.5 py-1">{L(chip)}</span>
              ))}
            </div>
            <MiglioratoreDetail />
          </div>

          {/* Adatta alle mie dosi */}
          <div className="mt-4 bg-[#ff6b00]/10 border border-[#ff6b00]/30 rounded-2xl p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-[#ff6b00] mb-2 flex items-center gap-1.5"><Scale className="w-4 h-4" /> {L({ it: "Adatta alle mie dosi", de: "An meine Mengen anpassen", en: "Adapt to my amounts", es: "Adapta a mis dosis", fr: "Adapte à mes quantités" })}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-[#3F4A54] dark:text-[#AEB8BF]">{L({ it: "Quanta farina hai?", de: "Wie viel Mehl hast du?", en: "How much flour do you have?", es: "¿Cuánta harina tienes?", fr: "Combien de farine as-tu ?" })}</span>
              <input data-testid="custodite-flour" type="number" inputMode="numeric" value={flour} onChange={(e) => setFlour(e.target.value)} className={inp} />
              <span className="text-sm text-[#7E8A93]">g</span>
              <div className="flex gap-1.5 ms-auto">
                {[500, 1000, 2000].map((v) => (
                  <button key={v} data-testid={`custodite-quick-${v}`} onClick={() => setFlour(v)}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-[#181818] border border-[#2b2b2b] dark:border-[#2e2e2e] active:scale-95">{v >= 1000 ? `${v / 1000}kg` : `${v}g`}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Ingredienti ricalcolati */}
          <div className="mt-4 rounded-2xl border border-[#2b2b2b] dark:border-[#2e2e2e] bg-white dark:bg-[#1e1e1e] overflow-hidden">
            <div className="px-4 py-2.5 bg-[#121212] dark:bg-[#181818] flex items-center gap-2 border-b border-[#2b2b2b] dark:border-[#2e2e2e]">
              <Wheat className="w-4 h-4 text-[#ff6b00]" />
              <span className="font-display font-semibold text-[#2B303B] dark:text-[#e4eff8]">{L({ it: "Ingredienti", de: "Zutaten", en: "Ingredients", es: "Ingredientes", fr: "Ingrédients" })}</span>
            </div>
            <div data-testid="custodite-ingredients">
              {rows.map((r, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-2.5 border-b last:border-0 border-[#F0E7D6] dark:border-[#2C343C]">
                  <span className="text-sm text-[#2B303B] dark:text-[#e4eff8]">{r.name}</span>
                  <span className="flex items-baseline gap-2">
                    <span className="font-mono-data font-bold text-[#ff6b00] dark:text-[#d8a679]">{r.grams} g</span>
                    <span className="text-xs text-[#7E8A93]">{r.pct}%</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Procedimento */}
          <div className="mt-4 rounded-2xl border border-[#2b2b2b] dark:border-[#2e2e2e] bg-white dark:bg-[#1e1e1e] p-4">
            <p className="font-display font-semibold text-[#2B303B] dark:text-[#e4eff8] mb-2 flex items-center gap-1.5"><Clock className="w-4 h-4 text-[#ff6b00]" /> {L({ it: "Procedimento", de: "Zubereitung", en: "Method", es: "Procedimiento", fr: "Préparation" })}</p>
            <p className="text-sm text-[#3F4A54] dark:text-[#AEB8BF] whitespace-pre-line leading-relaxed">{L(recipe.proc)}</p>
          </div>

          {/* Scheda condivisibile con QR */}
          <div className="mt-4 rounded-2xl border-2 border-dashed border-[#ff6b00]/40 bg-[#121212] dark:bg-[#181818] p-4 flex items-center gap-4">
            {qr && <img data-testid="custodite-qr" src={qr} alt="QR" className="w-24 h-24 rounded-lg bg-white p-1 shrink-0" />}
            <div className="min-w-0">
              <p className="font-display font-semibold text-[#2B303B] dark:text-[#e4eff8] flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-[#ff6b00]" /> {L({ it: "Scheda da condividere", de: "Karte zum Teilen", en: "Shareable card", es: "Ficha para compartir", fr: "Fiche à partager" })}</p>
              <p className="text-xs text-[#7E8A93] mt-0.5">{L({ it: "Inquadra il QR per avere ricetta e dosi.", de: "QR scannen für Rezept und Mengen.", en: "Scan the QR for recipe and amounts.", es: "Escanea el QR.", fr: "Scanne le QR pour la recette et les quantités." })}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-4 no-print">
          <button data-testid="custodite-share" onClick={doShare} className="flex items-center justify-center gap-2 bg-[#ff6b00] text-white font-semibold py-3 rounded-xl active:scale-97"><Share2 className="w-5 h-5" /> {L({ it: "Condividi", de: "Teilen", en: "Share", es: "Compartir", fr: "Partager" })}</button>
          <button data-testid="custodite-copy" onClick={copyText} className="flex items-center justify-center gap-2 bg-white dark:bg-[#1e1e1e] border border-[#2b2b2b] dark:border-[#2e2e2e] text-[#2B303B] dark:text-[#e4eff8] font-semibold py-3 rounded-xl active:scale-97">{L({ it: "Copia", de: "Kopieren", en: "Copy", es: "Copiar", fr: "Copier" })}</button>
          <button data-testid="custodite-print" onClick={() => window.print()} className="flex items-center justify-center gap-2 bg-white dark:bg-[#1e1e1e] border border-[#2b2b2b] dark:border-[#2e2e2e] text-[#2B303B] dark:text-[#e4eff8] font-semibold py-3 rounded-xl active:scale-97"><Printer className="w-5 h-5" /> {L({ it: "Stampa", de: "Druck", en: "Print", es: "Imprimir", fr: "Imprimer" })}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-40" data-testid="custodite-list">
      <SectionHero testid="custodite-hero" image="hero-ricette.jpg" position="50% 35%"
        title={L({ it: "📜 Le Ricette Custodite", de: "📜 Bewahrte Rezepte", en: "📜 Treasured Recipes", es: "📜 Recetas Custodiadas", fr: "📜 Les Recettes Gardées", fa: "📜 دستورهای محافظت‌شده" })}
        subtitle={L({ it: "Sud Italia · Germania · Innovazioni — adattate alle tue dosi + QR", de: "Süditalien · Deutschland · Innovationen + QR", en: "Southern Italy · Germany · Innovations + QR", es: "Sur de Italia · Alemania · Innovaciones + QR", fr: "Sud de l'Italie · Allemagne · Innovations + QR", fa: "جنوب ایتالیا · آلمان · نوآوری‌ها + QR" })} />

      {/* Filtri categoria */}
      <div className="flex flex-wrap gap-2 mt-4 pb-1" data-testid="custodite-filters">
        {CATS.map((c) => (
          <button key={c.id} data-testid={`custodite-cat-${c.id}`} onClick={() => setCat(c.id)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-semibold border transition-all active:scale-95 ${cat === c.id ? "bg-[#ff6b00] text-white border-[#ff6b00]" : "bg-white dark:bg-[#1e1e1e] text-[#ff6b00] dark:text-[#a9d2ec] border-[#2b2b2b] dark:border-[#2e2e2e]"}`}>
            {L(c.label)}
          </button>
        ))}
      </div>

      <div className="grid gap-3 mt-4">
        {list.map((r) => (
          <button key={r.id} data-testid={`custodite-open-${r.id}`} onClick={() => setOpenId(r.id)}
            className="flex items-center gap-3 text-start rounded-2xl overflow-hidden border border-[#2b2b2b] dark:border-[#2e2e2e] bg-white dark:bg-[#1e1e1e] shadow-sm active:scale-98 transition-all hover:border-[#ff6b00]/50">
            <img src={r.img} onError={onImgErr} alt="" className="w-24 h-24 object-cover shrink-0" />
            <div className="py-2 pe-3 min-w-0">
              <p className="font-display font-bold text-[#2B303B] dark:text-[#e4eff8]">{r.flag} {L(r.name)}</p>
              <p className="text-xs text-[#7E8A93] flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" /> {L(r.place)}</p>
              <p className="text-xs text-[#3F4A54] dark:text-[#AEB8BF] mt-1 line-clamp-2">{L(r.story)}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
