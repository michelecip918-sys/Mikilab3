import { useState } from "react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// V90 — SITOR DICE: la nuvoletta sotto Sitor in Home. Una frase da fornaio, un po' seria un po' no;
// tocca per la prossima. Bozze di Sitor (IA): Michele può aggiungere le sue.
const FRASI = [
  ["Il pane non ha fretta. Tu sì, ma lui no.", "Das Brot hat keine Eile. Du schon, es nicht.", "Bread is in no hurry. You are, it isn't."],
  ["La farina sul pavimento è il segno che si è lavorato.", "Mehl auf dem Boden heißt: hier wurde gearbeitet.", "Flour on the floor means work got done."],
  ["Se l'impasto ti si attacca alle mani, è lui che ti vuole bene.", "Wenn der Teig an den Händen klebt, hat er dich gern.", "If the dough sticks to your hands, it likes you."],
  ["Un forno caldo perdona molti errori. Un forno tiepido nessuno.", "Ein heißer Ofen verzeiht viele Fehler. Ein lauer keinen.", "A hot oven forgives many mistakes. A lukewarm one, none."],
  ["Il lievito madre è come un gatto: decide lui quando è pronto.", "Sauerteig ist wie eine Katze: er entscheidet, wann er so weit ist.", "A sourdough starter is like a cat: it decides when it's ready."],
  ["Il pane migliore è quello che hai regalato.", "Das beste Brot ist das, das du verschenkt hast.", "The best bread is the one you gave away."],
  ["Se non sai cosa fare, dai una piega e aspetta venti minuti. Vale anche nella vita.", "Wenn du nicht weiterweißt: einmal falten und zwanzig Minuten warten. Gilt auch im Leben.", "If you don't know what to do, give it a fold and wait twenty minutes. Works in life too."],
  ["La crosta è la parte che racconta la storia.", "Die Kruste ist der Teil, der die Geschichte erzählt.", "The crust is the part that tells the story."],
  ["Michele alle 4 del mattino ha già le mani in pasta. Tu puoi cominciare alle 10.", "Michele hat um 4 Uhr früh schon Teig an den Händen. Du darfst um 10 anfangen.", "At 4 a.m. Michele already has dough on his hands. You may start at 10."],
  ["Il primo pane brutto vale più di dieci foto belle.", "Das erste hässliche Brot ist mehr wert als zehn schöne Fotos.", "The first ugly loaf is worth more than ten pretty photos."],
  ["Il sale: poco, ma mai dimenticato. Chiedi a chi l'ha dimenticato.", "Salz: wenig, aber nie vergessen. Frag die, die es vergessen haben.", "Salt: a little, but never forgotten. Ask those who forgot."],
  ["Il pane parla. Basta batterci sotto.", "Das Brot spricht. Man muss nur unten klopfen.", "Bread speaks. Just knock on the bottom."],
  ["Le bolle sono il respiro dell'impasto. Non schiacciarle tutte.", "Blasen sind der Atem des Teigs. Drück nicht alle weg.", "Bubbles are the dough's breath. Don't squash them all."],
  ["Un cucchiaino di pazienza vale un chilo di lievito.", "Ein Teelöffel Geduld ist ein Kilo Hefe wert.", "A teaspoon of patience is worth a kilo of yeast."],
  ["Sono un'intelligenza artificiale, ma il pane l'ha fatto Michele. Io guardo e imparo, come te.", "Ich bin eine künstliche Intelligenz, aber das Brot hat Michele gebacken. Ich schaue zu und lerne, wie du.", "I'm an artificial intelligence, but Michele made the bread. I watch and learn, like you."],
  ["Hai comprato la farina buona? Allora sei già a metà.", "Gutes Mehl gekauft? Dann bist du schon halb fertig.", "Bought good flour? Then you're halfway there."],
  ["Il pane di ieri non è vecchio. È esperto.", "Das Brot von gestern ist nicht alt. Es ist erfahren.", "Yesterday's bread isn't old. It's experienced."],
  ["Se il forno scalda più a destra, gira la teglia. Se scalda più a sinistra, girala lo stesso.", "Heizt der Ofen rechts mehr, dreh das Blech. Heizt er links mehr, dreh es trotzdem.", "If the oven runs hot on the right, turn the tray. If on the left, turn it anyway."],
];

export default function SitorDice() {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const [i, setI] = useState(() => Math.floor(Math.random() * FRASI.length));
  return (
    <button data-testid="sitor-dice" onClick={() => setI((v) => (v + 1 + Math.floor(Math.random() * (FRASI.length - 1))) % FRASI.length)}
      className="relative mt-3 text-left w-full sm:w-auto max-w-md rounded-2xl rounded-tl-sm border border-primary/30 bg-primary/8 px-4 py-2.5 active:scale-[0.99] transition-all" title={tri("Tocca per un'altra", "Tippen für eine andere", "Tap for another")}>
      <p className="text-[13px] text-foreground/90 italic leading-snug">«{tri(...FRASI[i])}»</p>
      <p className="text-[10px] text-muted-foreground mt-1">{tri("Sitor dice · tocca per un'altra", "Sitor sagt · tippen für eine andere", "Sitor says · tap for another")}</p>
    </button>
  );
}
