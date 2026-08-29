import { useEffect, useState, useCallback } from "react";
import { Lock, Crown, Clock, Sparkles, ClipboardList, CalendarDays, Flame, Thermometer, ScanLine, Camera, GraduationCap, BookOpen, Check, Store, Truck, CalendarClock, CreditCard, ShieldCheck } from "lucide-react";
import { subscriptionApi } from "@/lib/api";
import { useAuth } from "@/auth/AuthContext";
import { useLang } from "@/i18n/LanguageContext";
import { toast } from "sonner";
import { mkTri } from "@/i18n/triMaps";

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
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
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

  // Accesso completo GRATUITO per tutti: nessun blocco PRO, nessun prezzo.
  const hasAccess = true;
  if (hasAccess) {
    return (
      <>
        {status?.source === "trial" && left && (
          <div data-testid="trial-banner" className="mb-4 flex items-center justify-center gap-2 rounded-xl bg-[#ff6b00]/15 border border-[#ff6b00]/40 px-3 py-2 text-sm font-semibold text-[#ff6b00] dark:text-[#8FB0C2]">
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
      <div className="rounded-3xl bg-gradient-to-br from-[#ff6b00] to-[#ff6b00] text-white p-7 text-center shadow-xl">
        <div className="w-16 h-16 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="font-display text-2xl font-bold">{sectionName} · {tierForFeature === "home" ? "Academy" : "PRO"}</h2>
        <p className="text-white/85 text-sm mt-2">
          {feature === "beginners" || feature === "home"
            ? tri("«Impara da Casa» — la tua Academy: corsi, ricettario dinamico, database farine e Diagnosi Foto. Sblocca i contenuti completando le sfide della community.",
                  "«Von zu Hause lernen» — deine Academy: Kurse, dynamisches Rezeptbuch, Mehl-Datenbank und Foto-Diagnose. Schalte Inhalte über Community-Challenges frei.",
                  "«Learn from Home» — your Academy: courses, dynamic recipe book, flour database and photo diagnosis. Unlock content by completing community challenges.")
            : tri("Questa sezione si sblocca completando le sfide della community MikiLab. Nessun pagamento.",
                  "Dieser Bereich wird durch das Abschließen von Community-Challenges freigeschaltet. Keine Zahlung.",
                  "This section unlocks by completing MikiLab community challenges. No payment.")}
        </p>
      </div>

      {/* "Guarda cosa fa" — anteprima funzioni prima del prezzo */}
      <div data-testid="paywall-preview" className="mt-5">
        <h3 className="font-display text-lg font-bold text-[#2B303B] dark:text-[#e4eff8] mb-3">
          {tri("Guarda cosa fa 👇", "Sieh, was es kann 👇", "See what it does 👇")}
        </h3>
        <div className="space-y-2.5">
          {(FEATURES[feature]?.it || []).map(([Icon, itTitle, itDesc], i) => {
            const deRow = FEATURES[feature]?.de?.[i] || [];
            const enRow = FEATURES[feature]?.en?.[i] || [];
            const title = mkTri(lang)(itTitle, deRow[1], enRow[1]);
            const desc = mkTri(lang)(itDesc, deRow[2], enRow[2]);
            return (
            <div key={i} data-testid={`paywall-feature-${i}`}
              className="flex items-start gap-3 bg-white dark:bg-[#1e1e1e] border border-[#2b2b2b] dark:border-[#2e2e2e] rounded-2xl p-3.5 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-[#ff6b00]/15 border border-[#ff6b00]/30 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-[#ff6b00]" />
              </div>
              <div className="min-w-0">
                <p className="font-display text-base font-semibold text-[#2B303B] dark:text-[#e4eff8] leading-tight flex items-center gap-1.5">
                  {title} <Check className="w-3.5 h-3.5 text-[#ff6b00]" />
                </p>
                <p className="text-xs text-[#7E8A93] leading-snug mt-0.5">{desc}</p>
              </div>
            </div>
            );
          })}
        </div>
        <p className="text-center text-sm font-semibold text-[#ff6b00] mt-4">
          {tri("Sbloccalo completando le sfide 👇", "Schalte es mit Challenges frei 👇", "Unlock it by completing challenges 👇")}
        </p>
      </div>

      {!email ? (
        <div className="mt-5 space-y-3">
          <p data-testid="paywall-register-hint" className="text-center text-sm text-[#7E8A93]">
            {tri("Registrati con la tua email per partecipare alle sfide e sbloccare i contenuti.", "Registriere dich mit deiner E-Mail, um an Challenges teilzunehmen und Inhalte freizuschalten.", "Register with your email to join challenges and unlock content.")}
          </p>
          <button data-testid="paywall-register" onClick={() => setAuthOpen(true)}
            className="w-full bg-[#ff6b00] text-white font-semibold px-5 py-3.5 rounded-2xl active:scale-98 transition-all">
            {tri("Registrati per iniziare", "Registrieren und loslegen", "Register to start")}
          </button>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          <div className="rounded-2xl bg-[#ff6b00]/10 border border-[#ff6b00]/30 p-4 text-center">
            <p className="flex items-center justify-center gap-2 text-sm font-bold text-[#ff6b00] dark:text-[#e0b877]">
              <Sparkles className="w-4 h-4" /> {tri("Sbloccalo con le Sfide", "Mit Challenges freischalten", "Unlock with Challenges")}
            </p>
            <p className="text-xs text-[#7E8A93] mt-1 leading-snug">
              {tri("Niente pagamenti: guadagni l'accesso completando le sfide della community MikiLab (crea post, invita colleghi, condividi e altro).",
                   "Keine Zahlungen: Zugang durch das Abschließen von MikiLab-Community-Challenges (Beiträge erstellen, Kollegen einladen, teilen usw.).",
                   "No payments: earn access by completing MikiLab community challenges (create posts, invite colleagues, share and more).")}
            </p>
          </div>
          <button data-testid="paywall-challenge" onClick={() => { try { window.dispatchEvent(new CustomEvent("mikilab-go-challenges")); } catch { /* */ } }}
            className="w-full bg-[#ff6b00] hover:bg-[#ff6b00] text-white font-semibold px-5 py-3.5 rounded-2xl active:scale-98 transition-all flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5" /> {tri("Completa la Sfida per Accedere", "Challenge abschließen, um zuzugreifen", "Complete the challenge to unlock")}
          </button>
        </div>
      )}
    </div>
  );
}
