import { useState, useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import { Timer, Plus, Trash2, ChefHat, AlertTriangle, Cog, Hand, Bell } from "lucide-react";
import { recipesApi, weeklyApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";

const DAY_IDS = ["lun", "mar", "mer", "gio", "ven", "sab", "dom"];

function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination); o.frequency.value = 880; o.type = "sine";
    g.gain.setValueAtTime(0.4, ctx.currentTime); o.start();
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2); o.stop(ctx.currentTime + 1.2);
  } catch { /* no audio */ }
}
async function ensureNotify() {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  return (await Notification.requestPermission()) === "granted";
}
function notify(title, body) {
  try {
    if ("Notification" in window && Notification.permission === "granted")
      new Notification(title, { body, tag: "mikilab-knead" });
  } catch { /* ignore */ }
}

function restMin(r) {
  const h = Number(r?.bulk_fermentation_hours || 0) + Number(r?.proofing_hours || 0);
  return h > 0 ? Math.round(h * 60) : 30;
}
function toLocalInput(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function fmt(date, lang) {
  return date.toLocaleTimeString(lang === "de" ? "de-DE" : "it-IT", { hour: "2-digit", minute: "2-digit" });
}

export default function StartDoughs() {
  const { t, lang } = useLang();
  const [recipes, setRecipes] = useState([]);
  const [weekly, setWeekly] = useState([]);
  const [rows, setRows] = useState([]);
  const [startTime, setStartTime] = useState(() => {
    const d = new Date(); d.setMinutes(0, 0, 0); d.setHours(d.getHours() + 1); return toLocalInput(d);
  });
  const [schedule, setSchedule] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [maxChunk, setMaxChunk] = useState(30);
  const [alarmsOn, setAlarmsOn] = useState(false);
  const alarmTimers = useRef([]);

  useEffect(() => () => alarmTimers.current.forEach(clearTimeout), []);

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

  const newRow = (recipe, pieces = 10) => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    recipe_id: recipe.id, pieces, rest_min: restMin(recipe), mix_min: 15, sec_piece: 4,
  });

  const addRow = () => { if (recipes.length) setRows((x) => [...x, newRow(recipes[0])]); };
  const updateRow = (id, patch) => setRows((x) => x.map((r) => r.id === id ? { ...r, ...patch } : r));
  const removeRow = (id) => setRows((x) => x.filter((r) => r.id !== id));
  const onRecipe = (id, rid) => updateRow(id, { recipe_id: rid, rest_min: restMin(recipeById[rid]) });

  const loadDay = (dayId) => {
    if (!dayId) return;
    const dayItems = weekly.filter((w) => w.day === dayId && recipeById[w.recipe_id]);
    setRows(dayItems.map((w) => {
      const rec = recipeById[w.recipe_id];
      const row = newRow(rec, Number(w.pieces || 10));
      return { ...row, id: `${w.id}-sd` };
    }));
    setSchedule(null);
  };

  const compute = () => {
    if (rows.length === 0) { toast.error(t("weekly_empty_share")); return; }
    const start = new Date(startTime);
    // 1) Mixer works one dough at a time. Mix order = longest rest first.
    const mixOrder = [...rows].sort((a, b) => Number(b.rest_min) - Number(a.rest_min));
    let mixCursor = start.getTime();
    const items = mixOrder.map((r) => {
      const rec = recipeById[r.recipe_id];
      const mixMin = Math.max(0, Number(r.mix_min || 0));
      const rest = Math.max(0, Number(r.rest_min || 0));
      const pieces = Math.max(0, Number(r.pieces || 0));
      const formMin = Math.ceil((pieces * Math.max(0, Number(r.sec_piece || 0))) / 60);
      const mixStart = new Date(mixCursor);
      const mixEnd = new Date(mixCursor + mixMin * 60000);
      mixCursor = mixEnd.getTime();
      const readyToForm = new Date(mixEnd.getTime() + rest * 60000);
      return { name: rec?.name || "—", pieces, rest, mixMin, formMin, mixStart, mixEnd, readyToForm };
    });
    // 2) Forming station: split large batches into rounds (<= maxChunk min)
    //    and interleave, always forming the dough closest to over-proofing.
    const chunkCap = Math.max(1, Number(maxChunk || 30));
    const chunks = [];
    items.forEach((it, idx) => {
      it.formStart = null; it.formEnd = null; it.rounds = 0;
      let remaining = it.formMin;
      if (remaining <= 0) { chunks.push({ idx, dur: 0, ready: it.readyToForm.getTime() }); return; }
      while (remaining > 0) {
        const dur = Math.min(chunkCap, remaining);
        chunks.push({ idx, dur, ready: it.readyToForm.getTime() });
        remaining -= dur;
      }
    });
    let cursor = Math.min(...items.map((it) => it.readyToForm.getTime()));
    const done = new Array(chunks.length).fill(false);
    let remainingChunks = chunks.length;
    while (remainingChunks > 0) {
      let candidates = chunks.map((c, i) => ({ c, i })).filter((x) => !done[x.i] && x.c.ready <= cursor);
      if (candidates.length === 0) {
        const nextReady = Math.min(...chunks.filter((c, i) => !done[i]).map((c) => c.ready));
        cursor = nextReady; continue;
      }
      candidates.sort((a, b) => a.c.ready - b.c.ready); // most at risk first
      const { c, i } = candidates[0];
      const it = items[c.idx];
      const cStart = new Date(cursor);
      const cEnd = new Date(cursor + c.dur * 60000);
      if (!it.formStart) it.formStart = cStart;
      it.formEnd = cEnd; it.rounds += 1;
      cursor = cEnd.getTime(); done[i] = true; remainingChunks -= 1;
    }
    items.forEach((it) => {
      it.waitMin = it.formStart ? Math.round((it.formStart.getTime() - it.readyToForm.getTime()) / 60000) : 0;
    });
    setSchedule({ items });
    setAlarmsOn(false);
    alarmTimers.current.forEach(clearTimeout);
    alarmTimers.current = [];
  };

  const enableAlarms = async () => {
    if (!schedule) return;
    const ok = await ensureNotify();
    alarmTimers.current.forEach(clearTimeout);
    alarmTimers.current = [];
    const now = Date.now();
    schedule.items.forEach((it) => {
      const delay = it.mixStart.getTime() - now;
      if (delay > 0 && delay < 24 * 3600 * 1000) {
        alarmTimers.current.push(setTimeout(() => {
          beep();
          toast(`${t("sd_alarm_title")} — ${it.name}`);
          if (ok) notify(t("sd_alarm_title"), `${it.name} · ${fmt(it.mixStart, lang)}`);
        }, delay));
      }
    });
    setAlarmsOn(true);
    toast.success(t("sd_alarms_on"));
  };

  return (
    <div className="pb-4">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-11 h-11 rounded-2xl bg-[#B34A26] flex items-center justify-center">
          <Timer className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-[#2C221E] dark:text-[#F5EFE6]">{t("sd_title")}</h1>
          <p className="text-sm text-[#8C7567]">{t("sd_subtitle")}</p>
        </div>
      </div>

      {loaded && recipes.length === 0 && (
        <div className="mt-5 flex items-start gap-3 bg-[#D99B26]/15 border border-[#D99B26]/30 rounded-2xl p-4">
          <AlertTriangle className="w-5 h-5 text-[#B34A26] shrink-0 mt-0.5" />
          <p className="text-sm text-[#4A3B34] dark:text-[#C9BBB0]">{t("sd_no_recipes")}</p>
        </div>
      )}

      <div className="mt-5 bg-white dark:bg-[#2A211D] border border-[#E8DEC8] dark:border-[#3D302A] rounded-2xl px-4 py-3">
        <label className="text-xs font-semibold uppercase tracking-wide text-[#8C7567]">{t("sd_start_work")}</label>
        <input
          data-testid="sd-ready-time"
          type="datetime-local" value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className="mt-1 w-full font-mono-data bg-[#F5EFE6] dark:bg-[#332823] border border-[#E8DEC8] dark:border-[#3D302A] rounded-lg px-3 py-2 outline-none focus:border-[#B34A26]"
        />
      </div>

      <div className="mt-3">
        <label className="text-xs font-semibold uppercase tracking-wide text-[#8C7567]">{t("sd_load_day")}</label>
        <select
          data-testid="sd-load-day" onChange={(e) => loadDay(e.target.value)} defaultValue=""
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
          <div key={r.id} className="bg-white dark:bg-[#2A211D] border border-[#E8DEC8] dark:border-[#3D302A] rounded-2xl p-3">
            <div className="flex items-center gap-2">
              <select
                data-testid={`sd-recipe-${r.id}`} value={r.recipe_id}
                onChange={(e) => onRecipe(r.id, e.target.value)}
                className="flex-1 min-w-0 bg-[#F5EFE6] dark:bg-[#332823] border border-[#E8DEC8] dark:border-[#3D302A] rounded-lg px-2 py-2 text-sm outline-none focus:border-[#B34A26]"
              >
                {recipes.map((rec) => <option key={rec.id} value={rec.id}>{rec.name}</option>)}
              </select>
              <button onClick={() => removeRow(r.id)} className="text-[#B4442A] p-1 shrink-0" aria-label={t("delete")}>
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2 mt-2">
              <NumField testid={`sd-pieces-${r.id}`} label={t("sd_pieces_short")} value={r.pieces} onChange={(v) => updateRow(r.id, { pieces: v })} />
              <NumField testid={`sd-rest-${r.id}`} label={t("sd_rest_min")} value={r.rest_min} onChange={(v) => updateRow(r.id, { rest_min: v })} />
              <NumField testid={`sd-mix-${r.id}`} label={t("sd_mix_min")} value={r.mix_min} onChange={(v) => updateRow(r.id, { mix_min: v })} />
              <NumField testid={`sd-secpc-${r.id}`} label={t("sd_sec_piece")} value={r.sec_piece} onChange={(v) => updateRow(r.id, { sec_piece: v })} />
            </div>
          </div>
        ))}
      </div>

      <button
        data-testid="sd-add-btn" onClick={addRow} disabled={recipes.length === 0}
        className="w-full mt-2 bg-[#F5EFE6] dark:bg-[#332823] text-[#2C221E] dark:text-[#F5EFE6] font-medium px-4 py-2.5 rounded-xl border border-[#E8DEC8] dark:border-[#3D302A] flex items-center justify-center gap-2 disabled:opacity-40"
      >
        <Plus className="w-4 h-4" /> {t("sd_add")}
      </button>

      <div className="mt-3 flex items-center gap-2 bg-white dark:bg-[#2A211D] border border-[#E8DEC8] dark:border-[#3D302A] rounded-2xl px-4 py-2.5">
        <span className="text-sm text-[#4A3B34] dark:text-[#C9BBB0] flex-1">{t("sd_max_chunk")}</span>
        <input
          data-testid="sd-maxchunk" type="number" value={maxChunk}
          onChange={(e) => setMaxChunk(e.target.value)}
          className="w-16 text-right font-mono-data font-bold text-[#8C3A1D] dark:text-[#E5AC3A] bg-[#F5EFE6] dark:bg-[#332823] border border-[#E8DEC8] dark:border-[#3D302A] rounded-lg px-2 py-1.5 outline-none"
        />
        <span className="text-xs text-[#8C7567]">min</span>
      </div>

      <button
        data-testid="sd-compute-btn" onClick={compute}
        className="w-full mt-3 bg-[#B34A26] hover:bg-[#963B1C] text-white font-semibold px-5 py-3.5 rounded-2xl shadow-md active:scale-98 transition-all"
      >
        {t("sd_compute")}
      </button>

      {schedule && (
        <div data-testid="sd-result" className="mt-5 space-y-2">
          <p className="text-xs text-[#8C7567]">{t("sd_legend")}</p>
          {[...schedule.items].sort((a, b) => a.mixStart - b.mixStart).map((it, i) => (
            <div key={i} className="bg-white dark:bg-[#2A211D] border border-[#E8DEC8] dark:border-[#3D302A] rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#D99B26]/20 text-[#8C3A1D] dark:text-[#E5AC3A] font-mono-data font-bold text-sm flex items-center justify-center shrink-0">{i + 1}</div>
                <p className="text-sm font-medium text-[#2C221E] dark:text-[#F5EFE6] flex-1 truncate">{it.name}</p>
                <span className="font-mono-data text-xs text-[#8C7567]">{it.pieces} {t("sd_pieces_short")}{it.rounds > 1 ? ` · ${it.rounds} ${t("sd_rounds")}` : ""}</span>
              </div>
              <div className="flex flex-wrap gap-2 mt-2 pl-9 font-mono-data text-xs">
                <span className="inline-flex items-center gap-1 text-[#4A3B34] dark:text-[#C9BBB0]">
                  <Cog className="w-3.5 h-3.5 text-[#B34A26]" /> {t("sd_col_mix")} {fmt(it.mixStart, lang)}–{fmt(it.mixEnd, lang)}
                </span>
                <span className="inline-flex items-center gap-1 text-[#4A3B34] dark:text-[#C9BBB0]">
                  <Hand className="w-3.5 h-3.5 text-[#6B8E62]" /> {t("sd_col_form")} {fmt(it.formStart, lang)}–{fmt(it.formEnd, lang)}
                </span>
                {it.waitMin > 0 && (
                  <span className={it.waitMin > 60 ? "text-[#B4442A] font-bold" : "text-[#B4442A]"}>
                    ⏳ {t("sd_wait")} {it.waitMin}′{it.waitMin > 60 ? ` · ⚠️ ${t("sd_overproof")}` : ""}
                  </span>
                )}
              </div>
            </div>
          ))}
          <button
            data-testid="sd-alarms-btn"
            onClick={enableAlarms}
            className={`w-full mt-2 font-semibold px-5 py-3 rounded-2xl flex items-center justify-center gap-2 transition-all ${
              alarmsOn ? "bg-[#6B8E62] text-white" : "bg-[#F5EFE6] dark:bg-[#332823] text-[#2C221E] dark:text-[#F5EFE6] border border-[#E8DEC8] dark:border-[#3D302A]"
            }`}
          >
            <Bell className="w-5 h-5" /> {alarmsOn ? t("sd_alarms_on") : t("sd_alarms")}
          </button>
        </div>
      )}
    </div>
  );
}

function NumField({ testid, label, value, onChange }) {
  return (
    <div className="flex flex-col">
      <span className="text-[9px] uppercase tracking-wide text-[#8C7567] mb-0.5 truncate">{label}</span>
      <input
        data-testid={testid} type="number" value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-right font-mono-data font-bold text-[#8C3A1D] dark:text-[#E5AC3A] bg-[#F5EFE6] dark:bg-[#332823] border border-[#E8DEC8] dark:border-[#3D302A] rounded-lg px-1.5 py-1.5 outline-none"
      />
    </div>
  );
}
