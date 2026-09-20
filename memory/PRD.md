# PRD — MikiLab · Il Manuale di Sitor (scheda corrente)

> Storico completo spostato in `_archivio_non_pubblico/docs/PRD.md` (COMANDO 5B, STADIO K5). Questo file tiene solo lo stato attuale.

## Cos'è
Ricettario pubblico gratuito (pane, pizza, dolci) guidato dall'avatar IA **Sitor**. IT/DE/EN. Nessun account pubblico; admin solo per Michele (`?admin=1`).

## Stato attuale (settembre 2026)
- **132 ricette visibili** (150 totali; panettoni e bozze nascosti via `recipe_extras.hidden_public`).
- Sicurezza: `GateMiddleware` DEFAULT DENY in `server.py`; pubbliche solo le GET (`recipes, recipe-extras, techniques, equipment-guide, site-settings [lista bianca], auth/me, health, sitemap, learning-path, site-pages, time, live, features, experiments, flour-types, bread-calendar, palato-tips`) e le WRITE (`sitor/chat, sitor/plan, sitor/photo, live/ping, done-ping, experiments/vote, auth login/logout/forgot/reset`).
- `GET /api/site-settings` = lista bianca (`tiktok_handle, hashtag, site_url, folder_covers`); nessun numero di telefono esposto.
- IA con contatore + limite + interruttore: `savings_level` 0-3 e `FEATURE_PHOTO_DIAG/PLAN/LIVE/VOICE_CHAT` (admin → Costi).
- Frontend pubblico: Home con chip (verde, miglioratore, cosa-faccio, live, mensola, cucina, piano, tecniche, calendario, farine, test del mese, dal mondo, pane di ieri, **crea il tuo lievito**, attrezzi), Course Player V2 (timer assoluti, mani libere, .ics), SitorChat con limiti, Palato (radar in localStorage), CreaLievito (percorso a giorni, tutto sul dispositivo).
- COMANDO 5A: Q (privacy/correzioni) + Y (Crea il tuo lievito) + N — FATTI.
- COMANDO 5B: K (pulizia: 173 file frontend non raggiunti archiviati, 43 pacchetti npm rimossi, 12 dev-tools backend rimossi da requirements, 99 media orfani spostati, segreti scansionati) + L (traduzioni: 748 tri pulite, fix Sauerteig, report ricette) + M (build verde, header sicurezza, fix TDZ CoursePlayer, contrasto AA, audit) + N (0 leak su 553 rotte, 132 ricette, LEGAL_DATA_MAP) — FATTI. - COMANDO 7: T0 (0 segreti nel codice tracciato; un PIN legacy oscurato in triTranslations.json; archivio gitignored/non tracciato) + T1 (Impressum/Datenschutz reali IT/DE/EN) + T2 (avviso microfono in chat, mani libere, radio) + T3 (LEGAL_DATA_MAP: voce via server Google/Apple) + T4 (newsletter: email DIVERSA dall'admin, non cancellata) + T5 (0 leak su 554 rotte). Splash rebranded. COMANDO 8: DB pulito (141 collezioni storiche cancellate dopo backup /root/mikilab_backup_storici_2026-09-20/, 2 ricette extra rimosse → 148 seed, users solo owner, contatori di prova azzerati, verified tutti a false, 0 leak). Backup da eliminare solo su decisione di Michele. COMANDO 10: pane(40) tested; focacce poi tornate bozza in COMANDO FINALE Z2 (metodo Michele in arrivo). COMANDO FINALE: Z1 testi lievito generici (panettone solo per grandi lievitati), Z2 avviso 'Ricetta in revisione' sulle 32 focacce, Z3 0 corsi da pulire, Z4 anomalie elencate (54 ricette), Z5 TUTTI i controlli passati, Z6 PRONTO PER PUBBLICARE (Michele preme Publish). ATTENZIONE: mikilab.de = deploy VECCHIO con DB diverso (149 ricette): dopo la pubblicazione va RIESEGUITA la pulizia dati del COMANDO 8 sul DB di produzione. Password admin cambiata da Michele (test_credentials.md aggiornato: vecchia non più valida).

## Verifica produzione — 20 settembre 2026
- Login admin su `https://mikilab.de` verificato end-to-end con il valore effettivo di `ADMIN_RESET_PASSWORD`: API `POST /api/auth/login` 200, `/api/auth/me` 200 con ruolo `admin`, rotte admin di controllo 200, UI `?admin=1` superata fino ad `account-btn`.
- Nessuna password, hash o token è stato scritto nei report. Il database pubblico di produzione risponde ancora con 149 ricette contro 132 in anteprima: la pulizia dati del COMANDO 8 resta da rieseguire sul DB di produzione dopo il prossimo publish.
- Priorità sicurezza: cambiare subito la password da admin → “Cambia password”, poi rimuovere `ADMIN_RESET_PASSWORD` dai Secrets e fare redeploy.
- Regola fissa backend (20/09): gli anonimi non vedono mai `menu_category="panettoni"` in ricette, extras e corsi; unica eccezione pubblica `Panettone Artigianale MikiLab — Verde Canapa`. Admin invariato. Richiede redeploy per la produzione.

## MESSAGGIO UNICO FINALE (20 settembre 2026) — Stadi 1-5
- **STADIO 1**: 16 panettoni riscritti sulla base MikiLab 60/40 (flour 500, water 210 o ridotta per Amarena 177/Caffè-Nocciola 195/Marron 192/Pistacchio 195, LM 110, sale 9, bake 170°C×45', bulk 12h, proof 7h, indiretto+lievito madre; sospensioni riscalate a 300 g; extra % fisse Zucchero30/Tuorlo29/Burro35/Miele4/Arancia3/Vaniglia0,6). Nuovo procedimento IT/DE/EN. Verde Canapa NON toccato tranne rimozione blocco "NOTE DEL FORNAIO". Frasi da corso (bagnetto, rinfreschi ravvicinati, 1:1:0,5, pH 4,1, NOTE DEL FORNAIO, riprendi corda) = 0 occorrenze nel seed. Regola fissa che nascondeva i panettoni RIMOSSA: tutti i 17 panettoni visibili (resta solo hidden_public). SEED_VERSION → `2026-09-v71-panettoni6040`.
- **STADIO 2**: su ogni scheda ricetta "Stampa/PDF" (scheda dedicata con logo MikiLab via @media print) e "Condividi" (immagine canvas 1080×1350 con logo, nome, tempo/difficoltà, link mikilab.de; navigator.share o download; senza dosi/procedimento). Copyright su scheda e footer. LEGAL_DATA_MAP aggiornato (nessun dato inviato).
- **STADIO 3**: stati ricette idempotenti allo startup (fill-missing) + update esplicito anteprima: pane/panini/focacce = "Provata da Michele" (tested); le 3 poolish inizialmente "Controllata" sono POI passate a "Provata" (v. sezione "Conferma poolish"); 16 panettoni = reviewed + riquadro giallo 60/40. Correzioni testi: Focaccia Barese (poolish→lievito madre), Carezza/Treccia (biga→poolish 100/100/0,5g, 12-16h), Panino alle Carote (passo 2 poolish). IT/DE/EN.
- **STADIO 4**: strumento admin "Pulizia dati vecchi" (rotte `/api/admin/data-cleanup/{scan,backup,execute}`, solo admin → 404 anonimo). Backup gzip obbligatorio nella sessione + parola CANCELLA per cancellare. Non esegue nulla all'avvio.
- **STADIO 5**: controlli passati — 0 frasi da corso; 17 panettoni visibili da anonimo; rotte private → 404; site-settings solo whitelist; /impressum e /datenschutz 200; ?admin=1 solo email+password; stampa con logo OK. Non è possibile pubblicare da qui: **PRONTO PER PUBBLICARE (Michele preme Publish)**; dopo il publish la produzione riceve seed v71 e stati via startup idempotente.
- Nota Dal mondo: le 4 ricette "Kochstück" (Farina Cotta, Pan Latte in Cassetta, Pane Morbido ai Cereali, Panini al Latte) sono ricette MikiLab e restano nel ricettario; non esistono voci "cinesi/dal mondo" separate da nascondere.

## Credenziali test
Vedi `memory/test_credentials.md`.

## Regole fisse
- Dati ricette nel DB non si toccano; nuovi contenuti in collezioni nuove / `recipe_extras` / localStorage.
- Niente segreti nel codice; `_archivio_non_pubblico/` non va committato.
- Niente operazioni distruttive all'avvio; niente deploy automatico.


## Conferma poolish (20 settembre 2026)
- Michele ha provato **Carezza Dolce**, **Treccia del Sole** e **Panino alle Carote**: status forzato a "tested" ("Provata da Michele") in anteprima (DB + API pubblica + badge UI verificati) e allo startup in modo idempotente (corregge anche la produzione se ha ancora "Controllata").
- Note poolish nel seed aggiornate IT/DE/EN → "dosi provate e confermate da Michele". SEED_VERSION → `2026-09-v72-poolish-provati`.
- RESTA DA FARE (solo Michele, fuori dall'anteprima): 1) premere **Publish** sulla dashboard Emergent; 2) su mikilab.de entrare in admin (`?admin=1`) → **Pulizia dati vecchi** → scaricare il backup → digitare `CANCELLA` (la produzione gira ancora col deploy vecchio: 149 ricette, badge "Bozza").

## Patch v73 applicata (20 settembre 2026)
- Applicato `mikilab_v73_patch.zip` di Michele in un solo passaggio (`sh patch/applica.sh`), senza modifiche: 91 ricette riviste (32 focacce col metodo Michele, 17 incomplete completate, 12 pani colorati/cornetti con sale+prefermento, 16 panettoni con grammi per fase — dosi invariate), corsi passo-passo generati dal procedimento senza IA (`course_builder.py`), chat Sitor su claude-sonnet-4-6 (veloce: Haiku), diagnosi foto attiva di default (3/giorno), allergeni lupino+glutine nel miglioratore, bugfix data_cleanup (`done_counters`), frontend: Converti-in-farro, sostituzioni, "Come leggere questa ricetta", pagina Miglioratore, riquadro Poolish; rimossi ApprenticeCard.jsx e recipeExport.js.
- SEED_VERSION = `2026-09-v73-ricette-complete`; migrazione una-tantum `app_meta/v73_drafts` ESEGUITA in anteprima (61 ricette riscritte → "Bozza di Sitor", corsi in cache rigenerati). Le 3 poolish restano "Provata da Michele" (fix v72 preservato nel patch).
- Build frontend OK (solo warning eslint preesistente). Script di verifica (inalterato, UA iniettato a runtime) su anteprima: **TUTTO OK** (11/11: 148 ricette, 5 ricette complete, panettone con grammi, corsi IT/DE/EN da 7 fasi, stato bozza corretto).

## Verifica produzione post-publish v73 (20 settembre 2026)
- Deploy v73 su mikilab.de CONFERMATO: script di verifica inalterato → **TUTTO OK** (11/11). Le 3 poolish risultano "tested" anche in produzione (forzatura startup v72 applicata).
- Produzione mostra ancora 149 ricette (vs 148 anteprima): resta la pulizia del DB di produzione → Michele: admin → "Pulizia dati vecchi" → "Pulisci tutto (backup + cancella)". Poi provare le 61 bozze in cucina.
- PROSSIMI PASSI DI MICHELE: 1) un solo click su **Publish**; 2) dopo il deploy eseguire/ripetere `python3 patch/verifica_dopo_deploy.py https://mikilab.de`; 3) su mikilab.de: admin → "Pulizia dati vecchi" → "Pulisci tutto (backup + cancella)"; 4) provare le bozze in cucina e segnarle "Provata".