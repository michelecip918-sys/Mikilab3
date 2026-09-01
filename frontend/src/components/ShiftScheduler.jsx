import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useLang } from "@/i18n/LanguageContext";
import { routeVoice } from "@/lib/nativeAudio";
import { getCurrentOperator, zoneLabel, nowHM } from "@/lib/brigata";

// Scheduler cambio-mansione: quando scatta l'orario programmato per l'operatore
// corrente, Mickey Lab avvisa a voce (frase breve). Simulato lato client.
export default function ShiftScheduler() {
  const { lang } = useLang();
  const firedRef = useRef(new Set());

  useEffect(() => {
    const check = () => {
      const op = getCurrentOperator();
      if (!op || !op.changeAt || !op.changeTo) return;
      const hm = nowHM();
      if (hm !== op.changeAt) return;
      const key = `${op.id}-${op.changeAt}-${new Date().toDateString()}`;
      if (firedRef.current.has(key)) return;
      firedRef.current.add(key);
      const zone = zoneLabel(op.changeTo, lang);
      const msg = lang === "de" ? `${op.name}, ${op.changeAt}. Wechsel: ${zone}. Bereit machen.`
        : lang === "en" ? `${op.name}, ${op.changeAt}. Change: ${zone}. Get ready.`
        : lang === "es" ? `${op.name}, ${op.changeAt}. Cambio: ${zone}. Prepárate.`
        : `${op.name}, ore ${op.changeAt}. Cambio mansione: ${zone}. Preparati.`;
      toast.info("👨‍🍳 Mickey Lab", { description: msg, duration: 8000 });
      routeVoice({ text: msg, lang, persona: "michele", operator: op });
    };
    const iv = setInterval(check, 20000);
    check();
    return () => clearInterval(iv);
  }, [lang]);

  return null;
}
