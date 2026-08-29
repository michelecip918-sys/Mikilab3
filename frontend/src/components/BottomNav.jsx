import { Home, BookOpen, Wrench, GraduationCap, Users } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useLang } from "@/i18n/LanguageContext";
import { notificationsApi } from "@/lib/api";
import { mkTri } from "@/i18n/triMaps";

// Navigazione "pale da forno": ogni sezione è una pala di legno con icona incisa.
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

  const norm = ["news", "enciclopedia"].includes(active) ? "impara" : active;
  const TABS = [
    { id: "home", label: t("nav_home"), Icon: Home },
    { id: "ricette", label: t("nav_ricette"), Icon: BookOpen },
    { id: "maestro", label: t("nav_maestro"), Icon: Wrench },
    { id: "impara", label: t("nav_impara"), Icon: GraduationCap },
    { id: "community", label: triNav("Social", "Social", "Social", "Social"), Icon: Users, logo: true },
  ];
  const ROT = [-6, -3, 0, 3, 6]; // leggera rotazione a ventaglio delle pale

  return (
    <nav
      data-testid="bottom-nav"
      className="fixed bottom-0 inset-x-0 z-50 wood-surface border-t-4 border-[#2e2e2e] shadow-[0_-6px_22px_rgba(44,30,16,0.4)]"
    >
      <div aria-hidden className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-b from-[#FF6B00]/70 to-transparent" />
      <div aria-hidden className="absolute inset-0 bg-[#0d0d0d]/25" />
      <div className="relative max-w-xl mx-auto grid grid-cols-5 gap-1 px-2 pt-2" style={{ paddingBottom: "max(0.4rem, env(safe-area-inset-bottom))" }}>
        {TABS.map(({ id, label, Icon, logo }, i) => {
          const on = norm === id;
          return (
            <button
              key={id}
              data-testid={`nav-tab-${id}`}
              onClick={() => onChange(id)}
              aria-pressed={on}
              className="group relative flex flex-col items-center justify-end min-h-[58px] pb-0.5 active:scale-95 transition-transform"
              style={{ ["--rot"]: `${ROT[i]}deg` }}
            >
              {/* PALA: paletta di legno con icona incisa */}
              <span
                className={`relative flex items-center justify-center rounded-[13px] rounded-b-md wood-surface border border-[#2a2a2a] transition-all duration-300 ${
                  on
                    ? "w-11 h-11 -translate-y-1.5 wood-emboss ring-2 ring-[#FFC700] shadow-[0_0_16px_rgba(255,199,0,.55)] overflow-hidden peel-shine"
                    : "w-10 h-10 opacity-90 shadow-[0_3px_6px_rgba(44,30,16,.4)] group-hover:opacity-100 group-hover:-translate-y-0.5"
                }`}
                style={{ transform: `rotate(var(--rot))` }}
              >
                <span aria-hidden className="absolute inset-0 rounded-[13px] rounded-b-md bg-gradient-to-b from-white/15 to-black/25" />
                {logo ? (
                  <span className="relative w-6 h-6 rounded-md overflow-hidden ring-1 ring-[#2a2a2a]">
                    <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Social" className="w-full h-full object-cover" />
                  </span>
                ) : (
                  <Icon
                    className="relative w-[22px] h-[22px] drop-shadow-[0_1px_0_rgba(255,240,210,.4)]"
                    strokeWidth={on ? 2.6 : 2.2}
                    style={{ color: on ? "#FFC700" : "#FF6B00" }}
                  />
                )}
                {id === "community" && unread > 0 && (
                  <span data-testid="nav-community-badge" className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] px-1 rounded-full bg-[#E4572E] text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-[#0d0d0d]">{unread > 9 ? "9+" : unread}</span>
                )}
                <span aria-hidden className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 rounded-b-full wood-surface border-x border-b border-[#2a2a2a] ${on ? "h-2.5" : "h-2"}`} />
              </span>
              <span className={`mt-1.5 text-[10px] font-bold leading-none text-center transition-colors ${on ? "text-[#FFC700]" : "text-[#FF6B00]/90"}`}
                style={{ textShadow: "0 1px 1px rgba(0,0,0,.5)" }}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
