import { useEffect, useMemo, useState } from "react";
import { Wheat } from "lucide-react";
import { recipesApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { rLoc } from "@/lib/loc";
import { CATS, recipeCategory } from "@/lib/recipeCats";
import { useDept, matchDept } from "@/lib/dept";

// V78 — "Le vetrine del MikiLab": una vetrina per ogni reparto del ricettario, nello stesso stile di
// "Novità dal MikiLab". Si vedono solo le ricette che hanno una foto; tocca per aprire la ricetta.
const SHOW = 8;
// Nomi brevi dei reparti per le etichette (it, de, en, es).
const SHORT = {
  pane: ["Pane", "Brot", "Bread", "Pan"],
  panini: ["Panini", "Brötchen", "Buns", "Panecillos"],
  focacce: ["Focacce", "Focaccia", "Focaccia", "Focaccias"],
  pizza: ["Pizza", "Pizza", "Pizza", "Pizza"],
  panettoni: ["Panettoni", "Panettone", "Panettone", "Panettones"],
  viennoiserie: ["Viennoiserie", "Feingebäck", "Viennoiserie", "Viennoiserie"],
  pasticceria: ["Pasticceria", "Konditorei", "Pastry", "Pastelería"],
  snack: ["Snack", "Snacks", "Snacks", "Snacks"],
  rosticceria: ["Rosticceria", "Herzhaftes", "Savoury bakes", "Salados"],
  fritti: ["Fritti", "Frittiertes", "Fried", "Fritos"],
};

export const VetrineReparti = () => {
  const { lang } = useLang();
  const dept = useDept();
  const tri = (i, d, e, s) => mkTri(lang)(i, d, e, s);
  const [all, setAll] = useState([]);
  const [cat, setCat] = useState(null);
  const [more, setMore] = useState(false);

  useEffect(() => {
    let alive = true;
    recipesApi.list("mikilab").then((rs) => {
      if (alive) setAll((rs || []).filter((r) => r.image_url));
    }).catch(() => {});
    return () => { alive = false; };
  }, []);

  const groups = useMemo(() => {
    const g = {};
    all.filter((r) => matchDept(r, dept, { autoDeduce: true })).forEach((r) => {
      const k = recipeCategory(r).key;
      if (k === "basi") return;
      if (!g[k]) g[k] = [];
      g[k].push(r);
    });
    Object.values(g).forEach((list) => list.sort((a, b) => String(rLoc(a, "name", lang)).localeCompare(String(rLoc(b, "name", lang)))));
    return g;
  }, [all, dept, lang]);

  const short = (k) => { const a = SHORT[k]; return a ? tri(a[0], a[1], a[2], a[3]) : k; };
  const tabs = CATS.filter((c) => c.key !== "basi" && (groups[c.key] || []).length > 0);
  if (!tabs.length) return null;
  const active = groups[cat] ? cat : tabs[0].key;
  const list = groups[active] || [];
  const shown = more ? list : list.slice(0, SHOW);

  const open = (r) => {
    window.dispatchEvent(new CustomEvent("mikilab-open-recipe", { detail: { id: r.id } }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div data-testid="ricette-vetrine">
      <div className="flex items-center gap-2 mb-1">
        <Wheat className="w-5 h-5 text-primary" />
        <h2 className="font-display text-lg font-bold text-foreground dark:text-foreground">
          {tri("Le vetrine del MikiLab", "Die Schaufenster von MikiLab", "MikiLab showcases", "Las vitrinas de MikiLab")}
        </h2>
      </div>
      <p className="text-sm text-muted-foreground mb-3">
        {tri("Una vetrina per ogni reparto: scegli e tocca per aprire la ricetta.",
             "Ein Schaufenster für jede Abteilung: auswählen und zum Öffnen tippen.",
             "One showcase for every department: pick one and tap to open the recipe.",
             "Una vitrina para cada sección: elige y toca para abrir la receta.")}
      </p>
      <div className="flex gap-2 overflow-x-auto pb-2 mb-2 -mx-1 px-1" data-testid="vetrine-tabs">
        {tabs.map((c) => (
          <button key={c.key} data-testid={`vetrine-tab-${c.key}`} onClick={() => { setCat(c.key); setMore(false); }}
            className={`px-3 py-1.5 rounded-full text-sm font-bold whitespace-nowrap border transition-all ${active === c.key ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border"}`}>
            {c.icon} {short(c.key)} <span className="opacity-70">({groups[c.key].length})</span>
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2" data-testid="vetrine-grid">
        {shown.map((r) => (
          <button key={r.id} data-testid={`vetrine-card-${r.id}`} onClick={() => open(r)}
            className="text-left rounded-2xl shadow-md border border-amber-900/40 overflow-hidden bg-card dark:bg-card border border-border dark:border-border shadow-sm active:scale-97 transition-all">
            <div className="h-16 w-full overflow-hidden">
              <img src={r.image_url} alt={rLoc(r, "name", lang)} loading="lazy" className="w-full h-full object-cover" />
            </div>
            <div className="p-1.5">
              <p className="font-display text-[11px] font-semibold text-foreground dark:text-foreground leading-tight line-clamp-2">{rLoc(r, "name", lang)}</p>
            </div>
          </button>
        ))}
      </div>
      {list.length > SHOW && (
        <button data-testid="vetrine-more" onClick={() => setMore((m) => !m)}
          className="mt-3 w-full rounded-2xl border border-border bg-card text-foreground font-semibold py-2.5 text-sm active:scale-95 transition-all">
          {more
            ? tri("Mostra meno", "Weniger anzeigen", "Show less", "Mostrar menos")
            : `${tri("Vedi tutte", "Alle ansehen", "See all", "Ver todas")} (${list.length})`}
        </button>
      )}
    </div>
  );
};

export default VetrineReparti;
