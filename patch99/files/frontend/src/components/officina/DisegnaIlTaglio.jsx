import { useState } from "react";
import { Scissors } from "lucide-react";
import { mkTri } from "@/i18n/triMaps";
import { recipeKind } from "@/lib/sitorTools";

// V92 — DISEGNA IL TAGLIO. Scegli la forma del pane e lo schema: lo vedi disegnato, e Sitor ti dice
// angolo della lametta, profondità e gesto. Con "mostra come si apre" vedi il pane dopo il forno.

const SHAPES = [
  { k: "boule", it: "Pagnotta tonda", de: "Runder Laib", en: "Round loaf", vb: "0 0 240 240", body: "M120,20 a100,100 0 1,0 0.1,0 z" },
  { k: "batard", it: "Filone", de: "Länglicher Laib", en: "Bâtard", vb: "0 0 320 200", body: "M40,100 C40,40 90,25 160,25 C230,25 280,40 280,100 C280,160 230,175 160,175 C90,175 40,160 40,100 z" },
  { k: "baguette", it: "Baguette", de: "Baguette", en: "Baguette", vb: "0 0 400 120", body: "M20,60 C20,30 40,22 70,22 L330,22 C360,22 380,30 380,60 C380,90 360,98 330,98 L70,98 C40,98 20,90 20,60 z" },
  { k: "cassetta", it: "Pane in cassetta", de: "Kastenbrot", en: "Tin loaf", vb: "0 0 320 200", body: "M40,40 h240 a20,20 0 0,1 20,20 v100 a20,20 0 0,1 -20,20 h-240 a20,20 0 0,1 -20,-20 v-100 a20,20 0 0,1 20,-20 z" },
];

// Ogni schema: percorsi SVG nel sistema della forma, angolo lametta (30° = di sbieco per l'orecchia, 90° = dritto).
const PATTERNS = {
  boule: [
    { k: "croce", it: "Croce", de: "Kreuz", en: "Cross", angle: 90, d: ["M120,60 L120,180", "M60,120 L180,120"] },
    { k: "quadrato", it: "Quadrato", de: "Quadrat", en: "Square", angle: 90, d: ["M70,70 L170,70", "M170,70 L170,170", "M170,170 L70,170", "M70,170 L70,70"] },
    { k: "spiga", it: "Spiga", de: "Ähre", en: "Wheat ear", angle: 90, d: ["M120,45 L120,195", "M120,80 L85,60", "M120,80 L155,60", "M120,115 L85,95", "M120,115 L155,95", "M120,150 L85,130", "M120,150 L155,130"] },
    { k: "girandola", it: "Girandola", de: "Windrad", en: "Pinwheel", angle: 90, d: ["M120,120 Q120,55 60,45", "M120,120 Q185,120 195,60", "M120,120 Q120,185 180,195", "M120,120 Q55,120 45,180"] },
    { k: "griglia", it: "Griglia", de: "Gitter", en: "Grid", angle: 90, d: ["M85,50 L85,190", "M155,50 L155,190", "M50,85 L190,85", "M50,155 L190,155"] },
    { k: "foglia", it: "Foglia", de: "Blatt", en: "Leaf", angle: 30, d: ["M120,40 L120,200", "M120,90 Q95,80 75,60", "M120,90 Q145,80 165,60", "M120,130 Q95,120 70,105", "M120,130 Q145,120 170,105", "M120,170 Q100,160 80,150", "M120,170 Q140,160 160,150"] },
    { k: "unico", it: "Taglio unico curvo", de: "Ein geschwungener Schnitt", en: "Single curved cut", angle: 30, d: ["M65,150 Q120,40 175,80"] },
  ],
  batard: [
    { k: "orecchio", it: "Orecchia (un taglio lungo)", de: "Ohr (ein langer Schnitt)", en: "Ear (one long cut)", angle: 30, d: ["M70,110 Q160,60 250,90"] },
    { k: "doppio", it: "Doppio parallelo", de: "Zwei parallele", en: "Two parallel", angle: 30, d: ["M60,120 L200,75", "M120,130 L260,85"] },
    { k: "tre", it: "Tre obliqui", de: "Drei schräge", en: "Three diagonal", angle: 30, d: ["M75,130 L125,70", "M135,130 L185,70", "M195,130 L245,70"] },
    { k: "spiga", it: "Spiga", de: "Ähre", en: "Wheat ear", angle: 90, d: ["M60,100 L260,100", "M100,100 L80,75", "M100,100 L80,125", "M150,100 L130,75", "M150,100 L130,125", "M200,100 L180,75", "M200,100 L180,125", "M250,100 L230,75", "M250,100 L230,125"] },
    { k: "centrale", it: "Centrale dritto", de: "Gerade Mitte", en: "Straight centre", angle: 90, d: ["M60,100 L260,100"] },
    { k: "trasversali", it: "Trasversali", de: "Quer", en: "Crosswise", angle: 90, d: ["M95,55 L95,145", "M160,50 L160,150", "M225,55 L225,145"] },
  ],
  baguette: [
    { k: "classico3", it: "Classico, 3 tagli", de: "Klassisch, 3 Schnitte", en: "Classic, 3 cuts", angle: 30, d: ["M55,72 L150,50", "M135,72 L230,50", "M215,72 L310,50"] },
    { k: "classico5", it: "Classico, 5 tagli", de: "Klassisch, 5 Schnitte", en: "Classic, 5 cuts", angle: 30, d: ["M40,70 L100,52", "M90,72 L150,52", "M140,72 L200,52", "M190,72 L250,52", "M240,72 L300,52"] },
    { k: "unico", it: "Un taglio lungo", de: "Ein langer Schnitt", en: "One long cut", angle: 30, d: ["M60,64 L340,56"] },
    { k: "trasversali", it: "Trasversali", de: "Quer", en: "Crosswise", angle: 90, d: ["M80,35 L80,85", "M140,35 L140,85", "M200,35 L200,85", "M260,35 L260,85", "M320,35 L320,85"] },
  ],
  cassetta: [
    { k: "centrale", it: "Centrale lungo", de: "Lang durch die Mitte", en: "Long centre", angle: 90, d: ["M60,100 L260,100"] },
    { k: "trasversali", it: "Trasversali", de: "Quer", en: "Crosswise", angle: 90, d: ["M90,60 L90,140", "M160,60 L160,140", "M230,60 L230,140"] },
    { k: "obliquo", it: "Unico obliquo", de: "Ein schräger", en: "Single diagonal", angle: 30, d: ["M60,130 L260,70"] },
    { k: "nessuno", it: "Nessun taglio", de: "Kein Schnitt", en: "No cut", angle: 0, d: [] },
  ],
};

export default function DisegnaIlTaglio({ r, lang }) {
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const L = (o) => (lang === "de" ? o.de : lang === "en" ? o.en : o.it);
  const kind = r ? recipeKind(r) : "pane";
  const [shape, setShape] = useState(kind === "panini" ? "boule" : /baguette|filon|ciabatt|sfilat/i.test((r && r.name) || "") ? "baguette" : /cassett|toast|kasten|tin/i.test((r && r.name) || "") ? "cassetta" : "boule");
  const [pat, setPat] = useState(0);
  const [open, setOpen] = useState(false);
  const sh = SHAPES.find((s) => s.k === shape) || SHAPES[0];
  const list = PATTERNS[sh.k];
  const P = list[Math.min(pat, list.length - 1)];

  const tip = P.angle === 30
    ? tri("Lametta quasi sdraiata, a 30°: il lembo si solleva in cottura e fa l'orecchia. Profondità 0,5-1 cm, un gesto solo, deciso, senza fermarsi.", "Klinge fast flach, im 30°-Winkel: die Lippe hebt sich beim Backen und bildet das Ohr. 0,5-1 cm tief, eine einzige entschlossene Bewegung, ohne anzuhalten.", "Blade almost flat, at 30°: the flap lifts in the oven and makes the ear. 0.5-1 cm deep, one single decisive stroke, without stopping.")
    : P.angle === 90
      ? tri("Lametta dritta, a 90°: il taglio si apre uniforme da tutte e due le parti. Profondità 0,5-1 cm; per i disegni fitti basta 0,5 cm.", "Klinge senkrecht, 90°: der Schnitt öffnet sich gleichmäßig nach beiden Seiten. 0,5-1 cm tief; bei dichten Mustern reichen 0,5 cm.", "Blade upright, at 90°: the cut opens evenly on both sides. 0.5-1 cm deep; for dense patterns 0.5 cm is enough.")
      : tri("Pane in cassetta senza taglio: la crosta resta liscia per i toast. Se ha il coperchio, non serve tagliare; senza coperchio un taglio centrale evita che si apra di lato.", "Kastenbrot ohne Schnitt: glatte Kruste für Toast. Mit Deckel braucht es keinen Schnitt; ohne Deckel verhindert ein Schnitt in der Mitte, dass es seitlich aufreißt.", "Tin loaf without a cut: the crust stays smooth for toast. With a lid no cut is needed; without a lid a centre cut stops it bursting at the side.");

  return (
    <div data-testid="disegna-il-taglio" className="space-y-3">
      <p className="text-[13px] text-foreground/85 leading-snug">{tri("Il taglio è la valvola del pane: decide dove si apre. Scegli la forma e lo schema, poi guarda come viene dopo il forno.", "Der Schnitt ist das Ventil des Brotes: er entscheidet, wo es aufgeht. Wähle Form und Muster, dann sieh, wie es nach dem Ofen aussieht.", "The score is the loaf's valve: it decides where it opens. Pick the shape and the pattern, then see how it looks after the oven.")}</p>
      <div className="flex flex-wrap gap-1.5">
        {SHAPES.map((s) => <button key={s.k} data-testid={`dt-shape-${s.k}`} onClick={() => { setShape(s.k); setPat(0); }} className={`text-[12px] font-semibold px-2.5 py-1.5 rounded-full border active:scale-95 ${shape === s.k ? "bg-primary text-white border-primary" : "bg-card text-muted-foreground border-border"}`}>{L(s)}</button>)}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {list.map((p, i) => <button key={p.k} data-testid={`dt-pat-${p.k}`} onClick={() => setPat(i)} className={`text-[12px] font-semibold px-2.5 py-1.5 rounded-full border active:scale-95 ${pat === i ? "bg-salvia text-white border-salvia" : "bg-card text-muted-foreground border-border"}`}>{L(p)}</button>)}
      </div>
      <div className="rounded-xl border border-border bg-card p-3">
        <svg data-testid="dt-svg" viewBox={sh.vb} className="w-full h-auto max-h-56" role="img" aria-label={`${L(sh)} · ${L(P)}`}>
          <defs>
            <radialGradient id="dtCrust" cx="45%" cy="40%" r="70%"><stop offset="0%" stopColor="#E8B36A" /><stop offset="100%" stopColor="#B86A24" /></radialGradient>
          </defs>
          <path d={sh.body} fill="url(#dtCrust)" stroke="#8A4A14" strokeWidth="3" />
          {open && P.d.map((d, i) => <path key={`o${i}`} d={d} fill="none" stroke="#F6E7C8" strokeWidth={P.angle === 30 ? 16 : 11} strokeLinecap="round" strokeLinejoin="round" opacity="0.95" />)}
          {open && P.angle === 30 && P.d.map((d, i) => <path key={`e${i}`} d={d} fill="none" stroke="#7A3E10" strokeWidth="5" strokeLinecap="round" transform="translate(-4,-5)" opacity="0.85" />)}
          {P.d.map((d, i) => <path key={i} d={d} fill="none" stroke={open ? "#C79A5A" : "#5A2C0A"} strokeWidth={open ? 2 : 3.5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={open ? "0" : "0"} />)}
        </svg>
        <label className="mt-2 flex items-center gap-2 text-[12.5px] text-foreground cursor-pointer">
          <input data-testid="dt-open" type="checkbox" checked={open} onChange={(e) => setOpen(e.target.checked)} className="accent-[hsl(var(--primary))]" />
          {tri("Mostra come si apre in cottura", "Zeigen, wie es beim Backen aufgeht", "Show how it opens while baking")}
        </label>
      </div>
      {P.angle > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
          <svg viewBox="0 0 120 60" className="w-28 h-14 shrink-0" aria-hidden>
            <path d="M5,45 Q60,25 115,45" fill="none" stroke="#B86A24" strokeWidth="4" strokeLinecap="round" />
            {P.angle === 30
              ? <g><line x1="60" y1="34" x2="104" y2="10" stroke="hsl(var(--foreground))" strokeWidth="3" strokeLinecap="round" /><path d="M60,34 L82,22" stroke="hsl(var(--primary))" strokeWidth="2" strokeDasharray="3 2" fill="none" /><text x="70" y="52" fontSize="10" fill="hsl(var(--muted-foreground))">30°</text></g>
              : <g><line x1="60" y1="34" x2="60" y2="6" stroke="hsl(var(--foreground))" strokeWidth="3" strokeLinecap="round" /><text x="66" y="16" fontSize="10" fill="hsl(var(--muted-foreground))">90°</text></g>}
          </svg>
          <p className="text-[12.5px] text-foreground/85 leading-snug flex items-start gap-1.5"><Scissors className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />{tip}</p>
        </div>
      )}
      {P.angle === 0 && <p className="text-[12.5px] text-foreground/85 leading-snug">{tip}</p>}
      <p className="text-[12.5px] text-salvia leading-snug">{tri("Sitor: taglia l'impasto freddo di frigo, se puoi: la lametta scorre e non si impasta. Spolvera un velo di farina prima: il disegno resta chiaro anche dopo la cottura.", "Sitor: schneide den Teig kühlschrankkalt, wenn du kannst: die Klinge gleitet und verklebt nicht. Vorher hauchdünn bemehlen: das Muster bleibt auch nach dem Backen hell.", "Sitor: score the dough fridge-cold if you can: the blade glides and doesn't stick. Dust a veil of flour first: the pattern stays pale even after baking.")}</p>
    </div>
  );
}
