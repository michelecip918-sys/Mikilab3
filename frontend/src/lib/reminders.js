// Promemoria/sveglie estratti dalla timeline del coach.
// Locale (Notification + setTimeout mentre l'app è aperta) + persistente (Web Push via backend).
import { pushApi } from "@/lib/api";
const KEY = "mikilab_reminders";

function urlB64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

async function ensurePushSubscription() {
  try {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      const key = await pushApi.vapid();
      if (!key) return false;
      sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlB64ToUint8Array(key) });
    }
    await pushApi.subscribe(sub.toJSON());
    return true;
  } catch { return false; }
}


// Estrae righe con un orario (HH:MM, HH.MM, oppure 12h con AM/PM) da un testo markdown.
export function parseTimeline(text) {
  const out = [];
  if (!text) return out;
  const lines = text.split(/\r?\n/);
  // 12h (8:00 PM) o 24h (21:00 / 21.00)
  const re12 = /\b(1[0-2]|0?[1-9])[:.]([0-5]\d)\s*(a\.?m\.?|p\.?m\.?|AM|PM)\b/;
  const re24 = /\b([01]?\d|2[0-3])[:.]([0-5]\d)\b/;
  const headerRe = /^[⚡🥖⏱️🔘🔊🔧🚨]/u;
  for (let raw of lines) {
    // pulizia: rimuove bullet, cancelletti, e i pipe delle tabelle markdown
    let line = raw.replace(/^[\s\-*#>•]+/, "").replace(/\|/g, " ").replace(/\s+/g, " ").trim();
    if (!line || line.length < 3) continue;
    if (headerRe.test(line)) continue;                 // salta le righe-intestazione (⚡/🥖/…)
    if (/^[:\- ]*$/.test(line.replace(/[a-z]/gi, ""))) continue;

    let hh = null, mm = null, matchStr = null;
    const m12 = line.match(re12);
    if (m12) {
      hh = Number(m12[1]) % 12; mm = m12[2];
      if (/p/i.test(m12[3])) hh += 12;
      hh = String(hh).padStart(2, "0"); matchStr = m12[0];
    } else {
      const m = line.match(re24);
      if (!m) continue;
      hh = m[1].padStart(2, "0"); mm = m[2]; matchStr = m[0];
    }
    const time = `${hh}:${mm}`;
    // etichetta = riga senza markdown e senza l'orario stesso, deve avere del testo residuo
    let label = line.replace(/\*\*/g, "").replace(/`/g, "");
    label = label.replace(matchStr, "").replace(/^[\s\-–—:•]+/, "").trim();
    if (label.replace(/[^a-zA-Zàèéìòùäöüß]/g, "").length < 3) continue;  // niente testo utile → scarta
    if (label.length > 120) label = label.slice(0, 120) + "…";
    out.push({ time, label });
    if (out.length >= 12) break;                       // massimo 12 promemoria
  }
  return out;
}

export function getReminders() {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}

export function clearReminders() {
  try { localStorage.removeItem(KEY); } catch { /* */ }
}

// Salva gli step: notifiche locali (oggi) + push persistente lato server.
export async function saveReminders(steps) {
  const items = (steps || []).map((s, i) => ({ id: `${Date.now()}-${i}`, ...s }));
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* */ }
  let permission = typeof Notification !== "undefined" ? Notification.permission : "denied";
  if (typeof Notification !== "undefined" && permission === "default") {
    try { permission = await Notification.requestPermission(); } catch { /* */ }
  }
  const now = new Date();
  // orari assoluti (oggi) per ogni step; se già passato oggi, si intende domani
  const withDue = items.map((s) => {
    const [h, m] = s.time.split(":").map(Number);
    const when = new Date(); when.setHours(h, m, 0, 0);
    if (when.getTime() <= now.getTime()) when.setDate(when.getDate() + 1);
    return { ...s, dueDate: when };
  });
  // notifiche locali immediate (mentre l'app resta aperta)
  if (permission === "granted") {
    withDue.forEach((s) => {
      const ms = s.dueDate.getTime() - now.getTime();
      if (ms > 0 && ms < 24 * 3600 * 1000) {
        setTimeout(() => { try { new Notification("MikiLab · " + s.time, { body: s.label }); } catch { /* */ } }, ms);
      }
    });
  }
  // salvataggio persistente lato server (sopravvive al reload; push se disponibile)
  let persistent = false;
  const payload = withDue.map((s) => ({ time: s.time, label: s.label, due: s.dueDate.toISOString() }));
  if (permission === "granted") { try { await ensurePushSubscription(); } catch { /* */ } }
  try {
    const r = await pushApi.saveReminders(payload);
    persistent = !!(r && r.ok);
  } catch { /* utente non loggato o errore: resta solo locale */ }
  return { count: items.length, permission, persistent };
}
