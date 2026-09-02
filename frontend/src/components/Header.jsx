import { mkTri } from "@/i18n/triMaps";
import { Moon, Sun, Clock, LogOut, LogIn, Menu, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { useLang } from "@/i18n/LanguageContext";
import { useAuth } from "@/auth/AuthContext";
import AdminPanel from "@/components/AdminPanel";
import NotificationBell from "@/components/NotificationBell";
import GlobalSearch from "@/components/GlobalSearch";
import { TrinityBadges, TrinitySeal } from "@/components/TrinityGold";

export default function Header() {
  const [dark, setDark] = useState(true);
  const [now, setNow] = useState(new Date());
  const [adminOpen, setAdminOpen] = useState(false);
  const { lang, setLang, t } = useLang();
  const { user, logout, setAuthOpen } = useAuth();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const h = () => setAdminOpen(true);
    window.addEventListener("mikilab-open-admin", h);
    return () => window.removeEventListener("mikilab-open-admin", h);
  }, []);

  return (
    <header
      data-testid="app-header"
      className="sticky top-0 z-40 bg-[#121212]/95 dark:bg-[#121212]/95 backdrop-blur-md border-b border-[#2e2e2e] dark:border-[#2e2e2e]"
    >
      <div className="px-3 sm:px-4 py-2.5 sm:py-3 flex flex-wrap items-center justify-between gap-y-2 gap-x-2">
      <div className="flex items-center gap-2 min-w-0 w-full sm:w-auto sm:flex-1">
        <button data-testid="site-menu-open" onClick={() => window.dispatchEvent(new Event("mikilab-open-menu"))} aria-label="Menu"
          className="menu-attn w-10 h-10 rounded-2xl shadow-md border border-amber-900/40 bg-[#e4eff8] dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] flex items-center justify-center text-[#c94f00] dark:text-[#e4eff8] active:scale-95 hover:bg-[#d9e8f4] transition-all shrink-0">
          <Menu className="w-5 h-5" />
        </button>
        <button data-testid="header-logo-home" onClick={() => { try { window.dispatchEvent(new CustomEvent("mikilab-goto", { detail: { tab: "home" } })); } catch (e) { /* */ } }} className="flex items-center gap-2 min-w-0 active:scale-95 transition-all">
          <span className="w-9 h-9 rounded-2xl shadow-md border border-amber-900/40 overflow-hidden bg-[#1e1e1e] flex items-center justify-center shadow-sm ring-2 ring-[#D4AF37]/70 shrink-0">
            <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="MikiLab" className="w-full h-full object-cover" />
          </span>
          <span className="leading-none min-w-0 text-left">
            <span className="block font-display text-lg font-extrabold tracking-tight text-[#c94f00] dark:text-[#e4eff8] truncate">MikiLab</span>
            <span className="block text-[9px] sm:text-[10px] font-semibold text-[#7E8A93] truncate max-w-[150px]">{t("brand_subtitle")}</span>
          </span>
        </button>
        <TrinityBadges />
      </div>

      <div className="flex items-center gap-1 flex-wrap justify-end w-full sm:w-auto">
        <span data-testid="bakemix-status" title="BakeMix AI online" className="flex items-center gap-1 rounded-full px-2 py-1 mr-0.5" style={{ background: "#1a1206", border: "1px solid #6E5320" }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#39d98a" }} />
          <span className="text-[9.5px] font-extrabold tracking-wide" style={{ color: "#E7B23C" }}>BakeMix AI</span>
        </span>
        <TrinitySeal />
        <button data-testid="header-search-btn" onClick={() => window.dispatchEvent(new Event("mikilab-open-search"))} aria-label={mkTri(lang)("Cerca", "Suche", "Search", "Buscar", "Chercher", "جستجو")}
          className="w-10 h-10 rounded-2xl shadow-md border border-amber-900/40 bg-[#e4eff8] dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] flex items-center justify-center text-[#c94f00] active:scale-95 hover:bg-[#d9e8f4] transition-all">
          <Search className="w-4.5 h-4.5" />
        </button>
        {/* Orologio (nascosto su schermi stretti per non coprire il titolo) */}
        <div data-testid="header-clock" className="flex items-center gap-1.5 bg-[#e4eff8] dark:bg-[#1e1e1e] rounded-2xl shadow-md border border-amber-900/40 border border-[#2e2e2e] dark:border-[#2e2e2e] px-2 py-1.5">
          <Clock className="w-3.5 h-3.5 text-[#c94f00]" />
          <span className="font-mono-data text-xs font-bold text-[#2B303B] dark:text-[#e4eff8]">
            {now.toLocaleTimeString(mkTri(lang)("it-IT", "de-DE", "en-GB"), { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>

        {/* Selettore lingue come barattolo di spezie: coperchio di legno + vetro ambrato */}
        <div
          data-testid="lang-switcher"
          className="relative shrink-0"
          aria-label={t("lang_label")}
        >
          <div aria-hidden className="wood-surface h-2 rounded-t-md border border-b-0 border-[#2e2e2e] mx-1 shadow-sm" />
          <div className="relative flex items-center rounded-b-lg rounded-t-[3px] border border-[#c9962e]/70 bg-gradient-to-b from-[#1e1e1e] to-[#c94f00] dark:from-[#3a2f1c] dark:to-[#2a2213] shadow-[inset_0_1px_3px_rgba(255,255,255,.5)]">
            <select
              data-testid="lang-select"
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="appearance-none bg-transparent text-xs font-extrabold uppercase text-[#c94f00] dark:text-[#f0dcae] pl-2 pr-5 py-1.5 outline-none cursor-pointer"
            >
              <option value="it">🇮🇹 IT</option>
              <option value="de">🇩🇪 DE</option>
              <option value="en">🇬🇧 EN</option>
              <option value="es">🇪🇸 ES</option>
              <option value="fr">🇫🇷 FR</option>
              <option value="fa">🇮🇷 FA</option>
            </select>
            <span className="pointer-events-none absolute right-1.5 text-[#8a6a2e] dark:text-[#c9a86a] text-[9px]">▼</span>
          </div>
        </div>

        <button
          data-testid="theme-toggle"
          onClick={() => setDark((d) => !d)}
          className="hidden"
          aria-hidden="true"
          tabIndex={-1}
        >
          {dark ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
        </button>

        {user && <NotificationBell />}

        {user ? (
          <button
            data-testid="logout-btn"
            onClick={logout}
            className="w-10 h-10 rounded-2xl shadow-md border border-amber-900/40 bg-[#e4eff8] dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] flex items-center justify-center text-[#c94f00] active:scale-95 transition-all"
            aria-label="Logout"
            title={user.email}
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        ) : (
          <button
            data-testid="login-btn"
            onClick={() => setAuthOpen(true)}
            className="relative h-10 px-3.5 rounded-lg wood-surface wood-emboss border-2 border-[#2a2a2a] text-[#fdf1df] text-sm font-extrabold flex items-center gap-1.5 active:scale-95 transition-all"
            aria-label="Accedi"
            style={{ textShadow: "0 1px 1px rgba(0,0,0,.5)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#7bd67b] shadow-[0_0_6px_#4caf50]" />
            <LogIn className="w-4 h-4" /> {t("login_cta")}
          </button>
        )}
      </div>
      </div>
      <AdminPanel open={adminOpen} onOpenChange={setAdminOpen} />
      <GlobalSearch />
    </header>
  );
}
