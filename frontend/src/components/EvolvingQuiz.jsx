import { useState, useEffect } from "react";
import { Trophy, CheckCircle2, XCircle, Loader2, RotateCcw, GraduationCap, Sparkles, Award } from "lucide-react";
import { academyApi, profileApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { useAuth } from "@/auth/AuthContext";
import { toast } from "sonner";

const DIPLOMA_KEY = "mikilab_diplomato";
const MASTER_TARGET = 5; // risposte corrette di fila al livello Master per il diploma

// Quiz del Fornaio Casalingo: 3 livelli, domande generate dall'IA (infinite), spiegazione tecnica per risposta.
export default function EvolvingQuiz() {
  const { lang } = useLang();
  const { user } = useAuth();
  const tri = (i, d, e, s) => (lang === "de" ? d : lang === "es" ? (s ?? e ?? i) : lang === "en" ? (e ?? i) : i);

  const LEVELS = [
    { id: "apprendista", label: tri("Apprendista", "Anfänger", "Apprentice", "Aprendiz"), color: "#5aa0cf" },
    { id: "avanzato", label: tri("Home Baker Avanzato", "Fortgeschritten", "Advanced", "Avanzado"), color: "#a9772f" },
    { id: "master", label: tri("Master Baker di Casa", "Heim-Master", "Home Master", "Master de Casa"), color: "#2e8b6f" },
  ];

  const [level, setLevel] = useState("apprendista");
  const [q, setQ] = useState(null);
  const [loading, setLoading] = useState(false);
  const [picked, setPicked] = useState(null);
  const [streak, setStreak] = useState(0);
  const [asked, setAsked] = useState([]);
  const BKEY = "mikilab_academy_quiz_best";
  const [best, setBest] = useState(() => Number(localStorage.getItem(BKEY) || 0));
  const [masterStreak, setMasterStreak] = useState(0);
  const [diploma, setDiploma] = useState(() => { try { return localStorage.getItem(DIPLOMA_KEY) === "1"; } catch { return false; } });

  useEffect(() => {
    if (!user) return;
    profileApi.get(user.user_id).then((p) => {
      if ((p?.badges || []).includes("diplomato")) { setDiploma(true); try { localStorage.setItem(DIPLOMA_KEY, "1"); } catch { /* */ } }
    }).catch(() => {});
  }, [user]);

  const loadQuestion = async (lvl = level) => {
    setLoading(true); setPicked(null); setQ(null);
    try {
      const data = await academyApi.quiz(lvl, lang, asked);
      setQ(data);
      setAsked((a) => [...a, data.question].slice(-12));
    } catch {
      toast.error(tri("Non riesco a generare la domanda, riprova.", "Frage konnte nicht erstellt werden.", "Couldn't generate the question, retry.", "No se pudo generar la pregunta."));
    } finally { setLoading(false); }
  };

  const pick = (i) => {
    if (picked != null || !q) return;
    setPicked(i);
    if (i === q.correct) {
      const ns = streak + 1;
      setStreak(ns);
      if (ns > best) { setBest(ns); try { localStorage.setItem(BKEY, String(ns)); } catch { /* */ } }
      if (level === "master") {
        const ms = masterStreak + 1;
        setMasterStreak(ms);
        if (ms >= MASTER_TARGET && !diploma) awardDiploma();
      }
    } else {
      setStreak(0);
      if (level === "master") setMasterStreak(0);
    }
  };

  const awardDiploma = async () => {
    setDiploma(true);
    try { localStorage.setItem(DIPLOMA_KEY, "1"); } catch { /* */ }
    toast.success(tri("🎓 Complimenti! Hai ottenuto il badge «Fornaio Diplomato»!", "🎓 Glückwunsch! Du hast das Abzeichen «Diplom-Bäcker» erhalten!", "🎓 Congratulations! You earned the «Certified Baker» badge!", "🎓 ¡Enhorabuena! Has conseguido la insignia «Panadero Diplomado»!"), { duration: 6000 });
    if (user) {
      try { await academyApi.grantBadge("diplomato"); window.dispatchEvent(new CustomEvent("mikilab-profile-updated")); } catch { /* */ }
    } else {
      toast.message(tri("Accedi per mostrare il badge nel tuo profilo Social.", "Melde dich an, um das Abzeichen im Profil zu zeigen.", "Sign in to show the badge on your Social profile.", "Inicia sesión para mostrar la insignia en tu perfil."));
    }
  };

  const curLevel = LEVELS.find((l) => l.id === level) || LEVELS[0];

  return (
    <div data-testid="evolving-quiz" className="rounded-2xl bg-white dark:bg-[#232A31] border border-[#d5e4f0] dark:border-[#38424B] p-5">
      <div className="flex items-center gap-2 mb-1">
        <GraduationCap className="w-5 h-5 text-[#a9772f]" />
        <h3 className="font-display text-lg font-bold text-[#2B303B] dark:text-[#e4eff8]">{tri("Quiz del Fornaio Casalingo", "Heim-Bäcker-Quiz", "Home Baker Quiz", "Quiz del Panadero Casero")}</h3>
      </div>
      <p className="text-sm text-[#7E8A93] mb-3">{tri("Domande infinite generate dall'IA, con spiegazione tecnica ad ogni risposta.", "Unendliche KI-Fragen mit technischer Erklärung zu jeder Antwort.", "Infinite AI-generated questions with a technical explanation for every answer.", "Preguntas infinitas generadas por IA, con explicación técnica en cada respuesta.")}</p>

      {diploma && (
        <div data-testid="diploma-badge" className="flex items-center gap-2 mb-3 rounded-xl bg-gradient-to-r from-[#a9772f] to-[#8a5a2b] text-white px-3 py-2 shadow-sm">
          <Award className="w-5 h-5 shrink-0" />
          <span className="text-sm font-bold">{tri("Fornaio Diplomato 🎓", "Diplom-Bäcker 🎓", "Certified Baker 🎓", "Panadero Diplomado 🎓")}</span>
        </div>
      )}
      {level === "master" && !diploma && (
        <p data-testid="master-progress" className="text-[11px] font-semibold text-[#a9772f] mb-2">
          {tri(`Diploma: ${masterStreak}/${MASTER_TARGET} risposte Master di fila`, `Diplom: ${masterStreak}/${MASTER_TARGET} Master-Antworten in Folge`, `Diploma: ${masterStreak}/${MASTER_TARGET} Master answers in a row`, `Diploma: ${masterStreak}/${MASTER_TARGET} respuestas Master seguidas`)}
        </p>
      )}

      {/* Selettore livello */}
      <div className="grid grid-cols-3 gap-1.5 mb-3">
        {LEVELS.map((l) => (
          <button key={l.id} data-testid={`quiz-level-${l.id}`}
            onClick={() => { setLevel(l.id); setQ(null); setPicked(null); setStreak(0); setMasterStreak(0); }}
            className={`py-2 rounded-xl text-[11px] font-bold transition-all leading-tight ${level === l.id ? "text-white" : "bg-[#e4eff8] dark:bg-[#2A323A] text-[#7E8A93]"}`}
            style={level === l.id ? { background: l.color } : {}}>
            {l.label}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between mb-3 text-xs">
        <span data-testid="quiz-streak" className="font-semibold text-[#3f7cac] flex items-center gap-1"><Sparkles className="w-3.5 h-3.5" /> {tri("Serie", "Serie", "Streak", "Racha")}: {streak}</span>
        <span data-testid="quiz-best" className="font-semibold text-[#a9772f] flex items-center gap-1"><Trophy className="w-3.5 h-3.5" /> {tri("Record", "Rekord", "Best", "Récord")}: {best}</span>
      </div>

      {!q && !loading && (
        <button data-testid="quiz-start" data-sfx="confirm" onClick={() => loadQuestion()}
          className="w-full text-white font-semibold px-5 py-3 rounded-2xl shadow-sm active:scale-98 transition-all flex items-center justify-center gap-2" style={{ background: curLevel.color }}>
          <GraduationCap className="w-5 h-5" /> {tri("Inizia il quiz", "Quiz starten", "Start the quiz", "Empezar el quiz")}
        </button>
      )}

      {loading && <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" style={{ color: curLevel.color }} /></div>}

      {q && !loading && (
        <div data-testid="quiz-question-card">
          <h4 className="font-display text-base font-semibold text-[#2B303B] dark:text-[#e4eff8] mb-3 leading-snug">{q.question}</h4>
          <div className="space-y-2">
            {q.options.map((opt, i) => {
              const isCorrect = i === q.correct;
              const chosen = picked === i;
              let cls = "bg-[#e4eff8] dark:bg-[#2A323A] border-[#d5e4f0] dark:border-[#38424B]";
              if (picked != null && isCorrect) cls = "bg-[#2e8b6f]/15 border-[#2e8b6f]";
              else if (picked != null && chosen && !isCorrect) cls = "bg-[#C0574D]/15 border-[#C0574D]";
              return (
                <button key={i} data-testid={`quiz-opt-${i}`} onClick={() => pick(i)} disabled={picked != null}
                  className={`w-full flex items-center gap-2 text-left text-sm px-4 py-3 rounded-xl border transition-all ${cls}`}>
                  <span className="flex-1 text-[#2B303B] dark:text-[#e4eff8]">{opt}</span>
                  {picked != null && isCorrect && <CheckCircle2 className="w-4 h-4 text-[#2e8b6f] shrink-0" />}
                  {picked != null && chosen && !isCorrect && <XCircle className="w-4 h-4 text-[#C0574D] shrink-0" />}
                </button>
              );
            })}
          </div>

          {picked != null && (
            <div data-testid="quiz-explanation" className="mt-3 rounded-xl bg-[#f0f6fb] dark:bg-[#1F252B] border border-[#d5e4f0] dark:border-[#38424B] p-3">
              <p className={`text-sm font-bold mb-1 ${picked === q.correct ? "text-[#2e8b6f]" : "text-[#C0574D]"}`}>
                {picked === q.correct ? tri("✅ Corretto!", "✅ Richtig!", "✅ Correct!", "✅ ¡Correcto!") : tri("❌ Sbagliato", "❌ Falsch", "❌ Wrong", "❌ Incorrecto")}
              </p>
              <p className="text-sm text-[#3F4A54] dark:text-[#AEB8BF] leading-relaxed">{q.explanation}</p>
              <button data-testid="quiz-next" data-sfx="confirm" onClick={() => loadQuestion()}
                className="mt-3 w-full text-white font-semibold px-4 py-2.5 rounded-xl active:scale-98 transition-all flex items-center justify-center gap-2" style={{ background: curLevel.color }}>
                <RotateCcw className="w-4 h-4" /> {tri("Prossima domanda", "Nächste Frage", "Next question", "Siguiente pregunta")}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
