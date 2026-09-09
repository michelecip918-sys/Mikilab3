import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mic, Loader2, Sparkles, Send, ChevronRight, Gauge, ShieldAlert, Brush, ListChecks, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { delegationApi } from "@/lib/api";
import { playTTS, toBCP47 } from "@/lib/tts";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

const KIND = {
  sanificazione: { icon: Brush, c: "#22c55e", it: "Sanificazione", de: "Reinigung", en: "Sanitation", es: "Sanitización", fr: "Nettoyage", fa: "بهداشت" },
  regola: { icon: ShieldAlert, c: "#64748B", it: "Regola", de: "Regel", en: "Rule", es: "Regla", fr: "Règle", fa: "قاعده" },
  crisis_override: { icon: Gauge, c: "#f59e0b", it: "Crisis Override", de: "Crisis Override", en: "Crisis Override", es: "Crisis Override", fr: "Crisis Override", fa: "بازنویسی بحران" },
  generico: { icon: ListChecks, c: "#5EEAD4", it: "Task", de: "Aufgabe", en: "Task", es: "Tarea", fr: "Tâche", fa: "وظیفه" },
};

export default function VoiceDelegation({ onClose }) {
  const { lang } = useLang();
  const tri = mkTri(lang);
  const [transcript, setTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [proposal, setProposal] = useState(null);
  const [pool, setPool] = useState([]);
  const [done, setDone] = useState(null);
  const recRef = useRef(null);

  const toggleMic = useCallback(() => {
    if (listening) { try { recRef.current?.stop(); } catch { /* */ } setListening(false); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { toast.error(tri("Microfono non supportato (usa Chrome)", "Mikrofon nicht unterstützt", "Mic not supported (use Chrome)", "Micrófono no soportado", "Micro non supporté", "میکروفون پشتیبانی نمی‌شود")); return; }
    const rec = new SR(); rec.lang = toBCP47(lang); rec.interimResults = true; rec.maxAlternatives = 1; rec.continuous = false;
    let finalTx = "";
    rec.onresult = (e) => {
      let interim = "";
      for (let i = 0; i < e.results.length; i++) { const r = e.results[i]; if (r.isFinal) finalTx += r[0].transcript; else interim += r[0].transcript; }
      setTranscript((finalTx + " " + interim).trim());
    };
    rec.onend = () => { setListening(false); };
    rec.onerror = () => { setListening(false); };
    recRef.current = rec;
    try { rec.start(); setListening(true); } catch { /* gesto utente */ }
  }, [listening, lang, tri]);

  useEffect(() => () => { try { recRef.current?.stop(); } catch { /* */ } }, []);

  const analyze = useCallback(async () => {
    const t = transcript.trim();
    if (!t) return;
    try { recRef.current?.stop(); } catch { /* */ }
    setListening(false); setParsing(true); setProposal(null); setDone(null);
    try {
      const r = await delegationApi.parse(t, lang);
      setProposal(r.proposal); setPool(r.pool || []);
    } catch (e) {
      toast.error(e?.response?.data?.detail || tri("Comando non compreso", "Nicht verstanden", "Not understood", "No entendido", "Non compris", "درک نشد"));
    }
    setParsing(false);
  }, [transcript, lang, tri]);

  const setAssignee = (order, name) => {
    setProposal((p) => {
      const w = pool.find((x) => x.name === name);
      return { ...p, steps: p.steps.map((s) => s.order === order ? { ...s, assignee: name || null, assignee_position: w?.position || null, assignee_aura: w?.aura || null } : s) };
    });
  };

  const confirm = useCallback(async () => {
    if (!proposal) return;
    setConfirming(true);
    try {
      const r = await delegationApi.confirm(proposal);
      setDone(r.task);
      // Mike Mix conferma a voce SOLO al Capo (modalità strategica attiva).
      try { playTTS(tri(`Fatto Capo. ${proposal.title} inviato al floor in silenzio.`, `Erledigt Chef. ${proposal.title} still an die Halle gesendet.`, `Done boss. ${proposal.title} sent silently to the floor.`, `Hecho jefe. ${proposal.title} enviado en silencio.`, `C'est fait chef. ${proposal.title} envoyé en silence.`, `انجام شد رئیس. ${proposal.title} بی‌صدا به سالن ارسال شد.`), lang); } catch { /* */ }
      toast.success(r.mikemix_insight || tri("Task inviato", "Gesendet", "Task sent", "Enviado", "Envoyé", "ارسال شد"));
    } catch (e) {
      toast.error(e?.response?.data?.detail || tri("Errore", "Fehler", "Error", "Error", "Erreur", "خطا"));
    }
    setConfirming(false);
  }, [proposal, lang, tri]);

  const K = proposal ? (KIND[proposal.kind] || KIND.generico) : null;

  return (
    <div data-testid="voice-delegation" className="fixed inset-0 z-[80] bg-[#030712]/97 backdrop-blur-xl overflow-y-auto">
      <div className="max-w-2xl mx-auto p-4 pb-16">
        <div className="flex items-center justify-between sticky top-0 bg-[#030712]/95 py-2 z-10">
          <h2 className="text-lg font-black text-white flex items-center gap-2"><Mic className="w-5 h-5 text-[#14b8a6]" /> {tri("Delega Vocale (Eclipse)", "Sprachdelegation (Eclipse)", "Voice Delegation (Eclipse)", "Delegación por Voz (Eclipse)", "Délégation Vocale (Eclipse)", "واگذاری صوتی (اکلیپس)")}</h2>
          <button data-testid="delegation-close" onClick={() => { try { recRef.current?.stop(); } catch { /* */ } onClose(); }} className="w-9 h-9 rounded-full bg-[#0b0f19] border border-[#1e293b] flex items-center justify-center text-[#94A3B8] hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        {done ? (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} data-testid="delegation-done" className="flex flex-col items-center text-center py-8 space-y-4">
            <div className="w-20 h-20 rounded-full bg-emerald-500/15 border-2 border-emerald-500 flex items-center justify-center"><CheckCircle2 className="w-10 h-10 text-emerald-400" /></div>
            <div>
              <h3 className="text-lg font-black text-emerald-300">{done.title}</h3>
              <p className="text-sm text-[#94A3B8] mt-1">{tri("Inviato al floor in silenzio · gli operatori vedranno i loro step.", "Still an die Halle gesendet.", "Sent silently to the floor.", "Enviado en silencio al taller.", "Envoyé en silence à l'atelier.", "بی‌صدا به سالن ارسال شد.")}</p>
            </div>
            <div className="flex gap-2">
              <button data-testid="delegation-new" onClick={() => { setDone(null); setProposal(null); setTranscript(""); }} className="px-5 py-3 rounded-xl bg-[#0b0f19] border border-[#2A3B49] text-white text-sm font-bold active:scale-95">{tri("Nuova delega", "Neue Delegation", "New delegation", "Nueva delegación", "Nouvelle délégation", "واگذاری جدید")}</button>
              <button data-testid="delegation-exit" onClick={onClose} className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#14b8a6] to-[#0d9488] text-[#030712] text-sm font-black active:scale-95">{tri("Chiudi", "Schließen", "Close", "Cerrar", "Fermer", "بستن")}</button>
            </div>
          </motion.div>
        ) : (
          <>
            <p className="text-[12px] text-[#94A3B8] mb-4">{tri("Detta un ordine: Mike Mix lo trasforma in task di squadra e propone gli operatori. Confermi tu prima dell'invio.", "Diktiere einen Befehl: Mike Mix macht daraus eine Team-Aufgabe. Du bestätigst vor dem Senden.", "Dictate an order: Mike Mix turns it into a team task and proposes operators. You confirm before dispatch.", "Dicta una orden: Mike Mix la convierte en tarea de equipo. Confirmas antes de enviar.", "Dicte un ordre : Mike Mix en fait une tâche d'équipe. Tu confirmes avant l'envoi.", "دستوری بگو: Mike Mix آن را به وظیفه تیمی تبدیل می‌کند. قبل از ارسال تأیید می‌کنی.")}</p>

            {/* MIC + testo */}
            <div className="flex flex-col items-center mb-4">
              <button data-testid="delegation-mic" onClick={toggleMic} className="relative active:scale-95 transition-transform">
                {listening && <span aria-hidden className="absolute -inset-2 rounded-full border-2 border-[#14b8a6]/50 animate-ping" />}
                <span className={`relative w-20 h-20 rounded-full flex items-center justify-center border-4 ${listening ? "bg-[#14b8a6] border-[#14b8a6] text-[#030712]" : "bg-[#0b0f19] border-[#2A3B49] text-[#14b8a6]"}`}><Mic className="w-8 h-8" /></span>
              </button>
              <p className="mt-2 text-[11px] text-[#7E8A93]">{listening ? tri("Sto ascoltando…", "Ich höre zu…", "Listening…", "Escuchando…", "J'écoute…", "در حال شنیدن…") : tri("Tocca e parla (o scrivi sotto)", "Tippen & sprechen", "Tap & speak (or type)", "Toca y habla", "Touche et parle", "بزن و صحبت کن")}</p>
            </div>
            <textarea
              data-testid="delegation-transcript" value={transcript} onChange={(e) => setTranscript(e.target.value)} rows={2}
              placeholder={tri("Es. «Sanificate i carrelli al reparto forni»", "z.B. «Reinigt die Wagen am Ofen»", "e.g. «Sanitize the trolleys at the ovens»", "Ej. «Sanitizad los carros en hornos»", "Ex. «Nettoyez les chariots aux fours»", "مثال «چرخ‌ها را کنار فرها بشویید»")}
              className="w-full bg-[#0b0f19] border border-[#1e293b] rounded-2xl p-3 text-sm text-white outline-none focus:border-[#14b8a6] resize-none"
            />
            <button data-testid="delegation-analyze" onClick={analyze} disabled={!transcript.trim() || parsing} className="mt-2 w-full inline-flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-[#14b8a6] to-[#0d9488] text-[#030712] font-black text-sm disabled:opacity-40 active:scale-98 transition-all">
              {parsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} {tri("Analizza con Mike Mix", "Mit Mike Mix analysieren", "Analyze with Mike Mix", "Analizar con Mike Mix", "Analyser avec Mike Mix", "تحلیل با Mike Mix")}
            </button>

            {/* PROPOSTA */}
            <AnimatePresence>
              {proposal && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} data-testid="delegation-proposal" className="mt-5 rounded-3xl border p-4" style={{ borderColor: `${K.c}55`, background: `${K.c}0d` }}>
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full" style={{ background: `${K.c}22`, color: K.c }}><K.icon className="w-3.5 h-3.5" /> {tri(K.it, K.de, K.en, K.es, K.fr, K.fa)}</span>
                    <span className="text-[11px] font-bold text-[#94A3B8]">{tri("priorità", "Priorität", "priority", "prioridad", "priorité", "اولویت")}: {proposal.priority}</span>
                    <span className="text-[11px] text-[#64748B]">👥 {proposal.staff?.present}/{proposal.staff?.total}</span>
                  </div>
                  <h3 className="text-base font-black text-white mb-1">{proposal.title}</h3>
                  {proposal.kind === "crisis_override" && proposal.pacing && (
                    <div className="mb-3 inline-flex items-center gap-1.5 text-[12px] font-bold text-[#f59e0b] bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-lg px-3 py-1.5" data-testid="delegation-pacing"><Gauge className="w-4 h-4" /> {tri("Ritmo", "Tempo", "Pacing", "Ritmo", "Rythme", "ریتم")}: {proposal.pacing}{proposal.pacing_target ? ` · ${proposal.pacing_target}` : ""}</div>
                  )}
                  <div className="space-y-2" data-testid="delegation-steps">
                    {(proposal.steps || []).map((s) => (
                      <div key={s.order} className="rounded-2xl bg-[#030712] border border-[#1e293b] p-3">
                        <div className="flex items-start gap-2">
                          <span className="shrink-0 w-6 h-6 rounded-full bg-[#14b8a6]/20 text-[#14b8a6] text-xs font-black flex items-center justify-center">{s.order}</span>
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] text-white font-semibold leading-snug">{s.instruction}</p>
                            <p className="text-[10px] text-[#64748B] mt-0.5">{tri("competenza", "Kompetenz", "skill", "competencia", "compétence", "مهارت")}: {s.sub_role || "—"}</p>
                            <div className="mt-1.5 flex items-center gap-2">
                              <select data-testid={`delegation-assignee-${s.order}`} value={s.assignee || ""} onChange={(e) => setAssignee(s.order, e.target.value)} className="flex-1 bg-[#0b0f19] border border-[#1e293b] rounded-lg px-2 py-1.5 text-[12px] text-white outline-none focus:border-[#14b8a6]">
                                <option value="">{tri("— nessuno —", "— keiner —", "— none —", "— ninguno —", "— aucun —", "— هیچ —")}</option>
                                {pool.map((w) => (<option key={w.name} value={w.name}>{w.name}{w.position ? ` · ${w.position}` : ""}</option>))}
                              </select>
                              {s.assignee_aura && <span className="text-[10px] font-black px-2 py-1 rounded-full shrink-0" style={{ background: `${s.assignee_aura.color}22`, color: s.assignee_aura.color }}>{s.assignee_aura.aura_effect}</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button data-testid="delegation-confirm" onClick={confirm} disabled={confirming} className="mt-4 w-full inline-flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-black text-sm disabled:opacity-50 active:scale-98 transition-all">
                    {confirming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} {tri("Conferma e invia al floor", "Bestätigen & senden", "Confirm & dispatch", "Confirmar y enviar", "Confirmer & envoyer", "تأیید و ارسال")}
                  </button>
                  <p className="mt-1.5 text-center text-[10px] text-[#64748B] flex items-center justify-center gap-1"><ChevronRight className="w-3 h-3" /> {tri("Puoi riassegnare ogni step prima di confermare.", "Du kannst jeden Schritt neu zuweisen.", "You can reassign each step before confirming.", "Puedes reasignar cada paso.", "Tu peux réassigner chaque étape.", "می‌توانی هر گام را دوباره اختصاص دهی.")}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}
