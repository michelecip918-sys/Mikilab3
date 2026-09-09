import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Timer, Play, Square, RotateCcw, Headphones, Activity, Plus, Trash2, BellRing, Maximize2, Wrench } from "lucide-react";
import ModuleParams from "@/components/ModuleParams";
import { useMixers } from "@/audio/MixerTimersContext";
import { useMachines } from "@/audio/MachinesContext";

const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

const NUM_WORDS = { uno: 1, "un": 1, due: 2, tre: 3, quattro: 4, cinque: 5, sei: 6, sette: 7, otto: 8, nove: 9, dieci: 10 };
const parseNumber = (t) => {
  const d = t.match(/\b(\d{1,2})\b/);
  if (d) return Number(d[1]);
  for (const [w, n] of Object.entries(NUM_WORDS)) if (new RegExp(`\\b${w}\\b`).test(t)) return n;
  return null;
};
const speakPhrase = (msg) => {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(msg);
    u.lang = "it-IT"; u.rate = 0.98;
    window.speechSynthesis.speak(u);
  }
};
const sayRemaining = (m) => {
  const s = m.remaining;
  const min = Math.floor(s / 60), sec = s % 60;
  const t = min > 0 ? `${min} minuti e ${sec} secondi` : `${sec} secondi`;
  speakPhrase(m.running ? `${m.name}: mancano ${t}.` : (s > 0 ? `${m.name} è in pausa, restano ${t}.` : `${m.name} è ferma.`));
};

const LAB_TOOLS = null;

export default function VoiceCore() {
  const { list, start, stop, reset, setMinutes, add, remove, dismiss } = useMixers();
  const { toolsRow, cycle: cycleMachine } = useMachines();
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [transcript, setTranscript] = useState("");
  const [pro, setPro] = useState(() => { try { return localStorage.getItem("mikilab_voicecore_pro") === "1"; } catch { return false; } });
  const recRef = useRef(null);
  const listRef = useRef(list);
  listRef.current = list;

  useEffect(() => { try { localStorage.setItem("mikilab_voicecore_pro", pro ? "1" : "0"); } catch { /* */ } }, [pro]);

  const mixerByNumber = (n) => (n && listRef.current[n - 1]) || null;

  const handleCommand = (raw) => {
    const t = raw.toLowerCase();
    const n = parseNumber(t);
    if (/(quanto manca|quanto tempo|tempo rimasto|quanto resta)/.test(t)) {
      const m = mixerByNumber(n) || listRef.current.find((x) => x.running) || listRef.current[0];
      if (m) sayRemaining(m);
      return;
    }
    if (/(avvia|parti|start|via|accendi)/.test(t)) {
      const m = mixerByNumber(n);
      if (m) { start(m.id); speakPhrase(`${m.name} avviata.`); }
      else { const idle = listRef.current.find((x) => !x.running); if (idle) { start(idle.id); speakPhrase(`${idle.name} avviata.`); } }
      return;
    }
    if (/(ferma|stop|basta|spegni)/.test(t)) {
      const m = mixerByNumber(n);
      if (m) { stop(m.id); speakPhrase(`${m.name} fermata.`); }
      else { listRef.current.forEach((x) => x.running && stop(x.id)); speakPhrase("Tutte le impastatrici fermate."); }
      return;
    }
    if (/(azzera|reset)/.test(t)) {
      const m = mixerByNumber(n);
      if (m) { reset(m.id); speakPhrase(`${m.name} azzerata.`); }
    }
  };

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setSupported(false); return; }
    const rec = new SR();
    rec.lang = "it-IT";
    rec.interimResults = false;
    rec.onresult = (e) => { const text = e.results[0][0].transcript; setTranscript(text); handleCommand(text); };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    return () => { try { rec.abort(); } catch { /* */ } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleMic = () => {
    const rec = recRef.current;
    if (!rec) { setSupported(false); return; }
    if (listening) { try { rec.stop(); } catch { /* */ } setListening(false); }
    else { try { rec.start(); setListening(true); setTranscript(""); } catch { /* */ } }
  };

  const anyRunning = list.some((m) => m.running);
  // Dimensioni PRO (tasti grandi per il lavoro al banco)
  const micSize = pro ? "w-32 h-32" : "w-24 h-24";
  const micIcon = pro ? "w-14 h-14" : "w-10 h-10";
  const ctrl = pro ? "w-12 h-12" : "w-9 h-9";
  const ctrlIcon = pro ? "w-6 h-6" : "w-4 h-4";
  const timeText = pro ? "text-4xl" : "text-2xl";

  return (
    <div data-testid="voice-core" className="space-y-6">
      <ModuleParams screen="intercom" />
      <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 rounded-2xl px-4 py-3 gap-3">
        <div className="flex items-center gap-2 text-xs font-mono text-teal-300">
          <span className="w-2 h-2 rounded-full bg-teal-400 shadow-[0_0_8px_#FF8533]" /> Sensori OK
        </div>
        <button
          data-testid="pro-toggle"
          onClick={() => setPro((p) => !p)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
            pro ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-300" : "bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200"
          }`}
        >
          <Maximize2 className="w-3.5 h-3.5" /> PRO: {pro ? "ON" : "OFF"}
        </button>
        <div className="flex items-center gap-2 text-xs font-mono text-teal-300">
          <Headphones className="w-4 h-4" /> <span className="hidden sm:inline">Cuffie / Microfono connessi</span>
        </div>
      </div>

      <div className="bg-slate-900/80 border border-teal-500/30 rounded-2xl p-8 flex flex-col items-center gap-4 text-center">
        <button
          data-testid="voice-mic-btn"
          onClick={toggleMic}
          className={`${micSize} rounded-full flex items-center justify-center transition-transform active:scale-95 ${
            listening
              ? "bg-gradient-to-br from-rose-500 to-rose-700 animate-pulse shadow-[0_0_28px_rgba(244,63,94,0.5)]"
              : "bg-gradient-to-br from-teal-400 to-teal-700 shadow-[0_0_24px_rgba(45,212,191,0.35)] hover:scale-105"
          }`}
        >
          {listening ? <MicOff className={`${micIcon} text-white`} /> : <Mic className={`${micIcon} text-slate-950`} />}
        </button>
        <div>
          <h2 className={`${pro ? "text-3xl" : "text-2xl"} font-black text-slate-100 tracking-wide`}>MikiLab Voice Core</h2>
          <p data-testid="voice-status" className={`${pro ? "text-base" : "text-sm"} text-slate-400 mt-1`}>
            {!supported
              ? "Riconoscimento vocale non supportato da questo browser"
              : listening
                ? "In ascolto… pronuncia un comando"
                : transcript
                  ? `Comando ricevuto: ${transcript}`
                  : "Tocca il microfono o usa le cuffie per dare comandi"}
          </p>
          <p className="text-[11px] text-slate-500 mt-2 font-mono">Prova: “avvia impastatrice due” · “ferma” · “quanto manca”</p>
        </div>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-teal-400 flex items-center gap-2 uppercase tracking-wide">
            <Activity className={`w-4 h-4 ${anyRunning ? "text-amber-400" : "text-slate-500"}`} /> Monitoraggio Impastatrici
          </h3>
          <button data-testid="mixer-add" onClick={add} className="inline-flex items-center gap-1 text-xs font-semibold text-teal-300 hover:text-teal-200">
            <Plus className="w-3.5 h-3.5" /> Aggiungi
          </button>
        </div>

        <div className="space-y-3">
          {list.map((m) => (
            <div
              key={m.id}
              data-testid={`mixer-${m.id}`}
              className={`p-4 rounded-xl border bg-slate-950 flex items-center gap-4 transition-colors ${
                m.alerting ? "border-rose-500 animate-pulse shadow-[0_0_20px_rgba(244,63,94,0.4)]" : m.running ? "border-amber-500/40" : "border-slate-800"
              }`}
            >
              <Timer className={`w-6 h-6 shrink-0 ${m.alerting ? "text-rose-400" : m.running ? "text-amber-400" : "text-slate-500"}`} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-slate-100 truncate flex items-center gap-2">
                  {m.name}
                  {m.alerting && (
                    <span data-testid={`mixer-alert-${m.id}`} className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-rose-300 bg-rose-950/60 border border-rose-500/50 px-2 py-0.5 rounded-full">
                      <BellRing className="w-3 h-3" /> Ciclo terminato
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span data-testid={`mixer-time-${m.id}`} className={`font-mono ${timeText} font-black ${m.alerting ? "text-rose-300" : m.running ? "text-amber-300" : m.remaining > 0 ? "text-teal-300" : "text-slate-500"}`}>{fmt(m.remaining)}</span>
                  {!m.running && !m.alerting && (
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
                {m.alerting ? (
                  <button data-testid={`mixer-dismiss-${m.id}`} onClick={() => dismiss(m.id)} className={`${ctrl} rounded-lg bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center active:scale-95 transition-all`} title="Ho capito">
                    <BellRing className={ctrlIcon} />
                  </button>
                ) : !m.running ? (
                  <button data-testid={`mixer-start-${m.id}`} onClick={() => start(m.id)} className={`${ctrl} rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 flex items-center justify-center active:scale-95 transition-all`} title="Avvia">
                    <Play className={ctrlIcon} />
                  </button>
                ) : (
                  <button data-testid={`mixer-stop-${m.id}`} onClick={() => stop(m.id)} className={`${ctrl} rounded-lg bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center active:scale-95 transition-all`} title="Ferma">
                    <Square className={ctrlIcon} />
                  </button>
                )}
                <button data-testid={`mixer-reset-${m.id}`} onClick={() => reset(m.id)} className={`${ctrl} rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center active:scale-95 transition-all`} title="Reset">
                  <RotateCcw className={ctrlIcon} />
                </button>
                <button onClick={() => remove(m.id)} className={`${ctrl} rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-500 hover:text-rose-400 flex items-center justify-center active:scale-95 transition-all`} title="Rimuovi">
                  <Trash2 className={ctrlIcon} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Strumenti Laboratorio */}
      <div data-testid="lab-tools" className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
        <h3 className="text-sm font-bold text-teal-400 flex items-center gap-2 uppercase tracking-wide">
          <Wrench className="w-4 h-4" /> Strumenti Laboratorio
        </h3>
        <div className="space-y-2">
          {toolsRow.map((tool) => (
            <button key={tool.id} data-testid={`labtool-${tool.id}`} onClick={() => tool.kind === "manual" && cycleMachine(tool.id)} className={`w-full flex items-center justify-between bg-slate-950 border rounded-xl px-4 py-3 text-sm text-left transition-all ${tool.kind === "manual" ? "active:scale-98 hover:border-slate-700" : ""} ${tool.alarm ? "animate-pulse border-rose-500" : "border-slate-800"}`}>
              <span className="text-slate-200">{tool.name}</span>
              <span className="flex items-center gap-1.5 font-semibold" style={{ color: tool.color }}>
                {tool.kind === "thermal" && <b className="font-mono" data-testid={`labtemp-${tool.id}`}>{tool.temp}{tool.unit}</b>}
                <span className="w-2 h-2 rounded-full" style={{ background: tool.color }} /> {tool.status}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
