import { weeklyApi } from "@/lib/api";
import { recipeTitle } from "@/lib/loc";

// Giorni: JS getDay() 0=dom..6=sab → id piano.
const DAY_IDS = ["dom", "lun", "mar", "mer", "gio", "ven", "sab"];
export const dayKeyForDate = (d = new Date()) => DAY_IDS[d.getDay()];
export const todayKey = () => dayKeyForDate(new Date());
export const tomorrowKey = () => { const d = new Date(); d.setDate(d.getDate() + 1); return dayKeyForDate(d); };

export const dayLabel = (key, lang = "it") => {
  const M = {
    lun: ["lunedì", "Montag", "Monday", "lunes"], mar: ["martedì", "Dienstag", "Tuesday", "martes"],
    mer: ["mercoledì", "Mittwoch", "Wednesday", "miércoles"], gio: ["giovedì", "Donnerstag", "Thursday", "jueves"],
    ven: ["venerdì", "Freitag", "Friday", "viernes"], sab: ["sabato", "Samstag", "Saturday", "sábado"],
    dom: ["domenica", "Sonntag", "Sunday", "domingo"],
  };
  const i = lang === "de" ? 1 : lang === "en" ? 2 : lang === "es" ? 3 : 0;
  return (M[key] || M.lun)[i];
};

export async function fetchWeeklyItems() {
  try { const plan = await weeklyApi.get(); return (plan && plan.items) || []; }
  catch { return []; }
}

export const itemsForDay = (items, key) => (items || []).filter((it) => it.day === key);

// Riassunto parlato della produzione di un giorno.
export function summarizeDay(items, key, lang = "it") {
  const day = dayLabel(key, lang);
  const dayItems = itemsForDay(items, key);
  if (dayItems.length === 0) {
    return lang === "de" ? `Für ${day} ist keine Produktion geplant.`
      : lang === "en" ? `No production planned for ${day}.`
      : lang === "es" ? `No hay producción prevista para ${day}.`
      : `Per ${day} non c'è produzione in piano.`;
  }
  const parts = dayItems.map((it) => {
    const n = Math.round(it.pieces || 0);
    const nm = it.recipe_name || "";
    return lang === "de" ? `${n} Stück ${nm}` : lang === "en" ? `${n} ${nm}` : lang === "es" ? `${n} ${nm}` : `${n} pezzi di ${nm}`;
  });
  const list = parts.join(lang === "de" ? ", " : ", ");
  const head = lang === "de" ? `${day}: ${dayItems.length} Lose — ${list}.`
    : lang === "en" ? `${day}: ${dayItems.length} batches — ${list}.`
    : lang === "es" ? `${day}: ${dayItems.length} lotes — ${list}.`
    : `${day}: ${dayItems.length} lotti — ${list}.`;
  return head;
}

// Trova la ricetta di un item nel catalogo caricato.
export const recipeForItem = (recipes, item) =>
  (recipes || []).find((r) => (r.id || r.recipe_id) === item.recipe_id) || null;

export { recipeTitle };
