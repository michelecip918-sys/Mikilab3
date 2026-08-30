import { useState } from "react";
import { ChevronDown, ChevronRight, Search, Star, X } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { TOOLS, TOOL_KINDS } from "@/sections/PianoProduzioneAI";
import { getPinned, togglePinned } from "@/lib/pinnedTools";

// Elenco strumenti del Laboratorio: ricerca + preferiti appuntati + gruppi per FUNZIONE
// (Genera / Gestione / Registri / Info). Non cambia il routing: usa onOpenTool.
export default function ToolsDirectory({ onOpenTool }) {
  const { lang } = useLang();
  const tri = (i, d, e, s) => mkTri(lang)(i, d, e, s);
  const [open, setOpen] = useState("genera");
  const [q, setQ] = useState("");
  const [pinned, setPinned] = useState(() => getPinned());

  const name = (tl) => tri(tl.it, tl.de, tl.en, tl.es);
  const pin = (id) => setPinned(togglePinned(id));
  const s = q.trim().toLowerCase();
  const hits = s ? TOOLS.filter((tl) => name(tl).toLowerCase().includes(s)) : [];
  const pinnedTools = pinned.map((id) => TOOLS.find((t) => t.id === id)).filter(Boolean);
  const colorOf = (kind) => (TOOL_KINDS.find((k) => k.key === kind) || {}).color || "#ff6b00";

  const Tile = (tl, color) => {
    const isPin = pinned.includes(tl.id);
    return (
      <div key={tl.id} className="relative flex items-center rounded-xl bg-[#1e1e1e] border border-[#2e2e2e] overflow-hidden hover:border-[#ff6b00]/60 transition-all min-h-[52px]">
        <button data-testid={`tools-dir-tool-${tl.id}`} onClick={() => onOpenTool && onOpenTool(tl.id)}
          className="flex items-center gap-2.5 text-left px-3 py-2.5 flex-1 min-w-0 active:scale-97 transition-all">
          <tl.Icon className="w-4 h-4 shrink-0" style={{ color }} />
          <span className="text-[12.5px] font-medium text-[#e4eff8] leading-tight truncate">{name(tl)}</span>
        </button>
        <button data-testid={`tools-dir-pin-${tl.id}`} onClick={() => pin(tl.id)} title={tri("Appunta", "Anpinnen", "Pin", "Fijar")}
          className="px-2 py-2 shrink-0">
          <Star className={`w-4 h-4 ${isPin ? "text-[#ff6b00] fill-[#ff6b00]" : "text-[#7E8A93]"}`} />
        </button>
      </div>
    );
  };

  return (
    <div className="mt-6" data-testid="maestro-tools-directory">
      <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#ff6b00] mb-2.5 flex items-center gap-1.5">
        {tri("Tutti gli strumenti, per funzione", "Alle Werkzeuge nach Funktion", "All tools, by function", "Todas las herramientas, por función")}
      </p>

      <div className="relative mb-3">
        <Search className="w-4 h-4 text-[#7E8A93] absolute left-3 top-1/2 -translate-y-1/2" />
        <input data-testid="tools-dir-search" value={q} onChange={(e) => setQ(e.target.value)}
          placeholder={tri("Cerca uno strumento…", "Werkzeug suchen…", "Search a tool…", "Buscar herramienta…")}
          className="w-full bg-[#161616] border border-[#2e2e2e] rounded-xl py-2.5 pl-10 pr-9 text-sm text-white outline-none focus:border-[#ff6b00]" />
        {q && <button data-testid="tools-dir-search-clear" onClick={() => setQ("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7E8A93] hover:text-white"><X className="w-4 h-4" /></button>}
      </div>

      {s ? (
        <div data-testid="tools-dir-results" className="grid grid-cols-2 gap-2">
          {hits.length ? hits.map((tl) => Tile(tl, colorOf(tl.kind)))
            : <p className="col-span-2 text-center text-[#7E8A93] py-6 text-sm">{tri("Nessuno strumento trovato", "Kein Werkzeug gefunden", "No tool found", "Ninguna herramienta")}</p>}
        </div>
      ) : (
        <div className="space-y-2.5">
          {pinnedTools.length > 0 && (
            <div data-testid="tools-dir-pinned" className="rounded-2xl border border-[#ff6b00]/40 bg-[#161616] p-3">
              <p className="text-[11.5px] font-bold text-[#ff6b00] mb-2 flex items-center gap-1.5"><Star className="w-3.5 h-3.5 fill-[#ff6b00]" /> {tri("I tuoi preferiti", "Deine Favoriten", "Your pinned tools", "Tus favoritos")}</p>
              <div className="grid grid-cols-2 gap-2">
                {pinnedTools.map((tl) => Tile(tl, colorOf(tl.kind)))}
              </div>
            </div>
          )}
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
                    {items.map((tl) => Tile(tl, c.color))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
