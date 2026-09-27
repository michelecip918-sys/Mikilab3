import { useEffect, useMemo, useState } from "react";
import { GraduationCap, ChefHat, RefreshCw, Check, ChevronRight, Sprout } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { api } from "@/lib/api";
import { rLoc } from "@/lib/loc";
import { WHY } from "@/components/Almanacco";
import { tappeConRicette, statoPiano, scegliQuattro, readDone, readSalti, readSkill, setSkill, saltaTappa, TAG } from "@/lib/piano";

// V128 — COMINCIA DA QUI. Prima c'erano sempre gli stessi cinque panini. Ora:
// • «Sto imparando» → il percorso in sei tappe: la tappa, a che punto sei, la prossima ricetta.
// • «So già panificare», o nessuna scelta → quattro ricette diverse a ogni visita (il pane di oggi, una facile o una
//   sfida, una da un reparto che non vedi da un po', una a sorpresa) e «Altre quattro» per cambiarle subito.

export default function CominciaDaQui({ recipes, onNav, onOpenRecipe }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const L = (o) => (o ? (lang === "de" ? o.de : lang === "en" ? o.en : o.it) : "");
  const [skill, setSkillState] = useState(readSkill);
  const [extras, setExtras] = useState(null);
  const [picks, setPicks] = useState([]);
  const [done, setDone] = useState(readDone);
  const [salti, setSalti] = useState(readSalti);

  useEffect(() => {
    let ok = true;
    api.get("/recipe-extras").then((r) => { if (ok) setExtras(r.data || {}); }).catch(() => { if (ok) setExtras({}); });
    const upd = () => { setDone(readDone()); setSalti(readSalti()); };
    window.addEventListener("mikilab-done-changed", upd);
    window.addEventListener("focus", upd);
    return () => { ok = false; window.removeEventListener("mikilab-done-changed", upd); window.removeEventListener("focus", upd); };
  }, []);

  const ready = Array.isArray(recipes) && recipes.length > 0 && extras !== null;
  const learning = skill === "learning";
  useEffect(() => { if (ready && !learning) setPicks(scegliQuattro(recipes, extras, { skill })); }, [ready, learning, skill]); // eslint-disable-line react-hooks/exhaustive-deps
  const tappe = useMemo(() => tappeConRicette(recipes), [recipes]);
  const st = useMemo(() => statoPiano(tappe, done, salti), [tappe, done, salti]);

  const choose = (v) => { setSkill(v); setSkillState(v); };
  const altre = () => setPicks(scegliQuattro(recipes, extras, { skill, nuovo: true }));
  const open = (id) => onOpenRecipe && onOpenRecipe(id);
  const why = WHY[new Date().getDay()];

  const choice = (v, I, label) => (
    <button key={v} data-testid={`comincia-${v}`} onClick={() => choose(v)} aria-pressed={skill === v}
      className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-[13.5px] font-bold transition-all active:scale-[0.98] ${skill === v ? "bg-primary text-primary-foreground" : "text-foreground"}`}>
      <I className="w-4 h-4" />{label}
    </button>
  );

  return (
    <section id="home-start-section" data-testid="home-start-section" className="scroll-mt-24">
      <h2 className="font-display text-xl font-black text-foreground">{tri("Comincia da qui", "Fang hier an", "Start here")}</h2>
      <p className="text-[13px] text-muted-foreground mt-0.5 mb-3">{!skill
        ? tri("Sei alle prime armi o sai già panificare? Scegli, e le ricette qui sotto cambiano per te.", "Fängst du gerade an oder kannst du schon backen? Wähle, und die Rezepte hier passen sich an.", "Just starting out, or already know how to bake? Choose, and the recipes below adapt to you.")
        : learning ? tri("Un percorso in sei tappe, una ricetta alla volta.", "Ein Weg in sechs Etappen, ein Rezept nach dem anderen.", "A six-stage path, one recipe at a time.")
          : tri("Quattro ricette diverse a ogni visita.", "Bei jedem Besuch vier andere Rezepte.", "Four different recipes on every visit.")}</p>
      <div role="group" className="flex gap-1 p-1 rounded-2xl border border-border bg-card mb-3">
        {choice("learning", GraduationCap, tri("Sto imparando", "Ich lerne noch", "I'm learning"))}
        {choice("expert", ChefHat, tri("So già panificare", "Ich kann schon backen", "I can already bake"))}
      </div>

      {!ready && <p className="text-sm text-muted-foreground">{tri("Scaldo il forno…", "Ich heize den Ofen…", "Heating the oven…")}</p>}

      {ready && !learning && (
        <div data-testid="comincia-scopri">
          <div className="grid grid-cols-2 gap-2.5">
            {picks.map(({ r, k }, i) => (
              <button key={r.id} data-testid={`home-start-${i}`} onClick={() => open(r.id)}
                className="group text-left rounded-2xl overflow-hidden border border-border bg-card active:scale-[0.98] hover:border-primary transition-all flex flex-col">
                <span className="relative block w-full aspect-[4/3] bg-muted">
                  <img src={r.image_url} alt="" className="w-full h-full object-cover" loading="lazy" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                  <span className={`absolute top-2 left-2 text-[11px] font-bold px-2 py-0.5 rounded-full ${k === "oggi" ? "bg-primary text-primary-foreground" : "bg-background/90 text-foreground"}`}>{L(TAG[k])}</span>
                </span>
                <span className="block px-2.5 py-2 text-[13px] font-bold text-foreground leading-tight line-clamp-2">{rLoc(r, "name", lang)}</span>
              </button>
            ))}
          </div>
          {picks.some((x) => x.k === "oggi") && why && <p className="text-[12.5px] text-muted-foreground italic mt-2">{L(why)}</p>}
          <button data-testid="comincia-altre" onClick={altre} className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-bold text-primary py-1"><RefreshCw className="w-4 h-4" />{tri("Altre quattro", "Vier andere", "Four more")}</button>
        </div>
      )}

      {ready && learning && (
        <div data-testid="comincia-percorso" className="rounded-2xl border border-primary/30 bg-card p-4">
          {st.tappa ? (<>
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-[12px] font-bold text-primary">{tri(`Tappa ${st.n} di ${st.di}`, `Etappe ${st.n} von ${st.di}`, `Stage ${st.n} of ${st.di}`)}</p>
              <p className="text-[12px] font-bold text-muted-foreground">{tri(`${st.fatte} su ${st.totali} fatte`, `${st.fatte} von ${st.totali} gemacht`, `${st.fatte} of ${st.totali} done`)}</p>
            </div>
            <h3 className="font-display text-lg font-black text-foreground leading-tight mt-0.5">{L(st.tappa.t)}</h3>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden mt-2"><div className="h-full bg-primary transition-all" style={{ width: `${Math.round((st.fatte / Math.max(1, st.totali)) * 100)}%` }} /></div>
            <p className="text-[13px] text-foreground/85 leading-snug mt-2">{L(st.tappa.d)}</p>
            {st.tappa.prima && st.fatte === 0 && (
              <button data-testid="comincia-prima" onClick={() => onNav(st.tappa.prima.route)} className="mt-3 w-full flex items-center gap-2 text-left rounded-xl border border-salvia/40 bg-salvia/10 p-3 active:scale-[0.99]">
                <Sprout className="w-5 h-5 text-salvia shrink-0" />
                <span className="flex-1 min-w-0"><span className="block text-[13.5px] font-bold text-foreground">{L(st.tappa.prima.t)}</span><span className="block text-[12px] text-muted-foreground leading-snug">{L(st.tappa.prima.d)}</span></span>
              </button>
            )}
            {st.next && (
              <button data-testid="comincia-prossima" onClick={() => open(st.next.id)} className="mt-3 w-full flex items-stretch gap-3 text-left rounded-xl border border-border bg-background overflow-hidden active:scale-[0.99] hover:border-primary transition-all">
                <span className="w-24 shrink-0 bg-muted">{st.next.image_url && <img src={st.next.image_url} alt="" className="w-full h-full object-cover" loading="lazy" />}</span>
                <span className="flex-1 min-w-0 py-2.5 pr-2">
                  <span className="block text-[12px] font-bold text-primary">{tri("La prossima", "Das nächste", "Next up")}</span>
                  <span className="block font-display text-[16px] font-black text-foreground leading-tight">{rLoc(st.next, "name", lang)}</span>
                  <span className="inline-flex items-center gap-0.5 text-[12.5px] font-bold text-primary mt-1">{tri("Apri la ricetta", "Rezept öffnen", "Open the recipe")}<ChevronRight className="w-3.5 h-3.5" /></span>
                </span>
              </button>
            )}
            <div className="flex gap-1.5 mt-3" data-testid="comincia-tappa-ricette">
              {st.tappa.recipes.map((r) => (
                <button key={r.id} onClick={() => open(r.id)} title={rLoc(r, "name", lang)} className={`relative w-11 h-11 rounded-lg overflow-hidden border ${st.next && r.id === st.next.id ? "border-primary border-2" : "border-border"}`}>
                  {r.image_url && <img src={r.image_url} alt={rLoc(r, "name", lang)} className="w-full h-full object-cover" loading="lazy" />}
                  {done.has(r.id) && <span className="absolute inset-0 bg-salvia/70 flex items-center justify-center"><Check className="w-5 h-5 text-white" /></span>}
                </button>
              ))}
            </div>
            <p className="text-[12px] text-muted-foreground leading-snug mt-3">{tri("Quando l'hai fatta, dentro la ricetta tocca «Segna come fatta»: il percorso va avanti da solo.", "Wenn du es gebacken hast, tippe im Rezept auf «Als gemacht markieren»: der Weg geht von selbst weiter.", "Once you've made it, tap «Mark as done» inside the recipe: the path moves on by itself.")}</p>
            <div className="flex items-center justify-between gap-2 mt-2">
              <button data-testid="comincia-tutto-percorso" onClick={() => onNav("percorso")} className="text-[13px] font-bold text-primary inline-flex items-center gap-0.5 py-1">{tri("Tutto il percorso", "Der ganze Weg", "The whole path")}<ChevronRight className="w-4 h-4" /></button>
              <button data-testid="comincia-salta" onClick={() => { saltaTappa(st.tappa.k); setSalti(readSalti()); }} className="text-[12px] text-muted-foreground underline decoration-dotted py-1">{tri("Questa la so già: salta", "Kann ich schon: überspringen", "I know this one: skip")}</button>
            </div>
          </>) : (
            <div data-testid="comincia-finito">
              <p className="font-display text-lg font-black text-foreground">{tri("Hai finito il percorso.", "Du hast den Weg geschafft.", "You've finished the path.")}</p>
              <p className="text-[13px] text-foreground/85 mt-1">{tri("Dai primi panini al panettone: ora sai panificare. Da qui in poi scegli tu.", "Von den ersten Brötchen bis zum Panettone: jetzt kannst du backen. Ab jetzt wählst du.", "From the first rolls to panettone: now you can bake. From here on, you choose.")}</p>
              <button onClick={() => choose("expert")} className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-[13px] font-bold active:scale-95"><ChefHat className="w-4 h-4" />{tri("Passa a «So già panificare»", "Zu «Ich kann schon backen»", "Switch to «I can already bake»")}</button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
