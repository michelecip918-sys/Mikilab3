import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Send, Volume2, Mic, MicOff } from "lucide-react";
import { MicNotice } from "@/components/MicNotice";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { api } from "@/lib/api";
import { chatTools } from "@/lib/mycucina";
import SitorBadge from "@/components/SitorBadge";
import { recipesApi } from "@/lib/api"; // V93
import { bottegaAnswer } from "@/lib/sitorBottega"; // V93b

const HIST_KEY = "mikilab_sitor_chat";

export default function SitorChat({ onClose }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const voiceLang = mkTri(lang)("it-IT", "de-DE", "en-GB");
  const [msgs, setMsgs] = useState(() => { try { return JSON.parse(localStorage.getItem(HIST_KEY) || "[]"); } catch { return []; } });
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const scrollRef = useRef(null);
  const recRef = useRef(null);
  const [path, setPath] = useState([]);
  const [recs, setRecs] = useState([]); // V93
  const isIOS = typeof navigator !== "undefined" && /iP(hone|ad|od)/.test(navigator.userAgent);
  const SR = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
  useEffect(() => { api.get(`/learning-path`).then((r) => setPath(r.data?.levels || [])).catch(() => {}); }, []);
  useEffect(() => { recipesApi.list("mikilab").then((d) => setRecs(d || [])).catch(() => {}); }, []); // V93
  useEffect(() => {
    const h = (e) => { const t = e?.detail?.text; if (t) setInput(t); };
    window.addEventListener("mikilab-chat-prefill", h);
    return () => window.removeEventListener("mikilab-chat-prefill", h);
  }, []);

  const startMic = () => {
    if (!SR) return;
    try {
      const rec = new SR(); recRef.current = rec; rec.lang = voiceLang; rec.interimResults = false; rec.maxAlternatives = 1;
      rec.onresult = (e) => { const t = e.results[0][0].transcript; setInput(t); setMicOn(false); setTimeout(() => send(t), 100); };
      rec.onend = () => setMicOn(false);
      rec.onerror = () => setMicOn(false);
      rec.start(); setMicOn(true);
    } catch { setMicOn(false); }
  };
  const stopMic = () => { try { recRef.current && recRef.current.stop(); } catch { /* */ } setMicOn(false); };

  useEffect(() => { try { localStorage.setItem(HIST_KEY, JSON.stringify(msgs.slice(-30))); } catch { /* */ } }, [msgs]);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [msgs, busy]);

  const speak = (text) => { try { window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = voiceLang; window.speechSynthesis.speak(u); } catch { /* */ } };

  const send = async (override, opts = {}) => { // V93: opts.ai = salta la bottega, vai all'IA
    const voiceMode = typeof override === "string" && !opts.ai;
    const q = (voiceMode ? override : input).trim();
    if (!q || busy) return;
    setInput("");
    const next = opts.ai ? [...msgs] : [...msgs, { role: "user", content: q }];
    setMsgs(next); setBusy(true);
    if (!opts.ai) { // V93: prima risponde la bottega (glossario, pronto soccorso, dati della ricetta), senza IA e senza crediti
      const curId = ((typeof window !== "undefined" && window.__mkCur) || {}).id;
      const local = bottegaAnswer(q, lang, { recipe: recs.find((x) => x && x.id === curId) });
      if (local) { setMsgs((m) => [...m, { role: "assistant", content: local, bottega: true, q }]); if (voiceMode) speak(local); setBusy(false); return; }
    }
    let tools = {};
    try { tools = chatTools(); } catch { /* */ }
    try {
      const doneSet = new Set(JSON.parse(localStorage.getItem("mikilab_done") || "[]"));
      const fatte = [];
      path.forEach((lv) => (lv.recipes || []).forEach((r) => { if (doneSet.has(r.id)) fatte.push(r.name); }));
      if (fatte.length) tools.ricette_fatte = fatte.join(", ");
      const liv = path.filter((l) => l.active).map((l) => `L${l.n} ${(l.title && (l.title.it || l.title.en)) || ""}`);
      if (liv.length) tools.livelli_attivi = liv.join("; ");
    } catch { /* */ }
    try {
      let level = "casa";
      try { level = localStorage.getItem("mikilab_recipe_mode") || (localStorage.getItem("mikilab_skill") === "expert" ? "esperto" : "casa"); } catch { /* */ }
      const cur = (typeof window !== "undefined" && window.__mkCur) || {};
      const r = await api.post(`/sitor/chat`, { messages: next.filter((m) => !m.bottega).slice(-10), lang, tools, level, recipe_id: cur.id || undefined, farro: !!cur.farro });
      const reply = r.data?.reply || tri("Riprova tra poco.", "Versuch es gleich nochmal.", "Try again shortly.");
      setMsgs((m) => [...m, { role: "assistant", content: reply }]);
      if (voiceMode) speak(reply);  // G1: in modalità voce leggi la risposta
    } catch {
      setMsgs((m) => [...m, { role: "assistant", content: tri("Scusa, ho avuto un intoppo. Riprova.", "Entschuldige, kleiner Fehler. Versuch erneut.", "Sorry, glitch. Try again.") }]);
    } finally { setBusy(false); }
  };

  return createPortal((
    <div data-testid="sitor-chat" className="fixed inset-0 z-[96] bg-background/50 flex items-end sm:items-center sm:justify-center" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full sm:max-w-lg h-[85vh] sm:h-[80vh] bg-background sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl">
        <div className="flex items-center gap-3 px-4 py-3 bg-card shrink-0">
          <img src="/sitor_official.webp" alt={tri("Avatar IA di Michele (Sitor)", "KI-Avatar von Michele (Sitor)", "AI avatar of Michele (Sitor)")} className="w-10 h-10 rounded-full object-cover border-2 border-border" />
          <div className="min-w-0 flex-1">
            <p className="font-display font-bold text-foreground leading-tight">Sitor</p>
            <SitorBadge size={18} className="mt-0.5" onOpenPerche={() => { onClose(); try { window.dispatchEvent(new CustomEvent("mikilab-open-perche")); } catch { /* */ } }} />
          </div>
          <button data-testid="sitor-chat-close" onClick={onClose} className="p-2 rounded-full bg-foreground/10 active:scale-90 text-foreground"><X className="w-5 h-5" /></button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {msgs.length === 0 && (
            <div className="text-center text-foreground/60 mt-8">
              <p className="font-display text-lg text-muted-foreground">{tri("Ciao! Da dove cominciamo?", "Hallo! Wo fangen wir an?", "Hi! Where do we start?")}</p>
              <p className="text-sm mt-2">{tri("Chiedimi di pane, pizza, dolci e delle ricette del sito.", "Frag mich zu Brot, Pizza, Süßem und den Rezepten der Seite.", "Ask me about bread, pizza, sweets and the site's recipes.")}</p>
              <button data-testid="sitor-chat-quick-pane" onClick={() => setInput(tri("Ho pane vecchio: cosa posso farci?", "Ich habe altes Brot: was kann ich damit machen?", "I have old bread: what can I make with it?"))}
                className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-salvia/15 border border-salvia/40 text-foreground text-xs font-bold active:scale-95">🥖 {tri("Ho pane vecchio", "Ich habe altes Brot", "I have old bread")}</button>
            </div>
          )}
          {msgs.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div data-testid={`chat-msg-${m.role}`} className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[15px] whitespace-pre-wrap ${m.role === "user" ? "bg-muted text-foreground" : "bg-foreground/8 text-foreground"}`}>
                {m.content}
                {m.role === "assistant" && <button onClick={() => speak(m.content)} className="ml-2 text-foreground/40 hover:text-muted-foreground align-middle"><Volume2 className="w-3.5 h-3.5 inline" /></button>}
                {m.bottega && <span className="block mt-1.5 text-[10.5px] text-salvia">{tri("Dalla bottega, senza IA.", "Aus der Werkstatt, ohne KI.", "From the workshop, no AI.")} <button data-testid="chat-ask-ai" disabled={busy} onClick={() => send(m.q, { ai: true })} className="underline decoration-dotted font-bold disabled:opacity-40">{tri("Chiedi a Sitor IA →", "Sitor KI fragen →", "Ask Sitor AI →")}</button></span>}
              </div>
            </div>
          ))}
          {busy && <div className="flex justify-start"><div className="bg-foreground/8 rounded-2xl px-4 py-3 text-foreground/50 text-sm animate-pulse">Sitor…</div></div>}
        </div>

        <div className="px-3 pt-2 pb-3 bg-card shrink-0" style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}>
          <p data-testid="sitor-chat-disclaimer" className="text-[10px] text-foreground/40 text-center mb-2 px-2">{tri("Sitor è un'IA e può sbagliare. Non scrivere dati personali o di salute.", "Sitor ist eine KI und kann sich irren. Schreibe keine persönlichen oder Gesundheitsdaten.", "Sitor is an AI and can be wrong. Don't write personal or health data.")}</p>
          <div className="flex items-end gap-2">
            {SR && !(isIOS && !SR) && (
              <button data-testid="sitor-chat-mic" onClick={() => (micOn ? stopMic() : startMic())} aria-label="mic"
                className={`p-3 rounded-2xl shrink-0 active:scale-90 ${micOn ? "bg-mattone text-white animate-pulse" : "bg-foreground/10 text-foreground"}`}>
                {micOn ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            )}
            <textarea data-testid="sitor-chat-input" value={input} onChange={(e) => setInput(e.target.value)} rows={1}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder={tri("Scrivi a Sitor…", "Schreib Sitor…", "Write to Sitor…")}
              className="flex-1 resize-none bg-background border border-foreground/15 rounded-2xl px-3.5 py-2.5 text-[15px] text-foreground outline-none focus:border-border max-h-28" />
            <button data-testid="sitor-chat-send" onClick={() => send()} disabled={busy || !input.trim()} className="p-3 rounded-2xl bg-muted text-foreground disabled:opacity-40 active:scale-90 shrink-0"><Send className="w-5 h-5" /></button>
          </div>
          {micOn && <p className="text-[10px] text-mattone text-center mt-1">🎙️ {tri("Ti ascolto… parla pure", "Ich höre zu… sprich", "Listening… go ahead")}</p>}
          {SR && <MicNotice className="text-center mt-1" />}
          <p className="text-[9px] text-foreground/30 text-center mt-1">{tri("Voce sintetica del tuo dispositivo.", "Synthetische Stimme deines Geräts.", "Your device's synthetic voice.")}</p>
        </div>
      </div>
    </div>
  ), document.body);
}
