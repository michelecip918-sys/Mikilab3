import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Home as HomeIcon, BookOpen, Wrench, GraduationCap, Users, Trophy, Menu, Search, Star } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { TOOLS, TOOL_CATS } from "@/sections/PianoProduzioneAI";

const FAV_KEY = "mikilab_menu_favs";
const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

// Menù globale (hamburger) disponibile in tutto il sito: sezioni, ricerca strumento e preferiti.
export default function SiteMenu({ onNavigate, onOpenSfide }) {
  const { lang } = useLang();
  const tri = (i, d, e, s) => (lang === "de" ? d : lang === "es" ? (s ?? e ?? i) : ((lang === "en" || lang === "fr" || lang === "fa") ? (e ?? i) : i));
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [favs, setFavs] = useState(() => { try { return JSON.parse(localStorage.getItem(FAV_KEY) || "[]"); } catch { return []; } });

  useEffect(() => {
    const h = () => { setQ(""); setOpen(true); };
    window.addEventListener("mikilab-open-menu", h);
    return () => window.removeEventListener("mikilab-open-menu", h);
  }, []);

  const saveFavs = (arr) => { setFavs(arr); try { localStorage.setItem(FAV_KEY, JSON.stringify(arr)); } catch { /* */ } };
  const toggleFav = (id) => saveFavs(favs.includes(id) ? favs.filter((x) => x !== id) : [...favs, id]);

  const goTab = (tab) => { setOpen(false); onNavigate && onNavigate(tab); window.scrollTo(0, 0); };
  const goTool = (id) => {
    try { localStorage.setItem("mikilab_pending_tool", id); } catch { /* */ }
    setOpen(false);
    onNavigate && onNavigate("maestro");
    window.scrollTo(0, 0);
    setTimeout(() => window.dispatchEvent(new CustomEvent("mikilab-open-lab-tool", { detail: { id } })), 120);
  };
  const goSfide = () => { setOpen(false); onOpenSfide ? onOpenSfide() : window.dispatchEvent(new Event("mikilab-go-challenges")); };

  const SECTIONS = [
    { id: "home", Icon: HomeIcon, label: tri("Home", "Home", "Home", "Inicio"), color: "#6E371C" },
    { id: "ricette", Icon: BookOpen, label: tri("Le Ricette di MikiLab", "Die MikiLab-Rezepte", "The MikiLab Recipes", "Las Recetas de MikiLab"), color: "#B45309" },
    { id: "maestro", Icon: Wrench, label: tri("Il Tuo Laboratorio", "Dein Labor", "Your Lab", "Tu Laboratorio"), color: "#8C4A27" },
    { id: "impara", Icon: GraduationCap, label: tri("Impara a Livelli", "Lerne in Stufen", "Learn by Levels", "Aprende por Niveles"), color: "#A16207" },
    { id: "community", Icon: Users, label: tri("Community & Mercatino", "Community & Markt", "Community & Market", "Comunidad y Mercado"), color: "#C0574D" },
  ];

  const catOf = (key) => TOOL_CATS.find((c) => c.key === key) || {};
  const toolLabel = (tl) => tri(tl.it, tl.de, tl.en, tl.es);
  const byId = Object.fromEntries(TOOLS.map((t) => [t.id, t]));

  const nq = norm(q);
  const filteredTools = nq ? TOOLS.filter((t) => norm(toolLabel(t)).includes(nq)) : [];
  const filteredSecs = nq ? SECTIONS.filter((s) => norm(s.label).includes(nq)) : [];
  const favTools = favs.map((id) => byId[id]).filter(Boolean);

  const ToolRow = ({ tl }) => {
    const c = catOf(tl.cat);
    const isFav = favs.includes(tl.id);
    return (
      <div className="flex items-center gap-1">
        <button data-testid={`site-menu-tool-${tl.id}`} onClick={() => goTool(tl.id)}
          className="flex-1 flex items-center gap-2.5 text-left px-3 py-2.5 rounded-xl bg-white dark:bg-[#232A31] border border-[#E6D8C3] dark:border-[#38424B] active:scale-98 hover:border-[#B45309]/60 transition-all min-w-0">
          <tl.Icon className="w-4 h-4 shrink-0" style={{ color: c.color }} />
          <span className="text-sm font-medium text-[#2B303B] dark:text-[#e4eff8] truncate">{toolLabel(tl)}</span>
        </button>
        <button data-testid={`site-menu-fav-${tl.id}`} onClick={() => toggleFav(tl.id)} aria-label="Preferito"
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 active:scale-90 transition-all border border-[#E6D8C3] dark:border-[#38424B] bg-white dark:bg-[#232A31]">
          <Star className={`w-4 h-4 ${isFav ? "fill-[#E0A106] text-[#E0A106]" : "text-[#9AA6AE]"}`} />
        </button>
      </div>
    );
  };

  if (!open) return null;

  return createPortal(
    <div data-testid="site-menu" className="fixed inset-0 z-[300]" onClick={() => setOpen(false)}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" />
      <div onClick={(e) => e.stopPropagation()}
        className="absolute top-0 left-0 h-full w-[88%] max-w-sm bg-[#FAF5EC] dark:bg-[#1A1F24] shadow-2xl overflow-y-auto animate-in slide-in-from-left duration-300">
        <div className="sticky top-0 z-10 bg-[#6E371C] text-white">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="font-display text-lg font-bold flex items-center gap-2"><Menu className="w-5 h-5" /> {tri("Menù", "Menü", "Menu", "Menú")}</span>
            <button data-testid="site-menu-close" onClick={() => setOpen(false)} className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center active:scale-95"><X className="w-5 h-5" /></button>
          </div>
          <div className="px-3 pb-3">
            <div className="flex items-center gap-2 bg-white/15 rounded-xl px-3 py-2">
              <Search className="w-4 h-4 text-white/80 shrink-0" />
              <input data-testid="site-menu-search" value={q} onChange={(e) => setQ(e.target.value)}
                placeholder={tri("Cerca strumento…", "Werkzeug suchen…", "Search a tool…", "Buscar herramienta…")}
                className="bg-transparent outline-none text-sm text-white placeholder-white/60 w-full" />
              {q && <button data-testid="site-menu-search-clear" onClick={() => setQ("")} className="text-white/70"><X className="w-4 h-4" /></button>}
            </div>
          </div>
        </div>

        <div className="p-3">
          {nq ? (
            /* ---- Risultati ricerca ---- */
            <div data-testid="site-menu-search-results">
              {filteredSecs.length === 0 && filteredTools.length === 0 && (
                <p className="text-center text-sm text-[#7E8A93] py-6">{tri("Nessun risultato.", "Kein Ergebnis.", "No results.", "Sin resultados.")}</p>
              )}
              {filteredSecs.map((s) => (
                <button key={s.id} data-testid={`site-menu-section-${s.id}`} onClick={() => goTab(s.id)}
                  className="w-full flex items-center gap-3 text-left px-3 py-2.5 mb-1 rounded-xl bg-white dark:bg-[#232A31] border border-[#E6D8C3] dark:border-[#38424B] active:scale-98">
                  <s.Icon className="w-4.5 h-4.5 shrink-0" style={{ color: s.color }} /><span className="font-display text-sm font-bold text-[#2B303B] dark:text-[#e4eff8]">{s.label}</span>
                </button>
              ))}
              <div className="grid grid-cols-1 gap-1.5">
                {filteredTools.map((tl) => <ToolRow key={tl.id} tl={tl} />)}
              </div>
            </div>
          ) : (
            <>
              {/* Preferiti */}
              {favTools.length > 0 && (
                <div data-testid="site-menu-cat-preferiti" className="mb-4">
                  <div className="flex items-center gap-2 mb-1.5 pb-1 border-b border-[#E0A106]/40">
                    <span className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 bg-[#E0A106]/15"><Star className="w-3.5 h-3.5 fill-[#E0A106] text-[#E0A106]" /></span>
                    <span className="font-display text-sm font-bold text-[#B4790a]">{tri("Preferiti", "Favoriten", "Favourites", "Favoritos")}</span>
                  </div>
                  <div className="grid grid-cols-1 gap-1.5">{favTools.map((tl) => <ToolRow key={tl.id} tl={tl} />)}</div>
                </div>
              )}

              {/* Sezioni principali */}
              <p className="text-[11px] font-bold uppercase tracking-wide text-[#7E8A93] mb-1.5 px-1">{tri("Sezioni", "Bereiche", "Sections", "Secciones")}</p>
              <div className="grid grid-cols-1 gap-1.5 mb-4">
                {SECTIONS.map((s) => (
                  <button key={s.id} data-testid={`site-menu-section-${s.id}`} onClick={() => goTab(s.id)}
                    className="flex items-center gap-3 text-left px-3 py-3 rounded-xl bg-white dark:bg-[#232A31] border border-[#E6D8C3] dark:border-[#38424B] active:scale-98 hover:border-[#B45309]/60 transition-all">
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${s.color}1a` }}><s.Icon className="w-4.5 h-4.5" style={{ color: s.color }} /></span>
                    <span className="font-display text-sm font-bold text-[#2B303B] dark:text-[#e4eff8]">{s.label}</span>
                  </button>
                ))}
                <button data-testid="site-menu-section-sfide" onClick={goSfide}
                  className="flex items-center gap-3 text-left px-3 py-3 rounded-xl bg-gradient-to-br from-[#B45309] to-[#8C4A27] text-white active:scale-98 transition-all">
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-white/20"><Trophy className="w-4.5 h-4.5" /></span>
                  <span className="font-display text-sm font-bold">{tri("Motore Sfide", "Challenges", "Challenges", "Desafíos")}</span>
                </button>
              </div>

              {/* Tutti gli strumenti del Laboratorio */}
              <p className="text-[11px] font-bold uppercase tracking-wide text-[#7E8A93] mb-1.5 px-1">{tri("Strumenti del Laboratorio", "Labor-Werkzeuge", "Lab Tools", "Herramientas")}</p>
              <div className="space-y-3">
                {TOOL_CATS.map((c) => {
                  const items = TOOLS.filter((tl) => tl.cat === c.key);
                  if (items.length === 0) return null;
                  return (
                    <div key={c.key} data-testid={`site-menu-cat-${c.key}`}>
                      <div className="flex items-center gap-2 mb-1 pb-1 border-b" style={{ borderColor: `${c.color}40` }}>
                        <span className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ background: `${c.color}1a` }}><c.Icon className="w-3.5 h-3.5" style={{ color: c.color }} /></span>
                        <span className="font-display text-sm font-bold" style={{ color: c.color }}>{tri(c.it, c.de, c.en, c.es)}</span>
                      </div>
                      <div className="grid grid-cols-1 gap-1.5">{items.map((tl) => <ToolRow key={tl.id} tl={tl} />)}</div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
