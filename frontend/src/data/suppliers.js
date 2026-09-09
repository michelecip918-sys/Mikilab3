// Directory fornitori di panificazione — Germania, Italia e grandi aziende di ingredienti.
// email: se nota si può usare per l'ordine via mailto; altrimenti l'utente la inserisce a mano.
export const SUPPLIERS = [
  // --- Germania / cooperative e distributori ---
  {
    id: "mike", name: "BÄKO", flag: "🇩🇪", country: "de", category: "distributore",
    web: "https://www.mike.de", email: "",
    it: "Cooperativa d'acquisto dei panettieri e pasticceri in Germania e Austria: materie prime, farine, ingredienti e attrezzature. È il fornitore più usato dai forni tedeschi (BÄKO Süd, West, ecc.).",
    de: "Einkaufsgenossenschaft der Bäcker und Konditoren in Deutschland und Österreich: Rohstoffe, Mehle, Zutaten und Ausstattung. Der meistgenutzte Lieferant deutscher Bäckereien (BÄKO Süd, West usw.).",
    en: "Purchasing cooperative of bakers and pastry chefs in Germany and Austria: raw materials, flours, ingredients and equipment. The most-used supplier for German bakeries (BÄKO Süd, West, etc.).",
  },
  {
    id: "ireks", name: "IREKS", flag: "🇩🇪", country: "de", category: "ingredienti",
    web: "https://www.ireks.com", email: "",
    it: "Storica azienda tedesca di Kulmbach: malto, miscele per pane, miglioratori e lievito madre essiccato. Qualità professionale per artigiani.",
    de: "Traditionsunternehmen aus Kulmbach: Malz, Brotbackmischungen, Backmittel und Trocken-Sauerteig. Profiqualität für Handwerksbäcker.",
    en: "Historic German company from Kulmbach: malt, bread mixes, improvers and dried sourdough. Professional quality for artisans.",
  },
  {
    id: "uniferm", name: "UNIFERM", flag: "🇩🇪", country: "de", category: "lieviti",
    web: "https://www.uniferm.de", email: "",
    it: "Specialista tedesco di lieviti, prefermenti liquidi e Sauerteig pronti, oltre a ingredienti funzionali per la panificazione.",
    de: "Deutscher Spezialist für Hefe, flüssige Vorteige, fertige Sauerteige und funktionelle Backzutaten.",
    en: "German specialist in yeast, liquid preferments and ready-made sourdough, plus functional baking ingredients.",
  },
  {
    id: "backaldrin", name: "backaldrin (Kornspitz)", flag: "🇦🇹", country: "de", category: "ingredienti",
    web: "https://www.backaldrin.com", email: "",
    it: "Azienda austriaca famosa per il Kornspitz: miscele, semole speciali e miglioratori naturali.",
    de: "Österreichisches Unternehmen, bekannt für Kornspitz: Backmischungen, Spezialschrote und natürliche Backmittel.",
    en: "Austrian company famous for Kornspitz: mixes, special meals and natural improvers.",
  },
  {
    id: "boecker", name: "Ernst Böcker", flag: "🇩🇪", country: "de", category: "lievito madre",
    web: "https://www.sauerteig.de", email: "",
    it: "Il riferimento tedesco per il Sauerteig (lievito madre di segale e grano): colture vive e starter professionali.",
    de: "Die deutsche Referenz für Sauerteig (Roggen- und Weizensauer): lebende Kulturen und Profi-Starter.",
    en: "The German reference for Sauerteig (rye and wheat sourdough): live cultures and professional starters.",
  },
  {
    id: "martinbraun", name: "Martin Braun", flag: "🇩🇪", country: "de", category: "ingredienti",
    web: "https://www.martinbraun.de", email: "",
    it: "Gruppo Oetker: creme, farciture, miscele e miglioratori per panificazione e pasticceria.",
    de: "Oetker-Gruppe: Cremes, Füllungen, Backmischungen und Backmittel für Bäckerei und Konditorei.",
    en: "Oetker Group: creams, fillings, mixes and improvers for bakery and pastry.",
  },

  // --- Internazionali (grandi aziende di ingredienti) ---
  {
    id: "puratos", name: "Puratos", flag: "🇧🇪", country: "both", category: "ingredienti",
    web: "https://www.puratos.com", email: "",
    it: "Multinazionale belga presente in Italia e Germania: ingredienti per panificazione, pasticceria e cioccolato, lieviti madre (Sapore) e miglioratori.",
    de: "Belgischer Multi mit Standorten in Italien und Deutschland: Zutaten für Backwaren, Konditorei und Schokolade, Sauerteige (Sapore) und Backmittel.",
    en: "Belgian multinational present in Italy and Germany: ingredients for baking, pastry and chocolate, sourdoughs (Sapore) and improvers.",
  },
  {
    id: "lesaffre", name: "Lesaffre", flag: "🇫🇷", country: "both", category: "lieviti",
    web: "https://www.lesaffre.com", email: "",
    it: "Leader mondiale del lievito e della fermentazione (Saf-Instant, Fermentis, Lievital in Italia). Lievito di birra e lieviti madre.",
    de: "Weltmarktführer für Hefe und Fermentation (Saf-Instant, Fermentis). Backhefe und Sauerteige.",
    en: "World leader in yeast and fermentation (Saf-Instant, Fermentis, Lievital in Italy). Baker's yeast and sourdoughs.",
  },
  {
    id: "zeelandia", name: "Zeelandia", flag: "🇳🇱", country: "both", category: "ingredienti",
    web: "https://www.zeelandia.com", email: "",
    it: "Gruppo olandese con filiali in Italia e Germania: miscele, miglioratori, farciture e prefermenti.",
    de: "Niederländische Gruppe mit Niederlassungen in Italien und Deutschland: Mischungen, Backmittel, Füllungen und Vorteige.",
    en: "Dutch group with branches in Italy and Germany: mixes, improvers, fillings and preferments.",
  },
  {
    id: "bakels", name: "Bakels", flag: "🇨🇭", country: "both", category: "ingredienti",
    web: "https://www.bakels.com", email: "",
    it: "Gruppo svizzero internazionale: ingredienti e miscele per pane, panettone e pasticceria.",
    de: "Internationale Schweizer Gruppe: Zutaten und Mischungen für Brot, Panettone und Konditorei.",
    en: "International Swiss group: ingredients and mixes for bread, panettone and pastry.",
  },
  {
    id: "irca", name: "IRCA", flag: "🇮🇹", country: "both", category: "ingredienti",
    web: "https://www.ircagroup.com", email: "",
    it: "Azienda italiana di ingredienti per pasticceria e panificazione: coperture, farciture, lieviti madre e basi per panettone.",
    de: "Italienisches Unternehmen für Konditorei- und Backzutaten: Überzüge, Füllungen, Sauerteige und Panettone-Basen.",
    en: "Italian company for pastry and baking ingredients: coatings, fillings, sourdoughs and panettone bases.",
  },

  // --- Italia / mulini e ingredienti ---
  {
    id: "dallagiovanna", name: "Molino Dallagiovanna", flag: "🇮🇹", country: "it", category: "farine",
    web: "https://www.dallagiovanna.it", email: "",
    it: "Mulino piacentino noto per le farine da grandi lievitati (panettone) e la macinazione ad acqua. Molto amato dagli artigiani.",
    de: "Mühle aus Piacenza, bekannt für Mehle für große Hefegebäcke (Panettone). Bei Handwerkern sehr beliebt.",
    en: "Mill from Piacenza known for flours for large leavened cakes (panettone) and water milling. Much loved by artisans.",
  },
  {
    id: "petra", name: "Molino Quaglia — Petra", flag: "🇮🇹", country: "it", category: "farine",
    web: "https://www.petra.it", email: "",
    it: "Farine Petra macinate a pietra, con W dichiarato: ottime per alta idratazione e lunghe lievitazioni.",
    de: "Petra-Mehle, steingemahlen, mit angegebenem W-Wert: ideal für hohe Hydratation und lange Gärung.",
    en: "Petra stone-ground flours with a declared W value: great for high hydration and long fermentations.",
  },
  {
    id: "mulinomarino", name: "Mulino Marino", flag: "🇮🇹", country: "it", category: "farine",
    web: "https://www.mulinomarino.it", email: "",
    it: "Farine biologiche macinate a pietra in Piemonte: grani antichi, farro (Dinkel), segale. Perfette per il metodo di Michele.",
    de: "Bio-Steinmehle aus dem Piemont: alte Getreidesorten, Dinkel, Roggen. Perfekt für Micheles Methode.",
    en: "Organic stone-ground flours from Piedmont: ancient grains, spelt (Dinkel), rye. Perfect for Michele's method.",
  },
  {
    id: "caputo", name: "Mulino Caputo", flag: "🇮🇹", country: "it", category: "farine",
    web: "https://www.mulinocaputo.it", email: "",
    it: "Mulino napoletano celebre per le farine da pizza e pane; gamma professionale ampia.",
    de: "Neapolitanische Mühle, berühmt für Pizza- und Brotmehle; breites Profisortiment.",
    en: "Neapolitan mill famous for pizza and bread flours; wide professional range.",
  },
  {
    id: "molinograssi", name: "Molino Grassi", flag: "🇮🇹", country: "it", category: "farine",
    web: "https://www.molinograssi.it", email: "",
    it: "Mulino di Parma: farine biologiche e di grano duro (semola rimacinata) per pani del Sud.",
    de: "Mühle aus Parma: Bio-Mehle und Hartweizenmehl (semola rimacinata) für süditalienische Brote.",
    en: "Mill from Parma: organic flours and durum wheat (re-milled semolina) for southern Italian breads.",
  },
  {
    id: "molinospadoni", name: "Molino Spadoni", flag: "🇮🇹", country: "it", category: "farine",
    web: "https://www.molinospadoni.it", email: "",
    it: "Ampia gamma di farine e preparati per pane e pizza, disponibili anche per l'artigiano.",
    de: "Breites Sortiment an Mehlen und Backmischungen für Brot und Pizza, auch für Handwerksbetriebe.",
    en: "Wide range of flours and mixes for bread and pizza, also available for the artisan.",
  },
  {
    id: "molinopasini", name: "Molino Pasini", flag: "🇮🇹", country: "it", category: "farine",
    web: "https://www.molinopasini.com", email: "",
    it: "Mulino mantovano: farine tecniche per pane, pizza e grandi lievitati, con W e P/L dichiarati.",
    de: "Mühle aus Mantua: technische Mehle für Brot, Pizza und große Hefegebäcke, mit W- und P/L-Wert.",
    en: "Mill from Mantua: technical flours for bread, pizza and large leavened cakes, with declared W and P/L values.",
  },
  {
    id: "le5stagioni", name: "Le 5 Stagioni (Agugiaro & Figna)", flag: "🇮🇹", country: "it", category: "farine",
    web: "https://www.le5stagioni.it", email: "",
    it: "Farine professionali molto diffuse tra panificatori e pizzaioli; gamma ampia per ogni idratazione.",
    de: "Bei Bäckern und Pizzabäckern weit verbreitete Profimehle; breites Sortiment für jede Hydratation.",
    en: "Professional flours widely used by bakers and pizza makers; a wide range for any hydration.",
  },
  // --- Germania / mulini di farina ---
  {
    id: "spielberger", name: "Spielberger Mühle", flag: "🇩🇪", country: "de", category: "farine",
    web: "https://www.spielberger.de", email: "",
    it: "Mulino biologico tedesco specializzato in farro (Dinkel), grani antichi e segale a pietra: ideale per il metodo di Michele.",
    de: "Deutsche Bio-Mühle, spezialisiert auf Dinkel, alte Getreidesorten und steingemahlenen Roggen: ideal für Micheles Methode.",
    en: "German organic mill specialising in spelt (Dinkel), ancient grains and stone-ground rye: ideal for Michele's method.",
  },
  {
    id: "goodmills", name: "GoodMills / Aurora", flag: "🇩🇪", country: "de", category: "farine",
    web: "https://www.goodmills.de", email: "",
    it: "Grande gruppo molitorio tedesco (Aurora, Rosenmehl): farine convenzionali e speciali per il fornaio.",
    de: "Großer deutscher Mühlenkonzern (Aurora, Rosenmehl): konventionelle und Spezialmehle für den Bäcker.",
    en: "Large German milling group (Aurora, Rosenmehl): conventional and special flours for the baker.",
  },
  {
    id: "draxmuehle", name: "Drax-Mühle", flag: "🇩🇪", country: "de", category: "farine",
    web: "https://www.draxmuehle.de", email: "",
    it: "Mulino biologico bavarese: farine di grano, farro e segale da agricoltura biologica.",
    de: "Bayerische Bio-Mühle: Weizen-, Dinkel- und Roggenmehle aus biologischem Anbau.",
    en: "Bavarian organic mill: wheat, spelt and rye flours from organic farming.",
  },
  {
    id: "agrimontana", name: "Agrimontana", flag: "🇮🇹", country: "it", category: "canditi",
    web: "https://www.agrimontana.it", email: "",
    it: "Canditi e frutta di alta qualità (arancia, cedro, marron glacé): fondamentali per un buon panettone.",
    de: "Kandierte Früchte höchster Qualität (Orange, Zitronat, Marron Glacé): unverzichtbar für guten Panettone.",
    en: "High-quality candied fruit (orange, citron, marron glacé): essential for a good panettone.",
  },
  {
    id: "fabbri", name: "Fabbri 1905", flag: "🇮🇹", country: "it", category: "canditi",
    web: "https://www.fabbri1905.com", email: "",
    it: "Amarena, canditi, paste aromatiche e sospensioni per grandi lievitati e pasticceria.",
    de: "Amarena, kandierte Früchte, Aromapasten und Einlagen für große Hefegebäcke und Konditorei.",
    en: "Amarena cherries, candied fruit, flavour pastes and inclusions for large leavened cakes and pastry.",
  },
  {
    id: "pariani", name: "Pariani", flag: "🇮🇹", country: "it", category: "frutta secca",
    web: "https://www.pariani.it", email: "",
    it: "Frutta secca in purezza: pistacchio, nocciola, mandorla in pasta e granella per farciture e sospensioni.",
    de: "Reine Nussprodukte: Pistazie, Haselnuss, Mandel als Paste und Granulat für Füllungen und Einlagen.",
    en: "Pure nut products: pistachio, hazelnut, almond as paste and grains for fillings and inclusions.",
  },
];

export const SUPPLIER_CATEGORIES = {
  it: { distributore: "Distributore", ingredienti: "Ingredienti", lieviti: "Lieviti", "lievito madre": "Lievito madre", farine: "Farine", canditi: "Canditi & frutta", "frutta secca": "Frutta secca" },
  de: { distributore: "Großhändler", ingredienti: "Zutaten", lieviti: "Hefe", "lievito madre": "Sauerteig", farine: "Mehle", canditi: "Kandiertes & Obst", "frutta secca": "Nüsse" },
  en: { distributore: "Distributor", ingredienti: "Ingredients", lieviti: "Yeast", "lievito madre": "Sourdough", farine: "Flours", canditi: "Candied & fruit", "frutta secca": "Nuts" },
};
