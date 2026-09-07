import { useState } from "react";
import { LayoutGrid, Search, X, ChevronsDownUp, ChevronsUpDown } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// Indice plance: raggiungi qualsiasi pannello della plancia Capo con un tocco.
export default function ConsoleIndex() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);

  const scan = () => {
    const nodes = [...document.querySelectorAll('[data-testid^="panel-"]')]
      .filter((n) => { const id = n.getAttribute("data-testid") || ""; return !id.endsWith("-head") && n.classList.contains("holo-panel"); });
    setItems(nodes.map((n) => {
      const id = n.getAttribute("data-testid");
      const head = n.querySelector(`[data-testid="${id}-head"]`);
      const title = head?.querySelector(".font-tech")?.textContent?.trim() || id;
      const icon = head?.querySelector("span.text-xl")?.textContent?.trim() || "▪";
      return { id, title, icon };
    }));
  };
  const openIdx = () => { scan(); setQ(""); setOpen(true); };
  const go = (id) => { setOpen(false); window.dispatchEvent(new CustomEvent("mikilab:open-panel", { detail: id })); };
  const setAll = (v) => window.dispatchEvent(new CustomEvent("mikilab:set-all-panels", { detail: v }));
  const filtered = items.filter((x) => x.title.toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <div className="sticky top-[64px] z-30 flex items-center gap-2">
        <button data-testid="console-index-open" onClick={openIdx}
          className="flex-1 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0C1019]/90 backdrop-blur-md border border-[#00F0FF]/30 text-[#00F0FF] font-tech font-bold text-sm active:scale-[0.99] hover:border-[#00F0FF]/60 transition-all shadow-[0_0_16px_rgba(0,240,255,0.12)]">
          <LayoutGrid className="w-4 h-4" />
          <span className="flex-1 text-left">{tri("Indice plance · vai a…", "Panel-Index · gehe zu…", "Panel index · jump to…", "Índice de paneles · ir a…", "Index des panneaux · aller à…", "فهرست پنل‌ها · برو به…")}</span>
        </button>
        <button data-testid="panels-collapse-all" onClick={() => setAll(false)} title={tri("Comprimi tutto", "Alles einklappen", "Collapse all", "Contraer todo", "Tout réduire", "بستن همه")}
          className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#0C1019]/90 backdrop-blur-md border border-[#1e293b] text-[#94A3B8] hover:text-[#00F0FF] hover:border-[#00F0FF]/50 active:scale-95 transition-all"><ChevronsDownUp className="w-4 h-4" /></button>
        <button data-testid="panels-expand-all" onClick={() => setAll(true)} title={tri("Espandi tutto", "Alles ausklappen", "Expand all", "Expandir todo", "Tout ouvrir", "باز کردن همه")}
          className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#0C1019]/90 backdrop-blur-md border border-[#1e293b] text-[#94A3B8] hover:text-[#00F0FF] hover:border-[#00F0FF]/50 active:scale-95 transition-all"><ChevronsUpDown className="w-4 h-4" /></button>
      </div>

      {open && (
        <div data-testid="console-index-overlay" className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-start justify-center p-4 pt-20" onClick={() => setOpen(false)}>
          <div className="w-full max-w-2xl holo-panel p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-3">
              <span className="font-cyber text-sm font-black uppercase tracking-widest text-[#00F0FF] flex-1">{tri("Indice plance", "Panel-Index", "Panel index", "Índice", "Index", "فهرست")}</span>
              <button data-testid="console-index-close" onClick={() => setOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center border border-[#1e293b] text-[#94A3B8] hover:text-white active:scale-95"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-[#030712] border border-[#1e293b] px-3 py-2 mb-3">
              <Search className="w-4 h-4 text-[#64748B]" />
              <input data-testid="console-index-search" autoFocus value={q} onChange={(e) => setQ(e.target.value)}
                placeholder={tri("Cerca una plancia…", "Panel suchen…", "Search a panel…", "Buscar panel…", "Chercher…", "جستجو…")}
                className="flex-1 bg-transparent outline-none text-sm text-white" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[60vh] overflow-y-auto">
              {filtered.map((it) => (
                <button key={it.id} data-testid={`console-index-item-${it.id}`} onClick={() => go(it.id)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#0C1019] border border-[#1e293b] text-left active:scale-95 hover:border-[#00F0FF]/60 transition-all">
                  <span className="text-lg shrink-0">{it.icon}</span>
                  <span className="text-xs font-bold text-white leading-tight line-clamp-2">{it.title}</span>
                </button>
              ))}
              {filtered.length === 0 && <p className="col-span-full text-center text-[11px] text-[#64748B] py-6">{tri("Nessuna plancia trovata", "Kein Panel gefunden", "No panel found", "Sin resultados", "Aucun panneau", "چیزی نیست")}</p>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
