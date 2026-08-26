import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { BellRing, X } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";

// Engine dei timer a livello APP: continua a contare e a suonare l'allarme
// anche quando l'utente è su un altro strumento o tab. Wall-clock (endsAt).

const TimerCtx = createContext(null);
const uid = () => Math.random().toString(36).slice(2, 9);
const now = () => Date.now();
export const remainingOf = (t) => (t.running && t.endsAt ? Math.max(0, Math.round((t.endsAt - now()) / 1000)) : t.remaining);

export function TimerProvider({ children }) {
  const { lang } = useLang();
  const tri = (i, d, e) => (lang === "de" ? d : lang === "en" ? e : i);

  const [timers, setTimers] = useState(() => {
    try { return JSON.parse(localStorage.getItem("mikilab_timers") || "[]"); } catch { return []; }
  });
  const [nowTs, setNowTs] = useState(now());
  const [ringing, setRinging] = useState([]);
  const audioRef = useRef(null);
  const oscRef = useRef(null);

  useEffect(() => {
    try { localStorage.setItem("mikilab_timers", JSON.stringify(timers)); } catch { /* quota */ }
  }, [timers]);

  useEffect(() => {
    const id = setInterval(() => setNowTs(now()), 500);
    const onVis = () => setNowTs(now());
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", onVis); };
  }, []);

  // rilevamento scadenza
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
      try { if (navigator.vibrate) navigator.vibrate([400, 200, 400, 200, 400]); } catch { /* */ }
    } catch { /* no audio */ }
  }, []);

  const stopAlarm = useCallback(() => {
    const wasActive = !!oscRef.current || !!audioRef.current;
    if (oscRef.current) { clearInterval(oscRef.current); oscRef.current = null; }
    if (audioRef.current) { try { audioRef.current.close(); } catch { /* */ } audioRef.current = null; }
    if (wasActive) { try { if (navigator.vibrate) navigator.vibrate(0); } catch { /* */ } }
  }, []);

  useEffect(() => {
    if (ringing.length > 0) startAlarm(); else stopAlarm();
    return () => stopAlarm();
  }, [ringing.length, startAlarm, stopAlarm]);

  const addTimer = useCallback((label, minutes) => {
    const secs = Math.round((Number(minutes) || 0) * 60);
    if (secs <= 0) return;
    try { if ("Notification" in window && Notification.permission === "default") Notification.requestPermission(); } catch { /* */ }
    setTimers((prev) => [...prev, { id: uid(), name: label || "", label: label || "Timer", total: secs, remaining: secs, running: true, endsAt: now() + secs * 1000, notified: false }]);
  }, []);

  const dismiss = useCallback((id) => setRinging((prev) => prev.filter((r) => r.id !== id)), []);
  const toggle = useCallback((id) => setTimers((p) => p.map((t) => {
    if (t.id !== id) return t;
    if (t.running) return { ...t, running: false, remaining: remainingOf(t), endsAt: null };
    const rem = remainingOf(t);
    if (rem <= 0) return t;
    return { ...t, running: true, endsAt: now() + rem * 1000, notified: false };
  })), []);
  const reset = useCallback((id) => setTimers((p) => p.map((t) => (t.id === id ? { ...t, remaining: t.total, running: false, endsAt: null, notified: false } : t))), []);
  const remove = useCallback((id) => { setTimers((p) => p.filter((t) => t.id !== id)); dismiss(id); }, [dismiss]);

  const alarm = ringing[0];

  return (
    <TimerCtx.Provider value={{ timers, nowTs, addTimer, toggle, reset, remove }}>
      {children}
      {/* Overlay allarme GLOBALE: visibile su qualsiasi schermata */}
      {alarm && (
        <div data-testid="timer-alarm-overlay"
          className="fixed inset-0 z-[90] flex flex-col items-center justify-center p-6 text-center animate-pulse"
          style={{ background: "repeating-linear-gradient(45deg,#E4572E,#E4572E 40px,#111 40px,#111 80px)" }}>
          <div className="bg-white dark:bg-[#1B2127] rounded-3xl p-8 shadow-2xl max-w-sm w-full">
            <BellRing className="w-16 h-16 text-[#E4572E] mx-auto mb-3 animate-bounce" />
            <p className="text-xs font-bold uppercase tracking-widest text-[#7E8A93]">{tri("Tempo scaduto", "Zeit abgelaufen", "Time is up")}{ringing.length > 1 ? ` (${ringing.length})` : ""}</p>
            <h2 className="font-display text-3xl font-bold text-[#2B303B] dark:text-[#e4eff8] mt-1 mb-6 break-words">{alarm.name || tri("Timer", "Timer", "Timer")}</h2>
            <button data-testid="timer-alarm-dismiss" onClick={() => dismiss(alarm.id)}
              className="w-full bg-[#3f7cac] hover:bg-[#336a94] text-white font-bold text-lg py-5 rounded-2xl active:scale-97 transition-all flex items-center justify-center gap-2">
              <X className="w-6 h-6" /> {tri("TACITA", "STOPP", "STOP")}
            </button>
          </div>
        </div>
      )}
    </TimerCtx.Provider>
  );
}

export function useTimers() {
  const ctx = useContext(TimerCtx);
  if (!ctx) throw new Error("useTimers deve essere usato dentro TimerProvider");
  return ctx;
}
