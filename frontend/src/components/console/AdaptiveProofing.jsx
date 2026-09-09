import { useEffect, useState, useCallback } from "react";
import { Waves, Thermometer, Droplets, Timer, CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { mikeApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

const MODE_COL = { frena: "#f43f5e", neutro: "#FF9D42", accelera: "#22c55e" };

// v14 · Celle di lievitazione: curve multi-stadio adattive alla disponibilità forni.
export default function AdaptiveProofing() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [data, setData] = useState(null);
  const [manual, setManual] = useState(null); // null = auto (da telemetria)

  const load = useCallback(async () => { try { setData(await mikeApi.proofing(manual)); } catch { /* */ } }, [manual]);
  useEffect(() => { load(); const iv = setInterval(load, 8000); return () => clearInterval(iv); }, [load]);

  const syncPlan = async () => {
    try { const r = await mikeApi.proofingSync(manual); try { window.dispatchEvent(new Event("mikilab-tasks-updated")); } catch { /* */ } toast.success(r.message); }
    catch { toast.error(tri("Sync non riuscita", "Sync fehlgeschlagen", "Sync failed", "Sync fallida", "Échec sync", "همگام‌سازی ناموفق")); }
  };

  const col = data ? (MODE_COL[data.mode] || "#FF9D42") : "#FF9D42";

  return (
    <div data-testid="adaptive-proofing" className="space-y-3">
      <div className="flex items-center gap-2 text-[12px] text-[#94A3B8]">
        <Waves className="w-4 h-4" style={{ color: col }} />
        <span>{tri("Forni liberi", "Freie Öfen", "Free ovens", "Hornos libres", "Fours libres", "فرهای آزاد")}:</span>
        <div className="flex gap-1">
          {[null, 0, 1, 2].map((v) => (
            <button key={String(v)} data-testid={`proof-ovens-${v === null ? "auto" : v}`} onClick={() => setManual(v)}
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold border active:scale-95 ${manual === v ? "bg-[#FF9D42]/15 border-[#FF9D42]/50 text-[#FF9D42]" : "bg-[#030712] border-[#1e293b] text-[#64748b]"}`}>
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
          {data.oven_ready_at && (
            <div className="flex items-center gap-2">
              <span data-testid="proof-oven-ready" className="inline-flex items-center gap-1.5 text-[12px] text-white"><CalendarClock className="w-4 h-4 text-[#FFB800]" /> {tri("Infornata prevista", "Backzeit", "Bake at", "Horneado", "Enfournement", "زمان پخت")}: <b className="text-[#FFB800]">{data.oven_ready_at}</b></span>
            </div>
          )}
          <button data-testid="proof-sync-plan" onClick={syncPlan} className="w-full inline-flex items-center justify-center gap-2 py-2 rounded-xl bg-[#FF9D42]/15 border border-[#FF9D42]/50 text-[#FF9D42] font-bold text-xs active:scale-95">
            <CalendarClock className="w-3.5 h-3.5" /> {tri("Sincronizza orari col piano", "Zeiten mit Plan sync", "Sync times with plan", "Sync con el plan", "Sync avec le plan", "همگام‌سازی با برنامه")}
          </button>
          <div className="space-y-1.5">
            {data.stages.map((st, i) => (
              <div key={i} data-testid={`proof-stage-${i}`} className="rounded-xl border border-[#64748B]/25 bg-[#0C1019]/60 p-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#64748B]/15 border border-[#64748B]/40 text-[#9fc3dc] text-[11px] font-black flex items-center justify-center">{i + 1}</span>
                  <span className="text-[13px] font-black text-white flex-1">{st.stage}</span>
                </div>
                <div className="mt-1 flex flex-wrap gap-x-3 text-[11px] text-[#94A3B8]">
                  <span className="inline-flex items-center gap-1"><Thermometer className="w-3 h-3 text-[#FFB800]" /> {st.temp_c}°C</span>
                  <span className="inline-flex items-center gap-1"><Droplets className="w-3 h-3 text-[#FF9D42]" /> {st.humidity_pct}%</span>
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
