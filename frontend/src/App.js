/*
 * ============================================================================
 *  MIKILAB — IL MANUALE DI SITOR
 *  Ricettario pubblico e gratuito, guidato da Sitor, per chi cucina a casa.
 * ============================================================================
 */
import { useState, useEffect } from "react";
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
import { mkTri } from "@/i18n/triMaps";
import { ShieldCheck, LogOut, MessageCircle } from "lucide-react";

const PUB = process.env.PUBLIC_URL;

function initialRoute() {
  const p = (window.location.pathname || "").toLowerCase();
  if (p.startsWith("/impressum")) return "impressum";
  if (p.startsWith("/datenschutz")) return "datenschutz";
  return "home";
}

export default function App() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const { user, logout } = useAuth();

  const [resetToken, setResetToken] = useState(() => new URLSearchParams(window.location.search).get("reset"));
  // Accesso admin riservato (nessun link pubblico): solo con ?admin=1 nell'URL.
  const [adminMode] = useState(() => new URLSearchParams(window.location.search).get("admin") === "1");
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [route, setRoute] = useState(initialRoute);
  const [chatOpen, setChatOpen] = useState(false);
  const [techSlug, setTechSlug] = useState(null);
  const isAdmin = !!(user && user.role === "admin");
  useEffect(() => {
    const h = (e) => { setTechSlug(e?.detail?.slug || null); setRoute("tecniche"); window.scrollTo({ top: 0, behavior: "smooth" }); };
    window.addEventListener("mikilab-open-technique", h);
    return () => window.removeEventListener("mikilab-open-technique", h);
  }, []);

  // <html lang> segue la lingua corrente (non blocca la traduzione automatica del browser).
  useEffect(() => {
    try { document.documentElement.lang = lang || "it"; } catch { /* */ }
  }, [lang]);

  if (resetToken) return <ResetPassword token={resetToken} onDone={() => { setResetToken(null); try { const u = new URL(window.location.href); u.searchParams.delete("reset"); window.history.replaceState({}, "", u.toString()); } catch { /* */ } }} />;

  // Schermata di accesso admin: visibile SOLO via ?admin=1 e solo se non autenticato.
  if (adminMode && !user) {
    return <div className="fixed inset-0 z-[70] bg-[#060A10] overflow-auto"><AuthScreen onClose={() => { try { const u = new URL(window.location.href); u.searchParams.delete("admin"); window.location.href = u.toString(); } catch { window.location.href = "/"; } }} initialMode="login" /></div>;
  }

  return (
    <ProfileProvider><AmbientProvider><TimerProvider><SoundFXProvider><MixerTimersProvider><MachinesProvider>
      <SplashScreen />
      <div className="holo-root min-h-screen font-sans selection:bg-[#8a97a6] selection:text-[#060A10]">
        <div className="holo-canvas" aria-hidden />
        <div className="relative z-10 flex flex-col min-h-screen">
          <header data-testid="app-header" className="sticky top-0 z-50 border-b border-[#8a97a6]/15 bg-[#060A10]/85 backdrop-blur-xl px-3 sm:px-4 py-2.5">
            <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
              <button data-testid="brand-home" onClick={() => { setRoute("home"); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="flex items-center gap-2.5 min-w-0 shrink-0 active:scale-95 transition-transform">
                <img src={`${PUB}/logo-emblem.png`} alt="MikiLab" data-keepcolor className="w-9 h-9 rounded-lg object-contain shrink-0" />
                <span className="text-left whitespace-nowrap">
                  <span className="block font-cyber text-lg sm:text-2xl font-black tracking-[0.14em] text-white uppercase">MikiLab</span>
                  <span className="hidden sm:block font-mono-data text-[9px] tracking-[0.28em] text-[#8a97a6]/70 uppercase">Il Manuale di Sitor</span>
                </span>
              </button>

              <div className="flex items-center gap-1.5 sm:gap-2 relative">
                <LangSelector testid="header-lang" />
                <InstallApp variant="chip" />
                {isAdmin && (
                  <div className="relative">
                    <button data-testid="account-btn" onClick={() => setShowAccountMenu((v) => !v)}
                      className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg font-bold text-xs active:scale-95 transition-all border bg-[#8a97a6]/15 border-[#8a97a6]/50 text-[#8a97a6]">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{user.name || "Admin"}</span>
                    </button>
                    {showAccountMenu && (
                      <div data-testid="account-menu" className="absolute right-0 top-11 w-64 holo-panel p-3 z-[80]">
                        <p className="text-[11px] text-white font-semibold truncate">{user.name || "Admin"}</p>
                        {user.email && <p className="text-[10px] text-[#94A3B8] truncate mb-2">{user.email}</p>}
                        <button data-testid="logout-btn" onClick={async () => { await logout(); setShowAccountMenu(false); toast.success(tri("Sei uscito.", "Abgemeldet.", "Signed out.", "Has salido.", "Déconnecté.", "خارج شدی.")); }}
                          className="w-full inline-flex items-center justify-center gap-2 py-2 rounded-lg bg-[#0C1019] border border-[#1e293b] text-[#bb8489] font-bold text-xs hover:border-[#bb8489]/50 active:scale-95 transition-all">
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
              {route === "home" && <HomeManuale onNav={(r) => { if (r === "chat") { setChatOpen(true); return; } if (r === "attrezzi") { setRoute("recipes"); setTimeout(() => window.dispatchEvent(new CustomEvent("mikilab-ricette-view", { detail: { view: "guida" } })), 150); return; } if (r === "tecniche") { setTechSlug(null); } setRoute(r); window.scrollTo({ top: 0, behavior: "smooth" }); }} />}
              {route === "recipes" && <Ricette isMasterView={isAdmin} />}
              {route === "tecniche" && <TecnichePage initialSlug={techSlug} onBack={() => setRoute("home")} />}
              {route === "verde" && <VerdeMikiLab onBack={() => setRoute("home")} onOpenRecipe={(id) => { setRoute("recipes"); setTimeout(() => window.dispatchEvent(new CustomEvent("mikilab-open-recipe", { detail: { id } })), 150); }} />}
              {route === "percorso" && <PercorsoPage onBack={() => setRoute("home")} onNav={(r) => { setRoute(r); window.scrollTo(0, 0); }} onOpenRecipe={(id) => { setRoute("recipes"); setTimeout(() => window.dispatchEvent(new CustomEvent("mikilab-open-recipe", { detail: { id } })), 150); }} />}
              {route === "regala" && <RegalaPage onBack={() => setRoute("home")} />}
              {route === "perche" && <PaginaSito slug="perche" onBack={() => setRoute("home")} />}
              {route === "impressum" && <LegalPlaceholder kind="impressum" onBack={() => setRoute("home")} />}
              {route === "datenschutz" && <LegalPlaceholder kind="datenschutz" onBack={() => setRoute("home")} />}
            </ErrorBoundary>
          </main>

          <footer data-testid="app-footer" className="border-t border-[#8a97a6]/12 bg-[#060A10]/70 px-4 py-6 mt-auto">
            <div className="max-w-6xl mx-auto flex flex-col gap-3 text-[11px] text-[#94A3B8]">
              <p className="text-center text-[#cbd5e1]">{tri("Gratis per uso personale. Vietato riprodurre o vendere ricette e testi. I link sono benvenuti.", "Kostenlos für den privaten Gebrauch. Rezepte und Texte dürfen nicht reproduziert oder verkauft werden. Links sind willkommen.", "Free for personal use. Reproducing or selling recipes and texts is forbidden. Links are welcome.")}</p>
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
                <button data-testid="footer-regala" onClick={() => { setRoute("regala"); window.scrollTo(0, 0); }} className="hover:text-white font-bold">{tri("Regala MikiLab", "MikiLab verschenken", "Gift MikiLab")}</button>
                <button data-testid="footer-perche" onClick={() => { setRoute("perche"); window.scrollTo(0, 0); }} className="hover:text-white font-bold">{tri("Perché MikiLab", "Warum MikiLab", "Why MikiLab")}</button>
                <button data-testid="footer-impressum" onClick={() => { setRoute("impressum"); window.scrollTo(0, 0); }} className="hover:text-white font-bold">Impressum</button>
                <button data-testid="footer-datenschutz" onClick={() => { setRoute("datenschutz"); window.scrollTo(0, 0); }} className="hover:text-white font-bold">{tri("Privacy", "Datenschutz", "Privacy")}</button>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1 border-t border-[#8a97a6]/10">
                <p>© MikiLab — {tri("Il Manuale di Sitor", "Sitors Handbuch", "Sitor's Manual")}</p>
                <p data-testid="footer-langs" className="text-[#64748B]">{tri("Altre lingue: usa il traduttore del tuo browser.", "Weitere Sprachen: nutze den Übersetzer deines Browsers.", "Other languages: use your browser's translator.")}</p>
              </div>
            </div>
          </footer>
        </div>

        <RadioFornaio />
        {chatOpen && <SitorChat onClose={() => setChatOpen(false)} />}
        <button data-testid="sitor-chat-fab" onClick={() => setChatOpen(true)} aria-label="Chat Sitor"
          className="fixed z-[60] bottom-5 right-5 flex items-center gap-2 pl-2 pr-4 py-2 rounded-full bg-[#A85A22] hover:bg-[#8F4A1B] text-[#FFFDF8] shadow-xl active:scale-95 transition-all">
          <img src="/sitor_official.jpg" alt="" className="w-9 h-9 rounded-full object-cover border-2 border-[#E9A23B]" />
          <span className="font-bold text-sm hidden sm:inline">{tri("Chiedi a Sitor", "Frag Sitor", "Ask Sitor")}</span>
          <MessageCircle className="w-4 h-4 sm:hidden" />
        </button>
        <Toaster position="top-center" richColors />
      </div>
    </MachinesProvider></MixerTimersProvider></SoundFXProvider></TimerProvider></AmbientProvider></ProfileProvider>
  );
}
