import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { useLang } from "@/i18n/LanguageContext";
import { Camera, X } from "lucide-react";
import { COUNTRIES, flagEmoji } from "@/lib/countries";
import { STANDARD_PRICES, standardCosting } from "@/data/prices";

const FIELDS = [
  { key: "flour_grams", labelKey: "field_flour_g" },
  { key: "water_grams", labelKey: "field_water_g" },
  { key: "sourdough_grams", labelKey: "field_preferment_g" },
  { key: "salt_grams", labelKey: "field_salt_g" },
  { key: "bulk_fermentation_hours", labelKey: "field_bulk_h" },
  { key: "proofing_hours", labelKey: "field_proof_h" },
];

const PREFERMENTS = ["none", "poolish", "lm", "licoli", "biga", "altro"];
const OVEN_TYPES = ["statico", "ventilato", "rotor"];
const PCT_FIELDS = new Set(["water_grams", "sourdough_grams", "salt_grams"]);
const HOUR_FIELDS = new Set(["bulk_fermentation_hours", "proofing_hours"]);

const emptyCost = standardCosting();

const empty = {
  name: "", flour_type: "", origin: "", dough_category: "", water_temp_c: "", preferment_type: "lm", flour_grams: "", water_grams: "",
  sourdough_grams: "", salt_grams: "", bulk_fermentation_hours: "",
  proofing_hours: "", mix_minutes: "", bake_temp: "", bake_minutes: "",
  oven_type: "statico", method_type: "indiretto", notes: "", procedure: "", image_url: "", extra_ingredients: [], work_phases: [], costing: standardCosting(),
};

export default function RecipeDialog({ open, onOpenChange, initial, onSave }) {
  const [form, setForm] = useState(empty);
  const [pctMode, setPctMode] = useState(false);
  const { t } = useLang();

  useEffect(() => {
    if (open) {
      setForm(initial ? { ...empty, ...normalize(initial) } : empty);
      setPctMode(false);
    }
  }, [open, initial]);

  const hydration =
    Number(form.flour_grams) > 0 && Number(form.water_grams) > 0
      ? Math.round((Number(form.water_grams) / Number(form.flour_grams)) * 100)
      : null;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const c = form.costing || emptyCost;
  const setC = (k, v) => setForm((f) => ({ ...f, costing: { ...(f.costing || emptyCost), [k]: v } }));
  const setExtra = (i, patch) => setForm((f) => {
    const extras = [...((f.costing || emptyCost).extras || [])];
    extras[i] = { ...extras[i], ...patch };
    return { ...f, costing: { ...(f.costing || emptyCost), extras } };
  });
  const addExtra = () => setForm((f) => ({ ...f, costing: { ...(f.costing || emptyCost), extras: [...((f.costing || emptyCost).extras || []), { name: "", cost: "" }] } }));
  const removeExtra = (i) => setForm((f) => {
    const extras = ((f.costing || emptyCost).extras || []).filter((_, idx) => idx !== i);
    return { ...f, costing: { ...(f.costing || emptyCost), extras } };
  });

  const setIng = (i, patch) => setForm((f) => {
    const list = [...(f.extra_ingredients || [])];
    list[i] = { ...list[i], ...patch };
    return { ...f, extra_ingredients: list };
  });
  const addIng = () => setForm((f) => ({ ...f, extra_ingredients: [...(f.extra_ingredients || []), { name: "", percent: "" }] }));
  const removeIng = (i) => setForm((f) => ({ ...f, extra_ingredients: (f.extra_ingredients || []).filter((_, idx) => idx !== i) }));

  const setPhase = (i, patch) => setForm((f) => { const l = [...(f.work_phases || [])]; l[i] = { ...l[i], ...patch }; return { ...f, work_phases: l }; });
  const addPhase = () => setForm((f) => ({ ...f, work_phases: [...(f.work_phases || []), { name: "", time: "", temp: "" }] }));
  const removePhase = (i) => setForm((f) => ({ ...f, work_phases: (f.work_phases || []).filter((_, idx) => idx !== i) }));
  const onPhoto = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 1024; let w = img.width, h = img.height;
        if (w > h && w > max) { h = Math.round(h * max / w); w = max; }
        else if (h > max) { w = Math.round(w * max / h); h = max; }
        const c = document.createElement("canvas"); c.width = w; c.height = h;
        c.getContext("2d").drawImage(img, 0, 0, w, h);
        set("image_url", c.toDataURL("image/jpeg", 0.8));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };


  const num = (v) => (v === "" || v == null ? 0 : Number(v) || 0);
  const prodCost =
    num(form.flour_grams) / 1000 * num(c.flour_kg) +
    num(form.water_grams) / 1000 * num(c.water_l) +
    num(form.sourdough_grams) / 1000 * num(c.sourdough_kg) +
    num(form.salt_grams) / 1000 * num(c.salt_kg) +
    (c.extras || []).reduce((s, e) => s + num(e.cost), 0) +
    num(c.overhead);
  const pieces = num(c.pieces);
  const costPerPiece = pieces > 0 ? prodCost / pieces : null;

  const submit = () => {
    if (!form.name.trim()) return;
    const payload = {
      name: form.name.trim(), flour_type: form.flour_type, origin: form.origin || null, dough_category: form.dough_category || null, water_temp_c: form.water_temp_c === "" || form.water_temp_c == null ? null : Number(form.water_temp_c), notes: form.notes, procedure: form.procedure,
      preferment_type: form.preferment_type || null,
      oven_type: form.oven_type || null,
      method_type: form.method_type || null,
      mix_minutes: form.mix_minutes === "" ? null : Number(form.mix_minutes),
      bake_temp: form.bake_temp === "" ? null : Number(form.bake_temp),
      bake_minutes: form.bake_minutes === "" ? null : Number(form.bake_minutes),
    };
    FIELDS.forEach(({ key }) => {
      payload[key] = form[key] === "" ? null : Number(form[key]);
    });
    payload.hydration_percent = hydration;
    payload.extra_ingredients = (form.extra_ingredients || [])
      .filter((e) => (e.name || "").trim() || e.percent !== "")
      .map((e) => ({ name: (e.name || "").trim(), percent: e.percent === "" || e.percent == null ? null : Number(e.percent) }));
    payload.image_url = form.image_url || null;
    payload.work_phases = (form.work_phases || [])
      .filter((p) => (p.name || "").trim() || p.time !== "" || p.temp !== "")
      .map((p) => ({ name: (p.name || "").trim(), time: p.time === "" || p.time == null ? null : String(p.time), temp: p.temp === "" || p.temp == null ? null : String(p.temp) }));
    payload.costing = {
      flour_kg: num(c.flour_kg), water_l: num(c.water_l), sourdough_kg: num(c.sourdough_kg), salt_kg: num(c.salt_kg),
      extras: (c.extras || []).filter((e) => e.name || e.cost).map((e) => ({ name: e.name || "", cost: num(e.cost) })),
      overhead: num(c.overhead), pieces: num(c.pieces), markup: num(c.markup),
    };
    onSave(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto thin-scroll bg-[#FDFBF7] dark:bg-[#1A1412] border-[#E8DEC8] dark:border-[#3D302A]">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-[#2C221E] dark:text-[#F5EFE6]">
            {initial ? t("edit_recipe") : t("new_recipe")}
          </DialogTitle>
          <DialogDescription className="text-[#8C7567]">
            {t("recipe_dialog_desc")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-[#8C7567]">{t("field_name")}</label>
            <input
              data-testid="recipe-name-input"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder={t("field_name_ph")}
              className="mt-1 w-full bg-white dark:bg-[#241D19] border border-[#E8DEC8] dark:border-[#3D302A] focus:border-[#B34A26] focus:ring-2 focus:ring-[#B34A26]/20 rounded-xl p-3 text-base outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-[#8C7567]">{t("field_flour")}</label>
            <input
              data-testid="recipe-flour-input"
              value={form.flour_type}
              onChange={(e) => set("flour_type", e.target.value)}
              placeholder={t("field_flour_ph")}
              className="mt-1 w-full bg-white dark:bg-[#241D19] border border-[#E8DEC8] dark:border-[#3D302A] focus:border-[#B34A26] focus:ring-2 focus:ring-[#B34A26]/20 rounded-xl p-3 text-base outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-[#8C7567]">{t("field_origin")}</label>
            <select
              data-testid="recipe-origin-select"
              value={form.origin || ""}
              onChange={(e) => set("origin", e.target.value)}
              className="mt-1 w-full bg-white dark:bg-[#241D19] border border-[#E8DEC8] dark:border-[#3D302A] focus:border-[#B34A26] rounded-xl p-3 text-base outline-none"
            >
              <option value="">{t("origin_none")}</option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{flagEmoji(c.code)} {c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-[#8C7567]">{t("field_dough_category")}</label>
            <select
              data-testid="recipe-dough-category-select"
              value={form.dough_category || ""}
              onChange={(e) => set("dough_category", e.target.value)}
              className="mt-1 w-full bg-white dark:bg-[#241D19] border border-[#E8DEC8] dark:border-[#3D302A] focus:border-[#B34A26] rounded-xl p-3 text-base outline-none"
            >
              <option value="">{t("dc_none")}</option>
              <option value="pre">{t("dc_pre")}</option>
              <option value="lm">{t("dc_lm")}</option>
              <option value="diretto">{t("dc_diretto")}</option>
              <option value="rinfresco">{t("dc_rinfresco")}</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-[#8C7567]">{t("field_water_temp")}</label>
            <input
              data-testid="recipe-water-temp-input"
              type="number" step="0.5" value={form.water_temp_c ?? ""}
              onChange={(e) => set("water_temp_c", e.target.value)}
              className="mt-1 w-full bg-white dark:bg-[#241D19] border border-[#E8DEC8] dark:border-[#3D302A] focus:border-[#B34A26] rounded-xl p-3 text-base outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-[#8C7567]">{t("field_preferment")}</label>
            <select
              data-testid="recipe-preferment-select"
              value={form.preferment_type || "none"}
              onChange={(e) => set("preferment_type", e.target.value)}
              className="mt-1 w-full bg-white dark:bg-[#241D19] border border-[#E8DEC8] dark:border-[#3D302A] focus:border-[#B34A26] rounded-xl p-3 text-base outline-none"
            >
              {PREFERMENTS.map((p) => (
                <option key={p} value={p}>{t(`pf_${p}`)}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#8C7567]">{t("dose_mode")}</span>
            <div className="flex items-center bg-[#F5EFE6] dark:bg-[#332823] rounded-xl border border-[#E8DEC8] dark:border-[#3D302A] p-0.5">
              {[["grams", "dose_grams"], ["pct", "dose_pct"]].map(([m, lk]) => (
                <button
                  key={m} type="button"
                  data-testid={`dose-mode-${m}`}
                  onClick={() => setPctMode(m === "pct")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    (pctMode ? "pct" : "grams") === m ? "bg-[#B34A26] text-white shadow-sm" : "text-[#8C7567]"
                  }`}
                >
                  {t(lk)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {FIELDS.map(({ key, labelKey }) => {
              const isPctField = pctMode && PCT_FIELDS.has(key);
              const flourG = Number(form.flour_grams) || 0;
              const displayVal = isPctField
                ? (flourG > 0 && form[key] !== "" && form[key] != null ? Math.round((Number(form[key]) / flourG) * 1000) / 10 : "")
                : form[key];
              const onCh = (v) => {
                if (isPctField) {
                  if (v === "") { set(key, ""); return; }
                  const grams = flourG > 0 ? Math.round(flourG * (Number(v) / 100)) : "";
                  set(key, grams);
                } else {
                  set(key, v);
                }
              };
              const unit = HOUR_FIELDS.has(key) ? "h" : isPctField ? "%" : "g";
              return (
                <div key={key}>
                  <label className="text-xs font-semibold uppercase tracking-wide text-[#8C7567]">{t(labelKey)}</label>
                  <div className="relative mt-1">
                    <input
                      data-testid={`recipe-${key}-input`}
                      type="number"
                      value={displayVal}
                      onChange={(e) => onCh(e.target.value)}
                      className="w-full font-mono-data bg-white dark:bg-[#241D19] border border-[#E8DEC8] dark:border-[#3D302A] focus:border-[#B34A26] focus:ring-2 focus:ring-[#B34A26]/20 rounded-xl p-3 pr-8 text-base outline-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8C7567] pointer-events-none">{unit}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {hydration != null && (
            <div className="flex items-center justify-between bg-[#D99B26]/15 border border-[#D99B26]/30 rounded-xl px-4 py-2.5">
              <span className="text-sm font-medium text-[#4A3B34] dark:text-[#E5AC3A]">{t("hydration")}</span>
              <span data-testid="recipe-hydration" className="font-mono-data font-bold text-[#8C3A1D] dark:text-[#E5AC3A]">
                {hydration}%
              </span>
            </div>
          )}

          {/* Lavorazione e cottura */}
          <div className="pt-1">
            <p className="text-xs font-bold uppercase tracking-wide text-[#B34A26] mb-2">{t("work_bake_section")}</p>
            <div className="mb-3">
              <label className="text-[10px] font-semibold uppercase tracking-wide text-[#8C7567]">{t("field_method")}</label>
              <select
                data-testid="recipe-method-select" value={form.method_type || "indiretto"}
                onChange={(e) => set("method_type", e.target.value)}
                className="mt-1 w-full bg-white dark:bg-[#241D19] border border-[#E8DEC8] dark:border-[#3D302A] focus:border-[#B34A26] rounded-xl p-3 text-base outline-none"
              >
                <option value="indiretto">{t("method_indiretto")}</option>
                <option value="diretto">{t("method_diretto")}</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wide text-[#8C7567]">{t("field_mix_min")}</label>
                <input
                  data-testid="recipe-mix_minutes-input" type="number" value={form.mix_minutes}
                  onChange={(e) => set("mix_minutes", e.target.value)}
                  className="mt-1 w-full font-mono-data bg-white dark:bg-[#241D19] border border-[#E8DEC8] dark:border-[#3D302A] focus:border-[#B34A26] rounded-xl p-3 text-base outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wide text-[#8C7567]">{t("field_oven")}</label>
                <select
                  data-testid="recipe-oven-select" value={form.oven_type || "statico"}
                  onChange={(e) => set("oven_type", e.target.value)}
                  className="mt-1 w-full bg-white dark:bg-[#241D19] border border-[#E8DEC8] dark:border-[#3D302A] focus:border-[#B34A26] rounded-xl p-3 text-base outline-none"
                >
                  {OVEN_TYPES.map((o) => (
                    <option key={o} value={o}>{t(o === "ventilato" ? "oven_type_fan" : o === "rotor" ? "oven_type_rotor" : "oven_type_static")}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wide text-[#8C7567]">{t("field_bake_temp")}</label>
                <input
                  data-testid="recipe-bake_temp-input" type="number" value={form.bake_temp}
                  onChange={(e) => set("bake_temp", e.target.value)}
                  className="mt-1 w-full font-mono-data bg-white dark:bg-[#241D19] border border-[#E8DEC8] dark:border-[#3D302A] focus:border-[#B34A26] rounded-xl p-3 text-base outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wide text-[#8C7567]">{t("field_bake_min")}</label>
                <input
                  data-testid="recipe-bake_minutes-input" type="number" value={form.bake_minutes}
                  onChange={(e) => set("bake_minutes", e.target.value)}
                  className="mt-1 w-full font-mono-data bg-white dark:bg-[#241D19] border border-[#E8DEC8] dark:border-[#3D302A] focus:border-[#B34A26] rounded-xl p-3 text-base outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-[#8C7567]">{t("field_notes")}</label>
            <textarea
              data-testid="recipe-notes-input"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={3}
              className="mt-1 w-full bg-white dark:bg-[#241D19] border border-[#E8DEC8] dark:border-[#3D302A] focus:border-[#B34A26] focus:ring-2 focus:ring-[#B34A26]/20 rounded-xl p-3 text-base outline-none resize-none"
            />
          </div>

          {/* Procedimento passo-passo */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-[#8C7567]">{t("field_procedure")}</label>
            <textarea
              data-testid="recipe-procedure-input"
              value={form.procedure}
              onChange={(e) => set("procedure", e.target.value)}
              rows={5}
              className="mt-1 w-full bg-white dark:bg-[#241D19] border border-[#E8DEC8] dark:border-[#3D302A] focus:border-[#B34A26] focus:ring-2 focus:ring-[#B34A26]/20 rounded-xl p-3 text-base outline-none resize-none"
            />
          </div>

          {/* Foto ricetta (dalla fotocamera) */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-[#8C7567]">{t("field_photo")}</label>
            <div className="mt-1 flex items-center gap-3">
              {form.image_url ? <img src={form.image_url} alt="" className="w-16 h-16 rounded-xl object-cover border border-[#E8DEC8] dark:border-[#3D302A]" /> : null}
              <label data-testid="recipe-photo-input" className="cursor-pointer bg-[#F5EFE6] dark:bg-[#332823] border border-[#E8DEC8] dark:border-[#3D302A] rounded-xl px-4 py-2.5 text-sm font-medium flex items-center gap-2 text-[#2C221E] dark:text-[#F5EFE6]">
                <Camera className="w-4 h-4 text-[#B34A26]" /> {form.image_url ? t("photo_change") : t("photo_take")}
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={onPhoto} />
              </label>
              {form.image_url ? <button onClick={() => set("image_url", "")} className="text-[#B4442A] p-1"><X className="w-4 h-4" /></button> : null}
            </div>
          </div>

          {/* Fasi di lavorazione (impasto/riposo/lievitazione) */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-[#8C7567]">{t("work_phases_section")}</label>
            <div className="mt-1 space-y-1.5" data-testid="work-phases-section">
              {(form.work_phases || []).map((p, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    data-testid={`phase-name-${i}`} value={p.name} placeholder={t("phase_name_ph")}
                    onChange={(ev) => setPhase(i, { name: ev.target.value })}
                    className="flex-1 min-w-0 bg-white dark:bg-[#241D19] border border-[#E8DEC8] dark:border-[#3D302A] rounded-lg p-2 text-sm outline-none focus:border-[#B34A26]"
                  />
                  <input
                    data-testid={`phase-time-${i}`} value={p.time} placeholder={t("phase_time_ph")}
                    onChange={(ev) => setPhase(i, { time: ev.target.value })}
                    className="w-20 shrink-0 bg-white dark:bg-[#241D19] border border-[#E8DEC8] dark:border-[#3D302A] rounded-lg p-2 text-sm outline-none focus:border-[#B34A26]"
                  />
                  <div className="relative w-16 shrink-0">
                    <input
                      data-testid={`phase-temp-${i}`} type="number" value={p.temp} placeholder="°"
                      onChange={(ev) => setPhase(i, { temp: ev.target.value })}
                      className="w-full bg-white dark:bg-[#241D19] border border-[#E8DEC8] dark:border-[#3D302A] rounded-lg p-2 pr-5 text-sm outline-none focus:border-[#B34A26]"
                    />
                    <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs text-[#8C7567] pointer-events-none">°</span>
                  </div>
                  <button onClick={() => removePhase(i)} className="text-[#B4442A] p-1"><X className="w-4 h-4" /></button>
                </div>
              ))}
              <button data-testid="phase-add-btn" onClick={addPhase} className="text-sm font-medium text-[#B34A26] flex items-center gap-1">+ {t("work_phases_add")}</button>
            </div>
          </div>

          {/* Altri ingredienti (percentuale sul peso farina) */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-[#8C7567]">{t("ing_extra_section")}</label>
            <div className="mt-1 space-y-1.5" data-testid="extra-ingredients-section">
              {(form.extra_ingredients || []).map((e, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    data-testid={`extra-ing-name-${i}`} value={e.name} placeholder={t("ing_extra_name")}
                    onChange={(ev) => setIng(i, { name: ev.target.value })}
                    className="flex-1 min-w-0 bg-white dark:bg-[#241D19] border border-[#E8DEC8] dark:border-[#3D302A] rounded-lg p-2 text-sm outline-none focus:border-[#B34A26]"
                  />
                  <div className="relative w-24 shrink-0">
                    <input
                      data-testid={`extra-ing-pct-${i}`} type="number" step="0.1" value={e.percent} placeholder="%"
                      onChange={(ev) => setIng(i, { percent: ev.target.value })}
                      className="w-full text-right font-mono-data bg-white dark:bg-[#241D19] border border-[#E8DEC8] dark:border-[#3D302A] rounded-lg p-2 pr-6 text-sm outline-none focus:border-[#B34A26]"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[#8C7567] pointer-events-none">%</span>
                  </div>
                  <button onClick={() => removeIng(i)} className="text-[#B4442A] p-1" aria-label={t("delete")}>✕</button>
                </div>
              ))}
              <button data-testid="extra-ing-add-btn" onClick={addIng} className="text-sm font-medium text-[#B34A26] flex items-center gap-1">
                + {t("ing_extra_add")}
              </button>
            </div>
          </div>

          {/* Costi e prezzo di vendita */}
          <div className="pt-2 border-t border-[#E8DEC8] dark:border-[#3D302A]" data-testid="recipe-costing-section">
            <p className="text-xs font-bold uppercase tracking-wide text-[#B34A26] mb-2">{t("cost_section")}</p>
            <div className="flex items-start gap-2 mb-2 bg-[#D99B26]/12 border border-[#D99B26]/30 rounded-lg px-3 py-2">
              <p className="text-[11px] text-[#4A3B34] dark:text-[#C9BBB0] flex-1 leading-snug">{t("cost_auto_note")}</p>
              <button
                type="button" data-testid="cost-use-standard-btn"
                onClick={() => setForm((f) => ({ ...f, costing: { ...(f.costing || emptyCost), ...STANDARD_PRICES } }))}
                className="text-[11px] font-semibold text-[#B34A26] whitespace-nowrap shrink-0"
              >
                {t("cost_use_standard")}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[["flour_kg", "cost_flour_kg"], ["water_l", "cost_water_l"], ["sourdough_kg", "cost_sourdough_kg"], ["salt_kg", "cost_salt_kg"]].map(([k, lk]) => (
                <div key={k}>
                  <label className="text-[10px] font-semibold uppercase tracking-wide text-[#8C7567]">{t(lk)}</label>
                  <input
                    data-testid={`cost-${k}-input`} type="number" step="0.01" value={c[k]}
                    onChange={(e) => setC(k, e.target.value)}
                    className="mt-0.5 w-full font-mono-data bg-white dark:bg-[#241D19] border border-[#E8DEC8] dark:border-[#3D302A] rounded-lg p-2 text-sm outline-none focus:border-[#B34A26]"
                  />
                </div>
              ))}
            </div>

            <div className="mt-2 space-y-1.5">
              {(c.extras || []).map((e, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    data-testid={`cost-extra-name-${i}`} value={e.name} placeholder={t("cost_extra_name")}
                    onChange={(ev) => setExtra(i, { name: ev.target.value })}
                    className="flex-1 min-w-0 bg-white dark:bg-[#241D19] border border-[#E8DEC8] dark:border-[#3D302A] rounded-lg p-2 text-sm outline-none focus:border-[#B34A26]"
                  />
                  <input
                    data-testid={`cost-extra-price-${i}`} type="number" step="0.01" value={e.cost} placeholder="€"
                    onChange={(ev) => setExtra(i, { cost: ev.target.value })}
                    className="w-20 text-right font-mono-data bg-white dark:bg-[#241D19] border border-[#E8DEC8] dark:border-[#3D302A] rounded-lg p-2 text-sm outline-none focus:border-[#B34A26]"
                  />
                  <button onClick={() => removeExtra(i)} className="text-[#B4442A] p-1" aria-label={t("delete")}>✕</button>
                </div>
              ))}
              <button
                data-testid="cost-add-extra-btn" onClick={addExtra}
                className="text-sm font-medium text-[#B34A26] flex items-center gap-1"
              >
                + {t("cost_extra_add")}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              {[["overhead", "cost_overhead"], ["pieces", "cost_pieces"]].map(([k, lk]) => (
                <div key={k}>
                  <label className="text-[10px] font-semibold uppercase tracking-wide text-[#8C7567]">{t(lk)}</label>
                  <input
                    data-testid={`cost-${k}-input`} type="number" step="0.01" value={c[k]}
                    onChange={(e) => setC(k, e.target.value)}
                    className="mt-0.5 w-full font-mono-data bg-white dark:bg-[#241D19] border border-[#E8DEC8] dark:border-[#3D302A] rounded-lg p-2 text-sm outline-none focus:border-[#B34A26]"
                  />
                </div>
              ))}
            </div>

            {prodCost > 0 && (
              <div className="mt-3 space-y-1.5 bg-[#F5EFE6] dark:bg-[#332823] rounded-xl p-3" data-testid="cost-summary">
                <Row label={t("cost_total")} value={`€ ${prodCost.toFixed(2)}`} />
                {costPerPiece != null && <Row label={t("cost_per_piece")} value={`€ ${costPerPiece.toFixed(2)}`} />}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <button
            data-testid="recipe-cancel-btn"
            onClick={() => onOpenChange(false)}
            className="flex-1 bg-[#F5EFE6] dark:bg-[#332823] text-[#2C221E] dark:text-[#F5EFE6] font-medium px-4 py-3 rounded-xl border border-[#E8DEC8] dark:border-[#3D302A]"
          >
            {t("cancel")}
          </button>
          <button
            data-testid="recipe-save-btn"
            onClick={submit}
            className="flex-1 bg-[#B34A26] hover:bg-[#963B1C] text-white font-semibold px-4 py-3 rounded-xl shadow-md active:scale-98 transition-all"
          >
            {t("save")}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-[#4A3B34] dark:text-[#C9BBB0]">{label}</span>
      <span className="font-mono-data font-semibold text-[#4A3B34] dark:text-[#C9BBB0]">{value}</span>
    </div>
  );
}

function normalize(r) {
  const out = { ...r };
  ["flour_grams", "water_grams", "sourdough_grams", "salt_grams", "bulk_fermentation_hours", "proofing_hours", "mix_minutes", "bake_temp", "bake_minutes"].forEach((k) => {
    out[k] = r[k] == null ? "" : r[k];
  });
  out.preferment_type = r.preferment_type || "none";
  out.oven_type = r.oven_type || "statico";
  out.method_type = r.method_type || "indiretto";
  out.extra_ingredients = (r.extra_ingredients || []).map((e) => ({ name: e.name || "", percent: e.percent ?? "" }));
  out.work_phases = (r.work_phases || []).map((p) => ({ name: p.name || "", time: p.time ?? "", temp: p.temp ?? "" }));
  out.image_url = r.image_url || "";
  out.procedure = r.procedure || "";
  out.origin = r.origin || "";
  out.dough_category = r.dough_category || "";
  out.water_temp_c = r.water_temp_c ?? "";
  const rc = r.costing || {};
  const has = (v) => v !== "" && v != null;
  out.costing = {
    flour_kg: has(rc.flour_kg) ? rc.flour_kg : STANDARD_PRICES.flour_kg,
    water_l: has(rc.water_l) ? rc.water_l : STANDARD_PRICES.water_l,
    sourdough_kg: has(rc.sourdough_kg) ? rc.sourdough_kg : STANDARD_PRICES.sourdough_kg,
    salt_kg: has(rc.salt_kg) ? rc.salt_kg : STANDARD_PRICES.salt_kg,
    extras: (rc.extras || []).map((e) => ({ name: e.name || "", cost: e.cost ?? "" })),
    overhead: rc.overhead ?? "", pieces: rc.pieces ?? "", markup: rc.markup ?? "",
  };
  return out;
}
