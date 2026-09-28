import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, Wand2, CalendarPlus, ClipboardList, Check, Sparkles, RotateCcw, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { recipesApi, api } from "@/lib/api";
import { rLoc } from "@/lib/loc";
import { computeDough, itemLabel, LS, shareOrDownload } from "@/lib/sitorTools";
import { capisci, scegli, pianifica, farinaPer, tempi, TIPI, leggiPiano, salvaPiano, annotaDiario, aCheePunto, TESTO_KEY } from "@/lib/dilloASitor";
import { durata, quandoTesto, traQuanto, passoTesto } from "@/lib/dilloTesti";
import { S as SINTOMI } from "@/components/officina/ProntoSoccorso";
import { appuntiKey, getAppunti } from "@/components/officina/MieiAppunti";
import { DONE_KEY } from "@/lib/piano";
import PhotoDiag from "@/components/PhotoDiag";

// V136 — «DILLO A SITOR». Una frase e Sitor fa il piano del pane: sceglie la ricetta di MikiLab che ci sta nel tempo, fa i conti
// per quelle persone, mette in fila i passaggi con l'ora di ognuno (niente sveglie di notte), la spesa, i promemoria nel calendario.
// Poi ti segue: in Home vedi il prossimo passo; a pane fatto ti chiede com'è venuto e se lo ricorda per la volta dopo.
// La frase si capisce nel telefono (nessun dato inviato); solo «Chiedi a Sitor (IA)» e il parere sulla foto usano l'IA.

const ESEMPI = [
  ["Pizza sabato alle 20 per 6", "Pizza am Samstag um 20 Uhr für 6", "Pizza on Saturday at 8pm for 6"],
  ["Pane per domani sera", "Brot für morgen Abend", "Bread for tomorrow evening"],
  ["Focaccia per domani a pranzo", "Focaccia für morgen Mittag", "Focaccia for lunch tomorrow"],
  ["12 panini per colazione domenica", "12 Brötchen zum Frühstück am Sonntag", "12 rolls for Sunday breakfast"],
  ["Qualcosa di veloce stasera", "Etwas Schnelles für heute Abend", "Something quick for tonight"],
];
const VOTI = [[3, "Perfetto", "Perfekt", "Perfect"], [2, "Buono, ma…", "Gut, aber…", "Good, but…"], [1, "Non come volevo", "Nicht wie gewollt", "Not as I wanted"]];
const SINT = SINTOMI.filter((x) => x.g === "dopo" || x.g === "forno");
const pad2 = (n) => String(n).padStart(2, "0");
const perInput = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
const icsLocal = (d) => `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}T${pad2(d.getHours())}${pad2(d.getMinutes())}00`;
const icsEsc = (s) => String(s || "").replace(/\\/g, "\\\\").replace(/[;,]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");

export default function DilloASitor({ onBack, onNav }) {
  const { t, lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const L = (a) => (lang === "de" ? a[1] : lang === "en" ? a[2] : a[0]);
  const Lo = (o) => (o ? (lang === "de" ? o.de : lang === "en" ? o.en : o.it) : "");
  const [recipes, setRecipes] = useState(null);
  const [extras, setExtras] = useState({});
  const [testo, setTesto] = useState(() => { try { const x = sessionStorage.getItem(TESTO_KEY); if (x) { sessionStorage.removeItem(TESTO_KEY); return x; } } catch { /* */ } return ""; });
  const [intento, setIntento] = useState(null);
  const [aiRes, setAiRes] = useState(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [piano, setPiano] = useState(() => leggiPiano());
  const [now, setNow] = useState(() => Date.now());
  const [voto, setVoto] = useState(0);
  const [sintomi, setSintomi] = useState([]);
  const partito = useRef(false);

  useEffect(() => {
    let ok = true;
    recipesApi.list("mikilab").then((r) => { if (ok) setRecipes(r || []); }).catch(() => { if (ok) setRecipes([]); });
    api.get("/recipe-extras").then((r) => { if (ok) setExtras(r.data || {}); }).catch(() => { /* */ });
    const i = setInterval(() => setNow(Date.now()), 60000);
    return () => { ok = false; clearInterval(i); };
  }, []);
  useEffect(() => { // la frase scritta in Home parte da sola appena ci sono le ricette
    if (!partito.current && recipes && recipes.length && testo.trim() && !piano) { partito.current = true; setIntento(capisci(testo, new Date())); }
  }, [recipes]); // eslint-disable-line react-hooks/exhaustive-deps

  const byId = useMemo(() => Object.fromEntries((recipes || []).map((r) => [r.id, r])), [recipes]);
  const proposte = useMemo(() => (intento && recipes ? scegli(recipes, intento, extras, new Date()) : []), [intento, recipes, extras]);
  const ricetta = piano ? byId[piano.id] || null : null;
  const d = useMemo(() => (piano && ricetta ? computeDough(ricetta, piano.flour) : null), [piano, ricetta]);
  const passiT = useMemo(() => (piano && ricetta ? piano.passi.map((s) => ({ ...s, ...(() => { const x = passoTesto(s.k, s, { T: tempi(ricetta), d, r: ricetta, lang }); return { tt: x.t, dd: x.d }; })() })) : []), [piano, ricetta, d, lang]);
  const spesa = useMemo(() => {
    if (!d) return [];
    const m = new Map();
    const add = (k, label, g) => { if (!(g > 0)) return; const c = m.get(k) || { k, label, g: 0 }; c.g += g; m.set(k, c); };
    d.items.forEach((it) => { if (it.key !== "water") add(it.key === "extra" ? `x:${String(it.name).toLowerCase()}` : it.key, itemLabel(it, t, lang, tri), it.grams); });
    if (d.biga) { add("flour", t("ing_flour"), d.biga.flour); if (d.biga.yeast) add("x:lievito-pre", tri("Lievito di birra fresco", "Frische Hefe", "Fresh yeast"), d.biga.yeast); }
    return [...m.values()];
  }, [d, lang]); // eslint-disable-line react-hooks/exhaustive-deps
  const stato = piano ? aCheePunto(piano, now) : null;

  const pensa = () => { if (!testo.trim()) return; setAiRes(null); setIntento(capisci(testo, new Date())); };
  const cambia = (patch) => setIntento((x) => ({ ...(x || capisci("", new Date())), ...patch }));
  const chiediIA = async () => {
    if (!testo.trim() || aiBusy) return;
    setAiBusy(true); setAiRes(null);
    try { const r = await api.post("/sitor/plan", { prompt: testo.trim().slice(0, 300), lang }); setAiRes(r.data || {}); }
    catch { setAiRes({ ok: false, reply: tri("Sitor adesso non risponde. Riprova più tardi.", "Sitor antwortet gerade nicht. Versuch es später nochmal.", "Sitor isn't answering right now. Try again later.") }); }
    finally { setAiBusy(false); }
  };
  const crea = (r, quando) => {
    const p = pianifica(r, quando || null, new Date());
    const nuovo = { id: r.id, flour: farinaPer(r, intento || {}), persone: (intento && intento.persone) || null, pezzi: (intento && intento.pezzi) || null, pronto: p.pronto, passi: p.passi, notte: p.notte, fatti: [], spesa: {}, creato: Date.now(), testo: testo.trim().slice(0, 200) };
    salvaPiano(nuovo); setPiano(nuovo); setVoto(0); setSintomi([]);
    try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch { /* */ }
    toast.success(tri("Il piano è pronto: ti dico io cosa fare e quando.", "Der Plan steht: ich sage dir, was wann zu tun ist.", "Your plan is ready: I'll tell you what to do and when."));
  };
  const aggiorna = (patch) => { const p = { ...piano, ...patch }; salvaPiano(p); setPiano(p); };
  const segna = (k) => { const f = new Set(piano.fatti || []); if (f.has(k)) f.delete(k); else f.add(k); aggiorna({ fatti: [...f] }); };
  const chiudi = () => { salvaPiano(null); setPiano(null); setIntento(null); setTesto(""); setVoto(0); setSintomi([]); };
  const nuovo = () => { if (window.confirm(tri("Lascio questo piano e ne facciamo un altro?", "Diesen Plan verwerfen und einen neuen machen?", "Drop this plan and make a new one?"))) chiudi(); };
  const apriRicetta = () => {
    window.__mkScala = { id: ricetta.id, flour: piano.flour }; window.__mikilabPendingRecipe = ricetta.id;
    if (onNav) onNav("recipes");
    setTimeout(() => window.dispatchEvent(new CustomEvent("mikilab-open-recipe", { detail: { id: ricetta.id } })), 180);
  };
  const calendario = async () => {
    const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
    const nome = rLoc(ricetta, "name", lang);
    const ev = passiT.map((s) => ["BEGIN:VEVENT", `UID:mikilab-sitor-${piano.creato}-${s.k}@mikilab.de`, `DTSTAMP:${stamp}`, `DTSTART:${icsLocal(new Date(s.at))}`,
      `DTEND:${icsLocal(new Date(s.at + Math.max(10, Math.min(s.min || 10, 60)) * 60000))}`, `SUMMARY:${icsEsc(`${s.tt} · ${nome}`)}`, `DESCRIPTION:${icsEsc(s.dd)}`,
      "BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${icsEsc(s.tt)}`, "TRIGGER:-PT5M", "END:VALARM", "END:VEVENT"].join("\r\n")).join("\r\n");
    const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//MikiLab//Dillo a Sitor//IT", "CALSCALE:GREGORIAN", ev, "END:VCALENDAR", ""].join("\r\n");
    const esito = await shareOrDownload(new Blob([ics], { type: "text/calendar" }), "mikilab-piano-del-pane.ics", nome);
    if (esito === "failed") toast.error(tri("Non riesco a creare il file del calendario.", "Die Kalenderdatei lässt sich nicht erstellen.", "Couldn't create the calendar file."));
    else if (esito !== "cancelled") toast.success(tri("Aprilo con il calendario: ogni passaggio ha il suo promemoria.", "Mit dem Kalender öffnen: jeder Schritt hat seine Erinnerung.", "Open it with your calendar: every step has its reminder."));
  };
  const salvaVoto = () => {
    if (!voto) return;
    annotaDiario(piano.id, { at: Date.now(), voto, sintomi });
    try { const done = new Set(JSON.parse(localStorage.getItem(DONE_KEY) || "[]")); done.add(piano.id); localStorage.setItem(DONE_KEY, JSON.stringify([...done])); window.dispatchEvent(new CustomEvent("mikilab-done-changed")); } catch { /* */ }
    try { const a = getAppunti(piano.id); const oggi = new Date(); oggi.setHours(0, 0, 0, 0); if (!a.made.some((x) => x >= oggi.getTime())) LS.set(appuntiKey(piano.id), { ...a, made: [...a.made, Date.now()].slice(-50), stars: a.stars || (voto === 3 ? 5 : voto === 2 ? 4 : 2) }); } catch { /* */ }
    aggiorna({ voto: { voto, sintomi, at: Date.now() } });
    toast.success(tri("Salvato: la prossima volta te lo ricordo nella ricetta.", "Gespeichert: nächstes Mal erinnere ich dich im Rezept daran.", "Saved: next time I'll remind you in the recipe."));
  };

  const btn = "inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold active:scale-95 transition-all disabled:opacity-50";
  const perChi = piano ? (piano.persone ? tri(`per ${piano.persone} persone`, `für ${piano.persone} Personen`, `for ${piano.persone} people`) : piano.pezzi ? tri(`${piano.pezzi} pezzi`, `${piano.pezzi} Stück`, `${piano.pezzi} pieces`) : tri("dose della ricetta", "Rezeptmenge", "recipe amount")) : "";

  return (
    <div data-testid="dillo-sitor" className="max-w-2xl mx-auto px-1 sm:px-4 py-4 space-y-5">
      <button onClick={onBack} className="no-print inline-flex items-center gap-1 text-muted-foreground text-sm font-bold"><ChevronLeft className="w-4 h-4" />{tri("Indietro", "Zurück", "Back")}</button>
      <div className="flex items-start gap-3">
        <img src="/sitor_official.webp" alt={tri("Sitor, la guida IA di MikiLab", "Sitor, der KI-Guide von MikiLab", "Sitor, MikiLab's AI guide")} className="w-14 h-14 rounded-2xl object-cover border border-border shrink-0" />
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-black text-foreground">{tri("Dillo a Sitor", "Sag es Sitor", "Tell Sitor")}</h1>
          <div className="mk-oro-line mt-1.5 mb-1.5" />
          <p className="text-[14px] text-foreground/85 leading-relaxed">{tri(
            "Dimmi che pane vuoi e per quando. Io scelgo la ricetta, faccio i conti e ti dico cosa fare, ora per ora, fino al forno.",
            "Sag mir, welches Brot du willst und für wann. Ich wähle das Rezept, rechne alles aus und sage dir Stunde für Stunde, was zu tun ist, bis zum Ofen.",
            "Tell me what bread you want and for when. I pick the recipe, do the maths and tell you what to do, hour by hour, all the way to the oven.")}</p>
        </div>
      </div>

      {piano && recipes && !ricetta && (
        <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
          <p className="text-[14px] text-foreground">{tri("La ricetta di questo piano non c'è più nel ricettario.", "Das Rezept dieses Plans ist nicht mehr im Rezeptbuch.", "This plan's recipe is no longer in the recipe book.")}</p>
          <button onClick={chiudi} className={`${btn} bg-primary text-primary-foreground`}><RotateCcw className="w-4 h-4" />{tri("Fai un altro piano", "Neuen Plan machen", "Make a new plan")}</button>
        </div>
      )}

      {piano && ricetta && stato && (
        <section data-testid="dillo-piano" className="space-y-4">
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            {ricetta.image_url && <img src={ricetta.image_url} alt="" className="w-full h-40 object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />}
            <div className="p-4">
              <p className="text-[12px] font-bold text-primary">{tri("Il tuo piano", "Dein Plan", "Your plan")}</p>
              <h2 className="font-display text-xl font-bold text-foreground leading-snug">{rLoc(ricetta, "name", lang)}</h2>
              <p className="text-[13px] text-muted-foreground mt-0.5">{perChi} · {tri(`${piano.flour} g di farina`, `${piano.flour} g Mehl`, `${piano.flour} g flour`)} · {tri("pronto", "fertig", "ready")} {quandoTesto(piano.pronto, lang, now)}</p>
              {piano.notte && <p className="text-[12.5px] text-mattone mt-1.5">{tri("Un passaggio cade di notte: se vuoi, fai un altro piano con un'ora diversa.", "Ein Schritt fällt in die Nacht: wenn du willst, mach einen neuen Plan mit einer anderen Uhrzeit.", "One step falls at night: if you like, make a new plan with a different time.")}</p>}
            </div>
          </div>

          {!stato.finito && stato.prossimo && (() => { const sp = passiT.find((x) => x.k === stato.prossimo.k); return sp ? (
            <div data-testid="dillo-adesso" className="rounded-2xl border-2 border-primary/50 bg-primary/5 p-4">
              <p className="text-[12.5px] font-bold text-primary">{traQuanto(sp.at, lang, now) === traQuanto(Date.now(), lang, Date.now()) ? tri("Adesso tocca a te", "Jetzt bist du dran", "Your turn now") : tri("Il prossimo passo", "Der nächste Schritt", "The next step")}</p>
              <p className="font-display text-lg font-bold text-foreground mt-0.5">{sp.tt}</p>
              <p className="text-[13px] text-foreground">{quandoTesto(sp.at, lang, now)} · <b>{traQuanto(sp.at, lang, now)}</b></p>
              <p className="text-[13px] text-foreground/85 mt-1 leading-snug">{sp.dd}</p>
              <button data-testid="dillo-fatto" onClick={() => segna(sp.k)} className={`${btn} mt-3 bg-primary text-primary-foreground`}><Check className="w-4 h-4" />{tri("Fatto", "Erledigt", "Done")}</button>
            </div>) : null; })()}

          {stato.finito && (
            <div data-testid="dillo-voto" className="rounded-2xl border-2 border-primary/50 bg-card p-4 space-y-3">
              <p className="font-display text-lg font-bold text-foreground">{tri("Com'è venuto?", "Wie ist es geworden?", "How did it turn out?")}</p>
              {!piano.voto ? (<>
                <div className="grid grid-cols-3 gap-2">{VOTI.map(([v, ...n]) => (
                  <button key={v} data-testid={`dillo-voto-${v}`} aria-pressed={voto === v} onClick={() => { setVoto(v); if (v === 3) setSintomi([]); }} className={`px-2 py-2.5 rounded-xl border text-[13px] font-bold ${voto === v ? "bg-primary text-primary-foreground border-primary" : "bg-background text-foreground border-border"}`}>{L(n)}</button>))}
                </div>
                {voto > 0 && voto < 3 && (
                  <div>
                    <p className="text-[12.5px] text-muted-foreground mb-1.5">{tri("Cosa non ti ha convinto? Tocca quello che vedi.", "Was hat dich nicht überzeugt? Tippe, was du siehst.", "What wasn't right? Tap what you see.")}</p>
                    <div className="flex flex-wrap gap-1.5">{SINT.map((x) => (
                      <button key={x.k} aria-pressed={sintomi.includes(x.k)} onClick={() => setSintomi((s) => (s.includes(x.k) ? s.filter((y) => y !== x.k) : [...s, x.k]))} className={`text-[12.5px] px-3 py-1.5 rounded-full border ${sintomi.includes(x.k) ? "bg-primary text-primary-foreground border-primary" : "bg-background text-foreground border-border"}`}>{Lo(x.t)}</button>))}
                    </div>
                  </div>
                )}
                {voto > 0 && <button data-testid="dillo-salva-voto" onClick={salvaVoto} className={`${btn} bg-primary text-primary-foreground`}><Check className="w-4 h-4" />{tri("Salva: Sitor se lo ricorda", "Speichern: Sitor merkt es sich", "Save: Sitor will remember")}</button>}
              </>) : (<>
                <p className="text-[13.5px] text-foreground leading-snug">{piano.voto.voto === 3 ? tri("Bravo. Quando riapri questa ricetta te lo ricordo: rifalla così.", "Bravo. Wenn du das Rezept wieder öffnest, erinnere ich dich daran: genau so wieder.", "Well done. When you open this recipe again I'll remind you: make it just like this.") : tri("Ecco cosa cambiare la prossima volta. Te lo ricordo quando riapri la ricetta.", "Das änderst du beim nächsten Mal. Ich erinnere dich, wenn du das Rezept wieder öffnest.", "Here's what to change next time. I'll remind you when you open the recipe again.")}</p>
                {(piano.voto.sintomi || []).map((k) => { const x = SINT.find((y) => y.k === k); return x ? <p key={k} className="text-[13px] text-foreground/90 leading-snug"><b>{Lo(x.t)}:</b> {Lo(x.next)}</p> : null; })}
                <button data-testid="dillo-chiudi" onClick={chiudi} className={`${btn} border border-border bg-background text-foreground`}><RotateCcw className="w-4 h-4" />{tri("Chiudi il piano", "Plan schließen", "Close the plan")}</button>
              </>)}
              <div className="pt-2 border-t border-border/60">
                <p className="text-[12px] text-muted-foreground mb-1.5">{tri("Vuoi un parere sulla foto del tuo pane? Sitor (IA) guarda crosta e mollica.", "Willst du eine Meinung zum Foto deines Brotes? Sitor (KI) schaut Kruste und Krume an.", "Want an opinion on a photo of your bread? Sitor (AI) looks at crust and crumb.")}</p>
                <PhotoDiag level="casa" compact />
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="font-bold text-foreground">{tri("Tutti i passaggi", "Alle Schritte", "All the steps")}</p>
            <ol className="mt-2.5 space-y-3">
              {passiT.map((s) => { const fatto = (piano.fatti || []).includes(s.k); const passato = s.k !== "pronto" && s.at + (s.min || 0) * 60000 < now; return (
                <li key={s.k} data-testid={`dillo-passo-${s.k}`} className={`flex gap-3 ${fatto || passato ? "opacity-60" : ""}`}>
                  {s.k !== "pronto" ? <button aria-label={tri("Segna come fatto", "Als erledigt markieren", "Mark as done")} aria-pressed={fatto} onClick={() => segna(s.k)} className={`mt-0.5 w-6 h-6 rounded-full border-2 shrink-0 flex items-center justify-center ${fatto ? "bg-primary border-primary text-primary-foreground" : "border-border"}`}>{fatto && <Check className="w-3.5 h-3.5" />}</button> : <span className="mt-0.5 w-6 h-6 shrink-0 rounded-full bg-accent/30" aria-hidden />}
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] text-muted-foreground">{quandoTesto(s.at, lang, now)}{s.min >= 60 && s.k !== "accendi" ? ` · ${durata(s.min, lang)}` : ""}</p>
                    <p className="text-[14px] font-bold text-foreground leading-snug">{s.tt}</p>
                    <p className="text-[12.5px] text-foreground/80 leading-snug">{s.dd}</p>
                  </div>
                </li>); })}
            </ol>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="font-bold text-foreground flex items-center gap-1.5"><ClipboardList className="w-4 h-4 text-primary" />{tri("La spesa", "Der Einkauf", "Shopping")}</p>
            <p className="text-[12px] text-muted-foreground">{tri("Spunta quello che hai già in casa. L'acqua non c'è: quella c'è sempre.", "Hake ab, was du schon zu Hause hast. Wasser fehlt: das gibt es immer.", "Tick what you already have. Water isn't listed: you always have it.")}</p>
            <ul className="mt-2 divide-y divide-border">
              {spesa.map((it) => (
                <li key={it.k}><label className="flex items-center gap-2.5 py-2 text-[13.5px] text-foreground">
                  <input type="checkbox" checked={!!(piano.spesa || {})[it.k]} onChange={(e) => aggiorna({ spesa: { ...(piano.spesa || {}), [it.k]: e.target.checked } })} className="w-4 h-4" />
                  <span className={`flex-1 ${(piano.spesa || {})[it.k] ? "line-through text-muted-foreground" : ""}`}>{it.label}</span>
                  <span className="font-mono-data text-foreground">{Math.round(it.g)} g</span>
                </label></li>))}
            </ul>
          </div>

          <div className="flex flex-wrap gap-2">
            <button data-testid="dillo-calendario" onClick={calendario} className={`${btn} bg-primary text-primary-foreground`}><CalendarPlus className="w-4 h-4" />{tri("Promemoria nel calendario", "Erinnerungen im Kalender", "Reminders in your calendar")}</button>
            <button data-testid="dillo-apri-ricetta" onClick={apriRicetta} className={`${btn} border border-border bg-background text-foreground`}><ChevronRight className="w-4 h-4" />{tri("Apri la ricetta con queste dosi", "Rezept mit diesen Mengen öffnen", "Open the recipe with these amounts")}</button>
            <button data-testid="dillo-nuovo" onClick={nuovo} className={`${btn} border border-border bg-background text-foreground`}><RotateCcw className="w-4 h-4" />{tri("Fai un altro piano", "Neuen Plan machen", "Make a new plan")}</button>
          </div>
          <p className="text-[11.5px] text-muted-foreground">{tri("Il piano resta nel tuo telefono. Le dosi di Michele non cambiano: cambia solo quanta farina usi.", "Der Plan bleibt auf deinem Handy. Micheles Mengen ändern sich nicht: nur wie viel Mehl du nimmst.", "The plan stays on your phone. Michele's amounts don't change: only how much flour you use.")}</p>
        </section>
      )}

      {!piano && (<>
        <section className="rounded-2xl border-2 border-primary/40 bg-card p-4 space-y-3">
          <label htmlFor="dillo-testo" className="block text-[13.5px] font-bold text-foreground">{tri("Che pane vuoi, e per quando?", "Welches Brot willst du, und für wann?", "What bread do you want, and for when?")}</label>
          <textarea id="dillo-testo" data-testid="dillo-testo" rows={2} maxLength={200} value={testo} onChange={(e) => setTesto(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); pensa(); } }} placeholder={L(ESEMPI[0])}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-[15px] text-foreground outline-none focus:border-primary" />
          <div className="flex flex-wrap gap-1.5">
            {ESEMPI.map((e) => <button key={e[0]} onClick={() => { const x = L(e); setTesto(x); setAiRes(null); setIntento(capisci(x, new Date())); }} className="text-[12.5px] px-3 py-1.5 rounded-full border border-border bg-background text-foreground active:scale-95">{L(e)}</button>)}
          </div>
          <button data-testid="dillo-pensa" onClick={pensa} disabled={!testo.trim() || !recipes} className={`${btn} w-full bg-primary text-primary-foreground`}>{recipes ? <Wand2 className="w-4 h-4" /> : <Loader2 className="w-4 h-4 animate-spin" />}{tri("Pensaci tu, Sitor", "Mach du das, Sitor", "Over to you, Sitor")}</button>
          <p className="text-[11.5px] text-muted-foreground">{tri("Puoi anche dettare con il microfono della tastiera. Sitor capisce la frase nel tuo telefono: niente viene inviato.", "Du kannst auch mit dem Mikrofon der Tastatur diktieren. Sitor versteht den Satz auf deinem Handy: nichts wird gesendet.", "You can also dictate with your keyboard's microphone. Sitor understands the sentence on your phone: nothing is sent.")}</p>
        </section>

        {intento && (
          <section data-testid="dillo-capito" className="rounded-2xl border border-border bg-card p-4 space-y-2.5">
            <p className="text-[13px] font-bold text-foreground flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-primary" />{tri("Ho capito così (puoi cambiare)", "So habe ich es verstanden (du kannst es ändern)", "Here's what I understood (you can change it)")}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <label className="text-[12px] text-muted-foreground">{tri("Cosa", "Was", "What")}
                <select data-testid="dillo-tipo" value={intento.tipo || ""} onChange={(e) => cambia({ tipo: e.target.value || null })} className="mt-0.5 w-full rounded-lg border border-border bg-background px-2 py-2 text-[13.5px] text-foreground">
                  <option value="">{tri("Qualsiasi", "Egal", "Anything")}</option>
                  {TIPI.map((x) => <option key={x.k} value={x.k}>{Lo(x.n)}</option>)}
                </select></label>
              <label className="text-[12px] text-muted-foreground">{tri("Pronto per", "Fertig für", "Ready for")}
                <input data-testid="dillo-quando" type="datetime-local" value={intento.quando ? perInput(intento.quando) : ""} onChange={(e) => { const v = e.target.value; cambia({ quando: v ? new Date(v) : null, oreMax: null }); }} className="mt-0.5 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-[13.5px] text-foreground" />
                {!intento.quando && <span className="block text-[11.5px] mt-0.5">{intento.oreMax ? tri(`entro ${intento.oreMax} ore`, `innerhalb von ${intento.oreMax} Stunden`, `within ${intento.oreMax} hours`) : tri("prima possibile", "so bald wie möglich", "as soon as possible")}</span>}</label>
              <label className="text-[12px] text-muted-foreground">{tri("Persone", "Personen", "People")}
                <input data-testid="dillo-persone" type="number" min="0" max="40" value={intento.persone || ""} placeholder="–" onChange={(e) => cambia({ persone: Math.max(0, Math.min(40, parseInt(e.target.value, 10) || 0)) || null, pezzi: null })} className="mt-0.5 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-[13.5px] text-foreground" /></label>
            </div>
          </section>
        )}

        {intento && recipes && proposte.length > 0 && (
          <section data-testid="dillo-proposte" className="space-y-2.5">
            <p className="text-[13.5px] font-bold text-foreground">{proposte.some((x) => x.ciSta) ? tri("Ti propongo", "Mein Vorschlag", "My suggestion") : tri("Per quell'ora non ce la fa nessuna di queste: te le faccio il prima possibile.", "Für diese Uhrzeit reicht keins davon: ich plane sie so früh wie möglich.", "None of these can be ready by then: I'll plan them as soon as possible.")}</p>
            {proposte.map(({ r, T, ciSta }) => { const x = extras[r.id] || {}; const p = pianifica(r, ciSta ? intento.quando : null, new Date(now)); return (
              <div key={r.id} data-testid={`dillo-proposta-${r.id}`} className="rounded-2xl border border-border bg-card overflow-hidden flex">
                <div className="w-24 sm:w-28 shrink-0 bg-muted">{r.image_url && <img src={r.image_url} alt="" loading="lazy" className="w-full h-full object-cover" />}</div>
                <div className="p-3 flex-1 min-w-0 space-y-1">
                  <p className="font-bold text-foreground text-[14.5px] leading-snug">{rLoc(r, "name", lang)}</p>
                  <p className="text-[12px] text-muted-foreground">{x.status === "tested" ? tri("Provata da Michele", "Von Michele erprobt", "Tested by Michele") : x.status === "sitor_draft" ? tri("Bozza di Sitor", "Entwurf von Sitor", "Sitor's draft") : tri("Controllata", "Geprüft", "Checked")} · {durata(T.total * 60, lang)} {tri("in tutto", "insgesamt", "in total")}</p>
                  <p className={`text-[12.5px] ${ciSta ? "text-foreground" : "text-mattone"}`}>{ciSta ? tri(`Si comincia ${quandoTesto(p.inizio, lang, now)}`, `Start: ${quandoTesto(p.inizio, lang, now)}`, `You start ${quandoTesto(p.inizio, lang, now)}`) : tri(`Pronta ${quandoTesto(p.pronto, lang, now)}`, `Fertig: ${quandoTesto(p.pronto, lang, now)}`, `Ready ${quandoTesto(p.pronto, lang, now)}`)}</p>
                  <button data-testid={`dillo-scegli-${r.id}`} onClick={() => crea(r, ciSta ? intento.quando : null)} className="mt-1 inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-[13px] font-bold active:scale-95">{tri("Scegli questa", "Diese nehmen", "Choose this")}<ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>); })}
          </section>
        )}

        {intento && recipes && (
          <section className="rounded-2xl border border-border bg-card p-4 space-y-2">
            <p className="text-[13px] text-foreground/90">{proposte.length ? tri("Non è quello che volevi? Chiedilo a Sitor con l'intelligenza artificiale.", "Nicht das, was du wolltest? Frag Sitor mit künstlicher Intelligenz.", "Not what you wanted? Ask Sitor with artificial intelligence.") : tri("Non ho trovato una ricetta per questa frase. Scegli qui sopra cosa vuoi fare, oppure chiedilo a Sitor con l'intelligenza artificiale.", "Ich habe kein Rezept für diesen Satz gefunden. Wähle oben, was du machen willst, oder frag Sitor mit künstlicher Intelligenz.", "I didn't find a recipe for this sentence. Choose above what you want to make, or ask Sitor with artificial intelligence.")}</p>
            <button data-testid="dillo-ia" onClick={chiediIA} disabled={aiBusy || !testo.trim()} className={`${btn} border border-border bg-background text-foreground`}>{aiBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}{tri("Chiedi a Sitor (IA)", "Frag Sitor (KI)", "Ask Sitor (AI)")}</button>
            {aiRes && !aiRes.ok && <p className="text-[12.5px] text-muted-foreground">{aiRes.reply || tri("Oggi Sitor riposa: riprova domani.", "Heute ruht Sitor: versuch es morgen.", "Sitor is resting today: try tomorrow.")}</p>}
            {aiRes && aiRes.ok && (aiRes.recipes || []).filter((p) => byId[p.id]).map((p) => (
              <div key={p.id} className="flex items-center gap-2 rounded-xl border border-border p-2.5">
                <div className="flex-1 min-w-0"><p className="text-[13.5px] font-bold text-foreground">{rLoc(byId[p.id], "name", lang)}</p>{p.reason && <p className="text-[12px] text-muted-foreground">{p.reason}</p>}</div>
                <button onClick={() => crea(byId[p.id], intento.quando)} className="shrink-0 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-[12.5px] font-bold">{tri("Scegli", "Wählen", "Choose")}</button>
              </div>))}
          </section>
        )}
      </>)}
    </div>
  );
}
