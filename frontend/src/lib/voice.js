// Avvisi vocali gratuiti tramite la voce integrata del dispositivo (Web Speech API).
// Funziona offline, in italiano (it-IT) e tedesco (de-DE).
let voicesReady = false;

function loadVoices() {
  if (!("speechSynthesis" in window)) return [];
  const v = window.speechSynthesis.getVoices();
  if (v && v.length) voicesReady = true;
  return v || [];
}

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

export function speak(text, lang = "it") {
  try {
    if (!("speechSynthesis" in window) || !text) return;
    const target = lang === "de" ? "de-DE" : lang === "en" ? "en-GB" : "it-IT";
    const u = new SpeechSynthesisUtterance(text);
    u.lang = target;
    u.rate = 1;
    u.pitch = 1;
    const voices = loadVoices();
    const match =
      voices.find((x) => x.lang && x.lang.toLowerCase() === target.toLowerCase()) ||
      voices.find((x) => x.lang && x.lang.toLowerCase().startsWith(target.slice(0, 2)));
    if (match) u.voice = match;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch {
    /* voce non disponibile */
  }
}

// Sblocca la sintesi vocale su iOS/Safari (richiede un gesto utente).
export function primeVoice() {
  try {
    if (!("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance("");
    u.volume = 0;
    window.speechSynthesis.speak(u);
    loadVoices();
  } catch {
    /* ignore */
  }
}
