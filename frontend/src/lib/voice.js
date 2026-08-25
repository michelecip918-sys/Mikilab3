// Voce disattivata in tutta l'app: gli avatar comunicano SOLO per iscritto (fumetto).
// Manteniamo le firme delle funzioni per non rompere gli import esistenti.

export function speak() { /* no-op: nessuna sintesi vocale */ }

export function stopSpeak() {
  try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch { /* */ }
}

export function primeVoice() { /* no-op */ }

// Pulisce il testo (utile per altri usi testuali): rimuove markdown/emoji/simboli.
export function cleanForSpeech(text) {
  return (text || "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FE0F}\u{200D}]/gu, " ")
    .replace(/^[ \t]*\d+[.)]\s+/gm, "")
    .replace(/^[ \t]*[-*+•·–—]\s+/gm, "")
    .replace(/[#*_~>|•·►▪◦]/g, " ")
    .replace(/[«»"“”]/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}
