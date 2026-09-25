// V87 — Ogni ricetta ha un INDIRIZZO VERO: mikilab.de/ricetta/<id>/<nome>. Quando si apre una scheda,
// l'indirizzo cambia (senza ricaricare), il titolo della pagina diventa quello della ricetta, i meta
// Open Graph mostrano la foto della ricetta quando il link viene incollato su WhatsApp/TikTok/Telegram,
// e viene aggiunto un blocco JSON-LD schema.org/Recipe così Google può mostrare la ricetta con foto
// nei risultati. Tutto lato client, nessun dato al server.
import { applyMeta } from "@/i18n/meta";
import { rLoc } from "@/lib/loc";
import { setLastRecipe } from "@/lib/bottega";

export function recipeSlug(name) {
  return String(name || "ricetta").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "ricetta";
}
export function recipePath(recipe, lang) { return `/ricetta/${recipe.id}/${recipeSlug(rLoc(recipe, "name", lang))}`; }
// Legge l'id dalla barra degli indirizzi: /ricetta/<id>/... oppure ?r=<id>
export function recipeIdFromLocation() {
  try {
    const p = window.location.pathname || "";
    const m = p.match(/^\/ricetta\/([^/]+)/i);
    if (m) return decodeURIComponent(m[1]);
    const q = new URLSearchParams(window.location.search).get("r");
    return q || null;
  } catch { return null; }
}

function setMeta(sel, attr, val) {
  let el = document.head.querySelector(sel);
  if (!el) { el = document.createElement("meta"); const [a, v] = sel.replace(/^meta\[/, "").replace(/\]$/, "").split("="); el.setAttribute(a, v.replace(/["']/g, "")); document.head.appendChild(el); }
  el.setAttribute(attr, val);
}
function setLink(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) { el = document.createElement("link"); el.setAttribute("rel", rel); document.head.appendChild(el); }
  el.setAttribute("href", href);
}
const LD_ID = "mikilab-recipe-ld";

export function applyRecipeSeo(recipe, lang) {
  if (typeof document === "undefined" || !recipe) return;
  try {
    const origin = window.location.origin;
    const name = rLoc(recipe, "name", lang);
    const notes = String(rLoc(recipe, "notes", lang) || "").replace(/\s+/g, " ").trim();
    const desc = (notes || `${name} — MikiLab`).slice(0, 155);
    const img = recipe.image_url ? (recipe.image_url.startsWith("http") ? recipe.image_url : origin + recipe.image_url) : `${origin}/hero-ricette.jpg`;
    const url = origin + recipePath(recipe, lang);
    document.title = `${name} — MikiLab`;
    setLastRecipe({ id: recipe.id, name, ts: Date.now() }); // V88: "ricomincia da dove eri"
    setMeta('meta[name="description"]', "content", desc);
    setMeta('meta[property="og:title"]', "content", `${name} — MikiLab`);
    setMeta('meta[property="og:description"]', "content", desc);
    setMeta('meta[property="og:image"]', "content", img);
    setMeta('meta[property="og:url"]', "content", url);
    setMeta('meta[property="og:type"]', "content", "article");
    setMeta('meta[name="twitter:title"]', "content", `${name} — MikiLab`);
    setMeta('meta[name="twitter:description"]', "content", desc);
    setMeta('meta[name="twitter:image"]', "content", img);
    setLink("canonical", url);
    if (window.location.pathname !== recipePath(recipe, lang)) window.history.replaceState(window.history.state, "", recipePath(recipe, lang));
    // JSON-LD schema.org/Recipe (solo campi pubblici: nome, foto, tempi, ingredienti base, categoria)
    const ing = [];
    if (recipe.flour_grams) ing.push(`${recipe.flour_grams} g ${rLoc(recipe, "flour_type", lang) || "farina"}`);
    if (recipe.water_grams) ing.push(`${recipe.water_grams} g ${lang === "de" ? "Wasser" : lang === "en" ? "water" : "acqua"}`);
    if (recipe.salt_grams) ing.push(`${recipe.salt_grams} g ${lang === "de" ? "Salz" : lang === "en" ? "salt" : "sale"}`);
    if (recipe.sourdough_grams) ing.push(`${recipe.sourdough_grams} g ${lang === "de" ? "Sauerteig" : lang === "en" ? "sourdough starter" : "lievito madre"}`);
    const totMin = Math.round(((Number(recipe.bulk_fermentation_hours) || 0) + (Number(recipe.proofing_hours) || 0)) * 60) + (Number(recipe.mix_minutes) || 0) + (Number(recipe.rest_minutes) || 0) + (Number(recipe.bake_minutes) || 0);
    const ld = {
      "@context": "https://schema.org", "@type": "Recipe", name, image: [img], description: desc, url,
      author: { "@type": "Person", name: "Michele (MikiLab)" }, publisher: { "@type": "Organization", name: "MikiLab", url: origin, logo: { "@type": "ImageObject", url: origin + "/icon-512.png" } },
      inLanguage: lang === "de" ? "de" : lang === "en" ? "en" : "it", recipeCategory: recipe.menu_category || "pane", recipeCuisine: recipe.origin && String(recipe.origin).toLowerCase() === "de" ? "German" : "Italian",
      keywords: ["pane", "lievito madre", "focaccia", "pizza", "MikiLab", "Sitor"].join(", "),
      recipeIngredient: ing, isAccessibleForFree: true,
    };
    // V106: ingredienti extra in grammi, istruzioni passo per passo, resa, tempo di preparazione (campi che Google chiede)
    try {
      const fg = Number(recipe.flour_grams) || 0;
      for (const e of (recipe.extra_ingredients || [])) {
        if (!e || !e.name) continue;
        const nm = (lang === "de" && e.name_de) || (lang === "en" && e.name_en) || e.name;
        const g = e.percent != null && fg > 0 ? Math.round(fg * Number(e.percent) / 100) : null;
        ing.push(g ? `${g} g ${nm}` : String(nm));
      }
      const proc = String((lang === "de" && recipe.procedure_de) || (lang === "en" && recipe.procedure_en) || recipe.procedure || "");
      const steps = proc.split(/\n+|(?<=[.!?])\s+(?=[A-ZÀ-ÜÄÖÜ0-9])/).map((t) => t.replace(/^\s*(\d+[.)]|[-•*])\s*/, "").trim()).filter((t) => t.length > 12).slice(0, 25);
      if (steps.length) ld.recipeInstructions = steps.map((t, i) => ({ "@type": "HowToStep", position: i + 1, text: t.slice(0, 400) }));
      const tot = fg + (Number(recipe.water_grams) || 0) + (Number(recipe.salt_grams) || 0) + (Number(recipe.sourdough_grams) || 0) + (recipe.extra_ingredients || []).reduce((acc, e) => acc + (e && e.percent != null ? fg * Number(e.percent) / 100 : 0), 0);
      if (tot > 0) ld.recipeYield = lang === "de" ? `ca. ${Math.round(tot)} g Teig` : lang === "en" ? `about ${Math.round(tot)} g of dough` : `circa ${Math.round(tot)} g di impasto`;
      const prep = (Number(recipe.mix_minutes) || 0) + (Number(recipe.rest_minutes) || 0);
      if (prep > 0) ld.prepTime = `PT${prep}M`;
      ld.datePublished = recipe.created_at ? String(recipe.created_at).slice(0, 10) : "2026-09-01";
    } catch { /* */ }
    if (totMin > 0) ld.totalTime = `PT${totMin}M`;
    if (recipe.bake_minutes) ld.cookTime = `PT${recipe.bake_minutes}M`;
    let s = document.getElementById(LD_ID);
    if (!s) { s = document.createElement("script"); s.type = "application/ld+json"; s.id = LD_ID; document.head.appendChild(s); }
    s.textContent = JSON.stringify(ld);
  } catch { /* */ }
}

export function clearRecipeSeo(lang) {
  if (typeof document === "undefined") return;
  try {
    const s = document.getElementById(LD_ID); if (s) s.remove();
    const c = document.head.querySelector('link[rel="canonical"]'); if (c) c.setAttribute("href", window.location.origin + "/");
    setMeta('meta[property="og:type"]', "content", "website");
    if (/^\/ricetta\//i.test(window.location.pathname)) window.history.replaceState(window.history.state, "", "/");
    applyMeta(lang);
  } catch { /* */ }
}
