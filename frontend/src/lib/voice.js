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

const FEMALE_HINTS = ["female", "femminile", "weiblich", "alice", "samantha", "victoria", "zira", "susan", "amelie", "anna", "paulina", "carla", "federica", "paola", "laura", "elsa", "google italiano", "google deutsch", "google uk english female", "catherine", "fiona", "serena", "allison", "ava", "tessa", "karen", "moira"];
const MALE_HINTS = /male|maschile|männlich|luca|diego|cosimo|paolo|marco|thomas|daniel|david|jorge|carlos|rocko|hans|yannick|matteo|giorgio|reed|aaron|fred|oliver|arthur/i;

function pickVoice(voices, target) {
  const t = target.toLowerCase();
  const pre = t.slice(0, 2);
  const byLang = voices.filter((v) => v.lang && v.lang.toLowerCase().startsWith(pre));
  const pool = byLang.length ? byLang : voices;
  const male = pool.find((v) => MALE_HINTS.test(v.name || ""));
  if (male) return male;
  const notFemale = pool.filter((v) => !FEMALE_HINTS.some((f) => (v.name || "").toLowerCase().includes(f)));
  return notFemale.find((v) => (v.lang || "").toLowerCase() === t)
    || notFemale[0]
    || pool.find((v) => (v.lang || "").toLowerCase() === t)
    || pool[0];
}

export function speak(text, lang = "it") {
  try {
    if (!("speechSynthesis" in window) || !text) return;
    const target = lang === "de" ? "de-DE" : lang === "en" ? "en-GB" : "it-IT";
    const u = new SpeechSynthesisUtterance(text);
    u.lang = target;
    u.rate = 0.95;   // leggermente piu lento = piu fluido
    u.pitch = 0.9;   // tono piu basso/maschile, meno robotico
    const voices = loadVoices();
    const match = pickVoice(voices, target);
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
