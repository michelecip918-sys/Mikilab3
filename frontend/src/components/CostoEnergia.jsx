import { useState, useMemo } from "react";
import { Flame, Zap, Euro } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";

// Costo Energia Forno — kWh e € per ogni cottura (e per pezzo).
const LS = "mikilab_energia";
const load = () => { try { return JSON.parse(localStorage.getItem(LS) || "null"); } catch { return null; } };

const INP = "w-full bg-[#f0f6fb] dark:bg-[#1F252B] border border-[#d5e4f0] dark:border-[#38424B] rounded-xl px-3 py-2.5 outline-none text-[#2B303B] dark:text-[#e4eff8] focus:border-[#3f7cac]";
const Field = ({ label, tid, val, set, step, suffix }) => (
  <label className="text-[11px] font-semibold uppercase text-[#7E8A93] flex flex-col gap-1">
    <span>{label}</span>
    <div className="relative">
      <input data-testid={tid} type="number" step={step} value={val} onChange={(e) => set(e.target.value)} className={INP} />
      {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7E8A93] text-sm">{suffix}</span>}
    </div>
  </label>
);

export default function CostoEnergia() {
  const { lang } = useLang();
  const tri = (i, d, e, s) => (lang === "de" ? d : lang === "es" ? (s ?? e ?? i) : (lang === "en" ? e : i));
  const saved = load() || {};
  const [power, setPower] = useState(saved.power ?? "6");
  const [minutes, setMinutes] = useState(saved.minutes ?? "40");
  const [price, setPrice] = useState(saved.price ?? "0.30");
  const [duty, setDuty] = useState(saved.duty ?? "60");
  const [pieces, setPieces] = useState(saved.pieces ?? "30");

  const r = useMemo(() => {
    const n = (v) => (Number(v) || 0);
    const kwh = n(power) * (n(minutes) / 60) * (n(duty) / 100);
    const cost = kwh * n(price);
    const per = n(pieces) > 0 ? cost / n(pieces) : 0;
    const data = { power, minutes, price, duty, pieces };
    try { localStorage.setItem(LS, JSON.stringify(data)); } catch { /* */ }
    return { kwh, cost, per };
  }, [power, minutes, price, duty, pieces]);

  return (
    <div className="pb-40" data-testid="energia-tool">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-2xl bg-[#C0574D] flex items-center justify-center"><Zap className="w-6 h-6 text-white" /></div>
        <div>
          <h1 className="font-display text-2xl font-bold text-[#2B303B] dark:text-[#e4eff8]">{tri("Costo Energia Forno", "Ofen-Energiekosten", "Oven Energy Cost", "Coste Energía Horno")}</h1>
          <p className="text-sm text-[#7E8A93]">{tri("Quanto ti costa ogni infornata", "Was jede Charge kostet", "What each bake costs you", "Cuánto cuesta cada horneada")}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-2">
        <Field label={tri("Potenza forno", "Ofenleistung", "Oven power", "Potencia horno")} tid="energia-power" val={power} set={setPower} step="0.5" suffix="kW" />
        <Field label={tri("Minuti cottura", "Backminuten", "Bake minutes", "Minutos")} tid="energia-minutes" val={minutes} set={setMinutes} step="1" suffix="min" />
        <Field label={tri("Prezzo energia", "Energiepreis", "Energy price", "Precio energía")} tid="energia-price" val={price} set={setPrice} step="0.01" suffix="€/kWh" />
        <Field label={tri("Assorbimento medio", "Ø Auslastung", "Avg. duty", "Absorción media")} tid="energia-duty" val={duty} set={setDuty} step="5" suffix="%" />
      </div>
      <div className="mb-4">
        <Field label={tri("Pezzi per infornata", "Stück pro Charge", "Pieces per bake", "Piezas por horneada")} tid="energia-pieces" val={pieces} set={setPieces} step="1" suffix="" />
        <p className="text-[10.5px] text-[#7E8A93] mt-1">{tri("L'assorbimento medio tiene conto del fatto che il forno non consuma sempre alla massima potenza (mantenimento).", "Die Ø-Auslastung berücksichtigt, dass der Ofen nicht immer bei voller Leistung läuft.", "Average duty accounts for the oven not always drawing full power.", "La absorción media considera que el horno no consume siempre a plena potencia.")}</p>
      </div>

      <div className="rounded-3xl bg-gradient-to-br from-[#C0574D] to-[#8f3a32] text-white p-5 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-white/90"><Zap className="w-5 h-5" /> {tri("Energia", "Energie", "Energy", "Energía")}</span>
          <b data-testid="energia-kwh" className="font-mono-data text-2xl">{r.kwh.toFixed(2)} kWh</b>
        </div>
        <div className="flex items-center justify-between border-t border-white/20 pt-3">
          <span className="flex items-center gap-2 text-white/90"><Euro className="w-5 h-5" /> {tri("Costo infornata", "Kosten pro Charge", "Cost per bake", "Coste horneada")}</span>
          <b data-testid="energia-cost" className="font-mono-data text-3xl">€ {r.cost.toFixed(2)}</b>
        </div>
        <div className="flex items-center justify-between border-t border-white/20 pt-3">
          <span className="flex items-center gap-2 text-white/90"><Flame className="w-5 h-5" /> {tri("Costo per pezzo", "Kosten pro Stück", "Cost per piece", "Coste por pieza")}</span>
          <b data-testid="energia-per" className="font-mono-data text-2xl">€ {r.per.toFixed(3)}</b>
        </div>
      </div>
    </div>
  );
}
