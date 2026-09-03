import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Timer, Play, Square, RotateCcw, Headphones, Activity, Plus, Trash2 } from "lucide-react";
import { cleanForSpeech } from "@/lib/voice";

const speak = (msg) => {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(cleanForSpeech(msg));
    u.lang = "it-IT";
    u.rate = 0.98;
    window.speechSynthesis.speak(u);
  }
};

const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
const DEFAULT_MIXERS = [
  { id: "m1", name: "Impastatrice 01", minutes: 8, remaining: 0, running: false },
  { id: "m2", name: "Impastatrice 02", minutes: 12, remaining: 0, running: false },
];

export default function VoiceCore() {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [transcript, setTranscript] = useState("");
  const recRef = useRef(null);

  const [mixers, setMixers] = useState(DEFAULT_MIXERS);
  const mixersRef = useRef(mixers);
  mixersRef.current = mixers;

  // Tick unico per tutti i timer attivi
  useEffect(() => {
    const iv = setInterval(() => {
      setMixers((list) => {
        let changed = false;
        const next = list.map((m) => {
          if (m.running && m.remaining > 0) {
            changed = true;
            const rem = m.remaining - 1;
            if (rem === 0) speak(`${m.name}, ciclo impasto terminato.`);
            return { ...m, remaining: rem, running: rem > 0 };
          }
          return m;
        });
        return changed ? next : list;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  // Riconoscimento vocale
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setSupported(false); return; }
    const rec = new SR();
    rec.lang = "it-IT";
    rec.interimResults = false;
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setTranscript(text);
      const t = text.toLowerCase();
      if (/(avvia|parti|start|via)/.test(t)) startFirstIdle();
      else if (/(ferma|stop|basta)/.test(t)) stopAll();
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    return () => { try { rec.abort(); } catch { /* */ } };
  }, []);

  const toggleMic = () => {
    const rec = recRef.current;
    if (!rec) { setSupported(false); return; }
    if (listening) { try { rec.stop(); } catch { /* */ } setListening(false); }
    else { try { rec.start(); setListening(true); setTranscript(""); } catch { /* */ } }
  };

  const startMixer = (id) => setMixers((l) => l.map((m) => (m.id === id ? { ...m, running: true, remaining: m.remaining > 0 ? m.remaining : Math.max(1, Math.round(m.minutes * 60)) } : m)));
  const stopMixer = (id) => setMixers((l) => l.map((m) => (m.id === id ? { ...m, running: false } : m)));
  const resetMixer = (id) => setMixers((l) => l.map((m) => (m.id === id ? { ...m, running: false, remaining: 0 } : m)));
  const setMinutes = (id, v) => setMixers((l) => l.map((m) => (m.id === id ? { ...m, minutes: Math.max(0, Number(v) || 0) } : m)));
  const startFirstIdle = () => {
    const idle = mixersRef.current.find((m) => !m.running);
    if (idle) startMixer(idle.id);
  };
  const stopAll = () => setMixers((l) => l.map((m) => ({ ...m, running: false })));
  const addMixer = () => setMixers((l) => [...l, { id: `m${Date.now()}`, name: `Impastatrice ${String(l.length + 1).padStart(2, "0")}`, minutes: 8, remaining: 0, running: false }]);
  const removeMixer = (id) => setMixers((l) => (l.length > 1 ? l.filter((m) => m.id !== id) : l));

  const anyRunning = mixers.some((m) => m.running);

  return (
    <div data-testid="voice-core" className="space-y-6">
      {/* Status bar */}
      <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 rounded-2xl px-4 py-3">
        <div className="flex items-center gap-2 text-xs font-mono text-teal-300">
          <span className="w-2 h-2 rounded-full bg-teal-400 shadow-[0_0_8px_#2dd4bf]" /> Sensori OK
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-teal-300">
          <Headphones className="w-4 h-4" /> Cuffie / Microfono connessi
        </div>
      </div>

      {/* Voice Core */}
      <div className="bg-slate-900/80 border border-teal-500/30 rounded-2xl p-8 flex flex-col items-center gap-4 text-center">
        <button
          data-testid="voice-mic-btn"
          onClick={toggleMic}
          className={`w-24 h-24 rounded-full flex items-center justify-center transition-transform active:scale-95 ${
            listening
              ? "bg-gradient-to-br from-rose-500 to-rose-700 animate-pulse shadow-[0_0_28px_rgba(244,63,94,0.5)]"
              : "bg-gradient-to-br from-teal-400 to-teal-700 shadow-[0_0_24px_rgba(45,212,191,0.35)] hover:scale-105"
          }`}
        >
          {listening ? <MicOff className="w-10 h-10 text-white" /> : <Mic className="w-10 h-10 text-slate-950" />}
        </button>
        <div>
          <h2 className="text-2xl font-black text-slate-100 tracking-wide">MikiLab Voice Core</h2>
          <p data-testid="voice-status" className="text-sm text-slate-400 mt-1">
            {!supported
              ? "Riconoscimento vocale non supportato da questo browser"
              : listening
                ? "In ascolto… pronuncia un comando"
                : transcript
                  ? `Comando ricevuto: ${transcript}`
                  : "Tocca il microfono o usa le cuffie per dare comandi"}
          </p>
          <p className="text-[11px] text-slate-500 mt-2 font-mono">Prova: “avvia” per far partire un ciclo · “ferma” per stopparli</p>
        </div>
      </div>

      {/* Monitoraggio Impastatrici */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-teal-400 flex items-center gap-2 uppercase tracking-wide">
            <Activity className={`w-4 h-4 ${anyRunning ? "text-amber-400" : "text-slate-500"}`} /> Monitoraggio Impastatrici
          </h3>
          <button data-testid="mixer-add" onClick={addMixer} className="inline-flex items-center gap-1 text-xs font-semibold text-teal-300 hover:text-teal-200">
            <Plus className="w-3.5 h-3.5" /> Aggiungi
          </button>
        </div>

        <div className="space-y-3">
          {mixers.map((m) => (
            <div key={m.id} data-testid={`mixer-${m.id}`} className={`p-4 rounded-xl border bg-slate-950 flex items-center gap-4 ${m.running ? "border-amber-500/40" : "border-slate-800"}`}>
              <Timer className={`w-6 h-6 shrink-0 ${m.running ? "text-amber-400" : "text-slate-500"}`} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-slate-100 truncate">{m.name}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span data-testid={`mixer-time-${m.id}`} className={`font-mono text-2xl font-black ${m.running ? "text-amber-300" : m.remaining > 0 ? "text-teal-300" : "text-slate-500"}`}>{fmt(m.remaining || Math.round(m.minutes * 60))}</span>
                  {!m.running && (
                    <label className="flex items-center gap-1 text-[10px] text-slate-500 uppercase">
                      min
                      <input
                        data-testid={`mixer-minutes-${m.id}`}
                        type="number"
                        min="0"
                        value={m.minutes}
                        onChange={(e) => setMinutes(m.id, e.target.value)}
                        className="w-14 bg-slate-900 border border-slate-700 rounded p-1 text-center text-teal-300 font-mono"
                      />
                    </label>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!m.running ? (
                  <button data-testid={`mixer-start-${m.id}`} onClick={() => startMixer(m.id)} className="w-9 h-9 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 flex items-center justify-center active:scale-95 transition-all" title="Avvia">
                    <Play className="w-4 h-4" />
                  </button>
                ) : (
                  <button data-testid={`mixer-stop-${m.id}`} onClick={() => stopMixer(m.id)} className="w-9 h-9 rounded-lg bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center active:scale-95 transition-all" title="Ferma">
                    <Square className="w-4 h-4" />
                  </button>
                )}
                <button data-testid={`mixer-reset-${m.id}`} onClick={() => resetMixer(m.id)} className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center active:scale-95 transition-all" title="Reset">
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button onClick={() => removeMixer(m.id)} className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-500 hover:text-rose-400 flex items-center justify-center active:scale-95 transition-all" title="Rimuovi">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
