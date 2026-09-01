# MikiLab — Mappa di Audit Completa del Sistema
**Il Laboratorio di Michele** · Versione documento: giugno 2026
Piattaforma di panificazione artigianale · 100% gratuita · Multilingua (IT · DE · EN · ES · FR · FA)

---

## Legenda e convenzioni

- **Tema "Oro del Grano"** (solo Vista Braccio / operativa): sfondo crema/burro `#F5ECD7`, superfici `#FBF6E8`, bordi oro `#E3C989`, accenti oro/ocra `#C8862B`, pulsante voce bronzo/cuoio `#6B4A2B`, testo scuro `#3D2B1F`. Massimo contrasto per lettura a distanza con mani infarinate.
- **Zero-Scroll**: la Vista Braccio occupa **esattamente** l'altezza dello schermo (nessuno scorrimento). Footer e padding globali vengono nascosti quando è attiva (`body.braccio-mode`).
- **Comando vocale**: attivabile con il **microfono gigante** (tieni premuto e parla) nella Vista Braccio, con il **FAB microfono** (in basso a destra) nelle altre sezioni, oppure a mani libere con la **wake word "Ehi Lab"** (varianti riconosciute: *ehi lab, hey lab, e lab, ei lab, lab, ok lab*).
- **Conferma vocale**: ogni comando riuscito riceve una **risposta parlata** (sintesi vocale nativa del dispositivo) + un **toast** a schermo. Funziona **offline**.
- **Barge-in**: parlando si interrompe automaticamente l'audio dell'assistente. Pulsante **Muto** disponibile.
- **Offline-first**: ricette, ultimo piano di produzione e **stato del turno** restano consultabili senza rete (cache locale) e si risincronizzano quando la rete torna.

> **Multilingua**: tutte le voci del sistema (interfaccia e comandi) sono riconosciute/pronunciate in IT, DE, EN, ES, FR, FA. Nel documento gli esempi sono in italiano.

---

## 0. Sistema globale (valido in tutte le sezioni)

### 0.1 Schermata e funzionalità
- **Header**: logo MikiLab, orologio live, selettore lingua (IT|DE|EN…), tema chiaro/scuro, pulsante Accedi/Profilo, corona Admin (solo owner).
- **Bottom nav** ("pale da forno"): 4 sezioni fisse — **Ricette · Scienza & Guide · Laboratorio · Community** (+ Home dal logo/menu, Diagnosi e Shop da percorsi dedicati). Badge notifiche/novità sulla Community.
- **Assistente vocale "Lab"** (avatar Michele) + **Momi** (avatar didattico): FAB microfono globale, toggle wake-word "Ehi Lab", toggle audio muto, avatar parlante animato, timer multipli fluttuanti.
- **Installa App (PWA)** + **Radio del Fornaio** (con sottofondo "scoppiettio del forno" regolabile).

### 0.2 Comandi vocali GLOBALI (disponibili ovunque)
| Comando (esempio) | Effetto |
|---|---|
| «Ehi Lab, **timer autolisi 45 minuti**» | Crea un timer con nome; supporta ore/minuti/secondi; timer multipli |
| «**ferma / pausa / riprendi / quanto manca** al timer» | Controllo timer attivi |
| «**vai alle ricette / laboratorio / community / home / scienza e guide**» | Navigazione tra le sezioni |
| «**apri** [nome strumento]» (es. «apri programma settimana», «apri termostato») | Apre uno strumento del Laboratorio |
| «**crea una nuova ricetta: [nome]**» | Apre la scheda "Le Mie Ricette" pre-compilata |
| «**ricetta [nome]**» / «scheda [nome]» | Cerca e apre una ricetta |
| «**1000 g di farina al 65%**» / «idratazione 70%» | Calcolo dosi (acqua + sale) letto a voce |
| «l'**impasto è a 26 gradi**, come lo salvo?» — **Lab Sense** | Correzione temperatura impasto (ghiaccio/acqua tiepida, velocità) |
| «**converti** 500 g d'acqua in litri» | Conversione unità |
| «**registra scarto** 2 chili pane» | Aggiunge al Registro Scarti |
| «**sanifica vasca due**» | Segna sanificazione vasca |
| «cosa si **produce oggi/domani**?» | Riepilogo vocale del piano del giorno |
| «**spiegami** [modulo]» (Momi) | Spiegazione didattica di una funzione |
| «**chiama** [nome/ruolo]» | Chiamata interna (indicatore; audio nativo in build app) — *DEMO* |
| «Ehi Lab, [qualsiasi domanda]» | Fallback: risposta breve del Maestro AI |
| «**lab stop / silenzio / basta**» | Ferma l'audio (barge-in) |

### 0.3 Gestione imprevisti / modalità attive (globali)
- **Modalità di lavoro** (condivisa fra dispositivi): **Flusso Continuo** vs **In Autonomia** — vedi §4.
- **Stato del turno condiviso**: guasti macchine, cella fuori uso e note viaggiano su un documento unico → **tutti i dispositivi** del laboratorio vedono lo stesso stato in tempo reale (con cache offline).
- **21 sensori proattivi** in modalità **DEMO**: se una soglia simulata viene superata, l'assistente avvisa a voce.
- **Routing audio Bluetooth multi-operatore**: simulato nel browser (pronto per la build nativa Capacitor).

---

## 1. HOME (Hub)

### 1.1 Schermata e funzionalità manuali
- Hero **MikiLab** + badge "100% FREE" e "SYSTEM 100% OFFLINE READY".
- Card di accesso alle sezioni (Ricette, Scienza & Guide, Laboratorio…) con "Tocca per aprire".
- Blocchi concetto espandibili (accordion): **Cos'è MikiLab · Il Mio Metodo · Lavorare in Serenità · Chi sono** (foto reali di Michele).
- Card **Avatar MikiLab** animata + blocco promozionale.
- Barra **Condividi** (WhatsApp/Telegram/FB/X/Email/Copia) + **Installa App**.
- Link discreto alla **pagina legale** in fondo.

### 1.2 Comandi vocali specifici
- «vai alla **home**», «portami all'**inizio**».
- Tutti i comandi globali (§0.2) incluso «apri [sezione]».

### 1.3 Gestione imprevisti / modalità
- La Home non gestisce direttamente guasti; è il punto d'ingresso. Eventuali **note del turno** compaiono nella Vista Braccio del Laboratorio (§4).

---

## 2. RICETTE (Ricettario)

### 2.1 Schermata e funzionalità manuali
- Elenco ricette **per categorie** in ordine fisso: **Basi & Lieviti → Pane → Panini & Snack → Panettoni** (con miniature per i Panettoni).
- Scheda ricetta (finestra): **Ingredienti** (grammi + % sul peso farina), **Procedimento** passo-passo, **fasi di lavoro** (impasto/riposo/cottura), badge tipologia/temperatura acqua, **Glossario** con asterisco per i termini tecnici, nomi reali sotto ai nomi "fantasia".
- Ricette **Mikilab** in lettura per tutti; le **personali** sono private per account.
- **Struttura Panettone** dedicata: gestione lievito madre (tabella pH), tabella 1°/2°/Totale, modulo glassa automatico, pulsante **"Converti in Farro"**.
- **Etichette Panettoni** stampabili e **Guida ai metodi**.
- Modalità **"Mani in Pasta"** dalla scheda: lettura a voce dei passaggi (schermo sempre acceso).

### 2.2 Comandi vocali specifici
- «**ricetta focaccia**», «scheda panettone», «le mie ricette [nome]» → apre la scheda.
- «vai alle **ricette**».
- Dentro **Mani in Pasta**: «**avanti · indietro · ripeti · timer 20 minuti · stop · chiudi**».

### 2.3 Gestione imprevisti / modalità
- Consultazione **offline** garantita (cache). Nessuna logica di guasto qui.

---

## 3. SCIENZA & GUIDE (Impara / Academy / Enciclopedia / News)

### 3.1 Schermata e funzionalità manuali
- **Impara**: tips, i nostri video (metodo diretto/indiretto), video dei panettieri famosi, **Quiz del Fornaio**, planner casalingo.
- **Enciclopedia**: 10+ voci base (Lievito Madre, Sauerteig, Poolish, Biga, Kochstück, Quellstück, Miglioratore, Malto, Autolisi, Idratazione).
- **Guida ai metodi**: Poolish, Lievito Madre (pane vs panettone), Sauerteig di segale, Miglioratore.
- **News**: feed automatico (Stoccarda/Germania/Italia) in sola lettura.

### 3.2 Comandi vocali specifici
- «vai a **scienza e guide** / **accademia** / **corsi** / **impara**».
- «vai alle **notizie / news**».
- «**spiegami** [argomento]» → Momi legge la spiegazione.

### 3.3 Gestione imprevisti / modalità
- Contenuto informativo; nessuna gestione operativa. Fruibile offline (contenuti statici).

---

## 4. LABORATORIO — VISTA "BRACCIO" (operativa, mobile, Zero-Scroll)

> È la schermata di lavoro in reparto: **tema Oro del Grano**, **zero scroll**, un microfono gigante + 3 tasti. Nessun elemento superfluo.

### 4.1 Schermata e funzionalità manuali
- **Banner in alto**: informativo di default; diventa **Banner Emergenza** (rosso ocra `#9C4A1E`, `braccio-alert-banner`) quando c'è una macchina fuori uso, la cella giù o una nota — mostra la **nota per il turno** ed è **toccabile** per aprire "Guasti & Celle".
- **Modalità di lavoro** (segmentato): **Flusso Continuo** ⚡ vs **In Autonomia** 📦 (`braccio-mode-continuo` / `braccio-mode-autonomia`). Lo stato è **condiviso** e persiste.
- **Microfono gigante** centrale (bronzo/cuoio, `braccio-mic`): "Tieni premuto e parla" / "Ti ascolto…".
- **3 tasti rapidi** (esattamente tre):
  1. **Ricette del Giorno** 🍞 → §4.A
  2. **Guasti & Celle** ⚠️ → §4.B (mostra un **pallino di avviso** se ci sono problemi attivi)
  3. **SOS Impasto** 🆘 → §4.C
- Pulsante discreto **"Gestione (PC / Chef)"** per passare alla Vista Mente.

### 4.2 Le due modalità di lavoro (dettaglio)
- **Flusso Continuo**: produzione in tempo reale, in sincronia con gli altri reparti.
- **In Autonomia (Preparazione Anticipata)**: l'impastatore lavora da solo (2-3 h) completando lotti in blocco e aggiornando lo stato (**Pronto / In Cella / In Lievitazione / Pre-cotto / Base Pronta / Fatto**) per chi entra dopo.

### 4.3 Comandi vocali (Vista Braccio) — completi
| Comando (esempio) | Effetto |
|---|---|
| «**modalità autonomia**» / «preparazione anticipata» | Attiva la modalità In Autonomia |
| «**flusso continuo**» | Attiva la modalità Flusso Continuo |
| «**segna 10 teglie focaccia come precotte**» | Registra 10 teglie di focaccia tra le **Basi & Pre-cotti** (kind = pre-cotto) |
| «**segna 8 pezzi come base pronta**» | Registra una **Base Pronta** |
| «**lotto 2 pronto in cella**» | Stato del 2° lotto del giorno → **In Cella** |
| «**focaccia in lievitazione**» / «**pane pronto**» / «**lotto 1 fatto**» | Aggiorna lo stato del lotto per nome o numero |
| «**impastatrice principale rotta**» / «**spirale fuori uso**» | Segna la macchina **Fuori Uso** + ricalcolo (vedi §4.4) |
| «**cella non funzionante stasera**» / «**cella rotta**» | Attiva **lievitazione diretta** + nota turno (§4.4) |
| «**cella ok / ripristinata**» | Ripristina la gestione del freddo |
| + tutti i comandi globali (§0.2): timer, calcoli, dosi, scarto, "cosa si produce oggi", ecc. | |

### 4.4 Gestione imprevisti / modalità attive (cuore operativo)
- **Guasto macchina** → l'app **ricalcola all'istante (regole offline)**: ripartisce i lotti sulle **impastatrici disponibili**; se non ce ne sono, suggerisce di **dividere le dosi** in lotti più piccoli e lavorare a mano/planetaria. Genera una **nota per il turno**.
- **Cella / fermalievitazione fuori uso** → passaggio automatico a **lievitazione DIRETTA a temperatura ambiente**: aumenta il lievito (~+50%), impasto a 24-26°C, tempi ridotti, **infornate anticipate** per il turno dopo. Genera una **nota per il turno**.
- **Nota per il turno successivo**: ogni emergenza crea una nota **visibile in alto** nella Vista Braccio per chi entra dopo. "Nuovo turno" azzera le note.

---

### 4.A "Ricette del Giorno" (produzione di oggi)

**Schermata & manuale** (`ricetta-del-giorno`, tema Oro del Grano)
- Intestazione con giorno corrente + toggle modalità (`rdg-mode-continuo/autonomia`) e hint in Autonomia.
- Suggerimento vocale in evidenza.
- **Riepilogo "Basi & Pre-cotti in cella"** (chip) quando presenti (`rdg-bases`).
- **Lista prodotti** di oggi (`rdg-list`, item `rdg-item-<id>`): nome grande, quantità `N×`, **stato colorato** del lotto; barrato quando "Fatto".
- **Dettaglio prodotto** (`rdg-detail`): dosi in **carattere gigante** (Farina/Acqua+°C/Lievito madre/Sale), **griglia stati** (`rdg-status-*`: pronto, in_cella, in_lievitazione, precotto, base_pronta, fatto) e pulsante **"Lotto completato → prossimo"**.

**Comandi vocali**: come §4.3 (avanzamento lotti e pre-cotti). «cosa si produce oggi».

**Imprevisti/modalità**: rispetta la modalità attiva; gli stati impostati qui alimentano il **riepilogo basi/pre-cotti** condiviso.

---

### 4.B "Guasti & Celle" (Emergenze)

**Schermata & manuale** (`emergenze`, tema Oro del Grano)
- **Modalità di lavoro** (`emg-mode-continuo/autonomia`).
- **Impastatrici & macchine** (`emg-machines`): ogni macchina con stato Operativa/FUORI USO e pulsante `emg-machine-toggle-<i>` (Fuori uso / Ripristina). L'elenco arriva dalla configurazione **Celle & Impastatrici** (fallback: "Impastatrice principale").
- **Freddo & lievitazione**: toggle grande **"Cella non funzionante stanotte"** (`emg-cold-toggle`) + chip celle configurate.
- **Basi & Pre-cotti in cella** (`emg-bases`): riepilogo quantità/prodotto/stato.
- **Note per il turno** (`emg-notes`) con orario + pulsante **"Nuovo turno"** (`emg-clear-notes`) per azzerare.

**Comandi vocali**: «impastatrice … rotta», «cella non funzionante», «cella ok», «modalità …» (§4.3).

**Imprevisti/modalità**: è la centrale delle emergenze; ogni azione genera la nota condivisa e il **ricalcolo automatico** (§4.4).

---

### 4.C "SOS Impasto"

**Schermata & manuale** (`sos-impasto`): 8 problemi tipici (troppo appiccicoso, non lievita, alveolatura chiusa/grande, crosta pallida/dura, si spiana, sapore acido) con **Causa → Rimedio** espandibili; scorciatoia alla **Diagnosi Foto IA**.

**Comandi vocali**: «apri **SOS impasto**», «aiuto impasto». Le domande libere ricadono sul Maestro AI.

**Imprevisti/modalità**: guida diagnostica; nessuna azione sul freddo/macchine.

---

## 5. LABORATORIO — VISTA "MENTE" (Gestione / Chef · PC-tablet)

> Accessibile dal pulsante **"Gestione (PC / Chef)"**. Tema scuro professionale. Qui si **pianifica**; il Braccio **esegue**.

### 5.1 Schermata e funzionalità manuali
- Banner **"La Tua Tecnologia Unica"** (sonde live, voce multilingua, analisi visiva IA, calcolo farine, ottimizzatore consumi, timer smart).
- CTA **Nuova Ricetta / Workflow** + **Generatore di Piano IA** (PianoProduzioneAI).
- **Modalità Laboratorio** (pulsanti giganti) per chi lavora con le mani infarinate.
- **Griglia strumenti** completa (aprono schermate sovrapposte):
  - **Produzione & piano**: Programma Settimana, Calcolo Orari d'Inizio (Produzione Inversa), Piano di Lavoro, Lista della Spesa, Turni di Lavoro, Registro Scarti.
  - **Celle, macchine & freddo**: **Controllo Celle & Impastatrici** (config), Parco Macchine, Giacenze Freezer, Checklist Laboratorio.
  - **Forno & parametri**: Adatta Forno, Gestione Vapore & Forno, Costo Energia Forno, Temp. Acqua, Calcolatore Idratazione & Parametri, Calcolatore Metodo & Sequenze IA, Stampi & Pirottini, Convertitore Lieviti.
  - **Ricette & farine**: Le Mie Ricette, Scansiona Ricetta, Cerca & Adatta Ricetta, Ricette di Cantiere (PDF), Ricette Custodite, Generatore Ricette, Conversione Farine, Scanner Farina.
  - **Lievito & controllo**: Registro Lievito Madre (pH), Banca del Lievito, Fermentazione Predittiva, Time-Lapse Raddoppio, Termostato & Clima, Smart Weather-Baker, Digital Twin.
  - **Costi & sprechi**: Costi & Margine, Anti-Spreco, Esubero Zero-Sprechi, Angolo del Recupero, Shelf-Life.
  - **Strumenti hardware/voce**: Bilancia Smart, Pesata Guidata, Dispositivi Bluetooth, Mani In Pasta (Voce), Smart Timer Multi-Impasto, Diario Impasti.
  - **Hub verticali**: Laboratorio Pizzeria, Laboratorio Pasticceria & Gelateria, Sapori di Casa.
  - **I Miei Dati** (fornitori/listini), Diagnosi Foto, Diagnosi Suono.

### 5.2 Comandi vocali specifici
- «apri **programma settimana / termostato / celle / freezer / turni / lista spesa / registro lievito madre / bilancia / diagnosi foto** …» (alias completi per ogni strumento).
- «vai al **laboratorio**».

### 5.3 Gestione imprevisti / modalità
- **Controllo Celle & Impastatrici** definisce le macchine che il Braccio poi può marcare "Fuori Uso".
- **Giacenze Freezer**: avviso email sotto soglia (Resend).
- Ri-toccando il tab **Laboratorio** dalla bottom nav si **torna alla Vista Braccio** (o si chiude lo strumento aperto), così la **nota del turno** è sempre raggiungibile.

---

## 6. DIAGNOSI (Foto & Suono)

### 6.1 Schermata e funzionalità manuali
- **Diagnosi Foto**: modalità Difetti e rimedi, Stato impasto, Tutti gli ingredienti, Macchine & guasti (lettura codici errore da display), Filma il laboratorio. Complimento vocale "Bravo Maestro!" quando l'esito è OK.
- **Diagnosi Suono**: ascolta l'impasto/macchina.

### 6.2 Comandi vocali specifici
- «apri **diagnosi foto** / **analizza foto** / **diagnosi visiva**», «**diagnosi suono / ascolta impasto**».
- «vai a **diagnosi / difetti / ingredienti / macchine**».

### 6.3 Gestione imprevisti / modalità
- Modalità **"Macchine & Guasti"**: fotografa il display, legge codici/Störung e spiega i rimedi (complementare al ricalcolo del Braccio).

---

## 7. COMMUNITY (Soci)

### 7.1 Schermata e funzionalità manuali
- Feed sociale (post/foto), like, commenti, follow canali, messaggi diretti, profili.
- **Bake-Along** (sfida settimanale con vincitori), classifiche/gamification, badge notifiche/novità sul tab.

### 7.2 Comandi vocali specifici
- «vai alla **community / social / amici**».

### 7.3 Gestione imprevisti / modalità
- Sezione sociale; nessuna logica operativa di laboratorio.

---

## 8. SHOP / ACADEMY ("In arrivo")

### 8.1 Schermata e funzionalità manuali
- Catalogo panettoni/corsi con foto reali, stato **"In arrivo"** (toggle admin), raccolta email (lista d'attesa). Conformità alimentare (allergeni, nutrizionale, peso) prevista alla vendita.

### 8.2 Comandi vocali specifici
- Navigazione via menu/Home (nessun comando vocale dedicato).

### 8.3 Gestione imprevisti / modalità
- Vendite reali sbloccabili da admin dopo i dati fiscali.

---

## 9. RIEPILOGO — COMANDI VOCALI PER FAMIGLIA

**Attivazione**: microfono gigante (Braccio) · FAB microfono (altre sezioni) · wake word «Ehi Lab».

- **Navigazione**: home, ricette, scienza e guide, laboratorio, community, news, diagnosi + «apri [strumento]».
- **Produzione/turno (Braccio)**: modalità autonomia/continuo · segna [n] [teglie/pezzi] [prodotto] precotte/base pronta · lotto [n]/[nome] pronto·in cella·in lievitazione·fatto.
- **Guasti/celle (Braccio)**: [macchina] rotta/fuori uso · cella non funzionante/rotta/ok.
- **Calcoli**: [g] farina al [%] · idratazione [%] · converti [g/l] · impasto a [°] (Lab Sense).
- **Timer**: timer [nome] [n] minuti/ore · pausa/riprendi/ferma/quanto manca.
- **Registri**: registra scarto [q] [prodotto] · sanifica vasca [n].
- **Ricette**: ricetta [nome] · crea nuova ricetta [nome].
- **Mani in Pasta**: avanti · indietro · ripeti · timer [n] minuti · stop · chiudi.
- **Didattica/AI**: spiegami [modulo] · [domanda libera] → Maestro AI.
- **Sistema**: lab stop / silenzio / basta (ferma l'audio).

---

## 10. MATRICE GESTIONE IMPREVISTI

| Evento | Innesco (tap / voce) | Reazione automatica (offline) | Dove appare |
|---|---|---|---|
| **Macchina fuori uso** | Emergenze → "Fuori uso" · «impastatrice … rotta» | Ripartizione lotti su macchine disponibili / lotti ridotti a mano | Nota turno + banner Braccio |
| **Cella/fermalievitazione giù** | Emergenze → toggle · «cella non funzionante» | Lievitazione **diretta** a temp. ambiente (+lievito, tempi ridotti, infornate anticipate) | Nota turno + banner Braccio |
| **Cambio turno** | "Nuovo turno" (azzera note) | Reset note; stato lotti/basi resta condiviso | Emergenze |
| **Lavoro in autonomia** | Toggle modalità · «modalità autonomia» | Aggiornamento stati lotto per chi lavora dopo | Braccio + Ricette del Giorno |
| **Pre-cotture/basi** | Ricette del Giorno · «segna … precotte» | Somma nel riepilogo Basi & Pre-cotti | Braccio + Emergenze |
| **Sensore proattivo (DEMO)** | Soglia simulata | Avviso vocale dell'assistente | Overlay vocale |

---

*Documento generato per audit/export. Lo stato del turno (modalità, lotti, basi, guasti, celle, note) è condiviso fra tutti i dispositivi del laboratorio e disponibile offline. I comandi vocali usano il riconoscimento vocale nativo del browser (Chrome/Safari) con conferma parlata.*

---
## AGGIORNAMENTO (direttiva UI definitiva)
- **Tab definitivi**: Ricette del Maestro · Scienza & Guide · **Schede di Produzione** (ex Laboratorio) · Community. **Vista di default all'avvio = Schede di Produzione**.
- **Hands-free**: RIMOSSO il push-to-talk (niente più microfono gigante). Ascolto **continuo** in background; il **tasto ORECCHIO** (in basso a destra) è il toggle attivo/inattivo dell'ascolto. Parlare liberamente o dire «Ehi Lab».
- **Nessun popup**: onboarding vocale e badge PRO rimossi; ingresso diretto senza sovrapposizioni.
- **Freccia Indietro** (←) in alto a sinistra nelle pagine interne del lab.
- **Nuove funzioni operative**: Autonomia con **orari** (fino a che ora lavorare da solo prima della scadenza cella), **Consegne del turno** (riepilogo vocale: pronto/in cella/da completare/basi), **Storico guasti** persistente (`/api/lab/fault-log`), **Basi in scadenza** (avviso usa/abbatti su pre-cotti e basi).
- Regola architetturale: ogni elemento UI è collegato a logica reale (nessun elemento decorativo).
