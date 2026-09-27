// V128 — IL PIANO DI MIKILAB. Due modi di cominciare, decisi da chi entra:
// • «Sto imparando»: un percorso in sei tappe, dai primi panini al panettone. Si va avanti segnando «fatta»
//   dentro la ricetta (la stessa chiave di sempre: mikilab_done). Una tappa si può saltare.
// • «So già panificare» (o chi guarda e basta): quattro ricette SEMPRE DIVERSE a ogni visita, ma con una logica:
//   il pane di oggi (uguale per tutti, come nell'almanacco), una facile (o una sfida), una da un reparto che non
//   vedi da un po', una a sorpresa. Le ultime 48 mostrate non tornano subito.
// Tutto resta nel telefono (localStorage/sessionStorage). Le ricette si trovano per NOME, così gli id non contano.
import { recipeCategory } from "@/lib/recipeCats";
import { breadOfToday } from "@/components/Almanacco";

export const DONE_KEY = "mikilab_done";
export const SKILL_KEY = "mikilab_skill"; // "learning" | "expert"
export const SALTI_KEY = "mikilab_piano_salti";
export const VISTI_KEY = "mikilab_home_visti";
export const SCELTA_KEY = "mikilab_home_scelta"; // sessionStorage

const T = (it, de, en) => ({ it, de, en });

export const TAPPE = [
  {
    k: "panini", t: T("Panini semplici", "Einfache Brötchen", "Simple rolls"),
    d: T("Impasto diretto con il lievito di birra: impari a impastare, formare e cuocere.", "Direkte Führung mit Hefe: du lernst kneten, formen und backen.", "A direct dough with yeast: you learn to knead, shape and bake."),
    names: ["Panino al Latte per Hamburger", "Panino alle Patate", "Panino al Sesamo", "Panino ai Semi di Papavero", "Panino al Farro"],
    cats: ["panini"],
  },
  {
    k: "crescono", t: T("Panini che crescono", "Brötchen, die wachsen", "Rolls that grow"),
    d: T("Altre farine e altri ingredienti nell'impasto: olive, mais, zucca, cereali.", "Andere Mehle und Zutaten im Teig: Oliven, Mais, Kürbis, Körner.", "Other flours and ingredients in the dough: olives, corn, pumpkin, grains."),
    names: ["Panino alle Olive", "Panino al Mais", "Panino alla Zucca", "Panino Integrale", "Panino Multicereali ai 5 Cereali"],
    cats: ["panini"],
  },
  {
    k: "focacce", t: T("Focacce in teglia", "Focaccia im Blech", "Pan focaccia"),
    d: T("La focaccia di Michele: patata lessa, prefermento e un filo d'olio. Impari l'impasto morbido e la teglia.", "Micheles Focaccia: gekochte Kartoffel, Vorteig und ein Schuss Öl. Du lernst den weichen Teig und das Blech.", "Michele's focaccia: boiled potato, pre-ferment and a drizzle of oil. You learn the soft dough and the pan."),
    names: ["Focaccia con Patate e Rosmarino", "Focaccia Genovese", "Focaccia Barese", "Focaccia alle Olive e Rosmarino", "Focaccia di Matera"],
    cats: ["focacce"],
  },
  {
    k: "prefermenti", t: T("Pane con poolish o biga", "Brot mit Poolish oder Biga", "Bread with poolish or biga"),
    d: T("Il prefermento della sera prima: più profumo, più tempo, un pane che dura di più.", "Der Vorteig vom Vorabend: mehr Aroma, mehr Zeit, ein Brot, das länger hält.", "The pre-ferment from the night before: more aroma, more time, a loaf that keeps longer."),
    names: ["Baguette con Poolish", "Quotidiano del Fornaio", "Treccia del Sole", "Carezza Dolce", "Pane agli Spinaci"],
    cats: ["pane"], pre: /poolish|biga/i,
  },
  {
    k: "lievitomadre", t: T("Il lievito madre", "Der Sauerteig", "Sourdough"),
    d: T("Prima crei il tuo lievito madre, poi il pane lento: crosta, profumo e mollica di una volta.", "Erst setzt du deinen Sauerteig an, dann das langsame Brot: Kruste, Duft und Krume wie früher.", "First you create your starter, then the slow bread: crust, aroma and crumb like in the old days."),
    names: ["Pane Casereccio a Lievito Madre", "Baguette a Lievito Madre", "Focaccia a Lievito Madre", "Pane Integrale a Lievito Madre", "Filo di Francia"],
    cats: ["pane", "focacce"], pre: /lm|lievito madre|licoli/i,
    prima: { route: "crealievito", t: T("Prima crea il tuo lievito", "Erst den Sauerteig ansetzen", "First create your starter"), d: T("Da zero, in una settimana: questa tappa lo usa in ogni ricetta.", "Von null, in einer Woche: diese Etappe braucht ihn in jedem Rezept.", "From scratch, in a week: this stage uses it in every recipe.") },
  },
  {
    k: "sfide", t: T("Pizza e grandi lievitati", "Pizza und große Hefeteige", "Pizza and great leavened bakes"),
    d: T("La pizza in teglia, alla pala e napoletana, il pane di Matera e, alla fine, il panettone.", "Pizza im Blech, auf der Schaufel und neapolitanisch, das Brot aus Matera und zum Schluss der Panettone.", "Pan pizza, pala and Neapolitan pizza, the bread of Matera and, at the end, panettone."),
    names: ["Pizza in Teglia alla Romana", "Pizza alla Pala", "Pizza Napoletana (tonda)", "Pane di Matera IGP", "Panettone Artigianale MikiLab — Uvetta e Canditi (Classico)"],
    cats: ["pizza"],
  },
];

const readJSON = (store, key, fb) => { try { const v = JSON.parse(store.getItem(key) || "null"); return v == null ? fb : v; } catch { return fb; } };
export const readDone = () => new Set(readJSON(localStorage, DONE_KEY, []));
export const readSalti = () => new Set(readJSON(localStorage, SALTI_KEY, []));
export const readSkill = () => { try { return localStorage.getItem(SKILL_KEY) || ""; } catch { return ""; } };

export function setSkill(v) {
  try {
    localStorage.setItem(SKILL_KEY, v);
    // Come prima (B2.6): «So già panificare» porta la ricetta in modo Laboratorio, «Sto imparando» in modo Casa.
    localStorage.setItem("mikilab_recipe_mode", v === "expert" ? "esperto" : "casa");
    if (v === "expert") {
      const cur = readJSON(localStorage, "mikilab_pro_scale", {});
      if (!cur.scale) localStorage.setItem("mikilab_pro_scale", JSON.stringify({ ...cur, scale: "laboratorio" }));
    }
  } catch { /* */ }
}

export function saltaTappa(k, on = true) {
  const s = readSalti(); if (on) s.add(k); else s.delete(k);
  try { localStorage.setItem(SALTI_KEY, JSON.stringify([...s])); } catch { /* */ }
  try { window.dispatchEvent(new CustomEvent("mikilab-done-changed")); } catch { /* */ }
}

export function toggleDone(id) {
  const s = readDone(); if (s.has(id)) s.delete(id); else s.add(id);
  try { localStorage.setItem(DONE_KEY, JSON.stringify([...s])); } catch { /* */ }
  try { window.dispatchEvent(new CustomEvent("mikilab-done-changed")); } catch { /* */ }
}

const visible = (r) => r && r.id && !r.hidden && !r.locked && (r.collection_name || "mikilab") === "mikilab";

// Le tappe con le ricette vere. Se un nome non c'è più, la tappa si completa da sola con ricette dello stesso tipo.
export function tappeConRicette(recipes) {
  const list = (recipes || []).filter(visible);
  const byName = {}; list.forEach((r) => { if (r.name) byName[r.name] = r; });
  const used = new Set();
  return TAPPE.map((tp) => {
    const rs = tp.names.map((n) => byName[n]).filter((r) => r && !used.has(r.id));
    if (rs.length < 3) {
      const extra = list.filter((r) => !used.has(r.id) && !rs.includes(r) && tp.cats.includes(recipeCategory(r).key) && (!tp.pre || tp.pre.test(String(r.preferment_type || ""))))
        .sort((a, b) => String(a.name).localeCompare(String(b.name))).slice(0, 5 - rs.length);
      rs.push(...extra);
    }
    rs.forEach((r) => used.add(r.id));
    return { ...tp, recipes: rs };
  });
}

// Dove sei nel percorso: la prima tappa non finita e non saltata, e la prima ricetta ancora da fare.
export function statoPiano(tappe, done = readDone(), salti = readSalti()) {
  const conRicette = tappe.filter((tp) => tp.recipes.length);
  let cur = -1;
  for (let i = 0; i < tappe.length; i += 1) {
    const tp = tappe[i];
    if (!tp.recipes.length || salti.has(tp.k)) continue;
    if (tp.recipes.some((r) => !done.has(r.id))) { cur = i; break; }
  }
  const tp = cur >= 0 ? tappe[cur] : null;
  const fatte = tp ? tp.recipes.filter((r) => done.has(r.id)).length : 0;
  return { cur, tappa: tp, next: tp ? tp.recipes.find((r) => !done.has(r.id)) : null, fatte, totali: tp ? tp.recipes.length : 0, finito: cur < 0 && conRicette.length > 0, n: cur + 1, di: tappe.length };
}

// ——— «Da scoprire»: quattro ricette diverse a ogni visita ———
export const TAG = {
  oggi: T("Il pane di oggi", "Brot des Tages", "Today's bread"),
  facile: T("Facile", "Einfach", "Easy"),
  sfida: T("Sfida", "Herausforderung", "Challenge"),
  nuova: T("Da scoprire", "Neu für dich", "New to you"),
  sorpresa: T("A sorpresa", "Überraschung", "Surprise"),
};

const leggiVisti = () => readJSON(localStorage, VISTI_KEY, []);
function segnaVisti(ids) {
  const old = leggiVisti().filter((x) => !ids.includes(x));
  try { localStorage.setItem(VISTI_KEY, JSON.stringify([...ids, ...old].slice(0, 48))); } catch { /* */ }
}
const dayKey = (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
const rnd = (arr) => arr[Math.floor(Math.random() * arr.length)];

export function scegliQuattro(recipes, extras = {}, { skill = "", nuovo = false, now = new Date() } = {}) {
  const ex = extras || {};
  const pool = (recipes || []).filter((r) => visible(r) && r.image_url && !(ex[r.id] && ex[r.id].hidden_public) && recipeCategory(r).key !== "basi");
  if (!pool.length) return [];
  const precedente = readJSON(sessionStorage, SCELTA_KEY, null);
  if (!nuovo && precedente && precedente.d === dayKey(now) && precedente.s === skill) {
    const byId = {}; pool.forEach((r) => { byId[r.id] = r; });
    const back = (precedente.p || []).map((x) => (byId[x.id] ? { r: byId[x.id], k: x.k } : null)).filter(Boolean);
    if (back.length === 4) return back;
  }
  const visti = leggiVisti();
  const ora = new Set(nuovo && precedente ? (precedente.p || []).map((x) => x.id) : []); // «Altre quattro»: mai le stesse di adesso
  const out = [];
  const preso = (r) => out.some((x) => x.r.id === r.id) || ora.has(r.id);
  const libero = (r) => !preso(r) && !visti.includes(r.id);
  const scegli = (cands, k) => {
    const a = cands.filter(libero); const b = cands.filter((r) => !preso(r));
    const r = a.length ? rnd(a) : b.length ? rnd(b) : null;
    if (r) out.push({ r, k });
  };
  // 1) il pane di oggi: lo stesso dell'almanacco, uguale per tutti per tutto il giorno
  let oggi = null;
  try { oggi = breadOfToday(pool, now); } catch { oggi = null; }
  if (oggi && !ora.has(oggi.id)) out.push({ r: oggi, k: "oggi" });
  // 2) una facile, o una sfida per chi sa già panificare
  const want = skill === "expert" ? "sfida" : "facile";
  scegli(pool.filter((r) => (ex[r.id] || {}).difficulty === want), want);
  // 3) da un reparto che non vedi da un po'
  const catOf = (r) => recipeCategory(r).key;
  const usate = new Set(out.map((x) => catOf(x.r)));
  const ultima = {}; // per ogni reparto: quanto tempo fa l'hai visto (0 = adesso)
  visti.forEach((id, i) => { const r = pool.find((x) => x.id === id); if (r && ultima[catOf(r)] === undefined) ultima[catOf(r)] = i; });
  const reparti = [...new Set(pool.map(catOf))].filter((c) => !usate.has(c));
  reparti.sort((a, b) => (ultima[b] === undefined ? 999 : ultima[b]) - (ultima[a] === undefined ? 999 : ultima[a]) || Math.random() - 0.5);
  if (reparti.length) scegli(pool.filter((r) => catOf(r) === reparti[0]), "nuova");
  // 4) a sorpresa, da un reparto che non c'è ancora tra le quattro; se manca qualcosa si riempie
  while (out.length < 4 && out.length < pool.length) {
    const n = out.length; const gia = new Set(out.map((x) => catOf(x.r)));
    const altro = pool.filter((r) => !gia.has(catOf(r)) && !preso(r));
    scegli(altro.length ? altro : pool, "sorpresa");
    if (out.length === n) break;
  }
  const scelta = out.slice(0, 4);
  segnaVisti(scelta.map((x) => x.r.id));
  try { sessionStorage.setItem(SCELTA_KEY, JSON.stringify({ d: dayKey(now), s: skill, p: scelta.map((x) => ({ id: x.r.id, k: x.k })) })); } catch { /* */ }
  return scelta;
}
