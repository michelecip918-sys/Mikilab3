import { useRef, useState, useCallback } from "react";
import { HeartHandshake, Mic, Send, Loader2, Check, X } from "lucide-react";
import { playTTS } from "@/lib/tts";
import { coordinationApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// "Chiedi aiuto" (testo o voce libera): l'operatore descrive il bisogno, Sitor interpreta,
// conferma prima di agire e usa la coda di coordinamento (/coordination/help/*).
// L'emergenza vera resta gestita dal pulsante SOS separato.
export default function AskHelpButton({ operator = "", dept = "" }) {
  const { lang } = useLang();
  const tri = mkTri(lang);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState(null); // richiesta in attesa di conferma
  const [reply, setReply] = useState("");
  const recRef = useRef(null);

  const say = (m) => { setReply(m); try { playTTS(m, { lang }); } catch { /* */ } };

  const voiceLang = ({ it: "it-IT", de: "de-DE", en: "en-US", es: "es-ES", fr: "fr-FR", fa: "fa-IR" }[lang] || "it-IT");
  const listen = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { say(tri("Voce non supportata: scrivi la richiesta.", "Sprache nicht unterstützt: bitte tippen.", "Voice not supported: type the request.", "Voz no soportada.", "Voix non supportée.", "صدا پشتیبانی نمی‌شود.")); return; }
    const rec = new SR(); rec.lang = voiceLang; rec.interimResults = false; rec.continuous = false;
    rec.onresult = (e) => { setText((e.results[0][0].transcript || "").trim()); };
    rec.onerror = () => { /* rete/permessi: l'operatore può scrivere */ };
    recRef.current = rec; try { rec.start(); } catch { /* */ }
  };

  const parse = useCallback(async () => {
    const clean = text.trim();
    if (!clean || busy) return;
    setBusy(true); setReply("");
    try {
      const p = await coordinationApi.helpParse(clean, lang);
      if (p.emergency) {
        // Emergenza: attiva subito (il backend salta coda e avvisa il Capo). Nessuna conferma.
        const r = await coordinationApi.helpTrigger({ transcript: clean, lang, operator, dept, urgency: "emergency", category: p.category });
        say(r.spoken || ""); setText(""); setPending(null);
      } else if (!p.is_help) {
        say(tri("Non sembra una richiesta d'aiuto. Riprova descrivendo cosa ti serve.", "Das scheint keine Hilfeanfrage zu sein.", "That doesn't look like a help request. Describe what you need.", "No parece una petición de ayuda.", "Cela ne semble pas une demande d'aide.", "به‌نظر درخواست کمک نیست.")); 
      } else {
        setPending({ ...p, transcript: clean });
        say(p.confirm_question || tri("Confermi la richiesta?", "Bestätigst du?", "Confirm the request?", "¿Confirmas?", "Confirmes-tu ?", "تأیید می‌کنی؟"));
      }
    } catch {
      // 10) Rete assente / IA giù: messaggio chiaro, mai silenzio.
      say(tri("Non riesco a capirti ora. Chiedi aiuto direttamente a un collega vicino o al Capo.", "Ich verstehe dich gerade nicht. Frag direkt einen Kollegen oder den Chef.", "I can't understand you now. Ask a colleague nearby or the boss directly.", "No puedo entenderte ahora. Pide ayuda a un compañero o al jefe.", "Je ne te comprends pas. Demande à un collègue ou au chef.", "الان نمی‌فهمم. از همکار یا رئیس کمک بخواه."));
    }
    setBusy(false);
  }, [text, busy, lang, operator, dept, tri]);

  const confirm = useCallback(async () => {
    if (!pending) return;
    setBusy(true);
    try { const r = await coordinationApi.helpTrigger({ transcript: pending.transcript, lang, operator, dept, urgency: pending.urgency, category: pending.category }); say(r.spoken || ""); }
    catch { say(tri("Non riesco ad avviare la chiamata. Chiedi a un collega o al Capo.", "Kann den Ruf nicht starten.", "Can't start the call. Ask a colleague or the boss.", "No puedo iniciar. Pide a un compañero.", "Impossible de lancer.", "نمی‌توانم شروع کنم.")); }
    setPending(null); setText(""); setBusy(false);
  }, [pending, lang, operator, dept, tri]);

  if (!open) {
    return (
      <button type="button" data-testid="ask-help-open" onClick={() => setOpen(true)}
        className="w-full mt-2 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#3E9C93]/15 border border-[#3E9C93]/40 text-[#7fd3c9] font-bold text-[13px] active:scale-95 transition-transform">
        <HeartHandshake className="w-4 h-4" /> {tri("Chiedi aiuto", "Hilfe anfragen", "Ask for help", "Pedir ayuda", "Demander de l'aide", "درخواست کمک")}
      </button>
    );
  }

  return (
    <div data-testid="ask-help-panel" className="mt-2 rounded-xl border border-[#3E9C93]/40 bg-[#0b0f19] p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="flex items-center gap-1.5 text-[12px] font-black text-[#7fd3c9]"><HeartHandshake className="w-3.5 h-3.5" /> {tri("Chiedi aiuto", "Hilfe anfragen", "Ask for help", "Pedir ayuda", "Demander de l'aide", "درخواست کمک")}</p>
        <button data-testid="ask-help-close" onClick={() => { setOpen(false); setPending(null); setText(""); setReply(""); }} className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-[#94A3B8] hover:text-white active:scale-95"><X className="w-4 h-4" /></button>
      </div>
      <p className="text-[11px] text-[#64748B] mb-2">{tri("Descrivi cosa ti serve, es. «le teglie sono finite, vanno lavate».", "Beschreibe, was du brauchst.", "Describe what you need, e.g. \"we're out of trays\".", "Describe lo que necesitas.", "Décris ce dont tu as besoin.", "بگو چه لازم داری.")}</p>
      <div className="flex items-center gap-2">
        <input data-testid="ask-help-input" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && parse()} placeholder={tri("Scrivi o usa il microfono…", "Tippen oder Mikrofon…", "Type or use the mic…", "Escribe o micrófono…", "Écris ou micro…", "بنویس یا میکروفون…")}
          className="flex-1 min-w-0 bg-[#050810] border border-[#334155] rounded-lg px-3 py-2 text-[13px] text-white placeholder:text-[#4b5563]" />
        <button data-testid="ask-help-mic" onClick={listen} className="w-9 h-9 shrink-0 inline-flex items-center justify-center rounded-lg border border-[#334155] text-[#7fd3c9] active:scale-95"><Mic className="w-4 h-4" /></button>
        <button data-testid="ask-help-send" onClick={parse} disabled={busy || !text.trim()} className="w-9 h-9 shrink-0 inline-flex items-center justify-center rounded-lg bg-[#3E9C93] text-white active:scale-95 disabled:opacity-50">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}</button>
      </div>
      {reply && <p data-testid="ask-help-reply" className="mt-2 text-[12.5px] text-[#7fd3c9] leading-relaxed">{reply}</p>}
      {pending && (
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button data-testid="ask-help-confirm" onClick={confirm} disabled={busy} className="inline-flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#7E9A82] text-white font-bold text-[12px] active:scale-95 disabled:opacity-50"><Check className="w-4 h-4" /> {tri("Sì, chiedi", "Ja", "Yes, ask", "Sí", "Oui", "بله")}</button>
          <button data-testid="ask-help-cancel" onClick={() => { setPending(null); say(tri("Annullato.", "Abgebrochen.", "Cancelled.", "Cancelado.", "Annulé.", "لغو شد.")); }} className="inline-flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#2a2a2e] text-[#94A3B8] border border-[#334155] font-bold text-[12px] active:scale-95"><X className="w-4 h-4" /> {tri("No", "Nein", "No", "No", "Non", "خیر")}</button>
        </div>
      )}
    </div>
  );
}
