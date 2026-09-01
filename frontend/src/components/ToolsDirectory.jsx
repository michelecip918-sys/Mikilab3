import { useState } from "react";
import { ChevronDown, ChevronRight, Search, X } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { useProfile } from "@/profile/ProfileContext";
import { mkTri } from "@/i18n/triMaps";
import { TOOLS } from "@/sections/PianoProduzioneAI";
import { LAB_HUBS, isPassion } from "@/lib/labHubs";

// Laboratorio: 4 Macro-Hub espandibili. Bottoni grandi (min 76px). In modalità Passione
// gli hub/strumenti Pro sono nascosti. Ogni strumento si apre come schermata sovrapposta.
export default function ToolsDirectory({ onOpenTool }) {
  const { lang } = useLang();
  const { profile } = useProfile();
  const passion = isPassion(profile);
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const byId = (id) => TOOLS.find((t) => t.id === id);
  const name = (tl) => tri(tl.it, tl.de, tl.en, tl.es);

  const hubs = LAB_HUBS.filter((h) => !(passion && h.pro));
  const [open, setOpen] = useState(() => ({ scienza: true, produzione: true }));
  const [q, setQ] = useState("");
  const toggleSection = (id) => setOpen((o) => ({ ...o, [id]: !o[id] }));

  // Tutti gli strumenti visibili (rispettando la modalità), per la ricerca. Deduplicati (un tool può stare in più hub).
  const allIds = Array.from(new Set(hubs.flatMap((h) => h.ids)));
  const s = q.trim().toLowerCase();
  const hits = s ? allIds.map(byId).filter((tl) => tl && name(tl).toLowerCase().includes(s)) : [];

  const Row = (id) => {
    const tl = byId(id);
    if (!tl) return null;
    return (
      <button key={id} data-testid={`lab-tool-${id}`} onClick={() => onOpenTool && onOpenTool(id)}
        className="flex items-center gap-4 text-left w-full rounded-2xl bg-[#1e1e1e] border border-[#2C2C2C] hover:border-[#ff6b00]/60 min-h-[76px] px-4 py-3.5 active:scale-[0.98] transition-all">
        <span className="w-16 h-16 rounded-2xl bg-[#ff6b00]/12 border border-[#ff6b00]/30 flex items-center justify-center shrink-0">
          <tl.Icon className="w-8 h-8 text-[#ff6b00]" />
        </span>
        <span className="text-lg sm:text-xl font-bold text-white leading-snug">{name(tl)}</span>
        <ChevronRight className="w-5 h-5 text-[#7E8A93] shrink-0 ms-auto rtl:rotate-180" />
      </button>
    );
  };

  return (
    <div className="mt-2" data-testid="maestro-tools-directory">
      {/* Ricerca */}
      <div className="relative mb-3">
        <Search className="w-4 h-4 text-[#7E8A93] absolute start-3 top-1/2 -translate-y-1/2" />
        <input data-testid="tools-dir-search" value={q} onChange={(e) => setQ(e.target.value)}
          placeholder={tri("Cerca uno strumento…", "Werkzeug suchen…", "Search a tool…", "Buscar herramienta…", "Chercher un outil…", "جستجوی ابزار…")}
          className="w-full bg-[#161616] border border-[#2C2C2C] rounded-xl py-3 ps-10 pe-9 text-base text-white outline-none focus:border-[#ff6b00]" />
        {q && <button data-testid="tools-dir-search-clear" onClick={() => setQ("")} className="absolute end-2.5 top-1/2 -translate-y-1/2 text-[#7E8A93] hover:text-white"><X className="w-4 h-4" /></button>}
      </div>

      {s ? (
        <div data-testid="tools-dir-results" className="space-y-2">
          {hits.length ? hits.map((tl) => Row(tl.id))
            : <p className="text-center text-[#7E8A93] py-6 text-base">{tri("Nessuno strumento trovato", "Kein Werkzeug gefunden", "No tool found", "Ninguna herramienta", "Aucun outil", "ابزاری یافت نشد")}</p>}
        </div>
      ) : (
        <div className="space-y-2.5">
          {hubs.map((h) => {
            const ids = h.ids.filter((id) => byId(id));
            if (ids.length === 0) return null;
            const isOpen = !!open[h.id];
            return (
              <div key={h.id} data-testid={`lab-hub-${h.id}`} className="rounded-2xl border border-[#2C2C2C] bg-[#161616] overflow-hidden">
                <button data-testid={`lab-hub-toggle-${h.id}`} onClick={() => toggleSection(h.id)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-4 min-h-[68px] text-start active:scale-[0.995] transition-all">
                  <span className="flex items-center gap-2.5 min-w-0">
                    <span className="text-2xl leading-none shrink-0">{h.emoji}</span>
                    <span className="font-display text-lg sm:text-xl font-bold text-white leading-tight">{tri(h.it, h.de, h.en, h.es, h.fr, h.fa)}</span>
                  </span>
                  <span className="flex items-center gap-2.5 shrink-0">
                    <span className="text-[13px] font-bold text-[#ff6b00] bg-[#ff6b00]/12 border border-[#ff6b00]/30 px-2.5 py-1 rounded-full">{ids.length}</span>
                    {isOpen ? <ChevronDown className="w-6 h-6 text-[#ff6b00]" /> : <ChevronRight className="w-6 h-6 text-[#7E8A93] rtl:rotate-180" />}
                  </span>
                </button>
                {isOpen && <div className="px-3 pb-3 space-y-2">{ids.map((id) => Row(id))}</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
