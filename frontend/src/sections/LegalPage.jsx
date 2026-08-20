import { ShieldCheck } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";

const T = {
  it: {
    title: "Note legali & Privacy",
    intro: "Mikilab è uno strumento personale di organizzazione del lavoro in panificazione. Il sito ha scopo puramente organizzativo e didattico, senza finalità di lucro: raccoglie ricette, appunti e strumenti di lavoro per uso personale e formativo.",
    sections: [
      { h: "Scopo del sito", b: "Questo sito è un'applicazione di supporto al lavoro artigianale (organizzazione della produzione, ricette, promemoria). Non è un negozio online e non vende prodotti né servizi." },
      { h: "Dati personali (Datenschutz)", b: "Vengono trattati solo i dati minimi necessari all'accesso: email e nome forniti al momento della registrazione, usati esclusivamente per identificare l'utente e salvare le sue ricette personali. Non vendiamo né cediamo i dati a terzi. Al login viene usato un cookie tecnico di sessione (necessario per restare connessi)." },
      { h: "Contenuti e ricette", b: "Le ricette e i contenuti riflettono l'esperienza personale dell'autore e sono forniti a scopo informativo. L'utente è responsabile dell'uso in ambito professionale (norme igieniche, HACCP, sicurezza)." },
      { h: "Cancellazione dati", b: "Puoi richiedere in qualsiasi momento la cancellazione del tuo account e delle tue ricette personali contattando il gestore del sito." },
      { h: "Contatto", b: "Per qualsiasi richiesta relativa a privacy e dati: noreply@mikilab.de" },
    ],
    note: "Tutto è gestito nella norma e nel rispetto della riservatezza.",
  },
  de: {
    title: "Impressum & Datenschutz",
    intro: "Mikilab ist ein persönliches Werkzeug zur Arbeitsorganisation in der Backstube. Die Seite dient ausschließlich organisatorischen und didaktischen Zwecken, ohne Gewinnabsicht: sie sammelt Rezepte, Notizen und Arbeitshilfen für den persönlichen und lernenden Gebrauch.",
    sections: [
      { h: "Zweck der Seite", b: "Diese Seite ist eine Anwendung zur Unterstützung der handwerklichen Arbeit (Produktionsplanung, Rezepte, Erinnerungen). Es ist kein Online-Shop und verkauft weder Produkte noch Dienstleistungen." },
      { h: "Datenschutz", b: "Es werden nur die für den Zugang nötigen Mindestdaten verarbeitet: bei der Registrierung angegebene E-Mail und Name, ausschließlich zur Identifizierung und zum Speichern der persönlichen Rezepte. Wir verkaufen oder geben keine Daten an Dritte weiter. Beim Login wird ein technisches Session-Cookie verwendet (erforderlich, um angemeldet zu bleiben)." },
      { h: "Inhalte und Rezepte", b: "Rezepte und Inhalte spiegeln die persönliche Erfahrung des Autors wider und dienen der Information. Für die professionelle Nutzung (Hygiene, HACCP, Sicherheit) ist der Nutzer verantwortlich." },
      { h: "Löschung der Daten", b: "Du kannst jederzeit die Löschung deines Kontos und deiner persönlichen Rezepte beim Betreiber anfordern." },
      { h: "Kontakt", b: "Für Anfragen zu Datenschutz und Daten: noreply@mikilab.de" },
    ],
    note: "Alles wird ordnungsgemäß und unter Wahrung der Vertraulichkeit verwaltet.",
  },
};

export default function LegalPage() {
  const { lang } = useLang();
  const c = T[lang === "de" ? "de" : "it"];
  return (
    <div data-testid="legal-page" className="pb-4 space-y-4">
      <div className="rounded-3xl p-6 bg-gradient-to-br from-[#6B8E62] to-[#4d6b45] text-white">
        <ShieldCheck className="w-7 h-7 mb-2" />
        <h1 className="font-display text-2xl font-bold">{c.title}</h1>
        <p className="text-white/90 text-sm mt-2 leading-relaxed">{c.intro}</p>
      </div>
      {c.sections.map((s, i) => (
        <div key={i} className="rounded-2xl bg-white dark:bg-[#2A211D] border border-[#E8DEC8] dark:border-[#3D302A] p-5">
          <h2 className="font-display text-base font-semibold text-[#2C221E] dark:text-[#F5EFE6]">{s.h}</h2>
          <p className="text-sm text-[#4A3B34] dark:text-[#C9BBB0] mt-1 leading-relaxed">{s.b}</p>
        </div>
      ))}
      <p className="text-center text-xs text-[#8C7567] italic">{c.note}</p>
    </div>
  );
}
