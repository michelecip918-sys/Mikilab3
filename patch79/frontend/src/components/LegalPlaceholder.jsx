import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { siteSettingsApi } from "@/lib/api";

// Pagine legali con i testi forniti da Michele (bozza da verificare). Inseriti ESATTAMENTE, senza modifiche.

const IMPRESSUM = {
  de: `Angaben gemäß § 5 DDG
Michele Signorella
{ADDR}
Kontakt: E-Mail: michelecip918@gmail.com`,
  it: `Informazioni ai sensi del § 5 DDG
Michele Signorella
{ADDR}
Contatto: email michelecip918@gmail.com`,
  en: `Information pursuant to § 5 DDG
Michele Signorella
{ADDR}
Contact: email michelecip918@gmail.com`,
};

const IMPRESSUM_TITLE = {
  de: "Impressum",
  it: "Impressum (note legali)",
  en: "Legal notice (Impressum)",
};

const PRIVACY = {
  de: `Stand: September 2026

1. Verantwortlicher
Michele Signorella, {ADDR_INLINE}, E-Mail: michelecip918@gmail.com

2. Überblick
MikiLab – Il Manuale di Sitor ist ein kostenloses Rezeptangebot. Es gibt kein Kundenkonto, keinen Newsletter, kein Kontaktformular, keine Werbung, keine Reichweitenmessung und keine Tracking-Cookies. Wir verarbeiten nur die Daten, die für den Betrieb der Seite nötig sind.

3. Hosting und Server-Logfiles
Die Seite wird auf der Plattform Emergent gehostet, die in unserem Auftrag Daten verarbeitet. Beim Aufruf verarbeitet der Server technisch notwendige Daten (u. a. IP-Adresse, Datum, Uhrzeit, abgerufene Seite, Browser) in Logfiles, um die Seite sicher und stabil bereitzustellen. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an Sicherheit und Betrieb).

4. Speicherung im Browser
Wir speichern auf Ihrem Gerät (localStorage) Einstellungen und Fortschritte, zum Beispiel Sprache, Modus (Zuhause/Profi), Favoriten, Ihre Geräte, Fortschritte, Tagebuch, Einkaufs- und Wochenplan sowie den Chatverlauf. Diese Daten verlassen Ihr Gerät nicht; Ausnahme ist der Text einer Frage an Sitor (siehe Ziffer 5). Die Speicherung ist für die von Ihnen gewünschten Funktionen erforderlich (§ 25 Abs. 2 Nr. 2 TDDDG). Sie können die Daten jederzeit in Ihrem Browser löschen. Nur nach einem Admin-Login wird ein Session-Cookie gesetzt; es betrifft ausschließlich den Betreiber.

5. Sitor – KI-Assistent
Sitor ist ein KI-Assistent von MikiLab. Sein Avatar ist eine KI-generierte Darstellung des Betreibers; die Antworten erzeugt die KI, nicht Michele in Echtzeit. Wenn Sie Sitor eine Frage stellen, werden Ihr Text (die letzten Nachrichten des Gesprächs) und, falls Sie es aktiviert haben, Ihr Geräte- und Ofenprofil an unseren KI-Anbieter Anthropic (USA, Modell Claude) übermittelt, über die Plattform Emergent. Die Chattexte werden auf unserem Server nicht gespeichert; der Verlauf bleibt in Ihrem Browser. Bitte geben Sie keine personenbezogenen Daten oder Gesundheitsdaten ein. Eine Übermittlung in die USA kann stattfinden; sie erfolgt auf Grundlage geeigneter Garantien nach Art. 46 DSGVO, soweit vom Anbieter bereitgestellt. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (die von Ihnen angeforderte Funktion) bzw. lit. a bei freiwilliger Eingabe.
Foto-Funktion („Com'è venuto?"): Wenn Sie diese Funktion nutzen: Das Foto wird in Ihrem Browser verkleinert und neu kodiert (Metadaten entfernt) und nur nach Ihrer ausdrücklichen Einwilligung (Art. 6 Abs. 1 lit. a DSGVO) zur Analyse an den KI-Anbieter gesendet. Es wird nicht gespeichert.
Spracherkennung: Wenn Sie das Mikrofon aktivieren, nutzt Ihr Browser seine Spracherkennung. Je nach Browser (zum Beispiel Chrome/Google oder Safari/Apple) kann die Audioverarbeitung auf Servern des Browserherstellers erfolgen. Das Mikrofon startet nur nach Ihrem ausdrücklichen Antippen (Art. 6 Abs. 1 lit. a DSGVO). An Sitor gelangt nur der erkannte Text.

6. Zähler und Nutzungsgrenzen
Um Missbrauch und Kosten zu begrenzen, speichern wir tägliche Zähler (zum Beispiel die Anzahl der Fragen). Dafür wird ein pseudonymer Hash aus IP-Adresse, Browserkennung und Cookie gebildet; er enthält keine Texte und keinen Namen. Beim „Test des Monats" wird dieser Hash zur Begrenzung auf eine Stimme pro Gerät bis zu 400 Tage aufbewahrt; die Stimme selbst enthält nur Ihre Auswahl und das Datum, keine IP-Adresse. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO.

7. Radio und Links
Die Radiofunktion lädt Audio erst, wenn Sie auf Play drücken. Dann verbindet sich Ihr Browser direkt mit den Streaming-Servern des jeweiligen Senders (öffentlich-rechtliche und private Radiosender aus Italien, Deutschland und anderen europäischen Ländern sowie deren Streaming-Dienstleister), die Ihre IP-Adresse erhalten. Wir verlinken unser TikTok-Profil; erst wenn Sie den Link anklicken, wird Ihre IP-Adresse an TikTok übertragen. Es werden keine Inhalte eingebettet. Es gilt die Datenschutzerklärung von TikTok. Schriftarten und Bilder liefert unser Server aus; es werden keine Google Fonts, Karten oder Statistikdienste geladen.

8. Ihre Rechte
Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Widerspruch und Datenübertragbarkeit sowie das Recht, erteilte Einwilligungen zu widerrufen. Kontakt: michelecip918@gmail.com. Sie können sich außerdem bei einer Aufsichtsbehörde beschweren, zum Beispiel beim Landesbeauftragten für den Datenschutz und die Informationsfreiheit Baden-Württemberg in Stuttgart.

9. Kinder
Das Angebot richtet sich an alle, die Backen lernen möchten. Wir erheben keine Angaben zur Person. Bitte geben Sie in den Chat keine persönlichen Daten ein.`,
  it: `Aggiornata a settembre 2026

1. Titolare
Michele Signorella, {ADDR_INLINE}, email: michelecip918@gmail.com

2. In breve
MikiLab – Il Manuale di Sitor è un ricettario gratuito. Non ci sono account per i visitatori, newsletter, moduli di contatto, pubblicità, statistiche né cookie di tracciamento. Trattiamo solo i dati necessari al funzionamento del sito.

3. Hosting e log del server
Il sito è ospitato sulla piattaforma Emergent, che tratta i dati per nostro conto. Quando apri il sito, il server tratta dati tecnici necessari (tra cui indirizzo IP, data, ora, pagina richiesta, browser) nei log, per offrire il sito in modo sicuro e stabile. Base giuridica: art. 6, par. 1, lett. f GDPR (interesse legittimo alla sicurezza e al funzionamento).

4. Memoria del browser
Salviamo sul tuo dispositivo (localStorage) impostazioni e progressi, per esempio lingua, modalità (Casa/Esperto), preferiti, i tuoi attrezzi, progressi, diario, piano e lista della spesa, e la cronologia della chat. Questi dati non lasciano il tuo dispositivo; l'eccezione è il testo di una domanda a Sitor (vedi punto 5). Sono necessari per le funzioni che hai richiesto (§ 25, comma 2, n. 2 TDDDG). Puoi cancellarli in ogni momento dal browser. Solo dopo il login dell'amministratore viene impostato un cookie di sessione, che riguarda solo il gestore.

5. Sitor – assistente IA
Sitor è un assistente di intelligenza artificiale di MikiLab. Il suo avatar è una rappresentazione generata con l'IA del gestore; le risposte le genera l'IA, non Michele in tempo reale. Quando fai una domanda a Sitor, il tuo testo (gli ultimi messaggi della conversazione) e, se lo hai attivato, il tuo profilo attrezzi e forno vengono inviati al nostro fornitore di IA Anthropic (USA, modello Claude), tramite la piattaforma Emergent. I testi delle chat non sono salvati sul nostro server; la cronologia resta nel tuo browser. Non inserire dati personali o di salute. Può avvenire un trasferimento verso gli USA, sulla base di garanzie adeguate ai sensi dell'art. 46 GDPR, per quanto fornite dal fornitore. Base giuridica: art. 6, par. 1, lett. b GDPR (la funzione da te richiesta) oppure lett. a per l'inserimento volontario.
Funzione foto ("Com'è venuto?"): se usi questa funzione: la foto viene ridotta e ricodificata nel tuo browser (metadati rimossi) e inviata al fornitore di IA per l'analisi solo dopo il tuo consenso esplicito (art. 6, par. 1, lett. a GDPR). Non viene salvata.
Riconoscimento vocale: se attivi il microfono, il tuo browser usa il proprio riconoscimento vocale. A seconda del browser (per esempio Chrome/Google o Safari/Apple) l'audio può essere elaborato sui server del produttore del browser. Il microfono parte solo dopo un tuo tocco esplicito (art. 6, par. 1, lett. a GDPR). A Sitor arriva solo il testo riconosciuto.

6. Contatori e limiti d'uso
Per limitare abusi e costi salviamo contatori giornalieri (per esempio il numero di domande). A questo scopo si forma un codice pseudonimo (hash) da indirizzo IP, browser e cookie; non contiene testi né nomi. Nel "Test del Mese" questo codice è conservato fino a 400 giorni per limitare a un voto per dispositivo; il voto contiene solo la tua scelta e la data, senza indirizzo IP. Base giuridica: art. 6, par. 1, lett. f GDPR.

7. Radio e link
La radio carica l'audio solo quando premi play. Allora il tuo browser si collega direttamente ai server di streaming della radio scelta (emittenti pubbliche e private italiane, tedesche e di altri paesi europei e i loro fornitori di streaming), che ricevono il tuo indirizzo IP. Colleghiamo il nostro profilo TikTok; solo quando clicchi il link il tuo indirizzo IP arriva a TikTok. Non incorporiamo contenuti. Vale l'informativa di TikTok. Caratteri e immagini arrivano dal nostro server; non usiamo Google Fonts, mappe o servizi di statistica.

8. I tuoi diritti
Hai diritto di accesso, rettifica, cancellazione, limitazione, opposizione e portabilità, e di revocare i consensi dati. Contatto: michelecip918@gmail.com. Puoi anche presentare reclamo a un'autorità di controllo, per esempio il Landesbeauftragter für den Datenschutz und die Informationsfreiheit Baden-Württemberg a Stoccarda.

9. Minori
Il sito è per chiunque voglia imparare a fare il pane. Non raccogliamo dati personali. Non inserire dati personali nella chat.`,
  en: `Last updated: September 2026

1. Controller
Michele Signorella, {ADDR_INLINE}, email: michelecip918@gmail.com

2. Overview
MikiLab – Il Manuale di Sitor is a free recipe site. There are no visitor accounts, newsletters, contact forms, advertising, analytics or tracking cookies. We only process the data needed to run the site.

3. Hosting and server logs
The site is hosted on the Emergent platform, which processes data on our behalf. When you open the site, the server processes technically necessary data (including IP address, date, time, page requested, browser) in log files to provide the site securely and reliably. Legal basis: Art. 6(1)(f) GDPR (legitimate interest in security and operation).

4. Browser storage
We store settings and progress on your device (localStorage), for example language, mode (Home/Expert), favourites, your equipment, progress, diary, shopping and weekly plan, and chat history. This data does not leave your device; the exception is the text of a question to Sitor (see section 5). It is necessary for the functions you asked for (§ 25(2) no. 2 TDDDG). You can delete it at any time in your browser. A session cookie is set only after the administrator logs in and concerns the operator only.

5. Sitor – AI assistant
Sitor is an AI assistant of MikiLab. Its avatar is an AI-generated depiction of the operator; the answers are generated by the AI, not by Michele in real time. When you ask Sitor a question, your text (the last messages of the conversation) and, if you enabled it, your equipment and oven profile are sent to our AI provider Anthropic (USA, Claude model) via the Emergent platform. Chat texts are not stored on our server; the history stays in your browser. Please do not enter personal or health data. A transfer to the USA may take place, on the basis of appropriate safeguards under Art. 46 GDPR, as provided by the provider. Legal basis: Art. 6(1)(b) GDPR (the function you requested) or (a) for voluntary input.
Photo function ("Com'è venuto?"): if you use this function: the photo is resized and re-encoded in your browser (metadata removed) and sent to the AI provider for analysis only after your explicit consent (Art. 6(1)(a) GDPR). It is not stored.
Voice recognition: if you turn on the microphone, your browser uses its own speech recognition. Depending on the browser (for example Chrome/Google or Safari/Apple), audio may be processed on the browser maker's servers. The microphone starts only after your explicit tap (Art. 6(1)(a) GDPR). Only the recognised text reaches Sitor.

6. Counters and usage limits
To limit abuse and costs we store daily counters (for example the number of questions). For this a pseudonymous hash of IP address, browser and cookie is created; it contains no texts and no name. In the "Test of the Month" this hash is kept for up to 400 days to limit voting to one vote per device; the vote itself contains only your choice and the date, no IP address. Legal basis: Art. 6(1)(f) GDPR.

7. Radio and links
The radio loads audio only when you press play. Your browser then connects directly to the streaming servers of the station you chose (public and private broadcasters from Italy, Germany and other European countries and their streaming providers), which receive your IP address. We link to our TikTok profile; only when you click the link is your IP address sent to TikTok. We do not embed any content. TikTok's privacy policy applies. Fonts and images are served by our server; we do not use Google Fonts, maps or analytics services.

8. Your rights
You have the right of access, rectification, erasure, restriction, objection and data portability, and to withdraw consent. Contact: michelecip918@gmail.com. You may also complain to a supervisory authority, for example the State Commissioner for Data Protection and Freedom of Information of Baden-Württemberg in Stuttgart.

9. Children
The site is for anyone who wants to learn to bake. We do not collect personal details. Please do not enter personal data in the chat.`,
};

const PRIVACY_TITLE = {
  de: "Datenschutzerklärung",
  it: "Informativa sulla privacy (Datenschutzerklärung)",
  en: "Privacy policy (Datenschutzerklärung)",
};

const pick = (obj, lang) => obj[lang] || obj.it;

// Indirizzo predefinito (usato finché in admin non si imposta "Indirizzo Impressum").
const DEFAULT_ADDR = {
  de: "Stitzenburgstraße 15\n70182 Stuttgart\nDeutschland",
  it: "Stitzenburgstraße 15\n70182 Stoccarda\nGermania",
  en: "Stitzenburgstraße 15\n70182 Stuttgart\nGermany",
};

// Sostituisce i segnaposto {ADDR} (righe) e {ADDR_INLINE} (una riga) col testo scelto.
function fillAddr(text, addr) {
  const lines = String(addr || "").split("\n").map((l) => l.trim()).filter(Boolean);
  return text.split("{ADDR_INLINE}").join(lines.join(", ")).split("{ADDR}").join(lines.join("\n"));
}

// Blocchi separati da riga vuota: "N. Titolo" diventa sottotitolo, il resto paragrafo.
function renderBlocks(text) {
  return text.split(/\n\s*\n/).map((block, i) => {
    const lines = block.split("\n").filter((l) => l.trim());
    if (!lines.length) return null;
    const head = /^\d+\.\s/.test(lines[0]) ? lines[0] : null;
    const body = head ? lines.slice(1).join("\n") : lines.join("\n");
    return (
      <div key={i} className="space-y-1.5">
        {head && <h2 className="text-base font-bold text-foreground">{head}</h2>}
        <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">{body}</p>
      </div>
    );
  });
}

export default function LegalPlaceholder({ kind = "impressum", onBack }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const isImp = kind === "impressum";
  const [customAddr, setCustomAddr] = useState("");
  const [loaded, setLoaded] = useState(false); // evita di mostrare per un istante l'indirizzo predefinito
  useEffect(() => {
    let alive = true;
    siteSettingsApi.get()
      .then((s) => { if (alive && s && typeof s.impressum_address === "string") setCustomAddr(s.impressum_address); })
      .catch(() => { /* */ })
      .finally(() => { if (alive) setLoaded(true); });
    return () => { alive = false; };
  }, []);
  const addr = (customAddr || "").trim() || pick(DEFAULT_ADDR, lang);
  const title = isImp ? IMPRESSUM_TITLE[lang] || IMPRESSUM_TITLE.it : PRIVACY_TITLE[lang] || PRIVACY_TITLE.it;
  return (
    <div data-testid={`legal-${kind}`} className="max-w-2xl mx-auto pt-6">
      <button data-testid="legal-back" onClick={onBack} className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground mb-4">
        <ChevronLeft className="w-4 h-4" /> {tri("Indietro", "Zurück", "Back")}
      </button>
      <h1 className="font-display text-2xl font-black text-foreground mb-4">{title}</h1>
      <div className="rounded-2xl border border-border bg-background/70 p-5 space-y-4">
        {isImp
          ? <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{loaded ? fillAddr(pick(IMPRESSUM, lang), addr) : "…"}</p>
          : renderBlocks(loaded ? fillAddr(pick(PRIVACY, lang), addr) : "…")}
      </div>
    </div>
  );
}
