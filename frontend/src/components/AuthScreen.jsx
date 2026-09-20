import { useState } from "react";
import { toast } from "sonner";
import { Mail, Lock, User, LogIn, UserPlus, X, KeyRound } from "lucide-react";
import { authApi } from "@/lib/api";
import { useAuth } from "@/auth/AuthContext";
import { useLang } from "@/i18n/LanguageContext";
import LangSelector from "@/components/LangSelector";

export default function AuthScreen({ onClose, initialMode = "login" }) {
  const { setUser } = useAuth();
  const { lang, tri } = useLang();
  const de = lang === "de";
  const inviteToken = (() => { try { return new URLSearchParams(window.location.search).get("invite") || ""; } catch { return ""; } })();
  const [mode, setMode] = useState(inviteToken ? "register" : initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [name, setName] = useState("");
  const [activationCode, setActivationCode] = useState("");
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
        const r = await authApi.register({ email, password, name, origin_url: window.location.origin, lang, invite_token: inviteToken, activation_code: activationCode });
        if (r?.needs_verification) {
          setNeedVerify(true);
          setInfo(r.message || tri("Controlla la tua email per attivare l'account.", "Prüfe deine E-Mail.", "Check your email to activate your account.", "Revisa tu correo para activar la cuenta."));
          setBusy(false);
          return;
        }
        setUser(r.user);
        toast.success(tri("Bentornato.", "Willkommen zurück.", "Welcome back.", "Bienvenido de nuevo."));
        return;
      }
      const data = await authApi.login({ email, password });
      setUser(data.user);
      toast.success(tri("Bentornato.", "Willkommen zurück.", "Welcome back.", "Bienvenido de nuevo."));
    } catch (err) {
      const detail = err?.response?.data?.detail;
      if (err?.response?.status === 403 && detail === "activation_code_invalid") {
        toast.error(tri("Codice di attivazione mancante o errato. Serve per creare una nuova azienda.", "Aktivierungscode fehlt oder ist falsch. Er wird benötigt, um ein neues Unternehmen zu erstellen.", "Missing or wrong activation code. It is required to create a new company.", "Código de activación ausente o incorrecto. Es necesario para crear una nueva empresa.", "Code d'activation manquant ou erroné. Nécessaire pour créer une nouvelle entreprise.", "کد فعال‌سازی نادرست است."));
        setBusy(false);
        return;
      }
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
    <div className="min-h-screen flex items-center justify-center px-4 bg-background dark:bg-background">
      <div className="w-full max-w-sm relative" data-testid="auth-screen">
        <div className="absolute -top-2 left-0 z-10"><LangSelector testid="auth-lang-selector" /></div>
        {onClose && (
          <button data-testid="auth-close" onClick={onClose} aria-label="Chiudi"
            className="absolute -top-2 right-0 w-9 h-9 rounded-full bg-muted dark:bg-card border border-border dark:border-border flex items-center justify-center text-muted-foreground z-10">
            <X className="w-5 h-5" />
          </button>
        )}
        <div className="text-center mb-6">
          <img src={`${process.env.PUBLIC_URL}/logo.webp`} alt="MikiLab" className="w-20 h-20 rounded-2xl object-cover ring-2 ring-primary/70 shadow-lg mx-auto mb-3" />
          <h1 className="font-display text-3xl font-bold text-foreground dark:text-foreground">{T.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{T.sub} 🇮🇹 🇩🇪</p>
        </div>

        {mode !== "forgot" && inviteToken && (
          <div data-testid="auth-tabs" className="flex gap-1 mb-4 p-1 rounded-2xl bg-muted dark:bg-card">
            <button type="button" data-testid="auth-tab-login" onClick={() => { setMode("login"); setNeedVerify(false); setInfo(""); }}
              className={`flex-1 py-2.5 rounded-2xl shadow-md border border-amber-900/40 text-sm font-semibold transition-all ${mode === "login" ? "bg-card dark:bg-primary text-primary dark:text-white shadow-sm" : "text-muted-foreground"}`}>
              {T.login}
            </button>
            <button type="button" data-testid="auth-tab-register" onClick={() => { setMode("register"); setNeedVerify(false); setInfo(""); }}
              className={`flex-1 py-2.5 rounded-2xl shadow-md border border-amber-900/40 text-sm font-semibold transition-all ${mode === "register" ? "bg-card dark:bg-primary text-primary dark:text-white shadow-sm" : "text-muted-foreground"}`}>
              {T.register}
            </button>
          </div>
        )}

        {mode === "register" && inviteToken && (
          <div data-testid="auth-invite-badge" className="mb-4 rounded-2xl bg-primary/10 border border-primary/30 p-3 text-center text-[13px] text-primary font-semibold">
            🔑 {tri("Invito valido · crea il tuo accesso", "Gültige Einladung · erstelle deinen Zugang", "Valid invite · create your access", "Invitación válida · crea tu acceso", "Invitation valide · crée ton accès", "دعوت معتبر · دسترسی‌ات را بساز")}
          </div>
        )}
        {mode === "login" && !inviteToken && (
          <div data-testid="auth-invite-only" className="mb-4 rounded-2xl bg-card border border-border p-3 text-center text-[12px] text-muted-foreground">
            {tri("Per creare una nuova azienda/Capo serve il codice di attivazione. Gli operai entrano con il PIN.", "Für ein neues Unternehmen ist der Aktivierungscode nötig. Mitarbeiter nutzen den PIN.", "Creating a new company/manager requires the activation code. Operators enter with the PIN.", "Crear una nueva empresa requiere el código de activación. Los operarios entran con PIN.", "Créer une nouvelle entreprise nécessite le code d'activation. Les opérateurs entrent avec le PIN.", "ایجاد شرکت جدید به کد فعال‌سازی نیاز دارد.")}
          </div>
        )}

        {info && (
          <div data-testid="auth-info" className="mb-4 rounded-2xl bg-primary/10 border border-primary/30 p-4 text-center">
            <Mail className="w-7 h-7 text-primary mx-auto mb-1.5" />
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">{info}</p>
            {needVerify && (
              <button type="button" data-testid="auth-resend-verify" onClick={resendVerify}
                className="mt-2 text-xs font-semibold text-primary underline">
                {tri("Invia di nuovo l'email", "E-Mail erneut senden", "Resend email", "Reenviar correo")}
              </button>
            )}
          </div>
        )}

        {mode !== "forgot" && (
          <>
            <button data-testid="google-login-btn" onClick={google}
              className="w-full flex items-center justify-center gap-2 bg-card dark:bg-card border border-border dark:border-border rounded-2xl px-4 py-3 font-semibold text-foreground dark:text-foreground shadow-sm active:scale-98 transition-all mb-4">
              <img src="/brand/google.svg" alt="" className="w-5 h-5" />
              {T.google}
            </button>

            <div className="flex items-center gap-3 mb-4">
              <span className="flex-1 h-px bg-secondary dark:bg-secondary" />
              <span className="text-xs text-muted-foreground">{T.or}</span>
              <span className="flex-1 h-px bg-secondary dark:bg-secondary" />
            </div>
          </>
        )}

        {mode === "forgot" && sent ? (
          <div data-testid="forgot-sent" className="rounded-2xl bg-primary/10 border border-primary/30 p-5 text-center">
            <Mail className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">{T.sent_msg}</p>
          </div>
        ) : (
        <form onSubmit={submit} className="space-y-3">
          {mode === "forgot" && (
            <p className="text-sm text-muted-foreground text-center -mt-1 mb-1">{T.forgot_sub}</p>
          )}
          {mode === "register" && (
            <Field icon={<User className="w-4 h-4" />}>
              <input data-testid="auth-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={T.name}
                className="flex-1 bg-transparent outline-none text-sm text-foreground dark:text-foreground" />
            </Field>
          )}
          <Field icon={<Mail className="w-4 h-4" />}>
            <input data-testid="auth-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={T.email}
              className="flex-1 bg-transparent outline-none text-sm text-foreground dark:text-foreground" />
          </Field>
          {mode !== "forgot" && (
            <Field icon={<Lock className="w-4 h-4" />}>
              <input data-testid="auth-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder={T.pw}
                className="flex-1 bg-transparent outline-none text-sm text-foreground dark:text-foreground" />
            </Field>
          )}
          {mode === "register" && (
            <>
              <p className={`text-xs -mt-1 ${password ? (pwStrong ? "text-muted-foreground" : "text-primary") : "text-muted-foreground"}`}>
                {tri("Min 8 caratteri, con lettere e numeri.", "Min. 8 Zeichen, Buchstaben und Zahlen.", "Min 8 characters, letters and numbers.", "Mín. 8 caracteres, con letras y números.")}
              </p>
              <Field icon={<Lock className="w-4 h-4" />}>
                <input data-testid="auth-confirm" type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)}
                  placeholder={tri("Conferma password", "Passwort bestätigen", "Confirm password", "Confirmar contraseña")}
                  className="flex-1 bg-transparent outline-none text-sm text-foreground dark:text-foreground" />
              </Field>
              <Field icon={<KeyRound className="w-4 h-4" />}>
                <input data-testid="auth-activation-code" value={activationCode} onChange={(e) => setActivationCode(e.target.value)}
                  placeholder={tri("Codice di attivazione azienda", "Firmen-Aktivierungscode", "Company activation code", "Código de activación de empresa", "Code d'activation entreprise", "کد فعال‌سازی شرکت")}
                  className="flex-1 bg-transparent outline-none text-sm text-foreground dark:text-foreground" />
              </Field>
              <p className="text-[11px] -mt-1 text-muted-foreground">{tri("Serve solo per creare una NUOVA azienda/Capo. Gli operai entrano con il PIN, senza codice.", "Nur für ein NEUES Unternehmen nötig. Mitarbeiter nutzen den PIN.", "Only needed to create a NEW company/manager. Operators enter with the PIN, no code.", "Solo para crear una NUEVA empresa. Los operarios entran con PIN.", "Uniquement pour créer une NOUVELLE entreprise. Les opérateurs entrent avec le PIN.", "فقط برای ایجاد شرکت جدید.")}</p>
            </>
          )}
          {mode === "login" && (
            <button type="button" data-testid="auth-forgot-link" onClick={() => { setMode("forgot"); setSent(false); }}
              className="block w-full text-right text-xs text-muted-foreground hover:text-primary -mt-1">
              {T.forgot}
            </button>
          )}
          <button data-testid="auth-submit" type="submit" disabled={busy}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-accent disabled:opacity-50 text-white font-semibold px-5 py-3 rounded-2xl shadow-md active:scale-98 transition-all">
            {mode === "login" ? <LogIn className="w-5 h-5" /> : mode === "register" ? <UserPlus className="w-5 h-5" /> : <Mail className="w-5 h-5" />}
            {mode === "login" ? T.login : mode === "register" ? T.register : T.send}
          </button>
        </form>
        )}

        {mode === "forgot" ? (
          <button data-testid="auth-switch" onClick={() => { setMode("login"); setSent(false); }}
            className="w-full text-center text-sm text-primary font-medium mt-4">
            {T.back}
          </button>
        ) : (
          <button data-testid="auth-switch" onClick={() => setMode(mode === "login" ? "register" : "login")}
            className="w-full text-center text-sm text-primary font-medium mt-4">
            {mode === "login" ? T.switch_r : T.switch_l}
          </button>
        )}
        <p className="text-center text-xs text-muted-foreground mt-3">{T.note}</p>
      </div>
    </div>
  );
}

function Field({ icon, children }) {
  return (
    <div className="flex items-center gap-2 bg-card dark:bg-card border border-border dark:border-border rounded-2xl px-4 py-3">
      <span className="text-primary">{icon}</span>
      {children}
    </div>
  );
}
