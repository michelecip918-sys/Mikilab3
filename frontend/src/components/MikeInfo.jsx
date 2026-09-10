import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Info, Mic, Send, Loader2, X, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { masterApi } from "@/lib/api";
import { playTTS } from "@/lib/tts";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

const SR_LOCALE = { it: "it-IT", de: "de-DE", en: "en-US", es: "es-ES", fr: "fr-FR", fa: "fa-IR", ar: "ar-SA", tr: "tr-TR" };

// Trigger "i" Sitor: governance Master-centrica contestuale. Il Master parla o scrive,
// Sitor interpreta ed ESEGUE (delega linea, crea/elimina sezione) senza form.
export default function MikeInfo({ context = "" }) {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [reply, setReply] = useState("");
  const [listening, setListening] = useState(false);
  const recRef = useRef(null);
  const supported = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);

  const send = async (cmd) => {
    const c = (cmd || text).trim();
    if (!c) return;
    setBusy(true); setReply("");
    try {
      const r = await masterApi.govern(c, lang);
      setReply(r.reply || "");
      try { playTTS(r.reply || "", { lang, voice: "bakemix" }); } catch { /* */ }
      if (r.executed) {
        toast.success("Sitor", { description: r.reply });
        try { window.dispatchEvent(new Event("mikilab-govern-executed")); } catch { /* */ }
        setText("");
      }
    } catch (e) {
      const msg = (e && e.response && e.response.status === 401) ? tri("Solo il Master può governare la struttura.", "Nur der Master darf steuern.", "Only the Master can govern the structure.", "Solo el Master puede gobernar.", "Seul le Master peut gouverner.", "فقط مستر می‌تواند مدیریت کند.") : tri("Errore comando", "Fehler", "Command error", "Error", "Erreur", "خطا");
      setReply(msg); toast.error(msg);
    } finally { setBusy(false); }
  };

  const listen = () => {
    if (!supported) return;
    if (listening && recRef.current) { try { recRef.current.stop(); } catch { /* */ } return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = SR_LOCALE[lang] || "it-IT"; rec.interimResults = false; rec.maxAlternatives = 1;
    rec.onstart = () => setListening(true);
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.onresult = (ev) => { const t = ev.results?.[0]?.[0]?.transcript || ""; if (t) { setText(t); send(t); } };
    recRef.current = rec;
    try { rec.start(); } catch { setListening(false); }
  };

  return (
    <>
      <button data-testid="mike-info-trigger" onClick={() => setOpen(true)} title="Sitor"
        className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#06b6d4]/15 border border-[#06b6d4]/50 text-[#06b6d4] active:scale-90 transition-all hover:bg-[#06b6d4]/25">
        <Info className="w-4 h-4" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/60 p-3"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)}>
            <motion.div data-testid="mike-info-panel" onClick={(e) => e.stopPropagation()}
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              className="w-full max-w-md rounded-2xl bg-[#0b0f19] border border-[#06b6d4]/40 shadow-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#06b6d4]" />
                  <div>
                    <h3 className="text-sm font-extrabold text-[#06b6d4]">Sitor{context ? ` · ${context}` : ""}</h3>
                    <p className="text-[11px] text-[#94A3B8]">{tri("Comanda a voce: delego, creo o modifico all'istante.", "Sprich: ich delegiere, erstelle oder ändere sofort.", "Speak: I delegate, create or change instantly.", "Habla: delego, creo o cambio al instante.", "Parle : je délègue, crée ou modifie à l'instant.", "بگو: فوری واگذار، می‌سازم یا تغییر می‌دهم.")}</p>
                  </div>
                </div>
                <button data-testid="mike-info-close" onClick={() => setOpen(false)} className="w-8 h-8 rounded-full bg-[#0f172a] border border-[#1e293b] text-[#94A3B8] flex items-center justify-center"><X className="w-4 h-4" /></button>
              </div>

              <p className="text-[11px] text-[#64748B]">{tri("Es.: «Assegna la linea baguette ad Antonio» · «Crea sezione Controllo Allergeni»", "Z.B.: «Weise die Baguette-Linie Antonio zu»", "E.g.: \u00abAssign the baguette line to Antonio\u00bb", "Ej.: \u00abAsigna la línea baguette a Antonio\u00bb", "Ex. : \u00abAssigne la ligne baguette à Antonio\u00bb", "مثلاً: «خط باگت را به آنتونیو بده»")}</p>

              <div className="flex items-center gap-2">
                <button data-testid="mike-info-mic" onClick={listen} disabled={!supported || busy}
                  className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center border transition-all ${listening ? "bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse" : "bg-[#06b6d4]/15 border-[#06b6d4]/50 text-[#06b6d4]"} disabled:opacity-40`}>
                  <Mic className="w-5 h-5" />
                </button>
                <input data-testid="mike-info-input" value={text} onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") send(); }}
                  placeholder={tri("Scrivi o parla…", "Schreib oder sprich…", "Type or speak…", "Escribe o habla…", "Écris ou parle…", "بنویس یا بگو…")}
                  className="flex-1 min-w-0 bg-[#030712] border border-[#1e293b] rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-[#06b6d4]" />
                <button data-testid="mike-info-send" onClick={() => send()} disabled={busy || !text.trim()}
                  className="shrink-0 w-11 h-11 rounded-xl bg-[#06b6d4] text-[#030712] flex items-center justify-center disabled:opacity-40 active:scale-95">
                  {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </div>

              {reply && <div data-testid="mike-info-reply" className="rounded-xl bg-[#06b6d4]/8 border border-[#06b6d4]/30 p-3 text-sm text-[#cbd5e1]">{reply}</div>}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
