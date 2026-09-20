# MikiLab — Il Manuale di Sitor

Ricettario pubblico gratuito di pane, pizza e dolci, guidato passo-passo da **Sitor** (avatar IA di Michele).
Interfaccia in IT/DE/EN, nessun account, nessuna registrazione.

## Come si avvia (sviluppo)

```bash
sudo supervisorctl restart backend    # FastAPI su :8001 (uvicorn, hot reload)
sudo supervisorctl restart frontend   # React (CRACO) su :3000 (hot reload)
```

Il frontend chiama il backend tramite `REACT_APP_BACKEND_URL` (tutte le rotte API hanno prefisso `/api`).
Build di produzione frontend: `cd frontend && yarn build`.

## Variabili d'ambiente (MAI i valori nel codice o nei documenti)

**backend/.env**
- `MONGO_URL` — connessione MongoDB
- `DB_NAME` — nome del database
- `EMERGENT_LLM_KEY` — chiave universale per l'IA (chat, corsi, vision)
- `ADMIN_INITIAL_PASSWORD` — password iniziale dell'unico account admin (Michele)
- `GATE_JWT_SECRET` (o `INBOUND_SHARED_SECRET`) — segreto del gate; se manca il backend non parte
- `SITOR_USER_DAILY`, `SITOR_GLOBAL_DAILY`, `COURSE_GEN_DAILY_CAP` — limiti giornalieri IA
- `RESEND_API_KEY`, `SENDER_EMAIL` — (opzionali) reset password admin via email

**frontend/.env**
- `REACT_APP_BACKEND_URL` — URL pubblico del backend

## Funzioni accendibili/spegnibili (senza ridistribuire)

Da **admin → pagina Costi** (`?admin=1` → menu account → Costi), oppure `PUT /api/admin/costs`:
- **Livello di risparmio** `savings_level` 0-3: 0 = normale; 1 = chat ridotta; 2 = niente nuove generazioni pubbliche; 3 = nessuna IA pubblica (chat e "Cosa faccio" riposano).
- **Feature flags**: `FEATURE_PHOTO_DIAG` (analisi foto "Com'è venuto?"), `FEATURE_PLAN` ("Cosa faccio?"), `FEATURE_LIVE` (dirette), `FEATURE_VOICE_CHAT` (voce in chat). OFF = il pulsante sparisce dall'interfaccia e il backend blocca le chiamate.

**Dove si vedono i costi**: admin → Costi → tabella 30 giorni (contatori anonimi in `usage_daily`).

## Backup

- **Database**: dump MongoDB (le ricette vivono SOLO nel DB; il seed `backend/mikilab_seed_data.json` si applica solo a DB vuoto o in upsert controllato).
- **Ricette personali**: gli utenti esportano CSV/PDF dalla sezione Ricette.

## Struttura

- `frontend/src/` — app pubblica (Home, ricette, corso, chat Sitor, strumenti)
- `backend/` — FastAPI (`server.py` + moduli). Accesso anonimo: solo allowlist in `server.py` (DEFAULT DENY)
- `_archivio_non_pubblico/` — materiale storico fuori dalla vista pubblica (non commitare)
- `LEGAL_DATA_MAP.md` — mappa dei flussi dati per l'informativa privacy
