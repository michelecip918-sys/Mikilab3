import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X, BookOpen, Wrench, GraduationCap } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { recipesApi } from "@/lib/api";
import { rLoc } from "@/lib/loc";
import { TOOLS, TOOL_KINDS } from "@/sections/PianoProduzioneAI";

// Ricerca globale: trova Ricette, Strumenti e Guide da qualsiasi pagina.
const norm = (s) => (s || "").toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export default function GlobalSearch() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [recipes, setRecipes] = useState([]);
  const [recent, setRecent] = useState(() => { try { return JSON.parse(localStorage.getItem("mikilab_recent_searches") || "[]"); } catch { return []; } });
  const [scope, setScope] = useState("all");
  const pushRecent = (term) => {
    const tt = (term || "").trim(); if (!tt) return;
    setRecent((r) => { const n = [tt, ...r.filter((x) => x.toLowerCase() !== tt.toLowerCase())].slice(0, 6); try { localStorage.setItem("mikilab_recent_searches", JSON.stringify(n)); } catch { /* */ } return n; });
  };
  const inputRef = useRef(null);

  useEffect(() => {
    const h = () => setOpen(true);
    window.addEventListener("mikilab-open-search", h);
    const onKey = (e) => {
      if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const el = document.activeElement;
        const typing = el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
        if (!typing) { e.preventDefault(); setOpen(true); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("mikilab-open-search", h); window.removeEventListener("keydown", onKey); };
  }, []);

  useEffect(() => {
    if (!open) return;
    setTimeout(() => inputRef.current?.focus(), 60);
    if (recipes.length === 0) recipesApi.list("mikilab").then((r) => setRecipes(r || [])).catch(() => {});
  }, [open]); // eslint-disable-line

  const kindColor = useMemo(() => Object.fromEntries(TOOL_KINDS.map((k) => [k.key, k.color])), []);
  const tools = useMemo(() => TOOLS.map((tl) => ({ id: tl.id, Icon: tl.Icon, label: tl[lang] || tl.it, color: kindColor[tl.kind] })), [lang, kindColor]);
  const guides = useMemo(() => [
    { id: "g-enciclopedia", tab: "ricette", view: "guida", label: tri("Enciclopedia del Pane", "Brot-Lexikon", "Bread Encyclopedia", "Enciclopedia del Pan", "Encyclopédie du Pain") },
    { id: "g-farine", tab: "ricette", view: "farine", label: tri("Tabelle & Farine", "Tabellen & Mehle", "Tables & Flours", "Tablas y Harinas", "Tableaux & Farines") },
    { id: "g-impara", tab: "impara", label: tri("Impara a fare il pane", "Brot backen lernen", "Learn to bake bread", "Aprende a hacer pan", "Apprendre à faire le pain") },
    { id: "g-vetrina", tab: "ricette", view: "focacce", label: tri("Vetrina delle Ricette", "Rezept-Schaufenster", "Recipe Showcase", "Vitrina de Recetas", "Vitrine des Recettes") },
  ], [lang]); // eslint-disable-line

  const nq = norm(q.trim());
  const recText = (r) => norm([r.name, r.name_de, r.name_en, r.name_es, r.flour_type, rLoc(r, "name", lang), rLoc(r, "notes", lang), (r.extra_ingredients || []).map((x) => `${x.name || ""} ${x[`name_${lang}`] || ""}`).join(" ")].join(" "));
  const nameText = (r) => norm([r.name, r.name_de, r.name_en, r.name_es, rLoc(r, "name", lang)].join(" "));
  const matchReason = (r) => {
    if (!nq || nameText(r).includes(nq)) return null;
    const ing = (r.extra_ingredients || []).find((x) => norm(`${x.name || ""} ${x[`name_${lang}`] || ""}`).includes(nq));
    if (ing) return `${tri("Contiene", "Enthält", "Contains", "Contiene", "Contient", "شامل")}: ${ing[`name_${lang}`] || ing.name}`;
    if (norm(r.flour_type || "").includes(nq)) return `${tri("Farina", "Mehl", "Flour", "Harina", "Farine", "آرد")}: ${r.flour_type}`;
    if (norm(rLoc(r, "notes", lang)).includes(nq)) return tri("Trovato nelle note", "In den Notizen gefunden", "Found in notes", "Encontrado en las notas", "Trouvé dans les notes", "در یادداشت‌ها");
    return null;
  };
  const showRec = scope === "all" || scope === "recipes";
  const showTool = scope === "all" || scope === "tools";
  const showGuide = scope === "all" || scope === "guides";
  const allRec = nq ? recipes.filter((r) => recText(r).includes(nq)) : [];
  const allTool = nq ? tools.filter((t) => norm(t.label).includes(nq)) : [];
  const allGuide = nq ? guides.filter((g) => norm(g.label).includes(nq)) : [];
  const recHits = showRec ? allRec.slice(0, 10) : [];
  const toolHits = showTool ? allTool.slice(0, 10) : [];
  const guideHits = showGuide ? allGuide : [];
  const counts = { all: allRec.length + allTool.length + allGuide.length, recipes: allRec.length, tools: allTool.length, guides: allGuide.length };
  const empty = nq && recHits.length === 0 && toolHits.length === 0 && guideHits.length === 0;

  const close = () => { setOpen(false); setQ(""); setScope("all"); };
  const goto = (tab) => window.dispatchEvent(new CustomEvent("mikilab-goto", { detail: { tab } }));
  const openRecipe = (id) => { pushRecent(q); goto("ricette"); setTimeout(() => window.dispatchEvent(new CustomEvent("mikilab-open-recipe", { detail: { id } })), 260); close(); };
  const openTool = (id) => { pushRecent(q); try { localStorage.setItem("mikilab_pending_tool", id); } catch { /* */ } goto("maestro"); setTimeout(() => window.dispatchEvent(new CustomEvent("mikilab-open-lab-tool", { detail: { id } })), 260); close(); };
  const openGuide = (g) => { pushRecent(q); goto(g.tab); if (g.view) setTimeout(() => window.dispatchEvent(new CustomEvent("mikilab-ricette-view", { detail: { view: g.view } })), 280); close(); };

  if (!open) return null;

  const hi = q.trim();
  const Highlight = ({ text }) => {
    if (!hi || typeof text !== "string") return text || null;
    const i = text.toLowerCase().indexOf(hi.toLowerCase());
    if (i < 0) return text;
    return (<>{text.slice(0, i)}<span className="bg-[#c94f00]/35 text-white rounded px-0.5">{text.slice(i, i + hi.length)}</span>{text.slice(i + hi.length)}</>);
  };

  const Row = ({ testid, Icon, img, color, label, sub, onClick }) => (
    <button data-testid={testid} onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl shadow-md border border-amber-900/40 hover:bg-[#c94f00]/10 active:scale-98 transition-all text-left">
      {img
        ? <img src={img} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0 bg-[#1e1e1e]" onError={(e) => { e.currentTarget.style.visibility = "hidden"; }} />
        : <span className="w-8 h-8 rounded-lg border flex items-center justify-center shrink-0" style={{ background: (color || "#c94f00") + "22", borderColor: (color || "#c94f00") + "55" }}><Icon className="w-4 h-4" style={{ color: color || "#c94f00" }} /></span>}
      <span className="min-w-0 flex-1">
        <span className="block text-sm text-[#e4eff8] leading-tight"><Highlight text={label} /></span>
        {sub && <span data-testid={`${testid}-reason`} className="block text-[11px] text-[#d4a373] leading-tight mt-0.5 truncate"><Highlight text={sub} /></span>}
      </span>
    </button>
  );

  return (
    <div data-testid="global-search" className="fixed inset-0 z-[400] flex items-start justify-center p-4 pt-16" onClick={close}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg bg-[#161616] border border-[#2e2e2e] rounded-3xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 p-3 border-b border-[#2e2e2e]">
          <Search className="w-5 h-5 text-[#c94f00] shrink-0" />
          <input ref={inputRef} data-testid="global-search-input" value={q} onChange={(e) => setQ(e.target.value)}
            placeholder={tri("Cerca ricette (anche per ingrediente), strumenti, guide…", "Suche Rezepte (auch nach Zutat), Werkzeuge, Anleitungen…", "Search recipes (also by ingredient), tools, guides…", "Busca recetas (por ingrediente), herramientas, guías…", "Cherche recettes (par ingrédient), outils, guides…", "جستجوی دستور، ابزار، راهنما…")}
            className="flex-1 bg-transparent outline-none text-[15px] text-white placeholder-[#7E8A93]" />
          <button data-testid="global-search-close" onClick={close} className="w-8 h-8 rounded-full bg-[#1e1e1e] flex items-center justify-center text-[#7E8A93] active:scale-95"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex gap-2 px-3 py-2 border-b border-[#2e2e2e] overflow-x-auto no-scrollbar" data-testid="global-search-scopes">
          {[
            { key: "all", label: tri("Tutto", "Alles", "All", "Todo", "Tout", "همه") },
            { key: "recipes", label: tri("Ricette", "Rezepte", "Recipes", "Recetas", "Recettes", "دستورها") },
            { key: "tools", label: tri("Strumenti", "Werkzeuge", "Tools", "Herramientas", "Outils", "ابزارها") },
            { key: "guides", label: tri("Guide", "Anleitungen", "Guides", "Guías", "Guides", "راهنماها") },
          ].map((s) => (
            <button key={s.key} data-testid={`gs-scope-${s.key}`} onClick={() => setScope(s.key)}
              className={`shrink-0 px-3 py-1 rounded-full text-[12.5px] font-bold whitespace-nowrap border transition-all ${scope === s.key ? "bg-[#c94f00] text-[#121212] border-[#c94f00]" : "bg-[#1e1e1e] text-[#AEB8BF] border-[#2e2e2e]"}`}>
              {s.label}{nq ? ` · ${counts[s.key]}` : ""}
            </button>
          ))}
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {!nq && (
            recent.length > 0 ? (
              <div className="p-2" data-testid="global-search-recent">
                <div className="flex items-center justify-between px-1 pb-2">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#c94f00]">{tri("Ricerche recenti", "Letzte Suchen", "Recent searches", "Búsquedas recientes", "Recherches récentes", "جستجوهای اخیر")}</p>
                  <button data-testid="global-search-clear-recent" onClick={() => { setRecent([]); try { localStorage.removeItem("mikilab_recent_searches"); } catch { /* */ } }} className="text-[11px] text-[#7E8A93] active:scale-95">{tri("Cancella", "Löschen", "Clear", "Borrar", "Effacer", "پاک کردن")}</button>
                </div>
                <div className="flex flex-wrap gap-2 px-1">
                  {recent.map((term) => (
                    <button key={term} data-testid={`gs-recent-${term}`} onClick={() => { setQ(term); setTimeout(() => inputRef.current?.focus(), 30); }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1e1e1e] border border-[#2e2e2e] text-[#e4eff8] text-[12.5px] active:scale-95 hover:border-[#c94f00]/60 transition-all">
                      <Search className="w-3 h-3 text-[#7E8A93]" />{term}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-center text-[13px] text-[#7E8A93] py-8">{tri("Scrivi per cercare in tutta l'app.", "Tippe, um in der ganzen App zu suchen.", "Type to search across the whole app.", "Escribe para buscar en toda la app.", "Écris pour chercher dans toute l'app.", "برای جستجو تایپ کن.")}</p>
            )
          )}
          {empty && <p data-testid="global-search-empty" className="text-center text-[13px] text-[#7E8A93] py-8">{tri("Nessun risultato.", "Keine Ergebnisse.", "No results.", "Sin resultados.", "Aucun résultat.", "نتیجه‌ای نیست.")}</p>}
          {recHits.length > 0 && (
            <div className="mb-1">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#c94f00] px-3 pt-2 pb-1">{tri("Ricette", "Rezepte", "Recipes", "Recetas", "Recettes", "دستورها")}</p>
              {recHits.map((r) => <Row key={r.id} testid={`gs-recipe-${r.id}`} img={r.image_url} Icon={BookOpen} label={rLoc(r, "name", lang)} sub={matchReason(r)} onClick={() => openRecipe(r.id)} />)}
            </div>
          )}
          {toolHits.length > 0 && (
            <div className="mb-1">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#c94f00] px-3 pt-2 pb-1">{tri("Strumenti", "Werkzeuge", "Tools", "Herramientas", "Outils", "ابزارها")}</p>
              {toolHits.map((t) => <Row key={t.id} testid={`gs-tool-${t.id}`} color={t.color} Icon={t.Icon || Wrench} label={t.label} onClick={() => openTool(t.id)} />)}
            </div>
          )}
          {guideHits.length > 0 && (
            <div className="mb-1">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#c94f00] px-3 pt-2 pb-1">{tri("Guide", "Anleitungen", "Guides", "Guías", "Guides", "راهنماها")}</p>
              {guideHits.map((g) => <Row key={g.id} testid={`gs-${g.id}`} Icon={GraduationCap} label={g.label} onClick={() => openGuide(g)} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
