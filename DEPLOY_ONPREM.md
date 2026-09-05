# MikiLab — Export & installazione On-Prem (modalità bunker)

Guida per far girare MikiLab **dentro la rete del laboratorio**, su un mini-PC/server locale,
e installarlo come PWA sui tablet di reparto. Le funzioni AI (BakoMix, Vision, Clima, Delega
vocale, Batch Phoenix) richiedono internet; il resto (PIN, turni, task, floor, ricette/magazzino
in cache, coda di sincronizzazione) funziona anche offline.

## 0. Esporta il codice
Usa **"Save to GitHub"** dalla barra della chat (o il download del codice) per ottenere il progetto.

## 1. Requisiti sul server locale
- Node.js 18+ e **Yarn**
- Python 3.11+
- MongoDB Community (in locale)
- Un certificato HTTPS (anche self-signed): **obbligatorio** per PWA/Service Worker su LAN

## 2. Configura gli indirizzi locali
Copia gli esempi e adatta l'IP del server:
```
cp frontend/.env.production.example frontend/.env.production
cp backend/.env.example backend/.env
```
- `frontend/.env.production` → `REACT_APP_BACKEND_URL=https://<IP-DEL-SERVER>`  (es. https://192.168.1.50)
- `backend/.env` → `MONGO_URL=mongodb://localhost:27017`, `DB_NAME=mikilab`
- Imposta `ADMIN_GATE_PIN` e le chiavi (EMERGENT_LLM_KEY / OPENAI / ELEVENLABS) se vuoi le funzioni AI.

## 3. Build del frontend (bundle statico offline)
```
cd frontend && yarn install && yarn build
```
→ crea `frontend/build/` con tutti gli asset + Service Worker (`sw.js`) + manifest.

## 4. Avvia i servizi in locale
```
# Backend (API + AI quando c'è rete)
cd backend && pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8001

# Frontend statico servito in HTTPS sulla LAN (necessario per la PWA)
npx serve -s frontend/build -l 443   # oppure Nginx/Caddy con certificato
```
> Consiglio: usa **Caddy** per HTTPS automatico su LAN, con reverse proxy `/api` → :8001.

Esempio Caddyfile:
```
mikilab.local {
  tls internal
  handle /api/* { reverse_proxy localhost:8001 }
  handle { root * /percorso/frontend/build; try_files {path} /index.html; file_server }
}
```

## 5. Installa sui tablet
Dai tablet, sulla **stessa Wi-Fi**, apri `https://<IP-DEL-SERVER>` (o `https://mikilab.local`):
- Android/Chrome: menu ⋮ → **Installa app**
- iPad/Safari: Condividi → **Aggiungi a Home**

## 6. Verifica offline (bunker)
1. Apri e usa l'app una volta (con rete) per popolare la cache.
2. Stacca internet dal server (lascia solo la Wi-Fi interna).
3. Sui tablet: PIN, turni, task di squadra, floor di Mohamed, ricette/magazzino in cache restano
   attivi; step e check-in fatti offline si **sincronizzano** al ritorno della connessione.

## Note
- Vero "AI 100% offline" richiederebbe un modello locale on-premise (progetto separato).
- Nessun dato lascia la LAN se non abiliti le chiavi AI (che chiamano i modelli esterni).
