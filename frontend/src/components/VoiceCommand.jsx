import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, Loader2, X, Timer as TimerIcon, Pause, Play, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { TOOLS } from "@/sections/PianoProduzioneAI";
import { api } from "@/lib/api";

const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
const SR_LANG = { it: "it-IT", de: "de-DE", en: "en-US", es: "es-ES", fr: "fr-FR", fa: "fa-IR" };
const WAKE = ["ehi miki", "hey miki", "ei miki", "miki", "میکی", "mickey"];

const TOOL_ALIASES = {
  timer: ["timer", "cronometro"], acqua: ["temperatura acqua", "temp acqua", "acqua impasto", "water temp"],
  metodo: ["idratazione", "calcolo dosi", "parametri base", "hydration"], sequenze: ["sequenze", "orari impasto"],
  convlievito: ["convertitore lieviti", "converti lievito", "conversione lievito"], stampi: ["stampi", "teglie", "pirottini"],
  adatta: ["adatta forno"], energia: ["costo energia", "consumo forno", "energy optimizer"], capo: ["celle", "cella di lievitazione", "impastatrici"],
  termo: ["termostato", "clima"], freezer: ["freezer", "congelatore"], shelf: ["shelf life", "scadenze"],
  foodcost: ["costi e margine", "food cost", "margine", "costo ricetta"], mydata: ["i miei dati", "fornitori", "listini"],
  macchine: ["parco macchine", "manutenzione"], diagnosi: ["diagnosi foto", "analizza foto", "diagnosi visiva"], suono: ["diagnosi suono", "ascolta impasto"],
  sosimpasto: ["sos impasto", "aiuto impasto"], ph: ["pasta madre", "rinfreschi", "registro lievito madre"], bancalievito: ["banca del lievito"],
  sessioni: ["diario impasti", "storico impasti"], check: ["checklist", "controlli"], aggiungi: ["inserisci ricetta", "aggiungi ricetta", "nuova ricetta"],
  custodite: ["le mie ricette", "ricette custodite", "mie ricette"], webrecipe: ["cerca e adatta", "adatta ricetta"], generatore: ["generatore ricette", "genera ricetta"],
  scanflour: ["scanner farina", "scansiona farina"], trovafarina: ["conversione farine", "trova farina", "auto tuning"], labpizzeria: ["pizzeria", "pizza"],
  labpasticceria: ["pasticceria", "gelateria", "dolci"], bilancia: ["bilancia smart"], pesata: ["pesata guidata", "pesa ingredienti"],
  twin: ["digital twin", "gemello digitale"], fermentazione: ["fermentazione predittiva"], weatherbaker: ["meteo", "weather baker"],
  simforno: ["vapore", "gestione forno", "simulatore forno", "smart oven"], timelapse: ["time lapse", "raddoppio", "visual ferment"],
  esuberozero: ["esubero", "zero sprechi"], recupero: ["angolo recupero"], spreco: ["anti spreco"], bluetooth: ["bluetooth", "sonde", "iot", "dispositivi", "sonda"],
  manisporche: ["mani sporche", "mani infarinate", "copilot"],
};
const NAV = [
  { tab: "ricette", kw: ["ricette", "recipes", "rezepte", "recetas", "ricettario"] },
  { tab: "imparacon", kw: ["scienza e guide", "academy", "accademia", "corsi", "lezioni", "learn"] },
  { tab: "community", kw: ["social", "community", "comunita", "amici"] },
  { tab: "maestro", kw: ["laboratorio", "labor", "lab", "workshop"] },
  { tab: "home", kw: ["home", "casa", "inizio", "start"] },
];

export default function VoiceCommand({ onOpenTool }) {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const name = (tl) => norm(mkTri(lang)(tl.it, tl.de, tl.en, tl.es));
  const [listening, setListening] = useState(false);
  const [wake, setWake] = useState(false);
  const [timers, setTimers] = useState([]);
  const [onboard, setOnboard] = useState(() => { try { return !localStorage.getItem("mikilab_voice_onboard"); } catch { return true; } });
  const recRef = useRef(null);
  const wakeRef = useRef(null);
  const recipesRef = useRef(null);

  // ---- Timer multipli ----
  useEffect(() => {
    if (timers.length === 0) return;
    const iv = setInterval(() => {
      setTimers((ts) => ts.map((t) => (t.paused || t.remaining <= 0 ? t : { ...t, remaining: t.remaining - 1 })).filter((t) => {
        if (t.remaining <= 0 && !t.done) { beep(); beep(); speak(tri(`Timer ${t.name} finito.`, `Timer ${t.name} fertig.`, `Timer ${t.name} done.`, `Temporizador ${t.name} listo.`, `Minuteur ${t.name} terminé.`, `تایمر ${t.name} تمام شد.`)); toast.success(`⏰ ${t.name}`); return false; }
        return true;
      }));
    }, 1000);
    return () => clearInterval(iv);
    // eslint-disable-next-line
  }, [timers.length]);

  const beep = () => { try { const a = new (window.AudioContext || window.webkitAudioContext)(); const o = a.createOscillator(); const g = a.createGain(); o.connect(g); g.connect(a.destination); o.frequency.value = 880; g.gain.value = 0.15; o.start(); setTimeout(() => { o.stop(); a.close(); }, 140); } catch { /* */ } };
  const speak = useCallback((text) => { try { const u = new SpeechSynthesisUtterance(text); u.lang = SR_LANG[lang] || "it-IT"; u.rate = 1.08; window.speechSynthesis.cancel(); window.speechSynthesis.speak(u); } catch { /* */ } }, [lang]);
  const stripVerbs = (t) => t.replace(/\b(aprimi|apri|apre|vai alle|vai alla|vai al|vai ai|vai a|portami|mostrami|mostra|voglio|trovami|trova|cerca|open|go to|show me|show|find|abre|ir a|offne|öffne|zeige|zeig mir|zeig)\b/g, " ").replace(/\s+/g, " ").trim();

  // ---- Comandi timer a voce ----
  const tryTimer = (t) => {
    if (!/\b(timer|minut|second|min\b|minute|minuto)\b/.test(t)) return false;
    if (/\b(ferma|stop|cancella|elimina|annulla|pausa|riprend|resume|remaining|quanto manca|quanto resta)\b/.test(t)) {
      if (/\b(quanto manca|quanto resta|remaining|tempo residuo)\b/.test(t)) {
        if (timers.length === 0) { speak(tri("Nessun timer attivo.", "Kein Timer aktiv.", "No active timer.", "Sin temporizador.", "Aucun minuteur.", "تایمری فعال نیست.")); return true; }
        const parts = timers.map((x) => `${x.name} ${Math.ceil(x.remaining / 60)} min`).join(", ");
        speak(tri(`Restano: ${parts}.`, `Es bleiben: ${parts}.`, `Left: ${parts}.`, `Quedan: ${parts}.`, `Reste : ${parts}.`, `باقی‌مانده: ${parts}.`)); return true;
      }
      if (/\b(pausa|pause)\b/.test(t)) { setTimers((ts) => ts.map((x) => ({ ...x, paused: true }))); speak(tri("In pausa.", "Pausiert.", "Paused.", "En pausa.", "En pause.", "متوقف شد.")); return true; }
      if (/\b(riprend|resume)\b/.test(t)) { setTimers((ts) => ts.map((x) => ({ ...x, paused: false }))); speak(tri("Riprendo.", "Weiter.", "Resumed.", "Reanudo.", "Reprise.", "ادامه.")); return true; }
      setTimers([]); speak(tri("Timer cancellati.", "Timer gelöscht.", "Timers cleared.", "Temporizadores borrados.", "Minuteurs effacés.", "تایمرها پاک شد.")); return true;
    }
    const m = t.match(/(\d{1,3})\s*(h|ore|hour|stund|minut|min|second|sec)/);
    if (!m) return false;
    let secs = parseInt(m[1], 10);
    if (/^(h|ore|hour|stund)/.test(m[2])) secs *= 3600; else if (/^(minut|min)/.test(m[2])) secs *= 60;
    let nm = stripVerbs(t.replace(m[0], "").replace(/\b(timer|di|per|for|un|una|il|la)\b/g, " ")).trim();
    nm = nm.split(" ").slice(0, 2).join(" ") || tri("timer", "Timer", "timer", "temporizador", "minuteur", "تایمر");
    setTimers((ts) => [...ts, { id: Date.now() + Math.random(), name: nm, total: secs, remaining: secs, paused: false }]);
    beep();
    const mins = Math.round(secs / 60);
    speak(tri(`Timer ${nm}, ${mins} minuti. Avvio.`, `Timer ${nm}, ${mins} Minuten. Start.`, `Timer ${nm}, ${mins} minutes. Started.`, `Temporizador ${nm}, ${mins} minutos.`, `Minuteur ${nm}, ${mins} minutes.`, `تایمر ${nm}، ${mins} دقیقه.`));
    return true;
  };

  // ---- Ricerca ricetta a voce ----
  const tryRecipe = async (t) => {
    const rx = /(?:ricetta|scheda|recipe|receta|recette|rezept)\s+(?:di\s+|della\s+|del\s+|delle\s+mie\s+|mie\s+|mia\s+|my\s+|la\s+)?(.{2,40})/;
    const m = t.match(rx);
    if (!m) return false;
    let q = norm(stripVerbs(m[1]));
    if (!q || q.length < 2) return false;
    try {
      if (!recipesRef.current) {
        const [a, b] = await Promise.allSettled([api.get("/recipes", { params: { collection_name: "mikilab" } }), api.get("/recipes", { params: { collection_name: "personal" } })]);
        const list = [];
        if (a.status === "fulfilled") list.push(...(a.value.data || []));
        if (b.status === "fulfilled") list.push(...(b.value.data || []));
        recipesRef.current = list;
      }
      const list = recipesRef.current || [];
      const hit = list.find((r) => norm(r.name).includes(q)) || list.find((r) => q.split(" ").some((w) => w.length > 2 && norm(r.name).includes(w)));
      if (!hit) { speak(tri(`Ricetta "${q}" non trovata.`, `Rezept "${q}" nicht gefunden.`, `Recipe "${q}" not found.`, `Receta "${q}" no encontrada.`, `Recette "${q}" introuvable.`, `دستور "${q}" پیدا نشد.`)); return true; }
      const id = hit.id || hit.recipe_id;
      window.dispatchEvent(new CustomEvent("mikilab-goto", { detail: { tab: "ricette" } }));
      setTimeout(() => window.dispatchEvent(new CustomEvent("mikilab-open-recipe", { detail: { id } })), 400);
      speak(tri(`Ecco ${hit.name}.`, `Hier ${hit.name}.`, `Here's ${hit.name}.`, `Aquí ${hit.name}.`, `Voici ${hit.name}.`, `این هم ${hit.name}.`));
      toast.success(`📖 ${hit.name}`);
    } catch { speak(tri("Errore ricerca.", "Suchfehler.", "Search error.", "Error de búsqueda.", "Erreur.", "خطا.")); }
    return true;
  };

  const tryCalc = (t) => {
    if (!/(farina|flour|mehl|harina)/.test(t)) return false;
    const pct = t.match(/(\d{1,3})\s*(?:%|per ?cento|percent|prozent|por ?ciento)/) || t.match(/(?:idrataz\w*|hydrat\w*)\D{0,6}(\d{1,3})/);
    const hyd = pct ? parseInt(pct[1], 10) : null; if (!hyd) return false;
    const kg = /(kg|chil|kilo)/.test(t); let flour = null;
    const fm = t.match(/(\d+(?:[.,]\d+)?)\s*(?:kg|chil\w*|kilo\w*|g|gr|grammi|gramm|grams)?\s*(?:di\s+)?(?:farina|flour|mehl|harina)/);
    if (fm) flour = parseFloat(fm[1].replace(",", ".")); else { const nums = (t.match(/\d+(?:[.,]\d+)?/g) || []).map((x) => parseFloat(x.replace(",", "."))); flour = nums.find((n) => n !== hyd) ?? null; }
    if (!flour) return false; if (kg && flour < 100) flour *= 1000;
    const water = Math.round(flour * hyd / 100), salt = Math.round(flour * 0.02);
    const msg = tri(`${flour} g farina al ${hyd}%: ${water} g acqua, ${salt} g sale.`, `${flour} g Mehl ${hyd}%: ${water} g Wasser, ${salt} g Salz.`, `${flour} g flour ${hyd}%: ${water} g water, ${salt} g salt.`, `${flour} g harina ${hyd}%: ${water} g agua, ${salt} g sal.`, `${flour} g farine ${hyd}% : ${water} g eau, ${salt} g sel.`, `${flour} گرم آرد ${hyd}٪: ${water} گرم آب، ${salt} گرم نمک.`);
    toast.success(msg); speak(msg); return true;
  };

  const handle = async (raw) => {
    const t = norm(raw); const c = stripVerbs(t);
    if (tryTimer(t)) return;
    if (tryCalc(t)) return;
    if (await tryRecipe(t)) return;
    for (const [id, kws] of Object.entries(TOOL_ALIASES)) if (kws.some((k) => t.includes(k) || c.includes(k))) { open(id); return; }
    for (const n of NAV) if (n.kw.some((k) => c === k || c.includes(k))) { goto(n.tab, raw); return; }
    let best = null;
    for (const tl of TOOLS) { const nm = name(tl); if (nm && (c.includes(nm) || nm.includes(c)) && (!best || nm.length > best.len)) best = { id: tl.id, len: nm.length }; }
    if (best) { open(best.id); return; }
    speak(tri("Non ho capito.", "Nicht verstanden.", "Didn't catch that.", "No entendí.", "Pas compris.", "متوجه نشدم."));
    toast.error(tri(`Non ho capito: "${raw}"`, `Nicht verstanden: "${raw}"`, `Didn't catch: "${raw}"`, `No entendí: "${raw}"`, `Pas compris : "${raw}"`, `متوجه نشدم: "${raw}"`));
  };

  const open = (id) => {
    const tl = TOOLS.find((x) => x.id === id); const label = tl ? mkTri(lang)(tl.it, tl.de, tl.en, tl.es) : id;
    speak(tri(`Apro ${label}.`, `Öffne ${label}.`, `Opening ${label}.`, `Abro ${label}.`, `J'ouvre ${label}.`, `${label} را باز می‌کنم.`));
    toast.success(tri(`Apro: ${label}`, `Öffne: ${label}`, `Opening: ${label}`, `Abriendo: ${label}`, `J'ouvre : ${label}`, `باز می‌کنم: ${label}`));
    if (onOpenTool) onOpenTool(id);
    else { window.dispatchEvent(new CustomEvent("mikilab-goto", { detail: { tab: "maestro" } })); setTimeout(() => window.dispatchEvent(new CustomEvent("mikilab-open-lab-tool", { detail: { id } })), 350); }
  };
  const goto = (tab, raw) => { speak(tri("Vado.", "Gehe hin.", "Going.", "Voy.", "J'y vais.", "می‌روم.")); toast.success(tri(`Vado a: ${raw}`, `Gehe zu: ${raw}`, `Going to: ${raw}`, `Voy a: ${raw}`, `Je vais : ${raw}`, `می‌روم به: ${raw}`)); window.dispatchEvent(new CustomEvent("mikilab-goto", { detail: { tab } })); };

  // ---- Riconoscimento: singolo (tasto) ----
  const runOnce = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { toast.error(tri("Comandi vocali non supportati. Usa Chrome/Safari.", "Nicht unterstützt.", "Voice not supported. Use Chrome/Safari.", "No soportado.", "Non supporté.", "پشتیبانی نمی‌شود.")); return; }
    if (listening) { try { recRef.current && recRef.current.stop(); } catch { /* */ } return; }
    beep();
    const rec = new SR(); rec.lang = SR_LANG[lang] || "it-IT"; rec.interimResults = false; rec.maxAlternatives = 1;
    rec.onstart = () => setListening(true);
    rec.onerror = (e) => { setListening(false); if (e && e.error === "not-allowed") toast.error(tri("Permesso microfono negato.", "Mikrofon verweigert.", "Mic denied.", "Micrófono denegado.", "Micro refusé.", "میکروفون رد شد.")); };
    rec.onend = () => setListening(false);
    rec.onresult = (e) => { const tr = e.results?.[0]?.[0]?.transcript || ""; if (tr) handle(tr); };
    recRef.current = rec; try { rec.start(); } catch { /* */ }
  };

  // ---- Wake-word: ascolto continuo (opt-in, richiede il tap iniziale) ----
  const toggleWake = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { toast.error(tri("Non supportato da questo browser.", "Nicht unterstützt.", "Not supported.", "No soportado.", "Non supporté.", "پشتیبانی نمی‌شود.")); return; }
    if (wake) { setWake(false); try { wakeRef.current && (wakeRef.current._stop = true, wakeRef.current.stop()); } catch { /* */ } return; }
    setWake(true); beep();
    toast.success(tri("Ascolto «Ehi Miki» attivo.", "Höre auf «Ehi Miki».", "Listening for «Ehi Miki».", "Escuchando «Ehi Miki».", "À l'écoute «Ehi Miki».", "در حال شنیدن «میکی»."));
    const loop = () => {
      const rec = new SR(); rec.lang = SR_LANG[lang] || "it-IT"; rec.continuous = true; rec.interimResults = true; rec._stop = false;
      rec.onresult = (e) => {
        const last = e.results[e.results.length - 1]; if (!last || !last.isFinal) return;
        const tr = norm(last[0].transcript);
        const w = WAKE.find((k) => tr.includes(k)); if (!w) return;
        const cmd = tr.slice(tr.indexOf(w) + w.length).trim();
        beep(); setListening(true); setTimeout(() => setListening(false), 1200);
        if (cmd.length > 1) handle(cmd);
        else speak(tri("Dimmi.", "Sag's.", "Yes?", "Dime.", "Oui ?", "بگو."));
      };
      rec.onend = () => { if (!rec._stop) { try { rec.start(); } catch { /* */ } } };
      rec.onerror = (e) => { if (e && e.error === "not-allowed") { setWake(false); rec._stop = true; toast.error(tri("Permesso microfono negato.", "Mikrofon verweigert.", "Mic denied.", "Micrófono denegado.", "Micro refusé.", "میکروفون رد شد.")); } };
      wakeRef.current = rec; try { rec.start(); } catch { /* */ }
    };
    loop();
  };
  useEffect(() => () => { try { wakeRef.current && (wakeRef.current._stop = true, wakeRef.current.stop()); } catch { /* */ } }, []);

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <>
      {/* Timer multipli attivi */}
      {timers.length > 0 && (
        <div data-testid="voice-timers" className="fixed bottom-40 right-3 z-50 space-y-1.5 max-w-[62vw]">
          {timers.map((tm) => (
            <div key={tm.id} className="flex items-center gap-2 rounded-xl bg-[#161616]/95 backdrop-blur border border-[#ff6b00]/50 px-2.5 py-1.5 shadow-lg">
              <TimerIcon className="w-4 h-4 text-[#ff6b00] shrink-0" />
              <span className="text-[12px] font-bold text-white truncate max-w-[80px]">{tm.name}</span>
              <span className="font-mono text-[13px] font-bold text-[#ff6b00] tabular-nums">{fmt(tm.remaining)}</span>
              <button onClick={() => setTimers((ts) => ts.map((x) => x.id === tm.id ? { ...x, paused: !x.paused } : x))} className="text-[#AEB8BF] hover:text-white">{tm.paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}</button>
              <button onClick={() => setTimers((ts) => ts.filter((x) => x.id !== tm.id))} className="text-[#AEB8BF] hover:text-[#e05e00]"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
      )}

      {/* Onboarding rapido */}
      {onboard && (
        <div data-testid="voice-onboard" className="fixed inset-x-3 bottom-28 z-[60] mx-auto max-w-sm rounded-2xl bg-[#161616] border border-[#ff6b00]/50 p-4 shadow-2xl">
          <button data-testid="voice-onboard-close" onClick={() => { setOnboard(false); try { localStorage.setItem("mikilab_voice_onboard", "1"); } catch { /* */ } }} className="absolute top-2 end-2 text-[#7E8A93] hover:text-white"><X className="w-4 h-4" /></button>
          <p className="font-display text-sm font-extrabold text-[#ff6b00] mb-2 flex items-center gap-1.5"><Mic className="w-4 h-4" /> Miki-Voice</p>
          <p className="text-[12.5px] text-[#C9D4DC] leading-snug mb-2">{tri("Comanda a voce, mani libere. Prova:", "Sprich, freihändig. Probier:", "Voice control, hands-free. Try:", "Control por voz. Prueba:", "Commande vocale. Essaie :", "کنترل صوتی. امتحان کن:")}</p>
          <ul className="text-[12px] text-[#AEB8BF] space-y-1 list-disc ps-4">
            <li>«{tri("Ehi Miki, timer autolisi 45 minuti", "Ehi Miki, Timer Autolyse 45 Minuten", "Ehi Miki, autolyse timer 45 minutes", "Ehi Miki, temporizador autólisis 45 minutos", "Ehi Miki, minuteur autolyse 45 minutes", "میکی، تایمر اتولیز ۴۵ دقیقه")}»</li>
            <li>«{tri("Miki, trovami la ricetta delle mie baguette", "Miki, finde mein Baguette-Rezept", "Miki, find my baguette recipe", "Miki, busca mi receta de baguette", "Miki, trouve ma recette de baguette", "میکی، دستور باگت من را پیدا کن")}»</li>
          </ul>
        </div>
      )}

      {/* Tasto vocale + wake toggle + micro-copy */}
      <div className="fixed bottom-24 right-4 z-50 flex flex-col items-end gap-1.5">
        <button data-testid="voice-wake-toggle" onClick={toggleWake}
          className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all ${wake ? "bg-[#ff6b00] text-white border-[#ff6b00] animate-pulse" : "bg-[#161616]/90 text-[#ff6b00] border-[#ff6b00]/50"}`}>
          {wake ? tri("👂 Ehi Miki ON", "👂 Ehi Miki AN", "👂 Ehi Miki ON", "👂 Ehi Miki ON", "👂 Ehi Miki ON", "👂 میکی روشن") : tri("Attiva «Ehi Miki»", "«Ehi Miki» an", "Enable «Ehi Miki»", "Activar «Ehi Miki»", "Activer «Ehi Miki»", "«میکی» فعال کن")}
        </button>
        <button data-testid="voice-command-btn" onClick={runOnce}
          className={`h-16 px-6 rounded-full text-white font-extrabold text-base shadow-2xl flex items-center gap-2.5 ring-4 active:scale-95 transition-all ${listening ? "bg-[#e05e00] ring-[#ff6b00]/70 scale-110" : "bg-[#ff6b00] hover:bg-[#e05e00] ring-[#ff6b00]/30"}`}>
          {listening ? <Loader2 className="w-7 h-7 animate-spin" /> : <Mic className="w-7 h-7" />}
          {listening ? tri("Ascolto…", "Ich höre…", "Listening…", "Escuchando…", "J'écoute…", "می‌شنوم…") : tri("Voce", "Stimme", "Voice", "Voz", "Voix", "صدا")}
        </button>
        <span className="text-[9.5px] text-[#7E8A93] bg-[#161616]/70 px-2 py-0.5 rounded-full">{tri("Pronuncia «Ehi Miki» o premi", "Sag «Ehi Miki» oder drücke", "Say «Ehi Miki» or tap", "Di «Ehi Miki» o pulsa", "Dis «Ehi Miki» ou appuie", "بگو «میکی» یا بزن")}</span>
      </div>
    </>
  );
}
