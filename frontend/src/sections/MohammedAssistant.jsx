import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Sparkles, Send, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { API } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";

const AVATAR = `${process.env.PUBLIC_URL}/mohammed-avatar.jpg`;
const sid = () => {
  let s = localStorage.getItem("mikilab_mohammed_sid");
  if (!s) { s = "mohammed-" + Math.random().toString(36).slice(2, 10); localStorage.setItem("mikilab_mohammed_sid", s); }
  return s;
};

// Assistente "Mohammed" — accoglienza + guida operativa de "Il Tuo Laboratorio".
export default function MohammedAssistant() {
  const { lang } = useLang();
  const tri = (i, d, e) => (lang === "de" ? d : lang === "en" ? e : i);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef(null);
  const sessionId = useRef(sid());

  useEffect(() => { if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight; }, [messages, open]);

  const suggestions = [
    tri("Come organizzo le farine?", "Wie organisiere ich die Mehle?", "How do I organise the flours?"),
    tri("Come imposto la cottura?", "Wie stelle ich das Backen ein?", "How do I set up baking?"),
    tri("Come funziona la Pesata Guidata?", "Wie funktioniert das geführte Wiegen?", "How does Guided Weighing work?"),
  ];

  const send = async (text) => {
    const msg = (text ?? input).trim();
    if (!msg || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: msg }, { role: "assistant", content: "" }]);
    setBusy(true);
    try {
      const res = await fetch(`${API}/mohammed/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ session_id: sessionId.current, message: msg, lang }),
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
          let obj; try { obj = JSON.parse(line); } catch { continue; }
          if (obj.done) continue;
          if (obj.d) setMessages((m) => { const c = [...m]; c[c.length - 1] = { role: "assistant", content: c[c.length - 1].content + obj.d }; return c; });
        }
      }
    } catch {
      setMessages((m) => { const c = [...m]; c[c.length - 1] = { role: "assistant", content: tri("Ops, riprova tra poco.", "Ups, versuch es gleich nochmal.", "Oops, please try again shortly.") }; return c; });
    } finally { setBusy(false); }
  };

  return (
    <div data-testid="mohammed-assistant" className="rounded-3xl bg-gradient-to-br from-[#33564E] to-[#5E8B7E] text-white p-5 mb-5 shadow-lg">
      <div className="flex items-start gap-3">
        <img src={AVATAR} alt="Mohammadreza Jafari" data-testid="mohammed-avatar" className="w-16 h-16 rounded-2xl object-cover ring-2 ring-white/70 shadow-md shrink-0" onError={(e) => { e.currentTarget.style.display = "none"; }} />
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wide text-white/70">{tri("Mohammadreza Jafari · Assistente di Michele (MikiLab)", "Mohammadreza Jafari · Mich-eles Assistent (MikiLab)", "Mohammadreza Jafari · Michele's assistant (MikiLab)")}</p>
          <h2 className="font-display text-xl font-bold leading-tight">{tri("Ciao, sono Mohammadreza 👋", "Hallo, ich bin Mohammadreza 👋", "Hi, I'm Mohammadreza 👋")}</h2>
          <p className="text-sm text-white/90 mt-1 leading-snug">
            {tri(
              "Sono l'assistente di Michele, il creatore di MikiLab. Ti guido passo-passo a organizzare forno e laboratorio: materie prime, impasto e lievitazione, cotture e temperature, igiene HACCP e uso di tutti gli strumenti di questa sezione.",
              "Ich bin Micheles Assistent (Gründer von MikiLab). Ich führe dich Schritt für Schritt: Rohstoffe, Teig & Gärung, Backen & Temperaturen, HACCP-Hygiene und die Nutzung aller Werkzeuge dieses Bereichs.",
              "I'm Michele's assistant (the creator of MikiLab). I guide you step by step: raw materials, dough & proofing, baking & temperatures, HACCP hygiene and how to use every tool in this section."
            )}
          </p>
        </div>
      </div>

      <button data-testid="mohammed-toggle" onClick={() => setOpen((o) => !o)}
        className="mt-3 inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur px-4 py-2 rounded-xl text-sm font-semibold active:scale-97 transition-all">
        <Sparkles className="w-4 h-4" /> {open ? tri("Chiudi assistente", "Assistent schließen", "Close assistant") : tri("Chiedi a Mohammadreza", "Mohammadreza fragen", "Ask Mohammadreza")}
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {open && (
        <div data-testid="mohammed-chat" className="mt-3 bg-white/95 dark:bg-[#1F252B]/95 rounded-2xl p-3">
          <div ref={listRef} className="max-h-72 overflow-y-auto space-y-2 pr-1">
            {messages.length === 0 && (
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s, i) => (
                  <button key={i} data-testid={`mohammed-suggest-${i}`} onClick={() => send(s)}
                    className="text-xs font-medium bg-[#5E8B7E]/12 text-[#33564E] dark:text-[#9ec4b8] border border-[#5E8B7E]/30 rounded-full px-3 py-1.5 active:scale-97">
                    {s}
                  </button>
                ))}
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`markdown-body max-w-[85%] rounded-2xl px-3 py-2 text-sm ${m.role === "user" ? "bg-[#5E8B7E] text-white" : "bg-[#EAF0EC] dark:bg-[#2A323A] text-[#2B303B] dark:text-[#EAF0EC]"}`}>
                  {m.role === "assistant" && !m.content ? <Loader2 className="w-4 h-4 animate-spin text-[#5E8B7E]" /> : <ReactMarkdown>{m.content}</ReactMarkdown>}
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <input data-testid="mohammed-input" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder={tri("Scrivi a Mohammadreza…", "Schreibe an Mohammadreza…", "Message Mohammadreza…")}
              className="flex-1 bg-[#F6F8F5] dark:bg-[#232A31] border border-[#D7E1DB] dark:border-[#38424B] rounded-xl px-3 py-2.5 text-sm outline-none text-[#2B303B] dark:text-[#EAF0EC] focus:border-[#5E8B7E]" />
            <button data-testid="mohammed-send" onClick={() => send()} disabled={busy || !input.trim()}
              className="w-11 h-11 rounded-xl bg-[#5E8B7E] hover:bg-[#4C7368] disabled:opacity-50 text-white flex items-center justify-center active:scale-95 shrink-0">
              {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
