import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { TOOLS, TOOL_KINDS } from "@/sections/PianoProduzioneAI";

// Elenco strumenti del Laboratorio diviso per FUNZIONE (Genera / Gestione / Registri / Info),
// mostrato nella pagina come sezioni apribili. Non cambia il routing: usa onOpenTool.
export default function ToolsDirectory({ onOpenTool }) {
  const { lang } = useLang();
  const tri = (i, d, e, s) => mkTri(lang)(i, d, e, s);
  const [open, setOpen] = useState("genera");

  return (
    <div className="mt-6" data-testid="maestro-tools-directory">
      <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#ff6b00] mb-2.5 flex items-center gap-1.5">
        {tri("Tutti gli strumenti, per funzione", "Alle Werkzeuge nach Funktion", "All tools, by function", "Todas las herramientas, por función")}
      </p>
      <div className="space-y-2.5">
        {TOOL_KINDS.map((c) => {
          const items = TOOLS.filter((tl) => tl.kind === c.key);
          if (items.length === 0) return null;
          const isOpen = open === c.key;
          return (
            <div key={c.key} data-testid={`tools-dir-kind-${c.key}`} className="rounded-2xl border border-[#2e2e2e] bg-[#161616] overflow-hidden">
              <button data-testid={`tools-dir-toggle-${c.key}`} onClick={() => setOpen(isOpen ? null : c.key)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left active:scale-[0.995] transition-all">
                <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${c.color}1f`, border: `1px solid ${c.color}55` }}>
                  <c.Icon className="w-5 h-5" style={{ color: c.color }} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="font-display text-[15px] font-bold text-white leading-tight block">{tri(c.it, c.de, c.en, c.es)}</span>
                  <span className="text-[11.5px] text-[#7E8A93] leading-snug">{tri(c.sub_it, c.sub_de, c.sub_en, c.sub_es)} · {items.length}</span>
                </span>
                {isOpen ? <ChevronDown className="w-5 h-5 text-[#ff6b00] shrink-0" /> : <ChevronRight className="w-5 h-5 text-[#7E8A93] shrink-0" />}
              </button>
              {isOpen && (
                <div className="grid grid-cols-2 gap-2 px-3 pb-3">
                  {items.map((tl) => (
                    <button key={tl.id} data-testid={`tools-dir-tool-${tl.id}`} onClick={() => onOpenTool && onOpenTool(tl.id)}
                      className="flex items-center gap-2.5 text-left px-3 py-2.5 rounded-xl bg-[#1e1e1e] border border-[#2e2e2e] active:scale-97 hover:border-[#ff6b00]/60 transition-all min-h-[52px]">
                      <tl.Icon className="w-4 h-4 shrink-0" style={{ color: c.color }} />
                      <span className="text-[12.5px] font-medium text-[#e4eff8] leading-tight">{tri(tl.it, tl.de, tl.en, tl.es)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
