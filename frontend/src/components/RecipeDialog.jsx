import { mkTri } from "@/i18n/triMaps";
import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { useLang } from "@/i18n/LanguageContext";
import { Camera, X, Loader2, ImagePlus } from "lucide-react";
import { COUNTRIES, flagEmoji } from "@/lib/countries";
import { STANDARD_PRICES, standardCosting } from "@/data/prices";
import { uploadApi, floursApi } from "@/lib/api";
import { useDept, activeDeptFromActivity } from "@/lib/dept";
import { getDeptProfile } from "@/lib/deptProfiles";

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
  name: "", real_name: "", menu_category: "", department: "", flour_type: "", origin: "", dough_category: "", water_temp_c: "", preferment_type: "lm", flour_grams: "", water_grams: "",
  sourdough_grams: "", salt_grams: "", bulk_fermentation_hours: "",
  proofing_hours: "", mix_minutes: "", bake_temp: "", bake_minutes: "",
  oven_type: "statico", method_type: "indiretto", notes: "", procedure: "", image_url: "", extra_ingredients: [], work_phases: [], costing: standardCosting(),
};

export default function RecipeDialog({ open, onOpenChange, initial, onSave, collectionChoice = false }) {
  const [form, setForm] = useState(empty);
  const [coll, setColl] = useState("mikilab");
  const [pctMode, setPctMode] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pantry, setPantry] = useState([]);
  const { t, lang } = useLang();
  const activeDept = useDept();

  useEffect(() => {
    if (open) {
      setForm(initial ? { ...empty, ...normalize(initial) } : { ...empty, department: (activeDept && activeDept !== "tutti") ? activeDept : activeDeptFromActivity() });
      setColl("mikilab");
      setPctMode(false);
      floursApi.list().then(setPantry).catch(() => setPantry([]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial]);

  // Applica il PROFILO OPERATIVO del reparto: metodo, prefermento, temperatura impasto
  // e ingredienti tipici del reparto (direttiva v12 · punto 2).
  const applyDeptProfile = () => {
    const prof = getDeptProfile(form.department || (activeDept !== "tutti" ? activeDept : ""));
    if (!prof) return;
    setForm((f) => {
      const existing = (f.extra_ingredients || []).filter((e) => e.name);
      const names = new Set(existing.map((e) => e.name.toLowerCase()));
      const add = prof.ingredients.filter((i) => !names.has(i.name.toLowerCase()));
      return {
        ...f,
        department: prof.id,
        method_type: prof.defaults.method_type,
        preferment_type: prof.defaults.preferment_type,
        water_temp_c: f.water_temp_c === "" || f.water_temp_c == null ? prof.defaults.dough_temp_c : f.water_temp_c,
        extra_ingredients: [...existing, ...add.map((i) => ({ name: i.name, percent: i.percent }))],
      };
    });
  };

  const pickFlour = (f) => {
    const wtxt = f.w_index != null ? ` · W ${f.w_index}` : "";
    set("flour_type", `${f.flour_type || f.product_name || f.brand || ""}${wtxt}`.trim());
  };

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
    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 1024; let w = img.width, h = img.height;
        if (w > h && w > max) { h = Math.round(h * max / w); w = max; }
        else if (h > max) { w = Math.round(w * max / h); h = max; }
        const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
        cv.getContext("2d").drawImage(img, 0, 0, w, h);
        cv.toBlob(async (blob) => {
          try {
            const url = await uploadApi.image(blob, `ricetta-${Date.now()}.jpg`);
            set("image_url", url);
          } catch {
            // fallback: keep a compressed preview if the archive is unreachable
            set("image_url", cv.toDataURL("image/jpeg", 0.8));
          } finally {
            setUploading(false);
          }
        }, "image/jpeg", 0.8);
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

  const submit = async () => {
    if (!form.name.trim()) return;
    if (saving) return;
    const payload = {
      ...((collectionChoice && !initial) ? { collection_name: coll } : {}),
      name: form.name.trim(), real_name: (form.real_name || "").trim() || null, menu_category: form.menu_category || null, department: form.department || null, flour_type: form.flour_type, origin: form.origin || null, dough_category: form.dough_category || null, water_temp_c: form.water_temp_c === "" || form.water_temp_c == null ? null : Number(form.water_temp_c), notes: form.notes, procedure: form.procedure,
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
    try {
      setSaving(true);
      await onSave(payload);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto thin-scroll bg-[#0D1520] dark:bg-[#0D1520] border-[#2A3B49] dark:border-[#2A3B49]">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-[#2B303B] dark:text-[#e4eff8]">
            {initial ? t("edit_recipe") : t("new_recipe")}
          </DialogTitle>
          <DialogDescription className="text-[#7E8A93]">
            {t("recipe_dialog_desc")}
          </DialogDescription>
        </DialogHeader>

        {collectionChoice && !initial && (
          <div data-testid="recipe-collection-choice" className="grid grid-cols-2 gap-2 pb-1">
            <button type="button" data-testid="recipe-coll-mikilab" onClick={() => setColl("mikilab")}
              className={`rounded-2xl border px-3 py-2.5 text-left transition-all active:scale-97 ${coll === "mikilab" ? "bg-[#3E9C93]/15 border-[#3E9C93] text-white" : "bg-white dark:bg-[#1B2A38] border-[#2A3B49] text-[#7E8A93]"}`}>
              <span className="block text-sm font-bold">{mkTri(lang)("Ricetta MikiLab", "MikiLab-Rezept", "MikiLab recipe", "Receta MikiLab")}</span>
              <span className="block text-[11px] opacity-80">{mkTri(lang)("condivisa, visibile a tutti", "geteilt, für alle sichtbar", "shared, visible to all", "compartida, visible para todos")}</span>
            </button>
            <button type="button" data-testid="recipe-coll-personal" onClick={() => setColl("personal")}
              className={`rounded-2xl border px-3 py-2.5 text-left transition-all active:scale-97 ${coll === "personal" ? "bg-[#EAB308]/15 border-[#EAB308] text-white" : "bg-white dark:bg-[#1B2A38] border-[#2A3B49] text-[#7E8A93]"}`}>
              <span className="block text-sm font-bold">{mkTri(lang)("Ricetta mia", "Mein Rezept", "My recipe", "Receta mía")}</span>
              <span className="block text-[11px] opacity-80">{mkTri(lang)("privata, solo per te", "privat, nur für dich", "private, only for you", "privada, solo para ti")}</span>
            </button>
          </div>
        )}

        <div className="space-y-3 py-1">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-[#7E8A93]">{t("field_name")}</label>
            <input
              data-testid="recipe-name-input"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder={t("field_name_ph")}
              className="mt-1 w-full bg-white dark:bg-[#1B2A38] border border-[#2A3B49] dark:border-[#2A3B49] focus:border-[#3E9C93] focus:ring-2 focus:ring-[#3E9C93]/20 rounded-2xl shadow-md border border-amber-900/40 p-3 text-base outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-[#7E8A93]">{mkTri(lang)("Nome reale (opzionale)", "Echter Name (optional)", "Real name (optional)", "Nombre real (opcional)")}</label>
            <input
              data-testid="recipe-realname-input"
              value={form.real_name || ""}
              onChange={(e) => set("real_name", e.target.value)}
              placeholder={mkTri(lang)("es. Pane alle Patate", "z. B. Kartoffelbrot", "e.g. Potato bread", "p. ej. Pan de patata")}
              className="mt-1 w-full bg-white dark:bg-[#1B2A38] border border-[#2A3B49] dark:border-[#2A3B49] focus:border-[#3E9C93] focus:ring-2 focus:ring-[#3E9C93]/20 rounded-2xl shadow-md border border-amber-900/40 p-3 text-base outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-[#7E8A93]">{mkTri(lang)("Categoria", "Kategorie", "Category", "Categoría", "Catégorie")}</label>
            <select
              data-testid="recipe-menu-category-select"
              value={form.menu_category || ""}
              onChange={(e) => set("menu_category", e.target.value)}
              className="mt-1 w-full bg-white dark:bg-[#1B2A38] border border-[#2A3B49] dark:border-[#2A3B49] focus:border-[#3E9C93] focus:ring-2 focus:ring-[#3E9C93]/20 rounded-2xl shadow-md border border-amber-900/40 p-3 text-base outline-none"
            >
              <option value="">{mkTri(lang)("Seleziona categoria…", "Kategorie wählen…", "Select category…", "Selecciona categoría…", "Choisir une catégorie…")}</option>
              <option value="basi">✨ {mkTri(lang)("Basi & Lieviti", "Basis & Hefen", "Bases & Starters", "Bases y Levaduras", "Bases & Levains")}</option>
              <option value="panini">🥖 {mkTri(lang)("Panini & Baguette", "Brötchen & Baguette", "Rolls & Baguette", "Panecillos y Baguette", "Petits pains & Baguette")}</option>
              <option value="viennoiserie">🥐 {mkTri(lang)("Cornetti & Viennoiserie", "Croissants & Viennoiserie", "Croissants & Viennoiserie", "Cruasanes y Viennoiserie", "Croissants & Viennoiserie")}</option>
              <option value="focacce">🫓 {mkTri(lang)("Focacce & Lievitati salati", "Focaccia & Herzhaftes", "Focaccia & Savoury", "Focaccias y Salados", "Focaccias & Salés")}</option>
              <option value="snack">🥨 {mkTri(lang)("Snack & Sfizi", "Snacks", "Snacks", "Snacks", "Snacks")}</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-[#7E8A93]">{mkTri(lang)("Reparto", "Bereich", "Department", "Departamento", "Rayon", "بخش")}</label>
            <select
              data-testid="recipe-department-select"
              value={form.department || ""}
              onChange={(e) => set("department", e.target.value)}
              className="mt-1 w-full bg-white dark:bg-[#1B2A38] border border-[#2A3B49] dark:border-[#2A3B49] focus:border-[#3E9C93] focus:ring-2 focus:ring-[#3E9C93]/20 rounded-2xl shadow-md border border-amber-900/40 p-3 text-base outline-none"
            >
              <option value="">{mkTri(lang)("Automatico (dal nome/categoria)", "Automatisch (aus Name/Kategorie)", "Automatic (from name/category)", "Automático (por nombre/categoría)", "Automatique (nom/catégorie)", "خودکار")}</option>
              <option value="panificazione">🍞 {mkTri(lang)("Panificazione", "Bäckerei", "Bakery", "Panadería", "Boulangerie", "نانوایی")}</option>
              <option value="pizzeria">🍕 Pizzeria</option>
              <option value="pasticceria">🥐 {mkTri(lang)("Pasticceria", "Konditorei", "Pastry", "Pastelería", "Pâtisserie", "قنادی")}</option>
            </select>
          </div>

          {/* Profilo operativo del reparto: prefill metodo/prefermento/temperatura + ingredienti tipici */}
          {getDeptProfile(form.department || (activeDept !== "tutti" ? activeDept : "")) && (
            <div data-testid="recipe-dept-profile" className="rounded-2xl border border-[#3E9C93]/40 bg-[#3E9C93]/5 p-3 flex items-start gap-3">
              <span className="text-2xl leading-none">{getDeptProfile(form.department || activeDept).icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#3E9C93]">{getDeptProfile(form.department || activeDept).label(lang)}</p>
                <p className="text-[11px] text-[#7E8A93]">{getDeptProfile(form.department || activeDept).tagline(lang)} · {getDeptProfile(form.department || activeDept).batch.note(lang)}</p>
                {(() => { const mp = getDeptProfile(form.department || activeDept).metrics; return mp ? (
                  <p data-testid="recipe-dept-metrics" className="text-[10px] font-mono-data text-[#5EEAD4] mt-0.5">
                    ⚙️ {mp.throughput_h} pz/h · ±{mp.scale_precision_g} g · {mp.dough_temp_c}°C{mp.chilling_c != null ? ` · ❄️ ${mp.chilling_c}°C` : ""} · max {mp.scale_max_kg} kg
                  </p>
                ) : null; })()}
              </div>
              <button
                type="button" data-testid="recipe-apply-dept-profile" onClick={applyDeptProfile}
                className="shrink-0 px-3 py-2 rounded-xl bg-[#3E9C93] text-white text-xs font-bold active:scale-95 transition-all"
              >
                {mkTri(lang)("Applica profilo", "Profil anwenden", "Apply profile", "Aplicar perfil", "Appliquer le profil", "اعمال پروفایل")}
              </button>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-[#7E8A93]">{t("field_flour")}</label>
            <input
              data-testid="recipe-flour-input"
              value={form.flour_type}
              onChange={(e) => set("flour_type", e.target.value)}
              placeholder={t("field_flour_ph")}
              className="mt-1 w-full bg-white dark:bg-[#1B2A38] border border-[#2A3B49] dark:border-[#2A3B49] focus:border-[#3E9C93] focus:ring-2 focus:ring-[#3E9C93]/20 rounded-2xl shadow-md border border-amber-900/40 p-3 text-base outline-none"
            />
            {pantry.length > 0 && (
              <div data-testid="recipe-flour-pantry" className="mt-2 flex flex-wrap gap-1.5">
                {pantry.slice(0, 12).map((f) => (
                  <button key={f.id} type="button" data-testid={`recipe-flour-pick-${f.id}`} onClick={() => pickFlour(f)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#3E9C93] bg-[#3E9C93]/10 border border-[#3E9C93]/30 px-2.5 py-1 rounded-full active:scale-95">
                    {(f.flour_type || f.product_name || f.brand || "Farina")}{f.w_index != null ? ` · W${f.w_index}` : ""}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-[#7E8A93]">{t("field_origin")}</label>
            <select
              data-testid="recipe-origin-select"
              value={form.origin || ""}
              onChange={(e) => set("origin", e.target.value)}
              className="mt-1 w-full bg-white dark:bg-[#1B2A38] border border-[#2A3B49] dark:border-[#2A3B49] focus:border-[#3E9C93] rounded-2xl shadow-md border border-amber-900/40 p-3 text-base outline-none"
            >
              <option value="">{t("origin_none")}</option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{flagEmoji(c.code)} {c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-[#7E8A93]">{t("field_dough_category")}</label>
            <select
              data-testid="recipe-dough-category-select"
              value={form.dough_category || ""}
              onChange={(e) => set("dough_category", e.target.value)}
              className="mt-1 w-full bg-white dark:bg-[#1B2A38] border border-[#2A3B49] dark:border-[#2A3B49] focus:border-[#3E9C93] rounded-2xl shadow-md border border-amber-900/40 p-3 text-base outline-none"
            >
              <option value="">{t("dc_none")}</option>
              <option value="pre">{t("dc_pre")}</option>
              <option value="lm">{t("dc_lm")}</option>
              <option value="diretto">{t("dc_diretto")}</option>
              <option value="rinfresco">{t("dc_rinfresco")}</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-[#7E8A93]">{t("field_water_temp")}</label>
            <input
              data-testid="recipe-water-temp-input"
              type="number" step="0.5" value={form.water_temp_c ?? ""}
              onChange={(e) => set("water_temp_c", e.target.value)}
              className="mt-1 w-full bg-white dark:bg-[#1B2A38] border border-[#2A3B49] dark:border-[#2A3B49] focus:border-[#3E9C93] rounded-2xl shadow-md border border-amber-900/40 p-3 text-base outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-[#7E8A93]">{t("field_preferment")}</label>
            <select
              data-testid="recipe-preferment-select"
              value={form.preferment_type || "none"}
              onChange={(e) => set("preferment_type", e.target.value)}
              className="mt-1 w-full bg-white dark:bg-[#1B2A38] border border-[#2A3B49] dark:border-[#2A3B49] focus:border-[#3E9C93] rounded-2xl shadow-md border border-amber-900/40 p-3 text-base outline-none"
            >
              {PREFERMENTS.map((p) => (
                <option key={p} value={p}>{t(`pf_${p}`)}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#7E8A93]">{t("dose_mode")}</span>
            <div className="flex items-center bg-[#e4eff8] dark:bg-[#1B2A38] rounded-2xl shadow-md border border-amber-900/40 border border-[#2A3B49] dark:border-[#2A3B49] p-0.5">
              {[["grams", "dose_grams"], ["pct", "dose_pct"]].map(([m, lk]) => (
                <button
                  key={m} type="button"
                  data-testid={`dose-mode-${m}`}
                  onClick={() => setPctMode(m === "pct")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    (pctMode ? "pct" : "grams") === m ? "bg-[#3E9C93] text-white shadow-sm" : "text-[#7E8A93]"
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
                  <label className="text-xs font-semibold uppercase tracking-wide text-[#7E8A93]">{t(labelKey)}</label>
                  <div className="relative mt-1">
                    <input
                      data-testid={`recipe-${key}-input`}
                      type="number"
                      value={displayVal}
                      onChange={(e) => onCh(e.target.value)}
                      className="w-full font-mono-data bg-white dark:bg-[#1B2A38] border border-[#2A3B49] dark:border-[#2A3B49] focus:border-[#3E9C93] focus:ring-2 focus:ring-[#3E9C93]/20 rounded-2xl shadow-md border border-amber-900/40 p-3 pr-8 text-base outline-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#7E8A93] pointer-events-none">{unit}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {hydration != null && (
            <div className="flex items-center justify-between bg-[#3E9C93]/15 border border-[#3E9C93]/30 rounded-2xl shadow-md border border-amber-900/40 px-4 py-2.5">
              <span className="text-sm font-medium text-[#3F4A54] dark:text-[#8FB0C2]">{t("hydration")}</span>
              <span data-testid="recipe-hydration" className="font-mono-data font-bold text-[#3E9C93] dark:text-[#8FB0C2]">
                {hydration}%
              </span>
            </div>
          )}

          {/* Lavorazione e cottura */}
          <div className="pt-1">
            <p className="text-xs font-bold uppercase tracking-wide text-[#3E9C93] mb-2">{t("work_bake_section")}</p>
            <div className="mb-3">
              <label className="text-[10px] font-semibold uppercase tracking-wide text-[#7E8A93]">{t("field_method")}</label>
              <select
                data-testid="recipe-method-select" value={form.method_type || "indiretto"}
                onChange={(e) => set("method_type", e.target.value)}
                className="mt-1 w-full bg-white dark:bg-[#1B2A38] border border-[#2A3B49] dark:border-[#2A3B49] focus:border-[#3E9C93] rounded-2xl shadow-md border border-amber-900/40 p-3 text-base outline-none"
              >
                <option value="indiretto">{t("method_indiretto")}</option>
                <option value="diretto">{t("method_diretto")}</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wide text-[#7E8A93]">{t("field_mix_min")}</label>
                <input
                  data-testid="recipe-mix_minutes-input" type="number" value={form.mix_minutes}
                  onChange={(e) => set("mix_minutes", e.target.value)}
                  className="mt-1 w-full font-mono-data bg-white dark:bg-[#1B2A38] border border-[#2A3B49] dark:border-[#2A3B49] focus:border-[#3E9C93] rounded-2xl shadow-md border border-amber-900/40 p-3 text-base outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wide text-[#7E8A93]">{t("field_oven")}</label>
                <select
                  data-testid="recipe-oven-select" value={form.oven_type || "statico"}
                  onChange={(e) => set("oven_type", e.target.value)}
                  className="mt-1 w-full bg-white dark:bg-[#1B2A38] border border-[#2A3B49] dark:border-[#2A3B49] focus:border-[#3E9C93] rounded-2xl shadow-md border border-amber-900/40 p-3 text-base outline-none"
                >
                  {OVEN_TYPES.map((o) => (
                    <option key={o} value={o}>{t(o === "ventilato" ? "oven_type_fan" : o === "rotor" ? "oven_type_rotor" : "oven_type_static")}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wide text-[#7E8A93]">{t("field_bake_temp")}</label>
                <input
                  data-testid="recipe-bake_temp-input" type="number" value={form.bake_temp}
                  onChange={(e) => set("bake_temp", e.target.value)}
                  className="mt-1 w-full font-mono-data bg-white dark:bg-[#1B2A38] border border-[#2A3B49] dark:border-[#2A3B49] focus:border-[#3E9C93] rounded-2xl shadow-md border border-amber-900/40 p-3 text-base outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wide text-[#7E8A93]">{t("field_bake_min")}</label>
                <input
                  data-testid="recipe-bake_minutes-input" type="number" value={form.bake_minutes}
                  onChange={(e) => set("bake_minutes", e.target.value)}
                  className="mt-1 w-full font-mono-data bg-white dark:bg-[#1B2A38] border border-[#2A3B49] dark:border-[#2A3B49] focus:border-[#3E9C93] rounded-2xl shadow-md border border-amber-900/40 p-3 text-base outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-[#7E8A93]">{t("field_notes")}</label>
            <textarea
              data-testid="recipe-notes-input"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={3}
              className="mt-1 w-full bg-white dark:bg-[#1B2A38] border border-[#2A3B49] dark:border-[#2A3B49] focus:border-[#3E9C93] focus:ring-2 focus:ring-[#3E9C93]/20 rounded-2xl shadow-md border border-amber-900/40 p-3 text-base outline-none resize-none"
            />
          </div>

          {/* Procedimento passo-passo */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-[#7E8A93]">{t("field_procedure")}</label>
            <textarea
              data-testid="recipe-procedure-input"
              value={form.procedure}
              onChange={(e) => set("procedure", e.target.value)}
              rows={5}
              className="mt-1 w-full bg-white dark:bg-[#1B2A38] border border-[#2A3B49] dark:border-[#2A3B49] focus:border-[#3E9C93] focus:ring-2 focus:ring-[#3E9C93]/20 rounded-2xl shadow-md border border-amber-900/40 p-3 text-base outline-none resize-none"
            />
          </div>

          {/* Foto ricetta (dalla fotocamera) */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-[#7E8A93]">{t("field_photo")}</label>
            <div className="mt-1 flex items-center gap-2 flex-wrap">
              {form.image_url ? <img src={form.image_url} alt="" className="w-16 h-16 rounded-2xl shadow-md border border-amber-900/40 object-cover border border-[#2A3B49] dark:border-[#2A3B49]" /> : null}
              <label data-testid="recipe-photo-take" className={`cursor-pointer bg-[#3E9C93] hover:bg-[#64748B] text-white rounded-2xl shadow-md border border-amber-900/40 px-4 py-2.5 text-sm font-medium flex items-center gap-2 ${uploading ? "opacity-60 pointer-events-none" : ""}`}>
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                {uploading ? t("photo_uploading") : (mkTri(lang)("Scatta ora", "Jetzt aufnehmen", "Take photo", "Hacer foto"))}
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={onPhoto} disabled={uploading} />
              </label>
              <label data-testid="recipe-photo-attach" className={`cursor-pointer bg-[#e4eff8] dark:bg-[#1B2A38] border border-[#2A3B49] dark:border-[#2A3B49] rounded-2xl shadow-md border border-amber-900/40 px-4 py-2.5 text-sm font-medium flex items-center gap-2 text-[#2B303B] dark:text-[#e4eff8] ${uploading ? "opacity-60 pointer-events-none" : ""}`}>
                <ImagePlus className="w-4 h-4 text-[#3E9C93]" />
                {mkTri(lang)("Allega", "Anhängen", "Attach", "Adjuntar")}
                <input type="file" accept="image/*" className="hidden" onChange={onPhoto} disabled={uploading} />
              </label>
              {form.image_url && !uploading ? <button onClick={() => set("image_url", "")} className="text-[#3E9C93] p-1"><X className="w-4 h-4" /></button> : null}
            </div>
          </div>

          {/* Fasi di lavorazione (impasto/riposo/lievitazione) */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-[#7E8A93]">{t("work_phases_section")}</label>
            <div className="mt-1 space-y-1.5" data-testid="work-phases-section">
              {(form.work_phases || []).map((p, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    data-testid={`phase-name-${i}`} value={p.name} placeholder={t("phase_name_ph")}
                    onChange={(ev) => setPhase(i, { name: ev.target.value })}
                    className="flex-1 min-w-0 bg-white dark:bg-[#1B2A38] border border-[#2A3B49] dark:border-[#2A3B49] rounded-lg p-2 text-sm outline-none focus:border-[#3E9C93]"
                  />
                  <input
                    data-testid={`phase-time-${i}`} value={p.time} placeholder={t("phase_time_ph")}
                    onChange={(ev) => setPhase(i, { time: ev.target.value })}
                    className="w-20 shrink-0 bg-white dark:bg-[#1B2A38] border border-[#2A3B49] dark:border-[#2A3B49] rounded-lg p-2 text-sm outline-none focus:border-[#3E9C93]"
                  />
                  <div className="relative w-16 shrink-0">
                    <input
                      data-testid={`phase-temp-${i}`} type="number" value={p.temp} placeholder="°"
                      onChange={(ev) => setPhase(i, { temp: ev.target.value })}
                      className="w-full bg-white dark:bg-[#1B2A38] border border-[#2A3B49] dark:border-[#2A3B49] rounded-lg p-2 pr-5 text-sm outline-none focus:border-[#3E9C93]"
                    />
                    <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs text-[#7E8A93] pointer-events-none">°</span>
                  </div>
                  <button onClick={() => removePhase(i)} className="text-[#3E9C93] p-1"><X className="w-4 h-4" /></button>
                </div>
              ))}
              <button data-testid="phase-add-btn" onClick={addPhase} className="text-sm font-medium text-[#3E9C93] flex items-center gap-1">+ {t("work_phases_add")}</button>
            </div>
          </div>

          {/* Altri ingredienti (percentuale sul peso farina) */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-[#7E8A93]">{t("ing_extra_section")}</label>
            <div className="mt-1 space-y-1.5" data-testid="extra-ingredients-section">
              {(form.extra_ingredients || []).map((e, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    data-testid={`extra-ing-name-${i}`} value={e.name} placeholder={t("ing_extra_name")}
                    onChange={(ev) => setIng(i, { name: ev.target.value })}
                    className="flex-1 min-w-0 bg-white dark:bg-[#1B2A38] border border-[#2A3B49] dark:border-[#2A3B49] rounded-lg p-2 text-sm outline-none focus:border-[#3E9C93]"
                  />
                  <div className="relative w-24 shrink-0">
                    <input
                      data-testid={`extra-ing-pct-${i}`} type="number" step="0.1" value={e.percent} placeholder="%"
                      onChange={(ev) => setIng(i, { percent: ev.target.value })}
                      className="w-full text-right font-mono-data bg-white dark:bg-[#1B2A38] border border-[#2A3B49] dark:border-[#2A3B49] rounded-lg p-2 pr-6 text-sm outline-none focus:border-[#3E9C93]"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[#7E8A93] pointer-events-none">%</span>
                  </div>
                  <button onClick={() => removeIng(i)} className="text-[#3E9C93] p-1" aria-label={t("delete")}>✕</button>
                </div>
              ))}
              <button data-testid="extra-ing-add-btn" onClick={addIng} className="text-sm font-medium text-[#3E9C93] flex items-center gap-1">
                + {t("ing_extra_add")}
              </button>
            </div>
          </div>

          {/* Costi e prezzo di vendita */}
          <div className="pt-2 border-t border-[#2A3B49] dark:border-[#2A3B49]" data-testid="recipe-costing-section">
            <p className="text-xs font-bold uppercase tracking-wide text-[#3E9C93] mb-2">{t("cost_section")}</p>
            <div className="flex items-start gap-2 mb-2 bg-[#3E9C93]/12 border border-[#3E9C93]/30 rounded-lg px-3 py-2">
              <p className="text-[11px] text-[#3F4A54] dark:text-[#AEB8BF] flex-1 leading-snug">{t("cost_auto_note")}</p>
              <button
                type="button" data-testid="cost-use-standard-btn"
                onClick={() => setForm((f) => ({ ...f, costing: { ...(f.costing || emptyCost), ...STANDARD_PRICES } }))}
                className="text-[11px] font-semibold text-[#3E9C93] whitespace-nowrap shrink-0"
              >
                {t("cost_use_standard")}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[["flour_kg", "cost_flour_kg"], ["water_l", "cost_water_l"], ["sourdough_kg", "cost_sourdough_kg"], ["salt_kg", "cost_salt_kg"]].map(([k, lk]) => (
                <div key={k}>
                  <label className="text-[10px] font-semibold uppercase tracking-wide text-[#7E8A93]">{t(lk)}</label>
                  <input
                    data-testid={`cost-${k}-input`} type="number" step="0.01" value={c[k]}
                    onChange={(e) => setC(k, e.target.value)}
                    className="mt-0.5 w-full font-mono-data bg-white dark:bg-[#1B2A38] border border-[#2A3B49] dark:border-[#2A3B49] rounded-lg p-2 text-sm outline-none focus:border-[#3E9C93]"
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
                    className="flex-1 min-w-0 bg-white dark:bg-[#1B2A38] border border-[#2A3B49] dark:border-[#2A3B49] rounded-lg p-2 text-sm outline-none focus:border-[#3E9C93]"
                  />
                  <input
                    data-testid={`cost-extra-price-${i}`} type="number" step="0.01" value={e.cost} placeholder="€"
                    onChange={(ev) => setExtra(i, { cost: ev.target.value })}
                    className="w-20 text-right font-mono-data bg-white dark:bg-[#1B2A38] border border-[#2A3B49] dark:border-[#2A3B49] rounded-lg p-2 text-sm outline-none focus:border-[#3E9C93]"
                  />
                  <button onClick={() => removeExtra(i)} className="text-[#3E9C93] p-1" aria-label={t("delete")}>✕</button>
                </div>
              ))}
              <button
                data-testid="cost-add-extra-btn" onClick={addExtra}
                className="text-sm font-medium text-[#3E9C93] flex items-center gap-1"
              >
                + {t("cost_extra_add")}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              {[["overhead", "cost_overhead"], ["pieces", "cost_pieces"]].map(([k, lk]) => (
                <div key={k}>
                  <label className="text-[10px] font-semibold uppercase tracking-wide text-[#7E8A93]">{t(lk)}</label>
                  <input
                    data-testid={`cost-${k}-input`} type="number" step="0.01" value={c[k]}
                    onChange={(e) => setC(k, e.target.value)}
                    className="mt-0.5 w-full font-mono-data bg-white dark:bg-[#1B2A38] border border-[#2A3B49] dark:border-[#2A3B49] rounded-lg p-2 text-sm outline-none focus:border-[#3E9C93]"
                  />
                </div>
              ))}
            </div>

            {prodCost > 0 && (
              <div className="mt-3 space-y-1.5 bg-[#e4eff8] dark:bg-[#1B2A38] rounded-2xl shadow-md border border-amber-900/40 p-3" data-testid="cost-summary">
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
            className="flex-1 bg-[#e4eff8] dark:bg-[#1B2A38] text-[#2B303B] dark:text-[#e4eff8] font-medium px-4 py-3 rounded-2xl shadow-md border border-amber-900/40 border border-[#2A3B49] dark:border-[#2A3B49]"
          >
            {t("cancel")}
          </button>
          <button
            data-testid="recipe-save-btn"
            onClick={submit}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 bg-[#3E9C93] hover:bg-[#64748B] disabled:opacity-60 text-white font-semibold px-4 py-3 rounded-2xl shadow-md border border-amber-900/40 shadow-md active:scale-98 transition-all"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? t("saving") : t("save")}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-[#3F4A54] dark:text-[#AEB8BF]">{label}</span>
      <span className="font-mono-data font-semibold text-[#3F4A54] dark:text-[#AEB8BF]">{value}</span>
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
  out.menu_category = r.menu_category || "";
  out.department = r.department || "";
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
