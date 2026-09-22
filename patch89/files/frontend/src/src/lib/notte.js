// V86 — Modo notte del fornaio: per chi impasta alle 4 di mattina. Schermo caldo e scuro, tutto più
// grande, Sitor parla piano (vedi tts.js). Solo una classe CSS + localStorage.
export const NIGHT_KEY = "mikilab_modo_notte";
export function isNightMode() { try { return localStorage.getItem(NIGHT_KEY) === "1"; } catch { return false; } }
export function applyNightMode(on) {
  try {
    document.documentElement.classList.toggle("ml-notte", !!on);
    localStorage.setItem(NIGHT_KEY, on ? "1" : "0");
  } catch { /* */ }
}
