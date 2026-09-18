import { useEffect, useState } from "react";
import { ShieldCheck, X, Loader2 } from "lucide-react";
import { complianceApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// Informativa privacy PUBBLICA (GDPR/DSGVO): raggiungibile senza login, in IT/DE/EN.
export const PrivacyNotice = ({ onClose }) => {
  const { lang } = useLang();
  const tri = mkTri(lang);
  const [data, setData] = useState(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    complianceApi.privacy(lang).then(setData).catch(() => setErr(true));
  }, [lang]);

  const title = tri("Privacy & Protezione Dati", "Datenschutz", "Privacy & Data Protection", "Privacidad", "Confidentialité", "حریم خصوصی");
  return (
    <div data-testid="privacy-notice" className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
      <button data-testid="privacy-backdrop" aria-label="close" onClick={onClose} className="absolute inset-0 cursor-default" />
      <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-[#3E9C93]/40 bg-[#0b0f19] p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <p className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-[#3E9C93]"><ShieldCheck className="w-4 h-4" /> {title}</p>
          <button data-testid="privacy-close" onClick={onClose} className="w-8 h-8 inline-flex items-center justify-center rounded-lg border border-[#334155]/60 text-[#9aa6b2] hover:text-white active:scale-95"><X className="w-4 h-4" /></button>
        </div>
        {!data && !err && <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin inline text-[#3E9C93]" /></div>}
        {err && <p className="text-[13px] text-[#b06e78] py-4">{tri("Impossibile caricare l'informativa. Riprova più tardi.", "Datenschutzhinweis konnte nicht geladen werden.", "Could not load the notice. Try again later.", "No se pudo cargar el aviso.", "Impossible de charger l'avis.", "بارگذاری نشد.")}</p>}
        {data && (
          <div className="space-y-4 text-[13px] leading-relaxed">
            <p className="text-[#cbd5e1] font-semibold">{data.posture}</p>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-[#64748B] mb-1">{tri("Dati trattati", "Erhobene Daten", "Data collected", "Datos", "Données", "داده‌ها")}</p>
              <ul className="space-y-1">
                {(data.data_collected || []).map((x, i) => (
                  <li key={i} data-testid={`privacy-data-${i}`} className="flex gap-2 text-[#94A3B8]"><span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#3E9C93] shrink-0" />{x}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-[#64748B] mb-1">{tri("Conservazione", "Aufbewahrung", "Retention", "Conservación", "Conservation", "نگهداری")}</p>
              <p className="text-[#94A3B8]">{data.retention}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-[#64748B] mb-1">{tri("Principi", "Grundsätze", "Principles", "Principios", "Principes", "اصول")}</p>
              <ul className="space-y-1">
                {(data.principles || []).map((x, i) => (
                  <li key={i} className="flex gap-2 text-[#94A3B8]"><span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#8a97a6] shrink-0" />{x}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Link testuale riutilizzabile che apre l'informativa.
export const PrivacyLink = ({ className = "" }) => {
  const { lang } = useLang();
  const tri = mkTri(lang);
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" data-testid="privacy-link" onClick={() => setOpen(true)}
        className={className || "text-[11px] text-[#64748B] hover:text-[#3E9C93] underline underline-offset-2 transition-colors"}>
        {tri("Privacy / Datenschutz", "Datenschutz", "Privacy / Data Protection", "Privacidad", "Confidentialité", "حریم خصوصی")}
      </button>
      {open && <PrivacyNotice onClose={() => setOpen(false)} />}
    </>
  );
};
