import { mkTri } from "@/i18n/triMaps";
import { useState, useMemo } from "react";
import { ChevronRight, Pizza, FlaskConical, ClipboardList, Grid3x3, Thermometer, CalendarDays, Euro } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import FoodCostBox from "@/components/FoodCostBox";
import RelatedToolsRow from "@/components/RelatedToolsRow";

const TYPES = {
  napoletana: { it: "Napoletana", hyd: 62, panetto: 260, box: 20 },
  teglia: { it: "In Teglia", hyd: 78, panetto: 300, box: 12 },
  pala: { it: "Alla Pala", hyd: 80, panetto: 250, box: 14 },
};
const PREF = { biga: { hyd: 0.45, name: "Biga (45%)" }, poolish: { hyd: 1.0, name: "Poolish (100%)" } };

export default function LabPizzeria({ onBack, onOpenTool }) {
  const { lang } = useLang();
  const L = (i, e) => mkTri(lang)(i, e, e, e);
  const num = (v) => Math.round(v).toLocaleString(lang === "it" ? "it" : "en");
  const inp = "w-full bg-white dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] rounded-2xl shadow-md border border-amber-900/40 px-3 py-2.5 outline-none text-[#ff6b00] dark:text-[#e4eff8] focus:border-[#ff6b00] font-mono-data";
  const lbl = "text-[12px] font-semibold text-[#ff6b00] dark:text-[#AEB8BF] mb-1";
  const card = "rounded-2xl bg-[#121212] dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] p-4 shadow-sm";
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
  const [pl, setPl] = useState(0.55);
  const matrix = useMemo(() => {
    const W = Number(w) || 0; const PL = Number(pl) || 0;
    const plNote = PL >= 0.65 ? L(" Farina tenace (P/L alto): allunga un po' l'appretto e stendi con delicatezza.", " Tenacious flour (high P/L): extend appretto a bit and shape gently.")
      : PL <= 0.4 ? L(" Farina estensibile (P/L basso): impasto rilassato, riduci leggermente l'appretto.", " Extensible flour (low P/L): relaxed dough, slightly reduce appretto.") : "";
    let base;
    if (W < 220) base = { fridge: "6-12 h", appretto: "1-2 h", note: L("Farina debole: maturazione breve, meglio a temperatura ambiente.", "Weak flour: short maturation, better at room temp.") };
    else if (W < 260) base = { fridge: "24 h", appretto: "3-4 h", note: L("Farina media: 24h in frigo per un impasto leggero.", "Medium flour: 24h in the fridge for a light dough.") };
    else if (W < 300) base = { fridge: "48 h", appretto: "4-6 h", note: L("Farina forte: 48h di maturazione controllata.", "Strong flour: 48h controlled maturation.") };
    else if (W < 340) base = { fridge: "72 h", appretto: "6-8 h", note: L("Farina molto forte: fino a 72h, alta digeribilità.", "Very strong flour: up to 72h, high digestibility.") };
    else base = { fridge: "72-96 h", appretto: "8-10 h", note: L("Manitoba: maturazioni lunghissime, gestisci bene il freddo.", "Manitoba: very long maturation, manage cold well.") };
    return { ...base, note: base.note + plNote };
  }, [w, pl, lang]);

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

  // Teorema Temperatura Acqua (fattore macchina)
  const [tDough, setTDough] = useState(24);
  const [tRoom2, setTRoom2] = useState(20);
  const [tFlour, setTFlour] = useState(19);
  const [tFriction, setTFriction] = useState(6);
  const [factor, setFactor] = useState(3);
  const waterT = useMemo(() => {
    const f = Number(factor) || 3;
    const wt = (Number(tDough) || 0) * f - ((Number(tRoom2) || 0) + (Number(tFlour) || 0) + (Number(tFriction) || 0));
    return Math.round(wt);
  }, [tDough, tRoom2, tFlour, tFriction, factor]);

  // Piano Settimanale Production (Lun-Dom): impasti e palline per giorno
  const DAYS = [
    L("Lunedì", "Monday", "Lunes", "Lundi"), L("Martedì", "Tuesday", "Martes", "Mardi"),
    L("Mercoledì", "Wednesday", "Miércoles", "Mercredi"), L("Giovedì", "Thursday", "Jueves", "Jeudi"),
    L("Venerdì", "Friday", "Viernes", "Vendredi"), L("Sabato", "Saturday", "Sábado", "Samedi"),
    L("Domenica", "Sunday", "Domingo", "Dimanche"),
  ];
  const [week, setWeek] = useState(DAYS.map(() => ({ type: "napoletana", balls: 0 })));
  const setDay = (i, k, v) => setWeek((l) => l.map((d, j) => (j === i ? { ...d, [k]: v } : d)));
  const weekTot = useMemo(() => {
    let balls = 0, dough = 0, flour = 0;
    week.forEach((d) => {
      const t = TYPES[d.type]; const b = Number(d.balls) || 0;
      balls += b; const dt = b * t.panetto; dough += dt; flour += dt / (1 + t.hyd / 100);
    });
    return { balls, dough, flourKg: flour / 1000 };
  }, [week]);

  const TABS = [
    { id: "prefermenti", Icon: FlaskConical, label: L("Biga & Poolish", "Biga & Poolish") },
    { id: "matrix", Icon: Grid3x3, label: L("Matrix W", "W Matrix") },
    { id: "acqua", Icon: Thermometer, label: L("T° Acqua", "Water T°") },
    { id: "planner", Icon: ClipboardList, label: L("Palline/Teglie", "Balls/Trays") },
    { id: "settimana", Icon: CalendarDays, label: L("Settimana", "Week") },
    { id: "foodcost", Icon: Euro, label: L("Food Cost", "Food Cost") },
  ];

  return (
    <div className="pb-8" data-testid="lab-pizzeria">
      {onBack && <button data-testid="pizzeria-back" onClick={onBack} className="flex items-center gap-1 text-[#ff6b00] font-medium mb-4"><ChevronRight className="w-5 h-5 rotate-180" /> {L("Indietro", "Back")}</button>}
      <RelatedToolsRow cat="pizzeria" onOpenTool={onOpenTool} />
      <div className="relative overflow-hidden rounded-3xl p-6 text-[#121212] shadow-xl mb-4" style={{ background: "linear-gradient(135deg,#ff6b00,#ff6b00 60%,#ff6b00)" }}>
        <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center mb-3"><Pizza className="w-7 h-7" /></div>
        <h1 className="font-display text-2xl font-bold">{L("Laboratorio Pizzeria", "Pizzeria Lab")}</h1>
        <p className="text-[#121212]/85 text-sm mt-2 leading-snug">{L("Prefermenti, maturazione e organizzazione del servizio per Napoletana, Teglia e Pala.", "Preferments, maturation and service planning for Neapolitan, Pan and Pala.")}</p>
      </div>

      <div className="flex flex-wrap gap-1.5 bg-[#1e1e1e] p-1.5 rounded-2xl mb-5 border border-[#2e2e2e]">
        {TABS.map(({ id, Icon, label }) => (
          <button key={id} data-testid={`pizzeria-tab-${id}`} onClick={() => setTab(id)} className={`flex-1 min-w-[30%] flex flex-col items-center gap-1 py-2 rounded-2xl shadow-md border border-amber-900/40 text-[11px] font-bold transition-all ${tab === id ? "bg-[#ff6b00] text-[#121212] shadow" : "text-[#ff6b00]"}`}><Icon className="w-4 h-4" /> {label}</button>
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
          <div data-testid="pz-pref-out" className="rounded-2xl shadow-md border border-amber-900/40 bg-[#ffffff] p-3 text-[13px] text-[#ff6b00] font-semibold space-y-1">
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
          <p className={lbl}>{L("Indice P/L (tenacità/estensibilità)", "P/L index (tenacity/extensibility)")}</p>
          <input data-testid="pz-pl" type="number" step="0.05" value={pl} onChange={(e) => setPl(e.target.value)} className={inp + " mb-3"} />
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="rounded-2xl shadow-md border border-amber-900/40 bg-[#ffffff] p-3 text-center"><p className="text-[11px] font-semibold text-[#ff6b00]">{L("Maturazione in frigo", "Cold maturation")}</p><p data-testid="pz-fridge" className="font-display text-xl font-bold text-[#ff6b00]">{matrix.fridge}</p></div>
            <div className="rounded-2xl shadow-md border border-amber-900/40 bg-[#ffffff] p-3 text-center"><p className="text-[11px] font-semibold text-[#ff6b00]">{L("Appretto (fuori frigo)", "Appretto (room)")}</p><p data-testid="pz-appretto" className="font-display text-xl font-bold text-[#ff6b00]">{matrix.appretto}</p></div>
          </div>
          <p className="text-[12.5px] text-[#ff6b00] dark:text-[#AEB8BF] leading-snug">{matrix.note}</p>
        </div>
      )}

      {tab === "planner" && (
        <div className={card} data-testid="pizzeria-planner">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div><p className={lbl}>{L("Numero di pizze", "Number of pizzas")}</p><input data-testid="pz-pizzas" type="number" value={pizzas} onChange={(e) => setPizzas(Number(e.target.value))} className={inp} /></div>
            <div><p className={lbl}>{L("Tipo", "Type")}</p><select data-testid="pz-sptype" value={sptype} onChange={(e) => setSptype(e.target.value)} className={inp}>{Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v.it}</option>)}</select></div>
          </div>
          <div data-testid="pz-planner-out" className="rounded-2xl shadow-md border border-amber-900/40 bg-[#ffffff] p-3 divide-y divide-[#2e2e2e]">
            {[[L("Impasto totale", "Total dough"), `${num(sp.doughTot)} g`], [L("Farina", "Flour"), `${sp.flourKg.toFixed(1)} kg`], [L("Acqua", "Water"), `${sp.waterKg.toFixed(1)} kg`], [L("Lievito (diretto ~0,3%)", "Yeast (~0.3%)"), `${num(sp.yeastG)} g`], [L("Cassette necessarie", "Boxes needed"), `${sp.boxes}`]].map(([k, v], i) => (
              <div key={i} className="flex justify-between py-1.5 text-[13px]"><span className="text-[#ff6b00]">{k}</span><span className="font-mono-data font-bold text-[#ff6b00]">{v}</span></div>
            ))}
          </div>
        </div>
      )}
      {tab === "acqua" && (
        <div className={card} data-testid="pizzeria-acqua">
          <p className="text-[12.5px] text-[#ff6b00] mb-3">{L("Teorema della temperatura acqua: (T° impasto × fattore macchina) − (T° ambiente + T° farina + T° attrito).", "Water temperature theorem: (dough T° × machine factor) − (room T° + flour T° + friction T°).")}</p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div><p className={lbl}>{L("T° impasto voluta", "Desired dough T°")}</p><input data-testid="pz-tdough" type="number" value={tDough} onChange={(e) => setTDough(e.target.value)} className={inp} /></div>
            <div><p className={lbl}>{L("Fattore macchina", "Machine factor")}</p><input data-testid="pz-factor" type="number" value={factor} onChange={(e) => setFactor(e.target.value)} className={inp} /></div>
            <div><p className={lbl}>{L("T° ambiente", "Room T°")}</p><input data-testid="pz-troom2" type="number" value={tRoom2} onChange={(e) => setTRoom2(e.target.value)} className={inp} /></div>
            <div><p className={lbl}>{L("T° farina", "Flour T°")}</p><input data-testid="pz-tflour" type="number" value={tFlour} onChange={(e) => setTFlour(e.target.value)} className={inp} /></div>
            <div><p className={lbl}>{L("T° attrito", "Friction T°")}</p><input data-testid="pz-tfriction" type="number" value={tFriction} onChange={(e) => setTFriction(e.target.value)} className={inp} /></div>
          </div>
          <div data-testid="pz-water-out" className="rounded-2xl shadow-md border border-amber-900/40 bg-[#ffffff] p-4 text-center">
            <p className="text-[12px] font-semibold text-[#ff6b00]">{L("Temperatura acqua consigliata", "Recommended water temperature")}</p>
            <p className="font-display text-4xl font-bold text-[#ff6b00]">{waterT}°C</p>
          </div>
        </div>
      )}

      {tab === "settimana" && (
        <div className={card} data-testid="pizzeria-settimana">
          <p className="text-[12.5px] text-[#ff6b00] mb-3">{L("Pianifica impasti e palline da Lunedì a Domenica.", "Plan doughs and dough balls from Monday to Sunday.")}</p>
          <div className="space-y-2 mb-3">
            {DAYS.map((d, i) => (
              <div key={i} className="flex items-center gap-2" data-testid={`pz-week-${i}`}>
                <span className="w-24 shrink-0 text-[13px] font-semibold text-[#ff6b00]">{d}</span>
                <select data-testid={`pz-week-type-${i}`} value={week[i].type} onChange={(e) => setDay(i, "type", e.target.value)} className={inp + " flex-1 min-w-0"}>{Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v.it}</option>)}</select>
                <input data-testid={`pz-week-balls-${i}`} type="number" value={week[i].balls} onChange={(e) => setDay(i, "balls", e.target.value)} placeholder={L("palline", "balls")} className={inp + " w-24 shrink-0"} />
              </div>
            ))}
          </div>
          <div data-testid="pz-week-out" className="rounded-2xl shadow-md border border-amber-900/40 bg-[#ffffff] p-3 divide-y divide-[#2e2e2e]">
            {[[L("Palline totali", "Total balls"), `${num(weekTot.balls)}`], [L("Impasto totale", "Total dough"), `${num(weekTot.dough)} g`], [L("Farina totale", "Total flour"), `${weekTot.flourKg.toFixed(1)} kg`]].map(([k, v], i) => (
              <div key={i} className="flex justify-between py-1.5 text-[13px]"><span className="text-[#ff6b00]">{k}</span><span className="font-mono-data font-bold text-[#ff6b00]">{v}</span></div>
            ))}
          </div>
        </div>
      )}

      {tab === "foodcost" && <FoodCostBox />}
    </div>
  );
}
