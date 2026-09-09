import { useState, useEffect, useCallback } from "react";
import { BellRing, RefreshCw, CheckCheck, AlertTriangle } from "lucide-react";
import { api } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// FASE 10 · Feed allarmi di Mike Mix per il Capo Supremo (anomalie dal campo).
export default function MikeAlerts() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [alerts, setAlerts] = useState([]);
  const [unread, setUnread] = useState(0);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    try { const { data } = await api.get("/mike/alerts"); setAlerts(data.alerts || []); setUnread(data.unread || 0); } catch { /* */ }
    setBusy(false);
  }, []);
  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, [load]);

  const markRead = async () => { try { await api.post("/mike/alerts/read"); } catch { /* */ } load(); };

  return (
    <div data-testid="mike-alerts" className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative"><BellRing className="w-5 h-5 text-[#f59e0b]" />{unread > 0 && <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-[#f43f5e] text-[9px] font-black text-white flex items-center justify-center">{unread}</span>}</div>
          <h4 className="font-cyber text-sm font-black text-white uppercase tracking-wide">{tri("Allarmi di Mike Mix", "Mike Mix Alarme", "Mike Mix Alerts", "Alertas de Mike Mix", "Alertes de Mike Mix", "هشدارهای Mike Mix")}</h4>
        </div>
        <div className="flex items-center gap-2">
          <button data-testid="alerts-refresh" onClick={load} className="text-[#FF9D42] active:scale-90"><RefreshCw className={`w-4 h-4 ${busy ? "animate-spin" : ""}`} /></button>
          {unread > 0 && <button data-testid="alerts-read" onClick={markRead} className="inline-flex items-center gap-1 text-[11px] font-bold text-[#22c55e] active:scale-95"><CheckCheck className="w-3.5 h-3.5" /> {tri("Segna letti", "Gelesen", "Mark read", "Marcar leídos", "Marquer lus", "خوانده شد")}</button>}
        </div>
      </div>
      {alerts.length === 0 ? (
        <p data-testid="alerts-empty" className="text-[12px] text-[#94A3B8]">{tri("Nessuna anomalia. Il campo è sereno.", "Keine Anomalien. Alles ruhig.", "No anomalies. The floor is calm.", "Sin anomalías.", "Aucune anomalie.", "بدون ناهنجاری.")}</p>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {alerts.map((a) => (
            <div key={a.id} data-testid={`alert-${a.id}`} className={`rounded-lg border p-3 ${a.read ? "border-[#1e293b] bg-[#060A10]" : "border-[#f59e0b]/40 bg-[#f59e0b]/8"}`}>
              <p className="flex items-center gap-1.5 text-[12px] font-bold text-[#fbbf24]"><AlertTriangle className="w-3.5 h-3.5" /> {a.operator}{a.recipe_name ? ` · ${a.recipe_name}` : ""}</p>
              <p className="mt-0.5 text-[12px] text-white leading-snug">{a.action}</p>
              {a.advice && <p className="mt-1 text-[11.5px] text-[#CBD5E1] leading-snug">→ {a.advice}</p>}
              <p className="mt-1 font-mono text-[9px] text-[#64748B] uppercase tracking-widest">{(a.created_at || "").slice(0, 16).replace("T", " ")}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
