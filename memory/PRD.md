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

## Credenziali test
Vedi `memory/test_credentials.md`.

## Regole fisse
- Dati ricette nel DB non si toccano; nuovi contenuti in collezioni nuove / `recipe_extras` / localStorage.
- Niente segreti nel codice; `_archivio_non_pubblico/` non va committato.
- Niente operazioni distruttive all'avvio; niente deploy automatico.
