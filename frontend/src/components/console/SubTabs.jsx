import { useState, useMemo } from "react";
import { ArrowLeft, GripVertical, Check } from "lucide-react";

// Schede interne per accorpare più strumenti simili in un unico pannello.
// Il Capo può riordinare le schede: l'ordine viene ricordato (localStorage) per mettere davanti quelle che usa di più.
export function SubTabs({ tabs, accent = "#475569", testid = "subtabs" }) {
  const items = (tabs || []).filter(Boolean);
  const storageKey = `mikilab_subtabs_order_${testid}`;

  const [order, setOrder] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
      if (Array.isArray(saved)) return saved;
    } catch { /* */ }
    return items.map((t) => t.id);
  });
  const [editing, setEditing] = useState(false);

  const ordered = useMemo(() => {
    const byId = Object.fromEntries(items.map((t) => [t.id, t]));
    const seen = new Set();
    const out = [];
    (order || []).forEach((id) => { if (byId[id] && !seen.has(id)) { out.push(byId[id]); seen.add(id); } });
    items.forEach((t) => { if (!seen.has(t.id)) out.push(t); });
    return out;
  }, [items, order]);

  const [active, setActive] = useState(ordered[0] ? ordered[0].id : null);
  if (items.length === 0) return null;
  const current = ordered.find((t) => t.id === active) || ordered[0];

  const persist = (ids) => {
    setOrder(ids);
    try { localStorage.setItem(storageKey, JSON.stringify(ids)); } catch { /* */ }
  };
  const moveLeft = (id) => {
    const ids = ordered.map((t) => t.id);
    const i = ids.indexOf(id);
    if (i > 0) { [ids[i - 1], ids[i]] = [ids[i], ids[i - 1]]; persist(ids); }
  };

  return (
    <div data-testid={testid}>
      <div className="flex flex-wrap items-center gap-1.5 mb-4">
        {ordered.map((t) => {
          const on = current.id === t.id;
          return (
            <div key={t.id} className="inline-flex items-center">
              {editing && (
                <button
                  data-testid={`${testid}-moveleft-${t.id}`}
                  onClick={() => moveLeft(t.id)}
                  title="Sposta a sinistra"
                  className="mr-0.5 p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-30"
                  disabled={ordered[0].id === t.id}
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                data-testid={`${testid}-tab-${t.id}`}
                onClick={() => !editing && setActive(t.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium border transition-all"
                style={on
                  ? { background: accent, color: "#ffffff", borderColor: accent }
                  : { background: "#ffffff", color: "#475569", borderColor: "#E2E8F0" }}
              >
                {editing && <GripVertical className="w-3.5 h-3.5 opacity-60" />}
                {t.label}
              </button>
            </div>
          );
        })}
        <button
          data-testid={`${testid}-reorder-toggle`}
          onClick={() => setEditing((v) => !v)}
          title={editing ? "Fine" : "Riordina schede"}
          className={`ml-1 p-1.5 rounded-lg border text-[11px] font-medium transition-colors ${editing ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-500 border-slate-200 hover:text-slate-800"}`}
        >
          {editing ? <Check className="w-3.5 h-3.5" /> : <GripVertical className="w-3.5 h-3.5" />}
        </button>
      </div>
      <div data-testid={`${testid}-body-${current.id}`}>{current.content}</div>
    </div>
  );
}
