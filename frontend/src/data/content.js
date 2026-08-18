// Contenuti statici curati bilingue (IT/DE) per "Il Maestro sa tutto"

export const content = {
  it: {
    promptSuggestions: [
      "Come correggo un impasto troppo idratato e appiccicoso?",
      "Quale farina tedesca corrisponde alla Tipo 00 o Tipo 1 italiana?",
      "Come capisco quando il pane in appretto è pronto da infornare?",
      "Come rinfresco il lievito madre prima di un grande impasto?",
    ],
    encyclopedia: [
      { title: "Farine tedesche per panificatori italiani", body: "A Stoccarda trovi la classificazione tedesca 'Type'. Corrispondenze utili: Type 405 ≈ 00, Type 550 ≈ 0, Type 812 ≈ 1, Type 1050 ≈ 2. Per il farro cerca 'Dinkelmehl' (Type 630 fine, 1050 semi-integrale)." },
      { title: "La scienza dell'autolisi", body: "Mescolando solo farina e acqua e lasciando riposare 30–60 minuti, gli enzimi iniziano a sviluppare il glutine. Il risultato è un impasto più estensibile e una migliore alveolatura." },
      { title: "Acido lattico vs acido acetico", body: "Lievito madre tenuto in caldo e idratato → più acido lattico (note dolci). Tenuto in freddo e più solido → più acido acetico (note pungenti). Regola temperatura e idratazione per gestire l'acidità." },
      { title: "Idratazione: cosa cambia", body: "Più acqua = mollica più aperta ma impasto più difficile. Per iniziare resta tra 70–75% con farine medie; sali all'80%+ solo con farine forti (W300+)." },
    ],
    news: [
      { region: "stoccarda", highlight: true, tag: "Stoccarda", title: "Farine bio macinate a pietra nell'area di Stoccarda", body: "Cresce l'offerta di mulini regionali con Dinkel (farro) Type 630 e 1050: ottimo per pani rustici e panettoni a lievitazione naturale." },
      { region: "stoccarda", highlight: true, tag: "Stoccarda", title: "Stagione fredda: allunga i tempi in cucina", body: "Con 18–20°C in casa la lievitazione rallenta. Alza la temperatura dell'acqua e tieni l'impasto vicino ai 24–25°C." },
      { region: "germania", tag: "Germania", title: "Il Dinkel torna protagonista nei forni tedeschi", body: "In tutta la Germania cresce la richiesta di Dinkelbrot: la farina di farro assorbe più acqua, parti con +3–5% di idratazione." },
      { region: "germania", tag: "Germania", title: "Sauerteig-Kultur: scambi di lievito madre", body: "Community di panificatori in tutta la Germania organizzano scambi di pasta madre e grani antichi." },
      { region: "italia", tag: "Italia", title: "Panettone artigianale: la stagione del grande lievitato", body: "In Italia fervono gli allenamenti col lievito madre per il panettone: rinfreschi regolari e temperatura costante sono la chiave." },
      { region: "italia", tag: "Italia", title: "Grani antichi e farine di filiera", body: "Aumentano in Italia le farine di grani antichi macinate a pietra: più sapore, ma serve gestire idratazione e forza." },
    ],
    youtubeVideos: [
      { title: "Impasto e prefermento: la partenza (sponge)", category: "Tecnica Impasto", url: "https://www.youtube.com/embed/SCmgZw4QXE4" },
      { title: "Cottura e taglio del grande lievitato", category: "Cottura & Finitura", url: "https://www.youtube.com/embed/C_7Xft7HRVQ" },
    ],
    freeCourses: [
      { title: "Panettone artigianale: metodo professionale", category: "Panettone", source: "Eater · Martesana Milano", level: "Professionale", url: "https://www.youtube.com/embed/nwCiW_BH3lU", isNew: true },
      { title: "Lievito madre: gestione e rinfreschi", category: "Lievito madre", source: "Ricette di Caterina", level: "Professionale", url: "https://www.youtube.com/embed/eN6BnMnfRUE", isNew: true },
      { title: "Focaccia Genovese con biga: crosta croccante e alveoli", category: "Focacce", source: "Chef Billy Parisi", level: "Professionale", url: "https://www.youtube.com/embed/nyu15TqG038", isNew: false },
      { title: "Pasta madre da zero, senza additivi", category: "Lievito madre", source: "Bread Ritual", level: "Professionale", url: "https://www.youtube.com/embed/GSJmK9IU4tQ", isNew: false },
    ],
    lievitoMadre: {
      intro: "Il lievito madre è il cuore del mio lavoro. Qui spiego tutto: cos'è, la differenza tra solido, Li.Co.Li e Sauerteig, cos'è l'autolisi e come gestisco io la mia pasta madre giorno per giorno.",
      sections: [
        { title: "Cos'è il lievito madre", body: "È un impasto di farina e acqua fermentato spontaneamente da lieviti selvatici e batteri lattici. Dà spinta naturale, aroma, digeribilità e lunga conservazione. Il lievito madre SOLIDO è a bassa idratazione (~45-50%), stabile e con profumo dolce/mielato." },
        { title: "Cos'è il Li.Co.Li", body: "Li.Co.Li = Lievito in Coltura Liquida: pasta madre ad alta idratazione (100%, cioè pari peso di farina e acqua). È più comodo da gestire (si mescola, non si impasta), fermenta più in fretta e dà note leggermente più acide. Ottimo per pani quotidiani; per i grandi lievitati preferisco il solido." },
        { title: "Sauerteig e lievito madre", body: "In Germania il 'Sauerteig' è spesso di segale, più acido e usato per pani scuri. Il 'lievito madre' italiano è di solito di grano tenero, più dolce, ideale per panettone e pani chiari. Uso entrambi: Sauerteig per i pani rustici tedeschi, lievito madre per i grandi lievitati." },
        { title: "L'autolisi", body: "L'autolisi è il riposo di soli farina e acqua (senza lievito e sale) per 30-60 minuti prima di impastare. Gli enzimi iniziano a sviluppare il glutine da soli: l'impasto diventa più estensibile, si lavora meglio e migliora l'alveolatura. Con i grani integrali e il Dinkel aiuta molto l'assorbimento dell'acqua." },
        { title: "La mia gestione (Millebolle 50-50)", body: "Ogni giorno: bagnetto del lievito madre 15 min in acqua a 31°C. Primo rinfresco: 100 g lievito madre + 200 g farina, idratazione ~35%, riposo ~4 ore fino a pH 4,2-4,3. Dopo il primo rinfresco conservo una parte per il giorno dopo. Rinfresco successivo a 16-24°C per 18-24 ore al 45% quando serve per i grandi lievitati. Controllo sempre il pH: è la mia bussola per capire se la pasta madre è in forza." },
      ],
    },
  },
  de: {
    promptSuggestions: [
      "Wie korrigiere ich einen zu nassen, klebrigen Teig?",
      "Welches deutsche Mehl entspricht dem italienischen Tipo 00 oder Tipo 1?",
      "Woran erkenne ich, dass das Brot gar zum Backen bereit ist?",
      "Wie frische ich den Sauerteig vor einem großen Teig auf?",
    ],
    encyclopedia: [
      { title: "Deutsche Mehle für italienische Bäcker", body: "In Stuttgart gilt die 'Type'-Klassifizierung. Nützliche Entsprechungen: Type 405 ≈ 00, Type 550 ≈ 0, Type 812 ≈ 1, Type 1050 ≈ 2. Für Dinkel: 'Dinkelmehl' (Type 630 fein, 1050 halbvoll)." },
      { title: "Die Wissenschaft der Autolyse", body: "Mischt man nur Mehl und Wasser und lässt 30–60 Minuten ruhen, entwickeln Enzyme das Gluten. Ergebnis: ein dehnbarerer Teig und eine bessere Porung." },
      { title: "Milchsäure vs. Essigsäure", body: "Sauerteig warm und weich geführt → mehr Milchsäure (milde Noten). Kühl und fest geführt → mehr Essigsäure (kräftige Noten). Steuere Temperatur und Hydration, um die Säure zu regeln." },
      { title: "Hydration: was sich ändert", body: "Mehr Wasser = offenere Krume, aber schwerer zu handhaben. Für den Anfang 70–75% mit mittleren Mehlen; über 80% nur mit starken Mehlen (W300+)." },
    ],
    news: [
      { region: "stoccarda", highlight: true, tag: "Stuttgart", title: "Steingemahlene Bio-Mehle im Raum Stuttgart", body: "Immer mehr regionale Mühlen bieten Dinkel Type 630 und 1050: ideal für rustikale Brote und Sauerteig-Panettone." },
      { region: "stoccarda", highlight: true, tag: "Stuttgart", title: "Kalte Jahreszeit: mehr Zeit einplanen", body: "Bei 18–20°C verlangsamt sich die Gare. Erhöhe die Wassertemperatur und halte den Teig bei 24–25°C." },
      { region: "germania", tag: "Deutschland", title: "Dinkel wieder im Trend in deutschen Backstuben", body: "Bundesweit steigt die Nachfrage nach Dinkelbrot: Dinkelmehl bindet mehr Wasser, starte mit +3–5% Hydration." },
      { region: "germania", tag: "Deutschland", title: "Sauerteig-Kultur: Anstellgut-Tausch", body: "Bäcker-Communities in ganz Deutschland organisieren Tausch von Anstellgut und alten Getreidesorten." },
      { region: "italia", tag: "Italien", title: "Handwerks-Panettone: die Saison des großen Hefegebäcks", body: "In Italien läuft das Training mit Sauerteig für Panettone: regelmäßige Auffrischungen und konstante Temperatur sind entscheidend." },
      { region: "italia", tag: "Italien", title: "Alte Getreidesorten und regionale Mehle", body: "In Italien nehmen steingemahlene Mehle aus alten Sorten zu: mehr Geschmack, aber Hydration und Kraft müssen gesteuert werden." },
    ],
    youtubeVideos: [
      { title: "Teig & Vorteig: der Start (Sponge)", category: "Teigtechnik", url: "https://www.youtube.com/embed/SCmgZw4QXE4" },
      { title: "Backen & Anschnitt großer Hefegebäcke", category: "Backen & Finish", url: "https://www.youtube.com/embed/C_7Xft7HRVQ" },
    ],
    freeCourses: [
      { title: "Handwerklicher Panettone: professionelle Methode", category: "Panettone", source: "Eater · Martesana Milano", level: "Professionell", url: "https://www.youtube.com/embed/nwCiW_BH3lU", isNew: true },
      { title: "Sauerteig führen und auffrischen", category: "Sauerteig", source: "Ricette di Caterina", level: "Professionell", url: "https://www.youtube.com/embed/eN6BnMnfRUE", isNew: true },
      { title: "Focaccia Genovese mit Biga: knusprig & luftig", category: "Focaccia", source: "Chef Billy Parisi", level: "Professionell", url: "https://www.youtube.com/embed/nyu15TqG038", isNew: false },
      { title: "Sauerteig von Grund auf, ohne Zusätze", category: "Sauerteig", source: "Bread Ritual", level: "Professionell", url: "https://www.youtube.com/embed/GSJmK9IU4tQ", isNew: false },
    ],
    lievitoMadre: {
      intro: "Der Sauerteig / lievito madre ist das Herz meiner Arbeit. Hier erkläre ich alles: was er ist, der Unterschied zwischen festem Sauerteig, Li.Co.Li und deutschem Sauerteig, was Autolyse ist und wie ich meinen Sauerteig Tag für Tag führe.",
      sections: [
        { title: "Was ist lievito madre", body: "Ein Teig aus Mehl und Wasser, spontan fermentiert von wilden Hefen und Milchsäurebakterien. Er gibt natürlichen Trieb, Aroma, Bekömmlichkeit und lange Haltbarkeit. Der FESTE lievito madre hat niedrige Hydration (~45-50%), ist stabil und riecht mild/honigartig." },
        { title: "Was ist Li.Co.Li", body: "Li.Co.Li = flüssig geführter Sauerteig mit hoher Hydration (100%, also gleich viel Mehl und Wasser). Er ist bequemer (man rührt, statt zu kneten), fermentiert schneller und ist etwas säuerlicher. Ideal für Alltagsbrote; für große Hefegebäcke bevorzuge ich den festen." },
        { title: "Sauerteig und lievito madre", body: "In Deutschland ist 'Sauerteig' oft aus Roggen, säuerlicher, für dunkle Brote. Der italienische 'lievito madre' ist meist aus Weizen, milder, ideal für Panettone und helle Brote. Ich nutze beide: Sauerteig für rustikale deutsche Brote, lievito madre für große Hefegebäcke." },
        { title: "Die Autolyse", body: "Autolyse ist das Ruhen von nur Mehl und Wasser (ohne Hefe und Salz) für 30-60 Minuten vor dem Kneten. Die Enzyme entwickeln das Gluten von selbst: der Teig wird dehnbarer, lässt sich besser verarbeiten und die Porung verbessert sich. Bei Vollkorn und Dinkel hilft es der Wasseraufnahme sehr." },
        { title: "Meine Führung (Millebolle 50-50)", body: "Täglich: Sauerteig-Bad 15 Min in Wasser bei 31°C. Erste Auffrischung: 100 g Sauerteig + 200 g Mehl, Hydration ~35%, ~4 Std Ruhe bis pH 4,2-4,3. Danach bewahre ich einen Teil für den nächsten Tag auf. Weitere Auffrischung bei 16-24°C für 18-24 Std mit 45%, wenn ich große Hefegebäcke brauche. Ich messe immer den pH: er ist mein Kompass für die Kraft des Sauerteigs." },
      ],
    },
  },
};

// Incrementa questo numero ogni volta che aggiungi/aggiorni corsi:
// serve a far scattare la notifica "nuovi corsi" all'utente.
export const COURSES_VERSION = 1;
