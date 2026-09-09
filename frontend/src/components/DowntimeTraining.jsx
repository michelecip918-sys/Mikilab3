import { useState, useEffect } from "react";
import { GraduationCap, Loader2, Play, Volume2, CheckCircle2, XCircle, AlertTriangle, RefreshCw, ChevronRight } from "lucide-react";
import { api, recipesApi } from "@/lib/api";
import { playTTS } from "@/lib/tts";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// FASE 3 · Formazione nei Tempi Morti — Mike Mix guida micro-lezioni interattive per ricetta.
export default function DowntimeTraining() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [recipes, setRecipes] = useState([]);
  const [sel, setSel] = useState("");
  const [busy, setBusy] = useState(false);
  const [lesson, setLesson] = useState(null);
  const [answers, setAnswers] = useState({});
  const [err, setErr] = useState(false);

  useEffect(() => {
    recipesApi.list("mikilab").then((r) => setRecipes(Array.isArray(r) ? r : [])).catch(() => setRecipes([]));
  }, []);

  const speak = (t) => { try { if (t) playTTS(t, { lang, voice: "mikemix" }); } catch { /* */ } };

  const start = async () => {
    setBusy(true); setErr(false); setLesson(null); setAnswers({});
    try {
      const body = sel ? { recipe_id: sel, lang } : { lang };
      const { data } = await api.post("/mike/training", body, { timeout: 70000 });
      setLesson(data);
      speak(`${data.title}. ${data.intro || ""}`);
    } catch (e) { setErr(true); }
    setBusy(false);
  };

  const score = lesson?.quiz ? lesson.quiz.reduce((n, q, i) => n + (answers[i] === q.answer_index ? 1 : 0), 0) : 0;
  const allAnswered = lesson?.quiz && Object.keys(answers).length === lesson.quiz.length;

  return (
    <div data-testid="downtime-training" className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 shrink-0 rounded-xl bg-[#FF9D42]/10 border border-[#FF9D42]/40 flex items-center justify-center shadow-[0_0_18px_rgba(125,211,252,0.3)]">
          <GraduationCap className="w-6 h-6 text-[#FF9D42]" />
        </div>
        <div>
          <h3 className="font-cyber text-base font-black text-white uppercase tracking-wide">{tri("Formazione nei Tempi Morti", "Schulung in Leerlaufzeiten", "Downtime Training", "Formación en Tiempos Muertos", "Formation pendant les temps morts", "آموزش در زمان‌های خالی")}</h3>
          <p className="text-[11px] text-[#94A3B8] mt-0.5 max-w-md">{tri(
            "Nelle pause, Mike Mix trasforma un momento libero in una micro-lezione pratica su una ricetta.",
            "In den Pausen macht Mike Mix aus einem freien Moment eine praktische Mini-Lektion zu einem Rezept.",
            "During breaks, Mike Mix turns a free moment into a hands-on micro-lesson on a recipe.",
            "En las pausas, Mike Mix convierte un momento libre en una micro-lección práctica sobre una receta.",
            "Pendant les pauses, Mike Mix transforme un moment libre en une micro-leçon pratique sur une recette.",
            "در استراحت‌ها، Mike Mix یک لحظه آزاد را به درس کوچک عملی درباره یک دستور تبدیل می‌کند.")}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <select data-testid="training-recipe-select" value={sel} onChange={(e) => setSel(e.target.value)}
          className="flex-1 rounded-lg bg-[#0b0f19] border border-[#1e293b] text-white text-sm px-3 py-2.5 focus:border-[#FF9D42] outline-none">
          <option value="">{tri("Lezione a sorpresa (Mike Mix sceglie)", "Überraschungslektion (Mike Mix wählt)", "Surprise lesson (Mike Mix picks)", "Lección sorpresa (Mike Mix elige)", "Leçon surprise (Mike Mix choisit)", "درس شگفتی (Mike Mix انتخاب می‌کند)")}</option>
          {recipes.map((r) => (<option key={r.id} value={r.id}>{r.name}</option>))}
        </select>
        <button data-testid="training-start-btn" onClick={start} disabled={busy}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-cyber font-black text-sm text-[#060A10] active:scale-95 transition-all disabled:opacity-60"
          style={{ background: "linear-gradient(90deg,#FF9D42,#FF6B00)", boxShadow: "0 0 18px rgba(125,211,252,0.4)" }}>
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          {busy ? tri("Mike Mix prepara…", "Mike Mix bereitet vor…", "Mike Mix prepares…", "Mike Mix prepara…", "Mike Mix prépare…", "در حال آماده‌سازی…") : tri("Avvia lezione", "Lektion starten", "Start lesson", "Iniciar lección", "Démarrer", "شروع درس")}
        </button>
      </div>

      {err && <p data-testid="training-error" className="text-xs font-bold text-red-400">{tri("Mike Mix non è riuscito a preparare la lezione. Riprova.", "Mike Mix konnte die Lektion nicht erstellen. Nochmal.", "Mike Mix couldn't prepare the lesson. Try again.", "Mike Mix no pudo preparar la lección.", "Mike Mix n'a pas pu préparer la leçon.", "آماده‌سازی درس ناموفق بود.")}</p>}

      {lesson && (
        <div data-testid="training-lesson" className="rounded-xl bg-[#0b0f19] border border-[#FF9D42]/25 p-4 space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-bold text-white text-[15px]">{lesson.title}</h4>
              {lesson.duration_min && <span className="text-[10px] font-mono text-[#FF9D42] uppercase tracking-widest">≈ {lesson.duration_min} min · {lesson.recipe_name}</span>}
            </div>
            <button data-testid="training-listen" onClick={() => speak(`${lesson.title}. ${lesson.intro}. ${(lesson.steps || []).map((s) => `${s.title}. ${s.detail}`).join(". ")}`)}
              className="shrink-0 inline-flex items-center gap-1 text-[11px] font-bold text-[#FF9D42] active:scale-90 transition-all"><Volume2 className="w-4 h-4" /> {tri("Ascolta", "Hören", "Listen", "Escuchar", "Écouter", "بشنو")}</button>
          </div>
          {lesson.intro && <p className="text-[13px] text-[#c5d3df] leading-relaxed">{lesson.intro}</p>}

          {(lesson.steps || []).length > 0 && (
            <ol data-testid="training-steps" className="space-y-2">
              {lesson.steps.map((s, i) => (
                <li key={i} className="flex gap-2.5">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-[#FF9D42]/15 border border-[#FF9D42]/40 text-[#FF9D42] text-xs font-black flex items-center justify-center">{i + 1}</span>
                  <div><p className="text-[13px] font-bold text-white">{s.title}</p><p className="text-[12px] text-[#CBD5E1] leading-snug">{s.detail}</p></div>
                </li>
              ))}
            </ol>
          )}

          {(lesson.mistakes || []).length > 0 && (
            <div data-testid="training-mistakes" className="rounded-lg bg-[#f59e0b]/8 border border-[#f59e0b]/30 p-3 space-y-2">
              <p className="flex items-center gap-1.5 text-[11px] font-black text-[#f59e0b] uppercase tracking-wide"><AlertTriangle className="w-3.5 h-3.5" /> {tri("Errori da evitare", "Zu vermeidende Fehler", "Mistakes to avoid", "Errores a evitar", "Erreurs à éviter", "خطاهایی که باید پرهیز کرد")}</p>
              {lesson.mistakes.map((m, i) => (
                <p key={i} className="text-[12px] text-[#d7c9a8] leading-snug"><span className="text-[#f59e0b] font-bold">✗ {m.wrong}</span> → <span className="text-[#7FD8C0]">{m.fix}</span></p>
              ))}
            </div>
          )}

          {(lesson.quiz || []).length > 0 && (
            <div data-testid="training-quiz" className="space-y-3">
              <p className="flex items-center gap-1.5 text-[11px] font-black text-[#FF6B00] uppercase tracking-wide"><ChevronRight className="w-3.5 h-3.5" /> {tri("Quiz veloce", "Kurzes Quiz", "Quick quiz", "Quiz rápido", "Quiz rapide", "آزمون سریع")}</p>
              {lesson.quiz.map((q, qi) => (
                <div key={qi} data-testid={`training-q-${qi}`} className="rounded-lg bg-[#060A10] border border-[#1e293b] p-3">
                  <p className="text-[13px] font-semibold text-white mb-2">{qi + 1}. {q.q}</p>
                  <div className="grid gap-1.5">
                    {(q.options || []).map((opt, oi) => {
                      const chosen = answers[qi];
                      const answered = chosen != null;
                      const isCorrect = oi === q.answer_index;
                      const isChosen = chosen === oi;
                      let cls = "border-[#1e293b] text-[#c5d3df]";
                      if (answered && isCorrect) cls = "border-[#22c55e]/60 bg-[#22c55e]/10 text-[#86efac]";
                      else if (answered && isChosen && !isCorrect) cls = "border-[#f43f5e]/60 bg-[#f43f5e]/10 text-[#fda4af]";
                      return (
                        <button key={oi} data-testid={`training-q-${qi}-opt-${oi}`} disabled={answered}
                          onClick={() => setAnswers((a) => ({ ...a, [qi]: oi }))}
                          className={`text-left text-[12.5px] px-3 py-2 rounded-lg border transition-all active:scale-[0.99] ${cls} disabled:cursor-default`}>
                          <span className="inline-flex items-center gap-1.5">
                            {answered && isCorrect && <CheckCircle2 className="w-3.5 h-3.5 text-[#22c55e]" />}
                            {answered && isChosen && !isCorrect && <XCircle className="w-3.5 h-3.5 text-[#f43f5e]" />}
                            {opt}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              {allAnswered && (
                <div data-testid="training-score" className="flex items-center justify-between rounded-lg bg-[#FF9D42]/10 border border-[#FF9D42]/40 px-4 py-3">
                  <span className="text-sm font-black text-white">{tri("Punteggio", "Ergebnis", "Score", "Puntuación", "Score", "امتیاز")}: <span className="text-[#FF6B00]">{score}/{lesson.quiz.length}</span></span>
                  <button data-testid="training-restart" onClick={start} className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF9D42] active:scale-95"><RefreshCw className="w-3.5 h-3.5" /> {tri("Nuova lezione", "Neue Lektion", "New lesson", "Nueva lección", "Nouvelle leçon", "درس جدید")}</button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
