import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { HardHat, Loader2, ArrowRight, ShieldAlert } from "lucide-react";
import { floorInvitesApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

const PUB = process.env.PUBLIC_URL;

// Landing pubblica dell'invito operaio: l'operaio apre il link, sceglie il nome
// e imposta un PIN personale (4 cifre) ed entra in Produzione nella sua azienda.
export default function FloorInviteLanding({ token, onEnter }) {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [info, setInfo] = useState(null);
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => { floorInvitesApi.info(token).then(setInfo).catch(() => setInfo({ ok: false, valid: false })); }, [token]);

  const submit = async () => {
    setErr("");
    const nm = name.trim();
    if (!nm) { setErr(tri("Scrivi il tuo nome", "Bitte Namen eingeben", "Enter your name", "Escribe tu nombre", "Entrez votre nom", "نام خود را وارد کنید")); return; }
    if (!/^\d{4}$/.test(pin)) { setErr(tri("Il PIN deve avere 4 cifre", "PIN muss 4 Ziffern haben", "PIN must be 4 digits", "El PIN debe tener 4 dígitos", "Le PIN doit avoir 4 chiffres", "پین باید ۴ رقم باشد")); return; }
    setBusy(true);
    try {
      const r = await floorInvitesApi.redeem(token, nm, pin);
      if (r && r.ok) { onEnter({ mode: "floor", level: r.operator_level || "novizio", name: r.name || nm }); }
    } catch (e) {
      const d = e && e.response && e.response.data && e.response.data.detail;
      setErr(typeof d === "string" ? d : tri("Invito non valido o scaduto", "Einladung ungültig/abgelaufen", "Invite invalid or expired", "Invitación no válida o expirada", "Invitation invalide ou expirée", "دعوت نامعتبر یا منقضی"));
    } finally { setBusy(false); }
  };

  const valid = info && info.valid;

  return (
    <div data-testid="floor-invite-landing" className="relative min-h-screen overflow-hidden bg-[#0A0A0C] text-white flex flex-col items-center justify-center px-6">
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(217,119,54,0.14) 0%, transparent 55%)" }} />
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-sm rounded-3xl border border-[#D97736]/25 bg-[#141416]/90 backdrop-blur-xl p-7 shadow-2xl">
        <div className="flex flex-col items-center text-center mb-5">
          <img src={`${PUB}/logo-emblem.png`} alt="MikiLab" data-keepcolor className="w-14 h-14 rounded-xl object-contain mb-3" />
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#7E9A82]/15 border border-[#7E9A82]/40 text-[#7E9A82] text-[10px] font-bold uppercase tracking-wider mb-2">
            <HardHat className="w-3.5 h-3.5" /> {tri("Ingresso Produzione", "Produktions-Zugang", "Production entry", "Acceso Producción", "Accès Production", "ورود تولید")}
          </div>
          {info == null ? (
            <Loader2 className="w-5 h-5 animate-spin text-[#8a97a6] mt-2" />
          ) : valid ? (
            <>
              <h1 className="font-cyber text-2xl font-black tracking-wide">{info.org_name}</h1>
              {info.note && <p className="text-[12px] text-[#a6b1bc] mt-1">{info.note}</p>}
              <p className="text-[12.5px] text-[#94A3B8] mt-2 leading-snug">
                {tri("Scrivi il tuo nome e scegli un PIN personale di 4 cifre per entrare.",
                     "Gib deinen Namen ein und wähle eine persönliche 4-stellige PIN.",
                     "Enter your name and pick a personal 4-digit PIN to enter.",
                     "Escribe tu nombre y elige un PIN personal de 4 dígitos.",
                     "Entrez votre nom et choisissez un PIN personnel à 4 chiffres.",
                     "نام خود را وارد کنید و یک پین ۴ رقمی انتخاب کنید.")}
              </p>
            </>
          ) : (
            <div className="mt-2 inline-flex flex-col items-center gap-1.5 text-[#bb8489]">
              <ShieldAlert className="w-7 h-7" />
              <p className="text-[13px] font-bold">{tri("Invito non valido o scaduto", "Einladung ungültig/abgelaufen", "Invite invalid or expired", "Invitación no válida o expirada", "Invitation invalide ou expirée", "دعوت نامعتبر یا منقضی")}</p>
              <p className="text-[11px] text-[#94A3B8]">{tri("Chiedi alla Direzione un nuovo link.", "Bitte die Leitung um einen neuen Link.", "Ask management for a new link.", "Pide a la Dirección un nuevo enlace.", "Demandez un nouveau lien à la Direction.", "از مدیریت لینک جدید بخواهید.")}</p>
            </div>
          )}
        </div>

        {valid && (
          <div className="space-y-3">
            <input data-testid="floor-invite-name" value={name} onChange={(e) => setName(e.target.value)}
              placeholder={tri("Il tuo nome", "Dein Name", "Your name", "Tu nombre", "Votre nom", "نام شما")}
              className="w-full rounded-xl bg-[#0A0A0C] border border-[#8a97a6]/30 text-white text-sm px-3.5 py-3 outline-none focus:border-[#D97736]" />
            <input data-testid="floor-invite-pin" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              inputMode="numeric" type="password" placeholder={tri("PIN a 4 cifre", "4-stellige PIN", "4-digit PIN", "PIN de 4 dígitos", "PIN à 4 chiffres", "پین ۴ رقمی")}
              className="w-full rounded-xl bg-[#0A0A0C] border border-[#8a97a6]/30 text-white text-center text-2xl tracking-[0.5em] px-3.5 py-3 outline-none focus:border-[#D97736]"
              onKeyDown={(e) => { if (e.key === "Enter") submit(); }} />
            {err && <p data-testid="floor-invite-error" className="text-[12px] text-[#bb8489] font-semibold text-center">{err}</p>}
            <button data-testid="floor-invite-enter" onClick={submit} disabled={busy}
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-[#D97736] text-[#0A0A0C] font-black text-sm active:scale-95 transition-all disabled:opacity-60">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{tri("Entra", "Eintreten", "Enter", "Entrar", "Entrer", "ورود")} <ArrowRight className="w-4 h-4" /></>}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
