import { useState } from "react";
import { Calendar, Download, Copy } from "lucide-react";
import { toast } from "sonner";
import { mkTri } from "@/i18n/triMaps";
import { rLoc } from "@/lib/loc";
import { fermentationHours, fermentationFactor, recipeKind, num, downloadBlob, fmtTime, fmtDate } from "@/lib/sitorTools";

// V92 — IL PANE IN AGENDA. Dici a che ora lo vuoi pronto: Sitor conta all'indietro (raffreddamento, cottura, forno acceso,
// forma, impasto, biga o rinfresco) e ti mette tutto nel calendario del telefono con un file .ics, con gli avvisi.
// Il file lo generiamo qui, sul telefono: nessun server, nessun account.

const pad = (n) => String(n).padStart(2, "0");
const icsDate = (d) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
const icsUtc = (d) => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
const esc = (s) => String(s || "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

export default function PaneInAgenda({ r, lang }) {
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const kind = recipeKind(r);
  const F = fermentationHours(r);
  const [when, setWhen] = useState(() => { const d = new Date(Date.now() + 24 * 3600 * 1000); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T12:00`; });
  const [temp, setTemp] = useState(22);
  const ready = new Date(when);
  const valid = !Number.isNaN(ready.getTime());
  const fac = fermentationFactor(temp, 25);
  const H = 3600 * 1000;
  const cooling = kind === "panettone" ? 10 : kind === "pizza" || kind === "focaccia" ? 0.25 : 1;
  const bake = (num(r.bake_minutes) || (kind === "panettone" ? 50 : kind === "pizza" ? 12 : 40)) / 60;
  const proof = (F.proof || (kind === "panettone" ? 6 : kind === "pizza" ? 1 : 2)) / fac;
  const bulk = (F.bulk || (kind === "panettone" ? 12 : 3)) / fac;
  const preH = F.hasPre ? (F.preMin || 16) : F.lm ? (kind === "panettone" ? 12 : 4) : 0;
  const tReady = ready.getTime();
  const tOut = tReady - cooling * H, tIn = tOut - bake * H, tOven = tIn - 0.5 * H, tShape = tIn - proof * H, tMix = tShape - bulk * H, tPre = tMix - preH * H;
  const name = rLoc(r, "name", lang);
  const ev = [];
  if (preH > 0) ev.push({ t: tPre, title: F.hasPre ? tri("Prepara la biga o il poolish", "Biga oder Poolish ansetzen", "Make the biga or poolish") : kind === "panettone" ? tri("Rinfreschi del lievito madre (tre, uno ogni 4 ore)", "Sauerteig auffrischen (dreimal, alle 4 Stunden)", "Refresh the sourdough (three times, every 4 hours)") : tri("Rinfresca il lievito madre", "Sauerteig auffrischen", "Refresh the sourdough") });
  ev.push({ t: tMix, title: tri("Impasta", "Kneten", "Mix the dough"), note: tri(`Lievitazione in massa circa ${Math.round(bulk * 10) / 10} h`, `Stockgare etwa ${Math.round(bulk * 10) / 10} h`, `Bulk fermentation about ${Math.round(bulk * 10) / 10} h`) });
  ev.push({ t: tShape, title: tri("Forma", "Formen", "Shape"), note: tri(`Lievitazione finale circa ${Math.round(proof * 10) / 10} h`, `Stückgare etwa ${Math.round(proof * 10) / 10} h`, `Final proof about ${Math.round(proof * 10) / 10} h`) });
  ev.push({ t: tOven, title: tri("Accendi il forno", "Ofen einschalten", "Turn on the oven"), note: r.bake_temp ? `${r.bake_temp} °C` : "" });
  ev.push({ t: tIn, title: tri("Inforna", "Einschieben", "Into the oven"), note: `${Math.round(bake * 60)} min` });
  ev.push({ t: tOut, title: tri("Sforna", "Aus dem Ofen", "Out of the oven"), note: kind === "panettone" ? tri("Appendi a testa in giù", "Kopfüber aufhängen", "Hang upside down") : tri("Lascia raffreddare", "Abkühlen lassen", "Let it cool") });
  ev.push({ t: tReady, title: tri("Pronto", "Fertig", "Ready"), note: "" });
  const first = ev[0].t, hoursTotal = (tReady - first) / H;
  const pastStart = first < Date.now();

  const buildIcs = () => {
    const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//MikiLab//Il pane in agenda//IT", "CALSCALE:GREGORIAN", "METHOD:PUBLISH"];
    ev.forEach((e, i) => {
      const s = new Date(e.t), en = new Date(e.t + 15 * 60 * 1000);
      lines.push("BEGIN:VEVENT", `UID:mikilab-${r.id}-${i}-${Date.now()}@mikilab.de`, `DTSTAMP:${icsUtc(new Date())}`, `DTSTART:${icsDate(s)}`, `DTEND:${icsDate(en)}`,
        `SUMMARY:${esc(`${name}: ${e.title}`)}`, `DESCRIPTION:${esc(`${e.note ? e.note + "\n" : ""}MikiLab · mikilab.de`)}`,
        "BEGIN:VALARM", "TRIGGER:-PT10M", "ACTION:DISPLAY", `DESCRIPTION:${esc(e.title)}`, "END:VALARM", "END:VEVENT");
    });
    lines.push("END:VCALENDAR");
    return lines.join("\r\n");
  };
  const download = () => {
    const ok = downloadBlob(new Blob([buildIcs()], { type: "text/calendar;charset=utf-8" }), `mikilab-${String(name).toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}.ics`);
    if (ok) toast.success(tri("File creato: aprilo e il calendario del telefono aggiunge tutti i passi.", "Datei erstellt: öffne sie, der Kalender fügt alle Schritte hinzu.", "File created: open it and your phone's calendar adds every step.")); else toast.error(tri("Non riesco a creare il file.", "Datei kann nicht erstellt werden.", "Couldn't create the file."));
  };
  const copy = async () => {
    const txt = `${name} — MikiLab\n` + ev.map((e) => `${fmtDate(new Date(e.t), lang)} ${fmtTime(new Date(e.t), lang)} · ${e.title}${e.note ? ` (${e.note})` : ""}`).join("\n");
    try { await navigator.clipboard.writeText(txt); toast.success(tri("Copiato: incollalo dove vuoi.", "Kopiert: füge es ein, wo du willst.", "Copied: paste it anywhere.")); } catch { toast.error(tri("Copia non riuscita", "Kopieren fehlgeschlagen", "Copy failed")); }
  };

  return (
    <div data-testid="pane-agenda" className="space-y-3">
      <p className="text-[13px] text-foreground/85 leading-snug">
        {tri("Dimmi quando lo vuoi in tavola. Conto all'indietro e ti metto ogni passo nel calendario del telefono, con l'avviso dieci minuti prima: così il pane si ricorda di te anche a sito chiuso.",
          "Sag mir, wann es auf dem Tisch stehen soll. Ich rechne rückwärts und trage jeden Schritt in den Kalender deines Handys ein, mit Erinnerung zehn Minuten vorher: so meldet sich das Brot auch bei geschlossener Seite.",
          "Tell me when you want it on the table. I count backwards and put every step in your phone's calendar, with a reminder ten minutes before: so the bread reminds you even with the site closed.")}
      </p>
      <div className="rounded-xl border border-border bg-card p-3 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-1.5 text-[12.5px] text-muted-foreground"><Calendar className="w-3.5 h-3.5" /> {tri("Pronto per", "Fertig am", "Ready by")}
          <input data-testid="pa-when" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className="font-mono-data text-sm font-bold text-primary bg-background border border-border rounded-lg px-2 py-1 outline-none" /></label>
        <label className="flex items-center gap-1.5 text-[12.5px] text-muted-foreground">{tri("Cucina a", "Küche bei", "Kitchen at")}
          <input data-testid="pa-temp" type="number" min="4" max="34" value={temp} onChange={(e) => setTemp(Math.min(34, Math.max(4, num(e.target.value) || 22)))} className="w-14 text-right font-mono-data text-sm font-bold text-primary bg-background border border-border rounded-lg px-2 py-1 outline-none" /> °C</label>
      </div>
      {valid ? (
        <div data-testid="pa-list" className="rounded-xl border border-salvia/50 bg-salvia/10 p-3.5">
          <ol className="space-y-1.5">
            {ev.map((e, i) => (
              <li key={i} className="flex items-start gap-3 text-[13px]">
                <span className="font-mono-data text-[12.5px] text-muted-foreground shrink-0 w-[7.5rem] leading-tight">{fmtDate(new Date(e.t), lang)}<br /><b className="text-foreground">{fmtTime(new Date(e.t), lang)}</b></span>
                <span><span className="font-semibold text-foreground">{e.title}</span>{e.note ? <span className="block text-[12px] text-muted-foreground">{e.note}</span> : null}</span>
              </li>
            ))}
          </ol>
          <p className="text-[12px] text-muted-foreground mt-2 pt-2 border-t border-salvia/30">{tri("Dal primo passo al pane pronto", "Vom ersten Schritt bis zum fertigen Brot", "From the first step to the finished bread")}: {Math.round(hoursTotal)} h{pastStart ? ` — ${tri("il primo passo sarebbe già passato: scegli un orario più avanti", "der erste Schritt wäre schon vorbei: wähle eine spätere Zeit", "the first step would already be past: choose a later time")}.` : "."}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            <button data-testid="pa-download" onClick={download} className="inline-flex items-center gap-1.5 bg-primary text-white font-semibold text-[13px] px-3.5 py-2 rounded-xl active:scale-95"><Download className="w-4 h-4" /> {tri("Metti in agenda (.ics)", "In den Kalender (.ics)", "Add to calendar (.ics)")}</button>
            <button data-testid="pa-copy" onClick={copy} className="inline-flex items-center gap-1.5 bg-card border border-border text-foreground font-semibold text-[13px] px-3.5 py-2 rounded-xl active:scale-95"><Copy className="w-4 h-4" /> {tri("Copia come testo", "Als Text kopieren", "Copy as text")}</button>
          </div>
        </div>
      ) : <p className="text-[13px] text-muted-foreground">{tri("Scegli una data e un'ora.", "Wähle Datum und Uhrzeit.", "Pick a date and time.")}</p>}
      <p className="text-[12.5px] text-salvia leading-snug">
        {tri("Sitor: gli orari sono un piano, non una promessa. Il righello della ciotola ti dice se l'impasto è in orario; se è in ritardo, sposta il forno, non forzare la lievitazione.",
          "Sitor: Die Zeiten sind ein Plan, kein Versprechen. Das Lineal für die Schüssel sagt dir, ob der Teig pünktlich ist; hinkt er, verschiebe den Ofen, zwinge die Gare nicht.",
          "Sitor: the times are a plan, not a promise. The bowl ruler tells you whether the dough is on time; if it's late, move the oven, don't force the rise.")}
      </p>
    </div>
  );
}
