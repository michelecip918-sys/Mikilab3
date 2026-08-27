import { useEffect, useState, useCallback } from "react";
import { Lock, Crown, Clock, Sparkles, ClipboardList, CalendarDays, Flame, Thermometer, ScanLine, Camera, GraduationCap, BookOpen, Check, Store, Truck, CalendarClock, CreditCard } from "lucide-react";
import { subscriptionApi } from "@/lib/api";
import { useAuth } from "@/auth/AuthContext";
import { useLang } from "@/i18n/LanguageContext";
import { toast } from "sonner";

// Elenco funzioni mostrate PRIMA del prezzo ("Guarda cosa fa"), per far vedere il valore.
const FEATURES = {
  lab: {
    it: [
      [ClipboardList, "Impostazione Macchine", "Configura impastatrici, celle, frigo e dispositivi"],
      [CalendarDays, "Piano settimanale", "Organizza ricette e quantità per ogni giorno"],
      [Flame, "Adatta al forno", "Gradi e minuti giusti cambiando tipo di forno"],
      [Thermometer, "Costi & Spesa", "Calcolo costi in € e lista della spesa per fornitori"],
      [ScanLine, "Le Mie Ricette", "Aggiungi o scansiona: la foto diventa testo modificabile"],
      [Sparkles, "Piano di Produzione con IA", "Genera produzione, spesa, ordini e ricette in un colpo"],
    ],
    de: [
      [ClipboardList, "Maschinen einrichten", "Kneter, Gärzellen, Kühlschrank und Geräte konfigurieren"],
      [CalendarDays, "Wochenplan", "Rezepte und Mengen für jeden Tag organisieren"],
      [Flame, "Ofen anpassen", "Richtige Grad und Minuten bei anderem Ofen"],
      [Thermometer, "Kosten & Einkauf", "Kostenrechnung in € und Einkaufsliste für Lieferanten"],
      [ScanLine, "Meine Rezepte", "Hinzufügen oder scannen: Foto → bearbeitbarer Text"],
      [Sparkles, "Produktionsplan mit KI", "Produktion, Einkauf, Bestellungen und Rezepte auf einmal"],
    ],
    en: [
      [ClipboardList, "Machine Setup", "Configure mixers, cells, fridge and devices"],
      [CalendarDays, "Weekly plan", "Organise recipes and quantities for each day"],
      [Flame, "Oven adapt", "The right degrees and minutes when the oven changes"],
      [Thermometer, "Costs & Shopping", "Cost calculation in € and a supplier shopping list"],
      [ScanLine, "My Recipes", "Add or scan: the photo becomes editable text"],
      [Sparkles, "AI Production Plan", "Generate production, shopping, orders and recipes at once"],
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
      [GraduationCap, "Corsi passo-passo", "Home-baking spiegato bene: pane, pizza in teglia, focaccia"],
      [ClipboardList, "Ricettario dinamico", "Dosi calcolate automaticamente in base a teglia e farina"],
      [BookOpen, "Database farine", "Trova la farina giusta e le corrispondenze IT/DE"],
      [Camera, "10 Diagnosi Foto IA/mese", "Correggi errori di cottura e lievitazione da una foto"],
    ],
    de: [
      [GraduationCap, "Schritt-für-Schritt-Kurse", "Home-Baking gut erklärt: Brot, Blechpizza, Focaccia"],
      [ClipboardList, "Dynamisches Rezeptbuch", "Mengen automatisch nach Blech und Mehl berechnet"],
      [BookOpen, "Mehl-Datenbank", "Finde das richtige Mehl und die IT/DE-Entsprechungen"],
      [Camera, "10 Foto-Diagnosen/Monat", "Korrigiere Back- und Gärfehler per Foto"],
    ],
    en: [
      [GraduationCap, "Step-by-step courses", "Home baking explained well: bread, pan pizza, focaccia"],
      [ClipboardList, "Dynamic recipe book", "Doses auto-calculated from your tin and flour"],
      [BookOpen, "Flour database", "Find the right flour and IT/DE matches"],
      [Camera, "10 AI Photo Diagnoses/month", "Fix baking and proofing mistakes from a photo"],
    ],
  },
};

// Blocca la sezione se l'utente non è PRO (o prova attiva).
export default function PaywallGate({ children, sectionName, feature = "lab" }) {
  const { user, setAuthOpen } = useAuth();
  const { lang } = useLang();
  const tri = (i, d, e) => (lang === "de" ? d : (lang === "en" || lang === "es") ? e : i);
  const flang = lang === "de" ? "de" : lang === "en" ? "en" : "it";
  const email = user?.email;
  // Tier: "home" (€12,99) per Academy/Principianti · "lab" (€29,99) per il laboratorio.
  const tierForFeature = (feature === "beginners" || feature === "home") ? "home" : "lab";
  const usesAcademy = ["beginners", "home", "diagnosi"].includes(feature);
  const PRICES = tierForFeature === "home"
    ? { monthly: "€12,99", yearly: "€99", disc: "-36%" }
    : { monthly: "€29,99", yearly: "€249", disc: "-31%" };
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

  // Aggiorna lo stato quando una prova/acquisto viene attivato altrove (es. ritorno da Stripe)
  useEffect(() => {
    const h = () => load();
    window.addEventListener("mikilab-entitlements-updated", h);
    return () => window.removeEventListener("mikilab-entitlements-updated", h);
  }, [load]);

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
      const d = await subscriptionApi.checkout(plan, tierForFeature);
      if (d.url) window.location.href = d.url; else toast.error(tri("Errore checkout", "Checkout-Fehler", "Checkout error"));
    } catch { toast.error(tri("Errore checkout", "Checkout-Fehler", "Checkout error")); }
  };

  const startCardTrial = async () => {
    try {
      const d = await subscriptionApi.trialCheckout();
      if (d.url) window.location.href = d.url;
      else toast.error(tri("Errore avvio prova", "Fehler beim Start", "Trial start error"));
    } catch (e) {
      toast.error(e?.response?.data?.detail || tri("Prova non disponibile", "Test nicht verfügbar", "Trial not available"));
    }
  };

  if (loading) return <div className="py-20 text-center text-[#7E8A93]">…</div>;

  // PRO / prova attiva → contenuto sbloccato (+ banner countdown se prova)
  const hasAccess = usesAcademy ? (status?.academy || status?.pro) : status?.pro;
  if (hasAccess) {
    return (
      <>
        {status.source === "trial" && left && (
          <div data-testid="trial-banner" className="mb-4 flex items-center justify-center gap-2 rounded-xl bg-[#6E8CA0]/15 border border-[#6E8CA0]/40 px-3 py-2 text-sm font-semibold text-[#234b6e] dark:text-[#8FB0C2]">
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
      <div className="rounded-3xl bg-gradient-to-br from-[#3f7cac] to-[#234b6e] text-white p-7 text-center shadow-xl">
        <div className="w-16 h-16 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="font-display text-2xl font-bold">{sectionName} · {tierForFeature === "home" ? "Academy" : "PRO"}</h2>
        <p className="text-white/85 text-sm mt-2">
          {feature === "beginners" || feature === "home"
            ? tri("«Impara da Casa» — la tua Academy completa a €12,99/mese: corsi, ricettario dinamico, database farine e 10 Diagnosi Foto al mese.",
                  "«Von zu Hause lernen» — deine komplette Academy für €12,99/Monat: Kurse, dynamisches Rezeptbuch, Mehl-Datenbank und 10 Foto-Diagnosen/Monat.",
                  "«Learn from Home» — your complete Academy at €12.99/month: courses, dynamic recipe book, flour database and 10 photo diagnoses/month.")
            : tri("Questa sezione è riservata agli abbonati PRO. Sblocca tutti gli strumenti del laboratorio.",
                  "Dieser Bereich ist PRO-Abonnenten vorbehalten. Schalte alle Werkzeuge frei.",
                  "This section is reserved for PRO members. Unlock all the lab tools.")}
        </p>
      </div>

      {/* "Guarda cosa fa" — anteprima funzioni prima del prezzo */}
      <div data-testid="paywall-preview" className="mt-5">
        <h3 className="font-display text-lg font-bold text-[#2B303B] dark:text-[#e4eff8] mb-3">
          {tri("Guarda cosa fa 👇", "Sieh, was es kann 👇", "See what it does 👇")}
        </h3>
        <div className="space-y-2.5">
          {(FEATURES[feature]?.[flang] || FEATURES[feature]?.it || []).map(([Icon, title, desc], i) => (
            <div key={i} data-testid={`paywall-feature-${i}`}
              className="flex items-start gap-3 bg-white dark:bg-[#232A31] border border-[#d5e4f0] dark:border-[#38424B] rounded-2xl p-3.5 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-[#6E8CA0]/15 border border-[#6E8CA0]/30 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-[#3f7cac]" />
              </div>
              <div className="min-w-0">
                <p className="font-display text-base font-semibold text-[#2B303B] dark:text-[#e4eff8] leading-tight flex items-center gap-1.5">
                  {title} <Check className="w-3.5 h-3.5 text-[#5aa0cf]" />
                </p>
                <p className="text-xs text-[#7E8A93] leading-snug mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-center text-sm font-semibold text-[#3f7cac] mt-4">
          {tri("Provalo gratis o abbonati per sbloccare tutto 👇", "Kostenlos testen oder abonnieren, um alles freizuschalten 👇", "Try it free or subscribe to unlock everything 👇")}
        </p>
      </div>

      {!email ? (
        <div className="mt-5 space-y-3">
          <p data-testid="paywall-trial-hint" className="text-center text-sm text-[#7E8A93]">
            {tri("Accedi per iniziare la prova gratuita di 7 giorni.", "Melde dich an, um die 7-tägige Testphase zu starten.", "Log in to start your 7-day free trial.")}
          </p>
          <button data-testid="paywall-login" onClick={() => setAuthOpen(true)}
            className="w-full bg-[#3f7cac] text-white font-semibold px-5 py-3.5 rounded-2xl active:scale-98 transition-all">
            {tri("Accedi per continuare", "Anmelden, um fortzufahren", "Log in to continue")}
          </button>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <button data-testid="sub-monthly" onClick={() => subscribe("monthly")}
              className="rounded-2xl border-2 border-[#3f7cac] p-4 text-center active:scale-97 transition-all bg-white dark:bg-[#232A31]">
              <Crown className="w-6 h-6 text-[#3f7cac] mx-auto" />
              <p className="font-display text-lg font-bold text-[#2B303B] dark:text-[#e4eff8] mt-1">{PRICES.monthly}</p>
              <p className="text-xs text-[#7E8A93]">{tri("al mese", "pro Monat", "per month")}</p>
            </button>
            <button data-testid="sub-yearly" onClick={() => subscribe("yearly")}
              className="rounded-2xl border-2 border-[#6E8CA0] p-4 text-center active:scale-97 transition-all bg-[#6E8CA0]/10 relative">
              <span className="absolute -top-2 right-2 text-[9px] font-bold bg-[#5aa0cf] text-white px-1.5 py-0.5 rounded-full">{PRICES.disc}</span>
              <Crown className="w-6 h-6 text-[#6E8CA0] mx-auto" />
              <p className="font-display text-lg font-bold text-[#2B303B] dark:text-[#e4eff8] mt-1">{PRICES.yearly}</p>
              <p className="text-xs text-[#7E8A93]">{tri("all'anno", "pro Jahr", "per year")}</p>
            </button>
          </div>

          {!status?.trial_used && (
            <div className="rounded-2xl bg-[#5aa0cf]/10 border border-[#5aa0cf]/30 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-[#2e6690] dark:text-[#a9d2ec]">
                <Sparkles className="w-4 h-4" /> {tri("Prova gratis 7 giorni", "7 Tage kostenlos testen", "7-day free trial")}
              </p>
              <p className="text-xs text-[#7E8A93] mt-1 leading-snug">
                {tri("Richiede una carta ma NON addebitiamo nulla. Alla fine dei 7 giorni decidi tu se abbonarti: nessun rinnovo automatico.",
                     "Erfordert eine Karte, aber wir belasten nichts. Nach 7 Tagen entscheidest du, ob du abonnierst: keine automatische Verlängerung.",
                     "Requires a card but we charge nothing. After 7 days you decide whether to subscribe: no automatic renewal.")}
              </p>
              <button data-testid="trial-7d-card" onClick={startCardTrial}
                className="w-full mt-2.5 bg-[#5aa0cf] hover:bg-[#336a94] text-white font-semibold py-2.5 rounded-xl active:scale-97 transition-all flex items-center justify-center gap-2">
                <CreditCard className="w-4 h-4" /> {tri("Inizia la prova (carta richiesta)", "Test starten (Karte erforderlich)", "Start trial (card required)")}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
