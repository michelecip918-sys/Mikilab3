import { useEffect, useState } from "react";
import { ChevronRight, Wand2 } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { rLoc } from "@/lib/loc";
import { leggiPiano, aCheePunto, tempi, TESTO_KEY } from "@/lib/dilloASitor";
import { passoTesto, quandoTesto, traQuanto } from "@/lib/dilloTesti";

// V136 — in Home: se c'è un pane in corso, Sitor dice il prossimo passo e fra quanto; se non c'è, una riga per dirgli cosa vuoi fare.
export default function PaneInCorso({ onNav, recipes }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const [piano, setPiano] = useState(() => leggiPiano());
  const [now, setNow] = useState(() => Date.now());
  const [testo, setTesto] = useState("");
  useEffect(() => {
    const h = () => setPiano(leggiPiano());
    window.addEventListener("mikilab-piano-sitor", h);
    const i = setInterval(() => setNow(Date.now()), 60000);
    return () => { window.removeEventListener("mikilab-piano-sitor", h); clearInterval(i); };
  }, []);
  const vai = () => { try { if (testo.trim()) sessionStorage.setItem(TESTO_KEY, testo.trim()); } catch { /* */ } if (onNav) onNav("dillo"); };
  const r = piano && Array.isArray(recipes) ? recipes.find((x) => x.id === piano.id) : null;

  if (piano && r) {
    const st = aCheePunto(piano, now);
    const sp = st.prossimo;
    const fatti = piano.passi.filter((s) => s.k !== "pronto" && ((piano.fatti || []).includes(s.k) || s.at + (s.min || 0) * 60000 < now)).length;
    const tot = piano.passi.filter((s) => s.k !== "pronto").length;
    return (
      <section data-testid="home-pane-in-corso" className="rounded-3xl border-2 border-primary/50 bg-card p-4 space-y-2">
        <div className="flex items-center gap-3">
          {r.image_url && <img src={r.image_url} alt="" className="w-14 h-14 rounded-2xl object-cover border border-border shrink-0" />}
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-bold text-primary">{tri("Il tuo pane in corso", "Dein Brot läuft", "Your bake in progress")}</p>
            <p className="font-display text-[17px] font-bold text-foreground leading-snug truncate">{rLoc(r, "name", lang)}</p>
          </div>
        </div>
        {st.finito ? (
          <p className="text-[14px] text-foreground">{piano.voto ? tri("Fatto. Sitor si ricorda com'è venuto.", "Fertig. Sitor merkt sich, wie es geworden ist.", "Done. Sitor remembers how it turned out.") : tri("È pronto! Dimmi com'è venuto: me lo ricordo per la prossima volta.", "Es ist fertig! Sag mir, wie es geworden ist: ich merke es mir für nächstes Mal.", "It's ready! Tell me how it turned out: I'll remember for next time.")}</p>
        ) : sp ? (
          <p className="text-[14px] text-foreground leading-snug"><b>{passoTesto(sp.k, sp, { T: tempi(r), d: null, r, lang }).t}</b> · {quandoTesto(sp.at, lang, now)} <span className="text-primary font-bold">({traQuanto(sp.at, lang, now)})</span></p>
        ) : null}
        <div className="h-1.5 rounded-full bg-muted overflow-hidden" aria-hidden><div className="h-full bg-primary" style={{ width: `${Math.round((fatti / Math.max(1, tot)) * 100)}%` }} /></div>
        <button data-testid="home-apri-piano" onClick={() => onNav && onNav("dillo")} className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold active:scale-95">{st.finito && !piano.voto ? tri("Com'è venuto?", "Wie ist es geworden?", "How did it turn out?") : tri("Apri il piano", "Plan öffnen", "Open the plan")}<ChevronRight className="w-4 h-4" /></button>
      </section>
    );
  }
  return (
    <section data-testid="home-dillo" className="rounded-3xl border border-border bg-card p-4 space-y-2.5">
      <div className="flex items-center gap-3">
        <img src="/sitor_official.webp" alt="" className="w-12 h-12 rounded-2xl object-cover border border-border shrink-0" />
        <div className="min-w-0">
          <p className="font-display text-[18px] font-bold text-foreground">{tri("Dillo a Sitor", "Sag es Sitor", "Tell Sitor")}</p>
          <p className="text-[12.5px] text-muted-foreground leading-snug">{tri("Che pane vuoi, e per quando? Sitor sceglie la ricetta e ti dice cosa fare, ora per ora.", "Welches Brot, und für wann? Sitor wählt das Rezept und sagt dir Stunde für Stunde, was zu tun ist.", "What bread, and for when? Sitor picks the recipe and tells you what to do, hour by hour.")}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <input data-testid="home-dillo-testo" value={testo} onChange={(e) => setTesto(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") vai(); }} maxLength={200}
          placeholder={tri("Es. pizza sabato alle 20 per 6", "z. B. Pizza am Samstag um 20 Uhr für 6", "e.g. pizza on Saturday at 8pm for 6")}
          className="flex-1 min-w-0 rounded-xl border border-border bg-background px-3 py-2.5 text-[14.5px] text-foreground outline-none focus:border-primary" />
        <button data-testid="home-dillo-vai" onClick={vai} aria-label={tri("Vai", "Los", "Go")} className="shrink-0 inline-flex items-center gap-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold active:scale-95"><Wand2 className="w-4 h-4" />{tri("Vai", "Los", "Go")}</button>
      </div>
    </section>
  );
}
