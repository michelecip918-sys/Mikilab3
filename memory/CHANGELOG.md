# CHANGELOG (continua da PRD.md)

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
