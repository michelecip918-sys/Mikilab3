import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Delete } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { adminGateApi } from "@/lib/api";

const PUB = process.env.PUBLIC_URL;

export default function AdminGate({ onUnlock, onBack, role }) {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [pin, setPin] = useState("");
  const [err, setErr] = useState(false);
  const [busy, setBusy] = useState(false);
  const isOp = role === "operator";

  const tryPin = async (val, soft) => {
    if (!soft) setBusy(true);
    let ok = false;
    let level = "master";
    let res = null;
    try {
      res = await adminGateApi.verify(val);        // verifica lato server (segreto, hashato)
      ok = !!(res && res.ok);
      level = (res && res.level) || "master";
    } catch {
      ok = false; // nessuna cache locale del PIN: la verifica è solo server-side
    }
    if (!soft) setBusy(false);
    if (ok) { onUnlock(level, res || {}); }
    else if (!soft) { setErr(true); setPin(""); }
  };

  const push = (d) => {
    if (pin.length >= 6 || busy) return;
    const next = pin + d;
    setPin(next);
    setErr(false);
    // 4 cifre → possibile PIN OPERAIO (o ospite): verifica "soft", senza errore se non combacia.
    if (next.length === 4) setTimeout(() => tryPin(next, true), 120);
    // 6 cifre → PIN MASTER: verifica finale.
    if (next.length === 6) setTimeout(() => tryPin(next, false), 120);
  };
  const back = () => { setPin((p) => p.slice(0, -1)); setErr(false); };

  return (
    <div data-testid="admin-gate" className="relative min-h-screen overflow-hidden bg-background text-foreground flex flex-col items-center justify-center px-6">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,#0f172a_0%,#030712_72%)]" />
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#1e293b18_1px,transparent_1px),linear-gradient(to_bottom,#1e293b18_1px,transparent_1px)] bg-[size:3.5rem_3.5rem]" />
      {onBack && (
        <button data-testid="admin-gate-back" onClick={onBack} className="absolute top-4 left-4 z-20 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-background/80 border border-border text-muted-foreground text-xs font-bold hover:border-primary active:scale-95 transition-all backdrop-blur-md">
          ← {tri("Multiverso", "Multiversum", "Multiverse", "Multiverso", "Multivers", "چندجهانی")}
        </button>
      )}
      <div className="relative z-10 w-full max-w-xs text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl overflow-hidden border border-primary/40 shadow-lg shadow-primary/20 bg-background mb-4">
          <img src={`${PUB}/logo-emblem.png`} alt="MikiLab" className="w-full h-full object-cover" />
        </div>
        <h1 className="font-black tracking-[0.15em] text-2xl uppercase">{isOp ? tri("PRODUZIONE", "PRODUKTION", "PRODUCTION", "PRODUCCIÓN", "PRODUCTION", "تولید") : "MIKILAB"}</h1>
        <p className="mt-2 text-sm text-muted-foreground flex items-center justify-center gap-1.5"><ShieldCheck className="w-4 h-4 text-primary" /> {isOp
          ? tri("Operaio · inserisci il tuo PIN a 4 cifre", "Mitarbeiter · 4-stelligen PIN eingeben", "Operator · enter your 4-digit PIN", "Operario · introduce tu PIN de 4 cifras", "Opérateur · saisis ton PIN à 4 chiffres", "اپراتور · پین ۴ رقمی خود را وارد کن")
          : tri("Direzione · inserisci il PIN a 6 cifre", "Chef · 6-stelligen PIN eingeben", "Capo · enter the 6-digit PIN", "Capo · introduce el PIN de 6 cifras", "Capo · saisis le PIN à 6 chiffres", "کاپو · پین ۶ رقمی را وارد کن")}</p>

        <div className={`mt-6 flex justify-center gap-3 ${err ? "animate-shake" : ""}`}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} data-testid={`admin-dot-${i}`} className={`w-4 h-4 rounded-full border-2 transition-all ${pin.length > i ? "bg-primary border-primary" : "border-border"}`} />
          ))}
        </div>
        {err && <p data-testid="admin-pin-error" className="mt-3 text-xs font-bold text-red-400">{tri("PIN errato. Riprova.", "Falscher PIN. Nochmal.", "Wrong PIN. Try again.", "PIN incorrecto. Reintenta.", "PIN incorrect. Réessaie.", "PIN اشتباه است.")}</p>}

        <div className="mt-8 grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button key={n} data-testid={`admin-key-${n}`} onClick={() => push(String(n))}
              className="h-16 rounded-2xl bg-background border border-border text-2xl font-bold text-foreground hover:border-primary active:scale-95 transition-all">{n}</button>
          ))}
          <div />
          <button data-testid="admin-key-0" onClick={() => push("0")} className="h-16 rounded-2xl bg-background border border-border text-2xl font-bold text-foreground hover:border-primary active:scale-95 transition-all">0</button>
          <button data-testid="admin-key-back" onClick={back} className="h-16 rounded-2xl bg-background border border-border text-muted-foreground hover:border-primary active:scale-95 transition-all flex items-center justify-center"><Delete className="w-6 h-6" /></button>
        </div>

        {/* Muro del PIN · richiesta d'accesso pubblica */}
        <div data-testid="admin-gate-request" className="mt-7 pt-5 border-t border-border">
          <p className="text-[11px] text-muted-foreground leading-relaxed">{tri(
            "Non hai un PIN? L'accesso a MikiLab è su invito del Capo.",
            "Kein PIN? Der Zugang zu MikiLab erfolgt auf Einladung des Chefs.",
            "No PIN? Access to MikiLab is by invitation from the Capo.",
            "¿Sin PIN? El acceso a MikiLab es por invitación del Capo.",
            "Pas de PIN ? L'accès à MikiLab se fait sur invitation du Capo.",
            "پین نداری؟ دسترسی به MikiLab با دعوت کاپو است.")}</p>
          <a href="mailto:michelecip918@gmail.com?subject=Richiesta%20accesso%20MikiLab" data-testid="admin-gate-email"
            className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-bold text-primary hover:text-muted-foreground transition-colors">
            <ShieldCheck className="w-3.5 h-3.5" /> michelecip918@gmail.com
          </a>
        </div>
      </div>
    </div>
  );
}
