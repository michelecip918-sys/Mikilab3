import { useState, useRef, useEffect } from "react";
import { ChevronLeft, Ear, Mic, MicOff, RotateCcw, Info } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// V86 — "Il pane parla": il vecchio gesto del panettiere (battere con le nocche sul fondo del pane)
// letto dal microfono del telefono. Un pane cotto suona cavo: nota bassa e che risuona; un pane crudo
// suona sordo: nota alta e corta. L'audio è analizzato in tempo reale nel browser (Web Audio API):
// NON viene registrato, NON viene inviato a nessuno. È un esperimento: la prova dello stecchino
// e il termometro (94-98 °C al cuore) restano le prove sicure.

function centroidOf(freqData, sampleRate, fftSize) {
  let num = 0, den = 0;
  const binHz = sampleRate / fftSize;
  for (let i = 1; i < freqData.length; i++) { const v = freqData[i]; num += i * binHz * v; den += v; }
  return den ? num / den : 0;
}

export default function AscoltaCrosta({ onBack }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const [on, setOn] = useState(false);
  const [err, setErr] = useState(null);
  const [level, setLevel] = useState(0);
  const [knocks, setKnocks] = useState([]); // {centroid, decayMs, score}
  const ref = useRef({});

  const stop = () => {
    const r = ref.current;
    try { cancelAnimationFrame(r.raf); } catch { /* */ }
    try { r.stream && r.stream.getTracks().forEach((t) => t.stop()); } catch { /* */ }
    try { r.ctx && r.ctx.close(); } catch { /* */ }
    ref.current = {};
    setOn(false); setLevel(0);
  };
  useEffect(() => stop, []); // eslint-disable-line react-hooks/exhaustive-deps

  const start = async () => {
    setErr(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
      const AC = window.AudioContext || window.webkitAudioContext;
      const ctx = new AC();
      const src = ctx.createMediaStreamSource(stream);
      const an = ctx.createAnalyser(); an.fftSize = 2048; an.smoothingTimeConstant = 0.2;
      src.connect(an);
      const time = new Float32Array(an.fftSize);
      const freq = new Uint8Array(an.frequencyBinCount);
      const r = { stream, ctx, an, capturing: null, quietUntil: 0 };
      ref.current = r;
      const loop = () => {
        if (!ref.current.an) return;
        an.getFloatTimeDomainData(time);
        let sum = 0; for (let i = 0; i < time.length; i++) sum += time[i] * time[i];
        const rms = Math.sqrt(sum / time.length);
        setLevel(rms);
        const now = performance.now();
        if (r.capturing) {
          const c = r.capturing;
          c.rmsLog.push({ t: now, rms });
          if (rms > c.peak) { c.peak = rms; an.getByteFrequencyData(freq); c.centroid = centroidOf(freq, ctx.sampleRate, an.fftSize); c.peakT = now; }
          if (now - c.t0 > 450) {
            // tempo di risonanza: da picco a quando scende sotto il 25% del picco
            let decayMs = 0;
            for (const p of c.rmsLog) { if (p.t > c.peakT) { if (p.rms < c.peak * 0.25) { decayMs = p.t - c.peakT; break; } decayMs = p.t - c.peakT; } }
            const sCent = c.centroid < 900 ? 1 : c.centroid < 1500 ? 0.5 : 0;
            const sDec = decayMs > 110 ? 1 : decayMs > 60 ? 0.5 : 0;
            const score = sCent + sDec;
            setKnocks((k) => [...k, { centroid: Math.round(c.centroid), decayMs: Math.round(decayMs), score }].slice(-5));
            r.capturing = null; r.quietUntil = now + 600;
          }
        } else if (rms > 0.06 && now > r.quietUntil) {
          an.getByteFrequencyData(freq);
          r.capturing = { t0: now, peak: rms, peakT: now, centroid: centroidOf(freq, ctx.sampleRate, an.fftSize), rmsLog: [{ t: now, rms }] };
        }
        r.raf = requestAnimationFrame(loop);
      };
      setOn(true);
      loop();
    } catch (e) {
      setErr(tri("Non riesco ad accendere il microfono. Controlla i permessi del browser.", "Ich kann das Mikrofon nicht einschalten. Prüfe die Browser-Berechtigungen.", "I can't turn on the microphone. Check the browser permissions."));
    }
  };

  const avg = knocks.length ? knocks.reduce((a, k) => a + k.score, 0) / knocks.length : null;
  const verdict = avg == null ? null : avg >= 1.5 ? "cavo" : avg >= 0.75 ? "quasi" : "sordo";

  return (
    <div data-testid="crosta-page" className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <button data-testid="crosta-back" onClick={onBack} className="inline-flex items-center gap-1 text-muted-foreground text-sm font-bold"><ChevronLeft className="w-4 h-4" />{tri("Indietro", "Zurück", "Back")}</button>
      <div className="flex items-center gap-2"><Ear className="w-6 h-6 text-primary" /><h1 className="font-display text-2xl font-black text-foreground">{tri("Il pane parla", "Das Brot spricht", "The bread speaks")}</h1></div>
      <p className="text-sm text-muted-foreground">{tri("Il gesto più vecchio del fornaio: si batte con le nocche sul fondo del pane. Se suona cavo, è cotto. Qui lo ascolta il telefono con te.", "Die älteste Geste des Bäckers: mit den Knöcheln auf den Brotboden klopfen. Klingt es hohl, ist es fertig. Hier hört dein Handy mit.", "The baker's oldest gesture: knock on the bottom of the loaf with your knuckles. If it sounds hollow, it's done. Here your phone listens with you.")}</p>

      <section className="rounded-2xl border border-border bg-background p-4 space-y-2">
        <ol className="list-decimal pl-5 space-y-1 text-[13px] text-foreground/90">
          <li>{tri("Tira fuori il pane, giralo con un canovaccio (scotta) e tieni il telefono a 10-20 cm dal fondo.", "Brot herausnehmen, mit einem Tuch umdrehen (heiß!) und das Handy 10-20 cm vom Boden halten.", "Take the loaf out, turn it over with a cloth (hot!) and hold the phone 10-20 cm from the base.")}</li>
          <li>{tri("Accendi l'ascolto e batti 3 volte con le nocche, con un secondo di pausa tra un colpo e l'altro.", "Zuhören einschalten und 3-mal mit den Knöcheln klopfen, mit einer Sekunde Pause dazwischen.", "Turn on listening and knock 3 times with your knuckles, a second apart.")}</li>
          <li>{tri("Leggi il verdetto. Nel dubbio, vince lo stecchino o il termometro: 94-98 °C al cuore.", "Lies das Urteil. Im Zweifel gewinnt der Holzstab oder das Thermometer: 94-98 °C im Kern.", "Read the verdict. In doubt, the skewer or thermometer wins: 94-98 °C at the core.")}</li>
        </ol>
      </section>

      <section data-testid="crosta-listen" className="rounded-2xl border border-primary/40 bg-primary/8 p-4 space-y-3">
        <button data-testid="crosta-toggle" onClick={on ? stop : start} className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm active:scale-95 ${on ? "bg-mattone text-white" : "bg-primary text-primary-foreground"}`}>
          {on ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}{on ? tri("Smetti di ascoltare", "Zuhören beenden", "Stop listening") : tri("Accendi l'ascolto", "Zuhören einschalten", "Start listening")}
        </button>
        {err && <p className="text-[13px] text-mattone font-bold">{err}</p>}
        {on && (
          <div>
            <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary transition-all" style={{ width: `${Math.min(100, level * 600)}%` }} /></div>
            <p className="text-[12px] text-muted-foreground mt-1">{knocks.length ? tri(`${knocks.length} colpi sentiti. Continua o leggi sotto.`, `${knocks.length} Klopfer gehört. Weiter oder unten lesen.`, `${knocks.length} knocks heard. Keep going or read below.`) : tri("Sto ascoltando: batti sul fondo del pane.", "Ich höre zu: klopf auf den Brotboden.", "Listening: knock on the base of the loaf.")}</p>
          </div>
        )}
        {verdict && (
          <div data-testid="crosta-verdict" className={`rounded-xl border p-3.5 ${verdict === "cavo" ? "border-salvia/50 bg-salvia/12" : verdict === "quasi" ? "border-ambra/50 bg-ambra/12" : "border-mattone/50 bg-mattone/10"}`}>
            <p className="font-black text-foreground">
              {verdict === "cavo" && tri("Suona cavo: è cotto.", "Klingt hohl: fertig.", "Sounds hollow: it's done.")}
              {verdict === "quasi" && tri("Quasi: ancora 5 minuti e riprova.", "Fast: noch 5 Minuten, dann nochmal.", "Almost: 5 more minutes, then try again.")}
              {verdict === "sordo" && tri("Suona sordo: dentro è ancora umido. Altri 8-10 minuti, coperto se la crosta è già scura.", "Klingt dumpf: innen noch feucht. Weitere 8-10 Minuten, abgedeckt, wenn die Kruste schon dunkel ist.", "Sounds dull: still moist inside. Another 8-10 minutes, covered if the crust is already dark.")}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">{tri("Nota media", "Mittlere Tonlage", "Average tone")} {Math.round(knocks.reduce((a, k) => a + k.centroid, 0) / knocks.length)} Hz · {tri("risonanza", "Nachklang", "resonance")} {Math.round(knocks.reduce((a, k) => a + k.decayMs, 0) / knocks.length)} ms</p>
            <button onClick={() => setKnocks([])} className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-bold text-foreground active:scale-95"><RotateCcw className="w-3.5 h-3.5" />{tri("Azzera e riprova", "Zurücksetzen und nochmal", "Reset and retry")}</button>
          </div>
        )}
      </section>

      <p className="text-[11px] text-muted-foreground flex items-start gap-1.5"><Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />{tri("Il suono viene analizzato nel tuo telefono in tempo reale: non viene registrato né inviato a nessuno. È un esperimento di Sitor, l'avatar IA di Michele: aiuta, ma non sostituisce le prove sicure.", "Der Ton wird in Echtzeit auf deinem Handy analysiert: nicht aufgenommen, nicht gesendet. Ein Experiment von Sitor, Micheles KI-Avatar: es hilft, ersetzt aber die sicheren Proben nicht.", "The sound is analysed on your phone in real time: not recorded, not sent anywhere. An experiment by Sitor, Michele's AI avatar: it helps, but doesn't replace the safe tests.")}</p>
    </div>
  );
}
