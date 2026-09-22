// V92 — Funzioni comuni degli "attrezzi di Sitor". Tutto gira nel browser: nessuna chiamata di rete,
// nessun dato inviato. Le dosi delle ricette sono lette, mai modificate.
import { ingLoc } from "@/lib/loc";

export const num = (v) => { const n = parseFloat(String(v ?? "").replace(",", ".")); return Number.isFinite(n) ? n : 0; };
export const range = (s) => {
  const m = String(s || "").match(/(\d+(?:[.,]\d+)?)\s*-\s*(\d+(?:[.,]\d+)?)/);
  if (m) return [num(m[1]), num(m[2])];
  const one = String(s || "").match(/(\d+(?:[.,]\d+)?)/);
  return one ? [num(one[1]), num(one[1])] : [0, 0];
};
export const fmt1 = (n) => (Math.round(n * 10) / 10).toString().replace(".", ",");
export const fmtG = (n) => `${Math.round(n)} g`;
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

// Tipo di prodotto, letto dal nome (serve solo per scegliere valori di partenza sensati).
export function recipeKind(r) {
  const n = String((r && r.name) || "").toLowerCase();
  if (/panettone|colomba|pandoro|veneziana/.test(n)) return "panettone";
  if (/pizza|pinsa/.test(n)) return "pizza";
  if (/focaccia|schiacciata|fugassa/.test(n)) return "focaccia";
  if (/brioche|croissant|cornett|treccia|dolce|torta|biscott|krapfen|maritozz|bombolon|ciambell|pan brioche|hefezopf|zopf|stollen/.test(n)) return "dolce";
  if (/laugen|brezel|pretzel/.test(n)) return "laugen";
  if (/panin|brötchen|broetchen|rosett|michett|semmel|burger|bun/.test(n)) return "panini";
  return "pane";
}

// Ingredienti in grammi alla scala richiesta (stessa logica della scheda ricetta). Non tocca la ricetta.
export function computeDough(r, targetFlour) {
  const flour = num(r.flour_grams);
  const f = flour > 0 && num(targetFlour) > 0 ? num(targetFlour) / flour : 1;
  const target = flour * f;
  const g = (v) => Math.round(num(v) * f);
  const pre = r.biga && !r.locked && (r.biga.show || r.preferment_type === "biga" || r.preferment_type === "poolish") ? r.biga : null;
  const biga = pre ? {
    flour: g(pre.flour_g), water: g(pre.water_g), yeast: g(pre.yeast_g),
    kind: pre.kind === "poolish" || r.preferment_type === "poolish" ? "poolish" : "biga",
    hours: range(pre.hours),
  } : null;
  const items = [];
  const ptype = String(r.preferment_type || "").toLowerCase();
  if (flour > 0) items.push({ key: "flour", grams: g(r.flour_grams) - (biga ? biga.flour : 0) });
  if (r.water_grams != null && r.water_grams !== "") items.push({ key: "water", grams: g(r.water_grams) - (biga ? biga.water : 0) });
  if (num(r.sourdough_grams) > 0) items.push({ key: "pre", grams: g(r.sourdough_grams), ptype });
  (r.extra_ingredients || []).forEach((e) => {
    if (!e || !e.name || e.percent == null || e.percent === "") return;
    if (biga && /lievito di birra|hefe|yeast/i.test(e.name) && !/impasto finale|hauptteig|final dough/i.test(e.name)) return;
    if (num(r.sourdough_grams) > 0 && /lievito madre|sauerteig|licoli|sourdough/i.test(e.name)) return;
    const grams = flour > 0 ? Math.round(target * (num(e.percent) / 100)) : 0;
    items.push({ key: "extra", name: e.name, e, grams, percent: num(e.percent) });
  });
  if (r.salt_grams != null && r.salt_grams !== "") items.push({ key: "salt", grams: g(r.salt_grams) });
  const main = items.reduce((a, i) => a + Math.max(0, i.grams), 0);
  const total = main + (biga ? biga.flour + biga.water + biga.yeast : 0);
  const water = num(r.water_grams) * f;
  const hydration = num(r.hydration_percent) || (flour > 0 ? (num(r.water_grams) / flour) * 100 : 0);
  return { f, target, biga, items, total, totalFlour: Math.round(target), totalWater: Math.round(water), hydration };
}

// Nome dell'ingrediente nella lingua scelta.
export function itemLabel(it, t, lang, tri) {
  if (it.key === "flour") return t("ing_flour");
  if (it.key === "water") return t("ing_water");
  if (it.key === "salt") return t("ing_salt");
  if (it.key === "pre") return it.ptype && it.ptype !== "none" && it.ptype !== "biga" ? `${t("ing_preferment")} (${it.ptype})` : t("ing_preferment");
  return (it.e && it.e[`name_${lang}`]) || ingLoc(it.name, lang);
}

// Famiglia di un ingrediente (per prezzi, allergeni, "cosa ho in casa").
export function ingredientFamily(name) {
  const n = String(name || "").toLowerCase();
  if (/lievito di birra|hefe|yeast|levadura/.test(n)) return "yeast";
  if (/lievito madre|sauerteig|licoli|sourdough|pasta madre/.test(n)) return "sourdough";
  if (/burro|butter|beurre/.test(n)) return "butter";
  if (/olio|oil|öl\b|olive/.test(n)) return "oil";
  if (/strutto|schmalz|lard/.test(n)) return "lard";
  if (/tuorl|uov|eigelb|\bei\b|eier|egg/.test(n)) return "eggs";
  if (/latte|milch|milk|panna|sahne|cream|yogurt|joghurt|ricotta|quark|formagg|käse|cheese|mozzarella|parmigiano|pecorino|mascarpone/.test(n)) return "dairy";
  if (/zuccher|zucker|sugar|miele|honig|honey|sciroppo|sirup|malto|malz/.test(n)) return "sugar";
  if (/cioccol|schokol|chocol|cacao|kakao/.test(n)) return "chocolate";
  if (/candit|kandiert|candied|uvett|rosin|raisin|sultan|fico|feige|albicocch|aprikos|prugn|frutta secca|dattel/.test(n)) return "driedfruit";
  if (/mandorl|mandel|almond|nocciol|haselnuss|hazelnut|noci|walnuss|walnut|pistacch|pistaz|pinol|pinien|arachid|erdnuss|peanut|anacard|cashew/.test(n)) return "nuts";
  if (/sesam|sesame|papaver|mohn|poppy|semi|saat|seed|lino|lein|girasole|sonnenblum|zucca|kürbis|chia/.test(n)) return "seeds";
  if (/patat|kartoffel|potato/.test(n)) return "potato";
  if (/semola|semolin|grieß|durum|rimacinat/.test(n)) return "semolina";
  if (/segale|roggen|rye|farro|dinkel|spelt|integrale|vollkorn|whole|avena|hafer|oat|orzo|gerste|barley|grano saraceno|buchweizen|mais|corn|riso|reis|rice|manitoba|farina|mehl|flour/.test(n)) return "flour";
  if (/salam|speck|pancett|prosciutt|schinken|mortadell|wurst|salsicc|salsic|nduja|carne|fleisch|meat/.test(n)) return "meat";
  if (/pomodor|tomat|olive|oliv|cipoll|zwiebel|onion|zucchin|melanzan|pepper|peperon|rosmarin|origano|basilic|erbe|kräuter|aglio|knoblauch|garlic|spinac|verdur|gemüse|veget/.test(n)) return "veg";
  if (/acqua|wasser|water|ghiaccio|eis\b/.test(n)) return "water";
  if (/sale|salz|salt/.test(n)) return "salt";
  if (/birra|bier|beer|vino|wein|wine|rum|liquor|likör/.test(n)) return "drinks";
  if (/canapa|hanf|hemp|curcuma|kurkuma|turmeric|spirulin|carbone|kohle|barbabietol|rote bete|beet|spezie|gewürz|spice|cannell|zimt|vanigl|vanill|anice|finocch|cumino|kümmel/.test(n)) return "spices";
  return "other";
}

// Lievitazione: la velocità circa raddoppia ogni ~8 °C (tra 15 e 32 °C). Sotto i 10 °C quasi si ferma.
export function fermentationFactor(tempC, refC = 25) {
  const t = num(tempC);
  if (t <= 8) return 0.12;
  if (t < 12) return 0.12 + ((t - 8) / 4) * (Math.pow(2, (12 - refC) / 8) - 0.12);
  return Math.pow(2, (t - refC) / 8);
}

export const LS = {
  get(key, fallback) { try { const v = JSON.parse(localStorage.getItem(key)); return v == null ? fallback : v; } catch { return fallback; } },
  set(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* spazio pieno o privato */ } },
  del(key) { try { localStorage.removeItem(key); } catch { /* */ } },
};

export function downloadBlob(blob, filename) {
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.rel = "noopener";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    return true;
  } catch { return false; }
}

export async function shareOrDownload(blob, filename, title) {
  try {
    if (navigator.canShare && typeof File !== "undefined") {
      const file = new File([blob], filename, { type: blob.type });
      if (navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title }); return "shared"; }
    }
  } catch (e) { if (e && e.name === "AbortError") return "cancelled"; }
  return downloadBlob(blob, filename) ? "downloaded" : "failed";
}

export const localeOf = (lang) => (lang === "de" ? "de-DE" : lang === "en" ? "en-GB" : "it-IT");
export const fmtTime = (d, lang) => d.toLocaleTimeString(localeOf(lang), { hour: "2-digit", minute: "2-digit" });
export const fmtDate = (d, lang) => d.toLocaleDateString(localeOf(lang), { weekday: "short", day: "numeric", month: "short" });
export const fmtDateLong = (d, lang) => d.toLocaleDateString(localeOf(lang), { day: "numeric", month: "long", year: "numeric" });

// Ore di lievitazione della ricetta (stessi campi dell'etichetta).
export function fermentationHours(r) {
  const pre = r.biga && (r.biga.show || r.preferment_type === "biga" || r.preferment_type === "poolish") ? r.biga : null;
  const [p1, p2] = pre ? range(pre.hours) : [0, 0];
  const bulk = num(r.bulk_fermentation_hours), proof = num(r.proofing_hours);
  const pt = String(r.preferment_type || "").toLowerCase();
  const lm = pt.includes("lievito madre") || pt === "lm" || pt === "licoli" || num(r.sourdough_grams) > 0;
  const yeast = (r.extra_ingredients || []).some((e) => e && /lievito di birra|hefe|yeast/i.test(e.name || "")) || !!(pre && num(pre.yeast_g));
  return { preMin: p1, preMax: p2, bulk, proof, lm, yeast, hasPre: !!pre, totalMin: p1 + bulk + proof, totalMax: p2 + bulk + proof };
}

// Legge il carattere tipografico "display" del sito (per le cartoline disegnate su canvas).
export function siteFont(className, fallback) {
  try {
    const el = document.createElement("span"); el.className = className; el.style.position = "absolute"; el.style.opacity = "0"; el.textContent = "a";
    document.body.appendChild(el);
    const ff = getComputedStyle(el).fontFamily; el.remove();
    return ff || fallback;
  } catch { return fallback; }
}
