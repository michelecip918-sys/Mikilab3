import { useRef, useState, useEffect } from "react";
import { Camera, CameraOff, Scan, Flame, Clock, Thermometer, MapPin } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// Fase 9 · Simulatore AR per forni tradizionali — inquadri il forno e ricevi le indicazioni di Mike Mix.
export default function AROven() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [on, setOn] = useState(false);
  const [denied, setDenied] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [guide, setGuide] = useState(null);

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

  const scanOven = () => {
    setScanning(true); setGuide(null);
    setTimeout(() => {
      setGuide({
        temp: `${230 + Math.round(Math.random() * 20)}°C`,
        time: `${16 + Math.round(Math.random() * 6)} min`,
        pos: tri("Centro-fondo, 18cm dalla brace", "Mitte-hinten, 18cm von Glut", "Center-rear, 18cm from embers", "Centro-fondo, 18cm de brasas", "Centre-fond, 18cm des braises", "مرکز-عقب"),
        note: tri("Ruota a metà cottura, sfrutta la discesa termica", "Nach der Hälfte drehen", "Rotate halfway, ride the thermal drop", "Girar a la mitad", "Tourner à mi-cuisson", "نیمه‌راه بچرخان"),
      });
      setScanning(false);
    }, 1500);
  };

  return (
    <div data-testid="ar-oven" className="space-y-3">
      <div className="flex items-center gap-2">
        <Camera className="w-5 h-5 text-[#FFB800]" />
        <div><h4 className="font-cyber text-sm font-black text-white uppercase tracking-wide">{tri("Simulatore AR Forni", "AR-Ofen-Simulator", "AR Oven Simulator", "Simulador AR Hornos", "Simulateur AR Fours", "شبیه‌ساز AR تنور")}</h4>
        <p className="text-[10.5px] text-[#8aa0b4]">{tri("Inquadra il forno: Mike Mix calcola tempi e temperature.", "Ofen anvisieren: Mike Mix rechnet.", "Point at the oven: Mike Mix computes times and temps.", "Enfoca el horno: Mike Mix calcula.", "Vise le four : Mike Mix calcule.", "تنور را بگیر: Mike Mix محاسبه می‌کند.")}</p></div>
      </div>

      {!on ? (
        <button data-testid="ar-start" onClick={start} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm text-[#070A10] active:scale-95" style={{ background: "linear-gradient(90deg,#FFB800,#F6D27A)" }}><Camera className="w-4 h-4" /> {tri("Avvia AR", "AR starten", "Start AR", "Iniciar AR", "Lancer AR", "شروع AR")}</button>
      ) : (
        <div className="relative rounded-xl overflow-hidden border border-[#FFB800]/40 bg-[#070A10] aspect-video">
          <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
          {denied && <div className="absolute inset-0 flex items-center justify-center text-center px-4"><p className="text-[11px] text-[#8aa0b4]">{tri("Fotocamera non disponibile — modalità simulata.", "Kamera n/v — Simulation.", "Camera unavailable — simulated mode.", "Cámara no disponible — simulado.", "Caméra indisponible — simulé.", "دوربین در دسترس نیست — شبیه‌سازی.")}</p></div>}
          {/* Mirino AR */}
          <div className="absolute inset-6 border-2 border-[#FFB800]/60 rounded-lg pointer-events-none" style={{ boxShadow: "0 0 24px rgba(255,184,0,0.3) inset" }} />
          <div className="absolute top-2 left-2 flex items-center gap-1 text-[9px] font-mono uppercase tracking-widest text-[#FFB800] bg-black/50 px-1.5 py-0.5 rounded"><Flame className="w-3 h-3" /> AR · Mike Mix</div>
          {/* Overlay indicazioni */}
          {guide && (
            <div data-testid="ar-guide" className="absolute bottom-2 left-2 right-2 rounded-lg bg-black/70 backdrop-blur-md border border-[#FFB800]/40 p-2.5 grid grid-cols-3 gap-2">
              <div className="text-center"><Thermometer className="w-3.5 h-3.5 text-[#FFB800] mx-auto" /><p className="text-[13px] font-black text-white">{guide.temp}</p></div>
              <div className="text-center"><Clock className="w-3.5 h-3.5 text-[#00F0FF] mx-auto" /><p className="text-[13px] font-black text-white">{guide.time}</p></div>
              <div className="text-center"><MapPin className="w-3.5 h-3.5 text-[#7FD8C0] mx-auto" /><p className="text-[9px] text-[#c5d3df] leading-tight">{guide.pos}</p></div>
              <p className="col-span-3 text-[10px] text-[#f3e6c4] text-center">{guide.note}</p>
            </div>
          )}
        </div>
      )}

      {on && (
        <div className="flex gap-2">
          <button data-testid="ar-scan" onClick={scanOven} disabled={scanning} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-[#070A10] disabled:opacity-60" style={{ background: "linear-gradient(90deg,#00F0FF,#7DD3FC)" }}><Scan className="w-3.5 h-3.5" /> {scanning ? tri("Analisi…", "Analyse…", "Analyzing…", "Analizando…", "Analyse…", "تحلیل…") : tri("Scansiona forno", "Ofen scannen", "Scan oven", "Escanear", "Scanner", "اسکن تنور")}</button>
          <button data-testid="ar-stop" onClick={stop} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-[#0b0f19] border border-[#1e293b] text-[#f87171]"><CameraOff className="w-3.5 h-3.5" /> {tri("Chiudi", "Schließen", "Close", "Cerrar", "Fermer", "بستن")}</button>
        </div>
      )}
    </div>
  );
}
