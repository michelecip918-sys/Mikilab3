import { ShieldCheck, Building2, Mail, Send, Loader2, Cookie, ScrollText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { mkTri, pick } from "@/i18n/triMaps";
import { API } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";

const OWNER = "Michele Signorella";
const EMAIL = "michelecip918@gmail.com";
const EMAIL2 = "";
const CITY = "Stuttgart, Deutschland";

const T = {
  it: {
    title: "Note legali & Privacy (GDPR)",
    intro: "Informativa ai sensi del Regolamento (UE) 2016/679 (GDPR) e delle leggi tedesche (DDG/TTDSG). MikiLab Pro tratta solo i dati minimi necessari al funzionamento del servizio.",
    sections: [
      { h: "Titolare del trattamento (Verantwortlicher)", b: `${OWNER} — ${CITY}. Contatto privacy: ${EMAIL}. Per ogni richiesta sui tuoi dati scrivi a questi indirizzi: rispondiamo entro 30 giorni come previsto dal GDPR.` },
      { h: "Dati trattati e finalità", b: "• Registrazione/accesso: nome ed email (base: art. 6(1)(b) GDPR, esecuzione del servizio). • Richiesta di accesso dal portale pubblico: email e motivazione (art. 6(1)(b)). • Cookie tecnico di sessione e gate PIN (art. 6(1)(f), strettamente necessario). • Preferenze locali (lingua, volume, tema) salvate solo nel tuo browser (localStorage), mai inviate al server. • Iscrizione notifiche push (solo se la attivi tu): token del dispositivo per inviarti avvisi critici (art. 6(1)(a), consenso revocabile). • Funzioni vocali: i testi letti ad alta voce passano dal servizio di sintesi vocale; non salviamo registrazioni." },
      { h: "Servizi terzi (responsabili del trattamento)", b: "• Resend (invio email operative e di reset password) — USA, con Clausole Contrattuali Standard UE. • Provider di hosting (server e banca dati nell'UE). Nessun dato viene venduto, ceduto o usato per pubblicità o profilazione." },
      { h: "Cookie", b: "Il sito usa SOLO cookie tecnici strettamente necessari (sessione di accesso e PIN gate, § 25(2) TTDSG) e preferenze in localStorage. Nessun cookie di tracciamento, analitica o marketing: per questo non è richiesto il banner di consenso." },
      { h: "Conservazione e cancellazione", b: "I dati sono conservati finché l'account è attivo o fino a tua richiesta di cancellazione. Puoi chiedere in qualsiasi momento la cancellazione di account e dati scrivendo a " + EMAIL + "." },
      { h: "I tuoi diritti (art. 12–22 GDPR)", b: "Hai diritto di: accesso, rettifica, cancellazione (\"diritto all'oblio\"), limitazione del trattamento, portabilità dei dati, opposizione, revoca del consenso in qualsiasi momento, e reclamo all'autorità di controllo. Per la Germania: LfDI Baden-Württemberg (Landesbeauftragte für den Datenschutz). Nessun processo decisionale automatizzato o profilazione." },
    ],
    note: "Documento aggiornato a settembre 2026.",
  },
  de: {
    title: "Impressum & Datenschutz (DSGVO)",
    intro: "Informationen gemäß Verordnung (EU) 2016/679 (DSGVO) sowie DDG/TTDSG. MikiLab Pro verarbeitet nur die für den Betrieb des Dienstes notwendigen Mindestdaten.",
    sections: [
      { h: "Verantwortlicher", b: `${OWNER} — ${CITY}. Datenschutz-Kontakt: ${EMAIL}. Für alle Anfragen zu deinen Daten schreibe an diese Adressen: Wir antworten innerhalb von 30 Tagen gemäß DSGVO.` },
      { h: "Verarbeitete Daten und Zwecke", b: "• Registrierung/Login: Name und E-Mail (Rechtsgrundlage: Art. 6(1)(b) DSGVO, Vertragserfüllung). • Zugangsanfrage über das öffentliche Portal: E-Mail und Grund (Art. 6(1)(b)). • Technisches Sitzungs-Cookie und PIN-Gate (Art. 6(1)(f), unbedingt erforderlich). • Lokale Einstellungen (Sprache, Lautstärke) nur in deinem Browser (localStorage), nie an den Server gesendet. • Push-Benachrichtigungen (nur wenn du sie aktivierst): Geräte-Token für kritische Warnungen (Art. 6(1)(a), widerrufbar). • Sprachfunktionen: Vorzulesende Texte werden an den Sprachdienst übergeben; wir speichern keine Aufnahmen." },
      { h: "Auftragsverarbeiter", b: "• Resend (Versand von Betriebs- und Passwort-Reset-E-Mails) — USA, mit EU-Standardvertragsklauseln. • Hosting-Anbieter (Server und Datenbank in der EU). Daten werden nicht verkauft, weitergegeben oder für Werbung/Profiling genutzt." },
      { h: "Cookies", b: "Diese Seite verwendet NUR unbedingt erforderliche technische Cookies (Login-Sitzung und PIN-Gate, § 25(2) TTDSG) sowie Einstellungen im localStorage. Keine Tracking-, Analyse- oder Marketing-Cookies: daher ist kein Einwilligungs-Banner erforderlich." },
      { h: "Speicherdauer und Löschung", b: "Daten werden gespeichert, solange das Konto aktiv ist oder bis du die Löschung verlangst. Du kannst jederzeit die Löschung von Konto und Daten anfordern: " + EMAIL + "." },
      { h: "Deine Rechte (Art. 12–22 DSGVO)", b: "Du hast das Recht auf: Auskunft, Berichtigung, Löschung (\"Recht auf Vergessenwerden\"), Einschränkung, Datenübertragbarkeit, Widerspruch, jederzeitigen Widerruf der Einwilligung und Beschwerde bei der Aufsichtsbehörde. Für Deutschland: LfDI Baden-Württemberg (Landesbeauftragter für den Datenschutz). Keine automatisierte Entscheidungsfindung oder Profiling." },
    ],
    note: "Stand: September 2026.",
  },
  en: {
    title: "Legal Notice & Privacy (GDPR)",
    intro: "Information pursuant to Regulation (EU) 2016/679 (GDPR) and German law (DDG/TTDSG). MikiLab Pro processes only the minimum data needed to operate the service.",
    sections: [
      { h: "Data controller", b: `${OWNER} — ${CITY}. Privacy contact: ${EMAIL}. For any request about your data, write to these addresses: we reply within 30 days as required by the GDPR.` },
      { h: "Data processed and purposes", b: "• Registration/login: name and email (basis: Art. 6(1)(b) GDPR, performance of the service). • Access request via the public portal: email and reason (Art. 6(1)(b)). • Technical session cookie and PIN gate (Art. 6(1)(f), strictly necessary). • Local preferences (language, volume) stored only in your browser (localStorage), never sent to the server. • Push notifications (only if you enable them): device token to send critical alerts (Art. 6(1)(a), revocable consent). • Voice features: texts read aloud are passed to the speech service; we do not store recordings." },
      { h: "Processors", b: "• Resend (operational and password-reset emails) — USA, with EU Standard Contractual Clauses. • Hosting provider (server and database in the EU). Data is never sold, shared or used for advertising or profiling." },
      { h: "Cookies", b: "This site uses ONLY strictly necessary technical cookies (login session and PIN gate, § 25(2) TTDSG) plus preferences in localStorage. No tracking, analytics or marketing cookies: therefore no consent banner is required." },
      { h: "Retention and deletion", b: "Data is kept while the account is active or until you request deletion. You can request deletion of your account and data at any time: " + EMAIL + "." },
      { h: "Your rights (Art. 12–22 GDPR)", b: "You have the right to: access, rectification, erasure (\"right to be forgotten\"), restriction, data portability, objection, withdrawal of consent at any time, and to lodge a complaint with the supervisory authority. For Germany: LfDI Baden-Württemberg. No automated decision-making or profiling." },
    ],
    note: "Last updated: September 2026.",
  },
};

export default function LegalPage() {
  const { lang } = useLang();
  const c = pick(T, lang);
  const tr = (i, d, e, s) => mkTri(lang)(i, d, e, s);
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

  const card = "rounded-xl bg-[#0D1520]/80 border border-[#64748B]/25 p-5";
  const h2cls = "font-cyber text-sm font-black text-white uppercase tracking-wider";
  const pcl = "text-sm text-[#CBD5E1] mt-1.5 leading-relaxed";

  return (
    <div data-testid="legal-page" className="pb-4 space-y-4">
      <div className="rounded-xl p-6 border border-[#8a97a6]/30 bg-gradient-to-br from-[#0D1520] to-[#060A10]">
        <ShieldCheck className="w-7 h-7 mb-2 text-[#8a97a6]" />
        <h1 className="font-cyber text-xl font-black text-white uppercase tracking-wider">{c.title}</h1>
        <p className="text-[#94A3B8] text-sm mt-2 leading-relaxed">{c.intro}</p>
      </div>

      {/* Impressum (Germania) */}
      <div data-testid="impressum" className={card}>
        <div className="flex items-center gap-2 mb-2"><Building2 className="w-5 h-5 text-[#8a97a6]" /><h2 className={h2cls}>Impressum</h2></div>
        <p className={pcl}>{tr("Ai sensi del § 5 DDG (Digitale-Dienste-Gesetz, Germania):", "Angaben gemäß § 5 DDG:", "Information pursuant to § 5 DDG (Germany):")}</p>
        <div className={`${pcl} mt-2`}>
          <p className="font-bold text-white">{OWNER}</p>
          <p>{CITY}</p>
          <p>E-Mail: <span className="text-[#9aa6b2]">{EMAIL}</span></p>
          <p className="text-[#94A3B8]">{tr("Sito: mikilab.de", "Website: mikilab.de", "Website: mikilab.de")}</p>
        </div>
        <p data-testid="impressum-todo" className="text-[11px] text-[#a4afbb] mt-3 italic border border-[#a4afbb]/30 rounded-lg px-3 py-2 bg-[#a4afbb]/5">
          {tr("⚠ DA COMPLETARE: aggiungere l'indirizzo postale completo (ladungsfähige Anschrift) appena disponibile — obbligatorio per la piena conformità tedesca.",
             "⚠ ZU ERGÄNZEN: vollständige ladungsfähige Anschrift hinzufügen, sobald verfügbar — für die volle deutsche Konformität erforderlich.",
             "⚠ TO COMPLETE: add the full postal address (ladungsfähige Anschrift) as soon as available — required for full German compliance.")}
        </p>
      </div>

      {/* Privacy sections */}
      <div className={card}>
        <div className="flex items-center gap-2 mb-3"><ScrollText className="w-5 h-5 text-[#8a97a6]" /><h2 className={h2cls}>{tr("Informativa Privacy (GDPR)", "Datenschutzerklärung (DSGVO)", "Privacy Policy (GDPR)", "Privacidad (RGPD)")}</h2></div>
        <div className="space-y-4">
          {c.sections.map((s, i) => (
            <div key={i} className="border-l-2 border-[#8a97a6]/40 pl-3">
              <h3 className="text-sm font-bold text-white">{s.h}</h3>
              <p className={pcl}>{s.b}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Cookie policy */}
      <div data-testid="cookie-policy" className={card}>
        <div className="flex items-center gap-2 mb-2"><Cookie className="w-5 h-5 text-[#8a97a6]" /><h2 className={h2cls}>{tr("Cookie Policy", "Cookie-Richtlinie", "Cookie Policy", "Política de cookies")}</h2></div>
        <p className={pcl}>{tr(
          "Cookie tecnici usati: (1) sessione di accesso (mikilab_session) — necessario per restare connesso; (2) PIN gate (mikilab_gate) — necessario per l'accesso operatore; (3) preferenze in localStorage (lingua, volume) — restano solo sul tuo dispositivo. Durata: sessione o fino a cancellazione manuale. Nessun cookie di terze parti, tracciamento o profilazione.",
          "Verwendete technische Cookies: (1) Login-Sitzung (mikilab_session) — erforderlich, um angemeldet zu bleiben; (2) PIN-Gate (mikilab_gate) — erforderlich für den Bedienerzugang; (3) Einstellungen im localStorage (Sprache, Lautstärke) — bleiben nur auf deinem Gerät. Dauer: Sitzung oder bis zur manuellen Löschung. Keine Drittanbieter-, Tracking- oder Profiling-Cookies.",
          "Technical cookies used: (1) login session (mikilab_session) — needed to stay signed in; (2) PIN gate (mikilab_gate) — needed for operator access; (3) preferences in localStorage (language, volume) — stay on your device only. Duration: session or until manually cleared. No third-party, tracking or profiling cookies.")}</p>
      </div>

      {/* Modulo contatti */}
      <div data-testid="contact-form" className={card}>
        <div className="flex items-center gap-2 mb-3"><Mail className="w-5 h-5 text-[#8a97a6]" /><h2 className={h2cls}>{tr("Contattaci", "Kontakt", "Contact us", "Contáctanos")}</h2></div>
        <input data-testid="contact-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={tr("Il tuo nome", "Dein Name", "Your name", "Tu nombre")}
          className="w-full mb-2 bg-[#060A10] border border-[#64748B]/40 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-[#8a97a6] placeholder:text-[#64748B]" />
        <input data-testid="contact-email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" type="email"
          className="w-full mb-2 bg-[#060A10] border border-[#64748B]/40 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-[#8a97a6] placeholder:text-[#64748B]" />
        <textarea data-testid="contact-message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={4} placeholder={tr("Il tuo messaggio…", "Deine Nachricht…", "Your message…", "Tu mensaje…")}
          className="w-full mb-3 bg-[#060A10] border border-[#64748B]/40 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-[#8a97a6] placeholder:text-[#64748B]" />
        <button data-testid="contact-send" onClick={submit} disabled={sending}
          className="w-full inline-flex items-center justify-center gap-2 text-[#060A10] font-bold px-5 py-3 rounded-lg active:scale-95 disabled:opacity-60 transition-all" style={{ background: "linear-gradient(90deg,#8a97a6,#9aa6b2)" }}>
          {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          {tr("Invia messaggio", "Nachricht senden", "Send message", "Enviar mensaje")}
        </button>
      </div>

      <p className="text-center text-xs text-[#64748B] italic">{c.note}</p>
    </div>
  );
}
