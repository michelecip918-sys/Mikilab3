import { useState, useMemo } from "react";
import { ChevronRight, Cake, Clock, Scale, IceCream2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";

// Coefficienti POD (potere dolcificante) e PAC (potere anticongelante)
const SUGARS = {
  saccarosio: { it: "Saccarosio", pod: 100, pac: 100 },
  destrosio: { it: "Destrosio", pod: 70, pac: 190 },
  invertito: { it: "Zucchero invertito", pod: 130, pac: 190 },
  glucosio: { it: "Sciroppo di glucosio DE60", pod: 50, pac: 110 },
};

export default function LabPasticceria({ onBack }) {
  const { lang } = useLang();
  const L = (i, e) => (lang === "it" ? i : (e ?? i));
  const num = (v) => Math.round(v).toLocaleString(lang === "it" ? "it" : "en");
  const inp = "w-full bg-white dark:bg-[#232A31] border border-[#E6D8C3] dark:border-[#38424B] rounded-xl px-3 py-2.5 outline-none text-[#2C1E16] dark:text-[#e4eff8] focus:border-[#D97706] font-mono-data";
  const lbl = "text-[12px] font-semibold text-[#6B5546] dark:text-[#AEB8BF] mb-1";
  const card = "rounded-2xl bg-[#FAF5EC] dark:bg-[#232A31] border border-[#E6D8C3] dark:border-[#38424B] p-4 shadow-sm";
  const [tab, setTab] = useState("lievitati");

  // Grandi Lievitati: schedule 3 rinfreschi a 30°C
  const [firstRefresh, setFirstRefresh] = useState("08:00");
  const schedule = useMemo(() => {
    const [h, m] = firstRefresh.split(":").map(Number);
    const start = new Date(); start.setHours(h || 8, m || 0, 0, 0);
    const steps = [];
    for (let i = 0; i < 3; i++) {
      const t = new Date(start.getTime() + i * 4 * 3600000);
      steps.push(t.toTimeString().slice(0, 5));
    }
    const impasto = new Date(start.getTime() + 3 * 4 * 3600000).toTimeString().slice(0, 5);
    return { steps, impasto };
  }, [firstRefresh]);

  // Bilanciatore Frolle & Brioche
  const [prod, setProd] = useState("brioche");
  const [butter, setButter] = useState(45);
  const [yolks, setYolks] = useState(20);
  const [sugar, setSugar] = useState(25);
  const balance = useMemo(() => {
    const b = Number(butter), y = Number(yolks), s = Number(sugar);
    const limit = prod === "frolla" ? 60 : 55;
    const risk = b + y * 0.4 > limit;
    return { risk, limit, msg: risk
      ? L(`Rischio cedimento maglia: grassi troppo alti (burro ${b}% + tuorli). Riduci il burro o aumenta la forza della farina.`, `Gluten collapse risk: fats too high (butter ${b}% + yolks). Reduce butter or increase flour strength.`)
      : L("Bilanciamento corretto: la maglia glutinica regge bene questi grassi.", "Balanced: the gluten network holds these fats well.") };
  }, [prod, butter, yolks, sugar, lang]);

  // POD & PAC
  const [sg, setSg] = useState({ saccarosio: 150, destrosio: 30, invertito: 20, glucosio: 0 });
  const [mix, setMix] = useState(1000);
  const podpac = useMemo(() => {
    let pod = 0, pac = 0, tot = 0;
    Object.entries(sg).forEach(([k, g]) => { const v = Number(g) || 0; pod += v * SUGARS[k].pod / 100; pac += v * SUGARS[k].pac / 100; tot += v; });
    const base = Number(mix) || 1000;
    const podR = pod / base * 1000, pacR = pac / base * 1000;
    return { pod, pac, podR, pacR, tot,
      podOk: podR >= 180 && podR <= 280, pacOk: pacR >= 250 && pacR <= 300 };
  }, [sg, mix]);

  const TABS = [
    { id: "lievitati", Icon: Clock, label: L("Grandi Lievitati", "Big Leavened") },
    { id: "frolle", Icon: Scale, label: L("Frolle & Brioche", "Pastry & Brioche") },
    { id: "podpac", Icon: IceCream2, label: L("POD & PAC", "POD & PAC") },
  ];

  return (
    <div className="pb-8" data-testid="lab-pasticceria">
      {onBack && <button data-testid="pasticceria-back" onClick={onBack} className="flex items-center gap-1 text-[#8C4A27] font-medium mb-4"><ChevronRight className="w-5 h-5 rotate-180" /> {L("Indietro", "Back")}</button>}
      <div className="relative overflow-hidden rounded-3xl p-6 text-[#FFFDF9] shadow-xl mb-4" style={{ background: "linear-gradient(135deg,#8C4A27,#6E371C 60%,#4A3222)" }}>
        <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center mb-3"><Cake className="w-7 h-7" /></div>
        <h1 className="font-display text-2xl font-bold">{L("Laboratorio Pasticceria & Lievitati", "Pastry & Leavened Lab")}</h1>
        <p className="text-[#FFFDF9]/85 text-sm mt-2 leading-snug">{L("Grandi lievitati, bilanciamento impasti dolci e gelateria da vetrina.", "Big leavened cakes, sweet dough balancing and display gelato.")}</p>
      </div>

      <div className="flex gap-1.5 bg-[#F2E8D5] p-1.5 rounded-2xl mb-5 border border-[#E6D8C3]">
        {TABS.map(({ id, Icon, label }) => (
          <button key={id} data-testid={`pasticceria-tab-${id}`} onClick={() => setTab(id)} className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl text-[11px] font-bold transition-all ${tab === id ? "bg-[#8C4A27] text-[#FFFDF9] shadow" : "text-[#6B5546]"}`}><Icon className="w-4 h-4" /> {label}</button>
        ))}
      </div>

      {tab === "lievitati" && (
        <div className={card} data-testid="pasticceria-lievitati">
          <p className={lbl}>{L("Ora del 1° rinfresco (a 30°C)", "1st refresh time (at 30°C)")}</p>
          <input data-testid="gl-first" type="time" value={firstRefresh} onChange={(e) => setFirstRefresh(e.target.value)} className={inp + " mb-3"} />
          <div className="rounded-xl bg-[#FEF3C7] p-3 space-y-2" data-testid="gl-schedule">
            {schedule.steps.map((t, i) => (
              <div key={i} className="flex items-center gap-2 text-[13px]"><span className="w-6 h-6 rounded-full bg-[#8C4A27] text-white text-[11px] font-bold flex items-center justify-center">{i + 1}</span><span className="text-[#6B5546]">{L(`Rinfresco ${i + 1} · lievito raddoppiato in ~4h a 30°C`, `Refresh ${i + 1} · doubled in ~4h at 30°C`)}</span><span className="ml-auto font-mono-data font-bold text-[#8C4A27]">{t}</span></div>
            ))}
            <div className="flex items-center gap-2 text-[13px] pt-2 border-t border-[#E6D8C3]"><span className="w-6 h-6 rounded-full bg-[#D97706] text-white text-[11px] font-bold flex items-center justify-center">★</span><span className="text-[#6B5546] font-semibold">{L("Primo impasto pronto", "First dough ready")}</span><span className="ml-auto font-mono-data font-bold text-[#8C4A27]">{schedule.impasto}</span></div>
          </div>
          <p className="text-[12px] text-[#6B5546] mt-2 leading-snug">{L("Tra un rinfresco e l'altro il lievito madre deve triplicare a 28-30°C. Il bagnetto in acqua (a 18°C con poco zucchero) prima dell'ultimo rinfresco riduce l'acidità.", "Between refreshes the sourdough should triple at 28-30°C. A water bath (18°C, a little sugar) before the last refresh lowers acidity.")}</p>
        </div>
      )}

      {tab === "frolle" && (
        <div className={card} data-testid="pasticceria-frolle">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div><p className={lbl}>{L("Prodotto", "Product")}</p><select data-testid="fr-prod" value={prod} onChange={(e) => setProd(e.target.value)} className={inp}><option value="brioche">{L("Brioche / Lievitato", "Brioche")}</option><option value="frolla">{L("Frolla", "Shortcrust")}</option></select></div>
            <div><p className={lbl}>{L("Burro (% farina)", "Butter (% flour)")}</p><input data-testid="fr-butter" type="number" value={butter} onChange={(e) => setButter(e.target.value)} className={inp} /></div>
            <div><p className={lbl}>{L("Tuorli (% farina)", "Yolks (% flour)")}</p><input type="number" value={yolks} onChange={(e) => setYolks(e.target.value)} className={inp} /></div>
            <div><p className={lbl}>{L("Zucchero (% farina)", "Sugar (% flour)")}</p><input type="number" value={sugar} onChange={(e) => setSugar(e.target.value)} className={inp} /></div>
          </div>
          <div data-testid="fr-out" className={`rounded-xl p-3 flex items-start gap-2 ${balance.risk ? "bg-[#FEE2E2] border border-[#DC2626]" : "bg-[#DCFCE7] border border-[#16A34A]"}`}>
            {balance.risk ? <AlertTriangle className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" /> : <CheckCircle2 className="w-5 h-5 text-[#16A34A] shrink-0 mt-0.5" />}
            <p className={`text-[13px] font-medium ${balance.risk ? "text-[#991B1B]" : "text-[#166534]"}`}>{balance.msg}</p>
          </div>
        </div>
      )}

      {tab === "podpac" && (
        <div className={card} data-testid="pasticceria-podpac">
          <p className="text-[12.5px] text-[#6B5546] mb-3">{L("Inserisci i grammi di ogni zucchero e il peso totale della miscela per bilanciare dolcezza (POD) e struttura al freddo (PAC) per vetrina a -12°C.", "Enter grams of each sugar and total mix weight to balance sweetness (POD) and freezing (PAC) for a -12°C display.")}</p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            {Object.entries(SUGARS).map(([k, v]) => (
              <div key={k}><p className={lbl}>{v.it} (g)</p><input data-testid={`pp-${k}`} type="number" value={sg[k]} onChange={(e) => setSg({ ...sg, [k]: e.target.value })} className={inp} /></div>
            ))}
            <div className="col-span-2"><p className={lbl}>{L("Peso totale miscela (g)", "Total mix weight (g)")}</p><input data-testid="pp-mix" type="number" value={mix} onChange={(e) => setMix(e.target.value)} className={inp} /></div>
          </div>
          <div data-testid="pp-out" className="grid grid-cols-2 gap-2">
            <div className={`rounded-xl p-3 text-center border ${podpac.podOk ? "bg-[#DCFCE7] border-[#16A34A]" : "bg-[#FEF3C7] border-[#D97706]"}`}><p className="text-[11px] font-semibold text-[#6B5546]">POD (/kg)</p><p className="font-display text-2xl font-bold text-[#8C4A27]">{num(podpac.podR)}</p><p className="text-[10px] text-[#6B5546]">{L("ideale 180-280", "ideal 180-280")}</p></div>
            <div className={`rounded-xl p-3 text-center border ${podpac.pacOk ? "bg-[#DCFCE7] border-[#16A34A]" : "bg-[#FEF3C7] border-[#D97706]"}`}><p className="text-[11px] font-semibold text-[#6B5546]">PAC (/kg)</p><p className="font-display text-2xl font-bold text-[#8C4A27]">{num(podpac.pacR)}</p><p className="text-[10px] text-[#6B5546]">{L("ideale 250-300 (-12°C)", "ideal 250-300 (-12°C)")}</p></div>
          </div>
        </div>
      )}
    </div>
  );
}
