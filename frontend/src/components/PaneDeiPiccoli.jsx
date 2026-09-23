import { useState, useEffect, useRef } from "react";
import { ChevronLeft, Baby, ShieldCheck, Award, ChevronRight, Sparkles, BookOpen, Moon, Gamepad2, GraduationCap, Volume2, Square, Printer } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { IMPASTO, REGOLE, FORME, STORIA, NOTTE, GIOCO, MAESTRA } from "@/lib/paneDeiPiccoli";
import { LS } from "@/lib/sitorTools";
import { playTTSLong, stopTTS } from "@/lib/tts";
import { award } from "@/lib/medaglie";
import Attestato from "@/components/officina/Attestato";

// V103 — IL PANE DEI PICCOLI. Fare il pane con i bambini: un impasto base facile, le forme da modellare, i passi per il
// bambino e per l'adulto, cinque regole di sicurezza, e alla fine il diploma del piccolo fornaio. Scritto da Sitor (IA),
// distinto dalle ricette di Michele. Tutto nel telefono.
// V111 — cinque schede: dodici forme, La storia del pane (sei capitoli con domanda), La notte del fornaio ora per ora,
// Il gioco del lievito (medaglia «Piccolo fornaio»), Per la maestra (un'ora in classe, cosa serve, stampa, diploma della classe).

const KEY = "mikilab_piccoli";
const nav = (r) => { try { window.dispatchEvent(new CustomEvent("mikilab-nav", { detail: { route: r } })); } catch { /* */ } };

function Disegno({ k }) {
  const f = "#E9C98A", s = "#8A5A2B";
  const P = {
    chiocciola: <g><path d="M60,46 m-26,0 a26,26 0 1,1 52,0 a18,18 0 1,1 -36,0 a10,10 0 1,1 20,0" fill="none" stroke={f} strokeWidth="9" strokeLinecap="round" /><path d="M60,46 m-26,0 a26,26 0 1,1 52,0 a18,18 0 1,1 -36,0 a10,10 0 1,1 20,0" fill="none" stroke={s} strokeWidth="1" opacity=".5" /><circle cx="94" cy="40" r="2" fill={s} /></g>,
    riccio: <g><path d="M22,48 q10,-26 44,-24 q34,2 32,26 q-4,14 -36,14 q-34,0 -40,-16 z" fill={f} stroke={s} strokeWidth="2" />{[44, 56, 68, 80].map((x) => <path key={x} d={`M${x},30 l4,-10 l4,10`} fill="none" stroke={s} strokeWidth="1.5" />)}<circle cx="24" cy="48" r="2.5" fill={s} /></g>,
    treccina: <g>{[0, 1, 2].map((i) => <path key={i} d={`M${18 + i * 6},${30 + i * 5} q22,${i % 2 ? 14 : -14} 42,0 t42,0`} fill="none" stroke={f} strokeWidth="9" strokeLinecap="round" />)}{[0, 1, 2].map((i) => <path key={i} d={`M${18 + i * 6},${30 + i * 5} q22,${i % 2 ? 14 : -14} 42,0 t42,0`} fill="none" stroke={s} strokeWidth=".8" opacity=".5" />)}</g>,
    pizzetta: <g><circle cx="60" cy="44" r="30" fill={f} stroke={s} strokeWidth="2" /><circle cx="60" cy="44" r="22" fill="#D9603B" opacity=".8" /><circle cx="50" cy="38" r="3" fill="#2A2320" /><circle cx="70" cy="38" r="3" fill="#2A2320" /><path d="M48,50 q12,10 24,0" fill="none" stroke="#2A2320" strokeWidth="2" /></g>,
    girella: <g><circle cx="60" cy="44" r="28" fill={f} stroke={s} strokeWidth="2" /><path d="M60,44 m-20,0 a20,20 0 1,1 40,0 a13,13 0 1,1 -26,0 a6,6 0 1,1 12,0" fill="none" stroke="#B23A48" strokeWidth="4" /></g>,
    cuore: <g><path d="M60,70 L28,42 a16,16 0 0,1 32,-16 a16,16 0 0,1 32,16 z" fill={f} stroke={s} strokeWidth="2" /></g>,
    serpente: <g><path d="M14,52 q16,-30 32,0 t32,0 t28,-14" fill="none" stroke={f} strokeWidth="10" strokeLinecap="round" /><path d="M14,52 q16,-30 32,0 t32,0 t28,-14" fill="none" stroke={s} strokeWidth="1" opacity=".5" /><circle cx="104" cy="36" r="2" fill={s} /></g>,
    ciambella: <g><circle cx="60" cy="44" r="28" fill={f} stroke={s} strokeWidth="2" /><circle cx="60" cy="44" r="9" fill="#fff" stroke={s} strokeWidth="2" />{[30, 90, 150, 210, 270, 330].map((a) => <circle key={a} cx={60 + 18 * Math.cos(a * Math.PI / 180)} cy={44 + 18 * Math.sin(a * Math.PI / 180)} r="1.6" fill={s} />)}</g>,
    sole: <g><circle cx="60" cy="44" r="20" fill={f} stroke={s} strokeWidth="2" />{[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((a) => <path key={a} d={`M${60 + 22 * Math.cos(a * Math.PI / 180)},${44 + 22 * Math.sin(a * Math.PI / 180)} L${60 + 34 * Math.cos(a * Math.PI / 180)},${44 + 34 * Math.sin(a * Math.PI / 180)}`} stroke={f} strokeWidth="5" strokeLinecap="round" />)}</g>,
    stella: <g><path d="M60,14 L69,36 L93,37 L74,52 L80,75 L60,62 L40,75 L46,52 L27,37 L51,36 Z" fill={f} stroke={s} strokeWidth="2" strokeLinejoin="round" /></g>,
    lettera: <g><path d="M30,66 L45,20 L60,66 M37,50 L53,50" fill="none" stroke={f} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" /><path d="M72,22 v44 h20 a11,11 0 0,0 0,-22 h-20 h18 a11,11 0 0,0 0,-22 z" fill="none" stroke={f} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" /></g>,
    nido: <g><circle cx="60" cy="48" r="26" fill="none" stroke={f} strokeWidth="11" /><circle cx="60" cy="48" r="26" fill="none" stroke={s} strokeWidth="1" opacity=".4" strokeDasharray="4 6" /><ellipse cx="60" cy="46" rx="12" ry="15" fill="#F7EBD3" stroke={s} strokeWidth="1.5" /></g>,
  };
  return <svg viewBox="0 0 120 84" className="w-full h-16" aria-hidden>{P[k] || null}</svg>;
}

const CSS_STAMPA = `
.pdp-print{display:none}
@media print{
  body.pdp-printing *{visibility:hidden}
  body.pdp-printing .pdp-print,body.pdp-printing .pdp-print *{visibility:visible}
  body.pdp-printing .pdp-print{display:block;position:absolute;left:0;top:0;width:100%;padding:10mm 12mm;background:#fff;color:#000;font-size:12pt;line-height:1.45}
  .pdp-print h1{font-size:20pt;margin:2mm 0 1mm;font-weight:700}
  .pdp-print p{margin:1.5mm 0}
  .pdp-print ol,.pdp-print ul{margin:1mm 0 2mm;padding-left:6mm}
  .pdp-print-pie{margin-top:8mm;font-size:9pt;color:#555;border-top:1px solid #999;padding-top:2mm}
}`;

export default function PaneDeiPiccoli({ onBack }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const L = (o) => (lang === "de" ? o.de : lang === "en" ? o.en : o.it);
  const Lt = (o) => (o && (o[lang] || o.it)) || ""; // testi con chiave lingua
  const [kids, setKids] = useState(() => Number(LS.get(KEY, 2)) || 2);
  const [sel, setSel] = useState(null);
  const [dip, setDip] = useState(false);
  const [tab, setTab] = useState("forme");
  const setK = (n) => { const v = Math.max(1, Math.min(30, n)); setKids(v); LS.set(KEY, v); };
  const doughTotal = kids * IMPASTO.perChild;
  const flour = Math.round(doughTotal / ((100 + IMPASTO.water + IMPASTO.yeastFresh + IMPASTO.salt + IMPASTO.oil + IMPASTO.sugar) / 100) / 10) * 10;
  const g = (p) => Math.round(flour * p / 100);
  const cur = FORME.find((x) => x.k === sel);

  // V111 — storia: capitolo aperto e lettura a voce
  const [cap, setCap] = useState(0);
  const [leggo, setLeggo] = useState(false);
  const leggoRef = useRef(false); leggoRef.current = leggo;
  const primo = useRef(true);
  useEffect(() => () => { if (leggoRef.current) stopTTS(); }, []);
  useEffect(() => { if (primo.current) { primo.current = false; return; } if (leggoRef.current) { stopTTS(); setLeggo(false); } }, [tab, cap]);
  const leggiCap = () => {
    if (leggo) { stopTTS(); setLeggo(false); return; }
    const c = STORIA[cap]; setLeggo(true);
    playTTSLong(`${Lt(c.t)}. ${Lt(c.p)} ${Lt(c.q)}`, { lang: lang === "de" ? "de" : lang === "en" ? "en" : "it", onEnded: () => setLeggo(false) });
  };

  // V111 — il gioco del lievito
  const [gi, setGi] = useState(0);
  const [gp, setGp] = useState(0);
  const [gs, setGs] = useState(null);
  const gioFine = gi >= GIOCO.length;
  useEffect(() => { if (gioFine) award("piccolo_fornaio"); }, [gioFine]);
  const gq = GIOCO[gi];

  // V111 — stampa dell'ora in classe
  const [stampa, setStampa] = useState(false);
  useEffect(() => {
    if (!stampa) return undefined;
    document.body.classList.add("pdp-printing");
    const chiudi = () => { document.body.classList.remove("pdp-printing"); setStampa(false); };
    window.addEventListener("afterprint", chiudi);
    const t = setTimeout(() => { try { window.print(); } catch { chiudi(); } }, 120);
    const t2 = setTimeout(chiudi, 60000);
    return () => { clearTimeout(t); clearTimeout(t2); window.removeEventListener("afterprint", chiudi); document.body.classList.remove("pdp-printing"); };
  }, [stampa]);

  const TABS = [["forme", Baby, tri("Le forme", "Die Formen", "The shapes")], ["storia", BookOpen, tri("La storia del pane", "Die Brotgeschichte", "The story of bread")], ["notte", Moon, tri("La notte del fornaio", "Die Nacht des Bäckers", "The baker's night")], ["gioco", Gamepad2, tri("Il gioco del lievito", "Das Hefespiel", "The yeast game")], ["maestra", GraduationCap, tri("Per la maestra", "Für die Lehrkraft", "For the teacher")]];

  return (
    <div data-testid="piccoli-page" className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <style>{CSS_STAMPA}</style>
      <button data-testid="piccoli-back" onClick={onBack} className="inline-flex items-center gap-1 text-muted-foreground text-sm font-bold"><ChevronLeft className="w-4 h-4" />{tri("Indietro", "Zurück", "Back")}</button>
      <div>
        <p className="font-mono-data text-[10px] tracking-[0.25em] uppercase text-primary flex items-center gap-1.5"><Baby className="w-3 h-3" />MikiLab</p>
        <h1 className="font-display text-2xl font-black text-foreground">{tri("Il pane dei piccoli", "Das Brot der Kleinen", "Bread for little ones")}</h1>
        <div className="mk-oro-line mt-2 mb-1" />
        <p className="text-sm text-muted-foreground mt-1">{tri("Fare il pane con i bambini, dai tre anni in su: un impasto facile che si modella come la plastilina, dodici forme, la storia del pane, la notte del fornaio, un gioco e, alla fine, il diploma del piccolo fornaio.", "Brot backen mit Kindern, ab drei Jahren: ein einfacher Teig, der sich wie Knete formen lässt, zwölf Formen, die Brotgeschichte, die Nacht des Bäckers, ein Spiel und am Ende die Urkunde des kleinen Bäckers.", "Baking bread with children, from three years up: an easy dough that shapes like play-dough, twelve shapes, the story of bread, the baker's night, a game and, at the end, the little baker's diploma.")}</p>
        <p data-testid="piccoli-disclaimer" className="mt-2 text-[12px] text-salvia leading-snug rounded-xl border border-salvia/40 bg-salvia/8 px-3 py-2 flex items-start gap-1.5"><Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5" />{tri("Sezione scritta da Sitor, la guida IA di MikiLab: non sono ricette di Michele, e per questo sta qui, a parte, con il suo nome.", "Abschnitt von Sitor, dem KI-Guide von MikiLab: keine Rezepte von Michele, deshalb steht er hier, getrennt, unter seinem Namen.", "Section written by Sitor, MikiLab's AI guide: not Michele's recipes, which is why it sits here, apart, under his name.")}</p>
      </div>

      <nav className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 [scrollbar-width:none]" aria-label={tri("Il pane dei piccoli", "Das Brot der Kleinen", "Bread for little ones")}>
        {TABS.map(([k, Icon, t]) => <button key={k} data-testid={`piccoli-tab-${k}`} onClick={() => setTab(k)} aria-current={tab === k ? "page" : undefined} className={`shrink-0 inline-flex items-center gap-1.5 text-[12.5px] font-bold px-3 py-1.5 rounded-full border transition-colors ${tab === k ? "bg-primary border-primary text-white" : "border-border bg-card text-foreground"}`}><Icon className="w-3.5 h-3.5" />{t}</button>)}
      </nav>

      {tab === "forme" && (<>
      <div data-testid="piccoli-regole" className="rounded-2xl border border-primary/30 bg-primary/5 p-3">
        <p className="font-mono-data text-[10px] tracking-[0.25em] uppercase text-primary mb-1.5 flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" />{tri("Le cinque regole (leggerle insieme)", "Die fünf Regeln (gemeinsam lesen)", "The five rules (read them together)")}</p>
        <ol className="space-y-1">{L(REGOLE).map((r, i) => <li key={i} className="flex gap-2 text-[13px] text-foreground/90 leading-snug"><span className="font-mono-data text-primary shrink-0">{i + 1}.</span><span>{r}</span></li>)}</ol>
      </div>
      <div className="rounded-2xl border border-border bg-card p-3 space-y-2">
        <div className="flex items-center gap-3"><span className="text-[13px] font-bold text-foreground">{tri("Quanti bambini", "Wie viele Kinder", "How many children")}</span><div className="ml-auto inline-flex items-center rounded-lg border border-border overflow-hidden"><button data-testid="piccoli-minus" onClick={() => setK(kids - 1)} className="px-3 py-1.5 text-foreground font-bold">−</button><span data-testid="piccoli-kids" className="px-3 font-mono-data font-bold text-foreground">{kids}</span><button data-testid="piccoli-plus" onClick={() => setK(kids + 1)} className="px-3 py-1.5 text-foreground font-bold">+</button></div></div>
        <p className="font-mono-data text-[10px] tracking-[0.25em] uppercase text-muted-foreground">{tri(`L'impasto (${IMPASTO.perChild} g a testa)`, `Der Teig (${IMPASTO.perChild} g pro Kopf)`, `The dough (${IMPASTO.perChild} g each)`)}</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[13px]">
          {[[tri("farina 0 (o Typ 550)", "Mehl Typ 550", "plain flour"), `${flour} g`], [tri("acqua tiepida", "lauwarmes Wasser", "lukewarm water"), `${g(IMPASTO.water)} g`], [tri("lievito di birra fresco", "Frischhefe", "fresh yeast"), `${(flour * IMPASTO.yeastFresh / 100).toFixed(1).replace(".", ",")} g`], [tri("sale", "Salz", "salt"), `${g(IMPASTO.salt)} g`], [tri("olio", "Öl", "oil"), `${g(IMPASTO.oil)} g`], [tri("zucchero", "Zucker", "sugar"), `${g(IMPASTO.sugar)} g`]].map(([a, b], i) => <p key={i} className="flex justify-between"><span className="text-foreground/85">{a}</span><b className="font-mono-data text-foreground">{b}</b></p>)}
        </div>
        <ol className="space-y-1 pt-1">{L(IMPASTO.steps).map((s, i) => <li key={i} className="flex gap-2 text-[12.5px] text-foreground/90 leading-snug"><span className="font-mono-data text-primary shrink-0">{i + 1}.</span><span>{s}</span></li>)}</ol>
      </div>
      {!cur ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5" data-testid="piccoli-grid">
          {FORME.map((x) => <button key={x.k} data-testid={`piccoli-${x.k}`} onClick={() => { setSel(x.k); }} className="text-left rounded-2xl border border-border bg-card p-3 active:scale-[0.98] hover:border-primary/60 transition-all"><Disegno k={x.k} /><p className="font-display text-[15px] font-bold text-foreground leading-tight mt-1">{L(x.name)}</p><p className="text-[11px] text-muted-foreground">{tri(`dai ${x.age} anni`, `ab ${x.age} Jahren`, `from ${x.age} years`)}</p></button>)}
        </div>
      ) : (
        <div data-testid="piccoli-detail" className="space-y-3">
          <button data-testid="piccoli-close" onClick={() => setSel(null)} className="text-[12.5px] font-bold text-primary">← {tri("Tutte le forme", "Alle Formen", "All shapes")}</button>
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 flex items-center gap-3"><div className="w-28 shrink-0"><Disegno k={cur.k} /></div><div><h2 className="font-display text-2xl font-bold text-foreground leading-tight">{L(cur.name)}</h2><p className="text-[12px] text-muted-foreground">{tri(`dai ${cur.age} anni · un pezzo da ${IMPASTO.perChild} g`, `ab ${cur.age} Jahren · ein Stück von ${IMPASTO.perChild} g`, `from ${cur.age} years · one ${IMPASTO.perChild} g piece`)}</p></div></div>
          <div className="rounded-2xl border border-salvia/40 bg-salvia/8 p-3"><p className="font-mono-data text-[10px] tracking-[0.25em] uppercase text-salvia mb-1.5">{tri("Per te (bambino)", "Für dich (Kind)", "For you (child)")}</p><ol className="space-y-1.5">{L(cur.kid).map((s, i) => <li key={i} className="flex gap-2 text-[14px] text-foreground leading-snug"><span className="font-mono-data text-salvia shrink-0">{i + 1}.</span><span>{s}</span></li>)}</ol></div>
          <div className="rounded-2xl border border-border bg-card p-3"><p className="font-mono-data text-[10px] tracking-[0.25em] uppercase text-muted-foreground mb-1">{tri("Per l'adulto", "Für den Erwachsenen", "For the grown-up")}</p><p className="text-[13px] text-foreground/90 leading-snug">{L(cur.adult)}</p></div>
          <button data-testid="piccoli-next" onClick={() => { const i = FORME.findIndex((x) => x.k === cur.k); setSel(FORME[(i + 1) % FORME.length].k); }} className="inline-flex items-center gap-1 text-[12.5px] font-bold px-3 py-2 rounded-xl border border-border bg-card text-foreground active:scale-95">{tri("Forma successiva", "Nächste Form", "Next shape")}<ChevronRight className="w-4 h-4" /></button>
        </div>
      )}
      <div className="rounded-2xl border border-border bg-card p-3 space-y-2">
        <p className="font-mono-data text-[10px] tracking-[0.25em] uppercase text-muted-foreground flex items-center gap-1.5"><Award className="w-3.5 h-3.5" />{tri("Il diploma del piccolo fornaio", "Die Urkunde des kleinen Bäckers", "The little baker's diploma")}</p>
        <p className="text-[12.5px] text-foreground/85 leading-snug">{tri("Quando il pane esce dal forno: il nome (o il soprannome) del bambino, la data, e il diploma da appendere.", "Wenn das Brot aus dem Ofen kommt: Name (oder Spitzname) des Kindes, das Datum, und die Urkunde zum Aufhängen.", "When the bread comes out of the oven: the child's name (or nickname), the date, and the diploma to hang up.")}</p>
        {dip ? <Attestato lang={lang} title={tri("ha fatto il pane con le sue mani, contando fino a cento", "mit eigenen Händen Brot gebacken hat, bis hundert zählend", "baked bread with their own hands, counting to a hundred")} /> : <button data-testid="piccoli-diploma" onClick={() => setDip(true)} className="inline-flex items-center gap-1.5 text-[12.5px] font-bold px-3 py-2 rounded-xl bg-primary text-white active:scale-95"><Award className="w-4 h-4" />{tri("Prepara il diploma", "Urkunde vorbereiten", "Prepare the diploma")}</button>}
      </div>
      </>)}

      {tab === "storia" && (
        <div data-testid="piccoli-storia" className="space-y-2">
          <p className="text-[13px] text-muted-foreground leading-snug">{tri("Sei capitoli da leggere insieme, uno alla volta. Alla fine di ognuno c'è una domanda: non ha una risposta giusta, ha la vostra.", "Sechs Kapitel zum gemeinsamen Lesen, eins nach dem anderen. Am Ende jedes Kapitels steht eine Frage: Sie hat keine richtige Antwort, sondern eure.", "Six chapters to read together, one at a time. At the end of each there is a question: it has no right answer, it has yours.")}</p>
          <div className="flex gap-1.5 flex-wrap">{STORIA.map((c, i) => <button key={i} data-testid={`piccoli-cap-${i}`} onClick={() => setCap(i)} className={`w-8 h-8 rounded-full font-mono-data text-[12px] font-bold ${cap === i ? "bg-primary text-white" : "border border-border bg-card text-foreground"}`}>{i + 1}</button>)}</div>
          <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
            <p className="font-mono-data text-[10px] tracking-[0.25em] uppercase text-primary">{tri("Capitolo", "Kapitel", "Chapter")} {cap + 1} / {STORIA.length}</p>
            <h2 className="font-display text-xl font-black text-foreground leading-tight">{Lt(STORIA[cap].t)}</h2>
            <p className="text-[14.5px] text-foreground leading-relaxed">{Lt(STORIA[cap].p)}</p>
            <div className="rounded-xl border border-salvia/40 bg-salvia/8 px-3 py-2"><p className="font-mono-data text-[10px] tracking-[0.25em] uppercase text-salvia">{tri("La domanda di Sitor", "Sitors Frage", "Sitor's question")}</p><p className="text-[14px] text-foreground">«{Lt(STORIA[cap].q)}»</p></div>
            <div className="flex flex-wrap gap-2 pt-1">
              <button data-testid="piccoli-storia-leggi" onClick={leggiCap} aria-pressed={leggo} className={`inline-flex items-center gap-1.5 text-[12.5px] font-bold px-3 py-2 rounded-xl active:scale-95 ${leggo ? "bg-salvia text-white" : "border border-salvia/60 text-salvia bg-card"}`}>{leggo ? <Square className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}{leggo ? tri("Ferma", "Stopp", "Stop") : tri("Sitor legge", "Sitor liest vor", "Sitor reads")}</button>
              {cap < STORIA.length - 1 && <button data-testid="piccoli-storia-avanti" onClick={() => setCap(cap + 1)} className="inline-flex items-center gap-1 text-[12.5px] font-bold px-3 py-2 rounded-xl border border-border bg-card text-foreground active:scale-95">{tri("Capitolo successivo", "Nächstes Kapitel", "Next chapter")}<ChevronRight className="w-4 h-4" /></button>}
            </div>
          </div>
        </div>
      )}

      {tab === "notte" && (
        <div data-testid="piccoli-notte" className="space-y-2">
          <p className="text-[13px] text-muted-foreground leading-snug">{tri("Cosa succede in un forno mentre tutti dormono. Con Michele e i panettieri di Miglionico, che gli hanno insegnato il mestiere.", "Was in einer Backstube passiert, während alle schlafen. Mit Michele und den Bäckern von Miglionico, die ihm das Handwerk beigebracht haben.", "What happens in a bakery while everyone sleeps. With Michele and the bakers of Miglionico, who taught him the trade.")}</p>
          <ol className="relative border-l-2 border-primary/40 ml-3 space-y-3">
            {NOTTE.map((n, i) => (
              <li key={i} className="pl-4">
                <span className="absolute -left-[9px] mt-1 w-4 h-4 rounded-full bg-primary border-2 border-background" aria-hidden />
                <p className="font-mono-data text-[12px] font-bold text-primary">{n.h}</p>
                <p className="text-[13.5px] text-foreground leading-snug">{Lt(n)}</p>
              </li>
            ))}
          </ol>
          <p className="text-[13px] text-salvia leading-snug">{tri("Sitor: il panettiere non fa magie. Fa la stessa cosa ogni notte, con cura. La magia la fa il lievito.", "Sitor: Der Bäcker zaubert nicht. Er macht jede Nacht dasselbe, mit Sorgfalt. Die Magie macht die Hefe.", "Sitor: the baker doesn't do magic. He does the same thing every night, with care. The magic is the yeast's.")}</p>
        </div>
      )}

      {tab === "gioco" && (
        <div data-testid="piccoli-gioco" className="rounded-2xl border border-border bg-card p-4 space-y-2" aria-live="polite">
          {gioFine ? (
            <div className="space-y-2">
              <p className="font-display text-xl font-black text-primary">{tri("Punteggio", "Punkte", "Score")}: {gp} / {GIOCO.length}</p>
              <p className="text-[14px] text-foreground">{gp === GIOCO.length ? tri("Tutte giuste! Sitor ti nomina Piccolo fornaio: la medaglia è tua.", "Alles richtig! Sitor ernennt dich zum kleinen Bäcker: Die Medaille gehört dir.", "All correct! Sitor names you Little baker: the medal is yours.") : tri("Bravo! Hai finito il gioco: la medaglia «Piccolo fornaio» è tua. Il lievito impara con calma, anche tu.", "Gut gemacht! Du hast das Spiel geschafft: Die Medaille „Kleiner Bäcker“ gehört dir. Hefe lernt in Ruhe, du auch.", "Well done! You finished the game: the “Little baker” medal is yours. Yeast learns slowly, so do you.")}</p>
              <button data-testid="piccoli-gioco-ricomincia" onClick={() => { setGi(0); setGp(0); setGs(null); }} className="inline-flex items-center gap-1.5 text-[12.5px] font-bold px-3 py-2 rounded-xl bg-primary text-white active:scale-95">{tri("Ricomincia", "Noch einmal", "Start again")}</button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="font-mono-data text-[10px] tracking-[0.25em] uppercase text-muted-foreground">{gi + 1} / {GIOCO.length}</p>
              <p className="font-display text-lg font-bold text-foreground leading-tight">{Lt(gq.d)}</p>
              <div className="flex flex-col gap-1.5">
                {(gq.o[lang] || gq.o.it).map((o, k) => {
                  let cls = "border-border bg-background text-foreground";
                  if (gs !== null) { if (k === gq.r) cls = "border-salvia bg-salvia/15 text-foreground font-bold"; else if (k === gs) cls = "border-red-400/70 bg-red-400/10 text-foreground"; }
                  return <button key={k} data-testid={`piccoli-gioco-opz-${k}`} disabled={gs !== null} onClick={() => { if (gs !== null) return; setGs(k); if (k === gq.r) setGp((p) => p + 1); }} className={`text-left text-[14px] rounded-xl border px-3 py-2 ${cls}`}>{o}</button>;
                })}
              </div>
              {gs !== null && <button data-testid="piccoli-gioco-avanti" onClick={() => { setGi((x) => x + 1); setGs(null); }} className="inline-flex items-center gap-1.5 text-[12.5px] font-bold px-3 py-2 rounded-xl bg-primary text-white active:scale-95">{tri("Avanti", "Weiter", "Next")}</button>}
            </div>
          )}
        </div>
      )}

      {tab === "maestra" && (
        <div data-testid="piccoli-maestra" className="space-y-3">
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-3 flex items-center gap-3">
            <GraduationCap className="w-6 h-6 text-primary shrink-0" />
            <div className="flex-1 min-w-0"><p className="text-[13.5px] text-foreground leading-snug"><b>{tri("Un'ora in classe", "Eine Stunde in der Klasse", "One hour in class")}</b> — {tri("con questa pagina. Per un programma di tutto l'anno, dall'asilo alla quinta, c'è MikiLab a scuola.", "mit dieser Seite. Für ein Programm fürs ganze Jahr, von der Kita bis zur fünften Klasse, gibt es MikiLab in der Schule.", "with this page. For a whole-year programme, from kindergarten to fifth grade, there is MikiLab at school.")}</p></div>
            <button data-testid="piccoli-vai-scuola" onClick={() => nav("scuola")} className="shrink-0 inline-flex items-center gap-1 text-[12px] font-bold px-2.5 py-2 rounded-xl bg-primary text-white active:scale-95">{tri("MikiLab a scuola", "MikiLab in der Schule", "MikiLab at school")}<ChevronRight className="w-3.5 h-3.5" /></button>
          </div>
          <div className="rounded-2xl border border-border bg-card p-3">
            <p className="font-mono-data text-[10px] tracking-[0.25em] uppercase text-primary mb-1.5">{tri("Cosa serve", "Was man braucht", "What you need")}</p>
            <ul className="space-y-1">{(MAESTRA.serve[lang] || MAESTRA.serve.it).map((r, i) => <li key={i} className="flex gap-2 text-[13px] text-foreground/90 leading-snug"><span className="font-mono-data text-primary shrink-0">·</span><span>{r}</span></li>)}</ul>
          </div>
          <div className="rounded-2xl border border-border bg-card p-3">
            <p className="font-mono-data text-[10px] tracking-[0.25em] uppercase text-primary mb-1.5">{tri("L'ora, minuto per minuto", "Die Stunde, Minute für Minute", "The hour, minute by minute")}</p>
            <ol className="space-y-1.5">{MAESTRA.ora.map((r, i) => <li key={i} className="flex gap-2 text-[13px] text-foreground/90 leading-snug"><span className="font-mono-data text-primary shrink-0 w-12">{r.m}</span><span>{Lt(r)}</span></li>)}</ol>
          </div>
          <div className="flex flex-wrap gap-2">
            <button data-testid="piccoli-maestra-stampa" onClick={() => setStampa(true)} className="inline-flex items-center gap-1.5 text-[12.5px] font-bold px-3 py-2 rounded-xl border border-border bg-card text-foreground active:scale-95"><Printer className="w-4 h-4" />{tri("Stampa l'ora in classe", "Stunde drucken", "Print the class hour")}</button>
          </div>
          <div className="rounded-2xl border border-border bg-card p-3 space-y-2">
            <p className="font-mono-data text-[10px] tracking-[0.25em] uppercase text-muted-foreground flex items-center gap-1.5"><Award className="w-3.5 h-3.5" />{tri("Il diploma della classe", "Die Klassenurkunde", "The class diploma")}</p>
            <p className="text-[12.5px] text-foreground/85 leading-snug">{tri("Un soprannome per la classe (es. «I panettieri della 2ª B»), la data, e il diploma da appendere in aula.", "Ein Spitzname für die Klasse (z. B. „Die Bäcker der 2b“), das Datum, und die Urkunde fürs Klassenzimmer.", "A nickname for the class (e.g. “The bakers of 2B”), the date, and the diploma for the classroom wall.")}</p>
            <Attestato lang={lang} title={tri("ha fatto il pane in classe, con le sue mani e le sue regole", "in der Klasse Brot gebacken hat, mit eigenen Händen und eigenen Regeln", "baked bread in class, with their own hands and their own rules")} />
          </div>
          <div className="pdp-print">
            <h1>MikiLab · {tri("Il pane dei piccoli: un'ora in classe", "Das Brot der Kleinen: eine Stunde in der Klasse", "Bread for little ones: one hour in class")}</h1>
            <p><b>{tri("Le cinque regole", "Die fünf Regeln", "The five rules")}</b></p>
            <ol>{L(REGOLE).map((r, i) => <li key={i}>{r}</li>)}</ol>
            <p><b>{tri("L'impasto per", "Der Teig für", "The dough for")} {kids} {tri("bambini", "Kinder", "children")}</b>: {tri("farina", "Mehl", "flour")} {flour} g · {tri("acqua", "Wasser", "water")} {g(IMPASTO.water)} g · {tri("lievito", "Hefe", "yeast")} {(flour * IMPASTO.yeastFresh / 100).toFixed(1)} g · {tri("sale", "Salz", "salt")} {g(IMPASTO.salt)} g · {tri("olio", "Öl", "oil")} {g(IMPASTO.oil)} g · {tri("zucchero", "Zucker", "sugar")} {g(IMPASTO.sugar)} g</p>
            <p><b>{tri("Cosa serve", "Was man braucht", "What you need")}</b></p>
            <ul>{(MAESTRA.serve[lang] || MAESTRA.serve.it).map((r, i) => <li key={i}>{r}</li>)}</ul>
            <p><b>{tri("L'ora", "Die Stunde", "The hour")}</b></p>
            <ol>{MAESTRA.ora.map((r, i) => <li key={i}>{r.m}: {Lt(r)}</li>)}</ol>
            <p className="pdp-print-pie">mikilab.de/piccoli · mikilab.de/scuola</p>
          </div>
        </div>
      )}

      <p className="text-[13px] text-salvia leading-snug">{tri("Sitor: il primo pane di un bambino non deve essere buono. Deve essere suo.", "Sitor: das erste Brot eines Kindes muss nicht gut sein. Es muss seins sein.", "Sitor: a child's first bread doesn't have to be good. It has to be theirs.")}</p>
    </div>
  );
}
