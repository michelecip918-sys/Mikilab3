import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { warehouseApi } from "@/lib/api";
import { playTTS } from "@/lib/tts";

// Briefing vocale scorte all'ingresso in Lab Control: annuncia una sola volta per sessione
// le materie prime sotto (o vicine a) la soglia minima, con dati REALI dal backend.
let announced = false;

export default function LabBriefing() {
  const done = useRef(false);

  useEffect(() => {
    if (announced || done.current) return;
    done.current = true;
    announced = true;
    (async () => {
      try {
        const items = await warehouseApi.list();
        const low = (Array.isArray(items) ? items : []).filter(
          (i) => Number(i.min_kg) > 0 && Number(i.quantity_kg) <= Number(i.min_kg) * 1.2
        );
        if (low.length === 0) return;
        const names = low.map((i) => i.name).join(", ");
        toast.warning(`Briefing Scorte: ${names} vicine alla soglia critica.`, { duration: 7000 });
        try { playTTS(`Briefing scorte. Attenzione: ${names} vicine alla soglia critica. Valuta il riordino.`); } catch { /* */ }
      } catch {
        /* silenzioso: il briefing è opzionale */
      }
    })();
  }, []);

  return null;
}
