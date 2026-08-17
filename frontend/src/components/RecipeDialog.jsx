import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";

const FIELDS = [
  { key: "flour_grams", label: "Farina (g)", type: "number" },
  { key: "water_grams", label: "Acqua (g)", type: "number" },
  { key: "sourdough_grams", label: "Lievito madre (g)", type: "number" },
  { key: "salt_grams", label: "Sale (g)", type: "number" },
  { key: "bulk_fermentation_hours", label: "Lievitazione (h)", type: "number" },
  { key: "proofing_hours", label: "Appretto (h)", type: "number" },
];

const empty = {
  name: "", flour_type: "", flour_grams: "", water_grams: "",
  sourdough_grams: "", salt_grams: "", bulk_fermentation_hours: "",
  proofing_hours: "", notes: "",
};

export default function RecipeDialog({ open, onOpenChange, initial, onSave }) {
  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (open) {
      setForm(initial ? { ...empty, ...normalize(initial) } : empty);
    }
  }, [open, initial]);

  const hydration =
    Number(form.flour_grams) > 0 && Number(form.water_grams) > 0
      ? Math.round((Number(form.water_grams) / Number(form.flour_grams)) * 100)
      : null;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    if (!form.name.trim()) return;
    const payload = { name: form.name.trim(), flour_type: form.flour_type, notes: form.notes };
    FIELDS.forEach(({ key }) => {
      payload[key] = form[key] === "" ? null : Number(form[key]);
    });
    payload.hydration_percent = hydration;
    onSave(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto thin-scroll bg-[#FDFBF7] dark:bg-[#1A1412] border-[#E8DEC8] dark:border-[#3D302A]">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-[#2C221E] dark:text-[#F5EFE6]">
            {initial ? "Modifica ricetta" : "Nuova ricetta"}
          </DialogTitle>
          <DialogDescription className="text-[#8C7567]">
            Inserisci dosi, idratazione e tempi. L'idratazione si calcola da sola.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-[#8C7567]">Nome</label>
            <input
              data-testid="recipe-name-input"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Es. Pane rustico"
              className="mt-1 w-full bg-white dark:bg-[#241D19] border border-[#E8DEC8] dark:border-[#3D302A] focus:border-[#B34A26] focus:ring-2 focus:ring-[#B34A26]/20 rounded-xl p-3 text-base outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-[#8C7567]">Tipo di farina</label>
            <input
              data-testid="recipe-flour-input"
              value={form.flour_type}
              onChange={(e) => set("flour_type", e.target.value)}
              placeholder="Es. Tipo 1 / Type 812"
              className="mt-1 w-full bg-white dark:bg-[#241D19] border border-[#E8DEC8] dark:border-[#3D302A] focus:border-[#B34A26] focus:ring-2 focus:ring-[#B34A26]/20 rounded-xl p-3 text-base outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {FIELDS.map(({ key, label }) => (
              <div key={key}>
                <label className="text-xs font-semibold uppercase tracking-wide text-[#8C7567]">{label}</label>
                <input
                  data-testid={`recipe-${key}-input`}
                  type="number"
                  value={form[key]}
                  onChange={(e) => set(key, e.target.value)}
                  className="mt-1 w-full font-mono-data bg-white dark:bg-[#241D19] border border-[#E8DEC8] dark:border-[#3D302A] focus:border-[#B34A26] focus:ring-2 focus:ring-[#B34A26]/20 rounded-xl p-3 text-base outline-none"
                />
              </div>
            ))}
          </div>

          {hydration != null && (
            <div className="flex items-center justify-between bg-[#D99B26]/15 border border-[#D99B26]/30 rounded-xl px-4 py-2.5">
              <span className="text-sm font-medium text-[#4A3B34] dark:text-[#E5AC3A]">Idratazione</span>
              <span data-testid="recipe-hydration" className="font-mono-data font-bold text-[#8C3A1D] dark:text-[#E5AC3A]">
                {hydration}%
              </span>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-[#8C7567]">Note</label>
            <textarea
              data-testid="recipe-notes-input"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={3}
              className="mt-1 w-full bg-white dark:bg-[#241D19] border border-[#E8DEC8] dark:border-[#3D302A] focus:border-[#B34A26] focus:ring-2 focus:ring-[#B34A26]/20 rounded-xl p-3 text-base outline-none resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <button
            data-testid="recipe-cancel-btn"
            onClick={() => onOpenChange(false)}
            className="flex-1 bg-[#F5EFE6] dark:bg-[#332823] text-[#2C221E] dark:text-[#F5EFE6] font-medium px-4 py-3 rounded-xl border border-[#E8DEC8] dark:border-[#3D302A]"
          >
            Annulla
          </button>
          <button
            data-testid="recipe-save-btn"
            onClick={submit}
            className="flex-1 bg-[#B34A26] hover:bg-[#963B1C] text-white font-semibold px-4 py-3 rounded-xl shadow-md active:scale-98 transition-all"
          >
            Salva
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function normalize(r) {
  const out = { ...r };
  ["flour_grams", "water_grams", "sourdough_grams", "salt_grams", "bulk_fermentation_hours", "proofing_hours"].forEach((k) => {
    out[k] = r[k] == null ? "" : r[k];
  });
  return out;
}
