import { speak as speakFree, stopSpeak } from "@/lib/voice";

let _audio = null;

export function stopTTS() {
  try { if (_audio) { _audio.pause(); _audio = null; } } catch { /* */ }
  stopSpeak();
}

// Legge un testo con la voce MASCHILE GRATUITA del dispositivo (nessuna voce premium).
export async function playTTS(text, { lang = "it", onEnded } = {}) {
  stopTTS();
  if (!text) { if (onEnded) onEnded(); return; }
  speakFree(text, lang, onEnded);
}
