import { useEffect, useState } from "react";

// Startup Splash Screen (mod. 51): glitch neon del trio + logo all'avvio (una volta per sessione).
export default function SplashScreen() {
  const [show, setShow] = useState(() => {
    try { return !sessionStorage.getItem("mikilab_splash_shown"); } catch { return true; }
  });
  useEffect(() => {
    if (!show) return;
    try { sessionStorage.setItem("mikilab_splash_shown", "1"); } catch { /* */ }
    const t = setTimeout(() => setShow(false), 2200);
    return () => clearTimeout(t);
  }, [show]);

  if (!show) return null;
  const AV = ["avatar_miki.jpg", "avatar_bigmix.jpg", "avatar_mohamed.jpg"];
  return (
    <div data-testid="splash-screen" className="splash-wrap fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0A1017]" onClick={() => setShow(false)}>
      <div className="absolute inset-0 opacity-30" style={{ background: "radial-gradient(circle at 50% 40%, rgba(62,156,147,.35), transparent 60%)" }} />
      <div className="relative flex items-center gap-3 mb-6">
        {AV.map((a, i) => (
          <div key={a} className={`rounded-2xl overflow-hidden border-2 ${i === 1 ? "w-24 h-24 border-[#6EA8FE]/70" : "w-16 h-16 border-[#3E9C93]/60"}`} style={{ boxShadow: i === 1 ? "0 0 24px rgba(110,168,254,.6)" : "0 0 16px rgba(62,156,147,.4)" }}>
            <img src={`${process.env.PUBLIC_URL}/${a}`} alt="" className="w-full h-full object-cover object-top" />
          </div>
        ))}
      </div>
      <h1 className="splash-glitch font-cyber text-4xl font-black tracking-widest text-[#3E9C93]" style={{ textShadow: "0 0 12px rgba(62,156,147,.8), 0 0 4px rgba(224,161,6,.6)" }}>MIKILAB</h1>
      <p className="font-tech text-[11px] uppercase tracking-[0.35em] text-[#E0A106] mt-2">Cyber-Industrial Bakery OS</p>
    </div>
  );
}
