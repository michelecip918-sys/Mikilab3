import { useState, useEffect, useRef, useCallback } from "react";
import { ShieldCheck, Mic, Loader2, X, AlertTriangle } from "lucide-react";
import { antifoolApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

const SR_LOCALE = { it: "it-IT", de: "de-DE", en: "en-US", es: "es-ES", fr: "fr-FR", fa: "fa-IR", ar: "ar-SA", tr: "tr-TR" };

// Gate Anti-Fooling: l'operatore deve pronunciare dal vivo una frase-sfida casuale.
// Blocca proxy/handoff non autorizzati. Dopo 3 fallimenti → allarme ghost-activity.
export default function LivenessGate({ onPass, onCancel }) {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [ch, setCh] = useState(null);
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState("");
  const [fails, setFails] = useState(0);
  const [status, setStatus] = useState(null); // null | 'ok' | 'fail' | 'ghost'
  const [typed, setTyped] = useState("");
  const recRef = useRef(null);
  const supported = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);

  const loadChallenge = useCallback(() => {
    antifoolApi.challenge(lang).then(setCh).catch(() => setCh(null));
  }, [lang]);
  useEffect(() => { loadChallenge(); }, [loadChallenge]);

  const verify = async (transcript) => {
    if (!ch) return;
    setBusy(true); setHeard(transcript);
    try {
      const r = await antifoolApi.verify(ch.challenge_id, transcript);
      if (r.ok) { setStatus("ok"); setTimeout(() => onPass && onPass(), 900); }
      else {
        const nf = fails + 1; setFails(nf);
        if (nf >= 3) setStatus("ghost");
        else { setStatus("fail"); loadChallenge(); }
      }
    } catch { setStatus("fail"); loadChallenge(); }
    finally { setBusy(false); }
  };

  const listen = () => {
    if (!supported) return;
    if (listening && recRef.current) { try { recRef.current.stop(); } catch { /* */ } return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = SR_LOCALE[lang] || "it-IT"; rec.interimResults = false; rec.maxAlternatives = 1;
    rec.onstart = () => { setListening(true); setStatus(null); };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.onresult = (ev) => { const t = ev.results?.[0]?.[0]?.transcript || ""; if (t) verify(t); };
    recRef.current = rec;
    try { rec.start(); } catch { setListening(false); }
  };

  return (
    <div data-testid="liveness-gate" className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-[#0b0f19] border border-[#14b8a6]/40 shadow-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#14b8a6]" />
            <h3 className="text-sm font-extrabold text-[#14b8a6]">{tri("Verifica presenza (Anti-Fooling)", "Präsenzprüfung (Anti-Fooling)", "Liveness check (Anti-Fooling)", "Verificación de presencia", "Vérification de présence", "بررسی حضور")}</h3>
          </div>
          {onCancel && <button data-testid="liveness-cancel" onClick={onCancel} className="w-8 h-8 rounded-full bg-[#0f172a] border border-[#1e293b] text-[#94A3B8] flex items-center justify-center"><X className="w-4 h-4" /></button>}
        </div>

        {status === "ghost" ? (
          <div data-testid="liveness-ghost" className="rounded-xl bg-rose-500/10 border border-rose-500/50 p-4 text-center">
            <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-rose-300">{tri("Attività sospetta bloccata.", "Verdächtige Aktivität blockiert.", "Suspicious activity blocked.", "Actividad sospechosa bloqueada.", "Activité suspecte bloquée.", "فعالیت مشکوک مسدود شد.")}</p>
            <p className="text-[11px] text-[#94A3B8] mt-1">{tri("Possibile accesso proxy / ghost. Chiama il Capo.", "Möglicher Proxy-/Ghost-Zugang. Ruf den Chef.", "Possible proxy/ghost login. Call the Capo.", "Posible acceso proxy. Llama al Capo.", "Accès proxy possible. Appelle le Capo.", "ورود پروکسی احتمالی. با کاپو تماس بگیر.")}</p>
          </div>
        ) : (
          <>
            <p className="text-[11px] text-[#94A3B8]">{tri("Pronuncia questa frase per confermare che sei tu dal vivo:", "Sprich diesen Satz, um zu bestätigen, dass du live bist:", "Say this phrase to confirm you're live:", "Di esta frase para confirmar que eres tú:", "Prononce cette phrase pour confirmer :", "این عبارت را بگو تا تأیید شود:")}</p>
            <div data-testid="liveness-phrase" className="rounded-xl bg-[#14b8a6]/8 border border-[#14b8a6]/30 p-3 text-center text-base font-bold text-white">
              {ch ? `“${ch.phrase}”` : <Loader2 className="w-4 h-4 animate-spin mx-auto" />}
            </div>

            {supported ? (
              <button data-testid="liveness-mic" onClick={listen} disabled={busy || !ch}
                className={`w-full inline-flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-sm border active:scale-95 transition-all ${listening ? "bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse" : "bg-[#14b8a6]/15 border-[#14b8a6]/50 text-[#14b8a6]"} disabled:opacity-40`}>
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
                {listening ? tri("Ascolto…", "Höre zu…", "Listening…", "Escuchando…", "Écoute…", "در حال شنیدن…") : tri("Parla per verificare", "Zum Prüfen sprechen", "Speak to verify", "Habla para verificar", "Parle pour vérifier", "برای تأیید صحبت کن")}
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <input data-testid="liveness-typed" value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={tri("Digita la frase…", "Satz eingeben…", "Type the phrase…", "Escribe la frase…", "Tape la phrase…", "عبارت را بنویس…")}
                  className="flex-1 min-w-0 bg-[#030712] border border-[#1e293b] rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-[#14b8a6]" />
                <button data-testid="liveness-typed-verify" onClick={() => verify(typed)} disabled={busy || !typed.trim()} className="shrink-0 px-4 py-2.5 rounded-xl bg-[#14b8a6] text-[#030712] font-bold text-sm disabled:opacity-40">OK</button>
              </div>
            )}

            {status === "ok" && <p data-testid="liveness-ok" className="text-center text-sm font-bold text-[#14b8a6]">✓ {tri("Presenza verificata", "Präsenz bestätigt", "Presence verified", "Presencia verificada", "Présence vérifiée", "حضور تأیید شد")}</p>}
            {status === "fail" && <p data-testid="liveness-fail" className="text-center text-sm font-bold text-amber-400">✗ {tri("Non corrisponde. Riprova.", "Stimmt nicht. Nochmal.", "No match. Try again.", "No coincide. Reintenta.", "Pas de correspondance. Réessaie.", "مطابقت ندارد. دوباره.")} ({heard ? `“${heard}”` : ""}) · {3 - fails} {tri("tentativi", "Versuche", "tries", "intentos", "essais", "تلاش")}</p>}
          </>
        )}
      </div>
    </div>
  );
}
