import { useState, useEffect } from "react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { api } from "@/lib/api";
import { ChevronLeft, Check, Lock, ArrowRight, CheckCircle2 } from "lucide-react";
import { rLoc } from "@/lib/loc";

const DONE_KEY = "mikilab_done";

function loadDone() { try { return new Set(JSON.parse(localStorage.getItem(DONE_KEY) || "[]")); } catch { return new Set(); } }

export default function PercorsoPage({ onBack, onOpenRecipe, onNav }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const li = (o) => (o ? (lang === "de" ? o.de : lang === "en" ? o.en : o.it) : "");
  const [levels, setLevels] = useState([]);
  const [done, setDone] = useState(loadDone);

  useEffect(() => { api.get(`/learning-path`).then((r) => setLevels(r.data?.levels || [])).catch(() => {}); }, []);
  useEffect(() => {
    const h = () => setDone(loadDone());
    window.addEventListener("mikilab-done-changed", h);
    return () => window.removeEventListener("mikilab-done-changed", h);
  }, []);

  const toggle = (id) => {
    const s = new Set(done);
    s.has(id) ? s.delete(id) : s.add(id);
    localStorage.setItem(DONE_KEY, JSON.stringify([...s]));
    setDone(new Set(s));
    window.dispatchEvent(new CustomEvent("mikilab-done-changed"));
  };

  return (
    <div data-testid="percorso-page" className="space-y-6">
      {onBack && <button onClick={onBack} className="inline-flex items-center gap-1 text-sm font-bold text-muted-foreground hover:text-foreground"><ChevronLeft className="w-4 h-4" />{tri("Home", "Start", "Home")}</button>}
      <div>
        <h1 className="font-display text-3xl font-black text-foreground">{tri("Il percorso", "Der Lernpfad", "The path")}</h1>
        <p className="text-muted-foreground mt-1">{tri("Impara passo dopo passo. Nessun blocco: puoi sempre scegliere dalla galleria.", "Lerne Schritt für Schritt. Keine Sperren: du kannst immer aus der Galerie wählen.", "Learn step by step. No locks: you can always pick from the gallery.")}</p>
      </div>

      {levels.map((lv) => {
        const doneCount = lv.recipes.filter((r) => done.has(r.id)).length;
        const pct = lv.recipes.length ? Math.round((doneCount / lv.recipes.length) * 100) : 0;
        const complete = lv.recipes.length > 0 && doneCount === lv.recipes.length;
        const nextActive = levels.find((x) => x.n === lv.n + 1)?.active;
        if (lv.coming_soon) {
          return (
            <div key={lv.n} data-testid={`level-${lv.n}`} className="rounded-2xl border border-dashed border-border bg-background/50 p-4 opacity-70">
              <p className="inline-flex items-center gap-2 font-bold text-muted-foreground"><Lock className="w-4 h-4" />{tri("Livello", "Level", "Level")} {lv.n} · {li(lv.title)}</p>
              <p className="text-xs text-muted-foreground mt-1">{tri("In arrivo", "Kommt bald", "Coming soon")}</p>
            </div>
          );
        }
        return (
          <div key={lv.n} data-testid={`level-${lv.n}`} className="rounded-2xl border border-border bg-background p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="font-display font-black text-foreground text-lg">{tri("Livello", "Level", "Level")} {lv.n} · {li(lv.title)}</p>
              <span className="text-xs font-bold text-muted-foreground">{doneCount}/{lv.recipes.length}</span>
            </div>
            <div className="h-2 rounded-full bg-foreground/10 overflow-hidden mb-3"><div className="h-full bg-accent transition-all" style={{ width: `${pct}%` }} /></div>
            {lv.n === 5 && (
              <button data-testid="level5-crealievito" onClick={() => onNav("crealievito")} className="w-full text-left rounded-xl border border-salvia/40 bg-salvia/10 p-3 mb-3 hover:border-salvia active:scale-[0.99] transition-all">
                <p className="text-sm font-bold text-foreground">🌱 {tri("Prima crea il tuo lievito", "Erschaffe zuerst deinen Sauerteig", "First create your starter")}</p>
                <p className="text-[12px] text-muted-foreground mt-0.5">{tri("Questo livello usa il lievito madre: se non ce l'hai, imparalo a fare da zero.", "Dieses Level nutzt Sauerteig: hast du keinen, lerne ihn von Grund auf zu machen.", "This level uses sourdough: if you don't have one, learn to make it from scratch.")}</p>
              </button>
            )}
            <div className="space-y-1.5">
              {lv.recipes.map((r) => (
                <div key={r.id} className="flex items-center gap-2">
                  <button data-testid={`level-done-${r.id}`} onClick={() => toggle(r.id)} className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2 ${done.has(r.id) ? "bg-accent border-accent" : "border-border"}`}>{done.has(r.id) && <Check className="w-3.5 h-3.5 text-foreground" />}</button>
                  <button onClick={() => onOpenRecipe(r.id)} className={`text-left flex-1 text-sm hover:text-muted-foreground ${done.has(r.id) ? "text-muted-foreground line-through" : "text-foreground"}`}>{rLoc(r, "name", lang)}</button>
                </div>
              ))}
            </div>
            {complete && (
              <div data-testid={`level-complete-${lv.n}`} className="mt-3 rounded-xl bg-accent/20 border border-accent/40 p-3 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-accent" />
                <p className="text-sm font-bold text-foreground">{nextActive ? `${tri("Livello completato! Vai al livello", "Level geschafft! Weiter zu Level", "Level complete! Go to level")} ${lv.n + 1}` : tri("Livello completato! Bravo.", "Level geschafft! Super.", "Level complete! Well done.")}</p>
              </div>
            )}
          </div>
        );
      })}

      <div className="rounded-2xl border border-border bg-background p-4">
        <p className="font-bold text-foreground mb-2">{tri("Preferisci scegliere da solo?", "Lieber selbst wählen?", "Prefer to choose yourself?")}</p>
        <div className="flex flex-wrap gap-2">
          <button data-testid="percorso-gallery" onClick={() => onNav("recipes")} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-muted text-foreground text-sm font-bold active:scale-95"><ArrowRight className="w-4 h-4" />{tri("Galleria per tipo", "Galerie nach Art", "Gallery by type")}</button>
        </div>
      </div>
    </div>
  );
}
