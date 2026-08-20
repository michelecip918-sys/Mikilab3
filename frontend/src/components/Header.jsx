import { Wheat, Moon, Sun, MapPin, Clock, LogOut, LogIn, Music, VolumeX, Crown } from "lucide-react";
import { useState, useEffect } from "react";
import { useLang } from "@/i18n/LanguageContext";
import { useAuth } from "@/auth/AuthContext";
import { useAmbient } from "@/audio/AmbientContext";
import AdminPanel from "@/components/AdminPanel";

export default function Header() {
  const [dark, setDark] = useState(false);
  const [now, setNow] = useState(new Date());
  const [adminOpen, setAdminOpen] = useState(false);
  const { lang, setLang, t } = useLang();
  const { user, logout, setAuthOpen } = useAuth();
  const { on: musicOn, toggle: toggleMusic } = useAmbient();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header
      data-testid="app-header"
      className="sticky top-0 z-40 bg-[#FDFBF7]/95 dark:bg-[#1A1412]/95 backdrop-blur-md border-b border-[#E8DEC8] dark:border-[#3D302A]"
    >
      {/* Fascia bandiere: Italia (verde-bianco-rosso) + Germania (nero-rosso-oro) */}
      <div data-testid="flag-strip" aria-hidden className="flex h-1.5 w-full">
        <div className="flex-1 bg-[#009246]" />
        <div className="flex-1 bg-white" />
        <div className="flex-1 bg-[#CE2B37]" />
        <div className="flex-1 bg-[#111111]" />
        <div className="flex-1 bg-[#DD0000]" />
        <div className="flex-1 bg-[#FFCE00]" />
      </div>

      <div className="px-4 py-3 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <div className="flex items-center -space-x-2 shrink-0">
          <div className="w-9 h-9 rounded-xl overflow-hidden bg-[#2A211D] flex items-center justify-center shadow-sm ring-2 ring-[#FFCE00]/70">
            <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Mikilab" className="w-full h-full object-cover" />
          </div>
          <img src={`${process.env.PUBLIC_URL}/michele-cartoon.jpg`} alt="Michele"
            data-testid="header-michele"
            className="w-9 h-9 rounded-full object-cover object-top ring-2 ring-white dark:ring-[#1A1412] shadow-sm bg-[#B34A26]"
            onError={(e) => { e.currentTarget.style.display = "none"; }} />
        </div>
        <div className="leading-none min-w-0">
          <div className="font-display text-lg font-bold text-[#2C221E] dark:text-[#F5EFE6] truncate">
            Mikilab
          </div>
          <div className="text-[10px] tracking-wide font-semibold text-[#8C7567] flex items-center gap-1 truncate">
            <span>🇮🇹</span> <span className="truncate">{t("brand_subtitle")}</span> <span>🇩🇪</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {/* Orologio (nascosto su schermi molto stretti per non coprire il titolo) */}
        <div data-testid="header-clock" className="hidden min-[420px]:flex items-center gap-1.5 bg-[#F5EFE6] dark:bg-[#332823] rounded-xl border border-[#E8DEC8] dark:border-[#3D302A] px-2.5 py-1.5">
          <Clock className="w-3.5 h-3.5 text-[#B34A26]" />
          <span className="font-mono-data text-xs font-bold text-[#2C221E] dark:text-[#F5EFE6]">
            {now.toLocaleTimeString(lang === "de" ? "de-DE" : "it-IT", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>

        {/* Language switcher IT / DE */}
        <div
          data-testid="lang-switcher"
          className="flex items-center bg-[#F5EFE6] dark:bg-[#332823] rounded-xl border border-[#E8DEC8] dark:border-[#3D302A] p-0.5"
          aria-label={t("lang_label")}
        >
          {["it", "de"].map((l) => (
            <button
              key={l}
              data-testid={`lang-${l}`}
              onClick={() => setLang(l)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                lang === l
                  ? "bg-[#B34A26] text-white shadow-sm"
                  : "text-[#8C7567]"
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        <button
          data-testid="music-toggle"
          onClick={toggleMusic}
          className={`w-10 h-10 rounded-xl border flex items-center justify-center active:scale-95 transition-all ${
            musicOn
              ? "bg-[#B34A26] border-[#B34A26] text-white"
              : "bg-[#F5EFE6] dark:bg-[#332823] border-[#E8DEC8] dark:border-[#3D302A] text-[#B34A26]"
          }`}
          aria-label={t("music_toggle")}
          title={t("music_toggle")}
        >
          {musicOn ? <Music className="w-4.5 h-4.5" /> : <VolumeX className="w-4.5 h-4.5" />}
        </button>

        <button
          data-testid="theme-toggle"
          onClick={() => setDark((d) => !d)}
          className="w-10 h-10 rounded-xl bg-[#F5EFE6] dark:bg-[#332823] border border-[#E8DEC8] dark:border-[#3D302A] flex items-center justify-center text-[#B34A26] active:scale-95 transition-all"
          aria-label={t("theme_toggle")}
        >
          {dark ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
        </button>

        {user?.role === "admin" && (
          <button
            data-testid="admin-btn"
            onClick={() => setAdminOpen(true)}
            className="w-10 h-10 rounded-xl bg-[#D99B26]/15 border border-[#D99B26]/40 flex items-center justify-center text-[#D99B26] active:scale-95 transition-all"
            aria-label="Admin" title="Admin · VIP"
          >
            <Crown className="w-4.5 h-4.5" />
          </button>
        )}

        {user ? (
          <button
            data-testid="logout-btn"
            onClick={logout}
            className="w-10 h-10 rounded-xl bg-[#F5EFE6] dark:bg-[#332823] border border-[#E8DEC8] dark:border-[#3D302A] flex items-center justify-center text-[#B4442A] active:scale-95 transition-all"
            aria-label="Logout"
            title={user.email}
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        ) : (
          <button
            data-testid="login-btn"
            onClick={() => setAuthOpen(true)}
            className="h-10 px-3 rounded-xl bg-[#B34A26] text-white text-sm font-semibold flex items-center gap-1.5 active:scale-95 transition-all"
            aria-label="Accedi"
          >
            <LogIn className="w-4 h-4" /> {t("login_cta")}
          </button>
        )}
      </div>
      </div>
      <AdminPanel open={adminOpen} onOpenChange={setAdminOpen} />
    </header>
  );
}
