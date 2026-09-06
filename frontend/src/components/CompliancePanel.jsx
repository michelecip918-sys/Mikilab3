import { useEffect, useState, useCallback } from "react";
import { Scale as ScaleIcon, ShieldAlert, Lock, Clock, Check, Loader2, FileWarning } from "lucide-react";
import { toast } from "sonner";
import { complianceApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import BakoInfo from "@/components/BakoInfo";
import CrossCheckCard from "@/components/CrossCheckCard";

// Compliance legale tedesca (ArbZG · DGUV · GDPR/DSGVO) — accesso esclusivo Master.
// Vertical single-screen, nessuna pagina pubblica.
export default function CompliancePanel() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [tl, setTl] = useState(null);
  const [safety, setSafety] = useState(null);
  const [privacy, setPrivacy] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, b, c] = await Promise.all([
        complianceApi.timelog(undefined, new Date().toISOString().slice(0, 10)).catch(() => null),
        complianceApi.safety().catch(() => null),
        complianceApi.privacy(lang).catch(() => null),
      ]);
      setTl(a); setSafety(b); setPrivacy(c);
    } finally { setLoading(false); }
  }, [lang]);
  useEffect(() => { load(); }, [load]);

  const ack = async (doc_id) => {
    try { await complianceApi.ack("Master", doc_id); toast.success(tri("Unterweisung registrata", "Unterweisung erfasst", "Training recorded", "Formación registrada", "Formation enregistrée", "آموزش ثبت شد")); load(); }
    catch { toast.error("Errore"); }
  };

  const summaries = (tl && tl.summaries) || {};
  const workers = Object.keys(summaries);

  return (
    <div data-testid="compliance-panel" className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ScaleIcon className="w-5 h-5 text-[#f59e0b]" />
          <div>
            <h3 className="text-sm font-extrabold text-[#f59e0b]">{tri("Compliance UE/DE · ArbZG · DGUV · GDPR", "Compliance EU/DE · ArbZG · DGUV · DSGVO", "EU/DE Compliance · ArbZG · DGUV · GDPR", "Compliance UE/DE · ArbZG · DGUV · RGPD", "Conformité UE/DE · ArbZG · DGUV · RGPD", "انطباق اتحادیه اروپا/آلمان")}</h3>
            <p className="text-[11px] text-[#94A3B8] flex items-center gap-1"><Lock className="w-3 h-3" /> {tri("Accesso esclusivo Master · dati locali cifrati", "Nur Master · lokale verschlüsselte Daten", "Master-only · local encrypted data", "Solo Master · datos locales cifrados", "Master seul · données locales chiffrées", "فقط مستر · داده محلی رمزنگاری‌شده")}</p>
          </div>
        </div>
        <BakoInfo context="Compliance" />
      </div>

      {loading ? (
        <div className="py-8 text-center text-[#94A3B8] text-sm flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> …</div>
      ) : (
        <>
          {/* ArbZG · Orari di lavoro */}
          <div data-testid="compliance-arbzg" className="rounded-2xl border border-[#3E9C93]/40 bg-[#3E9C93]/5 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-black text-[#3E9C93] flex items-center gap-1.5"><Clock className="w-4 h-4" /> {tri("Orari di oggi (ArbZG · UE 2003/88)", "Heutige Zeiten (ArbZG · EU 2003/88)", "Today's hours (ArbZG · EU 2003/88)", "Horas de hoy (ArbZG · UE 2003/88)", "Heures du jour (ArbZG · UE 2003/88)", "ساعات امروز (ArbZG · اتحادیه اروپا)")}</p>
              <span data-testid="compliance-integrity" className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tl && tl.integrity_ok ? "bg-[#14b8a6]/15 text-[#14b8a6]" : "bg-rose-500/15 text-rose-400"}`}>
                {tl && tl.integrity_ok ? tri("Catena integra", "Kette intakt", "Chain intact", "Cadena íntegra", "Chaîne intacte", "زنجیره سالم") : tri("Manomissione!", "Manipulation!", "Tampered!", "¡Manipulado!", "Altéré !", "دستکاری!")}
              </span>
            </div>
            {workers.length === 0 ? (
              <p className="text-[11px] text-[#64748B]">{tri("Nessuna timbratura oggi.", "Heute keine Stempelung.", "No clock-ins today.", "Sin fichajes hoy.", "Aucun pointage aujourd'hui.", "امروز ثبتی نیست.")}</p>
            ) : (
              <div className="space-y-1.5">
                {workers.map((w) => {
                  const s = summaries[w];
                  return (
                    <div key={w} data-testid={`compliance-worker-${w.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()}`} className="flex items-center gap-2 text-xs">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${s.compliant ? "bg-[#14b8a6]" : "bg-rose-500"}`} />
                      <span className="font-bold text-white flex-1 min-w-0 truncate">{w}</span>
                      <span className="font-mono-data text-[#94A3B8]">{Math.floor(s.work_min / 60)}h {s.work_min % 60}m · {tri("pausa", "Pause", "break", "pausa", "pause", "استراحت")} {s.break_min}m</span>
                      {!s.compliant && <FileWarning className="w-3.5 h-3.5 text-rose-400 shrink-0" title={s.flags.join(", ")} />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* DGUV · Sicurezza */}
          <div data-testid="compliance-dguv" className="rounded-2xl border border-[#5E8CA8]/40 bg-[#5E8CA80d] p-4 space-y-2">
            <p className="text-xs font-black text-[#7DA3C0] flex items-center gap-1.5"><ShieldAlert className="w-4 h-4" /> {tri("Gefährdungsbeurteilung & Unterweisung (DGUV)", "Gefährdungsbeurteilung & Unterweisung (DGUV)", "Hazard assessment & training (DGUV)", "Evaluación de riesgos y formación (DGUV)", "Évaluation des risques & formation (DGUV)", "ارزیابی خطر و آموزش (DGUV)")}</p>
            {(safety ? safety.hazards : []).map((h) => (
              <div key={h.id} className="flex items-center gap-2 text-[11px]">
                <span className={`px-1.5 py-0.5 rounded font-bold ${h.level === "alto" ? "bg-rose-500/15 text-rose-400" : "bg-amber-500/15 text-amber-400"}`}>{h.machine}</span>
                <span className="text-[#cbd5e1] flex-1 min-w-0 truncate">{h.title}</span>
              </div>
            ))}
            <div className="pt-1 space-y-1.5">
              {(safety ? safety.trainings : []).map((t) => (
                <div key={t.id} className="flex items-center gap-2 text-[11px]">
                  <span className="text-[#cbd5e1] flex-1 min-w-0 truncate">{t.title} <span className="text-[#64748B]">· {t.interval}</span></span>
                  <button data-testid={`compliance-ack-${t.id}`} onClick={() => ack(t.id)} className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#5E8CA8]/15 border border-[#5E8CA8]/40 text-[#7DA3C0] font-bold active:scale-95 transition-all">
                    <Check className="w-3 h-3" /> {tri("Conferma", "Bestätigen", "Ack", "Confirmar", "Valider", "تأیید")}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* GDPR/DSGVO · Privacy */}
          {privacy && (
            <div data-testid="compliance-gdpr" className="rounded-2xl border border-[#14b8a6]/30 bg-[#14b8a6]/5 p-4">
              <p className="text-xs font-black text-[#14b8a6] flex items-center gap-1.5 mb-1"><Lock className="w-4 h-4" /> {privacy.posture}</p>
              <ul className="text-[11px] text-[#94A3B8] space-y-0.5 list-disc list-inside">
                {(privacy.principles || []).map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            </div>
          )}

          <CrossCheckCard />
        </>
      )}
    </div>
  );
}
