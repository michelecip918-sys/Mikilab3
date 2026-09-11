import { useState, useEffect, useCallback } from "react";
import { ClipboardList, RefreshCw, Check, X } from "lucide-react";
import { floorApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// Il Capo legge i rapporti di fine turno compilati dagli operai in Produzione.
export default function FloorShiftReports() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [reports, setReports] = useState([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setBusy(true);
    floorApi.shiftReports().then((d) => setReports(d.reports || [])).catch(() => {}).finally(() => setBusy(false));
  }, []);
  useEffect(() => { load(); const id = setInterval(load, 30000); return () => clearInterval(id); }, [load]);

  const fmt = (iso) => { try { return new Date(iso).toLocaleString(lang === "it" ? "it-IT" : lang === "de" ? "de-DE" : "en-GB", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }); } catch { return iso; } };

  return (
    <div data-testid="floor-shift-reports" className="space-y-2.5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-[#94A3B8]">{tri("Rapporti compilati dagli operai a fine turno.", "Von den Mitarbeitern am Schichtende ausgefüllt.", "Filled in by operators at end of shift.", "Rellenados por los operarios al final del turno.", "Remplis par les opérateurs en fin de service.", "توسط اپراتورها در پایان شیفت پر شده.")}</p>
        <button data-testid="floor-reports-refresh" onClick={load} className="shrink-0 w-8 h-8 rounded-lg bg-[#0C1019] border border-[#1e293b] text-[#94A3B8] flex items-center justify-center active:scale-95"><RefreshCw className={`w-4 h-4 ${busy ? "animate-spin" : ""}`} /></button>
      </div>
      {reports.length === 0 ? (
        <div className="rounded-xl bg-[#0C1019] border border-[#1e293b] px-3 py-4 text-center text-[12px] text-[#64748B]">{tri("Nessun rapporto ancora.", "Noch keine Berichte.", "No reports yet.", "Sin informes aún.", "Aucun rapport.", "هنوز گزارشی نیست.")}</div>
      ) : (
        <div className="space-y-2">
          {reports.map((r) => (
            <div key={r.id} data-testid={`floor-report-${r.id}`} className="rounded-xl bg-[#0C1019] border border-[#1e293b] p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <ClipboardList className="w-4 h-4 text-[#6e9e85] shrink-0" />
                <span className="text-sm font-black text-white flex-1 min-w-0 truncate">{r.operator || tri("Operatore", "Bediener", "Operator", "Operario", "Opérateur", "اپراتور")}{r.role && r.role !== r.operator ? ` · ${r.role}` : ""}</span>
                <span className="shrink-0 text-[10px] text-[#64748B]">{fmt(r.at)}</span>
              </div>
              <div className="space-y-1 text-[12px] text-[#cbd5e1]">
                {r.pieces && <p><span className="text-[#94A3B8]">{tri("Pezzi", "Stück", "Pieces", "Piezas", "Pièces", "قطعات")}:</span> {r.pieces}</p>}
                {r.waste && <p><span className="text-[#94A3B8]">{tri("Scarti", "Ausschuss", "Waste", "Desperdicios", "Rebuts", "ضایعات")}:</span> {r.waste}</p>}
                {r.issues && <p className="text-[#aaa795]"><span className="text-[#94A3B8]">{tri("Problemi", "Probleme", "Issues", "Problemas", "Problèmes", "مشکلات")}:</span> {r.issues}</p>}
                {r.notes && <p><span className="text-[#94A3B8]">{tri("Note", "Notiz", "Notes", "Notas", "Notes", "یادداشت")}:</span> {r.notes}</p>}
                <p className="flex items-center gap-1.5">
                  <span className="text-[#94A3B8]">{tri("Pulizia", "Reinigung", "Cleaning", "Limpieza", "Nettoyage", "نظافت")}:</span>
                  {r.cleaning_done ? <span className="inline-flex items-center gap-0.5 text-emerald-400 font-bold"><Check className="w-3.5 h-3.5" /> {tri("fatta", "erledigt", "done", "hecha", "faite", "انجام‌شده")}</span> : <span className="inline-flex items-center gap-0.5 text-rose-400 font-bold"><X className="w-3.5 h-3.5" /> {tri("no", "nein", "no", "no", "non", "خیر")}</span>}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
