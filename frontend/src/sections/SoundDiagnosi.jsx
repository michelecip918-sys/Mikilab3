import { useState, useRef } from "react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { Mic, Square, Loader2, Volume2, Share2 } from "lucide-react";
import { API } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { shareContent } from "@/lib/share";
import ListenButton from "@/components/ListenButton";
import { addXP } from "@/lib/level";
import { mkTri } from "@/i18n/triMaps";

// Estrae feature acustiche semplici dall'inviluppo di volume campionato.
function computeFeatures(samples, duration) {
  const n = samples.length;
  if (!n) return { loudness: 0, variability: 0, regularity: 0, duration };
  const mean = samples.reduce((a, b) => a + b, 0) / n;
  const variance = samples.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
  const dt = samples.map((x) => x - mean);
  let best = 0;
  for (let lag = 2; lag < Math.min(50, n - 2); lag++) {
    let c = 0, e = 0;
    for (let i = 0; i < n - lag; i++) { c += dt[i] * dt[i + lag]; e += dt[i] * dt[i]; }
    if (e > 0) { const r = c / e; if (r > best) best = r; }
  }
  return {
    loudness: +mean.toFixed(4),
    variability: +Math.sqrt(variance).toFixed(4),
    regularity: +Math.max(0, Math.min(1, best)).toFixed(3),
    duration: +duration.toFixed(1),
  };
}

export default function SoundDiagnosi() {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const [recording, setRecording] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState("");
  const [wave, setWave] = useState([]);
  const recRef = useRef(false);
  const stopRef = useRef(null);

  const finish = async (samples, duration, cleanup) => {
    cleanup && cleanup();
    setRecording(false); recRef.current = false;
    const features = computeFeatures(samples, duration);
    if (!features.loudness) { toast.error(tri("Nessun suono rilevato", "Kein Ton erkannt", "No sound detected")); return; }
    setAnalyzing(true); setResult("");
    try {
      const res = await fetch(`${API}/diagnosi/sound`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ features, lang }),
      });
      if (!res.ok) throw new Error("http");
      const data = await res.json();
      const text = (data.result || "").trim();
      setResult(text);
      if (text) {
        try {
          await fetch(`${API}/diagnosi/save`, {
            method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
            body: JSON.stringify({ mode: "suono", result: text, thumb: null }),
          });
          addXP(1);
        } catch { /* best effort */ }
      }
    } catch {
      toast.error(tri("Errore nell'analisi. Riprova.", "Analysefehler. Versuch es erneut.", "Analysis error. Try again."));
    } finally { setAnalyzing(false); }
  };

  const start = async () => {
    if (recording || analyzing) return;
    let stream, ctx;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      toast.error(tri("Microfono non disponibile", "Mikrofon nicht verfügbar", "Microphone not available"));
      return;
    }
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    const src = ctx.createMediaStreamSource(stream);
    const an = ctx.createAnalyser(); an.fftSize = 1024;
    src.connect(an);
    const buf = new Uint8Array(an.fftSize);
    const samples = [];
    const t0 = Date.now();
    setRecording(true); recRef.current = true;
    const cleanup = () => { try { stream.getTracks().forEach((t) => t.stop()); ctx.close(); } catch { /* */ } };
    stopRef.current = () => finish(samples, (Date.now() - t0) / 1000, cleanup);
    const tick = () => {
      if (!recRef.current) return;
      an.getByteTimeDomainData(buf);
      let sum = 0;
      for (let i = 0; i < buf.length; i++) { const v = (buf[i] - 128) / 128; sum += v * v; }
      const rms = Math.sqrt(sum / buf.length);
      samples.push(rms);
      setWave((w) => [...w.slice(-47), rms]);
      if (Date.now() - t0 < 8000) setTimeout(tick, 60);
      else finish(samples, (Date.now() - t0) / 1000, cleanup);
    };
    setWave([]);
    tick();
  };

  const stop = () => { if (recRef.current && stopRef.current) { recRef.current = false; stopRef.current(); } };

  return (
    <div className="pb-24">
      <div className="relative rounded-3xl overflow-hidden mb-5 bg-gradient-to-br from-[#ff6b00] to-[#ff6b00] p-6 text-white">
        <Volume2 className="w-7 h-7 mb-2" />
        <h1 className="font-display text-2xl font-bold">{tri("Diagnosi Sonora", "Klang-Diagnose", "Sound Diagnosis")}</h1>
        <p className="text-white/85 text-sm mt-1">{tri("Avvicina il telefono all'impastatrice: dal ritmo del suono capisco se l'impasto è ancora duro o quasi pronto.", "Halte das Handy an den Kneter: am Rhythmus erkenne ich, ob der Teig noch hart oder fast fertig ist.", "Hold the phone near the mixer: from the sound rhythm I can tell if the dough is still hard or almost ready.")}</p>
      </div>

      <div className="rounded-2xl bg-[#ff6b00]/12 border border-[#ff6b00]/30 p-4 mb-4 text-sm text-[#ff6b00] dark:text-[#8FB0C2] leading-relaxed">
        ⚠️ {tri("È una stima «a orecchio» (beta), non un sensore di laboratorio. Registra ~8 secondi durante l'impastamento.", "Es ist eine Schätzung «nach Gehör» (Beta), kein Laborsensor. Nimm ~8 Sek. während des Knetens auf.", "It's an «by ear» estimate (beta), not a lab sensor. Record ~8 seconds during kneading.")}
      </div>

      {!recording ? (
        <button data-testid="sound-start-btn" onClick={start} disabled={analyzing}
          className="w-full bg-[#ff6b00] hover:bg-[#336a94] disabled:opacity-50 text-white font-semibold px-5 py-3.5 rounded-2xl shadow-md active:scale-98 transition-all flex items-center justify-center gap-2">
          {analyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mic className="w-5 h-5" />}
          {analyzing ? tri("Analizzo…", "Analysiere…", "Analyzing…") : tri("Registra e analizza", "Aufnehmen & analysieren", "Record & analyze")}
        </button>
      ) : (
        <button data-testid="sound-stop-btn" onClick={stop}
          className="w-full bg-[#ff6b00] hover:bg-[#a8483f] text-white font-semibold px-5 py-3.5 rounded-2xl shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 animate-pulse">
          <Square className="w-5 h-5" /> {tri("Sto ascoltando… tocca per fermare", "Ich höre zu… tippen zum Stoppen", "Listening… tap to stop")}
        </button>
      )}

      {recording && (
        <div data-testid="sound-wave" className="mt-4 rounded-2xl bg-[#ff6b00] p-4">
          <div className="flex items-end justify-center gap-[3px] h-16">
            {wave.length === 0 && <span className="text-white/50 text-xs self-center">{tri("Avvicina il telefono all'impastatrice…", "Handy an den Kneter halten…", "Bring the phone near the mixer…")}</span>}
            {wave.map((v, k) => (
              <div key={k} className="w-1.5 rounded-full bg-gradient-to-t from-[#8FB0C2] to-[#e4eff8] transition-all duration-75"
                style={{ height: `${Math.max(6, Math.min(100, v * 320))}%` }} />
            ))}
          </div>
          <p className="text-center text-white/70 text-xs mt-2">{tri("Ritmo dell'impasto in tempo reale", "Teig-Rhythmus in Echtzeit", "Dough rhythm in real time")}</p>
        </div>
      )}

      {result && (
        <div className="mt-5">
          <div data-testid="sound-result" className="markdown-body bg-white dark:bg-[#1e1e1e] border border-[#2b2b2b] dark:border-[#2e2e2e] rounded-2xl p-5 text-sm leading-relaxed text-[#2B303B] dark:text-[#e4eff8]">
            <ReactMarkdown>{result}</ReactMarkdown>
          </div>
          <button data-testid="sound-share-btn" onClick={() => shareContent(tri("Diagnosi Sonora — MikiLab", "Klang-Diagnose — MikiLab", "Sound Diagnosis — MikiLab"), result, lang)}
            className="mt-2 w-full bg-[#e4eff8] dark:bg-[#242424] text-[#2B303B] dark:text-[#e4eff8] font-medium px-4 py-3 rounded-2xl border border-[#2b2b2b] dark:border-[#2e2e2e] flex items-center justify-center gap-2 active:scale-98 transition-all">
            <Share2 className="w-5 h-5" /> {tri("Condividi", "Teilen", "Share")}
          </button>
          <ListenButton text={result} who="momy" testid="sound-listen-btn"
            className="mt-2 w-full bg-[#ff6b00] hover:bg-[#336a94] text-white font-medium px-4 py-3 rounded-2xl flex items-center justify-center gap-2 active:scale-98 transition-all" />
        </div>
      )}
    </div>
  );
}
