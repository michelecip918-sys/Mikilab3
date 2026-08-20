import { useState } from "react";
import { toast } from "sonner";
import { Lock, KeyRound, X } from "lucide-react";
import { authApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";

export default function ResetPassword({ token, onDone }) {
  const { lang } = useLang();
  const de = lang === "de";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (password.length < 6) { toast.error(de ? "Mind. 6 Zeichen" : "Almeno 6 caratteri"); return; }
    if (password !== confirm) { toast.error(de ? "Passwörter stimmen nicht überein" : "Le password non coincidono"); return; }
    setBusy(true);
    try {
      await authApi.reset(token, password);
      toast.success(de ? "Passwort geändert! Melde dich an." : "Password aggiornata! Accedi ora.");
      onDone();
    } catch (err) {
      toast.error(err?.response?.data?.detail || (de ? "Fehler" : "Errore"));
    } finally { setBusy(false); }
  };

  return (
    <div data-testid="reset-screen" className="fixed inset-0 z-[80] bg-[#FDFBF7] dark:bg-[#1A1412] overflow-auto flex items-center justify-center px-4">
      <div className="w-full max-w-sm relative">
        <button data-testid="reset-close" onClick={onDone} aria-label="Chiudi"
          className="absolute -top-2 right-0 w-9 h-9 rounded-full bg-[#F5EFE6] dark:bg-[#332823] border border-[#E8DEC8] dark:border-[#3D302A] flex items-center justify-center text-[#8C7567] z-10">
          <X className="w-5 h-5" />
        </button>
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-[#B34A26]/10 border border-[#B34A26]/30 flex items-center justify-center mx-auto mb-3">
            <KeyRound className="w-8 h-8 text-[#B34A26]" />
          </div>
          <h1 className="font-display text-2xl font-bold text-[#2C221E] dark:text-[#F5EFE6]">
            {de ? "Neues Passwort" : "Nuova password"}
          </h1>
          <p className="text-sm text-[#8C7567] mt-1">{de ? "Wähle ein neues Passwort für dein Konto." : "Scegli una nuova password per il tuo account."}</p>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <Field icon={<Lock className="w-4 h-4" />}>
            <input data-testid="reset-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder={de ? "Neues Passwort" : "Nuova password"}
              className="flex-1 bg-transparent outline-none text-sm text-[#2C221E] dark:text-[#F5EFE6]" />
          </Field>
          <Field icon={<Lock className="w-4 h-4" />}>
            <input data-testid="reset-confirm" type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)}
              placeholder={de ? "Passwort bestätigen" : "Conferma password"}
              className="flex-1 bg-transparent outline-none text-sm text-[#2C221E] dark:text-[#F5EFE6]" />
          </Field>
          <button data-testid="reset-submit" type="submit" disabled={busy}
            className="w-full flex items-center justify-center gap-2 bg-[#B34A26] hover:bg-[#963B1C] disabled:opacity-50 text-white font-semibold px-5 py-3 rounded-2xl shadow-md active:scale-98 transition-all">
            {de ? "Passwort ändern" : "Cambia password"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ icon, children }) {
  return (
    <div className="flex items-center gap-2 bg-white dark:bg-[#2A211D] border border-[#E8DEC8] dark:border-[#3D302A] rounded-2xl px-4 py-3">
      <span className="text-[#B34A26]">{icon}</span>
      {children}
    </div>
  );
}
