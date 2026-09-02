import { cleanForSpeech } from "@/lib/voice";

// TTS: voce MASCHILE OpenAI (onyx/echo) dal backend; fallback alla voce nativa del
// dispositivo se l'API non risponde, così la voce non va MAI in blocco.
const API = process.env.REACT_APP_BACKEND_URL;
const SR_LANG = { it: "it-IT", de: "de-DE", en: "en-US", es: "es-ES", fr: "fr-FR", fa: "fa-IR" };

let _voices = [];
function loadVoices() { try { _voices = window.speechSynthesis.getVoices() || []; } catch { _voices = []; } }
loadVoices();
try { window.speechSynthesis.onvoiceschanged = loadVoices; } catch { /* */ }

function pickVoice(lang, persona) {
  if (!_voices.length) loadVoices();
  const code = (SR_LANG[lang] || "it-IT").slice(0, 2);
  const cands = _voices.filter((v) => v.lang && v.lang.toLowerCase().startsWith(code));
  if (!cands.length) return null;
  const female = /female|donna|femmin|samantha|alice|elsa|paola|federica|karen|zira|lucia|aria|google.*italiano/i;
  const male = /male|uomo|masch|luca|diego|cosimo|giorgio|paolo|david|thomas|carlo|marco|alessandro/i;
  const males = cands.filter((v) => male.test(v.name));
  const pool = males.length ? males : cands.filter((v) => !female.test(v.name));
  const list = pool.length ? pool : cands;
  if (persona === "momy" || persona === "momi") return list[1] || list[0];
  return list[0];
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

let _audio = null;
export function stopTTS() {
  try { if (_audio) { _audio.pause(); _audio.src = ""; _audio = null; } } catch { /* */ }
  try { window.speechSynthesis.cancel(); } catch { /* */ }
}

// Voce nativa del dispositivo (fallback).
function nativeSpeak(clean, lang, voice, onStart, onEnded) {
  try {
    const u = new SpeechSynthesisUtterance(clean);
    u.lang = SR_LANG[lang] || "it-IT";
    const v = pickVoice(lang, voice);
    if (v) u.voice = v;
    if (voice === "michele" || voice === "lab") { u.pitch = 0.9; u.rate = 1.08; }
    else { u.pitch = 1.0; u.rate = 0.97; }
    u.onstart = () => { if (onStart) onStart(); };
    u.onend = () => { if (onEnded) onEnded(); };
    u.onerror = () => { if (onEnded) onEnded(); };
    window.speechSynthesis.speak(u);
  } catch { if (onEnded) onEnded(); }
}

// voice: "michele" (Lab, onyx) | "momy" (Momi, echo)
export function playTTS(text, { lang = "it", voice = "momy", onStart, onEnded } = {}) {
  stopTTS();
  const clean = cleanForSpeech(text);
  if (!clean) { if (onEnded) onEnded(); return; }
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
