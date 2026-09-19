import { useState } from "react";
import { toast } from "sonner";
import { Lock, KeyRound, X } from "lucide-react";
import { authApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";

export default function ResetPassword({ token, onDone }) {
  const { lang, tri } = useLang();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const pwStrong = password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);

  const submit = async (e) => {
    e.preventDefault();
    if (!pwStrong) { toast.error(tri("La password deve avere almeno 8 caratteri, con lettere e numeri.", "Passwort: min. 8 Zeichen mit Buchstaben und Zahlen.", "Password must be 8+ chars with letters and numbers.", "La contraseña debe tener 8+ caracteres, con letras y números.")); return; }
    if (password !== confirm) { toast.error(tri("Le password non coincidono", "Passwörter stimmen nicht überein", "Passwords do not match", "Las contraseñas no coinciden")); return; }
    setBusy(true);
    try {
      await authApi.reset(token, password);
      toast.success(tri("Password aggiornata! Accedi ora.", "Passwort geändert! Melde dich an.", "Password updated! Sign in now.", "¡Contraseña actualizada! Accede ahora."));
      onDone();
    } catch (err) {
      toast.error(err?.response?.data?.detail || tri("Errore", "Fehler", "Error", "Error"));
    } finally { setBusy(false); }
  };

  return (
    <div data-testid="reset-screen" className="fixed inset-0 z-[80] bg-background dark:bg-background overflow-auto flex items-center justify-center px-4">
      <div className="w-full max-w-sm relative">
        <button data-testid="reset-close" onClick={onDone} aria-label="Chiudi"
          className="absolute -top-2 right-0 w-9 h-9 rounded-full bg-muted dark:bg-card border border-border dark:border-border flex items-center justify-center text-muted-foreground z-10">
          <X className="w-5 h-5" />
        </button>
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-3">
            <KeyRound className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground dark:text-foreground">
            {tri("Nuova password", "Neues Passwort", "New password", "Nueva contraseña")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{tri("Scegli una nuova password per il tuo account.", "Wähle ein neues Passwort für dein Konto.", "Choose a new password for your account.", "Elige una nueva contraseña para tu cuenta.")}</p>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <Field icon={<Lock className="w-4 h-4" />}>
            <input data-testid="reset-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder={tri("Nuova password", "Neues Passwort", "New password", "Nueva contraseña")}
              className="flex-1 bg-transparent outline-none text-sm text-foreground dark:text-foreground" />
          </Field>
          <p className={`text-xs ${password ? (pwStrong ? "text-muted-foreground" : "text-primary") : "text-muted-foreground"}`}>
            {tri("Min 8 caratteri, con lettere e numeri.", "Min. 8 Zeichen, Buchstaben und Zahlen.", "Min 8 characters, letters and numbers.", "Mín. 8 caracteres, con letras y números.")}
          </p>
          <Field icon={<Lock className="w-4 h-4" />}>
            <input data-testid="reset-confirm" type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)}
              placeholder={tri("Conferma password", "Passwort bestätigen", "Confirm password", "Confirmar contraseña")}
              className="flex-1 bg-transparent outline-none text-sm text-foreground dark:text-foreground" />
          </Field>
          <button data-testid="reset-submit" type="submit" disabled={busy}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-accent disabled:opacity-50 text-white font-semibold px-5 py-3 rounded-2xl shadow-md active:scale-98 transition-all">
            {tri("Cambia password", "Passwort ändern", "Change password", "Cambiar contraseña")}
          </button>
        </form>
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
