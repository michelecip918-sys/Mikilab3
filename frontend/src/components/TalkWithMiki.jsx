import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { MessageCircle, Send, X, Mic, Volume2, Square, Loader2, Sparkles, Truck, GraduationCap, ArrowLeftRight } from "lucide-react";
import { API } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { playTTS, stopTTS } from "@/lib/tts";
import { cleanForSpeech } from "@/lib/voice";

const sid = () => {
  let s = localStorage.getItem("mikilab_miki_sid");
  if (!s) { s = "miki-" + Math.random().toString(36).slice(2, 10); localStorage.setItem("mikilab_miki_sid", s); }
  return s;
};
const AV = (f) => `${process.env.PUBLIC_URL}/${f}`;

// Aptica sincronizzata con la voce (mod. 56)
function startHaptic() { try { if (navigator.vibrate) { const id = setInterval(() => navigator.vibrate(35), 220); return id; } } catch { /* */ } return null; }
function stopHaptic(id) { try { if (id) clearInterval(id); navigator.vibrate && navigator.vibrate(0); } catch { /* */ } }

const LAB_OPS = [
  { t: "Pulizia teglie & stampi", d: "Ciclo di sanificazione e rotazione utensili." },
  { t: "Gestione carrelli", d: "Parcheggio e buffer dei rack tra i forni." },
  { t: "Infornata sincronizzata", d: "Sformata a onde con due operatori." },
];
const TRAIN_CMDS = [
  { cmd: "Miki, avvia impastatrice due", fb: "Perfetto. Impastatrice due avviata: dì «quanto manca» quando vuoi." },
  { cmd: "Miki, quanto manca", fb: "Ti rispondo con il tempo residuo di ogni timer attivo." },
  { cmd: "Miki, ferma il forno", fb: "Ottimo comando. Fermo il forno all'istante, mani libere." },
];

export default function TalkWithMiki({ tab }) {
  const { lang } = useLang();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState("chat");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [opIdx, setOpIdx] = useState(0);
  const [trainIdx, setTrainIdx] = useState(0);
  const [copilot, setCopilot] = useState(() => localStorage.getItem("mikilab_copilot") || "trio");
  const [handoff, setHandoff] = useState(false);
  const [continuous, setContinuous] = useState(false);
  const [micError, setMicError] = useState("");
  const listRef = useRef(null);
  const hapticRef = useRef(null);
  const recRef = useRef(null);
  const contRef = useRef(false);
  const sessionId = useRef(sid());

  const pickCopilot = (c) => {
    setCopilot(c); try { localStorage.setItem("mikilab_copilot", c); } catch { /* */ }
    setHandoff(true); setTimeout(() => setHandoff(false), 900);
    if (c !== "chat") setView("chat");
  };

  useEffect(() => { if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight; }, [messages, open, view]);
  useEffect(() => { if (view !== "mikemix") return; const t = setInterval(() => setOpIdx((i) => (i + 1) % LAB_OPS.length), 2600); return () => clearInterval(t); }, [view]);

  // Visibile solo in Home e Impara; sparisce nella dashboard Laboratorio e altrove
  if (!["home", "imparacon"].includes(tab)) return null;

  const speak = (text, who) => {
    const clean = cleanForSpeech(text || "");
    if (!clean) return;
    const voice = who === "mikemix" ? "mikemix" : who === "bigmix" ? "bakemix" : "michele";
    playTTS(clean, {
      lang, voice,
      onStart: () => { setSpeaking(true); hapticRef.current = startHaptic(); },
      onEnded: () => { setSpeaking(false); stopHaptic(hapticRef.current); },
    });
  };
  const stopSpeak = () => { stopTTS(); setSpeaking(false); stopHaptic(hapticRef.current); };

  const detectSupport = (q) => {
    const s = q.toLowerCase();
    if (/(pulizia|carrell|teglie|stampi|inforn|sforma|operazion|banco|magazzino)/.test(s)) return "mikemix";
    if (/(comando|vocale|voce|hands|mani libere|robot|ia|sensore|tecnolog|allen)/.test(s)) return "bigmix";
    return null;
  };

  const send = async (text) => {
    const msg = (text ?? input).trim();
    if (!msg || busy) return;
    setInput("");
    const replyWho = copilot === "trio" ? "miki" : copilot;
    const HINT = {
      mikemix: "[Rispondi in prima persona come Mike Mix, il braccio destro persiano del laboratorio] ",
      bigmix: "[Rispondi in prima persona come MikeMix, l'assistente robot di MikiLab] ",
      miki: "", trio: "",
    };
    setMessages((m) => [...m, { who: "user", content: msg }, { who: replyWho, content: "" }]);
    setBusy(true);
    const support = copilot === "trio" ? detectSupport(msg) : null;
    try {
      const res = await fetch(`${API}/miki/chat`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ session_id: sessionId.current, message: (HINT[copilot] || "") + msg, lang }),
      });
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "", full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n"); buffer = parts.pop();
        for (const part of parts) {
          const line = part.replace(/^data: ?/, "").trim();
          if (!line) continue;
          let obj; try { obj = JSON.parse(line); } catch { continue; }
          if (obj.d) { full += obj.d; setMessages((m) => { const c = [...m]; c[c.length - 1] = { who: replyWho, content: full }; return c; }); }
        }
      }
      speak(full, replyWho);
      if (support) {
        const note = support === "mikemix"
          ? { who: "mikemix", content: "Ci penso io in laboratorio: tocca «Lab Live» per vedermi all'opera." }
          : { who: "bigmix", content: "Vuoi allenarti coi comandi vocali? Apri il mio Training." };
        setMessages((m) => [...m, note]);
      }
    } catch {
      setMessages((m) => { const c = [...m]; c[c.length - 1] = { who: replyWho, content: "Ops, riprova tra poco." }; return c; });
    } finally { setBusy(false); }
  };

  // Ascolto continuo naturale (mod. 63/64): nessuna parola chiave, basta parlare
  const toggleContinuous = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { return; }
    if (continuous) {
      contRef.current = false; setContinuous(false);
      try { recRef.current && recRef.current.stop(); } catch { /* */ }
      return;
    }
    contRef.current = true; setContinuous(true);
    const rec = new SR();
    rec.lang = lang === "de" ? "de-DE" : lang === "en" ? "en-US" : "it-IT";
    rec.continuous = true; rec.interimResults = false;
    rec.onresult = (e) => { const t = e.results[e.results.length - 1][0].transcript.trim(); if (t) { setMicError(""); send(t); } };
    rec.onend = () => { if (contRef.current) { try { rec.start(); } catch { /* */ } } else setListening(false); };
    rec.onstart = () => setListening(true);
    rec.onerror = (ev) => {
      // Fallback automatico: cuffia Bluetooth persa / microfono non disponibile / rumore alto
      if (["not-allowed", "audio-capture", "service-not-allowed"].includes(ev.error)) {
        contRef.current = false; setContinuous(false); setListening(false);
        setMicError("Microfono o cuffia non disponibili: continua pure scrivendo qui sotto.");
      } else if (ev.error === "network") {
        setMicError("Connessione instabile: ho messo in pausa l'ascolto, usa la tastiera se serve.");
      }
      // no-speech / rumore: onend riavvia in automatico
    };
    recRef.current = rec;
    try { rec.start(); } catch { /* */ }
  };

  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setInput(""); return; }
    const rec = new SR();
    rec.lang = lang === "de" ? "de-DE" : lang === "en" ? "en-US" : "it-IT";
    rec.interimResults = false;
    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onresult = (e) => { const t = e.results[0][0].transcript; setListening(false); send(t); };
    rec.onerror = () => setListening(false);
    try { rec.start(); } catch { setListening(false); }
  };

  const AVATARS = { miki: "avatar_miki.jpg", mikemix: "avatar_mikemix.jpg", bigmix: "avatar_bigmix.jpg" };
  const ACCENT = { miki: "#E0A106", mikemix: "#3E9C93", bigmix: "#6EA8FE" };

  return (
    <>
      {/* Launcher fluttuante Miki */}
      {!open && (
        <button data-testid="talk-miki-launcher" onClick={() => { setOpen(true); try { window.speechSynthesis && window.speechSynthesis.getVoices(); } catch { /* warm-up voci per latenza minima */ } }}
          className="fixed z-[60] bottom-24 right-4 w-16 h-16 rounded-full overflow-hidden border-2 border-[#E0A106] shadow-2xl active:scale-95 transition-transform"
          style={{ boxShadow: "0 0 24px rgba(224,161,6,.5)" }} aria-label="Talk with Miki">
          <img src={AV("avatar_miki.jpg")} alt="Miki" className="w-full h-full object-cover object-top" />
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#3E9C93] border-2 border-slate-900 flex items-center justify-center"><MessageCircle className="w-2.5 h-2.5 text-white" /></span>
        </button>
      )}

      {open && (
        <div data-testid="talk-miki-panel" className="fixed z-[65] bottom-0 right-0 left-0 sm:left-auto sm:bottom-4 sm:right-4 sm:w-[400px] bg-slate-900 border border-slate-700 sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
          {/* Header con tab dei 3 personaggi */}
          <div className="flex items-center gap-2 p-3 border-b border-slate-800 bg-slate-950">
            {["chat", "mikemix", "bigmix"].map((v) => {
              const key = v === "chat" ? "miki" : v;
              return (
                <button key={v} data-testid={`talk-tab-${v}`} onClick={() => setView(v)}
                  className={`flex items-center gap-1.5 rounded-full pl-1 pr-2.5 py-1 border transition-all ${view === v ? "bg-slate-800" : "opacity-60"}`}
                  style={{ borderColor: view === v ? ACCENT[key] : "transparent" }}>
                  <img src={AV(AVATARS[key])} alt="" className="w-6 h-6 rounded-full object-cover object-top" />
                  <span className="text-[11px] font-bold" style={{ color: ACCENT[key] }}>{v === "chat" ? "MikiLab" : v === "mikemix" ? "Mike Mix" : "Mike Mix AI"}</span>
                </button>
              );
            })}
            <span data-testid="intercom-live" className="ms-auto flex items-center gap-1 text-[9px] font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-2 py-0.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> INTERCOM LIVE</span>
            <button data-testid="talk-miki-close" onClick={() => { stopSpeak(); setOpen(false); }} className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center"><X className="w-4 h-4" /></button>
          </div>

          {/* Dynamic Handoff animation */}
          {handoff && (
            <div data-testid="dynamic-handoff" className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/70 pointer-events-none">
              <div className="splash-glitch font-cyber text-lg font-black text-[#3E9C93] flex items-center gap-2"><ArrowLeftRight className="w-5 h-5" /> HANDOFF</div>
            </div>
          )}

          {/* VISTA CHAT MIKI */}
          {view === "chat" && (
            <>
              <div ref={listRef} className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[240px]">
                {messages.length === 0 && (
                  <div className="text-center py-6">
                    <img src={AV("avatar_miki.jpg")} alt="MikiLab" className="w-20 h-20 rounded-2xl object-cover object-top mx-auto border-2 border-[#E0A106]/60" />
                    <p className="mt-3 text-sm text-slate-200 font-bold">Ciao, sono MikiLab 👋</p>
                    <p className="text-[12px] text-slate-400 px-4 mt-1">Chiedimi come MikiLab aiuta i panettieri, o qualsiasi cosa sul laboratorio. Parla o scrivi.</p>
                    <div className="flex flex-wrap gap-1.5 justify-center mt-3 px-2">
                      {["Come mi aiuta MikiLab?", "Come funziona la Modalità Chef?", "Cos'è il Thermal Guard?"].map((s, i) => (
                        <button key={i} data-testid={`talk-suggest-${i}`} onClick={() => send(s)} className="text-[11px] bg-[#E0A106]/12 text-[#E0A106] border border-[#E0A106]/30 rounded-full px-2.5 py-1">{s}</button>
                      ))}
                    </div>
                  </div>
                )}
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.who === "user" ? "justify-end" : "justify-start"} items-end gap-1.5`}>
                    {m.who !== "user" && <img src={AV(AVATARS[m.who] || AVATARS.miki)} alt="" className="w-6 h-6 rounded-full object-cover object-top shrink-0" />}
                    <div className={`markdown-body max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.who === "user" ? "bg-[#E0A106] text-slate-900" : m.who === "mikemix" ? "bg-[#12241f] text-[#bfe3da] border border-[#3E9C93]/30" : m.who === "bigmix" ? "bg-[#131b2e] text-[#c6d8ff] border border-[#6EA8FE]/30" : "bg-slate-800 text-slate-100"}`}>
                      {m.who === "miki" && !m.content ? <Loader2 className="w-4 h-4 animate-spin text-[#E0A106]" /> : <ReactMarkdown>{m.content}</ReactMarkdown>}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-slate-800 space-y-2">
                {/* Selettore Co-Pilota */}
                <div data-testid="copilot-selector" className="flex items-center gap-1">
                  {[["trio", "Trio"], ["miki", "MikiLab"], ["mikemix", "Mike Mix"], ["bigmix", "Mike Mix AI"]].map(([id, lbl]) => (
                    <button key={id} data-testid={`copilot-${id}`} onClick={() => pickCopilot(id)}
                      className={`flex-1 text-[10px] font-bold py-1.5 rounded-lg border transition-all ${copilot === id ? "bg-[#3E9C93] text-slate-900 border-[#3E9C93]" : "text-slate-400 border-slate-700"}`}>{lbl}</button>
                  ))}
                </div>
                <button data-testid="talk-continuous" onClick={toggleContinuous} className={`w-full inline-flex items-center justify-center gap-1.5 text-[11px] font-bold py-1.5 rounded-lg border ${continuous ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50" : "text-slate-400 border-slate-700"}`}>
                  <Mic className="w-3.5 h-3.5" /> {continuous ? "Ascolto continuo attivo · parla pure" : "Attiva ascolto continuo (senza parole chiave)"}
                </button>
                {micError && <p data-testid="talk-mic-error" className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg px-2.5 py-1.5">{micError}</p>}
                {speaking && (
                  <button data-testid="talk-stop-voice" onClick={stopSpeak} className="w-full inline-flex items-center justify-center gap-1.5 bg-slate-800 text-slate-300 text-xs font-bold py-1.5 rounded-lg"><Square className="w-3.5 h-3.5" /> Ferma la voce di Miki</button>
                )}
                <div className="flex items-center gap-2">
                  <button data-testid="talk-mic" onClick={startVoice} className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${listening ? "bg-rose-500 animate-pulse" : "bg-slate-800"}`}><Mic className="w-5 h-5 text-white" /></button>
                  <input data-testid="talk-input" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}
                    placeholder="Scrivi o parla a Miki…" className="flex-1 bg-slate-950 border border-slate-700 rounded-full px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-[#E0A106]" />
                  <button data-testid="talk-send" onClick={() => send()} disabled={busy || !input.trim()} className="w-11 h-11 rounded-full bg-[#E0A106] disabled:opacity-50 text-slate-900 flex items-center justify-center shrink-0">{busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}</button>
                </div>
              </div>
            </>
          )}

          {/* VISTA MIKE MIX · LAB LIVE (mod. 57) */}
          {view === "mikemix" && (
            <div data-testid="mikemix-lab-live" className="flex-1 overflow-y-auto p-4">
              <div className="relative rounded-2xl overflow-hidden border border-[#3E9C93]/40 aspect-video bg-slate-950">
                <img src={AV("avatar_mikemix.jpg")} alt="Mike Mix" className="w-full h-full object-cover" style={{ animation: "cyberGlitch 4s steps(6) infinite" }} />
                <span className="absolute top-2 left-2 flex items-center gap-1 text-[10px] font-bold text-rose-300 bg-black/60 px-2 py-0.5 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" /> LIVE</span>
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                  <p className="text-sm font-bold text-white flex items-center gap-1.5"><Truck className="w-4 h-4 text-[#3E9C93]" /> {LAB_OPS[opIdx].t}</p>
                  <p className="text-[11px] text-slate-300">{LAB_OPS[opIdx].d}</p>
                  <div className="mt-1.5 h-1 rounded-full bg-slate-700 overflow-hidden"><div className="h-full bg-[#3E9C93]" style={{ width: "100%", animation: "peelShine 2.6s linear infinite" }} /></div>
                </div>
              </div>
              <p className="text-[12px] text-slate-400 mt-3">Mike Mix esegue le operazioni reali del laboratorio: pulizia, gestione carrelli e infornata sincronizzata.</p>
              <button data-testid="mikemix-narrate" onClick={() => speak(`${LAB_OPS[opIdx].t}. ${LAB_OPS[opIdx].d}`, "mikemix")} className="mt-2 inline-flex items-center gap-1.5 bg-[#3E9C93]/15 border border-[#3E9C93]/40 text-[#3E9C93] px-3 py-1.5 rounded-full text-xs font-bold"><Volume2 className="w-3.5 h-3.5" /> Racconta l'operazione</button>
            </div>
          )}

          {/* VISTA BIG MIX AI · INTERACTIVE TRAINING (mod. 58) */}
          {view === "bigmix" && (
            <div data-testid="bigmix-training" className="flex-1 overflow-y-auto p-4 text-center">
              <img src={AV("avatar_bigmix.jpg")} alt="MikeMix" className="w-24 h-24 rounded-2xl object-cover mx-auto border-2 border-[#6EA8FE]/60" style={{ boxShadow: "0 0 20px rgba(110,168,254,.5)" }} />
              <p className="mt-3 text-sm font-bold text-[#6EA8FE] flex items-center justify-center gap-1.5"><GraduationCap className="w-4 h-4" /> Training comandi Hands-Free</p>
              <p className="text-[12px] text-slate-400 mt-1">Passo {trainIdx + 1} di {TRAIN_CMDS.length}</p>
              <div className="mt-4 rounded-2xl bg-slate-950 border border-[#6EA8FE]/30 p-4">
                <p className="text-[11px] text-slate-500 uppercase tracking-wide">Ripeti a voce</p>
                <p className="text-lg font-bold text-white mt-1">“{TRAIN_CMDS[trainIdx].cmd}”</p>
              </div>
              <div className="flex items-center justify-center gap-2 mt-4">
                <button data-testid="bigmix-say" onClick={() => speak(`Ripeti dopo di me. ${TRAIN_CMDS[trainIdx].cmd}`, "bigmix")} className="inline-flex items-center gap-1.5 bg-slate-800 text-slate-200 px-3 py-2 rounded-full text-xs font-bold"><Volume2 className="w-3.5 h-3.5" /> Ascolta</button>
                <button data-testid="bigmix-next" onClick={() => { speak(TRAIN_CMDS[trainIdx].fb, "bigmix"); setTrainIdx((i) => (i + 1) % TRAIN_CMDS.length); }} className="inline-flex items-center gap-1.5 bg-[#6EA8FE] text-slate-900 px-3 py-2 rounded-full text-xs font-bold"><Sparkles className="w-3.5 h-3.5" /> Ho provato</button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
