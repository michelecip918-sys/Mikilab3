import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, SkipForward, SkipBack, RotateCcw, Volume2, VolumeX, Timer as TimerIcon, Mic, MicOff, ChefHat, AlertTriangle, Eye, Hand, HelpCircle, CalendarClock, Star } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { useTimers } from "@/audio/TimerContext";
import { useAuth } from "@/auth/AuthContext";
import { bumpOvenAdj, getOvenAdj, addDiary } from "@/lib/mycucina";
import { mkTri } from "@/i18n/triMaps";
import { api } from "@/lib/api";
import { playTTSLong, stopTTS } from "@/lib/tts"; // V114
import { toast } from "sonner";
import SitorBadge from "@/components/SitorBadge";
import PhotoDiag from "@/components/PhotoDiag";
import Palato from "@/components/Palato";

const MODE_KEY = "mikilab_recipe_mode";

// Player del corso passo-passo: voce SINTETICA DEL DISPOSITIVO (Web Speech), comandi vocali, timer, schermo acceso.
export default function CoursePlayer({ recipe, onClose }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const { addTimer } = useTimers();
  const { user } = useAuth();
  const isAdmin = !!(user && user.role === "admin");
  const voiceLang = mkTri(lang)("it-IT", "de-DE", "en-GB");
  const [mode, setMode] = useState(() => { try { return localStorage.getItem(MODE_KEY) === "esperto" ? "esperto" : "casa"; } catch { return "casa"; } });

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [idx, setIdx] = useState(0);
  const [ttsOn, setTtsOn] = useState(true);
  const [micOn, setMicOn] = useState(false);
  const [heard, setHeard] = useState("");
  const [handsFree, setHandsFree] = useState(false);
  const [comeVa, setComeVa] = useState(null);     // {problem,cause,fix} mostrato senza IA
  const [endAt, setEndAt] = useState(null);       // C1: orario di fine ASSOLUTO (ms)
  const [nowMs, setNowMs] = useState(Date.now());
  const [expired, setExpired] = useState(false);
  const [diaryRating, setDiaryRating] = useState(0);
  const [diaryNote, setDiaryNote] = useState("");
  const [diarySaved, setDiarySaved] = useState(false);
  const wlRef = useRef(null);
  const recRef = useRef(null);
  const ttsOnRef = useRef(true);
  const idxRef = useRef(0);
  const beepRef = useRef(null);
  const isIOS = typeof navigator !== "undefined" && /iP(hone|ad|od)/.test(navigator.userAgent);
  useEffect(() => { ttsOnRef.current = ttsOn; }, [ttsOn]);
  useEffect(() => { idxRef.current = idx; }, [idx]);

  const remainingSec = endAt ? Math.max(0, Math.round((endAt - nowMs) / 1000)) : 0;
  const fmtRemain = () => `${Math.floor(remainingSec / 60)}:${String(remainingSec % 60).padStart(2, "0")}`;

  const playAlarm = useCallback(() => {
    try { if (navigator.vibrate) navigator.vibrate([400, 200, 400, 200, 400]); } catch { /* */ }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) {
        const ctx = beepRef.current || new AC(); beepRef.current = ctx;
        [0, 0.6, 1.2].forEach((t) => {
          const o = ctx.createOscillator(), g = ctx.createGain();
          o.frequency.value = 880; o.connect(g); g.connect(ctx.destination);
          g.gain.setValueAtTime(0.001, ctx.currentTime + t);
          g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + t + 0.05);
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.4);
          o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.42);
        });
      }
    } catch { /* */ }
  }, []);

  // C1: tick al secondo + ricalcolo alla riapertura schermo (usa orario assoluto, non un contatore).
  useEffect(() => {
    if (!endAt) return;
    const tick = () => {
      const t = Date.now(); setNowMs(t);
      if (t >= endAt) { setExpired(true); setEndAt(null); }
    };
    const id = setInterval(tick, 1000);
    const onVis = () => { if (document.visibilityState === "visible") tick(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", onVis); };
  }, [endAt]);
  useEffect(() => { if (expired) playAlarm(); }, [expired, playAlarm]);

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
      stopTTS();
      if (!ttsOnRef.current || !text) return;
      playTTSLong(text, { lang }); // V114: voce di Sitor (maschile), passo intero
    } catch { /* */ }
  }, [lang]);

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
      try { stopTTS(); } catch { /* */ }
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

  // C5: tastiera — frecce e barra spaziatrice per avanti/indietro nel corso.
  useEffect(() => {
    const onKey = (e) => {
      if (["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); go((c) => c + 1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); go((c) => c - 1); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  const doTimer = useCallback((mins) => {
    if (!mins || mins <= 0) { toast.info(tri("Nessun timer per questo passo.", "Kein Timer für diesen Schritt.", "No timer for this step.")); return; }
    const end = Date.now() + mins * 60000;
    setExpired(false); setEndAt(end); setNowMs(Date.now());
    try { localStorage.setItem(`mikilab_timer_${recipe.id}`, String(end)); } catch { /* */ }
    addTimer(course?.title || recipe.name || "Timer", mins);   // anche nella barra globale
    if (navigator.vibrate) navigator.vibrate(120);
    toast.success(tri(`Timer di ${mins} minuti avviato`, `Timer über ${mins} Minuten gestartet`, `${mins}-minute timer started`));
  }, [addTimer, course, recipe, tri]);

  // C1: ripristina un timer ancora attivo salvato nel dispositivo (dopo blocco schermo / ricarica).
  useEffect(() => {
    try {
      const saved = Number(localStorage.getItem(`mikilab_timer_${recipe.id}`) || 0);
      if (saved && saved > Date.now()) { setEndAt(saved); setNowMs(Date.now()); }
    } catch { /* */ }
  }, [recipe.id]);

  // C4: apre "Chiedi a Sitor" con il contesto della fase (senza salvare nulla).
  const askSitor = useCallback((p) => {
    const ctx = p ? `${p.name}: ${p.signals || ""}`.trim() : (course?.title || recipe.name);
    window.dispatchEvent(new CustomEvent("mikilab-open-chat", { detail: { context: ctx } }));
    onClose();
  }, [course, recipe, onClose]);

  const handleTranscript = useCallback((said) => {
    const s = said.toLowerCase(); setHeard(said);
    const p = phases[idxRef.current];
    const m = s.match(/(\d{1,3})\s*(min|minut|minute|minuten)/);
    if (m) { doTimer(parseInt(m[1], 10)); return; }
    if (/\b(stop|ferma|halt)\b/.test(s)) { try { stopTTS(); } catch { /* */ } return; }
    if (/\b(avanti|prossim|weiter|next)\b/.test(s)) { go((c) => c + 1); return; }
    if (/\b(indietro|precedente|zur[üu]ck|back)\b/.test(s)) { go((c) => c - 1); return; }
    if (/\b(ripeti|wiederhol|repeat)\b/.test(s)) { speak(phaseText(p)); return; }
    if (/(quanto manca|wie lange|how long|time left)/.test(s)) {
      speak(endAt ? tri(`Mancano ${fmtRemain()}`, `Noch ${fmtRemain()}`, `${fmtRemain()} left`) : tri("Nessun timer attivo", "Kein Timer aktiv", "No timer running")); return;
    }
    // C3: "appiccicoso" / "non cresce" / "aiuto" → causa+rimedio dal corso, SENZA IA
    const ts = course?.troubleshooting || [];
    const findTs = (re) => ts.find((t) => re.test(`${t.problem} ${t.cause}`.toLowerCase()));
    if (/(appiccicos|klebrig|sticky)/.test(s)) { const t = findTs(/appiccicos|klebrig|sticky|idrataz|water/); if (t) { setComeVa(t); speak(`${t.cause}. ${t.fix}`); return; } }
    if (/(non cresce|non lievita|geht nicht auf|not rising|won.?t rise)/.test(s)) { const t = findTs(/cresc|lievit|aufge|geht|rise|proof/); if (t) { setComeVa(t); speak(`${t.cause}. ${t.fix}`); return; } }
    if (/\b(aiuto|hilfe|help)\b/.test(s)) { if (ts[0]) { setComeVa(ts[0]); speak(`${ts[0].cause}. ${ts[0].fix}`); } else { askSitor(p); } return; }
    if (/\b(timer)\b/.test(s)) { doTimer(p?.timer_min || 0); return; }
    if (/\b(chiudi|schlie|close|esci|exit)\b/.test(s)) { onClose(); return; }
  }, [go, speak, phaseText, phases, doTimer, onClose, course, endAt, askSitor, tri]); // eslint-disable-line

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

  // C3: attiva la modalità mani libere (schermo acceso, voce, tocco = avanti, comandi vocali).
  const toggleHandsFree = useCallback(() => {
    setHandsFree((v) => {
      const nv = !v;
      if (nv) {
        setTtsOn(true); ttsOnRef.current = true;
        acquireWake();
        speak(phaseText(phases[idxRef.current]));
        if (!micOn) startMic();
        toast.success(tri("Mani libere attive: tocca lo schermo per andare avanti.", "Freihändig aktiv: tippe zum Weitergehen.", "Hands-free on: tap the screen to go next."));
      } else {
        stopMic();
      }
      return nv;
    });
  }, [acquireWake, speak, phaseText, phases, micOn, startMic, stopMic, tri]);

  const openTechnique = (slug) => { window.dispatchEvent(new CustomEvent("mikilab-open-technique", { detail: { slug } })); onClose(); };

  return createPortal((
    <div data-testid="course-player" data-mk-overlay="1" style={{ pointerEvents: "auto" }} className="fixed inset-0 z-[95] bg-background text-foreground flex flex-col">
      <div className="flex items-center justify-between px-5 pt-5 pb-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <ChefHat className="w-5 h-5 shrink-0 text-muted-foreground" />
          <p className="font-display font-bold truncate">{tri("Cucina con Sitor", "Koch mit Sitor", "Cook with Sitor")}</p>
          <SitorBadge size={18} variant="avatar" className="shrink-0" />
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-foreground/20 overflow-hidden text-[11px] font-bold">
            <button data-testid="course-mode-casa" onClick={() => { setMode("casa"); localStorage.setItem(MODE_KEY, "casa"); }} className={`px-2.5 py-1 ${mode === "casa" ? "bg-muted text-foreground" : "text-foreground/70"}`}>{tri("Casa", "Zu Hause", "Home")}</button>
            <button data-testid="course-mode-esperto" onClick={() => { setMode("esperto"); localStorage.setItem(MODE_KEY, "esperto"); }} className={`px-2.5 py-1 ${mode === "esperto" ? "bg-muted text-foreground" : "text-foreground/70"}`}>{tri("Esperto", "Experte", "Expert")}</button>
          </div>
          <button data-testid="course-close" onClick={onClose} className="p-2 rounded-full bg-foreground/15 active:scale-90"><X className="w-5 h-5" /></button>
        </div>
      </div>

      {loading && <div className="flex-1 flex items-center justify-center text-foreground/60">{tri("Sitor sta preparando il corso…", "Sitor bereitet den Kurs vor…", "Sitor is preparing the course…")}</div>}
      {!loading && err && <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-foreground/70">{err === "course_daily_cap" ? tri("Oggi Sitor ha già preparato molti corsi nuovi. Riprova domani.", "Sitor hat heute schon viele neue Kurse erstellt. Versuch es morgen.", "Sitor already prepared many new courses today. Try again tomorrow.") : tri("Corso non disponibile al momento.", "Kurs momentan nicht verfügbar.", "Course not available right now.")}</p>
        <button onClick={onClose} className="bg-muted px-5 py-2.5 rounded-2xl font-semibold">{tri("Chiudi", "Schließen", "Close")}</button>
      </div>}

      {!loading && course && (
        <>
          <div className="px-5 shrink-0">
            <div className="flex items-center gap-1">{Array.from({ length: total }).map((_, i) => <div key={i} className={`h-1 flex-1 rounded-full ${i <= idx ? "bg-primary" : "bg-foreground/15"}`} />)}</div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-foreground/60 text-xs" data-testid="course-counter">{isFinal ? tri("Fine", "Ende", "End") : `${tri("Passo", "Schritt", "Step")} ${idx + 1}/${phases.length}`}</p>
              <span data-testid="course-verified-label" className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${data.verified ? "bg-accent/30 text-accent-foreground" : "bg-foreground/10 text-foreground/70"}`}>
                {data.verified ? tri("Verificato da Michele ✓", "Von Michele geprüft ✓", "Verified by Michele ✓") : tri("Bozza di Sitor: verifica sempre segnali e temperature", "Sitor-Entwurf: prüfe immer Zeichen und Temperaturen", "Sitor draft: always check signals and temperatures")}
              </span>
              {isAdmin && (
                <button data-testid="course-verify-toggle" onClick={async () => {
                  try {
                    const r = await api.put(`/recipes/${recipe.id}/course-v2?lang=${lang}`, { verified: !data.verified });
                    setData((d) => ({ ...d, verified: r.data.verified }));
                    toast.success(r.data.verified ? tri("Corso verificato", "Kurs geprüft", "Course verified") : tri("Corso segnato come bozza", "Kurs als Entwurf", "Course set as draft"));
                  } catch { toast.error(tri("Errore", "Fehler", "Error")); }
                }} className={`text-[10px] font-bold px-2 py-0.5 rounded-full border active:scale-95 transition-all ${data.verified ? "border-mattone/50 text-mattone" : "border-accent/50 text-accent"}`}>
                  {data.verified ? tri("Rimuovi verifica", "Prüfung entfernen", "Unverify") : tri("Verifica ✓", "Prüfen ✓", "Verify ✓")}
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4" onClick={() => { if (handsFree && !isFinal) go((c) => c + 1); }}>
            {expired && (
              <div data-testid="timer-expired-banner" className="max-w-xl mx-auto mb-4 rounded-2xl bg-mattone text-white p-5 text-center" onClick={(e) => e.stopPropagation()}>
                <p className="font-display text-3xl font-black mb-1">{tri("Tempo scaduto!", "Zeit abgelaufen!", "Time's up!")}</p>
                <p className="text-white/85 text-sm mb-3">{tri("Il timer è finito.", "Der Timer ist zu Ende.", "The timer has ended.")}</p>
                <button data-testid="timer-expired-next" onClick={() => { setExpired(false); go((c) => c + 1); }} className="w-full bg-white text-mattone font-bold py-3 rounded-xl active:scale-95">{tri("Vai al prossimo passo", "Zum nächsten Schritt", "Go to next step")}</button>
              </div>
            )}
            {endAt && !expired && (
              <div className="max-w-xl mx-auto mb-4 text-center" onClick={(e) => e.stopPropagation()}>
                <p data-testid="timer-remaining" className="font-display text-4xl font-black text-primary tabular-nums">{fmtRemain()}</p>
                <p className="text-foreground/50 text-xs mt-1">{tri("Tieni lo schermo acceso o usa il promemoria del calendario", "Lass den Bildschirm an oder nutze die Kalender-Erinnerung", "Keep the screen on or use the calendar reminder")}</p>
              </div>
            )}
            {!isFinal && cur && (
              <div className="max-w-xl mx-auto space-y-4">
                <h2 data-testid="course-phase-name" className="font-display text-[26px] leading-tight font-bold text-muted-foreground">{cur.name}</h2>
                <p data-testid="course-phase-do" className={`leading-relaxed ${handsFree ? "text-[30px] font-semibold" : "text-[19px]"}`}>{mode === "esperto" && cur.do_esperto ? cur.do_esperto : cur.do_casa}</p>
                {cur.why && <p className="text-foreground/75 text-[15px]"><span className="font-bold text-accent">{tri("Perché", "Warum", "Why")}:</span> {cur.why}</p>}
                {cur.signals && <div className="rounded-xl bg-foreground/6 p-3 text-[15px]"><span className="font-bold text-muted-foreground">{tri("Segnali", "Zeichen", "Signals")}:</span> {cur.signals}</div>}
                {(cur.time_min || cur.time_max) ? <p className="text-foreground/60 text-sm">⏱ {tri("Tempo", "Zeit", "Time")}: {cur.time_min || "?"}{cur.time_max ? `–${cur.time_max}` : ""} min</p> : null}
                {cur.safety && <p className="flex items-start gap-2 text-foreground text-sm bg-muted/25 rounded-xl p-3"><AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />{cur.safety}</p>}
                {cur.technique && <button data-testid="course-technique-link" onClick={(e) => { e.stopPropagation(); openTechnique(cur.technique); }} className="inline-flex items-center gap-1.5 text-muted-foreground font-bold text-sm underline underline-offset-2"><Eye className="w-4 h-4" />{tri("Guarda come si fa", "Sieh, wie es geht", "See how it's done")}</button>}

                {/* C4: "Come va?" a tocchi — causa+rimedio SENZA IA, dal troubleshooting del corso */}
                {(course?.troubleshooting?.length > 0) && (
                  <div className="pt-1" onClick={(e) => e.stopPropagation()}>
                    <p className="text-[11px] font-black uppercase tracking-wide text-muted-foreground mb-1.5">{tri("Come va?", "Wie läuft's?", "How's it going?")}</p>
                    <div className="flex flex-wrap gap-2">
                      {course.troubleshooting.slice(0, 4).map((t, i) => (
                        <button key={i} data-testid={`come-va-${i}`} onClick={() => setComeVa(t)} className="px-3 py-1.5 rounded-full bg-foreground/10 text-foreground text-xs font-semibold active:scale-95">{t.problem}</button>
                      ))}
                      <button data-testid="come-va-ask-sitor" onClick={() => askSitor(cur)} className="px-3 py-1.5 rounded-full bg-accent/20 text-accent-foreground text-xs font-bold active:scale-95 inline-flex items-center gap-1"><HelpCircle className="w-3.5 h-3.5" />{tri("Chiedi a Sitor", "Frag Sitor", "Ask Sitor")}</button>
                    </div>
                    {comeVa && (
                      <div data-testid="come-va-answer" className="mt-2 rounded-xl bg-foreground/6 p-3">
                        <p className="font-bold text-sm">{comeVa.problem}</p>
                        <p className="text-foreground/70 text-sm mt-0.5"><span className="text-muted-foreground font-semibold">{tri("Causa", "Ursache", "Cause")}:</span> {comeVa.cause}</p>
                        <p className="text-foreground/85 text-sm"><span className="text-accent font-semibold">{tri("Rimedio", "Lösung", "Fix")}:</span> {comeVa.fix}</p>
                        <button onClick={() => setComeVa(null)} className="text-xs text-muted-foreground underline mt-1">{tri("Chiudi", "Schließen", "Close")}</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            {isFinal && (
              <div className="max-w-xl mx-auto space-y-4" data-testid="course-final">
                {course.troubleshooting?.length > 0 && (<>
                  <h2 className="font-display text-[24px] font-bold text-muted-foreground">{tri("Se qualcosa va storto", "Wenn etwas schiefgeht", "If something goes wrong")}</h2>
                  {course.troubleshooting.map((t, i) => (
                    <div key={i} className="rounded-xl bg-foreground/6 p-3">
                      <p className="font-bold">{t.problem}</p>
                      <p className="text-foreground/70 text-sm mt-0.5"><span className="text-muted-foreground font-semibold">{tri("Causa", "Ursache", "Cause")}:</span> {t.cause}</p>
                      <p className="text-foreground/85 text-sm"><span className="text-accent font-semibold">{tri("Rimedio", "Lösung", "Fix")}:</span> {t.fix}</p>
                    </div>
                  ))}
                </>)}
                {course.storage && <div className="rounded-xl bg-foreground/6 p-3"><p className="font-bold text-accent">{tri("Conservazione", "Aufbewahrung", "Storage")}</p><p className="text-foreground/85 text-[15px] mt-1">{course.storage}</p></div>}

                {/* C6: Il mio forno */}
                <div data-testid="my-oven" className="rounded-xl border border-border p-3">
                  <p className="font-bold text-sm mb-2">{tri("Com'è venuto?", "Wie ist es geworden?", "How did it turn out?")}</p>
                  <div className="grid grid-cols-3 gap-2">
                    <button data-testid="oven-dark" onClick={() => { const n = bumpOvenAdj(-10); toast.success(tri(`Forno: ${n}°C`, `Ofen: ${n}°C`, `Oven: ${n}°C`)); }} className="py-2 rounded-lg bg-mattone/15 text-mattone text-xs font-bold active:scale-95">{tri("Troppo scuro", "Zu dunkel", "Too dark")}</button>
                    <button data-testid="oven-ok" onClick={() => toast.success(tri("Perfetto!", "Perfekt!", "Perfect!"))} className="py-2 rounded-lg bg-salvia/20 text-foreground text-xs font-bold active:scale-95">{tri("Giusto", "Genau richtig", "Just right")}</button>
                    <button data-testid="oven-raw" onClick={() => { const n = bumpOvenAdj(10); toast.success(tri(`Forno: +${n}°C`, `Ofen: +${n}°C`, `Oven: +${n}°C`)); }} className="py-2 rounded-lg bg-ambra/20 text-foreground text-xs font-bold active:scale-95">{tri("Ancora crudo", "Noch roh", "Still raw")}</button>
                  </div>
                  {getOvenAdj() !== 0 && <p className="text-foreground/60 text-xs mt-2">{tri("Con il tuo forno", "Mit deinem Ofen", "With your oven")}: {getOvenAdj() > 0 ? "+" : ""}{getOvenAdj()} °C</p>}
                  <div className="pt-2 mt-2 border-t border-border/40 flex flex-wrap gap-2"><PhotoDiag level={mode} compact /><Palato recipe={recipe.name} level={mode} compact /></div>
                </div>

                {/* D2: Diario — voto + nota */}
                <div data-testid="diary-add" className="rounded-xl border border-border p-3">
                  <p className="font-bold text-sm mb-2">{tri("Diario del mio pane", "Mein Brot-Tagebuch", "My bread diary")}</p>
                  <div className="flex gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button key={s} data-testid={`diary-star-${s}`} onClick={() => setDiaryRating(s)}><Star className={`w-6 h-6 ${s <= diaryRating ? "text-accent fill-accent" : "text-foreground/20"}`} /></button>
                    ))}
                  </div>
                  <textarea data-testid="diary-note" value={diaryNote} onChange={(e) => setDiaryNote(e.target.value)} rows={2} placeholder={tri("Una nota per la prossima volta…", "Eine Notiz fürs nächste Mal…", "A note for next time…")} className="w-full text-sm p-2 rounded-lg bg-background border border-border outline-none focus:border-accent resize-none" />
                  <button data-testid="diary-save" onClick={() => { if (!diaryRating && !diaryNote.trim()) return; addDiary({ recipe: recipe.name, rating: diaryRating, note: diaryNote.trim() }); setDiarySaved(true); toast.success(tri("Salvato nel diario", "Im Tagebuch gespeichert", "Saved to diary")); }} disabled={diarySaved} className="mt-2 w-full py-2 rounded-lg bg-accent text-accent-foreground text-sm font-bold active:scale-95 disabled:opacity-50">{diarySaved ? tri("Salvato ✓", "Gespeichert ✓", "Saved ✓") : tri("Salva nel diario", "Ins Tagebuch", "Save to diary")}</button>
                </div>

                <button onClick={onClose} className="w-full bg-muted py-4 rounded-2xl font-bold text-[17px] active:scale-95">{tri("Ho finito, grazie Sitor!", "Fertig, danke Sitor!", "Done, thanks Sitor!")}</button>
              </div>
            )}
          </div>

          {micOn && <p className="text-center text-foreground/50 text-xs px-5 pb-1">🎙️ {tri("Di': avanti · indietro · ripeti · timer · quanto manca · appiccicoso · non cresce · stop · chiudi", "Sag: weiter · zurück · wiederhole · Timer · wie lange · klebrig · geht nicht auf · stop · schließen", "Say: next · back · repeat · timer · how long · sticky · not rising · stop · close")}{heard ? ` — “${heard}”` : ""}</p>}
          {handsFree && isIOS && <p className="text-center text-foreground/50 text-[11px] px-5 pb-1">{tri("Il riconoscimento vocale su iPhone può essere meno preciso: usa il tocco.", "Spracherkennung auf dem iPhone kann ungenauer sein: nutze das Tippen.", "Voice recognition on iPhone can be less accurate: use tap.")}</p>}

          <div className="p-4 shrink-0 space-y-2" style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}>
            {!isFinal && (
              <button data-testid="course-handsfree" onClick={toggleHandsFree} className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm active:scale-95 ${handsFree ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground"}`}>
                <Hand className="w-5 h-5" />{handsFree ? tri("Esci da mani libere", "Freihändig beenden", "Exit hands-free") : tri("Ora mi sporco le mani", "Jetzt mach ich mir die Hände schmutzig", "Now I get my hands dirty")}
              </button>
            )}
            <div className="grid grid-cols-3 gap-2">
              <button data-testid="course-prev" onClick={() => go((c) => c - 1)} disabled={idx === 0} className="flex flex-col items-center gap-1 rounded-2xl bg-foreground/12 disabled:opacity-40 active:scale-95 font-bold text-sm" style={{ minHeight: 56 }}><SkipBack className="w-5 h-5" />{tri("Indietro", "Zurück", "Back")}</button>
              <button data-testid="course-timer" onClick={() => doTimer(cur?.timer_min || 0)} className="flex flex-col items-center gap-1 rounded-2xl bg-muted text-foreground active:scale-95 font-bold text-sm" style={{ minHeight: 56 }}><TimerIcon className="w-5 h-5" />{cur?.timer_min ? `${cur.timer_min}m` : "Timer"}</button>
              <button data-testid="course-next" onClick={() => go((c) => c + 1)} disabled={idx >= total - 1} className="flex flex-col items-center gap-1 rounded-2xl bg-foreground/12 disabled:opacity-40 active:scale-95 font-bold text-sm" style={{ minHeight: 56 }}><SkipForward className="w-5 h-5" />{tri("Avanti", "Weiter", "Next")}</button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button data-testid="course-repeat" onClick={() => speak(phaseText(cur))} className="flex items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-foreground/12 active:scale-95 font-semibold text-sm"><RotateCcw className="w-4 h-4" />{tri("Ripeti", "Wiederh.", "Repeat")}</button>
              <button data-testid="course-tts" onClick={() => setTtsOn((v) => { const nv = !v; if (!nv) { try { stopTTS(); } catch { /* */ } } return nv; })} className={`flex items-center justify-center gap-1.5 py-2.5 rounded-2xl font-semibold text-sm active:scale-95 ${ttsOn ? "bg-card text-foreground" : "bg-foreground/12"}`}>{ttsOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}{tri("Voce", "Stimme", "Voice")}</button>
              <button data-testid="course-mic" onClick={() => (micOn ? stopMic() : startMic())} className={`flex items-center justify-center gap-1.5 py-2.5 rounded-2xl font-semibold text-sm active:scale-95 ${micOn ? "bg-accent text-white animate-pulse" : "bg-foreground/12"}`}>{micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}{tri("Comandi", "Befehle", "Commands")}</button>
            </div>
            <p className="text-center text-foreground/40 text-[10px]">{tri("Voce sintetica del tuo dispositivo.", "Synthetische Stimme deines Geräts.", "Your device's synthetic voice.")}</p>
          </div>
        </>
      )}
    </div>
  ), document.body);
}
