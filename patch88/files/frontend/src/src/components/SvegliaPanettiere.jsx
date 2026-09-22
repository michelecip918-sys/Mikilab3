import { useState, useEffect } from "react";
import { ChevronLeft, AlarmClock, Download, Moon, Copy, Refrigerator } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { api, recipesApi } from "@/lib/api";
import { rLoc } from "@/lib/loc";
import { toast } from "sonner";

// V86 — "La sveglia del panettiere": dici quando vuoi il pane pronto e il sito ti dice A CHE ORA
// fare ogni passo, all'indietro, su TUTTE le fasi del corso (non solo quelle lunghe). Segnala i passi
// che cadono di notte e propone il frigo. Tutto in un .ics con una sveglia per passo. Nessun server
// oltre alla lettura del corso già esistente; il file nasce nel browser.

function pad(n) { return String(n).padStart(2, "0"); }
function icsStamp(d) { return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`; }
function esc(s) { return String(s || "").replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n"); }
function localInput(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`; }

export default function SvegliaPanettiere({ onBack, onOpenRecipe }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const [recipes, setRecipes] = useState([]);
  const [name, setName] = useState("");
  const [when, setWhen] = useState(() => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(13, 0, 0, 0); return localInput(d); });
  const [plan, setPlan] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { let stop = false; recipesApi.list("mikilab").then((r) => { if (!stop && Array.isArray(r)) setRecipes(r.filter((x) => !x.hidden)); }).catch(() => { /* */ }); return () => { stop = true; }; }, []);

  const recipe = recipes.find((r) => [r.name, r.name_de, r.name_en].filter(Boolean).some((x) => String(x).toLowerCase() === name.trim().toLowerCase()));
  const fmt = (d) => d.toLocaleString(lang === "de" ? "de-DE" : lang === "en" ? "en-GB" : "it-IT", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

  const build = async () => {
    if (!recipe) { toast.info(tri("Scegli una ricetta dalla lista.", "Wähle ein Rezept aus der Liste.", "Pick a recipe from the list.")); return; }
    setBusy(true);
    try {
      const r = await api.get(`/recipes/${recipe.id}/course-v2?lang=${lang}`);
      const phases = r.data?.course?.phases || [];
      if (!phases.length) { toast.info(tri("Questa ricetta non ha ancora il corso passo per passo.", "Dieses Rezept hat noch keinen Schritt-für-Schritt-Kurs.", "This recipe doesn't have the step-by-step course yet.")); setBusy(false); return; }
      const durs = phases.map((p) => Number(p.timer_min) || Number(p.time_max) || Number(p.time_min) || 5);
      const finish = new Date(when);
      if (Number.isNaN(finish.getTime())) { toast.error(tri("Data non valida.", "Ungültiges Datum.", "Invalid date.")); setBusy(false); return; }
      let acc = 0; const steps = [];
      for (let i = phases.length - 1; i >= 0; i--) {
        acc += durs[i];
        const start = new Date(finish.getTime() - acc * 60000);
        const h = start.getHours();
        steps.push({ i, start, dur: durs[i], title: phases[i].name || `${tri("Passo", "Schritt", "Step")} ${i + 1}`, night: h >= 23 || h < 6 });
      }
      steps.reverse();
      const total = durs.reduce((a, b) => a + b, 0);
      setPlan({ steps, total, finish, startsPast: steps[0].start.getTime() < Date.now() });
    } catch { toast.error(tri("Non riesco a leggere il corso adesso.", "Ich kann den Kurs gerade nicht lesen.", "I can't read the course right now.")); }
    setBusy(false);
  };

  const ics = () => {
    if (!plan) return;
    try {
      const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2)}@mikilab`;
      const out = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//MikiLab//Sveglia//IT", "CALSCALE:GREGORIAN"];
      plan.steps.forEach((s) => {
        const end = new Date(s.start.getTime() + Math.max(5, Math.min(s.dur, 60)) * 60000);
        out.push("BEGIN:VEVENT", `UID:${uid()}`, `DTSTAMP:${icsStamp(new Date())}`, `DTSTART:${icsStamp(s.start)}`, `DTEND:${icsStamp(end)}`,
          `SUMMARY:${esc(rLoc(recipe, "name", lang))} — ${esc(s.title)}`, `DESCRIPTION:${esc(tri(`Passo ${s.i + 1}, circa ${s.dur} min. mikilab.de`, `Schritt ${s.i + 1}, etwa ${s.dur} Min. mikilab.de`, `Step ${s.i + 1}, about ${s.dur} min. mikilab.de`))}`,
          "BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${esc(s.title)}`, "TRIGGER:-PT5M", "END:VALARM", "END:VEVENT");
      });
      out.push("END:VCALENDAR");
      const url = URL.createObjectURL(new Blob([out.join("\r\n")], { type: "text/calendar;charset=utf-8" }));
      const a = document.createElement("a"); a.href = url; a.download = `sveglia-${(recipe.name || "pane").replace(/\s+/g, "_")}.ics`; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      toast.success(tri("Sveglie create: aprile per metterle nel calendario.", "Wecker erstellt: öffnen, um sie in den Kalender zu legen.", "Alarms created: open the file to add them to your calendar."));
    } catch { toast.error(tri("Non riesco a creare il file.", "Datei konnte nicht erstellt werden.", "Couldn't create the file.")); }
  };
  const copy = async () => {
    if (!plan) return;
    const txt = [rLoc(recipe, "name", lang), ...plan.steps.map((s) => `${fmt(s.start)} · ${s.title}`), `${fmt(plan.finish)} · ${tri("Pronto!", "Fertig!", "Ready!")}`].join("\n");
    try { await navigator.clipboard.writeText(txt); toast.success(tri("Programma copiato.", "Plan kopiert.", "Plan copied.")); } catch { /* */ }
  };

  return (
    <div data-testid="sveglia-page" className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <button data-testid="sveglia-back" onClick={onBack} className="inline-flex items-center gap-1 text-muted-foreground text-sm font-bold"><ChevronLeft className="w-4 h-4" />{tri("Indietro", "Zurück", "Back")}</button>
      <div className="flex items-center gap-2"><AlarmClock className="w-6 h-6 text-primary" /><h1 className="font-display text-2xl font-black text-foreground">{tri("La sveglia del panettiere", "Der Bäckerwecker", "The baker's alarm")}</h1></div>
      <p className="text-sm text-muted-foreground">{tri("Dimmi quando vuoi il pane in tavola e ti dico a che ora fare ogni cosa, all'indietro, passo per passo. Poi te lo metto nel calendario con una sveglia per ogni passo.", "Sag mir, wann das Brot auf dem Tisch stehen soll, und ich sage dir, wann du was tun musst, rückwärts, Schritt für Schritt. Dann kommt alles mit einem Wecker pro Schritt in deinen Kalender.", "Tell me when you want the bread on the table and I'll tell you what time to do each thing, backwards, step by step. Then I'll put it in your calendar with an alarm for every step.")}</p>

      <section className="rounded-2xl border border-border bg-background p-4 space-y-3">
        <label className="block text-sm font-bold text-foreground">{tri("Quale ricetta?", "Welches Rezept?", "Which recipe?")}
          <input data-testid="sveglia-recipe" list="sveglia-recipes" value={name} onChange={(e) => setName(e.target.value)} placeholder={tri("Scrivi e scegli…", "Tippen und wählen…", "Type and pick…")} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground" />
          <datalist id="sveglia-recipes">{recipes.map((r) => <option key={r.id} value={rLoc(r, "name", lang)} />)}</datalist>
        </label>
        <label className="block text-sm font-bold text-foreground">{tri("Lo voglio pronto il", "Fertig sein soll es am", "I want it ready on")}
          <input data-testid="sveglia-when" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground" />
        </label>
        <button data-testid="sveglia-build" onClick={build} disabled={busy} className="w-full px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm active:scale-95 disabled:opacity-50">{busy ? tri("Calcolo…", "Rechne…", "Computing…") : tri("Fammi il programma", "Mach mir den Plan", "Make my plan")}</button>
      </section>

      {plan && (
        <section data-testid="sveglia-plan" className="rounded-2xl border border-primary/40 bg-primary/8 p-4 space-y-3">
          <p className="text-[13px] text-foreground/85">{tri(`In tutto servono circa ${Math.floor(plan.total / 60)} h ${plan.total % 60} min. Si comincia`, `Insgesamt braucht es etwa ${Math.floor(plan.total / 60)} h ${plan.total % 60} min. Es beginnt`, `In total it takes about ${Math.floor(plan.total / 60)} h ${plan.total % 60} min. It starts`)} <span className="font-black text-foreground">{fmt(plan.steps[0].start)}</span>.</p>
          {plan.startsPast && <p className="text-[13px] font-bold text-mattone">{tri("Attenzione: per quest'ora avresti dovuto già cominciare. Sposta l'orario più avanti.", "Achtung: dafür hättest du schon anfangen müssen. Verschiebe die Zeit nach hinten.", "Careful: for this time you should have already started. Move the time later.")}</p>}
          <ol className="space-y-1.5">
            {plan.steps.map((s) => (
              <li key={s.i} className={`flex items-start gap-2 rounded-xl px-3 py-2 ${s.night ? "bg-[#2A2D31] text-[#F6F1E7]" : "bg-background border border-border"}`}>
                <span className="font-mono-data text-[12px] font-bold w-[7.5rem] shrink-0">{fmt(s.start)}</span>
                <span className="text-[13px] flex-1">{s.title} <span className="opacity-60">· {s.dur} min</span></span>
                {s.night && <Moon className="w-4 h-4 text-ambra shrink-0" />}
              </li>
            ))}
            <li className="flex items-start gap-2 rounded-xl px-3 py-2 bg-salvia/15 border border-salvia/40"><span className="font-mono-data text-[12px] font-bold w-[7.5rem] shrink-0">{fmt(plan.finish)}</span><span className="text-[13px] font-bold text-foreground">{tri("Pronto in tavola!", "Fertig auf dem Tisch!", "Ready on the table!")}</span></li>
          </ol>
          {plan.steps.some((s) => s.night) && (
            <p className="text-[12px] text-foreground/85 flex items-start gap-1.5"><Refrigerator className="w-4 h-4 text-primary shrink-0 mt-0.5" />{tri("I passi con la luna cadono di notte. Due strade: sposta l'orario, oppure metti l'impasto in frigo prima di dormire e riprendi la mattina (la lievitazione in frigo va lenta, 8-12 ore vanno bene per quasi tutti i pani). Chiedi a Sitor per la tua ricetta.", "Die Schritte mit dem Mond fallen in die Nacht. Zwei Wege: die Zeit verschieben, oder den Teig vor dem Schlafen in den Kühlschrank und morgens weitermachen (im Kühlschrank geht es langsam, 8-12 Stunden passen für fast alle Brote). Frag Sitor für dein Rezept.", "The steps with a moon fall at night. Two options: move the time, or put the dough in the fridge before bed and continue in the morning (fridge fermentation is slow; 8-12 hours suit almost all breads). Ask Sitor for your recipe.")}</p>
          )}
          <div className="flex gap-2 flex-wrap">
            <button data-testid="sveglia-ics" onClick={ics} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm active:scale-95"><Download className="w-4 h-4" />{tri("Metti le sveglie nel calendario", "Wecker in den Kalender", "Put alarms in my calendar")}</button>
            <button onClick={copy} className="inline-flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-background text-sm font-bold text-foreground active:scale-95"><Copy className="w-4 h-4" />{tri("Copia", "Kopieren", "Copy")}</button>
            {onOpenRecipe && <button onClick={() => onOpenRecipe(recipe.id)} className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm font-bold text-foreground active:scale-95">{tri("Apri la ricetta", "Rezept öffnen", "Open recipe")}</button>}
          </div>
        </section>
      )}
      <p className="text-[11px] text-muted-foreground">{tri("I tempi sono quelli del corso a 24 °C circa: con la cucina più fredda o più calda usa «Il tempo di oggi» nel banco delle prove. Il file del calendario nasce nel tuo telefono.", "Die Zeiten sind die des Kurses bei etwa 24 °C: bei kälterer oder wärmerer Küche nutze «Das Wetter von heute» in der Prüfbank. Die Kalenderdatei entsteht auf deinem Handy.", "Times are the course times at about 24 °C: with a colder or warmer kitchen use «Today's weather» in the test bench. The calendar file is created on your phone.")}</p>
    </div>
  );
}
