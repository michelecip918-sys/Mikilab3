import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Send, Volume2 } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { api } from "@/lib/api";

const HIST_KEY = "mikilab_sitor_chat";
const MYTOOLS_KEY = "mikilab_my_tools";

export default function SitorChat({ onClose }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const voiceLang = mkTri(lang)("it-IT", "de-DE", "en-GB");
  const [msgs, setMsgs] = useState(() => { try { return JSON.parse(localStorage.getItem(HIST_KEY) || "[]"); } catch { return []; } });
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef(null);
  const [path, setPath] = useState([]);
  useEffect(() => { api.get(`/learning-path`).then((r) => setPath(r.data?.levels || [])).catch(() => {}); }, []);

  useEffect(() => { try { localStorage.setItem(HIST_KEY, JSON.stringify(msgs.slice(-30))); } catch { /* */ } }, [msgs]);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [msgs, busy]);

  const speak = (text) => { try { window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = voiceLang; window.speechSynthesis.speak(u); } catch { /* */ } };

  const send = async () => {
    const q = input.trim();
    if (!q || busy) return;
    setInput("");
    const next = [...msgs, { role: "user", content: q }];
    setMsgs(next); setBusy(true);
    let tools = {};
    try { tools = JSON.parse(localStorage.getItem(MYTOOLS_KEY) || "{}"); } catch { /* */ }
    try {
      const doneSet = new Set(JSON.parse(localStorage.getItem("mikilab_done") || "[]"));
      const fatte = [];
      path.forEach((lv) => (lv.recipes || []).forEach((r) => { if (doneSet.has(r.id)) fatte.push(r.name); }));
      if (fatte.length) tools.ricette_fatte = fatte.join(", ");
      const liv = path.filter((l) => l.active).map((l) => `L${l.n} ${(l.title && (l.title.it || l.title.en)) || ""}`);
      if (liv.length) tools.livelli_attivi = liv.join("; ");
    } catch { /* */ }
    try {
      const r = await api.post(`/sitor/chat`, { messages: next.slice(-10), lang, tools });
      const reply = r.data?.reply || tri("Riprova tra poco.", "Versuch es gleich nochmal.", "Try again shortly.");
      setMsgs((m) => [...m, { role: "assistant", content: reply }]);
    } catch {
      setMsgs((m) => [...m, { role: "assistant", content: tri("Scusa, ho avuto un intoppo. Riprova.", "Entschuldige, kleiner Fehler. Versuch erneut.", "Sorry, glitch. Try again.") }]);
    } finally { setBusy(false); }
  };

  return createPortal((
    <div data-testid="sitor-chat" className="fixed inset-0 z-[96] bg-black/50 flex items-end sm:items-center sm:justify-center" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full sm:max-w-lg h-[85vh] sm:h-[80vh] bg-[#1F2124] sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl">
        <div className="flex items-center gap-3 px-4 py-3 bg-[#2A2D31] shrink-0">
          <img src="/sitor_official.jpg" alt="Sitor" className="w-10 h-10 rounded-full object-cover border-2 border-[#E9A23B]" />
          <div className="min-w-0 flex-1">
            <p className="font-display font-bold text-[#F6F1E7] leading-tight">Sitor</p>
            <p className="text-[11px] text-white/50">{tri("Guida IA · panificazione", "KI-Guide · Backen", "AI guide · baking")}</p>
          </div>
          <button data-testid="sitor-chat-close" onClick={onClose} className="p-2 rounded-full bg-white/10 active:scale-90 text-white"><X className="w-5 h-5" /></button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {msgs.length === 0 && (
            <div className="text-center text-white/60 mt-8">
              <p className="font-display text-lg text-[#E9A23B]">{tri("Ciao! Da dove cominciamo?", "Hallo! Wo fangen wir an?", "Hi! Where do we start?")}</p>
              <p className="text-sm mt-2">{tri("Chiedimi di pane, pizza, dolci e delle ricette del sito.", "Frag mich zu Brot, Pizza, Süßem und den Rezepten der Seite.", "Ask me about bread, pizza, sweets and the site's recipes.")}</p>
            </div>
          )}
          {msgs.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div data-testid={`chat-msg-${m.role}`} className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[15px] whitespace-pre-wrap ${m.role === "user" ? "bg-[#A85A22] text-[#FFFDF8]" : "bg-white/8 text-[#F6F1E7]"}`}>
                {m.content}
                {m.role === "assistant" && <button onClick={() => speak(m.content)} className="ml-2 text-white/40 hover:text-[#E9A23B] align-middle"><Volume2 className="w-3.5 h-3.5 inline" /></button>}
              </div>
            </div>
          ))}
          {busy && <div className="flex justify-start"><div className="bg-white/8 rounded-2xl px-4 py-3 text-white/50 text-sm animate-pulse">Sitor…</div></div>}
        </div>

        <div className="px-3 pt-2 pb-3 bg-[#2A2D31] shrink-0" style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}>
          <p data-testid="sitor-chat-disclaimer" className="text-[10px] text-white/40 text-center mb-2 px-2">{tri("Sitor è un'IA e può sbagliare. Non scrivere dati personali o di salute.", "Sitor ist eine KI und kann sich irren. Schreibe keine persönlichen oder Gesundheitsdaten.", "Sitor is an AI and can be wrong. Don't write personal or health data.")}</p>
          <div className="flex items-end gap-2">
            <textarea data-testid="sitor-chat-input" value={input} onChange={(e) => setInput(e.target.value)} rows={1}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder={tri("Scrivi a Sitor…", "Schreib Sitor…", "Write to Sitor…")}
              className="flex-1 resize-none bg-[#1F2124] border border-white/15 rounded-2xl px-3.5 py-2.5 text-[15px] text-white outline-none focus:border-[#E9A23B] max-h-28" />
            <button data-testid="sitor-chat-send" onClick={send} disabled={busy || !input.trim()} className="p-3 rounded-2xl bg-[#A85A22] text-white disabled:opacity-40 active:scale-90 shrink-0"><Send className="w-5 h-5" /></button>
          </div>
          <p className="text-[9px] text-white/30 text-center mt-1">{tri("Voce sintetica del tuo dispositivo.", "Synthetische Stimme deines Geräts.", "Your device's synthetic voice.")}</p>
        </div>
      </div>
    </div>
  ), document.body);
}
