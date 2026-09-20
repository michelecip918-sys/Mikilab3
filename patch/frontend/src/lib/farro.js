// Conversione in farro (spelt / Dinkel): regole in un solo posto, usate da scheda ricetta, Enciclopedia e Sitor.
// Acqua: -8% sulle ricette normali, -4% sui panettoni (dato di Michele). Il resto è nel testo di aiuto.
export const FARRO_WATER = 0.92;
export const FARRO_WATER_PANETTONE = 0.96;

export const isPanettoneName = (n) => /panettone|colomba|pandoro/i.test(n || "");

// Il pulsante compare su ogni ricetta con farina, tranne le basi (lieviti, poolish…), quelle già di farro e quelle bloccate.
export function farroEligible(r) {
  if (!r || r.locked) return false;
  if (!(Number(r.flour_grams) > 0)) return false;
  if (r.menu_category === "basi") return false;
  if (/farro|dinkel|spelt/i.test(`${r.flour_type || ""} ${r.name || ""}`)) return false;
  return true;
}

export const farroWaterFactor = (r) => (isPanettoneName(r && r.name) ? FARRO_WATER_PANETTONE : FARRO_WATER);

export function farroFlourLabel(lang) {
  if (lang === "de") return "Dinkelmehl (Type 630)";
  if (lang === "en") return "Spelt flour (type 630)";
  return "Farina di farro (tipo 630)";
}

export function farroHelp(lang) {
  if (lang === "de") {
    return "DINKEL-VERSION: Das Dinkelgluten ist zart und bricht leicht. Deshalb ist das Wasser um 8 % reduziert (Startwert: Wasser esslöffelweise nachgeben, nur wenn der Teig zu fest ist). Kürzer und langsamer kneten, sonst wird der Teig schmierig. Gare etwa 10-15 % kürzer: auf den Teig achten, nicht auf die Uhr. Nur sanft falten. Für helles Brot Type 630, für rustikalen Geschmack Vollkorn. Hefe und Salz bleiben gleich.";
  }
  if (lang === "en") {
    return "SPELT VERSION: spelt gluten is delicate and breaks easily. That's why water is reduced by 8% (start there; add water a spoonful at a time only if the dough is too stiff). Knead less and more slowly, or the dough turns sticky. Proof about 10-15% shorter: watch the dough, not the clock. Fold gently. Use type 630 for light bread, wholemeal for a rustic taste. Yeast and salt stay the same.";
  }
  return "VERSIONE AL FARRO: il glutine del farro è delicato e si spezza facilmente. Per questo l'acqua è ridotta dell'8% (parti da questa dose; aggiungi acqua a cucchiai solo se l'impasto è troppo duro). Impasta meno e più piano, altrimenti si appiccica. Lievitazioni più corte del 10-15%: guarda l'impasto, non l'orologio. Pieghe delicate. Per il pane chiaro usa il tipo 630, per un gusto rustico l'integrale. Lievito e sale restano uguali.";
}
