import { cleanForSpeech } from "@/lib/voice";

// TTS: voce MASCHILE OpenAI (onyx/echo) dal backend; fallback alla voce nativa del
// dispositivo se l'API non risponde, così la voce non va MAI in blocco.
const API = process.env.REACT_APP_BACKEND_URL;
let _longToken = 0; // V111: lettura lunga (schede di scuola), si azzera con stopTTS
const SR_LANG = { it: "it-IT", de: "de-DE", en: "en-US", es: "es-ES", fr: "fr-FR", fa: "fa-IR", ar: "ar-SA", tr: "tr-TR" };

// Normalizza qualunque codice lingua (it, de-DE, EN_us…) nel BCP-47 nativo corretto per la
// sintesi vocale. Le lingue non mappate ricadono su un codice regionale sensato (es. pt → pt-PT)
// invece di forzare sempre l'italiano: così le lingue straniere non vengono più lette a caso.
export function toBCP47(lang) {
  const base = String(lang || "").toLowerCase().split(/[-_]/)[0];
  if (!base) return "it-IT";
  return SR_LANG[base] || `${base}-${base.toUpperCase()}`;
}

let _voices = [];
// Lingua CORRENTE dell'app: la voce audio deve SEMPRE combaciare col testo a schermo.
let _appLang = (() => { try { return localStorage.getItem("mikilab_lang") || "it"; } catch { return "it"; } })();
export function setTTSAppLang(l) { if (l) _appLang = String(l).toLowerCase().split(/[-_]/)[0]; }
export function getTTSAppLang() { return _appLang; }
function loadVoices() { try { _voices = window.speechSynthesis.getVoices() || []; } catch { _voices = []; } }
loadVoices();
try { window.speechSynthesis.onvoiceschanged = loadVoices; } catch { /* */ }

// Nomi tipici di voci MASCHILI per lingua (per scegliere sempre un timbro maschile).
const MALE_HINTS = {
  it: ["luca", "diego", "cosimo", "giorgio", "paolo", "carlo", "marco", "alessandro", "roberto", "male", "uomo", "maschile"],
  en: ["david", "mark", "guy", "alex", "daniel", "james", "george", "fred", "aaron", "arthur", "oliver", "ryan", "male", "english male"],
  de: ["stefan", "conrad", "markus", "yannick", "hans", "male", "männlich", "deutsch male"],
  es: ["jorge", "diego", "carlos", "juan", "enrique", "pablo", "miguel", "male", "masculino"],
  fr: ["thomas", "henri", "paul", "nicolas", "male", "masculin", "français male"],
  fa: ["farid", "reza", "dariush", "male", "مرد"],
};
const FEMALE_HINTS = ["female", "femme", "weiblich", "mujer", "donna", "femmin", "masculin", "samantha", "alice", "elsa", "paola", "federica", "karen", "zira", "lucia", "aria", "victoria", "amelie", "amélie", "anna", "monica", "mónica", "paulina", "sara", "laura", "helena", "catherine", "fiona", "moira", "tessa", "veena", "yuna", "carla", "google italiano", "google.*female"]
  .filter((h) => h !== "masculin");

// Sceglie una voce del dispositivo MASCHILE nella lingua dell'app.
// REGOLA FERREA (voce unica di Sitor): se non esiste NESSUNA voce maschile reale,
// ritorna null → non si parla affatto (meglio muti che una voce femminile).
function pickVoice(lang) {
  if (!_voices.length) loadVoices();
  const code = toBCP47(lang).slice(0, 2);
  let cands = _voices.filter((v) => v.lang && v.lang.toLowerCase().startsWith(code));
  if (!cands.length) cands = _voices;
  if (!cands.length) return null;
  const name = (v) => (v.name || "").toLowerCase();
  const isFemale = (v) => FEMALE_HINTS.some((h) => new RegExp(h, "i").test(name(v)));
  const isMaleWord = (v) => /\bmale\b|männlich|masculin|masculino|maschile|uomo|homme|hombre|mard|مرد/i.test(name(v)) || /male/i.test((v.voiceURI || "").toLowerCase());
  const hints = MALE_HINTS[code] || MALE_HINTS.en;
  const byName = cands.filter((v) => hints.some((h) => name(v).includes(h)) && !isFemale(v));
  const byWord = cands.filter((v) => isMaleWord(v) && !isFemale(v));
  const notFemale = cands.filter((v) => !isFemale(v));
  // Solo pool di voci NON femminili. Niente fallback su `cands` (che includerebbe voci femminili).
  const pool = byName.length ? byName : (byWord.length ? byWord : notFemale);
  // V120: se il telefono non ha voci maschili, Sitor parla con la voce che c'è (meglio che restare muto)
  return pool.length ? pool[0] : (cands[0] || null);
}

export const isTTSMuted = () => { try { return localStorage.getItem("mikilab_voice_muted") === "1"; } catch { return false; } };
export function setTTSMuted(v) {
  try { localStorage.setItem("mikilab_voice_muted", v ? "1" : "0"); } catch { /* */ }
  if (v) stopTTS();
  window.dispatchEvent(new CustomEvent("mikilab-tts-muted", { detail: { muted: !!v } }));
}

// Ultima frase pronunciata (per il comando vocale «Ehi Lab, ripeti»).
let _lastText = "";
export const getLastTTS = () => _lastText;

// OTTIMIZZAZIONE CREDITI: l'avatar pronuncia solo 1-2 frasi essenziali; i dettagli restano a schermo.
export function shortenForSpeech(text, maxChars = 180, maxSentences = 2) {
  let t = (text || "").replace(/\s+/g, " ").trim();
  if (!t) return "";
  if (t.length <= maxChars) return t;
  const parts = t.split(/(?<=[.!?…])\s+/);
  let out = "";
  let sentences = 0;
  for (const p of parts) {
    if (out && (out.length + 1 + p.length) > maxChars) break;
    out = out ? out + " " + p : p;
    sentences += 1;
    if (sentences >= maxSentences) break;
  }
  if (!out) out = t.slice(0, maxChars);
  if (out.length > maxChars) out = out.slice(0, maxChars).replace(/\s+\S*$/, "").trim() + "…";
  return out.trim();
}

let _audio = null;
let _ttsActive = false;
function ttsSignalStart() { if (_ttsActive) return; _ttsActive = true; try { window.dispatchEvent(new Event("mikilab-tts-start")); } catch { /* */ } }
function ttsSignalEnd() { if (!_ttsActive) return; _ttsActive = false; try { window.dispatchEvent(new Event("mikilab-tts-end")); } catch { /* */ } }

export function stopTTS() {
  _longToken++; // V111: ferma anche la lettura lunga
  try { if (_audio) { _audio.pause(); _audio.src = ""; _audio = null; } } catch { /* */ }
  try { window.speechSynthesis.cancel(); } catch { /* */ }
  ttsSignalEnd();
}

// Voce nativa del dispositivo (fallback): UNICA voce di Sitor, sempre maschile.
// Se il dispositivo NON ha alcuna voce maschile reale, NON parla (solo testo a schermo):
// non si ripiega MAI su una voce femminile.
// V93: la voce del server (a pagamento) si usa solo se accesa dall'admin nella pagina Costi (FEATURE_VOICE_SERVER).
function serverVoiceOn() { try { return !!(window.__mikilabFeatures && window.__mikilabFeatures.FEATURE_VOICE_SERVER); } catch { return false; } }
// V93: testo ancora in italiano (ricetta non tradotta) con app in DE/EN → meglio la voce italiana che un tedesco che legge italiano.
function guessLang(text, lang) {
  if (lang === "it") return lang;
  const n = ` ${String(text).toLowerCase()} `;
  const it = [" il ", " la ", " di ", " che ", " con ", " per ", " una ", " gli ", " nel ", " dell", " farina ", " impasto ", " lievito "].filter((w) => n.includes(w)).length;
  const other = (lang === "de" ? [" der ", " die ", " und ", " mit ", " den ", " ist ", " nicht ", " mehl ", " teig "] : [" the ", " and ", " with ", " is ", " of ", " to ", " flour ", " dough "]).filter((w) => n.includes(w)).length;
  return it >= 3 && it > other * 2 ? "it" : lang;
}
function nativeSpeak(clean, lang, voice, onStart, onEnded) {
  try {
    lang = guessLang(clean, lang); // V93
    const v = pickVoice(lang);
    // V120: nessuna voce caricata → la voce predefinita del telefono nella lingua giusta
    const u = new SpeechSynthesisUtterance(clean);
    u.lang = toBCP47(lang);
    if (v) u.voice = v;
    // Timbro UNICO di Sitor (grave, autorevole) per ogni chiamata del sito.
    u.pitch = 0.85; u.rate = 1.08; // V75: meno cupo e un po' più veloce (meno robotico)
    try { if (localStorage.getItem("mikilab_modo_notte") === "1") u.volume = 0.55; } catch { /* V86: modo notte, Sitor sussurra */ }
    u.onstart = () => { ttsSignalStart(); if (onStart) onStart(); };
    u.onend = () => { ttsSignalEnd(); if (onEnded) onEnded(); };
    u.onerror = () => { ttsSignalEnd(); if (onEnded) onEnded(); };
    window.speechSynthesis.speak(u);
  } catch { ttsSignalEnd(); if (onEnded) onEnded(); }
}

// VOCE UNICA DEL SITO: Sitor. Qualunque persona storica (michele/momy/mikemix/bakemix/nexus…)
// viene ricondotta a un'unica voce maschile onyx lato server e a un unico timbro nel fallback.
const SITOR_VOICE = "nexus";

// voice: parametro storico ignorato → tutto il sito parla con la sola voce di Sitor.
export function playTTS(text, { lang, voice, onStart, onEnded } = {}) {
  stopTTS();
  const L = lang || _appLang || "it"; // se il chiamante non passa la lingua, usa quella dell'app
  const full = cleanForSpeech(text);
  if (!full) { if (onEnded) onEnded(); return; }
  const clean = shortenForSpeech(full); // solo sintesi breve → meno crediti + voce essenziale
  _lastText = clean;
  if (isTTSMuted()) { if (onEnded) onEnded(); return; } // Mute: solo testo a schermo
  const vEff = SITOR_VOICE; // voce unica, ignora `voice`

  if (!API || !serverVoiceOn()) { nativeSpeak(clean, L, vEff, onStart, onEnded); return; } // V93: gratis di default

  let started = false;
  fetch(`${API}/api/tts/speak`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: clean, lang: L, voice: vEff }),
  })
    .then((r) => { if (!r.ok) throw new Error("tts"); return r.blob(); })
    .then((blob) => {
      if (isTTSMuted()) { if (onEnded) onEnded(); return; }
      const url = URL.createObjectURL(blob);
      const a = new Audio(url);
      _audio = a;
      a.onplay = () => { started = true; ttsSignalStart(); if (onStart) onStart(); };
      a.onended = () => { try { URL.revokeObjectURL(url); } catch { /* */ } if (_audio === a) _audio = null; ttsSignalEnd(); if (onEnded) onEnded(); };
      a.onerror = () => { try { URL.revokeObjectURL(url); } catch { /* */ } if (_audio === a) _audio = null; if (!started) nativeSpeak(clean, L, vEff, onStart, onEnded); else { ttsSignalEnd(); if (onEnded) onEnded(); } };
      a.play().catch(() => { if (!started) nativeSpeak(clean, L, vEff, onStart, onEnded); });
    })
    .catch(() => nativeSpeak(clean, L, vEff, onStart, onEnded));
}

// V111 — LETTURA LUNGA (schede di MikiLab a scuola, capitoli de Il pane dei piccoli): testo intero, a pezzi, con la voce
// nativa del dispositivo e le stesse regole di Sitor (voce maschile o muto, mute, modo notte). Mai il server: zero crediti.
export function playTTSLong(text, { lang, onStart, onEnded } = {}) {
  stopTTS();
  const L = lang || _appLang || "it";
  const full = cleanForSpeech(text);
  if (!full || isTTSMuted()) { if (onEnded) onEnded(); return; }
  _lastText = full.slice(0, 180);
  const parts = full.split(/(?<=[.!?…:;])\s+/).reduce((acc, p) => { const last = acc[acc.length - 1]; if (last && (last.length + p.length) < 220) acc[acc.length - 1] = last + " " + p; else acc.push(p); return acc; }, []);
  const token = ++_longToken;
  let started = false;
  const next = (i) => {
    if (token !== _longToken) return; // fermata da stopTTS o da un'altra lettura
    if (i >= parts.length) { if (onEnded) onEnded(); return; }
    nativeSpeak(parts[i], L, SITOR_VOICE, () => { if (!started) { started = true; if (onStart) onStart(); } }, () => next(i + 1));
  };
  next(0);
}
