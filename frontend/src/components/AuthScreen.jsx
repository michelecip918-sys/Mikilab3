import { useState } from "react";
import { toast } from "sonner";
import { Mail, Lock, User, LogIn, UserPlus, X } from "lucide-react";
import { authApi } from "@/lib/api";
import { useAuth } from "@/auth/AuthContext";
import { useLang } from "@/i18n/LanguageContext";

export default function AuthScreen({ onClose }) {
  const { setUser } = useAuth();
  const { lang, tri } = useLang();
  const de = lang === "de";
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const T = {
    title: "Mikilab",
    sub: tri("L'assistente del fornaio · Accedi", "Der Backstube-Assistent · Anmelden", "The baker's assistant · Sign in"),
    login: tri("Accedi", "Anmelden", "Sign in"),
    register: tri("Registrati", "Registrieren", "Register"),
    email: "Email",
    pw: tri("Password", "Passwort", "Password"),
    name: tri("Nome", "Name", "Name"),
    google: tri("Continua con Google", "Mit Google fortfahren", "Continue with Google"),
    or: tri("oppure", "oder", "or"),
    note: tri("Le tue ricette sono private. Protette dal login.", "Deine Rezepte sind privat. Mit Login geschützt.", "Your recipes are private. Protected by login."),
    switch_r: tri("Non hai un account? Registrati", "Noch kein Konto? Registrieren", "No account yet? Register"),
    switch_l: tri("Hai già un account? Accedi", "Schon registriert? Anmelden", "Already registered? Sign in"),
    forgot: tri("Password dimenticata?", "Passwort vergessen?", "Forgot password?"),
    forgot_title: tri("Reimposta la password", "Passwort zurücksetzen", "Reset password"),
    forgot_sub: tri("Ti inviamo un link via email.", "Wir senden dir einen Link per E-Mail.", "We'll email you a link."),
    send: tri("Invia link", "Link senden", "Send link"),
    back: tri("Torna al login", "Zurück zum Login", "Back to login"),
    sent_msg: tri("Se l'email esiste, ti abbiamo inviato un link. Controlla la posta.", "Wenn die E-Mail existiert, haben wir dir einen Link gesendet. Prüfe dein Postfach.", "If the email exists, we've sent you a link. Check your inbox."),
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "forgot") {
        await authApi.forgot(email, lang);
        setSent(true);
        setBusy(false);
        return;
      }
      const data = mode === "login"
        ? await authApi.login({ email, password })
        : await authApi.register({ email, password, name });
      setUser(data.user);
      toast.success(tri("Benvenuto!", "Willkommen!", "Welcome!"));
    } catch (err) {
      const msg = err?.response?.data?.detail || tri("Errore", "Fehler", "Error");
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const google = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + "/";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#f0f6fb] dark:bg-[#1B2127]">
      <div className="w-full max-w-sm relative" data-testid="auth-screen">
        {onClose && (
          <button data-testid="auth-close" onClick={onClose} aria-label="Chiudi"
            className="absolute -top-2 right-0 w-9 h-9 rounded-full bg-[#e4eff8] dark:bg-[#2A323A] border border-[#d5e4f0] dark:border-[#38424B] flex items-center justify-center text-[#7E8A93] z-10">
            <X className="w-5 h-5" />
          </button>
        )}
        <div className="text-center mb-6">
          <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Mikilab" className="w-20 h-20 rounded-2xl object-cover ring-2 ring-[#A9C5D4]/70 shadow-lg mx-auto mb-3" />
          <h1 className="font-display text-3xl font-bold text-[#2B303B] dark:text-[#e4eff8]">{T.title}</h1>
          <p className="text-sm text-[#7E8A93] mt-1">{T.sub} 🇮🇹 🇩🇪</p>
        </div>

        {mode !== "forgot" && (
          <>
            <button data-testid="google-login-btn" onClick={google}
              className="w-full flex items-center justify-center gap-2 bg-white dark:bg-[#232A31] border border-[#d5e4f0] dark:border-[#38424B] rounded-2xl px-4 py-3 font-semibold text-[#2B303B] dark:text-[#e4eff8] shadow-sm active:scale-98 transition-all mb-4">
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" className="w-5 h-5" />
              {T.google}
            </button>

            <div className="flex items-center gap-3 mb-4">
              <span className="flex-1 h-px bg-[#d5e4f0] dark:bg-[#38424B]" />
              <span className="text-xs text-[#7E8A93]">{T.or}</span>
              <span className="flex-1 h-px bg-[#d5e4f0] dark:bg-[#38424B]" />
            </div>
          </>
        )}

        {mode === "forgot" && sent ? (
          <div data-testid="forgot-sent" className="rounded-2xl bg-[#5aa0cf]/10 border border-[#5aa0cf]/30 p-5 text-center">
            <Mail className="w-8 h-8 text-[#5aa0cf] mx-auto mb-2" />
            <p className="text-sm text-[#3F4A54] dark:text-[#AEB8BF]">{T.sent_msg}</p>
          </div>
        ) : (
        <form onSubmit={submit} className="space-y-3">
          {mode === "forgot" && (
            <p className="text-sm text-[#7E8A93] text-center -mt-1 mb-1">{T.forgot_sub}</p>
          )}
          {mode === "register" && (
            <Field icon={<User className="w-4 h-4" />}>
              <input data-testid="auth-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={T.name}
                className="flex-1 bg-transparent outline-none text-sm text-[#2B303B] dark:text-[#e4eff8]" />
            </Field>
          )}
          <Field icon={<Mail className="w-4 h-4" />}>
            <input data-testid="auth-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={T.email}
              className="flex-1 bg-transparent outline-none text-sm text-[#2B303B] dark:text-[#e4eff8]" />
          </Field>
          {mode !== "forgot" && (
            <Field icon={<Lock className="w-4 h-4" />}>
              <input data-testid="auth-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder={T.pw}
                className="flex-1 bg-transparent outline-none text-sm text-[#2B303B] dark:text-[#e4eff8]" />
            </Field>
          )}
          {mode === "login" && (
            <button type="button" data-testid="auth-forgot-link" onClick={() => { setMode("forgot"); setSent(false); }}
              className="block w-full text-right text-xs text-[#7E8A93] hover:text-[#3f7cac] -mt-1">
              {T.forgot}
            </button>
          )}
          <button data-testid="auth-submit" type="submit" disabled={busy}
            className="w-full flex items-center justify-center gap-2 bg-[#3f7cac] hover:bg-[#336a94] disabled:opacity-50 text-white font-semibold px-5 py-3 rounded-2xl shadow-md active:scale-98 transition-all">
            {mode === "login" ? <LogIn className="w-5 h-5" /> : mode === "register" ? <UserPlus className="w-5 h-5" /> : <Mail className="w-5 h-5" />}
            {mode === "login" ? T.login : mode === "register" ? T.register : T.send}
          </button>
        </form>
        )}

        {mode === "forgot" ? (
          <button data-testid="auth-switch" onClick={() => { setMode("login"); setSent(false); }}
            className="w-full text-center text-sm text-[#3f7cac] font-medium mt-4">
            {T.back}
          </button>
        ) : (
          <button data-testid="auth-switch" onClick={() => setMode(mode === "login" ? "register" : "login")}
            className="w-full text-center text-sm text-[#3f7cac] font-medium mt-4">
            {mode === "login" ? T.switch_r : T.switch_l}
          </button>
        )}
        <p className="text-center text-xs text-[#7E8A93] mt-3">{T.note}</p>
      </div>
    </div>
  );
}

function Field({ icon, children }) {
  return (
    <div className="flex items-center gap-2 bg-white dark:bg-[#232A31] border border-[#d5e4f0] dark:border-[#38424B] rounded-2xl px-4 py-3">
      <span className="text-[#3f7cac]">{icon}</span>
      {children}
    </div>
  );
}
