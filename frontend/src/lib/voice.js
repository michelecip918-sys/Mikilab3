// Voce disattivata in tutta l'app: gli avatar comunicano SOLO per iscritto (fumetto).
// Manteniamo le firme delle funzioni per non rompere gli import esistenti.

export function speak() { /* no-op: nessuna sintesi vocale */ }

export function stopSpeak() {
  try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch { /* */ }
}

export function primeVoice() { /* no-op */ }

// Pulisce il testo per la sintesi vocale: rimuove markdown/emoji/simboli/codici,
// così la voce legge solo frasi brevi, pulite e naturali (ricette e comandi).
export function cleanForSpeech(text) {
  return (text || "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FE0F}\u{200D}]/gu, " ")
    .replace(/(\d)\s*°\s*[CcFf]?/g, "$1 gradi ")   // 24°C -> 24 gradi
    .replace(/°/g, " gradi ")
    .replace(/\b[A-Z]{2,}[-\s]?\d+[A-Za-z0-9]*\b/g, " ")  // codici tipo "XX 122", "ERR12"
    .replace(/^[ \t]*\d+[.)]\s+/gm, "")
    .replace(/^[ \t]*[-*+•·–—]\s+/gm, "")
    .replace(/[#*_~>|•·►▪◦=^{}<>[\]\\/@$%&+]/g, " ")
    .replace(/[«»"“”]/g, " ")
    .replace(/\s+([.,;:!?])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
}

// V139 — numeri letti bene: "28-30 °C" → "tra 28 e 30 gradi", "2%" → "2 per cento", "1:1" → "1 a 1".
export function perLaVoce(t, lang = 'it') {
  const W = {
    it: { da: 'da', a: 'a', tra: 'tra', e: 'e', o: 'o', preA: 'a', preP: 'per', gradi: 'gradi', perc: 'per cento', g: 'grammi', kg: 'chili', min: 'minuti', h: 'ore', meno: 'meno', ogni: 'a' },
    de: { da: 'von', a: 'bis', tra: 'zwischen', e: 'und', o: 'bis', preA: 'bei', preP: 'für', gradi: 'Grad', perc: 'Prozent', g: 'Gramm', kg: 'Kilo', min: 'Minuten', h: 'Stunden', meno: 'minus', ogni: 'zu' },
    en: { da: 'from', a: 'to', tra: 'between', e: 'and', o: 'to', preA: 'at', preP: 'for', gradi: 'degrees', perc: 'percent', g: 'grams', kg: 'kilos', min: 'minutes', h: 'hours', meno: 'minus', ogni: 'to' },
  }[lang];
  if (!W || !t) return t || '';
  const R = '(\\d+(?:[.,]\\d+)?)\\s*[-–—]\\s*(\\d+(?:[.,]\\d+)?)';
  return String(t)
    .replace(new RegExp('\\b' + W.preA + '\\s+' + R, 'g'), `${W.tra} $1 ${W.e} $2`)
    .replace(new RegExp('\\b' + W.preP + '\\s+' + R, 'g'), `${W.preP} $1 ${W.o} $2`)
    .replace(new RegExp(R, 'g'), `${W.da} $1 ${W.a} $2`)
    .replace(/(^|[\s(])[-−](\d)/g, `$1${W.meno} $2`)
    .replace(/(\d)\s*:\s*(\d)/g, `$1 ${W.ogni} $2`)
    .replace(/\s*°\s*C\b/g, ` ${W.gradi}`)
    .replace(/(\d)\s*%/g, `$1 ${W.perc}`)
    .replace(/(\d)\s*kg\b/gi, `$1 ${W.kg}`)
    .replace(/(\d)\s*g\b/g, `$1 ${W.g}`)
    .replace(/(\d)\s*(min|')(?=\W|$)/g, `$1 ${W.min}`)
    .replace(/(\d)\s*h\b/g, `$1 ${W.h}`)
    .replace(/\bW\s?(\d{3})\b/g, 'W $1');
}
