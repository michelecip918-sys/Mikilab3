import { useState, useEffect, useCallback } from "react";
import { ChevronRight, GraduationCap, Lock, Check, Trophy, Loader2, Award } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { useAuth } from "@/auth/AuthContext";
import { challengesApi } from "@/lib/api";
import { toast } from "sonner";

const PATHS = [
  { id: "base", it: "Livello 1 · Le Basi", en: "Level 1 · The Basics", icon: "🌾",
    intro: { it: "Farina, acqua, sale e lievito: come nasce un impasto e cosa fa ogni ingrediente.", en: "Flour, water, salt and yeast: how a dough is born and what each ingredient does." },
    quiz: [
      { q: { it: "Cosa indica l'idratazione di un impasto?", en: "What does dough hydration indicate?" }, a: [{ it: "Il % di acqua sulla farina", en: "The % of water over flour" }, { it: "La quantità di sale", en: "The amount of salt" }, { it: "Il tempo di cottura", en: "The baking time" }], c: 0 },
      { q: { it: "A cosa serve il sale nell'impasto?", en: "What is salt for in dough?" }, a: [{ it: "Solo al sapore", en: "Only flavour" }, { it: "Gusto + rinforza il glutine e regola la lievitazione", en: "Flavour + strengthens gluten and controls proofing" }, { it: "A far lievitare", en: "To make it rise" }], c: 1 },
      { q: { it: "L'incordatura è…", en: "Gluten development (incordatura) is…" }, a: [{ it: "Quando l'impasto è liscio, elastico e fa il velo", en: "When the dough is smooth, elastic and forms a 'window'" }, { it: "Quando brucia in forno", en: "When it burns in the oven" }, { it: "Un tipo di farina", en: "A type of flour" }], c: 0 },
    ] },
  { id: "lievito", it: "Livello 2 · Il Lievito Madre", en: "Level 2 · Sourdough", icon: "🫧",
    intro: { it: "Rinfreschi, forza e gestione del lievito madre e dei prefermenti (poolish, biga).", en: "Refreshes, strength and management of sourdough and preferments (poolish, biga)." },
    quiz: [
      { q: { it: "Cosa significa 'rinfrescare' il lievito madre?", en: "What does 'refreshing' the sourdough mean?" }, a: [{ it: "Nutrirlo con nuova farina e acqua", en: "Feeding it with fresh flour and water" }, { it: "Metterlo in freezer", en: "Putting it in the freezer" }, { it: "Aggiungere sale", en: "Adding salt" }], c: 0 },
      { q: { it: "Il poolish ha idratazione…", en: "Poolish hydration is…" }, a: [{ it: "45%", en: "45%" }, { it: "100%", en: "100%" }, { it: "20%", en: "20%" }], c: 1 },
      { q: { it: "Quando usare il lievito madre al culmine?", en: "When to use sourdough at its peak?" }, a: [{ it: "Quando è raddoppiato e attivo", en: "When it has doubled and is active" }, { it: "Appena rinfrescato", en: "Right after refreshing" }, { it: "Quando è liquido e acido", en: "When it's liquid and sour" }], c: 0 },
    ] },
  { id: "panettone", it: "Livello 3 · Il Panettone", en: "Level 3 · Panettone", icon: "🎄",
    intro: { it: "Il grande lievitato: primo e secondo impasto, incordatura, pirlatura e cottura al cuore.", en: "The great leavened cake: first and second dough, gluten, shaping and core baking." },
    quiz: [
      { q: { it: "Quanti impasti principali ha il panettone classico?", en: "How many main doughs does classic panettone have?" }, a: [{ it: "Uno", en: "One" }, { it: "Due (primo e secondo)", en: "Two (first and second)" }, { it: "Cinque", en: "Five" }], c: 1 },
      { q: { it: "Perché si capovolge dopo la cottura?", en: "Why is it turned upside down after baking?" }, a: [{ it: "Per non farlo collassare mentre si raffredda", en: "So it doesn't collapse while cooling" }, { it: "Per decorarlo", en: "To decorate it" }, { it: "Per cuocerlo di più", en: "To bake it more" }], c: 0 },
      { q: { it: "La temperatura al cuore a fine cottura è circa…", en: "The core temperature at the end of baking is about…" }, a: [{ it: "60°C", en: "60°C" }, { it: "94-96°C", en: "94-96°C" }, { it: "120°C", en: "120°C" }], c: 1 },
    ] },
];

export default function ImparaLivelli({ onBack }) {
  const { lang } = useLang();
  const { user, setAuthOpen } = useAuth();
  const T = (o) => (o ? (o[lang] || o.en || o.it) : "");
  const L = (i, e) => (lang === "it" ? i : (e ?? i));

  const [done, setDone] = useState(new Set());
  const [active, setActive] = useState(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const st = await challengesApi.state();
    setDone(new Set((st?.completed || []).filter((x) => x.startsWith("learn_")).map((x) => x.replace("learn_", ""))));
  }, [user]);
  useEffect(() => { load(); }, [load]);

  const isUnlocked = (idx) => idx === 0 || done.has(PATHS[idx - 1].id);

  const openPath = (p, idx) => {
    if (!user) { setAuthOpen(true); return; }
    if (!isUnlocked(idx)) { toast.message(L("Completa prima il livello precedente.", "Complete the previous level first.")); return; }
    setActive(p); setStep(0); setAnswers([]);
  };

  const answer = (ai) => setAnswers((a) => [...a.slice(0, step), ai]);

  const finish = async () => {
    const score = active.quiz.reduce((s, q, i) => s + (answers[i] === q.c ? 1 : 0), 0);
    if (score < 2) { toast.error(L(`Punteggio ${score}/${active.quiz.length}. Riprova!`, `Score ${score}/${active.quiz.length}. Try again!`)); setStep(0); setAnswers([]); return; }
    setBusy(true);
    try {
      const r = await challengesApi.learnComplete(active.id);
      setDone((d) => new Set([...d, active.id]));
      window.dispatchEvent(new CustomEvent("mikilab-entitlements-updated"));
      toast.success(L("Livello superato! Conta come una sfida 🏆", "Level passed! It counts as a challenge 🏆"));
      if (r.unlocked_panettoni) toast.success(L("Hai sbloccato i Panettoni! 🥖", "You unlocked the Panettoni! 🥖"), { duration: 6000 });
      setActive(null);
    } catch { toast.error(L("Errore, riprova.", "Error, try again.")); }
    finally { setBusy(false); }
  };

  // Vista quiz
  if (active) {
    const q = active.quiz[step];
    const last = step === active.quiz.length - 1;
    const picked = answers[step];
    return (
      <div className="pb-8" data-testid="impara-quiz">
        <button data-testid="quiz-back" onClick={() => setActive(null)} className="flex items-center gap-1 text-[#8C4A27] font-medium mb-4"><ChevronRight className="w-5 h-5 rotate-180" /> {L("Percorsi", "Paths")}</button>
        <div className="rounded-3xl p-5 text-[#FFFDF9] shadow-xl mb-4" style={{ background: "linear-gradient(135deg,#8C4A27,#6E371C 70%,#4A3222)" }}>
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#FEF3C7]">{T(active)}</p>
          <h1 className="font-display text-xl font-bold mt-1">{L("Domanda", "Question")} {step + 1}/{active.quiz.length}</h1>
        </div>
        <p className="font-display text-lg font-bold text-[#2C1E16] dark:text-[#e4eff8] mb-3">{T(q.q)}</p>
        <div className="space-y-2.5" data-testid="quiz-options">
          {q.a.map((opt, ai) => (
            <button key={ai} data-testid={`quiz-opt-${ai}`} onClick={() => answer(ai)}
              className={`w-full text-left rounded-2xl p-4 border font-medium transition-all ${picked === ai ? "bg-[#8C4A27] text-[#FFFDF9] border-transparent" : "bg-[#FAF5EC] dark:bg-[#232A31] text-[#2C1E16] dark:text-[#e4eff8] border-[#E6D8C3] dark:border-[#38424B]"}`}>
              {T(opt)}
            </button>
          ))}
        </div>
        <button data-testid="quiz-next" disabled={picked === undefined || busy} onClick={() => (last ? finish() : setStep(step + 1))}
          className="mt-5 w-full flex items-center justify-center gap-2 bg-[#D97706] hover:bg-[#B45309] disabled:opacity-40 text-[#FFFDF9] font-semibold py-3.5 rounded-2xl active:scale-98 transition-all">
          {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : last ? <><Trophy className="w-5 h-5" /> {L("Completa il livello", "Finish the level")}</> : L("Avanti", "Next")}
        </button>
      </div>
    );
  }

  const doneCount = done.size;
  return (
    <div className="pb-8" data-testid="impara-livelli">
      {onBack && <button data-testid="impara-back" onClick={onBack} className="flex items-center gap-1 text-[#8C4A27] font-medium mb-4"><ChevronRight className="w-5 h-5 rotate-180" /> {L("Indietro", "Back")}</button>}
      <div className="relative overflow-hidden rounded-3xl p-6 text-[#FFFDF9] shadow-xl mb-5" style={{ background: "linear-gradient(135deg,#8C4A27,#6E371C 60%,#4A3222)" }}>
        <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center mb-3"><GraduationCap className="w-7 h-7" /></div>
        <h1 className="font-display text-2xl font-bold">{L("Impara a Livelli", "Learn by Levels")}</h1>
        <p className="text-[#FFFDF9]/85 text-sm mt-2 leading-snug">{L("Supera il quiz di ogni livello: ogni percorso completato conta come una sfida e ti avvicina allo sblocco dei 17 Panettoni.", "Pass each level's quiz: every completed path counts as a challenge and gets you closer to unlocking the 17 Panettoni.")}</p>
        <p className="text-[12px] font-bold text-[#FEF3C7] mt-3">{doneCount}/{PATHS.length} {L("livelli superati", "levels passed")}</p>
      </div>

      <div className="space-y-3" data-testid="impara-paths">
        {PATHS.map((p, idx) => {
          const ok = done.has(p.id);
          const unlocked = isUnlocked(idx);
          return (
            <button key={p.id} data-testid={`impara-path-${p.id}`} onClick={() => openPath(p, idx)}
              className={`w-full text-left flex items-center gap-4 rounded-2xl p-4 border shadow-sm transition-all ${ok ? "bg-[#FEF3C7] border-[#D97706]" : unlocked ? "bg-[#FAF5EC] dark:bg-[#232A31] border-[#E6D8C3] dark:border-[#38424B] active:scale-98" : "bg-[#F2E8D5]/50 border-[#E6D8C3] opacity-70"}`}>
              <div className="text-3xl shrink-0">{p.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="font-display text-[16px] font-bold text-[#2C1E16] dark:text-[#e4eff8] leading-tight">{T(p)}</p>
                <p className="text-[12.5px] text-[#6B5546] dark:text-[#AEB8BF] leading-snug mt-0.5">{T(p.intro)}</p>
              </div>
              {ok ? <div className="w-9 h-9 rounded-full bg-[#D97706] text-white flex items-center justify-center shrink-0"><Check className="w-5 h-5" /></div>
                : unlocked ? <ChevronRight className="w-6 h-6 text-[#8C4A27]/70 shrink-0" />
                : <Lock className="w-5 h-5 text-[#8C7362] shrink-0" />}
            </button>
          );
        })}
      </div>

      {doneCount === PATHS.length && (
        <div data-testid="impara-diploma" className="mt-5 rounded-2xl bg-[#FEF3C7] border border-[#D97706] p-4 flex items-center gap-3">
          <Award className="w-8 h-8 text-[#8C4A27] shrink-0" />
          <p className="text-[13.5px] font-semibold text-[#6B5546]">{L("Complimenti! Hai completato tutti i percorsi Impara.", "Congratulations! You completed all the Learn paths.")}</p>
        </div>
      )}
    </div>
  );
}
