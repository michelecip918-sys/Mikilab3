// Blocco d'accesso locale con PIN a 4 cifre (gate del preview). Stato salvato sul dispositivo.
const K_PIN = "mikilab_pin";
const K_EN = "mikilab_pin_enabled";
const K_UN = "mikilab_pin_unlocked";
const K_SET = "mikilab_pin_init";
const DEFAULT_PIN = "1985";

export function ensurePinDefault() {
  try {
    if (localStorage.getItem(K_SET) !== "1") {
      localStorage.setItem(K_PIN, DEFAULT_PIN);
      localStorage.setItem(K_EN, "1");
      localStorage.setItem(K_SET, "1");
    }
  } catch { /* */ }
}

export function isPinEnabled() { try { return localStorage.getItem(K_EN) !== "0"; } catch { return false; } }
export function getPin() { try { return localStorage.getItem(K_PIN) || DEFAULT_PIN; } catch { return DEFAULT_PIN; } }

export function setPin(p) {
  const v = String(p).replace(/\D/g, "").slice(0, 4);
  if (v.length !== 4) return false;
  try { localStorage.setItem(K_PIN, v); localStorage.setItem(K_EN, "1"); localStorage.setItem(K_SET, "1"); } catch { /* */ }
  return true;
}

export function setPinEnabled(v) {
  try {
    localStorage.setItem(K_EN, v ? "1" : "0");
    localStorage.setItem(K_SET, "1");
    if (!v) localStorage.setItem(K_UN, "1"); // disattivato → sempre sbloccato
  } catch { /* */ }
}

export function isUnlocked() { try { return localStorage.getItem(K_UN) === "1"; } catch { return true; } }
export function unlockWith(p) {
  if (String(p) === getPin()) { try { localStorage.setItem(K_UN, "1"); } catch { /* */ } return true; }
  return false;
}
export function lockNow() { try { localStorage.setItem(K_UN, "0"); } catch { /* */ } }

// --- PIN UNICO GLOBALE (backend) ---
// Il Capo imposta il PIN sul server; tutti i dispositivi verificano lì.
// Offline: fallback all'ultimo PIN valido salvato in cache su questo dispositivo.
export async function verifyPin(p) {
  const v = String(p).replace(/\D/g, "").slice(0, 4);
  if (v.length !== 4) return false;
  try {
    const { productionPinApi } = await import("@/lib/api");
    const res = await productionPinApi.verify(v);
    if (res && res.ok) {
      try { localStorage.setItem(K_PIN, v); localStorage.setItem(K_UN, "1"); localStorage.setItem(K_SET, "1"); } catch { /* */ }
      return true;
    }
    return false;
  } catch {
    // Server irraggiungibile (offline): confronto con l'ultimo PIN valido in cache.
    if (v === getPin()) { try { localStorage.setItem(K_UN, "1"); } catch { /* */ } return true; }
    return false;
  }
}

// Il Capo (admin) aggiorna il PIN unico sul server. Lancia in caso di errore (es. 403 non admin).
export async function setPinRemote(p) {
  const v = String(p).replace(/\D/g, "").slice(0, 4);
  if (v.length !== 4) throw new Error("pin_invalid");
  const { productionPinApi } = await import("@/lib/api");
  await productionPinApi.set(v);
  try { localStorage.setItem(K_PIN, v); localStorage.setItem(K_EN, "1"); localStorage.setItem(K_SET, "1"); } catch { /* */ }
  return true;
}

// Bloccato all'avvio se il PIN è attivo e non è ancora stato sbloccato su questo dispositivo.
export function isLocked() { ensurePinDefault(); return isPinEnabled() && !isUnlocked(); }
