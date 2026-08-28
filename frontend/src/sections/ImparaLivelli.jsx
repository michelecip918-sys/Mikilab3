import { useState, useEffect, useCallback } from "react";
import { ChevronRight, GraduationCap, Lock, Check, Trophy, Loader2, Award } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { useAuth } from "@/auth/AuthContext";
import { challengesApi } from "@/lib/api";
import { jsPDF } from "jspdf";
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
  { id: "focacce", it: "Livello 4 · Focacce", en: "Level 4 · Focaccia", icon: "🫓",
    intro: { it: "Alta idratazione, olio e teglia: focaccia barese e materana alla semola.", en: "High hydration, oil and pan: Bari and Matera semolina focaccia." },
    quiz: [
      { q: { it: "Cosa rende soffice a lungo la focaccia barese?", en: "What keeps Bari focaccia soft for long?" }, a: [{ it: "La patata nell'impasto", en: "The potato in the dough" }, { it: "Poco olio", en: "Little oil" }, { it: "Farina debole", en: "Weak flour" }], c: 0 },
      { q: { it: "La focaccia materana usa soprattutto…", en: "Matera focaccia mainly uses…" }, a: [{ it: "Semola rimacinata di grano duro", en: "Durum semolina rimacinata" }, { it: "Farina di riso", en: "Rice flour" }, { it: "Farina di mais", en: "Corn flour" }], c: 0 },
      { q: { it: "Per una bella crosta sotto serve…", en: "For a good bottom crust you need…" }, a: [{ it: "Teglia unta e ben calda dal basso", en: "Oiled pan, hot from below" }, { it: "Teglia fredda", en: "A cold pan" }, { it: "Niente olio", en: "No oil" }], c: 0 },
    ] },
  { id: "pizza", it: "Livello 5 · Pizza", en: "Level 5 · Pizza", icon: "🍕",
    intro: { it: "Impasti diretti e indiretti, maturazione e cottura ad alta temperatura.", en: "Direct and indirect doughs, maturation and high-temperature baking." },
    quiz: [
      { q: { it: "La lunga maturazione in frigo serve a…", en: "Long cold maturation is used to…" }, a: [{ it: "Migliorare digeribilità e aroma", en: "Improve digestibility and aroma" }, { it: "Far lievitare più in fretta", en: "Rise faster" }, { it: "Aggiungere sale", en: "Add salt" }], c: 0 },
      { q: { it: "Per la pizza napoletana serve un forno…", en: "Neapolitan pizza needs an oven…" }, a: [{ it: "Molto caldo (400°C+)", en: "Very hot (400°C+)" }, { it: "A 150°C", en: "At 150°C" }, { it: "Spento", en: "Turned off" }], c: 0 },
      { q: { it: "Per una pizza in teglia leggera serve…", en: "For a light pan pizza you need…" }, a: [{ it: "Alta idratazione", en: "High hydration" }, { it: "Impasto asciutto", en: "A dry dough" }, { it: "Nessuna lievitazione", en: "No proofing" }], c: 0 },
    ] },
  { id: "pasta", it: "Livello 6 · Pasta Fresca", en: "Level 6 · Fresh Pasta", icon: "🍝",
    intro: { it: "Semola e acqua o uovo: orecchiette, cavatelli e fettuccelle della tradizione.", en: "Semolina and water or egg: traditional orecchiette, cavatelli and fettuccelle." },
    quiz: [
      { q: { it: "Le orecchiette pugliesi si fanno con…", en: "Puglia orecchiette are made with…" }, a: [{ it: "Semola rimacinata e acqua", en: "Semolina and water" }, { it: "Farina 00 e burro", en: "00 flour and butter" }, { it: "Solo uova", en: "Only eggs" }], c: 0 },
      { q: { it: "Il condimento classico delle orecchiette è…", en: "The classic orecchiette sauce is…" }, a: [{ it: "Cime di rapa", en: "Turnip tops (cime di rapa)" }, { it: "Pesto genovese", en: "Genovese pesto" }, { it: "Carbonara", en: "Carbonara" }], c: 0 },
      { q: { it: "La sfoglia all'uovo va fatta riposare…", en: "Egg pasta dough should rest…" }, a: [{ it: "~30 min sotto un panno", en: "~30 min under a cloth" }, { it: "In freezer 2 ore", en: "In the freezer 2 hours" }, { it: "Non serve riposo", en: "No rest needed" }], c: 0 },
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

  const downloadDiploma = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const W = 297, H = 210;
    doc.setFillColor(253, 251, 247); doc.rect(0, 0, W, H, "F");
    doc.setDrawColor(140, 74, 39); doc.setLineWidth(3); doc.rect(10, 10, W - 20, H - 20);
    doc.setDrawColor(217, 119, 6); doc.setLineWidth(0.8); doc.rect(14, 14, W - 28, H - 28);
    doc.setTextColor(140, 74, 39); doc.setFont("times", "bold"); doc.setFontSize(40);
    doc.text("MikiLab", W / 2, 44, { align: "center" });
    doc.setFontSize(22); doc.setTextColor(107, 85, 70);
    doc.text(L("Diploma dell'Arte Bianca", "Diploma of the Baking Craft"), W / 2, 60, { align: "center" });
    doc.setFont("times", "italic"); doc.setFontSize(14); doc.setTextColor(60, 40, 30);
    doc.text(L("Si attesta che", "This certifies that"), W / 2, 86, { align: "center" });
    doc.setFont("times", "bold"); doc.setFontSize(28); doc.setTextColor(140, 74, 39);
    doc.text(user?.name || user?.email || "Baker", W / 2, 102, { align: "center" });
    doc.setFont("times", "normal"); doc.setFontSize(14); doc.setTextColor(60, 40, 30);
    doc.text(L(`ha completato tutti i ${PATHS.length} percorsi Impara di MikiLab`, `has completed all ${PATHS.length} MikiLab Learn paths`), W / 2, 118, { align: "center", maxWidth: W - 60 });
    doc.setFontSize(12); doc.setTextColor(107, 85, 70);
    doc.text(PATHS.map((p) => T(p)).join("  ·  "), W / 2, 132, { align: "center", maxWidth: W - 50 });
    doc.setFont("times", "bold"); doc.setFontSize(16); doc.setTextColor(140, 74, 39);
    doc.text("🎓 " + L("Diplomato MikiLab", "MikiLab Graduate"), W / 2, 150, { align: "center" });
    doc.setFont("times", "normal"); doc.setFontSize(11); doc.setTextColor(140, 115, 98);
    doc.text(new Date().toLocaleDateString(lang === "it" ? "it" : "en-GB"), W / 2, 166, { align: "center" });
    doc.text("mikilab.de", W / 2, 173, { align: "center" });
    doc.save("MikiLab-Diploma.pdf");
    toast.success(L("Diploma scaricato! 🎓", "Diploma downloaded! 🎓"));
  };

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
        <div data-testid="impara-diploma" className="mt-5 rounded-2xl bg-[#FEF3C7] border border-[#D97706] p-4">
          <div className="flex items-center gap-3 mb-3">
            <Award className="w-8 h-8 text-[#8C4A27] shrink-0" />
            <p className="text-[13.5px] font-semibold text-[#6B5546]">{L("Complimenti! Hai completato tutti i percorsi Impara.", "Congratulations! You completed all the Learn paths.")}</p>
          </div>
          <button data-testid="impara-diploma-pdf" onClick={downloadDiploma}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#D97706] hover:bg-[#B45309] text-[#FFFDF9] font-semibold px-4 py-3 active:scale-98 transition-all">
            <Award className="w-5 h-5" /> {L("Scarica il Diploma MikiLab (PDF)", "Download the MikiLab Diploma (PDF)")}
          </button>
        </div>
      )}
    </div>
  );
}
