import { cleanForSpeech } from "@/lib/voice";

// TTS: voce MASCHILE OpenAI (onyx/echo) dal backend; fallback alla voce nativa del
// dispositivo se l'API non risponde, così la voce non va MAI in blocco.
const API = process.env.REACT_APP_BACKEND_URL;
const SR_LANG = { it: "it-IT", de: "de-DE", en: "en-US", es: "es-ES", fr: "fr-FR", fa: "fa-IR" };

let _voices = [];
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
const FEMALE_HINTS = ["female", "femme", "weiblich", "mujer", "donna", "femmin", "masculin", "samantha", "alice", "elsa", "paola", "federica", "karen", "zira", "lucia", "aria", "victoria", "amelie", "amélie", "anna", "monica", "mónica", "paulina", "sara", "laura", "helena", "catherine", "fiona", "moira", "tessa", "veena", "yuna", "google.*female"]
  .filter((h) => h !== "masculin");

// Sceglie una voce del dispositivo MASCHILE nella lingua dell'app; voce distinta per Momi.
function pickVoice(lang, persona) {
  if (!_voices.length) loadVoices();
  const code = (SR_LANG[lang] || "it-IT").slice(0, 2);
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
  const pool = byName.length ? byName : (byWord.length ? byWord : (notFemale.length ? notFemale : cands));
  // Momi = voce maschile DIVERSA da Michele quando possibile.
  if ((persona === "momy" || persona === "momi") && pool.length > 1) return pool[1];
  return pool[0];
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
export function stopTTS() {
  try { if (_audio) { _audio.pause(); _audio.src = ""; _audio = null; } } catch { /* */ }
  try { window.speechSynthesis.cancel(); } catch { /* */ }
}

// Voce nativa del dispositivo (fallback): lingua dell'app + timbro sempre maschile.
function nativeSpeak(clean, lang, voice, onStart, onEnded) {
  try {
    const u = new SpeechSynthesisUtterance(clean);
    u.lang = SR_LANG[lang] || "it-IT";
    const v = pickVoice(lang, voice);
    if (v) u.voice = v;
    // Timbro maschile: Michele più profondo, Momi maschile ma leggermente più chiaro.
    if (voice === "michele" || voice === "lab") { u.pitch = 0.85; u.rate = 1.06; }
    else { u.pitch = 0.92; u.rate = 0.98; }
    u.onstart = () => { if (onStart) onStart(); };
    u.onend = () => { if (onEnded) onEnded(); };
    u.onerror = () => { if (onEnded) onEnded(); };
    window.speechSynthesis.speak(u);
  } catch { if (onEnded) onEnded(); }
}

// voice: "michele" (Lab, onyx) | "momy" (Momi, echo)
export function playTTS(text, { lang = "it", voice = "momy", onStart, onEnded } = {}) {
  stopTTS();
  const full = cleanForSpeech(text);
  if (!full) { if (onEnded) onEnded(); return; }
  const clean = shortenForSpeech(full); // solo sintesi breve → meno crediti + voce essenziale
  _lastText = clean;
  if (isTTSMuted()) { if (onEnded) onEnded(); return; } // Mute: solo testo a schermo

  if (!API) { nativeSpeak(clean, lang, voice, onStart, onEnded); return; }

  let started = false;
  fetch(`${API}/api/tts/speak`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: clean, lang, voice }),
  })
    .then((r) => { if (!r.ok) throw new Error("tts"); return r.blob(); })
    .then((blob) => {
      if (isTTSMuted()) { if (onEnded) onEnded(); return; }
      const url = URL.createObjectURL(blob);
      const a = new Audio(url);
      _audio = a;
      a.onplay = () => { started = true; if (onStart) onStart(); };
      a.onended = () => { try { URL.revokeObjectURL(url); } catch { /* */ } if (_audio === a) _audio = null; if (onEnded) onEnded(); };
      a.onerror = () => { try { URL.revokeObjectURL(url); } catch { /* */ } if (_audio === a) _audio = null; if (!started) nativeSpeak(clean, lang, voice, onStart, onEnded); else if (onEnded) onEnded(); };
      a.play().catch(() => { if (!started) nativeSpeak(clean, lang, voice, onStart, onEnded); });
    })
    .catch(() => nativeSpeak(clean, lang, voice, onStart, onEnded));
}
