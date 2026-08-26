// Marketplace Usato: dati locali (localStorage) + annunci di esempio.
export const MARKET_KEY = "mikilab_market";
export const MARKET_SEEN_KEY = "mikilab_market_seen";

const now = Date.now();
export const MARKET_SEED = [
  { id: "seed-impastatrice", cat: "impastatrice", title: "Impastatrice a spirale 40 kg", price: "1800", condition: "buono", place: "Milano (IT)", desc: "Testa fissa, vasca estraibile, doppia velocità. Perfetta per pane e pizza.", photo: "", contact: "", createdAt: now - 1000 },
  { id: "seed-forno", cat: "forno", title: "Forno rotativo a gas 60×80", price: "4500", condition: "buono", place: "Berlin (DE)", desc: "Carrello 18 teglie, vapore. Ottima resa, pochi anni di utilizzo.", photo: "", contact: "", createdAt: now - 2000 },
  { id: "seed-cella", cat: "cella", title: "Cella di lievitazione 2 porte", price: "1200", condition: "buono", place: "Napoli (IT)", desc: "Controllo umidità e temperatura, ruote. Ideale per lunghe lievitazioni.", photo: "", contact: "", createdAt: now - 3000 },
  { id: "seed-sfogliatrice", cat: "sfogliatrice", title: "Sfogliatrice da banco 50 cm", price: "900", condition: "nuovo", place: "Torino (IT)", desc: "Come nuova, usata pochissimo. Rulli in acciaio, tappeti puliti.", photo: "", contact: "", createdAt: now - 4000 },
];

export function loadMarket() {
  try {
    const saved = JSON.parse(localStorage.getItem(MARKET_KEY) || "null");
    if (Array.isArray(saved) && saved.length) return saved;
  } catch { /* */ }
  return MARKET_SEED;
}

export function marketNewCount() {
  const total = loadMarket().length;
  let seen = 0;
  try { seen = Number(localStorage.getItem(MARKET_SEEN_KEY) || 0); } catch { /* */ }
  return Math.max(0, total - seen);
}

export function markMarketSeen() {
  try { localStorage.setItem(MARKET_SEEN_KEY, String(loadMarket().length)); } catch { /* */ }
}
