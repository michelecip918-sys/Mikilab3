// Parco macchine del laboratorio (ON/OFF). Le scelte alimentano l'AI per adattare
// ricette e procedimenti (modalità di produzione, resa, stress meccanico).
export const MACHINE_KEY = "mikilab_machines";

export const MACHINE_CATEGORIES = [
  { id: "formatura", it: "Formatura & Estrusione", de: "Formen & Extrusion", en: "Forming & Extrusion",
    machines: [
      { id: "rheon", it: "Reon / Rheon (encrusting)", de: "Rheon (Encrusting)", en: "Rheon (encrusting)" },
      { id: "estrusore", it: "Estrusore continuo", de: "Durchlauf-Extruder", en: "Continuous extruder" },
      { id: "formatrice", it: "Formatrice automatica", de: "Automatische Formmaschine", en: "Automatic moulder" },
    ] },
  { id: "brezel", it: "Brezel & Strutture speciali", de: "Brezel & Spezialformen", en: "Pretzel & special shapes",
    machines: [
      { id: "brezel_form", it: "Formatrice/intrecciatrice Brezel", de: "Brezel-Schlingmaschine", en: "Pretzel forming machine" },
      { id: "lisciviatrice", it: "Lisciviatrice automatica", de: "Automatische Laugenmaschine", en: "Automatic lye machine" },
    ] },
  { id: "divisione", it: "Divisione & Spezzatura", de: "Teilen & Wirken", en: "Dividing & rounding",
    machines: [
      { id: "spezzatrice_idraulica", it: "Spezzatrice idraulica", de: "Hydraulische Teigteiler", en: "Hydraulic divider" },
      { id: "spezz_arrotondatrice", it: "Spezzatrice-arrotondatrice automatica", de: "Teiler-Wirkmaschine", en: "Divider-rounder (high speed)" },
      { id: "volumetrica", it: "Divisione volumetrica", de: "Volumetrische Teilung", en: "Volumetric divider" },
    ] },
  { id: "sfoglia", it: "Sfoglia & Impasti", de: "Ausrollen & Teige", en: "Sheeting & mixing",
    machines: [
      { id: "sfogliatrice", it: "Sfogliatrice automatica industriale", de: "Industrie-Ausrollmaschine", en: "Industrial sheeter" },
      { id: "spirale_estraibile", it: "Impastatrice a spirale (vasca estraibile)", de: "Spiralkneter (abnehmbarer Kessel)", en: "Spiral mixer (removable bowl)" },
      { id: "bracci_tuffanti", it: "Impastatrice a bracci tuffanti (alta capacità)", de: "Kneter mit Taucharmen (Großkapazität)", en: "Diving-arm mixer (high capacity)" },
    ] },
  { id: "cella_forno", it: "Cella & Cottura", de: "Gärraum & Backen", en: "Proofing & baking",
    machines: [
      { id: "climatherm", it: "Cella di fermalievitazione (CLIMATHERM)", de: "Gärverzögerungsanlage (CLIMATHERM)", en: "Retarder-prover (CLIMATHERM)" },
      { id: "rotovent", it: "Forno a carrello rotante (Rotovent)", de: "Stikkenofen (Rotovent)", en: "Rack oven (Rotovent)" },
      { id: "pietra_vapore", it: "Forno a piano di pietra con vapore alta pressione", de: "Steinherdofen mit Hochdruckdampf", en: "Stone deck oven, high-pressure steam" },
    ] },
];

export function getActiveMachineIds() {
  try { const a = JSON.parse(localStorage.getItem(MACHINE_KEY) || "[]"); return Array.isArray(a) ? a : []; } catch { return []; }
}

export function setActiveMachineIds(ids) {
  try { localStorage.setItem(MACHINE_KEY, JSON.stringify(ids)); } catch { /* */ }
}

// Nomi (in italiano, per l'AI) delle macchine attive.
export function getActiveMachineNames() {
  const active = new Set(getActiveMachineIds());
  const names = [];
  MACHINE_CATEGORIES.forEach((c) => c.machines.forEach((m) => { if (active.has(m.id)) names.push(m.it); }));
  return names;
}
