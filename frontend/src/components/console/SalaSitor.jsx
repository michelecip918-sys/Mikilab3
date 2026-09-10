import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Camera, Mail, Type, Send, Loader2, Volume2, StopCircle, Factory, CheckCircle2, Trash2, Sparkles, MessageSquareText, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { deusApi, uploadApi } from "@/lib/api";
import { playTTS } from "@/lib/tts";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { NexusAvatar } from "@/components/NexusAvatar";
import LivingAvatar3D from "@/components/LivingAvatar3D";
import MikeSuggestions from "@/components/console/MikeSuggestions";
import MikeAlerts from "@/components/MikeAlerts";
import FloorChangeApprovals from "@/components/console/FloorChangeApprovals";

// SALA SITOR — l'UNICO luogo d'incontro tra il Capo e Sitor (Dio dell'Arte Bianca).
// Qui il Capo scrive, detta, allega foto/email, dà ordini e riceve tutto: risposte,
// produzione generata, suggerimenti e allarmi. Nessun altro punto di dialogo esiste.
export default function SalaSitor() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [msgs, setMsgs] = useState([]);
  const [mode, setMode] = useState("text");
  const [intent, setIntent] = useState("ordine");
  const [text, setText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageB64, setImageB64] = useState("");
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [queue, setQueue] = useState([]);
  const [counts, setCounts] = useState({ total: 0, pending: 0, by_sector: {} });
  const [bond, setBond] = useState(null);
  const recogRef = useRef(null);
  const listRef = useRef(null);

  const speak = (t) => { try { if (t) playTTS(t, { lang, voice: "nexus" }); } catch { /* */ } };
  const push = (who, txt) => setMsgs((m) => [...m.slice(-19), { who, text: txt, id: Date.now() + Math.random() }]);

  const loadQueue = useCallback(() => {
    deusApi.productionQueue().then((d) => { setQueue(d.tasks || []); setCounts(d.counts || { total: 0, pending: 0, by_sector: {} }); }).catch(() => {});
  }, []);
  useEffect(() => { loadQueue(); deusApi.bond(lang).then(setBond).catch(() => {}); }, [loadQueue, lang]);
  useEffect(() => { if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight; }, [msgs]);

  const MODES = [
    { key: "text", Icon: Type, label: tri("Testo", "Text", "Text", "Texto", "Texte", "متن") },
    { key: "voice", Icon: Mic, label: tri("Voce", "Sprache", "Voice", "Voz", "Voix", "صدا") },
    { key: "photo", Icon: Camera, label: tri("Foto", "Foto", "Photo", "Foto", "Photo", "عکس") },
    { key: "email", Icon: Mail, label: "Email" },
  ];

  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { toast.error(tri("Dettatura non supportata: scrivi pure.", "Diktat nicht unterstützt.", "Dictation not supported: type instead.", "Dictado no soportado.", "Dictée non supportée.", "دیکته پشتیبانی نمی‌شود.")); setMode("text"); return; }
    const r = new SR();
    r.lang = { it: "it-IT", de: "de-DE", en: "en-US", es: "es-ES", fr: "fr-FR", fa: "fa-IR" }[String(lang).slice(0, 2)] || "it-IT";
    r.interimResults = true; r.continuous = true;
    let acc = text ? text + " " : "";
    r.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const tr = e.results[i][0].transcript;
        if (e.results[i].isFinal) acc += tr + " "; else interim += tr;
      }
      setText((acc + interim).trim());
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    recogRef.current = r; setListening(true); r.start();
  };
  const stopVoice = () => { try { recogRef.current && recogRef.current.stop(); } catch { /* */ } setListening(false); };

  const onPhoto = async (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const max = 1400; let w = img.width, h = img.height;
          if (w > h && w > max) { h = Math.round(h * max / w); w = max; } else if (h > max) { w = Math.round(w * max / h); h = max; }
          const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
          cv.getContext("2d").drawImage(img, 0, 0, w, h);
          const dataUrl = cv.toDataURL("image/jpeg", 0.82);
          setImageB64(dataUrl);
          cv.toBlob(async (blob) => {
            try { setImageUrl(await uploadApi.image(blob, `sitor-${Date.now()}.jpg`)); }
            catch { setImageUrl(dataUrl); }
            finally { setUploading(false); e.target.value = ""; }
          }, "image/jpeg", 0.82);
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(f);
    } catch { setUploading(false); }
  };

  const send = async (preset) => {
    const msg = (preset ?? text).trim();
    if (!msg || busy) return;
    if (intent === "ordine" && mode === "photo" && !imageUrl) { toast.error(tri("Allega una foto o scrivi una nota.", "Foto oder Notiz hinzufügen.", "Attach a photo or write a note.", "Adjunta foto o nota.", "Ajoute une photo ou note.", "عکس یا یادداشت اضافه کن.")); return; }
    stopVoice(); setBusy(true);
    push("capo", mode === "photo" && imageUrl ? `📷 ${msg || tri("(foto allegata)", "(Foto)", "(photo)", "(foto)", "(photo)", "(عکس)")}` : msg);
    if (!preset) setText("");
    try {
      if (intent === "domanda") {
        const r = await deusApi.ask({ question: msg, lang });
        if (r.bond) setBond(r.bond);
        push("sitor", r.reply || "…"); speak(r.reply);
      } else {
        const r = await deusApi.capture({ mode, text: msg, image_url: imageUrl, image_base64: imageB64, lang });
        push("sitor", r.reply || "…"); speak(r.reply);
        const n = (r.tasks || []).length;
        if (n > 0) toast.success(tri(`+${n} in produzione`, `+${n} in Produktion`, `+${n} to production`, `+${n} a producción`, `+${n} en production`, `+${n} به تولید`), { icon: "🏭" });
        if (r.counts) setCounts(r.counts);
        setImageUrl(""); setImageB64("");
        loadQueue();
      }
    } catch {
      push("sitor", tri("Un attimo, Capo: riprova tra poco.", "Einen Moment, Chef: versuch es gleich.", "One moment, Capo: try again shortly.", "Un momento: inténtalo de nuevo.", "Un instant : réessaie.", "یک لحظه صبر کن."));
    } finally { setBusy(false); }
  };

  const shiftReport = async () => {
    setReporting(true);
    try {
      const r = await deusApi.shiftReport(lang);
      push("sitor", r.spoken || ""); speak(r.spoken);
      toast.success(`MikiScore ${r.mikiscore} · ${r.grade}`, { icon: "📋" });
    } catch { toast.error(tri("Report non disponibile.", "Report nicht verfügbar.", "Report unavailable.", "Informe no disponible.", "Rapport indisponible.", "گزارش در دسترس نیست.")); }
    finally { setReporting(false); }
  };

  const markDone = (t) => deusApi.queueDone(t.id).then((d) => setCounts(d.counts)).catch(() => {}).finally(loadQueue);
  const clearAll = () => deusApi.queueClear().then((d) => setCounts(d.counts)).catch(() => {}).finally(() => { setQueue([]); loadQueue(); });

  const QUICK = [
    tri("Come sta l'impianto adesso?", "Wie läuft die Anlage?", "How is the plant doing?", "¿Cómo va la planta?", "Comment va l'usine ?", "کارخانه چطور است؟"),
    tri("Cosa devo fare oggi?", "Was muss ich heute tun?", "What should I do today?", "¿Qué hago hoy?", "Que dois-je faire aujourd'hui ?", "امروز چه کار کنم؟"),
  ];

  return (
    <div data-testid="sala-sitor" className="relative rounded-3xl overflow-hidden border border-[#EAB308]/35 bg-[#060A10] shadow-[0_0_44px_rgba(234,179,8,0.10)]">
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(circle at 50% 0%, rgba(234,179,8,0.12), transparent 60%)" }} />
      <div className="relative z-10 p-5 sm:p-6 space-y-4">

        {/* Testata: il luogo d'incontro */}
        <div className="flex items-center gap-3">
          <div className="relative w-14 h-14 shrink-0">
            <span className="absolute -inset-1.5 rounded-full blur-md" style={{ background: "radial-gradient(circle, rgba(234,179,8,0.55), rgba(255,107,0,0.3) 60%, transparent 72%)" }} />
            <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-[#EAB308]/70">
              <LivingAvatar3D src="/avatar_nexus.jpg" accent="#EAB308" nexus className="w-full h-full" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-cyber text-lg sm:text-xl font-black uppercase tracking-[0.12em] text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#EAB308]" /> {tri("Sala Sitor", "Sitor-Saal", "Sitor Hall", "Sala Sitor", "Salle Sitor", "تالار سیتور")}
            </h2>
            <p className="text-[11px] text-[#94A3B8]">{tri("Il vostro unico punto d'incontro: parla, scrivi, ordina. Da qui nasce tutto.", "Euer einziger Treffpunkt: sprich, schreibe, befiehl.", "Your single meeting point: talk, write, command. Everything starts here.", "Vuestro único punto de encuentro.", "Votre unique point de rencontre.", "تنها نقطه ملاقات شما.")}</p>
            {bond && <p data-testid="sitor-bond" className="text-[10px] font-mono-data uppercase tracking-widest text-[#EAB308] mt-0.5">♥ {bond.level_name || bond.level || ""}</p>}
          </div>
          <button data-testid="sitor-report-btn" onClick={shiftReport} disabled={reporting}
            className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#FF6B00]/10 border border-[#FF6B00]/30 text-[#FF6B00] text-xs font-bold hover:bg-[#FF6B00]/20 active:scale-95 disabled:opacity-50">
            {reporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ClipboardList className="w-3.5 h-3.5" />} {tri("Report Turno", "Schichtbericht", "Shift Report", "Informe Turno", "Rapport", "گزارش شیفت")}
          </button>
        </div>

        {/* Conversazione */}
        <div ref={listRef} data-testid="sitor-chat" className="rounded-2xl bg-[#030712] border border-[#1e293b] p-3 space-y-2 min-h-[120px] max-h-72 overflow-y-auto">
          {msgs.length === 0 && (
            <p data-testid="sitor-chat-empty" className="text-[12px] text-[#64748B] text-center py-6 px-4">
              {tri("«Capo, sono Sitor. Detta un ordine, incolla un'email o fai una domanda: genero io la produzione.»", "«Chef, ich bin Sitor. Diktiere einen Auftrag oder stelle eine Frage.»", "«Capo, I am Sitor. Dictate an order, paste an email or ask a question: I generate production.»", "«Soy Sitor. Dicta una orden o pregunta.»", "«Je suis Sitor. Dicte un ordre ou pose une question.»", "«من سیتور هستم. دستور بده یا سؤال بپرس.»")}
            </p>
          )}
          <AnimatePresence>
            {msgs.map((m) => (
              <motion.div key={m.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} data-testid={`sitor-msg-${m.who}`}
                className={`flex ${m.who === "capo" ? "justify-end" : "justify-start"} items-end gap-1.5`}>
                {m.who === "sitor" && <NexusAvatar size={24} className="shrink-0 rounded-full border border-[#EAB308]/50" />}
                <div className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm leading-snug ${m.who === "capo" ? "bg-[#FF6B00] text-[#060A10] font-semibold" : "bg-[#0C1019] text-[#E8EEF5] border border-[#EAB308]/25"}`}>
                  {m.text}
                  {m.who === "sitor" && (
                    <button data-testid="sitor-replay" onClick={() => speak(m.text)} className="ml-2 inline-flex align-middle text-[#EAB308] active:scale-90"><Volume2 className="w-3.5 h-3.5" /></button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {busy && <p data-testid="sitor-thinking" className="text-[11px] text-[#EAB308] flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> {tri("Sitor elabora…", "Sitor denkt…", "Sitor is thinking…", "Sitor procesa…", "Sitor réfléchit…", "سیتور فکر می‌کند…")}</p>}
        </div>

        {/* Chip rapidi */}
        <div className="flex flex-wrap gap-1.5">
          {QUICK.map((q, i) => (
            <button key={i} data-testid={`sitor-quick-${i}`} onClick={() => { setIntent("domanda"); send(q); }} disabled={busy}
              className="text-[11px] font-bold px-2.5 py-1.5 rounded-full bg-[#EAB308]/10 border border-[#EAB308]/35 text-[#EAB308] active:scale-95 disabled:opacity-50">
              {q}
            </button>
          ))}
        </div>

        {/* Compositore universale */}
        <div className="rounded-2xl border border-[#1e293b] bg-[#0C1019]/60 p-3">
          <div className="grid grid-cols-4 gap-1.5 mb-2">
            {MODES.map(({ key, Icon, label }) => (
              <button key={key} data-testid={`sitor-mode-${key}`} onClick={() => { setMode(key); if (key === "voice") setTimeout(startVoice, 60); else stopVoice(); }}
                className={`flex flex-col items-center gap-0.5 py-2 rounded-xl border text-[11px] font-bold transition-all active:scale-95 ${mode === key ? "bg-[#EAB308]/15 border-[#EAB308]/60 text-[#EAB308]" : "bg-[#030712] border-[#1e293b] text-[#94A3B8] hover:border-[#EAB308]/40"}`}>
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-1.5 mb-2">
            <button data-testid="sitor-intent-ordine" onClick={() => setIntent("ordine")}
              className={`inline-flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-black uppercase tracking-wide transition-all active:scale-95 ${intent === "ordine" ? "bg-[#FF6B00]/15 border-[#FF6B00]/60 text-[#FF6B00]" : "bg-[#030712] border-[#1e293b] text-[#94A3B8]"}`}>
              <Factory className="w-3.5 h-3.5" /> {tri("Ordine → Produzione", "Auftrag → Produktion", "Order → Production", "Orden → Producción", "Ordre → Production", "سفارش → تولید")}
            </button>
            <button data-testid="sitor-intent-domanda" onClick={() => setIntent("domanda")}
              className={`inline-flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-black uppercase tracking-wide transition-all active:scale-95 ${intent === "domanda" ? "bg-[#EAB308]/15 border-[#EAB308]/60 text-[#EAB308]" : "bg-[#030712] border-[#1e293b] text-[#94A3B8]"}`}>
              <MessageSquareText className="w-3.5 h-3.5" /> {tri("Domanda → Risposta", "Frage → Antwort", "Question → Answer", "Pregunta → Respuesta", "Question → Réponse", "سؤال → پاسخ")}
            </button>
          </div>
          {mode === "photo" && (
            <div className="mb-2 flex items-center gap-2 flex-wrap">
              {imageUrl && <img src={imageUrl} alt="" className="w-16 h-16 rounded-xl object-cover border border-[#EAB308]/40" />}
              <label data-testid="sitor-photo-input" className={`cursor-pointer inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#EAB308]/10 border border-[#EAB308]/40 text-[#EAB308] text-sm font-bold ${uploading ? "opacity-60 pointer-events-none" : ""}`}>
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />} {tri("Scatta / Allega", "Aufnehmen / Anhängen", "Take / Attach", "Hacer / Adjuntar", "Prendre / Joindre", "گرفتن / پیوست")}
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={onPhoto} disabled={uploading} />
              </label>
            </div>
          )}
          <div className="relative">
            <textarea data-testid="sitor-input" value={text} onChange={(e) => setText(e.target.value)} rows={3}
              placeholder={intent === "domanda"
                ? tri("Chiedi qualsiasi cosa a Sitor…", "Frag Sitor alles…", "Ask Sitor anything…", "Pregunta lo que sea…", "Demande tout à Sitor…", "از سیتور بپرس…")
                : tri("Scrivi o detta qualsiasi cosa: ricetta, ordine, piano, nota…", "Schreibe oder diktiere alles…", "Write or dictate anything: recipe, order, plan, note…", "Escribe o dicta lo que sea…", "Écris ou dicte tout…", "بنویس یا بگو…")}
              className="w-full rounded-xl bg-[#030712] border border-[#1e293b] focus:border-[#EAB308]/60 outline-none text-sm text-white p-3 pr-12 resize-none" />
            {mode === "voice" && (
              <button data-testid="sitor-mic" onClick={() => (listening ? stopVoice() : startVoice())}
                className={`absolute right-2 top-2 w-9 h-9 rounded-lg flex items-center justify-center border ${listening ? "bg-rose-500/20 border-rose-500/50 text-rose-300 animate-pulse" : "bg-[#EAB308]/10 border-[#EAB308]/40 text-[#EAB308]"}`}>
                {listening ? <StopCircle className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            )}
          </div>
          <button data-testid="sitor-send" onClick={() => send()} disabled={busy || !text.trim()}
            className="mt-2.5 w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl font-cyber font-black text-sm text-[#060A10] active:scale-95 transition-all disabled:opacity-50"
            style={{ background: "linear-gradient(90deg,#EAB308,#FF6B00)", boxShadow: "0 0 20px rgba(234,179,8,0.3)" }}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {busy ? tri("Sitor genera…", "Sitor generiert…", "Sitor generating…", "Sitor genera…", "Sitor génère…", "سیتور تولید می‌کند…") : tri("Manda a Sitor", "An Sitor senden", "Send to Sitor", "Enviar a Sitor", "Envoyer à Sitor", "به سیتور بفرست")}
          </button>
        </div>

        {/* Coda di produzione generata qui */}
        <div className="pt-3 border-t border-[#1e293b]">
          <div className="flex items-center justify-between mb-2">
            <span data-testid="sitor-queue-count" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wide text-[#EAB308]"><Factory className="w-4 h-4" /> {tri("Produzione generata", "Erzeugte Produktion", "Generated production", "Producción generada", "Production générée", "تولید تولیدشده")}: <span className="text-white">{counts.pending}</span> {tri("da fare", "offen", "to do", "por hacer", "à faire", "برای انجام")}</span>
            {queue.length > 0 && <button data-testid="sitor-queue-clear" onClick={clearAll} className="text-[11px] text-[#64748B] hover:text-rose-400 inline-flex items-center gap-1"><Trash2 className="w-3.5 h-3.5" /> {tri("Svuota", "Leeren", "Clear", "Vaciar", "Vider", "پاک")}</button>}
          </div>
          <div data-testid="sitor-queue" className="space-y-1.5 max-h-56 overflow-y-auto">
            {queue.filter((t) => t.status === "pending").slice(0, 20).map((t) => (
              <div key={t.id} data-testid={`sitor-task-${t.id}`} className="flex items-center gap-2 rounded-xl bg-[#0C1019] border border-[#1e293b] px-3 py-2">
                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-[#FF6B00]/10 text-[#FF9D42] border border-[#FF6B00]/20 shrink-0">{t.dept}</span>
                <div className="min-w-0 flex-1"><p className="text-xs font-bold text-white truncate">{t.title}</p>{t.detail && <p className="text-[10px] text-[#64748B] truncate">{t.detail}</p>}</div>
                <button data-testid={`sitor-task-done-${t.id}`} onClick={() => markDone(t)} className="shrink-0 w-7 h-7 rounded-lg bg-[#22c55e]/10 border border-[#22c55e]/40 text-[#22c55e] flex items-center justify-center active:scale-95"><CheckCircle2 className="w-4 h-4" /></button>
              </div>
            ))}
            {queue.filter((t) => t.status === "pending").length === 0 && <p className="text-[11px] text-[#64748B] text-center py-3">{tri("Vuota. Ordina qui sopra e Sitor genera la produzione.", "Leer. Oben bestellen, Sitor erzeugt die Produktion.", "Empty. Order above and Sitor generates production.", "Vacía. Ordena arriba.", "Vide. Ordonne ci-dessus.", "خالی است.")}</p>}
          </div>
        </div>

        {/* Modifiche proposte dagli operai — approvazione del Capo */}
        <div className="pt-3 border-t border-[#1e293b]">
          <FloorChangeApprovals />
        </div>

        {/* Sitor parla da solo: proposte e allarmi arrivano QUI */}
        <div className="pt-3 border-t border-[#1e293b] space-y-3">
          <p className="text-[10px] font-mono-data uppercase tracking-[0.22em] text-[#94A3B8]">{tri("Sitor ti parla · proposte e allarmi", "Sitor spricht · Vorschläge & Alarme", "Sitor speaks · suggestions & alerts", "Sitor habla · propuestas y alarmas", "Sitor parle · suggestions & alertes", "سیتور حرف می‌زند")}</p>
          <MikeSuggestions />
          <MikeAlerts />
        </div>
      </div>
    </div>
  );
}
