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
- Le immagini delle ricette sono file **locali** serviti dall'app (`/recipes/*.jpg`) — nessun servizio esterno.
- Eventuali illustrazioni delle Tecniche sarebbero file locali statici in `/tecniche/<slug>/*.webp`.

## 5. Memoria locale del dispositivo (nessun server)
Salvati SOLO nel browser (localStorage), mai inviati al server:
- lingua, livello ("sto imparando/so già"), modalità Casa/Esperto, preferiti, "i miei attrezzi",
  storico della chat, categorie aperte. Nessun banner cookie: sono dati funzionali locali.

## 6. Account e cookie
- **Registrazione pubblica DISATTIVATA**; login **solo admin** (email + password). Google login disattivato.
- Cookie impostato: `session_token` (solo dopo il login admin). Nessun cookie di statistica/tracciamento.

## 7. Log del server
- Log applicativi standard della piattaforma (richieste HTTP). Contatori dei limiti in MongoDB.

## 8. Nota (dati storici ancora nel DB, non usati dal sito)
Restano nel database dati aziendali di versioni precedenti (volti squadra, operatori, turni, magazzino,
consegne, compliance, community, utenti). NON sono più raggiungibili da un visitatore anonimo
(vedi STADIO 6b). Andranno cancellati in una fase separata dedicata.
