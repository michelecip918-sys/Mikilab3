// Il "Miglioratore Naturale" di Michele: miscela a secco. Fonte unica dei numeri (pagina, scheda e sostituzioni).
// V122 — 8 ingredienti su 100 g: malto 15, grano germogliato 25, lievito madre essiccato 15, lino 15, avena 13,
// lupino 8, psillio 7, acerola 2. Uso: 2% sulla farina (indiretti), 3% (diretti) → malto 0,3-0,45% sulla farina.
export const MIX = [
  { key: "malt", g: 15,
    name: { it: "Malto diastatico in polvere", de: "Diastatisches Malzpulver (Backmalz, enzymaktiv)", en: "Diastatic malt powder" },
    fn: { it: "nutre i lieviti, dà colore e croccantezza alla crosta", de: "nährt die Hefen, gibt der Kruste Farbe und Knusprigkeit", en: "feeds the yeasts, gives the crust colour and crispness" } },
  { key: "sprout", g: 25, home: true,
    name: { it: "Farina di grano germogliato (fatta in casa)", de: "Mehl aus gekeimtem Weizen (selbst gemacht)", en: "Sprouted wheat flour (homemade)" },
    fn: { it: "enzimi delicati, come un malto fatto da te: profumo, colore e mollica tenera", de: "sanfte Enzyme wie ein selbst gemachtes Malz: Duft, Farbe und zarte Krume", en: "gentle enzymes, like a homemade malt: aroma, colour and a tender crumb" } },
  { key: "starter", g: 15, home: true,
    name: { it: "Lievito madre essiccato (il tuo)", de: "Getrockneter Sauerteig (dein eigener)", en: "Dried sourdough starter (your own)" },
    fn: { it: "dà aroma e profondità, anche ai pani con il lievito di birra", de: "gibt Aroma und Tiefe, auch Broten mit Hefe", en: "adds aroma and depth, even to breads made with yeast" } },
  { key: "flax", g: 15,
    name: { it: "Farina di lino dorato", de: "Goldleinsamenmehl", en: "Golden flax flour" },
    fn: { it: "dà struttura, fibre e grassi buoni (omega)", de: "gibt Struktur, Ballaststoffe und gute Fette (Omega)", en: "adds structure, fibre and good fats (omega)" } },
  { key: "oat", g: 13,
    name: { it: "Crusca d'avena fine", de: "Feine Haferkleie", en: "Fine oat bran" },
    fn: { it: "trattiene l'acqua: la mollica resta morbida più a lungo; ricca di fibre", de: "hält Wasser: die Krume bleibt länger weich; reich an Ballaststoffen", en: "holds water: the crumb stays soft longer; rich in fibre" } },
  { key: "lupin", g: 8,
    name: { it: "Farina di lupino dolce", de: "Süßlupinenmehl", en: "Sweet lupin flour" },
    fn: { it: "rinforza la maglia del glutine e la tenuta dell'impasto", de: "stärkt das Glutennetz und die Teigstabilität", en: "strengthens the gluten network and dough hold" } },
  { key: "psyl", g: 7,
    name: { it: "Buccia di psillio", de: "Flohsamenschalen", en: "Psyllium husk" },
    fn: { it: "trattiene l'acqua: il pane resta morbido più a lungo", de: "hält die Feuchtigkeit: das Brot bleibt länger weich", en: "holds water: bread stays soft longer" } },
  { key: "acer", g: 2,
    name: { it: "Acerola in polvere (vitamina C naturale)", de: "Acerola-Pulver (natürliches Vitamin C)", en: "Acerola powder (natural vitamin C)" },
    fn: { it: "rinforza il glutine e aiuta la spinta in forno", de: "stärkt das Gluten und hilft dem Ofentrieb", en: "strengthens gluten and helps oven spring" } },
];

// V122 — i due ingredienti fatti in casa, passo per passo (IT/DE/EN).
export const HOMEMADE = [
  { key: "sprout",
    title: { it: "Farina di grano germogliato", de: "Mehl aus gekeimtem Weizen", en: "Sprouted wheat flour" },
    steps: [
      { it: "Lava 200 g di chicchi di grano tenero e lasciali in ammollo in acqua fresca per 8-12 ore.", de: "200 g Weichweizenkörner waschen und 8-12 Stunden in frischem Wasser einweichen.", en: "Rinse 200 g of soft wheat berries and soak them in fresh water for 8-12 hours." },
      { it: "Scola e lascia i chicchi in un colino coperto da un panno, a temperatura ambiente. Sciacquali due volte al giorno.", de: "Abgießen und die Körner in einem mit einem Tuch bedeckten Sieb bei Raumtemperatur lassen. Zweimal am Tag spülen.", en: "Drain and leave the berries in a sieve covered with a cloth, at room temperature. Rinse them twice a day." },
      { it: "Dopo 1-2 giorni, quando il germoglio è lungo quanto il chicco, fermati.", de: "Nach 1-2 Tagen, wenn der Keim so lang wie das Korn ist, aufhören.", en: "After 1-2 days, when the sprout is as long as the berry, stop." },
      { it: "Stendi i chicchi su una teglia e seccali nel forno ventilato a 40-45 °C, con lo sportello socchiuso, finché sono duri e secchi (8-12 ore). Mai sopra i 50 °C: gli enzimi muoiono.", de: "Die Körner auf einem Blech ausbreiten und im Umluftofen bei 40-45 °C mit leicht geöffneter Tür trocknen, bis sie hart und trocken sind (8-12 Stunden). Nie über 50 °C: sonst sterben die Enzyme.", en: "Spread the berries on a tray and dry them in a fan oven at 40-45 °C with the door ajar until hard and dry (8-12 hours). Never above 50 °C: the enzymes die." },
      { it: "Macina fine (mulino o macinacaffè) e setaccia. Conserva in un barattolo chiuso. Se senti odore cattivo o vedi muffa, butta via e ricomincia.", de: "Fein mahlen (Mühle oder Kaffeemühle) und sieben. In einem verschlossenen Glas aufbewahren. Riecht es schlecht oder siehst du Schimmel: wegwerfen und neu anfangen.", en: "Grind finely (mill or coffee grinder) and sift. Keep in a closed jar. If it smells bad or you see mould, throw it away and start again." },
    ] },
  { key: "starter",
    title: { it: "Lievito madre essiccato", de: "Getrockneter Sauerteig", en: "Dried sourdough starter" },
    steps: [
      { it: "Prendi 100 g del tuo lievito madre maturo, al suo picco.", de: "100 g deines reifen Sauerteigs auf seinem Höhepunkt nehmen.", en: "Take 100 g of your mature starter, at its peak." },
      { it: "Stendilo in un velo sottilissimo su carta forno.", de: "Hauchdünn auf Backpapier ausstreichen.", en: "Spread it in a very thin layer on baking paper." },
      { it: "Lascialo seccare all'aria in un posto asciutto per 1-2 giorni, oppure in forno a 35-40 °C con lo sportello socchiuso.", de: "1-2 Tage an einem trockenen Ort an der Luft trocknen lassen, oder im Ofen bei 35-40 °C mit leicht geöffneter Tür.", en: "Let it air-dry in a dry place for 1-2 days, or in the oven at 35-40 °C with the door ajar." },
      { it: "Quando si spezza come vetro, sbriciolalo e macinalo fine. Conserva in un barattolo chiuso, all'asciutto.", de: "Wenn er wie Glas bricht, zerbröseln und fein mahlen. In einem verschlossenen Glas trocken aufbewahren.", en: "When it snaps like glass, crumble it and grind it finely. Keep in a closed jar, somewhere dry." },
      { it: "Nella miscela serve per l'aroma, non per far lievitare: il lievito della ricetta resta lo stesso.", de: "In der Mischung dient er dem Aroma, nicht dem Trieb: die Hefe im Rezept bleibt gleich.", en: "In the mix it is there for aroma, not for rising: the recipe's yeast stays the same." },
    ] },
];
export const DOSE = { indirect: 2, direct: 3 }; // % sulla farina

export const fmt = (x) => (x >= 10 ? String(Math.round(x)) : String(Math.round(x * 10) / 10).replace(".", ","));
export const fmtL = (x, lang) => (lang === "it" ? fmt(x) : fmt(x).replace(",", "."));

// Alternative se non puoi/vuoi fare la miscela. `flour` = grammi di farina della ricetta.
export function substitutes(flour) {
  const F = Number(flour) || 500;
  const g = (p) => Math.max(0.5, Math.round(F * p * 10) / 10);
  return [
    { id: "malt",
      title: { it: "Solo malto diastatico", de: "Nur diastatisches Malz", en: "Diastatic malt only" },
      amount: `${g(0.004)} g`,
      how: { it: `0,3-0,5% sulla farina (${g(0.003)}-${g(0.005)} g su ${F} g). È l'ingrediente che fa più differenza: colore, profumo e crosta. Deve essere DIASTATICO (attivo): se la mollica viene appiccicosa o la crosta troppo scura, riduci.`,
             de: `0,3-0,5 % auf das Mehl (${g(0.003)}-${g(0.005)} g auf ${F} g). Die Zutat mit dem größten Effekt: Farbe, Aroma und Kruste. Es muss DIASTATISCHES (aktives) Malz sein: wird die Krume klebrig oder die Kruste zu dunkel, weniger nehmen.`,
             en: `0.3-0.5% of the flour (${g(0.003)}-${g(0.005)} g on ${F} g). The ingredient that makes the biggest difference: colour, aroma and crust. It must be DIASTATIC (active) malt: if the crumb turns sticky or the crust too dark, use less.` } },
    { id: "potato",
      title: { it: "Fiocchi di patate", de: "Kartoffelflocken", en: "Potato flakes" },
      amount: `${g(0.04)} g`,
      how: { it: `3-5% sulla farina (${g(0.03)}-${g(0.05)} g su ${F} g), aggiunti a secco insieme alla farina. Tengono la mollica morbida più a lungo, come la patata lessa nella focaccia. Se l'impasto è duro aggiungi 1 cucchiaio d'acqua.`,
             de: `3-5 % auf das Mehl (${g(0.03)}-${g(0.05)} g auf ${F} g), trocken mit dem Mehl vermischt. Sie halten die Krume länger weich, wie gekochte Kartoffel in der Focaccia. Ist der Teig fest, 1 Esslöffel Wasser zugeben.`,
             en: `3-5% of the flour (${g(0.03)}-${g(0.05)} g on ${F} g), added dry with the flour. They keep the crumb soft longer, like boiled potato in focaccia. If the dough is stiff add 1 tablespoon of water.` } },
    { id: "bought",
      title: { it: "Miglioratore del commercio", de: "Backmittel aus dem Handel", en: "Store-bought improver" },
      amount: { it: "come da confezione", de: "laut Packung", en: "as on the pack" },
      how: { it: "Vanno bene i miglioratori in polvere per pane (Backmittel, «Brotbackmittel»). Usa la dose scritta sulla confezione (di solito 1-2% sulla farina) e controlla la lista degli ingredienti: quelli con malto e vitamina C sono i più simili al mio.",
             de: "Brot-Backmittel in Pulverform sind in Ordnung. Nimm die Menge von der Packung (meist 1-2 % auf das Mehl) und lies die Zutatenliste: Produkte mit Malz und Vitamin C kommen meinem am nächsten.",
             en: "Powdered bread improvers are fine. Use the dose on the pack (usually 1-2% of the flour) and read the ingredient list: those with malt and vitamin C are closest to mine." } },
    { id: "none",
      title: { it: "Ometterlo", de: "Weglassen", en: "Leave it out" },
      amount: { it: "0 g", de: "0 g", en: "0 g" },
      how: { it: "Il pane riesce lo stesso: la mollica sarà un po' meno morbida e la crosta un po' più chiara, e si conserva un giorno in meno. Per compensare puoi lasciare lievitare qualche minuto in più e aggiungere 1-2% di olio.",
             de: "Das Brot gelingt trotzdem: Die Krume wird etwas weniger weich, die Kruste etwas heller, und es hält einen Tag weniger. Zum Ausgleich etwas länger gehen lassen und 1-2 % Öl zugeben.",
             en: "The bread works anyway: the crumb will be a little less soft, the crust a little paler, and it keeps a day less. To compensate let it rise a few minutes longer and add 1-2% oil." } },
  ];
}
