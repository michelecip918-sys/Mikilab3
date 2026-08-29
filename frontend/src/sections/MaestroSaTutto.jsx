import { useRef, useState, useEffect } from "react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { Sparkles, Send, MessageCircle, BookOpen, Youtube, MapPin, Newspaper, Plus, Pencil, Trash2 } from "lucide-react";
import { API, announcementsApi } from "@/lib/api";
import { content } from "@/data/content";
import { useLang } from "@/i18n/LanguageContext";
import { registerChat } from "@/lib/chatHistory";
import { getActiveMachineNames } from "@/lib/machines";
import TalkingAvatar from "@/components/TalkingAvatar";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function MaestroSaTutto() {
  const { t, lang } = useLang();
  const chatIntro = lang === "de"
    ? "Hallo! Ich bin Michele. Frag mich alles rund ums Brot: Rezepte, Teige, Gärung, Backen, Fehler und Kniffe. Ich helfe dir Schritt für Schritt."
    : lang === "en"
    ? "Hi! I'm Michele. Ask me anything about bread: recipes, doughs, fermentation, baking, defects and tricks of the trade. I'll help you step by step."
    : "Ciao! Sono Michele. Chiedimi qualsiasi cosa sul pane: ricette, impasti, lievitazione, cotture, difetti e trucchi del mestiere. Ti aiuto passo dopo passo.";

  return (
    <div className="pb-4">
      <div className="relative rounded-3xl overflow-hidden mb-4 bg-gradient-to-br from-[#ff6b00] to-[#ff6b00] p-6 text-white">
        <Sparkles className="w-7 h-7 mb-2" />
        <h1 className="font-display text-2xl font-bold">{t("satutto_title")}</h1>
        <p className="text-white/85 text-sm mt-1 italic">{t("satutto_tagline")}</p>
      </div>

      {/* Avatar parlante di Michele (frase dedicata alla chat, tradotta IT/DE/EN) */}
      <div data-testid="satutto-avatar-card" className="mb-4">
        <TalkingAvatar testid="maestro-talking-avatar" className="w-full h-56" transcript={chatIntro} />
      </div>

      <div data-testid="satutto-intro-card" className="mb-4 rounded-2xl bg-white dark:bg-[#1e1e1e] border border-[#2b2b2b] dark:border-[#2e2e2e] p-4">
        <div className="flex items-center gap-2 mb-1.5">
          <MessageCircle className="w-4 h-4 text-[#ff6b00]" />
          <h2 className="font-display text-base font-semibold text-[#2B303B] dark:text-[#e4eff8]">{t("satutto_intro_title")}</h2>
        </div>
        <p className="text-sm text-[#3F4A54] dark:text-[#AEB8BF] leading-relaxed whitespace-pre-line">{t("satutto_intro_body")}</p>
      </div>

      <ChatPanel />
    </div>
  );
}

function ChatPanel() {
  const { t, lang } = useLang();
  const promptSuggestions = content[lang].promptSuggestions;
  const [sessionId] = useState(() => {
    let s = localStorage.getItem("mikilab_maestro_sid");
    if (!s) { s = `sess-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; localStorage.setItem("mikilab_maestro_sid", s); }
    return s;
  });
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async (text) => {
    const q = (text ?? input).trim();
    if (!q || streaming) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: q }, { role: "assistant", content: "" }]);
    setStreaming(true);
    registerChat(sessionId, "maestro");
    try {
      const res = await fetch(`${API}/maestro/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, message: q, lang, machines: getActiveMachineNames() }),
      });
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop();
        for (const part of parts) {
          const line = part.replace(/^data: ?/, "").trim();
          if (!line) continue;
          let obj;
          try { obj = JSON.parse(line); } catch { continue; }
          if (obj.done) continue;
          if (obj.d) {
            setMessages((m) => {
              const copy = [...m];
              copy[copy.length - 1] = {
                role: "assistant",
                content: copy[copy.length - 1].content + obj.d,
              };
              return copy;
            });
          }
        }
      }
    } catch {
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = { role: "assistant", content: t("chat_error") };
        return copy;
      });
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div>
      {messages.length === 0 && (
        <div className="space-y-2 mb-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#7E8A93]">{t("chat_try")}</p>
          {promptSuggestions.map((s, i) => (
            <button
              key={i}
              data-testid={`prompt-suggestion-${i}`}
              onClick={() => send(s)}
              className="w-full text-left bg-white dark:bg-[#1e1e1e] border border-[#2b2b2b] dark:border-[#2e2e2e] rounded-xl px-4 py-3 text-sm text-[#3F4A54] dark:text-[#AEB8BF] active:scale-98 transition-all"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-3 mb-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              data-testid={`chat-msg-${m.role}`}
              className={`markdown-body max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-[#ff6b00] text-white rounded-br-sm whitespace-pre-wrap"
                  : "bg-white dark:bg-[#1e1e1e] border border-[#2b2b2b] dark:border-[#2e2e2e] text-[#2B303B] dark:text-[#e4eff8] rounded-bl-sm"
              }`}
            >
              {m.role === "assistant"
                ? (m.content ? <ReactMarkdown>{m.content}</ReactMarkdown> : (streaming && i === messages.length - 1 ? "…" : ""))
                : m.content}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="sticky bottom-[76px] flex items-end gap-2 bg-[#121212] dark:bg-[#121212] pt-2">
        <textarea
          data-testid="ai-chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          rows={1}
          placeholder={t("chat_placeholder")}
          className="flex-1 resize-none bg-white dark:bg-[#1e1e1e] border border-[#2b2b2b] dark:border-[#2e2e2e] focus:border-[#ff6b00] focus:ring-2 focus:ring-[#ff6b00]/20 rounded-2xl px-4 py-3 text-base outline-none max-h-32"
        />
        <button
          data-testid="ai-chat-submit"
          onClick={() => send()}
          disabled={streaming}
          className="w-12 h-12 rounded-2xl bg-[#ff6b00] hover:bg-[#336a94] disabled:opacity-50 text-white flex items-center justify-center shrink-0 active:scale-95 transition-all"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

function EncyclopediaPanel() {
  const { t, lang } = useLang();
  const { news, encyclopedia } = content[lang];
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-[#7E8A93]">
        <Newspaper className="w-4 h-4" />
        <span className="text-xs font-semibold uppercase tracking-wide">{t("news_label")}</span>
      </div>
      {news.map((n, i) => (
        <div key={i} data-testid={`news-${i}`} className={`rounded-2xl p-5 border ${n.highlight ? "bg-[#ff6b00]/10 border-[#ff6b00]/40" : "bg-white dark:bg-[#1e1e1e] border-[#2b2b2b] dark:border-[#2e2e2e]"}`}>
          <span className={`inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full mb-2 ${n.highlight ? "text-white bg-[#ff6b00]" : "text-[#ff6b00] bg-[#ff6b00]/15"}`}>{n.tag}</span>
          <h3 className="font-display text-lg font-semibold text-[#2B303B] dark:text-[#e4eff8]">{n.title}</h3>
          <p className="text-sm text-[#3F4A54] dark:text-[#AEB8BF] mt-1 leading-relaxed">{n.body}</p>
        </div>
      ))}
      <div className="flex items-center gap-2 text-[#7E8A93] pt-2">
        <BookOpen className="w-4 h-4" />
        <span className="text-xs font-semibold uppercase tracking-wide">{t("enc_label")}</span>
      </div>
      {encyclopedia.map((e, i) => (
        <div key={i} data-testid={`encyclopedia-${i}`} className="bg-white dark:bg-[#1e1e1e] border border-[#2b2b2b] dark:border-[#2e2e2e] rounded-2xl p-5">
          <h3 className="font-display text-lg font-semibold text-[#2B303B] dark:text-[#e4eff8]">{e.title}</h3>
          <p className="text-sm text-[#3F4A54] dark:text-[#AEB8BF] mt-1 leading-relaxed">{e.body}</p>
        </div>
      ))}
    </div>
  );
}

function VideoPanel() {
  const { lang } = useLang();
  const youtubeVideos = content[lang].youtubeVideos;
  return (
    <div className="space-y-4">
      {youtubeVideos.map((v, i) => (
        <div key={i} data-testid={`video-${i}`} className="bg-white dark:bg-[#1e1e1e] border border-[#2b2b2b] dark:border-[#2e2e2e] rounded-2xl overflow-hidden">
          <div className="aspect-video bg-black">
            <iframe
              className="w-full h-full"
              src={v.url}
              title={v.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <div className="p-4">
            <span className="text-[10px] font-bold uppercase tracking-wide text-[#ff6b00]">{v.category}</span>
            <h3 className="font-display text-lg font-semibold text-[#2B303B] dark:text-[#e4eff8] mt-0.5">{v.title}</h3>
          </div>
        </div>
      ))}
    </div>
  );
}

function StoccardaPanel() {
  const { t } = useLang();
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null); // announcement being edited, or {} for new
  const [form, setForm] = useState({ title: "", details: "", region: "stoccarda" });
  const [toDelete, setToDelete] = useState(null);
  const [filter, setFilter] = useState("all");

  const REGIONS = ["stoccarda", "germania", "italia", "mondo"];
  const regionLabel = (r) => t(`region_${r || "stoccarda"}`);

  const load = async () => {
    try { setItems(await announcementsApi.list()); }
    catch { toast.error(t("toast_ann_load_error")); }
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setForm({ title: "", details: "", region: "stoccarda" }); setEditing({}); };
  const openEdit = (a) => { setForm({ title: a.title, details: a.details || "", region: a.region || "stoccarda" }); setEditing(a); };

  const save = async () => {
    if (!form.title.trim()) return;
    try {
      if (editing && editing.id) await announcementsApi.update(editing.id, form);
      else await announcementsApi.create(form);
      toast.success(t("toast_ann_saved"));
      setEditing(null); load();
    } catch { toast.error(t("toast_save_error")); }
  };

  const remove = async () => {
    try { await announcementsApi.remove(toDelete.id); toast.success(t("toast_ann_deleted")); setToDelete(null); load(); }
    catch { toast.error(t("toast_generic_error")); }
  };

  return (
    <div className="space-y-4">
      {editing ? (
        <div className="bg-white dark:bg-[#1e1e1e] border border-[#2b2b2b] dark:border-[#2e2e2e] rounded-2xl p-4 space-y-3">
          <input
            data-testid="announcement-title-input"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder={t("ann_title_ph")}
            className="w-full bg-[#e4eff8] dark:bg-[#242424] border border-[#2b2b2b] dark:border-[#2e2e2e] rounded-xl p-3 outline-none focus:border-[#ff6b00]"
          />
          <textarea
            data-testid="announcement-details-input"
            value={form.details}
            onChange={(e) => setForm((f) => ({ ...f, details: e.target.value }))}
            rows={3}
            placeholder={t("ann_details_ph")}
            className="w-full bg-[#e4eff8] dark:bg-[#242424] border border-[#2b2b2b] dark:border-[#2e2e2e] rounded-xl p-3 outline-none focus:border-[#ff6b00] resize-none"
          />
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-[#7E8A93]">{t("ann_region")}</label>
            <select
              data-testid="announcement-region-select"
              value={form.region}
              onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
              className="mt-1 w-full bg-[#e4eff8] dark:bg-[#242424] border border-[#2b2b2b] dark:border-[#2e2e2e] rounded-xl p-3 outline-none focus:border-[#ff6b00]"
            >
              {REGIONS.map((r) => <option key={r} value={r}>{regionLabel(r)}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setEditing(null)}
              className="flex-1 bg-[#e4eff8] dark:bg-[#242424] px-4 py-3 rounded-xl border border-[#2b2b2b] dark:border-[#2e2e2e] font-medium">
              {t("cancel")}
            </button>
            <button data-testid="announcement-save-btn" onClick={save}
              className="flex-1 bg-[#ff6b00] hover:bg-[#336a94] text-white font-semibold px-4 py-3 rounded-xl">
              {t("save")}
            </button>
          </div>
        </div>
      ) : (
        <button
          data-testid="add-announcement-btn"
          onClick={openNew}
          className="w-full bg-[#e4eff8] dark:bg-[#242424] text-[#2B303B] dark:text-[#e4eff8] font-medium px-4 py-3 rounded-xl border border-[#2b2b2b] dark:border-[#2e2e2e] flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" /> {t("ann_add")}
        </button>
      )}

      <div className="flex gap-2 overflow-x-auto thin-scroll pb-1">
        {["all", ...REGIONS].map((r) => (
          <button
            key={r}
            data-testid={`region-chip-${r}`}
            onClick={() => setFilter(r)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              filter === r ? "bg-[#ff6b00] text-white" : "bg-[#e4eff8] dark:bg-[#242424] text-[#7E8A93] border border-[#2b2b2b] dark:border-[#2e2e2e]"
            }`}
          >
            {r === "all" ? t("region_all") : regionLabel(r)}
          </button>
        ))}
      </div>

      {items.filter((a) => filter === "all" || (a.region || "stoccarda") === filter).map((a) => (
        <div key={a.id} data-testid={`announcement-${a.id}`} className="bg-white dark:bg-[#1e1e1e] border border-[#2b2b2b] dark:border-[#2e2e2e] rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#ff6b00]/15 border border-[#ff6b00]/30 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-[#ff6b00]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wide text-white bg-[#ff6b00] px-2 py-0.5 rounded-full">{regionLabel(a.region)}</span>
              </div>
              <h3 className="font-display text-lg font-semibold text-[#2B303B] dark:text-[#e4eff8] mt-1">{a.title}</h3>
              {a.details ? <p className="text-sm text-[#3F4A54] dark:text-[#AEB8BF] mt-1 leading-relaxed">{a.details}</p> : null}
            </div>
            <div className="flex gap-1.5 shrink-0">
              <button onClick={() => openEdit(a)} data-testid={`edit-announcement-${a.id}`} className="w-8 h-8 rounded-lg bg-[#e4eff8] dark:bg-[#242424] flex items-center justify-center text-[#ff6b00]">
                <Pencil className="w-4 h-4" />
              </button>
              <button onClick={() => setToDelete(a)} data-testid={`delete-announcement-${a.id}`} className="w-8 h-8 rounded-lg bg-[#e4eff8] dark:bg-[#242424] flex items-center justify-center text-[#ff6b00]">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent className="bg-[#121212] dark:bg-[#121212] border-[#2b2b2b] dark:border-[#2e2e2e]">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">{t("ann_delete_q")}</AlertDialogTitle>
            <AlertDialogDescription>"{toDelete?.title}" {t("ann_delete_desc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="announcement-delete-cancel">{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction data-testid="announcement-delete-confirm" onClick={remove} className="bg-[#ff6b00] hover:bg-[#336a94]">{t("delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
