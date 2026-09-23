import { useState } from "react";
import { ChevronLeft, Baby, ShieldCheck, Award, ChevronRight, Sparkles } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { IMPASTO, REGOLE, FORME } from "@/lib/paneDeiPiccoli";
import { LS } from "@/lib/sitorTools";
import Attestato from "@/components/officina/Attestato";

// V103 — IL PANE DEI PICCOLI. Fare il pane con i bambini: un impasto base facile, sei forme da modellare, i passi per il
// bambino e per l'adulto, cinque regole di sicurezza, e alla fine il diploma del piccolo fornaio. Scritto da Sitor (IA),
// distinto dalle ricette di Michele. Tutto nel telefono.

const KEY = "mikilab_piccoli";

function Disegno({ k }) {
  const f = "#E9C98A", s = "#8A5A2B";
  const P = {
    chiocciola: <g><path d="M60,46 m-26,0 a26,26 0 1,1 52,0 a18,18 0 1,1 -36,0 a10,10 0 1,1 20,0" fill="none" stroke={f} strokeWidth="9" strokeLinecap="round" /><path d="M60,46 m-26,0 a26,26 0 1,1 52,0 a18,18 0 1,1 -36,0 a10,10 0 1,1 20,0" fill="none" stroke={s} strokeWidth="1" opacity=".5" /><circle cx="94" cy="40" r="2" fill={s} /></g>,
    riccio: <g><path d="M22,48 q10,-26 44,-24 q34,2 32,26 q-4,14 -36,14 q-34,0 -40,-16 z" fill={f} stroke={s} strokeWidth="2" />{[44, 56, 68, 80].map((x) => <path key={x} d={`M${x},30 l4,-10 l4,10`} fill="none" stroke={s} strokeWidth="1.5" />)}<circle cx="24" cy="48" r="2.5" fill={s} /></g>,
    treccina: <g>{[0, 1, 2].map((i) => <path key={i} d={`M${18 + i * 6},${30 + i * 5} q22,${i % 2 ? 14 : -14} 42,0 t42,0`} fill="none" stroke={f} strokeWidth="9" strokeLinecap="round" />)}{[0, 1, 2].map((i) => <path key={i} d={`M${18 + i * 6},${30 + i * 5} q22,${i % 2 ? 14 : -14} 42,0 t42,0`} fill="none" stroke={s} strokeWidth=".8" opacity=".5" />)}</g>,
    pizzetta: <g><circle cx="60" cy="44" r="30" fill={f} stroke={s} strokeWidth="2" /><circle cx="60" cy="44" r="22" fill="#D9603B" opacity=".8" /><circle cx="50" cy="38" r="3" fill="#2A2320" /><circle cx="70" cy="38" r="3" fill="#2A2320" /><path d="M48,50 q12,10 24,0" fill="none" stroke="#2A2320" strokeWidth="2" /></g>,
    girella: <g><circle cx="60" cy="44" r="28" fill={f} stroke={s} strokeWidth="2" /><path d="M60,44 m-20,0 a20,20 0 1,1 40,0 a13,13 0 1,1 -26,0 a6,6 0 1,1 12,0" fill="none" stroke="#B23A48" strokeWidth="4" /></g>,
    cuore: <g><path d="M60,70 L28,42 a16,16 0 0,1 32,-16 a16,16 0 0,1 32,16 z" fill={f} stroke={s} strokeWidth="2" /></g>,
  };
  return <svg viewBox="0 0 120 84" className="w-full h-16" aria-hidden>{P[k] || null}</svg>;
}

export default function PaneDeiPiccoli({ onBack }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const L = (o) => (lang === "de" ? o.de : lang === "en" ? o.en : o.it);
  const [kids, setKids] = useState(() => Number(LS.get(KEY, 2)) || 2);
  const [sel, setSel] = useState(null);
  const [dip, setDip] = useState(false);
  const setK = (n) => { const v = Math.max(1, Math.min(30, n)); setKids(v); LS.set(KEY, v); };
  const doughTotal = kids * IMPASTO.perChild;
  const flour = Math.round(doughTotal / ((100 + IMPASTO.water + IMPASTO.yeastFresh + IMPASTO.salt + IMPASTO.oil + IMPASTO.sugar) / 100) / 10) * 10;
  const g = (p) => Math.round(flour * p / 100);
  const cur = FORME.find((x) => x.k === sel);

  return (
    <div data-testid="piccoli-page" className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <button data-testid="piccoli-back" onClick={onBack} className="inline-flex items-center gap-1 text-muted-foreground text-sm font-bold"><ChevronLeft className="w-4 h-4" />{tri("Indietro", "Zurück", "Back")}</button>
      <div>
        <p className="font-mono-data text-[10px] tracking-[0.25em] uppercase text-primary flex items-center gap-1.5"><Baby className="w-3 h-3" />MikiLab</p>
        <h1 className="font-display text-2xl font-black text-foreground">{tri("Il pane dei piccoli", "Das Brot der Kleinen", "Bread for little ones")}</h1>
        <div className="mk-oro-line mt-2 mb-1" />
        <p className="text-sm text-muted-foreground mt-1">{tri("Fare il pane con i bambini, dai tre anni in su: un impasto facile che si modella come la plastilina, sei forme, i passi per loro e quelli per te. Alla fine, il diploma del piccolo fornaio.", "Brot backen mit Kindern, ab drei Jahren: ein einfacher Teig, der sich wie Knete formen lässt, sechs Formen, die Schritte für sie und die für dich. Am Ende die Urkunde des kleinen Bäckers.", "Baking bread with children, from three years up: an easy dough that shapes like play-dough, six shapes, the steps for them and the ones for you. At the end, the little baker's diploma.")}</p>
        <p data-testid="piccoli-disclaimer" className="mt-2 text-[12px] text-salvia leading-snug rounded-xl border border-salvia/40 bg-salvia/8 px-3 py-2 flex items-start gap-1.5"><Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5" />{tri("Sezione scritta da Sitor, la guida IA di MikiLab: non sono ricette di Michele, e per questo sta qui, a parte, con il suo nome.", "Abschnitt von Sitor, dem KI-Guide von MikiLab: keine Rezepte von Michele, deshalb steht er hier, getrennt, unter seinem Namen.", "Section written by Sitor, MikiLab's AI guide: not Michele's recipes, which is why it sits here, apart, under his name.")}</p>
      </div>
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
        <div className="grid grid-cols-2 gap-2.5" data-testid="piccoli-grid">
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
      <p className="text-[13px] text-salvia leading-snug">{tri("Sitor: il primo pane di un bambino non deve essere buono. Deve essere suo.", "Sitor: das erste Brot eines Kindes muss nicht gut sein. Es muss seins sein.", "Sitor: a child's first bread doesn't have to be good. It has to be theirs.")}</p>
    </div>
  );
}
