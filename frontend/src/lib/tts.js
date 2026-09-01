import { API } from "@/lib/api";
import { cleanForSpeech } from "@/lib/voice";

let _audio = null;
const SR_LANG = { it: "it-IT", de: "de-DE", en: "en-US", es: "es-ES", fr: "fr-FR", fa: "fa-IR" };

export function stopTTS() {
  try { if (_audio) { _audio.pause(); _audio = null; } } catch { /* */ }
  try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch { /* */ }
}

// Fallback: voce gratuita del dispositivo (se ElevenLabs non risponde).
function freeFallback(text, lang, onStart, onEnded) {
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = SR_LANG[lang] || "it-IT";
    u.rate = 1.02;
    u.onstart = () => { if (onStart) onStart(); };
    u.onend = () => { if (onEnded) onEnded(); };
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch { if (onEnded) onEnded(); }
}

// Legge un testo con la voce umana ElevenLabs. voice: "michele" (Lab) | "momy" (Momi).
export async function playTTS(text, { lang = "it", voice = "momy", onStart, onEnded } = {}) {
  stopTTS();
  const clean = cleanForSpeech(text);
  if (!clean) { if (onEnded) onEnded(); return; }
  try {
    const res = await fetch(`${API}/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ text: clean, lang, voice }),
    });
    if (!res.ok) throw new Error("tts");
    const blob = await res.blob();
    if (!blob || blob.size < 200) throw new Error("empty");
    const a = new Audio(URL.createObjectURL(blob));
    _audio = a;
    a.onplay = () => { if (onStart) onStart(); };
    a.onended = () => { if (onEnded) onEnded(); };
    a.onerror = () => { if (onEnded) onEnded(); };
    await a.play();
  } catch {
    freeFallback(clean, lang, onStart, onEnded);
  }
}
