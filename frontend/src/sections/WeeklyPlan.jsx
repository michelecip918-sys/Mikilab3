import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { CalendarDays, Plus, Trash2, Save, Wheat, AlertTriangle, Printer, Share2, FileText } from "lucide-react";
import { recipesApi, weeklyApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { fmtQty } from "@/lib/shopping";
import { jsPDF } from "jspdf";

const DAYS = [
  { id: "lun" }, { id: "mar" }, { id: "mer" }, { id: "gio" },
  { id: "ven" }, { id: "sab" }, { id: "dom" },
];

// Peso predefinito a pezzo in base al nome della ricetta (modificabile)
function defaultGrams(name = "") {
  const n = name.toLowerCase();
  if (n.includes("baguette")) return 250;
  if (n.includes("panin") || n.includes("rosett") || n.includes("all'olio")) return 80;
  if (n.includes("ciabatt")) return 400;
  if (n.includes("focacc")) return 500;
  if (n.includes("pane") || n.includes("pagnott") || n.includes("filon") || n.includes("brot")) return 800;
  return 100;
}

const GRAM_FIELDS = [
  { key: "flour_grams", labelKey: "ing_flour" },
  { key: "water_grams", labelKey: "ing_water" },
  { key: "sourdough_grams", labelKey: "ing_sourdough" },
  { key: "salt_grams", labelKey: "ing_salt" },
];

export default function WeeklyPlan() {
  const [recipes, setRecipes] = useState([]);
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const { t } = useLang();

  useEffect(() => {
    (async () => {
      try {
        const [miki, personal, saved] = await Promise.all([
          recipesApi.list("mikilab"),
          recipesApi.list("personal"),
          weeklyApi.get(),
        ]);
        setRecipes([...miki, ...personal]);
        if (saved && saved.items) setItems(saved.items);
      } catch {
        toast.error(t("toast_load_error"));
      } finally {
        setLoaded(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recipeById = useMemo(() => {
    const m = {};
    recipes.forEach((r) => { m[r.id] = r; });
    return m;
  }, [recipes]);

  const addItem = (day) => {
    if (recipes.length === 0) return;
    const r = recipes[0];
    setItems((it) => [
      ...it,
      { id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, day, recipe_id: r.id, recipe_name: r.name, pieces: 10, grams_per_piece: defaultGrams(r.name) },
    ]);
  };

  const updateItem = (id, patch) => setItems((it) => it.map((x) => x.id === id ? { ...x, ...patch } : x));
  const removeItem = (id) => setItems((it) => it.filter((x) => x.id !== id));

  const onRecipeChange = (id, recipeId) => {
    const r = recipeById[recipeId];
    updateItem(id, { recipe_id: recipeId, recipe_name: r?.name || "", grams_per_piece: defaultGrams(r?.name) });
  };

  const save = async () => {
    try {
      await weeklyApi.save({
        items: items.map(({ id, day, recipe_id, recipe_name, pieces, grams_per_piece, to_proof, to_fridge, to_freezer }) => ({
          id, day, recipe_id, recipe_name,
          pieces: Number(pieces || 0), grams_per_piece: Number(grams_per_piece || 0),
          to_proof: to_proof === "" || to_proof == null ? null : Number(to_proof),
          to_fridge: to_fridge === "" || to_fridge == null ? null : Number(to_fridge),
          to_freezer: to_freezer === "" || to_freezer == null ? null : Number(to_freezer),
        })),
      });
      toast.success(t("toast_weekly_saved"));
    } catch {
      toast.error(t("toast_save_error"));
    }
  };

  // Build the plan summary (days -> items with computed, up-to-date doses)
  const buildSummary = () => {
    return DAYS.map((d) => {
      const dayItems = items.filter((x) => x.day === d.id).map((it) => {
        const r = recipeById[it.recipe_id];
        const pieces = Number(it.pieces || 0);
        const gpp = Number(it.grams_per_piece || 0);
        const totalDough = pieces * gpp;
        const currentTotal = r ? GRAM_FIELDS.reduce((s, f) => s + Number(r[f.key] || 0), 0) : 0;
        const factor = currentTotal > 0 ? totalDough / currentTotal : null;
        const doses = r && factor
          ? GRAM_FIELDS.filter((f) => r[f.key] != null).map((f) => `${t(f.labelKey)} ${fmtQty(r[f.key] * factor)}`)
          : [];
        return { name: it.recipe_name, pieces, gpp, totalDough, doses, missing: !r };
      });
      return { day: t(`day_${d.id}`), items: dayItems };
    }).filter((d) => d.items.length > 0);
  };

  const buildPlainText = () => {
    const summary = buildSummary();
    let out = `${t("weekly_print_title")}\n\n`;
    summary.forEach((d) => {
      out += `${d.day}:\n`;
      d.items.forEach((it) => {
        out += `  • ${it.name} — ${it.pieces} × ${it.gpp}g = ${fmtQty(it.totalDough)}\n`;
        if (it.doses.length) out += `    ${t("weekly_doses_label")}: ${it.doses.join(" · ")}\n`;
      });
      out += "\n";
    });
    return out.trim();
  };

  const printPlan = () => {
    const summary = buildSummary();
    if (summary.length === 0) { toast.error(t("weekly_empty_share")); return; }
    const rows = summary.map((d) => `
      <section>
        <h2>${d.day}</h2>
        <ul>
          ${d.items.map((it) => `
            <li>
              <strong>${it.name}</strong> — ${it.pieces} × ${it.gpp}g = <b>${fmtQty(it.totalDough)}</b>
              ${it.missing ? `<div class="warn">${t("weekly_recipe_gone")}</div>` : ""}
              ${it.doses.length ? `<div class="doses">${t("weekly_doses_label")}: ${it.doses.join(" &middot; ")}</div>` : ""}
            </li>`).join("")}
        </ul>
      </section>`).join("");
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${t("weekly_print_title")}</title>
      <style>
        body{font-family:Georgia,serif;color:#2C221E;max-width:720px;margin:32px auto;padding:0 20px}
        h1{color:#B34A26} h2{color:#8C3A1D;border-bottom:2px solid #E6B85C;padding-bottom:4px;margin-top:28px}
        ul{list-style:none;padding:0} li{padding:10px 0;border-bottom:1px solid #EEE}
        .doses{font-family:monospace;color:#8C3A1D;font-size:13px;margin-top:4px}
        .warn{color:#B4442A;font-size:13px}
      </style></head><body>
      <h1>🌾 ${t("weekly_print_title")}</h1>${rows}
      </body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
  };

  const pdfPlan = () => {
    const summary = buildSummary();
    if (summary.length === 0) { toast.error(t("weekly_empty_share")); return; }
    const doc = new jsPDF();
    let y = 18;
    doc.setFont("helvetica", "bold"); doc.setFontSize(18); doc.setTextColor(179, 74, 38);
    doc.text(t("weekly_print_title"), 14, y); y += 10;
    summary.forEach((d) => {
      if (y > 275) { doc.addPage(); y = 18; }
      doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.setTextColor(140, 58, 29);
      doc.text(d.day, 14, y); y += 7;
      doc.setFont("helvetica", "normal"); doc.setFontSize(11); doc.setTextColor(44, 34, 30);
      d.items.forEach((it) => {
        if (y > 280) { doc.addPage(); y = 18; }
        doc.text(`• ${it.name} — ${it.pieces} x ${it.gpp}g = ${fmtQty(it.totalDough)}`, 18, y); y += 6;
        if (it.doses.length) {
          doc.setTextColor(140, 58, 29); doc.setFontSize(9);
          doc.text(`   ${t("weekly_doses_label")}: ${it.doses.join(" · ")}`, 18, y); y += 6;
          doc.setTextColor(44, 34, 30); doc.setFontSize(11);
        }
      });
      y += 4;
    });
    doc.save("piano-settimanale-mikilab.pdf");
  };

  const sharePlan = async () => {    const summary = buildSummary();
    if (summary.length === 0) { toast.error(t("weekly_empty_share")); return; }
    const text = buildPlainText();
    try {
      if (navigator.share) {
        await navigator.share({ title: t("weekly_print_title"), text });
        toast.success(t("toast_shared"));
      } else {
        await navigator.clipboard.writeText(text);
        toast.success(t("toast_copied"));
      }
    } catch {
      /* utente ha annullato la condivisione */
    }
  };

  return (
    <div className="pb-4">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-11 h-11 rounded-2xl bg-[#B34A26] flex items-center justify-center">
          <CalendarDays className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-[#2C221E] dark:text-[#F5EFE6]">{t("weekly_title")}</h1>
          <p className="text-sm text-[#8C7567]">{t("weekly_subtitle")}</p>
        </div>
      </div>

      {loaded && recipes.length === 0 && (
        <div className="mt-5 flex items-start gap-3 bg-[#D99B26]/15 border border-[#D99B26]/30 rounded-2xl p-4">
          <AlertTriangle className="w-5 h-5 text-[#B34A26] shrink-0 mt-0.5" />
          <p className="text-sm text-[#4A3B34] dark:text-[#C9BBB0]">{t("weekly_no_recipes")}</p>
        </div>
      )}

      <div className="mt-5 space-y-4">
        {DAYS.map((d) => {
          const dayItems = items.filter((x) => x.day === d.id);
          return (
            <div key={d.id} data-testid={`weekly-day-${d.id}`} className="bg-white dark:bg-[#2A211D] border border-[#E8DEC8] dark:border-[#3D302A] rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-display text-lg font-semibold text-[#2C221E] dark:text-[#F5EFE6]">{t(`day_${d.id}`)}</h3>
                <button
                  data-testid={`weekly-add-${d.id}`}
                  onClick={() => addItem(d.id)}
                  disabled={recipes.length === 0}
                  className="flex items-center gap-1 text-sm font-medium text-[#B34A26] disabled:opacity-40"
                >
                  <Plus className="w-4 h-4" /> {t("weekly_add")}
                </button>
              </div>

              {dayItems.length === 0 ? (
                <p className="text-sm text-[#A89689]">{t("weekly_none")}</p>
              ) : (
                <div className="space-y-3">
                  {dayItems.map((it) => (
                    <WeeklyItemRow
                      key={it.id}
                      item={it}
                      recipes={recipes}
                      recipe={recipeById[it.recipe_id]}
                      t={t}
                      onRecipeChange={(rid) => onRecipeChange(it.id, rid)}
                      onChange={(patch) => updateItem(it.id, patch)}
                      onRemove={() => removeItem(it.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button
        data-testid="weekly-save-btn"
        onClick={save}
        className="w-full mt-5 bg-[#B34A26] hover:bg-[#963B1C] text-white font-semibold px-5 py-3.5 rounded-2xl shadow-md active:scale-98 transition-all flex items-center justify-center gap-2"
      >
        <Save className="w-5 h-5" /> {t("weekly_save")}
      </button>

      <div className="grid grid-cols-3 gap-2 mt-2">
        <button
          data-testid="weekly-print-btn"
          onClick={printPlan}
          className="bg-[#F5EFE6] dark:bg-[#332823] text-[#2C221E] dark:text-[#F5EFE6] font-medium px-3 py-3 rounded-2xl border border-[#E8DEC8] dark:border-[#3D302A] flex items-center justify-center gap-1.5 active:scale-98 transition-all"
        >
          <Printer className="w-5 h-5" /> {t("weekly_print")}
        </button>
        <button
          data-testid="weekly-pdf-btn"
          onClick={pdfPlan}
          className="bg-[#F5EFE6] dark:bg-[#332823] text-[#2C221E] dark:text-[#F5EFE6] font-medium px-3 py-3 rounded-2xl border border-[#E8DEC8] dark:border-[#3D302A] flex items-center justify-center gap-1.5 active:scale-98 transition-all"
        >
          <FileText className="w-5 h-5" /> {t("weekly_pdf")}
        </button>
        <button
          data-testid="weekly-share-btn"
          onClick={sharePlan}
          className="bg-[#F5EFE6] dark:bg-[#332823] text-[#2C221E] dark:text-[#F5EFE6] font-medium px-3 py-3 rounded-2xl border border-[#E8DEC8] dark:border-[#3D302A] flex items-center justify-center gap-1.5 active:scale-98 transition-all"
        >
          <Share2 className="w-5 h-5" /> {t("weekly_share")}
        </button>
      </div>
    </div>
  );
}

function WeeklyItemRow({ item, recipes, recipe, t, onRecipeChange, onChange, onRemove }) {
  const pieces = Number(item.pieces || 0);
  const gpp = Number(item.grams_per_piece || 0);
  const totalDough = pieces * gpp;

  const currentTotal = recipe
    ? GRAM_FIELDS.reduce((s, f) => s + Number(recipe[f.key] || 0), 0)
    : 0;
  const factor = currentTotal > 0 ? totalDough / currentTotal : null;

  const scaled = GRAM_FIELDS.map((f) => ({
    ...f,
    value: recipe && recipe[f.key] != null && factor ? Math.round(recipe[f.key] * factor) : null,
  }));

  return (
    <div className="bg-[#F5EFE6] dark:bg-[#241D19] border border-[#E8DEC8] dark:border-[#3D302A] rounded-xl p-3">
      <div className="flex items-center gap-2">
        <select
          data-testid={`weekly-recipe-select-${item.id}`}
          value={item.recipe_id}
          onChange={(e) => onRecipeChange(e.target.value)}
          className="flex-1 min-w-0 bg-white dark:bg-[#2A211D] border border-[#E8DEC8] dark:border-[#3D302A] rounded-lg px-2 py-2 text-sm outline-none focus:border-[#B34A26]"
        >
          {recipes.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
        <button onClick={onRemove} data-testid={`weekly-remove-${item.id}`} className="w-8 h-8 rounded-lg bg-white dark:bg-[#2A211D] border border-[#E8DEC8] dark:border-[#3D302A] flex items-center justify-center text-[#B4442A] shrink-0">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-2 mt-2">
        <div className="flex items-center gap-1 flex-1">
          <input
            data-testid={`weekly-pieces-${item.id}`}
            type="number" value={item.pieces}
            onChange={(e) => onChange({ pieces: e.target.value })}
            className="w-20 text-right font-mono-data font-bold text-[#8C3A1D] dark:text-[#E5AC3A] bg-white dark:bg-[#2A211D] border border-[#E8DEC8] dark:border-[#3D302A] rounded-lg px-2 py-1.5 outline-none"
          />
          <span className="text-xs text-[#8C7567]">{t("weekly_pieces")}</span>
          <input
            data-testid={`weekly-gpp-${item.id}`}
            type="number" value={item.grams_per_piece}
            onChange={(e) => onChange({ grams_per_piece: e.target.value })}
            className="w-16 text-right font-mono-data font-bold text-[#8C3A1D] dark:text-[#E5AC3A] bg-white dark:bg-[#2A211D] border border-[#E8DEC8] dark:border-[#3D302A] rounded-lg px-2 py-1.5 outline-none"
          />
          <span className="text-xs text-[#8C7567]">{t("weekly_gpp")}</span>
        </div>
        <span className="font-mono-data text-sm font-bold text-[#4A3B34] dark:text-[#C9BBB0]">= {fmtQty(totalDough)}</span>
      </div>

      {!recipe ? (
        <p className="text-xs text-[#B4442A] mt-2">{t("weekly_recipe_gone")}</p>
      ) : factor ? (
        <div className="flex flex-wrap gap-1.5 mt-2" data-testid={`weekly-doses-${item.id}`}>
          {scaled.map((f) => f.value != null && (
            <span key={f.key} className="inline-flex items-center gap-1 bg-[#D99B26]/15 text-[#8C3A1D] dark:text-[#E5AC3A] font-mono-data text-xs px-2 py-0.5 rounded-full font-bold border border-[#D99B26]/30">
              <Wheat className="w-3 h-3" /> {t(f.labelKey)} {fmtQty(f.value)}
            </span>
          ))}
        </div>
      ) : null}

      {/* Destinazione pezzi: lievitazione (oggi) / frigo (domani) / freezer (resto) */}
      <div className="mt-3 pt-2 border-t border-dashed border-[#E8DEC8] dark:border-[#3D302A]">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8C7567]">{t("weekly_dest_title")}</p>
        <div className="grid grid-cols-3 gap-2 mt-1.5">
          {[
            ["to_proof", t("weekly_dest_proof")],
            ["to_fridge", t("weekly_dest_fridge")],
            ["to_freezer", t("weekly_dest_freezer")],
          ].map(([key, label]) => (
            <div key={key}>
              <label className="text-[10px] text-[#8C7567] block leading-tight">{label}</label>
              <input
                data-testid={`weekly-${key}-${item.id}`}
                type="number" value={item[key] ?? ""} placeholder="—"
                onChange={(e) => onChange({ [key]: e.target.value })}
                className="mt-0.5 w-full text-center font-mono-data font-bold text-[#6B8E62] bg-white dark:bg-[#2A211D] border border-[#E8DEC8] dark:border-[#3D302A] rounded-lg px-1 py-1.5 outline-none focus:border-[#6B8E62]"
              />
            </div>
          ))}
        </div>
        <p className="text-[10px] text-[#A89689] mt-1 leading-snug">{t("weekly_dest_hint")}</p>
      </div>
    </div>
  );
}
