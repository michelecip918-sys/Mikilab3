import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, Volume2, ListChecks, Eye, Wand2, Cog, Hand, Send, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";
import { sitorFloorApi, deptApi } from "@/lib/api";
import { playTTS } from "@/lib/tts";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

const PUB = process.env.PUBLIC_URL;

// Sitor Maestro di Produzione: guida viva passo-passo per QUESTO operaio, adattata al suo
// livello (novizio/esperto/maestro). Funziona con o senza macchinari. Da qui l'operaio può
// anche proporre una modifica al piano: le piccole le applica Sitor, le grandi vanno al Capo.
export default function SitorMaestro({ role }) {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const level = (() => { try { return localStorage.getItem("mikilab_op_level") || "novizio"; } catch { return "novizio"; } })();
  const [mine, setMine] = useState(null);
  const [hasMachines, setHasMachines] = useState(true);
  const [busy, setBusy] = useState(false);
  const [guide, setGuide] = useState(null);
  const [q, setQ] = useState("");
  const [showChange, setShowChange] = useState(false);
  const [proposal, setProposal] = useState("");
  const [changeBusy, setChangeBusy] = useState(false);
  const [lastChange, setLastChange] = useState(null);

  const loadMine = useCallback(() => {
    if (!role) return;
    deptApi.assignment().then((d) => {
      const m = (d.assignments || []).find((a) => (a.operator || "").toLowerCase() === role.toLowerCase());
      setMine(m || null);
    }).catch(() => {});
  }, [role]);
  useEffect(() => { loadMine(); }, [loadMine]);

  const speak = (t) => { try { if (t) playTTS(t, { lang, voice: "nexus" }); } catch { /* */ } };

  const askGuide = async (question) => {
    if (busy) return;
    setBusy(true); setGuide(null);
    try {
      const r = await sitorFloorApi.guide({
        operator: role, level,
        dept: mine ? (mine.dept_name || mine.dept || "") : "",
        task: mine ? (mine.task || "") : "",
        recipe: mine ? (mine.recipe || "") : "",
        question: question || "", has_machines: hasMachines, lang,
      });
      setGuide(r);
      speak([r.spoken, ...(r.steps || []).slice(0, 2)].filter(Boolean).join(". "));
      if (question) setQ("");
    } catch {
      toast.error(tri("Sitor è occupato, riprova tra poco.", "Sitor ist beschäftigt.", "Sitor is busy, try again shortly.", "Sitor está ocupado.", "Sitor est occupé.", "سیتور مشغول است."));
    } finally { setBusy(false); }
  };

  const sendChange = async () => {
    const p = proposal.trim();
    if (!p || changeBusy) return;
    setChangeBusy(true);
    try {
      const r = await sitorFloorApi.changeRequest({
        operator: role, level,
        dept: mine ? (mine.dept_name || mine.dept || "") : "",
        task: mine ? (mine.task || "") : "", proposal: p, lang,
      });
      setLastChange(r); setProposal(""); setShowChange(false);
      speak(r.ack);
      if (r.status === "auto_applied") toast.success(tri("Sitor ha applicato la modifica e avvisa il Capo.", "Sitor hat es angewandt und meldet es dem Chef.", "Sitor applied it and notifies the Capo.", "Sitor lo aplicó y avisa al Capo.", "Sitor l'a appliqué et prévient le Capo.", "سیتور اعمال کرد و به کاپو خبر می‌دهد."), { icon: "✓" });
      else toast(tri("Richiesta inviata: in attesa dell'OK del Capo.", "Anfrage gesendet: warte auf OK des Chefs.", "Request sent: awaiting Capo's OK.", "Solicitud enviada: esperando OK del Capo.", "Demande envoyée : en attente du Capo.", "درخواست ارسال شد: منتظر تأیید کاپو."), { icon: "⏳" });
    } catch {
      toast.error(tri("Invio non riuscito, riprova.", "Senden fehlgeschlagen.", "Send failed, try again.", "Envío fallido.", "Échec de l'envoi.", "ارسال ناموفق."));
    } finally { setChangeBusy(false); }
  };

  if (!role) return null;
  const LEVEL_BADGE = { novizio: { c: "#6e9e85", t: tri("Novizio", "Anfänger", "Novice", "Novato", "Novice", "تازه‌کار") },
    esperto: { c: "#a6b1bc", t: tri("Esperto", "Erfahren", "Expert", "Experto", "Expert", "ماهر") },
    maestro: { c: "#8a97a6", t: tri("Maestro", "Meister", "Master", "Maestro", "Maître", "استاد") } }[level] || { c: "#6e9e85", t: level };

  return (
    <div data-testid="sitor-maestro" className="relative rounded-2xl border border-[#a6b1bc]/35 bg-[#070B12] overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(circle at 50% -10%, rgba(166,177,188,0.10), transparent 60%)" }} />
      <div className="relative z-10 p-4 space-y-3">
        <div className="flex items-center gap-3">
          <img src={`${PUB}/avatar_nexus.jpg`} alt="Sitor" className="w-11 h-11 rounded-xl object-cover object-top border-2 border-[#a6b1bc]/60 shrink-0" onError={(e) => { e.currentTarget.style.display = "none"; }} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-white uppercase tracking-wide flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#a6b1bc]" /> {tri("Sitor Maestro", "Sitor Meister", "Sitor Master", "Sitor Maestro", "Sitor Maître", "استاد سیتور")}
              <span data-testid="maestro-level-badge" className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded border" style={{ color: LEVEL_BADGE.c, borderColor: `${LEVEL_BADGE.c}66`, background: `${LEVEL_BADGE.c}18` }}>{LEVEL_BADGE.t}</span>
            </p>
            <p className="text-[11px] text-[#94A3B8] leading-snug">{tri("Ti guido passo-passo e sorveglio ogni fase, con o senza macchinari.", "Ich führe dich Schritt für Schritt, mit oder ohne Maschinen.", "I guide you step-by-step and watch every phase, with or without machines.", "Te guío paso a paso, con o sin máquinas.", "Je te guide pas à pas, avec ou sans machines.", "قدم‌به‌قدم راهنمایی می‌کنم.")}</p>
          </div>
        </div>

        {/* Macchinari sì/no */}
        <div className="flex items-center gap-2">
          <button data-testid="maestro-machines-toggle" onClick={() => setHasMachines((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all active:scale-95 ${hasMachines ? "bg-[#6e9e85]/12 border-[#6e9e85]/45 text-[#6e9e85]" : "bg-[#8a97a6]/12 border-[#8a97a6]/45 text-[#9aa6b2]"}`}>
            {hasMachines ? <Cog className="w-3.5 h-3.5" /> : <Hand className="w-3.5 h-3.5" />}
            {hasMachines ? tri("Con macchinari", "Mit Maschinen", "With machines", "Con máquinas", "Avec machines", "با ماشین") : tri("Senza macchinari (manuale)", "Ohne Maschinen (manuell)", "No machines (manual)", "Sin máquinas (manual)", "Sans machines (manuel)", "بدون ماشین")}
          </button>
        </div>

        <button data-testid="maestro-guide-btn" onClick={() => askGuide("")} disabled={busy}
          className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl font-cyber font-black text-sm text-[#060A10] active:scale-95 transition-all disabled:opacity-50"
          style={{ background: "linear-gradient(90deg,#a6b1bc,#8a97a6)", boxShadow: "0 0 18px rgba(166,177,188,0.3)" }}>
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
          {busy ? tri("Sitor prepara la guida…", "Sitor bereitet vor…", "Sitor is preparing…", "Sitor prepara…", "Sitor prépare…", "سیتور آماده می‌کند…") : tri("Guidami, Sitor", "Führe mich, Sitor", "Guide me, Sitor", "Guíame, Sitor", "Guide-moi, Sitor", "راهنمایی‌ام کن، سیتور")}
        </button>

        {/* Domanda libera a Sitor */}
        <div className="flex items-center gap-2">
          <input data-testid="maestro-ask-input" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") askGuide(q); }}
            placeholder={tri("Chiedi a Sitor come fare…", "Frag Sitor…", "Ask Sitor how to…", "Pregunta a Sitor…", "Demande à Sitor…", "از سیتور بپرس…")}
            className="flex-1 min-w-0 rounded-lg bg-[#030712] border border-[#1e293b] focus:border-[#a6b1bc]/60 outline-none text-sm text-white px-3 py-2" />
          <button data-testid="maestro-ask-btn" onClick={() => askGuide(q)} disabled={busy || !q.trim()}
            className="shrink-0 w-10 h-10 rounded-lg bg-[#a6b1bc]/12 border border-[#a6b1bc]/40 text-[#a6b1bc] flex items-center justify-center active:scale-95 disabled:opacity-40"><Send className="w-4 h-4" /></button>
        </div>

        {/* Guida generata */}
        <AnimatePresence>
          {guide && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} data-testid="maestro-guide" className="rounded-xl bg-[#030712] border border-[#a6b1bc]/25 p-3 space-y-2.5">
              {guide.spoken && (
                <p className="text-sm text-[#E8EEF5] leading-snug flex items-start gap-2">
                  <button onClick={() => speak(guide.spoken)} className="text-[#a6b1bc] shrink-0 mt-0.5 active:scale-90"><Volume2 className="w-4 h-4" /></button>
                  {guide.spoken}
                </p>
              )}
              {(guide.steps || []).length > 0 && (
                <div>
                  <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-[#a6b1bc] mb-1.5"><ListChecks className="w-3.5 h-3.5" /> {tri("Passi", "Schritte", "Steps", "Pasos", "Étapes", "مراحل")}</p>
                  <ol className="space-y-1.5">
                    {guide.steps.map((s, i) => (
                      <li key={i} data-testid={`maestro-step-${i}`} className="flex gap-2 text-[13px] text-[#CBD5E1] leading-snug">
                        <span className="shrink-0 w-5 h-5 rounded-full bg-[#a6b1bc]/15 border border-[#a6b1bc]/40 text-[#a6b1bc] text-[10px] font-black flex items-center justify-center">{i + 1}</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              {(guide.watch || []).length > 0 && (
                <div className="rounded-lg bg-[#8a97a6]/8 border border-[#8a97a6]/25 p-2.5">
                  <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-[#9aa6b2] mb-1"><Eye className="w-3.5 h-3.5" /> {tri("Sorveglia", "Achte auf", "Watch", "Vigila", "Surveille", "مراقب باش")}</p>
                  <ul className="space-y-0.5">
                    {guide.watch.map((w, i) => <li key={i} className="text-[12px] text-[#d7c9a8] leading-snug">• {w}</li>)}
                  </ul>
                </div>
              )}
              {guide.encourage && <p className="text-[12px] italic text-[#a6b1bc]/90 leading-snug">“{guide.encourage}”</p>}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Proponi modifica al piano */}
        <div className="pt-2 border-t border-[#1e293b]">
          {!showChange ? (
            <button data-testid="maestro-change-open" onClick={() => setShowChange(true)}
              className="w-full inline-flex items-center justify-center gap-2 py-2 rounded-lg bg-[#0C1019] border border-[#a6b1bc]/30 text-[#a6b1bc] font-bold text-xs active:scale-95 transition-all">
              <Wand2 className="w-3.5 h-3.5" /> {tri("Proponi una modifica al piano", "Planänderung vorschlagen", "Propose a plan change", "Proponer un cambio", "Proposer un changement", "پیشنهاد تغییر برنامه")}
            </button>
          ) : (
            <div className="space-y-2">
              <textarea data-testid="maestro-change-input" value={proposal} onChange={(e) => setProposal(e.target.value)} rows={2}
                placeholder={tri("Es. anticipare le baguette, cambiare l'ordine dei forni…", "z.B. Baguettes vorziehen…", "e.g. bring baguettes forward, change oven order…", "p.ej. adelantar baguettes…", "ex. avancer les baguettes…", "مثلاً باگت را جلو بینداز…")}
                className="w-full rounded-lg bg-[#030712] border border-[#1e293b] focus:border-[#a6b1bc]/60 outline-none text-sm text-white p-2.5 resize-none" />
              <div className="flex items-center gap-2">
                <button data-testid="maestro-change-send" onClick={sendChange} disabled={changeBusy || !proposal.trim()}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-2 rounded-lg font-bold text-xs text-[#060A10] active:scale-95 disabled:opacity-40" style={{ background: "linear-gradient(90deg,#a6b1bc,#8a97a6)" }}>
                  {changeBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} {tri("Invia a Sitor", "An Sitor", "Send to Sitor", "Enviar", "Envoyer", "بفرست")}
                </button>
                <button data-testid="maestro-change-cancel" onClick={() => { setShowChange(false); setProposal(""); }} className="px-3 py-2 rounded-lg bg-[#0C1019] border border-[#1e293b] text-[#94A3B8] text-xs font-bold active:scale-95">{tri("Annulla", "Abbrechen", "Cancel", "Cancelar", "Annuler", "لغو")}</button>
              </div>
            </div>
          )}
          {lastChange && (
            <div data-testid="maestro-change-result" className={`mt-2 rounded-lg p-2.5 text-[12px] leading-snug border ${lastChange.status === "auto_applied" ? "bg-[#6e9e85]/8 border-[#6e9e85]/30 text-[#7ee2a8]" : "bg-[#a6b1bc]/8 border-[#a6b1bc]/30 text-[#e8d48a]"}`}>
              {lastChange.status === "auto_applied" ? <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" /> : <Clock className="w-3.5 h-3.5 inline mr-1" />}
              {lastChange.ack}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
