import { useState } from "react";

// Schede interne per accorpare più strumenti simili in un unico pannello.
export function SubTabs({ tabs, accent = "#FF9D42", testid = "subtabs" }) {
  const items = (tabs || []).filter(Boolean);
  const [active, setActive] = useState(items[0] ? items[0].id : null);
  if (items.length === 0) return null;
  const current = items.find((t) => t.id === active) || items[0];
  return (
    <div data-testid={testid}>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {items.map((t) => {
          const on = current.id === t.id;
          return (
            <button
              key={t.id}
              data-testid={`${testid}-tab-${t.id}`}
              onClick={() => setActive(t.id)}
              className="px-3 py-1.5 rounded-full text-[12px] font-bold border transition-all active:scale-95"
              style={on
                ? { background: accent, color: "#050810", borderColor: accent, boxShadow: `0 0 14px ${accent}66` }
                : { background: "rgba(6,10,18,0.55)", color: "#94A3B8", borderColor: "#1e293b" }}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      <div data-testid={`${testid}-body-${current.id}`}>{current.content}</div>
    </div>
  );
}
