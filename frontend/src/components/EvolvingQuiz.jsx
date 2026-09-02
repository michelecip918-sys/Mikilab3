import { useState, useEffect } from "react";
import { Trophy, CheckCircle2, XCircle, Loader2, RotateCcw, GraduationCap, Sparkles, Award, Flame, X } from "lucide-react";
import { academyApi, profileApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { useAuth } from "@/auth/AuthContext";
import { toast } from "sonner";
import { mkTri } from "@/i18n/triMaps";

const DIPLOMA_KEY = "mikilab_diplomato";
const MASTER_TARGET = 5; // risposte corrette di fila al livello Master per il diploma

// Quiz del Fornaio Casalingo: 3 livelli, domande generate dall'IA (infinite), spiegazione tecnica per risposta.
export default function EvolvingQuiz() {
  const { lang } = useLang();
  const { user } = useAuth();
  const tri = (i, d, e, s) => mkTri(lang)(i, d, e, s);

  const LEVELS = [
    { id: "apprendista", label: tri("Apprendista", "Anfänger", "Apprentice", "Aprendiz"), color: "#ff6b00" },
    { id: "avanzato", label: tri("Home Baker Avanzato", "Fortgeschritten", "Advanced", "Avanzado"), color: "#ff6b00" },
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
  const [board, setBoard] = useState(null);
  const [champion, setChampion] = useState(null);
  const [showBoard, setShowBoard] = useState(false);
  const loadBoard = () => { if (user) academyApi.leaderboard().then((d) => { setBoard(d.rows || []); setChampion(d.champion || null); }).catch(() => setBoard([])); };
  const [diploma, setDiploma] = useState(() => { try { return localStorage.getItem(DIPLOMA_KEY) === "1"; } catch { return false; } });
  const [theme, setTheme] = useState(null);       // {theme_id, title}
  const [themeMode, setThemeMode] = useState(false);

  useEffect(() => { academyApi.weeklyTheme(lang).then((t) => t && setTheme(t)).catch(() => {}); }, [lang]);

  useEffect(() => {
    if (!user) return;
    profileApi.get(user.user_id).then((p) => {
      if ((p?.badges || []).includes("diplomato")) { setDiploma(true); try { localStorage.setItem(DIPLOMA_KEY, "1"); } catch { /* */ } }
    }).catch(() => {});
  }, [user]);

  const loadQuestion = async (lvl = level, useTheme = themeMode) => {
    setLoading(true); setPicked(null); setQ(null);
    try {
      const data = await academyApi.quiz(lvl, lang, asked, useTheme && theme ? theme.title : null);
      setQ(data);
      setAsked((a) => [...a, data.question].slice(-12));
    } catch {
      toast.error(tri("Non riesco a generare la domanda, riprova.", "Frage konnte nicht erstellt werden.", "Couldn't generate the question, retry.", "No se pudo generar la pregunta."));
    } finally { setLoading(false); }
  };

  const startThemeChallenge = () => {
    setThemeMode(true); setStreak(0); setPicked(null); setQ(null); setAsked([]);
    loadQuestion(level, true);
  };
  const exitTheme = () => { setThemeMode(false); setQ(null); setPicked(null); };

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
        if (user) academyApi.quizScore(1).then(() => { if (showBoard) loadBoard(); });
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
    <div data-testid="evolving-quiz" className="rounded-2xl bg-white dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] p-5">
      <div className="flex items-center gap-2 mb-1">
        <GraduationCap className="w-5 h-5 text-[#ff6b00]" />
        <h3 className="font-display text-lg font-bold text-[#2B303B] dark:text-[#e4eff8]">{tri("Quiz del Fornaio Casalingo", "Heim-Bäcker-Quiz", "Home Baker Quiz", "Quiz del Panadero Casero")}</h3>
      </div>
      <p className="text-sm text-[#7E8A93] mb-3">{tri("Domande infinite generate dall'IA, con spiegazione tecnica ad ogni risposta.", "Unendliche KI-Fragen mit technischer Erklärung zu jeder Antwort.", "Infinite AI-generated questions with a technical explanation for every answer.", "Preguntas infinitas generadas por IA, con explicación técnica en cada respuesta.")}</p>

      {diploma && (
        <div data-testid="diploma-badge" className="flex items-center gap-2 mb-3 rounded-2xl shadow-md border border-amber-900/40 bg-gradient-to-r from-[#F0B429] to-[#ff6b00] text-white px-3 py-2 shadow-sm">
          <Award className="w-5 h-5 shrink-0" />
          <span className="text-sm font-bold">{tri("Fornaio Diplomato 🎓", "Diplom-Bäcker 🎓", "Certified Baker 🎓", "Panadero Diplomado 🎓")}</span>
        </div>
      )}
      {level === "master" && !diploma && (
        <p data-testid="master-progress" className="text-[11px] font-semibold text-[#ff6b00] mb-2">
          {tri(`Diploma: ${masterStreak}/${MASTER_TARGET} risposte Master di fila`, `Diplom: ${masterStreak}/${MASTER_TARGET} Master-Antworten in Folge`, `Diploma: ${masterStreak}/${MASTER_TARGET} Master answers in a row`, `Diploma: ${masterStreak}/${MASTER_TARGET} respuestas Master seguidas`)}
        </p>
      )}

      {/* Sfida a Tema settimanale */}
      {theme && (
        <div data-testid="weekly-theme-card" className="mb-3 rounded-2xl shadow-md border border-amber-900/40 p-3 text-white shadow-sm" style={{ background: themeMode ? "linear-gradient(135deg,#ff6b00,#7a1f1f)" : "linear-gradient(135deg,#ff6b00,#c94f00)" }}>
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wide text-white/80">{tri("Sfida della settimana", "Challenge der Woche", "Weekly challenge", "Desafío de la semana")}</p>
              <p data-testid="weekly-theme-title" className="font-display text-base font-bold leading-tight truncate">{theme.title}</p>
            </div>
            {themeMode ? (
              <button data-testid="weekly-theme-exit" onClick={exitTheme} className="text-xs font-bold bg-white/20 px-2.5 py-1.5 rounded-full flex items-center gap-1 active:scale-95"><X className="w-3.5 h-3.5" /> {tri("Esci", "Beenden", "Exit", "Salir")}</button>
            ) : (
              <button data-testid="weekly-theme-start" onClick={startThemeChallenge} className="text-xs font-bold bg-white text-[#c94f00] px-3 py-1.5 rounded-full active:scale-95">{tri("Gioca", "Spielen", "Play", "Jugar")}</button>
            )}
          </div>
          {themeMode && <p className="text-[11px] text-white/85 mt-1">{tri("Domande a tema attive: rispondi bene per scalare la classifica!", "Themenfragen aktiv: richtig antworten und aufsteigen!", "Themed questions on: answer well to climb the leaderboard!", "Preguntas temáticas activas: ¡responde bien para subir!")}</p>}
        </div>
      )}

      {/* Selettore livello */}
      <div className="grid grid-cols-3 gap-1.5 mb-3">
        {LEVELS.map((l) => (
          <button key={l.id} data-testid={`quiz-level-${l.id}`}
            onClick={() => { setLevel(l.id); setQ(null); setPicked(null); setStreak(0); setMasterStreak(0); }}
            className={`py-2 rounded-2xl shadow-md border border-amber-900/40 text-[11px] font-bold transition-all leading-tight ${level === l.id ? "text-white" : "bg-[#e4eff8] dark:bg-[#1e1e1e] text-[#7E8A93]"}`}
            style={level === l.id ? { background: l.color } : {}}>
            {l.label}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between mb-3 text-xs">
        <span data-testid="quiz-streak" className="font-semibold text-[#ff6b00] flex items-center gap-1"><Sparkles className="w-3.5 h-3.5" /> {tri("Serie", "Serie", "Streak", "Racha")}: {streak}</span>
        <span data-testid="quiz-best" className="font-semibold text-[#ff6b00] flex items-center gap-1"><Trophy className="w-3.5 h-3.5" /> {tri("Record", "Rekord", "Best", "Récord")}: {best}</span>
      </div>

      {user && (
        <button data-testid="quiz-leaderboard-toggle" onClick={() => { const n = !showBoard; setShowBoard(n); if (n) loadBoard(); }}
          className="w-full mb-3 flex items-center justify-center gap-2 text-[12px] font-bold text-[#2e8b6f] bg-[#2e8b6f]/10 border border-[#2e8b6f]/30 py-2 rounded-2xl shadow-md border border-amber-900/40 active:scale-98">
          <Trophy className="w-4 h-4" /> {showBoard ? tri("Nascondi sfida", "Challenge ausblenden", "Hide challenge", "Ocultar desafío") : tri("Sfida della Settimana 👑", "Challenge der Woche 👑", "Weekly Challenge 👑", "Desafío de la Semana 👑")}
        </button>
      )}
      {user && showBoard && (
        <div data-testid="quiz-leaderboard" className="mb-3 rounded-2xl shadow-md border border-amber-900/40 bg-[#121212] dark:bg-[#181818] border border-[#2e2e2e] dark:border-[#2e2e2e] p-3 space-y-1.5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#7E8A93] mb-1">{tri("Sfida «Fornaio della Settimana» — punti Master tra amici", "Challenge «Bäcker der Woche» — Master-Punkte unter Freunden", "«Baker of the Week» challenge — Master points among friends", "Desafío «Panadero de la Semana» — puntos Master entre amigos")}</p>
          {champion && (
            <div data-testid="quiz-champion" className="flex items-center gap-2.5 rounded-lg bg-gradient-to-r from-[#ff6b00] to-[#c94f00] text-white px-2.5 py-2 mb-1">
              <span className="text-lg">🏆</span>
              <div className="w-7 h-7 rounded-full overflow-hidden bg-white/20 flex items-center justify-center text-xs font-bold shrink-0">{champion.picture ? <img src={champion.picture} alt="" className="w-full h-full object-cover" /> : (champion.name || "F")[0].toUpperCase()}</div>
              <span className="flex-1 min-w-0 truncate text-[13px] font-bold">{tri("Campione scorsa settimana:", "Champion letzte Woche:", "Last week's champion:", "Campeón semana pasada:")} {champion.name}{champion.me ? tri(" (tu!)", " (du!)", " (you!)", " (tú!)") : ""}</span>
            </div>
          )}
          {board === null ? (
            <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-[#2e8b6f]" /></div>
          ) : board.length === 0 ? (
            <p className="text-sm text-[#7E8A93] py-2">{tri("Ancora nessun punto. Rispondi al livello Master per scalare la classifica e diventare Fornaio della Settimana!", "Noch keine Punkte. Beantworte Master-Fragen, um Bäcker der Woche zu werden!", "No points yet. Answer Master questions to become Baker of the Week!", "Sin puntos aún. ¡Responde en Master para ser Panadero de la Semana!")}</p>
          ) : board.map((r, idx) => (
            <div key={r.user_id} data-testid={`leaderboard-row-${r.user_id}`} className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 ${r.me ? "bg-[#ff6b00]/10" : ""} ${idx === 0 && r.points > 0 ? "ring-1 ring-[#ff6b00]/40" : ""}`}>
              <span className={`w-5 text-center text-sm font-extrabold ${idx === 0 ? "text-[#ff6b00]" : "text-[#7E8A93]"}`}>{idx === 0 && r.points > 0 ? "👑" : idx + 1}</span>
              <div className="w-8 h-8 rounded-full overflow-hidden bg-[#1e1e1e] flex items-center justify-center text-white text-xs font-bold shrink-0">{r.picture ? <img src={r.picture} alt={r.name} className="w-full h-full object-cover" /> : (r.name || "F")[0].toUpperCase()}</div>
              <span className="flex-1 min-w-0 truncate text-sm font-semibold text-[#2B303B] dark:text-[#e4eff8]">{r.name}{r.me ? tri(" (tu)", " (du)", " (you)", " (tú)") : ""}</span>
              {r.champion && <span title="Fornaio della Settimana" className="text-sm">🏆</span>}
              {r.diplomato && <span title="Fornaio Diplomato" className="text-sm">🎓</span>}
              <span className="text-sm font-extrabold text-[#2e8b6f]">{r.points}</span>
            </div>
          ))}
        </div>
      )}

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
              let cls = "bg-[#e4eff8] dark:bg-[#1e1e1e] border-[#2e2e2e] dark:border-[#2e2e2e]";
              if (picked != null && isCorrect) cls = "bg-[#2e8b6f]/15 border-[#2e8b6f]";
              else if (picked != null && chosen && !isCorrect) cls = "bg-[#ff6b00]/15 border-[#ff6b00]";
              return (
                <button key={i} data-testid={`quiz-opt-${i}`} onClick={() => pick(i)} disabled={picked != null}
                  className={`w-full flex items-center gap-2 text-left text-sm px-4 py-3 rounded-2xl shadow-md border border-amber-900/40 border transition-all ${cls}`}>
                  <span className="flex-1 text-[#2B303B] dark:text-[#e4eff8]">{opt}</span>
                  {picked != null && isCorrect && <CheckCircle2 className="w-4 h-4 text-[#2e8b6f] shrink-0" />}
                  {picked != null && chosen && !isCorrect && <XCircle className="w-4 h-4 text-[#ff6b00] shrink-0" />}
                </button>
              );
            })}
          </div>

          {picked != null && (
            <div data-testid="quiz-explanation" className="mt-3 rounded-2xl shadow-md border border-amber-900/40 bg-[#121212] dark:bg-[#181818] border border-[#2e2e2e] dark:border-[#2e2e2e] p-3">
              <p className={`text-sm font-bold mb-1 ${picked === q.correct ? "text-[#2e8b6f]" : "text-[#ff6b00]"}`}>
                {picked === q.correct ? tri("✅ Corretto!", "✅ Richtig!", "✅ Correct!", "✅ ¡Correcto!") : tri("❌ Sbagliato", "❌ Falsch", "❌ Wrong", "❌ Incorrecto")}
              </p>
              <p className="text-sm text-[#3F4A54] dark:text-[#AEB8BF] leading-relaxed">{q.explanation}</p>
              <button data-testid="quiz-next" data-sfx="confirm" onClick={() => loadQuestion()}
                className="mt-3 w-full text-white font-semibold px-4 py-2.5 rounded-2xl shadow-md border border-amber-900/40 active:scale-98 transition-all flex items-center justify-center gap-2" style={{ background: curLevel.color }}>
                <RotateCcw className="w-4 h-4" /> {tri("Prossima domanda", "Nächste Frage", "Next question", "Siguiente pregunta")}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
