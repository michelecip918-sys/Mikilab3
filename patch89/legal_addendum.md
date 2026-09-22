
## 13. V84 — strumenti locali (segreto del 16 ottobre, banco delle prove, il mio forno)
- **Il forno si accende** (`LancioSegreto.jsx`): conto alla rovescia calcolato nel browser. `localStorage`: `mikilab_forno_trovato` (chi ha trovato il segreto), `mikilab_forno_banner_chiuso`. Il promemoria è un file `.ics` creato in locale (Blob). Condivisione via `navigator.share` o clipboard. Nessuna chiamata al server, nessun contatore.
- **Il banco delle prove** (`BancoProve.jsx`): nessun dato salvato né inviato; "Chiedi a Sitor" precompila la chat con il testo scelto (stesso flusso della chat pubblica).
- **Il mio forno** (`MioForno.jsx`): foto (ridotte nel browser), voto e note salvati SOLO in IndexedDB (`mikilab-offline`, chiave `mioforno`), mai inviati. "Esporta" crea un `.json` locale. "Chiedi a Sitor" invia alla chat solo nome ricetta, voto e nota scritti dall'utente: MAI la foto.
- Nessun cookie nuovo, nessuna statistica, nessun servizio esterno.

## 14. V85 — lievito madre, mappa del forno, primo giro, condimenti
- **Il mio lievito madre** (`MioLievito.jsx`): nome, data di nascita, tipo, rinfreschi, traguardi e "fratelli" (solo nomi scritti dall'utente) in `localStorage` (`mikilab_lievito_figlio`). Certificato di nascita generato nel browser (canvas) e condiviso via `navigator.share` o download. Promemoria compleanno come `.ics` locale. "Chiedi a Sitor" invia alla chat solo il testo della visita di controllo scelto dall'utente.
- **La mappa del tuo forno** (`MappaForno.jsx`): 9 valori chiaro/giusto/scuro in `localStorage` (`mikilab_oven_map`); può impostare `mikilab_oven_adj` (±10 °C). Se «Sitor ricorda la mia cucina» è attivo, nella chat entra UNA riga di testo (es. "scalda di più dietro"), come già per forno/attrezzi.
- **Il primo giro con Sitor** (`PrimoGiro.jsx`): `localStorage` `mikilab_giro_visto`; **Modo grande**: `mikilab_modo_grande` (solo una classe CSS). Nessun invio.
- **Sopra la focaccia**: testi statici al posto dei sughi da pasta. Nessuna IA, nessuna rete.
- Nessun cookie nuovo, nessuna statistica, nessun servizio esterno.

## 15. V86 — il pane parla, sveglia, pane del paese, lievito che viaggia, senza bilancia, modo notte, cura del lievito
- **Il pane parla** (`AscoltaCrosta.jsx`): microfono acceso SOLO dopo un tocco, audio analizzato in tempo reale nel browser (Web Audio API), MAI registrato né inviato; si spegne uscendo dalla pagina. Nessun dato salvato.
- **La sveglia del panettiere** (`SvegliaPanettiere.jsx`): legge il corso già pubblico (`/recipes/{id}/course-v2`), calcola nel browser, `.ics` locale. Nessun dato inviato.
- **Il pane del mio paese** (`PaneDelPaese.jsx`): regione scelta in `localStorage` (`mikilab_paese`); abbinamento per parole chiave nel nome della ricetta. Testi regionali: bozze di Sitor (IA).
- **Il lievito viaggia** (in `MioLievito.jsx`): QR/link `mikilab.de/?lievito=…` contenente SOLO nome, data di nascita e tipo del lievito (nessun dato personale); generato nel browser (libreria `qrcode`). Chi lo apre crea il "figlio" nel proprio telefono.
- **Pane senza bilancia** (`SenzaBilancia.jsx`): tabella statica, nessun dato salvato.
- **Curare il lievito madre** (`CuraLievito.jsx`): guida statica, bozza di Sitor (IA).
- **Modo notte** (`lib/notte.js`, `tts.js`): `localStorage` `mikilab_modo_notte`; abbassa il volume della voce sintetica del dispositivo.
- Nessun cookie nuovo, nessuna statistica, nessun servizio esterno.

## 16. V87 — indirizzi delle ricette, festa del 16 ottobre, volantino
- **Indirizzi delle ricette** (`lib/recipeSeo.js`): quando si apre una scheda l'indirizzo diventa `mikilab.de/ricetta/<id>/<nome>` (solo lato client, `history.replaceState`), il titolo e i meta Open Graph mostrano nome e foto della ricetta, e un blocco JSON-LD schema.org/Recipe (nome, foto, tempi, ingredienti base, autore "Michele (MikiLab)") aiuta Google. Nessun dato personale, nessuna richiesta nuova.
- **Sitemap** (`public/sitemap.xml`): elenca la Home, Impressum, Datenschutz, il volantino e le ricette pubbliche.
- **Festa del 16 ottobre** (`FestaLancio.jsx`): il nome scritto per il certificato NON viene salvato né inviato (vive solo nello stato della pagina); il certificato è un'immagine creata nel browser. `localStorage` `mikilab_festa_vista`. La voce di benvenuto è la voce sintetica del dispositivo (già dichiarata).
- **Volantino** (`Volantino.jsx`): QR generato nel browser che porta solo a mikilab.de.
- Nessun cookie nuovo, nessuna statistica, nessun servizio esterno.

## 17. V88 — La tua cucina, Dal banco di Michele, Il libretto dei 5 panini
- **La tua cucina** (`LaTuaCucina.jsx`): nome facoltativo in `localStorage` (`mikilab_nome`, con "salta"), saluto e consigli costruiti SOLO da dati già nel telefono (lievito, quaderno del forno, ricette fatte, livello). Nulla inviato; il nome non entra nella chat di Sitor.
- **Dal banco di Michele** (`BancoMichele.jsx`): due righe scritte da Michele (admin) nella pagina del sito con slug "banco" (GET pubblico, PUT solo admin, rotte già esistenti). Nessun dato di visitatori.
- **Il libretto dei 5 panini** (`Libretto.jsx`): stampa locale delle 5 ricette di partenza con logo. Nessun dato.
- `lib/bottega.js` + `recipeSeo.js`: ultima ricetta aperta in `localStorage` (`mikilab_last_recipe`).

## 18. V89 — Da Miglionico a Stoccarda
- **Dedica** (`Dedica.jsx`, `mikilab.de/miglionico`): pagina statica con il testo di Michele. Nessun dato raccolto. I nomi eventualmente elencati sono inseriti da Michele nel codice (persone che ha scelto di ringraziare); nessun dato di visitatori.
