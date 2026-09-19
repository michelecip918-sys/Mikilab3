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
      <DialogContent className="max-w-md bg-background dark:bg-background border-border dark:border-border">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-foreground dark:text-foreground flex items-center gap-2">
            <Scale className="w-6 h-6 text-primary" /> {t("scale_title")}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {recipe?.name} {t("scale_desc_suffix")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="grid grid-cols-2 gap-2">
            <button
              data-testid="scale-mode-total"
              onClick={() => setMode("total")}
              className={`px-3 py-2.5 rounded-2xl shadow-md border border-amber-900/40 text-sm font-medium border ${
                mode === "total"
                  ? "bg-primary text-white border-primary"
                  : "bg-card dark:bg-card text-muted-foreground border-border dark:border-border"
              }`}
            >
              {t("scale_mode_total")}
            </button>
            <button
              data-testid="scale-mode-flour"
              onClick={() => setMode("flour")}
              className={`px-3 py-2.5 rounded-2xl shadow-md border border-amber-900/40 text-sm font-medium border ${
                mode === "flour"
                  ? "bg-primary text-white border-primary"
                  : "bg-card dark:bg-card text-muted-foreground border-border dark:border-border"
              }`}
            >
              {t("scale_mode_flour")}
            </button>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {mode === "total" ? t("scale_target_total") : t("scale_target_flour")}
            </label>
            <input
              data-testid="scale-target-input"
              type="number"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="mt-1 w-full font-mono-data font-bold text-primary dark:text-muted-foreground bg-card dark:bg-card border border-border dark:border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-2xl shadow-md border border-amber-900/40 p-3 text-lg outline-none"
            />
          </div>

          <div className="space-y-2" data-testid="scale-preview">
            {scaled.map((f) => (
              <div key={f.key} className="flex items-center justify-between bg-card dark:bg-card border border-border dark:border-border rounded-2xl shadow-md border border-amber-900/40 px-4 py-2.5">
                <span className="text-sm text-muted-foreground dark:text-muted-foreground">{t(f.labelKey)}</span>
                <span className="font-mono-data font-bold text-primary dark:text-muted-foreground">
                  {f.value != null ? `${f.value} g` : "—"}
                </span>
              </div>
            ))}
            {factor && (
              <div className="flex items-center justify-between px-4 pt-1">
                <span className="text-xs text-muted-foreground">{t("scale_total_dough")}</span>
                <span className="font-mono-data text-xs font-bold text-muted-foreground">{Math.round(newTotal)} g</span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <button
            onClick={() => onOpenChange(false)}
            className="flex-1 bg-muted dark:bg-card text-foreground dark:text-foreground font-medium px-4 py-3 rounded-2xl shadow-md border border-amber-900/40 border border-border dark:border-border"
          >
            {t("cancel")}
          </button>
          <button
            data-testid="scale-save-btn"
            onClick={submit}
            disabled={!factor}
            className="flex-1 bg-primary hover:bg-accent disabled:opacity-50 text-white font-semibold px-4 py-3 rounded-2xl shadow-md border border-amber-900/40 shadow-md active:scale-98 transition-all"
          >
            {t("save_as_new")}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
