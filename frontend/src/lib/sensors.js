// Bus sensori IoT (Web Bluetooth): l'hardware pubblica letture reali, i componenti
// (es. Aura Sonora) si iscrivono. Le letture vivono in memoria; l'ultima è sempre
// disponibile con getSensors(). Nessuna dipendenza esterna.
const _state = {}; // { oven_temp: {value, at}, ph: {value, at}, ... }
const _subs = new Set();

export function publishSensor(key, value) {
  if (value == null || Number.isNaN(value)) return;
  _state[key] = { value: Number(value), at: Date.now() };
  _subs.forEach((fn) => { try { fn({ ..._state }); } catch { /* */ } });
  try { window.dispatchEvent(new CustomEvent("mikilab-sensor", { detail: { key, value: Number(value) } })); } catch { /* */ }
}

export function getSensors() {
  // Scarta letture più vecchie di 5 minuti (sensore non più affidabile).
  const now = Date.now();
  const out = {};
  for (const k in _state) if (now - _state[k].at < 5 * 60 * 1000) out[k] = _state[k];
  return out;
}

export function subscribeSensors(fn) {
  _subs.add(fn);
  return () => _subs.delete(fn);
}
