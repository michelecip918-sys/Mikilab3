// V127 — In Home: la calcolatrice del fornaio in piccolo, con un esempio vivo, e le porte per aprirla.
import { useMemo, useState } from "react";
import { Calculator, Pizza, Sprout, Minus, Plus } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { nuovaFormula, calcola, L, fmtG, fmtN } from "@/lib/fornaio";

const LIM = { pane: [1, 12], napoletana: [1, 30], focaccia: [1, 6] };

export default function CalcolaInHome({ onNav }) {
  const { lang } = useLang();
  const tri = mkTri(lang);
  const [k, setK] = useState("pane");
  const [q, setQ] = useState({ pane: 2, napoletana: 4, focaccia: 1 });
  const res = useMemo(() => {
    const f = nuovaFormula(k);
    if (k === "focaccia") f.tg = { ...f.tg, k: q.focaccia }; else f.pc = q[k];
    return calcola(f);
  }, [k, q]);
  const n = q[k];
  const cambia = (d) => setQ((c) => ({ ...c, [k]: Math.min(LIM[k][1], Math.max(LIM[k][0], c[k] + d)) }));
  const unita = k === "pane" ? tri(n === 1 ? "pagnotta da 600 g" : "pagnotte da 600 g", n === 1 ? "Laib à 600 g" : "Laibe à 600 g", n === 1 ? "loaf of 600 g" : "loaves of 600 g")
    : k === "napoletana" ? tri(n === 1 ? "panetto da 270 g" : "panetti da 270 g", n === 1 ? "Teigkugel à 270 g" : "Teigkugeln à 270 g", n === 1 ? "dough ball of 270 g" : "dough balls of 270 g")
    : tri(n === 1 ? "teglia 30 × 40" : "teglie 30 × 40", n === 1 ? "Blech 30 × 40" : "Bleche 30 × 40", n === 1 ? "pan 30 × 40" : "pans 30 × 40");
  const righe = res.spesa.filter((x) => x.g >= 0.05);
  const tempi = res.pre
    ? tri(`biga la sera prima, poi ${fmtN(res.h, 1, lang)} ore a ${fmtN(res.T, 0, lang)} °C`, `Biga am Vorabend, dann ${fmtN(res.h, 1, lang)} Std. bei ${fmtN(res.T, 0, lang)} °C`, `biga the night before, then ${fmtN(res.h, 1, lang)} h at ${fmtN(res.T, 0, lang)} °C`)
    : tri(`${fmtN(res.h, 1, lang)} ore a ${fmtN(res.T, 0, lang)} °C`, `${fmtN(res.h, 1, lang)} Std. bei ${fmtN(res.T, 0, lang)} °C`, `${fmtN(res.h, 1, lang)} h at ${fmtN(res.T, 0, lang)} °C`);

  return (
    <section data-testid="home-calcolatrice" className="rounded-3xl border border-border bg-card p-4 sm:p-5 space-y-3">
      <div>
        <p className="font-mono-data text-[10px] tracking-[0.25em] uppercase text-primary">{tri("Calcolare l'impasto", "Den Teig berechnen", "Working out the dough")}</p>
        <h2 className="font-display text-xl font-black text-foreground leading-tight">{tri("La calcolatrice del fornaio", "Der Bäckerrechner", "The baker's calculator")}</h2>
        <p className="text-[12.5px] text-muted-foreground leading-snug mt-1">{tri("Il tuo impasto in grammi, dai pezzi che vuoi: pane, pizza, focaccia, anche con biga o lievito madre.", "Dein Teig in Gramm, von den gewünschten Stücken aus: Brot, Pizza, Focaccia, auch mit Biga oder Sauerteig.", "Your dough in grams, starting from the pieces you want: bread, pizza, focaccia, even with biga or sourdough.")}</p>
      </div>
      <div className="flex flex-wrap gap-1.5" role="group">
        {[["pane", tri("Pane", "Brot", "Bread")], ["napoletana", "Pizza"], ["focaccia", "Focaccia"]].map(([v, l]) => (
          <button key={v} type="button" data-testid={`home-calc-${v}`} onClick={() => setK(v)} aria-pressed={k === v}
            className={`text-[12.5px] font-semibold px-3 py-1.5 rounded-full border transition-all active:scale-95 ${k === v ? "bg-primary text-primary-foreground border-primary" : "bg-background text-foreground border-border"}`}>{l}</button>
        ))}
      </div>
      <div className="rounded-2xl p-3.5 border border-black/30" style={{ background: "#232529", color: "#F3EDE2" }}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button type="button" data-testid="home-calc-meno" onClick={() => cambia(-1)} aria-label="−" className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.10)" }}><Minus className="w-4 h-4" /></button>
            <span className="font-mono-data font-bold text-[18px] w-7 text-center">{n}</span>
            <button type="button" data-testid="home-calc-piu" onClick={() => cambia(1)} aria-label="+" className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.10)" }}><Plus className="w-4 h-4" /></button>
            <span className="text-[12px] opacity-80 leading-tight">{unita}</span>
          </div>
          <span className="font-mono-data font-bold text-[24px] leading-none" style={{ color: "#E9A23B" }} data-testid="home-calc-tot">{fmtG(res.impasto, lang)}</span>
        </div>
        <div className="mt-2.5 grid grid-cols-2 gap-x-4">
          {righe.map((x, i) => (
            <div key={`${x.k}-${x.fk || x.ek || ""}-${i}`} className="flex items-baseline justify-between gap-2 py-0.5 border-b border-white/10">
              <span className="text-[12px] opacity-80 truncate">{L(x.n, lang)}</span>
              <span className="text-[13px] font-mono-data font-bold">{fmtG(x.g, lang)}</span>
            </div>
          ))}
        </div>
        <p className="text-[11px] opacity-65 mt-2">{tempi}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" data-testid="home-calc-apri" onClick={() => onNav && onNav(k === "napoletana" ? "pizza" : "calcolatrice")} className="inline-flex items-center gap-1.5 text-[13px] font-bold px-4 py-2 rounded-xl bg-primary text-primary-foreground active:scale-95">
          <Calculator className="w-4 h-4" /> {tri("Calcola il tuo impasto", "Deinen Teig berechnen", "Work out your dough")}
        </button>
        <button type="button" data-testid="home-calc-pizza" onClick={() => onNav && onNav("pizza")} className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold px-3 py-2 rounded-xl border border-border bg-background active:scale-95"><Pizza className="w-4 h-4 text-primary" /> {tri("Pizza", "Pizza", "Pizza")}</button>
        <button type="button" data-testid="home-calc-lievito" onClick={() => onNav && onNav("rinfresco")} className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold px-3 py-2 rounded-xl border border-border bg-background active:scale-95"><Sprout className="w-4 h-4 text-salvia" /> {tri("Lievito madre pronto", "Sauerteig pünktlich", "Starter on time")}</button>
      </div>
    </section>
  );
}
