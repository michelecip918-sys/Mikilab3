import { useState, useEffect, useMemo, useRef } from "react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { MEDAGLIE } from "@/lib/medaglie";

// V90 — LA FESTA: quando segni un pane come fatto o prendi una medaglia, la bottega festeggia:
// farina che cade, una frase di Sitor, la medaglia che compare. Niente suoni (scelta del sito).
// Ascolta due eventi già esistenti: "mikilab-done-changed" (ricetta fatta) e "mikilab-medaglia".

const FRASI_PANE = [
  ["Pane fatto. Il forno ti ha detto grazie.", "Brot gemacht. Der Ofen hat sich bedankt.", "Bread done. The oven said thank you."],
  ["Un altro pane al mondo. Non è poco.", "Ein Brot mehr auf der Welt. Das ist nicht wenig.", "One more bread in the world. That's not nothing."],
  ["Le mani imparano. Oggi hanno imparato qualcosa.", "Die Hände lernen. Heute haben sie etwas gelernt.", "Hands learn. Today they learned something."],
  ["Senti il profumo? Quello non si compra.", "Riechst du das? Das kann man nicht kaufen.", "Smell that? You can't buy it."],
  ["Michele direbbe: bene, e adesso rifallo.", "Michele würde sagen: gut, und jetzt nochmal.", "Michele would say: good, now do it again."],
];

export default function Festa() {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const L = (o) => o[lang] || o.it;
  const [show, setShow] = useState(null); // {kind:"pane"|"medaglia", medal?, frase?}
  const doneCount = useRef(0);
  const timer = useRef(null);
  const flakes = useMemo(() => Array.from({ length: 30 }, (_, i) => ({ l: (i * 37) % 100, d: (i % 6) * 0.25, s: 5 + (i % 5) * 2, t: 3 + (i % 3) })), []);

  useEffect(() => {
    try { doneCount.current = (JSON.parse(localStorage.getItem("mikilab_done") || "[]") || []).length; } catch { /* */ }
    const pop = (payload) => { clearTimeout(timer.current); setShow(payload); timer.current = setTimeout(() => setShow(null), 4200); };
    const onDone = () => {
      let n = 0; try { n = (JSON.parse(localStorage.getItem("mikilab_done") || "[]") || []).length; } catch { /* */ }
      const grew = n > doneCount.current; doneCount.current = n;
      if (!grew) return;
      const f = FRASI_PANE[Math.floor(Math.random() * FRASI_PANE.length)];
      pop({ kind: "pane", frase: tri(...f) });
    };
    const onMedal = (e) => { const m = MEDAGLIE.find((x) => x.id === e?.detail?.id); if (m) pop({ kind: "medaglia", medal: m }); };
    window.addEventListener("mikilab-done-changed", onDone);
    window.addEventListener("mikilab-medaglia", onMedal);
    return () => { window.removeEventListener("mikilab-done-changed", onDone); window.removeEventListener("mikilab-medaglia", onMedal); clearTimeout(timer.current); };
  }, [lang]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!show) return null;
  return (
    <div data-testid="festa-pop" className="fixed inset-0 z-[88] pointer-events-none" aria-live="polite">
      <style>{`@keyframes fp-flake{0%{transform:translateY(-20px) rotate(0);opacity:.9}100%{transform:translateY(100vh) rotate(300deg);opacity:.6}}
        .fp-flake{position:absolute;top:-20px;border-radius:50%;background:#F6F1E7;box-shadow:0 0 2px rgba(0,0,0,.15);animation:fp-flake linear forwards}
        @keyframes fp-in{0%{transform:translateY(20px) scale(.9);opacity:0}100%{transform:none;opacity:1}}.fp-card{animation:fp-in .45s cubic-bezier(.2,.8,.2,1)}
        @media (prefers-reduced-motion:reduce){.fp-flake,.fp-card{animation:none}}`}</style>
      {flakes.map((f, i) => <span key={i} className="fp-flake" style={{ left: `${f.l}%`, width: f.s, height: f.s, animationDelay: `${f.d}s`, animationDuration: `${f.t}s` }} />)}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-24 w-[92%] max-w-sm">
        <div className="fp-card pointer-events-auto rounded-2xl border border-[#E9A23B]/60 bg-[#2A2D31] text-[#F6F1E7] shadow-2xl px-4 py-3 flex items-center gap-3" onClick={() => setShow(null)}>
          <span className="text-3xl shrink-0">{show.kind === "medaglia" ? show.medal.icon : "🥖"}</span>
          <div className="min-w-0">
            <p className="font-mono-data text-[10px] tracking-[0.25em] uppercase text-[#E9A23B]">{show.kind === "medaglia" ? tri("Nuova medaglia", "Neue Medaille", "New medal") : tri("Pane fatto", "Brot gemacht", "Bread done")}</p>
            <p className="font-bold text-sm leading-tight">{show.kind === "medaglia" ? L(show.medal.t) : show.frase}</p>
            {show.kind === "medaglia" && <p className="text-[11px] text-[#F6F1E7]/70">{tri("La trovi in Strumenti → Le mie medaglie.", "Zu finden unter Werkzeuge → Meine Medaillen.", "Find it in Tools → My medals.")}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
