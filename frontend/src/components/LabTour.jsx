import { useState, useEffect } from "react";
import { X, ArrowRight } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";

const KEY = "mikilab_lab_tour_v1";
const AVATAR = `${process.env.PUBLIC_URL}/mohammed-avatar.jpg`;

const clearHighlights = () => {
  document.querySelectorAll("[data-tour-highlight]").forEach((el) => {
    el.style.outline = ""; el.style.outlineOffset = ""; el.removeAttribute("data-tour-highlight");
  });
};

// Mini-tour di Mohammadreza: al primo accesso mostra in 3 passi come generare il primo piano.
export default function LabTour({ force = 0, onClose }) {
  const { lang } = useLang();
  const tri = (i, d, e) => (lang === "de" ? d : lang === "en" ? e : i);

  const STEPS = [
    { target: null,
      title: tri("Ciao, sono Mohammadreza 👋", "Hallo, ich bin Mohammadreza 👋", "Hi, I'm Mohammadreza 👋"),
      body: tri("Ti mostro in 3 passi come creare il tuo primo Piano di Produzione. Meno di un minuto!", "In 3 Schritten zeige ich dir deinen ersten Produktionsplan. Weniger als eine Minute!", "I'll show you in 3 steps how to create your first Production Plan. Under a minute!") },
    { target: "capo-source-choice",
      title: tri("1 · Scegli le ricette", "1 · Rezepte wählen", "1 · Pick the recipes"),
      body: tri("Tocca «Scegli ricette ora» e aggiungi almeno una ricetta con la quantità. È l'unica cosa davvero obbligatoria.", "Tippe auf „Rezepte jetzt wählen“ und füge mind. ein Rezept mit Menge hinzu. Das ist das Einzige, was Pflicht ist.", "Tap 'Pick recipes now' and add at least one recipe with a quantity. That's the only required thing.") },
    { target: "capo-modules",
      title: tri("2 · Accendi gli extra (facoltativo)", "2 · Extras aktivieren (optional)", "2 · Turn on extras (optional)"),
      body: tri("Con gli interruttori ON/OFF aggiungi solo ciò che ti serve: orari, freezer, costi… Tocca la «i» e ti spiego ognuno.", "Mit den ON/OFF-Schaltern fügst du nur hinzu, was du brauchst: Zeiten, Gefrier, Kosten… Tippe auf „i“ für Erklärungen.", "With the ON/OFF switches add only what you need: times, freezer, costs… Tap the 'i' for an explanation of each.") },
    { target: "capo-generate",
      title: tri("3 · Genera il piano", "3 · Plan erstellen", "3 · Generate the plan"),
      body: tri("Premi «Genera il piano»: creo la sequenza degli impasti, gli orari e la lista. Poi puoi stamparlo o salvarlo nell'archivio.", "Drücke „Plan erstellen“: ich erstelle Teig-Reihenfolge, Zeiten und Liste. Danach drucken oder im Archiv speichern.", "Press 'Generate the plan': I build the dough sequence, times and list. Then you can print it or save it to the archive.") },
  ];

  const [step, setStep] = useState(-1);

  useEffect(() => {
    if (force > 0) { setStep(0); return; }
    if (!localStorage.getItem(KEY)) setStep(0);
  }, [force]);

  useEffect(() => {
    if (step < 0) return;
    clearHighlights();
    const tgt = STEPS[step] && STEPS[step].target;
    if (tgt) {
      const el = document.querySelector(`[data-testid="${tgt}"]`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.style.outline = "3px solid #C88A2B";
        el.style.outlineOffset = "3px";
        el.style.borderRadius = "18px";
        el.setAttribute("data-tour-highlight", "1");
      }
    }
    return () => clearHighlights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const finish = () => { clearHighlights(); localStorage.setItem(KEY, "1"); setStep(-1); onClose && onClose(); };

  if (step < 0) return null;
  const s = STEPS[step];
  const last = step === STEPS.length - 1;

  return (
    <div data-testid="lab-tour" className="fixed inset-0 z-[60] pointer-events-none">
      <div className="absolute inset-0 bg-black/40 pointer-events-auto" onClick={finish} />
      <div className="pointer-events-auto absolute left-1/2 -translate-x-1/2 bottom-24 w-[92%] max-w-md rounded-2xl bg-white dark:bg-[#1B2127] border border-[#D7E1DB] dark:border-[#38424B] shadow-2xl p-4">
        <button data-testid="lab-tour-skip" onClick={finish} className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center text-[#7E8A93]"><X className="w-4 h-4" /></button>
        <div className="flex items-start gap-3">
          <img src={AVATAR} alt="Mohammadreza" className="w-12 h-12 rounded-xl object-cover ring-2 ring-[#5E8B7E]/50 shrink-0" onError={(e) => { e.currentTarget.style.display = "none"; }} />
          <div className="min-w-0 flex-1 pr-6">
            <h3 className="font-display text-base font-bold text-[#2B303B] dark:text-[#EAF0EC]">{s.title}</h3>
            <p className="text-sm text-[#3F4A54] dark:text-[#AEB8BF] leading-snug mt-0.5">{s.body}</p>
          </div>
        </div>
        <div className="flex items-center justify-between mt-3">
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (<span key={i} className={`w-2 h-2 rounded-full transition-colors ${i === step ? "bg-[#5E8B7E]" : "bg-[#D7E1DB] dark:bg-[#38424B]"}`} />))}
          </div>
          <div className="flex items-center gap-2">
            {!last && <button data-testid="lab-tour-skip-2" onClick={finish} className="text-xs font-semibold text-[#7E8A93] px-2 py-2">{tri("Salta", "Überspringen", "Skip")}</button>}
            <button data-testid="lab-tour-next" onClick={() => (last ? finish() : setStep(step + 1))}
              className="inline-flex items-center gap-1.5 text-sm font-bold bg-[#5E8B7E] hover:bg-[#4C7368] text-white px-4 py-2 rounded-xl active:scale-95 transition-all">
              {last ? tri("Ho capito!", "Verstanden!", "Got it!") : tri("Avanti", "Weiter", "Next")}
              {!last && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
