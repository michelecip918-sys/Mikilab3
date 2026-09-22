# LEGAL_DATA_MAP — Il Manuale di Sitor
Mappa dei dati che escono dal sito, ricavata dal codice reale. Serve a Michele per compilare
il generatore di informativa privacy / Datenschutz. (Documento tecnico, non è l'informativa.)

## 1. Hosting e archiviazione
- **Hosting**: piattaforma Emergent (frontend React + backend FastAPI + database MongoDB), stessa infrastruttura.
- **Database (MongoDB)**: ricette, `recipe_extras`, `recipe_courses_v2`, `technique_pages`, account admin,
  sessioni admin, contatori dei limiti (rate limit). NON contiene i testi delle chat pubbliche.

## 2. Servizio di Intelligenza Artificiale (Sitor)
- **Fornitore**: Anthropic (modello Claude), tramite la chiave universale Emergent LLM.
- **Quando**: generazione dei corsi passo-passo, delle pagine Tecniche, della funzione "cosa posso fare"
  e delle risposte della **chat di Sitor**.
- **Cosa esce**: per la chat, gli ultimi ~10 messaggi della conversazione (presi dal browser dell'utente)
  e, se l'utente lo ha impostato, il suo profilo attrezzi/forno. Per i corsi/tecniche escono solo i dati della ricetta.
- **Cosa NON viene salvato**: i testi delle chat pubbliche NON sono memorizzati sul server; restano solo nel
  browser dell'utente. Il server conserva solo **contatori numerici** dei limiti giornalieri, identificati da un
  hash di IP + user-agent + cookie (nessun testo, nessun nome).

## 3. Radio del Fornaio (solo su clic dell'utente)
- L'audio parte **solo** quando l'utente preme play. In quel momento il browser si collega direttamente
  ai server di streaming di terze parti, che ricevono l'indirizzo IP:
  - RAI (`icestreaming.rai.it`), Shoutcast (`streamingv2.shoutcast.com`), United Radio (`icy.unitedradio.it`).
- Prima del clic non viene caricato né inviato nulla verso questi host.

## 4. Immagini e file statici
- Le immagini delle ricette sono file **locali** serviti dall'app (`/recipes/*.webp`) — nessun servizio esterno.
- Illustrazioni delle Tecniche: file locali statici in `/tecniche/<slug>/*.webp`.

## 5. Memoria locale del dispositivo (nessun server)
Salvati SOLO nel browser (localStorage), mai inviati al server:
- lingua, livello ("sto imparando/so già"), modalità Casa/Esperto, preferiti, "i miei attrezzi",
  storico della chat, categorie aperte. Nessun banner cookie: sono dati funzionali locali.

## 6. Account e cookie
- **Registrazione pubblica DISATTIVATA**; login **solo admin** (email + password). Google login disattivato.
- Cookie impostato: `session_token` (solo dopo il login admin). Nessun cookie di statistica/tracciamento.

## 7. Log del server
- Log applicativi standard della piattaforma (richieste HTTP). Contatori dei limiti in MongoDB.

## 9. Novità (percorso, condivisione, TikTok)
- **Progressi del percorso** ("Segna come fatta"): salvati SOLO nel browser (`localStorage: mikilab_done`). Non inviati al server.
- **Chat "cosa faccio dopo?"**: il browser invia a Sitor (Anthropic) solo i NOMI delle ricette segnate come fatte e i titoli dei livelli attivi. Nessun salvataggio sul server.
- **TikTok**: solo un LINK al profilo (`https://www.tiktok.com/@<handle>`), aperto in nuova scheda al clic. Nessun embed/script/iframe/pixel. L'IP arriva a TikTok solo al clic.
- **Nessun numero di telefono pubblico** (STADIO Q1): rimosso ogni numero WhatsApp dai valori di default nel codice. `GET /api/site-settings` (pubblico) restituisce SOLO una lista bianca di campi: `tiktok_handle`, `hashtag`, `site_url`, `folder_covers`. Mai numeri di telefono, social vecchi (WhatsApp/Facebook/Instagram) o dati personali. Se un numero fosse presente nel DB da configurazioni precedenti, NON viene esposto pubblicamente.
- **Condivisione ricette** (STADIO Q3): "Condividi" usa `navigator.share`; in fallback copia il link/testo negli appunti locali. Nessun link o logo a WhatsApp o Facebook.
- **Regala MikiLab**: QR generato nel browser (libreria `qrcode`), nessun servizio esterno. "Condividi" usa `navigator.share` (o copia link). Copia hashtag/testo usano la clipboard locale.
- **Anteprima link (Open Graph)**: immagine `hero-ricette.jpg`; rimosso l'uso della vecchia og-image sci-fi.
- Nessuna nuova statistica, nessun pixel, nessun cookie nuovo.

## 8. Nota (dati storici ancora nel DB, non usati dal sito)
Restano nel database dati aziendali di versioni precedenti (volti squadra, operatori, turni, magazzino,
consegne, compliance, community, utenti). NON sono più raggiungibili da un visitatore anonimo
(vedi STADIO 6b e STADIO A: DEFAULT DENY su letture E scritture). Andranno cancellati in una fase separata dedicata.

## 10. Contatti e newsletter
Rimossi dall'interfaccia e da questa mappa (COMANDO 5B): nessun modulo contatti né iscrizione
newsletter è presente o raggiungibile. Non esiste alcun flusso che raccolga email dei visitatori.

## 12. Nuovi flussi COMANDO 2A (STADI F, G — backend) + C8 offline
- **Contatori anonimi** (`usage_daily`): solo numeri per giorno (chat, corsi, tecniche, piano, foto, ping live, done). Nessun dato personale.
- **Modalità risparmio** (`site_settings.savings_level` 0-3) e **feature flags** (`FEATURE_*`): letti a ogni chiamata IA. Livello 3 = nessuna chiamata IA pubblica.
- **Cache chat** (`chat_cache`): risposte a domande identiche (stessa lingua+livello) per 24h, SOLO se la domanda non contiene email/telefono, non supera 300 caratteri e non ha profilo/conversazione. Nessuna domanda personale in cache.
- **"Cosa faccio"** (`POST /api/sitor/plan`): il browser invia solo il testo libero (max 300); il server passa al modello l'elenco delle ricette VISIBILI e accetta SOLO id esistenti e non nascosti (Sitor non inventa). Limite 3/giorno (2 in risparmio).
- **Live** (`GET /api/live`, `GET /api/time`, `POST /api/live/ping`): il ping usa un token casuale NON salvato in modo persistente (solo per contare i partecipanti dell'ultimo minuto; ping più vecchi di 10 min eliminati). Nessun identificativo personale.
- **"Quanti l'hanno fatta"** (`POST /api/done-ping`): incrementa un contatore aggregato per ricetta/mese; l'hash dispositivo serve SOLO al limite 1/giorno. Mostrato solo se ≥ 20. Nessun dato personale.
- **Offline (sw.js v63)**: copia offline (network-first, max 150 voci) delle GET già visitate di ricette, corso, tecniche, equipment-guide, learning-path, site-pages. MAI in cache `/sitor/*`, `/live*`, `/done-ping` né richieste POST.
- **Voce (comandi vocali e chat vocale)**: il riconoscimento vocale usa la funzione DEL BROWSER (Web Speech API). A seconda del browser (per esempio Chrome/Google o Safari/Apple) **l'audio può essere elaborato sui server del produttore del browser**. Il microfono parte solo dopo un tocco esplicito dell'utente e accanto a ogni pulsante microfono compare un avviso visibile. A Sitor arriva SOLO il testo riconosciuto, come se fosse digitato. La voce di risposta è la voce sintetica del dispositivo.
- **Impressum e Datenschutz**: compilati con i testi di Michele (bozza, da verificare) in IT/DE/EN alle rotte `/impressum` e `/datenschutz` (link nel footer).


- **DEFAULT DENY totale**: un anonimo può leggere solo l'allowlist pubblica (ricette, extras, tecniche,
  equipment-guide, site-settings, auth/me, learning-path, site-pages, sitemap, experiments, flour-types,
  bread-calendar, time, live, features) e scrivere solo `/sitor/chat`, `/sitor/plan`, `/sitor/photo`,
  `/live/ping`, `/done-ping`, `/experiments/vote`, `/auth/login`, `/auth/logout`,
  `/auth/forgot-password`, `/auth/reset-password`.
  Ogni altra rotta (GET o scrittura) richiede sessione con `role == "admin"`, altrimenti **404**.
- **Login solo admin**: gli account non-admin ricevono 403 (dopo verifica password, nessuna enumerazione).
  Brute-force: 5 tentativi falliti = blocco 15 min. Cookie `session_token`: Secure, HttpOnly, SameSite=Lax.
- Verifica anonima (curl) su tutte le 443 rotte / 529 combinazioni metodo×path: **0 rotte fuori lista**
  rispondono 200/422/500 (solo 18 combinazioni pubbliche consentite).


## 9. STADIO 2B — nuovi flussi (giugno 2026)
- **Avatar di Sitor**: il volto di Sitor è una **rappresentazione sintetica del titolare del sito** (Michele)
  trasformata in avatar IA. Nessuna voce/video imita Michele: la voce è quella sintetica del dispositivo.
- **"Com'è venuto?" (analisi foto, `POST /sitor/photo`)**: attiva solo con l'interruttore `FEATURE_PHOTO_DIAG`.
  La foto è **ridotta nel browser a max 1024px e ricodificata in JPEG** (toglie l'EXIF), inviata al servizio IA
  (Anthropic Claude, vision) SOLO dopo consenso esplicito, usata per l'analisi e **subito scartata**:
  NON viene scritta su disco né nel database. Limite 3 foto/giorno per dispositivo (contatore `vision_calls`).
- **Stato ricette**: `recipe_extras.status` (sitor_draft / reviewed / tested) — solo etichette, nessun dato utente.
- **Bozza da Sitor (admin)**: genera una ricetta NASCOSTA (hidden_public) da rivedere; nessun dato utente.
- **Test del mese (`experiments`)**: voti **anonimi**, il documento del voto contiene SOLO le scelte a tocchi
  e il giorno — nessun IP, nessun identificativo. L'hash dispositivo serve solo al limite (un voto) e NON è
  salvato col voto. Risultati mostrati solo con ≥30 voti. Nessuna chiamata IA nel percorso pubblico del voto.
  (STADIO Q4) Il parametro `reveal` è stato RIMOSSO: i risultati dell'esperimento aperto arrivano SOLO nella
  risposta al proprio voto (decisione lato server), o nell'archivio dei test chiusi con ≥30 voti.
- **Traduttore farine (`flour_types`)** e **Calendario del pane (`bread_calendar`)**: solo contenuti redazionali
  (bozze approvate da Michele). Nessun dato personale. La data di Pasqua è calcolata localmente (algoritmo di Gauss).
- **Contenuti personali sul dispositivo (localStorage)**: diario, "La mia cucina", correzione forno, piano
  settimanale, mensola, promemoria `.ics` (generati nel browser), cache offline, voto del Test del mese.
  Nessun account, nessuna registrazione, nessun contenuto degli utenti pubblicato sul sito.
- **Rotte pubbliche aggiunte**: GET `experiments`, `flour-types`, `bread-calendar`; POST `sitor/photo`,
  `experiments/vote/{slug}`. Tutte le rotte admin del 2B (draft-recipe, admin/experiments, PUT su
  experiments/flour-types/bread-calendar) restano negate (404) agli anonimi.

## 10. STADIO Y — "Crea il tuo lievito" (COMANDO 5A, giugno 2026)
- Guida per creare licoli/lievito madre di grano e Sauerteig di segale DA ZERO, percorso a giorni.
- **Tutto sul dispositivo (localStorage)**: giorni completati (`mikilab_lievito_<variante>`), promemoria `.ics`
  generati nel browser (un evento al giorno con allarme). Nessun dato lascia il dispositivo.
- **"Come va?"** a tocchi: causa/rimedio statici, senza IA. "Chiedi a Sitor" apre la chat pubblica (nessun
  salvataggio sul server). Etichetta "Bozza di Sitor: da verificare da Michele".
- **Nessuna nuova rotta pubblica**: la pagina riusa la chat esistente e il generatore `.ics` lato browser.


## STADIO 2 — Stampa/PDF e Condivisione (20 settembre 2026)
- **Stampa / PDF ricetta**: genera lato browser una scheda dedicata (logo MikiLab, nome, dosi, procedimento,
  temperature/tempi, allergeni, riga di copyright) tramite `window.print()` + `@media print`. Nessun dato inviato al server.
- **Condividi**: crea nel browser (canvas 1080x1350) un'immagine con logo MikiLab, nome, tempo/difficoltà e il
  link a mikilab.de (senza dosi né procedimento), poi `navigator.share` o download. Tutto sul dispositivo, nessun invio.
- Nessuna modifica alla Privacy necessaria: le funzioni non raccolgono né trasmettono dati personali.

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
## 17. V88 — La tua bottega
- **La tua bottega** (`LaTuaBottega.jsx`, `lib/bottega.js`): nome facoltativo in `localStorage` (`mikilab_nome`, cancellabile con un tocco dallo stesso blocco), ultima ricetta aperta (`mikilab_last_recipe`), pane della settimana scelto (`mikilab_pane_settimana`). Legge, senza scriverli, il lievito (`mikilab_lievito_figlio`), le ricette fatte (`mikilab_done`) e il quaderno del forno (IndexedDB `mioforno`). Il pane della settimana è calcolato dal numero della settimana: nessun server. Nulla viene inviato; il nome NON entra nella chat di Sitor.
## 18. V89 — Da Miglionico a Stoccarda
- **Dedica** (`Dedica.jsx`, `mikilab.de/miglionico`): pagina statica con il testo di Michele. Nessun dato raccolto. I nomi eventualmente elencati sono inseriti da Michele nel codice (persone che ha scelto di ringraziare); nessun dato di visitatori.
## 19. V90 — Il gusto di giocare (festa, medaglie, sorprendimi, Sitor dice)
- **Medaglie** (`lib/medaglie.js`, `LeMieMedaglie.jsx`): 18 traguardi salvati SOLO in `localStorage` (`mikilab_medaglie`); nessuna classifica, nessun invio, nessun confronto tra persone. "Fornaio di notte" guarda solo l'ora del dispositivo.
- **Festa** (`Festa.jsx`): animazione locale (farina) quando si segna un pane come fatto o si prende una medaglia. Nessun suono (il sito resta muto per scelta), nessun dato.
- **Sorprendimi** (`Sorprendimi.jsx`): scelta casuale tra le ricette già pubbliche. **Sitor dice** (`SitorDice.jsx`): frasi statiche, bozze di Sitor (IA).
- Nessun cookie nuovo, nessuna statistica, nessun servizio esterno.
## 20. V91 — L'etichetta MikiLab
- **Etichetta** (`EtichettaMikiLab.jsx`): valori calcolati nel browser dai dati della ricetta (ore di lievitazione, tipo di lievito, sale e grassi per 100 g di farina, zuccheri, cereali integrali). Solo fatti sul procedimento; nessun claim salutistico o nutrizionale (Reg. UE 1924/2006), con avvertenza esplicita "non è un'etichetta nutrizionale né un consiglio medico". Nessun dato raccolto.
## 21. V92 — L'Officina di Sitor (13 attrezzi)
- **Tutto nel browser**: ogni attrezzo (`OfficinaSitor.jsx`, `StrumentiRicetta.jsx`, `components/officina/*`, `lib/sitorTools.js`) calcola in locale a partire dai dati della ricetta già caricata. Nessuna chiamata di rete aggiuntiva, nessun dato inviato al server o a terzi, nessun tracciamento.
- **L'occhio di Sitor**: la foto scelta dall'utente è disegnata su un canvas e letta pixel per pixel nel dispositivo; non viene caricata, salvata né inviata. Il risultato è un'indicazione sul colore della crosta e sull'apertura della mollica, non un giudizio di qualità o sicurezza alimentare.
- **Dati salvati solo in localStorage del dispositivo** (cancellabili dall'utente svuotando i dati del sito): prezzi degli ingredienti e del kWh (`mikilab_prezzi`, `mikilab_prezzo_kwh`), letture del righello (`mikilab_righello_<id>`, 24 h), misure dello stampo (`mikilab_stampo`), nome per la cartolina (`mikilab_cartolina_nome`). Nessun dato personale obbligatorio; il nome sulla cartolina è facoltativo e scelto dall'utente.
- **Cartolina e bigliettino**: la lista "Contiene" è dedotta dagli ingredienti della ricetta (cereali con glutine, uova, latte, frutta a guscio, sesamo, soia, senape, sedano, lupini, arachidi) come promemoria per chi regala pane fatto in casa; non sostituisce l'etichettatura obbligatoria per la vendita (Reg. UE 1169/2011); il bigliettino stesso invita a controllare le etichette degli ingredienti usati.
- **Il pane in agenda**: il file .ics è generato nel browser e consegnato all'app calendario dell'utente; nessun calendario viene letto.
- **Quanto ti costa**: stime economiche a scopo informativo, basate su prezzi inseriti dall'utente; nessuna raccolta.
- **Pronto soccorso, Lievitazione a casa tua, Acqua giusta, Disegna il taglio, Metti a confronto**: contenuti tecnici di panificazione; nessun claim salutistico o nutrizionale. Le dosi delle ricette non vengono mai modificate.
## 22. V93 — Il laboratorio, il primo pane, la bottega risponde, voce gratis
- **Voce**: di serie parla la sintesi vocale del dispositivo (gratuita, nessuna richiesta al server). La voce del server (OpenAI/ElevenLabs, a pagamento) è disattivata di default e si accende solo dall'admin (`FEATURE_VOICE_SERVER`, pagina Costi); il server la rifiuta (424) finché è spenta. La traduzione automatica prima della voce avviene solo su richiesta esplicita (`translate`) e con il modello economico.
- **La bottega risponde** (`lib/bottega.js`): le domande più comuni scritte a Sitor (termini del glossario, sintomi del pronto soccorso, dati della ricetta aperta, dove trovare le cose) ricevono una risposta calcolata nel browser dal testo già presente nel sito, senza chiamare l'IA; l'utente può sempre chiedere la risposta dell'IA con un tocco. Nessun dato inviato per queste risposte.
- **Il laboratorio** (`Laboratorio.jsx`, `components/laboratorio/*`): foglio di produzione, programmazione a freddo, conversioni, carico del forno: calcoli nel browser dalle ricette del sito; impostazioni salvate solo in localStorage (`mikilab_lab_*`); file .ics generato localmente. Nessun dato inviato.
- **Il tuo primo pane in 7 giorni** (`PrimoPane.jsx`): percorso didattico; i giorni fatti restano in localStorage (`mikilab_primopane`). **Le parole della ricetta** e **Prima che succeda**: testi tecnici, nessun claim salutistico.
- Cartelle `patch83`…`patch92` e `v92` rimosse dal repository (patch già applicate; non facevano parte del sito servito).
