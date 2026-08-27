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
import { getProfile } from "@/components/Onboarding";
import InstallBanner from "@/components/InstallBanner";
import AuthScreen from "@/components/AuthScreen";
import ResetPassword from "@/components/ResetPassword";
import PublicBatch from "@/sections/PublicBatch";
import { consumeBack } from "@/lib/backNav";
import { useAuth } from "@/auth/AuthContext";
import { useLang } from "@/i18n/LanguageContext";
import { AmbientProvider } from "@/audio/AmbientContext";
import { TimerProvider } from "@/audio/TimerContext";
import ambient from "@/lib/ambientMusic";
import { recipePurchaseApi, subscriptionApi, api } from "@/lib/api";
import { toast } from "sonner";

function App() {
  const { lang } = useLang();
  const tri = (i, d, e) => (lang === "de" ? d : (lang === "en" || lang === "es") ? e : i);
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
  const publicBatch = new URLSearchParams(window.location.search).get("lotto");

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
      if (consumeBack()) return; // chiude prima le viste profonde aperte
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
    <div className="App min-h-screen bg-[#f0f6fb] dark:bg-[#1B2127]">
      {/* Sfondo tematico: filigrana grano/farina elegante su ogni pagina (contrasto garantito dalle card) */}
      <div aria-hidden className="fixed inset-0 z-0 pointer-events-none bg-repeat opacity-[0.55] dark:opacity-[0.05]"
        style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/wheat-bg.webp)`, backgroundSize: "340px" }} />
      <div className="relative z-10">
      <Header />
      <InstallBanner />
      <main className="max-w-xl mx-auto px-4 pt-4 pb-64">
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
            {tab === "community" && <Community />}
            {tab === "enterprise" && <PaywallGate feature="enterprise" sectionName="Enterprise"><EnterpriseHub /></PaywallGate>}
            {tab === "shop" && <><Academy /><Shop hideCourses /></>}
          </motion.div>
        </AnimatePresence>

        <footer data-testid="page-footer" className="mt-10 pt-6 border-t border-[#d5e4f0] dark:border-[#38424B]">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#234b6e] to-[#3f7cac] text-white p-4 shadow-lg">
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
                <p className="text-[11px] text-white/85 leading-snug mt-1">{tri("Il Mondo Artigianale per Panettieri, Pasticcieri e Pizzaioli", "Die Handwerkswelt für Bäcker, Konditoren und Pizzabäcker", "The Artisan World for Bakers, Pastry Chefs and Pizzaioli")}</p>
              </div>
            </div>
          </div>
          <p className="text-center text-[10px] text-[#9AA6AE] mt-3">© {new Date().getFullYear()} MikiLab · mikilab.de</p>
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

      <Toaster position="top-center" richColors />
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
    </TimerProvider>
    </AmbientProvider>
  );
}

export default App;
