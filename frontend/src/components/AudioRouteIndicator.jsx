import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Headphones } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { zoneLabel } from "@/lib/brigata";

// Indicatore UI multi-operatore: mostra a schermo quale operatore/auricolare
// sta ricevendo la notifica vocale (simulazione dell'instradamento nativo).
export default function AudioRouteIndicator() {
  const { lang } = useLang();
  const tri = (i, d, e, s) => mkTri(lang)(i, d, e, s);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    let timer;
    const h = (e) => {
      const d = e.detail || {};
      setMsg({ text: d.text, persona: d.persona, operator: d.operator });
      clearTimeout(timer);
      timer = setTimeout(() => setMsg(null), 6000);
    };
    window.addEventListener("mikilab-audio-route", h);
    return () => { window.removeEventListener("mikilab-audio-route", h); clearTimeout(timer); };
  }, []);

  if (!msg) return null;
  const op = msg.operator;
  const who = op ? op.name : tri("Tutta la squadra", "Ganzes Team", "Whole team", "Todo el equipo");
  const zone = op && op.zone ? ` · ${zoneLabel(op.zone, lang)}` : "";
  const ear = op && op.earphone ? ` · 🎧 ${op.earphone}` : "";

  return createPortal(
    <div data-testid="audio-route-indicator" className="fixed inset-x-0 top-3 z-[400] flex justify-center pointer-events-none px-3">
      <div className="flex items-center gap-2.5 rounded-2xl bg-[#0B0E14]/95 backdrop-blur border border-[#3B82F6]/60 px-3.5 py-2.5 shadow-2xl max-w-sm">
        <span className="relative flex w-2.5 h-2.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3B82F6] opacity-70" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#3B82F6]" />
        </span>
        <Headphones className="w-4 h-4 text-[#3B82F6] shrink-0" />
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#3B82F6]">{tri("In cuffia a", "Im Headset an", "To headset", "Al auricular")}: <span className="text-white">{who}</span><span className="text-white/60">{zone}{ear}</span></p>
          {msg.text && <p className="text-[12px] text-white leading-snug truncate" data-testid="audio-route-text">{msg.text}</p>}
        </div>
      </div>
    </div>,
    document.body
  );
}
