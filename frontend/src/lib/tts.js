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
  const female = /female|donna|femmin|samantha|alice|aria|elsa|paola|federica|karen|zira|lucia|google italiano/i;
  const male = /male|uomo|masch|luca|diego|cosimo|giorgio|paolo|david|marco|thomas/i;
  if (persona === "momy" || persona === "momi") return cands.find((v) => female.test(v.name)) || cands[0];
  return cands.find((v) => male.test(v.name)) || cands[0];
}

export function stopTTS() { try { window.speechSynthesis.cancel(); } catch { /* */ } }

// voice: "michele" (Lab) | "momy" (Momi)
export function playTTS(text, { lang = "it", voice = "momy", onStart, onEnded } = {}) {
  stopTTS();
  const clean = cleanForSpeech(text);
  if (!clean) { if (onEnded) onEnded(); return; }
  try {
    const u = new SpeechSynthesisUtterance(clean);
    u.lang = SR_LANG[lang] || "it-IT";
    const v = pickVoice(lang, voice);
    if (v) u.voice = v;
    if (voice === "michele" || voice === "lab") { u.pitch = 0.85; u.rate = 1.1; }
    else { u.pitch = 1.08; u.rate = 0.98; }
    u.onstart = () => { if (onStart) onStart(); };
    u.onend = () => { if (onEnded) onEnded(); };
    u.onerror = () => { if (onEnded) onEnded(); };
    window.speechSynthesis.speak(u);
  } catch { if (onEnded) onEnded(); }
}
