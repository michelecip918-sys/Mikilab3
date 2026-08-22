import { useEffect, useState, useCallback } from "react";
import { Lock, Crown, Clock, Sparkles, ClipboardList, CalendarDays, Flame, Thermometer, ScanLine, Camera, GraduationCap, BookOpen, Check, Store, Truck, CalendarClock } from "lucide-react";
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
    en: [
      [ClipboardList, "Lab Manager", "Smart work plan: mixers, cells and schedules"],
      [CalendarDays, "Weekly plan", "Organise recipes and quantities for each day"],
      [Flame, "Oven adapt", "The right degrees and minutes when the oven changes"],
      [Thermometer, "Costs & Shopping", "Cost calculation in € and a supplier shopping list"],
      [ScanLine, "Scan a recipe", "Photograph a recipe and turn it into editable text"],
      [Sparkles, "Dynamic panettone", "Recalculated doses and swaps across 10+ flavours"],
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
    en: [
      [Camera, "Defects & fixes", "Full analysis of crust, crumb, bake and how to correct"],
      [Camera, "Dough status", "Understand if it's ready, underproofed or overproofed"],
      [ScanLine, "All the ingredients", "Likely recipe with estimated percentages from a photo"],
      [Flame, "Machines & faults", "Reads error codes from the display and explains fixes"],
    ],
  },
  enterprise: {
    it: [
      [Store, "Multi-Negozio", "Gestisci più punti vendita, ognuno con i suoi ordini e dati"],
      [Truck, "Ordini Fornitori", "Crea ordini di acquisto e inviali via Email, WhatsApp o stampa"],
      [CalendarClock, "Turni del Personale", "Pianifica i turni sul calendario settimanale con totale ore per persona"],
      [Sparkles, "Tutto salvato", "I dati restano al sicuro sul tuo account, su ogni dispositivo"],
    ],
    de: [
      [Store, "Multi-Filiale", "Verwalte mehrere Standorte, jeder mit eigenen Bestellungen"],
      [Truck, "Lieferantenbestellungen", "Bestellungen erstellen und per E-Mail, WhatsApp oder Druck senden"],
      [CalendarClock, "Personalplanung", "Schichten im Wochenkalender planen, Stunden pro Person"],
      [Sparkles, "Alles gespeichert", "Daten sicher in deinem Konto, auf jedem Gerät"],
    ],
    en: [
      [Store, "Multi-store", "Manage several locations, each with its own orders and data"],
      [Truck, "Supplier orders", "Create purchase orders and send them via Email, WhatsApp or print"],
      [CalendarClock, "Staff shifts", "Plan shifts on a weekly calendar with total hours per person"],
      [Sparkles, "All saved", "Your data stays safe in your account, on every device"],
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
    en: [
      [GraduationCap, "Step-by-step basics", "Home bread, pan pizza and focaccia explained well"],
      [BookOpen, "Interactive glossary", "Technical terms and dough phases explained simply"],
      [ClipboardList, "Doses without tools", "Work out quantities even without professional gear"],
      [Sparkles, "Baker's Quiz", "Learn while having fun and test your knowledge"],
    ],
  },
};

// Blocca la sezione se l'utente non è PRO (o prova attiva).
export default function PaywallGate({ children, sectionName, feature = "lab" }) {
  const { user, setAuthOpen } = useAuth();
  const { lang } = useLang();
  const tri = (i, d, e) => (lang === "de" ? d : lang === "en" ? e : i);
  const flang = lang === "de" ? "de" : lang === "en" ? "en" : "it";
  const email = user?.email;
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [left, setLeft] = useState("");
  // Prova gratuita 7 giorni per visitatori NON registrati (a livello di dispositivo)
  const [localTrial, setLocalTrial] = useState(() => localStorage.getItem("mikilab_local_trial"));
  const TRIAL_MS = 7 * 24 * 3600 * 1000;
  const localMsLeft = localTrial ? (new Date(localTrial).getTime() + TRIAL_MS - Date.now()) : 0;
  const localTrialActive = !user && localMsLeft > 0;
  const localDaysLeft = Math.ceil(localMsLeft / 86400000);
  const startLocalTrial = () => { const iso = new Date().toISOString(); localStorage.setItem("mikilab_local_trial", iso); setLocalTrial(iso); };

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
      if (d.url) window.location.href = d.url; else toast.error(tri("Errore checkout", "Checkout-Fehler", "Checkout error"));
    } catch { toast.error(tri("Errore checkout", "Checkout-Fehler", "Checkout error")); }
  };

  const startTrial = async (hours) => {
    try {
      await subscriptionApi.trial(hours);
      toast.success(tri("Prova attivata!", "Test aktiviert!", "Trial activated!"));
      load();
    } catch (e) {
      toast.error(e?.response?.data?.detail || tri("Prova non disponibile", "Test nicht verfügbar", "Trial not available"));
    }
  };

  if (loading) return <div className="py-20 text-center text-[#7E8A93]">…</div>;

  // Prova gratuita 7 giorni (dispositivo, senza registrazione) → contenuto sbloccato
  if (localTrialActive) {
    return (
      <>
        <div data-testid="local-trial-banner" className="mb-4 flex items-center justify-center gap-2 rounded-xl bg-[#6B8E62]/15 border border-[#6B8E62]/40 px-3 py-2 text-sm font-semibold text-[#4d6b45] dark:text-[#9ec48f]">
          <Sparkles className="w-4 h-4" /> {tri("Prova gratuita — restano", "Kostenlose Testphase — verbleibend", "Free trial — left")} <span className="font-mono-data">{localDaysLeft} {tri(localDaysLeft === 1 ? "giorno" : "giorni", localDaysLeft === 1 ? "Tag" : "Tage", localDaysLeft === 1 ? "day" : "days")}</span>
        </div>
        {children}
      </>
    );
  }

  // PRO / prova attiva → contenuto sbloccato (+ banner countdown se prova)
  if (status?.pro) {
    return (
      <>
        {status.source === "trial" && left && (
          <div data-testid="trial-banner" className="mb-4 flex items-center justify-center gap-2 rounded-xl bg-[#6E8CA0]/15 border border-[#6E8CA0]/40 px-3 py-2 text-sm font-semibold text-[#33564E] dark:text-[#8FB0C2]">
            <Clock className="w-4 h-4" /> {tri("Prova PRO — resta:", "PRO-Test — verbleibend:", "PRO trial — left:")} <span className="font-mono-data">{left}</span>
          </div>
        )}
        {children}
      </>
    );
  }

  // Paywall
  return (
    <div data-testid="paywall" className="py-6">
      <div className="rounded-3xl bg-gradient-to-br from-[#5E8B7E] to-[#33564E] text-white p-7 text-center shadow-xl">
        <div className="w-16 h-16 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="font-display text-2xl font-bold">{sectionName} · PRO</h2>
        <p className="text-white/85 text-sm mt-2">
          {feature === "beginners"
            ? tri("La Sezione Principianti è inclusa nell'accesso PRO. Sblocca guide, basi e ricette semplici.",
                  "Die Sektion Anfänger ist im PRO-Zugang enthalten. Schalte Anleitungen, Grundlagen und einfache Rezepte frei.",
                  "The Beginners section is included with PRO. Unlock guides, basics and simple recipes.")
            : tri("Questa sezione è riservata agli abbonati PRO. Sblocca tutti gli strumenti del laboratorio.",
                  "Dieser Bereich ist PRO-Abonnenten vorbehalten. Schalte alle Werkzeuge frei.",
                  "This section is reserved for PRO members. Unlock all the lab tools.")}
        </p>
      </div>

      {/* "Guarda cosa fa" — anteprima funzioni prima del prezzo */}
      <div data-testid="paywall-preview" className="mt-5">
        <h3 className="font-display text-lg font-bold text-[#2B303B] dark:text-[#EAF0EC] mb-3">
          {tri("Guarda cosa fa 👇", "Sieh, was es kann 👇", "See what it does 👇")}
        </h3>
        <div className="space-y-2.5">
          {(FEATURES[feature]?.[flang] || FEATURES[feature]?.it || []).map(([Icon, title, desc], i) => (
            <div key={i} data-testid={`paywall-feature-${i}`}
              className="flex items-start gap-3 bg-white dark:bg-[#232A31] border border-[#D7E1DB] dark:border-[#38424B] rounded-2xl p-3.5 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-[#6E8CA0]/15 border border-[#6E8CA0]/30 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-[#5E8B7E]" />
              </div>
              <div className="min-w-0">
                <p className="font-display text-base font-semibold text-[#2B303B] dark:text-[#EAF0EC] leading-tight flex items-center gap-1.5">
                  {title} <Check className="w-3.5 h-3.5 text-[#6B8E62]" />
                </p>
                <p className="text-xs text-[#7E8A93] leading-snug mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-center text-sm font-semibold text-[#5E8B7E] mt-4">
          {tri("Provalo gratis o abbonati per sbloccare tutto 👇", "Kostenlos testen oder abonnieren, um alles freizuschalten 👇", "Try it free or subscribe to unlock everything 👇")}
        </p>
      </div>

      {!email ? (
        <div className="mt-5 space-y-3">
          {!localTrial ? (
            <button data-testid="local-trial-start" onClick={startLocalTrial}
              className="w-full bg-[#6B8E62] hover:bg-[#5a7a53] text-white font-bold px-5 py-3.5 rounded-2xl active:scale-98 transition-all flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5" /> {tri("Prova gratis 7 giorni (senza registrazione)", "7 Tage kostenlos testen (ohne Anmeldung)", "Try free for 7 days (no sign-up)")}
            </button>
          ) : (
            <p data-testid="local-trial-ended" className="text-center text-sm text-[#7E8A93]">
              {tri("La tua prova gratuita di 7 giorni è terminata. Accedi o abbonati per continuare.", "Deine 7-tägige Testphase ist beendet. Melde dich an oder abonniere.", "Your 7-day free trial has ended. Log in or subscribe to continue.")}
            </p>
          )}
          <button data-testid="paywall-login" onClick={() => setAuthOpen(true)}
            className="w-full bg-[#5E8B7E] text-white font-semibold px-5 py-3.5 rounded-2xl active:scale-98 transition-all">
            {tri("Accedi per continuare", "Anmelden, um fortzufahren", "Log in to continue")}
          </button>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <button data-testid="sub-monthly" onClick={() => subscribe("monthly")}
              className="rounded-2xl border-2 border-[#5E8B7E] p-4 text-center active:scale-97 transition-all bg-white dark:bg-[#232A31]">
              <Crown className="w-6 h-6 text-[#5E8B7E] mx-auto" />
              <p className="font-display text-lg font-bold text-[#2B303B] dark:text-[#EAF0EC] mt-1">€9,99</p>
              <p className="text-xs text-[#7E8A93]">{tri("al mese", "pro Monat", "per month")}</p>
            </button>
            <button data-testid="sub-yearly" onClick={() => subscribe("yearly")}
              className="rounded-2xl border-2 border-[#6E8CA0] p-4 text-center active:scale-97 transition-all bg-[#6E8CA0]/10 relative">
              <span className="absolute -top-2 right-2 text-[9px] font-bold bg-[#6B8E62] text-white px-1.5 py-0.5 rounded-full">-17%</span>
              <Crown className="w-6 h-6 text-[#6E8CA0] mx-auto" />
              <p className="font-display text-lg font-bold text-[#2B303B] dark:text-[#EAF0EC] mt-1">€99</p>
              <p className="text-xs text-[#7E8A93]">{tri("all'anno", "pro Jahr", "per year")}</p>
            </button>
          </div>

          {!status?.trial_used && (
            <div className="rounded-2xl bg-[#6B8E62]/10 border border-[#6B8E62]/30 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-[#4d6b45] dark:text-[#9ec48f]">
                <Sparkles className="w-4 h-4" /> {tri("Prova gratis (una volta)", "Kostenlos testen (einmalig)", "Free trial (once)")}
              </p>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button data-testid="trial-1h" onClick={() => startTrial(1)}
                  className="bg-[#6B8E62] text-white font-semibold py-2.5 rounded-xl active:scale-97">{tri("1 ora", "1 Stunde", "1 hour")}</button>
                <button data-testid="trial-24h" onClick={() => startTrial(24)}
                  className="bg-[#6B8E62] text-white font-semibold py-2.5 rounded-xl active:scale-97">{tri("24 ore", "24 Stunden", "24 hours")}</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
