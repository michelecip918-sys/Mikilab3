import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, Eye, Ear, Wind, Hand, Utensils, Share2, Trash2, Wine } from "lucide-react";
import { toast } from "sonner";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { LS } from "@/lib/sitorTools";

// V94 — IL SOMMELIER DEL PANE. Si assaggia un pane come un sommelier assaggia un vino: occhio, orecchio, naso, mano,
// bocca. Scegli le parole, e MikiLab scrive la scheda di degustazione, dà il verdetto di Sitor (cosa dice quel
// profumo, quella crosta) e propone gli abbinamenti a tavola. Tutto nel telefono; le schede restano in localStorage.

const KEY = "mikilab_sommelier";
const RKEY = "mikilab_sommelier_recipe";

const DIMS = [
  { k: "occhio", I: Eye, t: { it: "L'occhio", de: "Das Auge", en: "The eye" }, q: { it: "Guardalo: crosta e taglio.", de: "Schau es an: Kruste und Schnitt.", en: "Look at it: crust and score." }, chips: [
    { k: "pallida", it: "crosta pallida", de: "blasse Kruste", en: "pale crust" }, { k: "dorata", it: "crosta dorata", de: "goldene Kruste", en: "golden crust" }, { k: "ambrata", it: "crosta ambrata", de: "bernsteinfarbene Kruste", en: "amber crust" }, { k: "scura", it: "crosta molto scura", de: "sehr dunkle Kruste", en: "very dark crust" },
    { k: "orecchia", it: "taglio aperto con l'orecchia", de: "Schnitt mit Ohr aufgegangen", en: "score opened with an ear" }, { k: "chiuso", it: "taglio poco aperto", de: "Schnitt kaum geöffnet", en: "score barely opened" }, { k: "farinata", it: "superficie infarinata", de: "bemehlte Oberfläche", en: "floured surface" }, { k: "lucida", it: "crosta lucida", de: "glänzende Kruste", en: "glossy crust" } ] },
  { k: "orecchio", I: Ear, t: { it: "L'orecchio", de: "Das Ohr", en: "The ear" }, q: { it: "Battilo sotto e schiaccia la crosta.", de: "Klopf auf den Boden und drück die Kruste.", en: "Tap the base and press the crust." }, chips: [
    { k: "canta", it: "crosta che scricchiola", de: "knisternde Kruste", en: "crackling crust" }, { k: "muta", it: "crosta muta, morbida", de: "stumme, weiche Kruste", en: "silent, soft crust" }, { k: "cavo", it: "suono cavo sotto", de: "hohler Klang unten", en: "hollow sound underneath" }, { k: "sordo", it: "suono sordo", de: "dumpfer Klang", en: "dull sound" } ] },
  { k: "naso", I: Wind, t: { it: "Il naso", de: "Die Nase", en: "The nose" }, q: { it: "Prima la crosta, poi la mollica appena tagliata.", de: "Erst die Kruste, dann die frisch angeschnittene Krume.", en: "First the crust, then the freshly cut crumb." }, chips: [
    { k: "tostato", it: "tostato, caramello", de: "geröstet, Karamell", en: "toasted, caramel" }, { k: "nocciola", it: "nocciola, cereale", de: "Haselnuss, Getreide", en: "hazelnut, grain" }, { k: "lattico", it: "yogurt, latte", de: "Joghurt, Milch", en: "yoghurt, milk" }, { k: "acetico", it: "aceto, pungente", de: "Essig, stechend", en: "vinegar, sharp" },
    { k: "alcol", it: "alcol, birra", de: "Alkohol, Bier", en: "alcohol, beer" }, { k: "burro", it: "burro, brioche", de: "Butter, Brioche", en: "butter, brioche" }, { k: "miele", it: "miele, frutta", de: "Honig, Frucht", en: "honey, fruit" }, { k: "campo", it: "campo, paglia, farina cruda", de: "Feld, Stroh, rohes Mehl", en: "field, straw, raw flour" }, { k: "bruciato", it: "bruciato", de: "verbrannt", en: "burnt" } ] },
  { k: "mano", I: Hand, t: { it: "La mano", de: "Die Hand", en: "The hand" }, q: { it: "Premi la mollica e lasciala.", de: "Drück die Krume und lass los.", en: "Press the crumb and let go." }, chips: [
    { k: "elastica", it: "elastica, torna su", de: "elastisch, kommt zurück", en: "springy, comes back" }, { k: "umida", it: "umida, lucida", de: "feucht, glänzend", en: "moist, glossy" }, { k: "asciutta", it: "asciutta, sbriciola", de: "trocken, bröselig", en: "dry, crumbly" }, { k: "gommosa", it: "gommosa, resta schiacciata", de: "gummig, bleibt eingedrückt", en: "gummy, stays pressed" },
    { k: "aperta", it: "alveoli aperti, irregolari", de: "offene, unregelmäßige Porung", en: "open, irregular holes" }, { k: "fine", it: "alveoli fini, regolari", de: "feine, gleichmäßige Porung", en: "fine, even holes" }, { k: "fitta", it: "mollica fitta", de: "dichte Krume", en: "dense crumb" }, { k: "sottile", it: "crosta sottile", de: "dünne Kruste", en: "thin crust" }, { k: "spessa", it: "crosta spessa", de: "dicke Kruste", en: "thick crust" } ] },
  { k: "bocca", I: Utensils, t: { it: "La bocca", de: "Der Mund", en: "The mouth" }, q: { it: "Un boccone di crosta e uno di mollica, masticati a lungo.", de: "Ein Bissen Kruste, einer Krume, lange gekaut.", en: "A bite of crust and one of crumb, chewed slowly." }, chips: [
    { k: "dolce", it: "dolce di cereale", de: "getreidig süß", en: "grain-sweet" }, { k: "salato", it: "sale ben presente", de: "Salz deutlich", en: "salt well present" }, { k: "sciapo", it: "poco sale", de: "wenig Salz", en: "little salt" }, { k: "acido", it: "acidità gentile", de: "sanfte Säure", en: "gentle acidity" }, { k: "acidissimo", it: "acidità forte", de: "starke Säure", en: "strong acidity" },
    { k: "amaro", it: "amaro di crosta", de: "Bitternote der Kruste", en: "bitter crust note" }, { k: "lievito", it: "sapore di lievito", de: "Hefegeschmack", en: "yeasty taste" }, { k: "lungo", it: "finale lungo", de: "langer Nachhall", en: "long finish" }, { k: "corto", it: "finale corto", de: "kurzer Nachhall", en: "short finish" }, { k: "burroso", it: "burroso, ricco", de: "buttrig, reich", en: "buttery, rich" } ] },
];

const PAIR = [
  { when: (S) => S.has("acido") || S.has("acidissimo") || S.has("lattico") || S.has("acetico"), it: "Formaggi stagionati, burro salato, marmellata di arance amare, aringa: l'acidità del lievito madre chiede grasso e sapidità.", de: "Gereifter Käse, gesalzene Butter, Bitterorangenmarmelade, Hering: die Sauerteigsäure verlangt Fett und Würze.", en: "Aged cheese, salted butter, bitter orange marmalade, herring: sourdough acidity calls for fat and savouriness." },
  { when: (S) => S.has("ambrata") || S.has("scura") || S.has("tostato") || S.has("amaro"), it: "Olio buono a crudo, pomodoro strofinato, zuppe di legumi, salumi grassi: la crosta scura ama il grasso e il dolce del pomodoro.", de: "Gutes Olivenöl, geriebene Tomate, Hülsenfruchtsuppen, fettige Wurst: dunkle Kruste liebt Fett und die Süße der Tomate.", en: "Good raw olive oil, rubbed tomato, pulse soups, fatty cured meats: a dark crust loves fat and the sweetness of tomato." },
  { when: (S) => S.has("burro") || S.has("burroso") || S.has("miele") || S.has("dolce"), it: "Confetture, miele, ricotta, cioccolato fondente, una tazza di latte: è pane da colazione e da merenda.", de: "Konfitüre, Honig, Ricotta, dunkle Schokolade, eine Tasse Milch: ein Brot fürs Frühstück und den Nachmittag.", en: "Jams, honey, ricotta, dark chocolate, a cup of milk: this is a breakfast and afternoon bread." },
  { when: (S) => S.has("nocciola") || S.has("campo") || S.has("fine"), it: "Formaggi freschi, uova, verdure grigliate, avocado, salmone: un pane gentile che non copre.", de: "Frischkäse, Eier, gegrilltes Gemüse, Avocado, Lachs: ein sanftes Brot, das nichts überdeckt.", en: "Fresh cheeses, eggs, grilled vegetables, avocado, salmon: a gentle bread that doesn't cover anything." },
  { when: (S) => S.has("aperta") || S.has("canta") || S.has("orecchia"), it: "Bruschetta: l'alveolo aperto trattiene l'olio. E la cialledda lucana: pane raffermo, pomodoro, cipolla, origano, olio.", de: "Bruschetta: die offene Pore hält das Öl. Und die lukanische Cialledda: altbackenes Brot, Tomate, Zwiebel, Oregano, Öl.", en: "Bruschetta: the open crumb holds the oil. And Lucanian cialledda: stale bread, tomato, onion, oregano, oil." },
];

export default function Sommelier({ onBack }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const L = (o) => (lang === "de" ? o.de : lang === "en" ? o.en : o.it);
  const [name, setName] = useState(() => { try { const r = LS.get(RKEY, null); return r && r.name ? r.name : ""; } catch { return ""; } });
  const [sel, setSel] = useState(() => new Set());
  const [saved, setSaved] = useState(() => LS.get(KEY, []));
  useEffect(() => { LS.del(RKEY); }, []);
  const toggle = (k) => setSel((s) => { const n = new Set(s); if (n.has(k)) n.delete(k); else n.add(k); return n; });
  const chipL = (k) => { for (const d of DIMS) { const c = d.chips.find((x) => x.k === k); if (c) return L(c); } return k; };

  const card = useMemo(() => {
    if (sel.size === 0) return null;
    const S = sel;
    const prose = DIMS.map((d) => `${L(d.t)}: ${d.chips.filter((c) => S.has(c.k)).map((c) => L(c)).join(", ") || "—"}.`);
    // carattere del pane
    let char;
    if (S.has("acidissimo") || S.has("acetico")) char = tri("Carattere forte", "Starker Charakter", "Strong character");
    else if (S.has("burroso") || S.has("burro") || S.has("miele")) char = tri("Gentile da colazione", "Sanft, fürs Frühstück", "Gentle, for breakfast");
    else if ((S.has("ambrata") || S.has("scura")) && (S.has("aperta") || S.has("canta"))) char = tri("Rustico e schietto", "Rustikal und ehrlich", "Rustic and honest");
    else if (S.has("fine") || S.has("sottile") || S.has("muta")) char = tri("Morbido da tutti i giorni", "Weich, für jeden Tag", "Soft, everyday");
    else char = tri("Equilibrato", "Ausgewogen", "Balanced");
    // verdetto di Sitor: cosa raccontano i segni
    const v = [];
    if (S.has("acetico") || S.has("acidissimo")) v.push(tri("L'aceto nel naso e l'acidità forte dicono lievito madre affamato o troppe ore al caldo: rinfrescalo due volte prima e accorcia la lievitazione finale.", "Essig in der Nase und starke Säure sprechen für hungrigen Sauerteig oder zu viele warme Stunden: vorher zweimal auffrischen und die Stückgare kürzen.", "Vinegar on the nose and strong acidity mean a hungry starter or too many warm hours: refresh it twice before and shorten the final proof."));
    if (S.has("lattico") || S.has("acido")) v.push(tri("Acidità gentile e profumo di yogurt: il lievito madre ha lavorato bene, al punto giusto.", "Sanfte Säure und Joghurtduft: der Sauerteig hat gut gearbeitet, genau richtig.", "Gentle acidity and a yoghurt note: the starter worked well, just right."));
    if (S.has("lievito") || S.has("alcol")) v.push(tri("Sapore di lievito o di alcol: troppo lievito di birra, o lievitazione corta al caldo. Dimezza il lievito e allunga i tempi.", "Hefe- oder Alkoholgeschmack: zu viel Hefe oder kurze, warme Gare. Hefe halbieren, Zeiten verlängern.", "Yeasty or alcoholic taste: too much yeast, or a short warm rise. Halve the yeast and lengthen the times."));
    if (S.has("gommosa")) v.push(tri("Mollica gommosa: tagliato caldo o poco cotto. Aspetta che sia freddo; 96-98 °C al cuore.", "Gummige Krume: warm angeschnitten oder zu kurz gebacken. Auskühlen lassen; 96-98 °C im Kern.", "Gummy crumb: cut warm or under-baked. Let it cool; 96-98 °C at the core."));
    if (S.has("pallida") || S.has("muta")) v.push(tri("Crosta pallida e muta: mancano calore alla fine e vapore solo all'inizio. Il colore è gusto: 10 minuti in più a 230 °C.", "Blasse, stumme Kruste: am Ende fehlt Hitze, Dampf nur am Anfang. Farbe ist Geschmack: 10 Minuten länger bei 230 °C.", "Pale, silent crust: it lacked heat at the end and steam only at the start. Colour is flavour: 10 more minutes at 230 °C."));
    if (S.has("bruciato")) v.push(tri("Bruciato: 20 °C in meno dopo i primi 15 minuti, o un foglio di alluminio negli ultimi 10.", "Verbrannt: 20 °C weniger nach den ersten 15 Minuten, oder Alufolie in den letzten 10.", "Burnt: 20 °C less after the first 15 minutes, or foil for the last 10."));
    if (S.has("fitta") || S.has("sordo")) v.push(tri("Mollica fitta e suono sordo: poca lievitazione o farina debole. Più tempo, e guarda l'impasto con il Righello della ciotola.", "Dichte Krume, dumpfer Klang: zu kurze Gare oder schwaches Mehl. Mehr Zeit, und den Teig mit dem Schüssel-Lineal beobachten.", "Dense crumb and dull sound: under-proofed or weak flour. More time, and watch the dough with the Bowl ruler."));
    if (S.has("sciapo")) v.push(tri("Poco sale: sotto 1,8 g per 100 g di farina il pane resta sciapo e la crosta pallida. Le ricette del sito stanno a 2-2,2.", "Wenig Salz: unter 1,8 g je 100 g Mehl bleibt das Brot fad und die Kruste blass. Die Rezepte der Seite liegen bei 2-2,2.", "Little salt: below 1.8 g per 100 g flour the bread stays bland and the crust pale. The site's recipes sit at 2-2.2."));
    if (S.has("chiuso")) v.push(tri("Taglio poco aperto: lametta troppo timida o lievitazione oltre. 0,5-1 cm in un gesto solo; vedi Disegna il taglio.", "Schnitt kaum geöffnet: zu zaghafte Klinge oder Übergare. 0,5-1 cm in einem Zug; siehe Zeichne den Schnitt.", "Score barely opened: a timid blade or over-proofing. 0.5-1 cm in one stroke; see Draw the score."));
    if (S.has("canta") && S.has("cavo") && (S.has("nocciola") || S.has("tostato")) && S.has("lungo")) v.push(tri("Crosta che canta, suono cavo, profumo di tostato e finale lungo: questo è un pane da panettiere. Segna come l'hai fatto.", "Knisternde Kruste, hohler Klang, Röstduft und langer Nachhall: das ist Bäckerbrot. Notier dir, wie du es gemacht hast.", "Crackling crust, hollow sound, toasted aroma and long finish: this is a baker's loaf. Write down how you made it."));
    if (!v.length) v.push(tri("Un pane onesto, senza difetti che gridano. La prossima volta cerca il profumo nella mollica appena tagliata: è lì che si legge la lievitazione.", "Ein ehrliches Brot ohne laute Fehler. Nächstes Mal such den Duft in der frisch angeschnittenen Krume: dort liest man die Gare.", "An honest loaf, with no shouting flaws. Next time look for the aroma in the freshly cut crumb: that's where fermentation shows."));
    const pair = PAIR.filter((p) => p.when(S)).slice(0, 2).map((p) => L(p));
    if (!pair.length) pair.push(tri("Olio buono, un pizzico di sale e un pomodoro maturo: con questo si giudica qualunque pane.", "Gutes Öl, eine Prise Salz und eine reife Tomate: damit beurteilt man jedes Brot.", "Good oil, a pinch of salt and a ripe tomato: that's how you judge any bread."));
    return { prose, char, v, pair };
  }, [sel, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  const asText = () => `${tri("Scheda del sommelier del pane", "Brot-Sommelier-Karte", "Bread sommelier card")} · ${name || tri("pane senza nome", "Brot ohne Namen", "unnamed bread")}\n${card.char}\n${card.prose.join("\n")}\n\nSitor: ${card.v.join(" ")}\n\n${tri("A tavola", "Am Tisch", "At the table")}: ${card.pair.join(" ")}\n— mikilab.de`;
  const share = async () => { const t = asText(); try { if (navigator.share) { await navigator.share({ title: "MikiLab", text: t }); return; } } catch (e) { if (e && e.name === "AbortError") return; } try { await navigator.clipboard.writeText(t); toast.success(tri("Scheda copiata.", "Karte kopiert.", "Card copied.")); } catch { toast.error(tri("Non riesco a copiare.", "Kopieren nicht möglich.", "Can't copy.")); } };
  const save = () => { const n = [{ ts: Date.now(), name: name || "", char: card.char, chips: [...sel] }, ...saved].slice(0, 30); setSaved(n); LS.set(KEY, n); toast.success(tri("Scheda salvata.", "Karte gespeichert.", "Card saved.")); };
  const del = (i) => { const n = saved.filter((_, k) => k !== i); setSaved(n); LS.set(KEY, n); };

  return (
    <div data-testid="sommelier-page" className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <button data-testid="sommelier-back" onClick={onBack} className="inline-flex items-center gap-1 text-muted-foreground text-sm font-bold"><ChevronLeft className="w-4 h-4" />{tri("Indietro", "Zurück", "Back")}</button>
      <div>
        <p className="font-mono-data text-[10px] tracking-[0.25em] uppercase text-salvia flex items-center gap-1.5"><Wine className="w-3 h-3" />MikiLab</p>
        <h1 className="font-display text-2xl font-black text-foreground">{tri("Il sommelier del pane", "Der Brot-Sommelier", "The bread sommelier")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{tri("Un pane si assaggia con cinque sensi, come un vino. Scegli le parole che lo descrivono: ti scrivo la scheda, ti dico cosa raccontano quei segni e cosa metterci accanto a tavola.", "Ein Brot verkostet man mit fünf Sinnen, wie einen Wein. Wähl die Wörter, die es beschreiben: ich schreibe die Karte, sage dir, was diese Zeichen erzählen, und was auf den Tisch dazu passt.", "You taste a bread with five senses, like a wine. Pick the words that describe it: I'll write the card, tell you what those signs mean, and what to put beside it at the table.")}</p>
      </div>
      <input data-testid="som-name" value={name} onChange={(e) => setName(e.target.value.slice(0, 60))} placeholder={tri("Che pane è? (es. Pane di Matera, sabato)", "Welches Brot? (z. B. Pane di Matera, Samstag)", "Which bread? (e.g. Pane di Matera, Saturday)")} className="w-full text-[13px] bg-card text-foreground border border-border rounded-xl px-3 py-2 outline-none focus:border-salvia" />
      {DIMS.map((d) => (
        <div key={d.k} data-testid={`som-dim-${d.k}`} className="rounded-2xl border border-border bg-card p-3">
          <p className="text-[13px] font-bold text-foreground flex items-center gap-1.5"><d.I className="w-4 h-4 text-salvia" />{L(d.t)}<span className="font-normal text-[11.5px] text-muted-foreground">· {L(d.q)}</span></p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {d.chips.map((c) => <button key={c.k} data-testid={`som-chip-${c.k}`} onClick={() => toggle(c.k)} className={`text-[11.5px] font-semibold px-2.5 py-1.5 rounded-full border active:scale-95 ${sel.has(c.k) ? "bg-salvia text-white border-salvia" : "bg-background text-foreground border-border"}`}>{L(c)}</button>)}
          </div>
        </div>
      ))}
      {card && (
        <div data-testid="som-card" className="rounded-2xl border border-salvia/40 bg-salvia/8 p-4 space-y-2.5">
          <p className="font-mono-data text-[10px] tracking-[0.25em] uppercase text-salvia">{tri("La scheda", "Die Karte", "The card")}</p>
          <p className="font-display text-xl font-bold text-foreground">{name || tri("Il tuo pane", "Dein Brot", "Your bread")} <span className="text-[12px] font-mono-data font-bold text-primary align-middle ml-1">{card.char}</span></p>
          <div className="text-[12.5px] text-foreground/90 leading-snug space-y-0.5">{card.prose.map((p, i) => <p key={i}>{p}</p>)}</div>
          <div className="text-[12px] text-salvia leading-snug space-y-1">{card.v.map((p, i) => <p key={i}>{i === 0 ? "Sitor: " : ""}{p}</p>)}</div>
          <div><p className="text-[10.5px] font-bold uppercase tracking-wide text-muted-foreground">{tri("A tavola", "Am Tisch", "At the table")}</p>{card.pair.map((p, i) => <p key={i} className="text-[12px] text-foreground/90 leading-snug">{p}</p>)}</div>
          <div className="flex gap-1.5 pt-1">
            <button data-testid="som-share" onClick={share} className="flex-1 inline-flex items-center justify-center gap-1.5 text-[12px] font-bold px-3 py-2 rounded-xl bg-salvia text-white active:scale-95"><Share2 className="w-4 h-4" />{tri("Condividi", "Teilen", "Share")}</button>
            <button data-testid="som-save" onClick={save} className="flex-1 text-[12px] font-bold px-3 py-2 rounded-xl border border-border bg-card text-foreground active:scale-95">{tri("Salva nel quaderno", "Ins Heft", "Save to notebook")}</button>
            <button data-testid="som-reset" onClick={() => setSel(new Set())} className="text-[12px] font-semibold px-3 py-2 rounded-xl text-muted-foreground active:scale-95">{tri("Da capo", "Neu", "Reset")}</button>
          </div>
        </div>
      )}
      {saved.length > 0 && (
        <div data-testid="som-saved" className="rounded-2xl border border-border bg-card p-3">
          <p className="text-[10.5px] font-bold uppercase tracking-wide text-muted-foreground mb-1.5">{tri("Il quaderno degli assaggi", "Das Verkostungsheft", "The tasting notebook")}</p>
          {saved.map((s, i) => (
            <div key={s.ts} className="flex items-center gap-2 py-1 border-t border-border first:border-0 text-[12px]">
              <button onClick={() => { setSel(new Set(s.chips)); setName(s.name); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="flex-1 text-left min-w-0"><span className="font-bold text-foreground">{s.name || tri("Pane senza nome", "Brot ohne Namen", "Unnamed bread")}</span> <span className="text-muted-foreground">· {s.char} · {new Date(s.ts).toLocaleDateString()}</span><span className="block text-[11px] text-muted-foreground truncate">{(s.chips || []).map(chipL).join(", ")}</span></button>
              <button data-testid={`som-del-${i}`} onClick={() => del(i)} className="p-1 text-muted-foreground active:scale-90"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}
      <p className="text-[10.5px] text-muted-foreground">{tri("Le schede restano nel tuo telefono. Il sommelier non giudica: traduce in parole quello che la bocca sa già.", "Die Karten bleiben auf deinem Handy. Der Sommelier urteilt nicht: er übersetzt in Worte, was der Mund schon weiß.", "The cards stay on your phone. The sommelier doesn't judge: it puts into words what the mouth already knows.")}</p>
    </div>
  );
}
