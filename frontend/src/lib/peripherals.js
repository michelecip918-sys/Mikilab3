// Auto-configurazione periferiche del laboratorio: microfono, telecamera, sensori IoT
// (Bluetooth + letture di rete). Richiede i permessi e verifica la disponibilità in un colpo solo.
const API = process.env.REACT_APP_BACKEND_URL;

async function checkMic() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return { status: "unavailable" };
  try {
    const s = await navigator.mediaDevices.getUserMedia({ audio: true });
    s.getTracks().forEach((t) => t.stop());
    return { status: "ok" };
  } catch (e) {
    return { status: e && e.name === "NotAllowedError" ? "denied" : "error" };
  }
}

async function checkCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return { status: "unavailable" };
  try {
    const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
    s.getTracks().forEach((t) => t.stop());
    return { status: "ok" };
  } catch (e) {
    return { status: e && e.name === "NotAllowedError" ? "denied" : "error" };
  }
}

async function checkBluetooth() {
  if (!navigator.bluetooth) return { status: "unavailable" };
  try {
    const avail = navigator.bluetooth.getAvailability ? await navigator.bluetooth.getAvailability() : true;
    return { status: avail ? "ok" : "unavailable" };
  } catch {
    return { status: "error" };
  }
}

async function checkIoT() {
  if (!API) return { status: "unavailable" };
  try {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 6000);
    const r = await fetch(`${API}/api/sensors/latest`, { signal: ctrl.signal });
    clearTimeout(to);
    if (!r.ok) throw new Error("iot");
    const d = await r.json();
    const count = Object.keys((d && d.readings) || {}).length;
    return { status: "ok", count };
  } catch {
    return { status: "error" };
  }
}

// Esegue in parallelo il rilevamento di tutte le periferiche e salva l'esito.
export async function autoSetupPeripherals() {
  const [mic, camera, bluetooth, iot] = await Promise.all([checkMic(), checkCamera(), checkBluetooth(), checkIoT()]);
  const result = { mic, camera, bluetooth, iot, at: new Date().toISOString() };
  try { localStorage.setItem("mikilab_peripherals", JSON.stringify(result)); } catch { /* */ }
  return result;
}

export function getPeripheralsCache() {
  try { return JSON.parse(localStorage.getItem("mikilab_peripherals") || "null"); } catch { return null; }
}
