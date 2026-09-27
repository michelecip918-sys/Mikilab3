// V127 — La calcolatrice del fornaio: la formula (cosa impasti, quanto, farine, acqua, lievito, tempi, il resto).
import { useState } from "react";
import { toast } from "sonner";
import { ClipboardPaste, RotateCcw, Plus, X, Snowflake, Flame } from "lucide-react";
import { mkTri } from "@/i18n/triMaps";
import { STILI, GRUPPI, FARINE, EXTRA, TIPI_LIEVITO, extraOf, nuovaFormula, leggiRicetta, L, num, fmtN, fmtP, fmtG } from "@/lib/fornaio";
import { Sezione, Numero, Scelta, Cursore, Interruttore, Avviso, selectCls } from "@/components/calcolatrice/ui";

const r3 = (x) => Math.round(x * 1000) / 1000;

export default function Editor({ f, setF, res, lang, soloPizza }) {
  const tri = mkTri(lang);
  const st = STILI[f.st] || STILI.libero;
  const set = (patch) => setF((cur) => ({ ...cur, ...patch }));
  const setTg = (patch) => setF((cur) => ({ ...cur, tg: { ...(cur.tg || {}), ...patch } }));
  const [incolla, setIncolla] = useState(false);
  const [testo, setTesto] = useState("");
  const [letto, setLetto] = useState(null);
  const tieni = (cur) => ({ mx: cur.mx, ac: cur.ac, at: cur.at, gg: cur.gg });

  const scegli = (k) => setF((cur) => ({ ...nuovaFormula(k), n: cur.n, ...tieni(cur) }));
  const ricomincia = () => setF((cur) => ({ ...nuovaFormula(cur.st), ...tieni(cur) }));

  // farine
  const bl = Array.isArray(f.bl) && f.bl.length ? f.bl : [["0", 100]];
  const somma = bl.reduce((a, x) => a + num(x[1]), 0);
  const setBl = (i, row) => set({ bl: bl.map((x, j) => (j === i ? row : x)) });
  const delBl = (i) => set({ bl: bl.filter((_, j) => j !== i) });
  const addBl = () => {
    if (bl.length >= 4) return;
    const nuova = ["integrale", "1", "segale", "semola", "farro"].find((k) => !bl.some((x) => x[0] === k)) || "altra";
    let big = 0;
    bl.forEach((x, j) => { if (num(x[1]) > num(bl[big][1])) big = j; });
    const togli = num(bl[big][1]) >= 40 ? 20 : 0;
    set({ bl: [...bl.map((x, j) => (j === big ? [x[0], num(x[1]) - togli] : x)), [nuova, togli || 10]] });
  };
  const normalizza = () => { if (somma > 0) set({ bl: bl.map((x) => [x[0], Math.round((num(x[1]) / somma) * 1000) / 10]) }); };

  // ingredienti in più
  const ex = Array.isArray(f.ex) ? f.ex : [];
  const setEx = (i, row) => set({ ex: ex.map((x, j) => (j === i ? row : x)) });
  const delEx = (i) => set({ ex: ex.filter((_, j) => j !== i) });
  const addEx = (k) => {
    if (!k) return;
    if (k === "x") set({ ex: [...ex, ["x", 5, "", 0]] });
    else if (!ex.some((x) => x[0] === k)) set({ ex: [...ex, [k, extraOf(k).def]] });
  };

  // lievito
  const kY = TIPI_LIEVITO[f.yt] || 1;
  const cambiaLv = (v) => setF((cur) => {
    const k = TIPI_LIEVITO[cur.yt] || 1;
    if (v === "biga") return { ...cur, lv: v, pp: 30, ph: 45, py: r3(1 * k), pH: 16, pT: 18, yp: r3(0.2 * k), ya: true };
    if (v === "poolish") return { ...cur, lv: v, pp: 30, ph: 100, pH: 14, pT: 20, py: r3(0.1 * k), yp: r3(0.2 * k), ya: true };
    if (v === "lm") return { ...cur, lv: v, lh: 50, lp: 20, yp: 0, ya: true };
    if (v === "licoli") return { ...cur, lv: v, lh: 100, lp: 20, yp: 0, ya: true };
    return { ...cur, lv: v, ya: true, yp: cur.lv === "diretto" ? cur.yp : 0 };
  });
  const cambiaTipo = (t) => setF((cur) => {
    const k0 = TIPI_LIEVITO[cur.yt] || 1, k1 = TIPI_LIEVITO[t] || 1;
    const conv = (v) => r3((num(v) / k0) * k1);
    return { ...cur, yt: t, yp: conv(cur.yp), py: conv(cur.py) };
  });
  const tipoOpts = [
    { v: "fresco", l: tri("Fresco", "Frisch", "Fresh") },
    { v: "secco", l: tri("Secco attivo", "Trocken", "Active dry") },
    { v: "istantaneo", l: tri("Istantaneo", "Instant", "Instant") },
  ];
  const lvOpts = [
    { v: "diretto", l: tri("Lievito di birra", "Hefe", "Yeast") },
    { v: "biga", l: "Biga" },
    { v: "poolish", l: "Poolish" },
    { v: "lm", l: tri("Lievito madre", "Sauerteig (fest)", "Stiff starter") },
    { v: "licoli", l: tri("Licoli", "Flüssiger Sauerteig", "Liquid starter") },
    { v: "nessuno", l: tri("Senza", "Ohne", "None") },
  ];
  const nomeTipo = L({ fresco: { it: "fresco", de: "Frischhefe", en: "fresh" }, secco: { it: "secco attivo", de: "Trockenhefe", en: "active dry" }, istantaneo: { it: "istantaneo", de: "Instanthefe", en: "instant" } }[f.yt] || { it: "fresco", de: "Frischhefe", en: "fresh" }, lang);

  const leggi = () => {
    const r = leggiRicetta(testo);
    if (!r.ok) { toast.error(tri("Non trovo la farina: scrivi una riga per ingrediente, tipo «500 g farina 0».", "Kein Mehl gefunden: eine Zeile pro Zutat, z. B. „500 g Weizenmehl 550“.", "No flour found: one line per ingredient, like \"500 g bread flour\".")); return; }
    setLetto(r);
  };
  const usa = () => {
    if (!letto || !letto.ok) return;
    setF((cur) => ({ ...letto.f, ...tieni(cur) }));
    setIncolla(false); setLetto(null); setTesto("");
    toast.success(tri("Fatto: ora la ricetta è una formula. Controlla i numeri qui sotto.", "Erledigt: das Rezept ist jetzt eine Rezeptur. Prüfe die Zahlen unten.", "Done: the recipe is now a formula. Check the numbers below."));
  };

  const gruppi = soloPizza ? GRUPPI.filter((g) => g.k === "pizza") : GRUPPI;
  const tg = f.tg || { s: "rett", a: 30, b: 40, k: 1, sp: 0.6 };
  const isLm = f.lv === "lm" || f.lv === "licoli";
  const isPre = f.lv === "biga" || f.lv === "poolish";

  return (
    <div className="space-y-3" data-testid="calc-editor">
      <div className="flex flex-wrap gap-2 no-print">
        <button type="button" data-testid="calc-incolla-open" onClick={() => setIncolla((v) => !v)} className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold px-3 py-1.5 rounded-full border border-border bg-card hover:border-primary/60">
          <ClipboardPaste className="w-3.5 h-3.5" /> {tri("Incolla una ricetta", "Rezept einfügen", "Paste a recipe")}
        </button>
        <button type="button" data-testid="calc-reset" onClick={ricomincia} className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold px-3 py-1.5 rounded-full border border-border bg-card hover:border-primary/60">
          <RotateCcw className="w-3.5 h-3.5" /> {tri("Ricomincia", "Neu anfangen", "Start over")}
        </button>
      </div>

      {incolla ? (
        <Sezione testid="calc-incolla" titolo={tri("Incolla una ricetta", "Rezept einfügen", "Paste a recipe")}
          sotto={tri("Una riga per ingrediente, con i grammi. La trasformo in percentuali, qui nel telefono: niente viene inviato.", "Eine Zeile pro Zutat, mit Gramm. Ich rechne sie hier im Handy in Prozente um: nichts wird gesendet.", "One line per ingredient, with grams. I turn it into percentages here on your phone: nothing is sent.")}>
          <textarea data-testid="calc-incolla-text" value={testo} onChange={(e) => setTesto(e.target.value.slice(0, 3000))} rows={6}
            placeholder={tri("500 g farina 0\n350 g acqua\n10 g sale\n3 g lievito di birra", "500 g Weizenmehl 550\n350 g Wasser\n10 g Salz\n3 g Frischhefe", "500 g bread flour\n350 g water\n10 g salt\n3 g fresh yeast")}
            className="w-full text-[13.5px] bg-background border border-border rounded-xl p-2.5 outline-none focus:border-primary font-mono-data" />
          <div className="flex gap-2">
            <button type="button" data-testid="calc-incolla-leggi" onClick={leggi} className="text-[13px] font-bold px-4 py-2 rounded-xl bg-primary text-primary-foreground active:scale-95">{tri("Leggi", "Lesen", "Read")}</button>
            <button type="button" onClick={() => { setIncolla(false); setLetto(null); }} className="text-[13px] font-semibold px-4 py-2 rounded-xl border border-border">{tri("Chiudi", "Schließen", "Close")}</button>
          </div>
          {letto && letto.ok ? (
            <div className="space-y-2" data-testid="calc-incolla-esito">
              <p className="text-[12.5px] text-foreground">{tri(`Ho capito ${letto.letti.length} righe: farina ${fmtG(letto.f.fl, lang)}, acqua ${fmtP(letto.f.hy, lang)}, sale ${fmtP(letto.f.sa, lang)}.`, `${letto.letti.length} Zeilen verstanden: Mehl ${fmtG(letto.f.fl, lang)}, Wasser ${fmtP(letto.f.hy, lang)}, Salz ${fmtP(letto.f.sa, lang)}.`, `I understood ${letto.letti.length} lines: flour ${fmtG(letto.f.fl, lang)}, water ${fmtP(letto.f.hy, lang)}, salt ${fmtP(letto.f.sa, lang)}.`)}</p>
              {letto.ignoti.length ? <p className="text-[12px] text-muted-foreground">{tri("Queste non le ho capite (aggiungile a mano):", "Diese habe ich nicht verstanden (bitte von Hand ergänzen):", "These I didn't understand (add them by hand):")} {letto.ignoti.slice(0, 6).join(" · ")}</p> : null}
              <button type="button" data-testid="calc-incolla-usa" onClick={usa} className="text-[13px] font-bold px-4 py-2 rounded-xl bg-primary text-primary-foreground active:scale-95">{tri("Usa questi numeri", "Diese Zahlen nehmen", "Use these numbers")}</button>
            </div>
          ) : null}
        </Sezione>
      ) : null}

      <Sezione testid="calc-stile" titolo={tri("Cosa impasti?", "Was backst du?", "What are you making?")} sotto={tri("Scegli e parti dai numeri giusti. Poi cambi tutto quello che vuoi.", "Wählen und mit den richtigen Zahlen starten. Danach kannst du alles ändern.", "Pick one and start from sensible numbers. Then change whatever you like.")}>
        {gruppi.map((g) => (
          <div key={g.k} className="space-y-1.5">
            {!soloPizza ? <p className="text-[11px] font-mono-data uppercase tracking-[0.14em] text-muted-foreground">{L(g.t, lang)}</p> : null}
            <Scelta small testid={`calc-stili-${g.k}`} value={f.st} onChange={scegli} options={g.s.map((k) => ({ v: k, l: L(STILI[k].n, lang) }))} />
          </div>
        ))}
      </Sezione>

      <Sezione testid="calc-quanto" titolo={tri("Quanto ne vuoi?", "Wie viel?", "How much?")}>
        <Scelta testid="calc-modo" value={f.m} onChange={(v) => set({ m: v })} options={[
          { v: "pezzi", l: tri("Pezzi e peso", "Stück und Gewicht", "Pieces and weight") },
          { v: "farina", l: tri("Dalla farina", "Vom Mehl", "From the flour") },
          { v: "impasto", l: tri("Peso dell'impasto", "Teiggewicht", "Dough weight") },
          { v: "teglia", l: tri("Teglia", "Blech", "Pan") },
        ]} />
        {f.m === "pezzi" ? (
          <div className="flex flex-wrap gap-3">
            <Numero testid="calc-pc" label={st.pizza ? tri("Panetti", "Teigkugeln", "Dough balls") : tri("Quanti pezzi", "Wie viele Stück", "How many pieces")} value={f.pc} onChange={(v) => set({ pc: v })} min={1} max={500} w="w-20" />
            <Numero testid="calc-pw" label={tri("Peso di ognuno (crudo)", "Gewicht je Stück (roh)", "Weight each (raw)")} value={f.pw} onChange={(v) => set({ pw: v })} suffix="g" min={10} max={5000} step={5} />
          </div>
        ) : null}
        {f.m === "farina" ? <Numero testid="calc-fl" label={tri("Farina", "Mehl", "Flour")} value={f.fl} onChange={(v) => set({ fl: v })} suffix="g" min={10} max={200000} step={50} hint={isLm ? tri("Senza la farina del lievito madre, come nelle ricette del sito.", "Ohne das Mehl im Sauerteig, wie in den Rezepten der Seite.", "Not counting the flour inside the starter, as in the site's recipes.") : null} /> : null}
        {f.m === "impasto" ? <Numero testid="calc-dg" label={tri("Impasto in tutto (crudo)", "Teig insgesamt (roh)", "Total dough (raw)")} value={f.dg} onChange={(v) => set({ dg: v })} suffix="g" min={20} max={400000} step={50} /> : null}
        {f.m === "teglia" ? (
          <div className="space-y-2.5">
            <Scelta small testid="calc-tg-forma" value={tg.s} onChange={(v) => setTg({ s: v })} options={[{ v: "rett", l: tri("Rettangolare", "Rechteckig", "Rectangular") }, { v: "tondo", l: tri("Rotonda", "Rund", "Round") }]} />
            <div className="flex flex-wrap gap-3">
              {tg.s === "tondo"
                ? <Numero testid="calc-tg-a" label={tri("Diametro", "Durchmesser", "Diameter")} value={tg.a} onChange={(v) => setTg({ a: v })} suffix="cm" w="w-20" />
                : <>
                    <Numero testid="calc-tg-a" label={tri("Lato corto", "Kurze Seite", "Short side")} value={tg.a} onChange={(v) => setTg({ a: v })} suffix="cm" w="w-20" />
                    <Numero testid="calc-tg-b" label={tri("Lato lungo", "Lange Seite", "Long side")} value={tg.b} onChange={(v) => setTg({ b: v })} suffix="cm" w="w-20" />
                  </>}
              <Numero testid="calc-tg-k" label={tri("Quante teglie", "Wie viele Bleche", "How many pans")} value={tg.k} onChange={(v) => setTg({ k: v })} min={1} max={20} w="w-16" />
            </div>
            <div className="space-y-1.5">
              <Numero testid="calc-tg-sp" label={tri("Grammi di impasto per cm²", "Gramm Teig pro cm²", "Grams of dough per cm²")} value={tg.sp} onChange={(v) => setTg({ sp: v })} step={0.05} min={0.2} max={1.5} w="w-20" />
              <Scelta small testid="calc-tg-sp-chips" value={num(tg.sp)} onChange={(v) => setTg({ sp: v })} options={[
                { v: 0.45, l: tri("Sottile 0,45", "Dünn 0,45", "Thin 0.45") },
                { v: 0.6, l: tri("Media 0,6", "Mittel 0,6", "Medium 0.6") },
                { v: 0.75, l: tri("Alta 0,75", "Hoch 0,75", "Thick 0.75") },
              ]} />
            </div>
          </div>
        ) : null}
        {f.m === "pezzi" || f.m === "teglia" ? (
          <Numero testid="calc-lo" label={tri("In più, per quello che resta nella ciotola", "Zuschlag für Teigreste in der Schüssel", "Extra for what sticks to the bowl")} value={f.lo} onChange={(v) => set({ lo: v })} suffix="%" step={0.5} min={0} max={15} w="w-16" />
        ) : null}
      </Sezione>

      <Sezione testid="calc-farine" titolo={tri("Le farine", "Die Mehle", "The flours")} sotto={isPre ? tri("La biga o il poolish si fanno con la prima farina della lista.", "Biga oder Poolish werden mit dem ersten Mehl der Liste angesetzt.", "The biga or poolish is made with the first flour on the list.") : null}>
        <div className="space-y-2">
          {bl.map((row, i) => (
            <div key={i} className="flex items-center gap-2">
              <select data-testid={`calc-farina-${i}`} value={row[0]} onChange={(e) => setBl(i, [e.target.value, row[1]])} className={`${selectCls} flex-1 min-w-0`}>
                {FARINE.map((x) => <option key={x.k} value={x.k}>{L(x.n, lang)}</option>)}
              </select>
              <input data-testid={`calc-farina-pct-${i}`} type="number" inputMode="decimal" value={row[1]} onChange={(e) => setBl(i, [row[0], e.target.value])}
                className="w-16 font-mono-data text-[14px] font-bold text-foreground bg-background border border-border rounded-lg px-2 py-1.5 outline-none focus:border-primary" aria-label="%" />
              <span className="text-[12px] text-muted-foreground">%</span>
              {bl.length > 1 ? <button type="button" onClick={() => delBl(i)} aria-label={tri("Togli", "Entfernen", "Remove")} className="p-1.5 rounded-lg text-muted-foreground hover:text-mattone"><X className="w-4 h-4" /></button> : null}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {bl.length < 4 ? <button type="button" data-testid="calc-farina-add" onClick={addBl} className="inline-flex items-center gap-1 text-[12.5px] font-semibold px-3 py-1.5 rounded-full border border-dashed border-border hover:border-primary/60"><Plus className="w-3.5 h-3.5" /> {tri("Aggiungi una farina", "Mehl hinzufügen", "Add a flour")}</button> : null}
          {Math.abs(somma - 100) > 0.05 ? (
            <button type="button" data-testid="calc-farina-norm" onClick={normalizza} className="text-[12.5px] font-semibold px-3 py-1.5 rounded-full bg-ambra/15 text-foreground border border-ambra/40">
              {tri(`Fanno ${fmtN(somma, 1, lang)} %: rifalle a 100`, `Ergibt ${fmtN(somma, 1, lang)} %: auf 100 bringen`, `They add up to ${fmtN(somma, 1, lang)} %: make it 100`)}
            </button>
          ) : null}
        </div>
      </Sezione>

      <Sezione testid="calc-acqua" titolo={tri("L'acqua", "Das Wasser", "The water")}
        sotto={tri("In percentuale sulla farina. Con biga e poolish è tutta l'acqua; con il lievito madre è l'acqua che aggiungi tu.", "In Prozent vom Mehl. Mit Biga und Poolish ist es das ganze Wasser; mit Sauerteig das Wasser, das du zugibst.", "As a percentage of the flour. With biga and poolish it's all the water; with a starter it's the water you add.")}>
        <div className="flex items-end gap-3">
          <div className="flex-1 min-w-0"><Cursore testid="calc-hy-range" label={tri("Acqua", "Wasser", "Water")} value={f.hy} onChange={(v) => set({ hy: v })} min={0} max={100} mostra={fmtP(num(f.hy), lang)} /></div>
          <Numero testid="calc-hy" label="" value={f.hy} onChange={(v) => set({ hy: v })} suffix="%" step={0.5} min={0} max={130} w="w-20" />
        </div>
        {res && Math.abs(res.idrReale - num(f.hy)) >= 0.5 ? (
          <p className="text-[12px] text-muted-foreground leading-snug" data-testid="calc-idr-reale">
            {tri(`Idratazione reale ${fmtP(res.idrReale, lang)}: conta anche l'acqua del lievito madre, del latte, delle uova, della patata e del burro.`, `Reale Hydration ${fmtP(res.idrReale, lang)}: zählt auch das Wasser aus Sauerteig, Milch, Eiern, Kartoffel und Butter.`, `Real hydration ${fmtP(res.idrReale, lang)}: it also counts the water in the starter, milk, eggs, potato and butter.`)}
          </p>
        ) : null}
      </Sezione>

      <Sezione testid="calc-lievito" titolo={tri("Il lievito", "Das Triebmittel", "The leavening")}>
        <Scelta small testid="calc-lv" value={f.lv} onChange={cambiaLv} options={lvOpts} />
        {f.lv !== "lm" && f.lv !== "licoli" && f.lv !== "nessuno" ? (
          <div className="space-y-1">
            <p className="text-[12px] text-muted-foreground">{tri("Che lievito di birra usi?", "Welche Hefe nimmst du?", "Which yeast do you use?")}</p>
            <Scelta small testid="calc-yt" value={f.yt} onChange={cambiaTipo} options={tipoOpts} />
          </div>
        ) : null}
        {f.lv === "diretto" ? (
          <div className="space-y-2">
            <Interruttore testid="calc-ya" on={!!f.ya} onChange={(v) => set({ ya: v, yp: v ? f.yp : r3(res ? res.lievito.pct : num(f.yp)) })}
              label={tri("Calcola il lievito dai tempi", "Hefe aus den Zeiten berechnen", "Work out the yeast from the times")}
              sotto={st.pizza ? tri("Per la pizza uso la formula dei pizzaioli (Japi).", "Für Pizza nehme ich die Formel der Pizzabäcker (Japi).", "For pizza I use the pizzaioli's formula (Japi).") : tri("Più ore e più caldo = meno lievito.", "Mehr Stunden und wärmer = weniger Hefe.", "More hours and warmer = less yeast.")} />
            {f.ya && res ? (
              <p className="text-[13px] text-foreground" data-testid="calc-lievito-auto">{tri(`Con i tuoi tempi: ${fmtP(res.lievito.pct, lang, 2)} di ${nomeTipo}, cioè ${fmtG(res.lievito.g, lang)}.`, `Mit deinen Zeiten: ${fmtP(res.lievito.pct, lang, 2)} ${nomeTipo}, also ${fmtG(res.lievito.g, lang)}.`, `With your times: ${fmtP(res.lievito.pct, lang, 2)} ${nomeTipo}, that is ${fmtG(res.lievito.g, lang)}.`)}</p>
            ) : (
              <Numero testid="calc-yp" label={tri("Lievito sulla farina", "Hefe auf das Mehl", "Yeast on the flour")} value={f.yp} onChange={(v) => set({ yp: v })} suffix="%" step={0.05} min={0} max={10} w="w-20" />
            )}
          </div>
        ) : null}
        {isPre ? (
          <div className="space-y-2.5">
            <div className="flex flex-wrap gap-3">
              <Numero testid="calc-pp" label={tri("Farina nel prefermento", "Mehl im Vorteig", "Flour in the preferment")} value={f.pp} onChange={(v) => set({ pp: v })} suffix="%" min={5} max={100} w="w-20" />
              <Numero testid="calc-ph" label={tri("Sua acqua", "Sein Wasser", "Its water")} value={f.ph} onChange={(v) => set({ ph: v })} suffix="%" min={30} max={130} w="w-20" hint={f.lv === "biga" ? tri("biga 44-50 %", "Biga 44-50 %", "biga 44-50 %") : tri("poolish 100 %", "Poolish 100 %", "poolish 100 %")} />
            </div>
            <div className="flex flex-wrap gap-3">
              <Numero testid="calc-pH" label={tri("Matura per", "Reift", "Ripens for")} value={f.pH} onChange={(v) => set({ pH: v })} suffix="h" min={1} max={96} w="w-16" />
              <Numero testid="calc-pT" label={tri("a", "bei", "at")} value={f.pT} onChange={(v) => set({ pT: v })} suffix="°C" min={2} max={35} w="w-16" />
            </div>
            {f.lv === "poolish" ? (
              <Interruttore testid="calc-ya-pre" on={!!f.ya} onChange={(v) => set({ ya: v, py: v ? f.py : r3(res && res.pre ? res.pre.pct : num(f.py)) })}
                label={tri("Lievito del poolish dalle ore", "Poolish-Hefe aus den Stunden", "Poolish yeast from the hours")}
                sotto={f.ya && res && res.pre ? tri(`${fmtP(res.pre.pct, lang, 2)} sulla sua farina: ${fmtG(res.pre.lievito, lang)}.`, `${fmtP(res.pre.pct, lang, 2)} auf sein Mehl: ${fmtG(res.pre.lievito, lang)}.`, `${fmtP(res.pre.pct, lang, 2)} of its flour: ${fmtG(res.pre.lievito, lang)}.`) : null} />
            ) : null}
            {f.lv === "biga" || !f.ya ? (
              <Numero testid="calc-py" label={tri("Lievito nel prefermento (sulla sua farina)", "Hefe im Vorteig (auf sein Mehl)", "Yeast in the preferment (on its flour)")} value={f.py} onChange={(v) => set({ py: v })} suffix="%" step={0.05} min={0} max={5} w="w-20"
                hint={f.lv === "biga" ? tri(`1 % di fresco per 16-18 ore a 18 °C${kY !== 1 ? ` (con il ${nomeTipo}: ${fmtN(kY, 2, lang)} %)` : ""}.`, `1 % Frischhefe für 16-18 Stunden bei 18 °C${kY !== 1 ? ` (${nomeTipo}: ${fmtN(kY, 2, lang)} %)` : ""}.`, `1 % fresh for 16-18 hours at 18 °C${kY !== 1 ? ` (${nomeTipo}: ${fmtN(kY, 2, lang)} %)` : ""}.`) : null} />
            ) : null}
            <Numero testid="calc-yp-pre" label={tri("Lievito in più nell'impasto finale (facoltativo)", "Extra-Hefe im Hauptteig (optional)", "Extra yeast in the final dough (optional)")} value={f.yp} onChange={(v) => set({ yp: v })} suffix="%" step={0.05} min={0} max={5} w="w-20" />
          </div>
        ) : null}
        {isLm ? (
          <div className="space-y-2.5">
            <Interruttore testid="calc-ya-lm" on={!!f.ya} onChange={(v) => set({ ya: v, lp: v ? f.lp : Math.round(res && res.lm ? res.lm.pct : num(f.lp)) })}
              label={tri("Quanto lievito madre? Calcolalo dai tempi", "Wie viel Sauerteig? Aus den Zeiten berechnen", "How much starter? Work it out from the times")}
              sotto={f.ya && res && res.lm ? tri(`Con i tuoi tempi: ${fmtP(res.lm.pct, lang, 0)} sulla farina, cioè ${fmtG(res.lm.g, lang)}.`, `Mit deinen Zeiten: ${fmtP(res.lm.pct, lang, 0)} vom Mehl, also ${fmtG(res.lm.g, lang)}.`, `With your times: ${fmtP(res.lm.pct, lang, 0)} of the flour, that is ${fmtG(res.lm.g, lang)}.`) : null} />
            {!f.ya ? <Numero testid="calc-lp" label={tri("Lievito madre sulla farina", "Sauerteig auf das Mehl", "Starter on the flour")} value={f.lp} onChange={(v) => set({ lp: v })} suffix="%" min={0} max={80} w="w-20" /> : null}
            <div className="flex flex-wrap gap-3">
              <Numero testid="calc-lh" label={tri("Idratazione del lievito", "Hydration des Sauerteigs", "Starter hydration")} value={f.lh} onChange={(v) => set({ lh: v })} suffix="%" min={35} max={130} w="w-20" hint={tri("solido 45-55 %, licoli 100 %", "fest 45-55 %, flüssig 100 %", "stiff 45-55 %, liquid 100 %")} />
              <Numero testid="calc-yp-lm" label={tri("Lievito di birra in più (facoltativo)", "Extra-Hefe (optional)", "Extra yeast (optional)")} value={f.yp} onChange={(v) => set({ yp: v })} suffix="%" step={0.05} min={0} max={3} w="w-20" />
            </div>
          </div>
        ) : null}
        {f.lv === "nessuno" ? <p className="text-[12.5px] text-muted-foreground">{tri("Per piadine, cracker e pani azzimi.", "Für Fladen, Cracker und ungesäuertes Brot.", "For flatbreads, crackers and unleavened bread.")}</p> : null}
      </Sezione>

      <Sezione testid="calc-tempo" titolo={tri("I tempi", "Die Zeiten", "The times")} sotto={tri("Dall'impasto al forno. Il frigo rallenta tanto: conta circa un ottavo.", "Vom Kneten bis zum Ofen. Der Kühlschrank bremst stark: er zählt etwa ein Achtel.", "From mixing to the oven. The fridge slows things a lot: it counts about an eighth.")}>
        <Cursore testid="calc-T" label={tri("Temperatura dove lievita", "Temperatur beim Gehen", "Temperature where it rises")} value={f.T} onChange={(v) => set({ T: v })} min={10} max={34} mostra={`${fmtN(num(f.T), 0, lang)} °C`} />
        <Scelta small testid="calc-T-chips" value={num(f.T)} onChange={(v) => set({ T: v })} options={[
          { v: 18, l: tri("Casa fresca 18 °C", "Kühl 18 °C", "Cool 18 °C") },
          { v: 22, l: tri("Normale 22 °C", "Normal 22 °C", "Normal 22 °C") },
          { v: 26, l: tri("Calda 26 °C", "Warm 26 °C", "Warm 26 °C") },
        ]} />
        <div className="flex flex-wrap gap-3">
          <Numero testid="calc-h" label={tri("Ore fuori dal frigo", "Stunden außerhalb", "Hours out of the fridge")} value={f.h} onChange={(v) => set({ h: v })} suffix="h" step={0.5} min={0} max={120} w="w-20" />
          <Numero testid="calc-fr" label={<span className="inline-flex items-center gap-1"><Snowflake className="w-3.5 h-3.5" />{tri("Ore in frigo", "Stunden im Kühlschrank", "Hours in the fridge")}</span>} value={f.fr} onChange={(v) => set({ fr: v })} suffix="h" step={1} min={0} max={150} w="w-20" />
        </div>
        {st.pizza ? (
          <div className="space-y-1">
            <p className="text-[12px] text-muted-foreground">{tri("Che forno hai?", "Welcher Ofen?", "Which oven?")}</p>
            <Scelta small testid="calc-fo" value={f.fo} onChange={(v) => set({ fo: v })} options={[
              { v: "casa", l: tri("Forno di casa", "Haushaltsofen", "Home oven") },
              { v: "legna", I: Flame, l: tri("A legna o da pizza (400+ °C)", "Holz- oder Pizzaofen (400+ °C)", "Wood or pizza oven (400+ °C)") },
            ]} />
          </div>
        ) : null}
        <div className="space-y-1.5">
          <p className="text-[12px] text-muted-foreground">{tri("Quando vuoi infornare?", "Wann willst du backen?", "When do you want to bake?")}</p>
          <div className="flex flex-wrap items-center gap-2">
            <Scelta small testid="calc-gg" value={Math.round(num(f.gg))} onChange={(v) => set({ gg: v })} options={[
              { v: 0, l: tri("Oggi", "Heute", "Today") }, { v: 1, l: tri("Domani", "Morgen", "Tomorrow") }, { v: 2, l: tri("Dopodomani", "Übermorgen", "In two days") },
            ]} />
            <input data-testid="calc-at" type="time" value={f.at || "19:00"} onChange={(e) => set({ at: e.target.value || "19:00" })} className="font-mono-data text-[14px] font-bold bg-background border border-border rounded-lg px-2 py-1 outline-none focus:border-primary" />
          </div>
        </div>
        <details className="rounded-xl border border-border bg-background/60 px-3 py-2" data-testid="calc-ddt">
          <summary className="text-[13px] font-semibold cursor-pointer">{tri("L'acqua alla temperatura giusta", "Wasser mit der richtigen Temperatur", "Water at the right temperature")}</summary>
          <div className="flex flex-wrap gap-3 mt-2.5">
            <Numero testid="calc-dd" label={tri("Impasto finito a", "Teig fertig bei", "Dough done at")} value={f.dd} onChange={(v) => set({ dd: v })} suffix="°C" min={15} max={35} w="w-16" />
            <Numero testid="calc-ac" label={tri("Acqua del rubinetto", "Leitungswasser", "Tap water")} value={f.ac} onChange={(v) => set({ ac: v })} suffix="°C" min={1} max={40} w="w-16" />
          </div>
          <div className="mt-2.5 space-y-1">
            <p className="text-[12px] text-muted-foreground">{tri("Come impasti?", "Wie knetest du?", "How do you mix?")}</p>
            <Scelta small testid="calc-mx" value={f.mx} onChange={(v) => set({ mx: v })} options={[
              { v: "mano", l: tri("A mano", "Von Hand", "By hand") }, { v: "planetaria", l: tri("Planetaria", "Küchenmaschine", "Stand mixer") }, { v: "spirale", l: tri("Spirale", "Spiralkneter", "Spiral mixer") },
            ]} />
          </div>
        </details>
      </Sezione>

      <Sezione testid="calc-resto" titolo={tri("Sale e il resto", "Salz und der Rest", "Salt and the rest")}>
        <div className="flex items-end gap-3">
          <div className="flex-1 min-w-0"><Cursore testid="calc-sa-range" label={tri("Sale", "Salz", "Salt")} value={f.sa} onChange={(v) => set({ sa: v })} min={0} max={3.5} step={0.1} mostra={fmtP(num(f.sa), lang)} /></div>
          <Numero testid="calc-sa" label="" value={f.sa} onChange={(v) => set({ sa: v })} suffix="%" step={0.1} min={0} max={6} w="w-20" />
        </div>
        <div className="space-y-2">
          {ex.map((row, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2">
              {row[0] === "x" ? (
                <input data-testid={`calc-ex-nome-${i}`} value={row[2] || ""} onChange={(e) => setEx(i, ["x", row[1], e.target.value.slice(0, 40), row[3]])} placeholder={tri("Nome (es. olive)", "Name (z. B. Oliven)", "Name (e.g. olives)")}
                  className="flex-1 min-w-[8rem] text-[13px] bg-background border border-border rounded-lg px-2 py-1.5 outline-none focus:border-primary" />
              ) : <span className="flex-1 min-w-[8rem] text-[13px] font-semibold text-foreground">{L((extraOf(row[0]) || {}).n, lang)}</span>}
              <input data-testid={`calc-ex-pct-${i}`} type="number" inputMode="decimal" value={row[1]} onChange={(e) => setEx(i, row[0] === "x" ? ["x", e.target.value, row[2], row[3]] : [row[0], e.target.value])}
                className="w-16 font-mono-data text-[14px] font-bold bg-background border border-border rounded-lg px-2 py-1.5 outline-none focus:border-primary" aria-label="%" />
              <span className="text-[12px] text-muted-foreground">%</span>
              {row[0] === "x" ? (
                <label className="inline-flex items-center gap-1 text-[11.5px] text-muted-foreground">{tri("di cui acqua", "davon Wasser", "water in it")}
                  <input type="number" inputMode="decimal" value={row[3]} onChange={(e) => setEx(i, ["x", row[1], row[2], e.target.value])} className="w-14 font-mono-data text-[13px] bg-background border border-border rounded-lg px-1.5 py-1 outline-none focus:border-primary" />%</label>
              ) : null}
              <button type="button" onClick={() => delEx(i)} aria-label={tri("Togli", "Entfernen", "Remove")} className="p-1.5 rounded-lg text-muted-foreground hover:text-mattone"><X className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
        <select data-testid="calc-ex-add" value="" onChange={(e) => addEx(e.target.value)} className={`${selectCls} w-full`}>
          <option value="">{tri("＋ Aggiungi: olio, burro, latte, uova, patata…", "＋ Hinzufügen: Öl, Butter, Milch, Eier, Kartoffel…", "＋ Add: oil, butter, milk, eggs, potato…")}</option>
          {EXTRA.filter((e) => !ex.some((x) => x[0] === e.k)).map((e) => <option key={e.k} value={e.k}>{L(e.n, lang)}</option>)}
          <option value="x">{tri("Altro (scrivilo tu)", "Anderes (selbst eintragen)", "Something else (type it)")}</option>
        </select>
      </Sezione>

      {st.brosel || st.michele ? (
        <Sezione testid="calc-michele" titolo={tri("I tocchi di Michele", "Micheles Handgriffe", "Michele's touches")} sotto={tri("Facoltativi: come li fa lui in bottega.", "Freiwillig: so macht er es in der Backstube.", "Optional: the way he does it in the bakery.")}>
          {st.brosel ? (
            <Interruttore testid="calc-br" on={!!f.br} onChange={(v) => set({ br: v })} label={tri("Il Brösel", "Die Brösel", "The Brösel")}
              sotto={tri("5 % di pane grattugiato secco con il triplo d'acqua, il giorno prima in frigo. Non togli acqua all'impasto: il pane resta morbido più a lungo.", "5 % trockene Semmelbrösel mit dreimal so viel Wasser, am Vortag in den Kühlschrank. Dem Teig kein Wasser abziehen: das Brot bleibt länger frisch.", "5 % dry breadcrumbs with three times the water, the day before in the fridge. Don't take water out of the dough: the bread stays soft longer.")} />
          ) : null}
          {st.michele ? (
            <Interruttore testid="calc-mm" on={!!f.mm} onChange={(v) => set({ mm: v })} label={tri("Olio, aceto di mele e Kokosfett all'1 %", "Je 1 % Olivenöl, Apfelessig und Kokosfett", "1 % each of olive oil, apple vinegar and Kokosfett")}
              sotto={tri("Nei pani senza burro. Il Kokosfett quando l'impasto fa la palla; olio, aceto e sale per ultimi.", "In Broten ohne Butter. Kokosfett, wenn der Teig eine Kugel bildet; Öl, Essig und Salz zum Schluss.", "In breads without butter. Kokosfett when the dough forms a ball; oil, vinegar and salt last.")} />
          ) : null}
          {f.st === "focaccia" ? <Avviso lvl="tip">{tri("Nella focaccia di Michele ci sono già la patata lessa schiacciata e l'olio (un filo va a chiudere l'impasto).", "In Micheles Focaccia sind gekochte Kartoffel und Öl schon drin (ein Schuss Öl kommt ganz zum Schluss).", "Michele's focaccia already has mashed potato and oil (a drizzle goes in at the very end).")}</Avviso> : null}
        </Sezione>
      ) : null}
    </div>
  );
}
