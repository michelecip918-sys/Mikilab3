import { useState } from "react";
import { toast } from "sonner";
import { Mail, Lock, LogIn, X } from "lucide-react";
import { authApi } from "@/lib/api";
import { useAuth } from "@/auth/AuthContext";
import { useLang } from "@/i18n/LanguageContext";
import LangSelector from "@/components/LangSelector";

// Schermata di accesso ADMIN (raggiungibile solo con ?admin=1).
// Solo email + password: niente registrazione, inviti, codici, PIN, Google o reset email.
export default function AuthScreen({ onClose }) {
  const { setUser } = useAuth();
  const { tri } = useLang();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const data = await authApi.login({ email, password });
      setUser(data.user);
      toast.success(tri("Accesso eseguito.", "Angemeldet.", "Signed in."));
    } catch (err) {
      const detail = err?.response?.data?.detail;
      const status = err?.response?.status;
      let msg;
      if (status === 401) msg = tri("Email o password errati.", "E-Mail oder Passwort falsch.", "Wrong email or password.");
      else if (status === 429) msg = tri("Troppi tentativi. Riprova tra qualche minuto.", "Zu viele Versuche. Bitte später erneut versuchen.", "Too many attempts. Please try again in a few minutes.");
      else if (status === 403) msg = tri("Questo accesso è riservato all'amministratore.", "Dieser Zugang ist dem Administrator vorbehalten.", "This access is restricted to the administrator.");
      else msg = (typeof detail === "string" && detail) || tri("Accesso non riuscito. Riprova.", "Anmeldung fehlgeschlagen. Bitte erneut versuchen.", "Sign-in failed. Please try again.");
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-sm relative" data-testid="auth-screen">
        <div className="absolute -top-2 left-0 z-10"><LangSelector testid="auth-lang-selector" /></div>
        {onClose && (
          <button data-testid="auth-close" onClick={onClose} aria-label={tri("Chiudi", "Schließen", "Close")}
            className="absolute -top-2 right-0 w-9 h-9 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground z-10">
            <X className="w-5 h-5" />
          </button>
        )}
        <div className="text-center mb-6">
          <img src={`${process.env.PUBLIC_URL}/logo.webp`} alt="MikiLab" className="w-20 h-20 rounded-2xl object-cover ring-2 ring-primary/70 shadow-lg mx-auto mb-3" />
          <h1 className="font-display text-3xl font-bold text-foreground">MikiLab</h1>
          <p className="text-sm text-muted-foreground mt-1">{tri("Accesso amministratore", "Administrator-Zugang", "Administrator access")}</p>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <Field icon={<Mail className="w-4 h-4" />}>
            <input data-testid="auth-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email"
              autoComplete="username"
              className="flex-1 bg-transparent outline-none text-sm text-foreground" />
          </Field>
          <Field icon={<Lock className="w-4 h-4" />}>
            <input data-testid="auth-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder={tri("Password", "Passwort", "Password")} autoComplete="current-password"
              className="flex-1 bg-transparent outline-none text-sm text-foreground" />
          </Field>
          <button data-testid="auth-submit" type="submit" disabled={busy}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-accent disabled:opacity-50 text-primary-foreground font-semibold px-5 py-3 rounded-2xl shadow-md active:scale-98 transition-all">
            <LogIn className="w-5 h-5" />
            {tri("Entra", "Anmelden", "Sign in")}
          </button>
        </form>
        <p className="text-center text-xs text-muted-foreground mt-4">{tri("Area riservata al gestore del sito.", "Bereich nur für den Seitenbetreiber.", "Restricted to the site operator.")}</p>
      </div>
    </div>
  );
}

function Field({ icon, children }) {
  return (
    <div className="flex items-center gap-2 bg-card border border-border rounded-2xl px-4 py-3">
      <span className="text-primary">{icon}</span>
      {children}
    </div>
  );
}
