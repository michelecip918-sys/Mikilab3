import { useEffect, useState } from "react";
import { Flame, Lock, Award } from "lucide-react";
import { streakApi } from "@/lib/api";
import { useAuth } from "@/auth/AuthContext";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { toast } from "sonner";

// Streak del Fornaio: giorni consecutivi in cui l'utente cuoce o impara.
export default function StreakFlame() {
  const { user } = useAuth();
  const { lang } = useLang();
  const [s, setS] = useState(null);

  const load = () => {
    if (!user) return;
    streakApi.get().then((r) => {
      if (!r) return;
      setS(r);
      // Celebrazione al superamento di un traguardo (confronto con l'ultimo visto).
      try {
        const key = `mikilab-streak-seen-${user.user_id || user.email}`;
        const raw = localStorage.getItem(key);
        const prev = raw === null ? null : Number(raw);
        const reached = (r.milestones || []).filter((m) => m.reached).map((m) => m.days);
        const top = reached.length ? Math.max(...reached) : 0;
        // Festeggia solo un traguardo appena superato (non al primo caricamento / nuovo dispositivo).
        if (prev !== null && top > prev && top > 0) {
          toast.success(mkTri(lang)(`🔥 Traguardo: ${top} giorni di fila! Sei un vero fornaio.`, `🔥 Meilenstein: ${top} Tage in Folge!`, `🔥 Milestone: ${top}-day streak! You're a real baker.`, `🔥 ¡Hito: ${top} días seguidos!`, `🔥 Palier : ${top} jours d'affilée !`, `🔥 نقطه‌عطف: ${top} روز پیاپی!`));
        }
        localStorage.setItem(key, String(top));
      } catch { /* */ }
    }).catch(() => {});
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user]);
  useEffect(() => {
    const h = () => setTimeout(load, 800);
    window.addEventListener("mikilab-celebrate", h);
    return () => window.removeEventListener("mikilab-celebrate", h);
    // eslint-disable-next-line
  }, [user]);

  if (!user || !s) return null;
  const L = (i, d, e, sp, f, fa) => mkTri(lang)(i, d, e, sp, f, fa);
  const n = s.current || 0;
  const active = s.active_today;
  const milestones = s.milestones || [];
  // Badge-ricompensa nominali ai traguardi chiave (7/30/100 giorni)
  const REWARDS = {
    7: L("Fornaio Costante", "Beständiger Bäcker", "Steady Baker", "Panadero Constante", "Boulanger Assidu", "نانوای پیگیر"),
    30: L("Maestro dell'Abitudine", "Meister der Gewohnheit", "Habit Master", "Maestro del Hábito", "Maître de l'Habitude", "استاد عادت"),
    100: L("Leggenda del Forno", "Ofen-Legende", "Oven Legend", "Leyenda del Horno", "Légende du Four", "افسانهٔ تنور"),
  };
  const topRewardDays = [100, 30, 7].find((d) => (s.earned || []).includes(d) || n >= d);

  return (
    <div data-testid="streak-badge" className={`mb-4 rounded-2xl border px-4 py-3 ${active ? "border-[#ff6b00]/50 bg-[#ff6b00]/12" : "border-[#2e2e2e] bg-[#181818]"}`}>
      <div className="flex items-center gap-3">
        <div className={`relative w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${n > 0 ? "bg-[#ff6b00]/20" : "bg-[#2e2e2e]"}`}>
          <Flame className={`w-6 h-6 ${n > 0 ? "text-[#ff6b00]" : "text-[#7E8A93]"}`} fill={n > 0 ? "currentColor" : "none"} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display text-base font-extrabold text-white leading-tight" data-testid="streak-count">
            {n > 0
              ? L(`${n} ${n === 1 ? "giorno" : "giorni"} di fila 🔥`, `${n} ${n === 1 ? "Tag" : "Tage"} in Folge 🔥`, `${n}-day streak 🔥`, `${n} ${n === 1 ? "día" : "días"} seguidos 🔥`, `${n} ${n === 1 ? "jour" : "jours"} d'affilée 🔥`, `${n} روز پیاپی 🔥`)
              : L("Accendi la tua serie!", "Starte deine Serie!", "Start your streak!", "¡Enciende tu racha!", "Lance ta série !", "زنجیره‌ات را روشن کن!")}
          </p>
          <p className="text-[12px] text-[#AEB8BF] leading-snug">
            {active
              ? L("Oggi hai già impastato o imparato. Bravo!", "Heute schon gebacken oder gelernt. Bravo!", "You baked or learned today. Nice!", "Hoy ya horneaste o aprendiste. ¡Bien!", "Aujourd'hui, tu as déjà pétri ou appris. Bravo !", "امروز پختی یا یاد گرفتی. آفرین!")
              : L("Cuoci o impara qualcosa oggi per continuare la serie", "Backe oder lerne heute etwas, um die Serie zu halten", "Bake or learn something today to keep the streak", "Hornea o aprende algo hoy para seguir la racha", "Cuisine ou apprends quelque chose aujourd'hui", "امروز چیزی بپز یا یاد بگیر تا زنجیره ادامه یابد")}
            {s.best > n ? ` · ${L("record", "Rekord", "best", "récord", "record", "رکورد")} ${s.best}` : ""}
          </p>
        </div>
      </div>
      {/* Traguardi (coccarde) */}
      <div className="flex items-center gap-1.5 mt-3 flex-wrap" data-testid="streak-milestones">
        {milestones.map((m) => (
          <span key={m.days} data-testid={`streak-milestone-${m.days}`}
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold border ${m.reached ? "bg-[#ff6b00] text-[#121212] border-[#ff6b00]" : "text-[#7E8A93] border-[#2e2e2e]"}`}>
            {m.reached ? "🔥" : <Lock className="w-2.5 h-2.5" />} {m.days}
          </span>
        ))}
      </div>
      {/* Badge-ricompensa al traguardo raggiunto */}
      {topRewardDays && (
        <div data-testid="streak-reward" className="mt-2.5 flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ff6b00]/20 to-[#7a531d]/20 border border-[#ff6b00]/40 px-3 py-2">
          <Award className="w-4 h-4 text-[#ff6b00] shrink-0" />
          <p className="text-[12px] font-bold text-white leading-tight">
            {REWARDS[topRewardDays]}
            <span className="ml-1 font-semibold text-[#AEB8BF]">· {topRewardDays} {L("giorni", "Tage", "days", "días", "jours", "روز")}</span>
          </p>
        </div>
      )}
    </div>
  );
}

