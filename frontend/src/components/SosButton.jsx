import { useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { AlertOctagon, Check } from "lucide-react";
import { mikeApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

const MACHINES = ["Forno 1", "Forno 2", "Impastatrice", "Cella lievitazione", "Banco lavoro", "Banco pasticceria"];
const HOLD_MS = 1200;

// SOS operatore con CONFERMA TATTILE (tieni premuto): evita falsi allarmi accidentali.
// Al rilascio dell'anello completo invia l'SOS; il Capo lo vede in plancia con bagliore
// e Sitor lo annuncia a voce.
export default function SosButton({ role = "", operator = "" }) {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [machine, setMachine] = useState("");
  const [progress, setProgress] = useState(0);
  const [sent, setSent] = useState(false);
  const raf = useRef(null);
  const start = useRef(0);
  const done = useRef(false);

  const send = useCallback(async () => {
    try {
      await mikeApi.sosRaise({ operator: operator || role || "Operatore", role, machine, note: "", lang });
      setSent(true);
      setTimeout(() => setSent(false), 6000);
    } catch { /* offline: l'allarme resta locale */ }
  }, [operator, role, machine, lang]);

  const tick = useCallback(() => {
    const p = Math.min(1, (Date.now() - start.current) / HOLD_MS);
    setProgress(p);
    if (p >= 1) { if (!done.current) { done.current = true; send(); } setProgress(0); return; }
    raf.current = requestAnimationFrame(tick);
  }, [send]);

  const begin = useCallback((e) => {
    e.preventDefault();
    if (sent) return;
    done.current = false; start.current = Date.now();
    raf.current = requestAnimationFrame(tick);
  }, [tick, sent]);

  const end = useCallback(() => {
    if (raf.current) cancelAnimationFrame(raf.current);
    if (!done.current) setProgress(0);
  }, []);

  return (
    <div data-testid="sos-panel" className="w-full rounded-2xl border border-[#f43f5e]/40 bg-[#f43f5e]/5 p-3">
      <p className="text-[11px] font-black uppercase tracking-widest text-[#f43f5e] flex items-center gap-1.5 mb-2"><AlertOctagon className="w-3.5 h-3.5" /> {tri("Emergenza SOS", "SOS Notfall", "SOS Emergency", "Emergencia SOS", "Urgence SOS", "اضطراری SOS")}</p>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {MACHINES.map((m) => (
          <button key={m} data-testid={`sos-machine-${m.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()}`} onClick={() => setMachine((v) => (v === m ? "" : m))}
            className={`text-[11px] font-bold px-2.5 py-1 rounded-full border active:scale-95 transition-all ${machine === m ? "bg-[#f43f5e]/20 border-[#f43f5e]/60 text-[#f43f5e]" : "bg-[#030712] border-[#1e293b] text-[#94A3B8]"}`}>
            {m}
          </button>
        ))}
      </div>
      <button
        data-testid="sos-hold-btn"
        onPointerDown={begin} onPointerUp={end} onPointerLeave={end} onPointerCancel={end}
        className="relative w-full overflow-hidden inline-flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-sm select-none touch-none active:scale-98 transition-transform"
        style={{ background: sent ? "linear-gradient(90deg,#16a34a,#15803d)" : "linear-gradient(90deg,#b91c1c,#f43f5e)", color: "#fff", boxShadow: "0 0 22px rgba(244,63,94,0.35)" }}
      >
        <span className="absolute left-0 top-0 bottom-0 bg-white/25" style={{ width: `${progress * 100}%` }} aria-hidden />
        <span className="relative flex items-center gap-2">
          {sent ? <><Check className="w-5 h-5" /> {tri("SOS inviato al Capo", "SOS an Chef gesendet", "SOS sent to Capo", "SOS enviado al Capo", "SOS envoyé au Capo", "SOS ارسال شد")}</> : <><AlertOctagon className="w-5 h-5" /> {tri("Tieni premuto per SOS", "Halten für SOS", "Hold for SOS", "Mantén para SOS", "Maintiens pour SOS", "برای SOS نگه دار")}</>}
        </span>
      </button>
      {machine && !sent && <p className="mt-2 text-[11px] text-[#94A3B8]">{tri("Macchinario", "Maschine", "Machine", "Máquina", "Machine", "دستگاه")}: <b className="text-white">{machine}</b></p>}
      {sent && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} data-testid="sos-sent-note" className="mt-2 text-[11px] text-emerald-400 font-bold">
          {tri("Il Capo è stato avvisato. Resta in sicurezza.", "Der Chef wurde benachrichtigt. Bleib sicher.", "The Capo has been alerted. Stay safe.", "El Capo ha sido avisado. Mantente seguro.", "Le Capo a été alerté. Reste en sécurité.", "کاپو مطلع شد. ایمن بمان.")}
        </motion.p>
      )}
    </div>
  );
}
