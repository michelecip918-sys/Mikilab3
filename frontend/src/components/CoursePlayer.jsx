import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, SkipForward, SkipBack, RotateCcw, Volume2, VolumeX, Timer as TimerIcon, Mic, MicOff, ChefHat, AlertTriangle, Eye } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { useTimers } from "@/audio/TimerContext";
import { mkTri } from "@/i18n/triMaps";
import { api } from "@/lib/api";
import { toast } from "sonner";

const MODE_KEY = "mikilab_recipe_mode";

// Player del corso passo-passo: voce SINTETICA DEL DISPOSITIVO (Web Speech), comandi vocali, timer, schermo acceso.
export default function CoursePlayer({ recipe, onClose }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const { addTimer } = useTimers();
  const voiceLang = mkTri(lang)("it-IT", "de-DE", "en-GB");
  const [mode, setMode] = useState(() => { try { return localStorage.getItem(MODE_KEY) === "esperto" ? "esperto" : "casa"; } catch { return "casa"; } });

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [idx, setIdx] = useState(0);
  const [ttsOn, setTtsOn] = useState(true);
  const [micOn, setMicOn] = useState(false);
  const [heard, setHeard] = useState("");
  const wlRef = useRef(null);
  const recRef = useRef(null);
  const ttsOnRef = useRef(true);
  const idxRef = useRef(0);
  useEffect(() => { ttsOnRef.current = ttsOn; }, [ttsOn]);
  useEffect(() => { idxRef.current = idx; }, [idx]);

  useEffect(() => {
    let ok = true;
    setLoading(true); setErr("");
    api.get(`/recipes/${recipe.id}/course-v2?lang=${lang}`)
      .then((r) => { if (ok) setData(r.data); })
      .catch((e) => { if (ok) setErr(e?.response?.data?.detail || "err"); })
      .finally(() => { if (ok) setLoading(false); });
    return () => { ok = false; };
  }, [recipe.id, lang]);

  const course = data?.course;
  const phases = course?.phases || [];
  const total = phases.length + 1; // +1 = schermata finale (problemi + conservazione)
  const isFinal = idx >= phases.length;
  const cur = phases[idx];

  const phaseText = useCallback((p) => {
    if (!p) return "";
    const doTxt = mode === "esperto" && p.do_esperto ? p.do_esperto : p.do_casa;
    return [p.name, doTxt, p.signals ? tri("Segnali: ", "Zeichen: ", "Signals: ") + p.signals : ""].filter(Boolean).join(". ");
  }, [mode, lang]); // eslint-disable-line

  const speak = useCallback((text) => {
    try {
      window.speechSynthesis && window.speechSynthesis.cancel();
      if (!ttsOnRef.current || !text) return;
      const u = new SpeechSynthesisUtterance(text);
      u.lang = voiceLang; u.rate = 0.98;
      window.speechSynthesis.speak(u);
    } catch { /* */ }
  }, [voiceLang]);

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

  // Legge il passo quando cambia (dopo il caricamento).
  useEffect(() => {
    if (!loading && phases.length && !isFinal) speak(phaseText(phases[idx]));
    // eslint-disable-next-line
  }, [idx, loading]);

  const go = useCallback((next) => {
    setIdx((c) => Math.max(0, Math.min(total - 1, next(c))));
  }, [total]);

  const doTimer = useCallback((mins) => {
    if (!mins || mins <= 0) { toast.info(tri("Nessun timer per questo passo.", "Kein Timer für diesen Schritt.", "No timer for this step.")); return; }
    addTimer(course?.title || recipe.name || "Timer", mins);
    if (navigator.vibrate) navigator.vibrate(120);
    toast.success(tri(`Timer di ${mins} minuti avviato`, `Timer über ${mins} Minuten gestartet`, `${mins}-minute timer started`));
  }, [addTimer, course, recipe, tri]);

  const handleTranscript = useCallback((said) => {
    const s = said.toLowerCase(); setHeard(said);
    const m = s.match(/(\d{1,3})\s*(min|minut|minute|minuten)/);
    if (m) { doTimer(parseInt(m[1], 10)); return; }
    if (/\b(avanti|prossim|weiter|next)\b/.test(s)) { go((c) => c + 1); return; }
    if (/\b(indietro|precedente|zur[üu]ck|back)\b/.test(s)) { go((c) => c - 1); return; }
    if (/\b(ripeti|wiederhol|repeat)\b/.test(s)) { speak(phaseText(phases[idxRef.current])); return; }
    if (/\b(timer)\b/.test(s)) { doTimer(phases[idxRef.current]?.timer_min || 0); return; }
    if (/\b(chiudi|schlie|close|esci|exit)\b/.test(s)) { onClose(); return; }
  }, [go, speak, phaseText, phases, doTimer, onClose]);

  const startMic = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { toast.error(tri("Comandi vocali non supportati.", "Sprachbefehle nicht unterstützt.", "Voice commands not supported.")); return; }
    try {
      const rec = new SR();
      rec.lang = voiceLang; rec.continuous = true; rec.interimResults = false;
      rec.onresult = (e) => { const r = e.results[e.results.length - 1]; if (r && r[0]) handleTranscript(r[0].transcript || ""); };
      rec.onerror = () => { /* */ };
      rec.onend = () => { if (recRef.current) { try { rec.start(); } catch { /* */ } } };
      recRef.current = rec; rec.start(); setMicOn(true);
    } catch { toast.error(tri("Microfono non disponibile.", "Mikrofon nicht verfügbar.", "Microphone not available.")); }
  }, [voiceLang, handleTranscript, tri]);
  const stopMic = useCallback(() => { const rec = recRef.current; recRef.current = null; try { rec && rec.stop(); } catch { /* */ } setMicOn(false); setHeard(""); }, []);

  const openTechnique = (slug) => { window.dispatchEvent(new CustomEvent("mikilab-open-technique", { detail: { slug } })); onClose(); };

  return createPortal((
    <div data-testid="course-player" className="fixed inset-0 z-[95] bg-[#1F2124] text-[#F6F1E7] flex flex-col">
      <div className="flex items-center justify-between px-5 pt-5 pb-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <ChefHat className="w-5 h-5 shrink-0 text-[#E9A23B]" />
          <p className="font-display font-bold truncate">{tri("Cucina con Sitor", "Koch mit Sitor", "Cook with Sitor")}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-white/20 overflow-hidden text-[11px] font-bold">
            <button data-testid="course-mode-casa" onClick={() => { setMode("casa"); localStorage.setItem(MODE_KEY, "casa"); }} className={`px-2.5 py-1 ${mode === "casa" ? "bg-[#E9A23B] text-[#1F2124]" : "text-white/70"}`}>{tri("Casa", "Zu Hause", "Home")}</button>
            <button data-testid="course-mode-esperto" onClick={() => { setMode("esperto"); localStorage.setItem(MODE_KEY, "esperto"); }} className={`px-2.5 py-1 ${mode === "esperto" ? "bg-[#E9A23B] text-[#1F2124]" : "text-white/70"}`}>{tri("Esperto", "Experte", "Expert")}</button>
          </div>
          <button data-testid="course-close" onClick={onClose} className="p-2 rounded-full bg-white/15 active:scale-90"><X className="w-5 h-5" /></button>
        </div>
      </div>

      {loading && <div className="flex-1 flex items-center justify-center text-white/60">{tri("Sitor sta preparando il corso…", "Sitor bereitet den Kurs vor…", "Sitor is preparing the course…")}</div>}
      {!loading && err && <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-white/70">{err === "course_daily_cap" ? tri("Oggi Sitor ha già preparato molti corsi nuovi. Riprova domani.", "Sitor hat heute schon viele neue Kurse erstellt. Versuch es morgen.", "Sitor already prepared many new courses today. Try again tomorrow.") : tri("Corso non disponibile al momento.", "Kurs momentan nicht verfügbar.", "Course not available right now.")}</p>
        <button onClick={onClose} className="bg-[#A85A22] px-5 py-2.5 rounded-2xl font-semibold">{tri("Chiudi", "Schließen", "Close")}</button>
      </div>}

      {!loading && course && (
        <>
          <div className="px-5 shrink-0">
            <div className="flex items-center gap-1">{Array.from({ length: total }).map((_, i) => <div key={i} className={`h-1 flex-1 rounded-full ${i <= idx ? "bg-[#E9A23B]" : "bg-white/20"}`} />)}</div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-white/60 text-xs" data-testid="course-counter">{isFinal ? tri("Fine", "Ende", "End") : `${tri("Passo", "Schritt", "Step")} ${idx + 1}/${phases.length}`}</p>
              <span data-testid="course-verified-label" className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${data.verified ? "bg-[#6E8F7A]/30 text-[#DDE8DF]" : "bg-white/10 text-white/60"}`}>
                {data.verified ? tri("Verificato da Michele ✓", "Von Michele geprüft ✓", "Verified by Michele ✓") : tri("Bozza di Sitor: verifica sempre segnali e temperature", "Sitor-Entwurf: prüfe immer Zeichen und Temperaturen", "Sitor draft: always check signals and temperatures")}
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {!isFinal && cur && (
              <div className="max-w-xl mx-auto space-y-4">
                <h2 data-testid="course-phase-name" className="font-display text-[26px] leading-tight font-bold text-[#E9A23B]">{cur.name}</h2>
                <p data-testid="course-phase-do" className="text-[19px] leading-relaxed">{mode === "esperto" && cur.do_esperto ? cur.do_esperto : cur.do_casa}</p>
                {cur.why && <p className="text-white/75 text-[15px]"><span className="font-bold text-[#6E8F7A]">{tri("Perché", "Warum", "Why")}:</span> {cur.why}</p>}
                {cur.signals && <div className="rounded-xl bg-white/6 p-3 text-[15px]"><span className="font-bold text-[#E9A23B]">{tri("Segnali", "Zeichen", "Signals")}:</span> {cur.signals}</div>}
                {(cur.time_min || cur.time_max) ? <p className="text-white/60 text-sm">⏱ {tri("Tempo", "Zeit", "Time")}: {cur.time_min || "?"}{cur.time_max ? `–${cur.time_max}` : ""} min</p> : null}
                {cur.safety && <p className="flex items-start gap-2 text-[#f0c9cf] text-sm bg-[#A4472D]/25 rounded-xl p-3"><AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />{cur.safety}</p>}
                {cur.technique && <button data-testid="course-technique-link" onClick={() => openTechnique(cur.technique)} className="inline-flex items-center gap-1.5 text-[#E9A23B] font-bold text-sm underline underline-offset-2"><Eye className="w-4 h-4" />{tri("Guarda come si fa", "Sieh, wie es geht", "See how it's done")}</button>}
              </div>
            )}
            {isFinal && (
              <div className="max-w-xl mx-auto space-y-4" data-testid="course-final">
                {course.troubleshooting?.length > 0 && (<>
                  <h2 className="font-display text-[24px] font-bold text-[#E9A23B]">{tri("Se qualcosa va storto", "Wenn etwas schiefgeht", "If something goes wrong")}</h2>
                  {course.troubleshooting.map((t, i) => (
                    <div key={i} className="rounded-xl bg-white/6 p-3">
                      <p className="font-bold">{t.problem}</p>
                      <p className="text-white/70 text-sm mt-0.5"><span className="text-[#A4472D] font-semibold">{tri("Causa", "Ursache", "Cause")}:</span> {t.cause}</p>
                      <p className="text-white/85 text-sm"><span className="text-[#6E8F7A] font-semibold">{tri("Rimedio", "Lösung", "Fix")}:</span> {t.fix}</p>
                    </div>
                  ))}
                </>)}
                {course.storage && <div className="rounded-xl bg-white/6 p-3"><p className="font-bold text-[#6E8F7A]">{tri("Conservazione", "Aufbewahrung", "Storage")}</p><p className="text-white/85 text-[15px] mt-1">{course.storage}</p></div>}
                <button onClick={onClose} className="w-full bg-[#A85A22] py-4 rounded-2xl font-bold text-[17px] active:scale-95">{tri("Ho finito, grazie Sitor!", "Fertig, danke Sitor!", "Done, thanks Sitor!")}</button>
              </div>
            )}
          </div>

          {micOn && <p className="text-center text-white/50 text-xs px-5 pb-1">🎙️ {tri("Di': avanti · indietro · ripeti · timer · chiudi", "Sag: weiter · zurück · wiederhole · Timer · schließen", "Say: next · back · repeat · timer · close")}{heard ? ` — “${heard}”` : ""}</p>}

          <div className="p-4 shrink-0 space-y-2" style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}>
            <div className="grid grid-cols-3 gap-2">
              <button data-testid="course-prev" onClick={() => go((c) => c - 1)} disabled={idx === 0} className="flex flex-col items-center gap-1 rounded-2xl bg-white/12 disabled:opacity-40 active:scale-95 font-bold text-sm" style={{ minHeight: 56 }}><SkipBack className="w-5 h-5" />{tri("Indietro", "Zurück", "Back")}</button>
              <button data-testid="course-timer" onClick={() => doTimer(cur?.timer_min || 0)} className="flex flex-col items-center gap-1 rounded-2xl bg-[#E9A23B] text-[#1F2124] active:scale-95 font-bold text-sm" style={{ minHeight: 56 }}><TimerIcon className="w-5 h-5" />{cur?.timer_min ? `${cur.timer_min}m` : "Timer"}</button>
              <button data-testid="course-next" onClick={() => go((c) => c + 1)} disabled={idx >= total - 1} className="flex flex-col items-center gap-1 rounded-2xl bg-white/12 disabled:opacity-40 active:scale-95 font-bold text-sm" style={{ minHeight: 56 }}><SkipForward className="w-5 h-5" />{tri("Avanti", "Weiter", "Next")}</button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button data-testid="course-repeat" onClick={() => speak(phaseText(cur))} className="flex items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-white/12 active:scale-95 font-semibold text-sm"><RotateCcw className="w-4 h-4" />{tri("Ripeti", "Wiederh.", "Repeat")}</button>
              <button data-testid="course-tts" onClick={() => setTtsOn((v) => { const nv = !v; if (!nv) { try { window.speechSynthesis.cancel(); } catch { /* */ } } return nv; })} className={`flex items-center justify-center gap-1.5 py-2.5 rounded-2xl font-semibold text-sm active:scale-95 ${ttsOn ? "bg-white text-[#1F2124]" : "bg-white/12"}`}>{ttsOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}{tri("Voce", "Stimme", "Voice")}</button>
              <button data-testid="course-mic" onClick={() => (micOn ? stopMic() : startMic())} className={`flex items-center justify-center gap-1.5 py-2.5 rounded-2xl font-semibold text-sm active:scale-95 ${micOn ? "bg-[#6E8F7A] text-white animate-pulse" : "bg-white/12"}`}>{micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}{tri("Comandi", "Befehle", "Commands")}</button>
            </div>
            <p className="text-center text-white/40 text-[10px]">{tri("Voce sintetica del tuo dispositivo.", "Synthetische Stimme deines Geräts.", "Your device's synthetic voice.")}</p>
          </div>
        </>
      )}
    </div>
  ), document.body);
}
