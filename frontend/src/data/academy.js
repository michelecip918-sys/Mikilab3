// Academy "Impara da Casa" — mentori, video tutorial (trilingui via sottotitoli), database farine.
// I video usano embed YouTube con sottotitoli attivabili in IT/DE/EN (CC automatici).

export const MENTORS = [
  {
    id: "martesana",
    name: "Martesana Milano",
    role: { it: "Grandi Lievitati & Pasticceria", de: "Große Hefegebäcke & Konditorei", en: "Big Leavened & Pastry" },
    field: "pasticceria",
    color: "#242424",
    bio: {
      it: "Maestri del panettone e dei grandi lievitati: metodo professionale, cura del lievito madre e delle glasse.",
      de: "Meister von Panettone und großen Hefegebäcken: professionelle Methode, Sauerteig- und Glasurpflege.",
      en: "Masters of panettone and big leavened cakes: professional method, sourdough and glaze care.",
    },
  },
  {
    id: "caterina",
    name: "Ricette di Caterina",
    role: { it: "Lievito Madre & Pane di Casa", de: "Sauerteig & Hausbrot", en: "Sourdough & Home Bread" },
    field: "panificazione",
    color: "#5aa0cf",
    bio: {
      it: "Gestione del lievito madre passo-passo e pane semplice da fare a casa, con parole facili.",
      de: "Sauerteigpflege Schritt für Schritt und einfaches Hausbrot, in einfachen Worten.",
      en: "Step-by-step sourdough management and simple home bread, in easy words.",
    },
  },
  {
    id: "parisi",
    name: "Chef Billy Parisi",
    role: { it: "Focacce & Impasti in Teglia", de: "Focaccia & Blechteige", en: "Focaccia & Pan Doughs" },
    field: "panificazione",
    color: "#6E8CA0",
    bio: {
      it: "Focacce alte e alveolate, pizza in teglia e impasti ad alta idratazione spiegati chiaramente.",
      de: "Hohe, luftige Focaccia, Blechpizza und Teige mit hoher Hydration klar erklärt.",
      en: "Tall, airy focaccia, pan pizza and high-hydration doughs explained clearly.",
    },
  },
  {
    id: "breadritual",
    name: "Bread Ritual",
    role: { it: "Pasta Madre da Zero", de: "Sauerteig von Grund auf", en: "Starter from Scratch" },
    field: "panificazione",
    color: "#9E7B4F",
    bio: {
      it: "Come nasce una pasta madre senza additivi e come tenerla viva, giorno per giorno.",
      de: "Wie ein Sauerteig ohne Zusätze entsteht und Tag für Tag lebendig bleibt.",
      en: "How a sourdough starter is born without additives and kept alive, day by day.",
    },
  },
];

// difficulty: "facile" | "intermedio" | "avanzato"
export const ACADEMY_VIDEOS = [
  {
    id: "v-sponge", mentor: "caterina", yt: "SCmgZw4QXE4", difficulty: "facile", duration: "12 min",
    field: "panificazione", subs: ["it", "de", "en"], isNew: false,
    title: { it: "Impasto e prefermento: la partenza", de: "Teig & Vorteig: der Start", en: "Dough & preferment: the start" },
    desc: { it: "Il primo passo: come partire con un prefermento (sponge) per un impasto più saporito.",
            de: "Der erste Schritt: mit einem Vorteig (Sponge) für mehr Geschmack starten.",
            en: "The first step: starting with a preferment (sponge) for a tastier dough." },
  },
  {
    id: "v-lm", mentor: "caterina", yt: "eN6BnMnfRUE", difficulty: "intermedio", duration: "18 min",
    field: "panificazione", subs: ["it", "de", "en"], isNew: true,
    title: { it: "Lievito madre: gestione e rinfreschi", de: "Sauerteig: Führung & Auffrischen", en: "Sourdough: management & refreshing" },
    desc: { it: "Come rinfrescare il lievito madre e capire quando è pronto per l'impasto.",
            de: "Wie man den Sauerteig auffrischt und erkennt, wann er bereit ist.",
            en: "How to refresh your starter and tell when it's ready to bake." },
  },
  {
    id: "v-starter", mentor: "breadritual", yt: "GSJmK9IU4tQ", difficulty: "facile", duration: "15 min",
    field: "panificazione", subs: ["it", "de", "en"], isNew: false,
    title: { it: "Pasta madre da zero, senza additivi", de: "Sauerteig von Grund auf, ohne Zusätze", en: "Sourdough from scratch, no additives" },
    desc: { it: "Crea la tua pasta madre in pochi giorni, solo farina e acqua.",
            de: "Erstelle deinen Sauerteig in wenigen Tagen, nur Mehl und Wasser.",
            en: "Create your starter in a few days, just flour and water." },
  },
  {
    id: "v-focaccia", mentor: "parisi", yt: "nyu15TqG038", difficulty: "facile", duration: "14 min",
    field: "panificazione", subs: ["it", "de", "en"], isNew: false,
    title: { it: "Focaccia con biga: crosta e alveoli", de: "Focaccia mit Biga: Kruste & Poren", en: "Focaccia with biga: crust & holes" },
    desc: { it: "Focaccia alta e leggera con biga: idratazione, pieghe e cottura in teglia.",
            de: "Hohe, leichte Focaccia mit Biga: Hydration, Falten und Backen im Blech.",
            en: "Tall, light focaccia with biga: hydration, folds and pan baking." },
  },
  {
    id: "v-panettone", mentor: "martesana", yt: "nwCiW_BH3lU", difficulty: "avanzato", duration: "22 min",
    field: "pasticceria", subs: ["it", "de", "en"], isNew: true,
    title: { it: "Panettone artigianale: metodo professionale", de: "Handwerklicher Panettone: Profi-Methode", en: "Artisan panettone: professional method" },
    desc: { it: "Il grande lievitato passo-passo: primo e secondo impasto, pirlatura e cottura.",
            de: "Das große Hefegebäck Schritt für Schritt: erster und zweiter Teig, Rundwirken, Backen.",
            en: "The big leavened cake step-by-step: first and second dough, shaping and baking." },
  },
  {
    id: "v-taglio", mentor: "martesana", yt: "C_7Xft7HRVQ", difficulty: "avanzato", duration: "10 min",
    field: "pasticceria", subs: ["it", "de", "en"], isNew: false,
    title: { it: "Cottura e taglio del grande lievitato", de: "Backen & Anschnitt großer Hefegebäcke", en: "Baking & scoring of big leavened cakes" },
    desc: { it: "Cottura, capovolgimento e taglio perfetto del panettone.",
            de: "Backen, Kopfüber-Hängen und perfekter Anschnitt des Panettone.",
            en: "Baking, hanging upside-down and the perfect panettone cut." },
  },
];

// Database farine: corrispondenze IT/DE, forza (W), uso consigliato.
export const FLOURS = [
  { name: "00", type_de: "Type 405", w: "150–220", use: { it: "Dolci, sfoglia, biscotti", de: "Kuchen, Blätterteig, Kekse", en: "Cakes, puff pastry, biscuits" } },
  { name: "0", type_de: "Type 550", w: "220–280", use: { it: "Pane comune, pizza veloce", de: "Alltagsbrot, schnelle Pizza", en: "Everyday bread, quick pizza" } },
  { name: "0 forte", type_de: "Type 550 stark", w: "300–350", use: { it: "Pizza a lunga lievitazione, focaccia", de: "Pizza mit langer Gare, Focaccia", en: "Long-fermented pizza, focaccia" } },
  { name: "1", type_de: "Type 812", w: "260–320", use: { it: "Pane rustico, semi-integrale", de: "Rustikales Brot, halbvoll", en: "Rustic bread, semi-wholemeal" } },
  { name: "2", type_de: "Type 1050", w: "200–260", use: { it: "Pane rustico saporito", de: "Kräftiges rustikales Brot", en: "Flavourful rustic bread" } },
  { name: "Integrale", type_de: "Vollkorn", w: "180–240", use: { it: "Pane integrale, alto contenuto di fibra", de: "Vollkornbrot, ballaststoffreich", en: "Wholemeal bread, high fibre" } },
  { name: "Manitoba", type_de: "Type 550 (W380+)", w: "350–420", use: { it: "Grandi lievitati, panettone", de: "Große Hefegebäcke, Panettone", en: "Big leavened cakes, panettone" } },
  { name: "Farro (Dinkel) chiaro", type_de: "Dinkel Type 630", w: "180–240", use: { it: "Pane di farro delicato", de: "Feines Dinkelbrot", en: "Delicate spelt bread" } },
  { name: "Farro (Dinkel) scuro", type_de: "Dinkel Type 1050", w: "160–220", use: { it: "Pane di farro rustico", de: "Rustikales Dinkelbrot", en: "Rustic spelt bread" } },
  { name: "Segale", type_de: "Roggen Type 1150", w: "—", use: { it: "Pane di segale, Sauerteig", de: "Roggenbrot, Sauerteig", en: "Rye bread, sourdough" } },
  { name: "Semola rimacinata", type_de: "Hartweizen", w: "200–260", use: { it: "Pane di semola, Altamura", de: "Hartweizenbrot, Altamura", en: "Durum bread, Altamura" } },
];

// Ricettario dinamico: ricette base con teglie e percentuali del fornaio.
// Le dosi si calcolano dal peso farina scelto in base a teglia + spessore.
export const CALC_RECIPES = [
  {
    id: "focaccia", flourPerCm2: 0.55,   // g di farina per cm² di teglia (spessore medio)
    name: { it: "Focaccia in teglia", de: "Focaccia im Blech", en: "Pan focaccia" },
    bp: { water: 80, salt: 2.5, oil: 5, yeast: 1 },  // % sul peso farina
    hint: { it: "Impasto morbido, 2 ore di lievitazione + 1 in teglia.", de: "Weicher Teig, 2 Std Gare + 1 im Blech.", en: "Soft dough, 2h proof + 1h in the tin." },
  },
  {
    id: "pizza", flourPerCm2: 0.35,
    name: { it: "Pizza in teglia", de: "Blechpizza", en: "Pan pizza" },
    bp: { water: 70, salt: 2.5, oil: 3, yeast: 0.5 },
    hint: { it: "Alta idratazione, 24h in frigo per più gusto.", de: "Hohe Hydration, 24 Std im Kühlschrank.", en: "High hydration, 24h in the fridge for more flavour." },
  },
  {
    id: "pane", flourPerCm2: 0.9,
    name: { it: "Pane casereccio", de: "Hausbrot", en: "Home bread" },
    bp: { water: 68, salt: 2, oil: 0, yeast: 1 },
    hint: { it: "Pieghe ogni 30 min, cottura con vapore.", de: "Falten alle 30 Min, mit Dampf backen.", en: "Folds every 30 min, bake with steam." },
  },
];
