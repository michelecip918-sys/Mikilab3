import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { auraApi } from "@/lib/api";
import { playTTS } from "@/lib/tts";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// Aura stile Dragon Ball attorno all'avatar dell'operatore: brilla e si intensifica
// in base al punteggio di efficienza del turno (Aura Bassa → Aura Bianca → Super Saiyan).
const TIERS = {
  1: { color: "#94A3B8", label: "Aura Bassa", power: "Warm-up", rings: 1, particles: 0 },
  2: { color: "#5EEAD4", label: "Aura Bianca", power: "Stable Flow", rings: 2, particles: 0 },
  3: { color: "#f59e0b", label: "Super Saiyan", power: "Over 9000!", rings: 3, particles: 8 },
};

function tierFromScore(score) {
  if (score >= 90) return 3;
  if (score >= 75) return 2;
  return 1;
}

export default function OperatorAura({ name, score, size = 192, showBadge = true, announce = false, children }) {
  const { lang } = useLang();
  const [srv, setSrv] = useState(null);
  const announcedRef = useRef(false);
  useEffect(() => {
    let alive = true;
    if (name && score == null) auraApi.worker(name).then((d) => { if (alive) setSrv(d); });
    return () => { alive = false; };
  }, [name, score]);

  const effScore = score != null ? score : (srv && srv.score != null ? srv.score : 85);
  const tier = tierFromScore(effScore);
  const T = TIERS[tier];
  const effect = (srv && srv.aura_effect) || T.label;
  const power = (srv && srv.power_level) || T.power;

  // Potenziamento: quando l'operatore raggiunge Super Saiyan, l'Aura "parla" via headset
  // nella lingua corrente e celebra la vetta della classifica.
  useEffect(() => {
    if (!announce || tier !== 3 || announcedRef.current) return;
    announcedRef.current = true;
    const who = name || "";
    const msg = mkTri(lang)(
      `Power level over 9000! ${who} è in modalità Super Saiyan. In vetta alla classifica del turno.`,
      `Power level over 9000! ${who} ist im Super-Saiyan-Modus. An der Spitze der Schicht-Rangliste.`,
      `Power level over 9000! ${who} is in Super Saiyan mode. Top of the shift leaderboard.`,
      `Power level over 9000! ${who} está en modo Super Saiyan. Líder de la clasificación del turno.`,
      `Power level over 9000 ! ${who} est en mode Super Saiyan. En tête du classement du poste.`,
      `پاور لِوِل بالای ۹۰۰۰! ${who} در حالت سوپر سایان است. صدرنشین جدول شیفت.`);
    try { toast.success("⚡ Super Saiyan · Over 9000!", { description: msg, duration: 6000 }); } catch { /* */ }
    try { playTTS(msg, { lang, voice: "bakemix" }); } catch { /* */ }
  }, [announce, tier, name, lang]);

  return (
    <div data-testid="operator-aura" data-aura-tier={tier} className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Bagliore di fondo pulsante */}
      <motion.span aria-hidden className="absolute rounded-full pointer-events-none"
        style={{ width: size * 1.4, height: size * 1.4, background: `radial-gradient(closest-side, ${T.color}${tier === 3 ? "88" : tier === 2 ? "55" : "33"}, transparent 70%)`, filter: "blur(12px)" }}
        animate={{ opacity: [0.5, 1, 0.5], scale: [0.96, 1.06, 0.96] }}
        transition={{ duration: tier === 3 ? 1.1 : 2.2, repeat: Infinity, ease: "easeInOut" }} />
      {/* Anelli d'energia */}
      {Array.from({ length: T.rings }).map((_, i) => (
        <motion.span key={i} aria-hidden className="absolute rounded-full pointer-events-none"
          style={{ width: size * (1.02 + i * 0.12), height: size * (1.02 + i * 0.12), border: `2px solid ${T.color}${i === 0 ? "cc" : "66"}` }}
          animate={{ opacity: [0.25, 0.7, 0.25], scale: [1, 1.05, 1] }}
          transition={{ duration: 1.6 + i * 0.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.25 }} />
      ))}
      {/* Particelle dorate (solo Super Saiyan) */}
      {Array.from({ length: T.particles }).map((_, i) => {
        const ang = (i / T.particles) * Math.PI * 2;
        const r = size * 0.62;
        return (
          <motion.span key={`p${i}`} aria-hidden className="absolute rounded-full pointer-events-none"
            style={{ width: 6, height: 6, background: T.color, left: "50%", top: "50%", boxShadow: `0 0 8px ${T.color}` }}
            animate={{ x: [Math.cos(ang) * r * 0.7, Math.cos(ang) * r], y: [Math.sin(ang) * r * 0.7, Math.sin(ang) * r * 1.15, Math.sin(ang) * r * 0.7], opacity: [0, 1, 0] }}
            transition={{ duration: 1.2 + (i % 3) * 0.3, repeat: Infinity, ease: "easeOut", delay: i * 0.12 }} />
        );
      })}
      {/* Avatar */}
      <div className="relative z-10 rounded-full overflow-hidden" style={{ width: size, height: size, boxShadow: `0 0 0 3px ${T.color}, 0 0 26px ${T.color}${tier === 3 ? "aa" : "55"}` }}>
        {children}
      </div>
      {/* Badge power level */}
      {showBadge && (
        <div data-testid="operator-aura-badge" className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg"
          style={{ background: "#030712", border: `1.5px solid ${T.color}`, color: T.color }}>
          {effect} · {power}
        </div>
      )}
    </div>
  );
}
