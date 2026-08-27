// Promemoria/sveglie estratti dalla timeline del coach (best-effort, sessione + Notification API).
const KEY = "mikilab_reminders";

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

// Salva gli step e prova a programmare notifiche per gli orari ancora futuri di oggi.
export async function saveReminders(steps) {
  const items = (steps || []).map((s, i) => ({ id: `${Date.now()}-${i}`, ...s }));
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* */ }
  let permission = typeof Notification !== "undefined" ? Notification.permission : "denied";
  if (typeof Notification !== "undefined" && permission === "default") {
    try { permission = await Notification.requestPermission(); } catch { /* */ }
  }
  if (permission === "granted") {
    const now = new Date();
    items.forEach((s) => {
      const [h, m] = s.time.split(":").map(Number);
      const when = new Date(); when.setHours(h, m, 0, 0);
      const ms = when.getTime() - now.getTime();
      if (ms > 0 && ms < 24 * 3600 * 1000) {
        setTimeout(() => { try { new Notification("MikiLab · " + s.time, { body: s.label }); } catch { /* */ } }, ms);
      }
    });
  }
  return { count: items.length, permission };
}
