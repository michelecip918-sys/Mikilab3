// V127 — Il lievito madre pronto all'ora giusta: quanto rinfrescare adesso per averlo al picco quando impasti.
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CalendarPlus, Sprout } from "lucide-react";
import { mkTri } from "@/i18n/triMaps";
import { LS, shareOrDownload } from "@/lib/sitorTools";
import { lievitoPronto, orePicco, num, clamp, fmtN, fmtG, fmtOre, fmtOra, fmtGiorno, creaIcs } from "@/lib/fornaio";
import { Sezione, Numero, Scelta, Cursore, Avviso } from "@/components/calcolatrice/ui";

const KEY = "mikilab_calc_lievito";
const DEF = { need: 200, keep: 50, idr: 100, T: 24, gg: 1, at: "08:00", ora: "" };

function alle(base, hhmm, giorni) {
  const [h, m] = String(hhmm || "08:00").split(":").map((x) => parseInt(x, 10));
  const d = new Date(base);
  d.setHours(Number.isFinite(h) ? h : 8, Number.isFinite(m) ? m : 0, 0, 0);
  d.setDate(d.getDate() + (giorni || 0));
  return d;
}

export default function LievitoPronto({ lang, da, onNav }) {
  const tri = mkTri(lang);
  const [s, setS] = useState(() => ({ ...DEF, ...(LS.get(KEY, {}) || {}) }));
  const [seme, setSeme] = useState(50);
  const [rq, setRq] = useState(1);
  const set = (p) => setS((c) => ({ ...c, ...p }));
  useEffect(() => { LS.set(KEY, s); }, [s]);
  useEffect(() => {
    if (!da || !(da.g > 0)) return;
    const quando = da.quando instanceof Date ? da.quando : null;
    const oggi = new Date(); oggi.setHours(0, 0, 0, 0);
    const p = { need: Math.round(da.g), idr: Math.round((da.lh || 0.5) * 100) };
    if (quando && quando.getTime() > Date.now()) {
      const g0 = new Date(quando); g0.setHours(0, 0, 0, 0);
      p.gg = clamp(Math.round((g0 - oggi) / 86400e3), 0, 3);
      p.at = `${String(quando.getHours()).padStart(2, "0")}:${String(quando.getMinutes()).padStart(2, "0")}`;
    }
    setS((c) => ({ ...c, ...p }));
  }, [da]);

  const now = new Date();
  const inizio = s.ora ? alle(now, s.ora, 0) : now;
  const serve = alle(now, s.at, Math.round(num(s.gg)));
  const ore = (serve - inizio) / 3600e3;
  const idr = clamp(num(s.idr, 100), 35, 130) / 100;
  const T = clamp(num(s.T, 24), 10, 34);
  const r = lievitoPronto({ need: s.need, keep: s.keep, idr, temp: T, ore });
  const picco = new Date(inizio.getTime() + r.picco * 3600e3);
  const dopo = r.stato === "tardi" ? new Date(serve.getTime() - orePicco(5, idr, T) * 3600e3) : null;
  const caldo = orePicco(0.5, idr, 28);
  const rTxt = `1 : ${fmtN(r.r, 1, lang)} : ${fmtN(r.r * idr, 1, lang)}`;

  const agenda = async () => {
    const passi = [
      { t: inizio, n: { it: `Rinfresca il lievito madre ${rTxt}`, de: `Sauerteig auffrischen ${rTxt}`, en: `Feed the starter ${rTxt}` } },
      { t: picco, n: { it: "Il lievito madre dovrebbe essere al picco", de: "Der Sauerteig sollte jetzt aktiv sein", en: "The starter should be at its peak" } },
    ].filter((p) => p.t.getTime() > Date.now() - 60e3);
    if (!passi.length) { toast.error(tri("Gli orari sono già passati.", "Die Zeiten sind schon vorbei.", "Those times have already passed.")); return; }
    const blob = new Blob([creaIcs(passi, "MikiLab", lang)], { type: "text/calendar;charset=utf-8" });
    await shareOrDownload(blob, "mikilab-lievito-pronto.ics", tri("Lievito pronto", "Sauerteig fertig", "Starter ready"));
  };

  const qFarina = num(seme) * rq, qAcqua = num(seme) * rq * idr;

  return (
    <div className="space-y-3" data-testid="calc-lievito-pronto">
      <Sezione titolo={tri("Il lievito madre pronto all'ora giusta", "Sauerteig pünktlich fertig", "Your starter ready on time")}
        sotto={tri("Dimmi quanto te ne serve e quando: ti dico come rinfrescarlo adesso.", "Sag mir, wie viel du wann brauchst: ich sage dir, wie du jetzt auffrischst.", "Tell me how much you need and when: I'll tell you how to feed it now.")}>
        <Scelta small testid="lp-tipo" value={idr >= 0.8 ? "licoli" : "solido"} onChange={(v) => set({ idr: v === "licoli" ? 100 : 50 })} options={[
          { v: "licoli", l: tri("Licoli (liquido, 100 %)", "Flüssig (100 %)", "Liquid (100 %)") },
          { v: "solido", l: tri("Solido (50 %)", "Fest (50 %)", "Stiff (50 %)") },
        ]} />
        <div className="flex flex-wrap gap-3">
          <Numero testid="lp-need" label={tri("Mi servono", "Ich brauche", "I need")} value={s.need} onChange={(v) => set({ need: v })} suffix="g" min={10} max={5000} step={10} />
          <Numero testid="lp-keep" label={tri("Da tenere per la prossima volta", "Für das nächste Mal behalten", "To keep for next time")} value={s.keep} onChange={(v) => set({ keep: v })} suffix="g" min={0} max={1000} step={10} />
          <Numero testid="lp-idr" label={tri("Idratazione", "Hydration", "Hydration")} value={s.idr} onChange={(v) => set({ idr: v })} suffix="%" min={35} max={130} w="w-20" />
        </div>
        <div className="space-y-1.5">
          <p className="text-[12px] text-muted-foreground">{tri("Mi serve", "Ich brauche ihn", "I need it")}</p>
          <div className="flex flex-wrap items-center gap-2">
            <Scelta small testid="lp-gg" value={Math.round(num(s.gg))} onChange={(v) => set({ gg: v })} options={[{ v: 0, l: tri("Oggi", "Heute", "Today") }, { v: 1, l: tri("Domani", "Morgen", "Tomorrow") }, { v: 2, l: tri("Dopodomani", "Übermorgen", "In two days") }]} />
            <input data-testid="lp-at" type="time" value={s.at} onChange={(e) => set({ at: e.target.value || "08:00" })} className="font-mono-data text-[14px] font-bold bg-background border border-border rounded-lg px-2 py-1 outline-none focus:border-primary" />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[12px] text-muted-foreground">{tri("Rinfresco", "Auffrischen", "Feed")}</span>
          <Scelta small testid="lp-ora" value={s.ora ? "dopo" : "ora"} onChange={(v) => set({ ora: v === "ora" ? "" : (s.ora || fmtOra(new Date(Date.now() + 3600e3), "it")) })} options={[{ v: "ora", l: tri("Adesso", "Jetzt", "Now") }, { v: "dopo", l: tri("Alle…", "Um…", "At…") }]} />
          {s.ora ? <input data-testid="lp-ora-t" type="time" value={s.ora} onChange={(e) => set({ ora: e.target.value })} className="font-mono-data text-[14px] font-bold bg-background border border-border rounded-lg px-2 py-1 outline-none focus:border-primary" /> : null}
        </div>
        <Cursore testid="lp-T" label={tri("Dove matura", "Wo er reift", "Where it ripens")} value={s.T} onChange={(v) => set({ T: v })} min={16} max={32} mostra={`${fmtN(T, 0, lang)} °C`} />
      </Sezione>

      {ore <= 0 ? <Avviso lvl="warn">{tri("L'ora scelta è già passata: scegli un altro momento.", "Diese Uhrzeit ist schon vorbei: wähle eine andere.", "That time has already passed: pick another one.")}</Avviso> : (
        <Sezione testid="lp-esito" titolo={tri(`${s.ora ? `Alle ${fmtOra(inizio, lang)}` : "Adesso"} mescola (${rTxt})`, `${s.ora ? `Um ${fmtOra(inizio, lang)}` : "Jetzt"} mischen (${rTxt})`, `${s.ora ? `At ${fmtOra(inizio, lang)}` : "Now"} mix (${rTxt})`)}
          sotto={tri(`Hai ${fmtOre(ore, lang)}. Picco verso ${fmtGiorno(picco, lang)} alle ${fmtOra(picco, lang)}, un'ora più o meno.`, `Du hast ${fmtOre(ore, lang)}. Aktiv etwa ${fmtGiorno(picco, lang)} um ${fmtOra(picco, lang)}, plus/minus eine Stunde.`, `You have ${fmtOre(ore, lang)}. Peak around ${fmtGiorno(picco, lang)} at ${fmtOra(picco, lang)}, give or take an hour.`)}>
          <div data-testid="lp-grammi" className="rounded-2xl p-3.5 border border-black/30" style={{ background: "#232529", color: "#F3EDE2" }}>
            {[[tri("Lievito madre", "Sauerteig", "Starter"), r.seme], [tri("Farina", "Mehl", "Flour"), r.farina], [tri("Acqua (a 26-28 °C)", "Wasser (26-28 °C)", "Water (26-28 °C)"), r.acqua]].map(([k, g]) => (
              <div key={k} className="flex items-baseline justify-between py-1 border-b border-white/10 last:border-b-0">
                <span className="text-[13px] opacity-85">{k}</span>
                <span className="font-mono-data font-bold text-[20px]" style={{ color: "#E9A23B" }}>{fmtG(g, lang)}</span>
              </div>
            ))}
            <p className="text-[11px] opacity-70 mt-2">{tri(`In tutto ${fmtG(r.seme + r.farina + r.acqua, lang)}: ${fmtG(num(s.need), lang)} per l'impasto${num(s.keep) > 0 ? ` e ${fmtG(num(s.keep), lang)} da rimettere in frigo` : ""}.`, `Insgesamt ${fmtG(r.seme + r.farina + r.acqua, lang)}: ${fmtG(num(s.need), lang)} für den Teig${num(s.keep) > 0 ? ` und ${fmtG(num(s.keep), lang)} zurück in den Kühlschrank` : ""}.`, `Altogether ${fmtG(r.seme + r.farina + r.acqua, lang)}: ${fmtG(num(s.need), lang)} for the dough${num(s.keep) > 0 ? ` and ${fmtG(num(s.keep), lang)} back into the fridge` : ""}.`)}</p>
          </div>
          {r.stato === "presto" ? <Avviso lvl="warn">{tri(`Il tempo è poco: anche con il rinfresco più stretto servono circa ${fmtOre(r.picco, lang)}. A 28 °C (forno spento con la luce accesa) bastano circa ${fmtOre(caldo, lang)}; oppure usalo un po' prima del picco.`, `Die Zeit ist knapp: selbst mit dem engsten Verhältnis braucht er etwa ${fmtOre(r.picco, lang)}. Bei 28 °C (Ofen aus, Licht an) reichen etwa ${fmtOre(caldo, lang)}; oder kurz vor dem Höhepunkt verwenden.`, `Time is short: even with the tightest feed it needs about ${fmtOre(r.picco, lang)}. At 28 °C (oven off, light on) about ${fmtOre(caldo, lang)} is enough; or use it a little before its peak.`)}</Avviso> : null}
          {r.stato === "tardi" && dopo ? <Avviso lvl="tip">{tri(`Hai tanto tempo: meglio rinfrescarlo più tardi, verso ${fmtGiorno(dopo, lang)} alle ${fmtOra(dopo, lang)}, con 1 : 5. Fino ad allora lascialo in frigo.`, `Du hast viel Zeit: lieber später auffrischen, etwa ${fmtGiorno(dopo, lang)} um ${fmtOra(dopo, lang)}, mit 1 : 5. Bis dahin im Kühlschrank lassen.`, `You have plenty of time: better feed it later, around ${fmtGiorno(dopo, lang)} at ${fmtOra(dopo, lang)}, at 1 : 5. Keep it in the fridge until then.`)}</Avviso> : null}
          <p className="text-[12.5px] text-foreground leading-snug">{idr >= 0.8
            ? tri("È pronto quando è almeno triplicato, pieno di bolle, con la cupola che comincia appena a scendere.", "Fertig, wenn er sich mindestens verdreifacht hat, voller Blasen ist und die Kuppel gerade zu sinken beginnt.", "It's ready when it has at least tripled, full of bubbles, with the dome just starting to fall.")
            : tri("È pronto quando è raddoppiato, bombato in cima e profuma di yogurt, non di aceto.", "Fertig, wenn er sich verdoppelt hat, oben gewölbt ist und nach Joghurt riecht, nicht nach Essig.", "It's ready when it has doubled, domed on top and smells of yoghurt, not vinegar.")}</p>
          <div className="flex flex-wrap gap-2 no-print">
            <button type="button" data-testid="lp-agenda" onClick={agenda} className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold px-3 py-1.5 rounded-full border border-border bg-background hover:border-primary/60 active:scale-95"><CalendarPlus className="w-3.5 h-3.5" /> {tri("Promemoria in agenda", "Erinnerung in den Kalender", "Calendar reminder")}</button>
            {onNav ? <button type="button" data-testid="lp-mio" onClick={() => onNav("miolievito")} className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold px-3 py-1.5 rounded-full border border-salvia/60 bg-salvia/10 active:scale-95"><Sprout className="w-3.5 h-3.5" /> {tri("Il mio lievito madre", "Mein Sauerteig", "My starter")}</button> : null}
          </div>
        </Sezione>
      )}

      <Sezione testid="lp-veloce" titolo={tri("Un rinfresco al volo", "Schnell auffrischen", "A quick feed")} sotto={tri("Quanta farina e acqua per il lievito che hai, e quanto ci mette.", "Wie viel Mehl und Wasser für deinen Sauerteig, und wie lange es dauert.", "How much flour and water for the starter you have, and how long it takes.")}>
        <div className="flex flex-wrap items-end gap-3">
          <Numero testid="lp-seme" label={tri("Ho", "Ich habe", "I have")} value={seme} onChange={setSeme} suffix={tri("g di lievito", "g Sauerteig", "g of starter")} min={1} max={2000} />
          <Scelta small testid="lp-rq" value={rq} onChange={setRq} options={[1, 2, 3, 5, 10].map((x) => ({ v: x, l: `1 : ${x}` }))} />
        </div>
        <p className="text-[13.5px] text-foreground" data-testid="lp-veloce-esito">
          {tri(`Farina ${fmtG(qFarina, lang)}, acqua ${fmtG(qAcqua, lang)}: pronto in circa ${fmtOre(orePicco(rq, idr, T), lang)} a ${fmtN(T, 0, lang)} °C.`, `Mehl ${fmtG(qFarina, lang)}, Wasser ${fmtG(qAcqua, lang)}: aktiv nach etwa ${fmtOre(orePicco(rq, idr, T), lang)} bei ${fmtN(T, 0, lang)} °C.`, `Flour ${fmtG(qFarina, lang)}, water ${fmtG(qAcqua, lang)}: ready in about ${fmtOre(orePicco(rq, idr, T), lang)} at ${fmtN(T, 0, lang)} °C.`)}
        </p>
        <p className="text-[11px] text-muted-foreground leading-snug">{tri("Stime per un lievito in salute. Il tuo può essere più veloce o più lento: dopo due o tre volte sai di quanto.", "Schätzungen für einen gesunden Sauerteig. Deiner kann schneller oder langsamer sein: nach zwei, drei Mal weißt du, wie viel.", "Estimates for a healthy starter. Yours may be faster or slower: after two or three times you'll know by how much.")}</p>
      </Sezione>
    </div>
  );
}
