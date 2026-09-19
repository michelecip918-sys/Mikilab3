import { ChevronLeft, Recycle, MessageCircle } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// STADIO P4 — "Pane di ieri: seconda vita". Sezione anti-spreco. Le ricette collegate
// vengono generate come bozze nascoste da Michele (strumento "Bozza da Sitor").
const REVIVE = [
  { it: "Ravvivalo in forno: bagnalo appena e scaldalo a 180 °C per 5-8 minuti.", de: "Im Ofen auffrischen: kurz befeuchten und bei 180 °C 5-8 Minuten erwärmen.", en: "Revive in the oven: dampen lightly and heat at 180 °C for 5-8 minutes." },
  { it: "Pangrattato: frulla il pane secco e conservalo in un barattolo.", de: "Semmelbrösel: trockenes Brot mahlen und im Glas aufbewahren.", en: "Breadcrumbs: blitz dry bread and keep it in a jar." },
  { it: "Crostini: a cubetti, un filo d'olio, in forno finché dorati.", de: "Croutons: würfeln, etwas Öl, im Ofen bis goldbraun.", en: "Croutons: cube, a little oil, oven until golden." },
];
const DISHES = [
  { n: "Panzanella", d: { it: "Insalata toscana di pane bagnato, pomodoro e cipolla.", de: "Toskanischer Salat aus eingeweichtem Brot, Tomate und Zwiebel.", en: "Tuscan salad of soaked bread, tomato and onion." } },
  { n: "Pappa al pomodoro", d: { it: "Zuppa densa di pane e pomodoro.", de: "Dicke Suppe aus Brot und Tomate.", en: "Thick bread-and-tomato soup." } },
  { n: "Ribollita", d: { it: "Zuppa toscana di pane, fagioli e verdure.", de: "Toskanische Suppe mit Brot, Bohnen und Gemüse.", en: "Tuscan soup with bread, beans and vegetables." } },
  { n: "Semmelknödel", d: { it: "Canederli tedeschi di pane raffermo.", de: "Deutsche Knödel aus altbackenem Brot.", en: "German dumplings from stale bread." } },
  { n: "Zuppa di pane", d: { it: "Brodo caldo versato sul pane.", de: "Heiße Brühe über Brot.", en: "Hot broth poured over bread." } },
  { n: "Pain perdu", d: { it: "Pane inzuppato in uovo e latte, poi rosolato.", de: "Brot in Ei und Milch getränkt, dann gebraten.", en: "Bread soaked in egg and milk, then pan-fried." } },
];

export default function PaneDiIeri({ onBack }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const L = (o) => o[lang] || o.it;

  const askSitor = () => {
    const msg = tri("Ho pane vecchio: cosa posso farci?", "Ich habe altes Brot: was kann ich damit machen?", "I have old bread: what can I make with it?");
    try { window.dispatchEvent(new CustomEvent("mikilab-open-chat")); setTimeout(() => window.dispatchEvent(new CustomEvent("mikilab-chat-prefill", { detail: { text: msg } })), 250); } catch { /* */ }
  };

  return (
    <div data-testid="paneieri-page" className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <button data-testid="paneieri-back" onClick={onBack} className="inline-flex items-center gap-1 text-muted-foreground text-sm font-bold"><ChevronLeft className="w-4 h-4" />{tri("Indietro", "Zurück", "Back")}</button>
      <div className="flex items-center gap-2"><Recycle className="w-6 h-6 text-salvia" /><h1 className="font-display text-2xl font-black text-foreground">{tri("Pane di ieri: seconda vita", "Brot von gestern: zweites Leben", "Yesterday's bread: second life")}</h1></div>

      <div className="rounded-xl bg-salvia/12 border border-salvia/40 p-3">
        <p className="text-[13px] text-foreground">{tri(
          "In Germania si buttano ogni anno circa 1,7 milioni di tonnellate di prodotti da forno, quasi la metà nelle case (studio WWF).",
          "In Deutschland werden jährlich rund 1,7 Millionen Tonnen Backwaren weggeworfen, fast die Hälfte in den Haushalten (WWF-Studie).",
          "In Germany about 1.7 million tonnes of baked goods are thrown away each year, almost half in homes (WWF study).")}</p>
      </div>

      <section>
        <h2 className="font-display text-lg font-bold text-foreground mb-2">{tri("Ravvivare il pane", "Brot auffrischen", "Reviving bread")}</h2>
        <ul className="space-y-1.5">
          {REVIVE.map((r, i) => <li key={i} className="flex items-start gap-2 text-[14px] text-foreground"><span className="text-salvia font-black">•</span>{L(r)}</li>)}
        </ul>
      </section>

      <section>
        <h2 className="font-display text-lg font-bold text-foreground mb-2">{tri("Piatti con il pane raffermo", "Gerichte mit altbackenem Brot", "Dishes with stale bread")}</h2>
        <div className="grid sm:grid-cols-2 gap-2" data-testid="paneieri-dishes">
          {DISHES.map((d) => (
            <div key={d.n} className="rounded-xl border border-border bg-background p-3">
              <p className="font-bold text-foreground text-sm">{d.n}</p>
              <p className="text-[13px] text-foreground/80 mt-0.5">{L(d.d)}</p>
            </div>
          ))}
        </div>
      </section>

      <button data-testid="paneieri-ask-sitor" onClick={askSitor} className="w-full py-3 rounded-xl bg-salvia/20 border border-salvia/50 text-foreground font-bold active:scale-95 inline-flex items-center justify-center gap-2">
        <MessageCircle className="w-4 h-4 text-salvia" />{tri("Ho pane vecchio — chiedi a Sitor", "Ich habe altes Brot — frag Sitor", "I have old bread — ask Sitor")}
      </button>
    </div>
  );
}
