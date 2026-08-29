// Categorie ricette condivise (usate da RecipeList e AdminPanel).
// Macro-categorie rigide Mickey Lab: Basi tecniche, Pasticceria Lievitata & Viennoiserie,
// Pane & Panificati, Focacce & Grandi Lievitati Salati, Snack & Sfizi Salati.
export const BASI_ORDER = ["Miglioratore Naturale Pro", "Lievito Madre Solido", "LiCoLi (Lievito in Coltura Liquida)", "Lievito Madre di Segale", "Poolish", "Farina Cotta (Kochstück)"];

export const CATS = [
  { key: "basi", label: "cat_basi", icon: "✨" },
  { key: "viennoiserie", label: "cat_viennoiserie", icon: "🥐" },
  { key: "pane", label: "cat_pane", icon: "🍞" },
  { key: "focacce", label: "cat_focacce", icon: "🫓" },
  { key: "snack", label: "cat_snack", icon: "🥨" },
];

// Colore identificativo per categoria (badge/icone nelle liste ricette). Toni caldi distinti su fondo nero.
export const CAT_COLORS = {
  basi: "#F0B429",
  viennoiserie: "#E8823A",
  pane: "#C77D48",
  focacce: "#7FA650",
  snack: "#D06A4A",
};

// Parole chiave che identificano un prodotto di pasticceria lievitata / viennoiserie / grande lievitato dolce.
const VIENNOISERIE_RE = /croissant|cornett|panettone|colomba|pandoro|veneziana|stollen|danish|plunder|brioche|sfogliat|pain au|kranz|zopf|treccia dolce|babka|maritozz|girella|saccottino|kipferl/i;

export function recipeCategory(r) {
  const cat = r.menu_category;
  const name = (r.name || "").toLowerCase();

  // 1) Basi & Lieviti (cartella tecnica)
  if (cat === "basi" || (!cat && /migliorator|backmittel|lievito madre|poolish|kochst|licoli/.test(name))) {
    const sub = BASI_ORDER.indexOf(r.name);
    return { rank: 0, sub: sub < 0 ? 99 : sub, key: "basi", label: "cat_basi", icon: "✨" };
  }

  // Categoria esplicita: ha priorità assoluta (rispetta la classificazione dell'admin)
  if (cat === "viennoiserie" || cat === "panettoni") {
    return { rank: 1, sub: /panettone|colomba|pandoro/.test(name) ? 1 : 0, key: "viennoiserie", label: "cat_viennoiserie", icon: "🥐" };
  }
  if (cat === "focacce") return { rank: 3, sub: 0, key: "focacce", label: "cat_focacce", icon: "🫓" };
  if (cat === "snack") return { rank: 4, sub: 0, key: "snack", label: "cat_snack", icon: "🥨" };
  if (cat === "pane" || cat === "panini") {
    const isBaguette = /baguette|filo di francia|ficelle|bacchett/.test(name);
    return { rank: 2, sub: isBaguette ? 0 : 1, key: "pane", label: "cat_pane", icon: "🍞" };
  }

  // Nessuna categoria: euristica sul nome. La viennoiserie dolce prevale.
  if (VIENNOISERIE_RE.test(name)) {
    return { rank: 1, sub: /panettone|colomba|pandoro/.test(name) ? 1 : 0, key: "viennoiserie", label: "cat_viennoiserie", icon: "🥐" };
  }
  const isBaguette = /baguette|filo di francia|ficelle|bacchett/.test(name);
  return { rank: 2, sub: isBaguette ? 0 : 1, key: "pane", label: "cat_pane", icon: "🍞" };
}
