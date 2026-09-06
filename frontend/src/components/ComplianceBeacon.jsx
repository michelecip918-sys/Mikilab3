import { useEffect, useState } from "react";
import { complianceApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// FASE 4 — Indicatori di conformità FLUORESCENTI propagati nelle sezioni.
// Non un pannello: tre "beacon" olografici (ArbZG · DGUV · GDPR) che pulsano
// verde (integro) o rosso (allarme). Zero-menu: solo stato ambientale.
function Beacon({ label, ok, hint }) {
  const color = ok ? "#14b8a6" : "#f43f5e";
  return (
    <span title={hint} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider"
      style={{ background: "rgba(6,12,22,0.65)", border: `1px solid ${color}66`, color, textShadow: `0 0 8px ${color}99` }}>
      <span className="relative flex w-2 h-2">
        <span className="absolute inline-flex w-full h-full rounded-full opacity-70" style={{ background: color, animation: "ping 1.8s cubic-bezier(0,0,0.2,1) infinite" }} />
        <span className="relative inline-flex w-2 h-2 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
      </span>
      {label}
    </span>
  );
}

export default function ComplianceBeacon({ onOpen, compact = false }) {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [arbzg, setArbzg] = useState(true);
  const [dguv, setDguv] = useState(true);

  useEffect(() => {
    let alive = true;
    const day = new Date().toISOString().slice(0, 10);
    complianceApi.timelog(undefined, day).then((tl) => {
      if (!alive || !tl) return;
      const s = (tl && tl.summaries) || {};
      const allOk = Object.values(s).every((w) => w.compliant);
      setArbzg(Boolean(tl.integrity_ok) && allOk);
    }).catch(() => { /* offline → resta verde */ });
    complianceApi.safety().then((sf) => {
      if (!alive || !sf) return;
      // rosso se esistono pericoli di livello "alto" non ancora coperti da unterweisung
      const highs = (sf.hazards || []).filter((h) => h.level === "alto").length;
      setDguv(highs === 0 || (sf.trainings || []).length > 0);
    }).catch(() => { /* */ });
    return () => { alive = false; };
  }, []);

  return (
    <button data-testid="compliance-beacon" onClick={onOpen} type="button"
      className={`w-full flex items-center ${compact ? "justify-center" : "justify-between"} gap-2 rounded-xl px-3 py-2 active:scale-[0.99] transition-all`}
      style={{ background: "linear-gradient(155deg, rgba(11,20,32,0.7), rgba(6,12,22,0.7))", border: "1px solid rgba(34,211,238,0.28)", boxShadow: "0 0 16px rgba(34,211,238,0.1)" }}>
      {!compact && (
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#22d3ee]/80" style={{ textShadow: "0 0 8px rgba(34,211,238,0.5)" }}>
          {tri("Conformità UE/DE", "Compliance EU/DE", "EU/DE Compliance", "Conformidad UE/DE", "Conformité UE/DE", "انطباق")}
        </span>
      )}
      <span className="flex items-center gap-1.5 flex-wrap">
        <Beacon label="ArbZG" ok={arbzg} hint={tri("Orari di lavoro (ArbZG · UE)", "Arbeitszeiten (ArbZG · EU)", "Working hours (ArbZG · EU)", "Horas (ArbZG · UE)", "Heures (ArbZG · UE)", "ساعات کاری")} />
        <Beacon label="DGUV" ok={dguv} hint={tri("Sicurezza · unterweisung (DGUV)", "Sicherheit · Unterweisung (DGUV)", "Safety · training (DGUV)", "Seguridad (DGUV)", "Sécurité (DGUV)", "ایمنی (DGUV)")} />
        <Beacon label="GDPR" ok={true} hint={tri("Privacy dati locali (GDPR/DSGVO)", "Datenschutz lokal (DSGVO)", "Local data privacy (GDPR)", "Privacidad (RGPD)", "Vie privée (RGPD)", "حریم خصوصی")} />
      </span>
    </button>
  );
}
