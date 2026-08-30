import { useEffect, useState } from "react";
import { Flame } from "lucide-react";
import { streakApi } from "@/lib/api";
import { useAuth } from "@/auth/AuthContext";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// Streak del Fornaio: giorni consecutivi in cui l'utente cuoce o impara.
export default function StreakFlame() {
  const { user } = useAuth();
  const { lang } = useLang();
  const [s, setS] = useState(null);

  const load = () => { if (user) streakApi.get().then(setS).catch(() => {}); };
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

  return (
    <div data-testid="streak-badge" className={`mb-4 flex items-center gap-3 rounded-2xl border px-4 py-3 ${active ? "border-[#ff6b00]/50 bg-[#ff6b00]/12" : "border-[#2e2e2e] bg-[#181818]"}`}>
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
  );
}
