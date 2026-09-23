import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, Layers, ChevronRight } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { recipesApi } from "@/lib/api";
import { rLoc } from "@/lib/loc";
import { recipeKind, fermentationHours, num } from "@/lib/sitorTools";

// V108 — LE COLLEZIONI. Le 167 ricette raggruppate per come si usano davvero: per il tempo che hai, per il lievito,
// per la tavola, per la terra. Costruite dai dati delle ricette (mai a mano), con una riga di Sitor per ognuna.

const usable = (r) => r && !r.locked && num(r.flour_grams) > 0 && !/migliorator|backmittel|improver/i.test(r.name || "");
const COLL = [
  { k: "due-ore", t: { it: "In due ore", de: "In zwei Stunden", en: "In two hours" }, s: { it: "quando hai fame adesso, non domani", de: "wenn du jetzt Hunger hast, nicht morgen", en: "when you're hungry now, not tomorrow" }, f: (r, F) => F.totalMax > 0 && F.totalMax <= 2.5 },
  { k: "domenica", t: { it: "Il pane grande della domenica", de: "Das große Sonntagsbrot", en: "The big Sunday loaf" }, s: { it: "si inizia il sabato, dura la settimana", de: "am Samstag beginnen, hält die Woche", en: "start on Saturday, lasts the week" }, f: (r, F, k) => k === "pane" && F.totalMax >= 12 },
  { k: "madre", t: { it: "Con il lievito madre", de: "Mit Sauerteig", en: "With sourdough" }, s: { it: "più gusto, più giorni, più pazienza", de: "mehr Geschmack, mehr Tage, mehr Geduld", en: "more flavour, more days, more patience" }, f: (r, F) => F.lm },
  { k: "biga", t: { it: "Con la biga, il metodo di Michele", de: "Mit Biga, Micheles Methode", en: "With biga, Michele's method" }, s: { it: "la sera prima poco lievito, la mattina dopo il profumo", de: "abends wenig Hefe, morgens der Duft", en: "little yeast the night before, the aroma the morning after" }, f: (r, F) => F.hasPre && !F.lm },
  { k: "senza-madre", t: { it: "Senza lievito madre", de: "Ohne Sauerteig", en: "Without sourdough" }, s: { it: "solo lievito di birra, per chi comincia", de: "nur Bäckerhefe, für Anfänger", en: "baker's yeast only, for beginners" }, f: (r, F) => !F.lm && !F.hasPre },
  { k: "pizza", t: { it: "Pizze e focacce", de: "Pizza und Focaccia", en: "Pizzas and focaccias" }, s: { it: "il venerdì sera, e ogni volta che c'è gente", de: "Freitagabend, und immer, wenn Leute da sind", en: "Friday night, and whenever people come" }, f: (r, F, k) => k === "pizza" || k === "focaccia" },
  { k: "panini", t: { it: "Panini e pane in cassetta", de: "Brötchen und Kastenbrot", en: "Rolls and tin loaves" }, s: { it: "per la scuola, il lavoro, la colazione", de: "für Schule, Arbeit, Frühstück", en: "for school, work, breakfast" }, f: (r, F, k) => k === "panini" || k === "laugen" || /cassetta|kasten|toast/i.test(r.name) },
  { k: "dolci", t: { it: "Dolci lievitati", de: "Süßes Hefegebäck", en: "Sweet leavened bakes" }, s: { it: "brioche, trecce, panettoni: la pazienza che si mangia", de: "Brioche, Zöpfe, Panettone: Geduld zum Essen", en: "brioche, plaits, panettone: patience you can eat" }, f: (r, F, k) => k === "dolce" || k === "panettone" },
  { k: "sud", t: { it: "I pani del Sud", de: "Die Brote des Südens", en: "Breads of the South" }, s: { it: "Matera, Altamura, Bari, la Lucania: la casa di Michele", de: "Matera, Altamura, Bari, Lukanien: Micheles Zuhause", en: "Matera, Altamura, Bari, Lucania: Michele's home" }, f: (r) => /matera|altamura|puglia|pugliese|bares|lucan|basilicata|miglionic|calabr|sicil|napol|campan|molis|salent|semola/i.test(`${r.name} ${r.flour_type || ""}`) },
  { k: "germania", t: { it: "Il pane tedesco", de: "Das deutsche Brot", en: "German bread" }, s: { it: "segale, laugen, Brötchen: la seconda casa", de: "Roggen, Laugen, Brötchen: die zweite Heimat", en: "rye, lye rolls, Brötchen: the second home" }, f: (r) => /brötchen|broetchen|brezel|laugen|stollen|roggen|vollkorn|weck|semmel|kasten|zopf|krapfen|dinkel|bauern/i.test(r.name) },
  { k: "idratati", t: { it: "Molto idratati", de: "Sehr feucht", en: "High hydration" }, s: { it: "mollica aperta, mani bagnate: per chi ha già le mani in pasta", de: "offene Krume, nasse Hände: für alle, die schon Teig kennen", en: "open crumb, wet hands: for those already at home with dough" }, f: (r) => num(r.flour_grams) > 0 && (num(r.hydration_percent) || (num(r.water_grams) / num(r.flour_grams)) * 100) >= 75 },
  { k: "semplici", t: { it: "Solo farina, acqua, sale e lievito", de: "Nur Mehl, Wasser, Salz und Hefe", en: "Just flour, water, salt and yeast" }, s: { it: "niente da comprare: il pane vero", de: "nichts zu kaufen: das echte Brot", en: "nothing to buy: real bread" }, f: (r) => !(r.extra_ingredients || []).some((e) => e && e.percent > 0 && !/lievito|hefe|yeast|malto|malz/i.test(e.name || "")) },
];

export default function Collezioni({ onBack, onNav }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const L = (o) => (lang === "de" ? o.de : lang === "en" ? o.en : o.it);
  const [recipes, setRecipes] = useState([]);
  const [open, setOpen] = useState(null);
  useEffect(() => { let ok = true; recipesApi.list("mikilab").then((d) => { if (ok) setRecipes((d || []).filter(usable)); }).catch(() => {}); return () => { ok = false; }; }, []);
  const groups = useMemo(() => COLL.map((c) => ({ ...c, list: recipes.filter((r) => { try { const F = fermentationHours(r); return c.f(r, F, recipeKind(r)); } catch { return false; } }).sort((a, b) => rLoc(a, "name", lang).localeCompare(rLoc(b, "name", lang))) })).filter((c) => c.list.length > 0), [recipes, lang]);
  const openRecipe = (id) => { if (onNav) onNav("recipes"); else window.dispatchEvent(new CustomEvent("mikilab-nav", { detail: { route: "recipes" } })); setTimeout(() => window.dispatchEvent(new CustomEvent("mikilab-open-recipe", { detail: { id } })), 200); };
  const cur = groups.find((g) => g.k === open);
  return (
    <div data-testid="collezioni-page" className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <button data-testid="collezioni-back" onClick={onBack} className="inline-flex items-center gap-1 text-muted-foreground text-sm font-bold"><ChevronLeft className="w-4 h-4" />{tri("Indietro", "Zurück", "Back")}</button>
      <div>
        <p className="font-mono-data text-[10px] tracking-[0.25em] uppercase text-primary flex items-center gap-1.5"><Layers className="w-3 h-3" />MikiLab</p>
        <h1 className="font-display text-2xl font-black text-foreground">{tri("Le collezioni", "Die Sammlungen", "The collections")}</h1>
        <div className="mk-oro-line mt-2 mb-1" />
        <p className="text-sm text-muted-foreground mt-1">{tri("Le ricette raggruppate per come si usano davvero: per il tempo che hai, per il lievito, per la tavola, per la terra. Costruite dalle ricette stesse, non a mano.", "Die Rezepte gruppiert nach ihrem echten Gebrauch: nach Zeit, Triebmittel, Tisch, Herkunft. Aus den Rezepten selbst gebaut, nicht von Hand.", "The recipes grouped by how they're really used: by the time you have, the leavening, the table, the land. Built from the recipes themselves, not by hand.")}</p>
      </div>
      {recipes.length === 0 ? <p className="text-[12px] text-muted-foreground">{tri("Carico le ricette…", "Lade Rezepte…", "Loading recipes…")}</p> : !cur ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {groups.map((g) => <button key={g.k} data-testid={`coll-${g.k}`} onClick={() => setOpen(g.k)} className="text-left rounded-2xl border border-border bg-card p-3 active:scale-[0.99] hover:border-primary/60 transition-all"><p className="font-display text-[16px] font-bold text-foreground leading-tight">{L(g.t)} <span className="font-mono-data text-[12px] text-primary">{g.list.length}</span></p><p className="text-[12px] text-muted-foreground leading-snug mt-0.5">{L(g.s)}</p></button>)}
        </div>
      ) : (
        <div data-testid="coll-detail" className="space-y-2">
          <button data-testid="coll-close" onClick={() => setOpen(null)} className="text-[12.5px] font-bold text-primary">← {tri("Tutte le collezioni", "Alle Sammlungen", "All collections")}</button>
          <p className="font-display text-xl font-bold text-foreground">{L(cur.t)} <span className="font-mono-data text-[13px] text-primary">{cur.list.length}</span></p>
          <p className="text-[12.5px] text-salvia">Sitor: {L(cur.s)}.</p>
          <div className="rounded-2xl border border-border bg-card">{cur.list.map((r) => { const F = fermentationHours(r); return <button key={r.id} data-testid={`coll-r-${r.id}`} onClick={() => openRecipe(r.id)} className="w-full flex items-center gap-2 px-3 py-2.5 text-left border-t border-border first:border-0"><span className="flex-1 min-w-0"><span className="block text-[13.5px] font-bold text-foreground leading-tight">{rLoc(r, "name", lang)}</span><span className="block text-[11.5px] text-muted-foreground">{F.lm ? tri("lievito madre", "Sauerteig", "sourdough") : F.hasPre ? tri("con prefermento", "mit Vorteig", "with preferment") : tri("lievito di birra", "Bäckerhefe", "baker's yeast")}{F.totalMax > 0 ? ` · ≈ ${Math.round(F.totalMax)} h` : ""}</span></span><ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" /></button>; })}</div>
        </div>
      )}
    </div>
  );
}
