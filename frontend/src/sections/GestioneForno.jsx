import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Flame, Plus, Trash2, Play, Pause, RotateCcw } from "lucide-react";
import { ovenApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";

const emptyProfile = {
  name: "", oven_type: "statico", preheat_temp: "", phase1_temp: "", phase1_minutes: "",
  phase2_temp: "", phase2_minutes: "", phase3_temp: "", phase3_minutes: "", notes: "",
};

function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.value = 880; o.type = "sine";
    g.gain.setValueAtTime(0.4, ctx.currentTime);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
    o.stop(ctx.currentTime + 1.2);
  } catch { /* no audio */ }
}

async function ensureNotifyPermission() {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const p = await Notification.requestPermission();
  return p === "granted";
}

function notify(title, body) {
  try {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body, icon: "/favicon.ico", tag: "mikilab-timer" });
    }
  } catch { /* ignore */ }
}

export default function GestioneForno() {
  const [profiles, setProfiles] = useState([]);
  const [form, setForm] = useState(emptyProfile);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const { t } = useLang();

  const load = async () => {
    try {
      setProfiles(await ovenApi.list());
    } catch {
      toast.error(t("toast_oven_error"));
    }
  };
  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.name.trim()) return;
    const payload = { name: form.name.trim(), notes: form.notes, oven_type: form.oven_type };
    ["preheat_temp", "phase1_temp", "phase1_minutes", "phase2_temp", "phase2_minutes", "phase3_temp", "phase3_minutes"]
      .forEach((k) => { payload[k] = form[k] === "" ? null : Number(form[k]); });
    try {
      if (editingId) await ovenApi.update(editingId, payload);
      else await ovenApi.create(payload);
      toast.success(t("toast_oven_saved"));
      setForm(emptyProfile); setEditingId(null); setShowForm(false); load();
    } catch { toast.error(t("toast_save_error")); }
  };

  const edit = (p) => {
    setForm({ ...emptyProfile, ...Object.fromEntries(Object.entries(p).map(([k, v]) => [k, v ?? ""])) });
    setEditingId(p.id); setShowForm(true);
  };

  const remove = async (id) => {
    try { await ovenApi.remove(id); toast.success(t("toast_oven_deleted")); load(); }
    catch { toast.error(t("toast_generic_error")); }
  };

  return (
    <div className="pb-4">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-11 h-11 rounded-2xl bg-[#F26419] flex items-center justify-center">
          <Flame className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-[#2B303B] dark:text-[#e4eff8]">{t("oven_title")}</h1>
          <p className="text-sm text-[#7E8A93]">{t("oven_subtitle")}</p>
        </div>
      </div>

      {!showForm && (
        <button
          data-testid="add-oven-profile-btn"
          onClick={() => { setForm(emptyProfile); setEditingId(null); setShowForm(true); }}
          className="w-full mt-5 bg-[#F26419] hover:bg-[#E8A838] text-white font-semibold px-5 py-3.5 rounded-2xl shadow-md active:scale-98 transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" /> {t("oven_new")}
        </button>
      )}

      {showForm && (
        <div className="mt-5 bg-white dark:bg-[#18202E] border border-[#26324A] dark:border-[#26324A] rounded-2xl p-4 space-y-3">
          <input
            data-testid="oven-name-input"
            value={form.name} onChange={(e) => set("name", e.target.value)}
            placeholder={t("oven_name_ph")}
            className="w-full bg-[#e4eff8] dark:bg-[#18202E] border border-[#26324A] dark:border-[#26324A] rounded-2xl shadow-md border border-amber-900/40 p-3 outline-none focus:border-[#F26419]"
          />
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-[#7E8A93]">{t("oven_type")}</label>
            <select
              data-testid="oven-type-select"
              value={form.oven_type} onChange={(e) => set("oven_type", e.target.value)}
              className="mt-1 w-full bg-[#e4eff8] dark:bg-[#18202E] border border-[#26324A] dark:border-[#26324A] rounded-2xl shadow-md border border-amber-900/40 p-3 outline-none focus:border-[#F26419]"
            >
              <option value="statico">{t("oven_type_static")}</option>
              <option value="ventilato">{t("oven_type_fan")}</option>
            </select>
          </div>
          <NumRow label={t("oven_preheat")} k="preheat_temp" form={form} set={set} />
          <div className="text-xs font-semibold uppercase tracking-wide text-[#7E8A93] pt-1">{t("oven_phase1")}</div>
          <div className="grid grid-cols-2 gap-2">
            <NumRow label="°C" k="phase1_temp" form={form} set={set} />
            <NumRow label={t("oven_min")} k="phase1_minutes" form={form} set={set} />
          </div>
          <div className="text-xs font-semibold uppercase tracking-wide text-[#7E8A93] pt-1">{t("oven_phase2")}</div>
          <div className="grid grid-cols-2 gap-2">
            <NumRow label="°C" k="phase2_temp" form={form} set={set} />
            <NumRow label={t("oven_min")} k="phase2_minutes" form={form} set={set} />
          </div>
          <div className="text-xs font-semibold uppercase tracking-wide text-[#7E8A93] pt-1">{t("oven_phase3")}</div>
          <div className="grid grid-cols-2 gap-2">
            <NumRow label="°C" k="phase3_temp" form={form} set={set} />
            <NumRow label={t("oven_min")} k="phase3_minutes" form={form} set={set} />
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={() => { setShowForm(false); setEditingId(null); }}
              className="flex-1 bg-[#e4eff8] dark:bg-[#18202E] px-4 py-3 rounded-2xl shadow-md border border-amber-900/40 border border-[#26324A] dark:border-[#26324A] font-medium">
              {t("cancel")}
            </button>
            <button data-testid="oven-save-btn" onClick={save}
              className="flex-1 bg-[#F26419] hover:bg-[#E8A838] text-white font-semibold px-4 py-3 rounded-2xl shadow-md border border-amber-900/40">
              {t("save")}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3 mt-5">
        {profiles.map((p) => (
          <div key={p.id} data-testid={`oven-profile-${p.id}`} className="bg-white dark:bg-[#18202E] border border-[#26324A] dark:border-[#26324A] rounded-2xl p-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display text-xl font-semibold text-[#2B303B] dark:text-[#e4eff8]">{p.name}</h3>
                <span data-testid={`oven-type-${p.id}`} className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wide text-[#F26419] dark:text-[#8FB0C2] bg-[#F26419]/15 px-2 py-0.5 rounded-full border border-[#F26419]/30">
                  {p.oven_type === "ventilato" ? t("oven_type_fan") : t("oven_type_static")}
                </span>
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => edit(p)} className="w-8 h-8 rounded-lg bg-[#e4eff8] dark:bg-[#18202E] flex items-center justify-center text-[#F26419]">✎</button>
                <button data-testid={`delete-oven-${p.id}`} onClick={() => remove(p.id)} className="w-8 h-8 rounded-lg bg-[#e4eff8] dark:bg-[#18202E] flex items-center justify-center text-[#F26419]">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            {p.preheat_temp != null && (
              <p className="font-mono-data text-sm text-[#7E8A93] mt-1">{t("oven_preheat_short")} {p.preheat_temp}°C</p>
            )}
            <div className="mt-3 space-y-2">
              <PhaseTimer label={t("tl_phase1")} temp={p.phase1_temp} minutes={p.phase1_minutes} onDone={() => { beep(); toast(t("notify_phase1_done")); notify(t("notify_oven_title"), `${p.name}: ${t("notify_phase1_done")}`); }} />
              <PhaseTimer label={t("tl_phase2")} temp={p.phase2_temp} minutes={p.phase2_minutes} onDone={() => { beep(); toast(t("notify_phase2_done")); notify(t("notify_oven_title"), `${p.name}: ${t("notify_phase2_done")}`); }} />
              <PhaseTimer label={t("tl_phase3")} temp={p.phase3_temp} minutes={p.phase3_minutes} onDone={() => { beep(); toast(t("notify_bake_done")); notify(t("notify_oven_title"), `${p.name}: ${t("notify_bake_done")}`); }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NumRow({ label, k, form, set }) {
  return (
    <div className="flex items-center gap-2 bg-[#e4eff8] dark:bg-[#18202E] border border-[#26324A] dark:border-[#26324A] rounded-2xl shadow-md border border-amber-900/40 px-3 py-2">
      <span className="text-sm text-[#7E8A93] flex-1">{label}</span>
      <input
        data-testid={`oven-${k}-input`}
        type="number" value={form[k]} onChange={(e) => set(k, e.target.value)}
        className="w-16 text-right font-mono-data font-bold text-[#F26419] dark:text-[#8FB0C2] bg-transparent outline-none"
      />
    </div>
  );
}

function PhaseTimer({ label, temp, minutes, onDone }) {
  const totalSec = Math.round(Number(minutes || 0) * 60);
  const [left, setLeft] = useState(totalSec);
  const [running, setRunning] = useState(false);
  const ref = useRef(null);
  const endRef = useRef(null);

  useEffect(() => { setLeft(totalSec); }, [totalSec]);

  useEffect(() => {
    if (running) {
      // Absolute end time keeps the countdown accurate even if the tab is
      // throttled / the screen is off; on resume it recomputes from the clock.
      endRef.current = Date.now() + left * 1000;
      const tick = () => {
        const remaining = Math.round((endRef.current - Date.now()) / 1000);
        if (remaining <= 0) {
          clearInterval(ref.current);
          setRunning(false);
          setLeft(0);
          onDone && onDone();
        } else {
          setLeft(remaining);
        }
      };
      ref.current = setInterval(tick, 1000);
    }
    return () => clearInterval(ref.current);
    // eslint-disable-next-line
  }, [running]);

  const start = async () => {
    if (!running) await ensureNotifyPermission();
    setRunning((r) => !r);
  };

  if (!minutes) return null;
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");

  return (
    <div className="flex items-center gap-2 bg-[#e4eff8] dark:bg-[#18202E] rounded-2xl shadow-md border border-amber-900/40 px-3 py-2 border border-[#26324A] dark:border-[#26324A]">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-[#3F4A54] dark:text-[#AEB8BF] truncate">{label}</p>
        <p className="font-mono-data text-xs text-[#7E8A93]">{temp != null ? `${temp}°C · ` : ""}{minutes} min</p>
      </div>
      <span data-testid="timer-display" className="font-mono-data font-bold text-lg text-[#F26419] dark:text-[#8FB0C2] tabular-nums">{mm}:{ss}</span>
      <button data-testid="timer-toggle" onClick={start} className="w-8 h-8 rounded-lg bg-[#F26419] text-white flex items-center justify-center">
        {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
      </button>
      <button data-testid="timer-reset" onClick={() => { setRunning(false); setLeft(totalSec); }} className="w-8 h-8 rounded-lg bg-white dark:bg-[#18202E] border border-[#26324A] dark:border-[#26324A] flex items-center justify-center text-[#7E8A93]">
        <RotateCcw className="w-4 h-4" />
      </button>
    </div>
  );
}
