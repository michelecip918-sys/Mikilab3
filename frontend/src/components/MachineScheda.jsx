import { Cog } from "lucide-react";
import { machineScheda } from "@/lib/machines";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// Scheda Macchina dinamica: riflette il Parco Macchine attivo (Modalità / Resa / Attenzioni).
export default function MachineScheda() {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const s = machineScheda(lang);
  return (
    <div data-testid="recipe-machine-scheda" className="mt-4 rounded-2xl border border-[#c94f00]/40 bg-[#c94f00]/8 p-4">
      <p className="text-[11px] font-bold uppercase tracking-wide text-[#c94f00] dark:text-[#a9d2ec] flex items-center gap-1.5 mb-2">
        <Cog className="w-4 h-4" /> {tri("Scheda Macchina", "Maschinen-Blatt", "Machine Sheet")}
      </p>
      <div className="space-y-1 text-sm text-[#2B303B] dark:text-[#EAF0EC]">
        <p><b>{tri("Modalità di Produzione", "Produktionsmodus", "Production Mode")}:</b> {s.mode}</p>
        <p><b>{tri("Resa Oraria Stimata", "Stundenleistung", "Hourly Yield")}:</b> {s.yieldLabel}</p>
        {s.count > 0 ? (
          <>
            <p><b>{tri("Macchine attive", "Aktive Maschinen", "Active machines")}:</b> {s.names.join(", ")}</p>
            {s.tips.length > 0 && (
              <div className="pt-1">
                <p className="font-bold">{tri("Punti di Attenzione Macchina", "Maschinen-Hinweise", "Machine attention points")}:</p>
                <ul className="list-disc pl-5 space-y-0.5 mt-0.5">
                  {s.tips.map((t, i) => <li key={i}>{t}</li>)}
                </ul>
              </div>
            )}
          </>
        ) : (
          <p className="text-[12px] text-[#7E8A93]">{tri("Nessuna macchina attiva: lavorazione manuale. Attiva il Parco Macchine nel Laboratorio per adattare produzione e resa.", "Keine Maschine aktiv: Handarbeit. Aktiviere den Maschinenpark im Labor.", "No machine active: manual work. Turn on the Machine Park in the Lab.")}</p>
        )}
      </div>
    </div>
  );
}
