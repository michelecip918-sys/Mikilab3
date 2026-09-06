import { useEffect, useState, useCallback, useRef } from "react";
import { Truck, Volume2, BatteryMedium, Route } from "lucide-react";
import { playTTS } from "@/lib/tts";
import { bakoApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

const HEALTH_COL = { ok: "#22c55e", attenzione: "#FFB800", manutenzione: "#f43f5e" };

// v14 · Flotta AGV: routing autonomo + rilevamento acustico preventivo guasti.
export default function AgvFleet() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [data, setData] = useState({ carts: [], alerts: [] });
  const spoken = useRef("");

  const load = useCallback(async () => {
    try {
      const d = await bakoApi.agv();
      setData(d);
      if (d.alerts?.length && spoken.current !== d.alerts[0].cart) { spoken.current = d.alerts[0].cart; try { playTTS(d.spoken, { lang, voice: "bakemix" }); } catch { /* */ } }
      if (!d.alerts?.length) spoken.current = "";
    } catch { /* */ }
  }, [lang]);
  useEffect(() => { load(); const iv = setInterval(load, 5000); return () => clearInterval(iv); }, [load]);

  return (
    <div data-testid="agv-fleet" className="space-y-2">
      {data.carts.map((c) => {
        const col = HEALTH_COL[c.health] || "#22c55e";
        return (
          <div key={c.id} data-testid={`agv-${c.id}`} className="rounded-xl border p-2.5" style={{ borderColor: `${col}44`, background: `${col}0a` }}>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 shrink-0" style={{ color: col }} />
              <span className="text-sm font-black text-white">{c.name}</span>
              <span className="inline-flex items-center gap-1 text-[11px] text-[#8aa0b4] flex-1 min-w-0"><Route className="w-3 h-3" /> {c.route_label}</span>
              <span className="inline-flex items-center gap-1 text-[11px] text-[#8aa0b4]"><BatteryMedium className="w-3.5 h-3.5" /> {c.battery_pct}%</span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-[11px]">
              <span className="inline-flex items-center gap-1" style={{ color: col }}><Volume2 className="w-3 h-3" /> {c.acoustic_db} dB</span>
              <span className="font-bold uppercase" style={{ color: col }}>{c.health === "manutenzione" ? tri("Manutenzione", "Wartung", "Maintenance", "Mantenim.", "Maintenance", "تعمیر") : c.health === "attenzione" ? tri("Attenzione", "Achtung", "Watch", "Atención", "Attention", "توجه") : "OK"}</span>
            </div>
          </div>
        );
      })}
      {data.alerts.map((a, i) => (
        <p key={i} data-testid={`agv-alert-${i}`} className="text-[12px] text-[#f43f5e] font-semibold">🔧 {a.text}</p>
      ))}
    </div>
  );
}
