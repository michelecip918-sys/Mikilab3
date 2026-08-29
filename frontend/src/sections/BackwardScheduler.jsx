import { mkTri } from "@/i18n/triMaps";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Clock, Bell, RotateCcw } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { speak, primeVoice } from "@/lib/voice";

const PHASES = [
  { id: "rinfresco", it: "Rinfresco lievito / Pre-impasti (Poolish, Sauerteig, Biga)", de: "Sauerteig auffrischen / Vorteige (Poolish, Sauerteig, Biga)", en: "Starter refresh / Preferments (Poolish, Sauerteig, Biga)", def: 720 },
  { id: "impasto", it: "Inizio primo impasto", de: "Erster Teig – Start", en: "Start of first dough", def: 20 },
  { id: "puntata", it: "Puntatura / Lievitazione in massa", de: "Stockgare / Teigruhe", en: "Bulk fermentation", def: 90 },
  { id: "formatura", it: "Formatura e spianatura", de: "Formen und Wirken", en: "Shaping", def: 20 },
  { id: "appretto", it: "Appretto (lievitazione finale)", de: "Stückgare (Endgare)", en: "Final proof", def: 120 },
  { id: "cottura", it: "Infornatura / Cottura", de: "Einschießen / Backen", en: "Loading / Baking", def: 30 },
];

const KEY = "mikilab_bs_durations";

function toDateToday(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m || 0, 0, 0);
  return d;
}
const fmt = (d, lang) => d.toLocaleTimeString(mkTri(lang)("it-IT", "de-DE", "en-GB"), { hour: "2-digit", minute: "2-digit" });

export default function BackwardScheduler() {
  const { t, lang } = useLang();
  const [endTime, setEndTime] = useState("06:00");
  const [dur, setDur] = useState(() => {
    try { return { ...Object.fromEntries(PHASES.map((p) => [p.id, p.def])), ...JSON.parse(localStorage.getItem(KEY) || "{}") }; }
    catch { return Object.fromEntries(PHASES.map((p) => [p.id, p.def])); }
  });
  const [alarms, setAlarms] = useState(false);
  const timers = useRef([]);

  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(dur)); }, [dur]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const total = PHASES.reduce((s, p) => s + Number(dur[p.id] || 0), 0);
  let end = toDateToday(endTime);
  if (end <= new Date(Date.now() - 60000)) end = new Date(end.getTime() + 86400000); // domani se già passato
  let cursor = new Date(end.getTime() - total * 60000);
  const schedule = PHASES.map((p) => {
    const start = new Date(cursor);
    cursor = new Date(cursor.getTime() + Number(dur[p.id] || 0) * 60000);
    return { ...p, start };
  });

  const toggleAlarms = async () => {
    const nv = !alarms;
    setAlarms(nv);
    timers.current.forEach(clearTimeout); timers.current = [];
    if (!nv) return;
    primeVoice();
    try { if ("Notification" in window && Notification.permission === "default") await Notification.requestPermission(); } catch { /* */ }
    let count = 0;
    schedule.forEach((s) => {
      const delay = s.start.getTime() - Date.now();
      if (delay > 0 && delay < 24 * 3600 * 1000) {
        count++;
        const label = lang === "de" ? s.de : lang === "en" ? s.en : s.it;
        timers.current.push(setTimeout(() => {
          speak(label, lang);
          toast(label, { icon: "⏰", duration: 9000 });
          try { if ("Notification" in window && Notification.permission === "granted") new Notification("MikiLab", { body: label }); } catch { /* */ }
        }, delay));
      }
    });
    toast.success(lang === "de" ? `${count} Wecker gesetzt` : lang === "en" ? `${count} alarms set` : `${count} sveglie impostate`);
  };

  return (
    <div className="pb-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-2xl bg-[#ff6b00] flex items-center justify-center"><Clock className="w-6 h-6 text-white" /></div>
        <div>
          <h1 className="font-display text-2xl font-bold text-[#2B303B] dark:text-[#e4eff8]">{t("tool_inversa")}</h1>
          <p className="text-sm text-[#7E8A93]">{mkTri(lang)("Calcola gli orari a ritroso dall'apertura/vendita", "Zeiten rückwärts ab Öffnung/Verkauf berechnen", "Compute times backwards from opening/sale")}</p>
        </div>
      </div>

      <div className="rounded-2xl bg-white dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] p-4 mb-4">
        <label className="text-xs font-semibold uppercase tracking-wide text-[#7E8A93]">{mkTri(lang)("Pronto / Apertura alle", "Fertig / Öffnung um", "Ready / Opening at")}</label>
        <input data-testid="bs-end-time" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)}
          className="mt-1 w-full bg-[#e4eff8] dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] rounded-xl p-3 text-lg font-mono-data font-bold outline-none focus:border-[#ff6b00]" />
      </div>

      <p className="text-xs font-bold uppercase tracking-wide text-[#7E8A93] mb-2">{mkTri(lang)("Durata di ogni fase (min)", "Dauer je Phase (Min.)", "Duration per phase (min)")}</p>
      <div className="space-y-2 mb-4">
        {PHASES.map((p) => (
          <div key={p.id} className="flex items-center gap-2 bg-white dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] rounded-xl p-2.5">
            <span className="flex-1 min-w-0 text-sm text-[#3F4A54] dark:text-[#AEB8BF]">{lang === "de" ? p.de : lang === "en" ? p.en : p.it}</span>
            <input data-testid={`bs-dur-${p.id}`} type="number" min="0" value={dur[p.id]}
              onChange={(e) => setDur((d) => ({ ...d, [p.id]: e.target.value === "" ? "" : Number(e.target.value) }))}
              className="w-20 text-right font-mono-data font-bold text-[#ff6b00] dark:text-[#8FB0C2] bg-[#e4eff8] dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] rounded-lg px-2 py-1.5 outline-none" />
          </div>
        ))}
      </div>

      <div data-testid="bs-schedule" className="rounded-2xl overflow-hidden border border-[#2e2e2e] dark:border-[#2e2e2e] mb-4">
        <div className="bg-gradient-to-br from-[#ff6b00] to-[#ff6b00] text-white px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-white/80">{mkTri(lang)("Scansione oraria", "Zeitplan", "Timetable")}</p>
          <p className="font-display text-lg font-bold">{mkTri(lang)("Fine", "Ende", "End")} · {fmt(end, lang)}</p>
        </div>
        <ol>
          {schedule.map((s, i) => (
            <li key={s.id} data-testid={`bs-row-${s.id}`} className="flex items-center gap-3 px-4 py-3 border-t border-[#2e2e2e] dark:border-[#2e2e2e] bg-white dark:bg-[#1e1e1e]">
              <span className="font-mono-data text-lg font-extrabold text-[#ff6b00] w-16 shrink-0">{fmt(s.start, lang)}</span>
              <span className="text-sm text-[#2B303B] dark:text-[#e4eff8]">{lang === "de" ? s.de : lang === "en" ? s.en : s.it}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="flex items-center gap-2 bg-white dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] rounded-2xl px-4 py-3">
        <Bell className="w-4 h-4 text-[#ff6b00]" />
        <span className="text-sm text-[#3F4A54] dark:text-[#AEB8BF] flex-1">{mkTri(lang)("Sveglie per ogni fase", "Wecker für jede Phase", "Alarms for each phase")}</span>
        <button data-testid="bs-alarm-toggle" onClick={toggleAlarms}
          className={`w-11 h-6 rounded-full transition-colors relative ${alarms ? "bg-[#ff6b00]" : "bg-[#AEB8BF] dark:bg-[#2e2e2e]"}`}>
          <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${alarms ? "left-[22px]" : "left-0.5"}`} />
        </button>
      </div>

      <button data-testid="bs-reset" onClick={() => setDur(Object.fromEntries(PHASES.map((p) => [p.id, p.def])))}
        className="mt-3 text-sm text-[#7E8A93] flex items-center gap-1 mx-auto"><RotateCcw className="w-4 h-4" /> {mkTri(lang)("Tempi predefiniti", "Standardzeiten", "Default times")}</button>
    </div>
  );
}
