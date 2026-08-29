import { useState, useCallback } from "react";
import { CloudSun, Droplets, Thermometer, Timer, MapPin, Loader2, Wind } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// Punto 12 — Intelligenza Predittiva Meteo (Open-Meteo, nessuna chiave).
// Adatta automaticamente la temperatura dell'acqua e i tempi di lievitazione
// in base a temperatura e umidità esterne.

export default function Meteo() {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [w, setW] = useState(null); // { temp, humidity, wind, place }
  const [city, setCity] = useState("");
  const [target, setTarget] = useState("24"); // temp impasto desiderata
  const [baseMin, setBaseMin] = useState("120"); // tempo lievitazione a 24°C

  const fetchWeather = useCallback(async (lat, lon, place) => {
    setLoading(true); setErr("");
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 9000);
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m`;
      const res = await fetch(url, { signal: ctrl.signal });
      const j = await res.json();
      const c = j.current || {};
      setW({ temp: c.temperature_2m, humidity: c.relative_humidity_2m, wind: c.wind_speed_10m, place: place || tri("La tua posizione", "Dein Standort", "Your location") });
    } catch {
      setErr(tri("Impossibile recuperare il meteo. Riprova.", "Wetter konnte nicht geladen werden. Erneut versuchen.", "Could not fetch weather. Try again."));
    } finally { clearTimeout(to); setLoading(false); }
  }, [tri]); // eslint-disable-line react-hooks/exhaustive-deps

  const useGeo = () => {
    setErr("");
    if (!navigator.geolocation) { setErr(tri("Geolocalizzazione non disponibile.", "Standort nicht verfügbar.", "Geolocation not available.")); return; }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
      () => { setLoading(false); setErr(tri("Permesso posizione negato. Cerca una città.", "Standort verweigert. Suche eine Stadt.", "Location denied. Search a city.")); },
      { timeout: 8000 }
    );
  };

  const searchCity = async () => {
    if (!city.trim()) return;
    setLoading(true); setErr("");
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 9000);
    try {
      const g = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=${lang}`, { signal: ctrl.signal });
      const gj = await g.json();
      const r = gj.results && gj.results[0];
      if (!r) { setErr(tri("Città non trovata.", "Stadt nicht gefunden.", "City not found.")); setLoading(false); clearTimeout(to); return; }
      clearTimeout(to);
      fetchWeather(r.latitude, r.longitude, `${r.name}${r.country ? ", " + r.country : ""}`);
    } catch {
      clearTimeout(to);
      setErr(tri("Ricerca non riuscita.", "Suche fehlgeschlagen.", "Search failed."));
      setLoading(false);
    }
  };

  const n = (v) => (v === "" || v == null ? 0 : Number(v) || 0);
  const ambient = w ? Number(w.temp) : null;
  const humidity = w ? Number(w.humidity) : null;

  // Acqua consigliata: (impasto × 3) − (ambiente + farina≈ambiente + attrito 3)
  const water = ambient != null ? Math.round((n(target) * 3 - (ambient + ambient + 3)) * 10) / 10 : null;
  // Tempo lievitazione: la velocità circa raddoppia ogni ~8°C sopra 24°C
  const factor = ambient != null ? Math.pow(2, (ambient - 24) / 8) : 1;
  const adjMin = ambient != null ? Math.round(n(baseMin) / factor) : null;
  const faster = factor > 1;
  // Umidità: alta → impasto più molle, ridurre acqua
  const humNote = humidity == null ? "" : humidity >= 70
    ? tri("Umidità alta: riduci l'acqua dell'1-2% e infarina di più.", "Hohe Luftfeuchte: Wasser um 1-2% reduzieren und mehr bemehlen.", "High humidity: reduce water by 1-2% and flour more.")
    : humidity <= 40
    ? tri("Aria secca: puoi aumentare l'acqua dell'1-2% e coprire bene gli impasti.", "Trockene Luft: Wasser um 1-2% erhöhen, Teige gut abdecken.", "Dry air: you can add 1-2% water and cover doughs well.")
    : tri("Umidità nella norma: nessuna correzione dell'acqua.", "Normale Feuchte: keine Wasserkorrektur.", "Normal humidity: no water correction.");

  const inp = "w-full bg-[#121212] dark:bg-[#181818] border border-[#2b2b2b] dark:border-[#2e2e2e] rounded-xl px-3 py-2.5 font-mono-data outline-none text-[#2B303B] dark:text-[#e4eff8] focus:border-[#ff6b00]";

  return (
    <div className="pb-40">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-2xl bg-[#ff6b00] flex items-center justify-center"><CloudSun className="w-6 h-6 text-white" /></div>
        <div>
          <h1 className="font-display text-2xl font-bold text-[#2B303B] dark:text-[#e4eff8]">{tri("Meteo & Laboratorio", "Wetter & Backstube", "Weather & Bakery")}</h1>
          <p className="text-sm text-[#7E8A93]">{tri("Adatta acqua e lievitazione al clima di oggi", "Wasser & Gärung an das heutige Klima anpassen", "Adapt water & proofing to today's climate")}</p>
        </div>
      </div>

      {/* Sorgente meteo */}
      <button data-testid="meteo-geo" onClick={useGeo} disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-[#ff6b00] hover:bg-[#ff8a33] disabled:opacity-50 text-white font-semibold py-3 rounded-2xl active:scale-98 transition-all mb-3">
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <MapPin className="w-5 h-5" />}
        {tri("Usa la mia posizione", "Meinen Standort verwenden", "Use my location")}
      </button>
      <div className="grid grid-cols-[1fr_auto] gap-2 mb-3">
        <input data-testid="meteo-city" value={city} onChange={(e) => setCity(e.target.value)} onKeyDown={(e) => e.key === "Enter" && searchCity()}
          placeholder={tri("Cerca città…", "Stadt suchen…", "Search city…")} className={inp.replace("font-mono-data ", "")} />
        <button data-testid="meteo-search" onClick={searchCity} disabled={loading}
          className="px-4 rounded-xl bg-white dark:bg-[#1e1e1e] border border-[#2b2b2b] dark:border-[#2e2e2e] font-semibold text-[#2B303B] dark:text-[#e4eff8] disabled:opacity-50">
          {tri("Cerca", "Suchen", "Search")}
        </button>
      </div>

      {err && <p data-testid="meteo-error" className="text-sm text-[#E4572E] mb-3">{err}</p>}

      {w && (
        <>
          {/* Card meteo attuale */}
          <div data-testid="meteo-current" className="rounded-3xl bg-gradient-to-br from-[#ff6b00] to-[#ff8a33] text-white p-5 shadow-lg mb-4">
            <p className="text-white/85 text-sm font-semibold flex items-center gap-1"><MapPin className="w-4 h-4" /> {w.place}</p>
            <div className="grid grid-cols-3 gap-2 mt-3 text-center">
              <div><Thermometer className="w-5 h-5 mx-auto mb-1 opacity-80" /><p data-testid="meteo-temp" className="font-mono-data text-2xl font-bold">{Math.round(w.temp)}°C</p><p className="text-[10px] text-white/70 uppercase">{tri("Temp", "Temp", "Temp")}</p></div>
              <div><Droplets className="w-5 h-5 mx-auto mb-1 opacity-80" /><p data-testid="meteo-hum" className="font-mono-data text-2xl font-bold">{Math.round(w.humidity)}%</p><p className="text-[10px] text-white/70 uppercase">{tri("Umidità", "Feuchte", "Humidity")}</p></div>
              <div><Wind className="w-5 h-5 mx-auto mb-1 opacity-80" /><p className="font-mono-data text-2xl font-bold">{Math.round(w.wind)}</p><p className="text-[10px] text-white/70 uppercase">km/h</p></div>
            </div>
          </div>

          {/* Parametri impasto */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <label className="text-[11px] font-semibold uppercase text-[#7E8A93]">{tri("Impasto desiderato °C", "Zielteig °C", "Target dough °C")}
              <input data-testid="meteo-target" type="number" value={target} onChange={(e) => setTarget(e.target.value)} className={inp + " mt-1"} /></label>
            <label className="text-[11px] font-semibold uppercase text-[#7E8A93]">{tri("Lievitazione base (min a 24°)", "Basis-Gärung (Min bei 24°)", "Base proof (min at 24°)")}
              <input data-testid="meteo-basemin" type="number" value={baseMin} onChange={(e) => setBaseMin(e.target.value)} className={inp + " mt-1"} /></label>
          </div>

          {/* Consigli IA */}
          <div data-testid="meteo-advice" className="space-y-3">
            <div className="rounded-2xl bg-white dark:bg-[#1e1e1e] border border-[#2b2b2b] dark:border-[#2e2e2e] p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#ff6b00]/15 flex items-center justify-center shrink-0"><Droplets className="w-5 h-5 text-[#ff6b00]" /></div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wide text-[#7E8A93]">{tri("Acqua consigliata", "Empfohlenes Wasser", "Recommended water")}</p>
                <p data-testid="meteo-water" className="font-mono-data text-2xl font-bold text-[#2B303B] dark:text-[#e4eff8]">{water}°C</p>
                <p className="text-xs text-[#7E8A93] leading-snug">{humNote}</p>
              </div>
            </div>
            <div className="rounded-2xl bg-white dark:bg-[#1e1e1e] border border-[#2b2b2b] dark:border-[#2e2e2e] p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#ff6b00]/15 flex items-center justify-center shrink-0"><Timer className="w-5 h-5 text-[#ff6b00]" /></div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wide text-[#7E8A93]">{tri("Lievitazione stimata", "Geschätzte Gärung", "Estimated proof")}</p>
                <p data-testid="meteo-prooftime" className="font-mono-data text-2xl font-bold text-[#2B303B] dark:text-[#e4eff8]">{adjMin} min</p>
                <p className="text-xs text-[#7E8A93] leading-snug">
                  {faster
                    ? tri("Fa caldo: la lievitazione accelera, controlla prima.", "Es ist warm: Gärung beschleunigt, früher prüfen.", "It's warm: proofing speeds up, check earlier.")
                    : tri("Fa fresco: la lievitazione rallenta, allunga i tempi.", "Es ist kühl: Gärung verlangsamt, Zeiten verlängern.", "It's cool: proofing slows down, extend times.")}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
