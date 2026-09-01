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

  const norm = ["news", "enciclopedia", "impara"].includes(active) ? "imparacon" : active;
  // 4 sezioni fisse con icone dedicate (immagini su misura).
  const PUB = process.env.PUBLIC_URL;
  const TABS = [
    { id: "ricette", label: triNav("Ricette", "Rezepte", "Recipes", "Recetas"), img: "nav-ricette.jpg" },
    { id: "imparacon", label: triNav("Scienza & Guide", "Wissen & Guides", "Science & Guides", "Ciencia y Guías"), img: "nav-imparacon.jpg" },
    { id: "maestro", label: triNav("Laboratorio", "Labor", "Lab", "Laboratorio"), img: "nav-maestro.jpg" },
    { id: "community", label: "Community", img: "nav-community.jpg" },
  ];
  const ROT = [-4.5, -1.5, 1.5, 4.5]; // leggera rotazione a ventaglio delle pale

  return (
    <nav
      data-testid="bottom-nav"
      className="fixed bottom-0 inset-x-0 z-50 wood-surface border-t-4 border-[#3e2510] shadow-[0_-6px_22px_rgba(20,10,2,0.55)]"
    >
      <div aria-hidden className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-b from-[#e7c79a]/70 to-transparent" />
      <div aria-hidden className="absolute inset-0 bg-[#2b190c]/25" />
      <div className="relative max-w-xl mx-auto grid grid-cols-4 gap-1 px-2 pt-2" style={{ paddingBottom: "max(0.4rem, env(safe-area-inset-bottom))" }}>
        {TABS.map(({ id, label, img }, i) => {
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
                {img ? (
                  <img src={`${PUB}/${img}`} alt={label}
                    className="relative w-8 h-8 object-contain drop-shadow-[0_1px_0_rgba(255,240,210,.4)]"
                    style={{ mixBlendMode: "multiply", opacity: on ? 1 : 0.82 }} />
                ) : null}
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
