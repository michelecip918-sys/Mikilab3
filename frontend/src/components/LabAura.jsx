import { useEffect, useRef } from "react";

// ============================================================================
// AURA SONORA DEL LABORATORIO — feature esclusiva MikiLab.
// La "salute operativa" del laboratorio diventa un paesaggio sonoro generativo
// (Web Audio) + un'aura visiva pulsante: il Capo SENTE se tutto scorre senza
// guardare lo schermo. Sereno = drone caldo e lento; Critico = tensione e
// battito rapido. Nessuna libreria esterna, tutto sintetizzato dal vivo.
// ============================================================================

const MOODS = {
  sereno:  { color: "#14b8a6", base: 110.0, fifth: 164.8, filter: 620,  pulse: 55, drive: 0.0 },
  attivo:  { color: "#5E8CA8", base: 123.5, fifth: 185.0, filter: 820,  pulse: 60, drive: 0.06 },
  teso:    { color: "#f59e0b", base: 138.6, fifth: 196.0, filter: 1050, pulse: 62, drive: 0.14 },
  critico: { color: "#ef4444", base: 155.6, fifth: 208.0, filter: 1500, pulse: 66, drive: 0.24 },
};

export const auraColor = (mood) => (MOODS[mood] || MOODS.sereno).color;

export default function LabAura({ enabled, mood = "sereno", heartbeat = 52 }) {
  const ctxRef = useRef(null);
  const nodesRef = useRef(null);
  const beatRef = useRef(null);
  const cfg = MOODS[mood] || MOODS.sereno;

  // Avvio / arresto del motore audio
  useEffect(() => {
    if (!enabled) {
      teardown();
      return;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const ctx = new AC();
      ctxRef.current = ctx;
      if (ctx.state === "suspended") ctx.resume();

      const master = ctx.createGain();
      master.gain.value = 0.0001;
      master.connect(ctx.destination);

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = cfg.filter;
      filter.Q.value = 0.8;
      filter.connect(master);

      const oscA = ctx.createOscillator(); oscA.type = "sine"; oscA.frequency.value = cfg.base;
      const oscB = ctx.createOscillator(); oscB.type = "triangle"; oscB.frequency.value = cfg.fifth; oscB.detune.value = -6;
      const gA = ctx.createGain(); gA.gain.value = 0.5;
      const gB = ctx.createGain(); gB.gain.value = 0.28;
      oscA.connect(gA).connect(filter);
      oscB.connect(gB).connect(filter);

      // Pad "respiro": rumore filtrato, molto morbido
      const bufSize = 2 * ctx.sampleRate;
      const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
      const noise = ctx.createBufferSource(); noise.buffer = buffer; noise.loop = true;
      const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 380; bp.Q.value = 0.6;
      const nGain = ctx.createGain(); nGain.gain.value = 0.05 + cfg.drive * 0.15;
      noise.connect(bp).connect(nGain).connect(master);

      oscA.start(); oscB.start(); noise.start();
      master.gain.linearRampToValueAtTime(0.085, ctx.currentTime + 1.4);

      nodesRef.current = { master, filter, oscA, oscB, noise, nGain, bp };
      scheduleBeat();
    } catch { /* audio non disponibile */ }

    return () => teardown();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  // Battito cardiaco: un "thump" ritmato al bpm corrente
  const scheduleBeat = () => {
    if (beatRef.current) clearInterval(beatRef.current);
    const ctx = ctxRef.current; if (!ctx) return;
    const bpm = Math.max(40, Math.min(150, heartbeat || 52));
    const interval = 60000 / bpm;
    const thump = () => {
      const c = ctxRef.current; const n = nodesRef.current;
      if (!c || !n) return;
      const t = c.currentTime;
      const o = c.createOscillator(); o.type = "sine"; o.frequency.setValueAtTime(cfg.pulse, t);
      o.frequency.exponentialRampToValueAtTime(cfg.pulse * 0.6, t + 0.18);
      const g = c.createGain(); g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.14 + cfg.drive * 0.2, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      o.connect(g).connect(n.master);
      o.start(t); o.stop(t + 0.24);
    };
    thump();
    beatRef.current = setInterval(thump, interval);
  };

  // Aggiorna timbro/battito quando cambia l'umore o il carico
  useEffect(() => {
    const ctx = ctxRef.current; const n = nodesRef.current;
    if (!ctx || !n) return;
    const t = ctx.currentTime;
    try {
      n.oscA.frequency.linearRampToValueAtTime(cfg.base, t + 0.8);
      n.oscB.frequency.linearRampToValueAtTime(cfg.fifth, t + 0.8);
      n.filter.frequency.linearRampToValueAtTime(cfg.filter, t + 0.8);
      n.nGain.gain.linearRampToValueAtTime(0.05 + cfg.drive * 0.15, t + 0.8);
    } catch { /* */ }
    scheduleBeat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mood, heartbeat]);

  const teardown = () => {
    if (beatRef.current) { clearInterval(beatRef.current); beatRef.current = null; }
    const ctx = ctxRef.current; const n = nodesRef.current;
    if (ctx && n) {
      try {
        n.master.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
        setTimeout(() => { try { ctx.close(); } catch { /* */ } }, 600);
      } catch { try { ctx.close(); } catch { /* */ } }
    }
    ctxRef.current = null; nodesRef.current = null;
  };

  if (!enabled) return null;
  const beatSec = (60 / Math.max(40, Math.min(150, heartbeat || 52))).toFixed(2);
  return (
    <div className="fixed inset-0 z-[45] pointer-events-none" aria-hidden data-testid="lab-aura-visual">
      <style>{`@keyframes auraBreath{0%,100%{opacity:.10;transform:scale(1)}50%{opacity:.42;transform:scale(1.06)}}`}</style>
      <div
        className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[130vw] h-[70vh] rounded-full blur-[90px]"
        style={{ background: `radial-gradient(closest-side, ${cfg.color}66, transparent 70%)`, animation: `auraBreath ${beatSec}s ease-in-out infinite` }}
      />
      <div
        className="absolute inset-0"
        style={{ boxShadow: `inset 0 0 220px ${cfg.color}22`, animation: `auraBreath ${beatSec}s ease-in-out infinite` }}
      />
    </div>
  );
}
