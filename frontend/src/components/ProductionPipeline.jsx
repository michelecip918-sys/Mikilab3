import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { X, Factory, ArrowDown, Droplets, Thermometer, Gauge } from "lucide-react";
import { enterpriseApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

const STATUS = { optimal: "#22c55e", active: "#5EEAD4", warning: "#f59e0b" };

export default function ProductionPipeline({ onClose }) {
  const { lang } = useLang();
  const tri = mkTri(lang);
  const [doughTemp, setDoughTemp] = useState(24);
  const [hydration, setHydration] = useState(70);
  const [line, setLine] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setLine(await enterpriseApi.lineStatus(doughTemp, hydration)); }
    catch { /* */ }
    setLoading(false);
  }, [doughTemp, hydration]);
  useEffect(() => { load(); }, [load]);

  const glutenLabel = (g) => g === "forte" ? tri("forte", "stark", "strong", "fuerte", "fort", "قوی")
    : g === "medio" ? tri("medio", "mittel", "medium", "medio", "moyen", "متوسط")
    : tri("delicato", "zart", "delicate", "delicado", "délicat", "ظریف");

  return (
    <div data-testid="production-pipeline" className="fixed inset-0 z-[80] bg-[#030712]/97 backdrop-blur-xl overflow-y-auto">
      <div className="max-w-2xl mx-auto p-4 pb-16">
        <div className="flex items-center justify-between sticky top-0 bg-[#030712]/95 py-2 z-10">
          <h2 className="text-lg font-black text-white flex items-center gap-2"><Factory className="w-5 h-5 text-[#5EEAD4]" /> {tri("Linea di Produzione", "Produktionslinie", "Production Line", "Línea de Producción", "Ligne de Production", "خط تولید")}</h2>
          <button data-testid="pipeline-close" onClick={onClose} className="w-9 h-9 rounded-full bg-[#0b0f19] border border-[#1e293b] flex items-center justify-center text-[#94A3B8] hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <p className="text-[12px] text-[#94A3B8] mb-4">{tri("6 settori contigui: Mike Mix prevede i parametri a valle dall'impasto in uscita.", "6 Sektoren: Mike Mix sagt die nachgelagerten Parameter voraus.", "6 contiguous sectors: Mike Mix predicts downstream parameters from the dough.", "6 sectores: Mike Mix predice los parámetros aguas abajo.", "6 secteurs : Mike Mix prédit les paramètres en aval.", "۶ بخش پیوسته: Mike Mix پارامترهای پایین‌دست را پیش‌بینی می‌کند.")}</p>

        {/* Controlli impasto in uscita */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="rounded-2xl border border-[#1e293b] bg-[#0b0f19] p-3">
            <div className="flex items-center justify-between text-[11px] font-bold text-[#94A3B8] mb-1"><span className="flex items-center gap-1"><Thermometer className="w-3.5 h-3.5" /> {tri("Temp. impasto", "Teig-Temp.", "Dough temp.", "Temp. masa", "Temp. pâte", "دمای خمیر")}</span><span className="text-white font-mono-data" data-testid="pipeline-temp-val">{doughTemp}°C</span></div>
            <input data-testid="pipeline-temp" type="range" min="15" max="32" step="0.5" value={doughTemp} onChange={(e) => setDoughTemp(Number(e.target.value))} className="w-full accent-[#5EEAD4]" />
          </div>
          <div className="rounded-2xl border border-[#1e293b] bg-[#0b0f19] p-3">
            <div className="flex items-center justify-between text-[11px] font-bold text-[#94A3B8] mb-1"><span className="flex items-center gap-1"><Droplets className="w-3.5 h-3.5" /> {tri("Idratazione", "Hydration", "Hydration", "Hidratación", "Hydratation", "هیدراتاسیون")}</span><span className="text-white font-mono-data" data-testid="pipeline-hyd-val">{hydration}%</span></div>
            <input data-testid="pipeline-hyd" type="range" min="40" max="100" step="1" value={hydration} onChange={(e) => setHydration(Number(e.target.value))} className="w-full accent-[#5E8CA8]" />
          </div>
        </div>

        {line && (
          <div className="flex items-center justify-center gap-2 mb-4 text-[12px]">
            <span className="px-3 py-1 rounded-full bg-[#5EEAD4]/10 border border-[#5EEAD4]/30 text-[#5EEAD4] font-bold" data-testid="pipeline-gluten">{tri("Glutine", "Gluten", "Gluten", "Gluten", "Gluten", "گلوتن")}: {glutenLabel(line.gluten)}</span>
          </div>
        )}

        {/* Timeline settori */}
        <div className="relative" data-testid="pipeline-sectors">
          {(line?.sectors || []).map((s, i) => {
            const c = STATUS[s.status] || "#5EEAD4";
            const last = i === (line.sectors.length - 1);
            return (
              <div key={s.id} className="relative">
                <motion.div
                  initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                  data-testid={`pipeline-sector-${s.id}`}
                  className="rounded-2xl border p-4 flex items-start gap-3"
                  style={{ borderColor: `${c}55`, background: `${c}0d` }}
                >
                  <div className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-black text-[#030712]" style={{ background: c }}>{i + 1}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-black text-white leading-tight">{s.name}</p>
                      <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0" style={{ background: `${c}22`, color: c }}>
                        {s.status === "optimal" ? tri("ottimale", "optimal", "optimal", "óptimo", "optimal", "بهینه") : tri("attivo", "aktiv", "active", "activo", "actif", "فعال")}
                      </span>
                    </div>
                    <p className="text-[12px] font-mono-data mt-1" style={{ color: c }} data-testid={`pipeline-param-${s.id}`}>{s.param}</p>
                    {/* Handoff verso il settore successivo */}
                    <div className="mt-2 flex items-start gap-1.5 text-[11px] text-[#94A3B8]">
                      <span className="text-[#5EEAD4]">↳</span>
                      <span data-testid={`pipeline-handoff-${s.id}`}>{s.handoff}</span>
                    </div>
                  </div>
                </motion.div>
                {!last && (
                  <div className="flex justify-center py-1">
                    <motion.div animate={{ y: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 1.4 }}>
                      <ArrowDown className="w-4 h-4 text-[#334155]" />
                    </motion.div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {line?.mike_note && (
          <div className="mt-4 rounded-2xl border border-[#5E8CA8]/40 p-3 flex items-start gap-2" style={{ background: "linear-gradient(135deg,#5E8CA818,transparent)" }}>
            <Gauge className="w-4 h-4 text-[#7DA3C0] mt-0.5 shrink-0" />
            <p className="text-[12px] text-[#cfe0ec]">{line.mike_note}</p>
          </div>
        )}
        {loading && <p className="text-center text-[11px] text-[#64748B] mt-3">…</p>}
      </div>
    </div>
  );
}
