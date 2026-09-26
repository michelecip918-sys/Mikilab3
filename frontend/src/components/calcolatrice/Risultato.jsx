// V127 — La calcolatrice del fornaio: i grammi, i numeri del fornaio, gli avvisi, il piano e le azioni.
import { Save, Share2, Printer, CalendarPlus, NotebookPen, MessageCircle, Snowflake, Thermometer, Sprout } from "lucide-react";
import { mkTri } from "@/i18n/triMaps";
import { L, fmtN, fmtG, fmtP, fmtOre, fmtOra, fmtGiorno } from "@/lib/fornaio";
import { Sezione, Avviso } from "@/components/calcolatrice/ui";

function Riga({ n, g, pct, forte, lang, testid }) {
  return (
    <div data-testid={testid} className={`flex items-baseline gap-2 py-1.5 border-b border-border/60 last:border-b-0 ${forte ? "font-bold" : ""}`}>
      <span className="flex-1 min-w-0 text-[13.5px] text-foreground leading-snug">{n}</span>
      {pct != null ? <span className="text-[11.5px] font-mono-data text-muted-foreground w-16 text-right">{fmtP(pct, lang, pct < 1 ? 2 : 1)}</span> : <span className="w-16" />}
      <span className="text-[15px] font-mono-data font-bold text-foreground w-20 text-right tabular-nums">{fmtG(g, lang)}</span>
    </div>
  );
}

function Tabella({ righe, lang, testid }) {
  return (
    <div data-testid={testid} className="print-table rounded-xl bg-background/60 px-3 py-1">
      {righe.map((r, i) => <Riga key={`${r.k}-${r.fk || r.ek || ""}-${i}`} n={L(r.n, lang)} g={r.g} pct={r.pct} lang={lang} forte={r.k === "pre" || r.k === "lm" || r.k === "brosel"} />)}
    </div>
  );
}

export default function Risultato({ res, pl, lang, nome, onNome, azioni, salvata }) {
  const tri = mkTri(lang);
  const { st } = res;
  const fasi = res.fasi;
  const brosel = fasi.find((x) => x.k === "brosel");
  const pre = fasi.find((x) => x.k === "biga" || x.k === "poolish");
  const main = fasi.find((x) => x.k === "impasto");
  const pz = res.pezzi;
  const giornoDiverso = (a, b) => !b || a.toDateString() !== b.toDateString();
  const lv = res.lievito;
  const lievitoBreve = lv.lv === "lm" || lv.lv === "licoli" ? `${fmtP(res.lm.pct, lang, 0)}` : lv.tot > 0 ? fmtG(lv.tot, lang) : "–";
  const base = process.env.PUBLIC_URL || "";

  return (
    <div className="space-y-3 print-area" data-testid="calc-risultato">
      <div className="print-only" style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, borderBottom: "2px solid #A15621", paddingBottom: 8 }}>
          <img src={`${base}/logo-light-256.png`} alt="MikiLab" style={{ height: 34, width: "auto" }} />
          <div>
            <div style={{ fontWeight: 800, fontSize: 17 }}>{nome || L(st.n, lang)}</div>
            <div style={{ fontSize: 11, color: "#555" }}>{tri("Formula calcolata con la calcolatrice del fornaio di MikiLab · non è una ricetta di Michele", "Mit dem Bäckerrechner von MikiLab berechnet · kein Rezept von Michele", "Worked out with MikiLab's baker's calculator · not one of Michele's recipes")} · {new Date().toLocaleDateString()}</div>
          </div>
        </div>
      </div>

      <div data-testid="calc-bilancia" className="rounded-2xl p-4 border border-black/30 shadow-inner" style={{ background: "#232529", color: "#F3EDE2" }}>
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[12px] opacity-75">{tri("Impasto in tutto", "Teig insgesamt", "Total dough")}</span>
          <span className="text-[12px] opacity-75 text-right">
            {pz && pz.teglia ? tri(`${pz.n} ${pz.n === 1 ? "teglia" : "teglie"} · ${fmtG(pz.g, lang)} l'una`, `${pz.n} ${pz.n === 1 ? "Blech" : "Bleche"} · je ${fmtG(pz.g, lang)}`, `${pz.n} ${pz.n === 1 ? "pan" : "pans"} · ${fmtG(pz.g, lang)} each`)
              : pz && !pz.stima ? `${pz.n} × ${fmtG(pz.g, lang)}`
              : pz && pz.stima ? tri(`≈ ${pz.n} da ${fmtG(pz.g, lang)}`, `≈ ${pz.n} à ${fmtG(pz.g, lang)}`, `≈ ${pz.n} of ${fmtG(pz.g, lang)}`) : ""}
          </span>
        </div>
        <div className="font-mono-data font-bold tabular-nums leading-none mt-1" style={{ color: "#E9A23B", fontSize: "clamp(2.4rem, 11vw, 3.4rem)", textShadow: "0 0 18px rgba(233,162,59,.35)" }} data-testid="calc-totale">
          {fmtN(res.impasto, 0, lang)}<span style={{ fontSize: "0.45em", marginLeft: 6 }}>g</span>
        </div>
        <div className="grid grid-cols-4 gap-1.5 mt-3 text-center">
          {[
            [tri("Farina", "Mehl", "Flour"), fmtG(res.F, lang)],
            [tri("Acqua reale", "Wasser real", "Real water"), fmtP(res.idrReale, lang, 0)],
            [tri("Sale", "Salz", "Salt"), fmtP(res.salePct, lang, 1)],
            [lv.lv === "lm" || lv.lv === "licoli" ? tri("Lievito m.", "Sauerteig", "Starter") : tri("Lievito", "Hefe", "Yeast"), lievitoBreve],
          ].map(([k, v]) => (
            <div key={k} className="rounded-lg py-1.5 px-1" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div className="text-[10.5px] opacity-70 leading-tight">{k}</div>
              <div className="text-[13.5px] font-mono-data font-bold leading-tight mt-0.5">{v}</div>
            </div>
          ))}
        </div>
        <p className="text-[11px] opacity-70 mt-2.5">{tri(`Cotto, circa ${fmtG(res.cotto, lang)} (in forno se ne va il ${fmtN(res.cal, 0, lang)} % d'acqua).`, `Gebacken etwa ${fmtG(res.cotto, lang)} (im Ofen gehen rund ${fmtN(res.cal, 0, lang)} % Wasser verloren).`, `Baked, about ${fmtG(res.cotto, lang)} (about ${fmtN(res.cal, 0, lang)} % water leaves in the oven).`)}</p>
      </div>

      {brosel ? (
        <Sezione testid="calc-fase-brosel" titolo={tri("Il giorno prima: il Brösel", "Am Vortag: die Brösel", "The day before: the Brösel")} sotto={tri("Mescola, copri e metti in frigo fino all'impasto.", "Mischen, abdecken und bis zum Kneten in den Kühlschrank.", "Mix, cover and keep in the fridge until you mix the dough.")}>
          <Tabella righe={brosel.righe} lang={lang} />
        </Sezione>
      ) : null}

      {pre ? (
        <Sezione testid="calc-fase-pre" titolo={pre.k === "biga" ? tri(`Prima: la biga · ${fmtOre(pre.ore, lang)} a ${pre.temp} °C`, `Zuerst: die Biga · ${fmtOre(pre.ore, lang)} bei ${pre.temp} °C`, `First: the biga · ${fmtOre(pre.ore, lang)} at ${pre.temp} °C`) : tri(`Prima: il poolish · ${fmtOre(pre.ore, lang)} a ${pre.temp} °C`, `Zuerst: der Poolish · ${fmtOre(pre.ore, lang)} bei ${pre.temp} °C`, `First: the poolish · ${fmtOre(pre.ore, lang)} at ${pre.temp} °C`)}
          sotto={pre.k === "biga" ? tri("Mescola appena, senza impastare: grumi grossi, non una palla liscia. Coperta.", "Nur kurz mischen, nicht kneten: grobe Krümel, keine glatte Kugel. Abgedeckt.", "Just mix, don't knead: big lumps, not a smooth ball. Covered.") : tri("Mescola con una frusta: una pastella liscia, coperta. È pronto quando è pieno di bolle e comincia appena a cedere al centro.", "Mit dem Schneebesen glatt rühren, abdecken. Fertig, wenn er voller Blasen ist und in der Mitte leicht einfällt.", "Whisk into a smooth batter, covered. It's ready when full of bubbles and just starting to sink in the middle.")}>
          <Tabella righe={pre.righe} lang={lang} />
        </Sezione>
      ) : null}

      {res.lm ? (
        <Sezione testid="calc-fase-lm" titolo={tri("Prima: il lievito madre", "Zuerst: der Sauerteig", "First: the starter")}
          sotto={tri(`Ti servono ${fmtG(res.lm.g, lang)} al picco. Con un rinfresco 1 : 1 a ${fmtN(res.T, 0, lang)} °C ci vogliono circa ${fmtOre(res.lm.picco11, lang)}.`, `Du brauchst ${fmtG(res.lm.g, lang)} aktiv. Mit 1 : 1 aufgefrischt dauert es bei ${fmtN(res.T, 0, lang)} °C etwa ${fmtOre(res.lm.picco11, lang)}.`, `You need ${fmtG(res.lm.g, lang)} at its peak. Fed 1 : 1 at ${fmtN(res.T, 0, lang)} °C it takes about ${fmtOre(res.lm.picco11, lang)}.`)}>
          <button type="button" data-testid="calc-to-lievito" onClick={azioni.lievito} className="no-print inline-flex items-center gap-1.5 text-[12.5px] font-semibold px-3 py-1.5 rounded-full border border-salvia/60 bg-salvia/10 text-foreground active:scale-95">
            <Sprout className="w-3.5 h-3.5" /> {tri("Calcola il rinfresco giusto per l'ora dell'impasto", "Auffrischen passend zur Knetzeit berechnen", "Work out the feed for your mixing time")}
          </button>
        </Sezione>
      ) : null}

      <Sezione testid="calc-fase-impasto" titolo={tri("L'impasto", "Der Hauptteig", "The dough")} sotto={tri("In quest'ordine: acqua e lievito, poi la farina; il sale e i grassi per ultimi.", "In dieser Reihenfolge: Wasser und Hefe, dann das Mehl; Salz und Fett zum Schluss.", "In this order: water and yeast, then the flour; salt and fats last.")}>
        <Tabella righe={main.righe} lang={lang} testid="calc-tabella-impasto" />
      </Sezione>

      {res.spesa.length > 3 && (pre || res.brosel) ? (
        <Sezione testid="calc-spesa" titolo={tri("In tutto (per la spesa)", "Insgesamt (für den Einkauf)", "Altogether (for shopping)")}>
          <Tabella righe={res.spesa.map((x) => ({ ...x, pct: null }))} lang={lang} />
        </Sezione>
      ) : null}

      <Sezione testid="calc-numeri" titolo={tri("I numeri del fornaio", "Die Bäckerzahlen", "The baker's numbers")}>
        <div className="grid grid-cols-2 gap-2">
          {[
            [tri("Idratazione reale", "Reale Hydration", "Real hydration"), fmtP(res.idrReale, lang), tri("tutta l'acqua su tutta la farina", "alles Wasser auf alles Mehl", "all the water over all the flour")],
            [tri("Resa (TA)", "Teigausbeute (TA)", "Dough yield (TA)"), fmtN(res.ta, 0, lang), tri("come la contano in Germania", "wie in Deutschland üblich", "the German way of counting")],
            [tri("Farina prefermentata", "Vorgeteigtes Mehl", "Prefermented flour"), fmtP(res.pff, lang), tri("nella biga, nel poolish o nel lievito", "in Biga, Poolish oder Sauerteig", "in the biga, poolish or starter")],
            [tri("Sale su tutta la farina", "Salz auf alles Mehl", "Salt on all the flour"), fmtP(res.saleTot, lang, 2), tri(`${fmtN(res.saleTot * 10, 0, lang)} g per kg`, `${fmtN(res.saleTot * 10, 0, lang)} g pro kg`, `${fmtN(res.saleTot * 10, 0, lang)} g per kg`)],
          ].map(([k, v, s]) => (
            <div key={k} className="rounded-xl border border-border bg-background/60 px-3 py-2">
              <p className="text-[11.5px] text-muted-foreground leading-tight">{k}</p>
              <p className="text-[17px] font-mono-data font-bold text-foreground leading-tight mt-0.5">{v}</p>
              <p className="text-[10.5px] text-muted-foreground leading-tight mt-0.5">{s}</p>
            </div>
          ))}
        </div>
        <p className="text-[12.5px] text-foreground flex items-start gap-1.5" data-testid="calc-acqua-t">
          <Thermometer className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <span>{res.acqua.T > 45
            ? tri("L'acqua dovrebbe essere oltre 45 °C: meglio scaldare la stanza e aspettare di più.", "Das Wasser müsste über 45 °C haben: lieber den Raum wärmen und länger warten.", "The water would need to be over 45 °C: better warm the room and wait longer.")
            : tri(`Per un impasto a ${fmtN(res.acqua.dd, 0, lang)} °C usa l'acqua a ${fmtN(Math.max(res.acqua.T, 1), 0, lang)} °C.`, `Für einen Teig mit ${fmtN(res.acqua.dd, 0, lang)} °C nimm Wasser mit ${fmtN(Math.max(res.acqua.T, 1), 0, lang)} °C.`, `For a ${fmtN(res.acqua.dd, 0, lang)} °C dough use water at ${fmtN(Math.max(res.acqua.T, 1), 0, lang)} °C.`)}
            {res.acqua.ghiaccio > 1 ? <> <Snowflake className="inline w-3.5 h-3.5 text-primary" /> {tri(`Fredda così dal rubinetto non esce: metti ${fmtG(res.acqua.ghiaccio, lang)} di ghiaccio al posto di altrettanta acqua.`, `So kalt kommt es nicht aus der Leitung: ${fmtG(res.acqua.ghiaccio, lang)} Eis statt gleich viel Wasser.`, `Tap water won't be that cold: use ${fmtG(res.acqua.ghiaccio, lang)} of ice instead of the same amount of water.`)}</> : null}
          </span>
        </p>
      </Sezione>

      <div className="space-y-2" data-testid="calc-avvisi">
        {res.avvisi.map((a, i) => <Avviso key={i} lvl={a.lvl} testid={`calc-avviso-${a.lvl}`}>{a.t(lang)}</Avviso>)}
      </div>

      {pl ? (
        <Sezione testid="calc-piano" titolo={tri("Il piano", "Der Zeitplan", "The schedule")} sotto={tri(`Per infornare ${fmtGiorno(pl.forno, lang)} alle ${fmtOra(pl.forno, lang)}.`, `Zum Backen am ${fmtGiorno(pl.forno, lang)} um ${fmtOra(pl.forno, lang)}.`, `To bake on ${fmtGiorno(pl.forno, lang)} at ${fmtOra(pl.forno, lang)}.`)}>
          {pl.tardi ? <Avviso lvl="warn">{tri(`Per quell'ora dovevi cominciare ${fmtGiorno(pl.inizio, lang)} alle ${fmtOra(pl.inizio, lang)}: sposta l'orario o accorcia i tempi.`, `Dafür hättest du am ${fmtGiorno(pl.inizio, lang)} um ${fmtOra(pl.inizio, lang)} anfangen müssen: Uhrzeit verschieben oder Zeiten kürzen.`, `For that time you should have started on ${fmtGiorno(pl.inizio, lang)} at ${fmtOra(pl.inizio, lang)}: move the time or shorten the times.`)}</Avviso> : null}
          <ol className="relative space-y-2.5 pl-4 border-l-2 border-primary/30">
            {pl.passi.map((p, i) => (
              <li key={i} className="relative">
                <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-primary" />
                {giornoDiverso(p.t, i ? pl.passi[i - 1].t : null) ? <p className="text-[10.5px] font-mono-data uppercase tracking-[0.12em] text-muted-foreground">{fmtGiorno(p.t, lang)}</p> : null}
                <p className="text-[13.5px] text-foreground leading-snug"><span className="font-mono-data font-bold mr-2">{fmtOra(p.t, lang)}</span>{L(p.n, lang)}</p>
              </li>
            ))}
          </ol>
          <button type="button" data-testid="calc-agenda" onClick={azioni.agenda} className="no-print inline-flex items-center gap-1.5 text-[12.5px] font-semibold px-3 py-1.5 rounded-full border border-border bg-background hover:border-primary/60 active:scale-95">
            <CalendarPlus className="w-3.5 h-3.5" /> {tri("Metti tutto in agenda", "Alles in den Kalender", "Add it all to your calendar")}
          </button>
          <p className="text-[11px] text-muted-foreground leading-snug">{tri("Sono orari di partenza: l'impasto si guarda, non si cronometra. Se cresce prima, vai avanti prima.", "Das sind Richtwerte: den Teig anschauen, nicht die Uhr. Geht er schneller, früher weitermachen.", "These are starting points: watch the dough, not the clock. If it rises sooner, move on sooner.")}</p>
        </Sezione>
      ) : null}

      <Sezione testid="calc-azioni" titolo={tri("Tienila", "Behalten", "Keep it")}>
        <div className="flex gap-2 no-print">
          <input data-testid="calc-nome" value={nome || ""} onChange={(e) => onNome(e.target.value.slice(0, 60))} placeholder={tri("Dai un nome (es. «Il pane della domenica»)", "Gib ihr einen Namen (z. B. „Sonntagsbrot“)", "Give it a name (e.g. \"Sunday bread\")")}
            className="flex-1 min-w-0 text-[13.5px] bg-background border border-border rounded-xl px-3 py-2 outline-none focus:border-primary" />
          <button type="button" data-testid="calc-salva" onClick={azioni.salva} className="inline-flex items-center gap-1.5 text-[13px] font-bold px-4 py-2 rounded-xl bg-primary text-primary-foreground active:scale-95">
            <Save className="w-4 h-4" /> {salvata ? tri("Aggiorna", "Aktualisieren", "Update") : tri("Salva", "Speichern", "Save")}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 no-print">
          {[
            ["calc-condividi", Share2, tri("Manda il link", "Link senden", "Send the link"), azioni.condividi],
            ["calc-stampa", Printer, tri("Stampa o PDF", "Drucken oder PDF", "Print or PDF"), azioni.stampa],
            ["calc-forno", NotebookPen, tri("Segna nel mio forno", "In Mein Ofen eintragen", "Log in My oven"), azioni.forno],
            ["calc-sitor", MessageCircle, tri("Chiedi a Sitor", "Sitor fragen", "Ask Sitor"), azioni.sitor],
          ].map(([id, I, t, fn]) => (
            <button key={id} type="button" data-testid={id} onClick={fn} className="inline-flex items-center justify-center gap-1.5 text-[12.5px] font-semibold px-3 py-2 rounded-xl border border-border bg-background hover:border-primary/60 active:scale-95">
              <I className="w-4 h-4 text-primary" /> {t}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground leading-snug">{tri("Le formule restano solo in questo telefono (e nella Valigia, se la fai). Il link porta i numeri dentro l'indirizzo, dopo il #: non passa da nessun server.", "Rezepturen bleiben nur auf diesem Handy (und im Koffer, wenn du ihn packst). Der Link trägt die Zahlen in der Adresse hinter dem #: kein Server sieht sie.", "Formulas stay only on this phone (and in the Suitcase, if you pack it). The link carries the numbers inside the address, after the #: no server sees them.")}</p>
      </Sezione>
    </div>
  );
}
