import { useEffect, useState, useCallback } from "react";
import { Bell, History, Download, ChevronDown, ChevronUp, AlertTriangle, Smartphone } from "lucide-react";
import { api } from "@/lib/api";
import { enablePush } from "@/lib/reminders";
import { toast } from "sonner";

const DEPT_IT = { panificio: "Panificio", pizzeria: "Pizzeria", pasticceria: "Pasticceria", banco: "Magazzino" };

// Barra sotto il Command Deck: storico allarmi critici del turno + notifiche push (anche iPhone).
export const DeckAlarmBar = ({ tri, refreshKey }) => {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [pushOn, setPushOn] = useState(typeof Notification !== "undefined" && Notification.permission === "granted");
  const isIOS = typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);
  const standalone = typeof window !== "undefined" && (window.navigator.standalone || window.matchMedia("(display-mode: standalone)").matches);

  const load = useCallback(() => {
    api.get("/deck/alarms/history").then((r) => setItems(r.data.items || [])).catch(() => { /* */ });
  }, []);
  useEffect(() => { load(); }, [load, refreshKey]);

  const onEnable = async () => {
    if (isIOS && !standalone) { toast.info(tri("Su iPhone: tocca Condividi → Aggiungi a Home, poi riapri l'app per attivare le notifiche.", "Auf dem iPhone: Teilen → Zum Home-Bildschirm, dann App erneut öffnen.", "On iPhone: Share → Add to Home Screen, then reopen the app to enable notifications.", "En iPhone: Compartir → Añadir a inicio.", "Sur iPhone : Partager → Sur l'écran d'accueil.", "روی آیفون: اشتراک‌گذاری → افزودن به هوم.")); return; }
    const ok = await enablePush();
    setPushOn(ok);
    toast[ok ? "success" : "error"](ok ? tri("Notifiche attive: riceverai gli allarmi critici.", "Benachrichtigungen aktiv.", "Notifications enabled: you'll get critical alarms.", "Notificaciones activas.", "Notifications activées.", "اعلان‌ها فعال شد.") : tri("Notifiche non attivate.", "Nicht aktiviert.", "Notifications not enabled.", "No activadas.", "Non activées.", "فعال نشد."));
  };

  const onExport = async () => {
    try {
      const r = await api.get("/deck/alarms/export", { responseType: "blob" });
      const url = URL.createObjectURL(r.data);
      const a = document.createElement("a");
      a.href = url; a.download = `allarmi_${new Date().toISOString().slice(0, 10)}.txt`;
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    } catch { toast.error(tri("Export non riuscito.", "Export fehlgeschlagen.", "Export failed.", "Error de exportación.", "Échec de l'export.", "خطا در خروجی.")); }
  };

  return (
    <div data-testid="deck-alarm-bar" className="mb-6 rounded-xl border border-[#64748B]/25 bg-[#0D1520]/70 backdrop-blur px-3 py-2.5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button data-testid="alarm-history-toggle" onClick={() => setOpen((v) => !v)} className="flex items-center gap-2 text-[#CBD5E1] hover:text-white transition-colors">
          <History size={16} className="text-[#FF6B00]" />
          <span className="text-sm font-bold uppercase tracking-wider">{tri("Storico allarmi", "Alarm-Verlauf", "Alarm history", "Historial de alarmas", "Historique des alarmes", "تاریخچه هشدارها")}</span>
          <span data-testid="alarm-count" className={`text-xs font-mono-data px-2 py-0.5 rounded-full ${items.length ? "bg-[#f43f5e]/20 text-[#f43f5e]" : "bg-[#22c55e]/15 text-[#22c55e]"}`}>{items.length}</span>
          {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
        <div className="flex items-center gap-2">
          <button data-testid="alarm-export-btn" onClick={onExport} className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border border-[#64748B]/40 text-[#CBD5E1] hover:border-[#FF6B00] hover:text-[#FF6B00] transition-colors active:scale-95">
            <Download size={14} /> {tri("Esporta", "Export", "Export", "Exportar", "Exporter", "خروجی")}
          </button>
          <button data-testid="alarm-push-btn" onClick={onEnable} className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border transition-colors active:scale-95 ${pushOn ? "border-[#22c55e]/50 text-[#22c55e]" : "border-[#FF6B00]/50 text-[#FF6B00] hover:bg-[#FF6B00]/10"}`}>
            {isIOS && !standalone ? <Smartphone size={14} /> : <Bell size={14} />}
            {pushOn ? tri("Notifiche ON", "Aktiv", "Alerts ON", "Activas", "Activées", "روشن") : tri("Attiva notifiche", "Aktivieren", "Enable alerts", "Activar", "Activer", "فعال‌سازی")}
          </button>
        </div>
      </div>
      {open && (
        <div data-testid="alarm-timeline" className="mt-3 pt-3 border-t border-[#64748B]/20 space-y-1.5 max-h-52 overflow-y-auto">
          {items.length === 0 ? (
            <p className="text-xs text-[#94A3B8] py-2">{tri("Nessun allarme critico oggi. Turno regolare.", "Heute keine kritischen Alarme.", "No critical alarms today. Smooth shift.", "Sin alarmas críticas hoy.", "Aucune alarme critique aujourd'hui.", "امروز هشدار بحرانی نبود.")}</p>
          ) : items.map((it, i) => (
            <div key={i} data-testid={`alarm-row-${i}`} className="flex items-center gap-2.5 text-xs">
              <AlertTriangle size={14} className="text-[#f43f5e] shrink-0" />
              <span className="font-mono-data text-[#FF6B00] font-bold shrink-0">{it.hm}</span>
              <span className="text-[#CBD5E1] truncate">
                {(it.departments || []).map((d) => DEPT_IT[d] || d).join(", ") || "—"}
                {it.stations && it.stations.length ? <span className="text-[#94A3B8]"> · {it.stations.join(", ")}</span> : null}
              </span>
              <span className="ml-auto font-mono-data text-[#94A3B8] shrink-0">{it.heartbeat} BPM</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
