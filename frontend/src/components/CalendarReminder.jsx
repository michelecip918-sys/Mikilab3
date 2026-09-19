import { useState } from "react";
import { CalendarClock, Download } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { api } from "@/lib/api";
import { toast } from "sonner";

// C2: calcola A RITROSO i passi lunghi dalle durate delle fasi del corso e genera un .ics scaricabile.
// Nessun dato inviato: il file è creato nel browser (Blob).
function pad(n) { return String(n).padStart(2, "0"); }
function icsStamp(d) {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
}
function esc(s) { return String(s || "").replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n"); }

export default function CalendarReminder({ recipe }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const [open, setOpen] = useState(false);
  const [when, setWhen] = useState("18:00");
  const [busy, setBusy] = useState(false);

  const build = async () => {
    setBusy(true);
    try {
      const r = await api.get(`/recipes/${recipe.id}/course-v2?lang=${lang}`);
      const phases = (r.data?.course?.phases || []);
      // durata di ogni fase in minuti (timer o tempo massimo)
      const durs = phases.map((p) => Number(p.timer_min) || Number(p.time_max) || Number(p.time_min) || 0);
      const total = durs.reduce((a, b) => a + b, 0);
      if (total < 240) { toast.info(tri("Questa ricetta non ha attese lunghe.", "Dieses Rezept hat keine langen Wartezeiten.", "This recipe has no long waits.")); setBusy(false); return; }
      // orario di fine desiderato (oggi o domani se già passato)
      const [hh, mm] = when.split(":").map((x) => parseInt(x, 10));
      const finish = new Date(); finish.setHours(hh, mm, 0, 0);
      if (finish.getTime() < Date.now()) finish.setDate(finish.getDate() + 1);
      // calcolo a ritroso: start di ogni fase = fine - somma durate dalla fase in poi
      let acc = 0; const events = [];
      for (let i = phases.length - 1; i >= 0; i--) {
        acc += durs[i];
        if (durs[i] >= 30) { // solo i passi lunghi
          const start = new Date(finish.getTime() - acc * 60000);
          events.push({ start, title: phases[i].name || `${tri("Passo", "Schritt", "Step")} ${i + 1}` });
        }
      }
      events.reverse();
      const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2)}@mikilab`;
      let ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//MikiLab//Sitor//IT", "CALSCALE:GREGORIAN"];
      events.forEach((ev) => {
        const end = new Date(ev.start.getTime() + 5 * 60000);
        ics.push("BEGIN:VEVENT", `UID:${uid()}`, `DTSTAMP:${icsStamp(new Date())}`,
          `DTSTART:${icsStamp(ev.start)}`, `DTEND:${icsStamp(end)}`,
          `SUMMARY:${esc(recipe.name)} — ${esc(ev.title)}`,
          "BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${esc(ev.title)}`, "TRIGGER:PT0M", "END:VALARM",
          "END:VEVENT");
      });
      ics.push("END:VCALENDAR");
      const blob = new Blob([ics.join("\r\n")], { type: "text/calendar" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${(recipe.name || "ricetta").replace(/\s+/g, "_")}.ics`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      toast.success(tri("Promemoria scaricato!", "Erinnerung heruntergeladen!", "Reminder downloaded!"));
      setOpen(false);
    } catch {
      toast.error(tri("Non riesco a creare il promemoria.", "Erinnerung konnte nicht erstellt werden.", "Couldn't create the reminder."));
    }
    setBusy(false);
  };

  return (
    <div data-testid="calendar-reminder" className="rounded-2xl border border-border bg-background p-3.5">
      {!open ? (
        <button data-testid="calendar-open" onClick={() => setOpen(true)} className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-accent/15 border border-accent/40 text-accent-foreground font-bold text-sm active:scale-95">
          <CalendarClock className="w-4 h-4" />{tri("Aggiungi al calendario", "Zum Kalender hinzufügen", "Add to calendar")}
        </button>
      ) : (
        <div className="space-y-3">
          <p className="text-sm font-bold text-foreground">{tri("Voglio il pane alle…", "Ich will das Brot um…", "I want the bread at…")}</p>
          <div className="flex items-center gap-2">
            <input data-testid="calendar-time" type="time" value={when} onChange={(e) => setWhen(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm font-bold bg-background border border-border text-foreground outline-none" />
            <button data-testid="calendar-download" onClick={build} disabled={busy} className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm active:scale-95 disabled:opacity-50">
              <Download className="w-4 h-4" />{busy ? tri("Calcolo…", "Rechne…", "Computing…") : tri("Scarica .ics", "Als .ics laden", "Download .ics")}
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground">{tri("Calcolo a ritroso dei passi lunghi. Il file resta sul tuo dispositivo.", "Rückwärtsberechnung der langen Schritte. Die Datei bleibt auf deinem Gerät.", "Backward timing of the long steps. The file stays on your device.")}</p>
        </div>
      )}
    </div>
  );
}
