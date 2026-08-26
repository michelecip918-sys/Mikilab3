import { Moon, Sun, Clock, LogOut, LogIn, Crown } from "lucide-react";
import { useState, useEffect } from "react";
import { useLang } from "@/i18n/LanguageContext";
import { useAuth } from "@/auth/AuthContext";
import AdminPanel from "@/components/AdminPanel";
import NotificationBell from "@/components/NotificationBell";

export default function Header() {
  const [dark, setDark] = useState(false);
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

  return (
    <header
      data-testid="app-header"
      className="sticky top-0 z-40 bg-[#f0f6fb]/95 dark:bg-[#1B2127]/95 backdrop-blur-md border-b border-[#d5e4f0] dark:border-[#38424B]"
    >
      <div className="px-4 py-3 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#232A31] flex items-center justify-center shadow-sm ring-2 ring-[#D4AF37]/70 shrink-0">
          <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="MikiLab" className="w-full h-full object-cover" />
        </div>
        <div className="min-w-0 leading-none">
          <p className="font-display text-lg font-extrabold tracking-tight text-[#234b6e] dark:text-[#e4eff8] truncate">MikiLab</p>
          <p className="hidden min-[380px]:block text-[10px] font-semibold text-[#7E8A93] truncate">{t("brand_subtitle")}</p>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {/* Orologio (nascosto su schermi molto stretti per non coprire il titolo) */}
        <div data-testid="header-clock" className="hidden min-[420px]:flex items-center gap-1.5 bg-[#e4eff8] dark:bg-[#2A323A] rounded-xl border border-[#d5e4f0] dark:border-[#38424B] px-2.5 py-1.5">
          <Clock className="w-3.5 h-3.5 text-[#3f7cac]" />
          <span className="font-mono-data text-xs font-bold text-[#2B303B] dark:text-[#e4eff8]">
            {now.toLocaleTimeString(lang === "de" ? "de-DE" : lang === "en" ? "en-GB" : "it-IT", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>

        {/* Language switcher IT / DE */}
        <div
          data-testid="lang-switcher"
          className="flex items-center bg-[#e4eff8] dark:bg-[#2A323A] rounded-xl border border-[#d5e4f0] dark:border-[#38424B] p-0.5"
          aria-label={t("lang_label")}
        >
          {["it", "de", "en", "es"].map((l) => (
            <button
              key={l}
              data-testid={`lang-${l}`}
              onClick={() => setLang(l)}
              className={`px-2 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                lang === l
                  ? "bg-[#3f7cac] text-white shadow-sm"
                  : "text-[#7E8A93]"
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        <button
          data-testid="theme-toggle"
          onClick={() => setDark((d) => !d)}
          className="w-10 h-10 rounded-xl bg-[#e4eff8] dark:bg-[#2A323A] border border-[#d5e4f0] dark:border-[#38424B] flex items-center justify-center text-[#3f7cac] active:scale-95 transition-all"
          aria-label={t("theme_toggle")}
        >
          {dark ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
        </button>

        {user?.role === "admin" && (
          <button
            data-testid="admin-btn"
            onClick={() => setAdminOpen(true)}
            className="w-10 h-10 rounded-xl bg-[#6E8CA0]/15 border border-[#6E8CA0]/40 flex items-center justify-center text-[#6E8CA0] active:scale-95 transition-all"
            aria-label="Admin" title="Admin · VIP"
          >
            <Crown className="w-4.5 h-4.5" />
          </button>
        )}

        {user && <NotificationBell />}

        {user ? (
          <button
            data-testid="logout-btn"
            onClick={logout}
            className="w-10 h-10 rounded-xl bg-[#e4eff8] dark:bg-[#2A323A] border border-[#d5e4f0] dark:border-[#38424B] flex items-center justify-center text-[#C0574D] active:scale-95 transition-all"
            aria-label="Logout"
            title={user.email}
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        ) : (
          <button
            data-testid="login-btn"
            onClick={() => setAuthOpen(true)}
            className="h-10 px-3 rounded-xl bg-[#3f7cac] text-white text-sm font-semibold flex items-center gap-1.5 active:scale-95 transition-all"
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
