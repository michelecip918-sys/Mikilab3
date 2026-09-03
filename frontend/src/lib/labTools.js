import { useState, useEffect, useCallback, useRef } from "react";

const KEY = "mikilab_labtools_v1";

// Parco macchine reale: stati ciclabili (il Capo tocca per aggiornare lo stato vero).
export const LAB_TOOLS_DEF = [
  { id: "spirale", name: "Impastatrice Spirale 50kg", states: ["Pronta", "In uso", "Ferma"], colors: ["#10b981", "#f59e0b", "#94a3b8"] },
  { id: "forno", name: "Forno Rotativo a Carrello", states: ["Spento", "In temperatura", "Pronto"], colors: ["#94a3b8", "#f59e0b", "#10b981"] },
  { id: "armadio", name: "Armadio Fermo-Lievitazione", states: ["Attivo", "In pausa", "Spento"], colors: ["#10b981", "#f59e0b", "#94a3b8"] },
];

const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || "null") || {}; } catch { return {}; } };

export function useLabTools() {
  const [st, setSt] = useState(load);
  const stRef = useRef(st);
  stRef.current = st;
  useEffect(() => {
    const h = () => setSt(load());
    window.addEventListener("mikilab-labtools", h);
    return () => window.removeEventListener("mikilab-labtools", h);
  }, []);
  const cycle = useCallback((id) => {
    const t = LAB_TOOLS_DEF.find((x) => x.id === id);
    if (!t) return;
    const cur = stRef.current[id] ?? 0;
    const next = { ...stRef.current, [id]: (cur + 1) % t.states.length };
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* */ }
    setSt(next);
    window.dispatchEvent(new Event("mikilab-labtools"));
  }, []);
  const list = LAB_TOOLS_DEF.map((t) => { const i = st[t.id] ?? 0; return { id: t.id, name: t.name, status: t.states[i], color: t.colors[i] }; });
  return { list, cycle };
}
