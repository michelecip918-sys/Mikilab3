import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, Sparkles, Share2 } from "lucide-react";
import { toast } from "sonner";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { getMedaglie, MEDAGLIE } from "@/lib/medaglie";
import { getLievito, getName } from "@/lib/bottega";
import { LS, shareOrDownload, siteFont, fmtDateLong } from "@/lib/sitorTools";

// V96 — IL TUO ANNO DA FORNAIO. Il riepilogo di tutto quello che hai fatto con MikiLab, letto solo dal tuo telefono:
// pani fatti, preferiti, medaglie, il lievito e la sua età, assaggi da sommelier, i giorni del primo pane.
// Un manifesto elegante da condividere. Nessun dato inviato: i numeri stanno nel tuo browser e basta.

const FIRST = "mikilab_prima_visita";

export default function AnnoDaFornaio({ onBack }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const [url, setUrl] = useState(null);
  const nick = getName();
  const stats = useMemo(() => {
    const first = (() => { const v = LS.get(FIRST, null); if (v) return v; const now = Date.now(); LS.set(FIRST, now); return now; })();
    const done = LS.get("mikilab_done", []) || [];
    const favs = LS.get("mikilab_fav_recipes", []) || [];
    const med = getMedaglie(); const medN = Object.keys(med).length;
    const liev = getLievito();
    const lievRaw = LS.get("mikilab_lievito_figlio", null); const cur = lievRaw && Array.isArray(lievRaw.list) ? (lievRaw.list.find((x) => x.id === lievRaw.cur) || lievRaw.list[0]) : null;
    const feeds = cur && Array.isArray(cur.feeds) ? cur.feeds.length : 0;
    const somm = (LS.get("mikilab_sommelier", []) || []).length;
    const pp = LS.get("mikilab_primopane", {}) || {}; const ppDays = Object.values(pp).filter(Boolean).length;
    const days = Math.max(1, Math.round((Date.now() - first) / 86400000));
    return { first, done: done.length, favs: favs.length, medN, liev, feeds, somm, ppDays, days };
  }, []);

  const sitor = (() => {
    if (stats.done === 0) return tri("Il forno è ancora spento, ma la cucina è pronta. Il primo pane è a un giorno di distanza: apri 'Il tuo primo pane'.", "Der Ofen ist noch aus, aber die Küche ist bereit. Das erste Brot ist einen Tag entfernt: öffne 'Dein erstes Brot'.", "The oven is still off, but the kitchen is ready. The first loaf is a day away: open 'Your first bread'.");
    if (stats.done < 5) return tri(`${stats.done} ${stats.done === 1 ? "pane" : "pani"}: hai già più farina sulle mani di tanti. Il prossimo, fallo con la biga.`, `${stats.done} Brot${stats.done === 1 ? "" : "e"}: du hast schon mehr Mehl an den Händen als viele. Das nächste: mit Biga.`, `${stats.done} loa${stats.done === 1 ? "f" : "ves"}: you already have more flour on your hands than most. Make the next one with a biga.`);
    if (stats.liev && stats.liev.days > 30) return tri(`${stats.done} pani e un lievito madre di ${stats.liev.days} giorni: questo non è più un hobby, è una bottega.`, `${stats.done} Brote und ein Sauerteig von ${stats.liev.days} Tagen: das ist kein Hobby mehr, das ist eine Backstube.`, `${stats.done} loaves and a ${stats.liev.days}-day-old starter: this is no longer a hobby, it's a bakery.`);
    return tri(`${stats.done} pani. Quando avrai dimenticato le ricette a memoria, sarai un fornaio: le mani sanno già.`, `${stats.done} Brote. Wenn du die Rezepte nicht mehr auswendig brauchst, bist du Bäcker: die Hände wissen es schon.`, `${stats.done} loaves. When you no longer need the recipes by heart, you're a baker: the hands already know.`);
  })();

  const rows = [
    { n: stats.done, l: tri("pani fatti", "Brote gebacken", "loaves baked") },
    { n: stats.favs, l: tri("ricette nel cuore", "Lieblingsrezepte", "favourite recipes") },
    { n: `${stats.medN}/${MEDAGLIE.length}`, l: tri("medaglie", "Medaillen", "medals") },
    { n: stats.liev ? stats.liev.days : "—", l: stats.liev ? tri(`giorni di ${stats.liev.name || "lievito madre"}`, `Tage ${stats.liev.name || "Sauerteig"}`, `days of ${stats.liev.name || "starter"}`) : tri("lievito madre (non ancora)", "Sauerteig (noch nicht)", "starter (not yet)") },
    { n: stats.feeds, l: tri("rinfreschi", "Auffrischungen", "refreshes") },
    { n: stats.somm, l: tri("assaggi da sommelier", "Sommelier-Verkostungen", "sommelier tastings") },
    { n: `${stats.ppDays}/7`, l: tri("giorni del primo pane", "Tage des ersten Brotes", "first-bread days") },
    { n: stats.days, l: tri("giorni con MikiLab", "Tage mit MikiLab", "days with MikiLab") },
  ];

  useEffect(() => {
    let alive = true;
    (async () => {
      const c = document.createElement("canvas"); c.width = 1080; c.height = 1350; const ctx = c.getContext("2d");
      const display = siteFont("font-display", "Georgia, serif"), body = siteFont("font-tech", "sans-serif");
      const g = ctx.createLinearGradient(0, 0, 0, 1350); g.addColorStop(0, "#1f2124"); g.addColorStop(1, "#3b2a1c"); ctx.fillStyle = g; ctx.fillRect(0, 0, 1080, 1350);
      ctx.strokeStyle = "rgba(217,164,90,0.6)"; ctx.lineWidth = 3; ctx.strokeRect(50, 50, 980, 1250);
      try { const img = new Image(); img.src = "/logo.webp"; await img.decode(); ctx.save(); ctx.beginPath(); ctx.arc(540, 150, 56, 0, Math.PI * 2); ctx.clip(); ctx.drawImage(img, 484, 94, 112, 112); ctx.restore(); } catch { /* */ }
      ctx.textAlign = "center"; ctx.fillStyle = "#d9a45a"; ctx.font = `600 22px ${body}`; ctx.fillText("MIKILAB", 540, 250);
      ctx.fillStyle = "#f6f1e7"; ctx.font = `bold 64px ${display}`; ctx.fillText(tri("Il mio anno da fornaio", "Mein Jahr als Bäcker", "My year as a baker"), 540, 330);
      ctx.fillStyle = "#c9bfb2"; ctx.font = `italic 30px ${display}`; ctx.fillText(nick ? nick : fmtDateLong(new Date(), lang), 540, 385);
      const cells = rows.slice(0, 8); const cw = 440, ch = 170; let i = 0;
      for (const cell of cells) { const x = 100 + (i % 2) * (cw + 40), y = 450 + Math.floor(i / 2) * (ch + 30); ctx.fillStyle = "rgba(255,255,255,0.06)"; ctx.fillRect(x, y, cw, ch); ctx.fillStyle = "#f6f1e7"; ctx.font = `bold 72px ${display}`; ctx.fillText(String(cell.n), x + cw / 2, y + 90); ctx.fillStyle = "#d9a45a"; ctx.font = `600 22px ${body}`; ctx.fillText(cell.l.toUpperCase(), x + cw / 2, y + 138); i++; }
      ctx.fillStyle = "#f6f1e7"; ctx.font = `italic 28px ${display}`;
      const words = `Sitor: ${sitor}`.split(" "); const lines = []; let cur = "";
      for (const w of words) { const t = cur ? `${cur} ${w}` : w; if (ctx.measureText(t).width > 880) { lines.push(cur); cur = w; } else cur = t; } if (cur) lines.push(cur);
      let y = 1210 - (lines.length - 1) * 36; lines.slice(0, 3).forEach((l) => { ctx.fillText(l, 540, y); y += 36; });
      ctx.fillStyle = "#c9bfb2"; ctx.font = `20px ${body}`; ctx.fillText("mikilab.de", 540, 1275);
      if (alive) setUrl(c.toDataURL("image/png"));
    })();
    return () => { alive = false; };
  }, [lang]); // eslint-disable-line react-hooks/exhaustive-deps

  const share = async () => { if (!url) return; const blob = await (await fetch(url)).blob(); const r = await shareOrDownload(blob, "mikilab-anno-da-fornaio.png", "MikiLab"); if (r === "failed") toast.error(tri("Non riesco a condividere.", "Teilen nicht möglich.", "Can't share.")); };

  return (
    <div data-testid="anno-page" className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <button data-testid="anno-back" onClick={onBack} className="inline-flex items-center gap-1 text-muted-foreground text-sm font-bold"><ChevronLeft className="w-4 h-4" />{tri("Indietro", "Zurück", "Back")}</button>
      <div>
        <p className="font-mono-data text-[10px] tracking-[0.25em] uppercase text-primary flex items-center gap-1.5"><Sparkles className="w-3 h-3" />MikiLab</p>
        <h1 className="font-display text-2xl font-black text-foreground">{tri("Il tuo anno da fornaio", "Dein Jahr als Bäcker", "Your year as a baker")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{tri("Tutto quello che hai fatto con MikiLab, letto dal tuo telefono e da nessun altro posto. Un manifesto da condividere, se ti va.", "Alles, was du mit MikiLab gemacht hast, gelesen von deinem Handy und sonst nirgends. Ein Plakat zum Teilen, wenn du magst.", "Everything you've done with MikiLab, read from your phone and nowhere else. A poster to share, if you like.")}</p>
      </div>
      <div data-testid="anno-stats" className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {rows.map((r, i) => <div key={i} className="rounded-xl border border-border bg-card p-3 text-center"><p className="font-display text-2xl font-bold text-foreground">{r.n}</p><p className="text-[11px] uppercase tracking-wide text-muted-foreground">{r.l}</p></div>)}
      </div>
      <p className="text-[13px] text-salvia leading-snug">Sitor: {sitor}</p>
      {url ? <img data-testid="anno-img" src={url} alt="" className="w-full rounded-2xl border border-border shadow-md" /> : <p className="text-[12.5px] text-muted-foreground">{tri("Sto disegnando…", "Ich zeichne…", "Drawing…")}</p>}
      <button data-testid="anno-share" onClick={share} className="inline-flex items-center gap-1.5 text-[12.5px] font-bold px-3 py-2 rounded-xl bg-primary text-white active:scale-95"><Share2 className="w-4 h-4" />{tri("Condividi il manifesto", "Plakat teilen", "Share the poster")}</button>
      <p className="text-[11px] text-muted-foreground">{tri("I numeri vivono nel tuo browser: se cambi telefono ripartono da zero. Il soprannome è quello della tua bottega, facoltativo.", "Die Zahlen leben in deinem Browser: mit neuem Handy fangen sie bei null an. Der Spitzname ist der deiner Bottega, optional.", "The numbers live in your browser: a new phone starts from zero. The nickname is the one from your bottega, optional.")}</p>
    </div>
  );
}
