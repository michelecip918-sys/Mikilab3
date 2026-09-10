import { useState } from "react";
import { Flame, Loader2, Wrench, AlertTriangle, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { playTTS } from "@/lib/tts";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// FASE 10 · Supporto forni a legna & macchinari datati — Sitor ricalcola tempi/temperature.
const PRESETS = ["forno a legna", "impastatrice a bracci datata", "cella frigo datata", "forno statico anni '80"];

export default function LegacyOven({ operator }) {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [eq, setEq] = useState("");
  const [recipe, setRecipe] = useState("");
  const [detail, setDetail] = useState("");
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState(null);

  const run = async () => {
    if (!eq.trim() || busy) return;
    setBusy(true); setRes(null);
    try {
      const { data } = await api.post("/mike/legacy-adapt", { equipment: eq, recipe_name: recipe || null, detail: detail || null, lang }, { timeout: 45000 });
      setRes(data);
      try { if (data.summary) playTTS(data.summary, { lang, voice: "mikemix" }); } catch { /* */ }
    } catch { setRes({ summary: tri("Riprova.", "Nochmal.", "Try again.", "Reintenta.", "Réessaie.", "دوباره.") , adjustments: [], warnings: [] }); }
    setBusy(false);
  };

  return (
    <div data-testid="legacy-oven" className="space-y-3">
      <div className="flex items-center gap-2">
        <Flame className="w-5 h-5 text-[#FFB800]" />
        <div><h4 className="font-cyber text-sm font-black text-white uppercase tracking-wide">{tri("Forni a Legna & Macchinari Datati", "Holzöfen & alte Maschinen", "Wood Ovens & Legacy Machines", "Hornos de Leña & Máquinas Antiguas", "Fours à Bois & Machines Anciennes", "تنور هیزمی و ماشین‌های قدیمی")}</h4>
        <p className="text-[10.5px] text-[#94A3B8]">{tri("Sitor ricalcola tempi, velocità e temperature per compensare i limiti.", "Sitor passt Zeiten, Tempo und Temperaturen an.", "Sitor recomputes times, speed and temperatures to compensate.", "Sitor recalcula tiempos y temperaturas.", "Sitor recalcule les temps et températures.", "Sitor زمان و دما را بازمحاسبه می‌کند.")}</p></div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <button key={p} data-testid={`legacy-preset-${p.slice(0,6)}`} onClick={() => setEq(p)}
            className={`px-2.5 py-1 rounded-full text-[10.5px] font-bold border active:scale-95 transition-all ${eq === p ? "bg-[#FFB800] text-[#060A10] border-[#FFB800]" : "bg-[#060A10] text-[#94A3B8] border-[#1e293b]"}`}>{p}</button>
        ))}
      </div>
      <input data-testid="legacy-eq" value={eq} onChange={(e) => setEq(e.target.value)} placeholder={tri("Attrezzatura", "Ausrüstung", "Equipment", "Equipo", "Équipement", "تجهیزات")}
        className="w-full rounded-lg bg-[#060A10] border border-[#1e293b] text-white text-sm px-3 py-2 focus:border-[#FFB800] outline-none" />
      <div className="flex flex-col sm:flex-row gap-2">
        <input data-testid="legacy-recipe" value={recipe} onChange={(e) => setRecipe(e.target.value)} placeholder={tri("Ricetta (opz.)", "Rezept (opt.)", "Recipe (opt.)", "Receta (opc.)", "Recette (opt.)", "دستور")}
          className="flex-1 rounded-lg bg-[#060A10] border border-[#1e293b] text-white text-sm px-3 py-2 focus:border-[#FFB800] outline-none" />
        <input data-testid="legacy-detail" value={detail} onChange={(e) => setDetail(e.target.value)} placeholder={tri("Note (es. arriva a 220°C)", "Notiz (z.B. max 220°C)", "Notes (e.g. reaches 220°C)", "Notas (máx 220°C)", "Notes (max 220°C)", "یادداشت")}
          className="flex-1 rounded-lg bg-[#060A10] border border-[#1e293b] text-white text-sm px-3 py-2 focus:border-[#FFB800] outline-none" />
      </div>
      <button data-testid="legacy-run" onClick={run} disabled={busy || !eq.trim()}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm text-[#060A10] active:scale-95 transition-all disabled:opacity-50"
        style={{ background: "linear-gradient(90deg,#FFB800,#EAB308)" }}>
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wrench className="w-4 h-4" />} {tri("Adatta con Sitor", "Mit Sitor anpassen", "Adapt with Sitor", "Adaptar con Sitor", "Adapter avec Sitor", "تنظیم با Sitor")}
      </button>
      {res && (
        <div data-testid="legacy-result" className="rounded-lg border border-[#FFB800]/30 bg-[#FFB800]/6 p-3 space-y-2">
          {res.summary && <p className="flex items-start gap-1.5 text-[12.5px] text-[#f3e6c4] leading-snug"><Sparkles className="w-4 h-4 text-[#FFB800] shrink-0 mt-0.5" />{res.summary}</p>}
          {(res.adjustments || []).map((a, i) => (
            <div key={i} className="text-[12px] text-[#c5d3df]"><span className="font-bold text-white">{a.param}:</span> {a.value} <span className="text-[#94A3B8]">— {a.why}</span></div>
          ))}
          {(res.warnings || []).map((w, i) => (
            <p key={i} className="flex items-center gap-1.5 text-[11.5px] font-bold text-[#f59e0b]"><AlertTriangle className="w-3.5 h-3.5" /> {w}</p>
          ))}
        </div>
      )}
    </div>
  );
}
