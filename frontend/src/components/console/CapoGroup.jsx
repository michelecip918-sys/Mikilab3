import { ChevronDown, Info } from "lucide-react";
import { PanelIcon } from "./panelIcons";

// Sezione a fisarmonica della plancia Capo: incorpora piu' pannelli sotto un unico
// titolo. Solo una sezione aperta per volta (controllata dal genitore) = zero confusione.
export function CapoGroup({ id, icon, title, sub, hint, accent = "#8a97a6", count, open, onToggle, children }) {
  return (
    <div data-testid={`capo-group-${id}`} className="rounded-2xl border bg-[#0b0f19]/60 overflow-hidden transition-all" style={{ borderColor: open ? `${accent}66` : "#1e293b", boxShadow: open ? `0 0 22px ${accent}22` : "none" }}>
      <button
        data-testid={`capo-group-toggle-${id}`}
        onClick={onToggle}
        aria-expanded={open}
        className="w-full flex items-center gap-3 px-4 py-4 text-left active:scale-[0.99] transition-transform"
        style={{ borderLeft: `3px solid ${accent}` }}
      >
        <span className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-xl" style={{ background: `${accent}14`, border: `1px solid ${accent}33` }}><PanelIcon icon={icon} color={accent} className="w-5 h-5" /></span>
        <span className="flex-1 min-w-0">
          <span className="block font-cyber font-black text-white uppercase tracking-wider text-sm sm:text-base">{title}</span>
          {sub && <span className="block text-[11px] text-[#94A3B8] truncate">{sub}</span>}
        </span>
        {count != null && (
          <span className="font-mono-data text-[10px] px-2 py-0.5 rounded-full border shrink-0" style={{ color: accent, borderColor: `${accent}55` }}>{count}</span>
        )}
        <ChevronDown className={`w-5 h-5 shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`} style={{ color: accent }} />
      </button>
      {open && (
        <div data-testid={`capo-group-body-${id}`} className="px-3 sm:px-4 pb-4 pt-1 space-y-4 border-t border-[#1e293b]/60">
          {hint && (
            <div data-testid={`capo-group-hint-${id}`} className="flex items-start gap-2 rounded-xl px-3 py-2.5 mt-3" style={{ background: `${accent}0e`, border: `1px solid ${accent}33` }}>
              <Info className="w-4 h-4 shrink-0 mt-0.5" style={{ color: accent }} />
              <p className="text-[12px] leading-relaxed text-[#c7d2dc]">{hint}</p>
            </div>
          )}
          {children}
        </div>
      )}
    </div>
  );
}
