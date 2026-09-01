// Le 21 innovazioni MikiLab (motore proattivo DEMO/SIMULATO).
// Ogni modulo gira "sempre attivo in sottofondo": quando una soglia simulata
// viene superata, l'avatar (persona) interviene a voce. I valori sono SIMULATI.
// persona: "lab" (Mickey Lab, operativo) | "momi" (tutor didattico).
// Campi testo: [IT, DE, EN, ES].

export const PROACTIVE_MODULES = [
  { id: "digital_touch", persona: "lab",
    name: ["Tatto Digitale", "Digitaler Tastsinn", "Digital Touch", "Tacto Digital"],
    msg: ["Maglia glutinica quasi pronta: ancora un minuto di impasto e poi fermati.", "Glutennetz fast fertig: noch eine Minute kneten, dann stoppen.", "Gluten network almost ready: one more minute of mixing, then stop.", "Red de gluten casi lista: un minuto más de amasado y para."] },
  { id: "climate_timer", persona: "lab",
    name: ["Timer Clima-Dinamico", "Klima-Timer", "Climate-Dynamic Timer", "Timer Clima-Dinámico"],
    msg: ["Umidità in calo: allungo la puntata di dieci minuti.", "Feuchtigkeit sinkt: Stockgare um zehn Minuten verlängert.", "Humidity dropping: extending bulk by ten minutes.", "Humedad bajando: alargo la fermentación diez minutos."] },
  { id: "digital_nose", persona: "lab",
    name: ["Il Naso Digitale", "Die Digitale Nase", "The Digital Nose", "La Nariz Digital"],
    msg: ["CO2 al picco: l'impasto è al punto giusto di maturazione.", "CO2 am Peak: der Teig ist optimal reif.", "CO2 at peak: dough is at the right maturation point.", "CO2 en el pico: la masa está en su punto."] },
  { id: "water_id", persona: "momi",
    name: ["Carta d'Identità dell'Acqua", "Wasser-Ausweis", "Water ID Card", "DNI del Agua"],
    msg: ["Acqua un po' dura: riduci il sale dello 0,2 percento per bilanciare il lievito.", "Wasser etwas hart: Salz um 0,2 Prozent reduzieren.", "Water a bit hard: lower salt by 0.2 percent to balance the yeast.", "Agua algo dura: baja la sal 0,2 por ciento."] },
  { id: "bio_pace", persona: "lab",
    name: ["Ritmo Bio-Pace", "Bio-Pace Rhythmus", "Bio-Pace Rhythm", "Ritmo Bio-Pace"],
    msg: ["Stai andando veloce: anticipo la cella di lievitazione per non farti aspettare.", "Du bist schnell: Gärkammer vorgezogen.", "You're going fast: bringing the proofing cell forward.", "Vas rápido: adelanto la cámara de fermentación."] },
  { id: "flour_fingerprint", persona: "lab",
    name: ["Impronta della Farina", "Mehl-Fingerabdruck", "Flour Fingerprint", "Huella de la Harina"],
    msg: ["Questo lotto di farina assorbe di più: aggiungi venti grammi d'acqua.", "Diese Mehlcharge saugt mehr: zwanzig Gramm Wasser zugeben.", "This flour batch absorbs more: add twenty grams of water.", "Este lote de harina absorbe más: añade veinte gramos de agua."] },
  { id: "thermal_dough", persona: "lab",
    name: ["Impasto Termico Predizionale", "Thermische Teigvorhersage", "Predictive Thermal Dough", "Masa Térmica Predictiva"],
    msg: ["Vasca a 26 gradi: aggiungi centoventi grammi di ghiaccio e rallenta l'impastatrice.", "Kessel bei 26 Grad: hundertzwanzig Gramm Eis zugeben und Kneter drosseln.", "Bowl at 26 degrees: add a hundred and twenty grams of ice and slow the mixer.", "Cuba a 26 grados: añade ciento veinte gramos de hielo y baja la amasadora."] },
  { id: "bake_twin", persona: "lab",
    name: ["Gemello di Cottura Infrarossi", "Infrarot-Back-Zwilling", "Infrared Baking Twin", "Gemelo de Cocción Infrarrojo"],
    msg: ["Reazione di Maillard al punto: mancano tre minuti allo sfornato perfetto.", "Maillard am Punkt: noch drei Minuten bis perfekt.", "Maillard on point: three minutes to the perfect bake.", "Maillard en su punto: faltan tres minutos."] },
  { id: "multi_vat_radar", persona: "lab",
    name: ["Radar Multi-Vasca", "Multi-Kessel-Radar", "Multi-Vat Radar", "Radar Multi-Cuba"],
    msg: ["Attenzione: la vasca due è ferma da cinque minuti, controlla l'impasto.", "Achtung: Kessel zwei steht seit fünf Minuten.", "Warning: vat two has been idle for five minutes.", "Atención: la cuba dos lleva cinco minutos parada."] },
  { id: "sourdough_microbiome", persona: "momi",
    name: ["Microbioma del Lievito Madre", "Sauerteig-Mikrobiom", "Sourdough Microbiome", "Microbioma de la Masa Madre"],
    msg: ["Il lievito madre è più acetico del solito: rinfrescalo a tre a uno per ammorbidire il gusto.", "Sauerteig essigsaurer als sonst: 3:1 auffrischen.", "Sourdough more acetic than usual: refresh three to one to soften the flavor.", "Masa madre más acética: refresca tres a uno."] },
  { id: "ar_shaping", persona: "momi",
    name: ["Guida AR Taglio & Formatura", "AR-Führung Schnitt & Formen", "AR Cutting & Shaping Guide", "Guía AR Corte y Formado"],
    msg: ["Per questa pezzatura fai tre pieghe a portafoglio, ti mostro le linee sullo schermo.", "Für diese Größe drei Falten, Linien am Bildschirm.", "For this size do three letter folds, I'll show the lines on screen.", "Para este tamaño haz tres pliegues, te muestro las líneas."] },
  { id: "crumb_scanner", persona: "momi",
    name: ["Scanner Alveolatura", "Krumen-Scanner", "Crumb Scanner", "Escáner de Miga"],
    msg: ["Alveolatura regolare e ben sviluppata: ottima idratazione, complimenti.", "Porung schön gleichmäßig: super Hydration.", "Crumb even and well developed: great hydration, well done.", "Miga regular y desarrollada: gran hidratación."] },
  { id: "eco_thermal", persona: "lab",
    name: ["Eco-Thermal Twin", "Öko-Thermal-Zwilling", "Eco-Thermal Twin", "Gemelo Eco-Térmico"],
    msg: ["Inforna il pane scuro subito dopo il chiaro: risparmi energia sfruttando il calore residuo.", "Dunkles Brot direkt nach hellem backen: Restwärme spart Energie.", "Bake the dark loaves right after the light ones: use residual heat to save energy.", "Hornea el pan oscuro tras el claro: aprovecha el calor residual."] },
  { id: "crispness_guard", persona: "lab",
    name: ["Acoustic Crispness Guard", "Akustischer Krustenwächter", "Acoustic Crispness Guard", "Guardián Acústico de Corteza"],
    msg: ["La crosta canta: sgranatura perfetta, puoi sfornare.", "Die Kruste singt: perfekte Rösche.", "The crust sings: perfect crispness, you can pull it out.", "La corteza canta: crujiente perfecto."] },
  { id: "flour_dust", persona: "momi",
    name: ["Monitor Particolato Farina", "Mehlstaub-Monitor", "Flour Dust Monitor", "Monitor de Polvo de Harina"],
    msg: ["Farina in sospensione elevata: apri un attimo o metti la mascherina, per la tua salute.", "Viel Mehlstaub in der Luft: kurz lüften oder Maske tragen.", "High flour dust in the air: open up briefly or wear a mask, for your health.", "Mucho polvo de harina: ventila o usa mascarilla."] },
  { id: "neural_memory", persona: "momi",
    name: ["Neural Dough Memory", "Neuronales Teig-Gedächtnis", "Neural Dough Memory", "Memoria Neuronal de Masa"],
    msg: ["Questo impasto è identico a quello perfetto di martedì scorso: ho salvato i parametri.", "Dieser Teig gleicht dem perfekten vom letzten Dienstag: Parameter gespeichert.", "This dough matches last Tuesday's perfect one: I saved the parameters.", "Esta masa es idéntica a la perfecta del martes: guardé los parámetros."] },
  { id: "crumb_vibration", persona: "lab",
    name: ["Acoustic Crumb Vibration", "Krumen-Vibration", "Acoustic Crumb Vibration", "Vibración Acústica de Miga"],
    msg: ["Mollica ben umida al tocco: cottura riuscita, lascia raffreddare su griglia.", "Krume schön feucht: gelungen, auf Gitter auskühlen.", "Crumb nicely moist to the touch: good bake, cool on a rack.", "Miga húmeda al tacto: buena cocción, enfría en rejilla."] },
  { id: "microclimate_twin", persona: "lab",
    name: ["Micro-Clima Cella Twin", "Mikroklima-Zwilling", "Micro-Climate Fermentation Twin", "Gemelo Microclima Cámara"],
    msg: ["La cella è più calda in alto: ruota le teglie, sposta quelle basse in cima.", "Kammer oben wärmer: Bleche drehen, untere nach oben.", "Cell is warmer at the top: rotate the trays, move the low ones up.", "La cámara está más caliente arriba: rota las bandejas."] },
  { id: "auto_scaling", persona: "lab",
    name: ["Predictive Auto-Scaling", "Predictive Auto-Scaling", "Predictive Auto-Scaling", "Auto-Escalado Predictivo"],
    msg: ["Hai messo cinquanta grammi di sale in più: aggiungo due chili di farina e ribilancio, ecco le dosi.", "Fünfzig Gramm Salz zu viel: zwei Kilo Mehl zugeben, neu ausbalanciert.", "You added fifty grams too much salt: adding two kilos of flour and rebalancing, here are the doses.", "Añadiste cincuenta gramos de sal de más: sumo dos kilos de harina y reequilibro."] },
  { id: "blackbox", persona: "lab",
    name: ["Emergency Safety Net & Blackbox", "Notfall-Blackbox", "Emergency Safety Net & Blackbox", "Red de Seguridad y Caja Negra"],
    msg: ["C'è stato uno sbalzo di corrente: ho ripristinato timer e stato dell'impasto, non hai perso nulla.", "Stromausfall erkannt: Timer und Teigzustand wiederhergestellt.", "There was a power glitch: I restored the timers and dough state, you lost nothing.", "Hubo un corte de luz: restauré temporizadores y estado de la masa."] },
  { id: "voice_sync", persona: "lab",
    name: ["Master-to-Apprentice Voice Sync", "Meister-Lehrling Sprach-Sync", "Master-to-Apprentice Voice Sync", "Sincronía de Voz Maestro-Aprendiz"],
    msg: ["Passo la formatura all'apprendista in cuffia: tu resta all'impastatrice, coordino io.", "Formen an den Lehrling per Headset: du bleibst am Kneter.", "Handing shaping to the apprentice on the headset: you stay at the mixer, I'll coordinate.", "Paso el formado al aprendiz por el auricular: tú quédate en la amasadora."] },
];

export const moduleName = (m, lang) => {
  const i = lang === "de" ? 1 : lang === "en" ? 2 : lang === "es" ? 3 : 0;
  return m.name[i] || m.name[0];
};
export const moduleMsg = (m, lang) => {
  const i = lang === "de" ? 1 : lang === "en" ? 2 : lang === "es" ? 3 : 0;
  return m.msg[i] || m.msg[0];
};
