// Combinazioni salvate del Laboratorio: set di ricette+quantità riutilizzabili con un tap.
// Ottimistiche in localStorage + sincronizzate sull'ACCOUNT quando loggato (come i preferiti).
// { id, name, items:[{recipe_id,name,qty,unit,gpp,day,start}] }
import { comboApi } from "@/lib/api";

const KEY = "mikilab_combos";
const EVT = "mikilab-combos-changed";

export function getCombos() {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}

function write(list) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* */ }
  window.dispatchEvent(new CustomEvent(EVT));
  return list;
}

export function saveCombo(name, items) {
  const clean = (items || []).filter((p) => p.recipe_id).map((p) => ({
    recipe_id: p.recipe_id, name: p.name || "", qty: p.qty ?? "", unit: p.unit || "pezzi", gpp: p.gpp ?? "", day: p.day || "", start: !!p.start,
  }));
  if (!clean.length) return getCombos();
  const combo = { id: `c_${Date.now()}`, name: (name || "").trim() || "Combinazione", items: clean };
  const list = write([combo, ...getCombos()].slice(0, 20));
  comboApi.sync([combo]).then((server) => { if (Array.isArray(server)) write(server); }).catch(() => {}); // ospite (401) → resta locale
  return list;
}

export function deleteCombo(id) {
  const list = write(getCombos().filter((c) => c.id !== id));
  comboApi.remove(id).catch(() => {});
  return list;
}

// Unisce le combinazioni locali con quelle dell'account (da chiamare al bootstrap/login).
export function hydrateCombos() {
  return comboApi.sync(getCombos())
    .then((server) => { if (Array.isArray(server)) write(server); })
    .catch(() => {});
}

export const COMBOS_EVENT = EVT;
