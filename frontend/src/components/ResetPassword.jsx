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
    <div data-testid="reset-screen" className="fixed inset-0 z-[80] bg-[#121212] dark:bg-[#121212] overflow-auto flex items-center justify-center px-4">
      <div className="w-full max-w-sm relative">
        <button data-testid="reset-close" onClick={onDone} aria-label="Chiudi"
          className="absolute -top-2 right-0 w-9 h-9 rounded-full bg-[#e4eff8] dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] flex items-center justify-center text-[#7E8A93] z-10">
          <X className="w-5 h-5" />
        </button>
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-[#ff6b00]/10 border border-[#ff6b00]/30 flex items-center justify-center mx-auto mb-3">
            <KeyRound className="w-8 h-8 text-[#ff6b00]" />
          </div>
          <h1 className="font-display text-2xl font-bold text-[#2B303B] dark:text-[#e4eff8]">
            {tri("Nuova password", "Neues Passwort", "New password", "Nueva contraseña")}
          </h1>
          <p className="text-sm text-[#7E8A93] mt-1">{tri("Scegli una nuova password per il tuo account.", "Wähle ein neues Passwort für dein Konto.", "Choose a new password for your account.", "Elige una nueva contraseña para tu cuenta.")}</p>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <Field icon={<Lock className="w-4 h-4" />}>
            <input data-testid="reset-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder={tri("Nuova password", "Neues Passwort", "New password", "Nueva contraseña")}
              className="flex-1 bg-transparent outline-none text-sm text-[#2B303B] dark:text-[#e4eff8]" />
          </Field>
          <p className={`text-xs ${password ? (pwStrong ? "text-[#3E7C59]" : "text-[#ff6b00]") : "text-[#7E8A93]"}`}>
            {tri("Min 8 caratteri, con lettere e numeri.", "Min. 8 Zeichen, Buchstaben und Zahlen.", "Min 8 characters, letters and numbers.", "Mín. 8 caracteres, con letras y números.")}
          </p>
          <Field icon={<Lock className="w-4 h-4" />}>
            <input data-testid="reset-confirm" type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)}
              placeholder={tri("Conferma password", "Passwort bestätigen", "Confirm password", "Confirmar contraseña")}
              className="flex-1 bg-transparent outline-none text-sm text-[#2B303B] dark:text-[#e4eff8]" />
          </Field>
          <button data-testid="reset-submit" type="submit" disabled={busy}
            className="w-full flex items-center justify-center gap-2 bg-[#ff6b00] hover:bg-[#ff8a33] disabled:opacity-50 text-white font-semibold px-5 py-3 rounded-2xl shadow-md active:scale-98 transition-all">
            {tri("Cambia password", "Passwort ändern", "Change password", "Cambiar contraseña")}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ icon, children }) {
  return (
    <div className="flex items-center gap-2 bg-white dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] rounded-2xl px-4 py-3">
      <span className="text-[#ff6b00]">{icon}</span>
      {children}
    </div>
  );
}
