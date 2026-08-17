import { useState } from "react";
import { Thermometer, Droplets } from "lucide-react";

const inputs = [
  { key: "desired", label: "Temp. impasto desiderata", def: "25", testid: "input-desired-dough-temp" },
  { key: "flour", label: "Temp. farina", def: "20", testid: "input-flour-temp" },
  { key: "room", label: "Temp. ambiente (Stoccarda)", def: "22", testid: "input-room-temp" },
  { key: "friction", label: "Fattore attrito (spirale ~5, mano ~2)", def: "5", testid: "input-friction" },
  { key: "starter", label: "Temp. lievito madre / prefermento", def: "21", testid: "input-starter-temp" },
];

export default function CalcolaGradi() {
  const [vals, setVals] = useState({ desired: "25", flour: "20", room: "22", friction: "5", starter: "21" });
  const [result, setResult] = useState(null);

  const set = (k, v) => setVals((s) => ({ ...s, [k]: v }));

  const calc = () => {
    const d = Number(vals.desired), f = Number(vals.flour), r = Number(vals.room),
      fr = Number(vals.friction), s = Number(vals.starter);
    const water = 4 * d - (f + r + fr + s);
    setResult({ water: Math.round(water * 10) / 10, d, f, r, fr, s });
  };

  return (
    <div className="pb-4">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-11 h-11 rounded-2xl bg-[#B34A26] flex items-center justify-center">
          <Thermometer className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-[#2C221E] dark:text-[#F5EFE6]">Calcola gradi</h1>
          <p className="text-sm text-[#8C7567]">Temperatura dell'acqua per l'impasto perfetto</p>
        </div>
      </div>

      <div className="space-y-3 mt-5">
        {inputs.map(({ key, label, testid }) => (
          <div key={key} className="flex items-center justify-between gap-3 bg-white dark:bg-[#2A211D] border border-[#E8DEC8] dark:border-[#3D302A] rounded-2xl px-4 py-3">
            <label className="text-sm text-[#4A3B34] dark:text-[#C9BBB0] flex-1">{label}</label>
            <div className="flex items-center gap-1">
              <input
                data-testid={testid}
                type="number"
                value={vals[key]}
                onChange={(e) => set(key, e.target.value)}
                className="w-20 text-right font-mono-data font-bold text-[#8C3A1D] dark:text-[#E5AC3A] bg-[#F5EFE6] dark:bg-[#332823] border border-[#E8DEC8] dark:border-[#3D302A] rounded-lg px-2 py-1.5 outline-none focus:border-[#B34A26]"
              />
              <span className="text-[#8C7567] text-sm">°C</span>
            </div>
          </div>
        ))}
      </div>

      <button
        data-testid="btn-calculate-temp"
        onClick={calc}
        className="w-full mt-5 bg-[#B34A26] hover:bg-[#963B1C] text-white font-semibold px-5 py-3.5 rounded-2xl shadow-md active:scale-98 transition-all flex items-center justify-center gap-2"
      >
        <Droplets className="w-5 h-5" /> Calcola temperatura acqua
      </button>

      {result && (
        <div data-testid="calc-result" className="mt-5 bg-gradient-to-br from-[#B34A26] to-[#8C3A1D] rounded-3xl p-6 text-white shadow-lg">
          <p className="text-white/80 text-sm uppercase tracking-wider font-semibold">Versa l'acqua a</p>
          <p className="font-mono-data text-5xl font-bold mt-1">
            {result.water}<span className="text-2xl">°C</span>
          </p>
          <div className="mt-4 pt-4 border-t border-white/20 font-mono-data text-xs text-white/80 leading-relaxed">
            4 × {result.d} − ({result.f} + {result.r} + {result.fr} + {result.s}) = {result.water}°C
          </div>
        </div>
      )}
    </div>
  );
}
