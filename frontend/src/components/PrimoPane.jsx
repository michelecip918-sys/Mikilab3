import { useEffect, useState } from "react";
import { ChevronLeft, Check, ChevronRight } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { recipesApi } from "@/lib/api";
import { rLoc } from "@/lib/loc";
import { LS, num, fermentationHours } from "@/lib/sitorTools";
import Attestato from "@/components/officina/Attestato"; // V95

// V93 — IL TUO PRIMO PANE IN 7 GIORNI. Un percorso per chi non ha mai impastato: un passo al giorno, poco alla volta,
// con gli attrezzi del sito al momento giusto. I progressi restano nel telefono.

const KEY = "mikilab_primopane";
const nav = (route) => window.dispatchEvent(new CustomEvent("mikilab-nav", { detail: { route } }));
const openRecipe = (id) => { nav("recipes"); setTimeout(() => window.dispatchEvent(new CustomEvent("mikilab-open-recipe", { detail: { id } })), 200); };

// Ricette di riferimento cercate per nome nel ricettario (se una manca, il giorno resta valido senza link).
const FIND = {
  cassetta: (r) => /cassetta|kasten|toast|pane bianco|weissbrot|weißbrot/i.test(r.name) && !/panettone/i.test(r.name),
  focaccia: (r) => /focaccia/i.test(r.name) && !fermentationHours(r).lm,
  biga: (r) => !!(r.biga && (r.biga.show || r.preferment_type === "biga")) && /pane|brot|bread|focaccia|filone|pagnotta/i.test(r.name) && !/panettone/i.test(r.name),
};

const DAYS = [
  { n: 1, t: { it: "La spesa e gli attrezzi", de: "Einkauf und Werkzeuge", en: "Shopping and tools" },
    goal: { it: "Oggi non si impasta: si prepara la cucina.", de: "Heute wird nicht geknetet: die Küche wird vorbereitet.", en: "No kneading today: we set up the kitchen." },
    steps: { it: ["Compra: 2 kg di farina tipo 0 (o Typ 550), un cubetto di lievito di birra fresco, sale fino.", "Prendi: bilancia da cucina, ciotola grande, canovaccio, una teglia, un coltello affilato o una lametta.", "Prova la bilancia: pesa 500 g di acqua in una ciotola. Se ci riesci, sei già a metà strada."], de: ["Kaufe: 2 kg Mehl Typ 550 (oder tipo 0), einen Würfel Frischhefe, feines Salz.", "Nimm: Küchenwaage, große Schüssel, Küchentuch, ein Blech, ein scharfes Messer oder eine Klinge.", "Teste die Waage: wiege 500 g Wasser in eine Schüssel. Wenn das klappt, bist du schon halb am Ziel."], en: ["Buy: 2 kg of bread flour (tipo 0 / Typ 550), a cake of fresh yeast, fine salt.", "Get: a kitchen scale, a big bowl, a tea towel, a tray, a sharp knife or a blade.", "Test the scale: weigh 500 g of water into a bowl. If you can do that, you're halfway there."] },
    sitor: { it: "Non comprare niente di più. Il pane si fa con quattro cose e due mani.", de: "Kauf nichts weiter. Brot macht man mit vier Dingen und zwei Händen.", en: "Don't buy anything else. Bread is made with four things and two hands." },
    links: [{ route: "attrezzi", it: "Guida agli attrezzi", de: "Werkzeug-Guide", en: "Tools guide" }] },
  { n: 2, t: { it: "Il primo impasto: pane in cassetta", de: "Der erste Teig: Kastenbrot", en: "The first dough: tin loaf" },
    goal: { it: "Un pane semplice, con lievito di birra, che perdona gli errori.", de: "Ein einfaches Brot mit Hefe, das Fehler verzeiht.", en: "A simple yeasted loaf that forgives mistakes." },
    steps: { it: ["Apri la ricetta e usa 'Acqua giusta': l'acqua alla temperatura giusta è il primo trucco del mestiere.", "Pesa tutto con 'Pesa tutto in una ciotola', senza tara: un numero alla volta.", "Impasta finché è liscio; poi copri e aspetta che raddoppi. Guarda l'impasto, non l'orologio.", "Cuoci come dice la ricetta. Aspetta che sia freddo prima di tagliare, anche se costa."], de: ["Öffne das Rezept und nimm 'Das richtige Wasser': Wasser in der richtigen Temperatur ist der erste Trick des Handwerks.", "Wiege alles mit 'Alles in eine Schüssel wiegen', ohne Tara: eine Zahl nach der anderen.", "Knete, bis der Teig glatt ist; dann abdecken und warten, bis er sich verdoppelt. Schau auf den Teig, nicht auf die Uhr.", "Backe wie im Rezept. Warte mit dem Anschneiden, bis es kalt ist, auch wenn es schwerfällt."], en: ["Open the recipe and use 'The right water': water at the right temperature is the first trick of the trade.", "Weigh everything with 'Weigh it all in one bowl', no tare: one number at a time.", "Knead until smooth; then cover and wait for it to double. Watch the dough, not the clock.", "Bake as the recipe says. Wait until it's cold before slicing, even if it hurts."] },
    sitor: { it: "Il primo pane non deve essere bello. Deve uscire dal forno.", de: "Das erste Brot muss nicht schön sein. Es muss aus dem Ofen kommen.", en: "The first loaf doesn't have to be pretty. It has to come out of the oven." },
    recipe: "cassetta" },
  { n: 3, t: { it: "Le mani: pieghe e forma", de: "Die Hände: Falten und Formen", en: "The hands: folds and shaping" },
    goal: { it: "Una focaccia in teglia: si impara a piegare senza impastare.", de: "Eine Focaccia im Blech: falten lernen ohne kneten.", en: "A tray focaccia: learning to fold without kneading." },
    steps: { it: ["Guarda le tecniche 'pieghe' e 'formatura' prima di sporcarti le mani.", "Mani bagnate, non infarinate: l'impasto non si attacca all'acqua.", "Ogni 30 minuti una serie di pieghe, poi in teglia con l'olio e le dita dentro fino al fondo.", "Il patatone: se la ricetta ha la patata lessa, schiacciala bene: è il segreto della morbidezza."], de: ["Schau dir die Techniken 'Falten' und 'Formen' an, bevor du die Hände schmutzig machst.", "Nasse Hände, kein Mehl: Teig klebt nicht an Wasser.", "Alle 30 Minuten eine Runde Faltungen, dann ins geölte Blech und mit den Fingern bis auf den Boden drücken.", "Die Kartoffel: hat das Rezept gekochte Kartoffel, gut zerdrücken: das Geheimnis der Weichheit."], en: ["Watch the 'folds' and 'shaping' techniques before getting your hands dirty.", "Wet hands, not floured: dough doesn't stick to water.", "Every 30 minutes a round of folds, then into the oiled tray with your fingers pressed to the bottom.", "The potato: if the recipe has boiled potato, mash it well: it's the secret of softness."] },
    sitor: { it: "Le pieghe sono impastare al rallentatore. L'impasto fa il lavoro, tu gli dai la direzione.", de: "Falten ist Kneten in Zeitlupe. Der Teig macht die Arbeit, du gibst die Richtung.", en: "Folds are kneading in slow motion. The dough does the work, you give it direction." },
    recipe: "focaccia", links: [{ route: "tecniche", it: "Le tecniche disegnate", de: "Die gezeichneten Techniken", en: "The drawn techniques" }] },
  { n: 4, t: { it: "Il forno: conoscerlo", de: "Der Ofen: ihn kennenlernen", en: "The oven: getting to know it" },
    goal: { it: "Ogni forno mente di qualche grado. Oggi scopri come mente il tuo.", de: "Jeder Ofen lügt ein paar Grad. Heute findest du heraus, wie deiner lügt.", en: "Every oven lies by a few degrees. Today you find out how yours does." },
    steps: { it: ["Fai 'La mappa del tuo forno': dove scalda di più, dove meno.", "Con l'impasto avanzato di ieri (o due panini uguali) cuoci in due posizioni diverse e confronta il colore.", "Prepara il vapore: una teglia vuota sul fondo, da riempire con acqua bollente all'infornata.", "Segna in 'Il mio forno' i minuti veri e la posizione migliore."], de: ["Mach 'Die Karte deines Ofens': wo er stärker heizt, wo schwächer.", "Mit dem Teigrest von gestern (oder zwei gleichen Brötchen) an zwei Positionen backen und die Farbe vergleichen.", "Dampf vorbereiten: ein leeres Blech auf dem Boden, beim Einschießen mit kochendem Wasser füllen.", "Trag in 'Mein Ofen' die echten Minuten und die beste Position ein."], en: ["Do 'The map of your oven': where it heats more, where less.", "With yesterday's leftover dough (or two identical rolls) bake in two positions and compare the colour.", "Prepare steam: an empty tray on the floor, filled with boiling water as you load.", "Note in 'My oven' the real minutes and the best position."] },
    sitor: { it: "Il forno non si impara dal libretto. Si impara bruciando un panino.", de: "Den Ofen lernt man nicht aus der Anleitung. Man lernt ihn, indem man ein Brötchen verbrennt.", en: "You don't learn the oven from the manual. You learn it by burning a roll." },
    links: [{ route: "mappaforno", it: "La mappa del tuo forno", de: "Die Karte deines Ofens", en: "The map of your oven" }, { route: "mioforno", it: "Il mio forno", de: "Mein Ofen", en: "My oven" }] },
  { n: 5, t: { it: "La sera: la biga", de: "Der Abend: die Biga", en: "The evening: the biga" },
    goal: { it: "Il metodo di Michele. Stasera prepari, domani cuoci.", de: "Micheles Methode. Heute Abend ansetzen, morgen backen.", en: "Michele's method. Tonight you prepare, tomorrow you bake." },
    steps: { it: ["Apri la ricetta con la biga e leggi la Fase 1: poca acqua, pochissimo lievito, 16-18 ore al fresco.", "Usa 'Il pane in agenda': dici a che ora vuoi il pane domani e ti dice quando fare la biga stasera.", "Mescola grossolanamente, senza impastare: la biga deve restare a grumi.", "Coprila e lasciala in un posto fresco (16-18 °C): cantina, balcone coperto, o la stanza più fredda."], de: ["Öffne das Rezept mit Biga und lies Phase 1: wenig Wasser, sehr wenig Hefe, 16-18 Stunden kühl.", "Nimm 'Brot im Kalender': sag, wann du das Brot morgen willst, und du erfährst, wann heute Abend die Biga ansetzt.", "Nur grob mischen, nicht kneten: die Biga soll krümelig bleiben.", "Abdecken und kühl stellen (16-18 °C): Keller, überdachter Balkon oder das kälteste Zimmer."], en: ["Open the biga recipe and read Phase 1: little water, very little yeast, 16-18 hours somewhere cool.", "Use 'Bread in the diary': say when you want the bread tomorrow and it tells you when to make the biga tonight.", "Mix roughly, don't knead: the biga should stay lumpy.", "Cover it and leave it somewhere cool (16-18 °C): cellar, covered balcony, or the coldest room."] },
    sitor: { it: "La biga lavora mentre dormi. È l'unico aiutante che non chiede stipendio.", de: "Die Biga arbeitet, während du schläfst. Der einzige Helfer, der keinen Lohn verlangt.", en: "The biga works while you sleep. The only helper who doesn't ask for wages." },
    recipe: "biga" },
  { n: 6, t: { it: "Il pane con la biga", de: "Das Brot mit Biga", en: "The biga bread" },
    goal: { it: "Il pane vero: crosta che canta, mollica che profuma.", de: "Das echte Brot: eine Kruste, die knistert, eine Krume, die duftet.", en: "The real loaf: a crust that crackles, a crumb that smells of bread." },
    steps: { it: ["Sbriciola la biga nell'acqua, poi aggiungi la farina: Fase 2 della ricetta.", "Segna l'altezza in 'Righello della ciotola' e lascia crescere: ti dice quando è pronto.", "Forma tirando bene la pelle; scegli il taglio in 'Disegna il taglio' e fallo in un gesto solo.", "Forno rovente, vapore nei primi 15 minuti. Fuori dal forno, ascolta la crosta con 'Il pane parla'."], de: ["Biga im Wasser zerbröseln, dann das Mehl dazu: Phase 2 des Rezepts.", "Höhe im 'Schüssel-Lineal' markieren und gehen lassen: es sagt dir, wann es so weit ist.", "Formen und die Haut straff ziehen; Schnitt in 'Zeichne den Schnitt' wählen und in einem Zug ausführen.", "Ofen glühend heiß, Dampf in den ersten 15 Minuten. Aus dem Ofen: der Kruste zuhören mit 'Das Brot spricht'."], en: ["Crumble the biga into the water, then add the flour: Phase 2 of the recipe.", "Mark the height in 'Bowl ruler' and let it rise: it tells you when it's ready.", "Shape with the skin pulled tight; pick a score in 'Draw the score' and do it in one stroke.", "Scorching oven, steam for the first 15 minutes. Out of the oven, listen to the crust with 'The bread speaks'."] },
    sitor: { it: "Quando senti la crosta scricchiolare mentre si raffredda, quello è il pane che ti ringrazia.", de: "Wenn du die Kruste beim Abkühlen knistern hörst, ist das das Brot, das sich bedankt.", en: "When you hear the crust crackle as it cools, that's the bread thanking you." },
    recipe: "biga", links: [{ route: "crosta", it: "Il pane parla", de: "Das Brot spricht", en: "The bread speaks" }] },
  { n: 7, t: { it: "Tirare le somme", de: "Bilanz ziehen", en: "Taking stock" },
    goal: { it: "Guardare il pane con l'occhio del fornaio, e regalarlo.", de: "Das Brot mit dem Auge des Bäckers ansehen, und es verschenken.", en: "Looking at the loaf with a baker's eye, and giving it away." },
    steps: { it: ["Taglia una fetta e falla leggere a 'L'occhio di Sitor': crosta e mollica, senza giudizio.", "Scrivi nel 'Banco delle prove' cosa è andato bene e cosa cambieresti: è il tuo quaderno di bottega.", "Fai la 'Cartolina del pane' e regala mezza pagnotta a qualcuno. Il pane si fa in due: chi lo cuoce e chi lo mangia.", "Scegli il prossimo pane con 'Cosa posso fare adesso?'. Da qui in poi cammini da solo, e Sitor resta accanto."], de: ["Schneide eine Scheibe ab und lass sie von 'Sitors Auge' lesen: Kruste und Krume, ohne Urteil.", "Schreib in den 'Probentisch', was gut ging und was du ändern würdest: dein Werkstattheft.", "Mach die 'Brot-Postkarte' und verschenke einen halben Laib. Brot macht man zu zweit: einer backt, einer isst.", "Wähl das nächste Brot mit 'Was kann ich jetzt machen?'. Ab hier gehst du allein, und Sitor bleibt an deiner Seite."], en: ["Cut a slice and let 'Sitor's eye' read it: crust and crumb, no judgement.", "Write in the 'Test bench' what went well and what you'd change: it's your workshop notebook.", "Make the 'Bread postcard' and give half a loaf to someone. Bread is made by two: the one who bakes and the one who eats.", "Pick the next loaf with 'What can I make now?'. From here you walk on your own, and Sitor stays beside you."] },
    sitor: { it: "Sette giorni fa non sapevi pesare l'acqua. Oggi hai fatto un pane con la biga. Non è poco.", de: "Vor sieben Tagen konntest du kein Wasser abwiegen. Heute hast du ein Brot mit Biga gebacken. Das ist nicht wenig.", en: "Seven days ago you couldn't weigh water. Today you baked a biga loaf. That's not nothing." },
    links: [{ route: "banco", it: "Il banco delle prove", de: "Der Probentisch", en: "The test bench" }] },
];

export default function PrimoPane({ onBack }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const L = (o) => (lang === "de" ? o.de : lang === "en" ? o.en : o.it);
  const [done, setDone] = useState(() => LS.get(KEY, {}));
  const [open, setOpen] = useState(() => { const d = LS.get(KEY, {}); const first = DAYS.find((x) => !d[x.n]); return first ? first.n : 7; });
  const [recipes, setRecipes] = useState([]);
  useEffect(() => { let ok = true; recipesApi.list("mikilab").then((d) => { if (ok) setRecipes((d || []).filter((r) => r && !r.locked && num(r.flour_grams) > 0)); }).catch(() => {}); return () => { ok = false; }; }, []);
  const toggle = (n) => { const d = { ...done, [n]: !done[n] }; setDone(d); LS.set(KEY, d); if (d[n]) { const nx = DAYS.find((x) => x.n > n && !d[x.n]); if (nx) setOpen(nx.n); } };
  const count = DAYS.filter((x) => done[x.n]).length;
  const recFor = (key) => (key && FIND[key] ? recipes.find(FIND[key]) : null);

  return (
    <div data-testid="primopane-page" className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <button data-testid="primopane-back" onClick={onBack} className="inline-flex items-center gap-1 text-muted-foreground text-sm font-bold"><ChevronLeft className="w-4 h-4" />{tri("Indietro", "Zurück", "Back")}</button>
      <div>
        <p className="font-mono-data text-[10px] tracking-[0.25em] uppercase text-salvia">{tri("Sto imparando", "Ich lerne", "I'm learning")}</p>
        <h1 className="font-display text-2xl font-black text-foreground">{tri("Il tuo primo pane in 7 giorni", "Dein erstes Brot in 7 Tagen", "Your first bread in 7 days")}</h1>
        <div className="mk-oro-line mt-2 mb-1" />
        <p className="text-sm text-muted-foreground mt-1">{tri("Un passo al giorno, poco alla volta. Non serve saper fare niente: serve una bilancia e un po' di pazienza. Sitor ti accompagna.", "Ein Schritt pro Tag, Stück für Stück. Du musst nichts können: eine Waage und etwas Geduld reichen. Sitor begleitet dich.", "One step a day, a little at a time. You don't need to know anything: a scale and a bit of patience. Sitor walks with you.")}</p>
        <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-salvia transition-all" style={{ width: `${(count / 7) * 100}%` }} /></div>
        <p className="text-[11px] text-muted-foreground mt-1">{count}/7 {tri("giorni fatti", "Tage geschafft", "days done")}</p>
      </div>
      <div className="space-y-2">
        {DAYS.map((d) => {
          const rec = recFor(d.recipe);
          const isOpen = open === d.n;
          return (
            <div key={d.n} data-testid={`pp-day-${d.n}`} className={`rounded-2xl border ${done[d.n] ? "border-salvia/50 bg-salvia/8" : isOpen ? "border-primary/50 bg-card" : "border-border bg-card"}`}>
              <button onClick={() => setOpen(isOpen ? null : d.n)} className="w-full flex items-center gap-3 p-3 text-left">
                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-mono-data font-bold text-[13px] shrink-0 ${done[d.n] ? "bg-salvia text-white" : "bg-muted text-foreground"}`}>{done[d.n] ? <Check className="w-4 h-4" /> : d.n}</span>
                <span className="flex-1 min-w-0"><span className="block text-[14px] font-bold text-foreground">{L(d.t)}</span><span className="block text-[12px] text-muted-foreground truncate">{L(d.goal)}</span></span>
                <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? "rotate-90" : ""}`} />
              </button>
              {isOpen && (
                <div className="px-3 pb-3 space-y-2.5">
                  <ol className="space-y-1.5">{L(d.steps).map((s, i) => <li key={i} className="flex gap-2 text-[13px] text-foreground/90 leading-snug"><span className="font-mono-data text-primary shrink-0">{i + 1}.</span><span>{s}</span></li>)}</ol>
                  <p className="text-[12.5px] text-salvia leading-snug">Sitor: {L(d.sitor)}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {rec && <button data-testid={`pp-recipe-${d.n}`} onClick={() => openRecipe(rec.id)} className="text-[12px] font-bold px-2.5 py-1.5 rounded-full bg-primary text-white active:scale-95">{tri("Apri la ricetta", "Rezept öffnen", "Open the recipe")}: {rLoc(rec, "name", lang)}</button>}
                    {(d.links || []).map((l) => <button key={l.route} data-testid={`pp-link-${l.route}`} onClick={() => nav(l.route)} className="text-[12px] font-semibold px-2.5 py-1.5 rounded-full border border-border bg-background text-foreground active:scale-95">{L(l)}</button>)}
                    <button data-testid={`pp-done-${d.n}`} onClick={() => toggle(d.n)} className={`ml-auto text-[12px] font-bold px-2.5 py-1.5 rounded-full border active:scale-95 ${done[d.n] ? "bg-background text-muted-foreground border-border" : "bg-salvia text-white border-salvia"}`}>{done[d.n] ? tri("Segna come da rifare", "Als offen markieren", "Mark as not done") : tri("Fatto ✓", "Erledigt ✓", "Done ✓")}</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {count === 7 && (
        <div data-testid="pp-finished" className="rounded-2xl border border-salvia/40 bg-salvia/8 p-3 space-y-2">
          <p className="text-[13px] font-bold text-salvia text-center">{tri("Percorso finito. Da oggi sei uno che fa il pane in casa.", "Weg geschafft. Ab heute bist du jemand, der zu Hause Brot backt.", "Path complete. From today you're someone who bakes bread at home.")}</p>
          <p className="text-[12.5px] text-foreground/85 text-center">{tri("Ecco il tuo attestato: mettici il nome, condividilo, appendilo in cucina.", "Hier ist deine Urkunde: Name eintragen, teilen, in die Küche hängen.", "Here is your certificate: add your name, share it, hang it in the kitchen.")}</p>
          <Attestato lang={lang} />
        </div>
      )}
    </div>
  );
}
