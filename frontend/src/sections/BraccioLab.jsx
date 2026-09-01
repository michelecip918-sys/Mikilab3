import { useEffect, useState } from "react";
import { Mic, ChefHat, LifeBuoy, SlidersHorizontal, AlertTriangle, Zap, PackageCheck } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { useShift, setWorkMode, hasActiveAlerts } from "@/lib/shiftState";

// HOME "BRACCIO": schermata operativa da laboratorio, mobile, ZERO scroll.
// Microfono gigante (tieni premuto e parla) + 3 tasti rapidi + modalità di lavoro.
// Se ci sono guasti/celle giù/note → banner di emergenza in alto per il turno.
export default function BraccioLab({ onOpenTool, onGestione }) {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [pressed, setPressed] = useState(false);
  const shift = useShift();
  const alert = hasActiveAlerts(shift);

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
    { id: "ricettadelgiorno", Icon: ChefHat, t: tri("Ricette del Giorno", "Tagesrezepte", "Today's Recipes", "Recetas del Día", "Recettes du Jour", "دستورهای امروز"), s: tri("Prodotti di oggi", "Heutige Produkte", "Today's products", "Productos de hoy", "Produits du jour", "محصولات امروز") },
    { id: "emergenze", Icon: AlertTriangle, t: tri("Guasti & Celle", "Störungen & Zellen", "Failures & Cells", "Averías y Cámaras", "Pannes & Chambres", "خرابی و سردخانه"), s: tri("Emergenze & freddo", "Notfall & Kälte", "Emergency & cold", "Emergencia y frío", "Urgence & froid", "اضطراری و سرما"), badge: alert },
    { id: "sosimpasto", Icon: LifeBuoy, t: tri("SOS Impasto", "SOS Teig", "Dough SOS", "SOS Masa", "SOS Pâte", "اس‌اواس خمیر"), s: tri("Soluzioni rapide", "Schnelle Hilfe", "Quick fixes", "Soluciones rápidas", "Solutions rapides", "راه‌حل سریع") },
  ];

  const lastNote = (shift.shift_notes || [])[0];

  return (
    <div data-testid="braccio-lab" className="flex flex-col justify-between rounded-3xl p-4" style={{ height: "calc(100vh - 180px)", minHeight: "460px", background: "#F5ECD7", color: "#3D2B1F" }}>
      {/* Banner di emergenza / nota turno (solo se attivo) */}
      {alert ? (
        <button data-testid="braccio-alert-banner" onClick={() => onOpenTool && onOpenTool("emergenze")}
          className="rounded-2xl p-3 text-left active:scale-98 transition-all" style={{ background: "#FBEEDD", border: "2px solid #9C4A1E" }}>
          <div className="flex items-center gap-2 mb-0.5">
            <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: "#9C4A1E" }} />
            <span className="font-extrabold text-[13px]" style={{ color: "#9C4A1E" }}>{tri("Nota per il turno", "Schicht-Notiz", "Shift note", "Nota del turno", "Note de poste", "یادداشت شیفت")}</span>
          </div>
          <p className="text-[12px] leading-snug line-clamp-2" style={{ color: "#3D2B1F" }}>{lastNote ? lastNote.text : tri("Ci sono avvisi attivi. Tocca per gestire.", "Aktive Hinweise. Tippen.", "Active alerts. Tap to manage.", "Avisos activos. Toca.", "Alertes actives.", "هشدار فعال.")}</p>
        </button>
      ) : (
        <div data-testid="braccio-banner" className="rounded-2xl p-3.5" style={{ background: "#FBF6E8", border: "2px solid #E3C989" }}>
          <p className="text-[13.5px] leading-snug" style={{ color: "#3D2B1F" }}>
            <span className="font-bold text-[#ff6b00]">{tri("Il tuo assistente di laboratorio", "Dein Laborassistent", "Your lab assistant", "Tu asistente de laboratorio", "Ton assistant de laboratoire", "دستیار آزمایشگاه تو")}:</span>{" "}
            {tri("l'IA calcola in automatico idratazioni, orari e bilanciamento ricette.", "die KI berechnet automatisch Hydratation, Zeiten und Rezeptbalance.", "the AI automatically computes hydration, timing and recipe balancing.", "la IA calcula automáticamente hidrataciones, horarios y balance de recetas.", "l'IA calcule automatiquement hydratations, horaires et équilibrage.", "هوش مصنوعی هیدراتاسیون، زمان و تعادل دستور را خودکار حساب می‌کند.")}
          </p>
        </div>
      )}

      {/* Modalità di lavoro: Flusso Continuo / In Autonomia */}
      <div className="grid grid-cols-2 gap-2 mt-2" data-testid="braccio-workmode">
        {[
          { id: "continuo", Icon: Zap, t: tri("Flusso Continuo", "Kontinuierlich", "Continuous", "Flujo Continuo", "Flux Continu", "پیوسته") },
          { id: "autonomia", Icon: PackageCheck, t: tri("In Autonomia", "Eigenständig", "Autonomous", "En Autonomía", "En Autonomie", "خودگردان") },
        ].map((m) => {
          const on = shift.work_mode === m.id;
          return (
            <button key={m.id} data-testid={`braccio-mode-${m.id}`} onClick={() => setWorkMode(m.id)}
              className="flex items-center justify-center gap-1.5 rounded-xl py-2 font-extrabold text-[12.5px] active:scale-95 transition-all"
              style={{ background: on ? "#C8862B" : "#FBF6E8", border: `2px solid ${on ? "#C8862B" : "#E3C989"}`, color: on ? "#F5ECD7" : "#3D2B1F" }}>
              <m.Icon className="w-4 h-4" /> {m.t}
            </button>
          );
        })}
      </div>

      {/* Microfono gigante centrale */}
      <div className="flex-1 flex flex-col items-center justify-center gap-3 py-1">
        <button
          data-testid="braccio-mic"
          onPointerDown={startVoice}
          onPointerUp={stopVoice}
          onPointerLeave={() => pressed && stopVoice()}
          className="relative rounded-full flex items-center justify-center shadow-2xl transition-all select-none active:scale-95"
          style={{ width: "min(50vw, 200px)", height: "min(50vw, 200px)", background: pressed ? "#543720" : "#6B4A2B", color: "#F5ECD7", border: "6px solid #C8862B" }}
        >
          {pressed && <span className="absolute inset-0 rounded-full animate-ping" style={{ border: "4px solid rgba(200,134,43,0.6)" }} />}
          <Mic style={{ width: "40%", height: "40%" }} />
        </button>
        <p className="font-extrabold text-center" style={{ fontSize: "clamp(15px,4.2vw,19px)", color: "#3D2B1F" }} data-testid="braccio-mic-label">
          {pressed ? tri("Ti ascolto…", "Ich höre…", "Listening…", "Escuchando…", "J'écoute…", "می‌شنوم…") : tri("Tieni premuto e parla", "Halten und sprechen", "Hold and speak", "Mantén pulsado y habla", "Maintiens et parle", "نگه‌دار و صحبت کن")}
        </p>
      </div>

      {/* 3 tasti rapidi */}
      <div className="grid grid-cols-3 gap-2.5">
        {QUICK.map((q) => (
          <button key={q.id} data-testid={`braccio-quick-${q.id}`} onClick={() => onOpenTool && onOpenTool(q.id)}
            className="relative flex flex-col items-center gap-1.5 rounded-2xl min-h-[92px] p-2.5 active:scale-95 transition-all" style={{ background: "#FBF6E8", border: `2px solid ${q.badge ? "#9C4A1E" : "#E3C989"}` }}>
            {q.badge && <span className="absolute top-1.5 right-1.5 w-3 h-3 rounded-full animate-pulse" style={{ background: "#9C4A1E" }} />}
            <span className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: q.badge ? "#9C4A1E" : "#C8862B" }}><q.Icon className="w-5 h-5" style={{ color: "#FBF6E8" }} /></span>
            <span className="text-[12px] font-extrabold text-center leading-tight" style={{ color: "#3D2B1F" }}>{q.t}</span>
            <span className="text-[9.5px] text-center leading-tight" style={{ color: "#8A5A16" }}>{q.s}</span>
          </button>
        ))}
      </div>

      {/* Accesso Gestione (PC / Chef) */}
      <button data-testid="braccio-gestione" onClick={onGestione}
        className="mt-2 w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-bold active:scale-98 transition-all" style={{ background: "transparent", border: "2px solid #C8862B", color: "#8A5A16" }}>
        <SlidersHorizontal className="w-4 h-4" /> {tri("Gestione (PC / Chef)", "Verwaltung (PC / Chef)", "Management (PC / Chef)", "Gestión (PC / Chef)", "Gestion (PC / Chef)", "مدیریت")}
      </button>
    </div>
  );
}
