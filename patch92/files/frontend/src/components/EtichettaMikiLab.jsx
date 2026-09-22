import { Leaf, Clock, Wheat, Droplets, Info } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// V91 — L'ETICHETTA MIKILAB: cosa c'è dentro e come è fatto, letto dai dati della ricetta.
// Solo FATTI calcolati (ore di lievitazione, quanto lievito, quanto sale, grassi, zucchero, cereali integrali,
// nessun additivo): nessuna promessa sulla salute, per rispettare il Regolamento UE 1924/2006 sui claim.
// Lettura sola: le dosi non vengono mai toccate. Vale per tutte le ricette; per quelle "Provata da Michele"
// è la garanzia in più.

const num = (v) => { const n = parseFloat(String(v ?? "").replace(",", ".")); return Number.isFinite(n) ? n : 0; };
const range = (s) => { const m = String(s || "").match(/(\d+(?:[.,]\d+)?)\s*-\s*(\d+(?:[.,]\d+)?)/); if (m) return [num(m[1]), num(m[2])]; const one = String(s || "").match(/(\d+(?:[.,]\d+)?)/); return one ? [num(one[1]), num(one[1])] : [0, 0]; };
const fmt = (n) => (Math.round(n * 10) / 10).toString().replace(".", ",");

export function computeLabel(r) {
  const flour = num(r.flour_grams) || 1000;
  const ex = Array.isArray(r.extra_ingredients) ? r.extra_ingredients : [];
  const pct = (re) => ex.filter((e) => re.test(String(e.name || "").toLowerCase())).reduce((a, e) => a + num(e.percent), 0);
  const pre = r.biga && (r.biga.show || r.preferment_type === "biga" || r.preferment_type === "poolish") ? r.biga : null;
  const [ph1, ph2] = pre ? range(pre.hours) : [0, 0];
  const bulk = num(r.bulk_fermentation_hours), proof = num(r.proofing_hours);
  const pt = String(r.preferment_type || "").toLowerCase();
  const lm = pt.includes("lievito madre") || pt === "lm" || pt === "licoli" || num(r.sourdough_grams) > 0;
  const yeast = pct(/lievito di birra|hefe|yeast/) + (pre && num(pre.yeast_g) ? (num(pre.yeast_g) / flour) * 100 : 0);
  const salt = num(r.salt_grams) / flour * 100;
  const fat = pct(/olio|burro|butter|margarin|strutto|oil|öl/);
  const sugar = pct(/zucchero|miele|zucker|sugar|honey|sciroppo/);
  const eggs = pct(/uov|ei\b|egg/);
  const ft = String(r.flour_type || "").toLowerCase();
  const whole = /integrale|segale|farro|vollkorn|roggen|dinkel|whole|rye|spelt|cereali|grano saraceno|avena/.test(ft);
  const totMin = ph1 + bulk + proof, totMax = ph2 + bulk + proof;
  return { lm, pt, yeast, salt, fat, sugar, eggs, whole, totMin, totMax, preHours: [ph1, ph2], hasPre: !!pre };
}

export default function EtichettaMikiLab({ recipe }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  if (!recipe || recipe.locked) return null;
  const L = computeLabel(recipe);
  const pills = [];
  if (L.totMax >= 12) pills.push({ ok: true, t: tri("Lievitazione lunga", "Lange Gare", "Long fermentation") });
  if (L.lm) pills.push({ ok: true, t: tri("Lievito madre", "Sauerteig", "Sourdough") });
  else if (L.hasPre) pills.push({ ok: true, t: tri("Prefermento", "Vorteig", "Preferment") });
  if (L.yeast > 0 && L.yeast <= 0.5) pills.push({ ok: true, t: tri("Pochissimo lievito", "Sehr wenig Hefe", "Very little yeast") });
  if (L.whole) pills.push({ ok: true, t: tri("Cereali integrali", "Vollkorn", "Wholegrain") });
  if (L.sugar === 0) pills.push({ ok: true, t: tri("Zucchero: nessuno", "Zucker: keiner", "Sugar: none") });
  if (L.fat === 0) pills.push({ ok: true, t: tri("Grassi aggiunti: nessuno", "Zugesetztes Fett: keins", "Added fat: none") });
  if (L.eggs === 0) pills.push({ ok: true, t: tri("Senza uova", "Ohne Eier", "No eggs") });
  pills.push({ ok: true, t: tri("Nessun additivo", "Keine Zusatzstoffe", "No additives") });
  const rows = [
    L.totMax > 0 && { Icon: Clock, k: tri("Lievitazione totale", "Gesamte Gare", "Total fermentation"), v: L.totMin === L.totMax ? `≈ ${fmt(L.totMax)} h` : `≈ ${fmt(L.totMin)}-${fmt(L.totMax)} h` },
    { Icon: Leaf, k: tri("Come lievita", "Wie er geht", "How it rises"), v: L.lm ? tri("lievito madre", "Sauerteig", "sourdough starter") : L.hasPre ? tri(`${L.pt || "prefermento"} di ${fmt(L.preHours[0])}${L.preHours[1] !== L.preHours[0] ? `-${fmt(L.preHours[1])}` : ""} h`, `${L.pt || "Vorteig"} über ${fmt(L.preHours[0])}${L.preHours[1] !== L.preHours[0] ? `-${fmt(L.preHours[1])}` : ""} h`, `${L.pt || "preferment"} of ${fmt(L.preHours[0])}${L.preHours[1] !== L.preHours[0] ? `-${fmt(L.preHours[1])}` : ""} h`) : tri("impasto diretto", "direkte Führung", "direct dough") },
    L.yeast > 0 && { Icon: Leaf, k: tri("Lievito di birra", "Backhefe", "Baker's yeast"), v: `${fmt(L.yeast)} %` + tri(" sulla farina", " auf Mehl", " of flour") },
    { Icon: Droplets, k: tri("Sale", "Salz", "Salt"), v: `${fmt(L.salt)} g` + tri(" ogni 100 g di farina", " je 100 g Mehl", " per 100 g flour") },
    L.fat > 0 && { Icon: Droplets, k: tri("Grassi aggiunti", "Zugesetztes Fett", "Added fat"), v: `${fmt(L.fat)} %` },
    L.sugar > 0 && { Icon: Droplets, k: tri("Zuccheri aggiunti", "Zugesetzter Zucker", "Added sugars"), v: `${fmt(L.sugar)} %` },
    { Icon: Wheat, k: tri("Farina", "Mehl", "Flour"), v: recipe.flour_type || "—" },
  ].filter(Boolean);
  const michele = L.hasPre && L.preHours[0] >= 12 || L.lm;

  return (
    <section data-testid="etichetta-mikilab" className="rounded-2xl border border-salvia/40 bg-salvia/8 p-3.5 no-print">
      <p className="font-mono-data text-[10px] tracking-[0.25em] uppercase text-salvia mb-1.5">{tri("L'etichetta MikiLab", "Das MikiLab-Etikett", "The MikiLab label")}</p>
      <div className="flex flex-wrap gap-1.5 mb-2">{pills.map((p, i) => <span key={i} className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-background border border-salvia/40 text-foreground">{p.t}</span>)}</div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[12px]">
        {rows.map((x, i) => (<div key={i} className="contents"><dt className="text-muted-foreground flex items-center gap-1"><x.Icon className="w-3 h-3" />{x.k}</dt><dd className="text-foreground font-semibold">{x.v}</dd></div>))}
      </dl>
      {michele && <p className="text-[12px] text-foreground/85 mt-2">{tri("Metodo di Michele: il prefermento o il lievito madre lavorano almeno 12 ore. Più gusto, più durata, meno lievito.", "Micheles Methode: Vorteig oder Sauerteig arbeiten mindestens 12 Stunden. Mehr Geschmack, längere Haltbarkeit, weniger Hefe.", "Michele's method: the preferment or sourdough works at least 12 hours. More flavour, longer keeping, less yeast.")}</p>}
      <p className="text-[10px] text-muted-foreground mt-2 flex items-start gap-1"><Info className="w-3 h-3 mt-0.5 shrink-0" />{tri("Valori calcolati dalla ricetta: sono fatti sul procedimento, non un'etichetta nutrizionale né un consiglio medico.", "Aus dem Rezept berechnet: Fakten zur Herstellung, kein Nährwertetikett und kein medizinischer Rat.", "Calculated from the recipe: facts about the method, not a nutrition label nor medical advice.")}</p>
    </section>
  );
}
