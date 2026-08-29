import { useState, useRef, useEffect, useCallback } from "react";
import { Hand, Mic, MicOff, Volume2, RefreshCw, Trash2, Clock } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { useTimers, remainingOf } from "@/audio/TimerContext";
import { toast } from "sonner";
import { mkTri } from "@/i18n/triMaps";

// Modalità "Mani Sporche": interfaccia XL a mani libere, comandi vocali,
// timer di lavorazione grandi. Pensata per usare l'app con le mani infarinate.

const fmt = (s) => {
  s = Math.max(0, Math.floor(s));
  const m = Math.floor(s / 60), sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

export default function ManiSporche() {
  const { lang } = useLang();
  const tri = (i, d, e, s) => mkTri(lang)(i, d, e, s);
  const voiceLang = mkTri(lang)("it-IT", "de-DE", "en-GB", "es-ES");
  const { timers, nowTs, addTimer, toggle, reset, remove } = useTimers();
  void nowTs;

  const [micOn, setMicOn] = useState(false);
  const [heard, setHeard] = useState("");
  const [clock, setClock] = useState(new Date());
  const recRef = useRef(null);
  const wlRef = useRef(null);

  useEffect(() => { const id = setInterval(() => setClock(new Date()), 1000); return () => clearInterval(id); }, []);

  // Wake Lock: tiene lo schermo acceso mentre lavori.
  useEffect(() => {
    const acquire = async () => { try { if ("wakeLock" in navigator) wlRef.current = await navigator.wakeLock.request("screen"); } catch { /* */ } };
    acquire();
    const onVis = () => { if (document.visibilityState === "visible") acquire(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      try { wlRef.current && wlRef.current.release(); } catch { /* */ }
      try { recRef.current && recRef.current.stop(); } catch { /* */ }
    };
  }, []);

  const speak = useCallback((text) => {
    try { const s = window.speechSynthesis; if (!s) return; const u = new SpeechSynthesisUtterance(text); u.lang = voiceLang; u.rate = 0.98; s.speak(u); } catch { /* */ }
  }, [voiceLang]);

  const PRESETS = [
    { key: "pieghe", label: tri("Pieghe", "Falten", "Folds", "Pliegues"), min: 30, repeat: true },
    { key: "puntata", label: tri("Puntata", "Stockgare", "Bulk", "Fermentación"), min: 90 },
    { key: "appretto", label: tri("Appretto", "Stückgare", "Final proof", "Formado"), min: 60 },
    { key: "cottura", label: tri("Cottura", "Backen", "Bake", "Cocción"), min: 40 },
  ];

  const startPreset = (p) => { addTimer(p.label, p.min, p.repeat); speak(tri(`${p.label}, ${p.min} minuti`, `${p.label}, ${p.min} Minuten`, `${p.label}, ${p.min} minutes`, `${p.label}, ${p.min} minutos`)); };

  const handleTranscript = useCallback((said) => {
    const s = said.toLowerCase(); setHeard(said);
    const mTimer = s.match(/(\d{1,3})\s*(min|minut|minute|minuten|minutos)/);
    if (mTimer) { const n = parseInt(mTimer[1], 10); addTimer(tri("Timer vocale", "Sprach-Timer", "Voice timer", "Temporizador"), n, false); speak(tri(`Timer di ${n} minuti`, `Timer über ${n} Minuten`, `${n} minute timer`, `${n} minutos`)); return; }
    for (const p of PRESETS) { if (s.includes(p.label.toLowerCase()) || (p.key === "pieghe" && /piegh|falt|fold/.test(s))) { startPreset(p); return; } }
    if (/\b(ferma|stop|halt|para|silenzio|basta)\b/.test(s)) { try { window.speechSynthesis.cancel(); } catch { /* */ } return; }
  }, [addTimer, tri]); // eslint-disable-line

  const startMic = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { toast.error(tri("Comandi vocali non supportati.", "Sprachbefehle nicht unterstützt.", "Voice commands not supported.", "Comandos de voz no compatibles.")); return; }
    try {
      const rec = new SR();
      rec.lang = voiceLang; rec.continuous = true; rec.interimResults = false;
      rec.onresult = (e) => { const r = e.results[e.results.length - 1]; if (r && r[0]) handleTranscript(r[0].transcript || ""); };
      rec.onerror = () => { /* */ };
      rec.onend = () => { if (recRef.current) { try { rec.start(); } catch { /* */ } } };
      recRef.current = rec; rec.start(); setMicOn(true);
    } catch { toast.error(tri("Microfono non disponibile.", "Mikrofon nicht verfügbar.", "Microphone not available.", "Micrófono no disponible.")); }
  };
  const stopMic = () => { const rec = recRef.current; recRef.current = null; try { rec && rec.stop(); } catch { /* */ } setMicOn(false); setHeard(""); };

  return (
    <div className="pb-40" data-testid="manisporche">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-11 h-11 rounded-2xl bg-[#ff6b00] flex items-center justify-center"><Hand className="w-6 h-6 text-white" /></div>
        <div>
          <h1 className="font-display text-2xl font-bold text-[#2B303B] dark:text-[#e4eff8]">{tri("Mani Sporche", "Schmutzige Hände", "Dirty Hands", "Manos Sucias")}</h1>
          <p className="text-sm text-[#7E8A93]">{tri("Tasti grandi e voce: usa l'app con le mani in pasta", "Große Tasten und Stimme", "Big buttons and voice", "Botones grandes y voz")}</p>
        </div>
      </div>

      {/* Orologio grande */}
      <div className="rounded-3xl bg-[#3a2415] text-white p-6 text-center mb-4">
        <p className="font-mono-data text-6xl font-bold tracking-tight" data-testid="manisporche-clock">{clock.toLocaleTimeString(mkTri(lang)("it-IT", "de-DE", "en-GB"), { hour: "2-digit", minute: "2-digit" })}</p>
        <p className="text-white/60 text-sm mt-1">{clock.toLocaleDateString(mkTri(lang)("it-IT", "de-DE", "en-GB"), { weekday: "long", day: "numeric", month: "long" })}</p>
      </div>

      {/* Preset XL */}
      <p className="text-xs font-bold uppercase tracking-wide text-[#ff6b00] mb-2">{tri("Avvia un timer", "Timer starten", "Start a timer", "Iniciar temporizador")}</p>
      <div className="grid grid-cols-2 gap-3 mb-4">
        {PRESETS.map((p) => (
          <button key={p.key} data-testid={`manisporche-preset-${p.key}`} onClick={() => startPreset(p)}
            className="relative flex flex-col items-center justify-center gap-1 py-7 rounded-3xl bg-white dark:bg-[#1e1e1e] border-2 border-[#2e2e2e] dark:border-[#2e2e2e] active:scale-95 hover:border-[#ff6b00] transition-all">
            {p.repeat && <RefreshCw className="absolute top-3 right-3 w-4 h-4 text-[#ff6b00]" />}
            <span className="font-display text-xl font-bold text-[#2B303B] dark:text-[#e4eff8]">{p.label}</span>
            <span className="font-mono-data text-base text-[#7E8A93]">{p.min}′</span>
          </button>
        ))}
      </div>

      {/* Mic grande */}
      <button data-testid="manisporche-mic" onClick={() => (micOn ? stopMic() : startMic())}
        className={`w-full flex items-center justify-center gap-3 py-6 rounded-3xl font-display text-xl font-bold text-white active:scale-97 transition-all mb-2 ${micOn ? "bg-[#ff6b00] animate-pulse" : "bg-[#ff6b00]"}`}>
        {micOn ? <Mic className="w-7 h-7" /> : <MicOff className="w-7 h-7" />}
        {micOn ? tri("Ti ascolto…", "Ich höre…", "Listening…", "Escuchando…") : tri("Parla", "Sprich", "Speak", "Habla")}
      </button>
      {micOn && (
        <p className="text-center text-xs text-[#7E8A93] mb-4">
          <Volume2 className="w-3.5 h-3.5 inline mr-1" />{tri('Di\': "pieghe", "puntata", "appretto", "cottura", "timer 20 minuti", "ferma"', 'Sag: "falten", "Timer 20 Minuten", "stop"', 'Say: "folds", "timer 20 minutes", "stop"', 'Di: "pliegues", "temporizador 20 minutos", "para"')}
          {heard && <span className="block italic text-[#ff6b00] mt-0.5 truncate">"{heard}"</span>}
        </p>
      )}

      {/* Timer attivi GRANDI */}
      <p className="text-xs font-bold uppercase tracking-wide text-[#ff6b00] mb-2 mt-2 flex items-center gap-1.5"><Clock className="w-4 h-4" /> {tri("Timer attivi", "Aktive Timer", "Active timers", "Temporizadores activos")}</p>
      <div className="space-y-3" data-testid="manisporche-timers">
        {timers.length === 0 && <p className="text-center text-sm text-[#7E8A93] py-5">{tri("Nessun timer attivo.", "Kein aktiver Timer.", "No active timer.", "Ningún temporizador.")}</p>}
        {timers.map((t) => {
          const rem = remainingOf(t); const done = rem <= 0;
          return (
            <div key={t.id} className={`rounded-3xl p-5 border-2 ${done ? "bg-[#E4572E]/10 border-[#E4572E]/40" : "bg-white dark:bg-[#1e1e1e] border-[#2e2e2e] dark:border-[#2e2e2e]"}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-display text-lg font-semibold text-[#2B303B] dark:text-[#e4eff8] truncate flex items-center gap-1.5">{t.name || t.label}{t.repeat && <RefreshCw className="w-4 h-4 text-[#ff6b00]" />}</span>
                <button onClick={() => remove(t.id)} className="text-[#7E8A93] p-1"><Trash2 className="w-6 h-6" /></button>
              </div>
              <p className={`font-mono-data text-6xl font-bold text-center ${done ? "text-[#E4572E]" : "text-[#2B303B] dark:text-[#e4eff8]"}`}>{fmt(rem)}</p>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <button onClick={() => toggle(t.id)} disabled={done} className="bg-[#ff6b00] disabled:opacity-40 text-white font-bold text-lg py-4 rounded-2xl active:scale-97">{t.running ? tri("Pausa", "Pause", "Pause", "Pausa") : tri("Vai", "Start", "Go", "Va")}</button>
                <button onClick={() => reset(t.id)} className="bg-white dark:bg-[#181818] border border-[#2e2e2e] dark:border-[#2e2e2e] text-[#2B303B] dark:text-[#e4eff8] font-bold text-lg py-4 rounded-2xl active:scale-97">{tri("Reset", "Reset", "Reset", "Reset")}</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
