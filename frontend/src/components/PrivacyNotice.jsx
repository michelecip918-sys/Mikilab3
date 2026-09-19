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
    <div data-testid="privacy-notice" className="fixed inset-0 z-[90] flex items-center justify-center bg-background/70 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
      <button data-testid="privacy-backdrop" aria-label="close" onClick={onClose} className="absolute inset-0 cursor-default" />
      <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-primary/40 bg-background p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <p className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-primary"><ShieldCheck className="w-4 h-4" /> {title}</p>
          <button data-testid="privacy-close" onClick={onClose} className="w-8 h-8 inline-flex items-center justify-center rounded-lg border border-border/60 text-muted-foreground hover:text-foreground active:scale-95"><X className="w-4 h-4" /></button>
        </div>
        {!data && !err && <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin inline text-primary" /></div>}
        {err && <p className="text-[13px] text-mattone py-4">{tri("Impossibile caricare l'informativa. Riprova più tardi.", "Datenschutzhinweis konnte nicht geladen werden.", "Could not load the notice. Try again later.", "No se pudo cargar el aviso.", "Impossible de charger l'avis.", "بارگذاری نشد.")}</p>}
        {data && (
          <div className="space-y-4 text-[13px] leading-relaxed">
            <p className="text-foreground font-semibold">{data.posture}</p>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">{tri("Dati trattati", "Erhobene Daten", "Data collected", "Datos", "Données", "داده‌ها")}</p>
              <ul className="space-y-1">
                {(data.data_collected || []).map((x, i) => (
                  <li key={i} data-testid={`privacy-data-${i}`} className="flex gap-2 text-muted-foreground"><span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />{x}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">{tri("Conservazione", "Aufbewahrung", "Retention", "Conservación", "Conservation", "نگهداری")}</p>
              <p className="text-muted-foreground">{data.retention}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">{tri("Principi", "Grundsätze", "Principles", "Principios", "Principes", "اصول")}</p>
              <ul className="space-y-1">
                {(data.principles || []).map((x, i) => (
                  <li key={i} className="flex gap-2 text-muted-foreground"><span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-muted shrink-0" />{x}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Nota "non in vendita" — discreta, vicino al link Privacy.
export const NotForSaleNote = ({ className = "" }) => {
  const { lang } = useLang();
  const tri = mkTri(lang);
  return (
    <p data-testid="not-for-sale-note"
      className={className || "text-[10px] text-muted-foreground italic leading-relaxed text-center max-w-md mx-auto"}>
      {tri(
        "MikiLab non è in vendita e non è un servizio commerciale. È un progetto personale nato per passione — chissà, un giorno potrebbe tornarmi utile per davvero.",
        "MikiLab steht nicht zum Verkauf und ist kein kommerzieller Dienst. Es ist ein persönliches Projekt aus Leidenschaft — vielleicht wird es mir eines Tages wirklich nützlich sein.",
        "MikiLab is not for sale and is not a commercial service. It is a personal project born out of passion — who knows, one day it might truly come in handy.",
        "MikiLab no está a la venta y no es un servicio comercial. Es un proyecto personal nacido por pasión; quizá algún día me sea realmente útil.",
        "MikiLab n'est pas à vendre et n'est pas un service commercial. C'est un projet personnel né par passion — qui sait, un jour il pourrait vraiment me servir.",
        "میکی‌لب برای فروش نیست و خدمت تجاری نیست؛ پروژه‌ای شخصی از سر علاقه است — شاید روزی واقعاً به کارم آید."
      )}
    </p>
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
        className={className || "text-[11px] text-muted-foreground hover:text-primary underline underline-offset-2 transition-colors"}>
        {tri("Privacy / Datenschutz", "Datenschutz", "Privacy / Data Protection", "Privacidad", "Confidentialité", "حریم خصوصی")}
      </button>
      {open && <PrivacyNotice onClose={() => setOpen(false)} />}
    </>
  );
};
