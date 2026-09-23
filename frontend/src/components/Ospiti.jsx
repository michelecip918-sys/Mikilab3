import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, Users, Clock, Calendar, Copy, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { recipesApi } from "@/lib/api";
import { rLoc } from "@/lib/loc";
import { computeDough, fermentationHours, recipeKind, itemLabel, LS, num, fmt1, fmtTime, fmtDate, downloadBlob } from "@/lib/sitorTools";

// V95 — STASERA HO OSPITI. Il maggiordomo di MikiLab: dici l'occasione, quanti siete e a che ora; ti propone i pani
// del sito che ci stanno nel tempo che hai, li scala a persona, ti dice a che ora iniziare ognuno e ti fa la spesa.

const KEY = "mikilab_ospiti";
const OCC = [
  { k: "colazione", it: "Colazione", de: "Frühstück", en: "Breakfast", g: 90, kinds: ["dolce", "panini", "pane"], n: 2 },
  { k: "aperitivo", it: "Aperitivo", de: "Aperitif", en: "Aperitif", g: 100, kinds: ["focaccia", "pizza", "panini"], n: 2 },
  { k: "cena", it: "Cena", de: "Abendessen", en: "Dinner", g: 120, kinds: ["pane", "focaccia", "panini"], n: 2 },
  { k: "brunch", it: "Brunch della domenica", de: "Sonntagsbrunch", en: "Sunday brunch", g: 150, kinds: ["pane", "dolce", "panini", "focaccia"], n: 3 },
  { k: "festa", it: "Festa grande", de: "Großes Fest", en: "Big party", g: 130, kinds: ["focaccia", "pizza", "pane", "panini"], n: 3 },
];
const TABLE = {
  focaccia: { it: "burrata, pomodorini, mortadella, un filo d'olio", de: "Burrata, Kirschtomaten, Mortadella, ein Faden Öl", en: "burrata, cherry tomatoes, mortadella, a thread of oil" },
  pizza: { it: "condimenti semplici: pomodoro, mozzarella, basilico", de: "einfache Beläge: Tomate, Mozzarella, Basilikum", en: "simple toppings: tomato, mozzarella, basil" },
  pane: { it: "olio buono, sale, pomodoro; formaggi e salumi", de: "gutes Öl, Salz, Tomate; Käse und Wurst", en: "good oil, salt, tomato; cheese and cured meats" },
  panini: { it: "da farcire: formaggio fresco, verdure grigliate", de: "zum Füllen: Frischkäse, gegrilltes Gemüse", en: "to fill: fresh cheese, grilled vegetables" },
  dolce: { it: "confetture, miele, burro, una tazza di latte", de: "Konfitüre, Honig, Butter, eine Tasse Milch", en: "jams, honey, butter, a cup of milk" },
  laugen: { it: "burro salato, senape dolce, Obatzda", de: "gesalzene Butter, süßer Senf, Obatzda", en: "salted butter, sweet mustard, Obatzda" },
  panettone: { it: "crema al mascarpone, spumante dolce", de: "Mascarponecreme, süßer Sekt", en: "mascarpone cream, sweet sparkling wine" },
};
const usable = (r) => r && !r.locked && num(r.flour_grams) > 0 && !/migliorator|backmittel|improver/i.test(r.name || "");
const pad = (n) => String(n).padStart(2, "0");
const localInput = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
const icsLocal = (d) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;

// Ore totali dalla prima mossa al pane pronto in tavola (a 25 °C).
function leadHours(r) {
  const F = fermentationHours(r); const k = recipeKind(r);
  const bake = (num(r.bake_minutes) || 30) / 60; const cool = k === "panettone" ? 10 : k === "pizza" || k === "focaccia" ? 0.25 : 1;
  return { total: F.totalMax + bake + cool + 0.75, F, bake, cool };
}

export default function Ospiti({ onBack }) {
  const { t, lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const L = (o) => (lang === "de" ? o.de : lang === "en" ? o.en : o.it);
  const [recipes, setRecipes] = useState([]);
  const [st, setSt] = useState(() => LS.get(KEY, { occ: "cena", people: 6, when: "", picks: [] }));
  const set = (patch) => { const n = { ...st, ...patch }; setSt(n); LS.set(KEY, n); };
  useEffect(() => { let ok = true; recipesApi.list("mikilab").then((d) => { if (ok) setRecipes((d || []).filter(usable)); }).catch(() => {}); return () => { ok = false; }; }, []);
  const occ = OCC.find((o) => o.k === st.occ) || OCC[2];
  const when = useMemo(() => { const d = st.when ? new Date(st.when) : null; if (d && !isNaN(d)) return d; const x = new Date(); x.setDate(x.getDate() + 1); x.setHours(20, 0, 0, 0); return x; }, [st.when]);
  const hoursLeft = (when.getTime() - Date.now()) / 3600000;

  // candidati: per tipo dell'occasione, che ci stanno nel tempo, i più "lunghi" prima (più gusto)
  const suggested = useMemo(() => {
    const out = [];
    for (const kind of occ.kinds) {
      const c = recipes.filter((r) => recipeKind(r) === kind).map((r) => ({ r, lh: leadHours(r) })).filter((x) => x.lh.total <= hoursLeft).sort((a, b) => b.lh.F.totalMax - a.lh.F.totalMax);
      if (c[0]) out.push(c[0].r.id);
      if (out.length >= occ.n) break;
    }
    return out;
  }, [recipes, occ, hoursLeft]);
  const picks = (st.picks && st.picks.length ? st.picks : suggested).filter((id) => recipes.some((r) => r.id === id)).slice(0, 4);
  const totalG = num(st.people) * occ.g;
  const perBread = picks.length ? totalG / picks.length : 0;

  const plan = picks.map((id) => {
    const r = recipes.find((x) => x.id === id);
    const base = computeDough(r, r.flour_grams);
    const flour = perBread / ((base.total / (base.target || 1)) || 1);
    const d = computeDough(r, flour);
    const lh = leadHours(r);
    const start = new Date(when.getTime() - lh.total * 3600000);
    const ovenOn = new Date(when.getTime() - (lh.cool + lh.bake + 0.5) * 3600000);
    return { r, d, lh, start, ovenOn, kind: recipeKind(r) };
  });
  // spesa: totali per ingrediente
  const shop = useMemo(() => {
    const m = new Map();
    const add = (k, label, g) => { if (!(g > 0)) return; const c = m.get(k) || { label, g: 0 }; c.g += g; m.set(k, c); };
    plan.forEach(({ d }) => { d.items.forEach((it) => add(it.key === "extra" ? `x:${String(it.name).toLowerCase()}` : it.key, itemLabel(it, t, lang, tri), it.grams)); if (d.biga) { add("flour", t("ing_flour"), d.biga.flour); add("water", t("ing_water"), d.biga.water); add("x:lievito", tri("Lievito di birra", "Hefe", "Yeast"), d.biga.yeast); } });
    return [...m.values()].filter((v) => !/acqua|wasser|water/i.test(v.label));
  }, [plan, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  const swap = (i, id) => { const p = [...picks]; p[i] = id; set({ picks: p }); };
  const remove = (i) => set({ picks: picks.filter((_, k) => k !== i) });
  const addOne = (id) => { if (id && !picks.includes(id) && picks.length < 4) set({ picks: [...picks, id] }); };
  const openRecipe = (id) => { window.dispatchEvent(new CustomEvent("mikilab-nav", { detail: { route: "recipes" } })); setTimeout(() => window.dispatchEvent(new CustomEvent("mikilab-open-recipe", { detail: { id } })), 200); };
  const asText = () => `${L(occ)} · ${st.people} ${tri("persone", "Personen", "people")} · ${fmtDate(when, lang)} ${fmtTime(when, lang)}\n` + plan.map(({ r, d, start }) => `• ${rLoc(r, "name", lang)}: ${Math.round(d.total)} g, ${tri("inizia", "Start", "start")} ${fmtDate(start, lang)} ${fmtTime(start, lang)}`).join("\n") + `\n\n${tri("Spesa", "Einkauf", "Shopping")}:\n` + shop.map((v) => `  ${v.label}: ${Math.round(v.g)} g`).join("\n") + "\n— mikilab.de";
  const ics = () => {
    const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
    const ev = plan.map(({ r, start }, i) => `BEGIN:VEVENT\nUID:mikilab-ospiti-${Date.now()}-${i}@mikilab.de\nDTSTAMP:${stamp}\nDTSTART:${icsLocal(start)}\nDTEND:${icsLocal(new Date(start.getTime() + 30 * 60000))}\nSUMMARY:${tri("Inizia", "Start", "Start")}: ${rLoc(r, "name", lang)} (${L(occ)})\nBEGIN:VALARM\nTRIGGER:-PT15M\nACTION:DISPLAY\nDESCRIPTION:MikiLab\nEND:VALARM\nEND:VEVENT`).join("\n");
    if (!downloadBlob(new Blob([`BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//MikiLab//Ospiti//IT\n${ev}\nEND:VCALENDAR\n`], { type: "text/calendar" }), "mikilab-ospiti.ics")) toast.error(tri("Non riesco a creare il file.", "Datei kann nicht erstellt werden.", "Can't create the file."));
  };

  return (
    <div data-testid="ospiti-page" className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <button data-testid="ospiti-back" onClick={onBack} className="inline-flex items-center gap-1 text-muted-foreground text-sm font-bold"><ChevronLeft className="w-4 h-4" />{tri("Indietro", "Zurück", "Back")}</button>
      <div>
        <p className="font-mono-data text-[10px] tracking-[0.25em] uppercase text-primary flex items-center gap-1.5"><Users className="w-3 h-3" />{tri("Il maggiordomo di MikiLab", "Der Butler von MikiLab", "MikiLab's butler")}</p>
        <h1 className="font-display text-2xl font-black text-foreground">{tri("Stasera ho ospiti", "Heute Abend kommen Gäste", "Guests tonight")}</h1>
        <div className="mk-oro-line mt-2 mb-1" />
        <p className="text-sm text-muted-foreground mt-1">{tri("Dimmi l'occasione, quanti siete e a che ora. Ti propongo i pani giusti, li scalo a persona, ti dico quando iniziare e ti scrivo la spesa.", "Sag mir den Anlass, wie viele ihr seid und um wie viel Uhr. Ich schlage die passenden Brote vor, rechne sie pro Person, sage dir, wann du anfängst, und schreibe den Einkauf.", "Tell me the occasion, how many you are and at what time. I'll suggest the right breads, scale them per person, tell you when to start and write the shopping list.")}</p>
      </div>
      <div className="rounded-2xl border border-border bg-card p-3 space-y-2.5">
        <div className="flex flex-wrap gap-1.5">{OCC.map((o) => <button key={o.k} data-testid={`osp-occ-${o.k}`} onClick={() => set({ occ: o.k, picks: [] })} className={`text-[12px] font-semibold px-2.5 py-1.5 rounded-full border active:scale-95 ${st.occ === o.k ? "bg-primary text-white border-primary" : "bg-background text-muted-foreground border-border"}`}>{L(o)}</button>)}</div>
        <div className="grid grid-cols-2 gap-2">
          <label className="block text-[12.5px] text-muted-foreground">{tri("Quanti siete", "Wie viele", "How many")}<input data-testid="osp-people" type="number" min="1" max="60" value={st.people} onChange={(e) => set({ people: e.target.value })} className="mt-0.5 w-full font-mono-data font-bold text-foreground bg-background border border-border rounded-md px-2 py-1.5 outline-none" /></label>
          <label className="block text-[12.5px] text-muted-foreground">{tri("In tavola alle", "Auf dem Tisch um", "On the table at")}<input data-testid="osp-when" type="datetime-local" value={st.when || localInput(when)} onChange={(e) => set({ when: e.target.value, picks: [] })} className="mt-0.5 w-full font-mono-data font-bold text-foreground bg-background border border-border rounded-md px-2 py-1.5 outline-none" /></label>
        </div>
        <p className="text-[12px] text-muted-foreground">{tri(`Circa ${occ.g} g di pane a persona per ${L(occ).toLowerCase()}: ${Math.round(totalG)} g in tutto. Hai ${fmt1(Math.max(0, hoursLeft))} ore.`, `Etwa ${occ.g} g Brot pro Person für ${L(occ)}: ${Math.round(totalG)} g insgesamt. Du hast ${fmt1(Math.max(0, hoursLeft))} Stunden.`, `About ${occ.g} g of bread per person for ${L(occ).toLowerCase()}: ${Math.round(totalG)} g in total. You have ${fmt1(Math.max(0, hoursLeft))} hours.`)}</p>
      </div>
      {recipes.length === 0 ? <p className="text-[12.5px] text-muted-foreground">{tri("Carico le ricette…", "Lade Rezepte…", "Loading recipes…")}</p> : plan.length === 0 ? (
        <p className="text-[13px] text-muted-foreground rounded-xl border border-border bg-card p-3">{tri("Con questo tempo non ci sta nessun pane del sito: sposta l'ora, o scegli tu una ricetta qui sotto.", "In dieser Zeit passt kein Brot der Seite: verschiebe die Uhrzeit oder wähle unten selbst ein Rezept.", "No bread on the site fits this time: move the hour, or pick a recipe yourself below.")}</p>
      ) : plan.map(({ r, d, lh, start, ovenOn, kind }, i) => (
        <div key={r.id} data-testid={`osp-bread-${i}`} className="rounded-2xl border border-border bg-card p-3 space-y-1.5">
          <div className="flex items-center gap-2">
            <select data-testid={`osp-swap-${i}`} value={r.id} onChange={(e) => swap(i, e.target.value)} className="flex-1 text-[13px] font-bold bg-background text-foreground border border-border rounded-lg px-2 py-1.5 outline-none">
              {recipes.map((x) => <option key={x.id} value={x.id}>{rLoc(x, "name", lang)}{leadHours(x).total > hoursLeft ? tri(" (non ci sta nel tempo)", " (passt nicht in die Zeit)", " (doesn't fit the time)") : ""}</option>)}
            </select>
            <button data-testid={`osp-open-${i}`} onClick={() => openRecipe(r.id)} className="p-2 rounded-lg border border-border bg-background text-primary active:scale-95"><ChevronRight className="w-4 h-4" /></button>
            <button data-testid={`osp-remove-${i}`} onClick={() => remove(i)} className="text-[11px] text-muted-foreground px-1">✕</button>
          </div>
          <p className="text-[12.5px] text-foreground"><b className="font-mono-data">{Math.round(d.total)} g</b> {tri("di impasto", "Teig", "of dough")} · {Math.round(d.totalFlour)} g {t("ing_flour").toLowerCase()} · {lh.F.lm ? tri("lievito madre", "Sauerteig", "sourdough") : lh.F.hasPre ? tri("con prefermento", "mit Vorteig", "with preferment") : tri("diretto", "direkt", "direct")} · ≈ {fmt1(lh.total)} h {tri("in tutto", "insgesamt", "in total")}</p>
          <p className="text-[12.5px] text-foreground flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-primary" />{tri("Inizia", "Start", "Start")}: <b className="font-mono-data">{fmtDate(start, lang)} {fmtTime(start, lang)}</b> · {tri("forno acceso", "Ofen an", "oven on")} {fmtTime(ovenOn, lang)} · {tri("in tavola", "auf dem Tisch", "on the table")} {fmtTime(when, lang)}</p>
          {TABLE[kind] && <p className="text-[12px] text-salvia">{tri("A tavola", "Dazu", "With it")}: {L(TABLE[kind])}</p>}
        </div>
      ))}
      {recipes.length > 0 && picks.length < 4 && (
        <select data-testid="osp-add" value="" onChange={(e) => addOne(e.target.value)} className="w-full text-[12.5px] font-semibold bg-card text-foreground border border-border rounded-lg px-2 py-2 outline-none">
          <option value="">{tri("+ Aggiungi un altro pane…", "+ Noch ein Brot…", "+ Add another bread…")}</option>
          {recipes.filter((x) => !picks.includes(x.id)).map((x) => <option key={x.id} value={x.id}>{rLoc(x, "name", lang)}</option>)}
        </select>
      )}
      {plan.length > 0 && (
        <>
          <div data-testid="osp-shop" className="rounded-2xl border border-salvia/40 bg-salvia/8 p-3">
            <p className="font-mono-data text-[10px] tracking-[0.25em] uppercase text-salvia mb-1.5">{tri("La spesa", "Der Einkauf", "The shopping")}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-0.5 text-[13px]">{shop.map((v, i) => <div key={i} className="flex justify-between"><span className="text-muted-foreground truncate">{v.label}</span><span className="font-mono-data font-bold text-foreground">{Math.round(v.g)} g</span></div>)}</div>
          </div>
          <div className="flex gap-1.5">
            <button data-testid="osp-ics" onClick={ics} className="flex-1 inline-flex items-center justify-center gap-1.5 text-[12.5px] font-bold px-3 py-2 rounded-xl bg-salvia text-white active:scale-95"><Calendar className="w-4 h-4" />{tri("Gli orari nel calendario", "Zeiten in den Kalender", "Times to calendar")}</button>
            <button data-testid="osp-copy" onClick={() => navigator.clipboard.writeText(asText()).then(() => toast.success(tri("Copiato.", "Kopiert.", "Copied."))).catch(() => {})} className="flex-1 inline-flex items-center justify-center gap-1.5 text-[12.5px] font-bold px-3 py-2 rounded-xl border border-border bg-card text-foreground active:scale-95"><Copy className="w-4 h-4" />{tri("Copia tutto", "Alles kopieren", "Copy all")}</button>
          </div>
          <p className="text-[12.5px] text-salvia leading-snug">{tri("Sitor: il pane fatto in casa è il regalo che si vede dalla porta. Fallo raffreddare prima che arrivino: il profumo farà il resto.", "Sitor: selbstgebackenes Brot ist das Geschenk, das man schon an der Tür sieht. Lass es auskühlen, bevor sie kommen: der Duft macht den Rest.", "Sitor: homemade bread is the gift you can see from the door. Let it cool before they arrive: the smell will do the rest.")}</p>
        </>
      )}
    </div>
  );
}
