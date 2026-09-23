import { useEffect, useState } from "react";
import { Ruler, RotateCcw, Check } from "lucide-react";
import { mkTri } from "@/i18n/triMaps";
import { num, clamp, LS, fmtTime, fermentationHours } from "@/lib/sitorTools";

// V92 — IL RIGHELLO DELLA CIOTOLA. "Raddoppiato" o "cresciuto del 70 %" sono parole vuote per chi comincia:
// qui metti l'altezza di partenza e quella di adesso, e Sitor ti dice a che punto sei e verso che ora ci arrivi.
// Le letture restano sul telefono (24 ore) e vengono cancellate da sole.

const KEY = (id) => `mikilab_righello_${id}`;

export default function RighelloCiotola({ r, lang }) {
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const F = fermentationHours(r);
  const fresh = () => ({ start: 4, cur: 4, target: F.lm ? 75 : 100, readings: [], created: Date.now() });
  const [s, setS] = useState(() => { const v = LS.get(KEY(r.id), null); return v && Date.now() - (v.created || 0) < 24 * 3600 * 1000 ? v : fresh(); });
  useEffect(() => { LS.set(KEY(r.id), s); }, [s, r.id]);
  const set = (p) => setS((o) => ({ ...o, ...p }));
  const start = Math.max(0.5, num(s.start)), cur = Math.max(0.1, num(s.cur));
  const growth = (cur / start - 1) * 100;
  const targetH = start * (1 + s.target / 100);
  const progress = clamp(growth / s.target, 0, 1.3);
  const maxH = Math.max(start * 2.6, targetH * 1.15, cur * 1.1);
  const y = (h) => 190 - (h / maxH) * 170;               // altezza in cm → coordinata SVG
  const readings = s.readings || [];
  // stima: retta sugli ultimi punti (almeno 2), altrimenti niente
  let eta = null, rate = 0;
  if (readings.length >= 2) {
    const pts = readings.slice(-4);
    const n = pts.length, mx = pts.reduce((a, p) => a + p.t, 0) / n, my = pts.reduce((a, p) => a + p.h, 0) / n;
    const den = pts.reduce((a, p) => a + (p.t - mx) ** 2, 0);
    rate = den > 0 ? pts.reduce((a, p) => a + (p.t - mx) * (p.h - my), 0) / den : 0;   // cm per ms
    if (rate > 0 && cur < targetH) eta = new Date(Date.now() + (targetH - cur) / rate);
  }
  const ratePerH = rate * 3600 * 1000;
  const state = growth >= s.target + 25 ? "over" : growth >= s.target ? "ready" : growth >= s.target * 0.8 ? "almost" : "wait";

  return (
    <div data-testid="righello-ciotola" className="space-y-3">
      <p className="text-[13px] text-foreground/85 leading-snug">
        {tri("Metti l'impasto in un contenitore dritto e trasparente, segna con un elastico o un pennarello l'altezza di partenza, e ogni tanto misura quanto è salito. Io faccio i conti.",
          "Gib den Teig in ein gerades, durchsichtiges Gefäß, markiere mit Gummiband oder Stift die Starthöhe und miss ab und zu, wie weit er gestiegen ist. Ich rechne.",
          "Put the dough in a straight, transparent container, mark the starting height with a rubber band or a pen, and measure now and then how far it has risen. I'll do the maths.")}
      </p>
      <div className="flex gap-3 items-stretch">
        <svg viewBox="0 0 120 200" className="w-24 shrink-0" aria-hidden>
          <rect x="18" y="14" width="84" height="178" rx="10" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="3" />
          <rect x="21" y={y(cur)} width="78" height={Math.max(0, 189 - y(cur))} rx="6" fill="hsl(var(--primary) / 0.35)" />
          <path d={`M21 ${y(cur) + 3} Q 40 ${y(cur) - 5} 60 ${y(cur) + 2} T 99 ${y(cur) + 3}`} stroke="hsl(var(--primary))" strokeWidth="2.5" fill="none" />
          <line x1="14" x2="106" y1={y(start)} y2={y(start)} stroke="hsl(var(--muted-foreground))" strokeWidth="2" strokeDasharray="4 3" />
          <line x1="14" x2="106" y1={y(targetH)} y2={y(targetH)} stroke="hsl(var(--accent))" strokeWidth="2.5" />
          <text x="108" y={y(start) + 4} fontSize="9" fill="hsl(var(--muted-foreground))">0</text>
          <text x="108" y={y(targetH) + 4} fontSize="9" fill="hsl(var(--accent))">+{s.target}</text>
        </svg>
        <div className="flex-1 space-y-2.5">
          <label className="flex items-center justify-between gap-2 text-[12.5px] text-muted-foreground">
            <span>{tri("Altezza di partenza", "Starthöhe", "Starting height")}</span>
            <span className="flex items-center gap-1"><input data-testid="rc-start" type="number" min="0.5" step="0.5" value={s.start} onChange={(e) => set({ start: e.target.value })} className="w-16 text-right font-mono-data text-sm font-bold text-primary bg-card border border-border rounded-lg px-2 py-1 outline-none" /> cm</span>
          </label>
          <label className="block">
            <span className="flex items-center justify-between text-[12.5px] text-muted-foreground"><span>{tri("Altezza adesso", "Höhe jetzt", "Height now")}</span><span className="font-mono-data font-bold text-foreground">{(Math.round(cur * 10) / 10).toString().replace(".", ",")} cm</span></span>
            <input data-testid="rc-cur" type="range" min={start * 0.8} max={start * 3} step="0.1" value={cur} onChange={(e) => set({ cur: Number(e.target.value) })} className="w-full accent-[hsl(var(--primary))]" />
          </label>
          <div>
            <span className="block text-[12.5px] text-muted-foreground mb-1">{tri("Deve crescere di", "Soll wachsen um", "It should grow by")}</span>
            <div className="flex gap-1.5">
              {[50, 75, 100].map((tg) => (
                <button key={tg} data-testid={`rc-target-${tg}`} onClick={() => set({ target: tg })}
                  className={`text-[12px] font-bold px-2.5 py-1 rounded-full border active:scale-95 ${s.target === tg ? "bg-salvia text-white border-salvia" : "bg-card text-muted-foreground border-border"}`}>+{tg} %</button>
              ))}
            </div>
            <span className="block text-[11px] text-muted-foreground mt-1">{F.lm ? tri("Lievito madre: in massa basta +50-75 %, raddoppiare è troppo.", "Sauerteig: in der Masse reichen +50-75 %, verdoppeln ist zu viel.", "Sourdough: +50-75 % in bulk is enough, doubling is too much.") : tri("Lievito di birra: di solito fino al raddoppio.", "Hefe: meist bis zur Verdopplung.", "Baker's yeast: usually until doubled.")}</span>
          </div>
          <div className="flex gap-2">
            <button data-testid="rc-mark" onClick={() => set({ readings: [...readings, { t: Date.now(), h: cur }].slice(-12) })}
              className="inline-flex items-center gap-1.5 bg-primary text-white font-semibold text-[12.5px] px-3 py-1.5 rounded-xl active:scale-95"><Check className="w-3.5 h-3.5" /> {tri("Segna questa lettura", "Messung speichern", "Save this reading")}</button>
            <button data-testid="rc-reset" onClick={() => setS(fresh())} className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-muted-foreground px-2 active:scale-95"><RotateCcw className="w-3.5 h-3.5" /> {tri("Da capo", "Neu", "Reset")}</button>
          </div>
        </div>
      </div>

      <div data-testid="rc-result" className="rounded-xl border border-salvia/50 bg-salvia/10 p-3.5">
        <div className="flex items-center gap-3">
          <Ruler className="w-5 h-5 text-salvia shrink-0" />
          <p className="font-display text-3xl font-bold text-foreground leading-none">{growth >= 0 ? "+" : ""}{Math.round(growth)} %</p>
          <div className="flex-1 h-2.5 rounded-full bg-background border border-border overflow-hidden"><div className="h-full bg-salvia transition-all" style={{ width: `${Math.min(100, progress * 100)}%` }} /></div>
        </div>
        <p className="text-[13px] text-foreground mt-2">
          {state === "wait" && tri("Ancora presto: lascialo lavorare.", "Noch zu früh: lass ihn arbeiten.", "Still early: let it work.")}
          {state === "almost" && tri("Ci siamo quasi: prepara il piano di lavoro e controlla tra poco.", "Fast so weit: Arbeitsfläche vorbereiten und bald nachsehen.", "Almost there: get the bench ready and check again soon.")}
          {state === "ready" && tri("È pronto: la crescita che serviva c'è. Passa al passo successivo.", "Er ist so weit: das nötige Wachstum ist da. Weiter zum nächsten Schritt.", "It's ready: the growth you needed is there. Move on to the next step.")}
          {state === "over" && tri("È andato oltre: forma subito e accorcia la lievitazione finale, altrimenti si affloscia.", "Er ist darüber hinaus: sofort formen und die Stückgare verkürzen, sonst fällt er zusammen.", "It has gone past: shape right away and shorten the final proof, or it will collapse.")}
        </p>
        {eta && <p className="text-[12.5px] text-muted-foreground mt-1">{tri("A questo ritmo", "In diesem Tempo", "At this pace")} ({(Math.round(ratePerH * 10) / 10).toString().replace(".", ",")} cm/h) {tri("arriva a", "erreicht er", "it reaches")} +{s.target} % {tri("verso le", "gegen", "at around")} <b className="font-mono-data text-foreground">{fmtTime(eta, lang)}</b>.</p>}
        {readings.length === 1 && <p className="text-[12.5px] text-muted-foreground mt-1">{tri("Segna una seconda lettura tra 20-30 minuti e ti dico l'orario.", "Speichere in 20-30 Minuten eine zweite Messung, dann sage ich dir die Uhrzeit.", "Save a second reading in 20-30 minutes and I'll tell you the time.")}</p>}
        {readings.length >= 1 && (
          <p className="text-[11px] font-mono-data text-muted-foreground mt-2">{readings.slice(-6).map((p) => `${fmtTime(new Date(p.t), lang)} ${(Math.round(p.h * 10) / 10).toString().replace(".", ",")}cm`).join(" · ")}</p>
        )}
      </div>
      <p className="text-[12.5px] text-salvia leading-snug">
        {tri("Sitor: la ciotola larga inganna, perché l'impasto si allarga invece di salire. Un barattolo dritto non mente mai.",
          "Sitor: Eine breite Schüssel täuscht, weil der Teig in die Breite statt nach oben geht. Ein gerades Glas lügt nie.",
          "Sitor: a wide bowl fools you, because the dough spreads instead of rising. A straight jar never lies.")}
      </p>
    </div>
  );
}
