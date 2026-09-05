// Runtime lookup for inline tri() strings in FR / FA.
// The Italian source string (first arg of tri) is the key.
// Auto-generated map lives in triTranslations.json ({ "<italian>": { fr, fa } }).
import DATA from "./triTranslations.json";
import { triAR as _extraAR, triTR as _extraTR } from "./triExtraArTr";

const TRI_FR = {};
const TRI_FA = {};
const TRI_AR = {};
const TRI_TR = {};
for (const k in DATA) {
  const v = DATA[k] || {};
  if (v.fr) TRI_FR[k] = v.fr;
  if (v.fa) TRI_FA[k] = v.fa;
  if (v.ar) TRI_AR[k] = v.ar;
  if (v.tr) TRI_TR[k] = v.tr;
}

// Lookup FR/FA by Italian source string (used also by object-based helpers).
export const triFR = (it) => (it != null ? TRI_FR[it] : undefined);
export const triFA = (it) => (it != null ? TRI_FA[it] : undefined);
export const triAR = (it) => (it != null ? (TRI_AR[it] ?? _extraAR(it)) : undefined);
export const triTR = (it) => (it != null ? (TRI_TR[it] ?? _extraTR(it)) : undefined);

// mkTri(lang) → (it, de, en, es, fr, fa) — FR/FA/AR/TR ricadono su mappa → EN → IT.
export function mkTri(lang) {
  return (i, d, e, s, f, fa) => {
    switch (lang) {
      case "de": return d ?? i;
      case "es": return s ?? e ?? i;
      case "en": return e ?? i;
      case "fr": return f ?? triFR(i) ?? e ?? i;
      case "fa": return fa ?? triFA(i) ?? e ?? i;
      case "ar": return triAR(i) ?? e ?? i;
      case "tr": return triTR(i) ?? e ?? i;
      default: return i;
    }
  };
}

// Traduzione profonda IT->FR/FA (per oggetti/array di dati).
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

// pick(obj, lang): obj è tipo { it:..., de:..., en:..., es:... }. Per fr/fa traduce da it via mappa.
export function pick(obj, lang) {
  if (!obj) return obj;
  if (obj[lang]) return obj[lang];
  if (lang === "fr") return deepT(obj.it, triFR);
  if (lang === "fa") return deepT(obj.it, triFA);
  return obj.en || obj.it;
}
