// V127 — LA CALCOLATRICE DEL FORNAIO (/calcolatrice, /pizza, /rinfresco, /formule).
// Il tuo impasto in grammi, dai pezzi che vuoi o dalla farina, con biga, poolish o lievito madre; l'acqua alla
// temperatura giusta, il piano con gli orari, il lievito madre pronto all'ora giusta. Tutto nel telefono:
// formule in localStorage, link con i numeri dopo il # (il browser non lo manda al server), nessun tracciamento.
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ChevronLeft, Calculator, Pizza, Sprout, ArrowLeftRight, NotebookPen } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { LS, shareOrDownload } from "@/lib/sitorTools";
import { STILI, nuovaFormula, completa, calcola, piano, codifica, decodifica, creaIcs, riassunto, L, fmtG, fmtP } from "@/lib/fornaio";
import Editor from "@/components/calcolatrice/Editor";
import Risultato from "@/components/calcolatrice/Risultato";
import LievitoPronto from "@/components/calcolatrice/LievitoPronto";
import ConversioniVeloci from "@/components/calcolatrice/ConversioniVeloci";
import MieFormule, { leggiFormule, scriviFormule, MAX_FORMULE } from "@/components/calcolatrice/MieFormule";

const K_IMPASTO = "mikilab_calc_impasto";
const K_PIZZA = "mikilab_calc_pizza";
function carica(key, st) {
  const x = LS.get(key, null);
  return x && typeof x === "object" && STILI[x.st] ? completa(x) : nuovaFormula(st);
}

export default function Calcolatrice({ onBack, onNav, initialTab = "impasto" }) {
  const { lang } = useLang();
  const tri = mkTri(lang);
  const [tab, setTab] = useState(initialTab);
  const [fI, setFI] = useState(() => carica(K_IMPASTO, "pane"));
  const [fP, setFP] = useState(() => carica(K_PIZZA, "napoletana"));
  const [ids, setIds] = useState({ impasto: null, pizza: null });
  const [lista, setLista] = useState(() => leggiFormule());
  const [daLm, setDaLm] = useState(null);
  const [adesso, setAdesso] = useState(() => new Date());

  useEffect(() => { LS.set(K_IMPASTO, fI); }, [fI]);
  useEffect(() => { LS.set(K_PIZZA, fP); }, [fP]);
  useEffect(() => { const t = setInterval(() => setAdesso(new Date()), 60000); return () => clearInterval(t); }, []);
  useEffect(() => { setTab(initialTab); }, [initialTab]);

  // Formula arrivata con un link (#f=…): la apro e pulisco l'indirizzo.
  useEffect(() => {
    try {
      const h = window.location.hash || "";
      if (!h.startsWith("#f=")) return;
      const f = decodifica(h.slice(3));
      window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search);
      if (!f) { toast.error(tri("Questo link non contiene una formula leggibile.", "Dieser Link enthält keine lesbare Rezeptur.", "This link doesn't hold a readable formula.")); return; }
      if (STILI[f.st] && STILI[f.st].pizza) { setFP(f); setIds((c) => ({ ...c, pizza: null })); setTab("pizza"); }
      else { setFI(f); setIds((c) => ({ ...c, impasto: null })); setTab("impasto"); }
      toast.success(tri("Ecco la formula che ti hanno mandato. Se ti piace, salvala.", "Hier ist die Rezeptur, die man dir geschickt hat. Gefällt sie dir, speichere sie.", "Here's the formula you were sent. If you like it, save it."));
    } catch { /* link rotto: si parte normali */ }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const isPizza = tab === "pizza";
  const chiave = isPizza ? "pizza" : "impasto";
  const f = isPizza ? fP : fI;
  const setF = isPizza ? setFP : setFI;
  const res = useMemo(() => calcola(f), [f]);
  const pl = useMemo(() => piano(res, adesso), [res, adesso]);
  const nomeDi = (g) => (g.n && String(g.n).trim()) || L((STILI[g.st] || STILI.libero).n, lang);

  const salva = () => {
    const nome = nomeDi(f);
    const id = ids[chiave];
    let list = leggiFormule();
    const item = { id: id || `f${Date.now().toString(36)}`, name: nome, at: new Date().toISOString(), f: { ...f, n: nome } };
    if (id && list.some((x) => x.id === id)) list = list.map((x) => (x.id === id ? item : x));
    else {
      if (list.length >= MAX_FORMULE) { toast.error(tri("Hai già 60 formule: eliminane una in «Le mie formule».", "Du hast schon 60 Rezepturen: lösche eine unter „Meine Rezepturen“.", "You already have 60 formulas: delete one in \"My formulas\".")); return; }
      list = [item, ...list];
    }
    scriviFormule(list);
    setLista(list);
    setIds((c) => ({ ...c, [chiave]: item.id }));
    setF((c) => ({ ...c, n: nome }));
    toast.success(tri(`Salvata: «${nome}». La trovi in «Le mie formule».`, `Gespeichert: „${nome}“. Du findest sie unter „Meine Rezepturen“.`, `Saved: "${nome}". You'll find it in "My formulas".`));
  };

  const condividi = async (g) => {
    const ff = g || f;
    const path = STILI[ff.st] && STILI[ff.st].pizza ? "/pizza" : "/calcolatrice";
    const url = `${window.location.origin}${path}#f=${codifica(ff)}`;
    const title = nomeDi(ff);
    try {
      if (navigator.share) { await navigator.share({ title, text: tri(`La mia formula: ${title}`, `Meine Rezeptur: ${title}`, `My formula: ${title}`), url }); return; }
    } catch (e) { if (e && e.name === "AbortError") return; }
    try { await navigator.clipboard.writeText(url); toast.success(tri("Link copiato: incollalo dove vuoi.", "Link kopiert: füge ihn ein, wo du willst.", "Link copied: paste it wherever you like.")); }
    catch { window.prompt(tri("Copia il link:", "Link kopieren:", "Copy the link:"), url); }
  };

  const agenda = async () => {
    const passi = pl.passi.filter((p) => p.t.getTime() > Date.now() - 60e3);
    if (!passi.length) { toast.error(tri("Questi orari sono già passati: sposta l'ora del forno.", "Diese Zeiten sind vorbei: verschiebe die Backzeit.", "These times have passed: move the baking time.")); return; }
    const titolo = nomeDi(f);
    const blob = new Blob([creaIcs(passi, titolo, lang)], { type: "text/calendar;charset=utf-8" });
    await shareOrDownload(blob, "mikilab-piano.ics", titolo);
  };

  const forno = () => {
    LS.set("mikilab_mioforno_prefill", { name: nomeDi(f).slice(0, 80), note: riassunto(res, lang) });
    if (onNav) onNav("mioforno");
  };

  const sitor = () => {
    const text = tri(`Ho calcolato questa formula. ${riassunto(res, "it")} Cosa ne pensi? Cosa cambieresti?`, `Ich habe diese Rezeptur berechnet. ${riassunto(res, "de")} Was meinst du? Was würdest du ändern?`, `I worked out this formula. ${riassunto(res, "en")} What do you think? What would you change?`);
    try {
      window.dispatchEvent(new CustomEvent("mikilab-open-chat"));
      setTimeout(() => window.dispatchEvent(new CustomEvent("mikilab-chat-prefill", { detail: { text } })), 300);
    } catch { /* */ }
  };

  const vaiLievito = () => {
    if (!res.lm) return;
    setDaLm({ g: res.lm.g, lh: res.lm.lh, quando: pl.mixStart });
    setTab("lievito");
    try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch { /* */ }
  };

  const apri = (it) => {
    const g = completa(it.f);
    if (STILI[g.st] && STILI[g.st].pizza) { setFP(g); setIds((c) => ({ ...c, pizza: it.id })); setTab("pizza"); }
    else { setFI(g); setIds((c) => ({ ...c, impasto: it.id })); setTab("impasto"); }
    try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch { /* */ }
  };

  const tabs = [
    { k: "impasto", I: Calculator, l: tri("Impasto", "Teig", "Dough") },
    { k: "pizza", I: Pizza, l: "Pizza" },
    { k: "lievito", I: Sprout, l: tri("Lievito pronto", "Sauerteig pünktlich", "Starter on time") },
    { k: "conversioni", I: ArrowLeftRight, l: tri("Conversioni", "Umrechnen", "Conversions") },
    { k: "formule", I: NotebookPen, l: tri(`Le mie formule${lista.length ? ` (${lista.length})` : ""}`, `Meine Rezepturen${lista.length ? ` (${lista.length})` : ""}`, `My formulas${lista.length ? ` (${lista.length})` : ""}`) },
  ];
  const sotto = {
    impasto: tri("Il tuo impasto in grammi: dai pezzi che vuoi o dalla farina, con biga, poolish o lievito madre. Con l'acqua alla temperatura giusta e il piano con gli orari.", "Dein Teig in Gramm: von den gewünschten Stücken oder vom Mehl, mit Biga, Poolish oder Sauerteig. Mit richtiger Wassertemperatur und Zeitplan.", "Your dough in grams: from the pieces you want or from the flour, with biga, poolish or sourdough. With the right water temperature and a schedule."),
    pizza: tri("Panetti o teglia: farina, acqua, sale e lievito giusti per le tue ore, anche con il frigo.", "Teigkugeln oder Blech: Mehl, Wasser, Salz und Hefe passend zu deinen Stunden, auch mit Kühlschrank.", "Dough balls or pan: flour, water, salt and yeast right for your hours, fridge included."),
    lievito: tri("Quanto rinfrescare adesso per averlo al picco quando impasti.", "Wie viel du jetzt auffrischst, damit er beim Kneten aktiv ist.", "How much to feed now so it peaks when you mix."),
    conversioni: tri("Lieviti, dosi piccolissime, gradi del forno e resa.", "Hefen, winzige Mengen, Ofengrade und Teigausbeute.", "Yeasts, tiny amounts, oven degrees and dough yield."),
    formule: tri("Le formule che hai salvato. Restano solo in questo telefono.", "Deine gespeicherten Rezepturen. Sie bleiben nur auf diesem Handy.", "The formulas you saved. They stay only on this phone."),
  };
  const calcTab = tab === "impasto" || tab === "pizza";

  return (
    <div data-testid="calcolatrice-page" className={`${calcTab ? "max-w-2xl lg:max-w-5xl" : "max-w-2xl"} mx-auto px-4 py-6 space-y-4`}>
      <button data-testid="calc-back" onClick={onBack} className="no-print inline-flex items-center gap-1 text-muted-foreground text-sm font-bold"><ChevronLeft className="w-4 h-4" />{tri("Indietro", "Zurück", "Back")}</button>
      <div className="no-print">
        <p className="font-mono-data text-[10px] tracking-[0.25em] uppercase text-primary">{tri("Calcolare l'impasto", "Den Teig berechnen", "Working out the dough")}</p>
        <h1 className="font-display text-2xl font-black text-foreground">{isPizza ? tri("Calcolo impasto pizza", "Pizzateig-Rechner", "Pizza dough calculator") : tri("La calcolatrice del fornaio", "Der Bäckerrechner", "The baker's calculator")}</h1>
        <div className="mk-oro-line mt-2 mb-1" />
        <p className="text-[13px] text-muted-foreground leading-snug">{sotto[tab] || sotto.impasto}</p>
      </div>

      <div className="flex flex-wrap gap-1.5 no-print" role="tablist" data-testid="calc-tabs">
        {tabs.map((t) => (
          <button key={t.k} type="button" role="tab" aria-selected={tab === t.k} data-testid={`calc-tab-${t.k}`} onClick={() => setTab(t.k)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12.5px] font-semibold border transition-all active:scale-95 ${tab === t.k ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:border-primary/60"}`}>
            <t.I className="w-4 h-4" />{t.l}
          </button>
        ))}
      </div>

      {calcTab ? (
        <>
          <button type="button" data-testid="calc-mini" onClick={() => { const el = document.getElementById("calc-grammi"); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); }}
            className="lg:hidden no-print w-full flex items-center justify-between gap-3 rounded-2xl px-4 py-2.5 border border-black/30 text-left" style={{ background: "#232529", color: "#F3EDE2" }}>
            <span className="text-[12px] opacity-80 leading-tight">{L(res.st.n, lang)}<br />{tri(`farina ${fmtG(res.F, lang)} · acqua ${fmtP(res.idrReale, lang, 0)}`, `Mehl ${fmtG(res.F, lang)} · Wasser ${fmtP(res.idrReale, lang, 0)}`, `flour ${fmtG(res.F, lang)} · water ${fmtP(res.idrReale, lang, 0)}`)}</span>
            <span className="font-mono-data font-bold text-[22px]" style={{ color: "#E9A23B" }}>{fmtG(res.impasto, lang)} ↓</span>
          </button>
          <div className="lg:grid lg:grid-cols-2 lg:gap-6 lg:items-start space-y-4 lg:space-y-0">
            <Editor f={f} setF={setF} res={res} lang={lang} soloPizza={isPizza} />
            <div id="calc-grammi" className="scroll-mt-20 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-1">
              <Risultato res={res} pl={pl} lang={lang} nome={f.n || ""} onNome={(v) => setF((c) => ({ ...c, n: v }))} salvata={!!ids[chiave]}
                azioni={{ salva, condividi: () => condividi(), stampa: () => window.print(), agenda, forno, sitor, lievito: vaiLievito }} />
            </div>
          </div>
        </>
      ) : null}
      {tab === "lievito" ? <LievitoPronto lang={lang} da={daLm} onNav={onNav} /> : null}
      {tab === "conversioni" ? <ConversioniVeloci lang={lang} onNav={onNav} /> : null}
      {tab === "formule" ? <MieFormule lang={lang} lista={lista} setLista={setLista} onApri={apri} onCondividi={(g) => condividi(g)} onNuova={() => setTab("impasto")} /> : null}

      <p className="no-print text-[11px] text-muted-foreground leading-snug pt-2">{tri("Calcoli fatti qui, nel telefono: sono punti di partenza, l'impasto si guarda. Le ricette di Michele restano come le ha scritte lui; questa è la bottega per le tue formule.", "Hier im Handy gerechnet: das sind Ausgangswerte, den Teig muss man ansehen. Micheles Rezepte bleiben, wie er sie geschrieben hat; das hier ist die Werkstatt für deine Rezepturen.", "Worked out here, on your phone: these are starting points, you still watch the dough. Michele's recipes stay as he wrote them; this is the workshop for your own formulas.")}</p>
    </div>
  );
}
