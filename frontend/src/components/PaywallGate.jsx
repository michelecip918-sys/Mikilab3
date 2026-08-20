import { useEffect, useState, useCallback } from "react";
import { Lock, Crown, Clock, Sparkles, ClipboardList, CalendarDays, Flame, Thermometer, ScanLine, Camera, GraduationCap, BookOpen, Check } from "lucide-react";
import { subscriptionApi } from "@/lib/api";
import { useAuth } from "@/auth/AuthContext";
import { useLang } from "@/i18n/LanguageContext";
import { toast } from "sonner";

// Elenco funzioni mostrate PRIMA del prezzo ("Guarda cosa fa"), per far vedere il valore.
const FEATURES = {
  lab: {
    it: [
      [ClipboardList, "Capo Laboratorio", "Piano di lavoro intelligente: impastatrici, celle e orari"],
      [CalendarDays, "Piano settimanale", "Organizza ricette e quantità per ogni giorno"],
      [Flame, "Adatta al forno", "Gradi e minuti giusti cambiando tipo di forno"],
      [Thermometer, "Costi & Spesa", "Calcolo costi in € e lista della spesa per fornitori"],
      [ScanLine, "Scansiona ricetta", "Fotografi una ricetta e diventa testo modificabile"],
      [Sparkles, "Panettone dinamico", "Ricalcolo dosi e sospensioni sui 10+ gusti"],
    ],
    de: [
      [ClipboardList, "Backstuben-Chef", "Intelligenter Arbeitsplan: Kneter, Zellen und Zeiten"],
      [CalendarDays, "Wochenplan", "Rezepte und Mengen für jeden Tag organisieren"],
      [Flame, "Ofen anpassen", "Richtige Grad und Minuten bei anderem Ofen"],
      [Thermometer, "Kosten & Einkauf", "Kostenrechnung in € und Einkaufsliste für Lieferanten"],
      [ScanLine, "Rezept scannen", "Rezept fotografieren → bearbeitbarer Text"],
      [Sparkles, "Panettone dynamisch", "Mengen und Einlagen für 10+ Sorten neu berechnen"],
    ],
  },
  diagnosi: {
    it: [
      [Camera, "Difetti e rimedi", "Analisi completa di crosta, mollica, cottura e come correggere"],
      [Camera, "Stato dell'impasto", "Capisci se è pronto, indietro o troppo lievitato"],
      [ScanLine, "Tutti gli ingredienti", "Ricetta probabile con percentuali stimate da una foto"],
      [Flame, "Macchine & guasti", "Legge codici errore dal display e spiega i rimedi"],
    ],
    de: [
      [Camera, "Fehler & Lösungen", "Vollständige Analyse von Kruste, Krume, Backung + Korrektur"],
      [Camera, "Teigzustand", "Erkenne, ob reif, zu früh oder übergar"],
      [ScanLine, "Alle Zutaten", "Wahrscheinliches Rezept mit geschätzten Prozenten per Foto"],
      [Flame, "Maschinen & Störungen", "Liest Fehlercodes vom Display und erklärt Lösungen"],
    ],
  },
  beginners: {
    it: [
      [GraduationCap, "Basi passo-passo", "Pane casereccio, pizza in teglia e focaccia spiegati bene"],
      [BookOpen, "Glossario interattivo", "Termini tecnici e fasi dell'impasto spiegati semplici"],
      [ClipboardList, "Dosi senza attrezzi", "Calcolo delle dosi anche senza strumenti professionali"],
      [Sparkles, "Quiz del Fornaio", "Impara divertendoti e metti alla prova le tue conoscenze"],
    ],
    de: [
      [GraduationCap, "Grundlagen Schritt für Schritt", "Hausbrot, Blechpizza und Focaccia gut erklärt"],
      [BookOpen, "Interaktives Glossar", "Fachbegriffe und Teigphasen einfach erklärt"],
      [ClipboardList, "Mengen ohne Geräte", "Mengenberechnung auch ohne Profi-Ausstattung"],
      [Sparkles, "Bäcker-Quiz", "Lerne mit Spaß und teste dein Wissen"],
    ],
  },
};

// Blocca la sezione se l'utente non è PRO (o prova attiva).
export default function PaywallGate({ children, sectionName, feature = "lab" }) {
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
          {feature === "beginners"
            ? (it ? "La Sezione Principianti è inclusa nell'accesso PRO. Sblocca guide, basi e ricette semplici."
                  : "Die Sektion Anfänger ist im PRO-Zugang enthalten. Schalte Anleitungen, Grundlagen und einfache Rezepte frei.")
            : (it ? "Questa sezione è riservata agli abbonati PRO. Sblocca tutti gli strumenti del laboratorio."
                  : "Dieser Bereich ist PRO-Abonnenten vorbehalten. Schalte alle Werkzeuge frei.")}
        </p>
      </div>

      {/* "Guarda cosa fa" — anteprima funzioni prima del prezzo */}
      <div data-testid="paywall-preview" className="mt-5">
        <h3 className="font-display text-lg font-bold text-[#2C221E] dark:text-[#F5EFE6] mb-3">
          {it ? "Guarda cosa fa 👇" : "Sieh, was es kann 👇"}
        </h3>
        <div className="space-y-2.5">
          {(FEATURES[feature]?.[it ? "it" : "de"] || []).map(([Icon, title, desc], i) => (
            <div key={i} data-testid={`paywall-feature-${i}`}
              className="flex items-start gap-3 bg-white dark:bg-[#2A211D] border border-[#E8DEC8] dark:border-[#3D302A] rounded-2xl p-3.5 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-[#D99B26]/15 border border-[#D99B26]/30 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-[#B34A26]" />
              </div>
              <div className="min-w-0">
                <p className="font-display text-base font-semibold text-[#2C221E] dark:text-[#F5EFE6] leading-tight flex items-center gap-1.5">
                  {title} <Check className="w-3.5 h-3.5 text-[#6B8E62]" />
                </p>
                <p className="text-xs text-[#8C7567] leading-snug mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-center text-sm font-semibold text-[#B34A26] mt-4">
          {it ? "Provalo gratis o abbonati per sbloccare tutto 👇" : "Kostenlos testen oder abonnieren, um alles freizuschalten 👇"}
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
