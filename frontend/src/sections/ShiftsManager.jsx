import { useState, useEffect, useCallback, useMemo } from "react";
import { CalendarClock, Plus, Trash2, ChevronLeft, ChevronRight, Clock, User, MapPin, X, Check, Loader2 } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { shiftsApi } from "@/lib/api";
import { toast } from "sonner";
import { mkTri } from "@/i18n/triMaps";

// Enterprise (e) — Pianificazione Turni: calendario settimanale per negozio,
// con totale ore per persona. Dati sul backend, scoped per proprietario/negozio.

const iso = (d) => { const y = d.getFullYear(); const m = String(d.getMonth() + 1).padStart(2, "0"); const day = String(d.getDate()).padStart(2, "0"); return `${y}-${m}-${day}`; };
const mondayOf = (d) => { const x = new Date(d); const wd = (x.getDay() + 6) % 7; x.setDate(x.getDate() - wd); x.setHours(0, 0, 0, 0); return x; };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

export default function ShiftsManager({ store, storeName }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const loc = mkTri(lang)("it-IT", "de-DE", "en-GB");

  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formDay, setFormDay] = useState(null); // ISO date per cui aggiungere
  const [busy, setBusy] = useState(false);
  const blank = { employee: "", role: "", start: "06:00", end: "14:00", station: "", note: "" };
  const [form, setForm] = useState(blank);

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const weekLabel = `${days[0].toLocaleDateString(loc, { day: "2-digit", month: "short" })} – ${days[6].toLocaleDateString(loc, { day: "2-digit", month: "short" })}`;

  const load = useCallback(async () => { setLoading(true); setShifts(await shiftsApi.list(store)); setLoading(false); }, [store]);
  useEffect(() => { load(); }, [load]);

  const weekShifts = shifts.filter((s) => s.day >= iso(days[0]) && s.day <= iso(days[6]));
  const byDay = (d) => weekShifts.filter((s) => s.day === iso(d)).sort((a, b) => a.start.localeCompare(b.start));

  const hoursByEmployee = useMemo(() => {
    const m = {};
    weekShifts.forEach((s) => { m[s.employee] = (m[s.employee] || 0) + (s.hours || 0); });
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [weekShifts]);

  const save = async () => {
    if (!form.employee.trim()) { toast.error(tri("Inserisci il nome", "Namen eingeben", "Enter a name")); return; }
    setBusy(true);
    try {
      const s = await shiftsApi.create({ store_id: store || null, day: formDay, ...form, employee: form.employee.trim() });
      setShifts((p) => [...p, s]); setForm(blank); setFormDay(null);
    } catch (e) { toast.error(e?.response?.status === 403 ? tri("Riservato ai PRO", "Nur für PRO", "PRO only") : tri("Salvataggio non riuscito", "Speichern fehlgeschlagen", "Save failed")); }
    finally { setBusy(false); }
  };
  const remove = async (id) => { try { await shiftsApi.remove(id); setShifts((p) => p.filter((x) => x.id !== id)); } catch { toast.error(tri("Eliminazione non riuscita", "Löschen fehlgeschlagen", "Delete failed")); } };

  const inp = "w-full bg-[#121212] dark:bg-[#181818] border border-[#2e2e2e] dark:border-[#2e2e2e] rounded-2xl shadow-md border border-amber-900/40 px-3 py-2.5 outline-none text-[#2B303B] dark:text-[#e4eff8] focus:border-[#c94f00]";
  const totalWeek = weekShifts.reduce((a, s) => a + (s.hours || 0), 0);

  return (
    <div className="pb-40" data-testid="shifts-manager">
      <p className="text-xs text-[#7E8A93] mb-3">{tri("Turni del negozio", "Schichten der Filiale", "Shifts for store")}: <b className="text-[#c94f00]">{storeName}</b></p>

      {/* Navigatore settimana */}
      <div className="flex items-center justify-between bg-white dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] rounded-2xl p-2 mb-4">
        <button data-testid="shift-week-prev" onClick={() => setWeekStart((w) => addDays(w, -7))} className="p-2 rounded-2xl shadow-md border border-amber-900/40 hover:bg-[#121212] dark:hover:bg-[#181818]"><ChevronLeft className="w-5 h-5 text-[#c94f00]" /></button>
        <div className="text-center">
          <p className="font-display text-sm font-bold text-[#2B303B] dark:text-[#e4eff8] flex items-center gap-1"><CalendarClock className="w-4 h-4 text-[#c94f00]" /> {weekLabel}</p>
          <p className="text-[11px] text-[#7E8A93]">{tri("Totale settimana", "Woche gesamt", "Week total")}: <b className="font-mono-data">{totalWeek}h</b></p>
        </div>
        <button data-testid="shift-week-next" onClick={() => setWeekStart((w) => addDays(w, 7))} className="p-2 rounded-2xl shadow-md border border-amber-900/40 hover:bg-[#121212] dark:hover:bg-[#181818]"><ChevronRight className="w-5 h-5 text-[#c94f00]" /></button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-[#c94f00]" /></div>
      ) : (
        <div className="space-y-2.5" data-testid="shifts-week">
          {days.map((d) => {
            const dayIso = iso(d);
            const list = byDay(d);
            const dayTot = list.reduce((a, s) => a + (s.hours || 0), 0);
            const isToday = dayIso === iso(new Date());
            return (
              <div key={dayIso} data-testid={`shift-day-${dayIso}`} className={`rounded-2xl border p-3 ${isToday ? "border-[#c94f00] bg-[#c94f00]/5" : "border-[#2e2e2e] dark:border-[#2e2e2e] bg-white dark:bg-[#1e1e1e]"}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="font-display text-sm font-bold text-[#2B303B] dark:text-[#e4eff8] capitalize">{d.toLocaleDateString(loc, { weekday: "long", day: "2-digit", month: "short" })}</p>
                  <div className="flex items-center gap-2">
                    {dayTot > 0 && <span className="text-[11px] font-mono-data text-[#7E8A93]">{dayTot}h</span>}
                    <button data-testid={`shift-add-${dayIso}`} onClick={() => { setFormDay(dayIso); setForm(blank); }} className="w-7 h-7 rounded-lg bg-[#c94f00] text-white flex items-center justify-center active:scale-90"><Plus className="w-4 h-4" /></button>
                  </div>
                </div>

                {list.length === 0 && formDay !== dayIso && <p className="text-[12px] text-[#7E8A93]">{tri("Nessun turno", "Keine Schicht", "No shift")}</p>}

                {list.map((s) => (
                  <div key={s.id} data-testid={`shift-card-${s.id}`} className="flex items-center gap-2 py-1.5 border-t border-[#e4eff8] dark:border-[#2e2e2e] first:border-0">
                    <div className="flex flex-col items-center justify-center bg-[#c94f00]/15 rounded-lg px-2 py-1 min-w-[74px]">
                      <span className="font-mono-data text-[12px] font-bold text-[#c94f00]">{s.start}–{s.end}</span>
                      <span className="text-[10px] text-[#7E8A93]">{s.hours}h</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#2B303B] dark:text-[#e4eff8] truncate flex items-center gap-1"><User className="w-3.5 h-3.5 text-[#7E8A93]" />{s.employee}{s.role ? <span className="text-[11px] text-[#7E8A93] font-normal">· {s.role}</span> : null}</p>
                      {s.station && <p className="text-[11px] text-[#7E8A93] flex items-center gap-1"><MapPin className="w-3 h-3" />{s.station}</p>}
                    </div>
                    <button data-testid={`shift-remove-${s.id}`} onClick={() => remove(s.id)} className="text-[#7E8A93] hover:text-[#E4572E] p-1"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}

                {/* Form inline per il giorno */}
                {formDay === dayIso && (
                  <div data-testid={`shift-form-${dayIso}`} className="mt-2 bg-[#c94f00]/10 border border-[#c94f00]/30 rounded-2xl shadow-md border border-amber-900/40 p-3 space-y-2">
                    <input data-testid="shift-employee" value={form.employee} onChange={(e) => setForm({ ...form, employee: e.target.value })} placeholder={tri("Nome dipendente", "Mitarbeitername", "Employee name")} className={inp} />
                    <div className="grid grid-cols-2 gap-2">
                      <input data-testid="shift-role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder={tri("Ruolo (es. Fornaio)", "Rolle (z.B. Bäcker)", "Role (e.g. Baker)")} className={inp} />
                      <input data-testid="shift-station" value={form.station} onChange={(e) => setForm({ ...form, station: e.target.value })} placeholder={tri("Postazione", "Station", "Station")} className={inp} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="text-[11px] text-[#7E8A93]">{tri("Inizio", "Start", "Start")}<input data-testid="shift-start" type="time" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} className={inp + " mt-0.5 font-mono-data"} /></label>
                      <label className="text-[11px] text-[#7E8A93]">{tri("Fine", "Ende", "End")}<input data-testid="shift-end" type="time" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} className={inp + " mt-0.5 font-mono-data"} /></label>
                    </div>
                    <div className="flex gap-2">
                      <button data-testid="shift-save" onClick={save} disabled={busy} className="flex-1 flex items-center justify-center gap-1 bg-[#c94f00] text-white font-semibold py-2.5 rounded-2xl shadow-md border border-amber-900/40 active:scale-98 disabled:opacity-50">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} {tri("Salva turno", "Schicht speichern", "Save shift")}</button>
                      <button data-testid="shift-cancel" onClick={() => setFormDay(null)} className="px-4 rounded-2xl shadow-md border border-amber-900/40 border border-[#2e2e2e] dark:border-[#2e2e2e] text-[#7E8A93]"><X className="w-4 h-4" /></button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Totale ore per persona */}
      {hoursByEmployee.length > 0 && (
        <div className="mt-5 rounded-2xl bg-white dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] p-4" data-testid="shifts-hours">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#c94f00] mb-2 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {tri("Ore per persona (settimana)", "Stunden pro Person (Woche)", "Hours per person (week)")}</p>
          <div className="space-y-1.5">
            {hoursByEmployee.map(([name, h]) => (
              <div key={name} data-testid={`shift-hours-${name}`} className="flex items-center justify-between text-sm">
                <span className="text-[#2B303B] dark:text-[#e4eff8] font-medium">{name}</span>
                <span className="font-mono-data font-bold text-[#c94f00]">{Math.round(h * 100) / 100}h</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
