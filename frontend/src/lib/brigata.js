// Brigata di laboratorio: zone di lavoro, operatori e operatore corrente.
const SHIFTS_KEY = "mikilab_shifts";
const OP_KEY = "mikilab_operator";

export const ZONES = [
  { id: "impasti", it: "Impasti / Lau", de: "Teige / Lau", en: "Mixing / Lau", es: "Masas / Lau" },
  { id: "formatura", it: "Formatura / Rayon", de: "Formen / Rayon", en: "Shaping / Rayon", es: "Formado / Rayon" },
  { id: "forni", it: "Forni", de: "Öfen", en: "Ovens", es: "Hornos" },
  { id: "consegne", it: "Consegne / Guida", de: "Lieferung / Fahren", en: "Deliveries / Driving", es: "Entregas / Conducción" },
];

export const zoneLabel = (id, lang = "it") => {
  const z = ZONES.find((x) => x.id === id);
  if (!z) return "";
  return lang === "de" ? z.de : lang === "en" ? z.en : lang === "es" ? z.es : z.it;
};

export function getOperators() {
  try { return (JSON.parse(localStorage.getItem(SHIFTS_KEY) || "[]") || []).filter((p) => (p.name || "").trim()); }
  catch { return []; }
}

export const currentOperatorId = () => { try { return localStorage.getItem(OP_KEY) || ""; } catch { return ""; } };
export function setCurrentOperator(id) {
  try { id ? localStorage.setItem(OP_KEY, id) : localStorage.removeItem(OP_KEY); } catch { /* */ }
  window.dispatchEvent(new CustomEvent("mikilab-operator", { detail: { id } }));
}
export const getCurrentOperator = () => { const id = currentOperatorId(); return getOperators().find((p) => p.id === id) || null; };

// "HH:MM" corrente del dispositivo.
export const nowHM = () => { const d = new Date(); return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; };
