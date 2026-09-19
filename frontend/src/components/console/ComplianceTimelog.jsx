import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { ScrollText, ShieldCheck, ShieldAlert, AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { complianceApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

const ACTION_LABEL = {
  in: { it: "Entrata", de: "Beginn", en: "Clock-in", es: "Entrada", fr: "Entrée", fa: "ورود" },
  out: { it: "Uscita", de: "Ende", en: "Clock-out", es: "Salida", fr: "Sortie", fa: "خروج" },
  break_start: { it: "Inizio pausa", de: "Pause-Start", en: "Break start", es: "Inicio pausa", fr: "Début pause", fa: "شروع استراحت" },
  break_end: { it: "Fine pausa", de: "Pause-Ende", en: "Break end", es: "Fin pausa", fr: "Fin pause", fa: "پایان استراحت" },
};

// Report timbrature ArbZG per il Capo: flag rossi su superamenti, stato integrità catena hash.
export const ComplianceTimelog = () => {
  const { lang } = useLang();
  const tri = mkTri(lang);
  const [day, setDay] = useState(() => new Date().toISOString().slice(0, 10));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [erasing, setErasing] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    complianceApi.timelog(undefined, day).then(setData).catch(() => setData({ entries: [], summaries: {}, integrity_ok: true, count: 0 })).finally(() => setLoading(false));
  }, [day]);
  useEffect(() => { load(); }, [load]);

  const erase = async (worker) => {
    if (!window.confirm(tri(`Cancellare TUTTI i dati di conformità di ${worker}? (GDPR, irreversibile)`, `Alle Compliance-Daten von ${worker} löschen?`, `Delete ALL compliance data for ${worker}? (GDPR, irreversible)`, `¿Borrar datos de ${worker}?`, `Supprimer les données de ${worker} ?`, `حذف داده‌های ${worker}؟`))) return;
    setErasing(worker);
    try { const r = await complianceApi.eraseRequest(worker); toast.success(tri(`Cancellati ${r.deleted_timelog} timbrature e ${r.deleted_training_ack} formazioni di ${worker}.`, `${r.deleted_timelog} Einträge gelöscht.`, `Deleted ${r.deleted_timelog} logs and ${r.deleted_training_ack} acks for ${worker}.`, `Borrados ${r.deleted_timelog} registros.`, `${r.deleted_timelog} entrées supprimées.`, `حذف شد.`)); load(); }
    catch { toast.error(tri("Cancellazione non riuscita", "Löschen fehlgeschlagen", "Erase failed", "Error", "Échec", "ناموفق")); }
    setErasing("");
  };

  const workers = data ? Object.keys(data.summaries || {}) : [];
  const al = (a) => (ACTION_LABEL[a] || {})[lang] || (ACTION_LABEL[a] || {}).it || a;

  return (
    <div data-testid="compliance-timelog" className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="flex items-center gap-2 text-[12px] font-black uppercase tracking-widest text-muted-foreground"><ScrollText className="w-4 h-4" /> {tri("Registro Orari ArbZG", "ArbZG-Zeiterfassung", "ArbZG Time Log", "Registro ArbZG", "Journal ArbZG", "ثبت ساعت ArbZG")}</p>
        <div className="flex items-center gap-2">
          <input type="date" data-testid="timelog-day" value={day} onChange={(e) => setDay(e.target.value)} className="bg-background border border-border rounded-lg px-2.5 py-1.5 text-[12px] text-foreground" />
          {data && (
            <span data-testid="timelog-integrity" className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border ${data.integrity_ok ? "text-accent border-accent/40 bg-accent/10" : "text-muted-foreground border-border/50 bg-muted/10"}`}>
              {data.integrity_ok ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
              {data.integrity_ok ? tri("Catena integra", "Kette intakt", "Chain intact", "Cadena íntegra", "Chaîne intègre", "زنجیره سالم") : tri("Catena compromessa", "Kette kompromittiert", "Chain tampered", "Cadena alterada", "Chaîne altérée", "زنجیره دستکاری شده")}
            </span>
          )}
        </div>
      </div>

      {loading && <div className="py-6 text-center"><Loader2 className="w-5 h-5 animate-spin inline text-muted-foreground" /></div>}
      {!loading && workers.length === 0 && <p className="text-[12px] text-muted-foreground py-4">{tri("Nessuna timbratura per questo giorno.", "Keine Einträge für diesen Tag.", "No entries for this day.", "Sin registros para este día.", "Aucune entrée pour ce jour.", "برای این روز ثبتی نیست.")}</p>}

      {workers.map((w) => {
        const s = data.summaries[w] || {};
        const evs = (data.entries || []).filter((e) => e.worker === w);
        return (
          <div key={w} data-testid={`timelog-worker-${w}`} className={`rounded-xl border p-3 ${s.compliant ? "border-border/60 bg-background" : "border-border/50 bg-muted/8"}`}>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[13px] font-bold text-foreground">{w}</span>
              <span className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground">{tri("Lavoro", "Arbeit", "Work", "Trabajo", "Travail", "کار")} {Math.floor((s.work_min || 0) / 60)}h{(s.work_min || 0) % 60}′ · {tri("pausa", "Pause", "break", "pausa", "pause", "استراحت")} {s.break_min || 0}′</span>
                <button data-testid={`timelog-erase-${w}`} onClick={() => erase(w)} disabled={erasing === w} title={tri("Cancella dati (GDPR)", "Daten löschen", "Erase data (GDPR)", "Borrar (GDPR)", "Supprimer (GDPR)", "حذف")} className="w-7 h-7 inline-flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-muted-foreground hover:border-border/50 active:scale-95 disabled:opacity-50">{erasing === w ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}</button>
              </span>
            </div>
            {!s.compliant && (data.summaries[w].flags || []).map((f, i) => (
              <p key={i} data-testid={`timelog-flag-${w}-${i}`} className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground font-semibold mb-1"><AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {f}</p>
            ))}
            <div className="flex flex-wrap gap-1.5 mt-1">
              {evs.map((e, i) => (
                <span key={i} className="text-[10.5px] px-2 py-1 rounded-lg bg-background border border-border text-muted-foreground">
                  {al(e.action)} {String(e.at).slice(11, 16)}{e.verified ? " ✓" : ""}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
