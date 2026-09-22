# MikiLab — Il manuale del Capo
*Come è fatto il sito, cosa c'è dentro, come si manda avanti da soli. Aggiornato al 22 settembre 2026 (v95).*

## 1. Che cos'è
**mikilab.de — Il Manuale di Sitor**: ricettario pubblico e gratuito di Michele Signorella, con Sitor come guida IA. Tre lingue (IT/DE/EN). Nessuna registrazione per chi visita. Un solo admin (tu). Niente pubblicità, niente tracciamento, niente vendite.

**Regole che valgono per tutto**: le dosi delle ricette non si toccano mai (gli attrezzi le leggono e basta); Sitor è sempre indicato come IA; niente server nuovi; niente dati inviati dagli attrezzi (tutto resta nel telefono di chi usa il sito); nessuna promessa sulla salute.

## 2. Com'è costruito (in due righe)
- **Frontend** (quello che si vede): React, cartella `frontend/`. Le pagine si aprono in `App.js` (`route === "..."`); la lista degli Strumenti è in `components/Strumenti.jsx`; la scheda ricetta è in `components/RecipeList.jsx`.
- **Backend** (server): Python, cartella `backend/`. Serve le ricette, i corsi, la chat di Sitor (IA a pagamento), i limiti giornalieri, la pagina Costi. Sitor "pensa" con i crediti Emergent (`EMERGENT_LLM_KEY`).
- **Dati**: database MongoDB su Emergent (ricette, corsi, impostazioni). Tutto il resto (preferiti, lievito, note, attrezzi) vive nel telefono di chi usa il sito (localStorage).

## 3. La mappa del sito
**Home**: descrizione, La tua bottega (nome facoltativo, ultima ricetta, lievito, pane della settimana), Sitor dice, Sorprendimi, Sto imparando / So già panificare.
**Ricettario**: 167 ricette per categoria, ricerca, preferiti, Sapori di casa (Sud Italia), Dal mondo. Sopra la ricerca: **L'Officina di Sitor** (card). In ogni scheda: Etichetta MikiLab, schema disegnato, Casa o Laboratorio, corso passo per passo con Sitor, **Gli attrezzi di Sitor**, Ascolta, Condividi, Stampa, Mani libere.
**Strumenti**: tutto il resto (vedi elenco al punto 4).
**Basi e Tecniche**: farine, enciclopedia, tecniche disegnate con il polpo.
**Pagine speciali**: /miglionico (dedica), /volantino, /laboratorio, /primopane, /sommelier, /ospiti, /carta, /ricetta/<id>/<nome> (ogni ricetta ha il suo indirizzo), `?festa=1` (festa del 16 ottobre), 8 tocchi sul polpo (conto alla rovescia).

## 4. Tutti gli attrezzi, uno per riga
**Nell'Officina (Ricettario)**: Cosa posso fare adesso? · Metti a confronto · L'occhio di Sitor (foto crosta/fetta letta nel telefono) · Pronto soccorso dell'impasto (18 sintomi) · Disegna il taglio · Il tuo primo pane · Stasera ho ospiti · La carta dei pani · Il sommelier del pane · Il laboratorio.
**Nella scheda ricetta**: Prima che succeda · Le parole della ricetta · Acqua giusta · Lievitazione a casa tua · Lo stampo giusto · Righello della ciotola · Pesa tutto in una ciotola · Quanto ti costa · Il pane in agenda · La cartolina del pane · Disegna il taglio (pane/panini) · Assaggialo da sommelier.
**Il laboratorio** (per chi panifica di mestiere): Foglio di produzione · Programmazione a freddo · Conversioni (diretto/biga/poolish/lievito madre, TA, calo, costo) · Carico del forno · Cartellini del banco.
**Per chi impara**: Il tuo primo pane in 7 giorni (con attestato alla fine) · Il primo giro con Sitor · Pane senza bilancia · Crea il tuo lievito · Curare il lievito madre · Il mio lievito madre (con data di nascita e QR "il lievito viaggia").
**In cucina**: Sveglia del panettiere · Il pane parla (microfono) · La mappa del tuo forno · Il mio forno · Il banco delle prove · La mia mensola · La mia cucina · Piano settimana · Pane di ieri · Sopra la focaccia · Panico da cena · Calendario del pane · Test del mese · Modo notte · Modo grande · Mani libere.
**Per far girare il sito**: Il pane del mio paese (15 regioni + dedica) · Il volantino da frigo · Le medaglie (18) · Festa del 16 ottobre · Cartoline e bigliettini con "contiene".

## 5. Sitor e i crediti: come si comanda
- **Chat**: 15 messaggi al giorno per persona, 500 in tutto, risposte uguali riusate 24 ore. Prima risponde **la bottega** (senza IA): parole del mestiere, sintomi, numeri della ricetta, dove trovare le cose. L'IA parte solo per le domande vere o se uno tocca "Chiedi a Sitor IA".
- **Voce**: parla il telefono, gratis. La voce del server (a pagamento) è spenta: si accende dalla pagina **Costi** (bottone VOICE_SERVER). Consiglio: lasciala spenta.
- **Pagina Costi** (solo admin): tabella delle chiamate degli ultimi 30 giorni, livello di risparmio 0-3 (3 = chat IA spenta, il sito funziona lo stesso), interruttori: PHOTO_DIAG (foto all'IA, 3 al giorno a persona), PLAN (Cosa faccio?), LIVE, VOICE_CHAT, VOICE_SERVER.
- **Corsi e tecniche**: generati una volta dall'IA e salvati; le versioni nuove le chiedi solo tu dall'admin (`?ai=1`).
- Se i crediti finiscono: la chat risponde "torna domani", tutto il resto continua a funzionare.

## 6. Come si entra da admin
Il link con `?admin=1` salvato nei preferiti, poi la tua password (cambiata da te). Da admin: modifica/traduci ricette, nascondi ricette, Costi, Diario prove, Pulizia dati, Impressum, Banco, Cambia password. Il file `frontend/public/googlea308a6dc1717156d.html` è la verifica di Google Search Console: **non cancellarlo mai**.

## 7. Come si fa una modifica (il metodo che funziona)
1. Scrivi a Claude cosa vuoi; Claude prepara una **patch** (zip con `patchNN/applica.sh` + un comando unico).
2. Carichi lo zip su Google Drive, link "Chiunque abbia il link", incolli il link nel comando e lo mandi a Emergent.
3. Emergent risponde con l'output dello script, la build e il deploy. Se dice ERRORE: non farlo correggere da solo, manda l'errore a Claude.
4. Scarichi lo zip del progetto e lo mandi a Claude per il controllo riga per riga. Poi rimetti Drive su "Limitato".
Ogni patch cancella da sola le cartelle delle patch precedenti. Se un giorno Emergent non c'è più, il progetto è un normale sito React + Python: qualunque sviluppatore lo può ospitare altrove (serve una chiave per l'IA e un MongoDB).

## 8. Controlli da fare ogni tanto (5 minuti)
- Apri una ricetta, tocca Ascolta: parla il telefono. Scrivi "cos'è la biga" a Sitor: risponde la bottega.
- Pagina Costi: la tabella non deve avere giorni fuori scala. Search Console: nessun errore sulla sitemap.
- Cambia lingua in DE e EN e guarda una ricetta.

## 9. Se qualcosa non va
- Il sito non si apre: aspetta 5 minuti e riprova; poi guarda su Emergent se l'ultimo deploy è verde.
- Un attrezzo non compare: svuota la cache del telefono (o apri in incognito): il sito si aggiorna da solo alla visita successiva (cache v75).
- Sitor non risponde: guarda i limiti nella pagina Costi.
- Per tutto il resto: zip del progetto a Claude.
