import { useLang } from "@/i18n/LanguageContext";
import { recipeTitle } from "@/lib/loc";
import RecipeOptions from "@/components/RecipeOptions";
import CategoryRecipePicker from "@/components/CategoryRecipePicker";
import { getLevelProgress } from "@/lib/level";
import { content } from "@/data/content";
import { Sprout, Youtube, PlayCircle, Trophy, CheckCircle2, XCircle, RotateCcw, ExternalLink, Star, ChefHat, Printer, Plus, X, CalendarDays, Stethoscope, Flame, ChevronRight, ChevronDown, MessageCircle } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { API, recipesApi } from "@/lib/api";
import { computeShopping } from "@/lib/shopping";
import SupplierOrder from "@/components/SupplierOrder";
import AvatarBubbles from "@/components/AvatarBubbles";
import AcademyCoach from "@/components/AcademyCoach";
import EvolvingQuiz from "@/components/EvolvingQuiz";
import BakeAlong from "@/components/BakeAlong";
import SosImpasto from "@/components/SosImpasto";
import LabTour from "@/components/LabTour";
import SectionHero from "@/components/SectionHero";
import NewsletterSignup from "@/components/NewsletterSignup";
import ImparaLivelli from "@/sections/ImparaLivelli";
import MaestroSaTutto from "@/sections/MaestroSaTutto";
import { mkTri, pick } from "@/i18n/triMaps";

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
    <div data-testid="home-planner" className="rounded-2xl bg-white dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] p-5">
      <div className="flex items-center gap-2 mb-1 text-[#ff6b00]">
        <ChefHat className="w-5 h-5" />
        <h3 className="font-display text-lg font-bold text-[#2B303B] dark:text-[#e4eff8]">{t("home_plan_title")}</h3>
      </div>
      <p className="text-sm text-[#7E8A93] mb-4">{t("home_plan_sub")}</p>

      <div className="space-y-2" data-testid="home-products">
        {products.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <CategoryRecipePicker recipes={recipes} value={p.recipe_id || ""}
                onChange={(e) => setProducts((l) => l.map((x, k) => k === i ? { ...x, recipe_id: e.target.value } : x))}
                testid={`home-product-recipe-${i}`} />
            </div>
            <input data-testid={`home-product-qty-${i}`} type="number" value={p.qty} placeholder={t("capo_qty")}
              onChange={(e) => setProducts((l) => l.map((x, k) => k === i ? { ...x, qty: e.target.value } : x))}
              className="w-16 shrink-0 bg-white dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] rounded-xl py-2.5 px-2 text-sm font-medium text-center outline-none focus:border-[#ff6b00] focus:ring-2 focus:ring-[#ff6b00]/30 transition-all" />
            <div className="relative w-24 shrink-0">
              <select data-testid={`home-product-day-${i}`} value={p.day || ""}
                onChange={(e) => setProducts((l) => l.map((x, k) => k === i ? { ...x, day: e.target.value } : x))}
                className="w-full appearance-none bg-white dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] rounded-xl py-2.5 pl-3 pr-8 text-sm font-medium text-[#2B303B] dark:text-white outline-none focus:border-[#ff6b00] focus:ring-2 focus:ring-[#ff6b00]/30 transition-all cursor-pointer">
                {HOME_DAYS.map((d) => <option key={d} value={d}>{d === "" ? t("capo_day_any") : t(`day_${d}`)}</option>)}
              </select>
              <ChevronDown className="w-4 h-4 text-[#ff6b00] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            {products.length > 1 && <button onClick={() => setProducts((l) => l.filter((_, k) => k !== i))} className="text-[#ff6b00] p-1 shrink-0"><X className="w-4 h-4" /></button>}
          </div>
        ))}
        <button data-testid="home-product-add" onClick={() => setProducts((l) => [...l, { recipe_id: "", qty: "2", gpp: "500", day: "" }])} className="text-sm font-medium text-[#ff6b00] flex items-center gap-1"><Plus className="w-4 h-4" /> {t("capo_add_product")}</button>
      </div>

      <label className="text-[10px] font-semibold uppercase tracking-wide text-[#7E8A93] mt-3 block">{t("home_when")}</label>
      <input data-testid="home-when" value={when} placeholder={t("home_when_ph")} onChange={(e) => setWhen(e.target.value)}
        className="mt-1 w-full bg-[#e4eff8] dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] rounded-xl p-2.5 text-sm outline-none focus:border-[#ff6b00]" />

      <button data-testid="home-generate" onClick={generate} disabled={generating}
        className="mt-3 w-full bg-[#ff6b00] hover:bg-[#ff8a33] disabled:opacity-50 text-white font-semibold px-5 py-3.5 rounded-2xl shadow-md active:scale-98 transition-all flex items-center justify-center gap-2">
        <ChefHat className="w-5 h-5" /> {generating ? t("capo_generating") : t("home_generate")}
      </button>

      {plan && (
        <>
          <button data-testid="home-print" onClick={() => window.print()}
            className="no-print mt-3 w-full bg-[#ff6b00] hover:bg-[#ff8a33] text-white font-semibold px-5 py-3 rounded-2xl active:scale-98 transition-all flex items-center justify-center gap-2">
            <Printer className="w-5 h-5" /> {t("capo_print")}
          </button>
          <div className="print-area mt-4 space-y-4">
            <div data-testid="home-plan" className="markdown-body bg-[#e4eff8] dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] rounded-2xl p-5 text-sm leading-relaxed text-[#2B303B] dark:text-[#e4eff8]">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#ff6b00] mb-2">{t("home_plan_result")}</p>
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
  es: [
    { title: "Los cuatro ingredientes", body: "Para hacer pan solo necesitas harina, agua, sal y una levadura. Pesa todo con la balanza: la precisión ya es la mitad del resultado." },
    { title: "El agua adecuada", body: "Usa agua tibia, nunca caliente. Un poco más tibia en invierno, más fresca en verano: así la masa fermenta con calma." },
    { title: "Amasa sin prisa", body: "Mezcla, deja reposar 20 minutos y continúa: la masa se vuelve lisa casi sola. Unos pocos pliegues valen más que mucha fuerza." },
    { title: "Deja fermentar", body: "Cubre el bol y deja que doble en un lugar cálido. Mejor lento que rápido: más sabor y mayor digestibilidad." },
    { title: "La cocción en casa", body: "Horno bien caliente (230°C). Pon un cazo con agua en el horno los primeros 10 minutos para el vapor: una corteza más bonita. Está listo cuando está dorado y suena hueco por debajo." },
    { title: "No te desanimes", body: "Tus primeros panes no serán perfectos, y es normal. Cada horneada enseña algo: todos fuimos principiantes. Lo importante es volver a empezar." },
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
  es: [
    { q: "¿A qué temperatura debe estar el agua para amasar?", options: ["Hirviendo", "Tibia", "Helada"], correct: 1 },
    { q: "¿Cuántos son los ingredientes básicos del pan?", options: ["Dos", "Cuatro (harina, agua, sal, levadura)", "Ocho"], correct: 1 },
    { q: "¿Qué pones en el horno para una corteza más bonita?", options: ["Azúcar", "Un cazo con agua para el vapor", "Una cucharada de aceite"], correct: 1 },
    { q: "¿Cómo sabes que el pan está cocido?", options: ["Cuando aún está blanco", "Cuando está dorado y suena hueco por debajo", "Después de exactamente 5 minutos"], correct: 1 },
    { q: "¿Qué fermentación da más sabor?", options: ["Rápida y muy caliente", "Lenta y paciente", "No hace falta fermentar"], correct: 1 },
  ],
};

function BakerQuiz() {
  const { t, lang } = useLang();
  const questions = pick(QUIZ, lang);
  const QKEY = "mikilab_quiz_best";
  const [best, setBest] = useState(() => Number(localStorage.getItem(QKEY) || 0));
  const [started, setStarted] = useState(false);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const start = () => { setStarted(true); setIdx(0); setPicked(null); setScore(0); setDone(false); };
  const choose = (i) => {
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
    <p data-testid="quiz-best" className="text-xs font-semibold text-[#ff6b00] flex items-center justify-center gap-1 mb-2">
      <Trophy className="w-3.5 h-3.5" /> {lang === "de" ? `Dein Rekord: ${best}/${questions.length}` : lang === "es" ? `Tu récord: ${best}/${questions.length}` : lang === "en" ? `Your record: ${best}/${questions.length}` : `Il tuo record: ${best}/${questions.length}`}
    </p>
  );

  if (!started) {
    return (
      <div>
        {record}
        <button data-testid="quiz-start-btn" onClick={start} className="w-full bg-[#ff6b00] hover:bg-[#ff8a33] text-white font-semibold px-5 py-3 rounded-2xl shadow-sm active:scale-98 transition-all flex items-center justify-center gap-2">
          <Trophy className="w-5 h-5" /> {t("quiz_start")}
        </button>
      </div>
    );
  }

  if (done) {
    const msg = score >= 4 ? t("quiz_result_great") : score >= 2 ? t("quiz_result_good") : t("quiz_result_keep");
    return (
      <div data-testid="quiz-result" className="text-center bg-[#ff6b00]/12 border border-[#ff6b00]/30 rounded-2xl p-6">
        <Trophy className="w-10 h-10 text-[#ff6b00] mx-auto mb-2" />
        <p className="text-sm text-[#7E8A93]">{t("quiz_your_score")}</p>
        <p className="font-display text-3xl font-bold text-[#2B303B] dark:text-[#e4eff8] my-1">{score} / {questions.length}</p>
        <p className="text-sm text-[#3F4A54] dark:text-[#AEB8BF] mb-2">{msg}</p>
        {record}
        <button data-testid="quiz-restart-btn" onClick={start} className="inline-flex items-center gap-2 bg-[#ff6b00] text-white font-semibold px-5 py-2.5 rounded-xl">
          <RotateCcw className="w-4 h-4" /> {t("quiz_restart")}
        </button>
      </div>
    );
  }

  const cur = questions[idx];
  return (
    <div data-testid="quiz-panel" className="bg-white dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] rounded-2xl p-5">
      <p className="text-[10px] font-bold uppercase tracking-wide text-[#ff6b00] mb-1">{t("quiz_question")} {idx + 1} / {questions.length}</p>
      <h4 className="font-display text-lg font-semibold text-[#2B303B] dark:text-[#e4eff8] mb-3">{cur.q}</h4>
      <div className="space-y-2">
        {cur.options.map((opt, i) => {
          const isCorrect = i === cur.correct;
          const chosen = picked === i;
          let cls = "bg-[#e4eff8] dark:bg-[#1e1e1e] border-[#2e2e2e] dark:border-[#2e2e2e]";
          if (picked != null && isCorrect) cls = "bg-[#ff6b00]/20 border-[#ff6b00]";
          else if (picked != null && chosen && !isCorrect) cls = "bg-[#ff6b00]/15 border-[#ff6b00]";
          return (
            <button key={i} data-testid={`quiz-option-${i}`} onClick={() => choose(i)} disabled={picked != null}
              className={`w-full flex items-center gap-2 text-left text-sm px-4 py-3 rounded-xl border transition-all ${cls}`}>
              <span className="flex-1 text-[#2B303B] dark:text-[#e4eff8]">{opt}</span>
              {picked != null && isCorrect && <CheckCircle2 className="w-4 h-4 text-[#ff6b00] shrink-0" />}
              {picked != null && chosen && !isCorrect && <XCircle className="w-4 h-4 text-[#ff6b00] shrink-0" />}
            </button>
          );
        })}
      </div>
      {picked != null && (
        <div className="mt-3 flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-[#3F4A54] dark:text-[#AEB8BF]">
            {picked === cur.correct ? t("quiz_correct") : `${t("quiz_wrong")} ${cur.options[cur.correct]}`}
          </p>
          <button data-testid="quiz-next-btn" onClick={next} className="shrink-0 bg-[#ff6b00] text-white font-semibold px-4 py-2 rounded-xl">
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
  es: [
    { name: "Pan sencillo de casa", ing: "500 g harina · 350 g agua tibia · 8 g sal · 5 g levadura", steps: "Disuelve la levadura en el agua, añade harina y sal. Amasa 5 min, tapa y deja doblar (2-3 h). Forma, fermenta 1 h, hornea a 230°C durante 30-35 min con un cazo de agua." },
    { name: "Focaccia blanda", ing: "500 g harina · 400 g agua · 10 g sal · 5 g levadura · aceite de oliva", steps: "Masa muy hidratada: mezcla todo, 3 pliegues cada 30 min. Vierte en bandeja aceitada, marca hoyuelos con los dedos, aceite y sal gruesa. Fermenta 1 h, hornea a 220°C durante 20 min." },
    { name: "Bollos de leche", ing: "500 g harina · 250 g leche · 50 g mantequilla · 50 g azúcar · 7 g levadura · 8 g sal", steps: "Amasa todo hasta que quede liso, fermenta 2 h. Forma bolitas, fermenta 1 h, pincela con leche y hornea a 180°C durante 15-18 min." },
  ],
};

export default function Beginners({ onNavigate }) {
  const { t, lang } = useLang();
  const tri3 = (l, i, d, e, s) => mkTri(l)(i, d, e, s);
  const [sosOpen, setSosOpen] = useState(false);
  const [imparaLiv, setImparaLiv] = useState(false);
  const [askMaster, setAskMaster] = useState(false);
  const beginners = pick(BEGINNERS, lang);
  const courses = content[lang].freeCourses || [];
  const daily = pick(DAILY_RECIPES, lang);
  const today = daily[Math.floor(Date.now() / 86400000) % daily.length];

  const PATH = [
    tri3(lang, "Conosci i 4 ingredienti base (leggi i consigli qui sotto)", "Lerne die 4 Grundzutaten (siehe Tipps unten)", "Learn the 4 basic ingredients (see tips below)", "Conoce los 4 ingredientes básicos (lee los consejos abajo)"),
    tri3(lang, "Prova la Ricetta del giorno", "Probiere das Rezept des Tages", "Try the Recipe of the day", "Prueba la Receta del día"),
    tri3(lang, "Crea un piano con «Pianifica la tua Produzione»", "Erstelle einen Plan mit „Plane deine Produktion“", "Make a plan with 'Plan your Production'", "Crea un plan con «Planifica tu Producción»"),
    tri3(lang, "Supera il Quiz del Fornaio", "Bestehe das Bäcker-Quiz", "Pass the Baker Quiz", "Supera el Quiz del Panadero"),
  ];
  const PKEY = "mikilab_beginner_path";
  const [pathDone, setPathDone] = useState(() => {
    try { return JSON.parse(localStorage.getItem(PKEY) || "[]"); } catch { return []; }
  });
  const toggleStep = (i) => {
    const next = [...pathDone];
    next[i] = !next[i];
    setPathDone(next);
    try { localStorage.setItem(PKEY, JSON.stringify(next)); } catch { /* */ }
  };
  const doneCount = PATH.filter((_, i) => pathDone[i]).length;
  const [tourForce, setTourForce] = useState(0);

  if (imparaLiv) return <ImparaLivelli onBack={() => setImparaLiv(false)} />;
  if (askMaster) return (
    <div className="pb-4">
      <button data-testid="impara-askmaster-back" onClick={() => setAskMaster(false)} className="flex items-center gap-1 text-[#ff6b00] font-medium mb-4">
        <ChevronRight className="w-5 h-5 rotate-180" /> {mkTri(lang)("Indietro", "Zurück", "Back", "Atrás", "Retour", "بازگشت")}
      </button>
      <MaestroSaTutto />
    </div>
  );

  return (
    <div data-testid="beginners-page" className="space-y-4 pb-4">
      <SectionHero testid="impara-title" image="hero-impara.jpg" position="50% 25%"
        title={mkTri(lang)("Impara", "Lernen", "Learn", "Aprende", "Apprendre", "بیاموز")}
        subtitle={mkTri(lang)("Fai il pane a casa, passo dopo passo", "Backe Brot zu Hause, Schritt für Schritt", "Bake bread at home, step by step", "Haz pan en casa, paso a paso", "Fais ton pain à la maison, pas à pas", "نان خانگی، گام‌به‌گام")} />

      {/* Accesso rapido scorrevole: salta subito alla parte che ti serve (mobile-first) */}
      <div data-testid="impara-quick-access" className="flex gap-2.5 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory">
        {[
          { id: "livelli", Icon: Trophy, label: mkTri(lang)("Livelli", "Level", "Levels", "Niveles", "Niveaux", "سطح‌ها"), act: () => setImparaLiv(true) },
          { id: "quiz", Icon: ChefHat, label: mkTri(lang)("Quiz", "Quiz", "Quiz", "Quiz", "Quiz", "کوئیز"), act: () => document.querySelector('[data-testid="evolving-quiz"],[data-testid="quiz-panel"]')?.scrollIntoView({ behavior: "smooth", block: "center" }) },
          { id: "maestro", Icon: MessageCircle, label: mkTri(lang)("Chiedi al Maestro", "Frag den Meister", "Ask the Master", "Pregunta al Maestro", "Demande au Maître", "از استاد بپرس"), act: () => setAskMaster(true) },
          { id: "ricetta", Icon: Sprout, label: mkTri(lang)("Ricetta del giorno", "Rezept des Tages", "Recipe of the day", "Receta del día", "Recette du jour", "دستور روز"), act: () => document.querySelector('[data-testid="recipe-of-day"]')?.scrollIntoView({ behavior: "smooth", block: "center" }) },
          { id: "sos", Icon: Stethoscope, label: mkTri(lang)("SOS Impasto", "SOS Teig", "Dough SOS", "SOS Masa", "SOS Pâte", "اورژانس خمیر"), act: () => setSosOpen(true) },
        ].map(({ id, Icon, label, act }) => (
          <button key={id} data-testid={`impara-quick-${id}`} onClick={act}
            className="snap-start shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#1e1e1e] border border-[#ff6b00]/40 text-white active:scale-95 hover:border-[#ff6b00] transition-all">
            <Icon className="w-4.5 h-4.5 text-[#ff6b00]" />
            <span className="text-sm font-bold whitespace-nowrap">{label}</span>
          </button>
        ))}
      </div>

      <div className="mb-4" data-testid="impara-newsletter"><NewsletterSignup /></div>
      <LabTour force={tourForce} onClose={() => setTourForce(0)} storageKey="mikilab_impara_tour_v1"
        labels={{ skip: tri3(lang, "Salta", "Überspringen", "Skip", "Saltar"), next: tri3(lang, "Avanti", "Weiter", "Next", "Siguiente"), done: tri3(lang, "Ho capito!", "Verstanden!", "Got it!", "¡Entendido!") }}
        steps={[
          { target: null, title: tri3(lang, "Benvenuto in Impara 👋", "Willkommen bei Lernen 👋", "Welcome to Learn 👋", "Bienvenido a Aprende 👋"),
            body: tri3(lang, "Qui impari a fare il pane a casa, passo dopo passo. Ti mostro come muoverti.", "Hier lernst du Schritt für Schritt Brot backen. Ich zeige dir, wie es geht.", "Here you learn to bake bread at home, step by step. Let me show you around.", "Aquí aprendes a hacer pan en casa, paso a paso. Te muestro cómo moverte.") },
          { target: "beginner-path", title: tri3(lang, "1 · Segui il percorso", "1 · Folge dem Weg", "1 · Follow the path", "1 · Sigue el recorrido"),
            body: tri3(lang, "Spunta i 4 passi del tuo percorso: ingredienti base, ricetta del giorno, primo piano e quiz.", "Hake die 4 Schritte ab: Grundzutaten, Rezept des Tages, erster Plan und Quiz.", "Tick the 4 steps: basic ingredients, recipe of the day, first plan and quiz.", "Marca los 4 pasos de tu recorrido: ingredientes básicos, receta del día, primer plan y quiz.") },
          { target: "home-planner", title: tri3(lang, "2 · Pianifica il pane a casa", "2 · Plane dein Brot zu Hause", "2 · Plan your home bake", "2 · Planifica tu pan en casa"),
            body: tri3(lang, "Scegli una ricetta e quando ti serve pronto: ti do orari e lista della spesa, semplici.", "Wähle ein Rezept und wann es fertig sein soll: du bekommst Zeiten und Einkaufsliste.", "Pick a recipe and when you need it ready: I give you times and a shopping list.", "Elige una receta y cuándo la necesitas lista: te doy horarios y lista de la compra, sencillos.") },
          { target: "evolving-quiz", title: tri3(lang, "3 · Metti alla prova", "3 · Teste dich", "3 · Test yourself", "3 · Ponte a prueba"),
            body: tri3(lang, "Fai il Quiz del Fornaio e sblocca i livelli. Impari divertendoti!", "Mach das Bäcker-Quiz und schalte Level frei. Lernen mit Spaß!", "Take the Baker's Quiz and unlock levels. Learn while having fun!", "Haz el Quiz del Panadero y desbloquea niveles. ¡Aprende divirtiéndote!") },
        ]} />
      <AvatarBubbles variant="impara" />

      {/* Tocco personale: le mani (e il tatuaggio) di Michele */}
      <div data-testid="impara-tattoo-card" className="relative overflow-hidden rounded-2xl border border-[#2e2e2e] bg-[#181818]">
        <img src="/bio-dough.jpg" alt={mkTri(lang)("Le mani di Michele", "Micheles Hände", "Michele's hands", "Las manos de Michele", "Les mains de Michele", "دستان میکله")}
          className="w-full h-44 object-cover object-center" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-3.5">
          <p className="text-white font-display text-base font-bold leading-tight drop-shadow">
            {mkTri(lang)("Farina, mani e un po' di storia sulla pelle", "Mehl, Hände und etwas Geschichte auf der Haut", "Flour, hands and a bit of history on the skin", "Harina, manos y algo de historia en la piel", "Farine, mains et un peu d'histoire sur la peau", "آرد، دست‌ها و کمی تاریخ روی پوست")}
          </p>
          <p className="text-white/80 text-[12px] leading-snug mt-0.5">
            {mkTri(lang)("Il mio tatuaggio mi accompagna a ogni impasto: fare il pane è artigianato, non fretta.", "Mein Tattoo begleitet jeden Teig: Brot backen ist Handwerk, keine Eile.", "My tattoo joins every dough: baking is craft, not haste.", "Mi tatuaje me acompaña en cada masa: hacer pan es artesanía, no prisa.", "Mon tatouage accompagne chaque pâte : faire le pain est un artisanat, pas de la hâte.", "خالکوبی‌ام همراه هر خمیر است: نان‌پزی صنعت است، نه شتاب.")}
          </p>
        </div>
      </div>

      <button data-testid="impara-livelli-btn" onClick={() => setImparaLiv(true)}
        className="w-full flex items-center gap-4 rounded-2xl p-4 bg-gradient-to-br from-[#F0B429] to-[#ff6b00] text-white shadow-md active:scale-98 transition-all text-left hover:shadow-lg">
        <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center shrink-0"><Trophy className="w-6 h-6 text-[#f0dcb4]" /></div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-lg font-bold leading-tight">{mkTri(lang)("Impara a Livelli", "Lernen nach Stufen", "Learn by Levels", "Aprende por Niveles", "Apprendre par Niveaux", "یادگیری مرحله‌ای")}</h3>
          <p className="text-white/85 text-[13px] leading-snug">{mkTri(lang)("Quiz a livelli che contano come sfida: sblocca badge e sali di grado", "Level-Quiz als Challenge: schalte Abzeichen frei und steige auf", "Level quizzes that count as a challenge: unlock badges and rank up", "Cuestionarios por niveles que cuentan como desafío: desbloquea insignias", "Des quiz par niveaux qui comptent comme défi : débloque des badges", "آزمون‌های مرحله‌ای به‌عنوان چالش: نشان‌ها را باز کنید")}</p>
        </div>
        <ChevronRight className="w-6 h-6 text-white/70 shrink-0" />
      </button>

      <button data-testid="impara-askmaster-btn" onClick={() => setAskMaster(true)}
        className="w-full flex items-center gap-4 rounded-2xl p-4 bg-gradient-to-br from-[#ff6b00] to-[#c94f00] text-white shadow-md active:scale-98 transition-all text-left hover:shadow-lg">
        <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center shrink-0"><MessageCircle className="w-6 h-6" /></div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-lg font-bold leading-tight">{mkTri(lang)("Chiedi al Maestro", "Frag den Meister", "Ask the Master", "Pregunta al Maestro", "Demande au Maître", "از استاد بپرس")}</h3>
          <p className="text-white/85 text-[13px] leading-snug">{mkTri(lang)("Dubbi sull'impasto? Chiedi a Michele e ricevi consigli su misura", "Fragen zum Teig? Frag Michele für persönliche Tipps", "Dough doubts? Ask Michele for tailored advice", "¿Dudas con la masa? Pregunta a Michele", "Des doutes sur la pâte ? Demande à Michele", "سوال درباره خمیر؟ از میکله بپرس")}</p>
        </div>
        <ChevronRight className="w-6 h-6 text-white/70 shrink-0" />
      </button>
      <div className="rounded-2xl p-5 bg-[#ff6b00]/12 border border-[#ff6b00]/30">
        <div className="flex items-center gap-2 mb-2">
          <Sprout className="w-5 h-5 text-[#ff6b00] dark:text-[#a9d2ec]" />
          <h2 className="font-display text-xl font-bold text-[#2B303B] dark:text-[#e4eff8]">{t("beginners_title")}</h2>
        </div>
        <p className="text-sm text-[#3F4A54] dark:text-[#AEB8BF] leading-relaxed">{t("beginners_intro")}</p>
        <button data-testid="impara-tour-replay" onClick={() => setTourForce((n) => n + 1)}
          className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#ff6b00] dark:text-[#a9d2ec] bg-white dark:bg-[#1e1e1e] border border-[#ff6b00]/30 px-3 py-1.5 rounded-lg active:scale-95 transition-all">
          {tri3(lang, "Come si fa?", "Wie geht's?", "How to?", "¿Cómo se hace?")}
        </button>
        {(() => {
          const lvl = getLevelProgress((i, d, e) => tri3(lang, i, d, e));
          return (
            <div data-testid="beginners-level" className="mt-3">
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wide ${lvl.cls}`}>
                {lvl.icon} {tri3(lang, "Livello", "Level", "Level", "Nivel")}: {lvl.name}
              </span>
              {!lvl.isMax && (
                <div className="mt-1.5 h-2 w-full max-w-[240px] rounded-full bg-[#2e2e2e] dark:bg-[#2e2e2e] overflow-hidden">
                  <div className="h-full rounded-full bg-[#C9A24B] transition-all" style={{ width: `${lvl.pct}%` }} />
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Percorso guidato principianti */}
      <div data-testid="beginner-path" className="rounded-2xl p-5 bg-white dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e]">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-display text-lg font-bold text-[#2B303B] dark:text-[#e4eff8]">{tri3(lang, "Il tuo percorso", "Dein Weg", "Your path", "Tu recorrido")}</h3>
          <span className="text-xs font-bold text-[#ff6b00]">{doneCount}/{PATH.length}</span>
        </div>
        <div className="h-2 rounded-full bg-[#e4eff8] dark:bg-[#1e1e1e] overflow-hidden mb-3">
          <div className="h-full bg-[#ff6b00] transition-all" style={{ width: `${(doneCount / PATH.length) * 100}%` }} />
        </div>
        <div className="space-y-2">
          {PATH.map((label, i) => {
            const ok = !!pathDone[i];
            return (
              <button key={i} data-testid={`beginner-step-${i}`} onClick={() => toggleStep(i)}
                className="w-full flex items-center gap-3 text-left active:scale-99 transition-all">
                {ok
                  ? <CheckCircle2 className="w-6 h-6 text-[#ff6b00] shrink-0" />
                  : <span className="w-6 h-6 rounded-full border-2 border-[#2e2e2e] dark:border-[#4a5560] flex items-center justify-center text-[11px] font-bold text-[#7E8A93] shrink-0">{i + 1}</span>}
                <span className={`text-sm ${ok ? "line-through text-[#7E8A93]" : "text-[#3F4A54] dark:text-[#AEB8BF]"}`}>{label}</span>
              </button>
            );
          })}
        </div>
        {doneCount === PATH.length && <p className="text-sm font-semibold text-[#ff6b00] mt-3">🎉 {tri3(lang, "Percorso completato! Sei pronto per il tuo primo pane.", "Weg abgeschlossen! Bereit für dein erstes Brot.", "Path completed! Ready for your first bread.", "¡Recorrido completado! Estás listo para tu primer pan.")}</p>}
      </div>

      {/* Ricetta del giorno gratis — cambia ogni giorno */}
      <div data-testid="recipe-of-day" className="rounded-2xl p-5 text-white bg-gradient-to-br from-[#1e1e1e] to-[#16202b] shadow-md">
        <div className="flex items-center gap-2 mb-1">
          <Star className="w-4 h-4" />
          <span className="text-[11px] font-bold uppercase tracking-wide text-white/85">{mkTri(lang)("Ricetta del giorno","Rezept des Tages","Recipe of the day","Receta del día")}</span>
        </div>
        <h3 className="font-display text-xl font-bold leading-tight">{today.name}</h3>
        <p className="text-sm text-white/90 mt-2"><b>{mkTri(lang)("Ingredienti", "Zutaten", "Ingredients", "Ingredientes")}:</b> {today.ing}</p>
        <p className="text-sm text-white/90 mt-1.5 leading-snug">{today.steps}</p>
      </div>

      {/* Pianifica il pane a casa */}
      <HomePlanner />

      {/* Academy da Casa — Mohammadreza assistente per l'home baker */}
      <div className="flex items-center gap-2 text-[#7E8A93] pt-2">
        <ChefHat className="w-4 h-4" />
        <span className="font-display text-lg font-bold">{tri3(lang, "Academy da Casa", "Heim-Academy", "Home Academy", "Academy en Casa")}</span>
      </div>
      <AcademyCoach />

      {/* SOS Impasto: manda la foto del pane a Mohammadreza per una diagnosi */}
      <button data-testid="beginners-sos-btn" onClick={() => setSosOpen(true)}
        className="w-full flex items-center gap-3 rounded-2xl p-4 bg-gradient-to-br from-[#ff6b00] to-[#7a1f1f] text-white shadow-md active:scale-98 transition-all">
        <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
          <Stethoscope className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="font-display text-base font-bold leading-tight">{tri3(lang, "SOS Impasto", "SOS Teig", "Dough SOS", "SOS Masa")}</p>
          <p className="text-[11px] text-white/85 leading-snug">{tri3(lang, "Manda la foto del tuo pane a Mohammadreza per una diagnosi immediata", "Sende Mohammadreza ein Foto deines Brotes für eine Sofortdiagnose", "Send Mohammadreza a photo of your bread for an instant diagnosis", "Envía a Mohammadreza una foto de tu pan para un diagnóstico inmediato")}</p>
        </div>
        <span className="text-xs font-bold bg-white/20 px-2.5 py-1 rounded-full shrink-0">{tri3(lang, "Apri", "Öffnen", "Open", "Abrir")}</span>
      </button>
      <SosImpasto open={sosOpen} onClose={() => setSosOpen(false)} onNavigate={onNavigate} />


      {beginners.map((s, i) => (
        <div key={i} data-testid={`beg-section-${i}`} className="bg-white dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] rounded-2xl p-5">
          <h3 className="font-display text-lg font-semibold text-[#2B303B] dark:text-[#e4eff8]">{s.title}</h3>
          <p className="text-sm text-[#3F4A54] dark:text-[#AEB8BF] mt-1 leading-relaxed">{s.body}</p>
        </div>
      ))}

      {/* Quiz del Fornaio */}
      <div className="flex items-center gap-2 text-[#7E8A93] pt-2">
        <Trophy className="w-4 h-4" />
        <span className="font-display text-lg font-bold">{t("beginners_quiz_title")}</span>
      </div>
      <p className="text-sm text-[#7E8A93] -mt-2">{t("beginners_quiz_sub")}</p>
      <EvolvingQuiz />

      {/* Bake-Along: sfida di panificazione della community con classifica */}
      <div className="flex items-center gap-2 text-[#7E8A93] pt-2">
        <Flame className="w-4 h-4" />
        <span className="font-display text-lg font-bold">{tri3(lang, "Sfida Bake-Along", "Bake-Along Challenge", "Bake-Along Challenge", "Reto Bake-Along")}</span>
      </div>
      <p className="text-sm text-[#7E8A93] -mt-2">{tri3(lang, "Sforna il tema della settimana, condividi la foto e vota i pani della community.", "Backe das Wochenthema, teile dein Foto und stimme für die Brote der Community ab.", "Bake this week's theme, share your photo and vote for the community's breads.", "Hornea el tema de la semana, comparte tu foto y vota los panes de la comunidad.")}</p>
      <BakeAlong />
    </div>
  );
}
