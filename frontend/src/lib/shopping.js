import { mkTri } from "@/i18n/triMaps";
import { rLoc, ingLoc } from "@/lib/loc";

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
      const type = (rLoc(r, "flour_type", lang) || (mkTri(lang)("Farina", "Mehl", "Flour"))).trim();
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
        const label = e[`name_${lang}`] || ingLoc(e.name, lang);
        if (g > 0) extras[label] = (extras[label] || 0) + g;
      }
    });
  });
  return { flourByType, others, extras, anyFlour };
}

export function otherLabel(f, lang) {
  if (f === "water_grams") return mkTri(lang)("Acqua", "Wasser", "Water");
  if (f === "sourdough_grams") return mkTri(lang)("Prefermento/Lievito madre", "Vorteig/Sauerteig", "Preferment/Sourdough");
  return mkTri(lang)("Sale", "Salz", "Salt");
}

export function buildShoppingText(totals, lang) {
  let out = mkTri(lang)("Lista della spesa MikiLab\n\n", "Einkaufsliste MikiLab\n\n", "MikiLab shopping list\n\n");
  out += mkTri(lang)("FARINE:\n", "MEHL:\n", "FLOURS:\n");
  Object.entries(totals.flourByType).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => { out += `  • ${k}: ${fmtQty(v)}\n`; });
  Object.entries(totals.others).forEach(([f, v]) => { out += `  • ${otherLabel(f, lang)}: ${fmtQty(v)}\n`; });
  if (Object.keys(totals.extras).length) {
    out += mkTri(lang)("\nALTRI INGREDIENTI:\n", "\nWEITERE ZUTATEN:\n", "\nOTHER INGREDIENTS:\n");
    Object.entries(totals.extras).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => { out += `  • ${k}: ${fmtQty(v)}\n`; });
  }
  return out.trim();
}

export function hasShoppingData(totals) {
  return totals.anyFlour > 0 || Object.keys(totals.extras).length > 0;
}
