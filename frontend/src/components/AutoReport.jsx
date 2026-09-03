import { useEffect, useRef } from "react";
import { useMixers } from "@/audio/MixerTimersContext";
import { useMachines } from "@/audio/MachinesContext";
import { reportsApi } from "@/lib/api";
import { toast } from "sonner";

// Report automatico serale: alla chiusura (orario impostato) archivia da solo il report del giorno.
// Nessuna UI: gira in background. Impostazioni condivise via localStorage con ReportGiornata.
const KEY_ON = "mikilab_autoreport_enabled";
const KEY_TIME = "mikilab_autoreport_time";
const KEY_LAST = "mikilab_autoreport_last";
const weekTotal = () => { try { const w = JSON.parse(localStorage.getItem("mikilab_planner_week") || "[]"); return Array.isArray(w) ? w.reduce((a, b) => a + (Number(b) || 0), 0) : 0; } catch { return 0; } };

export default function AutoReport() {
  const { list: mixers } = useMixers();
  const { history } = useMachines();
  const mixersRef = useRef(mixers); mixersRef.current = mixers;
  const historyRef = useRef(history); historyRef.current = history;

  useEffect(() => {
    const tick = async () => {
      try {
        if ((localStorage.getItem(KEY_ON) ?? "1") !== "1") return;
        const time = localStorage.getItem(KEY_TIME) || "21:00";
        const today = new Date().toISOString().slice(0, 10);
        if (localStorage.getItem(KEY_LAST) === today) return;
        const now = new Date();
        const [h, m] = time.split(":").map(Number);
        if (now.getHours() * 60 + now.getMinutes() < (h * 60 + (m || 0))) return;
        const active = mixersRef.current.filter((x) => x.running).length;
        const hist = historyRef.current || [];
        await reportsApi.save({
          date: today,
          mixers_active: active,
          alarms_count: hist.length,
          week_load: weekTotal(),
          alarms: hist.slice(0, 20).map((x) => ({ name: x.name, start: x.start, peak: Math.round(x.peak) })),
          notes: "auto",
        });
        localStorage.setItem(KEY_LAST, today);
        toast.success("Report di fine giornata archiviato automaticamente.");
      } catch { /* anonimo o offline: riprova al prossimo giro */ }
    };
    const id = setInterval(tick, 60000);
    const t0 = setTimeout(tick, 5000);
    return () => { clearInterval(id); clearTimeout(t0); };
  }, []);

  return null;
}
