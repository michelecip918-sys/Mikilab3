import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { delegationApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// NOTIFICA DIREZIONE: avvisa il Capo quando un operatore supera la stima, ovunque si trovi
// nella console (non serve guardare la plancia). Sondaggio ogni 25s, un solo avviso per ritardo.
export default function LateNotifier() {
  const { lang } = useLang();
  const tri = mkTri(lang);
  const seen = useRef(new Set());
  const first = useRef(true);

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      const r = await delegationApi.lateAlerts();
      if (!alive) return;
      const alerts = (r && r.alerts) || [];
      for (const a of alerts) {
        if (seen.current.has(a.id)) continue;
        seen.current.add(a.id);
        if (first.current) continue; // al primo giro non re-notificare i ritardi già in corso
        toast.warning(
          tri(`${a.operator} è oltre la stima di ${a.over_min}′`, `${a.operator} überschreitet die Schätzung um ${a.over_min}′`, `${a.operator} is ${a.over_min}′ over ETA`, `${a.operator} supera la estimación en ${a.over_min}′`, `${a.operator} dépasse l'estimation de ${a.over_min}′`, `${a.operator} ${a.over_min}′ فراتر از برآورد`),
          { description: a.task ? String(a.task).slice(0, 60) : undefined, icon: <AlertTriangle className="w-4 h-4" />, duration: 8000 }
        );
      }
      first.current = false;
    };
    tick();
    const t = setInterval(tick, 25000);
    return () => { alive = false; clearInterval(t); };
  }, [lang]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
