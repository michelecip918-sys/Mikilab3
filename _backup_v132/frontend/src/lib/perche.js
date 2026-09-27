// V130 — IL PERCHÉ. Le spiegazioni dei passaggi chiave, come fanno i migliori siti di panificazione: non solo «cosa»
// fare, ma «perché». Ogni voce si accende da sola quando il procedimento della ricetta nomina quel passaggio (in italiano,
// tedesco o inglese). Scritte da Sitor (IA) e dichiarate come tali finché Michele non le controlla: per approvarne una
// basta mettere approvata: true (patch). Le dosi non si toccano mai: qui si spiega, non si cambia la ricetta.
const T = (it, de, en) => ({ it, de, en });

// kw: tutte le espressioni devono comparire nel procedimento (E logico). vai: attrezzo o pagina del sito collegata.
export const PERCHE = [
  { k: "autolisi", kw: [/autolis|autolyse/], t: T("Perché l'autolisi", "Warum Autolyse", "Why autolyse"),
    p: T("Farina e acqua riposano da sole, senza sale né lievito. La farina si idrata del tutto e il glutine comincia a formarsi senza fatica: poi l'impasto si lavora in meno tempo, è più liscio ed estensibile.",
      "Mehl und Wasser ruhen allein, ohne Salz und Hefe. Das Mehl quillt vollständig, und das Gluten beginnt sich von selbst zu bilden: danach knetest du kürzer, der Teig wird glatter und dehnbarer.",
      "Flour and water rest on their own, without salt or yeast. The flour hydrates fully and gluten starts forming by itself: afterwards the dough needs less kneading and is smoother and more extensible.") },
  { k: "biga", kw: [/\bbiga\b/], t: T("Perché la biga", "Warum Biga", "Why biga"),
    p: T("La biga è un prefermento solido, con poca acqua e pochissimo lievito, che matura dalle 12 ore in su al fresco. In quel tempo nascono profumi e acidità leggere: il pane ha più sapore, più forza, una mollica più aperta e dura di più.",
      "Biga ist ein fester Vorteig mit wenig Wasser und sehr wenig Hefe, der ab 12 Stunden kühl reift. In dieser Zeit entstehen Aromen und leichte Säure: das Brot schmeckt mehr, hat mehr Kraft, eine offenere Krume und hält länger.",
      "Biga is a stiff pre-ferment with little water and very little yeast, matured for 12 hours or more somewhere cool. In that time aromas and a light acidity develop: the bread has more flavour, more strength, a more open crumb and keeps longer.") },
  { k: "poolish", kw: [/poolish/], t: T("Perché il poolish", "Warum Poolish", "Why poolish"),
    p: T("Il poolish è un prefermento liquido, con acqua e farina in parti uguali e poco lievito. Essendo morbido fermenta in fretta e rende l'impasto estensibile: crosta sottile e croccante, profumo delicato, mollica leggera.",
      "Poolish ist ein flüssiger Vorteig aus gleichen Teilen Wasser und Mehl mit wenig Hefe. Weil er weich ist, gärt er zügig und macht den Teig dehnbar: dünne, knusprige Kruste, feines Aroma, lockere Krume.",
      "Poolish is a liquid pre-ferment with equal parts water and flour and a little yeast. Being soft, it ferments quickly and makes the dough extensible: a thin crisp crust, a delicate aroma, a light crumb.") },
  { k: "lievitomadre", kw: [/lievito madre|licoli|pasta madre|sauerteig|sourdough|levain/], t: T("Perché il lievito madre", "Warum Sauerteig", "Why sourdough"), vai: "curalievito",
    p: T("Nel lievito madre vivono lieviti selvatici e batteri lattici. Lavorano più lenti del lievito di birra, ma danno un'acidità leggera, un profumo più ricco e un pane che resta buono più giorni. Il segreto è usarlo al picco, quando è raddoppiato e pieno di bolle.",
      "Im Sauerteig leben wilde Hefen und Milchsäurebakterien. Sie arbeiten langsamer als Backhefe, geben aber leichte Säure, ein reicheres Aroma und ein Brot, das mehrere Tage gut bleibt. Das Geheimnis: ihn auf dem Höhepunkt verwenden, wenn er verdoppelt und voller Blasen ist.",
      "A sourdough starter holds wild yeasts and lactic bacteria. They work more slowly than baker's yeast but give a light acidity, a richer aroma and a loaf that stays good for days. The secret is using it at its peak, doubled and full of bubbles.") },
  { k: "patata", kw: [/patat|kartoffel|potato/], t: T("Perché la patata", "Warum die Kartoffel", "Why the potato"),
    p: T("L'amido della patata, lessa o in fiocchi, trattiene molta acqua: la mollica resta morbida e umida e il prodotto rimane fresco più a lungo. È il metodo di Michele per la focaccia: patata schiacciata nell'impasto, e un filo d'olio a chiudere.",
      "Die Stärke der Kartoffel, gekocht oder als Flocken, hält viel Wasser: die Krume bleibt weich und saftig, und das Gebäck bleibt länger frisch. So macht Michele seine Focaccia: zerdrückte Kartoffel im Teig und zum Schluss ein Schuss Öl.",
      "The starch in potato, boiled or as flakes, holds a lot of water: the crumb stays soft and moist and the bake keeps fresh longer. It's Michele's way with focaccia: mashed potato in the dough, and a drizzle of oil to finish.") },
  { k: "olio", kw: [/(per ultim[oi]|a fine impasto|alla fine)[^.]{0,40}olio|olio[^.]{0,40}(a fine impasto|per ultim|a filo)|zum schluss[^.]{0,40}öl|öl[^.]{0,40}zum schluss|last[^.]{0,40}oil|oil[^.]{0,40}(last|at the end)/], t: T("Perché l'olio va alla fine", "Warum das Öl zum Schluss kommt", "Why the oil goes in last"),
    p: T("Il grasso aggiunto all'inizio avvolge la farina e frena la formazione del glutine. Se entra quando l'impasto ha già forza, non la toglie: rende solo la mollica più morbida e la crosta più fine.",
      "Fett, das am Anfang dazukommt, umhüllt das Mehl und bremst die Glutenbildung. Kommt es erst, wenn der Teig schon Kraft hat, nimmt es sie ihm nicht: es macht nur die Krume weicher und die Kruste feiner.",
      "Fat added at the start coats the flour and slows gluten formation. Added once the dough already has strength, it doesn't take it away: it just makes the crumb softer and the crust finer.") },
  { k: "aceto", kw: [/aceto|essig|vinegar/], t: T("Perché un po' d'aceto di mele", "Warum etwas Apfelessig", "Why a little apple vinegar"),
    p: T("Nel metodo di Michele l'aceto di mele è solo l'1% sulla farina. Quel poco di acidità rinforza il glutine, arrotonda il sapore e aiuta il pane a difendersi più a lungo da muffe e alterazioni.",
      "In Micheles Methode ist Apfelessig nur 1 % auf das Mehl. Die kleine Säure stärkt das Gluten, rundet den Geschmack ab und hilft dem Brot, länger gegen Schimmel und Verderb geschützt zu sein.",
      "In Michele's method apple vinegar is just 1% of the flour. That touch of acidity strengthens the gluten, rounds out the flavour and helps the bread resist mould and spoilage for longer.") },
  { k: "kokos", kw: [/kokos|cocco|coconut/], t: T("Perché il grasso di cocco", "Warum Kokosfett", "Why coconut fat"),
    p: T("Un grasso solido come il Kokosfett, all'1% sulla farina, lubrifica la maglia del glutine: il pane si sviluppa meglio, la mollica è più morbida e invecchia più lentamente. Il sapore non si sente.",
      "Ein festes Fett wie Kokosfett, 1 % auf das Mehl, schmiert das Glutennetz: das Brot geht besser auf, die Krume ist weicher und altert langsamer. Man schmeckt es nicht.",
      "A solid fat like coconut fat, at 1% of the flour, lubricates the gluten network: the bread rises better, the crumb is softer and stales more slowly. You can't taste it.") },
  { k: "brosel", kw: [/brösel|brosel|pane grattugiato/], t: T("Perché il Brösel", "Warum Brösel", "Why the Brösel"),
    p: T("Il pane grattugiato, ammollato il giorno prima in quasi il triplo d'acqua, porta nell'impasto acqua già legata e il sapore del pane tostato. La mollica resta umida, il pane dura di più e il pane vecchio non si butta.",
      "Die Semmelbrösel, am Vortag in fast der dreifachen Menge Wasser eingeweicht, bringen gebundenes Wasser und den Geschmack von geröstetem Brot in den Teig. Die Krume bleibt saftig, das Brot hält länger, und altes Brot wird nicht weggeworfen.",
      "Breadcrumbs soaked the day before in almost three times their weight of water bring bound water and a toasted-bread flavour into the dough. The crumb stays moist, the loaf keeps longer and old bread isn't wasted.") },
  { k: "malto", kw: [/miglioratore|malto|malz|verbesserer|improver/], t: T("Perché il malto e il miglioratore", "Warum Malz und Verbesserer", "Why malt and the improver"), vai: "miglioratore",
    p: T("Gli enzimi del malto trasformano un po' di amido in zuccheri semplici: nutrono il lievito durante la lievitazione e in forno danno una crosta più colorita e profumata.",
      "Die Enzyme im Malz verwandeln etwas Stärke in einfache Zucker: sie füttern die Hefe während der Gare und sorgen im Ofen für eine kräftiger gefärbte, duftende Kruste.",
      "Malt enzymes turn some starch into simple sugars: they feed the yeast during proofing and give a more coloured, fragrant crust in the oven.") },
  { k: "kochstueck", kw: [/kochst|farina cotta|tangzhong/], t: T("Perché la farina cotta", "Warum das Kochstück", "Why the cooked flour"),
    p: T("Cuocendo un po' di farina con acqua, l'amido si gelatinizza e trattiene molta più acqua. Il pane viene morbidissimo e resta soffice per giorni.",
      "Wird etwas Mehl mit Wasser gekocht, verkleistert die Stärke und bindet viel mehr Wasser. Das Brot wird sehr weich und bleibt tagelang flauschig.",
      "Cooking a little flour with water gelatinises the starch so it holds much more water. The bread comes out very soft and stays fluffy for days.") },
  { k: "acqua", kw: [/acqua (fredda|ghiacciata|a \d)|wasser.{0,20}°|water.{0,20}°|ghiaccio|eiswasser|ice water/], t: T("Perché la temperatura dell'acqua conta", "Warum die Wassertemperatur zählt", "Why water temperature matters"),
    p: T("L'impasto finito dovrebbe stare intorno ai 24-26 °C: più caldo lievita troppo in fretta, più freddo si ferma. L'acqua è l'unica cosa che puoi regolare facilmente, per questo la ricetta dice fredda o a quanti gradi.",
      "Der fertige Teig sollte etwa 24–26 °C haben: wärmer geht er zu schnell, kälter bleibt er stehen. Das Wasser ist das Einzige, was du leicht regeln kannst, deshalb sagt das Rezept kalt oder wie viel Grad.",
      "The finished dough should sit around 24–26 °C: warmer and it rises too fast, colder and it stalls. Water is the one thing you can easily adjust, which is why the recipe says cold or gives a temperature.") },
  { k: "pieghe", kw: [/pieg|stretch|fold|falt|dehnen/], t: T("Perché le pieghe", "Warum die Falten", "Why the folds"), vai: "tecniche",
    p: T("Ogni piega allunga e sovrappone il glutine: la maglia si rinforza senza impastare a lungo e l'impasto impara a trattenere il gas. Tra una piega e l'altra riposa e diventa più liscio.",
      "Jede Faltung dehnt und schichtet das Gluten: das Netz wird stärker, ohne lange zu kneten, und der Teig lernt, Gas zu halten. Zwischen den Faltungen ruht er und wird glatter.",
      "Each fold stretches and layers the gluten: the network gets stronger without long kneading and the dough learns to hold gas. Between folds it rests and gets smoother.") },
  { k: "puntata", kw: [/puntata|lievitazione in massa|stockgare|bulk/], t: T("Perché la prima lievitazione in massa", "Warum die Stockgare", "Why the bulk fermentation"),
    p: T("Il blocco intero fermenta insieme: qui nascono la maggior parte dei profumi e l'impasto prende forza. Si guarda l'impasto, non l'orologio: deve essere gonfio, leggero e con qualche bolla.",
      "Der ganze Teig gärt zusammen: hier entstehen die meisten Aromen, und der Teig bekommt Kraft. Man schaut auf den Teig, nicht auf die Uhr: er soll aufgegangen, leicht und mit ein paar Blasen sein.",
      "The whole mass ferments together: this is where most of the flavour develops and the dough gains strength. Watch the dough, not the clock: it should be puffy, light and show some bubbles.") },
  { k: "frigo", kw: [/frigo|kühlschrank|kuehlschrank|fridge|refrigerat|cella|retard/], t: T("Perché il riposo al freddo", "Warum die kalte Führung", "Why the cold rest"), vai: "calcolatrice",
    p: T("Al freddo il lievito rallenta molto, ma gli enzimi continuano a lavorare: più profumo, pane più digeribile, crosta più bella. E i tempi li decidi tu: impasti la sera, inforni quando vuoi.",
      "In der Kälte wird die Hefe viel langsamer, die Enzyme arbeiten aber weiter: mehr Aroma, bekömmlicheres Brot, schönere Kruste. Und du bestimmst die Zeiten: abends kneten, backen, wann du willst.",
      "In the cold the yeast slows right down but the enzymes keep working: more flavour, a more digestible bread, a nicer crust. And you choose the timing: mix in the evening, bake when you like.") },
  { k: "pirlatura", kw: [/pirlatur|preform|rundwirk|pre-?shap/], t: T("Perché la pirlatura", "Warum Rundwirken", "Why pre-shaping"), vai: "tecniche",
    p: T("Pirlare vuol dire dare tensione alla superficie. Una pelle tesa trattiene il gas e spinge il pane verso l'alto: senza tensione il pane si allarga e resta basso.",
      "Rundwirken heißt, der Oberfläche Spannung zu geben. Eine gespannte Haut hält das Gas und treibt das Brot nach oben: ohne Spannung läuft es breit und bleibt flach.",
      "Pre-shaping gives the surface tension. A taut skin holds the gas and pushes the loaf upwards: without tension it spreads and stays flat.") },
  { k: "appretto", kw: [/appretto|seconda lievitazione|lievitazione finale|stückgare|stueckgare|final proof|second proof/], t: T("Come capire che l'appretto è giusto", "Wie man die richtige Stückgare erkennt", "How to tell the final proof is right"), vai: "banco",
    p: T("Premi piano con un dito infarinato: se l'impronta torna su lentamente e lascia un piccolo segno, è pronto. Se torna subito serve ancora tempo; se non torna più, è andato oltre: in forno subito.",
      "Drück sanft mit einem bemehlten Finger: kommt die Delle langsam zurück und bleibt ein kleiner Abdruck, ist er bereit. Springt sie sofort zurück, braucht er noch Zeit; kommt sie nicht mehr zurück, ist er übergärig: sofort in den Ofen.",
      "Press gently with a floured finger: if the dent springs back slowly and leaves a small mark, it's ready. If it springs back at once it needs more time; if it doesn't come back, it's over-proofed: bake it right away.") },
  { k: "tagli", kw: [/\btagli \(grign|tagli obliqu|tagli a croce|tagli sulla|taglio (a croce|obliquo|sulla superficie)|\bincidi\b|lametta|grign|einschneid|einschnitt|\bscor(e|ing)\b|\bslash/], t: T("Perché i tagli", "Warum die Einschnitte", "Why the scoring"), vai: "officina:taglio",
    p: T("In forno il pane cresce di colpo e la crosta deve cedere da qualche parte. Il taglio decide dove: il pane si apre bello e regolare invece di strapparsi a caso.",
      "Im Ofen wächst das Brot plötzlich, und die Kruste muss irgendwo nachgeben. Der Schnitt bestimmt, wo: das Brot öffnet sich schön und gleichmäßig, statt irgendwo aufzureißen.",
      "In the oven the loaf expands suddenly and the crust has to give way somewhere. The score decides where: the bread opens neatly instead of tearing at random.") },
  { k: "vapore", kw: [/vapore|dampf|schwaden|steam/], t: T("Perché il vapore in forno", "Warum Dampf im Ofen", "Why steam in the oven"),
    p: T("Nei primi minuti il vapore tiene la crosta umida ed elastica, così il pane può crescere al massimo. Poi si fa uscire il vapore: la crosta si asciuga e diventa dorata e croccante.",
      "In den ersten Minuten hält der Dampf die Kruste feucht und elastisch, damit das Brot maximal aufgehen kann. Dann lässt man den Dampf ab: die Kruste trocknet und wird goldbraun und knusprig.",
      "In the first minutes steam keeps the crust moist and stretchy so the loaf can rise to the full. Then you let the steam out: the crust dries and turns golden and crisp.") },
  { k: "lauge", kw: [/lauge|liscivia|laugen|\blye\b|brezel|bretzel/], t: T("Perché la liscivia", "Warum Lauge", "Why lye"),
    p: T("La soluzione alcalina cambia la superficie dell'impasto: in forno la crosta diventa bruna, lucida e prende il gusto tipico del Brezel. Si lavora sempre con guanti e occhiali, e lontano dai bambini.",
      "Die alkalische Lösung verändert die Teigoberfläche: im Ofen wird die Kruste braun, glänzend und bekommt den typischen Brezelgeschmack. Immer mit Handschuhen und Schutzbrille arbeiten, und weit weg von Kindern.",
      "The alkaline solution changes the dough's surface: in the oven the crust turns brown and glossy and takes on the classic pretzel flavour. Always work with gloves and goggles, away from children.") },
  { k: "sfoglia", kw: [/sfogli|laminaz|laminat|tourier|\btouren\b/], t: T("Perché la sfoglia vuole il freddo", "Warum Blätterteig Kälte braucht", "Why laminated dough needs cold"),
    p: T("Burro e impasto formano tanti strati sottili. In forno l'acqua del burro diventa vapore e solleva gli strati. Se il burro si scioglie durante i giri, gli strati si fondono: per questo tutto deve restare freddo, burro e impasto con la stessa consistenza.",
      "Butter und Teig bilden viele dünne Schichten. Im Ofen wird das Wasser der Butter zu Dampf und hebt die Schichten. Schmilzt die Butter beim Tourieren, verschmelzen die Schichten: deshalb muss alles kalt bleiben, Butter und Teig gleich fest.",
      "Butter and dough form many thin layers. In the oven the water in the butter turns to steam and lifts the layers. If the butter melts during the folds, the layers merge: that's why everything must stay cold, butter and dough with the same firmness.") },
  { k: "dueimpasti", kw: [/1° impasto|primo impasto|erster teig|1\. teig|first dough/, /2° impasto|secondo impasto|zweiter teig|2\. teig|second dough/], t: T("Perché due impasti", "Warum zwei Teige", "Why two doughs"),
    p: T("Nei grandi lievitati il primo impasto costruisce la struttura e fa lavorare il lievito; il secondo aggiunge zuccheri, tuorli e burro, che da soli frenerebbero la lievitazione. Nel metodo di Michele il 60% della farina va nel primo impasto e il 40% nel secondo.",
      "Bei großen Hefeteigen baut der erste Teig die Struktur auf und lässt die Hefe arbeiten; der zweite bringt Zucker, Eigelb und Butter, die die Gare allein bremsen würden. In Micheles Methode kommen 60 % des Mehls in den ersten Teig und 40 % in den zweiten.",
      "In great leavened bakes the first dough builds structure and gets the yeast working; the second adds sugar, yolks and butter, which on their own would slow fermentation. In Michele's method 60% of the flour goes into the first dough and 40% into the second.") },
  { k: "raffreddare", kw: [/raffredd|griglia|abkühl|abkuehl|auskühl|cool (down|on)|wire rack/], t: T("Perché aspettare prima di tagliarlo", "Warum warten, bevor man anschneidet", "Why wait before slicing"),
    p: T("Appena sfornato, dentro il pane c'è ancora vapore che finisce di cuocere la mollica. Se lo tagli caldo il vapore esce e la mollica diventa gommosa: su una griglia, almeno un'ora per il pane grande.",
      "Frisch aus dem Ofen ist noch Dampf im Brot, der die Krume fertig gart. Schneidest du es warm an, entweicht der Dampf und die Krume wird gummiartig: auf ein Gitter, beim großen Brot mindestens eine Stunde.",
      "Straight from the oven there's still steam inside finishing the crumb. Slice it hot and the steam escapes and the crumb turns gummy: onto a rack, at least an hour for a big loaf.") },
];

const norm = (s) => String(s || "").toLowerCase();

// Le voci più generali (compaiono in tante ricette) cedono il posto a quelle proprie di questa ricetta.
const GENERALI = new Set(["malto", "raffreddare", "acqua", "pieghe", "olio", "patata", "kokos", "aceto"]);

// Le voci che valgono per questa ricetta (al massimo 8), nell'ordine in cui il procedimento le incontra.
export function percheDellaRicetta(r, lang) {
  if (!r) return [];
  const testi = [r.procedure, r[`procedure_${lang}`], r.name].map(norm).join("\n"); // solo procedimento e nome: nelle note ci sono anche frasi come «niente biga»
  const proc = norm(r[`procedure_${lang}`] || r.procedure);
  const tutte = [];
  const NEG = /(senza|niente|ohne|kein[a-z]*|without|no)\s+(il |lo |la |le |i |gli |the |den |die |das )?$/;
  const vale = (re) => { // almeno una volta nominato davvero, non «senza pieghe» o «ohne Dampf»
    const g = new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g");
    let m; while ((m = g.exec(testi))) { if (!NEG.test(testi.slice(Math.max(0, m.index - 16), m.index))) return true; if (m[0] === "") g.lastIndex += 1; }
    return false;
  };
  PERCHE.forEach((v) => {
    if (!v.kw.every(vale)) return;
    const m = proc.search(v.kw[0]);
    tutte.push({ ...v, pos: m < 0 ? 99999 : m });
  });
  const scelte = tutte.sort((a, b) => (GENERALI.has(a.k) - GENERALI.has(b.k)) || a.pos - b.pos).slice(0, 8);
  return scelte.sort((a, b) => a.pos - b.pos);
}
