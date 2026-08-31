import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X, BookOpen, Wrench, GraduationCap } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { recipesApi } from "@/lib/api";
import { rLoc } from "@/lib/loc";
import { TOOLS } from "@/sections/PianoProduzioneAI";

// Ricerca globale: trova Ricette, Strumenti e Guide da qualsiasi pagina.
const norm = (s) => (s || "").toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export default function GlobalSearch() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [recipes, setRecipes] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    const h = () => setOpen(true);
    window.addEventListener("mikilab-open-search", h);
    return () => window.removeEventListener("mikilab-open-search", h);
  }, []);

  useEffect(() => {
    if (!open) return;
    setTimeout(() => inputRef.current?.focus(), 60);
    if (recipes.length === 0) recipesApi.list("mikilab").then((r) => setRecipes(r || [])).catch(() => {});
  }, [open]); // eslint-disable-line

  const tools = useMemo(() => TOOLS.map((tl) => ({ id: tl.id, Icon: tl.Icon, label: tl[lang] || tl.it })), [lang]);
  const guides = useMemo(() => [
    { id: "g-enciclopedia", tab: "ricette", label: tri("Enciclopedia del Pane", "Brot-Lexikon", "Bread Encyclopedia", "Enciclopedia del Pan", "Encyclopédie du Pain") },
    { id: "g-farine", tab: "ricette", label: tri("Tabelle & Farine", "Tabellen & Mehle", "Tables & Flours", "Tablas y Harinas", "Tableaux & Farines") },
    { id: "g-impara", tab: "impara", label: tri("Impara a fare il pane", "Brot backen lernen", "Learn to bake bread", "Aprende a hacer pan", "Apprendre à faire le pain") },
    { id: "g-vetrina", tab: "ricette", label: tri("Vetrina delle Ricette", "Rezept-Schaufenster", "Recipe Showcase", "Vitrina de Recetas", "Vitrine des Recettes") },
  ], [lang]); // eslint-disable-line

  const nq = norm(q.trim());
  const recHits = nq ? recipes.filter((r) => norm(rLoc(r, "name", lang)).includes(nq) || norm(r.name).includes(nq)).slice(0, 8) : [];
  const toolHits = nq ? tools.filter((t) => norm(t.label).includes(nq)).slice(0, 8) : [];
  const guideHits = nq ? guides.filter((g) => norm(g.label).includes(nq)) : [];
  const empty = nq && recHits.length === 0 && toolHits.length === 0 && guideHits.length === 0;

  const close = () => { setOpen(false); setQ(""); };
  const goto = (tab) => window.dispatchEvent(new CustomEvent("mikilab-goto", { detail: { tab } }));
  const openRecipe = (id) => { goto("ricette"); setTimeout(() => window.dispatchEvent(new CustomEvent("mikilab-open-recipe", { detail: { id } })), 260); close(); };
  const openTool = (id) => { try { localStorage.setItem("mikilab_pending_tool", id); } catch { /* */ } goto("maestro"); setTimeout(() => window.dispatchEvent(new CustomEvent("mikilab-open-lab-tool", { detail: { id } })), 260); close(); };
  const openGuide = (g) => { goto(g.tab); close(); };

  if (!open) return null;

  const Row = ({ testid, Icon, label, onClick }) => (
    <button data-testid={testid} onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#ff6b00]/10 active:scale-98 transition-all text-left">
      <span className="w-8 h-8 rounded-lg bg-[#ff6b00]/15 border border-[#ff6b00]/30 flex items-center justify-center shrink-0"><Icon className="w-4 h-4 text-[#ff6b00]" /></span>
      <span className="text-sm text-[#e4eff8] leading-tight">{label}</span>
    </button>
  );

  return (
    <div data-testid="global-search" className="fixed inset-0 z-[400] flex items-start justify-center p-4 pt-16" onClick={close}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg bg-[#161616] border border-[#2e2e2e] rounded-3xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 p-3 border-b border-[#2e2e2e]">
          <Search className="w-5 h-5 text-[#ff6b00] shrink-0" />
          <input ref={inputRef} data-testid="global-search-input" value={q} onChange={(e) => setQ(e.target.value)}
            placeholder={tri("Cerca ricette, strumenti, guide…", "Suche Rezepte, Werkzeuge, Anleitungen…", "Search recipes, tools, guides…", "Busca recetas, herramientas, guías…", "Cherche recettes, outils, guides…", "جستجوی دستور، ابزار، راهنما…")}
            className="flex-1 bg-transparent outline-none text-[15px] text-white placeholder-[#7E8A93]" />
          <button data-testid="global-search-close" onClick={close} className="w-8 h-8 rounded-full bg-[#1e1e1e] flex items-center justify-center text-[#7E8A93] active:scale-95"><X className="w-4 h-4" /></button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {!nq && <p className="text-center text-[13px] text-[#7E8A93] py-8">{tri("Scrivi per cercare in tutta l'app.", "Tippe, um in der ganzen App zu suchen.", "Type to search across the whole app.", "Escribe para buscar en toda la app.", "Écris pour chercher dans toute l'app.", "برای جستجو تایپ کن.")}</p>}
          {empty && <p data-testid="global-search-empty" className="text-center text-[13px] text-[#7E8A93] py-8">{tri("Nessun risultato.", "Keine Ergebnisse.", "No results.", "Sin resultados.", "Aucun résultat.", "نتیجه‌ای نیست.")}</p>}
          {recHits.length > 0 && (
            <div className="mb-1">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#ff6b00] px-3 pt-2 pb-1">{tri("Ricette", "Rezepte", "Recipes", "Recetas", "Recettes", "دستورها")}</p>
              {recHits.map((r) => <Row key={r.id} testid={`gs-recipe-${r.id}`} Icon={BookOpen} label={rLoc(r, "name", lang)} onClick={() => openRecipe(r.id)} />)}
            </div>
          )}
          {toolHits.length > 0 && (
            <div className="mb-1">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#ff6b00] px-3 pt-2 pb-1">{tri("Strumenti", "Werkzeuge", "Tools", "Herramientas", "Outils", "ابزارها")}</p>
              {toolHits.map((t) => <Row key={t.id} testid={`gs-tool-${t.id}`} Icon={t.Icon || Wrench} label={t.label} onClick={() => openTool(t.id)} />)}
            </div>
          )}
          {guideHits.length > 0 && (
            <div className="mb-1">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#ff6b00] px-3 pt-2 pb-1">{tri("Guide", "Anleitungen", "Guides", "Guías", "Guides", "راهنماها")}</p>
              {guideHits.map((g) => <Row key={g.id} testid={`gs-${g.id}`} Icon={GraduationCap} label={g.label} onClick={() => openGuide(g)} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
