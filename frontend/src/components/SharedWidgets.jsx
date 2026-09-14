import { useEffect, useState, useCallback } from "react";
import { Sparkles, Bell, Cpu, Check, Loader2 } from "lucide-react";
import { atelierApi, deptApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { toast } from "sonner";

const STATUS_META = {
  "attiva": { color: "#22C55E", it: "Attiva", de: "Aktiv", en: "Active", es: "Activa", fr: "Active", fa: "فعال" },
  "in manutenzione": { color: "#E0A106", it: "In manutenzione", de: "Wartung", en: "Maintenance", es: "Mantenimiento", fr: "Maintenance", fa: "تعمیر" },
  "spenta": { color: "#64748B", it: "Spenta", de: "Aus", en: "Off", es: "Apagada", fr: "Éteinte", fa: "خاموش" },
};
const STATUSES = ["attiva", "in manutenzione", "spenta"];

// Sezione macchine del reparto: l'operaio collega/segna lo stato delle proprie macchine.
// In modalità supervisione (Capo) è in sola lettura.
function DeptMachines({ deptKey, operator = "", readOnly = false }) {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [machines, setMachines] = useState([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    if (!deptKey) return;
    deptApi.machinesGet(deptKey).then((d) => { setMachines(d.machines || []); setDirty(false); }).catch(() => {});
  }, [deptKey]);

  useEffect(() => {
    load();
    const id = setInterval(() => { if (!dirty) load(); }, 30000);
    return () => clearInterval(id);
  }, [load, dirty]);

  const setField = (id, patch) => { setMachines((ms) => ms.map((m) => (m.id === id ? { ...m, ...patch } : m))); setDirty(true); };

  const save = async () => {
    setSaving(true);
    try {
      const payload = { machines: machines.map((m) => ({ id: m.id, status: m.status, value: m.value || "" })), operator };
      const res = await deptApi.machinesSet(deptKey, payload);
      setMachines(res.machines || machines);
      setDirty(false);
      toast.success(tri("Stato macchine salvato", "Maschinenstatus gespeichert", "Machine status saved", "Estado guardado", "État enregistré", "وضعیت ذخیره شد"));
    } catch {
      toast.error(tri("Errore nel salvataggio", "Fehler beim Speichern", "Save error", "Error al guardar", "Erreur d'enregistrement", "خطا در ذخیره"));
    } finally { setSaving(false); }
  };

  if (!deptKey || !machines.length) return null;

  return (
    <div data-testid="dept-machines" className="rounded-2xl border border-[#3E9C93]/25 bg-[#0C1019]/50 p-4 space-y-2.5">
      <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wide text-[#3E9C93]">
        <Cpu className="w-4 h-4" /> {readOnly
          ? tri("Macchine del reparto", "Maschinen der Abteilung", "Department machines", "Máquinas del área", "Machines du rayon", "ماشین‌های بخش")
          : tri("Collega le macchine del tuo reparto", "Verbinde die Maschinen deiner Abteilung", "Connect your department machines", "Conecta las máquinas de tu área", "Connecte les machines de ton rayon", "ماشین‌های بخش خود را وصل کن")}
      </p>
      <div className="space-y-2">
        {machines.map((m) => {
          const meta = STATUS_META[m.status] || STATUS_META.spenta;
          return (
            <div key={m.id} data-testid={`dept-machine-${m.id}`} className="rounded-xl bg-[#060A10] border border-[#1e293b] p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[13px] font-bold text-white min-w-0 truncate">{m.name}</p>
                {readOnly ? (
                  <span data-testid={`dept-machine-status-${m.id}`} className="shrink-0 text-[10px] font-black uppercase px-2 py-1 rounded-full" style={{ color: meta.color, background: `${meta.color}1f`, border: `1px solid ${meta.color}55` }}>
                    {tri(meta.it, meta.de, meta.en, meta.es, meta.fr, meta.fa)}{m.value ? ` · ${m.value}` : ""}
                  </span>
                ) : (
                  <span className="shrink-0 w-2.5 h-2.5 rounded-full" style={{ background: meta.color, boxShadow: `0 0 8px ${meta.color}` }} />
                )}
              </div>
              {!readOnly && (
                <div className="mt-2 flex items-center gap-2">
                  <select data-testid={`dept-machine-select-${m.id}`} value={m.status} onChange={(e) => setField(m.id, { status: e.target.value })}
                    className="flex-1 min-w-0 rounded-lg bg-[#0b0f19] border border-[#3E9C93]/30 px-2.5 py-1.5 text-[12px] text-white">
                    {STATUSES.map((s) => (<option key={s} value={s}>{tri(STATUS_META[s].it, STATUS_META[s].de, STATUS_META[s].en, STATUS_META[s].es, STATUS_META[s].fr, STATUS_META[s].fa)}</option>))}
                  </select>
                  <input data-testid={`dept-machine-value-${m.id}`} value={m.value || ""} onChange={(e) => setField(m.id, { value: e.target.value })}
                    placeholder={tri("es. 220°C", "z.B. 220°C", "e.g. 220°C", "ej. 220°C", "ex. 220°C", "مثلاً ۲۲۰°C")}
                    className="w-28 shrink-0 rounded-lg bg-[#0b0f19] border border-[#3E9C93]/30 px-2.5 py-1.5 text-[12px] text-white placeholder:text-[#64748B]" />
                </div>
              )}
            </div>
          );
        })}
      </div>
      {!readOnly && (
        <button data-testid="dept-machines-save" onClick={save} disabled={saving || !dirty}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-black uppercase tracking-wider bg-[#3E9C93] text-[#04070d] disabled:opacity-40 active:scale-[0.99] transition-all">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          {dirty ? tri("Salva stato macchine", "Status speichern", "Save machine status", "Guardar estado", "Enregistrer l'état", "ذخیره وضعیت") : tri("Aggiornato", "Aktuell", "Up to date", "Actualizado", "À jour", "به‌روز")}
        </button>
      )}
    </div>
  );
}

// Widget che il Capo ha condiviso col reparto (sola lettura) + collegamento macchine del reparto.
export default function SharedWidgets({ dept = "", deptKey = "", readOnly = false, operator = "" }) {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [widgets, setWidgets] = useState([]);

  useEffect(() => {
    let alive = true;
    const load = () => atelierApi.shared(dept).then((d) => { if (alive) setWidgets(d.widgets || []); }).catch(() => {});
    load(); const id = setInterval(load, 30000);
    return () => { alive = false; clearInterval(id); };
  }, [dept]);

  if (!widgets.length && !deptKey) return null;

  return (
    <div className="space-y-4">
      <DeptMachines deptKey={deptKey} operator={operator} readOnly={readOnly} />
      {widgets.length > 0 && (
        <div data-testid="shared-widgets" className="rounded-2xl border border-[#a6b1bc]/25 bg-[#0C1019]/50 p-4 space-y-2.5">
          <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wide text-[#a6b1bc]">
            <Sparkles className="w-4 h-4" /> {tri("Dalla Direzione · condiviso", "Vom Chef · geteilt", "From the Capo · shared", "Del Capo · compartido", "Du Capo · partagé", "از کاپو · اشتراکی")}
          </p>
          {widgets.map((w) => (
            <div key={w.id} data-testid={`shared-widget-${w.id}`} className="rounded-xl bg-[#060A10] border border-[#1e293b] p-3">
              <p className="text-[13px] font-bold text-white mb-1.5">{w.title}</p>
              {w.type === "note" && <p className="text-[12px] text-[#CBD5E1] whitespace-pre-wrap">{w.config.text}</p>}
              {w.type === "metric" && <p className="text-xl font-black text-[#a6b1bc]">{w.config.value || "—"} <span className="text-xs text-[#94A3B8]">{w.config.unit}</span></p>}
              {w.type === "reminder" && <p className="text-[12px] text-[#CBD5E1] flex items-center gap-1.5"><Bell className="w-3.5 h-3.5 text-[#9aa6b2]" />{w.config.text}{w.config.date ? ` · ${w.config.date}` : ""}</p>}
              {w.type === "counter" && <p className="text-xl font-black text-[#a6b1bc]">{w.config.value || 0} <span className="text-xs text-[#94A3B8]">{w.config.label}</span></p>}
              {w.type === "checklist" && (
                <ul className="space-y-1">
                  {(w.config.items || []).map((it, k) => <li key={k} className={`text-[12px] ${it.done ? "line-through text-[#64748B]" : "text-[#CBD5E1]"}`}>• {it.t}</li>)}
                </ul>
              )}
              {w.type === "chart" && (() => {
                const s = w.config.series || []; const max = Math.max(1, ...s.map((p) => Number(p.v) || 0));
                return (
                  <div className="flex items-end gap-1.5 h-20">
                    {s.map((p, k) => (
                      <div key={k} className="flex-1 flex flex-col items-center justify-end h-full">
                        <span className="text-[9px] text-[#a6b1bc] font-bold">{Number(p.v) || 0}</span>
                        <div className="w-full rounded-t" style={{ height: `${Math.max(4, ((Number(p.v) || 0) / max) * 100)}%`, background: "linear-gradient(180deg,#a6b1bc,#8a97a6)" }} />
                        <span className="text-[9px] text-[#64748B] mt-0.5">{p.d}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
