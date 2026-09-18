# PIANO — Da "MikiLab Pro" (OS aziendale) a "Il Manuale di Sitor" (ricette per casa)

> Documento di sola pianificazione. NESSUNA modifica al codice è stata fatta.
> Le RICETTE non si toccano in nessun caso.
> Lo stile grafico lo decidiamo alla fine.

---

## 1. OBIETTIVO
Trasformare l'app da console gestionale per aziende (panifici/pizzerie/pasticcerie)
a **manuale pubblico di ricette guidato da Sitor**, pensato per chi vuole
replicare le ricette di Michele **da casa**.

Niente più: Capo, aziende, turni, operai, contratti, normative.
Solo: ricette + Sitor che ti guida passo-passo (voce + testo) + versione casa.

---

## 2. COSA SI ELIMINA (dalla vista pubblica)

### A. Tutta la Console del Capo (le 6 macro-sezioni)
- **Piano Settimanale** (genera piano, chiusura giornata, consegne furgoni, stato macchine)
- **Ordini Extra / B2B** (ordini oggi-domani, ordini B2B, eventi pasticceria, panetti pizzeria)
- **Turni e Ruoli del Team** (coordinamento squadra, assegnazione reparti, appello, turni-tipo, volti team)
- **Strumenti Collegabili** (macchine/PLC, silos, celle & freezer, riconoscimento macchinari, gemello digitale, AI Vision, hardware bridge, forni QC)
- **Sicurezza, Report & Emergenze** (report, ArbZG, controllo accessi, centro emergenze)

### B. Modalità Operatore / "Floor"
- Login operaio, invito operatore, orologio timbratura, check-in con volto,
  giornata operatore, postazioni, guida di reparto.

### C. Accessi e blocchi aziendali
- Gate "Accesso Capo riservato", PIN lock, login admin come requisito d'ingresso.
- (L'accesso resta SOLO come login opzionale per i preferiti — vedi sezione 4.)

### D. Conformità e legale aziendale
- Timelog ArbZG (legge orario lavoro), report violazioni orario.
- Richiesta cancellazione GDPR aziendale, catena hash a prova di manomissione.
- Impressum/partita IVA aziendale, privacy pensata per il datore di lavoro.
  (Resterà una privacy semplice da sito pubblico, non da azienda.)

### E. Logistica e gestione
- Magazzino, riordino automatico silos, food cost, consumi, packaging,
  consegne/furgoni, carbon footprint.

### F. Scenografia "impianto"
- Il "Multiverso" con foto reparti, il battito cardiaco dell'impianto (BPM),
  gli allarmi di reparto, il cambio umore impianto (sereno/critico).

### G. Multi-azienda (multi-tenancy)
- Selettore organizzazione, badge organizzazione, isolamento dati per azienda.
  (Non serve più: c'è un solo "mondo", quello delle ricette di Michele.)

**Backend che va in pensione (spento, non necessariamente cancellato subito):**
`coordination.py`, `deck.py`, `warehouse.py`, `orgs.py`, `operations.py`,
e le rotte aziendali dentro `server.py` (turni, magazzino, compliance, B2B, floor).

---

## 3. COSA RESTA (il cuore che riusiamo — già pronto)
- **Le RICETTE** — database + `recipes.py`. INTATTE. Non si toccano.
- **Il Corso passo-passo di Sitor** — endpoint già esistente e GIÀ PUBBLICO
  (`/recipes/{id}/course`): restituisce titolo, introduzione, 5-9 fasi e consigli.
- **Chat con Sitor** + memoria delle conversazioni.
- **Voce di Sitor (TTS)** in tutte le 8 lingue.
- **8 lingue** (IT / DE / EN / ES / FR / FA / AR / TR) — sistema i18n già completo.
- **"Adatta alle mie dosi"** — il ricalcolo in % sul peso farina esiste già
  (dentro "Le Ricette Custodite"): sarà la base della "Versione Casa".
- **Preferiti** — con login opzionale.
- **Contenuti didattici**: Enciclopedia, Glossario, Guida ai Metodi, Sapori di Casa.
- **Avatar di Sitor e Miki** (li ritocchiamo, non li rifacciamo).

---

## 4. COM'È DOPO — il nuovo percorso pubblico

1. **HOME** (calda, pulita, "libro di ricette premium" — non videogioco)
   - Sitor 3D che ruota e ti accoglie come una guida vera.
   - Nessun login richiesto. Si entra e si sfoglia subito.

2. **GALLERIA RICETTE**
   - Sfoglia per categoria (pane, pizza, dolci, focacce...), ricerca, foto.

3. **RICETTA**
   - Ingredienti, foto, storia. Toggle **"Versione Casa"** che ricalcola
     dosi e temperature per il forno di casa (es. da 10 kg → 500 g, forno ventilato).

4. **CUCINA CON SITOR** (il pezzo forte)
   - Guida passo-passo: Sitor legge ogni fase a voce + testo.
   - Avanti / indietro tra le fasi, timer integrati, modalità "mani libere".

5. **CHAT CON SITOR**
   - Domande sulla ricetta ("posso sostituire la farina 00?", "che lievito uso?").

6. **PREFERITI (login opzionale)**
   - Registrazione solo se vuoi salvare le ricette del cuore. Tutto il resto è libero.

7. **8 LINGUE** ovunque + **Sitor 3D** come guida creativa.

---

## 5. NOTE
- Gestione ricette di Michele (aggiungere/modificare): da decidere domani —
  opzione consigliata: nasconderla dietro un accesso admin riservato,
  così puoi ancora curarle ma il pubblico non la vede mai.
- Stile/identità visiva: la definiamo alla fine, con il design expert.

## 6. DECISIONI APERTE PER DOMANI
1. Console gestione ricette: nascosta dietro admin (consigliato) o eliminata del tutto?
2. Versione Casa: dose target fissa (es. 500 g farina) o scelta dall'utente?
3. Preferiti: teniamo il login attuale (email) o solo "salva sul dispositivo"?
4. Contenuti didattici (Enciclopedia/Glossario/Sapori di Casa): li teniamo tutti o snelliamo?
