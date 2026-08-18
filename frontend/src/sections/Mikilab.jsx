import RecipeList from "@/components/RecipeList";
import { useLang } from "@/i18n/LanguageContext";
import { content } from "@/data/content";
import { Heart, ChefHat, Wheat, Sprout, ChevronLeft, ChevronRight, Quote, BookHeart, Youtube, PlayCircle, Trophy, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { useState } from "react";

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
};

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
};

function BakerQuiz() {
  const { t, lang } = useLang();
  const questions = QUIZ[lang] || QUIZ.it;
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
    if (idx + 1 >= questions.length) { setDone(true); return; }
    setIdx((n) => n + 1); setPicked(null);
  };

  if (!started) {
    return (
      <button data-testid="quiz-start-btn" onClick={start} className="w-full bg-[#6B8E62] hover:bg-[#5a7a52] text-white font-semibold px-5 py-3 rounded-2xl shadow-sm active:scale-98 transition-all flex items-center justify-center gap-2">
        <Trophy className="w-5 h-5" /> {t("quiz_start")}
      </button>
    );
  }

  if (done) {
    const msg = score >= 4 ? t("quiz_result_great") : score >= 2 ? t("quiz_result_good") : t("quiz_result_keep");
    return (
      <div data-testid="quiz-result" className="text-center bg-[#6B8E62]/12 border border-[#6B8E62]/30 rounded-2xl p-6">
        <Trophy className="w-10 h-10 text-[#6B8E62] mx-auto mb-2" />
        <p className="text-sm text-[#8C7567]">{t("quiz_your_score")}</p>
        <p className="font-display text-3xl font-bold text-[#2C221E] dark:text-[#F5EFE6] my-1">{score} / {questions.length}</p>
        <p className="text-sm text-[#4A3B34] dark:text-[#C9BBB0] mb-4">{msg}</p>
        <button data-testid="quiz-restart-btn" onClick={start} className="inline-flex items-center gap-2 bg-[#B34A26] text-white font-semibold px-5 py-2.5 rounded-xl">
          <RotateCcw className="w-4 h-4" /> {t("quiz_restart")}
        </button>
      </div>
    );
  }

  const cur = questions[idx];
  return (
    <div data-testid="quiz-panel" className="bg-white dark:bg-[#2A211D] border border-[#E8DEC8] dark:border-[#3D302A] rounded-2xl p-5">
      <p className="text-[10px] font-bold uppercase tracking-wide text-[#B34A26] mb-1">{t("quiz_question")} {idx + 1} / {questions.length}</p>
      <h4 className="font-display text-lg font-semibold text-[#2C221E] dark:text-[#F5EFE6] mb-3">{cur.q}</h4>
      <div className="space-y-2">
        {cur.options.map((opt, i) => {
          const isCorrect = i === cur.correct;
          const chosen = picked === i;
          let cls = "bg-[#F5EFE6] dark:bg-[#332823] border-[#E8DEC8] dark:border-[#3D302A]";
          if (picked != null && isCorrect) cls = "bg-[#6B8E62]/20 border-[#6B8E62]";
          else if (picked != null && chosen && !isCorrect) cls = "bg-[#B4442A]/15 border-[#B4442A]";
          return (
            <button key={i} data-testid={`quiz-option-${i}`} onClick={() => pick(i)} disabled={picked != null}
              className={`w-full flex items-center gap-2 text-left text-sm px-4 py-3 rounded-xl border transition-all ${cls}`}>
              <span className="flex-1 text-[#2C221E] dark:text-[#F5EFE6]">{opt}</span>
              {picked != null && isCorrect && <CheckCircle2 className="w-4 h-4 text-[#6B8E62] shrink-0" />}
              {picked != null && chosen && !isCorrect && <XCircle className="w-4 h-4 text-[#B4442A] shrink-0" />}
            </button>
          );
        })}
      </div>
      {picked != null && (
        <div className="mt-3 flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-[#4A3B34] dark:text-[#C9BBB0]">
            {picked === cur.correct ? t("quiz_correct") : `${t("quiz_wrong")} ${cur.options[cur.correct]}`}
          </p>
          <button data-testid="quiz-next-btn" onClick={next} className="shrink-0 bg-[#B34A26] text-white font-semibold px-4 py-2 rounded-xl">
            {t("quiz_next")}
          </button>
        </div>
      )}
    </div>
  );
}

export default function Mikilab() {
  const { t, lang } = useLang();
  const [imgOk, setImgOk] = useState(true);
  const [view, setView] = useState("main");
  const lm = content[lang].lievitoMadre;
  const beginners = BEGINNERS[lang] || BEGINNERS.it;
  const courses = content[lang].freeCourses || [];

  if (view === "lievito") {
    return (
      <div className="pb-4">
        <button data-testid="mikilab-back-btn" onClick={() => setView("main")} className="flex items-center gap-1 text-[#B34A26] font-medium mb-4">
          <ChevronLeft className="w-5 h-5" /> Mikilab
        </button>
        <div data-testid="lievito-page" className="space-y-4">
          <div className="rounded-2xl p-5 bg-[#D99B26]/12 border border-[#D99B26]/40">
            <div className="flex items-center gap-2 mb-2">
              <Wheat className="w-5 h-5 text-[#B34A26]" />
              <h2 className="font-display text-xl font-bold text-[#2C221E] dark:text-[#F5EFE6]">{t("lm_page_title")}</h2>
            </div>
            <p className="text-sm text-[#4A3B34] dark:text-[#C9BBB0] leading-relaxed">{lm.intro}</p>
          </div>
          {lm.sections.map((s, i) => (
            <div key={i} data-testid={`lm-section-${i}`} className="bg-white dark:bg-[#2A211D] border border-[#E8DEC8] dark:border-[#3D302A] rounded-2xl p-5">
              <h3 className="font-display text-lg font-semibold text-[#2C221E] dark:text-[#F5EFE6]">{s.title}</h3>
              <p className="text-sm text-[#4A3B34] dark:text-[#C9BBB0] mt-1 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (view === "principianti") {
    return (
      <div className="pb-4">
        <button data-testid="mikilab-back-btn" onClick={() => setView("main")} className="flex items-center gap-1 text-[#B34A26] font-medium mb-4">
          <ChevronLeft className="w-5 h-5" /> Mikilab
        </button>
        <div data-testid="beginners-page" className="space-y-4">
          <div className="rounded-2xl p-5 bg-[#6B8E62]/12 border border-[#6B8E62]/30">
            <div className="flex items-center gap-2 mb-2">
              <Sprout className="w-5 h-5 text-[#4d6b45] dark:text-[#9ec48f]" />
              <h2 className="font-display text-xl font-bold text-[#2C221E] dark:text-[#F5EFE6]">{t("beginners_title")}</h2>
            </div>
            <p className="text-sm text-[#4A3B34] dark:text-[#C9BBB0] leading-relaxed">{t("beginners_intro")}</p>
          </div>

          {beginners.map((s, i) => (
            <div key={i} data-testid={`beg-section-${i}`} className="bg-white dark:bg-[#2A211D] border border-[#E8DEC8] dark:border-[#3D302A] rounded-2xl p-5">
              <h3 className="font-display text-lg font-semibold text-[#2C221E] dark:text-[#F5EFE6]">{s.title}</h3>
              <p className="text-sm text-[#4A3B34] dark:text-[#C9BBB0] mt-1 leading-relaxed">{s.body}</p>
            </div>
          ))}

          {/* Video e corsi gratis */}
          <div className="flex items-center gap-2 text-[#8C7567] pt-2">
            <Youtube className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">{t("beginners_courses_title")}</span>
          </div>
          <p className="text-sm text-[#8C7567] -mt-2">{t("beginners_courses_sub")}</p>
          {courses.map((v, i) => (
            <div key={i} data-testid={`beg-course-${i}`} className="bg-white dark:bg-[#2A211D] border border-[#E8DEC8] dark:border-[#3D302A] rounded-2xl overflow-hidden">
              <div className="aspect-video bg-black">
                <iframe className="w-full h-full" src={v.url} title={v.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-[#B34A26]">{v.category}</span>
                  {v.isNew && <span className="text-[9px] font-bold uppercase text-white bg-[#6B8E62] px-1.5 py-0.5 rounded-full">New</span>}
                </div>
                <h3 className="font-display text-lg font-semibold text-[#2C221E] dark:text-[#F5EFE6] mt-0.5">{v.title}</h3>
                {v.source && <p className="text-xs text-[#8C7567] mt-0.5 flex items-center gap-1"><PlayCircle className="w-3 h-3" /> {v.source}</p>}
              </div>
            </div>
          ))}

          {/* Quiz del Fornaio */}
          <div className="flex items-center gap-2 text-[#8C7567] pt-2">
            <Trophy className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">{t("beginners_quiz_title")}</span>
          </div>
          <p className="text-sm text-[#8C7567] -mt-2">{t("beginners_quiz_sub")}</p>
          <BakerQuiz />
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Prefazione — versetto biblico */}
      <div data-testid="preface-card" className="mb-5 rounded-3xl p-5 bg-[#2C221E] dark:bg-[#241D19] text-[#F5EFE6] border border-[#D99B26]/40 relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 bg-cover bg-center opacity-30 pointer-events-none"
          style={{ backgroundImage: "url(https://images.unsplash.com/photo-1594842059196-5b6b8fa73187?crop=entropy&cs=srgb&fm=jpg&w=1000&q=75)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#2C221E] via-[#2C221E]/80 to-[#2C221E]/40 pointer-events-none" />
        <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <Quote className="w-5 h-5 text-[#E5AC3A]" />
          <h2 className="font-display text-lg font-bold text-[#E5AC3A] uppercase tracking-wide">{t("prefazione_label")}</h2>
        </div>
        <blockquote className="border-l-2 border-[#D99B26]/60 pl-3 mb-3">
          <p className="font-display text-base italic leading-relaxed">{t("prefazione_verse1")}</p>
          <p className="text-xs text-[#E5AC3A] mt-1">{t("prefazione_verse1_ref")}</p>
        </blockquote>
        <blockquote className="border-l-2 border-[#D99B26]/60 pl-3 mb-3">
          <p className="font-display text-base italic leading-relaxed">{t("prefazione_verse2")}</p>
          <p className="text-xs text-[#E5AC3A] mt-1">{t("prefazione_verse2_ref")}</p>
        </blockquote>
        <p className="text-sm text-[#F5EFE6]/90 leading-relaxed">{t("prefazione_body")}</p>
        </div>
      </div>

      <div data-testid="bio-card" className="mb-5 rounded-3xl p-5 bg-gradient-to-br from-[#B34A26] to-[#8C3A1D] text-white">
        <div className="flex items-center gap-2 mb-3">
          <Heart className="w-5 h-5" />
          <h2 className="font-display text-xl font-bold">{t("bio_title")}</h2>
        </div>
        <div className="flex items-start gap-4">
          <div data-testid="bio-photo" className="w-20 h-20 rounded-full overflow-hidden shrink-0 bg-white/15 border-2 border-white/40 flex items-center justify-center">
            {imgOk ? (
              <img src={`${process.env.PUBLIC_URL}/bio-photo.jpg`} alt="Michele" className="w-full h-full object-cover" onError={() => setImgOk(false)} />
            ) : (
              <ChefHat className="w-9 h-9 text-white/80" />
            )}
          </div>
          <p className="text-sm text-white/90 leading-relaxed flex-1">{t("bio_text")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 mb-5">
        <button data-testid="principianti-open-btn" onClick={() => setView("principianti")} className="w-full flex items-center gap-4 bg-white dark:bg-[#2A211D] border border-[#E8DEC8] dark:border-[#3D302A] rounded-2xl p-4 shadow-sm active:scale-98 transition-all text-left">
          <div className="w-12 h-12 rounded-2xl bg-[#6B8E62]/15 border border-[#6B8E62]/30 flex items-center justify-center shrink-0">
            <Sprout className="w-6 h-6 text-[#4d6b45] dark:text-[#9ec48f]" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-lg font-semibold text-[#2C221E] dark:text-[#F5EFE6]">{t("beginners_title")}</h3>
            <p className="text-sm text-[#8C7567] truncate">{t("beginners_sub")}</p>
          </div>
          <ChevronRight className="w-5 h-5 text-[#C9BBB0] shrink-0" />
        </button>

        <button data-testid="lievito-open-btn" onClick={() => setView("lievito")} className="w-full flex items-center gap-4 bg-white dark:bg-[#2A211D] border border-[#E8DEC8] dark:border-[#3D302A] rounded-2xl p-4 shadow-sm active:scale-98 transition-all text-left">
          <div className="w-12 h-12 rounded-2xl bg-[#D99B26]/15 border border-[#D99B26]/30 flex items-center justify-center shrink-0">
            <Wheat className="w-6 h-6 text-[#B34A26]" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-lg font-semibold text-[#2C221E] dark:text-[#F5EFE6]">{t("tab_lievito")}</h3>
            <p className="text-sm text-[#8C7567] truncate">{t("lm_page_title")}</p>
          </div>
          <ChevronRight className="w-5 h-5 text-[#C9BBB0] shrink-0" />
        </button>
      </div>

      <RecipeList
        collectionName="mikilab"
        readOnly
        heroImage={`${process.env.PUBLIC_URL}/bio-photo.jpg`}
        heroTitle={t("brand_subtitle")}
        heroSubtitle={t("mikilab_subtitle")}
        emptyText={t("mikilab_empty")}
      />

      {/* Pensiero finale — Colui che ha inventato i cereali */}
      <div data-testid="closing-card" className="mt-5 rounded-3xl p-5 bg-[#6B8E62]/12 border border-[#6B8E62]/30">
        <div className="flex items-center gap-2 mb-2">
          <BookHeart className="w-5 h-5 text-[#4d6b45] dark:text-[#9ec48f]" />
          <h2 className="font-display text-lg font-bold text-[#2C221E] dark:text-[#F5EFE6]">{t("closing_label")}</h2>
        </div>
        <p className="text-sm text-[#4A3B34] dark:text-[#C9BBB0] leading-relaxed">{t("closing_body")}</p>
      </div>
    </div>
  );
}
