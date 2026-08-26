// Spiegazioni brevi di Mohammadreza per ogni strumento del Laboratorio (IT/DE/EN).
export const TOOL_GUIDE = {
  settimana: { it: "Organizza la produzione dei 7 giorni: cosa impastare e quanto, giorno per giorno.", de: "Plane die Produktion für 7 Tage: was und wie viel, Tag für Tag.", en: "Plan 7 days of production: what to mix and how much, day by day." },
  inversa: { it: "Calcola a ritroso gli orari d'inizio partendo dall'ora di sforno.", de: "Rechnet die Startzeiten rückwärts ab der Backzeit aus.", en: "Works out start times backwards from the baking time." },
  spesa: { it: "Genera la lista della spesa con farine e ingredienti dalle tue ricette. 📄 la lista viene GENERATA nel piano.", de: "Erstellt die Einkaufsliste aus deinen Rezepten. 📄 wird im Plan ERZEUGT.", en: "Builds the shopping list from your recipes. 📄 GENERATED in the plan." },
  foodcost: { it: "Calcola costo di produzione, prezzo consigliato e margine. 📄 i numeri vengono GENERATI nel piano.", de: "Berechnet Kosten, empfohlenen Preis und Marge. 📄 wird im Plan ERZEUGT.", en: "Computes cost, suggested price and margin. 📄 GENERATED in the plan." },
  turni: { it: "Assegna turni e ruoli al team: chi fa cosa e quando. 💾 i turni restano salvati.", de: "Weist dem Team Schichten und Rollen zu. 💾 bleiben gespeichert.", en: "Assigns shifts and roles to the team. 💾 shifts stay saved." },
  freezer: { it: "Tieni sotto controllo le giacenze in cella e freezer; dopo il piano le aggiorno da solo. 💾 le giacenze restano salvate.", de: "Behalte Kühl-/Gefrierbestände im Blick; nach dem Plan aktualisiere ich sie. 💾 bleiben gespeichert.", en: "Keeps track of fridge/freezer stock; I update it after the plan. 💾 stock stays saved." },
  twin: { it: "Il gemello digitale dell'impasto: simula idratazione e comportamento.", de: "Der digitale Teig-Zwilling: simuliert Hydratation und Verhalten.", en: "The dough's digital twin: simulates hydration and behaviour." },
  adatta: { it: "Adatta tempi e temperatura del forno al tuo modello.", de: "Passt Backzeit und -temperatur an deinen Ofen an.", en: "Adapts oven time and temperature to your model." },
  bilancia: { it: "Bilancia smart: scala le dosi mantenendo le percentuali.", de: "Smarte Waage: skaliert die Mengen und hält die Prozente.", en: "Smart scale: scales quantities keeping the percentages." },
  termo: { it: "Termostato & clima: controlla temperatura e umidità del laboratorio.", de: "Thermostat & Klima: steuert Temperatur und Feuchte im Labor.", en: "Thermostat & climate: controls lab temperature and humidity." },
  acqua: { it: "Calcola la temperatura dell'acqua per centrare la temperatura finale dell'impasto.", de: "Berechnet die Wassertemperatur für die richtige Teigtemperatur.", en: "Calculates water temperature to hit the target dough temperature." },
  pesata: { it: "Pesata guidata passo-passo per non sbagliare le dosi.", de: "Geführtes Wiegen Schritt für Schritt, ohne Fehler bei den Mengen.", en: "Step-by-step guided weighing so you never miss a quantity." },
  timer: { it: "Timer multipli per pieghe, lievitazioni e cotture.", de: "Mehrere Timer für Falten, Gare und Backen.", en: "Multiple timers for folds, proofs and bakes." },
  meteo: { it: "Meteo locale: aiuta a regolare acqua e tempi in base al clima.", de: "Lokales Wetter: hilft, Wasser und Zeiten ans Klima anzupassen.", en: "Local weather: helps adjust water and timings to the climate." },
  ph: { it: "Registra il pH del lievito madre per tenerlo in forma.", de: "Erfasst den pH des Sauerteigs, um ihn fit zu halten.", en: "Logs your sourdough pH to keep it in shape." },
  diagnosi: { it: "Diagnosi da foto: analizza crosta e alveolatura del tuo pane.", de: "Foto-Diagnose: analysiert Kruste und Porung deines Brotes.", en: "Photo diagnosis: analyses your bread's crust and crumb." },
  suono: { it: "Diagnosi dal suono: valuta la cottura dal 'canto' della crosta.", de: "Klang-Diagnose: beurteilt die Backung am 'Singen' der Kruste.", en: "Sound diagnosis: judges the bake from the crust's 'song'." },
  sessioni: { it: "Diario impasti: salva sessioni, note e risultati nel tempo.", de: "Teig-Tagebuch: speichert Sessions, Notizen und Ergebnisse.", en: "Dough log: saves sessions, notes and results over time." },
  lotti: { it: "Tracciabilità lotti con QR: risali a ingredienti e date.", de: "Chargenrückverfolgung mit QR: Zutaten und Daten nachvollziehen.", en: "Batch traceability with QR: trace ingredients and dates." },
  haccp: { it: "Registro HACCP: temperature, pulizie e controlli a norma.", de: "HACCP-Register: Temperaturen, Reinigung und Kontrollen normgerecht.", en: "HACCP log: temperatures, cleaning and compliant checks." },
  check: { it: "Checklist di apertura e chiusura del laboratorio.", de: "Checklisten für das Öffnen und Schließen des Labors.", en: "Opening and closing checklists for the lab." },
  shelf: { it: "Shelf-life: stima la durata e la scadenza dei prodotti.", de: "Shelf-Life: schätzt Haltbarkeit und Ablaufdatum.", en: "Shelf-life: estimates product durability and best-before." },
  spreco: { it: "Anti-spreco: recupera invenduto e riduci gli scarti.", de: "Anti-Verschwendung: verwertet Unverkauftes und reduziert Abfall.", en: "Anti-waste: recover unsold goods and cut waste." },
  mydata: { it: "I tuoi dati salvati: piani, ricette, documenti e storico delle chat. 💾 solo consultazione.", de: "Deine gespeicherten Daten: Pläne, Rezepte, Dokumente und Chat-Verlauf. 💾 nur Ansicht.", en: "Your saved data: plans, recipes, documents and chat history. 💾 view only." },

  // ---- Interruttori "Scegli anche": accendono un pezzo del PIANO IA ----
  celle: { it: "Interruttore: fa usare all'IA le tue celle e impastatrici nel piano (portate, destinazioni). Tocca la «i» → «Apri strumento» per inserirle. 💾 i dati restano salvati.", de: "Schalter: die KI nutzt deine Kammern und Kneter im Plan. Tippe „i“ → „Werkzeug öffnen“, um sie einzugeben. 💾 Daten bleiben gespeichert.", en: "Switch: lets the AI use your cells and mixers in the plan. Tap the 'i' → 'Open tool' to enter them. 💾 data stays saved." },
  orari: { it: "Interruttore: fa calcolare gli orari d'inizio a ritroso dall'ora di sforno. 📄 gli orari vengono GENERATI dentro il piano.", de: "Schalter: berechnet die Startzeiten rückwärts ab dem Ausbacken. 📄 die Zeiten werden im Plan ERZEUGT.", en: "Switch: computes start times backwards from the baking time. 📄 the times are GENERATED inside the plan." },
  clima: { it: "Interruttore: adatta acqua e tempi alla temperatura del tuo laboratorio. Inserisci i gradi qui sotto. (calcolo automatico nel piano)", de: "Schalter: passt Wasser und Zeiten an die Labortemperatur an. Gib die Grad unten ein. (automatische Berechnung im Plan)", en: "Switch: adapts water and timings to your lab temperature. Enter the degrees below. (auto-calculated in the plan)" },
  punti: { it: "Interruttore: divide la produzione tra i tuoi punti vendita. Tocca la «i» → «Apri strumento» per gestirli. 💾 i punti restano salvati.", de: "Schalter: verteilt die Produktion auf deine Verkaufspunkte. Tippe „i“ → „Werkzeug öffnen“. 💾 bleiben gespeichert.", en: "Switch: splits production across your sales points. Tap the 'i' → 'Open tool' to manage them. 💾 points stay saved." },
  antispreco: { it: "Interruttore: aggiunge al piano consigli anti-spreco (recupero invenduto, riuso impasti).", de: "Schalter: fügt dem Plan Anti-Verschwendungs-Tipps hinzu.", en: "Switch: adds anti-waste tips to the plan." },
};

export const guideFor = (id, lang) => {
  const g = TOOL_GUIDE[id];
  if (!g) return "";
  return lang === "de" ? g.de : lang === "en" ? g.en : g.it;
};
