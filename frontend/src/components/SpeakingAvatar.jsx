import { motion } from "framer-motion";

// Avatar 3D "pop-out" con anelli sonori animati.
// who: "lab" (Michele) | "momi" (Miki-Nexus). mode: "listening" (blu) | "speaking" (arancio).
const IMG = { lab: "michele-avatar.jpg", momi: "logo.png" };

export default function SpeakingAvatar({
  who = "lab",
  active = false,
  mode = "speaking",
  size = 64,
  className = "",
  testid,
}) {
  const color = mode === "listening" ? "#3B82F6" : "#3E9C93";
  const src = `${process.env.PUBLIC_URL}/${IMG[who] || IMG.lab}`;
  return (
    <div
      data-testid={testid || `speaking-avatar-${who}`}
      data-active={active ? "1" : "0"}
      className={`relative pointer-events-none ${className}`}
      style={{ width: size, height: size, overflow: "visible" }}
    >
      {/* Anelli sonori concentrici */}
      {active && [0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="absolute inset-0 rounded-full"
          style={{ border: `2px solid ${color}` }}
          initial={{ scale: 1, opacity: 0.55 }}
          animate={{ scale: 2.3, opacity: 0 }}
          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.5, ease: "easeOut" }}
        />
      ))}
      {/* Alone morbido */}
      {active && (
        <span
          className="absolute inset-[-6px] rounded-full blur-md"
          style={{ background: `${color}44` }}
        />
      )}
      {/* Avatar (pop-out: scala oltre il contenitore) */}
      <motion.img
        src={src}
        alt={who}
        animate={active ? { scale: [1, 1.14, 1], y: [0, -5, 0] } : { scale: 1, y: 0 }}
        transition={active ? { duration: 0.9, repeat: Infinity, ease: "easeInOut" } : { duration: 0.3 }}
        style={{
          width: size,
          height: size,
          boxShadow: active ? `0 10px 28px ${color}88` : "0 4px 14px rgba(0,0,0,0.45)",
          borderColor: active ? color : "rgba(255,255,255,0.5)",
        }}
        className="relative z-10 rounded-full object-cover border-2"
        onError={(e) => { e.currentTarget.style.visibility = "hidden"; }}
      />
    </div>
  );
}
