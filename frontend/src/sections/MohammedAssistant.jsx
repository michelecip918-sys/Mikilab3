import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Sparkles, Send, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { API } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { registerChat } from "@/lib/chatHistory";
import { mkTri } from "@/i18n/triMaps";

const AVATAR = `${process.env.PUBLIC_URL}/mohammed-avatar.jpg`;
const sid = () => {
  let s = localStorage.getItem("mikilab_mohammed_sid");
  if (!s) { s = "mohammed-" + Math.random().toString(36).slice(2, 10); localStorage.setItem("mikilab_mohammed_sid", s); }
  return s;
};

// Assistente "Mohammed" — accoglienza + guida operativa de "Il Tuo Laboratorio".
export default function MohammedAssistant() {
  const { lang } = useLang();
  const tri = (i, d, e, s) => mkTri(lang)(i, d, e, s);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef(null);
  const sessionId = useRef(sid());

  useEffect(() => { if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight; }, [messages, open]);

  const suggestions = [
    tri("Come genero il piano di produzione con l'IA?", "Wie erstelle ich den Produktionsplan mit der KI?", "How do I generate the production plan with AI?", "¿Cómo genero el plan de producción con la IA?"),
    tri("Come organizzo oggi, domani e cosa va in freezer?", "Wie teile ich heute, morgen und den Gefrierbestand auf?", "How do I split today, tomorrow and what goes to the freezer?", "¿Cómo organizo hoy, mañana y qué va al congelador?"),
    tri("Quale farina uso per questo impasto?", "Welches Mehl nehme ich für diesen Teig?", "Which flour do I use for this dough?", "¿Qué harina uso para esta masa?"),
    tri("Quando attacco gli impasti e rinfresco il lievito?", "Wann setze ich die Teige an und frische den Sauerteig auf?", "When do I start the doughs and refresh the sourdough?", "¿Cuándo empiezo las masas y refresco la masa madre?"),
  ];

  // Guida allineata al layout a 2 passi: fondamentali per generare il piano + opzioni extra via IA.
  const GUIDE = [
    { n: 1, q: tri("Spiegami il PASSO 1: cosa mi serve DAVVERO per generare il Piano di Produzione con l'IA? Quali campi sono obbligatori e da quale impasto conviene partire?",
                   "Erkläre mir SCHRITT 1: Was brauche ich WIRKLICH, um den KI-Produktionsplan zu erstellen? Welche Felder sind Pflicht und mit welchem Teig starte ich am besten?",
                   "Explain STEP 1: what do I REALLY need to generate the AI Production Plan? Which fields are required and which dough should I start from?"),
      t: tri("Passo 1 · Genera il Piano (le cose fondamentali)", "Schritt 1 · Plan erstellen (das Wesentliche)", "Step 1 · Generate the Plan (the essentials)", "Paso 1 · Genera el Plan (lo esencial)") },
    { n: 2, q: tri("Spiegami il PASSO 2: quali opzioni extra posso collegare al piano tramite l'IA (freezer, celle frigo, lista spesa, food cost, punti vendita, turni, orari d'inizio, Digital Twin del picco) e a cosa servono?",
                   "Erkläre mir SCHRITT 2: welche Extra-Optionen kann ich über die KI verbinden (Gefrierbestand, Kühlkammern, Einkaufsliste, Food Cost, Verkaufspunkte, Schichten, Startzeiten, Digital Twin des Peaks) und wozu?",
                   "Explain STEP 2: which extra options can I connect via AI (freezer, cold cells, shopping list, food cost, sales points, shifts, start times, the peak Digital Twin) and what are they for?"),
      t: tri("Passo 2 · Opzioni extra collegabili via IA", "Schritt 2 · Extra-Optionen über die KI", "Step 2 · Extra options via AI", "Paso 2 · Opciones extra vía IA") },
    { n: 3, q: tri("Come uso al meglio il risultato del piano: sequenza impasti, lista spesa, ordini fornitori e PDF da stampare?",
                   "Wie nutze ich das Ergebnis des Plans optimal: Teig-Reihenfolge, Einkaufsliste, Lieferantenbestellungen und PDF zum Ausdrucken?",
                   "How do I best use the plan result: dough sequence, shopping list, supplier orders and printable PDF?"),
      t: tri("In più · Sfrutta al meglio il piano", "Extra · Den Plan optimal nutzen", "Extra · Make the most of the plan", "Además · Aprovecha al máximo el plan") },
  ];

  const askGuide = (q) => { setOpen(true); send(q); };

  const send = async (text) => {
    const msg = (text ?? input).trim();
    if (!msg || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: msg }, { role: "assistant", content: "" }]);
    setBusy(true);
    registerChat(sessionId.current, "mohammed");
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
      setMessages((m) => { const c = [...m]; c[c.length - 1] = { role: "assistant", content: tri("Ops, riprova tra poco.", "Ups, versuch es gleich nochmal.", "Oops, please try again shortly.", "Vaya, inténtalo de nuevo en un momento.") }; return c; });
    } finally { setBusy(false); }
  };

  return (
    <div data-testid="mohammed-assistant" className="rounded-2xl bg-gradient-to-br from-[#6E371C] to-[#8C4A27] text-white p-3 mb-4 shadow-md">
      <div className="flex items-center gap-2.5">
        <img src={AVATAR} alt="Mohammadreza Jafari" data-testid="mohammed-avatar" className="w-10 h-10 rounded-xl object-cover ring-1 ring-white/70 shrink-0" onError={(e) => { e.currentTarget.style.display = "none"; }} />
        <div className="min-w-0">
          <h2 className="font-display text-base font-bold leading-tight">{tri("Ciao, sono Mohammadreza 👋", "Hallo, ich bin Mohammadreza 👋", "Hi, I'm Mohammadreza 👋", "Hola, soy Mohammadreza 👋")}</h2>
          <p className="text-[11px] text-white/80 leading-snug">{tri("Assistente di Michele · ti guido nel laboratorio", "Micheles Assistent · ich führe dich durch die Backstube", "Michele's assistant · I guide you in the lab", "Asistente de Michele · te guío en el obrador")}</p>
        </div>
      </div>

      {/* Guida passo-passo del laboratorio */}
      <div data-testid="mohammed-guide" className="mt-2.5 grid grid-cols-1 gap-1">
        {GUIDE.map((g) => (
          <button key={g.n} data-testid={`mohammed-guide-${g.n}`} onClick={() => askGuide(g.q)}
            className="w-full flex items-center gap-2 bg-white/12 hover:bg-white/22 rounded-lg px-2.5 py-1.5 text-left active:scale-98 transition-all">
            <span className="w-5 h-5 rounded-full bg-white/90 text-[#6E371C] font-bold text-[11px] flex items-center justify-center shrink-0">{g.n}</span>
            <span className="text-[13px] font-medium leading-tight">{g.t}</span>
          </button>
        ))}
      </div>

      <button data-testid="mohammed-toggle" onClick={() => setOpen((o) => !o)}
        className="mt-2.5 inline-flex items-center gap-1.5 bg-white/15 hover:bg-white/25 backdrop-blur px-3 py-1.5 rounded-lg text-[13px] font-semibold active:scale-97 transition-all">
        <Sparkles className="w-3.5 h-3.5" /> {open ? tri("Chiudi assistente", "Assistent schließen", "Close assistant", "Cerrar asistente") : tri("Chiedi a Mohammadreza", "Mohammadreza fragen", "Ask Mohammadreza", "Pregunta a Mohammadreza")}
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {open && (
        <div data-testid="mohammed-chat" className="mt-3 bg-white/95 dark:bg-[#1F252B]/95 rounded-2xl p-3">
          <div ref={listRef} className="max-h-72 overflow-y-auto space-y-2 pr-1">
            {messages.length === 0 && (
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s, i) => (
                  <button key={i} data-testid={`mohammed-suggest-${i}`} onClick={() => send(s)}
                    className="text-xs font-medium bg-[#8C4A27]/12 text-[#6E371C] dark:text-[#9ec4b8] border border-[#8C4A27]/30 rounded-full px-3 py-1.5 active:scale-97">
                    {s}
                  </button>
                ))}
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`markdown-body max-w-[85%] rounded-2xl px-3 py-2 text-sm ${m.role === "user" ? "bg-[#8C4A27] text-white" : "bg-[#e4eff8] dark:bg-[#2A323A] text-[#2B303B] dark:text-[#e4eff8]"}`}>
                  {m.role === "assistant" && !m.content ? <Loader2 className="w-4 h-4 animate-spin text-[#8C4A27]" /> : <ReactMarkdown>{m.content}</ReactMarkdown>}
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <input data-testid="mohammed-input" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder={tri("Scrivi a Mohammadreza…", "Schreibe an Mohammadreza…", "Message Mohammadreza…", "Escribe a Mohammadreza…")}
              className="flex-1 bg-[#FAF5EC] dark:bg-[#232A31] border border-[#E6D8C3] dark:border-[#38424B] rounded-xl px-3 py-2.5 text-sm outline-none text-[#2B303B] dark:text-[#e4eff8] focus:border-[#8C4A27]" />
            <button data-testid="mohammed-send" onClick={() => send()} disabled={busy || !input.trim()}
              className="w-11 h-11 rounded-xl bg-[#8C4A27] hover:bg-[#336a94] disabled:opacity-50 text-white flex items-center justify-center active:scale-95 shrink-0">
              {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
