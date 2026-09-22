import { useState, useEffect, useRef } from "react";
import { Dices, X, ChevronRight } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { recipesApi } from "@/lib/api";
import { rLoc } from "@/lib/loc";
import { useBackClose } from "@/lib/backNav";
import { award } from "@/lib/medaglie";

// V90 — "SORPRENDIMI": la ruota del fornaio. Le foto delle ricette girano come una slot e si fermano
// su una a caso: "Stasera si fa questa". Un'altra? Gira ancora. Tutto nel browser.
export default function Sorprendimi({ onClose, onOpenRecipe }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  useBackClose(true, onClose);
  const [recipes, setRecipes] = useState([]);
  const [idx, setIdx] = useState(0);
  const [spinning, setSpinning] = useState(true);
  const [pick, setPick] = useState(null);
  const t = useRef(null);

  useEffect(() => {
    let stop = false;
    recipesApi.list("mikilab").then((r) => { if (!stop && Array.isArray(r)) setRecipes(r.filter((x) => !x.hidden && x.image_url)); }).catch(() => { /* */ });
    return () => { stop = true; clearTimeout(t.current); };
  }, []);

  const spin = () => {
    if (!recipes.length) return;
    setSpinning(true); setPick(null);
    let i = 0; let delay = 40; const start = Date.now();
    const step = () => {
      i += 1; setIdx((v) => (v + 1) % recipes.length);
      const el = Date.now() - start;
      if (el < 1800) { delay = el < 1100 ? 45 : delay * 1.28; t.current = setTimeout(step, delay); }
      else { const p = recipes[Math.floor(Math.random() * recipes.length)]; setPick(p); setSpinning(false); }
    };
    t.current = setTimeout(step, delay);
  };
  useEffect(() => { if (recipes.length && spinning && !pick && !t.current) spin(); }, [recipes]); // eslint-disable-line react-hooks/exhaustive-deps

  const cur = pick || recipes[idx];
  return (
    <div data-testid="sorprendimi" role="dialog" aria-modal="true" className="fixed inset-0 z-[86] flex items-center justify-center p-4 bg-[#1F2124]/85 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-sm rounded-3xl border border-primary/40 bg-background text-foreground shadow-2xl p-5" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} aria-label={tri("Chiudi", "Schließen", "Close")} className="absolute top-3 right-3 p-2 rounded-full hover:bg-muted active:scale-95"><X className="w-5 h-5" /></button>
        <p className="font-mono-data text-[10px] tracking-[0.28em] uppercase text-primary flex items-center gap-1.5"><Dices className="w-3.5 h-3.5" />{tri("La ruota del fornaio", "Das Bäckerrad", "The baker's wheel")}</p>
        <h2 className="font-display text-xl font-black leading-tight mt-1">{spinning ? tri("Sitor sta scegliendo…", "Sitor wählt…", "Sitor is choosing…") : tri("Stasera si fa questa.", "Heute Abend gibt's das.", "Tonight we make this.")}</h2>
        <div className="mt-4 rounded-2xl overflow-hidden border border-border bg-muted aspect-[4/3] relative">
          {cur && cur.image_url && <img src={cur.image_url} alt="" className={`w-full h-full object-cover ${spinning ? "blur-[1px]" : ""}`} />}
          {!recipes.length && <p className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">{tri("Scaldo il forno…", "Ich heize den Ofen…", "Heating the oven…")}</p>}
        </div>
        <p className={`mt-3 font-bold text-center text-[15px] min-h-[1.5rem] ${spinning ? "text-muted-foreground" : "text-foreground"}`}>{cur ? rLoc(cur, "name", lang) : ""}</p>
        <div className="mt-4 flex gap-2">
          <button disabled={spinning} onClick={spin} className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-background text-sm font-bold text-foreground active:scale-95 disabled:opacity-40">{tri("Un'altra", "Noch eins", "Another")}</button>
          <button disabled={spinning || !pick} data-testid="sorprendimi-apri" onClick={() => { award("sorpresa"); onClose(); onOpenRecipe && onOpenRecipe(pick.id); }} className="flex-1 inline-flex items-center justify-center gap-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold active:scale-95 disabled:opacity-40">{tri("Mi fido, apri", "Ich vertraue, öffnen", "I trust you, open")}<ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>
    </div>
  );
}
