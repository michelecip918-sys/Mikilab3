import { useState, useEffect, useMemo } from "react";
import { Sprout, Camera, Flame, Sparkles, ChevronRight, Award, Sun, Moon, Coffee } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { rLoc } from "@/lib/loc";
import { idbGet } from "@/lib/idbCache";
import { getLevel } from "@/lib/level";

// V88 — "LA TUA CUCINA": la Home smette di essere uguale per tutti. Legge solo quello che è già nel
// telefono (nome, lievito madre, ultimo pane, percorso fatto, livello) e costruisce un saluto vero:
// «Buongiorno Maria. Nino ha fame. L'ultima focaccia era da 4 stelle. Oggi è sabato: giorno di focaccia».
// È il legame: la persona torna perché il sito la riconosce. Nessun dato lascia il dispositivo.

export const NAME_KEY = "mikilab_nome";
const DAY = 86400000;
export const getName = () => { try { return localStorage.getItem(NAME_KEY) || ""; } catch { return ""; } };

function isoWeek(d) {
  const x = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = x.getUTCDay() || 7; x.setUTCDate(x.getUTCDate() + 4 - day);
  const y0 = new Date(Date.UTC(x.getUTCFullYear(), 0, 1));
  return `${x.getUTCFullYear()}-${Math.ceil(((x - y0) / DAY + 1) / 7)}`;
}
function weekStreak(entries) {
  if (!entries || !entries.length) return 0;
  const weeks = new Set(entries.map((e) => isoWeek(new Date(e.at))));
  let n = 0; const cur = new Date();
  if (!weeks.has(isoWeek(cur))) cur.setDate(cur.getDate() - 7); // la settimana in corso può ancora arrivare
  while (weeks.has(isoWeek(cur))) { n += 1; cur.setDate(cur.getDate() - 7); }
  return n;
}
function dayOfYear(d) { return Math.floor((d - new Date(d.getFullYear(), 0, 0)) / DAY); }

export default function LaTuaCucina({ recipes, starts, onNav, onOpenRecipe }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const [name, setName] = useState(getName);
  const [draft, setDraft] = useState("");
  const [askName, setAskName] = useState(() => { try { return !getName() && localStorage.getItem("mikilab_nome_skip") !== "1"; } catch { return false; } });
  const [bakes, setBakes] = useState([]);
  const [lievito, setLievito] = useState(null);
  const [done, setDone] = useState(() => { try { return new Set(JSON.parse(localStorage.getItem("mikilab_done") || "[]")); } catch { return new Set(); } });

  useEffect(() => {
    let stop = false;
    idbGet("mioforno").then((d) => { if (!stop && Array.isArray(d)) setBakes(d); });
    try { const v = JSON.parse(localStorage.getItem("mikilab_lievito_figlio") || "null"); if (v && Array.isArray(v.list) && v.list.length) setLievito(v.list.find((x) => x.id === v.cur) || v.list[0]); } catch { /* */ }
    const onFocus = () => { try { setDone(new Set(JSON.parse(localStorage.getItem("mikilab_done") || "[]"))); } catch { /* */ } };
    window.addEventListener("focus", onFocus);
    return () => { stop = true; window.removeEventListener("focus", onFocus); };
  }, []);

  const now = new Date();
  const h = now.getHours();
  const Greet = h < 12 ? Coffee : h < 18 ? Sun : Moon;
  const greet = h < 12 ? tri("Buongiorno", "Guten Morgen", "Good morning") : h < 18 ? tri("Buon pomeriggio", "Guten Tag", "Good afternoon") : tri("Buonasera", "Guten Abend", "Good evening");
  const wd = now.getDay(); const month = now.getMonth();
  const mood = month === 11 ? { cat: "panettoni", t: tri("È dicembre: mese di panettone.", "Es ist Dezember: Panettone-Monat.", "It's December: panettone month.") }
    : wd === 5 ? { cat: "pizza", t: tri("È venerdì: sera di pizza.", "Es ist Freitag: Pizzaabend.", "It's Friday: pizza night.") }
    : wd === 6 ? { cat: "focacce", t: tri("È sabato: giorno di focaccia.", "Es ist Samstag: Focaccia-Tag.", "It's Saturday: focaccia day.") }
    : wd === 0 ? { cat: "pane", t: tri("È domenica: il pane grande della settimana.", "Es ist Sonntag: das große Brot der Woche.", "It's Sunday: the big loaf of the week.") }
    : { cat: null, t: tri("Un giorno buono per impastare.", "Ein guter Tag zum Kneten.", "A good day to knead.") };

  // Il pane di oggi: cambia ogni giorno, uguale per tutti nello stesso giorno (nessun server).
  const today = useMemo(() => {
    const list = (recipes || []).filter((r) => r && !r.hidden && r.image_url);
    if (!list.length) return null;
    const pool = mood.cat ? list.filter((r) => r.menu_category === mood.cat) : list;
    const src = pool.length ? pool : list;
    return src[dayOfYear(now) % src.length];
  }, [recipes]); // eslint-disable-line react-hooks/exhaustive-deps

  const last = bakes[0] || null;
  const streak = weekStreak(bakes);
  const next = (starts || []).find((r) => !done.has(r.id)) || null;
  const level = getLevel(tri);

  let lievitoLine = null;
  if (lievito) {
    const lastFeed = lievito.feeds && lievito.feeds[0] ? lievito.feeds[0].ts : null;
    const hrs = lastFeed ? (Date.now() - lastFeed) / 3600000 : null;
    const limit = lievito.home === "frigo" ? 168 : 24;
    const days = Math.max(0, Math.floor((Date.now() - new Date(lievito.birth)) / DAY));
    lievitoLine = hrs == null ? tri(`${lievito.name} ha ${days} giorni: segna il primo pasto.`, `${lievito.name} ist ${days} Tage alt: trag die erste Mahlzeit ein.`, `${lievito.name} is ${days} days old: note its first meal.`)
      : hrs < limit ? tri(`${lievito.name} sta bene (ultimo pasto ${Math.round(hrs)} ore fa).`, `${lievito.name} geht es gut (letzte Mahlzeit vor ${Math.round(hrs)} Std.).`, `${lievito.name} is fine (last meal ${Math.round(hrs)} h ago).`)
      : tri(`${lievito.name} ha fame: rinfrescalo.`, `${lievito.name} hat Hunger: füttern.`, `${lievito.name} is hungry: feed it.`);
  }
  const hungry = lievitoLine && /fame|Hunger|hungry/.test(lievitoLine);

  const saveName = () => { const n = draft.trim().slice(0, 24); if (!n) return; setName(n); setAskName(false); try { localStorage.setItem(NAME_KEY, n); } catch { /* */ } };
  const skipName = () => { setAskName(false); try { localStorage.setItem("mikilab_nome_skip", "1"); } catch { /* */ } };
  const fmtD = (iso) => { try { return new Date(iso).toLocaleDateString(lang === "de" ? "de-DE" : lang === "en" ? "en-GB" : "it-IT", { day: "2-digit", month: "short" }); } catch { return ""; } };

  return (
    <section data-testid="la-tua-cucina" className="rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/10 to-background/70 p-5 sm:p-6 mb-4">
      <p className="font-mono-data text-[10px] tracking-[0.28em] uppercase text-primary mb-1">{tri("La tua cucina", "Deine Küche", "Your kitchen")}</p>
      <h2 className="font-display text-2xl sm:text-3xl font-black text-foreground flex items-center gap-2"><Greet className="w-6 h-6 text-primary" />{greet}{name ? `, ${name}` : ""}.</h2>
      <p className="text-[14px] text-foreground/85 mt-1">{mood.t}</p>

      {askName && (
        <div data-testid="cucina-nome" className="mt-3 rounded-2xl border border-border bg-background p-3">
          <p className="text-[13px] font-bold text-foreground">{tri("Come ti chiami? Così ti saluto per nome. Resta solo nel tuo telefono.", "Wie heißt du? Dann begrüße ich dich mit Namen. Bleibt nur auf deinem Handy.", "What's your name? So I can greet you by name. It stays only on your phone.")}</p>
          <div className="flex gap-2 mt-2">
            <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveName()} placeholder={tri("Il tuo nome", "Dein Name", "Your name")} className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground" />
            <button onClick={saveName} className="px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold active:scale-95">{tri("Ok", "Ok", "Ok")}</button>
            <button onClick={skipName} className="px-3 py-2 rounded-xl border border-border text-sm font-bold text-muted-foreground active:scale-95">{tri("No", "Nein", "No")}</button>
          </div>
        </div>
      )}

      <div className="mt-4 grid sm:grid-cols-2 gap-2.5">
        {today && (
          <button data-testid="cucina-oggi" onClick={() => onOpenRecipe && onOpenRecipe(today.id)} className="group text-left rounded-2xl overflow-hidden border border-border bg-background hover:border-primary active:scale-[0.99] transition-all sm:col-span-2 flex">
            <div className="w-28 sm:w-40 shrink-0 bg-muted"><img src={today.image_url} alt="" className="w-full h-full object-cover" loading="lazy" /></div>
            <div className="p-3 min-w-0 flex-1">
              <p className="font-mono-data text-[10px] tracking-[0.2em] uppercase text-primary">{tri("Il pane di oggi", "Das Brot von heute", "Today's bread")}</p>
              <p className="font-display text-lg font-black text-foreground leading-tight">{rLoc(today, "name", lang)}</p>
              <p className="text-[12px] text-muted-foreground mt-1">{tri("Sitor lo consiglia a tutti oggi. Domani cambia.", "Sitor empfiehlt es heute allen. Morgen ein anderes.", "Sitor recommends it to everyone today. Tomorrow it changes.")}</p>
              <span className="inline-flex items-center gap-1 text-[12px] font-bold text-primary mt-1">{tri("Apri", "Öffnen", "Open")}<ChevronRight className="w-3.5 h-3.5" /></span>
            </div>
          </button>
        )}
        {lievitoLine && (
          <button data-testid="cucina-lievito" onClick={() => onNav("miolievito")} className={`text-left rounded-2xl border p-3 active:scale-[0.99] transition-all ${hungry ? "border-ambra/60 bg-ambra/15" : "border-salvia/40 bg-salvia/10"}`}>
            <p className="flex items-center gap-1.5 font-bold text-foreground text-[13px]"><Sprout className="w-4 h-4 text-salvia" />{tri("Il tuo lievito", "Dein Sauerteig", "Your starter")}</p>
            <p className="text-[13px] text-foreground/90 mt-0.5">{lievitoLine}</p>
          </button>
        )}
        {last && (
          <button data-testid="cucina-ultimo" onClick={() => onNav("mioforno")} className="text-left rounded-2xl border border-border bg-background p-3 active:scale-[0.99] transition-all flex gap-3 items-center">
            {last.photo && <img src={last.photo} alt="" className="w-12 h-12 rounded-xl object-cover border border-border shrink-0" />}
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 font-bold text-foreground text-[13px]"><Camera className="w-4 h-4 text-primary" />{tri("L'ultimo pane", "Das letzte Brot", "Your last bake")}</p>
              <p className="text-[13px] text-foreground/90 truncate">{last.name}{last.stars ? ` · ${"★".repeat(last.stars)}` : ""} · {fmtD(last.at)}</p>
            </div>
          </button>
        )}
        {streak > 0 && (
          <div data-testid="cucina-streak" className="rounded-2xl border border-border bg-background p-3">
            <p className="flex items-center gap-1.5 font-bold text-foreground text-[13px]"><Flame className="w-4 h-4 text-ambra" />{tri("Forno acceso", "Ofen an", "Oven on")}</p>
            <p className="text-[13px] text-foreground/90 mt-0.5">{streak === 1 ? tri("Questa settimana hai infornato. Continua la prossima.", "Diese Woche hast du gebacken. Weiter so nächste Woche.", "You baked this week. Keep it up next week.") : tri(`${streak} settimane di seguito col forno acceso.`, `${streak} Wochen in Folge mit dem Ofen an.`, `${streak} weeks in a row with the oven on.`)}</p>
          </div>
        )}
        {next && (
          <button data-testid="cucina-prossimo" onClick={() => onOpenRecipe && onOpenRecipe(next.id)} className="text-left rounded-2xl border border-border bg-background p-3 active:scale-[0.99] transition-all">
            <p className="flex items-center gap-1.5 font-bold text-foreground text-[13px]"><Sparkles className="w-4 h-4 text-primary" />{tri("Il tuo prossimo passo", "Dein nächster Schritt", "Your next step")}</p>
            <p className="text-[13px] text-foreground/90 mt-0.5">{rLoc(next, "name", lang)}</p>
          </button>
        )}
        {!next && starts && starts.length > 0 && (
          <div data-testid="cucina-percorso-fatto" className="rounded-2xl border border-salvia/40 bg-salvia/10 p-3">
            <p className="flex items-center gap-1.5 font-bold text-foreground text-[13px]"><Award className="w-4 h-4 text-salvia" />{level.icon} {level.name}</p>
            <p className="text-[13px] text-foreground/90 mt-0.5">{tri("Hai fatto tutte le ricette di partenza. Ora scegli tu.", "Du hast alle Startrezepte gemacht. Jetzt wählst du.", "You've done all the starter recipes. Now you choose.")}</p>
          </div>
        )}
      </div>
    </section>
  );
}
