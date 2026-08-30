// Combinazioni salvate del Laboratorio: set di ricette+quantità riutilizzabili con un tap.
// Salvate in locale (per-dispositivo). { id, name, items:[{recipe_id,name,qty,unit,gpp,day,start}] }
const KEY = "mikilab_combos";

export function getCombos() {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}

function write(list) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* */ }
  return list;
}

export function saveCombo(name, items) {
  const clean = (items || []).filter((p) => p.recipe_id).map((p) => ({
    recipe_id: p.recipe_id, name: p.name || "", qty: p.qty ?? "", unit: p.unit || "pezzi", gpp: p.gpp ?? "", day: p.day || "", start: !!p.start,
  }));
  if (!clean.length) return getCombos();
  const combo = { id: `c_${Date.now()}`, name: (name || "").trim() || "Combinazione", items: clean };
  return write([combo, ...getCombos()].slice(0, 20));
}

export function deleteCombo(id) {
  return write(getCombos().filter((c) => c.id !== id));
}
