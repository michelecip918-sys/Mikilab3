import { useEffect, useState, useCallback } from "react";
import { Waves, Thermometer, Droplets, Timer } from "lucide-react";
import { bakoApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

const MODE_COL = { frena: "#f43f5e", neutro: "#7DD3FC", accelera: "#22c55e" };

// v14 · Celle di lievitazione: curve multi-stadio adattive alla disponibilità forni.
export default function AdaptiveProofing() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [data, setData] = useState(null);
  const [manual, setManual] = useState(null); // null = auto (da telemetria)

  const load = useCallback(async () => { try { setData(await bakoApi.proofing(manual)); } catch { /* */ } }, [manual]);
  useEffect(() => { load(); const iv = setInterval(load, 8000); return () => clearInterval(iv); }, [load]);

  const col = data ? (MODE_COL[data.mode] || "#7DD3FC") : "#7DD3FC";

  return (
    <div data-testid="adaptive-proofing" className="space-y-3">
      <div className="flex items-center gap-2 text-[12px] text-[#8aa0b4]">
        <Waves className="w-4 h-4" style={{ color: col }} />
        <span>{tri("Forni liberi", "Freie Öfen", "Free ovens", "Hornos libres", "Fours libres", "فرهای آزاد")}:</span>
        <div className="flex gap-1">
          {[null, 0, 1, 2].map((v) => (
            <button key={String(v)} data-testid={`proof-ovens-${v === null ? "auto" : v}`} onClick={() => setManual(v)}
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold border active:scale-95 ${manual === v ? "bg-[#7DD3FC]/15 border-[#7DD3FC]/50 text-[#7DD3FC]" : "bg-[#030712] border-[#1e293b] text-[#64748b]"}`}>
              {v === null ? tri("Auto", "Auto", "Auto", "Auto", "Auto", "خودکار") : v}
            </button>
          ))}
        </div>
      </div>
      {data && (
        <>
          <div data-testid="proof-mode" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-black" style={{ color: col, border: `1px solid ${col}66`, background: `${col}12` }}>
            {data.mode_label} · {data.total_minutes} min
          </div>
          <div className="space-y-1.5">
            {data.stages.map((st, i) => (
              <div key={i} data-testid={`proof-stage-${i}`} className="rounded-xl border border-[#5E8CA8]/25 bg-[#0C1019]/60 p-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#5E8CA8]/15 border border-[#5E8CA8]/40 text-[#9fc3dc] text-[11px] font-black flex items-center justify-center">{i + 1}</span>
                  <span className="text-[13px] font-black text-white flex-1">{st.stage}</span>
                </div>
                <div className="mt-1 flex flex-wrap gap-x-3 text-[11px] text-[#8aa0b4]">
                  <span className="inline-flex items-center gap-1"><Thermometer className="w-3 h-3 text-[#FFB800]" /> {st.temp_c}°C</span>
                  <span className="inline-flex items-center gap-1"><Droplets className="w-3 h-3 text-[#7DD3FC]" /> {st.humidity_pct}%</span>
                  <span className="inline-flex items-center gap-1"><Timer className="w-3 h-3" /> {st.minutes} min</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
