import { useState, useEffect } from "react";
import { ChevronLeft, Trash2, Copy, Printer } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { toast } from "sonner";

const KEY = "mikilab_plan";
const DAYS = [
  { it: "Lun", de: "Mo", en: "Mon" }, { it: "Mar", de: "Di", en: "Tue" },
  { it: "Mer", de: "Mi", en: "Wed" }, { it: "Gio", de: "Do", en: "Thu" },
  { it: "Ven", de: "Fr", en: "Fri" }, { it: "Sab", de: "Sa", en: "Sat" }, { it: "Dom", de: "So", en: "Sun" },
];

export default function Plan({ onBack }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const [plan, setPlan] = useState([]);
  useEffect(() => { try { setPlan(JSON.parse(localStorage.getItem(KEY) || "[]")); } catch { setPlan([]); } }, []);
  const save = (p) => { setPlan(p); localStorage.setItem(KEY, JSON.stringify(p)); window.dispatchEvent(new CustomEvent("mikilab-plan-changed")); };
  const setDay = (i, d) => { const p = [...plan]; p[i] = { ...p[i], day: d }; save(p); };
  const remove = (i) => { const p = plan.filter((_, x) => x !== i); save(p); };

  const shopping = {};
  plan.forEach((it) => (it.ing || []).forEach((g) => { shopping[g.name] = (shopping[g.name] || 0) + (Number(g.g) || 0); }));
  const shopRows = Object.entries(shopping).sort((a, b) => b[1] - a[1]);
  const listText = shopRows.map(([n, g]) => `${n}: ${g} g`).join("\n");

  const copyList = async () => { try { await navigator.clipboard.writeText(listText); toast.success(tri("Lista copiata", "Liste kopiert", "List copied")); } catch { /* */ } };

  return (
    <div data-testid="plan-page" className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      <button onClick={onBack} data-testid="plan-back" className="inline-flex items-center gap-1.5 text-muted-foreground font-bold text-sm no-print"><ChevronLeft className="w-4 h-4" />{tri("Indietro", "Zurück", "Back")}</button>
      <h1 className="font-display text-4xl font-black">{tri("Piano della settimana", "Wochenplan", "Weekly plan")}</h1>

      {plan.length === 0 ? (
        <p className="text-muted-foreground">{tri("Aggiungi ricette al piano dalla loro scheda.", "Füge Rezepte aus ihrer Karte hinzu.", "Add recipes to the plan from their card.")}</p>
      ) : (
        <>
          <div className="space-y-2">
            {plan.map((it, i) => (
              <div key={i} data-testid={`plan-item-${i}`} className="flex items-center gap-2 rounded-xl border border-border bg-card p-3">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{it.name}</p>
                  <p className="text-muted-foreground text-xs">{it.flour} g {tri("farina", "Mehl", "flour")}</p>
                </div>
                <select data-testid={`plan-day-${i}`} value={it.day || 0} onChange={(e) => setDay(i, Number(e.target.value))} className="text-xs font-bold bg-background border border-border rounded-lg px-2 py-1.5 no-print">
                  {DAYS.map((d, di) => <option key={di} value={di}>{tri(d.it, d.de, d.en)}</option>)}
                </select>
                <button data-testid={`plan-remove-${i}`} onClick={() => remove(i)} className="p-2 text-mattone no-print"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="font-display text-2xl font-bold">{tri("Lista della spesa", "Einkaufsliste", "Shopping list")}</p>
              <div className="flex gap-2 no-print">
                <button data-testid="plan-copy" onClick={copyList} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold active:scale-95"><Copy className="w-3.5 h-3.5" />{tri("Copia", "Kopieren", "Copy")}</button>
                <button data-testid="plan-print" onClick={() => window.print()} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-foreground/10 text-foreground text-xs font-bold active:scale-95"><Printer className="w-3.5 h-3.5" />{tri("Stampa", "Drucken", "Print")}</button>
              </div>
            </div>
            <table className="w-full text-sm">
              <tbody>
                {shopRows.map(([n, g], i) => (
                  <tr key={i} className="border-b border-border/50 last:border-0"><td className="py-1.5">{n}</td><td className="py-1.5 text-right font-bold">{g} g</td></tr>
                ))}
              </tbody>
            </table>
            <p className="text-muted-foreground text-xs mt-2">{tri("Somma di tutti gli ingredienti nel piano (incluse le preparazioni).", "Summe aller Zutaten im Plan (inkl. Vorteige).", "Sum of all ingredients in the plan (preferments included).")}</p>
          </div>
        </>
      )}
    </div>
  );
}
