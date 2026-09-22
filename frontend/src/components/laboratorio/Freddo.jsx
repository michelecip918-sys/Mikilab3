import { useMemo, useState } from "react";
import { Snowflake, Calendar, Copy } from "lucide-react";
import { toast } from "sonner";
import { mkTri } from "@/i18n/triMaps";
import { rLoc } from "@/lib/loc";
import { fermentationHours, fermentationFactor, LS, num, fmt1, fmtTime, fmtDate, downloadBlob } from "@/lib/sitorTools";

// V93 — PROGRAMMAZIONE A FREDDO. Dall'ora di infornata si conta all'indietro: cella (4-6 °C) dopo la forma oppure
// in massa, ripresa a temperatura ambiente, impasto, prefermento. In cella la lievitazione quasi si ferma:
// la velocità a 4 °C è circa il 12 % di quella a 25 °C (stessa curva di "Lievitazione a casa tua").

const KEY = "mikilab_lab_freddo";
const minus = (d, h) => new Date(d.getTime() - h * 3600000);
const pad = (n) => String(n).padStart(2, "0");
const icsLocal = (d) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;

function NumField({ st, set, k, label, min, max, step, unit }) {
  return (
    <label className="block text-[12px] text-muted-foreground">{label}<span className="mt-0.5 flex items-center gap-1"><input data-testid={`fr-${k}`} type="number" min={min} max={max} step={step || 1} value={st[k]} onChange={(e) => set({ [k]: e.target.value })} className="w-full font-mono-data font-bold text-foreground bg-background border border-border rounded-md px-2 py-1.5 outline-none" />{unit && <span className="text-[11px]">{unit}</span>}</span></label>
  );
}

export default function Freddo({ recipes, lang }) {
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const [st, setSt] = useState(() => LS.get(KEY, { id: "", bake: "06:30", mode: "forma", cold: 4, coldH: 14, room: 24, preH: 30 }));
  const set = (patch) => { const n = { ...st, ...patch }; setSt(n); LS.set(KEY, n); };
  const r = recipes.find((x) => x.id === st.id) || recipes[0];

  const plan = useMemo(() => {
    if (!r) return null;
    const F = fermentationHours(r);
    const fRoom = fermentationFactor(st.room), fCold = fermentationFactor(st.cold);
    const [hh, mm] = String(st.bake || "06:30").split(":").map(Number);
    const bake = new Date(); bake.setHours(hh || 6, mm || 0, 0, 0);
    if (bake.getTime() < Date.now() - 3600000) bake.setDate(bake.getDate() + 1);
    const ev = [];
    let cursor = bake;
    ev.push({ k: "bake", t: bake, l: tri("Infornata", "Backen", "Bake") });
    ev.push({ k: "oven", t: minus(bake, num(st.preH) / 60), l: tri("Accendi il forno", "Ofen anheizen", "Oven on") });
    let note = "";
    if (st.mode === "forma") {
      // la lievitazione finale corre in cella (poco) e poi in ripresa a temperatura ambiente
      const doneCold = num(st.coldH) * fCold;             // ore "a 25 °C" fatte in cella
      const left25 = Math.max(0, F.proof - doneCold);      // ore a 25 °C che mancano
      const ripresa = left25 / fRoom;
      const outCold = minus(bake, ripresa);
      if (ripresa > 0.15) ev.push({ k: "out", t: outCold, l: tri(`Fuori dalla cella, ripresa ${fmt1(ripresa)} h a ${st.room} °C`, `Aus der Kühlzelle, ${fmt1(ripresa)} h Aufwärmen bei ${st.room} °C`, `Out of the cold room, ${fmt1(ripresa)} h at ${st.room} °C`) });
      else note = tri("La lievitazione finale finisce in cella: inforna direttamente da freddo, il taglio viene più pulito.", "Die Stückgare endet in der Kühlzelle: direkt kalt backen, der Schnitt gelingt sauberer.", "The final proof finishes in the cold room: bake straight from cold, the score comes out cleaner.");
      const inCold = minus(ripresa > 0.15 ? outCold : bake, num(st.coldH));
      ev.push({ k: "cold", t: inCold, l: tri(`In cella a ${st.cold} °C (${st.coldH} h)`, `In die Kühlzelle bei ${st.cold} °C (${st.coldH} h)`, `Into the cold room at ${st.cold} °C (${st.coldH} h)`) });
      const forma = minus(inCold, 0.35);
      ev.push({ k: "shape", t: forma, l: tri("Staglio e forma", "Abwiegen und Formen", "Divide and shape") });
      cursor = minus(forma, F.bulk / fRoom);
      ev.push({ k: "mix", t: cursor, l: tri(`Impasto (massa ${fmt1(F.bulk / fRoom)} h a ${st.room} °C)`, `Kneten (Stockgare ${fmt1(F.bulk / fRoom)} h bei ${st.room} °C)`, `Mix (bulk ${fmt1(F.bulk / fRoom)} h at ${st.room} °C)`) });
    } else {
      // massa in cella, poi forma e appretto a temperatura ambiente
      const proofRoom = F.proof / fRoom;
      const forma = minus(bake, proofRoom + 0.35);
      ev.push({ k: "shape", t: forma, l: tri(`Forma, poi lievitazione finale ${fmt1(proofRoom)} h a ${st.room} °C`, `Formen, dann Stückgare ${fmt1(proofRoom)} h bei ${st.room} °C`, `Shape, then final proof ${fmt1(proofRoom)} h at ${st.room} °C`) });
      const doneCold = num(st.coldH) * fCold;
      const bulkRoom = Math.max(0.5, (F.bulk - doneCold)) / fRoom; // almeno mezz'ora di massa al caldo prima della cella
      const inCold = minus(forma, num(st.coldH));
      ev.push({ k: "cold", t: inCold, l: tri(`Massa in cella a ${st.cold} °C (${st.coldH} h)`, `Stockgare in der Kühlzelle bei ${st.cold} °C (${st.coldH} h)`, `Bulk into the cold room at ${st.cold} °C (${st.coldH} h)`) });
      cursor = minus(inCold, bulkRoom);
      ev.push({ k: "mix", t: cursor, l: tri(`Impasto, ${fmt1(bulkRoom)} h di massa a ${st.room} °C prima della cella`, `Kneten, ${fmt1(bulkRoom)} h Stockgare bei ${st.room} °C vor der Kühlzelle`, `Mix, ${fmt1(bulkRoom)} h bulk at ${st.room} °C before the cold room`) });
      note = tri("In massa fredda l'impasto si lavora meglio e la forma tiene di più; dopo la cella dagli 30 minuti per riprendersi prima di formare.", "Kalt geführte Stockgare: der Teig lässt sich besser verarbeiten und die Form hält; nach der Kühlzelle 30 Minuten aufwärmen lassen, bevor du formst.", "Cold bulk: the dough handles better and the shape holds; after the cold room give it 30 minutes before shaping.");
    }
    if (F.hasPre) ev.push({ k: "pre", t: minus(cursor, F.preMax || F.preMin), l: tri(`Prefermento (${fmt1(F.preMin)}${F.preMax !== F.preMin ? `-${fmt1(F.preMax)}` : ""} h)`, `Vorteig (${fmt1(F.preMin)}${F.preMax !== F.preMin ? `-${fmt1(F.preMax)}` : ""} h)`, `Preferment (${fmt1(F.preMin)}${F.preMax !== F.preMin ? `-${fmt1(F.preMax)}` : ""} h)`) });
    if (F.lm) ev.push({ k: "lm", t: minus(cursor, 4), l: tri("Ultimo rinfresco del lievito madre", "Letzte Auffrischung des Sauerteigs", "Last refresh of the starter") });
    ev.sort((a, b) => a.t - b.t);
    return { ev, note, F };
  }, [r, st, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  const asText = () => plan.ev.map((e) => `${fmtDate(e.t, lang)} ${fmtTime(e.t, lang)} · ${e.l}`).join("\n");
  const ics = () => {
    const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
    const body = plan.ev.map((e, i) => `BEGIN:VEVENT\nUID:mikilab-freddo-${Date.now()}-${i}@mikilab.de\nDTSTAMP:${stamp}\nDTSTART:${icsLocal(e.t)}\nDTEND:${icsLocal(new Date(e.t.getTime() + 15 * 60000))}\nSUMMARY:${rLoc(r, "name", lang)} · ${e.l}\nBEGIN:VALARM\nTRIGGER:-PT10M\nACTION:DISPLAY\nDESCRIPTION:MikiLab\nEND:VALARM\nEND:VEVENT`).join("\n");
    const txt = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//MikiLab//Laboratorio//IT\n${body}\nEND:VCALENDAR\n`;
    if (!downloadBlob(new Blob([txt], { type: "text/calendar" }), `mikilab-freddo.ics`)) toast.error(tri("Non riesco a creare il file.", "Datei kann nicht erstellt werden.", "Can't create the file."));
  };

  if (!r) return <p className="text-[12px] text-muted-foreground">{tri("Nessuna ricetta con le dosi.", "Kein Rezept mit Mengen.", "No recipe with quantities.")}</p>;
  return (
    <div data-testid="freddo" className="space-y-3">
      <p className="text-[12.5px] text-foreground/85 leading-snug">{tri("Dimmi a che ora inforni e quante ore vuoi in cella: conto all'indietro forma, impasto e prefermento. Le ore in cella valgono poco per la lievitazione: te le calcolo.", "Sag mir, wann du backst und wie viele Stunden Kühlzelle du willst: ich rechne Formen, Kneten und Vorteig zurück. Kühle Stunden zählen für die Gare wenig: ich rechne sie ein.", "Tell me when you bake and how many hours in the cold room: I count back shaping, mixing and preferment. Cold hours count little for fermentation: I factor that in.")}</p>
      <div className="rounded-xl border border-border bg-card p-3 space-y-2.5">
        <select data-testid="fr-recipe" value={r.id} onChange={(e) => set({ id: e.target.value })} className="w-full text-[12px] font-semibold bg-background text-foreground border border-border rounded-lg px-2 py-2 outline-none">
          {recipes.map((x) => <option key={x.id} value={x.id}>{rLoc(x, "name", lang)}</option>)}
        </select>
        <div className="inline-flex rounded-lg border border-border overflow-hidden text-[12px]">
          <button data-testid="fr-mode-forma" onClick={() => set({ mode: "forma" })} className={`px-3 py-1.5 font-semibold ${st.mode === "forma" ? "bg-primary text-white" : "bg-background text-muted-foreground"}`}>{tri("Cella dopo la forma", "Kühlzelle nach dem Formen", "Cold after shaping")}</button>
          <button data-testid="fr-mode-massa" onClick={() => set({ mode: "massa" })} className={`px-3 py-1.5 font-semibold ${st.mode === "massa" ? "bg-primary text-white" : "bg-background text-muted-foreground"}`}>{tri("Cella in massa", "Kühlzelle in der Stockgare", "Cold in bulk")}</button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <label className="block text-[12px] text-muted-foreground">{tri("Infornata", "Backzeit", "Bake time")}<input data-testid="fr-bake" type="time" value={st.bake} onChange={(e) => set({ bake: e.target.value })} className="mt-0.5 w-full font-mono-data font-bold text-foreground bg-background border border-border rounded-md px-2 py-1.5 outline-none" /></label>
          <NumField st={st} set={set} k="coldH" label={tri("Ore in cella", "Stunden kalt", "Cold hours")} min={2} max={72} unit="h" />
          <NumField st={st} set={set} k="cold" label={tri("Cella", "Kühlzelle", "Cold room")} min={1} max={12} unit="°C" />
          <NumField st={st} set={set} k="room" label={tri("Laboratorio", "Backstube", "Bakery")} min={14} max={34} unit="°C" />
          <NumField st={st} set={set} k="preH" label={tri("Forno prima", "Ofen vorher", "Oven before")} min={10} max={120} step={5} unit="min" />
        </div>
      </div>
      <div data-testid="fr-plan" className="rounded-xl border border-salvia/40 bg-salvia/8 p-3 space-y-1.5">
        {plan.ev.map((e, i) => (
          <div key={i} className="flex items-start gap-2 text-[12.5px]">
            <span className="font-mono-data font-bold text-foreground shrink-0 w-[118px]">{fmtDate(e.t, lang)} {fmtTime(e.t, lang)}</span>
            <span className="text-foreground/90 flex items-center gap-1">{e.k === "cold" && <Snowflake className="w-3.5 h-3.5 text-primary shrink-0" />}{e.l}</span>
          </div>
        ))}
        {plan.note && <p className="text-[12px] text-salvia mt-1">Sitor: {plan.note}</p>}
        <p className="text-[10.5px] text-muted-foreground">{tri(`Ricetta a 25 °C: massa ${fmt1(plan.F.bulk)} h, forma ${fmt1(plan.F.proof)} h. Il freddo rallenta ma non ferma: guarda sempre l'impasto.`, `Rezept bei 25 °C: Stockgare ${fmt1(plan.F.bulk)} h, Stückgare ${fmt1(plan.F.proof)} h. Kälte bremst, stoppt aber nicht: schau immer auf den Teig.`, `Recipe at 25 °C: bulk ${fmt1(plan.F.bulk)} h, proof ${fmt1(plan.F.proof)} h. Cold slows but doesn't stop: always look at the dough.`)}</p>
      </div>
      <div className="flex gap-1.5">
        <button data-testid="fr-ics" onClick={ics} className="flex-1 inline-flex items-center justify-center gap-1.5 text-[12px] font-bold px-3 py-2 rounded-xl bg-salvia text-white active:scale-95"><Calendar className="w-4 h-4" />{tri("Nel calendario", "In den Kalender", "To calendar")}</button>
        <button data-testid="fr-copy" onClick={() => navigator.clipboard.writeText(asText()).then(() => toast.success(tri("Copiato.", "Kopiert.", "Copied."))).catch(() => {})} className="flex-1 inline-flex items-center justify-center gap-1.5 text-[12px] font-bold px-3 py-2 rounded-xl border border-border bg-card text-foreground active:scale-95"><Copy className="w-4 h-4" />{tri("Copia", "Kopieren", "Copy")}</button>
      </div>
    </div>
  );
}
