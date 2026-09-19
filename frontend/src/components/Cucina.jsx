import { useState } from "react";
import { ChevronLeft, Trash2, Download, Star } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { toast } from "sonner";
import { getOvenAdj, getKitchenTemp, setKitchenTemp, getDiary, getRemember, setRemember, clearMyKitchen, getTools } from "@/lib/mycucina";
import PhotoDiag from "@/components/PhotoDiag";
import Palato from "@/components/Palato";

export default function Cucina({ onBack }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const [, force] = useState(0); const refresh = () => force((n) => n + 1);
  const oven = getOvenAdj();
  const ktemp = getKitchenTemp();
  const diary = getDiary();
  const remember = getRemember();
  const tools = getTools();
  const toolList = Object.entries(tools).filter(([, v]) => v);

  const exportDiary = () => {
    const txt = diary.map((e) => `${new Date(e.ts).toLocaleDateString()} — ${e.recipe || ""} — ${e.rating || "?"}/5\n${e.note || ""}`).join("\n\n");
    const b = new Blob([txt || "—"], { type: "text/plain" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "diario-del-mio-pane.txt"; a.click();
  };

  return (
    <div data-testid="cucina-page" className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <button data-testid="cucina-back" onClick={onBack} className="inline-flex items-center gap-1 text-muted-foreground text-sm font-bold"><ChevronLeft className="w-4 h-4" />{tri("Indietro", "Zurück", "Back")}</button>
      <div>
        <h1 className="font-display text-3xl sm:text-4xl font-black text-foreground">{tri("La mia cucina", "Meine Küche", "My kitchen")}</h1>
        <p className="text-muted-foreground text-sm mt-1">{tri("Tutto resta sul tuo dispositivo. Niente viene salvato sul server.", "Alles bleibt auf deinem Gerät. Nichts wird auf dem Server gespeichert.", "Everything stays on your device. Nothing is saved on the server.")}</p>
      </div>

      {/* Interruttore: Sitor ricorda */}
      <div className="rounded-2xl border border-border bg-card p-4 flex items-center justify-between gap-3">
        <div>
          <p className="font-bold text-foreground text-sm">{tri("Sitor ricorda la mia cucina", "Sitor merkt sich meine Küche", "Sitor remembers my kitchen")}</p>
          <p className="text-muted-foreground text-xs mt-0.5">{tri("Se attivo, un riassunto (max 400 caratteri) viene aggiunto alle domande a Sitor.", "Wenn an, wird eine Zusammenfassung (max 400 Zeichen) den Fragen an Sitor beigefügt.", "If on, a summary (max 400 chars) is added to your questions to Sitor.")}</p>
        </div>
        <button data-testid="remember-toggle" onClick={() => { setRemember(!remember); refresh(); }} className={`shrink-0 w-12 h-7 rounded-full transition-all ${remember ? "bg-accent" : "bg-foreground/20"}`}>
          <span className={`block w-5 h-5 bg-white rounded-full transition-all ${remember ? "translate-x-6" : "translate-x-1"}`} />
        </button>
      </div>

      {/* Cosa ricorda Sitor */}
      <div className="rounded-2xl border border-border bg-background p-4 space-y-3">
        <p className="text-[11px] font-black uppercase tracking-wide text-muted-foreground">{tri("Cosa ricorda Sitor", "Was Sitor sich merkt", "What Sitor remembers")}</p>
        <div className="text-sm text-foreground/80 space-y-1.5">
          <p data-testid="cucina-tools"><span className="font-semibold text-muted-foreground">{tri("Attrezzi", "Geräte", "Tools")}:</span> {toolList.length ? toolList.map(([, v]) => v).join(", ") : "—"}</p>
          <p data-testid="cucina-oven"><span className="font-semibold text-muted-foreground">{tri("Correzione forno", "Ofenkorrektur", "Oven correction")}:</span> {oven ? `${oven > 0 ? "+" : ""}${oven} °C` : "—"}</p>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-muted-foreground text-sm">{tri("Temperatura cucina", "Küchentemperatur", "Kitchen temperature")}:</span>
            <input data-testid="cucina-ktemp" type="number" min="5" max="40" defaultValue={ktemp || ""} placeholder="°C"
              onBlur={(e) => { const v = Number(e.target.value); setKitchenTemp(v || null); refresh(); }}
              className="w-20 px-2 py-1 rounded-lg text-sm bg-background border border-border text-foreground outline-none focus:border-accent" />
            <span className="text-muted-foreground text-sm">°C</span>
          </div>
        </div>
      </div>

      {/* Diario (D2) */}
      <div className="rounded-2xl border border-border bg-background p-4 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-black uppercase tracking-wide text-muted-foreground">{tri("Diario del mio pane", "Mein Brot-Tagebuch", "My bread diary")}</p>
          <button data-testid="diary-export" onClick={exportDiary} className="inline-flex items-center gap-1 text-xs font-bold text-primary"><Download className="w-3.5 h-3.5" />{tri("Esporta", "Export", "Export")}</button>
        </div>
        <div className="pt-1 flex flex-wrap gap-2"><PhotoDiag level="casa" compact /><Palato level="casa" compact /></div>
        {diary.length === 0 ? (
          <p className="text-muted-foreground text-sm">{tri("Ancora nessuna prova. A fine corso puoi dare un voto e una nota.", "Noch keine Einträge. Am Kursende kannst du bewerten und notieren.", "No entries yet. At the end of a course you can rate and note.")}</p>
        ) : (
          <ul className="space-y-2">
            {diary.slice(0, 5).map((e, i) => (
              <li key={i} data-testid={`diary-entry-${i}`} className="text-sm border-b border-border/40 last:border-0 pb-2">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-foreground">{e.recipe || tri("Prova", "Versuch", "Bake")}</span>
                  <span className="flex">{Array.from({ length: 5 }).map((_, s) => <Star key={s} className={`w-3.5 h-3.5 ${s < (e.rating || 0) ? "text-accent fill-accent" : "text-foreground/20"}`} />)}</span>
                </div>
                {e.note && <p className="text-foreground/70 mt-0.5">{e.note}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>

      <button data-testid="cucina-clear" onClick={() => { if (window.confirm(tri("Cancellare tutto ciò che Sitor ricorda?", "Alles löschen, was Sitor sich merkt?", "Clear everything Sitor remembers?"))) { clearMyKitchen(); refresh(); toast.success(tri("Cancellato", "Gelöscht", "Cleared")); } }}
        className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl border border-mattone/50 text-mattone font-bold text-sm active:scale-95">
        <Trash2 className="w-4 h-4" />{tri("Cancella tutto", "Alles löschen", "Clear all")}
      </button>
    </div>
  );
}
