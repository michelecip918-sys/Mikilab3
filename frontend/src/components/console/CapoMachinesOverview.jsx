import { useEffect, useState, useCallback } from "react";
import { Cpu, Eye, X, RefreshCw } from "lucide-react";
import { deptApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import FloorOperatorDay from "@/components/FloorOperatorDay";

const STATUS_COLOR = { "attiva": "#22C55E", "in manutenzione": "#E0A106", "spenta": "#64748B" };

// Vista d'insieme del Capo: stato macchine di tutti i reparti + ispezione di un reparto (sola supervisione).
export default function CapoMachinesOverview() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [depts, setDepts] = useState([]);
  const [inspect, setInspect] = useState(null); // { dept, dept_name }
  const [sel, setSel] = useState("");

  const load = useCallback(() => {
    deptApi.machinesOverview().then((d) => setDepts(d.departments || [])).catch(() => {});
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 20000);
    return () => clearInterval(id);
  }, [load]);

  const statusWord = (st) => (st === "attiva"
    ? tri("attiva", "aktiv", "active", "activa", "active", "فعال")
    : st === "in manutenzione"
      ? tri("manutenzione", "Wartung", "maintenance", "manten.", "maint.", "تعمیر")
      : tri("spenta", "aus", "off", "apagada", "éteinte", "خاموش"));

  return (
    <div data-testid="capo-machines-overview" className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.2em] text-[#3E9C93]">
          <Cpu className="w-4 h-4" /> {tri("Stato macchine · tutti i reparti", "Maschinenstatus · alle Abteilungen", "Machine status · all departments", "Estado · todas las áreas", "État · tous les rayons", "وضعیت · همه بخش‌ها")}
        </p>
        <button data-testid="capo-machines-refresh" onClick={load} className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/5"><RefreshCw className="w-4 h-4" /></button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {depts.map((dp) => (
          <div key={dp.dept} data-testid={`capo-dept-card-${dp.dept}`} className="rounded-xl border p-3.5" style={{ borderColor: `${dp.accent}44`, background: `${dp.accent}0d` }}>
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <span className="inline-flex items-center gap-2 font-black text-[13px] text-white">
                <span className="text-lg leading-none">{dp.icon}</span>{dp.dept_name}
              </span>
              <span className="text-[10px] font-bold" style={{ color: dp.active > 0 ? "#22C55E" : "#64748B" }} data-testid={`capo-dept-active-${dp.dept}`}>
                {dp.active}/{dp.total} {tri("attive", "aktiv", "active", "activas", "actives", "فعال")}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {dp.machines.map((m) => {
                const c = STATUS_COLOR[m.status] || STATUS_COLOR.spenta;
                return (
                  <span key={m.id} data-testid={`capo-machine-chip-${dp.dept}-${m.id}`} title={`${m.name}: ${m.status}${m.value ? " · " + m.value : ""}`}
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-semibold border" style={{ borderColor: `${c}55`, color: c, background: "rgba(3,7,18,0.5)" }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: c, boxShadow: `0 0 6px ${c}` }} />
                    {m.name}{m.value ? ` · ${m.value}` : ` · ${statusWord(m.status)}`}
                  </span>
                );
              })}
            </div>
            <button data-testid={`capo-inspect-btn-${dp.dept}`} onClick={() => setInspect({ dept: dp.dept, dept_name: dp.dept_name })}
              className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold text-[#9aa6b2] hover:text-white">
              <Eye className="w-3.5 h-3.5" /> {tri("Ispeziona reparto", "Abteilung ansehen", "Inspect department", "Inspeccionar", "Inspecter", "بازرسی بخش")}
            </button>
          </div>
        ))}
      </div>

      {/* Selettore rapido reparto da ispezionare */}
      <div className="flex items-center gap-2 pt-1">
        <select data-testid="capo-inspect-select" value={sel} onChange={(e) => setSel(e.target.value)}
          className="flex-1 min-w-0 rounded-lg bg-[#060A10] border border-[#9aa6b2]/30 px-3 py-2 text-sm text-white">
          <option value="">{tri("Scegli un reparto da ispezionare…", "Abteilung wählen…", "Choose a department to inspect…", "Elige un área…", "Choisir un rayon…", "بخشی را انتخاب کن…")}</option>
          {depts.map((dp) => (<option key={dp.dept} value={dp.dept}>{dp.dept_name}</option>))}
        </select>
        <button data-testid="capo-inspect-open" disabled={!sel} onClick={() => { const dp = depts.find((x) => x.dept === sel); if (dp) setInspect({ dept: dp.dept, dept_name: dp.dept_name }); }}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[12px] font-black uppercase tracking-wide bg-[#9aa6b2] text-[#04070d] disabled:opacity-40">
          <Eye className="w-4 h-4" /> {tri("Ispeziona", "Ansehen", "Inspect", "Inspeccionar", "Inspecter", "بازرسی")}
        </button>
      </div>

      {/* Modale supervisione: la stessa schermata dell'operaio, in sola lettura */}
      {inspect && (
        <div data-testid="capo-inspect-modal" className="fixed inset-0 z-[850] bg-[#04070d]/96 backdrop-blur-md overflow-auto">
          <div className="max-w-xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between mb-4 sticky top-0 bg-[#04070d]/90 py-2">
              <p className="font-black text-white text-sm uppercase tracking-wide">{tri("Ispeziona", "Ansehen", "Inspect", "Inspeccionar", "Inspecter", "بازرسی")} · {inspect.dept_name}</p>
              <button data-testid="capo-inspect-close" onClick={() => setInspect(null)} className="p-2 rounded-lg text-white hover:bg-white/10"><X className="w-5 h-5" /></button>
            </div>
            <FloorOperatorDay superviseDept={inspect.dept} superviseDeptName={inspect.dept_name} />
          </div>
        </div>
      )}
    </div>
  );
}
