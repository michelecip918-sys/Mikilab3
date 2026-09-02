import { mkTri } from "@/i18n/triMaps";
import { useState, useMemo } from "react";
import { ChevronRight, Calculator, Droplets, Wheat, FlaskConical, Thermometer, Clock, Lightbulb } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";

// Idratazione tipica dei prefermenti (per scomputo acqua)
const PREF = {
  none: { hyd: 0, it: "Nessuno (diretto)", de: "Keiner (direkt)", en: "None (direct)", es: "Ninguno (directo)" },
  poolish: { hyd: 1.0, it: "Poolish (100%)", de: "Poolish (100%)", en: "Poolish (100%)", es: "Poolish (100%)" },
  licoli: { hyd: 1.0, it: "Li.Co.Li. (100%)", de: "Li.Co.Li. (100%)", en: "Li.Co.Li. (100%)", es: "Li.Co.Li. (100%)" },
  lm: { hyd: 0.5, it: "Lievito Madre solido (50%)", de: "Fester Sauerteig (50%)", en: "Stiff sourdough (50%)", es: "Masa madre sólida (50%)" },
  biga: { hyd: 0.45, it: "Biga (45%)", de: "Biga (45%)", en: "Biga (45%)", es: "Biga (45%)" },
};

export default function CalcolatoreMetodo({ onBack }) {
  const { lang } = useLang();
  const L = (i, d, e, s) => mkTri(lang)(i, d, e, s);

  const [flour, setFlour] = useState(1000);
  const [hyd, setHyd] = useState(75);
  const [salt, setSalt] = useState(2.2);
  const [prefType, setPrefType] = useState("poolish");
  const [prefPct, setPrefPct] = useState(30);
  const [tRoom, setTRoom] = useState(22);
  const [tFlour, setTFlour] = useState(20);
  const [wStrength, setWStrength] = useState(300);

  const r = useMemo(() => {
    const f = Math.max(0, Number(flour) || 0);
    const totalWater = (f * hyd) / 100;
    const saltG = (f * salt) / 100;
    const prefFlour = (f * prefPct) / 100;
    const pref = PREF[prefType] || PREF.none;
    const prefWater = prefFlour * pref.hyd;
    const prefTotal = prefFlour + prefWater;
    const flourInDough = f - prefFlour;
    const waterInDough = Math.max(0, totalWater - prefWater);
    // Temperatura acqua: costante ~64 per spirale (regola 60/70 semplificata)
    const K = 64;
    const waterTemp = Math.round(K - tRoom - tFlour);
    // Tempo impasto (spirale) stimato in base a W
    const mixMin = wStrength >= 330 ? "12–16" : wStrength >= 280 ? "9–12" : "6–9";
    return { totalWater, saltG, prefFlour, prefWater, prefTotal, flourInDough, waterInDough, waterTemp, mixMin };
  }, [flour, hyd, salt, prefType, prefPct, tRoom, tFlour, wStrength]);

  const num = (v) => Math.round(v).toLocaleString(lang === "en" ? "en" : "it");
  const inp = "w-full bg-white dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] rounded-2xl shadow-md border border-amber-900/40 px-3 py-2.5 outline-none text-[#ff6b00] dark:text-[#e4eff8] focus:border-[#ff6b00] font-mono-data";
  const lbl = "text-[12px] font-semibold text-[#ff6b00] dark:text-[#AEB8BF] mb-1 flex items-center gap-1.5";

  return (
    <div className="pb-8" data-testid="calc-metodo">
      {onBack && <button data-testid="calc-back" onClick={onBack} className="flex items-center gap-1 text-[#ff6b00] font-medium mb-4">
        <ChevronRight className="w-5 h-5 rotate-180" /> {L("Indietro", "Zurück", "Back", "Atrás")}
      </button>}

      <div className="relative overflow-hidden rounded-3xl p-6 text-[#121212] shadow-xl mb-5"
        style={{ background: "linear-gradient(135deg,#ff6b00 0%,#ff6b00 60%,#ff6b00 100%)" }}>
        <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center mb-3"><Calculator className="w-7 h-7" /></div>
        <h1 className="font-display text-2xl font-bold">{L("Calcolatore Idratazione & Parametri Base", "Hydratation & Basiswerte", "Hydration & Base Parameters", "Hidratación y Parámetros Base")}</h1>
        <p className="text-[#121212]/85 text-sm mt-2 leading-snug">{L("Dosi, idratazione, scomputo del prefermento, temperatura acqua e tempi di incordatura per impasti ad alta alveolatura.", "Mengen, Hydratation, Vorteig-Verrechnung, Wassertemperatur und Knetzeiten für offene Porung.", "Doses, hydration, preferment offset, water temperature and mixing times for open-crumb doughs.", "Dosis, hidratación, cálculo del prefermento, temperatura del agua y tiempos de amasado para alveolado abierto.")}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div><p className={lbl}><Wheat className="w-3.5 h-3.5" /> {L("Farina totale (g)", "Mehl gesamt (g)", "Total flour (g)", "Harina total (g)")}</p><input data-testid="calcmetodo-flour" type="number" value={flour} onChange={(e) => setFlour(e.target.value)} className={inp} /></div>
        <div><p className={lbl}><Droplets className="w-3.5 h-3.5" /> {L("Idratazione (%)", "Hydratation (%)", "Hydration (%)", "Hidratación (%)")}</p><input data-testid="calc-hyd" type="number" value={hyd} onChange={(e) => setHyd(Number(e.target.value))} className={inp} /></div>
        <div><p className={lbl}>{L("Sale (%)", "Salz (%)", "Salt (%)", "Sal (%)")}</p><input data-testid="calc-salt" type="number" step="0.1" value={salt} onChange={(e) => setSalt(Number(e.target.value))} className={inp} /></div>
        <div><p className={lbl}><FlaskConical className="w-3.5 h-3.5" /> {L("Prefermento (% farina)", "Vorteig (% Mehl)", "Preferment (% flour)", "Prefermento (% harina)")}</p><input data-testid="calc-prefpct" type="number" value={prefPct} onChange={(e) => setPrefPct(Number(e.target.value))} className={inp} /></div>
      </div>
      <div className="mb-4">
        <p className={lbl}>{L("Tipo di prefermento", "Vorteig-Art", "Preferment type", "Tipo de prefermento")}</p>
        <select data-testid="calc-preftype" value={prefType} onChange={(e) => setPrefType(e.target.value)} className={inp}>
          {Object.entries(PREF).map(([k, v]) => <option key={k} value={k}>{v[lang] || v.it}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
        <div><p className={lbl}><Thermometer className="w-3.5 h-3.5" /> T° {L("ambiente", "Raum", "room", "ambiente")}</p><input data-testid="calc-troom" type="number" value={tRoom} onChange={(e) => setTRoom(Number(e.target.value))} className={inp} /></div>
        <div><p className={lbl}>T° {L("farina", "Mehl", "flour", "harina")}</p><input data-testid="calc-tflour" type="number" value={tFlour} onChange={(e) => setTFlour(Number(e.target.value))} className={inp} /></div>
        <div><p className={lbl}>W {L("farina", "Mehl", "flour", "harina")}</p><input data-testid="calc-w" type="number" value={wStrength} onChange={(e) => setWStrength(Number(e.target.value))} className={inp} /></div>
      </div>

      {/* Risultati */}
      <div data-testid="calc-results" className="rounded-3xl bg-[#121212] dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] overflow-hidden shadow-md">
        <div className="bg-[#ff6b00] text-[#121212] px-5 py-3"><p className="font-display text-lg font-bold">{L("Ricetta calcolata", "Berechnetes Rezept", "Calculated recipe", "Receta calculada")}</p></div>
        <div className="divide-y divide-[#2e2e2e] dark:divide-[#2e2e2e]">
          {[
            [L("Acqua totale", "Wasser gesamt", "Total water", "Agua total"), `${num(r.totalWater)} g`],
            [L("Sale", "Salz", "Salt", "Sal"), `${num(r.saltG)} g`],
            [L("Farina nel prefermento", "Mehl im Vorteig", "Flour in preferment", "Harina en prefermento"), `${num(r.prefFlour)} g`],
            [L("Acqua nel prefermento", "Wasser im Vorteig", "Water in preferment", "Agua en prefermento"), `${num(r.prefWater)} g`],
            [L("Prefermento totale", "Vorteig gesamt", "Total preferment", "Prefermento total"), `${num(r.prefTotal)} g`],
            [L("Farina nell'impasto finale", "Mehl im Hauptteig", "Flour in final dough", "Harina en masa final"), `${num(r.flourInDough)} g`],
            [L("Acqua nell'impasto finale", "Wasser im Hauptteig", "Water in final dough", "Agua en masa final"), `${num(r.waterInDough)} g`],
          ].map(([k, v], i) => (
            <div key={i} data-testid={`calc-row-${i}`} className="flex items-center justify-between px-5 py-2.5">
              <span className="text-[13px] text-[#ff6b00] dark:text-[#AEB8BF]">{k}</span>
              <span className="font-mono-data font-bold text-[#ff6b00] dark:text-[#e4eff8]">{v}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-px bg-[#2e2e2e] dark:bg-[#2e2e2e]">
          <div className="bg-[#ffffff] dark:bg-[#2A2118] p-4 text-center">
            <p className="text-[11px] font-semibold text-[#ff6b00] flex items-center justify-center gap-1"><Thermometer className="w-3.5 h-3.5" /> {L("Temperatura acqua", "Wassertemperatur", "Water temperature", "Temp. agua")}</p>
            <p data-testid="calc-water-temp" className="font-display text-2xl font-bold text-[#ff6b00] mt-1">{r.waterTemp}°C</p>
          </div>
          <div className="bg-[#ffffff] dark:bg-[#2A2118] p-4 text-center">
            <p className="text-[11px] font-semibold text-[#ff6b00] flex items-center justify-center gap-1"><Clock className="w-3.5 h-3.5" /> {L("Impasto (spirale)", "Kneten (Spirale)", "Mixing (spiral)", "Amasado (espiral)")}</p>
            <p data-testid="calc-mix-min" className="font-display text-2xl font-bold text-[#ff6b00] mt-1">{r.mixMin} min</p>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl bg-[#1e1e1e] border border-[#2e2e2e] p-4">
        <p className="font-display text-base font-bold text-[#ff6b00] flex items-center gap-2 mb-2"><Lightbulb className="w-4.5 h-4.5" /> {L("Alta alveolatura — consigli", "Offene Porung — Tipps", "Open crumb — tips", "Alveolado abierto — consejos")}</p>
        <ul className="text-[13px] text-[#ff6b00] leading-relaxed space-y-1.5 list-disc pl-4">
          <li>{L("Bassinage: aggiungi l'ultima acqua a filo solo dopo l'incordatura completa (velo).", "Bassinage: das letzte Wasser erst nach voller Glutenentwicklung zugeben.", "Bassinage: add the last water only after full gluten development.", "Bassinage: añade el agua final solo tras el desarrollo completo del gluten.")}</li>
          <li>{L("Farine forti (W≥300) per idratazioni oltre il 75%.", "Starke Mehle (W≥300) für Hydratation über 75%.", "Strong flours (W≥300) for hydration above 75%.", "Harinas fuertes (W≥300) para hidratación superior al 75%.")}</li>
          <li>{L("Pieghe di rinforzo ogni 30 min nella prima ora di puntata.", "Dehnen & Falten alle 30 min in der ersten Stockgare-Stunde.", "Stretch & folds every 30 min in the first hour of bulk.", "Pliegues cada 30 min en la primera hora de fermentación.")}</li>
          <li>{L("Temperatura impasto finale ~24–26°C: usa l'acqua alla temperatura calcolata.", "Teigtemperatur ~24–26°C: Wasser mit berechneter Temperatur nutzen.", "Final dough temp ~24–26°C: use water at the calculated temperature.", "Temp. masa final ~24–26°C: usa el agua a la temperatura calculada.")}</li>
        </ul>
      </div>
    </div>
  );
}
