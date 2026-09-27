import { useState, useEffect } from "react";
import { Sprout, Camera, Flame, Sun, Moon, Coffee } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { idbGet } from "@/lib/idbCache";

// V88 — "LA TUA CUCINA": la Home riconosce chi torna, leggendo solo quello che è già nel telefono.
// V128 — divisa in due, per fare ordine: il SALUTO (con il soprannome) sta in cima alla Home; la STRISCIA
// (lievito madre, ultimo pane, settimane col forno acceso) compare solo se c'è qualcosa da dire.
// Il pane di oggi e il prossimo passo ora stanno in «Comincia da qui». Nessun dato lascia il dispositivo.

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

// Il saluto in cima alla Home: «Buon pomeriggio, Maria.» Il soprannome si chiede con un tocco, mai con un riquadro.
export function Saluto({ first = false }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const [name, setName] = useState(getName);
  const [asking, setAsking] = useState(false);
  const [draft, setDraft] = useState("");
  const [skip, setSkip] = useState(() => { try { return localStorage.getItem("mikilab_nome_skip") === "1"; } catch { return false; } });
  const h = new Date().getHours();
  const Greet = h < 12 ? Coffee : h < 18 ? Sun : Moon;
  const greet = h < 12 ? tri("Buongiorno", "Guten Morgen", "Good morning") : h < 18 ? tri("Buon pomeriggio", "Guten Tag", "Good afternoon") : tri("Buonasera", "Guten Abend", "Good evening");
  const save = () => { const n = draft.trim().slice(0, 24); if (!n) return; setName(n); setAsking(false); try { localStorage.setItem(NAME_KEY, n); } catch { /* */ } };
  const noName = () => { setAsking(false); setSkip(true); try { localStorage.setItem("mikilab_nome_skip", "1"); } catch { /* */ } };
  return (
    <div data-testid="la-tua-cucina">
      <h1 className="font-display text-[28px] sm:text-4xl font-black text-foreground leading-tight flex items-center gap-2">
        <Greet className="w-6 h-6 text-primary shrink-0" />
        {name ? `${greet}, ${name}.` : first ? tri("Benvenuto in MikiLab.", "Willkommen bei MikiLab.", "Welcome to MikiLab.") : `${greet}.`}
      </h1>
      {!name && !skip && !asking && !first && (
        <button data-testid="cucina-nome-chiedi" onClick={() => setAsking(true)} className="mt-1 text-[12.5px] text-muted-foreground underline decoration-dotted">{tri("Come vuoi che ti chiami?", "Wie soll ich dich nennen?", "What should I call you?")}</button>
      )}
      {asking && (
        <div data-testid="cucina-nome" className="mt-2">
          <p className="text-[12.5px] text-muted-foreground">{tri("Un soprannome basta: resta solo nel tuo telefono.", "Ein Spitzname reicht: er bleibt nur auf deinem Handy.", "A nickname is enough: it stays only on your phone.")}</p>
          <div className="flex gap-2 mt-1.5">
            <input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && save()} placeholder={tri("Il tuo soprannome", "Dein Spitzname", "Your nickname")} className="flex-1 min-w-0 rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground" />
            <button onClick={save} className="px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold active:scale-95">{tri("Ok", "Ok", "Ok")}</button>
            <button onClick={noName} className="px-3 py-2 rounded-xl border border-border text-sm font-bold text-muted-foreground active:scale-95">{tri("No, grazie", "Nein, danke", "No, thanks")}</button>
          </div>
        </div>
      )}
    </div>
  );
}

// La striscia: tre cose tue, solo se ci sono.
export default function LaTuaCucina({ onNav }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const [bakes, setBakes] = useState([]);
  const [lievito, setLievito] = useState(null);

  useEffect(() => {
    let stop = false;
    idbGet("mioforno").then((d) => { if (!stop && Array.isArray(d)) setBakes(d); }).catch(() => { /* */ });
    try { const v = JSON.parse(localStorage.getItem("mikilab_lievito_figlio") || "null"); if (v && Array.isArray(v.list) && v.list.length) setLievito(v.list.find((x) => x.id === v.cur) || v.list[0]); } catch { /* */ }
    return () => { stop = true; };
  }, []);

  const last = bakes[0] || null;
  const streak = weekStreak(bakes);
  let lievitoLine = null; let hungry = false;
  if (lievito) {
    const lastFeed = lievito.feeds && lievito.feeds[0] ? lievito.feeds[0].ts : null;
    const hrs = lastFeed ? (Date.now() - lastFeed) / 3600000 : null;
    const limit = lievito.home === "frigo" ? 168 : 24;
    const days = Math.max(0, Math.floor((Date.now() - new Date(lievito.birth)) / DAY));
    hungry = hrs != null && hrs >= limit;
    lievitoLine = hrs == null ? tri(`${lievito.name} ha ${days} giorni: segna il primo pasto.`, `${lievito.name} ist ${days} Tage alt: trag die erste Mahlzeit ein.`, `${lievito.name} is ${days} days old: note its first meal.`)
      : !hungry ? tri(`${lievito.name} sta bene (ultimo pasto ${Math.round(hrs)} ore fa).`, `${lievito.name} geht es gut (letzte Mahlzeit vor ${Math.round(hrs)} Std.).`, `${lievito.name} is fine (last meal ${Math.round(hrs)} h ago).`)
        : tri(`${lievito.name} ha fame: rinfrescalo.`, `${lievito.name} hat Hunger: füttern.`, `${lievito.name} is hungry: feed it.`);
  }
  if (!lievitoLine && !last && streak === 0) return null;
  const fmtD = (iso) => { try { return new Date(iso).toLocaleDateString(lang === "de" ? "de-DE" : lang === "en" ? "en-GB" : "it-IT", { day: "2-digit", month: "short" }); } catch { return ""; } };

  return (
    <section data-testid="cucina-striscia" className="grid gap-2">
      {lievitoLine && (
        <button data-testid="cucina-lievito" onClick={() => onNav("miolievito")} className={`flex items-center gap-2.5 text-left rounded-2xl border px-3 py-2.5 active:scale-[0.99] transition-all ${hungry ? "border-ambra/60 bg-ambra/15" : "border-salvia/40 bg-salvia/10"}`}>
          <Sprout className="w-5 h-5 text-salvia shrink-0" />
          <span className="text-[13px] text-foreground leading-snug">{lievitoLine}</span>
        </button>
      )}
      {(last || streak > 0) && (
        <button data-testid="cucina-ultimo" onClick={() => onNav("mioforno")} className="flex items-center gap-2.5 text-left rounded-2xl border border-border bg-card px-3 py-2.5 active:scale-[0.99] transition-all">
          {last && last.photo ? <img src={last.photo} alt="" className="w-9 h-9 rounded-lg object-cover border border-border shrink-0" /> : <Camera className="w-5 h-5 text-primary shrink-0" />}
          <span className="flex-1 min-w-0 text-[13px] text-foreground leading-snug">
            {last && <span className="block truncate">{tri("L'ultimo pane", "Das letzte Brot", "Your last bake")}: {last.name}{last.stars ? ` · ${"★".repeat(last.stars)}` : ""} · {fmtD(last.at)}</span>}
            {streak > 0 && <span className="flex items-center gap-1 text-muted-foreground"><Flame className="w-3.5 h-3.5 text-ambra" />{streak === 1 ? tri("Questa settimana hai infornato.", "Diese Woche hast du gebacken.", "You baked this week.") : tri(`${streak} settimane di fila col forno acceso.`, `${streak} Wochen in Folge mit dem Ofen an.`, `${streak} weeks in a row with the oven on.`)}</span>}
          </span>
        </button>
      )}
    </section>
  );
}
