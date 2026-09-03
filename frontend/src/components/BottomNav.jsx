import { BookOpen, Wrench, GraduationCap, Users, Sparkles, BookOpenCheck } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useLang } from "@/i18n/LanguageContext";
import { notificationsApi, communityApi } from "@/lib/api";
import { mkTri } from "@/i18n/triMaps";
import { useProfile } from "@/profile/ProfileContext";

// Navigazione "pale da forno": ogni sezione è una pala di legno con icona incisa.
export default function BottomNav({ active, onChange }) {
  const { t, lang } = useLang();
  const triNav = (i, d, e, s) => mkTri(lang)(i, d, e, s);
  const [unread, setUnread] = useState(0);
  const [socialNew, setSocialNew] = useState(false);
  const loadUnread = useCallback(async () => {
    try { const d = await notificationsApi.list(); setUnread(d.unread || 0); } catch { setUnread(0); }
  }, []);
  const checkSocial = useCallback(async () => {
    try {
      const posts = await communityApi.list("all");
      const latest = (posts || []).reduce((m, p) => (p.created_at && p.created_at > m ? p.created_at : m), "");
      let seen = ""; try { seen = localStorage.getItem("mikilab_social_seen") || ""; } catch { /* */ }
      setSocialNew(!!latest && latest > seen);
    } catch { setSocialNew(false); }
  }, []);
  useEffect(() => {
    loadUnread(); checkSocial();
    const id = setInterval(() => { loadUnread(); checkSocial(); }, 45000);
    const onRefresh = () => { loadUnread(); checkSocial(); };
    window.addEventListener("mikilab-notif-refresh", onRefresh);
    window.addEventListener("mikilab-social-refresh", checkSocial);
    window.addEventListener("focus", onRefresh);
    return () => { clearInterval(id); window.removeEventListener("mikilab-notif-refresh", onRefresh); window.removeEventListener("mikilab-social-refresh", checkSocial); window.removeEventListener("focus", onRefresh); };
  }, [loadUnread, checkSocial]);
  const markSocialSeen = () => { try { localStorage.setItem("mikilab_social_seen", new Date().toISOString()); } catch { /* */ } setSocialNew(false); };

  const norm = ["news", "enciclopedia", "impara"].includes(active) ? "imparacon" : active;
  // 4 sezioni fisse con icone dedicate (immagini su misura).
  const PUB = process.env.PUBLIC_URL;
  const TABS = [
    { id: "ricette", label: triNav("Le Mie Ricette", "Meine Rezepte", "My Recipes", "Mis Recetas"), Icon: BookOpen },
    { id: "imparacon", label: triNav("Scienza & Guide", "Wissen & Guides", "Science & Guides", "Ciencia y Guías"), Icon: GraduationCap },
    { id: "maestro", label: triNav("Modalità Chef", "Chef-Modus", "Chef Mode", "Modo Chef"), Icon: Wrench },
    { id: "community", label: "Community", Icon: Users },
    { id: "guida", label: triNav("Guida Rapida", "Kurzanleitung", "Quick Guide", "Guía Rápida"), Icon: BookOpenCheck },
  ];

  return (
    <nav
      data-testid="bottom-nav"
      className="fixed bottom-0 inset-x-0 z-50 backdrop-blur-2xl bg-[#0E1620]/90 border-t border-white/10 shadow-[0_-6px_22px_rgba(0,0,0,0.55)]"
    >
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#3E9C93]/50 to-transparent" />
      <div className="relative max-w-xl mx-auto grid grid-cols-5 gap-1 px-2 pt-1.5" style={{ paddingBottom: "max(0.4rem, env(safe-area-inset-bottom))" }}>
        {TABS.map(({ id, label, Icon }) => {
          const on = norm === id;
          return (
            <button
              key={id}
              data-testid={`nav-tab-${id}`}
              onClick={() => { if (id === "guida") { onChange("home"); return; } if (id === "community") markSocialSeen(); onChange(id); }}
              aria-pressed={on}
              className="group relative flex flex-col items-center justify-center gap-1 min-h-[60px] py-1.5 active:scale-95 transition-transform"
            >
              <span
                className={`relative flex items-center justify-center w-10 h-10 rounded-2xl transition-all duration-300 ${
                  on
                    ? "bg-[#3E9C93]/18 border border-[#3E9C93]/50 shadow-[0_0_16px_rgba(62,156,147,0.35)] -translate-y-0.5"
                    : "border border-transparent group-hover:bg-white/5"
                }`}
              >
                <Icon className={`w-[22px] h-[22px] transition-colors ${on ? "text-[#3E9C93]" : "text-[#94A3B8] group-hover:text-[#F7F9FC]"}`} strokeWidth={on ? 2.4 : 2} />
                {id === "community" && unread > 0 && (
                  <span data-testid="nav-community-badge" className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] px-1 rounded-full bg-[#E63946] text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-[#0E1620]">{unread > 9 ? "9+" : unread}</span>
                )}
                {id === "community" && socialNew && unread === 0 && (
                  <span data-testid="nav-community-newdot" className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#E63946] ring-2 ring-[#0E1620]" />
                )}
              </span>
              <span className={`text-[9px] font-bold leading-[1.05] text-center break-words line-clamp-2 max-w-[76px] transition-colors ${on ? "text-[#F7F9FC]" : "text-[#64748B] group-hover:text-[#94A3B8]"}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
