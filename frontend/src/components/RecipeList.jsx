import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Wheat, Droplets, Clock, Copy, Scale, Flame, Layers } from "lucide-react";
import { recipesApi } from "@/lib/api";
import RecipeDialog from "@/components/RecipeDialog";
import ScaleDialog from "@/components/ScaleDialog";
import { useLang } from "@/i18n/LanguageContext";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function RecipeList({ collectionName, heroImage, heroTitle, heroSubtitle, emptyText, readOnly = false }) {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [scaling, setScaling] = useState(null);
  const { t } = useLang();

  const load = async () => {
    setLoading(true);
    try {
      setRecipes(await recipesApi.list(collectionName));
    } catch {
      toast.error(t("toast_load_error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [collectionName]);

  const handleSave = async (payload) => {
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

  return (
    <div className="pb-4">
      <div className="relative rounded-3xl overflow-hidden mb-5 h-40">
        <img src={heroImage} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#2C221E]/85 via-[#2C221E]/30 to-transparent" />
        <div className="absolute bottom-0 left-0 p-5">
          <h1 className="font-display text-3xl font-bold text-white">{heroTitle}</h1>
          <p className="text-white/85 text-sm mt-0.5">{heroSubtitle}</p>
        </div>
      </div>

      {!readOnly && (
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
        <div className="space-y-3">
          {recipes.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              data-testid={`recipe-card-${r.id}`}
              className="relative overflow-hidden bg-white dark:bg-[#2A211D] border border-[#E8DEC8] dark:border-[#3D302A] rounded-2xl p-5 shadow-sm"
            >
              {r.image_url && (
                <div
                  aria-hidden
                  className="absolute inset-0 bg-cover bg-center opacity-[0.10] dark:opacity-[0.16] pointer-events-none"
                  style={{ backgroundImage: `url(${r.image_url})` }}
                />
              )}
              <div className="relative z-10">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-display text-xl font-semibold text-[#2C221E] dark:text-[#F5EFE6] truncate">
                    {r.name}
                  </h3>
                  {r.flour_type ? (
                    <p className="text-sm text-[#8C7567] mt-0.5">{r.flour_type}</p>
                  ) : null}
                </div>
                <div className="flex gap-1.5 shrink-0">
                  {!readOnly && (<>
                  <button
                    data-testid={`scale-recipe-${r.id}`}
                    onClick={() => setScaling(r)}
                    className="w-9 h-9 rounded-lg bg-[#F5EFE6] dark:bg-[#332823] flex items-center justify-center text-[#6B8E62] active:scale-95"
                    aria-label={t("scale_aria")}
                  >
                    <Scale className="w-4 h-4" />
                  </button>
                  <button
                    data-testid={`duplicate-recipe-${r.id}`}
                    onClick={() => handleDuplicate(r)}
                    className="w-9 h-9 rounded-lg bg-[#F5EFE6] dark:bg-[#332823] flex items-center justify-center text-[#8C7567] active:scale-95"
                    aria-label={t("duplicate_aria")}
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    data-testid={`edit-recipe-${r.id}`}
                    onClick={() => { setEditing(r); setDialogOpen(true); }}
                    className="w-9 h-9 rounded-lg bg-[#F5EFE6] dark:bg-[#332823] flex items-center justify-center text-[#B34A26] active:scale-95"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    data-testid={`delete-recipe-${r.id}`}
                    onClick={() => setToDelete(r)}
                    className="w-9 h-9 rounded-lg bg-[#F5EFE6] dark:bg-[#332823] flex items-center justify-center text-[#B4442A] active:scale-95"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  </>)}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                {r.hydration_percent != null && (
                  <Badge icon={<Droplets className="w-3.5 h-3.5" />}>{r.hydration_percent}% {t("badge_hydration")}</Badge>
                )}
                {r.flour_grams != null && (
                  <Badge icon={<Wheat className="w-3.5 h-3.5" />}>{r.flour_grams}g {t("badge_flour")}</Badge>
                )}
                {r.bulk_fermentation_hours != null && (
                  <Badge icon={<Clock className="w-3.5 h-3.5" />}>{r.bulk_fermentation_hours}h {t("badge_ferment")}</Badge>
                )}
                {r.bake_temp != null && (
                  <Badge icon={<Flame className="w-3.5 h-3.5" />}>
                    {r.bake_temp}°{r.bake_minutes != null ? ` · ${r.bake_minutes}′` : ""} {r.oven_type === "ventilato" ? t("oven_type_fan") : r.oven_type === "rotor" ? t("oven_type_rotor") : t("oven_type_static")}
                  </Badge>
                )}
                {r.method_type && (
                  <Badge icon={<Layers className="w-3.5 h-3.5" />}>
                    {r.method_type === "diretto" ? t("method_diretto") : t("method_indiretto")}
                  </Badge>
                )}
              </div>

              {(() => {
                const rows = [];
                if (r.flour_grams != null) rows.push([t("ing_flour"), `${r.flour_grams} g`]);
                if (r.water_grams != null) rows.push([t("ing_water"), `${r.water_grams} g${r.hydration_percent != null ? ` (${r.hydration_percent}%)` : ""}`]);
                if (r.sourdough_grams) rows.push([`${t("ing_preferment")}${r.preferment_type && r.preferment_type !== "none" ? ` (${t(`pf_${r.preferment_type}`)})` : ""}`, `${r.sourdough_grams} g`]);
                if (r.salt_grams != null) rows.push([t("ing_salt"), `${r.salt_grams} g`]);
                (r.costing?.extras || []).forEach((e) => { if (e.name) rows.push([e.name, e.cost ? `€ ${e.cost}` : "—"]); });
                const rest = (Number(r.bulk_fermentation_hours) || 0) + (Number(r.proofing_hours) || 0);
                const proc = [];
                if (r.mix_minutes != null) proc.push(`${t("proc_mix")} ${r.mix_minutes}′`);
                if (rest > 0) proc.push(`${t("proc_rest")} ${rest}h`);
                if (r.bake_temp != null) proc.push(`${t("proc_bake")} ${r.bake_temp}°${r.bake_minutes != null ? `/${r.bake_minutes}′` : ""}`);
                if (rows.length === 0) return null;
                return (
                  <div data-testid={`recipe-ingredients-${r.id}`} className="mt-3 rounded-xl bg-[#F5EFE6] dark:bg-[#332823] p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[#B34A26] mb-1.5">{t("recipe_ingredients")}</p>
                    <div className="space-y-1">
                      {rows.map(([k, v], idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span className="text-[#4A3B34] dark:text-[#C9BBB0]">{k}</span>
                          <span className="font-mono-data font-semibold text-[#8C3A1D] dark:text-[#E5AC3A]">{v}</span>
                        </div>
                      ))}
                    </div>
                    {proc.length > 0 && (
                      <p className="text-xs text-[#8C7567] mt-2 pt-2 border-t border-[#E8DEC8]/70 dark:border-[#3D302A]">
                        <span className="font-semibold">{t("recipe_process")}:</span> {proc.join(" · ")}
                      </p>
                    )}
                  </div>
                );
              })()}

              {r.notes ? (
                <p className="text-sm text-[#4A3B34] dark:text-[#C9BBB0] mt-3 leading-relaxed whitespace-pre-line">{r.notes}</p>
              ) : null}

              {(() => {
                const cst = r.costing;
                if (!cst || readOnly) return null;
                const n = (v) => Number(v) || 0;
                const total = n(r.flour_grams) / 1000 * n(cst.flour_kg) + n(r.water_grams) / 1000 * n(cst.water_l)
                  + n(r.sourdough_grams) / 1000 * n(cst.sourdough_kg) + n(r.salt_grams) / 1000 * n(cst.salt_kg)
                  + (cst.extras || []).reduce((s, e) => s + n(e.cost), 0) + n(cst.overhead);
                const pcs = n(cst.pieces);
                if (total <= 0) return null;
                const perPiece = pcs > 0 ? total / pcs : null;
                return (
                  <div data-testid={`recipe-price-${r.id}`} className="mt-3 rounded-xl px-3 py-2 border bg-[#D99B26]/10 border-[#D99B26]/30">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-[#4A3B34] dark:text-[#C9BBB0]">{t("cost_total")}</span>
                      <span className="font-mono-data text-sm font-bold text-[#8C3A1D] dark:text-[#E5AC3A]">€ {total.toFixed(2)}</span>
                    </div>
                    {perPiece != null && (
                      <div className="flex items-center justify-between mt-1 pt-1 border-t border-[#E8DEC8]/60 dark:border-[#3D302A]">
                        <span className="text-xs text-[#8C7567]">{t("cost_per_piece")}</span>
                        <span className="font-mono-data text-sm font-bold text-[#8C3A1D] dark:text-[#E5AC3A]">€ {perPiece.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                );
              })()}
              </div>
            </motion.div>
          ))}
        </div>
      )}

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

function Badge({ icon, children }) {
  return (
    <span className="inline-flex items-center gap-1 bg-[#D99B26]/15 text-[#8C3A1D] dark:text-[#E5AC3A] font-mono-data text-xs px-2.5 py-1 rounded-full font-bold border border-[#D99B26]/30">
      {icon}
      {children}
    </span>
  );
}
