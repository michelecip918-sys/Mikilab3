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
- COMANDO 5B: K (pulizia) + L (traduzioni) + M (controlli tecnici) + N (chiusura).

## Credenziali test
Vedi `memory/test_credentials.md`.

## Regole fisse
- Dati ricette nel DB non si toccano; nuovi contenuti in collezioni nuove / `recipe_extras` / localStorage.
- Niente segreti nel codice; `_archivio_non_pubblico/` non va committato.
- Niente operazioni distruttive all'avvio; niente deploy automatico.
