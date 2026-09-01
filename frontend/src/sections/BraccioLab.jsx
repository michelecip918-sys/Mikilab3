import { useEffect, useState } from "react";
import { ChefHat, LifeBuoy, SlidersHorizontal, AlertTriangle, Zap, PackageCheck, ClipboardList, Clock, Headphones } from "lucide-react";
import { toast } from "sonner";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { useShift, setWorkMode, hasActiveAlerts, autonomyDeadline, fmtHM } from "@/lib/shiftState";
import { isHeadsetRoutingAvailable, connectHeadset, startHeadsetSco } from "@/lib/nativeAudio";
import Avatar3D from "@/components/Avatar3D";

// VISTA "SCHEDE DI PRODUZIONE" — tema SCURO "Grain Gold" (ebano caldo + oro), zero-scroll.
// Hands-free: ascolto continuo (tasto ORECCHIO in basso). Avatar 3D vocale al centro.
const D = { bg: "#17120B", surf: "#241B10", surf2: "#2E2214", border: "#6E5320", gold: "#E7B23C", goldSoft: "#C8862B", text: "#F0E4CC", muted: "#B79B6A", danger: "#E0722E" };

export default function BraccioLab({ onOpenTool, onGestione }) {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const shift = useShift();
  const alert = hasActiveAlerts(shift);
  const [vs, setVs] = useState({ listening: false, speaking: false });

  useEffect(() => {
    document.body.classList.add("braccio-mode");
    window.dispatchEvent(new Event("mikilab-wake-on"));
    const onState = (e) => setVs({ listening: !!e.detail?.listening, speaking: !!e.detail?.speaking });
    window.addEventListener("mikilab-voice-state", onState);
    return () => { document.body.classList.remove("braccio-mode"); window.removeEventListener("mikilab-voice-state", onState); };
  }, []);

  const consegne = () => window.dispatchEvent(new Event("mikilab-consegne"));
  const [hsBusy, setHsBusy] = useState(false);
  const onHeadset = async () => {
    setHsBusy(true);
    try {
      if (isHeadsetRoutingAvailable()) {
        const r = await connectHeadset();
        if (r.ok) { await startHeadsetSco(); window.dispatchEvent(new Event("mikilab-wake-on")); toast.success(tri("Cuffie collegate. Assistente in cuffia.", "Headset verbunden.", "Headset connected.", "Auriculares conectados.", "Casque connecté.", "هدست وصل شد.")); }
        else toast.error(tri("Cuffie non collegate.", "Headset nicht verbunden.", "Headset not connected.", "No conectado.", "Non connecté.", "وصل نشد."));
      } else {
        window.dispatchEvent(new Event("mikilab-wake-on"));
        toast.info(tri("Ascolto hands-free attivo. Il routing in cuffia è nell'app installata.", "Hands-free aktiv. Kopfhörer-Routing in der App.", "Hands-free on. Headset routing is in the installed app.", "Manos libres activo. El enrutado va en la app.", "Mains libres actif. Routage casque dans l'app.", "هندزفری فعال شد."));
      }
    } finally { setHsBusy(false); }
  };

  const QUICK = [
    { id: "ricettadelgiorno", Icon: ChefHat, t: tri("Ricette del Giorno", "Tagesrezepte", "Today's Recipes", "Recetas del Día", "Recettes du Jour", "دستورهای امروز"), s: tri("Prodotti di oggi", "Heutige Produkte", "Today's products", "Productos de hoy", "Produits du jour", "محصولات امروز") },
    { id: "emergenze", Icon: AlertTriangle, t: tri("Guasti & Celle", "Störungen & Zellen", "Failures & Cells", "Averías y Cámaras", "Pannes & Chambres", "خرابی و سردخانه"), s: tri("Emergenze & freddo", "Notfall & Kälte", "Emergency & cold", "Emergencia y frío", "Urgence & froid", "اضطراری و سرما"), badge: alert },
    { id: "sosimpasto", Icon: LifeBuoy, t: tri("SOS Impasto", "SOS Teig", "Dough SOS", "SOS Masa", "SOS Pâte", "اس‌اواس خمیر"), s: tri("Soluzioni rapide", "Schnelle Hilfe", "Quick fixes", "Soluciones rápidas", "Solutions rapides", "راه‌حل سریع") },
  ];

  const lastNote = (shift.shift_notes || [])[0];
  const deadline = shift.work_mode === "autonomia" ? autonomyDeadline(shift) : null;

  return (
    <div data-testid="braccio-lab" className="flex flex-col justify-between rounded-3xl p-4" style={{ height: "calc(100vh - 180px)", minHeight: "480px", background: `radial-gradient(120% 60% at 50% -10%, #2A2012 0%, ${D.bg} 55%)`, color: D.text, border: `1px solid ${D.border}` }}>
      {/* Banner emergenza / info */}
      {alert ? (
        <button data-testid="braccio-alert-banner" onClick={() => onOpenTool && onOpenTool("emergenze")}
          className="rounded-2xl p-3 text-left active:scale-98 transition-all" style={{ background: "#2A1710", border: `2px solid ${D.danger}` }}>
          <div className="flex items-center gap-2 mb-0.5">
            <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: D.danger }} />
            <span className="font-extrabold text-[13px]" style={{ color: D.danger }}>{tri("Nota per il turno", "Schicht-Notiz", "Shift note", "Nota del turno", "Note de poste", "یادداشت شیفت")}</span>
          </div>
          <p className="text-[12px] leading-snug line-clamp-2" style={{ color: D.text }}>{lastNote ? lastNote.text : tri("Ci sono avvisi attivi. Tocca per gestire.", "Aktive Hinweise. Tippen.", "Active alerts. Tap to manage.", "Avisos activos. Toca.", "Alertes actives.", "هشدار فعال.")}</p>
        </button>
      ) : (
        <div data-testid="braccio-banner" className="rounded-2xl p-3" style={{ background: D.surf, border: `2px solid ${D.border}` }}>
          <p className="text-[13px] leading-snug" style={{ color: D.text }}>
            <span className="font-bold" style={{ color: D.gold }}>{tri("Il tuo assistente di laboratorio", "Dein Laborassistent", "Your lab assistant", "Tu asistente de laboratorio", "Ton assistant de laboratoire", "دستیار آزمایشگاه تو")}:</span>{" "}
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
              style={{ background: on ? D.gold : D.surf, border: `2px solid ${on ? D.gold : D.border}`, color: on ? D.bg : D.text }}>
              <m.Icon className="w-4 h-4" /> {m.t}
            </button>
          );
        })}
      </div>
      {deadline && (
        <div data-testid="braccio-autonomy-deadline" className="mt-1.5 flex items-center gap-1.5 rounded-xl px-3 py-1.5" style={{ background: D.surf, border: `2px solid ${D.border}` }}>
          <Clock className="w-3.5 h-3.5" style={{ color: D.gold }} />
          <span className="text-[12px] font-bold" style={{ color: D.gold }}>{tri("Autonomia fino alle", "Autonom bis", "Autonomous until", "Autonomía hasta", "Autonomie jusqu'à", "خودگردان تا")} {fmtHM(deadline, lang)}</span>
        </div>
      )}

      {/* Avatar 3D vocale (hands-free) */}
      <div className="flex-1 flex flex-col items-center justify-center gap-3 py-2">
        <Avatar3D active speaking={vs.speaking}
          label={vs.speaking ? tri("Sto rispondendo…", "Ich antworte…", "Answering…", "Respondiendo…", "Je réponds…", "در حال پاسخ…") : (vs.listening ? tri("Ti ascolto…", "Ich höre…", "Listening…", "Escuchando…", "J'écoute…", "می‌شنوم…") : tri("Assistente in ascolto", "Assistent hört zu", "Assistant listening", "Asistente escuchando", "Assistant à l'écoute", "دستیار در حال شنیدن"))}
          sub={tri("Parla o di' «Ehi Lab»", "Sprich oder sag «Ehi Lab»", "Speak or say «Ehi Lab»", "Habla o di «Ehi Lab»", "Parle ou dis «Ehi Lab»", "صحبت کن یا بگو «لب»")} />
        <button data-testid="braccio-headset" onClick={onHeadset} disabled={hsBusy}
          className="flex items-center gap-2 rounded-full px-6 py-3 font-extrabold text-[15px] shadow-lg active:scale-95 transition-all disabled:opacity-60"
          style={{ background: "#E7B23C", color: "#17120B", border: "3px solid #F6D27A" }}>
          <Headphones className="w-5 h-5" strokeWidth={2.6} /> {hsBusy ? tri("Collego…", "Verbinde…", "Connecting…", "Conectando…", "Connexion…", "اتصال…") : tri("Cuffie hands-free", "Headset hands-free", "Hands-free headset", "Auriculares", "Casque mains libres", "هدست")}
        </button>
        <button data-testid="braccio-consegne" onClick={consegne}
          className="flex items-center gap-2 rounded-full px-4 py-2 font-bold text-[13px] active:scale-95 transition-all" style={{ background: D.surf, border: `2px solid ${D.gold}`, color: D.gold }}>
          <ClipboardList className="w-4 h-4" /> {tri("Consegne del turno", "Schichtübergabe", "Shift handover", "Relevo de turno", "Passation", "تحویل شیفت")}
        </button>
      </div>

      {/* 3 tasti rapidi */}
      <div className="grid grid-cols-3 gap-2.5">
        {QUICK.map((q) => (
          <button key={q.id} data-testid={`braccio-quick-${q.id}`} onClick={() => onOpenTool && onOpenTool(q.id)}
            className="relative flex flex-col items-center gap-1.5 rounded-2xl min-h-[90px] p-2.5 active:scale-95 transition-all" style={{ background: D.surf, border: `2px solid ${q.badge ? D.danger : D.border}` }}>
            {q.badge && <span className="absolute top-1.5 right-1.5 w-3 h-3 rounded-full animate-pulse" style={{ background: D.danger }} />}
            <span className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: q.badge ? D.danger : D.gold }}><q.Icon className="w-5 h-5" style={{ color: D.bg }} /></span>
            <span className="text-[12px] font-extrabold text-center leading-tight" style={{ color: D.text }}>{q.t}</span>
            <span className="text-[9.5px] text-center leading-tight" style={{ color: D.muted }}>{q.s}</span>
          </button>
        ))}
      </div>

      {/* Accesso Gestione */}
      <button data-testid="braccio-gestione" onClick={onGestione}
        className="mt-2 w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-bold active:scale-98 transition-all" style={{ background: "transparent", border: `2px solid ${D.gold}`, color: D.gold }}>
        <SlidersHorizontal className="w-4 h-4" /> {tri("Gestione (PC / Chef)", "Verwaltung (PC / Chef)", "Management (PC / Chef)", "Gestión (PC / Chef)", "Gestion (PC / Chef)", "مدیریت")}
      </button>
    </div>
  );
}
