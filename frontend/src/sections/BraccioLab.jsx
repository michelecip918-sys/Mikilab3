import { useEffect, useState } from "react";
import { ChefHat, LifeBuoy, SlidersHorizontal, AlertTriangle, Zap, PackageCheck, ClipboardList, Clock, Headphones, PlusCircle, Wheat, Hand, Mic, Timer, Play, Square, Wrench, BellRing } from "lucide-react";
import { toast } from "sonner";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { useShift, setWorkMode, hasActiveAlerts, autonomyDeadline, fmtHM } from "@/lib/shiftState";
import { isHeadsetRoutingAvailable, connectHeadset, startHeadsetSco } from "@/lib/nativeAudio";
import Avatar3D from "@/components/Avatar3D";
import { useMixers } from "@/audio/MixerTimersContext";
import { useMachines } from "@/audio/MachinesContext";
import MikiLabEliteEngine from "@/sections/MikiLabEliteEngine";
import { Cpu } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { operatorApi } from "@/lib/api";

// VISTA "SCHEDE DI PRODUZIONE" — tema SCURO "Grain Gold" (ebano caldo + oro), zero-scroll.
// Hands-free: ascolto continuo (tasto ORECCHIO in basso). Avatar 3D vocale al centro.
const D = { bg: "#0D1520", surf: "#1B2A38", surf2: "#1B2A38", border: "#2A3B49", gold: "#64748B", goldSoft: "#64748B", text: "#F7F9FC", muted: "#94A3B8", danger: "#E63946" };
const fmtSec = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

export default function BraccioLab({ onOpenTool, onGestione }) {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const { user } = useAuth();
  const isCapo = user?.role === "admin";
  const isOperator = user?.role === "operatore" || user?.role === "sostituto";
  const [opDept, setOpDept] = useState("");
  useEffect(() => {
    if (isOperator) operatorApi.getProfile().then((p) => setOpDept(p.department || "")).catch(() => {});
  }, [isOperator]);
  // Migrazione reparti: vecchie 6 stanze → nuove 3 macro-aree
  const DEPT_TO_AREA = { impasti: "panetteria", forni: "panetteria", laugen: "panetteria", banco: "panetteria", pretzel: "panetteria", pasticceria: "pasticceria", pizzeria: "pizzeria", panetteria: "panetteria" };
  const lockedArea = DEPT_TO_AREA[opDept] || opDept;
  const isGuest = !user;
  const sostitutoUntil = user?.sostituto_until;
  const API = process.env.REACT_APP_BACKEND_URL;
  const [holiday, setHoliday] = useState(false);
  const [nowMs, setNowMs] = useState(Date.now());
  useEffect(() => {
    if (!API) return;
    const load = () => fetch(`${API}/api/lab/holiday`).then((r) => r.ok ? r.json() : {}).then((d) => setHoliday(!!d.active)).catch(() => {});
    load();
    window.addEventListener("mikilab-holiday-changed", load);
    return () => window.removeEventListener("mikilab-holiday-changed", load);
  }, [API]);
  useEffect(() => { if (!sostitutoUntil) return; const t = setInterval(() => setNowMs(Date.now()), 1000); return () => clearInterval(t); }, [sostitutoUntil]);
  const remainMs = sostitutoUntil ? (new Date(sostitutoUntil).getTime() - nowMs) : 0;
  const fmtRemain = (ms) => { const s = Math.max(0, Math.floor(ms / 1000)); const h = String(Math.floor(s / 3600)).padStart(2, "0"); const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0"); const ss = String(s % 60).padStart(2, "0"); return `${h}:${m}:${ss}`; };
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
  const { list: mixers, start: startMixer, stop: stopMixer, dismiss: dismissMixer } = useMixers();
  const { toolsRow, cycle: cycleMachine } = useMachines();
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

  const QUICK = [];

  const lastNote = (shift.shift_notes || [])[0];
  const deadline = shift.work_mode === "autonomia" ? autonomyDeadline(shift) : null;

  return (
    <div data-testid="braccio-lab" className="flex flex-col rounded-3xl p-4 gap-3" style={{ minHeight: "460px", background: `radial-gradient(120% 60% at 50% -10%, #14212C 0%, ${D.bg} 55%)`, color: D.text, border: `1px solid ${D.border}` }}>
      {/* Modalità Ferie attiva */}
      {holiday && (
        <div data-testid="braccio-holiday-banner" className="rounded-2xl p-3 text-center font-extrabold text-[13px]" style={{ background: "rgba(94,140,168,.15)", border: `2px solid ${D.gold}`, color: D.gold }}>
          🌴 {tri("Laboratorio in Ferie — produzione in pausa", "Labor im Urlaub — Produktion pausiert", "Lab on holiday — production paused", "Laboratorio de vacaciones — producción en pausa", "Laboratoire en congé — production en pause", "آزمایشگاه در تعطیلات — تولید متوقف")}
        </div>
      )}

      {/* Delega Sostituto 8h — countdown */}
      {sostitutoUntil && (
        <div data-testid="braccio-sostituto-countdown" className="rounded-2xl p-3 text-center font-bold text-[12px]" style={{ background: "#1B2A38", border: `2px solid ${remainMs > 0 ? D.gold : D.danger}`, color: remainMs > 0 ? D.gold : D.danger }}>
          {remainMs > 0
            ? `⏳ ${tri("Delega Sostituto — scade tra", "Vertretung — endet in", "Substitute delegation — ends in", "Delegación sustituto — termina en", "Délégation remplaçant — se termine dans", "جانشین — پایان تا")} ${fmtRemain(remainMs)}`
            : `⛔ ${tri("Delega scaduta — accesso terminato", "Vertretung abgelaufen", "Delegation expired — access ended", "Delegación expirada", "Délégation expirée", "زمان جانشینی تمام شد")}`}
        </div>
      )}

      {/* Banner emergenza / info */}
      {alert ? (
        <button data-testid="braccio-alert-banner" onClick={() => onOpenTool && onOpenTool("emergenze")}
          className="rounded-2xl p-3 text-left active:scale-98 transition-all" style={{ background: "#1B2A38", border: `2px solid ${D.danger}` }}>
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
          <p className="text-[10.5px] font-extrabold tracking-wide mt-1" style={{ color: D.gold }} data-testid="braccio-bakemix">MikiLab — powered by Sitor</p>
        </div>
      )}

      {/* Avatar 3D vocale + STRUMENTO UNICO del laboratorio: Elite Engine */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 py-2">
        <Avatar3D active speaking={vs.speaking} listening={vs.listening || vs.wake}
          label={vs.speaking ? tri("Sto rispondendo…", "Ich antworte…", "Answering…", "Respondiendo…", "Je réponds…", "در حال پاسخ…") : ((vs.listening || vs.wake) ? tri("Ti ascolto…", "Ich höre…", "Listening…", "Escuchando…", "J'écoute…", "می‌شنوم…") : tri("Assistente pronto", "Assistent bereit", "Assistant ready", "Asistente listo", "Assistant prêt", "دستیار آماده"))}
          sub={tri("Tocca 👂 per parlare (mai da solo)", "Tippe 👂 zum Sprechen", "Tap 👂 to talk", "Toca 👂 para hablar", "Touche 👂 pour parler", "برای صحبت 👂 را بزن")} />
        <button data-testid="braccio-elite-engine" onClick={() => setEliteOpen(true)}
          className="flex items-center gap-2 rounded-2xl px-7 py-4 font-extrabold text-[16px] shadow-lg active:scale-95 transition-all"
          style={{ background: D.gold, border: `3px solid #EAB308`, color: D.bg }}>
          <Cpu className="w-5 h-5" /> {tri("Apri MikiLab Elite Engine", "MikiLab Elite Engine öffnen", "Open MikiLab Elite Engine", "Abrir MikiLab Elite Engine", "Ouvrir MikiLab Elite Engine", "باز کردن MikiLab Elite Engine")}
        </button>
        <p className="text-[11px]" style={{ color: D.muted }}>{tri("Include Banco Impasti 3D, Forni, Pasticceria e Guida", "Enthält Teigbank 3D, Öfen, Konditorei & Guide", "Includes 3D Dough Bench, Ovens, Pastry & Guide", "Incluye Banco de Masas 3D, Hornos, Pastelería y Guía", "Inclut Banc à Pâte 3D, Fours, Pâtisserie & Guide", "شامل میز خمیر سه‌بعدی، فرها، شیرینی و راهنما")}</p>
      </div>

      {/* Sistema mani libere: 3 concetti distinti */}
      <div className="space-y-2" data-testid="handsfree-system">
        <p className="text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5" style={{ color: D.gold }}>
          <Headphones className="w-3.5 h-3.5" /> {tri("Sistema mani libere", "Freihändig-System", "Hands-free system", "Sistema manos libres", "Système mains libres", "سیستم بدون دست")}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { Icon: Headphones, t: tri("Collega le cuffie", "Kopfhörer verbinden", "Connect headphones", "Conecta auriculares", "Connecter le casque", "اتصال هدفون"), s: tri("Audio privato", "Privates Audio", "Private audio", "Audio privado", "Audio privé", "صدای خصوصی") },
            { Icon: Hand, t: tri("Mani libere", "Freihändig", "Hands-free", "Manos libres", "Mains libres", "بدون دست"), s: tri("Senza sporcare lo schermo", "Ohne den Bildschirm zu verschmutzen", "No dirty screen", "Sin ensuciar la pantalla", "Sans salir l'écran", "بدون کثیف کردن صفحه") },
            { Icon: Mic, t: tri("Comandi vocali", "Sprachbefehle", "Voice commands", "Comandos de voz", "Commandes vocales", "دستور صوتی"), s: tri("Gestisci a voce", "Per Stimme steuern", "Control by voice", "Controla por voz", "Contrôle vocal", "کنترل صوتی") },
          ].map((c, i) => (
            <div key={i} className="rounded-2xl p-2.5 text-center" style={{ background: D.surf, border: `1.5px solid ${D.border}` }}>
              <span className="mx-auto mb-1 flex items-center justify-center w-9 h-9 rounded-xl" style={{ background: "rgba(94,140,168,.14)", border: `1px solid ${D.goldSoft}` }}>
                <c.Icon className="w-5 h-5" style={{ color: D.gold }} />
              </span>
              <span className="block text-[11px] font-bold leading-tight" style={{ color: D.text }}>{c.t}</span>
              <span className="block text-[9px] leading-tight mt-0.5" style={{ color: D.muted }}>{c.s}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Timer impastatrici reali + strumenti laboratorio */}
      <div className="space-y-2">
        <p className="text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5" style={{ color: D.gold }}>
          <Clock className="w-3.5 h-3.5" /> {tri("Timer Impastatrici", "Kneter-Timer", "Mixer timers", "Temporizadores amasadora", "Minuteurs pétrins", "تایمر خمیرگیر")}
        </p>
        <div className="space-y-2" data-testid="braccio-mixers">
          {mixers.map((m) => (
            <div key={m.id} data-testid={`braccio-mixer-${m.id}`} className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 ${m.alerting ? "animate-pulse" : ""}`} style={{ background: D.surf, border: `1.5px solid ${m.alerting ? D.danger : (m.running ? D.gold : D.border)}`, boxShadow: m.alerting ? `0 0 16px rgba(230,57,70,.5)` : "none" }}>
              <Timer className="w-5 h-5 shrink-0" style={{ color: m.alerting ? D.danger : (m.running ? D.gold : D.muted) }} />
              <div className="flex-1 min-w-0">
                <span className="flex items-center gap-1.5 text-[12px] font-bold leading-tight" style={{ color: D.text }}>
                  {m.name}
                  {m.alerting && (
                    <span data-testid={`braccio-mixer-alert-${m.id}`} className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full" style={{ color: D.danger, background: "rgba(230,57,70,.15)", border: `1px solid ${D.danger}` }}>
                      <BellRing className="w-2.5 h-2.5" /> {tri("Ciclo terminato", "Zyklus beendet", "Cycle done", "Ciclo terminado", "Cycle terminé", "چرخه پایان")}
                    </span>
                  )}
                </span>
                <span data-testid={`braccio-mixer-time-${m.id}`} className="block font-mono text-[18px] font-black leading-tight" style={{ color: m.alerting ? D.danger : (m.running ? D.gold : (m.remaining > 0 ? D.text : D.muted)) }}>{fmtSec(m.remaining)}</span>
              </div>
              {m.alerting ? (
                <button data-testid={`braccio-mixer-dismiss-${m.id}`} onClick={() => dismissMixer(m.id)} className="w-9 h-9 rounded-lg flex items-center justify-center active:scale-95 transition-all" style={{ background: D.danger, color: "#fff" }} title="Ho capito">
                  <BellRing className="w-4 h-4" />
                </button>
              ) : !m.running ? (
                <button data-testid={`braccio-mixer-start-${m.id}`} onClick={() => startMixer(m.id)} className="w-9 h-9 rounded-lg flex items-center justify-center active:scale-95 transition-all" style={{ background: D.gold, color: D.bg }} title="Avvia">
                  <Play className="w-4 h-4" />
                </button>
              ) : (
                <button data-testid={`braccio-mixer-stop-${m.id}`} onClick={() => stopMixer(m.id)} className="w-9 h-9 rounded-lg flex items-center justify-center active:scale-95 transition-all" style={{ background: D.danger, color: "#fff" }} title="Ferma">
                  <Square className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        <p className="text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 mt-1" style={{ color: D.gold }}>
          <Wrench className="w-3.5 h-3.5" /> {tri("Strumenti Laboratorio", "Laborgeräte", "Lab tools", "Herramientas de laboratorio", "Outils du laboratoire", "ابزارهای آزمایشگاه")}
        </p>
        <div className="space-y-2" data-testid="braccio-labtools">
          {toolsRow.map((tool) => (
            <button key={tool.id} data-testid={`braccio-labtool-${tool.id}`} onClick={() => tool.kind === "manual" && cycleMachine(tool.id)}
              className={`w-full flex items-center justify-between rounded-2xl px-3 py-2.5 text-left transition-all ${tool.kind === "manual" ? "active:scale-98" : ""} ${tool.alarm ? "animate-pulse" : ""}`} style={{ background: D.surf, border: `1.5px solid ${tool.alarm ? D.danger : D.border}` }}>
              <span className="text-[12px] font-bold" style={{ color: D.text }}>{tool.name}</span>
              <span className="flex items-center gap-1.5 text-[11px] font-extrabold" style={{ color: tool.color }}>
                {tool.kind === "thermal" && <b className="font-mono text-[13px]" data-testid={`braccio-labtemp-${tool.id}`}>{tool.temp}{tool.unit}</b>}
                <span className="w-2 h-2 rounded-full" style={{ background: tool.color }} /> {tool.status}
              </span>
            </button>
          ))}
        </div>

        {/* Modalità Cuffie (hands-free) */}
        <button data-testid="braccio-headset" onClick={onHeadset} disabled={hsBusy}
          className="w-full flex items-center justify-center gap-2 rounded-2xl px-4 py-3 font-extrabold text-[14px] active:scale-97 transition-all disabled:opacity-60"
          style={{ background: "rgba(231,178,60,.12)", border: `2px solid ${D.goldSoft}`, color: D.gold }}>
          <Headphones className="w-5 h-5" /> {hsBusy ? tri("Collego le cuffie…", "Verbinde…", "Connecting…", "Conectando…", "Connexion…", "در حال اتصال…") : tri("Modalità Cuffie (mani libere)", "Headset-Modus (freihändig)", "Headset Mode (hands-free)", "Modo Auriculares (manos libres)", "Mode Casque (mains libres)", "حالت هدست (بدون دست)")}
        </button>
      </div>

      <MikiLabEliteEngine open={eliteOpen} onClose={() => setEliteOpen(false)} locked={isOperator} lockedDept={lockedArea} isCapo={isCapo} readOnly={isGuest} />
    </div>
  );
}
