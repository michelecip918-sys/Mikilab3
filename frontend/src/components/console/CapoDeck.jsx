import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Camera, Mail, Type, Send, Loader2, Volume2, CheckCircle2, Factory, Sparkles, Trash2, StopCircle } from "lucide-react";
import { toast } from "sonner";
import { deusApi, uploadApi } from "@/lib/api";
import { playTTS } from "@/lib/tts";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

const SECTORS = [
  { key: "ricette", it: "Ricette", en: "Recipes", ic: "🥖" },
  { key: "piano", it: "Piani", en: "Plans", ic: "🗓️" },
  { key: "ordini", it: "Ordini", en: "Orders", ic: "📦" },
  { key: "macchine", it: "Macchine", en: "Machines", ic: "⚙️" },
  { key: "team", it: "Team", en: "Team", ic: "👥" },
  { key: "magazzino", it: "Magazzino", en: "Stock", ic: "🏷️" },
];

export default function CapoDeck() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const en = String(lang).startsWith("en");
  const [mode, setMode] = useState("text");
  const [text, setText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [queue, setQueue] = useState([]);
  const [counts, setCounts] = useState({ total: 0, pending: 0, by_sector: {} });
  const [listening, setListening] = useState(false);
  const recogRef = useRef(null);

  const speak = (t) => { try { if (t) playTTS(t, { lang, voice: "bakemix" }); } catch { /* */ } };

  const loadQueue = useCallback(() => {
    deusApi.productionQueue().then((d) => { setQueue(d.tasks || []); setCounts(d.counts || { total: 0, pending: 0, by_sector: {} }); }).catch(() => {});
  }, []);
  useEffect(() => { loadQueue(); }, [loadQueue]);

  const MODES = [
    { key: "voice", Icon: Mic, label: tri("Voce", "Sprache", "Voice", "Voz", "Voix", "صدا") },
    { key: "photo", Icon: Camera, label: tri("Foto", "Foto", "Photo", "Foto", "Photo", "عکس") },
    { key: "email", Icon: Mail, label: "Email" },
    { key: "text", Icon: Type, label: tri("Testo", "Text", "Text", "Texto", "Texte", "متن") },
  ];

  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { toast.error(tri("Dettatura non supportata: scrivi pure il testo.", "Diktat nicht unterstützt.", "Dictation not supported: type instead.", "Dictado no soportado.", "Dictée non supportée.", "دیکته پشتیبانی نمی‌شود.")); setMode("text"); return; }
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
          cv.toBlob(async (blob) => {
            try { setImageUrl(await uploadApi.image(blob, `capo-${Date.now()}.jpg`)); }
            catch { setImageUrl(cv.toDataURL("image/jpeg", 0.82)); }
            finally { setUploading(false); e.target.value = ""; }
          }, "image/jpeg", 0.82);
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(f);
    } catch { setUploading(false); }
  };

  const send = async () => {
    if (mode !== "photo" && !text.trim()) return;
    if (mode === "photo" && !imageUrl && !text.trim()) { toast.error(tri("Allega una foto o scrivi una nota.", "Foto oder Notiz hinzufügen.", "Attach a photo or write a note.", "Adjunta foto o nota.", "Ajoute une photo ou note.", "عکس یا یادداشت اضافه کن.")); return; }
    stopVoice(); setBusy(true); setResult(null);
    try {
      const r = await deusApi.capture({ mode, text, image_url: imageUrl, lang });
      setResult(r); setCounts(r.counts); setText(""); setImageUrl("");
      speak(r.reply);
      toast.success(tri(`+${(r.tasks || []).length} in produzione`, `+${(r.tasks || []).length} in Produktion`, `+${(r.tasks || []).length} to production`, `+${(r.tasks || []).length} a producción`, `+${(r.tasks || []).length} en production`, `+${(r.tasks || []).length} به تولید`), { icon: "🏭" });
      loadQueue();
    } catch {
      toast.error(tri("BakoMix non risponde.", "BakoMix antwortet nicht.", "BakoMix not responding.", "BakoMix no responde.", "BakoMix ne répond pas.", "BakoMix پاسخ نمی‌دهد."));
    } finally { setBusy(false); }
  };

  const markDone = (t) => deusApi.queueDone(t.id).then((d) => setCounts(d.counts)).catch(() => {}).finally(loadQueue);
  const clearAll = () => deusApi.queueClear().then((d) => setCounts(d.counts)).catch(() => {}).finally(() => { setQueue([]); loadQueue(); });

  const placeholder = {
    text: tri("Scrivi qualsiasi cosa: una ricetta, un ordine, un piano, una nota…", "Schreibe alles: Rezept, Auftrag, Plan, Notiz…", "Type anything: a recipe, an order, a plan, a note…", "Escribe lo que sea…", "Écris n'importe quoi…", "هرچیزی بنویس…"),
    email: tri("Incolla qui l'email del cliente/fornitore…", "E-Mail hier einfügen…", "Paste the customer/supplier email here…", "Pega el email aquí…", "Colle l'email ici…", "ایمیل را اینجا بچسبان…"),
    voice: tri("Premi il microfono e detta… il testo apparirà qui.", "Mikrofon drücken und diktieren…", "Press the mic and dictate… text appears here.", "Pulsa el micro y dicta…", "Appuie sur le micro et dicte…", "میکروفون را بزن و بگو…"),
    photo: tri("Nota opzionale sulla foto…", "Optionale Notiz zum Foto…", "Optional note about the photo…", "Nota opcional sobre la foto…", "Note optionnelle…", "یادداشت اختیاری…"),
  }[mode];

  return (
    <div data-testid="capo-deck" className="relative rounded-3xl overflow-hidden border border-[#FFB800]/30 bg-[#070A10] shadow-[0_0_44px_rgba(255,184,0,0.10)]">
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(circle at 50% 0%, rgba(255,184,0,0.12), transparent 60%)" }} />
      <div className="relative z-10 p-5 sm:p-6">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="font-cyber text-lg sm:text-xl font-black uppercase tracking-[0.12em] text-white flex items-center gap-2"><Factory className="w-5 h-5 text-[#FFB800]" /> {tri("Plancia del Capo", "Capo-Kommandobrücke", "Capo Command Deck", "Puente de Mando", "Poste de Commande", "پل فرماندهی کاپو")}</h2>
          <span className="text-[11px] text-[#8aa0b4]">· {tri("compila e la produzione parte", "füllen und Produktion startet", "fill it and production kicks off", "rellena y arranca producción", "remplis et la production démarre", "پر کن و تولید شروع می‌شود")}</span>
        </div>

        {/* Selettore modalità universale */}
        <div className="mt-4 grid grid-cols-4 gap-2">
          {MODES.map(({ key, Icon, label }) => (
            <button key={key} data-testid={`capo-mode-${key}`} onClick={() => { setMode(key); if (key === "voice") setTimeout(startVoice, 60); else stopVoice(); }}
              className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-bold transition-all active:scale-95 ${mode === key ? "bg-[#FFB800]/15 border-[#FFB800]/60 text-[#FFB800]" : "bg-[#0C1019] border-[#1e293b] text-[#94A3B8] hover:border-[#FFB800]/40"}`}>
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {/* Area input */}
        <div className="mt-3">
          {mode === "photo" && (
            <div className="mb-2 flex items-center gap-2 flex-wrap">
              {imageUrl && <img src={imageUrl} alt="" className="w-16 h-16 rounded-xl object-cover border border-[#FFB800]/40" />}
              <label data-testid="capo-photo-input" className={`cursor-pointer inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#FFB800]/10 border border-[#FFB800]/40 text-[#FFB800] text-sm font-bold ${uploading ? "opacity-60 pointer-events-none" : ""}`}>
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />} {tri("Scatta / Allega", "Aufnehmen / Anhängen", "Take / Attach", "Hacer / Adjuntar", "Prendre / Joindre", "گرفتن / پیوست")}
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={onPhoto} disabled={uploading} />
              </label>
            </div>
          )}
          <div className="relative">
            <textarea data-testid="capo-capture-input" value={text} onChange={(e) => setText(e.target.value)} rows={3}
              placeholder={placeholder}
              className="w-full rounded-xl bg-[#030712] border border-[#1e293b] focus:border-[#FFB800]/60 outline-none text-sm text-white p-3 pr-12 resize-none" />
            {mode === "voice" && (
              <button data-testid="capo-voice-toggle" onClick={() => (listening ? stopVoice() : startVoice())}
                className={`absolute right-2 top-2 w-9 h-9 rounded-lg flex items-center justify-center border ${listening ? "bg-rose-500/20 border-rose-500/50 text-rose-300 animate-pulse" : "bg-[#FFB800]/10 border-[#FFB800]/40 text-[#FFB800]"}`}>
                {listening ? <StopCircle className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            )}
          </div>
          <button data-testid="capo-send-btn" onClick={send} disabled={busy}
            className="mt-3 w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl font-cyber font-black text-sm text-[#070A10] active:scale-95 transition-all disabled:opacity-50"
            style={{ background: "linear-gradient(90deg,#FFB800,#00F0FF)", boxShadow: "0 0 20px rgba(255,184,0,0.3)" }}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {busy ? tri("BakoMix genera…", "BakoMix generiert…", "BakoMix generating…", "BakoMix genera…", "BakoMix génère…", "BakoMix تولید می‌کند…") : tri("Manda a BakoMix", "An BakoMix senden", "Send to BakoMix", "Enviar a BakoMix", "Envoyer à BakoMix", "به BakoMix بفرست")}
          </button>
        </div>

        {/* Settori */}
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          {SECTORS.map((s) => (
            <span key={s.key} data-testid={`capo-sector-${s.key}`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0C1019] border border-[#1e293b] text-xs font-bold text-[#cbd5e1]">
              <span>{s.ic}</span> {en ? s.en : s.it} <span className="text-[#FFB800]">{counts.by_sector?.[s.key] || 0}</span>
            </span>
          ))}
        </div>

        {/* Risultato ultima cattura */}
        <AnimatePresence>
          {result && (
            <motion.div data-testid="capo-capture-result" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mt-4 rounded-2xl bg-[#0C1019] border border-[#FFB800]/25 p-4">
              {result.reply && (
                <div className="flex items-start gap-2 mb-2">
                  <button onClick={() => speak(result.reply)} className="shrink-0 w-8 h-8 rounded-lg bg-[#FFB800]/10 border border-[#FFB800]/40 text-[#FFB800] flex items-center justify-center active:scale-95"><Volume2 className="w-4 h-4" /></button>
                  <p className="text-sm text-white italic">“{result.reply}”</p>
                </div>
              )}
              {(result.generated || []).length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {result.generated.map((g, k) => <span key={k} className="text-[11px] px-2 py-0.5 rounded bg-[#00F0FF]/10 border border-[#00F0FF]/25 text-[#7DD3FC]"><Sparkles className="w-3 h-3 inline mr-1" />{g}</span>)}
                </div>
              )}
              {(result.tasks || []).map((t) => (
                <div key={t.id} className="flex items-start gap-2 py-1.5 border-t border-[#1e293b] first:border-t-0">
                  <Factory className="w-3.5 h-3.5 text-[#FFB800] mt-0.5 shrink-0" />
                  <div className="min-w-0"><p className="text-xs font-bold text-white">{t.title}</p>{t.detail && <p className="text-[11px] text-[#94A3B8]">{t.detail}</p>}</div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Coda di produzione generata */}
        <div className="mt-4 pt-4 border-t border-[#1e293b]">
          <div className="flex items-center justify-between mb-2">
            <span data-testid="capo-queue-count" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wide text-[#FFB800]"><Factory className="w-4 h-4" /> {tri("Produzione generata", "Erzeugte Produktion", "Generated production", "Producción generada", "Production générée", "تولید تولیدشده")}: <span className="text-white">{counts.pending}</span> {tri("da fare", "offen", "to do", "por hacer", "à faire", "برای انجام")}</span>
            {queue.length > 0 && <button data-testid="capo-queue-clear" onClick={clearAll} className="text-[11px] text-[#64748B] hover:text-rose-400 inline-flex items-center gap-1"><Trash2 className="w-3.5 h-3.5" /> {tri("Svuota", "Leeren", "Clear", "Vaciar", "Vider", "پاک")}</button>}
          </div>
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {queue.filter((t) => t.status === "pending").slice(0, 20).map((t) => (
              <div key={t.id} data-testid={`capo-task-${t.id}`} className="flex items-center gap-2 rounded-xl bg-[#0C1019] border border-[#1e293b] px-3 py-2">
                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-[#00F0FF]/10 text-[#7DD3FC] border border-[#00F0FF]/20 shrink-0">{t.dept}</span>
                <div className="min-w-0 flex-1"><p className="text-xs font-bold text-white truncate">{t.title}</p>{t.detail && <p className="text-[10px] text-[#64748B] truncate">{t.detail}</p>}</div>
                <button data-testid={`capo-task-done-${t.id}`} onClick={() => markDone(t)} className="shrink-0 w-7 h-7 rounded-lg bg-[#22c55e]/10 border border-[#22c55e]/40 text-[#22c55e] flex items-center justify-center active:scale-95"><CheckCircle2 className="w-4 h-4" /></button>
              </div>
            ))}
            {queue.filter((t) => t.status === "pending").length === 0 && <p className="text-[11px] text-[#64748B] text-center py-3">{tri("Vuota. Compila qui sopra per far partire la produzione.", "Leer. Oben ausfüllen, um zu starten.", "Empty. Fill in above to start production.", "Vacía. Rellena arriba.", "Vide. Remplis ci-dessus.", "خالی است.")}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
