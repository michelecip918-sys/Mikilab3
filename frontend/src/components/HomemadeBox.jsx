import { Sprout } from "lucide-react";
import { HOMEMADE } from "@/lib/improver";

// V122 — i due ingredienti del miglioratore fatti in casa, passo per passo.
export default function HomemadeBox({ L }) {
  return (
    <div data-testid="miglioratore-homemade">
      <h2 className="font-display text-lg font-black text-foreground uppercase tracking-wide flex items-center gap-2 mb-1">
        <Sprout className="w-5 h-5 text-accent" />{L({ it: "I due ingredienti fatti in casa", de: "Die zwei hausgemachten Zutaten", en: "The two homemade ingredients" })}
      </h2>
      <p className="text-[13px] text-muted-foreground mb-3">{L({ it: "Sono il cuore della miscela: si fanno con calma, una volta, e bastano per tanti pani.", de: "Sie sind das Herz der Mischung: in Ruhe einmal gemacht, reichen sie für viele Brote.", en: "They are the heart of the mix: made calmly, once, they last for many breads." })}</p>
      <div className="space-y-3">
        {HOMEMADE.map((h) => (
          <div key={h.key} data-testid={`miglioratore-homemade-${h.key}`} className="rounded-2xl border border-border bg-card p-4">
            <p className="font-bold text-foreground">{L(h.title)}</p>
            <ol className="mt-2 space-y-1.5 list-decimal pl-5 text-[13.5px] text-foreground/90 leading-snug">
              {h.steps.map((s, i) => <li key={i}>{L(s)}</li>)}
            </ol>
          </div>
        ))}
      </div>
    </div>
  );
}
