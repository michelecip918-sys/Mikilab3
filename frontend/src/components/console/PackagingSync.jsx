import { useEffect, useState, useCallback } from "react";
import { Scissors, Thermometer, Timer, Gauge } from "lucide-react";
import { mikeApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

const MODE_COL = { attendi: "#f43f5e", rallenta: "#FFB800", nominale: "#22c55e" };

// v14 · Packaging & Slicing: velocità affettatrici sincronizzata alla curva di raffreddamento del pane.
export default function PackagingSync() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [temp, setTemp] = useState(60);
  const [data, setData] = useState(null);

  const load = useCallback(async () => { try { setData(await mikeApi.packaging(temp, lang)); } catch { /* */ } }, [temp, lang]);
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);

  const col = data ? (MODE_COL[data.mode] || "#FFB800") : "#FFB800";

  return (
    <div data-testid="packaging-sync" className="space-y-3">
      <label className="flex flex-col gap-1">
        <span className="flex justify-between text-[12px] text-[#8aa0b4]"><span className="inline-flex items-center gap-1"><Thermometer className="w-3.5 h-3.5 text-[#FFB800]" /> {tri("Temp. pane in uscita", "Brottemp.", "Bread exit temp", "Temp. pan", "Temp. pain", "دمای نان")}</span><b className="text-white">{temp}°C</b></span>
        <input data-testid="pkg-temp" type="range" min={30} max={90} value={temp} onChange={(e) => setTemp(Number(e.target.value))} className="w-full accent-[#00F0FF]" />
      </label>
      {data && (
        <>
          <div className="flex items-center justify-center py-2">
            <div className="relative w-32 h-32 rounded-full flex flex-col items-center justify-center" style={{ background: `conic-gradient(${col} ${data.slicer_speed_pct * 3.6}deg, #0C1420 0deg)` }}>
              <div className="absolute inset-2 rounded-full bg-[#070A10] flex flex-col items-center justify-center">
                <Scissors className="w-4 h-4 mb-1" style={{ color: col }} />
                <span data-testid="pkg-speed" className="text-2xl font-black text-white tabular-nums">{data.slicer_speed_pct}%</span>
                <span className="text-[9px] uppercase tracking-wide text-[#64748b]">{tri("affettatrici", "Schneider", "slicers", "cortadoras", "trancheuses", "برش")}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center gap-3">
            <span data-testid="pkg-mode" className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black" style={{ color: col, border: `1px solid ${col}66`, background: `${col}12` }}><Gauge className="w-3.5 h-3.5" /> {data.mode_label}</span>
            {data.cooling_minutes_left > 0 && <span className="inline-flex items-center gap-1 text-[12px] text-[#8aa0b4]"><Timer className="w-3.5 h-3.5" /> {tri("pronte tra", "bereit in", "ready in", "listas en", "prêtes dans", "آماده در")} {data.cooling_minutes_left} min</span>}
          </div>
        </>
      )}
    </div>
  );
}
