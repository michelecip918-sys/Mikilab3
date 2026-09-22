import { useEffect, useRef, useState } from "react";
import { Camera, Eye, Flame, Layers } from "lucide-react";
import { mkTri } from "@/i18n/triMaps";

// V92 — L'OCCHIO DI SITOR. Scatti una foto alla crosta o alla fetta: il telefono la analizza da solo
// (luminosità della crosta, buchi della mollica) e Sitor ti dice cosa vede e cosa cambiare.
// La foto resta nel telefono: viene disegnata su un canvas e letta pixel per pixel, mai inviata.

const SIZE = 200;

function drawCover(ctx, img) {
  const s = Math.max(SIZE / img.width, SIZE / img.height);
  const w = img.width * s, h = img.height * s;
  ctx.drawImage(img, (SIZE - w) / 2, (SIZE - h) / 2, w, h);
}

function grayOf(data) {
  const g = new Float32Array(SIZE * SIZE);
  for (let i = 0, p = 0; i < g.length; i++, p += 4) g[i] = 0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2];
  return g;
}

function percentile(g, q) {
  const a = Array.from(g).sort((x, y) => x - y);
  return a[Math.min(a.length - 1, Math.floor(q * a.length))];
}

function otsu(g) {
  const hist = new Array(256).fill(0);
  for (let i = 0; i < g.length; i++) hist[Math.max(0, Math.min(255, Math.round(g[i])))]++;
  const total = g.length;
  let sum = 0; for (let i = 0; i < 256; i++) sum += i * hist[i];
  let sumB = 0, wB = 0, best = 0, thr = 128;
  for (let i = 0; i < 256; i++) {
    wB += hist[i]; if (!wB) continue;
    const wF = total - wB; if (!wF) break;
    sumB += i * hist[i];
    const mB = sumB / wB, mF = (sum - sumB) / wF;
    const v = wB * wF * (mB - mF) * (mB - mF);
    if (v > best) { best = v; thr = i; }
  }
  return thr;
}

function analyzeCrust(data) {
  const g = grayOf(data);
  const p95 = percentile(g, 0.95);
  const lo = Math.floor(SIZE * 0.2), hi = Math.ceil(SIZE * 0.8);
  let sum = 0, n = 0;
  const quad = [0, 0, 0, 0], qn = [0, 0, 0, 0];
  let red = 0;
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    const i = y * SIZE + x;
    if (x >= lo && x < hi && y >= lo && y < hi) { sum += g[i]; n++; red += data[i * 4] - data[i * 4 + 2]; }
    const q = (y < SIZE / 2 ? 0 : 2) + (x < SIZE / 2 ? 0 : 1);
    quad[q] += g[i]; qn[q]++;
  }
  const mean = sum / n;
  const qm = quad.map((v, i) => v / qn[i]);
  const uneven = Math.max(...qm) - Math.min(...qm);
  return { kind: "crosta", dark: p95 < 90, mean, uneven, warm: red / n > 60 };
}

function analyzeCrumb(data) {
  const g = grayOf(data);
  const p95 = percentile(g, 0.95);
  const thr = otsu(g);
  const hole = new Uint8Array(SIZE * SIZE);
  let holes = 0;
  for (let i = 0; i < g.length; i++) if (g[i] < thr) { hole[i] = 1; holes++; }
  // componenti connesse (4 vicini), per capire se i buchi sono regolari o no
  const seen = new Uint8Array(SIZE * SIZE);
  const sizes = [];
  const stack = [];
  for (let s = 0; s < hole.length; s++) {
    if (!hole[s] || seen[s]) continue;
    let size = 0; stack.push(s); seen[s] = 1;
    while (stack.length) {
      const i = stack.pop(); size++;
      const x = i % SIZE, y = (i - x) / SIZE;
      if (x > 0 && hole[i - 1] && !seen[i - 1]) { seen[i - 1] = 1; stack.push(i - 1); }
      if (x < SIZE - 1 && hole[i + 1] && !seen[i + 1]) { seen[i + 1] = 1; stack.push(i + 1); }
      if (y > 0 && hole[i - SIZE] && !seen[i - SIZE]) { seen[i - SIZE] = 1; stack.push(i - SIZE); }
      if (y < SIZE - 1 && hole[i + SIZE] && !seen[i + SIZE]) { seen[i + SIZE] = 1; stack.push(i + SIZE); }
    }
    if (size >= 4) sizes.push(size);
  }
  const frac = holes / (SIZE * SIZE);
  const meanS = sizes.length ? sizes.reduce((a, b) => a + b, 0) / sizes.length : 0;
  const sd = sizes.length ? Math.sqrt(sizes.reduce((a, b) => a + (b - meanS) * (b - meanS), 0) / sizes.length) : 0;
  const cv = meanS > 0 ? sd / meanS : 0;
  const largest = sizes.length ? Math.max(...sizes) / (SIZE * SIZE) : 0;
  return { kind: "mollica", dark: p95 < 70, frac, count: sizes.length, cv, largest, hole };
}

export default function OcchioDiSitor({ lang }) {
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const [mode, setMode] = useState("crosta");
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const [hasImg, setHasImg] = useState(false);
  const canvasRef = useRef(null);
  const camRef = useRef(null);
  const galRef = useRef(null);
  const imgRef = useRef(null);

  const run = (img, m) => {
    const cv = canvasRef.current; if (!cv || !img) return;
    const ctx = cv.getContext("2d", { willReadFrequently: true });
    ctx.clearRect(0, 0, SIZE, SIZE);
    drawCover(ctx, img);
    const data = ctx.getImageData(0, 0, SIZE, SIZE).data;
    const out = m === "crosta" ? analyzeCrust(data) : analyzeCrumb(data);
    if (out.kind === "mollica" && !out.dark) {
      // evidenzia i buchi trovati, così vedi cosa ha "visto" Sitor
      const im = ctx.getImageData(0, 0, SIZE, SIZE);
      for (let i = 0; i < out.hole.length; i++) if (out.hole[i]) { const p = i * 4; im.data[p] = Math.round(im.data[p] * 0.35 + 217 * 0.65); im.data[p + 1] = Math.round(im.data[p + 1] * 0.35 + 82 * 0.65); im.data[p + 2] = Math.round(im.data[p + 2] * 0.35); }
      ctx.putImageData(im, 0, 0);
    }
    setRes(out);
  };

  const onFile = (file) => {
    if (!file) return;
    setBusy(true);
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { imgRef.current = img; setHasImg(true); run(img, mode); setBusy(false); URL.revokeObjectURL(url); };
    img.onerror = () => { setBusy(false); setRes({ kind: "error" }); URL.revokeObjectURL(url); };
    img.src = url;
  };

  useEffect(() => { if (imgRef.current) run(imgRef.current, mode); /* eslint-disable-next-line */ }, [mode]);

  const crustText = (o) => {
    if (o.dark) return { title: tri("Foto troppo scura", "Foto zu dunkel", "Photo too dark"), body: tri("Non riesco a leggere la crosta: rifai la foto vicino a una finestra, senza flash.", "Ich kann die Kruste nicht lesen: mach das Foto nochmal am Fenster, ohne Blitz.", "I can't read the crust: retake the photo near a window, without flash."), tip: null };
    let title, body, tip;
    if (o.mean > 165) { title = tri("Crosta pallida", "Blasse Kruste", "Pale crust"); body = tri("Manca colore: poco calore alla fine o troppo vapore per troppo tempo.", "Es fehlt Farbe: zu wenig Hitze am Ende oder zu lange Dampf.", "It lacks colour: too little heat at the end or steam for too long."); tip = tri("La prossima volta: vapore solo nei primi 15 minuti, poi sportello aperto un attimo e 10 minuti a 230-240 °C. Per i dolci spennella con latte o uovo.", "Nächstes Mal: Dampf nur in den ersten 15 Minuten, dann Tür kurz öffnen und 10 Minuten bei 230-240 °C. Bei Süßem mit Milch oder Ei bestreichen.", "Next time: steam only for the first 15 minutes, then open the door briefly and 10 minutes at 230-240 °C. For sweet doughs brush with milk or egg."); }
    else if (o.mean > 125) { title = tri("Dorata chiara", "Hell goldbraun", "Light golden"); body = tri("Giusta per panini, brioche e pane in cassetta.", "Richtig für Brötchen, Brioche und Kastenbrot.", "Right for rolls, brioche and tin loaves."); tip = tri("Per un pane rustico avrebbe voluto altri 5-8 minuti: il colore è gusto.", "Ein rustikales Brot hätte noch 5-8 Minuten vertragen: Farbe ist Geschmack.", "A rustic loaf would have wanted another 5-8 minutes: colour is flavour."); }
    else if (o.mean > 85) { title = tri("Ambrata, da panettiere", "Bernsteinfarben, wie vom Bäcker", "Amber, baker's crust"); body = tri("Crosta cotta bene: profumo di caramello e crosta che canta quando si raffredda.", "Gut ausgebacken: Karamellduft und eine Kruste, die beim Abkühlen knistert.", "Well baked: caramel aroma and a crust that crackles as it cools."); tip = tri("Così va bene. Segna nel Banco delle prove tempo e temperatura, per rifarla uguale.", "So passt es. Notier Zeit und Temperatur im Probentisch, um es genau so zu wiederholen.", "That's right. Note time and temperature in the test bench, to repeat it exactly."); }
    else { title = tri("Molto scura", "Sehr dunkel", "Very dark"); body = tri("Se profuma di caramello è un pane 'ben cotto', alla francese. Se sa di bruciato, era troppo.", "Riecht es nach Karamell, ist es ein 'gut ausgebackenes' Brot nach französischer Art. Riecht es verbrannt, war es zu viel.", "If it smells of caramel it's a 'well baked' loaf, French style. If it smells burnt, it was too much."); tip = tri("La prossima volta abbassa di 20 °C dopo i primi 15 minuti, o copri con un foglio di alluminio negli ultimi 10.", "Nächstes Mal nach den ersten 15 Minuten 20 °C runter, oder die letzten 10 Minuten mit Alufolie abdecken.", "Next time lower by 20 °C after the first 15 minutes, or cover with foil for the last 10."); }
    const extra = o.uneven > 45 ? tri("Un lato è molto più scuro dell'altro: il tuo forno scalda di più da una parte. Gira la teglia a metà cottura.", "Eine Seite ist viel dunkler: dein Ofen heizt einseitig. Blech nach der Hälfte der Zeit drehen.", "One side is much darker: your oven heats more on one side. Turn the tray halfway through.") : null;
    return { title, body, tip, extra };
  };

  const crumbText = (o) => {
    if (o.dark) return { title: tri("Foto troppo scura", "Foto zu dunkel", "Photo too dark"), body: tri("Con poca luce ogni ombra sembra un buco. Rifai la foto alla fetta con luce dal lato, senza flash.", "Bei wenig Licht sieht jeder Schatten wie ein Loch aus. Mach das Foto der Scheibe nochmal mit Seitenlicht, ohne Blitz.", "In low light every shadow looks like a hole. Retake the slice photo with light from the side, no flash."), tip: null };
    const pct = Math.round(o.frac * 100);
    let title, body, tip;
    if (o.frac < 0.10) { title = tri("Mollica compatta", "Dichte Krume", "Dense crumb"); body = tri(`Buchi: circa il ${pct} % della fetta. Pane fitto, pesante.`, `Löcher: etwa ${pct} % der Scheibe. Dichtes, schweres Brot.`, `Holes: about ${pct} % of the slice. Dense, heavy bread.`); tip = tri("Quasi sempre è poca lievitazione: dagli più tempo o più caldo, e non aggiungere farina mentre lavori. Controlla la crescita con il Righello della ciotola.", "Fast immer zu kurze Gare: mehr Zeit oder mehr Wärme, und beim Kneten kein Mehl nachschütten. Prüf das Wachstum mit dem Schüssel-Lineal.", "Almost always under-proofing: give it more time or more warmth, and don't add flour while working. Check the rise with the bowl ruler."); }
    else if (o.frac < 0.22) { title = tri("Mollica fine e regolare", "Feine, gleichmäßige Krume", "Fine, even crumb"); body = tri(`Buchi: circa il ${pct} % della fetta. È la mollica giusta per toast, panini e dolci.`, `Löcher: etwa ${pct} % der Scheibe. Die richtige Krume für Toast, Brötchen und Süßes.`, `Holes: about ${pct} % of the slice. The right crumb for toast, rolls and sweet breads.`); tip = tri("Se volevi un pane rustico più aperto: +5 % di acqua, pieghe delicate e forma meno stretta.", "Wolltest du ein offeneres rustikales Brot: +5 % Wasser, sanfte Faltungen und weniger straff formen.", "If you wanted a more open rustic loaf: +5 % water, gentle folds and a less tight shape."); }
    else if (o.frac < 0.38) { title = tri("Mollica aperta", "Offene Krume", "Open crumb"); body = tri(`Buchi: circa il ${pct} % della fetta. Bella alveolatura da pane rustico.`, `Löcher: etwa ${pct} % der Scheibe. Schöne, offene Porung wie bei rustikalem Brot.`, `Holes: about ${pct} % of the slice. Nice open crumb, rustic style.`); tip = tri("Complimenti: idratazione e lievitazione hanno lavorato insieme. Segnati come hai fatto.", "Glückwunsch: Hydration und Gare haben zusammengearbeitet. Notier dir, wie du es gemacht hast.", "Well done: hydration and fermentation worked together. Write down how you did it."); }
    else { title = tri("Molto aperta (o tante ombre)", "Sehr offen (oder viele Schatten)", "Very open (or lots of shadows)"); body = tri(`Buchi: circa il ${pct} % della fetta.`, `Löcher: etwa ${pct} % der Scheibe.`, `Holes: about ${pct} % of the slice.`); tip = tri("Se i buchi sono davvero così, la forma era poco stretta o la lievitazione finale troppo lunga. Se la foto ha ombre forti, rifalla con luce diffusa.", "Sind die Löcher wirklich so groß, war die Form zu locker oder die Endgare zu lang. Hat das Foto starke Schatten, wiederhole es bei diffusem Licht.", "If the holes really are like that, the shaping was too loose or the final proof too long. If the photo has hard shadows, retake it in soft light."); }
    const extras = [];
    if (o.largest > 0.12) extras.push(tri("C'è un buco enorme: aria intrappolata nella formatura, oppure impasto lievitato oltre. Chiudi meglio il pezzo e riduci un po' la lievitazione finale.", "Da ist ein riesiges Loch: Luft beim Formen eingeschlossen oder Teig übergangen. Den Laib besser schließen und die Endgare etwas kürzen.", "There's a huge hole: air trapped while shaping, or over-proofed dough. Seal the loaf better and shorten the final proof a bit."));
    else if (o.cv > 1.1 && o.count > 8) extras.push(tri("Buchi molto diversi tra loro: formatura poco uniforme. La prossima volta sgonfia con delicatezza e forma con la stessa tensione dappertutto.", "Sehr unterschiedliche Löcher: ungleichmäßiges Formen. Nächstes Mal sanft entgasen und überall mit gleicher Spannung formen.", "Holes of very different sizes: uneven shaping. Next time degas gently and shape with the same tension everywhere."));
    return { title, body, tip, extra: extras[0] || null };
  };

  const view = res && res.kind !== "error" ? (res.kind === "crosta" ? crustText(res) : crumbText(res)) : null;

  return (
    <div data-testid="occhio-di-sitor" className="space-y-3">
      <p className="text-[12.5px] text-foreground/85 leading-snug">{tri("Fai una foto alla crosta o a una fetta: la leggo qui, nel tuo telefono, e ti dico cosa vedo.", "Mach ein Foto der Kruste oder einer Scheibe: ich lese es hier, in deinem Handy, und sage dir, was ich sehe.", "Take a photo of the crust or a slice: I read it here, on your phone, and tell you what I see.")}</p>
      <div className="flex gap-1.5">
        {[{ k: "crosta", I: Flame, l: tri("Crosta", "Kruste", "Crust") }, { k: "mollica", I: Layers, l: tri("Mollica (fetta)", "Krume (Scheibe)", "Crumb (slice)") }].map((m) => (
          <button key={m.k} data-testid={`ods-mode-${m.k}`} onClick={() => setMode(m.k)} className={`flex-1 inline-flex items-center justify-center gap-1.5 text-[12px] font-bold px-3 py-2 rounded-xl border active:scale-95 ${mode === m.k ? "bg-primary text-white border-primary" : "bg-card text-muted-foreground border-border"}`}><m.I className="w-3.5 h-3.5" />{m.l}</button>
        ))}
      </div>
      <input ref={camRef} data-testid="ods-file-camera" type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { onFile(e.target.files && e.target.files[0]); e.target.value = ""; }} />
      <input ref={galRef} data-testid="ods-file-gallery" type="file" accept="image/*" className="hidden" onChange={(e) => { onFile(e.target.files && e.target.files[0]); e.target.value = ""; }} />
      <div className="flex gap-1.5">
        <button data-testid="ods-shoot" onClick={() => camRef.current && camRef.current.click()} className="flex-1 inline-flex items-center justify-center gap-1.5 text-[12px] font-bold px-3 py-2 rounded-xl bg-salvia text-white active:scale-95"><Camera className="w-4 h-4" />{tri("Scatta", "Aufnehmen", "Shoot")}</button>
        <button data-testid="ods-pick" onClick={() => galRef.current && galRef.current.click()} className="flex-1 inline-flex items-center justify-center gap-1.5 text-[12px] font-bold px-3 py-2 rounded-xl border border-border bg-card text-foreground active:scale-95"><Eye className="w-4 h-4" />{tri("Dalla galleria", "Aus der Galerie", "From gallery")}</button>
      </div>
      <div className="flex gap-3 items-start">
        <canvas ref={canvasRef} width={SIZE} height={SIZE} data-testid="ods-canvas" className={`rounded-xl border border-border bg-muted shrink-0 w-[120px] h-[120px] ${hasImg ? "" : "opacity-40"}`} />
        <div className="flex-1 min-w-0">
          {busy && <p className="text-[12px] text-muted-foreground">{tri("Guardo…", "Ich schaue…", "Looking…")}</p>}
          {!busy && !res && <p className="text-[12px] text-muted-foreground leading-snug">{mode === "crosta" ? tri("Inquadra la crosta dall'alto, con luce naturale. Non usare il flash: sbianca tutto.", "Kruste von oben bei Tageslicht aufnehmen. Kein Blitz: der bleicht alles aus.", "Frame the crust from above, in daylight. No flash: it bleaches everything.") : tri("Inquadra una fetta intera, che riempia la foto, con la luce che arriva di lato.", "Eine ganze Scheibe formatfüllend aufnehmen, mit Licht von der Seite.", "Frame a whole slice filling the photo, with light coming from the side.")}</p>}
          {res && res.kind === "error" && <p className="text-[12px] text-destructive">{tri("Non riesco a leggere questa immagine.", "Ich kann dieses Bild nicht lesen.", "I can't read this image.")}</p>}
          {view && (
            <div data-testid="ods-result" className="space-y-1">
              <p className="text-[13px] font-bold text-foreground">{view.title}</p>
              <p className="text-[12px] text-foreground/85 leading-snug">{view.body}</p>
              {view.tip && <p className="text-[12px] text-salvia leading-snug">Sitor: {view.tip}</p>}
              {view.extra && <p className="text-[12px] text-salvia leading-snug">{view.extra}</p>}
              {res.kind === "mollica" && !res.dark && <p className="text-[10.5px] text-muted-foreground">{tri("In arancione: i buchi che ho contato.", "Orange: die Löcher, die ich gezählt habe.", "In orange: the holes I counted.")}</p>}
            </div>
          )}
        </div>
      </div>
      <p className="text-[10.5px] text-muted-foreground">{tri("La foto non lascia il telefono: viene letta qui e non viene salvata. È un occhio, non un giudice: la prova vera resta il sapore.", "Das Foto verlässt das Handy nicht: es wird hier gelesen und nicht gespeichert. Ein Auge, kein Richter: die echte Probe bleibt der Geschmack.", "The photo never leaves your phone: it's read here and not saved. It's an eye, not a judge: the real test is still the taste.")}</p>
    </div>
  );
}
