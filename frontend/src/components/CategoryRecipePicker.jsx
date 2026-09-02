import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { CATS, recipeCategory } from "@/lib/recipeCats";
import { recipeTitle } from "@/lib/loc";
import { useLang } from "@/i18n/LanguageContext";
import { getFavs } from "@/lib/favorites";
import { getRecents, pushRecents } from "@/lib/recentRecipes";
import { ChevronDown, ChevronLeft, X, Search, Check, ChefHat, Plus, Heart, Clock } from "lucide-react";

// Foto categorie (stile MikiLab, fondo scuro + luce arancione).
const CAT_IMAGES = {
  basi: "/cats/basi.jpg",
  viennoiserie: "/cats/viennoiserie.jpg",
  pane: "/cats/pane.jpg",
  focacce: "/cats/focacce.jpg",
  snack: "/cats/snack.jpg",
};
const DAYS = ["", "lun", "mar", "mer", "gio", "ven", "sab", "dom"];

// Selettore ricetta a CATEGORIE: sostituisce il lungo <select>.
// - Modalità SINGOLA (default): value + onChange({target:{value:id}}) → seleziona e chiude.
// - Modalità MULTI (multi): spunti PIÙ ricette (✓); con quickAdd imposti pezzi/giorno inline;
//   "Aggiungi (N)" → onAddMany([{id, qty, day}, ...]).
// Extra: fila "usate di recente" e pseudo-categoria "Preferite" (cuore) in cima.
export default function CategoryRecipePicker({ recipes, value, onChange, onAddMany, multi = false, compact = false, quickAdd = null, selectedIds = [], placeholder, triggerLabel, testid = "recipe-picker" }) {
  const { t, lang } = useLang();
  const [open, setOpen] = useState(false);
  const [cat, setCat] = useState(null);
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState(() => new Map());
  const [favIds, setFavIds] = useState(() => new Set());
  const [recentIds, setRecentIds] = useState([]);
  const list = recipes || [];
  const inPlan = useMemo(() => new Set(selectedIds), [selectedIds]);

  useEffect(() => {
    if (open) { setPicked(new Map()); setFavIds(getFavs()); setRecentIds(getRecents()); }
  }, [open]);

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

  const favRecipes = useMemo(() => list.filter((r) => favIds.has(r.id)).sort((a, b) => recipeTitle(a, lang).localeCompare(recipeTitle(b, lang))), [list, favIds, lang]);
  const recentRecipes = useMemo(() => recentIds.map((id) => list.find((r) => r.id === id)).filter(Boolean).slice(0, 8), [recentIds, list]);

  const searchHits = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return list.filter((r) => recipeTitle(r, lang).toLowerCase().includes(s)).slice(0, 40);
  }, [q, list, lang]);

  const close = () => { setOpen(false); setCat(null); setQ(""); };
  const pickSingle = (id) => { pushRecents([id]); onChange({ target: { value: id } }); close(); };
  const toggle = (id) => setPicked((m) => {
    const n = new Map(m);
    if (n.has(id)) n.delete(id); else n.set(id, { qty: quickAdd?.defaultQty ?? "", day: "" });
    return n;
  });
  const setMeta = (id, patch) => setPicked((m) => { const n = new Map(m); if (n.has(id)) n.set(id, { ...n.get(id), ...patch }); return n; });
  const confirmMulti = () => {
    if (picked.size && onAddMany) {
      const arr = [...picked.entries()].map(([id, meta]) => ({ id, qty: meta.qty, day: meta.day }));
      pushRecents(arr.map((x) => x.id));
      onAddMany(arr);
    }
    close();
  };

  const catObj = cat === "__fav__" ? { icon: "❤", label: null } : CATS.find((c) => c.key === cat);
  const items = cat === "__fav__" ? favRecipes : cat ? byCat[cat] : [];

  const RecipeRow = (r) => {
    const isPicked = picked.has(r.id);
    const already = inPlan.has(r.id);
    const meta = picked.get(r.id) || {};
    return (
      <div key={r.id} className={`rounded-2xl shadow-md border border-amber-900/40 border-b border-[#2e2e2e]/60 ${isPicked ? "bg-[#ff6b00]/10" : ""}`}>
        <button type="button" data-testid={`${testid}-item-${r.id}`}
          onClick={() => (multi ? toggle(r.id) : pickSingle(r.id))}
          className={`w-full text-left px-3 py-3 rounded-2xl shadow-md border border-amber-900/40 text-white text-[15px] font-medium flex items-center gap-2.5 transition-colors ${isPicked ? "" : "hover:bg-[#1e1e1e]"}`}>
          {multi ? (
            <span className={`w-5 h-5 rounded-md border-2 shrink-0 flex items-center justify-center ${isPicked ? "bg-[#ff6b00] border-[#ff6b00]" : already ? "border-[#ff6b00]/50 bg-[#ff6b00]/10" : "border-[#4a5560]"}`}>
              {isPicked && <Check className="w-3.5 h-3.5 text-white" />}
            </span>
          ) : value === r.id ? <Check className="w-4 h-4 text-[#ff6b00] shrink-0" /> : null}
          <span className="flex-1 truncate">{recipeTitle(r, lang)}</span>
          {multi && already && !isPicked && (
            <span className="text-[10px] text-[#ff6b00] font-semibold shrink-0">{lang === "de" ? "im Plan" : lang === "en" ? "in plan" : "nel piano"}</span>
          )}
        </button>
        {multi && quickAdd && isPicked && (
          <div className="flex items-center gap-2 px-3 pb-3" data-testid={`${testid}-quick-${r.id}`}>
            <div className="relative">
              <input type="number" data-testid={`${testid}-qty-${r.id}`} value={meta.qty ?? ""} placeholder={quickAdd.qtyLabel || (lang === "de" ? "Menge" : lang === "en" ? "Qty" : "Qtà")}
                onChange={(e) => setMeta(r.id, { qty: e.target.value })}
                className="w-24 bg-[#1e1e1e] border border-[#2e2e2e] rounded-lg py-1.5 pl-2.5 pr-8 text-sm text-white outline-none focus:border-[#ff6b00] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[#7E8A93]">{quickAdd.qtyLabel || (lang === "de" ? "St." : lang === "en" ? "pcs" : "pz")}</span>
            </div>
            {quickAdd.day && (
              <select data-testid={`${testid}-day-${r.id}`} value={meta.day ?? ""} onChange={(e) => setMeta(r.id, { day: e.target.value })}
                className="flex-1 min-w-0 bg-[#1e1e1e] border border-[#2e2e2e] rounded-lg py-1.5 px-2 text-sm text-white outline-none focus:border-[#ff6b00]">
                {DAYS.map((d) => <option key={d} value={d}>{d === "" ? t("capo_day_any") : t(`day_${d}`)}</option>)}
              </select>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {multi ? (
        compact ? (
          <button type="button" data-testid={`${testid}-trigger`} onClick={() => setOpen(true)}
            className="flex items-center gap-1 text-sm font-medium text-[#ff6b00] active:scale-95 transition-all">
            <Plus className="w-4 h-4" /> {triggerLabel || t("weekly_add")}
          </button>
        ) : (
          <button type="button" data-testid={`${testid}-trigger`} onClick={() => setOpen(true)}
            className="w-full flex items-center justify-center gap-1.5 bg-[#ff6b00] hover:bg-[#ff8a33] text-white text-sm font-semibold py-2.5 rounded-2xl shadow-md border border-amber-900/40 active:scale-98 transition-all">
            <ChefHat className="w-4 h-4" /> {triggerLabel || (lang === "de" ? "Rezepte hinzufügen" : lang === "en" ? "Add recipes" : "Aggiungi ricette")}
          </button>
        )
      ) : (
        <button type="button" data-testid={`${testid}-trigger`} onClick={() => setOpen(true)}
          className="w-full appearance-none bg-white dark:bg-[#1e1e1e] border border-[#2e2e2e] rounded-2xl shadow-md border border-amber-900/40 py-2.5 pl-3 pr-9 text-sm font-medium text-[#2B303B] dark:text-white outline-none focus:border-[#ff6b00] transition-all text-left relative">
          <span className={`block truncate pr-1 ${selected ? "" : "text-[#7E8A93]"}`}>{selected ? recipeTitle(selected, lang) : (placeholder || t("capo_pick_recipe"))}</span>
          <ChevronDown className="w-4 h-4 text-[#ff6b00] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </button>
      )}

      {open && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center" data-testid={`${testid}-modal`}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={close} />
          <div className="relative w-full sm:max-w-md bg-[#161616] border-t sm:border border-[#2e2e2e] rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex items-center gap-2 p-4 border-b border-[#2e2e2e] shrink-0">
              {cat ? (
                <button data-testid={`${testid}-back`} onClick={() => setCat(null)} className="p-1 text-[#ff6b00]"><ChevronLeft className="w-6 h-6" /></button>
              ) : null}
              <h3 className="font-display text-lg font-extrabold text-white flex-1 truncate">
                {cat === "__fav__" ? `❤ ${lang === "de" ? "Favoriten" : lang === "en" ? "Favorites" : "Preferite"}`
                  : cat ? `${catObj?.icon || ""} ${t(catObj?.label)}`
                  : (multi ? (triggerLabel || (lang === "de" ? "Rezepte hinzufügen" : lang === "en" ? "Add recipes" : "Aggiungi ricette")) : t("capo_pick_recipe"))}
              </h3>
              <button data-testid={`${testid}-close`} onClick={close} className="p-1 text-[#7E8A93] hover:text-white"><X className="w-6 h-6" /></button>
            </div>

            {!cat && (
              <div className="p-3 border-b border-[#2e2e2e] shrink-0 relative">
                <Search className="w-4 h-4 text-[#7E8A93] absolute left-6 top-1/2 -translate-y-1/2" />
                <input data-testid={`${testid}-search`} value={q} onChange={(e) => setQ(e.target.value)} placeholder={lang === "de" ? "Suchen…" : lang === "en" ? "Search…" : "Cerca…"}
                  className="w-full bg-[#1e1e1e] border border-[#2e2e2e] rounded-2xl shadow-md border border-amber-900/40 py-2.5 pl-10 pr-3 text-sm text-white outline-none focus:border-[#ff6b00]" />
              </div>
            )}

            <div className="overflow-y-auto p-3 flex-1">
              {q.trim() ? (
                searchHits.length ? searchHits.map((r) => RecipeRow(r))
                  : <p className="text-center text-[#7E8A93] py-6 text-sm">{lang === "de" ? "Kein Ergebnis" : lang === "en" ? "No results" : "Nessun risultato"}</p>
              ) : !cat ? (
                list.length === 0 ? (
                  <p className="text-center text-[#7E8A93] py-10 px-4 text-sm leading-relaxed">
                    {lang === "de" ? "Noch keine Rezepte verfügbar. Füge deine Rezepte hinzu oder schalte die MikiLab-Rezepte frei."
                      : lang === "en" ? "No recipes available yet. Add your own recipes or unlock the MikiLab recipes."
                      : "Nessuna ricetta disponibile. Aggiungi le tue ricette o sblocca le ricette MikiLab."}
                  </p>
                ) : (
                <>
                  {recentRecipes.length > 0 && (
                    <div className="mb-3" data-testid={`${testid}-recent-row`}>
                      <p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-[#7E8A93] mb-1.5"><Clock className="w-3.5 h-3.5" /> {lang === "de" ? "Kürzlich verwendet" : lang === "en" ? "Recently used" : "Usate di recente"}</p>
                      <div className="flex gap-1.5 overflow-x-auto pb-1">
                        {recentRecipes.map((r) => {
                          const isPicked = picked.has(r.id);
                          return (
                            <button key={r.id} type="button" data-testid={`${testid}-recent-${r.id}`}
                              onClick={() => (multi ? toggle(r.id) : pickSingle(r.id))}
                              className={`shrink-0 flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-full border transition-all ${isPicked ? "bg-[#ff6b00] text-white border-[#ff6b00]" : "bg-[#1e1e1e] text-[#e4eff8] border-[#2e2e2e] hover:border-[#ff6b00]"}`}>
                              {isPicked && <Check className="w-3 h-3" />} <span className="max-w-[130px] truncate">{recipeTitle(r, lang)}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2.5">
                    {favRecipes.length > 0 && (
                      <button data-testid={`${testid}-cat-favs`} onClick={() => setCat("__fav__")}
                        className="group relative overflow-hidden rounded-2xl border border-[#ff6b00]/40 hover:border-[#ff6b00] active:scale-97 transition-all text-left min-h-[112px] flex flex-col justify-end bg-gradient-to-br from-[#ff6b00]/30 via-[#3a1a10] to-[#161616]">
                        <div className="relative p-3">
                          <Heart className="w-6 h-6 text-[#ff6b00] fill-[#ff6b00] mb-0.5" />
                          <span className="font-display text-[15px] font-bold text-white leading-tight block">{lang === "de" ? "Favoriten" : lang === "en" ? "Favorites" : "Preferite"}</span>
                          <span className="text-[11px] text-[#ff8a33] font-semibold">{favRecipes.length} {favRecipes.length === 1 ? (lang === "de" ? "Rezept" : lang === "en" ? "recipe" : "ricetta") : (lang === "de" ? "Rezepte" : lang === "en" ? "recipes" : "ricette")}</span>
                        </div>
                      </button>
                    )}
                    {CATS.filter((c) => byCat[c.key].length > 0).map((c) => (
                      <button key={c.key} data-testid={`${testid}-cat-${c.key}`} onClick={() => setCat(c.key)}
                        className="group relative overflow-hidden rounded-2xl border border-[#ff6b00]/30 hover:border-[#ff6b00] active:scale-97 transition-all text-left min-h-[112px] flex flex-col justify-end">
                        <img src={CAT_IMAGES[c.key]} alt={t(c.label)} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />
                        <div className="relative p-3">
                          <span className="text-xl block leading-none mb-0.5">{c.icon}</span>
                          <span className="font-display text-[15px] font-bold text-white leading-tight block">{t(c.label)}</span>
                          <span className="text-[11px] text-[#ff8a33] font-semibold">{byCat[c.key].length} {byCat[c.key].length === 1 ? (lang === "de" ? "Rezept" : lang === "en" ? "recipe" : "ricetta") : (lang === "de" ? "Rezepte" : lang === "en" ? "recipes" : "ricette")}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
                )
              ) : (
                items.map((r) => RecipeRow(r))
              )}
            </div>

            {multi && (
              <div className="p-3 border-t border-[#2e2e2e] shrink-0">
                <button data-testid={`${testid}-done`} onClick={confirmMulti} disabled={picked.size === 0}
                  className="w-full flex items-center justify-center gap-1.5 bg-[#ff6b00] disabled:opacity-40 text-white font-semibold py-2.5 rounded-2xl shadow-md border border-amber-900/40 active:scale-98 transition-all">
                  <Plus className="w-4 h-4" /> {lang === "de" ? "Hinzufügen" : lang === "en" ? "Add" : "Aggiungi"} ({picked.size})
                </button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
