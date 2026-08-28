import { mkTri } from "@/i18n/triMaps";
import { useState, useMemo } from "react";
import { ChevronRight, Flame, Droplets, Clock, Info } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";

// Correzioni tipiche del forno di casa rispetto al forno professionale
const OVENS = {
  statico: { it: "Statico (sopra/sotto)", de: "Ober-/Unterhitze", en: "Static (top/bottom)", es: "Estático" },
  ventilato: { it: "Ventilato", de: "Umluft", en: "Fan", es: "Ventilado" },
  gas: { it: "A gas", de: "Gas", en: "Gas", es: "Gas" },
};

export default function SimulatoreForno({ onBack }) {
  const { lang } = useLang();
  const L = (i, d, e, s) => mkTri(lang)(i, d, e, s);
  const inp = "w-full bg-white dark:bg-[#232A31] border border-[#E6D8C3] dark:border-[#38424B] rounded-xl px-3 py-2.5 outline-none text-[#2C1E16] dark:text-[#e4eff8] focus:border-[#D97706] font-mono-data";
  const lbl = "text-[12px] font-semibold text-[#6B5546] dark:text-[#AEB8BF] mb-1";

  const [oven, setOven] = useState("statico");
  const [temp, setTemp] = useState(240);
  const [stone, setStone] = useState(true);
  const [prod, setProd] = useState("pane");

  const r = useMemo(() => {
    // Ventilato asciuga: -10°C consigliato; forno di casa perde calore all'apertura
    const setTempC = oven === "ventilato" ? Number(temp) - 10 : Number(temp);
    const preheat = stone ? 45 : 20;
    const steamMin = prod === "pane" ? 12 : prod === "pizza" ? 0 : 10;
    const dryHint = oven === "ventilato";
    return { setTempC, preheat, steamMin, dryHint };
  }, [oven, temp, stone, prod]);

  const card = "rounded-2xl bg-[#FAF5EC] dark:bg-[#232A31] border border-[#E6D8C3] dark:border-[#38424B] p-4 shadow-sm";

  return (
    <div className="pb-8" data-testid="sim-forno">
      {onBack && <button data-testid="simforno-back" onClick={onBack} className="flex items-center gap-1 text-[#8C4A27] font-medium mb-4"><ChevronRight className="w-5 h-5 rotate-180" /> {L("Indietro", "Zurück", "Back")}</button>}
      <div className="relative overflow-hidden rounded-3xl p-6 text-[#FFFDF9] shadow-xl mb-5" style={{ background: "linear-gradient(135deg,#8C4A27,#6E371C 60%,#4A3222)" }}>
        <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center mb-3"><Flame className="w-7 h-7" /></div>
        <h1 className="font-display text-2xl font-bold">{L("Gestione Vapore & Forno", "Dampf & Ofen", "Steam & Oven", "Vapor y Horno")}</h1>
        <p className="text-[#FFFDF9]/85 text-sm mt-2 leading-snug">{L("Tempistiche esatte per vapore, pietra refrattaria e spiffero: cuoci come un pro anche col forno di casa.", "Genaue Zeiten für Dampf, Stein und Ofen.", "Exact timing for steam, stone and oven quirks.", "Tiempos exactos para vapor, piedra y horno.")}</p>
      </div>

      <div className={card + " mb-4 space-y-3"}>
        <div><p className={lbl}>{L("Tipo di forno", "Ofentyp", "Oven type", "Tipo de horno")}</p>
          <select data-testid="simforno-oven" value={oven} onChange={(e) => setOven(e.target.value)} className={inp}>
            {Object.entries(OVENS).map(([k, v]) => <option key={k} value={k}>{v[lang] || v.it}</option>)}
          </select></div>
        <div className="grid grid-cols-2 gap-3">
          <div><p className={lbl}>{L("Temperatura ricetta (°C)", "Rezept-Temp. (°C)", "Recipe temp (°C)", "Temp. receta (°C)")}</p><input data-testid="simforno-temp" type="number" value={temp} onChange={(e) => setTemp(e.target.value)} className={inp} /></div>
          <div><p className={lbl}>{L("Prodotto", "Produkt", "Product", "Producto")}</p>
            <select data-testid="simforno-prod" value={prod} onChange={(e) => setProd(e.target.value)} className={inp}>
              <option value="pane">{L("Pane", "Brot", "Bread", "Pan")}</option>
              <option value="pizza">{L("Pizza", "Pizza", "Pizza", "Pizza")}</option>
              <option value="dolce">{L("Dolce / lievitato", "Süß", "Sweet", "Dulce")}</option>
            </select></div>
        </div>
        <label className="flex items-center gap-2 text-[13px] font-semibold text-[#6B5546] dark:text-[#AEB8BF]">
          <input data-testid="simforno-stone" type="checkbox" checked={stone} onChange={(e) => setStone(e.target.checked)} className="w-4 h-4 accent-[#8C4A27]" />
          {L("Uso la pietra refrattaria", "Ich nutze den Backstein", "I use a baking stone", "Uso piedra refractaria")}
        </label>
      </div>

      <div data-testid="simforno-result" className="rounded-2xl bg-[#FEF3C7] border border-[#E6D8C3] p-4 space-y-2.5 text-[13.5px] text-[#6B5546]">
        <p className="flex items-center gap-2"><Flame className="w-4.5 h-4.5 text-[#8C4A27]" /><span className="font-bold text-[#8C4A27]">{L("Imposta il forno a:", "Ofen einstellen auf:", "Set the oven to:", "Ajusta el horno a:")} </span><span className="font-mono-data font-bold">{r.setTempC}°C</span>{r.dryHint && ` (${L("ventilato: -10°C perché asciuga di più", "Umluft: -10°C", "fan: -10°C, it dries more", "ventilado: -10°C")})`}</p>
        <p className="flex items-center gap-2"><Clock className="w-4.5 h-4.5 text-[#8C4A27]" /><span className="font-bold text-[#8C4A27]">{L("Preriscalda:", "Vorheizen:", "Preheat:", "Precalienta:")} </span><span className="font-mono-data font-bold">{r.preheat} min</span> {stone ? L("(pietra ben calda)", "(Stein heiß)", "(stone hot)", "(piedra caliente)") : ""}</p>
        <p className="flex items-center gap-2"><Droplets className="w-4.5 h-4.5 text-[#8C4A27]" /><span className="font-bold text-[#8C4A27]">{L("Vapore:", "Dampf:", "Steam:", "Vapor:")} </span>{r.steamMin > 0 ? <><span className="font-mono-data font-bold">{r.steamMin} min</span> {L("all'inizio (teglia con acqua bollente), poi apri e fai uscire il vapore.", "am Anfang, dann Dampf ablassen.", "at the start, then open to release steam.", "al inicio, luego libera el vapor.")}</> : L("niente vapore (crosta sottile).", "kein Dampf.", "no steam.", "sin vapor.")}</p>
        <p className="flex items-start gap-2"><Info className="w-4.5 h-4.5 text-[#8C4A27] shrink-0 mt-0.5" />{L("Spiffero: negli ultimi 5 minuti tieni lo sportello leggermente aperto (cucchiaio di legno) per crosta croccante.", "Spalt: letzte 5 Min Tür leicht offen für knusprige Kruste.", "Vent: last 5 min keep the door slightly open (wooden spoon) for a crisp crust.", "Rendija: últimos 5 min puerta entreabierta para corteza crujiente.")}</p>
      </div>
    </div>
  );
}
