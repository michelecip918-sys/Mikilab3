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

// Preset laboratorio (combinazioni di macchine salvabili + preset predefiniti).
export const PRESET_KEY = "mikilab_machine_presets";
export const BUILTIN_PRESETS = [
  { id: "pane", builtin: true, name: { it: "Linea Pane", de: "Brotlinie", en: "Bread line" }, ids: ["spirale_estraibile", "spezz_arrotondatrice", "climatherm", "rotovent"] },
  { id: "brezel", builtin: true, name: { it: "Linea Brezel", de: "Brezellinie", en: "Pretzel line" }, ids: ["brezel_form", "lisciviatrice", "spezzatrice_idraulica", "rotovent"] },
  { id: "grandi", builtin: true, name: { it: "Linea Grandi Lievitati", de: "Große Hefegebäcke", en: "Large leavened" }, ids: ["bracci_tuffanti", "climatherm", "rotovent"] },
  { id: "pietra", builtin: true, name: { it: "Linea Artigianale (pietra)", de: "Handwerk (Stein)", en: "Artisan (stone)" }, ids: ["spirale_estraibile", "pietra_vapore"] },
];
export function getUserPresets() {
  try { const a = JSON.parse(localStorage.getItem(PRESET_KEY) || "[]"); return Array.isArray(a) ? a : []; } catch { return []; }
}
export function saveUserPreset(name, ids) {
  const p = getUserPresets();
  p.push({ id: "u" + Date.now(), name, ids });
  try { localStorage.setItem(PRESET_KEY, JSON.stringify(p)); } catch { /* */ }
  return p;
}
export function deleteUserPreset(id) {
  const p = getUserPresets().filter((x) => x.id !== id);
  try { localStorage.setItem(PRESET_KEY, JSON.stringify(p)); } catch { /* */ }
  return p;
}
export function presetLabel(p, lang) {
  return typeof p.name === "string" ? p.name : (p.name[lang] || p.name.it);
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

// Macchine "industriali" che rendono la produzione automatica.
const INDUSTRIAL = new Set(["rheon", "estrusore", "formatrice", "brezel_form", "spezz_arrotondatrice", "volumetrica", "sfogliatrice", "lisciviatrice"]);

const MACHINE_TIPS = {
  rheon: { it: "Rheon: velocità nastro moderata (≈3) per non surriscaldare l'impasto; T finale 22-24°C.", de: "Rheon: Bandgeschwindigkeit moderat (≈3), Teig nicht überhitzen; Endtemp. 22-24°C.", en: "Rheon: moderate belt speed (≈3) to avoid overheating; final temp 22-24°C." },
  estrusore: { it: "Estrusore: impasto ben incordato e freddo per evitare che si stracci.", de: "Extruder: gut ausgekneteter, kühler Teig, damit er nicht reißt.", en: "Extruder: well-developed, cool dough so it won't tear." },
  formatrice: { it: "Formatrice automatica: regola i rulli in base al peso pezzo.", de: "Formmaschine: Walzen an Teiglingsgewicht anpassen.", en: "Moulder: set rollers to the piece weight." },
  brezel_form: { it: "Formatrice Brezel: pasta un po' più soda e riposo breve prima del passaggio.", de: "Brezelmaschine: etwas festerer Teig, kurze Ruhe vor dem Formen.", en: "Pretzel former: slightly stiffer dough, short rest before forming." },
  lisciviatrice: { it: "Lisciviatrice: soluzione di soda ben dosata e nastro asciutto.", de: "Laugenmaschine: Lauge korrekt dosieren, Band trocken.", en: "Lye machine: correct lye dosing, keep belt dry." },
  spezzatrice_idraulica: { it: "Spezzatrice idraulica: pressione minima con impasti morbidi, spolvera il piatto.", de: "Hydr. Teiler: geringer Druck bei weichen Teigen, Platte bemehlen.", en: "Hydraulic divider: low pressure for soft dough, flour the plate." },
  spezz_arrotondatrice: { it: "Spezzatrice-arrotondatrice: verifica peso e forma a inizio ciclo.", de: "Teiler-Wirker: Gewicht/Form zu Zyklusbeginn prüfen.", en: "Divider-rounder: check weight/shape at cycle start." },
  volumetrica: { it: "Divisione volumetrica: taratura pistone su densità impasto.", de: "Volumetrische Teilung: Kolben auf Teigdichte einstellen.", en: "Volumetric divider: set piston to dough density." },
  sfogliatrice: { it: "Sfogliatrice industriale: rispetta le soste di riposo tra le pieghe.", de: "Ausrollmaschine: Ruhezeiten zwischen den Touren einhalten.", en: "Sheeter: respect rest times between folds." },
  spirale_estraibile: { it: "Spirale vasca estraibile: rispetta i tempi di incordatura, non scaldare.", de: "Spiralkneter: Auskneten einhalten, nicht überhitzen.", en: "Spiral mixer: respect development time, don't overheat." },
  bracci_tuffanti: { it: "Bracci tuffanti: ossigena bene ma allunga i tempi; ideale grandi lievitati.", de: "Taucharme: gute Sauerstoffzufuhr, längere Zeiten; ideal für große Hefeteige.", en: "Diving arms: great oxygenation, longer times; ideal for large leavened doughs." },
  climatherm: { it: "CLIMATHERM: usa il freddo per rallentare la lievitazione e far maturare l'impasto.", de: "CLIMATHERM: Kälte nutzen, um Gare zu bremsen und Reife zu fördern.", en: "CLIMATHERM: use cold to slow proof and boost maturation." },
  rotovent: { it: "Rotovent: con pezzi piccoli controlla la cottura in anticipo; vapore iniziale breve.", de: "Rotovent: kleine Teiglinge früher prüfen; kurzer Anfangsdampf.", en: "Rotovent: check small pieces earlier; short initial steam." },
  pietra_vapore: { it: "Forno a pietra: vapore ad alta pressione nei primi minuti per crosta e sviluppo.", de: "Steinofen: Hochdruckdampf in den ersten Minuten für Kruste/Trieb.", en: "Stone oven: high-pressure steam in the first minutes for crust/oven spring." },
};

// Scheda macchina calcolata dalle macchine attive (senza AI).
export function machineScheda(lang = "it") {
  const tri = (i, d, e) => (lang === "de" ? d : lang === "en" ? e : i);
  const ids = getActiveMachineIds();
  let mode, yieldLabel;
  if (ids.length === 0) { mode = tri("Manuale", "Manuell", "Manual"); yieldLabel = tri("≈ 40-80 pezzi/ora (a mano)", "≈ 40-80 Stück/Std (Hand)", "≈ 40-80 pcs/hour (by hand)"); }
  else if (ids.some((id) => INDUSTRIAL.has(id))) { mode = tri("Industriale", "Industriell", "Industrial"); yieldLabel = tri("≈ 800-1500 pezzi/ora", "≈ 800-1500 Stück/Std", "≈ 800-1500 pcs/hour"); }
  else { mode = tri("Semiautomatica", "Halbautomatisch", "Semi-automatic"); yieldLabel = tri("≈ 200-500 pezzi/ora", "≈ 200-500 Stück/Std", "≈ 200-500 pcs/hour"); }
  const tips = ids.map((id) => MACHINE_TIPS[id] && (MACHINE_TIPS[id][lang] || MACHINE_TIPS[id].it)).filter(Boolean);
  const names = getActiveMachineNames();
  return { mode, yieldLabel, tips, names, count: ids.length };
}

