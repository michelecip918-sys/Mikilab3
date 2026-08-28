import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { CalendarClock, Plus, Trash2, Flame, AlertTriangle } from "lucide-react";
import { recipesApi, weeklyApi, ovenApi } from "@/lib/api";
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
  return date.toLocaleString(lang === "de" ? "de-DE" : lang === "en" ? "en-GB" : "it-IT", { weekday: "short", hour: "2-digit", minute: "2-digit" });
}

// Suggested baking temp/time by bread type; adjusted for fan ovens.
function bakeSuggest(name = "", ovenType = "statico") {
  const n = name.toLowerCase();
  let temp = 230, mins = 30;
  if (n.includes("baguette")) { temp = 240; mins = 20; }
  else if (n.includes("ciabatt")) { temp = 235; mins = 22; }
  else if (n.includes("panin") || n.includes("rosett") || n.includes("hamburger") || n.includes("all'olio") || n.includes("brötchen")) { temp = 220; mins = 15; }
  else if (n.includes("focacc")) { temp = 220; mins = 20; }
  else if (n.includes("panettone")) { temp = 165; mins = 50; }
  else if (n.includes("pane") || n.includes("pagnott") || n.includes("filon") || n.includes("brot") || n.includes("farro") || n.includes("dinkel")) { temp = 235; mins = 40; }
  if (ovenType === "ventilato") { temp -= 20; mins = Math.max(5, Math.round(mins * 0.9)); }
  return { temp, mins };
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
  const [ovens, setOvens] = useState([]);
  const [ovenId, setOvenId] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [miki, personal, wp, ov] = await Promise.all([
          recipesApi.list("mikilab"), recipesApi.list("personal"), weeklyApi.get(), ovenApi.list(),
        ]);
        setRecipes([...miki, ...personal]);
        setWeekly(wp && wp.items ? wp.items : []);
        setOvens(ov || []);
      } catch { toast.error(t("toast_load_error")); }
      finally { setLoaded(true); }
    })();
    // eslint-disable-next-line
  }, []);

  const selectedOven = useMemo(() => ovens.find((o) => o.id === ovenId) || null, [ovens, ovenId]);

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
        <div className="w-11 h-11 rounded-2xl bg-[#8C4A27] flex items-center justify-center">
          <CalendarClock className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-[#2B303B] dark:text-[#e4eff8]">{t("plan_title")}</h1>
          <p className="text-sm text-[#7E8A93]">{t("plan_subtitle")}</p>
        </div>
      </div>

      {loaded && recipes.length === 0 && (
        <div className="mt-5 flex items-start gap-3 bg-[#B45309]/15 border border-[#B45309]/30 rounded-2xl p-4">
          <AlertTriangle className="w-5 h-5 text-[#8C4A27] shrink-0 mt-0.5" />
          <p className="text-sm text-[#3F4A54] dark:text-[#AEB8BF]">{t("sd_no_recipes")}</p>
        </div>
      )}

      <div className="mt-5 bg-white dark:bg-[#232A31] border border-[#E6D8C3] dark:border-[#38424B] rounded-2xl px-4 py-3">
        <label className="text-xs font-semibold uppercase tracking-wide text-[#7E8A93]">{t("plan_bake_time")}</label>
        <input
          data-testid="bake-time-input"
          type="datetime-local"
          value={bakeTime}
          onChange={(e) => setBakeTime(e.target.value)}
          className="mt-1 w-full font-mono-data bg-[#e4eff8] dark:bg-[#2A323A] border border-[#E6D8C3] dark:border-[#38424B] rounded-lg px-3 py-2 outline-none focus:border-[#8C4A27]"
        />
      </div>

      <div className="mt-3">
        <label className="text-xs font-semibold uppercase tracking-wide text-[#7E8A93]">{t("sd_load_day")}</label>
        <select
          data-testid="inf-load-day"
          onChange={(e) => loadDay(e.target.value)}
          defaultValue=""
          className="mt-1 w-full bg-white dark:bg-[#232A31] border border-[#E6D8C3] dark:border-[#38424B] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#8C4A27]"
        >
          <option value="">{t("sd_choose_day")}</option>
          {DAY_IDS.filter((d) => weekly.some((w) => w.day === d)).map((d) => (
            <option key={d} value={d}>{t(`day_${d}`)}</option>
          ))}
        </select>
      </div>

      <div className="mt-3">
        <label className="text-xs font-semibold uppercase tracking-wide text-[#7E8A93]">{t("inf_oven")}</label>
        <select
          data-testid="inf-oven-select"
          value={ovenId} onChange={(e) => setOvenId(e.target.value)}
          className="mt-1 w-full bg-white dark:bg-[#232A31] border border-[#E6D8C3] dark:border-[#38424B] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#8C4A27]"
        >
          <option value="">{t("inf_oven_none")}</option>
          {ovens.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name} · {o.oven_type === "ventilato" ? t("oven_type_fan") : t("oven_type_static")}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2 mt-4">
        {rows.map((r) => (
          <div key={r.id} className="flex items-center gap-2 bg-white dark:bg-[#232A31] border border-[#E6D8C3] dark:border-[#38424B] rounded-2xl px-3 py-2.5">
            <select
              data-testid={`inf-recipe-${r.id}`}
              value={r.recipe_id}
              onChange={(e) => onRecipe(r.id, e.target.value)}
              className="flex-1 min-w-0 bg-[#e4eff8] dark:bg-[#2A323A] border border-[#E6D8C3] dark:border-[#38424B] rounded-lg px-2 py-2 text-sm outline-none focus:border-[#8C4A27]"
            >
              {recipes.map((rec) => <option key={rec.id} value={rec.id}>{rec.name}</option>)}
            </select>
            <input
              data-testid={`inf-rest-${r.id}`}
              type="number" value={r.rest_min}
              onChange={(e) => updateRow(r.id, { rest_min: e.target.value })}
              className="w-16 text-right font-mono-data font-bold text-[#6E371C] dark:text-[#8FB0C2] bg-[#e4eff8] dark:bg-[#2A323A] border border-[#E6D8C3] dark:border-[#38424B] rounded-lg px-2 py-1.5 outline-none"
            />
            <span className="text-[10px] text-[#7E8A93] w-10">{t("sd_rest_min")}</span>
            <button onClick={() => removeRow(r.id)} className="text-[#C0574D] p-1" aria-label={t("delete")}>
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <button
        data-testid="inf-add-btn"
        onClick={addRow}
        disabled={recipes.length === 0}
        className="w-full mt-2 bg-[#e4eff8] dark:bg-[#2A323A] text-[#2B303B] dark:text-[#e4eff8] font-medium px-4 py-2.5 rounded-xl border border-[#E6D8C3] dark:border-[#38424B] flex items-center justify-center gap-2 disabled:opacity-40"
      >
        <Plus className="w-4 h-4" /> {t("sd_add")}
      </button>

      <button
        data-testid="btn-compute-plan"
        onClick={compute}
        className="w-full mt-3 bg-[#8C4A27] hover:bg-[#336a94] text-white font-semibold px-5 py-3.5 rounded-2xl shadow-md active:scale-98 transition-all"
      >
        {t("plan_compute")}
      </button>

      {plan && (
        <div data-testid="plan-result" className="mt-5 space-y-2">
          <p className="text-xs text-[#7E8A93]">{t("plan_note")}</p>
          {plan.items.map((it, i) => {
            const ovenType = selectedOven?.oven_type || "statico";
            const bs = bakeSuggest(it.name, ovenType);
            return (
            <div key={i} className="flex items-center gap-3 bg-white dark:bg-[#232A31] border border-[#E6D8C3] dark:border-[#38424B] rounded-2xl px-4 py-3">
              <div className="w-8 h-8 rounded-full bg-[#B45309]/20 text-[#6E371C] dark:text-[#8FB0C2] font-mono-data font-bold text-sm flex items-center justify-center shrink-0">{i + 1}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#2B303B] dark:text-[#e4eff8] truncate">{it.name}</p>
                <p className="font-mono-data text-xs text-[#7E8A93]">{t("sd_start_mix")} {fmt(it.start, lang)} · {t("sd_rest_min")} {it.rest}</p>
                <p data-testid={`inf-bake-${i}`} className="font-mono-data text-xs text-[#6E371C] dark:text-[#8FB0C2] mt-0.5">
                  🔥 {t("inf_bake")}: {bs.temp}°C · {bs.mins}′ ({ovenType === "ventilato" ? t("oven_type_fan") : t("oven_type_static")})
                </p>
              </div>
            </div>
            );
          })}
          <div className="flex items-center gap-3 bg-[#8C4A27] rounded-2xl px-4 py-3 text-white">
            <Flame className="w-5 h-5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold">{t("plan_bake_label")}</p>
              <p className="font-mono-data text-xs text-white/85">{fmt(plan.bake, lang)}</p>
            </div>
          </div>

          {selectedOven && (
            <div data-testid="inf-oven-suggestion" className="bg-white dark:bg-[#232A31] border border-[#E6D8C3] dark:border-[#38424B] rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-4 h-4 text-[#8C4A27]" />
                <span className="text-xs font-bold uppercase tracking-wide text-[#6E371C] dark:text-[#8FB0C2]">
                  {t("inf_suggest")} · {selectedOven.name}
                </span>
              </div>
              {[["phase1", t("tl_phase1")], ["phase2", t("tl_phase2")], ["phase3", t("tl_phase3")]].map(([k, label]) => {
                const temp = selectedOven[`${k}_temp`];
                const mins = selectedOven[`${k}_minutes`];
                if (temp == null && mins == null) return null;
                const fan = selectedOven.oven_type === "ventilato";
                const shownTemp = temp != null ? (fan ? Math.round(temp - 20) : temp) : null;
                return (
                  <div key={k} className="flex items-center justify-between font-mono-data text-sm py-0.5">
                    <span className="text-[#3F4A54] dark:text-[#AEB8BF]">{label}</span>
                    <span className="text-[#6E371C] dark:text-[#8FB0C2] font-bold">
                      {shownTemp != null ? `${shownTemp}°C` : "—"}{mins != null ? ` · ${mins}′` : ""}
                    </span>
                  </div>
                );
              })}
              <p className="text-xs text-[#7E8A93] mt-2 leading-relaxed">
                {selectedOven.oven_type === "ventilato" ? t("inf_fan_note") : t("inf_static_note")}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
