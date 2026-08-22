import { useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { FlaskConical, Droplets, Wheat, Thermometer, Clock, TrendingUp, Grid3x3, Sparkles } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";

// Punto 22 — Digital Twin dell'Impasto: simula forza, idratazione, temperatura e
// lievito PRIMA di impastare e prevede curva di lievitazione e alveolatura attesa.

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function Slider({ label, testid, Icon, value, set, min, max, step = 1, unit }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-semibold uppercase text-[#7E8A93] flex items-center gap-1"><Icon className="w-3.5 h-3.5 text-[#5E8B7E]" />{label}</span>
        <span className="font-mono-data text-sm font-bold text-[#2B303B] dark:text-[#EAF0EC]">{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => set(Number(e.target.value))}
        className="w-full accent-[#5E8B7E]" data-testid={testid} />
    </div>
  );
}

export default function DoughTwin() {
  const { lang } = useLang();
  const tri = (i, d, e) => (lang === "de" ? d : lang === "en" ? e : i);

  const [hyd, setHyd] = useState(65);      // idratazione %
  const [w, setW] = useState(260);         // forza farina W
  const [temp, setTemp] = useState(24);    // temperatura impasto °C
  const [yeastType, setYeastType] = useState("ldb"); // ldb | madre
  const [yeast, setYeast] = useState(1);   // % lievito
  const [salt, setSalt] = useState(2);     // % sale

  const sim = useMemo(() => {
    const tempFactor = Math.pow(2, (temp - 24) / 9); // la velocità ~raddoppia ogni 9°C
    const saltBrake = 1 - clamp((salt - 2) * 0.06, -0.1, 0.25); // il sale rallenta
    let tPeak; // ore per raggiungere il picco (puntata + appretto)
    if (yeastType === "ldb") {
      tPeak = (4 / (clamp(yeast, 0.1, 5) * tempFactor)) / saltBrake;
    } else {
      tPeak = (5 / ((clamp(yeast, 5, 40) / 20) * tempFactor)) / saltBrake;
    }
    tPeak = clamp(tPeak, 0.4, 24);

    const vMax = clamp(2.2 + (w - 220) / 300 + (yeastType === "madre" ? 0.15 : 0), 1.9, 3.3);
    const tMid = tPeak * 0.62;
    const k = 5 / tPeak;
    const tEnd = tPeak * 1.7;
    const pts = [];
    for (let i = 0; i <= 24; i++) {
      const t = (tEnd * i) / 24;
      let v = 1 + (vMax - 1) / (1 + Math.exp(-k * (t - tMid)));
      if (t > tPeak) v -= (vMax - 1) * 0.18 * ((t - tPeak) / (tEnd - tPeak)); // collasso da sovra-maturazione
      pts.push({ t: Math.round(t * 10) / 10, v: Math.round(v * 100) / 100 });
    }

    const recHyd = Math.round(55 + (w - 180) / 6);
    const hydDelta = hyd - recHyd;
    const alveo = clamp((hyd - 55) * 1.8 + (w - 200) * 0.12 + (tPeak - 2) * 4, 5, 98);

    return { tPeak, vMax, pts, recHyd, hydDelta, alveo };
  }, [hyd, w, temp, yeastType, yeast, salt]);

  // anteprima alveolatura: bolle deterministiche in base allo score
  const bubbles = useMemo(() => {
    const score = sim.alveo;
    const count = Math.round(6 + (score / 100) * 20);
    const arr = [];
    let seed = Math.round(score * 97) + w + hyd;
    const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    for (let i = 0; i < count; i++) {
      const size = 6 + rnd() * (6 + (score / 100) * 34);
      arr.push({ x: rnd() * 100, y: rnd() * 100, s: size });
    }
    return arr;
  }, [sim.alveo, w, hyd]);

  const alveoLabel = sim.alveo < 32 ? tri("Fitta e regolare", "Fein & regelmäßig", "Tight & even")
    : sim.alveo < 62 ? tri("Media", "Mittel", "Medium")
    : tri("Aperta e irregolare", "Offen & unregelmäßig", "Open & irregular");

  const fmtH = (h) => { const H = Math.floor(h); const M = Math.round((h - H) * 60); return `${H}h ${String(M).padStart(2, "0")}m`; };

  const advice = [];
  if (sim.hydDelta > 8) advice.push(tri("Idratazione alta per questa farina: impasto molle, usa pieghe in ciotola e lievitazione controllata.", "Hohe Hydratation für dieses Mehl: weicher Teig, Dehnen & Falten, kontrollierte Gare.", "High hydration for this flour: slack dough, use folds and controlled proof."));
  else if (sim.hydDelta < -10) advice.push(tri("Impasto piuttosto asciutto: crosta più spessa e mollica compatta. Puoi alzare l'acqua.", "Eher trockener Teig: dickere Kruste, kompakte Krume. Wasser erhöhen möglich.", "Rather dry dough: thicker crust, tight crumb. You can add water."));
  else advice.push(tri("Bilanciamento acqua/forza corretto per una buona tenuta.", "Wasser/Stärke gut ausbalanciert für gute Stabilität.", "Water/strength well balanced for good stability."));
  if (temp >= 28) advice.push(tri("Fa caldo: rischio di sovra-maturazione, controlla prima e valuta il frigo.", "Warm: Übergare-Risiko, früher prüfen und Kühlung erwägen.", "Warm: over-proof risk, check earlier and consider the fridge."));
  if (sim.tPeak > 8) advice.push(tri("Lievitazione lunga: ideale per aroma e digeribilità (metodo indiretto).", "Lange Gare: ideal für Aroma und Bekömmlichkeit (indirekt).", "Long proof: great for aroma and digestibility (indirect method)."));

  return (
    <div className="pb-40">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#6B8E62] to-[#33564E] flex items-center justify-center"><FlaskConical className="w-6 h-6 text-white" /></div>
        <div>
          <h1 className="font-display text-2xl font-bold text-[#2B303B] dark:text-[#EAF0EC]">{tri("Digital Twin Impasto", "Digitaler Teig-Zwilling", "Dough Digital Twin")}</h1>
          <p className="text-sm text-[#7E8A93]">{tri("Simula il risultato prima di impastare", "Simuliere das Ergebnis vor dem Kneten", "Simulate the result before mixing")}</p>
        </div>
      </div>

      {/* Parametri */}
      <div className="bg-[#6E8CA0]/10 border border-[#6E8CA0]/30 rounded-2xl p-4 mb-4 space-y-3">
        <Slider label={tri("Idratazione", "Hydratation", "Hydration")} testid="twin-slider-hyd" Icon={Droplets} value={hyd} set={setHyd} min={50} max={100} unit="%" />
        <Slider label={tri("Forza W", "Stärke W", "Strength W")} testid="twin-slider-w" Icon={Wheat} value={w} set={setW} min={140} max={400} step={10} unit="" />
        <Slider label={tri("Temperatura", "Temperatur", "Temperature")} testid="twin-slider-temp" Icon={Thermometer} value={temp} set={setTemp} min={16} max={34} unit="°C" />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-[11px] font-semibold uppercase text-[#7E8A93] block mb-1">{tri("Lievito", "Trieb", "Leaven")}</span>
            <div className="flex gap-1.5">
              {[["ldb", tri("Birra", "Hefe", "Yeast")], ["madre", tri("Madre", "Sauer", "Sourdough")]].map(([id, lb]) => (
                <button key={id} data-testid={`twin-type-${id}`} onClick={() => { setYeastType(id); setYeast(id === "ldb" ? 1 : 20); }}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold border ${yeastType === id ? "bg-[#5E8B7E] text-white border-[#5E8B7E]" : "bg-white dark:bg-[#232A31] text-[#3F4A54] dark:text-[#AEB8BF] border-[#D7E1DB] dark:border-[#38424B]"}`}>{lb}</button>
              ))}
            </div>
          </div>
          <Slider label={tri("Dose", "Dosis", "Dose")} testid="twin-slider-dose" Icon={Sparkles} value={yeast} set={setYeast} min={yeastType === "ldb" ? 0.2 : 5} max={yeastType === "ldb" ? 5 : 40} step={yeastType === "ldb" ? 0.1 : 1} unit="%" />
        </div>
        <Slider label={tri("Sale", "Salz", "Salt")} testid="twin-slider-salt" Icon={Sparkles} value={salt} set={setSalt} min={0} max={4} step={0.1} unit="%" />
      </div>

      {/* Risultati sintetici */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-2xl bg-white dark:bg-[#232A31] border border-[#D7E1DB] dark:border-[#38424B] p-4">
          <p className="text-[11px] font-bold uppercase text-[#7E8A93] flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{tri("Lievitazione", "Gärzeit", "Proof time")}</p>
          <p data-testid="twin-time" className="font-mono-data text-2xl font-bold text-[#2B303B] dark:text-[#EAF0EC] mt-1">{fmtH(sim.tPeak)}</p>
          <p className="text-[11px] text-[#7E8A93]">{tri("al picco", "bis zum Peak", "to peak")}</p>
        </div>
        <div className="rounded-2xl bg-white dark:bg-[#232A31] border border-[#D7E1DB] dark:border-[#38424B] p-4">
          <p className="text-[11px] font-bold uppercase text-[#7E8A93] flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" />{tri("Volume picco", "Peak-Volumen", "Peak volume")}</p>
          <p data-testid="twin-volume" className="font-mono-data text-2xl font-bold text-[#6B8E62] mt-1">{sim.vMax.toFixed(1)}×</p>
          <p className="text-[11px] text-[#7E8A93]">{tri("rispetto all'inizio", "vs. Start", "vs start")}</p>
        </div>
        <div className="rounded-2xl bg-white dark:bg-[#232A31] border border-[#D7E1DB] dark:border-[#38424B] p-4">
          <p className="text-[11px] font-bold uppercase text-[#7E8A93] flex items-center gap-1"><Droplets className="w-3.5 h-3.5" />{tri("Idratazione ideale", "Ideale Hydratation", "Ideal hydration")}</p>
          <p data-testid="twin-rechyd" className="font-mono-data text-2xl font-bold text-[#3F7CAC] mt-1">~{sim.recHyd}%</p>
          <p className="text-[11px] text-[#7E8A93]">{sim.hydDelta > 8 ? tri("sei sopra", "du bist drüber", "you're above") : sim.hydDelta < -10 ? tri("sei sotto", "du bist drunter", "you're below") : tri("in equilibrio", "im Gleichgewicht", "balanced")}</p>
        </div>
        <div className="rounded-2xl bg-white dark:bg-[#232A31] border border-[#D7E1DB] dark:border-[#38424B] p-4">
          <p className="text-[11px] font-bold uppercase text-[#7E8A93] flex items-center gap-1"><Grid3x3 className="w-3.5 h-3.5" />{tri("Alveolatura", "Porung", "Crumb")}</p>
          <p data-testid="twin-alveo" className="font-display text-base font-bold text-[#2B303B] dark:text-[#EAF0EC] mt-1 leading-tight">{alveoLabel}</p>
          <p className="text-[11px] text-[#7E8A93]">{Math.round(sim.alveo)}/100</p>
        </div>
      </div>

      {/* Curva di lievitazione */}
      <div className="rounded-2xl bg-white dark:bg-[#232A31] border border-[#D7E1DB] dark:border-[#38424B] p-3 mb-4" data-testid="twin-chart">
        <p className="text-[11px] font-bold uppercase text-[#7E8A93] mb-2 px-1">{tri("Curva di lievitazione (volume nel tempo)", "Gärkurve (Volumen über Zeit)", "Proofing curve (volume over time)")}</p>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={sim.pts} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <XAxis dataKey="t" tick={{ fontSize: 10, fill: "#7E8A93" }} unit="h" />
            <YAxis tick={{ fontSize: 10, fill: "#7E8A93" }} domain={[1, "auto"]} />
            <Tooltip formatter={(v) => [`${v}×`, tri("Volume", "Volumen", "Volume")]} labelFormatter={(l) => `${l} h`} />
            <ReferenceLine x={Math.round(sim.tPeak * 10) / 10} stroke="#E4572E" strokeDasharray="4 3" label={{ value: tri("picco", "Peak", "peak"), fontSize: 10, fill: "#E4572E", position: "top" }} />
            <Line type="monotone" dataKey="v" stroke="#5E8B7E" strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Anteprima alveolatura */}
      <div className="rounded-2xl overflow-hidden border border-[#D7E1DB] dark:border-[#38424B] mb-4" data-testid="twin-crumb">
        <div className="relative h-28 bg-[#E8DCC2]">
          {bubbles.map((b, i) => (
            <span key={i} className="absolute rounded-full bg-[#3a2f22]/85"
              style={{ left: `${b.x}%`, top: `${b.y}%`, width: b.s, height: b.s, transform: "translate(-50%,-50%)" }} />
          ))}
        </div>
        <p className="text-center text-[11px] text-[#7E8A93] py-1.5">{tri("Anteprima mollica stimata", "Vorschau geschätzte Krume", "Estimated crumb preview")}</p>
      </div>

      {/* Consigli */}
      <div className="space-y-2" data-testid="twin-advice">
        {advice.map((a, i) => (
          <div key={i} className="flex items-start gap-2 bg-[#6B8E62]/10 border border-[#6B8E62]/25 rounded-xl p-3">
            <Sparkles className="w-4 h-4 text-[#6B8E62] shrink-0 mt-0.5" />
            <p className="text-sm text-[#3F4A54] dark:text-[#AEB8BF] leading-snug">{a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
