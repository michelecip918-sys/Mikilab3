import { useState } from "react";
import { Thermometer, Droplets, CheckCircle2, AlertTriangle } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";

// Acqua fredda pratica: ghiaccio ~4°C. Acqua troppo calda (>38°C) scotta i lieviti.
const MIN_WATER = 4;
const MAX_WATER = 38;

export default function CalcolaGradi() {
  const { t } = useLang();
  const [vals, setVals] = useState({ desired: "25", flour: "20", room: "22", friction: "5", starter: "21" });
  const [result, setResult] = useState(null);

  const inputs = [
    { key: "desired", label: t("clima_desired"), testid: "input-desired-dough-temp" },
    { key: "flour", label: t("clima_flour"), testid: "input-flour-temp" },
    { key: "room", label: t("clima_room"), testid: "input-room-temp" },
    { key: "friction", label: t("clima_friction"), testid: "input-friction" },
    { key: "starter", label: t("clima_starter"), testid: "input-starter-temp" },
  ];

  const set = (k, v) => setVals((s) => ({ ...s, [k]: v }));

  const calc = () => {
    const d = Number(vals.desired), f = Number(vals.flour), r = Number(vals.room),
      fr = Number(vals.friction), s = Number(vals.starter);
    const water = 4 * d - (f + r + fr + s);
    const rounded = Math.round(water * 10) / 10;
    let status = "ok";
    // Considera sia l'acqua necessaria SIA la temperatura della camera.
    if (rounded < MIN_WATER || r >= 29) status = "hot";      // camera troppo calda
    else if (rounded > MAX_WATER || r <= 15) status = "cold"; // camera troppo fredda
    setResult({ water: rounded, d, f, r, fr, s, status });
  };

  return (
    <div className="pb-4">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-11 h-11 rounded-2xl bg-[#3E9C93] flex items-center justify-center">
          <Thermometer className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-[#2B303B] dark:text-[#e4eff8]">{t("clima_title")}</h1>
          <p className="text-sm text-[#7E8A93]">{t("clima_subtitle")}</p>
        </div>
      </div>

      <div className="space-y-3 mt-5">
        {inputs.map(({ key, label, testid }) => (
          <div key={key} className="flex items-center justify-between gap-3 bg-white dark:bg-[#1B2A38] border border-[#2A3B49] dark:border-[#2A3B49] rounded-2xl px-4 py-3">
            <label className="text-sm text-[#3F4A54] dark:text-[#AEB8BF] flex-1">{label}</label>
            <div className="flex items-center gap-1">
              <input
                data-testid={testid}
                type="number"
                value={vals[key]}
                onChange={(e) => set(key, e.target.value)}
                className="w-20 text-right font-mono-data font-bold text-[#3E9C93] dark:text-[#8FB0C2] bg-[#e4eff8] dark:bg-[#1B2A38] border border-[#2A3B49] dark:border-[#2A3B49] rounded-lg px-2 py-1.5 outline-none focus:border-[#3E9C93]"
              />
              <span className="text-[#7E8A93] text-sm">°C</span>
            </div>
          </div>
        ))}
      </div>

      <button
        data-testid="btn-calculate-temp"
        onClick={calc}
        className="w-full mt-5 bg-[#3E9C93] hover:bg-[#64748B] text-white font-semibold px-5 py-3.5 rounded-2xl shadow-md active:scale-98 transition-all flex items-center justify-center gap-2"
      >
        <Droplets className="w-5 h-5" /> {t("clima_calc")}
      </button>

      {result && (
        <>
          <div data-testid="calc-result" className="mt-5 bg-gradient-to-br from-[#3E9C93] to-[#3E9C93] rounded-3xl p-6 text-white shadow-lg">
            <p className="text-white/80 text-sm uppercase tracking-wider font-semibold">{t("clima_water_at")}</p>
            <p className="font-mono-data text-5xl font-bold mt-1">
              {result.water}<span className="text-2xl">°C</span>
            </p>
            <div className="mt-4 pt-4 border-t border-white/20 font-mono-data text-xs text-white/80 leading-relaxed">
              4 × {result.d} − ({result.f} + {result.r} + {result.fr} + {result.s}) = {result.water}°C
            </div>
          </div>

          <div
            data-testid="clima-verdict"
            className={`mt-3 rounded-2xl p-4 border flex items-start gap-3 ${
              result.status === "ok"
                ? "bg-[#3E9C93]/12 border-[#3E9C93]/35"
                : "bg-[#3E9C93]/12 border-[#3E9C93]/35"
            }`}
          >
            {result.status === "ok" ? (
              <CheckCircle2 className="w-5 h-5 text-[#3E9C93] dark:text-[#a9d2ec] shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-[#3E9C93] shrink-0 mt-0.5" />
            )}
            <div>
              <p className={`text-xs font-bold uppercase tracking-wide ${result.status === "ok" ? "text-[#3E9C93] dark:text-[#a9d2ec]" : "text-[#3E9C93]"}`}>
                {t("clima_verdict")}
              </p>
              <p className="text-sm text-[#3F4A54] dark:text-[#AEB8BF] mt-0.5 leading-relaxed">
                {result.status === "ok" ? t("clima_room_ok") : result.status === "hot" ? t("clima_room_hot") : t("clima_room_cold")}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
