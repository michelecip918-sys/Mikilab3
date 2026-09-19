import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Utensils, ChevronRight, Check, MessageCircle, Share2 } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { api } from "@/lib/api";
import { addPalato, getLastPalato } from "@/lib/mycucina";

// P1 — "Il mio palato": assaggio guidato a 7 criteri + radar SVG. Tutto sul dispositivo.
const CRITERIA = [
  { k: "aspetto", it: "Aspetto", de: "Aussehen", en: "Look", help: { it: "Colore uniforme? Volume giusto?", de: "Gleichmäßige Farbe? Richtiges Volumen?", en: "Even colour? Right volume?" } },
  { k: "crosta", it: "Crosta", de: "Kruste", en: "Crust", help: { it: "Croccante e sottile o dura e spessa?", de: "Knusprig und dünn oder hart und dick?", en: "Crisp and thin or hard and thick?" } },
  { k: "mollica", it: "Mollica", de: "Krume", en: "Crumb", help: { it: "Alveoli grandi e irregolari, piccoli e regolari o compatta?", de: "Große unregelmäßige, kleine regelmäßige Poren oder kompakt?", en: "Large irregular, small regular holes or dense?" } },
  { k: "consistenza", it: "Consistenza", de: "Konsistenz", en: "Texture", help: { it: "Morbida ed elastica o gommosa/asciutta?", de: "Weich und elastisch oder gummig/trocken?", en: "Soft and springy or gummy/dry?" } },
  { k: "profumo", it: "Profumo", de: "Aroma", en: "Aroma", help: { it: "Profumo di grano e fermentazione o acidulo/piatto?", de: "Getreide- und Gäraroma oder säuerlich/flach?", en: "Wheat and ferment or sour/flat?" } },
  { k: "sapore", it: "Sapore", de: "Geschmack", en: "Flavour", help: { it: "Dolce, sapido, acidulo? Sale giusto?", de: "Süß, herzhaft, säuerlich? Salz passend?", en: "Sweet, savoury, tangy? Salt right?" } },
  { k: "freschezza", it: "Freschezza", de: "Frische", en: "Freshness", help: { it: "Oggi o il giorno dopo: ancora morbido?", de: "Heute oder am Tag danach: noch weich?", en: "Today or next day: still soft?" } },
];
const STEPS = [
  { it: "Guarda: colore e volume", de: "Schau: Farbe und Volumen", en: "Look: colour and volume" },
  { it: "Annusa: avvicina il naso", de: "Riechen: Nase nah dran", en: "Smell: bring your nose close" },
  { it: "Premi la crosta con il dito", de: "Drück die Kruste mit dem Finger", en: "Press the crust with a finger" },
  { it: "Strappa la mollica a mano", de: "Reiß die Krume mit der Hand", en: "Tear the crumb by hand" },
  { it: "Assaggia un boccone", de: "Koste einen Bissen", en: "Taste a bite" },
  { it: "Aspetta il retrogusto", de: "Warte auf den Nachgeschmack", en: "Wait for the aftertaste" },
  { it: "Valuta la freschezza (oggi/domani)", de: "Beurteile die Frische (heute/morgen)", en: "Judge the freshness (today/tomorrow)" },
];
// Suggerimenti pre-scritti (BOZZA di Sitor), mostrati per i voti sotto 3. Nessuna IA.
const TIPS = {
  aspetto: { it: "Cura la formatura e non cuocere troppo presto: fai crescere bene prima del forno.", de: "Achte aufs Formen und back nicht zu früh: gut gehen lassen.", en: "Mind shaping and don't bake too early: let it prove well." },
  crosta: { it: "Più vapore all'inizio e forno ben caldo per una crosta sottile e croccante.", de: "Mehr Dampf am Anfang und heißer Ofen für dünne, knusprige Kruste.", en: "More steam at the start and a hot oven for a thin, crisp crust." },
  mollica: { it: "Idrata di più e fai più pieghe per alveoli aperti; impasta bene per una mollica regolare.", de: "Mehr Hydratation und mehr Falten für offene Poren; gut kneten für gleichmäßige Krume.", en: "More hydration and folds for open holes; knead well for even crumb." },
  consistenza: { it: "Non asciugare troppo in cottura: abbassa gli ultimi minuti o accorcia la cottura.", de: "Nicht zu trocken backen: die letzten Minuten senken oder kürzer backen.", en: "Don't over-dry: lower the last minutes or bake shorter." },
  profumo: { it: "Allunga la lievitazione (anche in frigo) per più profumo di grano.", de: "Verlängere die Gare (auch im Kühlschrank) für mehr Getreidearoma.", en: "Extend fermentation (even in the fridge) for more wheat aroma." },
  sapore: { it: "Ricontrolla il sale (circa 2% sulla farina) e allunga la fermentazione per più gusto.", de: "Salz prüfen (~2% auf Mehl) und Gärung verlängern für mehr Geschmack.", en: "Check salt (~2% of flour) and extend fermentation for more flavour." },
  freschezza: { it: "Conserva in un sacchetto di stoffa; per durare di più prova un poolish o la farina cotta.", de: "In einem Stoffbeutel lagern; für länger frisch ein Poolish oder Kochstück probieren.", en: "Store in a cloth bag; for longer freshness try a poolish or cooked flour." },
};

function Radar({ scores }) {
  const R = 78, cx = 100, cy = 96;
  const pts = CRITERIA.map((c, i) => {
    const ang = (Math.PI * 2 * i) / CRITERIA.length - Math.PI / 2;
    const v = (scores[c.k] || 0) / 5;
    return [cx + Math.cos(ang) * R * v, cy + Math.sin(ang) * R * v];
  });
  const axis = CRITERIA.map((c, i) => {
    const ang = (Math.PI * 2 * i) / CRITERIA.length - Math.PI / 2;
    return [cx + Math.cos(ang) * R, cy + Math.sin(ang) * R, ang];
  });
  return (
    <svg viewBox="0 0 200 200" className="w-full max-w-[280px] mx-auto" data-testid="palato-radar">
      {[0.33, 0.66, 1].map((r, i) => (
        <polygon key={i} points={CRITERIA.map((c, j) => { const a = (Math.PI * 2 * j) / CRITERIA.length - Math.PI / 2; return `${cx + Math.cos(a) * R * r},${cy + Math.sin(a) * R * r}`; }).join(" ")}
          fill="none" stroke="currentColor" className="text-border" strokeWidth="0.6" />
      ))}
      {axis.map(([x, y], i) => <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="currentColor" className="text-border" strokeWidth="0.5" />)}
      <polygon points={pts.map((p) => p.join(",")).join(" ")} fill="rgba(217,119,54,0.28)" stroke="rgb(217,119,54)" strokeWidth="1.5" />
      {axis.map(([x, y], i) => (
        <text key={i} x={cx + (x - cx) * 1.16} y={cy + (y - cy) * 1.16} fontSize="7" textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground">{CRITERIA[i].it.slice(0, 8)}</text>
      ))}
    </svg>
  );
}

export default function Palato({ recipe = "", level = "casa", compact = false }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const L = (o) => o[lang] || o.it;
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState("guide"); // guide | score | result
  const [step, setStep] = useState(0);
  const [count, setCount] = useState(10);
  const [scores, setScores] = useState({});
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);
  const [tips, setTips] = useState(null);
  const timerRef = useRef(null);
  const prev = recipe ? getLastPalato(recipe) : null;
  const tipFor = (k) => (tips && tips[k]) ? (tips[k][lang] || tips[k].it) : L(TIPS[k]);

  useEffect(() => { api.get(`/palato-tips`).then((r) => setTips(r.data && r.data.tips)).catch(() => {}); }, []);

  useEffect(() => {
    if (!open || phase !== "guide") return;
    setCount(10);
    timerRef.current = setInterval(() => setCount((c) => (c <= 1 ? 10 : c - 1)), 1000);
    return () => clearInterval(timerRef.current);
  }, [open, phase, step]);

  const reset = () => { setPhase("guide"); setStep(0); setScores({}); setNote(""); setSaved(false); };
  const start = () => { reset(); setOpen(true); };
  const nextStep = () => { if (step < STEPS.length - 1) setStep(step + 1); else { clearInterval(timerRef.current); setPhase("score"); } };

  const save = () => {
    addPalato({ recipe: recipe || tri("Assaggio", "Verkostung", "Tasting"), scores, note: note.trim() });
    setSaved(true);
  };
  const askSitor = () => {
    const summary = CRITERIA.map((c) => `${L(c)}: ${scores[c.k] || "?"}/5`).join(", ");
    const msg = tri(`Ho assaggiato ${recipe || "il pane"}. ${summary}. Come posso migliorare?`,
      `Ich habe ${recipe || "das Brot"} verkostet. ${summary}. Wie kann ich mich verbessern?`,
      `I tasted ${recipe || "the bread"}. ${summary}. How can I improve?`);
    setOpen(false);
    try { window.dispatchEvent(new CustomEvent("mikilab-open-chat")); setTimeout(() => window.dispatchEvent(new CustomEvent("mikilab-chat-prefill", { detail: { text: msg } })), 250); } catch { /* */ }
  };
  const low = CRITERIA.filter((c) => (scores[c.k] || 0) > 0 && (scores[c.k] || 0) < 3);

  const shareCard = async () => {
    const W = 1080, H = 1080, c = document.createElement("canvas"); c.width = W; c.height = H;
    const ctx = c.getContext("2d");
    const cream = "#f5ede0", ink = "#2a2018", rame = "#c9772e";
    ctx.fillStyle = cream; ctx.fillRect(0, 0, W, H);
    ctx.textAlign = "center"; ctx.fillStyle = ink; ctx.font = "bold 64px Georgia, serif";
    ctx.fillText(tri("Il mio palato", "Mein Gaumen", "My palate"), W / 2, 120);
    ctx.font = "500 40px Arial"; ctx.fillStyle = rame; ctx.fillText(recipe || tri("Assaggio", "Verkostung", "Tasting"), W / 2, 180);
    const cx = W / 2, cy = 600, R = 300, N = CRITERIA.length;
    const pt = (i, r) => { const a = (Math.PI * 2 * i) / N - Math.PI / 2; return [cx + Math.cos(a) * R * r, cy + Math.sin(a) * R * r]; };
    ctx.strokeStyle = "rgba(42,32,24,0.25)"; ctx.lineWidth = 2;
    [0.33, 0.66, 1].forEach((r) => { ctx.beginPath(); CRITERIA.forEach((cc, i) => { const [x, y] = pt(i, r); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.closePath(); ctx.stroke(); });
    CRITERIA.forEach((cc, i) => { const [x, y] = pt(i, 1); ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x, y); ctx.stroke(); });
    ctx.beginPath(); CRITERIA.forEach((cc, i) => { const [x, y] = pt(i, (scores[cc.k] || 0) / 5); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.closePath();
    ctx.fillStyle = "rgba(201,119,46,0.32)"; ctx.fill(); ctx.strokeStyle = rame; ctx.lineWidth = 4; ctx.stroke();
    ctx.fillStyle = ink; ctx.font = "bold 30px Arial";
    CRITERIA.forEach((cc, i) => { const a = (Math.PI * 2 * i) / N - Math.PI / 2; ctx.fillText(L(cc), cx + Math.cos(a) * (R + 55), cy + Math.sin(a) * (R + 55) + 8); });
    ctx.fillStyle = rame; ctx.font = "600 34px Arial"; ctx.fillText("#MikiLab", W / 2, H - 88);
    ctx.fillStyle = ink; ctx.font = "500 28px Arial"; ctx.fillText("Sitor · di MikiLab", W / 2, H - 46);
    const blob = await new Promise((res) => c.toBlob(res, "image/jpeg", 0.9));
    const file = new File([blob], "palato-mikilab.jpg", { type: "image/jpeg" });
    try { if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: "MikiLab" }); return; } } catch { /* */ }
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "palato-mikilab.jpg"; a.click();
  };

  return (
    <>
      <button data-testid="palato-btn" onClick={start}
        className={`inline-flex items-center gap-2 rounded-xl font-bold active:scale-95 transition-all border border-ambra/50 bg-ambra/15 text-foreground ${compact ? "px-3 py-2 text-xs" : "px-4 py-2.5 text-sm"}`}>
        <Utensils className="w-4 h-4 text-ambra" /> {tri("Assaggia con Sitor", "Mit Sitor verkosten", "Taste with Sitor")}
      </button>

      {open && createPortal((
        <div data-testid="palato-modal" className="fixed inset-0 z-[130] flex items-end sm:items-center justify-center bg-background/70 backdrop-blur-sm p-3" onClick={() => setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl border border-ambra/40 bg-background shadow-2xl max-h-[88vh] overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 sticky top-0 bg-background">
              <p className="font-display font-black text-foreground">{tri("Il mio palato", "Mein Gaumen", "My palate")}</p>
              <button data-testid="palato-close" onClick={() => setOpen(false)} className="p-2 rounded-full bg-foreground/10 active:scale-90 text-foreground"><X className="w-4 h-4" /></button>
            </div>

            {phase === "guide" && (
              <div data-testid="palato-guide" className="p-5 space-y-4 text-center">
                <p className="text-[11px] font-bold uppercase tracking-wide text-ambra">{tri("Passo", "Schritt", "Step")} {step + 1}/{STEPS.length}</p>
                <p className="font-display text-2xl font-bold text-foreground">{L(STEPS[step])}</p>
                <div className="w-16 h-16 mx-auto rounded-full border-4 border-ambra/40 flex items-center justify-center font-black text-xl text-ambra">{count}</div>
                <p className="text-xs text-muted-foreground">{tri("A mani pulite, con calma.", "Mit sauberen Händen, in Ruhe.", "Clean hands, take your time.")}</p>
                <button data-testid="palato-next-step" onClick={nextStep} className="w-full py-3 rounded-xl bg-ambra text-white font-bold active:scale-95 inline-flex items-center justify-center gap-2">
                  {step < STEPS.length - 1 ? <>{tri("Avanti", "Weiter", "Next")}<ChevronRight className="w-4 h-4" /></> : tri("Dai i voti", "Bewerten", "Rate it")}
                </button>
              </div>
            )}

            {phase === "score" && (
              <div data-testid="palato-score" className="p-4 space-y-3">
                {CRITERIA.map((c) => (
                  <div key={c.k}>
                    <p className="text-sm font-bold text-foreground">{L(c)}</p>
                    {level !== "esperto" && <p className="text-[11px] text-muted-foreground mb-1">{L(c.help)}</p>}
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button key={s} data-testid={`palato-${c.k}-${s}`} onClick={() => setScores((v) => ({ ...v, [c.k]: s }))}
                          className={`flex-1 py-2 rounded-lg text-sm font-bold border active:scale-95 ${scores[c.k] === s ? "bg-ambra text-white border-ambra" : "bg-background border-border text-foreground"}`}>{s}</button>
                      ))}
                    </div>
                  </div>
                ))}
                {level === "esperto" && (
                  <textarea data-testid="palato-note" value={note} onChange={(e) => setNote(e.target.value.slice(0, 80))} rows={2} maxLength={80}
                    placeholder={tri("Nota breve (facoltativa)", "Kurze Notiz (optional)", "Short note (optional)")} className="w-full text-sm p-2 rounded-lg bg-background border border-border outline-none focus:border-ambra resize-none" />
                )}
                <button data-testid="palato-see-result" onClick={() => setPhase("result")} disabled={Object.keys(scores).length < CRITERIA.length}
                  className="w-full py-3 rounded-xl bg-ambra text-white font-bold active:scale-95 disabled:opacity-40">{tri("Vedi il profilo", "Profil ansehen", "See the profile")}</button>
              </div>
            )}

            {phase === "result" && (
              <div data-testid="palato-result" className="p-4 space-y-3">
                <div className="text-ambra"><Radar scores={scores} /></div>
                {prev && (
                  <p className="text-[12px] text-muted-foreground text-center">{tri("Rispetto alla prova precedente", "Im Vergleich zum letzten Mal", "Versus your previous bake")}: {CRITERIA.filter((c) => prev.scores && prev.scores[c.k] != null).map((c) => `${L(c).slice(0, 4)} ${scores[c.k] >= prev.scores[c.k] ? "▲" : "▼"}`).join("  ")}</p>
                )}
                {low.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-ambra">{tri("Consigli di Sitor (bozza)", "Sitors Tipps (Entwurf)", "Sitor's tips (draft)")}</p>
                    {low.map((c) => (
                      <div key={c.k} data-testid={`palato-tip-${c.k}`} className="rounded-lg bg-ambra/10 border border-ambra/30 p-2">
                        <p className="text-xs font-bold text-foreground">{L(c)}</p>
                        <p className="text-[12px] text-foreground/85">{tipFor(c.k)}</p>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <button data-testid="palato-save" onClick={save} disabled={saved} className="flex-1 py-2.5 rounded-xl bg-ambra text-white font-bold text-sm active:scale-95 disabled:opacity-50 inline-flex items-center justify-center gap-2">
                    {saved ? <><Check className="w-4 h-4" />{tri("Salvato", "Gespeichert", "Saved")}</> : tri("Salva nel diario", "Ins Tagebuch", "Save to diary")}
                  </button>
                  <button data-testid="palato-ask-sitor" onClick={askSitor} className="flex-1 py-2.5 rounded-xl bg-background border border-ambra/50 text-foreground font-bold text-sm active:scale-95 inline-flex items-center justify-center gap-2">
                    <MessageCircle className="w-4 h-4 text-ambra" />{tri("Chiedi a Sitor", "Frag Sitor", "Ask Sitor")}
                  </button>
                </div>
                <button data-testid="palato-share" onClick={shareCard} className="w-full py-2.5 rounded-xl bg-salvia/20 border border-salvia/50 text-foreground font-bold text-sm active:scale-95 inline-flex items-center justify-center gap-2">
                  <Share2 className="w-4 h-4 text-salvia" />{tri("Condividi il mio palato", "Meinen Gaumen teilen", "Share my palate")}
                </button>
                <p className="text-[10px] text-muted-foreground text-center">{tri("Tutto resta nel tuo dispositivo.", "Alles bleibt auf deinem Gerät.", "Everything stays on your device.")}</p>
              </div>
            )}
          </div>
        </div>
      ), document.body)}
    </>
  );
}
