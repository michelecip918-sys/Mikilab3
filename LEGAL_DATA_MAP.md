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
- **Regala MikiLab**: QR generato nel browser (libreria `qrcode`), nessun servizio esterno. "Condividi" usa `navigator.share` (o copia link). Copia hashtag/testo usano la clipboard locale.
- **Anteprima link (Open Graph)**: immagine `hero-ricette.jpg`; rimosso l'uso della vecchia og-image sci-fi.
- Nessuna nuova statistica, nessun pixel, nessun cookie nuovo.

## 8. Nota (dati storici ancora nel DB, non usati dal sito)
Restano nel database dati aziendali di versioni precedenti (volti squadra, operatori, turni, magazzino,
consegne, compliance, community, utenti). NON sono più raggiungibili da un visitatore anonimo
(vedi STADIO 6b e STADIO A: DEFAULT DENY su letture E scritture). Andranno cancellati in una fase separata dedicata.

## 10. Contatti e newsletter — RIMOSSI dall'interfaccia (STADIO A4)
- Il **modulo contatti** (era dentro la vecchia pagina legale, ora archiviata) e l'**iscrizione newsletter**
  NON sono più presenti nell'interfaccia. Nessun nuovo dato di contatto/iscrizione può essere raccolto.
- Dati storici ancora nel DB (solo NUMERI, mai le email): messaggi di contatto = **0**; iscritti newsletter = **1**.
  Da cancellare in una fase separata dedicata.

## 12. Nuovi flussi COMANDO 2A (STADI F, G — backend) + C8 offline
- **Contatori anonimi** (`usage_daily`): solo numeri per giorno (chat, corsi, tecniche, piano, foto, ping live, done). Nessun dato personale.
- **Modalità risparmio** (`site_settings.savings_level` 0-3) e **feature flags** (`FEATURE_*`): letti a ogni chiamata IA. Livello 3 = nessuna chiamata IA pubblica.
- **Cache chat** (`chat_cache`): risposte a domande identiche (stessa lingua+livello) per 24h, SOLO se la domanda non contiene email/telefono, non supera 300 caratteri e non ha profilo/conversazione. Nessuna domanda personale in cache.
- **"Cosa faccio"** (`POST /api/sitor/plan`): il browser invia solo il testo libero (max 300); il server passa al modello l'elenco delle ricette VISIBILI e accetta SOLO id esistenti e non nascosti (Sitor non inventa). Limite 3/giorno (2 in risparmio).
- **Live** (`GET /api/live`, `GET /api/time`, `POST /api/live/ping`): il ping usa un token casuale NON salvato in modo persistente (solo per contare i partecipanti dell'ultimo minuto; ping più vecchi di 10 min eliminati). Nessun identificativo personale.
- **"Quanti l'hanno fatta"** (`POST /api/done-ping`): incrementa un contatore aggregato per ricetta/mese; l'hash dispositivo serve SOLO al limite 1/giorno. Mostrato solo se ≥ 20. Nessun dato personale.
- **Offline (sw.js v62)**: copia offline (network-first, max 150 voci) delle GET già visitate di ricette, corso, tecniche, equipment-guide, learning-path, site-pages. MAI in cache `/sitor/*`, `/live*`, `/done-ping` né richieste POST.


- **DEFAULT DENY totale**: un anonimo può leggere solo l'allowlist pubblica (ricette, extras, tecniche,
  equipment-guide, site-settings, auth/me, learning-path, site-pages, sitemap) e scrivere solo
  `/sitor/chat`, `/auth/login`, `/auth/logout`, `/auth/forgot-password`, `/auth/reset-password`.
  Ogni altra rotta (GET o scrittura) richiede sessione con `role == "admin"`, altrimenti **404**.
- **Login solo admin**: gli account non-admin ricevono 403 (dopo verifica password, nessuna enumerazione).
  Brute-force: 5 tentativi falliti = blocco 15 min. Cookie `session_token`: Secure, HttpOnly, SameSite=Lax.
- Verifica anonima (curl) su tutte le 443 rotte / 529 combinazioni metodo×path: **0 rotte fuori lista**
  rispondono 200/422/500 (solo 18 combinazioni pubbliche consentite).

