import { useState, useEffect } from "react";
import { GraduationCap, Calculator, Wheat, Camera, Printer, Crown, CheckCircle2 } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { subscriptionApi } from "@/lib/api";
import { FLOURS, CALC_RECIPES } from "@/data/academy";
import Beginners from "@/sections/Beginners";
import { mkTri } from "@/i18n/triMaps";

export default function AcademyHome({ onNavigate }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const L = (o) => (o ? o[lang] || o.en || o.it : "");
  const [sub, setSub] = useState("ricettario");
  const [status, setStatus] = useState(null);
  const [pathDone, setPathDone] = useState(() => { try { return JSON.parse(localStorage.getItem("mikilab_impara_path") || "[]"); } catch { return []; } });

  useEffect(() => { subscriptionApi.status().then(setStatus).catch(() => setStatus(null)); }, []);
  useEffect(() => {
    if (["ricettario", "farine", "corsi"].includes(sub) && !pathDone.includes(sub)) {
      const nx = [...pathDone, sub];
      setPathDone(nx);
      localStorage.setItem("mikilab_impara_path", JSON.stringify(nx));
    }
    // eslint-disable-next-line
  }, [sub]);

  const diagUsed = status?.diagnosi_used ?? 0;
  const diagLimit = status?.diagnosi_limit;

  const upgradePro = async () => {
    try {
      const d = await subscriptionApi.checkout("monthly", "lab");
      if (d.url) window.location.href = d.url;
    } catch (e) { /* noop */ }
  };

  const TABS = [
    { id: "ricettario", label: tri("Ricettario", "Rezeptbuch", "Recipes"), Icon: Calculator },
    { id: "farine", label: tri("Farine", "Mehle", "Flours"), Icon: Wheat },
    { id: "diagnosi", label: tri("Diagnosi", "Diagnose", "Diagnosis"), Icon: Camera },
    { id: "corsi", label: tri("Corsi & Quiz", "Kurse & Quiz", "Courses & Quiz"), Icon: GraduationCap },
  ];

  return (
    <div className="pb-4" data-testid="academy-home">
      {/* Hero */}
      <div className="relative rounded-3xl overflow-hidden mb-4 bg-gradient-to-br from-[#2f6a97] to-[#325046] p-6 text-white">
        <div className="it-de-ribbon absolute top-0 left-0 right-0" />
        <GraduationCap className="w-7 h-7 mb-2" />
        <h1 className="font-display text-2xl font-bold">{tri("Impara da Casa", "Von zu Hause lernen", "Learn from Home")}</h1>
        <div className="h-1 w-12 rounded-full bg-[#ff6b00] mt-1.5" />
        <p className="text-white/85 text-sm mt-1 max-w-md">{tri("La tua Academy: ricettario dinamico, database farine, diagnosi delle cotture e corsi passo-passo.", "Deine Academy: dynamisches Rezeptbuch, Mehl-Datenbank, Back-Diagnose und Schritt-für-Schritt-Kurse.", "Your Academy: dynamic recipe book, flour database, bake diagnosis and step-by-step courses.")}</p>
        {typeof diagLimit === "number" && (
          <div data-testid="academy-diag-usage" className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white/15 border border-white/25 px-3 py-1.5 text-sm font-semibold">
            <Camera className="w-4 h-4" /> {tri("Diagnosi Foto", "Foto-Diagnosen", "Photo diagnoses")}: {diagUsed}/{diagLimit} {tri("questo mese", "diesen Monat", "this month")}
          </div>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold"><Wheat className="w-3.5 h-3.5" /> {FLOURS.length} {tri("farine", "Mehle", "flours")}</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold"><Calculator className="w-3.5 h-3.5" /> {CALC_RECIPES.length} {tri("ricette calcolabili", "berechenbare Rezepte", "calculable recipes")}</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold"><Camera className="w-3.5 h-3.5" /> {tri("Diagnosi IA", "KI-Diagnose", "AI Diagnosis")}</span>
        </div>
      </div>

      {/* Percorso guidato: da dove inizio? */}
      <div data-testid="academy-path" className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold uppercase tracking-wide text-[#7E8A93]">{tri("Il tuo percorso", "Dein Lernpfad", "Your path")}</p>
          <span data-testid="academy-path-progress" className="text-xs font-bold text-[#ff6b00]">{pathDone.filter((x) => ["ricettario", "farine", "corsi"].includes(x)).length}/3 {tri("completati", "erledigt", "done")}</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: "ricettario", n: "1", Icon: Calculator, t: tri("Calcola le dosi", "Mengen berechnen", "Calculate doses") },
            { id: "farine", n: "2", Icon: Wheat, t: tri("Scegli la farina", "Mehl wählen", "Pick the flour") },
            { id: "corsi", n: "3", Icon: GraduationCap, t: tri("Segui i corsi", "Kurse folgen", "Take the courses") },
          ].map(({ id, n, Icon, t: label }) => {
            const done = pathDone.includes(id);
            return (
              <button key={id} data-testid={`academy-path-${id}`} onClick={() => setSub(id)}
                className={`group relative rounded-2xl border p-3 text-left active:scale-97 transition-all ${done ? "bg-[#ff6b00]/12 border-[#ff6b00]/50" : "bg-white dark:bg-[#1e1e1e] border-[#2b2b2b] dark:border-[#2e2e2e] hover:border-[#ff6b00]/60"}`}>
                {done && <CheckCircle2 className="absolute top-2 right-2 w-4 h-4 text-[#ff6b00]" data-testid={`academy-path-done-${id}`} />}
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${done ? "bg-[#ff6b00] text-white" : "bg-[#e4eff8] dark:bg-[#181818] text-[#ff6b00]"}`}>{done ? "✓" : n}</span>
                  <Icon className="w-4 h-4 text-[#ff6b00]" />
                </div>
                <p className="text-xs font-semibold text-[#2B303B] dark:text-[#e4eff8] leading-snug">{label}</p>
              </button>
            );
          })}
        </div>
        {pathDone.filter((x) => ["ricettario", "farine", "corsi"].includes(x)).length === 3 && (
          <div data-testid="academy-path-complete" className="mt-3 rounded-2xl bg-gradient-to-br from-[#ff6b00] to-[#ff6b00] text-white p-4 text-center shadow-lg">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-2"><CheckCircle2 className="w-7 h-7" /></div>
            <p className="font-display text-lg font-bold">🎉 {tri("Percorso completato!", "Pfad abgeschlossen!", "Path complete!")}</p>
            <p className="text-sm text-white/85 mt-0.5">{tri("Hai sbloccato il badge «Fornaio Diplomato». Sei pronto per Il Tuo Laboratorio!", "Du hast das Abzeichen «Diplom-Bäcker» freigeschaltet. Bereit für deine Backstube!", "You unlocked the «Certified Baker» badge. Ready for Your Lab!")}</p>
            <span className="inline-block mt-2 text-[11px] font-bold bg-white/20 px-3 py-1 rounded-full uppercase tracking-wide">🏅 {tri("Fornaio Diplomato", "Diplom-Bäcker", "Certified Baker")}</span>
          </div>
        )}
      </div>

      {/* Sub-nav */}
      <div data-testid="academy-subnav" className="grid grid-cols-4 gap-1.5 bg-[#e4eff8] dark:bg-[#181818] p-1.5 rounded-2xl mb-5 border border-[#2b2b2b] dark:border-[#2e2e2e]">
        {TABS.map(({ id, label, Icon }) => {
          const on = sub === id;
          const isQuiz = id === "corsi";
          return (
            <button key={id} data-testid={`academy-tab-${id}`} onClick={() => setSub(id)}
              className={`relative flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${on ? "bg-[#ff6b00] text-white shadow-md" : isQuiz ? "text-[#ff6b00] dark:text-[#ff6b00] bg-[#ff6b00]/15 ring-2 ring-[#ff6b00]/60" : "text-[#7E8A93] hover:bg-white/60 dark:hover:bg-[#242424]"}`}>
              <Icon className="w-4 h-4 shrink-0" /><span className="truncate">{label}</span>
              {isQuiz && !on && <span className="absolute -top-1.5 -right-1 text-[9px] font-black bg-[#ff6b00] text-white px-1.5 py-0.5 rounded-full leading-none">🎯</span>}
            </button>
          );
        })}
      </div>

      {sub === "ricettario" && <DynamicRecipes />}
      {sub === "farine" && <FlourDB />}
      {sub === "diagnosi" && (
        <div className="space-y-4" data-testid="academy-diagnosi">
          <div className="rounded-2xl bg-white dark:bg-[#1e1e1e] border border-[#2b2b2b] dark:border-[#2e2e2e] p-5 text-center">
            <div className="w-14 h-14 rounded-full bg-[#ff6b00]/15 flex items-center justify-center mx-auto mb-3">
              <Camera className="w-7 h-7 text-[#ff6b00]" />
            </div>
            <p className="font-display text-lg font-bold text-[#2B303B] dark:text-[#e4eff8]">{tri("Diagnosi Foto IA", "Foto-Diagnose KI", "AI Photo Diagnosis")}</p>
            <p className="text-sm text-[#7E8A93] mt-1 max-w-sm mx-auto">{tri("Scatta o carica una foto del tuo impasto o della crosta: l'IA ti dice cosa correggere in cottura e lievitazione.", "Mach oder lade ein Foto von Teig oder Kruste hoch: die KI sagt dir, was du bei Backen und Gärung korrigieren sollst.", "Take or upload a photo of your dough or crust: the AI tells you what to fix in baking and proofing.")}</p>
            {typeof diagLimit === "number" && (
              <p className="text-xs font-semibold text-[#ff6b00] mt-2">{tri("Hai usato", "Du hast", "You've used")} {diagUsed}/{diagLimit} {tri("Diagnosi questo mese", "Diagnosen diesen Monat", "diagnoses this month")}</p>
            )}
            {typeof diagLimit === "number" && diagLimit > 0 && diagUsed >= diagLimit ? (
              <div data-testid="diagnosi-limit-upsell" className="mt-4 rounded-2xl bg-[#242424]/10 border border-[#242424]/30 p-4">
                <p className="text-sm font-semibold text-[#242424]">{tri("Hai finito le Diagnosi del mese!", "Deine Diagnosen sind aufgebraucht!", "You've used all your diagnoses this month!")}</p>
                <p className="text-xs text-[#7E8A93] mt-1">{tri("Passa a PRO per Diagnosi illimitate e tutti gli strumenti del laboratorio.", "Wechsle zu PRO für unbegrenzte Diagnosen und alle Labor-Tools.", "Go PRO for unlimited diagnoses and all lab tools.")}</p>
                <button data-testid="diagnosi-upgrade-pro" onClick={upgradePro}
                  className="mt-3 inline-flex items-center gap-2 bg-[#242424] hover:bg-[#963c1f] text-white font-semibold px-4 py-2.5 rounded-xl active:scale-98 transition-all">
                  <Crown className="w-4 h-4" /> {tri("Passa a PRO · €29,99/mese", "PRO · €29,99/Monat", "Go PRO · €29.99/month")}
                </button>
              </div>
            ) : (
              <button data-testid="academy-open-diagnosi" onClick={() => onNavigate && onNavigate("diagnosi")}
                className="mt-4 inline-flex items-center gap-2 bg-[#ff6b00] hover:bg-[#336a94] text-white font-semibold px-5 py-3 rounded-2xl active:scale-98 transition-all">
                <Camera className="w-5 h-5" /> {tri("Apri Diagnosi Foto", "Foto-Diagnose öffnen", "Open Photo Diagnosis")}
              </button>
            )}
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
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const L = (o) => (o ? o[lang] || o.en || o.it : "");
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
        .head{text-align:center;border-bottom:3px solid #ff6b00;padding-bottom:10px;margin-bottom:18px}
        .head h1{margin:0;color:#ff6b00}
        .head p{margin:2px 0 0;color:#7E8A93;font-size:13px}
        .card{border:1px solid #2b2b2b;border-radius:12px;padding:14px 18px;margin-bottom:14px;page-break-inside:avoid}
        .card h2{margin:0 0 2px;font-size:18px}
        .sub{margin:0 0 8px;color:#7E8A93;font-size:12px}
        table{width:100%;border-collapse:collapse}
        td{padding:4px 0;border-bottom:1px solid #e4eff8;font-size:15px}
        .hint{margin:10px 0 0;color:#ff6b00;font-size:13px}
        .flag{font-size:12px;font-weight:bold;color:#ff6b00;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px}
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
      <div className="rounded-2xl bg-white dark:bg-[#1e1e1e] border border-[#2b2b2b] dark:border-[#2e2e2e] p-4 space-y-3">
        <p className="font-display font-bold text-[#2B303B] dark:text-[#e4eff8]">{tri("Calcola le dosi", "Mengen berechnen", "Calculate the doses")}</p>
        <div className="grid grid-cols-1 gap-3">
          <label className="text-sm">
            <span className="block text-xs font-semibold text-[#7E8A93] mb-1">{tri("Ricetta", "Rezept", "Recipe")}</span>
            <select data-testid="calc-recipe" value={recipe} onChange={(e) => setRecipe(e.target.value)}
              className="w-full rounded-xl border border-[#2b2b2b] dark:border-[#2e2e2e] bg-white dark:bg-[#121212] px-3 py-2.5">
              {CALC_RECIPES.map((c) => <option key={c.id} value={c.id}>{L(c.name)}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">
              <span className="block text-xs font-semibold text-[#7E8A93] mb-1">{tri("Larghezza teglia (cm)", "Blechbreite (cm)", "Tin width (cm)")}</span>
              <input data-testid="calc-width" type="number" value={width} onChange={(e) => setWidth(e.target.value)}
                className="w-full rounded-xl border border-[#2b2b2b] dark:border-[#2e2e2e] bg-white dark:bg-[#121212] px-3 py-2.5" />
            </label>
            <label className="text-sm">
              <span className="block text-xs font-semibold text-[#7E8A93] mb-1">{tri("Lunghezza teglia (cm)", "Blechlänge (cm)", "Tin length (cm)")}</span>
              <input data-testid="calc-length" type="number" value={length} onChange={(e) => setLength(e.target.value)}
                className="w-full rounded-xl border border-[#2b2b2b] dark:border-[#2e2e2e] bg-white dark:bg-[#121212] px-3 py-2.5" />
            </label>
          </div>
          <label className="text-sm">
            <span className="block text-xs font-semibold text-[#7E8A93] mb-1">{tri("Farina", "Mehl", "Flour")}</span>
            <select data-testid="calc-flour" value={flour} onChange={(e) => setFlour(e.target.value)}
              className="w-full rounded-xl border border-[#2b2b2b] dark:border-[#2e2e2e] bg-white dark:bg-[#121212] px-3 py-2.5">
              {FLOURS.map((f) => <option key={f.name} value={f.name}>{f.name} · {f.type_de}</option>)}
            </select>
          </label>
        </div>
      </div>

      {/* Risultato */}
      <div className="print-area rounded-2xl bg-gradient-to-br from-[#ff6b00]/10 to-[#ff6b00]/5 border border-[#ff6b00]/30 p-5" data-testid="calc-result">
        <p className="font-display text-lg font-bold text-[#2B303B] dark:text-[#e4eff8]">{L(r.name)} · {flour}</p>
        <p className="text-xs text-[#7E8A93] mb-3">{tri("Teglia", "Blech", "Tin")} {width}×{length} cm</p>
        <div className="space-y-1.5 font-mono-data text-sm">
          <Row label={tri("Farina", "Mehl", "Flour")} val={`${flourG} g`} bold />
          <Row label={tri("Acqua", "Wasser", "Water")} val={`${g(r.bp.water)} g`} />
          <Row label={tri("Sale", "Salz", "Salt")} val={`${g(r.bp.salt)} g`} />
          {r.bp.oil > 0 && <Row label={tri("Olio EVO", "Olivenöl", "Olive oil")} val={`${g(r.bp.oil)} g`} />}
          <Row label={tri("Lievito di birra", "Frischhefe", "Fresh yeast")} val={`${g(r.bp.yeast)} g`} />
        </div>
        <p className="text-sm text-[#ff6b00] dark:text-[#a9d2ec] mt-3">💡 {L(r.hint)}</p>
      </div>

      <button data-testid="calc-print" onClick={downloadPdf}
        className="w-full flex items-center justify-center gap-2 bg-[#ff6b00] hover:bg-[#336a94] text-white font-semibold px-4 py-3 rounded-2xl active:scale-98 transition-all">
        <Printer className="w-5 h-5" /> {tri("Scarica scheda PDF (IT · DE · EN)", "PDF-Karte herunterladen (IT · DE · EN)", "Download recipe card PDF (IT · DE · EN)")}
      </button>
    </div>
  );
}

function Row({ label, val, bold }) {
  return (
    <div className={`flex items-center justify-between ${bold ? "font-bold" : ""}`}>
      <span className="text-[#3F4A54] dark:text-[#AEB8BF]">{label}</span>
      <span className="text-[#ff6b00] dark:text-[#8FB0C2]">{val}</span>
    </div>
  );
}

// --- Database farine ---------------------------------------------------------
function FlourDB() {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const [q, setQ] = useState("");
  const rows = FLOURS.filter((f) => `${f.name} ${f.type_de}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-3" data-testid="flour-db">
      <input data-testid="flour-search" value={q} onChange={(e) => setQ(e.target.value)}
        placeholder={tri("Cerca farina (es. 00, Dinkel, Manitoba)", "Mehl suchen (z.B. 00, Dinkel, Manitoba)", "Search flour (e.g. 00, Dinkel, Manitoba)")}
        className="w-full rounded-xl border border-[#2b2b2b] dark:border-[#2e2e2e] bg-white dark:bg-[#121212] px-3 py-2.5 text-sm" />
      <div className="rounded-2xl overflow-hidden border border-[#2b2b2b] dark:border-[#2e2e2e]">
        <div className="grid grid-cols-[1fr_1fr_auto] gap-2 bg-[#e4eff8] dark:bg-[#181818] px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-[#7E8A93]">
          <span>IT</span><span>DE (Type)</span><span>W</span>
        </div>
        {rows.map((f, i) => (
          <div key={f.name} data-testid={`flour-row-${i}`} className="grid grid-cols-[1fr_1fr_auto] gap-2 px-3 py-2.5 text-sm border-t border-[#2b2b2b] dark:border-[#2e2e2e] bg-white dark:bg-[#1e1e1e]">
            <div>
              <p className="font-semibold text-[#2B303B] dark:text-[#e4eff8]">{f.name}</p>
              <p className="text-xs text-[#7E8A93]">{f.use[lang] || f.use.it}</p>
            </div>
            <span className="text-[#3F4A54] dark:text-[#AEB8BF] self-center">{f.type_de}</span>
            <span className="font-mono-data text-[#ff6b00] dark:text-[#8FB0C2] self-center">{f.w}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
