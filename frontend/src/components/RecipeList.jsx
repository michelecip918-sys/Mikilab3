import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Wheat, Droplets, Clock, Copy, Scale, Flame, Layers, MoreHorizontal, Lock, Crown, Search, ChevronDown, X, Share2, ChefHat, Volume2, Printer } from "lucide-react";
import { recipesApi, subscriptionApi, recipePurchaseApi } from "@/lib/api";
import RecipeDialog from "@/components/RecipeDialog";
import ScaleDialog from "@/components/ScaleDialog";
import FlourTable from "@/components/FlourTable";
import PrintHeader from "@/components/PrintHeader";
import { playTTS } from "@/lib/tts";
import { addXP } from "@/lib/level";
import { TattooSignature } from "@/components/TattooSignature";
import { useLang } from "@/i18n/LanguageContext";
import { useAuth } from "@/auth/AuthContext";
import { rLoc, ingLoc } from "@/lib/loc";
import { useBackClose } from "@/lib/backNav";
import { flagEmoji, countryColors, countryName } from "@/lib/countries";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function RecipeList({ collectionName, heroImage, heroTitle, heroSubtitle, emptyText, readOnly = false, heroPosition, extraHeader }) {
  const [scale, setScale] = useState({});
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [scaling, setScaling] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [unlockRecipe, setUnlockRecipe] = useState(null);
  const [query, setQuery] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [baseFilter, setBaseFilter] = useState("all");
  const [openCats, setOpenCats] = useState({});
  const { t, lang, setLang } = useLang();
  useBackClose(!!viewing, () => setViewing(null));
  useBackClose(dialogOpen, () => setDialogOpen(false));
  useBackClose(!!scaling, () => setScaling(null));
  const triM = (i_, d_, e_) => (lang === "de" ? d_ : lang === "en" ? e_ : i_);
  const { user, setAuthOpen } = useAuth();
  // Mikilab: modifica solo admin. Personali: UI sempre visibile, il SALVATAGGIO richiede login.
  const canEdit = collectionName === "mikilab" ? user?.role === "admin" : true;

  const load = async () => {
    setLoading(true);
    try {
      const list = await recipesApi.list(collectionName);
      list.sort((a, b) => {
        const ca = recipeCategory(a), cb = recipeCategory(b);
        if (ca.rank !== cb.rank) return ca.rank - cb.rank;
        if (ca.sub !== cb.sub) return ca.sub - cb.sub;
        return (a.name || "").localeCompare(b.name || "");
      });
      setRecipes(list);
    } catch (e) {
      // ricette personali senza login → lista vuota (nessun errore)
      if (collectionName !== "mikilab" && e?.response?.status === 401) setRecipes([]);
      else toast.error(t("toast_load_error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [collectionName]);

  // tiene aggiornata la ricetta aperta dopo un salvataggio/scala
  useEffect(() => {
    if (viewing) {
      const fresh = recipes.find((x) => x.id === viewing.id);
      if (fresh && fresh !== viewing) setViewing(fresh);
    }
    /* eslint-disable-next-line */
  }, [recipes]);

  const handleSave = async (payload) => {
    if (!user) {
      setAuthOpen(true);
      toast.info(t("gate_save_login"));
      return;
    }
    try {
      if (editing) {
        await recipesApi.update(editing.id, payload);
        toast.success(t("toast_recipe_updated"));
      } else {
        await recipesApi.create({ ...payload, collection_name: collectionName });
        addXP(2);
        toast.success(t("toast_recipe_added"));
      }
      setDialogOpen(false);
      setEditing(null);
      load();
    } catch {
      toast.error(t("toast_save_error"));
    }
  };

  const handleDelete = async () => {
    try {
      await recipesApi.remove(toDelete.id);
      toast.success(t("toast_recipe_deleted"));
      setToDelete(null);
      setViewing(null);
      load();
    } catch {
      toast.error(t("toast_delete_error"));
    }
  };

  const handleDuplicate = async (r) => {
    try {
      const { id, created_at, updated_at, ...rest } = r;
      await recipesApi.create({ ...rest, collection_name: collectionName, name: `${r.name} (${t("copy_suffix")})` });
      toast.success(t("toast_recipe_duplicated"));
      load();
    } catch {
      toast.error(t("toast_dup_error"));
    }
  };

  const handleScaleSave = async (payload) => {
    try {
      await recipesApi.create({ ...payload, collection_name: collectionName });
      toast.success(t("toast_recipe_scaled"));
      setScaling(null);
      load();
    } catch {
      toast.error(t("toast_save_error"));
    }
  };

  const openImprover = () => {
    const target = recipes.find((x) => /migliorator|backmittel/i.test(x.name || ""));
    if (target) setViewing(target);
  };

  // "Assaggio": apre le opzioni di acquisto (singola / panettoni / tutte) o abbonamento.
  const handleUnlock = () => {
    if (!user) { setAuthOpen(true); toast.info(t("gate_save_login")); return; }
    setUnlockRecipe(viewing);
  };

  const isViewingPanettone = unlockRecipe ? recipeCategory(unlockRecipe).key === "panettoni" : false;

  const buyRecipe = async (kind) => {
    if (!user) { setAuthOpen(true); return; }
    try {
      const d = await recipePurchaseApi.checkout(kind, unlockRecipe?.id);
      if (d.url) window.location.href = d.url;
    } catch { toast.error(t("toast_load_error")); }
  };

  const subscribePro = async () => {
    try {
      const d = await subscriptionApi.checkout("monthly", "lab");
      if (d.url) window.location.href = d.url;
    } catch { toast.error(t("toast_load_error")); }
  };

  return (
    <div className="pb-28">
      <div className="relative rounded-3xl overflow-hidden mb-5 h-40">
        <img src={heroImage} alt="" className="w-full h-full object-cover" style={heroPosition ? { objectPosition: heroPosition } : undefined} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1E1B18]/85 via-[#1E1B18]/30 to-transparent" />
        <div className="it-de-ribbon absolute top-0 left-0 right-0 z-10" />
        <div className="absolute bottom-0 left-0 p-5">
          <h1 className="font-display text-3xl font-bold text-white">{heroTitle}</h1>
          <div className="h-1 w-12 rounded-full bg-[#C88A2B] mt-1.5 mb-0.5" />
          {heroSubtitle ? <p className="text-white/85 text-sm mt-1">{heroSubtitle}</p> : null}
        </div>
      </div>

      {extraHeader ? (
        <div className="mb-5 rounded-2xl bg-white dark:bg-[#232A31] border border-[#D7E1DB] dark:border-[#38424B] p-4">
          {extraHeader}
        </div>
      ) : null}

      <FlourTable />

      {canEdit && (
        <button
          data-testid="add-recipe-btn"
          onClick={() => { setEditing(null); setDialogOpen(true); }}
          className="w-full bg-[#5E8B7E] hover:bg-[#4C7368] text-white font-semibold px-5 py-3.5 rounded-2xl shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 mb-5"
        >
          <Plus className="w-5 h-5" /> {t("add_recipe")}
        </button>
      )}

      {loading ? (
        <p className="text-center text-[#7E8A93] py-8">{t("loading")}</p>
      ) : recipes.length === 0 ? (
        <div className="text-center py-12 px-6 border-2 border-dashed border-[#D7E1DB] dark:border-[#38424B] rounded-3xl">
          <Wheat className="w-10 h-10 text-[#6E8CA0] mx-auto mb-3" />
          <p className="text-[#6B7680] dark:text-[#9AA6AE]">{emptyText}</p>
        </div>
      ) : (() => {
        const q = query.trim().toLowerCase();
        const matches = (r) => {
          if (catFilter !== "all" && recipeCategory(r).key !== catFilter) return false;
          if (baseFilter !== "all" && !recipeBase(r).includes(baseFilter)) return false;
          if (!q) return true;
          const hay = [rLoc(r, "name", lang), rLoc(r, "real_name", lang), rLoc(r, "flour_type", lang), r.notes || "", recipeBadges(r).join(" ")].join(" ").toLowerCase();
          return hay.includes(q);
        };
        const filtered = recipes.filter(matches);
        const baseChips = ["all", ...BASE_KEYS];
        const CATS = [
          { key: "basi", label: "cat_basi", icon: "✨" },
          { key: "pane", label: "cat_pane", icon: "🍞" },
          { key: "panini", label: "cat_panini", icon: "🥖" },
          { key: "snack", label: "cat_snack", icon: "🥨" },
          { key: "focacce", label: "cat_focacce", icon: "🫓" },
          { key: "panettoni", label: "cat_panettoni", icon: "🎁" },
        ];
        const isMikilab = collectionName === "mikilab";

        const Card = (r, i) => (
          <motion.button
            key={r.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.015, 0.2) }}
            onClick={() => setViewing(r)}
            data-testid={`recipe-row-${r.id}`}
            className="relative overflow-hidden text-left bg-white dark:bg-[#232A31] border border-[#D7E1DB] dark:border-[#38424B] rounded-2xl shadow-sm active:scale-[0.98] hover:border-[#6E8CA0]/60 transition-all flex flex-col"
          >
            {/* strisciolina tricolore del Paese d'origine */}
            {countryColors(r.origin) && (
              <div aria-hidden className="absolute top-0 left-0 right-0 z-10 flex h-1.5">
                {countryColors(r.origin).map((c, k) => <div key={k} className="flex-1" style={{ background: c }} />)}
              </div>
            )}
            {/* foto vetrina */}
            <div className="relative w-full aspect-[4/3] bg-[#EAF0EC] dark:bg-[#1F252B]">
              <div className="absolute inset-0 flex items-center justify-center"><ChefHat className="w-9 h-9 text-[#B34A26]/40" /></div>
              {r.image_url && (
                <img src={r.image_url} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.display = "none"; }} className="relative z-[1] w-full h-full object-cover" />
              )}
              {r.origin && flagEmoji(r.origin) && (
                <span title={countryName(r.origin)} className="absolute top-2.5 right-2 text-xl drop-shadow-md">{flagEmoji(r.origin)}</span>
              )}
              {r.locked && (
                <span className="absolute bottom-2 right-2 bg-white/90 dark:bg-[#232A31]/90 rounded-full p-1.5 shadow">
                  <Lock data-testid={`recipe-locked-${r.id}`} className="w-3.5 h-3.5 text-[#6E8CA0]" />
                </span>
              )}
            </div>
            {/* testo */}
            <div className="p-3 min-w-0 flex-1">
              <h3 className="font-display text-sm font-semibold text-[#2B303B] dark:text-[#EAF0EC] leading-tight line-clamp-2">
                {rLoc(r, "name", lang)}
              </h3>
              {rLoc(r, "real_name", lang) ? <p className="text-[11px] font-medium text-[#5E8B7E] truncate mt-0.5">{rLoc(r, "real_name", lang)}</p> : null}
              {rLoc(r, "flour_type", lang) ? <p className="text-[10px] text-[#7E8A93] truncate mt-0.5">{(lang === "de" ? "Mehl: " : lang === "en" ? "Flour: " : "Farina: ")}{rLoc(r, "flour_type", lang)}</p> : null}
            </div>
          </motion.button>
        );

        return (
          <div>
            {/* Barra di ricerca */}
            <div className="relative mb-3">
              <Search className="w-4 h-4 text-[#7E8A93] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                data-testid="recipe-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={triM("Cerca ricetta, farina, badge…", "Rezept, Mehl, Badge suchen…", "Search recipe, flour, badge…")}
                className="w-full pl-9 pr-9 py-2.5 rounded-2xl bg-white dark:bg-[#232A31] border border-[#D7E1DB] dark:border-[#38424B] text-sm text-[#2B303B] dark:text-[#EAF0EC] outline-none focus:border-[#6E8CA0]"
              />
              {query && (
                <button data-testid="recipe-search-clear" onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7E8A93]" aria-label="clear">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filtro per Base / prefermento */}
            {baseChips.length > 1 && (
              <div data-testid="recipe-base-filters" className="flex gap-2 overflow-x-auto pb-2 mb-3 -mx-1 px-1 scrollbar-none">
                {baseChips.map((b) => (
                  <button key={b} data-testid={`base-filter-${b}`} onClick={() => setBaseFilter(b)}
                    className={`shrink-0 text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-all active:scale-97 ${
                      baseFilter === b
                        ? "bg-[#5E8B7E] text-white border-[#5E8B7E] shadow-sm"
                        : "bg-white dark:bg-[#232A31] text-[#5E8B7E] border-[#D7E1DB] dark:border-[#38424B] hover:border-[#5E8B7E]/60"}`}>
                    {baseLabel(b, lang)}
                  </button>
                ))}
              </div>
            )}

            {filtered.length === 0 ? (
              <p className="text-center text-[#7E8A93] py-8 text-sm" data-testid="recipe-no-results">
                {triM("Nessuna ricetta trovata.", "Kein Rezept gefunden.", "No recipe found.")}
              </p>
            ) : !isMikilab ? (
              <div className="grid grid-cols-2 gap-3">{filtered.map((r, i) => Card(r, i))}</div>
            ) : (
              <div className="space-y-6">
                {CATS.map((cat) => {
                  const items = filtered.filter((r) => recipeCategory(r).key === cat.key);
                  if (items.length === 0) return null;
                  return (
                    <div key={cat.key} data-testid={`cat-section-${cat.key}`}>
                      <div className="flex items-center gap-2 mb-2.5 px-1">
                        <span className="text-lg">{cat.icon}</span>
                        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-[#5E8B7E] flex-1">{t(cat.label)}</h2>
                        <span className="text-xs font-mono-data text-[#7E8A93]">{items.length}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {items.map((r, i) => Card(r, i))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* Finestra ricetta */}
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-lg max-h-[88vh] overflow-y-auto bg-[#F6F8F5] dark:bg-[#1B2127] border-[#D7E1DB] dark:border-[#38424B] p-0">
          <DialogTitle className="sr-only">{viewing?.name || t("recipe_ingredients")}</DialogTitle>
          <DialogDescription className="sr-only">{t("recipe_dialog_desc")}</DialogDescription>
          <div className="sticky top-0 z-10 flex justify-end gap-1 px-4 pt-3 pb-2 bg-[#F6F8F5]/95 dark:bg-[#1B2127]/95 backdrop-blur">
            {["it", "de", "en"].map((lc) => (
              <button key={lc} data-testid={`recipe-lang-${lc}`} onClick={() => setLang(lc)}
                className={`text-[11px] font-bold uppercase px-2.5 py-1 rounded-lg border transition-all ${lang === lc ? "bg-[#5E8B7E] text-white border-[#5E8B7E]" : "bg-white dark:bg-[#232A31] text-[#7E8A93] border-[#D7E1DB] dark:border-[#38424B]"}`}>
                {lc}
              </button>
            ))}
          </div>
          {viewing && (
            <RecipeDetail
              r={viewing}
              t={t}
              readOnly={readOnly}
              canEdit={canEdit}
              scaleVal={scale[viewing.id]}
              onScaleChange={(v) => setScale((s) => ({ ...s, [viewing.id]: v }))}
              onImprover={openImprover}
              onUnlock={handleUnlock}
              onEdit={() => { setEditing(viewing); setDialogOpen(true); setViewing(null); }}
              onDuplicate={() => handleDuplicate(viewing)}
              onScaleAction={() => setScaling(viewing)}
              onDelete={() => setToDelete(viewing)}
            />
          )}
        </DialogContent>
      </Dialog>

      <RecipeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing}
        onSave={handleSave}
      />

      {/* Acquisto singolo ricette (pay-per-item) */}
      <Dialog open={!!unlockRecipe} onOpenChange={(o) => !o && setUnlockRecipe(null)}>
        <DialogContent className="bg-[#F6F8F5] dark:bg-[#1B2127] border-[#D7E1DB] dark:border-[#38424B] max-w-md">
          <DialogTitle className="font-display text-xl">{triM("Sblocca la ricetta", "Rezept freischalten", "Unlock the recipe")}</DialogTitle>
          <DialogDescription className="text-[#7E8A93]">
            {triM("Scegli come sbloccare la ricetta completa (procedimento, dosi e fasi).", "Wähle, wie du das vollständige Rezept freischaltest.", "Choose how to unlock the full recipe.")}
          </DialogDescription>
          <div className="space-y-2.5 mt-1">
            <button data-testid="buy-single" onClick={() => buyRecipe("single")}
              className="w-full flex items-center justify-between bg-white dark:bg-[#232A31] border-2 border-[#5E8B7E] rounded-2xl px-4 py-3 active:scale-98 transition-all">
              <span className="text-left">
                <span className="block font-semibold text-[#2B303B] dark:text-[#EAF0EC]">{triM("Questa ricetta", "Dieses Rezept", "This recipe")}</span>
                <span className="block text-xs text-[#7E8A93]">{triM("Accesso a vita a questa ricetta", "Lebenslanger Zugang zu diesem Rezept", "Lifetime access to this recipe")}</span>
              </span>
              <span className="font-display text-lg font-bold text-[#5E8B7E]">€4,99</span>
            </button>

            {isViewingPanettone && (
              <button data-testid="buy-panettoni" onClick={() => buyRecipe("panettoni")}
                className="w-full flex items-center justify-between bg-[#6E8CA0]/10 border-2 border-[#6E8CA0] rounded-2xl px-4 py-3 active:scale-98 transition-all">
                <span className="text-left">
                  <span className="block font-semibold text-[#2B303B] dark:text-[#EAF0EC]">{triM("Tutti i Panettoni", "Alle Panettone", "All Panettoni")}</span>
                  <span className="block text-xs text-[#7E8A93]">{triM("Tutti i gusti di panettone MikiLab", "Alle MikiLab-Panettone-Sorten", "All MikiLab panettone flavours")}</span>
                </span>
                <span className="font-display text-lg font-bold text-[#6E8CA0]">€29,99</span>
              </button>
            )}

            <button data-testid="buy-all" onClick={() => buyRecipe("all")}
              className="w-full flex items-center justify-between bg-gradient-to-br from-[#5E8B7E] to-[#33564E] text-white rounded-2xl px-4 py-3 active:scale-98 transition-all">
              <span className="text-left">
                <span className="block font-semibold">{triM("Tutte le ricette", "Alle Rezepte", "All recipes")}</span>
                <span className="block text-xs text-white/80">{triM("Ricettario MikiLab completo, per sempre", "Komplettes MikiLab-Rezeptbuch, für immer", "Complete MikiLab recipe book, forever")}</span>
              </span>
              <span className="font-display text-lg font-bold">€149</span>
            </button>

            <div className="pt-1 text-center">
              <button data-testid="buy-subscribe-pro" onClick={subscribePro}
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#5E8B7E] hover:underline">
                <Crown className="w-4 h-4" /> {triM("oppure abbonati PRO · €29,99/mese", "oder PRO abonnieren · €29,99/Monat", "or subscribe PRO · €29.99/month")}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ScaleDialog
        recipe={scaling}
        open={!!scaling}
        onOpenChange={(o) => !o && setScaling(null)}
        onSave={handleScaleSave}
      />

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent className="bg-[#F6F8F5] dark:bg-[#1B2127] border-[#D7E1DB] dark:border-[#38424B]">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">{t("delete_recipe_q")}</AlertDialogTitle>
            <AlertDialogDescription>
              "{toDelete?.name}" {t("delete_recipe_desc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="delete-cancel-btn">{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              data-testid="delete-confirm-btn"
              onClick={handleDelete}
              className="bg-[#C0574D] hover:bg-[#4C7368]"
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function RecipeDetail({ r, t, readOnly, canEdit, scaleVal, onScaleChange, onImprover, onUnlock, onEdit, onDuplicate, onScaleAction, onDelete }) {
  const { lang } = useLang();
  const de = lang === "de";
  const tri = (i_, d_, e_) => (de ? d_ : lang === "en" ? e_ : i_);
  const isPanettone = recipeCategory(r).key === "panettoni";
  const [farro, setFarro] = useState(false);
  useEffect(() => { setFarro(false); /* eslint-disable-next-line */ }, [r.id]);
  const flourG = Number(r.flour_grams) || 0;
  const target = flourG > 0 ? (Number(scaleVal) || flourG) : 0;
  const f = flourG > 0 ? target / flourG : 1;
  const g = (v) => (v == null ? null : Math.round(Number(v) * f));
  // In modalità farro l'idratazione dell'impasto principale è ridotta ~4%.
  const gWater = (v) => { const b = g(v); return b == null ? null : (farro ? Math.round(b * 0.96) : b); };
  const pct = (v) => (flourG > 0 && v != null ? ` · ${Math.round((Number(v) / flourG) * 1000) / 10}%` : "");
  const biga = (!r.locked && r.preferment_type === "biga" && r.biga) ? r.biga : null;
  const bFlour = biga ? Math.round((Number(biga.flour_g) || 0) * f) : 0;
  const bWater = biga ? Math.round((Number(biga.water_g) || 0) * f) : 0;
  const bYeast = biga ? Math.round((Number(biga.yeast_g) || 0) * f) : 0;
  const rows = [];
  if (r.flour_grams != null) rows.push([t("ing_flour"), `${g(r.flour_grams) - bFlour} g${pct(Number(r.flour_grams) - (biga ? Number(biga.flour_g) || 0 : 0))}`]);
  if (r.water_grams != null) rows.push([t("ing_water"), `${gWater(r.water_grams) - bWater} g${pct((farro ? Number(r.water_grams) * 0.96 : Number(r.water_grams)) - (biga ? Number(biga.water_g) || 0 : 0))}`]);
  if (r.sourdough_grams) rows.push([`${t("ing_preferment")}${r.preferment_type && r.preferment_type !== "none" ? ` (${t(`pf_${r.preferment_type}`)})` : ""}`, `${g(r.sourdough_grams)} g${pct(r.sourdough_grams)}`]);
  if (r.salt_grams != null) rows.push([t("ing_salt"), `${g(r.salt_grams)} g${pct(r.salt_grams)}`]);
  (r.extra_ingredients || []).forEach((e) => {
    if (e && e.name && e.percent != null && e.percent !== "") {
      if (biga && /lievito di birra|hefe/i.test(e.name)) return; // il lievito è nel Vorteig
      const grams = flourG > 0 ? Math.round(target * (Number(e.percent) / 100)) : null;
      rows.push([ingLoc(e.name, lang), grams != null ? `${grams} g · ${e.percent}%` : `${e.percent}%`]);
    }
  });
  (r.costing?.extras || []).forEach((e) => { if (e.name) rows.push([ingLoc(e.name, lang), e.cost ? `€ ${e.cost}` : "—"]); });

  const cst = r.costing;
  const n = (v) => Number(v) || 0;
  const [pieces, setPieces] = useState("");
  useEffect(() => { setPieces(cst?.pieces != null ? String(cst.pieces) : ""); /* eslint-disable-next-line */ }, [r.id]);
  let priceBlock = null;
  if (cst && !isPanettone) {
    const cFlour = n(g(r.flour_grams)) / 1000 * n(cst.flour_kg);
    const cWater = n(g(r.water_grams)) / 1000 * n(cst.water_l);
    const cSour = n(g(r.sourdough_grams)) / 1000 * n(cst.sourdough_kg);
    const cSalt = n(g(r.salt_grams)) / 1000 * n(cst.salt_kg);
    const overhead = n(cst.overhead);
    const br = [];
    if (cFlour > 0) br.push([t("ing_flour"), cFlour]);
    if (cWater > 0) br.push([t("ing_water"), cWater]);
    if (cSour > 0) br.push([t("ing_preferment"), cSour]);
    if (cSalt > 0) br.push([t("ing_salt"), cSalt]);
    (cst.extras || []).forEach((e) => { if (e.name && n(e.cost) > 0) br.push([e.name, n(e.cost)]); });
    if (overhead > 0) br.push([t("cost_overhead"), overhead]);
    const total = br.reduce((s, [, v]) => s + v, 0);
    const pcs = n(pieces);
    const perPiece = pcs > 0 ? total / pcs : null;
    if (total > 0) {
      priceBlock = (
        <div data-testid={`recipe-cost-${r.id}`} className="rounded-xl px-3 py-3 border bg-[#6E8CA0]/10 border-[#6E8CA0]/30">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#33564E] dark:text-[#8FB0C2] mb-2">{t("cost_breakdown")}</p>
          <div className="space-y-1 mb-2">
            {br.map(([label, val], idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <span className="text-[#3F4A54] dark:text-[#AEB8BF]">{label}</span>
                <span className="font-mono-data text-[#33564E] dark:text-[#8FB0C2]">€ {val.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-[#D7E1DB]/60 dark:border-[#38424B]">
            <span className="text-xs font-semibold text-[#3F4A54] dark:text-[#AEB8BF]">{t("cost_total")}</span>
            <span className="font-mono-data text-sm font-bold text-[#33564E] dark:text-[#8FB0C2]">€ {total.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-[#7E8A93]">{t("cost_pieces")}</span>
            <div className="flex items-center gap-1.5">
              <button data-testid={`pieces-minus-${r.id}`} onClick={() => setPieces((p) => String(Math.max(1, (n(p) || 1) - 1)))} className="w-7 h-7 rounded-lg bg-white dark:bg-[#1F252B] border border-[#D7E1DB] dark:border-[#38424B] text-[#5E8B7E] font-bold">−</button>
              <input
                data-testid={`pieces-input-${r.id}`} type="number" value={pieces}
                onChange={(e) => setPieces(e.target.value)}
                className="w-14 text-center font-mono-data text-sm font-bold bg-white dark:bg-[#1F252B] border border-[#D7E1DB] dark:border-[#38424B] rounded-lg py-1 outline-none"
              />
              <button data-testid={`pieces-plus-${r.id}`} onClick={() => setPieces((p) => String((n(p) || 0) + 1))} className="w-7 h-7 rounded-lg bg-white dark:bg-[#1F252B] border border-[#D7E1DB] dark:border-[#38424B] text-[#5E8B7E] font-bold">+</button>
            </div>
          </div>
          {perPiece != null && (
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#D7E1DB]/60 dark:border-[#38424B]">
              <span className="text-xs font-semibold text-[#3F4A54] dark:text-[#AEB8BF]">{t("cost_per_piece")}</span>
              <span className="font-mono-data text-sm font-bold text-[#6B8E62]">€ {perPiece.toFixed(2)}</span>
            </div>
          )}
          {(cst.b2b_500g || cst.b2b_100g) && (
            <div className="mt-2 pt-2 border-t border-[#D7E1DB]/60 dark:border-[#38424B]" data-testid={`b2b-${r.id}`}>
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#5E8B7E] mb-1">{t("labels_b2b_hint")}</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-[#6B8E62]/10 border border-[#6B8E62]/30 px-2 py-1.5 text-center">
                  <p className="text-[9px] uppercase tracking-wide text-[#7E8A93]">{t("labels_b2b_500")}</p>
                  <p className="font-mono-data text-sm font-extrabold text-[#6B8E62]">€ {Number(cst.b2b_500g || 0).toFixed(2)}</p>
                </div>
                <div className="rounded-lg bg-[#5E8B7E]/10 border border-[#5E8B7E]/30 px-2 py-1.5 text-center">
                  <p className="text-[9px] uppercase tracking-wide text-[#7E8A93]">{t("labels_b2b_100")}</p>
                  <p className="font-mono-data text-sm font-extrabold text-[#5E8B7E]">€ {Number(cst.b2b_100g || 0).toFixed(2)}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }
  }

  const shareRecipe = async () => {
    const url = `${window.location.origin}/?ricetta=${r.id}`;
    const title = rLoc(r, "name", lang);
    const textMsg = tri(`Guarda questa ricetta su MikiLab: ${title}`, `Schau dir dieses Rezept auf MikiLab an: ${title}`, `Check out this recipe on MikiLab: ${title}`);
    try {
      if (navigator.share) { await navigator.share({ title: `MikiLab · ${title}`, text: textMsg, url }); return; }
    } catch (e) { /* utente ha annullato */ return; }
    try { await navigator.clipboard.writeText(url); toast.success(tri("Link copiato!", "Link kopiert!", "Link copied!")); }
    catch { toast.error(tri("Impossibile copiare il link", "Link kann nicht kopiert werden", "Couldn't copy the link")); }
  };

  return (
    <div data-testid={`recipe-detail-${r.id}`}>
      {r.image_url && isPanettone && (
        <div className="relative h-40 w-full">
          <img src={r.image_url} alt={r.name} className="w-full h-full object-cover" />
          {countryColors(r.origin) && (
            <div aria-hidden className="absolute top-0 left-0 right-0 flex h-1.5">
              {countryColors(r.origin).map((c, k) => <div key={k} className="flex-1" style={{ background: c }} />)}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1B2127]/70 to-transparent" />
        </div>
      )}
      <div className="p-5 space-y-4 print-area">
        <PrintHeader title={rLoc(r, "name", lang)} lang={lang} />
        <div>
          <h2 className="font-display text-2xl font-bold text-[#2B303B] dark:text-[#EAF0EC]">
            {r.origin && flagEmoji(r.origin) && <span className="mr-1" title={countryName(r.origin)}>{flagEmoji(r.origin)}</span>}
            {isPanettone && farro ? rLoc(r, "name", lang).replace(/mikilab/i, (m) => "al Farro " + m) : rLoc(r, "name", lang)}
          </h2>
          {rLoc(r, "real_name", lang) ? <p className="text-sm font-semibold text-[#5E8B7E] mt-0.5">{rLoc(r, "real_name", lang)}</p> : null}
          {r.flour_type ? <p className="text-sm text-[#7E8A93] mt-0.5">{rLoc(r, "flour_type", lang)}</p> : null}
        </div>

        <div className="flex gap-1.5 no-print flex-wrap">
          <ActionBtn testid={`share-recipe-${r.id}`} onClick={shareRecipe} color="#6E8CA0" label={tri("Condividi", "Teilen", "Share")}><Share2 className="w-4 h-4" /></ActionBtn>
          {!r.locked && rLoc(r, "procedure", lang) && (
            <ActionBtn testid={`listen-recipe-${r.id}`} onClick={() => playTTS(`${rLoc(r, "name", lang)}. ${rLoc(r, "procedure", lang)}`, { who: "momy", lang }).catch(() => {})} color="#5E8B7E" label={tri("Ascolta", "Anhören", "Listen")}><Volume2 className="w-4 h-4" /></ActionBtn>
          )}
          {!r.locked && (
            <ActionBtn testid={`pdf-recipe-${r.id}`} onClick={() => window.print()} color="#6B8E62" label={tri("PDF / Stampa", "PDF / Drucken", "PDF / Print")}><Printer className="w-4 h-4" /></ActionBtn>
          )}
          <ActionBtn testid={`scale-recipe-${r.id}`} onClick={onScaleAction} color="#6B8E62" label={t("scale_aria")}><Scale className="w-4 h-4" /></ActionBtn>
          {canEdit && <ActionBtn testid={`duplicate-recipe-${r.id}`} onClick={onDuplicate} color="#7E8A93" label={t("duplicate_aria")}><Copy className="w-4 h-4" /></ActionBtn>}
          {canEdit && <ActionBtn testid={`edit-recipe-${r.id}`} onClick={onEdit} color="#5E8B7E"><Pencil className="w-4 h-4" /></ActionBtn>}
          {canEdit && <ActionBtn testid={`delete-recipe-${r.id}`} onClick={onDelete} color="#C0574D"><Trash2 className="w-4 h-4" /></ActionBtn>}
        </div>

        {isPanettone && !r.locked && (
          <button data-testid={`farro-toggle-${r.id}`} onClick={() => setFarro((v) => !v)}
            className={`w-full flex items-center justify-center gap-2 rounded-2xl px-4 py-3 font-semibold text-sm transition-all active:scale-98 border ${
              farro ? "bg-[#6B8E62] text-white border-[#6B8E62]" : "bg-[#6E8CA0]/10 text-[#33564E] dark:text-[#8FB0C2] border-[#6E8CA0]/40"
            }`}>
            <Wheat className="w-4 h-4" />
            {farro
              ? tri("Versione al Farro attiva — torna al grano", "Dinkel-Version aktiv — zur Weizen-Version", "Spelt version active — back to wheat")
              : tri("Converti in Farro", "In Dinkel (Farro) umwandeln", "Convert to Spelt")}
          </button>
        )}

        {isPanettone && !r.locked && farro && (
          <div data-testid={`farro-banner-${r.id}`} className="rounded-xl bg-[#6B8E62]/12 border border-[#6B8E62]/30 p-3 text-sm text-[#3F4A54] dark:text-[#AEB8BF] leading-relaxed">
            🌾 {tri(
              "VERSIONE AL FARRO: essendo il glutine del farro più fragile e tenace, l'idratazione è stata ridotta di ~4%. Impasta per meno tempo e più delicatamente (evita il surriscaldamento); inserisci burro e tuorli in piccole dosi frazionate. Gestione del lievito madre, glassa e procedimento restano invariati.",
              "DINKEL-VERSION: Da das Dinkelgluten zerbrechlicher ist, wurde die Hydratation ~4% reduziert. Kürzer und schonender kneten (Überhitzung vermeiden); Butter und Eigelb in kleinen Portionen fraktioniert einarbeiten. Lievito-Madre-Führung, Glasur und Ablauf bleiben unverändert.",
              "SPELT VERSION: as spelt gluten is more fragile and tenacious, hydration was reduced by ~4%. Knead shorter and more gently (avoid overheating); add butter and yolks in small fractioned portions. Sourdough management, glaze and procedure stay unchanged.")}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {r.dough_category && <Badge icon={<Layers className="w-3.5 h-3.5" />}>{t(`dc_${r.dough_category}`)}</Badge>}
          {r.water_temp_c != null && r.water_temp_c !== "" && <Badge icon={<Droplets className="w-3.5 h-3.5" />}>{r.water_temp_c}°C {t("badge_water_temp")}</Badge>}
          {r.hydration_percent != null && <Badge icon={<Droplets className="w-3.5 h-3.5" />}>{r.hydration_percent}% {t("badge_hydration")}</Badge>}
          {r.flour_grams != null && <Badge icon={<Wheat className="w-3.5 h-3.5" />}>{r.flour_grams}g {t("badge_flour")}</Badge>}
          {r.bulk_fermentation_hours != null && <Badge icon={<Clock className="w-3.5 h-3.5" />}>{r.bulk_fermentation_hours}h {t("badge_ferment")}</Badge>}
          {r.bake_temp != null && (
            <Badge icon={<Flame className="w-3.5 h-3.5" />}>
              {r.bake_temp}°{r.bake_minutes != null ? ` · ${r.bake_minutes}′` : ""} {r.oven_type === "ventilato" ? t("oven_type_fan") : r.oven_type === "rotor" ? t("oven_type_rotor") : t("oven_type_static")}
            </Badge>
          )}
          {r.method_type && (
            <Badge icon={<Layers className="w-3.5 h-3.5" />}>{r.method_type === "diretto" ? t("method_diretto") : t("method_indiretto")}</Badge>
          )}
        </div>

        {isPanettone && !r.locked ? (
          <PanettoneStructure r={r} t={t} lang={lang} flourG={flourG} farro={farro} scaleVal={scaleVal} onScaleChange={onScaleChange} />
        ) : rows.length > 0 ? (
          <>
          {biga && (
            <div data-testid={`recipe-biga-${r.id}`} className="rounded-xl bg-[#6E8CA0]/10 border border-[#6E8CA0]/30 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#33564E] dark:text-[#8FB0C2] mb-2">🥖 {tri("Fase 1 · Vorteig (Biga)", "Phase 1 · Vorteig (Biga)", "Phase 1 · Vorteig (Biga)")}</p>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm"><span className="text-[#3F4A54] dark:text-[#AEB8BF]">{t("ing_flour")}</span><span className="font-mono-data font-semibold text-[#33564E] dark:text-[#8FB0C2]">{bFlour} g</span></div>
                <div className="flex items-center justify-between text-sm"><span className="text-[#3F4A54] dark:text-[#AEB8BF]">{t("ing_water")}</span><span className="font-mono-data font-semibold text-[#33564E] dark:text-[#8FB0C2]">{bWater} g</span></div>
                {bYeast > 0 && <div className="flex items-center justify-between text-sm"><span className="text-[#3F4A54] dark:text-[#AEB8BF]">{tri("Lievito di birra", "Hefe", "Fresh yeast")}</span><span className="font-mono-data font-semibold text-[#33564E] dark:text-[#8FB0C2]">{bYeast} g</span></div>}
              </div>
              {(biga.hours || biga.hours_de) && <p className="text-[11px] text-[#7E8A93] mt-2 leading-relaxed">{de ? (biga.hours_de || biga.hours) : (lang === "en" ? (biga.hours_en || biga.hours) : biga.hours)}</p>}
            </div>
          )}
          {biga && <div className="border-t border-dashed border-[#6E8CA0]/50 my-1" aria-hidden />}
          <div data-testid={`recipe-ingredients-${r.id}`} className="rounded-xl bg-[#EAF0EC] dark:bg-[#2A323A] p-3 print-table">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#5E8B7E]">{biga ? tri("Fase 2 · Impasto principale", "Phase 2 · Hauptteig", "Phase 2 · Main dough") : t("recipe_ingredients")}</p>
              {flourG > 0 && (
                <div className="flex items-center gap-1 no-print">
                  <span className="text-[10px] text-[#7E8A93]">{t("recipe_scale")}</span>
                  <input
                    data-testid={`recipe-scale-${r.id}`} type="number" value={scaleVal ?? flourG}
                    onChange={(e) => onScaleChange(e.target.value)}
                    className="w-20 text-right font-mono-data text-xs font-bold text-[#33564E] dark:text-[#8FB0C2] bg-white dark:bg-[#1F252B] border border-[#D7E1DB] dark:border-[#38424B] rounded-md px-1.5 py-1 outline-none"
                  />
                  <span className="text-[10px] text-[#7E8A93]">g</span>
                </div>
              )}
            </div>
            <div className="space-y-1">
              {rows.map(([k, v], idx) => {
                const isImprover = typeof k === "string" && /migliorator|backmittel/i.test(k);
                return (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="text-[#3F4A54] dark:text-[#AEB8BF]">
                      {k}
                      {isImprover && (
                        <button data-testid={`improver-link-${r.id}`} onClick={onImprover} className="ml-1 text-[#6B8E62] font-bold align-super" title={t("improver_link_title")}>*</button>
                      )}
                    </span>
                    <span className="font-mono-data font-semibold text-[#33564E] dark:text-[#8FB0C2]">{v}</span>
                  </div>
                );
              })}
            </div>
          </div>
          </>
        ) : null}

        {r.procedure ? (
          <div data-testid={`recipe-procedure-${r.id}`} className="rounded-xl bg-[#6B8E62]/10 border border-[#6B8E62]/25 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#4d6b45] dark:text-[#9ec48f] mb-1.5">{t("recipe_procedure")}</p>
            <p className="text-sm text-[#3F4A54] dark:text-[#AEB8BF] leading-relaxed whitespace-pre-line">{rLoc(r, "procedure", lang)}</p>
          </div>
        ) : null}

        {r.locked && (
          <div data-testid={`recipe-teaser-${r.id}`} className="rounded-2xl bg-gradient-to-br from-[#5E8B7E] to-[#33564E] text-white p-5 text-center shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-white/15 border border-white/30 flex items-center justify-center mx-auto mb-3">
              <Lock className="w-6 h-6" />
            </div>
            <p className="font-display text-lg font-bold">
              {tri("Sblocca la ricetta completa con PRO", "Vollständiges Rezept mit PRO freischalten", "Unlock the full recipe with PRO")}
            </p>
            <p className="text-white/85 text-sm mt-1.5">
              {tri("Procedimento passo-passo, tutti gli ingredienti, le fasi di lavorazione e gli strumenti del laboratorio.", "Prozedur Schritt für Schritt, alle Zutaten, Arbeitsphasen und Werkzeuge des Labors.", "Step-by-step procedure, all ingredients, work phases and lab tools.")}
            </p>
            <button data-testid={`recipe-unlock-${r.id}`} onClick={onUnlock}
              className="mt-4 inline-flex items-center gap-2 bg-white text-[#33564E] font-bold px-5 py-2.5 rounded-xl active:scale-97 transition-all">
              <Crown className="w-4 h-4" /> {tri("Sblocca questa ricetta", "Dieses Rezept freischalten", "Unlock this recipe")}
            </button>
          </div>
        )}

        {r.notes ? <p className="text-sm text-[#3F4A54] dark:text-[#AEB8BF] leading-relaxed whitespace-pre-line">{rLoc(r, "notes", lang)}</p> : null}

        <GlossaryBox text={`${r.procedure || ""} ${r.notes || ""}`} />

        {Array.isArray(r.work_phases) && r.work_phases.filter((p) => p && (p.name || p.time || p.temp)).length > 0 && (
          <div data-testid={`recipe-phases-${r.id}`} className="rounded-xl bg-[#5E8B7E]/8 border border-[#5E8B7E]/20 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#5E8B7E] mb-2">{t("work_phases_section")}</p>
            <div className="space-y-1.5">
              {r.work_phases.filter((p) => p && (p.name || p.time || p.temp)).map((p, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-[#3F4A54] dark:text-[#AEB8BF] font-medium">{p.name || `${t("phase_name_ph")} ${idx + 1}`}</span>
                  <span className="font-mono-data text-[#33564E] dark:text-[#8FB0C2] shrink-0 ml-2">
                    {p.time ? p.time : ""}{p.time && p.temp ? " · " : ""}{p.temp ? `${fmtTemp(p.temp)}°C` : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {priceBlock}

        <TattooSignature className="mt-1" testid={`recipe-signature-${r.id}`} />
      </div>
    </div>
  );
}

function ActionBtn({ testid, onClick, color, label, children }) {
  return (
    <button
      data-testid={testid}
      onClick={onClick}
      aria-label={label}
      className="w-9 h-9 rounded-lg bg-[#EAF0EC] dark:bg-[#2A323A] flex items-center justify-center active:scale-95"
      style={{ color }}
    >
      {children}
    </button>
  );
}

function Badge({ icon, children }) {
  return (
    <span className="inline-flex items-center gap-1 bg-[#6E8CA0]/15 text-[#33564E] dark:text-[#8FB0C2] font-mono-data text-xs px-2.5 py-1 rounded-full font-bold border border-[#6E8CA0]/30">
      {icon}
      {children}
    </span>
  );
}

// Normalizes a phase temperature: keeps the number, drops any unit (° / C) the user may have typed.
function fmtTemp(v) {
  if (v == null) return "";
  const m = String(v).match(/-?\d+(?:[.,]\d+)?/);
  return m ? m[0].replace(",", ".") : String(v).replace(/[°cC\s]+$/g, "");
}

// Categoria e ordine di visualizzazione: Backmittel -> Lievito Madre -> Panettoni -> Pane -> Panini
const BASI_ORDER = ["Miglioratore Naturale Pro", "Lievito Madre Solido", "LiCoLi (Lievito in Coltura Liquida)", "Lievito Madre di Segale", "Poolish", "Farina Cotta (Kochstück)"];

// Badge sintetici derivati dalla ricetta (LM, LDB, Vk, Rg, Poolish, Biga, numeri farina).
function recipeBadges(r) {
  const out = [];
  const pref = (r.preferment_type || "").toLowerCase();
  const ft = (r.flour_type || "").toLowerCase();
  const notes = (r.notes || "").toLowerCase();
  const extras = r.extra_ingredients || [];
  if (/segale|roggen|\brg\b|rye/.test(ft) || pref.includes("segale")) out.push("Rg");
  if (/licoli|lievito madre|lievito naturale|pasta madre|sauerteig|sourdough/.test(pref + " " + ft)) out.push("LM");
  if (/poolish/.test(pref + " " + notes)) out.push("Poolish");
  if (pref === "biga" || /\bbiga\b|vorteig/.test(ft) || (r.biga && r.preferment_type === "biga")) out.push("Biga");
  if (/integrale|vollkorn|\bvk\b/.test(ft + " " + notes)) out.push("Vk");
  if (extras.some((e) => /lievito di birra|hefe/i.test(e && e.name))) out.push("LDB");
  // numeri farina (630, 550, 405, 812, 1050, 00, W380…)
  const wm = (r.flour_type || "").match(/w\s?\d{3}/gi);
  if (wm) wm.forEach((w) => out.push(w.replace(/\s/g, "").toUpperCase()));
  const nums = (r.flour_type || "").match(/\b(300|380|405|550|630|812|1050|1600)\b/g);
  if (nums) nums.forEach((n) => { if (!out.includes(n)) out.push(n); });
  return [...new Set(out)];
}

const BADGE_STYLE = {
  LM: "bg-[#6B8E62]/15 text-[#4d6b45] border-[#6B8E62]/40",
  LDB: "bg-[#5E8B7E]/12 text-[#33564E] border-[#5E8B7E]/35",
  Rg: "bg-[#6E8CA0]/12 text-[#33564E] border-[#6E8CA0]/35",
  Vk: "bg-[#6E8CA0]/12 text-[#33564E] border-[#6E8CA0]/35",
  Poolish: "bg-[#3F7CAC]/12 text-[#2E5E82] border-[#3F7CAC]/35",
  Biga: "bg-[#3F7CAC]/12 text-[#2E5E82] border-[#3F7CAC]/35",
};
function badgeClass(b) {
  return BADGE_STYLE[b] || "bg-[#6E8CA0]/15 text-[#33564E] border-[#6E8CA0]/35";
}

// Etichetta badge localizzata: sigle comprensibili per lingua.
const BADGE_LABEL = {
  Vk: { it: "INT", de: "VK", en: "WW" },        // integrale / Vollkorn / wholewheat
  LDB: { it: "LDB", de: "Frischhefe", en: "Yeast" },
  Rg: { it: "Segale", de: "Roggen", en: "Rye" },
  LM: { it: "LM", de: "Sauerteig", en: "Sourdough" },
};
function badgeLabel(b, lang) {
  const m = BADGE_LABEL[b];
  return m ? (m[lang] || m.it) : b;
}
// Spiegazione farine tedesche (Type) → cereale/equivalente italiano.
const FLOUR_INFO = {
  "300": { it: "Farina debole", de: "Schwaches Mehl", en: "Weak flour" },
  "380": { it: "W380 · farina forte", de: "W380 · starkes Mehl", en: "W380 · strong flour" },
  "405": { it: "≈ Farina 00 (grano tenero)", de: "Weizen Type 405", en: "≈ soft wheat 00" },
  "550": { it: "≈ Farina 0 (grano tenero)", de: "Weizen Type 550", en: "≈ soft wheat type 0" },
  "630": { it: "Farro · Dinkel (Type 630)", de: "Dinkelmehl Type 630", en: "Spelt (Type 630)" },
  "812": { it: "≈ Farina Tipo 1", de: "Weizen Type 812", en: "≈ type 1 flour" },
  "1050": { it: "≈ Tipo 2 · semi-integrale", de: "Weizen Type 1050", en: "≈ type 2 / high-extraction" },
  "1600": { it: "≈ Farina integrale", de: "Vollkorn Type 1600", en: "≈ wholemeal" },
};
function badgeTitle(b, lang) {
  if (FLOUR_INFO[b]) return FLOUR_INFO[b][lang] || FLOUR_INFO[b].it;
  if (/^W\d{3}$/.test(b)) return { it: "Farina forte (indice W)", de: "Starkes Mehl (W-Wert)", en: "Strong flour (W index)" }[lang] || "";
  const desc = { Vk: { it: "Farina integrale", de: "Vollkornmehl", en: "Wholewheat" }, LDB: { it: "Lievito di birra", de: "Frischhefe", en: "Fresh yeast" }, Rg: { it: "Segale", de: "Roggen", en: "Rye" }, LM: { it: "Lievito madre", de: "Sauerteig", en: "Sourdough" }, Poolish: { it: "Prefermento liquido", de: "Poolish-Vorteig", en: "Poolish preferment" }, Biga: { it: "Prefermento solido (Biga)", de: "Biga-Vorteig", en: "Biga preferment" } }[b];
  return desc ? (desc[lang] || desc.it) : "";
}

// Basi/prefermenti presenti in una ricetta → per il filtro "per Base".
const BASE_KEYS = ["poolish", "biga", "lm", "segale", "licoli", "kochstuck", "quark", "indiretto", "diretto"];
function recipeBase(r) {
  const pref = (r.preferment_type || "").toLowerCase();
  const ft = (r.flour_type || "").toLowerCase();
  const notes = (r.notes || "").toLowerCase();
  const name = (r.name || "").toLowerCase();
  const extras = (r.extra_ingredients || []).map((e) => ((e && e.name) || "").toLowerCase()).join(" ");
  const hay = [pref, ft, notes, name, extras].join(" ");
  const out = [];
  if (/poolish/.test(hay)) out.push("poolish");
  if (pref === "biga" || /\bbiga\b|vorteig/.test(hay) || r.biga) out.push("biga");
  if (/licoli/.test(hay)) out.push("licoli");
  if (/segale|roggen|\brye\b/.test(hay)) out.push("segale");
  if (pref === "lm" || /lievito madre|pasta madre|lievito naturale|sauerteig|sourdough/.test(hay)) out.push("lm");
  if (/kochst|farina cotta/.test(hay)) out.push("kochstuck");
  if (/quark/.test(hay)) out.push("quark");
  const method = (r.method_type || "").toLowerCase();
  const hasPref = out.some((k) => ["poolish", "biga", "lm", "licoli", "segale"].includes(k));
  const isIndirect = method === "indiretto" || hasPref;
  if (isIndirect) out.push("indiretto");
  if (!isIndirect && (pref === "diretto" || pref === "none" || pref === "" || out.length === 0)) out.push("diretto");
  return [...new Set(out)];
}
function baseLabel(k, lang) {
  const de = lang === "de", en = lang === "en";
  switch (k) {
    case "all": return de ? "Alle" : en ? "All" : "Tutte";
    case "poolish": return "Poolish";
    case "biga": return "Biga";
    case "lm": return de ? "Sauerteig" : en ? "Sourdough" : "Lievito Madre";
    case "segale": return de ? "Roggen-ST" : en ? "Rye sourdough" : "LM di Segale";
    case "licoli": return "LiCoLi";
    case "kochstuck": return de ? "Kochstück" : en ? "Cooked flour" : "Farina Cotta";
    case "quark": return "Quark";
    case "indiretto": return de ? "Indirekt" : en ? "Indirect" : "Indiretto";
    case "diretto": return de ? "Direkt" : en ? "Direct" : "Diretto";
    default: return k;
  }
}

function recipeCategory(r) {
  const cat = r.menu_category;
  const name = (r.name || "").toLowerCase();
  // Ordine: Basi → Pane → Panini → Snack → Focacce → Panettoni
  if (cat === "basi" || (!cat && /migliorator|backmittel|lievito madre|poolish|kochst/.test(name))) {
    const sub = BASI_ORDER.indexOf(r.name);
    return { rank: 0, sub: sub < 0 ? 99 : sub, key: "basi", label: "cat_basi", icon: "✨" };
  }
  if (cat === "panettoni" || (!cat && /panettone/.test(name))) return { rank: 5, sub: 0, key: "panettoni", label: "cat_panettoni", icon: "🎁" };
  if (cat === "focacce") return { rank: 4, sub: 0, key: "focacce", label: "cat_focacce", icon: "🫓" };
  if (cat === "snack") return { rank: 3, sub: 0, key: "snack", label: "cat_snack", icon: "🥨" };
  if (cat === "panini") return { rank: 2, sub: 0, key: "panini", label: "cat_panini", icon: "🥖" };
  // Pane: tengo le baguette/filoni vicini in cima alla sezione
  const isBaguette = /baguette|filo di francia|ficelle|bacchett/.test(name);
  return { rank: 1, sub: isBaguette ? 0 : 1, key: "pane", label: "cat_pane", icon: "🍞" };
}

const GLOSSARY = {
  bassinage: {
    it: "Bassinage: si trattiene una parte dell'acqua (~10%) e la si aggiunge poco a poco all'impasto GIÀ incordato, per raggiungere alte idratazioni senza smontare la maglia glutinica.",
    de: "Bassinage: Man hält ca. 10% des Wassers zurück und arbeitet es erst in den FERTIG gekneteten Teig ein – so erreicht man hohe Hydratation, ohne das Glutengerüst zu zerstören.",
    match: ["bassinage"],
  },
  autolisi: {
    it: "Autolisi: riposo iniziale di farina e acqua (20-40 min) prima di sale e lievito; sviluppa glutine e rende l'impasto più estensibile.",
    de: "Autolyse: anfängliche Ruhezeit von Mehl und Wasser (20-40 Min.) vor Salz und Hefe; entwickelt Gluten und macht den Teig dehnbarer.",
    match: ["autolisi", "autolyse"],
  },
  poolish: {
    it: "Poolish: prefermento liquido (farina e acqua in parti uguali + poco lievito), matura 8-16 h; dà aroma e sofficità.",
    de: "Poolish: flüssiger Vorteig (Mehl und Wasser zu gleichen Teilen + wenig Hefe), reift 8-16 h; gibt Aroma und Lockerheit.",
    match: ["poolish"],
  },
  stockgare: {
    it: "Stockgare (puntata): prima lievitazione in massa dopo l'impasto, spesso con pieghe.",
    de: "Stockgare: erste Teigruhe in der Masse nach dem Kneten, oft mit Dehnen und Falten.",
    match: ["stockgare"],
  },
  quellstuck: {
    it: "Quellstück: semi/cereali messi in ammollo (spesso la sera prima) così assorbono acqua e non rubano umidità all'impasto.",
    de: "Quellstück: Saaten/Körner werden eingeweicht (oft am Vorabend), damit sie Wasser aufnehmen und dem Teig keine Feuchtigkeit entziehen.",
    match: ["quellstück", "quellstuck"],
  },
  sauerteig: {
    it: "Sauerteig: lievito naturale (pasta acida). Il Weizensauerteig è di frumento, il Roggensauerteig di segale.",
    de: "Sauerteig: natürliches Triebmittel. Weizensauerteig aus Weizen, Roggensauerteig aus Roggen.",
    match: ["sauerteig", "weizensauerteig", "roggensauerteig"],
  },
  incordare: {
    it: "Incordare: impastare fino a che l'impasto diventa liscio, elastico e si stacca dalle pareti (glutine ben sviluppato).",
    de: "Auskneten (incordare): kneten, bis der Teig glatt, elastisch ist und sich von der Schüssel löst (Gluten gut entwickelt).",
    match: ["incorda", "incordat"],
  },
  appretto: {
    it: "Appretto: seconda lievitazione dopo la formatura, prima della cottura.",
    de: "Stückgare (appretto): zweite Gare nach dem Formen, vor dem Backen.",
    match: ["appretto"],
  },
  ta: {
    it: "TA (Teigausbeute): resa dell'impasto = (farina+acqua)/farina ×100. Es. TA 182 ≈ 82% di idratazione.",
    de: "TA (Teigausbeute): (Mehl+Wasser)/Mehl ×100. Z. B. TA 182 ≈ 82% Hydratation.",
    match: ["teigausbeute", "ta ~", "ta182", "ta 18"],
  },
};

function GlossaryBox({ text }) {
  const { t, lang } = useLang();
  const low = (text || "").toLowerCase();
  const found = Object.values(GLOSSARY).filter((g) => g.match.some((m) => low.includes(m)));
  if (found.length === 0) return null;
  return (
    <div data-testid="recipe-glossary" className="rounded-xl bg-[#6E8CA0]/10 border border-[#6E8CA0]/30 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-[#33564E] dark:text-[#8FB0C2] mb-1.5">{t("gloss_title")} *</p>
      <ul className="space-y-1.5">
        {found.map((g, i) => (
          <li key={i} className="text-xs text-[#3F4A54] dark:text-[#AEB8BF] leading-relaxed">* {lang === "de" ? g.de : g.it}</li>
        ))}
      </ul>
    </div>
  );
}


// ——— Struttura tecnica obbligatoria dei Panettoni (Direttiva v7.8) ———
const PAN_MY = {
  it: [
    { s: "Bagnetto", d: "15 min in acqua a 28°C — pH 3,9" },
    { s: "1° Rinfresco", d: "1:1:0,5 a 28°C — pH 3,9" },
    { s: "2° Rinfresco", d: "28°C per 3,5–4 h — pH 4,1–4,3" },
    { s: "Legato in sacco", d: "16°C per 16–18 h" },
  ],
  de: [
    { s: "Bagnetto (Bad)", d: "15 Min. in Wasser bei 28°C — pH 3,9" },
    { s: "1. Auffrischung", d: "1:1:0,5 bei 28°C — pH 3,9" },
    { s: "2. Auffrischung", d: "28°C für 3,5–4 h — pH 4,1–4,3" },
    { s: "Gebunden im Sack", d: "16°C für 16–18 h" },
  ],
};

const PAN_GLAZE = [
  ["Zucchero", "Zucker", 54.55],
  ["Mandorle grezze", "Rohe Mandeln", 18.18],
  ["Albumi", "Eiweiß", 18.18],
  ["Nocciole", "Haselnüsse", 3.64],
  ["Armelline", "Bittermandeln (Aprikosenkerne)", 1.82],
  ["Farina MP", "Mehl", 1.82],
  ["Farina Fioretto", "Maismehl (fein)", 0.91],
  ["Fecola", "Kartoffelstärke", 0.91],
];

function PanettoneStructure({ r, t, lang, flourG, farro, scaleVal, onScaleChange }) {
  const de = lang === "de";
  const tri = (i_, d_, e_) => (de ? d_ : lang === "en" ? e_ : i_);
  const [glazeTot, setGlazeTot] = useState(150);
  const targetVal = flourG > 0 ? (Number(scaleVal) || flourG) : 0;
  const fct = flourG > 0 ? targetVal / flourG : 1;
  const G = (v) => (v == null ? 0 : Math.round(Number(v) * fct));
  const flourTot = G(r.flour_grams);
  const items = [];
  items.push({ name: t("ing_flour"), tot: flourTot, first: 0.5 });
  const waterBase = G(r.water_grams);
  items.push({ name: t("ing_water"), tot: farro ? Math.round(waterBase * 0.96) : waterBase, first: 1 });
  if (r.sourdough_grams) items.push({ name: t("ing_preferment"), tot: G(r.sourdough_grams), first: 1 });
  (r.extra_ingredients || []).forEach((e) => {
    if (!e || !e.name || e.percent == null || e.percent === "") return;
    const tot = flourG > 0 ? Math.round(targetVal * (Number(e.percent) / 100)) : 0;
    const key = String(e.name).toLowerCase();
    let first = 0;
    if (key.includes("zuccher") || key.includes("zucker")) first = 0.45;
    else if (key.includes("tuorl") || key.includes("eigelb")) first = 0.31;
    else if (key.includes("burro") || key.includes("butter")) first = 0.42;
    items.push({ name: ingLoc(e.name, lang), tot, first });
  });
  if (r.salt_grams) items.push({ name: t("ing_salt"), tot: G(r.salt_grams), first: 0 });
  const pctOf = (v) => (flourTot > 0 ? `${Math.round((v / flourTot) * 1000) / 10}%` : "—");

  return (
    <div data-testid={`panettone-structure-${r.id}`} className="space-y-4">
      {flourG > 0 && (
        <div className="flex items-center justify-end gap-1">
          <span className="text-[10px] text-[#7E8A93]">{t("recipe_scale")}</span>
          <input data-testid={`recipe-scale-${r.id}`} type="number" value={scaleVal ?? flourG}
            onChange={(e) => onScaleChange(e.target.value)}
            className="w-20 text-right font-mono-data text-xs font-bold text-[#33564E] dark:text-[#8FB0C2] bg-white dark:bg-[#1F252B] border border-[#D7E1DB] dark:border-[#38424B] rounded-md px-1.5 py-1 outline-none" />
          <span className="text-[10px] text-[#7E8A93]">g</span>
        </div>
      )}

      <div className="rounded-xl bg-[#5E8B7E]/8 border border-[#5E8B7E]/25 p-3">
        <p className="text-[10px] font-bold uppercase tracking-wide text-[#5E8B7E] mb-2">🌾 {tri("Gestione Lievito Madre (pH)", "Führung Lievito Madre (pH)", "Sourdough management (pH)")}</p>
        <div className="space-y-1">
          {PAN_MY[de ? "de" : "it"].map((m, i) => (
            <div key={i} className="flex items-start justify-between gap-2 text-sm">
              <span className="font-medium text-[#3F4A54] dark:text-[#AEB8BF] shrink-0">{m.s}</span>
              <span className="text-right text-[#7E8A93]">{m.d}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl bg-[#EAF0EC] dark:bg-[#2A323A] p-3 overflow-x-auto">
        <p className="text-[10px] font-bold uppercase tracking-wide text-[#5E8B7E] mb-2">{tri("Ingredienti: 1° e 2° Impasto · Totale", "Zutaten: 1./2. Teig · Gesamt", "Ingredients: 1st/2nd dough · Total")}</p>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-[10px] uppercase text-[#7E8A93]">
              <th className="text-left font-semibold pb-1">{tri("Ingrediente", "Zutat", "Ingredient")}</th>
              <th className="text-right font-semibold pb-1 pl-4">1°</th>
              <th className="text-right font-semibold pb-1 pl-4">2°</th>
              <th className="text-right font-semibold pb-1 pl-4">{tri("Tot.", "Ges.", "Tot.")}</th>
              <th className="text-right font-semibold pb-1 pl-4">%</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => {
              const first = Math.round(it.tot * it.first);
              const second = it.tot - first;
              return (
                <tr key={i} className="border-t border-[#D7E1DB]/60 dark:border-[#38424B]">
                  <td className="py-1 text-[#3F4A54] dark:text-[#AEB8BF] pr-2">{it.name}</td>
                  <td className="py-1 text-right font-mono-data text-[#7E8A93] pl-4 whitespace-nowrap">{first > 0 ? first : "—"}</td>
                  <td className="py-1 text-right font-mono-data text-[#7E8A93] pl-4 whitespace-nowrap">{second > 0 ? second : "—"}</td>
                  <td className="py-1 text-right font-mono-data font-semibold text-[#33564E] dark:text-[#8FB0C2] pl-4 whitespace-nowrap">{it.tot}</td>
                  <td className="py-1 text-right font-mono-data text-[#7E8A93] pl-4 whitespace-nowrap">{pctOf(it.tot)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="text-[10px] text-[#7E8A93] mt-2">{tri("g · % sul peso della farina totale. Sospensioni sempre a fine impasto, a bassa velocità.", "g · % auf das Gesamtmehl. Suspensionen immer am Ende, langsam einarbeiten.", "g · % of total flour. Add suspensions at the very end, at low speed.")}</p>
      </div>

      <div className="rounded-xl bg-[#6E8CA0]/10 border border-[#6E8CA0]/30 p-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#33564E] dark:text-[#8FB0C2]">{tri("Modulo Glassa (automatico)", "Glasur-Modul (automatisch)", "Glaze module (automatic)")}</p>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-[#7E8A93]">{tri("Totale", "Gesamt", "Total")}</span>
            <input data-testid={`glaze-total-${r.id}`} type="number" value={glazeTot}
              onChange={(e) => setGlazeTot(e.target.value)}
              className="w-16 text-right font-mono-data text-xs font-bold text-[#33564E] dark:text-[#8FB0C2] bg-white dark:bg-[#1F252B] border border-[#D7E1DB] dark:border-[#38424B] rounded-md px-1.5 py-1 outline-none" />
            <span className="text-[10px] text-[#7E8A93]">g</span>
          </div>
        </div>
        <div className="space-y-1">
          {PAN_GLAZE.map(([itn, den, p], i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="text-[#3F4A54] dark:text-[#AEB8BF]">{de ? den : itn}</span>
              <span className="font-mono-data text-[#33564E] dark:text-[#8FB0C2]">{Math.round((Number(glazeTot) || 0) * p / 100)} g · {p}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
