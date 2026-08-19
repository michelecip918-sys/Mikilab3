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
## v16 (2026-08) — Scansiona ricetta, Guida metodi, Glossario, News automatiche
- **Scansiona ricetta da foto** (nuovo tool Maestro `ScanRecipe.jsx` + `POST /api/maestro/scan-recipe`): fotografi una ricetta → Claude estrae i campi in JSON → si apre il form pre-compilato, modificabile e salvabile (collezione personale).
- **Guida ai metodi** (`GuidaMetodi.jsx`, accordion bilingue): 4 sezioni spiegate — Poolish, Lievito Madre (con differenza gestione PANE vs PANETTONE), Roggen Sauerteig, Backmittel.
- **Glossario con asterisco** nelle schede ricetta (`GlossaryBox`): spiega termini difficili presenti nel procedimento (bassinage, autolisi, poolish, stockgare, Quellstück, Sauerteig, incordare, appretto, TA).
- **Gnetzbrot e Wurzelbrot rifiniti** con ricette reali (poolish + Weizen/Sauerteig liquido, idratazione ~82%, bassinage).
- **Baguette con Poolish** aggiunta (metodo indiretto, T65, 70%). Totale ricette: **37**.
- **Notizie automatiche**: `Stoccarda` ora è un feed READ-ONLY da `GET /api/news` (Google News RSS, query pane/Bäckerei Stoccarda/Germania/Italia, cache giornaliera). Rimossa l'aggiunta/modifica manuale.

## BACKLOG dopo v16
- Redesign a colori completo IT/DE su TUTTA l'app (sfondi/schede/nav) — design_guidelines.json pronto.
- Categorizzare le ricette (pane / panini / panettoni / lievito madre) e raggrupparle nella lista.
- Listino PDF stampabile completo (tutti i gusti, formati 500g/100g, prezzi B2B).
- Foto con il volto di Michele dove compare una persona (serve conferma della foto giusta).

