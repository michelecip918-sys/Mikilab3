# PRD — Mikilab / Il Maestro del Pane

## Problem statement
App personale di panificazione artigianale (zona Stoccarda), bilingue IT/DE, senza login.

## Architecture
- Frontend: React (CRACO), Tailwind, framer-motion, sonner, lucide-react, react-markdown. Mobile-first, bottom nav 4 voci. i18n via LanguageContext (IT/DE, persist localStorage).
- Backend: FastAPI + MongoDB (motor). AI (chat + vision) streaming SSE JSON con emergentintegrations, Claude Sonnet 4.6, EMERGENT_LLM_KEY. `lang` param → risposta AI nella lingua scelta.
- No authentication.

## Sections
- **Mikilab**: bio card (professionale, farro/Dinkel, lievito madre, panettone) + ricette CRUD (3 esempi), duplica, scala dosi.
- **Maestro** hub (5 strumenti): Aggiungi ricetta (personal); Piano settimanale (ricette×pezzi/giorno, dosi, salva/stampa/condividi); **Quando impastare** (StartDoughs: schedulazione impastatore quantità-aware, ordine per riposo, formatura = pezzi×sec/pezzo, attesa/sovra-maturazione); **Quando infornare** (backward dall'infornata, collegato a ricette+piano settimanale); Gestione forno (profili con tipo Statico/Ventilato con carrello, timer con notifiche).
- **Diagnosi (Foto)**: AI vision Trova difetti / Trova ingredienti (markdown).
- **Il Maestro sa tutto**: chat AI (markdown), Enciclopedia + Notizie (Stoccarda evidenziata + Germania + Italia), Video YouTube, Annunci Stoccarda CRUD.

## Connections
ricette → piano settimanale → Quando impastare / Quando infornare (prefill da giorno del piano, quantità incluse).

## Status (verified)
- iteration_9: recipe COSTING (costi/prezzo di vendita) end-to-end, LOTTI DIVISI (preemption piccoli lotti), bio; backend 70 passed/1 skipped. Tutti i flussi frontend OK.
- Bio aggiornata (nessun riferimento al maestro; invito "Fatti aiutare da Mikilab").
- Fix robustezza: PUT /api/recipes parziale non azzera più 'name' (niente corruzione lista).

## Backlog / Next
- P2: split automatico grandi lotti in formatura per evitare sovra-maturazione.
- P2: notifiche timer in background persistenti; export PDF piano.
- P2: video/annunci dinamici.

## v2 (2026-06) — Riorganizzazione Maestro + Ricette avanzate
- Intestazione: sottotitolo "Il laboratorio di Michele".
- PWA installabile (icona ML, manifest, service worker). NB: per la produzione serve Redeploy.
- Maestro: 4 strumenti → Aggiungi ricetta, Piano settimanale, **Piano di lavoro** (ex Quando impastare: persone, ricetta di partenza, avvisi vocali IT/DE, info cottura per ricetta), **Clima e temperatura** (acqua + verdetto camera calda/fredda). Rimossi "Quando infornare" e "Gestione forno".
- Ricette: nuovi campi mix_minutes, bake_temp, bake_minutes, oven_type (Statico/Ventilato/Rotor), preferment_type (none/poolish/lievito madre-Sauerteig/licoli/biga/altro), method_type (diretto/indiretto), image_url. Prezzi standard auto. Modalità dosi Grammi/% farina. Sfondo prodotto tenue nelle card.
- Ricette Mikilab in **sola lettura** (consultabili); l'utente crea/gestisce le proprie in "Aggiungi ricetta".
- Ricette Mikilab dal video utente: Mitternacht Brot, VK Teig, Helle Teig, Ita Teig, Panettone al Dinkel (Millebolle), Plunder, Laugenbrötchen con poolish, Focaccia con poolish (bozze, l'utente rifinisce).
- Pagina **Lievito madre** dentro Mikilab (cos'è, Li.Co.Li, Sauerteig, autolisi, gestione Millebolle 50-50).
- Il Maestro sa tutto: scheda **Corsi** gratuiti professionali (IT/DE mondo) con badge "Nuovo" + notifica; video tab con embed funzionanti.
- Bio riscritta: innamorato del pane, spiega l'app in modo chiaro (senza elenco numerato).
- Backend: PUT /api/recipes ora partial-safe (exclude_unset). Prompt AI: metodo logico passo-passo.
- Google Play: possibile via PWABuilder (TWA); il backend/dominio deve restare online (spiegato all'utente).

## v3 (2026-06) — Voce + strumenti anti-stress
- **Assistente vocale**: pulsante microfono globale (Web Speech API) per "parlare con Mikilab": comandi di navigazione ("vai su ricette/corsi…") e domande al Maestro AI con risposta letta ad alta voce (IT/DE). Funziona su Chrome/Android.
- **Adatta al forno** (Maestro): modalità Calcolo (converte gradi/minuti tra Statico/Ventilato/Rotor, parte anche da una ricetta) e modalità Foto (vision mode "forni": riconosce il tipo di forno e spiega come cambia la cottura).
- **Sveglia lievito madre** (Maestro): promemoria rinfreschi con conto alla rovescia, "Ho rinfrescato ora" e avviso vocale/notifica (localStorage, nessun backend).
- Costi ricette: mostrati SOLO nelle ricette del fornaio (personal), non in Mikilab; mostrato solo il costo di produzione (totale + a pezzo), rimossi prezzo di vendita/margine/markup.
- Bio accorciata e resa in italiano scorrevole ("innamorato del pane").
- Diario di produzione: valutato e SCARTATO su richiesta utente (aggiungeva stress).

## v4 (2026-06) — Rifiniture UX
- Corsi spostati da "Maestro sa tutto" a **Mikilab** (pulsante dedicato + notifica nuovi corsi, componente condiviso CoursesPanel).
- Piano di lavoro: "Prepara per primo" rinominato **"Inizia il lavoro"**, selettore **"Inizia con"**.
- Diagnosi (PhotoDiagnosi): supporto **video** (estrae fotogramma), 4 modalità (difetti, **impasto** stato lievitazione, ingredienti, **scopri** idee innovative), **complimento vocale** "Bravo Maestro!" quando [OK]. Nuovi prompt vision backend: impasto, scopri, forni; difetti valuta anche lo stato e chiude con [OK]/[FIX].
- "Maestro sa tutto" → tab **Zona & Mondo**: annunci con campo `region` (Stoccarda/Germania/Italia/Mondo), chip di filtro e badge zona. Backend: Announcement.region.

## v5 (2026-06) — Ricette complete + contenuti
- Card ricetta Mikilab: ora mostra la RICETTA COMPLETA — blocco Ingredienti (grammi + **percentuale sul peso farina**) e riga Lavorazione (impasto/riposo/cottura), oltre alla descrizione (whitespace-pre-line).
- Nuove ricette Mikilab: Brezel, Croissant al Dinkel, **Backmittel naturale** (miglioratore: malto, lupino dolce, acerola, lino dorato, psillio) con didascalia e dosaggio 3-4%. Totale 14 ricette, tutte con foto di sfondo.
- Panettone: aggiunta la gestione del lievito madre (Millebolle) nelle note.
- Pagina Lievito madre espansa a 11 sezioni.
- Service worker aggiornato (v2): non mette in cache le API, pulisce le cache vecchie → niente versioni stantie sull'app installata.


## v6 (2026-06) — Radio, prefazione biblica, farro, principianti arricchiti
- **Radio del Fornaio**: pulsante fisso in basso a sinistra (RadioFornaio.jsx), lettore <audio> HTML5 con stazioni IT (RAI Radio 1/2/3, RTL 102.5, Radio 105, Virgin) e DE (SWR3, Antenne Bayern, bigFM), controllo volume, indicatore "In onda", equalizer animato. NB: RAI Radio 1 può dare 403 dal container (geo) ma funziona lato utente; errore gestito con messaggio.
- **Prefazione biblica** (Mikilab, in cima): versetti Matteo 4:4 / Deut 8:3 e Matteo 5:3 + testo di Michele sull'importanza del pane. **Pensiero finale** in fondo al ricettario ("Colui che ha inventato i cereali", Geova/Creatore). Bilingue IT/DE.
- **Ricette classiche originali (grano, non farro)**: Panettone, Focaccia, Ciabatta, "Cuore Italiano" (rinominata da "…al Farro"). Aggiunta nota "🌾 Variante farro (Dinkel)" in coda alle ricette di grano (+3-5% acqua, impasto delicato).
- **12 nuove ricette Mikilab** col metodo di Michele (indiretto + lievito madre + Backmittel): Pane alle Patate (patate lessate con buccia, usate il giorno dopo), Pagnotta di Matera, Segale e Miele, Baguette (poolish), 5 Cereali, Noci e Uvetta, Cipolle Caramellate, Semi di Canapa, Olive e Rosmarino, Pane al Latte, Grano Antico (Senatore Cappelli), Panini ai Semi di Zucca. Totale ricette: 26. Script: backend/seed_michele_recipes.py.
- **Per principianti** arricchita: tips + **video e corsi gratis** (freeCourses embed YouTube) + **Quiz del Fornaio** (5 domande interattive con punteggio).

## v7 (2026-06) — Bandiere, bio nuova, ingredienti extra, riorganizzazione
- **Fascia tricolore** IT (verde-bianco-rosso) + DE (nero-rosso-oro) in cima all'header e sopra la BottomNav; bandierine 🇮🇹🇩🇪 nel sottotitolo; anello dorato sul logo.
- **Bio riscritta**: card "Benvenuti in Mikilab" (testo con parole di Michele: idee/metodo/tempistiche) + "Chi sono" (Matera, Germania, vocazione, gratitudine al Creatore). Rimossa la card Prefazione (contenuto spirituale ora nella bio).
- **"Per principianti" spostato** dagli accessi Mikilab agli **Strumenti del Maestro** (nuovo componente sections/Beginners.jsx: tips + corsi YouTube gratis + Quiz del Fornaio). **"Lievito madre"** spostato in fondo alla lista ricette.
- **Ingredienti extra** con % sul peso farina: nuovo campo backend `extra_ingredients` (List[dict] {name, percent}); mostrati e scalati nella card ricetta; modificabili nel RecipeDialog ("Altri ingredienti"). Seed backend/seed_extra_ingredients.py: Olio d'oliva 3%, Aceto di mele (Apfelessig) 1%, Kokosfett 2% sui pani salati (esclusi panettone, sfoglia, croissant, pane al latte, Laugen, Brezel). Nota di processo aggiunta.
- **Backmittel naturale**: composizione mostrata come extra_ingredients (Malz 0.3%, lupino dolce 1%, acerola 0.3%, lino dorato 2%, psillio 0.5%).
- NB: modifiche in PREVIEW; serve REDEPLOY per il sito live mikilab.de.

## v8 (2026-06) — Ricettario autentico + procedimento
- Nuovo campo backend `procedure` (procedimento passo-passo) + sezione "Procedimento" nella card ricetta e nel RecipeDialog.
- Ingredienti extra ora mostrati NELL'ORDINE di aggiunta (array ordinato); rimossa la riga automatica "Backmittel 3%" (ora gli ingredienti sono espliciti) e rimossa la nota brandizzata "I miei extra".
- Collezione mikilab SOSTITUITA con le ricette reali di Michele (dalle sue tabelle foto): Vk Teig (+panini Brötchen), Kart. Teig, Mittern, Di-Spezial, Toast, Ital. Teig, Diguette, Hefeteig, Lg Brezel, Croissant, Mürbe Br, HefeZopf + Panettone (due impasti, dalla foto scritta a mano) + Backmittel naturale + 3 specialità (noci, cipolle, canapa). Totale 17. Script: backend/seed_real_recipes.py.
- Procedimento standard con CELLA a 16°C dopo l'impasto e riposo MASSIMO 6 ore; ordine aggiunta (Kokosfett a palla; olio+aceto+sale a fine impasto); istruzioni panini dove pertinente.
- NB: modifiche in PREVIEW; serve REDEPLOY per mikilab.de.

## v9 (2026-06) — Bandiere origine, logo, Quellstück, lingua auto
- Classificazione prodotti per ORIGINE (bandiera di qualunque paese via codice ISO2): campo backend `origin`; striscia tricolore + bandierina sulla card; selettore paese nel RecipeDialog (src/lib/countries.js). Origini assegnate alle 18 ricette.
- "Backmittel" rinominato "Miglioratore naturale" (IT) negli ingredienti e nella ricetta; ASTERISCO (*) accanto all'ingrediente che scrolla/evidenzia la ricetta del Miglioratore.
- Quellstück: nota "se ci sono semi fai il Quellstück (ammollo la sera prima)" aggiunta alle ricette con semi (Verde Canapa, Bruno d'Autunno, Sinfonia di Cereali - nuova).
- Nuova ricetta "Sinfonia di Cereali" (5 cereali con Quellstück).
- Lingua AUTOMATICA dal dispositivo (navigator.language): de→tedesco, it→italiano; scelta manuale salvata in localStorage.
- Sezione VIDEO rimossa da "Chiedi al Maestro".
- LOGO Mikilab (monogramma ML dorato + spighe su fondo scuro, ricreato in alta risoluzione): header, favicon, icone PWA 192/512, apple-touch, foto bio brandizzata. public/logo.png. sw.js CACHE_NAME v3.
- Campo `procedure` (procedimento) + REST cella 16°C (lievito madre) vs FRIGO (lievito di birra/sfogliati).
- Nomi ricette rinnovati (italiani, curati) + ordinamento alfabetico (backend sort by name).

## BACKLOG "Capo Laboratorio" (grande richiesta, da fare a fasi)
- Fase 1: campi obbligatori ricetta (tipologia impasto, temp acqua °C, minuti impastatrice per fase, fasi riposo/lievitazione con temp) + allega foto (no AI).
- Config personale + attrezzature; algoritmo sequenza impasti + assegnazione mansioni; pianificazione settimanale.
- Tool: Piano di Lavoro Intelligente, Clima/Temp (regola 60/70, costante 68), Adatta al Forno (n° forni), Sveglia rinfreschi/pre-impasti.
- Riorg: Enciclopedia→Diagnosi; "Stoccarda e mondo"→Mikilab in alto (geolocalizzatore); guida/resoconto alla prima apertura.

## v10 (2026-06) — Bio/motto, guida iniziale, riorganizzazioni
- Bio: aggiunto MOTTO ("Grato a Chi ha creato il grano...") sotto il logo; RIMOSSA dalla bio la spiegazione app (Dinkel) → ora solo motto + "Chi sono".
- GUIDA INIZIALE (IntroGuide.jsx): modal alla prima apertura (localStorage mikilab_seen_intro) con logo, motto e spiegazione app (bio_welcome_body).
- Ricette: lista di soli NOMI (con bandiera + "…"); click → apre la ricetta in FINESTRA (Dialog). Miglioratore pinnato in cima, poi alfabetico. Lievito madre sopra le ricette. Ringraziamenti follower in fondo (una volta). Pensiero finale rimosso.
- Riorg: Enciclopedia spostata in Diagnosi (PhotoDiagnosi); Stoccarda "Zona & Mondo" in cima a Mikilab (Stoccarda.jsx/Encyclopedia.jsx estratti); MaestroSaTutto = solo chat.

## v11 (2026-06) — Motto rimosso, descrizione, Capo Laboratorio Fase 1 (start)
- Rimosso il motto da bio e IntroGuide. Descrizione app (bio_welcome_body IT/DE) aggiornata: Mikilab aiuta anche i panettieri a organizzare/gestire il lavoro (sequenza impasti, tempi, squadra).
- CAPO LABORATORIO Fase 1 (avviata): campi ricetta `dough_category` (Tipologia: pre/lm/diretto/rinfresco) e `water_temp_c` (°C) — backend + RecipeDialog + badge nella finestra ricetta.
- TODO Fase 1: minuti impastatrice per fase (mixing_phases), fasi riposo/lievitazione con temp (fermentation_phases), allega foto (no AI).
- TODO Capo Laboratorio: config personale + attrezzature; algoritmo sequenza impasti + assegnazione mansioni; pianificazione settimanale; tool Piano di Lavoro / Clima (60/70, cost. 68) / Adatta al Forno / Sveglia rinfreschi.

## v12 (2026-08) — Deploy sbloccato, Object Storage, Capo Laboratorio (blocco A), pulizia testi
- **DEPLOY (P0) SBLOCCATO**: rimosse TUTTE le operazioni distruttive dallo startup. Seed Mikilab ora INSERT-ONLY da `/app/backend/mikilab_seed_data.json` (solo se collezione vuota). Cancellati gli script dev con delete_many. Risolta la collisione di nomi `seed_mikilab_if_empty`. Confermato PASS dal deployment_agent.
- **Object Storage (archivio immagini dedicato)**: `POST /api/upload` + `GET /api/files/{path}` (Emergent Object Storage, init a startup, no base64). RecipeDialog carica la foto ricetta nell'archivio (con fallback compresso).
- **Capo Laboratorio Fase 1 completata**: `work_phases` ora renderizzate nella finestra ricetta (`recipe-phases-<id>`), editor fasi + foto da fotocamera. Fix a11y DialogTitle (IntroGuide + RecipeDetail), normalizzazione temp fasi.
- **Ricette**: +6 Puglia/Basilicata (Taralli Pugliesi, Pane di Altamura DOP, Pane di Matera IGP, Focaccia Barese, Friselle Pugliesi, Puccia Salentina). Totale **24**.
- **UX**: IntroGuide con testo breve (prefazione spostata nella bio); notiziario Stoccarda in fondo a Mikilab; rimosso tool "Clima/Calcola acqua"; "Chiedi al Maestro" + card capacità; Diagnosi mode "Strumento o macchina" (`macchine`) esteso a strumenti + funzione/uso.
- **CAPO LABORATORIO (blocco A)** — nuova sezione `sections/CapoLaboratorio.jsx` (primo tool del Maestro):
  - Config attrezzature: impastatrici (portata kg) + celle frigo/freezer/lievitazione (temp + contenuto) + personale + temp standard (26°C). Persistita: `GET/PUT /api/lab-config`.
  - Prodotti da preparare (ricetta+quantità) → **piano di lavoro AI** `POST /api/capo/plan` (SSE, Claude Sonnet 4.6): sequenza impasti/impastatrici, orari, celle, compiti, avvisi clima. FIX truncation ingress 60s → prompt compatto + `max_tokens=1800` → ~18s con evento done; frontend avvisa se stream incompleto.
  - **Filma il laboratorio** (fotocamera live getUserMedia) → vision mode `laboratorio`: riconosce impastatrici/forni/macchinari e consiglia in quale impastatrice lavorare e quando impastare.
- **Testi**: sostituito "app/applicazione" con "Mikilab"; prefazione spiega perché le ricette sono soprattutto di farro (Dinkel); RIMOSSI i nomi divini (Geova/Jehova/Dio/Gott) dalle chiavi.
- **Sezione "Metodo dell'impasto"** prima delle ricette (Mikilab): spiega diretto vs indiretto + 2 video YouTube (sottotitoli CC nell'altra lingua).
- **Bio**: aggiunta immagine generata (Nano Banana) del braccio tatuato di Michele con l'impasto in mano (`public/bio-dough.jpg`).

## BACKLOG dopo v12 (richieste utente da evadere)
- Termostato Bluetooth (Web Bluetooth) sincronizzato con le ricette: memoria temperatura impasto per ricetta + notifica correzione gradi il giorno dopo. (Complesso, hardware-dipendente.)
- Orologio + termostato GLOBALE con avvisi caldo/freddo rispetto allo standard.
- Ricette **Gente Brot** e **Wurzelbrot** (bozze col metodo di Michele).
- Convertire le ricette ITALIANE a impasto DIRETTO (da confermare QUALI ricette).
- Rendere TUTTI i titoli più professionali/chiari.
- **Redesign a colori** con accenti IT/DE forti su header, pulsanti e accenti (sfondo caldo invariato). (parziale: fascia tricolore su header e nei nuovi header sezione)

## v13 (2026-08) — Termostato & Clima, panettoni, ricette dirette
- **Termostato & Clima** (nuovo tool Maestro `ClimaTermostato.jsx`): orologio live, avviso caldo/freddo vs standard, **connessione termostato Bluetooth** (Web Bluetooth, servizio environmental_sensing 0x2A6E, best-effort con inserimento manuale di fallback), e **memoria temperatura impasto per ricetta** con consiglio di correzione il giorno dopo. Backend: `GET/POST /api/recipe-temp`.
- **Orologio sempre visibile** nell'header.
- **Ricette italiane → impasto DIRETTO**: convertite 7 ricette italiane quotidiane (Cuore Italiano, Rustico Noci e Uvetta, Dolce Cipolla, Verde Canapa, Focaccia Barese, Friselle Pugliesi, Puccia Salentina). MANTENUTE indirette (lievito madre) per tradizione: Panettone, Pane di Altamura DOP, Pane di Matera IGP.
- **Panettone Millebolle → "Panettone Mikilab"**; creati **10 gusti** (stessa ricetta base, sospensioni diverse): Uvetta e Canditi (Classico), Cioccolato e Noci, Pistacchio e Cioccolato Bianco, Pere e Cioccolato, Fichi e Mandorle, Arancia e Cioccolato Fondente, Amarena e Cioccolato, Caffè e Nocciola, Marron Glacé, Frutti di Bosco. Totale ricette: **34**.

## BACKLOG dopo v13
- Redesign a colori completo IT/DE (design_agent) su tutta l'app.

## v14 (2026-08) — Panettoni completi, etichette, ricette DE
- **Panettoni**: ripristinati gli arricchimenti base (zucchero, tuorlo, burro, miele, pasta d'arancia) su tutti i 10 gusti + sospensioni specifiche; **acqua ridotta** dove ci sono paste/frutta sciroppata; **zucchero ridotto a 34%** dove la sospensione è già molto dolce (Classico, Arancia candita, Amarena, Marron Glacé); **costo a pezzo** calcolato e salvato (`costing`) per ogni gusto (~€3.24–4.09/pezzo).
- **Etichette Panettoni stampabili** (nuovo tool Maestro `PanettoneLabels.jsx` + CSS `@media print`): un'etichetta per gusto con logo, tricolore IT/DE, sospensioni e costo/pezzo; pulsante Stampa (window.print).
- **Nuove ricette DE (bozze col metodo di Michele)**: **Gnetze Brot** e **Wurzelbrot** (indiretto + LM/poolish + Miglioratore, cella 16°C). Totale ricette: **36**.
- Tool Maestro ora: Capo Laboratorio, Termostato & Clima, Etichette Panettoni, + esistenti.

## BACKLOG dopo v14
- Redesign a colori completo IT/DE su tutta l'app (design_agent).
- Rifinitura dosi/passaggi di Gnetze Brot e Wurzelbrot da parte di Michele.

## v15 (2026-08) — Prezzi B2B, foto realistiche per tutte le ricette
- **Prezzi B2B panettoni**: calcolati e salvati (`costing.cost_500g/100g`, `b2b_500g/100g`) prezzi di vendita consigliati per bar/ristoranti (500 g ~€7-8,50 · 100 g ~€2,50-3). Mostrati nelle etichette e nella scheda ricetta (accanto al costo).
- **Etichette Panettoni** aggiornate: immagine del gusto + prezzi B2B 500g/100g, accenti tricolore IT/DE, pronte da stampare.
- **Foto realistiche per TUTTE le 36 ricette** (generate con Nano Banana, stile fotografico non-AI): 10 panettoni in forme rosse (500g + mini 100g) + 26 pani/prodotti; scaricate in `/app/frontend/public/recipes/` e collegate (image_url). Miniature aggiunte nelle righe della lista ricette.
## v17 (2026-08) — Categorie ricette, bio in due parti, mobile
- **Categorie & ordine ricette** (RecipeList): raggruppate con intestazioni nell'ordine Backmittel → Lievito Madre → Panettoni → Pane → Panini & snack (categoria calcolata da nome/preferment).
- **Bio in due parti**: 1) cosa è Mikilab (ricette + metodi, uso in panificio e a casa col Maestro, scansione ricetta, diagnosi difetti, riconoscimento macchine, Capo Laboratorio); 2) "Chi sono" (Michele). Chiarito: usa TUTTE le farine, il farro/Dinkel è il preferito.
- **Mobile**: header reso robusto (brand troncabile, controlli shrink-0, niente overflow con orologio+lingua+tema). Miniature foto nelle righe ricetta.
- Nota: il Listino stampabile è coperto dalle Etichette Panettoni (stampa con prezzi B2B 500g/100g).

## FIX PRODUZIONE (2026-08-19) — Sync ricette idempotente
- Bug: produzione mostrava solo le 3 ricette generiche vecchie perché il seed era "insert-only if empty" → non aggiornava mai il catalogo su un DB già popolato.
- Fix: `seed_mikilab_if_empty(force)` ora fa UPSERT per nome con `SEED_VERSION`; sincronizza tutte le ricette del seed a ogni cambio versione, rimuove le legacy note (`Ciabatta ad Alta Idratazione`, `Pane Rustico al Farro e Miele`), NON tocca le ricette aggiunte dall'utente. Endpoint `/api/seed-mikilab` ora forza il sync. Bump `SEED_VERSION` a ogni modifica di `mikilab_seed_data.json`.
- Azione richiesta: REDEPLOY per applicare in produzione.

## v16 (2026-08) — Scansiona ricetta, Guida metodi, Glossario, News automatiche
- **Scansiona ricetta da foto** (nuovo tool Maestro `ScanRecipe.jsx` + `POST /api/maestro/scan-recipe`): fotografi una ricetta → Claude estrae i campi in JSON → si apre il form pre-compilato, modificabile e salvabile (collezione personale).
- **Guida ai metodi** (`GuidaMetodi.jsx`, accordion bilingue): 4 sezioni spiegate — Poolish, Lievito Madre (con differenza gestione PANE vs PANETTONE), Roggen Sauerteig, Backmittel.
- **Glossario con asterisco** nelle schede ricetta (`GlossaryBox`): spiega termini difficili presenti nel procedimento (bassinage, autolisi, poolish, stockgare, Quellstück, Sauerteig, incordare, appretto, TA).
- **Gnetzbrot e Wurzelbrot rifiniti** con ricette reali (poolish + Weizen/Sauerteig liquido, idratazione ~82%, bassinage).
- **Baguette con Poolish** aggiunta (metodo indiretto, T65, 70%). Totale ricette: **37**.
- **Notizie automatiche**: `Stoccarda` ora è un feed READ-ONLY da `GET /api/news` (Google News RSS, query pane/Bäckerei Stoccarda/Germania/Italia, cache giornaliera). Rimossa l'aggiunta/modifica manuale.

## BACKLOG dopo v16
- Redesign a colori completo IT/DE su TUTTA l'app (sfondi/schede/nav) — design_guidelines.json pronto.
- Listino PDF stampabile completo (tutti i gusti, formati 500g/100g, prezzi B2B).
- Foto con il volto di Michele dove compare una persona (serve conferma della foto giusta).

## v18 (2026-06) — Nomenclatura, riorganizzazione UI a 5 tab, Diagnosi potenziata
- **Nomenclatura impasti (P1 FATTO)**: nel seed `mikilab_seed_data.json` la riga generica del procedimento "rinfresca lievito madre / Sauerteig / poolish" → "rinfresca il lievito madre (o poolish)" per le ricette a LM; per le ricette di SEGALE (Bruno d'Autunno, Gran Riserva) → "rinfresca il Sauerteig (lievito madre di segale)". `Oro di Terra`: notes "Sauerteig 10%" → "Lievito madre 10%". Sauerteig resta solo dove corretto (segale + ricette tedesche Gnetze/Wurzelbrot). SEED_VERSION bumped.
- **Fix "non mi salva le ricette" (P0 FATTO)**: il seed faceva UPSERT per nome e sovrascriveva le modifiche di Michele. Ora `update_recipe` (PUT) imposta `user_edited=True` e `seed_mikilab_if_empty` SALTA le ricette con `user_edited` → le modifiche manuali persistono. NB (per scelta): una ricetta modificata a mano non riceverà più i fix futuri dal seed.
- **Navigazione a 5 tab** (BottomNav): Mikilab · Maestro · Impara · News · Maestro AI (era 4). Fascia tricolore IT/DE mantenuta.
- **Maestro → flusso a 4 STEP** (`Maestro.jsx`): 1) Le tue ricette (Aggiungi, Scansiona) · 2) Piano & quantità (Capo Laboratorio, Piano settimanale, Piano di lavoro) · 3) Laboratorio & forni (Adatta al forno) · 4) Consigli & allarmi (Termostato & Clima, Sveglia lievito). Rimossi da Maestro: Guida metodi, Etichette (→ Mikilab), Principianti (→ tab Impara).
- **Mikilab** ora ha i pulsanti: Lievito madre, **Guida ai metodi**, **Etichette Panettoni** (spostati dal Maestro come sotto-viste). Rimosso il notiziario in fondo (→ tab News).
- **Tab Impara** (`Beginners.jsx`): tips, **i nostri video** (metodo diretto/indiretto), **video dei panettieri famosi** (link YouTube: Fulvio Marino, Bonci, Sara Papa, Lutz Geißler, Brotdoc, Tartine), nota sottotitoli IT↔DE, Quiz del Fornaio.
- **Tab News** (`NewsPage.jsx`): pagina dedicata con hero + feed Stoccarda/Germania/Italia (`GET /api/news`).
- **Tab Maestro AI** (`MaestroAI.jsx`): unisce **Chat** (MaestroSaTutto) e **Diagnosi Foto** (PhotoDiagnosi) in due schede.
- **Diagnosi potenziata** (VISION_PROMPTS): modalità "Difetti e rimedi" (analisi COMPLETA di crosta/mollica/forma/cottura/lievitazione + causa→rimedio per ogni difetto) e "Tutti gli ingredienti" (elenco completo + ricetta probabile con percentuali stimate).
- **AUTH: richiesta e poi ANNULLATA dall'utente** ("Anzi no togli la registrazione"). Nessun login. Playbook JWT/Google recuperati ma NON implementati.
- **UX**: padding inferiore main aumentato (pb-40) per non far coprire i testi dai FAB Radio/Microfono su mobile.
- Testato: iteration_15.json → backend 100%, frontend 100%, 0 errori console.

## v23 (2026-06) — DE ricette personali + pagina legale + header
- **Traduzione DE automatica ricette personali**: `_translate_recipe_de()` (Claude via Emergent key) chiamata in create/update di /api/recipes → riempie name_de/flour_type_de/notes_de/procedure_de. Ora le ricette dell'utente non restano in italiano quando la lingua è DE. Best-effort (try/except, il salvataggio non fallisce mai).
- **Pagina legale** (`LegalPage.jsx`, bilingue IT/DE): scopo organizzativo/didattico, senza lucro; Datenschutz (dati minimi email+nome, cookie tecnico di sessione, no cessione a terzi); contatto noreply@mikilab.de. Link discreto in fondo alla Home (home-legal-link).
- **Header**: aggiunta foto di Michele accanto al logo; sottotitolo nascosto sotto 400px per non sovrapporsi all'orologio.
- ROADMAP completa salvata in `/app/memory/ROADMAP.md` (attesa priorità utente: blocchi a–h).

## v22 (2026-06) — Ricette private in Home
- **Home**: aggiunta sezione **"Le mie ricette private"** (RecipeList collection `personal`), visibile solo se l'utente è loggato.
- **Reset password (Resend)**: RINVIATO — l'utente deve fornire la API key di Resend (re_...) e ha confermato dominio `noreply@mikilab.de`. Playbook pronto; da implementare quando arriva la key.
- **Redesign colori IT/DE audace**: blueprint generato in `/app/design_guidelines.json` (design_agent). Implementazione RINVIATA su richiesta utente ("va bene così"). Da riprendere: sfondi/sezioni con identità IT (verde/bianco/rosso) e DE (nero/rosso/oro) + toni caldi.

## v21 (2026-06) — Auth "leggera", hub Home, tasto Indietro, branding
- **Accesso LIBERO**: nessun login all'avvio. Login (Google + Email/password) richiesto SOLO al momento di **salvare/modificare una ricetta** (handleSave apre il modale login se non autenticato). Maestro e tutte le sezioni sono libere. Backend: `GET /recipes?mikilab` pubblico; `personal` e mutazioni richiedono auth (`optional_user`/`current_user`).
- **Auth**: endpoint `/api/auth/register|login|google/session|me|logout`, cookie `session_token` httpOnly 7gg, primo utente = admin. Mikilab modificabile solo da admin; personali isolate per `owner_id`. Header con pulsante Accedi/Logout. Modale login con chiusura (`auth-close`).
- **Home = hub** (`Home.jsx`): hero Mikilab, CTA "Chiedi al Maestro", **pulsanti per tutte le sezioni** (home-section-*, deep link), 4 concetti espandibili (Cosa fa/Chi sono/Metodo/Serenità) con foto senza volto (bio-dough-2/3, tatuaggio solo sinistro), e **lista ricette** Mikilab.
- **Tasto Indietro**: history pushState/popstate a livello tab (fix: pushState fuori dall'updater di setState via `useRef`, niente doppio push). L'app non si chiude tornando indietro (tranne dalla Home).
- **Branding "Mikilab"**: title/manifest/meta aggiornati.
- **News fuori da Diagnosi**: rimosso il blocco news da `Encyclopedia` (resta solo enciclopedia); news statiche + feed spostati in `NewsPage`.
- **Foto**: 3 immagini generate (tatuaggio solo braccio sinistro, fisico magro, viso non visibile) nelle card concetti.
- **Ricette**: Etichette Panettoni + Guida metodi spostate dentro `Ricette` (utility in alto).
- Deploy: deployment_agent PASS. Testato iteration_16/17/18 (auth, hub, back-button).

## v20 (2026-06) — Riorganizzazione UI elegante + Modulo Operativo + traduzione DE
Barra a 6 voci: **Home · Ricette · Maestro · Impara · Diagnosi · News**.
- **Home** (`Home.jsx`): hub bio + blocco "Pre-impasti e Lieviti" (Lievito Madre/Sauerteig, Poolish, Kochstück/Quellstück, bilingue) + pulsante grande "Chiedi al Maestro" (chat AI) + accessi Guida/Etichette. NIENTE video (spostati in Impara), niente lista ricette.
- **Ricette** (`Ricette.jsx`): accesso diretto alla lista ricette per categorie (Backmittel/LM/Panettoni/Pane/Panini).
- **Maestro** (`Maestro.jsx`): didascalia guida a 4 passi (Configura Lab → Pianifica Settimana → Genera Piano → Adatta e Cuoci) + griglia di TUTTI gli strumenti a 1 tap (12 strumenti).
- **Benvenuto ad OGNI apertura** (`IntroGuide.jsx`): rimosso il gate localStorage.
- **Prezzi Panettoni rimossi OVUNQUE**: scheda ricetta panettone senza blocco costi/B2B; `PanettoneLabels` senza prezzi (listino + etichette).
- **Traduzione tedesca ricette**: campi `name_de/notes_de/procedure_de/flour_type_de` nel seed (37/37, tradotti via Claude), resi nel frontend con `lib/loc.js` `rLoc()`. Nomi ingredienti extra tradotti con `ingLoc()` (mappa IT→DE). SEED_VERSION v19b.
- **Diagnosi "Macchine & Guasti"** (VISION_PROMPTS['macchine']): lettura codici errore/Störung/allarmi da foto del display + spiegazione + rimedi passo-passo.

### Nuovo Modulo "Organizzazione Operativa Laboratorio" (strumenti Maestro)
- **Produzione Inversa** (`BackwardScheduler.jsx`): input orario fine/apertura → scansione oraria a ritroso per ogni fase (rinfresco/pre-impasti, impasto, puntata, formatura, appretto, cottura), durate editabili, sveglie dinamiche (voce + notifica).
- **Lista Spesa** (`ShoppingList.jsx`): dal piano settimanale calcola farine per tipo/W, acqua, prefermento, sale ed extra in kg/g, con condivisione.
- **Turni & Mansioni** (`ShiftRoles.jsx`): assegna ruoli (Impastatrice/Formatura/Forni/Celle/Pulizie/Vendita) e compiti; persistenza localStorage.
- **Check-list Laboratorio** (`Checklists.jsx`): 4 schede interattive (Apertura/Chiusura/Celle&Frigo/Manutenzione) con spunte persistenti e reset.
- Testato: iteration_16.json → backend 19/19, frontend 0 bug/0 errori console. Design fix: padding inferiore pb-48 (FAB), ingredienti extra tradotti in DE.
- File non più usati (lasciati): Mikilab.jsx, MaestroAI.jsx.

## v18.1 (2026-06) — Diagnosi di nuovo come tab dedicata
- Feedback utente: non trovava la sezione "scansiona difetti e ingredienti" (era stata annidata in "Maestro AI").
- Fix: navigazione riportata a 6 voci → Mikilab · Maestro · **Diagnosi** (Camera) · Impara · News · **Chiedi** (chat). Rimosso il wrapper MaestroAI dall'uso (file lasciato inutilizzato). Aggiunte chiavi nav_chiedi (IT/DE), aggiornato VoiceAssistant NAV (foto/chiedi). Verificato compile + screenshot. Da ripubblicare per la produzione.

## BACKLOG dopo v18
- Redesign a colori completo IT/DE su TUTTA l'app (design_agent).
- (Opz.) Modo per resettare `user_edited` così i fix futuri del seed tornano ad applicarsi.
- (Se richiesto di nuovo) Login Google + Email (playbook pronti).



---
## Changelog — 20 Giugno 2026 (Capo Laboratorio avanzato + Condivisione/PWA)

### Capo Laboratorio (piano intelligente)
- Piano generato in DUE FASI (phase=weekly → phase=daily) per evitare il troncamento del proxy a 60s. Ogni fase < 60s con evento `done`.
- Selettore GIORNO (Lun–Dom) + g/pz per ogni prodotto; opzione "Usa anche il Piano settimanale salvato" (use_weekly).
- Piano settimanale + quotidiano dettagliato, bilingue reale IT/DE (prompt/context/etichette tradotti quando lang=de; direttiva lingua in apertura e chiusura).
- Lista della spesa settimanale calcolata (farine per tipo, acqua, prefermento, sale, extra) lato frontend (/lib/shopping.js).
- Stampa/PDF (window.print + .print-area) del piano con le RICETTE coinvolte.

### Piano settimanale (WeeklyPlan)
- Nuovi campi destinazione pezzi per prodotto: to_proof (cella lievitazione/oggi), to_fridge (frigo/domani), to_freezer (freezer/resto). Persistiti in weekly_plan.
- Le destinazioni vengono lette dal Capo Laboratorio e rispettate nel piano quotidiano AI.
- Quantità mostrate in kg (fmtQty) invece di grammi grezzi.

### Fornitori / Ordini
- SupplierOrder: lista spesa + ordine via email (mailto, fornitore auto per lingua DE→BÄKO / IT→mulino, modificabile, salvato in localStorage) + directory ~25 fornitori DE+IT (BÄKO, IREKS, Puratos, Lesaffre, mulini IT/DE, canditi, ecc.) con descrizioni bilingui. File: /data/suppliers.js, /components/SupplierOrder.jsx.
- Riusato anche nel tool "Lista Spesa" (ShoppingList.jsx).

### Principianti (pane a casa)
- HomePlanner in Beginners.jsx: planner casalingo semplificato (mode=home) con lista spesa e stampa.

### Home
- Barra CONDIVIDI (WhatsApp, Telegram, Facebook, X, Email, Copia link, condivisione nativa) + tasto INSTALLA APP (PWA beforeinstallprompt, con hint iOS). File: /components/ShareInstall.jsx.
- Cartone animato di Michele (con coppola + tatuaggio avambraccio) in card "Chi sono io" → /public/michele-cartoon.jpg.

### Bio
- bio_about_body (IT+DE) aggiornata: Mikilab nasce nel 2023 dalla gestione di un forno di FARRO (Dinkel), inserimento prodotti italiani, ora messo a disposizione di tutti.

### Fix critici (da iteration_19/20, verificati)
- recipesApi.list resiliente (.catch(()=>[])) → utenti anonimi vedono comunque le ricette pubbliche mikilab.
- Lingua DE su mode=pro risolta (prompt costruito in tedesco).
- Troncamento 60s risolto con generazione a due fasi.

### Testing
- iteration_20.json: backend 87%, frontend 92%. Dopo fix lingua DE verificato via curl (weekly ~19s / daily ~34s, DE integralmente in tedesco).
- deployment_agent: PASS (nessun blocco).

### Note
- Dati di test del weekly_plan rimossi (DB pulito).

---
## Changelog — 20 Giugno 2026 (Vetrina Home + Sottofondo musicale)
- **Vetrina ricette in Home**: griglia 2 per riga con foto grandi (stile vetrina di panetteria), bandiere/colori paese; tap → tab Ricette per i dettagli. Solo ricette Mikilab pubbliche. File: /components/RecipeShowcase.jsx (sostituisce la vecchia lista RecipeList in Home). I dettagli completi restano nel tab Ricette.
- **Sottofondo musicale**: melodia gentile sintetizzata con Web Audio API (nessun file esterno), DIVERSA per ogni sezione (home/ricette/maestro/impara/diagnosi/news → scale, tempo e timbro diversi). Toggle nell'header (icona musica), OFF di default, parte al primo tocco (gesto utente per policy browser). File: /lib/ambientMusic.js, /audio/AmbientContext.jsx; App.js cambia sezione musicale al cambio tab; chiave i18n music_toggle IT/DE.

---
## Changelog — 20 Giugno 2026 (FASE 1 del piano grande di Michele)
- Header: "Il Laboratorio di Michele" sempre visibile + foto cartone; fix orologio che copriva "Mikilab" (nascosto <420px).
- Home riordinata: blocchi (Cosa fa/Chi sono/Metodo/Serenità) in alto → menu sotto (Ricette, Impara, News, Maestro, Diagnosi, Enciclopedia) con "Tocca per aprire". Aggiunta battuta simpatica.
- Rimosse dalla Home: vetrina ricette Mikilab + ricette personali (restano nei tab dedicati).
- Foto ricette nascoste ovunque tranne i Panettoni (RecipeList: lista + dettaglio).
- Nuova sezione ENCICLOPEDIA (bottom nav 7 tab): 10 voci basi (Lievito Madre di segale, Sauerteig, Poolish, Biga, Kochstück, Quellstück, Miglioratore, Malto, Autolisi, Idratazione) IT/DE.
- Microfono ("Parla") e Radio resi evidenti (etichetta + alone animate-ping).
- Musica ambient: aggiunta melodia sezione enciclopedia.
### DA FARE (fasi successive del piano di Michele)
- FASE 2 Ricette: nomi tecnici farine, Miglioratore+malto %, Baguette→Diguette, Lievito Madre=Segale (togliere Sauerteig label), spiegazioni basi, nuove ricette (Wurzel, Gretze, Verde Canapa), Panettone 50/50 + Mille Bolle, ricette personali griglia unica, "aggiungi ricetta" da tutti nel Maestro.
- FASE 3 Capo Lab: tipo impastatrice, celle frigo/lievitazione+foto, piano settimanale con turni+foto, produzione inversa con scelta prefermento+rinfreschi, cambio orario, sveglie per fase (togliere "Sveglia Lievito Madre"), pulizia Piano di Lavoro.
- FASE 4 AI: temp acqua auto, lista spesa nel piano, checklist settimanali, scansione ricette dentro Maestro+foto, Adatta Forno con foto+AI, assistente vocale comandi, ricerca web ricetta+adatta a "Metodo Mikilab", calcolo prezzi, Bluetooth termometro (versione realistica), PIÙ METODI selezionabili (Mikilab/veloce/qualità/diretto/indiretto/poolish/autolisi).

---
## Changelog — 20 Giugno 2026 (FASE 2 parziale — Ricette)
- Miglioratore: ricetta ora "Miglioratore Naturale al Malto" = MALTO PURO (malto d'orzo diastasico), dose 0,5% (max 1%), note "ingrediente più forte". Deduplicata nel DB.
- Nuova ricetta "Panettone Mikilab — Verde Canapa" (canapa alimentare): metodo 50/50 su 2 impasti, MIELE una sola volta alla fine, UOVA aumentate nel 2° impasto, prefermento 18h fino a pH ~4,7-5,0. Con foto semi di canapa.
- Wurzelbrot e Gnetze (Gretze) già presenti nel seed.
- Etichetta prefermento: "Lievito Madre (di Segale)" IT / "Lievito Madre (Roggen)" DE — rimosso "Sauerteig" dove indicava il lievito madre (pf_lm, dc_lm).
- SEED_VERSION → v21-canapa-panettone. 38 ricette mikilab.
### ANCORA DA FARE (Fase 2 restante + Fasi 3-4)
- F2: metodo 50/50 + "Mille Bolle" su TUTTI i panettoni; nomi tecnici farine su tutte; ricette personali in griglia unica; "aggiungi ricetta" da tutti nel Maestro; Diguette (non esiste "Baguette di Farro" nel seed — da creare se serve).
- F3 Capo Lab: tipo impastatrice, celle frigo/lievitazione+foto, piano settimanale turni+foto, produzione inversa scelta prefermento+rinfreschi, cambio orario, sveglie per fase (togliere "Sveglia Lievito Madre"), pulizia Piano di Lavoro, sync piano con celle lievitazione/frigo/freezer.
- F4 AI: temp acqua auto, lista spesa nel piano, checklist settimanali+promemoria sabato, scansione ricette nel Maestro+foto (togliere News da scan), Adatta Forno con foto+AI, assistente vocale comandi ("vai alle ricette", "accendi radio"), ricerca web ricetta+adatta a "Metodo Mikilab", calcolo prezzi (stima media), Bluetooth termometro realistico, PIÙ METODI (Mikilab/veloce/qualità/diretto/indiretto/poolish/autolisi), togliere "Miei Brio Impasto".

---
## Changelog — 20 Giugno 2026 (Impara-hub + Fase 3 Capo Lab avvio)
- Impara + News + Enciclopedia unite in UNA pagina (LearnHub, sotto-schede). Bottom nav ridotta a 5 voci (Home, Ricette, Maestro, Impara, Diagnosi). Enciclopedia non più autonoma.
- Maestro: rimossa voce "Sveglia Lievito Madre".
- Maestro: titolo "Il Maestro" → "Nel tuo laboratorio" (IT) / "In deiner Backstube" (DE).
- Capo Lab: aggiunto TIPO IMPASTATRICE (spirale/1 braccio/forcella/planetaria/tuffante/presa diretta), passato anche al prompt AI.
- Capo Lab: aggiunto tipo cella "Lievitazione Frigo (fermalievitazione)".
### NUOVA RICHIESTA (Sezione 5) — DA PIANIFICARE
- Controllo accessi su INVITO/permesso: Michele decide chi vede quali sezioni (specie Maestro/Laboratorio). Protezione anti-copia contenuti. Feature grande = fase dedicata (auth + ruoli + permessi per sezione).
### RESTA DA FARE (Maestro/AI)
- Celle + caricamento FOTO (AI riconosce), piano settimanale turni+foto, produzione inversa scelta prefermento+rinfreschi, cambio orario primo impasto, sveglie per fase, pulizia Piano di Lavoro (solo COSA PREPARARE+PERSONALE), togliere "Persone al lavoro" e "Miei Brio Impasto", Adatta Forno con foto+AI, temp acqua auto, lista spesa nel piano, checklist+promemoria sabato, scansione dentro Maestro+foto (togliere News), comandi vocali, ricerca web ricetta+Metodo Mikilab, calcolo prezzi, Bluetooth termometro, più metodi.

---
## Changelog — 20 Giu 2026 (Restyling "Il Tuo Laboratorio" + anti-copia)
- Rinominato "Maestro" → "Il Tuo Laboratorio" (nav + titolo, IT/DE "Dein Labor").
- Rimosse didascalie sotto i pulsanti/schede del laboratorio (UI essenziale).
- Protezione contenuti (index.html + index.css): blocco contextmenu/copy/cut/selezione/F12/Ctrl+U/Ctrl+Shift+I, con eccezione input/textarea; immagini non trascinabili.
- Sfondo cartone tematico fisso leggero su ogni pagina (App.js).

## PROSSIMA GRANDE FEATURE — Freemium/Paywall (Stripe) — PIANO PRONTO
Direttiva: PRO sblocca "Il Tuo Laboratorio" + "Diagnosi". Free = consultazione base + landing "Chi sono" + 2 ricette DEMO read-only (no ricalcolo/export). Trial pass 1h/24h (attivazione singola per utente) con countdown in header. Coupon/VIP in admin (accesso gratis illimitato/temporaneo). Tutto server-side: le formule NON vengono inviate in blocco al browser; gating su /api/lab/* e /api/diagnosi/*; frontend riceve solo un flag di accesso.
Stripe: FLOW A (claimable sandbox, nessuna chiave dall'utente). Playbook ottenuto. Prezzi default €9,99/mese, €99/anno (lookup_key pro_monthly/pro_yearly). Login: riusare Emergent Auth (Email+Google) già presente. Webhook Flow A: /api/stripe/webhook. payment_transactions in Mongo. Provisioning sandbox in A1 (job_id già noto). Da implementare + testare in sessione dedicata.

---
## ORDINE SEPARATO (DA FARE DOPO) — Modulo E-COMMERCE / Shop Panettoni ("Coming Soon")
Priorità: DOPO il Freemium/Paywall. Default stato "Coming Soon".
1. Sezione Shop: catalogo panettoni/prodotti da forno. Scheda prodotto: titolo+descrizione, selezione pezzatura (500/750/1000g), varianti sospensione (Classico/Cioccolato/Uvetta/Canditi), galleria HD. Carrello + checkout con calcolo spedizione per peso/destinazione, pagamenti Stripe + PayPal.
2. "Coming Soon" + interruttore ON/OFF da pannello Admin. In modalità Coming Soon: al posto di "Acquista" mostra form "Lascia la tua email per l'avviso al lancio" (raccolta lead). Vendite reali sbloccate da admin solo dopo inserimento dati fiscali aziendali.
3. Conformità alimentare e-commerce: in ogni scheda campi obbligatori — lista ingredienti completa, ALLERGENI in grassetto, tabella nutrizionale, peso netto, conservazione. Footer shop: "Prodotto da [Laboratorio] per conto di [Marchio]" + note legali recesso/spedizione deperibili.

---
## Changelog — 20 Giu 2026 (Paywall Fase 1 — backend Stripe)
- Provisioning sandbox Stripe (account acct_1U6Q6D8mKQQsGy1M, paese DE). Chiavi in backend/.env (STRIPE_SECRET_KEY/PUBLISHABLE_KEY/ACCOUNT_ID/WEBHOOK_SECRET/MODE). Onboarding claim URL dato all'utente.
- setup_stripe.py: piani PRO creati — pro_monthly €9,99, pro_yearly €99 (EUR).
- server.py endpoint: POST /api/subscription/checkout (Checkout subscription, coupon via allow_promotion_codes), GET /api/subscription/status?email, POST /api/webhook/stripe (checkout.session.completed → entitlements.pro=true; subscription.deleted → pro=false). Collezioni: payment_transactions, entitlements. TESTATO: checkout ritorna URL+session_id.
- stripe SDK in requirements.txt.
### PAYWALL — ANCORA DA FARE (prossima sessione)
- Frontend: pulsanti Abbonati (mensile/annuale) → checkout; pagina success/cancel; badge PRO.
- Trial pass 1h/24h (attivazione unica per utente) + countdown in header (backend: entitlements con source=trial + expires_at, endpoint /api/trial/activate).
- Gating server-side reale di /api/lab/* e /api/diagnosi/* (legare a utente loggato, non email in query — HARDENING).
- Ricette "assaggio" (mostra solo parte ingredienti se non PRO) + landing "Chi sono" + 2 demo read-only.
- Admin: generazione coupon/inviti VIP (usare Stripe Promotion Codes 100% + grant manuale _grant_from_email con days).
- PayPal come secondo provider.

---
## Changelog — 20 Giu 2026 (Paywall Fase 2 — frontend + trial)
- Backend: POST /api/trial/activate (1h/24h, attivazione unica per email → entitlements source=trial + expires_at + trial_used). /api/subscription/status ora ritorna pro/source/expires_at/trial_used. TESTATO.
- Frontend: PaywallGate.jsx avvolge Maestro ("Il Tuo Laboratorio") e PhotoDiagnosi in App.js. Mostra: login se anon, altrimenti pulsanti abbonamento (monthly/yearly) → checkout Stripe, prova gratis 1h/24h, countdown se prova attiva. VERIFICATO a schermo.
### PAYWALL — RESTA (prossima sessione)
- HARDENING: gating SERVER-SIDE reale delle API del laboratorio (ora il blocco è a livello di UI/tab; legare entitlement all'utente loggato via sessione invece che email in query).
- Ricette "assaggio" (solo parte ingredienti se non PRO) + landing "Chi sono" + 2 demo read-only.
- Admin: pannello coupon/inviti VIP (Stripe Promotion Codes + _grant_from_email con days).
- PayPal secondo provider. Badge PRO in header. Gestione ritorno success/cancel da Stripe (?sub=success).

---
## v24 (2026-06) — Blindatura server, Ricette Assaggio, Admin VIP, Reset password
- **BLINDATURA SERVER (P0 FATTO)**: entitlement PRO derivato dalla SESSIONE (non più email dal client). Helpers `user_is_pro`/`require_pro`/`require_admin`. API protette: `/api/maestro/vision` e `/api/maestro/scan-recipe` (require_pro → 401 anon / 403 non-PRO); `/api/capo/plan` con `mode=="pro"` richiede PRO, `mode=="home"` resta pubblico; `/api/maestro/chat` pubblico. `subscription/status`, `trial/activate`, `subscription/checkout` ora usano l'email della sessione. **Admin = sempre PRO**. Fetch streaming frontend con `credentials:"include"`. Verificato: 25/25 pytest (test_iter21_paywall.py).
- **RICETTE ASSAGGIO (P1 FATTO)**: `GET /api/recipes` (mikilab) per NON-PRO ritorna versione "assaggio" (`locked:true`, niente procedure/notes/work_phases/extra_ingredients/costing) — ingredienti base visibili. Frontend: icona lucchetto nella lista (`recipe-locked-<id>`), card teaser nella scheda (`recipe-teaser-<id>`) con CTA "Sblocca con PRO" (`recipe-unlock-<id>` → checkout mensile o login). Admin/PRO vedono tutto.
- **ADMIN COUPON/VIP (P1 FATTO)**: `GET /api/admin/entitlements`, `POST /api/admin/grant` {email, days?(null=illimitato)}, `POST /api/admin/revoke` (solo admin). UI: pulsante corona nell'header (`admin-btn`) → `AdminPanel.jsx` (regala PRO illimitato/7/30/90/365 gg, lista accessi, revoca).
- **RESET PASSWORD via RESEND (P2 FATTO)**: `POST /api/auth/forgot-password` (token 1h in `password_resets`, email HTML IT/DE via Resend, anti-enumeration) + `POST /api/auth/reset-password` (aggiorna hash, invalida sessioni, cancella token). UI: link "Password dimenticata?" in AuthScreen (`auth-forgot-link` → `forgot-sent`), schermata `ResetPassword.jsx` via `/?reset=<token>` (`reset-screen`). RESEND_API_KEY + SENDER_EMAIL=noreply@mikilab.de in backend/.env. Dominio mikilab.de verificato su Resend → email consegnate.
- **FIX**: IntroGuide non viene più renderizzato quando c'è `?reset=` (prima l'overlay Radix bloccava i click sulla schermata reset).
### RESTA DA FARE (Paywall)
- PayPal come secondo provider — **BLOCCATO**: account PayPal business dell'utente sospeso per alcuni giorni (2026-06). Piano concordato: PAGAMENTO SINGOLO A TEMPO (€9,99=30gg PRO, €99=1 anno PRO) via PayPal REST Orders (create+capture, redirect come Stripe), grant via `_grant_from_email(email,"paypal",days)`. Serve Client ID + Secret da developer.paypal.com quando l'account si riattiva.
- (Opz.) 2 ricette DEMO completamente sbloccate come vetrina.
- Badge PRO nell'header; gestione visiva ritorno `?sub=success`.
- NB: modifiche in PREVIEW → serve REDEPLOY per mikilab.de.

---
## v25 (2026-06) — FASE 1 direttiva globale (UI + valore paywall)
Direttiva completa salvata in `/app/memory/DIRETTIVA_GLOBALE.md` (10 punti, 5 fasi).
- **Rename "Maestro" → "Il Tuo Laboratorio"** ovunque (nav, gate_sub login, voice_nav, bio_welcome, Home concept). Resta SOLO nella chat AI ("Chiedi al Maestro"). TODO F2: rinominare la ricetta "Bretzel del Maestro".
- **Home didascalie**: nuovo blocco `home-audiences` (Per professionisti · Il Tuo Laboratorio / Per chi inizia · Sezione Principianti) + sottotitolo su ogni sezione del menu.
- **Paywall "Guarda cosa fa"**: `PaywallGate` ora mostra l'anteprima funzioni (`paywall-preview`, card titolo+descrizione) PRIMA di prezzo/prova, adattata per sezione via prop `feature` (lab/diagnosi/beginners).
- **Sezione Principianti sotto paywall**: `LearnHub` avvolge Beginners in PaywallGate (feature=beginners). News + Enciclopedia restano LIBERE.
- **2 ricette DEMO complete** (vetrina non-PRO): "Cuore Italiano" + "Panettone Mikilab — Uvetta e Canditi (Classico)" via `DEMO_RECIPE_NAMES` in server.py.
- Test iteration_22: backend 100% (8/8), frontend 95% → corretto bug HIGH (ternario didascalia "Ricette" invertito) e copy paywall Principianti.
- PAGAMENTI: PayPal → account `michelecip918@gmail.com`, BLOCCATO (account sospeso). Carta di credito: gestita da Stripe (mai chiedere il numero all'utente).
### FASI SUCCESSIVE (vedi DIRETTIVA_GLOBALE.md)
- FASE 2: doppia nomenclatura ricette (nome reale) + correzione catena del freddo per tipologia (sfoglie 2-4°C, panettoni 24-28°C, misti).
- FASE 3: miglioratore 0,3% auto, smistamento celle non ridondante, notifica email soglia freezer.
- FASE 4: PayPal (a sblocco) + eventuale lingua EN. FASE 5: E-commerce Shop + Academy "Coming Soon".

---
## v26 (2026-06) — FASE 2/3 + Shop + Owner admin
- **Nomi reali ricette (1a)**: campo `real_name`/`real_name_de` (Recipe/Create/Update). Proposta automatica su ~18 ricette fantasia (script apply_phase2.py), MODIFICABILE dall'admin nel form (recipe-realname-input). Mostrato sotto il nome fantasia in lista+dettaglio.
- **Catena del freddo (2c)**: rimossa regola generica 16°C/6h. LM tiene 16°C; sfoglie→frigo 2–4°C; non-LM→ambiente ~24-26°C; panettoni→nota 24-28°C+capovolto. SEED_VERSION bump → re-sync.
- **Avviso Freezer (3)**: strumento "Scorte Freezer" in Il Tuo Laboratorio + endpoint /api/freezer; email di avviso all'email dell'UTENTE loggato quando scende sotto soglia (Resend).
- **Shop & Academy (4e)**: pagina Shop da Home (catalogo panettoni+corsi, "In arrivo", lista d'attesa email), toggle admin (admin-shop-toggle), immagini reali. Endpoints /shop/products, /shop/waitlist, /admin/shop/*.
- **OWNER admin**: michelecip918@gmail.com + admin@mikilab.de sempre admin (vedono tutto) via OWNER_EMAILS + promozione in current_user.
- **FIX post-test (iter23)**: PUT /recipes ora ri-traduce solo se cambiano i campi tradotti (salvataggio real_name da 8-24s → 0.09s); pulsante Salva con stato di caricamento; immagini Shop reali; toggle Shop ora ha effetto sulla pagina pubblica; casing admin.
- Test: backend 100% (iter23, 23/23), frontend 100% flussi. sw.js → v4 (forza refresh cache al redeploy).
- PROMEMORIA: preview ≠ produzione. mikilab.de si aggiorna solo con REDEPLOY dopo le modifiche.

## v27 (2026-06) — Riordino/rinomina moduli "Il Tuo Laboratorio"
Griglia riordinata per priorità d'uso quotidiano (Maestro.jsx TOOLS) + rinomini (IT/DE in translations.js):
1.Produzione Oggi(lavoro) 2.Calcolo Orari d'Inizio(inversa) 3.Parametri Forno(adatta) 4.Programma Settimana(settimana) 5.Check-list Laboratorio(check) 6.Lista della Spesa(spesa) 7.Turni & Mansioni(turni) 8.Giacenze Freezer(freezer) 9.Aggiungi Ricetta(aggiungi) 10.Scansiona Ricetta(scan) 11.Meteo & Laboratorio(termo, ex Termostato&Clima) 12.Impostazione Macchine(capo, ex Capo Laboratorio).

## v28 (2026-06) — Foto reali Home/Shop + didascalie Metodo e Laboratorio
- **Foto reali**: schede concetto Home ora usano le foto reali di Michele (cosa→bio-dough, chi→bio-photo, metodo→bio-dough-2, serenita→bio-dough-3). Shop usa foto reali locali dei panettoni (/recipes/pan_classico|pan_cioc_noci|pan_pistacchio.jpg) e pani (r_panettone_base, r_cuore). Reseed shop_products.
- **"Il mio Metodo"** (scheda Home concetto metodo): testo aggiornato al testo esatto fornito (IT+DE).
- **Didascalia "Il Tuo Laboratorio"** (card professionisti home-audiences): "Piano di produzione giornaliero/settimanale, calcolo costi, gestione celle e pulizie, affiancato dall'IA per rigenerare impasti e processi." (IT+DE).

## v29-30 (2026-06) — Riorganizzazione Ricette + Basi + Miglioratore unico
- **Categorie Ricette** (campo `menu_category`): ordine fisso Basi & Lieviti → Pane → Panini e Snack → Panettoni. RecipeList raggruppa per categoria (recipeCategory usa menu_category, regex solo fallback). Basi in ordine: Miglioratore Naturale Pro, Lievito Madre, Lievito Madre di Segale, Poolish, Kochstück.
- **Miglioratore Naturale Pro** (unico): create scheda esatta (lupino 1%, malto diastasico 0,5%, psillio 0,5%, vit.C 0,02%, uso 2%). Eliminate vecchie ("Miglioratore Naturale al Malto") via SEED_RETIRED_NAMES. Sostituito in tutte le ricette: extra_ingredient "Miglioratore Naturale Pro (2% sul peso della farina)".
- **Nuove basi**: Lievito Madre, Lievito Madre di Segale, Poolish, Kochstück (con Haferflocken) — bozze professionali (script apply_phase_recipes.py). Tot ricette 38→43.
- **Brezel**: "Bretzel del Maestro" rinominato "Brezel" (classico) + nuovo "Brezel Integrali" (Farina Integrale + Miglioratore Pro 2%). Fix id duplicato (v30).
- **Vollkorn→Farina Integrale** in tutti i testi ITALIANI.
- **Guida Metodi** (Enciclopedia): 5 basi in cima nell'ordine corretto + testo "Miglioratore Naturale Pro al 2% per Diretto e Indiretto".
- **Home "Il Tuo Laboratorio"**: rimossa parola "Panettone" dalle didascalie (→ impasti/produzione). Card Ricette: 38→43.
- Panini e Snack = Taralli, Friselle, Puccia, Focaccia. Test iter24: 14/14 pytest verdi; frontend ordine categorie OK (IT+DE). SEED_VERSION v30.

## v31 (2026-06) — Testi Home, promo, avatar 3D, Licoli
- Testi esatti Home (CONCEPTS): "Cos'è MikiLab", "Il Mio Metodo" (preferenza indiretto), "Lavorare in Serenità" — IT+DE. Blocchi restano espandibili (scelta: meglio per chi lavora).
- Nuovo blocco promozionale Home (`home-promo`) con testo esatto (IT+DE) + avatar.
- Avatar 3D cartone generato dalla foto reale di Michele (coppola, maglia logo ML) → /public/michele-avatar.jpg; usato in promo e card "Chi sono".
- Ricetta base rinominata "Lievito Madre / Licoli (Liko)" con gestione a % aumentata (25-35%); aggiornata anche in Guida Metodi (Enciclopedia). SEED_VERSION v31.
- RESTA (media directive): estendere foto/avatar a TUTTE le sezioni (Laboratorio, Diagnosi, News/Enciclopedia, Guida Metodi, schede ricetta); swap logo forno → "ML" sulla foto del forno (da confermare quale asset è quella del forno). Asset caricati: item2=volto(coppola), item5/3/9=da verificare.

## v32 (2026-06) — Direttiva v7.8 (Panettoni, Farro, LiCoLi, Avatar, Modali, Video)
- **FASE A UI**: blocchi Home ("Cos'è MikiLab", "Il Mio Metodo", "Lavorare in Serenità", "Chi sono io") ora sono FINESTRE MODALI (Dialog, data-testid `concept-modal-<id>`), non più accordion. Video YouTube (Beginners) in container 16:9 `rounded-2xl overflow-hidden`, senza picture-in-picture (`VideoEmbed`, testid `beg-course-video-<i>`/`our-video-frame-<id>`).
- **FASE B Panettoni** (`RecipeList.jsx` → `PanettoneStructure`): per ogni panettone (PRO/admin) struttura obbligatoria — Scheda Gestione Lievito Madre (tabella pH: bagnetto 28°C pH3,9 · 2° rinf. pH4,1-4,3 · legato 16°C 16-18h), Tabella Ingredienti 1°/2°/Totale + % sul peso farina, Modulo Glassa automatico (Zucchero 54,55% … Albumi 18,18%, input grammi totali). Bottone **"Converti in Farro"** dinamico (testid `farro-toggle-<id>`): idratazione -4%, banner tecnico (`farro-banner-<id>`), titolo → "Panettone al Farro …". NON crea ricette nel DB.
- **Rinomina Panettoni**: seed → "Panettone Artigianale MikiLab — [Gusto]" (11 gusti), rimosso il generico "Panettone Mikilab". SEED_VERSION `v32`; vecchi nomi in SEED_RETIRED_NAMES; DEMO_RECIPE_NAMES aggiornato. Reseed OK: 42 ricette totali.
- **Punto 3 LiCoLi/Poolish** (solo Capo Laboratorio): selettore `capo-preferment` (solido/LiCoLi/Poolish/lievito birra) + banner `capo-preferment-banner`; backend `CapoPlanRequest.preferment_choice` → il prompt AI riduce l'acqua scomputando il prefermento al 100% di idratazione.
- **FASE C Avatar (Punto 4)**: generato avatar 3D che somiglia a Michele con logo ML sulla polo (`/public/michele-avatar.jpg`) + foto reale editata (collega rimosso, logo ML) (`/public/michele-photo.jpg`). Componente `MikiAvatar`/`HeroAvatar` inserito in Ricette, Il Tuo Laboratorio, Diagnosi, News, Enciclopedia, Guida Metodi.
- **Card Home in alto**: mostra l'AVATAR cartoon con titolo "MikiLab Avatar" / "Il tuo compagno digitale 🇮🇹🇩🇪". **Ricette**: la FOTO REALE di Michele (con logo ML) è la copertina (heroImage).
- Testato iteration_25: backend 4/4 pytest, frontend tutti i flussi OK, 0 bug.

### RESTA (Direttiva v7.8): 
- Punto 5: scheda ricetta dedicata "LiCoLi (Lievito in Coltura Liquida)" separata dal "Lievito Madre solido" in Basi & Lieviti (oggi combinata "Lievito Madre / Licoli (Liko)"; l'Enciclopedia già la documenta).

### NUOVO BLOCCO richiesto dall'utente (da fare, TRILINGUE):
1. Popup di benvenuto con avatar + trilingue (🇮🇹 IT | 🇩🇪 DE | 🇬🇧 EN), titolo "La Tua Guida alla Panificazione", CTA "Inizia Ora".
2. Header pulito: solo logo grafico (no testo sovrapposto), orologio, chip lingua IT|DE|EN, tasto Accedi a destra.
3. Audio: rimuovere icona altoparlante dall'header; sostituire i suoni con sottofondo d'ambiente (scoppiettio forno/legna); attivazione solo in "Radio"/Impostazioni.
4. Tasto "Installa App" (PWA) fuori dalla bottom nav → dentro menu Accedi/Profilo o banner discreto al primo accesso.
NB: introduce la lingua EN (oggi solo IT/DE) → i18n esteso = fase dedicata.

## v32.1 (2026-06) — Home card "finto video" animato
- Card in alto Home = scena animata (framer-motion, opzione B): avatar cartoon con zoom morbido (ken-burns), icone Smartphone e PC che fluttuano, fumetti di testo a rotazione (IT/DE) che spiegano l'app. Titolo "MikiLab Avatar / Il tuo compagno digitale". `HomeAvatarScene` in Home.jsx (testid `home-founder-photo`, `home-scene-bubble`). Nessun audio (scelta utente). Foto reale resta copertina in Ricette.

## v33 (2026-06) — Trilingue (EN), header pulito, suono del forno
- **EN (trilingue)**: `LanguageContext` rileva e supporta `en`; aggiunto dizionario `translations.en` CURATO (nav, home, header, intro, azioni base) con fallback all'italiano per le chiavi mancanti e per le stringhe inline `lang==='de'?...:...` (limite noto: EN parziale, da completare). Chip lingua header ora IT|DE|EN.
- **Popup benvenuto trilingue** (`IntroGuide.jsx` riscritto): avatar + titolo localizzato ("La Tua Guida alla Panificazione" / "Your Baking Guide" / "Dein Backleitfaden"), saluto, descrizione, chip lingua IT/DE/EN (testid `intro-lang-<id>`), CTA "Inizia Ora →".
- **Header pulito** (`Header.jsx`): rimossi avatar Michele + testo "Mikilab/sottotitolo" sovrapposti e l'icona audio (music-toggle). Resta: logo grafico, orologio, chip lingua, theme, admin(se admin), Accedi.
- **Suono del forno** (`lib/ambientMusic.js` riscritto): niente più melodie per sezione; ora scoppiettio del forno a legna (brown-noise filtrato passa-basso + crepitii bandpass casuali via Web Audio). Toggle spostato NELLA Radio (`ambient-toggle` in RadioFornaio), rimosso dall'header. `setSection` è no-op.
- Verificato via screenshot (nessun errore). RESTA: completare il dizionario EN (molte stringhe ancora IT in fallback).

## v34 (2026-06) — EN completo, banner Installa, scheda LiCoLi, volume forno
- **EN (trilingue reale)**: `translations.en` COMPLETO (666 chiavi = pari a it/de) → tutte le stringhe `t()` ora in inglese. Home resa trilingue anche negli inline: CONCEPTS/JOKES/SCENE_PHRASES con array `en`, helper `L(it,de,en)` per promo, sezioni, card info, link legali, sottotitolo scena. Rilevamento lingua `en` in LanguageContext. LIMITE NOTO: alcune schermate secondarie (AdminPanel, AuthScreen, Shop, FreezerStock, scheduler, ResetPassword, CapoLaboratorio) hanno ancora stringhe inline `de?..:..` che in EN ricadono sull'italiano — da rifinire se serve.
- **Banner Installa App** (`InstallBanner.jsx`, montato in App.js): banner discreto e dismissibile al primo accesso (localStorage `mikilab_install_dismissed`), usa `beforeinstallprompt`, fuori dalla bottom nav. Chiavi `install_banner_title` (it/de/en).
- **Scheda LiCoLi**: base "Lievito Madre / Licoli (Liko)" rinominata "Lievito Madre Solido" + nuova ricetta dedicata "LiCoLi (Lievito in Coltura Liquida)" (rinfresco 1:1:1, pH 4,1-4,3, note su scomputo acqua 100%). SEED_VERSION v34, vecchio nome ritirato. Ora 43 ricette. BASI_ORDER aggiornato.
- **Volume forno**: `ambientMusic.setVolume()`, esposto da AmbientContext; slider `ambient-volume` nella Radio (compare quando l'ambient è ON).
- Testato iteration_26: backend 8/8, frontend tutti i flussi + regressioni (panettoni, farro, auth) OK, 0 bug.

## v35 (2026-06) — Miglioratore a 5 ingredienti + dedup + Poolish/Segale arricchite
- **Miglioratore Naturale Pro** ora a 5 INGREDIENTI con malto specificato: Malto d'orzo diastasico 0,5% · Farina di lupino dolce 1% · Acerola in polvere (Vit. C naturale) 0,3% · Farina di lino dorato 2% · Buccia di psillio 0,5%. Note aggiornate (tipo di malto = malto d'orzo diastasico, azione completa, dosaggio 2-4%). real_name "Miglioratore universale (5 ingredienti)".
- **Fix duplicati**: aggiunto DEDUP nel seed (`seed_mikilab_if_empty`): per ogni nome del seed tiene UNA sola scheda (rimuove i doppioni non user_edited). Testato su preview: 4 Miglioratore → 1. In PRODUZIONE i 4 duplicati verranno rimossi al prossimo Redeploy (SEED_VERSION v35).
- **Poolish** e **Lievito Madre di Segale** arricchite con struttura dettagliata come LiCoLi: note (descrizione + dosaggio + scomputo acqua), procedimento numerato con maturazione/controllo (Segale: pH 3,5-3,8; Poolish: dosi lievito per ore).
- Verificato via DB + screenshot (43 ricette, dedup OK, 5 ingredienti presenti).

## v36 (2026-06) — Malto puro + EN esteso a quasi tutta l'app
- **Miglioratore**: malto impostato su "Malto puro in polvere" al 3% (come da etichetta utente). SEED_VERSION v36, reseed OK (43 ricette). Dedup attivo → in produzione resterà 1 sola scheda dopo Redeploy.
- **EN esteso**: helper `tri(it,de,en)` in LanguageContext. Convertiti al trilingue: Home (già), AuthScreen (login/registrazione/recupero password), ResetPassword, Shop, RecipeList (farro/teaser/PRO + struttura panettone: LM, 1°/2°/Totale, glassa), CapoLaboratorio (prefermento + tabella dosi), FreezerStock, BackwardScheduler, ShiftRoles, Checklists, SupplierOrder, ShoppingList, RecipeDialog, RecipeShowcase, Maestro, date locale (en-GB). Dizionario t() già completo (666 chiavi).
- **RESTA in fallback IT per EN** (contenuti array o schermate admin): AdminPanel (solo admin), glossario ricette, voci Enciclopedia/GuidaMetodi/ROLES (array it/de). Da tradurre se richiesto.
- Verificato: compilazione pulita, switch EN OK su nav/Home/ricette; nessun errore runtime.

## v37.1 (2026-06) — Fix layout/tipografia Home + FAB
- **Blocchi Home tornano ACCORDION** (richiesta utente, annulla il modal di Punto 6): i concetti si espandono verso il basso (foto + testo) con AnimatePresence; niente più Dialog. testid `concept-block-<id>`, `concept-content-<id>`, `concept-photo-<id>`.
- **Fumetto avatar leggibile**: sfondo scuro semitrasparente (#1A1412/85) + testo bianco bold text-[15px] + ombra + backdrop-blur; icone smartphone/PC spostate in basso a destra (bottom-6) per non sovrapporsi al testo/titolo.
- **FAB Radio/Parla**: da bottom-24 z-50 → bottom-28 z-40 + marginBottom safe-area; BottomNav resta z-50 con paddingBottom safe-area (iPhone). Evita sovrapposizioni su mobile.
- Verificato su viewport 430px: accordion, leggibilità e FAB OK, nessun errore.

## v38 (2026-06) — 4 suoni ambient + 6 nuovi gusti panettone
- **Suoni ambient (Radio)**: `ambientMusic.js` ora sintetizza 4 modalità — fire (scoppiettio forno), rain (pioggia), mixer (impastatrice, ronzio ritmico), morning (mattino, chirp). `setMode()` in ambient + AmbientContext (mode/setMode). Selettore 4 pulsanti in RadioFornaio (`ambient-mode-<id>`) + slider volume. Verificato.
- **6 nuovi gusti Panettone** (17 totali, 49 ricette): Limoncello, Albicocca e Cioccolato, Zafferano, Mela e Cannella, Tiramisù, Cocco e Cioccolato. Clonati dalla base Classico (446 farina, 179 acqua, 140 LM, metodo indiretto 2 impasti) con sospensioni per gusto in extra_ingredients e zucchero bilanciato (34% per gusti dolci, 41% zafferano). Naming "Panettone Artigianale MikiLab — [Gusto]". Glassa automatica dal modulo frontend. SEED_VERSION v38. Verificato render (struttura pH + tabella 1°/2°/Totale + glassa + sospensioni + Converti in Farro). NOTA: procedure_de dei nuovi gusti = fallback testo IT (notes_de tradotte).

## v39 (2026-06) — Foto dedicate + prezzi B2B nuovi gusti
- **Foto per gusto**: generate 6 immagini dedicate (Gemini) e salvate in /public/recipes/ (pan_limoncello, pan_albicocca, pan_zafferano, pan_mela_cannella, pan_tiramisu, pan_cocco). image_url aggiornato per ogni gusto. Verificato: tutte servono 200, 0 immagini rotte in lista.
- **Prezzi B2B per gusto** (costing b2b_500g / b2b_100g): Limoncello 8,0/2,5 · Albicocca 7,5/2,5 · Zafferano 9,5/3,0 · Mela e Cannella 7,5/2,5 · Tiramisù 8,5/2,8 · Cocco 7,5/2,5. Il listino stampabile (Etichette→Listino) legge questi valori.
- SEED_VERSION v39, reseed OK (49 ricette).

## v39.1 (2026-06) — Etichette: foto gusto + fix filtro + prezzi nel listino
- **Bug fix (PanettoneLabels.jsx)**: il filtro cercava il vecchio nome "Panettone Mikilab —" → lista etichette VUOTA dopo la rinomina v32. Corretto in `includes("Panettone") || menu_category==="panettoni"`. Nome sull'etichetta aggiornato a "Panettone Artigianale MikiLab".
- **Foto sull'etichetta**: già presente (usa `r.image_url`); ora i 6 nuovi gusti hanno foto dedicate → l'etichetta stampabile mostra la foto del gusto.
- **Listino con prezzi**: aggiunte le colonne "500 g" e "100 g" alla tabella listino, che leggono `costing.b2b_500g/b2b_100g` (prima mostrava solo il nome del gusto).
- Verificato: immagini servite 200, prezzi per gusto nel DB. L'accesso UI alle etichette è dalla sezione Ricette (non dalla griglia strumenti del Laboratorio).

## v39.2 (2026-06) — Etichette: allergeni + peso netto
- Ogni etichetta stampabile (PanettoneLabels.jsx) mostra ora: foto del gusto, sospensioni, **Peso netto ~1 kg** e riga **Allergeni** trilingue (base: glutine/frumento, uova, latte, frutta a guscio mandorle/nocciole + "può contenere tracce di soia"; aggiunge pistacchi/cocco se presenti nelle sospensioni). testid `label-allergens-<id>`.
- Verificato admin: 17 etichette con foto (tutte caricate), 17 righe allergeni, listino 17 righe con colonne 500g/100g e prezzi. Accesso: Ricette → "Etichette Panettoni" (testid ricette-labels-btn).
- Prezzi B2B impostati da agente (l'utente li aggiusterà); sospensioni dei nuovi gusti restano di default in attesa dei valori esatti dell'utente.

## v40 (2026-06) — FASE 1a: Radio upgrade (Punto 7)
- **Radio**: microfono vocale nel pannello (`radio-voice`) per cambiare stazione a voce (webkitSpeechRecognition, match per nome; "stop/spegni" ferma). Stazioni aggiornate — IT: +Radio Deejay, Radio Kiss Kiss; DE: +Antenne 1 (Stoccarda), +SWR1 BW (oltre a SWR3, Antenne Bayern, bigFM). Verificato: pannello mostra tutte le stazioni + mic, compila.
### DIRETTIVA GRANDE (in corso, ordine concordato A→): 
- FASE1: (7 Radio ✓) · (1) Fotocamera doppia opzione (scatta/allega) OVUNQUE — DA FARE.
- FASE2: (3) fix schede tecniche Croissant/Biga-Vorteig/Brezel Vk1300 · (5) Ricette accordion+ricerca+badge.
- FASE3: (4) restyle palette verde/blu salvia + testi antracite + foto reale figura intera (usare michele-photo.jpg esistente). CONFERMATO su tutta l'app.
- FASE4: (6) i18n dinamico 100%.
- FASE5: (2) Wizard Laboratorio 5 passi (Macchine/Ricette/Produzione/Termostato BT/Dashboard IA-HACCP).

## v41 (2026-06) — FASE 2 direttiva: schede tecniche ricette (P3) + riorganizzazione Ricette (P5)
- **P3A Croissant** (`Cornetto Sfogliato`): batch reale 3,4 kg farina → 96 croissant. flour_grams 3400, water_grams 1840, salt 68 (2%), hydration 54%; aggiunto extra "Uova (Eier)" 5,9% (~200 g). Note: Acqua + Uova = 60% del peso farina. (seed)
- **P3B Biga/Vorteig a 2 fasi** (`Treccia del Sole`, `Carezza Dolce`, preferment=biga): nuovo campo backend `biga` {flour_g,water_g,yeast_g,hours/de/en} (aggiunto a Recipe model + azzerato in `_teaser_recipe`). RecipeDetail ora rende una card "Fase 1 · Vorteig (Biga)" (Farina/Acqua/Lievito + nota maturazione), separatore tratteggiato, poi "Fase 2 · Impasto principale" con farina/acqua RESIDUE (il lievito non è duplicato). Treccia: uova extra portate a 20% (~200 g, era 0%).
- **P3C Brezel Integrali**: Vk (Farina Integrale) 1300 g (era 1000), acqua 500 g, hydration 38%, salt 29 g (2,2% come Brezel classica), note corrette ("Vk 1300 g · Acqua 500 g").
- **P5 Ricette (RecipeList.jsx)**: barra di ricerca (`recipe-search` + `recipe-search-clear`, cerca nome/real_name/farina/note/badge), chip filtro categoria (`recipe-filter-all|basi|pane|panini|panettoni`), categorie come ACCORDION espandibili (`cat-accordion-*` con conteggio+chevron; forzate aperte durante la ricerca), badge sintetici per riga (`recipe-badges-<id>`: LM, LDB, Vk, Rg, Poolish, Biga, numeri farina 300/380/405/550/630/812/1050/1600 + W###) al posto del testo lungo flour_type.
- SEED_VERSION → v42-treccia-uova. Testato iteration_27: frontend 95% → i 2 rilievi (uova 0% Treccia, badge "0" spurio) CORRETTI e riverificati.
### RESTA (direttiva): P1 fotocamera doppia (Scatta/Allega) ovunque · P4 restyle palette verde/blu salvia + antracite (TUTTA l'app) · P6 i18n dinamico 100% (default lingua ancora EN al posto di IT — da rivedere) · P2 wizard Laboratorio 5 passi. NOTA UX: FAB Radio/Parla si sovrappongono alle righe ricetta su mobile (da sistemare col restyle).

## v42 (2026-06) — Blocco 1: fotocamera doppia ovunque + fix crash EN
- **Fotocamera doppia (Scatta/Allega)**: nuovo componente `components/DualPhotoButtons.jsx` (bottoni `{testid}-take` con input `capture=environment` e `{testid}-attach` con input SENZA capture = galleria). Integrato in: PhotoDiagnosi (`photo-*`), ScanRecipe (`scan-*`), AdattaForno modalità Foto (`adatta-*`), RecipeDialog (label `recipe-photo-take`/`recipe-photo-attach`), CapoLaboratorio "Filma il laboratorio" (`capo-film-start` live + `capo-film-attach` allega). Rimosso il vecchio percorso "Cambia foto" solo-fotocamera (i due bottoni restano sempre visibili sopra l'anteprima).
- **FIX CRITICO (crash EN)**: `data/content.js` aveva solo `it`/`de`; con lingua `en` (auto-rilevata da navigator.language) `content[lang]` era undefined → crash React su Diagnosi/News/Impara/Enciclopedia. Aggiunto fallback `content.en = content.it` (EN mostra i contenuti IT finché non tradotti in Blocco 7).
- Testato iteration_28: tutti e 5 i punti fotocamera PASS (capture presente solo su "Scatta", assente su "Allega"; il file-attach avvia preview/scan/analisi). 0 errori nei flussi. Crash EN individuato e corretto.
### RESTA (mega-direttiva rinviata): Blocco 2 Wizard Laboratorio 5 passi · Blocco 3 Bilancia smart IoT + magazzino/scarico + Task Manager turni · Blocco 5 restyle palette verde/blu salvia + antracite + foto reale figura intera · Blocco 7 i18n dinamico 100% (togliere hardcoding, EN completo) · Blocco 8 Academy monetizzazione (corsi+consulenze 1-to-1) · Blocco 9 Sourdough pH tracker Bluetooth + calcolo acqua + WhatsApp. NOTA UX ricorrente: FAB Radio/Parla si sovrappongono alle CTA su mobile (da sistemare col restyle Blocco 5).

## v43 (2026-06) — Punto 9 (parte): Calcolatore Acqua + Sourdough pH Tracker
- **Temperatura Acqua d'Impasto** (`sections/WaterTempCalc.jsx`, strumento Lab `maestro-tool-acqua`): formula del fornaio Acqua = (Impasto×3) − (Ambiente+Farina+Attrito). Input wtc-dough/ambient/flour/friction, output wtc-value con avvisi troppo freddo/caldo. Trilingue.
- **Lievito Madre & pH Tracker** (`sections/SourdoughTracker.jsx`, `maestro-tool-ph`): log manuale pH+temp (localStorage), rileva la finestra ideale per LEGARE i panettoni (pH 4,1–4,3 a 28–30°C) con avviso toast+voce+notifica push, stato "PRONTO", storico, svuota. Bottone Bluetooth best-effort (navigator.bluetooth, fallback manuale) + attivazione notifiche. Trilingue. pH mostrato con toFixed(1).
- Registrati in Maestro.jsx (import + TOOLS + switch). Testato iteration_29: 3/3 aree PASS (formula corretta, niente perdita focus, finestra pH OK, EN senza crash). Fix cosmetico pH (5.0).
### RESTA da fare del Punto 9: **Pulsante floating WhatsApp** (serve il numero di telefono di Michele).
### MEGA-DIRETTIVA 25 moduli — ancora da fare (grandi): Blocco 2 Wizard Lab 5 passi · Blocco 3 Bilancia IoT + Magazzino/scarico + Task Manager turni · Blocco 5 restyle palette + foto reale · Blocco 7 i18n 100% · Blocco 8 Academy (corsi+consulenze) · Punti 10-25 (HACCP export, Food Cost energetico, Marketplace usato, Community B2B, timer rumorosi, meteo IA, etichette UE nutrizionali, PWA offline, onboarding, tracciabilità lotti, anti-spreco, multi-negozio enterprise, Digital Twin impasto, ordini multi-fornitore, Shelf-life IA, QR blockchain).

## v44 (2026-06) — Blocco 5 (palette) + Blocco 7 (italiano di default)
- **Nuova palette globale (verde/blu salvia + antracite + chiaro freddo)**: remap di TUTTI i colori caldi del brand in tutta l'app (script `_repalette.py`, 56 file .jsx/.css/.js). Marrone #B34A26→verde salvia #5E8B7E (hover #4C7368, accento #33564E); oro/giallo #D99B26→blu salvia #6E8CA0 / azzurro polvere #A9C5D4; testo #2C221E→antracite #2B303B, body #4A3B34→#3F4A54, muted #8C7567→#7E8A93; sfondi panna #F5EFE6→#EAF0EC, #FDFBF7→#F6F8F5, bordi #E8DEC8→#D7E1DB; dark mode da marrone caldo a antracite freddo (#1A1412→#1B2127, #2A211D→#232A31, #3D302A→#38424B); tricolore IT/DE (#009246,#CD212A,#FFCE00…) neutralizzato in sage/blu. Aggiornate anche le CSS variables shadcn in `index.css` (:root e .dark: primary sage, accent sage-blue, background/border freddi) e le rgba warm nel markdown. Verde salvia esistente #6B8E62 e blu #3F7CAC/#2E5E82 mantenuti e armonizzati.
- **Foto reale in Home**: hero animato (`HomeAvatarScene`) e card "Chi sono" ora usano la foto reale `michele-photo.jpg` (object-top, viso visibile) al posto dell'avatar cartoon; concept "chi" usa `bio-photo.jpg`. Striscia tricolore hero → gradiente sage→blu. NB: se serve una foto a figura intera specifica, l'utente può caricarla per sostituire michele-photo.jpg.
- **Lingua ITALIANA di default** (`LanguageContext`): rimosso l'auto-rilevamento da navigator.language; ora l'app parte SEMPRE in italiano (la scelta manuale DE/EN resta salvata in localStorage). Risolve la partenza indesiderata in inglese.
- Verificato via screenshot: modale/bottoni sage, testo italiano, foto reale nell'hero; 0 errori console; 0 hex caldi residui. Compilazione pulita.
### RESTA di Blocco 7: consolidamento i18n al 100% (rimozione totale dei testi inline `de?..:..` nelle schermate secondarie: AdminPanel, alcune stringhe Shop/scheduler ecc.) — la copertura t()/tri() è già ampia con fallback EN→IT.
### RESTA mega-direttiva: Blocco 2 Wizard 5 passi · Blocco 3 Bilancia IoT+Magazzino+Turni · Blocco 8 Academy · WhatsApp FAB (serve numero) · Punti 10-25.

## v45 (2026-06) — WhatsApp FAB + Wizard Laboratorio 5 passi + benvenuto "panificio"
- **Benvenuto**: IntroGuide ora dice "…nel mio panificio digitale" (IT) / "digitalen Backstube" (DE) / "digital bakery" (EN), non più "cucina/Küche/kitchen".
- **WhatsApp FAB** (`components/WhatsAppFab.jsx`, montato in App.js): bottone flottante verde → https://wa.me/491601253378 (numero +49 160 1253378) con messaggio precompilato trilingue. Posizionato al CENTRO in basso (`left-1/2 bottom-28`) per non coprire i pulsanti Avanti/Indietro del wizard (che stanno agli angoli). Radio a sx, WhatsApp centro, Parla a dx.
- **Wizard Laboratorio 5 passi** (`sections/Maestro.jsx`): "Il Tuo Laboratorio" ora è un wizard con stepper (`maestro-stepper`, `maestro-step-1..5`), pannelli `maestro-panel-1..5`, navigazione `maestro-prev`/`maestro-next`/`maestro-done`. Passi: 1 Parco Macchine (capo, freezer) · 2 Ricette Personali (aggiungi, scan, adatta) · 3 Pianificazione (lavoro, settimana, inversa) · 4 Termostato & Sensori (termo, acqua, ph) · 5 Dashboard IA & HACCP (spesa, check, turni). Tutti i 14 strumenti preservati; tap apre lo strumento, `maestro-back-btn` torna al wizard. Trilingue.
- Testato iteration_30: struttura/navigazione wizard e href WhatsApp OK (90%); rilevata collisione FAB↔Avanti → RISOLTA spostando il FAB al centro (verificato via screenshot).
### Stato mega-direttiva aggiornato: FATTI → Punti/Blocchi 1,4,5,6 + Wizard(2) + Radio/voce(8-parziale) + Sourdough/Acqua(9-parziale) + WhatsApp FAB(9) + IT default(7-base). RESTANO grandi: Bilancia IoT(3), Academy paywall+consulenze(8), Food Cost(10), Calo peso(11), Meteo(12), Etichetta 1169 nutrizionale(13), Marketplace(17), Onboarding(18), Tracciabilità(19), Anti-spreco(20), Enterprise(21), Digital Twin(22), Ordini multi-fornitore(23), Shelf-life(24), QR/Blockchain(25), i18n 100%(7), menu 6-sezioni(1).

## v46 (2026-06) — Academy (Blocco 8) + Etichetta nutrizionale (P13) + Foto reali/cartoon + WhatsApp rifinito
- **Academy & Servizi** (`sections/Academy.jsx` + backend): 3 corsi video con paywall Stripe (pagamento una tantum, `mode=payment`, price_data EUR dinamico) — `/api/academy/catalog|checkout|checkout/status/{id}|my`, collezioni `academy_orders`/`academy_access`, fulfillment via polling (success_url ?academy=success) + webhook Stripe. Video sbloccato dopo acquisto (gate lato server: video_url solo in /my). **Consulenza 1-to-1** col Maestro (€120): form nome/data/telefono/argomento → checkout Stripe. Montata nel tab `shop`: `<Academy/> + <Shop hideCourses/>`. App parte su tab shop se torna con ?academy=. Testato iteration_31: 5/5 PASS (redirect a checkout.stripe.com verificato, no pagamento reale).
- **Etichetta nutrizionale UE 1169** (`PanettoneLabels.jsx`): tabella valori medi/100 g (Energia 1560 kJ/372 kcal, Grassi 15 g di cui saturi 8,2, Carboidrati 52 di cui zuccheri 28, Proteine 7,2, Sale 0,45) + nomi allergeni ora in GRASSETTO MAIUSCOLO. `label-nutrition-<id>`.
- **Foto**: hero Home/Ricette e "bancone" = foto REALE polo MikiLab (`michele-real.webp`). Foto col cappello → CARTONE (`michele-toon.jpg`, senza scopa, forno pulito, denti bianchi, **orecchino + tatuaggio reale** replicato dalla foto). Avatar 3D (`michele-avatar.jpg`) aggiornato con **orecchino + tatuaggio reale**. Benvenuto IntroGuide usa la foto reale polo.
- **Benvenuto**: "panificio digitale" (non "cucina").
- **WhatsApp FAB**: solo sezioni dedicate — nascosto in Home E nel Laboratorio (wizard); posizione right-4 bottom-44 (sopra "Parla") per non coprire testi/pulsanti. wa.me/491601253378.
### RESTANO grandi: Bilancia IoT(3), Food Cost energetico(10), Calo peso(11), Meteo IA(12), Timer rumorosi(14), Marketplace(17), Onboarding(18), Tracciabilità lotti(19), Anti-spreco(20), Enterprise multi-negozio(21), Digital Twin(22), Ordini multi-fornitore(23), Shelf-life/digeribilità(24), QR/Blockchain(25), i18n 100%(7), menu 6-sezioni(1), Community B2B.

## v47 (2026-06) — Pre-publish: nutrizione per gusto + foto Home su avatar + seed NON distruttivo (deploy PASS)
- **Valori nutrizionali per gusto** (`PanettoneLabels.jsx` → `nutriFor(name)`): classico/cioccolato/pistacchio/cocco/limoncello/albicocca-frutta con valori differenziati per 100 g (Energia, Grassi/saturi, Carbo/zuccheri, Proteine, Sale); allergeni GRASSETTO MAIUSCOLO.
- **Foto Home**: rimossa la foto reale/cappello dalla Home. Home hero + card + welcome (IntroGuide) ora usano l'AVATAR 3D `michele-avatar.jpg` (rigenerato uguale a lui: orecchino + tatuaggio reale, forno pulito). La foto REALE col polo (`michele-real.webp`) resta solo su Ricette (hero "bancone"). File cartone col cappello (`michele-toon.jpg`) non più usato in Home/Mikilab.
- **FIX BLOCKER DEPLOY** (`server.py seed_mikilab_if_empty`): niente più `delete_one` all'avvio. Le schede ritirate e i doppioni vengono NASCOSTI con flag `{hidden:true}` (update, non delete); le ricette valide del seed impostano `hidden:false`; `GET /recipes` filtra `hidden != true`. deployment_agent → **PASS** (nessun blocker, secrets in env, CORS ok, seed upsert-only). SEED_VERSION → v43-hidden-flag. 49 ricette visibili, Cornetto 3400 g OK.
- **Rinviati a domani (per scelta utente)**: video/prezzi corsi reali, PayPal, Bilancia IoT (Punto 3). 
### PRONTO ALLA PUBBLICAZIONE: l'app è deploy-ready. L'utente pubblica dal pulsante Deploy.

## v48 (2026-06) — Bilancia IoT / Smart Scale (Punto 3)
- **Bilancia Smart** (`sections/SmartScale.jsx`, strumento Lab Passo 1 `maestro-tool-bilancia`): tabella ingredienti (target g + peso reale g), rileva lo scostamento; se una pesata supera ±2% ricalcola AUTOMATICAMENTE tutti gli altri ingredienti in proporzione (R = reale/target, altri × R), evidenziando il pivot. Se entro tolleranza mostra "tutto ok". Bottone Bluetooth best-effort (navigator.bluetooth, fallback manuale). Persistenza localStorage. Trilingue. Righe vuote escluse dal risultato, testid cestino, pb-40 per clearance FAB.
- Testato iteration_32: 4/4 PASS (es. Farina 1000→1100 = +10% → Acqua 660, Sale 22, Lievito 11). Rifiniti i 3 rilievi LOW.
### RESTA per l'Academy nutrizione: i valori nutrizionali per gusto attuali sono STIME; sostituirli con i valori reali di laboratorio quando l'utente li fornisce.

## v49 (2026-06) — Food Cost & Energia (Punti 10+11)
- **Food Cost & Energia** (`sections/FoodCost.jsx`, Lab Passo 5 `maestro-tool-foodcost`): costo materie prime (kg × €/kg) + energia (kW × ore × €/kWh, mostra kWh totali) → costo totale; calo peso in cottura (impasto g, calo %, pezzi → peso cotto/pezzo); costo/pezzo e MARGINE % su prezzo di vendita (rosso se negativo). Righe ingredienti/energia aggiungibili/eliminabili, persistenza localStorage, trilingue. Testato iteration_33: 4/4 PASS (default: materie €3,40 + energia 14,4 kWh €5,04 = €8,44; €2,11/pezzo; margine 86%). Nota UX nota: i FAB Radio/Parla si sovrappongono al contenuto durante lo scroll (comune a tutti gli strumenti, LOW).
### Avanzati ancora da fare: Meteo IA(12), Timer rumorosi(14), Marketplace(17), Onboarding(18), Tracciabilità lotti(19), Anti-spreco(20), Enterprise(21), Digital Twin(22), Ordini multi-fornitore(23), Shelf-life(24), QR/Blockchain(25), Community B2B, i18n EN 100%, menu 6-sezioni. Rinviati: video/prezzi corsi, PayPal, valori nutrizionali reali.

## v50 (2026-06) — Onboarding guidato (Punto 18)
- **Onboarding 3 passi** (`components/Onboarding.jsx`, montato in App.js): al PRIMO accesso (localStorage `mikilab_onboarding` assente) mostra un overlay a 3 passi — 1) nome laboratorio + tipo attività (panificio/pasticceria/misto/home), 2) attrezzature (impastatrice/forni/cella/abbattitore, multi-select), 3) cosa produci di più (pane/panettoni/brezel/dolci). Salva il profilo in localStorage. Il benvenuto IntroGuide è soppresso alla primissima sessione (mostrato dalle visite successive) per evitare doppio modale. `getProfile()` esportato per personalizzazioni future della dashboard. data-testid: onboarding, ob-labname, ob-type-*, ob-equip-*, ob-focus-*, ob-next, ob-finish, ob-skip.
- Verificato via screenshot: Passo 1/3 "La tua attività" renderizza correttamente (palette sage, avatar 3D uguale a Michele nell'hero dietro), nessun errore console. Profilazione completa; la personalizzazione visiva della dashboard dal profilo è predisposta (getProfile) e ampliabile.
### Avanzati ancora da fare: Meteo IA(12), Timer rumorosi(14), Marketplace(17), Tracciabilità lotti(19), Anti-spreco(20), Enterprise(21), Digital Twin(22), Ordini multi-fornitore(23), Shelf-life(24), QR/Blockchain(25), Community B2B, i18n EN 100%, menu 6-sezioni.

## v51 (2026-06) — Dashboard personalizzata dal profilo onboarding
- **Banner personalizzato in Home** (`sections/Home.jsx`, `home-personal`): se esiste il profilo onboarding (`getProfile()`), la Home mostra in alto "Ciao, [nome laboratorio]! 👋" + scorciatoie rapide: "Le mie ricette" → tab ricette, e una chip in base al focus (panettoni→"Tracker pH Lievito", pane→"Avvia impasti", altri→"Il mio laboratorio") → tab maestro. Trilingue. Nessun banner se il profilo non c'è.
- Onboarding UI confermata a schermo (Passo 1/3, palette sage, avatar 3D). Banner = resa condizionale (Home rilegge il profilo ad ogni render → appare subito dopo il completamento). Compilazione pulita.

## v52 (2026-06) — Shelf-Life & Digeribilità (Punto 24) + scorciatoia attrezzatura
- **Shelf-Life & Digeribilità** (`sections/ShelfLife.jsx`, Lab Passo 5 `maestro-tool-shelf`): scegli prodotto (pane/panettone/brezel/dolci), inserisci pH finale e ore di lievitazione → giorni di freschezza stimati (staling più lento con fermentazioni lunghe: days=base*(1+min(h,48)/48*0.6)) + bollino "Alta Digeribilità - Fermentazione Controllata" se pH 4,0–4,6 e ≥12 h. Trilingue. data-testid: sl-prod-*, sl-ph, sl-hours, sl-result, sl-days, sl-badge.
- **Scorciatoia attrezzatura in Home** (`home-quick-equip`): il banner personalizzato aggiunge una chip in base all'attrezzatura scelta nell'onboarding — abbattitore/cella → "Shelf-Life & Freschezza"; forno rotativo/statico → "Adatta il forno" (→ Laboratorio).
- Compilazione pulita. Verifica: logica deterministica (default pane/pH4,3/18h → ~4 giorni + bollino Alta Digeribilità).
### PROSSIMO: Anti-Spreco (Punto 20) — ricette di recupero dagli esuberi con ricalcolo margini.

## v53 (2026-06) — Anti-Spreco (Punto 20) + fix overlap FAB wizard
- **Anti-Spreco** (`sections/AntiWaste.jsx`, Lab Passo 5 `maestro-tool-spreco`): inserisci esubero (kg) e costo €/kg, scegli ricetta di recupero (pangrattato 0.7/€4, biscotti 0.9/€12, fette tostate 0.8/€8, budino 1.0/€6) → prodotto recuperato kg, valore recuperato, e GUADAGNO netto (recuperato − costo esubero). data-testid: aw-kg, aw-cost, aw-rec-*, aw-result, aw-recovered, aw-gain. Trilingue.
- Wizard Laboratorio root pb-4 → pb-28 per non far coprire "Completo"/tile dai FAB Radio/Parla.
- Testato iteration_34: 3/3 PASS (Shelf-Life pane 4gg + Alta Digeribilità; Anti-Spreco pangrattato €2,60 guadagno; scorciatoia attrezzatura Home). Unico appunto FAB overlap ora mitigato con pb-28.
### Avanzati ancora da fare: Meteo IA(12), Timer rumorosi(14), Marketplace(17), Tracciabilità lotti(19), Enterprise(21), Digital Twin(22), Ordini multi-fornitore(23), QR/Blockchain(25), Community B2B, i18n EN 100%, menu 6-sezioni. Rinviati: video/prezzi corsi, PayPal, valori nutrizionali reali.

## v54 (2026-06) — Timer Laboratorio (14) + Meteo IA (12) + Marketplace Usato (17)
- **Timer da Laboratorio** (`sections/Timer.jsx`, Lab Passo 3 `maestro-tool-timer`): timer multipli con nome, PRESET di lavorazione (Puntata 90′, Appretto 60′, Cottura 40′, Autolisi 30′, Rinfresco 240′, Raffreddamento 20′) + timer personalizzato. Allarme sonoro FORTE (Web Audio square 880/1320Hz in loop) + overlay schermo LAMPEGGIANTE a strisce (`timer-alarm-overlay`, pulsante `timer-alarm-dismiss`) + vibrazione + Notification browser. Layout a una mano (pulsanti grandi Vai/Pausa/Reset). **Wall-clock**: persiste `endsAt` assoluto in localStorage `mikilab_timers`, calcola il residuo con remainingOf(t)=endsAt−now, riconcilia il tempo reale su mount e visibilitychange, coda multi-allarme. data-testid: timer-preset-*, timer-name, timer-mins, timer-add, timer-card-*, timer-time-*, timer-toggle-*, timer-reset-*, timer-remove-*.
- **Meteo & Laboratorio** (`sections/Meteo.jsx`, Lab Passo 4 `maestro-tool-meteo`): dati REALI via Open-Meteo (nessuna chiave) — geolocalizzazione (`meteo-geo`) o ricerca città (`meteo-city`+`meteo-search`, geocoding Open-Meteo). Mostra temp/umidità/vento (`meteo-current`). Adatta AUTO: acqua consigliata (formula fornaio con temp esterna come ambiente) e tempo di lievitazione stimato (velocità ~×2 ogni 8°C sopra 24°C), + nota umidità (>70% riduci acqua, <40% aumenta). AbortController+timeout 9s sui fetch. data-testid: meteo-temp, meteo-hum, meteo-target, meteo-basemin, meteo-water, meteo-prooftime, meteo-error.
- **Marketplace Usato** (`sections/Marketplace.jsx`, Lab Passo 1 `maestro-tool-market`): bacheca LOCALE (localStorage `mikilab_market`) per attrezzatura usata. Pubblica annuncio (titolo, categoria, condizione, prezzo, zona, descrizione, foto via DualPhotoButtons compressa a max 900px/0.7 jpeg, contatto). Filtri categoria, griglia 2-col, contatto via WhatsApp (default numero Michele 491601253378) o email (mailto) in base al campo contatto. Prezzo Intl.NumberFormat per lingua; try/catch quota con `market-error`. data-testid: market-add, market-form, market-title/cat/cond/price/place/desc/contact, market-photo-*, market-publish, market-filter-*, market-card-*, market-contact-*, market-remove-*.
- Wiring in `Maestro.jsx`: Marketplace→Passo 1 (Parco Macchine), Timer→Passo 3 (Pianificazione), Meteo→Passo 4 (Termostato & Sensori). Tutto trilingue IT/DE/EN. Nessuna modifica al backend.
- Testato: iteration_35 (95%, tutti e 3 i moduli OK; unico HIGH = timer non wall-clock) → fix wall-clock → iteration_36 (100%, wall-clock + allarme + riconciliazione background + regressione Meteo/Marketplace confermati).
### Note prodotto (non bloccanti): allarme Timer "vero background" tra tab/strumenti diversi richiederebbe engine a livello app o Service Worker (rinviato, scelta di prodotto).
### Avanzati ancora da fare: Tracciabilità lotti(19), Enterprise multi-negozio(21), Digital Twin(22), Ordini multi-fornitore(23), QR/Blockchain(25), Community B2B(13), i18n EN 100%. Rinviati: video/prezzi corsi Academy, PayPal, valori nutrizionali reali.

## v55 (2026-06) — Community B2B (13) + Allarme Timer GLOBALE + Tracciabilità Lotti (19)
- **Community dei Panettieri (Punto 13)** — bacheca CONDIVISA (backend). `sections/Community.jsx`, nuova 4ª sotto-scheda "Community" nel tab Impara (`LearnHub`, `learn-tab-community`). Post per categoria (consiglio/foto/ricetta/domanda) con testo + foto (upload via `/api/upload` object storage), LIKE e COMMENTI, filtri categoria, eliminazione del proprio post (admin può tutti). Lettura pubblica; pubblicare/like/commentare richiede login (apre `auth-modal`). Backend: collezione `community_posts`, endpoint `GET /api/community/posts?limit` (optional_user, cap 500), `POST /api/community/posts` (Field max 4000), `POST .../{id}/like` (toggle), `POST .../{id}/comments` (Field max 1000), `DELETE .../{id}` (autore o admin). data-testid: community-cat-*, community-text, community-photo-btn, community-submit, community-feed, community-post-*, community-like-*, community-comment-toggle/input/send-*, community-filter-*, community-delete-*.
- **Allarme Timer GLOBALE** — engine del timer spostato a livello app in `audio/TimerContext.jsx` (`TimerProvider` montato in App.js dentro AmbientProvider). Il conteggio prosegue e l'ALLARME (suono Web Audio + overlay lampeggiante `timer-alarm-overlay` a z-[90] + notifica) scatta su QUALSIASI schermata, anche fuori dallo strumento Timer. `Timer.jsx` ora è solo UI che consuma `useTimers()`. Wall-clock invariato (endsAt in localStorage `mikilab_timers`), coda multi-allarme. Guardia su `navigator.vibrate` per evitare warning console.
- **Tracciabilità Lotti (Punto 19)** — `sections/BatchTraceability.jsx`, wizard "Il Tuo Laboratorio" Passo 5 (`maestro-tool-lotti`). Schede lotto LOCALI (localStorage `mikilab_batches`) con codice auto `LOT-YYMMDD-XXX`, prodotto/ricetta, date produzione/scadenza, farina + lotto fornitore, quantità, operatore, note HACCP. QR STAMPABILE generato client-side (libreria `qrcode`, `batch-qr-*` data:image PNG) che racchiude i dati di tracciabilità. Stampa etichette via `.print-area`/`.no-print` (`batch-print`, window.print). data-testid: batch-add, batch-form, batch-code, batch-product, batch-proddate, batch-expiry, batch-flour, batch-flourlot, batch-qty, batch-operator, batch-note, batch-save, batch-list, batch-card-*, batch-remove-*.
- Nuova dipendenza frontend: `qrcode`. Nessuna modifica a .env. Tutto trilingue IT/DE/EN.
- Testato: iteration_37 — backend 13/13 pytest (`/app/backend/tests/test_iter37_community.py`), frontend 100% (Community CRUD+gating login, allarme globale confermato 3 modi, controlli timer, Tracciabilità Lotti QR/stampa, regressione Marketplace/Meteo). Fix post-test: guardia vibrate, Field max_length su post/commenti, cap limit su GET, toast di errore su like/commento/eliminazione.
### Nota: IntroGuide a OGNI apertura è scelta di prodotto voluta (PRD v20), non un bug.
### Avanzati ancora da fare: Enterprise multi-negozio(21), Digital Twin impasto(22), Ordini multi-fornitore(23), QR/Blockchain avanzato(25), i18n EN 100%. Rinviati: video/prezzi corsi Academy, PayPal, valori nutrizionali reali.

## v56 (2026-06) — ENTERPRISE: Multi-Negozio (21) + Ordini Multi-Fornitore (23) [PRO]
- Nuovo hub **Enterprise** riservato ai PRO (PaywallGate feature='enterprise'), raggiungibile dalla Home (card `home-section-enterprise` → tab `enterprise`). `sections/EnterpriseHub.jsx` con selettore negozio attivo (`enterprise-store-picker`, persistito in localStorage `mikilab_current_store`) e 2 sotto-schede (`enterprise-tab-negozi`, `enterprise-tab-ordini`).
- **Multi-Negozio (21)** — `sections/StoresManager.jsx`: CRUD punti vendita salvati sul BACKEND, scoped per proprietario. Negozio "attivo", select/edit/remove. Backend: collezione `stores`, endpoint `GET/POST /api/stores`, `PUT/DELETE /api/stores/{id}` (Depends require_pro, owner_id scoped). data-testid: store-add, store-new-*, store-card-*, store-select-*, store-active-*, store-edit-*, store-remove-*.
- **Ordini Multi-Fornitore (23)** — `sections/OrdersManager.jsx`: ordini di acquisto salvati sul BACKEND, scoped per negozio attivo. Righe articolo (nome/qty/unità/prezzo), fornitore da datalist `SUPPLIERS`, totale calcolato lato server (somma qty×prezzo), stato bozza/inviato/ricevuto. INVIO su 3 canali: **Email** (mailto precompilato), **WhatsApp** (wa.me con testo ordine), **Stampa** (finestra print) — all'invio lo stato passa da bozza→inviato. Backend: collezione `purchase_orders`, endpoint `GET /api/purchase-orders?store_id=`, `POST/PUT/DELETE /api/purchase-orders/{id}` (require_pro, owner scoped, status validato). data-testid: order-add, order-form, order-supplier, order-email, order-item-*, order-item-add, order-note, order-create, order-card-*, order-status-*, order-send-email/wa/print-*, order-mark-sent/received-*, order-remove-*.
- **Blindatura PRO lato server**: tutti gli 8 endpoint Enterprise usano `Depends(require_pro)` → utente non-PRO riceve 403 (verificato: admin 200, fornaio 403). Coerente con la UI PaywallGate.
- Testato: iteration_38 — backend 17/17 pytest, frontend 100% (gating PRO, CRUD negozi + negozio attivo + persistenza, CRUD ordini scoped, invio email/whatsapp/stampa + transizioni stato). Fix post-test: require_pro server-side.
### Ordine moduli Enterprise scelto dall'utente: a→e. FATTI: a (Multi-Negozio), b (Ordini). PROSSIMI: c (Digital Twin impasto, 22), d (QR/Blockchain pubblico, 25), e (Pianificazione Turni personale).
### Nota design nota (app-wide, pre-esistente): i FAB flottanti (Radio/WhatsApp/Parla) si sovrappongono ai CTA in fondo su alcune schermate paywall — mitigato con pb-40, non bloccante.

## v57 (2026-06) — ENTERPRISE (c): Digital Twin dell'Impasto (Punto 22) [PRO]
- Nuovo strumento **Digital Twin Impasto** nel wizard "Il Tuo Laboratorio" (Maestro, PRO), Passo 4 'Termostato & Sensori', tool id 'twin' (`maestro-tool-twin`). `sections/DoughTwin.jsx`. Pura computazione client-side, nessun backend.
- Input (slider + toggle): idratazione %, forza W farina, temperatura °C, tipo lievito (birra/madre) + dose %, sale %. testid stabili: twin-slider-hyd/w/temp/dose/salt, twin-type-ldb/madre.
- Output simulati: tempo di lievitazione al picco (twin-time), volume di picco × (twin-volume), idratazione ideale consigliata (twin-rechyd), alveolatura attesa con punteggio ed etichetta (twin-alveo), CURVA di lievitazione recharts con ReferenceLine sul picco (twin-chart), anteprima grafica mollica con bolle deterministiche (twin-crumb), consigli automatici (twin-advice).
- Modello: velocità di fermentazione ~×2 ogni 9°C, freno del sale, curva logistica con collasso da sovra-maturazione; Vmax legato a W; idratazione ideale ~55+(W-180)/6; score alveolatura da idratazione+W+durata.
- Testato: iteration_39 — rendering + logica simulazione 100% corretti (reattività verificata: temp↑/dose↑ → tempo↓; idratazione↑ → alveolatura più aperta; madre → tempi maggiori; curva recharts ok). Bug HIGH trovato e RISOLTO: il sub-componente `Slider` era definito dentro il body → remount degli <input range> a ogni render (drag/tastiera rotti). Fix: `Slider` spostato a livello di modulo (canonico). 
### Ordine moduli Enterprise (a→e). FATTI: a (Multi-Negozio 21), b (Ordini 23), c (Digital Twin 22). PROSSIMI: d (QR/Blockchain pubblico 25), e (Pianificazione Turni personale).

## v58 (2026-06) — ENTERPRISE (d): QR Pubblico del Lotto (Punto 25) [PRO]
- Completa la Tracciabilità Lotti (Passo 5, maestro-tool-lotti). Ogni scheda lotto può essere PUBBLICATA sul backend con un click ("Genera QR pubblico", `batch-publish-<id>`): il QR passa a codificare l'URL pubblico `/?lotto=<id>` invece del testo. Stato pubblicato mostra Copia link (`batch-copy-<id>`) e Apri pagina (`batch-open-<id>`).
- **Pagina pubblica** `sections/PublicBatch.jsx` (data-testid public-batch): standalone, NESSUN login/onboarding/nav. Raggiunta via query param `?lotto=<id>` (early-return in App.js). Mostra brand MikiLab, badge "Prodotto tracciato", prodotto, codice, date produzione/scadenza, farina + lotto fornitore, quantità, operatore, punto vendita (dal nome laboratorio onboarding) e note. Stato errore `public-batch-error` se id inesistente. Verificata con screenshot (render perfetto).
- Backend: collezione `pub_batches`. `POST /api/batches` (require_pro), `GET /api/batches` (require_pro), `DELETE /api/batches/{id}` (require_pro), `GET /api/public/batch/{id}` (PUBBLICO, nessun auth, nessun leak owner_id). Frontend api: batchesApi.create/remove/publicGet.
- Il publish invia anche store_name (nome laboratorio dall'onboarding). remove() elimina anche il record backend e mostra toast se fallisce.
- Testato: iteration_40 — backend 6/6 pytest + frontend 100% (publish→QR URL→pagina pubblica con dati corrispondenti, persistenza publicId, errore lotto inesistente, delete→404, regressione stampa/QR-testo/elimina). Nessun difetto.
### Ordine moduli Enterprise (a→e). FATTI: a (Multi-Negozio 21), b (Ordini 23), c (Digital Twin 22), d (QR Pubblico 25). ULTIMO: e (Pianificazione Turni personale).

## v59 (2026-06) — ENTERPRISE (e): Pianificazione Turni Personale [PRO] — MODULO ENTERPRISE COMPLETO
- Ultima scheda dell'hub Enterprise: **Turni** (enterprise-tab-turni). `sections/ShiftsManager.jsx`. Calendario SETTIMANALE (lun-dom) per il negozio attivo, navigatore settimana (shift-week-prev/next), aggiunta turno inline per giorno (shift-add-<ISO> → shift-form: shift-employee, shift-role, shift-station, shift-start, shift-end, shift-save), card turno (shift-card-<id>) con orario e ore calcolate, eliminazione (shift-remove-<id>). Riepilogo ORE PER PERSONA della settimana (shifts-hours, shift-hours-<nome>) + totale settimana nell'header.
- Backend: collezione `shifts`, endpoint `GET /api/shifts?store_id=`, `POST/PUT/DELETE /api/shifts/{id}` (require_pro, owner+store scoped). `_shift_hours` calcola le ore includendo i turni notturni (wrap +24h). Frontend api: shiftsApi.
- Fix: `iso()` in ShiftsManager ora costruisce la data locale YYYY-MM-DD (niente più shift di un giorno in fusi UTC+1/+2 come IT/DE). Aggiunto 'Turni' all'anteprima del PaywallGate enterprise.
- Testato: iteration_41 — backend 9/9 pytest (calcolo ore diurno/notturno/PUT, scope, 401/403/404/422), frontend 100% (crea negozio→turni, ore per turno, riepilogo ore-persona, navigazione settimana date-bound, elimina, gating PRO non-PRO→paywall). Nessun difetto funzionale.
### ✅ MODULO ENTERPRISE COMPLETO (a→e): a Multi-Negozio (21), b Ordini Multi-Fornitore (23), c Digital Twin Impasto (22), d QR Pubblico Lotto (25), e Pianificazione Turni. Tutto PRO, scoped per utente/negozio, trilingue.
### Nota design ricorrente (app-wide): i FAB flottanti (Radio/WhatsApp/Parla) coprono a volte i contenuti in fondo su viewport 430px — da valutare offset/hide su schermate specifiche.
### Backlog residuo 25 punti: i18n EN 100%; Academy video+prezzi+PayPal (attesa dati utente); valori nutrizionali reali (attesa dati laboratorio); Community notifiche (spark).

## v60 (2026-06) — Notifiche Community (like/commenti)
- Quando un altro utente mette like o commenta un tuo post nella Community ricevi una notifica. Campanella nell'Header (solo loggati) `NotificationBell` con badge non-lette (notif-bell, notif-badge), pannello elenco (notif-panel, notif-item-<id>), mark-read all'apertura, polling 45s, chiusura al click-fuori. notif-empty se vuoto.
- Backend: helper `_notify` (non notifica sé stessi), hook in community_like/community_comment; `GET /api/notifications` (items+unread, max 50), `POST /api/notifications/read`. Collezione `notifications`. community_delete ora elimina anche le notifiche del post (no orfane). NotificationBell fa resync se il mark-read fallisce.
- Testato: iteration_42 — backend 8/8 pytest, frontend 100% (badge conteggio, apertura pannello+mark-read, persistenza letto dopo reload, assente da anonimo, no self-notify, E2E like/commento reale). Nessun difetto. Dati di test ripuliti (0 notifiche/post residui).

## v61 (2026-06) — i18n EN: rifinitura testi mancanti
- Dizionario `t()` (translations.js) verificato COMPLETO: 666 chiavi in IT/DE/EN, 0 mancanti (le 14 "identiche" IT=EN sono nomi propri/unità: Mikilab, News, Home, kg, poolish, biga, freezer…).
- Colmate le lacune EN nei contenuti/funzioni che avevano solo IT/DE:
  - `lib/shopping.js`: etichette lista spesa in EN (Water/Salt/Preferment-Sourdough, "Mikilab shopping list", FLOURS/OTHER INGREDIENTS, flour fallback "Flour").
  - `sections/Checklists.jsx`: aggiunti titoli e voci EN ai 4 template (apertura/chiusura/celle/manutenzione) + selettore lingua include "en".
  - `sections/ShiftRoles.jsx`: array ruoli EN + selettore include "en".
  - `lib/voice.js`: sintesi vocale usa en-GB per EN.
  - `lib/loc.js`: `rLoc` ora preferisce campi `_en` se presenti; `ingLoc` traduce gli ingredienti anche in EN (mappa INGREDIENT_EN ~60 voci) usata da lista spesa e ricette.
- Verificato: compilazione pulita; logica funzioni pure corretta.
### SCOPE / NOTA IMPORTANTE: l'INTERFACCIA è ora sostanzialmente 100% EN. I TESTI DELLE RICETTE (nomi, descrizioni, passaggi) nel database `data/content.js` esistono solo in IT + DE (campi `_de`); non ci sono ancora i campi `_en`, quindi in modalità EN i contenuti-ricetta mostrano l'italiano come fallback. Tradurre l'intero DB ricette in EN è un lavoro separato più ampio (serve conferma tono/terminologia o traduzione automatica batch): `rLoc` è già predisposto a usare i campi `_en` quando verranno aggiunti.

## v62 (2026-06) — i18n EN completata (interfaccia)
- Aggiunto blocco `en` completo a `data/content.js` (Maestro: suggerimenti, enciclopedia, news, video, corsi, guida Lievito Madre).
- Tradotti in EN: Enciclopedia (ENTRIES.en), Beginners (BEGINNERS.en + QUIZ.en), Checklists (en), ShiftRoles (en), lista spesa (shopping.js), ingredienti (loc.js ingLoc + INGREDIENT_EN), sintesi vocale (voice.js en-GB), Shop (name_en/desc_en/allergens_en + Shop.jsx pick per lingua), Academy (heading + duration_en/_de per corsi/consulenza).
- PaywallGate reso TRI-LINGUA completo: helper tri(), FEATURES con array `en` per lab/diagnosi/enterprise/beginners, tutti i testi (header, corpo, prezzi, prova, login, toast checkout) tradotti; rimosso `const it` morto.
- sectionName del paywall localizzati (App.js: Your Lab/Diagnosis/Enterprise; LearnHub: Beginners Section).
- rLoc predisposto per campi `_en`. Seed shop idempotente applica i campi _en anche ai prodotti esistenti.
- Testato: iteration_43 (75%→fix) e iteration_44 (86%, unico leak = FEATURES senza en → RISOLTO ora aggiungendo gli array en). 0 crash in IT/DE/EN.
### NOTA: i TESTI DELLE RICETTE del DB restano IT/DE (fallback IT in EN) — traduzione automatica/curata del DB ricette è un lavoro separato ancora da fare.
### STATO RICHIESTE UTENTE "finire tutto tranne PayPal": FATTO tutto ciò che è fattibile senza dati esterni. IN SOSPESO per volontà utente: PayPal. IN ATTESA DI DATI UTENTE: video reali Academy, valori nutrizionali reali. Traduzione EN del DB ricette: da valutare (automatica vs curata).

## v63 (2026-06) — Traduzione EN del database ricette (49 ricette)
- Tradotte automaticamente in inglese (Claude via Emergent LLM key) tutte le 49 ricette di `mikilab_seed_data.json`: aggiunti campi `name_en, real_name_en, flour_type_en, notes_en, procedure_en` (accanto ai `_de` esistenti). Script riutilizzabile: `backend/translate_recipes_en.py` (idempotente, salta i campi già tradotti/vuoti).
- Modello `Recipe`/`RecipeCreate` esteso con i campi `_en`. SEED_VERSION bumpata a `2026-06-v44-en-recipes` → al riavvio il seed fa upsert dei `_en` su tutte le ricette non `user_edited` (rispetta le modifiche manuali di Michele).
- `rLoc` (già predisposto) ora restituisce i campi `_en` in modalità EN; i componenti ricette (RecipeShowcase, RecipeList, CapoLaboratorio) usano rLoc → le ricette si mostrano in inglese (nome, procedimento, note, tipo farina).
- Verificato: DB via API 49/49 con name_en + procedure_en; catena rLoc→componenti confermata. Nomi propri tedeschi (es. Wurzelbrot, Brezel) restano invariati in EN (corretto).
### ✅ i18n EN ora COMPLETA: interfaccia + contenuti Maestro + ricette. Restano solo IN SOSPESO per volontà utente: PayPal; IN ATTESA DATI: video Academy, valori nutrizionali reali.

## v64 (2026-06) — Laboratorio Smart e Pesata Guidata (Fasi 1-2-3)
Nuovo modulo trilingue IT/DE/EN, wiring nel wizard "Il Tuo Laboratorio" (Maestro.jsx). Backend: nuovi endpoint scoped per utente (Depends current_user).
- **FASE 1 — Pesata Guidata (`sections/GuidedWeighing.jsx`)** — tool `pesata` nel Passo 1 (Parco Macchine). Web Bluetooth Weight Scale (service 0x181D / char 0x2A9D) con fallback manuale + simulatore slider. Feedback cromatico a semaforo (under/near/ok/over), bip Web Audio + auto-avanza dopo 2s di verde stabile, voce "Mani Pulite" (SpeechSynthesis, annuncio ingrediente) e comando vocale "Avanti" (SpeechRecognition). Riscalamento per kg totali + auto-split in più impastate secondo la capienza dell'impastatrice. testid: gw-ble, gw-kg, gw-cap, gw-ingredients, gw-add, gw-start, gw-run, gw-panel, gw-weight, gw-msg, gw-manual, gw-sim, gw-next, gw-voicecmd, gw-voice-toggle, gw-stop.
- **FASE 3 (parte pesata)** — ogni ingrediente ha RUOLO (Farina/Acqua/Altro) + prezzo €/kg. A fine pesata → vista riepilogo (`gw-summary`) con IDRATAZIONE REALE (acqua/farina sui pesi realmente pesati), FOOD COST reale (€ e €/kg), lista pesata e RILEVAMENTO AGGIUNTE EXTRA (`gw-extras`, scostamento vs target ≥3g o 3%). testid: gw-real-hyd, gw-real-cost, gw-weighed-list, gw-summary-reset, gw-price-<id>.
- **FASE 2 — Diario Impasti & Algoritmo "Giorno Dopo" (`sections/DoughLog.jsx`)** — tool `sessioni` nel Passo 4 (Termostato & Sensori). Salva sessioni impasto {ricetta, target °C, temp finale °C, ambiente °C, umidità %, acqua °C, note}. Analisi deterministica "Giorno Dopo": delta=finale-target; verdetto on_target(±0,5)/too_warm/too_cold; acqua consigliata = acqua_ieri − delta×2 − (ambiente_oggi − ambiente_ieri), clamp 1-45°C. Consiglio IA opzionale (Claude Sonnet 4.6 via Emergent LLM key, max 5 frasi). Storico con elimina. Login richiesto (doughlog-login → auth modal). testid: doughlog-recipe/name/target/dough/room/hum/water/note/save, doughlog-dayafter/verdict/suggest-water/ai/advice, doughlog-history, doughlog-item-<id>, doughlog-remove-<id>.
- **FASE 3 — Registro HACCP (`sections/HaccpLog.jsx`)** — tool `haccp` nel Passo 5 (Dashboard IA & HACCP). Scansione barcode/QR materie prime via `BarcodeDetector` (Chrome) + fallback inserimento manuale; log {materia, codice, lotto, scadenza, fornitore, temp °C ricevimento, qty, note}. Login richiesto (haccp-login). testid: haccp-scan-btn/scanner/scan-close, haccp-material/code/lot/expiry/supplier/temp/save, haccp-list, haccp-item-<id>, haccp-remove-<id>.
- **Backend (server.py)**: `GET/POST /api/dough-sessions`, `DELETE /api/dough-sessions/{id}`, `POST /api/dough-sessions/day-after`, `POST /api/dough-sessions/ai-advice` (helper `_claude_text`), `_day_after_analysis`; `GET/POST /api/haccp-logs`, `DELETE /api/haccp-logs/{id}`. Collezioni `dough_sessions`, `haccp_logs` scoped per owner_id. Frontend api: `doughSessionsApi`, `haccpApi` in lib/api.js.
- Testato: iteration_45 — backend 100% (15 pytest: auth gating, CRUD, Day-After too_warm/too_cold/on_target/no-history, AI advice, HACCP, validazione), frontend 100% (Pesata run+riepilogo con idratazione 67,7% e food cost €1,84 corretti; Diario+Giorno Dopo+IA; HACCP; regressione Bilancia/Meteo/Marketplace/Lotti). 0 bug funzionali. Fix post-test: separatore HACCP (join non-vuoti), refresh Giorno Dopo su cambio ambiente/umidità.
### Nota di prodotto: gw-next resta disabilitato in over-pour per FORZARE la rimozione dell'eccesso (scelta di design da PRD: "Rimuovi l'eccesso per proseguire").
### Rinviati per volontà utente: PayPal Academy; valori nutrizionali reali (attesa dati laboratorio).

## v64.1 (2026-06) — Collegamento Pesata → Diario Impasti
- Dal riepilogo della Pesata Guidata (`gw-summary`) nuovo pannello `gw-savesession`: "Salva come sessione impasto (Giorno Dopo)" apre 4 input temperatura (target/finale/ambiente/acqua) + nome pre-compilato con la data; salva su `doughSessionsApi.create` includendo nota con idratazione reale + food cost. Login richiesto (→ auth modal). Stato salvato `gw-savesession-ok`. testid: gw-savesession-open, gw-sess-name/target/dough/room/water, gw-sess-save. Collega Fase 1 (Pesata) → Fase 2 (Diario/Giorno Dopo). Riusa endpoint già testato in iteration_45; compila pulito.

## v65 (2026-06) — Laboratorio Smart: 5 potenziamenti (Next Action Items)
- **Pesata → Lotto**: dal riepilogo Pesata Guidata pulsante `gw-create-batch` crea un lotto in Tracciabilità Lotti (localStorage `mikilab_batches`) con prodotto, qty in kg (peso reale), operatore e nota (idratazione reale + food cost + "da Pesata Guidata"). Stato `Lotto creato ✓`.
- **Grafico Giorno Dopo** (`doughlog-chart`): recharts LineChart in Diario Impasti con andamento temperatura Impasto vs Target sulle ultime ≤8 sessioni (compare con ≥2 sessioni).
- **Alert scadenze HACCP**: `haccp-expiry` ora date picker; helper `daysToExpiry`/`expBadge` → badge per voce (`haccp-expbadge-<id>`: rosso "Scaduto", ambra "Scade tra Xg" entro 7gg) + banner conteggio `haccp-alert-banner`.
- **Voce riepilogo**: a fine pesata la voce legge idratazione reale e costo (SpeechSynthesis, guardia voiceOn).
- **Badge "da Pesata"**: backend `DoughSessionReq.source` (opz.); le sessioni salvate dalla Pesata hanno `source:"pesata"` e mostrano badge `doughlog-badge-<id>` nello storico; quelle manuali no.
- Testato: iteration_46 — frontend 100% (5/5 feature + regressione), 0 bug. Note opzionali low: nome lotto generico "Pesata" se non si nomina prima la sessione. Backend `source` verificato via curl. Dati di test ripuliti.

## v66 (2026-06) — Ristrutturazione UX/UI — FASE A (Navigazione & fix trasversali)
- **Tasto Indietro multi-livello** (`lib/backNav.js` + hook `useBackClose`): un solo listener popstate in App.js (`consumeBack()`) chiude passo-passo le viste profonde invece di tornare alla Home. Integrato in: dettaglio ricetta + dialog edit/scala (RecipeList), strumento del Laboratorio (Maestro `tool`), sotto-pagine Ricette (Guida/Etichette). La chiusura via UI rimuove solo la voce dallo stack (niente salti verso Home).
- **Dedup Enciclopedia**: rimossa da fondo Diagnosi (PhotoDiagnosi); resta solo in Impara (LearnHub).
- **WhatsApp contestuale** (`components/WhatsAppHelp.jsx`, context corsi/assistenza/ordini): rimosso il FAB globale (`WhatsAppFab`) da tutte le pagine; inserito in Academy (corsi+assistenza) e OrdersManager (ordini) con messaggi specifici (solo problemi tecnici app / info corsi / ordini).
- **Fotocamera Diagnosi**: già presente via `DualPhotoButtons` (Scatta ora + Allega) — verificato.
- **Traduzioni (loc.js)**: aggiunti DE/EN dei 5 ingredienti del Miglioratore (malto diastasico, lupino, acerola, lino dorato, psillio) → la ricetta ora cambia lingua. Badge localizzati in RecipeList: `INT`(IT)/`VK`(DE)/`WW`(EN) per integrale, `LDB`(IT)/`Frischhefe`(DE)/`Yeast`(EN); tooltip farine tedesche (Type 550/630 → equivalente/cereale IT). Titoli ricette lunghi (panettoni) ora vanno a capo (`line-clamp-3`).
- Testato: iteration_47 — frontend 6/7 core PASS (back button, dedup, WhatsApp, camera, traduzioni, badge); titolo troncato corretto dopo. Note fuori-scope: IntroGuide riappare a ogni load (no persistenza); date input nativo nel form prenotazione; warning DOM `<span>` in `<option>` (pre-esistente, non funzionale); wa-help-ordini visibile solo con un negozio creato.
### FASE A = FATTA. Prossime: FASE B (Laboratorio reorg + prova 7gg), FASE C (ricette: 6 snack + 10 panini, procedimenti estesi), FASE D (avatar animato Home + Chiedi al Maestro, avatar Mohammad, foto reale — SERVONO ASSET dall'utente).

## v67 (2026-06) — Assistente "Mohammed" (Il Tuo Laboratorio) [parte FASE D]
- Nuovo assistente chat **Mohammed** in cima a "Il Tuo Laboratorio" (`sections/MohammedAssistant.jsx`): card di accoglienza (didascalia introduttiva Fase B) + chat espandibile con chip suggeriti. Avatar `public/mohammed-avatar.jpg` (versione REALISTICA scelta dall'utente; scartata la variante cartoon).
- Backend (`server.py`): `MOHAMMED_SYSTEM` (persona esatta fornita dall'utente: ambito esclusivo laboratorio/forno/strumenti app, rifiuto garbato fuori-ambito, tono pratico, risposte a passi numerati), helper `_lab_assistant_stream`, endpoint `POST /api/mohammed/chat` (SSE, Claude Sonnet 4.6) + `GET /api/mohammed/history/{sid}`. Storico in `chat_messages` per session id `mohammed-*` (in localStorage).
- Testato: iteration_48 frontend 6/6 funzionali PASS (render, streaming, in-ambito con passi numerati, rifiuto ESATTO fuori-ambito, IT/EN). Fix bug HIGH auto-scroll (ora scrolla solo il riquadro chat, non la pagina). Backend verificato via curl. FAB Radio/Parla che si sovrappongono = problema pre-esistente app-wide (non risolto qui).
### Ancora da fare: FASE B (rimozione "Piano Settimanale" da impostazioni macchine, Bluetooth facoltativo, meno schermate, step "Conclusione Lavorazione", prova 7gg non registrati), FASE C (ricette: sposta Focacce/Taralli, +categoria Snack con 6 snack, +10 panini, procedimenti estesi), FASE D residuo (avatar ANIMATO video in Home + "Chiedi al Maestro" con avatar Michele; tatuaggio polipo/tigre sull'avatar Michele; tua foto reale con maglia MikiLab).

## v68 (2026-06) — Monetizzazione multi-tier + Academy "Impara da Casa" + pulizia legale
- **PULIZIA LEGALE (Punto 1)**: rimossi TUTTI i riferimenti user-facing a "Stoccarda"/"Stuttgart" (translations.js IT/DE/EN, content.js, Home.jsx, PanettoneLabels.jsx footer → "MikiLab · Michele", MAESTRO_SYSTEM, ANNOUNCEMENT_SEED, news RSS). News ora solo regioni germania/italia. Migrazione: `seed_announcements_if_empty` cancella gli annunci storici con "Stoccarda/Stuttgart/Cannstatt"; `Announcement.region` default → "germania". Presentazione come singola persona (Michele/MikiLab).
- **Fotocamera Diagnosi (Punto 9)**: già presente `capture="environment"` in DualPhotoButtons.jsx (verificato).
- **MONETIZZAZIONE MULTI-TIER (Punto 3)**:
  - Tier **LAB "Il Tuo Laboratorio"** €29,99/mese · €249/anno (pro completo). Tier **HOME "Impara da Casa"** €12,99/mese · €99/anno (Academy + 10 Diagnosi Foto/mese, NON i tool laboratorio).
  - Backend: `INTERNAL_PRICES[(tier,plan)]`; `_grant_from_email(tier)` (lab→pro, home→academy); `user_academy_access`; `require_diagnosi` (illimitata PRO/admin, 10/mese home, 403/429); `subscription_status` ritorna {pro, academy, plan_tier, unlock_*, unlocked_recipes, diagnosi_used, diagnosi_limit}. `/api/subscription/checkout` {plan,tier}. Webhook legge tier.
  - **Acquisto singolo ricette**: `POST /api/recipe/checkout` {kind:single €4,99 | panettoni €29,99 | all €149, recipe_id?} + `_recipe_fulfill` + `/recipe/checkout/status/{id}`. `get_recipes` teaser rispetta unlock_all/unlock_panettoni/unlocked_recipes. Webhook `recipe_kind`.
  - Frontend: PaywallGate tier-aware (feature beginners→home €12,99, lab/diagnosi/enterprise→lab €29,99), `hasAccess` via academy/pro. RecipeList dialog acquisto (buy-single/panettoni/all/subscribe-pro). App.js gestisce ritorno `?recipe=success`/`?sub=success`. `admin/grant` accetta tier.
- **ACADEMY "Impara da Casa" (Punto 4)**: `sections/AcademyHome.jsx` + `data/academy.js` (MENTORS, ACADEMY_VIDEOS, FLOURS, CALC_RECIPES). Sotto-tab: Video Mentore (selettore mentore + filtro difficoltà Facile/Intermedio/Avanzato + video con sottotitoli CC IT·DE·EN + badge "Nuovo" + toast notifica nuovi contenuti), Ricettario dinamico (calcolo dosi da teglia+farina, stampa/PDF), Database farine (ricerca, corrispondenze IT/DE, W), Corsi & Quiz (riuso Beginners). Wrappata in PaywallGate feature=beginners (tier home). LearnHub "impara" → AcademyHome.
- Testato: iteration_52 — backend 26/30 → dopo fix 30/30 verificati via curl (revoke azzera academy/plan_tier/expires_at, anon diagnosi_limit=0, annunci senza Stoccarda, grant home). Frontend 92% (paywall Academy €12,99, Academy sbloccata admin, dialog acquisto, tier home vs lab). Fix teaser ricetta (prezzo €9,99 → "Sblocca questa ricetta" → dialog).
- **NOTA SICUREZZA (pre-esistente, non in questo scope)**: mutazioni POST/PUT/DELETE su /announcements, /oven-profiles, /production-plan, /weekly-plan, /lab-config, /recipe-temp sono senza auth. Da blindare in una sessione dedicata (rischio regressione sui tool Maestro).

## v69 (2026-06) — Avatar parlante + Blindatura sicurezza + Contenuti mentore
- **AVATAR ANIMATO PARLANTE**: nuovo `components/TalkingAvatar.jsx` (tap-to-play, `preload="none"`, dual source WebM/VP9 + MP4/H.264 per compatibilità universale, onError graceful). Video reale di Michele (90s, dalle sue tabelle dosi scritte a mano) transcodificato a 720p faststart e servito same-origin: `public/michele-talking.mp4` (6,4MB) + `public/michele-talking.webm` (11MB). Inserito nella card in cima alla Home (`home-talking-avatar`, sostituisce l'immagine animata) e in "Chiedi al Maestro" (`maestro-talking-avatar` in MaestroSaTutto). NB: il sorgente originale 194MB (moov in fondo) NON era web-compatibile → transcodifica obbligatoria. Per cambiare video: aggiornare MICHELE_VIDEO + i file in public.
- **BLINDATURA SICUREZZA**: aggiunte dependency auth alle mutazioni prima pubbliche → `create/update/delete_oven_profile`, `save_production_plan`, `save_weekly_plan`, `save_lab_config`, `save_recipe_temp` ora richiedono `current_user` (401 se anonimo); `create/update/delete_announcement` richiedono `require_admin`. Le GET restano pubbliche. Verificato: anon→401, loggato→200, nessuna regressione sui tool del Laboratorio (già dietro login+paywall).
- **CONTENUTI MENTORE**: i video dell'Academy sono già tutorial REALI (Martesana, Ricette di Caterina, Chef Billy Parisi, Bread Ritual) con sottotitoli CC IT·DE·EN e filtro difficoltà — non segnaposto. In attesa dei link/mentori definitivi dell'utente per eventuali sostituzioni puntuali.

## v70 (2026-06) — Revert avatar video + PDF trilingue
- **REVERT AVATAR VIDEO**: su richiesta di Michele (il video mostrava solo le tabelle dosi scritte a mano, non spiegava l'app), rimosso `TalkingAvatar.jsx` e i file `public/michele-talking.{mp4,webm}`. Ripristinato l'avatar statico animato (`michele-avatar.jpg` con zoom) in Home e in "Chiedi al Maestro". In attesa che l'utente fornisca un video in cui l'avatar SPIEGA l'app.
- **PDF RICETTA TRILINGUE**: nel Ricettario dinamico dell'Academy il pulsante "Scarica scheda PDF (IT·DE·EN)" (`calc-print`) apre una scheda stampabile/salvabile con le dosi calcolate in ITALIANO + DEUTSCH + ENGLISH (via window.open + print → Salva come PDF). Verificato il contenuto trilingue.

## v71 (2026-06) — Avatar parlante generato (multilingua) + Academy rifinita
- **AVATAR PARLANTE GENERATO DA ZERO**: l'utente non aveva un video adatto → generato internamente. (1) Immagine avatar: editato l'avatar esistente di Michele aggiungendo l'ORECCHINO, mantenendo tatuaggio/corporatura magra/polo MikiLab (Gemini Nano Banana edit) → `public/michele-avatar-talk.jpg`. (2) Voce: narrazione TTS (OpenAI tts-1-hd, voce onyx) generata in IT/DE/EN via Emergent LLM Key (`backend/gen_avatar_tts.py`). (3) Video: composti con ffmpeg (Ken Burns zoom + audio) → `public/michele-explainer-{it,de,en}.mp4` (H.264 faststart, ~0.5MB) + `.webm` (VP9, ~0.75MB). (4) Componente `components/TalkingAvatar.jsx`: tap-to-play, sceglie il video in base alla lingua app (key={lang}), transcript tradotto sotto, poster = avatar. Inserito in Home (hero, showTranscript false) e in "Chiedi al Maestro". VERIFICATO: video parte, cambia lingua, orecchino visibile. NOTA: la voce OpenAI in IT/DE ha lieve accento inglese (limite provider) → in futuro ElevenLabs multilingua se si vuole voce nativa.
- **ACADEMY — RIMOZIONE MENTORI**: su richiesta utente ("voce e video non mi piace"), rimossa la tab "Video Mentore" e tutta la logica mentori/difficoltà da `AcademyHome.jsx` (MENTORS/ACADEMY_VIDEOS non più usati, restano in data/academy.js).
- **ACADEMY — TAB DIAGNOSI**: nuova tab "Diagnosi" con card "Diagnosi Foto IA", contatore X/10 al mese e pulsante `academy-open-diagnosi` → `onNavigate("diagnosi")` (thread onNavigate: App→LearnHub→AcademyHome). VERIFICATO naviga alla Diagnosi.
- Tabs Academy finali: Ricettario · Farine · Diagnosi · Corsi & Quiz.

## v72 (2026-06) — Refactoring navigazione/layout + notifiche + upsell Diagnosi + avatar riscritto
- **BOTTOM BAR**: ora Home · Ricette · Il Tuo Laboratorio · Impara · Community. Rimossa "Diagnosi" dalla barra (accessibile da Home + Academy). BottomNav usa icona Users per Community; nuova key i18n `nav_community`.
- **IMPARA (LearnHub)**: tab superiori ridotti a 3 → "Video Mentore" · "News" · "Enciclopedia del Pane". Rimossa "Community". Il tab Video Mentore mostra in alto (hero) lo showcase dei 6 video mentore YouTube (scroll orizzontale), poi i sotto-tab Ricettario/Farine/Diagnosi/Corsi.
- **COMMUNITY**: spostata da Impara → tab dedicato in Bottom Bar (`tab==="community"` in App.js renderizza `Community`) + card dedicata in Home (`home-community-card`).
- **ENCICLOPEDIA vs RICETTARIO**: Enciclopedia già solo teoria/wiki (Poolish, Biga, LM, tecniche) — nessuna ricetta (verificato). Ricettario/calcolatori restano operativi.
- **HOME**: aggiunti chip rapido "Diagnosi Foto" (`home-quick-diagnosi` → tab diagnosi) e card Community.
- **DIAGNOSI — UPSELL PRO**: nella card Diagnosi dell'Academy, quando l'utente Home ha usato 10/10 diagnosi del mese, compare invito "Passa a PRO · €29,99/mese" (`diagnosi-upgrade-pro` → checkout lab).
- **NOTIFICHE NUOVI CONTENUTI**: all'avvio l'app confronta il numero di ricette con l'ultima visita (localStorage) e mostra un toast "N nuove ricette disponibili".
- **AVATAR PARLANTE — TESTO RISCRITTO**: nuovo copione che spiega TUTTO il sito (Ricette, Il Tuo Laboratorio, Diagnosi, Impara, Community) in IT/DE/EN; rigenerati i 6 file `michele-explainer-{it,de,en}.{mp4,webm}` (~42s). Transcript aggiornato in TalkingAvatar.
- **PENDING**: voce ElevenLabs italiana nativa per l'avatar → richiede API key utente (da https://elevenlabs.io/app/settings/api-keys). La chiave universale Emergent NON copre ElevenLabs.

## v73 (2026-06) — Voce ElevenLabs per l'avatar
- **VOCE AVATAR → ELEVENLABS**: integrata ElevenLabs (chiave utente in `backend/.env` → `ELEVEN_API_KEY`, letta da env, non hardcodata). Script `backend/gen_avatar_eleven.py`: modello `eleven_multilingual_v2`, voce maschile profonda (Adam, `pNInz6obpgDQGcFmaJgB`), genera narrazioni IT/DE/EN. Rigenerati i 6 file `michele-explainer-{it,de,en}.{mp4,webm}` (~55s, ~1.2MB) con la nuova voce. Verificato: avatar riproduce l'audio ElevenLabs, cambia lingua con l'app. NOTA: per una voce con accento italiano nativo specifico, l'utente può indicare un voice_id/nome dalla propria libreria ElevenLabs e si rigenera.

## v74 (2026-06) — Fix deploy + rimozione totale Video Mentore + avatar player nativo + regressione
- **DEPLOY BLOCKER RISOLTO**: rimosso il `delete_many` distruttivo (era su startup/richiesta). `seed_announcements_if_empty` ora solo insert-if-empty. Annunci legacy "Stoccarda/Stuttgart/Cannstatt" nascosti con filtro NON distruttivo in lettura in GET /api/announcements ($not $regex). deployment_agent → PASS.
- **RIMOZIONE TOTALE VIDEO MENTORE**: eliminata la sezione "Video Mentore" e tutti i video mentore (MentorEmbed + mentor-showcase da AcademyHome; import ACADEMY_VIDEOS rimosso). Tab Impara rinominato "Impara da Casa". Aggiornati PaywallGate (feature list senza mentori) e narrazione avatar (senza "video mentore"). Impara sotto-tab finali: Impara da Casa · News · Enciclopedia del Pane.
- **AVATAR — PLAYER NATIVO**: `TalkingAvatar` ora usa `<video controls playsInline preload=metadata>` con source per lingua (mp4 prima, poi webm) → riproduzione affidabile su iOS/Android/desktop (risolve "il video non parte"). Voce ElevenLabs (Adam multilingua) rigenerata per i 3 video.
- **REGRESSIONE (iteration_53)**: backend 15/15 PASS (monetizzazione, legale, sicurezza), frontend tutto PASS (5 tab bottom bar, Community, 3 sotto-tab Impara, zero mentori, Academy 4 tool, ricettario+PDF trilingue, farine, avatar nativo 3 lingue). Nessun bug bloccante.
- Backlog opzionale (non richiesto): sostituire <select> nativi con shadcn Select (warning hydration); padding-bottom mobile per FAB; rimuovere dead code StoccardaPanel in MaestroSaTutto.jsx.

## v75 (2026-06) — Rifinitura mobile + verifica Community Foto
- **RIFINITURA MOBILE**: `<main>` in App.js pb-48 → pb-64 (256px) così le ultime card non vengono coperte dai FAB Radio (bottom-28 sx) e Parla (bottom-28 dx). Verificato: footer visibile e libero.
- **COMMUNITY FOTO**: verificato che era GIÀ completo — composer con pulsante "Foto" (community-photo-btn) → uploadApi.image (/api/upload → URL assoluto), anteprima con pulsante rimuovi (community-photo-clear), immagine mostrata nel post (image_url). Backend `CommunityPostReq.image_url` + `_post_public` già presenti. Upload testato: 200 OK.

## v76 (2026-06) — Vetrina Panettoni + Condivisione Ricette + Mohammed guida + revisione direttive
- **VETRINA PANETTONI (Home)**: `home-panettoni-showcase` — scroll orizzontale dei panettoni (thumbnail + badge €4,99), CTA "Sblocca tutti i Panettoni · €29,99", link "Vedi tutti" → tab Ricette. Fetch da recipesApi.list("mikilab") filtrato panettoni.
- **CONDIVISIONE RICETTE**: pulsante Condividi (`share-recipe-<id>`) nel dettaglio ricetta → navigator.share o copia link `${origin}/?ricetta=<id>`. App.js legge `?ricetta=` → apre tab Ricette + toast (trilingue).
- **MOHAMMED (Il Tuo Laboratorio)**: `<MohammedAssistant/>` spostato IN FONDO alla pagina Maestro. Aggiunta GUIDA PASSO-PASSO (`mohammed-guide`, 5 step: materie prime/farine → impasto & Pesata → lievitazione & temperature → cottura & forno → HACCP & tracciabilità); ogni step invia a Mohammadreza una domanda che spiega quel passo. Suggerimenti aggiornati.
- **RIFINITURA MOBILE**: main pb-48 → pb-64 (FAB Radio/Parla non coprono le card).
- **VOCE AVATAR**: confermata voce attuale (ElevenLabs) per TUTTE le lingue IT/DE/EN; NIENTE voce su misura (scelta utente).

### DIRETTIVE OPERATIVE CONSOLIDATE (source of truth)
1. LINGUA: l'utente parla ITALIANO; rispondere sempre in italiano. Tutta la UND/UX trilingue IT/DE/EN.
2. LEGALE: nessun riferimento a "Stoccarda/azienda"; presentarsi come "Michele / MikiLab" (singola persona).
3. MONETIZZAZIONE: Lab €29,99/mese·€249/anno (PRO completo) · "Impara da Casa" €12,99/mese·€99/anno (Academy + 10 Diagnosi/mese) · acquisto singolo ricette €4,99 / panettoni €29,99 / tutte €149. Prezzi gestiti nel backend (INTERNAL_PRICES/RECIPE_PRICES), NON dal dashboard Stripe.
4. NAVIGAZIONE: Bottom bar = Home · Ricette · Il Tuo Laboratorio · Impara · Community. Diagnosi accessibile da Home (chip) e Academy. Impara = Impara da Casa · News · Enciclopedia del Pane (NIENTE Video Mentore, rimosso su richiesta).
5. ENCICLOPEDIA = solo teoria/wiki (nessuna ricetta). RICETTARIO = operativo (dosi/calcolatori).
6. AVATAR = statico? no: video presentazione con voce ElevenLabs (player nativo), spiega tutto il sito, in 3 lingue. Per cambiarlo servono nuovi file in /public.
7. SICUREZZA: mutazioni protette da login/admin. Nessuna operazione DB distruttiva (annunci legacy filtrati in lettura).
8. INTEGRAZIONI: Claude (chat), Gemini Nano Banana (immagini), OpenAI/ElevenLabs (voce), Stripe (pagamenti, key da env). Deferiti: PayPal, valori nutrizionali reali.

## v77 (2026-06) — Home "MikiLab Shop & Corsi" + note fix video
- **HOME SHOP & CORSI**: sostituita la card "I nostri Panettoni" con la sezione `home-shop-corsi` a 2 tab: (1) "Ricettari & Premium" (scroll panettoni €4,99 + CTA "Sblocca ricette e masterclass" → Ricette) · (2) "Corsi & Formazione" (`shop-corsi-content`, badge "Prossimamente · In Arrivo"). Verificato.
- **FIX VIDEO AVATAR HOME**: il "blocco" al tap è SOLO su produzione (build vecchia). In preview il player è già NATIVO (controls) e funziona → si risolve col REDEPLOY.
- **DA FARE (PROSSIMO INTERVENTO DEDICATO)**: riorganizzazione "Il Tuo Laboratorio" in 6 passi SENZA duplicati:
  P1 Config hardware (macchine/celle/frigo/dispositivi smart, no orari/piani) · P2 Le Mie Ricette & parametri forno · P3 Logistica & punti vendita (personale/turni) · P4 Pianificazione (Piano Settimanale + Piano Oggi con import automatico) · P5 Operatività (temp acqua, pesata guidata, timer autolisi/puntata/appretto, sensori) · P6 Chiusura & tracciabilità (Diario Impasti, Lotti, HACCP). Riorganizzare gli strumenti esistenti eliminando doppioni, senza perdere funzioni.

## v78 (2026-06) — Fix avatar tagliato + nota panettoni singoli
- **AVATAR TAGLIATO A METÀ**: TalkingAvatar video/poster da `object-cover` → `object-contain` (bg nero). Ora l'avatar si vede INTERO in Home e in Chiedi al Maestro (verificato).
- **PANETTONI SINGOLI**: confermato — ogni panettone è acquistabile singolarmente a €4,99 (dialog acquisto ricetta: buy-single €4,99; buy-panettoni €29,99 = tutti; buy-all €149). In Home ogni panettone mostra badge €4,99.
- **PENDING — LABORATORIO 6 PASSI**: non ancora eseguito (intervento ampio, richiede sessione dedicata con budget pieno). Struttura definita in v77. Da fare come priorità nel prossimo turno.

## v69 (2026-06) — Laboratorio in 6 passi + Punti Vendita + Concludi Giornata
- **"Il Tuo Laboratorio" ora a 6 PASSI stretti, zero duplicazioni** (Maestro.jsx STEPS): 1) Prima Configurazione Hardware (capo/freezer/bilancia/termo/market) 2) Le Mie Ricette & Parametri (aggiungi/scan/adatta) 3) Logistica & Punti Vendita (salespoints/turni) 4) Pianificazione Produzione (settimana/lavoro/inversa/spesa/foodcost) 5) Operativita In Corso (acqua/pesata/timer/meteo/ph/twin) 6) Chiusura & Tracciabilita (sessioni/lotti/haccp/check/shelf/spreco). Ogni strumento appare in UN SOLO passo.
- **Nuovo tool "Punti Vendita"** (SalesPoints.jsx, lib/salesPoints.js, localStorage `mikilab_sales_points`): CRUD nome/indirizzo/orari. Fix collisione etichetta: tool "termo" rinominato "Termostato & Clima" per distinguerlo da "Meteo & Laboratorio" (meteo).
- **Punti Vendita → Piano Settimanale**: selettore destinazione punto vendita per riga in WeeklyPlan (aggiornamento live via evento `mikilab-salespoints-changed`); campo `sale_point` aggiunto a WeeklyItem (backend server.py) e al salvataggio. i18n `weekly_salepoint_none` (it/de/en).
- **"Concludi Giornata"** (DayClose.jsx, Passo 6): riepilogo di chiusura (sessioni Diario Impasti + voci HACCP di oggi), nota facoltativa, archivio chiusura in localStorage `mikilab_day_closures` con ultima chiusura mostrata.
- **Foto braccio tatuato piu presente**: banner hero `bio-dough.jpg` in cima a "Il Tuo Laboratorio" + usato nelle nuove sezioni.
- Avatar video (object-contain) e "MikiLab Shop & Corsi" in Home: gia completati nella sessione precedente, confermati OK in preview.
- Testato via preview (admin): wizard 6 passi, CRUD Punti Vendita, integrazione Piano Settimanale, Concludi Giornata → tutto OK.

## v70 (2026-06) — Vetrina ricette, split Impostazione Macchine, avatar verde
- Ricette: nuovo menu VETRINA a griglia 2/riga con foto, raggruppate per categoria (no chip, no fisarmoniche); strisciolina tricolore + bandierina Paese su ogni card. Scheda ricetta + paywall + firma-tatuaggio invariati (verificato).
- Impostazione Macchine (CapoLaboratorio) ora SOLO attrezzature/celle + "Filma il laboratorio". La parte "cosa preparare" + generazione piano IA spostata in nuovo tool "Piano di Produzione (IA)" nel Passo 4 (PianoProduzioneAI.jsx).
- Home: rimosso avatar parlante (video) -> mostra avatar completo statico. Avatar parlante resta SOLO in "Chiedi al Maestro" con frase dedicata (transcript override, IT/DE/EN).
- Shop & Corsi spostato in fondo alla Home (prima di Condividi/Installa).
- Foto: generate 6 foto dedicate per le basi/prefermenti (LM solido/segale, LiCoLi, Poolish, Kochstueck, Miglioratore); corretta la foto di "Gnetze Brot" (pagnotta tonda craquele, non treccia). File in /public/recipes.
- Kochstueck rinominato "Farina Cotta (Kochstueck)" (name IT), name_de=Kochstueck, name_en="Cooked Flour (Kochstueck)"; SEED_VERSION bump v45 + "Kochstueck" in SEED_RETIRED_NAMES; reseed applicato in preview.
- Avatar finale: avatar ORIGINALE (michele-avatar.jpg) editato -> polo verde con stemma MikiLab dorato + orecchino a cerchietto + tatuaggio avambraccio; salvato in michele-avatar.jpg e michele-avatar-full.jpg (usati in Home + hero ricettario).
- NOTE/LEFTOVER: alcune ricette condividono la stessa foto (Baguette con Poolish & Filo di Francia -> r_filo.jpg; Brezel & Brezel Integrali -> r_bretzel.jpg). Da valutare foto distinte. Regressione completa via testing_agent fatta solo per il Laboratorio (iteration_54); vetrina/PianoIA/avatar verificati via screenshot.

## v71 (2026-06) — Foto extra, fusione Aggiungi/Scansiona, rifiniture post-test (iteration_55, 100%)
- Foto: Puccia Salentina (non più piadina), Baguette con Poolish (r_baguette_poolish.jpg) e Brezel Integrali (r_brezel_integrali.jpg) ora con foto DISTINTE (niente più immagini condivise). SEED_VERSION v46.
- Fusione: "Aggiungi ricetta" e "Scansiona ricetta" unite in UN'unica voce "Le Mie Ricette (aggiungi/scansiona)" (Passo 2). ScanRecipe ha prop embedded; RecipeList ha prop extraHeader. Tile 'scan' rimosso.
- Pagamenti: verificati COMPLETI (Stripe key+webhook presenti; subscription lab/home, academy, recipe unlock, webhook + status polling). Video corsi ancora demo (scelta utente).
- Fix post-test: ChefHat import mancante in RecipeList (crash su card senza foto) risolto dal tester; PaywallGate copy aggiornata (Impostazione Macchine, Le Mie Ricette); Home 'ricette' senza numero fisso; Piano IA pre-inserisce 1 riga prodotto + streamPhase controlla res.ok (messaggio PRO); RecipeList pb-28 per non coprire coi FAB.
- Testing: iteration_55 frontend 100% (vetrina, fusione, split macchine/PianoIA, foto, 6 passi, avatar).

## v48-live (2026-06) — Stripe LIVE + categoria Focacce
- Focaccia Barese spostata in categoria "focacce" (seed + reseed, SEED_VERSION v47). La sezione FOCACCE ora compare in vetrina.
- Stripe LIVE: inserite chiavi live dell'utente in backend/.env (STRIPE_SECRET_KEY sk_live_..., STRIPE_WEBHOOK_SECRET whsec_... del webhook di produzione https://mikilab.de/api/webhook/stripe).
- Fix "Managed Payments": aggiunto managed_payments={"enabled": False} a tutte e 3 le sessioni checkout (subscription, academy, recipe) per evitare il requisito tax_code. Testati tutti e 3: creano sessioni cs_live_ correttamente.
- Per PRODUZIONE: serve REDEPLOY per propagare le chiavi live + il fix managed_payments.

## v48-final (2026-06) — Ricettario ampliato + Community + posizionamento
- +16 ricette: 10 focacce (Genovese, Matera, Altamura, Cipolla di Tropea, Patate&Rosmarino, Olive&Rosmarino, Integrale ai Semi, Pomodorini Secchi, Dolce all'Uva, Cereali&Miele) e 6 pani (Ciabatta, Pane alle Olive, Pane Pugliese, Pane Casereccio, Pane Toscano, Filone di Semola). Tutte con foto locali in /public/recipes e procedimento IT/DE/EN. Totale 81 ricette visibili.
- Card ricetta: fallback icona ChefHat SEMPRE dietro la foto -> nessuna card vuota anche se un'immagine tarda/fallisce.
- Baguette (Baguette con Poolish + Filo di Francia) raggruppate in cima alla sezione Pane.
- Doppioni: ritiro INCONDIZIONATO dei nomi legacy (panettoni/panini vecchi) -> spariscono in produzione al redeploy. SEED_VERSION v48.
- Community: post di benvenuto ufficiale (autore 'Michele — MikiLab') pubblicato + seeder di avvio per la produzione. Testo allargato a fornai/pasticceri/pizzaioli.
- Posizionamento: copy IT/DE/EN allargata a fornai, pasticceri, pizzaioli e chi usa ricette/calcoli (assistente IA, 'Chi sono', share, paywall).
- Stripe LIVE configurato (chiavi utente) + fix Managed Payments su tutte le sessioni; 3 flussi testati (cs_live_).
- Testing: iteration_56 frontend 100%. Note minori non bloccanti: FAB overlap (ridotto padding), warning console span-in-option inesistente nel codice (falso positivo).

## v49 (2026-06) — Carote, ricette gratis, nota farina, high-five
- Panino alle Carote aggiunto (foto + procedimento IT/DE/EN). Totale 82 ricette.
- Ricette GRATIS (DEMO_RECIPE_NAMES): "Cuore Italiano" + "Focaccia Genovese" (visibili complete ai non-PRO).
- Card ricetta: aggiunta nota "Farina: ..." (Mehl/Flour) sotto il nome.
- Foto: generate 10 foto locali per i Panino* (niente piu icona vuota).
- DayClose: animazione "batti il cinque" tra avatar Michele e Mohammed alla conferma "Concludi Giornata" (data-testid dayclose-celebrate).
- SEED_VERSION v49.
