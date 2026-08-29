import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Mic, MicOff, SkipForward, SkipBack, RotateCcw, Volume2, VolumeX, Timer as TimerIcon, Hand } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { useTimers } from "@/audio/TimerContext";
import { cleanForSpeech } from "@/lib/voice";
import { toast } from "sonner";
import { mkTri } from "@/i18n/triMaps";

// Modalità "Mani in Pasta": legge i passaggi a voce, comandi vocali e schermo sempre acceso.
export default function HandsFreeMode({ recipe, procedure, lang: langProp, onClose }) {
  const { lang: ctxLang } = useLang();
  const lang = langProp || ctxLang;
  const tri = (i, d, e, s) => mkTri(lang)(i, d, e, s);
  const { addTimer } = useTimers();
  const voiceLang = mkTri(lang)("it-IT", "de-DE", "en-GB", "es-ES");

  const steps = useMemo(() => {
    const raw = (procedure || "").split(/\n+/).map((s) => s.trim()).filter(Boolean);
    let arr = raw.length > 1 ? raw : (procedure || "").split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
    return arr.map((s) => s.replace(/^\s*\d+[.)]\s*/, "").replace(/^[-*•]\s*/, "")).filter(Boolean);
  }, [procedure]);

  const [idx, setIdx] = useState(0);
  const [ttsOn, setTtsOn] = useState(true);
  const [micOn, setMicOn] = useState(false);
  const [heard, setHeard] = useState("");
  const recRef = useRef(null);
  const wlRef = useRef(null);
  const ttsOnRef = useRef(true);
  const idxRef = useRef(0);
  useEffect(() => { ttsOnRef.current = ttsOn; }, [ttsOn]);
  useEffect(() => { idxRef.current = idx; }, [idx]);

  const speak = useCallback((text) => {
    try {
      const synth = window.speechSynthesis;
      if (!synth) return;
      synth.cancel();
      if (!ttsOnRef.current) return;
      const u = new SpeechSynthesisUtterance(cleanForSpeech(text));
      u.lang = voiceLang; u.rate = 0.95;
      synth.speak(u);
    } catch { /* */ }
  }, [voiceLang]);

  // Wake Lock: tiene lo schermo acceso.
  const acquireWake = useCallback(async () => {
    try { if ("wakeLock" in navigator) wlRef.current = await navigator.wakeLock.request("screen"); } catch { /* */ }
  }, []);
  useEffect(() => {
    acquireWake();
    const onVis = () => { if (document.visibilityState === "visible") acquireWake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      try { wlRef.current && wlRef.current.release(); wlRef.current = null; } catch { /* */ }
      try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch { /* */ }
      try { recRef.current && recRef.current.stop(); } catch { /* */ }
    };
  }, [acquireWake]);

  const go = useCallback((next) => {
    setIdx((cur) => {
      const v = Math.max(0, Math.min(steps.length - 1, next(cur)));
      speak(steps[v] || "");
      return v;
    });
  }, [steps, speak]);

  // Legge il passo corrente al primo avvio.
  useEffect(() => { if (steps.length) speak(steps[0]); /* eslint-disable-next-line */ }, []);

  const doTimer = useCallback((mins) => {
    if (!mins || mins <= 0) return;
    addTimer(tri("Timer ricetta", "Rezept-Timer", "Recipe timer", "Temporizador"), mins);
    toast.success(tri(`Timer di ${mins} minuti avviato`, `Timer über ${mins} Minuten gestartet`, `${mins}-minute timer started`, `Temporizador de ${mins} minutos iniciado`));
  }, [addTimer, tri]);

  const handleTranscript = useCallback((said) => {
    const s = said.toLowerCase();
    setHeard(said);
    const mTimer = s.match(/(\d{1,3})\s*(min|minut|minute|minuten|minutos)/);
    if (mTimer) { doTimer(parseInt(mTimer[1], 10)); return; }
    if (/\b(avanti|prossimo|prossima|weiter|next|siguiente|adelante)\b/.test(s)) { go((c) => c + 1); return; }
    if (/\b(indietro|precedente|zur[üu]ck|back|previous|atr[áa]s|anterior)\b/.test(s)) { go((c) => c - 1); return; }
    if (/\b(ripeti|wiederhol|repeat|repite|repetir)\b/.test(s)) { speak(steps[idxRef.current] || ""); return; }
    if (/\b(chiudi|schlie|close|cierra|cerrar|esci|exit)\b/.test(s)) { onClose(); return; }
    if (/\b(stop|ferma|halt|para|silenzio)\b/.test(s)) { try { window.speechSynthesis.cancel(); } catch { /* */ } return; }
  }, [go, speak, steps, doTimer, onClose]);

  const startMic = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { toast.error(tri("Comandi vocali non supportati su questo browser.", "Sprachbefehle werden nicht unterstützt.", "Voice commands not supported on this browser.", "Comandos de voz no compatibles.")); return; }
    try {
      const rec = new SR();
      rec.lang = voiceLang; rec.continuous = true; rec.interimResults = false;
      rec.onresult = (e) => { const r = e.results[e.results.length - 1]; if (r && r[0]) handleTranscript(r[0].transcript || ""); };
      rec.onerror = () => { /* ignora */ };
      rec.onend = () => { if (recRef.current) { try { rec.start(); } catch { /* */ } } };
      recRef.current = rec;
      rec.start();
      setMicOn(true);
    } catch { toast.error(tri("Microfono non disponibile.", "Mikrofon nicht verfügbar.", "Microphone not available.", "Micrófono no disponible.")); }
  }, [voiceLang, handleTranscript, tri]);

  const stopMic = useCallback(() => {
    const rec = recRef.current; recRef.current = null;
    try { rec && rec.stop(); } catch { /* */ }
    setMicOn(false); setHeard("");
  }, []);

  const toggleMic = () => (micOn ? stopMic() : startMic());

  if (!steps.length) {
    return createPortal((
      <div className="fixed inset-0 z-[95] bg-[#121212] text-white flex flex-col items-center justify-center p-6 text-center" data-testid="handsfree-overlay">
        <p className="mb-4">{tri("Questa ricetta non ha un procedimento passo-passo.", "Dieses Rezept hat keine Schritt-für-Schritt-Anleitung.", "This recipe has no step-by-step procedure.", "Esta receta no tiene un procedimiento paso a paso.")}</p>
        <button data-testid="handsfree-close" onClick={onClose} className="bg-[#ff6b00] px-5 py-2.5 rounded-xl font-semibold">{tri("Chiudi", "Schließen", "Close", "Cerrar")}</button>
      </div>
    ), document.body);
  }

  return createPortal((
    <div className="fixed inset-0 z-[95] bg-gradient-to-b from-[#ff6b00] to-[#12212e] text-white flex flex-col" data-testid="handsfree-overlay">
      <div className="flex items-center justify-between px-5 pt-5 pb-2">
        <div className="flex items-center gap-2 min-w-0">
          <Hand className="w-5 h-5 shrink-0" />
          <p className="font-semibold truncate">{tri("Mani in Pasta", "Hände im Teig", "Hands in the Dough", "Manos en la Masa")}</p>
        </div>
        <button data-testid="handsfree-close" onClick={onClose} className="p-2 rounded-full bg-white/15 active:scale-90"><X className="w-5 h-5" /></button>
      </div>

      <div className="px-5">
        <div className="flex items-center gap-1.5">
          {steps.map((_, i) => <div key={i} className={`h-1 flex-1 rounded-full ${i <= idx ? "bg-white" : "bg-white/25"}`} />)}
        </div>
        <p className="text-white/70 text-xs mt-2 font-mono-data" data-testid="handsfree-counter">{tri("Passo", "Schritt", "Step", "Paso")} {idx + 1}/{steps.length}</p>
      </div>

      <div className="flex-1 flex items-center justify-center px-7 py-4 overflow-y-auto">
        <p data-testid="handsfree-step" className="font-display text-[26px] leading-snug font-bold text-center">{steps[idx]}</p>
      </div>

      {micOn && (
        <div className="px-5 pb-1 text-center">
          <p className="text-white/60 text-xs">🎙️ {tri("Di': avanti · indietro · ripeti · timer 20 minuti · stop", "Sag: weiter · zurück · wiederhole · Timer 20 Minuten · stop", "Say: next · back · repeat · timer 20 minutes · stop", "Di: adelante · atrás · repite · temporizador 20 minutos · stop")}</p>
          {heard && <p className="text-white/40 text-[11px] mt-0.5 italic truncate">“{heard}”</p>}
        </div>
      )}

      <div className="p-5 pb-8 space-y-3" style={{ paddingBottom: "calc(2rem + env(safe-area-inset-bottom))" }}>
        <div className="grid grid-cols-3 gap-2">
          <button data-testid="handsfree-prev" onClick={() => go((c) => c - 1)} disabled={idx === 0}
            className="flex flex-col items-center gap-1 py-3 rounded-2xl bg-white/12 disabled:opacity-40 active:scale-95 font-semibold text-sm"><SkipBack className="w-5 h-5" />{tri("Indietro", "Zurück", "Back", "Atrás")}</button>
          <button data-testid="handsfree-repeat" onClick={() => speak(steps[idx])}
            className="flex flex-col items-center gap-1 py-3 rounded-2xl bg-white/12 active:scale-95 font-semibold text-sm"><RotateCcw className="w-5 h-5" />{tri("Ripeti", "Wiederh.", "Repeat", "Repite")}</button>
          <button data-testid="handsfree-next" onClick={() => go((c) => c + 1)} disabled={idx === steps.length - 1}
            className="flex flex-col items-center gap-1 py-3 rounded-2xl bg-white/12 disabled:opacity-40 active:scale-95 font-semibold text-sm"><SkipForward className="w-5 h-5" />{tri("Avanti", "Weiter", "Next", "Adelante")}</button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button data-testid="handsfree-tts" onClick={() => { setTtsOn((v) => { const nv = !v; if (!nv) { try { window.speechSynthesis.cancel(); } catch { /* */ } } return nv; }); }}
            className={`flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm active:scale-95 ${ttsOn ? "bg-white text-[#ff6b00]" : "bg-white/12"}`}>{ttsOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}{tri("Voce", "Stimme", "Voice", "Voz")}</button>
          <button data-testid="handsfree-timer" onClick={() => doTimer(20)}
            className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/12 font-semibold text-sm active:scale-95"><TimerIcon className="w-5 h-5" />+20m</button>
          <button data-testid="handsfree-mic" onClick={toggleMic}
            className={`flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm active:scale-95 ${micOn ? "bg-[#ff6b00] text-white animate-pulse" : "bg-white/12"}`}>{micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}{tri("Comandi", "Befehle", "Commands", "Comandos")}</button>
        </div>
      </div>
    </div>
  ), document.body);
}
