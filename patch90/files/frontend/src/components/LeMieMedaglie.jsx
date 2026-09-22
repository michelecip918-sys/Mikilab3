import { ChevronLeft, Award } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { MEDAGLIE, getMedaglie } from "@/lib/medaglie";

// V90 — "Le mie medaglie": tutte le medaglie della bottega, quelle prese accese, le altre in grigio
// con scritto come si ottengono. Solo dal telefono, nessuna classifica.
export default function LeMieMedaglie({ onBack }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const L = (o) => o[lang] || o.it;
  const mine = getMedaglie();
  const n = Object.keys(mine).length;
  const fmt = (ts) => { try { return new Date(ts).toLocaleDateString(lang === "de" ? "de-DE" : lang === "en" ? "en-GB" : "it-IT", { day: "2-digit", month: "short" }); } catch { return ""; } };
  return (
    <div data-testid="medaglie-page" className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <button data-testid="medaglie-back" onClick={onBack} className="inline-flex items-center gap-1 text-muted-foreground text-sm font-bold"><ChevronLeft className="w-4 h-4" />{tri("Indietro", "Zurück", "Back")}</button>
      <div className="flex items-center gap-2"><Award className="w-6 h-6 text-ambra" /><h1 className="font-display text-2xl font-black text-foreground">{tri("Le mie medaglie", "Meine Medaillen", "My medals")}</h1></div>
      <p className="text-sm text-muted-foreground">{tri(`${n} su ${MEDAGLIE.length}. Nessuna classifica, nessun confronto: sono i tuoi passi in bottega, e restano nel tuo telefono.`, `${n} von ${MEDAGLIE.length}. Keine Rangliste, kein Vergleich: es sind deine Schritte in der Backstube, und sie bleiben auf deinem Handy.`, `${n} of ${MEDAGLIE.length}. No leaderboard, no comparison: they're your steps in the bakery, and they stay on your phone.`)}</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5" data-testid="medaglie-grid">
        {MEDAGLIE.map((m) => { const got = mine[m.id]; return (
          <div key={m.id} data-testid={`medaglia-${m.id}`} className={`rounded-2xl border p-3 text-center ${got ? "border-ambra/60 bg-ambra/12" : "border-border/60 bg-background opacity-60"}`}>
            <p className={`text-3xl ${got ? "" : "grayscale"}`}>{m.icon}</p>
            <p className="font-bold text-foreground text-[13px] leading-tight mt-1">{L(m.t)}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{got ? fmt(got) : L(m.how)}</p>
          </div>); })}
      </div>
    </div>
  );
}
