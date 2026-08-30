import { useState, useEffect, useCallback } from "react";

// Preferiti ricette: persistiti in localStorage e sincronizzati fra tutte le viste
// (lista MikiLab, dettaglio, Ricette Custodite) tramite un evento globale.
const KEY = "mikilab_fav_recipes";
const EVT = "mikilab-favs-changed";

export function getFavs() {
  try { return new Set(JSON.parse(localStorage.getItem(KEY) || "[]")); } catch { return new Set(); }
}

export function toggleFavId(id) {
  const s = getFavs();
  if (s.has(id)) s.delete(id); else s.add(id);
  try { localStorage.setItem(KEY, JSON.stringify([...s])); } catch { /* */ }
  window.dispatchEvent(new CustomEvent(EVT));
  return s;
}

export function useFavRecipes() {
  const [favs, setFavs] = useState(getFavs);
  useEffect(() => {
    const on = () => setFavs(getFavs());
    window.addEventListener(EVT, on);
    window.addEventListener("storage", on);
    return () => { window.removeEventListener(EVT, on); window.removeEventListener("storage", on); };
  }, []);
  const toggle = useCallback((id) => setFavs(toggleFavId(id)), []);
  return { favs, toggle, isFav: (id) => favs.has(id) };
}
