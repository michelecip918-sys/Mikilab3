# PRD — Mikilab / Il Maestro del Pane

## Problem statement (original, IT)
App personale di panificazione artigianale. Sezioni: Mikilab (ricette modificabili), Maestro (Aggiungi ricetta, Pianifica produzione senza freezer, Calcola gradi, Gestione forno senza esempi), Il Maestro sa tutto (AI "chiedi e ti sarà dato" + enciclopedia/notizie + video YouTube + zona Stoccarda).

## Architecture
- Frontend: React (CRACO), Tailwind, framer-motion, sonner, lucide-react. Mobile-first, bottom nav a 3 voci.
- Backend: FastAPI + MongoDB (motor). AI chat streaming (SSE) con emergentintegrations, Claude Sonnet 4.6, EMERGENT_LLM_KEY.
- No authentication (single-user personal app).

## Sections implemented (2026-08-17)
- **Mikilab**: CRUD ricette (collection "mikilab"), 3 esempi pre-caricati modificabili/eliminabili, idratazione auto-calcolata.
- **Maestro** hub:
  - Aggiungi ricetta (collection "personal", nessun esempio, inserimento manuale).
  - Pianifica la produzione (timeline a ritroso dall'infornata, NESSUN freezer).
  - Calcola gradi (T_acqua = 4×T_desiderata − (farina+ambiente+attrito+lievito)).
  - Gestione forno (profili forno CRUD, 3 fasi con timer sonoro, nessun esempio).
- **Il Maestro sa tutto**: chat AI streaming; tab Enciclopedia/Notizie, Video YouTube, Annunci Stoccarda.

## Status
- Backend 15/15 pytest pass. Frontend flows verified. No blocking issues.
- Fixed: PUT recipe honours cleared fields; oven load error handling; dialog a11y; phase input width.

## Backlog / Next
- P1: Persistenza piano di produzione + notifiche timer in background.
- P2: Duplica ricetta; export/stampa ricetta; scala dosi per peso teglia.
- P2: Video YouTube dinamici (ricerca) e annunci Stoccarda gestibili.
