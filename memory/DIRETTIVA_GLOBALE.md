# DIRETTIVA GLOBALE — Mikilab / "Il Tuo Laboratorio" (2026-06)
Master plan dalla direttiva tassativa dell'utente. Stato: ✅ fatto · 🔲 da fare · 🧊 bloccato/futuro.

## 1. UI / Titoli / Asset
- ✅ Rinominare OVUNQUE "Maestro" → "Il Tuo Laboratorio" (nav, gate login, voce, bio, Home). Resta solo nella chat AI ("Chiedi al Maestro"). NB: ricetta "Bretzel del Maestro" da rinominare in FASE 2 (nomenclatura).
- ✅ Rimuovere didascalie secondarie sotto titoli/pulsanti interni (griglia strumenti mostra solo titolo).
- ✅ HOME: didascalie esplicative (blocco `home-audiences`: "Per professionisti · Il Tuo Laboratorio" + "Per chi inizia · Sezione Principianti") + sottotitolo su ogni sezione.
- ✅ HOME: foto/AI (logo, cartone, bio-dough) + sfondo cartone su ogni pagina.

## 2. Preview strumenti PRIMA del trial/paywall ("Guarda cosa fa")
- ✅ PaywallGate ora mostra `paywall-preview`: elenco funzioni (titolo+descrizione) PRIMA di prezzo/prova, adattato per sezione (lab/diagnosi/beginners). Prop `feature` da App.js/LearnHub.

## 3. Sezione Principianti sotto paywall
- ✅ Beginners (tab Impara) avvolto in PaywallGate (feature=beginners, "Sezione Principianti"). News + Enciclopedia restano LIBERE.
- (contenuti passo-passo/glossario/quiz già in Beginners.jsx; da arricchire in fasi successive se richiesto).

## 4. Fix procedimenti / catena del freddo (DATI ricette)
- ✅ Rimossa regola generica "16°C / 6 ore" universale (script apply_phase2.py). LM: cella 16°C mantenuta. Sfoglie/croissant: pieghe in frigo 2–4°C. Non-LM (diretto/poolish/biga): puntata a temperatura ambiente ~24-26°C, frigo solo per gestire i tempi. Panettoni: nota lievitazione 24-28°C + raffreddamento capovolto.

## 5. Nomi ricette / Traduzioni / Lingue
- ✅ Doppia nomenclatura: campo `real_name`/`real_name_de` (proposta automatica su 18-19 ricette fantasia, MODIFICABILE dall'admin nel form — data-testid recipe-realname-input). Mostrato in lista e dettaglio sotto il nome fantasia. Michele può correggere i nomi proposti.
- 🔲 Lingua EN (solo IT/DE oggi) — FASE 4.

## 3b. Automazioni lab (FASE 3 avviata)
- ✅ Avviso Freezer: strumento "Scorte Freezer" in Il Tuo Laboratorio (data-testid freezer-stock) — imposti quantità+soglia; salvando, se sotto soglia parte email all'email dell'UTENTE loggato (Resend). Endpoint /api/freezer GET/PUT.
- 🔲 Miglioratore 0,3% auto, smistamento celle non ridondante — da fare.

## 6. Visitatori / Trial / Paywall (SaaS)
- ✅ Trial 1h/24h attivazione singola + countdown header.
- ✅ Paywall rigido su "Il Tuo Laboratorio" + "Diagnosi" + "Sezione Principianti".
- ✅ Coupon/VIP da admin (grant illimitato/temporaneo).
- ✅ Calcoli/formule server-side, API protette.
- ✅ 2 ricette DEMO read-only COMPLETE (vetrina): "Cuore Italiano" + "Panettone Mikilab — Uvetta e Canditi (Classico)". 🔲 Landing "Chi sono" dedicata (i concetti Home coprono in parte).

## 7. Logiche "Il Tuo Laboratorio"
- ✅ Capo Laboratorio (piano AI), celle, panettoni 2 impasti con ricalcolo sospensioni.
- 🔲 Miglioratore naturale al malto diastasico auto-calcolo 0,3%.
- 🔲 Smistamento celle automatico NON ridondante (Lievitazione oggi / Frigo domani / Freezer riserva) — verificare completezza.
- 🔲 Notifica EMAIL automatica quando riserva freezer < soglia minima (Resend).
- ✅ Report consumi in €, distinta base fornitori (SupplierOrder/ShoppingList).

## 8. Diagnosi / News hub / Protezione
- ✅ Diagnosi = solo test tecnici. ✅ Hub News+Novità(IT/Stoccarda/DE)+Enciclopedia (LearnHub).
- ✅ Logica/DB server-side. ✅ Anti-copia (right-click/selezione/copia/F12).
- ✅ Pagina legale (LegalPage). 🔲 Rifinire T&C vendita, Privacy, Cookie, Copyright completi.

## 9. E-Commerce Shop + Academy ("Coming Soon")
- ✅ Shop & Academy "In arrivo": pagina Shop (raggiungibile da Home, data-testid shop-page) con catalogo panettoni + corsi (Academy), badge "In arrivo", modulo lista d'attesa email (salvata in shop_waitlist). Toggle ON/OFF da AdminPanel (admin-shop-toggle): OFF=In arrivo+waitlist, ON=pulsanti Prenota/Iscriviti. Immagini reali (unsplash/pexels).
- 🔲 Carrello/checkout reale, schede prodotto complete (nutrizionale/peso netto), video corsi riservati — FASE 5 con pagamenti.

## OWNER / Admin
- ✅ Email proprietario SEMPRE admin (vede tutto): OWNER_EMAILS = {michelecip918@gmail.com, admin@mikilab.de}, promozione automatica in current_user ad ogni login.

## 10. Pagamenti (PayPal)
- 🧊 PayPal all'account **michelecip918@gmail.com** (accredito diretto). BLOCCATO: account PayPal sospeso alcuni giorni.
- Modello concordato: pagamento singolo a tempo (€9,99=30gg, €99=1 anno) via PayPal REST Orders.
- Carta di credito: gestita in sicurezza da STRIPE (cliente inserisce la carta nel checkout Stripe; MAI chiedere il numero carta all'utente). Stripe già in test; per incassi reali va "claimato" l'account.

---
## ORDINE DI LAVORO PROPOSTO (a fasi, senza credenziali per Fase 1)
- **FASE 1 ✅ COMPLETATA (2026-06)**: rename globale "Maestro"→"Il Tuo Laboratorio" (tranne chat AI); Home con didascalie (Pro + Principianti); anteprima "Guarda cosa fa" nel paywall; Principianti sotto paywall; 2 ricette DEMO sbloccate. Test: backend 100% (iteration_22), frontend fix bug didascalia Ricette.
- **FASE 2 (dati ricette)**: doppia nomenclatura (nome reale), correzione catena del freddo per tipologia (sfoglie 2-4°C, panettoni 24-28°C, misti).
- **FASE 3 (automazioni lab)**: miglioratore 0,3% auto, smistamento celle non ridondante, notifica email soglia freezer.
- **FASE 4**: PayPal (a sblocco account) + eventuale lingua EN.
- **FASE 5**: E-commerce Shop + Academy "Coming Soon".
