// Registro locale delle conversazioni AI (per lo storico in "I Miei Dati Salvati").
// I messaggi restano nel backend (chat_messages per session_id); qui teniamo solo
// l'elenco delle sessioni avviate su questo dispositivo.
const KEY = "mikilab_chats";

export function registerChat(id, kind) {
  if (!id) return;
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || "[]").filter((c) => c.id !== id);
    list.push({ id, kind: kind || "maestro", ts: Date.now() });
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch { /* noop */ }
}

export function getChats() {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || "[]");
    return list.sort((a, b) => (b.ts || 0) - (a.ts || 0));
  } catch { return []; }
}

export function removeChat(id) {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || "[]").filter((c) => c.id !== id);
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch { /* noop */ }
}
