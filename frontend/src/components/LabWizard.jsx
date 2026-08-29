import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { CalendarDays, BookOpen, PlusCircle, Lock, Check, ArrowRight, Route } from "lucide-react";
import { recipesApi, weeklyApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// Percorso guidato a 3 step sbloccabili per "Il Tuo Laboratorio".
// Non elimina né nasconde nulla: sotto restano tutti gli strumenti del laboratorio.
export default function LabWizard({ onOpenTool }) {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [step1, setStep1] = useState(false);
  const [step2, setStep2] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [weekly, personal] = await Promise.all([
        weeklyApi.get().catch(() => null),
        recipesApi.list("personal").catch(() => []),
      ]);
      const wItems = (weekly && Array.isArray(weekly.items) && weekly.items.length > 0);
      setStep1(!!wItems);
      setStep2(Array.isArray(personal) && personal.length > 0);
    } catch { /* */ }
    finally { setLoaded(true); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const done = (step1 ? 1 : 0) + (step2 ? 1 : 0);
  const pct = Math.round((done / 3) * 100);

  const goExtra = () => {
    const el = document.querySelector('[data-testid="capo-extra-today"]');
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      const toggle = el.querySelector('[data-testid="capo-extra-toggle"]');
      if (toggle) setTimeout(() => toggle.click(), 400);
    }
  };

  const STEPS = [
    {
      n: 1, Icon: CalendarDays, unlocked: true, complete: step1,
      title: tri("Produzione Settimanale", "Wochenproduktion", "Weekly Production", "Producción Semanal", "Production Hebdomadaire", "تولید هفتگی"),
      desc: tri("Pianifica cosa produrre nella settimana e salva il piano.", "Plane die Wochenproduktion und speichere den Plan.", "Plan what to produce this week and save the plan.", "Planifica la producción de la semana y guarda el plan.", "Planifie la production de la semaine et enregistre le plan.", "تولید هفته را برنامه‌ریزی کن و ذخیره کن."),
      cta: tri("Pianifica la settimana", "Woche planen", "Plan the week", "Planificar la semana", "Planifier la semaine", "برنامه‌ریزی هفته"),
      action: () => onOpenTool && onOpenTool("settimana"),
    },
    {
      n: 2, Icon: BookOpen, unlocked: step1, complete: step2,
      title: tri("Inserimento Ricetta", "Rezept hinzufügen", "Add Recipe", "Añadir Receta", "Ajouter une Recette", "افزودن دستور"),
      desc: tri("Inserisci e salva i dati della ricetta da eseguire.", "Gib die Daten des auszuführenden Rezepts ein und speichere.", "Enter and save the recipe you want to make.", "Introduce y guarda los datos de la receta a ejecutar.", "Saisis et enregistre la recette à réaliser.", "داده‌های دستور موردنظر را وارد و ذخیره کن."),
      cta: tri("Inserisci una ricetta", "Rezept hinzufügen", "Add a recipe", "Añadir una receta", "Ajouter une recette", "افزودن دستور"),
      action: () => onOpenTool && onOpenTool("aggiungi"),
    },
    {
      n: 3, Icon: PlusCircle, unlocked: step2, complete: false,
      title: tri("Extra per Oggi", "Extra für Heute", "Extras for Today", "Extra para Hoy", "Extra pour Aujourd'hui", "اضافه برای امروز"),
      desc: tri("Aggiungi variazioni e produzioni fuori programma del giorno.", "Füge Tagesänderungen und außerplanmäßige Produktionen hinzu.", "Add today's variations and off-schedule productions.", "Añade variaciones y producciones fuera de programa del día.", "Ajoute les variations et productions hors programme du jour.", "تغییرات و تولیدهای خارج از برنامهٔ امروز را اضافه کن."),
      cta: tri("Aggiungi extra di oggi", "Heutige Extras hinzufügen", "Add today's extras", "Añadir extra de hoy", "Ajouter extra du jour", "افزودن اضافهٔ امروز"),
      action: goExtra,
    },
  ];

  return (
    <div data-testid="lab-wizard" className="mb-5 rounded-3xl bg-[#181818] border border-[#2e2e2e] p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-1">
        <Route className="w-5 h-5 text-[#ff6b00]" />
        <h2 className="font-display text-lg font-bold text-white">
          {tri("Percorso Guidato", "Geführter Ablauf", "Guided Path", "Ruta Guiada", "Parcours Guidé", "مسیر راهنما")}
        </h2>
      </div>
      <p className="text-sm text-[#9aa4ab] mb-3">
        {tri("Segui i 3 passi per organizzare la produzione. Ogni passo sblocca il successivo.", "Folge den 3 Schritten, um die Produktion zu organisieren. Jeder Schritt schaltet den nächsten frei.", "Follow the 3 steps to organize production. Each step unlocks the next.", "Sigue los 3 pasos para organizar la producción. Cada paso desbloquea el siguiente.", "Suis les 3 étapes pour organiser la production. Chaque étape débloque la suivante.", "برای سازماندهی تولید ۳ مرحله را دنبال کن. هر مرحله مرحلهٔ بعد را باز می‌کند.")}
      </p>

      {/* Barra di avanzamento */}
      <div data-testid="lab-wizard-progress" className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-[#7E8A93]">
            {tri("Passo", "Schritt", "Step", "Paso", "Étape", "مرحله")} {Math.min(done + (done < 3 ? 1 : 0), 3)} {tri("di", "von", "of", "de", "de", "از")} 3
          </span>
          <span className="text-xs font-bold text-[#ff6b00]">{pct}%</span>
        </div>
        <div className="h-2.5 rounded-full bg-[#2a2a2a] overflow-hidden">
          <motion.div className="h-full rounded-full bg-[#ff6b00]" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.5 }} />
        </div>
      </div>

      <div className="space-y-3">
        {STEPS.map((s) => {
          const locked = !s.unlocked;
          return (
            <div key={s.n} data-testid={`lab-wizard-step-${s.n}`}
              className={`rounded-2xl border p-3.5 transition-all ${s.complete ? "border-[#ff6b00]/60 bg-[#ff6b00]/10" : locked ? "border-[#2a2a2a] bg-[#141414] opacity-60" : "border-[#3a3a3a] bg-[#1e1e1e]"}`}>
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.complete ? "bg-[#ff6b00] text-white" : locked ? "bg-[#242424] text-[#6b7379]" : "bg-[#2a2a2a] text-[#ff6b00]"}`}>
                  {s.complete ? <Check className="w-5 h-5" /> : locked ? <Lock className="w-5 h-5" /> : <s.Icon className="w-5 h-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-bold uppercase tracking-wide text-[#7E8A93]">
                      {tri("Passo", "Schritt", "Step", "Paso", "Étape", "مرحله")} {s.n}
                    </span>
                    {s.complete && (
                      <span data-testid={`lab-wizard-badge-done-${s.n}`} className="text-[10px] font-bold uppercase text-[#ff6b00] bg-[#ff6b00]/15 px-2 py-0.5 rounded-full">
                        {tri("Completato", "Erledigt", "Done", "Hecho", "Fait", "انجام شد")}
                      </span>
                    )}
                    {locked && (
                      <span data-testid={`lab-wizard-badge-locked-${s.n}`} className="text-[10px] font-bold uppercase text-[#6b7379] bg-[#242424] px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                        <Lock className="w-3 h-3" /> {tri("Bloccato", "Gesperrt", "Locked", "Bloqueado", "Verrouillé", "قفل")}
                      </span>
                    )}
                  </div>
                  <h3 className="font-display text-base font-bold text-white mt-0.5">{s.title}</h3>
                  <p className="text-[13px] text-[#9aa4ab] leading-snug mt-0.5">{s.desc}</p>
                  <button
                    data-testid={`lab-wizard-cta-${s.n}`}
                    disabled={locked}
                    onClick={s.action}
                    className={`mt-2.5 inline-flex items-center gap-1.5 px-4 py-2 rounded-full font-semibold text-sm transition-all ${locked ? "bg-[#242424] text-[#6b7379] cursor-not-allowed" : "bg-[#ff6b00] text-white shadow-[0_4px_14px_rgba(255,107,0,0.35)] active:scale-95 hover:bg-[#ff8226]"}`}>
                    {locked ? (
                      <>{tri("Completa prima il passo precedente", "Erst vorherigen Schritt abschließen", "Complete the previous step first", "Completa antes el paso anterior", "Termine d'abord l'étape précédente", "ابتدا مرحلهٔ قبل را کامل کن")}</>
                    ) : (
                      <>{s.cta} <ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {loaded && done === 3 && (
        <p data-testid="lab-wizard-complete" className="mt-3 text-sm text-[#ff6b00] font-semibold text-center">
          {tri("🎉 Percorso completato! Continua qui sotto con gli strumenti del laboratorio.", "🎉 Ablauf abgeschlossen! Mach unten mit den Labor-Werkzeugen weiter.", "🎉 Path complete! Continue below with the lab tools.", "🎉 ¡Ruta completada! Continúa abajo con las herramientas del laboratorio.", "🎉 Parcours terminé ! Continue en dessous avec les outils du laboratoire.", "🎉 مسیر کامل شد! در پایین با ابزارهای کارگاه ادامه بده.")}
        </p>
      )}
    </div>
  );
}
