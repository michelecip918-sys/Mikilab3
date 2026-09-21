# PRD — MikiLab · Il Manuale di Sitor (scheda corrente)

> Storico completo spostato in `_archivio_non_pubblico/docs/PRD.md` (COMANDO 5B, STADIO K5). Questo file tiene solo lo stato attuale.

## Cos'è
Ricettario pubblico gratuito (pane, pizza, dolci) guidato dall'avatar IA **Sitor**. IT/DE/EN. Nessun account pubblico; admin solo per Michele (`?admin=1`).

## Stato attuale (settembre 2026)
- **132 ricette visibili** (150 totali; panettoni e bozze nascosti via `recipe_extras.hidden_public`).
- Sicurezza: `GateMiddleware` DEFAULT DENY in `server.py`; pubbliche solo le GET (`recipes, recipe-extras, techniques, equipment-guide, site-settings [lista bianca], auth/me, health, sitemap, learning-path, site-pages, time, live, features, experiments, flour-types, bread-calendar, palato-tips`) e le WRITE (`sitor/chat, sitor/plan, sitor/photo, live/ping, done-ping, experiments/vote, auth login/logout/forgot/reset`).
- `GET /api/site-settings` = lista bianca (`tiktok_handle, hashtag, site_url, folder_covers`); nessun numero di telefono esposto.
- IA con contatore + limite + interruttore: `savings_level` 0-3 e `FEATURE_PHOTO_DIAG/PLAN/LIVE/VOICE_CHAT` (admin → Costi).
- Frontend pubblico: Home con chip (verde, miglioratore, cosa-faccio, live, mensola, cucina, piano, tecniche, calendario, farine, test del mese, dal mondo, pane di ieri, **crea il tuo lievito**, attrezzi), Course Player V2 (timer assoluti, mani libere, .ics), SitorChat con limiti, Palato (radar in localStorage), CreaLievito (percorso a giorni, tutto sul dispositivo).
- COMANDO 5A: Q (privacy/correzioni) + Y (Crea il tuo lievito) + N — FATTI.
- COMANDO 5B: K (pulizia: 173 file frontend non raggiunti archiviati, 43 pacchetti npm rimossi, 12 dev-tools backend rimossi da requirements, 99 media orfani spostati, segreti scansionati) + L (traduzioni: 748 tri pulite, fix Sauerteig, report ricette) + M (build verde, header sicurezza, fix TDZ CoursePlayer, contrasto AA, audit) + N (0 leak su 553 rotte, 132 ricette, LEGAL_DATA_MAP) — FATTI. - COMANDO 7: T0 (0 segreti nel codice tracciato; un PIN legacy oscurato in triTranslations.json; archivio gitignored/non tracciato) + T1 (Impressum/Datenschutz reali IT/DE/EN) + T2 (avviso microfono in chat, mani libere, radio) + T3 (LEGAL_DATA_MAP: voce via server Google/Apple) + T4 (newsletter: email DIVERSA dall'admin, non cancellata) + T5 (0 leak su 554 rotte). Splash rebranded. COMANDO 8: DB pulito (141 collezioni storiche cancellate dopo backup /root/mikilab_backup_storici_2026-09-20/, 2 ricette extra rimosse → 148 seed, users solo owner, contatori di prova azzerati, verified tutti a false, 0 leak). Backup da eliminare solo su decisione di Michele. COMANDO 10: pane(40) tested; focacce poi tornate bozza in COMANDO FINALE Z2 (metodo Michele in arrivo). COMANDO FINALE: Z1 testi lievito generici (panettone solo per grandi lievitati), Z2 avviso 'Ricetta in revisione' sulle 32 focacce, Z3 0 corsi da pulire, Z4 anomalie elencate (54 ricette), Z5 TUTTI i controlli passati, Z6 PRONTO PER PUBBLICARE (Michele preme Publish). ATTENZIONE: mikilab.de = deploy VECCHIO con DB diverso (149 ricette): dopo la pubblicazione va RIESEGUITA la pulizia dati del COMANDO 8 sul DB di produzione. Password admin cambiata da Michele (test_credentials.md aggiornato: vecchia non più valida).

## Verifica produzione — 20 settembre 2026
- Login admin su `https://mikilab.de` verificato end-to-end con il valore effettivo di `ADMIN_RESET_PASSWORD`: API `POST /api/auth/login` 200, `/api/auth/me` 200 con ruolo `admin`, rotte admin di controllo 200, UI `?admin=1` superata fino ad `account-btn`.
- Nessuna password, hash o token è stato scritto nei report. Il database pubblico di produzione risponde ancora con 149 ricette contro 132 in anteprima: la pulizia dati del COMANDO 8 resta da rieseguire sul DB di produzione dopo il prossimo publish.
- Priorità sicurezza: cambiare subito la password da admin → “Cambia password”, poi rimuovere `ADMIN_RESET_PASSWORD` dai Secrets e fare redeploy.
- Regola fissa backend (20/09): gli anonimi non vedono mai `menu_category="panettoni"` in ricette, extras e corsi; unica eccezione pubblica `Panettone Artigianale MikiLab — Verde Canapa`. Admin invariato. Richiede redeploy per la produzione.

## MESSAGGIO UNICO FINALE (20 settembre 2026) — Stadi 1-5
- **STADIO 1**: 16 panettoni riscritti sulla base MikiLab 60/40 (flour 500, water 210 o ridotta per Amarena 177/Caffè-Nocciola 195/Marron 192/Pistacchio 195, LM 110, sale 9, bake 170°C×45', bulk 12h, proof 7h, indiretto+lievito madre; sospensioni riscalate a 300 g; extra % fisse Zucchero30/Tuorlo29/Burro35/Miele4/Arancia3/Vaniglia0,6). Nuovo procedimento IT/DE/EN. Verde Canapa NON toccato tranne rimozione blocco "NOTE DEL FORNAIO". Frasi da corso (bagnetto, rinfreschi ravvicinati, 1:1:0,5, pH 4,1, NOTE DEL FORNAIO, riprendi corda) = 0 occorrenze nel seed. Regola fissa che nascondeva i panettoni RIMOSSA: tutti i 17 panettoni visibili (resta solo hidden_public). SEED_VERSION → `2026-09-v71-panettoni6040`.
- **STADIO 2**: su ogni scheda ricetta "Stampa/PDF" (scheda dedicata con logo MikiLab via @media print) e "Condividi" (immagine canvas 1080×1350 con logo, nome, tempo/difficoltà, link mikilab.de; navigator.share o download; senza dosi/procedimento). Copyright su scheda e footer. LEGAL_DATA_MAP aggiornato (nessun dato inviato).
- **STADIO 3**: stati ricette idempotenti allo startup (fill-missing) + update esplicito anteprima: pane/panini/focacce = "Provata da Michele" (tested); le 3 poolish inizialmente "Controllata" sono POI passate a "Provata" (v. sezione "Conferma poolish"); 16 panettoni = reviewed + riquadro giallo 60/40. Correzioni testi: Focaccia Barese (poolish→lievito madre), Carezza/Treccia (biga→poolish 100/100/0,5g, 12-16h), Panino alle Carote (passo 2 poolish). IT/DE/EN.
- **STADIO 4**: strumento admin "Pulizia dati vecchi" (rotte `/api/admin/data-cleanup/{scan,backup,execute}`, solo admin → 404 anonimo). Backup gzip obbligatorio nella sessione + parola CANCELLA per cancellare. Non esegue nulla all'avvio.
- **STADIO 5**: controlli passati — 0 frasi da corso; 17 panettoni visibili da anonimo; rotte private → 404; site-settings solo whitelist; /impressum e /datenschutz 200; ?admin=1 solo email+password; stampa con logo OK. Non è possibile pubblicare da qui: **PRONTO PER PUBBLICARE (Michele preme Publish)**; dopo il publish la produzione riceve seed v71 e stati via startup idempotente.
- Nota Dal mondo: le 4 ricette "Kochstück" (Farina Cotta, Pan Latte in Cassetta, Pane Morbido ai Cereali, Panini al Latte) sono ricette MikiLab e restano nel ricettario; non esistono voci "cinesi/dal mondo" separate da nascondere.

## Credenziali test
Vedi `memory/test_credentials.md`.

## Regole fisse
- Dati ricette nel DB non si toccano; nuovi contenuti in collezioni nuove / `recipe_extras` / localStorage.
- Niente segreti nel codice; `_archivio_non_pubblico/` non va committato.
- Niente operazioni distruttive all'avvio; niente deploy automatico.


## Conferma poolish (20 settembre 2026)
- Michele ha provato **Carezza Dolce**, **Treccia del Sole** e **Panino alle Carote**: status forzato a "tested" ("Provata da Michele") in anteprima (DB + API pubblica + badge UI verificati) e allo startup in modo idempotente (corregge anche la produzione se ha ancora "Controllata").
- Note poolish nel seed aggiornate IT/DE/EN → "dosi provate e confermate da Michele". SEED_VERSION → `2026-09-v72-poolish-provati`.
- RESTA DA FARE (solo Michele, fuori dall'anteprima): 1) premere **Publish** sulla dashboard Emergent; 2) su mikilab.de entrare in admin (`?admin=1`) → **Pulizia dati vecchi** → scaricare il backup → digitare `CANCELLA` (la produzione gira ancora col deploy vecchio: 149 ricette, badge "Bozza").

## Patch v73 applicata (20 settembre 2026)
- Applicato `mikilab_v73_patch.zip` di Michele in un solo passaggio (`sh patch/applica.sh`), senza modifiche: 91 ricette riviste (32 focacce col metodo Michele, 17 incomplete completate, 12 pani colorati/cornetti con sale+prefermento, 16 panettoni con grammi per fase — dosi invariate), corsi passo-passo generati dal procedimento senza IA (`course_builder.py`), chat Sitor su claude-sonnet-4-6 (veloce: Haiku), diagnosi foto attiva di default (3/giorno), allergeni lupino+glutine nel miglioratore, bugfix data_cleanup (`done_counters`), frontend: Converti-in-farro, sostituzioni, "Come leggere questa ricetta", pagina Miglioratore, riquadro Poolish; rimossi ApprenticeCard.jsx e recipeExport.js.
- SEED_VERSION = `2026-09-v73-ricette-complete`; migrazione una-tantum `app_meta/v73_drafts` ESEGUITA in anteprima (61 ricette riscritte → "Bozza di Sitor", corsi in cache rigenerati). Le 3 poolish restano "Provata da Michele" (fix v72 preservato nel patch).
- Build frontend OK (solo warning eslint preesistente). Script di verifica (inalterato, UA iniettato a runtime) su anteprima: **TUTTO OK** (11/11: 148 ricette, 5 ricette complete, panettone con grammi, corsi IT/DE/EN da 7 fasi, stato bozza corretto).

## Verifica produzione post-publish v73 (20 settembre 2026)

## Diario Prove + Foto Panettoni (20 settembre 2026)
- **Diario Prove** (recipe_extras.py): campi PRIVATI `test_date`, `test_outcome` (""|ok|da_rifare), `test_notes` in `ExtrasUpdate`; restituiti SOLO all'admin (GET/PUT gated su `user.role=="admin"`), mai al pubblico (verificato via curl: pubblico = "ASSENTE"). UI in `RecipeExtrasPanel.jsx` blocco admin "Diario prova (solo tu)": data + esito + note (autosave) + pulsanti stato Bozza/Controllata/Provata✓ (data-testid: admin-diario, admin-test-date, admin-test-outcome, admin-test-notes, admin-status-*). Nessuna modifica auth.
- **Foto Panettoni**: 17 foto rigenerate (Gemini) stile scuro elegante premium, panettone intero + fetta con farcitura specifica, salvate come webp in `/app/frontend/public/recipes/pan_*.webp` (sovrascritte, ~140-155KB). image_url del seed invariati. Verificate in galleria (anteprima). Al prossimo Publish il build le porta in produzione.
- Verifica self-test (no testing agent, come preferenza Michele): curl backend + 2 screenshot frontend. TUTTO OK.
- RESTA: pulizia DB produzione (149→148) da fare a mano da Michele.
- Deploy v73 su mikilab.de CONFERMATO: script di verifica inalterato → **TUTTO OK** (11/11). Le 3 poolish risultano "tested" anche in produzione (forzatura startup v72 applicata).

## Diario Riepilogo + Consiglio Sitor + Foto Focacce (20 settembre 2026)
- **Riepilogo Diario + Consiglio Sitor** (una schermata): nuovo endpoint admin `GET /api/admin/test-diary` (recipe_extras.py) → `{to_test, tested, items[], next, sitor_tip{it,de,en}}`; elenca tutte le ricette non ancora "Provata" con data/esito/note dell'ultima prova, ordina (mai provate → da_rifare → resto) e sceglie la "prossima da provare" con frase di Sitor IT/DE/EN. Gated admin (pubblico → 404, verificato). Nuovo componente `DiarioProve.jsx` (card "Consiglio di Sitor" con avatar `sitor_official.webp` + lista cliccabile che apre la ricetta). Link nel menu account admin (`diario-link`, route `admin-diario`) in App.js. data-testid: diario-prove-page, diario-next, diario-next-open, diario-counts, diario-list, diario-row-*.
- **Foto Focacce**: 32 foto rigenerate (Gemini) stile scuro elegante coerente coi panettoni, salvate webp in `/app/frontend/public/recipes/foc_*.webp` e `r_focaccia_*.webp` (sovrascritte, servite 200). image_url del seed invariati.
- Verifica self-test: curl backend (diary 48 tested/100 to_test, next=Bignè, pubblico 404; foc_*.webp 200) + screenshot pagina Diario admin (mobile, nessun overflow). No testing agent.
- Pulizia produzione: NON eseguibile dall'agente (azione distruttiva sul DB di produzione, gated dietro sessione admin + parola CANCELLA nella UI di mikilab.de; l'agente opera solo in anteprima). Resta a Michele; poi riconferma via script.

## Filtro Diario + Foto Pani Colorati (20 settembre 2026)
- **Filtro Diario**: in `DiarioProve.jsx` chip per categoria generati dalle bozze presenti (data-testid: diario-filter, diario-filter-all, diario-filter-<categoria>), con conteggio per categoria; filtra la lista lato client. Aggiunte label per `basi`. Verificato: Focacce → 32 righe, nessun overflow.
- **Foto Pani Colorati**: 12 foto rigenerate (Gemini) stile scuro elegante coerente: p_spinaci, p_spirulina, pn_basilico_pomodoro, p_carbone, p_barbabietola, p_nduja, p_curcuma_zenzero, p_zafferano, v_bicolore_cacao, v_bicolore_carbone, v_bicolore_rosa, v_doppio_pist_cioc → webp in `public/recipes/` (servite 200; Pane agli Spinaci verificato in galleria).
- Copertura foto rinnovate: 17 panettoni + 32 focacce + 12 pani colorati/cornetti = 61 immagini nuove (esattamente le ricette riscritte v73). Produzione: ancora 149 ricette — Publish + "Pulisci tutto" restano azioni di Michele; dopo, rieseguire lo script per riconferma 148.

## Foto Pizze + Progressi Diario (20 settembre 2026)
- **Foto Pizze**: 4 foto rigenerate (Gemini) stile scuro elegante: pz_napoletana, pz_teglia_romana, pz_pala, pz_taglio → webp in `public/recipes/` (servite 200). Copertura rinnovata completa: 17 panettoni + 32 focacce + 12 colorate + 4 pizze = 65 immagini.
- **Progressi Diario**: barra di avanzamento in cima al Diario prove ("48/148 provate · 32%", `data-testid="diario-progress"`), riempimento accent animato. Frontend-only, verificata via screenshot.

## Pulizia produzione eseguita da Michele (20 settembre 2026)
- Michele ha eseguito "Pulisci tutto" su mikilab.de. Script di verifica: **TUTTO OK** (11/11).
- Resta 149 vs 148 per UN solo duplicato legacy: **"Miglioratore Naturale Pro (Kopie)"** (vecchia copia tedesca della base, duplicata dalla UI anni fa; non fa parte delle collezioni storiche quindi la pulizia non la tocca). Eliminazione: admin su mikilab.de → aprire la ricetta → icona cestino (delete-recipe) → conferma. Non è nel seed: NON verrà ricreata. Dopo la cancellazione → 148.
- Ricorda: Publish porta in produzione Diario prove + filtro + progressi + 65 foto nuove (il DB resta intatto).
- Tutte le novità (foto, Diario, filtro, progressi) arrivano in produzione al prossimo Publish di Michele.

## Produzione allineata — 148 ricette (20 settembre 2026)
- Michele ha cancellato "Miglioratore Naturale Pro (Kopie)": mikilab.de ora mostra **148 ricette** come l'anteprima. Script: TUTTO OK, zero duplicati. DB produzione pulito e allineato.
- ATTESA: l'ultimo Publish non è ancora avvenuto (le foto su mikilab.de risultano ancora quelle vecchie, dimensioni diverse dalle nuove). Al prossimo Publish vanno live: Diario prove + filtro + barra progressi + 65 foto rinnovate (panettoni, focacce, colorate, pizze). Il DB non viene toccato dal Publish.
- Produzione mostra ancora 149 ricette (vs 148 anteprima): resta la pulizia del DB di produzione → Michele: admin → "Pulizia dati vecchi" → "Pulisci tutto (backup + cancella)". Poi provare le 61 bozze in cucina.
- PROSSIMI PASSI DI MICHELE: 1) un solo click su **Publish**; 2) dopo il deploy eseguire/ripetere `python3 patch/verifica_dopo_deploy.py https://mikilab.de`; 3) su mikilab.de: admin → "Pulizia dati vecchi" → "Pulisci tutto (backup + cancella)"; 4) provare le bozze in cucina e segnarle "Provata".

## LANCIO COMPLETO (20 settembre 2026)
- Michele ha eseguito il Publish finale. Verifica su mikilab.de: **TUTTO OK** — 148 ricette, foto nuove live (dimensioni esatte: pan_classico 149178b, foc_barese 153036b, p_spinaci 148706b, pz_napoletana 106224b, v_bicolore_rosa 109318b), Diario prove presente nel bundle di produzione (`diario-prove-page`, `test-diary`, "Test-Tagebuch").
- Stato finale: ricettario pubblico v73 online, DB produzione pulito (148 ricette, 0 storici, 0 duplicati), 65 foto stile scuro elegante, Diario prove + filtro + progressi + consiglio Sitor attivi per l'admin, corsi senza IA, chat su claude-sonnet-4-6, diagnosi foto attiva (3/giorno).

## Patch v74+v75+v76 live (20 settembre 2026)
- v74 (seed ricette → 154, +6 nuove), v75 (reset password una-sola-volta), v76 (solo frontend): applicate via zip da Google Drive, nessuna modifica manuale, anteprima verificata (backend pulito, 154 ricette, frontend 200).
- Michele ha eseguito il Publish. Verifica produzione mikilab.de: **TUTTO OK** — 154 ricette pubbliche, 5 ricette campione complete, panettone con grammi, corsi IT/DE/EN 7 fasi, stato bozza corretto, nessun duplicato "Kopie". (Lo script `patch/verifica_dopo_deploy.py` non c'è più: cartella patch rimossa dalle patch successive; controllo equivalente eseguito inline.)

## PATCH V74 (20 settembre 2026)

## Foto 6 nuove ricette + Traguardi Diario (20 settembre 2026)
- **Foto 6 nuove ricette** (v74): generate stile scuro elegante e collegate — Colomba (col_classica), Pandoro (pandoro_classico), Stollen classico/marzapane, Pinsa Romana (pinsa_romana), Panettone Salato Speck (panettone_salato_speck). image_url aggiunti al seed JSON; SEED_VERSION → `2026-09-v77-foto-nuove` (nota: v76 si era auto-segnato durante l'hot-reload prima del salvataggio JSON, per questo il bump a v77). Verificato: API restituisce le 6 image_url, file 200, Pandoro visibile in galleria. Produzione riceverà foto al prossimo Publish (re-sync su SEED_VERSION nuovo).
- **Traguardi Diario**: in DiarioProve.jsx festeggiamento al primo raggiungimento di 50/75/100% (persistito in localStorage `mikilab_diario_milestone`): toast sonner + banner dismissibile con icona PartyPopper (data-testid diario-celebrate, diario-celebrate-close). Verificato via intercettazione API a 56% → banner "Milestone: 50% tested!" + toast. Build frontend OK.
- Seed `2026-09-v74-festivita-sezioni`: 154 ricette (+6: Colomba, Pandoro, Stollen classico e al marzapane, Pinsa Romana, Panettone Salato; tutte bozza di Sitor). Nuove categorie `rosticceria` e `fritti` (5 ricette spostate da `snack`).
- `impressum_address` in `site-settings` (whitelist pubblica, scrittura solo admin): l'indirizzo di Impressum/Datenschutz si cambia da admin senza deploy.
- Frontend: pagina `CenaSughi` (Panico da cena + Sughi nel mondo, tutto locale senza IA), `ImpressumAdmin`, comandi vocali «Ehi Sitor» e sostituzioni a voce in Mani in Pasta (`lib/voiceSubs.js`, con guardia anti-eco), tasto Home fisso nell'intestazione, chip Home secondari sotto «Altro».
- Sicurezza: credenziali tolte da `test_reports/iteration_2.json` (restano nella cronologia git: ruotare la password e rimuovere `ADMIN_RESET_PASSWORD`).

## Patch v77 + ripristino foto 6 ricette (20 settembre 2026)
- Applicata patch v77 di Michele (zip) senza modifiche: SEED_VERSION era `2026-09-v77-controllo-ricette`.
- La v77 aveva sovrascritto `mikilab_seed_data.json` riportando `image_url: null` sulle 6 ricette nuove (v74). Su scelta di Michele ("A") ricollegate: Colomba→col_classica, Pandoro→pandoro_classico, Stollen Classico→stollen_classico, Stollen Marzapane→stollen_marzapane, Pinsa→pinsa_romana, Panettone Salato→panettone_salato_speck (i .webp esistevano già in `public/recipes/`).
- Attenzione hot-reload: il primo bump di SEED_VERSION è stato sincronizzato mentre il JSON aveva duplicati `null` (auto-segnato come in v76); risolto con secondo bump → SEED_VERSION = `2026-09-v77-foto-ripristinate-2` e restart backend.
- Verifica self-test (no testing agent, preferenza Michele): DB con 6/6 image_url, API pubblica `/api/recipes` 6/6 OK (154 ricette totali), screenshot galleria: Colomba e Pinsa renderizzate (naturalWidth 1024/1264).
- PROSSIMO PASSO DI MICHELE: premere **Publish** sulla dashboard Emergent per portare v77 + foto ripristinate in produzione (il sync avviene allo startup grazie al nuovo SEED_VERSION).

## Patch v77 FINALE + secondo ripristino foto (20 settembre 2026)
- Applicato `mikilab_v77_finale.zip` (da Google Drive) esattamente come da istruzioni: estratto in radice, `sh patch77/applica.sh` → output: "Seed ricette: 154" + "OK: v77 applicata. Ora un solo commit e un solo deploy." (nessun avviso logo-emblem). La patch sovrascrive: `backend/server.py`, `backend/mikilab_seed_data.json`, `frontend/src/components/{RecipeList,CasaLab,RecipeScheme}.jsx`; rimuove la cartella patch76.
- Lo zip (creato prima del ripristino precedente) aveva di nuovo le 6 image_url a null: su scelta di Michele ("A") ricollegate subito dopo l'applicazione (stesso mapping: col_classica, pandoro_classico, stollen_classico, stollen_marzapane, pinsa_romana, panettone_salato_speck).
- Ordine corretto stavolta: prima il JSON, poi il bump SEED_VERSION → `2026-09-v77-finale-foto` (niente corsa con l'hot-reload; sync avvenuto col JSON già corretto).
- Verifica self-test: API pubblica 6/6 image_url OK su 154 ricette, screenshot galleria: Colomba renderizzata (w=1024). Backend senza errori. (Nota: /api/health risponde 404 — endpoint con altro path; /api/recipes conferma backend sano.)
- PROSSIMO PASSO DI MICHELE: un solo **Publish** sulla dashboard → in produzione arrivano v77 finale + le 6 foto (sync automatico allo startup).

## Patch v78 riordino (21 settembre 2026)
- Applicato `mikilab_v78_riordino.zip` (Google Drive) esattamente come da istruzioni: `sh patch78/applica.sh` → output: "Seed ricette: 167 | senza foto (da generare): 13" + "OK: v78 applicata. Ora un solo commit e un solo deploy." Nessun avviso "foto non trovate".
- Contenuto: seed **154 → 167 ricette** (+13 nuove SENZA foto: 4 lucane, Pane Arcobaleno, Baguette Colorata, Pane alla Zucca, 4 pani tedeschi, 2 panettoni nuovi — foto da generare in futuro, NON ora per scelta di Michele), nuovo `server.py` (SEED_VERSION `2026-09-v78-riordino`, V78_DRAFT_NAMES), nuovi componenti/sezioni frontend (VetrineReparti, VetrinaFocacce, sezioni Ricette/SaporiCasa/RicetteCustodite, lib/coloredRecipes.js). Rimossa cartella patch77.
- Le 6 image_url delle ricette v74 erano GIÀ incluse nello zip (creato dopo il ripristino): nessun intervento necessario.
- Verifica self-test: API 167 ricette, 6/6 foto v74 OK, 13 senza foto (le nuove, atteso), 0 immagini rotte, frontend compila (no overlay errori), galleria mostra "167 recipes".
- Bug PREESISTENTE non bloccante (non toccato per volontà di Michele): `community.py` usa `logger` mai definito (riga 251 e altre) → NameError solo quando il loop bakealong va in eccezione. File del 16/09, non introdotto da v78.
- PROSSIMO PASSO DI MICHELE: un solo **Publish** → produzione con 167 ricette + nuovo layout vetrine.

## Foto 13 nuove ricette v78 (21 settembre 2026)
- Generate 13 foto (Gemini, stile scuro elegante coerente con le 65 precedenti, verificato contro pan_classico.webp; nessuna mano/persona → tatuaggio non applicabile): pani lucani ×3, focaccia cruschi, arcobaleno, baguette colorata, zucca, roggenbrot, vollkornbrot, laugenbrötchen, kaisersemmel, panettone cioccolato, panettone colorato (quest'ultimo riuscito al 2° tentativo dopo un 503 del servizio).
- Salvate webp (90-172KB) in `frontend/public/recipes/`: pane_lucano_grano_duro, pane_patate_lucano, pane_cafone_lucano, foc_lucana_cruschi, pane_arcobaleno, baguette_colorata, pane_zucca, roggenbrot, vollkornbrot, laugenbrotchen, kaisersemmel, pan_cioccolato, pan_colorato.
- Seed: 13 image_url impostati (ricerca per nome esatto, nessun'altra ricetta toccata) → 167/167 ricette con foto. SEED_VERSION → `2026-09-v78-foto`.
- Verifica: API 167 ricette 0 senza foto, file serviti 200, galleria renderizza le lucane. PROSSIMO PASSO: Michele preme **Publish**.

## Illustrazioni Tecniche completate (21 settembre 2026)
- La pagina Tecniche (`TecnichePage.jsx`) tenta sempre 4 immagini per tecnica (`/tecniche/{slug}/{1..4}.webp`, onError nasconde le mancanti). Mancavano 8 illustrazioni: baguette/4, croissant/4, filone/4, panettone/4, pieghe/3-4, pirlatura/3-4.
- Generate 8 illustrazioni (Gemini) nello stesso stile storybook caldo delle esistenti (verificato contro pirlatura/1-2 e pieghe/2): dove compaiono mani c'è SEMPRE il tatuaggio serpente-polpo nero con occhi arancioni sull'avambraccio, nessun volto, nessun testo. Soggetti: rolling baguette, arrotolamento croissant, tagli con lametta, panettone capovolto sui ferri, piega in ciotola, impasto coperto a riposo, rotazione pirlatura, palline in lievitazione.
- Salvate webp (200-300KB) nelle rispettive cartelle. Verifica: 8/8 servite 200, pagina Pirlatura mostra 4/4 immagini coerenti. Nessuna modifica a codice o seed (asset statici). In produzione al prossimo **Publish** di Michele.
- Nota navigazione: la pagina tecniche si apre via evento `mikilab-open-technique` (detail.slug opzionale); la vista "guida" da home-btn-guide apre il glossario, non le tecniche.

## Patch v79 privacy + procedimenti (21 settembre 2026)
- Applicata `patch79` da Google Drive: `sh patch79/applica.sh` → "Controlli v79: tutto OK (167 ricette, nessun tracciamento, nessuna immagine esterna). OK: v79 applicata."
- Contenuto: nuovo `index.html` PULITO (rimossi PostHog + emergent-main.js — coerente con la Datenschutz: niente statistiche né tracciamento; lo script di verifica della patch stessa asserisce l'assenza di "posthog"/"emergent"/"notranslate"), `RicetteCustodite.jsx` senza Unsplash, `LegalPlaceholder.jsx` senza "United Radio", seed con procedimenti completati (asserzione: nessun procedimento <440 caratteri fuori dalle basi), SEED_VERSION → `2026-09-v79-procedimenti`. Rimossi patch78 e `lib/planPdf.js`.
- Le 13+6 foto fatte da noi erano già nel seed v79 (0 senza foto, 0 file mancanti): nessun intervento.
- Verifica self-test: API 167 ricette 0 senza foto, HTML servito senza script di tracciamento (grep=0), home renderizza. PROSSIMO PASSO: Michele preme **Publish** (l'index.html pulito va in produzione col build).

## Patch v80 + 24 illustrazioni tecniche col tatuaggio (21 settembre 2026)
- Applicata `patch80`: "OK: v80 applicata" — firma del polpo (`polpo-firma.svg` in public, referenziata da RecipeScheme/PrintHeader/TattooSignature); index.html resta SENZA posthog/emergent/notranslate (asserito dallo script). Solo frontend; rimossa patch79.
- Rigenerate TUTTE le 24 illustrazioni tecniche (6 tecniche × 4): stesso stile storybook, ma ora OGNI immagine mostra mani e avambracci; tatuaggio identico dalle foto `patch80/riferimento_tatuaggio` (modello, NON copiate in public): braccio **SINISTRO** (correzione di Michele, prima indicato destro), esterno avambraccio gomito→polso, grande polpo nero-grigio, testa a metà avambraccio, due occhi giallo-ambra con bordo rosso, tentacoli verso gomito e polso, ventose a puntini chiari; braccio destro senza tatuaggi. Stesso blocco di descrizione in tutti i 24 prompt per coerenza.
- Sovrascritti i file `tecniche/{baguette,croissant,filone,panettone,pieghe,pirlatura}/{1..4}.webp` (183-317KB). Verifica: 24/24 servite 200, pagina Panettone 4/4 con polpo nitido, HTML senza tracciamento. In produzione al prossimo **Publish** di Michele.

## Firma del polpo estesa (21 settembre 2026)
- Su richiesta di Michele ("Firma Altrove"): footer (`App.js`, riga copyright) ora mostra icona `polpo-firma.svg` + "© MikiLab — Il Manuale di Sitor · Fatto con le mani di Michele" IT/DE/EN (`data-testid="footer-polpo-firma"`); pagina lista Tecniche (`TecnichePage.jsx`) mostra la card `TattooSignature` sotto l'intestazione (`data-testid="tecniche-signature"`).
- Verifica: entrambe presenti via screenshot desktop, nessun overflow a 390px. In produzione al prossimo **Publish**.

## Polpo del footer animato (21 settembre 2026)
- Nuovo `PolpoFooter.jsx`: l'SVG del polpo inline (generato da `polpo-firma.svg`, che resta invariato per TattooSignature/stampe), gli 8 tentacoli marcati alternati `pf-tent-a`/`pf-tent-b`; CSS nel componente con `transform-box: fill-box`, sway ±2.5° sfalsato (1.7s/2.1s) SOLO in `:hover`, disattivato con `prefers-reduced-motion`. Tooltip "Il polpo di Michele ti saluta". Stesso `data-testid="footer-polpo-firma"`.
- Verifica automatica: animazione assente a riposo, attiva in hover (computed style `pf-sway-a`/`pf-sway-b`), nessun overflow mobile.

## File verifica Google Search Console (21 settembre 2026)
- Creato `frontend/public/googlea308a6dc1717156d.html` con la sola riga `google-site-verification: googlea308a6dc1717156d.html` (54 byte). Verificato: URL servita 200 text/html con quella riga (NON la home). Va in produzione col prossimo **Publish**; poi Michele completa la verifica su Search Console.
- Controllo pre-volo deploy (deployment_agent): build OK, nessun segreto, nessun tracciamento; le 8 note su operazioni MongoDB all'avvio sono le migrazioni una-tantum delle patch di Michele (v73/v79, TTL compliance, reset admin) — intenzionali, già pubblicate con v73, non toccate per sua scelta.

