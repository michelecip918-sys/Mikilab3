import { useEffect, useState } from "react";
import { Crown, Trophy, Flame, ChevronDown, ChevronUp } from "lucide-react";
import { hallOfFameApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

const MONTHS = {
  it: ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  de: ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
  es: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"],
  fr: ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"],
  fa: ["ژانویه", "فوریه", "مارس", "آوریل", "مه", "ژوئن", "ژوئیه", "اوت", "سپتامبر", "اکتبر", "نوامبر", "دسامبر"],
};

const medal = (r) => (r === 1 ? "🥇" : r === 2 ? "🥈" : r === 3 ? "🥉" : `#${r}`);

export default function HallOfFame() {
  const { lang } = useLang();
  const L = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(true);

  useEffect(() => { hallOfFameApi.get().then(setData).catch(() => {}); }, []);

  const leaders = data?.leaders || [];
  let monthLabel = "";
  if (data?.month) {
    const [y, m] = data.month.split("-");
    const arr = MONTHS[lang] || MONTHS.en;
    monthLabel = `${arr[Number(m) - 1]} ${y}`;
  }

  return (
    <div data-testid="hall-of-fame" className="mb-5 rounded-3xl overflow-hidden border border-[#ff6b00]/40 bg-[#181818] shadow-lg">
      <button data-testid="hall-of-fame-toggle" onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 p-4 text-[#121212]" style={{ background: "linear-gradient(135deg,#ffd27a,#ff8a33 60%,#ff6b00)" }}>
        <div className="w-11 h-11 rounded-2xl bg-[#121212]/15 border border-[#121212]/20 flex items-center justify-center shrink-0"><Crown className="w-6 h-6" /></div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-[11px] font-extrabold uppercase tracking-widest">{L("Hall of Fame", "Ruhmeshalle", "Hall of Fame", "Salón de la Fama", "Panthéon", "تالار مشاهیر")}</p>
          <p className="font-display text-lg font-extrabold leading-tight">{L("I fornai del mese", "Bäcker des Monats", "Bakers of the month", "Panaderos del mes", "Boulangers du mois", "نانواهای ماه")} · {monthLabel}</p>
        </div>
        {open ? <ChevronUp className="w-5 h-5 shrink-0" /> : <ChevronDown className="w-5 h-5 shrink-0" />}
      </button>

      {open && (
        <div className="p-4">
          {leaders.length === 0 ? (
            <p className="text-[13px] text-[#AEB8BF] py-3 text-center">{L("Questo mese non ha ancora un campione: pubblica, cuoci e vota per salire! 🔥", "Diesen Monat noch kein Champion: poste, backe und vote! 🔥", "No champion yet this month: post, bake and vote to climb! 🔥", "Aún no hay campeón este mes: ¡publica, hornea y vota! 🔥", "Pas encore de champion ce mois : publie, cuisine et vote ! 🔥", "این ماه هنوز قهرمانی ندارد: پست بگذار، بپز و رأی بده! 🔥")}</p>
          ) : (
            <div className="space-y-2" data-testid="hall-of-fame-list">
              {leaders.map((r) => (
                <div key={r.user_id} data-testid={`hof-leader-${r.rank}`} className={`flex items-center gap-3 rounded-2xl shadow-md border border-amber-900/40 border p-2.5 ${r.rank <= 3 ? "bg-[#ff6b00]/10 border-[#ff6b00]/30" : "bg-[#121212] border-[#2e2e2e]"}`}>
                  <span className="w-7 text-center text-lg font-extrabold text-[#ff6b00] shrink-0">{medal(r.rank)}</span>
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-[#ff6b00] flex items-center justify-center text-white font-bold shrink-0">
                    {r.picture ? <img src={r.picture} alt="" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} /> : (r.name || "F")[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate flex items-center gap-1">{r.name} {r.champion && <Trophy className="w-3.5 h-3.5 text-[#ff6b00]" />}</p>
                    <p className="text-[11px] text-[#AEB8BF] inline-flex items-center gap-2">
                      <span>❤️ {r.likes}</span><span>📸 {r.posts}</span>
                      {r.streak_best > 0 && <span className="inline-flex items-center gap-0.5"><Flame className="w-3 h-3 text-[#ff6b00]" />{r.streak_best}</span>}
                    </p>
                  </div>
                  <span className="text-[13px] font-extrabold text-[#ff6b00] shrink-0">{r.score} {L("pt", "Pkt", "pts", "pts", "pts", "امتیاز")}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
