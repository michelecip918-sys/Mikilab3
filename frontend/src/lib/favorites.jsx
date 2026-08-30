import { useState, useEffect, useCallback } from "react";
import { favApi } from "@/lib/api";

// Preferiti ricette: ottimistici in localStorage + sincronizzati sull'ACCOUNT quando loggato.
// Sincronizzati fra tutte le viste (lista, dettaglio, Custodite) tramite evento globale.
const KEY = "mikilab_fav_recipes";
const EVT = "mikilab-favs-changed";

export function getFavs() {
  try { return new Set(JSON.parse(localStorage.getItem(KEY) || "[]")); } catch { return new Set(); }
}

function writeLocal(set) {
  try { localStorage.setItem(KEY, JSON.stringify([...set])); } catch { /* */ }
  window.dispatchEvent(new CustomEvent(EVT));
}

export function toggleFavId(id) {
  const s = getFavs();
  if (s.has(id)) s.delete(id); else s.add(id);
  writeLocal(s);
  favApi.toggle(id).catch(() => {});  // ospiti (401) → resta solo in locale
  return s;
}

let countsCache = null;

export function useFavRecipes() {
  const [favs, setFavs] = useState(getFavs);
  const [counts, setCounts] = useState(() => countsCache || {});

  useEffect(() => {
    const on = () => setFavs(getFavs());
    window.addEventListener(EVT, on);
    window.addEventListener("storage", on);
    return () => { window.removeEventListener(EVT, on); window.removeEventListener("storage", on); };
  }, []);

  // Al mount: unisci i preferiti locali con quelli dell'account (se loggato) + carica i conteggi pubblici.
  useEffect(() => {
    let alive = true;
    favApi.sync([...getFavs()])
      .then((serverIds) => {
        if (!alive || !Array.isArray(serverIds)) return;
        const merged = new Set(serverIds);
        writeLocal(merged);
        setFavs(merged);
      })
      .catch(() => { /* ospite: resta il locale */ });
    favApi.counts().then((c) => { if (alive && c) { countsCache = c; setCounts(c); } }).catch(() => {});
    return () => { alive = false; };
  }, []);

  const toggle = useCallback((id) => {
    setFavs(toggleFavId(id));
    // aggiorna il conteggio pubblico dopo un attimo
    setTimeout(() => favApi.counts().then((c) => { if (c) { countsCache = c; setCounts(c); } }).catch(() => {}), 400);
  }, []);

  return { favs, toggle, isFav: (id) => favs.has(id), counts, countOf: (id) => counts[id] || 0 };
}
