import { mkTri } from "@/i18n/triMaps";
import { useState } from "react";
import { ChevronRight, Wheat, UtensilsCrossed, Grid3x3, Flame, Droplets, Clock } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";

const BREADS = [
  { emoji: "🥖", name: "Pane di Matera IGP (casalingo)",
    body: "Semola rimacinata di grano duro, lievito madre, alta idratazione (~80%) e la classica forma a cornetto. Crosta spessa e mollica gialla e alveolata. In casa: cottura su pietra refrattaria molto calda con vapore nei primi 10 minuti.",
    tag: "Lievito Madre · Semola" },
  { emoji: "🫓", name: "Focaccia Barese (Pugliese)",
    body: "Impasto con patata lessa (rende la mollica soffice e umida a lungo), semola e farina 0. Sopra: pomodorini schiacciati, olive baresane, origano e olio extravergine. Teglia unta e ben calda dal basso.",
    tag: "Diretto · Patata" },
  { emoji: "🌾", name: "Focaccia Materana alla Semola",
    body: "100% semola rimacinata, alta idratazione e lunga maturazione. Croccante fuori, alveolata dentro. Filo d'olio, sale grosso e rosmarino.",
    tag: "Semola · Alta idratazione" },
  { emoji: "🥨", name: "Taralli al Finocchietto",
    body: "Farina, vino bianco, olio extravergine e semi di finocchietto. Si formano ad anello, si sbollentano in acqua e poi si cuociono in forno fino a doratura: fragranti e leggeri.",
    tag: "Sbollentati · Croccanti" },
  { emoji: "🍪", name: "Strazzate Materane",
    body: "Dolcetti tipici di Matera con mandorle tostate, cacao, caffè e un goccio di liquore. Rustici e irregolari (da qui il nome «strazzate»). Perfetti con il caffè.",
    tag: "Dolce · Mandorle" },
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

export default function SaporiCasa({ onBack }) {
  const { lang } = useLang();
  const L = (i, d, e, s) => mkTri(lang)(i, d, e, s);
  const [tab, setTab] = useState("forno");

  const TABS = [
    { id: "forno", Icon: Wheat, label: L("Forno", "Ofen", "Bakery", "Horno") },
    { id: "pasta", Icon: UtensilsCrossed, label: L("Pasta", "Pasta", "Pasta", "Pasta") },
    { id: "matrix", Icon: Grid3x3, label: L("Pasta Matrix", "Matrix", "Matrix", "Matrix") },
    { id: "casa", Icon: Flame, label: L("Forno di Casa", "Heimofen", "Home oven", "Horno casero") },
  ];

  return (
    <div className="pb-8" data-testid="sapori-casa">
      {onBack && <button data-testid="sapori-back" onClick={onBack} className="flex items-center gap-1 text-[#ff6b00] font-medium mb-4">
        <ChevronRight className="w-5 h-5 rotate-180" /> {L("Indietro", "Zurück", "Back", "Atrás")}
      </button>}

      <div className="relative overflow-hidden rounded-3xl p-6 text-[#161616] shadow-xl mb-4"
        style={{ background: "linear-gradient(135deg,#ff6b00 0%,#ff6b00 55%,#ff6b00 100%)" }}>
        <div aria-hidden className="absolute -right-6 -top-6 w-36 h-36 rounded-full opacity-25" style={{ background: "radial-gradient(circle,#ffffff,transparent 70%)" }} />
        <span className="inline-block text-[11px] font-bold uppercase tracking-widest text-[#ffffff] mb-1">Matera & Puglia</span>
        <h1 className="font-display text-2xl sm:text-3xl font-bold leading-tight">{L("Sapori di Casa", "Geschmack von zu Hause", "Home Flavours", "Sabores de Casa")}</h1>
        <p className="text-[#161616]/85 text-sm mt-2 leading-snug">{L("Arte Bianca e pasta fatta in casa della mia terra: Matera e Puglia. Pane, focacce, taralli, orecchiette e i condimenti della tradizione.", "Backkunst und hausgemachte Pasta aus meiner Heimat.", "Baking craft and homemade pasta from my homeland.", "Arte blanco y pasta casera de mi tierra.")}</p>
      </div>

      <div className="flex gap-1.5 bg-[#1a1a1a] p-1.5 rounded-2xl mb-5 border border-[#2b2b2b]">
        {TABS.map(({ id, Icon, label }) => (
          <button key={id} data-testid={`sapori-tab-${id}`} onClick={() => setTab(id)}
            className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl text-[11px] font-bold transition-all ${tab === id ? "bg-[#ff6b00] text-[#161616] shadow" : "text-[#ff6b00]"}`}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {tab === "forno" && (
        <div className="space-y-3" data-testid="sapori-forno">
          {BREADS.map((b, i) => (
            <div key={i} data-testid={`bread-${i}`} className="rounded-2xl bg-[#121212] dark:bg-[#1e1e1e] border border-[#2b2b2b] dark:border-[#2e2e2e] p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{b.emoji}</span>
                <p className="font-display text-lg font-bold text-[#ff6b00] dark:text-[#e4eff8] leading-tight flex-1">{b.name}</p>
              </div>
              <span className="inline-block text-[10px] font-bold uppercase tracking-wide bg-[#ffffff] text-[#ff6b00] px-2 py-0.5 rounded-full mb-2">{b.tag}</span>
              <p className="text-[13.5px] text-[#ff6b00] dark:text-[#AEB8BF] leading-relaxed">{b.body}</p>
            </div>
          ))}
        </div>
      )}

      {tab === "pasta" && (
        <div className="space-y-3" data-testid="sapori-pasta">
          <p className="text-[13px] text-[#ff6b00] px-1 leading-relaxed">{L("La pasta fresca del Sud parte quasi sempre dalla semola rimacinata di grano duro e acqua. Ecco i tre formati che preparo più spesso, con la tecnica e il condimento tradizionale.", "Frische Pasta aus dem Süden.", "Southern fresh pasta.", "Pasta fresca del sur.")}</p>
          {PASTA.map((p, i) => (
            <div key={i} data-testid={`pasta-${i}`} className="rounded-2xl bg-[#121212] dark:bg-[#1e1e1e] border border-[#2b2b2b] dark:border-[#2e2e2e] p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{p.emoji}</span>
                <p className="font-display text-lg font-bold text-[#ff6b00] dark:text-[#e4eff8] leading-tight">{p.name}</p>
              </div>
              <div className="space-y-1.5 text-[13px]">
                <p className="text-[#ff6b00] dark:text-[#AEB8BF]"><span className="font-bold text-[#ff6b00]">{L("Impasto:", "Teig:", "Dough:", "Masa:")} </span>{p.dough}</p>
                <p className="text-[#ff6b00] dark:text-[#AEB8BF]"><span className="font-bold text-[#ff6b00]">{L("Tecnica:", "Technik:", "Technique:", "Técnica:")} </span>{p.tech}</p>
                <p className="text-[#ff6b00] dark:text-[#AEB8BF]"><span className="font-bold text-[#ff6b00]">{L("Condimento:", "Sauce:", "Sauce:", "Condimento:")} </span>{p.sauce}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "matrix" && (
        <div data-testid="sapori-matrix" className="rounded-2xl overflow-hidden border border-[#2b2b2b] dark:border-[#2e2e2e] shadow-sm">
          <div className="bg-[#ff6b00] text-[#161616] px-4 py-3 flex items-center gap-2"><Grid3x3 className="w-5 h-5" /><p className="font-display text-lg font-bold">Pasta Matrix MikiLab</p></div>
          <p className="text-[12px] text-[#ff6b00] bg-[#1a1a1a] px-4 py-2">{L("Abbina la farina/semola al formato ideale di pasta fresca.", "Mehl → ideales Pasta-Format.", "Match flour → ideal fresh pasta format.", "Empareja harina → formato ideal.")}</p>
          <div className="divide-y divide-[#2b2b2b] dark:divide-[#2e2e2e]">
            {MATRIX.map((row, i) => (
              <div key={i} data-testid={`matrix-row-${i}`} className="bg-[#121212] dark:bg-[#1e1e1e] p-3.5">
                <p className="font-bold text-[13.5px] text-[#ff6b00] flex items-center gap-1.5"><Wheat className="w-4 h-4" /> {row[0]}</p>
                <p className="text-[13px] text-[#ff6b00] dark:text-[#e4eff8] mt-1 font-semibold">→ {row[1]}</p>
                <p className="text-[12px] text-[#ff6b00] dark:text-[#AEB8BF] mt-0.5">{row[2]}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "casa" && (
        <div className="space-y-3" data-testid="sapori-casa-oven">
          <div className="rounded-2xl bg-[#121212] dark:bg-[#1e1e1e] border border-[#2b2b2b] dark:border-[#2e2e2e] p-4 shadow-sm">
            <p className="font-display text-lg font-bold text-[#ff6b00] flex items-center gap-2 mb-2"><Flame className="w-5 h-5" /> {L("Pietra refrattaria", "Backstein", "Baking stone", "Piedra refractaria")}</p>
            <ul className="text-[13.5px] text-[#ff6b00] dark:text-[#AEB8BF] leading-relaxed space-y-1.5 list-disc pl-4">
              <li>{L("Preriscalda la pietra almeno 45–60 minuti al massimo (250°C).", "Stein 45–60 min bei 250°C vorheizen.", "Preheat the stone 45–60 min at 250°C.", "Precalienta la piedra 45–60 min a 250°C.")}</li>
              <li>{L("Inforna con una pala o su carta forno: la base parte subito col colpo di calore.", "Mit Schießer einschießen für sofortigen Hitzeschub.", "Load with a peel for an immediate heat kick.", "Carga con pala para un golpe de calor inmediato.")}</li>
              <li>{L("Ultimi minuti: sposta il pane sulla griglia per asciugare la base.", "Zum Schluss aufs Gitter für trockene Kruste.", "Finish on the rack to dry the base.", "Termina en la rejilla para secar la base.")}</li>
            </ul>
          </div>
          <div className="rounded-2xl bg-[#121212] dark:bg-[#1e1e1e] border border-[#2b2b2b] dark:border-[#2e2e2e] p-4 shadow-sm">
            <p className="font-display text-lg font-bold text-[#ff6b00] flex items-center gap-2 mb-2"><Droplets className="w-5 h-5" /> {L("Gestione del vapore", "Dampf steuern", "Steam management", "Gestión del vapor")}</p>
            <ul className="text-[13.5px] text-[#ff6b00] dark:text-[#AEB8BF] leading-relaxed space-y-1.5 list-disc pl-4">
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
