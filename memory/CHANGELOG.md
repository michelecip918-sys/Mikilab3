# CHANGELOG (continua da PRD.md)

## v-omni (2026-06) — Dual-Mode Protocol + Enterprise depth (testato 100%, iteration_183)
- **Dual-Mode Protocol**: MODALITÀ STRATEGICA (Capo) = critiche/voce proattiva attive; MODALITÀ FLOOR (Mohamed) = silenzio Letz_Passive totale — BakoMix non parla in floor e il SequenceGuard è ora un banner inline NON bloccante e muto (niente modal/voce).
- **Matrice Sovrana (audit ricetta)**: `POST /lab/recipe-audit` — BakoMix Master Baker valuta idratazione/sale/lievito e propone Approva/Modifica/Rifiuta (decisione finale del Boss). Frontend `RecipeAuditMatrix.jsx` con robot in stato oro/ambra.
- **Linea di produzione 6 settori**: `GET /production/line-status` con handoff inter-settore (dosaggio→autolisi→formatura→fermo→cottura→abbattimento) calcolati da temperatura/idratazione. Card in EnterpriseGrid.
- **Omni-Intelligence**: `GET /enterprise/omni-intelligence` — benchmarking cross-sede, top/struggling, gap e strategie. Card viola in EnterpriseGrid.
- **Sfida Aura settimanale**: `GET /enterprise/weekly-challenge` (classifica sedi + premio). **Sede guidata**: form di creazione filiale (nome + dimensioni stanza) nel pannello Rete.
- Fix: ordine branch `ai_universal_command` (bilancia prima di "aggiungi").

## v-enterprise (2026-06) — Enterprise Grid & Pocket (rete multi-sede) + fix universal-command (testato 100%, iteration_182)
- **Fix bug**: `POST /ai/universal-command` — "aggiungi una bilancia" ora ritorna `device_added` (ramo bilancia prima del ramo generico "aggiungi"); "aggiungi rubrica" → `ui_personalization` + `/ai/my-features`.
- **Enterprise Grid backend** (persistito in `lab_sites`, seed 2 sedi demo): `/enterprise/overview`, `/enterprise/sites` (GET/POST/DELETE), `/enterprise/site-shift`, `/enterprise/global-leaderboard` (rank 1 = Grandmaster of the Network), `/enterprise/global-morning-briefing`, `/enterprise/strategic-fleet-advice` (flag score<85), `/enterprise/sites/{id}/layout` + `/layout/optimize` (drag macchinari + stima risparmio), WebSocket `/api/ws/enterprise-os/{site_id}` letz_passive.
- **Pocket**: `/pocket/master-command` (comando totale: vision/hr/recipe/briefing), `/pocket/dashboard/{id}`, `/pocket/vision/scan-floor`, `/pocket/recipes/create` (propaga alla collection ricette), `/pocket/site/weekly-plan`.
- **Frontend** `EnterpriseGrid.jsx`: vista full-screen (overview 3 stat, sedi con aura, leaderboard globale con corona, consulenza flotta) + **mappa spaziale 2D** con macchinari trascinabili (chiama optimize). Aperta dal pulsante `bakomix-enterprise-btn` nel pannello Capo. `enterpriseApi` in `lib/api.js`. Seed demo: sedi Stoccarda/Monaco.

## v-sixthsense (2026-06) — BakoMix "Sesto Senso": motore proattivo + Aura Sonora (NUOVO, esclusivo)
Sistema proattivo che OSSERVA lo stato condiviso del turno e ANTICIPA i problemi. Testato 100% backend + frontend (iteration_179), nessun HACCP/allergeni.
- **Backend (server.py ~L2166)**: `_compute_pulse()` + `GET /lab/pulse` (mood sereno/attivo/teso/critico, heartbeat bpm, score, alerts multilingua it/de/en/es/fr/fa con suggestion, checkin, rest_mode). Anomalie: guasto macchina + cella down = CRITICO, lotto in ritardo = WARN, piano attivo senza check-in = INFO.
- **Check-in silenzioso**: `POST/GET/DELETE /lab/shift/checkin` — l'operatore avvia il turno → notifica discreta al Capo (`type:"checkin"`). Rate-limit 8/5min per IP (Floor pubblico).
- **Riposo Blindato (DND)**: `GET/PUT /lab/rest-mode` (admin) — silenzia tutto tranne emergenze critiche.
- **Sveglia Predittiva**: `GET/PUT /lab/wake` (admin) — `wake_at = first_start − prep_minutes` con wrap-around (verificato 05:00−25=04:35, 00:10−20=23:50).
- **Frontend**: `BakoMixSense.jsx` (avatar proattivo flottante bottom-left, polling 20s in pausa se tab nascosta, voce TTS proattiva throttled voce 'bakemix', pannello con alert/aura/riposo/sveglia/check-in), `LabAura.jsx` (AURA SONORA generativa Web Audio: la salute del laboratorio diventa suono+aura visiva pulsante — feature-firma esclusiva), `FailsafeSwitch.jsx` (interruttore macro alto contrasto hold-to-confirm ~1.1s, anti-tocco accidentale). Montato in `App.js` per Capo e Mohamed. `pulseApi` in `lib/api.js` con cache offline. Notifica `checkin` aggiunta a `NotificationBell.jsx`.
- **Estensioni (stessa sessione)**: **Storia del Battito** — `GET /lab/pulse/history` + snapshot throttled (1/min, cap 300) registrati da `GET /lab/pulse`; sparkline SVG nel pannello Capo (`bakomix-heartbeat-history`). **Aura per Reparto** — `LabAura` accetta `station` e cambia timbro/filtro per postazione di Mohamed (forno brillante, impasto profondo, banco medio). Anti-spam check-in: rate-limit 8/5min per IP.

## v-batch4 (2026-06) — Sequence Guard · Aura Fisica IoT · Ricalcolo Volumi · Traduzioni (testato 100%, iteration_180)
- **Sequence Guard**: `POST /lab/sequence/start|complete` sui lotti di `shift_state.batches` (ordine = sequenza; prossimo atteso = primo non avviato/fatto). Avvio fuori sequenza BLOCCATO (con `force` override). Frontend `SequenceGuard.jsx` in MohamedFloor: coda lotti + modal di blocco BakoMix (con voce) che indica quale lotto deve partire prima. Testid: sequence-guard/start/complete/block-modal/start-expected.
- **Aura Fisica IoT**: `lib/sensors.js` (bus pub/sub), `BakemixHardware` pubblica `oven_temp` dalle letture GATT reali, `LabAura` si iscrive e modula uno "sfrigolio" acuto con la temperatura forno + detune con il pH del lievito → sesto senso FISICO.
- **Ricalcolo Volumi Assenze**: `/operator/absence` registra in `lab_absences` per data; `GET/PUT /lab/staffing` calcola fattore presenti/totale; il pulse aggiunge un alert INFO con la % di riduzione volumi consigliata; card "Organico di oggi" nel pannello Capo (`bakomix-staffing`, input totale, `bakomix-staff-reduce`).
- **Traduzioni**: `DocsDownload.jsx` ("Documento Ecosistema (PDF)", sottotitolo, "Scarica") ora via `mkTri` a 6 lingue.

- **[Task 1] Mie Ricette nel Master (opzionale, no duplicati)**: `GET /recipes` accetta ora `include_mine` (bool). Con `true`, e per admin/owner, il Master include ANCHE le ricette personali del Capo, dedupate per `id`. Frontend: `RecipeList` mostra al Capo un toggle `data-testid=master-include-mine-toggle` («Mostra anche le Mie Ricette»), stato persistito in `localStorage.mikilab_master_include_mine`; `recipesApi.list(collection, includeMine)` con cache IDB separata (`recipes_mikilab_mine`). Verificato via curl: Master 149 → 150 con include_mine, personal=1, nessun duplicato.
- **[Task 3] Offline Totale (estensione IndexedDB)**: aggiunto helper `cachedGet(key, fn, fallback)` in `lib/api.js` (read-through IDB: online salva + ritorna fresco, offline ritorna l'ultima copia). Applicato a ~20 moduli: oven-profiles, lab-config, combos, plans/archive (per kind), favorites, news-items, news, announcements, site-settings, reports, bakers map/me, stores, purchase-orders, shifts, haccp-logs, flours, inventory, day-close last/list, dough-sessions, production-pin/status, admin-gate/status.
- **[Task 2] Revisione mobile (390px)**: verificati flusso d'ingresso, Hub 3 avatar, Capo Console e Master su mobile — layout pulito, nessun overflow reale (le uniche eccezioni sono il carosello avatar `w-screen` e le chip filtro a scorrimento orizzontale, entrambi voluti). Nuovo toggle Master ben renderizzato a piena larghezza.

- **[P0 SEC-004] Login brute-force IP spoofing**: `/auth/login` (server.py ~L911) ora usa `_client_ip(request)` (estrazione IP anti-spoofing dagli hop del proxy fidato) invece di `x-forwarded-for.split(',')[0]` grezzo. Impedisce il bypass del rate-limit tramite header falsificati. Verificato via curl (401 con header falsificato, nessun errore server).
- **[P1 UI] Sfondi postazioni custom Mohamed**: mappatura `mohStation` in App.js estesa con più parole chiave (forno/cottura/pizza→forno, impasto/fermentazione/planetaria/farina→impasto, laugen/pretzel/brezel→laugen, banco/pasticceria/decorazioni/cioccolato/gelato/confezionamento→banco) così i reparti custom del Capo ricevono uno sfondo coerente invece del solo fallback "banco". Nessun nuovo asset necessario.


## v68 (2026-06) — FASE B (parziale) + Asset & Mohammadreza restyle
- **Avatar sezioni**: `public/michele-avatar.jpg` sostituito con il nuovo avatar 3D di Michele (polo MikiLab + tatuaggio) → mostrato in alto in ogni sezione (MikiAvatar/HeroAvatar).
- **Footer foto reale**: `public/michele-real-lab.jpg` (foto reale di Michele in laboratorio) in un `<footer data-testid=page-footer>` in fondo a ogni pagina (App.js).
- **Prova gratuita 7 giorni (non registrati)**: PaywallGate — pulsante `local-trial-start` per visitatori non loggati; sblocca il contenuto PRO per 7 giorni a livello di dispositivo (localStorage `mikilab_local_trial`), banner `local-trial-banner`, messaggio `local-trial-ended` alla scadenza. Testato iteration_49 (4/4 PASS).
- **Assistente rinominato Mohammadreza Jafari** + presentato come **assistente personale di Michele (creatore di MikiLab)** (persona backend aggiornata; card/label/placeholder/toggle aggiornati). Nuovo **avatar in stile flat-illustration** (diverso dal precedente realistico), `public/mohammed-avatar.jpg`. Rifiuto fuori-ambito ora "Sono Mohammadreza…". Verificato via curl.
### FASE B ancora da completare: rimozione "Piano Settimanale" da impostazioni macchine (da chiarire: "settimana" è in step Pianificazione, corretto; verificare CapoLaboratorio), Bluetooth bilancia già facoltativo (verificato), step "Conclusione Lavorazione", riduzione schermate.
### FASE C (ricette) e FASE D residuo (avatar VIDEO animato in Home + Chiedi al Maestro) ancora da fare.
### Note test (LOW, non bloccanti): IntroGuide riappare a ogni reload (persistere flag); FAB Radio/Parla si sovrappongono al footer su mobile.

## v69 (2026-06) — FASE B completata
- **6° passo "Conclusione Lavorazione"** nel wizard Il Tuo Laboratorio (Maestro.jsx): banner checklist (`maestro-conclusione`) + strumenti di chiusura (Diario Impasti, Tracciabilità Lotti, Registro HACCP); step counter dinamico /{STEPS.length}.
- **"Piano Settimanale" rimosso dalle impostazioni macchine**: tolto il toggle `capo-use-weekly` da CapoLaboratorio (resta correttamente sotto step Pianificazione come strumento a sé).
- Didascalia introduttiva = card Mohammadreza; prova 7gg e Bluetooth facoltativo già fatti.
- Testato iteration_50: frontend 100% (4/4), 0 bug. Note opzionali: codice weekly ora morto in CapoLaboratorio (innocuo); FAB si sovrappongono ai form (app-wide).
### Prossimo: FASE C (ricette) e FASE D (avatar VIDEO animato in Home + Chiedi al Maestro; useremo il 2° video 20260818_114542.mp4).

## v70 (2026-06) — FASE C: Ricette reorg + nuovi contenuti + filtri
- **Categorie**: aggiunte "Snack" (🥨) e "Focacce" (🫓) in recipeCategory/CATS (ordine Basi→Pane→Panini→Snack→Focacce→Panettoni). i18n: cat_panini→"Panini/Brötchen/Rolls", nuove cat_snack e cat_focacce (IT/DE/EN).
- **Migrazione DB**: Focaccia Barese/Friselle/Puccia → menu_category "focacce"; Taralli → "snack".
- **+16 ricette** (seed_snack_panini.py, IT + DE/EN via Claude): 6 SNACK (Grissini stirati, Grissini al sesamo, Crackers ai semi, Pizzette rosse, Panzerotti fritti, Rustici sfogliati) + 10 PANINI (Integrale, Mais, Patate, Sesamo, Multicereali, Latte/hamburger, Olive, Zucca, Farro, Papavero). Procedimenti dettagliati passo-passo.
- **Filtri rapidi** per categoria in cima alla lista (chip Tutte/Basi/Pane/Panini/Snack/Focacce/Panettoni).
- **Selettore lingua IT/DE/EN dentro il dialog ricetta** (`recipe-lang-*`): ora si cambia lingua anche con la ricetta aperta (prima l'overlay copriva l'header).
- **Sicurezza**: `_teaser_recipe` ora oscura anche procedure_en/notes_en (prima il metodo PRO era leggibile in EN via API). Verificato: 0 leak.
- Testato iteration_51: frontend 95% (tutte le feature categorie/ricette/traduzioni PASS). Note: nomi ingredienti extra ancora in IT (rifinitura minore); FAB Radio/Parla si sovrappongono su mobile (app-wide). Le nuove ricette sono PRO-gated come le altre (sbloccabili con prova 7gg o login).
### Resta solo FASE D: avatar VIDEO animato in Home + "Chiedi al Maestro" (userò il 2° video quando caricato) e tatuaggio sull'avatar Michele.

## v71 (2026-06) — Foto nuove ricette + AUDIT spec
- **16 foto prodotto** generate (Gemini) e collegate alle nuove ricette (image_url = CDN); miniatura in lista abilitata per foto http + panettoni (onError nasconde rotte). Aumenta la presenza foto (punto 8).
- Verificato: salvataggio Piano Settimanale (PUT /api/weekly-plan) funziona (200, persiste). Il bug "Continua" segnalato NON è il weekly save → serve reproduzione schermata.
### AUDIT spec 8 punti — stato:
1. Nav&Indietro: dedup ✅, Indietro passo-passo ✅, Mio-vs-Utente ⚠️parziale(tab già separati).
2. Home&Avatar: link Home ⚠️da verificare, Chiedi-al-Maestro avatar animato ❌TODO(Fase D, serve video).
3. Laboratorio: didascalia ✅, no-PianoSettimanale-in-macchine ✅, Bluetooth facoltativo ✅, prova 7gg ✅, step Conclusione ✅; bug "Continua" ❓da riprodurre; foto reale in Lab ⚠️(c'è nel footer); scorciatoia 'Solo Laboratorio' PWA ❌TODO; procedimenti più guidati ⚠️parziale.
4. Impara da Casa più dinamica ❌TODO.
5. Ricette: Focacce/Taralli spostati ✅, Snack+6 ✅, +10 panini ✅, procedimenti estesi ✅.
6. Traduzioni: Miglioratore ✅, titoli leggibili ✅, INT/Frischhefe ✅, mappatura farine ✅.
7. Diagnosi fotocamera ✅.
8. Foto prodotti ✅, footer immagine ✅, WhatsApp solo Corsi/Assistenza/Ordini ✅.

## v72 (2026-06) — Ingresso diretto + fix legale footer
- **Punto 4**: rimossa la schermata onboarding con le domande (che macchine hai, ecc.). App.js ora semina un profilo di default completo (tutte le macchine) e NON mostra più il modale: ingresso diretto in Home. Rimossa anche l'intro forzata (showIntro=false). Verificato via screenshot: Home carica diretta.
- **Punto 1 (legale)**: footer senza sede ("Panificazione artigianale & passione", niente "Stoccarda").
### Ancora aperti: audit GDPR completo; rimozione completa riferimenti "Stoccarda" (sezione Stoccarda.jsx + Home/News/content/translations) DA DECIDERE con l'utente; avatar con orecchino+tatuaggi+occhi scuri (rigenerazione); video animato + card intro "Mohamedd" in Home (serve video); Impara da Casa prova 7gg + prezzo inferiore; bug "Continua" (serve screenshot); scorciatoia PWA "Solo Laboratorio".

## v73 (2026-06) — Fix tasto "Completa" + chiarimento Stoccarda
- **Bug "Completa" (era "Completo")**: nell'ultimo passo del wizard Il Tuo Laboratorio il tasto era uno <span> inerte (nessuna azione) → ora è un <button> reale: mostra conferma "Programmazione completata!", chiude lo strumento e riporta al passo 1. (Il piano giorno/settimana si salva nel proprio strumento, che funziona.)
- **Stoccarda**: rimosso solo dalla tagline di sede (footer già fatto). La città non è usata come tagline visibile altrove; la sezione News regionale "Stoccarda" resta come contenuto (voluto dall'utente).

## v74 (2026-06) — Prezzi Il Tuo Laboratorio allineati (punto 3, parziale)
- PaywallGate: etichette abbonamento aggiornate a €29,99/mese e €249/anno (badge -31%). ATTENZIONE: l'importo REALE addebitato è definito su Stripe (lookup_key pro_monthly/pro_yearly) → l'owner deve impostare 29,99/249 su Stripe perché l'addebito combaci.
### Monetizzazione RESTANTE (sessione dedicata): tier separato "Impara da Casa" €12,99/mese-€99/anno (prova 7gg, più economico); Le Mie Ricette acquisto singolo (base €4,99, Panettoni €29,99, sblocco totale €149); Corsi €79–199 da admin. Richiede rework PaywallGate multi-tier + prezzi Stripe + admin.

## v111 (2026-06) — Collaudo trilingue IT/DE/EN + fix EN residui
- Dizionario t() già completo (670 chiavi × IT/DE/EN). Community/Home/Beginners/Enciclopedia già trilingui.
- Aggiunto EN mancante nei content-array (prima cadevano su IT): GuidaMetodi.jsx SECTIONS (4, usati anche in Enciclopedia metodi), BackwardScheduler.jsx PHASES (6) + toast, RecipeList.jsx GLOSSARY (9) + PAN_MY + PAN_GLAZE, data/suppliers.js SUPPLIERS + SUPPLIER_CATEGORIES. Render corretti a 3 rami (de/en/it).
- sections/LegalPage.jsx: aggiunto blocco EN completo (Legal notice & Privacy).
- lib/loc.js: aggiunte chiavi ingredienti (albicocche, gocce cioccolato fondente, miglioratore naturale pro, lievito madre solido, glutine, aceto di mele, lino dorato, lievito di birra, malto d'orzo, kokosfett/grasso di cocco) in DE+EN. lib/shopping.js ora applica ingLoc ai nomi extra della Lista Spesa.
- sections/Ricette.jsx: back-btn ora tradotto (Ricette/Rezepte/Recipes); UtilBtn 3 quicklink resi verticali (testo a capo, nessun troncamento/overflow su mobile 390px). RecipeList recipe-base-filters: rimosso -mx-1 (niente overflow orizzontale del documento).
- Seed data: 6 panettoni (Albicocca e Cioccolato, Cocco e Cioccolato, Limoncello, Mela e Cannella, Tiramisù, Zafferano) avevano procedure_de = testo italiano → tradotti in tedesco reale in DB + mikilab_seed_data.json; SEED_VERSION bump a v54. Verificato via API admin (procedure_de = "SAUERTEIGFÜHRUNG...").
- Deferito (LOW): AdminPanel EN (solo-admin, IT/DE completo), RadioFornaio STATIONS (nomi propri emittenti, EN→stazioni IT).
- Testato: testing_agent iteration_65 (funzionalità 100%) + iteration_66 (6 aree EN + 2 layout mobile CONFERMATI risolti, frontend 92%). REDEPLOY per mikilab.de.

## v112 (2026-06) — Archivio Piani di Lavoro + traduzione ricette personali no-PRO + badge admin
- **Archivio piani** (nuovo, per-utente, collection `saved_plans`): GET/POST `/api/plans/archive` (?kind=weekly|capo), DELETE `/api/plans/archive/{id}`. Salva più piani con NOME + data. api.js: `plansArchiveApi`.
- **Componente riusabile** `components/PlanArchive.jsx` (kind weekly|capo): "I Miei Piani Salvati" con salva-con-nome, lista, "Ripeti questo piano", elimina.
- **Piano Settimanale** (WeeklyPlan.jsx): archivio kind=weekly; "Usa questo piano" clona gli item nell'editor (nuovi id) per modificarli e risalvare. Estratto `cleanItems()`.
- **Piano AI "Capo"** (PianoProduzioneAI.jsx): archivio kind=capo (plan_text + state); "Usa per settimana prossima" → `repeatArchivedPlan()` ricarica impostazioni/prodotti/testo per ritoccare e rigenerare.
- **Traduzione ricette personali senza PRO**: `translate_recipe` ora `Depends(current_user)` (prima require_pro). MikiLab resta admin-only; personali = solo proprietario, nessun PRO. Verificato: fornaio (non-PRO) POST translate → 200.
- **Accesso ricette personali per tutti i loggati**: Ricette.jsx ora ha selettore [ricette-tab-mikilab | ricette-tab-personal]. Prima "Le Mie Ricette" era solo dentro il Lab PRO-gated → i non-PRO non potevano tradurle. Ora accessibili + traducibili dal tab Ricette.
- **Badge admin traduzioni** (AdminPanel.jsx): sezione `admin-translation-coverage` "Traduzioni ricette IT/DE/EN" → "Tutte le N verificate ✓" oppure lista ricette incomplete con badge DE/EN.
- **Fix**: warning React "<option> child of <span>" nel select capo-preferment (option 'licoli' resa testo singolo). Cartelle ricette si auto-espandono con ricerca/filtro attivo.
- Piano AI 7 giorni: nessuna modifica (scelta utente: segue i prodotti inseriti).
- Testato: testing_agent iteration_67 (4/5, trovato blocco accesso personali) + iteration_68 (4/4 PASS dopo fix). REDEPLOY per mikilab.de.

## v113 (2026-06) — Archivio piani: rinomina + salvataggio rapido
- Rinomina inline dei piani salvati: PATCH /api/plans/archive/{id} (owner-only, nome vuoto→400); PlanArchive.jsx pulsante matita → input → conferma. api.js plansArchiveApi.rename.
- "Salva nell'archivio con un tocco" dal banner del Piano AI generato: bottone [capo-quick-archive] → PlanArchive.openSave() (forwardRef + useImperativeHandle) apre l'input nome e scorre in vista.
- Testato: testing_agent iteration_69 (rinomina weekly 100%, persistenza + edge case Enter/vuoto/Escape). Backend rinomina verificato via curl.
- IN ATTESA DATI UTENTE: Etichette UE (valori nutrizionali reali per ricetta) — richiesti a Michele.

## v114 (2026-06) — Etichette UE (dichiarazione nutrizionale)
- Modello ricetta: nuovo campo `label` (dict) su Recipe/Create/Update. Persistenza verificata via curl (PUT/GET).
- Editor (RecipeDialog.jsx, admin per mikilab / proprietario per personali): sezione recipe-label-section con valori per 100 g (kcal, grassi, saturi, carboidrati, zuccheri, fibre, proteine, sale), peso netto, allergeni (virgola) e lista ingredienti. Energia kJ calcolata automaticamente da kcal (×4,184).
- Visualizzazione (EULabel.jsx): tabella "Dichiarazione nutrizionale per 100 g" nel dettaglio ricetta, gated da hasLabelData (niente riquadro vuoto). Etichetta stampabile conforme (printEULabel) con allergeni in grassetto e peso netto. Trilingue IT/DE/EN.
- Vale per tutte le ricette (scelta utente). Michele inserisce i valori reali (nessun valore precompilato/inventato).
- Testato: testing_agent iteration_70 (editor→salva→visualizza→stampa→traduzioni→gating→cleanup 100%). Nessun dato di test residuo.

## v115 (2026-06) — QR sull'etichetta UE + deep-link prodotto
- printEULabel (EULabel.jsx) ora async: genera un QR (libreria qrcode) verso {origin}/?prodotto={id} e lo stampa in fondo all'etichetta con caption "Scheda prodotto".
- Deep-link ?prodotto={id}: App.js apre il tab Ricette; RecipeList (useEffect su recipes) apre automaticamente la scheda del prodotto e pulisce l'URL. Funziona da ANONIMO (cliente che scansiona) e da loggato.
- Testato: testing_agent iteration_71 (deep-link anonimo+admin, 95 ricette caricate, QR img nel print, cleanup — 100%).

## v116 (2026-06) — Revisione ampia FASE 1 (branding/UX quick wins)
- Slogan professionale in Home ([home-slogan]) + key brand_slogan (it/de/en): "Il Mondo Artigianale per Panettieri, Pasticcieri e Pizzaioli".
- Terminologia professionale: home_plan_title/result → "Pianifica la tua Produzione / Piano di produzione" (it/de/en) + step Beginners allineato.
- WhatsApp MIRATO: rimosso <WhatsAppFab/> flottante globale (App.js); WhatsApp ora solo in Corsi (Academy: wa-help-corsi; rimosso wa-help-assistenza) e Laboratorio (Maestro: nuovo context 'laboratorio'). OrdersManager (ordini) resta come strumento del Lab.
- Ricette: categorie CHIUSE di default per TUTTE le collezioni (RecipeList open=false; ricerca → auto-apri).
- Enciclopedia rimossa da 'Impara' (LearnHub: 2 tab impara+news); resta solo in Ricette.
- Testato: testing_agent iteration_72 (100% criteri Fase 1, 0 errori console).
- Design blueprint salvato in /app/design_guidelines.json (design_agent).
- ROADMAP fasi successive: F2 branding visivo (logo ML header+footer, sfondi filigrana grano/farina, palette, footer con foto Michele più grande); F3 News→Home + CRUD admin news, Marketplace→Community; F4 Academy a livelli Base/Intermedio/Avanzato, archivio 'I Miei Dati Salvati' (Piani+Ricette+PDF), Mohammadreza guida interattiva (tooltip testuali); F5 audit traduzioni IT/DE/EN a tappeto.
- NOTA: voce TTS NON riattivata (l'utente ha confermato: solo fumetti scritti).

## v117 (2026-06) — Revisione ampia FASE 2 (branding visivo)
- Header (Header.jsx): logo ML + wordmark "MikiLab" + sottotitolo, anello dorato (#D4AF37). Visibile su tutte le pagine.
- Sfondo tematico: generata filigrana elegante grano/farina/impastatrice (public/wheat-bg.webp), applicata ripetuta e soffusa (opacity 0.55 light / 0.05 dark) dietro OGNI sezione via layout globale in App.js; card con sfondo solido garantiscono leggibilità.
- Slogan banner in Home (home-slogan) già da F1.
- Footer (App.js, condiviso da tutte le sezioni): card branded verde salvia con logo ML + FOTO REALE di Michele più grande (80px, michele-real-lab.jpg con fallback), slogan trilingue e © mikilab.de.
- Palette: accenti dorati aggiunti (ring/dettagli) coerenti col blueprint /app/design_guidelines.json; base salvia/crema mantenuta per non destabilizzare.
- Verifica: smoke screenshot Home (header+sfondo+slogan OK, contenuti leggibili), compilazione pulita.
- NOTA: cambi puramente visivi a basso rischio; logiche invariate.

## v118 (2026-06) — Revisione ampia FASE 3 (News in Home + Marketplace in Community)
- News CURATE DA ADMIN: backend /api/news-items (GET pubblico, POST/PUT/DELETE admin, collection news_items, trilingue). api.js newsItemsApi.
- HomeNews.jsx: feed 'News · Arte Bianca' in Home con editor admin inline (aggiungi/modifica/elimina, tag, link, titoli+testi IT/DE/EN). Non-admin/anonimi vedono in sola lettura; blocco nascosto se nessuna news e non admin.
- Impara (LearnHub): rimossa scheda News (spostata in Home) — ora rende direttamente Beginners.
- Marketplace Usato: rimosso dalla griglia strumenti del Laboratorio; inserito in Community ([community-marketplace]).
- Testato: testing_agent iteration_73 (100% criteri Fase 3: CRUD news admin, vista read-only non-admin/anonimo, traduzioni, Impara senza News, Marketplace in Community e fuori dal Lab). Nessun dato di test residuo.

## v119 (2026-06) — Revisione ampia FASE 4 (guida Mohammadreza + Archivio dati)
- Mohammadreza guida interattiva: lib/toolGuide.js (descrizioni IT/DE/EN per ~23 strumenti). In PianoProduzioneAI le tile strumento ora sono <div> con icona info (tool-info-<id>): al tocco compare il fumetto tool-guide-bubble con avatar Mohammadreza + spiegazione + Apri/Chiudi (tool-guide-open/close). La tile intera apre lo strumento come prima.
- Archivio "I Miei Dati Salvati" (sections/MyData.jsx): 4 tab — Piani (plansArchiveApi, badge IA/Settimanale + Apri), Ricette (personali), Documenti&PDF (nota: PDF on-demand dagli strumenti), Chat AI (segnaposto "in arrivo"). Accessibile dal quicklink INIZIA [capo-quicklink-mydata] del Laboratorio.
- Testato: testing_agent iteration_74 (100% flussi Fase 4, traduzioni, regressione strumenti, 0 errori console).
- DEFERITO: Academy a livelli Base/Intermedio/Avanzato — bloccata dai contenuti reali (video/prezzi) che l'utente deve fornire.

## v120 (2026-06) — Revisione ampia FASE 5 (audit traduzioni IT/DE/EN)
- Verifica statica: dizionario i18n completo (671 chiavi ×3), tutte le tri() a 3 rami, nessuna stringa hardcoded nei nuovi file. Unico dict senza EN: RadioFornaio STATIONS (nomi propri emittenti — intenzionale).
- Runtime audit (testing_agent iteration_75, 97%) → 2 fix:
  - FIX HIGH: de.brand_subtitle era in italiano → "Micheles Backstube".
  - FIX MEDIUM: post di benvenuto Community solo in IT → aggiunte versioni DE/EN (WELCOME_POST_DE/EN), _post_public ora espone text_de/text_en, Community.jsx localizza il testo del post.
- Esito: nessun testo italiano residuo in EN/DE nelle funzioni delle Fasi 1-5.
- Revisione ampia (10 punti) completata tranne Academy a livelli (in attesa di video/prezzi reali dall'utente).

## v121 (2026-06) — Accenti bandiera + post Community Michele
- Accenti bandiera con colori VERI (index.css .it-de-ribbon): Italia verde(#009246)-bianco-rosso(#CE2B37) + Germania nero-rosso(#DD0000)-oro/giallo(#FFCE00). Ora presenti giallo e rosso vero. Ribbon usato in header/slogan/footer/varie sezioni.
- Post Community ufficiale di Michele: foto braccio/tatuaggio (/michele-real-lab.jpg) + buongiorno trilingue (text/text_de/text_en), autore "Michele — MikiLab", pinned. Inserito in community_posts; render localizzato da Community.jsx.
- Verifica: screenshot Home (ribbon colori bandiera visibili, branding OK); post confermato via API (image_url + text_de/text_en).

## 2026-06 — Filtro per Reparto GLOBALE (Panificazione / Pizzeria / Pasticceria)
- Nuovo `frontend/src/lib/dept.js`: stato reparto GLOBALE (localStorage `mikilab_capo_dept` + evento `mikilab-dept-changed`), hook `useDept()`, `recipeDept()` (deduzione automatica da categoria/nome), `matchDept()`, `deptLabel()/deptIcon()`.
- `App.js`: il selettore `capo-dept-switch` ora usa lo stato globale (dispatch evento) → tutte le sezioni si aggiornano live.
- Ricette (`RecipeList.jsx` + `Ricette.jsx`): prop `deptScoped`, filtro per reparto con deduzione automatica + banner "Reparto attivo" e pulsante "Mostra tutti i reparti".
- Override manuale reparto nel form ricetta (`RecipeDialog.jsx`, `recipe-department-select`) → salvato in `Recipe.department`.
- Magazzino (`MagazzinoManager.jsx`): campo reparto per materia (`magazzino-dept`) + filtro (le materie senza reparto sono condivise/sempre visibili) + banner. COMPONENTE ORA LOCALIZZATO (it/de/en/es/fr/fa).
- Piano (`CategoryRecipePicker.jsx`): il picker ricette è filtrato per reparto attivo (fallback all'elenco completo se vuoto).
- Backend `server.py`: campo `department` su `Recipe/RecipeCreate/RecipeUpdate` e `WarehouseItem`.
- Testing: backend 4/4 PASS; frontend verificato (conteggi panificazione 71 / pizzeria 35 / pasticceria 42 / tutti 148, banner, reattività, magazzino filtro+localizzazione).
- Nota: falso positivo del tester (ricetta "non visibile") dovuto alla ricerca del nome IT con UI in EN (i nomi ricetta sono auto-tradotti) — comportamento corretto.

## 2026-06 — Vetrine promo coerenti col reparto
- `SaporeDelGiorno.jsx`: ogni "sapore del giorno" ha un reparto; la rotazione giornaliera pesca solo dal reparto attivo (es. Pizzeria → Pizza in teglia). Con "Tutti" resta l'elenco completo.
- `NovitaColorate.jsx`: la vetrina "Novità dal MikiLab" filtra le ricette colorate per reparto attivo (deduzione automatica) e si nasconde se il reparto non ha novità.
- Verificato via screenshot: in Pizzeria → Sapore del Giorno = "Pan Pizza", vetrina Novità nascosta.

## 2026-06 — Interfaccia Ricette MikiLab consolidata
- Header UNICO con foto nuova (generata, cyber-bakery lab, salvata in public/mikilab-ricette-hero.jpg): unite "Ricette del MikiLab" + "Scopri MikiLab" in una sola sezione; rimosso il testo lungo "Ciao Capo".
- Tutti i bottoni portati in ALTO in una barra compatta 3×2: Sapori di Casa, Ricette Custodite, Vetrina Focacce, Enciclopedia del Pane, Tabelle & Farine, Backup Ricette.
- Rimossi come richiesto: la barra "salta a" (SectionJumpBar) e il banner "In vetrina · Pane di Matera IGP".
- `RecipeList` ora accetta `hideHero` (l'hero interno è nascosto: c'è un solo header). Verificato via screenshot mobile.

## 2026-06 — PIN unico globale + Report Bluetooth reale + Sfondi tematici per sezione
- PIN Produzione UNICO (backend): `GET/PUT/POST /api/production-pin*`, salvato hashato (bcrypt), PUT solo admin (require_admin), verify con rate-limit 8/5min, fallback default 1985 se non impostato. PinSetup (Capo) ora scrive sul server; PinLock verifica sul server con fallback offline (cache locale). PinSetup localizzato. Testato via curl (set solo admin, verify aggiornato, 401 senza auth).
- BakemixHardware: report consumi ora da DATI BLUETOOTH REALI (GATT battery_level 0x2A19 + environmental temperature 0x2A6E). Stima energetica dalla temperatura reale; fallback chiaro se nessun dispositivo collegato. Multilingua.
- Sfondi immersivi per sezione (App.js): bg-capo.jpg (sala comandi), bg-mohamed.jpg (laboratorio operativo, con tint colore per postazione via evento mikilab-role-changed), bg-bakemix.jpg (olografico). Immagini generate, salvate in public/, opacità 30% + overlay scuro per leggibilità.
- Direttiva ruoli fissi + flusso "Zero Click" registrata in DIRETTIVA_GLOBALE.md (implementazione flusso ancora DA FARE).

## 2026-06 — Flusso "Zero Click" + logo sulla maglia
- Zero Click (App.js): utente di RITORNO (admin gate già sbloccato + intro già vista, oppure sessione fatta) salta la schermata "Inizia" e va dritto all'hub. Flag `mikilab_seen_intro` impostato su Start e al login. Prima volta invariata (admin gate → intro una sola volta).
- AvatarHub: aggiunto pulsante "Accedi/Sign in" in alto a destra (solo se non loggato) → apre il login. Props onLogin/isLoggedIn da App.js.
- Avatar MikiLab (Capo): sostituito il testo "MikiLab" sulla maglia con l'emblema circolare del logo (editing immagine, volto/posa/tatuaggio/sfondo invariati). Backup originale in /app/memory/avatar_miki_original_backup.jpg.

## 2026-06 — Ricette Offline (IndexedDB) + logo giacca Mohamed
- Nuovo `lib/idbCache.js`: KV store su IndexedDB (regge decine di MB, a differenza di localStorage ~5MB).
- `recipesApi.list` ora scrive l'archivio su IndexedDB a ogni load e legge da IndexedDB in offline (fallback: localStorage). Warm-up in App.js: quando online pre-carica mikilab (+personal se loggato) anche senza aprire la lista.
- Verificato: dopo il warm-up IndexedDB contiene 149 ricette mikilab (archivio 100% offline).
- Avatar Mohamed: emblema logo MikiLab applicato sulla giacca (backup in /app/memory/avatar_mohamed_original_backup.jpg).

## 2026-06 — Migrazione Offline totale + sfondi per postazione + badge Offline + logo BakemixAI
- IndexedDB esteso (api.js): warehouseApi.list (magazzino), planApi.get (piano produzione), weeklyApi.get (piano settimanale), floorPlanApi.get (coda di lavoro Floor di Mohamed) ora scrivono su IDB online e leggono da IDB in offline.
- Sfondi per postazione Mohamed: bg-st-forno/impasto/banco/laugen.jpg. App.js mappa il ruolo attivo → immagine di postazione (Impastatore→impasto, Fornaio/Sfornate/Abbattitore→forno, Laugen→laugen, resto→banco); default bg-mohamed.jpg. Verificato: Fornaio → /bg-st-forno.jpg.
- Badge "Offline · archivio locale" (App.js): indicatore fisso quando navigator è offline (multilingua). Verificato.
- Avatar BakemixAI (robot): emblema logo MikiLab sul petto (backup in /app/memory/avatar_bigmix_original_backup.jpg). Ora tutti e 3 gli avatar hanno il logo.

## 2026-06 — Analisi codice + Audit sicurezza (patch applicate)
- Code review: nessun difetto CRITICAL/HIGH. Segnalati LOW (import inutilizzati, ConfermaImpastata/PeripheralSetup importati ma non montati — pre-esistente, non toccato).
- Security audit (FIX applicati e verificati via curl):
  - SEC-001 (HIGH): scritture magazzino (/lab/warehouse POST, DELETE, consume) ora richiedono require_admin (prima anonime). Verificato: 401 anon, 200 admin.
  - SEC-002 (MED): PUT /production-plan e PUT/DELETE /lab/floor-plan ora richiedono require_admin (prima bastava un utente qualsiasi). Verificato 401 anon.
  - GET magazzino e GET floor-plan restano pubblici (gli operai leggono la coda senza login).
  - SEC-003 (default PIN 1985) e SEC-004 (XFF spoofing): note, rischio accettato (default PIN voluto dall'utente).
- UI/UX mobile: layout pulito, contrasto ok, nessun overflow reale (solo blur decorativo).

## 2026-06 — Ricette ripristinate + Foto→Ordine del Capo
- Ricettario: default reparto riportato a "Tutti" (lib/dept.js) + migrazione una-tantum (mikilab_dept_reset_v2) → tutte le 148/149 ricette tornano visibili nel Master con le loro foto. Nessuna ricetta era persa nel DB (0 hidden, tutte con immagine locale in /public/recipes, nomi coerenti es. r_taralli.jpg, pan_*.jpg, pz_*.jpg).
- Foto→Ordine (item 3): nuovo endpoint POST /api/lab/scan-order (LLM vision) → estrae righe {name,quantity} da una foto di comanda + testo riassuntivo. Frontend OrdiniExtra: pulsante "📸 Foto comanda" (upload/fotocamera) che compila il campo ordini. Verificato E2E: comanda scritta a mano → "20 baguette, 10 ciabatte, 5 focacce, 2 panettoni".

## 2026-06 — Floor offline + Sync al ritorno + Cuffia vocale (Next Action Items 1,2,4)
- #1 Piano offline nel Floor: MamoAssistant legge la coda del Capo da IndexedDB/cache anche offline + chip "Dati locali/LOCAL DATA" (data-testid mamo-offline-chip) quando navigator è offline. Verificato.
- #2 Sincronizza al ritorno (App.js): all'evento 'online' ricarica e riallinea recipes/warehouse/plan/weekly/floor-plan dal server (re-cache IndexedDB), notifica le viste (mikilab-floor-plan-updated, mikilab-warehouse-changed) e mostra toast "Riconnesso · dati aggiornati".
- #4 Cuffia vocale Mohamed (MamoAssistant): l'ascolto continuo a mani libere si AUTO-ATTIVA appena arriva il piano (dopo l'unico tap sul mic richiesto dal browser per il permesso audio). Comandi vocali: avanti/indietro/ripeti/stop. Verificato E2E (toast "Voice guide on", step letto, role filtering Fornaio→cottura).

## 2026-06 — Hardening sicurezza PIN + anti-spoofing rate-limit
- SEC-003 (PIN default 1985):
  - PIN Produzione (Floor): RIMOSSO il fallback hardcoded "1985". Se il Capo non ha impostato il PIN, il Floor resta CHIUSO (verify → ok:false, not_set:true). Lato client rimosso il seeding di "1985" (pinLock: getPin ora "" se non impostato; migrazione che purga il vecchio 1985 in cache; offline si accetta solo l'ultimo PIN valido).
  - Gate ADMIN del sito: spostato lato SERVER (hashato, rate-limited). Nessun default nel sorgente client. Se non impostato in DB → fallback al segreto ADMIN_GATE_PIN in backend/.env. Il Capo può cambiarlo dal pannello (PinSetup, endpoint PUT /api/admin-gate admin-only). AdminGate.jsx ora verifica via POST /api/admin-gate/verify con fallback offline sull'ultimo PIN valido.
  - Nuovi endpoint: GET /api/admin-gate/status, PUT /api/admin-gate (require_admin), POST /api/admin-gate/verify (rate-limit 8/5min). Verificati via curl + gate E2E (1985 sblocca; set 2468 override; 401 senza auth).
- SEC-004 (X-Forwarded-For spoofing): _client_ip ora prende l'hop da DESTRA aggiunto dal proxy fidato (TRUSTED_PROXY_HOPS, default 1), ignorando i valori a sinistra falsificabili dal client; fallback a request.client.host. Env aggiunte: ADMIN_GATE_PIN, TRUSTED_PROXY_HOPS.

## 2026-06 — Postazioni dinamiche di Mohamed (dai reparti del Capo)
- MohamedFloor ora carica /api/lab/departments e UNISCE alla lista base i reparti custom + le postazioni (feature) create dal Capo nell'Elite Engine (base extras + custom.features + extras[custom]). Offline resta la lista base. Verificato E2E: reparto "Gelateria Test" con postazione "Mantecatore" compare nella scelta postazione di Mohamed.
- Nota: gli sfondi per postazione custom ricadono sullo sfondo "banco" (mappa keyword in App.js); i reparti base mantengono forno/impasto/laugen.

## 2026-06 — Traduzione completa MikiLabEliteEngine (blocchi 1–9)
- Aggiunto helper `tr = mkTri(appLang)` nel componente.
- TUTTE le frasi vocali (speakVoice) tradotte in it/de/en/es/fr/fa: saluto, stato lab, consegne, ceste (crea/aggiungi/vuota/consegna/ricorrente), diagnostica + step, allarmi forno, ferie, radio, lingua, spostamento reparto, guide tecniche (LM/diagnostica), calcolo acqua, "Ricetta {nome}".
- Testi VISIBILI tradotti: badge "Attivo", pulsante allarme forno, "Rispetto al mercato:" + descrizione, placeholder "ID"/"Nome reparto", titoli azioni (Elimina/Elimina reparto/Svuota), "Panetteria"/"Pasticceria", firma autori.
- Lasciati invariati i nomi propri/brand: "Pizzeria", "MikiLab Industrial Systems".
- Verificato: 0 speakVoice italiani residui, compila senza errori.

## v49 (2026-09) — Fase 2 Metaverso 3D + Emergenze + Ruoli/Task + Moduli v14 + Persona/UI
### Digital Twin 3D (Fase 2) — RISCRITTO in three.js VANILLA
- `@react-three/fiber` v8 è INCOMPATIBILE con React 19 (errore 'ReactCurrentOwner'). Soluzione definitiva: DigitalTwin.jsx reso con three.js imperativo (WebGLRenderer/Scene/BoxGeometry/Raycaster), niente R3F/drei. Macchinari reagiscono alla telemetria per-macchina.
- Backend `GET /api/bako/telemetry` (admin): stress/level/temp_c/load_pct per macchinario + Smart Torque Protection (coppia -5% su assorbimento anomalo: impasto/forni) + reazione agli SOS.

### Emergenze SOS (Blocco A)
- `POST /api/bako/sos` (operatore, no admin), `GET /api/bako/sos` (admin, con frase TTS 'spoken'), `POST /api/bako/sos/{id}/ack`, `POST /api/bako/maintenance-guide` (Claude, guida contestuale). 
- UI: SosButton.jsx (hold-to-send 1.2s), EmergencyCenter.jsx (Neural Load Radar: bagliore rosso pulsante + annuncio TTS BakoMix + guida rapida + ack). Panel `panel-emergency` in cima alla plancia Master.

### Briefing per ruolo + Task per postazione (Blocco B + richiesta ruoli/orari)
- `GET /api/bako/briefing/floor?role=&lang=` (no admin): filtra lotti/allarmi per LINEA dell'operatore. `GET /api/delegation/tasks?role=` filtra per linea/assignee/step + broadcast (helper `_role_to_line`).
- UI: FloorRoleBriefing.jsx (voce breve mohamed al cambio ruolo), TeamTasks refetch su eventi `mikilab-role-changed`/`mikilab-tasks-updated`, badge orario `team-task-start`. Aggiornamento ISTANTANEO al cambio postazione.

### Moduli avanzati v14
- AI Computer Vision QC uscita forni: `POST /api/bako/oven-qc` (Claude vision) → verdict/score/difetti. UI OvenQC.jsx (camera+upload).
- E-commerce B2B: `GET/POST/DELETE /api/bako/b2b/orders`, `POST /api/bako/b2b/to-plan` (prefill AutoPlan via evento `mikilab-prefill-orders`), `GET /api/bako/b2b/forecast` (meteo Open-Meteo + festività). UI B2BOrders.jsx.
- Carbon Footprint: `GET/PUT /api/bako/carbon/config`, `POST /api/bako/carbon/compute` → CO2/quintale + cost_per_kg_eur + slot ottimale. UI CarbonFootprint.jsx.
- Recipe & Thermal Master Flow + Live Editor: `POST /api/bako/thermal-flow` (flusso sequenziale, RPM per mixer, rampe termiche, INTERLOCK se farina>22°C con acqua gelata, Plateau Recovery Countdown). UI RecipeThermalFlow.jsx (slider live + sblocco sequenziale + countdown platea).

### Persona BakoMix + UI
- `/master/govern`: persona a doppia indole — adulatore/ossequioso col Capo ('Mio Supremo Capo'), inflessibile/militaresco con la produzione, incolpa macchinari/fisica mai il Capo. Contratto JSON invariato.
- UI: header con "MIKILAB PRO" grande e orizzontale (no truncate); ComplianceBeacon RIMOSSO dall'header; CompliancePanel spostata nel footer legale (modale Impressum & Datenschutz). Nessun testo verticale, 0 overflow a 390px.
- Test: iteration_200 (Emergency/Briefing/Twin/Task) e iteration_201 (moduli v14) — backend 100% / frontend 100%, 0 bug.

### BACKLOG richiesto (site-wide perfection) — DA PIANIFICARE
- Silo & Ingredient Management (calo peso silos + micro-ordini + compensazione umidità farina).
- Proofing Chamber: curve multi-stadio adattive sincronizzate alla disponibilità forni.
- Packaging/Slicing: sincronizzazione velocità affettatrici con curva termica del pane.
- Predictive Maintenance & Fleet AGV (rilevamento acustico + routing autonomo carrelli).
- Lean Dashboard: risposta <50ms + layout adattivo per ruolo (fornaio/capo linea/manutentore).

## v50 (2026-09) — Site-wide perfection: Silos, Celle Adattive, Flotta AGV, Layout per Ruolo
- **Silos**: GET /api/bako/silos (autonomia oraria da calo peso, compensazione umidità farina → correzione % acqua), PUT /bako/silos/{id}, POST /bako/silos/microorder (rabbocco auto sotto soglia). UI SiloManager.jsx.
- **Celle Adattive**: GET /api/bako/proofing?free_ovens= — curva multi-stadio che ACCELERA (forni liberi) o FRENA (forni occupati); forni liberi derivati dalla telemetria. UI AdaptiveProofing.jsx.
- **Flotta AGV**: GET /api/bako/agv — routing autonomo tra postazioni + rilevamento acustico preventivo (dB anomali → manutenzione, annuncio TTS). UI AgvFleet.jsx.
- **Layout per Ruolo**: RoleLayout.jsx — chip Tutto/Fornaio/Capo linea/Manutentore che mostrano/nascondono ISTANTANEAMENTE i pannelli pertinenti (toggle display via data-testid), scelta persistita.
- Test iteration_202: backend 100% / frontend 100%, 0 bug. Backlog v14 site-wide COMPLETATO.

## v51 (2026-09) — Storico SOS, AGV nel 3D, Micro-ordini email, Sync Celle→Piano
- **Storico SOS**: ack calcola response_seconds; GET /api/bako/sos/history con classifica di reattività per turno (mattina/pomeriggio/notte). UI: sezione sos-history + leaderboard in EmergencyCenter.
- **AGV nel 3D**: DigitalTwin renderizza i carrelli come sfere che si muovono lungo le rotte (STATION_POS), sfera ROSSA pulsante se in manutenzione (allarme acustico). Poll /bako/agv 5s.
- **Micro-ordini via email**: bako_silo_microorder invia email Resend (SILO_SUPPLIER_EMAIL o email admin) con la lista rifornimenti quando i silos vanno sotto soglia.
- **Sync Celle→Piano**: proofing restituisce oven_ready_at; POST /api/bako/proofing/sync-plan riprogramma gli orari start dei lotti produzione. UI: proof-oven-ready + proof-sync-plan.
- Test iteration_203: backend 100% / frontend 100%, 0 bug.

## v52 (2026-09) — Email Fornitore, Battito Impianto Unico, Timeline di Turno
- **Email Fornitore**: GET/PUT /api/bako/silo-supplier (email in app_meta); i micro-ordini silos vengono inviati all'email fornitore configurata (fallback env/admin). UI: campo silo-supplier-input in SiloManager.
- **Battito Impianto Unico**: GET /api/bako/heartbeat unisce telemetria+SOS+AGV+forni liberi in un solo polling. Context PlantHeartbeatProvider (4s) alimenta DigitalTwin, EmergencyCenter e AgvFleet (rimossi i polling individuali).
- **Timeline di Turno**: GET /api/bako/timeline (lotti+infornate+SOS ordinati). UI TimelineTurno.jsx scorrevole. Panel-timeline + registrato in RoleLayout.
- FIX: render loop in EmergencyCenter (tri nelle deps useEffect → rimosso). iteration_205 frontend 100%.

## v53 (2026-09) — BACKLOG CHIUSO: Packaging, Avatar parlanti, Regole voce, Sfida turni
- **Packaging/Affettatrici**: GET /api/bako/packaging — velocità affettatrici sincronizzata alla curva di raffreddamento (attendi>55°C / rallenta / nominale<=35°C) + countdown. UI PackagingSync.jsx (gauge).
- **Avatar parlanti (lip-sync)**: ShiftBriefing mostra una bocca/waveform animata sull'avatar Cyber-Trio attivo mentre parla.
- **Regole voce**: MamoAssistant legge agli operatori comandi BREVI (floorShort, ~14 parole/1 frase); il Capo mantiene la conversazione libera (govern).
- **Sfida tra turni**: GET /api/bako/sos/challenge — classifica reattività SOS SETTIMANALE con badge (🥇 più reattivo, 🔥 più interventi). UI: sezione sos-challenge in EmergencyCenter.
- Test iteration_206: backend 100% (8/8) / frontend 100%, 0 bug. TUTTO il backlog v14 completato.

## v54 (2026-09) — Timeline "ADESSO" live + BakoMix Suggerimenti predittivi
- **Timeline ADESSO**: linea rossa verticale che avanza in tempo reale (aggiorna ogni 20s) e appare solo se l'ora corrente ricade nella finestra eventi; l'evento successivo è evidenziato (dot più grande + glow). timeline-now.
- **BakoMix Suggerimenti**: GET /api/bako/suggestions — "cervello" unico che incrocia forni/celle/SOS/silos/AGV/B2B e propone 1-3 azioni concrete con navigazione al pannello + annuncio vocale. UI BakoSuggestions.jsx in cima alla plancia (sempre visibile, fuori dal filtro Layout per Ruolo).
- Verificato via curl (prioritizzazione severità) + screenshot. Nessun errore runtime.

## v55 (2026-09) — Lingue/vocali + Suggerimenti eseguibili in 1 clic
- LINGUE: verificato che BakoMix (govern LLM) risponde in tutte le 8 lingue mantenendo la persona (DE 'mein Erhabener Chef', FR 'Mon Illustre Commandant'). langname LLM (govern/maintenance-guide/oven-qc) esteso a 8 lingue. Frasi vocali "di sistema" dei nuovi endpoint: fallback a INGLESE (non più italiano) per lingue non-IT. TTS BCP-47: aggiunti ar-SA e tr-TR.
- BakoMix Suggerimenti ESEGUIBILI in 1 clic: Silos→micro-ordini e B2B→sync piano eseguiti direttamente dalla card (pulsante Esegui), con messaggi localizzati; le altre navigano al pannello. Verificato via screenshot (esecuzione silos + UI/voce DE).

## v56 (2026-09) — Report di turno + MikiScore + anteprima vocale lingue
- **Report di fine turno**: GET /api/bako/shift-report — BakoMix riassume a voce il turno (lotti, SOS+tempo medio, silos) con persona; UI ShiftReport.jsx (panel-shiftreport).
- **MikiScore** giornaliero: punteggio unico impianto (reattività + zero sprechi + puntualità) con valutazione A/B/C/D e anello grafico.
- **Anteprima vocale lingue**: nel LangSelector ogni lingua pronta ha un'icona altoparlante che riproduce un saluto di BakoMix in quella lingua (8 lingue). 
- **Suggerimenti eseguibili in 1 clic** (v55): Silos→micro-ordini, B2B→sync piano dalla card.
- Tutto verificato via curl + screenshot. Nessun errore runtime.

## v57 (2026-09) — Storico MikiScore + Auto-pilota BakoMix
- **Storico MikiScore**: shift-report salva lo score giornaliero; GET /api/bako/mikiscore/history (7gg). UI: mini-grafico a barre settimanale in ShiftReport (appare dal 2° giorno).
- **Auto-pilota**: GET/PUT /api/bako/autopilot; con ON BakoMix esegue in autonomia i micro-ordini silos e lo riporta in autopilot_actions (verificato). UI: toggle autopilot-toggle in BakoSuggestions.
- Verificato via curl + screenshot. Nessun errore runtime.

## v58 (2026-06) — Nuovo logo industriale (rebranding globale)
- Rigenerato logo (monogramma ML a forma di spiga/pane, acciaio+ciano su fondo scuro #0E1620, no viola) via Gemini Nano Banana.
- Tutti gli asset pubblici rigenerati dal nuovo logo: logo.png, logo-emblem.png, logo-256.png, icon-192/512, favicon-32, favicon.ico, apple-touch-icon, og-image.jpg (1200x630).
- Nessun file sorgente toccato: tutti i riferimenti puntano già a questi asset (Header con testo "MikiLab" mantenuto, Admin Gate, avatar, PWA manifest, Open Graph/Twitter, texture 3D).
- Bump service worker cache mikilab-v19 -> v20 per forzare fetch asset freschi.
- Verificato con screenshot desktop (1920) + mobile (390, nessun overflow): logo corretto in Admin Gate e Header.

## v59 (2026-06) — Splash animata + Modalità Tablet/Kiosk
- **Splash d'avvio** (`SplashScreen.jsx`): nuovo logo ML che pulsa con luce ciano + anelli radar espandenti, "MIKILAB PRO / Holographic Command OS". Mostrata 1 volta per sessione (sul gate e nell'app). Fix StrictMode: il flag di sessione ora si imposta alla chiusura, non al mount, altrimenti il remount nascondeva subito la splash.
- **Modalità Tablet/Kiosk** (`KioskMode.jsx`): chip "Tablet" nell'header → modale con 2 step (Installa PWA + Avvia Kiosk). Kiosk = fullscreen + Wake Lock (schermo sempre acceso) + orientation lock best-effort. Uscita anti-tocco: badge in basso a sx, tieni premuto ~1.2s (barra di avanzamento ciano). Flag persistente `mikilab_kiosk`; dopo reload mostra "Riprendi Kiosk" (il fullscreen richiede un tocco). Overlay via `createPortal` su document.body per evitare che il `backdrop-blur` dell'header ingabbiasse i `fixed`.
- Verificato con screenshot desktop+mobile: splash presente, modale centrato, Start Kiosk imposta il flag e mostra il badge, long-press esce e ripristina la chip. Nessun overflow orizzontale.

## v60 (2026-06) — Chiusura: Plancia del Capo, Piani, Ricette, Back-guard, Restyling
- Rinomina produzione Mohamed -> **MohaLab** ovunque (persona, roster, hero, trio, voci).
- **BakoMix Deus** (legame amicizia + orchestrazione impossibile + oracolo esterno sbloccabile) + riconoscimento **Nuovi Macchinari**.
- Montati in console: **Piano Settimanale** (WeeklyPlan), **Piano AI** (PianoProduzioneAI), **Piano a Ritroso** (BackwardScheduler). Ricettario professionale (RecipeDialog: %panificatore, fasi, costing, etichetta UE) raggiungibile via panel-ricette.
- **Plancia del Capo** (CapoDeck): cattura multimodale voce/foto/email/testo -> BakoMix genera -> coda di produzione (endpoint /api/bako/deus/capture + production-queue + done/clear). Più compila, più la produzione ha da fare.
- **Back-guard PWA**: il tasto Indietro non esce più dall'app (sentinella history + evento mikilab-go-back che srotola lo stato del laboratorio). Fix del difetto segnalato dal laboratorio.
- **Restyling grafico globale** (design_guidelines.json): .holo-panel/.holo-canvas elevati (glass, hairline, scanline, grid drift, hover-lift, scrollbar/selezione ciano). RIMOSSO viola vietato rgba(157,78,221). Logo colorato per stampe su carta bianca. Splash animata + Kiosk/PIN.
- Pulite 3 righe seed rotte del piano settimanale ("Recipe no longer available").
- Verificato E2E test 207/208/209/210 tutti 100%, zero blocker.

## v61 (2026-06) — Mondi 3D immersivi dietro gli avatar (Vanilla three.js)
- Nuovo componente AvatarWorld3D.jsx (Vanilla three.js 0.160, NIENTE react-three-fiber): mondo 3D tematico con transizione ad assemblaggio olografico (scale/rise + easing), rotazione dolce, griglia olografica, fog.
- MIKI = Ufficio Tecnico/Lab Ricette (sacchi farina, tavolo da disegno, spighe di grano, schermi olografici dati con barre).
- MohaLab = Zona Produzione Calda (forni industriali con porte incandescenti pulsanti/effetto calore, impastatrice con pala rotante, scaffale con pane).
- BakoMix = Assistente (core icosaedro wireframe, onde sonore/anelli pulsanti, particelle fluttuanti, moduli input vocale trasparenti; intensità aumenta quando parla).
- Integrato in ShiftBriefing: i 3 avatar sono ora cliccabili -> overlay full-screen col mondo 3D e l'avatar sempre al centro (anello glow, nome, ruolo, intro). Pulsante Indietro.
- Verificato a schermo: mondo MIKI e MohaLab renderizzano correttamente (canvas + overlay). Compila pulito.

## v62 (2026-06) — Reparti indipendenti + assegnazione Capo + OCR foto + coda reparto
- **Visione Foto (OCR)** nella Plancia: mode foto invia base64 -> BakoMix (Claude vision) trascrive la pagina del ricettario e genera ricetta+task. Verificato con immagine reale (calcola %panificatore, resa).
- **Coda di produzione su MohaLab** (FloorQueue): task del Capo visibili in reparto con spunta + lettura vocale.
- **Report Fine Turno** vocale: pulsante nella Plancia (/bako/shift-report -> spoken).
- **Onde BakoMix reattive al parlato**: speaking legato a onStart/onEnded del TTS.
- **REPARTI INDIPENDENTI**: Panificio, Pasticceria, Pizzeria, Laugen. Catalogo auto-generato di macchine (incl. Linea Arion, vasca soda Laugen, sfogliatrice, ecc.), silos, celle, magazzino per reparto. Endpoint /api/depts, /api/depts/assign, /api/depts/assignment.
- **Assegnazione Capo -> MohaLab** (DeptAssign, panel-dept-assign): il Capo sceglie reparto + mansione del giorno.
- **Interfaccia dinamica produzione** (DeptFocus): l'operaio vede SOLO il reparto assegnato oggi, con le sue macchine e moduli vocali.
- Verificato: catalog(4 reparti), assign(Pasticceria), assignment(oggi) OK; pannello renderizza senza ErrorBoundary; compila pulito.
