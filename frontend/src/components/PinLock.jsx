import { useState } from "react";
import { Lock, Delete } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { unlockWith } from "@/lib/pinLock";

// Schermata di blocco: 4 cifre + tastierino. Copre tutto finché non si sblocca.
export default function PinLock({ onUnlock }) {
  const { lang } = useLang();
  const tri = (...a) => mkTri(lang)(...a);
  const [pin, setPin] = useState("");
  const [err, setErr] = useState(false);

  const submit = (val) => {
    if (unlockWith(val)) onUnlock();
    else { setErr(true); setPin(""); try { navigator.vibrate && navigator.vibrate(120); } catch { /* */ } }
  };
  const press = (d) => {
    if (pin.length >= 4) return;
    const np = pin + d; setErr(false); setPin(np);
    if (np.length === 4) setTimeout(() => submit(np), 140);
  };
  const del = () => { setErr(false); setPin((p) => p.slice(0, -1)); };

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];
  return (
    <div data-testid="pin-lock" className="fixed inset-0 z-[1000] flex flex-col items-center justify-center px-6"
      style={{ background: "radial-gradient(120% 60% at 50% -10%, #2A2012 0%, #17120B 55%)", color: "#F0E4CC" }}>
      <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="MikiLab" className="w-16 h-16 rounded-2xl object-cover ring-2 ring-[#E7B23C]/60 mb-4" />
      <div className="flex items-center gap-2 mb-1">
        <Lock className="w-5 h-5" style={{ color: "#E7B23C" }} />
        <h1 className="font-display font-extrabold" style={{ fontSize: "22px", color: "#E7B23C" }}>MikiLab</h1>
      </div>
      <p className="text-[13px] mb-6" style={{ color: "#B79B6A" }}>{tri("Inserisci il PIN di sicurezza", "Sicherheits-PIN eingeben", "Enter the security PIN", "Introduce el PIN de seguridad", "Saisis le code PIN", "پین امنیتی را وارد کن")}</p>

      <div className="flex items-center gap-3 mb-2" data-testid="pin-dots">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="w-4 h-4 rounded-full transition-all"
            style={{ background: pin.length > i ? "#E7B23C" : "transparent", border: `2px solid ${err ? "#E0722E" : "#6E5320"}` }} />
        ))}
      </div>
      <p className="h-5 text-[12px] font-bold mb-4" style={{ color: "#E0722E" }} data-testid="pin-error">
        {err ? tri("PIN errato. Riprova.", "Falscher PIN.", "Wrong PIN. Try again.", "PIN incorrecto.", "Code incorrect.", "پین اشتباه.") : ""}
      </p>

      <div className="grid grid-cols-3 gap-3 w-full max-w-[260px]">
        {keys.map((k, i) => k === "" ? <span key={i} /> : k === "del" ? (
          <button key={i} data-testid="pin-del" onClick={del} className="h-16 rounded-2xl flex items-center justify-center active:scale-95 transition-all"
            style={{ background: "#241B10", border: "2px solid #6E5320", color: "#E7B23C" }}><Delete className="w-6 h-6" /></button>
        ) : (
          <button key={i} data-testid={`pin-key-${k}`} onClick={() => press(k)}
            className="h-16 rounded-2xl font-extrabold active:scale-95 transition-all"
            style={{ background: "#241B10", border: "2px solid #6E5320", color: "#F0E4CC", fontSize: "24px" }}>{k}</button>
        ))}
      </div>
    </div>
  );
}
