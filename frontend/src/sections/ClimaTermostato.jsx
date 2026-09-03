import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Clock, Thermometer, Bluetooth, Save, History } from "lucide-react";
import { labConfigApi, recipesApi, recipeTempApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";

export default function ClimaTermostato() {
  const { t } = useLang();
  const [now, setNow] = useState(new Date());
  const [std, setStd] = useState(26);
  const [labNow, setLabNow] = useState("");
  const [btState, setBtState] = useState("idle");
  const [recipes, setRecipes] = useState([]);
  const [temps, setTemps] = useState([]);
  const [sel, setSel] = useState("");
  const [target, setTarget] = useState("");
  const [measured, setMeasured] = useState("");

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    (async () => {
      try { const cfg = await labConfigApi.get(); if (cfg?.standard_temp_c) setStd(cfg.standard_temp_c); } catch { /* */ }
      try {
        const [mk, ps] = await Promise.all([recipesApi.list("mikilab"), recipesApi.list("personal")]);
        setRecipes([...(mk || []), ...(ps || [])].sort((a, b) => (a.name || "").localeCompare(b.name || "")));
      } catch { /* */ }
      try { setTemps(await recipeTempApi.list()); } catch { /* */ }
    })();
  }, []);

  const delta = labNow === "" ? null : Number(labNow) - (Number(std) || 26);
  const climateMsg = delta == null ? null : Math.abs(delta) < 1 ? t("capo_temp_ok") : delta > 0 ? t("capo_temp_warm") : t("capo_temp_cold");

  const connectBt = async () => {
    if (!navigator.bluetooth) { setBtState("unsupported"); toast.error(t("termo_bt_unsupported")); return; }
    setBtState("connecting");
    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: ["environmental_sensing"] }],
        optionalServices: ["environmental_sensing"],
      });
      const server = await device.gatt.connect();
      const service = await server.getPrimaryService("environmental_sensing");
      const ch = await service.getCharacteristic("temperature");
      setBtState("reading");
      const val = await ch.readValue();
      const raw = val.getInt16(0, true); // sint16, unit 0.01 °C (BLE 0x2A6E)
      const celsius = Math.round((raw / 100) * 10) / 10;
      setLabNow(String(celsius));
      setBtState("ok");
      toast.success(t("termo_bt_ok"));
    } catch {
      setBtState("error");
      toast.error(t("termo_bt_error"));
    }
  };

  const pickRecipe = (id) => {
    setSel(id);
    const r = recipes.find((x) => x.id === id);
    setTarget(r && r.water_temp_c != null ? String(r.water_temp_c) : "");
    setMeasured("");
  };

  const lastForSel = temps.find((x) => x.recipe_id === sel);
  const advice = (() => {
    if (!lastForSel || lastForSel.target_c == null) return null;
    const d = Number(lastForSel.actual_c) - Number(lastForSel.target_c);
    if (Math.abs(d) < 0.5) return { type: "ok", text: t("termo_advice_ok") };
    const deg = Math.abs(Math.round(d * 10) / 10);
    return d > 0
      ? { type: "warm", text: `${t("termo_advice_warm")} ${deg}°C.` }
      : { type: "cold", text: `${t("termo_advice_cold")} ${deg}°C.` };
  })();

  const saveTemp = async () => {
    if (!sel || measured === "") return;
    const r = recipes.find((x) => x.id === sel);
    try {
      await recipeTempApi.save({
        recipe_id: sel, recipe_name: r ? r.name : "",
        target_c: target === "" ? null : Number(target),
        actual_c: Number(measured),
      });
      toast.success(t("termo_saved"));
      setTemps(await recipeTempApi.list());
    } catch { toast.error(t("toast_save_error")); }
  };

  const hh = now.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <div className="pb-24">
      <div className="relative rounded-3xl overflow-hidden mb-5 bg-gradient-to-br from-[#3E9C93] to-[#3E9C93] p-6 text-white">
        <div className="absolute top-0 left-0 right-0 flex h-1.5">
          <div className="flex-1 bg-[#3E9C93]" /><div className="flex-1 bg-white" /><div className="flex-1 bg-[#3E9C93]" />
          <div className="flex-1 bg-black" /><div className="flex-1 bg-[#3E9C93]" /><div className="flex-1 bg-[#3E9C93]" />
        </div>
        <Thermometer className="w-7 h-7 mb-2" />
        <h1 className="font-display text-2xl font-bold">{t("termo_title")}</h1>
        <p className="text-white/85 text-sm mt-1">{t("termo_sub")}</p>
      </div>

      {/* Orologio */}
      <div data-testid="termo-clock" className="mb-4 rounded-2xl bg-white dark:bg-[#1B2A38] border border-[#2A3B49] dark:border-[#2A3B49] p-5 flex items-center gap-3">
        <Clock className="w-6 h-6 text-[#3E9C93]" />
        <div>
          <p className="text-[10px] uppercase tracking-wide text-[#7E8A93]">{t("termo_clock")}</p>
          <p className="font-mono-data text-3xl font-bold text-[#2B303B] dark:text-[#e4eff8]">{hh}</p>
        </div>
      </div>

      {/* Clima */}
      <div className="mb-4 rounded-2xl bg-white dark:bg-[#1B2A38] border border-[#2A3B49] dark:border-[#2A3B49] p-5">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-[#7E8A93]">{t("termo_lab_now")}</label>
            <input data-testid="termo-lab-now" type="number" value={labNow} onChange={(e) => setLabNow(e.target.value)}
              className="mt-1 w-full bg-[#e4eff8] dark:bg-[#1B2A38] border border-[#2A3B49] dark:border-[#2A3B49] rounded-2xl shadow-md border border-amber-900/40 p-3 text-base outline-none focus:border-[#3E9C93]" />
          </div>
          <div className="text-center shrink-0 pb-1">
            <p className="text-[10px] uppercase tracking-wide text-[#7E8A93]">{t("termo_std")}</p>
            <p className="font-mono-data text-xl font-bold text-[#3E9C93]">{std}°C</p>
          </div>
        </div>
        <button data-testid="termo-bt-connect" onClick={connectBt} disabled={btState === "connecting" || btState === "reading"}
          className="mt-3 w-full bg-[#5b8fb0] hover:bg-[#4d7d9c] disabled:opacity-60 text-white font-semibold px-4 py-2.5 rounded-2xl shadow-md border border-amber-900/40 flex items-center justify-center gap-2">
          <Bluetooth className="w-4 h-4" /> {btState === "connecting" ? t("termo_bt_connecting") : btState === "reading" ? t("termo_bt_reading") : t("termo_bt_connect")}
        </button>
        {climateMsg && (
          <div data-testid="termo-climate-msg" className={`mt-3 text-sm rounded-2xl shadow-md border border-amber-900/40 px-3 py-2 border ${delta && Math.abs(delta) >= 1 ? "bg-[#3E9C93]/15 border-[#3E9C93]/40 text-[#3E9C93] dark:text-[#8FB0C2]" : "bg-[#3E9C93]/12 border-[#3E9C93]/30 text-[#3E9C93] dark:text-[#a9d2ec]"}`}>
            <Thermometer className="w-4 h-4 inline mr-1" />{climateMsg}
          </div>
        )}
      </div>

      {/* Memoria temperatura impasto per ricetta */}
      <div className="rounded-2xl bg-white dark:bg-[#1B2A38] border border-[#2A3B49] dark:border-[#2A3B49] p-5">
        <div className="flex items-center gap-2 mb-3 text-[#3E9C93]">
          <History className="w-4 h-4" />
          <h2 className="font-display text-base font-semibold text-[#2B303B] dark:text-[#e4eff8]">{t("termo_recipe_mem")}</h2>
        </div>
        <select data-testid="termo-recipe-select" value={sel} onChange={(e) => pickRecipe(e.target.value)}
          className="w-full bg-[#e4eff8] dark:bg-[#1B2A38] border border-[#2A3B49] dark:border-[#2A3B49] rounded-2xl shadow-md border border-amber-900/40 p-3 text-base outline-none focus:border-[#3E9C93]">
          <option value="">{t("termo_pick_recipe")}</option>
          {recipes.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>

        {sel && (
          <div className="mt-3 space-y-3" data-testid="termo-recipe-detail">
            {advice && (
              <div data-testid="termo-advice" className={`text-sm rounded-2xl shadow-md border border-amber-900/40 px-3 py-2 border flex items-start gap-2 ${advice.type === "ok" ? "bg-[#3E9C93]/12 border-[#3E9C93]/30 text-[#3E9C93] dark:text-[#a9d2ec]" : "bg-[#3E9C93]/15 border-[#3E9C93]/40 text-[#3E9C93] dark:text-[#8FB0C2]"}`}>
                <Thermometer className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{advice.text}{lastForSel?.date ? ` (${t("termo_last")}: ${new Date(lastForSel.date).toLocaleDateString()})` : ""}</span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wide text-[#7E8A93]">{t("termo_target")}</label>
                <input data-testid="termo-target" type="number" value={target} onChange={(e) => setTarget(e.target.value)}
                  className="mt-1 w-full bg-[#e4eff8] dark:bg-[#1B2A38] border border-[#2A3B49] dark:border-[#2A3B49] rounded-2xl shadow-md border border-amber-900/40 p-2.5 text-sm outline-none focus:border-[#3E9C93]" />
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wide text-[#7E8A93]">{t("termo_measured")}</label>
                <input data-testid="termo-measured" type="number" value={measured} onChange={(e) => setMeasured(e.target.value)}
                  className="mt-1 w-full bg-[#e4eff8] dark:bg-[#1B2A38] border border-[#2A3B49] dark:border-[#2A3B49] rounded-2xl shadow-md border border-amber-900/40 p-2.5 text-sm outline-none focus:border-[#3E9C93]" />
              </div>
            </div>
            <button data-testid="termo-save" onClick={saveTemp} disabled={measured === ""}
              className="w-full bg-[#3E9C93] hover:bg-[#5E8CA8] disabled:opacity-50 text-white font-semibold px-4 py-2.5 rounded-2xl shadow-md border border-amber-900/40 flex items-center justify-center gap-2">
              <Save className="w-4 h-4" /> {t("termo_save")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
