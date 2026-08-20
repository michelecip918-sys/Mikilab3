import { useEffect, useState, useCallback } from "react";
import { Crown, Gift, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function AdminPanel({ open, onOpenChange }) {
  const { lang } = useLang();
  const de = lang === "de";
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [days, setDays] = useState("0"); // "0" = illimitato
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setList(await adminApi.entitlements()); }
    catch { toast.error(de ? "Fehler beim Laden" : "Errore nel caricamento"); }
    setLoading(false);
  }, [de]);

  useEffect(() => { if (open) load(); }, [open, load]);

  const grant = async () => {
    const e = email.trim().toLowerCase();
    if (!e || !e.includes("@")) { toast.error(de ? "Ungültige E-Mail" : "Email non valida"); return; }
    setBusy(true);
    try {
      const d = Number(days) > 0 ? Number(days) : null;
      await adminApi.grant(e, d);
      toast.success(de ? "PRO geschenkt!" : "PRO regalato!");
      setEmail("");
      load();
    } catch (err) {
      toast.error(err?.response?.data?.detail || (de ? "Fehler" : "Errore"));
    } finally { setBusy(false); }
  };

  const revoke = async (e) => {
    try { await adminApi.revoke(e); toast.success(de ? "Entzogen" : "Revocato"); load(); }
    catch { toast.error(de ? "Fehler" : "Errore"); }
  };

  const fmt = (iso) => {
    if (!iso) return de ? "unbegrenzt" : "illimitato";
    try { return new Date(iso).toLocaleDateString(de ? "de-DE" : "it-IT"); } catch { return iso; }
  };

  const dayOpts = [
    { v: "0", it: "Illimitato", de: "Unbegrenzt" },
    { v: "7", it: "7 giorni", de: "7 Tage" },
    { v: "30", it: "30 giorni", de: "30 Tage" },
    { v: "90", it: "90 giorni", de: "90 Tage" },
    { v: "365", it: "1 anno", de: "1 Jahr" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="admin-panel" className="max-w-md max-h-[88vh] overflow-y-auto bg-[#FDFBF7] dark:bg-[#1A1412] border-[#E8DEC8] dark:border-[#3D302A]">
        <DialogTitle className="font-display text-xl font-bold text-[#2C221E] dark:text-[#F5EFE6] flex items-center gap-2">
          <Crown className="w-5 h-5 text-[#D99B26]" /> {de ? "Admin · VIP-Zugänge" : "Admin · Accessi VIP"}
        </DialogTitle>
        <DialogDescription className="text-sm text-[#8C7567]">
          {de ? "Verschenke kostenlosen PRO-Zugang (unbegrenzt oder befristet)." : "Regala accesso PRO gratuito (illimitato o a tempo)."}
        </DialogDescription>

        <div className="rounded-2xl bg-[#6B8E62]/10 border border-[#6B8E62]/30 p-4 space-y-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-[#4d6b45] dark:text-[#9ec48f]">
            <Gift className="w-4 h-4" /> {de ? "PRO verschenken" : "Regala PRO"}
          </p>
          <input
            data-testid="admin-grant-email" type="email" value={email}
            onChange={(e) => setEmail(e.target.value)} placeholder="email@esempio.it"
            className="w-full bg-white dark:bg-[#241D19] border border-[#E8DEC8] dark:border-[#3D302A] rounded-xl px-3 py-2.5 text-sm outline-none text-[#2C221E] dark:text-[#F5EFE6]"
          />
          <select
            data-testid="admin-grant-days" value={days} onChange={(e) => setDays(e.target.value)}
            className="w-full bg-white dark:bg-[#241D19] border border-[#E8DEC8] dark:border-[#3D302A] rounded-xl px-3 py-2.5 text-sm outline-none text-[#2C221E] dark:text-[#F5EFE6]"
          >
            {dayOpts.map((o) => <option key={o.v} value={o.v}>{de ? o.de : o.it}</option>)}
          </select>
          <button
            data-testid="admin-grant-btn" onClick={grant} disabled={busy}
            className="w-full bg-[#6B8E62] disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl active:scale-98 transition-all"
          >
            {de ? "PRO schenken" : "Regala PRO"}
          </button>
        </div>

        <div className="flex items-center justify-between mt-2 mb-1">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#B34A26]">{de ? "Zugänge" : "Accessi"}</p>
          <button data-testid="admin-refresh" onClick={load} className="text-[#8C7567] active:scale-90">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        <div className="space-y-2">
          {list.length === 0 ? (
            <p className="text-sm text-[#8C7567] text-center py-4">{de ? "Noch keine Zugänge." : "Nessun accesso ancora."}</p>
          ) : list.map((e) => (
            <div key={e.email} data-testid={`ent-row-${e.email}`}
              className="flex items-center justify-between gap-2 bg-white dark:bg-[#2A211D] border border-[#E8DEC8] dark:border-[#3D302A] rounded-xl px-3 py-2.5">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#2C221E] dark:text-[#F5EFE6] truncate">{e.email}</p>
                <p className="text-[11px] text-[#8C7567]">
                  <span className={`font-bold ${e.active ? "text-[#6B8E62]" : "text-[#B4442A]"}`}>
                    {e.active ? "PRO" : (de ? "inaktiv" : "inattivo")}
                  </span>
                  {" · "}{e.source || "—"}{" · "}{fmt(e.expires_at)}
                </p>
              </div>
              {e.active && (
                <button data-testid={`ent-revoke-${e.email}`} onClick={() => revoke(e.email)}
                  className="w-8 h-8 rounded-lg bg-[#F5EFE6] dark:bg-[#332823] flex items-center justify-center text-[#B4442A] shrink-0 active:scale-95">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
