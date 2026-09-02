import { motion, AnimatePresence } from "framer-motion";
import { Mic } from "lucide-react";

// Avatar vocale "3D" (look sferico con profondità, oro su ebano). Entra con transizione
// fluida tipo apertura/rotazione; la bocca/alone pulsa mentre l'assistente parla.
// Props: active (in ascolto), speaking (sta rispondendo con TTS).
export default function Avatar3D({ active = true, speaking = false, listening = false, label, sub }) {
  const isListening = listening && !speaking;
  const sphereGrad = isListening
    ? "radial-gradient(circle at 34% 28%, #A7F3D0 0%, #34D399 30%, #0E9F6E 64%, #04503A 100%)"
    : "radial-gradient(circle at 34% 28%, #F6D27A 0%, #E7B23C 32%, #A9741E 66%, #5A3B12 100%)";
  const haloColor = isListening ? "rgba(52,211,153,0.55)" : "rgba(231,178,60,0.5)";
  const haloColor2 = isListening ? "rgba(52,211,153,0.35)" : "rgba(231,178,60,0.35)";
  const sphereBorder = isListening ? "3px solid #6EE7B7" : "3px solid #F6D27A";
  return (
    <div className="flex flex-col items-center gap-3" style={{ perspective: 900 }} data-testid="avatar3d" data-state={speaking ? "speaking" : isListening ? "listening" : "idle"}>
      <AnimatePresence>
        {active && (
          <motion.div
            key="av"
            initial={{ rotateY: -95, opacity: 0, scale: 0.7 }}
            animate={{ rotateY: 0, opacity: 1, scale: 1 }}
            exit={{ rotateY: 95, opacity: 0, scale: 0.7 }}
            transition={{ type: "spring", stiffness: 120, damping: 14 }}
            style={{ transformStyle: "preserve-3d" }}
            className="relative"
          >
            {/* Aloni sonori quando parla/ascolta */}
            {(speaking || isListening) && (
              <>
                <motion.span className="absolute inset-0 rounded-full" style={{ border: `2px solid ${haloColor}` }}
                  animate={{ scale: [1, 1.5], opacity: [0.6, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }} />
                <motion.span className="absolute inset-0 rounded-full" style={{ border: `2px solid ${haloColor2}` }}
                  animate={{ scale: [1, 1.9], opacity: [0.4, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut", delay: 0.5 }} />
              </>
            )}
            {/* Sfera avatar */}
            <motion.div
              className="relative rounded-full flex items-center justify-center shadow-2xl"
              style={{
                width: 128, height: 128,
                background: sphereGrad,
                boxShadow: "0 12px 30px rgba(0,0,0,.6), inset 0 -10px 22px rgba(60,30,0,.55), inset 0 8px 16px rgba(255,240,200,.35)",
                border: sphereBorder,
              }}
              animate={speaking ? { scale: [1, 1.05, 1] } : isListening ? { scale: [1, 1.03, 1] } : { scale: 1 }}
              transition={speaking ? { duration: 0.4, repeat: Infinity } : isListening ? { duration: 1.4, repeat: Infinity, ease: "easeInOut" } : {}}
            >
              {/* Riflesso in alto (profondità 3D) */}
              <span className="absolute rounded-full" style={{ top: 12, left: 20, width: 44, height: 30, background: "radial-gradient(ellipse at center, rgba(255,250,235,.75), transparent 70%)", filter: "blur(2px)" }} />
              {/* Occhi */}
              <div className="absolute flex gap-5" style={{ top: 48 }}>
                <span className="rounded-full" style={{ width: 12, height: 12, background: "#2A1B08", boxShadow: "inset 0 1px 1px rgba(255,255,255,.4)" }} />
                <span className="rounded-full" style={{ width: 12, height: 12, background: "#2A1B08", boxShadow: "inset 0 1px 1px rgba(255,255,255,.4)" }} />
              </div>
              {/* Bocca animata (parla) */}
              <motion.div className="absolute rounded-full" style={{ bottom: 34, background: "#2A1B08" }}
                animate={speaking ? { height: [6, 18, 8, 16, 6], width: [26, 22, 28, 22, 26] } : { height: 6, width: 30 }}
                transition={speaking ? { duration: 0.5, repeat: Infinity } : {}} />
              {/* Micro badge */}
              <span className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full flex items-center justify-center shadow-lg" style={{ background: "#17120B", border: `2px solid ${isListening ? "#34D399" : "#E7B23C"}` }}>
                <Mic className="w-4 h-4" style={{ color: isListening ? "#34D399" : "#E7B23C" }} />
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {label && <p className="font-extrabold text-center" style={{ fontSize: "clamp(15px,4.2vw,18px)", color: "#F0E4CC" }} data-testid="avatar3d-label">{label}</p>}
      {sub && <p className="text-center text-[12px]" style={{ color: "#B79B6A" }}>{sub}</p>}
    </div>
  );
}
