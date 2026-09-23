import { AlertTriangle } from "lucide-react";
import { mkTri } from "@/i18n/triMaps";
import { computeLabel } from "@/components/EtichettaMikiLab";
import { recipeKind, num } from "@/lib/sitorTools";
import { S } from "@/components/officina/ProntoSoccorso";

// V93 — PRIMA CHE SUCCEDA. I tre errori più probabili con questa ricetta, letti dal tipo di impasto, dall'acqua e
// dal lievito, mostrati prima di iniziare: perché capita e come si evita. Il pronto soccorso, ma in anticipo.

export default function PrimaCheSucceda({ r, lang }) {
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const L = (o) => (lang === "de" ? o.de : lang === "en" ? o.en : o.it);
  const kind = recipeKind(r); const Lb = computeLabel(r);
  const hyd = num(r.hydration_percent) || (num(r.flour_grams) > 0 ? (num(r.water_grams) / num(r.flour_grams)) * 100 : 0);
  const keys = [];
  if (Lb.lm) keys.push("lm-non-raddoppia");
  if (hyd >= 75) keys.push("appiccicoso");
  if (kind === "pizza" || kind === "focaccia") keys.push("si-strappa", "pallida");
  else if (kind === "panettone" || kind === "dolce") keys.push("non-cresce", "sgonfiato", "cruda-sotto");
  else if (kind === "panini" || kind === "laugen") keys.push("compatta", "sgonfiato", "pallida");
  else keys.push("no-spinta", "gommosa", "compatta");
  if (Lb.hasPre) keys.push("biga-acetone");
  const picks = [...new Set(keys)].map((k) => S.find((s) => s.k === k)).filter(Boolean).slice(0, 3);
  return (
    <div data-testid="prima-che-succeda" className="space-y-2.5">
      <p className="text-[13px] text-foreground/85 leading-snug">{tri("Con questa ricetta, questi sono gli errori che capitano più spesso. Leggili prima: costa un minuto, risparmia un pane.", "Bei diesem Rezept passieren diese Fehler am häufigsten. Lies sie vorher: kostet eine Minute, spart ein Brot.", "With this recipe, these are the mistakes that happen most. Read them first: it costs a minute and saves a loaf.")}</p>
      {picks.map((s) => (
        <div key={s.k} data-testid={`pcs-${s.k}`} className="rounded-xl border border-border bg-card p-3">
          <p className="text-[13px] font-bold text-foreground flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-primary" />{L(s.t)}</p>
          <p className="text-[12.5px] text-foreground/85 leading-snug mt-1">{L(s.why)}</p>
          <p className="text-[12.5px] text-salvia leading-snug mt-1">{tri("Per evitarlo", "So vermeidest du es", "To avoid it")}: {L(s.next)}</p>
        </div>
      ))}
      <p className="text-[11px] text-muted-foreground">{tri("Se poi succede lo stesso, apri il Pronto soccorso nell'Officina: c'è anche cosa fare subito.", "Passiert es trotzdem, öffne die Erste Hilfe in der Werkstatt: dort steht auch, was du sofort tun kannst.", "If it happens anyway, open First aid in the Workshop: it also says what to do right away.")}</p>
    </div>
  );
}
