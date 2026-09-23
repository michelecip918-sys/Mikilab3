import { Baby, GraduationCap, ChevronRight } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// V111 — PER I BAMBINI E PER LA SCUOLA. La card in Home che porta a «Il pane dei piccoli» (casa e un'ora in classe)
// e a «MikiLab a scuola» (il programma dall'asilo alla quinta). Nessun dato, nessuna rete: solo due porte.

function Panino({ w, c }) {
  return (
    <svg viewBox="0 0 64 44" width={w} height={Math.round(w * 0.69)} aria-hidden="true" focusable="false">
      <path d="M6 34 C6 16 18 8 32 8 C46 8 58 16 58 34 C58 38 54 40 50 40 H14 C10 40 6 38 6 34 Z" fill={c} />
      <path d="M22 18 C29 13 39 14 46 21" fill="none" stroke="#F3DDBE" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

export default function BambiniInHome({ onNav }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const go = (r) => { try { if (onNav) onNav(r); else window.dispatchEvent(new CustomEvent("mikilab-nav", { detail: { route: r } })); } catch { /* */ } };
  return (
    <section data-testid="bambini-in-home" className="mb-4 rounded-3xl border border-salvia/40 bg-salvia/8 p-4" aria-label={tri("Per i bambini e per la scuola", "Für Kinder und für die Schule", "For children and for schools")}>
      <div className="flex items-center gap-3">
        <div className="flex items-end gap-0.5 shrink-0" aria-hidden="true"><Panino w={18} c="#B9743A" /><Panino w={24} c="#B9743A" /><Panino w={30} c="#8A4F22" /><Panino w={36} c="#B9743A" /></div>
        <div className="min-w-0 flex-1">
          <p className="font-mono-data text-[10px] tracking-[0.25em] uppercase text-salvia">{tri("Per i bambini e per la scuola", "Für Kinder und für die Schule", "For children and for schools")}</p>
          <p className="text-[13.5px] text-foreground leading-snug mt-0.5">{tri("Il pane si impara con le mani: a casa con i piccoli, in classe con un programma dall'asilo alla quinta. Gratis, scritto da Sitor sul metodo di Michele.", "Brot lernt man mit den Händen: zu Hause mit den Kleinen, in der Klasse mit einem Programm von der Kita bis zur fünften Klasse. Kostenlos, von Sitor nach Micheles Methode.", "Bread is learned with the hands: at home with the little ones, in class with a programme from kindergarten to fifth grade. Free, written by Sitor on Michele's method.")}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
        <button data-testid="home-piccoli" onClick={() => go("piccoli")} className="text-left rounded-2xl border border-border bg-card p-3 flex items-center gap-2.5 active:scale-[0.98] hover:border-salvia/60 transition-all">
          <Baby className="w-5 h-5 text-salvia shrink-0" />
          <span className="min-w-0 flex-1"><span className="block font-display text-[15px] font-bold text-foreground leading-tight">{tri("Il pane dei piccoli", "Das Brot der Kleinen", "Bread for little ones")}</span><span className="block text-[11.5px] text-muted-foreground leading-snug">{tri("dodici forme, la storia del pane, la notte del fornaio, il gioco del lievito, un'ora in classe", "zwölf Formen, die Brotgeschichte, die Nacht des Bäckers, das Hefespiel, eine Stunde in der Klasse", "twelve shapes, the story of bread, the baker's night, the yeast game, one hour in class")}</span></span>
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        </button>
        <button data-testid="home-scuola" onClick={() => go("scuola")} className="text-left rounded-2xl border border-border bg-card p-3 flex items-center gap-2.5 active:scale-[0.98] hover:border-salvia/60 transition-all">
          <GraduationCap className="w-5 h-5 text-salvia shrink-0" />
          <span className="min-w-0 flex-1"><span className="block font-display text-[15px] font-bold text-foreground leading-tight">{tri("MikiLab a scuola", "MikiLab in der Schule", "MikiLab at school")}</span><span className="block text-[11.5px] text-muted-foreground leading-snug">{tri("il programma dall'asilo alla quinta: 36 schede, giochi, disegni, quaderno della classe", "das Programm von der Kita bis zur fünften Klasse: 36 Stunden, Spiele, Ausmalbilder, Klassenheft", "the programme from kindergarten to fifth grade: 36 sheets, games, colouring, class notebook")}</span></span>
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        </button>
      </div>
    </section>
  );
}
