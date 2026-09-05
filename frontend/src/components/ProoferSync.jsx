import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { X, Snowflake, Thermometer, Timer, Loader2, Gauge } from "lucide-react";
import { prooferApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

export default function ProoferSync({ onClose }) {
  const { lang } = useLang();
  const tri = mkTri(lang);
  const [d, setD] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { prooferApi.sync().then(setD).catch(() => setD(null)).finally(() => setLoading(false)); }, []);

  return (
    <div data-testid="proofer-sync" className="fixed inset-0 z-[80] bg-[#030712]/97 backdrop-blur-xl overflow-y-auto">
      <div className="max-w-md mx-auto p-4">
        <div className="flex items-center justify-between sticky top-0 bg-[#030712]/95 py-2 z-10">
          <h2 className="text-lg font-black text-white flex items-center gap-2"><Snowflake className="w-5 h-5 text-[#5E8CA8]" /> {tri("Cella & Freezer · Anti-Over-Proof", "Gärraum & Freezer", "Proofer & Freezer · Anti-Over-Proof", "Cámara & Freezer", "Chambre & Freezer", "تخمیر و فریزر")}</h2>
          <button data-testid="proofer-close" onClick={onClose} className="w-9 h-9 rounded-full bg-[#0b0f19] border border-[#1e293b] flex items-center justify-center text-[#94A3B8]"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-[12px] text-[#94A3B8] mb-4">{tri("Calibro la cella sulla velocità (Aura) dell'operatore attivo per evitare la sovra-lievitazione.", "Ich kalibriere den Gärraum auf die Aura des aktiven Operators.", "I calibrate the proofer on the active operator's Aura speed to prevent over-proofing.", "Calibro la cámara según la Aura del operador activo.", "Je calibre la chambre selon l'Aura de l'opérateur actif.", "تخمیر را با سرعت (اورا) اپراتور فعال تنظیم می‌کنم.")}</p>
        {loading ? <div className="flex items-center gap-2 text-sm text-[#7E8A93]"><Loader2 className="w-4 h-4 animate-spin" /> …</div> : d && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <div className="flex items-center gap-2 rounded-2xl border border-[#1e293b] bg-[#0b0f19] p-3">
              <Gauge className="w-4 h-4 text-[#5EEAD4]" />
              <span className="text-sm text-white font-bold flex-1">{d.operator}</span>
              {d.aura && <span className="text-[11px] font-black px-2 py-1 rounded-full" style={{ background: `${d.aura.color}22`, color: d.aura.color }}>{d.aura.aura_effect}</span>}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-2xl border border-[#5E8CA8]/40 bg-[#5E8CA80d] p-3 text-center">
                <Thermometer className="w-4 h-4 text-[#5E8CA8] mx-auto" />
                <p className="text-2xl font-black text-white mt-1" data-testid="proofer-temp">{d.proofer_temp_c}°</p>
                <p className="text-[10px] text-[#94A3B8]">{tri("cella", "Gärraum", "proofer", "cámara", "chambre", "تخمیر")}</p>
              </div>
              <div className="rounded-2xl border border-[#14b8a6]/40 bg-[#14b8a60d] p-3 text-center">
                <Timer className="w-4 h-4 text-[#14b8a6] mx-auto" />
                <p className="text-2xl font-black text-white mt-1" data-testid="proofer-time">{d.proof_time_min}′</p>
                <p className="text-[10px] text-[#94A3B8]">{tri("finestra", "Fenster", "window", "ventana", "fenêtre", "پنجره")}</p>
              </div>
              <div className="rounded-2xl border border-[#94A3B8]/40 bg-[#94A3B80d] p-3 text-center">
                <Snowflake className="w-4 h-4 text-[#cbd5e1] mx-auto" />
                <p className="text-2xl font-black text-white mt-1" data-testid="proofer-freezer">{d.freezer_hold_c}°</p>
                <p className="text-[10px] text-[#94A3B8]">freezer</p>
              </div>
            </div>
            <div className="rounded-2xl border border-[#5EEAD4]/30 bg-[#5EEAD40d] p-3 text-[13px] text-[#cfe0ec]" data-testid="proofer-note">{d.note}</div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
