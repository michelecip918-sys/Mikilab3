// 4 Macro-Hub del Laboratorio. Gli id sono quelli REALI degli strumenti (routing invariato via onOpenTool).
// I nomi/icone vengono da TOOLS (PianoProduzioneAI). Gli hub/tool con pro:true sono nascosti in modalità "Passione".

export const LAB_HUBS = [
  {
    id: "scienza", emoji: "🧮", pro: false,
    it: "Calcolatori & Scienza", de: "Rechner & Wissenschaft", en: "Calculators & Science", es: "Calculadoras y Ciencia", fr: "Calculateurs & Science", fa: "ماشین‌حساب و علم",
    ids: ["metodo", "acqua", "convlievito", "stampi", "sequenze", "sosimpasto", "bluetooth"],
  },
  {
    id: "produzione", emoji: "⏱️", pro: false,
    it: "Controllo Produzione & Fermentazione", de: "Produktion & Gärung", en: "Production & Fermentation", es: "Producción y Fermentación", fr: "Production & Fermentation", fa: "کنترل تولید و تخمیر",
    ids: ["settimana", "fermentazione", "twin", "weatherbaker", "timelapse", "bilancia", "pesata", "manisporche", "timer", "ph", "bancalievito", "diagnosi", "suono"],
  },
  {
    id: "forni", emoji: "🍞", pro: true,
    it: "Gestione Forni & Attrezzature", de: "Öfen & Ausrüstung", en: "Ovens & Equipment", es: "Hornos y Equipos", fr: "Fours & Équipements", fa: "مدیریت فر و تجهیزات",
    ids: ["macchine", "simforno", "adatta", "capo", "energia"],
  },
  {
    id: "business", emoji: "📊", pro: true,
    it: "Business, Marketing & HACCP", de: "Business, Marketing & HACCP", en: "Business, Marketing & HACCP", es: "Negocio, Marketing y HACCP", fr: "Business, Marketing & HACCP", fa: "کسب‌وکار، بازاریابی و HACCP",
    ids: ["foodcost", "freezer", "shelf", "esuberozero", "spreco", "check", "sessioni", "recupero", "mydata"],
  },
];

// Strumenti Pro-only anche fuori dal Laboratorio (menu, ecc.): B2B / HACCP / complessi.
export const PRO_ONLY_TOOLS = new Set([
  "macchine", "simforno", "adatta", "capo", "energia",
  "foodcost", "freezer", "shelf", "esuberozero", "spreco", "check", "sessioni", "mydata",
  "turni", "salespoints", "spesa", "lotti", "inversa", "enterprise", "notte",
]);

export const isPassion = (profile) => profile === "passion";
export const toolAllowed = (id, profile) => (isPassion(profile) ? !PRO_ONLY_TOOLS.has(id) : true);
