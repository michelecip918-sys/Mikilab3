import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Container, Droplets, PackagePlus, Clock } from "lucide-react";
import { toast } from "sonner";
import { bakoApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// v14 · Silos & Materie Prime: calo peso, micro-ordini auto, compensazione umidità farina.
export default function SiloManager() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [data, setData] = useState({ silos: [], reorder_count: 0 });

  const load = useCallback(async () => { try { setData(await bakoApi.silos()); } catch { /* */ } }, []);
  useEffect(() => { load(); const iv = setInterval(load, 8000); return () => clearInterval(iv); }, [load]);

  const microorder = async () => {
    try { const r = await bakoApi.siloMicroorder(); toast.success(tri(`Micro-ordini generati: ${r.count}`, `Micro-Aufträge: ${r.count}`, `Micro-orders generated: ${r.count}`, `Micro-pedidos: ${r.count}`, `Micro-commandes: ${r.count}`, `میکرو سفارش: ${r.count}`)); load(); } catch { /* */ }
  };

  return (
    <div data-testid="silo-manager" className="space-y-2">
      {data.silos.map((s) => {
        const col = s.needs_reorder ? "#f43f5e" : s.fill_pct < 40 ? "#FFB800" : "#22c55e";
        return (
          <div key={s.id} data-testid={`silo-${s.id}`} className="rounded-xl border p-2.5" style={{ borderColor: `${col}44`, background: `${col}0a` }}>
            <div className="flex items-center gap-2">
              <Container className="w-4 h-4 shrink-0" style={{ color: col }} />
              <span className="text-sm font-black text-white flex-1 min-w-0 truncate">{s.name}</span>
              <span className="text-[11px] font-bold" style={{ color: col }}>{s.current_kg} / {s.capacity_kg} kg</span>
            </div>
            <div className="mt-1.5 h-1.5 rounded-full bg-[#030712] overflow-hidden"><div className="h-full rounded-full" style={{ width: `${s.fill_pct}%`, background: col }} /></div>
            <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-[#8aa0b4]">
              {s.autonomy_h != null && <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {tri("autonomia", "Autonomie", "autonomy", "autonomía", "autonomie", "خودکفایی")} ~{s.autonomy_h}h</span>}
              {s.is_flour && <span className="inline-flex items-center gap-1"><Droplets className="w-3 h-3 text-[#7DD3FC]" /> {tri("umidità", "Feuchte", "humidity", "humedad", "humidité", "رطوبت")} {s.humidity_pct}%</span>}
              {s.water_adjust_pct != null && s.water_adjust_pct !== 0 && <span className="text-[#7DD3FC] font-bold">{tri("correggi acqua", "Wasser", "water adj", "agua", "eau", "آب")} {s.water_adjust_pct > 0 ? "+" : ""}{s.water_adjust_pct}%</span>}
              {s.needs_reorder && <span className="text-[#f43f5e] font-bold">⚠ {tri("sotto soglia", "unter Schwelle", "below threshold", "bajo umbral", "sous seuil", "زیر آستانه")}</span>}
            </div>
          </div>
        );
      })}
      {data.reorder_count > 0 && (
        <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} data-testid="silo-microorder" onClick={microorder}
          className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#f43f5e]/15 border border-[#f43f5e]/50 text-[#f43f5e] font-black text-sm active:scale-95">
          <PackagePlus className="w-4 h-4" /> {tri(`Genera micro-ordini (${data.reorder_count})`, `Micro-Aufträge (${data.reorder_count})`, `Generate micro-orders (${data.reorder_count})`, `Micro-pedidos (${data.reorder_count})`, `Micro-commandes (${data.reorder_count})`, `میکرو سفارش (${data.reorder_count})`)}
        </motion.button>
      )}
    </div>
  );
}
