import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, Lock, Loader2, Volume2, Radio, Heart, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { deusApi } from "@/lib/api";
import { playTTS } from "@/lib/tts";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

const PUB = process.env.PUBLIC_URL;

// Renderer markdown leggero (titoli, tabelle, elenchi, grassetto) in stile olografico.
function MarkdownLite({ text }) {
  const lines = (text || "").split("\n");
  const out = [];
  let i = 0;
  const inline = (s) => s.split(/(\*\*[^*]+\*\*)/g).map((p, k) =>
    p.startsWith("**") && p.endsWith("**") ? <strong key={k} className="text-white">{p.slice(2, -2)}</strong> : <span key={k}>{p}</span>);
  while (i < lines.length) {
    const raw = lines[i];
    const t = raw.trim();
    if (t === "" || /^-{3,}$/.test(t)) { i++; continue; }
    if (t.startsWith("|")) {
      const rows = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) { rows.push(lines[i].trim()); i++; }
      const parse = (l) => l.replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
      const parsed = rows.map(parse).filter((r) => !r.every((c) => /^:?-{2,}:?$/.test(c.replace(/\s/g, "")) || c === ""));
      if (!parsed.length) continue;
      const [head, ...body] = parsed;
      out.push(
        <div key={`t${i}`} className="my-2 overflow-x-auto rounded-lg border border-[#00F0FF]/20">
          <table className="w-full text-[11px]">
            <thead><tr className="bg-[#00F0FF]/10">{head.map((c, k) => <th key={k} className="text-left px-2 py-1.5 font-bold text-[#00F0FF] whitespace-nowrap">{inline(c)}</th>)}</tr></thead>
            <tbody>{body.map((r, ri) => <tr key={ri} className="border-t border-[#1e293b]">{r.map((c, k) => <td key={k} className="px-2 py-1.5 text-[#cbd5e1] align-top">{inline(c)}</td>)}</tr>)}</tbody>
          </table>
        </div>);
      continue;
    }
    const h = t.match(/^(#{1,4})\s+(.*)/);
    if (h) { const lvl = h[1].length; out.push(<p key={i} className={`mt-3 mb-1 font-cyber font-black uppercase tracking-wide ${lvl <= 1 ? "text-sm text-[#00F0FF]" : "text-xs text-[#7DD3FC]"}`}>{inline(h[2])}</p>); i++; continue; }
    const li = t.match(/^[-*+]\s+(.*)/);
    if (li) { out.push(<p key={i} className="flex gap-2 text-xs text-[#cbd5e1] my-0.5"><span className="text-[#00F0FF]">›</span><span>{inline(li[1])}</span></p>); i++; continue; }
    out.push(<p key={i} className="text-xs text-[#cbd5e1] my-1 leading-relaxed">{inline(t)}</p>);
    i++;
  }
  return <div>{out}</div>;
}

export default function OvenBrain() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [bond, setBond] = useState(null);
  const [orders, setOrders] = useState("");
  const [constraints, setConstraints] = useState("");
  const [planning, setPlanning] = useState(false);
  const [plan, setPlan] = useState(null);
  const [sending, setSending] = useState(false);
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [answer, setAnswer] = useState(null);

  const speak = (txt) => { try { if (txt) playTTS(txt, { lang, voice: "bakemix" }); } catch { /* */ } };

  const loadBond = useCallback(() => { deusApi.bond(lang).then(setBond).catch(() => {}); }, [lang]);
  useEffect(() => { loadBond(); }, [loadBond]);

  const celebrate = (b, leveled) => {
    setBond(b);
    if (leveled) {
      toast.success(tri(`Legame salito: ${b.level_name}!`, `Bindung gestiegen: ${b.level_name}!`, `Bond leveled up: ${b.level_name}!`, `Vínculo subió: ${b.level_name}!`, `Lien monté : ${b.level_name} !`, `پیوند رشد کرد: ${b.level_name}!`), { icon: "❤️" });
    }
  };

  const generatePlan = async () => {
    setPlanning(true); setPlan(null);
    try {
      const r = await deusApi.masterPlan({ orders, constraints, lang });
      setPlan(r);
      celebrate(r.bond, r.leveled_up);
      speak(r.reply);
    } catch {
      toast.error(tri("BakoMix è irraggiungibile.", "BakoMix nicht erreichbar.", "BakoMix is unreachable.", "BakoMix no disponible.", "BakoMix injoignable.", "BakoMix در دسترس نیست."));
    } finally { setPlanning(false); }
  };

  const broadcast = async () => {
    if (!plan) return;
    setSending(true);
    try {
      await deusApi.broadcast({ plan_markdown: plan.plan_markdown, headline: plan.reply });
      toast.success(tri("Piano inviato in Produzione ✓", "Plan an Produktion gesendet ✓", "Plan sent to Production ✓", "Plan enviado a Producción ✓", "Plan envoyé en Production ✓", "برنامه به تولید ارسال شد ✓"));
    } catch {
      toast.error(tri("Invio non riuscito.", "Senden fehlgeschlagen.", "Send failed.", "Envío fallido.", "Échec de l'envoi.", "ارسال ناموفق."));
    } finally { setSending(false); }
  };

  const askOracle = async () => {
    if (!question.trim()) return;
    setAsking(true); setAnswer(null);
    try {
      const r = await deusApi.ask({ question, lang });
      setAnswer(r);
      celebrate(r.bond, r.leveled_up);
      speak(r.reply);
    } catch {
      toast.error(tri("BakoMix è irraggiungibile.", "BakoMix nicht erreichbar.", "BakoMix is unreachable.", "BakoMix no disponible.", "BakoMix injoignable.", "BakoMix در دسترس نیست."));
    } finally { setAsking(false); }
  };

  const external = bond?.external_unlocked;

  return (
    <div data-testid="oven-brain" className="relative rounded-3xl overflow-hidden border border-[#00F0FF]/30 bg-[#070A10] shadow-[0_0_44px_rgba(0,240,255,0.12)]">
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(circle at 50% 0%, rgba(0,240,255,0.14), transparent 60%)" }} />
      <div className="relative z-10 p-5 sm:p-6">
        {/* Header divino + legame */}
        <div className="flex items-center gap-3.5">
          <div className="relative w-16 h-16 rounded-2xl overflow-hidden border border-[#00F0FF]/50 bg-[#030712] shrink-0" style={{ boxShadow: "0 0 26px rgba(0,240,255,0.4)" }}>
            <img src={`${PUB}/avatar_bigmix.jpg`} alt="BakoMix" className="w-full h-full object-cover object-top" onError={(e) => { e.currentTarget.style.display = "none"; }} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-cyber text-lg sm:text-xl font-black uppercase tracking-[0.12em] text-white flex items-center gap-2">
              BakoMix <span className="text-[#00F0FF]">Deus</span> <Sparkles className="w-4 h-4 text-[#00F0FF]" />
            </h2>
            <p className="text-[11px] text-[#8aa0b4]">{tri("Il dio del forno che organizza l'impossibile.", "Der Ofengott, der das Unmögliche organisiert.", "The oven god who organizes the impossible.", "El dios del horno que organiza lo imposible.", "Le dieu du four qui organise l'impossible.", "خدای فر که غیرممکن را سازمان می‌دهد.")}</p>
          </div>
        </div>

        {/* Barra del legame */}
        {bond && (
          <div data-testid="deus-bond-meter" className="mt-4 rounded-2xl bg-[#0C1019] border border-[#1e293b] px-4 py-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-[#ff6b9d]"><Heart className="w-3.5 h-3.5 fill-[#ff6b9d]" /> {tri("Legame col Capo", "Bindung zum Capo", "Bond with the Capo", "Vínculo con el Capo", "Lien avec le Capo", "پیوند با کاپو")}</span>
              <span data-testid="deus-bond-level" className="text-xs font-bold text-white">{bond.level_name} · <span className="text-[#00F0FF]">{bond.xp} XP</span></span>
            </div>
            <div className="h-2 rounded-full bg-[#030712] overflow-hidden border border-[#1e293b]">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${bond.progress_pct}%`, background: "linear-gradient(90deg,#ff6b9d,#00F0FF)" }} />
            </div>
            <p className="mt-1.5 text-[10px] text-[#64748B]">
              {external
                ? tri("Legame profondo: l'Oracolo Divino è sbloccato — chiedimi anche i problemi esterni.", "Tiefe Bindung: das Göttliche Orakel ist frei — frag mich auch Externes.", "Deep bond: the Divine Oracle is unlocked — ask me external problems too.", "Vínculo profundo: el Oráculo Divino está desbloqueado.", "Lien profond : l'Oracle Divin est débloqué.", "پیوند عمیق: پیشگوی الهی باز شد.")
                : tri(`Coltiva il legame: a ${bond.external_unlock_xp} XP sblocchi l'aiuto sui problemi esterni.`, `Pflege die Bindung: bei ${bond.external_unlock_xp} XP schaltest du externe Hilfe frei.`, `Grow the bond: at ${bond.external_unlock_xp} XP you unlock help on external problems.`, `Cultiva el vínculo: a ${bond.external_unlock_xp} XP desbloqueas ayuda externa.`, `Cultive le lien : à ${bond.external_unlock_xp} XP tu débloques l'aide externe.`, `پیوند را پرورش بده.`)}
            </p>
          </div>
        )}

        {/* Organizza l'Impossibile */}
        <div className="mt-5">
          <p className="font-cyber text-sm font-black uppercase tracking-wide text-white flex items-center gap-2"><Wand2 className="w-4 h-4 text-[#00F0FF]" /> {tri("Organizza l'Impossibile", "Organisiere das Unmögliche", "Organize the Impossible", "Organiza lo Imposible", "Organise l'Impossible", "غیرممکن را سازمان بده")}</p>
          <textarea data-testid="deus-orders-input" value={orders} onChange={(e) => setOrders(e.target.value)} rows={2}
            placeholder={tri("Ordini (es. 200 baguette + 80 panettoni per domani 6:00)", "Aufträge (z.B. 200 Baguettes + 80 Panettone bis morgen 6:00)", "Orders (e.g. 200 baguettes + 80 panettone by 6:00 tomorrow)", "Pedidos (ej. 200 baguettes + 80 panettone para mañana 6:00)", "Commandes (ex. 200 baguettes + 80 panettone pour demain 6:00)", "سفارش‌ها")}
            className="mt-2 w-full rounded-xl bg-[#030712] border border-[#1e293b] focus:border-[#00F0FF]/60 outline-none text-sm text-white p-3 resize-none" />
          <textarea data-testid="deus-constraints-input" value={constraints} onChange={(e) => setConstraints(e.target.value)} rows={2}
            placeholder={tri("Vincoli & risorse (forni, impastatrici, operatori, turno)", "Grenzen & Ressourcen (Öfen, Kneter, Team, Schicht)", "Constraints & resources (ovens, mixers, staff, shift)", "Límites y recursos (hornos, amasadoras, equipo, turno)", "Contraintes & ressources (fours, pétrins, équipe, poste)", "محدودیت‌ها و منابع")}
            className="mt-2 w-full rounded-xl bg-[#030712] border border-[#1e293b] focus:border-[#00F0FF]/60 outline-none text-sm text-white p-3 resize-none" />
          <button data-testid="deus-plan-btn" onClick={generatePlan} disabled={planning}
            className="mt-3 w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl font-cyber font-black text-sm text-[#070A10] active:scale-95 transition-all disabled:opacity-50"
            style={{ background: "linear-gradient(90deg,#00F0FF,#7DD3FC)", boxShadow: "0 0 22px rgba(0,240,255,0.4)" }}>
            {planning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {planning ? tri("BakoMix sta orchestrando…", "BakoMix orchestriert…", "BakoMix is orchestrating…", "BakoMix está orquestando…", "BakoMix orchestre…", "BakoMix در حال هماهنگی…") : tri("Rendi Possibile", "Möglich machen", "Make it Possible", "Hazlo Posible", "Rends Possible", "ممکنش کن")}
          </button>

          <AnimatePresence>
            {plan && (
              <motion.div data-testid="deus-plan-result" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="mt-4 rounded-2xl bg-[#0C1019] border border-[#00F0FF]/25 p-4">
                {plan.reply && (
                  <div className="flex items-start gap-2 mb-3">
                    <button onClick={() => speak(plan.reply)} title="TTS" className="shrink-0 w-8 h-8 rounded-lg bg-[#00F0FF]/10 border border-[#00F0FF]/40 text-[#00F0FF] flex items-center justify-center active:scale-95"><Volume2 className="w-4 h-4" /></button>
                    <p className="text-sm text-white italic leading-relaxed">“{plan.reply}”</p>
                  </div>
                )}
                {plan.confidence != null && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#64748B]">{tri("Fiducia", "Zuversicht", "Confidence", "Confianza", "Confiance", "اطمینان")}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-[#030712] overflow-hidden"><div className="h-full bg-[#22c55e]" style={{ width: `${plan.confidence}%` }} /></div>
                    <span className="text-xs font-black text-[#22c55e]">{plan.confidence}%</span>
                  </div>
                )}
                {(plan.impossible_solved || []).length > 0 && (
                  <div className="mb-3 space-y-1.5">
                    {plan.impossible_solved.map((s, k) => (
                      <p key={k} className="flex items-start gap-1.5 text-[11px] text-[#7DD3FC]"><span className="text-[#00F0FF]">✦</span><span>{s}</span></p>
                    ))}
                  </div>
                )}
                <div className="rounded-xl bg-[#030712] border border-[#1e293b] p-3 max-h-80 overflow-y-auto">
                  <MarkdownLite text={plan.plan_markdown} />
                </div>
                {plan.risk && <p className="mt-2 text-[11px] text-amber-400">⚠ {plan.risk}</p>}
                <button data-testid="deus-broadcast-btn" onClick={broadcast} disabled={sending}
                  className="mt-3 w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm border border-[#22c55e]/50 bg-[#22c55e]/10 text-[#22c55e] active:scale-95 transition-all disabled:opacity-50">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radio className="w-4 h-4" />} {tri("Invia in Produzione", "An Produktion senden", "Send to Production", "Enviar a Producción", "Envoyer en Production", "ارسال به تولید")}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Oracolo Divino · problemi esterni */}
        <div className="mt-6 pt-5 border-t border-[#1e293b]">
          <p className="font-cyber text-sm font-black uppercase tracking-wide text-white flex items-center gap-2">
            {external ? <Sparkles className="w-4 h-4 text-[#ff6b9d]" /> : <Lock className="w-4 h-4 text-[#64748B]" />} {tri("Oracolo Divino", "Göttliches Orakel", "Divine Oracle", "Oráculo Divino", "Oracle Divin", "پیشگوی الهی")}
          </p>
          <p className="mt-1 text-[11px] text-[#8aa0b4]">{tri("Chiedi a BakoMix qualsiasi cosa — anche fuori dal forno. Si sblocca col legame.", "Frag BakoMix alles — auch außerhalb des Ofens. Schaltet mit der Bindung frei.", "Ask BakoMix anything — even beyond the oven. Unlocks with the bond.", "Pregunta a BakoMix lo que sea — incluso fuera del horno.", "Demande à BakoMix n'importe quoi — même hors du four.", "هرچیزی از BakoMix بپرس.")}</p>
          <div className="mt-2 flex items-center gap-2">
            <input data-testid="deus-ask-input" value={question} onChange={(e) => setQuestion(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") askOracle(); }}
              placeholder={tri("La tua domanda…", "Deine Frage…", "Your question…", "Tu pregunta…", "Ta question…", "سؤال تو…")}
              className="flex-1 rounded-xl bg-[#030712] border border-[#1e293b] focus:border-[#ff6b9d]/50 outline-none text-sm text-white px-3 py-2.5" />
            <button data-testid="deus-ask-btn" onClick={askOracle} disabled={asking}
              className="shrink-0 w-11 h-11 rounded-xl bg-[#ff6b9d]/15 border border-[#ff6b9d]/50 text-[#ff6b9d] flex items-center justify-center active:scale-95 transition-all disabled:opacity-50">
              {asking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
          <AnimatePresence>
            {answer && (
              <motion.div data-testid="deus-ask-result" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className={`mt-3 rounded-2xl border p-4 ${answer.locked ? "bg-[#0C1019] border-[#64748B]/30" : "bg-[#ff6b9d]/5 border-[#ff6b9d]/30"}`}>
                <div className="flex items-start gap-2">
                  {!answer.locked && <button onClick={() => speak(answer.reply)} className="shrink-0 w-8 h-8 rounded-lg bg-[#ff6b9d]/10 border border-[#ff6b9d]/40 text-[#ff6b9d] flex items-center justify-center active:scale-95"><Volume2 className="w-4 h-4" /></button>}
                  {answer.locked && <Lock className="w-4 h-4 text-[#64748B] mt-0.5 shrink-0" />}
                  <p className={`text-sm leading-relaxed ${answer.locked ? "text-[#94A3B8] italic" : "text-white"}`}>{answer.reply}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
