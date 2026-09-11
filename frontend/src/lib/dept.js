// Reparto attivo del Capo (stato GLOBALE, condiviso da Ricette / Magazzino / Piano).
// Persistito in localStorage e propagato con un CustomEvent così ogni sezione si aggiorna.
import { useState, useEffect } from "react";

export const DEPTS = ["panificazione", "pizzeria", "pasticceria"];
const KEY = "mikilab_capo_dept";

// Mappa l'attività globale (selettore in alto: panificio/pizzeria/pasticceria)
// al reparto ricetta corrispondente. Serve per assegnare in automatico il
// reparto attivo alle ricette create dal Capo.
export const ACTIVITY_TO_DEPT = { panificio: "panificazione", panificazione: "panificazione", pizzeria: "pizzeria", pasticceria: "pasticceria" };

// Reparto attivo dedotto dall'attività globale del negozio (mikilab_activity).
export function activeDeptFromActivity() {
  try {
    const a = localStorage.getItem("mikilab_activity") || "panificio";
    return ACTIVITY_TO_DEPT[a] || "panificazione";
  } catch { return "panificazione"; }
}

// Migrazione una-tantum: ripristina la vista COMPLETA del ricettario (tutte le ricette)
// per chi aveva salvato un reparto specifico prima di questa release.
try {
  if (typeof localStorage !== "undefined" && !localStorage.getItem("mikilab_dept_reset_v2")) {
    localStorage.setItem(KEY, "tutti");
    localStorage.setItem("mikilab_dept_reset_v2", "1");
  }
} catch { /* */ }

export function getDept() {
  try { return localStorage.getItem(KEY) || "tutti"; } catch { return "tutti"; }
}

export function setDept(d) {
  try { localStorage.setItem(KEY, d); } catch { /* */ }
  window.dispatchEvent(new CustomEvent("mikilab-dept-changed", { detail: { dept: d } }));
}

export function useDept() {
  const [dept, setD] = useState(getDept);
  useEffect(() => {
    const h = (e) => setD((e && e.detail && e.detail.dept) || getDept());
    window.addEventListener("mikilab-dept-changed", h);
    window.addEventListener("storage", h);
    return () => { window.removeEventListener("mikilab-dept-changed", h); window.removeEventListener("storage", h); };
  }, []);
  return dept;
}

const PIZZA_RE = /pizza|pinsa|teglia romana|padellino|focaccia|schiacciat/i;
const PASTRY_RE = /panettone|colomba|pandoro|veneziana|stollen|croissant|cornett|brioche|sfogliat|pain au|danish|plunder|kranz|treccia dolce|babka|maritozz|girella|saccottino|kipferl|torta|crostata|bign|dolce|biscott|pasticc|cannol|muffin|cupcake/i;

// Deduzione automatica del reparto da una ricetta.
// Priorità: campo manuale `department` → categoria → euristica sul nome.
export function recipeDept(r) {
  if (!r) return "panificazione";
  if (DEPTS.includes(r.department)) return r.department;
  const cat = (r.menu_category || "").toLowerCase();
  const name = (r.name || "").toLowerCase();
  if (cat === "pizza") return "pizzeria";
  if (["viennoiserie", "panettoni", "pasticceria"].includes(cat)) return "pasticceria";
  if (PASTRY_RE.test(name)) return "pasticceria";
  if (PIZZA_RE.test(name)) return "pizzeria";
  return "panificazione";
}

// Un elemento con `department` (ricetta o materia prima) rientra nel reparto attivo?
// Le materie prime SENZA reparto assegnato sono considerate condivise (sempre visibili).
export function matchDept(item, active, { autoDeduce = false } = {}) {
  if (!active || active === "tutti") return true;
  if (autoDeduce) return recipeDept(item) === active;
  const d = item && item.department;
  if (!d) return true; // condiviso
  return d === active;
}

export function deptLabel(d, tri) {
  const f = tri || ((i) => i);
  if (d === "pizzeria") return "Pizzeria";
  if (d === "pasticceria") return f("Pasticceria", "Konditorei", "Pastry", "Pastelería", "Pâtisserie", "قنادی");
  if (d === "tutti") return f("Tutti i reparti", "Alle Bereiche", "All departments", "Todos los departamentos", "Tous les rayons", "همه بخش‌ها");
  return f("Panificazione", "Bäckerei", "Bakery", "Panadería", "Boulangerie", "نانوایی");
}

export function deptIcon(d) {
  return d === "pizzeria" ? "🍕" : d === "pasticceria" ? "🥐" : d === "tutti" ? "👑" : "🍞";
}
