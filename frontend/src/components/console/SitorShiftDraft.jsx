import { useState, useEffect, useCallback } from "react";
import { ClipboardCheck, RefreshCw, CheckCircle2, Loader2, Wand2, Clock, AlarmClock } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { deusApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// REPORT FINE TURNO AUTOMATICO — Sitor raccoglie da solo pezzi, scarti e ore
// effettive registrate durante il turno e compila la bozza: il Capo la approva con un tocco.
export default function SitorShiftDraft() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [drafts, setDrafts] = useState([]);
  const [busy, setBusy] = useState(false);
  const [approving, setApproving] = useState("");
  const [sched, setSched] = useState({ enabled: false, time: "20:00" });
  const [schedSaved, setSchedSaved] = useState(false);

  const load = useCallback(() => {
    deusApi.shiftDrafts().then((d) => setDrafts(d.drafts || [])).catch(() => {});
  }, []);
  useEffect(() => { load(); const id = setInterval(load, 45000); return () => clearInterval(id); }, [load]);
  useEffect(() => { deusApi.shiftScheduleGet().then((s) => setSched({ enabled: !!s.enabled, time: s.time || "20:00" })).catch(() => {}); }, []);

  const saveSched = async (next) => {
    setSched(next);
    try {
      await deusApi.shiftScheduleSet({ ...next, lang, tz_offset_min: -new Date().getTimezoneOffset() });
      setSchedSaved(true);
      setTimeout(() => setSchedSaved(false), 1800);
    } catch { toast.error(tri("Errore salvataggio orario.", "Fehler beim Speichern.", "Save error.", "Error al guardar.", "Erreur d'enregistrement.", "خطای ذخیره.")); }
  };

  const today = new Date().toISOString().slice(0, 10);
  const current = drafts.find((d) => d.date === today) || drafts[0] || null;
  const past = drafts.filter((d) => d.id !== (current && current.id)).slice(0, 4);

  const generate = async () => {
    setBusy(true);
    try {
      const r = await deusApi.shiftDraftGenerate(lang);
      if (r.ok) {
        toast.success(tri("Bozza pronta, Capo: leggila e approva.", "Entwurf fertig, Chef: lesen & freigeben.", "Draft ready, Capo: read & approve.", "Borrador listo: léelo y aprueba.", "Brouillon prêt : lisez et approuvez.", "پیش‌نویس آماده است."));
        load();
      } else {
        toast.error(tri("Nessun dato del turno ancora registrato.", "Noch keine Schichtdaten erfasst.", "No shift data recorded yet.", "Aún sin datos del turno.", "Aucune donnée de service.", "هنوز داده‌ای ثبت نشده."));
      }
    } catch {
      toast.error(tri("Sitor non risponde: riprova tra poco.", "Sitor antwortet nicht: gleich erneut.", "Sitor not responding: retry shortly.", "Sitor no responde: reintenta.", "Sitor ne répond pas : réessayez.", "سیتور پاسخ نمی‌دهد."));
    } finally { setBusy(false); }
  };

  const approve = async (d) => {
    setApproving(d.id);
    try {
      await deusApi.shiftDraftPatch(d.id, { status: "approved" });
      toast.success(tri("Report approvato e archiviato.", "Report freigegeben & archiviert.", "Report approved & archived.", "Informe aprobado y archivado.", "Rapport approuvé et archivé.", "گزارش تأیید و بایگانی شد."));
      load();
    } catch { toast.error(tri("Errore: riprova.", "Fehler: erneut versuchen.", "Error: retry.", "Error: reintenta.", "Erreur : réessayez.", "خطا: دوباره.")); }
    finally { setApproving(""); }
  };

  const fmtMin = (min) => `${Math.floor((min || 0) / 60)}h ${String((min || 0) % 60).padStart(2, "0")}m`;

  return (
    <div data-testid="sitor-shift-draft" className="space-y-2.5">
      <div className="flex items-center gap-2">
        <ClipboardCheck className="w-4 h-4 text-[#a6b1bc] shrink-0" />
        <p className="text-xs font-black uppercase tracking-wide text-[#a6b1bc] flex-1 min-w-0">
          {tri("Report Fine Turno · Bozza di Sitor", "Schichtbericht · Sitor-Entwurf", "End-of-Shift Report · Sitor's Draft", "Informe Fin de Turno · Borrador de Sitor", "Rapport de Fin de Service · Brouillon de Sitor", "گزارش پایان شیفت · پیش‌نویس سیتور")}
        </p>
        <button data-testid="sitor-draft-generate" onClick={generate} disabled={busy}
          className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#a6b1bc]/10 border border-[#a6b1bc]/35 text-[#a6b1bc] text-xs font-bold hover:bg-[#a6b1bc]/20 active:scale-95 disabled:opacity-50">
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
          {current ? tri("Rigenera", "Neu", "Regenerate", "Regenerar", "Régénérer", "بازسازی") : tri("Genera bozza", "Entwurf", "Generate draft", "Generar", "Générer", "بساز")}
        </button>
      </div>
      <p className="text-[11px] text-[#94A3B8]">
        {tri("Sitor raccoglie da solo scarti, pezzi e ore effettive e compila la bozza appena un operaio chiude il suo rapporto.",
             "Sitor sammelt Ausschuss, Stückzahlen & Arbeitszeiten und erstellt den Entwurf automatisch.",
             "Sitor collects waste, pieces and actual hours on its own and drafts the report as soon as an operator submits theirs.",
             "Sitor recoge mermas, piezas y horas reales y redacta el borrador solo.",
             "Sitor collecte rebuts, pièces et heures réelles et rédige le brouillon tout seul.",
             "سیتور ضایعات و ساعات را جمع می‌کند و پیش‌نویس را خودش می‌نویسد.")}
      </p>

      {/* Report programmato: Sitor genera la bozza da solo a un orario fisso di chiusura */}
      <div data-testid="sitor-schedule" className="rounded-xl bg-[#0C1019] border border-[#1e293b] p-2.5 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <AlarmClock className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
          <label className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer">
            <input data-testid="sitor-schedule-toggle" type="checkbox" checked={sched.enabled}
              onChange={(e) => saveSched({ ...sched, enabled: e.target.checked })}
              className="w-4 h-4 accent-[#a6b1bc] shrink-0" />
            <span className="text-[11px] text-[#CBD5E1] font-semibold">
              {tri("Report automatico all'orario di chiusura", "Automatischer Bericht zur Schließzeit", "Auto report at closing time", "Informe automático al cerrar", "Rapport auto à la fermeture", "گزارش خودکار در زمان بستن")}
            </span>
          </label>
          <div className="flex items-center gap-1.5 shrink-0">
            <Clock className="w-3.5 h-3.5 text-[#64748B]" />
            <input data-testid="sitor-schedule-time" type="time" value={sched.time}
              onChange={(e) => saveSched({ ...sched, time: e.target.value })}
              disabled={!sched.enabled}
              className="bg-[#060A10] border border-[#1e293b] rounded-lg px-2 py-1 text-xs text-white focus:border-[#a6b1bc] outline-none disabled:opacity-40" />
          </div>
        </div>
        <p className="text-[10px] text-[#64748B]">
          {schedSaved
            ? tri("Salvato ✓ — Sitor scriverà la bozza da solo a quest'ora (ora locale della sede).", "Gespeichert ✓ — Sitor schreibt den Entwurf selbst (Ortszeit).", "Saved ✓ — Sitor will draft it on its own at this time (local time).", "Guardado ✓ (hora local).", "Enregistré ✓ (heure locale).", "ذخیره شد ✓ (زمان محلی)")
            : tri("Anche senza rapporto operaio, a quest'ora Sitor compila la bozza con i dati raccolti. Ora locale della sede.", "Auch ohne Bericht erstellt Sitor zur eingestellten Ortszeit den Entwurf.", "Even with no operator report, at this time Sitor compiles the draft from collected data. Local time.", "Aunque no haya informe, Sitor redacta a esa hora (local).", "Même sans rapport, Sitor rédige à cette heure (locale).", "حتی بدون گزارش، سیتور در این ساعت (محلی) پیش‌نویس را می‌سازد.")}
        </p>
      </div>

      {!current ? (
        <div data-testid="sitor-draft-empty" className="rounded-xl bg-[#0C1019] border border-[#1e293b] px-3 py-4 text-center text-[12px] text-[#64748B]">
          {tri("Nessuna bozza ancora: appena arrivano dati dal turno, Sitor la scrive da solo.", "Noch kein Entwurf: sobald Schichtdaten eintreffen, schreibt Sitor ihn selbst.", "No draft yet: as soon as shift data arrives, Sitor writes it on its own.", "Sin borrador: Sitor lo escribe solo al llegar datos.", "Aucun brouillon : Sitor l'écrit dès l'arrivée des données.", "هنوز پیش‌نویسی نیست.")}
        </div>
      ) : (
        <div className="rounded-xl bg-[#0C1019] border border-[#a6b1bc]/25 p-3 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span data-testid="sitor-draft-status" className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded border ${current.status === "approved" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-[#a6b1bc]/10 text-[#a6b1bc] border-[#a6b1bc]/30"}`}>
              {current.status === "approved" ? tri("Approvato", "Freigegeben", "Approved", "Aprobado", "Approuvé", "تأییدشده") : tri("Bozza", "Entwurf", "Draft", "Borrador", "Brouillon", "پیش‌نویس")}
            </span>
            <span className="text-[10px] text-[#64748B] font-mono-data">{current.date} · {current.trigger === "auto" ? tri("auto", "auto", "auto", "auto", "auto", "خودکار") : tri("manuale", "manuell", "manual", "manual", "manuel", "دستی")}</span>
            {current.snapshot && (
              <span data-testid="sitor-draft-meta" className="text-[10px] text-[#64748B]">
                · {current.snapshot.reports || 0} {tri("rapporti", "Berichte", "reports", "informes", "rapports", "گزارش")} · {current.snapshot.workers || 0} {tri("timbrati", "gestempelt", "clocked", "fichados", "pointés", "ثبت‌شده")}
              </span>
            )}
          </div>
          <div data-testid="sitor-draft-text" className="text-[13px] leading-relaxed text-[#E8EEF5] max-h-72 overflow-y-auto pr-1 [&_strong]:text-[#a6b1bc] [&_h1]:text-base [&_h1]:font-black [&_h1]:mb-2 [&_h2]:text-sm [&_h2]:font-black [&_h2]:mt-3 [&_h2]:mb-1 [&_h3]:text-sm [&_h3]:font-bold [&_h3]:mt-2 [&_h3]:mb-1 [&_p]:mb-2 [&_li]:mb-0.5 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_hr]:border-[#1e293b] [&_hr]:my-2">
            <ReactMarkdown>{current.text}</ReactMarkdown>
          </div>
          {current.status !== "approved" && (
            <button data-testid="sitor-draft-approve" onClick={() => approve(current)} disabled={approving === current.id}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-sm font-black active:scale-95 disabled:opacity-50">
              {approving === current.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {tri("Approva e archivia", "Freigeben & archivieren", "Approve & archive", "Aprobar y archivar", "Approuver & archiver", "تأیید و بایگانی")}
            </button>
          )}
        </div>
      )}

      {past.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {past.map((d) => (
            <span key={d.id} data-testid={`sitor-draft-past-${d.date}`} className={`text-[10px] font-mono-data px-2 py-1 rounded-lg border ${d.status === "approved" ? "bg-emerald-500/5 text-emerald-400/80 border-emerald-500/20" : "bg-[#0C1019] text-[#64748B] border-[#1e293b]"}`}>
              {d.date} {d.status === "approved" ? "✓" : ""}
            </span>
          ))}
          <button data-testid="sitor-draft-refresh" onClick={load} className="text-[#64748B] hover:text-[#a6b1bc] active:scale-95"><RefreshCw className="w-3.5 h-3.5" /></button>
        </div>
      )}
    </div>
  );
}
