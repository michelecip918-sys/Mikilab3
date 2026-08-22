// Restituisce il campo tradotto in tedesco se presente, altrimenti l'originale italiano.
export function rLoc(recipe, field, lang) {
  if (!recipe) return "";
  if (lang === "de") {
    const de = recipe[`${field}_de`];
    if (de != null && String(de).trim() !== "") return de;
  }
  if (lang === "en") {
    const en = recipe[`${field}_en`];
    if (en != null && String(en).trim() !== "") return en;
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
  if ((lang !== "de" && lang !== "en") || !name) return name;
  const MAP = lang === "de" ? INGREDIENT_DE : INGREDIENT_EN;
  const key = String(name).trim().toLowerCase();
  if (MAP[key]) return MAP[key];
  // togli eventuali unità tra parentesi per il match (es. "Olio d'oliva (Öl)")
  const base = key.replace(/\s*\(.*?\)\s*/g, "").trim();
  if (MAP[base]) return MAP[base];
  return name;
}

const INGREDIENT_EN = {
  "zucchero": "Sugar",
  "tuorlo": "Egg yolk",
  "tuorli": "Egg yolks",
  "uovo": "Egg",
  "uova": "Eggs",
  "burro": "Butter",
  "miele": "Honey",
  "pasta d'arancia": "Orange paste",
  "miglioratore naturale": "Natural improver",
  "uvetta": "Raisins",
  "canditi": "Candied fruit",
  "arancia candita": "Candied orange",
  "cedro candito": "Candied citron",
  "semi di sesamo": "Sesame seeds",
  "semi di lino": "Flax seeds",
  "semi di girasole": "Sunflower seeds",
  "semi di zucca": "Pumpkin seeds",
  "semi misti": "Mixed seeds",
  "noci": "Walnuts",
  "nocciole": "Hazelnuts",
  "mandorle": "Almonds",
  "cioccolato": "Chocolate",
  "gocce di cioccolato": "Chocolate chips",
  "vaniglia": "Vanilla",
  "malto": "Malt",
  "olive": "Olives",
  "pomodori secchi": "Sun-dried tomatoes",
  "rosmarino": "Rosemary",
  "patate": "Potatoes",
  "fiocchi di patate": "Potato flakes",
  "latte in polvere": "Milk powder",
  "latte": "Milk",
  "olio d'oliva": "Olive oil",
  "olio extravergine": "Extra virgin olive oil",
  "olio": "Oil",
  "sale": "Salt",
  "acqua": "Water",
  "lievito madre": "Sourdough starter",
  "lievito": "Yeast",
  "cipolle stufate dolci": "Sweet braised onions",
  "cipolla": "Onion",
  "cipolle": "Onions",
  "farro": "Spelt",
  "segale": "Rye",
  "grano duro": "Durum wheat",
  "semola": "Semolina",
  "strutto": "Lard",
  "birra": "Beer",
  "cacao": "Cocoa",
  "cannella": "Cinnamon",
  "scorza di limone": "Lemon zest",
  "scorza d'arancia": "Orange zest",
};

