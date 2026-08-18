import { useState, useEffect, useMemo } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Scale } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";

const GRAM_FIELDS = [
  { key: "flour_grams", labelKey: "ing_flour" },
  { key: "water_grams", labelKey: "ing_water" },
  { key: "sourdough_grams", labelKey: "ing_sourdough" },
  { key: "salt_grams", labelKey: "ing_salt" },
];

export default function ScaleDialog({ recipe, open, onOpenChange, onSave }) {
  const [mode, setMode] = useState("total"); // "total" | "flour"
  const [target, setTarget] = useState("");
  const { t } = useLang();

  const currentTotal = useMemo(() => {
    if (!recipe) return 0;
    return GRAM_FIELDS.reduce((s, f) => s + Number(recipe[f.key] || 0), 0);
  }, [recipe]);

  const currentFlour = Number(recipe?.flour_grams || 0);

  useEffect(() => {
    if (open && recipe) {
      setMode("total");
      setTarget(String(Math.round(currentTotal) || ""));
    }
  }, [open, recipe, currentTotal]);

  const base = mode === "total" ? currentTotal : currentFlour;
  const factor = base > 0 && Number(target) > 0 ? Number(target) / base : null;

  const scaled = GRAM_FIELDS.map((f) => ({
    ...f,
    value: recipe?.[f.key] != null && factor ? Math.round(recipe[f.key] * factor) : null,
  }));

  const newTotal = scaled.reduce((s, f) => s + (f.value || 0), 0);

  const submit = () => {
    if (!factor) return;
    const payload = {
      name: `${recipe.name} (${Math.round(newTotal)}g)`,
      flour_type: recipe.flour_type,
      notes: recipe.notes,
      hydration_percent: recipe.hydration_percent,
      bulk_fermentation_hours: recipe.bulk_fermentation_hours,
      proofing_hours: recipe.proofing_hours,
      preferment_type: recipe.preferment_type || null,
      mix_minutes: recipe.mix_minutes ?? null,
      bake_temp: recipe.bake_temp ?? null,
      bake_minutes: recipe.bake_minutes ?? null,
      oven_type: recipe.oven_type || null,
      costing: recipe.costing || null,
    };
    GRAM_FIELDS.forEach(({ key }) => {
      payload[key] = recipe[key] != null ? Math.round(recipe[key] * factor) : null;
    });
    onSave(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-[#FDFBF7] dark:bg-[#1A1412] border-[#E8DEC8] dark:border-[#3D302A]">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-[#2C221E] dark:text-[#F5EFE6] flex items-center gap-2">
            <Scale className="w-6 h-6 text-[#6B8E62]" /> {t("scale_title")}
          </DialogTitle>
          <DialogDescription className="text-[#8C7567]">
            {recipe?.name} {t("scale_desc_suffix")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="grid grid-cols-2 gap-2">
            <button
              data-testid="scale-mode-total"
              onClick={() => setMode("total")}
              className={`px-3 py-2.5 rounded-xl text-sm font-medium border ${
                mode === "total"
                  ? "bg-[#B34A26] text-white border-[#B34A26]"
                  : "bg-white dark:bg-[#2A211D] text-[#8C7567] border-[#E8DEC8] dark:border-[#3D302A]"
              }`}
            >
              {t("scale_mode_total")}
            </button>
            <button
              data-testid="scale-mode-flour"
              onClick={() => setMode("flour")}
              className={`px-3 py-2.5 rounded-xl text-sm font-medium border ${
                mode === "flour"
                  ? "bg-[#B34A26] text-white border-[#B34A26]"
                  : "bg-white dark:bg-[#2A211D] text-[#8C7567] border-[#E8DEC8] dark:border-[#3D302A]"
              }`}
            >
              {t("scale_mode_flour")}
            </button>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-[#8C7567]">
              {mode === "total" ? t("scale_target_total") : t("scale_target_flour")}
            </label>
            <input
              data-testid="scale-target-input"
              type="number"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="mt-1 w-full font-mono-data font-bold text-[#8C3A1D] dark:text-[#E5AC3A] bg-white dark:bg-[#241D19] border border-[#E8DEC8] dark:border-[#3D302A] focus:border-[#B34A26] focus:ring-2 focus:ring-[#B34A26]/20 rounded-xl p-3 text-lg outline-none"
            />
          </div>

          <div className="space-y-2" data-testid="scale-preview">
            {scaled.map((f) => (
              <div key={f.key} className="flex items-center justify-between bg-white dark:bg-[#2A211D] border border-[#E8DEC8] dark:border-[#3D302A] rounded-xl px-4 py-2.5">
                <span className="text-sm text-[#4A3B34] dark:text-[#C9BBB0]">{t(f.labelKey)}</span>
                <span className="font-mono-data font-bold text-[#8C3A1D] dark:text-[#E5AC3A]">
                  {f.value != null ? `${f.value} g` : "—"}
                </span>
              </div>
            ))}
            {factor && (
              <div className="flex items-center justify-between px-4 pt-1">
                <span className="text-xs text-[#8C7567]">{t("scale_total_dough")}</span>
                <span className="font-mono-data text-xs font-bold text-[#8C7567]">{Math.round(newTotal)} g</span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <button
            onClick={() => onOpenChange(false)}
            className="flex-1 bg-[#F5EFE6] dark:bg-[#332823] text-[#2C221E] dark:text-[#F5EFE6] font-medium px-4 py-3 rounded-xl border border-[#E8DEC8] dark:border-[#3D302A]"
          >
            {t("cancel")}
          </button>
          <button
            data-testid="scale-save-btn"
            onClick={submit}
            disabled={!factor}
            className="flex-1 bg-[#B34A26] hover:bg-[#963B1C] disabled:opacity-50 text-white font-semibold px-4 py-3 rounded-xl shadow-md active:scale-98 transition-all"
          >
            {t("save_as_new")}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
