import { useState } from "react";
import { ChevronRight, Search, X } from "lucide-react";
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
  const [q, setQ] = useState("");

  // Strumenti immediati (griglia rapida in alto).
  const QUICK = ["acqua", "convlievito", "sosimpasto", "settimana"].map(byId).filter(Boolean);
  const QUICK_DESC = {
    acqua: tri("Calcola i gradi esatti per l'impasto.", "Berechnet die genaue Wassertemperatur.", "Calculates the exact water temperature.", "Calcula los grados exactos para la masa.", "Calcule les degrés exacts pour la pâte.", "دمای دقیق آب خمیر را حساب می‌کند."),
    convlievito: tri("Passa da madre a birra senza ricalcoli manuali.", "Von Sauerteig zu Hefe ohne Rechnen.", "Switch from sourdough to yeast, no manual math.", "Pasa de masa madre a levadura sin recalcular.", "Passe du levain à la levure sans recalcul.", "از خمیرترش به مخمر بدون محاسبه دستی."),
    sosimpasto: tri("Soluzioni immediate per impasti molli o surriscaldati.", "Soforthilfe bei weichem oder überhitztem Teig.", "Instant fixes for slack or overheated dough.", "Soluciones inmediatas para masas blandas o calientes.", "Solutions immédiates pour pâtes molles ou chaudes.", "راه‌حل فوری برای خمیر شل یا داغ."),
    settimana: tri("Pianifica i lotti e i turni di produzione.", "Plane Chargen und Produktionsschichten.", "Plan batches and production shifts.", "Planifica lotes y turnos de producción.", "Planifie lots et équipes de production.", "لات‌ها و شیفت‌های تولید را برنامه‌ریزی کن."),
  };

  // Tutti gli strumenti visibili (rispettando la modalità), per la ricerca. Deduplicati (un tool può stare in più hub).
  const allIds = Array.from(new Set(hubs.flatMap((h) => h.ids)));
  const s = q.trim().toLowerCase();
  const hits = s ? allIds.map(byId).filter((tl) => tl && name(tl).toLowerCase().includes(s)) : [];

  const Row = (id) => {
    const tl = byId(id);
    if (!tl) return null;
    return (
      <button key={id} data-testid={`lab-tool-${id}`} onClick={() => onOpenTool && onOpenTool(id)}
        className="flex items-center gap-4 text-left w-full rounded-2xl bg-[#18202E] border border-[#26324A] hover:border-[#F26419]/60 min-h-[76px] px-4 py-3.5 active:scale-[0.98] transition-all">
        <span className="w-16 h-16 rounded-2xl bg-[#F26419]/12 border border-[#F26419]/30 flex items-center justify-center shrink-0">
          <tl.Icon className="w-8 h-8 text-[#F26419]" />
        </span>
        <span className="text-lg sm:text-xl font-bold text-white leading-snug">{name(tl)}</span>
        <ChevronRight className="w-5 h-5 text-[#7E8A93] shrink-0 ms-auto rtl:rotate-180" />
      </button>
    );
  };

  return (
    <div className="mt-2" data-testid="maestro-tools-directory">
      {/* Griglia strumenti rapidi (2 colonne) */}
      {!s && QUICK.length > 0 && (
        <div className="mb-4" data-testid="lab-quick-grid">
          <p className="text-[13px] font-bold uppercase tracking-wide text-[#F26419] mb-2">{tri("Strumenti rapidi", "Schnellzugriff", "Quick tools", "Herramientas rápidas")}</p>
          <div className="grid grid-cols-2 gap-2.5">
            {QUICK.map((tl) => (
              <button key={tl.id} data-testid={`lab-quick-${tl.id}`} onClick={() => onOpenTool && onOpenTool(tl.id)}
                className="flex flex-col items-start gap-2 text-left rounded-2xl bg-gradient-to-br from-[#F26419]/18 to-[#18202E] border border-[#F26419]/40 hover:border-[#F26419] min-h-[128px] p-3.5 active:scale-[0.97] transition-all">
                <span className="w-11 h-11 rounded-2xl shadow-md border border-amber-900/40 bg-[#F26419] flex items-center justify-center shrink-0"><tl.Icon className="w-6 h-6 text-white" /></span>
                <span className="text-[15px] font-bold text-white leading-tight">{name(tl)}</span>
                <span className="text-[11.5px] text-[#AEB8BF] leading-snug">{QUICK_DESC[tl.id]}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Ricerca */}
      <div className="relative mb-3">
        <Search className="w-4 h-4 text-[#7E8A93] absolute start-3 top-1/2 -translate-y-1/2" />
        <input data-testid="tools-dir-search" value={q} onChange={(e) => setQ(e.target.value)}
          placeholder={tri("Cerca uno strumento…", "Werkzeug suchen…", "Search a tool…", "Buscar herramienta…", "Chercher un outil…", "جستجوی ابزار…")}
          className="w-full bg-[#121722] border border-[#26324A] rounded-2xl shadow-md border border-amber-900/40 py-3 ps-10 pe-9 text-base text-white outline-none focus:border-[#F26419]" />
        {q && <button data-testid="tools-dir-search-clear" onClick={() => setQ("")} className="absolute end-2.5 top-1/2 -translate-y-1/2 text-[#7E8A93] hover:text-white"><X className="w-4 h-4" /></button>}
      </div>

      {s ? (
        <div data-testid="tools-dir-results" className="space-y-2">
          {hits.length ? hits.map((tl) => Row(tl.id))
            : <p className="text-center text-[#7E8A93] py-6 text-base">{tri("Nessuno strumento trovato", "Kein Werkzeug gefunden", "No tool found", "Ninguna herramienta", "Aucun outil", "ابزاری یافت نشد")}</p>}
        </div>
      ) : (
        <p className="text-center text-[13px] text-[#7E8A93] py-3">
          {tri("Cerca un altro strumento nella barra qui sopra.", "Weitere Werkzeuge über die Suche oben.", "Find any other tool via the search above.", "Busca otra herramienta en la barra de arriba.", "Cherche un autre outil via la recherche.", "ابزارهای دیگر را از جستجوی بالا پیدا کن.")}
        </p>
      )}
    </div>
  );
}
