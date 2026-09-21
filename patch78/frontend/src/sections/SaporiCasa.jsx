import { mkTri, triFR, triFA } from "@/i18n/triMaps";
import { useState, useEffect } from "react";
import { ChevronRight, Wheat, UtensilsCrossed, Grid3x3, Flame, Droplets, Clock, MapPin, BookOpen } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { recipesApi } from "@/lib/api";
import { rLoc } from "@/lib/loc";
import { CUSTODITE_RECIPES, CUSTODITE_PLACE } from "@/sections/RicetteCustodite";

// V78 — Il Sud in ordine: tutte le ricette del Sud (Basilicata e Puglia), ognuna con la sua descrizione.
// Le ricette "custodite" arrivano da Ricette Custodite (5 lingue); i testi propri di Sapori di Casa sono qui sotto.
const OWN = {
  matera: {
    name: { it: "Pane di Matera IGP (casalingo)", de: "Materaner Brot g.g.A. (hausgemacht)", en: "Bread of Matera PGI (home-baked)", es: "Pan de Matera IGP (casero)", fr: "Pain de Matera IGP (fait maison)" },
    tag: { it: "Lievito Madre · Semola", de: "Sauerteig · Hartweizengrieß", en: "Sourdough · Semolina", es: "Masa madre · Sémola", fr: "Levain · Semoule" },
    body: {
      it: "Solo semola rimacinata di grano duro, lievito madre e un'idratazione generosa (~80%): la classica forma a cornetto, crosta spessa e croccante, mollica gialla e ben alveolata. A casa dà il meglio su pietra refrattaria rovente, con un colpo di vapore nei primi 10 minuti.",
      de: "Nur fein gemahlener Hartweizengrieß, Sauerteig und eine großzügige Hydration (~80 %): die klassische Hörnchenform, dicke knusprige Kruste, gelbe, gut löchrige Krume. Zu Hause gelingt es am besten auf dem glühend heißen Backstein, mit einem Dampfstoß in den ersten 10 Minuten.",
      en: "Only finely milled durum semolina, sourdough and generous hydration (~80%): the classic croissant-like shape, thick crunchy crust, yellow and open crumb. At home it works best on a red-hot baking stone, with a burst of steam in the first 10 minutes.",
      es: "Solo sémola remolida de trigo duro, masa madre y una hidratación generosa (~80 %): la clásica forma de cuerno, corteza gruesa y crujiente, miga amarilla y bien alveolada. En casa queda mejor sobre piedra refractaria muy caliente, con un golpe de vapor en los primeros 10 minutos.",
      fr: "Uniquement de la semoule de blé dur remoulue, du levain et une hydratation généreuse (~80 %) : la forme classique en cornet, croûte épaisse et croustillante, mie jaune et bien alvéolée. À la maison, elle réussit le mieux sur une pierre réfractaire brûlante, avec un coup de vapeur pendant les 10 premières minutes.",
    },
  },
  focaccia_barese: {
    name: { it: "Focaccia Barese (Pugliese)", de: "Focaccia aus Bari (apulisch)", en: "Bari Focaccia (Apulian)", es: "Focaccia Barese (pugliesa)", fr: "Focaccia Barese (des Pouilles)" },
    tag: { it: "Diretto · Patata", de: "Direkt · Kartoffel", en: "Direct · Potato", es: "Directo · Patata", fr: "Direct · Pomme de terre" },
    body: {
      it: "Il segreto è la patata lessa nell'impasto, che tiene la mollica soffice e umida per ore, insieme a semola e farina 0. In superficie pomodorini schiacciati a mano, olive baresane, origano e un filo generoso di extravergine. Teglia unta e ben calda dal basso per una base dorata.",
      de: "Das Geheimnis ist die gekochte Kartoffel im Teig, die die Krume stundenlang weich und saftig hält, zusammen mit Grieß und Mehl Typ 550. Obendrauf von Hand zerdrückte Kirschtomaten, Oliven aus Bari, Oregano und ein großzügiger Schuss Olivenöl. Gefettetes Blech, von unten gut heiß für einen goldenen Boden.",
      en: "The secret is the boiled potato in the dough, which keeps the crumb soft and moist for hours, together with semolina and bread flour. On top: hand-crushed cherry tomatoes, Bari olives, oregano and a generous drizzle of olive oil. Oiled pan, well heated from below for a golden base.",
      es: "El secreto es la patata cocida en la masa, que mantiene la miga suave y húmeda durante horas, junto con sémola y harina de fuerza media. Por encima, tomatitos aplastados a mano, aceitunas de Bari, orégano y un buen chorro de aceite de oliva. Bandeja untada y bien caliente por abajo para una base dorada.",
      fr: "Le secret, c'est la pomme de terre bouillie dans la pâte, qui garde la mie moelleuse et humide pendant des heures, avec de la semoule et de la farine T65. Dessus : tomates cerises écrasées à la main, olives de Bari, origan et un généreux filet d'huile d'olive. Plaque huilée et bien chaude par-dessous pour un fond doré.",
    },
  },
  focaccia_materana: {
    name: { it: "Focaccia Materana alla Semola", de: "Materaner Grießfocaccia", en: "Matera Semolina Focaccia", es: "Focaccia Materana de Sémola", fr: "Focaccia de Matera à la Semoule" },
    tag: { it: "Semola · Alta idratazione", de: "Grieß · Hohe Hydration", en: "Semolina · High hydration", es: "Sémola · Alta hidratación", fr: "Semoule · Forte hydratation" },
    body: {
      it: "100% semola rimacinata, alta idratazione e lunga maturazione per un profumo intenso di grano. Croccante fuori, alveolata e leggera dentro. La rifinisco con extravergine, sale grosso e rosmarino appena colto.",
      de: "100 % fein gemahlener Grieß, hohe Hydration und lange Reifung für ein intensives Getreidearoma. Außen knusprig, innen löchrig und leicht. Zum Schluss gebe ich Olivenöl, grobes Salz und frisch geschnittenen Rosmarin darauf.",
      en: "100% finely milled semolina, high hydration and long maturation for an intense grain aroma. Crisp outside, open and light inside. I finish it with olive oil, coarse salt and freshly cut rosemary.",
      es: "100 % sémola remolida, alta hidratación y larga maduración para un aroma intenso a trigo. Crujiente por fuera, alveolada y ligera por dentro. La termino con aceite de oliva, sal gruesa y romero recién cortado.",
      fr: "100 % semoule remoulue, forte hydratation et longue maturation pour un intense parfum de blé. Croustillante dehors, alvéolée et légère dedans. Je la termine avec de l'huile d'olive, du gros sel et du romarin fraîchement cueilli.",
    },
  },
  taralli: {
    name: { it: "Taralli al Finocchietto", de: "Taralli mit Fenchel", en: "Fennel Taralli", es: "Taralli al Hinojo", fr: "Taralli au Fenouil" },
    tag: { it: "Sbollentati · Croccanti", de: "Blanchiert · Knusprig", en: "Blanched · Crunchy", es: "Escaldados · Crujientes", fr: "Blanchis · Croustillants" },
    body: {
      it: "Farina, vino bianco, extravergine e semi di finocchietto: si formano ad anello, si sbollentano un istante in acqua e poi si dorano in forno. Fragranti, leggeri e irresistibili, perfetti con un bicchiere di vino.",
      de: "Mehl, Weißwein, Olivenöl und Fenchelsamen: Man formt Ringe, brüht sie kurz in Wasser ab und bäckt sie dann goldbraun. Knusprig, leicht und unwiderstehlich, perfekt zu einem Glas Wein.",
      en: "Flour, white wine, olive oil and fennel seeds: shaped into rings, briefly blanched in water, then baked until golden. Fragrant, light and irresistible, perfect with a glass of wine.",
      es: "Harina, vino blanco, aceite de oliva y semillas de hinojo: se forman en anillo, se escaldan un instante en agua y luego se doran en el horno. Fragantes, ligeros e irresistibles, perfectos con una copa de vino.",
      fr: "Farine, vin blanc, huile d'olive et graines de fenouil : on les façonne en anneaux, on les blanchit un instant dans l'eau, puis on les dore au four. Croustillants, légers et irrésistibles, parfaits avec un verre de vin.",
    },
  },
  strazzate: {
    name: { it: "Strazzate Materane", de: "Strazzate aus Matera", en: "Strazzate of Matera", es: "Strazzate de Matera", fr: "Strazzate de Matera" },
    tag: { it: "Dolce · Mandorle", de: "Süß · Mandeln", en: "Sweet · Almonds", es: "Dulce · Almendras", fr: "Sucré · Amandes" },
    body: {
      it: "Dolcetti rustici di Matera con mandorle tostate, cacao, caffè e un goccio di liquore. Volutamente irregolari — da qui il nome «strazzate» — croccanti fuori e morbidi nel cuore. Nati per accompagnare il caffè.",
      de: "Rustikale Süßigkeiten aus Matera mit gerösteten Mandeln, Kakao, Kaffee und einem Schuss Likör. Bewusst unregelmäßig — daher der Name „strazzate“ (zerrissen) — außen knusprig, innen weich. Entstanden, um zum Kaffee gereicht zu werden.",
      en: "Rustic sweets from Matera with toasted almonds, cocoa, coffee and a splash of liqueur. Deliberately irregular — hence the name “strazzate” (torn) — crunchy outside, soft inside. Made to go with coffee.",
      es: "Dulces rústicos de Matera con almendras tostadas, cacao, café y un chorrito de licor. Deliberadamente irregulares —de ahí el nombre «strazzate» (desgarradas)— crujientes por fuera y tiernos por dentro. Nacidos para acompañar el café.",
      fr: "Douceurs rustiques de Matera aux amandes grillées, cacao, café et un doigt de liqueur. Volontairement irrégulières — d'où le nom « strazzate » (déchirées) — croustillantes dehors, moelleuses dedans. Nées pour accompagner le café.",
    },
  },
};

// Ordine di lettura: prima Basilicata, poi Puglia. "cust" = scheda in Ricette Custodite (dosi e procedimento).
const SOUTH = [
  { key: "matera", region: "basilicata", emoji: "🥖", cust: "matera", own: OWN.matera },
  { key: "pane_basilicata", region: "basilicata", emoji: "🍞", cust: "pane_basilicata" },
  { key: "pane_cafone_lucano", region: "basilicata", emoji: "🍞", cust: "pane_cafone_lucano" },
  { key: "pane_patate_lucano", region: "basilicata", emoji: "🥔", cust: "pane_patate_lucano" },
  { key: "focaccia_lucana", region: "basilicata", emoji: "🌶️", cust: "focaccia_lucana" },
  { key: "focaccia_materana", region: "basilicata", emoji: "🌾", own: OWN.focaccia_materana },
  { key: "strazzate", region: "basilicata", emoji: "🍪", own: OWN.strazzate },
  { key: "altamura", region: "puglia", emoji: "🥖", cust: "altamura" },
  { key: "focaccia_barese", region: "puglia", emoji: "🫓", cust: "focaccia_barese", own: OWN.focaccia_barese },
  { key: "taralli", region: "puglia", emoji: "🥨", cust: "taralli", own: OWN.taralli },
  { key: "friselle", region: "puglia", emoji: "🍞", cust: "friselle" },
  { key: "puccia", region: "puglia", emoji: "🫓", cust: "puccia" },
];
// Altre ricette del Sud che stanno già nel ricettario (si aprono direttamente da qui).
const SOUTH_SEED = [
  { name: "Focaccia di Matera", region: "basilicata", emoji: "🫓" },
  { name: "Pane Pugliese", region: "puglia", emoji: "🍞" },
  { name: "Focaccia di Altamura", region: "puglia", emoji: "🫓" },
];

const PASTA = [
  { emoji: "🌀", name: "Orecchiette",
    dough: "Semola rimacinata + acqua tiepida (no uovo)",
    tech: "Si trascina un pezzetto di pasta col coltello e si rovescia sul pollice per formare la classica «orecchietta». Superficie ruvida che trattiene il sugo.",
    sauce: "Cime di rapa, aglio, acciuga e peperoncino — il piatto simbolo di Bari." },
  { emoji: "〰️", name: "Cavatelli / Rascatelli",
    dough: "Semola rimacinata + acqua",
    tech: "Cordoncini tagliati e «scavati» con due dita o coi ferri, incavo che raccoglie il condimento. I Rascatelli lucani sono più lunghi e affusolati.",
    sauce: "Cozze e fagioli (Puglia) oppure sugo di salsiccia e cacioricotta (Basilicata)." },
  { emoji: "🍝", name: "Fettuccelle",
    dough: "Semola + uova (o semola + acqua per la versione povera)",
    tech: "Sfoglia tirata sottile, arrotolata e tagliata a nastrini stretti (~5 mm). Asciugatura breve prima della cottura.",
    sauce: "Ragù di braciole al sugo, la domenica materana per eccellenza." },
];

const MATRIX = [
  ["Semola rimacinata di grano duro", "Orecchiette · Cavatelli · Rascatelli · Strascinati", "Acqua tiepida, impasto sodo lavorato a lungo"],
  ["Semola + uova", "Fettuccelle · Tagliatelle · Maltagliati", "Sfoglia elastica, riposo 30 min sotto panno"],
  ["Farina 00 + uova", "Ravioli · Tortelli · Lasagne", "Sfoglia sottile e liscia per ripieni"],
  ["Grano arso (tostato) + semola", "Orecchiette di grano arso", "Note affumicate, mix 20–30% grano arso"],
];

export default function SaporiCasa({ onBack, onOpenCustodite = null, onOpenRecipe = null }) {
  const { lang } = useLang();
  const L = (i, d, e, s) => mkTri(lang)(i, d, e, s);
  const pick = (o) => {
    if (!o) return "";
    if (o[lang]) return o[lang];
    if (lang === "fa") return triFA(o.it) ?? o.en ?? o.it;
    if (lang === "fr") return triFR(o.it) ?? o.en ?? o.it;
    return o.en ?? o.it;
  };
  const [tab, setTab] = useState("forno");
  const [seedSouth, setSeedSouth] = useState([]);
  useEffect(() => {
    let alive = true;
    recipesApi.list("mikilab").then((rows) => {
      if (!alive) return;
      const by = {};
      (rows || []).forEach((r) => { by[r.name] = r; });
      setSeedSouth(SOUTH_SEED.map((x) => (by[x.name] ? { ...x, recipe: by[x.name] } : null)).filter(Boolean));
    }).catch(() => {});
    return () => { alive = false; };
  }, []);
  const custBy = (id) => CUSTODITE_RECIPES.find((c) => c.id === id);
  const openLabel = { it: "Apri dosi e procedimento", de: "Mengen & Zubereitung öffnen", en: "Open amounts & method", es: "Abrir cantidades y procedimiento", fr: "Ouvrir quantités et méthode" };
  const cardOf = (x) => {
    const c = x.cust ? custBy(x.cust) : null;
    const name = x.own ? pick(x.own.name) : pick(c && c.name);
    const body = x.own ? pick(x.own.body) : pick(c && c.story);
    const tag = x.own ? pick(x.own.tag) : pick(c && c.place);
    return (
      <div key={x.key} data-testid={`sud-${x.key}`} className="rounded-2xl bg-background dark:bg-card border border-border dark:border-border p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">{x.emoji}</span>
          <p className="font-display text-lg font-bold text-primary dark:text-foreground leading-tight flex-1">{name}</p>
        </div>
        <span className="inline-block text-[10px] font-bold uppercase tracking-wide bg-card text-primary px-2 py-0.5 rounded-full mb-2">{tag}</span>
        <p className="text-[13.5px] text-primary dark:text-muted-foreground leading-relaxed">{body}</p>
        {c && onOpenCustodite && (
          <button data-testid={`sud-open-${x.key}`} onClick={() => onOpenCustodite(c.id)}
            className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] font-bold text-primary active:scale-95 transition-transform">
            <BookOpen className="w-4 h-4" /> {pick(openLabel)}
          </button>
        )}
      </div>
    );
  };
  const cardOfSeed = (x) => {
    const r = x.recipe;
    const notes = String(rLoc(r, "notes", lang) || "").split("\n\n")[0];
    return (
      <div key={`seed-${r.id}`} data-testid={`sud-ricettario-${r.id}`} className="rounded-2xl bg-background dark:bg-card border border-border dark:border-border p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">{x.emoji}</span>
          <p className="font-display text-lg font-bold text-primary dark:text-foreground leading-tight flex-1">{rLoc(r, "name", lang)}</p>
        </div>
        <span className="inline-block text-[10px] font-bold uppercase tracking-wide bg-card text-primary px-2 py-0.5 rounded-full mb-2">{pick({ it: "Dal ricettario", de: "Aus dem Rezeptbuch", en: "From the recipe book", es: "Del recetario", fr: "Du livre de recettes" })}</span>
        {notes && <p className="text-[13.5px] text-primary dark:text-muted-foreground leading-relaxed line-clamp-4">{notes}</p>}
        {onOpenRecipe && (
          <button data-testid={`sud-ricettario-open-${r.id}`} onClick={() => onOpenRecipe(r.id)}
            className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] font-bold text-primary active:scale-95 transition-transform">
            <BookOpen className="w-4 h-4" /> {pick(openLabel)}
          </button>
        )}
      </div>
    );
  };

  const TABS = [
    { id: "forno", Icon: Wheat, label: L("Forno", "Ofen", "Bakery", "Horno") },
    { id: "pasta", Icon: UtensilsCrossed, label: L("Pasta", "Pasta", "Pasta", "Pasta") },
    { id: "matrix", Icon: Grid3x3, label: L("Pasta Matrix", "Matrix", "Matrix", "Matrix") },
    { id: "casa", Icon: Flame, label: L("Forno di Casa", "Heimofen", "Home oven", "Horno casero") },
  ];

  return (
    <div className="pb-8" data-testid="sapori-casa">
      {onBack && <button data-testid="sapori-back" onClick={onBack} className="flex items-center gap-1 text-primary font-medium mb-4">
        <ChevronRight className="w-5 h-5 rotate-180" /> {L("Indietro", "Zurück", "Back", "Atrás")}
      </button>}

      <div className="relative overflow-hidden rounded-3xl p-6 text-foreground shadow-xl mb-4"
        style={{ background: "linear-gradient(135deg,hsl(var(--primary)) 0%,hsl(var(--primary)) 55%,hsl(var(--primary)) 100%)" }}>
        <div aria-hidden className="absolute -right-6 -top-6 w-36 h-36 rounded-full opacity-25" style={{ background: "radial-gradient(circle,hsl(var(--foreground)),transparent 70%)" }} />
        <span className="inline-block text-[11px] font-bold uppercase tracking-widest text-foreground mb-1">Matera & Puglia</span>
        <h1 className="font-display text-2xl sm:text-3xl font-bold leading-tight">{L("Sapori di Casa", "Geschmack von zu Hause", "Home Flavours", "Sabores de Casa")}</h1>
        <p className="text-foreground/85 text-sm mt-2 leading-snug">{L("Arte Bianca e pasta fatta in casa della mia terra: Matera e Puglia. Pane, focacce, taralli, orecchiette e i condimenti della tradizione.", "Backkunst und hausgemachte Pasta aus meiner Heimat.", "Baking craft and homemade pasta from my homeland.", "Arte blanco y pasta casera de mi tierra.")}</p>
      </div>

      <div className="flex gap-1.5 bg-card p-1.5 rounded-2xl mb-5 border border-border">
        {TABS.map(({ id, Icon, label }) => (
          <button key={id} data-testid={`sapori-tab-${id}`} onClick={() => setTab(id)}
            className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-2xl shadow-md border border-amber-900/40 text-[11px] font-bold transition-all ${tab === id ? "bg-primary text-primary-foreground shadow" : "text-primary"}`}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {tab === "forno" && (
        <div className="space-y-3" data-testid="sapori-forno">
          <p className="text-[13px] text-primary px-1 leading-relaxed" data-testid="sapori-forno-intro">
            {pick({ it: "Tutte le ricette del Sud in un posto solo: Basilicata e Puglia, ognuna con la sua descrizione. Tocca «Apri» per dosi e procedimento.", de: "Alle Rezepte des Südens an einem Ort: Basilikata und Apulien, jeweils mit Beschreibung. Tippe auf „Öffnen“ für Mengen und Zubereitung.", en: "All the recipes of the South in one place: Basilicata and Apulia, each with its description. Tap “Open” for amounts and method.", es: "Todas las recetas del Sur en un solo lugar: Basilicata y Apulia, cada una con su descripción. Toca «Abrir» para ver cantidades y procedimiento.", fr: "Toutes les recettes du Sud au même endroit : Basilicate et Pouilles, chacune avec sa description. Touche « Ouvrir » pour les quantités et la méthode." })}
          </p>
          {["basilicata", "puglia"].map((reg) => (
            <div key={reg} className="space-y-3" data-testid={`sud-region-${reg}`}>
              <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-muted-foreground pt-2 px-1">
                <MapPin className="w-3.5 h-3.5" /> {pick(CUSTODITE_PLACE[reg])}
              </p>
              {SOUTH.filter((x) => x.region === reg).map(cardOf)}
              {seedSouth.filter((x) => x.region === reg).map(cardOfSeed)}
            </div>
          ))}
        </div>
      )}

      {tab === "pasta" && (
        <div className="space-y-3" data-testid="sapori-pasta">
          <p className="text-[13px] text-primary px-1 leading-relaxed">{L("La pasta fresca del Sud parte quasi sempre dalla semola rimacinata di grano duro e acqua. Ecco i tre formati che preparo più spesso, con la tecnica e il condimento tradizionale.", "Frische Pasta aus dem Süden.", "Southern fresh pasta.", "Pasta fresca del sur.")}</p>
          {PASTA.map((p, i) => (
            <div key={i} data-testid={`pasta-${i}`} className="rounded-2xl bg-background dark:bg-card border border-border dark:border-border p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{p.emoji}</span>
                <p className="font-display text-lg font-bold text-primary dark:text-foreground leading-tight">{p.name}</p>
              </div>
              <div className="space-y-1.5 text-[13px]">
                <p className="text-primary dark:text-muted-foreground"><span className="font-bold text-primary">{L("Impasto:", "Teig:", "Dough:", "Masa:")} </span>{p.dough}</p>
                <p className="text-primary dark:text-muted-foreground"><span className="font-bold text-primary">{L("Tecnica:", "Technik:", "Technique:", "Técnica:")} </span>{p.tech}</p>
                <p className="text-primary dark:text-muted-foreground"><span className="font-bold text-primary">{L("Condimento:", "Sauce:", "Sauce:", "Condimento:")} </span>{p.sauce}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "matrix" && (
        <div data-testid="sapori-matrix" className="rounded-2xl overflow-hidden border border-border dark:border-border shadow-sm">
          <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center gap-2"><Grid3x3 className="w-5 h-5" /><p className="font-display text-lg font-bold">Pasta Matrix MikiLab</p></div>
          <p className="text-[12px] text-primary bg-card px-4 py-2">{L("Abbina la farina/semola al formato ideale di pasta fresca.", "Mehl → ideales Pasta-Format.", "Match flour → ideal fresh pasta format.", "Empareja harina → formato ideal.")}</p>
          <div className="divide-y divide-border dark:divide-border">
            {MATRIX.map((row, i) => (
              <div key={i} data-testid={`matrix-row-${i}`} className="bg-background dark:bg-card p-3.5">
                <p className="font-bold text-[13.5px] text-primary flex items-center gap-1.5"><Wheat className="w-4 h-4" /> {row[0]}</p>
                <p className="text-[13px] text-primary dark:text-foreground mt-1 font-semibold">→ {row[1]}</p>
                <p className="text-[12px] text-primary dark:text-muted-foreground mt-0.5">{row[2]}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "casa" && (
        <div className="space-y-3" data-testid="sapori-casa-oven">
          <div className="rounded-2xl bg-background dark:bg-card border border-border dark:border-border p-4 shadow-sm">
            <p className="font-display text-lg font-bold text-primary flex items-center gap-2 mb-2"><Flame className="w-5 h-5" /> {L("Pietra refrattaria", "Backstein", "Baking stone", "Piedra refractaria")}</p>
            <ul className="text-[13.5px] text-primary dark:text-muted-foreground leading-relaxed space-y-1.5 list-disc pl-4">
              <li>{L("Preriscalda la pietra almeno 45–60 minuti al massimo (250°C).", "Stein 45–60 min bei 250°C vorheizen.", "Preheat the stone 45–60 min at 250°C.", "Precalienta la piedra 45–60 min a 250°C.")}</li>
              <li>{L("Inforna con una pala o su carta forno: la base parte subito col colpo di calore.", "Mit Schießer einschießen für sofortigen Hitzeschub.", "Load with a peel for an immediate heat kick.", "Carga con pala para un golpe de calor inmediato.")}</li>
              <li>{L("Ultimi minuti: sposta il pane sulla griglia per asciugare la base.", "Zum Schluss aufs Gitter für trockene Kruste.", "Finish on the rack to dry the base.", "Termina en la rejilla para secar la base.")}</li>
            </ul>
          </div>
          <div className="rounded-2xl bg-background dark:bg-card border border-border dark:border-border p-4 shadow-sm">
            <p className="font-display text-lg font-bold text-primary flex items-center gap-2 mb-2"><Droplets className="w-5 h-5" /> {L("Gestione del vapore", "Dampf steuern", "Steam management", "Gestión del vapor")}</p>
            <ul className="text-[13.5px] text-primary dark:text-muted-foreground leading-relaxed space-y-1.5 list-disc pl-4">
              <li>{L("Metti una teglia bassa sul fondo: appena inforni, versa mezzo bicchiere d'acqua bollente.", "Blech unten: beim Einschießen heißes Wasser eingießen.", "Tray on the bottom: pour hot water as you load.", "Bandeja abajo: vierte agua caliente al cargar.")}</li>
              <li>{L("Oppure cuoci in pentola con coperchio (effetto forno a vapore) per i primi 20 minuti.", "Oder im Topf mit Deckel die ersten 20 min backen.", "Or bake in a covered pot for the first 20 min.", "O cuece en olla tapada los primeros 20 min.")}</li>
              <li>{L("Togli il vapore a metà cottura per far sviluppare crosta e colore.", "Nach der Hälfte Dampf ablassen für Kruste & Farbe.", "Release steam halfway for crust and colour.", "Libera el vapor a mitad para corteza y color.")}</li>
              <li className="flex items-start gap-1"><Clock className="w-4 h-4 shrink-0 mt-0.5" /> {L("Regola generale: 10 min di vapore + 20–30 min a secco.", "Faustregel: 10 min Dampf + 20–30 min trocken.", "Rule of thumb: 10 min steam + 20–30 min dry.", "Regla: 10 min vapor + 20–30 min en seco.")}</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
