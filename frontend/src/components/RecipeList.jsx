import { useEffect, useState, Fragment } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Wheat, Droplets, Clock, Copy, Scale, Flame, Layers, MoreHorizontal, Lock, Crown } from "lucide-react";
import { recipesApi, subscriptionApi } from "@/lib/api";
import RecipeDialog from "@/components/RecipeDialog";
import ScaleDialog from "@/components/ScaleDialog";
import { useLang } from "@/i18n/LanguageContext";
import { useAuth } from "@/auth/AuthContext";
import { rLoc, ingLoc } from "@/lib/loc";
import { flagEmoji, countryColors, countryName } from "@/lib/countries";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function RecipeList({ collectionName, heroImage, heroTitle, heroSubtitle, emptyText, readOnly = false }) {
  const [scale, setScale] = useState({});
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [scaling, setScaling] = useState(null);
  const [viewing, setViewing] = useState(null);
  const { t, lang } = useLang();
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

  // "Assaggio": sblocca la ricetta completa abbonandosi (o accede se anonimo).
  const handleUnlock = async () => {
    if (!user) { setAuthOpen(true); toast.info(t("gate_save_login")); return; }
    try {
      const d = await subscriptionApi.checkout("monthly");
      if (d.url) window.location.href = d.url;
    } catch { toast.error(t("toast_load_error")); }
  };

  return (
    <div className="pb-4">
      <div className="relative rounded-3xl overflow-hidden mb-5 h-40">
        <img src={heroImage} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#2C221E]/85 via-[#2C221E]/30 to-transparent" />
        <div className="absolute bottom-0 left-0 p-5">
          <h1 className="font-display text-3xl font-bold text-white">{heroTitle}</h1>
          {heroSubtitle ? <p className="text-white/85 text-sm mt-0.5">{heroSubtitle}</p> : null}
        </div>
      </div>

      {canEdit && (
        <button
          data-testid="add-recipe-btn"
          onClick={() => { setEditing(null); setDialogOpen(true); }}
          className="w-full bg-[#B34A26] hover:bg-[#963B1C] text-white font-semibold px-5 py-3.5 rounded-2xl shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 mb-5"
        >
          <Plus className="w-5 h-5" /> {t("add_recipe")}
        </button>
      )}

      {loading ? (
        <p className="text-center text-[#8C7567] py-8">{t("loading")}</p>
      ) : recipes.length === 0 ? (
        <div className="text-center py-12 px-6 border-2 border-dashed border-[#E8DEC8] dark:border-[#3D302A] rounded-3xl">
          <Wheat className="w-10 h-10 text-[#D99B26] mx-auto mb-3" />
          <p className="text-[#736055] dark:text-[#A89689]">{emptyText}</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {recipes.map((r, i) => {
            const cat = recipeCategory(r);
            const showHeader = collectionName === "mikilab" && (i === 0 || recipeCategory(recipes[i - 1]).key !== cat.key);
            return (
            <Fragment key={r.id}>
              {showHeader && (
                <div data-testid={`cat-${cat.key}`} className="flex items-center gap-2 pt-3 pb-1 first:pt-0">
                  <span className="text-lg">{cat.icon}</span>
                  <h2 className="font-display text-sm font-bold uppercase tracking-wide text-[#B34A26]">{t(cat.label)}</h2>
                  <span className="flex-1 h-px bg-[#E8DEC8] dark:bg-[#3D302A]" />
                </div>
              )}
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.02, 0.3) }}
              onClick={() => setViewing(r)}
              data-testid={`recipe-row-${r.id}`}
              className="relative overflow-hidden w-full text-left bg-white dark:bg-[#2A211D] border border-[#E8DEC8] dark:border-[#3D302A] rounded-2xl p-4 shadow-sm active:scale-[0.99] hover:border-[#D99B26]/60 transition-all flex items-center gap-3"
            >
              {countryColors(r.origin) && (
                <div aria-hidden className="absolute top-0 left-0 right-0 flex h-1.5">
                  {countryColors(r.origin).map((c, k) => (
                    <div key={k} className="flex-1" style={{ background: c }} />
                  ))}
                </div>
              )}
              {r.image_url && recipeCategory(r).key === "panettoni" && (
                <img src={r.image_url} alt="" loading="lazy"
                  className="w-14 h-14 rounded-xl object-cover shrink-0 border border-[#E8DEC8] dark:border-[#3D302A]" />
              )}
              <div className="min-w-0 flex-1">
                <h3 className="font-display text-lg font-semibold text-[#2C221E] dark:text-[#F5EFE6] truncate">
                  {r.origin && flagEmoji(r.origin) && <span className="mr-1" title={countryName(r.origin)}>{flagEmoji(r.origin)}</span>}
                  {rLoc(r, "name", lang)}
                </h3>
                {rLoc(r, "real_name", lang) ? <p className="text-xs font-medium text-[#B34A26] truncate">{rLoc(r, "real_name", lang)}</p> : null}
                {r.flour_type ? <p className="text-xs text-[#8C7567] truncate">{rLoc(r, "flour_type", lang)}</p> : null}
              </div>
              {r.locked
                ? <Lock data-testid={`recipe-locked-${r.id}`} className="w-4 h-4 text-[#D99B26] shrink-0" />
                : <MoreHorizontal className="w-5 h-5 text-[#C9BBB0] shrink-0" />}
            </motion.button>
            </Fragment>
            );
          })}
        </div>
      )}

      {/* Finestra ricetta */}
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-lg max-h-[88vh] overflow-y-auto bg-[#FDFBF7] dark:bg-[#1A1412] border-[#E8DEC8] dark:border-[#3D302A] p-0">
          <DialogTitle className="sr-only">{viewing?.name || t("recipe_ingredients")}</DialogTitle>
          <DialogDescription className="sr-only">{t("recipe_dialog_desc")}</DialogDescription>
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

      <ScaleDialog
        recipe={scaling}
        open={!!scaling}
        onOpenChange={(o) => !o && setScaling(null)}
        onSave={handleScaleSave}
      />

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent className="bg-[#FDFBF7] dark:bg-[#1A1412] border-[#E8DEC8] dark:border-[#3D302A]">
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
              className="bg-[#B4442A] hover:bg-[#963B1C]"
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
  const isPanettone = recipeCategory(r).key === "panettoni";
  const flourG = Number(r.flour_grams) || 0;
  const target = flourG > 0 ? (Number(scaleVal) || flourG) : 0;
  const f = flourG > 0 ? target / flourG : 1;
  const g = (v) => (v == null ? null : Math.round(Number(v) * f));
  const pct = (v) => (flourG > 0 && v != null ? ` · ${Math.round((Number(v) / flourG) * 1000) / 10}%` : "");
  const rows = [];
  if (r.flour_grams != null) rows.push([t("ing_flour"), `${g(r.flour_grams)} g${flourG > 0 ? " · 100%" : ""}`]);
  if (r.water_grams != null) rows.push([t("ing_water"), `${g(r.water_grams)} g${pct(r.water_grams)}`]);
  if (r.sourdough_grams) rows.push([`${t("ing_preferment")}${r.preferment_type && r.preferment_type !== "none" ? ` (${t(`pf_${r.preferment_type}`)})` : ""}`, `${g(r.sourdough_grams)} g${pct(r.sourdough_grams)}`]);
  if (r.salt_grams != null) rows.push([t("ing_salt"), `${g(r.salt_grams)} g${pct(r.salt_grams)}`]);
  (r.extra_ingredients || []).forEach((e) => {
    if (e && e.name && e.percent != null && e.percent !== "") {
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
        <div data-testid={`recipe-cost-${r.id}`} className="rounded-xl px-3 py-3 border bg-[#D99B26]/10 border-[#D99B26]/30">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#8C3A1D] dark:text-[#E5AC3A] mb-2">{t("cost_breakdown")}</p>
          <div className="space-y-1 mb-2">
            {br.map(([label, val], idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <span className="text-[#4A3B34] dark:text-[#C9BBB0]">{label}</span>
                <span className="font-mono-data text-[#8C3A1D] dark:text-[#E5AC3A]">€ {val.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-[#E8DEC8]/60 dark:border-[#3D302A]">
            <span className="text-xs font-semibold text-[#4A3B34] dark:text-[#C9BBB0]">{t("cost_total")}</span>
            <span className="font-mono-data text-sm font-bold text-[#8C3A1D] dark:text-[#E5AC3A]">€ {total.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-[#8C7567]">{t("cost_pieces")}</span>
            <div className="flex items-center gap-1.5">
              <button data-testid={`pieces-minus-${r.id}`} onClick={() => setPieces((p) => String(Math.max(1, (n(p) || 1) - 1)))} className="w-7 h-7 rounded-lg bg-white dark:bg-[#241D19] border border-[#E8DEC8] dark:border-[#3D302A] text-[#B34A26] font-bold">−</button>
              <input
                data-testid={`pieces-input-${r.id}`} type="number" value={pieces}
                onChange={(e) => setPieces(e.target.value)}
                className="w-14 text-center font-mono-data text-sm font-bold bg-white dark:bg-[#241D19] border border-[#E8DEC8] dark:border-[#3D302A] rounded-lg py-1 outline-none"
              />
              <button data-testid={`pieces-plus-${r.id}`} onClick={() => setPieces((p) => String((n(p) || 0) + 1))} className="w-7 h-7 rounded-lg bg-white dark:bg-[#241D19] border border-[#E8DEC8] dark:border-[#3D302A] text-[#B34A26] font-bold">+</button>
            </div>
          </div>
          {perPiece != null && (
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#E8DEC8]/60 dark:border-[#3D302A]">
              <span className="text-xs font-semibold text-[#4A3B34] dark:text-[#C9BBB0]">{t("cost_per_piece")}</span>
              <span className="font-mono-data text-sm font-bold text-[#6B8E62]">€ {perPiece.toFixed(2)}</span>
            </div>
          )}
          {(cst.b2b_500g || cst.b2b_100g) && (
            <div className="mt-2 pt-2 border-t border-[#E8DEC8]/60 dark:border-[#3D302A]" data-testid={`b2b-${r.id}`}>
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#B34A26] mb-1">{t("labels_b2b_hint")}</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-[#008C45]/10 border border-[#008C45]/30 px-2 py-1.5 text-center">
                  <p className="text-[9px] uppercase tracking-wide text-[#8C7567]">{t("labels_b2b_500")}</p>
                  <p className="font-mono-data text-sm font-extrabold text-[#008C45]">€ {Number(cst.b2b_500g || 0).toFixed(2)}</p>
                </div>
                <div className="rounded-lg bg-[#B34A26]/10 border border-[#B34A26]/30 px-2 py-1.5 text-center">
                  <p className="text-[9px] uppercase tracking-wide text-[#8C7567]">{t("labels_b2b_100")}</p>
                  <p className="font-mono-data text-sm font-extrabold text-[#B34A26]">€ {Number(cst.b2b_100g || 0).toFixed(2)}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }
  }

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
          <div className="absolute inset-0 bg-gradient-to-t from-[#1A1412]/70 to-transparent" />
        </div>
      )}
      <div className="p-5 space-y-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#2C221E] dark:text-[#F5EFE6]">
            {r.origin && flagEmoji(r.origin) && <span className="mr-1" title={countryName(r.origin)}>{flagEmoji(r.origin)}</span>}
            {rLoc(r, "name", lang)}
          </h2>
          {rLoc(r, "real_name", lang) ? <p className="text-sm font-semibold text-[#B34A26] mt-0.5">{rLoc(r, "real_name", lang)}</p> : null}
          {r.flour_type ? <p className="text-sm text-[#8C7567] mt-0.5">{rLoc(r, "flour_type", lang)}</p> : null}
        </div>

        <div className="flex gap-1.5">
          <ActionBtn testid={`scale-recipe-${r.id}`} onClick={onScaleAction} color="#6B8E62" label={t("scale_aria")}><Scale className="w-4 h-4" /></ActionBtn>
          {canEdit && <ActionBtn testid={`duplicate-recipe-${r.id}`} onClick={onDuplicate} color="#8C7567" label={t("duplicate_aria")}><Copy className="w-4 h-4" /></ActionBtn>}
          {canEdit && <ActionBtn testid={`edit-recipe-${r.id}`} onClick={onEdit} color="#B34A26"><Pencil className="w-4 h-4" /></ActionBtn>}
          {canEdit && <ActionBtn testid={`delete-recipe-${r.id}`} onClick={onDelete} color="#B4442A"><Trash2 className="w-4 h-4" /></ActionBtn>}
        </div>

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

        {rows.length > 0 && (
          <div data-testid={`recipe-ingredients-${r.id}`} className="rounded-xl bg-[#F5EFE6] dark:bg-[#332823] p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#B34A26]">{t("recipe_ingredients")}</p>
              {flourG > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-[#8C7567]">{t("recipe_scale")}</span>
                  <input
                    data-testid={`recipe-scale-${r.id}`} type="number" value={scaleVal ?? flourG}
                    onChange={(e) => onScaleChange(e.target.value)}
                    className="w-20 text-right font-mono-data text-xs font-bold text-[#8C3A1D] dark:text-[#E5AC3A] bg-white dark:bg-[#241D19] border border-[#E8DEC8] dark:border-[#3D302A] rounded-md px-1.5 py-1 outline-none"
                  />
                  <span className="text-[10px] text-[#8C7567]">g</span>
                </div>
              )}
            </div>
            <div className="space-y-1">
              {rows.map(([k, v], idx) => {
                const isImprover = typeof k === "string" && /migliorator|backmittel/i.test(k);
                return (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="text-[#4A3B34] dark:text-[#C9BBB0]">
                      {k}
                      {isImprover && (
                        <button data-testid={`improver-link-${r.id}`} onClick={onImprover} className="ml-1 text-[#6B8E62] font-bold align-super" title={t("improver_link_title")}>*</button>
                      )}
                    </span>
                    <span className="font-mono-data font-semibold text-[#8C3A1D] dark:text-[#E5AC3A]">{v}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {r.procedure ? (
          <div data-testid={`recipe-procedure-${r.id}`} className="rounded-xl bg-[#6B8E62]/10 border border-[#6B8E62]/25 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#4d6b45] dark:text-[#9ec48f] mb-1.5">{t("recipe_procedure")}</p>
            <p className="text-sm text-[#4A3B34] dark:text-[#C9BBB0] leading-relaxed whitespace-pre-line">{rLoc(r, "procedure", lang)}</p>
          </div>
        ) : null}

        {r.locked && (
          <div data-testid={`recipe-teaser-${r.id}`} className="rounded-2xl bg-gradient-to-br from-[#B34A26] to-[#8C3A1D] text-white p-5 text-center shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-white/15 border border-white/30 flex items-center justify-center mx-auto mb-3">
              <Lock className="w-6 h-6" />
            </div>
            <p className="font-display text-lg font-bold">
              {de ? "Vollständiges Rezept mit PRO freischalten" : "Sblocca la ricetta completa con PRO"}
            </p>
            <p className="text-white/85 text-sm mt-1.5">
              {de ? "Prozedur Schritt für Schritt, alle Zutaten, Arbeitsphasen und Werkzeuge des Labors."
                  : "Procedimento passo-passo, tutti gli ingredienti, le fasi di lavorazione e gli strumenti del laboratorio."}
            </p>
            <button data-testid={`recipe-unlock-${r.id}`} onClick={onUnlock}
              className="mt-4 inline-flex items-center gap-2 bg-white text-[#8C3A1D] font-bold px-5 py-2.5 rounded-xl active:scale-97 transition-all">
              <Crown className="w-4 h-4" /> {de ? "PRO freischalten · €9,99/Monat" : "Passa a PRO · €9,99/mese"}
            </button>
          </div>
        )}

        {r.notes ? <p className="text-sm text-[#4A3B34] dark:text-[#C9BBB0] leading-relaxed whitespace-pre-line">{rLoc(r, "notes", lang)}</p> : null}

        <GlossaryBox text={`${r.procedure || ""} ${r.notes || ""}`} />

        {Array.isArray(r.work_phases) && r.work_phases.filter((p) => p && (p.name || p.time || p.temp)).length > 0 && (
          <div data-testid={`recipe-phases-${r.id}`} className="rounded-xl bg-[#B34A26]/8 border border-[#B34A26]/20 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#B34A26] mb-2">{t("work_phases_section")}</p>
            <div className="space-y-1.5">
              {r.work_phases.filter((p) => p && (p.name || p.time || p.temp)).map((p, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-[#4A3B34] dark:text-[#C9BBB0] font-medium">{p.name || `${t("phase_name_ph")} ${idx + 1}`}</span>
                  <span className="font-mono-data text-[#8C3A1D] dark:text-[#E5AC3A] shrink-0 ml-2">
                    {p.time ? p.time : ""}{p.time && p.temp ? " · " : ""}{p.temp ? `${fmtTemp(p.temp)}°C` : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {priceBlock}
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
      className="w-9 h-9 rounded-lg bg-[#F5EFE6] dark:bg-[#332823] flex items-center justify-center active:scale-95"
      style={{ color }}
    >
      {children}
    </button>
  );
}

function Badge({ icon, children }) {
  return (
    <span className="inline-flex items-center gap-1 bg-[#D99B26]/15 text-[#8C3A1D] dark:text-[#E5AC3A] font-mono-data text-xs px-2.5 py-1 rounded-full font-bold border border-[#D99B26]/30">
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
function recipeCategory(r) {
  const name = (r.name || "").toLowerCase();
  if (/migliorator|backmittel/.test(name)) return { rank: 0, key: "backmittel", label: "cat_backmittel", icon: "✨" };
  if (/panettone/.test(name)) return { rank: 2, key: "panettoni", label: "cat_panettoni", icon: "🎁" };
  if (/puccia|bretzel|taralli|frisell|panino|panini/.test(name)) return { rank: 4, key: "panini", label: "cat_panini", icon: "🥖" };
  if (r.preferment_type === "lm") return { rank: 1, key: "lm", label: "cat_lm", icon: "🌾" };
  return { rank: 3, key: "pane", label: "cat_pane", icon: "🍞" };
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
    <div data-testid="recipe-glossary" className="rounded-xl bg-[#D99B26]/10 border border-[#D99B26]/30 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-[#8C3A1D] dark:text-[#E5AC3A] mb-1.5">{t("gloss_title")} *</p>
      <ul className="space-y-1.5">
        {found.map((g, i) => (
          <li key={i} className="text-xs text-[#4A3B34] dark:text-[#C9BBB0] leading-relaxed">* {lang === "de" ? g.de : g.it}</li>
        ))}
      </ul>
    </div>
  );
}
