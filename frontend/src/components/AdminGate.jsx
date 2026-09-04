import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Delete } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

const PUB = process.env.PUBLIC_URL;
// PIN ADMIN personale di MikiLab (Michele) — blocca l'INTERO sito. Separato dal PIN di produzione.
const ADMIN_PIN = () => { try { return localStorage.getItem("mikilab_admin_pin") || "1985"; } catch { return "1985"; } };

export default function AdminGate({ onUnlock }) {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [pin, setPin] = useState("");
  const [err, setErr] = useState(false);

  const push = (d) => {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    setErr(false);
    if (next.length === 4) {
      setTimeout(() => {
        if (next === ADMIN_PIN()) {
          try { localStorage.setItem("mikilab_admin_unlocked", "1"); } catch { /* */ }
          onUnlock();
        } else { setErr(true); setPin(""); }
      }, 120);
    }
  };
  const back = () => { setPin((p) => p.slice(0, -1)); setErr(false); };

  return (
    <div data-testid="admin-gate" className="relative min-h-screen overflow-hidden bg-[#030712] text-white flex flex-col items-center justify-center px-6">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,#0f172a_0%,#030712_72%)]" />
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#1e293b18_1px,transparent_1px),linear-gradient(to_bottom,#1e293b18_1px,transparent_1px)] bg-[size:3.5rem_3.5rem]" />
      <div className="relative z-10 w-full max-w-xs text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl overflow-hidden border border-[#14b8a6]/40 shadow-lg shadow-[#14b8a6]/20 bg-[#030712] mb-4">
          <img src={`${PUB}/logo-emblem.png`} alt="MikiLab" className="w-full h-full object-contain" />
        </div>
        <h1 className="font-black tracking-[0.15em] text-2xl uppercase">MIKILAB</h1>
        <p className="mt-2 text-sm text-[#94A3B8] flex items-center justify-center gap-1.5"><ShieldCheck className="w-4 h-4 text-[#14b8a6]" /> {tri("Accesso riservato · inserisci il PIN", "Zugang reserviert · PIN eingeben", "Private access · enter the PIN", "Acceso reservado · introduce el PIN", "Accès réservé · saisis le PIN", "دسترسی خصوصی · PIN را وارد کن")}</p>

        <div className={`mt-6 flex justify-center gap-3 ${err ? "animate-shake" : ""}`}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} data-testid={`admin-dot-${i}`} className={`w-4 h-4 rounded-full border-2 transition-all ${pin.length > i ? "bg-[#14b8a6] border-[#14b8a6]" : "border-[#334155]"}`} />
          ))}
        </div>
        {err && <p data-testid="admin-pin-error" className="mt-3 text-xs font-bold text-red-400">{tri("PIN errato. Riprova.", "Falscher PIN. Nochmal.", "Wrong PIN. Try again.", "PIN incorrecto. Reintenta.", "PIN incorrect. Réessaie.", "PIN اشتباه است.")}</p>}

        <div className="mt-8 grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button key={n} data-testid={`admin-key-${n}`} onClick={() => push(String(n))}
              className="h-16 rounded-2xl bg-[#0b0f19] border border-[#1e293b] text-2xl font-bold text-white hover:border-[#14b8a6] active:scale-95 transition-all">{n}</button>
          ))}
          <div />
          <button data-testid="admin-key-0" onClick={() => push("0")} className="h-16 rounded-2xl bg-[#0b0f19] border border-[#1e293b] text-2xl font-bold text-white hover:border-[#14b8a6] active:scale-95 transition-all">0</button>
          <button data-testid="admin-key-back" onClick={back} className="h-16 rounded-2xl bg-[#0b0f19] border border-[#1e293b] text-[#94A3B8] hover:border-[#14b8a6] active:scale-95 transition-all flex items-center justify-center"><Delete className="w-6 h-6" /></button>
        </div>
      </div>
    </div>
  );
}
