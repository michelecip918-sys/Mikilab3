import { useState, useEffect } from "react";
import { Mail, CheckCircle2, Send, Users } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { newsletterApi } from "@/lib/api";

export default function NewsletterSignup() {
  const { lang } = useLang();
  const L = (...a) => mkTri(lang)(...a);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const [count, setCount] = useState(0);

  useEffect(() => { newsletterApi.count().then((n) => setCount(n || 0)); }, []);

  const valid = /\S+@\S+\.\S+/.test(email);

  const submit = async (e) => {
    e.preventDefault();
    if (!valid || busy) return;
    setBusy(true);
    setErr("");
    try {
      await newsletterApi.subscribe(email.trim(), lang, "home");
      setDone(true);
      setCount((c) => c + 1);
    } catch {
      setErr(L(
        "Qualcosa è andato storto. Riprova.",
        "Etwas ist schiefgelaufen. Versuche es erneut.",
        "Something went wrong. Please try again.",
        "Algo salió mal. Inténtalo de nuevo.",
        "Une erreur s'est produite. Réessaie.",
        "مشکلی پیش آمد. دوباره تلاش کنید.",
      ));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div data-testid="home-newsletter" className="relative overflow-hidden rounded-3xl p-6 border border-[#26324A] shadow-md"
      style={{ background: "linear-gradient(135deg,#F26419 0%,#F26419 60%,#F26419 100%)" }}>
      <div aria-hidden className="absolute -left-10 -bottom-10 w-40 h-40 rounded-full opacity-20" style={{ background: "radial-gradient(circle,#E8A838,transparent 70%)" }} />
      <div className="relative">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center shrink-0">
            <Mail className="w-6 h-6 text-[#f0dcb4]" />
          </div>
          <div>
            <h3 data-testid="newsletter-title" className="font-display text-lg font-bold text-white leading-tight">
              {L("Ricevi la ricetta della settimana",
                 "Erhalte das Rezept der Woche",
                 "Get the recipe of the week",
                 "Recibe la receta de la semana",
                 "Recevez la recette de la semaine",
                 "دستور پخت هفته را دریافت کنید")}
            </h3>
            <p className="text-white/75 text-[13px] leading-snug">
              {L("Una ricetta del mio metodo, ogni settimana via email. Gratis.",
                 "Ein Rezept nach meiner Methode, jede Woche per E-Mail. Kostenlos.",
                 "One recipe from my method, every week by email. Free.",
                 "Una receta de mi método, cada semana por email. Gratis.",
                 "Une recette de ma méthode, chaque semaine par e-mail. Gratuit.",
                 "هر هفته یک دستور پخت به روش من، از طریق ایمیل. رایگان.")}
            </p>
          </div>
        </div>

        {count > 0 && (
          <div data-testid="newsletter-social-proof" className="flex items-center gap-2 mt-2 text-[#f0dcb4] text-[13px] font-semibold">
            <Users className="w-4 h-4 shrink-0" />
            <span>{L(
              `Già ${count} fornai iscritti`,
              `Bereits ${count} Bäcker dabei`,
              `Already ${count} bakers subscribed`,
              `Ya ${count} panaderos suscritos`,
              `Déjà ${count} boulangers inscrits`,
              `از قبل ${count} نانوا عضو شده‌اند`,
            )}</span>
          </div>
        )}

        {done ? (
          <div data-testid="newsletter-success" className="flex items-center gap-2 mt-3 rounded-2xl bg-white/12 border border-white/20 px-4 py-3 text-white">
            <CheckCircle2 className="w-5 h-5 text-[#8fd6a8] shrink-0" />
            <p className="text-sm leading-snug">
              {L("Iscrizione confermata! Controlla la tua email di benvenuto. 🥖",
                 "Anmeldung bestätigt! Prüfe deine Willkommens-E-Mail. 🥖",
                 "You're subscribed! Check your welcome email. 🥖",
                 "¡Suscripción confirmada! Revisa tu email de bienvenida. 🥖",
                 "Inscription confirmée ! Vérifie ton e-mail de bienvenue. 🥖",
                 "اشتراک تأیید شد! ایمیل خوش‌آمدگویی را بررسی کنید. 🥖")}
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-3 flex flex-col sm:flex-row gap-2">
            <input
              data-testid="newsletter-email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={L("La tua email", "Deine E-Mail", "Your email", "Tu email", "Ton e-mail", "ایمیل شما")}
              className="flex-1 rounded-2xl bg-white/95 text-[#F26419] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#F26419] placeholder:text-[#8a7a63]"
            />
            <button
              data-testid="newsletter-submit-btn"
              type="submit"
              disabled={!valid || busy}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#F26419] text-white font-bold text-sm px-5 py-3 shadow-lg active:scale-97 transition-all disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {busy
                ? L("Invio…", "Senden…", "Sending…", "Enviando…", "Envoi…", "در حال ارسال…")
                : L("Iscrivimi", "Anmelden", "Subscribe", "Suscribirme", "S'inscrire", "عضویت")}
            </button>
          </form>
        )}
        {err && <p data-testid="newsletter-error" className="text-[#f6c1b3] text-[12px] mt-2">{err}</p>}
        {!done && (
          <p className="text-white/55 text-[11px] mt-2">
            {L("Niente spam. Puoi disiscriverti quando vuoi.",
               "Kein Spam. Jederzeit abbestellbar.",
               "No spam. Unsubscribe anytime.",
               "Sin spam. Cancela cuando quieras.",
               "Pas de spam. Désabonnement à tout moment.",
               "بدون هرزنامه. هر زمان می‌توانید لغو کنید.")}
          </p>
        )}
      </div>
    </div>
  );
}
