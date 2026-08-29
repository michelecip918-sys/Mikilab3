import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, X, Send, CheckCircle2 } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { newsletterApi } from "@/lib/api";
import { useAuth } from "@/auth/AuthContext";

const SEEN_KEY = "mikilab_newsletter_popup_seen";

export default function NewsletterPopup() {
  const { lang } = useLang();
  const { user } = useAuth();
  const L = (...a) => mkTri(lang)(...a);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (user) return; // niente popup per utenti loggati (non blocca l'interazione)
    let seen = false;
    try { seen = !!localStorage.getItem(SEEN_KEY); } catch { /* */ }
    if (seen) return;
    const id = setTimeout(() => setOpen(true), 14000);
    return () => clearTimeout(id);
  }, [user]);

  const dismiss = () => {
    try { localStorage.setItem(SEEN_KEY, "1"); } catch { /* */ }
    setOpen(false);
  };

  const valid = /\S+@\S+\.\S+/.test(email);

  const submit = async (e) => {
    e.preventDefault();
    if (!valid || busy) return;
    setBusy(true);
    try {
      await newsletterApi.subscribe(email.trim(), lang, "popup");
      setDone(true);
      try { localStorage.setItem(SEEN_KEY, "1"); } catch { /* */ }
      setTimeout(() => setOpen(false), 2200);
    } catch { /* */ } finally { setBusy(false); }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          data-testid="newsletter-popup"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[85] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={dismiss}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 22, stiffness: 260 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-[#ffc700]/40"
            style={{ background: "linear-gradient(160deg,#ff6b00 0%,#ff6b00 55%,#ff6b00 100%)" }}
          >
            <button data-testid="newsletter-popup-close" onClick={dismiss}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white/90 z-10">
              <X className="w-4 h-4" />
            </button>
            <div className="p-6">
              <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center mb-3">
                <Mail className="w-7 h-7 text-[#f0dcb4]" />
              </div>
              <h3 className="font-display text-xl font-bold text-white leading-tight">
                {L("La ricetta della settimana, gratis 🥖",
                   "Das Rezept der Woche, kostenlos 🥖",
                   "The recipe of the week, free 🥖",
                   "La receta de la semana, gratis 🥖",
                   "La recette de la semaine, gratuite 🥖",
                   "دستور پخت هفته، رایگان 🥖")}
              </h3>
              <p className="text-white/80 text-sm leading-snug mt-1.5">
                {L("Lascia la tua email e ricevi ogni settimana una ricetta del mio metodo. Nessun pagamento, disiscrizione quando vuoi.",
                   "Lass deine E-Mail da und erhalte jede Woche ein Rezept nach meiner Methode. Keine Zahlung, jederzeit abbestellbar.",
                   "Leave your email and get a recipe from my method every week. No payment, unsubscribe anytime.",
                   "Deja tu email y recibe cada semana una receta de mi método. Sin pago, cancela cuando quieras.",
                   "Laisse ton e-mail et reçois chaque semaine une recette de ma méthode. Sans paiement, désabonnement à tout moment.",
                   "ایمیل خود را بگذارید و هر هفته یک دستور پخت به روش من دریافت کنید. بدون پرداخت، لغو در هر زمان.")}
              </p>

              {done ? (
                <div data-testid="newsletter-popup-success" className="flex items-center gap-2 mt-4 rounded-2xl bg-white/12 border border-white/20 px-4 py-3 text-white">
                  <CheckCircle2 className="w-5 h-5 text-[#8fd6a8] shrink-0" />
                  <p className="text-sm">{L("Iscrizione confermata! 🎉", "Anmeldung bestätigt! 🎉", "You're subscribed! 🎉", "¡Suscripción confirmada! 🎉", "Inscription confirmée ! 🎉", "اشتراک تأیید شد! 🎉")}</p>
                </div>
              ) : (
                <form onSubmit={submit} className="mt-4 flex flex-col gap-2">
                  <input
                    data-testid="newsletter-popup-input"
                    type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder={L("La tua email", "Deine E-Mail", "Your email", "Tu email", "Ton e-mail", "ایمیل شما")}
                    className="rounded-2xl bg-white/95 text-[#ff6b00] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#ffc700] placeholder:text-[#8a7a63]"
                  />
                  <button data-testid="newsletter-popup-submit" type="submit" disabled={!valid || busy}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#ffc700] text-white font-bold text-sm px-5 py-3 shadow-lg active:scale-97 transition-all disabled:opacity-50">
                    <Send className="w-4 h-4" />
                    {busy ? L("Invio…", "Senden…", "Sending…", "Enviando…", "Envoi…", "در حال ارسال…") : L("Iscrivimi gratis", "Kostenlos anmelden", "Subscribe free", "Suscribirme gratis", "S'inscrire gratuitement", "عضویت رایگان")}
                  </button>
                  <button type="button" data-testid="newsletter-popup-dismiss" onClick={dismiss} className="text-white/55 text-[12px] mt-0.5 hover:text-white/80">
                    {L("No grazie", "Nein danke", "No thanks", "No, gracias", "Non merci", "نه، ممنون")}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
