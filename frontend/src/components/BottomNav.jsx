import { BookOpen, Wrench, GraduationCap, Users, Sparkles } from "lucide-react";
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

  const norm = ["news", "enciclopedia"].includes(active) ? "impara" : active;
  // 5 sezioni fisse (nessun profilo): Ricette · ImparaDaCasa · ImparaConMikiLab · LavoraConMikiLab · ViviMikiLab.
  const TABS = [
    { id: "ricette", label: triNav("Ricette", "Rezepte", "Recipes", "Recetas"), Icon: BookOpen },
    { id: "impara", label: "ImparaDaCasa", Icon: GraduationCap },
    { id: "imparacon", label: "ImparaConMikiLab", Icon: Sparkles },
    { id: "maestro", label: "LavoraConMikiLab", Icon: Wrench },
    { id: "community", label: "ViviMikiLab", Icon: Users, logo: true },
  ];
  const ROT = [-6, -3, 0, 3, 6]; // leggera rotazione a ventaglio delle pale

  return (
    <nav
      data-testid="bottom-nav"
      className="fixed bottom-0 inset-x-0 z-50 wood-surface border-t-4 border-[#3e2510] shadow-[0_-6px_22px_rgba(20,10,2,0.55)]"
    >
      <div aria-hidden className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-b from-[#e7c79a]/70 to-transparent" />
      <div aria-hidden className="absolute inset-0 bg-[#2b190c]/25" />
      <div className="relative max-w-xl mx-auto grid grid-cols-5 gap-1 px-2 pt-2" style={{ paddingBottom: "max(0.4rem, env(safe-area-inset-bottom))" }}>
        {TABS.map(({ id, label, Icon, logo }, i) => {
          const on = norm === id;
          return (
            <button
              key={id}
              data-testid={`nav-tab-${id}`}
              onClick={() => { if (id === "community") markSocialSeen(); onChange(id); }}
              aria-pressed={on}
              className="group relative flex flex-col items-center justify-end min-h-[82px] pb-0.5 active:scale-95 transition-transform"
              style={{ ["--rot"]: `${ROT[i]}deg` }}
            >
              {/* PALA da forno in legno: lama tonda in alto + manico lungo ben visibile */}
              <span
                className={`relative flex items-center justify-center wood-surface border border-[#3e2510] rounded-t-full rounded-b-[7px] transition-all duration-300 ${
                  on
                    ? "w-11 h-11 -translate-y-1 wood-emboss ring-2 ring-[#ffcf7a] shadow-[0_0_16px_rgba(255,180,80,.55)] overflow-hidden peel-shine"
                    : "w-10 h-10 opacity-90 shadow-[0_3px_6px_rgba(30,15,4,.5)] group-hover:opacity-100 group-hover:-translate-y-0.5"
                }`}
                style={{ transform: `rotate(var(--rot))` }}
              >
                <span aria-hidden className="absolute inset-0 rounded-t-full rounded-b-[7px] bg-gradient-to-b from-white/15 to-black/25" />
                {logo ? (
                  <span className="relative w-6 h-6 rounded-md overflow-hidden ring-1 ring-[#3e2510]">
                    <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Social" className="w-full h-full object-cover" />
                  </span>
                ) : (
                  <Icon
                    className="relative w-[22px] h-[22px] drop-shadow-[0_1px_0_rgba(255,240,210,.4)]"
                    strokeWidth={on ? 2.6 : 2.2}
                    style={{ color: on ? "#2e1608" : "#4a2b12" }}
                  />
                )}
                {id === "community" && unread > 0 && (
                  <span data-testid="nav-community-badge" className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] px-1 rounded-full bg-[#E4572E] text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-[#2b190c]">{unread > 9 ? "9+" : unread}</span>
                )}
                {id === "community" && socialNew && unread === 0 && (
                  <span data-testid="nav-community-newdot" className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#E4572E] ring-2 ring-[#2b190c]" />
                )}
                {/* manico della pala: lungo e spesso come una vera pala del fornaio */}
                <span aria-hidden className={`absolute left-1/2 -translate-x-1/2 top-full w-[9px] rounded-b-full wood-surface border-x border-b border-[#3e2510] shadow-[0_2px_4px_rgba(30,15,4,.5)] ${on ? "h-[26px]" : "h-[21px]"}`}>
                  <span className="absolute inset-y-1.5 left-1/2 -translate-x-1/2 w-px bg-[#3e2510]/50" />
                </span>
              </span>
              <span className={`mt-[28px] text-[9px] font-bold leading-[1.05] text-center break-all line-clamp-2 max-w-[72px] transition-colors ${on ? "text-[#ffe6bf]" : "text-[#e7c79a]/85"}`}
                style={{ textShadow: "0 1px 1px rgba(0,0,0,.6)" }}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
