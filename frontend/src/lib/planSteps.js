// Converte un piano (testo/markdown generato dall'AI o dal Capo) in una lista di passi puliti,
// uno per riga significativa. Usato dall'Assistente Mamo per la guida vocale passo-passo.
// Le righe di solo titolo/intestazione (es. "PIANO DI PRODUZIONE", emoji da sole) vengono
// scartate: non sono azioni da spuntare per l'operaio.
function isHeaderLine(line) {
  const noEmoji = line.replace(/[\u2190-\u2BFF\u{1F000}-\u{1FAFF}\u{FE00}-\u{FE0F}\u200d]/gu, "").trim();
  if (!noEmoji) return true; // riga fatta solo di emoji/simboli
  const letters = noEmoji.replace(/[^A-Za-zÀ-ÿ]/g, "");
  const hasLower = /[a-zà-ÿ]/.test(noEmoji);
  const hasTaskSignal = /\d/.test(noEmoji); // orari/quantità => è un'azione, la teniamo
  // Intestazione: MAIUSCOLO senza minuscole, almeno 3 lettere e nessun numero/orario.
  if (!hasLower && letters.length >= 3 && !hasTaskSignal) return true;
  return false;
}

export function parsePlanSteps(plan) {
  if (!plan) return [];
  const lines = String(plan)
    .split(/\r?\n/)
    .map((l) =>
      l
        .replace(/^#{1,6}\s*/, "") // titoli markdown
        .replace(/\*\*(.*?)\*\*/g, "$1") // grassetto
        .replace(/`([^`]*)`/g, "$1") // code
        .replace(/^\s*[-*•·]\s*/, "") // elenchi puntati
        .replace(/^\s*\d+[.)]\s*/, "") // elenchi numerati
        .trim()
    )
    .filter((l) => l && !/^[-*_=]{2,}$/.test(l));
  const steps = lines.filter((l) => !isHeaderLine(l));
  // Fallback di sicurezza: se il filtro ha tolto tutto, meglio i passi grezzi di zero passi.
  return steps.length ? steps : lines;
}
