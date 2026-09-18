import { useEffect, useRef, useState, useCallback } from "react";
import { Headphones, X, Mic, Loader2, Volume2, PhoneCall, Check, XCircle } from "lucide-react";
import { playTTS, stopTTS } from "@/lib/tts";
import { labAskApi, productionApi, coordinationApi } from "@/lib/api";

const WAKE = /\b(sitor|sìtor|sitore)\b/i;
const YES = /\b(s[iì]|sì|yes|ok|okay|va bene|certo|accetto|ja|oui|d'accordo|arrivo)\b/i;
const NO = /\b(no|nein|non|niente|non posso|occupato|impossibile)\b/i;
// Parole d'emergenza in tutte le lingue: se le sento, faccio partire l'aiuto anche SENZA wake-word.
const EMERGENCY_RE = /\b(scottat|bruciat|ustion|sangue|taglio|tagliat|ferit|infortun|caduto|caduta|svenut|malore|gas|fumo|incendio|fiamme|fuoco|burn|bleeding|blood|\bcut\b|injur|fainted|smoke|\bfire\b|verbrenn|blut|schnitt|verletz|rauch|feuer|brand|quemad|sangre|cort|herid|humo|fuego|incendio|desmay|br[ûu]l|\bsang\b|coup|bless|fum[ée]e|\bfeu\b|سوخت|خون|برید|مصدوم|گاز|دود|آتش)/i;
// "Non è ancora arrivato nessuno" in varie lingue → rilancia la ricerca.
const NOBODY_RE = /(nessuno.*(arriv|venut)|non.*arriv|niemand|nobody.*(com|arriv)|no one|nadie|personne.*venu|هیچ‌کس)/i;
const DAYS = ["lun", "mar", "mer", "gio", "ven", "sab", "dom"];

// Modalità Cuffie: ascolto continuo a mani libere. Dici "Sitor, ..." e Sitor risponde a voce.
// Riceve anche le CHIAMATE DI COORDINAMENTO (assegnazione task) con risposta a voce sì/no.
export default function HeadphonesMode({ lang = "it", tri, operator = "", dept = "", onClose }) {
  const [status, setStatus] = useState("idle"); // idle | listening | thinking | speaking
  const [last, setLast] = useState("");
  const [reply, setReply] = useState("");
  const [supported, setSupported] = useState(true);
  const [call, setCall] = useState(null); // chiamata di coordinamento in attesa di risposta
  const recRef = useRef(null);
  const activeRef = useRef(true);
  const busyRef = useRef(false);
  const callRef = useRef(null);
  const helpConfirmRef = useRef(null); // richiesta d'aiuto in attesa di conferma sì/no
  useEffect(() => { callRef.current = call; }, [call]);

  const voiceLang = ({ it: "it-IT", de: "de-DE", en: "en-US", es: "es-ES", fr: "fr-FR", fa: "fa-IR" }[lang] || "it-IT");

  const say = useCallback((msg, back = true) => {
    setReply(msg); setStatus("speaking");
    playTTS(msg, { lang, onEnded: () => { if (back) { setStatus("listening"); busyRef.current = false; } } });
  }, [lang]);

  // Attiva la richiesta d'aiuto confermata (o l'emergenza) sul backend.
  const fireHelp = useCallback(async (parsed) => {
    setStatus("thinking");
    try {
      const r = await coordinationApi.helpTrigger({ transcript: parsed.transcript, lang, operator, dept, urgency: parsed.urgency, category: parsed.category });
      say(r.spoken || "");
    } catch {
      say(tri("Non riesco ad avviare la chiamata ora. Chiedi aiuto direttamente a un collega vicino o al Capo.", "Ich kann den Ruf gerade nicht starten. Frag direkt einen Kollegen oder den Chef.", "I can't start the call right now. Ask a colleague nearby or the boss directly.", "No puedo iniciar la llamada ahora. Pide ayuda a un compañero o al jefe.", "Je ne peux pas lancer l'appel maintenant. Demande à un collègue ou au chef.", "الان نمی‌توانم تماس را شروع کنم. مستقیم از همکار یا رئیس کمک بخواه."));
    }
  }, [lang, operator, dept, say, tri]);

  // Prova a interpretare la frase come richiesta d'aiuto. Ritorna true se gestita.
  const tryHelp = useCallback(async (clean, forceEmergency = false) => {
    setStatus("thinking");
    let parsed;
    try {
      parsed = await coordinationApi.helpParse(clean, lang);
    } catch {
      // 10) RETE ASSENTE / IA non risponde: messaggio vocale chiaro, mai silenzio.
      say(tri("Non riesco a capirti ora. Chiedi aiuto direttamente a un collega vicino o al Capo.", "Ich kann dich gerade nicht verstehen. Frag direkt einen Kollegen in der Nähe oder den Chef.", "I can't understand you right now. Ask a colleague nearby or the boss directly.", "No puedo entenderte ahora. Pide ayuda a un compañero cercano o al jefe.", "Je ne te comprends pas maintenant. Demande à un collègue proche ou au chef.", "الان نمی‌توانم بفهمم. مستقیم از همکار نزدیک یا رئیس کمک بخواه."));
      return true;
    }
    if (!parsed.is_help && !forceEmergency) return false; // non è aiuto → lascia gestire come domanda
    if (parsed.emergency || forceEmergency) { await fireHelp({ ...parsed, urgency: "emergency" }); return true; }
    // 3) conferma vocale prima di attivare (evita falsi allarmi da rumore)
    helpConfirmRef.current = parsed;
    say(parsed.confirm_question || tri("Ho capito che ti serve aiuto, confermi?", "Du brauchst Hilfe, richtig?", "You need help, right?", "¿Necesitas ayuda?", "Tu as besoin d'aide ?", "کمک لازم داری؟"));
    return true;
  }, [lang, say, tri, fireHelp]);

  // Risposta a una chiamata di coordinamento (sì/no), a voce o con tocco.
  const answerCall = useCallback(async (yes) => {
    const c = callRef.current;
    if (!c) return;
    setCall(null); callRef.current = null;
    try {
      const r = await coordinationApi.respond(c.id, yes ? "si" : "no", operator);
      const ok = yes && r.status === "accepted";
      const msg = ok
        ? tri("Perfetto, ci pensi tu. Buon lavoro.", "Perfekt, du übernimmst. Gute Arbeit.", "Great, you've got it. Good work.", "Perfecto, te encargas tú.", "Parfait, tu t'en occupes.", "عالی، تو انجامش می‌دهی.")
        : tri("Va bene, passo al prossimo.", "Okay, ich frage den nächsten.", "Okay, moving to the next.", "Vale, paso al siguiente.", "D'accord, je passe au suivant.", "باشه، به نفر بعدی می‌روم.");
      setReply(msg); setStatus("speaking");
      playTTS(msg, { lang, onEnded: () => { setStatus("listening"); busyRef.current = false; } });
    } catch { busyRef.current = false; setStatus("listening"); }
  }, [lang, operator, tri]);

  const handle = useCallback(async (phrase) => {
    if (busyRef.current) return;
    const clean = phrase.replace(WAKE, "").trim();
    if (!clean) return;
    busyRef.current = true;
    setLast(clean);
    // Intento locale: "segna 40 pezzi [di baguette]" → registra produzione senza toccare lo schermo.
    const m = clean.match(/segna\s+(\d+)\s*pezzi(?:\s+di\s+(.+))?/i) || clean.match(/(\d+)\s*pezzi\s+(?:di\s+)?(.+)\s+fatt/i);
    try {
      if (m) {
        const qty = parseInt(m[1], 10);
        const prod = (m[2] || "").trim();
        setStatus("thinking");
        await productionApi.log({ day_key: DAYS[(new Date().getDay() + 6) % 7], recipe_name: prod || "Produzione", produced: qty, leftover: 0 });
        const r = tri(`Segnati ${qty} pezzi${prod ? " di " + prod : ""}.`, `${qty} Stück${prod ? " " + prod : ""} erfasst.`, `Logged ${qty} pieces${prod ? " of " + prod : ""}.`, `Anotados ${qty} piezas.`, `${qty} pièces notées.`, `${qty} عدد ثبت شد.`);
        setReply(r); setStatus("speaking");
        playTTS(r, { lang, onEnded: () => { setStatus("listening"); busyRef.current = false; } });
        return;
      }
      setStatus("thinking");
      // Limite giornaliero richieste vocali (configurato dal Capo): oltre il limite Sitor tace (solo eventi critici).
      if (operator) {
        const q = await coordinationApi.voiceQuota(operator, false);
        if (q && q.allowed === false) {
          const lim = tri("Hai raggiunto il limite di richieste per oggi. Sitor risponderà solo per gli allarmi importanti.", "Tageslimit erreicht. Sitor antwortet nur noch bei wichtigen Alarmen.", "You reached today's request limit. Sitor will only answer critical alerts.", "Has alcanzado el límite de hoy. Sitor solo responderá a alertas importantes.", "Tu as atteint la limite du jour. Sitor ne répondra qu'aux alertes importantes.", "به سقف امروز رسیدی. سیتور فقط به هشدارهای مهم پاسخ می‌دهد.");
          setReply(lim); setStatus("speaking");
          playTTS(lim, { lang, onEnded: () => { setStatus("listening"); busyRef.current = false; } });
          return;
        }
      }
      // Richiesta d'aiuto? Se sì, gestita qui; altrimenti prosegue come domanda a Sitor.
      const handledAsHelp = await tryHelp(clean);
      if (handledAsHelp) return;
      const d = await labAskApi.ask(clean, lang);
      const ans = d.answer || "";
      say(ans);
    } catch {
      setStatus("listening"); busyRef.current = false;
    }
  }, [lang, tri, operator, tryHelp, say]);

  const onPhrase = useCallback((t) => {
    // Se c'è una chiamata di coordinamento in attesa: sì/no risponde SENZA wake-word.
    if (callRef.current) {
      if (YES.test(t)) { answerCall(true); return; }
      if (NO.test(t)) { answerCall(false); return; }
    }
    // Conferma di una richiesta d'aiuto in sospeso (sì/no, senza wake-word).
    if (helpConfirmRef.current) {
      if (YES.test(t)) { const p = helpConfirmRef.current; helpConfirmRef.current = null; fireHelp(p); return; }
      if (NO.test(t)) { helpConfirmRef.current = null; say(tri("Va bene, annullo la richiesta.", "Okay, ich breche ab.", "Okay, cancelling the request.", "Vale, cancelo la solicitud.", "D'accord, j'annule.", "باشه، لغو کردم.")); return; }
    }
    if (busyRef.current) return;
    // 7) EMERGENZA: parte anche senza wake-word e senza conferma.
    if (EMERGENCY_RE.test(t)) { busyRef.current = true; setLast(t.trim()); tryHelp(t.trim(), true); return; }
    // 6) "Non è ancora arrivato nessuno" → rilancia la ricerca.
    if (NOBODY_RE.test(t) && operator) {
      busyRef.current = true; setStatus("thinking");
      coordinationApi.helpReping(operator, dept, lang)
        .then((r) => say(r.spoken || ""))
        .catch(() => say(tri("Non riesco a rilanciare la ricerca ora. Chiedi al Capo.", "Kann die Suche nicht neu starten. Frag den Chef.", "I can't restart the search now. Ask the boss.", "No puedo reintentar ahora. Pregunta al jefe.", "Je ne peux pas relancer. Demande au chef.", "الان نمی‌توانم دوباره جستجو کنم. از رئیس بپرس.")));
      return;
    }
    if (WAKE.test(t)) handle(t);
  }, [answerCall, handle, fireHelp, tryHelp, say, tri, operator, dept, lang]);

  // Polling delle chiamate di coordinamento indirizzate a questo operatore.
  useEffect(() => {
    if (!operator) return;
    let alive = true;
    const poll = async () => {
      if (!alive || callRef.current || busyRef.current) return;
      try {
        const d = await coordinationApi.pendingCall(operator);
        if (alive && d && d.has_call && d.call) {
          setCall(d.call); callRef.current = d.call;
          setStatus("speaking");
          const spoken = d.spoken + " " + tri("Rispondi sì o no.", "Antworte ja oder nein.", "Answer yes or no.", "Responde sí o no.", "Réponds oui ou non.", "بله یا خیر بگو.");
          setReply(spoken);
          playTTS(spoken, { lang, onEnded: () => setStatus("listening") });
        }
      } catch { /* */ }
    };
    const t = setInterval(poll, 6000);
    poll();
    return () => { alive = false; clearInterval(t); };
  }, [operator, lang, tri]);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setSupported(false); return; }
    const rec = new SR();
    rec.lang = voiceLang; rec.continuous = true; rec.interimResults = false;
    rec.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = (e.results[i][0].transcript || "").trim();
        onPhrase(t);
      }
    };
    rec.onend = () => { if (activeRef.current) { try { rec.start(); } catch { /* */ } } };
    rec.onerror = () => { /* ignora, onend rilancia */ };
    recRef.current = rec;
    activeRef.current = true;
    try { rec.start(); setStatus("listening"); } catch { /* */ }
    return () => { activeRef.current = false; try { rec.stop(); } catch { /* */ } stopTTS(); };
  }, [voiceLang, onPhrase]);

  const close = () => { activeRef.current = false; try { recRef.current?.stop(); } catch { /* */ } stopTTS(); onClose(); };

  const ring = status === "speaking" ? "#7E9A82" : status === "thinking" ? "#c9a24a" : status === "listening" ? "#7E9A82" : "#64748B";
  const label = status === "speaking" ? tri("Sitor parla…", "Sitor spricht…", "Sitor speaking…", "Sitor habla…", "Sitor parle…", "سیتور صحبت می‌کند…")
    : status === "thinking" ? tri("Sitor pensa…", "Sitor denkt…", "Sitor thinking…", "Sitor piensa…", "Sitor réfléchit…", "سیتور فکر می‌کند…")
    : tri("In ascolto… di' \"Sitor, …\"", "Höre zu… sag \"Sitor, …\"", "Listening… say \"Sitor, …\"", "Escuchando… di \"Sitor, …\"", "À l'écoute… dis \"Sitor, …\"", "در حال شنیدن… بگو «سیتور…»");

  return (
    <div data-testid="headphones-overlay" className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-[#18181A]/95 backdrop-blur-md p-6">
      <button data-testid="headphones-close" onClick={close} className="absolute top-5 right-5 p-2 rounded-xl text-[#94A3B8] hover:bg-white/10"><X className="w-6 h-6" /></button>
      {!supported ? (
        <p className="text-center text-[#b06e78] max-w-xs">{tri("Le cuffie vocali non sono supportate su questo dispositivo/browser.", "Sprachmodus wird hier nicht unterstützt.", "Voice headphones not supported on this device/browser.", "No soportado en este dispositivo.", "Non supporté sur cet appareil.", "پشتیبانی نمی‌شود.")}</p>
      ) : (
        <>
          <div className="relative flex items-center justify-center w-40 h-40 mb-8">
            <span className="absolute inset-0 rounded-full animate-ping opacity-30" style={{ background: ring }} />
            <span className="relative flex items-center justify-center w-32 h-32 rounded-full" style={{ background: `${ring}22`, border: `2px solid ${ring}` }}>
              {status === "thinking" ? <Loader2 className="w-12 h-12 animate-spin" style={{ color: ring }} /> : status === "speaking" ? <Volume2 className="w-12 h-12" style={{ color: ring }} /> : <Mic className="w-12 h-12" style={{ color: ring }} />}
            </span>
          </div>
          <p data-testid="headphones-status" className="text-lg font-bold text-white mb-2">{label}</p>
          {last && <p className="text-sm text-[#94A3B8] mb-1 text-center max-w-md">“{last}”</p>}
          {reply && <p data-testid="headphones-reply" className="text-base text-[#7fd3c9] text-center max-w-md mt-2 leading-relaxed">{reply}</p>}

          {call && (
            <div data-testid="headphones-call" className="mt-6 w-full max-w-sm rounded-2xl bg-[#242427] border border-[#D97736]/50 p-4">
              <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-[#D97736] mb-1"><PhoneCall className="w-3.5 h-3.5" /> {tri("Chiamata di coordinamento", "Koordinationsruf", "Coordination call", "Llamada de coordinación", "Appel de coordination", "تماس هماهنگی")}</p>
              <p className="text-sm text-white font-bold mb-3">{call.task_desc}</p>
              <div className="grid grid-cols-2 gap-2">
                <button data-testid="headphones-call-yes" onClick={() => answerCall(true)} className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#7E9A82] text-white font-bold active:scale-95"><Check className="w-4 h-4" /> {tri("Sì", "Ja", "Yes", "Sí", "Oui", "بله")}</button>
                <button data-testid="headphones-call-no" onClick={() => answerCall(false)} className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#3a2a2a] text-[#e0a878] border border-[#D97736]/40 font-bold active:scale-95"><XCircle className="w-4 h-4" /> {tri("No", "Nein", "No", "No", "Non", "خیر")}</button>
              </div>
              <p className="text-[11px] text-[#94A3B8] text-center mt-2">{tri("Puoi rispondere anche a voce: «sì» o «no»", "Du kannst auch per Stimme antworten.", "You can also answer by voice.", "También puedes responder por voz.", "Tu peux aussi répondre à la voix.", "می‌توانی با صدا هم پاسخ دهی.")}</p>
            </div>
          )}
          <p className="mt-8 text-xs text-[#64748B] text-center max-w-xs">{tri("Esempi: \"Sitor, le teglie sono finite\" · \"Sitor, mi serve una mano\" · in emergenza dì cosa è successo", "Beispiele: \"Sitor, die Bleche sind alle\" · \"Sitor, ich brauche Hilfe\"", "Examples: \"Sitor, we're out of trays\" · \"Sitor, I need a hand\" · in an emergency, just say what happened", "Ejemplos: \"Sitor, se acabaron las bandejas\" · \"Sitor, necesito una mano\"", "Exemples : \"Sitor, plus de plaques\" · \"Sitor, j'ai besoin d'aide\"", "مثال‌ها: «سیتور، سینی‌ها تمام شد» · «سیتور، یک کمک لازم دارم»")}</p>
        </>
      )}
    </div>
  );
}
