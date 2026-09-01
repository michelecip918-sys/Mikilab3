import { useEffect } from "react";
import { Mic, ChefHat, LifeBuoy, SlidersHorizontal, AlertTriangle, Zap, PackageCheck, ClipboardList, Clock } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { useShift, setWorkMode, hasActiveAlerts, autonomyDeadline, fmtHM } from "@/lib/shiftState";

// VISTA "SCHEDE DI PRODUZIONE" (operativa, mobile, Zero-Scroll, tema Oro del Grano).
// Hands-free: ascolto continuo in background (niente push-to-talk). 3 tasti rapidi.
export default function BraccioLab({ onOpenTool, onGestione }) {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const shift = useShift();
  const alert = hasActiveAlerts(shift);

  useEffect(() => {
    document.body.classList.add("braccio-mode");
    // Ascolto continuo hands-free: attiva la wake-word "Ehi Lab" (il tasto ORECCHIO in basso resta visibile).
    window.dispatchEvent(new Event("mikilab-wake-on"));
    return () => { document.body.classList.remove("braccio-mode"); };
  }, []);

  const consegne = () => window.dispatchEvent(new Event("mikilab-consegne"));

  const QUICK = [
    { id: "ricettadelgiorno", Icon: ChefHat, t: tri("Ricette del Giorno", "Tagesrezepte", "Today's Recipes", "Recetas del Día", "Recettes du Jour", "دستورهای امروز"), s: tri("Prodotti di oggi", "Heutige Produkte", "Today's products", "Productos de hoy", "Produits du jour", "محصولات امروز") },
    { id: "emergenze", Icon: AlertTriangle, t: tri("Guasti & Celle", "Störungen & Zellen", "Failures & Cells", "Averías y Cámaras", "Pannes & Chambres", "خرابی و سردخانه"), s: tri("Emergenze & freddo", "Notfall & Kälte", "Emergency & cold", "Emergencia y frío", "Urgence & froid", "اضطراری و سرما"), badge: alert },
    { id: "sosimpasto", Icon: LifeBuoy, t: tri("SOS Impasto", "SOS Teig", "Dough SOS", "SOS Masa", "SOS Pâte", "اس‌اواس خمیر"), s: tri("Soluzioni rapide", "Schnelle Hilfe", "Quick fixes", "Soluciones rápidas", "Solutions rapides", "راه‌حل سریع") },
  ];

  const lastNote = (shift.shift_notes || [])[0];
  const deadline = shift.work_mode === "autonomia" ? autonomyDeadline(shift) : null;

  return (
    <div data-testid="braccio-lab" className="flex flex-col justify-between rounded-3xl p-4" style={{ height: "calc(100vh - 180px)", minHeight: "480px", background: "#F5ECD7", color: "#3D2B1F" }}>
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
        <div data-testid="braccio-banner" className="rounded-2xl p-3" style={{ background: "#FBF6E8", border: "2px solid #E3C989" }}>
          <p className="text-[13px] leading-snug" style={{ color: "#3D2B1F" }}>
            <span className="font-bold" style={{ color: "#C8862B" }}>{tri("Il tuo assistente di laboratorio", "Dein Laborassistent", "Your lab assistant", "Tu asistente de laboratorio", "Ton assistant de laboratoire", "دستیار آزمایشگاه تو")}:</span>{" "}
            {tri("calcola idratazioni, orari e bilanciamento. Parla liberamente.", "berechnet Hydratation, Zeiten und Balance. Sprich frei.", "computes hydration, timing and balancing. Just speak.", "calcula hidrataciones, horarios y balance. Habla libremente.", "calcule hydratations, horaires et équilibrage. Parle librement.", "هیدراتاسیون، زمان و تعادل را حساب می‌کند. آزادانه صحبت کن.")}
          </p>
        </div>
      )}

      {/* Modalità di lavoro */}
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
      {deadline && (
        <div data-testid="braccio-autonomy-deadline" className="mt-1.5 flex items-center gap-1.5 rounded-xl px-3 py-1.5" style={{ background: "#FBF6E8", border: "2px solid #E3C989" }}>
          <Clock className="w-3.5 h-3.5" style={{ color: "#C8862B" }} />
          <span className="text-[12px] font-bold" style={{ color: "#8A5A16" }}>{tri("Autonomia fino alle", "Autonom bis", "Autonomous until", "Autonomía hasta", "Autonomie jusqu'à", "خودگردان تا")} {fmtHM(deadline, lang)}</span>
        </div>
      )}

      {/* Hands-free: ascolto continuo attivo (controllo = tasto ORECCHIO in basso a destra) */}
      <div className="flex-1 flex flex-col items-center justify-center gap-3 py-2">
        <div data-testid="braccio-hf" className="flex flex-col items-center gap-2 rounded-2xl px-6 py-5" style={{ background: "#FBF6E8", border: "2px solid #E3C989" }}>
          <span className="relative w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "#6B4A2B", border: "5px solid #C8862B" }}>
            <span className="absolute inset-0 rounded-full animate-ping" style={{ border: "4px solid rgba(200,134,43,0.4)" }} />
            <Mic style={{ width: 26, height: 26, color: "#F5ECD7" }} />
          </span>
          <p className="font-extrabold text-center" style={{ fontSize: "clamp(15px,4.2vw,18px)", color: "#3D2B1F" }} data-testid="braccio-hf-label">
            {tri("Assistente in ascolto", "Assistent hört zu", "Assistant listening", "Asistente escuchando", "Assistant à l'écoute", "دستیار در حال شنیدن")}
          </p>
          <p className="text-center text-[12px]" style={{ color: "#8A5A16" }}>{tri("Parla liberamente o di' «Ehi Lab»", "Sprich frei oder sag «Ehi Lab»", "Speak freely or say «Ehi Lab»", "Habla o di «Ehi Lab»", "Parle ou dis «Ehi Lab»", "آزادانه صحبت کن یا بگو «لب»")}</p>
        </div>
        <button data-testid="braccio-consegne" onClick={consegne}
          className="flex items-center gap-2 rounded-full px-4 py-2 font-bold text-[13px] active:scale-95 transition-all" style={{ background: "#FBF6E8", border: "2px solid #C8862B", color: "#8A5A16" }}>
          <ClipboardList className="w-4 h-4" /> {tri("Consegne del turno", "Schichtübergabe", "Shift handover", "Relevo de turno", "Passation", "تحویل شیفت")}
        </button>
      </div>

      {/* 3 tasti rapidi */}
      <div className="grid grid-cols-3 gap-2.5">
        {QUICK.map((q) => (
          <button key={q.id} data-testid={`braccio-quick-${q.id}`} onClick={() => onOpenTool && onOpenTool(q.id)}
            className="relative flex flex-col items-center gap-1.5 rounded-2xl min-h-[90px] p-2.5 active:scale-95 transition-all" style={{ background: "#FBF6E8", border: `2px solid ${q.badge ? "#9C4A1E" : "#E3C989"}` }}>
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
