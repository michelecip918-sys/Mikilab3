import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

// Kit olografico della plancia MikiLab Pro (Zero-Menu). Pannelli industriali,
// divisori di zona a laser, indicatori di stato fluorescenti. Nessun menu classico.

export function ZoneDivider({ title, code, accent = "#00F0FF", testid }) {
  return (
    <div data-testid={testid} className="relative my-8 sm:my-12 flex items-center justify-center">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t" style={{ borderColor: `${accent}33`, boxShadow: `0 0 8px ${accent}44` }} />
      </div>
      <div className="relative z-10 inline-flex items-center gap-2 px-5 py-2 rounded-full font-cyber text-[11px] sm:text-xs tracking-[0.25em] uppercase"
        style={{ background: "#0C1019", border: `1px solid ${accent}66`, color: accent, boxShadow: `0 0 15px ${accent}33` }}>
        <span className="relative flex w-2 h-2">
          <span className="absolute inline-flex w-full h-full rounded-full animate-ping" style={{ background: accent, opacity: 0.6 }} />
          <span className="relative inline-flex w-2 h-2 rounded-full" style={{ background: accent }} />
        </span>
        {code && <span className="font-mono-data opacity-60">{code}</span>}
        {title}
      </div>
    </div>
  );
}

export function HoloPanel({ title, sub, testid, accent = "#00F0FF", icon, defaultOpen = false, collapsible = true, beacon = "#7DD3FC", children }) {
  const [open, setOpen] = useState(defaultOpen);
  const rootRef = useRef(null);
  useEffect(() => {
    const onJump = (e) => {
      if (e.detail === testid) {
        if (collapsible) setOpen(true);
        setTimeout(() => { try { rootRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); } catch { /* */ } }, 60);
      }
    };
    window.addEventListener("mikilab:open-panel", onJump);
    return () => window.removeEventListener("mikilab:open-panel", onJump);
  }, [testid, collapsible]);
  return (
    <div ref={rootRef} data-testid={testid} className="holo-panel scroll-mt-24">
      <span className="holo-corner holo-corner-tl" style={{ color: accent }} />
      <span className="holo-corner holo-corner-tr" style={{ color: accent }} />
      <span className="holo-corner holo-corner-bl" style={{ color: accent }} />
      <span className="holo-corner holo-corner-br" style={{ color: accent }} />
      <span className="holo-scan-top" />
      <button type="button" data-testid={`${testid}-head`} onClick={() => collapsible && setOpen((v) => !v)}
        className={`w-full flex items-center gap-3 px-4 sm:px-5 py-4 text-left ${collapsible ? "active:scale-[0.997]" : "cursor-default"} transition-transform`}>
        {icon && <span className="text-xl inline-flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
          style={{ background: `${accent}14`, border: `1px solid ${accent}3a` }}>{icon}</span>}
        <span className="min-w-0 flex-1">
          <span className="block font-tech font-bold text-sm sm:text-base text-white tracking-wide truncate" style={{ textShadow: `0 0 12px ${accent}22` }}>{title}</span>
          {sub && <span className="block text-[11px] text-[#8aa0b4] truncate">{sub}</span>}
        </span>
        <span className="relative flex w-2.5 h-2.5 shrink-0" title="stato">
          <span className="absolute inline-flex w-full h-full rounded-full animate-ping" style={{ background: beacon, opacity: 0.55 }} />
          <span className="relative inline-flex w-2.5 h-2.5 rounded-full" style={{ background: beacon, boxShadow: `0 0 8px ${beacon}` }} />
        </span>
        {collapsible && <ChevronDown className="w-4 h-4 text-[#8aa0b4] shrink-0 transition-transform" style={{ transform: open ? "rotate(180deg)" : "none" }} />}
      </button>
      <AnimatePresence initial={false}>
        {(open || !collapsible) && (
          <motion.div key="body" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: "easeInOut" }} className="overflow-hidden">
            <div className="px-4 sm:px-5 pb-5 pt-1 border-t border-[#00F0FF]/10">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ZoneHero({ avatar, name, role, tag, accent = "#00F0FF", testid, reactive = false }) {
  const PUB = process.env.PUBLIC_URL;
  return (
    <div data-testid={testid} className="relative flex items-center gap-4 mb-5 rounded-2xl p-4 holo-panel overflow-hidden">
      <span className="holo-corner holo-corner-tl" style={{ color: accent }} />
      <span className="holo-corner holo-corner-br" style={{ color: accent }} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(circle at 12% 50%, ${accent}18, transparent 60%)` }} />
      <div className="relative shrink-0">
        <motion.span aria-hidden className="absolute -inset-1.5 rounded-full" style={{ background: `radial-gradient(circle, ${accent}55, transparent 70%)` }}
          animate={reactive ? { scale: [1, 1.12, 1], opacity: [0.55, 0.9, 0.55] } : { opacity: 0.5 }} transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }} />
        <img src={`${PUB}/${avatar}`} alt={name} className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover object-top" style={{ border: `2px solid ${accent}`, boxShadow: `0 0 22px ${accent}66` }}
          onError={(e) => { e.currentTarget.style.display = "none"; }} />
      </div>
      <div className="relative min-w-0">
        {tag && <span className="inline-block font-mono-data text-[9px] tracking-[0.25em] uppercase mb-1" style={{ color: accent }}>{tag}</span>}
        <h3 className="font-cyber text-lg sm:text-xl font-black text-white uppercase tracking-wide truncate" style={{ textShadow: `0 0 14px ${accent}33` }}>{name}</h3>
        {role && <p className="text-xs text-[#9fb3c4] truncate">{role}</p>}
      </div>
    </div>
  );
}

export function ZoneRail({ zones, active, onJump }) {
  return (
    <div data-testid="zone-rail" className="fixed right-2 sm:right-4 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-4 pointer-events-none">
      {zones.map((z) => {
        const on = active === z.id;
        return (
          <button key={z.id} data-testid={`rail-${z.id}`} onClick={() => onJump(z.id)} title={z.label}
            className="pointer-events-auto group relative flex items-center justify-end gap-2 active:scale-90 transition-transform">
            <span className="hidden sm:block font-cyber text-[9px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: z.accent }}>{z.label}</span>
            <span className="relative flex items-center justify-center" style={{ width: 14, height: 14 }}>
              {on && <span className="absolute inline-flex w-full h-full rounded-full animate-ping" style={{ background: z.accent, opacity: 0.5 }} />}
              <span className="relative rounded-full transition-all" style={{
                width: on ? 12 : 8, height: on ? 12 : 8,
                background: on ? z.accent : "transparent",
                border: `1.5px solid ${z.accent}`, boxShadow: on ? `0 0 10px ${z.accent}` : "none",
              }} />
            </span>
          </button>
        );
      })}
    </div>
  );
}
