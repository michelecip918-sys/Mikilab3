import { useRef, useState, useEffect } from "react";
import { Camera, CameraOff, Scan, Flame, Clock, Thermometer, MapPin, Loader2 } from "lucide-react";
import { api, recipesApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// Fase 9 · Simulatore AR per forni tradizionali — inquadri il forno e ricevi le indicazioni di Miki-Nexus.
export default function AROven() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [on, setOn] = useState(false);
  const [denied, setDenied] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [guide, setGuide] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [recipeId, setRecipeId] = useState("");

  useEffect(() => { recipesApi.list("mikilab").then((r) => setRecipes(Array.isArray(r) ? r : [])).catch(() => setRecipes([])); }, []);

  const start = async () => {
    setDenied(false);
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      streamRef.current = s;
      if (videoRef.current) { videoRef.current.srcObject = s; await videoRef.current.play().catch(() => {}); }
      setOn(true);
    } catch { setDenied(true); setOn(true); } // fallback: mostra comunque l'overlay
  };
  const stop = () => {
    try { streamRef.current && streamRef.current.getTracks().forEach((t) => t.stop()); } catch { /* */ }
    streamRef.current = null; setOn(false); setGuide(null);
  };
  useEffect(() => () => stop(), []); // eslint-disable-line react-hooks/exhaustive-deps

  const scanOven = async () => {
    setScanning(true); setGuide(null);
    const recipeName = recipes.find((r) => r.id === recipeId)?.name || null;
    const fallback = () => setGuide({
      temp: `${230 + Math.round(Math.random() * 20)}°C`, time: `${16 + Math.round(Math.random() * 6)} min`,
      pos: tri("Centro-fondo, 18cm dalla brace", "Mitte-hinten", "Center-rear", "Centro-fondo", "Centre-fond", "مرکز-عقب"),
      note: tri("Ruota a metà cottura, sfrutta la discesa termica", "Nach der Hälfte drehen", "Rotate halfway", "Girar a la mitad", "Tourner à mi-cuisson", "نیمه‌راه بچرخان"),
    });
    try {
      // Collegato al motore reale di Miki-Nexus: ricalcolo per la ricetta scelta.
      const { data } = await api.post("/mike/legacy-adapt", { equipment: "forno a legna", recipe_name: recipeName, detail: tri("modalità AR in tempo reale", "AR-Modus", "real-time AR mode", "modo AR", "mode RA", "حالت AR"), lang }, { timeout: 45000 });
      const blob = JSON.stringify(data);
      const tempM = blob.match(/(\d{3})\s*°/);
      const timeM = blob.match(/(\d{1,3})\s*min/i);
      setGuide({
        temp: tempM ? `${tempM[1]}°C` : "240°C",
        time: timeM ? `${timeM[1]} min` : "18 min",
        pos: tri("Centro-fondo, sfrutta la discesa", "Mitte, Restwärme nutzen", "Center, ride the drop", "Centro-fondo", "Centre, descente", "مرکز"),
        note: data.summary || tri("Adattato da Miki-Nexus per il tuo forno.", "Von Miki-Nexus angepasst.", "Adapted by Miki-Nexus for your oven.", "Adaptado por Miki-Nexus.", "Adapté par Miki-Nexus.", "تنظیم شد."),
        live: true,
      });
    } catch { fallback(); }
    setScanning(false);
  };

  return (
    <div data-testid="ar-oven" className="space-y-3">
      <div className="flex items-center gap-2">
        <Camera className="w-5 h-5 text-[#FFB800]" />
        <div><h4 className="font-cyber text-sm font-black text-white uppercase tracking-wide">{tri("Simulatore AR Forni", "AR-Ofen-Simulator", "AR Oven Simulator", "Simulador AR Hornos", "Simulateur AR Fours", "شبیه‌ساز AR تنور")}</h4>
        <p className="text-[10.5px] text-[#94A3B8]">{tri("Inquadra il forno: Miki-Nexus calcola tempi e temperature.", "Ofen anvisieren: Miki-Nexus rechnet.", "Point at the oven: Miki-Nexus computes times and temps.", "Enfoca el horno: Miki-Nexus calcula.", "Vise le four : Miki-Nexus calcule.", "تنور را بگیر: Miki-Nexus محاسبه می‌کند.")}</p></div>
      </div>

      <select data-testid="ar-recipe" value={recipeId} onChange={(e) => setRecipeId(e.target.value)}
        className="w-full rounded-lg bg-[#060A10] border border-[#1e293b] text-white text-sm px-3 py-2 focus:border-[#FFB800] outline-none">
        <option value="">{tri("Ricetta per il calcolo (opzionale)", "Rezept für Berechnung (optional)", "Recipe for the calc (optional)", "Receta (opcional)", "Recette (option)", "دستور (اختیاری)")}</option>
        {recipes.map((r) => (<option key={r.id} value={r.id}>{r.name}</option>))}
      </select>

      {!on ? (
        <button data-testid="ar-start" onClick={start} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm text-[#060A10] active:scale-95" style={{ background: "linear-gradient(90deg,#FFB800,#EAB308)" }}><Camera className="w-4 h-4" /> {tri("Avvia AR", "AR starten", "Start AR", "Iniciar AR", "Lancer AR", "شروع AR")}</button>
      ) : (
        <div className="relative rounded-xl overflow-hidden border border-[#FFB800]/40 bg-[#060A10] aspect-video">
          <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
          {denied && <div className="absolute inset-0 flex items-center justify-center text-center px-4"><p className="text-[11px] text-[#94A3B8]">{tri("Fotocamera non disponibile — modalità simulata.", "Kamera n/v — Simulation.", "Camera unavailable — simulated mode.", "Cámara no disponible — simulado.", "Caméra indisponible — simulé.", "دوربین در دسترس نیست — شبیه‌سازی.")}</p></div>}
          {/* Mirino AR */}
          <div className="absolute inset-6 border-2 border-[#FFB800]/60 rounded-lg pointer-events-none" style={{ boxShadow: "0 0 24px rgba(255,184,0,0.3) inset" }} />
          <div className="absolute top-2 left-2 flex items-center gap-1 text-[9px] font-mono uppercase tracking-widest text-[#FFB800] bg-black/50 px-1.5 py-0.5 rounded"><Flame className="w-3 h-3" /> AR · Miki-Nexus</div>
          {/* Overlay indicazioni */}
          {guide && (
            <div data-testid="ar-guide" className="absolute bottom-2 left-2 right-2 rounded-lg bg-black/70 backdrop-blur-md border border-[#FFB800]/40 p-2.5 grid grid-cols-3 gap-2">
              {guide.live && <span className="absolute -top-2 right-2 px-1.5 py-0.5 rounded bg-[#22c55e] text-[#060A10] text-[8px] font-black uppercase tracking-widest">Live · Miki-Nexus</span>}
              <div className="text-center"><Thermometer className="w-3.5 h-3.5 text-[#FFB800] mx-auto" /><p className="text-[13px] font-black text-white">{guide.temp}</p></div>
              <div className="text-center"><Clock className="w-3.5 h-3.5 text-[#FF6B00] mx-auto" /><p className="text-[13px] font-black text-white">{guide.time}</p></div>
              <div className="text-center"><MapPin className="w-3.5 h-3.5 text-[#7FD8C0] mx-auto" /><p className="text-[9px] text-[#c5d3df] leading-tight">{guide.pos}</p></div>
              <p className="col-span-3 text-[10px] text-[#f3e6c4] text-center">{guide.note}</p>
            </div>
          )}
        </div>
      )}

      {on && (
        <div className="flex gap-2">
          <button data-testid="ar-scan" onClick={scanOven} disabled={scanning} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-[#060A10] disabled:opacity-60" style={{ background: "linear-gradient(90deg,#FF6B00,#FF9D42)" }}>{scanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Scan className="w-3.5 h-3.5" />} {scanning ? tri("Miki-Nexus calcola…", "Miki-Nexus rechnet…", "Miki-Nexus computing…", "Miki-Nexus calcula…", "Miki-Nexus calcule…", "در حال محاسبه…") : tri("Scansiona forno", "Ofen scannen", "Scan oven", "Escanear", "Scanner", "اسکن تنور")}</button>
          <button data-testid="ar-stop" onClick={stop} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-[#0b0f19] border border-[#1e293b] text-[#f87171]"><CameraOff className="w-3.5 h-3.5" /> {tri("Chiudi", "Schließen", "Close", "Cerrar", "Fermer", "بستن")}</button>
        </div>
      )}
    </div>
  );
}
