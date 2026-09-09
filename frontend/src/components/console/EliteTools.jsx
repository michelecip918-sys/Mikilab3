import { useState, useEffect } from "react";
import { foodCostApi, envApi, recipesApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { Calculator, Thermometer, CloudSun } from "lucide-react";

const Field = ({ label, value, onChange, unit }) => (
  <label className="flex flex-col gap-1">
    <span className="text-[10px] uppercase tracking-wider text-[#7d97ac]">{label}</span>
    <span className="flex items-center gap-1 bg-[#0C1019] border border-[#64748B]/30 rounded-lg px-2 py-1.5 focus-within:border-[#64748B]">
      <input type="number" value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-transparent text-sm text-white outline-none" />
      {unit && <span className="text-[10px] text-[#64748b]">{unit}</span>}
    </span>
  </label>
);

// Food Cost al grammo + Controllo ambientale predittivo (pannello elite del Capo).
export default function EliteTools() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  // Food cost
  const [fc, setFc] = useState({ flour_grams: 1000, water_grams: 700, salt_grams: 20, sourdough_grams: 200, yeast_grams: 5, pieces: 20, sell_price_piece: 1.5 });
  const [fcRes, setFcRes] = useState(null);
  const upd = (k) => (v) => setFc((s) => ({ ...s, [k]: v }));
  const runFc = async () => {
    const payload = Object.fromEntries(Object.entries(fc).map(([k, v]) => [k, k === "extras" ? v : Number(v) || 0]));
    try { setFcRes(await foodCostApi.compute(payload)); } catch (e) { /* */ }
  };
  // Ricetta → Food Cost 1-clic: carica ricette salvate e auto-compila i grammi.
  const [recipes, setRecipes] = useState([]);
  useEffect(() => { recipesApi.list("mikilab").then((r) => setRecipes(Array.isArray(r) ? r : (r.recipes || []))).catch(() => { /* */ }); }, []);
  const pickRecipe = async (id) => {
    const rec = recipes.find((x) => String(x.id) === String(id));
    if (!rec) return;
    const extras = (rec.extra_ingredients || []).map((e) => ({ name: e.name || e.key || "extra", grams: Number(e.grams || e.grammi || 0) }));
    const next = {
      flour_grams: Number(rec.flour_grams || 0),
      water_grams: Number(rec.water_grams || 0),
      salt_grams: Number(rec.salt_grams || 0),
      sourdough_grams: Number(rec.sourdough_grams || 0),
      yeast_grams: Number(rec.yeast_grams || fc.yeast_grams || 0),
      pieces: Number(rec.pieces || fc.pieces || 0),
      sell_price_piece: fc.sell_price_piece,
      extras,
    };
    setFc(next);
    try { setFcRes(await foodCostApi.compute(Object.fromEntries(Object.entries(next).map(([k, v]) => [k, k === "extras" ? v : Number(v) || 0])))); } catch (e) { /* */ }
  };
  // Environment
  const [env, setEnv] = useState({ base_proof_hours: 3, base_hydration_percent: 70, temp_c: 24, humidity_pct: 55 });
  const [envRes, setEnvRes] = useState(null);
  const updE = (k) => (v) => setEnv((s) => ({ ...s, [k]: v }));
  const runEnv = async () => {
    const payload = Object.fromEntries(Object.entries(env).map(([k, v]) => [k, Number(v) || 0]));
    try { setEnvRes(await envApi.compute(payload)); } catch (e) { /* */ }
  };

  return (
    <div className="space-y-7" data-testid="elite-tools">
      {/* Food cost */}
      <div>
        <p className="flex items-center gap-2 font-mono-data text-[10px] tracking-[0.25em] uppercase text-[#64748B] mb-3"><Calculator className="w-3.5 h-3.5" /> {tri("Food cost al grammo", "Food Cost pro Gramm", "Food cost per gram", "Food cost por gramo", "Coût matière au gramme", "بهای مواد بر گرم")}</p>
        {recipes.length > 0 && (
          <div className="mb-3">
            <span className="text-[10px] uppercase tracking-wider text-[#7d97ac]">{tri("Da ricetta salvata (1-clic)", "Aus gespeichertem Rezept", "From saved recipe (1-click)", "Desde receta guardada", "Depuis recette", "از دستور ذخیره‌شده")}</span>
            <select data-testid="fc-recipe-select" onChange={(e) => pickRecipe(e.target.value)} defaultValue=""
              className="mt-1 w-full bg-[#0C1019] border border-[#64748B]/30 rounded-lg px-3 py-2 text-sm text-white focus:border-[#64748B] outline-none">
              <option value="" disabled>{tri("Scegli una ricetta…", "Rezept wählen…", "Choose a recipe…", "Elige una receta…", "Choisir une recette…", "یک دستور انتخاب کن…")}</option>
              {recipes.map((r) => (<option key={r.id} value={r.id}>{r.name}</option>))}
            </select>
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
          <Field label={tri("Farina", "Mehl", "Flour", "Harina", "Farine", "آرد")} value={fc.flour_grams} onChange={upd("flour_grams")} unit="g" />
          <Field label={tri("Acqua", "Wasser", "Water", "Agua", "Eau", "آب")} value={fc.water_grams} onChange={upd("water_grams")} unit="g" />
          <Field label={tri("Sale", "Salz", "Salt", "Sal", "Sel", "نمک")} value={fc.salt_grams} onChange={upd("salt_grams")} unit="g" />
          <Field label={tri("Lievito madre", "Sauerteig", "Sourdough", "Masa madre", "Levain", "خمیرترش")} value={fc.sourdough_grams} onChange={upd("sourdough_grams")} unit="g" />
          <Field label={tri("Lievito", "Hefe", "Yeast", "Levadura", "Levure", "مخمر")} value={fc.yeast_grams} onChange={upd("yeast_grams")} unit="g" />
          <Field label={tri("Pezzi", "Stücke", "Pieces", "Piezas", "Pièces", "تعداد")} value={fc.pieces} onChange={upd("pieces")} />
          <Field label={tri("Prezzo/pz", "Preis/St", "Price/pc", "Precio/pz", "Prix/pc", "قیمت/عدد")} value={fc.sell_price_piece} onChange={upd("sell_price_piece")} unit="€" />
          <button data-testid="fc-run" onClick={runFc} className="self-end h-[38px] rounded-lg bg-[#64748B]/20 border border-[#64748B]/50 text-[#9fc3dc] font-bold text-sm active:scale-95 transition-all">{tri("Calcola", "Rechnen", "Compute", "Calcular", "Calculer", "محاسبه")}</button>
        </div>
        {fcRes && (
          <div data-testid="fc-result" className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            {[
              [tri("Costo/infornata", "Kosten/Charge", "Cost/batch", "Coste/hornada", "Coût/fournée", "هزینه/پخت"), `€ ${fcRes.material_cost}`],
              [tri("Al grammo", "Pro Gramm", "Per gram", "Por gramo", "Au gramme", "بر گرم"), `€ ${fcRes.cost_per_gram}`],
              [tri("Al pezzo", "Pro Stück", "Per piece", "Por pieza", "Par pièce", "بر عدد"), fcRes.cost_per_piece != null ? `€ ${fcRes.cost_per_piece}` : "—"],
              [tri("Food cost %", "Food Cost %", "Food cost %", "Food cost %", "Food cost %", "درصد"), fcRes.food_cost_pct != null ? `${fcRes.food_cost_pct}%` : "—"],
            ].map(([k, v], i) => (
              <div key={i} className="bg-[#0C1019]/70 border border-[#64748B]/25 rounded-lg py-2">
                <p className="text-[9px] uppercase tracking-wider text-[#7d97ac]">{k}</p>
                <p className="text-lg font-black text-[#FF9D42]">{v}</p>
              </div>
            ))}
            {fcRes.margin != null && <p className="col-span-2 sm:col-span-4 text-xs text-[#CBD5E1]">{tri("Margine per infornata", "Marge/Charge", "Margin/batch", "Margen/hornada", "Marge/fournée", "حاشیه")}: <span className="font-bold text-[#FF9D42]">€ {fcRes.margin}</span></p>}
          </div>
        )}
      </div>

      {/* Environment */}
      <div>
        <p className="flex items-center gap-2 font-mono-data text-[10px] tracking-[0.25em] uppercase text-[#64748B] mb-3"><Thermometer className="w-3.5 h-3.5" /> {tri("Controllo ambientale predittivo", "Prädiktive Umweltsteuerung", "Predictive environment control", "Control ambiental predictivo", "Contrôle environnemental prédictif", "کنترل محیطی پیش‌بین")}</p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-3">
          <Field label={tri("Lievit. base", "Gare Basis", "Base proof", "Fermentación", "Pousse base", "تخمیر پایه")} value={env.base_proof_hours} onChange={updE("base_proof_hours")} unit="h" />
          <Field label={tri("Idrataz. base", "Hydratation", "Base hydration", "Hidratación", "Hydratation", "هیدراتاسیون")} value={env.base_hydration_percent} onChange={updE("base_hydration_percent")} unit="%" />
          <Field label={tri("Temperatura", "Temperatur", "Temperature", "Temperatura", "Température", "دما")} value={env.temp_c} onChange={updE("temp_c")} unit="°C" />
          <Field label={tri("Umidità", "Feuchte", "Humidity", "Humedad", "Humidité", "رطوبت")} value={env.humidity_pct} onChange={updE("humidity_pct")} unit="%" />
          <button data-testid="env-run" onClick={runEnv} className="self-end h-[38px] rounded-lg bg-[#64748B]/20 border border-[#64748B]/50 text-[#9fc3dc] font-bold text-sm active:scale-95 transition-all">{tri("Suggerisci", "Vorschlag", "Suggest", "Sugerir", "Suggérer", "پیشنهاد")}</button>
          <button data-testid="env-auto" onClick={async () => { try { const w = await envApi.weatherNow(); if (w && w.ok) { const ne = { ...env, temp_c: w.temp_c, humidity_pct: w.humidity_pct }; setEnv(ne); const p = Object.fromEntries(Object.entries(ne).map(([k, v]) => [k, Number(v) || 0])); setEnvRes(await envApi.compute(p)); } } catch (e) { /* */ } }} className="self-end h-[38px] inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#FF9D42]/15 border border-[#FF9D42]/50 text-[#FF9D42] font-bold text-sm active:scale-95 transition-all"><CloudSun className="w-4 h-4" /> {tri("Auto meteo", "Auto Wetter", "Auto weather", "Auto clima", "Auto météo", "خودکار هوا")}</button>
        </div>
        {envRes && (
          <div data-testid="env-result" className="bg-[#0C1019]/70 border border-[#64748B]/25 rounded-lg p-3">
            <div className="flex gap-4 mb-2">
              <div><p className="text-[9px] uppercase tracking-wider text-[#7d97ac]">{tri("Lievitazione", "Gare", "Proof", "Fermentación", "Pousse", "تخمیر")}</p><p className="text-xl font-black text-[#FF9D42]">{envRes.adjusted_proof_hours} h</p></div>
              <div><p className="text-[9px] uppercase tracking-wider text-[#7d97ac]">{tri("Idratazione", "Hydratation", "Hydration", "Hidratación", "Hydratation", "هیدراتاسیون")}</p><p className="text-xl font-black text-[#FF9D42]">{envRes.hydration_percent}%</p></div>
            </div>
            <p className="text-xs text-[#CBD5E1]">{envRes.note}</p>
          </div>
        )}
      </div>
    </div>
  );
}
