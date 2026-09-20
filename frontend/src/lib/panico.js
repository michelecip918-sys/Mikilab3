// V74 — "Panico da cena" e "Sughi nel mondo".
// Tutto locale: nessuna IA, nessun costo, funziona anche senza rete.
// Le quantità dei piatti sono PER PERSONA e vengono moltiplicate per il numero di persone a tavola.

const T = (it, de, en) => ({ it, de, en });

export const pickLang = (o, lang) => (!o ? "" : lang === "de" ? o.de : lang === "it" ? o.it : o.en);

// ── Ingredienti (nomi nelle 3 lingue) ────────────────────────────────────────
const ING = {
  pasta: T("Pasta", "Nudeln", "Pasta"),
  pastaCorta: T("Pasta corta", "Kurze Nudeln", "Short pasta"),
  passata: T("Passata di pomodoro", "Passierte Tomaten", "Tomato passata"),
  olio: T("Olio extravergine", "Olivenöl", "Olive oil"),
  aglio: T("Aglio (spicchi)", "Knoblauch (Zehen)", "Garlic (cloves)"),
  basilico: T("Basilico", "Basilikum", "Basil"),
  sale: T("Sale", "Salz", "Salt"),
  pepe: T("Pepe nero", "Schwarzer Pfeffer", "Black pepper"),
  burro: T("Burro", "Butter", "Butter"),
  parmigiano: T("Parmigiano grattugiato", "Geriebener Parmesan", "Grated Parmesan"),
  uova: T("Uova", "Eier", "Eggs"),
  pane: T("Pane (fette)", "Brot (Scheiben)", "Bread (slices)"),
  zucchine: T("Zucchine", "Zucchini", "Courgettes"),
  cotto: T("Prosciutto cotto", "Kochschinken", "Cooked ham"),
  formaggio: T("Formaggio a fette", "Käsescheiben", "Sliced cheese"),
  ceci: T("Ceci già cotti", "Gekochte Kichererbsen", "Cooked chickpeas"),
  rosmarino: T("Rosmarino", "Rosmarin", "Rosemary"),
  tonno: T("Tonno in scatola", "Thunfisch aus der Dose", "Canned tuna"),
  guanciale: T("Guanciale o pancetta", "Guanciale oder Bauchspeck", "Guanciale or pancetta"),
  pecorino: T("Pecorino o parmigiano", "Pecorino oder Parmesan", "Pecorino or Parmesan"),
  patate: T("Patate", "Kartoffeln", "Potatoes"),
  salsiccia: T("Salsiccia fresca", "Frische Salsiccia (Bratwurst)", "Fresh sausage"),
  farina: T("Farina", "Mehl", "Flour"),
  acqua: T("Acqua", "Wasser", "Water"),
  pomodori: T("Pomodori maturi", "Reife Tomaten", "Ripe tomatoes"),
  cipolla: T("Cipolla", "Zwiebel", "Onion"),
  olive: T("Olive nere denocciolate", "Schwarze Oliven, entsteint", "Pitted black olives"),
  capperi: T("Capperi", "Kapern", "Capers"),
  acciughe: T("Filetti di acciuga", "Sardellenfilets", "Anchovy fillets"),
  peperoncino: T("Peperoncino", "Chili", "Chilli"),
  prezzemolo: T("Prezzemolo", "Petersilie", "Parsley"),
};

// unit: "g" | "ml" | "pcs" | "tbsp" | null (q.b.)
const I = (key, perPerson, unit) => ({ key, q: perPerson, unit });

// ── Piatti veloci ────────────────────────────────────────────────────────────
// mins = tempo totale; kids = adatto ai bambini (niente piccante/acciughe).
export const MEALS = [
  {
    id: "burro-parmigiano", mins: 10, kids: true, emoji: "🍝",
    name: T("Pasta burro e parmigiano", "Nudeln mit Butter und Parmesan", "Pasta with butter and Parmesan"),
    ing: [I("pasta", 90, "g"), I("burro", 15, "g"), I("parmigiano", 20, "g"), I("sale", null, null)],
    steps: {
      it: ["Porta a bollore acqua salata e cuoci la pasta al dente.", "Scola tenendo da parte 2 cucchiai d'acqua di cottura.", "Rimetti la pasta nella pentola con burro, parmigiano e l'acqua di cottura: mescola 1 minuto fino a ottenere una crema."],
      de: ["Gesalzenes Wasser zum Kochen bringen und die Nudeln al dente kochen.", "Abgießen und 2 Esslöffel Kochwasser aufheben.", "Nudeln mit Butter, Parmesan und Kochwasser zurück in den Topf geben: 1 Minute rühren, bis eine Creme entsteht."],
      en: ["Bring salted water to the boil and cook the pasta al dente.", "Drain, keeping 2 tablespoons of the cooking water.", "Return the pasta to the pot with butter, Parmesan and the cooking water: stir 1 minute until creamy."],
    },
  },
  {
    id: "pomodoro", mins: 20, kids: true, emoji: "🍅",
    name: T("Pasta al pomodoro veloce", "Schnelle Nudeln mit Tomatensauce", "Quick tomato pasta"),
    ing: [I("pasta", 90, "g"), I("passata", 120, "g"), I("olio", 10, "g"), I("basilico", null, null), I("sale", null, null)],
    steps: {
      it: ["Scalda l'olio in un tegame, aggiungi la passata e un pizzico di sale: cuoci 10 minuti a fuoco medio.", "Intanto cuoci la pasta in acqua salata, al dente.", "Scola, condisci con il sugo e aggiungi il basilico."],
      de: ["Das Öl in einem Topf erhitzen, die passierten Tomaten und eine Prise Salz zugeben: 10 Minuten bei mittlerer Hitze kochen.", "Inzwischen die Nudeln in Salzwasser al dente kochen.", "Abgießen, mit der Sauce mischen und Basilikum zugeben."],
      en: ["Heat the oil in a pan, add the passata and a pinch of salt: cook 10 minutes over medium heat.", "Meanwhile cook the pasta in salted water, al dente.", "Drain, toss with the sauce and add the basil."],
    },
  },
  {
    id: "aglio-olio", mins: 15, kids: true, emoji: "🧄",
    name: T("Spaghetti aglio e olio (senza peperoncino)", "Spaghetti aglio e olio (ohne Chili)", "Spaghetti with garlic and oil (no chilli)"),
    ing: [I("pasta", 90, "g"), I("olio", 20, "g"), I("aglio", 0.5, "pcs"), I("prezzemolo", null, null), I("sale", null, null)],
    steps: {
      it: ["Cuoci gli spaghetti al dente in acqua salata e tieni da parte 1 mestolo d'acqua.", "In una padella con l'olio, a fuoco basso, fai imbiondire l'aglio a fettine per 2 minuti, senza bruciarlo.", "Aggiungi la pasta e un po' d'acqua di cottura e salta 1 minuto. Finisci col prezzemolo."],
      de: ["Die Spaghetti in Salzwasser al dente kochen und 1 Schöpflöffel Kochwasser aufheben.", "In einer Pfanne mit dem Öl bei niedriger Hitze den Knoblauch in Scheiben 2 Minuten goldgelb werden lassen, ohne ihn zu verbrennen.", "Die Nudeln und etwas Kochwasser zugeben und 1 Minute schwenken. Mit Petersilie abschließen."],
      en: ["Cook the spaghetti al dente in salted water and keep 1 ladle of the water.", "In a pan with the oil, over low heat, let the sliced garlic turn golden for 2 minutes without burning it.", "Add the pasta and a little cooking water and toss 1 minute. Finish with parsley."],
    },
  },
  {
    id: "tonno", mins: 15, kids: true, emoji: "🐟",
    name: T("Pasta al tonno", "Nudeln mit Thunfisch", "Tuna pasta"),
    ing: [I("pasta", 90, "g"), I("tonno", 60, "g"), I("passata", 80, "g"), I("olio", 10, "g"), I("sale", null, null)],
    steps: {
      it: ["Scalda l'olio con la passata e un pizzico di sale per 8 minuti.", "Cuoci la pasta al dente nel frattempo.", "Aggiungi al sugo il tonno sgocciolato, scalda 1 minuto, poi condisci la pasta."],
      de: ["Das Öl mit den passierten Tomaten und einer Prise Salz 8 Minuten erhitzen.", "Währenddessen die Nudeln al dente kochen.", "Den abgetropften Thunfisch in die Sauce geben, 1 Minute erwärmen, dann die Nudeln damit mischen."],
      en: ["Heat the oil with the passata and a pinch of salt for 8 minutes.", "Cook the pasta al dente meanwhile.", "Add the drained tuna to the sauce, warm 1 minute, then toss with the pasta."],
    },
  },
  {
    id: "carbonara", mins: 20, kids: true, emoji: "🥓",
    name: T("Carbonara veloce", "Schnelle Carbonara", "Quick carbonara"),
    ing: [I("pasta", 90, "g"), I("guanciale", 40, "g"), I("uova", 1, "pcs"), I("pecorino", 20, "g"), I("pepe", null, null)],
    steps: {
      it: ["Rosola il guanciale a dadini in padella, senza olio, finché è croccante.", "Cuoci la pasta al dente e tieni da parte 1 mestolo d'acqua di cottura.", "Sbatti le uova con il formaggio e il pepe.", "Fuori dal fuoco unisci pasta e guanciale alle uova, aggiungendo poca acqua di cottura finché diventa una crema. Il calore della pasta deve bastare a cuocere l'uovo."],
      de: ["Den gewürfelten Guanciale in einer Pfanne ohne Öl knusprig braten.", "Die Nudeln al dente kochen und 1 Schöpflöffel Kochwasser aufheben.", "Eier mit Käse und Pfeffer verquirlen.", "Vom Herd genommen Nudeln und Guanciale unter die Eier mischen und wenig Kochwasser zugeben, bis eine Creme entsteht. Die Hitze der Nudeln muss ausreichen, um das Ei zu garen."],
      en: ["Fry the diced guanciale in a dry pan until crisp.", "Cook the pasta al dente and keep 1 ladle of the cooking water.", "Beat the eggs with the cheese and pepper.", "Off the heat, mix pasta and guanciale into the eggs, adding a little cooking water until creamy. The heat of the pasta must be enough to cook the egg."],
    },
  },
  {
    id: "uova-toast", mins: 10, kids: true, emoji: "🍳",
    name: T("Uova strapazzate e pane tostato", "Rührei mit Toast", "Scrambled eggs on toast"),
    ing: [I("uova", 2, "pcs"), I("pane", 2, "pcs"), I("burro", 5, "g"), I("sale", null, null)],
    steps: {
      it: ["Tosta le fette di pane.", "Sbatti le uova con un pizzico di sale e cuocile in padella con il burro a fuoco basso, mescolando, finché sono cremose e rapprese.", "Servi le uova sul pane caldo."],
      de: ["Die Brotscheiben toasten.", "Eier mit einer Prise Salz verquirlen und in einer Pfanne mit der Butter bei niedriger Hitze unter Rühren cremig und gestockt garen.", "Das Rührei auf dem warmen Brot servieren."],
      en: ["Toast the bread slices.", "Beat the eggs with a pinch of salt and cook in a pan with the butter over low heat, stirring, until creamy and set.", "Serve the eggs on the hot toast."],
    },
  },
  {
    id: "frittata-zucchine", mins: 20, kids: true, emoji: "🥒",
    name: T("Frittata di zucchine", "Zucchini-Omelett", "Courgette frittata"),
    ing: [I("uova", 2, "pcs"), I("zucchine", 100, "g"), I("parmigiano", 15, "g"), I("olio", 5, "g"), I("sale", null, null)],
    steps: {
      it: ["Affetta le zucchine sottili e rosolale 5 minuti in padella con l'olio.", "Sbatti le uova con parmigiano e sale e versale sulle zucchine.", "Cuoci coperto a fuoco basso 6-8 minuti, gira con un piatto e cuoci ancora 2 minuti."],
      de: ["Die Zucchini in dünne Scheiben schneiden und 5 Minuten in der Pfanne mit dem Öl anbraten.", "Eier mit Parmesan und Salz verquirlen und über die Zucchini gießen.", "Zugedeckt bei niedriger Hitze 6-8 Minuten garen, mit einem Teller wenden und noch 2 Minuten garen."],
      en: ["Slice the courgettes thinly and brown them 5 minutes in a pan with the oil.", "Beat the eggs with Parmesan and salt and pour over the courgettes.", "Cook covered over low heat 6-8 minutes, flip using a plate and cook 2 more minutes."],
    },
  },
  {
    id: "toast", mins: 10, kids: true, emoji: "🥪",
    name: T("Toast prosciutto e formaggio", "Toast mit Schinken und Käse", "Ham and cheese toastie"),
    ing: [I("pane", 2, "pcs"), I("cotto", 40, "g"), I("formaggio", 40, "g"), I("burro", 5, "g")],
    steps: {
      it: ["Imburra un lato di ogni fetta. Metti prosciutto e formaggio tra le fette, con il burro all'esterno.", "Cuoci in padella a fuoco medio-basso 3 minuti per lato, finché il pane è dorato e il formaggio filante."],
      de: ["Eine Seite jeder Scheibe mit Butter bestreichen. Schinken und Käse zwischen die Scheiben legen, die Butter außen.", "In der Pfanne bei mittlerer bis niedriger Hitze 3 Minuten pro Seite braten, bis das Brot goldbraun und der Käse geschmolzen ist."],
      en: ["Butter one side of each slice. Put ham and cheese between the slices, butter on the outside.", "Cook in a pan over medium-low heat 3 minutes per side, until the bread is golden and the cheese melted."],
    },
  },
  {
    id: "piadine", mins: 25, kids: true, emoji: "🫓",
    name: T("Piadine al volo (senza lievitazione)", "Schnelle Piadine (ohne Gehzeit)", "Quick flatbreads (no rising)"),
    ing: [I("farina", 70, "g"), I("acqua", 40, "ml"), I("olio", 10, "g"), I("cotto", 30, "g"), I("formaggio", 30, "g"), I("sale", null, null)],
    steps: {
      it: ["Impasta farina, acqua tiepida, olio e un pizzico di sale fino a un impasto liscio. Copri e lascia riposare 10 minuti.", "Dividi in una pallina per persona e stendi ogni pallina sottile, di circa 3 mm.", "Cuoci in padella ben calda 1-2 minuti per lato, finché compaiono le macchie dorate.", "Farcisci con prosciutto e formaggio e piega a metà."],
      de: ["Mehl, lauwarmes Wasser, Öl und eine Prise Salz zu einem glatten Teig verkneten. Abdecken und 10 Minuten ruhen lassen.", "In eine Kugel pro Person teilen und jede Kugel dünn, etwa 3 mm, ausrollen.", "In einer sehr heißen Pfanne 1-2 Minuten pro Seite backen, bis goldene Flecken erscheinen.", "Mit Schinken und Käse füllen und zusammenklappen."],
      en: ["Mix flour, lukewarm water, oil and a pinch of salt into a smooth dough. Cover and rest 10 minutes.", "Divide into one ball per person and roll each thin, about 3 mm.", "Cook in a very hot pan 1-2 minutes per side, until golden spots appear.", "Fill with ham and cheese and fold in half."],
    },
  },
  {
    id: "pasta-ceci", mins: 25, kids: true, emoji: "🫘",
    name: T("Pasta e ceci veloce", "Schnelle Nudeln mit Kichererbsen", "Quick pasta and chickpeas"),
    ing: [I("pastaCorta", 50, "g"), I("ceci", 100, "g"), I("passata", 60, "g"), I("olio", 10, "g"), I("acqua", 200, "ml"), I("rosmarino", null, null), I("sale", null, null)],
    steps: {
      it: ["In una pentola scalda l'olio con il rosmarino, aggiungi passata, ceci e l'acqua. Porta a bollore e cuoci 5 minuti.", "Schiaccia metà dei ceci con una forchetta.", "Aggiungi la pasta e cuoci, mescolando, finché è tenera (circa 8 minuti). Se serve, aggiungi un po' d'acqua calda."],
      de: ["In einem Topf das Öl mit dem Rosmarin erhitzen, passierte Tomaten, Kichererbsen und das Wasser zugeben. Aufkochen und 5 Minuten garen.", "Die Hälfte der Kichererbsen mit einer Gabel zerdrücken.", "Die Nudeln zugeben und unter Rühren weich kochen (etwa 8 Minuten). Bei Bedarf etwas heißes Wasser nachgießen."],
      en: ["In a pot heat the oil with the rosemary, add passata, chickpeas and the water. Bring to the boil and cook 5 minutes.", "Mash half of the chickpeas with a fork.", "Add the pasta and cook, stirring, until tender (about 8 minutes). Add a little hot water if needed."],
    },
  },
  {
    id: "uova-pomodoro", mins: 20, kids: true, emoji: "🍅",
    name: T("Uova al pomodoro", "Eier in Tomatensauce", "Eggs in tomato sauce"),
    ing: [I("uova", 2, "pcs"), I("passata", 150, "g"), I("olio", 5, "g"), I("pane", 2, "pcs"), I("basilico", null, null), I("sale", null, null)],
    steps: {
      it: ["Scalda la passata con l'olio e un pizzico di sale in una padella larga per 8 minuti.", "Fai una piccola conca per ogni uovo e rompici le uova.", "Copri e cuoci 5-6 minuti, finché l'albume è rappreso. Servi con il pane e il basilico."],
      de: ["Die passierten Tomaten mit dem Öl und einer Prise Salz in einer weiten Pfanne 8 Minuten erhitzen.", "Für jedes Ei eine kleine Mulde machen und die Eier hineinschlagen.", "Zugedeckt 5-6 Minuten garen, bis das Eiweiß gestockt ist. Mit Brot und Basilikum servieren."],
      en: ["Heat the passata with the oil and a pinch of salt in a wide pan for 8 minutes.", "Make a small well for each egg and crack the eggs in.", "Cover and cook 5-6 minutes, until the whites are set. Serve with bread and basil."],
    },
  },
  {
    id: "bruschette", mins: 10, kids: true, emoji: "🍞",
    name: T("Bruschette al pomodoro", "Bruschetta mit Tomaten", "Tomato bruschetta"),
    ing: [I("pane", 3, "pcs"), I("pomodori", 100, "g"), I("olio", 10, "g"), I("basilico", null, null), I("sale", null, null)],
    steps: {
      it: ["Taglia i pomodori a cubetti e condiscili con olio, sale e basilico. Lascia insaporire 5 minuti.", "Tosta le fette di pane.", "Metti i pomodori sul pane caldo e servi subito."],
      de: ["Die Tomaten würfeln und mit Öl, Salz und Basilikum mischen. 5 Minuten durchziehen lassen.", "Die Brotscheiben toasten.", "Die Tomaten auf das warme Brot geben und sofort servieren."],
      en: ["Dice the tomatoes and dress them with oil, salt and basil. Let them sit 5 minutes.", "Toast the bread slices.", "Spoon the tomatoes onto the hot bread and serve at once."],
    },
  },
  {
    id: "pasta-patate", mins: 35, kids: true, emoji: "🥔",
    name: T("Pasta e patate", "Nudeln mit Kartoffeln", "Pasta and potatoes"),
    ing: [I("pastaCorta", 50, "g"), I("patate", 150, "g"), I("cipolla", 30, "g"), I("passata", 30, "g"), I("olio", 10, "g"), I("parmigiano", 15, "g"), I("acqua", 250, "ml"), I("sale", null, null)],
    steps: {
      it: ["Soffriggi la cipolla tritata nell'olio per 3 minuti, aggiungi le patate a cubetti piccoli e la passata.", "Copri con l'acqua calda e cuoci 15 minuti a fuoco medio.", "Aggiungi la pasta e cuoci circa 10 minuti, mescolando, fino a una consistenza cremosa. Finisci col parmigiano."],
      de: ["Die gehackte Zwiebel 3 Minuten im Öl andünsten, die kleinen Kartoffelwürfel und die passierten Tomaten zugeben.", "Mit heißem Wasser bedecken und 15 Minuten bei mittlerer Hitze garen.", "Die Nudeln zugeben und etwa 10 Minuten unter Rühren garen, bis es cremig ist. Mit Parmesan abschließen."],
      en: ["Sauté the chopped onion in the oil for 3 minutes, add the small potato cubes and the passata.", "Cover with hot water and cook 15 minutes over medium heat.", "Add the pasta and cook about 10 minutes, stirring, until creamy. Finish with Parmesan."],
    },
  },
  {
    id: "salsiccia-patate", mins: 40, kids: true, emoji: "🌭",
    name: T("Salsiccia e patate in padella", "Salsiccia mit Pfannenkartoffeln", "Sausage and pan potatoes"),
    ing: [I("salsiccia", 120, "g"), I("patate", 200, "g"), I("olio", 10, "g"), I("rosmarino", null, null), I("sale", null, null)],
    steps: {
      it: ["Taglia le patate a cubetti di 2 cm e la salsiccia a pezzi.", "In una padella larga con l'olio rosola le patate 10 minuti a fuoco medio, poi aggiungi la salsiccia e il rosmarino.", "Cuoci coperto altri 15 minuti, girando ogni tanto, finché la salsiccia è cotta (nessuna parte rosa all'interno) e le patate sono dorate."],
      de: ["Die Kartoffeln in 2-cm-Würfel und die Wurst in Stücke schneiden.", "In einer weiten Pfanne mit dem Öl die Kartoffeln 10 Minuten bei mittlerer Hitze anbraten, dann Wurst und Rosmarin zugeben.", "Zugedeckt weitere 15 Minuten garen, ab und zu wenden, bis die Wurst durchgegart ist (innen nichts Rosa) und die Kartoffeln goldbraun sind."],
      en: ["Cut the potatoes into 2 cm cubes and the sausage into pieces.", "In a wide pan with the oil brown the potatoes 10 minutes over medium heat, then add the sausage and rosemary.", "Cook covered another 15 minutes, turning now and then, until the sausage is cooked through (no pink inside) and the potatoes are golden."],
    },
  },
  {
    id: "puttanesca", mins: 20, kids: false, emoji: "🫒",
    name: T("Pasta alla puttanesca veloce", "Schnelle Nudeln Puttanesca", "Quick puttanesca pasta"),
    ing: [I("pasta", 90, "g"), I("passata", 100, "g"), I("olive", 20, "g"), I("capperi", 5, "g"), I("acciughe", 1, "pcs"), I("olio", 10, "g"), I("aglio", 0.5, "pcs")],
    steps: {
      it: ["In una padella con l'olio sciogli le acciughe con l'aglio a fettine, a fuoco basso, per 2 minuti.", "Aggiungi passata, olive e capperi e cuoci 10 minuti.", "Cuoci la pasta al dente, scola e salta nel sugo per 1 minuto."],
      de: ["In einer Pfanne mit dem Öl die Sardellen mit dem Knoblauch in Scheiben bei niedriger Hitze 2 Minuten auflösen.", "Passierte Tomaten, Oliven und Kapern zugeben und 10 Minuten kochen.", "Die Nudeln al dente kochen, abgießen und 1 Minute in der Sauce schwenken."],
      en: ["In a pan with the oil melt the anchovies with the sliced garlic over low heat for 2 minutes.", "Add passata, olives and capers and cook 10 minutes.", "Cook the pasta al dente, drain and toss in the sauce for 1 minute."],
    },
  },
  {
    id: "arrabbiata", mins: 15, kids: false, emoji: "🌶️",
    name: T("Penne all'arrabbiata", "Penne all'arrabbiata (scharf)", "Penne all'arrabbiata (spicy)"),
    ing: [I("pasta", 90, "g"), I("passata", 120, "g"), I("olio", 10, "g"), I("aglio", 0.5, "pcs"), I("peperoncino", null, null), I("prezzemolo", null, null), I("sale", null, null)],
    steps: {
      it: ["Scalda l'olio con l'aglio a fettine e il peperoncino per 1 minuto, a fuoco basso.", "Aggiungi la passata e un pizzico di sale e cuoci 8 minuti.", "Cuoci la pasta al dente, condiscila con il sugo e finisci col prezzemolo."],
      de: ["Das Öl mit dem Knoblauch in Scheiben und dem Chili 1 Minute bei niedriger Hitze erhitzen.", "Passierte Tomaten und eine Prise Salz zugeben und 8 Minuten kochen.", "Die Nudeln al dente kochen, mit der Sauce mischen und mit Petersilie abschließen."],
      en: ["Heat the oil with the sliced garlic and the chilli for 1 minute over low heat.", "Add the passata and a pinch of salt and cook 8 minutes.", "Cook the pasta al dente, toss with the sauce and finish with parsley."],
    },
  },
];

// ── Quantità per il numero di persone ────────────────────────────────────────
export function scaleQty(q, unit, people) {
  if (q == null || unit == null) return null;
  const raw = q * people;
  if (unit === "pcs") return Math.max(1, Math.ceil(raw - 1e-9));
  if (raw >= 100) return Math.round(raw / 10) * 10;
  return Math.max(5, Math.round(raw / 5) * 5);
}

const UNIT = { g: "g", ml: "ml" };
const TO_TASTE = T("q.b.", "nach Geschmack", "to taste");

export function ingredientLine(ing, people, lang) {
  const name = pickLang(ING[ing.key], lang);
  const n = scaleQty(ing.q, ing.unit, people);
  if (n == null) return `${name}: ${pickLang(TO_TASTE, lang)}`;
  if (ing.unit === "pcs") return `${n} × ${name}`;
  return `${n} ${UNIT[ing.unit] || ""} ${name}`.replace("  ", " ");
}

// Piatti adatti: tempo massimo e (se ci sono bambini) solo quelli senza piccante/acciughe.
export function suggest({ mins = 30, kids = false }) {
  return MEALS
    .filter((m) => m.mins <= mins && (!kids || m.kids))
    .sort((a, b) => a.mins - b.mins || a.id.localeCompare(b.id));
}

// Prende n piatti a partire da uno "scorrimento" (per il pulsante "un'altra idea").
export function pickPage(list, offset = 0, n = 3) {
  if (!list.length) return [];
  const out = [];
  for (let i = 0; i < Math.min(n, list.length); i++) out.push(list[(offset + i) % list.length]);
  return out;
}

export function mealAsSpeech(meal, people, lang) {
  const head = `${pickLang(meal.name, lang)}. ${pickLang(T("Per", "Für", "For"), lang)} ${people}.`;
  const ings = meal.ing.map((i) => ingredientLine(i, people, lang)).join(", ");
  const steps = pickLang(meal.steps, lang).map((s, i) => `${i + 1}. ${s}`).join(" ");
  return `${head} ${ings}. ${steps}`.replace(/\.\.+/g, ".");
}

// ── Comprensione della frase detta a voce ("siamo in 4, con due bambini, 20 minuti") ──
const NUM_WORDS = {
  uno: 1, una: 1, un: 1, due: 2, tre: 3, quattro: 4, cinque: 5, sei: 6, sette: 7, otto: 8,
  ein: 1, eine: 1, zwei: 2, drei: 3, vier: 4, fünf: 5, funf: 5, sechs: 6, sieben: 7, acht: 8,
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8,
};
const numFrom = (tok) => (/^\d+$/.test(tok) ? parseInt(tok, 10) : NUM_WORDS[tok.toLowerCase()] || null);

export function parsePanicoSpeech(text) {
  const t = String(text || "").toLowerCase();
  const out = {};
  // minuti
  const mm = t.match(/(\d{1,3})\s*(?:min|minut|minute|minuten|minutes)/);
  if (mm) out.mins = parseInt(mm[1], 10);
  // bambini
  if (/(senza|niente|nessun[oa]?|ohne|keine?|no|without)\s+(?:bambin|bimb|figli|kinder|kids|children)/.test(t)) out.kids = false;
  else if (/bambin|bimb|figli|kinder|kids|children|child/.test(t)) out.kids = true;
  // persone
  const nums = "(\\d{1,2}|uno|una|due|tre|quattro|cinque|sei|sette|otto|zwei|drei|vier|f[üu]nf|sechs|sieben|acht|one|two|three|four|five|six|seven|eight)";
  const p1 = t.match(new RegExp(`(?:siamo in|siamo|wir sind|we are|we're|for|per|für)\\s+${nums}\\b(?!\\s*(?:min|minut))`));
  const p2 = t.match(new RegExp(`${nums}\\s+(?:persone|personen|people|di noi|pers)`));
  const tok = (p1 && p1[1]) || (p2 && p2[1]);
  if (tok) { const n = numFrom(tok); if (n && n >= 1 && n <= 12) out.people = n; }
  return out;
}

// ── Sughi nel mondo ──────────────────────────────────────────────────────────
// Ricette in testo semplice (per 4 persone). Nessun calcolo: si leggono e si cucinano.
export const SAUCES = [
  {
    id: "pomodoro-base", flag: "🇮🇹", mins: 25,
    name: T("Sugo di pomodoro base", "Grundrezept Tomatensauce", "Basic tomato sauce"),
    place: T("Italia", "Italien", "Italy"),
    ing: T("400 g di pelati o passata, 2 cucchiai di olio, 1 spicchio d'aglio o mezza cipolla, basilico, sale.", "400 g geschälte Tomaten oder passierte Tomaten, 2 EL Öl, 1 Knoblauchzehe oder eine halbe Zwiebel, Basilikum, Salz.", "400 g peeled tomatoes or passata, 2 tbsp oil, 1 garlic clove or half an onion, basil, salt."),
    steps: T("1. Scalda l'olio e fai appassire aglio o cipolla senza colorirli.\n2. Aggiungi il pomodoro (se sono pelati, schiacciali) e un pizzico di sale.\n3. Cuoci 20 minuti a fuoco medio-basso, mescolando ogni tanto.\n4. A fine cottura aggiungi il basilico.", "1. Das Öl erhitzen und Knoblauch oder Zwiebel glasig dünsten, ohne Farbe.\n2. Die Tomaten (geschälte zerdrücken) und eine Prise Salz zugeben.\n3. 20 Minuten bei mittlerer bis niedriger Hitze kochen, ab und zu rühren.\n4. Am Ende das Basilikum zugeben.", "1. Heat the oil and soften the garlic or onion without colouring.\n2. Add the tomatoes (crush them if peeled) and a pinch of salt.\n3. Cook 20 minutes over medium-low heat, stirring now and then.\n4. Add the basil at the end."),
    allergens: T("Nessun allergene principale.", "Keine Hauptallergene.", "No major allergens."),
  },
  {
    id: "ragu", flag: "🇮🇹", mins: 150,
    name: T("Ragù alla bolognese", "Ragù alla bolognese", "Bolognese ragù"),
    place: T("Emilia-Romagna, Italia", "Emilia-Romagna, Italien", "Emilia-Romagna, Italy"),
    ing: T("300 g di macinato di manzo, 100 g di pancetta a dadini, 1 carota, 1 costa di sedano, 1 cipolla, 200 g di passata, 100 ml di vino, 100 ml di latte, brodo caldo, olio, sale.", "300 g Rinderhack, 100 g Bauchspeck in Würfeln, 1 Karotte, 1 Stange Sellerie, 1 Zwiebel, 200 g passierte Tomaten, 100 ml Wein, 100 ml Milch, heiße Brühe, Öl, Salz.", "300 g minced beef, 100 g diced pancetta, 1 carrot, 1 celery stalk, 1 onion, 200 g passata, 100 ml wine, 100 ml milk, hot stock, oil, salt."),
    steps: T("1. Trita finemente carota, sedano e cipolla e soffriggili con la pancetta e un filo d'olio per 10 minuti.\n2. Aggiungi la carne e rosolala bene, sgranandola.\n3. Sfuma con il vino e lascia evaporare.\n4. Aggiungi passata e latte, sala e copri.\n5. Cuoci 2 ore a fuoco bassissimo, aggiungendo brodo caldo quando si asciuga.\nSi serve con le tagliatelle.", "1. Karotte, Sellerie und Zwiebel fein hacken und mit dem Speck und etwas Öl 10 Minuten andünsten.\n2. Das Fleisch zugeben und gut anbraten, dabei auseinanderdrücken.\n3. Mit dem Wein ablöschen und verdampfen lassen.\n4. Passierte Tomaten und Milch zugeben, salzen und zudecken.\n5. 2 Stunden bei sehr niedriger Hitze köcheln, bei Bedarf heiße Brühe nachgießen.\nDazu passen Tagliatelle.", "1. Finely chop carrot, celery and onion and sauté them with the pancetta and a little oil for 10 minutes.\n2. Add the meat and brown it well, breaking it up.\n3. Deglaze with the wine and let it evaporate.\n4. Add passata and milk, salt and cover.\n5. Cook 2 hours over very low heat, adding hot stock when it dries.\nServe with tagliatelle."),
    allergens: T("Contiene latte e sedano.", "Enthält Milch und Sellerie.", "Contains milk and celery."),
  },
  {
    id: "pesto", flag: "🇮🇹", mins: 15,
    name: T("Pesto alla genovese", "Pesto alla genovese", "Genoese pesto"),
    place: T("Liguria, Italia", "Ligurien, Italien", "Liguria, Italy"),
    ing: T("50 g di foglie di basilico, 30 g di pinoli, 40 g di parmigiano, 20 g di pecorino, 1 piccolo spicchio d'aglio, 100 ml di olio extravergine, sale grosso.", "50 g Basilikumblätter, 30 g Pinienkerne, 40 g Parmesan, 20 g Pecorino, 1 kleine Knoblauchzehe, 100 ml natives Olivenöl extra, grobes Salz.", "50 g basil leaves, 30 g pine nuts, 40 g Parmesan, 20 g pecorino, 1 small garlic clove, 100 ml extra virgin olive oil, coarse salt."),
    steps: T("1. Nel mortaio pesta aglio e sale, poi il basilico, poco alla volta, e i pinoli.\n2. Aggiungi i formaggi e l'olio a filo, mescolando.\nCol frullatore: ingredienti freddi e pochi impulsi, per non scurire il basilico.\nCondisci la pasta fuori dal fuoco, con un cucchiaio di acqua di cottura.", "1. Im Mörser Knoblauch und Salz zerstoßen, dann nach und nach das Basilikum und die Pinienkerne.\n2. Die Käse und das Öl in dünnem Strahl unterrühren.\nMit dem Mixer: kalte Zutaten und wenige Impulse, damit das Basilikum nicht dunkel wird.\nDie Nudeln vom Herd genommen mit einem Löffel Kochwasser mischen.", "1. In a mortar crush garlic and salt, then the basil, a little at a time, and the pine nuts.\n2. Stir in the cheeses and the oil in a thin stream.\nWith a blender: cold ingredients and few pulses, so the basil does not darken.\nToss with the pasta off the heat, with a spoonful of cooking water."),
    allergens: T("Contiene frutta a guscio (pinoli) e latte.", "Enthält Schalenfrüchte (Pinienkerne) und Milch.", "Contains tree nuts (pine nuts) and milk."),
  },
  {
    id: "besciamella", flag: "🇫🇷", mins: 15,
    name: T("Besciamella (Béchamel)", "Béchamelsauce", "Béchamel"),
    place: T("Francia / Italia", "Frankreich / Italien", "France / Italy"),
    ing: T("50 g di burro, 50 g di farina, 500 ml di latte, sale, noce moscata.", "50 g Butter, 50 g Mehl, 500 ml Milch, Salz, Muskat.", "50 g butter, 50 g flour, 500 ml milk, salt, nutmeg."),
    steps: T("1. Sciogli il burro a fuoco dolce, aggiungi la farina e cuoci 2 minuti mescolando.\n2. Versa il latte tiepido a filo, sempre mescolando con la frusta per evitare i grumi.\n3. Cuoci 8-10 minuti finché si addensa.\n4. Sala e aggiungi la noce moscata.", "1. Die Butter bei niedriger Hitze schmelzen, das Mehl zugeben und 2 Minuten unter Rühren garen.\n2. Die lauwarme Milch in dünnem Strahl zugießen und dabei ständig mit dem Schneebesen rühren, damit keine Klümpchen entstehen.\n3. 8-10 Minuten kochen, bis sie eindickt.\n4. Salzen und mit Muskat würzen.", "1. Melt the butter over low heat, add the flour and cook 2 minutes, stirring.\n2. Pour in the lukewarm milk in a thin stream, whisking constantly to avoid lumps.\n3. Cook 8-10 minutes until it thickens.\n4. Season with salt and nutmeg."),
    allergens: T("Contiene glutine e latte.", "Enthält Gluten und Milch.", "Contains gluten and milk."),
  },
  {
    id: "jaeger", flag: "🇩🇪", mins: 25,
    name: T("Jägersoße (salsa ai funghi)", "Jägersoße", "Jäger sauce (mushroom sauce)"),
    place: T("Germania", "Deutschland", "Germany"),
    ing: T("300 g di champignon, 1 cipolla, 30 g di burro, 1 cucchiaio di farina, 1 cucchiaio di concentrato di pomodoro, 200 ml di brodo, 100 ml di panna, prezzemolo, sale, pepe.", "300 g Champignons, 1 Zwiebel, 30 g Butter, 1 EL Mehl, 1 EL Tomatenmark, 200 ml Brühe, 100 ml Sahne, Petersilie, Salz, Pfeffer.", "300 g mushrooms, 1 onion, 30 g butter, 1 tbsp flour, 1 tbsp tomato paste, 200 ml stock, 100 ml cream, parsley, salt, pepper."),
    steps: T("1. Soffriggi la cipolla tritata nel burro per 3 minuti.\n2. Aggiungi i funghi a fette e cuocili 8 minuti, finché perdono l'acqua.\n3. Spolvera con la farina, aggiungi il concentrato e mescola 1 minuto.\n4. Versa il brodo e cuoci 5 minuti, poi la panna per altri 3.\n5. Aggiusta di sale e pepe e aggiungi il prezzemolo.\nOttima con cotoletta o Spätzle.", "1. Die gehackte Zwiebel 3 Minuten in der Butter andünsten.\n2. Die Pilzscheiben zugeben und 8 Minuten braten, bis sie ihr Wasser abgeben.\n3. Mit dem Mehl bestäuben, das Tomatenmark zugeben und 1 Minute rühren.\n4. Die Brühe angießen und 5 Minuten kochen, dann die Sahne zugeben und weitere 3 Minuten köcheln.\n5. Mit Salz und Pfeffer abschmecken und Petersilie zugeben.\nPasst zu Schnitzel oder Spätzle.", "1. Sauté the chopped onion in the butter for 3 minutes.\n2. Add the sliced mushrooms and cook 8 minutes, until they release their water.\n3. Sprinkle with the flour, add the tomato paste and stir 1 minute.\n4. Pour in the stock and cook 5 minutes, then add the cream for 3 more.\n5. Season with salt and pepper and add the parsley.\nGreat with schnitzel or Spätzle."),
    allergens: T("Contiene glutine e latte.", "Enthält Gluten und Milch.", "Contains gluten and milk."),
  },
  {
    id: "currywurst", flag: "🇩🇪", mins: 20,
    name: T("Salsa per Currywurst", "Currywurst-Soße", "Currywurst sauce"),
    place: T("Berlino, Germania", "Berlin, Deutschland", "Berlin, Germany"),
    ing: T("200 g di ketchup, 100 ml di acqua, 1 cipolla piccola, 2 cucchiai di curry in polvere, 1 cucchiaio di paprica dolce, 1 cucchiaio di zucchero, 1 cucchiaio di aceto, 1 cucchiaio di olio, pepe.", "200 g Ketchup, 100 ml Wasser, 1 kleine Zwiebel, 2 EL Currypulver, 1 EL Paprika edelsüß, 1 EL Zucker, 1 EL Essig, 1 EL Öl, Pfeffer.", "200 g ketchup, 100 ml water, 1 small onion, 2 tbsp curry powder, 1 tbsp sweet paprika, 1 tbsp sugar, 1 tbsp vinegar, 1 tbsp oil, pepper."),
    steps: T("1. Soffriggi la cipolla tritata nell'olio, poi aggiungi curry e paprica e mescola 1 minuto.\n2. Versa ketchup, acqua, zucchero e aceto.\n3. Cuoci 10 minuti a fuoco basso; frulla se vuoi una salsa liscia.\n4. Servila sulla salsiccia arrostita, con altro curry sopra.", "1. Die gehackte Zwiebel im Öl andünsten, dann Curry und Paprika zugeben und 1 Minute rühren.\n2. Ketchup, Wasser, Zucker und Essig zugießen.\n3. 10 Minuten bei niedriger Hitze köcheln; für eine glatte Soße pürieren.\n4. Über die gebratene Wurst geben, mit etwas Curry bestäubt.", "1. Sauté the chopped onion in the oil, then add curry and paprika and stir 1 minute.\n2. Pour in ketchup, water, sugar and vinegar.\n3. Simmer 10 minutes over low heat; blend for a smooth sauce.\n4. Serve over grilled sausage, with more curry on top."),
    allergens: T("Può contenere sedano e senape (controlla le etichette).", "Kann Sellerie und Senf enthalten (Etiketten prüfen).", "May contain celery and mustard (check the labels)."),
  },
  {
    id: "salsa-verde", flag: "🇮🇹", mins: 10,
    name: T("Salsa verde piemontese", "Grüne Soße aus dem Piemont", "Piedmontese green sauce"),
    place: T("Piemonte, Italia", "Piemont, Italien", "Piedmont, Italy"),
    ing: T("1 mazzo grande di prezzemolo, 2 filetti di acciuga sott'olio, 1 cucchiaio di capperi, 1 spicchio d'aglio, 1 fetta di pane raffermo ammollata nell'aceto, 100 ml di olio extravergine, sale.", "1 großes Bund Petersilie, 2 Sardellenfilets in Öl, 1 EL Kapern, 1 Knoblauchzehe, 1 Scheibe altbackenes Brot in Essig eingeweicht, 100 ml natives Olivenöl extra, Salz.", "1 large bunch of parsley, 2 anchovy fillets in oil, 1 tbsp capers, 1 garlic clove, 1 slice of stale bread soaked in vinegar, 100 ml extra virgin olive oil, salt."),
    steps: T("1. Trita finemente il prezzemolo con acciughe, capperi e aglio (o frulla con pochi impulsi).\n2. Strizza il pane e uniscilo.\n3. Aggiungi l'olio a filo e regola di sale.\n4. Lascia riposare 1 ora. Ottima con il bollito.", "1. Petersilie mit Sardellen, Kapern und Knoblauch fein hacken (oder mit wenigen Impulsen pürieren).\n2. Das Brot ausdrücken und untermischen.\n3. Das Öl in dünnem Strahl zugeben und mit Salz abschmecken.\n4. 1 Stunde ziehen lassen. Passt sehr gut zu gekochtem Fleisch.", "1. Finely chop the parsley with anchovies, capers and garlic (or blend with a few pulses).\n2. Squeeze the bread and mix it in.\n3. Add the oil in a thin stream and adjust the salt.\n4. Rest 1 hour. Great with boiled meats."),
    allergens: T("Contiene pesce (acciughe) e glutine (pane).", "Enthält Fisch (Sardellen) und Gluten (Brot).", "Contains fish (anchovies) and gluten (bread)."),
  },
  {
    id: "chimichurri", flag: "🇦🇷", mins: 10,
    name: T("Chimichurri", "Chimichurri", "Chimichurri"),
    place: T("Argentina", "Argentinien", "Argentina"),
    ing: T("1 mazzo di prezzemolo, 3 spicchi d'aglio, 1 cucchiaio di origano secco, 100 ml di olio, 3 cucchiai di aceto di vino rosso, peperoncino in fiocchi, sale.", "1 Bund Petersilie, 3 Knoblauchzehen, 1 EL getrockneter Oregano, 100 ml Öl, 3 EL Rotweinessig, Chiliflocken, Salz.", "1 bunch of parsley, 3 garlic cloves, 1 tbsp dried oregano, 100 ml oil, 3 tbsp red wine vinegar, chilli flakes, salt."),
    steps: T("1. Trita finissimi prezzemolo e aglio.\n2. Mescola con origano, peperoncino, sale, aceto e olio.\n3. Lascia riposare 30 minuti prima di servire.\nOttimo con carne alla griglia.", "1. Petersilie und Knoblauch sehr fein hacken.\n2. Mit Oregano, Chili, Salz, Essig und Öl mischen.\n3. Vor dem Servieren 30 Minuten ziehen lassen.\nSehr gut zu gegrilltem Fleisch.", "1. Chop parsley and garlic very finely.\n2. Mix with oregano, chilli, salt, vinegar and oil.\n3. Rest 30 minutes before serving.\nGreat with grilled meat."),
    allergens: T("Nessun allergene principale.", "Keine Hauptallergene.", "No major allergens."),
  },
  {
    id: "tzatziki", flag: "🇬🇷", mins: 15,
    name: T("Tzatziki", "Tzatziki", "Tzatziki"),
    place: T("Grecia", "Griechenland", "Greece"),
    ing: T("250 g di yogurt greco, mezzo cetriolo, 1 spicchio d'aglio, 1 cucchiaio di olio, 1 cucchiaino di aceto o succo di limone, aneto o menta, sale.", "250 g griechischer Joghurt, eine halbe Gurke, 1 Knoblauchzehe, 1 EL Öl, 1 TL Essig oder Zitronensaft, Dill oder Minze, Salz.", "250 g Greek yogurt, half a cucumber, 1 garlic clove, 1 tbsp oil, 1 tsp vinegar or lemon juice, dill or mint, salt."),
    steps: T("1. Grattugia il cetriolo e strizzalo bene.\n2. Mescola con yogurt, aglio schiacciato, olio, aceto, erbe e sale.\n3. Lascia riposare 30 minuti in frigo.", "1. Die Gurke raspeln und gut ausdrücken.\n2. Mit Joghurt, gepresstem Knoblauch, Öl, Essig, Kräutern und Salz mischen.\n3. 30 Minuten im Kühlschrank ziehen lassen.", "1. Grate the cucumber and squeeze it well.\n2. Mix with yogurt, crushed garlic, oil, vinegar, herbs and salt.\n3. Rest 30 minutes in the fridge."),
    allergens: T("Contiene latte.", "Enthält Milch.", "Contains milk."),
  },
  {
    id: "puttanesca", flag: "🇮🇹", mins: 20,
    name: T("Sugo alla puttanesca", "Puttanesca-Sauce", "Puttanesca sauce"),
    place: T("Campania, Italia", "Kampanien, Italien", "Campania, Italy"),
    ing: T("400 g di pelati, 2 spicchi d'aglio, 60 g di olive nere denocciolate, 1 cucchiaio di capperi, 3 filetti di acciuga, peperoncino, olio, prezzemolo.", "400 g geschälte Tomaten, 2 Knoblauchzehen, 60 g schwarze Oliven ohne Stein, 1 EL Kapern, 3 Sardellenfilets, Chili, Öl, Petersilie.", "400 g peeled tomatoes, 2 garlic cloves, 60 g pitted black olives, 1 tbsp capers, 3 anchovy fillets, chilli, oil, parsley."),
    steps: T("1. Fai sciogliere le acciughe nell'olio con aglio e peperoncino a fuoco basso.\n2. Aggiungi i pelati schiacciati, le olive e i capperi.\n3. Cuoci 15 minuti a fuoco medio.\n4. Finisci col prezzemolo. Il sale di solito non serve: acciughe e capperi sono già sapidi.", "1. Die Sardellen im Öl mit Knoblauch und Chili bei niedriger Hitze auflösen.\n2. Die zerdrückten Tomaten, die Oliven und die Kapern zugeben.\n3. 15 Minuten bei mittlerer Hitze kochen.\n4. Mit Petersilie abschließen. Salz braucht es meist nicht: Sardellen und Kapern sind schon salzig.", "1. Melt the anchovies in the oil with garlic and chilli over low heat.\n2. Add the crushed tomatoes, the olives and the capers.\n3. Cook 15 minutes over medium heat.\n4. Finish with parsley. Salt is usually not needed: anchovies and capers are already salty."),
    allergens: T("Contiene pesce (acciughe).", "Enthält Fisch (Sardellen).", "Contains fish (anchovies)."),
  },
  {
    id: "satay", flag: "🇮🇩", mins: 10,
    name: T("Salsa di arachidi (satay)", "Erdnusssoße (Satay)", "Peanut sauce (satay)"),
    place: T("Indonesia / Sud-est asiatico", "Indonesien / Südostasien", "Indonesia / Southeast Asia"),
    ing: T("100 g di burro di arachidi, 100 ml di latte di cocco, 2 cucchiai di salsa di soia, 1 cucchiaio di succo di lime, 1 cucchiaio di zucchero di canna, 1 spicchio d'aglio, 1 cucchiaino di zenzero grattugiato, peperoncino a piacere.", "100 g Erdnussbutter, 100 ml Kokosmilch, 2 EL Sojasoße, 1 EL Limettensaft, 1 EL brauner Zucker, 1 Knoblauchzehe, 1 TL geriebener Ingwer, Chili nach Belieben.", "100 g peanut butter, 100 ml coconut milk, 2 tbsp soy sauce, 1 tbsp lime juice, 1 tbsp brown sugar, 1 garlic clove, 1 tsp grated ginger, chilli to taste."),
    steps: T("1. Metti tutto in un pentolino.\n2. Scalda a fuoco basso 5 minuti, mescolando, finché è liscio e denso.\n3. Se serve, allunga con un po' d'acqua calda.\nOttima con spiedini di pollo o verdure.", "1. Alles in einen kleinen Topf geben.\n2. Bei niedriger Hitze 5 Minuten unter Rühren erwärmen, bis sie glatt und dick ist.\n3. Bei Bedarf mit etwas heißem Wasser verdünnen.\nSehr gut zu Hähnchen- oder Gemüsespießen.", "1. Put everything in a small pan.\n2. Heat over low heat 5 minutes, stirring, until smooth and thick.\n3. Thin with a little hot water if needed.\nGreat with chicken or vegetable skewers."),
    allergens: T("Contiene arachidi e soia.", "Enthält Erdnüsse und Soja.", "Contains peanuts and soy."),
  },
];
