import { useState, useEffect } from "react";
import { ArrowLeft, Loader2, Download, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// STADIO 4 — Pulizia dati vecchi (SOLO admin). Backup obbligatorio prima della cancellazione.
export default function PuliziaDati({ onBack }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const [scan, setScan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [backupToken, setBackupToken] = useState("");
  const [confirmWord, setConfirmWord] = useState("");
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState(null);

  const doScan = async () => {
    setLoading(true);
    try { const r = await api.get("/admin/data-cleanup/scan"); setScan(r.data); }
    catch { toast.error(tri("Scansione non riuscita", "Scan fehlgeschlagen", "Scan failed")); }
    finally { setLoading(false); }
  };
  useEffect(() => { doScan(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const downloadBackup = async () => {
    setBusy(true);
    try {
      const r = await api.get("/admin/data-cleanup/backup", { responseType: "blob" });
      const token = r.headers["x-backup-token"] || "";
      setBackupToken(token);
      const url = URL.createObjectURL(r.data);
      const a = document.createElement("a");
      a.href = url; a.download = `mikilab_backup_dati_vecchi_${new Date().toISOString().slice(0, 10)}.json.gz`;
      a.click(); URL.revokeObjectURL(url);
      toast.success(tri("Backup scaricato. Ora puoi cancellare.", "Backup heruntergeladen. Jetzt kannst du löschen.", "Backup downloaded. You can now delete."));
    } catch { toast.error(tri("Backup non riuscito", "Backup fehlgeschlagen", "Backup failed")); }
    finally { setBusy(false); }
  };

  const doDelete = async () => {
    setBusy(true);
    try {
      const r = await api.post("/admin/data-cleanup/execute", { confirm: confirmWord.trim(), backup_token: backupToken });
      setReport(r.data);
      toast.success(tri("Dati vecchi cancellati.", "Alte Daten gelöscht.", "Old data deleted."));
      setBackupToken(""); setConfirmWord("");
      doScan();
    } catch (e) {
      toast.error(e?.response?.data?.detail || tri("Cancellazione non riuscita", "Löschen fehlgeschlagen", "Delete failed"));
    } finally { setBusy(false); }
  };

  const canDelete = !!backupToken && confirmWord.trim() === "CANCELLA" && !busy;

  return (
    <div className="max-w-3xl mx-auto space-y-4" data-testid="pulizia-dati-page">
      <button data-testid="cleanup-back" onClick={onBack} className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> {tri("Indietro", "Zurück", "Back")}
      </button>
      <div>
        <h1 className="font-display text-2xl font-black text-foreground">{tri("Pulizia dati vecchi", "Alte Daten bereinigen", "Clean old data")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{tri(
          "Rimuove i dati storici (azienda, squadra, chat, PIN, community, utenti non admin). Tiene ricette, extra, corsi, pagine e il tuo account. Scarica sempre il backup prima di cancellare.",
          "Entfernt Altdaten (Betrieb, Team, Chat, PIN, Community, Nicht-Admin-Nutzer). Behält Rezepte, Extras, Kurse, Seiten und dein Konto. Lade immer zuerst das Backup herunter.",
          "Removes historical data (company, team, chat, PIN, community, non-admin users). Keeps recipes, extras, courses, pages and your account. Always download the backup before deleting.")}</p>
      </div>

      <button data-testid="cleanup-rescan" onClick={doScan} disabled={loading}
        className="inline-flex items-center gap-2 py-2 px-3 rounded-lg bg-background border border-border text-foreground font-bold text-xs">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} {tri("Rileggi", "Neu laden", "Rescan")}
      </button>

      {scan && (
        <div className="grid grid-cols-2 gap-3" data-testid="cleanup-tables">
          <div className="rounded-2xl border border-border bg-background p-3">
            <p className="text-[11px] font-black uppercase tracking-wide text-accent mb-2">{tri("TIENI", "BEHALTEN", "KEEP")} ({scan.keep_count})</p>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {scan.keep.map((r) => (<div key={r.collection} className="flex justify-between text-[12px] text-foreground"><span className="truncate">{r.collection}</span><span className="font-bold ml-2">{r.count}</span></div>))}
            </div>
          </div>
          <div className="rounded-2xl border border-mattone/40 bg-mattone/5 p-3">
            <p className="text-[11px] font-black uppercase tracking-wide text-mattone mb-2">{tri("CANCELLA", "LÖSCHEN", "DELETE")} ({scan.delete_count})</p>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {scan.delete.map((r) => (<div key={r.collection} className="flex justify-between text-[12px] text-foreground"><span className="truncate">{r.collection}</span><span className="font-bold ml-2">{r.count}</span></div>))}
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-background p-4 space-y-3">
        <button data-testid="cleanup-backup-btn" onClick={downloadBackup} disabled={busy}
          className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm active:scale-95 disabled:opacity-60">
          {busy && !report ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} {tri("Scarica backup", "Backup herunterladen", "Download backup")}
        </button>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{tri("Scrivi CANCELLA per confermare", "Schreibe CANCELLA zur Bestätigung", "Type CANCELLA to confirm")}</label>
          <input data-testid="cleanup-confirm-input" value={confirmWord} onChange={(e) => setConfirmWord(e.target.value)} placeholder="CANCELLA"
            className="mt-1 w-full bg-card border border-border rounded-xl p-3 text-base outline-none focus:border-mattone" />
        </div>
        <button data-testid="cleanup-delete-btn" onClick={doDelete} disabled={!canDelete}
          className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-mattone text-white font-bold text-sm active:scale-95 disabled:opacity-40">
          {busy && report === null && backupToken ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} {tri("Cancella dati vecchi", "Alte Daten löschen", "Delete old data")}
        </button>
        {!backupToken && <p className="text-[11px] text-muted-foreground">{tri("Attivo solo dopo aver scaricato il backup in questa sessione.", "Erst nach dem Backup-Download in dieser Sitzung aktiv.", "Enabled only after downloading the backup in this session.")}</p>}
      </div>

      {report && (
        <div className="rounded-2xl border border-accent/40 bg-accent/5 p-4" data-testid="cleanup-report">
          <p className="text-sm font-black text-foreground mb-2">{tri("Riepilogo cancellazione", "Löschbericht", "Deletion summary")}</p>
          <p className="text-[12px] text-foreground">{tri("Utenti non admin rimossi", "Nicht-Admin-Nutzer entfernt", "Non-admin users removed")}: <b>{report.utenti_non_admin_rimossi}</b> · {tri("sessioni", "Sitzungen", "sessions")}: <b>{report.sessioni_rimosse}</b></p>
          {report.ricette_extra_rimosse?.length > 0 && <p className="text-[12px] text-foreground">{tri("Ricette extra rimosse", "Extra-Rezepte entfernt", "Extra recipes removed")}: {report.ricette_extra_rimosse.map((x) => x.name).join(", ")}</p>}
          {report.chiavi_app_meta_rimosse?.length > 0 && <p className="text-[12px] text-foreground">app_meta: {report.chiavi_app_meta_rimosse.join(", ")}</p>}
          <div className="mt-2 max-h-56 overflow-y-auto space-y-0.5">
            {report.collezioni_svuotate?.filter((c) => c.rimossi > 0).map((c) => (<div key={c.collection} className="flex justify-between text-[12px] text-muted-foreground"><span className="truncate">{c.collection}</span><span className="font-bold ml-2">-{c.rimossi}</span></div>))}
          </div>
        </div>
      )}
    </div>
  );
}
