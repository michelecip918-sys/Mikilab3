# MikiLab — Guida semplice per il titolare 🍞

Niente parole difficili. Ecco come funziona MikiLab in pratica.

## ✅ Il modo normale (consigliato) — ZERO installazioni, zero server
MikiLab è già online e pronto. **Non devi installare né comprare nessun server.**

Come lo usano tu e i tuoi:
1. **Tu (il Capo)** entri, vai nell'Area Sovrana e tocchi **"Genera invito d'accesso"**: il link viene copiato da solo.
2. **Mandi quel link** all'operaio su WhatsApp/SMS.
3. L'operaio **apre il link sul SUO telefono**, sceglie una password e crea il suo accesso. Fine.
4. La volta dopo entra con le sue credenziali. Sul telefono può fare **"Aggiungi a Home"** e MikiLab diventa un'app a tutto schermo, come le altre.

Vantaggi:
- **Ogni operaio usa il proprio telefono.** Non compri tablet, non installi nulla su nessun telefono.
- **Nessun database, nessun server, nessun tecnico.**
- **Solo su invito**: entra solo chi ha il tuo link. Nessuno lo trova su Google.
- I PIN e gli inviti li decidi tu, quando vuoi, dall'app.

👉 Per il 99% delle panetterie **questo è tutto quello che serve.** Puoi fermarti qui.

---

## 🏭 Solo se vuoi il "bunker" senza internet (opzionale)
Serve solo se vuoi che tutto giri **senza internet**, chiuso dentro la tua panetteria.
In questo caso **non lo fai tu**: lo fa una volta un tecnico/informatico (anche il ragazzo
che ti sistema il PC o il router). Tu gli dai questo foglio, lui in un pomeriggio:

1. Mette MikiLab su un piccolo computer sempre acceso in laboratorio.
2. Lo collega al tuo Wi-Fi.
3. Ti dà un indirizzo (es. `mikilab.local`) da aprire sui telefoni.

Da lì in poi per te è identico al modo normale: mandi l'invito, gli operai aprono sul loro
telefono col PIN. La parte tecnica è tutta descritta nel foglio per il tecnico più sotto.

> In arrivo: uno **script "1 clic"** che farà questa installazione da solo, senza tecnico.

---

## 🔧 Foglio per il tecnico (ignora questa parte se non è per te)
- Node.js 18+, Yarn, Python 3.11+, MongoDB in locale; HTTPS obbligatorio per la PWA (usa Caddy `tls internal`).
- `cp frontend/.env.production.example frontend/.env.production` → `REACT_APP_BACKEND_URL=https://<IP-server>`
- `cp backend/.env.example backend/.env` → `MONGO_URL=mongodb://localhost:27017`, `DB_NAME=mikilab`, `ADMIN_GATE_PIN=...`
- `cd frontend && yarn install && yarn build`
- Backend: `cd backend && pip install -r requirements.txt && uvicorn server:app --host 0.0.0.0 --port 8001`
- Servi `frontend/build` in HTTPS. Caddyfile:
```
mikilab.local {
  tls internal
  handle /api/* { reverse_proxy localhost:8001 }
  handle { root * /percorso/frontend/build; try_files {path} /index.html; file_server }
}
```
- Le funzioni AI (BakoMix/Vision/Clima/Delega) richiedono internet; il resto (PIN, turni, task, floor, ricette in cache) funziona offline.
