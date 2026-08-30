import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { CATS, recipeCategory } from "@/lib/recipeCats";
import { recipeTitle } from "@/lib/loc";
import { useLang } from "@/i18n/LanguageContext";
import { ChevronDown, ChevronLeft, X, Search, Check } from "lucide-react";

// Selettore ricetta a CATEGORIE: sostituisce il lungo <select>.
// Clicchi una categoria (pannello grande e leggibile) → escono le sue ricette da scegliere.
export default function CategoryRecipePicker({ recipes, value, onChange, placeholder, testid = "recipe-picker" }) {
  const { t, lang } = useLang();
  const [open, setOpen] = useState(false);
  const [cat, setCat] = useState(null);
  const [q, setQ] = useState("");
  const list = recipes || [];

  const selected = list.find((r) => r.id === value);
  const byCat = useMemo(() => {
    const m = {};
    for (const c of CATS) {
      m[c.key] = list
        .filter((r) => recipeCategory(r).key === c.key)
        .sort((a, b) => recipeTitle(a, lang).localeCompare(recipeTitle(b, lang)));
    }
    return m;
  }, [list, lang]);

  const searchHits = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return list.filter((r) => recipeTitle(r, lang).toLowerCase().includes(s)).slice(0, 40);
  }, [q, list, lang]);

  const close = () => { setOpen(false); setCat(null); setQ(""); };
  const pick = (id) => { onChange({ target: { value: id } }); close(); };

  const catObj = CATS.find((c) => c.key === cat);
  const items = cat ? byCat[cat] : [];

  return (
    <>
      <button type="button" data-testid={`${testid}-trigger`} onClick={() => setOpen(true)}
        className="w-full appearance-none bg-white dark:bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl py-2.5 pl-3 pr-9 text-sm font-medium text-[#2B303B] dark:text-white outline-none focus:border-[#ff6b00] transition-all text-left relative">
        <span className={`block truncate pr-1 ${selected ? "" : "text-[#7E8A93]"}`}>{selected ? recipeTitle(selected, lang) : (placeholder || t("capo_pick_recipe"))}</span>
        <ChevronDown className="w-4 h-4 text-[#ff6b00] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      </button>

      {open && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center" data-testid={`${testid}-modal`}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={close} />
          <div className="relative w-full sm:max-w-md bg-[#161616] border-t sm:border border-[#2e2e2e] rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex items-center gap-2 p-4 border-b border-[#2e2e2e] shrink-0">
              {cat ? (
                <button data-testid={`${testid}-back`} onClick={() => setCat(null)} className="p-1 text-[#ff6b00]"><ChevronLeft className="w-6 h-6" /></button>
              ) : null}
              <h3 className="font-display text-lg font-extrabold text-white flex-1 truncate">
                {cat ? `${catObj?.icon || ""} ${t(catObj?.label)}` : t("capo_pick_recipe")}
              </h3>
              <button data-testid={`${testid}-close`} onClick={close} className="p-1 text-[#7E8A93] hover:text-white"><X className="w-6 h-6" /></button>
            </div>

            {!cat && (
              <div className="p-3 border-b border-[#2e2e2e] shrink-0 relative">
                <Search className="w-4 h-4 text-[#7E8A93] absolute left-6 top-1/2 -translate-y-1/2" />
                <input data-testid={`${testid}-search`} value={q} onChange={(e) => setQ(e.target.value)} placeholder={lang === "de" ? "Suchen…" : lang === "en" ? "Search…" : "Cerca…"}
                  className="w-full bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl py-2.5 pl-10 pr-3 text-sm text-white outline-none focus:border-[#ff6b00]" />
              </div>
            )}

            <div className="overflow-y-auto p-3 flex-1">
              {q.trim() ? (
                searchHits.length ? searchHits.map((r) => (
                  <button key={r.id} data-testid={`${testid}-item-${r.id}`} onClick={() => pick(r.id)}
                    className="w-full text-left px-3 py-3 rounded-xl hover:bg-[#1e1e1e] text-white text-[15px] font-medium border-b border-[#2e2e2e]/60 flex items-center gap-2">
                    {value === r.id && <Check className="w-4 h-4 text-[#ff6b00] shrink-0" />}
                    <span className="flex-1">{recipeTitle(r, lang)}</span>
                  </button>
                )) : <p className="text-center text-[#7E8A93] py-6 text-sm">{lang === "de" ? "Kein Ergebnis" : lang === "en" ? "No results" : "Nessun risultato"}</p>
              ) : !cat ? (
                <div className="grid grid-cols-2 gap-2.5">
                  {CATS.filter((c) => byCat[c.key].length > 0).map((c) => (
                    <button key={c.key} data-testid={`${testid}-cat-${c.key}`} onClick={() => setCat(c.key)}
                      className="flex flex-col items-start gap-1 p-3.5 rounded-2xl bg-[#1e1e1e] border border-[#ff6b00]/30 hover:border-[#ff6b00] active:scale-97 transition-all text-left min-h-[80px]">
                      <span className="text-2xl">{c.icon}</span>
                      <span className="font-display text-[15px] font-bold text-white leading-tight">{t(c.label)}</span>
                      <span className="text-[11px] text-[#ff6b00] font-semibold">{byCat[c.key].length} {byCat[c.key].length === 1 ? (lang === "de" ? "Rezept" : lang === "en" ? "recipe" : "ricetta") : (lang === "de" ? "Rezepte" : lang === "en" ? "recipes" : "ricette")}</span>
                    </button>
                  ))}
                </div>
              ) : (
                items.map((r) => (
                  <button key={r.id} data-testid={`${testid}-item-${r.id}`} onClick={() => pick(r.id)}
                    className="w-full text-left px-3 py-3 rounded-xl hover:bg-[#1e1e1e] text-white text-[15px] font-medium border-b border-[#2e2e2e]/60 flex items-center gap-2">
                    {value === r.id && <Check className="w-4 h-4 text-[#ff6b00] shrink-0" />}
                    <span className="flex-1">{recipeTitle(r, lang)}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
