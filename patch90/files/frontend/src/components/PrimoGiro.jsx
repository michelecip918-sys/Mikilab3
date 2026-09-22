import { useState } from "react";
import { X, ChevronRight, ChevronLeft, Sparkles, GraduationCap, Headphones, MessageCircle, Settings, ZoomIn, Check } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { useBackClose } from "@/lib/backNav";
import { award } from "@/lib/medaglie"; // V90

// V85 — "Il primo giro con Sitor": alla prima visita Sitor accompagna la persona in 7 passi
// (cos'è il sito, da dove si comincia, Casa/Laboratorio, voce con le mani in pasta, chat,
// strumenti, come vedere meglio). Si riapre da Home e da Strumenti. Solo localStorage.

export const GIRO_KEY = "mikilab_giro_visto";
export const BIG_KEY = "mikilab_modo_grande";
const PUB = process.env.PUBLIC_URL;

export function isBigMode() { try { return localStorage.getItem(BIG_KEY) === "1"; } catch { return false; } }
export function applyBigMode(on) {
  try { document.documentElement.classList.toggle("ml-big", !!on); localStorage.setItem(BIG_KEY, on ? "1" : "0"); } catch { /* */ }
}

export default function PrimoGiro({ onClose, onNav }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  useBackClose(true, onClose);
  const [i, setI] = useState(0);
  const [big, setBig] = useState(isBigMode);

  const finish = () => { try { localStorage.setItem(GIRO_KEY, "1"); } catch { /* */ } if (i === steps.length - 1) award("primo_giro"); onClose(); };
  const go = (route) => { finish(); onNav && onNav(route); };

  const steps = [
    { Icon: Sparkles, t: tri("Ciao, sono Sitor.", "Hallo, ich bin Sitor.", "Hi, I'm Sitor."),
      p: tri("Sono l'avatar IA di Michele, panettiere a Stoccarda: un'intelligenza artificiale, non una persona. MikiLab è il suo ricettario gratuito: pane, pizza, focacce, lievitati e dolci, spiegati per farli a casa. Ti faccio fare un giro in un minuto.", "Ich bin Micheles KI-Avatar, Bäcker in Stuttgart: eine künstliche Intelligenz, keine Person. MikiLab ist sein kostenloses Rezeptbuch: Brot, Pizza, Focaccia, Hefegebäck und Süßes, erklärt fürs Backen zu Hause. Ich zeige dir in einer Minute alles.", "I'm the AI avatar of Michele, a baker in Stuttgart: an artificial intelligence, not a person. MikiLab is his free recipe book: bread, pizza, focaccia, leavened bakes and sweets, explained for baking at home. Let me show you around in a minute.") },
    { Icon: GraduationCap, t: tri("Prima dimmi chi sei.", "Sag mir zuerst, wer du bist.", "First tell me who you are."),
      p: tri("In Home scegli «Sto imparando» o «So già panificare». Non è solo una scritta: cambia la persona, il luogo e gli attrezzi. Casa vuol dire forno di casa e mani; Laboratorio vuol dire impastatrice, quantità da negozio e tempi da professionista. Lo puoi cambiare su ogni ricetta.", "Auf der Startseite wählst du «Ich lerne noch» oder «Ich kann schon backen». Das ist nicht nur ein Etikett: es ändert Person, Ort und Geräte. Zuhause heißt Hausofen und Hände; Backstube heißt Knetmaschine, Ladenmengen und Profi-Zeiten. Bei jedem Rezept änderbar.", "On the Home page choose «I'm learning» or «I already know how to bake». It's not just a label: it changes the person, the place and the tools. Home means a home oven and your hands; Bakery means a mixer, shop quantities and pro timings. You can change it on every recipe.") },
    { Icon: Sparkles, t: tri("Comincia da qui.", "Fang hier an.", "Start here."),
      p: tri("Cinque panini facili, in ordine di difficoltà, con lievito di birra e impasto diretto. Fai il primo e capisci già come lavoro: ogni ricetta ha lo schema disegnato, il corso passo per passo e la prova per capire quando è pronto.", "Fünf einfache Brötchen, nach Schwierigkeit geordnet, mit Hefe und direkter Führung. Back das erste und du verstehst schon, wie ich arbeite: jedes Rezept hat das gezeichnete Schema, den Kurs Schritt für Schritt und die Probe, um zu erkennen, wann es fertig ist.", "Five easy rolls, in order of difficulty, with yeast and a direct dough. Bake the first one and you'll already see how I work: every recipe has a drawn scheme, a step-by-step course and the test to tell when it's ready."), go: "percorso", gl: tri("Vai alle 5 ricette", "Zu den 5 Rezepten", "Go to the 5 recipes") },
    { Icon: Headphones, t: tri("Con le mani in pasta non si tocca lo schermo.", "Mit Teig an den Händen berührt man kein Display.", "With dough on your hands, you don't touch the screen."),
      p: tri("Dentro una ricetta premi «Cucina con Sitor»: leggo io i passi a voce, uno alla volta, e aspetto te. Puoi dire «avanti» o «ripeti». Con le cuffie funziona anche in un'altra stanza. La voce è quella sintetica del tuo telefono, non quella di Michele.", "In einem Rezept drückst du «Koch mit Sitor»: ich lese die Schritte vor, einen nach dem anderen, und warte auf dich. Du kannst «weiter» oder «nochmal» sagen. Mit Kopfhörern klappt es auch im Nebenzimmer. Die Stimme ist die synthetische deines Handys, nicht Micheles.", "Inside a recipe press «Cook with Sitor»: I read the steps aloud, one at a time, and wait for you. You can say «next» or «repeat». With headphones it works from another room too. The voice is your phone's synthetic one, not Michele's.") },
    { Icon: MessageCircle, t: tri("Il pulsante in basso a destra sono io.", "Der Knopf unten rechts bin ich.", "The button at the bottom right is me."),
      p: tri("Qualunque dubbio, a qualunque ora: «perché non è cresciuto?», «posso usare un'altra farina?», «cosa faccio con quello che ho in frigo?». Rispondo in base alle ricette di Michele. Non scrivermi dati personali: non mi servono e non li tengo.", "Jede Frage, zu jeder Zeit: «warum ist er nicht aufgegangen?», «geht ein anderes Mehl?», «was mache ich mit dem, was im Kühlschrank ist?». Ich antworte auf Basis von Micheles Rezepten. Schreib mir keine persönlichen Daten: ich brauche sie nicht und behalte sie nicht.", "Any doubt, any hour: «why didn't it rise?», «can I use another flour?», «what can I make with what's in the fridge?». I answer from Michele's recipes. Don't write me personal data: I don't need it and I don't keep it.") },
    { Icon: Settings, t: tri("Gli strumenti che nessun altro ricettario ha.", "Werkzeuge, die kein anderes Rezeptbuch hat.", "Tools no other recipe book has."),
      p: tri("Il banco delle prove (dito, finestra, galleggiamento), la mappa del tuo forno, il lievito madre da tenere come un figlio, il quaderno con le foto dei tuoi pani, il calendario del pane, il pane di ieri. Tutto in «Strumenti», tutto salvato solo sul tuo telefono.", "Die Prüfbank (Finger, Fenster, Schwimmprobe), die Karte deines Ofens, der Sauerteig wie ein Kind, das Heft mit den Fotos deiner Brote, der Brotkalender, das Brot von gestern. Alles unter «Werkzeuge», alles nur auf deinem Handy gespeichert.", "The test bench (poke, windowpane, float), the map of your oven, the sourdough starter kept like a child, the notebook with photos of your bakes, the bread calendar, yesterday's bread. All under «Tools», all saved only on your phone."), go: "strumenti", gl: tri("Apri gli Strumenti", "Werkzeuge öffnen", "Open the Tools") },
    { Icon: ZoomIn, t: tri("Come vedi meglio?", "Wie siehst du besser?", "How do you see best?"),
      p: tri("Se le scritte ti sembrano piccole, accendi il Modo grande: tutto si ingrandisce, anche i pulsanti. Lo trovi sempre in Strumenti. In alto a destra puoi anche scegliere chiaro o scuro e la lingua.", "Wenn dir die Schrift zu klein ist, schalte den Großmodus an: alles wird größer, auch die Knöpfe. Du findest ihn immer unter Werkzeuge. Oben rechts wählst du außerdem hell oder dunkel und die Sprache.", "If the text looks small, turn on Big mode: everything gets bigger, buttons too. You'll always find it in Tools. Top right you can also pick light or dark and the language."), bigToggle: true },
  ];
  const s = steps[i];
  const last = i === steps.length - 1;

  return (
    <div data-testid="primo-giro" role="dialog" aria-modal="true" className="fixed inset-0 z-[85] flex items-end sm:items-center justify-center p-3 sm:p-4 bg-[#1F2124]/75 backdrop-blur-sm" onClick={finish}>
      <div className="relative w-full max-w-md rounded-3xl border border-border bg-background text-foreground shadow-2xl p-5 sm:p-6" onClick={(e) => e.stopPropagation()}>
        <button data-testid="giro-close" onClick={finish} aria-label={tri("Chiudi", "Schließen", "Close")} className="absolute top-3 right-3 p-2 rounded-full hover:bg-muted active:scale-95"><X className="w-5 h-5" /></button>
        <div className="flex items-center gap-3 mb-3">
          <img src={`${PUB}/sitor_official.webp`} alt={tri("Avatar IA di Michele (Sitor)", "KI-Avatar von Michele (Sitor)", "AI avatar of Michele (Sitor)")} className="w-14 h-14 rounded-2xl object-cover object-top border-2 border-primary/50" />
          <div>
            <p className="font-mono-data text-[10px] tracking-[0.28em] uppercase text-primary">{tri("Il primo giro", "Die erste Runde", "The first tour")} · {i + 1}/{steps.length}</p>
            <p className="text-[11px] text-muted-foreground">{tri("Sitor è un'intelligenza artificiale, non una persona.", "Sitor ist eine künstliche Intelligenz, keine Person.", "Sitor is an artificial intelligence, not a person.")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mb-1"><s.Icon className="w-5 h-5 text-primary" /><h2 className="font-display text-xl font-black text-foreground leading-tight">{s.t}</h2></div>
        <p className="text-[14px] text-foreground/90 leading-relaxed">{s.p}</p>

        {s.bigToggle && (
          <button data-testid="giro-big" onClick={() => { const v = !big; setBig(v); applyBigMode(v); }} className={`mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border font-bold text-sm active:scale-95 ${big ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-foreground"}`}>
            {big ? <Check className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}{big ? tri("Modo grande acceso", "Großmodus an", "Big mode on") : tri("Accendi il Modo grande", "Großmodus anschalten", "Turn on Big mode")}
          </button>
        )}
        {s.go && <button onClick={() => go(s.go)} className="mt-3 w-full px-4 py-2.5 rounded-xl bg-primary/15 border border-primary/40 text-sm font-bold text-foreground active:scale-95">{s.gl}</button>}

        <div className="mt-4 flex items-center justify-between gap-2">
          <button onClick={() => setI((x) => Math.max(0, x - 1))} disabled={i === 0} className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-border text-sm font-bold text-foreground disabled:opacity-40 active:scale-95"><ChevronLeft className="w-4 h-4" />{tri("Indietro", "Zurück", "Back")}</button>
          <div className="flex gap-1" aria-hidden>{steps.map((_, k) => <span key={k} className={`w-1.5 h-1.5 rounded-full ${k === i ? "bg-primary" : "bg-border"}`} />)}</div>
          {last
            ? <button data-testid="giro-finish" onClick={finish} className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold active:scale-95">{tri("Cuciniamo", "Backen wir", "Let's bake")}<Check className="w-4 h-4" /></button>
            : <button data-testid="giro-next" onClick={() => setI((x) => x + 1)} className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold active:scale-95">{tri("Avanti", "Weiter", "Next")}<ChevronRight className="w-4 h-4" /></button>}
        </div>
      </div>
    </div>
  );
}
