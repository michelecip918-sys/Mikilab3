import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Volume2, Loader2, Trophy, Zap, Leaf, Clock } from "lucide-react";
import { bakoApi } from "@/lib/api";
import { playTTS } from "@/lib/tts";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

const GRADE_COL = { A: "#22c55e", B: "#7DD3FC", C: "#FFB800", D: "#f43f5e" };

// Report vocale di fine turno + MikiScore giornaliero dell'impianto.
export default function ShiftReport() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [data, setData] = useState(null);
  const [hist, setHist] = useState([]);
  const [busy, setBusy] = useState(false);

  const run = useCallback(async () => {
    setBusy(true);
    try {
      const r = await bakoApi.shiftReport(lang); setData(r);
      if (r.spoken) { try { playTTS(r.spoken, { lang, voice: "bakemix" }); } catch { /* */ } }
      try { const h = await bakoApi.mikiscoreHistory(); setHist(h.history || []); } catch { /* */ }
    } catch { /* */ }
    setBusy(false);
  }, [lang]);

  const GC = { A: "#22c55e", B: "#7DD3FC", C: "#FFB800", D: "#f43f5e" };

  const col = data ? (GRADE_COL[data.grade] || "#7DD3FC") : "#7DD3FC";

  return (
    <div data-testid="shift-report" className="space-y-3">
      <button data-testid="shift-report-run" onClick={run} disabled={busy}
        className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#00F0FF]/15 border border-[#00F0FF]/50 text-[#00F0FF] font-black text-sm active:scale-95 disabled:opacity-50">
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Volume2 className="w-4 h-4" />} {tri("Report vocale di fine turno", "Schicht-Sprachbericht", "End-of-shift voice report", "Informe de turno", "Rapport de fin de service", "گزارش پایان شیفت")}
      </button>
      {data && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border p-3" style={{ borderColor: `${col}44`, background: `${col}0a` }}>
          <div className="flex items-center gap-3">
            <div className="relative w-20 h-20 rounded-full flex items-center justify-center shrink-0" style={{ background: `conic-gradient(${col} ${data.mikiscore * 3.6}deg, #0C1420 0deg)` }}>
              <div className="absolute inset-1.5 rounded-full bg-[#070A10] flex flex-col items-center justify-center">
                <span data-testid="mikiscore" className="text-2xl font-black text-white leading-none tabular-nums">{data.mikiscore}</span>
                <span className="text-[9px] uppercase tracking-wide" style={{ color: col }}>MikiScore</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-white flex items-center gap-1.5"><Trophy className="w-4 h-4" style={{ color: col }} /> {tri("Valutazione", "Note", "Grade", "Nota", "Note", "نمره")} {data.grade}</p>
              <div className="mt-1 space-y-0.5 text-[11px] text-[#8aa0b4]">
                <p className="flex items-center gap-1"><Zap className="w-3 h-3 text-[#f43f5e]" /> {tri("Reattività", "Reaktion", "Reactivity", "Reactividad", "Réactivité", "واکنش")}: {data.breakdown.reactivity}</p>
                <p className="flex items-center gap-1"><Leaf className="w-3 h-3 text-[#22c55e]" /> {tri("Zero sprechi", "Kein Abfall", "Low waste", "Sin desperdicio", "Zéro gaspillage", "بدون هدررفت")}: {data.breakdown.waste}</p>
                <p className="flex items-center gap-1"><Clock className="w-3 h-3 text-[#7DD3FC]" /> {tri("Puntualità", "Pünktlichkeit", "Punctuality", "Puntualidad", "Ponctualité", "وقت‌شناسی")}: {data.breakdown.punctuality}</p>
              </div>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-3 text-[11px] text-white">
            <span>{tri("Lotti", "Lose", "Batches", "Lotes", "Lots", "دسته")}: <b>{data.lotti}</b></span>
            <span>SOS: <b>{data.sos_today}</b> ({data.avg_response_s}s)</span>
            <span>{tri("Silos bassi", "Silos", "Low silos", "Silos", "Silos", "سیلو")}: <b>{data.silos_low}</b></span>
          </div>
          {hist.length > 1 && (
            <div data-testid="mikiscore-history" className="mt-3 pt-2 border-t border-white/10">
              <p className="text-[10px] uppercase tracking-widest text-[#64748b] mb-1.5">{tri("Storico settimana", "Wochenverlauf", "Weekly history", "Historial", "Historique", "هفتگی")}</p>
              <div className="flex items-end gap-1.5 h-16">
                {hist.map((h) => (
                  <div key={h.date} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full rounded-t" style={{ height: `${Math.max(6, h.score * 0.5)}px`, background: GC[h.grade] || "#7DD3FC" }} title={`${h.date}: ${h.score}`} />
                    <span className="text-[8px] text-[#64748b]">{h.date.slice(8, 10)}/{h.date.slice(5, 7)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
