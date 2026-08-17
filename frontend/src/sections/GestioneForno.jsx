import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Flame, Plus, Trash2, Play, Pause, RotateCcw } from "lucide-react";
import { ovenApi } from "@/lib/api";

const emptyProfile = {
  name: "", preheat_temp: "", phase1_temp: "", phase1_minutes: "",
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

  const load = async () => {
    try {
      setProfiles(await ovenApi.list());
    } catch {
      toast.error("Errore nel caricamento dei profili forno");
    }
  };
  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.name.trim()) return;
    const payload = { name: form.name.trim(), notes: form.notes };
    ["preheat_temp", "phase1_temp", "phase1_minutes", "phase2_temp", "phase2_minutes", "phase3_temp", "phase3_minutes"]
      .forEach((k) => { payload[k] = form[k] === "" ? null : Number(form[k]); });
    try {
      if (editingId) await ovenApi.update(editingId, payload);
      else await ovenApi.create(payload);
      toast.success("Profilo forno salvato");
      setForm(emptyProfile); setEditingId(null); setShowForm(false); load();
    } catch { toast.error("Errore nel salvataggio"); }
  };

  const edit = (p) => {
    setForm({ ...emptyProfile, ...Object.fromEntries(Object.entries(p).map(([k, v]) => [k, v ?? ""])) });
    setEditingId(p.id); setShowForm(true);
  };

  const remove = async (id) => {
    try { await ovenApi.remove(id); toast.success("Profilo eliminato"); load(); }
    catch { toast.error("Errore"); }
  };

  return (
    <div className="pb-4">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-11 h-11 rounded-2xl bg-[#B34A26] flex items-center justify-center">
          <Flame className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-[#2C221E] dark:text-[#F5EFE6]">Gestione forno</h1>
          <p className="text-sm text-[#8C7567]">Temperature, vapore e timer di cottura</p>
        </div>
      </div>

      {!showForm && (
        <button
          data-testid="add-oven-profile-btn"
          onClick={() => { setForm(emptyProfile); setEditingId(null); setShowForm(true); }}
          className="w-full mt-5 bg-[#B34A26] hover:bg-[#963B1C] text-white font-semibold px-5 py-3.5 rounded-2xl shadow-md active:scale-98 transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" /> Nuovo profilo forno
        </button>
      )}

      {showForm && (
        <div className="mt-5 bg-white dark:bg-[#2A211D] border border-[#E8DEC8] dark:border-[#3D302A] rounded-2xl p-4 space-y-3">
          <input
            data-testid="oven-name-input"
            value={form.name} onChange={(e) => set("name", e.target.value)}
            placeholder="Nome profilo (es. Pentola in ghisa)"
            className="w-full bg-[#F5EFE6] dark:bg-[#332823] border border-[#E8DEC8] dark:border-[#3D302A] rounded-xl p-3 outline-none focus:border-[#B34A26]"
          />
          <NumRow label="Preriscaldo (°C)" k="preheat_temp" form={form} set={set} />
          <div className="text-xs font-semibold uppercase tracking-wide text-[#8C7567] pt-1">Fase 1 · con vapore</div>
          <div className="grid grid-cols-2 gap-2">
            <NumRow label="°C" k="phase1_temp" form={form} set={set} />
            <NumRow label="minuti" k="phase1_minutes" form={form} set={set} />
          </div>
          <div className="text-xs font-semibold uppercase tracking-wide text-[#8C7567] pt-1">Fase 2 · senza vapore</div>
          <div className="grid grid-cols-2 gap-2">
            <NumRow label="°C" k="phase2_temp" form={form} set={set} />
            <NumRow label="minuti" k="phase2_minutes" form={form} set={set} />
          </div>
          <div className="text-xs font-semibold uppercase tracking-wide text-[#8C7567] pt-1">Fase 3 · asciugatura crosta</div>
          <div className="grid grid-cols-2 gap-2">
            <NumRow label="°C" k="phase3_temp" form={form} set={set} />
            <NumRow label="minuti" k="phase3_minutes" form={form} set={set} />
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={() => { setShowForm(false); setEditingId(null); }}
              className="flex-1 bg-[#F5EFE6] dark:bg-[#332823] px-4 py-3 rounded-xl border border-[#E8DEC8] dark:border-[#3D302A] font-medium">
              Annulla
            </button>
            <button data-testid="oven-save-btn" onClick={save}
              className="flex-1 bg-[#B34A26] hover:bg-[#963B1C] text-white font-semibold px-4 py-3 rounded-xl">
              Salva
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3 mt-5">
        {profiles.map((p) => (
          <div key={p.id} data-testid={`oven-profile-${p.id}`} className="bg-white dark:bg-[#2A211D] border border-[#E8DEC8] dark:border-[#3D302A] rounded-2xl p-5">
            <div className="flex items-start justify-between">
              <h3 className="font-display text-xl font-semibold text-[#2C221E] dark:text-[#F5EFE6]">{p.name}</h3>
              <div className="flex gap-1.5">
                <button onClick={() => edit(p)} className="w-8 h-8 rounded-lg bg-[#F5EFE6] dark:bg-[#332823] flex items-center justify-center text-[#B34A26]">✎</button>
                <button data-testid={`delete-oven-${p.id}`} onClick={() => remove(p.id)} className="w-8 h-8 rounded-lg bg-[#F5EFE6] dark:bg-[#332823] flex items-center justify-center text-[#B4442A]">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            {p.preheat_temp != null && (
              <p className="font-mono-data text-sm text-[#8C7567] mt-1">Preriscaldo {p.preheat_temp}°C</p>
            )}
            <div className="mt-3 space-y-2">
              <PhaseTimer label="Fase 1 · vapore" temp={p.phase1_temp} minutes={p.phase1_minutes} onDone={() => { beep(); toast("Fase 1 completata"); notify("Mikilab — Forno", `${p.name}: Fase 1 (vapore) completata`); }} />
              <PhaseTimer label="Fase 2 · senza vapore" temp={p.phase2_temp} minutes={p.phase2_minutes} onDone={() => { beep(); toast("Fase 2 completata"); notify("Mikilab — Forno", `${p.name}: Fase 2 completata`); }} />
              <PhaseTimer label="Fase 3 · asciugatura" temp={p.phase3_temp} minutes={p.phase3_minutes} onDone={() => { beep(); toast("Cottura terminata!"); notify("Mikilab — Forno", `${p.name}: cottura terminata!`); }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NumRow({ label, k, form, set }) {
  return (
    <div className="flex items-center gap-2 bg-[#F5EFE6] dark:bg-[#332823] border border-[#E8DEC8] dark:border-[#3D302A] rounded-xl px-3 py-2">
      <span className="text-sm text-[#8C7567] flex-1">{label}</span>
      <input
        data-testid={`oven-${k}-input`}
        type="number" value={form[k]} onChange={(e) => set(k, e.target.value)}
        className="w-16 text-right font-mono-data font-bold text-[#8C3A1D] dark:text-[#E5AC3A] bg-transparent outline-none"
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
    <div className="flex items-center gap-2 bg-[#F5EFE6] dark:bg-[#332823] rounded-xl px-3 py-2 border border-[#E8DEC8] dark:border-[#3D302A]">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-[#4A3B34] dark:text-[#C9BBB0] truncate">{label}</p>
        <p className="font-mono-data text-xs text-[#8C7567]">{temp != null ? `${temp}°C · ` : ""}{minutes} min</p>
      </div>
      <span data-testid="timer-display" className="font-mono-data font-bold text-lg text-[#8C3A1D] dark:text-[#E5AC3A] tabular-nums">{mm}:{ss}</span>
      <button data-testid="timer-toggle" onClick={start} className="w-8 h-8 rounded-lg bg-[#B34A26] text-white flex items-center justify-center">
        {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
      </button>
      <button data-testid="timer-reset" onClick={() => { setRunning(false); setLeft(totalSec); }} className="w-8 h-8 rounded-lg bg-white dark:bg-[#2A211D] border border-[#E8DEC8] dark:border-[#3D302A] flex items-center justify-center text-[#8C7567]">
        <RotateCcw className="w-4 h-4" />
      </button>
    </div>
  );
}
