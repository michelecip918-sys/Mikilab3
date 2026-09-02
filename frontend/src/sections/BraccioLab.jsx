import { useEffect, useState } from "react";
import { ChefHat, LifeBuoy, SlidersHorizontal, AlertTriangle, Zap, PackageCheck, ClipboardList, Clock, Headphones } from "lucide-react";
import { toast } from "sonner";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { useShift, setWorkMode, hasActiveAlerts, autonomyDeadline, fmtHM } from "@/lib/shiftState";
import { isHeadsetRoutingAvailable, connectHeadset, startHeadsetSco } from "@/lib/nativeAudio";
import Avatar3D from "@/components/Avatar3D";
import MikiLabEliteEngine from "@/sections/MikiLabEliteEngine";
import { Cpu } from "lucide-react";

// VISTA "SCHEDE DI PRODUZIONE" — tema SCURO "Grain Gold" (ebano caldo + oro), zero-scroll.
// Hands-free: ascolto continuo (tasto ORECCHIO in basso). Avatar 3D vocale al centro.
const D = { bg: "#17120B", surf: "#241B10", surf2: "#2E2214", border: "#6E5320", gold: "#E7B23C", goldSoft: "#C8862B", text: "#F0E4CC", muted: "#B79B6A", danger: "#E0722E" };

export default function BraccioLab({ onOpenTool, onGestione }) {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const shift = useShift();
  const alert = hasActiveAlerts(shift);
  const [vs, setVs] = useState({ listening: false, speaking: false, wake: false });

  useEffect(() => {
    document.body.classList.add("braccio-mode");
    // Microfono MAI in autostart: si attiva SOLO col pulsante 👂 (nessun prompt/beep automatico).
    const onState = (e) => setVs({ listening: !!e.detail?.listening, speaking: !!e.detail?.speaking, wake: !!e.detail?.wake });
    window.addEventListener("mikilab-voice-state", onState);
    return () => { document.body.classList.remove("braccio-mode"); window.removeEventListener("mikilab-voice-state", onState); };
  }, []);

  const consegne = () => window.dispatchEvent(new Event("mikilab-consegne"));
  const [eliteOpen, setEliteOpen] = useState(false);
  const [hsBusy, setHsBusy] = useState(false);
  const onHeadset = async () => {
    setHsBusy(true);
    try {
      // Richiedi SUBITO il permesso microfono nel gesto del click (Web Speech API).
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try { const s = await navigator.mediaDevices.getUserMedia({ audio: true }); s.getTracks().forEach((t) => t.stop()); }
        catch { toast.error(tri("Permesso microfono negato. Abilitalo nelle impostazioni del browser.", "Mikrofon verweigert. In den Browser-Einstellungen erlauben.", "Microphone denied. Enable it in browser settings.", "Micrófono denegado. Actívalo en el navegador.", "Micro refusé. Active-le dans le navigateur.", "میکروفون رد شد. در تنظیمات مرورگر فعال کن.")); setHsBusy(false); return; }
      }
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
    <div data-testid="braccio-lab" className="flex flex-col justify-between rounded-3xl p-4" style={{ height: "calc(100vh - 200px)", minHeight: "460px", background: `radial-gradient(120% 60% at 50% -10%, #2A2012 0%, ${D.bg} 55%)`, color: D.text, border: `1px solid ${D.border}` }}>
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
          <p className="text-[10.5px] font-extrabold tracking-wide mt-1" style={{ color: D.gold }} data-testid="braccio-bakemix">MikiLab — powered by BakeMix AI</p>
        </div>
      )}

      {/* Avatar 3D vocale + STRUMENTO UNICO del laboratorio: Elite Engine */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 py-2">
        <Avatar3D active speaking={vs.speaking} listening={vs.listening || vs.wake}
          label={vs.speaking ? tri("Sto rispondendo…", "Ich antworte…", "Answering…", "Respondiendo…", "Je réponds…", "در حال پاسخ…") : ((vs.listening || vs.wake) ? tri("Ti ascolto…", "Ich höre…", "Listening…", "Escuchando…", "J'écoute…", "می‌شنوم…") : tri("Assistente pronto", "Assistent bereit", "Assistant ready", "Asistente listo", "Assistant prêt", "دستیار آماده"))}
          sub={tri("Tocca 👂 per parlare (mai da solo)", "Tippe 👂 zum Sprechen", "Tap 👂 to talk", "Toca 👂 para hablar", "Touche 👂 pour parler", "برای صحبت 👂 را بزن")} />
        <button data-testid="braccio-elite-engine" onClick={() => setEliteOpen(true)}
          className="flex items-center gap-2 rounded-2xl px-7 py-4 font-extrabold text-[16px] shadow-lg active:scale-95 transition-all"
          style={{ background: D.gold, border: `3px solid #F6D27A`, color: D.bg }}>
          <Cpu className="w-5 h-5" /> {tri("Apri MikiLab Elite Engine", "MikiLab Elite Engine öffnen", "Open MikiLab Elite Engine", "Abrir MikiLab Elite Engine", "Ouvrir MikiLab Elite Engine", "باز کردن MikiLab Elite Engine")}
        </button>
        <p className="text-[11px]" style={{ color: D.muted }}>{tri("Strumento unico del laboratorio", "Einziges Laborwerkzeug", "The lab's single tool", "Herramienta única del laboratorio", "Outil unique du laboratoire", "تنها ابزار آزمایشگاه")}</p>
      </div>

      <MikiLabEliteEngine open={eliteOpen} onClose={() => setEliteOpen(false)} />
    </div>
  );
}
