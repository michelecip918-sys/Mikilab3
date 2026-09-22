import { useState, useMemo } from "react";
import { ChevronLeft, FlaskConical, Hand, Thermometer, MessageCircle, RotateCcw } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { award } from "@/lib/medaglie"; // V90

// V84 — "Il banco delle prove": i tre test che un panettiere fa con le mani, resi interattivi,
// più "Il tempo di oggi" (quanto cambia la lievitazione con la temperatura di casa).
// Tutto nel browser: nessuna chiamata al server, nessun dato salvato.

const TESTS = {
  dito: {
    title: { it: "Prova del dito", de: "Fingerprobe", en: "Poke test" },
    when: { it: "Per capire se un impasto lievitato è pronto da infornare.", de: "Um zu erkennen, ob ein gegangener Teig ofenbereit ist.", en: "To tell whether a proofed dough is ready for the oven." },
    how: { it: "Infarina appena un dito e premi l'impasto per 1-2 cm, poi togli il dito e guarda cosa fa la fossetta.", de: "Einen Finger leicht bemehlen, 1-2 cm in den Teig drücken, Finger wegnehmen und die Delle beobachten.", en: "Lightly flour a finger, press 1-2 cm into the dough, remove it and watch the dimple." },
    options: [
      { k: "subito", label: { it: "Torna su subito, la fossetta sparisce", de: "Springt sofort zurück, Delle verschwindet", en: "Springs back at once, dimple disappears" },
        verdict: { it: "Non è ancora pronto.", de: "Noch nicht fertig.", en: "Not ready yet." }, tone: "wait",
        tip: { it: "Ha ancora forza da spendere. Coprilo e aspetta: riprova tra 15-20 minuti (di più se in casa fa freddo).", de: "Er hat noch Kraft. Abdecken und warten: in 15-20 Minuten erneut prüfen (länger, wenn es kalt ist).", en: "It still has energy to spend. Cover it and wait: test again in 15-20 minutes (longer if the room is cold)." } },
      { k: "lento", label: { it: "Torna su piano e resta una piccola fossetta", de: "Kommt langsam zurück, kleine Delle bleibt", en: "Springs back slowly, a small dimple remains" },
        verdict: { it: "È pronto: inforna.", de: "Fertig: ab in den Ofen.", en: "It's ready: bake." }, tone: "ok",
        tip: { it: "Questo è il momento giusto. Forno già caldo, taglio deciso se la ricetta lo prevede, e dentro.", de: "Jetzt ist der richtige Moment. Ofen schon heiß, beherzt einschneiden, wenn das Rezept es vorsieht, und rein.", en: "This is the moment. Oven already hot, a confident score if the recipe calls for it, and in it goes." } },
      { k: "resta", label: { it: "Non torna su, si affloscia o si sgonfia", de: "Kommt nicht zurück, fällt zusammen", en: "Doesn't spring back, deflates" },
        verdict: { it: "È andato oltre.", de: "Er ist übergegangen.", en: "It's over-proofed." }, tone: "warn",
        tip: { it: "Per pane e panini semplici: sgonfia con delicatezza, ridai la forma e fai una lievitazione più corta, tenendolo d'occhio. Per panettone e grandi lievitati non si rimedia: inforna subito e prendi nota per la prossima volta.", de: "Bei einfachem Brot und Brötchen: sanft entgasen, neu formen und kürzer gehen lassen, dabei gut beobachten. Bei Panettone und großen Hefeteigen lässt es sich nicht retten: sofort backen und für das nächste Mal notieren.", en: "For simple breads and rolls: gently deflate, reshape and proof again for a shorter time, watching closely. For panettone and big enriched doughs there's no fix: bake now and take note for next time." } },
    ],
  },
  finestra: {
    title: { it: "Prova della finestra", de: "Fensterprobe", en: "Windowpane test" },
    when: { it: "Per capire se il glutine è sviluppato e l'impasto è impastato abbastanza.", de: "Um zu erkennen, ob das Gluten entwickelt und der Teig genug geknetet ist.", en: "To tell whether the gluten is developed and the dough is kneaded enough." },
    how: { it: "Stacca una noce di impasto e tirala piano con le dita, allargandola come una finestra controluce.", de: "Ein walnussgroßes Stück abnehmen und langsam mit den Fingern gegen das Licht auseinanderziehen.", en: "Take a walnut of dough and slowly stretch it with your fingers, opening it like a window against the light." },
    options: [
      { k: "strappa", label: { it: "Si strappa subito, resta spesso", de: "Reißt sofort, bleibt dick", en: "Tears right away, stays thick" },
        verdict: { it: "Il glutine non è ancora formato.", de: "Das Gluten ist noch nicht entwickelt.", en: "The gluten isn't developed yet." }, tone: "wait",
        tip: { it: "Continua a impastare, oppure lascialo riposare coperto 15-20 minuti e dai una serie di pieghe: il riposo lavora al posto tuo.", de: "Weiterkneten, oder 15-20 Minuten abgedeckt ruhen lassen und eine Runde Falten geben: die Ruhe arbeitet für dich.", en: "Keep kneading, or let it rest covered for 15-20 minutes and give a round of folds: the rest does the work for you." } },
      { k: "velo", label: { it: "Si tira sottile, quasi trasparente, senza rompersi", de: "Lässt sich dünn, fast durchsichtig ziehen, ohne zu reißen", en: "Stretches thin, almost see-through, without tearing" },
        verdict: { it: "Impasto pronto.", de: "Teig fertig.", en: "Dough is ready." }, tone: "ok",
        tip: { it: "Ottimo: fermati qui, impastare di più lo rovina. Passa alla prima lievitazione come dice la ricetta.", de: "Sehr gut: hier aufhören, mehr Kneten schadet. Weiter zur ersten Gare, wie das Rezept sagt.", en: "Great: stop here, more kneading would harm it. Move on to the first rise as the recipe says." } },
      { k: "colla", label: { it: "È appiccicoso, si allunga a fili e si rompe", de: "Klebrig, zieht Fäden und reißt", en: "Sticky, stretches into strings and breaks" },
        verdict: { it: "È troppo caldo o ha lavorato troppo.", de: "Zu warm oder überknetet.", en: "Too warm or over-worked." }, tone: "warn",
        tip: { it: "Fermati. Copri e metti in frigo 20-30 minuti, poi riprova la finestra: spesso torna in sé. Non aggiungere farina: cambieresti la ricetta.", de: "Aufhören. Abdecken, 20-30 Minuten in den Kühlschrank, dann die Fensterprobe wiederholen: oft erholt er sich. Kein Mehl zugeben: das würde das Rezept verändern.", en: "Stop. Cover and refrigerate 20-30 minutes, then test again: it often recovers. Don't add flour: you'd change the recipe." } },
    ],
  },
  galleggia: {
    title: { it: "Prova del galleggiamento", de: "Schwimmprobe", en: "Float test" },
    when: { it: "Per capire se il lievito madre (o la biga/poolish) è al massimo della forza.", de: "Um zu erkennen, ob der Sauerteig (oder Biga/Poolish) auf dem Höhepunkt ist.", en: "To tell whether the sourdough starter (or biga/poolish) is at peak strength." },
    how: { it: "Metti un cucchiaino di lievito in un bicchiere d'acqua a temperatura ambiente, senza mescolare.", de: "Einen Teelöffel Anstellgut in ein Glas Wasser mit Raumtemperatur geben, nicht umrühren.", en: "Drop a teaspoon of starter into a glass of room-temperature water, don't stir." },
    options: [
      { k: "su", label: { it: "Galleggia", de: "Schwimmt", en: "Floats" },
        verdict: { it: "È pieno di gas: usalo ora.", de: "Voller Gas: jetzt verwenden.", en: "Full of gas: use it now." }, tone: "ok",
        tip: { it: "Questo è il momento migliore per impastare. Se aspetti ancora, la forza scende.", de: "Der beste Moment zum Kneten. Wartest du länger, lässt die Kraft nach.", en: "Best moment to mix. If you wait longer, the strength drops." } },
      { k: "giu", label: { it: "Affonda", de: "Sinkt", en: "Sinks" },
        verdict: { it: "Non è ancora al massimo (o è già oltre).", de: "Noch nicht am Höhepunkt (oder schon darüber).", en: "Not at peak yet (or already past it)." }, tone: "wait",
        tip: { it: "Se lo hai rinfrescato da poco, aspetta 1-2 ore e riprova. Se sono passate molte ore ed è sgonfio, rinfrescalo di nuovo. Nota: il licoli (lievito liquido) e i lieviti molto idratati possono affondare anche quando sono pronti: lì fidati dei tempi e delle bolle.", de: "Wenn gerade gefüttert: 1-2 Stunden warten und erneut prüfen. Wenn viele Stunden vergangen sind und er zusammengefallen ist: neu füttern. Hinweis: Lievito liquido (Licoli) und sehr flüssige Ansätze können sinken, obwohl sie fertig sind: dort auf Zeiten und Blasen vertrauen.", en: "If just fed, wait 1-2 hours and retry. If many hours have passed and it has collapsed, feed it again. Note: liquid starters (licoli) and very wet ones can sink even when ready: there, trust timing and bubbles." } },
    ],
  },
};

const TONE = { ok: "border-salvia/50 bg-salvia/12", wait: "border-ambra/50 bg-ambra/12", warn: "border-mattone/50 bg-mattone/10" };

// Stima orientativa: la lievitazione va circa il doppio più veloce ogni +9 °C (e il doppio più lenta ogni −9 °C), riferita ai 24 °C delle ricette.
function factorFor(t) { return Math.pow(2, (24 - t) / 9); }
function fmtMin(m) {
  const h = Math.floor(m / 60), r = Math.round(m % 60);
  if (h <= 0) return `${r} min`;
  return r ? `${h} h ${r} min` : `${h} h`;
}

export default function BancoProve({ onBack }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const L = (o) => (o && (o[lang] || o.it)) || "";
  const [test, setTest] = useState("dito");
  const [poked, setPoked] = useState(false);
  const [pick, setPick] = useState(null);
  const [temp, setTemp] = useState(22);
  const [baseMin, setBaseMin] = useState(120);

  const T = TESTS[test];
  const chosen = useMemo(() => T.options.find((o) => o.k === pick) || null, [T, pick]);
  const factor = factorFor(temp);
  const est = Math.round(baseMin * factor);

  const choose = (k) => { setTest(k); setPoked(false); setPick(null); };
  const askSitor = (text) => {
    try { window.dispatchEvent(new CustomEvent("mikilab-open-chat")); setTimeout(() => window.dispatchEvent(new CustomEvent("mikilab-chat-prefill", { detail: { text } })), 250); } catch { /* */ }
  };

  return (
    <div data-testid="banco-page" className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <style>{`
        @keyframes bp-poke{0%{transform:translateY(0)}35%{transform:translateY(14px)}100%{transform:translateY(0)}}
        .bp-finger{animation:bp-poke .9s ease-in-out 1}
        @media (prefers-reduced-motion:reduce){.bp-finger{animation:none}}
      `}</style>
      <button data-testid="banco-back" onClick={onBack} className="inline-flex items-center gap-1 text-muted-foreground text-sm font-bold"><ChevronLeft className="w-4 h-4" />{tri("Indietro", "Zurück", "Back")}</button>
      <div className="flex items-center gap-2">
        <FlaskConical className="w-6 h-6 text-primary" />
        <h1 className="font-display text-2xl font-black text-foreground">{tri("Il banco delle prove", "Die Prüfbank", "The test bench")}</h1>
      </div>
      <p className="text-sm text-muted-foreground">{tri("Le prove che un panettiere fa con le mani, spiegate una alla volta. Tu fai la prova, dici cosa vedi, e ti dico cosa fare.", "Die Proben, die ein Bäcker mit den Händen macht, eine nach der anderen erklärt. Du machst die Probe, sagst, was du siehst, und ich sage dir, was zu tun ist.", "The tests a baker does by hand, explained one at a time. You do the test, say what you see, and I tell you what to do.")}</p>

      <div className="flex gap-2 flex-wrap" data-testid="banco-tabs">
        {Object.keys(TESTS).map((k) => (
          <button key={k} data-testid={`banco-tab-${k}`} onClick={() => choose(k)}
            className={`px-3.5 py-2 rounded-full text-sm font-bold border transition-all active:scale-95 ${test === k ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-foreground hover:border-primary/60"}`}>
            {L(TESTS[k].title)}
          </button>
        ))}
      </div>

      <section className="rounded-2xl border border-border bg-background p-4 space-y-3">
        <p className="text-[13px] text-foreground/80">{L(T.when)}</p>
        <p className="text-sm font-bold text-foreground">{L(T.how)}</p>

        {test === "dito" && (
          <button data-testid="banco-dough" onClick={() => setPoked(true)} className="w-full flex justify-center py-2 active:scale-[0.98] transition-transform" aria-label={tri("Premi l'impasto", "Teig drücken", "Poke the dough")}>
            <svg viewBox="0 0 240 120" width="240" height="120" aria-hidden>
              <ellipse cx="120" cy="100" rx="105" ry="10" fill="hsl(var(--muted))" />
              <path d="M30 100 C30 55, 70 35, 120 35 C170 35, 210 55, 210 100 Z" fill="#D9A566" stroke="#A15621" strokeWidth="2" />
              {poked && <ellipse cx="120" cy="52" rx="14" ry="6" fill="#B8823E" />}
              <g className={poked ? "bp-finger" : ""} transform="translate(108 0)">
                <rect x="0" y="4" width="24" height="42" rx="12" fill="#E8C2A0" stroke="#A15621" strokeWidth="1.5" />
                <rect x="4" y="2" width="16" height="10" rx="5" fill="#F3D9C0" />
              </g>
              {!poked && <text x="120" y="118" textAnchor="middle" fontSize="11" fill="hsl(var(--muted-foreground))">{tri("tocca per premere", "tippen zum Drücken", "tap to poke")}</text>}
            </svg>
          </button>
        )}

        <p className="text-[13px] font-bold text-foreground">{tri("Cosa vedi?", "Was siehst du?", "What do you see?")}</p>
        <div className="grid gap-2" data-testid="banco-options">
          {T.options.map((o) => (
            <button key={o.k} data-testid={`banco-opt-${o.k}`} onClick={() => { setPick(o.k); award("prova_dito"); }}
              className={`text-left px-3.5 py-2.5 rounded-xl border text-sm font-bold transition-all active:scale-[0.98] ${pick === o.k ? "border-primary bg-primary/10 text-foreground" : "border-border bg-background text-foreground hover:border-primary/60"}`}>
              {L(o.label)}
            </button>
          ))}
        </div>

        {chosen && (
          <div data-testid="banco-verdict" className={`rounded-xl border p-3.5 ${TONE[chosen.tone]}`}>
            <p className="font-black text-foreground">{L(chosen.verdict)}</p>
            <p className="text-[13px] text-foreground/90 mt-1">{L(chosen.tip)}</p>
            <div className="flex gap-2 mt-3 flex-wrap">
              <button onClick={() => { setPick(null); setPoked(false); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-bold text-foreground active:scale-95"><RotateCcw className="w-3.5 h-3.5" />{tri("Rifai la prova", "Probe wiederholen", "Redo the test")}</button>
              <button onClick={() => askSitor(`${L(T.title)}: ${L(chosen.label)}. ${tri("Cosa faccio adesso?", "Was mache ich jetzt?", "What do I do now?")}`)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/15 border border-primary/40 text-xs font-bold text-foreground active:scale-95"><MessageCircle className="w-3.5 h-3.5 text-primary" />{tri("Chiedi a Sitor", "Frag Sitor", "Ask Sitor")}</button>
            </div>
          </div>
        )}
      </section>

      {/* Il tempo di oggi */}
      <section data-testid="banco-tempo" className="rounded-2xl border border-border bg-background p-4 space-y-3">
        <div className="flex items-center gap-2"><Thermometer className="w-5 h-5 text-primary" /><h2 className="font-display text-lg font-bold text-foreground">{tri("Il tempo di oggi", "Das Wetter von heute", "Today's weather")}</h2></div>
        <p className="text-[13px] text-foreground/80">{tri("Le ricette danno i tempi per una cucina a circa 24 °C. Se da te fa più freddo o più caldo, la lievitazione cambia. Dimmi quanti gradi hai e il tempo scritto nella ricetta.", "Die Rezepte geben die Zeiten für eine Küche mit etwa 24 °C an. Ist es bei dir kälter oder wärmer, ändert sich die Gare. Sag mir deine Gradzahl und die Zeit aus dem Rezept.", "Recipes give times for a kitchen at about 24 °C. If yours is colder or warmer, the rise changes. Tell me your degrees and the time written in the recipe.")}</p>
        <label className="block text-sm font-bold text-foreground">
          {tri("In cucina ci sono", "In der Küche sind es", "My kitchen is at")} <span className="text-primary font-mono-data">{temp} °C</span>
          <input data-testid="banco-temp" type="range" min="14" max="34" step="1" value={temp} onChange={(e) => setTemp(Number(e.target.value))} className="w-full mt-1 accent-[#A15621]" />
        </label>
        <label className="block text-sm font-bold text-foreground">
          {tri("La ricetta dice", "Das Rezept sagt", "The recipe says")} <span className="text-primary font-mono-data">{fmtMin(baseMin)}</span>
          <input data-testid="banco-base" type="range" min="30" max="1440" step="15" value={baseMin} onChange={(e) => setBaseMin(Number(e.target.value))} className="w-full mt-1 accent-[#A15621]" />
        </label>
        <div data-testid="banco-estimate" className="rounded-xl border border-primary/40 bg-primary/10 p-3.5">
          <p className="text-[12px] text-muted-foreground">{tri("Oggi, da te, conta circa", "Heute, bei dir, rechne mit etwa", "Today, at your place, expect about")}</p>
          <p className="font-display text-2xl font-black text-foreground">{fmtMin(est)}</p>
          <p className="text-[12px] text-foreground/80 mt-1">
            {temp < 22 && tri("Fa fresco: l'impasto va piano. Un posto tiepido (forno spento con la luce accesa) lo aiuta.", "Es ist kühl: der Teig geht langsam. Ein lauwarmer Platz (Ofen aus, Licht an) hilft.", "It's cool: the dough goes slowly. A warm spot (oven off, light on) helps.")}
            {temp >= 22 && temp <= 26 && tri("Temperatura giusta: segui i tempi della ricetta.", "Gute Temperatur: halte dich an die Rezeptzeiten.", "Good temperature: follow the recipe times.")}
            {temp > 26 && tri("Fa caldo: l'impasto corre. Controlla prima del tempo e usa la prova del dito, oppure rallenta in frigo.", "Es ist warm: der Teig läuft davon. Früher prüfen, Fingerprobe machen oder im Kühlschrank bremsen.", "It's warm: the dough runs ahead. Check early, use the poke test, or slow it down in the fridge.")}
          </p>
        </div>
        <p className="text-[11px] text-muted-foreground">{tri("È una stima per orientarti (circa il doppio più veloce ogni +9 °C): le prove con le mani valgono più dell'orologio.", "Eine Schätzung zur Orientierung (etwa doppelt so schnell je +9 °C): die Proben mit den Händen zählen mehr als die Uhr.", "It's an estimate to guide you (roughly twice as fast per +9 °C): the hand tests matter more than the clock.")}</p>
        <button onClick={() => askSitor(tri(`In cucina ho ${temp} °C e la ricetta dice ${fmtMin(baseMin)} di lievitazione. Come mi regolo?`, `In meiner Küche sind es ${temp} °C und das Rezept sagt ${fmtMin(baseMin)} Gare. Wie gehe ich vor?`, `My kitchen is at ${temp} °C and the recipe says ${fmtMin(baseMin)} of rise. How should I adjust?`))}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/15 border border-primary/40 text-xs font-bold text-foreground active:scale-95"><MessageCircle className="w-3.5 h-3.5 text-primary" />{tri("Chiedi a Sitor", "Frag Sitor", "Ask Sitor")}</button>
      </section>

      <p className="text-[11px] text-muted-foreground flex items-center gap-1.5"><Hand className="w-3.5 h-3.5" />{tri("Nessun dato viene salvato o inviato: è un banco di prova, non un quaderno.", "Nichts wird gespeichert oder gesendet: eine Prüfbank, kein Heft.", "Nothing is saved or sent: it's a test bench, not a notebook.")}</p>
    </div>
  );
}
