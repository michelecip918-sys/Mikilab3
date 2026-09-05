import { useRef, useState, useCallback } from "react";
import { ShieldAlert } from "lucide-react";

// Interruttore MACRO a prova di errore: alto contrasto + TIENI PREMUTO per confermare.
// Impedisce modifiche accidentali (tocco involontario con la manica). onConfirm() dopo l'hold.
export const FailsafeSwitch = ({ active, onConfirm, labelOn, labelOff, holdMs = 1100, testid = "failsafe-switch" }) => {
  const [progress, setProgress] = useState(0);
  const raf = useRef(null);
  const start = useRef(0);

  const stop = useCallback(() => {
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = null;
    setProgress(0);
  }, []);

  const tick = useCallback((now) => {
    const p = Math.min(1, (now - start.current) / holdMs);
    setProgress(p);
    if (p >= 1) {
      stop();
      if (navigator.vibrate) { try { navigator.vibrate(30); } catch { /* */ } }
      onConfirm && onConfirm();
      return;
    }
    raf.current = requestAnimationFrame(tick);
  }, [holdMs, onConfirm, stop]);

  const begin = useCallback((e) => {
    e.preventDefault();
    start.current = performance.now();
    raf.current = requestAnimationFrame(tick);
  }, [tick]);

  const color = active ? "#ef4444" : "#14b8a6";
  return (
    <button
      data-testid={testid}
      onMouseDown={begin} onMouseUp={stop} onMouseLeave={stop}
      onTouchStart={begin} onTouchEnd={stop} onTouchCancel={stop}
      className="relative w-full select-none overflow-hidden rounded-2xl border-2 py-4 px-4 font-black text-sm uppercase tracking-wide active:scale-[0.99] transition-transform"
      style={{ borderColor: color, background: active ? "rgba(239,68,68,0.12)" : "rgba(20,184,166,0.1)", color }}
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 transition-none"
        style={{ width: `${progress * 100}%`, background: color, opacity: 0.28 }}
      />
      <span className="relative flex items-center justify-center gap-2">
        <ShieldAlert className="w-4 h-4" />
        {active ? labelOn : labelOff}
        <span className="text-[10px] font-bold opacity-70 normal-case tracking-normal">
          {progress > 0 && progress < 1 ? "…" : ""}
        </span>
      </span>
    </button>
  );
};

export default FailsafeSwitch;
