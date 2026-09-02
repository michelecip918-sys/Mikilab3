// Evidenzia la parola "Miglioratore" (in tutte le lingue/sinonimi) nel procedimento
// con un asterisco arancione cliccabile che apre la scheda del Miglioratore.
// Usato sia in RicetteCustodite (testi hardcoded) sia in RecipeList (traduzioni dal DB).

export const IMPROVER_SYNONYMS = [
  "Miglioratore",   // it (e nome commerciale mantenuto in es/fr)
  "Improver",       // en
  "Verbesserer",    // de
  "Backmittel",     // de (traduzione tecnica usata dall'IA)
  "Mejorador",      // es
  "Améliorant",     // fr
  "بهبوددهنده",     // fa
];

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const IMPROVER_RE = new RegExp("(" + IMPROVER_SYNONYMS.map(escapeRe).join("|") + ")", "i");

// Ritorna il testo con un asterisco cliccabile dopo la PRIMA occorrenza del miglioratore.
export function renderProcedureWithImprover(text, onImprover) {
  if (!text) return text;
  const m = IMPROVER_RE.exec(text);
  if (!m) return text;
  const idx = m.index;
  const word = m[0];
  return (
    <>
      {text.slice(0, idx)}
      <span>
        {word}
        <button
          type="button"
          data-testid="proc-improver-asterisk"
          onClick={onImprover}
          className="text-[#c94f00] font-bold align-super text-xs ml-0.5 hover:opacity-70 active:scale-90 transition-transform"
          aria-label="Miglioratore Naturale MikiLab"
        >
          *
        </button>
      </span>
      {text.slice(idx + word.length)}
    </>
  );
}
