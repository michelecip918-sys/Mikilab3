import { mkTri } from "@/i18n/triMaps";
import { useState, useEffect } from "react";
import { ChevronRight, Camera, Loader2, Play, RotateCcw, TrendingUp } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { uploadApi } from "@/lib/api";
import { toast } from "sonner";

const KEY = "mikilab_timelapse";

export default function TimeLapseTracker({ onBack }) {
  const { lang } = useLang();
  const L = (i, d, e, s) => mkTri(lang)(i, d, e, s);
  const [data, setData] = useState(() => { try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch { return null; } });
  const [rise, setRise] = useState(data?.rise ?? 0);
  const [uploading, setUploading] = useState("");
  const [now, setNow] = useState(Date.now());

  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 60000); return () => clearInterval(id); }, []);
  const save = (d) => { setData(d); try { localStorage.setItem(KEY, JSON.stringify(d)); } catch { /* */ } };

  const start = () => save({ ...(data || {}), started: Date.now(), rise: 0, nowPhoto: null });
  const reset = () => { localStorage.removeItem(KEY); setData(null); setRise(0); };
  const onPhoto = async (e, which) => {
    const f = e.target.files && e.target.files[0]; e.target.value = "";
    if (!f) return; setUploading(which);
    try { const url = await uploadApi.image(f, f.name || "foto.jpg"); save({ ...(data || {}), [which]: url, started: data?.started || Date.now() }); }
    catch { toast.error(L("Caricamento non riuscito", "Upload fehlgeschlagen", "Upload failed", "Error al subir")); }
    finally { setUploading(""); }
  };
  const setRiseVal = (v) => { setRise(v); save({ ...(data || {}), rise: v }); };

  const elapsed = data?.started ? Math.floor((now - data.started) / 60000) : 0;
  const eh = Math.floor(elapsed / 60), em = elapsed % 60;
  const pct = Math.min(100, Math.round((rise / 100) * 100));
  const ready = rise >= 100;
  const R = 54, C = 2 * Math.PI * R;

  return (
    <div className="pb-8" data-testid="timelapse">
      {onBack && <button data-testid="timelapse-back" onClick={onBack} className="flex items-center gap-1 text-[#ff6b00] font-medium mb-4"><ChevronRight className="w-5 h-5 rotate-180" /> {L("Indietro", "Zurück", "Back")}</button>}
      <div className="relative overflow-hidden rounded-3xl p-6 text-[#121212] shadow-xl mb-5" style={{ background: "linear-gradient(135deg,#ff6b00,#ff6b00 60%,#ff6b00)" }}>
        <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center mb-3"><TrendingUp className="w-7 h-7" /></div>
        <h1 className="font-display text-2xl font-bold">{L("Time-Lapse Raddoppio", "Time-Lapse Verdopplung", "Doubling Time-Lapse", "Time-Lapse Duplicado")}</h1>
        <p className="text-[#121212]/85 text-sm mt-2 leading-snug">{L("Fotografa l'impasto all'inizio e adesso, segna quanto è cresciuto: ti dico se ha raddoppiato ed è pronto.", "Fotografiere Start & Jetzt, markiere den Anstieg.", "Photograph start & now, mark the rise: I'll tell you when it's doubled.", "Fotografía inicio y ahora, marca el crecimiento.")}</p>
      </div>

      {/* Progress ring */}
      <div className="flex flex-col items-center mb-5">
        <svg width="140" height="140" viewBox="0 0 140 140" data-testid="timelapse-ring">
          <circle cx="70" cy="70" r={R} fill="none" stroke="#2e2e2e" strokeWidth="12" />
          <circle cx="70" cy="70" r={R} fill="none" stroke={ready ? "#2e8b6f" : "#ff6b00"} strokeWidth="12" strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={C - (pct / 100) * C} transform="rotate(-90 70 70)" style={{ transition: "stroke-dashoffset .5s" }} />
          <text x="70" y="66" textAnchor="middle" className="font-display" fontSize="26" fontWeight="bold" fill="#ff6b00">+{rise}%</text>
          <text x="70" y="88" textAnchor="middle" fontSize="11" fill="#ff6b00">{ready ? L("PRONTO", "FERTIG", "READY", "LISTO") : L("in crescita", "wächst", "rising", "creciendo")}</text>
        </svg>
        <p className="text-[13px] text-[#ff6b00] mt-2">⏱️ {eh ? `${eh}h ` : ""}{em}m {L("dall'inizio", "seit Start", "since start", "desde inicio")}</p>
      </div>

      {/* Slider rise */}
      <div className="rounded-2xl bg-[#121212] dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] p-4 shadow-sm mb-4">
        <p className="text-[12px] font-semibold text-[#ff6b00] dark:text-[#AEB8BF] mb-2">{L("Quanto è cresciuto? (0 = uguale, 100 = raddoppiato)", "Wie stark gewachsen? (100 = verdoppelt)", "How much did it grow? (100 = doubled)", "¿Cuánto creció? (100 = duplicado)")}</p>
        <input data-testid="timelapse-rise" type="range" min="0" max="150" value={rise} onChange={(e) => setRiseVal(Number(e.target.value))} className="w-full accent-[#ff6b00]" />
      </div>

      {/* Photos */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[["startPhoto", L("Inizio", "Start", "Start", "Inicio")], ["nowPhoto", L("Adesso", "Jetzt", "Now", "Ahora")]].map(([k, label]) => (
          <label key={k} data-testid={`timelapse-photo-${k}`} className="rounded-2xl bg-[#121212] dark:bg-[#1e1e1e] border border-dashed border-[#2e2e2e] dark:border-[#2e2e2e] p-3 flex flex-col items-center gap-2 cursor-pointer min-h-[120px] justify-center">
            {data?.[k] ? <img src={data[k]} alt={label} className="w-full h-24 object-cover rounded-xl" /> : (uploading === k ? <Loader2 className="w-6 h-6 animate-spin text-[#ff6b00]" /> : <Camera className="w-7 h-7 text-[#ff6b00]" />)}
            <span className="text-[12px] font-bold text-[#ff6b00]">{label}</span>
            <input type="file" accept="image/*" capture="environment" onChange={(e) => onPhoto(e, k)} className="hidden" />
          </label>
        ))}
      </div>

      <div className="flex gap-2">
        <button data-testid="timelapse-start" onClick={start} className="flex-1 flex items-center justify-center gap-2 bg-[#ff6b00] hover:bg-[#ff6b00] text-[#121212] font-semibold py-3 rounded-2xl active:scale-98 transition-all"><Play className="w-4 h-4" /> {L("Avvia timer", "Timer starten", "Start timer", "Iniciar")}</button>
        <button data-testid="timelapse-reset" onClick={reset} className="px-4 flex items-center justify-center bg-[#1e1e1e] text-[#ff6b00] font-semibold py-3 rounded-2xl active:scale-98 transition-all"><RotateCcw className="w-4 h-4" /></button>
      </div>
    </div>
  );
}
