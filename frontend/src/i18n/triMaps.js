// mkTri(lang) → (it, de, en, ...) — lingue attive: IT, DE, EN.
// I dizionari legacy FR/FA/AR/TR sono stati rimossi (contenevano testi del vecchio sito):
// gli export restano come stub per compatibilità con i rami di codice esistenti (mai raggiunti,
// perché il selettore offre solo IT/DE/EN), così i fallback ricadono su EN → IT.
export const triFR = () => undefined;
export const triFA = () => undefined;
export const triAR = () => undefined;
export const triTR = () => undefined;

export function mkTri(lang) {
  return (i, d, e, s) => {
    switch (lang) {
      case "de": return d ?? i;
      case "en": return e ?? i;
      case "es": return s ?? e ?? i;
      default: return i;
    }
  };
}

// Traduzione profonda (per oggetti/array di dati).
export function deepT(obj, fn) {
  if (typeof obj === "string") return fn(obj) || obj;
  if (Array.isArray(obj)) return obj.map((x) => deepT(x, fn));
  if (obj && typeof obj === "object") {
    const o = {};
    for (const k in obj) o[k] = deepT(obj[k], fn);
    return o;
  }
  return obj;
}

// pick(obj, lang): obj è tipo { it:..., de:..., en:..., es:... }.
export function pick(obj, lang) {
  if (!obj) return obj;
  if (obj[lang]) return obj[lang];
  return obj.en || obj.it;
}
