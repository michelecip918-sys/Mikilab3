import { useState } from "react";
import { motion } from "framer-motion";
import { X, Flame, Loader2, ArrowRight, Recycle } from "lucide-react";
import { phoenixApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

const STATES = [
  { id: "eccesso", it: "In eccesso", de: "Überschuss", en: "Excess", es: "Excedente", fr: "Excédent", fa: "اضافی" },
  { id: "rallentato", it: "Rallentato", de: "Verzögert", en: "Slowed", es: "Ralentizado", fr: "Ralenti", fa: "کند" },
  { id: "sovra-lievitato", it: "Sovra-lievitato", de: "Übergärt", en: "Over-proofed", es: "Sobre-fermentado", fr: "Sur-fermenté", fa: "بیش‌تخمیر" },
];

export default function BatchPhoenix({ onClose, initialDough = "" }) {
  const { lang } = useLang();
  const tri = mkTri(lang);
  const [dough, setDough] = useState(initialDough);
  const [kg, setKg] = useState(5);
  const [state, setState] = useState("eccesso");
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState(null);

  const run = async () => {
    if (!dough.trim()) return;
    setLoading(true); setRes(null);
    try { setRes(await phoenixApi.suggest(dough.trim(), Math.max(0.1, Number(kg) || 1), state, lang)); }
    catch { setRes({ error: true }); }
    setLoading(false);
  };

  return (
    <div data-testid="batch-phoenix" className="fixed inset-0 z-[80] bg-[#030712]/97 backdrop-blur-xl overflow-y-auto">
      <div className="max-w-md mx-auto p-4 pb-16">
        <div className="flex items-center justify-between sticky top-0 bg-[#030712]/95 py-2 z-10">
          <h2 className="text-lg font-black text-white flex items-center gap-2"><Flame className="w-5 h-5 text-[#f97316]" /> Batch Phoenix</h2>
          <button data-testid="phoenix-close" onClick={onClose} className="w-9 h-9 rounded-full bg-[#0b0f19] border border-[#1e293b] flex items-center justify-center text-[#94A3B8]"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-[12px] text-[#94A3B8] mb-4">{tri("Recupero impasti in eccesso o rallentati con un reimpiego immediato su un'altra linea — zero sprechi.", "Ich rette überschüssige Teige mit sofortiger Wiederverwendung — kein Abfall.", "I recover excess/slowed dough with an immediate reuse on another line — zero waste.", "Recupero masa excedente con reutilización inmediata — cero desperdicio.", "Je récupère la pâte en excès avec un réemploi immédiat — zéro gaspillage.", "خمیر اضافی را بازیافت می‌کنم — بدون هدررفت.")}</p>

        <input data-testid="phoenix-dough" value={dough} onChange={(e) => setDough(e.target.value)} placeholder={tri("Tipo impasto (es. impasto pane 70%)", "Teigart", "Dough type (e.g. 70% bread dough)", "Tipo de masa", "Type de pâte", "نوع خمیر")} className="w-full bg-[#0b0f19] border border-[#1e293b] rounded-xl p-3 text-sm text-white outline-none focus:border-[#f97316] mb-2" />
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center gap-1 bg-[#0b0f19] border border-[#1e293b] rounded-xl px-2 py-1.5">
            <input data-testid="phoenix-kg" type="number" min="0.5" step="0.5" value={kg} onChange={(e) => setKg(e.target.value)} className="w-16 bg-transparent text-white text-sm outline-none text-center font-mono-data" />
            <span className="text-[11px] text-[#7E8A93]">kg</span>
          </div>
          <select data-testid="phoenix-state" value={state} onChange={(e) => setState(e.target.value)} className="flex-1 bg-[#0b0f19] border border-[#1e293b] rounded-xl p-2.5 text-sm text-white outline-none focus:border-[#f97316]">
            {STATES.map((s) => <option key={s.id} value={s.id}>{tri(s.it, s.de, s.en, s.es, s.fr, s.fa)}</option>)}
          </select>
        </div>
        <button data-testid="phoenix-run" onClick={run} disabled={!dough.trim() || loading} className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-[#f97316] to-[#ea580c] text-white font-black text-sm disabled:opacity-40 active:scale-98">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Recycle className="w-4 h-4" />} {tri("Proponi reimpiego", "Wiederverwendung vorschlagen", "Suggest reuse", "Proponer reutilización", "Proposer un réemploi", "پیشنهاد استفاده مجدد")}
        </button>

        {res && res.error && <p className="mt-3 text-sm text-[#f87171] text-center">{tri("Errore. Riprova.", "Fehler.", "Error. Retry.", "Error.", "Erreur.", "خطا.")}</p>}
        {res && !res.error && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 space-y-2" data-testid="phoenix-result">
            {res.verdict && <p className="text-sm text-white font-bold">{res.verdict}</p>}
            {(res.options || []).map((o, i) => (
              <div key={i} className="rounded-2xl border border-[#f97316]/40 bg-[#f973160d] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-white">{o.product}</span>
                  {o.yield_kg != null && <span className="text-[11px] font-mono-data text-[#fdba74]">≈ {o.yield_kg} kg</span>}
                </div>
                <p className="text-[12px] text-[#5EEAD4] flex items-center gap-1 mt-0.5"><ArrowRight className="w-3 h-3" /> {o.line}</p>
                <p className="text-[12px] text-[#cfe0ec] mt-1">{o.note}</p>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
