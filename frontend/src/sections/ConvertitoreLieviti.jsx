import { mkTri } from "@/i18n/triMaps";
import { useState, useMemo } from "react";
import { ChevronRight, RefreshCw, Wheat, Droplets, Beaker } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";

const HYD = { lm: 0.5, licoli: 1.0, biga: 0.45, poolish: 1.0 };
const PNAME = { lm: "Lievito Madre solido (50%)", licoli: "Li.Co.Li. (100%)", biga: "Biga (45%)", poolish: "Poolish (100%)" };

export default function ConvertitoreLieviti({ onBack }) {
  const { lang } = useLang();
  const L = (i, d, e, s) => mkTri(lang)(i, d, e, s);
  const num = (v) => Math.round(v).toLocaleString(lang === "en" ? "en" : "it");
  const inp = "w-full bg-white dark:bg-[#18202E] border border-[#26324A] dark:border-[#26324A] rounded-2xl shadow-md border border-amber-900/40 px-3 py-2.5 outline-none text-[#F26419] dark:text-[#e4eff8] focus:border-[#F26419] font-mono-data";
  const lbl = "text-[12px] font-semibold text-[#F26419] dark:text-[#AEB8BF] mb-1";

  // 1) Lievito di birra fresco <-> secco
  const [fresco, setFresco] = useState(12);
  const secco = useMemo(() => (Number(fresco) || 0) / 3, [fresco]);

  // 2) Birra -> Lievito Madre (regola pratica)
  const [birra, setBirra] = useState(5);
  const lmFromBirra = useMemo(() => (Number(birra) || 0) * 20, [birra]);

  // 3) Converti prefermento tra idratazioni (farina prefermentata costante)
  const [prefFlour, setPrefFlour] = useState(200);
  const [from, setFrom] = useState("lm");
  const [to, setTo] = useState("licoli");
  const conv = useMemo(() => {
    const f = Number(prefFlour) || 0;
    return { flour: f, waterFrom: f * (HYD[from] || 0), waterTo: f * (HYD[to] || 0), totFrom: f * (1 + (HYD[from] || 0)), totTo: f * (1 + (HYD[to] || 0)) };
  }, [prefFlour, from, to]);

  const card = "rounded-2xl bg-[#0B0E14] dark:bg-[#18202E] border border-[#26324A] dark:border-[#26324A] p-4 shadow-sm";

  return (
    <div className="pb-8" data-testid="conv-lieviti">
      {onBack && <button data-testid="conv-back" onClick={onBack} className="flex items-center gap-1 text-[#F26419] font-medium mb-4"><ChevronRight className="w-5 h-5 rotate-180" /> {L("Indietro", "Zurück", "Back", "Atrás")}</button>}
      <div className="relative overflow-hidden rounded-3xl p-6 text-[#0B0E14] shadow-xl mb-5" style={{ background: "linear-gradient(135deg,#F26419,#F26419 60%,#F26419)" }}>
        <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center mb-3"><RefreshCw className="w-7 h-7" /></div>
        <h1 className="font-display text-2xl font-bold">{L("Convertitore Lieviti", "Hefe-Umrechner", "Leavening Converter", "Conversor de Levaduras")}</h1>
        <p className="text-[#0B0E14]/85 text-sm mt-2 leading-snug">{L("Passa da un tipo di lievito all'altro senza sbagliare le dosi: birra, Lievito Madre, Li.Co.Li., biga e poolish.", "Wechsle zwischen Hefearten ohne Dosierfehler.", "Switch between leavening types without dose errors.", "Cambia entre tipos de levadura sin errores.")}</p>
      </div>

      {/* 1 */}
      <div className={card + " mb-3"}>
        <p className="font-display text-base font-bold text-[#F26419] mb-2 flex items-center gap-1.5"><Beaker className="w-4.5 h-4.5" /> {L("Lievito di birra: fresco ⇄ secco", "Hefe: frisch ⇄ trocken", "Yeast: fresh ⇄ dry", "Levadura: fresca ⇄ seca")}</p>
        <div className="grid grid-cols-2 gap-3 items-end">
          <div><p className={lbl}>{L("Fresco (g)", "Frisch (g)", "Fresh (g)", "Fresca (g)")}</p><input data-testid="conv-fresco" type="number" value={fresco} onChange={(e) => setFresco(e.target.value)} className={inp} /></div>
          <div><p className={lbl}>{L("Secco / istantaneo (g)", "Trocken (g)", "Dry (g)", "Seca (g)")}</p><div data-testid="conv-secco" className="rounded-2xl shadow-md border border-amber-900/40 bg-[#ffffff] text-[#F26419] font-mono-data font-bold px-3 py-2.5 text-center">{secco.toLocaleString(lang === "en" ? "en" : "it", { maximumFractionDigits: 1 })} g</div></div>
        </div>
        <p className="text-[11px] text-[#E8A838] mt-1.5">{L("Regola: 3 g di fresco = 1 g di secco.", "Regel: 3 g frisch = 1 g trocken.", "Rule: 3 g fresh = 1 g dry.", "Regla: 3 g fresca = 1 g seca.")}</p>
      </div>

      {/* 2 */}
      <div className={card + " mb-3"}>
        <p className="font-display text-base font-bold text-[#F26419] mb-2">{L("Da lievito di birra a Lievito Madre", "Von Hefe zu Sauerteig", "From yeast to sourdough", "De levadura a masa madre")}</p>
        <div className="grid grid-cols-2 gap-3 items-end">
          <div><p className={lbl}>{L("Birra fresco (g)", "Frischhefe (g)", "Fresh yeast (g)", "Levadura (g)")}</p><input data-testid="conv-birra" type="number" value={birra} onChange={(e) => setBirra(e.target.value)} className={inp} /></div>
          <div><p className={lbl}>{L("Lievito Madre (g)", "Sauerteig (g)", "Sourdough (g)", "Masa madre (g)")}</p><div data-testid="conv-lm-out" className="rounded-2xl shadow-md border border-amber-900/40 bg-[#ffffff] text-[#F26419] font-mono-data font-bold px-3 py-2.5 text-center">{num(lmFromBirra)} g</div></div>
        </div>
        <p className="text-[11px] text-[#E8A838] mt-1.5">{L("Stima: ~20 g di LM maturo per 1 g di birra. Allunga la lievitazione di 2-4 ore.", "~20 g reifer Sauerteig pro 1 g Hefe. Gärzeit +2-4 h.", "~20 g mature sourdough per 1 g yeast. Add 2-4 h proofing.", "~20 g de masa madre por 1 g de levadura. +2-4 h de fermentación.")}</p>
      </div>

      {/* 3 */}
      <div className={card}>
        <p className="font-display text-base font-bold text-[#F26419] mb-2 flex items-center gap-1.5"><Droplets className="w-4.5 h-4.5" /> {L("Converti il prefermento (idratazione)", "Vorteig umrechnen (Hydratation)", "Convert preferment (hydration)", "Convertir prefermento (hidratación)")}</p>
        <div className="mb-3"><p className={lbl}><Wheat className="w-3.5 h-3.5 inline mr-1" />{L("Farina nel prefermento (g)", "Mehl im Vorteig (g)", "Flour in preferment (g)", "Harina en prefermento (g)")}</p><input data-testid="conv-prefflour" type="number" value={prefFlour} onChange={(e) => setPrefFlour(e.target.value)} className={inp} /></div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div><p className={lbl}>{L("Da", "Von", "From", "De")}</p><select data-testid="conv-from" value={from} onChange={(e) => setFrom(e.target.value)} className={inp}>{Object.entries(PNAME).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
          <div><p className={lbl}>{L("A", "Zu", "To", "A")}</p><select data-testid="conv-to" value={to} onChange={(e) => setTo(e.target.value)} className={inp}>{Object.entries(PNAME).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
        </div>
        <div data-testid="conv-pref-out" className="rounded-2xl shadow-md border border-amber-900/40 bg-[#ffffff] p-3 text-[13px] text-[#F26419] font-semibold space-y-1">
          <p>{PNAME[to]}: <span className="font-mono-data">{num(conv.flour)} g {L("farina", "Mehl", "flour", "harina")} + {num(conv.waterTo)} g {L("acqua", "Wasser", "water", "agua")}</span></p>
          <p className="text-[12px] text-[#F26419]">{L("Prefermento totale", "Vorteig gesamt", "Total preferment", "Prefermento total")}: {num(conv.totTo)} g ({L("prima era", "vorher", "was", "antes")} {num(conv.totFrom)} g). {L("Correggi l'acqua dell'impasto della differenza:", "Wasser im Teig um die Differenz anpassen:", "Adjust dough water by the difference:", "Ajusta el agua de la masa por la diferencia:")} {num(conv.waterTo - conv.waterFrom)} g.</p>
        </div>
      </div>
    </div>
  );
}
