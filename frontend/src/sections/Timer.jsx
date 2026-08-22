import { useState, useEffect, useRef, useCallback } from "react";
import { Timer as TimerIcon, Play, Pause, RotateCcw, Trash2, Plus, BellRing, X } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";

// Punto 14 — Timer da Laboratorio: allarme sonoro forte + schermo lampeggiante,
// più timer contemporanei con nome, layout a una mano, preset di lavorazione.
// Wall-clock based: usa un timestamp assoluto (endsAt) così i timer restano
// corretti anche uscendo dallo strumento o ricaricando la pagina.

const uid = () => Math.random().toString(36).slice(2, 9);
const now = () => Date.now();
const remainingOf = (t) => (t.running && t.endsAt ? Math.max(0, Math.round((t.endsAt - now()) / 1000)) : t.remaining);
const fmt = (s) => {
  s = Math.max(0, Math.floor(s));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
};

export default function Timer() {
  const { lang } = useLang();
  const tri = (i, d, e) => (lang === "de" ? d : lang === "en" ? e : i);

  const PRESETS = [
    { key: "puntata", label: tri("Puntata", "Stockgare", "Bulk rise"), min: 90 },
    { key: "appretto", label: tri("Appretto", "Stückgare", "Final proof"), min: 60 },
    { key: "cottura", label: tri("Cottura", "Backen", "Bake"), min: 40 },
    { key: "autolisi", label: tri("Autolisi", "Autolyse", "Autolyse"), min: 30 },
    { key: "rinfresco", label: tri("Rinfresco", "Auffrischung", "Refresh"), min: 240 },
    { key: "raffredd", label: tri("Raffreddamento", "Abkühlen", "Cooling"), min: 20 },
  ];

  const [timers, setTimers] = useState(() => {
    try { return JSON.parse(localStorage.getItem("mikilab_timers") || "[]"); } catch { return []; }
  });
  const [nowTs, setNowTs] = useState(now()); // forza il re-render ogni secondo
  const [name, setName] = useState("");
  const [mins, setMins] = useState("30");
  const [ringing, setRinging] = useState([]); // coda di allarmi {id, name}
  const audioRef = useRef(null);
  const oscRef = useRef(null);

  useEffect(() => {
    try { localStorage.setItem("mikilab_timers", JSON.stringify(timers)); } catch { /* quota */ }
  }, [timers]);

  // tick 1s: aggiorna l'orologio per il conteggio a ritroso
  useEffect(() => {
    const id = setInterval(() => setNowTs(now()), 500);
    const onVis = () => setNowTs(now());
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", onVis); };
  }, []);

  // rilevamento scadenza (puro, in effetto sui timer + orologio)
  useEffect(() => {
    const expired = timers.filter((t) => t.running && t.endsAt && t.endsAt <= now() && !t.notified);
    if (expired.length === 0) return;
    setTimers((prev) => prev.map((t) => (expired.find((e) => e.id === t.id) ? { ...t, running: false, remaining: 0, endsAt: null, notified: true } : t)));
    setRinging((prev) => [...prev, ...expired.map((t) => ({ id: t.id, name: t.name || t.label }))]);
    expired.forEach((t) => {
      try {
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(tri("Tempo scaduto", "Zeit abgelaufen", "Time is up"), { body: t.name || t.label });
        }
      } catch { /* */ }
    });
  }, [nowTs, timers, tri]);

  // allarme sonoro forte in loop finché c'è almeno un allarme attivo
  const startAlarm = useCallback(() => {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      const ctx = new Ctx();
      audioRef.current = ctx;
      const play = () => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.5, ctx.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);
        osc.connect(gain).connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      };
      play();
      oscRef.current = setInterval(play, 700);
      if (navigator.vibrate) navigator.vibrate([400, 200, 400, 200, 400]);
    } catch { /* no audio */ }
  }, []);

  const stopAlarm = useCallback(() => {
    if (oscRef.current) { clearInterval(oscRef.current); oscRef.current = null; }
    if (audioRef.current) { try { audioRef.current.close(); } catch { /* */ } audioRef.current = null; }
    if (navigator.vibrate) navigator.vibrate(0);
  }, []);

  useEffect(() => {
    if (ringing.length > 0) startAlarm();
    else stopAlarm();
    return () => stopAlarm();
  }, [ringing.length, startAlarm, stopAlarm]);

  const requestNotif = () => {
    try { if ("Notification" in window && Notification.permission === "default") Notification.requestPermission(); } catch { /* */ }
  };

  const addTimer = (label, minutes) => {
    const secs = Math.round((Number(minutes) || 0) * 60);
    if (secs <= 0) return;
    requestNotif();
    setTimers((prev) => [
      ...prev,
      { id: uid(), name: label || "", label: label || tri("Timer", "Timer", "Timer"), total: secs, remaining: secs, running: true, endsAt: now() + secs * 1000, notified: false },
    ]);
  };

  const dismiss = (id) => setRinging((prev) => prev.filter((r) => r.id !== id));

  const toggle = (id) => setTimers((p) => p.map((t) => {
    if (t.id !== id) return t;
    if (t.running) return { ...t, running: false, remaining: remainingOf(t), endsAt: null };
    const rem = remainingOf(t);
    if (rem <= 0) return t;
    return { ...t, running: true, endsAt: now() + rem * 1000, notified: false };
  }));
  const reset = (id) => setTimers((p) => p.map((t) => (t.id === id ? { ...t, remaining: t.total, running: false, endsAt: null, notified: false } : t)));
  const remove = (id) => { setTimers((p) => p.filter((t) => t.id !== id)); dismiss(id); };

  const inp = "w-full bg-[#F6F8F5] dark:bg-[#1F252B] border border-[#D7E1DB] dark:border-[#38424B] rounded-xl px-3 py-3 outline-none text-[#2B303B] dark:text-[#EAF0EC] focus:border-[#5E8B7E]";
  const alarm = ringing[0];

  return (
    <div className="pb-40">
      {/* Overlay lampeggiante allarme */}
      {alarm && (
        <div data-testid="timer-alarm-overlay"
          className="fixed inset-0 z-[80] flex flex-col items-center justify-center p-6 text-center animate-pulse"
          style={{ background: "repeating-linear-gradient(45deg,#E4572E,#E4572E 40px,#111 40px,#111 80px)" }}>
          <div className="bg-white dark:bg-[#1B2127] rounded-3xl p-8 shadow-2xl max-w-sm w-full">
            <BellRing className="w-16 h-16 text-[#E4572E] mx-auto mb-3 animate-bounce" />
            <p className="text-xs font-bold uppercase tracking-widest text-[#7E8A93]">{tri("Tempo scaduto", "Zeit abgelaufen", "Time is up")}{ringing.length > 1 ? ` (${ringing.length})` : ""}</p>
            <h2 className="font-display text-3xl font-bold text-[#2B303B] dark:text-[#EAF0EC] mt-1 mb-6 break-words">{alarm.name || tri("Timer", "Timer", "Timer")}</h2>
            <button data-testid="timer-alarm-dismiss" onClick={() => dismiss(alarm.id)}
              className="w-full bg-[#5E8B7E] hover:bg-[#4C7368] text-white font-bold text-lg py-5 rounded-2xl active:scale-97 transition-all flex items-center justify-center gap-2">
              <X className="w-6 h-6" /> {tri("TACITA", "STOPP", "STOP")}
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-2xl bg-[#E4572E] flex items-center justify-center"><TimerIcon className="w-6 h-6 text-white" /></div>
        <div>
          <h1 className="font-display text-2xl font-bold text-[#2B303B] dark:text-[#EAF0EC]">{tri("Timer da Laboratorio", "Backstuben-Timer", "Lab Timer")}</h1>
          <p className="text-sm text-[#7E8A93]">{tri("Allarme forte e schermo lampeggiante per ambienti rumorosi", "Lauter Alarm & blinkender Bildschirm für laute Umgebungen", "Loud alarm & flashing screen for noisy rooms")}</p>
        </div>
      </div>

      {/* Preset rapidi */}
      <p className="text-xs font-bold uppercase tracking-wide text-[#E4572E] mb-2">{tri("Preset di lavorazione", "Prozess-Presets", "Process presets")}</p>
      <div className="grid grid-cols-3 gap-2 mb-5">
        {PRESETS.map((p) => (
          <button key={p.key} data-testid={`timer-preset-${p.key}`} onClick={() => addTimer(p.label, p.min)}
            className="flex flex-col items-center gap-0.5 bg-white dark:bg-[#232A31] border border-[#D7E1DB] dark:border-[#38424B] rounded-2xl py-3 active:scale-95 hover:border-[#E4572E]/50 transition-all">
            <span className="font-display text-sm font-semibold text-[#2B303B] dark:text-[#EAF0EC]">{p.label}</span>
            <span className="font-mono-data text-xs text-[#7E8A93]">{p.min}′</span>
          </button>
        ))}
      </div>

      {/* Timer personalizzato */}
      <div className="bg-[#6E8CA0]/10 border border-[#6E8CA0]/30 rounded-2xl p-4 mb-5">
        <p className="text-xs font-bold uppercase tracking-wide text-[#5E8B7E] mb-2">{tri("Timer personalizzato", "Eigener Timer", "Custom timer")}</p>
        <div className="grid grid-cols-[1fr_88px] gap-2">
          <input data-testid="timer-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={tri("Nome (es. Baguette)", "Name (z.B. Baguette)", "Name (e.g. Baguette)")} className={inp} />
          <input data-testid="timer-mins" type="number" inputMode="numeric" value={mins} onChange={(e) => setMins(e.target.value)} className={inp + " text-center font-mono-data"} />
        </div>
        <button data-testid="timer-add" onClick={() => { addTimer(name.trim(), mins); setName(""); }}
          className="mt-2 w-full flex items-center justify-center gap-2 bg-[#5E8B7E] hover:bg-[#4C7368] text-white font-semibold py-3 rounded-xl active:scale-98 transition-all">
          <Plus className="w-5 h-5" /> {tri("Avvia timer", "Timer starten", "Start timer")} <span className="opacity-80">({mins || 0}′)</span>
        </button>
      </div>

      {/* Lista timer attivi */}
      <div className="space-y-3" data-testid="timer-list">
        {timers.length === 0 && (
          <p className="text-center text-sm text-[#7E8A93] py-6">{tri("Nessun timer attivo. Scegli un preset o crea il tuo.", "Kein aktiver Timer. Wähle ein Preset oder erstelle eigenes.", "No active timer. Pick a preset or create your own.")}</p>
        )}
        {timers.map((t) => {
          const rem = remainingOf(t);
          const done = rem <= 0;
          return (
            <div key={t.id} data-testid={`timer-card-${t.id}`}
              className={`rounded-3xl p-5 shadow-sm border ${done ? "bg-[#E4572E]/10 border-[#E4572E]/40" : "bg-white dark:bg-[#232A31] border-[#D7E1DB] dark:border-[#38424B]"}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-display text-base font-semibold text-[#2B303B] dark:text-[#EAF0EC] truncate">{t.name || t.label}</span>
                <button data-testid={`timer-remove-${t.id}`} onClick={() => remove(t.id)} className="text-[#7E8A93] hover:text-[#E4572E] p-1"><Trash2 className="w-5 h-5" /></button>
              </div>
              <p className={`font-mono-data text-5xl font-bold text-center ${done ? "text-[#E4572E]" : "text-[#2B303B] dark:text-[#EAF0EC]"}`} data-testid={`timer-time-${t.id}`}>{fmt(rem)}</p>
              <div className="grid grid-cols-2 gap-2 mt-4">
                <button data-testid={`timer-toggle-${t.id}`} onClick={() => toggle(t.id)} disabled={done}
                  className="flex items-center justify-center gap-2 bg-[#5E8B7E] hover:bg-[#4C7368] disabled:opacity-40 text-white font-bold text-lg py-4 rounded-2xl active:scale-97 transition-all">
                  {t.running ? <><Pause className="w-6 h-6" /> {tri("Pausa", "Pause", "Pause")}</> : <><Play className="w-6 h-6" /> {tri("Vai", "Start", "Go")}</>}
                </button>
                <button data-testid={`timer-reset-${t.id}`} onClick={() => reset(t.id)}
                  className="flex items-center justify-center gap-2 bg-white dark:bg-[#1F252B] border border-[#D7E1DB] dark:border-[#38424B] text-[#2B303B] dark:text-[#EAF0EC] font-bold text-lg py-4 rounded-2xl active:scale-97 transition-all">
                  <RotateCcw className="w-6 h-6" /> {tri("Reset", "Reset", "Reset")}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
