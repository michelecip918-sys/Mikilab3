import { useState } from "react";
import { toast } from "sonner";
import { Lock, KeyRound, X } from "lucide-react";
import { authApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";

export default function ResetPassword({ token, onDone }) {
  const { lang, tri } = useLang();
  const de = lang === "de";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (password.length < 6) { toast.error(tri("Almeno 6 caratteri", "Mind. 6 Zeichen", "At least 6 characters")); return; }
    if (password !== confirm) { toast.error(tri("Le password non coincidono", "Passwörter stimmen nicht überein", "Passwords do not match")); return; }
    setBusy(true);
    try {
      await authApi.reset(token, password);
      toast.success(tri("Password aggiornata! Accedi ora.", "Passwort geändert! Melde dich an.", "Password updated! Sign in now."));
      onDone();
    } catch (err) {
      toast.error(err?.response?.data?.detail || tri("Errore", "Fehler", "Error"));
    } finally { setBusy(false); }
  };

  return (
    <div data-testid="reset-screen" className="fixed inset-0 z-[80] bg-[#f0f6fb] dark:bg-[#1B2127] overflow-auto flex items-center justify-center px-4">
      <div className="w-full max-w-sm relative">
        <button data-testid="reset-close" onClick={onDone} aria-label="Chiudi"
          className="absolute -top-2 right-0 w-9 h-9 rounded-full bg-[#e4eff8] dark:bg-[#2A323A] border border-[#d5e4f0] dark:border-[#38424B] flex items-center justify-center text-[#7E8A93] z-10">
          <X className="w-5 h-5" />
        </button>
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-[#3f7cac]/10 border border-[#3f7cac]/30 flex items-center justify-center mx-auto mb-3">
            <KeyRound className="w-8 h-8 text-[#3f7cac]" />
          </div>
          <h1 className="font-display text-2xl font-bold text-[#2B303B] dark:text-[#e4eff8]">
            {tri("Nuova password", "Neues Passwort", "New password")}
          </h1>
          <p className="text-sm text-[#7E8A93] mt-1">{tri("Scegli una nuova password per il tuo account.", "Wähle ein neues Passwort für dein Konto.", "Choose a new password for your account.")}</p>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <Field icon={<Lock className="w-4 h-4" />}>
            <input data-testid="reset-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder={tri("Nuova password", "Neues Passwort", "New password")}
              className="flex-1 bg-transparent outline-none text-sm text-[#2B303B] dark:text-[#e4eff8]" />
          </Field>
          <Field icon={<Lock className="w-4 h-4" />}>
            <input data-testid="reset-confirm" type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)}
              placeholder={tri("Conferma password", "Passwort bestätigen", "Confirm password")}
              className="flex-1 bg-transparent outline-none text-sm text-[#2B303B] dark:text-[#e4eff8]" />
          </Field>
          <button data-testid="reset-submit" type="submit" disabled={busy}
            className="w-full flex items-center justify-center gap-2 bg-[#3f7cac] hover:bg-[#336a94] disabled:opacity-50 text-white font-semibold px-5 py-3 rounded-2xl shadow-md active:scale-98 transition-all">
            {tri("Cambia password", "Passwort ändern", "Change password")}
          </button>
        </form>
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
