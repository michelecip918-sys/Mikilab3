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

## v50 (2026-06) — Filtri per Base, ricette Kochstück, Snack/Brezel, Tour Momy, Diagnosi nel Lab
- HighFive globale: montato anche nel ramo "strumento aperto" di Maestro (appare su salvataggio macchine/piano/IA). iteration_57 100%.
- FlourTable (tabella farine trilingue DE/IT/EN) inserita in "Le Mie Ricette" (collapsible) e nel Passo 2 del Laboratorio.
- Filtri "per Base" cliccabili (chip) su TUTTE le liste ricette: Tutte, Poolish, Biga, Lievito Madre, LM di Segale, LiCoLi, Farina Cotta, Diretto. recipeBase()/BASE_KEYS in RecipeList.jsx. Mostrati SEMPRE tutti.
- 3 nuove ricette con Farina Cotta (Kochstück) IT/DE/EN: Pan Latte in Cassetta (pane), Pane Morbido ai Cereali (pane), Panini al Latte Soffici (panini).
- 3 nuovi snack farciti: Croissant Farcito Salato, Panino Farcito all'Italiana, Panino Bavarese al Bretzel Farcito.
- Brezel + Brezel Integrali spostati da Pane -> Snack. Rimosso doppione base "Kochstück" (resta "Farina Cotta (Kochstück)").
- Snack esistenti (grissini, crackers, ecc.) portati nel seed JSON per la persistenza in produzione. TOT 88 ricette. SEED_VERSION v50.
- Tabella panettoni: colonne 1°/2°/Tot/% con padding-left + whitespace-nowrap (numeri distanziati).
- Tour guidato "LabOnboarding.jsx": intro avatar Michele + spiegazione dei 6 passi da Momy + slide comandi globali (voce/radio/diagnosi). Audio (SpeechSynthesis) + testo. Auto-apertura UNA volta (localStorage mikilab_lab_tour_done), ri-apertura da "Rivedi la guida" (mohammed-replay-tour / openLabTour).
- Diagnosi Foto aggiunta come strumento del Laboratorio (Passo 5) con banner esplicativo (impasti venuti male / macchine rotte -> foto -> causa+soluzione). PhotoDiagnosi renderizzato in Maestro.
- Testing: iteration_58 frontend 100% (6/6 feature), nessun difetto.

## v50.1 (2026-06) — Rifiniture
- Home: card "Diagnosi Foto" prominente e SEMPRE visibile (accesso rapido, terracotta) sopra la Community. data-testid home-diagnosi-card -> go("diagnosi").
- Tour Momy: aggiunta slide "Trova le ricette per Base" che spiega i chip filtro (Poolish, Lievito Madre, Segale...).

## v50.2 (2026-06) — Diagnosi Recenti + Tour completo
- Diagnosi Recenti: ogni diagnosi foto viene salvata (POST /api/diagnosi/save) con miniatura + risultato; lista ultime 10 per utente (GET /api/diagnosi/recent, DELETE /api/diagnosi/{id}). UI in PhotoDiagnosi: sezione "Diagnosi Recenti" (data-testid diagnosi-recenti/diagnosi-item-*/diagnosi-open-*/diagnosi-delete-*) — rivedi causa+soluzione senza rifare la foto. Collezione Mongo `diagnoses` (user_id, mode, result, thumb, created_at).
- Tour Momy espanso: slide "Tutti i miei strumenti" (elenco completo dei 27 strumenti raggruppati) + slide comandi aggiornata (Diagnosi legge difetti/impasto/ingredienti/macchine da foto o video + Diagnosi Recenti). Body slide scrollabile (max-h-40vh).
- Rifiniture: PhotoDiagnosi pb-24 (no overlap FAB), thumb con fallback icona Camera onError.
- Testing: iteration_59 frontend 100% (2/2). Backend diagnosi verificato via curl.

## v51 (2026-06) — Voce, Condivisione, Diagnosi Sonora, Quark, fix Brezel
- Voce tour Lab (voice.js): preferenza voce maschile + non-femminile, pitch 0.9 / rate 0.95 (più fluida, meno robotica).
- FlourTable ora visibile in TUTTE le liste ricette (anche Ricettario MikiLab), non solo personali.
- Condivisione universale (lib/share.js, Web Share API + fallback copia): aggiunta a Diagnosi Foto (risultato + ogni voce recente), Piano IA (capo-share), Diagnosi Sonora. WeeklyPlan la aveva già.
- Diagnosi Sonora (SoundDiagnosi.jsx + POST /api/diagnosi/sound): registra ~8s il suono dell'impastatrice, estrae feature (loudness/variabilità/regolarità ritmo) e Claude interpreta lo stato impasto (Ancora duro/In incordatura/Pronto) — stima "a orecchio" beta. Strumento nel Lab Passo 5; salva in Diagnosi Recenti (mode suono).
- Base Quark: aggiunto chip filtro "Quark" + 2 ricette (Panini al Quark/Quarkbrötchen [panini], Frittelle al Quark/Quarkbällchen [snack]) IT/DE/EN.
- FIX Brezel + Brezel Integrali: erano method_type=indiretto con "Vorteig" nelle note (venivano agganciate al filtro Biga). Ora impasto DIRETTO con autolisi, niente prefermento. SEED_VERSION v51. TOT 90 ricette.

## v52 (2026-06) — Voce ElevenLabs, Condivisione estesa, Diagnosi Sonora Pro
- Voce Momy ElevenLabs: endpoint POST /api/tts (voice_id Adam maschile, eleven_multilingual_v2) → mp3. LabOnboarding riproduce l'audio ElevenLabs con fallback alla voce del dispositivo (speak). Verificato via curl (mp3 44KB, HTTP 200). NB: elevenlabs==2.64.0 aggiunto a requirements.txt (mancava → avrebbe rotto il deploy).
- Condivisione estesa: aggiunto tasto Condividi (lib/share.js) a Lista Spesa (usa buildShoppingText) e Food Cost (riepilogo costi/margine). Ora share su: Diagnosi Foto+Sonora, Piano IA, Piano Settimanale, Lista Spesa, Food Cost.
- Diagnosi Sonora Pro: metro del ritmo in tempo reale durante la registrazione (barre animate da RMS live, data-testid sound-wave).
- ELEVEN_API_KEY già presente in backend/.env. MOMY_VOICE_ID override via env (default Adam).

## v53 (2026-06) — Indiretto, ricette LM, voce breve, video avatar Home, Impara
- Filtro base "Indiretto" aggiunto (BASE_KEYS + recipeBase: method_type indiretto o presenza prefermento → indiretto; altrimenti diretto). Molte ricette usano metodo indiretto.
- Ricette a lievito madre: "Focaccia a Lievito Madre" (focacce) + "Pane Casereccio a Lievito Madre" (pane), IT/DE/EN, pref lm, indiretto. SEED_VERSION v52-lm. TOT 92 ricette.
- Voce tour Momy accorciata: legge solo titolo + prime 2 frasi (voiceText) → ascolto più leggero.
- Home HomeAvatarScene: tap sull'avatar → parte il VIDEO parlante di Michele (michele-explainer-{lang}) nella stessa geometria (data-testid home-avatar-play/home-avatar-video). Voce "più umana" del video = rimandata (scelta voce domani).
- Sezione Impara (AcademyHome): aggiunto percorso guidato "Da dove inizio?" (3 step → sub-tab) + badge statistiche (n. farine, ricette calcolabili, Diagnosi IA) nella hero.

## v54 (2026-06) — Voci Momy/Michele + percorso a tappe + audio più umano
- Voci ElevenLabs assegnate: Momy=Brian (nPczCjzI2devNBz1zQrb, profondo/rassicurante), Michele=George (JBFqnCBsd6RMkjVDRZzb, caldo/narratore). /api/tts accetta voice=momy|michele (map _VOICE_MAP). Override via env MOMY_VOICE_ID / MICHELE_VOICE_ID.
- LabOnboarding: slide Michele usa voce michele, resto voce momy (playVoice(text, who)).
- Audio più umano: rimosse emoji/simboli dal testo letto (stripForVoice) — niente piu "saluto con mano" pronunciato; voice_settings piu espressive (stability .45, style .35, sim .8).
- Impara: "Da dove inizio?" ora è un PERCORSO A TAPPE che segna i passi completati (localStorage mikilab_impara_path), badge X/3 + spunte + messaggio di completamento. Verificato a schermo.

- v54.1: Michele si presenta ("Ciao sono Michele") una sola volta (flag mikilab_michele_greeted); poi la voce legge solo il contenuto. Deploy check PASS.

## v55 (2026-06) — Selettore voci, ricette LM, ricompensa percorso, PDF
- Selettore voci (VoiceSettings.jsx): scelta + ANTEPRIMA ("ascolta") di 5 voci ElevenLabs per Momy e Michele; salvate in localStorage (mikilab_voice_momy/michele); /api/tts accetta voice_id raw; LabOnboarding usa getVoiceId(who). Aperto da MohammedAssistant (mohammed-voice-btn). Verificato a schermo.
- Ricette LM: Baguette a Lievito Madre + Pane Integrale a Lievito Madre (pane, indiretto), IT/DE/EN. SEED_VERSION v53. TOT 94 ricette.
- Ricompensa percorso Impara: badge "Fornaio Diplomato" al completamento 3/3 (academy-path-complete).
- Condividi come PDF: pulsante window.print() aggiunto a Lista Spesa (spesa-pdf) e Diagnosi (photo-pdf-btn); i piani avevano già la stampa.
- NON fatto (per scelta/limite): video masterclass (rimandato dall'utente); rigenerazione audio del VIDEO di Michele in Home con voce George → limite tecnico (l'avatar video ha lip-sync sull'audio registrato, sostituirlo desincronizza le labbra). Il selettore voci applica George alla voce TTS di Michele (tour), non al video preregistrato.

## v56 (2026-06) — Voce nella Diagnosi, badge profilo, PDF col logo
- lib/tts.js (playTTS/stopTTS, pulizia markdown/emoji) + ListenButton.jsx: pulsante "Ascolta" con voce scelta. Aggiunto a Diagnosi Foto (photo-listen-btn) e Diagnosi Sonora (sound-listen-btn) — legge causa/soluzione.
- Badge "Fornaio Diplomato" nella dashboard personale Home (home-badge-diplomato) al completamento del percorso Impara (localStorage mikilab_impara_path).
- PDF col logo: PrintHeader.jsx (logo-256.png + titolo + data, classe .print-only) aggiunto nelle aree stampabili di Diagnosi Foto e Lista Spesa (avvolte in .print-area). Stili .print-only in index.css.

## v57 (2026-06) — Voce/PDF nel Ricettario + badge obiettivo
- Scheda ricetta (RecipeDetail in RecipeList.jsx): pulsanti "Ascolta" (listen-recipe-*, legge nome+procedimento con voce Momy via playTTS) e "PDF/Stampa" (pdf-recipe-*, window.print). Visibili solo su ricette SBLOCCATE con procedimento. Contenuto avvolto in .print-area con PrintHeader (logo). Verificato a schermo (admin).
- Badge "Fornaio Diplomato" in Home dashboard ora SEMPRE visibile: grigio+lucchetto ("obiettivo", tappabile → Impara) se percorso incompleto, verde+medaglia se completato (home-badge-diplomato).

## v58 (2026-06) — Ascolta multilingua, badge Community, PDF tabella dosi
- Ascolta ricetta multilingua: già funzionante — RecipeDetail usa lang globale impostata dai tasti IT/DE/EN della scheda; playTTS invia lang (eleven_multilingual_v2 legge nella lingua giusta).
- Badge "Fornaio Diplomato" mostrato anche in Community (community-badge, banner) quando il percorso Impara è completato (localStorage mikilab_impara_path).
- PDF ricetta: aggiunta classe .print-table alla tabella ingredienti + CSS di stampa (bordi/righe puliti) e no-print sul campo scala; il PDF esce con tabella dosi ben formattata.

## v59 (2026-06) — Ascolta il Piano + Livelli Badge
- Ascolta il Piano: ListenButton (capo-listen) nel Piano di Produzione IA — legge il piano a mani libere con la voce Momy.
- Livelli Badge: in Home il badge è ora un LIVELLO progressivo (🥖 Apprendista 0/3 → 🥐 Fornaio 1-2/3 → 🏅 Maestro 3/3) basato sul percorso Impara (localStorage). Tap → Impara.
- DEFERITO: PDF Multi-Ricetta (unico PDF con tutte le ricette del piano settimanale) — richiede una vista di stampa dedicata che raccoglie e formatta ogni ricetta del piano; da fare nel prossimo giro.

## v60 (2026-06) — Livello reale + Ascolta il Diario
- lib/level.js: XP reale (localStorage mikilab_xp). addXP su: ricetta creata (+2, RecipeList handleSave), diagnosi foto (+1), diagnosi sonora (+1), chiusura giornata (+2, DayClose). getLevel = passi Impara (0-3) + XP: <4 Apprendista, 4-9 Fornaio, 10+ Maestro. Badge Home usa getLevel. Verificato a schermo (Apprendista).
- Ascolta il Diario: ListenButton (dayclose-listen) in Concludi Giornata legge il riepilogo (sessioni impasto, HACCP, nota) con voce Momy.

## v61 (2026-06) — PDF Multi-Ricetta + causa voce femminile
- PDF Multi-Ricetta (WeeklyPlan.jsx, pulsante weekly-pdf-multi-btn): unico PDF stampabile con (1) intestazione logo MikiLab, (2) riepilogo del piano, (3) TUTTE le ricette del piano raggruppate per GIORNO, ciascuna con ingredienti SCALATI (pezzi × grammi → base GRAM_FIELDS + extra_ingredients per grammi/percentuale), procedimento, fasi di lavorazione e cottura. Usa window.open + HTML/CSS di stampa (page-break-inside:avoid). Localizzato IT/DE/EN (rLoc/ingLoc). Verificato a schermo (admin, piano di test lun/mer).
- CAUSA voce femminile di Momy (anche in preview): NON è un bug del codice. I crediti ElevenLabs sono ESAURITI (API 401 quota_exceeded, 0/10000 crediti). Con ElevenLabs KO, l'app ripiega su Web Speech del dispositivo (voce femminile su alcuni device). RIMEDIO utente: ricaricare i crediti su elevenlabs.io. Il fallback in voice.js già forza voce maschile + pitch basso quando possibile.

## v62 (2026-06) — Voce gratuita per Mohammed + pulizia simboli
- MohammedAssistant.jsx: pulsante "Ascolta"/"Ferma" (mohammed-listen-{i}) su OGNI risposta dell'assistente. Usa speak() di voice.js = voce GRATUITA del dispositivo (Web Speech), forzata MASCHILE (MALE_HINTS + pitch 0.8), nessun costo ElevenLabs. Toggle play/stop, primeVoice per iOS.
- voice.js: nuova cleanForSpeech() applicata dentro speak() → la voce legge SOLO le parole. Rimuove: blocchi/codice inline, link markdown, emoji, elenchi numerati "1)"/"2.", elenchi puntati/trattini a inizio riga, trattini isolati fra spazi, simboli #*_~>|•·, virgolette caporali. Mantiene i trattini dentro le parole (es. "passo-passo"). Vale per TUTTE le voci gratuite (Mohammed, assistente vocale, diagnosi, sveglia, ecc.). Verificato a schermo (spoken text senza simboli markdown).

## v63 (2026-06) — Voce maschile GRATUITA ovunque
- tts.js playTTS(): quando ElevenLabs non risponde (es. crediti 0) fa FALLBACK automatico a speak() di voice.js (voce maschile gratuita del dispositivo). Prima restava muto → tutti i pulsanti "Ascolta" (ricette listen-recipe-*, Piano IA capo-listen, DayClose, Diagnosi) ora funzionano gratis. stopTTS() ferma anche speechSynthesis.
- voice.js speak(): pitch ADATTIVO → 0.85 se trova una voce maschile sul device, 0.55 se non c'è (abbassa molto il tono per timbro maschile anche con voci femminili — unica leva gratuita). onEnd callback opzionale (u.onend/onerror). Nuovo stopSpeak(). cleanForSpeech applicata sempre.
- GuidedWeighing.jsx: il local speak() usava SpeechSynthesisUtterance grezzo (voce di default = spesso femminile). Ora delega a speakMale (import { speak as speakMale } from lib/voice).
- MohammedAssistant.jsx: pulsante Ascolta (mohammed-listen-*) con voce maschile gratuita.
- Verificato a schermo: tour del Laboratorio → fallback speak() con pitch 0.55, testo senza simboli/virgolette.
- NB PRODUZIONE: le modifiche sono in preview; su mikilab.de servono "Save to GitHub" → Deploy. Per la voce PREMIUM (Brian/George) ricaricare crediti ElevenLabs.

## v64 (2026-06) — PDF per Punto Vendita + niente voce premium
- WeeklyPlan.jsx: rifattorizzato writeRecipesPdf({subtitle, byDay}) riusabile; buildFullByDay(filterItem) accetta un filtro. pdfMultiRicetta = tutte le ricette. NUOVO: pdfPerSalePoint(nome) → PDF separato per negozio con SOLO le sue ricette (filtro su item.sale_point), header con badge 🏪 nome negozio, riepilogo + ricette scalate. UI: riquadro "PDF per Punto Vendita" (weekly-salepoint-pdf) con un pulsante per ogni negozio che ha ricette assegnate (weekly-salepoint-pdf-{nome}); assignedPoints = punti vendita usati nel piano. Verificato a schermo (Negozio Centro = solo Anima Integrale, non Baguette).
- VOCE: rimossa del tutto la voce PREMIUM (ElevenLabs) su richiesta utente. tts.js playTTS() ora usa SOLO speakFree() (voce maschile gratuita del dispositivo), niente fetch /api/tts. LabOnboarding.playVoice() usa speak() diretto. MohammedAssistant: rimosso il pulsante "Scegli le voci (Momy e Michele)" e VoiceSettings (erano per le voci premium). L'endpoint backend /api/tts resta ma non è più chiamato dal frontend.

## v65 (2026-06) — XP Prossimo Livello + Etichette Sacchetti
- level.js: nuova getLevelProgress(L) → {isMax, remaining (punti al prossimo livello), target, nextName, nextIcon, pct}. Soglie: Apprendista<4, Fornaio 4-9, Maestro 10+.
- Home.jsx (home-personal): sotto il badge Livello, riquadro home-level-progress → "Ti mancano N punti per diventare 🥐 Fornaio/🏅 Maestro" + barra avanzamento (pct) + hint su come guadagnare punti (ricette, diagnosi, chiusura giornata). Se Maestro → "Livello massimo raggiunto". Verificato (XP=2 → mancano 2 a Fornaio).
- WeeklyPlan.jsx: printLabels(filterItem, subtitle) → foglio etichette stampabili (window.open), una etichetta per pezzo (cap 40/prodotto), con 🌾 MikiLab, nome pane (rLoc), peso (grams_per_piece), data, negozio (sale_point). Griglia 58×34mm, page-break-inside:avoid. Pulsante globale weekly-labels-btn + per negozio weekly-salepoint-labels-{nome}. Sezione "Per Punto Vendita" ora ha per ogni negozio 2 pulsanti: Ricette PDF + Etichette. Verificato (70 etichette 20+40+10, peso/data/negozio corretti).

## v66 (2026-06) — Lista Spesa per Negozio + Etichette con scadenza
- WeeklyPlan.jsx pdfShoppingPerShop() (weekly-shopping-shop-btn): PDF unico con la lista della spesa DIVISA per punto vendita. Raggruppa items per sale_point (+ "Senza negozio"), calcola gli ingredienti con computeShopping(items[{recipe_id,grams}], recipeById, lang). Ogni negozio: sezioni Farine (flourByType), Base impasto (Acqua/Prefermento/Sale via otherLabel), Altri ingredienti (extras via ingLoc). Header logo. Verificato (Negozio Centro/Stazione con farine, acqua, extra corretti).
- Etichette con scadenza: nuovo recipeShelfDays(r) in WeeklyPlan.jsx — base per tipo (panettone 30, brezel 2, baguette/panini/ciabatta 2, dolci/focaccia 4, pane 3) × fattore fermentazione (bulk+proofing, come Shelf-Life). printLabels ora aggiunge riga "Da consumarsi entro: <data>" (oggi + giorni). Altezza etichetta 34→38mm. Verificato (Baguette 26/08 = +2gg, Anima Integrale 27/08 = +3gg).

## v67 (2026-06) — Ristrutturazione "Il Tuo Laboratorio" (6→3 passi)
- Maestro.jsx: STEPS ridotti da 6 a 3, si PARTE dalle ricette (step index 0):
  * Passo 1 "Le Mie Ricette": tools aggiungi, adatta + FlourTable (start).
  * Passo 2 "Piano di Produzione" (pianoHub): banner maestro-piano-hub-info + scheda pianoai in evidenza (col-span-2, gradient verde) + settimana, lavoro, inversa, spesa, foodcost, salespoints, turni.
  * Passo 3 "Laboratorio & Chiusura": tutto il resto (capo, freezer, bilancia, termo, market, acqua, pesata, timer, meteo, ph, twin, diagnosi, suono, sessioni, lotti, haccp, check, shelf, spreco) con diagnosiInfo + conclusione. NULLA eliminato.
- PianoProduzioneAI.jsx: nuovo prop onOpenTool + barra "Tutto in un posto" (capo-quicklinks) con 7 scorciatoie rapide (capo-quicklink-{settimana,lavoro,inversa,spesa,foodcost,salespoints,turni}) che chiamano onOpenTool(id) → aprono lo strumento direttamente senza tornare indietro. Passato da Maestro: <PianoProduzioneAI onOpenTool={setTool} />.
- Verificato con automazione: 3 step, step1=Ricette, step2 hub+card+tool, 7 quicklink, navigazione quicklink→WeeklyPlan OK.
- NOTA: richiesta utente "semplificare anche la Home" NON ancora affrontata (Home attuale è già una griglia di scorciatoie + badge livello).

## v68 (2026-06) — Home semplificata e riorganizzata
- Home.jsx riordinata (nulla eliminato): ordine nuovo = Avatar hero → Dashboard personale (saluto + livello/progress + scorciatoie) → "Esplora MikiLab" (audiences cliccabili + griglia SECTIONS spostata IN ALTO per accesso immediato) → Accesso rapido (Diagnosi + Community, card compatte affiancate) → Chiedi al Maestro → blocco richiudibile "Scopri MikiLab" (home-story-toggle) che raccoglie bio-card + home-promo + 4 concetti + battuta (chiuso di default) → Shop & Corsi → ShareInstall → legale.
- Nuovo stato storyOpen. Rimosse ridondanze minori (chip diagnosi doppione, testo "come guadagni punti") per pulizia. Verificato a schermo (sezioni in alto, story collassato, espansione OK).
- RICHIESTA APERTA utente: "riordinare TUTTO il sito, renderlo moderno/unico/adatto a tutte le aziende, senza cancellare nulla". Da affrontare via design_agent (blueprint coerente) e applicare sezione per sezione.

## v69 (2026-06) — Design IT/DE + PDF completo + modalità Casa (impara)
- DESIGN (blueprint completo in /app/design_guidelines.json, palette calma con accenti Italia+Germania come tema primario, nastro tricolore firma). Applicato GLOBALE a basso rischio: Header.jsx ora usa .it-de-ribbon (index.css) = nastro 3px verde#4A7265→crema#F6F4EE→rosso#A64B2A→oro#C88A2B→carbone#1E1B18. Restyle totale delle sezioni = rollout incrementale documentato (non applicato in blocco per non rompere gli hex hardcoded esistenti).
- PianoProduzioneAI.jsx: pulsante stampa rinominato "PDF Completo (piano + spesa + ricette)" — window.print() stampa già .print-area con piano IA + ordine fornitori + ricette.
- PianoProduzioneAI.jsx: aggiunta scelta "Dove impasti?" (capo-biztype: capo-biztype-pro / capo-biztype-casa). Modalità Casa (imparo): preferment lievito_birra, temp 22, nota "piccole quantità, forno di casa, spiegazioni semplici". Sostituisce i preset professionali (utente ha detto "Senza preset" → "aggiungi se impara da casa"). Verificato a schermo.
- NON FATTO: "Costi in € nel Piano IA" — richiede dato costo per ricetta/ingrediente che il modello ricette NON possiede oggi (FoodCost è un calcolatore standalone su localStorage). Da valutare aggiungendo prezzi ingredienti al modello.

## v70 (2026-06) — Modalità Casa reale + nastro PDF + Enterprise spostato nel Lab
- PianoProduzioneAI: streamPhase ora invia mode = (bizType==="casa" ? "home" : "pro"). Il backend /capo/plan ha già la branch mode=="home" (linguaggio semplice, piano passo-passo per principianti). Verificato: request body mode="home".
- WeeklyPlan PDF: aggiunto nastro tricolore IT/DE (4px, verde→crema→rosso→oro→carbone) in cima ai 3 documenti stampabili (writeRecipesPdf, printLabels, pdfShoppingPerShop).
- RIORDINO VOCI HOME (utente: "Enterprise fa parte del laboratorio? Metti le voci al posto giusto, non cancellare nulla"): rimosse dalla griglia "Esplora MikiLab" le card `enterprise` e `diagnosi` (doppioni/funzioni PRO da laboratorio). Enterprise SPOSTATO dentro Maestro (Il Tuo Laboratorio) Passo 2 come tool `enterprise` → <EnterpriseHub/> (import aggiunto, icona Building2). Diagnosi resta nel Passo 3 del lab + card dedicata in Home. Nulla eliminato, solo ricollocato. Verificato a schermo.

## v71 (2026-06) — Piano IA semplificato (ricette panettiere in cima + 2 campi)
- PianoProduzioneAI: caricamento ricette ordina le PERSONALI (panettiere, flag _own) PRIMA delle mikilab. Il select prodotto usa 2 optgroup: "Le mie ricette (panettiere)" + "Ricette MikiLab".
- Riga prodotto ridotta a 2 CAMPI: Ricetta + Quantità (con suffisso pezzi/kg). unit/gpp/giorno spostati sotto un toggle per-riga "Opzioni" (capo-product-opts-{i}, campo _opts sul prodotto), nascosti di default.
- Verificato: default mostra solo recipe+qty, "Opzioni" rivela unit/gpp/day, optgroup labels corretti.

## v72 (2026-06) — Restyle sezioni + Piano IA rifatto (richiesta utente)
- RESTYLE (step a): RecipeList hero e AcademyHome hero ora hanno il nastro tricolore .it-de-ribbon in cima + filo oro (#C88A2B) sotto il titolo; overlay hero passato a #1E1B18 (carbone). Verdi calmi mantenuti (accento italiano). Header globale già con .it-de-ribbon.
- PIANO IA RIFATTO (utente insoddisfatto, "rifallo"): quicklinks riorganizzati → 4 PRINCIPALI in evidenza (card verdi 2x2): Inserisci Ricette (aggiungi), Piano Giornaliero (lavoro), Produzione Settimanale (settimana), Celle Frigo & Freezer (capo). Sotto "Altri strumenti (opzionali)" (card bianche): Orari (inversa), Lista Spesa (spesa), Food Cost (foodcost), Punti Vendita (salespoints), Turni (turni). NULLA eliminato (il sito resta com'è).
- Raccolta MAGGIORI DATI: aggiunti al form capo-staff (Personale in turno) e capo-std-temp (Temp standard lab), oltre a start-time e lab-temp esistenti; celle/impastatrici/temp arrivano da labConfig. Backend /capo/plan usa già mixers+cells (frigo/freezer/lievitazione)+staff+temp e genera destinazioni celle/freezer nel piano settimanale. Tip aggiornato → "Celle Frigo & Freezer".
- Verificato a schermo: 4 voci principali + 5 opzionali, staff field, "Inserisci Ricette" apre la schermata ricette.

## v73 (2026-06) — Restyling altre sezioni (accenti IT/DE)
- NewsPage: sostituita vecchia fascia bandiere con .it-de-ribbon + filo oro (#C88A2B) sotto il titolo; hero gradient → #4A7265/#325046 (salvia calma).
- PhotoDiagnosi: hero con .it-de-ribbon + filo oro; gradient salvia.
- Enciclopedia + Community: filo oro sotto l'h1, icona chip → #4A7265 (verde salvia italiano).
- Coerenza con Ricette/Impara/Header. Verificato a schermo (News + Enciclopedia).

## v74 (2026-06) — Logica freezer + avvisi automatici nel Piano IA
- backend /capo/plan: aggiunta direttiva condivisa (IT/DE, tutte le fasi weekly/daily) che impone:
  1) Ripartizione per OGNI prodotto: oggi / domani (frigo) / resto in FREEZER come scorta, con stima di DURATA della scorta in base al consumo giornaliero (es. Baguette gio 600 → 100 oggi, 100 domani, 400 freezer, scorta fino a venerdì). Tabella/elenco per prodotto: oggi/domani/freezer/scorta fino a.
  2) AVVISI AUTOMATICI con orario/innesco: quando attaccare impasti/prefermenti (giorno prima), rinfrescare LM, tirare fuori da freezer/frigo, e AVVISO quando la scorta freezer sta per finire. "Il panettiere non deve calcolare nulla."
- Verificato: direttiva presente nell'output template (freezer/oggi/domani/avvisi compaiono). Verifica end-to-end della ripartizione numerica DA FARE dall'app con prodotto reale (il curl di test non passava i prodotti nel formato giusto).
- Conferma struttura Lab (richiesta utente): tutto interconnesso via hub Piano IA; "sezione 2" = strumenti opzionali che restano disponibili ma non obbligatori.

## v75 (2026-06) — L'AI conosce il freezer in dettaglio e genera tutto
- backend /capo/plan: CapoPlanRequest.freezer_stock: List[dict] ([{name,qty,min_qty}]). Costruito freezer_txt e iniettato nel context (de+it) come "GIACENZE FREEZER ATTUALI (usale per prime!)". Direttiva freezer aggiornata: usa le giacenze PER PRIME, produci solo la differenza, aggiorna cosa entra nel freezer.
- frontend PianoProduzioneAI: carica GET /freezer all'avvio (setFreezerStock) e invia freezer_stock nel payload /capo/plan.
- VERIFICATO E2E: freezer 150 baguette (min 50) + ordine 600 gio → l'AI calcola 100 utilizzabili, 500 da produrre, ripartizione oggi/domani/freezer + tabella fabbisogno + avvisi. Tutti i marker presenti (freezer, giacenze, precotte, 150, oggi, domani, scorta, avvisi).
- NB formato payload prodotti: il frontend invia items:[{recipe_id,name,quantity,unit,day}] (quantity, NON qty).

## v76 (2026-06) — Campi obbligatori nel Piano IA
- PianoProduzioneAI: validProducts = prodotti con recipe_id && qty>0. canGenerate = validProducts>0 || (useWeekly && weeklyItems>0). Il pulsante capo-generate è DISABILITATO finché non c'è almeno una ricetta con quantità; mostrato hint capo-generate-hint "Obbligatorio: scegli almeno una ricetta e la quantità". generate() blocca con toast se non valido.
- Hero del Piano IA aggiornato a .it-de-ribbon (coerenza col resto).
- Verificato a schermo: disabilitato+hint senza ricetta → abilitato dopo ricetta+qty.

## v77 (2026-06) — Avvisi consigliati (non bloccanti) impastatrici/celle
- PianoProduzioneAI: banner capo-setup-hint mostrato se mancano mixers O cells (prima solo se mancavano entrambi). Elenca dinamicamente cosa manca (impastatrici e/o celle lievitazione/frigo/freezer) + bottone capo-setup-hint-btn "Configura ora" → onOpenTool("capo"). NON blocca la generazione (solo consigliato). Verificato a schermo.

## v78 (2026-06) — Ricette dentro il Piano di Produzione (2 passi)
- Maestro STEPS: da 3 a 2. Rimosso il passo separato "Le Mie Ricette". Ora Passo 1 = "Piano di Produzione" (pianoHub + flourTable) con tools: pianoai, aggiungi, adatta, settimana, lavoro, inversa, spesa, foodcost, salespoints, turni, enterprise. Passo 2 = "Laboratorio & Chiusura" (invariato). Le ricette si gestiscono dentro la sezione Piano di Produzione + quicklink "Inserisci Ricette" nel Piano IA.
- Verificato: 2 step, pianoai/aggiungi/adatta presenti nel Passo 1.

## v79 (2026-06) — Ricette solo come scorciatoia nel Piano IA + Shop "in arrivo"
- Maestro: rimosso "aggiungi" dalle schede del Passo 1 (resta SOLO come quicklink "Inserisci Ricette" / capo-quicklink-aggiungi dentro il Piano IA). "adatta" (Adatta al Forno) spostato dal Passo 1 al Passo 2 (servizio extra, non serve a generare). Passo 1 tools: pianoai, settimana, lavoro, inversa, spesa, foodcost, salespoints, turni, enterprise (+ flourTable).
- Home: sezione "MikiLab Shop & Corsi" spostata IN FONDO (dopo ShareInstall). Rimossi carousel panettoni e CTA che rimandavano a ricette. Ora shop-coming-soon: tab "Shop Ricette" / "Corsi Online", card "IN ARRIVO A BREVE" (Shop di tutte le mie ricette / Corsi online), nessun redirect. Nastro tricolore sulla card.
- Verificato a schermo: step1 senza aggiungi/adatta, quicklink Inserisci Ricette presente, adatta nel Passo 2, shop coming-soon in fondo.

## v80 (2026-06) — Passo 1 ripulito dai doppioni del Piano IA
- Maestro Passo 1 tools ridotti a ["pianoai", "enterprise"] (+ flourTable). Rimosse le schede settimana, lavoro, inversa, spesa, foodcost, salespoints, turni perché già presenti come scorciatoie DENTRO il Piano IA (capo-quicklink-*). Enterprise resta (non è nel generatore). Verificato a schermo.

## v81 (2026-06) — Shop unificato + ricette vendibili + quiz evidenziato
- Home: rimossa card "shop" dalla griglia Esplora (shop ora SOLO nel blocco unico in fondo). Tab "Shop Ricette" (premium) ora ATTIVA/vendibile: badge "Disponibile ora" + bottone shop-recipes-cta → go("ricette"). Tab "Corsi Online" resta "In arrivo a breve". (Le ricette di Michele sono già vendibili; prodotti/corsi no.)
- AcademyHome: tab "Corsi & Quiz" evidenziata (ring oro #C88A2B + badge 🎯) per mettere in risalto i quiz. Verificato a schermo.
- IN SOSPESO: riorganizzare le voci del menu Esplora (News/Enciclopedia in una sezione sotto vicino a Community; rivedere Diagnosi Foto/Impara già presenti nel Lab). Richiesta "Rivedi avatar Mohammed con i suoi nuovi comandi" = da chiarire cosa intende per "nuovi comandi".

## v82 (2026-06) — Tabelle & Farine dentro le Ricette + nota culturale
- Ricette.jsx: nuovo UtilBtn "Tabelle & Farine" (ricette-farine-btn) → view "farine" con hero (nastro tricolore + accento oro) + NOTA PERSONALE di Michele sulla cultura del grano (IT/DE/EN) + <FlourTable embedded />. Griglia util a 3 colonne (Guida, Farine, Etichette).
- Maestro: rimosso flourTable dal Passo 1 (spostato nelle Ricette).
- Verificato a schermo (vista farine con nota + tabelle).
- IN SOSPESO (ask_human aperta): "Rivedi avatar Mohammed con i suoi nuovi comandi" — attendo dall'utente cosa intende per nuovi comandi.

## v83 (2026-06) — Avatar Mohammadreza: comandi/suggerimenti aggiornati
- MohammedAssistant.jsx: aggiornati i 4 suggerimenti chat ai nuovi comandi (genera piano IA, oggi/domani/freezer, quale farina, quando attaccare impasti/rinfrescare). Verificato a schermo (4 suggest visibili).
- NOTA: il blocco GUIDE ("Guida passo-passo del laboratorio", 5 voci) è ancora sul vecchio schema 5 passi — è contenuto educativo separato dal wizard (ora 2 passi); da rinfrescare in futuro se serve.

## v84 (2026-06) — Piano IA salvato e ripristinato (non si perde)
- Backend: nuovo modello CapoLastPlan + endpoint GET/PUT/DELETE /api/capo/last-plan (per utente, chiave user_id). Salva plan_text + state (products, useWeekly, staff, temps, startTime, notes, preferment, bizType) + saved_at.
- Frontend PianoProduzioneAI: al mount ripristina l'ultimo piano (capoPlanApi.get) con testo + stato form. Dopo generate() → persistPlan() salva su backend; banner capo-saved-banner "Piano salvato — resta qui finché non lo chiudi tu / Salvato il …". Bottone capo-new-plan (RotateCcw) cancella (DELETE) e ripulisce. Toast di warning se il salvataggio fallisce.
- Testato (iteration_60 + 61): persistenza confermata dopo back+reopen e dopo reload pagina; delete persiste.

## v85 (2026-06) — Ricettario condiviso: ricette personali dell'owner agli abbonati/VIP
- Backend get_recipes (mikilab): oltre alle ricette MikiLab, include ANCHE le ricette collection=personal di owner/admin (OWNER_EMAILS o role=admin), con stesso gating PRO (teaser per non-PRO, complete per PRO/VIP/admin). Esclude le ricette dell'utente corrente per evitare doppioni (le riceve già dalla lista personal). owner_id rimosso dal payload.
- Testato via curl: non-PRO vede teaser locked, PRO vede complete, admin senza duplicati.

## v86 (2026-06) — "Enciclopedia del mio pane" in Le Mie Ricette + Tabella Farine solo in MikiLab
- Enciclopedia.jsx: titolo → "Enciclopedia del mio pane" (IT/DE/EN, enc_title/enc_sub). Esporta ENC_ENTRIES. Aggiunte ~17 spiegazioni tecniche (incordatura, prova del velo, puntata, apretto, staglio, pirlatura, pieghe, TFI, fermolievitazione, rinfresco, vapore, valvola, maglia glutinica, W/PL, sale, oven spring, grigne). Nuova prop embedded → pannello collassabile (enciclopedia-embedded / enc-panel-toggle).
- RecipeList.jsx: FlourTable solo se collectionName==="mikilab"; <Enciclopedia embedded /> solo se collectionName==="personal". LearnHub tab rinominata.
- Testato (iteration_61): PASS.

## v87 (2026-06) — Il Tuo Laboratorio senza doppioni + Digital Twin da ricetta
- DoughTwin.jsx: selettore ricetta (twin-recipe) che precompila idratazione/sale/lievito dai grammi; campo ora d'inizio (twin-start-time); banner picco (twin-peak-alert) "Picco tra Xh Ym · verso le HH:MM".
- PianoProduzioneAI: scorciatoie ampliate con Giacenze Freezer (capo-quicklink-freezer) e Digital Twin (capo-quicklink-twin) → il Piano IA è l'UNICA interfaccia con tutte le voci.
- Maestro STEPS[1].tools: rimossi capo/freezer/twin (ora solo nel Piano IA) → nessun doppione nel grid strumenti dello Step 2.
- Testato (iteration_61): PASS (dedup confermato, twin prefill + picco funzionanti).

## v88 (2026-06) — "Panettone dinamico" tolto dall'anteprima del Laboratorio
- PaywallGate FEATURES.lab: sostituita la voce "Panettone dinamico" (non pertinente al Lab, vive nelle Ricette) con "Piano di Produzione con IA" (IT/DE/EN). Il Panettone dinamico resta nella sezione Ricette (ricette-labels-btn).

## v89 (2026-06) — Impasto di partenza scelto dal panettiere (Piano IA)
- PianoProduzioneAI: per ogni prodotto con ricetta appare "Parti da qui" (capo-product-start-N, icona Flag). Toggle MUTUAMENTE ESCLUSIVO (solo un impasto di partenza). Inviato come items[].start al backend + didascalia esplicativa.
- Backend capo_plan_stream(): se un item ha start=true, inietta direttiva [PARTENZA]/[START] nel blocco prodotti → l'IA avvia la sequenza da quell'impasto.
- Testato (iteration_62): mutua esclusione + payload start verificato sul wire + generazione OK.

## v90 (2026-06) — Home riordinata dal design_agent (niente doppioni con la barra)
- design_agent → blueprint in /app/design_guidelines.json (7 blocchi sequenziali, palette invariata, strategia FAB).
- Home.jsx: RIMOSSI i doppioni della bottom-nav (home-audiences, home-sections/SECTIONS, home-community-card). 
- NUOVO blocco evidenziato "Il cuore di MikiLab" (home-core, badge oro "L'anima del sito"): Il Tuo Laboratorio (home-core-maestro, anello oro + PRO), Le Mie Ricette (home-core-ricette), I Miei Corsi (home-core-corsi → tab shop/Academy).
- NUOVO "Strumenti & Risorse" (home-hub-destinations): solo destinazioni NON nella barra → Diagnosi Foto, Enciclopedia del mio pane, News, Enterprise. Restano Chiedi al Maestro, Scopri MikiLab, Shop & Corsi, footer.
- Testato (iteration_62): tutte le navigazioni Home + bottom-nav OK, nessun doppione, nessun crash.
- COSMETICO IN SOSPESO (carry-over 60/61/62): FAB Radio/Parla si sovrappongono ai contenuti su mobile; warning dev "<span> in <option>" nei select ricette; input time nativo 12h.

## v91 (2026-06) — 3 miglioramenti richiesti dall'utente
- SVEGLIA AL PICCO (DoughTwin): pulsante "Avvisami al picco" (twin-alarm-set) → Notification API + navigator.vibrate + beep WebAudio + toast, schedulato a tPeak ore da ora; "Sveglia attiva alle HH:MM · Annulla" (twin-alarm-cancel). NB: setTimeout mentre l'app è aperta (nessun push server-side). Testato (iteration_63).
- SCORTE FREEZER AUTOMATICHE (PianoProduzioneAI.updateFreezerAfterPlan): dopo generate() scala min(qty_freezer, qty_pianificata) per i prodotti che combaciano col nome della giacenza. Match reso ROBUSTO (uguaglianza normalizzata O contains bidirezionale ≥4 char) per gestire "Baguette precotte" vs "Baguette". Toast di conferma/errore. PUT /api/freezer. Testato (iteration_63: 100→70 + persistenza).
- FAB (Radio sx / Parla dx): riposizionati a bottom-20 (blueprint) + AUTO-NASCONDIMENTO durante lo scroll (translate-y/opacity, riappaiono a scroll fermo) per non coprire i contenuti. Testato posizione (iteration_63) + smoke Home.

## v92 (2026-06) — Stepper Lab compatto + Guida di Mohammed allineata (2 passi)
- Maestro stepper: da linea flex-1 (numeri ai bordi) a pillole CENTRATE e vicine "① Piano IA → ② Strumenti" con freccia oro (ChevronRight) e ring oro sull'attivo → i numeri 1/2 danno nell'occhio.
- MohammedAssistant: intro + GUIDE riscritti per i 2 passi → (1) cose fondamentali per generare il Piano IA (ricette+quantità obbligatorie, "Parti da qui", Genera), (2) opzioni extra via IA (freezer/celle/spesa/food cost/punti vendita/turni/orari/Digital Twin), (3) sfruttare il risultato (sequenza, spesa, ordini, PDF).
- Backend MOHAMMED_SYSTEM aggiornato al layout a 2 passi (non più i vecchi 5 passi materie prime/cottura/HACCP).
- Corsi: restano "in arrivo" (utente non ha ancora i video) — nessun acquisto attivato.
- Verificato via screenshot (stepper + guida) + compilazione pulita.

## v93 (2026-06) — Shop, Enciclopedia unificata, Impara gratis, bandiere MikiLab
- SHOP/Academy: corsi ora "In arrivo · presto disponibile" (Academy.jsx, rimosso bottone acquista + import Lock). Ricette restano vendibili; consulenza 1-to-1 resta prenotabile; Shop.jsx panettoni resta waitlist.
- ENCICLOPEDIA UNIFICATA: GuidaMetodi confluisce in Enciclopedia (un solo titolo "Enciclopedia del mio pane", metodi Poolish/LM pane-vs-panettone/Roggen/Backmittel PRIMA, poi ingredienti+termini). GuidaMetodi.SECTIONS esportata e importata in Enciclopedia; rimossi i "Poolish" brevi duplicati (it/de/en); body con whitespace-pre-line. Ricette.jsx e Mikilab.jsx "guida" → Enciclopedia (bottone rinominato "Enciclopedia").
- IMPARA GRATIS PER TUTTI: LearnHub tab "impara" → rimosso PaywallGate, ora renderizza Beginners (contiene HomePlanner = "laboratorio in versione semplice" + consigli + video gratis + quiz + grandi panettieri). 
- RICETTE MIKILAB: aggiunte bandiere 🇮🇹🇩🇪 nell'hero (badge in alto a destra + accanto al titolo), solo per collectionName mikilab.
- Verificato via screenshot: Impara free (paywall assente), Academy coming-soon, Enciclopedia unificata (enc-entry-0=Poolish), bandiere MikiLab.
- DEFERITO: "Costo e margine per ricetta" nel Piano IA (serve modello prezzi ingredienti) — prossimo step.

## v94 (2026-06) — Scan a mano, Ricetta del giorno, Progressi quiz
- SCAN FOTO (ScanRecipe): dopo lo scatto il testo era già modificabile (RecipeDialog con initial=scanned). Aggiunto pulsante "Scrivi a mano" (scan-manual-btn) che apre RecipeDialog VUOTO per scrivere/creare la ricetta da zero (initial=null → form empty). Verificato via screenshot.
- RICETTA DEL GIORNO GRATIS (Beginners): DAILY_RECIPES (3 ricette semplici it/de/en: pane base, focaccia, panini al latte) a rotazione giornaliera (recipe-of-day) in cima a Impara.
- PROGRESSI QUIZ (BakerQuiz in Beginners): best score persistito in localStorage 'mikilab_quiz_best', mostrato come "Il tuo record: X/5" (quiz-best) su start e risultato.
- DEFERITO ancora: "Costo e margine per ricetta" (serve modello prezzi ingredienti); corsi acquistabili (attesa video).

## v95 (2026-06) — Salva piano, Home dedup, Impara senza video, Percorso, Costo/Margine
- LAB: tasto "Completa" → "Salva piano" (maestro-done): toast "Piano e dati salvati, la prossima volta li modifichi soltanto". I dati del Piano IA sono già persistiti (v84).
- HOME: rimosso blocco "Strumenti & Risorse" (home-hub-destinations: enciclopedia/diagnosi/news/enterprise = doppioni). Rimosse icone inutilizzate. Resta home-core + Chiedi al Maestro + Scopri + Shop.
- IMPARA (Beginners): RIMOSSI i 3 blocchi video YouTube (corsi video, "i nostri video", grandi panettieri) — italiani, confusi su sito trilingue. Aggiunto "Il tuo percorso" (beginner-path): 4 passi con spunte persistite in localStorage 'mikilab_beginner_path' + barra progresso.
- PIANO IA: card "Costi & Margine" (capo-cost-summary) — riusa recipe.costing + prices.js computeRecipeCostPerPiece(); per prodotto costo/ricavo + totali costo/ricavo/margine%. Hint se manca prezzo/pezzi nella ricetta.
- Avatar: lasciato a discussione futura (richiesta utente).

## v96 (2026-06) — Home cleanup batch 1 (di richiesta ampia in corso)
- Home: RIMOSSO blocco home-personal (saluto "Ciao" + Livello + 3 tasti "Le mie ricette/Avvia impasti/Shelf-Life").
- Livello/progresso spostato in IMPARA (Beginners): badge beginners-level in cima.
- Rinominato "Corsi Online" → "I Miei Corsi" nello Shop della Home.
- Verificato via screenshot.

### BACKLOG richiesto (grande, da fare in blocchi successivi):
1. Home: MikiLab Shop & Corsi più in alto + tasto Shop in fondo.
2. Shop RICETTE: manca il pulsante per COMPRARE le ricette (revenue-critical) — aggiungere checkout.
3. RICETTE: "Le mie ricette" in cartelle (pane, panini, snack, panettoni, focacce) che si aprono a FOTO/griglia colpo d'occhio.
4. LAB: spostare strumenti (a mano o tasto "Sposta in Piano IA") dalla voce 2 alla sezione 1 "Compila per generare"; verificare quali servono per generare (bilancia, termostato, antispreco, ecc. collegabili all'IA).
5. LAB Piano IA: titolo "Cosa preparare" → "Compila per generare"; rimuovere "Modalità da casa"; strumenti opzionali dentro "cosa preparare".
6. AVATAR: NON devono parlare, solo SCRIVERE (disattivare TTS). 
7. LAB: avatar di Mo(mmy)/Mohammed in alto come introduzione, spiega tutto (senza voce).
8. IMPARA: avatar Michele + Mohammed insieme che danno consigli su come imparare (fumetto).
9. COMMUNITY: Michele + Mommy che cercano nuovi colleghi sui social (fumetto).
10. NUOVA sezione: Michele + Mommy spiegano come comprare le ricette e lo Shop (stile fumetto). Fumetti nelle ultime 3 sezioni.

## v97 (2026-06) — Blocco C Laboratorio (parte 1)
- Piano IA: titolo/sezione "Cosa preparare" → "Compila per generare"; sottotitolo hero aggiornato.
- Rimosso blocco "Dove impasti? / Modalità da casa" (bizType forzato "pro"). applyBiz ora inutilizzato (warning).
- L'IA (capo_plan_stream) già ingerisce: ricette+quantità, impasto di partenza, impastatrici (portate), celle frigo/lievitazione/freezer, giacenze freezer, personale (staff), punti vendita, temperatura lab, orari inizio → genera piano GIORNALIERO e SETTIMANALE. Card "Costi & Margine" (v95) mostra costo/ricavo/margine.
- DA FARE (Blocco C parte 2): spostare strumenti dalla voce 2 (bilancia, termostato, antispreco...) dentro "Compila per generare" con tasto "Sposta in Piano IA"; collegare i loro dati all'IA.

## v98 (2026-06) — Piano IA: validazione obbligatoria + stabilità
- canGenerate ora richiede almeno 1 ricetta con quantità (validProducts>0); rimosso il fallback "solo Piano Settimanale". Alert/hint aggiornati (obbligatorio ricetta+qty).
- Struttura 2 macro-step (1. Piano IA, 2. Strumenti) e layout card (Inserisci Ricette, Piano Giornaliero, Produzione Settimanale, Celle Frigo) invariati. Compilazione pulita, nessun errore console su Home/Lab.
- DA FARE (grande): moduli opzionali come toggle/checkbox on/off (Orari, Spesa, Food Cost, Punti Vendita, Turni, Digital Twin, Termostato, pH, Diagnosi, Diario, Anti-Spreco) senza bloccare il piano base; supporto Bilancia Smart Bluetooth (dati pesata realtime, fallback manuale); salvataggio stati moduli opzionali in sessione.

## v99 (2026-06) — Piano IA scalabile con 100+ ricette (b+c+d)
- (b) Selettore multiplo con RICERCA: bottone "Aggiungi ricette" (capo-open-picker) apre modale (capo-picker-search) con lista filtrabile + spunta multipla (capo-pick-<id>), "Fatto (n)". addRecipes/removeByRecipe.
- (c) Più usate in cima: ordinamento ricette per contatore localStorage 'mikilab_recipe_usage' (incrementato alla generazione) + ricette proprie (★) prima.
- (d) "Riparti dall'ultimo piano" (capo-restore-prev): ricarica i prodotti dell'ultimo piano salvato (savedProducts), si cambia solo la quantità.
- Verificato via screenshot: ricerca "pane" → 27 risultati, selezione multipla, prodotti aggiunti.

## v100 (2026-06) — Ricette private nel Piano IA + Moduli a toggle ON/OFF
- **VISIBILITÀ RICETTE (Piano IA)**: nel generatore ("Il Tuo Laboratorio" → Piano di Produzione IA) il panettiere vede/usa SOLO le proprie ricette (personal, scansionate o scritte a mano). Le ricette MikiLab (IP di Michele) compaiono SOLO per owner/admin, oppure per chi le ha ACQUISTATE (unlock_all / unlock_panettoni / unlocked_recipes). L'abbonamento al Laboratorio (pro/plan_tier=lab) NON dà accesso al ricettario. PianoProduzioneAI.jsx: useAuth() + subscriptionApi.status(); filtro canUseMikilab; optgroup MikiLab reso condizionale; hint di acquisto (capo-mikilab-buy-hint) → sezione «Ricette». Verificato: utente lab senza acquisti → dropdown solo "Scegli una ricetta…" + hint; admin → vede tutto.
- **MODULI A TOGGLE ON/OFF (P0)**: nuovo pannello "Moduli del piano (opzionali)" (capo-modules) con 9 chip toggle (capo-module-<id>): celle, orari, freezer, turni, clima, spesa, foodcost, punti, antispreco. DEFAULT on: celle/orari/freezer/spesa/foodcost. Il piano base (ricette+qty) si genera comunque. I toggle: (a) gate degli input mostrati (orari→ora inizio; clima→temp lab+std+verdetto; turni→personale), (b) gate dati inviati all'IA (mixers/cells, freezer_stock, staff, start_time, lab_temp_c), (c) card Costi&Margine (foodcost) e SupplierOrder/Lista Spesa (spesa) condizionali, (d) auto-decremento freezer solo se freezer ON, (e) active_modules[] nel payload. Persistiti in capo/last-plan (state.modules) e ripristinati al mount.
- **Backend**: CapoPlanRequest.active_modules (None = tutti ON, retrocompat). capo_plan_stream: helper mod_on(); direttiva freezer condizionata a mod_on("freezer"); nuove direttive punti/antispreco/spesa quando ON. Testato via curl (active_modules=["orari","celle","punti"] → stream OK).
- Testato: curl backend (status/grant/capo-plan) + screenshot browser (admin vede ricette+toggle; utente lab senza acquisti vede solo le proprie + hint). REDEPLOY necessario per mikilab.de.

## v101 (2026-06) — Next Action Items (avatar scrivono, acquista ricette, cartelle, bilancia)
- **Avatar che SCRIVONO, non parlano (P1)**: LabOnboarding (guida avatar Michele/Momy nel Lab) ora comunica SOLO per iscritto (fumetto): rimossi auto-TTS, pulsante audio (Volume2/VolumeX), e tutte le funzioni voce (speak/primeVoice/speakSlide/voiceText). Rimosso anche il pulsante "Ascolta" (capo-listen, ListenButton) dal Piano IA (Momy leggeva il piano). Verificato: modale onboarding senza icona altoparlante (audio buttons = 0).
- **Acquista Ricette nello Shop (P1, revenue)**: Shop.jsx nuovo blocco `shop-recipes-block` "Il Ricettario di Michele — Disponibile ora": Tutte le ricette €149 (shop-buy-all), Tutti i Panettoni €29,99 (shop-buy-panettoni), + link abbonamento PRO (shop-subscribe-pro). Usa recipePurchaseApi.checkout / subscriptionApi.checkout (Stripe); richiede login. Le ricette acquistate compaiono poi nel generatore Piano IA (v100).
- **Ricette in CARTELLE (P1)**: RecipeList.jsx — categorie ora sono CARTELLE COLLASSABILI (cat-folder-<key>, ChevronDown, aperte di default) con griglia foto 2-col; applicato sia a MikiLab sia a "Le Mie Ricette" (personal, prima era griglia piatta). Categorie: Basi & Lieviti, Pane, Panini, Snack, Focacce, Panettoni. Verificato: apri/chiudi cartella "Pane".
- **Bilancia Smart Bluetooth (P2)**: già presente in SmartScale.jsx (scale-bt-btn Web Bluetooth + inserimento manuale di fallback + ricalcolo proporzionale ±2%). Nessuna modifica necessaria.
- Testato via screenshot (Ricette cartelle, Shop card acquisto, onboarding senza voce) + parse/compile puliti. REDEPLOY necessario per mikilab.de.

## v102 (2026-06) — Fumetti avatar, cartelle vetrina, sblocco immediato, bilancia realtime
- **Avatar FUMETTI (solo scritto)**: nuovo componente `components/AvatarBubbles.jsx` (data-testid `avatar-bubbles`, `bubble-michele`/`bubble-momy`) con i due avatar (michele-avatar.jpg + mohammed-avatar.jpg) e nuvolette scritte IT/DE/EN. Aggiunto in Impara (Beginners, variant="impara"), Community (variant="community"), Shop (variant="shop"). Nessuna voce/TTS. Verificato a schermo (Impara + Community).
- **Cartelle VETRINA (foto grandi)**: RecipeList — l'header di ogni cartella (cat-folder-<key>) è ora un banner h-24 con COPERTINA foto (prima ricetta con image_url), overlay gradiente, icona, titolo e conteggio a colpo d'occhio; collassabile. Verificato (Panettoni con cover).
- **Sblocco IMMEDIATO dopo acquisto**: App.js su ritorno Stripe `recipe=success` + status paid → `window.dispatchEvent('mikilab-entitlements-updated')` + vai al tab Ricette. RecipeList e PianoProduzioneAI ascoltano l'evento e RICARICANO (load / bump) → la ricetta acquistata compare subito senza reload manuale.
- **Bilancia in TEMPO REALE**: SmartScale connectBt ora connette GATT `weight_scale` → `weight_measurement` (0x2A9D), startNotifications, parse peso (SI 0.005kg / imperial 0.01lb) → banner `scale-live` "Peso in tempo reale" + auto-fill della riga a fuoco (focusedRef, onFocus) o prima vuota. Fallback manuale invariato se BT/peso non disponibili.
- Compila pulito (solo warning pre-esistenti). NB: #3 (Stripe live) e #4 (hardware BT) verificati per codice/compile; e2e reale richiede acquisto Stripe / bilancia fisica. REDEPLOY per mikilab.de.

## v103 (2026-06) — Voce disattivata in TUTTA l'app (avatar solo scritti)
- Scelta utente "B": togliere voce/"Ascolta" ovunque, incluso il FAB "Parla".
- **lib/voice.js**: `speak()` e `primeVoice()` ora NO-OP (mantenute le firme per non rompere gli import in SvegliaLievito, StartDoughs, GuidedWeighing, SourdoughTracker, BackwardScheduler, MohammedAssistant, LabOnboarding). `stopSpeak`/`cleanForSpeech` mantenute. Rimosso codice voce morto (pickVoice/hint/loadVoices).
- **ListenButton.jsx**: ora `return null` → spariti TUTTI i pulsanti "Ascolta" (PhotoDiagnosi, DayClose, SoundDiagnosi; Piano IA già rimosso in v101).
- **App.js**: rimosso il FAB "Parla" (VoiceAssistant) + import. Verificato a schermo: Parla count=0, resta solo Radio FAB.
- **MohammedAssistant.jsx**: rimosso il pulsante "Ascolta/Ferma" per messaggio + readAloud/speakingIdx + import voce. La chat resta scritta.
- **StartDoughs.jsx**: rimossa la riga UI "Avvisi vocali" (toggle + test voce); MANTENUTO il beep dell'allarme timer (suono funzionale, non è la voce dell'avatar).
- NB: i BEEP dei timer/stabilità (StartDoughs, GuidedWeighing) restano attivi: sono suoni funzionali, non voce. File VoiceAssistant.jsx e lib/tts.js restano nel codice ma inutilizzati (innocui). Compila pulito. REDEPLOY per mikilab.de.

## v104 (2026-06) — Impostazioni sito editabili dall'admin (fumetti, copertine, WhatsApp)
- **Backend**: nuovo doc `app_meta._key="site_settings"`. GET pubblico `/api/site-settings` (whatsapp_number, avatar_bubbles, folder_covers con default) + PUT admin `/api/admin/site-settings` (require_admin). Il numero WhatsApp viene normalizzato (solo cifre, tolto prefisso "00" → es. 0049… diventa 49…). Default WhatsApp = 491601253378 (numero di Michele, +49 160 1253378).
- **Testo fumetti da admin**: AdminPanel → "Fumetti avatar" (admin-bubble-<variant>-<who>-<it|de>) per impara/community/shop × michele/momy. Salvati come override `avatar_bubbles["variant.who"]={it,de}`. AvatarBubbles.jsx legge siteSettingsApi.get() e usa l'override se presente, altrimenti i testi predefiniti (EN fallback su IT). Verificato e2e: testo admin appare nel fumetto Shop.
- **Copertina cartella scelta**: AdminPanel → "Copertine cartelle" (admin-cover-<cat>, admin-cover-pick-<cat>-<id>, admin-cover-clear-<cat>): griglia di miniature delle ricette MikiLab per categoria, tap per scegliere la copertina; salvata in `folder_covers[catKey]=image_url`. RecipeList.jsx usa folder_covers[cat.key] come copertina della cartella (fallback: 1ª foto della categoria). Categorie condivise estratte in `lib/recipeCats.js` (CATS + recipeCategory), importate da RecipeList e AdminPanel.
- **Numero WhatsApp**: il numero era già nel codice; ora è editabile dall'admin (admin-wa-number) e letto da WhatsAppFab/WhatsAppHelp via siteSettingsApi. Montato il FAB flottante `whatsapp-fab` (verde, bottom-right) in App.js → sempre raggiungibile dai clienti. Verificato a schermo (FAB presente, pannello admin con tutte le sezioni, picker copertine con miniature per categoria).
- Compila pulito. REDEPLOY per mikilab.de.

## v105 (2026-06) — Laboratorio: avatar, chiarezza strumenti, calcolatori sulle ricette, Enterprise nel Piano, back/titoli; Home avatar solo foto
- **Avatar fumetti nel Lab**: AvatarBubbles nuova variant "lab" (Michele+Momy scritti) montata in Maestro sotto il titolo. Admin BUBBLE_SECTIONS ora include "lab" → testi editabili anche per il Laboratorio.
- **Chiarezza Passo 2 (Strumenti)**: aggiunte descrizioni brevi (TOOL_DESC, tri IT/DE/EN) sotto ogni card strumento (adatta/bilancia/termo/market/acqua/pesata/timer/meteo/ph/diagnosi/suono/sessioni/lotti/haccp/check/shelf/spreco). Passo 1 = solo "Piano di Produzione (IA)" come hub.
- **Calcolatori collegati alle ricette del panettiere**: nuovo componente riutilizzabile `components/RecipePicker.jsx` (carica ricette personali). Collegati: Anti-Spreco (aw-recipe → fonte esubero + prefill costo), Shelf-Life (sl-recipe → base freschezza da categoria + nome), Food Cost (fc-recipe → prefill prezzo vendita/peso + etichetta). Già usavano ricette: AdattaForno, GuidedWeighing, WeeklyPlan. Restano puramente computazionali (senza ricetta): Temp. Acqua, Timer, Meteo, Orari Inizio.
- **Enterprise dentro il Piano IA**: rimosso dalle card del Passo 1; aggiunto quicklink "Multi-negozio" (capo-quicklink-enterprise, Building2) dentro PianoProduzioneAI. Routing tool "enterprise"→EnterpriseHub invariato.
- **Tasti indietro**: back del Lab ora pill chiaro "Torna agli strumenti" (maestro-back-btn).
- **Titoli senza doppioni**: rimosso il piccolo label "Il Tuo Laboratorio" nell'hero (restava duplicato con l'h1). Hero mostra solo il tagline.
- **Home avatar SOLO foto**: rimossi video parlante, audio, poster e pulsante Play (home-avatar-play/video eliminati). Resta la foto (home-avatar-full) con fumetti scritti che ruotano. Coerente con "avatar solo scritti".
- **lib/recipeCats.js**: modulo condiviso (CATS + recipeCategory) usato da RecipeList, AdminPanel, ShelfLife.
- Compila pulito. Verificato a schermo (Home solo foto, fumetti Lab, titolo unico, descrizioni Passo 2, Shelf-Life picker, back pill). REDEPLOY per mikilab.de.

## v106 (2026-06) — Laboratorio: UNA sola sezione (Piano IA hub con tutti gli strumenti)
- Rimosso lo stepper a 2 passi in Maestro (eliminati step/STEPS/TOOLS/toolById/TOOL_DESC + pannello + nav prev/next). Ora "Il Tuo Laboratorio" mostra INLINE `<PianoProduzioneAI onOpenTool={setTool} />` sotto hero + AvatarBubbles(lab). Sottotitolo → "Tutto in un unico posto".
- Quicklink del Piano IA ora contengono TUTTI gli strumenti, senza doppioni: gruppo "Tutto in un posto" (aggiungi, lavoro, settimana, capo=Celle&Impastatrici, enterprise=Multi-negozio, dayclose=Concludi Giornata) + "Altri strumenti (opzionali)" (inversa, spesa, foodcost, salespoints, turni, freezer, twin, adatta, bilancia, termo, acqua, pesata, timer, meteo, ph, diagnosi, suono, sessioni, lotti, haccp, check, shelf, spreco, market). Ogni tool apre via onOpenTool → render full-screen con back pill.
- Evidenziata la scritta moduli: nuovo callout `capo-modules-hint` "👆 Tocca per accendere solo ciò che ti serve…" (bg ambra) per far capire che i moduli si cliccano.
- Verificato a schermo: stepper assente, quicklinks completi (enterprise+spreco presenti), hint evidenziato, toggle moduli sotto. Compila pulito. REDEPLOY per mikilab.de.

## v106b — Test frontend Lab (iteration_64) + fix
- testing_agent (iteration_64): TUTTI i requisiti soddisfatti — 30/30 quicklink senza doppioni, 9/9 toggle, apertura di tutti gli strumenti con back pill, selettori ricette (sl/aw/fc-recipe), Home solo foto, niente FAB voce, pannello admin completo.
- Fix applicato (MEDIUM): overflow orizzontale del dialog Admin su mobile causato dalle righe thumbnail copertine → aggiunto overflow-x-hidden al DialogContent + min-w-0/max-w-full ai wrapper. Verificato: admin-panel clientWidth==scrollWidth (446), nessun taglio.
- Restano 2 minori NON critici (non da queste modifiche): FAB WhatsApp può sfiorare l'ultima riga chip moduli su scroll (click ok); warning console pre-esistente "<span> cannot be child of <option>" (nessun impatto funzionale).

## v107 (2026-06) — Piano IA: INIZIA / SCEGLI ANCHE + Mohammed sotto gli avatar
- "Tutto in un posto" → titolo "INIZIA" (passi base, mostrati come obbligatori): aggiungi, lavoro, settimana, enterprise, dayclose. RIMOSSO "Celle & Impastatrici" da INIZIA (ora scelta manuale in SCEGLI ANCHE).
- "Moduli del piano (opzionali)" + "Altri strumenti (opzionali)" UNIFICATI in un unico blocco con UN SOLO titolo "SCEGLI ANCHE": in alto le 9 chip toggle (celle, orari, freezer, turni, clima, spesa, foodcost, punti, antispreco) + hint "👆 Tocca…", poi (divisore) la griglia con TUTTI gli strumenti incl. Celle & Impastatrici (capo). Tutte le voci cliccabili manualmente. Rimosso il sotto-titolo "Strumenti".
- Maestro: "Chiedi a Mohammadreza" (MohammedAssistant) spostato SOTTO i due avatar (AvatarBubbles lab) e PRIMA del menu (PianoProduzioneAI). Ordine: hero → titolo → 2 avatar → Chiedi Mohammed → menu.
- Verificato a schermo: capo assente da INIZIA (count 0), presente in SCEGLI ANCHE (count 1), Mohammed sotto gli avatar. Compila pulito.
- Pendente (Next Action Item approvato): rifiniture minori (FAB WhatsApp overlap, warning console "<span> in <option>"). REDEPLOY per mikilab.de.

## v108 (2026-06) — Rifiniture minori
- FAB WhatsApp (WhatsAppFab.jsx): auto-hide durante lo scroll (opacity/translate + timeout 700ms), come il FAB Radio → risolta la sovrapposizione con le chip moduli/SCEGLI ANCHE.
- Warning console "<span> cannot be child of <option>": investigato tutto il sorgente, NESSUN <option> contiene <span> (SupplierOrder/RecipeDialog/AdminPanel/PianoProduzioneAI usano solo testo+emoji). Non proviene dal nostro codice (probabile artefatto estensione/portal), innocuo → nessuna modifica.

## v109 (2026-06) — Scelta sorgente piano + back con ripristino scroll
- "Compila per generare": nuovo blocco `capo-source-choice` (visibile se c'è un Piano Settimanale) con 2 scelte: `capo-source-weekly` ("Piano Settimanale · Usa quello inserito, modificabile" → setUseWeekly(true), nasconde il picker manuale `capo-products`) e `capo-source-manual` ("Scegli ricette ora"). Nota `capo-weekly-note` rimanda a Produzione Settimanale per modifiche. Rimosso il vecchio checkbox `capo-use-weekly` (ridondante). Impasto di partenza sempre selezionabile ("Parti da qui" / preferment).
- Tasto indietro Lab (Maestro): openTool(id) salva window.scrollY e scrolla a 0; back()=setTool(null); useEffect ripristina lo scroll salvato al ritorno (torna ESATTAMENTE dove eri, un solo passo). useBackClose usa back. Verificato: 1910→0→1910.
- Controllo generale odierno: OK (una sezione, INIZIA/SCEGLI ANCHE, Mohammed sotto avatar, FAB auto-hide, selettori ricette nei calcolatori, Home solo foto). Compila pulito. REDEPLOY per mikilab.de.

## v109b — Scelta sorgente SEMPRE visibile
- capo-source-choice ora reso incondizionato (era guardato da weeklyItems.length>0). Sempre mostrato in "Compila per generare".
- Se useWeekly && nessun piano settimanale: hint capo-weekly-empty + bottone capo-weekly-create → onOpenTool("settimana"). Verificato a schermo (source-choice sempre presente). REDEPLOY per mikilab.de.

## v110 (2026-06) — 3 fix: guida Momy off, traduzione ricette PRO, cartelle chiuse
- Rimossa la guida onboarding del Lab: eliminato <LabOnboarding /> + import da Maestro e il pulsante "Rivedi la guida di Momy" (mohammed-replay-tour) + import openLabTour da MohammedAssistant.
- Traduzione ricette PRO: backend POST /api/recipes/{id}/translate?lang=it|de|en (Depends require_pro; _translate_recipe_lang via LlmChat claude-sonnet-4-6, salva name_<lang>/flour_type_<lang>/notes_<lang>/procedure_<lang>; gate proprietà: proprie ricette o admin per mikilab). api.js recipesApi.translate. RecipeList dialog: pulsante recipe-translate-btn (visibile se canEdit && lang de/en && manca name_<lang>) → traduce e ricarica. Testato via curl (name_en ok).
- "Le Mie Ricette" (collection personal): cartelle CHIUSE di default (open = openCats[key] ?? collectionName!=="personal"). Mikilab resta aperto di default.
- Compila pulito. REDEPLOY per mikilab.de.

## v-cont (2026-06) — Storico Chat AI in archivio + Enciclopedia arricchita
- **Riquadro Mohammadreza compattato** in "Il Tuo Laboratorio" (MohammedAssistant.jsx): avatar/padding/testo ridotti, intro a una riga.
- **Enciclopedia solo in Ricette MikiLab** (no doppioni): rimossa la versione incorporata da RecipeList (collection personal).
- **Storico Chat AI** in "I Miei Dati Salvati" (MyData.jsx, scheda `mydata-tab-chat`): registro sessioni in `lib/chatHistory.js` (localStorage `mikilab_chats`), sessione Maestro resa persistente (`mikilab_maestro_sid`), Mohammadreza già persistente. Le conversazioni si caricano dal backend via `chatApi.history` → `GET /api/maestro/history/{sid}` (stessa collezione chat_messages). Card espandibili con messaggi (ReactMarkdown) + elimina (`mydata-chat-delete-*`). Testato UI end-to-end.
- **Enciclopedia +4 voci** (IT/DE/EN): Bassinage, Farine speciali, Semole & grani antichi, Maturazione vs Lievitazione.
- NB: modifiche in PREVIEW → serve REDEPLOY per mikilab.de.

## v-cont2 (2026-06) — Avatar leggibili + Lab senza doppioni + guide Mohammed
- **AvatarBubbles.jsx**: testo bolla `font-semibold text-[#141210]` (nero marcato, leggibile), sfondo quasi trasparente (`/5` bg + `/20` border), etichetta nome più scura.
- **PianoProduzioneAI.jsx**: eliminati i doppioni tra interruttori-modulo e griglia strumenti. Rimossi dalla griglia "APRI UNO STRUMENTO" i tile che duplicavano gli interruttori (capo/celle, inversa/orari, freezer, turni, spesa, foodcost, salespoints/punti, spreco/antispreco). Interruttori ("SCEGLI ANCHE") ora con pill ON/OFF + pulsante "i" (Mohammed) su OGNI modulo; mappa `MODULE_TOOL` per "Apri strumento". Intestazioni chiarite (interruttori del piano vs apri strumento).
- **toolGuide.js**: aggiunte guide per gli id modulo (celle/orari/clima/punti/antispreco) + mydata; arricchite spesa/foodcost/turni/freezer con indicazione se il risultato viene 📄 generato o 💾 salvato.
- Verificato via screenshot (login admin): 9 interruttori con ON/OFF+i, bolla guida, doppioni assenti, avatar leggibili.
- NB: PREVIEW → REDEPLOY per mikilab.de.

## v-cont3 (2026-06) — Tour guidato Mohammadreza + strumenti personalizzabili
- **LabTour.jsx** (nuovo): mini-tour al primo accesso in "Il Tuo Laboratorio" (localStorage `mikilab_lab_tour_v1`). 4 step trilingui (welcome + capo-source-choice → capo-modules → capo-generate) con evidenziazione (outline) dell'elemento target, dots, Salta/Avanti/Ho capito. Montato in PianoProduzioneAI (solo vista principale, quando onOpenTool). Pulsante replay `lab-tour-replay` ("Come si fa?") nell'header INIZIA.
- **Strumenti personalizzabili** (PianoProduzioneAI): estratto array `TOOLS`; preferenze in localStorage `mikilab_tool_prefs` {order[], hidden[]}. Pulsante `tools-edit-toggle` ("Personalizza/Fatto"): in edit ogni tile ha occhio nascondi (`tool-hide-*`) + frecce riordina (`tool-up/down-*`). Fuori edit mostra solo i visibili nell'ordine scelto + nota `tools-hidden-note`.
- Verificato via screenshot: tour auto-mostrato e chiuso, highlight su "Genera", nascondi/riordina persistiti.
- NB: PREVIEW → REDEPLOY per mikilab.de.

## v-cont4 (2026-06) — Preferiti automatici + Tour multi-sezione + fix header
- **Header (fix logo coperto)**: brand block ora `flex-1 min-w-0` + wordmark `truncate`; lang buttons px ridotto e gap-1 → il logo/"MikiLab" non finisce più sotto i tasti IT/DE/EN. Verificato a 360px.
- **I tuoi preferiti**: fila `tools-favorites` sopra "Apri uno strumento" con i 3 strumenti più aperti (usage in localStorage `mikilab_tool_usage`, scrittura sincrona in `openToolTracked`). Chip `fav-tool-<id>`.
- **Tour riutilizzabile**: `LabTour.jsx` reso generico (props steps/storageKey/force/labels). Tour aggiunto a: Laboratorio (`mikilab_lab_tour_v1`), Diagnosi Foto (`mikilab_diag_tour_v1`, target photo-modes/photo-dual/photo-analyze-btn), Impara/Beginners (`mikilab_impara_tour_v1`, target beginner-path/home-planner/quiz-panel). Ogni sezione ha pulsante replay "Come si fa?".
- Verificato via screenshot (login admin): header ok, preferiti (Timer/Miei Dati/pH), tour diagnosi auto-mostrato.
- NB: PREVIEW → REDEPLOY per mikilab.de.

## v-cont5 (2026-06) — Preferiti manuali + Badge Novità + Etichette UE valori tipici
- **Preferiti manuali**: in modalità "Personalizza" ogni tile ha stella `tool-pin-<id>`; `mikilab_tool_prefs.pinned[]`. La fila `tools-favorites` mostra i pinned (con Star) + gli automatici (top uso), max 6.
- **Badge Novità**: pallino/etichetta "NUOVO" (`tool-new-<id>`) sugli strumenti con usage 0 (mai aperti). Sparisce al primo utilizzo.
- **Etichette UE (RecipeDialog)**: pulsante `label-fill-typical` "Compila valori tipici (da verificare)" → pre-compila valori nutrizionali 100g INDICATIVI per categoria (pane, panettone/lievitati, focaccia/pizza, brezel/laugen, croissant/brioche) + allergeni tipici, tutto editabile. Michele inserisce/verifica i valori reali.
- Verificato via screenshot (login admin): 17 badge NUOVO, pin Adatta Forno in preferiti, fill focaccia → 270 kcal + Glutine.
- NB: PREVIEW → REDEPLOY per mikilab.de. I valori reali delle etichette li deve confermare Michele.

## v-cont6 (2026-06) — Preferiti appuntati riordinabili via drag
- **PianoProduzioneAI**: i preferiti appuntati (pinned) ora sono in una riga orizzontale trascinabile con `Reorder`/`Reorder.Item` di framer-motion; l'ordine si salva in `mikilab_tool_prefs.pinned`. Gli automatici restano statici sotto. `favDragMoved` ref evita l'apertura dello strumento al termine del drag. Header mostra "· trascina per ordinare" se >1 pinned.
- Verificato via drag simulato: ordine pinned [adatta,timer] → [timer,adatta] persistito.
- NB: PREVIEW → REDEPLOY per mikilab.de.

## v-cont7 (2026-06) — Barra scoperta strumenti
- **PianoProduzioneAI**: barra `tools-discovery` sopra i preferiti che mostra "Hai scoperto X/N strumenti" + % + progress bar (dorata; verde a 100% con messaggio 🎉). Basata su `mikilab_tool_usage` vs TOOLS. Suggerisce di aprire quelli con badge NUOVO. Nascosta in modalità edit.
- Verificato: 0% → 12% dopo aver aperto 2 strumenti; badge NUOVO spariscono di conseguenza.
- NB: PREVIEW → REDEPLOY per mikilab.de.

## v-cont8 (2026-06) — Spostato "Scopri MikiLab" in alto
- **Home.jsx**: il blocco `home-story` ("Scopri MikiLab") spostato da sotto "Chiedi al Maestro" a subito sotto lo slogan MikiLab e sopra News/"Il cuore di MikiLab". Stessa struttura (richiudibile, bio, concetti, joke). Rimosso dalla posizione in fondo. Nessun doppione.
- Verificato: ordine slogan→story→news→core, home-story count=1.
- NB: PREVIEW → REDEPLOY per mikilab.de.

## v-cont9 (2026-06) — "Scopri MikiLab" aperto al primo accesso
- **Home.jsx**: `storyOpen` ora parte APERTO al primo accesso (localStorage `mikilab_home_story_seen` assente); `toggleStory` imposta il flag così alle visite successive resta chiuso di default.
- Verificato: 1a visita aperto (bio-card visibile) → chiude → 2a visita chiuso.
- NB: PREVIEW → REDEPLOY per mikilab.de.

## v-cont10 (2026-06) — Foto reale del laboratorio in "Scopri MikiLab"
- **Home.jsx**: aggiunta `home-lab-photo` (public/michele-real-lab.jpg) in cima al contenuto di "Scopri MikiLab", con overlay gradiente e didascalia trilingue "Michele, nel suo laboratorio". Impatto personale al primo accesso (sezione già aperta).
- Verificato via screenshot.
- NB: PREVIEW → REDEPLOY per mikilab.de.

## v-cont11 (2026-06) — Galleria laboratorio in "Scopri MikiLab"
- **Home.jsx**: `home-lab-gallery` dopo l'intro Michele — 3 foto reali (bio-dough-3, michele-real2, bio-dough) in scroll orizzontale, mostrate INTERE con `object-contain` su sfondo scuro (nessun crop), didascalie trilingui.
- Verificato: 3 item presenti, foto intere.
- NB: PREVIEW → REDEPLOY per mikilab.de.

## v-cont12 (2026-06) — Slogan MikiLab unito a "Scopri MikiLab"
- **Home.jsx**: lo slogan (MikiLab + brand_slogan) è ora l'intestazione della card `home-story`: un'unica card con la riga "Scopri MikiLab" separata da un divisore sottile. Rimosso il blocco slogan separato. Toggle invariato.
- Verificato: slogan dentro story, tap espande la storia.
- NB: PREVIEW → REDEPLOY per mikilab.de.

## v-cont13 (2026-06) — Pulsante Marketplace in alto nella Community
- **Community.jsx**: aggiunto `community-marketplace-top-btn` (card dorata "Mercatino dell'Usato") subito sotto l'header; scroll smooth alla sezione `community-marketplace` in fondo. Trilingue.
- Verificato: pulsante presente, click scrolla al marketplace.
- NB: PREVIEW → REDEPLOY per mikilab.de.

## v-cont14 (2026-06) — Nuovo tema celeste + Notifiche/Seed Marketplace
- **Tema colori (globale)**: swap verde→celeste in tutti i .jsx/.js/.css di frontend/src. Primario #5e8b7e→#3f7cac, scuro #33564e/#2d5a4c→#234b6e, accenti #6b8e62→#5aa0cf, #4c7368→#336a94, #4d6b45→#2e6690, #4a7265/#5a7a52/#5a7a53→azzurri, #9ec48f→#a9d2ec; sfondi #eaf0ec→#e4eff8, #f6f8f5→#f0f6fb, bordi #d7e1db→#d5e4f0. Card "Le Mie Ricette" terracotta #a64b2a/#b34a26/#7c3820→navy/near-black (nota nera). Oro (#c88a2b ecc.) mantenuto come tocco giallo. Colori bandiera IT/DE (.it-de-ribbon) INTATTI.
- **lib/market.js** (nuovo): dati Marketplace locali + 4 annunci di esempio (impastatrice, forno, cella, sfogliatrice) + marketNewCount/markMarketSeen.
- **Community.jsx**: badge rosso con conteggio "nuovi annunci" sul pulsante Mercatino; azzerato al tap (markMarketSeen).
- **Marketplace.jsx**: usa loadMarket() (seed se vuoto) e marca visti all'apertura.
- Verificato via screenshot: tema coerente, nessun errore di build.
- NB: PREVIEW → REDEPLOY per mikilab.de.

## v-cont15 (2026-06) — Protocollo tecnico panificazione nel Maestro AI
- **backend/server.py `MAESTRO_SYSTEM`**: aggiunto "PROTOCOLLO TECNICO OBBLIGATORIO" per generazione/formattazione ricette: metodo Diretto/Indiretto + regole inserimento acqua/sale/pre-fermenti, gestione alta idratazione (>=86%, acqua a filo, T finale 25-26°C), doppio impasto panettone (LM solo nel 1°, sospensioni a fine 2°), sospensioni come ultimo ingrediente, struttura da manuale tecnico (Metodo+Idratazione%, Temperature Target, passaggi motivati, pieghe, spie raddoppio/triplicamento).
- Verificato via curl /api/maestro/chat: la ciabatta 86% esce con Metodo Indiretto, Idratazione 86%, Temperature Target e passaggi motivati.
- NB: PREVIEW → REDEPLOY per mikilab.de.

## v-cont16 (2026-06) — Obiettivo piano + protocollo in traduzione ricette
- **PianoProduzioneAI**: rimosso select "Lievito / Prefermento" (variabile `preferment` mantenuta a default "solido" per payload). Nuovo select `capo-plan-goal` "Obiettivo del piano" (qualita/resa/tempo/spreco) passato all'AI via note (GOAL_TEXT trilingue). Persistito in state salvato.
- **backend/server.py**: i due prompt di traduzione ricette (IT->DE e verso lang) ora impongono di preservare fedelmente il processo tecnico (metodo diretto/indiretto, idratazione %, temperature, ordine passaggi, acqua a filo, pre-fermenti a inizio, sospensioni ultime) senza riordinare/semplificare.
- Verificato: form mostra Obiettivo (no prefermento); backend up (recipes 200).
- NB: PREVIEW → REDEPLOY per mikilab.de.

## v-cont17 (2026-06) — Obiettivi piano extra
- **PianoProduzioneAI/GOAL_TEXT + select capo-plan-goal**: aggiunti "grandi" (Solo grandi lievitati) e "lotti" (Pochi impasti, grandi lotti). Totale 6 obiettivi, tutti passati all'AI via note (trilingue).
- Verificato: select con 6 opzioni [qualita,resa,tempo,spreco,grandi,lotti].
- NB: PREVIEW → REDEPLOY per mikilab.de.

## v-cont18 (2026-06) — Post di benvenuto Community aggiornato (v2)
- **backend/server.py**: WELCOME_POST_TEXT/DE/EN arricchiti (invito a pubblicare i PROPRI prodotti + aggiungere colleghi/amici + leggere in IT/DE/EN). seed_welcome_post reso VERSIONATO (WELCOME_VERSION=2): aggiorna il post esistente con nuovo testo + image_url="/michele-casual.jpg" + author "Michele — MikiLab", pinned.
- **public/michele-casual.jpg** (nuovo): avatar 3D di Michele in tuta casual (generato via Nano Banana da michele-avatar.jpg).
- Verificato: API welcome post con image /michele-casual.jpg + testo prodotti/amici/3 lingue; render in Community con avatar casual.
- NB: la lettura post in 3 lingue usa il toggle lingua esistente (text_de/text_en). Un vero sistema "aggiungi amici" (follow/social graph) NON è implementato: solo invitato nel messaggio.
- NB: PREVIEW → REDEPLOY per mikilab.de.

## v-cont19 (2026-06) — Sistema Amici (richieste + elenco utenti)
- **backend/server.py**: collezione `friendships` {from_id,to_id,status:pending|accepted}. Endpoint (current_user, cookie auth): GET /users/directory (utenti + status none/friends/incoming/outgoing), GET /friends ({friends,incoming,outgoing}), POST /friends/request {to_id}, POST /friends/respond {from_id,action:accept|decline}, POST /friends/remove {other_id}.
- **frontend**: `lib/api.js` friendsApi; `components/FriendsPanel.jsx` (modal tab Richieste/Amici/Trova con ricerca, add/accept/decline/remove); Community: pulsante `community-friends-btn` (celeste) con badge richieste + montaggio pannello.
- Verificato: flusso completo via API (A→request→B incoming→accept→friends per entrambi) e UI (directory, Aggiungi→In attesa, toast). Utenti test in test_credentials.md.
- NB: PREVIEW → REDEPLOY per mikilab.de.

## v-cont20 (2026-06) — Parco Macchine ON/OFF + adattamento ricette AI
- **lib/machines.js** (nuovo): 5 categorie (formatura/estrusione, brezel, divisione, sfoglia/impasti, cella/cottura) con macchine (Rheon, estrusore, formatrice, brezel, lisciviatrice, spezzatrici, sfogliatrice, spirale/bracci tuffanti, CLIMATHERM, Rotovent, pietra+vapore). localStorage `mikilab_machines` (ids). getActiveMachineNames() (nomi IT per AI).
- **components/MachinePark.jsx** (nuovo): tool ON/OFF per categoria con switch + contatore. Registrato in TOOLS (id "macchine", Parco Macchine) e in Maestro.jsx (tool switch).
- **backend/server.py**: MACHINE_PROTOCOL (consulente tecnico industriale) + ChatRequest.machines + maestro_stream applica direttiva macchine → ricetta con "Modalità di Produzione", "Resa Oraria Stimata", "Punti di Attenzione Macchina", riduzione tempi formatura/divisione, T finale più bassa (22-24°C) per estrusione, ecc. MaestroSaTutto invia getActiveMachineNames().
- Verificato: API (panini al latte con Rheon/Rotovent/spezzatrice → Scheda Tecnica Semiautomatica, ~400-500/ora, punti attenzione) e UI (toggle persistono, count).
- TODO possibile: alimentare le macchine anche nella generazione del PIANO (CAPO_SYSTEM).
- NB: PREVIEW → REDEPLOY per mikilab.de.

## v-cont21 (2026-06) — Macchine nel Piano IA + Scheda Macchina ricette + Reset
- **lib/machines.js**: MACHINE_TIPS + machineScheda(lang) (mode Manuale/Semiautomatica/Industriale in base a set INDUSTRIAL, resa oraria stimata, tips per macchina).
- **components/MachineScheda.jsx** (nuovo): render Modalità/Resa/Macchine attive/Punti di Attenzione; inserito in RecipeList nel dettaglio ricetta (solo ricette sbloccate con procedimento).
- **MachinePark.jsx**: pulsante `machine-reset` "Spegni tutte".
- **Piano IA**: CapoPlanRequest.machines (backend) + iniezione directive macchine in products_txt (IT/DE) con richiesta riga 'Macchina:' per prodotto; frontend invia getActiveMachineNames() nel payload piano.
- Verificato: Scheda Macchina in ricetta (Industriale, ≈800-1500/ora, tips Rheon/Rotovent); backend sano; reset presente.
- NB: generazione piano completa non ri-testata via curl (richiede payload complesso) ma wiring in place; backend startup OK.
- NB: PREVIEW → REDEPLOY per mikilab.de.

## v-cont22 (2026-06) — Scheda Macchina in stampa + Preset Laboratorio
- **index.css**: regola @media print per [data-testid=recipe-machine-scheda] (sfondo bianco + bordo). La scheda è già dentro .print-area → inclusa nel PDF/stampa ricetta.
- **lib/machines.js**: PRESET_KEY + BUILTIN_PRESETS (Linea Pane, Linea Brezel, Linea Grandi Lievitati, Linea Artigianale pietra) + getUserPresets/saveUserPreset/deleteUserPreset/presetLabel.
- **MachinePark.jsx**: sezione Preset (chip applica preset + "Salva attuali" via prompt + elimina preset utente).
- Verificato: 4 preset builtin; "Linea Pane" attiva 4 macchine (count 4 attivi), persistite.
- NB: PREVIEW → REDEPLOY per mikilab.de.

## v-cont23 (2026-06) — Fix checkout pacchetti + Email/PDF post-acquisto (Resend)
- **FIX P0 `/api/recipes/bundle-checkout` (Errore 500)**: mancava `managed_payments={"enabled": False}` nella Session.create (Managed Payments attivo sull'account Stripe richiede il product tax code). Aggiunto → il checkout genera l'URL Stripe (verificato via curl, ritorna cs_live_...). NB: chiave Stripe in modalità LIVE.
- **Email + PDF post-acquisto pacchetto (Resend)**: al pagamento completato viene inviata un'email (IT/DE/EN) con allegato un PDF di TUTTE le ricette del pacchetto (nome, ingredienti, procedimento, fasi, note). Libreria `reportlab==4.2.5`. Funzioni: `_build_bundle_pdf`, `_bundle_email_html`, `_bundle_fulfill` (idempotente: sblocca `unlocked_bundles`, marca `paid`, invia email solo la prima volta).
- **Fulfillment doppio canale**: `POST /api/webhook/stripe` (checkout.session.completed → `_bundle_fulfill`) + nuovo `GET /api/recipes/bundle/checkout/status/{session_id}?lang=` (polling al ritorno da Stripe, affidabile anche senza webhook configurato in preview).
- **Frontend** (`App.js`): gestione ritorno `?bundle=success&session_id=...` → polling status, toast "Pacchetto sbloccato + PDF via email", dispatch `mikilab-entitlements-updated`, vai a Ricette; pulizia URL (aggiunto `bundle` alle chiavi). Import `api` da lib.
- **Test**: PDF generato per tutti e 4 i pacchetti in IT/DE/EN (header %PDF- valido, 49/18/10/17 ricette). Resend accetta l'allegato (test su delivered@resend.dev → id ricevuto). Status endpoint 404 su sessione inesistente. Non testabile un pagamento LIVE reale (serve carta).
- NB: PREVIEW → REDEPLOY per mikilab.de. Webhook Stripe LIVE: verificare che l'endpoint `/api/webhook/stripe` sia registrato nel dashboard con il WEBHOOK_SECRET corretto per l'account attuale.

## v-cont24 (2026-06) — Chiusura HACCP 3 step + Magazzino, Preferiti a stella, Lingue IT/DE, PDF copertina, Email follow-up
1. **"Concludi Giornata" → "Chiusura Turno & Registro HACCP" (wizard 3 step)** (`DayClose.jsx` riscritto):
   - Step 1 Tracciabilità & Lotti: lotto di produzione auto (ML-AAAAMMGG-XX, rigenerabile), quantità prodotte, **Magazzino materie prime** (giacenze kg, add/salva), **Scarico** calcolato dal piano (`computeShopping`) e scalato automaticamente alla chiusura.
   - Step 2 Registro Sanitario: temperature (celle da lab-config), pulizie/sanificazione (Impastatrici/Banchi/Spezzatrici/Pavimenti/Celle/Forni), anomalie.
   - Step 3 Chiusura: operatore, nota, riepilogo → `POST /api/day-close` archivia + **sincronizza automaticamente il Registro HACCP** (una voce per temperatura con valore + una per pulizie/anomalie). Overlay celebrazione.
   - Backend nuovo: `GET/PUT /api/inventory` (magazzino per owner), `POST /api/day-close` (scarico magazzino fuzzy-match + crea haccp_logs + archivia in `day_closures`), `GET /api/day-close/last`. api.js: `inventoryApi`, `dayCloseApi`.
2. **Preferiti strumenti a STELLA (niente auto-aggiunta)** (`PianoProduzioneAI.jsx`): aprire uno strumento NON lo aggiunge più ai preferiti (rimossa la logica auto da `toolUsage`). Ogni card ha una ⭐ (`tool-fav-<id>`) per aggiungere/togliere; nei preferiti la ⭐ (`fav-remove-<id>`) o long-press rimuove; "Personalizza" resta per riordina/nascondi/pin. Badge "NUOVO" ora è un pallino rosso sulla stella (niente più overlap sull'etichetta).
3. **Tabella Farine unificata** (`FlourTable.jsx`): UNA riga per tipo (sigla DE · nome IT) con W (forza) e proteine%. Rimosso il doppione inline sotto l'avatar in `RecipeList.jsx` (resta solo il pulsante "Tabelle & Farine").
4. **Lingue solo IT/DE**: selettore header (`Header.jsx`) e popup benvenuto (`IntroGuide.jsx`) → solo IT|DE; `LanguageContext` clampa a it/de (EN disattivato lato UI, traduzioni EN restano nel codice). Rimossi i 🇬🇧 residui in Home/AuthScreen.
5. **PDF pacchetto con COPERTINA a colori + logo** (`_build_bundle_pdf`): prima pagina navy con logo MikiLab, titolo pacchetto, footer "mikilab.de".
6. **Email di follow-up** (`_send_bundle_followups` + loop ogni 6h): 3 giorni dopo l'acquisto di un pacchetto (`FOLLOWUP_DAYS=3`), invio UNA sola volta (`followup_sent`) invitando a scoprire gli altri pacchetti (Resend).
- Test: iteration_76 backend 9/9 pytest + E2E frontend 100% (favoriti no-auto-add, wizard chiusura, lingue). Fix post-test: owner_id non più esposto in day-close/last; niente voci HACCP per temperature vuote; badge NUOVO non copre più le etichette; rimossi 🇬🇧.
- NB: PREVIEW → REDEPLOY per mikilab.de. Chiave Stripe LIVE.

## v-cont25 (2026-06) — Avviso Scorte Basse (email)
- **Backend** (`server.py`): `_notify_low_stock(uid, email, lang)` — quando una materia prima del magazzino scende ≤ `threshold` invia UNA email (Resend, IT/DE) con l'elenco delle materie sotto soglia; anti-spam via `inventory_meta.notified` (ri-notifica solo dopo che la materia risale sopra soglia e riscende). Chiamato in `PUT /api/inventory` e dopo lo scarico in `POST /api/day-close`.
- **Frontend** (`DayClose.jsx`, Step 1 Magazzino): ogni riga ha ora il campo **soglia avviso** (`inv-threshold-<i>`) + nota "ricevi un'email quando la materia scende sotto quel livello".
- Test: helper diretto → 1ª chiamata invia (notified=['farina 0']); 2ª idempotente (nessuna email); dopo rifornimento sopra soglia notified svuotato. PUT /inventory salva threshold e non genera errori (HTTP 200).
- NB: email inviata all'indirizzo dell'utente loggato; dominio mittente `noreply@mikilab.de` (Resend). PREVIEW → REDEPLOY per mikilab.de.

## v-cont26 (2026-06) — Report Chiusura PDF, Storico Chiusure, Riepilogo scorte settimanale, Ordine al fornitore
1. **Report Chiusura PDF** (`server.py` `_build_closure_pdf` + `GET /api/day-close/{id}/pdf`): PDF stampabile di ogni chiusura (data, lotto, operatore, prodotti, scarico materie, temperature, pulizie/sanificazione, anomalie, nota, riga firma operatore). Ritorna application/pdf. Download lato UI via anchor `<a download>` (evita blocco popup) con toast.
2. **Storico Chiusure** (`GET /api/day-close/list` + `DayClose.jsx`): toggle `dayclose-modeswitch` (Nuova chiusura / Storico). Vista `dayclose-storico` con ricerca per data/lotto (`storico-search`), ogni voce (`storico-item-<id>`) con pulsante PDF (`storico-pdf-<id>`). Pulsante PDF anche nell'overlay di fine chiusura (`dayclose-download-pdf`).
3. **Riepilogo scorte settimanale** (`_send_weekly_stock_summaries`, nel loop ogni 6h): ogni **lunedì** (UTC) email con materie **sotto soglia** e **vicine** (≤ soglia +20%); una sola volta a settimana per utente (`weekly_stock_sent` con chiave ISO settimana). Iterazione su `inventory_items.distinct(owner_id, threshold!=null)`.
4. **Ordine Rapido al Fornitore** (`DayClose.jsx` `supplierOrder`): dal banner scorte basse (`dayclose-lowstock`) pulsante `dayclose-order-supplier` apre una bozza email (mailto) precompilata con l'elenco materie sotto soglia; destinatario = primo fornitore con email del Paese lingua (da `data/suppliers.js`, spesso vuoto → l'utente inserisce).
- Test: iteration_77 frontend 100% (toggle, storico, ricerca, wizard, celebrazione+PDF, banner scorte+mailto, IT/DE). Backend curl: list, PDF (%PDF-, 200 application/pdf), weekly email accettata da Resend. Fix post-test: download PDF via anchor con filename `chiusura-<lotto>.pdf`; input "Soglia avviso" su riga dedicata (non più stretto).
- **Known issue (preesistente, fuori scope)**: LabTour in "Il Tuo Laboratorio" ha un overlay che intercetta i click finché non viene chiuso; i controlli Salta/Avanti/X non hanno data-testid. Da valutare separatamente.
- NB: PREVIEW → REDEPLOY per mikilab.de.

## v-cont27 (2026-06) — Fix Tour Laboratorio, Firma Digitale su PDF, Email fornitore predefinita
1. **Fix Tour Laboratorio** (`LabTour.jsx`): il backdrop è ora `pointer-events-none` (solo oscuramento, non blocca i tap). Aggiunto listener document-click: toccando fuori dalla card del tour (es. uno strumento) il tour si chiude e il tap raggiunge lo strumento. Controlli già con data-testid (lab-tour-skip/next). Verificato: tap su capo-quicklink-dayclose → strumento aperto + tour chiuso.
2. **Firma Digitale Chiusura** (`DayClose.jsx` `SignaturePad` canvas dito/mouse, `signature-pad`/`signature-clear`): la firma (dataURL PNG) viene salvata nella chiusura e **incorporata nel report PDF** (`server.py` DayCloseReq.signature + `_build_closure_pdf` disegna l'immagine base64 alla riga firma). Verificato E2E: disegno → conferma → PDF 200/application/pdf con firma.
3. **Email fornitore predefinita (opzione B)** (`DayClose.jsx`): campo `supplier-email` nel Magazzino, salvato in localStorage (`mikilab_supplier_email`); `supplierOrder` usa quell'indirizzo come destinatario del mailto di "Ordine rapido al fornitore" (fallback: fornitore con email da `suppliers.js`). Verificato: persiste al reload, mailto precompilato.
- Test: iteration_78 frontend 100% (4/4). Note cosmetiche opzionali non bloccanti: striscia colorata sopra header su mobile; 401 pre-login in console.
- NB: PREVIEW → REDEPLOY per mikilab.de.

## v-cont28 (2026-06) — Pulizia header mobile + Grafico consumi settimanali
1. **Pulizia Header** (`Header.jsx`): rimossa la fascia multicolore `it-de-ribbon` dall'header (era la "striscia colorata sopra l'intestazione" segnalata su mobile). Header ora pulito/minimale. Il nastro resta solo come accento decorativo su alcune card (Home, hero) — non nell'header. Verificato: `[data-testid=app-header] [data-testid=flag-strip]` === null.
2. **Grafico Consumi settimanali** (`DayClose.jsx`, vista Storico): card `consumption-chart` con recharts BarChart che mostra i consumi di **Farina** vs **Lievito** per settimana (ultime 8), calcolati dagli scarichi delle chiusure. Classificazione per nome (farina/mehl/semola/... vs lievit/madre/sauerteig/...), conversione g→kg. Stato vuoto `consumption-empty`.
   - Backend: `POST /api/day-close` ora persiste anche `consume` (lista dichiarata) nel record, così il grafico riflette i consumi anche quando il magazzino non ha voci corrispondenti (prima usava solo `deducted`).
   - Frontend memo usa `consume` (dichiarato) se presente, altrimenti `deducted`. Fix asse Y (width 40→52, margin left 2) per non tagliare le etichette kg.
- Test: iteration_79 frontend — header pulito confermato; grafico renderizza correttamente (6 barre, legenda Farina/Lievito, bucket settimanali, tooltip). Fix post-test: persistenza `consume` (verificata via curl) + asse Y non tagliato.
- NB: PREVIEW → REDEPLOY per mikilab.de.

## v-cont29 (2026-06) — Radio (fix Indietro + molte stazioni) & i18n 4 lingue (IT/DE/EN/ES)
### Radio
- **Fix tasto Indietro** (`RadioFornaio.jsx`): aggiunto `useBackClose(open,...)` → premendo indietro si chiude SOLO il pannello, la radio continua a suonare, l'app non naviga via. Verificato (panel after back: 0, app resta caricata).
- **Molte più stazioni**: IT (16), DE (15), 🌍 Internazionali (8: FIP/Jazz/Swiss), 🇬🇧 UK (7: Capital/Heart/Smooth/Classic FM/LBC/Jazz FM/Planet Rock), 🇪🇸 ES (7: LOS40/Cadena SER/Dial/Europa FM/Kiss FM/COPE). Pannello ora `max-h-[70vh] overflow-y-auto`.
### i18n 4 lingue
- `LanguageContext.jsx` riscritto: supporta it/de/en/es; rileva prefisso URL (/it//de//en//es), poi localStorage, poi lingua browser. Fallback `t()`: lingua→EN→IT (mai italiano per EN/ES sulle chiavi centrali). `tri(it,de,en,es)` con fallback es→en→it.
- `translations.js`: aggiunto blocco **ES completo** — tutte le 4 lingue hanno esattamente **671 chiavi 1:1** (verificato).
- `tri3` esteso a `(lang,i,d,e,s)` in PianoProduzioneAI.jsx e Beginners.jsx.
- Selettore lingua Header + IntroGuide: IT · DE · EN · ES.
- SEO: tag `<link rel="alternate" hreflang="it/de/en/es/x-default">` in `index.html`.
- **NOTA**: le ~671 chiavi centrali (menu, nav, pulsanti, form, errori, pagine) sono tradotte 1:1 in tutte e 4 le lingue. Restano da traddurre in ES i ~1.060 testi "inline" `tri(it,de,en)` sparsi nel codice (es. alcune card Home): per ora mostrano EN in modalità ES (best effort concordato). Routing URL con prefisso: solo lettura all'avvio + hreflang (nessun rework path completo, come da scelta utente).
- NB: PREVIEW → REDEPLOY per mikilab.de.

## v-cont30 (2026-06) — Home ES, sezioni inline ES (fallback EN), Radio preferite + memoria
1. **Home in spagnolo** (`Home.jsx`): helper `L` esteso a `(it,de,en,es)`, aggiunte le traduzioni ES a tutte le schede (Descubre MikiLab, biografia, "Michele con las manos en la masa", slogan), `SCENE_PHRASES.es`, "Tu compañero digital". Verificato: zero residui italiani in ES.
2. **Sezioni inline ES** (Community/Academy/MohammedAssistant/Shop/Beginners): gli helper locali (`tri`, `pick`, `title/desc/dur`, ternarie `lang==="en"?`) ora per ES ricadono sull'**inglese** invece che sull'italiano → in modalità ES non compare più italiano (traduzione ES 1:1 di ogni stringa inline resta una passata successiva, come da "best effort").
3. **Radio — memoria ultima stazione** (`RadioFornaio.jsx`): salva l'ultima stazione in `mikilab_radio_last`; alla riapertura del pannello appare il pulsante "Riprendi: [stazione]" (`radio-resume`) per riavviarla con un tocco.
4. **Radio — Preferite con stella**: stella su ogni stazione (`radio-fav-<id>`), salvate in `mikilab_radio_favs`; gruppo "⭐ Preferite" in cima al pannello. Verificato.
- NB: PREVIEW → REDEPLOY per mikilab.de.

## v-cont31 (2026-06) — Spagnolo reale (Community/Shop/Impara) + Ricerca Radio
1. **Traduzioni ES reali (non EN)**: 
   - Community (`Community.jsx`): `tri` esteso a 4 arg; aggiunto ES a tutte le 27 stringhe inline (Comunidad de Panaderos, Mercadillo de Segunda Mano, Amigos y Colegas, tabs Consejo/Foto/Receta/Pregunta, toast, ecc.).
   - Shop (`Shop.jsx`): ES aggiunto alle 6 stringhe `tri` (Packs de Recetas de Michele, Comprado ✓, Disponible ahora, suscríbete PRO…).
   - Impara/Beginners (`Beginners.jsx`): ES aggiunto alle 19 stringhe `tri3` (Bienvenido a Aprende, Tu recorrido, Quiz del Panadero, Siguiente/Saltar/Entendido…).
   - Verificato in ES: zero residui italiani nella UI di queste sezioni. (Restano IT solo i 2 post di benvenuto seed della Community = dati/contenuti; aggiungere `text_es` nel seed backend in futuro.)
2. **Ricerca Radio** (`RadioFornaio.jsx`): barra `radio-search` in cima al pannello; digitando filtra tutte le stazioni in un gruppo "🔎 Risultati (n)" (o messaggio "nessuna trovata"); pulsante clear `radio-search-clear`. Verificato ("swr" → 2 risultati).
- NB: PREVIEW → REDEPLOY per mikilab.de.

## v-cont32 (2026-06) — Post benvenuto ES + sezioni rimanenti in spagnolo
1. **Post di benvenuto Community in ES**: aggiunto `WELCOME_POST_ES` nel seed (`server.py`), incluso `text_es` in insert/update e nella risposta API; `WELCOME_VERSION` 2→3; aggiornati i post pinned esistenti nel DB. Render Community: per ES usa `text_es` (fallback en→it). Verificato via screenshot (post in spagnolo).
2. **Sezioni rimanenti in spagnolo reale**:
   - Maestro (`Maestro.jsx`): `tri` esteso a 4 arg + ES sulle 3 stringhe.
   - Maestro IA (`MohammedAssistant.jsx`): `tri` 4 arg + ES su tutte le 13 stringhe (Pregunta a Mohammadreza, Paso 1/2, domande rapide…).
   - AvatarBubbles intro Community: aggiunte le 2 frasi in ES + fallback es→en→it.
   - Foto (Diagnosi) e Guida metodi: usano già `t()` (chiavi in translations.js) → già in spagnolo.
- NB: PREVIEW → REDEPLOY per mikilab.de.

## v40 (2026-06) — Fix lingua ricette al checkout + traduzioni ES complete
- **BUG P0 RISOLTO — Ricette nella lingua d'acquisto**: `BundleCheckoutReq` ora accetta `lang`; `bundle_checkout` salva `lang` nei `metadata` Stripe e in `payment_transactions`; il webhook (`/api/webhook/stripe`) passa `meta['lang']` a `_bundle_fulfill`, che legge la lingua da metadata/tx (fallback it). `_r_field`, `_build_bundle_pdf` (etichette Ingredientes/Elaboración/Harina/Agua/Masa madre + copertina), `_bundle_email_html`, oggetto email e nome pacchetto (`_bundle_name`) ora supportano IT/DE/EN/ES. Frontend `Shop.jsx` invia `lang` alla chiamata. VERIFICATO: metadata.lang='es' salvato; PDF generato interamente in spagnolo.
- **Traduzioni prodotti IT/DE/EN/ES**: aggiunti campi `_es` (name/flour_type/notes/procedure) a TUTTE le 94 ricette mikilab (batch LLM Claude via `_translate_recipe_lang`, ora supporta `es`). Modelli `Recipe/RecipeCreate/RecipeUpdate` estesi con `name_es/flour_type_es/notes_es/procedure_es` (altrimenti `response_model` li filtrava). Prodotti Shop (`SHOP_SEED`) con `name_es/desc_es/allergens_es`; patch idempotente estesa a `_es`. `lib/loc.js` `rLoc`/`ingLoc` gestiscono `es` (+ mappa `INGREDIENT_ES`).
- **Community GRATIS**: confermato — nessun `PaywallGate` su Community (né in App.js né in Community.jsx). Accessibile a tutti.
- **Rifiniture spagnolo**: PianoProduzioneAI (hero + opzioni), RecipeDialog (etichetta UE/allergeni/ingredienti/foto), RecipeList (baseLabel filtri, 'Harina:', selettore lingua ricetta con 'es', gate auto-traduci esteso a es, glossario), Ricette.jsx (tab principali), Shop.jsx (titoli bundle + allergeni + sottotitoli).
- **Fix i18n strutturale**: 46 file usavano un helper `tri(i,d,e)` LOCALE che per ES ricadeva sull'ITALIANO. Patchati a fallback es→en (convenzione del `tri` globale) → niente più italiano nelle schermate ES (dove manca lo spagnolo mostra l'inglese).
- Test: iteration_80 backend 100% (11/11 pytest: lang persistito es/de/en/it, 94 ricette con _es, prodotti shop _es); frontend ES verificato (nav, dettaglio ricetta interamente ES, filtri localizzati, Shop). NB: PREVIEW → REDEPLOY per mikilab.de. Stripe in preview usa chiavi LIVE (sessioni cs_live_…): evitare acquisti reali ripetuti nei test.


## v41 (2026-06) — Riorganizzazione catalogo, Generatore Ricette, Community auto-traduzione, i18n ES totale
- **Categorie rigide (choice 1A)**: nuove macro-categorie in `lib/recipeCats.js`: Basi & Lieviti, Pasticceria Lievitata & Viennoiserie (nuova, key `viennoiserie`), Pane & Panificati, Focacce & Grandi Lievitati Salati, Snack & Sfizi Salati. Etichette `cat_viennoiserie` + rinomina cat_pane/snack/focacce in 4 lingue (`translations.js`). Migrazione DB: panettoni + croissant/cornetti/sfogliati dolci → `menu_category=viennoiserie`. `recipeCategory` rispetta la categoria esplicita (i salati sfogliati NON finiscono in pasticceria).
- **Shop**: nuovo pacchetto `pasticceria` (€50) al posto di `panettoni`; `_recipe_bundle` viennoiserie/panettone→pasticceria; retro-compatibilità: chi aveva `panettoni` ottiene `pasticceria`. `BUNDLE_DEFS` aggiornato (nomi 4 lingue).
- **6 nuove ricette** (metodo Mickey Lab, complete + tradotte IT/DE/EN/ES + immagini Unsplash): Croissant Sfogliati Classici Senza Zucchero (rinomina di "Cornetto Sfogliato"), Croissant Tradizionali con Zucchero, Cornetti all'Italiana (brioche sfogliata), Stollen Tedesco, Danish Pastry & Plunder (tutte viennoiserie), Pane di Cristallo alta idratazione (pane). Seed: `backend/seed_new_recipes.py`.
- **Generatore Ricette Custom (choice 2a, PRO)**: `POST /api/recipes/generate` — calcolo % panificatore deterministico (farina/acqua/sale/pre-fermento/extra) + procedimento AI (Claude) nella lingua attiva. Config `GEN_EXTRAS`/`GEN_PREFERMENT`. UI: `components/RecipeGenerator.jsx`, tool "generatore" in `Maestro.jsx`/`PianoProduzioneAI.jsx`. Non-PRO→403.
- **Community auto-traduzione (choice 3b)**: `_translate_text_multi` (1 chiamata Claude→JSON de/en/es). Post e commenti salvano `text_de/en/es` alla pubblicazione; `Community.jsx` mostra i commenti nella lingua attiva.
- **i18n ES totale + fix CRITICO**: la sezione Impara/Aprende crashava (schermo bianco) in ES perché `data/content.js` non aveva blocco `es` → aggiunto blocco es completo (freeCourses/news/encyclopedia/lievitoMadre/promptSuggestions/youtubeVideos) + fallback. Aggiunti blocchi `es` a `Beginners.jsx` (LEZIONI/QUIZ/DAILY_RECIPES), `GuidaMetodi.jsx` (4 SECTIONS), `Enciclopedia.jsx` (30 voci ENC_ENTRIES, tradotte via LLM), `AvatarBubbles.jsx` (6 bolle). Fix strutturale iter precedente: 46 file con helper `tri(i,d,e)` locale → fallback es→en.
- **Test**: iter_81 backend 100% (generate/community/categorie/bundle) + frontend 85%; iter_82 frontend re-test: Impara ES OK (no crash), 5 cartelle categoria, nessun dolce in Pane, generatore OK, immagini nuove ricette OK. Enciclopedia/GuidaMetodi/AvatarBubbles ES corretti dopo iter_82 e verificati via screenshot.
- File dev (non in prod): `backend/seed_new_recipes.py`, `backend/gen_es_translations.py`.


## v42 (2026-06) — Generatore "Assistente di Produzione" (temp acqua + food cost + pezzatura + alert) & traduzione ingredienti
- **Generatore potenziato** (`POST /api/recipes/generate`, `RecipeGenReq` estesa):
  - **Pezzatura**: `mode=pieces` con `pieces`, `piece_weight`, `waste_percent` (sfrido) → `total_weight = pieces × peso × (1+sfrido%)`. Ritorna blocco `portioning`.
  - **Temperatura acqua d'impasto**: formula Mickey Lab (fattore 4 con pre-fermento, 3 diretto): `T_acqua = k×T_impasto − (T_farina + T_ambiente + attrito [+ pre-fermento])`. Ritorna `water_temp` con status hot/cold/ok.
  - **Food cost**: mappa prezzi €/kg (`GEN_PRICE_KG` + sale/lievito/madre) → `material_cost`, `cost_per_piece`, `suggested_price_piece` (in base a `food_cost_ratio`). Ritorna `food_cost`.
  - **Alert Ricetta Intelligente**: warnings localizzati (IT/DE/EN/ES) per incoerenze idratazione/farina/pre-fermento (idr>85 danger, ≥80 warn, biga+idr alta, LM idr estrema, focacce idr bassa, pezzo <40g). Ritorna `warnings[]` con level danger/warn/info.
  - UI `RecipeGenerator.jsx`: toggle Peso/Pezzatura, sezione avanzata (temp + prezzo + food cost %), blocchi risultato Acqua d'impasto / Food cost / Alert. Verificato via screenshot (pezzatura 20×90g→1980g, acqua 29°C, food cost €0.07, alert).
- **Traduzione ingredienti speciali (punto 4)**: aggiunti `name_de/name_en/name_es` agli `extra_ingredients` delle 6 nuove ricette (27 voci: Mantequilla/Pasas/Naranja confitada, Butter/Rosinen…). `RecipeList.jsx` ora mostra `e[name_${lang}] || ingLoc(e.name, lang)`. Verificato via API (Stollen ES/DE OK).
- Test: self-test curl (matematica pezzatura/temp/costo/warnings corretta) + screenshot UI end-to-end. ⚠️ PREVIEW → Redeploy per mikilab.de.


## v43 (2026-06) — Sicurezza autenticazione: registrazione evidente, password forte, forza-bruta, verifica email
- **UI (`AuthScreen.jsx`)**: tab prominenti Accedi/Registrati (`auth-tabs`), campo "Conferma password" + hint forza (`auth-confirm`), banner verifica email (`auth-info` + `auth-resend-verify`), stringhe in IT/DE/EN/ES.
- **Password forte** (`_validate_password`): min 8 caratteri + almeno una lettera e un numero, su register E reset-password (400 se debole).
- **Forza-bruta**: `login_attempts` (ip:email), 5 falliti → blocco 15 min (429).
- **Verifica email** (se `RESEND_API_KEY` presente): register → `email_verified=false` + token 24h (`email_verifications`) + email Resend con link `/?verify=<token>`; `AuthContext` consuma il token e logga l'utente. Login email non verificato → 403 `verify_email`. Endpoint `POST /api/auth/verify-email`, `POST /api/auth/resend-verification`. Utenti pre-esistenti (senza campo) = verificati (grandfathered).
- Test (curl): weak→400, strong→needs_verification, login non verificato→403, brute→429 al 6°, verify-email→sessione+login OK, admin esistente→200. UI verificata via screenshot.
- ⚠️ PRODUZIONE: (1) il problema "manca Registrati" era su mikilab.de = deploy vecchio → serve **REDEPLOY**. (2) Perché le email di verifica arrivino, il dominio mittente `noreply@mikilab.de` DEVE essere verificato su Resend, altrimenti i NUOVI iscritti non ricevono il link e non possono accedere (gli utenti esistenti non sono impattati).


## v43.1 — Reset password 4 lingue + verifica dominio Resend
- ResetPassword.jsx: policy password forte (8+ lettere+numeri) con hint + conferma, stringhe IT/DE/EN/ES.
- Dominio Resend mikilab.de VERIFICATO (status: verified, eu-west-1); invio email di prova OK → email di conferma/reset arrivano in produzione.
- Login Apple/secondo social: ANNULLATO su richiesta utente (restano Google + email/password).

## v43.2 — Laboratorio: no doppioni + ricerca strumenti
- Fix doppione: gli strumenti messi tra i Preferiti non vengono più ripetuti nella griglia "Apri uno strumento" (esclusi quando non si è in modifica). In modalità Personalizza restano tutti visibili per gestirli.
- Aggiunta barra di ricerca strumenti (tools-search) per filtrare per nome in 4 lingue. Nulla rimosso dalle impostazioni.
- Verificato: Timer in preferiti=1, in griglia=0; ricerca "temp" filtra a Temp. Acqua.

## v43.3 — Laboratorio: Generatore visibile + categorie + suggeriti
- FIX: "Crea Ricette" (Generatore) ora è la prima card della categoria "Impasto" in "Apri uno strumento" e si apre correttamente (era poco visibile).
- Strumenti raggruppati per tema con intestazioni: Impasto, Cottura, Gestione, Vendita (categorie vuote nascoste). Vista piatta durante ricerca/Personalizza.
- "Suggeriti per te": top 3 strumenti più usati (localStorage mikilab_tool_usage), non duplicati nelle categorie ne nei preferiti.
- Pallino "NUOVO" ora solo sul Generatore (prima appariva su quasi tutte le card = rumore visivo).
- Testing agent iter_83: frontend 100% (6/6). Minor noto: FAB Radio si sovrappone allultima riga su 390px (i click funzionano).

## v43.4 (2026-06) — Drag&Drop strumenti + FAB Radio + Disclaimer IA
- Laboratorio: riordino strumenti via HTML5 drag&drop (persist localStorage mikilab_tool_prefs.order) + frecce su/giù. FAB Radio (48x48, left-3) auto-hide durante lo scroll, non copre più le card. Testing iter_84: frontend 100%. Minor cosmetico: FAB può sfiorare le etichette-categoria su 390px.
- Disclaimer procedure IA (4 lingue IT/DE/EN/ES): banner ambra sotto il procedimento nel Generatore Ricette (`RecipeGenerator.jsx`, data-testid `gen-disclaimer`) E sotto il piano nel Piano IA (`PianoProduzioneAI.jsx`, data-testid `capo-plan-disclaimer`, dentro print-area → incluso nel PDF). Testo: "generato dall'IA a scopo indicativo, da validare sempre dal fornaio in base a farina/ambiente/attrezzatura". Compilazione verificata, nessun test agent (modifica solo UI/testo).

## v43.5 (2026-06) — Orario Infornate + riordino touch + PDF curato + hint ricette
- **Modulo "Orario Infornate"** (`infornate`, Icon Flame, ON di default): interruttore in `capo-modules` (`capo-module-infornate`). Backend `capo_plan_stream` (server.py): direttiva IT/DE che aggiunge in fondo al piano la sezione **## 🔥 Orario Infornate** = tabella markdown (Ora | Prodotto | Quantità | Forno | Temp °C | Minuti | Vapore), ordinata cronologicamente, scaglionata per non intasare il forno, orari calcolati a ritroso da formatura+appretto. FIX token: con i 6 moduli ON di default il piano si troncava a max_tokens=2400 prima della tabella → alzato a `max(max_tokens, 4500)` quando infornate ON + tabella dichiarata OBBLIGATORIA nel prompt. Verificato via `tests/test_capo_infornate.py` (2/2 pass, ~94s).
- **Riordino strumenti col DITO** (framer-motion): in modalità "Personalizza" (`tools-edit-toggle`) la griglia diventa lista verticale `Reorder.Group axis="y"` con righe `renderToolReorderRow` (grip `tool-grip-<id>`, hide/pin/frecce con `onPointerDown` stopPropagation). Sostituisce il vecchio HTML5 drag (non funzionava su touch). Persist in `mikilab_tool_prefs.order`. NB: page.drag_and_drop di Playwright non innesca framer-motion (serve mouse.move a step); frecce up/down sempre disponibili.
- **PDF Piano IA curato**: `PrintHeader` (logo MikiLab + titolo + data) in cima al print-area + campo **Note del fornaio** (`capo-baker-note`, no-print) che finisce nel PDF (`capo-baker-note-print`, box ambra).
- **Hint ricette personali**: `RecipeList.jsx` mostra `personal-lab-hint` (solo collection personal) che spiega che le ricette personali sono usate nel Laboratorio → Piano di Lavoro (gruppo "Le mie ricette").
- Testing iter_85: frontend 4/5 OK + backend infornate FIXATO e verificato con pytest 2/2. Minor non risolto (P2): nessun avviso di troncamento stream se il piano supera i token.

## v43.6 (2026-06) — Avviso troncamento + Infornate modificabili + Radio URL custom
- **Avviso troncamento piano**: backend `capo_plan_stream` appende marcatore `[[PLAN_END]]` e l'evento finale dello stream ora è `{done:true, truncated:<bool>}` (truncated = marcatore assente = piano tagliato dai token). Frontend `streamPhase` ritorna `truncated`; `generate()` rimuove il marcatore da testo/persist e setta `planTruncated`; banner `capo-plan-truncated` (rosso) + toast. Nessun falso positivo su piani completi (verificato).
- **Tabella Infornate modificabile**: `parseInfornate()` estrae la sezione "Orario Infornate" dal markdown (pulendo grassetti `** __ * \``) e `serializeInfTable()` la riscrive. Editor `capo-infornate-editor` con celle input `capo-inf-cell-<r>-<c>`, `capo-inf-add-row`, `capo-inf-del-<r>`. La tabella markdown originale NON è duplicata nel body. Le modifiche riscrivono `plan` e vengono SALVATE (debounce 1.2s → `capoPlanApi.save`/`persistPlan`), quindi PERSISTONO dopo reload e finiscono in share/PDF. Round-trip persistenza verificato via API (PUT/GET /api/capo/last-plan).
- **Radio URL personalizzato**: `RadioFornaio.jsx` — form `radio-add-toggle`/`radio-add-form` (`radio-add-name`, `radio-add-url`, `radio-add-save`) con validazione http(s); stazioni custom salvate in localStorage `mikilab_radio_custom`, gruppo `radio-custom-group` con rimozione `radio-custom-remove-<id>`; supportano preferiti e ricerca. Persistono dopo reload.
- Testing iter_86: frontend 100% dei flussi funzionanti. I 2 issue non bloccanti segnalati (asterischi markdown nelle celle + non-persistenza modifiche) sono stati POI RISOLTI in questa versione e verificati (regex di pulizia + persistenza su edit).

## v44 (2026-06) — FASE 1 roadmap "unica al mondo": Fermentazione Predittiva + Mani in Pasta
- **Fermentazione Predittiva** (`sections/FermentazionePredittiva.jsx`, tool `fermentazione` in TOOLS cat impasto, route in Maestro.jsx, guide in toolGuide.js). Modello Q10 (tempo raddoppia/dimezza ~ogni 8°C): input temp impasto/ambiente, % lievito o madre, tipo (diretto/madre/poolish/biga), obiettivo raddoppio o +50%. Meteo automatico via **Open-Meteo** (GPS `ferment-geo` o città `ferment-city`, nessuna chiave) → auto-compila temp ambiente. Output `ferment-time` (tempo stimato) + `ferment-ready` (ora pronto) + curva SVG. `ferment-remind` → crea timer/allarme globale (TimerContext.addTimer) + Notification. Avviso se temp>45°C (lievito muore). Verificato iter_87: Q10 monotònico OK (24°C=1h36, 30°C=57m, 18°C=2h41), reminder crea timer.
- **Modalità Mani in Pasta** (`components/HandsFreeMode.jsx`): overlay a schermo intero lanciato dalla vista ricetta (`handsfree-recipe-<id>` in RecipeList RecipeDetail). Legge i passaggi a voce (Web SpeechSynthesis), comandi vocali (SpeechRecognition: avanti/indietro/ripeti/timer X minuti/stop/chiudi in 4 lingue), schermo sempre acceso (Wake Lock API), crea timer via TimerContext. Testids handsfree-overlay/step/counter/next/prev/repeat/tts/mic/timer/close. FIX iter_87 (HIGH): overlay renderizzato con `createPortal(document.body)` per non essere ritagliato dal Radix Dialog (antenato con transform); etichetta mic rinominata "Comandi" (era duplicata "Voce"). Tutte browser API gratuite, nessuna chiave.
- FASE 2 da fare: Mappa dei Fornai (Leaflet+OSM, opt-in città) + Timeline ricetta (Gantt a ritroso dall'ora di sforno).

## v44.1 (2026-06) — FASE 2 roadmap: Mappa dei Fornai + Timeline Ricetta
- **Mappa dei Fornai** (Community). Backend: `baker_pins` + endpoint `/api/bakers/map` (GET, senza user_id), `/api/bakers/me` (GET/PUT/DELETE); coordinate arrotondate a 2 decimali (privacy ~1km). Frontend `components/BakersMap.jsx` (Leaflet 1.9.4 imperativo + OpenStreetMap, nessuna chiave; marker divIcon 🥖/⭐; opt-in con nome/città/bio; geocode città via Open-Meteo; GPS opzionale). Pulsante `community-map-btn` in Community.jsx apre l'overlay `bakers-map`. API `bakersApi` in lib/api.js. Verificato iter_88: 100% (7/7) + round-trip curl (privacy OK, no leak).
- **Timeline Ricetta** (`components/RecipeTimeline.jsx`, pulsante `timeline-recipe-<id>` in RecipeDetail). Distribuisce le fasi a ritroso dall'ora di sforno (`timeline-target-<id>`), mostra ora di inizio impasto + fasi con orari start→end. FIX iter_88 (HIGH): le fasi si derivano dai campi REALI della ricetta (`mix_minutes`, `bulk_fermentation_hours`, `rest_minutes`, `proofing_hours`, `bake_minutes`+`bake_temp`) — non più da work_phases (vuoto su tutte le 99 ricette) → ogni ricetta ha ora una timeline propria. Ricette senza sequenza (basi/lieviti/miglioratori, <2 fasi) mostrano un messaggio dedicato invece di un template finto.
- ROADMAP "unica al mondo" COMPLETATA (Fase 1 + Fase 2). Backlog residuo dagli spunti del testing: curva live fermentazione, comandi vocali nel Piano di Lavoro, validazione input fermentazione.

## v44.2 (2026-06) — 4 Next Action Items + fix collaterali
- **Curva Live Fermentazione**: dopo 'Avvisami', la curva mostra un pallino live (`ferment-live`) con % e tempo rimanente; il CTA diventa `ferment-cancel`. Persistenza `mikilab_ferment_run`. Verificato iter_89.
- **Comando Vocale nel Piano**: pulsante `capo-voice` (solo a piano generato, gated `!generating`) apre `HandsFreeMode` col testo del piano (lettura passo-passo + comandi vocali + wake lock).
- **Profilo Fornaio link**: campo `bakers-link` (BakerPin.link + `_norm_link` aggiunge https://) mostrato come link cliccabile nel popup del pin. Verificato via curl.
- **Timeline nel PDF**: la timeline è dentro l'area di stampa e usa i campi reali della ricetta.
- FIX collaterali da iter_89: (HIGH) picker ricette z-[70] > BottomNav z-50 (pulsante 'Fatto' ora cliccabile su mobile); addTimer ora ritorna l'id e `cancelRun` rimuove il timer globale; capo-voice nascosto durante lo streaming; geocoding città (Open-Meteo count=5, ordina per popolazione, mostra "città, paese") in BakersMap + FermentazionePredittiva → evita "Milano, Texas".
- BACKLOG richiesto dall'utente ma NON ancora fatto (da fare a blocchi testati): FASE 3 = (1) "Cosa posso fare con…?", (2) Versioning ricette, (3) Sfide settimanali Bake-Along, (4) Scanner Sacco Farina (OCR), (5) Costo Energia Forno; poi FASE 4 e FASE 5 (da definire).

## v44.3 (2026-06) — Home "Scopri MikiLab" più semplice ma completa
- Aggiunto in Home.jsx (dentro l'espansione "Scopri MikiLab", dopo home-promo) un blocco `home-features` "Cosa puoi fare con MikiLab": lista pulita e scansionabile (icona + titolo + 1 riga) che descrive TUTTE le funzioni in 4 lingue — Il Tuo Laboratorio (piano IA/celle/costi/infornate), Fermentazione Predittiva, Mani in Pasta & Timeline, Le Mie Ricette + Generatore, Impara (lezioni + diagnosi foto), Community & Mappa dei Fornai. Footer multilingua (IT/DE/EN/ES, smartphone & PC). Testids home-features, home-feature-<i>. Reso più semplice mantenendo tutta la descrizione. In attesa di review utente.
- PROSSIMO: FASE 3 in ordine 1→5 (1 "Cosa posso fare con…?", 2 Versioning ricette, 3 Bake-Along, 4 Scanner Farina OCR, 5 Costo Energia Forno) a blocchi testati.

## v45 (2026-06) — FASE 3 (blocco 1): "Cosa posso fare?" + "Costo Energia Forno"
- **Cosa posso fare?** (tool `cosafare`, cat impasto). Backend POST `/api/recipes/what-can-i-make` (LlmChat Claude): riceve ingredienti liberi + collection (mikilab/personal), costruisce lista compatta (nome/farina/prefermento/extra), l'IA ritorna {makable:[{id,name,image_url,note}], almost:[{id,name,image_url,missing}]}. FIX: max_tokens→3500 + note brevi (evita troncamento JSON); prompt severo (se manca ≥1 ingrediente chiave → 'almost' non 'makable'). Frontend `components/CosaPosso.jsx` (cosa-ingredients, cosa-scope-mikilab/personal, cosa-search, cosa-makable/cosa-almost). Verificato curl + iter_90 (classificazione corretta, 0 falsi in makable).
- **Costo Energia Forno** (tool `energia`, cat gestione). `components/CostoEnergia.jsx`: kWh = kW × min/60 × assorbimento% ; costo = kWh × €/kWh ; costo/pezzo. Persist localStorage mikilab_energia. FIX HIGH iter_90: sotto-componente `Field` spostato a livello modulo (prima gli input perdevano il focus ad ogni tasto per remount). Math verificato 100%.
- FASE 3 RESTANTE (in ordine): #2 Versioning ricette, #3 Sfide Bake-Along (Impara), #4 Scanner Sacco Farina (OCR). Poi eventuali fasi successive da definire con l'utente.

## v45.1 (2026-06) — Security audit + fix vulnerabilità ALTE
- Eseguito security_audit_agent. Pagamenti Stripe = OK (prezzi server-side, webhook con firma, fulfillment idempotente, NO manipolazione prezzo client).
- FIX applicati/verificati: SEC-001 CORS (allow_credentials=False, chiude riflessione origin credenziale; app usa Bearer token → nessun impatto); SEC-002 NoSQL injection in /auth/verify-email (token forzato a str → account takeover chiuso, verificato HTTP 400 su {$ne}); SEC-003 XSS stored nel link mappa fornai (escape completo &<>"' + validazione schema http/https).
- DA FARE (residuo audit, non ancora fixato): SEC-004 abuso trial 7gg re-registrazione (MEDIA — richiede binding device/pagamento + blocco domini usa-e-getta); SEC-005 CSRF (SameSite=none → passare a Lax o token CSRF); hardening: auth su /api/upload,/api/files,/api/seed-mikilab; messaggi generici anti-enumeration; rate-limit su register/forgot/verify/resend.
- NON ANCORA FATTO (parte contenuti richiesta dall'utente): aggiungere ricette Croissant/Cornetti (evidenziare: Croissant sfogliato SENZA zucchero nell'impasto), espandere "Pasticceria Lievitata & Viennoiserie" (danesi, brioche, veneziane, cornetti), ricette trend (Pan di Kristall), Pane da Hamburger in sezione Panini. Task dati ampio → prossima sessione.

## v45.2 (2026-06) — Security MEDIE + Contenuti Viennoiserie/Trend
- SEC-005 CSRF: cookie sessione samesite="none"→"lax" (app usa Bearer, nessun impatto).
- SEC-004 abuso trial: /trial/activate ora blocca domini email usa-e-getta (blocklist) + impedisce riattivazione dallo stesso IP con email diverse (db.trial_fingerprints). Admin esente. Login verificato OK.
- CONTENUTI (parte B): seed /app/backend/seed_viennoiserie.py → 7 ricette (mikilab, 106 totali) con immagini + name/notes/procedure IT/DE/EN/ES + menu_category corretta:
  · Croissant Sfogliato — **SENZA zucchero nell'impasto** (evidenziato nelle notes 4 lingue) [viennoiserie]
  · Cornetto Italiano (dolce, con zucchero) [viennoiserie]
  · Danese alla Crema (Plunder) [viennoiserie]
  · Brioche Francese [viennoiserie]
  · Veneziana (grande lievitato) [viennoiserie]
  · Pane da Hamburger [panini]
  · Pan di Kristall 95% idratazione (trend) [pane]
- Viennoiserie non è più solo panettoni. Verificato via API (categorie/img/traduzioni OK).

## v-sec (27 Ago 2026) — Rate limiting auth + Prova 7gg con carta (no addebito auto)
- **Rate limiting (P0 FATTO)**: helper Mongo `_rate_limit(scope,key,max,window)` + `_client_ip()` (collezione `rate_limits`, TTL 24h su `ts`).
  - `POST /api/auth/register`: max **5/ora per IP** → 429 "Troppe registrazioni da questo dispositivo".
  - `POST /api/auth/forgot-password`: max **10/ora per IP** + **3/ora per email** → 429. Mantiene anti-enumeration ({ok:true}).
  - Verificato via curl: 6° register stesso IP → 429; 4° forgot stessa email → 429.
- **Prova 7 giorni legata alla carta, SENZA addebito automatico (P1 FATTO — opzione b utente)**:
  - Backend: `POST /api/trial/checkout` → Stripe Checkout `mode="setup"` (managed_payments off) raccoglie la carta senza addebitare; `GET /api/trial/checkout/status/{sid}` + webhook `checkout.session.completed` (kind=trial_setup) → `_activate_card_trial()` concede 7gg PRO (`source="trial_card"`, `trial_used=True`, salva `stripe_customer_id`/`stripe_payment_method_id`, `trial_autocharge=False`). Nessun rinnovo automatico: alla scadenza l'utente deve abbonarsi manualmente.
  - Frontend: `subscriptionApi.trialCheckout/trialCheckoutStatus` (lib/api.js); PaywallGate mostra blocco "Prova 7 giorni — richiede carta, non addebitiamo nulla" con pulsante `trial-7d-card` → redirect Stripe. App.js gestisce ritorno `?trial=success|cancel`.
  - **RIMOSSA** la vecchia prova device senza registrazione (localStorage `mikilab_local_trial`) e i pulsanti 1h/24h dal paywall (abusabili): ora la prova richiede login + carta. Endpoint legacy `/api/trial/activate` resta ma non più usato dalla UI.
  - Verificato: `trial/checkout` ritorna URL Stripe valido; UI mostra il nuovo pulsante (screenshot).
- NB: modifiche in PREVIEW → serve REDEPLOY per mikilab.de.

## v55 (27 Ago 2026) — Ricette speciali colorate + Promemoria fine prova
- **5 nuove ricette MikiLab** col metodo INDIRETTO (biga/poolish + lievito madre) e procedimenti LUNGHI, colori NATURALI (nessun colorante). Aggiunte al seed `mikilab_seed_data.json` (persistenti al redeploy) → SEED_VERSION `2026-06-v55-speciali-colorate`. Script: `backend/seed_speciali_colorate.py`. Totale mikilab: 113.
  - **Cornetto Bicolore Cacao e Vaniglia** [viennoiserie, biga]: pasta chiara vaniglia + pasta scura cacao laminate insieme.
  - **Cornetto Doppio Gusto Pistacchio e Cioccolato** [viennoiserie, poolish]: pasta verde con pasta di pistacchio puro + farcia cioccolato (immagine generata Nano Banana).
  - **Pane all'Nduja** [pane, biga]: rosso-arancio naturale da nduja + paprika affumicata.
  - **Pane alla Barbabietola** [pane, lm]: rosa-magenta naturale da purea di barbabietola.
  - **Panini Basilico e Pomodoro** [panini, poolish]: bicolore marmorizzato rosso (concentrato pomodoro) + verde (basilico/pesto) (immagine generata Nano Banana).
  - Tutte con notes/procedure/name in IT/DE/EN. Verificato via API (categorie/metodo/immagini/proc_len OK) + screenshot (immagini caricano).
- **Promemoria fine prova (email automatica giorno 6)**: `_send_trial_reminders()` nel loop follow-up (ogni 6h). Seleziona entitlements `source in [trial_card, trial]`, pro, `expires_at` entro 24h e ancora attivo, `trial_reminder_sent != True` → invia email Resend (IT+DE) con CTA "Abbonati e continua" (link mikilab.de), poi marca `trial_reminder_sent=True` (idempotente, invia una sola volta). Sottolinea "nessun addebito automatico". HTML: `_trial_reminder_email_html()`. Verificato end-to-end con `delivered@resend.dev` (invio + flag + idempotenza).
- NB: modifiche in PREVIEW → serve REDEPLOY per mikilab.de.

## v56 (27 Ago 2026) — Altre ricette colorate + Badge fiducia paywall
- **4 nuove ricette MikiLab** colorate NATURALMENTE, metodo INDIRETTO + procedimenti lunghi (IT/DE/EN), seed persistente. SEED_VERSION `2026-06-v56-colorate2`. Script: `backend/seed_speciali_colorate2.py`. Totale mikilab: 117.
  - **Pane alla Curcuma e Zenzero** (giallo oro, biga), **Pane agli Spinaci** (verde, poolish), **Pane Nero al Carbone Vegetale** (nero + sesamo nero, lm), **Cornetto Bicolore Carbone e Vaniglia** (bianco/nero, biga). Immagini generate Nano Banana. Verificato via API (metodo/categoria/img/proc_len) + screenshot.
- **Badge fiducia abbonamento**: in PaywallGate, sotto le card prezzi, riga `paywall-trust-badge` con icona ShieldCheck: "Nessun addebito automatico · disdici quando vuoi" (IT/DE/EN). Verificato a schermo.
- NB: modifiche in PREVIEW → serve REDEPLOY per mikilab.de.

## v57 (27 Ago 2026) — Colori zafferano/spirulina/rapa + Vetrina Novità in Ricette
- **3 nuove ricette colorate NATURALMENTE** (metodo INDIRETTO, procedimenti lunghi IT/DE/EN), seed persistente. SEED_VERSION `2026-06-v57-colorate3`. Script: `backend/seed_speciali_colorate3.py`. Totale mikilab: 120.
  - **Pane allo Zafferano** (giallo-arancio, biga, infusione pistilli), **Pane alla Spirulina** (blu-verde, poolish), **Cornetto Bicolore Rosa (Rapa Rossa) e Vaniglia** (rosa/chiaro, biga). Immagini generate Nano Banana.
- **Vetrina "Novità dal MikiLab"** (`components/NovitaColorate.jsx`): evidenzia le 12 ricette colorate naturalmente in scroll orizzontale con foto. Posizionata nella **sezione Ricette (Mikilab)** come `extraHeader` di RecipeList (NON in Home — spostata su richiesta utente; il blocco Home `home-novita` è stato rimosso). Tap sulla card → apre la scheda ricetta via evento `mikilab-open-recipe` gestito in RecipeList (nuovo listener). testid: `ricette-novita`, `novita-card-<id>`. Verificato a schermo (12 card, click apre il dialog ricetta).
- NB: modifiche in PREVIEW → serve REDEPLOY per mikilab.de.

## v58 (27 Ago 2026) — Filtro/Badge colorati + Community "social" + Mercatino geo/multilingua
- **Lista condivisa** `frontend/src/lib/coloredRecipes.js` (COLORED_RECIPES + isColored) usata da RecipeList e vetrina.
- **Filtro "Colorati" 🌈** (RecipeList, solo mikilab): chip `base-filter-colorati` (gradiente Instagram) → mostra solo le 12 ricette colorate. **Badge "Novità/New"** (`recipe-new-badge-<id>`, gradiente) sulle card colorate nell'elenco.
- **Scheda "Perché coloriamo naturalmente"** (`novita-why`) nella vetrina NovitaColorate: spiega gli ingredienti naturali (curcuma/zafferano→giallo, spinaci/pistacchio→verde, spirulina→blu-verde, barbabietola→rosa, pomodoro/nduja→rosso, carbone→nero). IT/DE/EN/ES.
- **Community = "MikiLab Social"**: header brandizzato SOLO nella Community (`community-social-header`) con gradiente stile Instagram, avatar (`michele-avatar.jpg`) + logo ML (`logo.png`), badge "Nuovo", claim "il nuovo social dei fornai dentro il mio sito". IT/DE/EN/ES.
- **Mercatino dell'Usato (Marketplace.jsx)**: aggiunti 5 annunci di ESEMPIO multilingua (DE Stuttgart, IT Napoli, FR Lyon, ES Madrid, EN London) con coordinate — non salvati, non eliminabili (`sample`). **Modalità geolocalizzazione** (`market-geo`, "Vicino a me"): usa navigator.geolocation, calcola la distanza (haversine) e ordina gli annunci per vicinanza; badge distanza "· X km" sulle card e avviso `market-geo-active`.
- Verificato a schermo: header social, filtro Colorati (12 ricette + 12 badge), scheda perché, mercatino con card multilingua + pulsante geo.
- NB: modifiche in PREVIEW → serve REDEPLOY per mikilab.de.

## v59 (27 Ago 2026) — Generatore Piano: evidenza, rinomina, impasto di partenza, ordine extra oggi
- **"Compila per generare" IN EVIDENZA**: Section con prop `highlight` (bordo/ombra arancio) + badge "Inizia qui/Start here".
- **Rinomina pulsante**: "Scegli ricette ora" → **"Aggiungi al piano settimanale"** (sottotitolo "es. per oggi · a mano"). IT/DE/EN.
- **"Inizia con quale impasto?"** (piano settimanale): dropdown `capo-weekly-start` tra le voci del Piano Settimanale → invia `start_name`; l'IA avvia da quell'impasto (verificato: "(priorità richiesta)").
- **"Ordine extra di oggi"** (`capo-extra-today`): pannello con prodotti+quantità SOLO per oggi → invia `extra_today[]`; il backend li SOMMA alla produzione di oggi e crea una sezione separata "⭐ Solo per oggi — Ordine extra" SENZA modificare il Piano settimanale salvato (verificato E2E: "Cornetti sfogliati *(extra oggi)*").
- Backend `CapoPlanRequest`: aggiunti `start_name` + `extra_today`; direttive prompt [PARTENZA]/[EXTRA-OGGI] in `capo_plan_stream`.
- Verificato: UI (screenshot) + stream reale con account PRO.
- **ANCORA IN SOSPESO (grandi, lato server)**: (C) Mercatino REALE condiviso su DB con foto su storage; (D) Profili Social (foto/bio/ricette pubblicate).
- NB: modifiche in PREVIEW → serve REDEPLOY per mikilab.de.

## v60 (27 Ago 2026) — "Apri strumento" spostato · Notifiche Community · Mercatino REALE
- **"Apri strumento"**: rimosso dal popup "i" (ora solo "Ho capito"); aggiunto un pulsante `capo-module-open-<id>` SOTTO il nome di ogni interruttore del piano (apre lo strumento associato via MODULE_TOOL).
- **Notifiche Community**: backend ora notifica anche le **richieste di amicizia** (`friend_request`) e le **accettazioni** (`friend_accept`) via `_notify`; NotificationBell mostra icona/testo per gli amici. Aggiunto **pallino rosso sull'icona Community** in BottomNav (`nav-community-badge`) legato a `/notifications` unread (polling 45s + evento `mikilab-notif-refresh` + focus). Verificato E2E (richiesta amicizia → badge "1").
- **Mercatino REALE (server)**: nuovi endpoint `GET/POST/DELETE /api/community/market` (collezione `market_listings`), annunci condivisi tra tutti, **solo utenti registrati** pubblicano, delete owner/admin. Foto caricate su **Emergent Object Storage** (riuso `/upload` + `uploadApi.image`). Frontend `Marketplace.jsx` riscritto (via `marketApi`, non più localStorage); mantiene 5 annunci ESEMPIO multilingua + geolocalizzazione. Verificato via curl (create/list/401/delete) + UI.
- **ANCORA IN SOSPESO**: (D) Profili Social (avatar/bio/ricette pubblicate); spostare "Le mie ricette" da Ricette → Il Tuo Laboratorio (fatto "alla fine").
- NB: modifiche in PREVIEW → serve REDEPLOY per mikilab.de.
