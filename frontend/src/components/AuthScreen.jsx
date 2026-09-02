import { useState } from "react";
import { toast } from "sonner";
import { Mail, Lock, User, LogIn, UserPlus, X } from "lucide-react";
import { authApi } from "@/lib/api";
import { useAuth } from "@/auth/AuthContext";
import { useLang } from "@/i18n/LanguageContext";

export default function AuthScreen({ onClose, initialMode = "login" }) {
  const { setUser } = useAuth();
  const { lang, tri } = useLang();
  const de = lang === "de";
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [info, setInfo] = useState("");
  const [needVerify, setNeedVerify] = useState(false);

  const pwStrong = password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);

  const T = {
    title: "MikiLab",
    sub: tri("L'assistente del fornaio · Accedi", "Der Backstube-Assistent · Anmelden", "The baker's assistant · Sign in"),
    login: tri("Accedi", "Anmelden", "Sign in", "Acceder"),
    register: tri("Registrati", "Registrieren", "Register", "Regístrate"),
    email: "Email",
    pw: tri("Password", "Passwort", "Password", "Contraseña"),
    name: tri("Nome", "Name", "Name", "Nombre"),
    google: tri("Continua con Google", "Mit Google fortfahren", "Continue with Google", "Continuar con Google"),
    or: tri("oppure", "oder", "or", "o"),
    note: tri("Le tue ricette sono private. Protette dal login.", "Deine Rezepte sind privat. Mit Login geschützt.", "Your recipes are private. Protected by login.", "Tus recetas son privadas. Protegidas con el acceso."),
    switch_r: tri("Non hai un account? Registrati", "Noch kein Konto? Registrieren", "No account yet? Register", "¿No tienes cuenta? Regístrate"),
    switch_l: tri("Hai già un account? Accedi", "Schon registriert? Anmelden", "Already registered? Sign in", "¿Ya tienes cuenta? Accede"),
    forgot: tri("Password dimenticata?", "Passwort vergessen?", "Forgot password?", "¿Olvidaste la contraseña?"),
    forgot_title: tri("Reimposta la password", "Passwort zurücksetzen", "Reset password", "Restablecer contraseña"),
    forgot_sub: tri("Ti inviamo un link via email.", "Wir senden dir einen Link per E-Mail.", "We'll email you a link.", "Te enviamos un enlace por correo."),
    send: tri("Invia link", "Link senden", "Send link", "Enviar enlace"),
    back: tri("Torna al login", "Zurück zum Login", "Back to login", "Volver al acceso"),
    sent_msg: tri("Se l'email esiste, ti abbiamo inviato un link. Controlla la posta.", "Wenn die E-Mail existiert, haben wir dir einen Link gesendet. Prüfe dein Postfach.", "If the email exists, we've sent you a link. Check your inbox.", "Si el correo existe, te hemos enviado un enlace. Revisa tu bandeja."),
  };

  const submit = async (e) => {
    e.preventDefault();
    setInfo("");
    if (mode === "register") {
      if (!pwStrong) { toast.error(tri("La password deve avere almeno 8 caratteri, con lettere e numeri.", "Passwort: min. 8 Zeichen mit Buchstaben und Zahlen.", "Password must be 8+ chars with letters and numbers.", "La contraseña debe tener 8+ caracteres, con letras y números.")); return; }
      if (password !== confirm) { toast.error(tri("Le password non coincidono.", "Passwörter stimmen nicht überein.", "Passwords do not match.", "Las contraseñas no coinciden.")); return; }
    }
    setBusy(true);
    try {
      if (mode === "forgot") {
        await authApi.forgot(email, lang);
        setSent(true);
        setBusy(false);
        return;
      }
      if (mode === "register") {
        const r = await authApi.register({ email, password, name, origin_url: window.location.origin, lang });
        if (r?.needs_verification) {
          setNeedVerify(true);
          setInfo(r.message || tri("Controlla la tua email per attivare l'account.", "Prüfe deine E-Mail.", "Check your email to activate your account.", "Revisa tu correo para activar la cuenta."));
          setBusy(false);
          return;
        }
        setUser(r.user);
        toast.success(tri("Benvenuto!", "Willkommen!", "Welcome!", "¡Bienvenido!"));
        return;
      }
      const data = await authApi.login({ email, password });
      setUser(data.user);
      toast.success(tri("Benvenuto!", "Willkommen!", "Welcome!", "¡Bienvenido!"));
    } catch (err) {
      const detail = err?.response?.data?.detail;
      if (err?.response?.status === 403 && detail === "verify_email") {
        setNeedVerify(true);
        setInfo(tri("Devi confermare l'email prima di accedere. Controlla la posta o richiedi un nuovo link.", "Bitte bestätige zuerst deine E-Mail.", "Please verify your email before signing in.", "Debes confirmar tu correo antes de acceder."));
        setBusy(false);
        return;
      }
      const msg = (typeof detail === "string" && detail) || tri("Errore", "Fehler", "Error", "Error");
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const resendVerify = async () => {
    try { await authApi.resendVerification(email, lang); toast.success(tri("Email inviata di nuovo.", "E-Mail erneut gesendet.", "Email sent again.", "Correo reenviado.")); }
    catch { toast.error(tri("Errore", "Fehler", "Error", "Error")); }
  };

  const google = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + "/";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#121212] dark:bg-[#121212]">
      <div className="w-full max-w-sm relative" data-testid="auth-screen">
        {onClose && (
          <button data-testid="auth-close" onClick={onClose} aria-label="Chiudi"
            className="absolute -top-2 right-0 w-9 h-9 rounded-full bg-[#e4eff8] dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] flex items-center justify-center text-[#7E8A93] z-10">
            <X className="w-5 h-5" />
          </button>
        )}
        <div className="text-center mb-6">
          <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="MikiLab" className="w-20 h-20 rounded-2xl object-cover ring-2 ring-[#c94f00]/70 shadow-lg mx-auto mb-3" />
          <h1 className="font-display text-3xl font-bold text-[#2B303B] dark:text-[#e4eff8]">{T.title}</h1>
          <p className="text-sm text-[#7E8A93] mt-1">{T.sub} 🇮🇹 🇩🇪</p>
        </div>

        {mode !== "forgot" && (
          <div data-testid="auth-tabs" className="flex gap-1 mb-4 p-1 rounded-2xl bg-[#e4eff8] dark:bg-[#1e1e1e]">
            <button type="button" data-testid="auth-tab-login" onClick={() => { setMode("login"); setNeedVerify(false); setInfo(""); }}
              className={`flex-1 py-2.5 rounded-2xl shadow-md border border-amber-900/40 text-sm font-semibold transition-all ${mode === "login" ? "bg-white dark:bg-[#c94f00] text-[#c94f00] dark:text-white shadow-sm" : "text-[#7E8A93]"}`}>
              {T.login}
            </button>
            <button type="button" data-testid="auth-tab-register" onClick={() => { setMode("register"); setNeedVerify(false); setInfo(""); }}
              className={`flex-1 py-2.5 rounded-2xl shadow-md border border-amber-900/40 text-sm font-semibold transition-all ${mode === "register" ? "bg-white dark:bg-[#c94f00] text-[#c94f00] dark:text-white shadow-sm" : "text-[#7E8A93]"}`}>
              {T.register}
            </button>
          </div>
        )}

        {info && (
          <div data-testid="auth-info" className="mb-4 rounded-2xl bg-[#c94f00]/10 border border-[#c94f00]/30 p-4 text-center">
            <Mail className="w-7 h-7 text-[#c94f00] mx-auto mb-1.5" />
            <p className="text-sm text-[#3F4A54] dark:text-[#AEB8BF]">{info}</p>
            {needVerify && (
              <button type="button" data-testid="auth-resend-verify" onClick={resendVerify}
                className="mt-2 text-xs font-semibold text-[#c94f00] underline">
                {tri("Invia di nuovo l'email", "E-Mail erneut senden", "Resend email", "Reenviar correo")}
              </button>
            )}
          </div>
        )}

        {mode !== "forgot" && (
          <>
            <button data-testid="google-login-btn" onClick={google}
              className="w-full flex items-center justify-center gap-2 bg-white dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] rounded-2xl px-4 py-3 font-semibold text-[#2B303B] dark:text-[#e4eff8] shadow-sm active:scale-98 transition-all mb-4">
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" className="w-5 h-5" />
              {T.google}
            </button>

            <div className="flex items-center gap-3 mb-4">
              <span className="flex-1 h-px bg-[#2e2e2e] dark:bg-[#2e2e2e]" />
              <span className="text-xs text-[#7E8A93]">{T.or}</span>
              <span className="flex-1 h-px bg-[#2e2e2e] dark:bg-[#2e2e2e]" />
            </div>
          </>
        )}

        {mode === "forgot" && sent ? (
          <div data-testid="forgot-sent" className="rounded-2xl bg-[#c94f00]/10 border border-[#c94f00]/30 p-5 text-center">
            <Mail className="w-8 h-8 text-[#c94f00] mx-auto mb-2" />
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
          {mode === "register" && (
            <>
              <p className={`text-xs -mt-1 ${password ? (pwStrong ? "text-[#3E7C59]" : "text-[#c94f00]") : "text-[#7E8A93]"}`}>
                {tri("Min 8 caratteri, con lettere e numeri.", "Min. 8 Zeichen, Buchstaben und Zahlen.", "Min 8 characters, letters and numbers.", "Mín. 8 caracteres, con letras y números.")}
              </p>
              <Field icon={<Lock className="w-4 h-4" />}>
                <input data-testid="auth-confirm" type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)}
                  placeholder={tri("Conferma password", "Passwort bestätigen", "Confirm password", "Confirmar contraseña")}
                  className="flex-1 bg-transparent outline-none text-sm text-[#2B303B] dark:text-[#e4eff8]" />
              </Field>
            </>
          )}
          {mode === "login" && (
            <button type="button" data-testid="auth-forgot-link" onClick={() => { setMode("forgot"); setSent(false); }}
              className="block w-full text-right text-xs text-[#7E8A93] hover:text-[#c94f00] -mt-1">
              {T.forgot}
            </button>
          )}
          <button data-testid="auth-submit" type="submit" disabled={busy}
            className="w-full flex items-center justify-center gap-2 bg-[#c94f00] hover:bg-[#d4a373] disabled:opacity-50 text-white font-semibold px-5 py-3 rounded-2xl shadow-md active:scale-98 transition-all">
            {mode === "login" ? <LogIn className="w-5 h-5" /> : mode === "register" ? <UserPlus className="w-5 h-5" /> : <Mail className="w-5 h-5" />}
            {mode === "login" ? T.login : mode === "register" ? T.register : T.send}
          </button>
        </form>
        )}

        {mode === "forgot" ? (
          <button data-testid="auth-switch" onClick={() => { setMode("login"); setSent(false); }}
            className="w-full text-center text-sm text-[#c94f00] font-medium mt-4">
            {T.back}
          </button>
        ) : (
          <button data-testid="auth-switch" onClick={() => setMode(mode === "login" ? "register" : "login")}
            className="w-full text-center text-sm text-[#c94f00] font-medium mt-4">
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
    <div className="flex items-center gap-2 bg-white dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] rounded-2xl px-4 py-3">
      <span className="text-[#c94f00]">{icon}</span>
      {children}
    </div>
  );
}
