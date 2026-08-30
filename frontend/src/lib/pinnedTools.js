// Strumenti "appuntati" in cima alla directory del Laboratorio (per-dispositivo).
const KEY = "mikilab_pinned_tools";

export function getPinned() {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}

export function isPinned(id) {
  return getPinned().includes(id);
}

export function togglePinned(id) {
  const cur = getPinned();
  const next = cur.includes(id) ? cur.filter((x) => x !== id) : [id, ...cur].slice(0, 12);
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* */ }
  return next;
}
