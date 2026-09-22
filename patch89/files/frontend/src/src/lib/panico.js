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

// ── Condimenti per focacce, pizze e pane ─────────────────────────────────────
// V85 (richiesta di Michele): al posto dei sughi da pasta, i condimenti che stanno bene sulle focacce
// e sulle pizze del sito e sul pane appena sfornato. Dosi per una teglia 30×40 cm (o 4 persone).
// Nessun calcolo: si leggono e si preparano. "Prima" = si mette sull'impasto crudo; "Dopo" = a cottura finita.
export const SAUCES = [
  {
    id: "salamoia", flag: "🫒", mins: 5,
    name: T("Salamoia per la focaccia", "Salzlake für die Focaccia", "Brine for focaccia"),
    place: T("Prima della cottura · Genova", "Vor dem Backen · Genua", "Before baking · Genoa"),
    ing: T("60 ml di acqua, 40 ml di olio extravergine, 1 cucchiaino raso di sale fino.", "60 ml Wasser, 40 ml natives Olivenöl extra, 1 gestrichener TL feines Salz.", "60 ml water, 40 ml extra virgin olive oil, 1 level tsp fine salt."),
    steps: T("1. Sciogli il sale nell'acqua, poi aggiungi l'olio e sbatti con una forchetta finché diventa torbida.\n2. Fai i buchi nella focaccia con le dita, fino a toccare la teglia.\n3. Versa la salamoia sopra: deve riempire i buchi. Sembra troppa, non lo è.\n4. Lascia lievitare l'ultima mezz'ora con la salamoia sopra, poi inforna. Sale grosso solo se ti piace sentirlo.", "1. Das Salz im Wasser auflösen, dann das Öl zugeben und mit einer Gabel schlagen, bis es trüb wird.\n2. Mit den Fingern Löcher in die Focaccia drücken, bis zum Blech.\n3. Die Lake darübergießen: sie muss die Löcher füllen. Sieht nach zu viel aus, ist es nicht.\n4. Die letzte halbe Stunde mit der Lake gehen lassen, dann backen. Grobes Salz nur, wenn du es magst.", "1. Dissolve the salt in the water, add the oil and beat with a fork until cloudy.\n2. Dimple the focaccia with your fingers, down to the tray.\n3. Pour the brine over: it must fill the dimples. It looks like too much; it isn't.\n4. Let it rise the last half hour with the brine on, then bake. Coarse salt only if you like to feel it."),
    allergens: T("Nessun allergene principale.", "Keine Hauptallergene.", "No major allergens."),
  },
  {
    id: "pomodorini", flag: "🍅", mins: 10,
    name: T("Pomodorini, olive e origano", "Kirschtomaten, Oliven und Oregano", "Cherry tomatoes, olives and oregano"),
    place: T("Prima della cottura · Bari", "Vor dem Backen · Bari", "Before baking · Bari"),
    ing: T("250 g di pomodorini, 15 olive (meglio baresane o taggiasche), origano secco, sale, olio extravergine.", "250 g Kirschtomaten, 15 Oliven (am besten Baresane oder Taggiasca), getrockneter Oregano, Salz, natives Olivenöl extra.", "250 g cherry tomatoes, 15 olives (Baresane or Taggiasca if you can), dried oregano, salt, extra virgin olive oil."),
    steps: T("1. Taglia i pomodorini a metà e schiacciali leggermente con le dita sopra la focaccia già stesa, con il taglio verso il basso.\n2. Affonda le olive tra un pomodorino e l'altro.\n3. Sale, origano e un giro d'olio abbondante.\n4. Inforna come dice la ricetta: i pomodorini devono raggrinzire e caramellare ai bordi.", "1. Die Tomaten halbieren und mit der Schnittfläche nach unten leicht in die ausgebreitete Focaccia drücken.\n2. Die Oliven zwischen die Tomaten drücken.\n3. Salz, Oregano und reichlich Öl.\n4. Backen wie im Rezept: die Tomaten sollen schrumpeln und am Rand karamellisieren.", "1. Halve the tomatoes and press them lightly, cut side down, into the stretched focaccia.\n2. Push the olives in between.\n3. Salt, oregano and a generous pour of oil.\n4. Bake as the recipe says: the tomatoes should wrinkle and caramelise at the edges."),
    allergens: T("Nessun allergene principale (controlla le olive in salamoia).", "Keine Hauptallergene (Oliven in Lake prüfen).", "No major allergens (check brined olives)."),
  },
  {
    id: "patate-rosmarino", flag: "🥔", mins: 15,
    name: T("Patate a velo e rosmarino", "Hauchdünne Kartoffeln mit Rosmarin", "Paper-thin potatoes and rosemary"),
    place: T("Prima della cottura · Liguria e Toscana", "Vor dem Backen · Ligurien und Toskana", "Before baking · Liguria and Tuscany"),
    ing: T("2 patate medie, 2 rametti di rosmarino, 3 cucchiai di olio extravergine, sale, pepe.", "2 mittlere Kartoffeln, 2 Zweige Rosmarin, 3 EL natives Olivenöl extra, Salz, Pfeffer.", "2 medium potatoes, 2 sprigs of rosemary, 3 tbsp extra virgin olive oil, salt, pepper."),
    steps: T("1. Taglia le patate crude a fette sottilissime (mandolina o coltello ben affilato): devono essere quasi trasparenti.\n2. Mettile 10 minuti in acqua fredda, poi asciugale bene con un canovaccio.\n3. Condiscile in una ciotola con olio, sale, pepe e gli aghi di rosmarino.\n4. Disponile sulla focaccia a scaglie, sovrapposte appena, e inforna. Devono diventare croccanti ai bordi.", "1. Die rohen Kartoffeln hauchdünn schneiden (Hobel oder sehr scharfes Messer): fast durchsichtig.\n2. 10 Minuten in kaltes Wasser legen, dann mit einem Tuch gut trocknen.\n3. In einer Schüssel mit Öl, Salz, Pfeffer und Rosmarinnadeln mischen.\n4. Schuppenartig, leicht überlappend, auf die Focaccia legen und backen. Die Ränder sollen knusprig werden.", "1. Slice the raw potatoes paper-thin (mandoline or a very sharp knife): almost see-through.\n2. Soak 10 minutes in cold water, then dry well with a cloth.\n3. Toss in a bowl with oil, salt, pepper and rosemary needles.\n4. Lay them on the focaccia like scales, barely overlapping, and bake. The edges should turn crisp."),
    allergens: T("Nessun allergene principale.", "Keine Hauptallergene.", "No major allergens."),
  },
  {
    id: "cipolla-rossa", flag: "🧅", mins: 25,
    name: T("Cipolla rossa dolce", "Süße rote Zwiebeln", "Sweet red onion"),
    place: T("Prima della cottura · Tropea", "Vor dem Backen · Tropea", "Before baking · Tropea"),
    ing: T("2 cipolle rosse, 1 cucchiaino di zucchero, 1 cucchiaio di aceto di vino, 2 cucchiai di olio, sale, origano o timo.", "2 rote Zwiebeln, 1 TL Zucker, 1 EL Weinessig, 2 EL Öl, Salz, Oregano oder Thymian.", "2 red onions, 1 tsp sugar, 1 tbsp wine vinegar, 2 tbsp oil, salt, oregano or thyme."),
    steps: T("1. Affetta le cipolle sottili e mettile in una ciotola con sale, zucchero e aceto.\n2. Lasciale 20 minuti: perdono il pizzicore e diventano dolci e morbide.\n3. Strizzale, condiscile con l'olio e l'origano.\n4. Distribuiscile sulla focaccia prima di infornare. Ai bordi devono prendere colore.", "1. Die Zwiebeln dünn schneiden und mit Salz, Zucker und Essig in eine Schüssel geben.\n2. 20 Minuten stehen lassen: sie verlieren die Schärfe und werden süß und weich.\n3. Ausdrücken, mit Öl und Oregano mischen.\n4. Vor dem Backen auf der Focaccia verteilen. Die Ränder sollen Farbe nehmen.", "1. Slice the onions thin and put them in a bowl with salt, sugar and vinegar.\n2. Leave 20 minutes: they lose their bite and turn sweet and soft.\n3. Squeeze them, dress with the oil and oregano.\n4. Spread on the focaccia before baking. The edges should take colour."),
    allergens: T("Può contenere solfiti (aceto).", "Kann Sulfite enthalten (Essig).", "May contain sulphites (vinegar)."),
  },
  {
    id: "pomodoro-pizza", flag: "🍕", mins: 5,
    name: T("Pomodoro crudo per la pizza", "Rohe Tomatensauce für Pizza", "Raw tomato for pizza"),
    place: T("Prima della cottura · Napoli", "Vor dem Backen · Neapel", "Before baking · Naples"),
    ing: T("400 g di pomodori pelati di buona qualità, 1 cucchiaino di sale, 1 cucchiaio di olio extravergine, basilico.", "400 g gute geschälte Tomaten, 1 TL Salz, 1 EL natives Olivenöl extra, Basilikum.", "400 g good quality peeled tomatoes, 1 tsp salt, 1 tbsp extra virgin olive oil, basil."),
    steps: T("1. Schiaccia i pelati con le mani o con una forchetta: non frullarli, deve restare un po' grossolano.\n2. Aggiungi il sale, l'olio e qualche foglia di basilico spezzata.\n3. Non cuocerlo: cuoce in forno sulla pizza. Un velo sottile, non un lago.\n4. Se è troppo liquido, lascialo 10 minuti in un colino.", "1. Die Tomaten mit den Händen oder einer Gabel zerdrücken: nicht pürieren, etwas grob lassen.\n2. Salz, Öl und ein paar zerzupfte Basilikumblätter zugeben.\n3. Nicht kochen: sie gart im Ofen auf der Pizza. Ein dünner Schleier, kein See.\n4. Zu flüssig? 10 Minuten in einem Sieb abtropfen lassen.", "1. Crush the tomatoes by hand or with a fork: don't blend, keep it a little coarse.\n2. Add salt, oil and a few torn basil leaves.\n3. Don't cook it: it cooks in the oven on the pizza. A thin layer, not a lake.\n4. Too watery? Leave it 10 minutes in a sieve."),
    allergens: T("Nessun allergene principale.", "Keine Hauptallergene.", "No major allergens."),
  },
  {
    id: "crema-olive", flag: "🫒", mins: 10,
    name: T("Crema di olive nere", "Schwarze Olivencreme", "Black olive spread"),
    place: T("Dopo la cottura · Sud Italia", "Nach dem Backen · Süditalien", "After baking · Southern Italy"),
    ing: T("150 g di olive nere denocciolate, 1 cucchiaio di capperi dissalati, 1 spicchio d'aglio piccolo, 4 cucchiai di olio extravergine, scorza di limone, origano.", "150 g schwarze Oliven ohne Stein, 1 EL entsalzte Kapern, 1 kleine Knoblauchzehe, 4 EL natives Olivenöl extra, Zitronenschale, Oregano.", "150 g pitted black olives, 1 tbsp rinsed capers, 1 small garlic clove, 4 tbsp extra virgin olive oil, lemon zest, oregano."),
    steps: T("1. Frulla olive, capperi e aglio a impulsi brevi: deve restare una crema rustica, non liscia.\n2. Aggiungi l'olio a filo e la scorza di limone grattugiata.\n3. Spalmala sulla focaccia calda appena sfornata o sul pane tostato.\n4. In frigo, coperta d'olio, dura una settimana.", "1. Oliven, Kapern und Knoblauch in kurzen Impulsen pürieren: eine rustikale, nicht glatte Creme.\n2. Das Öl in dünnem Strahl und die geriebene Zitronenschale zugeben.\n3. Auf die warme, frisch gebackene Focaccia oder auf geröstetes Brot streichen.\n4. Im Kühlschrank, mit Öl bedeckt, eine Woche haltbar.", "1. Blitz olives, capers and garlic in short pulses: a rustic spread, not a smooth one.\n2. Add the oil in a thin stream and the grated lemon zest.\n3. Spread on the warm focaccia straight from the oven or on toasted bread.\n4. Covered with oil in the fridge it keeps a week."),
    allergens: T("Nessun allergene principale (controlla capperi e olive).", "Keine Hauptallergene (Kapern und Oliven prüfen).", "No major allergens (check capers and olives)."),
  },
  {
    id: "peperoni", flag: "🫑", mins: 40,
    name: T("Peperoni arrostiti all'olio", "Geröstete Paprika in Öl", "Roasted peppers in oil"),
    place: T("Dopo la cottura · Basilicata e Calabria", "Nach dem Backen · Basilikata und Kalabrien", "After baking · Basilicata and Calabria"),
    ing: T("2 peperoni rossi o gialli, 1 spicchio d'aglio, 4 cucchiai di olio extravergine, sale, prezzemolo o basilico.", "2 rote oder gelbe Paprika, 1 Knoblauchzehe, 4 EL natives Olivenöl extra, Salz, Petersilie oder Basilikum.", "2 red or yellow peppers, 1 garlic clove, 4 tbsp extra virgin olive oil, salt, parsley or basil."),
    steps: T("1. Arrostisci i peperoni interi in forno a 220 °C per 30 minuti, girandoli, finché la pelle è bruciacchiata.\n2. Chiudili 10 minuti in un sacchetto o sotto una ciotola: la pelle poi viene via da sola.\n3. Spellali, togli i semi e tagliali a strisce.\n4. Condisci con olio, aglio a fettine, sale ed erbe. Meglio dopo un'ora di riposo. Sulla focaccia appena sfornata, con un filo del loro olio.", "1. Die ganzen Paprika bei 220 °C 30 Minuten rösten, dabei wenden, bis die Haut angekohlt ist.\n2. 10 Minuten in eine Tüte oder unter eine Schüssel: die Haut löst sich dann von selbst.\n3. Häuten, entkernen und in Streifen schneiden.\n4. Mit Öl, Knoblauchscheiben, Salz und Kräutern anmachen. Am besten nach einer Stunde Ruhe. Auf die frisch gebackene Focaccia, mit etwas von ihrem Öl.", "1. Roast the whole peppers at 220 °C for 30 minutes, turning, until the skin is charred.\n2. Close them 10 minutes in a bag or under a bowl: the skin then slips off.\n3. Peel, deseed and cut into strips.\n4. Dress with oil, sliced garlic, salt and herbs. Best after an hour's rest. On the just-baked focaccia, with a drizzle of their oil."),
    allergens: T("Nessun allergene principale.", "Keine Hauptallergene.", "No major allergens."),
  },
  {
    id: "pesto-rucola", flag: "🌿", mins: 10,
    name: T("Pesto di rucola e mandorle", "Rucola-Mandel-Pesto", "Rocket and almond pesto"),
    place: T("Dopo la cottura · Sud Italia", "Nach dem Backen · Süditalien", "After baking · Southern Italy"),
    ing: T("80 g di rucola, 40 g di mandorle pelate, 40 g di pecorino o parmigiano grattugiato, 1 spicchio d'aglio piccolo, 100 ml di olio extravergine, sale.", "80 g Rucola, 40 g geschälte Mandeln, 40 g geriebener Pecorino oder Parmesan, 1 kleine Knoblauchzehe, 100 ml natives Olivenöl extra, Salz.", "80 g rocket, 40 g blanched almonds, 40 g grated pecorino or Parmesan, 1 small garlic clove, 100 ml extra virgin olive oil, salt."),
    steps: T("1. Tosta le mandorle 3 minuti in padella senza grassi.\n2. Frulla rucola, mandorle, aglio e formaggio con pochi impulsi, aggiungendo l'olio a filo.\n3. Regola di sale. Se è troppo denso, un cucchiaio d'acqua fredda.\n4. Spalmalo sulla focaccia o sulla pizza bianca dopo la cottura, mai prima: la rucola in forno diventa amara.", "1. Die Mandeln 3 Minuten in der Pfanne ohne Fett rösten.\n2. Rucola, Mandeln, Knoblauch und Käse mit wenigen Impulsen pürieren, das Öl in dünnem Strahl zugeben.\n3. Mit Salz abschmecken. Zu dick? Ein Löffel kaltes Wasser.\n4. Nach dem Backen auf Focaccia oder Pizza bianca streichen, nie davor: Rucola wird im Ofen bitter.", "1. Toast the almonds 3 minutes in a dry pan.\n2. Blitz rocket, almonds, garlic and cheese with a few pulses, adding the oil in a thin stream.\n3. Adjust the salt. Too thick? A spoon of cold water.\n4. Spread on focaccia or white pizza after baking, never before: rocket turns bitter in the oven."),
    allergens: T("Contiene frutta a guscio (mandorle) e latte.", "Enthält Schalenfrüchte (Mandeln) und Milch.", "Contains tree nuts (almonds) and milk."),
  },
  {
    id: "stracciatella-acciughe", flag: "🐟", mins: 5,
    name: T("Stracciatella, acciughe e scorza di limone", "Stracciatella, Sardellen und Zitronenschale", "Stracciatella, anchovies and lemon zest"),
    place: T("Dopo la cottura · Puglia", "Nach dem Backen · Apulien", "After baking · Puglia"),
    ing: T("200 g di stracciatella (o burrata), 8 filetti di acciuga sott'olio, scorza di 1 limone, pepe nero, olio extravergine.", "200 g Stracciatella (oder Burrata), 8 Sardellenfilets in Öl, Schale von 1 Zitrone, schwarzer Pfeffer, natives Olivenöl extra.", "200 g stracciatella (or burrata), 8 anchovy fillets in oil, zest of 1 lemon, black pepper, extra virgin olive oil."),
    steps: T("1. Sforna la focaccia o la pizza bianca e lasciala 5 minuti: se è bollente, il formaggio si scioglie e perde freschezza.\n2. Distribuisci la stracciatella a cucchiaiate.\n3. Appoggia le acciughe, grattugia sopra la scorza di limone, pepe e un filo d'olio.\n4. Si mangia subito.", "1. Focaccia oder Pizza bianca aus dem Ofen nehmen und 5 Minuten stehen lassen: zu heiß schmilzt der Käse und verliert die Frische.\n2. Die Stracciatella löffelweise verteilen.\n3. Sardellen darauflegen, Zitronenschale darüberreiben, Pfeffer und etwas Öl.\n4. Sofort essen.", "1. Take the focaccia or white pizza out and leave it 5 minutes: if scorching hot, the cheese melts and loses freshness.\n2. Spoon the stracciatella over.\n3. Lay the anchovies on top, grate the lemon zest over, pepper and a drizzle of oil.\n4. Eat straight away."),
    allergens: T("Contiene latte e pesce.", "Enthält Milch und Fisch.", "Contains milk and fish."),
  },
  {
    id: "olio-rosmarino", flag: "🍞", mins: 10,
    name: T("Olio all'aglio e rosmarino per il pane", "Knoblauch-Rosmarin-Öl fürs Brot", "Garlic and rosemary oil for bread"),
    place: T("Da intingere · Toscana", "Zum Tunken · Toskana", "For dipping · Tuscany"),
    ing: T("100 ml di olio extravergine, 2 spicchi d'aglio, 1 rametto di rosmarino, sale in fiocchi, peperoncino a piacere.", "100 ml natives Olivenöl extra, 2 Knoblauchzehen, 1 Zweig Rosmarin, Salzflocken, Chili nach Belieben.", "100 ml extra virgin olive oil, 2 garlic cloves, 1 sprig of rosemary, flaky salt, chilli to taste."),
    steps: T("1. Schiaccia gli spicchi d'aglio con la lama del coltello, senza sbucciarli del tutto.\n2. Scalda l'olio in un pentolino a fuoco bassissimo con aglio e rosmarino per 5 minuti: non deve friggere, solo profumare.\n3. Spegni, lascia raffreddare e togli l'aglio.\n4. Versa in un piattino con il sale in fiocchi: il pane caldo si intinge lì. Preparalo al momento, non conservarlo.", "1. Die Knoblauchzehen mit der Messerklinge andrücken, nicht ganz schälen.\n2. Das Öl mit Knoblauch und Rosmarin 5 Minuten bei kleinster Hitze erwärmen: es darf nicht braten, nur Duft annehmen.\n3. Ausschalten, abkühlen lassen, Knoblauch entfernen.\n4. In ein Schälchen mit Salzflocken gießen: das warme Brot wird darin getunkt. Frisch zubereiten, nicht aufbewahren.", "1. Crush the garlic cloves with the flat of a knife, without fully peeling.\n2. Warm the oil in a small pan over the lowest heat with garlic and rosemary for 5 minutes: it must not fry, just take on the scent.\n3. Turn off, let cool and remove the garlic.\n4. Pour into a small dish with flaky salt: warm bread gets dipped in it. Make it fresh, don't store it."),
    allergens: T("Nessun allergene principale.", "Keine Hauptallergene.", "No major allergens."),
  },
];
