// Coda di sincronizzazione offline (bunker mode): le azioni fatte senza rete
// (avanzamento step, avvio turno) vengono salvate in locale e rigiocate al ritorno online.
const KEY = "mikilab_sync_queue";
const handlers = {};

function read() {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
function write(q) {
  try { localStorage.setItem(KEY, JSON.stringify(q)); } catch { /* */ }
  try { window.dispatchEvent(new CustomEvent("mikilab-sync-changed", { detail: { size: q.length } })); } catch { /* */ }
}

export function enqueue(type, payload) {
  const q = read();
  q.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, type, payload, at: new Date().toISOString() });
  write(q);
}

export function queueSize() { return read().length; }

export function registerHandler(type, fn) { handlers[type] = fn; }

let flushing = false;
export async function flushQueue() {
  if (flushing) return 0;
  flushing = true;
  let q = read();
  if (!q.length) { flushing = false; return 0; }
  const remaining = [];
  let done = 0;
  for (const it of q) {
    const h = handlers[it.type];
    if (!h) { remaining.push(it); continue; }
    try { await h(it.payload); done += 1; }
    catch { remaining.push(it); }
  }
  write(remaining);
  flushing = false;
  return done;
}

if (typeof window !== "undefined") {
  window.addEventListener("online", () => { flushQueue(); });
}
