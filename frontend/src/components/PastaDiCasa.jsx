import { useState } from "react";
import { ChevronLeft, Wheat, Clock, Utensils, ChevronRight, Sparkles } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { PASTA } from "@/lib/pastaDiCasa";
import { LS } from "@/lib/sitorTools";
import MieiAppunti from "@/components/officina/MieiAppunti";

// V102 — ACQUA E FARINA: LA PASTA DI CASA. Una sezione nuova, creata da Sitor (IA) e distinta dalle ricette di Michele:
// dodici forme di pasta fresca, quasi tutte solo acqua e semola, con il cuore in Basilicata e Puglia. Dosi a persona,
// disegno della forma, tecnica passo per passo, cottura, condimento, consiglio, i tuoi appunti. Tutto nel telefono.

const KEY = "mikilab_pasta_persone";

// Disegni delle forme (SVG semplici, colore semola)
function Shape({ k }) {
  const f = "#E9C98A", s = "#8A5A2B";
  const P = {
    orecchiette: <g><ellipse cx="60" cy="42" rx="34" ry="24" fill={f} stroke={s} strokeWidth="2" /><ellipse cx="60" cy="44" rx="20" ry="12" fill="none" stroke={s} strokeWidth="1.5" opacity=".6" /></g>,
    cavatelli: <g><path d="M30,45 q30,-30 60,0 q-30,14 -60,0 z" fill={f} stroke={s} strokeWidth="2" /><path d="M42,40 q18,-10 36,0" fill="none" stroke={s} strokeWidth="1.5" opacity=".6" /></g>,
    strascinati: <g><path d="M18,44 q42,-34 84,0 q-42,18 -84,0 z" fill={f} stroke={s} strokeWidth="2" />{[30, 45, 60, 75, 90].map((x) => <line key={x} x1={x} y1="34" x2={x} y2="50" stroke={s} strokeWidth="1" opacity=".5" />)}</g>,
    capunti: <g><path d="M14,42 q46,-28 92,0 q-46,28 -92,0 z" fill={f} stroke={s} strokeWidth="2" /><path d="M30,42 q30,-12 60,0" fill="none" stroke={s} strokeWidth="1.5" opacity=".6" /></g>,
    ferricelli: <g><line x1="14" y1="42" x2="106" y2="42" stroke={s} strokeWidth="1" opacity=".4" />{[22, 40, 58, 76, 94].map((x) => <path key={x} d={`M${x},30 q9,12 0,24 q-9,-12 0,-24`} fill={f} stroke={s} strokeWidth="2" />)}</g>,
    lagane: <g>{[26, 44, 62].map((y) => <path key={y} d={`M14,${y} q23,-8 46,0 t46,0`} fill="none" stroke={f} strokeWidth="9" strokeLinecap="round" />)}{[26, 44, 62].map((y) => <path key={y} d={`M14,${y} q23,-8 46,0 t46,0`} fill="none" stroke={s} strokeWidth="1" opacity=".5" />)}</g>,
    manate: <g>{[22, 32, 42, 52, 62].map((y, i) => <path key={y} d={`M10,${y} q30,${i % 2 ? 8 : -8} 55,0 t45,0`} fill="none" stroke={f} strokeWidth="4" strokeLinecap="round" />)}</g>,
    trofie: <g>{[30, 60, 90].map((x) => <path key={x} d={`M${x - 12},56 q8,-30 24,-28 q-14,6 -8,26 z`} fill={f} stroke={s} strokeWidth="2" />)}</g>,
    pici: <g>{[26, 36, 46, 56].map((y, i) => <path key={y} d={`M12,${y} q25,${i % 2 ? 6 : -6} 50,0 t46,0`} fill="none" stroke={f} strokeWidth="6" strokeLinecap="round" />)}{[26, 36, 46, 56].map((y, i) => <path key={y} d={`M12,${y} q25,${i % 2 ? 6 : -6} 50,0 t46,0`} fill="none" stroke={s} strokeWidth=".8" opacity=".5" />)}</g>,
    tagliatelle: <g><ellipse cx="60" cy="42" rx="38" ry="22" fill="none" stroke={f} strokeWidth="8" /><ellipse cx="60" cy="42" rx="26" ry="14" fill="none" stroke={f} strokeWidth="8" /><ellipse cx="60" cy="42" rx="14" ry="7" fill="none" stroke={f} strokeWidth="7" /><ellipse cx="60" cy="42" rx="38" ry="22" fill="none" stroke={s} strokeWidth=".8" opacity=".5" /></g>,
    maltagliati: <g><path d="M18,28 l30,-6 l8,26 l-30,6 z" fill={f} stroke={s} strokeWidth="2" /><path d="M60,22 l40,10 l-20,24 z" fill={f} stroke={s} strokeWidth="2" /><path d="M64,58 l30,-4 l-6,14 z" fill={f} stroke={s} strokeWidth="2" /></g>,
    gnocchi: <g>{[30, 62, 94].map((x) => <g key={x}><rect x={x - 14} y="30" width="28" height="24" rx="10" fill={f} stroke={s} strokeWidth="2" />{[-6, 0, 6].map((d) => <line key={d} x1={x + d - 4} y1="34" x2={x + d + 4} y2="50" stroke={s} strokeWidth="1" opacity=".6" />)}</g>)}</g>,
  };
  return <svg viewBox="0 0 120 84" className="w-full h-16" aria-hidden>{P[k] || null}</svg>;
}

export default function PastaDiCasa({ onBack }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const L = (o) => (lang === "de" ? o.de : lang === "en" ? o.en : o.it);
  const [people, setPeople] = useState(() => Number(LS.get(KEY, 4)) || 4);
  const [sel, setSel] = useState(null);
  const cur = PASTA.find((p) => p.k === sel);
  const setP = (n) => { const v = Math.max(1, Math.min(20, n)); setPeople(v); LS.set(KEY, v); };
  const flourG = cur ? Math.round(cur.pp * people / (cur.potato ? 4 : 1) / 10) * 10 : 0;
  const diffL = (d) => ["", tri("facile", "einfach", "easy"), tri("con un po' di mano", "mit etwas Übung", "some practice"), tri("da imparare", "zum Lernen", "to learn")][d];

  return (
    <div data-testid="pasta-page" className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <button data-testid="pasta-back" onClick={onBack} className="inline-flex items-center gap-1 text-muted-foreground text-sm font-bold"><ChevronLeft className="w-4 h-4" />{tri("Indietro", "Zurück", "Back")}</button>
      <div>
        <p className="font-mono-data text-[10px] tracking-[0.25em] uppercase text-primary flex items-center gap-1.5"><Wheat className="w-3 h-3" />{tri("Solo acqua e semola, senza forno", "Nur Wasser und Grieß, ohne Ofen", "Just water and semolina, no oven")}</p>
        <h1 className="font-display text-2xl font-black text-foreground">{tri("Le mani in pasta", "Die Hände im Teig", "Hands in the dough")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{tri("Le stesse due cose del pane, acqua e farina, senza lievito e senza forno: dodici forme, con il cuore in Basilicata e in Puglia. Solo le mani, e un'ora.", "Dieselben zwei Dinge wie beim Brot, Wasser und Mehl, ohne Hefe und ohne Ofen: zwölf Formen, mit dem Herzen in der Basilikata und in Apulien. Nur die Hände, und eine Stunde.", "The same two things as bread, water and flour, without yeast and without an oven: twelve shapes, with their heart in Basilicata and Puglia. Just your hands, and an hour.")}</p>
        <p data-testid="pasta-disclaimer" className="mt-2 text-[12px] text-salvia leading-snug rounded-xl border border-salvia/40 bg-salvia/8 px-3 py-2 flex items-start gap-1.5"><Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5" />{tri("Questa sezione l'ha scritta Sitor, la guida IA di MikiLab, seguendo la tradizione: non sono ricette di Michele, e per questo stanno qui, a parte, con il suo nome. Le ricette di Michele sono nel Ricettario.", "Diesen Abschnitt hat Sitor geschrieben, der KI-Guide von MikiLab, nach der Tradition: es sind keine Rezepte von Michele, deshalb stehen sie hier, getrennt, unter seinem Namen. Micheles Rezepte sind im Rezeptbuch.", "This section was written by Sitor, MikiLab's AI guide, following tradition: these are not Michele's recipes, which is why they sit here, apart, under his name. Michele's recipes are in the recipe book.")}</p>
      </div>
      <div className="rounded-2xl border border-border bg-card p-3 flex items-center gap-3">
        <span className="text-[13px] font-bold text-foreground">{tri("Per quante persone", "Für wie viele Personen", "For how many people")}</span>
        <div className="ml-auto inline-flex items-center rounded-lg border border-border overflow-hidden"><button data-testid="pasta-minus" onClick={() => setP(people - 1)} className="px-3 py-1.5 text-foreground font-bold">−</button><span data-testid="pasta-people" className="px-3 font-mono-data font-bold text-foreground">{people}</span><button data-testid="pasta-plus" onClick={() => setP(people + 1)} className="px-3 py-1.5 text-foreground font-bold">+</button></div>
      </div>
      {!cur && (
        <div className="grid grid-cols-2 gap-2.5" data-testid="pasta-grid">
          {PASTA.map((p) => (
            <button key={p.k} data-testid={`pasta-${p.k}`} onClick={() => { setSel(p.k); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="text-left rounded-2xl border border-border bg-card p-3 active:scale-[0.98] hover:border-primary/60 transition-all">
              <Shape k={p.k} />
              <p className="font-display text-[15px] font-bold text-foreground leading-tight mt-1">{L(p.name)}</p>
              <p className="text-[11px] text-muted-foreground">{L(p.reg)} · {diffL(p.diff)}</p>
            </button>
          ))}
        </div>
      )}
      {cur && (
        <div data-testid="pasta-detail" className="space-y-3">
          <button data-testid="pasta-close" onClick={() => setSel(null)} className="text-[12.5px] font-bold text-primary">← {tri("Tutte le forme", "Alle Formen", "All shapes")}</button>
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
            <div className="flex items-center gap-3"><div className="w-28 shrink-0"><Shape k={cur.k} /></div><div><h2 className="font-display text-2xl font-bold text-foreground leading-tight">{L(cur.name)}</h2><p className="text-[12px] text-muted-foreground">{L(cur.reg)} · {diffL(cur.diff)} · {tri("cottura", "Kochzeit", "cooking")} {cur.cook[0]}-{cur.cook[1]} min</p></div></div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-3">
            <p className="font-mono-data text-[10px] tracking-[0.25em] uppercase text-muted-foreground mb-1.5">{tri(`Impasto per ${people} persone`, `Teig für ${people} Personen`, `Dough for ${people} people`)}</p>
            <div className="space-y-0.5 text-[13px]">
              <p className="flex justify-between"><span className="text-foreground/85">{L(cur.flour)}</span><b className="font-mono-data text-foreground">{flourG} g</b></p>
              {cur.potato > 0 && <p className="flex justify-between"><span className="text-foreground/85">{tri("patate lesse (pesate crude)", "Kartoffeln, gekocht (roh gewogen)", "boiled potatoes (weighed raw)")}</span><b className="font-mono-data text-foreground">{Math.round(flourG * 3)} g</b></p>}
              {cur.water > 0 && <p className="flex justify-between"><span className="text-foreground/85">{tri("acqua tiepida", "lauwarmes Wasser", "lukewarm water")}</span><b className="font-mono-data text-foreground">{Math.round(flourG * cur.water / 100)} g</b></p>}
              {cur.egg > 0 && <p className="flex justify-between"><span className="text-foreground/85">{tri("uova intere", "ganze Eier", "whole eggs")}</span><b className="font-mono-data text-foreground">{Math.round(flourG / 100 * cur.egg)}</b></p>}
              {cur.salt > 0 && <p className="flex justify-between"><span className="text-foreground/85">{tri("sale", "Salz", "salt")}</span><b className="font-mono-data text-foreground">{Math.round(flourG * cur.salt / 100)} g</b></p>}
              <p className="flex justify-between text-muted-foreground"><span>{tri("riposo", "Ruhe", "rest")}</span><span className="font-mono-data">{cur.rest ? `${cur.rest} min` : "—"}</span></p>
              <p className="flex justify-between text-muted-foreground"><span>{tri("attrezzi", "Werkzeug", "tools")}</span><span className="text-right">{L(cur.tools)}</span></p>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-3">
            <p className="font-mono-data text-[10px] tracking-[0.25em] uppercase text-muted-foreground mb-1.5">{tri("Come si fa", "So geht's", "How it's made")}</p>
            <ol className="space-y-1.5">{L(cur.steps).map((s, i) => <li key={i} className="flex gap-2 text-[13px] text-foreground/90 leading-snug"><span className="font-mono-data text-primary shrink-0">{i + 1}.</span><span>{s}</span></li>)}</ol>
          </div>
          <div className="rounded-2xl border border-border bg-card p-3 space-y-1.5">
            <p className="text-[13px] text-foreground flex items-start gap-1.5"><Clock className="w-4 h-4 text-primary shrink-0 mt-0.5" />{tri(`Acqua abbondante, salata come il mare (10 g per litro). ${cur.cook[0]}-${cur.cook[1]} minuti: la pasta fresca è pronta quando torna a galla e la assaggi.`, `Reichlich Wasser, salzig wie das Meer (10 g pro Liter). ${cur.cook[0]}-${cur.cook[1]} Minuten: frische Pasta ist fertig, wenn sie oben schwimmt und du sie probierst.`, `Plenty of water, salted like the sea (10 g per litre). ${cur.cook[0]}-${cur.cook[1]} minutes: fresh pasta is ready when it floats and you taste it.`)}</p>
            <p className="text-[13px] text-foreground flex items-start gap-1.5"><Utensils className="w-4 h-4 text-primary shrink-0 mt-0.5" /><span><b>{tri("Il condimento giusto", "Die richtige Sauce", "The right sauce")}:</b> {L(cur.sauce)}</span></p>
          </div>
          <p className="text-[13px] text-salvia leading-snug">Sitor: {L(cur.sitor)}</p>
          <div className="rounded-2xl border border-border bg-card p-3"><MieiAppunti r={{ id: `pasta_${cur.k}` }} lang={lang} /></div>
          <div className="flex gap-2">
            <button data-testid="pasta-next" onClick={() => { const i = PASTA.findIndex((p) => p.k === cur.k); setSel(PASTA[(i + 1) % PASTA.length].k); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="ml-auto inline-flex items-center gap-1 text-[12.5px] font-bold px-3 py-2 rounded-xl border border-border bg-card text-foreground active:scale-95">{tri("Forma successiva", "Nächste Form", "Next shape")}<ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}
      <p className="text-[11px] text-muted-foreground">{tri("Le dosi sono per una porzione da 100-110 g di pasta fresca a persona. La pasta fresca si conserva un giorno in frigo su un canovaccio infarinato, o si congela stesa su un vassoio e poi in sacchetto: si cuoce da congelata, un minuto in più.", "Die Mengen gelten für 100-110 g frische Pasta pro Person. Frische Pasta hält einen Tag im Kühlschrank auf einem bemehlten Tuch, oder auf einem Tablett einfrieren und dann in einen Beutel: gefroren kochen, eine Minute länger.", "Quantities are for a 100-110 g portion of fresh pasta per person. Fresh pasta keeps a day in the fridge on a floured cloth, or freeze it spread on a tray and then bag it: cook from frozen, one minute longer.")}</p>
    </div>
  );
}
