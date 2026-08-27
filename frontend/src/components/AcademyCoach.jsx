import { useState, useRef, useEffect } from "react";
import { Send, Loader2, ChefHat, Sparkles, Clock, Thermometer, Wrench } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { API } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";

// Assistente "Mohammadreza" per l'home baker: scheduling inverso + calcoli + troubleshooting.
export default function AcademyCoach() {
  const { lang } = useLang();
  const tri = (i, d, e, s) => (lang === "de" ? d : lang === "es" ? (s ?? e ?? i) : lang === "en" ? (e ?? i) : i);
  const sidRef = useRef(`academy-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const CHIPS = [
    { Icon: Clock, label: tri("Calcola orari a ritroso", "Zeiten rückwärts rechnen", "Backwards timeline", "Horarios a la inversa"),
      text: tri(
        "Voglio sfornare del pane domenica alle 12:30. Ho una pasta madre e voglio maturazione in frigo. Calcolami la timeline a ritroso passo per passo con giorni e orari.",
        "Ich möchte Sonntag um 12:30 Brot backen. Ich habe Sauerteig und möchte kühle Gare im Kühlschrank. Berechne die Timeline rückwärts, Schritt für Schritt mit Tagen und Uhrzeiten.",
        "I want to bake bread on Sunday at 12:30. I have sourdough and want a cold fridge proof. Calculate the timeline backwards, step by step with days and times.",
        "Quiero hornear pan el domingo a las 12:30. Tengo masa madre y quiero fermentación en frío. Calcula la línea de tiempo a la inversa, paso a paso con días y horas.") },
    { Icon: Thermometer, label: tri("Temperatura acqua", "Wassertemperatur", "Water temperature", "Temperatura del agua"),
      text: tri(
        "In cucina ci sono 24°C. Che temperatura deve avere l'acqua per un impasto al 70% di idratazione con lievito di birra? Spiegami il calcolo.",
        "In der Küche sind 24°C. Welche Wassertemperatur brauche ich für einen Teig mit 70% Hydratation und Hefe? Erkläre die Rechnung.",
        "It's 24°C in my kitchen. What water temperature do I need for a 70% hydration dough with yeast? Explain the calculation.",
        "En la cocina hay 24°C. ¿Qué temperatura debe tener el agua para una masa al 70% de hidratación con levadura? Explícame el cálculo.") },
    { Icon: Wrench, label: tri("Difetto del pane", "Brotfehler", "Bread fault", "Defecto del pan"),
      text: tri(
        "Il mio pane esce piatto e con la mollica gommosa. Cosa sbaglio? Dammi causa e rimedio.",
        "Mein Brot wird flach und die Krume gummig. Was mache ich falsch? Gib mir Ursache und Lösung.",
        "My bread comes out flat with a gummy crumb. What am I doing wrong? Give me cause and fix.",
        "Mi pan sale plano y con miga gomosa. ¿Qué hago mal? Dame causa y solución.") },
  ];

  const ask = async (q) => {
    const text = (q ?? input).trim();
    if (!text || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }, { role: "assistant", content: "" }]);
    setBusy(true);
    let sawDone = false;
    try {
      const res = await fetch(`${API}/academy/coach`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sidRef.current, message: text, lang }),
      });
      const reader = res.body.getReader(); const decoder = new TextDecoder(); let buffer = "";
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n"); buffer = parts.pop();
        for (const part of parts) {
          const line = part.replace(/^data: ?/, "").trim(); if (!line) continue;
          let obj; try { obj = JSON.parse(line); } catch { continue; }
          if (obj.done) { sawDone = true; continue; }
          if (obj.d) setMessages((m) => { const c = [...m]; c[c.length - 1] = { role: "assistant", content: c[c.length - 1].content + obj.d }; return c; });
        }
      }
      if (!sawDone) { /* stream chiuso */ }
    } catch {
      setMessages((m) => { const c = [...m]; c[c.length - 1] = { role: "assistant", content: tri("Ops, riprova tra poco.", "Ups, versuch es gleich nochmal.", "Oops, try again shortly.", "Ups, inténtalo de nuevo.") }; return c; });
    } finally { setBusy(false); }
  };

  return (
    <div data-testid="academy-coach" className="rounded-2xl overflow-hidden bg-white dark:bg-[#232A31] border border-[#d5e4f0] dark:border-[#38424B]">
      <div className="flex items-center gap-3 p-4 text-white" style={{ background: "linear-gradient(135deg,#0f2231,#123c4a 55%,#a9772f)" }}>
        <div className="w-11 h-11 rounded-xl bg-white/20 overflow-hidden flex items-center justify-center shrink-0">
          <img src={`${process.env.PUBLIC_URL}/mohammed-avatar.jpg`} alt="Mohammadreza" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
        </div>
        <div className="min-w-0">
          <p className="font-display text-lg font-bold leading-none">Mohammadreza</p>
          <p className="text-[12px] text-white/90 mt-0.5">{tri("Il tuo Master Baker per la panificazione a casa", "Dein Master Baker fürs Backen zu Hause", "Your Master Baker for home baking", "Tu Master Baker para hornear en casa")}</p>
        </div>
        <ChefHat className="w-5 h-5 ml-auto shrink-0" />
      </div>

      <div className="p-4 space-y-3">
        {messages.length === 0 && (
          <div data-testid="academy-coach-intro" className="text-sm text-[#3F4A54] dark:text-[#AEB8BF] leading-relaxed">
            {tri("Ciao! Dimmi cosa vuoi sfornare e quando, oppure raccontami un problema dell'impasto. Calcolo orari a ritroso, temperatura dell'acqua e ti do rimedi tecnici.",
              "Hallo! Sag mir, was du backen willst und wann, oder beschreibe ein Teigproblem. Ich rechne Zeiten rückwärts, die Wassertemperatur und gebe technische Lösungen.",
              "Hi! Tell me what you want to bake and when, or describe a dough problem. I calculate timelines backwards, water temperature and give technical fixes.",
              "¡Hola! Dime qué quieres hornear y cuándo, o cuéntame un problema de la masa. Calculo horarios a la inversa, temperatura del agua y te doy soluciones técnicas.")}
          </div>
        )}
        <div className="flex flex-wrap gap-1.5">
          {CHIPS.map((c, i) => (
            <button key={i} data-testid={`academy-chip-${i}`} onClick={() => ask(c.text)} disabled={busy}
              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#123c4a] dark:text-[#8FB0C2] bg-[#3f7cac]/10 border border-[#3f7cac]/30 px-2.5 py-1.5 rounded-full active:scale-95 disabled:opacity-50">
              <c.Icon className="w-3.5 h-3.5" /> {c.label}
            </button>
          ))}
        </div>

        {messages.length > 0 && (
          <div className="space-y-3 max-h-[420px] overflow-y-auto" data-testid="academy-coach-thread">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm ${m.role === "user" ? "bg-[#3f7cac] text-white rounded-br-sm" : "bg-[#f0f6fb] dark:bg-[#1F252B] text-[#2B303B] dark:text-[#e4eff8] border border-[#d5e4f0] dark:border-[#38424B] rounded-bl-sm"}`}>
                  {m.role === "assistant" ? (
                    m.content ? <div className="markdown-body leading-relaxed"><ReactMarkdown>{m.content}</ReactMarkdown></div> : <Loader2 className="w-4 h-4 animate-spin text-[#3f7cac]" />
                  ) : <p className="whitespace-pre-line">{m.content}</p>}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>
        )}

        <div className="flex items-center gap-2 pt-1">
          <input data-testid="academy-coach-input" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && ask()}
            placeholder={tri("Scrivi a Mohammadreza…", "Schreib Mohammadreza…", "Message Mohammadreza…", "Escribe a Mohammadreza…")}
            className="flex-1 bg-[#f0f6fb] dark:bg-[#1F252B] border border-[#d5e4f0] dark:border-[#38424B] rounded-full px-4 py-2.5 outline-none text-sm text-[#2B303B] dark:text-[#e4eff8] focus:border-[#3f7cac]" />
          <button data-testid="academy-coach-send" data-sfx="confirm" onClick={() => ask()} disabled={busy || !input.trim()} className="w-11 h-11 rounded-full bg-[#3f7cac] text-white flex items-center justify-center active:scale-90 disabled:opacity-50 shrink-0">
            {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
