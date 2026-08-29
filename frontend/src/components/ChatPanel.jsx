import { useEffect, useRef, useState, useCallback } from "react";
import { X, Send, ArrowLeft, Loader2, MessageSquare, Search, ImagePlus, Smile } from "lucide-react";
import { dmApi, friendsApi, uploadApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { useAuth } from "@/auth/AuthContext";
import { toast } from "sonner";
import { mkTri } from "@/i18n/triMaps";

function timeShort(iso, lang) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString(lang === "en" ? "en-GB" : lang === "de" ? "de-DE" : "it-IT", { hour: "2-digit", minute: "2-digit" });
  } catch { return ""; }
}

const AvatarImg = ({ pic, name, size = "w-10 h-10" }) => (
  <div className={`${size} rounded-full overflow-hidden bg-[#1e1e1e] flex items-center justify-center text-white font-bold shrink-0`}>
    {pic ? <img src={pic} alt={name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} /> : (name || "F")[0].toUpperCase()}
  </div>
);

// Pannello messaggi: elenco conversazioni + chat 1-a-1 tra amici.
// Se `initialUser` è passato ({user_id, name, picture}) apre direttamente quella chat.
export default function ChatPanel({ open, onClose, initialUser = null }) {
  const { lang } = useLang();
  const tri = (i, d, e, s) => mkTri(lang)(i, d, e, s);
  const { user } = useAuth();

  const [active, setActive] = useState(null); // {user_id, name, picture}
  const [convos, setConvos] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [msgs, setMsgs] = useState([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const [friends, setFriends] = useState([]);
  const [showNew, setShowNew] = useState(false);
  const [q, setQ] = useState("");
  const endRef = useRef(null);
  const pollRef = useRef(null);
  const [reactFor, setReactFor] = useState(null); // id messaggio con picker aperto
  const REACTIONS = ["👍", "🔥", "🥖"];

  const react = async (msgId, emoji) => {
    setReactFor(null);
    if (!msgId || String(msgId).startsWith("tmp-")) return;
    const res = await dmApi.react(msgId, emoji);
    if (res) setMsgs((p) => p.map((m) => (m.id === msgId ? { ...m, reactions: res.reactions } : m)));
  };

  const reactionSummary = (rs) => {
    const counts = {};
    (rs || []).forEach((r) => { counts[r.emoji] = (counts[r.emoji] || 0) + 1; });
    return Object.entries(counts);
  };

  const loadConvos = useCallback(async () => {
    setLoadingList(true);
    try { setConvos(await dmApi.conversations()); } catch { /* */ }
    finally { setLoadingList(false); }
  }, []);

  const loadThread = useCallback(async (oid, silent = false) => {
    if (!silent) setLoadingThread(true);
    try { const d = await dmApi.thread(oid); setMsgs(d.messages || []); }
    catch { /* */ }
    finally { if (!silent) setLoadingThread(false); }
  }, []);

  // Apertura pannello
  useEffect(() => {
    if (!open) return;
    if (initialUser) setActive(initialUser);
    else { setActive(null); loadConvos(); }
  }, [open, initialUser, loadConvos]);

  // Caricamento thread + polling quando una chat è attiva
  useEffect(() => {
    if (!open || !active) { if (pollRef.current) clearInterval(pollRef.current); return; }
    loadThread(active.user_id);
    pollRef.current = setInterval(() => loadThread(active.user_id, true), 5000);
    window.dispatchEvent(new Event("mikilab-notif-refresh"));
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [open, active, loadThread]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const openNew = async () => {
    setShowNew(true);
    try { const r = await friendsApi.list(); setFriends(r?.friends || []); } catch { setFriends([]); }
  };

  const send = async () => {
    const t = text.trim();
    if (!t || !active) return;
    setSending(true);
    const optimistic = { id: `tmp-${Date.now()}`, from_id: user?.user_id, to_id: active.user_id, text: t, created_at: new Date().toISOString() };
    setMsgs((p) => [...p, optimistic]);
    setText("");
    try { await dmApi.send(active.user_id, t); await loadThread(active.user_id, true); }
    catch { toast.error(tri("Invio non riuscito", "Senden fehlgeschlagen", "Send failed", "Envío fallido")); setMsgs((p) => p.filter((m) => m.id !== optimistic.id)); }
    finally { setSending(false); }
  };

  const sendPhoto = async (file) => {
    if (!file || !active) return;
    setUploading(true);
    try {
      const url = await uploadApi.image(file, `chat-${Date.now()}.jpg`);
      const optimistic = { id: `tmp-${Date.now()}`, from_id: user?.user_id, to_id: active.user_id, text: "", image_url: url, created_at: new Date().toISOString() };
      setMsgs((p) => [...p, optimistic]);
      await dmApi.send(active.user_id, "", url);
      await loadThread(active.user_id, true);
    } catch { toast.error(tri("Foto non inviata", "Foto nicht gesendet", "Photo not sent", "Foto no enviada")); }
    finally { setUploading(false); }
  };

  if (!open) return null;

  const filteredFriends = friends.filter((f) => (f.name || "").toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="fixed inset-0 z-[75] flex items-end sm:items-center justify-center" data-testid="chat-panel">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-white dark:bg-[#121212] rounded-t-3xl sm:rounded-3xl shadow-2xl h-[85vh] sm:h-[75vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 text-white shrink-0" style={{ background: "linear-gradient(135deg,#0f2231,#1e1e1e 50%,#1f5a68)" }}>
          {active ? (
            <>
              <button data-testid="chat-back" onClick={() => { setActive(null); loadConvos(); }} className="p-1 -ml-1 active:scale-90"><ArrowLeft className="w-5 h-5" /></button>
              <AvatarImg pic={active.picture} name={active.name} size="w-9 h-9" />
              <p className="font-display text-lg font-bold truncate flex-1">{active.name}</p>
            </>
          ) : (
            <>
              <MessageSquare className="w-5 h-5" />
              <p className="font-display text-lg font-bold flex-1">{tri("Messaggi", "Nachrichten", "Messages", "Mensajes")}</p>
            </>
          )}
          <button data-testid="chat-close" onClick={onClose} className="p-1 active:scale-90"><X className="w-5 h-5" /></button>
        </div>

        {!user ? (
          <div className="p-6 text-center text-sm text-[#7E8A93] flex-1 flex items-center justify-center">{tri("Accedi per messaggiare con i colleghi.", "Melde dich an, um zu chatten.", "Sign in to message colleagues.", "Inicia sesión para chatear.")}</div>
        ) : active ? (
          /* ---- Thread 1-a-1 ---- */
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#121212] dark:bg-[#161b20]" data-testid="chat-thread">
              {loadingThread ? (
                <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-[#ff6b00]" /></div>
              ) : msgs.length === 0 ? (
                <p className="text-center text-sm text-[#7E8A93] py-10">{tri("Nessun messaggio. Scrivi tu per primo! 👋", "Noch keine Nachrichten. Schreib zuerst! 👋", "No messages yet. Say hi first! 👋", "Sin mensajes. ¡Saluda primero! 👋")}</p>
              ) : (
                msgs.map((m) => {
                  const mine = m.from_id === user.user_id;
                  const summary = reactionSummary(m.reactions);
                  return (
                    <div key={m.id} data-testid={`chat-msg-${m.id}`} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
                      <div className={`group relative flex items-end gap-1 max-w-[85%] ${mine ? "flex-row-reverse" : ""}`}>
                        <div className={`rounded-2xl px-3.5 py-2 ${mine ? "bg-[#ff6b00] text-white rounded-br-sm" : "bg-white dark:bg-[#1e1e1e] text-[#2B303B] dark:text-[#e4eff8] rounded-bl-sm border border-[#2e2e2e] dark:border-[#2e2e2e]"}`}>
                          {m.image_url && <img src={m.image_url} alt="" data-testid="chat-msg-image" className="rounded-xl mb-1 max-h-56 w-full object-cover" />}
                          {m.text && <p className="text-sm whitespace-pre-line leading-snug break-words">{m.text}</p>}
                          <p className={`text-[10px] mt-0.5 text-right ${mine ? "text-white/70" : "text-[#7E8A93]"}`}>{timeShort(m.created_at, lang)}</p>
                        </div>
                        {!String(m.id).startsWith("tmp-") && (
                          <button data-testid={`chat-react-btn-${m.id}`} onClick={() => setReactFor(reactFor === m.id ? null : m.id)}
                            className="opacity-60 hover:opacity-100 text-[#7E8A93] shrink-0 p-1"><Smile className="w-4 h-4" /></button>
                        )}
                        {reactFor === m.id && (
                          <div data-testid={`chat-react-picker-${m.id}`} className={`absolute -top-9 ${mine ? "right-8" : "left-8"} z-10 flex items-center gap-1 bg-white dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] rounded-full px-2 py-1 shadow-lg`}>
                            {REACTIONS.map((e) => (
                              <button key={e} data-testid={`chat-react-${m.id}-${e}`} onClick={() => react(m.id, e)} className="text-lg leading-none hover:scale-125 transition-transform">{e}</button>
                            ))}
                          </div>
                        )}
                      </div>
                      {summary.length > 0 && (
                        <div data-testid={`chat-reactions-${m.id}`} className={`flex gap-1 mt-0.5 ${mine ? "pr-1" : "pl-1"}`}>
                          {summary.map(([e, n]) => (
                            <button key={e} onClick={() => react(m.id, e)} className="inline-flex items-center gap-0.5 text-[11px] bg-white dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] rounded-full px-1.5 py-0.5">
                              <span>{e}</span>{n > 1 && <span className="font-bold text-[#7E8A93]">{n}</span>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              <div ref={endRef} />
            </div>
            <div className="p-3 border-t border-[#2e2e2e] dark:border-[#2e2e2e] flex items-center gap-2 shrink-0">
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) sendPhoto(f); e.target.value = ""; }} />
              <button data-testid="chat-photo" onClick={() => fileRef.current?.click()} disabled={uploading} className="w-10 h-10 rounded-full bg-[#e4eff8] dark:bg-[#1e1e1e] text-[#ff6b00] flex items-center justify-center active:scale-90 disabled:opacity-50 shrink-0">
                {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImagePlus className="w-5 h-5" />}
              </button>
              <input data-testid="chat-input" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
                placeholder={tri("Scrivi un messaggio…", "Nachricht schreiben…", "Type a message…", "Escribe un mensaje…")}
                className="flex-1 bg-[#121212] dark:bg-[#181818] border border-[#2e2e2e] dark:border-[#2e2e2e] rounded-full px-4 py-2.5 outline-none text-sm text-[#2B303B] dark:text-[#e4eff8] focus:border-[#ff6b00]" />
              <button data-testid="chat-send" data-sfx="confirm" onClick={send} disabled={sending || !text.trim()} className="w-11 h-11 rounded-full bg-[#ff6b00] text-white flex items-center justify-center active:scale-90 disabled:opacity-50 shrink-0">
                {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
          </>
        ) : showNew ? (
          /* ---- Nuova chat: scegli un amico ---- */
          <div className="flex-1 overflow-y-auto p-4 space-y-2" data-testid="chat-new">
            <button data-testid="chat-new-back" onClick={() => setShowNew(false)} className="flex items-center gap-1.5 text-sm font-semibold text-[#ff6b00] mb-1"><ArrowLeft className="w-4 h-4" />{tri("Indietro", "Zurück", "Back", "Atrás")}</button>
            <div className="flex items-center gap-2 bg-[#e4eff8] dark:bg-[#1e1e1e] rounded-xl px-3 py-2">
              <Search className="w-4 h-4 text-[#7E8A93]" />
              <input data-testid="chat-friend-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={tri("Cerca un amico…", "Freund suchen…", "Search a friend…", "Buscar amigo…")} className="bg-transparent flex-1 text-sm outline-none text-[#2B303B] dark:text-[#e4eff8]" />
            </div>
            {filteredFriends.length === 0 ? (
              <p className="text-center text-sm text-[#7E8A93] py-8">{tri("Nessun amico ancora. Aggiungi colleghi da «Amici & Colleghi».", "Noch keine Freunde. Füge Kollegen hinzu.", "No friends yet. Add colleagues from «Friends».", "Sin amigos aún.")}</p>
            ) : filteredFriends.map((f) => (
              <button key={f.user_id} data-testid={`chat-friend-${f.user_id}`} onClick={() => { setShowNew(false); setActive({ user_id: f.user_id, name: f.name, picture: f.picture }); }}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-white dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] active:scale-98 transition-all">
                <AvatarImg pic={f.picture} name={f.name} />
                <span className="text-sm font-semibold text-[#2B303B] dark:text-[#e4eff8] truncate">{f.name}</span>
              </button>
            ))}
          </div>
        ) : (
          /* ---- Elenco conversazioni ---- */
          <>
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5" data-testid="chat-convos">
              {loadingList ? (
                <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-[#ff6b00]" /></div>
              ) : convos.length === 0 ? (
                <p className="text-center text-sm text-[#7E8A93] py-10">{tri("Ancora nessuna conversazione. Inizia a scrivere a un amico!", "Noch keine Unterhaltungen. Schreib einem Freund!", "No conversations yet. Message a friend!", "Sin conversaciones aún.")}</p>
              ) : convos.map((c) => (
                <button key={c.other_id} data-testid={`chat-convo-${c.other_id}`} onClick={() => setActive({ user_id: c.other_id, name: c.name, picture: c.picture })}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#121212] dark:hover:bg-[#1e1e1e] active:scale-98 transition-all text-left">
                  <AvatarImg pic={c.picture} name={c.name} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#2B303B] dark:text-[#e4eff8] truncate">{c.name}</p>
                    <p className="text-[12px] text-[#7E8A93] truncate">{c.last || "📷"}</p>
                  </div>
                  {c.unread > 0 && <span data-testid={`chat-unread-${c.other_id}`} className="min-w-[20px] h-5 px-1.5 rounded-full bg-[#ff6b00] text-white text-[11px] font-bold flex items-center justify-center shrink-0">{c.unread}</span>}
                </button>
              ))}
            </div>
            <div className="p-3 border-t border-[#2e2e2e] dark:border-[#2e2e2e] shrink-0">
              <button data-testid="chat-new-btn" onClick={openNew} className="w-full flex items-center justify-center gap-2 bg-[#ff6b00] hover:bg-[#ff8a33] text-white font-semibold py-3 rounded-xl active:scale-98 transition-all">
                <Send className="w-4 h-4" /> {tri("Nuovo messaggio", "Neue Nachricht", "New message", "Nuevo mensaje")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
