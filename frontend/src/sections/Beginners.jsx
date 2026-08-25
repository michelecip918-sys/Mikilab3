import { useLang } from "@/i18n/LanguageContext";
import { content } from "@/data/content";
import { Sprout, Youtube, PlayCircle, Trophy, CheckCircle2, XCircle, RotateCcw, ExternalLink, Star, ChefHat, Printer, Plus, X, CalendarDays } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { API, recipesApi } from "@/lib/api";
import { computeShopping } from "@/lib/shopping";
import SupplierOrder from "@/components/SupplierOrder";

const HOME_DAYS = ["", "lun", "mar", "mer", "gio", "ven", "sab", "dom"];

function HomePlanner() {
  const { t, lang } = useLang();
  const [recipes, setRecipes] = useState([]);
  const [products, setProducts] = useState([{ recipe_id: "", qty: "2", gpp: "500", day: "" }]);
  const [when, setWhen] = useState("");
  const [plan, setPlan] = useState("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const mk = await recipesApi.list("mikilab");
        setRecipes((mk || []).sort((a, b) => (a.name || "").localeCompare(b.name || "")));
      } catch { /* */ }
    })();
  }, []);

  const recipeById = useMemo(() => Object.fromEntries(recipes.map((r) => [r.id, r])), [recipes]);
  const shopTotals = useMemo(() => computeShopping(
    products.filter((p) => p.recipe_id).map((p) => ({ recipe_id: p.recipe_id, grams: Number(p.qty || 0) * Number(p.gpp || 500) })),
    recipeById, lang,
  ), [products, recipeById, lang]);

  const generate = async () => {
    const valid = products.filter((p) => p.recipe_id);
    if (valid.length === 0) { toast.error(t("home_no_products")); return; }
    setGenerating(true); setPlan("");
    let sawDone = false;
    try {
      const res = await fetch(`${API}/capo/plan`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: valid.map((p) => { const r = recipeById[p.recipe_id]; return { recipe_id: p.recipe_id, name: r ? r.name : "", quantity: p.qty === "" ? null : Number(p.qty), unit: "pezzi", day: p.day || null }; }),
          mode: "home", start_time: when, lang,
        }),
      });
      const reader = res.body.getReader(); const decoder = new TextDecoder(); let buffer = "";
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n"); buffer = parts.pop();
        for (const part of parts) {
          const line = part.replace(/^data: ?/, "").trim(); if (!line) continue;
          let obj; try { obj = JSON.parse(line); } catch { continue; }
          if (obj.done) { sawDone = true; continue; }
          if (obj.d) setPlan((p) => p + obj.d);
        }
      }
      if (!sawDone) toast.warning(t("capo_plan_incomplete"));
    } catch { toast.error(t("chat_error")); }
    finally { setGenerating(false); }
  };

  return (
    <div data-testid="home-planner" className="rounded-2xl bg-white dark:bg-[#232A31] border border-[#D7E1DB] dark:border-[#38424B] p-5">
      <div className="flex items-center gap-2 mb-1 text-[#5E8B7E]">
        <ChefHat className="w-5 h-5" />
        <h3 className="font-display text-lg font-bold text-[#2B303B] dark:text-[#EAF0EC]">{t("home_plan_title")}</h3>
      </div>
      <p className="text-sm text-[#7E8A93] mb-4">{t("home_plan_sub")}</p>

      <div className="space-y-2" data-testid="home-products">
        {products.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <select data-testid={`home-product-recipe-${i}`} value={p.recipe_id || ""}
              onChange={(e) => setProducts((l) => l.map((x, k) => k === i ? { ...x, recipe_id: e.target.value } : x))}
              className="flex-1 min-w-0 bg-[#EAF0EC] dark:bg-[#2A323A] border border-[#D7E1DB] dark:border-[#38424B] rounded-lg p-2 text-sm outline-none focus:border-[#5E8B7E]">
              <option value="">{t("capo_pick_recipe")}</option>
              {recipes.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <input data-testid={`home-product-qty-${i}`} type="number" value={p.qty} placeholder={t("capo_qty")}
              onChange={(e) => setProducts((l) => l.map((x, k) => k === i ? { ...x, qty: e.target.value } : x))}
              className="w-16 shrink-0 bg-[#EAF0EC] dark:bg-[#2A323A] border border-[#D7E1DB] dark:border-[#38424B] rounded-lg p-2 text-sm outline-none focus:border-[#5E8B7E]" />
            <select data-testid={`home-product-day-${i}`} value={p.day || ""}
              onChange={(e) => setProducts((l) => l.map((x, k) => k === i ? { ...x, day: e.target.value } : x))}
              className="w-24 shrink-0 bg-[#EAF0EC] dark:bg-[#2A323A] border border-[#D7E1DB] dark:border-[#38424B] rounded-lg p-2 text-sm outline-none focus:border-[#5E8B7E]">
              {HOME_DAYS.map((d) => <option key={d} value={d}>{d === "" ? t("capo_day_any") : t(`day_${d}`)}</option>)}
            </select>
            {products.length > 1 && <button onClick={() => setProducts((l) => l.filter((_, k) => k !== i))} className="text-[#C0574D] p-1 shrink-0"><X className="w-4 h-4" /></button>}
          </div>
        ))}
        <button data-testid="home-product-add" onClick={() => setProducts((l) => [...l, { recipe_id: "", qty: "2", gpp: "500", day: "" }])} className="text-sm font-medium text-[#5E8B7E] flex items-center gap-1"><Plus className="w-4 h-4" /> {t("capo_add_product")}</button>
      </div>

      <label className="text-[10px] font-semibold uppercase tracking-wide text-[#7E8A93] mt-3 block">{t("home_when")}</label>
      <input data-testid="home-when" value={when} placeholder={t("home_when_ph")} onChange={(e) => setWhen(e.target.value)}
        className="mt-1 w-full bg-[#EAF0EC] dark:bg-[#2A323A] border border-[#D7E1DB] dark:border-[#38424B] rounded-xl p-2.5 text-sm outline-none focus:border-[#5E8B7E]" />

      <button data-testid="home-generate" onClick={generate} disabled={generating}
        className="mt-3 w-full bg-[#5E8B7E] hover:bg-[#4C7368] disabled:opacity-50 text-white font-semibold px-5 py-3.5 rounded-2xl shadow-md active:scale-98 transition-all flex items-center justify-center gap-2">
        <ChefHat className="w-5 h-5" /> {generating ? t("capo_generating") : t("home_generate")}
      </button>

      {plan && (
        <>
          <button data-testid="home-print" onClick={() => window.print()}
            className="no-print mt-3 w-full bg-[#6B8E62] hover:bg-[#5a7a52] text-white font-semibold px-5 py-3 rounded-2xl active:scale-98 transition-all flex items-center justify-center gap-2">
            <Printer className="w-5 h-5" /> {t("capo_print")}
          </button>
          <div className="print-area mt-4 space-y-4">
            <div data-testid="home-plan" className="markdown-body bg-[#EAF0EC] dark:bg-[#2A323A] border border-[#D7E1DB] dark:border-[#38424B] rounded-2xl p-5 text-sm leading-relaxed text-[#2B303B] dark:text-[#EAF0EC]">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#5E8B7E] mb-2">{t("home_plan_result")}</p>
              <ReactMarkdown>{plan}</ReactMarkdown>
            </div>
            <SupplierOrder totals={shopTotals} />
          </div>
        </>
      )}
    </div>
  );
}

const BEGINNERS = {
  it: [
    { title: "I quattro ingredienti", body: "Per fare il pane bastano farina, acqua, sale e un lievito. Pesa tutto con la bilancia: la precisione è già metà del risultato." },
    { title: "L'acqua giusta", body: "Usa acqua tiepida, mai calda. In inverno un po' più tiepida, in estate più fresca: così l'impasto lievita con calma." },
    { title: "Impasta senza fretta", body: "Mescola, poi lascia riposare 20 minuti e riprendi: l'impasto diventa liscio quasi da solo. Poche pieghe valgono più di tanta forza." },
    { title: "Lascia lievitare", body: "Copri la ciotola e lascia raddoppiare in un posto tiepido. Meglio lento che veloce: più sapore, più digeribilità." },
    { title: "La cottura a casa", body: "Forno ben caldo (230°C). Metti un pentolino d'acqua nel forno i primi 10 minuti per il vapore: crosta più bella. È pronto quando è dorato e suona vuoto sotto." },
    { title: "Non scoraggiarti", body: "I primi pani non saranno perfetti, ed è normale. Ogni infornata insegna qualcosa: siamo stati tutti principianti. L'importante è ricominciare." },
  ],
  de: [
    { title: "Die vier Zutaten", body: "Für Brot brauchst du Mehl, Wasser, Salz und ein Triebmittel. Wiege alles mit der Waage: Genauigkeit ist schon die halbe Miete." },
    { title: "Das richtige Wasser", body: "Nimm lauwarmes Wasser, nie heiß. Im Winter etwas wärmer, im Sommer kühler: so gärt der Teig in Ruhe." },
    { title: "Kneten ohne Eile", body: "Verrühren, 20 Minuten ruhen lassen, weitermachen: der Teig wird fast von selbst glatt. Wenige Dehn-und-Falt-Runden sind besser als viel Kraft." },
    { title: "Gehen lassen", body: "Schüssel abdecken und an einem warmen Ort verdoppeln lassen. Langsam ist besser als schnell: mehr Geschmack, bekömmlicher." },
    { title: "Backen zu Hause", body: "Ofen gut heiß (230°C). Ein Schälchen Wasser für die ersten 10 Minuten sorgt für Dampf: schönere Kruste. Fertig, wenn goldbraun und hohl klingend." },
    { title: "Nicht entmutigen lassen", body: "Die ersten Brote werden nicht perfekt – das ist normal. Jeder Ofengang lehrt etwas: wir waren alle mal Anfänger. Wichtig ist weiterzumachen." },
  ],
  en: [
    { title: "The four ingredients", body: "To make bread you only need flour, water, salt and a leaven. Weigh everything on a scale: precision is already half the result." },
    { title: "The right water", body: "Use lukewarm water, never hot. A bit warmer in winter, cooler in summer: this way the dough rises calmly." },
    { title: "Knead without rushing", body: "Mix, rest 20 minutes, then carry on: the dough becomes smooth almost by itself. A few folds beat lots of force." },
    { title: "Let it rise", body: "Cover the bowl and let it double in a warm spot. Slow is better than fast: more flavour, more digestibility." },
    { title: "Baking at home", body: "Well-heated oven (230°C). Put a small pan of water in the oven for the first 10 minutes for steam: a nicer crust. It's ready when golden and it sounds hollow underneath." },
    { title: "Don't get discouraged", body: "Your first loaves won't be perfect, and that's normal. Every bake teaches something: we were all beginners once. What matters is starting again." },
  ],
};

const FAMOUS = [
  { name: "Fulvio Marino", country: "🇮🇹", q: "Fulvio Marino pane lievito madre" },
  { name: "Gabriele Bonci", country: "🇮🇹", q: "Gabriele Bonci pizza pane impasto" },
  { name: "Sara Papa", country: "🇮🇹", q: "Sara Papa pane lievito madre" },
  { name: "Lutz Geißler (Plötzblog)", country: "🇩🇪", q: "Lutz Geißler Brot backen Sauerteig" },
  { name: "Ketex — Der Brotdoc", country: "🇩🇪", q: "Der Brotdoc Sauerteig Brot" },
  { name: "Chad Robertson (Tartine)", country: "🇺🇸", q: "Chad Robertson Tartine sourdough bread" },
];

const OUR_VIDEOS = [
  { id: "_606t-4KXT4", key: "method_video1_title" },
  { id: "HpOycYo1Cvc", key: "method_video2_title" },
];

// Contenitore video responsive 16:9, bordi arrotondati 16px, overflow nascosto, senza PiP.
function VideoEmbed({ src, title, testid }) {
  const url = src.includes("?") ? `${src}&rel=0&modestbranding=1&playsinline=1` : `${src}?rel=0&modestbranding=1&playsinline=1`;
  return (
    <div data-testid={testid} className="relative w-full overflow-hidden rounded-2xl bg-black" style={{ aspectRatio: "16 / 9" }}>
      <iframe
        className="absolute inset-0 w-full h-full"
        src={url}
        title={title}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; fullscreen"
        allowFullScreen
      />
    </div>
  );
}

const QUIZ = {
  it: [
    { q: "A che temperatura dev'essere l'acqua per impastare?", options: ["Bollente", "Tiepida", "Ghiacciata"], correct: 1 },
    { q: "Quanti sono gli ingredienti base del pane?", options: ["Due", "Quattro (farina, acqua, sale, lievito)", "Otto"], correct: 1 },
    { q: "Cosa metti nel forno per una crosta più bella?", options: ["Zucchero", "Un pentolino d'acqua per il vapore", "Un cucchiaio d'olio"], correct: 1 },
    { q: "Come capisci che il pane è cotto?", options: ["Quando è ancora bianco", "Quando è dorato e suona vuoto sotto", "Dopo esattamente 5 minuti"], correct: 1 },
    { q: "Quale lievitazione dà più sapore?", options: ["Veloce e molto calda", "Lenta e paziente", "Non serve far lievitare"], correct: 1 },
  ],
  de: [
    { q: "Wie warm soll das Wasser zum Kneten sein?", options: ["Kochend", "Lauwarm", "Eiskalt"], correct: 1 },
    { q: "Wie viele Grundzutaten hat Brot?", options: ["Zwei", "Vier (Mehl, Wasser, Salz, Triebmittel)", "Acht"], correct: 1 },
    { q: "Was gibst du in den Ofen für eine schönere Kruste?", options: ["Zucker", "Ein Schälchen Wasser für Dampf", "Einen Löffel Öl"], correct: 1 },
    { q: "Woran erkennst du, dass das Brot fertig ist?", options: ["Wenn es noch weiß ist", "Wenn es goldbraun ist und hohl klingt", "Nach genau 5 Minuten"], correct: 1 },
    { q: "Welche Gärung gibt mehr Geschmack?", options: ["Schnell und sehr warm", "Langsam und geduldig", "Gärung ist unnötig"], correct: 1 },
  ],
  en: [
    { q: "How warm should the water be for mixing?", options: ["Boiling", "Lukewarm", "Ice-cold"], correct: 1 },
    { q: "How many basic ingredients does bread have?", options: ["Two", "Four (flour, water, salt, leaven)", "Eight"], correct: 1 },
    { q: "What do you put in the oven for a nicer crust?", options: ["Sugar", "A small pan of water for steam", "A spoon of oil"], correct: 1 },
    { q: "How do you know the bread is baked?", options: ["When it's still white", "When it's golden and sounds hollow underneath", "After exactly 5 minutes"], correct: 1 },
    { q: "Which leavening gives more flavour?", options: ["Fast and very warm", "Slow and patient", "No need to let it rise"], correct: 1 },
  ],
};

function BakerQuiz() {
  const { t, lang } = useLang();
  const questions = QUIZ[lang] || QUIZ.it;
  const QKEY = "mikilab_quiz_best";
  const [best, setBest] = useState(() => Number(localStorage.getItem(QKEY) || 0));
  const [started, setStarted] = useState(false);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const start = () => { setStarted(true); setIdx(0); setPicked(null); setScore(0); setDone(false); };
  const pick = (i) => {
    if (picked != null) return;
    setPicked(i);
    if (i === questions[idx].correct) setScore((s) => s + 1);
  };
  const next = () => {
    if (idx + 1 >= questions.length) {
      const finalScore = score;
      if (finalScore > best) { setBest(finalScore); try { localStorage.setItem(QKEY, String(finalScore)); } catch { /* */ } }
      setDone(true); return;
    }
    setIdx((n) => n + 1); setPicked(null);
  };

  const record = best > 0 && (
    <p data-testid="quiz-best" className="text-xs font-semibold text-[#6B8E62] flex items-center justify-center gap-1 mb-2">
      <Trophy className="w-3.5 h-3.5" /> {lang === "de" ? `Dein Rekord: ${best}/${questions.length}` : lang === "en" ? `Your record: ${best}/${questions.length}` : `Il tuo record: ${best}/${questions.length}`}
    </p>
  );

  if (!started) {
    return (
      <div>
        {record}
        <button data-testid="quiz-start-btn" onClick={start} className="w-full bg-[#6B8E62] hover:bg-[#5a7a52] text-white font-semibold px-5 py-3 rounded-2xl shadow-sm active:scale-98 transition-all flex items-center justify-center gap-2">
          <Trophy className="w-5 h-5" /> {t("quiz_start")}
        </button>
      </div>
    );
  }

  if (done) {
    const msg = score >= 4 ? t("quiz_result_great") : score >= 2 ? t("quiz_result_good") : t("quiz_result_keep");
    return (
      <div data-testid="quiz-result" className="text-center bg-[#6B8E62]/12 border border-[#6B8E62]/30 rounded-2xl p-6">
        <Trophy className="w-10 h-10 text-[#6B8E62] mx-auto mb-2" />
        <p className="text-sm text-[#7E8A93]">{t("quiz_your_score")}</p>
        <p className="font-display text-3xl font-bold text-[#2B303B] dark:text-[#EAF0EC] my-1">{score} / {questions.length}</p>
        <p className="text-sm text-[#3F4A54] dark:text-[#AEB8BF] mb-2">{msg}</p>
        {record}
        <button data-testid="quiz-restart-btn" onClick={start} className="inline-flex items-center gap-2 bg-[#5E8B7E] text-white font-semibold px-5 py-2.5 rounded-xl">
          <RotateCcw className="w-4 h-4" /> {t("quiz_restart")}
        </button>
      </div>
    );
  }

  const cur = questions[idx];
  return (
    <div data-testid="quiz-panel" className="bg-white dark:bg-[#232A31] border border-[#D7E1DB] dark:border-[#38424B] rounded-2xl p-5">
      <p className="text-[10px] font-bold uppercase tracking-wide text-[#5E8B7E] mb-1">{t("quiz_question")} {idx + 1} / {questions.length}</p>
      <h4 className="font-display text-lg font-semibold text-[#2B303B] dark:text-[#EAF0EC] mb-3">{cur.q}</h4>
      <div className="space-y-2">
        {cur.options.map((opt, i) => {
          const isCorrect = i === cur.correct;
          const chosen = picked === i;
          let cls = "bg-[#EAF0EC] dark:bg-[#2A323A] border-[#D7E1DB] dark:border-[#38424B]";
          if (picked != null && isCorrect) cls = "bg-[#6B8E62]/20 border-[#6B8E62]";
          else if (picked != null && chosen && !isCorrect) cls = "bg-[#C0574D]/15 border-[#C0574D]";
          return (
            <button key={i} data-testid={`quiz-option-${i}`} onClick={() => pick(i)} disabled={picked != null}
              className={`w-full flex items-center gap-2 text-left text-sm px-4 py-3 rounded-xl border transition-all ${cls}`}>
              <span className="flex-1 text-[#2B303B] dark:text-[#EAF0EC]">{opt}</span>
              {picked != null && isCorrect && <CheckCircle2 className="w-4 h-4 text-[#6B8E62] shrink-0" />}
              {picked != null && chosen && !isCorrect && <XCircle className="w-4 h-4 text-[#C0574D] shrink-0" />}
            </button>
          );
        })}
      </div>
      {picked != null && (
        <div className="mt-3 flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-[#3F4A54] dark:text-[#AEB8BF]">
            {picked === cur.correct ? t("quiz_correct") : `${t("quiz_wrong")} ${cur.options[cur.correct]}`}
          </p>
          <button data-testid="quiz-next-btn" onClick={next} className="shrink-0 bg-[#5E8B7E] text-white font-semibold px-4 py-2 rounded-xl">
            {t("quiz_next")}
          </button>
        </div>
      )}
    </div>
  );
}

const DAILY_RECIPES = {
  it: [
    { name: "Pane semplice di casa", ing: "500 g farina · 350 g acqua tiepida · 8 g sale · 5 g lievito di birra", steps: "Sciogli il lievito nell'acqua, unisci farina e sale. Impasta 5 min, copri e lascia raddoppiare (2-3 h). Forma, lievita 1 h, cuoci a 230°C per 30-35 min con un pentolino d'acqua." },
    { name: "Focaccia morbida", ing: "500 g farina · 400 g acqua · 10 g sale · 5 g lievito · olio evo", steps: "Impasto molto idratato: mescola tutto, 3 pieghe ogni 30 min. Versa in teglia oliata, fossette con le dita, olio e sale grosso. Lievita 1 h, cuoci a 220°C per 20 min." },
    { name: "Panini al latte", ing: "500 g farina · 250 g latte · 50 g burro · 50 g zucchero · 7 g lievito · 8 g sale", steps: "Impasta tutto fino a incordare, lievita 2 h. Forma palline, lievita 1 h, spennella con latte e cuoci a 180°C per 15-18 min." },
  ],
  de: [
    { name: "Einfaches Hausbrot", ing: "500 g Mehl · 350 g lauwarmes Wasser · 8 g Salz · 5 g Hefe", steps: "Hefe im Wasser lösen, Mehl und Salz zugeben. 5 Min kneten, abgedeckt verdoppeln (2-3 h). Formen, 1 h gehen, bei 230°C 30-35 Min mit Wasserschälchen backen." },
    { name: "Weiche Focaccia", ing: "500 g Mehl · 400 g Wasser · 10 g Salz · 5 g Hefe · Olivenöl", steps: "Sehr feuchter Teig: alles mischen, 3x dehnen/falten alle 30 Min. In geölte Form, Mulden drücken, Öl und grobes Salz. 1 h gehen, bei 220°C 20 Min backen." },
    { name: "Milchbrötchen", ing: "500 g Mehl · 250 g Milch · 50 g Butter · 50 g Zucker · 7 g Hefe · 8 g Salz", steps: "Alles kneten bis glatt, 2 h gehen. Kugeln formen, 1 h gehen, mit Milch bestreichen, bei 180°C 15-18 Min backen." },
  ],
  en: [
    { name: "Simple home bread", ing: "500 g flour · 350 g warm water · 8 g salt · 5 g yeast", steps: "Dissolve yeast in water, add flour and salt. Knead 5 min, cover and let double (2-3 h). Shape, prove 1 h, bake at 230°C for 30-35 min with a pan of water." },
    { name: "Soft focaccia", ing: "500 g flour · 400 g water · 10 g salt · 5 g yeast · olive oil", steps: "Very wet dough: mix all, 3 stretch-and-folds every 30 min. Into an oiled tray, dimple with fingers, oil and coarse salt. Prove 1 h, bake at 220°C for 20 min." },
    { name: "Milk rolls", ing: "500 g flour · 250 g milk · 50 g butter · 50 g sugar · 7 g yeast · 8 g salt", steps: "Knead all until smooth, prove 2 h. Shape balls, prove 1 h, brush with milk, bake at 180°C for 15-18 min." },
  ],
};

export default function Beginners() {
  const { t, lang } = useLang();
  const beginners = BEGINNERS[lang] || BEGINNERS.it;
  const courses = content[lang].freeCourses || [];
  const daily = DAILY_RECIPES[lang] || DAILY_RECIPES.it;
  const today = daily[Math.floor(Date.now() / 86400000) % daily.length];

  return (
    <div data-testid="beginners-page" className="space-y-4 pb-4">
      <div className="rounded-2xl p-5 bg-[#6B8E62]/12 border border-[#6B8E62]/30">
        <div className="flex items-center gap-2 mb-2">
          <Sprout className="w-5 h-5 text-[#4d6b45] dark:text-[#9ec48f]" />
          <h2 className="font-display text-xl font-bold text-[#2B303B] dark:text-[#EAF0EC]">{t("beginners_title")}</h2>
        </div>
        <p className="text-sm text-[#3F4A54] dark:text-[#AEB8BF] leading-relaxed">{t("beginners_intro")}</p>
      </div>

      {/* Ricetta del giorno gratis — cambia ogni giorno */}
      <div data-testid="recipe-of-day" className="rounded-2xl p-5 text-white bg-gradient-to-br from-[#A64B2A] to-[#7c3820] shadow-md">
        <div className="flex items-center gap-2 mb-1">
          <Star className="w-4 h-4" />
          <span className="text-[11px] font-bold uppercase tracking-wide text-white/85">{lang === "de" ? "Rezept des Tages · gratis" : lang === "en" ? "Recipe of the day · free" : "Ricetta del giorno · gratis"}</span>
        </div>
        <h3 className="font-display text-xl font-bold leading-tight">{today.name}</h3>
        <p className="text-sm text-white/90 mt-2"><b>{lang === "de" ? "Zutaten" : lang === "en" ? "Ingredients" : "Ingredienti"}:</b> {today.ing}</p>
        <p className="text-sm text-white/90 mt-1.5 leading-snug">{today.steps}</p>
      </div>

      {/* Pianifica il pane a casa */}
      <HomePlanner />

      {beginners.map((s, i) => (
        <div key={i} data-testid={`beg-section-${i}`} className="bg-white dark:bg-[#232A31] border border-[#D7E1DB] dark:border-[#38424B] rounded-2xl p-5">
          <h3 className="font-display text-lg font-semibold text-[#2B303B] dark:text-[#EAF0EC]">{s.title}</h3>
          <p className="text-sm text-[#3F4A54] dark:text-[#AEB8BF] mt-1 leading-relaxed">{s.body}</p>
        </div>
      ))}

      {/* Video e corsi gratis */}
      <div className="flex items-center gap-2 text-[#7E8A93] pt-2">
        <Youtube className="w-4 h-4" />
        <span className="text-xs font-semibold uppercase tracking-wide">{t("beginners_courses_title")}</span>
      </div>
      <p className="text-sm text-[#7E8A93] -mt-2">{t("beginners_courses_sub")}</p>
      {courses.map((v, i) => (
        <div key={i} data-testid={`beg-course-${i}`} className="bg-white dark:bg-[#232A31] border border-[#D7E1DB] dark:border-[#38424B] rounded-2xl overflow-hidden">
          <VideoEmbed src={v.url} title={v.title} testid={`beg-course-video-${i}`} />
          <div className="p-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wide text-[#5E8B7E]">{v.category}</span>
              {v.isNew && <span className="text-[9px] font-bold uppercase text-white bg-[#6B8E62] px-1.5 py-0.5 rounded-full">New</span>}
            </div>
            <h3 className="font-display text-lg font-semibold text-[#2B303B] dark:text-[#EAF0EC] mt-0.5">{v.title}</h3>
            {v.source && <p className="text-xs text-[#7E8A93] mt-0.5 flex items-center gap-1"><PlayCircle className="w-3 h-3" /> {v.source}</p>}
          </div>
        </div>
      ))}

      {/* I nostri video — il metodo di Michele */}
      <div className="flex items-center gap-2 text-[#7E8A93] pt-2">
        <Youtube className="w-4 h-4" />
        <span className="text-xs font-semibold uppercase tracking-wide">{t("beginners_ours_title")}</span>
      </div>
      <p className="text-sm text-[#7E8A93] -mt-2">{t("beginners_ours_sub")}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {OUR_VIDEOS.map((v) => (
          <div key={v.id} data-testid={`our-video-${v.id}`} className="rounded-2xl overflow-hidden border border-[#D7E1DB] dark:border-[#38424B] bg-white dark:bg-[#232A31]">
            <VideoEmbed src={`https://www.youtube.com/embed/${v.id}`} title={t(v.key)} testid={`our-video-frame-${v.id}`} />
            <p className="text-xs font-medium text-[#3F4A54] dark:text-[#AEB8BF] p-2.5">{t(v.key)}</p>
          </div>
        ))}
      </div>

      {/* Video dei grandi panettieri (link a YouTube) */}
      <div className="flex items-center gap-2 text-[#7E8A93] pt-2">
        <Star className="w-4 h-4" />
        <span className="text-xs font-semibold uppercase tracking-wide">{t("beginners_famous_title")}</span>
      </div>
      <p className="text-sm text-[#7E8A93] -mt-2">{t("beginners_famous_sub")}</p>
      <div className="rounded-xl bg-[#6E8CA0]/10 border border-[#6E8CA0]/30 p-3">
        <p className="text-xs text-[#3F4A54] dark:text-[#AEB8BF] leading-relaxed">{t("beginners_subtitles_note")}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {FAMOUS.map((b, i) => (
          <a
            key={i}
            data-testid={`famous-baker-${i}`}
            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(b.q)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 bg-white dark:bg-[#232A31] border border-[#D7E1DB] dark:border-[#38424B] rounded-2xl p-3.5 active:scale-98 transition-all hover:border-[#5E8B7E]/50"
          >
            <div className="w-10 h-10 rounded-xl bg-[#5E8B7E]/10 border border-[#5E8B7E]/25 flex items-center justify-center shrink-0 text-lg">{b.country}</div>
            <span className="flex-1 min-w-0 font-display text-base font-semibold text-[#2B303B] dark:text-[#EAF0EC] truncate">{b.name}</span>
            <ExternalLink className="w-4 h-4 text-[#5E8B7E] shrink-0" />
          </a>
        ))}
      </div>

      {/* Quiz del Fornaio */}
      <div className="flex items-center gap-2 text-[#7E8A93] pt-2">
        <Trophy className="w-4 h-4" />
        <span className="text-xs font-semibold uppercase tracking-wide">{t("beginners_quiz_title")}</span>
      </div>
      <p className="text-sm text-[#7E8A93] -mt-2">{t("beginners_quiz_sub")}</p>
      <BakerQuiz />
    </div>
  );
}
