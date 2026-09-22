import { useState, useMemo } from "react";
import { ChevronLeft, Flame, RotateCw, Trash2, MessageCircle, Thermometer } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { toast } from "sonner";
import { getOvenMap, setOvenMap, clearOvenMap, ovenMapSummary } from "@/lib/mycucina";

// V85 — "La mappa del tuo forno": ogni forno di casa ha un lato che scalda di più. Con il test
// delle fette di pane (una teglia di fette, 10 minuti a 180 °C) l'utente segna com'è venuta ogni
// zona, e MikiLab disegna la mappa del suo forno, gli dice dove girare la teglia e a che altezza
// mettere il pane. La mappa resta nel dispositivo e, se "Sitor ricorda la mia cucina" è attivo,
// Sitor la conosce (una riga di testo, es. "scalda di più dietro a destra").

const LEVELS = ["chiaro", "giusto", "scuro"]; // ciclo al tocco
const COLOR = { chiaro: "#F3E3C3", giusto: "#D9A566", scuro: "#8A4B1E", none: "hsl(var(--muted))" };
const ROWS = ["dietro", "centro", "davanti"];
const COLS = ["sinistra", "centro", "destra"];

export default function MappaForno({ onBack }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const [grid, setGrid] = useState(() => getOvenMap() || Array(9).fill("none"));
  const saved = !!getOvenMap();

  const tap = (i) => setGrid((g) => { const n = [...g]; const cur = LEVELS.indexOf(n[i]); n[i] = LEVELS[(cur + 1) % LEVELS.length]; return n; });
  const filled = grid.every((x) => x !== "none");

  const analysis = useMemo(() => {
    if (!filled) return null;
    const v = grid.map((x) => (x === "chiaro" ? -1 : x === "scuro" ? 1 : 0));
    const row = (r) => v[r * 3] + v[r * 3 + 1] + v[r * 3 + 2];
    const col = (c) => v[c] + v[c + 3] + v[c + 6];
    const total = v.reduce((a, b) => a + b, 0);
    const out = { hot: [], cold: [], overall: total, tips: [] };
    const rowName = { 0: tri("dietro", "hinten", "at the back"), 1: tri("al centro", "in der Mitte", "in the middle"), 2: tri("davanti", "vorne", "at the front") };
    const colName = { 0: tri("a sinistra", "links", "on the left"), 1: tri("al centro", "in der Mitte", "in the middle"), 2: tri("a destra", "rechts", "on the right") };
    [0, 2].forEach((r) => { if (row(r) - row(1) >= 2) out.hot.push(rowName[r]); if (row(1) - row(r) >= 2) out.cold.push(rowName[r]); });
    [0, 2].forEach((c) => { if (col(c) - col(1) >= 2) out.hot.push(colName[c]); if (col(1) - col(c) >= 2) out.cold.push(colName[c]); });
    if (out.hot.length || out.cold.length) out.tips.push(tri("Gira la teglia di mezzo giro a metà cottura: il lato che scurisce prima finisce dalla parte fredda.", "Das Blech nach der halben Backzeit um eine halbe Drehung wenden: die Seite, die zuerst dunkel wird, kommt auf die kalte Seite.", "Turn the tray half a turn halfway through baking: the side that browns first ends up on the cold side."));
    if (out.hot.some((h) => h === rowName[0])) out.tips.push(tri("Dietro scalda di più: metti pane e teglie leggermente più avanti e non attaccati alla parete di fondo.", "Hinten ist es heißer: Brot und Bleche etwas weiter vorne platzieren, nicht an die Rückwand.", "The back is hotter: place bread and trays slightly forward, not against the back wall."));
    if (total >= 4) { out.tips.push(tri("Nel complesso il tuo forno scalda più di quanto dice la manopola: imposta circa 10 °C in meno di quanto scrivono le ricette.", "Insgesamt heizt dein Ofen stärker, als der Knopf sagt: etwa 10 °C weniger einstellen als im Rezept.", "Overall your oven runs hotter than the dial says: set about 10 °C less than the recipes say.")); out.adj = -10; }
    if (total <= -4) { out.tips.push(tri("Nel complesso il tuo forno scalda meno: imposta circa 10 °C in più, o allunga di qualche minuto.", "Insgesamt heizt dein Ofen schwächer: etwa 10 °C mehr einstellen oder ein paar Minuten länger.", "Overall your oven runs cooler: set about 10 °C more, or add a few minutes.")); out.adj = 10; }
    if (!out.tips.length) out.tips.push(tri("Il tuo forno è bello uniforme: fortunato! Segui le ricette così come sono.", "Dein Ofen ist schön gleichmäßig: Glück gehabt! Folge den Rezepten wie sie sind.", "Your oven is nicely even: lucky you! Follow the recipes as they are."));
    return out;
  }, [grid, filled]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = () => {
    if (!filled) return;
    setOvenMap(grid, analysis);
    toast.success(tri("Mappa salvata nel tuo telefono. Sitor la userà se «ricorda la mia cucina» è attivo.", "Karte auf deinem Handy gespeichert. Sitor nutzt sie, wenn «merkt sich meine Küche» an ist.", "Map saved on your phone. Sitor will use it if «remembers my kitchen» is on."));
  };
  const reset = () => { clearOvenMap(); setGrid(Array(9).fill("none")); };
  const askSitor = () => {
    const s = ovenMapSummary(lang) || tri("il mio forno", "mein Ofen", "my oven");
    const text = tri(`Ho fatto il test delle fette: ${s}. Come mi regolo con pane e focacce?`, `Ich habe den Brotscheiben-Test gemacht: ${s}. Wie stelle ich mich bei Brot und Focaccia darauf ein?`, `I did the bread-slice test: ${s}. How should I adjust for bread and focaccia?`);
    try { window.dispatchEvent(new CustomEvent("mikilab-open-chat")); setTimeout(() => window.dispatchEvent(new CustomEvent("mikilab-chat-prefill", { detail: { text } })), 250); } catch { /* */ }
  };

  return (
    <div data-testid="mappaforno-page" className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <button data-testid="mappaforno-back" onClick={onBack} className="inline-flex items-center gap-1 text-muted-foreground text-sm font-bold"><ChevronLeft className="w-4 h-4" />{tri("Indietro", "Zurück", "Back")}</button>
      <div className="flex items-center gap-2"><Flame className="w-6 h-6 text-primary" /><h1 className="font-display text-2xl font-black text-foreground">{tri("La mappa del tuo forno", "Die Karte deines Ofens", "The map of your oven")}</h1></div>
      <p className="text-sm text-muted-foreground">{tri("Nessun forno di casa cuoce uguale dappertutto. Una volta sola, scopri dove scalda di più il tuo, e poi ogni ricetta ti riesce meglio.", "Kein Hausofen backt überall gleich. Finde einmal heraus, wo deiner am stärksten heizt, und danach gelingt jedes Rezept besser.", "No home oven bakes evenly everywhere. Once, find out where yours runs hot, and every recipe after that comes out better.")}</p>

      <section className="rounded-2xl border border-border bg-background p-4 space-y-2">
        <p className="font-bold text-foreground">{tri("Il test delle fette (15 minuti, costa una fetta di pane)", "Der Scheibentest (15 Minuten, kostet ein paar Scheiben Brot)", "The slice test (15 minutes, costs a few slices of bread)")}</p>
        <ol className="list-decimal pl-5 space-y-1 text-[13px] text-foreground/90">
          <li>{tri("Scalda il forno a 180 °C, statico, per 15 minuti.", "Ofen auf 180 °C Ober-/Unterhitze 15 Minuten vorheizen.", "Heat the oven to 180 °C, conventional, for 15 minutes.")}</li>
          <li>{tri("Copri la teglia con fette di pane in cassetta (o pane raffermo), una accanto all'altra, fino ai bordi.", "Ein Blech mit Toastbrot (oder altem Brot) dicht bis zu den Rändern belegen.", "Cover a tray with sandwich bread slices (or stale bread) edge to edge.")}</li>
          <li>{tri("Mettila nel ripiano centrale per 8-10 minuti, senza aprire.", "Auf die mittlere Schiene, 8-10 Minuten, nicht öffnen.", "Middle shelf, 8-10 minutes, don't open the door.")}</li>
          <li>{tri("Tira fuori e guarda: dove le fette sono più scure, lì il forno scalda di più.", "Herausnehmen und schauen: wo die Scheiben dunkler sind, heizt der Ofen stärker.", "Take it out and look: where the slices are darker, the oven runs hotter.")}</li>
        </ol>
        <p className="text-[12px] text-muted-foreground">{tri("Le fette poi non buttarle: pangrattato o crostini.", "Die Scheiben nicht wegwerfen: Semmelbrösel oder Croutons.", "Don't throw the slices away: breadcrumbs or croutons.")}</p>
      </section>

      <section data-testid="mappaforno-grid" className="rounded-2xl border border-border bg-background p-4">
        <p className="font-bold text-foreground mb-1">{tri("Segna com'è venuta ogni zona", "Markiere, wie jede Zone geworden ist", "Mark how each zone came out")}</p>
        <p className="text-[12px] text-muted-foreground mb-3">{tri("Tocca una casella per cambiare: chiaro → giusto → scuro. In alto è il fondo del forno, in basso lo sportello.", "Tippe auf ein Feld zum Wechseln: hell → richtig → dunkel. Oben ist die Rückwand, unten die Tür.", "Tap a cell to change: light → right → dark. Top is the back of the oven, bottom is the door.")}</p>
        <div className="relative mx-auto max-w-xs">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground text-center mb-1">{tri("fondo", "Rückwand", "back")}</p>
          <div className="grid grid-cols-3 gap-1.5 p-2 rounded-2xl bg-[#3A3D42]">
            {grid.map((v, i) => (
              <button key={i} data-testid={`mappaforno-cell-${i}`} onClick={() => tap(i)} aria-label={`${ROWS[Math.floor(i / 3)]} ${COLS[i % 3]}: ${v}`}
                className="aspect-[4/3] rounded-lg border border-black/20 active:scale-95 transition-all text-[10px] font-bold" style={{ background: COLOR[v], color: v === "scuro" ? "#F6F1E7" : "#2B2E33" }}>
                {v === "none" ? "?" : v === "chiaro" ? tri("chiaro", "hell", "light") : v === "giusto" ? tri("giusto", "richtig", "right") : tri("scuro", "dunkel", "dark")}
              </button>
            ))}
          </div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground text-center mt-1">{tri("sportello", "Tür", "door")}</p>
        </div>
      </section>

      {analysis && (
        <section data-testid="mappaforno-result" className="rounded-2xl border border-primary/40 bg-primary/10 p-4 space-y-2">
          <p className="font-black text-foreground">
            {analysis.hot.length ? tri(`Il tuo forno scalda di più ${analysis.hot.join(tri(" e ", " und ", " and "))}.`, `Dein Ofen heizt stärker ${analysis.hot.join(" und ")}.`, `Your oven runs hotter ${analysis.hot.join(" and ")}.`) : ""}
            {analysis.cold.length ? " " + tri(`Scalda meno ${analysis.cold.join(tri(" e ", " und ", " and "))}.`, `Schwächer ${analysis.cold.join(" und ")}.`, `Cooler ${analysis.cold.join(" and ")}.`) : ""}
            {!analysis.hot.length && !analysis.cold.length && tri("Cuoce in modo uniforme.", "Backt gleichmäßig.", "Bakes evenly.")}
          </p>
          {analysis.tips.map((t, i) => <p key={i} className="text-[13px] text-foreground/90 flex gap-2"><RotateCw className="w-4 h-4 text-primary shrink-0 mt-0.5" />{t}</p>)}
          {analysis.adj && <p className="text-[12px] text-foreground/80 flex gap-2"><Thermometer className="w-4 h-4 text-primary shrink-0" />{tri(`Salvando, «La mia cucina» segnerà il tuo forno a ${analysis.adj > 0 ? "+" : ""}${analysis.adj} °C.`, `Beim Speichern trägt «Meine Küche» deinen Ofen mit ${analysis.adj > 0 ? "+" : ""}${analysis.adj} °C ein.`, `On saving, «My kitchen» will note your oven at ${analysis.adj > 0 ? "+" : ""}${analysis.adj} °C.`)}</p>}
          <div className="flex gap-2 flex-wrap pt-1">
            <button data-testid="mappaforno-save" onClick={save} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-sm active:scale-95">{tri("Salva la mappa", "Karte speichern", "Save the map")}</button>
            <button onClick={askSitor} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-background border border-primary/40 text-sm font-bold text-foreground active:scale-95"><MessageCircle className="w-4 h-4 text-primary" />{tri("Chiedi a Sitor", "Frag Sitor", "Ask Sitor")}</button>
          </div>
        </section>
      )}

      {saved && <button data-testid="mappaforno-reset" onClick={reset} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-mattone/40 text-xs font-bold text-mattone active:scale-95"><Trash2 className="w-3.5 h-3.5" />{tri("Cancella la mappa salvata", "Gespeicherte Karte löschen", "Delete the saved map")}</button>}
      <p className="text-[11px] text-muted-foreground">{tri("La mappa resta nel tuo dispositivo. A Sitor arriva solo una riga di testo, e solo se hai acceso «Sitor ricorda la mia cucina».", "Die Karte bleibt auf deinem Gerät. Sitor bekommt nur eine Textzeile, und nur wenn «Sitor merkt sich meine Küche» an ist.", "The map stays on your device. Sitor only gets one line of text, and only if «Sitor remembers my kitchen» is on.")}</p>
    </div>
  );
}
