import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Timer, Plus, Check, Flame, Snowflake } from "lucide-react";
import { batchesApi, prooferApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import BatchPhoenix from "@/components/BatchPhoenix";

const readThreshold = () => { try { const v = Number(localStorage.getItem("mikilab_stall_min")); return Number.isFinite(v) && v > 0 ? v : 90; } catch { return 90; } };

// Timer impasto + parametri cella live sul floor (Letz_Passive, nessun suono).
export default function DoughTimer() {
  const { lang } = useLang();
  const tri = mkTri(lang);
  const [batches, setBatches] = useState([]);
  const [threshold, setThreshold] = useState(readThreshold());
  const [proofer, setProofer] = useState(null);
  const [dough, setDough] = useState("");
  const [adding, setAdding] = useState(false);
  const [phoenix, setPhoenix] = useState(null); // dough_type da recuperare

  useEffect(() => { const h = () => setThreshold(readThreshold()); window.addEventListener("mikilab-stall-changed", h); return () => window.removeEventListener("mikilab-stall-changed", h); }, []);

  const load = useCallback(async () => {
    try { const r = await batchesApi.active(); setBatches(r.batches || []); } catch { /* */ }
    try { setProofer(await prooferApi.sync()); } catch { /* */ }
  }, []);
  useEffect(() => { load(); const iv = setInterval(load, 30000); return () => clearInterval(iv); }, [load]);

  const start = async () => {
    if (!dough.trim()) return;
    try { await batchesApi.start(dough.trim(), 0, ""); setDough(""); setAdding(false); await load(); } catch { /* */ }
  };
  const close = async (id) => { setBatches((b) => b.filter((x) => x.id !== id)); try { await batchesApi.close(id); await load(); } catch { /* */ } };

  return (
    <div data-testid="dough-timer" className="w-full space-y-2 mb-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-black uppercase tracking-widest text-[#94A3B8] flex items-center gap-1.5"><Timer className="w-3.5 h-3.5 text-[#f59e0b]" /> {tri("Timer impasti", "Teig-Timer", "Dough timers", "Temporizadores masa", "Minuteurs pâte", "تایمر خمیر")}</p>
        {/* Parametri cella live (Proofer sul floor) */}
        {proofer && (
          <span data-testid="floor-proofer" className="inline-flex items-center gap-1 text-[10px] font-bold text-[#8FB0C2] bg-[#64748B]/10 border border-[#64748B]/30 rounded-full px-2 py-1">
            <Snowflake className="w-3 h-3" /> {proofer.proofer_temp_c}° · {proofer.proof_time_min}′
          </span>
        )}
      </div>

      <AnimatePresence>
        {batches.map((b) => {
          const stalled = b.age_min >= threshold;
          return (
          <motion.div key={b.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} data-testid={`dough-${b.id}`}
            className="flex items-center gap-2 rounded-2xl border px-3 py-2" style={{ borderColor: stalled ? "#f59e0b66" : "#1e293b", background: stalled ? "#f59e0b0d" : "#0b0f19" }}>
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-bold text-white truncate">{b.dough_type}</span>
              <span className={`block text-[11px] font-mono-data ${stalled ? "text-[#f59e0b]" : "text-[#7E8A93]"}`}>{b.age_min}′ {tri("in lievitazione", "in Gärung", "proofing", "fermentando", "en pousse", "در تخمیر")}</span>
            </span>
            {stalled && (
              <button data-testid={`dough-recover-${b.id}`} onClick={() => setPhoenix(b.dough_type)} className="inline-flex items-center gap-1 text-[10px] font-black text-[#f59e0b] bg-[#f59e0b]/15 rounded-full px-2 py-1 active:scale-95">
                <Flame className="w-3 h-3" /> {tri("Recupera", "Retten", "Recover", "Recuperar", "Récupérer", "بازیافت")}
              </button>
            )}
            <button data-testid={`dough-close-${b.id}`} onClick={() => close(b.id)} className="shrink-0 w-7 h-7 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center"><Check className="w-3.5 h-3.5" /></button>
          </motion.div>
          );
        })}
      </AnimatePresence>

      {adding ? (
        <div className="flex items-center gap-2">
          <input data-testid="dough-input" autoFocus value={dough} onChange={(e) => setDough(e.target.value)} onKeyDown={(e) => e.key === "Enter" && start()} placeholder={tri("Tipo impasto…", "Teigart…", "Dough type…", "Tipo masa…", "Type pâte…", "نوع خمیر…")} className="flex-1 bg-[#030712] border border-[#2A3B49] rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-[#f59e0b]" />
          <button data-testid="dough-confirm" onClick={start} className="px-3 py-2 rounded-xl bg-[#f59e0b] text-[#030712] font-black text-sm">OK</button>
        </div>
      ) : (
        <button data-testid="dough-add" onClick={() => setAdding(true)} className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-[#2A3B49] text-[#7E8A93] text-[12px] font-bold active:scale-98">
          <Plus className="w-3.5 h-3.5" /> {tri("Avvia timer impasto", "Teig-Timer starten", "Start dough timer", "Iniciar timer", "Démarrer minuteur", "شروع تایمر")}
        </button>
      )}
      {phoenix && <BatchPhoenix initialDough={phoenix} onClose={() => setPhoenix(null)} />}
    </div>
  );
}
