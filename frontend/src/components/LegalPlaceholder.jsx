import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { ChevronLeft } from "lucide-react";

// Pagine legali con TESTO SEGNAPOSTO ("da compilare"). Nessun dato reale.
export default function LegalPlaceholder({ kind = "impressum", onBack }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const isImp = kind === "impressum";
  const title = isImp ? tri("Impressum", "Impressum", "Impressum") : tri("Informativa privacy", "Datenschutz", "Privacy / Datenschutz");
  return (
    <div data-testid={`legal-${kind}`} className="max-w-2xl mx-auto pt-6">
      <button data-testid="legal-back" onClick={onBack} className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground mb-4">
        <ChevronLeft className="w-4 h-4" /> {tri("Indietro", "Zurück", "Back")}
      </button>
      <h1 className="font-display text-2xl font-black text-foreground uppercase tracking-wide mb-4">{title}</h1>
      <div className="rounded-2xl border border-border bg-background/70 p-5 space-y-3 text-sm text-foreground">
        <p className="inline-block text-[11px] font-bold uppercase tracking-wider text-primary bg-primary/10 border border-primary/30 rounded-full px-3 py-1">
          {tri("Da compilare", "Auszufüllen", "To be completed")}
        </p>
        {isImp ? (
          <div className="space-y-2">
            <p>[NOME]</p>
            <p>[INDIRIZZO]</p>
            <p>{tri("Contatto:", "Kontakt:", "Contact:")} [EMAIL]</p>
            <p className="text-muted-foreground">{tri(
              "Contenuti di questa pagina da definire prima della pubblicazione.",
              "Inhalte dieser Seite vor der Veröffentlichung festzulegen.",
              "Contents of this page to be defined before publication.")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-muted-foreground">{tri(
              "Questo sito usa solo memoria locale funzionale (preferenze e preferiti nel tuo dispositivo). Nessuna statistica, nessun tracciamento.",
              "Diese Seite nutzt nur funktionalen lokalen Speicher (Einstellungen und Favoriten auf deinem Gerät). Keine Statistik, kein Tracking.",
              "This site only uses functional local storage (preferences and favourites on your device). No analytics, no tracking.")}</p>
            <p>{tri("Titolare:", "Verantwortlicher:", "Controller:")} [NOME] — [INDIRIZZO]</p>
            <p className="text-muted-foreground">{tri(
              "L'avatar di Sitor è una rappresentazione sintetica del titolare del sito.",
              "Der Avatar von Sitor ist eine synthetische Darstellung des Website-Inhabers.",
              "Sitor's avatar is a synthetic representation of the site owner.")}</p>
            <p className="text-muted-foreground">{tri("Testo completo da compilare.", "Vollständiger Text auszufüllen.", "Full text to be completed.")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
