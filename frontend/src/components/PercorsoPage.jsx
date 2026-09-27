import { useState, useEffect, useMemo } from "react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { recipesApi } from "@/lib/api";
import { ChevronLeft, Check, ArrowRight, CheckCircle2, Sprout, GraduationCap } from "lucide-react";
import { rLoc } from "@/lib/loc";
import { tappeConRicette, statoPiano, readDone, readSalti, readSkill, setSkill, saltaTappa, toggleDone } from "@/lib/piano";

// V128 — IL PERCORSO IN SEI TAPPE: lo stesso di «Comincia da qui» in Home (lib/piano.js). Prima si vedevano
// due livelli e quattro «In arrivo» (e le focacce senza ricette): ora tutte le tappe hanno le loro ricette.

export default function PercorsoPage({ onBack, onOpenRecipe, onNav }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const L = (o) => (o ? (lang === "de" ? o.de : lang === "en" ? o.en : o.it) : "");
  const [recipes, setRecipes] = useState([]);
  const [done, setDone] = useState(readDone);
  const [salti, setSalti] = useState(readSalti);
  const [skill, setSkillState] = useState(readSkill);

  useEffect(() => { let ok = true; recipesApi.list("mikilab").then((d) => { if (ok && Array.isArray(d)) setRecipes(d); }).catch(() => {}); return () => { ok = false; }; }, []);
  useEffect(() => {
    const h = () => { setDone(readDone()); setSalti(readSalti()); };
    window.addEventListener("mikilab-done-changed", h);
    return () => window.removeEventListener("mikilab-done-changed", h);
  }, []);

  const tappe = useMemo(() => tappeConRicette(recipes), [recipes]);
  const st = statoPiano(tappe, done, salti);

  return (
    <div data-testid="percorso-page" className="space-y-5">
      {onBack && <button onClick={onBack} className="inline-flex items-center gap-1 text-sm font-bold text-muted-foreground hover:text-foreground"><ChevronLeft className="w-4 h-4" />{tri("Indietro", "Zurück", "Back")}</button>}
      <div>
        <h1 className="font-display text-3xl font-black text-foreground">{tri("Il percorso in sei tappe", "Der Weg in sechs Etappen", "The six-stage path")}</h1>
        <p className="text-[14px] text-muted-foreground mt-1">{tri("Dai primi panini al panettone, una ricetta alla volta. Nessun blocco: puoi aprire qualsiasi ricetta, saltare una tappa o sceglierne un'altra dal ricettario.", "Von den ersten Brötchen bis zum Panettone, ein Rezept nach dem anderen. Keine Sperren: du kannst jedes Rezept öffnen, eine Etappe überspringen oder im Rezeptbuch wählen.", "From the first rolls to panettone, one recipe at a time. No locks: you can open any recipe, skip a stage or pick another from the recipe book.")}</p>
        {skill !== "learning" && (
          <button data-testid="percorso-in-home" onClick={() => { setSkill("learning"); setSkillState("learning"); }} className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-[13px] font-bold active:scale-95"><GraduationCap className="w-4 h-4" />{tri("Seguilo anche in Home", "Auch auf der Startseite folgen", "Follow it on the Home page too")}</button>
        )}
      </div>

      {!recipes.length && <p className="text-sm text-muted-foreground">{tri("Scaldo il forno…", "Ich heize den Ofen…", "Heating the oven…")}</p>}

      {tappe.map((tp, i) => {
        if (!tp.recipes.length) return null;
        const fatte = tp.recipes.filter((r) => done.has(r.id)).length;
        const complete = fatte === tp.recipes.length;
        const saltata = salti.has(tp.k) && !complete;
        const corrente = st.cur === i;
        return (
          <div key={tp.k} data-testid={`level-${i + 1}`} className={`rounded-2xl border bg-card p-4 ${corrente ? "border-primary border-2" : "border-border"} ${saltata ? "opacity-70" : ""}`}>
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-[12px] font-bold text-primary">{tri(`Tappa ${i + 1}`, `Etappe ${i + 1}`, `Stage ${i + 1}`)}{corrente ? tri(" · sei qui", " · du bist hier", " · you are here") : ""}{saltata ? tri(" · saltata", " · übersprungen", " · skipped") : ""}</p>
              <span className="text-[12px] font-bold text-muted-foreground">{fatte}/{tp.recipes.length}</span>
            </div>
            <p className="font-display font-black text-foreground text-lg leading-tight">{L(tp.t)}</p>
            <p className="text-[13px] text-foreground/80 leading-snug mt-0.5">{L(tp.d)}</p>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden my-3"><div className="h-full bg-accent transition-all" style={{ width: `${Math.round((fatte / tp.recipes.length) * 100)}%` }} /></div>
            {tp.prima && (
              <button data-testid="level5-crealievito" onClick={() => onNav && onNav(tp.prima.route)} className="w-full flex items-center gap-2 text-left rounded-xl border border-salvia/40 bg-salvia/10 p-3 mb-3 hover:border-salvia active:scale-[0.99] transition-all">
                <Sprout className="w-5 h-5 text-salvia shrink-0" />
                <span className="flex-1 min-w-0"><span className="block text-sm font-bold text-foreground">{L(tp.prima.t)}</span><span className="block text-[12px] text-muted-foreground leading-snug">{L(tp.prima.d)}</span></span>
              </button>
            )}
            <div className="space-y-1.5">
              {tp.recipes.map((r) => (
                <div key={r.id} className="flex items-center gap-2">
                  <button data-testid={`level-done-${r.id}`} onClick={() => { toggleDone(r.id); setDone(readDone()); }} aria-label={done.has(r.id) ? tri("Togli «fatta»", "«Gemacht» entfernen", "Undo «done»") : tri("Segna come fatta", "Als gemacht markieren", "Mark as done")} className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2 ${done.has(r.id) ? "bg-accent border-accent" : "border-border"}`}>{done.has(r.id) && <Check className="w-4 h-4 text-white" />}</button>
                  <button onClick={() => onOpenRecipe && onOpenRecipe(r.id)} className={`text-left flex-1 text-[14px] py-1 ${done.has(r.id) ? "text-muted-foreground line-through" : "text-foreground font-semibold"}`}>{rLoc(r, "name", lang)}</button>
                </div>
              ))}
            </div>
            {complete && (
              <div data-testid={`level-complete-${i + 1}`} className="mt-3 rounded-xl bg-accent/20 border border-accent/40 p-3 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-accent" />
                <p className="text-sm font-bold text-foreground">{i < tappe.length - 1 ? tri("Tappa finita: si passa alla prossima.", "Etappe geschafft: weiter zur nächsten.", "Stage done: on to the next one.") : tri("Percorso finito. Bravo!", "Weg geschafft. Super!", "Path finished. Well done!")}</p>
              </div>
            )}
            {!complete && (
              <button data-testid={`level-salta-${i + 1}`} onClick={() => { saltaTappa(tp.k, !saltata); setSalti(readSalti()); }} className="mt-3 text-[12px] text-muted-foreground underline decoration-dotted">{saltata ? tri("Riprendi questa tappa", "Diese Etappe wieder aufnehmen", "Resume this stage") : tri("Questa la so già: salta", "Kann ich schon: überspringen", "I know this one: skip")}</button>
            )}
          </div>
        );
      })}

      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="font-bold text-foreground mb-2">{tri("Preferisci scegliere da solo?", "Lieber selbst wählen?", "Prefer to choose yourself?")}</p>
        <button data-testid="percorso-gallery" onClick={() => onNav && onNav("recipes")} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-muted text-foreground text-sm font-bold active:scale-95"><ArrowRight className="w-4 h-4" />{tri("Tutte le ricette", "Alle Rezepte", "All recipes")}</button>
      </div>
    </div>
  );
}
