import { useMemo, useState } from "react";
import { ChevronLeft, FlaskConical, ClipboardPaste, Printer, Sparkles } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { MIX } from "@/lib/improver";
import { leggiRicetta } from "@/lib/fornaio";
import PrintHeader from "@/components/PrintHeader";

// V131 — IL MIGLIORATORE PER LA TUA RICETTA. Nessun altro sito ti dà un miglioratore naturale fatto in casa e ti dice
// quanto metterne nel TUO pane: qui chiunque incolla una ricetta (della nonna, di un altro sito, sua) o scrive la farina,
// sceglie cosa fa e come lievita, e ottiene la tabella con i grammi. Le regole sono quelle di Michele, prese dalle sue
// ricette: pane e panini 2% con biga, poolish o lievito madre, 3% diretti; focaccia, pizza e snack 3%; brioche 2%;
// panettoni e pasticceria no. Si aggiunge nell'impasto finale; l'acqua della ricetta non cambia (nelle ricette salate
// l'acqua in più la porta il Brösel). Tutto nel browser: niente viene salvato né inviato. Le ricette di Michele non si toccano.

const T = (it, de, en) => ({ it, de, en });
export const TIPI = [
  { k: "pane", t: T("Pane", "Brot", "Bread"), dir: 3, ind: 2, salato: true, metodo: true },
  { k: "panini", t: T("Panini", "Brötchen", "Rolls"), dir: 3, ind: 2, salato: true, metodo: true },
  { k: "focaccia", t: T("Focaccia", "Focaccia", "Focaccia"), dir: 3, ind: 3, salato: true },
  { k: "pizza", t: T("Pizza", "Pizza", "Pizza"), dir: 3, ind: 3, salato: true },
  { k: "snack", t: T("Grissini, taralli, crackers", "Grissini, Taralli, Cracker", "Breadsticks, taralli, crackers"), dir: 3, ind: 3, salato: true },
  { k: "brioche", t: T("Brioche e lievitati morbidi", "Brioche und weiches Hefegebäck", "Brioche and soft enriched doughs"), dir: 2, ind: 2 },
  { k: "dolci", t: T("Panettone, colomba, pasticceria", "Panettone, Colomba, Konditorei", "Panettone, colomba, pastry"), dir: 0, ind: 0 },
];

export default function MiglioratorePerTe({ onBack, onNav }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const L = (o) => (o ? (lang === "de" ? o.de : lang === "en" ? o.en : o.it) : "");
  const n1 = (x) => { const v = Math.round(x * 10) / 10; return (v >= 10 ? String(Math.round(v)) : String(v)).replace(".", lang === "it" || lang === "de" ? "," : "."); };
  const [testo, setTesto] = useState("");
  const [farina, setFarina] = useState("1000");
  const [tipo, setTipo] = useState("pane");
  const [metodo, setMetodo] = useState("ind"); // ind = biga, poolish o lievito madre · dir = lievito di birra diretto
  const [tocco, setTocco] = useState(true);
  const [letta, setLetta] = useState(null);

  const leggi = () => {
    const r = leggiRicetta(testo);
    if (!r.ok) { setLetta({ ok: false }); return; }
    const f = r.f; const ex = new Set((f.ex || []).map((x) => x[0]));
    setFarina(String(f.fl));
    setMetodo(["biga", "poolish", "lm", "licoli"].includes(f.lv) ? "ind" : "dir");
    if (ex.has("burro") && (ex.has("zucchero") || ex.has("uova") || ex.has("tuorli"))) setTipo("brioche");
    setLetta({ ok: true, fl: f.fl, lv: f.lv, burro: ex.has("burro") || ex.has("strutto"), migl: ex.has("miglioratore") });
  };

  const tp = TIPI.find((x) => x.k === tipo) || TIPI[0];
  const F = Math.max(0, Math.min(100000, Number(String(farina).replace(",", ".")) || 0));
  const dose = metodo === "dir" ? tp.dir : tp.ind;
  const g = (F * dose) / 100;
  const righe = useMemo(() => MIX.map((m) => ({ ...m, gg: (g * m.g) / 100 })), [g]);
  const burro = !!(letta && letta.ok && letta.burro);
  const conBrosel = tocco && tp.salato;
  const conGrassi = tocco && tp.metodo && !burro;
  const metodoL = metodo === "dir" ? tri("lievito di birra, impasto diretto", "Hefe, direkte Führung", "yeast, direct dough") : tri("biga, poolish o lievito madre", "Biga, Poolish oder Sauerteig", "biga, poolish or sourdough");

  const Btn = (on, onClick, label, key) => (
    <button key={key} type="button" onClick={onClick} aria-pressed={on} className={`text-[13px] font-semibold px-3 py-1.5 rounded-full border transition-all active:scale-95 ${on ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border"}`}>{label}</button>
  );
  const Riga = (a, b, strong = false, key) => (
    <div key={key} className={`flex items-baseline justify-between gap-3 py-1.5 border-b border-border last:border-0 ${strong ? "font-bold" : ""}`}>
      <span className="text-[13.5px] text-foreground">{a}</span><span className="text-[14px] font-mono-data text-foreground whitespace-nowrap">{b}</span>
    </div>
  );

  return (
    <div data-testid="miglioratore-per-te" className="max-w-2xl mx-auto px-1 sm:px-4 py-4 space-y-4">
      <button onClick={onBack} className="no-print inline-flex items-center gap-1 text-muted-foreground text-sm font-bold"><ChevronLeft className="w-4 h-4" />{tri("Indietro", "Zurück", "Back")}</button>
      <PrintHeader title={tri("Il miglioratore per la tua ricetta", "Der Verbesserer für dein Rezept", "The improver for your recipe")} lang={lang} />
      <div>
        <h1 className="font-display text-2xl font-black text-foreground flex items-center gap-2"><FlaskConical className="w-6 h-6 text-primary" />{tri("Il miglioratore per la tua ricetta", "Der Verbesserer für dein Rezept", "The improver for your recipe")}</h1>
        <div className="mk-oro-line mt-2 mb-1" />
        <p className="text-[14px] text-foreground/85 leading-relaxed">{tri("Hai una ricetta tua, della nonna o di un altro sito? Ti dico quanto miglioratore naturale di Michele aggiungere, e in quali grammi. Più forza, più profumo, una morbidezza che dura.", "Hast du ein eigenes Rezept, eines von Oma oder von einer anderen Seite? Ich sage dir, wie viel von Micheles natürlichem Verbesserer du zugibst, in Gramm. Mehr Kraft, mehr Aroma, eine Weichheit, die bleibt.", "Got a recipe of your own, your grandma's or from another site? I'll tell you how much of Michele's natural improver to add, in grams. More strength, more aroma, a softness that lasts.")}</p>
      </div>

      <section className="no-print rounded-2xl border border-border bg-card p-4 space-y-3">
        <p className="text-[13.5px] font-bold text-foreground">1. {tri("La tua ricetta", "Dein Rezept", "Your recipe")}</p>
        <textarea data-testid="mpt-testo" value={testo} onChange={(e) => setTesto(e.target.value)} rows={4} placeholder={tri("Incolla qui la ricetta, una riga per ingrediente (es. 500 g farina 0, 320 g acqua, 10 g sale, 5 g lievito)…", "Rezept hier einfügen, eine Zeile pro Zutat (z. B. 500 g Mehl 550, 320 g Wasser, 10 g Salz, 5 g Hefe)…", "Paste the recipe here, one line per ingredient (e.g. 500 g flour, 320 g water, 10 g salt, 5 g yeast)…")} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-[14px] text-foreground outline-none focus:border-primary" />
        <button data-testid="mpt-leggi" onClick={leggi} disabled={!testo.trim()} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold active:scale-95 disabled:opacity-50"><ClipboardPaste className="w-4 h-4" />{tri("Leggi la ricetta", "Rezept lesen", "Read the recipe")}</button>
        {letta && !letta.ok && <p className="text-[12.5px] text-mattone">{tri("Non trovo la farina in questa ricetta. Scrivi i grammi qui sotto.", "Ich finde kein Mehl in diesem Rezept. Schreib die Gramm hier unten.", "I can't find the flour in this recipe. Type the grams below.")}</p>}
        {letta && letta.ok && <p className="text-[12.5px] text-salvia font-bold">{tri(`Trovata: ${letta.fl} g di farina in tutto.`, `Gefunden: ${letta.fl} g Mehl insgesamt.`, `Found: ${letta.fl} g of flour in total.`)}{letta.migl ? tri(" Ha già un miglioratore: togli quello e usa questo.", " Es hat schon einen Verbesserer: nimm ihn raus und nimm diesen.", " It already has an improver: leave that out and use this one.") : ""}</p>}
        <label className="flex items-center gap-2 text-[13.5px] text-foreground">
          {tri("Farina in tutto (anche quella della biga o del poolish)", "Mehl insgesamt (auch das in Biga oder Poolish)", "Total flour (including the flour in biga or poolish)")}
          <input data-testid="mpt-farina" type="number" min="0" step="50" value={farina} onChange={(e) => setFarina(e.target.value)} className="w-24 rounded-lg border border-border bg-background px-2 py-1.5 text-right font-mono-data" /> g
        </label>
        <p className="text-[13.5px] font-bold text-foreground pt-1">2. {tri("Cosa fai", "Was backst du", "What you're making")}</p>
        <div className="flex flex-wrap gap-1.5">{TIPI.map((x) => Btn(tipo === x.k, () => setTipo(x.k), L(x.t), x.k))}</div>
        {tp.dir > 0 && (<>
          <p className="text-[13.5px] font-bold text-foreground pt-1">3. {tri("Come lievita", "Wie es aufgeht", "How it rises")}</p>
          <div className="flex flex-wrap gap-1.5">
            {Btn(metodo === "dir", () => setMetodo("dir"), tri("Lievito di birra, diretto", "Hefe, direkt", "Yeast, direct"), "dir")}
            {Btn(metodo === "ind", () => setMetodo("ind"), tri("Biga, poolish o lievito madre", "Biga, Poolish oder Sauerteig", "Biga, poolish or sourdough"), "ind")}
          </div>
        </>)}
        {tp.salato && (
          <label className="flex items-start gap-2 text-[13px] text-foreground pt-1">
            <input type="checkbox" data-testid="mpt-tocco" checked={tocco} onChange={(e) => setTocco(e.target.checked)} className="mt-0.5 w-4 h-4" />
            <span>{tri("Aggiungi anche il tocco di Michele (Brösel", "Auch Micheles Tick dazu (Brösel", "Also add Michele's touch (Brösel")}{tp.metodo ? tri(", olio, aceto e Kokosfett)", ", Öl, Essig und Kokosfett)", ", oil, vinegar and coconut fat)") : ")"}</span>
          </label>
        )}
      </section>

      {tp.dir === 0 ? (
        <section data-testid="mpt-no" className="rounded-2xl border border-border bg-card p-4">
          <p className="text-[14px] text-foreground leading-relaxed">{tri("Nei panettoni, nelle colombe e in pasticceria Michele non lo mette: lì contano il lievito madre, i tuorli e il burro. Lascia la tua ricetta com'è.", "In Panettone, Colomba und Konditorei nimmt Michele ihn nicht: dort zählen Sauerteig, Eigelb und Butter. Lass dein Rezept, wie es ist.", "Michele doesn't use it in panettone, colomba or pastry: there the starter, the yolks and the butter are what matter. Leave your recipe as it is.")}</p>
        </section>
      ) : F > 0 && (
        <section data-testid="mpt-tabella" className="rounded-2xl border-2 border-primary/50 bg-card p-4">
          <p className="text-[12.5px] text-muted-foreground">{L(tp.t)} · {metodoL} · {tri(`${n1(F)} g di farina`, `${n1(F)} g Mehl`, `${n1(F)} g flour`)}</p>
          <div className="mt-1.5">
            {Riga(tri(`Miglioratore naturale MikiLab (${dose}% sulla farina)`, `Natürlicher MikiLab-Verbesserer (${dose} % aufs Mehl)`, `MikiLab natural improver (${dose}% of the flour)`), `${n1(g)} g`, true, "tot")}
          </div>
          <p className="text-[12.5px] font-bold text-foreground mt-3 mb-0.5">{tri("Dentro ci sono, per questa ricetta:", "Darin stecken, für dieses Rezept:", "Inside it, for this recipe:")}</p>
          <div data-testid="mpt-mix">{righe.map((m) => Riga(L(m.name), `${n1(m.gg)} g`, false, m.key))}</div>
          <p className="text-[12px] text-muted-foreground mt-1.5">{tri(`La miscela si prepara a 100 g: un barattolo basta per ${Math.max(1, Math.floor(100 / Math.max(0.1, g)))} ricette così.`, `Die Mischung macht man zu 100 g: ein Glas reicht für ${Math.max(1, Math.floor(100 / Math.max(0.1, g)))} solcher Rezepte.`, `The mix is made in 100 g batches: one jar is enough for ${Math.max(1, Math.floor(100 / Math.max(0.1, g)))} recipes like this.`)}</p>

          {(conBrosel || conGrassi) && (<>
            <p className="text-[12.5px] font-bold text-foreground mt-3 mb-0.5 flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-primary" />{tri("Il tocco di Michele", "Micheles Tick", "Michele's touch")}</p>
            <div data-testid="mpt-tocco-righe">
              {conBrosel && Riga(tri("Brösel (pane grattugiato secco, 5%)", "Brösel (trockene Semmelbrösel, 5 %)", "Brösel (dry breadcrumbs, 5%)"), `${n1(F * 0.05)} g`, false, "b1")}
              {conBrosel && Riga(tri("Acqua per ammollarlo, il giorno prima", "Wasser zum Einweichen, am Vortag", "Water to soak it, the day before"), `${n1(F * 0.15)} g`, false, "b2")}
              {conGrassi && Riga(tri("Olio d'oliva (1%)", "Olivenöl (1 %)", "Olive oil (1%)"), `${n1(F * 0.01)} g`, false, "o")}
              {conGrassi && Riga(tri("Aceto di mele (1%)", "Apfelessig (1 %)", "Apple vinegar (1%)"), `${n1(F * 0.01)} g`, false, "a")}
              {conGrassi && Riga(tri("Kokosfett (1%)", "Kokosfett (1 %)", "Coconut fat (1%)"), `${n1(F * 0.01)} g`, false, "k")}
            </div>
            {tocco && tp.metodo && burro && <p className="text-[12px] text-muted-foreground mt-1">{tri("La tua ricetta ha già il burro: olio, aceto e Kokosfett non servono.", "Dein Rezept hat schon Butter: Öl, Essig und Kokosfett braucht es nicht.", "Your recipe already has butter: oil, vinegar and coconut fat aren't needed.")}</p>}
          </>)}

          <div className="mt-3 space-y-1.5 text-[13px] text-foreground/90 leading-snug">
            <p><b>{tri("Quando:", "Wann:", "When:")}</b> {tri("nell'impasto finale, insieme alla farina e agli ingredienti secchi. Mai nella biga, nel poolish o nel lievito madre.", "im Hauptteig, zusammen mit dem Mehl und den trockenen Zutaten. Nie in Biga, Poolish oder Sauerteig.", "in the final dough, together with the flour and the dry ingredients. Never in the biga, poolish or starter.")}{conBrosel ? tri(" Il Brösel ammollato va nell'impasto finale anche lui.", " Die eingeweichten Brösel kommen ebenfalls in den Hauptteig.", " The soaked Brösel goes into the final dough too.") : ""}{conGrassi ? tri(" Il Kokosfett quando l'impasto è a palla; per ultimi olio, aceto e sale.", " Das Kokosfett, wenn der Teig eine Kugel ist; zuletzt Öl, Essig und Salz.", " The coconut fat once the dough forms a ball; oil, vinegar and salt last.") : ""}</p>
            <p><b>{tri("Acqua:", "Wasser:", "Water:")}</b> {tri("la stessa della tua ricetta.", "dieselbe wie in deinem Rezept.", "the same as in your recipe.")} {conBrosel ? tri("L'acqua in più la porta il Brösel: per questo Michele non la cambia.", "Das zusätzliche Wasser bringt der Brösel: deshalb ändert Michele sie nicht.", "The extra water comes with the Brösel: that's why Michele doesn't change it.") : tri("Se l'impasto ti sembra più duro del solito, aggiungi un cucchiaio d'acqua alla volta.", "Wirkt der Teig fester als sonst, gib esslöffelweise Wasser dazu.", "If the dough feels stiffer than usual, add water a tablespoon at a time.")}</p>
            <p><b>{tri("Il resto:", "Der Rest:", "Everything else:")}</b> {tri("lievito, sale e tempi restano quelli della tua ricetta. Se la crosta scurisce troppo o la mollica è appiccicosa, la volta dopo usa un punto in meno.", "Hefe, Salz und Zeiten bleiben wie in deinem Rezept. Wird die Kruste zu dunkel oder die Krume klebrig, nimm beim nächsten Mal einen Prozentpunkt weniger.", "Yeast, salt and timings stay as in your recipe. If the crust browns too much or the crumb is sticky, use one point less next time.")}</p>
          </div>
          <div className="no-print flex flex-wrap gap-2 mt-4">
            <button data-testid="mpt-stampa" onClick={() => window.print()} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border bg-background text-sm font-bold text-foreground active:scale-95"><Printer className="w-4 h-4" />{tri("Stampa la tabella", "Tabelle drucken", "Print the table")}</button>
            <button data-testid="mpt-come-si-fa" onClick={() => onNav && onNav("miglioratore")} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold active:scale-95"><FlaskConical className="w-4 h-4" />{tri("Come si fa la miscela", "So machst du die Mischung", "How to make the mix")}</button>
          </div>
        </section>
      )}
      <p className="text-[11.5px] text-muted-foreground">{tri("Le dosi sono quelle che Michele usa nelle sue ricette. Tutto si calcola nel tuo telefono: la ricetta che incolli non viene salvata né inviata.", "Die Mengen sind die, die Michele in seinen Rezepten verwendet. Alles wird auf deinem Handy berechnet: das eingefügte Rezept wird weder gespeichert noch gesendet.", "The amounts are the ones Michele uses in his own recipes. Everything is calculated on your phone: the recipe you paste is neither saved nor sent.")}</p>
    </div>
  );
}
