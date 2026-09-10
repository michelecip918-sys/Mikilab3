import { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, ChevronLeft, ChevronRight, RotateCcw, Check, RefreshCw, ListChecks, Volume2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { floorPlanApi } from "@/lib/api";
import { parsePlanSteps } from "@/lib/planSteps";
import { playTTS, stopTTS, toBCP47 } from "@/lib/tts";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

const PUB = process.env.PUBLIC_URL;
const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

// Parole chiave multilingue per i comandi vocali a mani libere.
const CMD = {
  next: ["avanti", "prossimo", "prossima", "next", "weiter", "siguiente", "suivant", "fatto", "fatta", "done", "fertig", "hecho", "termin", "erledigt", "ok fatto", "بعدی", "انجام شد"],
  prev: ["indietro", "precedente", "back", "zuruck", "zurück", "atras", "atrás", "anterior", "precedent", "précédent", "قبلی"],
  repeat: ["ripeti", "ripetere", "di nuovo", "repeat", "again", "wiederhol", "nochmal", "repite", "repetir", "repete", "répète", "تکرار", "دوباره"],
  stop: ["stop", "basta", "ferma", "fermati", "pausa", "halt", "silenzio", "zitto", "alto", "arret", "arrêt", "توقف"],
};

export default function MamoAssistant() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [doc, setDoc] = useState(undefined); // undefined=loading, null=nessun piano
  const [steps, setSteps] = useState([]);
  const [idx, setIdx] = useState(0);
  const [guiding, setGuiding] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [done, setDone] = useState(false);
  const [offline, setOffline] = useState(() => (typeof navigator !== "undefined" ? !navigator.onLine : false));
  useEffect(() => {
    const on = () => setOffline(false); const off = () => setOffline(true);
    window.addEventListener("online", on); window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);
  const recRef = useRef(null);
  const guidingRef = useRef(false);
  const idxRef = useRef(0);
  useEffect(() => { idxRef.current = idx; }, [idx]);
  useEffect(() => { guidingRef.current = guiding; }, [guiding]);

  const load = useCallback(async () => {
    // Ruolo dell'operatore (Sitor): mostra solo i task della sua postazione.
    const role = (() => { try { return (localStorage.getItem("mikilab_role") || "").toLowerCase(); } catch { return ""; } })();
    const roleKeywords = (r) => {
      if (/impast|knead/.test(r)) return ["impast", "knead", "mixing", "amasad", "pétriss", "puntatura", "bulk", "stockgare", "pointage", "reposo en bloque"];
      if (/forna|forno|bak/.test(r)) return ["cottur", "bak", "cocc", "cuisson", "forno", "oven", "ofen", "sforn"];
      if (/pizza|teglie/.test(r)) return ["pizza", "teglie", "formatur", "shaping", "façonn", "form"];
      if (/pasticc|dolc|abbatt|raffred/.test(r)) return ["dolc", "pasticc", "abbatt", "raffred", "laminaz", "sfogliat", "lievitaz", "proof", "fermentaz", "façonn"];
      if (/fermentaz|lievit|laugen/.test(r)) return ["lievitaz", "ferment", "proof", "gare", "apprêt", "laugen"];
      if (/consegn|lieferung/.test(r)) return ["consegn", "lieferung", "deliver", "pronto", "ready", "livraison"];
      return []; // ruoli generali (apprendista, banconista…) → vede tutto
    };
    const filterByRole = (steps) => {
      const kw = roleKeywords(role);
      if (!kw.length) return steps;
      const f = steps.filter((s) => kw.some((k) => s.toLowerCase().includes(k)));
      return f.length ? f : steps; // se nessun task del ruolo, mostra tutto (fallback)
    };
    try {
      const d = await floorPlanApi.get();
      try { localStorage.setItem("mikilab_floorplan_cache", JSON.stringify(d || null)); } catch { /* */ }
      setDoc(d || null);
      setSteps(filterByRole(parsePlanSteps(d && d.plan)));
      setIdx(0);
      setDone(false);
    } catch {
      // OFFLINE: usa l'ultima coda salvata in locale
      let cached = null;
      try { cached = JSON.parse(localStorage.getItem("mikilab_floorplan_cache") || "null"); } catch { /* */ }
      setDoc(cached || null);
      setSteps(cached ? filterByRole(parsePlanSteps(cached.plan)) : []);
      setIdx(0);
      setDone(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const h = () => load();
    window.addEventListener("mikilab-floor-plan-updated", h);
    return () => window.removeEventListener("mikilab-floor-plan-updated", h);
  }, [load]);

  const speak = useCallback((text) => {
    if (!text) return;
    playTTS(text, { lang, voice: "mikemix", onStart: () => setSpeaking(true), onEnded: () => setSpeaking(false) });
  }, [lang]);

  // Regola voce reparto: gli operatori ricevono SOLO comandi brevi (1 frase, max ~14 parole).
  const floorShort = (t) => {
    if (!t) return t;
    const first = String(t).split(/(?<=[.!?])\s/)[0];
    const words = first.split(/\s+/);
    return words.length > 14 ? words.slice(0, 14).join(" ") + "…" : first;
  };

  const speakStep = useCallback((i) => {
    const s = steps[i];
    if (!s) return;
    const prefix = tri(`Passo ${i + 1} di ${steps.length}. `, `Schritt ${i + 1} von ${steps.length}. `, `Step ${i + 1} of ${steps.length}. `, `Paso ${i + 1} de ${steps.length}. `, `Étape ${i + 1} sur ${steps.length}. `, `گام ${i + 1} از ${steps.length}. `);
    speak(prefix + floorShort(s));
  }, [steps, speak, tri]);

  const goNext = useCallback(() => {
    const cur = idxRef.current;
    if (cur >= steps.length - 1) {
      setDone(true);
      speak(tri("Piano completato. Ottimo lavoro, squadra!", "Plan abgeschlossen. Gute Arbeit, Team!", "Plan complete. Great work, team!", "Plan completado. ¡Buen trabajo, equipo!", "Plan terminé. Beau travail, l'équipe !", "برنامه کامل شد. آفرین تیم!"));
      return;
    }
    const ni = cur + 1;
    setIdx(ni);
    speakStep(ni);
  }, [steps.length, speakStep, speak, tri]);

  const goPrev = useCallback(() => {
    const cur = idxRef.current;
    const ni = Math.max(0, cur - 1);
    setIdx(ni);
    setDone(false);
    speakStep(ni);
  }, [speakStep]);

  const repeat = useCallback(() => speakStep(idxRef.current), [speakStep]);

  // ---- Riconoscimento vocale continuo (a mani libere) ----
  const buildRec = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return null;
    const rec = new SR();
    rec.lang = toBCP47(lang);
    rec.continuous = true;
    rec.interimResults = false;
    rec._stop = false;
    rec.onresult = (e) => {
      const last = e.results[e.results.length - 1];
      if (!last || !last.isFinal) return;
      const t = norm(last[0].transcript);
      if (CMD.stop.some((k) => t.includes(k))) { stopTTS(); setSpeaking(false); return; }
      if (CMD.repeat.some((k) => t.includes(k))) { repeat(); return; }
      if (CMD.prev.some((k) => t.includes(k))) { goPrev(); return; }
      if (CMD.next.some((k) => t.includes(k))) { goNext(); return; }
    };
    rec.onend = () => { if (!rec._stop && guidingRef.current) { try { rec.start(); } catch { /* */ } } };
    rec.onerror = (ev) => {
      if (ev && ev.error === "not-allowed") {
        setGuiding(false); guidingRef.current = false; rec._stop = true;
        toast.error(tri("Permesso microfono negato.", "Mikrofon verweigert.", "Mic denied.", "Micrófono denegado.", "Micro refusé.", "میکروفون رد شد."));
      }
    };
    return rec;
  }, [lang, goNext, goPrev, repeat, tri]);

  const startGuide = useCallback(async () => {
    if (!steps.length) return;
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try { const st = await navigator.mediaDevices.getUserMedia({ audio: true }); st.getTracks().forEach((x) => x.stop()); }
      catch { toast.error(tri("Permesso microfono negato. Abilitalo per la guida a voce.", "Mikrofon-Zugriff verweigert.", "Microphone permission denied.", "Permiso de micrófono denegado.", "Micro refusé.", "اجازه میکروفون رد شد.")); return; }
    }
    setGuiding(true); guidingRef.current = true;
    const rec = buildRec();
    if (rec) { recRef.current = rec; try { rec.start(); } catch { /* */ } }
    toast.success(tri("Guida vocale attiva. Di' «avanti», «indietro», «ripeti».", "Sprachführung aktiv. Sag «weiter», «zurück», «nochmal».", "Voice guide on. Say «next», «back», «repeat».", "Guía por voz activa. Di «siguiente», «atrás», «repite».", "Guide vocal actif. Dis «suivant», «précédent», «répète».", "راهنمای صوتی فعال شد. بگو «بعدی»، «قبلی»، «تکرار»."));
    speakStep(idxRef.current);
  }, [steps.length, buildRec, speakStep, tri]);

  const stopGuide = useCallback(() => {
    setGuiding(false); guidingRef.current = false;
    stopTTS(); setSpeaking(false);
    try { if (recRef.current) { recRef.current._stop = true; recRef.current.stop(); } } catch { /* */ }
  }, []);

  useEffect(() => () => { try { if (recRef.current) { recRef.current._stop = true; recRef.current.stop(); } } catch { /* */ } stopTTS(); }, []);

  // CUFFIA VOCALE: appena arriva la coda del Capo (e c'è un ruolo/postazione), attiva UNA volta
  // l'ascolto continuo a mani libere così l'operaio riceve i task senza toccare lo schermo.
  const autoStartedRef = useRef(false);
  useEffect(() => {
    if (!autoStartedRef.current && steps.length > 0 && !guiding && !done) {
      autoStartedRef.current = true;
      startGuide();
    }
  }, [steps.length, guiding, done, startGuide]);

  if (doc === undefined) {
    return (
      <div data-testid="mamo-loading" className="p-6 rounded-xl bg-[#0b0f19] border border-[#1e293b] flex items-center justify-center gap-2 text-[#94A3B8] text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> {tri("Carico il piano del Capo…", "Lade den Plan des Chefs…", "Loading the Capo's plan…", "Cargando el plan del Capo…", "Chargement du plan du Capo…", "در حال بارگذاری برنامه…")}
      </div>
    );
  }

  return (
    <div data-testid="mamo-assistant" className="rounded-2xl bg-[#0b0f19] border border-amber-500/30 shadow-xl overflow-hidden">
      {/* Header Mamo */}
      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-amber-500/10 to-transparent border-b border-[#1e293b]">
        <img src={`${PUB}/avatar_nexus.jpg`} alt="Mamo" className="w-11 h-11 rounded-xl object-cover object-top border border-amber-500/60" onError={(e) => { e.currentTarget.style.display = "none"; }} />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-extrabold text-amber-400 flex items-center gap-2">
            {tri("Assistente Mamo", "Assistent Mamo", "Mamo Assistant", "Asistente Mamo", "Assistant Mamo", "دستیار مامو")}
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 uppercase tracking-wider">{tri("A mani libere", "Freihändig", "Hands-free", "Manos libres", "Mains libres", "بدون دست")}</span>
            {offline && <span data-testid="mamo-offline-chip" className="text-[9px] px-2 py-0.5 rounded-full bg-amber-600/25 text-amber-300 border border-amber-500/50 uppercase tracking-wider">📴 {tri("Dati locali", "Lokale Daten", "Local data", "Datos locales", "Données locales", "داده محلی")}</span>}
          </h3>
          <p className="text-[11px] text-[#94A3B8]">{tri("Ti guido passo-passo nel piano del Capo, con la voce.", "Ich führe dich per Stimme Schritt für Schritt durch den Plan.", "I guide you step-by-step through the Capo's plan, by voice.", "Te guío paso a paso en el plan del Capo, con la voz.", "Je te guide pas à pas dans le plan, à la voix.", "قدم‌به‌قدم با صدا راهنمایی‌ات می‌کنم.")}</p>
        </div>
        <button data-testid="mamo-refresh" onClick={load} title={tri("Aggiorna piano", "Aktualisieren", "Refresh plan", "Actualizar", "Actualiser", "بازخوانی")} className="w-9 h-9 rounded-lg bg-[#030712] border border-[#1e293b] text-[#94A3B8] hover:text-amber-400 hover:border-amber-500/40 flex items-center justify-center active:scale-95 transition-all shrink-0">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {!steps.length ? (
        <div data-testid="mamo-empty" className="p-6 text-center">
          <ListChecks className="w-10 h-10 text-[#334155] mx-auto mb-3" />
          <p className="text-sm text-white font-bold">{tri("Nessun piano dal Capo, per ora.", "Noch kein Plan vom Chef.", "No plan from the Capo yet.", "Aún no hay plan del Capo.", "Pas encore de plan du Capo.", "هنوز برنامه‌ای از کاپو نیست.")}</p>
          <p className="text-xs text-[#94A3B8] mt-1">{tri("Quando il Capo invia la produzione dalla Lab Control, la trovi qui e te la leggo a voce.", "Sobald der Chef die Produktion aus der Lab Control sendet, erscheint sie hier.", "When the Capo sends production from Lab Control, it appears here and I read it aloud.", "Cuando el Capo envíe la producción desde Lab Control, aparecerá aquí.", "Quand le Capo envoie la production depuis Lab Control, elle apparaît ici.", "وقتی کاپو تولید را بفرستد، اینجا ظاهر می‌شود.")}</p>
        </div>
      ) : (
        <div className="p-4 space-y-4">
          {/* Info invio */}
          {doc && doc.pushed_by && (
            <div className="flex items-center justify-between text-[10px] text-[#64748B]">
              <span data-testid="mamo-pushed-by">{tri("Inviato dal Capo", "Vom Chef gesendet", "Sent by the Capo", "Enviado por el Capo", "Envoyé par le Capo", "ارسال‌شده توسط کاپو")}: <span className="text-amber-400 font-bold">{doc.pushed_by}</span></span>
              <span>{steps.length} {tri("passi", "Schritte", "steps", "pasos", "étapes", "گام")}</span>
            </div>
          )}

          {/* Passo corrente */}
          <div data-testid="mamo-current-step" className={`relative rounded-xl border p-5 ${done ? "border-emerald-500/50 bg-emerald-500/5" : "border-amber-500/40 bg-[#030712]"}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                {done ? tri("Completato", "Fertig", "Complete", "Completado", "Terminé", "کامل") : tri(`Passo ${idx + 1} / ${steps.length}`, `Schritt ${idx + 1} / ${steps.length}`, `Step ${idx + 1} / ${steps.length}`, `Paso ${idx + 1} / ${steps.length}`, `Étape ${idx + 1} / ${steps.length}`, `گام ${idx + 1} / ${steps.length}`)}
              </span>
              {(speaking || guiding) && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400">
                  {speaking ? <Volume2 className="w-3.5 h-3.5 animate-pulse" /> : <Mic className="w-3.5 h-3.5" />}
                  {speaking ? tri("Sto leggendo", "Lese vor", "Reading", "Leyendo", "Lecture", "در حال خواندن") : tri("Ti ascolto", "Ich höre", "Listening", "Escuchando", "J'écoute", "گوش می‌دهم")}
                </span>
              )}
            </div>
            <p data-testid="mamo-step-text" className={`text-lg font-bold leading-snug ${done ? "text-emerald-300" : "text-white"}`}>
              {done ? tri("Hai finito tutti i passi. Ottimo lavoro! 👏", "Alle Schritte erledigt. Super Arbeit! 👏", "All steps done. Great job! 👏", "Todos los pasos hechos. ¡Buen trabajo! 👏", "Toutes les étapes faites. Beau travail ! 👏", "همه گام‌ها انجام شد. عالی! 👏") : steps[idx]}
            </p>
            {/* Progress bar */}
            <div className="mt-4 h-1.5 rounded-full bg-[#1e293b] overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-300" style={{ width: `${done ? 100 : Math.round(((idx + 1) / steps.length) * 100)}%` }} />
            </div>
          </div>

          {/* Comandi */}
          <div className="grid grid-cols-4 gap-2">
            <button data-testid="mamo-prev" onClick={goPrev} disabled={idx === 0 && !done} className="flex flex-col items-center gap-1 py-3 rounded-xl bg-[#030712] border border-[#1e293b] text-[#94A3B8] hover:text-white hover:border-amber-500/40 disabled:opacity-40 active:scale-95 transition-all">
              <ChevronLeft className="w-5 h-5" /><span className="text-[10px] font-bold">{tri("Indietro", "Zurück", "Back", "Atrás", "Précéd.", "قبلی")}</span>
            </button>
            <button data-testid="mamo-repeat" onClick={repeat} className="flex flex-col items-center gap-1 py-3 rounded-xl bg-[#030712] border border-[#1e293b] text-[#94A3B8] hover:text-white hover:border-amber-500/40 active:scale-95 transition-all">
              <RotateCcw className="w-5 h-5" /><span className="text-[10px] font-bold">{tri("Ripeti", "Nochmal", "Repeat", "Repite", "Répète", "تکرار")}</span>
            </button>
            <button data-testid="mamo-listen" onClick={repeat} className="flex flex-col items-center gap-1 py-3 rounded-xl bg-[#030712] border border-[#1e293b] text-amber-400 hover:border-amber-500/40 active:scale-95 transition-all">
              <Volume2 className="w-5 h-5" /><span className="text-[10px] font-bold">{tri("Ascolta", "Hören", "Listen", "Escuchar", "Écouter", "بشنو")}</span>
            </button>
            <button data-testid="mamo-next" onClick={goNext} disabled={done} className="flex flex-col items-center gap-1 py-3 rounded-xl bg-gradient-to-b from-amber-500 to-amber-600 text-[#030712] font-bold disabled:opacity-40 active:scale-95 transition-all">
              {idx >= steps.length - 1 ? <Check className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              <span className="text-[10px] font-bold">{idx >= steps.length - 1 ? tri("Fine", "Ende", "Finish", "Fin", "Fin", "پایان") : tri("Fatto", "Fertig", "Done", "Hecho", "Fait", "انجام شد")}</span>
            </button>
          </div>

          {/* Guida vocale a mani libere */}
          {guiding ? (
            <button data-testid="mamo-stop-guide" onClick={stopGuide} className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-[#030712] border border-red-500/40 text-red-400 font-bold text-sm active:scale-95 transition-all">
              <MicOff className="w-4 h-4" /> {tri("Ferma guida vocale", "Sprachführung stoppen", "Stop voice guide", "Detener guía por voz", "Arrêter le guide vocal", "توقف راهنمای صوتی")}
            </button>
          ) : (
            <button data-testid="mamo-start-guide" onClick={startGuide} className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-[#030712] font-black text-sm shadow-lg shadow-amber-500/20 active:scale-95 transition-all">
              <Mic className="w-4 h-4" /> {tri("Avvia guida vocale", "Sprachführung starten", "Start voice guide", "Iniciar guía por voz", "Démarrer le guide vocal", "شروع راهنمای صوتی")}
            </button>
          )}
          <p className="text-[10px] text-[#64748B] text-center">{tri("Comandi: «avanti», «indietro», «ripeti», «stop».", "Befehle: «weiter», «zurück», «nochmal», «stop».", "Commands: «next», «back», «repeat», «stop».", "Comandos: «siguiente», «atrás», «repite», «stop».", "Commandes : «suivant», «précédent», «répète», «stop».", "دستورها: «بعدی»، «قبلی»، «تکرار»، «توقف».")}</p>
        </div>
      )}
    </div>
  );
}
