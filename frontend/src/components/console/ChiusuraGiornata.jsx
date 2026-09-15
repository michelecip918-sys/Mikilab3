import { useEffect, useMemo, useState } from "react";
import { ClipboardCheck, Loader2, TrendingUp, Lightbulb, BrainCircuit, Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";
import { productionApi, weeklyApi } from "@/lib/api";

const DAYS = ["lun", "mar", "mer", "gio", "ven", "sab", "dom"];
const DAY_LABEL = { lun: "Lunedì", mar: "Martedì", mer: "Mercoledì", gio: "Giovedì", ven: "Venerdì", sab: "Sabato", dom: "Domenica" };

const num = (v) => { const n = parseFloat(String(v).replace(",", ".")); return isNaN(n) ? 0 : n; };

export default function ChiusuraGiornata() {
  const todayKey = DAYS[(new Date().getDay() + 6) % 7];
  const [day, setDay] = useState(todayKey);
  const [lines, setLines] = useState([]);
  const [corrections, setCorrections] = useState([]);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  const [memory, setMemory] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const wp = await weeklyApi.get();
        const batches = ((wp?.days || {})[day] || {}).batches || [];
        const agg = {};
        batches.forEach((b) => {
          const nm = (b.product || "").trim(); if (!nm) return;
          agg[nm] = (agg[nm] || 0) + num(b.qty);
        });
        // Unisci i log registrati dagli operai in produzione (auto-compilazione).
        let logs = [];
        try { const lg = await productionApi.logList(); logs = lg.logs || []; } catch { /* */ }
        const logMap = {};
        logs.forEach((l) => { logMap[l.recipe_name.trim().toLowerCase()] = l; });
        const names = new Set([...Object.keys(agg), ...logs.map((l) => l.recipe_name)]);
        setLines([...names].filter(Boolean).map((recipe_name) => {
          const lg = logMap[recipe_name.trim().toLowerCase()];
          return { recipe_name, planned: agg[recipe_name] || 0, produced: lg ? lg.produced : (agg[recipe_name] || 0), leftover: lg ? lg.leftover : 0, unit_cost: "", unit_price: "" };
        }));
      } catch { setLines([]); }
      try { const s = await productionApi.planSuggestions(day); setSuggestions(s.suggestions || []); } catch { /* */ }
    })();
    setResult(null);
  }, [day]);

  useEffect(() => { (async () => { try { const m = await productionApi.memoryList(); setMemory(m.memories || []); } catch { /* */ } })(); }, [result]);

  const patch = (i, p) => setLines((L) => L.map((l, k) => (k === i ? { ...l, ...p } : l)));
  const addLine = () => setLines((L) => [...L, { recipe_name: "", planned: 0, produced: 0, leftover: 0, unit_cost: "", unit_price: "" }]);
  const delLine = (i) => setLines((L) => L.filter((_, k) => k !== i));
  const addCorr = () => setCorrections((C) => [...C, { recipe_name: "", change: "", temp_c: "", flour_lot: "" }]);
  const patchCorr = (i, p) => setCorrections((C) => C.map((c, k) => (k === i ? { ...c, ...p } : c)));
  const delCorr = (i) => setCorrections((C) => C.filter((_, k) => k !== i));

  const preview = useMemo(() => {
    let rev = 0, cost = 0;
    lines.forEach((l) => { rev += num(l.produced) * num(l.unit_price); cost += num(l.produced) * num(l.unit_cost); });
    return { rev: Math.round(rev * 100) / 100, cost: Math.round(cost * 100) / 100, margin: Math.round((rev - cost) * 100) / 100, fc: rev > 0 ? Math.round((cost / rev) * 1000) / 10 : null };
  }, [lines]);

  const submit = async () => {
    setSaving(true);
    try {
      const payload = {
        day_key: day, note,
        lines: lines.filter((l) => l.recipe_name.trim()).map((l) => ({
          recipe_name: l.recipe_name.trim(), planned: num(l.planned), produced: num(l.produced),
          leftover: num(l.leftover), unit_cost: num(l.unit_cost), unit_price: num(l.unit_price),
        })),
        corrections: corrections.filter((c) => c.change.trim()).map((c) => ({
          recipe_name: c.recipe_name.trim(), change: c.change.trim(), temp_c: c.temp_c, flour_lot: c.flour_lot,
        })),
      };
      const d = await productionApi.dayClose(payload);
      setResult(d);
      setSuggestions(d.suggestions || []);
      toast.success(`Giornata chiusa · Food-cost ${d.food_cost.food_cost_pct ?? "—"}%`);
    } catch { toast.error("Chiusura non riuscita, riprova."); }
    finally { setSaving(false); }
  };

  const fld = "bg-[#060A10] border border-[#8a97a6]/30 rounded-md px-2 py-1 text-[13px] text-white focus:outline-none focus:border-[#3E9C93] w-full";

  return (
    <div data-testid="chiusura-giornata" className="space-y-5">
      <div className="flex items-center gap-2 flex-wrap">
        <ClipboardCheck className="w-4 h-4 text-[#3E9C93]" />
        <span className="text-sm font-black text-white">Chiusura giornata</span>
        <select data-testid="chiusura-day" value={day} onChange={(e) => setDay(e.target.value)} className="ml-auto bg-[#060A10] border border-[#3E9C93]/30 rounded-md px-2 py-1 text-[12px] text-[#7fd3c9]">
          {DAYS.map((d) => <option key={d} value={d}>{DAY_LABEL[d]}</option>)}
        </select>
      </div>

      {/* Righe prodotti: pianificato vs prodotto vs avanzato + costo/prezzo */}
      <div className="space-y-2">
        <div className="grid grid-cols-[1fr_54px_54px_54px_64px_64px_28px] gap-1.5 text-[9px] uppercase tracking-wide text-[#64748B] px-1">
          <span>Prodotto</span><span className="text-center">Pian.</span><span className="text-center">Prod.</span><span className="text-center">Avanz.</span><span className="text-center">€ costo</span><span className="text-center">€ prezzo</span><span></span>
        </div>
        {lines.map((l, i) => (
          <div key={i} data-testid={`chiusura-line-${i}`} className="grid grid-cols-[1fr_54px_54px_54px_64px_64px_28px] gap-1.5 items-center">
            <input data-testid={`chiusura-name-${i}`} value={l.recipe_name} onChange={(e) => patch(i, { recipe_name: e.target.value })} placeholder="Ricetta" className={fld} />
            <input data-testid={`chiusura-planned-${i}`} value={l.planned} onChange={(e) => patch(i, { planned: e.target.value })} className={`${fld} text-center`} />
            <input data-testid={`chiusura-produced-${i}`} value={l.produced} onChange={(e) => patch(i, { produced: e.target.value })} className={`${fld} text-center`} />
            <input data-testid={`chiusura-leftover-${i}`} value={l.leftover} onChange={(e) => patch(i, { leftover: e.target.value })} className={`${fld} text-center`} />
            <input data-testid={`chiusura-cost-${i}`} value={l.unit_cost} onChange={(e) => patch(i, { unit_cost: e.target.value })} placeholder="0.00" className={`${fld} text-center`} />
            <input data-testid={`chiusura-price-${i}`} value={l.unit_price} onChange={(e) => patch(i, { unit_price: e.target.value })} placeholder="0.00" className={`${fld} text-center`} />
            <button data-testid={`chiusura-del-${i}`} onClick={() => delLine(i)} className="p-1 text-[#b06e78] hover:bg-[#b06e78]/10 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        ))}
        <button data-testid="chiusura-add-line" onClick={addLine} className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#a4afbb] hover:text-white"><Plus className="w-4 h-4" /> Aggiungi prodotto</button>
      </div>

      {/* Food-cost in tempo reale */}
      <div className="rounded-xl border border-[#3E9C93]/30 bg-[#3E9C93]/5 p-3 flex items-center gap-4 flex-wrap">
        <TrendingUp className="w-4 h-4 text-[#3E9C93]" />
        <span className="text-[12px] text-[#94A3B8]">Ricavo <b className="text-white">€{preview.rev}</b></span>
        <span className="text-[12px] text-[#94A3B8]">Costo <b className="text-white">€{preview.cost}</b></span>
        <span className="text-[12px] text-[#94A3B8]">Margine <b className="text-[#3E9C93]">€{preview.margin}</b></span>
        <span data-testid="chiusura-fc-preview" className="text-[12px] text-[#94A3B8]">Food-cost <b className="text-white">{preview.fc ?? "—"}%</b></span>
      </div>

      {/* Correzioni → memoria di Sitor */}
      <div className="space-y-2">
        <div className="flex items-center gap-2"><BrainCircuit className="w-4 h-4 text-[#a4afbb]" /><span className="text-[12px] font-bold text-[#cbd5e1]">Correzioni di oggi (memoria di Sitor)</span></div>
        {corrections.map((c, i) => (
          <div key={i} data-testid={`chiusura-corr-${i}`} className="flex gap-1.5 items-center flex-wrap">
            <input value={c.recipe_name} onChange={(e) => patchCorr(i, { recipe_name: e.target.value })} placeholder="Ricetta" className={`${fld} w-28`} />
            <input data-testid={`chiusura-corr-change-${i}`} value={c.change} onChange={(e) => patchCorr(i, { change: e.target.value })} placeholder="es. più acqua 2%" className={`${fld} flex-1 min-w-[120px]`} />
            <input value={c.temp_c} onChange={(e) => patchCorr(i, { temp_c: e.target.value })} placeholder="°C" className={`${fld} w-14 text-center`} />
            <input value={c.flour_lot} onChange={(e) => patchCorr(i, { flour_lot: e.target.value })} placeholder="lotto farina" className={`${fld} w-28`} />
            <button onClick={() => delCorr(i)} className="p-1 text-[#b06e78] hover:bg-[#b06e78]/10 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        ))}
        <button data-testid="chiusura-add-corr" onClick={addCorr} className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#a4afbb] hover:text-white"><Plus className="w-4 h-4" /> Aggiungi correzione</button>
      </div>

      <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Nota della giornata (facoltativa)" rows={2} className={`${fld} resize-none`} />

      <button data-testid="chiusura-submit" onClick={submit} disabled={saving} className="w-full inline-flex items-center justify-center gap-2 bg-[#3E9C93] hover:bg-[#347f78] disabled:opacity-60 text-white font-bold px-4 py-3 rounded-2xl active:scale-98 transition-all">
        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Chiudi la giornata
      </button>

      {result && (
        <div data-testid="chiusura-result" className="rounded-2xl border border-[#3E9C93]/40 bg-[#0b0f19]/70 p-4 space-y-2">
          <p className="text-sm font-black text-[#3E9C93]">Giornata registrata · Food-cost {result.food_cost.food_cost_pct ?? "—"}% · Margine €{result.food_cost.day_margin}</p>
          {(result.suggestions || []).length > 0 && (
            <div className="flex items-start gap-2 text-[12px] text-[#cbd5e1]">
              <Lightbulb className="w-4 h-4 text-[#f0c000] shrink-0 mt-0.5" />
              <span>Piano della prossima settimana suggerito: {result.suggestions.map((s) => `${s.recipe_name} → ${s.suggested_qty}`).join(" · ")}</span>
            </div>
          )}
        </div>
      )}

      {/* Suggerimenti storici + memoria */}
      {suggestions.length > 0 && !result && (
        <div className="rounded-xl bg-[#8a97a6]/10 border border-[#8a97a6]/20 p-3 text-[12px] text-[#cbd5e1]">
          <span className="font-bold text-[#a4afbb]">Suggerimenti da chiusure precedenti ({DAY_LABEL[day]}): </span>
          {suggestions.map((s) => `${s.recipe_name} → ${s.suggested_qty}`).join(" · ")}
        </div>
      )}
      {memory.length > 0 && (
        <div data-testid="chiusura-memory" className="rounded-xl bg-[#0b0f19]/60 border border-[#8a97a6]/20 p-3">
          <p className="text-[11px] font-black uppercase tracking-wide text-[#a4afbb] mb-1.5">Memoria del metodo del Capo</p>
          <ul className="space-y-1">
            {memory.slice(0, 8).map((m, i) => (
              <li key={i} className="text-[12px] text-[#94A3B8] flex gap-2"><span className="text-[#3E9C93]">•</span><span><b className="text-[#cbd5e1]">{m.recipe_name || "generale"}:</b> {m.change} {m.context?.season ? `(${m.context.season}${m.context.flour_lot ? ", farina " + m.context.flour_lot : ""})` : ""}</span></li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
