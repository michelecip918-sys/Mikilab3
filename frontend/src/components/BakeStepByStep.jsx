import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Clock, Thermometer, ShoppingCart, Trophy, Loader2, PartyPopper, Users } from "lucide-react";
import { rLoc } from "@/lib/loc";
import { mkTri } from "@/i18n/triMaps";
import { useAuth } from "@/auth/AuthContext";
import { recipesApi } from "@/lib/api";
import { toast } from "sonner";
import ShoppingWhereToBuy from "@/components/ShoppingWhereToBuy";

function parseSteps(text) {
  if (!text) return [];
  let raw = String(text).split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 1);
  // Se il procedimento è su un'unica riga con numerazione in linea "1) ... 2) ...", spezzalo.
  if (raw.length <= 1) {
    const one = raw[0] || String(text);
    const parts = one.split(/\s*(?:(?<=[.;])\s+)?\d+\s*[).]\s+/).map((s) => s.trim()).filter((s) => s.length > 1);
    if (parts.length > 1) raw = parts;
    else raw = one.split(/(?<=[.;])\s+(?=[A-ZÀ-Ú])/).map((s) => s.trim()).filter((s) => s.length > 1);
  }
  return raw.map((l) => l.replace(/^\s*\d+\s*[).:-]\s*/, "").trim()).filter((l) => l.length > 1);
}

function stepBadges(txt) {
  const badges = [];
  const min = txt.match(/(\d+(?:\s*-\s*\d+)?)\s*(?:['′]|min(?:uti|uten|utos)?)/i);
  if (min) badges.push({ type: "time", val: `${min[1].replace(/\s+/g, "")} min` });
  const temp = txt.match(/(\d+(?:\s*-\s*\d+)?)\s*°\s*C/i);
  if (temp) badges.push({ type: "temp", val: `${temp[1].replace(/\s+/g, "")} °C` });
  return badges;
}

export default function BakeStepByStep({ recipe, lang, onExit, onGoCommunity }) {
  const L = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const { user, setAuthOpen } = useAuth();
  const name = rLoc(recipe, "name", lang) || recipe.name;
  const steps = useMemo(() => parseSteps(rLoc(recipe, "procedure", lang)), [recipe, lang]);
  const [i, setI] = useState(0);
  const [shopOpen, setShopOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [finished, setFinished] = useState(false);

  const total = steps.length;
  const isLast = i === total - 1;
  const pct = total ? Math.round(((i + 1) / total) * 100) : 0;

  const TIPS = [
    L("Iniziamo con calma: pesa tutto prima di partire. 🧑‍🍳", "Ruhig anfangen: erst alles abwiegen. 🧑‍🍳", "Let's start calm: weigh everything first. 🧑‍🍳", "Empecemos con calma: pesa todo antes. 🧑‍🍳", "Commençons calmement : pèse tout d'abord. 🧑‍🍳", "با آرامش شروع کن: اول همه‌چیز را وزن کن. 🧑‍🍳"),
    L("Prenditi il tuo tempo, l'impasto non ha fretta. 🌾", "Nimm dir Zeit, der Teig hat es nicht eilig. 🌾", "Take your time, the dough is in no hurry. 🌾", "Tómate tu tiempo, la masa no tiene prisa. 🌾", "Prends ton temps, la pâte n'est pas pressée. 🌾", "عجله نکن، خمیر شتاب ندارد. 🌾"),
    L("Stai andando benissimo, continua così! 💪", "Du machst das super, weiter so! 💪", "You're doing great, keep going! 💪", "¡Lo estás haciendo genial, sigue así! 💪", "Tu t'en sors très bien, continue ! 💪", "عالی پیش می‌روی، ادامه بده! 💪"),
    L("Osserva l'impasto: ti dice lui quando è pronto. 👀", "Beobachte den Teig: er sagt dir, wann er reif ist. 👀", "Watch the dough: it tells you when it's ready. 👀", "Observa la masa: ella te dice cuándo está lista. 👀", "Observe la pâte : elle te dit quand elle est prête. 👀", "به خمیر نگاه کن: خودش می‌گوید کِی آماده است. 👀"),
    L("Ci siamo quasi, l'ultima parte è la più bella. 🔥", "Fast geschafft, der letzte Teil ist der schönste. 🔥", "Almost there, the last part is the best. 🔥", "Ya casi, la última parte es la mejor. 🔥", "Presque fini, la dernière partie est la plus belle. 🔥", "نزدیک شدیم، بخش آخر بهترین است. 🔥"),
  ];
  const tip = TIPS[Math.min(i, TIPS.length - 1)];

  const badges = i === total - 1
    ? [...stepBadges(steps[i] || ""),
       ...(recipe.bake_temp ? [{ type: "temp", val: `${Math.round(recipe.bake_temp)} °C` }] : []),
       ...(recipe.bake_minutes ? [{ type: "time", val: `${Math.round(recipe.bake_minutes)} min` }] : [])]
    : stepBadges(steps[i] || "");
  const uniqueBadges = badges.filter((b, idx) => badges.findIndex((x) => x.type === b.type) === idx);

  const finish = async () => {
    if (!user) { setAuthOpen && setAuthOpen(true); return; }
    setBusy(true);
    try {
      const r = await recipesApi.complete(name, recipe.id);
      setFinished(true);
      try { window.dispatchEvent(new CustomEvent("mikilab-celebrate")); } catch { /* */ }
      if (r?.posted) toast.success(L("Bravo! Il tuo traguardo è sul feed della community 🎉", "Bravo! Dein Erfolg ist im Community-Feed 🎉", "Well done! Your achievement is on the community feed 🎉", "¡Bien hecho! Tu logro está en el feed 🎉", "Bravo ! Ton succès est sur le fil de la communauté 🎉", "آفرین! دستاوردت در فید انجمن است 🎉"));
      else toast.success(L("Complimenti, ricetta completata! 🥖", "Glückwunsch, Rezept fertig! 🥖", "Congrats, recipe completed! 🥖", "¡Enhorabuena, receta completada! 🥖", "Bravo, recette terminée ! 🥖", "تبریک، دستور کامل شد! 🥖"));
    } catch {
      toast.error(L("Errore, riprova.", "Fehler, versuch es erneut.", "Error, try again.", "Error, inténtalo de nuevo.", "Erreur, réessaie.", "خطا، دوباره تلاش کن."));
    } finally { setBusy(false); }
  };

  if (finished) {
    return (
      <div data-testid="bake-finished" className="pb-8">
        <div className="rounded-3xl p-7 text-center text-[#121212] shadow-xl" style={{ background: "linear-gradient(135deg,#d4a373,#c94f00)" }}>
          <div className="w-16 h-16 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center mx-auto mb-3"><PartyPopper className="w-8 h-8" /></div>
          <h2 className="font-display text-2xl font-bold">{L("Ce l'hai fatta!", "Geschafft!", "You did it!", "¡Lo lograste!", "Tu as réussi !", "موفق شدی!")}</h2>
          <p className="text-[#121212]/85 text-sm mt-2 font-semibold">{name}</p>
        </div>
        <button data-testid="bake-finished-community" onClick={() => onGoCommunity && onGoCommunity()}
          className="mt-4 w-full flex items-center justify-center gap-2 bg-[#c94f00] text-[#121212] font-semibold py-3.5 rounded-2xl active:scale-98 transition-all">
          <Users className="w-5 h-5" /> {L("Vai al feed della community", "Zum Community-Feed", "Go to community feed", "Ir al feed de la comunidad", "Aller au fil de la communauté", "به فید انجمن برو")}
        </button>
        <button data-testid="bake-finished-again" onClick={() => { setFinished(false); setI(0); }}
          className="mt-2 w-full rounded-2xl border border-[#2e2e2e] text-white font-semibold py-3 active:scale-98 transition-all">
          {L("Rifai da capo", "Nochmal", "Bake again", "Hacer de nuevo", "Refaire", "دوباره از اول")}
        </button>
        {onExit && <button data-testid="bake-finished-exit" onClick={onExit} className="mt-2 w-full text-[#c94f00] font-medium py-2">{L("Torna a Impara", "Zurück zu Lernen", "Back to Learn", "Volver a Aprender", "Retour à Apprendre", "بازگشت به یادگیری")}</button>}
      </div>
    );
  }

  return (
    <div data-testid="bake-step-by-step" className="pb-8">
      {onExit && (
        <button data-testid="bake-exit" onClick={onExit} className="flex items-center gap-1 text-[#c94f00] font-medium mb-3">
          <ChevronLeft className="w-5 h-5" /> {L("Cambia ricetta", "Rezept wechseln", "Change recipe", "Cambiar receta", "Changer de recette", "تغییر دستور")}
        </button>
      )}

      {/* Header ricetta + progress */}
      <div className="rounded-3xl p-5 text-[#121212] shadow-xl" style={{ background: "linear-gradient(135deg,#d4a373,#c94f00 70%)" }}>
        <p className="text-[11px] font-bold uppercase tracking-widest text-white/90">{L("Riproduci passo-passo", "Schritt für Schritt", "Bake step by step", "Paso a paso", "Pas à pas", "گام‌به‌گام")}</p>
        <h1 className="font-display text-xl font-bold mt-1 leading-tight">{name}</h1>
        <div className="mt-3 flex items-center justify-between text-[12px] font-bold text-[#121212]/80">
          <span data-testid="bake-step-count">{L("Passo", "Schritt", "Step", "Paso", "Étape", "مرحله")} {i + 1} / {total}</span>
          <span>{pct}%</span>
        </div>
        <div className="mt-1.5 h-2.5 rounded-full bg-black/15 overflow-hidden">
          <div data-testid="bake-progress" className="h-full rounded-full bg-[#121212] transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Avatar Mikila + incoraggiamento */}
      <div className="mt-4 flex items-start gap-3 rounded-2xl bg-[#c94f00]/10 border border-[#c94f00]/30 p-3.5">
        <div className="relative shrink-0">
          <img src="/michele-real-lab.jpg" alt="MikiLab" className="w-11 h-11 rounded-full object-cover border-2 border-[#c94f00]/40"
            onError={(e) => { e.currentTarget.style.display = "none"; }} />
          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#2e8b6f] border-2 border-[#1e1e1e]" />
        </div>
        <p data-testid="bake-avatar-tip" className="text-[13px] text-[#E0D5CF] leading-snug pt-0.5">{tip}</p>
      </div>

      {/* Card istruzione */}
      <div className="mt-4 rounded-2xl bg-[#1e1e1e] border border-[#2e2e2e] p-5">
        {uniqueBadges.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3" data-testid="bake-badges">
            {uniqueBadges.map((b, k) => (
              <span key={k} className="inline-flex items-center gap-1.5 rounded-full bg-[#c94f00]/15 border border-[#c94f00]/30 px-3 py-1 text-[12px] font-bold text-[#c94f00]">
                {b.type === "time" ? <Clock className="w-3.5 h-3.5" /> : <Thermometer className="w-3.5 h-3.5" />} {b.val}
              </span>
            ))}
          </div>
        )}
        <p data-testid="bake-step-text" className="text-white text-[17px] leading-relaxed">{steps[i]}</p>
      </div>

      {/* Toggle Lista Spesa & Dove Comprare */}
      <button data-testid="bake-shopping-toggle" onClick={() => setShopOpen((v) => !v)}
        className="mt-4 w-full flex items-center justify-center gap-2 rounded-2xl bg-[#1e1e1e] border border-[#c94f00]/40 text-white font-semibold py-3 active:scale-98 transition-all">
        <ShoppingCart className="w-5 h-5 text-[#c94f00]" />
        {shopOpen ? L("Nascondi lista spesa", "Einkaufsliste ausblenden", "Hide shopping list", "Ocultar lista", "Masquer la liste", "پنهان کردن لیست") : L("Cosa e Dove Comprare", "Was & Wo kaufen", "What & Where to Buy", "Qué y dónde comprar", "Quoi et où acheter", "چه و از کجا بخریم")}
      </button>
      {shopOpen && <div className="mt-3"><ShoppingWhereToBuy recipe={recipe} lang={lang} /></div>}

      {/* Navigazione */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <button data-testid="bake-prev" disabled={i === 0} onClick={() => setI((n) => Math.max(0, n - 1))}
          className="flex items-center justify-center gap-1.5 rounded-2xl border border-[#2e2e2e] text-white font-semibold py-3.5 disabled:opacity-40 active:scale-95 transition-all">
          <ChevronLeft className="w-5 h-5" /> {L("Indietro", "Zurück", "Back", "Atrás", "Retour", "قبلی")}
        </button>
        {isLast ? (
          <button data-testid="bake-finish" disabled={busy} onClick={finish}
            className="flex items-center justify-center gap-2 rounded-2xl bg-[#c94f00] text-[#121212] font-bold py-3.5 disabled:opacity-50 active:scale-95 transition-all">
            {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trophy className="w-5 h-5" />} {L("Ho finito!", "Fertig!", "I'm done!", "¡Terminé!", "J'ai fini !", "تمام شد!")}
          </button>
        ) : (
          <button data-testid="bake-next" onClick={() => setI((n) => Math.min(total - 1, n + 1))}
            className="flex items-center justify-center gap-1.5 rounded-2xl bg-[#c94f00] text-[#121212] font-bold py-3.5 active:scale-95 transition-all">
            {L("Avanti", "Weiter", "Next", "Siguiente", "Suivant", "بعدی")} <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
