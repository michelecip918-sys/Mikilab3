import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Home as HomeIcon, BookOpen, Wrench, GraduationCap, Users, Trophy, Menu } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { TOOLS, TOOL_CATS } from "@/sections/PianoProduzioneAI";

// Menù globale (hamburger) disponibile in tutto il sito: porta a ogni sezione e a ogni strumento.
export default function SiteMenu({ onNavigate, onOpenSfide }) {
  const { lang } = useLang();
  const tri = (i, d, e, s) => (lang === "de" ? d : lang === "es" ? (s ?? e ?? i) : ((lang === "en" || lang === "fr" || lang === "fa") ? (e ?? i) : i));
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const h = () => setOpen(true);
    window.addEventListener("mikilab-open-menu", h);
    return () => window.removeEventListener("mikilab-open-menu", h);
  }, []);

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

  if (!open) return null;

  return createPortal(
    <div data-testid="site-menu" className="fixed inset-0 z-[300]" onClick={() => setOpen(false)}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" />
      <div onClick={(e) => e.stopPropagation()}
        className="absolute top-0 left-0 h-full w-[86%] max-w-sm bg-[#FAF5EC] dark:bg-[#1A1F24] shadow-2xl overflow-y-auto animate-in slide-in-from-left duration-300">
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-[#6E371C] text-white">
          <span className="font-display text-lg font-bold flex items-center gap-2"><Menu className="w-5 h-5" /> {tri("Menù", "Menü", "Menu", "Menú")}</span>
          <button data-testid="site-menu-close" onClick={() => setOpen(false)} className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center active:scale-95"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-3">
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
                  <div className="grid grid-cols-1 gap-1">
                    {items.map((tl) => (
                      <button key={tl.id} data-testid={`site-menu-tool-${tl.id}`} onClick={() => goTool(tl.id)}
                        className="flex items-center gap-2.5 text-left px-3 py-2.5 rounded-xl bg-white dark:bg-[#232A31] border border-[#E6D8C3] dark:border-[#38424B] active:scale-98 hover:border-[#B45309]/60 transition-all">
                        <tl.Icon className="w-4 h-4 shrink-0" style={{ color: c.color }} />
                        <span className="text-sm font-medium text-[#2B303B] dark:text-[#e4eff8] truncate">{tri(tl.it, tl.de, tl.en, tl.es)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
