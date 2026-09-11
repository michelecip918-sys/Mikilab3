import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { X, CloudSun, Droplets, Gauge, Wand2, Loader2, TrendingUp, TrendingDown, Minus, Wheat } from "lucide-react";
import { recipesApi, climateApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

const VERDICT = {
  umido: { c: "#64748B", it: "Aria umida", de: "Feuchte Luft", en: "Humid air", es: "Aire húmedo", fr: "Air humide", fa: "هوای مرطوب" },
  secco: { c: "#aaa795", it: "Aria secca", de: "Trockene Luft", en: "Dry air", es: "Aire seco", fr: "Air sec", fa: "هوای خشک" },
  stabile: { c: "#6e9e85", it: "Clima stabile", de: "Stabiles Klima", en: "Stable climate", es: "Clima estable", fr: "Climat stable", fa: "آب‌وهوای پایدار" },
};

export default function ClimateTimeMachine({ onClose }) {
  const { lang } = useLang();
  const tri = mkTri(lang);
  const [recipes, setRecipes] = useState([]);
  const [recipeId, setRecipeId] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { recipesApi.list("mikilab").then((r) => setRecipes(Array.isArray(r) ? r : [])).catch(() => setRecipes([])); }, []);

  const run = useCallback(async () => {
    setLoading(true);
    try {
      const rec = recipes.find((r) => r.id === recipeId);
      const res = await climateApi.timeMachine({ recipe_id: recipeId || null, recipe_name: rec?.name || "", lang });
      setData(res);
    } catch { setData({ error: true }); }
    setLoading(false);
  }, [recipeId, recipes, lang]);

  const cl = data?.climate || {};
  const adj = data?.adjustment;
  const v = adj?.verdict && VERDICT[adj.verdict] ? VERDICT[adj.verdict] : null;
  const Trend = ({ val }) => val == null ? <Minus className="w-3.5 h-3.5 text-[#64748B]" /> : val > 0 ? <TrendingUp className="w-3.5 h-3.5 text-[#6e9e85]" /> : val < 0 ? <TrendingDown className="w-3.5 h-3.5 text-[#aaa795]" /> : <Minus className="w-3.5 h-3.5 text-[#64748B]" />;

  const deltaStr = (n) => (n == null ? "—" : (n > 0 ? `+${n}` : `${n}`));

  return (
    <div data-testid="climate-time-machine" className="fixed inset-0 z-[80] bg-[#030712]/97 backdrop-blur-xl overflow-y-auto">
      <div className="max-w-2xl mx-auto p-4 pb-16">
        <div className="flex items-center justify-between sticky top-0 bg-[#030712]/95 py-2 z-10">
          <h2 className="text-lg font-black text-white flex items-center gap-2"><CloudSun className="w-5 h-5 text-[#aaa795]" /> {tri("Macchina del Tempo Clima", "Klima-Zeitmaschine", "Climate Time Machine", "Máquina del Tiempo Clima", "Machine à Remonter le Climat", "ماشین زمان اقلیم")}</h2>
          <button data-testid="climate-close" onClick={onClose} className="w-9 h-9 rounded-full bg-[#0b0f19] border border-[#1e293b] flex items-center justify-center text-[#94A3B8] hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <p className="text-[12px] text-[#94A3B8] mb-4">{tri("Incrocio pressione barometrica e umidità di Stoccarda per suggerire micro-correzioni stagionali alla ricetta.", "Ich kreuze Luftdruck & Luftfeuchte in Stuttgart für saisonale Rezept-Korrekturen.", "I cross barometric pressure and humidity in Stuttgart to suggest seasonal recipe tweaks.", "Cruzo presión barométrica y humedad de Stuttgart para ajustes estacionales.", "Je croise pression et humidité à Stuttgart pour des ajustements saisonniers.", "فشار هوا و رطوبت اشتوتگارت را برای تنظیمات فصلی تلاقی می‌دهم.")}</p>

        {/* Selettore ricetta + esegui */}
        <div className="flex flex-col sm:flex-row gap-2 mb-5">
          <select data-testid="climate-recipe-select" value={recipeId} onChange={(e) => setRecipeId(e.target.value)} className="flex-1 bg-[#0b0f19] border border-[#1e293b] rounded-xl p-3 text-sm text-white outline-none focus:border-[#aaa795]">
            <option value="">{tri("Ricetta generica (senza selezione)", "Allgemeines Rezept", "Generic recipe", "Receta genérica", "Recette générique", "دستور عمومی")}</option>
            {recipes.map((r) => (<option key={r.id} value={r.id}>{r[`name_${lang}`] || r.name}</option>))}
          </select>
          <button data-testid="climate-run" onClick={run} disabled={loading} className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#aaa795] to-[#d97706] text-[#030712] font-black text-sm disabled:opacity-50 active:scale-95 transition-all">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />} {tri("Prevedi", "Vorhersagen", "Predict", "Predecir", "Prédire", "پیش‌بینی")}
          </button>
        </div>

        {data?.error && <p className="text-center text-sm text-[#bb8489]" data-testid="climate-error">{tri("Meteo non raggiungibile. Riprova.", "Wetter nicht erreichbar.", "Weather unavailable. Retry.", "Clima no disponible.", "Météo indisponible.", "آب‌وهوا در دسترس نیست.")}</p>}

        {cl && !data?.error && cl.location && (
          <>
            {/* Clima attuale */}
            <div className="grid grid-cols-2 gap-3 mb-4" data-testid="climate-stats">
              <div className="rounded-2xl border border-[#64748B]/40 p-4" style={{ background: "#64748B0d" }}>
                <p className="text-[10px] font-black uppercase tracking-wider text-[#94A3B8] flex items-center gap-1.5"><Droplets className="w-3.5 h-3.5 text-[#64748B]" /> {tri("Umidità", "Luftfeuchte", "Humidity", "Humedad", "Humidité", "رطوبت")}</p>
                <p className="text-3xl font-black text-white mt-1" data-testid="climate-humidity">{cl.now_humidity ?? "—"}<span className="text-lg">%</span></p>
                <p className="text-[11px] text-[#94A3B8] flex items-center gap-1 mt-1"><Trend val={cl.humidity_trend} /> {tri("trend", "Trend", "trend", "tendencia", "tendance", "روند")} {cl.humidity_trend != null ? `${cl.humidity_trend > 0 ? "+" : ""}${cl.humidity_trend}%` : "—"}</p>
              </div>
              <div className="rounded-2xl border border-[#aaa795]/40 p-4" style={{ background: "#f59e0b0d" }}>
                <p className="text-[10px] font-black uppercase tracking-wider text-[#94A3B8] flex items-center gap-1.5"><Gauge className="w-3.5 h-3.5 text-[#aaa795]" /> {tri("Pressione", "Luftdruck", "Pressure", "Presión", "Pression", "فشار")}</p>
                <p className="text-3xl font-black text-white mt-1" data-testid="climate-pressure">{cl.now_pressure ? Math.round(cl.now_pressure) : "—"}<span className="text-lg"> hPa</span></p>
                <p className="text-[11px] text-[#94A3B8] flex items-center gap-1 mt-1"><Trend val={cl.pressure_trend} /> {tri("trend", "Trend", "trend", "tendencia", "tendance", "روند")} {cl.pressure_trend != null ? `${cl.pressure_trend > 0 ? "+" : ""}${cl.pressure_trend}` : "—"} hPa</p>
              </div>
            </div>
            <p className="text-[10px] text-[#64748B] text-center mb-4">📍 {cl.location} · {tri("media 7gg vs prossimi 3gg", "7T-Schnitt vs. nächste 3T", "7-day avg vs next 3 days", "media 7d vs próx. 3d", "moy. 7j vs 3 prochains j", "میانگین ۷ روز")}</p>
          </>
        )}

        {/* Correzione AI */}
        {adj && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} data-testid="climate-adjustment" className="rounded-3xl border p-4" style={{ borderColor: `${(v?.c) || "#64748B"}55`, background: `${(v?.c) || "#64748B"}0d` }}>
            {v && <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full mb-3" style={{ background: `${v.c}22`, color: v.c }} data-testid="climate-verdict">{tri(v.it, v.de, v.en, v.es, v.fr, v.fa)}</span>}
            <p className="text-sm text-white font-bold leading-snug mb-3" data-testid="climate-summary">{adj.summary}</p>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="rounded-xl bg-[#030712] border border-[#1e293b] p-2.5 text-center">
                <p className="text-[9px] font-bold uppercase text-[#94A3B8]">{tri("Idratazione", "Hydration", "Hydration", "Hidratación", "Hydratation", "هیدراتاسیون")}</p>
                <p className="text-xl font-black font-mono-data" style={{ color: v?.c || "#7DA3C0" }} data-testid="climate-hyd-delta">{deltaStr(adj.hydration_delta_pct)}%</p>
              </div>
              <div className="rounded-xl bg-[#030712] border border-[#1e293b] p-2.5 text-center">
                <p className="text-[9px] font-bold uppercase text-[#94A3B8]">{tri("Lievito", "Hefe", "Yeast", "Levadura", "Levure", "مخمر")}</p>
                <p className="text-xl font-black font-mono-data" style={{ color: v?.c || "#7DA3C0" }} data-testid="climate-yeast-delta">{deltaStr(adj.yeast_delta_pct)}%</p>
              </div>
              <div className="rounded-xl bg-[#030712] border border-[#1e293b] p-2.5 text-center">
                <p className="text-[9px] font-bold uppercase text-[#94A3B8]">{tri("Puntata", "Gare", "Ferment.", "Fermentac.", "Pointage", "تخمیر")}</p>
                <p className="text-xl font-black font-mono-data" style={{ color: v?.c || "#7DA3C0" }} data-testid="climate-ferm-delta">{deltaStr(adj.fermentation_delta_min)}′</p>
              </div>
            </div>
            {(adj.tips || []).length > 0 && (
              <ul className="space-y-1.5" data-testid="climate-tips">
                {adj.tips.map((t, i) => (<li key={i} className="text-[12px] text-[#cfe0ec] flex items-start gap-1.5"><Wheat className="w-3.5 h-3.5 text-[#aaa795] mt-0.5 shrink-0" /> {t}</li>))}
              </ul>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
