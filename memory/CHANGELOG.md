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
