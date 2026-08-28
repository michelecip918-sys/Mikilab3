import { useState, useEffect, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import "@/App.css";
import { Toaster } from "@/components/ui/sonner";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Home from "@/sections/Home";
import Ricette from "@/sections/Ricette";
import Maestro from "@/sections/Maestro";
import LearnHub from "@/sections/LearnHub";
import Community from "@/sections/Community";
import PhotoDiagnosi from "@/sections/PhotoDiagnosi";
import Shop from "@/sections/Shop";
import Academy from "@/sections/Academy";
import EnterpriseHub from "@/sections/EnterpriseHub";
import PaywallGate from "@/components/PaywallGate";
import RadioFornaio from "@/components/RadioFornaio";
import IntroGuide from "@/components/IntroGuide";
import SiteMenu from "@/components/SiteMenu";
import { getProfile } from "@/components/Onboarding";
import InstallBanner from "@/components/InstallBanner";
import AuthScreen from "@/components/AuthScreen";
import ResetPassword from "@/components/ResetPassword";
import PublicBatch from "@/sections/PublicBatch";
import { consumeBack } from "@/lib/backNav";
import ErrorBoundary from "@/components/ErrorBoundary";
import Maintenance from "@/components/Maintenance";
import LegalPage from "@/sections/LegalPage";
import Sfide from "@/components/Sfide";
import { useAuth } from "@/auth/AuthContext";
import { useLang } from "@/i18n/LanguageContext";
import { AmbientProvider } from "@/audio/AmbientContext";
import { TimerProvider } from "@/audio/TimerContext";
import { SoundFXProvider } from "@/audio/SoundFXContext";
import ambient from "@/lib/ambientMusic";
import { recipePurchaseApi, subscriptionApi, api } from "@/lib/api";
import { toast } from "sonner";
import { mkTri } from "@/i18n/triMaps";

function App() {
  const { lang, t } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const [tab, setTab] = useState(() => (new URLSearchParams(window.location.search).get("academy") ? "shop" : "home"));
  useState(() => {
    // Ingresso diretto: niente più schermata di domande. Semino un profilo di default completo.
    if (!getProfile()) {
      try {
        localStorage.setItem("mikilab_onboarding", JSON.stringify({
          labName: "", type: "panificio",
          equip: ["impastatrice", "forno_rotativo", "forno_statico", "cella", "abbattitore"],
          focus: "pane", done: true, at: new Date().toISOString(),
        }));
      } catch { /* */ }
    }
    return true;
  });
  const [showIntro] = useState(() => false);
  const tabRef = useRef("home");
  const { user, authOpen, setAuthOpen } = useAuth();
  const [resetToken, setResetToken] = useState(() => new URLSearchParams(window.location.search).get("reset"));
  const [legalOpen, setLegalOpen] = useState(false);
  const [sfideOpen, setSfideOpen] = useState(false);
  const publicBatch = new URLSearchParams(window.location.search).get("lotto");

  // Apertura del Motore Sfide da qualunque punto (PaywallGate, Home, ecc.)
  useEffect(() => {
    const h = () => setSfideOpen(true);
    window.addEventListener("mikilab-go-challenges", h);
    return () => window.removeEventListener("mikilab-go-challenges", h);
  }, []);

  // Gestione tasto Indietro: sincronizza i tab con la history del browser.
  const navigate = useCallback((next) => {
    if (next === tabRef.current) return;
    tabRef.current = next;
    window.history.pushState({ tab: next }, "");
    setTab(next);
  }, []);

  useEffect(() => {
    window.history.replaceState({ tab: "home" }, "");
    const onPop = (e) => {
      try {
        if (consumeBack()) return; // chiude prima le viste profonde aperte
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("back-nav close error:", err);
      }
      const next = (e.state && e.state.tab) || "home";
      tabRef.current = next;
      setTab(next);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // chiudi il modale login appena l'utente è autenticato
  useEffect(() => { if (user) setAuthOpen(false); }, [user, setAuthOpen]);

  // Ritorno da Stripe: conferma acquisto ricetta / abbonamento e pulisce l'URL.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const clean = () => { const u = new URL(window.location.href); ["recipe", "sub", "session_id", "bundle", "trial"].forEach((k) => u.searchParams.delete(k)); window.history.replaceState({ tab: "home" }, "", u.toString()); };
    if (p.get("bundle") === "success" && p.get("session_id")) {
      api.get(`/recipes/bundle/checkout/status/${p.get("session_id")}?lang=${lang}`).then((r) => {
        if (r?.data?.paid) {
          toast.success(tri("Pacchetto sbloccato! Ti abbiamo inviato il PDF via email 📧🥖", "Paket freigeschaltet! Wir haben dir das PDF per E-Mail geschickt 📧🥖", "Pack unlocked! We've emailed you the PDF 📧🥖"));
          window.dispatchEvent(new CustomEvent("mikilab-entitlements-updated"));
          setTab("ricette");
        }
        clean();
      }).catch(clean);
    } else if (p.get("bundle") === "cancel") { clean(); }
    else if (p.get("recipe") === "success" && p.get("session_id")) {
      recipePurchaseApi.status(p.get("session_id")).then((r) => {
        if (r?.paid) {
          toast.success(tri("Ricetta sbloccata! Buon lavoro 👨‍🍳", "Rezept freigeschaltet! 👨‍🍳", "Recipe unlocked! 👨‍🍳"));
          // Sblocco IMMEDIATO: avvisa le liste ricette / Piano IA di ricaricare (niente reload manuale).
          window.dispatchEvent(new CustomEvent("mikilab-entitlements-updated"));
          setTab("ricette");
        }
        clean();
      }).catch(clean);
    } else if (p.get("recipe") === "cancel") { clean(); }
    else if (p.get("sub") === "success") {
      subscriptionApi.status().then(() => toast.success(tri("Abbonamento attivo! Grazie 🙏", "Abo aktiv! Danke 🙏", "Subscription active! Thank you 🙏"))).finally(clean);
    } else if (p.get("sub") === "cancel") { clean(); }
    else if (p.get("trial") === "success" && p.get("session_id")) {
      subscriptionApi.trialCheckoutStatus(p.get("session_id")).then((r) => {
        if (r?.activated) {
          toast.success(tri("Prova di 7 giorni attivata! Nessun addebito automatico 🎉", "7-Tage-Test aktiviert! Keine automatische Belastung 🎉", "7-day trial activated! No automatic charge 🎉"));
          window.dispatchEvent(new CustomEvent("mikilab-entitlements-updated"));
        }
        clean();
      }).catch(clean);
    } else if (p.get("trial") === "cancel") { clean(); }
    else if (p.get("ricetta")) {
      setTab("ricette");
      const u = new URL(window.location.href); u.searchParams.delete("ricetta");
      window.history.replaceState({ tab: "ricette" }, "", u.toString());
      toast.success(tri("Ecco le ricette di MikiLab 🥖", "Hier sind die MikiLab-Rezepte 🥖", "Here are the MikiLab recipes 🥖"));
    }
    else if (p.get("prodotto")) {
      // Deep-link da QR etichetta: apri il tab Ricette; RecipeList aprirà la scheda prodotto.
      setTab("ricette");
    }
  }, []); // eslint-disable-line

  // Notifica "nuovi contenuti": avvisa se sono state aggiunte nuove ricette dall'ultima visita.
  useEffect(() => {
    const API = process.env.REACT_APP_BACKEND_URL;
    if (!API) return;
    fetch(`${API}/api/recipes?collection_name=mikilab`).then((r) => r.json()).then((list) => {
      if (!Array.isArray(list)) return;
      const count = list.length;
      const prev = parseInt(localStorage.getItem("mikilab_recipe_count") || "0", 10);
      if (prev > 0 && count > prev) {
        const n = count - prev;
        toast.success(tri(`${n} nuove ricette disponibili nel ricettario!`, `${n} neue Rezepte im Rezeptbuch verfügbar!`, `${n} new recipes available in the recipe book!`), { icon: "🥖", duration: 6000 });
      }
      localStorage.setItem("mikilab_recipe_count", String(count));
    }).catch(() => {});
  }, []); // eslint-disable-line


  useEffect(() => { ambient.setSection(tab); }, [tab]);

  // Pagina pubblica del lotto (QR): nessun login, nessuna navigazione.
  if (publicBatch) return <PublicBatch id={publicBatch} />;

  return (
    <AmbientProvider>
    <TimerProvider>
    <SoundFXProvider>
    <div className="App min-h-screen bg-[#FDFBF7] dark:bg-[#1B2127]">
      {/* Sfondo tematico: filigrana grano/farina elegante su ogni pagina (contrasto garantito dalle card) */}
      <div aria-hidden className="fixed inset-0 z-0 pointer-events-none bg-repeat opacity-[0.55] dark:opacity-[0.05]"
        style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/wheat-bg.webp)`, backgroundSize: "340px" }} />
      <div className="relative z-10">
      <Header />
      <SiteMenu onNavigate={navigate} onOpenSfide={() => setSfideOpen(true)} tab={tab} />
      <InstallBanner />
      <main className="max-w-xl mx-auto px-4 pt-4 pb-64">
        <ErrorBoundary resetKey={tab} lang={lang}>
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            {tab === "home" && <Home onNavigate={navigate} />}
            {tab === "ricette" && <Ricette />}
            {tab === "maestro" && <PaywallGate feature="lab" sectionName={tri("Il Tuo Laboratorio", "Dein Labor", "Your Lab")}><Maestro /></PaywallGate>}
            {["impara", "news", "enciclopedia"].includes(tab) && <LearnHub key={tab} initial={tab} onNavigate={navigate} />}
            {tab === "diagnosi" && <PaywallGate feature="diagnosi" sectionName={tri("Diagnosi", "Diagnose", "Diagnosis")}><PhotoDiagnosi /></PaywallGate>}
            {tab === "community" && <Community onNavigate={navigate} />}
            {tab === "enterprise" && <PaywallGate feature="enterprise" sectionName="Enterprise"><EnterpriseHub /></PaywallGate>}
            {tab === "shop" && <><Academy /><Shop hideCourses /></>}
          </motion.div>
        </AnimatePresence>
        </ErrorBoundary>

        <footer data-testid="page-footer" className="mt-10 pt-6 border-t border-[#d5e4f0] dark:border-[#38424B]">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#6E371C] to-[#8C4A27] text-white p-4 shadow-lg">
            <div className="it-de-ribbon absolute top-0 left-0 right-0" />
            <div className="flex items-center gap-4 mt-1">
              <img src={`${process.env.PUBLIC_URL}/michele-real-lab.jpg`} alt="Michele — MikiLab" loading="lazy"
                className="w-20 h-20 rounded-2xl object-cover ring-2 ring-[#D4AF37]/70 shadow-md shrink-0"
                onError={(e) => { e.currentTarget.src = `${process.env.PUBLIC_URL}/michele-real2.jpg`; }} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg overflow-hidden bg-[#232A31] ring-1 ring-[#D4AF37]/60 shrink-0">
                    <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="ML" className="w-full h-full object-cover" />
                  </div>
                  <p className="font-display text-lg font-extrabold tracking-tight">MikiLab · Michele</p>
                </div>
                <p className="text-[11px] text-white/85 leading-snug mt-1">{t("brand_slogan")}</p>
              </div>
            </div>
          </div>
          <p className="text-center text-[10px] text-[#9AA6AE] mt-3">© {new Date().getFullYear()} MikiLab · mikilab.de</p>
          <div className="flex items-center justify-center gap-4 mt-2">
            <button data-testid="footer-impressum" onClick={() => setLegalOpen(true)} className="text-[11px] font-semibold text-[#8C4A27] hover:underline">Impressum</button>
            <button data-testid="footer-datenschutz" onClick={() => setLegalOpen(true)} className="text-[11px] font-semibold text-[#8C4A27] hover:underline">Datenschutz</button>
            <button data-testid="footer-contatti" onClick={() => setLegalOpen(true)} className="text-[11px] font-semibold text-[#8C4A27] hover:underline">{tri("Contatti", "Kontakt", "Contact")}</button>
          </div>
        </footer>
      </main>
      <BottomNav active={tab} onChange={navigate} />
      {/* FAB "Parla" (voce) rimosso: gli avatar comunicano solo per iscritto */}
      <RadioFornaio />
      {/* WhatsApp FAB globale rimosso: WhatsApp ora SOLO in Corsi e Il Tuo Laboratorio */}
      {!resetToken && showIntro && <IntroGuide />}
      {/* Onboarding a domande rimosso: ingresso diretto (profilo di default seminato) */}

      <AnimatePresence>
        {authOpen && !user && (
          <motion.div
            data-testid="auth-modal"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-[#f0f6fb] dark:bg-[#1B2127] overflow-auto"
          >
            <AuthScreen onClose={() => setAuthOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {legalOpen && (
        <div data-testid="legal-overlay" className="fixed inset-0 z-[80] bg-[#f0f6fb] dark:bg-[#1B2127] overflow-auto">
          <div className="max-w-xl mx-auto px-4 py-5">
            <button data-testid="legal-close" onClick={() => setLegalOpen(false)} className="mb-4 text-sm font-semibold text-[#3f7cac]">← {tri("Chiudi", "Schließen", "Close")}</button>
            <LegalPage />
          </div>
        </div>
      )}

      <Toaster position="top-center" richColors />
      <Sfide open={sfideOpen} onClose={() => setSfideOpen(false)} />
      {resetToken && (
        <ResetPassword
          token={resetToken}
          onDone={() => {
            setResetToken(null);
            const u = new URL(window.location.href);
            u.searchParams.delete("reset");
            window.history.replaceState(null, "", u.pathname + u.search);
            setAuthOpen(true);
          }}
        />
      )}
      </div>
    </div>
    </SoundFXProvider>
    </TimerProvider>
    </AmbientProvider>
  );
}

export default function AppGate() {
  // --- Modalità manutenzione / Coming Soon ---
  // Attiva con REACT_APP_MAINTENANCE=true. Accesso riservato al proprietario con ?preview=mikilab2026 (salvato in localStorage).
  if (process.env.REACT_APP_MAINTENANCE === "true") {
    try {
      const qp = new URLSearchParams(window.location.search);
      if (qp.get("preview") === "mikilab2026") localStorage.setItem("mk_preview", "1");
    } catch { /* */ }
    let bypass = false;
    try { bypass = localStorage.getItem("mk_preview") === "1"; } catch { /* */ }
    if (!bypass) return <Maintenance />;
  }
  return <App />;
}
