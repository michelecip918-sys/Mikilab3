// Contenuti statici curati bilingue (IT/DE) per "Il Maestro sa tutto"
import { triFR, triFA } from "@/i18n/triMaps";

export const content = {
  it: {
    promptSuggestions: [
      "Come correggo un impasto troppo idratato e appiccicoso?",
      "Quale farina tedesca corrisponde alla Tipo 00 o Tipo 1 italiana?",
      "Come capisco quando il pane in appretto è pronto da infornare?",
      "Come rinfresco il lievito madre prima di un grande impasto?",
    ],
    encyclopedia: [
      { title: "Farine tedesche per panificatori italiani", body: "In Germania trovi la classificazione tedesca 'Type'. Corrispondenze utili: Type 405 ≈ 00, Type 550 ≈ 0, Type 812 ≈ 1, Type 1050 ≈ 2. Per il farro cerca 'Dinkelmehl' (Type 630 fine, 1050 semi-integrale)." },
      { title: "La scienza dell'autolisi", body: "Mescolando solo farina e acqua e lasciando riposare 30–60 minuti, gli enzimi iniziano a sviluppare il glutine. Il risultato è un impasto più estensibile e una migliore alveolatura." },
      { title: "Acido lattico vs acido acetico", body: "Lievito madre tenuto in caldo e idratato → più acido lattico (note dolci). Tenuto in freddo e più solido → più acido acetico (note pungenti). Regola temperatura e idratazione per gestire l'acidità." },
      { title: "Idratazione: cosa cambia", body: "Più acqua = mollica più aperta ma impasto più difficile. Per iniziare resta tra 70–75% con farine medie; sali all'80%+ solo con farine forti (W300+)." },
    ],
    news: [
      { region: "germania", highlight: true, tag: "Germania", title: "Farine bio macinate a pietra in Germania", body: "Cresce l'offerta di mulini regionali con Dinkel (farro) Type 630 e 1050: ottimo per pani rustici e panettoni a lievitazione naturale." },
      { region: "germania", highlight: true, tag: "Germania", title: "Stagione fredda: allunga i tempi in cucina", body: "Con 18–20°C in casa la lievitazione rallenta. Alza la temperatura dell'acqua e tieni l'impasto vicino ai 24–25°C." },
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
        { title: "I rinfreschi passo-passo", body: "Rinfrescare vuol dire dare da mangiare al lievito: si scarta una parte e si aggiunge farina e acqua fresche. Rapporto tipico 1:1:0,5 (100 g lievito + 100 g farina + 45-50 g acqua per il solido). Prima di un grande lievitato faccio 2-3 rinfreschi ravvicinati (ogni 3-4 ore) a 28°C: il lievito diventa dolce, gonfio e pronto." },
        { title: "Come capisco se è pronto", body: "È pronto quando raddoppia/triplica in 3-4 ore, profuma di yogurt e miele (non di aceto o solvente), e il taglio mostra un'alveolatura fitta e regolare. Trucco: un pezzetto messo in acqua deve galleggiare. Se è acido, lento o puzza, ha bisogno di più rinfreschi o è troppo caldo/freddo." },
        { title: "Temperatura e acqua", body: "La temperatura comanda tutto. 26-28°C = fermentazione dolce e veloce; sotto i 20°C rallenta e diventa più acida. Uso acqua a ~31°C per il bagnetto e regolo la temperatura dell'acqua d'impasto (vedi 'Clima e temperatura') per centrare la temperatura finale del lievito e dell'impasto." },
        { title: "Autolisi e lievito insieme", body: "Faccio spesso l'autolisi (solo farina + acqua, 30-60 min) PRIMA di aggiungere il lievito madre: la maglia glutinica parte da sola, l'impasto assorbe più acqua e resta estensibile. Poi incordo con il lievito e infine il sale. Con farro e integrali questo passaggio fa una grande differenza." },
        { title: "Problemi comuni e rimedi", body: "Troppo acido → rinfreschi più frequenti, temperatura più bassa, meno acqua. Lento/debole → rinfreschi ravvicinati a 28°C, farina più forte. Crosta secca sopra → coprire bene o conservare sotto acqua/bagnetto. Muffa → buttare e ripartire (non si recupera). Odore di acetone → è affamato: rinfrescalo subito." },
        { title: "Conservazione", body: "In frigo (4°C) dopo un rinfresco, ben chiuso: dura 5-7 giorni tra un rinfresco e l'altro. Per pause lunghe: essiccarlo in scaglie e conservarlo in barattolo, oppure legarlo stretto e tenerlo in acqua (metodo bagnetto). Prima di usarlo, riportalo in forza con 2-3 rinfreschi." },
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
      { title: "Deutsche Mehle für italienische Bäcker", body: "In Deutschland gilt die 'Type'-Klassifizierung. Nützliche Entsprechungen: Type 405 ≈ 00, Type 550 ≈ 0, Type 812 ≈ 1, Type 1050 ≈ 2. Für Dinkel: 'Dinkelmehl' (Type 630 fein, 1050 halbvoll)." },
      { title: "Die Wissenschaft der Autolyse", body: "Mischt man nur Mehl und Wasser und lässt 30–60 Minuten ruhen, entwickeln Enzyme das Gluten. Ergebnis: ein dehnbarerer Teig und eine bessere Porung." },
      { title: "Milchsäure vs. Essigsäure", body: "Sauerteig warm und weich geführt → mehr Milchsäure (milde Noten). Kühl und fest geführt → mehr Essigsäure (kräftige Noten). Steuere Temperatur und Hydration, um die Säure zu regeln." },
      { title: "Hydration: was sich ändert", body: "Mehr Wasser = offenere Krume, aber schwerer zu handhaben. Für den Anfang 70–75% mit mittleren Mehlen; über 80% nur mit starken Mehlen (W300+)." },
    ],
    news: [
      { region: "germania", highlight: true, tag: "Deutschland", title: "Steingemahlene Bio-Mehle in Deutschland", body: "Immer mehr regionale Mühlen bieten Dinkel Type 630 und 1050: ideal für rustikale Brote und Sauerteig-Panettone." },
      { region: "germania", highlight: true, tag: "Deutschland", title: "Kalte Jahreszeit: mehr Zeit einplanen", body: "Bei 18–20°C verlangsamt sich die Gare. Erhöhe die Wassertemperatur und halte den Teig bei 24–25°C." },
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
        { title: "Auffrischen Schritt für Schritt", body: "Auffrischen heißt füttern: einen Teil verwerfen und frisches Mehl und Wasser zugeben. Typisches Verhältnis 1:1:0,5 (100 g Sauerteig + 100 g Mehl + 45-50 g Wasser beim festen). Vor einem großen Hefegebäck mache ich 2-3 enge Auffrischungen (alle 3-4 Std) bei 28°C: der Sauerteig wird mild, luftig und bereit." },
        { title: "Woran ich erkenne, dass er reif ist", body: "Reif, wenn er sich in 3-4 Std verdoppelt/verdreifacht, nach Joghurt und Honig duftet (nicht nach Essig oder Lösungsmittel) und der Schnitt eine feine, gleichmäßige Porung zeigt. Trick: ein Stück im Wasser sollte schwimmen. Wenn er sauer, träge ist oder stinkt, braucht er mehr Auffrischungen oder ist zu warm/kalt." },
        { title: "Temperatur und Wasser", body: "Die Temperatur steuert alles. 26-28°C = milde, schnelle Gärung; unter 20°C wird er langsamer und saurer. Ich nutze Wasser mit ~31°C fürs Bad und stelle die Teigwassertemperatur ein (siehe 'Klima & Temperatur'), um die Endtemperatur von Sauerteig und Teig zu treffen." },
        { title: "Autolyse mit Sauerteig", body: "Ich mache oft Autolyse (nur Mehl + Wasser, 30-60 Min) VOR dem Sauerteig: das Gluten startet von selbst, der Teig nimmt mehr Wasser auf und bleibt dehnbar. Dann knete ich mit dem Sauerteig ein und zuletzt das Salz. Bei Dinkel und Vollkorn macht das einen großen Unterschied." },
        { title: "Häufige Probleme und Lösungen", body: "Zu sauer → häufiger auffrischen, kühler, weniger Wasser. Träge/schwach → enge Auffrischungen bei 28°C, stärkeres Mehl. Trockene Kruste oben → gut abdecken oder unter Wasser/Bad lagern. Schimmel → wegwerfen und neu starten. Acetongeruch → er ist hungrig: sofort auffrischen." },
        { title: "Aufbewahrung", body: "Im Kühlschrank (4°C) nach einer Auffrischung, gut verschlossen: 5-7 Tage zwischen den Auffrischungen. Für lange Pausen: in Flocken trocknen und im Glas aufbewahren, oder fest binden und in Wasser halten (Bad-Methode). Vor dem Gebrauch mit 2-3 Auffrischungen wieder in Kraft bringen." },
      ],
    },
  },
  en: {
    promptSuggestions: [
      "How do I fix a dough that is too wet and sticky?",
      "Which German flour matches Italian Tipo 00 or Tipo 1?",
      "How do I know when the proofed bread is ready to bake?",
      "How do I refresh my sourdough starter before a big dough?",
    ],
    encyclopedia: [
      { title: "German flours for Italian bakers", body: "In Germany the German 'Type' classification applies. Handy matches: Type 405 ≈ 00, Type 550 ≈ 0, Type 812 ≈ 1, Type 1050 ≈ 2. For spelt look for 'Dinkelmehl' (Type 630 fine, 1050 semi-wholemeal)." },
      { title: "The science of autolyse", body: "By mixing only flour and water and resting 30–60 minutes, enzymes start developing the gluten. The result is a more extensible dough and better crumb structure." },
      { title: "Lactic vs acetic acid", body: "Sourdough kept warm and hydrated → more lactic acid (mild notes). Kept cold and stiff → more acetic acid (sharp notes). Adjust temperature and hydration to manage acidity." },
      { title: "Hydration: what changes", body: "More water = a more open crumb but a harder dough. To start, stay between 70–75% with medium flours; go above 80% only with strong flours (W300+)." },
    ],
    news: [
      { region: "germania", highlight: true, tag: "Deutschland", title: "Stone-milled organic flours in Germany", body: "More regional mills now offer spelt (Dinkel) Type 630 and 1050: great for rustic breads and naturally-leavened panettone." },
      { region: "germania", highlight: true, tag: "Deutschland", title: "Cold season: allow more time", body: "At 18–20°C at home, proofing slows down. Raise the water temperature and keep the dough around 24–25°C." },
      { region: "germania", tag: "Germany", title: "Dinkel is trending again in German bakeries", body: "Across Germany the demand for Dinkelbrot is growing: spelt flour absorbs more water, start with +3–5% hydration." },
      { region: "germania", tag: "Germany", title: "Sauerteig culture: starter swaps", body: "Baker communities across Germany organise swaps of sourdough starter and ancient grains." },
      { region: "italia", tag: "Italy", title: "Artisan panettone: the big-leavened season", body: "In Italy, sourdough training for panettone is in full swing: regular refreshes and a steady temperature are key." },
      { region: "italia", tag: "Italy", title: "Ancient grains and short-supply-chain flours", body: "Stone-milled ancient-grain flours are on the rise in Italy: more flavour, but hydration and strength must be managed." },
    ],
    youtubeVideos: [
      { title: "Dough & preferment: the start (sponge)", category: "Dough technique", url: "https://www.youtube.com/embed/SCmgZw4QXE4" },
      { title: "Baking & scoring of big leavened cakes", category: "Baking & Finish", url: "https://www.youtube.com/embed/C_7Xft7HRVQ" },
    ],
    freeCourses: [
      { title: "Artisan panettone: the professional method", category: "Panettone", source: "Eater · Martesana Milano", level: "Professional", url: "https://www.youtube.com/embed/nwCiW_BH3lU", isNew: true },
      { title: "Sourdough starter: feeding and refreshing", category: "Sourdough", source: "Ricette di Caterina", level: "Professional", url: "https://www.youtube.com/embed/eN6BnMnfRUE", isNew: true },
      { title: "Focaccia Genovese with biga: crunchy crust and open crumb", category: "Focaccia", source: "Chef Billy Parisi", level: "Professional", url: "https://www.youtube.com/embed/nyu15TqG038", isNew: false },
      { title: "Sourdough starter from scratch, no additives", category: "Sourdough", source: "Bread Ritual", level: "Professional", url: "https://www.youtube.com/embed/GSJmK9IU4tQ", isNew: false },
    ],
    lievitoMadre: {
      intro: "The sourdough starter (lievito madre) is the heart of my work. Here I explain everything: what it is, the difference between stiff starter, Li.Co.Li and German Sauerteig, what autolyse is and how I manage my starter day by day.",
      sections: [
        { title: "What sourdough starter is", body: "It is a dough of flour and water spontaneously fermented by wild yeasts and lactic bacteria. It gives natural rise, aroma, digestibility and long shelf life. The STIFF starter has low hydration (~45-50%), is stable and smells sweet/honeyed." },
        { title: "What Li.Co.Li is", body: "Li.Co.Li = liquid-culture starter: a high-hydration starter (100%, i.e. equal weight of flour and water). It is easier to manage (you stir, not knead), ferments faster and gives slightly more acidic notes. Great for everyday breads; for big leavened cakes I prefer the stiff one." },
        { title: "Sauerteig and sourdough starter", body: "In Germany 'Sauerteig' is often rye-based, more acidic and used for dark breads. The Italian 'lievito madre' is usually wheat-based, milder, ideal for panettone and light breads. I use both: Sauerteig for rustic German breads, lievito madre for big leavened cakes." },
        { title: "Autolyse", body: "Autolyse is resting flour and water only (no yeast or salt) for 30-60 minutes before mixing. The enzymes start developing the gluten on their own: the dough becomes more extensible, easier to work and the crumb improves. With wholegrain and Dinkel it greatly helps water absorption." },
        { title: "My routine (Millebolle 50-50)", body: "Every day: bathe the starter 15 min in water at 31°C. First refresh: 100 g starter + 200 g flour, hydration ~35%, rest ~4 hours until pH 4.2-4.3. After the first refresh I keep a portion for the next day. A further refresh at 16-24°C for 18-24 hours at 45% when I need it for big leavened cakes. I always check the pH: it is my compass for the starter's strength." },
        { title: "Refreshing step by step", body: "Refreshing means feeding the starter: discard a portion and add fresh flour and water. Typical ratio 1:1:0.5 (100 g starter + 100 g flour + 45-50 g water for the stiff one). Before a big leavened cake I do 2-3 close refreshes (every 3-4 hours) at 28°C: the starter becomes sweet, puffy and ready." },
        { title: "How I know it is ready", body: "It is ready when it doubles/triples in 3-4 hours, smells of yoghurt and honey (not vinegar or solvent), and the cut shows a tight, even crumb. Trick: a small piece dropped in water should float. If it is sour, sluggish or smells bad, it needs more refreshes or is too warm/cold." },
        { title: "Temperature and water", body: "Temperature rules everything. 26-28°C = sweet, fast fermentation; below 20°C it slows down and turns more acidic. I use water at ~31°C for the bath and set the dough-water temperature (see 'Climate & temperature') to hit the final temperature of starter and dough." },
        { title: "Autolyse and starter together", body: "I often do autolyse (flour + water only, 30-60 min) BEFORE adding the starter: the gluten network starts on its own, the dough takes on more water and stays extensible. Then I develop it with the starter and finally the salt. With spelt and wholegrain this step makes a big difference." },
        { title: "Common problems and fixes", body: "Too acidic → more frequent refreshes, lower temperature, less water. Sluggish/weak → close refreshes at 28°C, stronger flour. Dry crust on top → cover well or store under water/bath. Mould → throw it away and start over (it cannot be saved). Acetone smell → it is hungry: refresh it right away." },
        { title: "Storage", body: "In the fridge (4°C) after a refresh, well sealed: it lasts 5-7 days between refreshes. For long breaks: dry it into flakes and keep it in a jar, or bind it tightly and keep it in water (bath method). Before using it, bring it back to strength with 2-3 refreshes." },
      ],
    },
  },

  es: {
    promptSuggestions: [
      "¿Cómo corrijo una masa demasiado húmeda y pegajosa?",
      "¿Qué harina alemana equivale a la Tipo 00 o Tipo 1 italiana?",
      "¿Cómo sé cuándo el pan fermentado está listo para hornear?",
      "¿Cómo refresco mi masa madre antes de una masa grande?",
    ],
    encyclopedia: [
      { title: "Harinas alemanas para panaderos italianos", body: "En Alemania se usa la clasificación por 'Type'. Equivalencias útiles: Type 405 ≈ 00, Type 550 ≈ 0, Type 812 ≈ 1, Type 1050 ≈ 2. Para la espelta busca 'Dinkelmehl' (Type 630 fina, 1050 semiintegral)." },
      { title: "La ciencia de la autólisis", body: "Mezclando solo harina y agua y dejando reposar 30–60 minutos, las enzimas empiezan a desarrollar el gluten. El resultado es una masa más extensible y una mejor estructura de la miga." },
      { title: "Ácido láctico vs acético", body: "Masa madre caliente e hidratada → más ácido láctico (notas suaves). Fría y dura → más ácido acético (notas intensas). Ajusta temperatura e hidratación para controlar la acidez." },
      { title: "Hidratación: qué cambia", body: "Más agua = miga más abierta pero masa más difícil. Para empezar, quédate entre 70–75% con harinas medias; supera el 80% solo con harinas fuertes (W300+)." },
    ],
    news: [
      { region: "germania", highlight: true, tag: "Deutschland", title: "Harinas ecológicas a la piedra en Alemania", body: "Cada vez más molinos regionales ofrecen espelta (Dinkel) Type 630 y 1050: ideales para panes rústicos y panettone de fermentación natural." },
      { region: "germania", highlight: true, tag: "Deutschland", title: "Temporada fría: da más tiempo", body: "A 18–20°C en casa la fermentación se ralentiza. Sube la temperatura del agua y mantén la masa en torno a 24–25°C." },
      { region: "germania", tag: "Germany", title: "La espelta vuelve a estar de moda en Alemania", body: "En toda Alemania crece la demanda de Dinkelbrot: la harina de espelta absorbe más agua, empieza con +3–5% de hidratación." },
      { region: "germania", tag: "Germany", title: "Cultura Sauerteig: intercambio de masas madre", body: "Las comunidades de panaderos de Alemania organizan intercambios de masa madre y granos antiguos." },
      { region: "italia", tag: "Italy", title: "Panettone artesanal: la temporada de los grandes levados", body: "En Italia la formación en masa madre para el panettone está en pleno auge: refrescos regulares y temperatura estable son la clave." },
      { region: "italia", tag: "Italy", title: "Granos antiguos y harinas de proximidad", body: "Las harinas de grano antiguo molidas a la piedra crecen en Italia: más sabor, pero hay que gestionar hidratación y fuerza." },
    ],
    youtubeVideos: [
      { title: "Masa y prefermento: el inicio (sponge)", category: "Técnica de masa", url: "https://www.youtube.com/embed/SCmgZw4QXE4" },
      { title: "Cocción y greñado de grandes levados", category: "Cocción y acabado", url: "https://www.youtube.com/embed/C_7Xft7HRVQ" },
    ],
    freeCourses: [
      { title: "Panettone artesanal: el método profesional", category: "Panettone", source: "Eater · Martesana Milano", level: "Profesional", url: "https://www.youtube.com/embed/nwCiW_BH3lU", isNew: true },
      { title: "Masa madre: alimentación y refresco", category: "Masa madre", source: "Ricette di Caterina", level: "Profesional", url: "https://www.youtube.com/embed/eN6BnMnfRUE", isNew: true },
      { title: "Focaccia genovesa con biga: corteza crujiente y miga abierta", category: "Focaccia", source: "Chef Billy Parisi", level: "Profesional", url: "https://www.youtube.com/embed/nyu15TqG038", isNew: false },
      { title: "Masa madre desde cero, sin aditivos", category: "Masa madre", source: "Bread Ritual", level: "Profesional", url: "https://www.youtube.com/embed/GSJmK9IU4tQ", isNew: false },
    ],
    lievitoMadre: {
      intro: "La masa madre es el corazón de mi trabajo. Aquí te lo explico todo: qué es, la diferencia entre masa madre sólida, Li.Co.Li y el Sauerteig alemán, qué es la autólisis y cómo gestiono mi madre día a día.",
      sections: [
        { title: "Qué es la masa madre", body: "Es una masa de harina y agua fermentada de forma espontánea por levaduras salvajes y bacterias lácticas. Aporta fermentación natural, aroma, digestibilidad y larga conservación. La madre SÓLIDA tiene baja hidratación (~45-50%), es estable y huele dulce/a miel." },
        { title: "Qué es el Li.Co.Li", body: "Li.Co.Li = masa madre de cultivo líquido: una madre de alta hidratación (100%, igual peso de harina y agua). Es más fácil de gestionar (se remueve, no se amasa), fermenta más rápido y da notas ligeramente más ácidas. Ideal para panes de cada día; para los grandes levados prefiero la sólida." },
        { title: "Sauerteig y masa madre", body: "En Alemania el 'Sauerteig' suele ser de centeno, más ácido y usado para panes oscuros. La 'lievito madre' italiana suele ser de trigo, más suave, ideal para panettone y panes ligeros. Uso ambas: Sauerteig para panes rústicos alemanes, masa madre para los grandes levados." },
        { title: "Autólisis", body: "La autólisis consiste en dejar reposar solo harina y agua (sin levadura ni sal) 30-60 minutos antes de amasar. Las enzimas empiezan a desarrollar el gluten solas: la masa se vuelve más extensible, fácil de trabajar y la miga mejora. Con integrales y espelta ayuda mucho a la absorción de agua." },
        { title: "Mi rutina (Millebolle 50-50)", body: "Cada día: baño la madre 15 min en agua a 31°C. Primer refresco: 100 g de madre + 200 g de harina, hidratación ~35%, reposo ~4 horas hasta pH 4,2-4,3. Tras el primer refresco guardo una parte para el día siguiente. Un refresco adicional a 16-24°C durante 18-24 horas al 45% cuando la necesito para grandes levados. Siempre controlo el pH: es mi brújula para la fuerza de la madre." },
        { title: "Refrescar paso a paso", body: "Refrescar es alimentar la madre: descarta una parte y añade harina y agua frescas. Proporción típica 1:1:0,5 (100 g madre + 100 g harina + 45-50 g agua para la sólida). Antes de un gran levado hago 2-3 refrescos seguidos (cada 3-4 horas) a 28°C: la madre queda dulce, hinchada y lista." },
        { title: "Cómo sé que está lista", body: "Está lista cuando dobla/triplica en 3-4 horas, huele a yogur y miel (no a vinagre ni disolvente) y el corte muestra una miga tupida y uniforme. Truco: un trocito en agua debe flotar. Si está ácida, floja o huele mal, necesita más refrescos o está demasiado caliente/fría." },
        { title: "Temperatura y agua", body: "La temperatura lo gobierna todo. 26-28°C = fermentación dulce y rápida; por debajo de 20°C se ralentiza y se vuelve más ácida. Uso agua a ~31°C para el baño y ajusto la temperatura del agua de amasado (ver 'Clima y temperatura') para alcanzar la temperatura final de madre y masa." },
        { title: "Autólisis y madre juntas", body: "A menudo hago autólisis (solo harina + agua, 30-60 min) ANTES de añadir la madre: la red de gluten arranca sola, la masa admite más agua y se mantiene extensible. Luego la desarrollo con la madre y por último la sal. Con espelta e integrales este paso marca la diferencia." },
        { title: "Problemas comunes y soluciones", body: "Demasiado ácida → refrescos más frecuentes, menor temperatura, menos agua. Floja/débil → refrescos seguidos a 28°C, harina más fuerte. Corteza seca arriba → tapa bien o consérvala bajo agua/baño. Moho → tírala y empieza de nuevo (no se recupera). Olor a acetona → tiene hambre: refréscala enseguida." },
        { title: "Conservación", body: "En la nevera (4°C) tras un refresco, bien cerrada: aguanta 5-7 días entre refrescos. Para pausas largas: sécala en escamas y guárdala en un tarro, o átala bien y consérvala en agua (método del baño). Antes de usarla, recupera su fuerza con 2-3 refrescos." },
      ],
    },
  },


};

// Fallback lingua: finché i contenuti EN non sono tradotti, EN usa l'italiano
// (evita il crash `content[lang]` undefined quando la lingua è 'en').

// Traduzione profonda IT->FR/FA tramite la mappa auto-generata (solo stringhe di testo note).
function deepT(obj, fn) {
  if (typeof obj === "string") return fn(obj) || obj;
  if (Array.isArray(obj)) return obj.map((x) => deepT(x, fn));
  if (obj && typeof obj === "object") {
    const o = {};
    for (const k in obj) o[k] = deepT(obj[k], fn);
    return o;
  }
  return obj;
}

if (!content.en) content.en = content.it;
if (!content.es) content.es = content.it;
if (!content.fr) content.fr = deepT(content.it, triFR);
if (!content.fa) content.fa = deepT(content.it, triFA);
// serve a far scattare la notifica "nuovi corsi" all'utente.
export const COURSES_VERSION = 1;
