import { useState, useMemo } from "react";
import { ChevronRight, Pizza, Droplets, FlaskConical, ClipboardList, Grid3x3 } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";

const TYPES = {
  napoletana: { it: "Napoletana", hyd: 62, panetto: 260, box: 20 },
  teglia: { it: "In Teglia", hyd: 78, panetto: 300, box: 12 },
  pala: { it: "Alla Pala", hyd: 80, panetto: 250, box: 14 },
};
const PREF = { biga: { hyd: 0.45, name: "Biga (45%)" }, poolish: { hyd: 1.0, name: "Poolish (100%)" } };

export default function LabPizzeria({ onBack }) {
  const { lang } = useLang();
  const L = (i, e) => (lang === "it" ? i : (e ?? i));
  const num = (v) => Math.round(v).toLocaleString(lang === "it" ? "it" : "en");
  const inp = "w-full bg-white dark:bg-[#232A31] border border-[#E6D8C3] dark:border-[#38424B] rounded-xl px-3 py-2.5 outline-none text-[#2C1E16] dark:text-[#e4eff8] focus:border-[#D97706] font-mono-data";
  const lbl = "text-[12px] font-semibold text-[#6B5546] dark:text-[#AEB8BF] mb-1";
  const card = "rounded-2xl bg-[#FAF5EC] dark:bg-[#232A31] border border-[#E6D8C3] dark:border-[#38424B] p-4 shadow-sm";
  const [tab, setTab] = useState("prefermenti");

  // Biga & Poolish
  const [flour, setFlour] = useState(1000);
  const [ptype, setPtype] = useState("napoletana");
  const [pref, setPref] = useState("biga");
  const [prefPct, setPrefPct] = useState(30);
  const [tRoom, setTRoom] = useState(20);
  const bp = useMemo(() => {
    const t = TYPES[ptype], pr = PREF[pref];
    const totWater = flour * t.hyd / 100;
    const pFlour = flour * prefPct / 100;
    const pWater = pFlour * pr.hyd;
    const waterTemp = Math.round(56 - tRoom - 18);
    return { hyd: t.hyd, totWater, pFlour, pWater, doughWater: Math.max(0, totWater - pWater), waterTemp };
  }, [flour, ptype, pref, prefPct, tRoom]);

  // Matrix W
  const [w, setW] = useState(300);
  const matrix = useMemo(() => {
    const W = Number(w) || 0;
    if (W < 220) return { fridge: "6-12 h", appretto: "1-2 h", note: L("Farina debole: maturazione breve, meglio a temperatura ambiente.", "Weak flour: short maturation, better at room temp.") };
    if (W < 260) return { fridge: "24 h", appretto: "3-4 h", note: L("Farina media: 24h in frigo per un impasto leggero.", "Medium flour: 24h in the fridge for a light dough.") };
    if (W < 300) return { fridge: "48 h", appretto: "4-6 h", note: L("Farina forte: 48h di maturazione controllata.", "Strong flour: 48h controlled maturation.") };
    if (W < 340) return { fridge: "72 h", appretto: "6-8 h", note: L("Farina molto forte: fino a 72h, alta digeribilità.", "Very strong flour: up to 72h, high digestibility.") };
    return { fridge: "72-96 h", appretto: "8-10 h", note: L("Manitoba: maturazioni lunghissime, gestisci bene il freddo.", "Manitoba: very long maturation, manage cold well.") };
  }, [w, lang]);

  // Service Planner
  const [pizzas, setPizzas] = useState(50);
  const [sptype, setSptype] = useState("napoletana");
  const sp = useMemo(() => {
    const t = TYPES[sptype];
    const doughTot = pizzas * t.panetto;
    const flourKg = doughTot / (1 + t.hyd / 100) / 1000;
    const waterKg = flourKg * t.hyd / 100;
    const yeastG = flourKg * 3; // ~0.3% su farina come stima diretto
    const boxes = Math.ceil(pizzas / t.box);
    return { doughTot, flourKg, waterKg, yeastG, boxes };
  }, [pizzas, sptype]);

  const TABS = [
    { id: "prefermenti", Icon: FlaskConical, label: L("Biga & Poolish", "Biga & Poolish") },
    { id: "matrix", Icon: Grid3x3, label: L("Matrix W", "W Matrix") },
    { id: "planner", Icon: ClipboardList, label: L("Service", "Service") },
  ];

  return (
    <div className="pb-8" data-testid="lab-pizzeria">
      {onBack && <button data-testid="pizzeria-back" onClick={onBack} className="flex items-center gap-1 text-[#8C4A27] font-medium mb-4"><ChevronRight className="w-5 h-5 rotate-180" /> {L("Indietro", "Back")}</button>}
      <div className="relative overflow-hidden rounded-3xl p-6 text-[#FFFDF9] shadow-xl mb-4" style={{ background: "linear-gradient(135deg,#B45309,#8C4A27 60%,#4A3222)" }}>
        <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center mb-3"><Pizza className="w-7 h-7" /></div>
        <h1 className="font-display text-2xl font-bold">{L("Laboratorio Pizzeria", "Pizzeria Lab")}</h1>
        <p className="text-[#FFFDF9]/85 text-sm mt-2 leading-snug">{L("Prefermenti, maturazione e organizzazione del servizio per Napoletana, Teglia e Pala.", "Preferments, maturation and service planning for Neapolitan, Pan and Pala.")}</p>
      </div>

      <div className="flex gap-1.5 bg-[#F2E8D5] p-1.5 rounded-2xl mb-5 border border-[#E6D8C3]">
        {TABS.map(({ id, Icon, label }) => (
          <button key={id} data-testid={`pizzeria-tab-${id}`} onClick={() => setTab(id)} className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl text-[11px] font-bold transition-all ${tab === id ? "bg-[#8C4A27] text-[#FFFDF9] shadow" : "text-[#6B5546]"}`}><Icon className="w-4 h-4" /> {label}</button>
        ))}
      </div>

      {tab === "prefermenti" && (
        <div className={card} data-testid="pizzeria-prefermenti">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div><p className={lbl}>{L("Farina totale (g)", "Total flour (g)")}</p><input data-testid="pz-flour" type="number" value={flour} onChange={(e) => setFlour(Number(e.target.value))} className={inp} /></div>
            <div><p className={lbl}>{L("Tipo pizza", "Pizza type")}</p><select data-testid="pz-type" value={ptype} onChange={(e) => setPtype(e.target.value)} className={inp}>{Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v.it}</option>)}</select></div>
            <div><p className={lbl}>{L("Prefermento", "Preferment")}</p><select value={pref} onChange={(e) => setPref(e.target.value)} className={inp}>{Object.entries(PREF).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}</select></div>
            <div><p className={lbl}>{L("% farina in prefermento", "% flour in preferment")}</p><input type="number" value={prefPct} onChange={(e) => setPrefPct(Number(e.target.value))} className={inp} /></div>
            <div><p className={lbl}>{L("T° ambiente", "Room T°")}</p><input type="number" value={tRoom} onChange={(e) => setTRoom(Number(e.target.value))} className={inp} /></div>
          </div>
          <div data-testid="pz-pref-out" className="rounded-xl bg-[#FEF3C7] p-3 text-[13px] text-[#8C4A27] font-semibold space-y-1">
            <p>{L("Chiusura impasto", "Dough hydration")}: <span className="font-mono-data">{bp.hyd}%</span> · {L("Acqua totale", "Total water")}: <span className="font-mono-data">{num(bp.totWater)} g</span></p>
            <p>{PREF[pref].name}: <span className="font-mono-data">{num(bp.pFlour)} g {L("farina", "flour")} + {num(bp.pWater)} g {L("acqua", "water")}</span></p>
            <p>{L("Acqua nell'impasto finale", "Water in final dough")}: <span className="font-mono-data">{num(bp.doughWater)} g</span></p>
            <p>{L("Temperatura acqua", "Water temp")}: <span className="font-mono-data">{bp.waterTemp}°C</span></p>
          </div>
        </div>
      )}

      {tab === "matrix" && (
        <div className={card} data-testid="pizzeria-matrix">
          <p className={lbl}>{L("Forza della farina (W)", "Flour strength (W)")}</p>
          <input data-testid="pz-w" type="number" value={w} onChange={(e) => setW(Number(e.target.value))} className={inp + " mb-3"} />
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="rounded-xl bg-[#FEF3C7] p-3 text-center"><p className="text-[11px] font-semibold text-[#92400E]">{L("Maturazione in frigo", "Cold maturation")}</p><p data-testid="pz-fridge" className="font-display text-xl font-bold text-[#8C4A27]">{matrix.fridge}</p></div>
            <div className="rounded-xl bg-[#FEF3C7] p-3 text-center"><p className="text-[11px] font-semibold text-[#92400E]">{L("Appretto (fuori frigo)", "Appretto (room)")}</p><p data-testid="pz-appretto" className="font-display text-xl font-bold text-[#8C4A27]">{matrix.appretto}</p></div>
          </div>
          <p className="text-[12.5px] text-[#6B5546] dark:text-[#AEB8BF] leading-snug">{matrix.note}</p>
        </div>
      )}

      {tab === "planner" && (
        <div className={card} data-testid="pizzeria-planner">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div><p className={lbl}>{L("Numero di pizze", "Number of pizzas")}</p><input data-testid="pz-pizzas" type="number" value={pizzas} onChange={(e) => setPizzas(Number(e.target.value))} className={inp} /></div>
            <div><p className={lbl}>{L("Tipo", "Type")}</p><select data-testid="pz-sptype" value={sptype} onChange={(e) => setSptype(e.target.value)} className={inp}>{Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v.it}</option>)}</select></div>
          </div>
          <div data-testid="pz-planner-out" className="rounded-xl bg-[#FEF3C7] p-3 divide-y divide-[#E6D8C3]">
            {[[L("Impasto totale", "Total dough"), `${num(sp.doughTot)} g`], [L("Farina", "Flour"), `${sp.flourKg.toFixed(1)} kg`], [L("Acqua", "Water"), `${sp.waterKg.toFixed(1)} kg`], [L("Lievito (diretto ~0,3%)", "Yeast (~0.3%)"), `${num(sp.yeastG)} g`], [L("Cassette necessarie", "Boxes needed"), `${sp.boxes}`]].map(([k, v], i) => (
              <div key={i} className="flex justify-between py-1.5 text-[13px]"><span className="text-[#6B5546]">{k}</span><span className="font-mono-data font-bold text-[#8C4A27]">{v}</span></div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
