import { useState } from "react";
import { ChevronLeft, KeyRound, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { authApi } from "@/lib/api";

export default function ChangePassword({ onBack }) {
  const { lang } = useLang();
  const tri = mkTri(lang);
  const [cur, setCur] = useState("");
  const [nw, setNw] = useState("");
  const [nw2, setNw2] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (nw.length < 14) { toast.error(tri("La nuova password deve avere almeno 14 caratteri.", "Das neue Passwort muss mindestens 14 Zeichen haben.", "The new password must be at least 14 characters.")); return; }
    if (nw !== nw2) { toast.error(tri("Le due nuove password non coincidono.", "Die neuen Passwörter stimmen nicht überein.", "The two new passwords do not match.")); return; }
    setBusy(true);
    try {
      await authApi.changePassword(cur, nw, lang);
      toast.success(tri("Password aggiornata.", "Passwort aktualisiert.", "Password updated."));
      setCur(""); setNw(""); setNw2("");
      onBack();
    } catch (err) {
      const d = err && err.response && err.response.data && err.response.data.detail;
      toast.error(typeof d === "string" ? d : tri("Impossibile cambiare la password.", "Passwort konnte nicht geändert werden.", "Could not change the password."));
    } finally {
      setBusy(false);
    }
  };

  const field = (label, val, setVal, testid) => (
    <label className="block">
      <span className="text-xs font-bold text-muted-foreground">{label}</span>
      <div className="relative mt-1">
        <input
          data-testid={testid}
          type={show ? "text" : "password"}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          autoComplete="off"
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 pr-10 text-sm text-foreground focus:border-primary outline-none"
        />
        <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" data-testid="toggle-show-pw" aria-label={tri("Mostra/Nascondi", "Anzeigen/Verbergen", "Show/Hide")}>
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </label>
  );

  return (
    <div className="max-w-md mx-auto" data-testid="change-password-page">
      <button data-testid="cp-back" onClick={onBack} className="inline-flex items-center gap-1 text-sm font-bold text-muted-foreground mb-4 active:scale-95 transition-transform">
        <ChevronLeft className="w-4 h-4" /> {tri("Indietro", "Zurück", "Back")}
      </button>
      <div className="flex items-center gap-2 mb-1">
        <KeyRound className="w-5 h-5 text-primary" />
        <h1 className="font-display text-2xl font-black text-foreground">{tri("Cambia password", "Passwort ändern", "Change password")}</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-5">{tri("Solo per l'amministratore. Minimo 14 caratteri.", "Nur für den Administrator. Mindestens 14 Zeichen.", "Admin only. At least 14 characters.")}</p>
      <form onSubmit={submit} className="space-y-3">
        {field(tri("Password attuale", "Aktuelles Passwort", "Current password"), cur, setCur, "cp-current")}
        {field(tri("Nuova password", "Neues Passwort", "New password"), nw, setNw, "cp-new")}
        {field(tri("Ripeti nuova password", "Neues Passwort wiederholen", "Repeat new password"), nw2, setNw2, "cp-new2")}
        <button data-testid="cp-submit" type="submit" disabled={busy || !cur || !nw || !nw2}
          className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-50 active:scale-95 transition-all">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
          {tri("Aggiorna password", "Passwort aktualisieren", "Update password")}
        </button>
      </form>
    </div>
  );
}
