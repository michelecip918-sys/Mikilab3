import { useRef, useState, useEffect } from "react";
import { Sparkles, Send, MessageCircle, BookOpen, Youtube, MapPin, Newspaper } from "lucide-react";
import { API } from "@/lib/api";
import {
  promptSuggestions, encyclopedia, news, youtubeVideos, stuttgartAnnouncements,
} from "@/data/content";

const TABS = [
  { id: "chiedi", label: "Chiedi", Icon: MessageCircle },
  { id: "enciclopedia", label: "Enciclopedia", Icon: BookOpen },
  { id: "video", label: "Video", Icon: Youtube },
  { id: "stoccarda", label: "Stoccarda", Icon: MapPin },
];

export default function MaestroSaTutto() {
  const [tab, setTab] = useState("chiedi");

  return (
    <div className="pb-4">
      <div className="relative rounded-3xl overflow-hidden mb-4 bg-gradient-to-br from-[#B34A26] to-[#8C3A1D] p-6 text-white">
        <Sparkles className="w-7 h-7 mb-2" />
        <h1 className="font-display text-2xl font-bold">Il Maestro sa tutto</h1>
        <p className="text-white/85 text-sm mt-1 italic">"Chiedi e ti sarà dato."</p>
      </div>

      <div className="flex gap-2 mb-5 overflow-x-auto thin-scroll pb-1">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            data-testid={`sa-tutto-tab-${id}`}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              tab === id
                ? "bg-[#B34A26] text-white"
                : "bg-[#F5EFE6] dark:bg-[#332823] text-[#8C7567] border border-[#E8DEC8] dark:border-[#3D302A]"
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {tab === "chiedi" && <ChatPanel />}
      {tab === "enciclopedia" && <EncyclopediaPanel />}
      {tab === "video" && <VideoPanel />}
      {tab === "stoccarda" && <StoccardaPanel />}
    </div>
  );
}

function ChatPanel() {
  const [sessionId] = useState(() => `sess-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
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
    try {
      const res = await fetch(`${API}/maestro/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, message: q }),
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
          const line = part.replace(/^data: ?/, "");
          if (line === "[DONE]") continue;
          if (line) {
            setMessages((m) => {
              const copy = [...m];
              copy[copy.length - 1] = {
                role: "assistant",
                content: copy[copy.length - 1].content + line,
              };
              return copy;
            });
          }
        }
      }
    } catch {
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = { role: "assistant", content: "Mi dispiace, si è verificato un errore. Riprova." };
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
          <p className="text-xs font-semibold uppercase tracking-wide text-[#8C7567]">Prova a chiedere</p>
          {promptSuggestions.map((s, i) => (
            <button
              key={i}
              data-testid={`prompt-suggestion-${i}`}
              onClick={() => send(s)}
              className="w-full text-left bg-white dark:bg-[#2A211D] border border-[#E8DEC8] dark:border-[#3D302A] rounded-xl px-4 py-3 text-sm text-[#4A3B34] dark:text-[#C9BBB0] active:scale-98 transition-all"
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
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-[#B34A26] text-white rounded-br-sm"
                  : "bg-white dark:bg-[#2A211D] border border-[#E8DEC8] dark:border-[#3D302A] text-[#2C221E] dark:text-[#F5EFE6] rounded-bl-sm"
              }`}
            >
              {m.content || (streaming && i === messages.length - 1 ? "…" : "")}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="sticky bottom-[76px] flex items-end gap-2 bg-[#FDFBF7] dark:bg-[#1A1412] pt-2">
        <textarea
          data-testid="ai-chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          rows={1}
          placeholder="Chiedi al Maestro…"
          className="flex-1 resize-none bg-white dark:bg-[#2A211D] border border-[#E8DEC8] dark:border-[#3D302A] focus:border-[#B34A26] focus:ring-2 focus:ring-[#B34A26]/20 rounded-2xl px-4 py-3 text-base outline-none max-h-32"
        />
        <button
          data-testid="ai-chat-submit"
          onClick={() => send()}
          disabled={streaming}
          className="w-12 h-12 rounded-2xl bg-[#B34A26] hover:bg-[#963B1C] disabled:opacity-50 text-white flex items-center justify-center shrink-0 active:scale-95 transition-all"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

function EncyclopediaPanel() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-[#8C7567]">
        <Newspaper className="w-4 h-4" />
        <span className="text-xs font-semibold uppercase tracking-wide">Notizie sul pane</span>
      </div>
      {news.map((n, i) => (
        <div key={i} data-testid={`news-${i}`} className="bg-white dark:bg-[#2A211D] border border-[#E8DEC8] dark:border-[#3D302A] rounded-2xl p-5">
          <span className="inline-block text-[10px] font-bold uppercase tracking-wide text-[#B34A26] bg-[#D99B26]/15 px-2 py-0.5 rounded-full mb-2">{n.tag}</span>
          <h3 className="font-display text-lg font-semibold text-[#2C221E] dark:text-[#F5EFE6]">{n.title}</h3>
          <p className="text-sm text-[#4A3B34] dark:text-[#C9BBB0] mt-1 leading-relaxed">{n.body}</p>
        </div>
      ))}
      <div className="flex items-center gap-2 text-[#8C7567] pt-2">
        <BookOpen className="w-4 h-4" />
        <span className="text-xs font-semibold uppercase tracking-wide">Enciclopedia del pane</span>
      </div>
      {encyclopedia.map((e, i) => (
        <div key={i} data-testid={`encyclopedia-${i}`} className="bg-white dark:bg-[#2A211D] border border-[#E8DEC8] dark:border-[#3D302A] rounded-2xl p-5">
          <h3 className="font-display text-lg font-semibold text-[#2C221E] dark:text-[#F5EFE6]">{e.title}</h3>
          <p className="text-sm text-[#4A3B34] dark:text-[#C9BBB0] mt-1 leading-relaxed">{e.body}</p>
        </div>
      ))}
    </div>
  );
}

function VideoPanel() {
  return (
    <div className="space-y-4">
      {youtubeVideos.map((v, i) => (
        <div key={i} data-testid={`video-${i}`} className="bg-white dark:bg-[#2A211D] border border-[#E8DEC8] dark:border-[#3D302A] rounded-2xl overflow-hidden">
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
            <span className="text-[10px] font-bold uppercase tracking-wide text-[#B34A26]">{v.category}</span>
            <h3 className="font-display text-lg font-semibold text-[#2C221E] dark:text-[#F5EFE6] mt-0.5">{v.title}</h3>
          </div>
        </div>
      ))}
    </div>
  );
}

function StoccardaPanel() {
  return (
    <div className="space-y-4">
      {stuttgartAnnouncements.map((a, i) => (
        <div key={i} data-testid={`announcement-${i}`} className="bg-white dark:bg-[#2A211D] border border-[#E8DEC8] dark:border-[#3D302A] rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#6B8E62]/15 border border-[#6B8E62]/30 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-[#6B8E62]" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold text-[#2C221E] dark:text-[#F5EFE6]">{a.title}</h3>
              <p className="text-sm text-[#4A3B34] dark:text-[#C9BBB0] mt-1 leading-relaxed">{a.details}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
