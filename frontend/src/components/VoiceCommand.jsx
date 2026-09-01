import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, Loader2, X, Timer as TimerIcon, Pause, Play, Trash2, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { TOOLS } from "@/sections/PianoProduzioneAI";
import { api, labConfigApi } from "@/lib/api";
import { playTTS, stopTTS, isTTSMuted, setTTSMuted } from "@/lib/tts";
import SpeakingAvatar from "@/components/SpeakingAvatar";
import { fetchWeeklyItems, todayKey, tomorrowKey, itemsForDay, summarizeDay } from "@/lib/weeklyPlan";
import { getCached as shiftGet, setWorkMode, setBatchStatus, addBase, toggleMachineDown, setColdDown, addNote, statusLabel, machineDownNote, coldDownNote, handoverSummary, logFault } from "@/lib/shiftState";
import { PROACTIVE_MODULES, moduleName, moduleMsg } from "@/lib/proactiveModules";
import { routeVoice } from "@/lib/nativeAudio";
import { getOperators } from "@/lib/brigata";

const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
const SR_LANG = { it: "it-IT", de: "de-DE", en: "en-US", es: "es-ES", fr: "fr-FR", fa: "fa-IR" };
const WAKE = ["ehi lab", "hey lab", "e lab", "ei lab", "lab", "لب", "ok lab"];

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
  settimana: ["piano settimanale", "programma settimana", "wochenplan", "weekly plan", "programa semanal", "produzione settimanale"],
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
  const [speaking, setSpeaking] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [muted, setMuted] = useState(isTTSMuted());
  const [scrolling, setScrolling] = useState(false);
  useEffect(() => {
    let t;
    const onScroll = () => { setScrolling(true); clearTimeout(t); t = setTimeout(() => setScrolling(false), 650); };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); clearTimeout(t); };
  }, []);
  const [wake, setWake] = useState(() => { try { return localStorage.getItem("mikilab_voice_wake") === "1"; } catch { return false; } });
  const [timers, setTimers] = useState([]);
  const [onboard, setOnboard] = useState(false); // onboarding vocale DISABILITATO: nessun popup all'avvio
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
  // Voce di Lab (sintesi nativa del dispositivo, tono telegrafico).
  const speak = useCallback((text) => {
    playTTS(text, { lang, voice: "michele", onStart: () => setSpeaking(true), onEnded: () => setSpeaking(false) });
  }, [lang]);
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

  // Lab Sense (Exclusive): correzione temperatura impasto in tempo reale
  const labSense = (t) => {
    if (!/impasto|dough|teig|masa|p[aâ]te/.test(t)) return false;
    const m = t.match(/(\d{1,2})\s*(?:grad|°|degree|deg)/); if (!m) return false;
    const cur = parseInt(m[1], 10), target = 24, diff = cur - target;
    let msg;
    if (diff > 0) { const ice = Math.round(diff * 60); msg = tri(`Impasto a ${cur}°. Riduci la velocità dell'impastatrice e aggiungi circa ${ice} g di ghiaccio per chiudere a ${target}°.`, `Teig ${cur}°. Geschwindigkeit senken, ~${ice} g Eis für ${target}°.`, `Dough ${cur}°. Lower mixer speed, add ~${ice} g ice to close at ${target}°.`, `Masa ${cur}°. Baja la velocidad, ~${ice} g de hielo para ${target}°.`, `Pâte ${cur}°. Réduis la vitesse, ~${ice} g de glace pour ${target}°.`, `خمیر ${cur}°. سرعت را کم کن و حدود ${ice} گرم یخ اضافه کن تا ${target}°.`); }
    else if (diff < 0) { msg = tri(`Impasto a ${cur}°, sotto ${target}°. Usa acqua tiepida e aumenta un po' la velocità.`, `Teig ${cur}°, unter ${target}°. Lauwarmes Wasser, etwas schneller.`, `Dough ${cur}°, below ${target}°. Use warm water, raise speed a bit.`, `Masa ${cur}°, bajo ${target}°. Agua tibia y más velocidad.`, `Pâte ${cur}°, sous ${target}°. Eau tiède, plus de vitesse.`, `خمیر ${cur}°، زیر ${target}°. آب ولرم و سرعت بیشتر.`); }
    else msg = tri(`Perfetto: impasto già a ${target}°.`, `Perfekt: Teig bei ${target}°.`, `Perfect: dough at ${target}°.`, `Perfecto: masa a ${target}°.`, `Parfait : pâte à ${target}°.`, `عالی: خمیر روی ${target}°.`);
    speak(msg); toast.success("⚡ Lab Sense: " + msg); return true;
  };
  // Conversione unità (acqua g<->l)
  const tryConvert = (t) => {
    if (!/convert/.test(t)) return false;
    const g = t.match(/(\d+(?:[.,]\d+)?)\s*(?:g|gr|grammi|gramm|grams)/);
    const l = t.match(/(\d+(?:[.,]\d+)?)\s*(?:l|litr|liter|litre)/);
    if (g && /litr|liter|litre|\bl\b/.test(t)) { const v = parseFloat(g[1].replace(",", ".")) / 1000; const msg = tri(`${g[1]} g d'acqua = ${v} litri.`, `${g[1]} g = ${v} Liter.`, `${g[1]} g water = ${v} liters.`, `${g[1]} g = ${v} litros.`, `${g[1]} g = ${v} litres.`, `${g[1]} گرم = ${v} لیتر.`); speak(msg); toast.success(msg); return true; }
    if (l) { const v = parseFloat(l[1].replace(",", ".")) * 1000; const msg = tri(`${l[1]} litri d'acqua = ${v} g.`, `${l[1]} Liter = ${v} g.`, `${l[1]} liters water = ${v} g.`, `${l[1]} litros = ${v} g.`, `${l[1]} litres = ${v} g.`, `${l[1]} لیتر = ${v} گرم.`); speak(msg); toast.success(msg); return true; }
    return false;
  };
  // Creazione ricetta a voce → apre la scheda "Inserisci ricetta"
  const tryCreateRecipe = (raw, t) => {
    if (!/\b(crea|creare|nuova|aggiungi|inserisci|dettare|detta)\b.*\b(ricetta|recipe|rezept|receta|recette)\b/.test(t)) return false;
    const nm = (raw.split(/ricetta|recipe|rezept|receta|recette/i)[1] || "").replace(/^[:\s.,-]+/, "").trim();
    try { if (nm) localStorage.setItem("mikilab_voice_new_recipe", nm); } catch { /* */ }
    speak(tri(`Creo la ricetta ${nm}. Apro la scheda.`, `Erstelle Rezept ${nm}.`, `Creating recipe ${nm}.`, `Creo receta ${nm}.`, `Je crée ${nm}.`, `دستور ${nm} را می‌سازم.`));
    open("aggiungi"); return true;
  };

  // Piano Settimanale a voce: "produzione di oggi/domani", "quanti impasti".
  const tryPlan = async (raw, t) => {
    if (!/(produzion|produrre|produco|produciamo|programma|\blotti\b|\bimpasti\b|quanti impast|cosa produ|production|\bplan\b|produkti|producci)/.test(t)) return false;
    const wantTomorrow = /(domani|tomorrow|morgen|mañana|demain)/.test(t);
    const key = wantTomorrow ? tomorrowKey() : todayKey();
    const items = await fetchWeeklyItems();
    const msg = summarizeDay(items, key, lang);
    const persona = /\bmomi\b|\bmomy\b/.test(t) ? "momy" : "michele";
    setSpeaking(true);
    playTTS(msg, { lang, voice: persona, onStart: () => setSpeaking(true), onEnded: () => setSpeaking(false) });
    toast.success((persona === "momy" ? "🎓 Momi: " : "👨‍🍳 Lab: ") + msg);
    return true;
  };

  // Didattica on-demand di Momi: "spiegami questa funzione / il Naso Digitale".
  const tryExplain = (raw, t) => {
    if (!/(spiegami|spiega|explain|erkl[aä]r|explica|expli(que|quer))/.test(t)) return false;
    const found = PROACTIVE_MODULES.find((m) => t.includes(norm(moduleName(m, lang))));
    const msg = found
      ? `${moduleName(found, lang)}. ${moduleMsg(found, lang)}`
      : tri("Sono Momi. Questa è la modalità mani libere: lavori con la voce, i moduli controllano l'impasto e ti avviso solo quando serve. Chiedimi di spiegarti un modulo, ad esempio il Naso Digitale o il Tatto Digitale.",
            "Ich bin Momi. Freihand-Modus: du arbeitest mit der Stimme, die Module überwachen den Teig und ich melde mich nur wenn nötig. Frag nach einem Modul, z. B. die Digitale Nase.",
            "I'm Momi. Hands-free mode: you work with your voice, the modules watch the dough and I speak only when needed. Ask me about a module, e.g. the Digital Nose.",
            "Soy Momi. Modo manos libres: trabajas con la voz, los módulos vigilan la masa y aviso solo cuando hace falta. Pídeme un módulo, p. ej. la Nariz Digital.",
            "Je suis Momi. Mode mains libres : tu travailles à la voix, les modules surveillent la pâte et j'interviens seulement si besoin.",
            "من مومی هستم. حالت بدون دست: با صدا کار می‌کنی و ماژول‌ها خمیر را کنترل می‌کنند.");
    setSpeaking(true);
    playTTS(msg, { lang, voice: "momy", onStart: () => setSpeaking(true), onEnded: () => setSpeaking(false) });
    toast.success("🎓 Momi: " + msg);
    return true;
  };

  // "Mickey, guida" → apre la Guida MikiLab.
  const tryGuida = (t) => {
    if (!/\bguida\b|\bguide\b|\banleitung\b|\bgu[ií]a\b/.test(t)) return false;
    window.dispatchEvent(new Event("mikilab-open-guida"));
    setSpeaking(true);
    playTTS(tri("Apro la guida.", "Öffne die Anleitung.", "Opening the guide.", "Abro la guía.", "J'ouvre le guide.", "راهنما را باز می‌کنم."), { lang, voice: "michele", onEnded: () => setSpeaking(false) });
    toast.success(tri("📖 Guida MikiLab", "📖 Anleitung", "📖 Guide", "📖 Guía", "📖 Guide", "📖 راهنما"));
    return true;
  };

  // "Mickey, chiama [nome/ruolo]" → chiamata interna (indicatore UI; audio nativo in build app).
  const tryCall = (t) => {
    const m = t.match(/\b(chiama|chiamare|call|ruf|rufe|rufst|llama|appelle)\b\s+(.+)/);
    if (!m) return false;
    const target = m[2].trim();
    const op = getOperators().find((o) => (o.name || "").toLowerCase().includes(target.split(" ")[0]));
    const msg = tri(`Chiamo ${op ? op.name : target}.`, `Rufe ${op ? op.name : target}.`, `Calling ${op ? op.name : target}.`, `Llamo a ${op ? op.name : target}.`, `J'appelle ${target}.`, `${target} را صدا می‌زنم.`);
    setSpeaking(true);
    routeVoice({ text: msg, lang, persona: "michele", operator: op, onEnded: () => setSpeaking(false) });
    toast.info("📞 " + msg + " (DEMO)");
    return true;
  };

  // "Ehi Lab, registra scarto 2 chili pane" → aggiunge al Registro Scarti.
  const NUMW = { uno: 1, una: 1, due: 2, tre: 3, quattro: 4, cinque: 5, sei: 6, sette: 7, otto: 8, nove: 9, dieci: 10, mezzo: 0.5 };
  const tryScarto = (t) => {
    if (!/\b(scarto|scarti|spreco|sprechi|waste|ausschuss|merma)\b/.test(t)) return false;
    let qty = 0;
    const md = t.match(/(\d+(?:[.,]\d+)?)/);
    if (md) qty = parseFloat(md[1].replace(",", "."));
    else { for (const w in NUMW) { if (new RegExp("\\b" + w + "\\b").test(t)) { qty = NUMW[w]; break; } } }
    let product = "";
    const mp = t.match(/(?:chili|chilo|kg|kili|kilo|kilos|kilogramm)\s+(?:di\s+)?([a-zàèéìòù]+(?:\s+[a-zàèéìòù]+)?)/);
    if (mp) product = mp[1].trim();
    if (!product) { const mp2 = t.match(/\b(?:pane|pizza|focaccia|brioche|dolci|impasto|farina|baguette|panini)\b/); if (mp2) product = mp2[0]; }
    try {
      const arr = JSON.parse(localStorage.getItem("mikilab_scarti") || "[]");
      arr.unshift({ id: `${Date.now()}`, ts: new Date().toISOString(), qty, product: product || tri("Prodotto", "Produkt", "Product", "Producto"), reason: "" });
      localStorage.setItem("mikilab_scarti", JSON.stringify(arr));
    } catch { /* */ }
    window.dispatchEvent(new Event("mikilab-scarti-updated"));
    const msg = tri(`Scarto registrato: ${qty} chili ${product}.`, `Ausschuss: ${qty} Kilo ${product}.`, `Waste logged: ${qty} kilos ${product}.`, `Merma: ${qty} kilos ${product}.`, `Rebut: ${qty} kilos ${product}.`, `ضایعات ثبت شد.`);
    setSpeaking(true);
    playTTS(msg, { lang, voice: "michele", onEnded: () => setSpeaking(false) });
    toast.success("♻️ " + msg);
    return true;
  };

  // "Vasca 1 sanificata" / "sanifica vasca due" → segna sanificazione.
  const trySanifica = (t) => {
    if (!/\b(sanific|sanifica|sanitis|sanitiz|reinig|higieniz|vasca sanific)\b/.test(t)) return false;
    let n = "1"; const md = t.match(/vasca\s*(\d)/) || t.match(/\b(uno|due|tre)\b/);
    if (md) { const raw = md[1]; n = raw === "uno" ? "1" : raw === "due" ? "2" : raw === "tre" ? "3" : raw; }
    try { const m = JSON.parse(localStorage.getItem("mikilab_sanific") || "{}"); m[n] = new Date().toISOString(); localStorage.setItem("mikilab_sanific", JSON.stringify(m)); } catch { /* */ }
    window.dispatchEvent(new Event("mikilab-sanific-updated"));
    const msg = tri(`Vasca ${n} sanificata.`, `Kessel ${n} gereinigt.`, `Bowl ${n} sanitised.`, `Cuba ${n} higienizada.`, `Cuve ${n} nettoyée.`, `مخزن ${n} ضدعفونی شد.`);
    setSpeaking(true);
    playTTS(msg, { lang, voice: "michele", onEnded: () => setSpeaking(false) });
    toast.success("💧 " + msg);
    return true;
  };

  // ---- GESTIONE TURNO / GUASTI / PRE-COTTI (offline, conferma vocale) ----
  const STATUS_WORDS = [
    { st: "precotto", rx: /(precott|pre-cott|abbattut|vorgebacken|pre-?baked|precocid|pr[ée]cuit)/ },
    { st: "base_pronta", rx: /(base pronta|basi pronte|base ready|ready base|base fatta|base lista)/ },
    { st: "in_cella", rx: /(in cella|nella cella|in frigo|in cold|en c[aá]mara|in der zelle|en chambre)/ },
    { st: "in_lievitazione", rx: /(lievitaz|in lievito|proofing|g[aä]rung|fermentaci|en pousse)/ },
    { st: "pronto", rx: /(pronto|pronta|pronte|pronti|fertig|ready|listo|pr[êe]t)/ },
    { st: "fatto", rx: /(fatto|completat|finit|erledigt|\bdone\b|hecho|termin)/ },
  ];

  // Modalità di lavoro: "modalità autonomia" / "flusso continuo".
  const tryModo = (t) => {
    if (!/(modalit|flusso|autonom|continu|arbeitsmodus|work mode|eigenst[aä]nd)/.test(t)) return false;
    if (/(autonom|anticip|blocco|eigenst[aä]nd|autonomous)/.test(t)) {
      setWorkMode("autonomia");
      const msg = tri("Modalità Autonomia attiva. Prepara in blocco e aggiorna gli stati.", "Autonomie-Modus aktiv.", "Autonomy mode on.", "Modo autonomía activo.", "Mode autonomie activé.", "حالت خودگردان فعال شد.");
      speak(msg); toast.success("🧩 " + msg); return true;
    }
    if (/(continu|flusso|real|team|kontinu|continuous)/.test(t)) {
      setWorkMode("continuo");
      const msg = tri("Flusso Continuo attivo.", "Kontinuierlicher Fluss aktiv.", "Continuous flow on.", "Flujo continuo activo.", "Flux continu activé.", "جریان پیوسته فعال شد.");
      speak(msg); toast.success("⚡ " + msg); return true;
    }
    return false;
  };

  // Cella/fermalievitazione fuori uso → lievitazione diretta a temperatura ambiente.
  const tryCella = (t) => {
    if (!/(cella|frigo|reo|fermalievit|k[uü]hl|cold cell|c[aá]mara|chambre)/.test(t)) return false;
    if (!/(rott|guast|fuori uso|non funzion|spent|kaputt|defekt|\boff\b|broken|down|salt|en panne|\bok\b|funzion|ripristin|torna)/.test(t)) return false;
    if (/(\bok\b|ripristin|torna|riparat|wieder|working|restored)/.test(t) && !/(non funzion|nicht|not working)/.test(t)) {
      setColdDown(false, "");
      const msg = tri("Cella ripristinata. Torno alla lievitazione in cella.", "Zelle wieder aktiv.", "Cell restored.", "Cámara restaurada.", "Chambre rétablie.", "سردخانه بازگشت.");
      speak(msg); toast.success("❄️ " + msg); return true;
    }
    setColdDown(true, /stanotte|stasera|tonight|heute nacht|esta noche|cette nuit/.test(t) ? tri("Stanotte", "Heute Nacht", "Tonight", "Esta noche", "Cette nuit", "امشب") : "");
    const note = coldDownNote(tri);
    addNote("❄️→🔥 " + note, "cella");
    logFault({ type: "cella", name: tri("Cella / fermalievitazione", "Zelle", "Cold cell", "Cámara", "Chambre", "سردخانه"), note });
    speak(tri(`Cella non funzionante. ${note}`, `Zelle defekt. ${note}`, `Cell not working. ${note}`, `Cámara no funciona. ${note}`, `Chambre en panne. ${note}`, `سردخانه خراب. ${note}`));
    toast.error(tri("❄️ Cella fuori uso → lievitazione diretta", "❄️ Zelle aus → direkte Gärung", "❄️ Cell off → direct leavening", "❄️ Cámara → fermentación directa", "❄️ Chambre → levée directe", "❄️ سردخانه → مستقیم"));
    return true;
  };

  // Guasto impastatrice/macchina → ripartizione lotti sulle macchine disponibili.
  const tryGuasto = async (t) => {
    if (!/(rott|guast|fuori uso|non funzion|kaputt|defekt|au[sß]er betrieb|broken|out of order|averi|en panne)/.test(t)) return false;
    if (/(cella|frigo|reo|fermalievit|k[uü]hl|cold cell|c[aá]mara|chambre)/.test(t)) return false; // gestito da tryCella
    let mixers = [];
    try { const cfg = await labConfigApi.get(); mixers = (cfg && cfg.mixers) || []; } catch { /* offline */ }
    let name = null;
    for (const m of mixers) { if (m.name && t.includes(norm(m.name))) { name = m.name; break; } }
    if (!name) name = /principal|haupt|\bmain\b/.test(t)
      ? (mixers[0]?.name || tri("Impastatrice principale", "Hauptmaschine", "Main mixer", "Amasadora principal", "Pétrin principal", "همزن اصلی"))
      : tri("Impastatrice", "Maschine", "Mixer", "Amasadora", "Pétrin", "همزن");
    toggleMachineDown(name, true);
    const downNames = (shiftGet().machines_down || []).map((x) => x.name);
    const note = machineDownNote(name, mixers.length ? mixers : [{ name }], downNames, tri);
    addNote("🔧 " + note, "guasto");
    logFault({ type: "macchina", name, note });
    speak(tri(`${name} fuori uso. ${note}`, `${name} außer Betrieb. ${note}`, `${name} out of order. ${note}`, `${name} fuera de uso. ${note}`, `${name} hors service. ${note}`, `${name} خراب. ${note}`));
    toast.error("🔧 " + name);
    return true;
  };

  // Avanzamento lotto / pre-cotto: "segna 10 teglie focaccia precotte", "lotto 2 pronto in cella".
  const tryLotto = async (t) => {
    const sw = STATUS_WORDS.find((x) => x.rx.test(t));
    const mentions = /\b(lotto|lotti|teglie|teglia|tegli|charge|batch|tray|trays|bandej|plaque|blech)\b/.test(t) || /(segna|marca|imposta|aggiorna|mark|markier)/.test(t);
    if (!sw || !mentions) return false;
    let qty = null; const qm = t.match(/(\d+(?:[.,]\d+)?)/);
    if (qm) qty = parseFloat(qm[1].replace(",", ".")); else { for (const w in NUMW) { if (new RegExp("\\b" + w + "\\b").test(t)) { qty = NUMW[w]; break; } } }
    let unit = ""; if (/\b(teglie|teglia|tegli|bleche|blech|trays|tray|bandejas|plaques)\b/.test(t)) unit = tri("teglie", "Bleche", "trays", "bandejas", "plaques", "سینی");

    if ((sw.st === "precotto" || sw.st === "base_pronta") && qty) {
      let product = "";
      const pm = t.match(/(?:teglie|teglia|tegli|pezzi|pezz|di)\s+([a-zàèéìòù]+(?:\s+[a-zàèéìòù]+)?)/);
      if (pm) product = pm[1].trim();
      if (!product) { const p2 = t.match(/\b(focaccia|pane|pizza|baguette|panini|brioche|croissant|ciabatta|pagnotta|panettone)\b/); if (p2) product = p2[0]; }
      addBase({ product: product || tri("Prodotto", "Produkt", "Product", "Producto", "Produit", "محصول"), qty, unit, kind: sw.st });
      const lbl = statusLabel(sw.st, tri);
      const msg = tri(`Registrate ${qty} ${unit} ${product} — ${lbl}.`, `${qty} ${unit} ${product} — ${lbl}.`, `Logged ${qty} ${unit} ${product} — ${lbl}.`, `Registrado ${qty} ${unit} ${product} — ${lbl}.`, `${qty} ${unit} ${product} — ${lbl}.`, `${qty} ${unit} ${product} — ${lbl}.`);
      speak(msg); toast.success("📦 " + msg); return true;
    }

    const items = itemsForDay(await fetchWeeklyItems(), todayKey());
    let target = null;
    const lm = t.match(/lotto\s*(\d+)/);
    if (lm) { target = items[parseInt(lm[1], 10) - 1] || null; }
    if (!target) target = items.find((it) => norm(it.recipe_name || "").split(" ").some((w) => w.length > 2 && t.includes(w)));
    if (!target) { speak(tri("Non trovo il lotto. Ripeti col nome o il numero.", "Charge nicht gefunden.", "Batch not found.", "Lote no encontrado.", "Lot introuvable.", "دسته پیدا نشد.")); return true; }
    setBatchStatus({ id: target.id, recipe_id: target.recipe_id, recipe_name: target.recipe_name, pieces: target.pieces }, sw.st);
    const msg = `${target.recipe_name}: ${statusLabel(sw.st, tri)}.`;
    speak(msg); toast.success("✅ " + msg); return true;
  };

  // Consegne del turno: riepilogo vocale (pronto / in cella / da completare / basi).
  const tryConsegne = (t) => {
    if (!/(conseg|cambio turno|riepilogo turno|passaggio di conseg|handover|schicht[uü]berg|relevo|passation)/.test(t)) return false;
    const msg = handoverSummary(shiftGet(), tri);
    speak(msg); toast.success("📋 " + msg); return true;
  };

  const handle = async (raw) => {
    const t = norm(raw); const c = stripVerbs(t);
    if (/\blab stop\b|^stop$|silenzio|zitto|basta|be quiet/.test(t)) { stopTTS(); setSpeaking(false); toast.info("⏹"); return; }
    if (tryTimer(t)) return;
    if (labSense(t)) return;
    if (tryConvert(t)) return;
    if (tryCreateRecipe(raw, t)) return;
    if (tryCalc(t)) return;
    if (tryGuida(t)) return;
    if (trySanifica(t)) return;
    if (tryModo(t)) return;
    if (tryConsegne(t)) return;
    if (tryCella(t)) return;
    if (await tryGuasto(t)) return;
    if (await tryLotto(t)) return;
    if (tryScarto(t)) return;
    if (tryCall(t)) return;
    if (await tryPlan(raw, t)) return;
    if (tryExplain(raw, t)) return;
    if (await tryRecipe(t)) return;
    for (const [id, kws] of Object.entries(TOOL_ALIASES)) if (kws.some((k) => t.includes(k) || c.includes(k))) { open(id); return; }
    for (const n of NAV) if (n.kw.some((k) => c === k || c.includes(k))) { goto(n.tab, raw); return; }
    let best = null;
    for (const tl of TOOLS) { const nm = name(tl); if (nm && (c.includes(nm) || nm.includes(c)) && (!best || nm.length > best.len)) best = { id: tl.id, len: nm.length }; }
    if (best) { open(best.id); return; }
    await askLab(raw);
  };

  // Lab AI 360: dialogo libero (fallback) — risposta breve da maestro
  const askLab = async (raw) => {
    setListening(true);
    try {
      const { data } = await api.post("/lab/ask", { session_id: "lab-voice", message: raw, lang });
      const ans = (data && data.answer) || tri("Non ho una risposta.", "Keine Antwort.", "No answer.", "Sin respuesta.", "Pas de réponse.", "پاسخی ندارم.");
      speak(ans); toast.success("🧑‍🍳 " + ans);
    } catch {
      speak(tri("Assistente non disponibile.", "Assistent nicht verfügbar.", "Assistant unavailable.", "Asistente no disponible.", "Assistant indisponible.", "دستیار در دسترس نیست."));
    } finally { setListening(false); }
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
    stopTTS(); setSpeaking(false); // barge-in: zittisci l'avatar
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
    if (wake) { setWake(false); try { localStorage.setItem("mikilab_voice_wake", "0"); } catch { /* */ } try { wakeRef.current && (wakeRef.current._stop = true, wakeRef.current.stop()); } catch { /* */ } return; }
    setWake(true); try { localStorage.setItem("mikilab_voice_wake", "1"); } catch { /* */ } beep();
    toast.success(tri("Ascolto «Ehi Lab» attivo.", "Höre auf «Ehi Lab».", "Listening for «Ehi Lab».", "Escuchando «Ehi Lab».", "À l'écoute «Ehi Lab».", "در حال شنیدن «لب»."));
    const loop = () => {
      const rec = new SR(); rec.lang = SR_LANG[lang] || "it-IT"; rec.continuous = true; rec.interimResults = true; rec._stop = false;
      rec.onresult = (e) => {
        const last = e.results[e.results.length - 1]; if (!last || !last.isFinal) return;
        const tr = norm(last[0].transcript);
        const w = WAKE.find((k) => tr.includes(k)); if (!w) return;
        const cmd = tr.slice(tr.indexOf(w) + w.length).trim();
        stopTTS(); setSpeaking(false); // barge-in
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
  // Persistenza wake-word: se era attiva, prova a riavviare all'apertura (il browser può richiedere un tap)
  useEffect(() => {
    if (!wake) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SR) return;
    let rec;
    try {
      rec = new SR(); rec.lang = SR_LANG[lang] || "it-IT"; rec.continuous = true; rec.interimResults = true; rec._stop = false;
      rec.onresult = (e) => { const last = e.results[e.results.length - 1]; if (!last || !last.isFinal) return; const tr = norm(last[0].transcript); const w = WAKE.find((k) => tr.includes(k)); if (!w) return; const cmd = tr.slice(tr.indexOf(w) + w.length).trim(); stopTTS(); setSpeaking(false); beep(); setListening(true); setTimeout(() => setListening(false), 1200); if (cmd.length > 1) handle(cmd); else speak(tri("Dimmi.", "Sag's.", "Yes?", "Dime.", "Oui ?", "بگو.")); };
      rec.onend = () => { if (!rec._stop) { try { rec.start(); } catch { /* */ } } };
      rec.onerror = () => { /* gesture richiesta: riattiva col toggle */ };
      wakeRef.current = rec; rec.start();
    } catch { /* */ }
    return () => { try { rec && (rec._stop = true, rec.stop()); } catch { /* */ } };
    // eslint-disable-next-line
  }, []);

  useEffect(() => () => { try { wakeRef.current && (wakeRef.current._stop = true, wakeRef.current.stop()); } catch { /* */ } }, []);

  // Nasconde il FAB dove esiste già un controllo vocale dedicato (es. Mani In Pasta).
  useEffect(() => {
    const onFab = (e) => setHidden(!!(e.detail && e.detail.hide));
    window.addEventListener("mikilab-fab", onFab);
    return () => window.removeEventListener("mikilab-fab", onFab);
  }, []);

  // Mic gigante "Braccio": start/stop ascolto via eventi.
  useEffect(() => {
    const start = () => { if (!listening) runOnce(); };
    const stop = () => { try { recRef.current && recRef.current.stop(); } catch { /* */ } };
    window.addEventListener("mikilab-voice-start", start);
    window.addEventListener("mikilab-voice-stop", stop);
    return () => { window.removeEventListener("mikilab-voice-start", start); window.removeEventListener("mikilab-voice-stop", stop); };
  }, [listening]);

  // Hands-free: attiva/disattiva ascolto continuo (tasto ORECCHIO) via eventi + consegne turno.
  useEffect(() => {
    const on = () => { if (!wake) toggleWake(); };
    const off = () => { if (wake) toggleWake(); };
    window.addEventListener("mikilab-wake-on", on);
    window.addEventListener("mikilab-wake-off", off);
    return () => { window.removeEventListener("mikilab-wake-on", on); window.removeEventListener("mikilab-wake-off", off); };
    // eslint-disable-next-line
  }, [wake]);
  useEffect(() => {
    const cons = () => { const msg = handoverSummary(shiftGet(), tri); speak(msg); toast.success("📋 " + msg); };
    window.addEventListener("mikilab-consegne", cons);
    return () => window.removeEventListener("mikilab-consegne", cons);
    // eslint-disable-next-line
  }, [lang]);

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <>
      {/* Timer multipli attivi */}
      {timers.length > 0 && (
        <div data-testid="voice-timers" className="fixed bottom-48 right-3 z-50 space-y-1.5 max-w-[62vw]">
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

      {/* Onboarding rapido (nascosto in modalità Braccio/mani libere per non coprire i tasti) */}
      {onboard && !hidden && (
        <div data-testid="voice-onboard" className="fixed inset-x-3 bottom-28 z-[60] mx-auto max-w-sm rounded-2xl bg-[#161616] border border-[#ff6b00]/50 p-4 shadow-2xl">
          <button data-testid="voice-onboard-close" onClick={() => { setOnboard(false); try { localStorage.setItem("mikilab_voice_onboard", "1"); } catch { /* */ } }} className="absolute top-2 end-2 text-[#7E8A93] hover:text-white"><X className="w-4 h-4" /></button>
          <p className="font-display text-sm font-extrabold text-[#ff6b00] mb-2 flex items-center gap-1.5"><Mic className="w-4 h-4" /> Lab Voice <span className="text-[9px] font-bold bg-[#ff6b00] text-white px-1.5 py-0.5 rounded-full uppercase">Exclusive</span></p>
          <p className="text-[12.5px] text-[#C9D4DC] leading-snug mb-2">{tri("Comanda a voce, mani libere. Prova:", "Sprich, freihändig. Probier:", "Voice control, hands-free. Try:", "Control por voz. Prueba:", "Commande vocale. Essaie :", "کنترل صوتی. امتحان کن:")}</p>
          <ul className="text-[12px] text-[#AEB8BF] space-y-1 list-disc ps-4">
            <li>«{tri("Ehi Lab, timer autolisi 45 minuti", "Ehi Lab, Timer Autolyse 45 Minuten", "Ehi Lab, autolyse timer 45 minutes", "Ehi Lab, temporizador autólisis 45 minutos", "Ehi Lab, minuteur autolyse 45 minutes", "لب، تایمر اتولیز ۴۵ دقیقه")}»</li>
            <li>«{tri("Ehi Lab, crea una nuova ricetta: Baguette di Michele", "Ehi Lab, neues Rezept: Baguette", "Ehi Lab, create a new recipe: Baguette", "Ehi Lab, crea receta: Baguette", "Ehi Lab, crée une recette : Baguette", "لب، دستور جدید بساز: باگت")}»</li>
            <li>«{tri("Ehi Lab, l'impasto è a 26 gradi, come lo salvo?", "Ehi Lab, Teig 26 Grad, was tun?", "Ehi Lab, dough is 26°, how to fix?", "Ehi Lab, masa a 26°, ¿cómo la salvo?", "Ehi Lab, pâte à 26°, comment faire ?", "لب، خمیر ۲۶ درجه است، چطور نجاتش دهم؟")}» <span className="text-[9px] font-bold text-[#ff6b00]">Lab Sense</span></li>
            <li>«{tri("Ehi Lab, portami alla home", "Ehi Lab, bring mich zur Startseite", "Ehi Lab, take me home", "Ehi Lab, llévame al inicio", "Ehi Lab, ramène-moi à l'accueil", "لب، برو به خانه")}»</li>
          </ul>
        </div>
      )}

      {/* Tasto vocale compatto + wake + mute */}
      {!hidden && (
      <div className={`fixed bottom-24 right-3 z-40 flex flex-col items-end gap-2 transition-all duration-300 ${scrolling && !listening ? "translate-y-28 opacity-0 pointer-events-none" : "translate-y-0 opacity-100"}`} style={{ marginBottom: "env(safe-area-inset-bottom)" }}>
        {(listening || speaking) && (
          <div className="me-1">
            <SpeakingAvatar who="lab" active testid="lab-avatar" mode={speaking ? "speaking" : "listening"} size={50} />
          </div>
        )}
        <div className="flex items-center gap-2">
          <button data-testid="voice-mute-btn" onClick={() => { const nv = !muted; setMuted(nv); setTTSMuted(nv); toast.info(nv ? tri("Audio disattivato", "Ton aus", "Audio off", "Audio apagado", "Son coupé", "صدا خاموش") : tri("Audio attivo", "Ton an", "Audio on", "Audio activo", "Son activé", "صدا روشن")); }}
            title={muted ? "Audio OFF" : "Audio ON"}
            className={`w-10 h-10 rounded-full flex items-center justify-center border shadow-lg active:scale-95 transition-all ${muted ? "bg-[#161616] text-[#7E8A93] border-[#2C2C2C]" : "bg-[#161616] text-[#ff6b00] border-[#ff6b00]/50"}`}>
            {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <button data-testid="voice-wake-toggle" onClick={toggleWake} aria-label="Hands-free" title="Hands-free (Ehi Lab)"
            className={`relative w-14 h-14 rounded-full flex items-center justify-center border-2 shadow-2xl active:scale-95 transition-all text-2xl ${wake ? "bg-[#ff6b00] text-white border-[#ff6b00]" : "bg-[#161616] text-[#ff6b00] border-[#ff6b00]/60"}`}>
            {wake && <span aria-hidden className="absolute inset-0 rounded-full bg-[#ff6b00] opacity-50 animate-ping" />}
            <span className="relative">👂</span>
          </button>
        </div>
      </div>
      )}
    </>
  );
}
