import { useState, useRef, useEffect } from "react";
import { Send, Loader2, ChefHat, Sparkles, Clock, Thermometer, Wrench, BellRing, Mic, Volume2, VolumeX } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { API } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { parseTimeline, saveReminders } from "@/lib/reminders";
import { cleanForSpeech } from "@/lib/voice";
import { toast } from "sonner";
import { mkTri } from "@/i18n/triMaps";

// Assistente "Mohammadreza" per l'home baker: scheduling inverso + calcoli + troubleshooting.
export default function AcademyCoach() {
  const { lang } = useLang();
  const tri = (i, d, e, s) => mkTri(lang)(i, d, e, s);
  const sidRef = useRef(`academy-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [readAloud, setReadAloud] = useState(false);
  const recRef = useRef(null);
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const speechSupported = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
  const ttsSupported = typeof window !== "undefined" && "speechSynthesis" in window;

  const speak = (raw) => {
    if (!readAloud || !ttsSupported) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(cleanForSpeech(raw));
      u.lang = mkTri(lang)("it-IT", "de-DE", "en-GB", "es-ES");
      u.rate = 1; u.pitch = 1;
      window.speechSynthesis.speak(u);
    } catch { /* ignore */ }
  };

  useEffect(() => () => { try { window.speechSynthesis?.cancel(); } catch { /* */ } }, []);

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
    let full = "";
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
          if (obj.d) { full += obj.d; setMessages((m) => { const c = [...m]; c[c.length - 1] = { role: "assistant", content: c[c.length - 1].content + obj.d }; return c; }); }
        }
      }
      if (!sawDone) { /* stream chiuso */ }
      if (full) speak(full);
    } catch {
      setMessages((m) => { const c = [...m]; c[c.length - 1] = { role: "assistant", content: tri("Ops, riprova tra poco.", "Ups, versuch es gleich nochmal.", "Oops, try again shortly.", "Ups, inténtalo de nuevo.") }; return c; });
    } finally { setBusy(false); }
  };

  const startListening = () => {
    if (!speechSupported) { toast.error(tri("Il microfono non è supportato su questo browser.", "Das Mikrofon wird in diesem Browser nicht unterstützt.", "The microphone is not supported in this browser.", "El micrófono no es compatible con este navegador.")); return; }
    if (listening) { try { recRef.current?.stop(); } catch { /* */ } return; }
    const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new Rec();
    rec.lang = mkTri(lang)("it-IT", "de-DE", "en-GB", "es-ES");
    rec.interimResults = false; rec.maxAlternatives = 1; rec.continuous = false;
    rec.onstart = () => setListening(true);
    rec.onresult = (e) => { const heard = e.results[0][0].transcript; setListening(false); if (heard) ask(heard); };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recRef.current = rec;
    try { rec.start(); } catch { setListening(false); }
  };

  const toggleReadAloud = () => {
    setReadAloud((v) => {
      if (v) { try { window.speechSynthesis?.cancel(); } catch { /* */ } }
      return !v;
    });
  };

  const saveTimeline = async (text) => {
    const steps = parseTimeline(text);
    if (steps.length === 0) { toast.error(tri("Nessun orario trovato nella risposta.", "Keine Uhrzeit gefunden.", "No times found in the answer.", "No se encontraron horarios.")); return; }
    const { count, permission, persistent } = await saveReminders(steps);
    if (persistent) toast.success(tri(`${count} promemoria salvati! Riceverai una notifica ad ogni passo, anche ad app chiusa.`, `${count} Erinnerungen gespeichert! Du bekommst Benachrichtigungen zu jedem Schritt, auch bei geschlossener App.`, `${count} reminders saved! You'll get a notification for each step, even when the app is closed.`, `${count} recordatorios guardados. Recibirás notificaciones en cada paso, incluso con la app cerrada.`));
    else if (permission === "granted") toast.success(tri(`${count} promemoria salvati! Riceverai una notifica ad ogni passo.`, `${count} Erinnerungen gespeichert! Du bekommst zu jedem Schritt eine Benachrichtigung.`, `${count} reminders saved! You'll get a notification for each step.`, `${count} recordatorios guardados. Recibirás una notificación en cada paso.`));
    else toast.success(tri(`${count} promemoria salvati (attiva le notifiche per gli avvisi).`, `${count} Erinnerungen gespeichert (Benachrichtigungen aktivieren).`, `${count} reminders saved (enable notifications for alerts).`, `${count} recordatorios guardados (activa las notificaciones).`));
  };

  const hasTimeline = (txt) => parseTimeline(txt).length > 0;

  return (
    <div data-testid="academy-coach" className="rounded-2xl overflow-hidden bg-white dark:bg-[#1B2A38] border border-[#2A3B49] dark:border-[#2A3B49]">
      <div className="flex items-center gap-3 p-4 text-white" style={{ background: "linear-gradient(135deg,#0f2231,#1B2A38 55%,#3E9C93)" }}>
        <div className="w-11 h-11 rounded-2xl shadow-md border border-amber-900/40 bg-white/20 overflow-hidden flex items-center justify-center shrink-0">
          <img src={`${process.env.PUBLIC_URL}/mohammed-avatar.jpg`} alt="Mohammadreza" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
        </div>
        <div className="min-w-0">
          <p className="font-display text-lg font-bold leading-none">Mohammadreza</p>
          <p className="text-[12px] text-white/90 mt-0.5">{tri("Il tuo Master Baker per la panificazione a casa", "Dein Master Baker fürs Backen zu Hause", "Your Master Baker for home baking", "Tu Master Baker para hornear en casa")}</p>
        </div>
        <ChefHat className="w-5 h-5 ml-auto shrink-0" />
        {ttsSupported && (
          <button data-testid="academy-coach-readaloud" onClick={toggleReadAloud} aria-pressed={readAloud}
            title={tri("Leggi le risposte ad alta voce", "Antworten laut vorlesen", "Read answers aloud", "Leer las respuestas en voz alta")}
            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-all ${readAloud ? "bg-white/30" : "bg-white/10 hover:bg-white/20"}`}>
            {readAloud ? <Volume2 className="w-4.5 h-4.5" /> : <VolumeX className="w-4.5 h-4.5" />}
          </button>
        )}
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
              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#1B2A38] dark:text-[#8FB0C2] bg-[#3E9C93]/10 border border-[#3E9C93]/30 px-2.5 py-1.5 rounded-full active:scale-95 disabled:opacity-50">
              <c.Icon className="w-3.5 h-3.5" /> {c.label}
            </button>
          ))}
        </div>

        {messages.length > 0 && (
          <div className="space-y-3 max-h-[420px] overflow-y-auto" data-testid="academy-coach-thread">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm ${m.role === "user" ? "bg-[#3E9C93] text-white rounded-br-sm" : "bg-[#0E1620] dark:bg-[#1B2A38] text-[#2B303B] dark:text-[#e4eff8] border border-[#2A3B49] dark:border-[#2A3B49] rounded-bl-sm"}`}>
                  {m.role === "assistant" ? (
                    m.content ? <div className="markdown-body leading-relaxed"><ReactMarkdown>{m.content}</ReactMarkdown></div> : <Loader2 className="w-4 h-4 animate-spin text-[#3E9C93]" />
                  ) : <p className="whitespace-pre-line">{m.content}</p>}
                  {m.role === "assistant" && m.content && !busy && hasTimeline(m.content) && (
                    <button data-testid={`academy-save-timeline-${i}`} data-sfx="save" onClick={() => saveTimeline(m.content)}
                      className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold text-white bg-[#3E9C93] hover:bg-[#3E9C93] px-3 py-1.5 rounded-full active:scale-95">
                      <BellRing className="w-3.5 h-3.5" /> {tri("Salva nei promemoria", "In Erinnerungen speichern", "Save to reminders", "Guardar en recordatorios")}
                    </button>
                  )}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>
        )}

        <div className="flex items-center gap-2 pt-1">
          <input data-testid="academy-coach-input" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && ask()}
            placeholder={tri("Scrivi o parla a Mohammadreza…", "Schreib oder sprich mit Mohammadreza…", "Type or talk to Mohammadreza…", "Escribe o habla con Mohammadreza…")}
            className="flex-1 bg-[#0E1620] dark:bg-[#1B2A38] border border-[#2A3B49] dark:border-[#2A3B49] rounded-full px-4 py-2.5 outline-none text-sm text-[#2B303B] dark:text-[#e4eff8] focus:border-[#3E9C93]" />
          {speechSupported && (
            <button data-testid="academy-coach-mic" onClick={startListening} disabled={busy}
              title={tri("Parla con Mohammadreza", "Mit Mohammadreza sprechen", "Talk to Mohammadreza", "Habla con Mohammadreza")}
              className={`w-11 h-11 rounded-full flex items-center justify-center active:scale-90 disabled:opacity-50 shrink-0 transition-all ${listening ? "bg-[#3E9C93] animate-pulse text-white" : "bg-[#3E9C93] hover:bg-[#3E9C93] text-white"}`}>
              <Mic className="w-5 h-5" />
            </button>
          )}
          <button data-testid="academy-coach-send" data-sfx="confirm" onClick={() => ask()} disabled={busy || !input.trim()} className="w-11 h-11 rounded-full bg-[#3E9C93] text-white flex items-center justify-center active:scale-90 disabled:opacity-50 shrink-0">
            {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
        {listening && (
          <p data-testid="academy-coach-listening" className="text-[12px] text-[#3E9C93] font-semibold text-center pt-1">
            {tri("Sto ascoltando… parla pure.", "Ich höre zu… sprich einfach.", "Listening… go ahead.", "Escuchando… habla.")}
          </p>
        )}
      </div>
    </div>
  );
}
