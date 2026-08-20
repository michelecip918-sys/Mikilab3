# Mikilab — ROADMAP (richiesta utente giu 2026)

Legenda: [FATTO] già presente · [PARZIALE] esiste ma da estendere · [NUOVO] da fare

## 1. UI/UX
- [FATTO/IN CORSO] Header: orologio non deve sovrapporsi a logo/testo → aggiunta foto Michele accanto al logo + sottotitolo nascosto sotto 400px.
- [NUOVO] Uniformare stile pulsanti lingua IT/DE (coerenti e visibili).
- [PARZIALE] Home Hero: mettere in evidenza Chi sono / Il mio metodo / Lavorare in serenità / Cosa fa (già presenti come card espandibili → renderle "hero" in alto).
- [PARZIALE] Home: collegamenti rapidi (Ricette, Impara, News, Maestro, Diagnosi) con testo "Clicca per aprire".
- [NUOVO] Galleria: in Home solo alcune foto selezionate; foto ricette SOLO nei Panettoni; togliere foto standard dalle altre ricette.
- [NUOVO] Etichette esplicite/stato per icone microfono e radio (attivo/inattivo).

## 2. Maestro / Capo Laboratorio
- [PARZIALE] Config attrezzature: scelta impastatrice (spirale/1 braccio/tuffanti), celle lievitazione/frigo/lievitatori (CapoLaboratorio esiste → estendere).
- [PARZIALE] Riconoscimento forni: elettrico/gas/olio + foto (AdattaForno + vision esistono → calibrare per tipo cottura).
- [PARZIALE] Piano settimanale con turni+mansioni+foto; automazione turni (WeeklyPlan + ShiftRoles esistono → integrare).
- [FATTO] Checklist giornaliere (Checklists).
- [FATTO] Produzione inversa (BackwardScheduler) → [NUOVO] estendere ai rinfreschi multipli per tipo fermento (LM/Sourdough/Poolish/Biga).
- [FATTO] Lista spesa automatica (kg/g).
- [PARZIALE] Food cost (costing esiste → calcolo prezzo materie prime + costo totale ricetta).
- [PARZIALE] Sonda Bluetooth impasto: salvataggio + notifica giorno dopo per adattare lievitazione (logica temp esiste → estendere notifiche).

## 3. Ricette e Prodotti
- [NUOVO] Rinominare prodotti (es. Baguette di Farro → "Diguette").
- [NUOVO] Convertire TUTTE le ricette in Percentuale del Panificatore (Baker's %).
- [PARZIALE] Nomenclatura fermenti: "lievito madre" → tipo specifico (es. Lievito madre di segale/Sourdough).
- [NUOVO] Malto come miglioratore naturale con % corrette.
- [NUOVO] Panettoni Metodo 50/50 (farine 50/50, miele a fine impasto, uova maggiorate nel 2° impasto).
- [NUOVO] Regola pH prefermento dopo 18h.
- [NUOVO] Metodo "Mille Bolle" su tutti i panettoni.
- [NUOVO] Ricetta Panettone alla Canapa (icona foglia canapa).
- [NUOVO] Ricette Wurzel e Gretze rivisitate (metodo trasformale).
- [NUOVO] Schede prefermenti: LM, Sourdough, Poolish, Cookstock (uso dettagliato).

## 4. IA / Scansione / Diagnostica
- [FATTO] Scansiona ricetta (foto → DB).
- [FATTO] Diagnosi guasti macchine (foto pannello → problema + soluzione).
- [PARZIALE] Comandi vocali avanzati: "Vai alle ricette", "Accendi radio", ricerca web ricette adattate al Metodo Mikilab (VoiceAssistant esiste → estendere ricerca web + adattamento).

## 5. Contenuti / News / Enciclopedia
- [PARZIALE] Enciclopedia dell'Arte Bianca nel menu (Encyclopedia esiste in Diagnosi → valutare voce dedicata).
- [NUOVO] Guide passo-passo metodi di Michele + gestione forno.
- [NUOVO] Restyling News con titoli/articoli aggiornati settimanalmente.
- [NUOVO] Gamification: battuta simpatica a fondo pagina + ampliare Quiz del Panetto.

## In sospeso (chiavi/decisioni)
- Reset password: manca API key Resend (dominio noreply@mikilab.de scelto).
- Redesign colori IT/DE audace: blueprint pronto in design_guidelines.json.
