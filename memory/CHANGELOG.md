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
