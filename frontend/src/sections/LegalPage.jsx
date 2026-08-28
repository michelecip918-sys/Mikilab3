import { ShieldCheck, Building2, Mail, Send, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { API } from "@/lib/api";
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
  en: {
    title: "Legal notice & Privacy",
    intro: "Mikilab is a personal tool for organising bakery work. The site is purely organisational and educational, with no commercial purpose: it collects recipes, notes and work tools for personal and training use.",
    sections: [
      { h: "Purpose of the site", b: "This site is an application that supports artisan work (production planning, recipes, reminders). It is not an online shop and does not sell products or services." },
      { h: "Personal data (privacy)", b: "Only the minimum data needed to log in is processed: the email and name provided at registration, used solely to identify the user and save their personal recipes. We do not sell or share data with third parties. A technical session cookie is used at login (required to stay signed in)." },
      { h: "Content and recipes", b: "Recipes and content reflect the author's personal experience and are provided for information. The user is responsible for professional use (hygiene, HACCP, safety)." },
      { h: "Data deletion", b: "You can request deletion of your account and your personal recipes at any time by contacting the site operator." },
      { h: "Contact", b: "For any request regarding privacy and data: noreply@mikilab.de" },
    ],
    note: "Everything is handled properly and with respect for confidentiality.",
  },
};

export default function LegalPage() {
  const { lang } = useLang();
  const c = T[lang] || T.it;
  const tr = (i, d, e, s) => (lang === "de" ? d : lang === "es" ? (s ?? e ?? i) : lang === "en" ? (e ?? i) : i);
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);

  const submit = async () => {
    if (form.message.trim().length < 3) { toast.error(tr("Scrivi un messaggio", "Bitte Nachricht schreiben", "Write a message")); return; }
    setSending(true);
    try {
      const res = await fetch(`${API}/contact`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error();
      toast.success(tr("Messaggio inviato! Ti rispondo presto.", "Nachricht gesendet!", "Message sent!", "¡Mensaje enviado!"));
      setForm({ name: "", email: "", message: "" });
    } catch { toast.error(tr("Errore, riprova", "Fehler, erneut versuchen", "Error, try again")); }
    finally { setSending(false); }
  };

  return (
    <div data-testid="legal-page" className="pb-4 space-y-4">
      <div className="rounded-3xl p-6 bg-gradient-to-br from-[#5aa0cf] to-[#2e6690] text-white">
        <ShieldCheck className="w-7 h-7 mb-2" />
        <h1 className="font-display text-2xl font-bold">{c.title}</h1>
        <p className="text-white/90 text-sm mt-2 leading-relaxed">{c.intro}</p>
      </div>
      {c.sections.map((s, i) => (
        <div key={i} className="rounded-2xl bg-white dark:bg-[#232A31] border border-[#d5e4f0] dark:border-[#38424B] p-5">
          <h2 className="font-display text-base font-semibold text-[#2B303B] dark:text-[#e4eff8]">{s.h}</h2>
          <p className="text-sm text-[#3F4A54] dark:text-[#AEB8BF] mt-1 leading-relaxed">{s.b}</p>
        </div>
      ))}

      {/* Impressum (Germania) — segnaposto da compilare */}
      <div data-testid="impressum" className="rounded-2xl bg-white dark:bg-[#232A31] border border-[#d5e4f0] dark:border-[#38424B] p-5">
        <div className="flex items-center gap-2 mb-2"><Building2 className="w-5 h-5 text-[#3f7cac]" /><h2 className="font-display text-base font-semibold text-[#2B303B] dark:text-[#e4eff8]">Impressum</h2></div>
        <p className="text-sm text-[#3F4A54] dark:text-[#AEB8BF] leading-relaxed">
          {tr("Ai sensi del § 5 TMG (Germania):", "Angaben gemäß § 5 TMG:", "Information pursuant to § 5 TMG (Germany):")}
        </p>
        <div className="text-sm text-[#3F4A54] dark:text-[#AEB8BF] mt-2 leading-relaxed">
          <p>[Nome] [Cognome]</p>
          <p>[Indirizzo], Stoccarda (Stuttgart), Deutschland</p>
          <p>E-Mail: [email]</p>
        </div>
        <p className="text-[11px] text-[#7E8A93] mt-2 italic">{tr("(Dati segnaposto: verranno compilati dal titolare.)", "(Platzhalter: werden vom Betreiber ausgefüllt.)", "(Placeholder data: to be filled by the owner.)")}</p>
      </div>

      {/* Modulo contatti */}
      <div data-testid="contact-form" className="rounded-2xl bg-white dark:bg-[#232A31] border border-[#d5e4f0] dark:border-[#38424B] p-5">
        <div className="flex items-center gap-2 mb-3"><Mail className="w-5 h-5 text-[#a9772f]" /><h2 className="font-display text-base font-semibold text-[#2B303B] dark:text-[#e4eff8]">{tr("Contattaci", "Kontakt", "Contact us", "Contáctanos")}</h2></div>
        <input data-testid="contact-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={tr("Il tuo nome", "Dein Name", "Your name", "Tu nombre")}
          className="w-full mb-2 bg-[#f0f6fb] dark:bg-[#1F252B] border border-[#d5e4f0] dark:border-[#38424B] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#3f7cac]" />
        <input data-testid="contact-email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" type="email"
          className="w-full mb-2 bg-[#f0f6fb] dark:bg-[#1F252B] border border-[#d5e4f0] dark:border-[#38424B] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#3f7cac]" />
        <textarea data-testid="contact-message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={4} placeholder={tr("Il tuo messaggio…", "Deine Nachricht…", "Your message…", "Tu mensaje…")}
          className="w-full mb-3 bg-[#f0f6fb] dark:bg-[#1F252B] border border-[#d5e4f0] dark:border-[#38424B] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#3f7cac]" />
        <button data-testid="contact-send" onClick={submit} disabled={sending}
          className="w-full inline-flex items-center justify-center gap-2 bg-[#3f7cac] text-white font-semibold px-5 py-3 rounded-2xl active:scale-98 disabled:opacity-60">
          {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          {tr("Invia messaggio", "Nachricht senden", "Send message", "Enviar mensaje")}
        </button>
      </div>

      <p className="text-center text-xs text-[#7E8A93] italic">{c.note}</p>
    </div>
  );
}
