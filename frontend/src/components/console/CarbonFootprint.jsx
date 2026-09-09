import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Leaf, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { mikeApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// v14 · Carbon Footprint — CO2 per quintale di pane, per marketing ecologico.
export default function CarbonFootprint() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [f, setF] = useState({ bread_kg: "100", oven_hours: "3", flour_kg: "65", pieces: "200", energy_source: "electric" });
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState(null);

  const compute = useCallback(async () => {
    setBusy(true);
    try {
      const r = await mikeApi.carbonCompute({
        bread_kg: Number(f.bread_kg) || 100, oven_hours: Number(f.oven_hours) || 0,
        flour_kg: Number(f.flour_kg) || 0, pieces: Number(f.pieces) || 0, energy_source: f.energy_source, lang,
      });
      setRes(r);
    } catch { toast.error(tri("Calcolo non riuscito", "Berechnung fehlgeschlagen", "Compute failed", "Cálculo fallido", "Échec du calcul", "محاسبه ناموفق")); }
    setBusy(false);
  }, [f, lang, tri]);

  const inp = "bg-[#0C1019] border border-[#5E8CA8]/30 rounded-lg px-2.5 py-2 text-sm text-white outline-none";
  const Field = ({ tid, label, k, suf }) => (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] text-[#7d97ac] uppercase tracking-wide">{label}</span>
      <span className="flex items-center gap-1 bg-[#0C1019] border border-[#5E8CA8]/30 rounded-lg px-2.5 py-2">
        <input data-testid={tid} type="number" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} className="w-full bg-transparent text-sm text-white outline-none" />
        {suf && <span className="text-[10px] text-[#64748b]">{suf}</span>}
      </span>
    </label>
  );

  return (
    <div data-testid="carbon-footprint" className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Field tid="carbon-bread" label={tri("Pane prodotto", "Brot produziert", "Bread made", "Pan producido", "Pain produit", "نان تولیدی")} k="bread_kg" suf="kg" />
        <Field tid="carbon-oven" label={tri("Ore forno", "Ofenstunden", "Oven hours", "Horas horno", "Heures four", "ساعت فر")} k="oven_hours" suf="h" />
        <Field tid="carbon-flour" label={tri("Farina", "Mehl", "Flour", "Harina", "Farine", "آرد")} k="flour_kg" suf="kg" />
        <Field tid="carbon-pieces" label={tri("Pezzi imballati", "Verpackte Stück", "Packed pieces", "Piezas", "Pièces", "بسته‌بندی")} k="pieces" suf="pz" />
      </div>
      <div className="flex gap-2">
        {["electric", "gas"].map((s) => (
          <button key={s} data-testid={`carbon-energy-${s}`} onClick={() => setF({ ...f, energy_source: s })}
            className={`flex-1 py-2 rounded-lg text-xs font-bold border active:scale-95 ${f.energy_source === s ? "bg-[#5E8CA8]/20 border-[#5E8CA8]/60 text-[#9fc3dc]" : "bg-[#030712] border-[#1e293b] text-[#64748b]"}`}>
            {s === "electric" ? tri("Forno elettrico", "Elektroofen", "Electric oven", "Horno eléctrico", "Four électrique", "فر برقی") : tri("Forno a gas", "Gasofen", "Gas oven", "Horno de gas", "Four à gaz", "فر گازی")}
          </button>
        ))}
      </div>
      <button data-testid="carbon-compute" onClick={compute} disabled={busy} className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#22c55e]/15 border border-[#22c55e]/50 text-[#22c55e] font-black text-sm active:scale-95 disabled:opacity-50">
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Leaf className="w-4 h-4" />} {tri("Calcola CO₂", "CO₂ berechnen", "Compute CO₂", "Calcular CO₂", "Calculer CO₂", "محاسبه CO₂")}
      </button>

      {res && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} data-testid="carbon-result" className="rounded-xl border border-[#22c55e]/40 bg-[#22c55e]/5 p-3">
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-widest text-[#22c55e]">{tri("CO₂ per quintale", "CO₂ pro Zentner", "CO₂ per 100 kg", "CO₂ por quintal", "CO₂ par quintal", "CO₂ در هر صد کیلو")}</p>
            <p data-testid="carbon-per-quintal" className="text-4xl font-black text-white tabular-nums">{res.co2_per_quintal_kg} <span className="text-lg text-[#22c55e]">kg</span></p>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            {[["energy", tri("Energia", "Energie", "Energy", "Energía", "Énergie", "انرژی")], ["flour", tri("Farina", "Mehl", "Flour", "Harina", "Farine", "آرد")], ["packaging", tri("Imballo", "Verpackung", "Packaging", "Embalaje", "Emballage", "بسته‌بندی")]].map(([k, lbl]) => (
              <div key={k} className="rounded-lg bg-[#030712] border border-[#1e293b] py-2">
                <p className="text-[10px] text-[#64748b] uppercase">{lbl}</p>
                <p className="text-sm font-bold text-white">{res.breakdown_kg[k]} kg</p>
              </div>
            ))}
          </div>
          <p data-testid="carbon-statement" className="mt-3 text-[12px] text-[#a7f3d0] leading-snug flex items-start gap-1.5"><Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#22c55e]" /> {res.statement}</p>
          <div className="mt-3 rounded-lg border border-[#FFB800]/30 bg-[#FFB800]/5 p-2.5">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-[#8aa0b4]">{tri("Costo energia / kg cotto", "Energiekosten / kg", "Energy cost / kg baked", "Coste energía / kg", "Coût énergie / kg", "هزینه انرژی / کیلو")}</span>
              <b data-testid="carbon-cost-kg" className="text-[#FFB800]">€ {res.cost_per_kg_eur}</b>
            </div>
            <p className="mt-1 text-[11px] text-[#c9dbe8]">⚡ {res.optimal_slot}</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
