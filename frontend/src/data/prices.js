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
