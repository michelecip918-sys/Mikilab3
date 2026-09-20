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
// M2: il sito pubblico non ha account: se il server risponde 401/404 una volta,
// non richiamare più gli endpoint account (niente rumore in console).
let serverDead = false;
const markDead = (err) => { if (err && err.response && (err.response.status === 401 || err.response.status === 403 || err.response.status === 404)) serverDead = true; };

// Idrata i preferiti dell'account nel localStorage (da chiamare al bootstrap/login,
// così la categoria "Preferite" è disponibile ovunque, non solo nella tab Ricette).
export function hydrateFavs() {
  if (serverDead) return Promise.resolve();
  return favApi.sync([...getFavs()])
    .then((serverIds) => { if (Array.isArray(serverIds)) writeLocal(new Set(serverIds)); })
    .catch((e) => { markDead(e); });
}

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
    if (serverDead) return () => { alive = false; };
    favApi.sync([...getFavs()])
      .then((serverIds) => {
        if (!alive || !Array.isArray(serverIds)) return;
        const merged = new Set(serverIds);
        writeLocal(merged);
        setFavs(merged);
      })
      .catch((e) => { markDead(e); /* ospite: resta il locale */ });
    if (!serverDead) favApi.counts().then((c) => { if (alive && c) { countsCache = c; setCounts(c); } }).catch((e) => { markDead(e); });
    return () => { alive = false; };
  }, []);

  const toggle = useCallback((id) => {
    setFavs(toggleFavId(id));
    // aggiorna il conteggio pubblico dopo un attimo
    if (!serverDead) setTimeout(() => favApi.counts().then((c) => { if (c) { countsCache = c; setCounts(c); } }).catch((e) => { markDead(e); }), 400);
  }, []);

  return { favs, toggle, isFav: (id) => favs.has(id), counts, countOf: (id) => counts[id] || 0 };
}
