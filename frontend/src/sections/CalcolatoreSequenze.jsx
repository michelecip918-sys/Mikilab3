import { mkTri } from "@/i18n/triMaps";
import { useState, useMemo } from "react";
import { ChevronRight, SlidersHorizontal, Gauge, Clock, ListOrdered, Zap, Snail } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { getActiveMachineNames } from "@/lib/machines";

// Tipi di impasto → parametri di lavorazione (velocità, ritmo, pause, sequenza).
const DOUGH = {
  diretto: { it: "Diretto (pane comune)", de: "Direkt (Alltagsbrot)", en: "Direct (everyday bread)", es: "Directo (pan común)" },
  indiretto: { it: "Indiretto (poolish/biga)", de: "Indirekt (Poolish/Biga)", en: "Indirect (poolish/biga)", es: "Indirecto (poolish/biga)" },
  lm: { it: "Lievito Madre", de: "Sauerteig", en: "Sourdough", es: "Masa madre" },
  grande: { it: "Grande lievitato (panettone)", de: "Große Hefegebäck (Panettone)", en: "Large leavened (panettone)", es: "Gran levado (panettone)" },
  sfoglia: { it: "Sfogliato (croissant)", de: "Plunder (Croissant)", en: "Laminated (croissant)", es: "Hojaldrado (croissant)" },
};

const MIXER = {
  spirale: { it: "Spirale", de: "Spirale", en: "Spiral", es: "Espiral", speed: 1.0 },
  bracci: { it: "Bracci tuffanti", de: "Taucharme", en: "Diving arms", es: "Brazos", speed: 1.35 },
  forcella: { it: "Forcella", de: "Gabel", en: "Fork", es: "Horquilla", speed: 1.5 },
  planetaria: { it: "Planetaria", de: "Planetenrührer", en: "Planetary", es: "Planetaria", speed: 1.1 },
};

// Ritmo obiettivo: veloce (ritmi serrati) ↔ lento (controllo qualità).
const RHYTHM = {
  lento: { it: "Lento (qualità)", de: "Langsam (Qualität)", en: "Slow (quality)", es: "Lento (calidad)", k: 1.25 },
  medio: { it: "Medio", de: "Mittel", en: "Medium", es: "Medio", k: 1.0 },
  veloce: { it: "Veloce (produzione)", de: "Schnell (Produktion)", en: "Fast (production)", es: "Rápido (producción)", k: 0.75 },
};

export default function CalcolatoreSequenze({ onBack }) {
  const { lang } = useLang();
  const L = (i, d, e, s) => mkTri(lang)(i, d, e, s);
  const [dough, setDough] = useState("diretto");
  const [mixer, setMixer] = useState("spirale");
  const [rhythm, setRhythm] = useState("medio");
  const machines = getActiveMachineNames();

  const plan = useMemo(() => {
    const spd = MIXER[mixer].speed;
    const k = RHYTHM[rhythm].k;
    // velocità 1 (incorporo) e velocità 2 (incordatura) in minuti, adattate al tipo impasto
    const base = {
      diretto: { v1: 3, v2: 6, puntata: 60, appretto: 60 },
      indiretto: { v1: 4, v2: 8, puntata: 90, appretto: 75 },
      lm: { v1: 4, v2: 9, puntata: 180, appretto: 150 },
      grande: { v1: 6, v2: 14, puntata: 720, appretto: 360 },
      sfoglia: { v1: 3, v2: 5, puntata: 30, appretto: 90 },
    }[dough];
    const v1 = Math.max(1, Math.round((base.v1 / spd) * (rhythm === "veloce" ? 0.9 : 1)));
    const v2 = Math.max(2, Math.round((base.v2 / spd) * (rhythm === "veloce" ? 0.85 : 1)));
    const puntata = Math.round(base.puntata * k);
    const appretto = Math.round(base.appretto * k);
    const seq = [
      L("Prefermenti/rinfreschi (la sera prima se serve)", "Vorteige/Auffrischungen (Vorabend)", "Preferments/refresh (night before)", "Prefermentos/refrescos (noche antes)"),
      L(`Impasto — 1ª velocità ${v1}′ (incorporo)`, `Kneten — 1. Gang ${v1}′`, `Mixing — 1st speed ${v1}′ (incorporation)`, `Amasado — 1ª vel. ${v1}′`),
      L(`Impasto — 2ª velocità ${v2}′ (incordatura, velo)`, `Kneten — 2. Gang ${v2}′ (Auskneten)`, `Mixing — 2nd speed ${v2}′ (development)`, `Amasado — 2ª vel. ${v2}′`),
      L(`Puntata ${fmtMin(puntata)}${dough !== "sfoglia" ? " (pieghe ogni 30′ nella 1ª ora)" : ""}`, `Stockgare ${fmtMin(puntata)}`, `Bulk ${fmtMin(puntata)}`, `Fermentación ${fmtMin(puntata)}`),
      dough === "sfoglia"
        ? L("Sfogliatura (3 pieghe) con riposo in frigo tra le pieghe", "Tourieren (3 Touren) mit Kühlruhe", "Lamination (3 folds) with fridge rests", "Hojaldrado (3 pliegues) con reposo en frío")
        : L("Formatura", "Formen", "Shaping", "Formado"),
      L(`Appretto ${fmtMin(appretto)}`, `Stückgare ${fmtMin(appretto)}`, `Final proof ${fmtMin(appretto)}`, `Fermentación final ${fmtMin(appretto)}`),
      L("Cottura", "Backen", "Baking", "Horneado"),
    ];
    const pauses = [
      { label: L("Riposo tra 1ª e 2ª velocità", "Ruhe zwischen den Gängen", "Rest between speeds", "Reposo entre velocidades"), v: L("2–3′ (autolisi in vasca)", "2–3′", "2–3′ (autolyse)", "2–3′") },
      { label: L("Pieghe di rinforzo", "Dehnen & Falten", "Stretch & folds", "Pliegues"), v: dough === "sfoglia" ? "—" : L("ogni 30′ nella 1ª ora", "alle 30′", "every 30′", "cada 30′") },
    ];
    return { v1, v2, puntata, appretto, seq, pauses, speedLabel: rhythm };
  }, [dough, mixer, rhythm, lang]);

  const card = "rounded-2xl bg-white dark:bg-[#18202E] border border-[#26324A] dark:border-[#26324A] p-4";
  const inp = "w-full bg-white dark:bg-[#18202E] border border-[#26324A] dark:border-[#26324A] rounded-2xl shadow-md border border-amber-900/40 px-3 py-2.5 outline-none text-[#F26419] dark:text-[#e4eff8] focus:border-[#F26419] text-sm";
  const lbl = "text-[12px] font-semibold text-[#F26419] dark:text-[#AEB8BF] mb-1";

  return (
    <div className="pb-8" data-testid="calc-sequenze">
      {onBack && <button data-testid="seq-back" onClick={onBack} className="flex items-center gap-1 text-[#F26419] font-medium mb-4">
        <ChevronRight className="w-5 h-5 rotate-180" /> {L("Indietro", "Zurück", "Back", "Atrás")}
      </button>}

      <div className="relative overflow-hidden rounded-3xl p-6 text-[#0B0E14] shadow-xl mb-5"
        style={{ background: "linear-gradient(135deg,#F26419 0%,#F26419 60%,#F26419 100%)" }}>
        <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center mb-3"><SlidersHorizontal className="w-7 h-7" /></div>
        <h1 className="font-display text-2xl font-bold">{L("Calcolatore Metodo & Sequenze IA", "Methode & Abläufe (KI)", "Method & Sequences (AI)", "Método y Secuencias (IA)")}</h1>
        <p className="text-[#0B0E14]/85 text-sm mt-2 leading-snug">{L("Calcola velocità d'impasto, ritmi (veloce/lento), pause e la sequenza delle lavorazioni in base al tipo d'impasto e all'impastatrice.", "Berechnet Knetgeschwindigkeiten, Rhythmen, Pausen und Arbeitsabfolge je nach Teig und Kneter.", "Computes mixing speeds, rhythms, pauses and the work sequence based on dough type and mixer.", "Calcula velocidades de amasado, ritmos, pausas y la secuencia de trabajo.")}</p>
      </div>

      <div className="grid grid-cols-1 gap-3 mb-4">
        <div><p className={lbl}>{L("Tipo di impasto", "Teigart", "Dough type", "Tipo de masa")}</p>
          <select data-testid="seq-dough" value={dough} onChange={(e) => setDough(e.target.value)} className={inp}>
            {Object.entries(DOUGH).map(([k, v]) => <option key={k} value={k}>{v[lang] || v.it}</option>)}
          </select></div>
        <div className="grid grid-cols-2 gap-3">
          <div><p className={lbl}><Gauge className="w-3.5 h-3.5 inline mr-1" />{L("Impastatrice", "Kneter", "Mixer", "Amasadora")}</p>
            <select data-testid="seq-mixer" value={mixer} onChange={(e) => setMixer(e.target.value)} className={inp}>
              {Object.entries(MIXER).map(([k, v]) => <option key={k} value={k}>{v[lang] || v.it}</option>)}
            </select></div>
          <div><p className={lbl}>{L("Ritmo", "Rhythmus", "Rhythm", "Ritmo")}</p>
            <select data-testid="seq-rhythm" value={rhythm} onChange={(e) => setRhythm(e.target.value)} className={inp}>
              {Object.entries(RHYTHM).map(([k, v]) => <option key={k} value={k}>{v[lang] || v.it}</option>)}
            </select></div>
        </div>
      </div>

      {machines.length > 0 && (
        <div data-testid="seq-machines" className="mb-4 rounded-2xl shadow-md border border-amber-900/40 bg-[#F26419]/12 border border-[#F26419]/40 p-3 text-[12px] text-[#F26419] dark:text-[#F26419]">
          🛠️ {L("Parco Macchine attivo", "Maschinenpark aktiv", "Machine Park active", "Maquinaria activa")}: {machines.join(", ")}. {L("Con spezzatrici/linee automatiche i ritmi si accorciano.", "Mit Teilern/Automatiklinien verkürzen sich die Rhythmen.", "With dividers/automatic lines the rhythm shortens.", "Con divisoras/líneas los ritmos se acortan.")}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className={`${card} text-center`}><p className="text-[11px] font-semibold text-[#F26419] flex items-center justify-center gap-1"><Zap className="w-3.5 h-3.5" />{L("1ª velocità", "1. Gang", "1st speed", "1ª vel.")}</p><p data-testid="seq-v1" className="font-display text-2xl font-bold text-[#F26419] mt-1">{plan.v1}′</p></div>
        <div className={`${card} text-center`}><p className="text-[11px] font-semibold text-[#F26419] flex items-center justify-center gap-1"><Zap className="w-3.5 h-3.5" />{L("2ª velocità", "2. Gang", "2nd speed", "2ª vel.")}</p><p data-testid="seq-v2" className="font-display text-2xl font-bold text-[#F26419] mt-1">{plan.v2}′</p></div>
        <div className={`${card} text-center`}><p className="text-[11px] font-semibold text-[#F26419] flex items-center justify-center gap-1"><Snail className="w-3.5 h-3.5" />{L("Puntata", "Stockgare", "Bulk", "Fermentación")}</p><p className="font-display text-lg font-bold text-[#F26419] mt-1">{fmtMin(plan.puntata)}</p></div>
        <div className={`${card} text-center`}><p className="text-[11px] font-semibold text-[#F26419] flex items-center justify-center gap-1"><Clock className="w-3.5 h-3.5" />{L("Appretto", "Stückgare", "Final proof", "Fermentación final")}</p><p className="font-display text-lg font-bold text-[#F26419] mt-1">{fmtMin(plan.appretto)}</p></div>
      </div>

      <div data-testid="seq-sequence" className={card}>
        <p className="font-display text-base font-bold text-[#F26419] flex items-center gap-2 mb-3"><ListOrdered className="w-4.5 h-4.5" />{L("Sequenza delle lavorazioni", "Arbeitsabfolge", "Work sequence", "Secuencia de trabajo")}</p>
        <ol className="space-y-2">
          {plan.seq.map((s, i) => (
            <li key={i} data-testid={`seq-step-${i}`} className="flex items-start gap-2.5 text-sm text-[#3F4A54] dark:text-[#AEB8BF]">
              <span className="shrink-0 w-6 h-6 rounded-full bg-[#F26419] text-white font-bold text-[12px] flex items-center justify-center">{i + 1}</span>
              <span className="leading-snug pt-0.5">{s}</span>
            </li>
          ))}
        </ol>
        <div className="mt-4 pt-3 border-t border-[#26324A] dark:border-[#26324A] space-y-1.5">
          {plan.pauses.map((p, i) => (
            <div key={i} className="flex items-center justify-between text-[13px]">
              <span className="text-[#F26419] dark:text-[#AEB8BF]">{p.label}</span>
              <span className="font-mono-data font-bold text-[#F26419]">{p.v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function fmtMin(m) {
  if (m < 60) return `${m}′`;
  const h = Math.floor(m / 60), r = m % 60;
  return r ? `${h}h ${r}′` : `${h}h`;
}
