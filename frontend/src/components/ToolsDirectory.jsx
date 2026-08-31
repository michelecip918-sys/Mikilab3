import { useState } from "react";
import { ChevronDown, ChevronRight, Search, X, SlidersHorizontal, Check } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { TOOLS } from "@/sections/PianoProduzioneAI";

// Sezioni tematiche del Laboratorio (accessibili, bottoni grandi). Gli id sono quelli REALI
// degli strumenti: il routing resta invariato tramite onOpenTool.
const SECTIONS = [
  { id: "ricette", it: "Ricette & Sviluppo", de: "Rezepte & Entwicklung", en: "Recipes & Development", es: "Recetas y Desarrollo", ids: ["aggiungi", "custodite", "webrecipe", "generatore", "saporicasa", "cantiere", "scanflour", "cosafare"] },
  { id: "calcolatori", it: "Calcolatori", de: "Rechner", en: "Calculators", es: "Calculadoras", ids: ["metodo", "acqua", "sequenze", "convlievito", "stampi", "adatta", "energia", "bilancia", "pesata", "twin", "fermentazione", "weatherbaker", "simforno", "trovafarina", "timelapse"] },
  { id: "celle", it: "Celle, Freddo & Conservazione", de: "Kühlung & Lagerung", en: "Cells, Cold & Storage", es: "Cámaras y Conservación", ids: ["capo", "termo", "freezer", "shelf", "spreco", "esuberozero", "recupero"] },
  { id: "costi", it: "Costi, Dati & Macchine", de: "Kosten, Daten & Maschinen", en: "Costs, Data & Machines", es: "Costes, Datos y Máquinas", ids: ["foodcost", "mydata", "macchine"] },
  { id: "diagnosi", it: "Diagnosi, SOS & Registri", de: "Diagnose, SOS & Register", en: "Diagnosis, SOS & Logs", es: "Diagnóstico, SOS y Registros", ids: ["diagnosi", "suono", "sosimpasto", "ph", "bancalievito", "sessioni", "check"] },
  { id: "special", it: "Pizzeria & Pasticceria", de: "Pizzeria & Konditorei", en: "Pizzeria & Pastry", es: "Pizzería y Pastelería", ids: ["labpizzeria", "labpasticceria"] },
  { id: "voce", it: "Mani Libere & Voce", de: "Freihändig & Stimme", en: "Hands-free & Voice", es: "Manos Libres y Voz", ids: ["manisporche", "timer"] },
];

const HIDDEN_KEY = "mikilab_lab_hidden_tools";

export default function ToolsDirectory({ onOpenTool }) {
  const { lang } = useLang();
  const tri = (i, d, e, s) => mkTri(lang)(i, d, e, s);
  const name = (tl) => tri(tl.it, tl.de, tl.en, tl.es);
  const byId = (id) => TOOLS.find((t) => t.id === id);
  // Strumenti didattici/secondari: NON compaiono nel Laboratorio Pro (restano per l'apprendimento).
  const LAB_EXCLUDE = new Set(["generatore", "saporicasa", "cosafare", "scanflour", "trovafarina", "weatherbaker", "timelapse", "twin"]);

  const [open, setOpen] = useState({ ricette: true, calcolatori: true });
  const [q, setQ] = useState("");
  const [customize, setCustomize] = useState(false);
  const [hidden, setHidden] = useState(() => { try { return new Set(JSON.parse(localStorage.getItem(HIDDEN_KEY)) || []); } catch { return new Set(); } });

  const persist = (set) => { try { localStorage.setItem(HIDDEN_KEY, JSON.stringify([...set])); } catch { /* */ } };
  const toggleHidden = (id) => setHidden((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); persist(n); return n; });
  const toggleSection = (id) => setOpen((o) => ({ ...o, [id]: !o[id] }));

  const s = q.trim().toLowerCase();
  const hits = s ? TOOLS.filter((tl) => !LAB_EXCLUDE.has(tl.id) && name(tl).toLowerCase().includes(s)) : [];

  // Bottone grande e accessibile (min 64px), icona + etichetta. In modalità Personalizza mostra l'interruttore on/off.
  const Row = (id) => {
    const tl = byId(id);
    if (!tl) return null;
    const isHidden = hidden.has(id);
    if (!customize && isHidden) return null;
    return (
      <div key={id} className={`flex items-center rounded-2xl bg-[#1e1e1e] border ${isHidden ? "border-[#2C2C2C] opacity-55" : "border-[#2C2C2C] hover:border-[#ff6b00]/60"} min-h-[76px] transition-all`}>
        <button data-testid={`lab-tool-${id}`} onClick={() => onOpenTool && onOpenTool(id)}
          className="flex items-center gap-4 text-left px-4 py-3.5 flex-1 min-w-0 active:scale-[0.98] transition-all">
          <span className="w-16 h-16 rounded-2xl bg-[#ff6b00]/12 border border-[#ff6b00]/30 flex items-center justify-center shrink-0">
            <tl.Icon className="w-8 h-8 text-[#ff6b00]" />
          </span>
          <span className="text-lg sm:text-xl font-bold text-white leading-snug">{name(tl)}</span>
        </button>
        {customize && (
          <button data-testid={`lab-tool-toggle-${id}`} onClick={() => toggleHidden(id)}
            title={isHidden ? tri("Nascosto", "Ausgeblendet", "Hidden", "Oculto") : tri("Attivo", "Aktiv", "Active", "Activo")}
            className={`mr-2.5 shrink-0 w-14 h-8 rounded-full flex items-center px-1 transition-all ${isHidden ? "bg-[#2C2C2C]" : "bg-[#ff6b00]"}`}>
            <span className={`w-6 h-6 rounded-full bg-white flex items-center justify-center transition-transform ${isHidden ? "" : "translate-x-6"}`}>
              {!isHidden && <Check className="w-4 h-4 text-[#ff6b00]" />}
            </span>
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="mt-5" data-testid="maestro-tools-directory">
      {/* Ricerca + Personalizza (on/off) */}
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#7E8A93] absolute left-3 top-1/2 -translate-y-1/2" />
          <input data-testid="tools-dir-search" value={q} onChange={(e) => setQ(e.target.value)}
            placeholder={tri("Cerca uno strumento…", "Werkzeug suchen…", "Search a tool…", "Buscar herramienta…")}
            className="w-full bg-[#161616] border border-[#2C2C2C] rounded-xl py-3 pl-10 pr-9 text-base text-white outline-none focus:border-[#ff6b00]" />
          {q && <button data-testid="tools-dir-search-clear" onClick={() => setQ("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7E8A93] hover:text-white"><X className="w-4 h-4" /></button>}
        </div>
        <button data-testid="tools-dir-customize" onClick={() => setCustomize((v) => !v)}
          className={`shrink-0 h-12 px-3.5 rounded-xl border flex items-center gap-2 font-bold text-sm transition-all ${customize ? "bg-[#ff6b00] text-white border-[#ff6b00]" : "bg-[#161616] text-[#ff6b00] border-[#ff6b00]/40"}`}>
          <SlidersHorizontal className="w-4 h-4" /> {tri("Personalizza", "Anpassen", "Customize", "Personalizar")}
        </button>
      </div>
      {customize && (
        <p data-testid="tools-dir-customize-hint" className="text-[13px] text-[#AEB8BF] leading-snug mb-3 -mt-1">
          {tri("Attiva o nascondi gli strumenti: quelli spenti non appariranno più nel Laboratorio.", "Werkzeuge ein-/ausblenden: ausgeschaltete erscheinen nicht mehr.", "Turn tools on or off: hidden ones won't show in the Lab.", "Activa u oculta herramientas: las apagadas no se mostrarán.")}
        </p>
      )}

      {s ? (
        <div data-testid="tools-dir-results" className="space-y-2">
          {hits.length ? hits.map((tl) => Row(tl.id))
            : <p className="text-center text-[#7E8A93] py-6 text-base">{tri("Nessuno strumento trovato", "Kein Werkzeug gefunden", "No tool found", "Ninguna herramienta")}</p>}
        </div>
      ) : (
        <div className="space-y-2.5">
          {SECTIONS.map((sec) => {
                const ids = sec.ids.filter((id) => byId(id) && !LAB_EXCLUDE.has(id));
            const visibleCount = customize ? ids.length : ids.filter((id) => !hidden.has(id)).length;
            if (visibleCount === 0 && !customize) return null;
            const isOpen = !!open[sec.id];
            return (
              <div key={sec.id} data-testid={`lab-section-${sec.id}`} className="rounded-2xl border border-[#2C2C2C] bg-[#161616] overflow-hidden">
                <button data-testid={`lab-section-toggle-${sec.id}`} onClick={() => toggleSection(sec.id)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-4 min-h-[64px] text-left active:scale-[0.995] transition-all">
                  <span className="font-display text-lg sm:text-xl font-bold text-white leading-tight">{tri(sec.it, sec.de, sec.en, sec.es)}</span>
                  <span className="flex items-center gap-2.5 shrink-0">
                    <span className="text-[13px] font-bold text-[#ff6b00] bg-[#ff6b00]/12 border border-[#ff6b00]/30 px-2.5 py-1 rounded-full">{visibleCount}</span>
                    {isOpen ? <ChevronDown className="w-6 h-6 text-[#ff6b00]" /> : <ChevronRight className="w-6 h-6 text-[#7E8A93]" />}
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
