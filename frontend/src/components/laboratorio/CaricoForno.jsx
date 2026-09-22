import { useMemo, useState } from "react";
import { Flame, Copy } from "lucide-react";
import { toast } from "sonner";
import { mkTri } from "@/i18n/triMaps";
import { LS, num, fmtTime } from "@/lib/sitorTools";

// V93 — PIANO DI CARICO DEL FORNO. Quanti pezzi, quanti per infornata, quanto dura una cottura: ti dico quante
// infornate servono, a che ora entrano ed escono, quando finisci, e di quanto sfalsare la forma dei pezzi.

const KEY = "mikilab_lab_forno";

function Field({ st, set, k, label, min, max, step, unit }) {
  return (
    <label className="block text-[12px] text-muted-foreground">{label}<span className="mt-0.5 flex items-center gap-1"><input data-testid={`cf-${k}`} type="number" min={min} max={max} step={step || 1} value={st[k]} onChange={(e) => set({ [k]: e.target.value })} className="w-full font-mono-data font-bold text-foreground bg-background border border-border rounded-md px-2 py-1.5 outline-none" />{unit && <span className="text-[11px]">{unit}</span>}</span></label>
  );
}

export default function CaricoForno({ lang }) {
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const [st, setSt] = useState(() => LS.get(KEY, { pieces: 60, perTray: 6, trays: 4, bake: 25, gap: 4, start: "06:00", ovens: 1 }));
  const set = (patch) => { const n = { ...st, ...patch }; setSt(n); LS.set(KEY, n); };

  const plan = useMemo(() => {
    const perBake = Math.max(1, num(st.perTray)) * Math.max(1, num(st.trays));
    const ovens = Math.max(1, num(st.ovens));
    const total = Math.max(1, num(st.pieces));
    const n = Math.ceil(total / perBake);
    const cycle = Math.max(1, num(st.bake)) + Math.max(0, num(st.gap));
    const [hh, mm] = String(st.start || "06:00").split(":").map(Number);
    const t0 = new Date(); t0.setHours(hh || 6, mm || 0, 0, 0);
    const bakes = [];
    for (let i = 0; i < n; i++) {
      const wave = Math.floor(i / ovens);
      const inT = new Date(t0.getTime() + wave * cycle * 60000);
      const outT = new Date(inT.getTime() + num(st.bake) * 60000);
      bakes.push({ i: i + 1, oven: (i % ovens) + 1, inT, outT, pcs: i === n - 1 ? total - perBake * (n - 1) : perBake });
    }
    const end = bakes.length ? bakes[bakes.length - 1].outT : t0;
    const waves = Math.ceil(n / ovens);
    return { perBake, n, cycle, bakes, end, waves, stagger: cycle };
  }, [st]);

  const asText = () => plan.bakes.map((b) => `${b.i}. ${fmtTime(b.inT, lang)} → ${fmtTime(b.outT, lang)} · ${b.pcs} ${tri("pezzi", "Stück", "pieces")}${num(st.ovens) > 1 ? ` · ${tri("forno", "Ofen", "oven")} ${b.oven}` : ""}`).join("\n");

  return (
    <div data-testid="carico-forno" className="space-y-3">
      <p className="text-[12.5px] text-foreground/85 leading-snug">{tri("Il forno è il collo di bottiglia: qui vedi quante infornate servono e quando esce l'ultimo pezzo, così sfalsi la forma e niente lievita oltre aspettando il suo turno.", "Der Ofen ist der Engpass: hier siehst du, wie viele Backgänge nötig sind und wann das letzte Stück rauskommt, damit du das Formen staffelst und nichts übergeht, während es wartet.", "The oven is the bottleneck: here you see how many bakes you need and when the last piece comes out, so you stagger the shaping and nothing over-proofs while it waits.")}</p>
      <div className="rounded-xl border border-border bg-card p-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Field st={st} set={set} k="pieces" label={tri("Pezzi totali", "Stück gesamt", "Total pieces")} min={1} />
        <Field st={st} set={set} k="perTray" label={tri("Pezzi per teglia", "Stück je Blech", "Pieces per tray")} min={1} />
        <Field st={st} set={set} k="trays" label={tri("Teglie per infornata", "Bleche je Backgang", "Trays per bake")} min={1} />
        <Field st={st} set={set} k="ovens" label={tri("Forni", "Öfen", "Ovens")} min={1} max={6} />
        <Field st={st} set={set} k="bake" label={tri("Cottura", "Backzeit", "Bake")} min={5} max={120} unit="min" />
        <Field st={st} set={set} k="gap" label={tri("Carico/scarico", "Be-/Entladen", "Load/unload")} min={0} max={30} unit="min" />
        <label className="block text-[12px] text-muted-foreground">{tri("Prima infornata", "Erster Backgang", "First bake")}<input data-testid="cf-start" type="time" value={st.start} onChange={(e) => set({ start: e.target.value })} className="mt-0.5 w-full font-mono-data font-bold text-foreground bg-background border border-border rounded-md px-2 py-1.5 outline-none" /></label>
      </div>
      <div data-testid="cf-plan" className="rounded-xl border border-salvia/40 bg-salvia/8 p-3">
        <p className="text-[12.5px] text-foreground mb-1.5"><Flame className="w-3.5 h-3.5 inline text-primary mr-1" />{tri(`${plan.n} infornate da ${plan.perBake} pezzi · ultimo pezzo fuori alle ${fmtTime(plan.end, lang)}`, `${plan.n} Backgänge à ${plan.perBake} Stück · letztes Stück raus um ${fmtTime(plan.end, lang)}`, `${plan.n} bakes of ${plan.perBake} pieces · last piece out at ${fmtTime(plan.end, lang)}`)}</p>
        <div className="space-y-0.5 max-h-56 overflow-y-auto">
          {plan.bakes.map((b) => (
            <div key={b.i} className="flex items-center gap-2 text-[12px]">
              <span className="font-mono-data text-muted-foreground w-6">{b.i}.</span>
              <span className="font-mono-data font-bold text-foreground">{fmtTime(b.inT, lang)} → {fmtTime(b.outT, lang)}</span>
              <span className="text-muted-foreground">· {b.pcs} {tri("pezzi", "Stück", "pieces")}{num(st.ovens) > 1 ? ` · ${tri("forno", "Ofen", "oven")} ${b.oven}` : ""}</span>
            </div>
          ))}
        </div>
      </div>
      {plan.waves > 1 && (
        <p className="text-[12px] text-salvia leading-snug">{tri(`Sitor: sfalsa la forma di ${plan.stagger} minuti tra un'infornata e l'altra (o tieni in cella i pezzi delle infornate dopo la seconda): così ogni pezzo entra al punto giusto di lievitazione, non quando tocca a lui.`, `Sitor: staffle das Formen um ${plan.stagger} Minuten zwischen den Backgängen (oder halte die Stücke ab dem dritten Backgang in der Kühlzelle): so kommt jedes Stück am richtigen Garpunkt in den Ofen, nicht wenn es an der Reihe ist.`, `Sitor: stagger the shaping by ${plan.stagger} minutes between bakes (or keep the pieces for the third bake onwards in the cold room): that way every piece goes in at the right proof, not when its turn comes.`)}</p>
      )}
      <button data-testid="cf-copy" onClick={() => navigator.clipboard.writeText(asText()).then(() => toast.success(tri("Copiato.", "Kopiert.", "Copied."))).catch(() => {})} className="inline-flex items-center gap-1.5 text-[12px] font-bold px-3 py-2 rounded-xl border border-border bg-card text-foreground active:scale-95"><Copy className="w-4 h-4" />{tri("Copia il piano", "Plan kopieren", "Copy the plan")}</button>
    </div>
  );
}
