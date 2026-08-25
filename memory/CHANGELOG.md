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
