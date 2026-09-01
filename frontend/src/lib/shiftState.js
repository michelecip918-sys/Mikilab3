// Stato operativo CONDIVISO del turno: lotti, basi/pre-cotti, guasti macchine,
// cella fuori uso e note per chi entra nel turno dopo. Backend condiviso + cache offline.
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { cacheSet, cacheGet } from "@/lib/offlineCache";

const KEY = "shift_state";
let _state = null;

// Stati di avanzamento di un lotto (Flusso Continuo + Autonomia).
export const STATUSES = ["da_fare", "in_lavorazione", "pronto", "in_cella", "in_lievitazione", "precotto", "base_pronta", "fatto"];

export function statusLabel(s, tri) {
  const M = {
    da_fare: tri("Da fare", "Zu tun", "To do", "Por hacer", "À faire", "برای انجام"),
    in_lavorazione: tri("In lavorazione", "In Arbeit", "In progress", "En proceso", "En cours", "در حال کار"),
    pronto: tri("Pronto", "Fertig", "Ready", "Listo", "Prêt", "آماده"),
    in_cella: tri("In cella", "In der Zelle", "In cold cell", "En cámara", "En chambre", "در سردخانه"),
    in_lievitazione: tri("In lievitazione", "In Gärung", "Proofing", "En fermentación", "En pousse", "در حال ور آمدن"),
    precotto: tri("Pre-cotto / Abbattuto", "Vorgebacken / Schockgekühlt", "Pre-baked / Blast-chilled", "Precocido / Abatido", "Précuit / Cellule", "نیم‌پز"),
    base_pronta: tri("Base pronta", "Basis fertig", "Ready base", "Base lista", "Base prête", "پایه آماده"),
    fatto: tri("Fatto", "Erledigt", "Done", "Hecho", "Fait", "انجام شد"),
  };
  return M[s] || s;
}

export const STATUS_COLOR = {
  da_fare: "#B08D57", in_lavorazione: "#C8862B", pronto: "#5E7A3A", in_cella: "#3E6E8E",
  in_lievitazione: "#8A5A16", precotto: "#9C4A1E", base_pronta: "#6B4A2B", fatto: "#5E7A3A",
};

function emptyState() {
  return { work_mode: "continuo", batches: [], bases: [], machines_down: [], cold_down: false, cold_note: "", shift_notes: [] };
}

export function getCached() {
  if (_state) return _state;
  _state = cacheGet(KEY) || emptyState();
  return _state;
}

export async function loadShift() {
  try {
    const { data } = await api.get("/lab/shift-state");
    _state = { ...emptyState(), ...(data || {}) };
    cacheSet(KEY, _state);
  } catch {
    _state = getCached();
  }
  return _state;
}

function persist() {
  cacheSet(KEY, _state);
  window.dispatchEvent(new Event("mikilab-shift-updated"));
  api.put("/lab/shift-state", _state).catch(() => { /* offline: resta in cache */ });
}

function mutate(fn) {
  const s = getCached();
  const next = {
    ...s,
    batches: [...(s.batches || [])],
    bases: [...(s.bases || [])],
    machines_down: [...(s.machines_down || [])],
    shift_notes: [...(s.shift_notes || [])],
  };
  fn(next);
  _state = next;
  persist();
  return next;
}

// ---- Mutazioni ----
export function setWorkMode(mode) { return mutate((s) => { s.work_mode = mode; }); }

export function setBatchStatus(batch, status) {
  return mutate((s) => {
    const i = s.batches.findIndex((b) => b.id === batch.id);
    const entry = {
      id: batch.id, recipe_id: batch.recipe_id || null, recipe_name: batch.recipe_name || "",
      pieces: batch.pieces || 0, status, updated_at: new Date().toISOString(),
    };
    if (i >= 0) s.batches[i] = { ...s.batches[i], ...entry };
    else s.batches.push(entry);
  });
}

export function batchStatus(state, id) {
  const b = (state.batches || []).find((x) => x.id === id);
  return b ? b.status : "da_fare";
}

export function addBase({ product, qty, unit, kind }) {
  return mutate((s) => {
    s.bases.unshift({ id: `${Date.now()}${Math.random().toString(36).slice(2, 5)}`, product: product || "", qty: Number(qty) || 0, unit: unit || "", kind: kind || "precotto", updated_at: new Date().toISOString() });
  });
}
export function removeBase(id) { return mutate((s) => { s.bases = s.bases.filter((b) => b.id !== id); }); }

export function toggleMachineDown(name, down) {
  return mutate((s) => {
    const key = (name || "").toLowerCase();
    const i = s.machines_down.findIndex((m) => (m.name || "").toLowerCase() === key);
    const shouldDown = down === undefined ? i < 0 : down;
    if (shouldDown && i < 0) s.machines_down.push({ id: `${Date.now()}`, name, at: new Date().toISOString() });
    else if (!shouldDown && i >= 0) s.machines_down.splice(i, 1);
  });
}
export const isMachineDown = (state, name) => (state.machines_down || []).some((m) => (m.name || "").toLowerCase() === (name || "").toLowerCase());

export function setColdDown(down, note) { return mutate((s) => { s.cold_down = !!down; s.cold_note = note || ""; }); }

export function addNote(text, kind = "info") {
  return mutate((s) => { s.shift_notes.unshift({ id: `${Date.now()}${Math.random().toString(36).slice(2, 5)}`, text, kind, at: new Date().toISOString() }); });
}
export function clearNotes() { return mutate((s) => { s.shift_notes = []; }); }
export function resetShift() {
  return mutate((s) => { s.batches = []; s.bases = []; s.machines_down = []; s.cold_down = false; s.cold_note = ""; s.shift_notes = []; });
}

// ---- Riepilogo basi & pre-cotti disponibili (da lotti + inserimenti manuali) ----
export function basesSummary(state) {
  const map = {};
  for (const b of state.batches || []) {
    if (b.status === "precotto" || b.status === "base_pronta") {
      const k = `${b.recipe_name}|${b.status}`;
      map[k] = map[k] || { product: b.recipe_name, qty: 0, unit: "pz", kind: b.status };
      map[k].qty += Number(b.pieces || 0);
    }
  }
  for (const b of state.bases || []) {
    const k = `${b.product}|${b.kind}|${b.unit}`;
    map[k] = map[k] || { product: b.product, qty: 0, unit: b.unit || "", kind: b.kind };
    map[k].qty += Number(b.qty || 0);
  }
  return Object.values(map).filter((x) => x.qty > 0 || x.unit);
}

export const hasActiveAlerts = (state) => !!state && ((state.machines_down || []).length > 0 || state.cold_down || (state.shift_notes || []).length > 0);

// ---- Ricalcolo automatico OFFLINE (regole) ----
// Guasto impastatrice → ripartizione lotti su macchine disponibili / lavorazione ridotta.
export function machineDownNote(name, mixers, downNames, tri) {
  const down = (downNames || []).map((x) => (x || "").toLowerCase());
  const avail = (mixers || []).map((m) => m.name).filter((n) => n && !down.includes((n || "").toLowerCase()));
  if (avail.length === 0) {
    return tri(
      `${name} fuori uso. Nessun'altra impastatrice disponibile: dividi ogni impasto in lotti più piccoli e lavora a mano o in planetaria. Allunga i tempi del turno.`,
      `${name} außer Betrieb. Keine andere Maschine: teile jeden Teig in kleinere Chargen und arbeite von Hand/mit der Küchenmaschine. Plane mehr Zeit ein.`,
      `${name} out of order. No other mixer available: split each dough into smaller batches and work by hand/stand mixer. Allow extra time.`,
      `${name} fuera de uso. Sin otra amasadora: divide cada masa en lotes más pequeños y trabaja a mano/con batidora. Añade tiempo.`,
      `${name} hors service. Aucun autre pétrin : divise chaque pâte en lots plus petits et travaille à la main/au robot.`,
      `${name} از کار افتاد. همزن دیگری نیست: هر خمیر را به دسته‌های کوچک‌تر تقسیم کن و دستی کار کن.`);
  }
  return tri(
    `${name} fuori uso. Ripartisci i lotti sulle macchine disponibili: ${avail.join(", ")}. Riduci la pezzatura per rispettare la portata e scala gli orari.`,
    `${name} außer Betrieb. Verteile die Chargen auf: ${avail.join(", ")}. Kleinere Mengen laut Kapazität, Zeiten anpassen.`,
    `${name} out of order. Redistribute batches across: ${avail.join(", ")}. Reduce batch size to fit capacity and reschedule.`,
    `${name} fuera de uso. Reparte los lotes en: ${avail.join(", ")}. Reduce el tamaño según capacidad y reprograma.`,
    `${name} hors service. Répartis les lots sur : ${avail.join(", ")}. Réduis la taille selon la capacité.`,
    `${name} از کار افتاد. دسته‌ها را روی این‌ها پخش کن: ${avail.join(", ")}.`);
}

// Cella/fermalievitazione fuori uso → lievitazione diretta a temperatura ambiente.
export function coldDownNote(tri) {
  return tri(
    "Cella/fermalievitazione non disponibile stanotte → passa a lievitazione DIRETTA a temperatura ambiente: aumenta il lievito (~+50%), tieni l'impasto a 24-26°C, riduci i tempi di puntata/appretto e ANTICIPA le infornate del turno successivo. Controlla il raddoppio a vista.",
    "Kühl-/Gärzelle heute Nacht nicht verfügbar → auf DIREKTE Gärung bei Raumtemperatur wechseln: Hefe erhöhen (~+50%), Teig bei 24-26°C, Gehzeiten kürzen und die Backzeiten der nächsten Schicht VORVERLEGEN. Verdopplung nach Sicht prüfen.",
    "Cold/proofing cell unavailable tonight → switch to DIRECT leavening at room temperature: increase yeast (~+50%), keep dough at 24-26°C, shorten bulk/final proof and MOVE the next shift's bakes earlier. Check doubling by eye.",
    "Cámara/fermentación no disponible esta noche → pasa a fermentación DIRECTA a temperatura ambiente: aumenta la levadura (~+50%), masa a 24-26°C, acorta tiempos y ADELANTA los horneados del turno siguiente.",
    "Chambre/pousse indisponible cette nuit → passe en levée DIRECTE à température ambiante : augmente la levure (~+50%), pâte à 24-26°C, raccourcis les temps et AVANCE les cuissons du prochain poste.",
    "سردخانه امشب در دسترس نیست → به ور آمدن مستقیم در دمای اتاق برو: مخمر را افزایش بده (~+۵۰٪)، خمیر ۲۴-۲۶ درجه، زمان‌ها را کوتاه کن و پخت شیفت بعد را جلو بینداز.");
}

// Hook React condiviso: si aggiorna a ogni mutazione (evento globale).
export function useShift() {
  const [s, setS] = useState(() => getCached());
  useEffect(() => {
    let alive = true;
    loadShift().then((v) => { if (alive) setS({ ...v }); });
    const on = () => setS({ ...getCached() });
    window.addEventListener("mikilab-shift-updated", on);
    return () => { alive = false; window.removeEventListener("mikilab-shift-updated", on); };
  }, []);
  return s;
}
