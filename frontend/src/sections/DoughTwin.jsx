import { useMemo, useState, useEffect, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { FlaskConical, Droplets, Wheat, Thermometer, Clock, TrendingUp, Grid3x3, Sparkles, ChefHat, Bell, BellOff } from "lucide-react";
import { recipesApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { toast } from "sonner";
import { mkTri } from "@/i18n/triMaps";

// Punto 22 — Digital Twin dell'Impasto: simula forza, idratazione, temperatura e
// lievito PRIMA di impastare e prevede curva di lievitazione e alveolatura attesa.

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function Slider({ label, testid, Icon, value, set, min, max, step = 1, unit }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-semibold uppercase text-[#7E8A93] flex items-center gap-1"><Icon className="w-3.5 h-3.5 text-[#8C4A27]" />{label}</span>
        <span className="font-mono-data text-sm font-bold text-[#2B303B] dark:text-[#e4eff8]">{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => set(Number(e.target.value))}
        className="w-full accent-[#8C4A27]" data-testid={testid} />
    </div>
  );
}

export default function DoughTwin() {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);

  const [hyd, setHyd] = useState(65);      // idratazione %
  const [w, setW] = useState(260);         // forza farina W
  const [temp, setTemp] = useState(24);    // temperatura impasto °C
  const [yeastType, setYeastType] = useState("ldb"); // ldb | madre
  const [yeast, setYeast] = useState(1);   // % lievito
  const [salt, setSalt] = useState(2);     // % sale
  const [recipes, setRecipes] = useState([]);
  const [recipeId, setRecipeId] = useState("");
  const nowHM = () => { const d = new Date(); return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; };
  const [startTime, setStartTime] = useState(nowHM());

  useEffect(() => {
    (async () => {
      try {
        const [mk, ps] = await Promise.all([recipesApi.list("mikilab"), recipesApi.list("personal").catch(() => [])]);
        const byName = (a, b) => (a.name || "").localeCompare(b.name || "");
        const own = (ps || []).map((r) => ({ ...r, _own: true })).sort(byName);
        setRecipes([...own, ...(mk || []).sort(byName)]);
      } catch { /* */ }
    })();
  }, []);

  const applyRecipe = (id) => {
    setRecipeId(id);
    const r = recipes.find((x) => x.id === id);
    if (!r) return;
    const flour = Number(r.flour_grams) || 0;
    if (flour > 0) {
      if (r.water_grams) setHyd(clamp(Math.round((Number(r.water_grams) / flour) * 100), 50, 100));
      if (r.salt_grams) setSalt(clamp(Math.round((Number(r.salt_grams) / flour) * 1000) / 10, 0, 4));
      if (Number(r.sourdough_grams) > 0) {
        setYeastType("madre");
        setYeast(clamp(Math.round((Number(r.sourdough_grams) / flour) * 100), 5, 40));
      }
    }
  };

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

  const peakClock = useMemo(() => {
    if (!startTime || !/^\d{1,2}:\d{2}$/.test(startTime)) return null;
    const [h, m] = startTime.split(":").map(Number);
    const total = h * 60 + m + Math.round(sim.tPeak * 60);
    const hh = ((Math.floor(total / 60) % 24) + 24) % 24;
    const mm = ((total % 60) + 60) % 60;
    return { hm: `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`, nextDay: total >= 24 * 60 };
  }, [startTime, sim.tPeak]);

  // Sveglia al picco del volume (Notifica + vibrazione + beep, mentre l'app è aperta).
  const [alarmAt, setAlarmAt] = useState(null);
  const alarmTimer = useRef(null);
  useEffect(() => () => { if (alarmTimer.current) clearTimeout(alarmTimer.current); }, []);

  const beep = () => {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      const ctx = new Ctx();
      [0, 0.7].forEach((delay) => {
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination); o.type = "sine"; o.frequency.value = 880;
        const t0 = ctx.currentTime + delay;
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(0.35, t0 + 0.05);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.5);
        o.start(t0); o.stop(t0 + 0.55);
      });
    } catch { /* audio non disponibile */ }
  };

  const schedulePeakAlarm = async () => {
    const delayMs = Math.max(1000, Math.round(sim.tPeak * 3600 * 1000));
    const target = new Date(Date.now() + delayMs);
    const hm = `${String(target.getHours()).padStart(2, "0")}:${String(target.getMinutes()).padStart(2, "0")}`;
    const rName = recipes.find((r) => r.id === recipeId)?.name;
    const body = tri(
      `È il momento del picco del volume!${rName ? ` «${rName}»` : ""} Inforna o metti in frigo.`,
      `Zeit für den Volumen-Peak!${rName ? ` „${rName}“` : ""} Backen oder kühlen.`,
      `Volume peak time!${rName ? ` "${rName}"` : ""} Bake or refrigerate.`);
    try { if ("Notification" in window && Notification.permission === "default") await Notification.requestPermission(); } catch { /* */ }
    if (alarmTimer.current) clearTimeout(alarmTimer.current);
    alarmTimer.current = setTimeout(() => {
      try { if ("Notification" in window && Notification.permission === "granted") new Notification("MikiLab · Picco impasto 🍞", { body }); } catch { /* */ }
      try { if (navigator.vibrate) navigator.vibrate([300, 150, 300, 150, 500]); } catch { /* */ }
      beep();
      toast.success(body, { duration: 15000 });
      setAlarmAt(null);
    }, delayMs);
    setAlarmAt(hm);
    toast.success(tri(
      `⏰ Sveglia impostata: ti avviso al picco verso le ${hm}. Tieni l'app aperta.`,
      `⏰ Wecker gestellt: Ich melde mich zum Peak gegen ${hm}. App geöffnet lassen.`,
      `⏰ Alarm set: I'll alert you at the peak around ${hm}. Keep the app open.`));
  };

  const cancelAlarm = () => {
    if (alarmTimer.current) clearTimeout(alarmTimer.current);
    alarmTimer.current = null; setAlarmAt(null);
    toast(tri("Sveglia annullata", "Wecker abgebrochen", "Alarm cancelled"));
  };

  const advice = [];
  if (sim.hydDelta > 8) advice.push(tri("Idratazione alta per questa farina: impasto molle, usa pieghe in ciotola e lievitazione controllata.", "Hohe Hydratation für dieses Mehl: weicher Teig, Dehnen & Falten, kontrollierte Gare.", "High hydration for this flour: slack dough, use folds and controlled proof."));
  else if (sim.hydDelta < -10) advice.push(tri("Impasto piuttosto asciutto: crosta più spessa e mollica compatta. Puoi alzare l'acqua.", "Eher trockener Teig: dickere Kruste, kompakte Krume. Wasser erhöhen möglich.", "Rather dry dough: thicker crust, tight crumb. You can add water."));
  else advice.push(tri("Bilanciamento acqua/forza corretto per una buona tenuta.", "Wasser/Stärke gut ausbalanciert für gute Stabilität.", "Water/strength well balanced for good stability."));
  if (temp >= 28) advice.push(tri("Fa caldo: rischio di sovra-maturazione, controlla prima e valuta il frigo.", "Warm: Übergare-Risiko, früher prüfen und Kühlung erwägen.", "Warm: over-proof risk, check earlier and consider the fridge."));
  if (sim.tPeak > 8) advice.push(tri("Lievitazione lunga: ideale per aroma e digeribilità (metodo indiretto).", "Lange Gare: ideal für Aroma und Bekömmlichkeit (indirekt).", "Long proof: great for aroma and digestibility (indirect method)."));

  return (
    <div className="pb-40">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#B45309] to-[#6E371C] flex items-center justify-center"><FlaskConical className="w-6 h-6 text-white" /></div>
        <div>
          <h1 className="font-display text-2xl font-bold text-[#2B303B] dark:text-[#e4eff8]">{tri("Digital Twin Impasto", "Digitaler Teig-Zwilling", "Dough Digital Twin")}</h1>
          <p className="text-sm text-[#7E8A93]">{tri("Simula il risultato prima di impastare", "Simuliere das Ergebnis vor dem Kneten", "Simulate the result before mixing")}</p>
        </div>
      </div>

      {/* Ricetta di partenza + orario d'inizio */}
      <div className="bg-white dark:bg-[#232A31] border border-[#E6D8C3] dark:border-[#38424B] rounded-2xl p-4 mb-4 space-y-3">
        <div>
          <span className="text-[11px] font-semibold uppercase text-[#7E8A93] flex items-center gap-1 mb-1"><ChefHat className="w-3.5 h-3.5 text-[#8C4A27]" />{tri("Parti da una ricetta", "Von einem Rezept starten", "Start from a recipe")}</span>
          <select data-testid="twin-recipe" value={recipeId} onChange={(e) => applyRecipe(e.target.value)}
            className="w-full bg-[#e4eff8] dark:bg-[#2A323A] border border-[#E6D8C3] dark:border-[#38424B] rounded-xl p-2.5 text-sm outline-none focus:border-[#8C4A27]">
            <option value="">{tri("Manuale (usa i cursori)", "Manuell (Regler nutzen)", "Manual (use sliders)")}</option>
            {recipes.some((r) => r._own) && (
              <optgroup label={tri("Le mie ricette", "Meine Rezepte", "My recipes")}>
                {recipes.filter((r) => r._own).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </optgroup>
            )}
            <optgroup label={tri("Ricette MikiLab", "MikiLab-Rezepte", "MikiLab recipes")}>
              {recipes.filter((r) => !r._own).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </optgroup>
          </select>
        </div>
        <div>
          <span className="text-[11px] font-semibold uppercase text-[#7E8A93] flex items-center gap-1 mb-1"><Clock className="w-3.5 h-3.5 text-[#8C4A27]" />{tri("Ora d'inizio impasto", "Startzeit Teig", "Dough start time")}</span>
          <input data-testid="twin-start-time" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}
            className="w-full bg-[#e4eff8] dark:bg-[#2A323A] border border-[#E6D8C3] dark:border-[#38424B] rounded-xl p-2.5 text-sm outline-none focus:border-[#8C4A27] font-mono-data" />
        </div>
      </div>

      {/* Avviso PICCO del volume */}
      <div data-testid="twin-peak-alert" className="rounded-2xl bg-gradient-to-br from-[#E4572E] to-[#2e3d4c] text-white p-4 mb-4 shadow-md">
        <div className="flex items-center gap-2 mb-1"><Bell className="w-5 h-5" /><span className="text-[11px] font-bold uppercase tracking-wide text-white/90">{tri("Avviso picco del volume", "Volumen-Peak Hinweis", "Volume peak alert")}</span></div>
        <p className="font-display text-xl font-bold leading-tight">
          {tri("Picco tra", "Peak in", "Peak in")} {fmtH(sim.tPeak)}
          {peakClock && <> · {tri("verso le", "gegen", "around")} {peakClock.hm}{peakClock.nextDay ? tri(" (domani)", " (morgen)", " (next day)") : ""}</>}
        </p>
        <p className="text-white/85 text-xs mt-1 leading-snug">
          {tri("È il momento migliore per infornare o mettere in frigo. Dopo il picco l'impasto inizia a cedere.",
            "Der beste Zeitpunkt zum Backen oder Kühlen. Nach dem Peak fällt der Teig ab.",
            "The best moment to bake or refrigerate. After the peak the dough starts to collapse.")}
        </p>
        {alarmAt ? (
          <button data-testid="twin-alarm-cancel" onClick={cancelAlarm}
            className="mt-3 w-full flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 border border-white/40 text-white font-semibold py-2.5 rounded-xl active:scale-97 transition-all">
            <BellOff className="w-4 h-4" /> {tri(`Sveglia attiva alle ${alarmAt} · Annulla`, `Wecker aktiv um ${alarmAt} · Abbrechen`, `Alarm set for ${alarmAt} · Cancel`)}
          </button>
        ) : (
          <button data-testid="twin-alarm-set" onClick={schedulePeakAlarm}
            className="mt-3 w-full flex items-center justify-center gap-2 bg-white text-[#2e3d4c] font-bold py-2.5 rounded-xl active:scale-97 transition-all">
            <Bell className="w-4 h-4" /> {tri("Avvisami al picco", "Beim Peak wecken", "Alert me at the peak")}
          </button>
        )}
      </div>

      {/* Parametri */}
      <div className="bg-[#B45309]/10 border border-[#B45309]/30 rounded-2xl p-4 mb-4 space-y-3">
        <Slider label={tri("Idratazione", "Hydratation", "Hydration")} testid="twin-slider-hyd" Icon={Droplets} value={hyd} set={setHyd} min={50} max={100} unit="%" />
        <Slider label={tri("Forza W", "Stärke W", "Strength W")} testid="twin-slider-w" Icon={Wheat} value={w} set={setW} min={140} max={400} step={10} unit="" />
        <Slider label={tri("Temperatura", "Temperatur", "Temperature")} testid="twin-slider-temp" Icon={Thermometer} value={temp} set={setTemp} min={16} max={34} unit="°C" />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-[11px] font-semibold uppercase text-[#7E8A93] block mb-1">{tri("Lievito", "Trieb", "Leaven")}</span>
            <div className="flex gap-1.5">
              {[["ldb", tri("Birra", "Hefe", "Yeast")], ["madre", tri("Madre", "Sauer", "Sourdough")]].map(([id, lb]) => (
                <button key={id} data-testid={`twin-type-${id}`} onClick={() => { setYeastType(id); setYeast(id === "ldb" ? 1 : 20); }}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold border ${yeastType === id ? "bg-[#8C4A27] text-white border-[#8C4A27]" : "bg-white dark:bg-[#232A31] text-[#3F4A54] dark:text-[#AEB8BF] border-[#E6D8C3] dark:border-[#38424B]"}`}>{lb}</button>
              ))}
            </div>
          </div>
          <Slider label={tri("Dose", "Dosis", "Dose")} testid="twin-slider-dose" Icon={Sparkles} value={yeast} set={setYeast} min={yeastType === "ldb" ? 0.2 : 5} max={yeastType === "ldb" ? 5 : 40} step={yeastType === "ldb" ? 0.1 : 1} unit="%" />
        </div>
        <Slider label={tri("Sale", "Salz", "Salt")} testid="twin-slider-salt" Icon={Sparkles} value={salt} set={setSalt} min={0} max={4} step={0.1} unit="%" />
      </div>

      {/* Risultati sintetici */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-2xl bg-white dark:bg-[#232A31] border border-[#E6D8C3] dark:border-[#38424B] p-4">
          <p className="text-[11px] font-bold uppercase text-[#7E8A93] flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{tri("Lievitazione", "Gärzeit", "Proof time")}</p>
          <p data-testid="twin-time" className="font-mono-data text-2xl font-bold text-[#2B303B] dark:text-[#e4eff8] mt-1">{fmtH(sim.tPeak)}</p>
          <p className="text-[11px] text-[#7E8A93]">{tri("al picco", "bis zum Peak", "to peak")}</p>
        </div>
        <div className="rounded-2xl bg-white dark:bg-[#232A31] border border-[#E6D8C3] dark:border-[#38424B] p-4">
          <p className="text-[11px] font-bold uppercase text-[#7E8A93] flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" />{tri("Volume picco", "Peak-Volumen", "Peak volume")}</p>
          <p data-testid="twin-volume" className="font-mono-data text-2xl font-bold text-[#B45309] mt-1">{sim.vMax.toFixed(1)}×</p>
          <p className="text-[11px] text-[#7E8A93]">{tri("rispetto all'inizio", "vs. Start", "vs start")}</p>
        </div>
        <div className="rounded-2xl bg-white dark:bg-[#232A31] border border-[#E6D8C3] dark:border-[#38424B] p-4">
          <p className="text-[11px] font-bold uppercase text-[#7E8A93] flex items-center gap-1"><Droplets className="w-3.5 h-3.5" />{tri("Idratazione ideale", "Ideale Hydratation", "Ideal hydration")}</p>
          <p data-testid="twin-rechyd" className="font-mono-data text-2xl font-bold text-[#3F7CAC] mt-1">~{sim.recHyd}%</p>
          <p className="text-[11px] text-[#7E8A93]">{sim.hydDelta > 8 ? tri("sei sopra", "du bist drüber", "you're above") : sim.hydDelta < -10 ? tri("sei sotto", "du bist drunter", "you're below") : tri("in equilibrio", "im Gleichgewicht", "balanced")}</p>
        </div>
        <div className="rounded-2xl bg-white dark:bg-[#232A31] border border-[#E6D8C3] dark:border-[#38424B] p-4">
          <p className="text-[11px] font-bold uppercase text-[#7E8A93] flex items-center gap-1"><Grid3x3 className="w-3.5 h-3.5" />{tri("Alveolatura", "Porung", "Crumb")}</p>
          <p data-testid="twin-alveo" className="font-display text-base font-bold text-[#2B303B] dark:text-[#e4eff8] mt-1 leading-tight">{alveoLabel}</p>
          <p className="text-[11px] text-[#7E8A93]">{Math.round(sim.alveo)}/100</p>
        </div>
      </div>

      {/* Curva di lievitazione */}
      <div className="rounded-2xl bg-white dark:bg-[#232A31] border border-[#E6D8C3] dark:border-[#38424B] p-3 mb-4" data-testid="twin-chart">
        <p className="text-[11px] font-bold uppercase text-[#7E8A93] mb-2 px-1">{tri("Curva di lievitazione (volume nel tempo)", "Gärkurve (Volumen über Zeit)", "Proofing curve (volume over time)")}</p>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={sim.pts} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <XAxis dataKey="t" tick={{ fontSize: 10, fill: "#7E8A93" }} unit="h" />
            <YAxis tick={{ fontSize: 10, fill: "#7E8A93" }} domain={[1, "auto"]} />
            <Tooltip formatter={(v) => [`${v}×`, tri("Volume", "Volumen", "Volume")]} labelFormatter={(l) => `${l} h`} />
            <ReferenceLine x={Math.round(sim.tPeak * 10) / 10} stroke="#E4572E" strokeDasharray="4 3" label={{ value: tri("picco", "Peak", "peak"), fontSize: 10, fill: "#E4572E", position: "top" }} />
            <Line type="monotone" dataKey="v" stroke="#8C4A27" strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Anteprima alveolatura */}
      <div className="rounded-2xl overflow-hidden border border-[#E6D8C3] dark:border-[#38424B] mb-4" data-testid="twin-crumb">
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
          <div key={i} className="flex items-start gap-2 bg-[#B45309]/10 border border-[#B45309]/25 rounded-xl p-3">
            <Sparkles className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5" />
            <p className="text-sm text-[#3F4A54] dark:text-[#AEB8BF] leading-snug">{a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
