// Prezzi standard di riferimento (EUR) per il calcolo automatico dei costi.
// L'utente può sempre modificarli nella ricetta.
export const STANDARD_PRICES = {
  flour_kg: 1.2,   // € per kg farina
  water_l: 0.002,  // € per litro acqua
  sourdough_kg: 1.0, // € per kg prefermento / lievito madre
  salt_kg: 0.5,    // € per kg sale
};

// Prezzi indicativi €/kg per ingredienti extra comuni (usati per suggerire).
export const EXTRA_PRICE_PER_KG = {
  olio: 7, burro: 9, zucchero: 1.2, uova: 4, miele: 9, latte: 1.2,
  lievito: 3, semi: 6, noci: 14, uvetta: 5, cioccolato: 9, malto: 5,
};

export function standardCosting() {
  return {
    flour_kg: STANDARD_PRICES.flour_kg,
    water_l: STANDARD_PRICES.water_l,
    sourdough_kg: STANDARD_PRICES.sourdough_kg,
    salt_kg: STANDARD_PRICES.salt_kg,
    extras: [], overhead: "", pieces: "", markup: "",
  };
}

// Costo ingredienti di una ricetta (batch e per pezzo) usando il suo costing.
export function computeRecipeCostPerPiece(recipe) {
  if (!recipe) return null;
  const num = (x) => Number(x) || 0;
  const c = recipe.costing || {};
  const fp = num(c.flour_kg) || STANDARD_PRICES.flour_kg;
  const wp = c.water_l != null && c.water_l !== "" ? num(c.water_l) : STANDARD_PRICES.water_l;
  const sp = num(c.sourdough_kg) || STANDARD_PRICES.sourdough_kg;
  const salp = num(c.salt_kg) || STANDARD_PRICES.salt_kg;
  const flour = (num(recipe.flour_grams) / 1000) * fp;
  const water = (num(recipe.water_grams) / 1000) * wp;
  const sour = (num(recipe.sourdough_grams) / 1000) * sp;
  const salt = (num(recipe.salt_grams) / 1000) * salp;
  const extras = Array.isArray(c.extras) ? c.extras.reduce((a, e) => a + num(e.cost), 0) : 0;
  const overhead = num(c.overhead);
  const batch = flour + water + sour + salt + extras + overhead;
  const pieces = num(c.pieces) > 0 ? num(c.pieces) : 0;
  return { batch, pieces, costPerPiece: pieces > 0 ? batch / pieces : null };
}
