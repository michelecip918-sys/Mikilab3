import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search, PlayCircle, Loader2, ChefHat } from "lucide-react";
import { recipesApi } from "@/lib/api";
import { rLoc } from "@/lib/loc";
import { mkTri } from "@/i18n/triMaps";
import { useLang } from "@/i18n/LanguageContext";
import BakeStepByStep from "@/components/BakeStepByStep";

const hasSteps = (r) => {
  const p = r.procedure || r.procedure_de || "";
  return String(p).split(/\r?\n/).filter((l) => l.trim().length > 1).length > 0;
};

export default function RiproduciRicetta({ onBack, onNavigate }) {
  const { lang } = useLang();
  const L = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(null);

  useEffect(() => {
    let alive = true;
    recipesApi.list("mikilab").then((list) => {
      if (!alive) return;
      setRecipes((list || []).filter((r) => !r.locked && hasSteps(r)));
      setLoading(false);
    }).catch(() => setLoading(false));
    return () => { alive = false; };
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return recipes;
    return recipes.filter((r) => (rLoc(r, "name", lang) || r.name || "").toLowerCase().includes(s));
  }, [recipes, q, lang]);

  if (active) {
    return <BakeStepByStep recipe={active} lang={lang}
      onExit={() => setActive(null)}
      onGoCommunity={() => onNavigate && onNavigate("community")} />;
  }

  return (
    <div data-testid="riproduci-ricetta" className="pb-8">
      {onBack && (
        <button data-testid="riproduci-back" onClick={onBack} className="flex items-center gap-1 text-[#ff6b00] font-medium mb-3">
          <ChevronLeft className="w-5 h-5" /> {L("Indietro", "Zurück", "Back", "Atrás", "Retour", "بازگشت")}
        </button>
      )}

      <div className="relative overflow-hidden rounded-3xl p-6 text-[#121212] shadow-xl mb-4" style={{ background: "linear-gradient(135deg,#ff8a33,#ff6b00 70%)" }}>
        <div className="w-14 h-14 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center mb-3"><PlayCircle className="w-7 h-7" /></div>
        <h1 className="font-display text-2xl font-bold">{L("Riproduci una ricetta", "Rezept nachbacken", "Bake a recipe step by step", "Reproduce una receta", "Reproduis une recette", "پخت گام‌به‌گام")}</h1>
        <p className="text-[#121212]/85 text-sm mt-2 leading-snug">{L("Scegli una ricetta e ti guido passo dopo passo, con MikiLab accanto a te e la lista della spesa pronta.", "Wähle ein Rezept und ich führe dich Schritt für Schritt — mit MikiLab und fertiger Einkaufsliste.", "Pick a recipe and I'll guide you step by step, with MikiLab beside you and the shopping list ready.", "Elige una receta y te guío paso a paso, con MikiLab a tu lado y la lista lista.", "Choisis une recette et je te guide pas à pas, avec MikiLab et la liste de courses prête.", "یک دستور انتخاب کن تا گام‌به‌گام راهنمایی‌ات کنم.")}</p>
      </div>

      <div className="relative mb-4">
        <Search className="w-4.5 h-4.5 text-[#AEB8BF] absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input data-testid="riproduci-search" value={q} onChange={(e) => setQ(e.target.value)}
          placeholder={L("Cerca una ricetta…", "Rezept suchen…", "Search a recipe…", "Buscar receta…", "Chercher une recette…", "جستجوی دستور…")}
          className="w-full bg-[#1e1e1e] border border-[#2e2e2e] rounded-2xl pl-10 pr-3 py-3 text-sm text-white outline-none focus:border-[#ff6b00]" />
      </div>

      {loading ? (
        <div className="py-16 text-center text-[#AEB8BF]"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <p className="py-10 text-center text-[#AEB8BF] text-sm">{L("Nessuna ricetta trovata.", "Kein Rezept gefunden.", "No recipe found.", "Sin recetas.", "Aucune recette.", "دستوری یافت نشد.")}</p>
      ) : (
        <div className="space-y-2.5" data-testid="riproduci-list">
          {filtered.map((r) => {
            const nm = rLoc(r, "name", lang) || r.name;
            return (
              <button key={r.id} data-testid={`riproduci-recipe-${r.id}`} onClick={() => setActive(r)}
                className="w-full text-left flex items-center gap-3 rounded-2xl bg-[#1e1e1e] border border-[#2e2e2e] p-3 active:scale-98 hover:border-[#ff6b00]/60 transition-all">
                {r.image_url ? (
                  <img src={r.image_url.startsWith("http") ? r.image_url : `${process.env.PUBLIC_URL}${r.image_url}`} alt="" loading="lazy"
                    className="w-14 h-14 rounded-2xl shadow-md border border-amber-900/40 object-cover shrink-0" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                ) : (
                  <div className="w-14 h-14 rounded-2xl shadow-md border border-amber-900/40 bg-[#ff6b00]/15 flex items-center justify-center shrink-0"><ChefHat className="w-6 h-6 text-[#ff6b00]" /></div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-display text-[15px] font-bold text-white leading-tight truncate">{nm}</p>
                  <p className="text-[12px] text-[#AEB8BF] leading-snug truncate">{rLoc(r, "flour_type", lang) || r.category || ""}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-[#ff6b00]/70 shrink-0" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
