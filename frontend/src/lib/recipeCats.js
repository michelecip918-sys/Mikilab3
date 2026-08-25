// Categorie ricette condivise (usate da RecipeList e AdminPanel).
export const BASI_ORDER = ["Miglioratore Naturale Pro", "Lievito Madre Solido", "LiCoLi (Lievito in Coltura Liquida)", "Lievito Madre di Segale", "Poolish", "Farina Cotta (Kochstück)"];

export const CATS = [
  { key: "basi", label: "cat_basi", icon: "✨" },
  { key: "pane", label: "cat_pane", icon: "🍞" },
  { key: "panini", label: "cat_panini", icon: "🥖" },
  { key: "snack", label: "cat_snack", icon: "🥨" },
  { key: "focacce", label: "cat_focacce", icon: "🫓" },
  { key: "panettoni", label: "cat_panettoni", icon: "🎁" },
];

export function recipeCategory(r) {
  const cat = r.menu_category;
  const name = (r.name || "").toLowerCase();
  if (cat === "basi" || (!cat && /migliorator|backmittel|lievito madre|poolish|kochst/.test(name))) {
    const sub = BASI_ORDER.indexOf(r.name);
    return { rank: 0, sub: sub < 0 ? 99 : sub, key: "basi", label: "cat_basi", icon: "✨" };
  }
  if (cat === "panettoni" || (!cat && /panettone/.test(name))) return { rank: 5, sub: 0, key: "panettoni", label: "cat_panettoni", icon: "🎁" };
  if (cat === "focacce") return { rank: 4, sub: 0, key: "focacce", label: "cat_focacce", icon: "🫓" };
  if (cat === "snack") return { rank: 3, sub: 0, key: "snack", label: "cat_snack", icon: "🥨" };
  if (cat === "panini") return { rank: 2, sub: 0, key: "panini", label: "cat_panini", icon: "🥖" };
  const isBaguette = /baguette|filo di francia|ficelle|bacchett/.test(name);
  return { rank: 1, sub: isBaguette ? 0 : 1, key: "pane", label: "cat_pane", icon: "🍞" };
}
