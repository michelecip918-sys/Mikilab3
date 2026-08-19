// Restituisce il campo tradotto in tedesco se presente, altrimenti l'originale italiano.
export function rLoc(recipe, field, lang) {
  if (!recipe) return "";
  if (lang === "de") {
    const de = recipe[`${field}_de`];
    if (de != null && String(de).trim() !== "") return de;
  }
  return recipe[field] ?? "";
}

// Traduzione IT->DE dei nomi ingredienti/extra più comuni in panetteria.
const INGREDIENT_DE = {
  "zucchero": "Zucker",
  "tuorlo": "Eigelb",
  "tuorli": "Eigelb",
  "uovo": "Ei",
  "uova": "Eier",
  "burro": "Butter",
  "miele": "Honig",
  "pasta d'arancia": "Orangenpaste",
  "miglioratore naturale": "natürliches Backmittel",
  "uvetta": "Rosinen",
  "canditi": "kandierte Früchte",
  "arancia candita": "Orangeat",
  "cedro candito": "Zitronat",
  "semi di sesamo": "Sesam",
  "semi di lino": "Leinsamen",
  "semi di girasole": "Sonnenblumenkerne",
  "semi di zucca": "Kürbiskerne",
  "semi misti": "Saatenmischung",
  "noci": "Walnüsse",
  "nocciole": "Haselnüsse",
  "mandorle": "Mandeln",
  "cioccolato": "Schokolade",
  "gocce di cioccolato": "Schokotropfen",
  "vaniglia": "Vanille",
  "malto": "Malz",
  "olive": "Oliven",
  "pomodori secchi": "getrocknete Tomaten",
  "rosmarino": "Rosmarin",
  "patate": "Kartoffeln",
  "fiocchi di patate": "Kartoffelflocken",
  "latte in polvere": "Milchpulver",
  "latte": "Milch",
  "olio d'oliva": "Olivenöl",
  "olio extravergine": "natives Olivenöl",
  "olio": "Öl",
  "sale": "Salz",
  "acqua": "Wasser",
  "lievito madre": "Lievito Madre",
  "lievito": "Hefe",
  "cipolle stufate dolci": "süß geschmorte Zwiebeln",
  "cipolla": "Zwiebel",
  "cipolle": "Zwiebeln",
  "farro": "Dinkel",
  "segale": "Roggen",
  "grano duro": "Hartweizen",
  "semola": "Hartweizengrieß",
  "strutto": "Schmalz",
  "birra": "Bier",
  "cacao": "Kakao",
  "cannella": "Zimt",
  "scorza di limone": "Zitronenschale",
  "scorza d'arancia": "Orangenschale",
};

export function ingLoc(name, lang) {
  if (lang !== "de" || !name) return name;
  const key = String(name).trim().toLowerCase();
  if (INGREDIENT_DE[key]) return INGREDIENT_DE[key];
  // togli eventuali unità tra parentesi per il match (es. "Olio d'oliva (Öl)")
  const base = key.replace(/\s*\(.*?\)\s*/g, "").trim();
  if (INGREDIENT_DE[base]) return INGREDIENT_DE[base];
  return name;
}

