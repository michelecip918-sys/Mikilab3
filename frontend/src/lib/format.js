// Formattazione quantita' (g/kg) usata dal piano settimanale.
export function fmtQty(g) {
  if (g >= 1000) return `${(g / 1000).toFixed(2)} kg`;
  return `${Math.round(g)} g`;
}
