// Spiegazioni brevi di Mohammadreza per ogni strumento del Laboratorio (IT/DE/EN).
export const TOOL_GUIDE = {
  settimana: { it: "Organizza la produzione dei 7 giorni: cosa impastare e quanto, giorno per giorno.", de: "Plane die Produktion für 7 Tage: was und wie viel, Tag für Tag.", en: "Plan 7 days of production: what to mix and how much, day by day." },
  inversa: { it: "Calcola a ritroso gli orari d'inizio partendo dall'ora di sforno.", de: "Rechnet die Startzeiten rückwärts ab der Backzeit aus.", en: "Works out start times backwards from the baking time." },
  spesa: { it: "Genera la lista della spesa con farine e ingredienti dalle tue ricette.", de: "Erstellt die Einkaufsliste mit Mehlen und Zutaten aus deinen Rezepten.", en: "Builds the shopping list with flours and ingredients from your recipes." },
  foodcost: { it: "Calcola il costo di produzione e il prezzo di vendita consigliato.", de: "Berechnet die Produktionskosten und den empfohlenen Verkaufspreis.", en: "Computes production cost and suggested selling price." },
  turni: { it: "Assegna turni e ruoli al team: chi fa cosa e quando.", de: "Weist dem Team Schichten und Rollen zu: wer macht was und wann.", en: "Assigns shifts and roles to the team: who does what and when." },
  freezer: { it: "Tieni sotto controllo le giacenze in cella e freezer.", de: "Behalte die Bestände in Kühl- und Gefrierzelle im Blick.", en: "Keeps track of your fridge and freezer stock." },
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
};

export const guideFor = (id, lang) => {
  const g = TOOL_GUIDE[id];
  if (!g) return "";
  return lang === "de" ? g.de : lang === "en" ? g.en : g.it;
};
