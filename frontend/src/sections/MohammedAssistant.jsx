import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Sparkles, Send, ChevronDown, ChevronUp, Loader2, Volume2, Square } from "lucide-react";
import { API } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { openLabTour } from "@/components/LabOnboarding";
import { speak, primeVoice } from "@/lib/voice";

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
  const [speakingIdx, setSpeakingIdx] = useState(null);
  const listRef = useRef(null);
  const sessionId = useRef(sid());

  const readAloud = (idx, content) => {
    primeVoice();
    try { window.speechSynthesis?.cancel(); } catch { /* */ }
    if (speakingIdx === idx) { setSpeakingIdx(null); return; }
    speak(content, lang);
    setSpeakingIdx(idx);
  };

  useEffect(() => { if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight; }, [messages, open]);

  const suggestions = [
    tri("Come genero il piano di produzione con l'IA?", "Wie erstelle ich den Produktionsplan mit der KI?", "How do I generate the production plan with AI?"),
    tri("Come organizzo oggi, domani e cosa va in freezer?", "Wie teile ich heute, morgen und den Gefrierbestand auf?", "How do I split today, tomorrow and what goes to the freezer?"),
    tri("Quale farina uso per questo impasto?", "Welches Mehl nehme ich für diesen Teig?", "Which flour do I use for this dough?"),
    tri("Quando attacco gli impasti e rinfresco il lievito?", "Wann setze ich die Teige an und frische den Sauerteig auf?", "When do I start the doughs and refresh the sourdough?"),
  ];

  // Guida allineata al layout a 2 passi: fondamentali per generare il piano + opzioni extra via IA.
  const GUIDE = [
    { n: 1, q: tri("Spiegami il PASSO 1: cosa mi serve DAVVERO per generare il Piano di Produzione con l'IA? Quali campi sono obbligatori e da quale impasto conviene partire?",
                   "Erkläre mir SCHRITT 1: Was brauche ich WIRKLICH, um den KI-Produktionsplan zu erstellen? Welche Felder sind Pflicht und mit welchem Teig starte ich am besten?",
                   "Explain STEP 1: what do I REALLY need to generate the AI Production Plan? Which fields are required and which dough should I start from?"),
      t: tri("Passo 1 · Genera il Piano (le cose fondamentali)", "Schritt 1 · Plan erstellen (das Wesentliche)", "Step 1 · Generate the Plan (the essentials)") },
    { n: 2, q: tri("Spiegami il PASSO 2: quali opzioni extra posso collegare al piano tramite l'IA (freezer, celle frigo, lista spesa, food cost, punti vendita, turni, orari d'inizio, Digital Twin del picco) e a cosa servono?",
                   "Erkläre mir SCHRITT 2: welche Extra-Optionen kann ich über die KI verbinden (Gefrierbestand, Kühlkammern, Einkaufsliste, Food Cost, Verkaufspunkte, Schichten, Startzeiten, Digital Twin des Peaks) und wozu?",
                   "Explain STEP 2: which extra options can I connect via AI (freezer, cold cells, shopping list, food cost, sales points, shifts, start times, the peak Digital Twin) and what are they for?"),
      t: tri("Passo 2 · Opzioni extra collegabili via IA", "Schritt 2 · Extra-Optionen über die KI", "Step 2 · Extra options via AI") },
    { n: 3, q: tri("Come uso al meglio il risultato del piano: sequenza impasti, lista spesa, ordini fornitori e PDF da stampare?",
                   "Wie nutze ich das Ergebnis des Plans optimal: Teig-Reihenfolge, Einkaufsliste, Lieferantenbestellungen und PDF zum Ausdrucken?",
                   "How do I best use the plan result: dough sequence, shopping list, supplier orders and printable PDF?"),
      t: tri("In più · Sfrutta al meglio il piano", "Extra · Den Plan optimal nutzen", "Extra · Make the most of the plan") },
  ];

  const askGuide = (q) => { setOpen(true); send(q); };

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
              "Sono l'assistente di Michele, il creatore di MikiLab. Ti guido nel cuore del laboratorio: cosa serve DAVVERO per generare il Piano di Produzione con l'IA e quali opzioni extra puoi collegare (freezer, celle, spesa, food cost, punti vendita, turni, Digital Twin del picco).",
              "Ich bin Micheles Assistent (Gründer von MikiLab). Ich zeige dir das Herz der Backstube: was du WIRKLICH brauchst, um den KI-Produktionsplan zu erstellen, und welche Extra-Optionen du verbinden kannst (Gefrierbestand, Kammern, Einkauf, Food Cost, Verkaufspunkte, Schichten, Digital Twin des Peaks).",
              "I'm Michele's assistant (creator of MikiLab). I show you the heart of the lab: what you REALLY need to generate the AI Production Plan and which extra options you can connect (freezer, cells, shopping, food cost, sales points, shifts, the peak Digital Twin)."
            )}
          </p>
        </div>
      </div>

      {/* Guida passo-passo del laboratorio */}
      <div data-testid="mohammed-guide" className="mt-4 grid grid-cols-1 gap-1.5">
        <p className="text-[11px] font-bold uppercase tracking-wide text-white/70 mb-0.5">{tri("Guida passo-passo del laboratorio", "Schritt-für-Schritt-Anleitung", "Step-by-step lab guide")}</p>
        {GUIDE.map((g) => (
          <button key={g.n} data-testid={`mohammed-guide-${g.n}`} onClick={() => askGuide(g.q)}
            className="w-full flex items-center gap-2.5 bg-white/12 hover:bg-white/22 rounded-xl px-3 py-2 text-left active:scale-98 transition-all">
            <span className="w-6 h-6 rounded-full bg-white/90 text-[#33564E] font-bold text-xs flex items-center justify-center shrink-0">{g.n}</span>
            <span className="text-sm font-medium">{g.t}</span>
          </button>
        ))}
      </div>

      <button data-testid="mohammed-replay-tour" onClick={openLabTour}
        className="mt-2.5 w-full flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur px-4 py-2.5 rounded-xl text-sm font-semibold active:scale-97 transition-all">
        <Sparkles className="w-4 h-4" /> {tri("Rivedi la guida di Momy 🎧", "Momys Anleitung erneut ansehen 🎧", "Replay Momy's guide 🎧")}
      </button>

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
                  {m.role === "assistant" && m.content && !busy && (
                    <button data-testid={`mohammed-listen-${i}`} onClick={() => readAloud(i, m.content)}
                      className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-[#33564E] dark:text-[#9ec4b8] hover:opacity-80 active:scale-95 transition-all">
                      {speakingIdx === i ? <Square className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                      {speakingIdx === i ? tri("Ferma", "Stopp", "Stop") : tri("Ascolta", "Anhören", "Listen")}
                    </button>
                  )}
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
