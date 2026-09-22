import { useState, useEffect, useMemo, useRef } from "react";
import { ChevronLeft, Sprout, Cake, Droplets, Award, Stethoscope, Share2, Trash2, Gift, MessageCircle, Plus, CalendarPlus, Refrigerator, Sun, Sparkles, QrCode, Copy, BookOpen } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { toast } from "sonner";
import QRCode from "qrcode";
import { award } from "@/lib/medaglie"; // V90

// V85 — "Il mio lievito madre": il lievito come un figlio. Nome, data di nascita, età che cresce,
// quaderno dei rinfreschi, traguardi, certificato di nascita da condividere, visita di controllo,
// promemoria compleanno. Idea di Michele.
// Tutto nel browser (localStorage "mikilab_lievito_figlio"). Nessun dato al server, nessuna foto.

const KEY = "mikilab_lievito_figlio";
const DAY = 86400000;
const rd = () => { try { const v = JSON.parse(localStorage.getItem(KEY) || "null"); return v && Array.isArray(v.list) ? v : { list: [], cur: null }; } catch { return { list: [], cur: null }; } };
const wr = (v) => { try { localStorage.setItem(KEY, JSON.stringify(v)); return true; } catch { return false; } };

const TYPES = [
  { k: "grano", it: "Solido di grano", de: "Fester Weizensauerteig", en: "Stiff wheat starter" },
  { k: "licoli", it: "Licoli (liquido)", de: "Flüssiger Sauerteig (Licoli)", en: "Liquid starter (licoli)" },
  { k: "segale", it: "Sauerteig di segale", de: "Roggensauerteig", en: "Rye sourdough" },
];
const NAMES = ["Nino", "Bianca", "Lino", "Gina", "Ugo", "Lievitina", "Bruno", "Mollica", "Pina", "Bollo"];

function ageParts(birth, now = Date.now()) {
  const b = new Date(birth); const n = new Date(now);
  let months = (n.getFullYear() - b.getFullYear()) * 12 + (n.getMonth() - b.getMonth());
  const probe = new Date(b); probe.setMonth(b.getMonth() + months);
  if (probe > n) { months -= 1; probe.setMonth(probe.getMonth() - 1); }
  const days = Math.max(0, Math.floor((n - probe) / DAY));
  const totalDays = Math.max(0, Math.floor((n - b) / DAY));
  return { years: Math.floor(months / 12), months: months % 12, days, totalDays };
}
function pad(n) { return String(n).padStart(2, "0"); }
function icsStamp(d) { return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`; }

export default function MioLievito({ onBack, onNav }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const L = (o) => o[lang] || o.it;
  const [store, setStore] = useState(rd);
  const [tick, setTick] = useState(0);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [birth, setBirth] = useState(() => new Date().toISOString().slice(0, 10));
  const [type, setType] = useState("grano");
  const [origin, setOrigin] = useState("");
  const [riseH, setRiseH] = useState(6);
  const [smell, setSmell] = useState("latte");
  const [note, setNote] = useState("");
  const [check, setCheck] = useState({});
  const certRef = useRef(null);
  const qrRef = useRef(null);

  // V86 — "Il lievito viaggia": chi riceve un pezzo apre il link del QR e qui nasce il figlio.
  const [inherited, setInherited] = useState(null);
  useEffect(() => {
    try {
      const raw = new URLSearchParams(window.location.search).get("lievito");
      if (!raw) return;
      const j = JSON.parse(decodeURIComponent(escape(atob(raw.replace(/-/g, "+").replace(/_/g, "/")))));
      if (j && j.n) {
        setInherited(j);
        setCreating(true);
        if (j.b) setBirth(String(j.b).slice(0, 10));
        if (j.t && TYPES.some((t) => t.k === j.t)) setType(j.t);
        setOrigin(tri(`figlio di ${j.n}`, `Kind von ${j.n}`, `child of ${j.n}`).slice(0, 60));
      }
      const u = new URL(window.location.href); u.searchParams.delete("lievito"); window.history.replaceState(window.history.state, "", u.toString());
    } catch { /* link non valido: si ignora */ }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  
  useEffect(() => { const id = setInterval(() => setTick((t) => t + 1), 60000); return () => clearInterval(id); }, []);
  const save = (next) => { if (!wr(next)) toast.error(tri("Non riesco a salvare nel dispositivo.", "Kann nicht auf dem Gerät speichern.", "Can't save on the device.")); setStore(next); };

  const cur = useMemo(() => store.list.find((x) => x.id === store.cur) || store.list[0] || null, [store]);
  const age = useMemo(() => (cur ? ageParts(cur.birth) : null), [cur, tick]); // eslint-disable-line react-hooks/exhaustive-deps
  const travelUrl = cur ? (() => {
    try {
      const j = JSON.stringify({ n: cur.name, b: cur.birth, t: cur.type });
      const b64 = btoa(unescape(encodeURIComponent(j))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
      return `https://mikilab.de/?lievito=${b64}`;
    } catch { return null; }
  })() : null;
  useEffect(() => {
    if (!qrRef.current || !travelUrl) return;
    QRCode.toCanvas(qrRef.current, travelUrl, { width: 180, margin: 1, color: { dark: "#2B2E33", light: "#F6F1E7" } }).catch(() => { /* */ });
  }, [travelUrl, creating]);
  const copyTravel = async () => { try { await navigator.clipboard.writeText(travelUrl); toast.success(tri("Link copiato: mandalo a chi riceve il lievito.", "Link kopiert: schick ihn dem Empfänger.", "Link copied: send it to whoever gets the starter.")); } catch { /* */ } };

  const ageText = () => {
    if (!age) return "";
    const p = [];
    if (age.years) p.push(tri(`${age.years} ${age.years === 1 ? "anno" : "anni"}`, `${age.years} ${age.years === 1 ? "Jahr" : "Jahre"}`, `${age.years} ${age.years === 1 ? "year" : "years"}`));
    if (age.months) p.push(tri(`${age.months} ${age.months === 1 ? "mese" : "mesi"}`, `${age.months} ${age.months === 1 ? "Monat" : "Monate"}`, `${age.months} ${age.months === 1 ? "month" : "months"}`));
    if (!age.years || age.days) p.push(tri(`${age.days} ${age.days === 1 ? "giorno" : "giorni"}`, `${age.days} ${age.days === 1 ? "Tag" : "Tage"}`, `${age.days} ${age.days === 1 ? "day" : "days"}`));
    return p.join(tri(" e ", " und ", " and "));
  };

  const create = () => {
    const n = name.trim() || NAMES[Math.floor(Math.random() * NAMES.length)];
    const id = `${Date.now()}`;
    const item = { id, name: n, birth, type, origin: origin.trim(), home: "fuori", feeds: [], firstBread: null, kids: [] };
    save({ list: [...store.list, item], cur: id });
    award("lievito_nato");
    setCreating(false); setName(""); setOrigin("");
    toast.success(tri(`Benvenuto al mondo, ${n}!`, `Willkommen auf der Welt, ${n}!`, `Welcome to the world, ${n}!`));
  };
  const update = (patch) => { if (!cur) return; save({ ...store, list: store.list.map((x) => (x.id === cur.id ? { ...x, ...patch } : x)) }); };
  const remove = () => {
    if (!cur || !window.confirm(tri(`Cancellare ${cur.name} dal quaderno? (Il lievito vero resta nel tuo barattolo!)`, `${cur.name} aus dem Heft löschen? (Der echte Sauerteig bleibt im Glas!)`, `Remove ${cur.name} from the notebook? (The real starter stays in your jar!)`))) return;
    const list = store.list.filter((x) => x.id !== cur.id);
    save({ list, cur: list[0] ? list[0].id : null });
  };
  const feed = () => {
    if (!cur) return;
    const f = { ts: Date.now(), riseH: Number(riseH) || null, smell, note: note.trim() };
    update({ feeds: [f, ...(cur.feeds || [])].slice(0, 120) });
    if ((cur.feeds || []).length + 1 >= 10) award("nutrice");
    setNote("");
    toast.success(tri(`${cur.name} ha mangiato. Bravo!`, `${cur.name} hat gegessen. Gut gemacht!`, `${cur.name} has been fed. Well done!`));
  };
  const addKid = () => {
    const who = window.prompt(tri("A chi hai regalato un pezzo di lievito? (solo il nome)", "Wem hast du ein Stück Sauerteig geschenkt? (nur der Vorname)", "Who did you give a piece of starter to? (first name only)"));
    if (who && who.trim()) update({ kids: [...(cur.kids || []), { name: who.trim().slice(0, 30), ts: Date.now() }] });
  };
  const birthdayIcs = () => {
    try {
      const b = new Date(cur.birth); const now = new Date();
      const next = new Date(now.getFullYear(), b.getMonth(), b.getDate(), 9, 0, 0);
      if (next < now) next.setFullYear(next.getFullYear() + 1);
      const end = new Date(next.getTime() + 3600000);
      const title = tri(`Compleanno di ${cur.name} (lievito madre)`, `Geburtstag von ${cur.name} (Sauerteig)`, `${cur.name}'s birthday (sourdough starter)`);
      const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//MikiLab//Lievito//IT", "BEGIN:VEVENT", `UID:lievito-${cur.id}@mikilab.de`, `DTSTAMP:${icsStamp(new Date())}`, `DTSTART:${icsStamp(next)}`, `DTEND:${icsStamp(end)}`, "RRULE:FREQ=YEARLY", `SUMMARY:${title}`, `DESCRIPTION:${tri("Oggi fai un pane speciale. mikilab.de", "Heute ein besonderes Brot backen. mikilab.de", "Bake a special bread today. mikilab.de")}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
      const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
      const a = document.createElement("a"); a.href = url; a.download = `compleanno-${cur.name}.ics`; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch { toast.error(tri("Promemoria non creato.", "Erinnerung nicht erstellt.", "Reminder not created.")); }
  };
  const shareCert = async () => {
    try {
      const svg = certRef.current; if (!svg) return;
      const xml = new XMLSerializer().serializeToString(svg);
      const img = new Image();
      const blobUrl = URL.createObjectURL(new Blob([xml], { type: "image/svg+xml;charset=utf-8" }));
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = blobUrl; });
      const c = document.createElement("canvas"); c.width = 1080; c.height = 720;
      c.getContext("2d").drawImage(img, 0, 0, 1080, 720);
      URL.revokeObjectURL(blobUrl);
      const blob = await new Promise((res) => c.toBlob(res, "image/png"));
      const file = new File([blob], `certificato-${cur.name}.png`, { type: "image/png" });
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: "MikiLab" }); return; }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = file.name; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch { toast.error(tri("Non sono riuscito a creare il certificato.", "Zertifikat konnte nicht erstellt werden.", "Couldn't create the certificate.")); }
  };
  const askSitor = (text) => { try { window.dispatchEvent(new CustomEvent("mikilab-open-chat")); setTimeout(() => window.dispatchEvent(new CustomEvent("mikilab-chat-prefill", { detail: { text } })), 250); } catch { /* */ } };

  // Stato del lievito in base all'ultimo rinfresco e a dove vive.
  const lastFeed = cur && cur.feeds && cur.feeds[0] ? cur.feeds[0].ts : null;
  const hoursSince = lastFeed ? (Date.now() - lastFeed) / 3600000 : null;
  const limitH = cur && cur.home === "frigo" ? 7 * 24 : 24;
  const hunger = hoursSince == null ? "none" : hoursSince < limitH ? "ok" : hoursSince < limitH * 2 ? "hungry" : "very";

  const milestones = cur ? [
    { k: "nato", ok: true, t: tri("È nato", "Geboren", "Born"), d: cur.birth },
    { k: "sett", ok: age.totalDays >= 7, t: tri("Prima settimana", "Erste Woche", "First week") },
    { k: "pane", ok: !!cur.firstBread, t: tri("Primo pane", "Erstes Brot", "First bread"), d: cur.firstBread },
    { k: "mese", ok: age.totalDays >= 30, t: tri("Un mese", "Ein Monat", "One month") },
    { k: "cento", ok: age.totalDays >= 100, t: tri("100 giorni", "100 Tage", "100 days") },
    { k: "anno", ok: age.years >= 1, t: tri("Primo compleanno", "Erster Geburtstag", "First birthday") },
    { k: "figli", ok: (cur.kids || []).length > 0, t: tri("Ha un fratello altrove", "Hat einen Bruder anderswo", "Has a sibling elsewhere") },
  ] : [];

  const CHECK_Q = [
    { k: "odore", q: tri("Che odore ha?", "Wie riecht er?", "How does it smell?"), opts: [
      { k: "latte", l: tri("Yogurt, latte, un po' acido: buono", "Joghurt, Milch, leicht sauer: gut", "Yogurt, milk, slightly sour: good"), v: "ok" },
      { k: "acetone", l: tri("Acetone, smalto, alcol forte", "Aceton, Nagellack, starker Alkohol", "Acetone, nail polish, strong alcohol"), v: "warn", a: tri("Ha fame da un po': rinfrescalo più spesso per 2-3 giorni e tienilo più caldo.", "Er hat schon länger Hunger: 2-3 Tage öfter füttern und wärmer stellen.", "It's been hungry a while: feed more often for 2-3 days and keep it warmer.") },
      { k: "cattivo", l: tri("Marcio, formaggio andato a male", "Faul, verdorbener Käse", "Rotten, spoiled cheese"), v: "bad", a: tri("Se è giovane (prima settimana) è normale, continua. Se è adulto: butta metà, rinfresca 2 volte al giorno per 3 giorni e ascolta l'odore.", "Wenn er jung ist (erste Woche): normal, weitermachen. Wenn erwachsen: die Hälfte weg, 3 Tage lang 2× täglich füttern und riechen.", "If young (first week) it's normal, carry on. If adult: discard half, feed twice a day for 3 days and smell again.") } ] },
    { k: "sopra", q: tri("Cosa vedi sopra?", "Was siehst du oben?", "What do you see on top?"), opts: [
      { k: "bolle", l: tri("Bolle e cupola", "Blasen und Kuppel", "Bubbles and a dome"), v: "ok" },
      { k: "liquido", l: tri("Un liquido scuro", "Eine dunkle Flüssigkeit", "A dark liquid"), v: "warn", a: tri("È solo alcol di fame. Buttalo via, mescola e rinfresca: torna in forma in 1-2 rinfreschi.", "Nur Hungeralkohol. Abgießen, umrühren, füttern: in 1-2 Fütterungen wieder fit.", "Just hunger alcohol. Pour it off, stir and feed: back in shape after 1-2 feeds.") },
      { k: "muffa", l: tri("Muffa colorata (rosa, verde, nera, pelosa)", "Farbiger Schimmel (rosa, grün, schwarz, pelzig)", "Coloured mould (pink, green, black, fuzzy)"), v: "bad", a: tri("Qui non si salva: butta tutto, lava il barattolo e ricomincia. Non assaggiarlo.", "Hier gibt es keine Rettung: alles weg, Glas auswaschen, neu anfangen. Nicht probieren.", "No saving this one: throw it all away, wash the jar and start again. Don't taste it.") } ] },
    { k: "forza", q: tri("Dopo il rinfresco, in quante ore raddoppia?", "Wie viele Stunden nach dem Füttern verdoppelt er sich?", "How many hours after feeding does it double?"), opts: [
      { k: "veloce", l: tri("Entro 4-6 ore", "In 4-6 Stunden", "Within 4-6 hours"), v: "ok" },
      { k: "lento", l: tri("Più di 8 ore", "Mehr als 8 Stunden", "More than 8 hours"), v: "warn", a: tri("È pigro: 3 giorni di rinfreschi regolari a 24-26 °C lo svegliano. Con la farina integrale nel rinfresco riprende prima.", "Er ist träge: 3 Tage regelmäßig bei 24-26 °C füttern weckt ihn. Mit etwas Vollkornmehl geht es schneller.", "It's sluggish: 3 days of regular feeds at 24-26 °C wake it up. A bit of wholemeal flour in the feed helps.") },
      { k: "mai", l: tri("Non raddoppia", "Er verdoppelt sich nicht", "It doesn't double"), v: "bad", a: tri("Non usarlo ancora per il pane. Rinfreschi ogni 12 ore per 3-4 giorni al caldo; se resta fermo, chiedi a Sitor cosa cambiare.", "Noch nicht fürs Brot nutzen. 3-4 Tage alle 12 Stunden warm füttern; bleibt er still, frag Sitor.", "Don't use it for bread yet. Feed every 12 hours for 3-4 days somewhere warm; if still flat, ask Sitor.") } ] },
  ];
  const checkResult = CHECK_Q.every((q) => check[q.k]) ? CHECK_Q.map((q) => q.opts.find((o) => o.k === check[q.k])).reduce((acc, o) => (o.v === "bad" ? "bad" : o.v === "warn" && acc !== "bad" ? "warn" : acc), "ok") : null;

  const rises = cur ? (cur.feeds || []).filter((f) => f.riseH).slice(0, 12).reverse() : [];
  const fmtD = (iso) => { try { return new Date(iso).toLocaleDateString(lang === "de" ? "de-DE" : lang === "en" ? "en-GB" : "it-IT", { day: "2-digit", month: "long", year: "numeric" }); } catch { return iso; } };

  return (
    <div data-testid="lievito-page" className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <button data-testid="lievito-back" onClick={onBack} className="inline-flex items-center gap-1 text-muted-foreground text-sm font-bold"><ChevronLeft className="w-4 h-4" />{tri("Indietro", "Zurück", "Back")}</button>
      <div className="flex items-center gap-2"><Sprout className="w-6 h-6 text-salvia" /><h1 className="font-display text-2xl font-black text-foreground">{tri("Il mio lievito madre", "Mein Sauerteig", "My sourdough starter")}</h1></div>
      <p className="text-sm text-muted-foreground">{tri("Un lievito madre è vivo: nasce, cresce, mangia, ha una data di nascita e fa figli. Qui lo tieni come si tiene un figlio. Tutto resta sul tuo telefono.", "Ein Sauerteig lebt: er wird geboren, wächst, isst, hat einen Geburtstag und bekommt Kinder. Hier hältst du ihn wie ein Kind. Alles bleibt auf deinem Handy.", "A sourdough starter is alive: it's born, grows, eats, has a birthday and has children. Here you keep it like a child. Everything stays on your phone.")}</p>

      <button data-testid="lievito-guida" onClick={() => onNav && onNav("curalievito")} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-salvia/50 bg-salvia/10 text-xs font-bold text-foreground active:scale-95"><BookOpen className="w-3.5 h-3.5 text-salvia" />{tri("Come si cura e si fa crescere", "Wie man ihn pflegt und wachsen lässt", "How to care for it and help it grow")}</button>

      {store.list.length > 1 && (
        <div className="flex gap-2 flex-wrap">{store.list.map((x) => <button key={x.id} onClick={() => save({ ...store, cur: x.id })} className={`px-3 py-1.5 rounded-full text-sm font-bold border ${cur && cur.id === x.id ? "bg-salvia text-white border-salvia" : "bg-background border-border text-foreground"}`}>{x.name}</button>)}</div>
      )}

      {(!cur || creating) && (
        <section data-testid="lievito-form" className="rounded-2xl border border-salvia/40 bg-background p-4 space-y-3">
          <p className="font-bold text-foreground">{tri("Registra la nascita", "Die Geburt eintragen", "Register the birth")}</p>
          {inherited && <p data-testid="lievito-inherited" className="text-[13px] text-foreground/90 rounded-xl border border-salvia/50 bg-salvia/12 px-3 py-2">{tri(`Hai ricevuto un pezzo di ${inherited.n}! Il tuo lievito ha già la sua età: dagli solo un nome nuovo.`, `Du hast ein Stück von ${inherited.n} bekommen! Dein Sauerteig hat schon dessen Alter: gib ihm nur einen neuen Namen.`, `You received a piece of ${inherited.n}! Your starter already has its age: just give it a new name.`)}</p>}
          <label className="block text-sm font-bold text-foreground">{tri("Come si chiama?", "Wie heißt er?", "What's its name?")}
            <input data-testid="lievito-name" value={name} onChange={(e) => setName(e.target.value.slice(0, 24))} placeholder={tri("es. Nino (se lo lasci vuoto scelgo io)", "z. B. Nino (leer lassen: ich wähle)", "e.g. Nino (leave empty and I'll pick)")} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground" />
          </label>
          <label className="block text-sm font-bold text-foreground">{tri("Quando è nato? (il giorno del primo impasto di farina e acqua)", "Wann wurde er geboren? (der Tag des ersten Mehl-Wasser-Ansatzes)", "When was it born? (the day of the first flour-and-water mix)")}
            <input data-testid="lievito-birth" type="date" value={birth} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setBirth(e.target.value)} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground" />
          </label>
          <div className="flex gap-2 flex-wrap">{TYPES.map((t) => <button key={t.k} onClick={() => setType(t.k)} className={`px-3 py-1.5 rounded-full text-xs font-bold border ${type === t.k ? "bg-salvia text-white border-salvia" : "bg-background border-border text-foreground"}`}>{L(t)}</button>)}</div>
          <label className="block text-sm font-bold text-foreground">{tri("Da chi viene? (facoltativo: «l'ho fatto io», «dalla nonna»…)", "Woher kommt er? (optional: «selbst gemacht», «von Oma»…)", "Where is it from? (optional: «made it myself», «from grandma»…)")}
            <input value={origin} onChange={(e) => setOrigin(e.target.value.slice(0, 60))} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground" />
          </label>
          <div className="flex gap-2">
            <button data-testid="lievito-create" onClick={create} className="flex-1 px-4 py-2.5 rounded-xl bg-salvia text-white font-bold text-sm active:scale-95">{tri("È nato!", "Er ist da!", "It's born!")}</button>
            {cur && <button onClick={() => setCreating(false)} className="px-4 py-2.5 rounded-xl border border-border bg-background font-bold text-sm text-foreground">{tri("Annulla", "Abbrechen", "Cancel")}</button>}
          </div>
          {!cur && <button onClick={() => onNav && onNav("crealievito")} className="text-[12px] font-bold text-primary underline">{tri("Non ce l'hai ancora? Crea il tuo lievito passo per passo", "Noch keinen? Erstelle deinen Sauerteig Schritt für Schritt", "Don't have one yet? Create your starter step by step")}</button>}
        </section>
      )}

      {cur && !creating && (
        <>
          {/* Carta d'identità + età */}
          <section data-testid="lievito-card" className="rounded-3xl border border-salvia/40 bg-salvia/8 p-5">
            <p className="font-mono-data text-[10px] tracking-[0.28em] uppercase text-salvia">{L(TYPES.find((t) => t.k === cur.type) || TYPES[0])}</p>
            <h2 className="font-display text-3xl font-black text-foreground">{cur.name}</h2>
            <p className="text-sm text-foreground/85 mt-1">{tri("Oggi ha", "Heute ist er", "Today it is")} <span className="font-black text-foreground">{ageText()}</span>{lang === "de" ? " alt" : ""}.</p>
            <p className="text-[12px] text-muted-foreground">{tri("Nato il", "Geboren am", "Born on")} {fmtD(cur.birth)}{cur.origin ? ` · ${cur.origin}` : ""}</p>
            <div className="mt-3 flex gap-2 flex-wrap">
              <button onClick={() => update({ home: cur.home === "frigo" ? "fuori" : "frigo" })} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-background text-xs font-bold text-foreground active:scale-95">
                {cur.home === "frigo" ? <Refrigerator className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
                {cur.home === "frigo" ? tri("Vive in frigo", "Wohnt im Kühlschrank", "Lives in the fridge") : tri("Vive fuori, a temperatura ambiente", "Wohnt draußen, bei Raumtemperatur", "Lives out, at room temperature")}
              </button>
              <button onClick={birthdayIcs} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-background text-xs font-bold text-foreground active:scale-95"><CalendarPlus className="w-3.5 h-3.5" />{tri("Compleanno nel calendario", "Geburtstag in den Kalender", "Birthday in calendar")}</button>
            </div>
          </section>

          {/* Fame */}
          <section data-testid="lievito-feed" className={`rounded-2xl border p-4 ${hunger === "very" ? "border-mattone/50 bg-mattone/10" : hunger === "hungry" ? "border-ambra/50 bg-ambra/12" : "border-border bg-background"}`}>
            <div className="flex items-center gap-2 mb-1"><Droplets className="w-5 h-5 text-primary" /><h3 className="font-bold text-foreground">{tri("Il pasto", "Die Mahlzeit", "Feeding")}</h3></div>
            <p className="text-[13px] text-foreground/85">
              {hunger === "none" && tri("Nessun rinfresco segnato ancora.", "Noch keine Fütterung eingetragen.", "No feeding noted yet.")}
              {hunger === "ok" && tri(`Ultimo pasto ${Math.round(hoursSince)} ore fa: sta bene.`, `Letzte Mahlzeit vor ${Math.round(hoursSince)} Stunden: alles gut.`, `Last meal ${Math.round(hoursSince)} hours ago: doing fine.`)}
              {hunger === "hungry" && tri(`${cur.name} ha fame: sono passate ${Math.round(hoursSince)} ore.`, `${cur.name} hat Hunger: ${Math.round(hoursSince)} Stunden sind vergangen.`, `${cur.name} is hungry: ${Math.round(hoursSince)} hours have passed.`)}
              {hunger === "very" && tri(`${cur.name} ha molta fame (${Math.round(hoursSince / 24)} giorni): rinfrescalo oggi, magari due volte.`, `${cur.name} hat großen Hunger (${Math.round(hoursSince / 24)} Tage): heute füttern, vielleicht zweimal.`, `${cur.name} is very hungry (${Math.round(hoursSince / 24)} days): feed it today, maybe twice.`)}
            </p>
            <div className="mt-3 grid sm:grid-cols-2 gap-2">
              <label className="text-[12px] font-bold text-foreground">{tri("Dopo l'ultimo rinfresco è raddoppiato in", "Nach der letzten Fütterung verdoppelt in", "After the last feed it doubled in")} <span className="text-primary font-mono-data">{riseH} h</span>
                <input type="range" min="2" max="16" step="0.5" value={riseH} onChange={(e) => setRiseH(e.target.value)} className="w-full accent-[#597362]" /></label>
              <label className="text-[12px] font-bold text-foreground">{tri("Odore", "Geruch", "Smell")}
                <select value={smell} onChange={(e) => setSmell(e.target.value)} className="mt-1 w-full rounded-xl border border-border bg-background px-2 py-1.5 text-sm text-foreground">
                  <option value="latte">{tri("Yogurt / latte", "Joghurt / Milch", "Yogurt / milk")}</option>
                  <option value="acido">{tri("Acido pungente", "Stechend sauer", "Sharp sour")}</option>
                  <option value="acetone">{tri("Acetone", "Aceton", "Acetone")}</option>
                  <option value="altro">{tri("Altro", "Anders", "Other")}</option>
                </select></label>
            </div>
            <input value={note} onChange={(e) => setNote(e.target.value.slice(0, 120))} placeholder={tri("Nota (facoltativa): farina usata, temperatura…", "Notiz (optional): Mehl, Temperatur…", "Note (optional): flour used, temperature…")} className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground" />
            <button data-testid="lievito-feed-btn" onClick={feed} className="mt-2 w-full px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm active:scale-95">{tri("Rinfrescato adesso", "Gerade gefüttert", "Fed just now")}</button>
          </section>

          {/* Forza nel tempo */}
          {rises.length >= 2 && (
            <section data-testid="lievito-forza" className="rounded-2xl border border-border bg-background p-4">
              <div className="flex items-center gap-2 mb-2"><Sparkles className="w-5 h-5 text-primary" /><h3 className="font-bold text-foreground">{tri("La sua forza", "Seine Kraft", "Its strength")}</h3></div>
              <p className="text-[12px] text-muted-foreground mb-2">{tri("Ore per raddoppiare, dagli ultimi rinfreschi: più la barra è corta, più è forte.", "Stunden bis zur Verdopplung, aus den letzten Fütterungen: je kürzer der Balken, desto stärker.", "Hours to double, from the last feeds: the shorter the bar, the stronger.")}</p>
              <svg viewBox={`0 0 ${rises.length * 30} 70`} className="w-full h-20" aria-hidden>
                {rises.map((f, i) => { const h = Math.min(56, (f.riseH / 16) * 56); return (<g key={i}><rect x={i * 30 + 6} y={60 - h} width="18" height={h} rx="4" fill={f.riseH <= 6 ? "#597362" : f.riseH <= 9 ? "#E9A23B" : "#A4472D"} /><text x={i * 30 + 15} y="68" textAnchor="middle" fontSize="7" fill="hsl(var(--muted-foreground))">{f.riseH}h</text></g>); })}
              </svg>
            </section>
          )}

          {/* Traguardi */}
          <section data-testid="lievito-traguardi" className="rounded-2xl border border-border bg-background p-4">
            <div className="flex items-center gap-2 mb-2"><Award className="w-5 h-5 text-ambra" /><h3 className="font-bold text-foreground">{tri("Traguardi", "Meilensteine", "Milestones")}</h3></div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {milestones.map((m) => (
                <div key={m.k} className={`rounded-xl border p-2.5 text-center ${m.ok ? "border-ambra/50 bg-ambra/12" : "border-border/60 opacity-60"}`}>
                  <p className="text-lg">{m.ok ? "🏅" : "○"}</p>
                  <p className="text-[11px] font-bold text-foreground leading-tight">{m.t}</p>
                  {m.d && <p className="text-[10px] text-muted-foreground">{fmtD(m.d)}</p>}
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-2 flex-wrap">
              {!cur.firstBread && <button onClick={() => { update({ firstBread: new Date().toISOString().slice(0, 10) }); award("primo_pane_lm"); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-ambra/20 border border-ambra/50 text-xs font-bold text-foreground active:scale-95"><Cake className="w-3.5 h-3.5 text-ambra" />{tri("Oggi ha fatto il primo pane!", "Heute das erste Brot gebacken!", "Made its first bread today!")}</button>}
              <button onClick={addKid} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-background text-xs font-bold text-foreground active:scale-95"><Gift className="w-3.5 h-3.5 text-salvia" />{tri("Ne ho regalato un pezzo", "Ein Stück verschenkt", "Gave a piece away")}</button>
            </div>
            {(cur.kids || []).length > 0 && <p className="text-[12px] text-foreground/80 mt-2">{tri("Fratelli di", "Geschwister von", "Siblings of")} {cur.name}: {cur.kids.map((k) => k.name).join(", ")}</p>}
          </section>

          {/* Certificato di nascita */}
          <section data-testid="lievito-cert" className="rounded-2xl border border-border bg-background p-4">
            <p className="font-bold text-foreground mb-2">{tri("Certificato di nascita", "Geburtsurkunde", "Birth certificate")}</p>
            <svg ref={certRef} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 720" className="w-full rounded-xl border border-border" role="img" aria-label={tri("Certificato di nascita del lievito", "Geburtsurkunde des Sauerteigs", "Starter birth certificate")}>
              <rect width="1080" height="720" fill="#F6F1E7" />
              <rect x="30" y="30" width="1020" height="660" rx="24" fill="none" stroke="#A15621" strokeWidth="6" />
              <rect x="48" y="48" width="984" height="624" rx="16" fill="none" stroke="#597362" strokeWidth="2" strokeDasharray="6 8" />
              <text x="540" y="130" textAnchor="middle" fontFamily="Playfair Display, Georgia, serif" fontSize="30" fill="#597362" letterSpacing="8">{tri("CERTIFICATO DI NASCITA", "GEBURTSURKUNDE", "BIRTH CERTIFICATE")}</text>
              <text x="540" y="170" textAnchor="middle" fontFamily="Manrope, Arial, sans-serif" fontSize="20" fill="#5B5F66">{tri("di un lievito madre", "eines Sauerteigs", "of a sourdough starter")}</text>
              <text x="540" y="300" textAnchor="middle" fontFamily="Playfair Display, Georgia, serif" fontSize="96" fontWeight="900" fill="#2B2E33">{cur.name}</text>
              <text x="540" y="370" textAnchor="middle" fontFamily="Manrope, Arial, sans-serif" fontSize="28" fill="#2B2E33">{tri("nato il", "geboren am", "born on")} {fmtD(cur.birth)}</text>
              <text x="540" y="415" textAnchor="middle" fontFamily="Manrope, Arial, sans-serif" fontSize="22" fill="#5B5F66">{L(TYPES.find((t) => t.k === cur.type) || TYPES[0])}{cur.origin ? ` · ${cur.origin}` : ""}</text>
              <text x="540" y="500" textAnchor="middle" fontFamily="Manrope, Arial, sans-serif" fontSize="22" fill="#2B2E33" fontStyle="italic">{tri("«Nutrilo, tienilo al caldo, e lui ti darà il pane.»", "«Füttere ihn, halte ihn warm, und er gibt dir Brot.»", "«Feed it, keep it warm, and it will give you bread.»")}</text>
              <text x="540" y="600" textAnchor="middle" fontFamily="Playfair Display, Georgia, serif" fontSize="26" fontWeight="900" fill="#A15621" letterSpacing="6">MIKILAB</text>
              <text x="540" y="630" textAnchor="middle" fontFamily="Manrope, Arial, sans-serif" fontSize="16" fill="#5B5F66">{tri("Il Manuale di Sitor · mikilab.de", "Sitors Handbuch · mikilab.de", "Sitor's Manual · mikilab.de")}</text>
            </svg>
            <button data-testid="lievito-share" onClick={shareCert} className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-background text-sm font-bold text-foreground active:scale-95"><Share2 className="w-4 h-4" />{tri("Condividi il certificato", "Urkunde teilen", "Share the certificate")}</button>
          </section>

          {/* Il lievito viaggia */}
          <section data-testid="lievito-viaggia" className="rounded-2xl border border-border bg-background p-4">
            <div className="flex items-center gap-2 mb-1"><QrCode className="w-5 h-5 text-primary" /><h3 className="font-bold text-foreground">{tri("Il lievito viaggia", "Der Sauerteig reist", "The starter travels")}</h3></div>
            <p className="text-[13px] text-foreground/85 mb-3">{tri(`Regali un pezzo di ${cur.name}? Chi lo riceve inquadra questo QR e nel suo telefono nasce un figlio di ${cur.name}, con la stessa età. Così il tuo lievito ha un albero genealogico che passa di casa in casa.`, `Du verschenkst ein Stück von ${cur.name}? Der Empfänger scannt diesen QR-Code und auf seinem Handy wird ein Kind von ${cur.name} geboren, mit demselben Alter. So bekommt dein Sauerteig einen Stammbaum, der von Haus zu Haus geht.`, `Giving a piece of ${cur.name} away? Whoever gets it scans this QR and a child of ${cur.name} is born on their phone, with the same age. So your starter has a family tree that travels from house to house.`)}</p>
            <div className="flex items-center gap-4 flex-wrap">
              <canvas ref={qrRef} className="rounded-xl border border-border" aria-label="QR" />
              <div className="flex flex-col gap-2">
                <button onClick={copyTravel} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-background text-xs font-bold text-foreground active:scale-95"><Copy className="w-3.5 h-3.5" />{tri("Copia il link", "Link kopieren", "Copy the link")}</button>
                <button onClick={addKid} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-salvia/50 bg-salvia/10 text-xs font-bold text-foreground active:scale-95"><Gift className="w-3.5 h-3.5 text-salvia" />{tri("Segna a chi l'hai dato", "Eintragen, wem du ihn gegeben hast", "Note who you gave it to")}</button>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">{tri("Nel QR ci sono solo nome, data di nascita e tipo del lievito: nessun dato tuo.", "Im QR-Code stehen nur Name, Geburtstag und Art des Sauerteigs: keine Daten von dir.", "The QR holds only the starter's name, birth date and type: no data about you.")}</p>
          </section>

          {/* Visita di controllo */}
          <section data-testid="lievito-visita" className="rounded-2xl border border-border bg-background p-4 space-y-3">
            <div className="flex items-center gap-2"><Stethoscope className="w-5 h-5 text-primary" /><h3 className="font-bold text-foreground">{tri("Visita di controllo", "Kontrolluntersuchung", "Check-up")}</h3></div>
            {CHECK_Q.map((q) => (
              <div key={q.k}>
                <p className="text-[13px] font-bold text-foreground mb-1">{q.q}</p>
                <div className="flex gap-1.5 flex-wrap">{q.opts.map((o) => <button key={o.k} onClick={() => setCheck((c) => ({ ...c, [q.k]: o.k }))} className={`px-3 py-1.5 rounded-full text-[12px] font-bold border ${check[q.k] === o.k ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-foreground"}`}>{o.l}</button>)}</div>
              </div>
            ))}
            {checkResult && (
              <div className={`rounded-xl border p-3 ${checkResult === "ok" ? "border-salvia/50 bg-salvia/12" : checkResult === "warn" ? "border-ambra/50 bg-ambra/12" : "border-mattone/50 bg-mattone/10"}`}>
                <p className="font-black text-foreground">{checkResult === "ok" ? tri(`${cur.name} sta benissimo.`, `${cur.name} geht es prächtig.`, `${cur.name} is doing great.`) : checkResult === "warn" ? tri(`${cur.name} ha bisogno di attenzioni.`, `${cur.name} braucht Zuwendung.`, `${cur.name} needs some care.`) : tri("Qui serve una decisione.", "Hier braucht es eine Entscheidung.", "A decision is needed here.")}</p>
                {CHECK_Q.map((q) => q.opts.find((o) => o.k === check[q.k])).filter((o) => o && o.a).map((o, i) => <p key={i} className="text-[13px] text-foreground/90 mt-1">• {o.a}</p>)}
                <button onClick={() => askSitor(tri(`Il mio lievito madre ${cur.name} (${L(TYPES.find((t) => t.k === cur.type) || TYPES[0])}, ${ageText()}): ${CHECK_Q.map((q) => q.opts.find((o) => o.k === check[q.k]).l).join("; ")}. Cosa faccio?`, `Mein Sauerteig ${cur.name} (${L(TYPES.find((t) => t.k === cur.type) || TYPES[0])}, ${ageText()}): ${CHECK_Q.map((q) => q.opts.find((o) => o.k === check[q.k]).l).join("; ")}. Was soll ich tun?`, `My starter ${cur.name} (${L(TYPES.find((t) => t.k === cur.type) || TYPES[0])}, ${ageText()}): ${CHECK_Q.map((q) => q.opts.find((o) => o.k === check[q.k]).l).join("; ")}. What should I do?`))} className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/15 border border-primary/40 text-xs font-bold text-foreground active:scale-95"><MessageCircle className="w-3.5 h-3.5 text-primary" />{tri("Chiedi a Sitor", "Frag Sitor", "Ask Sitor")}</button>
              </div>
            )}
          </section>

          {(cur.feeds || []).length > 0 && (
            <section className="rounded-2xl border border-border bg-background p-4">
              <p className="font-bold text-foreground mb-2">{tri("Gli ultimi pasti", "Die letzten Mahlzeiten", "Last meals")}</p>
              <ul className="space-y-1">{cur.feeds.slice(0, 8).map((f, i) => <li key={i} className="text-[12px] text-foreground/85">{new Date(f.ts).toLocaleString(lang === "de" ? "de-DE" : lang === "en" ? "en-GB" : "it-IT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}{f.riseH ? ` · ${f.riseH} h` : ""}{f.note ? ` · ${f.note}` : ""}</li>)}</ul>
            </section>
          )}

          <div className="flex gap-2 justify-between flex-wrap">
            <button onClick={() => setCreating(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-bold text-foreground active:scale-95"><Plus className="w-3.5 h-3.5" />{tri("Un altro lievito", "Noch ein Sauerteig", "Another starter")}</button>
            <button onClick={remove} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-mattone/40 text-xs font-bold text-mattone active:scale-95"><Trash2 className="w-3.5 h-3.5" />{tri("Togli dal quaderno", "Aus dem Heft entfernen", "Remove from notebook")}</button>
          </div>
        </>
      )}
    </div>
  );
}
