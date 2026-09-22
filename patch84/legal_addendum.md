
## 13. V84 — strumenti locali (segreto del 16 ottobre, banco delle prove, il mio forno)
- **Il forno si accende** (`LancioSegreto.jsx`): conto alla rovescia calcolato nel browser. `localStorage`: `mikilab_forno_trovato` (chi ha trovato il segreto), `mikilab_forno_banner_chiuso`. Il promemoria è un file `.ics` creato in locale (Blob). Condivisione via `navigator.share` o clipboard. Nessuna chiamata al server, nessun contatore.
- **Il banco delle prove** (`BancoProve.jsx`): nessun dato salvato né inviato; "Chiedi a Sitor" precompila la chat con il testo scelto (stesso flusso della chat pubblica).
- **Il mio forno** (`MioForno.jsx`): foto (ridotte nel browser), voto e note salvati SOLO in IndexedDB (`mikilab-offline`, chiave `mioforno`), mai inviati. "Esporta" crea un `.json` locale. "Chiedi a Sitor" invia alla chat solo nome ricetta, voto e nota scritti dall'utente: MAI la foto.
- Nessun cookie nuovo, nessuna statistica, nessun servizio esterno.
