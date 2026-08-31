import { useState, useRef } from "react";
import { Mic, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { TOOLS } from "@/sections/PianoProduzioneAI";

const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
const SR_LANG = { it: "it-IT", de: "de-DE", en: "en-US", es: "es-ES", fr: "fr-FR", fa: "fa-IR" };

// Alias curati (parole brevi/comuni) → id strumento reale. Priorità sui nomi generici.
const TOOL_ALIASES = {
  timer: ["timer", "cronometro", "tempo di cottura"],
  acqua: ["temperatura acqua", "temp acqua", "acqua impasto", "water temp"],
  metodo: ["idratazione", "calcolo dosi", "parametri base", "hydration"],
  sequenze: ["sequenze", "orari impasto", "timing"],
  convlievito: ["convertitore lieviti", "converti lievito", "conversione lievito"],
  stampi: ["stampi", "teglie", "pirottini"],
  adatta: ["adatta forno", "adatta il forno"],
  energia: ["costo energia", "consumo forno"],
  capo: ["celle", "cella di lievitazione", "impastatrici", "controllo celle"],
  termo: ["termostato", "clima", "temperatura ambiente"],
  freezer: ["freezer", "congelatore", "giacenze freezer"],
  shelf: ["shelf life", "scadenze", "conservazione"],
  foodcost: ["costi e margine", "food cost", "margine", "prezzi", "costo ricetta"],
  mydata: ["i miei dati", "fornitori", "listini"],
  macchine: ["parco macchine", "macchine", "manutenzione"],
  diagnosi: ["diagnosi foto", "analizza foto", "diagnosi"],
  suono: ["diagnosi suono", "ascolta impasto"],
  sosimpasto: ["sos impasto", "impasto difficile", "aiuto impasto"],
  ph: ["registro lievito madre", "pasta madre", "rinfreschi", "ph"],
  bancalievito: ["banca del lievito", "banca lievito"],
  sessioni: ["diario impasti", "storico impasti"],
  check: ["checklist", "controlli", "apertura chiusura"],
  aggiungi: ["inserisci ricetta", "aggiungi ricetta", "nuova ricetta"],
  custodite: ["le mie ricette", "ricette custodite", "ricettario", "mie ricette"],
  webrecipe: ["cerca ricetta", "cerca e adatta", "trova ricetta", "adatta ricetta"],
  generatore: ["generatore ricette", "genera ricetta"],
  scanflour: ["scanner farina", "scansiona farina"],
  trovafarina: ["conversione farine", "trova farina", "compara farina"],
  labpizzeria: ["pizzeria", "laboratorio pizzeria", "pizza"],
  labpasticceria: ["pasticceria", "laboratorio pasticceria", "gelateria", "dolci"],
  bilancia: ["bilancia", "bilancia smart"],
  pesata: ["pesata guidata", "pesa ingredienti"],
  twin: ["digital twin", "gemello digitale"],
  fermentazione: ["fermentazione predittiva", "fermentazione"],
  weatherbaker: ["meteo", "umidita", "weather baker"],
  simforno: ["vapore", "gestione forno", "simulatore forno"],
  timelapse: ["time lapse", "raddoppio"],
  esuberozero: ["esubero", "zero sprechi"],
  recupero: ["recupero", "angolo recupero"],
  spreco: ["anti spreco", "spreco"],
  saporicasa: ["sapori di casa", "sapori casa"],
  cantiere: ["ricetta di cantiere", "cantiere", "pdf ricetta"],
  cosafare: ["cosa posso fare", "cosa faccio"],
  manisporche: ["mani sporche", "mani infarinate"],
};

// Frasi di navigazione (cambio tab) → evento globale mikilab-goto.
const NAV = [
  { tab: "ricette", kw: ["ricette", "recipes", "rezepte", "recetas", "ricettario mikilab"] },
  { tab: "impara", kw: ["impara", "academy", "corsi", "lezioni", "learn", "aprender"] },
  { tab: "community", kw: ["social", "community", "comunita", "amici"] },
  { tab: "home", kw: ["home", "casa", "inizio", "pagina iniziale", "start"] },
];

export default function VoiceCommand({ onOpenTool }) {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const name = (tl) => norm(mkTri(lang)(tl.it, tl.de, tl.en, tl.es));
  const [listening, setListening] = useState(false);
  const recRef = useRef(null);

  const stripVerbs = (t) => t
    .replace(/\b(aprimi|apri|apre|vai alle|vai alla|vai al|vai ai|vai a|portami|mostrami|mostra|voglio|open|go to|show me|show|abre|ir a|offne|öffne|zeige|zeig mir|zeig)\b/g, " ")
    .replace(/\s+/g, " ").trim();

  const speak = (text) => { try { const u = new SpeechSynthesisUtterance(text); u.lang = SR_LANG[lang] || "it-IT"; window.speechSynthesis.cancel(); window.speechSynthesis.speak(u); } catch { /* */ } };

  // Calcolo vocale: "500 g farina 70% idratazione" → acqua+sale a voce. Ritorna true se gestito.
  const tryCalc = (t, raw) => {
    if (!/(farina|flour|mehl|harina)/.test(t)) return false;
    const pct = t.match(/(\d{1,3})\s*(?:%|per ?cento|percent|prozent|por ?ciento)/) || t.match(/(?:idrataz\w*|hydrat\w*)\D{0,6}(\d{1,3})/);
    const hyd = pct ? parseInt(pct[1], 10) : null;
    if (!hyd) return false;
    const kg = /(kg|chil|kilo)/.test(t);
    let flour = null;
    const fm = t.match(/(\d+(?:[.,]\d+)?)\s*(?:kg|chil\w*|kilo\w*|g|gr|grammi|gramm|grams)?\s*(?:di\s+)?(?:farina|flour|mehl|harina)/);
    if (fm) flour = parseFloat(fm[1].replace(",", "."));
    else { const nums = (t.match(/\d+(?:[.,]\d+)?/g) || []).map((x) => parseFloat(x.replace(",", "."))); flour = nums.find((n) => n !== hyd) ?? null; }
    if (!flour) return false;
    if (kg && flour < 100) flour *= 1000;
    const water = Math.round(flour * hyd / 100);
    const salt = Math.round(flour * 0.02);
    const msg = tri(
      `Con ${flour} g di farina al ${hyd}% servono ${water} g di acqua e circa ${salt} g di sale.`,
      `Bei ${flour} g Mehl mit ${hyd}%: ${water} g Wasser und ca. ${salt} g Salz.`,
      `With ${flour} g flour at ${hyd}%: ${water} g water and about ${salt} g salt.`,
      `Con ${flour} g de harina al ${hyd}%: ${water} g de agua y unos ${salt} g de sal.`,
      `Avec ${flour} g de farine à ${hyd}% : ${water} g d'eau et environ ${salt} g de sel.`,
      `با ${flour} گرم آرد و ${hyd}٪: ${water} گرم آب و حدود ${salt} گرم نمک.`);
    toast.success(msg); speak(msg); return true;
  };

  const handle = (raw) => {
    const t = norm(raw);
    const c = stripVerbs(t);
    if (tryCalc(t, raw)) return;
    // 1) alias curati
    for (const [id, kws] of Object.entries(TOOL_ALIASES)) {
      if (kws.some((k) => t.includes(k) || c.includes(k))) { open(id); return; }
    }
    // 2) navigazione tab
    for (const n of NAV) {
      if (n.kw.some((k) => c === k || c.includes(k))) { goto(n.tab, raw); return; }
    }
    // 3) nome strumento generico
    let best = null;
    for (const tl of TOOLS) {
      const nm = name(tl);
      if (nm && (c.includes(nm) || nm.includes(c)) && (!best || nm.length > best.len)) best = { id: tl.id, len: nm.length };
    }
    if (best) { open(best.id); return; }
    toast.error(tri(`Non ho capito: "${raw}"`, `Nicht verstanden: "${raw}"`, `Didn't catch: "${raw}"`, `No entendí: "${raw}"`, `Pas compris : "${raw}"`, `متوجه نشدم: "${raw}"`));
  };

  const open = (id) => {
    const tl = TOOLS.find((x) => x.id === id);
    const label = tl ? mkTri(lang)(tl.it, tl.de, tl.en, tl.es) : id;
    toast.success(tri(`Apro: ${label}`, `Öffne: ${label}`, `Opening: ${label}`, `Abriendo: ${label}`, `J'ouvre : ${label}`, `باز می‌کنم: ${label}`));
    if (onOpenTool) onOpenTool(id);
    else { try { window.dispatchEvent(new CustomEvent("mikilab-open-lab-tool", { detail: { id } })); } catch { /* */ } }
  };

  const goto = (tab, raw) => {
    toast.success(tri(`Vado a: ${raw}`, `Gehe zu: ${raw}`, `Going to: ${raw}`, `Voy a: ${raw}`, `Je vais : ${raw}`, `می‌روم به: ${raw}`));
    try { window.dispatchEvent(new CustomEvent("mikilab-goto", { detail: { tab } })); } catch { /* */ }
  };

  const start = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      toast.error(tri("Comandi vocali non supportati da questo browser. Usa Chrome/Safari.", "Sprachbefehle in diesem Browser nicht unterstützt.", "Voice commands not supported in this browser. Use Chrome/Safari.", "Comandos de voz no soportados en este navegador.", "Commandes vocales non prises en charge par ce navigateur.", "فرمان صوتی در این مرورگر پشتیبانی نمی‌شود."));
      return;
    }
    if (listening) { try { recRef.current && recRef.current.stop(); } catch { /* */ } return; }
    const rec = new SR();
    rec.lang = SR_LANG[lang] || "it-IT";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onstart = () => setListening(true);
    rec.onerror = (e) => {
      setListening(false);
      if (e && e.error === "not-allowed") toast.error(tri("Permesso microfono negato.", "Mikrofon-Zugriff verweigert.", "Microphone permission denied.", "Permiso de micrófono denegado.", "Micro refusé.", "دسترسی میکروفون رد شد."));
    };
    rec.onend = () => setListening(false);
    rec.onresult = (e) => {
      const transcript = e.results && e.results[0] && e.results[0][0] ? e.results[0][0].transcript : "";
      if (transcript) handle(transcript);
    };
    recRef.current = rec;
    try { rec.start(); } catch { /* */ }
  };

  return (
    <button data-testid="voice-command-btn" onClick={start}
      className={`fixed bottom-24 right-4 z-50 h-20 px-7 rounded-full text-white font-extrabold text-lg shadow-2xl flex items-center gap-3 ring-4 active:scale-95 transition-all ${listening ? "bg-[#e05e00] ring-[#ff6b00]/60 animate-pulse" : "bg-[#ff6b00] hover:bg-[#e05e00] ring-[#ff6b00]/30 animate-[pulse_2.5s_ease-in-out_infinite]"}`}>
      {listening ? <Loader2 className="w-8 h-8 animate-spin" /> : <Mic className="w-8 h-8" />}
      {listening ? tri("Ascolto…", "Ich höre…", "Listening…", "Escuchando…", "J'écoute…", "می‌شنوم…") : tri("Voce", "Stimme", "Voice", "Voz", "Voix", "صدا")}
    </button>
  );
}
