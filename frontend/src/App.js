/*
 * ============================================================================
 *  MIKILAB — IL MANUALE DI SITOR
 *  Ricettario pubblico e gratuito, guidato da Sitor, per chi cucina a casa.
 * ============================================================================
 */
import { useState, useEffect, useRef } from "react";
import "@/App.css";
import { Toaster, toast } from "sonner";
import { ProfileProvider } from "@/profile/ProfileContext";
import { useAuth } from "@/auth/AuthContext";
import { useLang } from "@/i18n/LanguageContext";
import { AmbientProvider } from "@/audio/AmbientContext";
import { TimerProvider } from "@/audio/TimerContext";
import { SoundFXProvider } from "@/audio/SoundFXContext";
import { MixerTimersProvider } from "@/audio/MixerTimersContext";
import { MachinesProvider } from "@/audio/MachinesContext";

import RadioFornaio from "@/components/RadioFornaio";
import ErrorBoundary from "@/components/ErrorBoundary";
import AuthScreen from "@/components/AuthScreen";
import ResetPassword from "@/components/ResetPassword";
import InstallApp from "@/components/InstallApp";
import SplashScreen from "@/components/SplashScreen";
import LangSelector from "@/components/LangSelector";
import Ricette from "@/sections/Ricette";
import HomeManuale from "@/components/HomeManuale";
import LegalPlaceholder from "@/components/LegalPlaceholder";
import SitorChat from "@/components/SitorChat";
import TecnichePage from "@/components/TecnichePage";
import VerdeMikiLab from "@/components/VerdeMikiLab";
import PercorsoPage from "@/components/PercorsoPage";
import RegalaPage from "@/components/RegalaPage";
import PaginaSito from "@/components/PaginaSito";
import MiglioratorePage from "@/components/MiglioratorePage";
import AdminCosts from "@/components/AdminCosts";
import CosaFaccio from "@/components/CosaFaccio";
import Live from "@/components/Live";
import Mensola from "@/components/Mensola";
import Cucina from "@/components/Cucina";
import Plan from "@/components/Plan";
import SitorBadge from "@/components/SitorBadge";
import TestMese from "@/components/TestMese";
import Farine from "@/components/Farine";
import Calendario from "@/components/Calendario";
import Admin2B from "@/components/Admin2B";
import PuliziaDati from "@/components/PuliziaDati";
import ChangePassword from "@/components/ChangePassword";import DalMondo from "@/components/DalMondo";
import DiarioProve from "@/components/DiarioProve";
import PaneDiIeri from "@/components/PaneDiIeri";
import CreaLievito from "@/components/CreaLievito";
import CenaSughi from "@/components/CenaSughi";
import ImpressumAdmin from "@/components/ImpressumAdmin";
import { useFeatures } from "@/lib/features";
import { usePublicContent } from "@/lib/publicContent";
import { mkTri } from "@/i18n/triMaps";
import { ShieldCheck, LogOut, MessageCircle, ChevronLeft } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

const PUB = process.env.PUBLIC_URL;

function initialRoute() {
  const p = (window.location.pathname || "").toLowerCase();
  if (p.startsWith("/impressum")) return "impressum";
  if (p.startsWith("/datenschutz")) return "datenschutz";
  return "home";
}

export default function App() {
  const { lang } = useLang();
  const features = useFeatures();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const { user, logout } = useAuth();

  const [resetToken, setResetToken] = useState(() => new URLSearchParams(window.location.search).get("reset"));
  // Accesso admin riservato (nessun link pubblico): solo con ?admin=1 nell'URL.
  const [adminMode] = useState(() => new URLSearchParams(window.location.search).get("admin") === "1");
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [route, setRoute] = useState(initialRoute);
  const [chatOpen, setChatOpen] = useState(false);
  const [techSlug, setTechSlug] = useState(null);
  const pubContent = usePublicContent(); // null finché non caricato
  const isAdmin = !!(user && user.role === "admin");
  useEffect(() => {
    const h = (e) => { setTechSlug(e?.detail?.slug || null); setRoute("tecniche"); window.scrollTo({ top: 0, behavior: "smooth" }); };
    window.addEventListener("mikilab-open-technique", h);
    const hc = () => setChatOpen(true);
    window.addEventListener("mikilab-open-chat", hc);
    const hp = () => { setRoute("perche"); window.scrollTo({ top: 0, behavior: "smooth" }); };
    window.addEventListener("mikilab-open-perche", hp);
    const hn = (e) => { const r = e?.detail?.route; if (r) { setRoute(r); window.scrollTo({ top: 0, behavior: "smooth" }); } };
    window.addEventListener("mikilab-nav", hn);
    return () => { window.removeEventListener("mikilab-open-technique", h); window.removeEventListener("mikilab-open-chat", hc); window.removeEventListener("mikilab-open-perche", hp); window.removeEventListener("mikilab-nav", hn); };
  }, []);

  // V75 — tasto "indietro" del telefono/browser: torna alla pagina precedente del sito invece di uscire.
  const histFirst = useRef(true);
  const histSkip = useRef(false);
  useEffect(() => {
    try {
      if (histFirst.current) { histFirst.current = false; window.history.replaceState({ mlRoute: route }, ""); return; }
      if (histSkip.current) { histSkip.current = false; return; }
      if (!(window.history.state && window.history.state.mlRoute === route)) window.history.pushState({ mlRoute: route }, "");
    } catch { /* */ }
  }, [route]);
  useEffect(() => {
    const onPop = (e) => {
      const next = (e && e.state && e.state.mlRoute) || "home";
      // se la pagina non cambia, l'effetto sopra non parte: non lasciare il "salta" attivo
      setRoute((cur) => { histSkip.current = cur !== next; return next; });
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // <html lang> segue la lingua corrente (non blocca la traduzione automatica del browser).
  useEffect(() => {
    try { document.documentElement.lang = lang || "it"; } catch { /* */ }
  }, [lang]);

  if (resetToken) return <ResetPassword token={resetToken} onDone={() => { setResetToken(null); try { const u = new URL(window.location.href); u.searchParams.delete("reset"); window.history.replaceState({}, "", u.toString()); } catch { /* */ } }} />;

  // Schermata di accesso admin: visibile SOLO via ?admin=1 e solo se non autenticato.
  if (adminMode && !user) {
    return <div className="fixed inset-0 z-[70] bg-background overflow-auto"><AuthScreen onClose={() => { try { const u = new URL(window.location.href); u.searchParams.delete("admin"); window.location.href = u.toString(); } catch { window.location.href = "/"; } }} initialMode="login" /><Toaster position="top-center" richColors /></div>;
  }

  return (
    <ProfileProvider><AmbientProvider><TimerProvider><SoundFXProvider><MixerTimersProvider><MachinesProvider>
      <SplashScreen />
      <div className="holo-root min-h-screen font-sans selection:bg-muted selection:text-foreground">
        <div className="holo-canvas" aria-hidden />
        <div className="relative z-10 flex flex-col min-h-screen">
          <header data-testid="app-header" className="sticky top-0 z-50 border-b border-border/15 bg-background/85 backdrop-blur-xl px-3 sm:px-4 py-2.5">
            <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
              {route !== "home" && (
                <button data-testid="header-back" aria-label={tri("Torna alla Home", "Zur Startseite", "Back to Home")} onClick={() => { setRoute("home"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  className="inline-flex items-center gap-0.5 pl-1.5 pr-2.5 py-1.5 rounded-lg border border-border/50 bg-muted/15 text-foreground font-bold text-xs active:scale-95 transition-all shrink-0">
                  <ChevronLeft className="w-4 h-4" /><span className="hidden sm:inline">{tri("Home", "Start", "Home")}</span>
                </button>
              )}
              <button data-testid="brand-home" onClick={() => { setRoute("home"); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="flex items-center gap-2.5 min-w-0 shrink-0 active:scale-95 transition-transform">
                <img src={`${PUB}/logo-emblem.webp`} alt="MikiLab" data-keepcolor className="w-9 h-9 rounded-lg object-contain shrink-0" />
                <span className="text-left whitespace-nowrap">
                  <span className="block font-display text-lg sm:text-2xl font-black tracking-[0.14em] text-foreground uppercase">MikiLab</span>
                  <span className="hidden sm:block font-mono-data text-[9px] tracking-[0.28em] text-muted-foreground/70 uppercase">Il Manuale di Sitor</span>
                </span>
              </button>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 relative">
                <LangSelector testid="header-lang" />
                <ThemeToggle />
                <InstallApp variant="chip" />
                {isAdmin && (
                  <div className="relative">
                    <button data-testid="account-btn" onClick={() => setShowAccountMenu((v) => !v)}
                      className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg font-bold text-xs active:scale-95 transition-all border bg-muted/15 border-border/50 text-muted-foreground">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{user.name || "Admin"}</span>
                    </button>
                    {showAccountMenu && (
                      <div data-testid="account-menu" className="absolute right-0 top-11 w-64 holo-panel p-3 z-[80]">
                        <p className="text-[11px] text-foreground font-semibold truncate">{user.name || "Admin"}</p>
                        {user.email && <p className="text-[10px] text-muted-foreground truncate mb-2">{user.email}</p>}
                        <button data-testid="costs-link" onClick={() => { setRoute("admin-costs"); setShowAccountMenu(false); window.scrollTo(0, 0); }}
                          className="w-full inline-flex items-center justify-center gap-2 py-2 mb-2 rounded-lg bg-background border border-border text-foreground font-bold text-xs hover:border-accent/50 active:scale-95 transition-all">
                          {tri("Costi & Risparmio", "Kosten & Sparen", "Costs & Savings")}
                        </button>
                        <button data-testid="admin2b-link" onClick={() => { setRoute("admin-2b"); setShowAccountMenu(false); window.scrollTo(0, 0); }}
                          className="w-full inline-flex items-center justify-center gap-2 py-2 mb-2 rounded-lg bg-background border border-border text-foreground font-bold text-xs hover:border-primary/50 active:scale-95 transition-all">
                          {tri("Strumenti di Michele", "Micheles Werkzeuge", "Michele's tools")}
                        </button>
                        <button data-testid="diario-link" onClick={() => { setRoute("admin-diario"); setShowAccountMenu(false); window.scrollTo(0, 0); }}
                          className="w-full inline-flex items-center justify-center gap-2 py-2 mb-2 rounded-lg bg-background border border-border text-foreground font-bold text-xs hover:border-primary/50 active:scale-95 transition-all">
                          {tri("Diario prove", "Test-Tagebuch", "Test log")}
                        </button>
                        <button data-testid="cleanup-link" onClick={() => { setRoute("admin-cleanup"); setShowAccountMenu(false); window.scrollTo(0, 0); }}
                          className="w-full inline-flex items-center justify-center gap-2 py-2 mb-2 rounded-lg bg-background border border-border text-foreground font-bold text-xs hover:border-mattone/50 active:scale-95 transition-all">
                          {tri("Pulizia dati vecchi", "Alte Daten bereinigen", "Clean old data")}
                        </button>
                        <button data-testid="impressum-admin-link" onClick={() => { setRoute("admin-impressum"); setShowAccountMenu(false); window.scrollTo(0, 0); }}
                          className="w-full inline-flex items-center justify-center gap-2 py-2 mb-2 rounded-lg bg-background border border-border text-foreground font-bold text-xs hover:border-primary/50 active:scale-95 transition-all">
                          {tri("Indirizzo Impressum", "Impressum-Adresse", "Impressum address")}
                        </button>
                        <button data-testid="change-pw-link" onClick={() => { setRoute("change-password"); setShowAccountMenu(false); window.scrollTo(0, 0); }}
                          className="w-full inline-flex items-center justify-center gap-2 py-2 mb-2 rounded-lg bg-background border border-border text-foreground font-bold text-xs hover:border-accent/50 active:scale-95 transition-all">
                          {tri("Cambia password", "Passwort ändern", "Change password")}
                        </button>
                        <button data-testid="logout-btn" onClick={async () => { await logout(); setShowAccountMenu(false); toast.success(tri("Sei uscito.", "Abgemeldet.", "Signed out.", "Has salido.", "Déconnecté.", "خارج شدی.")); }}
                          className="w-full inline-flex items-center justify-center gap-2 py-2 rounded-lg bg-background border border-border text-mattone font-bold text-xs hover:border-mattone/50 active:scale-95 transition-all">
                          <LogOut className="w-3.5 h-3.5" /> {tri("Esci", "Abmelden", "Sign out", "Salir", "Quitter", "خروج")}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </header>

          <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pb-40 pt-6">
            <ErrorBoundary resetKey={`${lang}-${route}-${isAdmin ? "a" : "p"}`}>
              {route === "home" && <HomeManuale features={features} onNav={(r) => { if (r === "chat") { setChatOpen(true); return; } if (r === "attrezzi") { setRoute("recipes"); setTimeout(() => window.dispatchEvent(new CustomEvent("mikilab-ricette-view", { detail: { view: "guida" } })), 150); return; } if (r === "tecniche") { setTechSlug(null); } setRoute(r); window.scrollTo({ top: 0, behavior: "smooth" }); }} />}
              {route === "recipes" && <Ricette isMasterView={isAdmin} />}
              {route === "tecniche" && <TecnichePage initialSlug={techSlug} onBack={() => setRoute("home")} />}
              {route === "verde" && <VerdeMikiLab onBack={() => setRoute("home")} onOpenRecipe={(id) => { setRoute("recipes"); setTimeout(() => window.dispatchEvent(new CustomEvent("mikilab-open-recipe", { detail: { id } })), 150); }} />}
              {route === "miglioratore" && <MiglioratorePage onBack={() => setRoute("home")} onOpenRecipe={(id) => { setRoute("recipes"); setTimeout(() => window.dispatchEvent(new CustomEvent("mikilab-open-recipe", { detail: { id } })), 150); }} />}
              {route === "admin-costs" && isAdmin && <AdminCosts onBack={() => setRoute("home")} />}
              {route === "admin-2b" && isAdmin && <Admin2B onBack={() => setRoute("home")} />}
              {route === "admin-diario" && isAdmin && <DiarioProve onBack={() => setRoute("home")} onOpenRecipe={(id) => { setRoute("recipes"); setTimeout(() => window.dispatchEvent(new CustomEvent("mikilab-open-recipe", { detail: { id } })), 150); }} />}
              {route === "admin-cleanup" && isAdmin && <PuliziaDati onBack={() => setRoute("home")} />}
              {route === "change-password" && isAdmin && <ChangePassword onBack={() => setRoute("home")} />}
              {route === "admin-impressum" && isAdmin && <ImpressumAdmin onBack={() => setRoute("home")} />}
              {route === "cosa-faccio" && <CosaFaccio onBack={() => setRoute("home")} onOpenRecipe={(id) => { setRoute("recipes"); setTimeout(() => window.dispatchEvent(new CustomEvent("mikilab-open-recipe", { detail: { id } })), 150); }} />}
              {route === "live" && (!features || features.FEATURE_LIVE !== false) && <Live onBack={() => setRoute("home")} />}
              {route === "mensola" && <Mensola onBack={() => setRoute("home")} />}
              {route === "cucina" && <Cucina onBack={() => setRoute("home")} />}
              {route === "plan" && <Plan onBack={() => setRoute("home")} />}
              {route === "testmese" && <TestMese onBack={() => setRoute("home")} />}
              {route === "farine" && <Farine onBack={() => setRoute("home")} />}
              {route === "calendario" && <Calendario onBack={() => setRoute("home")} onOpenRecipe={(id) => { setRoute("recipes"); setTimeout(() => window.dispatchEvent(new CustomEvent("mikilab-open-recipe", { detail: { id } })), 150); }} />}
              {route === "dalmondo" && <DalMondo onBack={() => setRoute("home")} onOpenRecipe={(id) => { setRoute("recipes"); setTimeout(() => window.dispatchEvent(new CustomEvent("mikilab-open-recipe", { detail: { id } })), 150); }} />}
              {route === "paneieri" && <PaneDiIeri onBack={() => setRoute("home")} />}
              {route === "crealievito" && <CreaLievito onBack={() => setRoute("home")} />}
              {route === "panico" && <CenaSughi initialTab="panico" onBack={() => setRoute("home")} />}
              {route === "sughi" && <CenaSughi initialTab="sughi" onBack={() => setRoute("home")} />}
              {route === "percorso" && <PercorsoPage onBack={() => setRoute("home")} onNav={(r) => { setRoute(r); window.scrollTo(0, 0); }} onOpenRecipe={(id) => { setRoute("recipes"); setTimeout(() => window.dispatchEvent(new CustomEvent("mikilab-open-recipe", { detail: { id } })), 150); }} />}
              {route === "regala" && <RegalaPage onBack={() => setRoute("home")} />}
              {route === "perche" && <PaginaSito slug="perche" onBack={() => setRoute("home")} />}
              {route === "impressum" && <LegalPlaceholder kind="impressum" onBack={() => setRoute("home")} />}
              {route === "datenschutz" && <LegalPlaceholder kind="datenschutz" onBack={() => setRoute("home")} />}
            </ErrorBoundary>
          </main>

          <footer data-testid="app-footer" className="border-t border-border/12 bg-background/70 px-4 py-6 mt-auto">
            <div className="max-w-6xl mx-auto flex flex-col gap-3 text-[11px] text-muted-foreground">
              <p className="text-center text-foreground">{tri("Gratis per uso personale. Vietato riprodurre o vendere ricette e testi. I link sono benvenuti.", "Kostenlos für den privaten Gebrauch. Rezepte und Texte dürfen nicht reproduziert oder verkauft werden. Links sind willkommen.", "Free for personal use. Reproducing or selling recipes and texts is forbidden. Links are welcome.")}</p>
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
                <button data-testid="footer-regala" onClick={() => { setRoute("regala"); window.scrollTo(0, 0); }} className="hover:text-foreground font-bold">{tri("Regala MikiLab", "MikiLab verschenken", "Gift MikiLab")}</button>
                {pubContent?.hasPerche && (
                  <button data-testid="footer-perche" onClick={() => { setRoute("perche"); window.scrollTo(0, 0); }} className="hover:text-foreground font-bold">{tri("Perché MikiLab", "Warum MikiLab", "Why MikiLab")}</button>
                )}
                <button data-testid="footer-impressum" onClick={() => { setRoute("impressum"); window.scrollTo(0, 0); }} className="hover:text-foreground font-bold">Impressum</button>
                <button data-testid="footer-datenschutz" onClick={() => { setRoute("datenschutz"); window.scrollTo(0, 0); }} className="hover:text-foreground font-bold">{tri("Privacy", "Datenschutz", "Privacy")}</button>
              </div>
              <div className="flex flex-col items-center gap-2 pt-1">
                <p data-testid="footer-two-types" className="text-center max-w-3xl">{tri(
                  "Le ricette sono di due tipi: quelle controllate o provate da Michele e le bozze scritte da Sitor, un'intelligenza artificiale basata sui modelli di Anthropic. Ogni ricetta dice chiaramente di quale tipo è.",
                  "Die Rezepte sind von zwei Arten: die von Michele geprüften oder erprobten und die von Sitor geschriebenen Entwürfe, einer künstlichen Intelligenz auf Basis der Anthropic-Modelle. Jedes Rezept sagt klar, welcher Art es ist.",
                  "Recipes are of two kinds: those checked or tested by Michele and the drafts written by Sitor, an artificial intelligence based on Anthropic models. Each recipe clearly states which kind it is.")}</p>
                <p data-testid="footer-sitor-avatar" className="text-center font-bold text-foreground">{tri("Sitor è l'avatar IA di Michele.", "Sitor ist Micheles KI-Avatar.", "Sitor is Michele's AI avatar.")}</p>
                <p data-testid="footer-copyright-usage" className="text-center max-w-3xl">{tri(
                  "Ricette e testi © MikiLab. Gratis per uso personale. Le stampe e le condivisioni ufficiali riportano il logo MikiLab.",
                  "Rezepte und Texte © MikiLab. Kostenlos für den privaten Gebrauch. Offizielle Ausdrucke und geteilte Inhalte tragen das MikiLab-Logo.",
                  "Recipes and texts © MikiLab. Free for personal use. Official prints and shares carry the MikiLab logo.")}</p>
                <SitorBadge size={26} onOpenPerche={() => { setRoute("perche"); window.scrollTo(0, 0); }} />
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1 border-t border-border/10">
                <p>© MikiLab — {tri("Il Manuale di Sitor", "Sitors Handbuch", "Sitor's Manual")}</p>
                <p data-testid="footer-langs" className="text-muted-foreground">{tri("Altre lingue: usa il traduttore del tuo browser.", "Weitere Sprachen: nutze den Übersetzer deines Browsers.", "Other languages: use your browser's translator.")}</p>
              </div>
            </div>
          </footer>
        </div>

        <RadioFornaio />
        {chatOpen && <SitorChat onClose={() => setChatOpen(false)} />}
        <button data-testid="sitor-chat-fab" onClick={() => setChatOpen(true)} aria-label="Chat Sitor"
          className="fixed z-[60] bottom-5 right-5 flex items-center gap-2 pl-2 pr-4 py-2 rounded-full bg-muted hover:bg-muted text-foreground shadow-xl active:scale-95 transition-all">
          <img src="/sitor_official.webp" alt="" className="w-9 h-9 rounded-full object-cover border-2 border-border" />
          <span className="font-bold text-sm hidden sm:inline">{tri("Chiedi a Sitor", "Frag Sitor", "Ask Sitor")}</span>
          <MessageCircle className="w-4 h-4 sm:hidden" />
        </button>
        <Toaster position="top-center" richColors />
      </div>
    </MachinesProvider></MixerTimersProvider></SoundFXProvider></TimerProvider></AmbientProvider></ProfileProvider>
  );
}
