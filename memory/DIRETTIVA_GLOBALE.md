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
- 🔲 Rimuovere regola generica "6h a 16°C" universale. Parametri per tipologia:
  - Sfoglie/Croissant: frigo 2-4°C (stabilizzazione burro, incasso, pieghe, formatura).
  - Grandi lievitati/Panettoni: 1ª e 2ª lievitazione 24-28°C, raffreddamento a testa in giù.
  - Lievitazione mista/indiretta: bighe, poolish, riposi dedicati.

## 5. Nomi ricette / Traduzioni / Lingue
- 🔲 Doppia nomenclatura: Nome fantasia + nome reale tra parentesi/sottotitolo (es. "Terra del Sole (Pane alle Patate)").
- 🔲 Italiano nativo per ricette/ingredienti/note. Selezionando altra lingua (DE/EN) tradurre interfaccia + nomi commerciali + nomi reali (es. Terra del Sole – Kartoffelbrot), mantenendo termini tecnici. NB: oggi solo IT/DE; EN = nuovo.

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

## 9. E-Commerce Shop + Academy ("Coming Soon") — FUTURO
- 🧊 Catalogo panettoni (pezzature, varianti, foto HD, allergeni/nutrizionale/peso netto), carrello.
- 🧊 "Academy / I Miei Corsi" (masterclass, consulenze) come sottosezione Shop.
- 🧊 Toggle "Coming Soon" da admin + raccolta email lista d'attesa; acquisto reale attivato da admin.

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
