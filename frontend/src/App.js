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
import { mkTri } from "@/i18n/triMaps";
import { ShieldCheck, LogOut } from "lucide-react";

const PUB = process.env.PUBLIC_URL;

export default function App() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const { user, logout } = useAuth();

  const [resetToken, setResetToken] = useState(() => new URLSearchParams(window.location.search).get("reset"));
  // Accesso admin riservato (nessun link pubblico): solo con ?admin=1 nell'URL.
  const [adminMode] = useState(() => new URLSearchParams(window.location.search).get("admin") === "1");
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const isAdmin = !!(user && user.role === "admin");

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
              <button data-testid="brand-home" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex items-center gap-2.5 min-w-0 shrink-0 active:scale-95 transition-transform">
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
            <ErrorBoundary resetKey={`${lang}-${isAdmin ? "a" : "p"}`}>
              <Ricette isMasterView={isAdmin} />
            </ErrorBoundary>
          </main>
        </div>

        <RadioFornaio />
        <Toaster position="top-center" richColors />
      </div>
    </MachinesProvider></MixerTimersProvider></SoundFXProvider></TimerProvider></AmbientProvider></ProfileProvider>
  );
}
