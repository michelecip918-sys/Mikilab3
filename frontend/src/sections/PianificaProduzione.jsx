import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { CalendarClock, Plus, Trash2, Flame, AlertTriangle } from "lucide-react";
import { recipesApi, weeklyApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";

const DAY_IDS = ["lun", "mar", "mer", "gio", "ven", "sab", "dom"];

function totalRestMin(r) {
  const h = Number(r?.bulk_fermentation_hours || 0) + Number(r?.proofing_hours || 0);
  return h > 0 ? Math.round(h * 60) : 30;
}
function toLocalInput(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function fmt(date, lang) {
  return date.toLocaleString(lang === "de" ? "de-DE" : "it-IT", { weekday: "short", hour: "2-digit", minute: "2-digit" });
}

export default function PianificaProduzione() {
  const { t, lang } = useLang();
  const [recipes, setRecipes] = useState([]);
  const [weekly, setWeekly] = useState([]);
  const [rows, setRows] = useState([]);
  const [bakeTime, setBakeTime] = useState(() => {
    const d = new Date(); d.setHours(18, 0, 0, 0); return toLocalInput(d);
  });
  const [plan, setPlan] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [miki, personal, wp] = await Promise.all([
          recipesApi.list("mikilab"), recipesApi.list("personal"), weeklyApi.get(),
        ]);
        setRecipes([...miki, ...personal]);
        setWeekly(wp && wp.items ? wp.items : []);
      } catch { toast.error(t("toast_load_error")); }
      finally { setLoaded(true); }
    })();
    // eslint-disable-next-line
  }, []);

  const recipeById = useMemo(() => {
    const m = {}; recipes.forEach((r) => { m[r.id] = r; }); return m;
  }, [recipes]);

  const addRow = () => {
    if (recipes.length === 0) return;
    const r = recipes[0];
    setRows((x) => [...x, { id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, recipe_id: r.id, rest_min: totalRestMin(r) }]);
  };
  const updateRow = (id, patch) => setRows((x) => x.map((r) => r.id === id ? { ...r, ...patch } : r));
  const removeRow = (id) => setRows((x) => x.filter((r) => r.id !== id));
  const onRecipe = (id, rid) => updateRow(id, { recipe_id: rid, rest_min: totalRestMin(recipeById[rid]) });

  const loadDay = (dayId) => {
    if (!dayId) return;
    const dayItems = weekly.filter((w) => w.day === dayId && recipeById[w.recipe_id]);
    setRows(dayItems.map((w) => ({ id: `${w.id}-inf`, recipe_id: w.recipe_id, rest_min: totalRestMin(recipeById[w.recipe_id]) })));
    setPlan(null);
  };

  const compute = async () => {
    if (rows.length === 0) return;
    const bake = new Date(bakeTime);
    const items = rows.map((r) => {
      const rec = recipeById[r.recipe_id];
      const rest = Number(r.rest_min || 0);
      const start = new Date(bake.getTime() - rest * 60 * 1000);
      return { name: rec?.name || "—", rest, start };
    }).sort((a, b) => a.start - b.start);
    setPlan({ items, bake });
    try {
      await weeklyApi.get(); // keep connection warm; persist bake schedule via production-plan
    } catch { /* noop */ }
    try {
      await import("@/lib/api").then(({ planApi }) => planApi.save({
        bake_time: bakeTime,
        phases: items.map((it) => ({ name: it.name, hours: it.rest / 60 })),
      }));
      toast.success(t("toast_plan_saved"));
    } catch { toast.error(t("toast_plan_error")); }
  };

  return (
    <div className="pb-4">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-11 h-11 rounded-2xl bg-[#B34A26] flex items-center justify-center">
          <CalendarClock className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-[#2C221E] dark:text-[#F5EFE6]">{t("plan_title")}</h1>
          <p className="text-sm text-[#8C7567]">{t("plan_subtitle")}</p>
        </div>
      </div>

      {loaded && recipes.length === 0 && (
        <div className="mt-5 flex items-start gap-3 bg-[#D99B26]/15 border border-[#D99B26]/30 rounded-2xl p-4">
          <AlertTriangle className="w-5 h-5 text-[#B34A26] shrink-0 mt-0.5" />
          <p className="text-sm text-[#4A3B34] dark:text-[#C9BBB0]">{t("sd_no_recipes")}</p>
        </div>
      )}

      <div className="mt-5 bg-white dark:bg-[#2A211D] border border-[#E8DEC8] dark:border-[#3D302A] rounded-2xl px-4 py-3">
        <label className="text-xs font-semibold uppercase tracking-wide text-[#8C7567]">{t("plan_bake_time")}</label>
        <input
          data-testid="bake-time-input"
          type="datetime-local"
          value={bakeTime}
          onChange={(e) => setBakeTime(e.target.value)}
          className="mt-1 w-full font-mono-data bg-[#F5EFE6] dark:bg-[#332823] border border-[#E8DEC8] dark:border-[#3D302A] rounded-lg px-3 py-2 outline-none focus:border-[#B34A26]"
        />
      </div>

      <div className="mt-3">
        <label className="text-xs font-semibold uppercase tracking-wide text-[#8C7567]">{t("sd_load_day")}</label>
        <select
          data-testid="inf-load-day"
          onChange={(e) => loadDay(e.target.value)}
          defaultValue=""
          className="mt-1 w-full bg-white dark:bg-[#2A211D] border border-[#E8DEC8] dark:border-[#3D302A] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#B34A26]"
        >
          <option value="">{t("sd_choose_day")}</option>
          {DAY_IDS.filter((d) => weekly.some((w) => w.day === d)).map((d) => (
            <option key={d} value={d}>{t(`day_${d}`)}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2 mt-4">
        {rows.map((r) => (
          <div key={r.id} className="flex items-center gap-2 bg-white dark:bg-[#2A211D] border border-[#E8DEC8] dark:border-[#3D302A] rounded-2xl px-3 py-2.5">
            <select
              data-testid={`inf-recipe-${r.id}`}
              value={r.recipe_id}
              onChange={(e) => onRecipe(r.id, e.target.value)}
              className="flex-1 min-w-0 bg-[#F5EFE6] dark:bg-[#332823] border border-[#E8DEC8] dark:border-[#3D302A] rounded-lg px-2 py-2 text-sm outline-none focus:border-[#B34A26]"
            >
              {recipes.map((rec) => <option key={rec.id} value={rec.id}>{rec.name}</option>)}
            </select>
            <input
              data-testid={`inf-rest-${r.id}`}
              type="number" value={r.rest_min}
              onChange={(e) => updateRow(r.id, { rest_min: e.target.value })}
              className="w-16 text-right font-mono-data font-bold text-[#8C3A1D] dark:text-[#E5AC3A] bg-[#F5EFE6] dark:bg-[#332823] border border-[#E8DEC8] dark:border-[#3D302A] rounded-lg px-2 py-1.5 outline-none"
            />
            <span className="text-[10px] text-[#8C7567] w-10">{t("sd_rest_min")}</span>
            <button onClick={() => removeRow(r.id)} className="text-[#B4442A] p-1" aria-label={t("delete")}>
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <button
        data-testid="inf-add-btn"
        onClick={addRow}
        disabled={recipes.length === 0}
        className="w-full mt-2 bg-[#F5EFE6] dark:bg-[#332823] text-[#2C221E] dark:text-[#F5EFE6] font-medium px-4 py-2.5 rounded-xl border border-[#E8DEC8] dark:border-[#3D302A] flex items-center justify-center gap-2 disabled:opacity-40"
      >
        <Plus className="w-4 h-4" /> {t("sd_add")}
      </button>

      <button
        data-testid="btn-compute-plan"
        onClick={compute}
        className="w-full mt-3 bg-[#B34A26] hover:bg-[#963B1C] text-white font-semibold px-5 py-3.5 rounded-2xl shadow-md active:scale-98 transition-all"
      >
        {t("plan_compute")}
      </button>

      {plan && (
        <div data-testid="plan-result" className="mt-5 space-y-2">
          <p className="text-xs text-[#8C7567]">{t("plan_note")}</p>
          {plan.items.map((it, i) => (
            <div key={i} className="flex items-center gap-3 bg-white dark:bg-[#2A211D] border border-[#E8DEC8] dark:border-[#3D302A] rounded-2xl px-4 py-3">
              <div className="w-8 h-8 rounded-full bg-[#D99B26]/20 text-[#8C3A1D] dark:text-[#E5AC3A] font-mono-data font-bold text-sm flex items-center justify-center shrink-0">{i + 1}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#2C221E] dark:text-[#F5EFE6] truncate">{it.name}</p>
                <p className="font-mono-data text-xs text-[#8C7567]">{t("sd_start_mix")} {fmt(it.start, lang)} · {t("sd_rest_min")} {it.rest}</p>
              </div>
            </div>
          ))}
          <div className="flex items-center gap-3 bg-[#B34A26] rounded-2xl px-4 py-3 text-white">
            <Flame className="w-5 h-5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold">{t("plan_bake_label")}</p>
              <p className="font-mono-data text-xs text-white/85">{fmt(plan.bake, lang)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
