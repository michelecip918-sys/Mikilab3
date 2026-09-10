import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import AvatarWorld3D from "@/components/AvatarWorld3D";

const PUB = process.env.PUBLIC_URL;

// Hero 3D GRANDE e INTERATTIVO per ogni zona del sito: scena olografica AvatarWorld3D
// come sfondo + avatar grande che reagisce al MOVIMENTO del dispositivo (giroscopio)
// e al mouse (parallax). Sitor pulsa quando parla (evento TTS globale).
export default function ZoneHero3D({ avatar, name, role, tag, accent = "#FF6B00", theme = "miki", testid, listenSpeaking = false }) {
  const ref = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [speaking, setSpeaking] = useState(false);
  const [gyroReady, setGyroReady] = useState(false);

  // Parallax da mouse (desktop)
  const onMove = useCallback((e) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const dx = (e.clientX - cx) / (r.width / 2);
    const dy = (e.clientY - cy) / (r.height / 2);
    setTilt({ x: Math.max(-1, Math.min(1, dx)), y: Math.max(-1, Math.min(1, dy)) });
  }, []);

  // Giroscopio (mobile): l'avatar segue l'inclinazione del telefono
  useEffect(() => {
    const onOrient = (e) => {
      if (e.gamma == null && e.beta == null) return;
      const gx = Math.max(-1, Math.min(1, (e.gamma || 0) / 35)); // sinistra/destra
      const gy = Math.max(-1, Math.min(1, ((e.beta || 0) - 45) / 35)); // avanti/indietro
      setTilt({ x: gx, y: gy });
      if (!gyroReady) setGyroReady(true);
    };
    window.addEventListener("deviceorientation", onOrient);
    return () => window.removeEventListener("deviceorientation", onOrient);
  }, [gyroReady]);

  // Reazione vocale di Sitor
  useEffect(() => {
    if (!listenSpeaking) return;
    const on = () => setSpeaking(true);
    const off = () => setSpeaking(false);
    window.addEventListener("mikilab-tts-start", on);
    window.addEventListener("mikilab-tts-end", off);
    return () => { window.removeEventListener("mikilab-tts-start", on); window.removeEventListener("mikilab-tts-end", off); };
  }, [listenSpeaking]);

  // iOS richiede consenso esplicito per il giroscopio
  const askGyro = async () => {
    try {
      if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
        const res = await DeviceOrientationEvent.requestPermission();
        if (res === "granted") setGyroReady(true);
      }
    } catch { /* */ }
  };

  return (
    <div ref={ref} data-testid={testid} onMouseMove={onMove} onMouseLeave={() => setTilt({ x: 0, y: 0 })}
      className="relative w-full mb-5 rounded-3xl overflow-hidden border"
      style={{ height: 340, borderColor: `${accent}44`, boxShadow: `0 0 34px ${accent}22`, background: "#04070d" }}>
      {/* Scena 3D immersiva di sfondo */}
      <div className="absolute inset-0 z-0">
        <AvatarWorld3D theme={theme} accent={accent} speaking={speaking} />
      </div>
      <div className="absolute inset-0 z-[1] pointer-events-none" style={{ background: `radial-gradient(circle at 50% 42%, transparent 30%, #04070d 92%)` }} />

      {/* Avatar GRANDE interattivo (segue mouse/giroscopio) */}
      <div className="absolute inset-0 z-[2] flex items-center justify-center pointer-events-none" style={{ perspective: 900 }}>
        <motion.div
          animate={{ rotateY: tilt.x * 16, rotateX: -tilt.y * 12, x: tilt.x * 22, y: tilt.y * 10 }}
          transition={{ type: "spring", stiffness: 60, damping: 14 }}
          style={{ transformStyle: "preserve-3d" }}
          className="relative">
          <motion.span aria-hidden className="absolute -inset-6 rounded-full"
            style={{ background: `radial-gradient(circle, ${accent}66, transparent 68%)` }}
            animate={{ scale: speaking ? [1, 1.25, 1] : [1, 1.1, 1], opacity: speaking ? [0.7, 1, 0.7] : [0.5, 0.75, 0.5] }}
            transition={{ duration: speaking ? 0.9 : 3, repeat: Infinity, ease: "easeInOut" }} />
          <img src={`${PUB}/${avatar}`} alt={name}
            className="relative rounded-full object-cover object-top"
            style={{ width: 168, height: 168, border: `3px solid ${accent}`, boxShadow: `0 0 46px ${accent}, 0 0 90px ${accent}55` }}
            onError={(e) => { e.currentTarget.style.display = "none"; }} />
        </motion.div>
      </div>

      {/* Overlay testo */}
      <div className="absolute left-0 right-0 bottom-0 z-[3] p-4 sm:p-5 bg-gradient-to-t from-[#04070d] via-[#04070d]/80 to-transparent">
        {tag && <span className="inline-block font-mono-data text-[9px] tracking-[0.28em] uppercase mb-1" style={{ color: accent }}>{tag}</span>}
        <h3 className="font-cyber text-xl sm:text-2xl font-black text-white uppercase tracking-wide" style={{ textShadow: `0 0 16px ${accent}66` }}>{name}</h3>
        {role && <p className="text-xs sm:text-sm text-[#CBD5E1]">{role}</p>}
      </div>

      {/* CTA giroscopio (solo se non ancora attivo e su dispositivo che lo richiede) */}
      {!gyroReady && typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function" && (
        <button data-testid={`${testid}-gyro`} onClick={askGyro}
          className="absolute top-3 right-3 z-[4] px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border backdrop-blur-md active:scale-95"
          style={{ borderColor: `${accent}66`, color: accent, background: "#0b0f19cc" }}>
          Muovi con il telefono
        </button>
      )}
    </div>
  );
}
