import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Hand, Mic, MicOff, Volume2, RefreshCw, Trash2, Clock, ChefHat } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { useTimers, remainingOf } from "@/audio/TimerContext";
import { toast } from "sonner";
import { mkTri } from "@/i18n/triMaps";
import { recipesApi } from "@/lib/api";
import { recipeTitle } from "@/lib/loc";
import ProactiveAssistant from "@/components/ProactiveAssistant";
import { fetchWeeklyItems, todayKey, tomorrowKey, itemsForDay, dayLabel, summarizeDay } from "@/lib/weeklyPlan";
import { playTTS, stopTTS } from "@/lib/tts";
import { getCurrentOperator, zoneLabel } from "@/lib/brigata";

// Modalità "Mani Sporche": interfaccia XL a mani libere, comandi vocali,
// timer di lavorazione grandi. Pensata per usare l'app con le mani infarinate.

const fmt = (s) => {
  s = Math.max(0, Math.floor(s));
  const m = Math.floor(s / 60), sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

export default function ManiSporche() {
  const { lang } = useLang();
  const tri = (i, d, e, s) => mkTri(lang)(i, d, e, s);
  const voiceLang = mkTri(lang)("it-IT", "de-DE", "en-GB", "es-ES");
  const { timers, nowTs, addTimer, toggle, reset, remove } = useTimers();
  void nowTs;

  const [micOn, setMicOn] = useState(false);
  const [heard, setHeard] = useState("");
  const [clock, setClock] = useState(new Date());
  const [recipes, setRecipes] = useState([]);
  const [todayItems, setTodayItems] = useState([]);
  const [weeklyAll, setWeeklyAll] = useState([]);
  const [operator, setOperator] = useState(() => getCurrentOperator());
  useEffect(() => {
    const h = () => setOperator(getCurrentOperator());
    window.addEventListener("mikilab-operator", h);
    return () => window.removeEventListener("mikilab-operator", h);
  }, []);
  const [activeId, setActiveId] = useState(() => { try { return localStorage.getItem("mikilab_active_recipe") || ""; } catch { return ""; } });
  const recRef = useRef(null);
  const wlRef = useRef(null);

  // Carica le ricette (MikiLab + personali) per collegare i tempi delle fasi.
  useEffect(() => {
    (async () => {
      const [mk, pe] = await Promise.all([recipesApi.list("mikilab"), recipesApi.list("personal")]);
      const seen = new Set(); const all = [];
      for (const r of [...(pe || []), ...(mk || [])]) { const id = r.id || r.recipe_id; if (id && !seen.has(id)) { seen.add(id); all.push(r); } }
      setRecipes(all);
    })();
  }, []);

  // Auto-carica la produzione di OGGI dal Piano Settimanale attivo.
  useEffect(() => {
    (async () => {
      const items = await fetchWeeklyItems();
      setWeeklyAll(items);
      const today = itemsForDay(items, todayKey());
      setTodayItems(today);
      // Se non c'è già una ricetta attiva, seleziona il primo lotto di oggi.
      setActiveId((cur) => {
        if (cur) return cur;
        if (today[0]) { try { localStorage.setItem("mikilab_active_recipe", today[0].recipe_id); } catch { /* */ } return today[0].recipe_id; }
        return cur;
      });
    })();
  }, []);

  const activeRecipe = useMemo(() => recipes.find((r) => (r.id || r.recipe_id) === activeId) || null, [recipes, activeId]);
  const setActive = (id) => { setActiveId(id); try { id ? localStorage.setItem("mikilab_active_recipe", id) : localStorage.removeItem("mikilab_active_recipe"); } catch { /* */ } };

  // Se la ricetta salvata non esiste più nel catalogo, ripiega sul primo lotto di oggi.
  useEffect(() => {
    if (activeId && !activeRecipe && recipes.length && todayItems[0]) setActive(todayItems[0].recipe_id);
  }, [activeId, activeRecipe, recipes.length, todayItems]); // eslint-disable-line

  useEffect(() => { const id = setInterval(() => setClock(new Date()), 1000); return () => clearInterval(id); }, []);

  // In "Mani In Pasta" ho già un mic XL: nascondo il FAB Voce globale per evitare sovrapposizioni.
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("mikilab-fab", { detail: { hide: true } }));
    return () => window.dispatchEvent(new CustomEvent("mikilab-fab", { detail: { hide: false } }));
  }, []);

  // Wake Lock: tiene lo schermo acceso mentre lavori.
  useEffect(() => {
    const acquire = async () => { try { if ("wakeLock" in navigator) wlRef.current = await navigator.wakeLock.request("screen"); } catch { /* */ } };
    acquire();
    const onVis = () => { if (document.visibilityState === "visible") acquire(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      try { wlRef.current && wlRef.current.release(); } catch { /* */ }
      try { recRef.current && recRef.current.stop(); } catch { /* */ }
    };
  }, []);

  const speak = useCallback((text) => {
    try { const s = window.speechSynthesis; if (!s) return; const u = new SpeechSynthesisUtterance(text); u.lang = voiceLang; u.rate = 0.98; s.speak(u); } catch { /* */ }
  }, [voiceLang]);

  // Tempi delle fasi: se c'è una ricetta attiva, li derivo dai suoi parametri.
  const PRESETS = useMemo(() => {
    const r = activeRecipe;
    const hasP = !!(r && r.bulk_fermentation_hours), hasA = !!(r && r.proofing_hours), hasC = !!(r && r.bake_minutes);
    return [
      { key: "pieghe", label: tri("Pieghe", "Falten", "Folds", "Pliegues"), min: 30, repeat: true, fromRecipe: false },
      { key: "puntata", label: tri("Puntata", "Stockgare", "Bulk", "Fermentación"), min: hasP ? Math.round(r.bulk_fermentation_hours * 60) : 90, fromRecipe: hasP },
      { key: "appretto", label: tri("Appretto", "Stückgare", "Final proof", "Formado"), min: hasA ? Math.round(r.proofing_hours * 60) : 60, fromRecipe: hasA },
      { key: "cottura", label: tri("Cottura", "Backen", "Bake", "Cocción"), min: hasC ? Math.round(r.bake_minutes) : 40, fromRecipe: hasC },
    ];
  }, [activeRecipe, lang]); // eslint-disable-line

  const startPreset = (p) => { addTimer(p.label, p.min, p.repeat); speak(tri(`${p.label}, ${p.min} minuti`, `${p.label}, ${p.min} Minuten`, `${p.label}, ${p.min} minutes`, `${p.label}, ${p.min} minutos`)); };

  const handleTranscript = useCallback((said) => {
    const s = said.toLowerCase(); setHeard(said);
    // Piano Settimanale a voce (produzione di oggi/domani).
    if (/(produzion|programma|quanti impast|\blotti\b|cosa produ|production|\bplan\b|produkti|producci)/.test(s)) {
      const key = /(domani|tomorrow|morgen|mañana)/.test(s) ? tomorrowKey() : todayKey();
      const msg = summarizeDay(weeklyAll, key, lang);
      playTTS(msg, { lang, voice: "michele" }); toast.success("👨‍🍳 " + msg); return;
    }
    const mTimer = s.match(/(\d{1,3})\s*(min|minut|minute|minuten|minutos)/);
    if (mTimer) { const n = parseInt(mTimer[1], 10); addTimer(tri("Timer vocale", "Sprach-Timer", "Voice timer", "Temporizador"), n, false); speak(tri(`Timer di ${n} minuti`, `Timer über ${n} Minuten`, `${n} minute timer`, `${n} minutos`)); return; }
    for (const p of PRESETS) { if (s.includes(p.label.toLowerCase()) || (p.key === "pieghe" && /piegh|falt|fold/.test(s))) { startPreset(p); return; } }
    if (/\b(ferma|stop|halt|para|silenzio|basta)\b/.test(s)) { try { window.speechSynthesis.cancel(); } catch { /* */ } return; }
  }, [addTimer, tri]); // eslint-disable-line

  const startMic = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { toast.error(tri("Comandi vocali non supportati.", "Sprachbefehle nicht unterstützt.", "Voice commands not supported.", "Comandos de voz no compatibles.")); return; }
    stopTTS(); // barge-in: zittisci l'avatar quando parte il microfono
    try {
      const rec = new SR();
      rec.lang = voiceLang; rec.continuous = true; rec.interimResults = false;
      rec.onresult = (e) => { const r = e.results[e.results.length - 1]; if (r && r[0]) handleTranscript(r[0].transcript || ""); };
      rec.onerror = () => { /* */ };
      rec.onend = () => { if (recRef.current) { try { rec.start(); } catch { /* */ } } };
      recRef.current = rec; rec.start(); setMicOn(true);
    } catch { toast.error(tri("Microfono non disponibile.", "Mikrofon nicht verfügbar.", "Microphone not available.", "Micrófono no disponible.")); }
  };
  const stopMic = () => { const rec = recRef.current; recRef.current = null; try { rec && rec.stop(); } catch { /* */ } setMicOn(false); setHeard(""); };

  return (
    <div className="pb-52" data-testid="manisporche">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-11 h-11 rounded-2xl bg-[#c94f00] flex items-center justify-center"><Hand className="w-6 h-6 text-white" /></div>
        <div>
          <h1 className="font-display text-2xl font-bold text-[#2B303B] dark:text-[#e4eff8]">{tri("Mani In Pasta", "Hände im Teig", "Hands in the Dough", "Manos en la Masa")}</h1>
          <p className="text-sm text-[#7E8A93]">{tri("Tasti grandi e controllo vocale hands-free mentre impasti", "Große Tasten und freihändige Sprachsteuerung beim Kneten", "Big buttons and hands-free voice control while you knead", "Botones grandes y control por voz mientras amasas")}</p>
        </div>
      </div>

      {/* Orologio grande */}
      <div className="rounded-3xl bg-[#3a2415] text-white p-6 text-center mb-4">
        <p className="font-mono-data text-6xl font-bold tracking-tight" data-testid="manisporche-clock">{clock.toLocaleTimeString(mkTri(lang)("it-IT", "de-DE", "en-GB"), { hour: "2-digit", minute: "2-digit" })}</p>
        <p className="text-white/60 text-sm mt-1">{clock.toLocaleDateString(mkTri(lang)("it-IT", "de-DE", "en-GB"), { weekday: "long", day: "numeric", month: "long" })}</p>
      </div>

      {/* Operatore corrente */}
      <button data-testid="manisporche-operator" onClick={() => window.dispatchEvent(new Event("mikilab-open-guida"))}
        className="w-full flex items-center gap-2 mb-4 rounded-2xl bg-[#161616] border border-[#2e2e2e] px-3 py-2.5 active:scale-[0.99] transition-all">
        <span className="w-8 h-8 rounded-full bg-[#c94f00]/15 border border-[#c94f00]/40 flex items-center justify-center text-[#c94f00] font-bold text-sm shrink-0">
          {operator ? (operator.name || "?").charAt(0).toUpperCase() : "?"}
        </span>
        <span className="min-w-0 text-left flex-1">
          {operator ? (
            <>
              <span className="block text-sm font-bold text-[#e4eff8] truncate">{operator.name}{operator.zone ? <span className="text-[#7E8A93] font-normal"> · {zoneLabel(operator.zone, lang)}</span> : null}</span>
              <span className="block text-[11px] text-[#7E8A93]">{tri("Tocca per cambiare operatore", "Zum Wechseln tippen", "Tap to switch operator", "Toca para cambiar")}</span>
            </>
          ) : (
            <span className="block text-sm font-semibold text-[#c94f00]">{tri("Seleziona il tuo profilo", "Profil wählen", "Select your profile", "Selecciona tu perfil")}</span>
          )}
        </span>
      </button>

      {/* Produzione di OGGI dal Piano Settimanale */}
      {todayItems.length > 0 && (
        <div className="rounded-2xl bg-gradient-to-br from-[#c94f00]/15 to-[#3a2415]/40 border border-[#c94f00]/40 p-3 mb-4" data-testid="manisporche-today">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#c94f00] mb-2">
            <ChefHat className="w-4 h-4" /> {tri("Produzione di oggi", "Heutige Produktion", "Today's production", "Producción de hoy")} · {dayLabel(todayKey(), lang)}
          </p>
          <div className="flex flex-wrap gap-2">
            {todayItems.map((it) => {
              const on = activeId === it.recipe_id;
              return (
                <button key={it.id} data-testid={`manisporche-today-${it.recipe_id}`} onClick={() => setActive(it.recipe_id)}
                  className={`px-3 py-2 rounded-2xl shadow-md border border-amber-900/40 text-sm font-semibold border transition-all active:scale-95 ${on ? "bg-[#c94f00] text-white border-[#c94f00]" : "bg-white/5 text-[#e4eff8] border-[#c94f00]/30 hover:border-[#c94f00]"}`}>
                  {it.recipe_name} <span className="opacity-70">· {Math.round(it.pieces || 0)}×</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Ricetta attiva: collega i tempi delle fasi */}
      <div className="rounded-2xl bg-white dark:bg-[#1e1e1e] border border-[#2e2e2e] p-3 mb-4">
        <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#c94f00] mb-1.5">
          <ChefHat className="w-4 h-4" /> {tri("Ricetta attiva", "Aktives Rezept", "Active recipe", "Receta activa")}
        </label>
        <select data-testid="manisporche-recipe-select" value={activeId} onChange={(e) => setActive(e.target.value)}
          className="w-full rounded-2xl shadow-md border border-amber-900/40 bg-[#f5f5f5] dark:bg-[#151515] border border-[#2e2e2e] text-[#2B303B] dark:text-[#e4eff8] text-base font-semibold px-3 py-3">
          <option value="">{tri("Nessuna (tempi standard)", "Keins (Standardzeiten)", "None (standard times)", "Ninguna (tiempos estándar)")}</option>
          {recipes.map((r) => { const id = r.id || r.recipe_id; return <option key={id} value={id}>{recipeTitle(r, lang)}</option>; })}
        </select>
        {activeRecipe && (
          <p className="text-[12px] text-[#7E8A93] mt-1.5" data-testid="manisporche-recipe-hint">
            {tri("Tempi aggiornati da", "Zeiten aus", "Times from", "Tiempos de")} <span className="text-[#c94f00] font-semibold">{recipeTitle(activeRecipe, lang)}</span>
          </p>
        )}
      </div>

      {/* Motore proattivo DEMO (21 innovazioni always-on) */}
      <ProactiveAssistant />

      {/* Preset XL */}
      <p className="text-xs font-bold uppercase tracking-wide text-[#c94f00] mb-2">{tri("Avvia un timer", "Timer starten", "Start a timer", "Iniciar temporizador")}</p>
      <div className="grid grid-cols-2 gap-3 mb-4">
        {PRESETS.map((p) => (
          <button key={p.key} data-testid={`manisporche-preset-${p.key}`} onClick={() => startPreset(p)}
            className="relative flex flex-col items-center justify-center gap-1 py-7 rounded-3xl bg-white dark:bg-[#1e1e1e] border-2 border-[#2e2e2e] dark:border-[#2e2e2e] active:scale-95 hover:border-[#c94f00] transition-all">
            {p.repeat && <RefreshCw className="absolute top-3 right-3 w-4 h-4 text-[#c94f00]" />}
            <span className="font-display text-xl font-bold text-[#2B303B] dark:text-[#e4eff8]">{p.label}</span>
            <span className="font-mono-data text-base text-[#7E8A93]">{p.min}′</span>
            {activeRecipe && !p.fromRecipe && p.key !== "pieghe" && (
              <span className="text-[9px] font-bold uppercase tracking-wide text-[#7E8A93]/80">{tri("standard", "Standard", "standard", "estándar")}</span>
            )}
          </button>
        ))}
      </div>

      {/* Mic grande */}
      <button data-testid="manisporche-mic" onClick={() => (micOn ? stopMic() : startMic())}
        className={`w-full flex items-center justify-center gap-3 py-6 rounded-3xl font-display text-xl font-bold text-white active:scale-97 transition-all mb-2 ${micOn ? "bg-[#c94f00] animate-pulse" : "bg-[#c94f00]"}`}>
        {micOn ? <Mic className="w-7 h-7" /> : <MicOff className="w-7 h-7" />}
        {micOn ? tri("Ti ascolto…", "Ich höre…", "Listening…", "Escuchando…") : tri("Parla", "Sprich", "Speak", "Habla")}
      </button>
      {micOn && (
        <p className="text-center text-xs text-[#7E8A93] mb-4">
          <Volume2 className="w-3.5 h-3.5 inline mr-1" />{tri('Di\': "pieghe", "puntata", "appretto", "cottura", "timer 20 minuti", "ferma"', 'Sag: "falten", "Timer 20 Minuten", "stop"', 'Say: "folds", "timer 20 minutes", "stop"', 'Di: "pliegues", "temporizador 20 minutos", "para"')}
          {heard && <span className="block italic text-[#c94f00] mt-0.5 truncate">"{heard}"</span>}
        </p>
      )}

      {/* Timer attivi GRANDI */}
      <p className="text-xs font-bold uppercase tracking-wide text-[#c94f00] mb-2 mt-2 flex items-center gap-1.5"><Clock className="w-4 h-4" /> {tri("Timer attivi", "Aktive Timer", "Active timers", "Temporizadores activos")}</p>
      <div className="space-y-3" data-testid="manisporche-timers">
        {timers.length === 0 && <p className="text-center text-sm text-[#7E8A93] py-5">{tri("Nessun timer attivo.", "Kein aktiver Timer.", "No active timer.", "Ningún temporizador.")}</p>}
        {timers.map((t) => {
          const rem = remainingOf(t); const done = rem <= 0;
          return (
            <div key={t.id} className={`rounded-3xl p-5 border-2 ${done ? "bg-[#E4572E]/10 border-[#E4572E]/40" : "bg-white dark:bg-[#1e1e1e] border-[#2e2e2e] dark:border-[#2e2e2e]"}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-display text-lg font-semibold text-[#2B303B] dark:text-[#e4eff8] truncate flex items-center gap-1.5">{t.name || t.label}{t.repeat && <RefreshCw className="w-4 h-4 text-[#c94f00]" />}</span>
                <button onClick={() => remove(t.id)} className="text-[#7E8A93] p-1"><Trash2 className="w-6 h-6" /></button>
              </div>
              <p className={`font-mono-data text-6xl font-bold text-center ${done ? "text-[#E4572E]" : "text-[#2B303B] dark:text-[#e4eff8]"}`}>{fmt(rem)}</p>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <button onClick={() => toggle(t.id)} disabled={done} className="bg-[#c94f00] disabled:opacity-40 text-white font-bold text-lg py-4 rounded-2xl active:scale-97">{t.running ? tri("Pausa", "Pause", "Pause", "Pausa") : tri("Vai", "Start", "Go", "Va")}</button>
                <button onClick={() => reset(t.id)} className="bg-white dark:bg-[#181818] border border-[#2e2e2e] dark:border-[#2e2e2e] text-[#2B303B] dark:text-[#e4eff8] font-bold text-lg py-4 rounded-2xl active:scale-97">{tri("Reset", "Reset", "Reset", "Reset")}</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
