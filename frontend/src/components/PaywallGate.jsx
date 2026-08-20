import { useEffect, useState, useCallback } from "react";
import { Lock, Crown, Clock, Sparkles } from "lucide-react";
import { subscriptionApi } from "@/lib/api";
import { useAuth } from "@/auth/AuthContext";
import { useLang } from "@/i18n/LanguageContext";
import { toast } from "sonner";

// Blocca la sezione se l'utente non è PRO (o prova attiva).
export default function PaywallGate({ children, sectionName }) {
  const { user, setAuthOpen } = useAuth();
  const { lang } = useLang();
  const it = lang !== "de";
  const email = user?.email;
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [left, setLeft] = useState("");

  const load = useCallback(async () => {
    if (!email) { setStatus(null); setLoading(false); return; }
    setLoading(true);
    try {
      setStatus(await subscriptionApi.status());
    } catch { setStatus(null); }
    setLoading(false);
  }, [email]);

  useEffect(() => { load(); }, [load]);

  // Countdown prova/abbonamento
  useEffect(() => {
    if (!status?.expires_at) { setLeft(""); return; }
    const tick = () => {
      const ms = new Date(status.expires_at) - new Date();
      if (ms <= 0) { setLeft(""); load(); return; }
      const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000), s = Math.floor((ms % 60000) / 1000);
      setLeft(`${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`);
    };
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, [status, load]);

  const subscribe = async (plan) => {
    try {
      const d = await subscriptionApi.checkout(plan);
      if (d.url) window.location.href = d.url; else toast.error("Errore checkout");
    } catch { toast.error("Errore checkout"); }
  };

  const startTrial = async (hours) => {
    try {
      await subscriptionApi.trial(hours);
      toast.success(it ? "Prova attivata!" : "Test aktiviert!");
      load();
    } catch (e) {
      toast.error(e?.response?.data?.detail || (it ? "Prova non disponibile" : "Test nicht verfügbar"));
    }
  };

  if (loading) return <div className="py-20 text-center text-[#8C7567]">…</div>;

  // PRO / prova attiva → contenuto sbloccato (+ banner countdown se prova)
  if (status?.pro) {
    return (
      <>
        {status.source === "trial" && left && (
          <div data-testid="trial-banner" className="mb-4 flex items-center justify-center gap-2 rounded-xl bg-[#D99B26]/15 border border-[#D99B26]/40 px-3 py-2 text-sm font-semibold text-[#8C3A1D] dark:text-[#E5AC3A]">
            <Clock className="w-4 h-4" /> {it ? "Prova PRO — resta:" : "PRO-Test — verbleibend:"} <span className="font-mono-data">{left}</span>
          </div>
        )}
        {children}
      </>
    );
  }

  // Paywall
  return (
    <div data-testid="paywall" className="py-6">
      <div className="rounded-3xl bg-gradient-to-br from-[#B34A26] to-[#8C3A1D] text-white p-7 text-center shadow-xl">
        <div className="w-16 h-16 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="font-display text-2xl font-bold">{sectionName} · PRO</h2>
        <p className="text-white/85 text-sm mt-2">
          {it ? "Questa sezione è riservata agli abbonati PRO. Sblocca tutti gli strumenti del laboratorio."
              : "Dieser Bereich ist PRO-Abonnenten vorbehalten. Schalte alle Werkzeuge frei."}
        </p>
      </div>

      {!email ? (
        <button data-testid="paywall-login" onClick={() => setAuthOpen(true)}
          className="mt-5 w-full bg-[#B34A26] text-white font-semibold px-5 py-3.5 rounded-2xl active:scale-98 transition-all">
          {it ? "Accedi per continuare" : "Anmelden, um fortzufahren"}
        </button>
      ) : (
        <div className="mt-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <button data-testid="sub-monthly" onClick={() => subscribe("monthly")}
              className="rounded-2xl border-2 border-[#B34A26] p-4 text-center active:scale-97 transition-all bg-white dark:bg-[#2A211D]">
              <Crown className="w-6 h-6 text-[#B34A26] mx-auto" />
              <p className="font-display text-lg font-bold text-[#2C221E] dark:text-[#F5EFE6] mt-1">€9,99</p>
              <p className="text-xs text-[#8C7567]">{it ? "al mese" : "pro Monat"}</p>
            </button>
            <button data-testid="sub-yearly" onClick={() => subscribe("yearly")}
              className="rounded-2xl border-2 border-[#D99B26] p-4 text-center active:scale-97 transition-all bg-[#D99B26]/10 relative">
              <span className="absolute -top-2 right-2 text-[9px] font-bold bg-[#6B8E62] text-white px-1.5 py-0.5 rounded-full">-17%</span>
              <Crown className="w-6 h-6 text-[#D99B26] mx-auto" />
              <p className="font-display text-lg font-bold text-[#2C221E] dark:text-[#F5EFE6] mt-1">€99</p>
              <p className="text-xs text-[#8C7567]">{it ? "all'anno" : "pro Jahr"}</p>
            </button>
          </div>

          {!status?.trial_used && (
            <div className="rounded-2xl bg-[#6B8E62]/10 border border-[#6B8E62]/30 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-[#4d6b45] dark:text-[#9ec48f]">
                <Sparkles className="w-4 h-4" /> {it ? "Prova gratis (una volta)" : "Kostenlos testen (einmalig)"}
              </p>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button data-testid="trial-1h" onClick={() => startTrial(1)}
                  className="bg-[#6B8E62] text-white font-semibold py-2.5 rounded-xl active:scale-97">{it ? "1 ora" : "1 Stunde"}</button>
                <button data-testid="trial-24h" onClick={() => startTrial(24)}
                  className="bg-[#6B8E62] text-white font-semibold py-2.5 rounded-xl active:scale-97">{it ? "24 ore" : "24 Stunden"}</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
