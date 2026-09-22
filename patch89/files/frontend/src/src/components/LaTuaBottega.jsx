import { useState, useEffect, useMemo } from "react";
import { Sprout, BookOpen, CalendarDays, Flame, AlarmClock, ChevronRight, UserRound, X } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { recipesApi } from "@/lib/api";
import { rLoc } from "@/lib/loc";
import { getName, setName, getLastRecipe, getDoneCount, getLievito, getForno, bakerTitle, weeklyPick, getWeekPlan, setWeekPlan, clearWeekPlan, daysToSunday } from "@/lib/bottega";

// V88 — "LA TUA BOTTEGA": il blocco in Home che riconosce chi torna. Alla seconda visita il sito non
// ricomincia da zero: saluta per nome (se lo vuoi), ricorda l'ultima ricetta aperta, ti dice se il tuo
// lievito ha fame, quante settimane di fila hai acceso il forno, il tuo titolo, e ti propone il pane
// della settimana (lo stesso per tutti, così ci si ritrova a farlo insieme la domenica).
// Tutto dal tuo telefono: nome e dati non vengono mai inviati. Il nome si può togliere in un tocco.

const PUB = process.env.PUBLIC_URL;

export default function LaTuaBottega({ onNav, onOpenRecipe }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const [name, setNm] = useState(getName);
  const [askName, setAskName] = useState(false);
  const [tmpName, setTmpName] = useState("");
  const [recipes, setRecipes] = useState([]);
  const [forno, setForno] = useState({ count: 0, streak: 0 });
  const [plan, setPlan] = useState(getWeekPlan);
  const last = getLastRecipe();
  const lievito = getLievito();
  const done = getDoneCount();

  useEffect(() => {
    let stop = false;
    recipesApi.list("mikilab").then((r) => { if (!stop && Array.isArray(r)) setRecipes(r); }).catch(() => { /* */ });
    getForno().then((f) => { if (!stop) setForno(f); });
    return () => { stop = true; };
  }, []);

  const weekly = useMemo(() => weeklyPick(recipes), [recipes]);
  const planRecipe = plan && recipes.find((r) => r.id === plan.id);
  const title = bakerTitle(done, forno.count, tri);
  const h = new Date().getHours();
  const hello = h < 6 ? tri("Buona notte in bottega", "Gute Nacht in der Backstube", "Good night in the bakery") : h < 12 ? tri("Buongiorno", "Guten Morgen", "Good morning") : h < 18 ? tri("Buon pomeriggio", "Guten Tag", "Good afternoon") : tri("Buonasera", "Guten Abend", "Good evening");
  const isNew = !last && !lievito && done === 0 && forno.count === 0 && !name;
  const dts = daysToSunday();

  const saveName = () => { const n = tmpName.trim(); setName(n); setNm(n); setAskName(false); };
  const forget = () => { setName(""); setNm(""); };

  if (isNew && !askName) {
    // prima visita: una riga sola, senza pretese
    return (
      <section data-testid="bottega-nuovo" className="mt-4 rounded-2xl border border-border/30 bg-background/70 px-4 py-3 flex items-center gap-3">
        <UserRound className="w-5 h-5 text-primary shrink-0" />
        <p className="text-[13px] text-foreground/85 flex-1">{tri("Vuoi che la bottega ti riconosca quando torni? Dimmi come ti chiami: resta solo nel tuo telefono.", "Soll dich die Backstube wiedererkennen, wenn du zurückkommst? Sag mir deinen Namen: er bleibt nur auf deinem Handy.", "Want the bakery to recognise you when you come back? Tell me your name: it stays only on your phone.")}</p>
        <button data-testid="bottega-ask" onClick={() => setAskName(true)} className="px-3 py-1.5 rounded-full bg-primary/15 border border-primary/40 text-xs font-bold text-foreground active:scale-95 shrink-0">{tri("Sì", "Ja", "Yes")}</button>
      </section>
    );
  }

  return (
    <section data-testid="bottega" className="mt-4 rounded-3xl border border-primary/30 bg-background/70 overflow-hidden">
      <div className="px-5 pt-4 pb-3 flex items-start gap-3">
        <img src={`${PUB}/sitor_official.webp`} alt="" className="w-11 h-11 rounded-xl object-cover object-top border border-primary/40 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="font-mono-data text-[10px] tracking-[0.28em] uppercase text-primary">{tri("La tua bottega", "Deine Backstube", "Your bakery")}</p>
          {askName ? (
            <div className="flex gap-2 mt-1">
              <input data-testid="bottega-name" value={tmpName} onChange={(e) => setTmpName(e.target.value.slice(0, 24))} placeholder={tri("Il tuo nome", "Dein Name", "Your name")} className="flex-1 rounded-xl border border-border bg-background px-3 py-1.5 text-sm text-foreground" onKeyDown={(e) => { if (e.key === "Enter") saveName(); }} />
              <button data-testid="bottega-save-name" onClick={saveName} className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold active:scale-95">{tri("Ok", "Ok", "Ok")}</button>
              <button onClick={() => setAskName(false)} className="px-2 rounded-xl border border-border text-foreground"><X className="w-4 h-4" /></button>
            </div>
          ) : (
            <h2 className="font-display text-xl font-black text-foreground leading-tight">
              {hello}{name ? `, ${name}` : ""}. {title.icon} <span className="text-primary">{title.t}</span>
              {forno.streak >= 2 && <span className="text-[13px] font-bold text-foreground/80"> · {tri(`${forno.streak} settimane di fila col forno acceso`, `${forno.streak} Wochen in Folge mit Ofen an`, `${forno.streak} weeks in a row with the oven on`)}</span>}
            </h2>
          )}
          {!askName && !name && <button onClick={() => setAskName(true)} className="text-[11px] font-bold text-primary underline mt-0.5">{tri("Come ti chiami?", "Wie heißt du?", "What's your name?")}</button>}
        </div>
      </div>

      <div className="px-5 pb-4 grid sm:grid-cols-2 gap-2">
        {last && (
          <button data-testid="bottega-last" onClick={() => onOpenRecipe && onOpenRecipe(last.id)} className="text-left rounded-2xl border border-border bg-background p-3 hover:border-primary active:scale-[0.99] transition-all">
            <p className="text-[11px] text-muted-foreground flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" />{tri("Ricomincia da dove eri", "Mach weiter, wo du warst", "Pick up where you left off")}</p>
            <p className="font-bold text-foreground text-sm mt-0.5 line-clamp-1">{last.name}</p>
          </button>
        )}
        {lievito && (
          <button data-testid="bottega-lievito" onClick={() => onNav && onNav("miolievito")} className={`text-left rounded-2xl border p-3 active:scale-[0.99] transition-all ${lievito.veryHungry ? "border-mattone/50 bg-mattone/10" : lievito.hungry ? "border-ambra/50 bg-ambra/12" : "border-border bg-background hover:border-salvia"}`}>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1"><Sprout className="w-3.5 h-3.5 text-salvia" />{tri("Il tuo lievito", "Dein Sauerteig", "Your starter")}</p>
            <p className="font-bold text-foreground text-sm mt-0.5">
              {lievito.hungry ? tri(`${lievito.name} ha fame`, `${lievito.name} hat Hunger`, `${lievito.name} is hungry`) : tri(`${lievito.name} sta bene`, `${lievito.name} geht es gut`, `${lievito.name} is fine`)} · {tri(`${lievito.days} giorni`, `${lievito.days} Tage`, `${lievito.days} days`)}
            </p>
          </button>
        )}
        {(weekly || planRecipe) && (
          <div data-testid="bottega-settimana" className="sm:col-span-2 rounded-2xl border border-primary/40 bg-primary/8 p-3">
            <p className="text-[11px] text-muted-foreground flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5 text-primary" />{planRecipe ? tri("Il tuo pane della domenica", "Dein Sonntagsbrot", "Your Sunday bread") : tri("Il pane della settimana, per tutta la bottega", "Das Brot der Woche, für die ganze Backstube", "Bread of the week, for the whole bakery")}</p>
            <div className="flex items-center gap-3 mt-1.5">
              {(planRecipe || weekly).image_url && <img src={(planRecipe || weekly).image_url} alt="" className="w-14 h-14 rounded-xl object-cover border border-border shrink-0" loading="lazy" />}
              <div className="min-w-0 flex-1">
                <p className="font-bold text-foreground text-sm line-clamp-2">{rLoc(planRecipe || weekly, "name", lang)}</p>
                <p className="text-[12px] text-foreground/75">
                  {planRecipe
                    ? (dts === 0 ? tri("È oggi: forno acceso!", "Heute ist es so weit: Ofen an!", "It's today: oven on!") : tri(`Tra ${dts} ${dts === 1 ? "giorno" : "giorni"}. Hai comprato tutto?`, `In ${dts} ${dts === 1 ? "Tag" : "Tagen"}. Hast du alles eingekauft?`, `In ${dts} ${dts === 1 ? "day" : "days"}. Got everything?`))
                    : tri("Questa settimana lo facciamo tutti. Lo fai anche tu domenica?", "Diese Woche backen wir es alle. Machst du am Sonntag mit?", "This week we all make it. Will you, on Sunday?")}
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-2 flex-wrap">
              <button onClick={() => onOpenRecipe && onOpenRecipe((planRecipe || weekly).id)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-background border border-border text-xs font-bold text-foreground active:scale-95">{tri("Apri la ricetta", "Rezept öffnen", "Open recipe")}<ChevronRight className="w-3.5 h-3.5" /></button>
              {planRecipe
                ? <>
                  <button onClick={() => onNav && onNav("sveglia")} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/15 border border-primary/40 text-xs font-bold text-foreground active:scale-95"><AlarmClock className="w-3.5 h-3.5 text-primary" />{tri("Sveglia del panettiere", "Bäckerwecker", "Baker's alarm")}</button>
                  <button onClick={() => { clearWeekPlan(); setPlan(null); }} className="px-3 py-1.5 rounded-lg text-xs font-bold text-muted-foreground active:scale-95">{tri("Non questa settimana", "Nicht diese Woche", "Not this week")}</button>
                </>
                : <button data-testid="bottega-lofaccio" onClick={() => { setWeekPlan(weekly.id); setPlan(getWeekPlan()); }} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold active:scale-95"><Flame className="w-3.5 h-3.5" />{tri("Lo faccio domenica", "Ich mache es am Sonntag", "I'll make it on Sunday")}</button>}
            </div>
          </div>
        )}
        {forno.count === 0 && done === 0 && (
          <button onClick={() => onNav && onNav("percorso")} className="sm:col-span-2 text-left rounded-2xl border border-border bg-background p-3 hover:border-primary active:scale-[0.99] transition-all">
            <p className="text-[11px] text-muted-foreground">{tri("Il prossimo passo", "Der nächste Schritt", "Next step")}</p>
            <p className="font-bold text-foreground text-sm">{tri("Fai il primo dei 5 panini facili: da lì diventi Apprendista.", "Back das erste der 5 einfachen Brötchen: damit wirst du Lehrling.", "Make the first of the 5 easy rolls: that makes you an Apprentice.")}</p>
          </button>
        )}
      </div>
      <p className="px-5 pb-3 text-[10px] text-muted-foreground">
        {tri("Tutto questo vive solo nel tuo telefono.", "All das lebt nur auf deinem Handy.", "All of this lives only on your phone.")}
        {name && <button onClick={forget} className="ml-2 underline">{tri("Dimentica il mio nome", "Meinen Namen vergessen", "Forget my name")}</button>}
      </p>
    </section>
  );
}
