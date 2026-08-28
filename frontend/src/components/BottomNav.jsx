import { Home, BookOpen, Wrench, GraduationCap, Users } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useLang } from "@/i18n/LanguageContext";
import { notificationsApi } from "@/lib/api";
import { mkTri } from "@/i18n/triMaps";

export default function BottomNav({ active, onChange }) {
  const { t, lang } = useLang();
  const triNav = (i, d, e, s) => mkTri(lang)(i, d, e, s);
  const [unread, setUnread] = useState(0);
  const loadUnread = useCallback(async () => {
    try { const d = await notificationsApi.list(); setUnread(d.unread || 0); } catch { setUnread(0); }
  }, []);
  useEffect(() => {
    loadUnread();
    const id = setInterval(loadUnread, 45000);
    const onRefresh = () => loadUnread();
    window.addEventListener("mikilab-notif-refresh", onRefresh);
    window.addEventListener("focus", onRefresh);
    return () => { clearInterval(id); window.removeEventListener("mikilab-notif-refresh", onRefresh); window.removeEventListener("focus", onRefresh); };
  }, [loadUnread]);
  // Impara resta evidenziato anche quando si è in News/Enciclopedia (stessa pagina).
  const norm = ["news", "enciclopedia"].includes(active) ? "impara" : active;
  const TABS = [
    { id: "home", label: t("nav_home"), Icon: Home },
    { id: "ricette", label: t("nav_ricette"), Icon: BookOpen },
    { id: "maestro", label: t("nav_maestro"), Icon: Wrench },
    { id: "impara", label: t("nav_impara"), Icon: GraduationCap },
    { id: "community", label: triNav("Social", "Social", "Social", "Social"), Icon: Users, logo: true },
  ];

  return (
    <nav
      data-testid="bottom-nav"
      className="fixed bottom-0 inset-x-0 bg-[#FAF5EC]/95 dark:bg-[#1B2127]/95 backdrop-blur-md border-t border-[#E6D8C3] dark:border-[#38424B] z-50 shadow-[0_-4px_20px_rgba(44,34,30,0.06)]"
    >
      <div aria-hidden className="flex h-1 w-full">
        <div className="flex-1 bg-[#B45309]" />
        <div className="flex-1 bg-white" />
        <div className="flex-1 bg-[#B45309]" />
        <div className="flex-1 bg-[#2B303B]" />
        <div className="flex-1 bg-[#B45309]" />
        <div className="flex-1 bg-[#e7d5b4]" />
      </div>
      <div className="max-w-xl mx-auto grid grid-cols-5 gap-0.5 px-1 py-2" style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}>
        {TABS.map(({ id, label, Icon, logo }) => {
          const on = norm === id;
          return (
            <button
              key={id}
              data-testid={`nav-tab-${id}`}
              onClick={() => onChange(id)}
              className={`relative flex flex-col items-center justify-center gap-1 py-2 px-0.5 rounded-xl transition-all min-h-[52px] ${
                on ? "bg-[#8C4A27] text-white shadow-md" : "text-[#7E8A93] hover:bg-[#e4eff8] dark:hover:bg-[#2A323A]"
              }`}
            >
              <span className="relative">
                {logo ? (
                  <span className="w-5 h-5 rounded-md flex items-center justify-center overflow-hidden" style={{ background: "linear-gradient(135deg,#123c4a,#1f5a68 60%,#a9772f)" }}>
                    <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Social" className="w-4 h-4 object-contain" />
                  </span>
                ) : (
                  <Icon className="w-5 h-5" strokeWidth={on ? 2.4 : 2} />
                )}
                {id === "community" && unread > 0 && (
                  <span data-testid="nav-community-badge" className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] px-1 rounded-full bg-[#E4572E] text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-[#FAF5EC] dark:ring-[#1B2127]">{unread > 9 ? "9+" : unread}</span>
                )}
              </span>
              <span className="text-[10px] font-semibold leading-none text-center">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
