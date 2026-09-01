import { useEffect, useState } from "react";
import { Mic, ChefHat, Snowflake, LifeBuoy, SlidersHorizontal } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// HOME "BRACCIO": schermata operativa da laboratorio, mobile, ZERO scroll.
// Banner compatto + microfono gigante (tieni premuto e parla) + 3 tasti rapidi.
export default function BraccioLab({ onOpenTool, onGestione }) {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [pressed, setPressed] = useState(false);

  // Nasconde il FAB Voce globale: qui c'è già il mic gigante.
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("mikilab-fab", { detail: { hide: true } }));
    document.body.classList.add("braccio-mode");
    return () => {
      window.dispatchEvent(new CustomEvent("mikilab-fab", { detail: { hide: false } }));
      document.body.classList.remove("braccio-mode");
    };
  }, []);

  const startVoice = () => { setPressed(true); window.dispatchEvent(new Event("mikilab-voice-start")); };
  const stopVoice = () => { setPressed(false); window.dispatchEvent(new Event("mikilab-voice-stop")); };

  const QUICK = [
    { id: "manisporche", Icon: ChefHat, t: tri("Ricetta del Giorno", "Tagesrezept", "Today's Recipe", "Receta del Día", "Recette du Jour", "دستور امروز"), s: tri("Dosi di oggi", "Heutige Mengen", "Today's doses", "Dosis de hoy", "Doses du jour", "مقادیر امروز") },
    { id: "capo", Icon: Snowflake, t: tri("Celle Frigo", "Kühlzellen", "Cold Cells", "Cámaras Frío", "Chambres Froides", "سردخانه"), s: tri("Stato temperature", "Temperaturen", "Temperatures", "Temperaturas", "Températures", "دما") },
    { id: "sosimpasto", Icon: LifeBuoy, t: tri("SOS Impasto", "SOS Teig", "Dough SOS", "SOS Masa", "SOS Pâte", "اس‌اواس خمیر"), s: tri("Soluzioni rapide", "Schnelle Hilfe", "Quick fixes", "Soluciones rápidas", "Solutions rapides", "راه‌حل سریع") },
  ];

  return (
    <div data-testid="braccio-lab" className="flex flex-col justify-between" style={{ height: "calc(100vh - 180px)", minHeight: "460px" }}>
      {/* Banner informativo compatto */}
      <div data-testid="braccio-banner" className="rounded-2xl border border-[#ff6b00]/40 bg-gradient-to-br from-[#1e130a] to-[#141414] p-3.5">
        <p className="text-[13px] leading-snug text-[#e4eff8]">
          <span className="font-bold text-[#ff6b00]">{tri("Il tuo assistente di laboratorio", "Dein Laborassistent", "Your lab assistant", "Tu asistente de laboratorio", "Ton assistant de laboratoire", "دستیار آزمایشگاه تو")}:</span>{" "}
          {tri("l'IA calcola in automatico idratazioni, orari e bilanciamento ricette.", "die KI berechnet automatisch Hydratation, Zeiten und Rezeptbalance.", "the AI automatically computes hydration, timing and recipe balancing.", "la IA calcula automáticamente hidrataciones, horarios y balance de recetas.", "l'IA calcule automatiquement hydratations, horaires et équilibrage.", "هوش مصنوعی هیدراتاسیون، زمان و تعادل دستور را خودکار حساب می‌کند.")}
        </p>
      </div>

      {/* Microfono gigante centrale */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 py-2">
        <button
          data-testid="braccio-mic"
          onPointerDown={startVoice}
          onPointerUp={stopVoice}
          onPointerLeave={() => pressed && stopVoice()}
          className={`relative rounded-full flex items-center justify-center text-white shadow-2xl transition-all select-none ${pressed ? "bg-[#e05e00] scale-105" : "bg-[#ff6b00] active:scale-95"}`}
          style={{ width: "min(56vw, 220px)", height: "min(56vw, 220px)" }}
        >
          {pressed && <span className="absolute inset-0 rounded-full border-4 border-[#ff6b00]/60 animate-ping" />}
          <Mic style={{ width: "40%", height: "40%" }} />
        </button>
        <p className="text-base font-bold text-[#e4eff8]" data-testid="braccio-mic-label">
          {pressed ? tri("Ti ascolto…", "Ich höre…", "Listening…", "Escuchando…", "J'écoute…", "می‌شنوم…") : tri("Tieni premuto e parla", "Halten und sprechen", "Hold and speak", "Mantén pulsado y habla", "Maintiens et parle", "نگه‌دار و صحبت کن")}
        </p>
      </div>

      {/* 3 tasti rapidi */}
      <div className="grid grid-cols-3 gap-2.5">
        {QUICK.map((q) => (
          <button key={q.id} data-testid={`braccio-quick-${q.id}`} onClick={() => onOpenTool && onOpenTool(q.id)}
            className="flex flex-col items-center gap-1.5 rounded-2xl bg-[#1e1e1e] border border-[#2e2e2e] hover:border-[#ff6b00] min-h-[92px] p-2.5 active:scale-95 transition-all">
            <span className="w-10 h-10 rounded-xl bg-[#ff6b00]/15 border border-[#ff6b00]/35 flex items-center justify-center"><q.Icon className="w-5 h-5 text-[#ff6b00]" /></span>
            <span className="text-[12px] font-bold text-[#e4eff8] text-center leading-tight">{q.t}</span>
            <span className="text-[9.5px] text-[#7E8A93] text-center leading-tight">{q.s}</span>
          </button>
        ))}
      </div>

      {/* Accesso Gestione (PC / Chef) */}
      <button data-testid="braccio-gestione" onClick={onGestione}
        className="mt-2.5 w-full flex items-center justify-center gap-2 rounded-xl bg-transparent border border-[#2e2e2e] text-[#7E8A93] hover:text-[#e4eff8] hover:border-[#ff6b00]/40 py-2.5 text-[13px] font-semibold active:scale-98 transition-all">
        <SlidersHorizontal className="w-4 h-4" /> {tri("Gestione (PC / Chef)", "Verwaltung (PC / Chef)", "Management (PC / Chef)", "Gestión (PC / Chef)", "Gestion (PC / Chef)", "مدیریت")}
      </button>
    </div>
  );
}
