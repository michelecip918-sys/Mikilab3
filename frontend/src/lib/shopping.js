import { rLoc } from "@/lib/loc";

const GRAM_FIELDS = ["flour_grams", "water_grams", "sourdough_grams", "salt_grams"];

export function fmtQty(g) {
  if (g >= 1000) return `${(g / 1000).toFixed(2)} kg`;
  return `${Math.round(g)} g`;
}

// items: [{ recipe_id, grams }]  (grams = peso totale impasto in g)
export function computeShopping(items, recipeById, lang) {
  const flourByType = {};
  const others = {};
  const extras = {};
  let anyFlour = 0;
  items.forEach((it) => {
    const r = recipeById[it.recipe_id];
    const totalDough = Number(it.grams || 0);
    if (!r || totalDough <= 0) return;
    const recTotal = GRAM_FIELDS.reduce((s, f) => s + Number(r[f] || 0), 0);
    if (recTotal <= 0) return;
    const factor = totalDough / recTotal;
    const flourG = Number(r.flour_grams || 0) * factor;
    if (flourG > 0) {
      const type = (rLoc(r, "flour_type", lang) || (lang === "de" ? "Mehl" : lang === "en" ? "Flour" : "Farina")).trim();
      flourByType[type] = (flourByType[type] || 0) + flourG;
      anyFlour += flourG;
    }
    ["water_grams", "sourdough_grams", "salt_grams"].forEach((f) => {
      const g = Number(r[f] || 0) * factor;
      if (g > 0) others[f] = (others[f] || 0) + g;
    });
    (r.extra_ingredients || []).forEach((e) => {
      if (e && e.name && e.percent != null && e.percent !== "") {
        const g = Number(r.flour_grams || 0) * factor * (Number(e.percent) / 100);
        if (g > 0) extras[e.name] = (extras[e.name] || 0) + g;
      }
    });
  });
  return { flourByType, others, extras, anyFlour };
}

export function otherLabel(f, lang) {
  if (f === "water_grams") return lang === "de" ? "Wasser" : lang === "en" ? "Water" : "Acqua";
  if (f === "sourdough_grams") return lang === "de" ? "Vorteig/Sauerteig" : lang === "en" ? "Preferment/Sourdough" : "Prefermento/Lievito madre";
  return lang === "de" ? "Salz" : lang === "en" ? "Salt" : "Sale";
}

export function buildShoppingText(totals, lang) {
  let out = lang === "de" ? "Einkaufsliste Mikilab\n\n" : lang === "en" ? "Mikilab shopping list\n\n" : "Lista della spesa Mikilab\n\n";
  out += lang === "de" ? "MEHL:\n" : lang === "en" ? "FLOURS:\n" : "FARINE:\n";
  Object.entries(totals.flourByType).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => { out += `  • ${k}: ${fmtQty(v)}\n`; });
  Object.entries(totals.others).forEach(([f, v]) => { out += `  • ${otherLabel(f, lang)}: ${fmtQty(v)}\n`; });
  if (Object.keys(totals.extras).length) {
    out += lang === "de" ? "\nWEITERE ZUTATEN:\n" : lang === "en" ? "\nOTHER INGREDIENTS:\n" : "\nALTRI INGREDIENTI:\n";
    Object.entries(totals.extras).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => { out += `  • ${k}: ${fmtQty(v)}\n`; });
  }
  return out.trim();
}

export function hasShoppingData(totals) {
  return totals.anyFlour > 0 || Object.keys(totals.extras).length > 0;
}
