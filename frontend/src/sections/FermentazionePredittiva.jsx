import { useState, useCallback, useMemo, useEffect } from "react";
import { Activity, MapPin, Loader2, Thermometer, Percent, Bell, Sparkles, CloudSun } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { useTimers } from "@/audio/TimerContext";
import { toast } from "sonner";
import { mkTri } from "@/i18n/triMaps";

// Fermentazione Predittiva — modello Q10 (la lievitazione accelera/rallenta col calore)
// + meteo automatico (Open-Meteo, nessuna chiave) + promemoria "impasto pronto".
const PREF_TYPES = [
  { id: "diretto", it: "Lievito di birra (diretto)", de: "Hefe (direkt)", en: "Yeast (direct)", es: "Levadura (directo)" },
  { id: "madre", it: "Lievito madre", de: "Sauerteig", en: "Sourdough", es: "Masa madre" },
  { id: "poolish", it: "Poolish", de: "Poolish", en: "Poolish", es: "Poolish" },
  { id: "biga", it: "Biga", de: "Biga", en: "Biga", es: "Biga" },
];

export default function FermentazionePredittiva() {
  const { lang } = useLang();
  const tri = (i, d, e, s) => mkTri(lang)(i, d, e, s);
  const { addTimer, remove: removeTimer } = useTimers();

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [w, setW] = useState(null);
  const [city, setCity] = useState("");
  const [doughT, setDoughT] = useState("24");
  const [ambientT, setAmbientT] = useState("");
  const [yeast, setYeast] = useState("1");
  const [type, setType] = useState("diretto");
  const [level, setLevel] = useState("double");
  const [run, setRun] = useState(() => { try { return JSON.parse(localStorage.getItem("mikilab_ferment_run") || "null"); } catch { return null; } });
  const [nowTs, setNowTs] = useState(Date.now());
  useEffect(() => {
    if (!run) return;
    const id = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(id);
  }, [run]);

  const fetchWeather = useCallback(async (lat, lon, place) => {
    setLoading(true); setErr("");
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 9000);
    try {
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m`, { signal: ctrl.signal });
      const j = await res.json();
      const c = j.current || {};
      setW({ temp: c.temperature_2m, humidity: c.relative_humidity_2m, place: place || tri("La tua posizione", "Dein Standort", "Your location", "Tu ubicación") });
      if (c.temperature_2m != null) setAmbientT(String(Math.round(c.temperature_2m)));
    } catch {
      setErr(tri("Impossibile recuperare il meteo. Inserisci la temperatura a mano.", "Wetter nicht abrufbar. Temperatur manuell eingeben.", "Could not fetch weather. Enter temperature manually.", "No se pudo obtener el clima. Introduce la temperatura a mano."));
    } finally { clearTimeout(to); setLoading(false); }
  }, [tri]); // eslint-disable-line react-hooks/exhaustive-deps

  const useGeo = () => {
    setErr("");
    if (!navigator.geolocation) { setErr(tri("Geolocalizzazione non disponibile.", "Standort nicht verfügbar.", "Geolocation not available.", "Geolocalización no disponible.")); return; }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
      () => { setLoading(false); setErr(tri("Permesso posizione negato. Cerca una città o inserisci la temperatura.", "Standort verweigert. Stadt suchen oder Temperatur eingeben.", "Location denied. Search a city or enter temperature.", "Ubicación denegada. Busca una ciudad o introduce la temperatura.")); },
      { timeout: 8000 }
    );
  };

  const searchCity = async () => {
    if (!city.trim()) return;
    setLoading(true); setErr("");
    try {
      const g = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=5&language=${lang}`);
      const gj = await g.json();
      const results = (gj.results || []).slice().sort((a, b) => (b.population || 0) - (a.population || 0));
      const r = results[0];
      if (!r) { setErr(tri("Città non trovata.", "Stadt nicht gefunden.", "City not found.", "Ciudad no encontrada.")); setLoading(false); return; }
      fetchWeather(r.latitude, r.longitude, `${r.name}${r.country ? ", " + r.country : ""}`);
    } catch { setErr(tri("Ricerca non riuscita.", "Suche fehlgeschlagen.", "Search failed.", "Búsqueda fallida.")); setLoading(false); }
  };

  // ---- Modello Q10 ----
  const est = useMemo(() => {
    const n = (v) => (v === "" || v == null ? NaN : Number(v));
    const y = Math.max(n(yeast) || 0, 0.05);
    let base; // minuti a 24°C per RADDOPPIO
    if (type === "madre") base = 240 * (20 / Math.max(y, 5));
    else if (type === "poolish") base = 120 * (0.8 / Math.min(y, 3));
    else if (type === "biga") base = 150 * (0.8 / Math.min(y, 3));
    else base = 120 * (0.8 / y);
    const levelFactor = level === "plus50" ? 0.6 : 1;
    const Tf = !isNaN(n(doughT)) ? n(doughT) : (!isNaN(n(ambientT)) ? n(ambientT) : 24);
    const factor = Math.pow(2, (Tf - 24) / 8); // caldo → più veloce
    const minutes = Math.max(10, Math.round((base * levelFactor) / factor));
    return { minutes, Tf, factor };
  }, [yeast, type, level, doughT, ambientT]);

  const readyAt = useMemo(() => {
    const d = new Date(Date.now() + est.minutes * 60000);
    return d.toLocaleTimeString(mkTri(lang)("it-IT", "de-DE", "en-GB", "es-ES"), { hour: "2-digit", minute: "2-digit" });
  }, [est.minutes, lang]);

  const hh = Math.floor(est.minutes / 60);
  const mm = est.minutes % 60;
  const timeStr = hh > 0 ? `${hh}h ${mm.toString().padStart(2, "0")}m` : `${mm}m`;

  const startReminder = () => {
    try { if ("Notification" in window && Notification.permission === "default") Notification.requestPermission(); } catch { /* */ }
    const timerId = addTimer(tri("Impasto pronto 🍞", "Teig fertig 🍞", "Dough ready 🍞", "Masa lista 🍞"), est.minutes);
    const r = { startedAt: Date.now(), minutes: est.minutes, timerId };
    setRun(r); setNowTs(Date.now());
    try { localStorage.setItem("mikilab_ferment_run", JSON.stringify(r)); } catch { /* */ }
    toast.success(tri(`Ti avviso alle ${readyAt} quando l'impasto è pronto.`, `Ich melde mich um ${readyAt}, wenn der Teig fertig ist.`, `I'll alert you at ${readyAt} when the dough is ready.`, `Te aviso a las ${readyAt} cuando la masa esté lista.`));
  };
  const cancelRun = () => { try { if (run && run.timerId) removeTimer(run.timerId); } catch { /* */ } setRun(null); try { localStorage.removeItem("mikilab_ferment_run"); } catch { /* */ } };

  // Progresso live della lievitazione in corso.
  const progress = run ? Math.max(0, Math.min(1, (nowTs - run.startedAt) / (run.minutes * 60000))) : null;
  const remainMin = run ? Math.max(0, Math.round((run.startedAt + run.minutes * 60000 - nowTs) / 60000)) : 0;

  // Curva sigmoide (visualizzazione lievitazione nel tempo)
  const W = 320, H = 120, pad = 8;
  const sig = (x) => 1 / (1 + Math.exp(-10 * (x - 0.5)));
  const pts = Array.from({ length: 41 }, (_, i) => {
    const x = i / 40;
    const px = pad + x * (W - 2 * pad);
    const py = H - pad - sig(x) * (H - 2 * pad);
    return `${px.toFixed(1)},${py.toFixed(1)}`;
  }).join(" ");

  const warm = est.Tf >= 25;
  const inp = "w-full bg-[#0D1520] dark:bg-[#1B2A38] border border-[#2A3B49] dark:border-[#2A3B49] rounded-2xl shadow-md border border-amber-900/40 px-3 py-2.5 outline-none text-[#2B303B] dark:text-[#e4eff8] focus:border-[#3E9C93]";

  return (
    <div className="pb-40" data-testid="fermentazione-tool">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-2xl bg-[#3E9C93] flex items-center justify-center"><Activity className="w-6 h-6 text-white" /></div>
        <div>
          <h1 className="font-display text-2xl font-bold text-[#2B303B] dark:text-[#e4eff8]">{tri("Fermentazione Predittiva", "Gärungs-Prognose", "Fermentation Forecast", "Fermentación Predictiva")}</h1>
          <p className="text-sm text-[#7E8A93]">{tri("Quanto lieviterà oggi e a che ora è pronto", "Wie lange die Gare heute dauert und wann fertig", "How long proofing takes today and when it's ready", "Cuánto leudará hoy y a qué hora está lista")}</p>
        </div>
      </div>

      {/* Meteo automatico */}
      <button data-testid="ferment-geo" onClick={useGeo} disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-[#3E9C93] hover:bg-[#64748B] disabled:opacity-50 text-white font-semibold py-3 rounded-2xl active:scale-98 transition-all mb-2">
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <MapPin className="w-5 h-5" />}
        {tri("Usa il meteo della mia zona", "Wetter meiner Gegend", "Use my local weather", "Usar el clima de mi zona")}
      </button>
      <div className="grid grid-cols-[1fr_auto] gap-2 mb-2">
        <input data-testid="ferment-city" value={city} onChange={(e) => setCity(e.target.value)} onKeyDown={(e) => e.key === "Enter" && searchCity()}
          placeholder={tri("…oppure cerca città", "…oder Stadt suchen", "…or search city", "…o busca ciudad")} className={inp} />
        <button data-testid="ferment-city-search" onClick={searchCity} disabled={loading} className="px-4 rounded-2xl shadow-md border border-amber-900/40 bg-white dark:bg-[#1B2A38] border border-[#2A3B49] dark:border-[#2A3B49] font-semibold text-[#2B303B] dark:text-[#e4eff8] disabled:opacity-50">{tri("Cerca", "Suchen", "Search", "Buscar")}</button>
      </div>
      {err && <p data-testid="ferment-error" className="text-sm text-[#E4572E] mb-2">{err}</p>}
      {w && (
        <div data-testid="ferment-weather" className="flex items-center gap-2 text-sm text-[#3E9C93] dark:text-[#a9d2ec] bg-[#3E9C93]/12 border border-[#3E9C93]/30 rounded-2xl shadow-md border border-amber-900/40 px-3 py-2 mb-3">
          <CloudSun className="w-4 h-4" /> {w.place}: <b>{Math.round(w.temp)}°C</b>{w.humidity != null && <span className="text-[#7E8A93]">· {Math.round(w.humidity)}% {tri("umidità", "Feuchte", "humidity", "humedad")}</span>}
        </div>
      )}

      {/* Parametri */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <label className="text-[11px] font-semibold uppercase text-[#7E8A93] flex flex-col gap-1"><span className="flex items-center gap-1"><Thermometer className="w-3.5 h-3.5" />{tri("Temp. impasto °C", "Teig-Temp. °C", "Dough temp °C", "Temp. masa °C")}</span>
          <input data-testid="ferment-dough-temp" type="number" value={doughT} onChange={(e) => setDoughT(e.target.value)} className={inp} /></label>
        <label className="text-[11px] font-semibold uppercase text-[#7E8A93] flex flex-col gap-1"><span className="flex items-center gap-1"><CloudSun className="w-3.5 h-3.5" />{tri("Temp. ambiente °C", "Umgebung °C", "Ambient °C", "Ambiente °C")}</span>
          <input data-testid="ferment-ambient-temp" type="number" value={ambientT} onChange={(e) => setAmbientT(e.target.value)} placeholder={tri("auto/meteo", "auto/Wetter", "auto/weather", "auto/clima")} className={inp} /></label>
        <label className="text-[11px] font-semibold uppercase text-[#7E8A93] flex flex-col gap-1"><span className="flex items-center gap-1"><Percent className="w-3.5 h-3.5" />{type === "madre" ? tri("% lievito madre", "% Sauerteig", "% sourdough", "% masa madre") : tri("% lievito", "% Hefe", "% yeast", "% levadura")}</span>
          <input data-testid="ferment-yeast" type="number" step="0.1" min="0.1" value={yeast} onChange={(e) => setYeast(e.target.value)} className={inp} /></label>
        <label className="text-[11px] font-semibold uppercase text-[#7E8A93] flex flex-col gap-1"><span>{tri("Tipo", "Typ", "Type", "Tipo")}</span>
          <select data-testid="ferment-type" value={type} onChange={(e) => setType(e.target.value)} className={inp}>
            {PREF_TYPES.map((p) => <option key={p.id} value={p.id}>{tri(p.it, p.de, p.en, p.es)}</option>)}
          </select></label>
      </div>
      <div className="flex gap-2 mb-4">
        {[["double", tri("Raddoppio", "Verdopplung", "Double", "Duplica")], ["plus50", tri("+50% volume", "+50% Volumen", "+50% volume", "+50% volumen")]].map(([id, lbl]) => (
          <button key={id} data-testid={`ferment-level-${id}`} onClick={() => setLevel(id)}
            className={`flex-1 py-2 rounded-2xl shadow-md border border-amber-900/40 text-sm font-semibold border transition-all active:scale-98 ${level === id ? "bg-[#3E9C93] text-white border-[#3E9C93]" : "bg-white dark:bg-[#1B2A38] text-[#7E8A93] border-[#2A3B49] dark:border-[#2A3B49]"}`}>{lbl}</button>
        ))}
      </div>

      {/* Risultato + curva */}
      <div className="rounded-3xl bg-gradient-to-br from-[#3E9C93] to-[#64748B] text-white p-5 shadow-lg mb-4">
        <p className="text-white/85 text-xs font-semibold uppercase tracking-wide">{tri("Tempo stimato di lievitazione", "Geschätzte Gärzeit", "Estimated proofing time", "Tiempo estimado")}</p>
        <div className="flex items-end justify-between mt-1">
          <p data-testid="ferment-time" className="font-mono-data text-4xl font-bold leading-none">{timeStr}</p>
          <p className="text-right text-sm text-white/90">{tri("pronto verso", "fertig gegen", "ready by", "listo hacia")}<br /><b data-testid="ferment-ready" className="text-xl font-mono-data">{readyAt}</b></p>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-24 mt-3" preserveAspectRatio="none" aria-hidden>
          <polyline points={pts} fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2.5" />
          <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
          {progress != null && (() => {
            const dx = pad + progress * (W - 2 * pad);
            const dy = H - pad - sig(progress) * (H - 2 * pad);
            return (<g><line x1={dx} y1={pad} x2={dx} y2={H - pad} stroke="#F2C14E" strokeWidth="1.5" strokeDasharray="3 3" /><circle cx={dx} cy={dy} r="6" fill="#F2C14E" stroke="#fff" strokeWidth="2" /></g>);
          })()}
        </svg>
        {progress != null ? (
          <div data-testid="ferment-live" className="mt-1 flex items-center justify-between text-[13px]">
            <span className="text-white/90">{tri("Lievitazione", "Gärung", "Proofing", "Fermentación")}: <b>{Math.round(progress * 100)}%</b></span>
            <span className="text-white/90">{progress >= 1 ? tri("pronto! 🍞", "fertig! 🍞", "ready! 🍞", "¡lista! 🍞") : `${tri("mancano", "noch", "left", "faltan")} ${remainMin >= 60 ? Math.floor(remainMin / 60) + "h " + (remainMin % 60) + "m" : remainMin + "m"}`}</span>
          </div>
        ) : (
          <p className="text-[11px] text-white/80 mt-1">{tri("Impasto", "Teig", "Dough", "Masa")} → {tri("raddoppio", "verdoppelt", "doubled", "duplicado")}</p>
        )}
      </div>

      <div data-testid="ferment-note" className="rounded-2xl bg-white dark:bg-[#1B2A38] border border-[#2A3B49] dark:border-[#2A3B49] p-4 mb-4 flex items-start gap-2">
        <Sparkles className="w-4 h-4 text-[#3E9C93] shrink-0 mt-0.5" />
        <p className="text-sm text-[#3F4A54] dark:text-[#AEB8BF] leading-relaxed">
          {est.Tf > 45 && <b className="text-[#E4572E]">{tri("Attenzione: oltre i 45°C il lievito muore. ", "Achtung: über 45°C stirbt die Hefe. ", "Warning: above 45°C the yeast dies. ", "Atención: por encima de 45°C la levadura muere. ")}</b>}
          {warm
            ? tri(`A ${Math.round(est.Tf)}°C la lievitazione è veloce: controlla l'impasto un po' prima, meglio 10 minuti in anticipo che troppo tardi.`, `Bei ${Math.round(est.Tf)}°C geht es schnell: Teig etwas früher prüfen.`, `At ${Math.round(est.Tf)}°C proofing is fast: check the dough a bit earlier.`, `A ${Math.round(est.Tf)}°C la fermentación es rápida: revisa la masa un poco antes.`)
            : tri(`A ${Math.round(est.Tf)}°C la lievitazione è lenta: dai tempo all'impasto, valuta un luogo più caldo se hai fretta.`, `Bei ${Math.round(est.Tf)}°C ist die Gare langsam: dem Teig Zeit geben.`, `At ${Math.round(est.Tf)}°C proofing is slow: give the dough time.`, `A ${Math.round(est.Tf)}°C la fermentación es lenta: dale tiempo a la masa.`)}
          {" "}
          {tri("Stima indicativa: la maturazione va sempre valutata a vista e al tatto.", "Richtwert: immer per Auge und Griff prüfen.", "Guidance only: always judge by sight and touch.", "Orientativo: valora siempre a la vista y al tacto.")}
        </p>
      </div>

      {run ? (
        <button data-testid="ferment-cancel" onClick={cancelRun}
          className="w-full flex items-center justify-center gap-2 bg-white dark:bg-[#1B2A38] border border-[#3E9C93]/40 text-[#3E9C93] font-bold py-4 rounded-2xl active:scale-98 transition-all">
          <Bell className="w-5 h-5" /> {tri("Annulla il promemoria", "Erinnerung abbrechen", "Cancel the reminder", "Cancelar el aviso")}
        </button>
      ) : (
        <button data-testid="ferment-remind" onClick={startReminder}
          className="w-full flex items-center justify-center gap-2 bg-[#3E9C93] hover:bg-[#a66f20] text-white font-bold py-4 rounded-2xl active:scale-98 transition-all">
          <Bell className="w-5 h-5" /> {tri("Avvisami quando è pronto", "Erinnere mich, wenn fertig", "Alert me when ready", "Avísame cuando esté lista")}
        </button>
      )}
    </div>
  );
}
