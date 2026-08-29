import { useState, useEffect, useCallback, useRef } from "react";
import { Bell, Heart, MessageCircle, UserPlus, Flame, Mail } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { useAuth } from "@/auth/AuthContext";
import { notificationsApi } from "@/lib/api";
import { mkTri } from "@/i18n/triMaps";

// Campanella notifiche Community (like/commenti sui propri post).
export default function NotificationBell() {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const loc = mkTri(lang)("it-IT", "de-DE", "en-GB");
  const { user } = useAuth();

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const panelRef = useRef(null);

  const load = useCallback(async () => {
    if (!user) { setItems([]); setUnread(0); return; }
    const d = await notificationsApi.list();
    setItems(d.items || []); setUnread(d.unread || 0);
  }, [user]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!user) return;
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, [user, load]);

  // chiudi al click fuori
  useEffect(() => {
    const onClick = (e) => { if (open && panelRef.current && !panelRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  if (!user) return null;

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      setUnread(0);
      setItems((p) => p.map((n) => ({ ...n, read: true })));
      window.dispatchEvent(new CustomEvent("mikilab-notif-refresh"));
      try { await notificationsApi.markRead(); } catch { load(); }
    }
  };

  const ago = (isoStr) => {
    try {
      const diff = (Date.now() - new Date(isoStr).getTime()) / 1000;
      const rtf = new Intl.RelativeTimeFormat(loc, { numeric: "auto" });
      if (diff < 60) return rtf.format(-Math.round(diff), "second");
      if (diff < 3600) return rtf.format(-Math.round(diff / 60), "minute");
      if (diff < 86400) return rtf.format(-Math.round(diff / 3600), "hour");
      return rtf.format(-Math.round(diff / 86400), "day");
    } catch { return ""; }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button data-testid="notif-bell" onClick={toggle}
        className="relative w-10 h-10 rounded-xl bg-[#e4eff8] dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] flex items-center justify-center text-[#ff6b00] active:scale-95 transition-all"
        aria-label={tri("Notifiche", "Benachrichtigungen", "Notifications")}>
        <Bell className="w-4.5 h-4.5" />
        {unread > 0 && (
          <span data-testid="notif-badge" className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#E4572E] text-white text-[10px] font-bold flex items-center justify-center">{unread > 9 ? "9+" : unread}</span>
        )}
      </button>

      {open && (
        <div data-testid="notif-panel" className="absolute right-0 mt-2 w-80 max-w-[90vw] max-h-[70vh] overflow-auto rounded-2xl bg-white dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] shadow-2xl z-50">
          <div className="px-4 py-3 border-b border-[#e4eff8] dark:border-[#2e2e2e] sticky top-0 bg-white dark:bg-[#1e1e1e]">
            <p className="font-display text-base font-bold text-[#2B303B] dark:text-[#e4eff8]">{tri("Notifiche", "Benachrichtigungen", "Notifications")}</p>
          </div>
          {items.length === 0 ? (
            <p data-testid="notif-empty" className="text-center text-sm text-[#7E8A93] py-8 px-4">{tri("Nessuna notifica per ora. Pubblica nella Community!", "Noch keine. Poste in der Community!", "Nothing yet. Post in the Community!")}</p>
          ) : (
            <div>
              {items.map((n) => (
                <div key={n.id} data-testid={`notif-item-${n.id}`} className={`flex items-start gap-3 px-4 py-3 border-b border-[#e4eff8] dark:border-[#2e2e2e] last:border-0 ${!n.read ? "bg-[#ff6b00]/5" : ""}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${n.type === "like" ? "bg-[#E4572E]/15 text-[#E4572E]" : n.type === "email_import" ? "bg-[#ff6b00]/15 text-[#ff6b00]" : (n.type === "bakealong" || n.type === "bakealong_win") ? "bg-[#ff6b00]/15 text-[#ff6b00]" : n.type && n.type.startsWith("friend") ? "bg-[#2e8b6f]/15 text-[#2e8b6f]" : "bg-[#ff6b00]/15 text-[#ff6b00]"}`}>
                    {n.type === "like" ? <Heart className="w-4 h-4" /> : n.type === "email_import" ? <Mail className="w-4 h-4" /> : (n.type === "bakealong" || n.type === "bakealong_win") ? <Flame className="w-4 h-4" /> : n.type && n.type.startsWith("friend") ? <UserPlus className="w-4 h-4" /> : <MessageCircle className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-[#2B303B] dark:text-[#e4eff8] leading-snug">
                      <b>{n.actor_name}</b> {n.type === "like"
                        ? tri("ha messo mi piace al tuo post", "gefällt dein Beitrag", "liked your post")
                        : n.type === "email_import"
                        ? tri("🥖 nuove ricette importate via email!", "🥖 neue Rezepte per E-Mail importiert!", "🥖 new recipes imported by email!")
                        : n.type === "bakealong_win"
                        ? tri("🏆 hai vinto la sfida Bake-Along!", "🏆 du hast die Bake-Along-Challenge gewonnen!", "🏆 you won the Bake-Along challenge!")
                        : n.type === "bakealong"
                        ? tri("nuova sfida Bake-Along della settimana!", "neue Bake-Along-Challenge der Woche!", "new weekly Bake-Along challenge!")
                        : n.type === "friend_request"
                          ? tri("ti ha inviato una richiesta di amicizia", "hat dir eine Freundschaftsanfrage gesendet", "sent you a friend request")
                          : n.type === "friend_accept"
                            ? tri("ha accettato la tua richiesta di amicizia", "hat deine Freundschaftsanfrage angenommen", "accepted your friend request")
                            : tri("ha commentato il tuo post", "hat deinen Beitrag kommentiert", "commented on your post")}
                    </p>
                    {n.snippet && <p className="text-xs text-[#7E8A93] truncate">“{n.snippet}”</p>}
                    <p className="text-[11px] text-[#7E8A93] mt-0.5">{ago(n.created_at)}</p>
                  </div>
                  {!n.read && <span className="w-2 h-2 rounded-full bg-[#E4572E] shrink-0 mt-1.5" />}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
