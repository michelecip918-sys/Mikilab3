import { useState, useMemo } from "react";
import { ChevronRight, CloudSun, Droplets, Clock, MapPin } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";

export default function SmartWeatherBaker({ onBack }) {
  const { lang } = useLang();
  const L = (i, d, e, s) => (lang === "de" ? (d ?? i) : lang === "en" ? (e ?? i) : lang === "es" ? (s ?? e ?? i) : (lang === "fr" || lang === "fa") ? (e ?? i) : i);
  const [city, setCity] = useState("");
  const [temp, setTemp] = useState(22);
  const [humidity, setHumidity] = useState(55);
  const inp = "w-full bg-white dark:bg-[#232A31] border border-[#E6D8C3] dark:border-[#38424B] rounded-xl px-3 py-2.5 outline-none text-[#2C1E16] dark:text-[#e4eff8] focus:border-[#D97706] font-mono-data";
  const lbl = "text-[12px] font-semibold text-[#6B5546] dark:text-[#AEB8BF] mb-1";

  const r = useMemo(() => {
    const T = Number(temp) || 20, H = Number(humidity) || 55;
    // Idratazione: se umidità alta la farina è già umida -> riduci acqua; se secca -> aumenta
    const hydDelta = Math.round((55 - H) / 10); // % punti idratazione
    // Tempi di lievitazione: più caldo = più veloce (fattore su base 24°C)
    const factor = Math.pow(2, (24 - T) / 8); // raddoppia ogni ~8°C sotto i 24
    const bulkBase = 180; // min a 24°C
    const bulk = Math.round(bulkBase * factor);
    const waterTemp = Math.round(64 - T - 20); // regola 60/70 con farina ~20°C
    const hot = T >= 26, cold = T <= 18;
    return { hydDelta, bulk, waterTemp, hot, cold, factor };
  }, [temp, humidity]);

  const fmt = (min) => { const h = Math.floor(min / 60), m = min % 60; return h ? `${h}h ${m ? m + "m" : ""}`.trim() : `${m}m`; };

  return (
    <div className="pb-8" data-testid="weather-baker">
      {onBack && <button data-testid="weather-back" onClick={onBack} className="flex items-center gap-1 text-[#8C4A27] font-medium mb-4"><ChevronRight className="w-5 h-5 rotate-180" /> {L("Indietro", "Zurück", "Back")}</button>}
      <div className="relative overflow-hidden rounded-3xl p-6 text-[#FFFDF9] shadow-xl mb-5" style={{ background: "linear-gradient(135deg,#8C4A27,#B45309 55%,#D97706)" }}>
        <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center mb-3"><CloudSun className="w-7 h-7" /></div>
        <h1 className="font-display text-2xl font-bold">{L("Smart Weather-Baker", "Smart Weather-Baker", "Smart Weather-Baker", "Smart Weather-Baker")}</h1>
        <p className="text-[#FFFDF9]/85 text-sm mt-2 leading-snug">{L("Adatta acqua e lievitazione al clima di casa tua: una giornata fredda in Germania non è come il caldo del Sud Italia.", "Passe Wasser & Gare an dein Klima an.", "Adapt water & proofing to your local climate.", "Adapta agua y fermentación a tu clima.")}</p>
      </div>

      <div className="rounded-2xl bg-[#FAF5EC] dark:bg-[#232A31] border border-[#E6D8C3] dark:border-[#38424B] p-4 shadow-sm mb-4">
        <div className="mb-3"><p className={lbl}><MapPin className="w-3.5 h-3.5 inline mr-1" />{L("Città (facoltativo)", "Stadt (optional)", "City (optional)", "Ciudad (opcional)")}</p>
          <input data-testid="weather-city" value={city} onChange={(e) => setCity(e.target.value)} placeholder={L("es. Stoccarda / Matera", "z.B. Stuttgart", "e.g. Stuttgart / Matera", "p.ej. Stuttgart")} className={inp} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><p className={lbl}>{L("Temperatura (°C)", "Temperatur (°C)", "Temperature (°C)", "Temperatura (°C)")}</p><input data-testid="weather-temp" type="number" value={temp} onChange={(e) => setTemp(e.target.value)} className={inp} /></div>
          <div><p className={lbl}>{L("Umidità (%)", "Feuchte (%)", "Humidity (%)", "Humedad (%)")}</p><input data-testid="weather-humidity" type="number" value={humidity} onChange={(e) => setHumidity(e.target.value)} className={inp} /></div>
        </div>
      </div>

      <div data-testid="weather-result" className="rounded-2xl bg-[#FEF3C7] border border-[#E6D8C3] p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Droplets className="w-5 h-5 text-[#8C4A27]" />
          <p className="text-[13.5px] text-[#6B5546]"><span className="font-bold text-[#8C4A27]">{L("Acqua:", "Wasser:", "Water:", "Agua:")} </span>
            {r.hydDelta === 0 ? L("idratazione invariata (clima neutro).", "Hydratation unverändert.", "hydration unchanged.", "hidratación sin cambios.")
              : r.hydDelta > 0 ? L(`aumenta l'idratazione di ~${r.hydDelta}% (aria secca, la farina beve di più).`, `+${r.hydDelta}% Hydratation (trockene Luft).`, `increase hydration by ~${r.hydDelta}% (dry air).`, `+${r.hydDelta}% de hidratación (aire seco).`)
              : L(`riduci l'idratazione di ~${Math.abs(r.hydDelta)}% (aria umida, impasto già bagnato).`, `${r.hydDelta}% Hydratation (feuchte Luft).`, `reduce hydration by ~${Math.abs(r.hydDelta)}% (humid air).`, `${r.hydDelta}% de hidratación (aire húmedo).`)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#8C4A27]" />
          <p className="text-[13.5px] text-[#6B5546]"><span className="font-bold text-[#8C4A27]">{L("Puntata stimata:", "Stockgare:", "Bulk proof:", "Fermentación:")} </span>
            <span className="font-mono-data font-bold">{fmt(r.bulk)}</span> {L("a", "bei", "at", "a")} {temp}°C.
            {r.hot && " " + L("Fa caldo: accorcia i tempi e usa acqua fredda.", "Warm: Zeiten kürzen, kaltes Wasser.", "Hot: shorten times, use cold water.", "Calor: acorta tiempos, agua fría.")}
            {r.cold && " " + L("Fa freddo: allunga i tempi o cerca un punto più caldo.", "Kalt: Zeiten verlängern.", "Cold: extend times or find a warmer spot.", "Frío: alarga los tiempos.")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CloudSun className="w-5 h-5 text-[#8C4A27]" />
          <p className="text-[13.5px] text-[#6B5546]"><span className="font-bold text-[#8C4A27]">{L("Temperatura acqua consigliata:", "Empf. Wassertemp.:", "Suggested water temp:", "Temp. agua sugerida:")} </span><span className="font-mono-data font-bold">{r.waterTemp}°C</span></p>
        </div>
        {city && <p className="text-[11px] text-[#8C7362] italic">📍 {city}</p>}
      </div>
    </div>
  );
}
