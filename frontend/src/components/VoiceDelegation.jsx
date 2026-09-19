import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mic, Loader2, Sparkles, Send, ChevronRight, Gauge, ShieldAlert, Brush, ListChecks, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { delegationApi } from "@/lib/api";
import { playTTS, toBCP47 } from "@/lib/tts";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

const KIND = {
  sanificazione: { icon: Brush, c: "hsl(var(--accent))", it: "Sanificazione", de: "Reinigung", en: "Sanitation", es: "Sanitización", fr: "Nettoyage", fa: "بهداشت" },
  regola: { icon: ShieldAlert, c: "hsl(var(--muted-foreground))", it: "Regola", de: "Regel", en: "Rule", es: "Regla", fr: "Règle", fa: "قاعده" },
  crisis_override: { icon: Gauge, c: "hsl(var(--muted-foreground))", it: "Crisis Override", de: "Crisis Override", en: "Crisis Override", es: "Crisis Override", fr: "Crisis Override", fa: "بازنویسی بحران" },
  generico: { icon: ListChecks, c: "hsl(var(--primary))", it: "Task", de: "Aufgabe", en: "Task", es: "Tarea", fr: "Tâche", fa: "وظیفه" },
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
  const [moved, setMoved] = useState(null);
  const recRef = useRef(null);
  const moveHandlerRef = useRef(null);

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
    rec.onend = () => {
      setListening(false);
      // COMANDO VOCE REALE: se il Capo ha dettato uno spostamento, eseguilo subito a mani
      // libere (senza dover premere Analizza). Gli altri ordini restano da confermare.
      const said = (finalTx || "").trim();
      if (said && moveHandlerRef.current) { moveHandlerRef.current(said); }
    };
    rec.onerror = () => { setListening(false); };
    recRef.current = rec;
    try { rec.start(); setListening(true); } catch { /* gesto utente */ }
  }, [listening, lang, tri]);

  useEffect(() => () => { try { recRef.current?.stop(); } catch { /* */ } }, []);

  // COMANDO CAPO A VOCE (priorità assoluta): «Sposta Sara ai forni» → sposta subito
  // l'operatore, bypassando l'analisi IA. Vince su qualsiasi decisione automatica di Sitor.
  const MOVE_RE = /\b(?:sposta|metti|porta|manda|move|put|send|mueve|deplace|déplace|verschiebe)\s+([A-Za-zÀ-ÿ]{2,})\s+(?:a|ai|al|alla|allo|all'|in|nel|nella|verso|su|to|al?\s+reparto|zu|a\s+la|à|vers)\s+(.+)/i;
  const tryCapoMove = useCallback(async (text) => {
    const mm = (text || "").trim().match(MOVE_RE);
    if (!mm) return false;
    const operator = mm[1].trim();
    const dest = mm[2].trim().replace(/[.。]+$/, "");
    try {
      const r = await delegationApi.capoMove(operator, dest, dest, "");
      setMoved({ operator, dest });
      try { playTTS(tri(`Fatto. ${operator} spostato a ${dest} con priorità assoluta.`, `Erledigt. ${operator} mit absoluter Priorität nach ${dest} verschoben.`, `Done. ${operator} moved to ${dest} with absolute priority.`, `Hecho. ${operator} movido a ${dest} con prioridad absoluta.`, `Terminé. ${operator} déplacé vers ${dest} en priorité absolue.`, `انجام شد. ${operator} با اولویت مطلق به ${dest} منتقل شد.`), lang); } catch { /* */ }
      toast.success(r?.mikemix_insight || tri("Comando della Direzione applicato", "Befehl angewendet", "Command applied", "Comando aplicado", "Commande appliquée", "دستور اعمال شد"));
    } catch (e) {
      toast.error(e?.response?.data?.detail || tri("Comando non applicato", "Nicht angewendet", "Not applied", "No aplicado", "Non appliqué", "اعمال نشد"));
    }
    return true;
  }, [lang, tri]);

  // Il microfono usa sempre l'ultima versione di tryCapoMove (comando vocale reale).
  useEffect(() => { moveHandlerRef.current = tryCapoMove; }, [tryCapoMove]);

  const analyze = useCallback(async () => {
    const t = transcript.trim();
    if (!t) return;
    try { recRef.current?.stop(); } catch { /* */ }
    setListening(false); setParsing(true); setProposal(null); setDone(null); setMoved(null);
    // Priorità: se è un comando diretto di spostamento del Capo, eseguilo subito.
    if (await tryCapoMove(t)) { setParsing(false); return; }
    try {
      const r = await delegationApi.parse(t, lang);
      setProposal(r.proposal); setPool(r.pool || []);
    } catch (e) {
      toast.error(e?.response?.data?.detail || tri("Comando non compreso", "Nicht verstanden", "Not understood", "No entendido", "Non compris", "درک نشد"));
    }
    setParsing(false);
  }, [transcript, lang, tri, tryCapoMove]);

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
      // Sitor conferma a voce SOLO al Capo (modalità strategica attiva).
      try { playTTS(tri(`Fatto. ${proposal.title} inviato in produzione senza annuncio vocale.`, `Erledigt. ${proposal.title} ohne Sprachansage an die Produktion gesendet.`, `Done. ${proposal.title} sent to production without voice announcement.`, `Hecho. ${proposal.title} enviado a producción sin aviso de voz.`, `Terminé. ${proposal.title} envoyé en production sans annonce vocale.`, `انجام شد. ${proposal.title} بدون اعلان صوتی به تولید ارسال شد.`), lang); } catch { /* */ }
      toast.success(r.mikemix_insight || tri("Task inviato", "Gesendet", "Task sent", "Enviado", "Envoyé", "ارسال شد"));
    } catch (e) {
      toast.error(e?.response?.data?.detail || tri("Errore", "Fehler", "Error", "Error", "Erreur", "خطا"));
    }
    setConfirming(false);
  }, [proposal, lang, tri]);

  const K = proposal ? (KIND[proposal.kind] || KIND.generico) : null;

  return (
    <div data-testid="voice-delegation" data-tour-suppress="true" className="fixed inset-0 z-[80] bg-background/97 backdrop-blur-xl overflow-y-auto">
      <div className="max-w-2xl mx-auto p-4 pb-16">
        <div className="flex items-center justify-between sticky top-0 bg-background/95 py-2 z-10">
          <h2 className="text-lg font-black text-foreground flex items-center gap-2"><Mic className="w-5 h-5 text-primary" /> {tri("Delega Vocale (Eclipse)", "Sprachdelegation (Eclipse)", "Voice Delegation (Eclipse)", "Delegación por Voz (Eclipse)", "Délégation Vocale (Eclipse)", "واگذاری صوتی (اکلیپس)")}</h2>
          <button data-testid="delegation-close" onClick={() => { try { recRef.current?.stop(); } catch { /* */ } onClose(); }} className="w-9 h-9 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>

        {done ? (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} data-testid="delegation-done" className="flex flex-col items-center text-center py-8 space-y-4">
            <div className="w-20 h-20 rounded-full bg-emerald-500/15 border-2 border-emerald-500 flex items-center justify-center"><CheckCircle2 className="w-10 h-10 text-emerald-400" /></div>
            <div>
              <h3 className="text-lg font-black text-emerald-300">{done.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{tri("Inviato in produzione senza annuncio vocale · gli operatori vedranno i loro step.", "An die Produktion gesendet.", "Sent to production.", "Enviado a producción.", "Envoyé en production.", "به تولید ارسال شد.")}</p>
            </div>
            <div className="flex gap-2">
              <button data-testid="delegation-new" onClick={() => { setDone(null); setProposal(null); setTranscript(""); }} className="px-5 py-3 rounded-xl bg-background border border-border text-foreground text-sm font-bold active:scale-95">{tri("Nuova delega", "Neue Delegation", "New delegation", "Nueva delegación", "Nouvelle délégation", "واگذاری جدید")}</button>
              <button data-testid="delegation-exit" onClick={onClose} className="px-5 py-3 rounded-xl bg-gradient-to-r from-primary to-muted text-foreground text-sm font-black active:scale-95">{tri("Chiudi", "Schließen", "Close", "Cerrar", "Fermer", "بستن")}</button>
            </div>
          </motion.div>
        ) : (
          <>
            <p className="text-[12px] text-muted-foreground mb-4">{tri("Detta un ordine: Sitor lo trasforma in task di squadra e propone gli operatori. Confermi tu prima dell'invio. Oppure dai un comando diretto: «Sposta Sara ai forni» (priorità assoluta).", "Diktiere einen Befehl: Sitor macht daraus eine Team-Aufgabe. Oder direkt: «Verschiebe Sara zu den Öfen».", "Dictate an order: Sitor turns it into a team task. Or a direct command: «Move Sara to the ovens» (absolute priority).", "Dicta una orden o un comando directo: «Mueve a Sara a los hornos» (prioridad absoluta).", "Dicte un ordre ou une commande directe : «Déplace Sara vers les fours» (priorité absolue).", "دستوری بگو یا فرمان مستقیم: «سارا را به فرها منتقل کن».")}</p>

            {moved && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} data-testid="capo-move-done" className="mb-4 rounded-2xl border border-primary/40 bg-primary/10 p-3 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                <p className="text-[13px] text-foreground font-semibold">{tri(`${moved.operator} spostato a ${moved.dest} · priorità assoluta della Direzione`, `${moved.operator} nach ${moved.dest} verschoben · absolute Priorität`, `${moved.operator} moved to ${moved.dest} · absolute priority`, `${moved.operator} movido a ${moved.dest} · prioridad absoluta`, `${moved.operator} déplacé vers ${moved.dest} · priorité absolue`, `${moved.operator} به ${moved.dest} منتقل شد · اولویت مطلق`)}</p>
              </motion.div>
            )}

            {/* MIC + testo */}
            <div className="flex flex-col items-center mb-4">
              <button data-testid="delegation-mic" onClick={toggleMic} className="relative active:scale-95 transition-transform">
                {listening && <span aria-hidden className="absolute -inset-2 rounded-full border-2 border-primary/50 animate-ping" />}
                <span className={`relative w-20 h-20 rounded-full flex items-center justify-center border-4 ${listening ? "bg-primary border-primary text-primary-foreground" : "bg-background border-border text-primary"}`}><Mic className="w-8 h-8" /></span>
              </button>
              <p className="mt-2 text-[11px] text-muted-foreground">{listening ? tri("Sto ascoltando…", "Ich höre zu…", "Listening…", "Escuchando…", "J'écoute…", "در حال شنیدن…") : tri("Tocca e parla: «Sposta Sara ai forni» parte subito", "Tippen & sprechen: «Verschiebe Sara zu den Öfen»", "Tap & speak: «Move Sara to the ovens» runs instantly", "Toca y habla: «Mueve a Sara a los hornos»", "Touche et parle : «Déplace Sara vers les fours»", "بزن و بگو: «سارا را به فرها منتقل کن»")}</p>
            </div>
            <textarea
              data-testid="delegation-transcript" value={transcript} onChange={(e) => setTranscript(e.target.value)} rows={2}
              placeholder={tri("Es. «Sanificate i carrelli al reparto forni»", "z.B. «Reinigt die Wagen am Ofen»", "e.g. «Sanitize the trolleys at the ovens»", "Ej. «Sanitizad los carros en hornos»", "Ex. «Nettoyez les chariots aux fours»", "مثال «چرخ‌ها را کنار فرها بشویید»")}
              className="w-full bg-background border border-border rounded-2xl p-3 text-sm text-foreground outline-none focus:border-primary resize-none"
            />
            <button data-testid="delegation-analyze" onClick={analyze} disabled={!transcript.trim() || parsing} className="mt-2 w-full inline-flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-primary to-muted text-foreground font-black text-sm disabled:opacity-40 active:scale-98 transition-all">
              {parsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} {tri("Analizza con Sitor", "Mit Sitor analysieren", "Analyze with Sitor", "Analizar con Sitor", "Analyser avec Sitor", "تحلیل با Sitor")}
            </button>

            {/* PROPOSTA */}
            <AnimatePresence>
              {proposal && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} data-testid="delegation-proposal" className="mt-5 rounded-3xl border p-4" style={{ borderColor: `${K.c}55`, background: `${K.c}0d` }}>
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full" style={{ background: `${K.c}22`, color: K.c }}><K.icon className="w-3.5 h-3.5" /> {tri(K.it, K.de, K.en, K.es, K.fr, K.fa)}</span>
                    <span className="text-[11px] font-bold text-muted-foreground">{tri("priorità", "Priorität", "priority", "prioridad", "priorité", "اولویت")}: {proposal.priority}</span>
                    <span className="text-[11px] text-muted-foreground">👥 {proposal.staff?.present}/{proposal.staff?.total}</span>
                  </div>
                  <h3 className="text-base font-black text-foreground mb-1">{proposal.title}</h3>
                  {proposal.kind === "crisis_override" && proposal.pacing && (
                    <div className="mb-3 inline-flex items-center gap-1.5 text-[12px] font-bold text-muted-foreground bg-muted/10 border border-border/30 rounded-lg px-3 py-1.5" data-testid="delegation-pacing"><Gauge className="w-4 h-4" /> {tri("Ritmo", "Tempo", "Pacing", "Ritmo", "Rythme", "ریتم")}: {proposal.pacing}{proposal.pacing_target ? ` · ${proposal.pacing_target}` : ""}</div>
                  )}
                  <div className="space-y-2" data-testid="delegation-steps">
                    {(proposal.steps || []).map((s) => (
                      <div key={s.order} className="rounded-2xl bg-background border border-border p-3">
                        <div className="flex items-start gap-2">
                          <span className="shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-black flex items-center justify-center">{s.order}</span>
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] text-foreground font-semibold leading-snug">{s.instruction}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{tri("competenza", "Kompetenz", "skill", "competencia", "compétence", "مهارت")}: {s.sub_role || "—"}</p>
                            <div className="mt-1.5 flex items-center gap-2">
                              <select data-testid={`delegation-assignee-${s.order}`} value={s.assignee || ""} onChange={(e) => setAssignee(s.order, e.target.value)} className="flex-1 bg-background border border-border rounded-lg px-2 py-1.5 text-[12px] text-foreground outline-none focus:border-primary">
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
                  <button data-testid="delegation-confirm" onClick={confirm} disabled={confirming} className="mt-4 w-full inline-flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-foreground font-black text-sm disabled:opacity-50 active:scale-98 transition-all">
                    {confirming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} {tri("Conferma e invia in produzione", "Bestätigen & senden", "Confirm & dispatch", "Confirmar y enviar", "Confirmer & envoyer", "تأیید و ارسال")}
                  </button>
                  <p className="mt-1.5 text-center text-[10px] text-muted-foreground flex items-center justify-center gap-1"><ChevronRight className="w-3 h-3" /> {tri("Puoi riassegnare ogni step prima di confermare.", "Du kannst jeden Schritt neu zuweisen.", "You can reassign each step before confirming.", "Puedes reasignar cada paso.", "Tu peux réassigner chaque étape.", "می‌توانی هر گام را دوباره اختصاص دهی.")}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}
