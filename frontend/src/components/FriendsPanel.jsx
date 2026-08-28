import { useEffect, useState, useCallback } from "react";
import { X, UserPlus, Check, Clock, Users2, Search, UserMinus, Loader2, Send } from "lucide-react";
import { friendsApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { useAuth } from "@/auth/AuthContext";
import { toast } from "sonner";

const Avatar = ({ c }) => (
  <div className="w-10 h-10 rounded-xl bg-[#3f7cac]/15 flex items-center justify-center overflow-hidden shrink-0">
    {c.picture ? <img src={c.picture} alt={c.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
      : <span className="font-bold text-[#3f7cac]">{(c.name || "?").slice(0, 1).toUpperCase()}</span>}
  </div>
);

export default function FriendsPanel({ open, onClose, onCount, onMessage }) {
  const { lang } = useLang();
  const { user } = useAuth();
  const tri = (i, d, e) => (lang === "de" ? d : (lang === "en" || lang === "es") ? e : i);
  const [tab, setTab] = useState("richieste");
  const [dir, setDir] = useState([]);
  const [rel, setRel] = useState({ friends: [], incoming: [], outgoing: [] });
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [d, r] = await Promise.all([friendsApi.directory(), friendsApi.list()]);
      setDir(Array.isArray(d) ? d : []);
      setRel(r || { friends: [], incoming: [], outgoing: [] });
      onCount && onCount((r?.incoming || []).length);
    } catch { /* not logged in */ }
    finally { setLoading(false); }
  }, [onCount]);

  useEffect(() => { if (open && user) refresh(); }, [open, user, refresh]);
  useEffect(() => {
    if (!open || !user) return undefined;
    const id = setInterval(refresh, 15000);
    return () => clearInterval(id);
  }, [open, user, refresh]);

  if (!open) return null;

  const act = async (fn, okMsg) => { try { await fn(); await refresh(); if (okMsg) toast.success(okMsg); } catch { toast.error(tri("Operazione non riuscita", "Fehlgeschlagen", "Action failed")); } };
  const filtered = dir.filter((c) => {
    const s = q.trim().toLowerCase();
    if (!s) return true;
    return (c.name || "").toLowerCase().includes(s) || (c.email || "").toLowerCase().includes(s);
  });

  const TABS = [
    { id: "richieste", label: tri("Richieste", "Anfragen", "Requests"), n: rel.incoming.length },
    { id: "amici", label: tri("Amici", "Freunde", "Friends"), n: rel.friends.length },
    { id: "trova", label: tri("Trova", "Finden", "Find") },
  ];

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center" data-testid="friends-panel">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-white dark:bg-[#1B2127] rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-[#d5e4f0] dark:border-[#38424B]">
          <h3 className="font-display text-lg font-bold text-[#2B303B] dark:text-[#EAF0EC] flex items-center gap-2"><Users2 className="w-5 h-5 text-[#3f7cac]" />{tri("Amici", "Freunde", "Friends")}</h3>
          <button data-testid="friends-close" onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center text-[#7E8A93]"><X className="w-5 h-5" /></button>
        </div>

        {!user ? (
          <div className="p-6 text-center text-sm text-[#7E8A93]">{tri("Accedi per aggiungere amici e vedere le richieste.", "Melde dich an, um Freunde hinzuzufügen.", "Sign in to add friends and see requests.")}</div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-1.5 p-3">
              {TABS.map((t) => (
                <button key={t.id} data-testid={`friends-tab-${t.id}`} onClick={() => setTab(t.id)}
                  className={`py-2 rounded-xl text-xs font-semibold transition-all ${tab === t.id ? "bg-[#3f7cac] text-white" : "bg-[#e4eff8] dark:bg-[#232A31] text-[#7E8A93]"}`}>
                  {t.label}{t.n ? ` (${t.n})` : ""}
                </button>
              ))}
            </div>

            <div className="px-4 pb-4 overflow-y-auto flex-1 space-y-2">
              {loading && <div className="flex items-center gap-2 text-[#7E8A93] text-sm py-3"><Loader2 className="w-4 h-4 animate-spin" />{tri("Carico…", "Lädt…", "Loading…")}</div>}

              {tab === "richieste" && !loading && (rel.incoming.length === 0
                ? <Empty text={tri("Nessuna richiesta in arrivo.", "Keine Anfragen.", "No incoming requests.")} />
                : rel.incoming.map((c) => (
                  <Row key={c.user_id} c={c} testid={`friend-incoming-${c.user_id}`}>
                    <button data-testid={`friend-accept-${c.user_id}`} onClick={() => act(() => friendsApi.respond(c.user_id, "accept"), tri("Ora siete amici!", "Ihr seid jetzt Freunde!", "You are now friends!"))}
                      className="px-3 py-1.5 rounded-lg bg-[#3f7cac] text-white text-xs font-bold flex items-center gap-1"><Check className="w-3.5 h-3.5" />{tri("Accetta", "Annehmen", "Accept")}</button>
                    <button data-testid={`friend-decline-${c.user_id}`} onClick={() => act(() => friendsApi.respond(c.user_id, "decline"))}
                      className="px-3 py-1.5 rounded-lg bg-[#e4eff8] dark:bg-[#2A323A] text-[#7E8A93] text-xs font-semibold">{tri("Rifiuta", "Ablehnen", "Decline")}</button>
                  </Row>
                )))}

              {tab === "amici" && !loading && (rel.friends.length === 0
                ? <Empty text={tri("Ancora nessun amico. Vai su 'Trova'!", "Noch keine Freunde. Geh zu 'Finden'!", "No friends yet. Go to 'Find'!")} />
                : rel.friends.map((c) => (
                  <Row key={c.user_id} c={c} testid={`friend-item-${c.user_id}`}>
                    {onMessage && (
                      <button data-testid={`friend-message-${c.user_id}`} onClick={() => onMessage({ user_id: c.user_id, name: c.name, picture: c.picture })}
                        className="px-3 py-1.5 rounded-lg bg-[#3f7cac] text-white text-xs font-bold flex items-center gap-1"><Send className="w-3.5 h-3.5" />{tri("Scrivi", "Schreiben", "Message")}</button>
                    )}
                    <button data-testid={`friend-remove-${c.user_id}`} onClick={() => act(() => friendsApi.remove(c.user_id))}
                      className="px-3 py-1.5 rounded-lg bg-[#e4eff8] dark:bg-[#2A323A] text-[#C0574D] text-xs font-semibold flex items-center gap-1"><UserMinus className="w-3.5 h-3.5" />{tri("Rimuovi", "Entfernen", "Remove")}</button>
                  </Row>
                )))}

              {tab === "trova" && !loading && (
                <>
                  <div className="flex items-center gap-2 bg-[#e4eff8] dark:bg-[#232A31] rounded-xl px-3 py-2 mb-1">
                    <Search className="w-4 h-4 text-[#7E8A93]" />
                    <input data-testid="friends-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={tri("Cerca per nome o email…", "Nach Name oder E-Mail suchen…", "Search by name or email…")}
                      className="bg-transparent flex-1 text-sm outline-none text-[#2B303B] dark:text-[#EAF0EC]" />
                  </div>
                  {filtered.length === 0 ? <Empty text={tri("Nessun utente trovato.", "Keine Nutzer.", "No users found.")} />
                    : filtered.map((c) => (
                      <Row key={c.user_id} c={c} testid={`friend-dir-${c.user_id}`} sub={c.email}>
                        {c.status === "friends" && <span className="text-xs font-semibold text-[#3f7cac] flex items-center gap-1"><Check className="w-3.5 h-3.5" />{tri("Amici", "Freunde", "Friends")}</span>}
                        {c.status === "outgoing" && <span className="text-xs font-semibold text-[#7E8A93] flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{tri("In attesa", "Ausstehend", "Pending")}</span>}
                        {c.status === "incoming" && <button data-testid={`friend-accept2-${c.user_id}`} onClick={() => act(() => friendsApi.respond(c.user_id, "accept"), tri("Ora siete amici!", "Freunde!", "Now friends!"))}
                          className="px-3 py-1.5 rounded-lg bg-[#3f7cac] text-white text-xs font-bold">{tri("Accetta", "Annehmen", "Accept")}</button>}
                        {c.status === "none" && <button data-testid={`friend-add-${c.user_id}`} onClick={() => act(() => friendsApi.request(c.user_id), tri("Richiesta inviata!", "Anfrage gesendet!", "Request sent!"))}
                          className="px-3 py-1.5 rounded-lg bg-[#3f7cac] text-white text-xs font-bold flex items-center gap-1"><UserPlus className="w-3.5 h-3.5" />{tri("Aggiungi", "Hinzufügen", "Add")}</button>}
                      </Row>
                    ))}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Row({ c, children, testid, sub }) {
  return (
    <div data-testid={testid} className="flex items-center gap-3 rounded-xl bg-white dark:bg-[#232A31] border border-[#d5e4f0] dark:border-[#38424B] p-2.5">
      <Avatar c={c} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#2B303B] dark:text-[#EAF0EC] truncate">{c.name}</p>
        {sub ? <p className="text-[11px] text-[#7E8A93] truncate">{sub}</p> : null}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">{children}</div>
    </div>
  );
}

function Empty({ text }) {
  return <div className="rounded-xl bg-[#e4eff8] dark:bg-[#2A323A] border border-dashed border-[#d5e4f0] dark:border-[#38424B] p-4 text-sm text-[#7E8A93]">{text}</div>;
}
