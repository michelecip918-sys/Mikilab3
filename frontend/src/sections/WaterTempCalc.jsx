import { useState } from "react";
import { Droplets, Thermometer } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";

function Field({ testid, label, value, onChange, hint }) {
  return (
    <div>
      <label className="text-[11px] font-semibold uppercase tracking-wide text-[#7E8A93]">{label}</label>
      <div className="relative mt-1">
        <input data-testid={testid} type="number" value={value} onChange={(e) => onChange(e.target.value)}
          className="w-full font-mono-data bg-white dark:bg-[#1F252B] border border-[#d5e4f0] dark:border-[#38424B] rounded-xl p-3 pr-8 outline-none focus:border-[#3f7cac]" />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#7E8A93]">°C</span>
      </div>
      {hint ? <p className="text-[10px] text-[#7E8A93] mt-1 leading-snug">{hint}</p> : null}
    </div>
  );
}

// Punto 9 — Calcolatore Temperatura Acqua d'Impasto
// Temp Acqua = (Temp Impasto Desiderata × 3) − (Temp Ambiente + Temp Farina + Riscaldamento Meccanico)
export default function WaterTempCalc() {
  const { lang } = useLang();
  const tri = (i, d, e) => (lang === "de" ? d : lang === "en" ? e : i);
  const [dough, setDough] = useState("24");
  const [ambient, setAmbient] = useState("22");
  const [flour, setFlour] = useState("20");
  const [friction, setFriction] = useState("3");

  const n = (v) => (v === "" || v == null ? 0 : Number(v) || 0);
  const water = Math.round((n(dough) * 3 - (n(ambient) + n(flour) + n(friction))) * 10) / 10;
  const tooCold = water < 0;
  const tooHot = water > 40;

  return (
    <div className="pb-24">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-2xl bg-[#3F7CAC] flex items-center justify-center">
          <Droplets className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-[#2B303B] dark:text-[#e4eff8]">
            {tri("Temperatura Acqua d'Impasto", "Teigwasser-Temperatur", "Dough Water Temperature")}
          </h1>
          <p className="text-sm text-[#7E8A93]">{tri("Trova i gradi giusti dell'acqua", "Finde die richtige Wassertemperatur", "Find the right water temperature")}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field testid="wtc-dough" label={tri("Impasto desiderato", "Zielteig", "Target dough")} value={dough} onChange={setDough} />
        <Field testid="wtc-ambient" label={tri("Ambiente", "Umgebung", "Ambient")} value={ambient} onChange={setAmbient} />
        <Field testid="wtc-flour" label={tri("Farina", "Mehl", "Flour")} value={flour} onChange={setFlour} />
        <Field testid="wtc-friction" label={tri("Riscaldamento meccanico", "Reibungswärme", "Mechanical warming")} value={friction} onChange={setFriction}
          hint={tri("Impastatrice: spirale ~3, tuffante ~1-2, planetaria ~4-6", "Kneter: Spirale ~3, Tauchkneter ~1-2, Planeten ~4-6", "Mixer: spiral ~3, plunger ~1-2, planetary ~4-6")} />
      </div>

      <div data-testid="wtc-result" className="mt-5 bg-gradient-to-br from-[#3F7CAC] to-[#2E5E82] rounded-3xl p-6 text-white shadow-lg text-center">
        <p className="text-white/80 text-sm uppercase tracking-wider font-semibold flex items-center justify-center gap-1">
          <Thermometer className="w-4 h-4" /> {tri("Acqua da usare", "Wasser verwenden", "Use water at")}
        </p>
        <p data-testid="wtc-value" className="font-mono-data text-5xl font-bold mt-1">{water}°C</p>
        <p className="text-white/85 text-sm mt-2 leading-relaxed">
          {tooCold
            ? tri("Serve acqua molto fredda o ghiaccio: abbassa la temperatura di ambiente/farina.", "Sehr kaltes Wasser oder Eis nötig: Umgebungs-/Mehltemperatur senken.", "Very cold water or ice needed: lower ambient/flour temperature.")
            : tooHot
            ? tri("Acqua molto calda: attenzione a non scottare il lievito (max ~40°C).", "Sehr warmes Wasser: Hefe nicht überhitzen (max. ~40°C).", "Very warm water: don't overheat the yeast (max ~40°C).")
            : tri("Formula del fornaio: (Impasto × 3) − (Ambiente + Farina + Attrito).", "Bäckerformel: (Teig × 3) − (Umgebung + Mehl + Reibung).", "Baker's formula: (Dough × 3) − (Ambient + Flour + Friction).")}
        </p>
      </div>
    </div>
  );
}
