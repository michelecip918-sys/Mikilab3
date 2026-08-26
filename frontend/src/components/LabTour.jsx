import { useState, useEffect } from "react";
import { X, ArrowRight } from "lucide-react";

const AVATAR = `${process.env.PUBLIC_URL}/mohammed-avatar.jpg`;

const clearHighlights = () => {
  document.querySelectorAll("[data-tour-highlight]").forEach((el) => {
    el.style.outline = ""; el.style.outlineOffset = ""; el.removeAttribute("data-tour-highlight");
  });
};

// Mini-tour riutilizzabile di Mohammadreza (Laboratorio, Diagnosi, Impara…).
// Props: steps=[{target, title, body}] (già localizzati), storageKey, force, onClose,
// labels={skip, next, done}.
export default function LabTour({ steps = [], storageKey, force = 0, onClose, labels }) {
  const L = labels || { skip: "Salta", next: "Avanti", done: "Ho capito!" };
  const [step, setStep] = useState(-1);

  useEffect(() => {
    if (!steps.length) return;
    if (force > 0) { setStep(0); return; }
    if (storageKey && !localStorage.getItem(storageKey)) setStep(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [force]);

  useEffect(() => {
    if (step < 0) return;
    clearHighlights();
    const tgt = steps[step] && steps[step].target;
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

  const finish = () => { clearHighlights(); if (storageKey) localStorage.setItem(storageKey, "1"); setStep(-1); onClose && onClose(); };

  if (step < 0 || !steps.length) return null;
  const s = steps[step];
  const last = step === steps.length - 1;

  return (
    <div data-testid="lab-tour" className="fixed inset-0 z-[60] pointer-events-none">
      <div className="absolute inset-0 bg-black/40 pointer-events-auto" onClick={finish} />
      <div className="pointer-events-auto absolute left-1/2 -translate-x-1/2 bottom-24 w-[92%] max-w-md rounded-2xl bg-white dark:bg-[#1B2127] border border-[#d5e4f0] dark:border-[#38424B] shadow-2xl p-4">
        <button data-testid="lab-tour-skip" onClick={finish} className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center text-[#7E8A93]"><X className="w-4 h-4" /></button>
        <div className="flex items-start gap-3">
          <img src={AVATAR} alt="Mohammadreza" className="w-12 h-12 rounded-xl object-cover ring-2 ring-[#3f7cac]/50 shrink-0" onError={(e) => { e.currentTarget.style.display = "none"; }} />
          <div className="min-w-0 flex-1 pr-6">
            <h3 className="font-display text-base font-bold text-[#2B303B] dark:text-[#e4eff8]">{s.title}</h3>
            <p className="text-sm text-[#3F4A54] dark:text-[#AEB8BF] leading-snug mt-0.5">{s.body}</p>
          </div>
        </div>
        <div className="flex items-center justify-between mt-3">
          <div className="flex gap-1.5">
            {steps.map((_, i) => (<span key={i} className={`w-2 h-2 rounded-full transition-colors ${i === step ? "bg-[#3f7cac]" : "bg-[#d5e4f0] dark:bg-[#38424B]"}`} />))}
          </div>
          <div className="flex items-center gap-2">
            {!last && <button data-testid="lab-tour-skip-2" onClick={finish} className="text-xs font-semibold text-[#7E8A93] px-2 py-2">{L.skip}</button>}
            <button data-testid="lab-tour-next" onClick={() => (last ? finish() : setStep(step + 1))}
              className="inline-flex items-center gap-1.5 text-sm font-bold bg-[#3f7cac] hover:bg-[#336a94] text-white px-4 py-2 rounded-xl active:scale-95 transition-all">
              {last ? L.done : L.next}
              {!last && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
