import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { cleanForSpeech } from "@/lib/voice";

const KEY = "mikilab_mixers_v1";
const DEFAULT = [
  { id: "m1", name: "Impastatrice 01", minutes: 8, endsAt: null, pausedRemaining: null },
  { id: "m2", name: "Impastatrice 02", minutes: 12, endsAt: null, pausedRemaining: null },
];

const speak = (msg) => {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(cleanForSpeech(msg));
    u.lang = "it-IT";
    u.rate = 0.98;
    window.speechSynthesis.speak(u);
  }
};

const load = () => { try { const s = JSON.parse(localStorage.getItem(KEY) || "null"); return Array.isArray(s) && s.length ? s : DEFAULT; } catch { return DEFAULT; } };
const remainingOf = (m) => {
  if (m.endsAt) return Math.max(0, Math.ceil((m.endsAt - Date.now()) / 1000));
  if (m.pausedRemaining != null) return m.pausedRemaining;
  return Math.round((Number(m.minutes) || 0) * 60);
};

const Ctx = createContext(null);
export const useMixers = () => useContext(Ctx);

export function MixerTimersProvider({ children }) {
  const [mixers, setMixers] = useState(load);
  const [, force] = useState(0);
  const mixersRef = useRef(mixers);
  mixersRef.current = mixers;

  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(mixers)); } catch { /* */ } }, [mixers]);

  // Tick globale: continua a contare anche cambiando schermata; annuncia a fine ciclo.
  useEffect(() => {
    const iv = setInterval(() => {
      const now = Date.now();
      const finished = mixersRef.current.filter((m) => m.endsAt && m.endsAt <= now);
      if (finished.length) {
        setMixers((l) => l.map((m) => (m.endsAt && m.endsAt <= now ? { ...m, endsAt: null, pausedRemaining: 0 } : m)));
        finished.forEach((m) => speak(`${m.name}, ciclo impasto terminato.`));
      } else {
        force((n) => n + 1); // aggiorna il countdown visivo
      }
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  const start = useCallback((id) => setMixers((l) => l.map((m) => {
    if (m.id !== id) return m;
    const secs = m.pausedRemaining && m.pausedRemaining > 0 ? m.pausedRemaining : Math.max(1, Math.round((Number(m.minutes) || 0) * 60));
    return { ...m, endsAt: Date.now() + secs * 1000, pausedRemaining: null };
  })), []);
  const stop = useCallback((id) => setMixers((l) => l.map((m) => (m.id === id && m.endsAt ? { ...m, pausedRemaining: remainingOf(m), endsAt: null } : m))), []);
  const reset = useCallback((id) => setMixers((l) => l.map((m) => (m.id === id ? { ...m, endsAt: null, pausedRemaining: null } : m))), []);
  const setMinutes = useCallback((id, v) => setMixers((l) => l.map((m) => (m.id === id ? { ...m, minutes: Math.max(0, Number(v) || 0) } : m))), []);
  const add = useCallback(() => setMixers((l) => [...l, { id: `m${Date.now()}`, name: `Impastatrice ${String(l.length + 1).padStart(2, "0")}`, minutes: 8, endsAt: null, pausedRemaining: null }]), []);
  const remove = useCallback((id) => setMixers((l) => (l.length > 1 ? l.filter((m) => m.id !== id) : l)), []);

  const list = mixers.map((m) => ({ ...m, remaining: remainingOf(m), running: !!m.endsAt }));

  return (
    <Ctx.Provider value={{ list, start, stop, reset, setMinutes, add, remove, speak }}>
      {children}
    </Ctx.Provider>
  );
}
