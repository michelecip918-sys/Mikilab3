// V88 — "La tua bottega": quello che il sito sa di te, SOLO dal tuo telefono (localStorage/IndexedDB).
// Nome (facoltativo), ultima ricetta aperta, lievito, ricette fatte, quaderno del forno, pane della settimana.
// Niente di tutto questo lascia il dispositivo.
import { idbGet } from "@/lib/idbCache";

const rd = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } };
const wr = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* */ } };

export const getName = () => { try { return localStorage.getItem("mikilab_nome") || ""; } catch { return ""; } };
export const setName = (n) => { try { localStorage.setItem("mikilab_nome", String(n || "").slice(0, 24)); } catch { /* */ } };

export const getLastRecipe = () => rd("mikilab_last_recipe", null); // {id, name, ts}
export const setLastRecipe = (r) => wr("mikilab_last_recipe", r);

export const getDoneCount = () => { try { return (JSON.parse(localStorage.getItem("mikilab_done") || "[]") || []).length; } catch { return 0; } };

// Lievito: il "figlio" corrente e il suo stato di fame.
export function getLievito() {
  const s = rd("mikilab_lievito_figlio", null);
  if (!s || !Array.isArray(s.list) || !s.list.length) return null;
  const cur = s.list.find((x) => x.id === s.cur) || s.list[0];
  const last = cur.feeds && cur.feeds[0] ? cur.feeds[0].ts : null;
  const hours = last ? (Date.now() - last) / 3600000 : null;
  const limit = cur.home === "frigo" ? 168 : 24;
  const days = Math.max(0, Math.floor((Date.now() - new Date(cur.birth).getTime()) / 86400000));
  return { name: cur.name, days, hours, hungry: hours != null && hours > limit, veryHungry: hours != null && hours > limit * 2 };
}

// Quaderno "Il mio forno" (IndexedDB): numero di prove e settimane di fila con almeno una prova.
export async function getForno() {
  const items = (await idbGet("mioforno")) || [];
  if (!Array.isArray(items)) return { count: 0, streak: 0 };
  const wk = (t) => Math.floor((new Date(t).getTime() - 4 * 86400000) / (7 * 86400000)); // settimane (lunedì)
  const set = new Set(items.map((i) => wk(i.at)));
  let streak = 0; let w = wk(Date.now());
  if (!set.has(w)) w -= 1; // la settimana corrente può essere ancora vuota
  while (set.has(w)) { streak += 1; w -= 1; }
  return { count: items.length, streak };
}

// Titolo del panettiere, dal quaderno e dalle ricette fatte.
export function bakerTitle(doneCount, fornoCount, L) {
  const n = doneCount + fornoCount;
  if (n >= 20) return { icon: "🏅", t: L("Maestro di casa", "Hausmeisterbäcker", "Home master baker") };
  if (n >= 8) return { icon: "🥐", t: L("Fornaio di casa", "Hausbäcker", "Home baker") };
  if (n >= 2) return { icon: "🥖", t: L("Apprendista", "Lehrling", "Apprentice") };
  return { icon: "🌾", t: L("Nuovo in bottega", "Neu in der Backstube", "New in the bakery") };
}

// Il pane della settimana: scelta fissa per tutti nella stessa settimana (nessun server), tra le ricette
// visibili di pane/panini/focacce/pizza; a dicembre anche i panettoni. Sempre la stessa per tutta la settimana.
export function isoWeek(d = new Date()) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day);
  const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return `${t.getUTCFullYear()}-${Math.ceil(((t - y0) / 86400000 + 1) / 7)}`;
}
export function weeklyPick(recipes) {
  const month = new Date().getMonth();
  const cats = ["pane", "panini", "focacce", "pizza"].concat(month === 11 || month === 10 ? ["panettoni"] : []);
  const pool = (recipes || []).filter((r) => !r.hidden && cats.includes(r.menu_category)).sort((a, b) => String(a.id).localeCompare(String(b.id)));
  if (!pool.length) return null;
  const wk = isoWeek(); let h = 0; for (const c of wk) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return pool[h % pool.length];
}
export const getWeekPlan = () => { const p = rd("mikilab_pane_settimana", null); return p && p.week === isoWeek() ? p : null; };
export const setWeekPlan = (id) => wr("mikilab_pane_settimana", { week: isoWeek(), id, ts: Date.now() });
export const clearWeekPlan = () => { try { localStorage.removeItem("mikilab_pane_settimana"); } catch { /* */ } };

// Giorni a domenica (0 = oggi è domenica)
export function daysToSunday() { const d = new Date().getDay(); return d === 0 ? 0 : 7 - d; }
