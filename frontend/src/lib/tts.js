import { cleanForSpeech } from "@/lib/voice";

// Sintesi vocale 100% nativa del dispositivo (SpeechSynthesis) — nessun servizio esterno.
// Tono differenziato: Mickey Lab (deciso/telegrafico) vs Momi (caldo/descrittivo).
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
  // Entrambe le voci sono MASCHILI (Michele e Mohamed). Preferisci voci maschili.
  const males = cands.filter((v) => male.test(v.name)) ;
  const pool = males.length ? males : cands.filter((v) => !female.test(v.name));
  const list = pool.length ? pool : cands;
  // Momi/Mohamed: usa una seconda voce maschile se disponibile, per distinguerlo da Lab.
  if (persona === "momy" || persona === "momi") return list[1] || list[0];
  return list[0];
}

export const isTTSMuted = () => { try { return localStorage.getItem("mikilab_voice_muted") === "1"; } catch { return false; } };
export function setTTSMuted(v) {
  try { localStorage.setItem("mikilab_voice_muted", v ? "1" : "0"); } catch { /* */ }
  if (v) stopTTS();
  window.dispatchEvent(new CustomEvent("mikilab-tts-muted", { detail: { muted: !!v } }));
}

export function stopTTS() { try { window.speechSynthesis.cancel(); } catch { /* */ } }

// voice: "michele" (Lab) | "momy" (Momi)
export function playTTS(text, { lang = "it", voice = "momy", onStart, onEnded } = {}) {
  stopTTS();
  const clean = cleanForSpeech(text);
  if (!clean) { if (onEnded) onEnded(); return; }
  if (isTTSMuted()) { if (onEnded) onEnded(); return; } // Mute: solo testo a schermo
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
