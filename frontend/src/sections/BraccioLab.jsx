import { useEffect, useState } from "react";
import { ChefHat, LifeBuoy, SlidersHorizontal, AlertTriangle, Zap, PackageCheck, ClipboardList, Clock, Headphones, PlusCircle, Wheat } from "lucide-react";
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
const D = { bg: "#0B0E14", surf: "#18202E", surf2: "#18202E", border: "#26324A", gold: "#E8A838", goldSoft: "#E8A838", text: "#F7F9FC", muted: "#94A3B8", danger: "#E63946" };

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
    <div data-testid="braccio-lab" className="flex flex-col rounded-3xl p-4 gap-3" style={{ minHeight: "460px", background: `radial-gradient(120% 60% at 50% -10%, #121722 0%, ${D.bg} 55%)`, color: D.text, border: `1px solid ${D.border}` }}>
      {/* Banner emergenza / info */}
      {alert ? (
        <button data-testid="braccio-alert-banner" onClick={() => onOpenTool && onOpenTool("emergenze")}
          className="rounded-2xl p-3 text-left active:scale-98 transition-all" style={{ background: "#18202E", border: `2px solid ${D.danger}` }}>
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
        <p className="text-[11px]" style={{ color: D.muted }}>{tri("Include Banco Impasti 3D, Forni, Pasticceria e Guida", "Enthält Teigbank 3D, Öfen, Konditorei & Guide", "Includes 3D Dough Bench, Ovens, Pastry & Guide", "Incluye Banco de Masas 3D, Hornos, Pastelería y Guía", "Inclut Banc à Pâte 3D, Fours, Pâtisserie & Guide", "شامل میز خمیر سه‌بعدی، فرها، شیرینی و راهنما")}</p>
      </div>

      {/* Comandi rapidi + Inserisci Ricetta */}
      <div className="space-y-2">
        <p className="text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5" style={{ color: D.gold }}>
          <Zap className="w-3.5 h-3.5" /> {tri("Comandi rapidi", "Schnellbefehle", "Quick commands", "Comandos rápidos", "Commandes rapides", "دستورهای سریع")}
        </p>
        <div className="grid grid-cols-2 gap-2" data-testid="braccio-quick">
          {QUICK.map((q) => (
            <button key={q.id} data-testid={`braccio-quick-${q.id}`} onClick={() => onOpenTool && onOpenTool(q.id)}
              className="relative flex items-center gap-2 rounded-2xl px-2.5 py-2 text-left active:scale-97 transition-all"
              style={{ background: D.surf, border: `1.5px solid ${D.border}` }}>
              <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(231,178,60,.14)", border: `1px solid ${D.goldSoft}` }}>
                <q.Icon className="w-4 h-4" style={{ color: D.gold }} />
              </span>
              <span className="min-w-0">
                <span className="block text-[12px] font-bold leading-tight" style={{ color: D.text }}>{q.t}</span>
                <span className="block text-[10px] leading-tight truncate" style={{ color: D.muted }}>{q.s}</span>
              </span>
              {q.badge && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: D.danger }} />}
            </button>
          ))}
          <button data-testid="braccio-quick-banco" onClick={() => setEliteOpen(true)}
            className="flex items-center gap-2 rounded-2xl px-2.5 py-2 text-left active:scale-97 transition-all"
            style={{ background: D.surf, border: `1.5px solid ${D.border}` }}>
            <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(231,178,60,.14)", border: `1px solid ${D.goldSoft}` }}>
              <Wheat className="w-4 h-4" style={{ color: D.gold }} />
            </span>
            <span className="min-w-0">
              <span className="block text-[12px] font-bold leading-tight" style={{ color: D.text }}>{tri("Banco Impasti", "Teigbank", "Dough Bench", "Banco de Masas", "Banc à Pâte", "میز خمیر")}</span>
              <span className="block text-[10px] leading-tight truncate" style={{ color: D.muted }}>{tri("Silos & dosi 3D", "Silos & Mengen 3D", "Silos & doses 3D", "Silos y dosis 3D", "Silos & doses 3D", "سیلو و مقدار")}</span>
            </span>
          </button>
          <button data-testid="braccio-quick-aggiungi" onClick={() => onOpenTool && onOpenTool("aggiungi")}
            className="flex items-center gap-2 rounded-2xl px-2.5 py-2 text-left active:scale-97 transition-all"
            style={{ background: D.surf, border: `1.5px solid ${D.border}` }}>
            <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(231,178,60,.14)", border: `1px solid ${D.goldSoft}` }}>
              <PlusCircle className="w-4 h-4" style={{ color: D.gold }} />
            </span>
            <span className="min-w-0">
              <span className="block text-[12px] font-bold leading-tight" style={{ color: D.text }}>{tri("Inserisci Ricetta", "Rezept hinzufügen", "Add Recipe", "Añadir Receta", "Ajouter Recette", "افزودن دستور")}</span>
              <span className="block text-[10px] leading-tight truncate" style={{ color: D.muted }}>{tri("Scrivi o scansiona", "Schreiben/Scannen", "Write or scan", "Escribe o escanea", "Écris ou scanne", "بنویس یا اسکن کن")}</span>
            </span>
          </button>
        </div>

        {/* Modalità Cuffie (hands-free) */}
        <button data-testid="braccio-headset" onClick={onHeadset} disabled={hsBusy}
          className="w-full flex items-center justify-center gap-2 rounded-2xl px-4 py-3 font-extrabold text-[14px] active:scale-97 transition-all disabled:opacity-60"
          style={{ background: "rgba(231,178,60,.12)", border: `2px solid ${D.goldSoft}`, color: D.gold }}>
          <Headphones className="w-5 h-5" /> {hsBusy ? tri("Collego le cuffie…", "Verbinde…", "Connecting…", "Conectando…", "Connexion…", "در حال اتصال…") : tri("Modalità Cuffie (mani libere)", "Headset-Modus (freihändig)", "Headset Mode (hands-free)", "Modo Auriculares (manos libres)", "Mode Casque (mains libres)", "حالت هدست (بدون دست)")}
        </button>
      </div>

      <MikiLabEliteEngine open={eliteOpen} onClose={() => setEliteOpen(false)} />
    </div>
  );
}
