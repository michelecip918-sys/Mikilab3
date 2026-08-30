// Ricette "usate di recente" (per il selettore): id più recenti in testa, cap 8.
const KEY = "mikilab_recent_recipes";
const MAX = 8;

export function getRecents() {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}

export function pushRecents(ids) {
  const add = (Array.isArray(ids) ? ids : [ids]).filter(Boolean);
  if (!add.length) return;
  const prev = getRecents().filter((id) => !add.includes(id));
  const next = [...add, ...prev].slice(0, MAX);
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* */ }
}
