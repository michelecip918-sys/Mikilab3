import { useState, useEffect } from "react";
import { GraduationCap, Calculator, Wheat, Camera, Trophy, ClipboardList, CheckCircle2, ChevronRight, Printer, Volume2 } from "lucide-react";
import { motion } from "framer-motion";
import { useLang } from "@/i18n/LanguageContext";
import { FLOURS, CALC_RECIPES } from "@/data/academy";
import Beginners from "@/sections/Beginners";
import { mkTri } from "@/i18n/triMaps";
import { playTTS, stopTTS } from "@/lib/tts";
import SpeakingAvatar from "@/components/SpeakingAvatar";

// Accademia = percorso guidato in 3 passi: Lezioni → Quiz → Esercizi.
// Farine e Diagnosi restano come strumenti extra. Tutti i tool esistenti sono preservati.
const PATH_IDS = ["lezioni", "quiz", "esercizi"];

export default function AcademyHome({ onNavigate }) {
  const { lang } = useLang();
  const tri = (i, d, e, s) => mkTri(lang)(i, d, e, s);
  const [sub, setSub] = useState("lezioni");
  const [momiSpeaking, setMomiSpeaking] = useState(false);
  const [pathDone, setPathDone] = useState(() => { try { return JSON.parse(localStorage.getItem("mikilab_impara_path") || "[]"); } catch { return []; } });

  // Segna il passo come completato + porta a quiz quando serve.
  useEffect(() => {
    if (PATH_IDS.includes(sub) && !pathDone.includes(sub)) {
      const nx = [...pathDone, sub];
      setPathDone(nx);
      localStorage.setItem("mikilab_impara_path", JSON.stringify(nx));
    }
    if (sub === "quiz") {
      const id = setTimeout(() => {
        document.querySelector('[data-testid="evolving-quiz"],[data-testid="quiz-panel"],[data-testid="quiz-start-btn"]')
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 350);
      return () => clearTimeout(id);
    }
    // eslint-disable-next-line
  }, [sub]);

  const doneCount = PATH_IDS.filter((x) => pathDone.includes(x)).length;

  const STEPS = [
    { id: "lezioni", n: "1", Icon: GraduationCap, label: tri("Lezioni", "Lektionen", "Lessons", "Lecciones"), desc: tri("Video e basi passo passo", "Videos & Grundlagen Schritt für Schritt", "Videos & basics step by step", "Vídeos y bases paso a paso") },
    { id: "quiz", n: "2", Icon: Trophy, label: tri("Quiz", "Quiz", "Quiz", "Quiz"), desc: tri("Metti alla prova quello che sai", "Teste dein Wissen", "Test what you know", "Pon a prueba lo que sabes") },
    { id: "esercizi", n: "3", Icon: ClipboardList, label: tri("Esercizi", "Übungen", "Exercises", "Ejercicios"), desc: tri("Calcola le dosi e prova sul campo", "Mengen berechnen und üben", "Calculate doses and practise", "Calcula las dosis y practica") },
  ];
  const EXTRA = [
    { id: "farine", Icon: Wheat, label: tri("Farine", "Mehle", "Flours", "Harinas") },
    { id: "diagnosi", Icon: Camera, label: tri("Diagnosi", "Diagnose", "Diagnosis", "Diagnóstico") },
  ];

  return (
    <div className="pb-4" data-testid="academy-home">
      {/* Hero */}
      <div className="relative rounded-3xl overflow-hidden mb-5 bg-gradient-to-br from-[#F26419] to-[#3a2415] p-6 text-white">
        <div className="it-de-ribbon absolute top-0 left-0 right-0" />
        <span className="inline-block mb-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/15 border border-white/25">{tri("Impara gratis", "Kostenlos lernen", "Learn free", "Aprende gratis")}</span>
        <h1 className="font-display text-3xl font-extrabold">{tri("Accademia", "Akademie", "Academy", "Academia")}</h1>
        <div className="h-1 w-12 rounded-full bg-[#F26419] mt-2" />
        <p className="text-white/85 text-sm mt-2 max-w-md leading-snug">{tri("Impara la panificazione da zero in 3 passi: lezioni, quiz ed esercizi pratici.", "Lerne das Backen von Grund auf in 3 Schritten: Lektionen, Quiz und praktische Übungen.", "Learn baking from scratch in 3 steps: lessons, quizzes and practical exercises.", "Aprende panificación desde cero en 3 pasos: lecciones, cuestionarios y ejercicios prácticos.")}</p>
        {/* Avatar 3D pop-out di Momi (arancio mentre parla) */}
        <div className="absolute top-4 right-4 z-10">
          <SpeakingAvatar who="momi" active={momiSpeaking} mode="speaking" size={56} testid="momi-avatar" />
        </div>
        <button data-testid="momi-listen" onClick={() => {
          if (momiSpeaking) { stopTTS(); setMomiSpeaking(false); return; }
          const txt = tri("Ciao, sono Momi, il tuo tutor. Impara la panificazione da zero in tre passi: lezioni, quiz ed esercizi pratici. Iniziamo dalle lezioni!", "Hallo, ich bin Momi, dein Tutor. Lerne das Backen in drei Schritten.", "Hi, I'm Momi, your tutor. Learn baking from scratch in three steps.", "Hola, soy Momi, tu tutor. Aprende panificación en tres pasos.", "Salut, je suis Momi, ton tuteur. Apprends la boulangerie en trois étapes.", "سلام، من مومی هستم، مربی تو. نان‌پزی را در سه گام یاد بگیر.");
          playTTS(txt, { lang, voice: "momy", onStart: () => setMomiSpeaking(true), onEnded: () => setMomiSpeaking(false) });
        }} className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/15 hover:bg-white/25 border border-white/30 px-4 py-2 text-sm font-bold active:scale-95 transition-all">
          <Volume2 className="w-4 h-4" /> {momiSpeaking ? tri("Momi sta parlando…", "Momi spricht…", "Momi is speaking…", "Momi está hablando…", "Momi parle…", "مومی صحبت می‌کند…") : tri("Ascolta con Momi", "Mit Momi anhören", "Listen with Momi", "Escuchar con Momi", "Écouter avec Momi", "با مومی گوش کن")}
        </button>
      </div>

      {/* Percorso guidato in 3 passi */}
      <div data-testid="academy-path" className="mb-5">
        <div className="flex items-center justify-between mb-2 px-1">
          <p className="text-xs font-bold uppercase tracking-wide text-[#7E8A93]">{tri("Il tuo percorso", "Dein Lernpfad", "Your path", "Tu ruta")}</p>
          <span data-testid="academy-path-progress" className="text-xs font-bold text-[#F26419]">{doneCount}/3 {tri("completati", "erledigt", "done", "completados")}</span>
        </div>
        <div className="space-y-2.5">
          {STEPS.map(({ id, n, Icon, label, desc }, i) => {
            const done = pathDone.includes(id);
            const on = sub === id;
            return (
              <motion.button key={id} data-testid={`academy-path-${id}`} onClick={() => setSub(id)}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.06 }}
                className={`group w-full flex items-center gap-3.5 min-h-[68px] rounded-2xl px-4 text-start active:scale-98 transition-all border ${on ? "bg-[#F26419]/12 border-[#F26419]" : done ? "bg-[#F26419]/8 border-[#F26419]/45" : "bg-[#18202E] border-[#26324A] hover:border-[#F26419]/60"}`}>
                <span className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 font-bold ${done ? "bg-[#F26419] text-white" : "bg-[#F26419]/15 border border-[#F26419]/40 text-[#F26419]"}`}>
                  {done ? <CheckCircle2 className="w-6 h-6" data-testid={`academy-path-done-${id}`} /> : <Icon className="w-6 h-6" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-[#7E8A93]">{tri("Passo", "Schritt", "Step", "Paso")} {n}</span>
                  </span>
                  <span className="block font-display text-[16px] font-extrabold leading-tight text-[#e4eff8]">{label}</span>
                  <span className="block text-[12px] text-[#AEB8BF] leading-snug">{desc}</span>
                </span>
                <ChevronRight className="w-5 h-5 text-[#F26419] shrink-0 rtl:rotate-180" />
              </motion.button>
            );
          })}
        </div>
        {doneCount === 3 && (
          <div data-testid="academy-path-complete" className="mt-3 rounded-2xl bg-[#F26419] text-white p-4 text-center shadow-lg">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-2"><CheckCircle2 className="w-7 h-7" /></div>
            <p className="font-display text-lg font-bold">🎉 {tri("Percorso completato!", "Pfad abgeschlossen!", "Path complete!", "¡Ruta completada!")}</p>
            <p className="text-sm text-white/85 mt-0.5">{tri("Hai sbloccato il badge «Fornaio Diplomato». Sei pronto per il Laboratorio!", "Du hast das Abzeichen «Diplom-Bäcker» freigeschaltet. Bereit fürs Labor!", "You unlocked the «Certified Baker» badge. Ready for the Lab!", "Has desbloqueado la insignia «Panadero Diplomado». ¡Listo para el Laboratorio!")}</p>
            <span className="inline-block mt-2 text-[11px] font-bold bg-white/20 px-3 py-1 rounded-full uppercase tracking-wide">🏅 {tri("Fornaio Diplomato", "Diplom-Bäcker", "Certified Baker", "Panadero Diplomado")}</span>
          </div>
        )}
      </div>

      {/* Strumenti extra */}
      <div className="mb-5">
        <p className="text-[10px] font-bold uppercase tracking-wide text-[#7E8A93] mb-2 px-1">{tri("Strumenti extra", "Extra-Werkzeuge", "Extra tools", "Herramientas extra")}</p>
        <div className="grid grid-cols-2 gap-2.5">
          {EXTRA.map(({ id, Icon, label }) => {
            const on = sub === id;
            return (
              <button key={id} data-testid={`academy-tab-${id}`} onClick={() => setSub(id)}
                className={`flex items-center gap-2.5 min-h-[54px] rounded-2xl px-4 border active:scale-97 transition-all text-start ${on ? "bg-[#F26419]/12 border-[#F26419]" : "bg-[#18202E] border-[#26324A] hover:border-[#F26419]/60"}`}>
                <span className="w-9 h-9 rounded-2xl shadow-md border border-amber-900/40 bg-[#F26419]/15 border border-[#F26419]/30 flex items-center justify-center shrink-0"><Icon className="w-5 h-5 text-[#F26419]" /></span>
                <span className="font-display text-sm font-bold text-[#e4eff8]">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Contenuto */}
      {(sub === "lezioni" || sub === "quiz") && <Beginners />}
      {sub === "esercizi" && <DynamicRecipes />}
      {sub === "farine" && <FlourDB />}
      {sub === "diagnosi" && (
        <div className="space-y-4" data-testid="academy-diagnosi">
          <div className="rounded-2xl bg-white dark:bg-[#18202E] border border-[#26324A] dark:border-[#26324A] p-5 text-center">
            <div className="w-14 h-14 rounded-full bg-[#F26419]/15 flex items-center justify-center mx-auto mb-3">
              <Camera className="w-7 h-7 text-[#F26419]" />
            </div>
            <p className="font-display text-lg font-bold text-[#2B303B] dark:text-[#e4eff8]">{tri("Diagnosi Foto IA", "Foto-Diagnose KI", "AI Photo Diagnosis", "Diagnóstico Foto IA")}</p>
            <p className="text-sm text-[#7E8A93] mt-1 max-w-sm mx-auto">{tri("Scatta o carica una foto dell'impasto o della crosta: l'IA ti dice cosa correggere.", "Mach oder lade ein Foto von Teig oder Kruste hoch: die KI sagt dir, was du korrigieren sollst.", "Take or upload a photo of the dough or crust: the AI tells you what to fix.", "Haz o sube una foto de la masa o la corteza: la IA te dice qué corregir.")}</p>
            <button data-testid="academy-open-diagnosi" onClick={() => onNavigate && onNavigate("diagnosi")}
              className="mt-4 inline-flex items-center gap-2 bg-[#F26419] hover:bg-[#E8A838] text-white font-semibold px-5 py-3 rounded-2xl active:scale-98 transition-all">
              <Camera className="w-5 h-5" /> {tri("Apri Diagnosi Foto", "Foto-Diagnose öffnen", "Open Photo Diagnosis", "Abrir Diagnóstico")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Ricettario dinamico: calcolo dosi da teglia + farina --------------------
function DynamicRecipes() {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const L = (o) => (o ? o[lang] || o.en || o.it : "");
  const [recipe, setRecipe] = useState(CALC_RECIPES[0].id);
  const [width, setWidth] = useState("30");
  const [length, setLength] = useState("40");
  const [flour, setFlour] = useState("00");

  const r = CALC_RECIPES.find((x) => x.id === recipe) || CALC_RECIPES[0];
  const area = (Number(width) || 0) * (Number(length) || 0);
  const flourG = Math.round(area * r.flourPerCm2);
  const g = (pct) => Math.round(flourG * pct / 100);

  // Scheda ricetta scaricabile/stampabile TRILINGUE (IT · DE · EN) → salva come PDF.
  const downloadPdf = () => {
    const L3 = (o) => ({ it: o.it, de: o.de || o.it, en: o.en || o.it });
    const nm = L3(r.name), ht = L3(r.hint);
    const LBL = {
      it: { flour: "Farina", water: "Acqua", salt: "Sale", oil: "Olio EVO", yeast: "Lievito di birra", tin: "Teglia" },
      de: { flour: "Mehl", water: "Wasser", salt: "Salz", oil: "Olivenöl", yeast: "Frischhefe", tin: "Blech" },
      en: { flour: "Flour", water: "Water", salt: "Salt", oil: "Olive oil", yeast: "Fresh yeast", tin: "Tin" },
    };
    const rows = (lng) => {
      const b = LBL[lng];
      const line = (k, v) => `<tr><td>${k}</td><td style="text-align:right;font-family:monospace">${v} g</td></tr>`;
      let out = line(`<b>${b.flour}</b>`, `<b>${flourG}</b>`) + line(b.water, g(r.bp.water)) + line(b.salt, g(r.bp.salt));
      if (r.bp.oil > 0) out += line(b.oil, g(r.bp.oil));
      out += line(b.yeast, g(r.bp.yeast));
      return out;
    };
    const block = (lng) => `
      <div class="card">
        <h2>${nm[lng]} · ${flour}</h2>
        <p class="sub">${LBL[lng].tin} ${width}×${length} cm</p>
        <table>${rows(lng)}</table>
        <p class="hint">💡 ${ht[lng]}</p>
      </div>`;
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>MikiLab · ${nm.it}</title>
      <style>
        body{font-family:Georgia,serif;color:#2B303B;margin:24px;background:#fff}
        .head{text-align:center;border-bottom:3px solid #F26419;padding-bottom:10px;margin-bottom:18px}
        .head h1{margin:0;color:#F26419}
        .head p{margin:2px 0 0;color:#7E8A93;font-size:13px}
        .card{border:1px solid #26324A;border-radius:12px;padding:14px 18px;margin-bottom:14px;page-break-inside:avoid}
        .card h2{margin:0 0 2px;font-size:18px}
        .sub{margin:0 0 8px;color:#7E8A93;font-size:12px}
        table{width:100%;border-collapse:collapse}
        td{padding:4px 0;border-bottom:1px solid #e4eff8;font-size:15px}
        .hint{margin:10px 0 0;color:#F26419;font-size:13px}
        .flag{font-size:12px;font-weight:bold;color:#F26419;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px}
        .foot{text-align:center;color:#7E8A93;font-size:11px;margin-top:16px}
      </style></head><body>
      <div class="head"><h1>MikiLab · Michele</h1><p>${nm.it} — ${LBL.it.tin} ${width}×${length} cm · ${flour}</p></div>
      <p class="flag">🇮🇹 Italiano</p>${block("it")}
      <p class="flag">🇩🇪 Deutsch</p>${block("de")}
      <p class="flag">🇬🇧 English</p>${block("en")}
      <p class="foot">MikiLab · mikilab.de</p>
      <script>window.onload=function(){setTimeout(function(){window.print();},300);};<\/script>
      </body></html>`;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html);
    w.document.close();
  };

  return (
    <div className="space-y-4" data-testid="dynamic-recipes">
      <div className="rounded-2xl bg-white dark:bg-[#18202E] border border-[#26324A] dark:border-[#26324A] p-4 space-y-3">
        <p className="font-display font-bold text-[#2B303B] dark:text-[#e4eff8]">{tri("Calcola le dosi", "Mengen berechnen", "Calculate the doses")}</p>
        <div className="grid grid-cols-1 gap-3">
          <label className="text-sm">
            <span className="block text-xs font-semibold text-[#7E8A93] mb-1">{tri("Ricetta", "Rezept", "Recipe")}</span>
            <select data-testid="calc-recipe" value={recipe} onChange={(e) => setRecipe(e.target.value)}
              className="w-full rounded-2xl shadow-md border border-amber-900/40 border border-[#26324A] dark:border-[#26324A] bg-white dark:bg-[#0B0E14] px-3 py-2.5">
              {CALC_RECIPES.map((c) => <option key={c.id} value={c.id}>{L(c.name)}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">
              <span className="block text-xs font-semibold text-[#7E8A93] mb-1">{tri("Larghezza teglia (cm)", "Blechbreite (cm)", "Tin width (cm)")}</span>
              <input data-testid="calc-width" type="number" value={width} onChange={(e) => setWidth(e.target.value)}
                className="w-full rounded-2xl shadow-md border border-amber-900/40 border border-[#26324A] dark:border-[#26324A] bg-white dark:bg-[#0B0E14] px-3 py-2.5" />
            </label>
            <label className="text-sm">
              <span className="block text-xs font-semibold text-[#7E8A93] mb-1">{tri("Lunghezza teglia (cm)", "Blechlänge (cm)", "Tin length (cm)")}</span>
              <input data-testid="calc-length" type="number" value={length} onChange={(e) => setLength(e.target.value)}
                className="w-full rounded-2xl shadow-md border border-amber-900/40 border border-[#26324A] dark:border-[#26324A] bg-white dark:bg-[#0B0E14] px-3 py-2.5" />
            </label>
          </div>
          <label className="text-sm">
            <span className="block text-xs font-semibold text-[#7E8A93] mb-1">{tri("Farina", "Mehl", "Flour")}</span>
            <select data-testid="calc-flour" value={flour} onChange={(e) => setFlour(e.target.value)}
              className="w-full rounded-2xl shadow-md border border-amber-900/40 border border-[#26324A] dark:border-[#26324A] bg-white dark:bg-[#0B0E14] px-3 py-2.5">
              {FLOURS.map((f) => <option key={f.name} value={f.name}>{f.name} · {f.type_de}</option>)}
            </select>
          </label>
        </div>
      </div>

      {/* Risultato */}
      <div className="print-area rounded-2xl bg-gradient-to-br from-[#F26419]/10 to-[#F26419]/5 border border-[#F26419]/30 p-5" data-testid="calc-result">
        <p className="font-display text-lg font-bold text-[#2B303B] dark:text-[#e4eff8]">{L(r.name)} · {flour}</p>
        <p className="text-xs text-[#7E8A93] mb-3">{tri("Teglia", "Blech", "Tin")} {width}×{length} cm</p>
        <div className="space-y-1.5 font-mono-data text-sm">
          <Row label={tri("Farina", "Mehl", "Flour")} val={`${flourG} g`} bold />
          <Row label={tri("Acqua", "Wasser", "Water")} val={`${g(r.bp.water)} g`} />
          <Row label={tri("Sale", "Salz", "Salt")} val={`${g(r.bp.salt)} g`} />
          {r.bp.oil > 0 && <Row label={tri("Olio EVO", "Olivenöl", "Olive oil")} val={`${g(r.bp.oil)} g`} />}
          <Row label={tri("Lievito di birra", "Frischhefe", "Fresh yeast")} val={`${g(r.bp.yeast)} g`} />
        </div>
        <p className="text-sm text-[#F26419] dark:text-[#a9d2ec] mt-3">💡 {L(r.hint)}</p>
      </div>

      <button data-testid="calc-print" onClick={downloadPdf}
        className="w-full flex items-center justify-center gap-2 bg-[#F26419] hover:bg-[#E8A838] text-white font-semibold px-4 py-3 rounded-2xl active:scale-98 transition-all">
        <Printer className="w-5 h-5" /> {tri("Scarica scheda PDF (IT · DE · EN)", "PDF-Karte herunterladen (IT · DE · EN)", "Download recipe card PDF (IT · DE · EN)")}
      </button>
    </div>
  );
}

function Row({ label, val, bold }) {
  return (
    <div className={`flex items-center justify-between ${bold ? "font-bold" : ""}`}>
      <span className="text-[#3F4A54] dark:text-[#AEB8BF]">{label}</span>
      <span className="text-[#F26419] dark:text-[#8FB0C2]">{val}</span>
    </div>
  );
}

// --- Database farine ---------------------------------------------------------
function FlourDB() {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const [q, setQ] = useState("");
  const rows = FLOURS.filter((f) => `${f.name} ${f.type_de}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-3" data-testid="flour-db">
      <input data-testid="flour-search" value={q} onChange={(e) => setQ(e.target.value)}
        placeholder={tri("Cerca farina (es. 00, Dinkel, Manitoba)", "Mehl suchen (z.B. 00, Dinkel, Manitoba)", "Search flour (e.g. 00, Dinkel, Manitoba)")}
        className="w-full rounded-2xl shadow-md border border-amber-900/40 border border-[#26324A] dark:border-[#26324A] bg-white dark:bg-[#0B0E14] px-3 py-2.5 text-sm" />
      <div className="rounded-2xl overflow-hidden border border-[#26324A] dark:border-[#26324A]">
        <div className="grid grid-cols-[1fr_1fr_auto] gap-2 bg-[#e4eff8] dark:bg-[#18202E] px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-[#7E8A93]">
          <span>IT</span><span>DE (Type)</span><span>W</span>
        </div>
        {rows.map((f, i) => (
          <div key={f.name} data-testid={`flour-row-${i}`} className="grid grid-cols-[1fr_1fr_auto] gap-2 px-3 py-2.5 text-sm border-t border-[#26324A] dark:border-[#26324A] bg-white dark:bg-[#18202E]">
            <div>
              <p className="font-semibold text-[#2B303B] dark:text-[#e4eff8]">{f.name}</p>
              <p className="text-xs text-[#7E8A93]">{f.use[lang] || f.use.it}</p>
            </div>
            <span className="text-[#3F4A54] dark:text-[#AEB8BF] self-center">{f.type_de}</span>
            <span className="font-mono-data text-[#F26419] dark:text-[#8FB0C2] self-center">{f.w}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
