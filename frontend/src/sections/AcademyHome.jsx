import { useState, useEffect } from "react";
import { GraduationCap, Calculator, Wheat, Camera, Printer } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { subscriptionApi } from "@/lib/api";
import { FLOURS, CALC_RECIPES } from "@/data/academy";
import Beginners from "@/sections/Beginners";

export default function AcademyHome({ onNavigate }) {
  const { lang } = useLang();
  const tri = (i, d, e) => (lang === "de" ? d : lang === "en" ? e : i);
  const L = (o) => (o ? o[lang] || o.it : "");
  const [sub, setSub] = useState("ricettario");
  const [status, setStatus] = useState(null);

  useEffect(() => { subscriptionApi.status().then(setStatus).catch(() => setStatus(null)); }, []);

  const diagUsed = status?.diagnosi_used ?? 0;
  const diagLimit = status?.diagnosi_limit;

  const TABS = [
    { id: "ricettario", label: tri("Ricettario", "Rezeptbuch", "Recipes"), Icon: Calculator },
    { id: "farine", label: tri("Farine", "Mehle", "Flours"), Icon: Wheat },
    { id: "diagnosi", label: tri("Diagnosi", "Diagnose", "Diagnosis"), Icon: Camera },
    { id: "corsi", label: tri("Corsi & Quiz", "Kurse & Quiz", "Courses & Quiz"), Icon: GraduationCap },
  ];

  return (
    <div className="pb-4" data-testid="academy-home">
      {/* Hero */}
      <div className="relative rounded-3xl overflow-hidden mb-4 bg-gradient-to-br from-[#6B8E62] to-[#4d6b45] p-6 text-white">
        <GraduationCap className="w-7 h-7 mb-2" />
        <h1 className="font-display text-2xl font-bold">{tri("Impara da Casa", "Von zu Hause lernen", "Learn from Home")}</h1>
        <p className="text-white/85 text-sm mt-1 max-w-md">{tri("La tua Academy: ricettario dinamico, database farine, diagnosi delle cotture e corsi passo-passo.", "Deine Academy: dynamisches Rezeptbuch, Mehl-Datenbank, Back-Diagnose und Schritt-für-Schritt-Kurse.", "Your Academy: dynamic recipe book, flour database, bake diagnosis and step-by-step courses.")}</p>
        {typeof diagLimit === "number" && (
          <div data-testid="academy-diag-usage" className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white/15 border border-white/25 px-3 py-1.5 text-sm font-semibold">
            <Camera className="w-4 h-4" /> {tri("Diagnosi Foto", "Foto-Diagnosen", "Photo diagnoses")}: {diagUsed}/{diagLimit} {tri("questo mese", "diesen Monat", "this month")}
          </div>
        )}
      </div>

      {/* Sub-nav */}
      <div data-testid="academy-subnav" className="grid grid-cols-4 gap-1.5 bg-[#EAF0EC] dark:bg-[#1F252B] p-1.5 rounded-2xl mb-5 border border-[#D7E1DB] dark:border-[#38424B]">
        {TABS.map(({ id, label, Icon }) => {
          const on = sub === id;
          return (
            <button key={id} data-testid={`academy-tab-${id}`} onClick={() => setSub(id)}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${on ? "bg-[#6B8E62] text-white shadow-md" : "text-[#7E8A93] hover:bg-white/60 dark:hover:bg-[#2A323A]"}`}>
              <Icon className="w-4 h-4 shrink-0" /><span className="truncate">{label}</span>
            </button>
          );
        })}
      </div>

      {sub === "ricettario" && <DynamicRecipes />}
      {sub === "farine" && <FlourDB />}
      {sub === "diagnosi" && (
        <div className="space-y-4" data-testid="academy-diagnosi">
          <div className="rounded-2xl bg-white dark:bg-[#232A31] border border-[#D7E1DB] dark:border-[#38424B] p-5 text-center">
            <div className="w-14 h-14 rounded-full bg-[#6B8E62]/15 flex items-center justify-center mx-auto mb-3">
              <Camera className="w-7 h-7 text-[#6B8E62]" />
            </div>
            <p className="font-display text-lg font-bold text-[#2B303B] dark:text-[#EAF0EC]">{tri("Diagnosi Foto IA", "Foto-Diagnose KI", "AI Photo Diagnosis")}</p>
            <p className="text-sm text-[#7E8A93] mt-1 max-w-sm mx-auto">{tri("Scatta o carica una foto del tuo impasto o della crosta: l'IA ti dice cosa correggere in cottura e lievitazione.", "Mach oder lade ein Foto von Teig oder Kruste hoch: die KI sagt dir, was du bei Backen und Gärung korrigieren sollst.", "Take or upload a photo of your dough or crust: the AI tells you what to fix in baking and proofing.")}</p>
            {typeof diagLimit === "number" && (
              <p className="text-xs font-semibold text-[#5E8B7E] mt-2">{tri("Hai usato", "Du hast", "You've used")} {diagUsed}/{diagLimit} {tri("Diagnosi questo mese", "Diagnosen diesen Monat", "diagnoses this month")}</p>
            )}
            <button data-testid="academy-open-diagnosi" onClick={() => onNavigate && onNavigate("diagnosi")}
              className="mt-4 inline-flex items-center gap-2 bg-[#5E8B7E] hover:bg-[#4C7368] text-white font-semibold px-5 py-3 rounded-2xl active:scale-98 transition-all">
              <Camera className="w-5 h-5" /> {tri("Apri Diagnosi Foto", "Foto-Diagnose öffnen", "Open Photo Diagnosis")}
            </button>
          </div>
        </div>
      )}
      {sub === "corsi" && <Beginners />}
    </div>
  );
}

// --- Ricettario dinamico: calcolo dosi da teglia + farina --------------------
function DynamicRecipes() {
  const { lang } = useLang();
  const tri = (i, d, e) => (lang === "de" ? d : lang === "en" ? e : i);
  const L = (o) => (o ? o[lang] || o.it : "");
  const [recipe, setRecipe] = useState(CALC_RECIPES[0].id);
  const [width, setWidth] = useState("30");
  const [length, setLength] = useState("40");
  const [flour, setFlour] = useState("00");

  const r = CALC_RECIPES.find((x) => x.id === recipe) || CALC_RECIPES[0];
  const area = (Number(width) || 0) * (Number(length) || 0);
  const flourG = Math.round(area * r.flourPerCm2);
  const g = (pct) => Math.round(flourG * pct / 100);

  // Scheda ricetta scaricabile/stampabile TRILINGUE (IT · DE · EN) → salva come PDF.
  const downloadPdf = () => {
    const L3 = (o) => ({ it: o.it, de: o.de || o.it, en: o.en || o.it });
    const nm = L3(r.name), ht = L3(r.hint);
    const LBL = {
      it: { flour: "Farina", water: "Acqua", salt: "Sale", oil: "Olio EVO", yeast: "Lievito di birra", tin: "Teglia" },
      de: { flour: "Mehl", water: "Wasser", salt: "Salz", oil: "Olivenöl", yeast: "Frischhefe", tin: "Blech" },
      en: { flour: "Flour", water: "Water", salt: "Salt", oil: "Olive oil", yeast: "Fresh yeast", tin: "Tin" },
    };
    const rows = (lng) => {
      const b = LBL[lng];
      const line = (k, v) => `<tr><td>${k}</td><td style="text-align:right;font-family:monospace">${v} g</td></tr>`;
      let out = line(`<b>${b.flour}</b>`, `<b>${flourG}</b>`) + line(b.water, g(r.bp.water)) + line(b.salt, g(r.bp.salt));
      if (r.bp.oil > 0) out += line(b.oil, g(r.bp.oil));
      out += line(b.yeast, g(r.bp.yeast));
      return out;
    };
    const block = (lng) => `
      <div class="card">
        <h2>${nm[lng]} · ${flour}</h2>
        <p class="sub">${LBL[lng].tin} ${width}×${length} cm</p>
        <table>${rows(lng)}</table>
        <p class="hint">💡 ${ht[lng]}</p>
      </div>`;
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>MikiLab · ${nm.it}</title>
      <style>
        body{font-family:Georgia,serif;color:#2B303B;margin:24px;background:#fff}
        .head{text-align:center;border-bottom:3px solid #6B8E62;padding-bottom:10px;margin-bottom:18px}
        .head h1{margin:0;color:#4d6b45}
        .head p{margin:2px 0 0;color:#7E8A93;font-size:13px}
        .card{border:1px solid #D7E1DB;border-radius:12px;padding:14px 18px;margin-bottom:14px;page-break-inside:avoid}
        .card h2{margin:0 0 2px;font-size:18px}
        .sub{margin:0 0 8px;color:#7E8A93;font-size:12px}
        table{width:100%;border-collapse:collapse}
        td{padding:4px 0;border-bottom:1px solid #EAF0EC;font-size:15px}
        .hint{margin:10px 0 0;color:#4d6b45;font-size:13px}
        .flag{font-size:12px;font-weight:bold;color:#6B8E62;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px}
        .foot{text-align:center;color:#7E8A93;font-size:11px;margin-top:16px}
      </style></head><body>
      <div class="head"><h1>MikiLab · Michele</h1><p>${nm.it} — ${LBL.it.tin} ${width}×${length} cm · ${flour}</p></div>
      <p class="flag">🇮🇹 Italiano</p>${block("it")}
      <p class="flag">🇩🇪 Deutsch</p>${block("de")}
      <p class="flag">🇬🇧 English</p>${block("en")}
      <p class="foot">MikiLab · mikilab.de</p>
      <script>window.onload=function(){setTimeout(function(){window.print();},300);};<\/script>
      </body></html>`;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html);
    w.document.close();
  };

  return (
    <div className="space-y-4" data-testid="dynamic-recipes">
      <div className="rounded-2xl bg-white dark:bg-[#232A31] border border-[#D7E1DB] dark:border-[#38424B] p-4 space-y-3">
        <p className="font-display font-bold text-[#2B303B] dark:text-[#EAF0EC]">{tri("Calcola le dosi", "Mengen berechnen", "Calculate the doses")}</p>
        <div className="grid grid-cols-1 gap-3">
          <label className="text-sm">
            <span className="block text-xs font-semibold text-[#7E8A93] mb-1">{tri("Ricetta", "Rezept", "Recipe")}</span>
            <select data-testid="calc-recipe" value={recipe} onChange={(e) => setRecipe(e.target.value)}
              className="w-full rounded-xl border border-[#D7E1DB] dark:border-[#38424B] bg-white dark:bg-[#1B2127] px-3 py-2.5">
              {CALC_RECIPES.map((c) => <option key={c.id} value={c.id}>{L(c.name)}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">
              <span className="block text-xs font-semibold text-[#7E8A93] mb-1">{tri("Larghezza teglia (cm)", "Blechbreite (cm)", "Tin width (cm)")}</span>
              <input data-testid="calc-width" type="number" value={width} onChange={(e) => setWidth(e.target.value)}
                className="w-full rounded-xl border border-[#D7E1DB] dark:border-[#38424B] bg-white dark:bg-[#1B2127] px-3 py-2.5" />
            </label>
            <label className="text-sm">
              <span className="block text-xs font-semibold text-[#7E8A93] mb-1">{tri("Lunghezza teglia (cm)", "Blechlänge (cm)", "Tin length (cm)")}</span>
              <input data-testid="calc-length" type="number" value={length} onChange={(e) => setLength(e.target.value)}
                className="w-full rounded-xl border border-[#D7E1DB] dark:border-[#38424B] bg-white dark:bg-[#1B2127] px-3 py-2.5" />
            </label>
          </div>
          <label className="text-sm">
            <span className="block text-xs font-semibold text-[#7E8A93] mb-1">{tri("Farina", "Mehl", "Flour")}</span>
            <select data-testid="calc-flour" value={flour} onChange={(e) => setFlour(e.target.value)}
              className="w-full rounded-xl border border-[#D7E1DB] dark:border-[#38424B] bg-white dark:bg-[#1B2127] px-3 py-2.5">
              {FLOURS.map((f) => <option key={f.name} value={f.name}>{f.name} · {f.type_de}</option>)}
            </select>
          </label>
        </div>
      </div>

      {/* Risultato */}
      <div className="print-area rounded-2xl bg-gradient-to-br from-[#6B8E62]/10 to-[#4d6b45]/5 border border-[#6B8E62]/30 p-5" data-testid="calc-result">
        <p className="font-display text-lg font-bold text-[#2B303B] dark:text-[#EAF0EC]">{L(r.name)} · {flour}</p>
        <p className="text-xs text-[#7E8A93] mb-3">{tri("Teglia", "Blech", "Tin")} {width}×{length} cm</p>
        <div className="space-y-1.5 font-mono-data text-sm">
          <Row label={tri("Farina", "Mehl", "Flour")} val={`${flourG} g`} bold />
          <Row label={tri("Acqua", "Wasser", "Water")} val={`${g(r.bp.water)} g`} />
          <Row label={tri("Sale", "Salz", "Salt")} val={`${g(r.bp.salt)} g`} />
          {r.bp.oil > 0 && <Row label={tri("Olio EVO", "Olivenöl", "Olive oil")} val={`${g(r.bp.oil)} g`} />}
          <Row label={tri("Lievito di birra", "Frischhefe", "Fresh yeast")} val={`${g(r.bp.yeast)} g`} />
        </div>
        <p className="text-sm text-[#4d6b45] dark:text-[#9ec48f] mt-3">💡 {L(r.hint)}</p>
      </div>

      <button data-testid="calc-print" onClick={downloadPdf}
        className="w-full flex items-center justify-center gap-2 bg-[#5E8B7E] hover:bg-[#4C7368] text-white font-semibold px-4 py-3 rounded-2xl active:scale-98 transition-all">
        <Printer className="w-5 h-5" /> {tri("Scarica scheda PDF (IT · DE · EN)", "PDF-Karte herunterladen (IT · DE · EN)", "Download recipe card PDF (IT · DE · EN)")}
      </button>
    </div>
  );
}

function Row({ label, val, bold }) {
  return (
    <div className={`flex items-center justify-between ${bold ? "font-bold" : ""}`}>
      <span className="text-[#3F4A54] dark:text-[#AEB8BF]">{label}</span>
      <span className="text-[#33564E] dark:text-[#8FB0C2]">{val}</span>
    </div>
  );
}

// --- Database farine ---------------------------------------------------------
function FlourDB() {
  const { lang } = useLang();
  const tri = (i, d, e) => (lang === "de" ? d : lang === "en" ? e : i);
  const [q, setQ] = useState("");
  const rows = FLOURS.filter((f) => `${f.name} ${f.type_de}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-3" data-testid="flour-db">
      <input data-testid="flour-search" value={q} onChange={(e) => setQ(e.target.value)}
        placeholder={tri("Cerca farina (es. 00, Dinkel, Manitoba)", "Mehl suchen (z.B. 00, Dinkel, Manitoba)", "Search flour (e.g. 00, Dinkel, Manitoba)")}
        className="w-full rounded-xl border border-[#D7E1DB] dark:border-[#38424B] bg-white dark:bg-[#1B2127] px-3 py-2.5 text-sm" />
      <div className="rounded-2xl overflow-hidden border border-[#D7E1DB] dark:border-[#38424B]">
        <div className="grid grid-cols-[1fr_1fr_auto] gap-2 bg-[#EAF0EC] dark:bg-[#1F252B] px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-[#7E8A93]">
          <span>IT</span><span>DE (Type)</span><span>W</span>
        </div>
        {rows.map((f, i) => (
          <div key={f.name} data-testid={`flour-row-${i}`} className="grid grid-cols-[1fr_1fr_auto] gap-2 px-3 py-2.5 text-sm border-t border-[#D7E1DB] dark:border-[#38424B] bg-white dark:bg-[#232A31]">
            <div>
              <p className="font-semibold text-[#2B303B] dark:text-[#EAF0EC]">{f.name}</p>
              <p className="text-xs text-[#7E8A93]">{f.use[lang] || f.use.it}</p>
            </div>
            <span className="text-[#3F4A54] dark:text-[#AEB8BF] self-center">{f.type_de}</span>
            <span className="font-mono-data text-[#33564E] dark:text-[#8FB0C2] self-center">{f.w}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
