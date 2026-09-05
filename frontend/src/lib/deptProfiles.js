// Profili operativi DISTINTI per reparto (direttiva v12 · punto 2).
// Panificazione, Pizzeria e Pasticceria hanno logica, ingredienti tipici,
// parametri d'impasto, target di batch e categorie di magazzino DEDICATE.
import { mkTri } from "@/i18n/triMaps";

export const DEPT_PROFILES = {
  panificazione: {
    id: "panificazione",
    icon: "🍞",
    accent: "#5E8CA8",
    label: (l) => mkTri(l)("Panificazione", "Bäckerei", "Bakery", "Panadería", "Boulangerie", "نانوایی"),
    tagline: (l) => mkTri(l)("Industriale · lotti massivi", "Industriell · Großchargen", "Industrial · bulk batches", "Industrial · lotes grandes", "Industriel · grandes fournées", "صنعتی · دسته‌های انبوه"),
    // Parametri d'impasto tipici (prefill del recipe builder).
    defaults: { method_type: "indiretto", hydration: 65, dough_temp_c: 24, preferment_type: "lm" },
    // Ingredienti tipici del reparto (quick-add con % sul peso farina).
    ingredients: [
      { name: "Lievito Madre", percent: 20 },
      { name: "Miglioratore Naturale Pro", percent: 2 },
      { name: "Malto d'orzo diastasico", percent: 0.5 },
      { name: "Olio d'oliva", percent: 3 },
    ],
    // Categorie di magazzino suggerite.
    warehouse: ["Farina 0", "Farina 00", "Farina Integrale", "Farina di Segale", "Sale marino", "Lievito Madre", "Semi misti"],
    // Target di batch / scala industriale.
    batch: { unit: "kg", target: 40, note: (l) => mkTri(l)("Impasto in vasca 40 kg", "Teig im Kessel 40 kg", "40 kg bowl batch", "Masa en cuba 40 kg", "Cuve 40 kg", "خمیر ۴۰ کیلوگرمی") },
    scaleStep: 0.5,
  },
  pizzeria: {
    id: "pizzeria",
    icon: "🍕",
    accent: "#3E9C93",
    label: () => "Pizzeria",
    tagline: (l) => mkTri(l)("Alta idratazione · assi di fermentazione", "Hohe Hydration · Gärbretter", "High hydration · fermentation boards", "Alta hidratación · tablas de fermentación", "Haute hydratation · planches de pousse", "هیدراسیون بالا · تخته تخمیر"),
    defaults: { method_type: "diretto", hydration: 75, dough_temp_c: 22, preferment_type: "biga" },
    ingredients: [
      { name: "Olio EVO", percent: 3 },
      { name: "Lievito di birra fresco", percent: 0.3 },
      { name: "Malto", percent: 0.5 },
    ],
    warehouse: ["Farina W300", "Farina W400", "Semola rimacinata", "Pomodoro San Marzano", "Mozzarella fiordilatte", "Olio EVO", "Lievito di birra"],
    batch: { unit: "g", target: 270, note: (l) => mkTri(l)("Panetti da 250–280 g", "Teiglinge 250–280 g", "Dough balls 250–280 g", "Bollos 250–280 g", "Pâtons 250–280 g", "چانه‌های ۲۵۰–۲۸۰ گرم") },
    scaleStep: 5,
  },
  pasticceria: {
    id: "pasticceria",
    icon: "🥐",
    accent: "#7FB0A6",
    label: (l) => mkTri(l)("Pasticceria", "Konditorei", "Pastry", "Pastelería", "Pâtisserie", "قنادی"),
    tagline: (l) => mkTri(l)("Precisione al milligrammo · registro di abbattimento", "Milligramm-Präzision · Kühlprotokoll", "Milligram precision · chilling logs", "Precisión al miligramo · registro de abatido", "Précision au milligramme · relevé de refroidissement", "دقت میلی‌گرمی · گزارش سردسازی"),
    defaults: { method_type: "indiretto", hydration: 50, dough_temp_c: 26, preferment_type: "lm" },
    ingredients: [
      { name: "Burro 82% m.g.", percent: 25 },
      { name: "Tuorli", percent: 20 },
      { name: "Zucchero semolato", percent: 22 },
      { name: "Vaniglia Bourbon", percent: 0.5 },
    ],
    warehouse: ["Farina forte W380", "Burro bavarese 82%", "Uova / Tuorli", "Zucchero semolato", "Cioccolato fondente 70%", "Panna 35%", "Vaniglia Bourbon"],
    batch: { unit: "g", target: 1000, note: (l) => mkTri(l)("Bilancia di precisione ±1 g", "Präzisionswaage ±1 g", "Precision scale ±1 g", "Balanza de precisión ±1 g", "Balance de précision ±1 g", "ترازوی دقیق ±۱ گرم") },
    scaleStep: 1,
    chillingLog: true,
  },
};

export function getDeptProfile(dept) {
  return DEPT_PROFILES[dept] || null;
}
