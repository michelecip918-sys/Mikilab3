// Stato "La mia cucina" — TUTTO nel dispositivo, niente sul server.
const OVEN_KEY = "mikilab_oven_adj";       // aggiustamento °C cumulativo (±20)
const KTEMP_KEY = "mikilab_kitchen_temp";  // temperatura abituale cucina °C
const DIARY_KEY = "mikilab_diary";         // [{ts,recipe,rating,note}]
const REMEMBER_KEY = "mikilab_remember";   // "1" se Sitor ricorda
const TOOLS_KEY = "mikilab_my_tools";

const rd = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } };
const wr = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* */ } };

export const getOvenAdj = () => Number(rd(OVEN_KEY, 0)) || 0;
export const bumpOvenAdj = (delta) => { const n = Math.max(-20, Math.min(20, getOvenAdj() + delta)); wr(OVEN_KEY, n); return n; };
export const getKitchenTemp = () => rd(KTEMP_KEY, null);
export const setKitchenTemp = (t) => wr(KTEMP_KEY, t);

export const getDiary = () => rd(DIARY_KEY, []);
export const addDiary = (entry) => { const d = getDiary(); d.unshift({ ts: Date.now(), ...entry }); wr(DIARY_KEY, d.slice(0, 50)); return d; };

export const getRemember = () => rd(REMEMBER_KEY, "0") === "1";
export const setRemember = (on) => wr(REMEMBER_KEY, on ? "1" : "0");

export const getTools = () => rd(TOOLS_KEY, {});

// P1 — "Il mio palato": assaggi salvati SOLO nel dispositivo. [{ts,recipe,scores:{},note}]
const PALATO_KEY = "mikilab_palato";
export const getPalato = () => rd(PALATO_KEY, []);
export const addPalato = (entry) => { const d = getPalato(); d.unshift({ ts: Date.now(), ...entry }); wr(PALATO_KEY, d.slice(0, 50)); return d; };
export const getLastPalato = (recipe) => getPalato().find((e) => e.recipe === recipe) || null;

// V85 — "La mappa del tuo forno": 9 zone (dietro/centro/davanti × sinistra/centro/destra), valori chiaro/giusto/scuro.
const OVENMAP_KEY = "mikilab_oven_map";
export const getOvenMap = () => { const m = rd(OVENMAP_KEY, null); return m && Array.isArray(m.grid) && m.grid.length === 9 ? m.grid : null; };
export const setOvenMap = (grid, analysis) => {
  wr(OVENMAP_KEY, { grid, hot: (analysis && analysis.hot) || [], cold: (analysis && analysis.cold) || [], ts: Date.now() });
  if (analysis && analysis.adj) wr(OVEN_KEY, analysis.adj);
};
export const clearOvenMap = () => { try { localStorage.removeItem(OVENMAP_KEY); } catch { /* */ } };
// Una riga di testo per Sitor (o null): es. "scalda di più dietro e a destra".
export function ovenMapSummary(lang) {
  const m = rd(OVENMAP_KEY, null); if (!m || !Array.isArray(m.grid)) return null;
  const hot = m.hot || [], cold = m.cold || [];
  if (!hot.length && !cold.length) return lang === "de" ? "backt gleichmäßig" : lang === "en" ? "bakes evenly" : "cuoce uniforme";
  const p = [];
  if (hot.length) p.push((lang === "de" ? "heizt stärker " : lang === "en" ? "runs hotter " : "scalda di più ") + hot.join(lang === "de" ? " und " : lang === "en" ? " and " : " e "));
  if (cold.length) p.push((lang === "de" ? "schwächer " : lang === "en" ? "cooler " : "scalda meno ") + cold.join(lang === "de" ? " und " : lang === "en" ? " and " : " e "));
  return p.join(", ");
}

export const clearMyKitchen = () => { [OVEN_KEY, KTEMP_KEY, DIARY_KEY, REMEMBER_KEY, PALATO_KEY, OVENMAP_KEY].forEach((k) => { try { localStorage.removeItem(k); } catch { /* */ } }); };

// Riassunto (max 400 char) aggiunto alla chat SOLO se "ricorda" è attivo.
export function chatMemorySummary() {
  if (!getRemember()) return null;
  const parts = [];
  const t = getTools(); const tv = Object.entries(t).filter(([, v]) => v).map(([k, v]) => `${k}:${v}`);
  if (tv.length) parts.push("attrezzi " + tv.join(", "));
  const oa = getOvenAdj(); if (oa) parts.push(`forno ${oa > 0 ? "+" : ""}${oa}°C`);
  const kt = getKitchenTemp(); if (kt) parts.push(`cucina ~${kt}°C`);
  const om = ovenMapSummary("it"); if (om) parts.push(`mappa forno: ${om}`);
  const d = getDiary().slice(0, 3);
  if (d.length) parts.push("ultime prove: " + d.map((e) => `${e.recipe || ""} ${e.rating || ""}/5 ${e.note || ""}`.trim()).join(" | "));
  const s = parts.join("; ");
  return s ? s.slice(0, 400) : null;
}

// Oggetto tools completo da inviare a /sitor/chat (attrezzi + forno + cucina + memoria).
export function chatTools() {
  const t = { ...getTools() };
  const oa = getOvenAdj(); if (oa) t.forno = `${oa > 0 ? "+" : ""}${oa}°C rispetto alla ricetta`;
  const kt = getKitchenTemp(); if (kt) t.cucina = `${kt}°C`;
  const mem = chatMemorySummary(); if (mem) t.memoria = mem;
  return t;
}
