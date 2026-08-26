import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckSquare, Thermometer, ShieldCheck, Archive, CalendarCheck, LogIn } from "lucide-react";
import { toast } from "sonner";
import { useLang } from "@/i18n/LanguageContext";
import ListenButton from "@/components/ListenButton";
import { addXP } from "@/lib/level";
import { useAuth } from "@/auth/AuthContext";
import { doughSessionsApi, haccpApi } from "@/lib/api";

// Passo 6 · "Concludi Giornata" — riepilogo di chiusura + archivio (localStorage).
const CLOSURES_KEY = "mikilab_day_closures";
const todayStr = () => new Date().toISOString().slice(0, 10);

export default function DayClose() {
  const { lang } = useLang();
  const tri = (i, d, e) => (lang === "de" ? d : lang === "en" ? e : i);
  const { user, setAuthOpen } = useAuth();

  const [doughToday, setDoughToday] = useState([]);
  const [haccpToday, setHaccpToday] = useState([]);
  const [note, setNote] = useState("");
  const [closing, setClosing] = useState(false);
  const [lastClosure, setLastClosure] = useState(null);
  const [celebrate, setCelebrate] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const today = todayStr();
    const [sessions, logs] = await Promise.all([doughSessionsApi.list(), haccpApi.list()]);
    setDoughToday((sessions || []).filter((s) => (s.date || s.created_at || "").slice(0, 10) === today));
    setHaccpToday((logs || []).filter((l) => (l.date || l.created_at || "").slice(0, 10) === today));
  }, [user]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    try {
      const arr = JSON.parse(localStorage.getItem(CLOSURES_KEY) || "[]");
      if (Array.isArray(arr) && arr.length) setLastClosure(arr[arr.length - 1]);
    } catch { /* noop */ }
  }, []);

  const closeDay = () => {
    if (!user) { setAuthOpen(true); return; }
    setClosing(true);
    try {
      const record = {
        id: `${Date.now()}`,
        date: todayStr(),
        closed_at: new Date().toISOString(),
        dough_sessions: doughToday.length,
        haccp_entries: haccpToday.length,
        note: note.trim(),
      };
      const arr = JSON.parse(localStorage.getItem(CLOSURES_KEY) || "[]");
      arr.push(record);
      localStorage.setItem(CLOSURES_KEY, JSON.stringify(arr));
      setLastClosure(record);
      setNote("");
      setCelebrate(true);
      addXP(2);
      toast.success(tri("Giornata conclusa e archiviata ✅", "Tag abgeschlossen und archiviert ✅", "Day closed and archived ✅"));
    } catch {
      toast.error(tri("Errore nell'archiviazione", "Archivierung fehlgeschlagen", "Archiving failed"));
    }
    setClosing(false);
  };

  const Stat = ({ Icon, value, label }) => (
    <div className="flex-1 bg-white dark:bg-[#232A31] border border-[#d5e4f0] dark:border-[#38424B] rounded-2xl p-3 text-center">
      <Icon className="w-5 h-5 text-[#3f7cac] mx-auto mb-1" />
      <p className="font-display text-2xl font-bold text-[#2B303B] dark:text-[#e4eff8]">{value}</p>
      <p className="text-[11px] text-[#7E8A93] leading-tight">{label}</p>
    </div>
  );

  return (
    <div className="pb-40" data-testid="dayclose">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-2xl bg-[#5aa0cf] flex items-center justify-center"><CalendarCheck className="w-6 h-6 text-white" /></div>
        <div>
          <h1 className="font-display text-2xl font-bold text-[#2B303B] dark:text-[#e4eff8]">{tri("Concludi Giornata", "Tag abschließen", "Close the Day")}</h1>
          <p className="text-sm text-[#7E8A93]">{tri("Riepilogo di chiusura e archivio Diario/HACCP", "Abschlussübersicht und Archiv Tagebuch/HACCP", "Closing summary and Log/HACCP archive")}</p>
        </div>
      </div>

      {!user && (
        <button data-testid="dayclose-login" onClick={() => setAuthOpen(true)} className="w-full flex items-center justify-center gap-2 bg-[#3F7CAC] text-white font-semibold py-3 rounded-2xl mb-4">
          <LogIn className="w-5 h-5" /> {tri("Accedi per concludere la giornata", "Zum Abschließen anmelden", "Sign in to close the day")}
        </button>
      )}

      <div className="flex gap-2.5 mb-4" data-testid="dayclose-stats">
        <Stat Icon={Thermometer} value={doughToday.length} label={tri("Sessioni impasto oggi", "Teig-Sitzungen heute", "Dough sessions today")} />
        <Stat Icon={ShieldCheck} value={haccpToday.length} label={tri("Voci HACCP oggi", "HACCP-Einträge heute", "HACCP entries today")} />
      </div>

      <div className="bg-white dark:bg-[#232A31] border border-[#d5e4f0] dark:border-[#38424B] rounded-2xl p-4 mb-4">
        <p className="text-xs font-bold uppercase text-[#3f7cac] mb-2">{tri("Nota di chiusura (facoltativa)", "Abschlussnotiz (optional)", "Closing note (optional)")}</p>
        <textarea data-testid="dayclose-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)}
          placeholder={tri("Es. tutto regolare, celle in ordine, forni spenti", "z. B. alles ok, Zellen geordnet, Öfen aus", "e.g. all good, cells tidy, ovens off")}
          className="w-full bg-[#f0f6fb] dark:bg-[#1F252B] border border-[#d5e4f0] dark:border-[#38424B] rounded-xl px-3 py-2.5 outline-none text-[#2B303B] dark:text-[#e4eff8] focus:border-[#3f7cac] resize-none" />
      </div>

      <button data-testid="dayclose-confirm" onClick={closeDay} disabled={closing}
        className="w-full flex items-center justify-center gap-2 bg-[#5aa0cf] hover:bg-[#336a94] disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl active:scale-98 shadow-md">
        <CheckSquare className="w-5 h-5" /> {closing ? tri("Chiusura…", "Abschluss…", "Closing…") : tri("Concludi e archivia la giornata", "Tag abschließen und archivieren", "Close and archive the day")}
      </button>

      {lastClosure && (
        <div data-testid="dayclose-last" className="mt-4 flex items-start gap-2 bg-[#5aa0cf]/12 border border-[#5aa0cf]/30 rounded-2xl p-3.5">
          <Archive className="w-4 h-4 text-[#2e6690] dark:text-[#a9d2ec] shrink-0 mt-0.5" />
          <div className="text-xs text-[#3F4A54] dark:text-[#AEB8BF]">
            <p className="font-bold text-[#2e6690] dark:text-[#a9d2ec]">{tri("Ultima chiusura archiviata", "Letzter archivierter Abschluss", "Last archived closure")}: {lastClosure.date}</p>
            <p className="mt-0.5">{tri("Sessioni impasto", "Teig-Sitzungen", "Dough sessions")}: {lastClosure.dough_sessions} · HACCP: {lastClosure.haccp_entries}</p>
            {lastClosure.note && <p className="mt-0.5 italic">"{lastClosure.note}"</p>}
          </div>
        </div>
      )}

      <ListenButton
        text={tri(
          `Riepilogo della giornata. Sessioni di impasto: ${doughToday.length}. Voci HACCP: ${haccpToday.length}.${note.trim() ? " Nota: " + note.trim() : (lastClosure && lastClosure.note ? " Nota: " + lastClosure.note : "")}`,
          `Tageszusammenfassung. Teig-Sitzungen: ${doughToday.length}. HACCP-Einträge: ${haccpToday.length}.${note.trim() ? " Notiz: " + note.trim() : (lastClosure && lastClosure.note ? " Notiz: " + lastClosure.note : "")}`,
          `Day summary. Dough sessions: ${doughToday.length}. HACCP entries: ${haccpToday.length}.${note.trim() ? " Note: " + note.trim() : (lastClosure && lastClosure.note ? " Note: " + lastClosure.note : "")}`
        )}
        who="momy" testid="dayclose-listen"
        className="mt-3 w-full bg-[#3f7cac] hover:bg-[#336a94] text-white font-medium px-5 py-3 rounded-2xl flex items-center justify-center gap-2 active:scale-98 transition-all" />

      <AnimatePresence>
        {celebrate && (
          <motion.div data-testid="dayclose-celebrate" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setCelebrate(false)}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#1A1412]/85 backdrop-blur-sm px-6 cursor-pointer">
            <div className="relative flex items-center justify-center">
              <motion.img src={`${process.env.PUBLIC_URL || ""}/michele-avatar-full.jpg`} alt="Michele"
                initial={{ x: -140, rotate: -10, opacity: 0 }} animate={{ x: -4, rotate: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 130, damping: 12, delay: 0.1 }}
                className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-2xl" />
              <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: [0, 1.5, 1], opacity: 1 }}
                transition={{ delay: 0.55, duration: 0.5 }} className="mx-1 text-5xl drop-shadow-lg">🙌</motion.div>
              <motion.img src={`${process.env.PUBLIC_URL || ""}/mohammed-avatar.jpg`} alt="Mohammed"
                initial={{ x: 140, rotate: 10, opacity: 0 }} animate={{ x: 4, rotate: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 130, damping: 12, delay: 0.1 }}
                className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-2xl" />
            </div>
            <motion.h2 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.65 }}
              className="mt-6 font-display text-2xl font-bold text-white text-center">
              {tri("Complimenti, Maestro! 👏", "Glückwunsch, Meister! 👏", "Well done, Master! 👏")}
            </motion.h2>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
              className="mt-1 text-white/85 text-sm text-center max-w-xs">
              {tri("Michele e Mohammed battono il cinque per la tua giornata di lavoro!", "Michele und Mohammed geben dir ein High-Five für deinen Arbeitstag!", "Michele and Mohammed high-five you for a great work day!")}
            </motion.p>
            <button data-testid="dayclose-celebrate-close" className="mt-6 bg-white text-[#2B303B] font-bold px-7 py-2.5 rounded-full active:scale-95">
              {tri("Grazie!", "Danke!", "Thanks!")}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
