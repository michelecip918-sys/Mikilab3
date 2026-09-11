import { useEffect, useState } from "react";

const PUB = process.env.PUBLIC_URL;

// Splash d'avvio (una volta per sessione): nuovo logo MikiLab che pulsa con luce ciano.
export default function SplashScreen() {
  const [show, setShow] = useState(() => {
    try { return !sessionStorage.getItem("mikilab_splash_shown"); } catch { return true; }
  });
  const dismiss = () => {
    try { sessionStorage.setItem("mikilab_splash_shown", "1"); } catch { /* */ }
    setShow(false);
  };
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(dismiss, 2600);
    return () => clearTimeout(t);
  }, [show]);

  if (!show) return null;
  return (
    <div
      data-testid="splash-screen"
      className="splash-wrap fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#030712]"
      onClick={dismiss}
    >
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_50%_42%,#0b2a2b_0%,#030712_66%)]" />
      <div className="absolute inset-0 z-0 opacity-[0.18] bg-[linear-gradient(to_right,#FF6B0014_1px,transparent_1px),linear-gradient(to_bottom,#FF6B0014_1px,transparent_1px)] bg-[size:3rem_3rem]" />

      <div className="relative z-10 flex flex-col items-center">
        <div className="relative w-32 h-32 flex items-center justify-center">
          {/* Anelli radar ciano che pulsano verso l'esterno */}
          <span className="splash-ring" style={{ animationDelay: "0s" }} />
          <span className="splash-ring" style={{ animationDelay: ".7s" }} />
          <span className="splash-ring" style={{ animationDelay: "1.4s" }} />
          {/* Logo con glow ciano che respira */}
          <div className="splash-logo relative w-24 h-24 rounded-3xl overflow-hidden border border-[#8a97a6]/40 bg-[#030712]">
            <img src={`${PUB}/logo-emblem.png`} alt="MikiLab" className="w-full h-full object-contain" />
          </div>
        </div>

        <h1 className="splash-title mt-7 font-cyber text-3xl sm:text-4xl font-black tracking-[0.18em] text-white uppercase">
          MIKILAB<span className="text-[#8a97a6]"> PRO</span>
        </h1>
        <p className="font-mono-data text-[10px] sm:text-[11px] uppercase tracking-[0.38em] text-[#8a97a6]/70 mt-2.5">
          Holographic Command OS
        </p>
      </div>
    </div>
  );
}
