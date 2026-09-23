import { useState } from "react";
import { Star, Check } from "lucide-react";
import { mkTri } from "@/i18n/triMaps";
import { LS, fmtDate } from "@/lib/sitorTools";

// V98 — I MIEI APPUNTI. Su ogni ricetta: stelle, "l'ho fatta oggi" (con la storia delle volte), e le tue righe
// (cosa cambiare, quanto è venuto, per chi). Restano nel telefono (mikilab_appunti_<id>), entrano nella valigia e nel libro.

export const appuntiKey = (id) => `mikilab_appunti_${id}`;
export const getAppunti = (id) => { const a = LS.get(appuntiKey(id), null); return a && typeof a === "object" ? { text: a.text || "", stars: a.stars || 0, made: Array.isArray(a.made) ? a.made : [] } : { text: "", stars: 0, made: [] }; };

export default function MieiAppunti({ r, lang }) {
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const [a, setA] = useState(() => getAppunti(r.id));
  const save = (n) => { setA(n); LS.set(appuntiKey(r.id), n); };
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const doneToday = a.made.some((t) => t >= today.getTime());
  return (
    <div data-testid="miei-appunti" className="space-y-2.5">
      <p className="text-[12.5px] text-foreground/85 leading-snug">{tri("Il tuo quaderno su questa ricetta: quante volte l'hai fatta, quanto ti è piaciuta, cosa cambiare la prossima volta. Resta nel telefono, va nella valigia e nel libro di pane.", "Dein Heft zu diesem Rezept: wie oft gebacken, wie gut es war, was du nächstes Mal änderst. Bleibt auf dem Handy, kommt in den Koffer und ins Brotbuch.", "Your notebook for this recipe: how many times you made it, how much you liked it, what to change next time. Stays on your phone, goes into the suitcase and the bread book.")}</p>
      <div className="flex items-center gap-2">
        <div className="flex gap-0.5" data-testid="ap-stars">{[1, 2, 3, 4, 5].map((n) => <button key={n} data-testid={`ap-star-${n}`} onClick={() => save({ ...a, stars: a.stars === n ? 0 : n })} className="p-0.5 active:scale-90"><Star className={`w-5 h-5 ${n <= a.stars ? "fill-primary text-primary" : "text-muted-foreground/50"}`} /></button>)}</div>
        <button data-testid="ap-made" onClick={() => { if (!doneToday) save({ ...a, made: [...a.made, Date.now()].slice(-50) }); }} disabled={doneToday} className={`ml-auto inline-flex items-center gap-1 text-[11.5px] font-bold px-2.5 py-1.5 rounded-full border active:scale-95 ${doneToday ? "bg-salvia/15 text-salvia border-salvia/40" : "bg-salvia text-white border-salvia"}`}><Check className="w-3.5 h-3.5" />{doneToday ? tri("Fatta oggi", "Heute gebacken", "Made today") : tri("L'ho fatta oggi", "Heute gebacken", "I made it today")}</button>
      </div>
      {a.made.length > 0 && <p className="text-[11.5px] text-muted-foreground">{tri(`Fatta ${a.made.length} ${a.made.length === 1 ? "volta" : "volte"}`, `${a.made.length} Mal gebacken`, `Made ${a.made.length} time${a.made.length === 1 ? "" : "s"}`)}: {a.made.slice(-5).map((t) => fmtDate(new Date(t), lang)).join(" · ")}{a.made.length > 5 ? " …" : ""}</p>}
      <textarea data-testid="ap-text" value={a.text} onChange={(e) => save({ ...a, text: e.target.value.slice(0, 2000) })} rows={4} placeholder={tri("Es. 20 g d'acqua in meno con la mia farina; 5 minuti in più di forno; piaciuta a nonna.", "Z. B. 20 g weniger Wasser mit meinem Mehl; 5 Minuten länger im Ofen; Oma hat's geschmeckt.", "E.g. 20 g less water with my flour; 5 more minutes in the oven; grandma loved it.")} className="w-full text-[12.5px] bg-background text-foreground border border-border rounded-xl px-3 py-2 outline-none focus:border-primary leading-snug" />
      <p className="text-[10.5px] text-muted-foreground">{tri("Si salva da solo mentre scrivi.", "Speichert sich beim Schreiben von selbst.", "Saves itself as you type.")}</p>
    </div>
  );
}
