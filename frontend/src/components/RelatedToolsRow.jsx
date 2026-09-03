import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { TOOLS, CAT_RELATED } from "@/sections/PianoProduzioneAI";

// Riga di scorciatoie agli strumenti ESISTENTI collegati a un'area (pizzeria/pasticceria).
export default function RelatedToolsRow({ cat, onOpenTool }) {
  const { lang } = useLang();
  const tri = (i, d, e, s) => mkTri(lang)(i, d, e, s);
  const byId = Object.fromEntries(TOOLS.map((t) => [t.id, t]));
  const tools = (CAT_RELATED[cat] || []).map((id) => byId[id]).filter(Boolean);
  if (!tools.length || !onOpenTool) return null;
  return (
    <div className="mb-5 rounded-2xl border border-[#F26419]/30 bg-[#121722] p-3" data-testid={`related-tools-${cat}`}>
      <p className="text-[11px] font-bold uppercase tracking-wide text-[#F26419] mb-2">{tri("Strumenti utili collegati", "Nützliche verknüpfte Werkzeuge", "Related useful tools", "Herramientas útiles vinculadas")}</p>
      <div className="flex flex-wrap gap-1.5">
        {tools.map((tl) => (
          <button key={tl.id} data-testid={`related-tool-${cat}-${tl.id}`} onClick={() => onOpenTool(tl.id)}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#e4eff8] bg-[#18202E] border border-[#26324A] rounded-full pl-2 pr-3 py-1.5 active:scale-95 hover:border-[#F26419]/60 transition-all">
            <tl.Icon className="w-3.5 h-3.5 text-[#F26419]" /> {tri(tl.it, tl.de, tl.en, tl.es)}
          </button>
        ))}
      </div>
    </div>
  );
}
