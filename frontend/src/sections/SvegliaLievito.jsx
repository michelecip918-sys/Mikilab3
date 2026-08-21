import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Wheat, Bell, Check } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { speak, primeVoice } from "@/lib/voice";

const LAST_KEY = "mikilab_lm_last";
const INT_KEY = "mikilab_lm_interval";
const ON_KEY = "mikilab_lm_remind";

function fmt(ts, lang) {
  return new Date(ts).toLocaleString(lang === "de" ? "de-DE" : lang === "en" ? "en-GB" : "it-IT", {
    weekday: "short", hour: "2-digit", minute: "2-digit",
  });
}

export default function SvegliaLievito() {
  const { t, lang } = useLang();
  const [interval, setIntervalH] = useState(() => Number(localStorage.getItem(INT_KEY)) || 24);
  const [last, setLast] = useState(() => Number(localStorage.getItem(LAST_KEY)) || Date.now());
  const [remind, setRemind] = useState(() => localStorage.getItem(ON_KEY) === "1");
  const [now, setNow] = useState(Date.now());
  const timerRef = useRef(null);

  const next = last + interval * 3600 * 1000;
  const due = now >= next;
  const remainMs = next - now;

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => { localStorage.setItem(INT_KEY, String(interval)); }, [interval]);
  useEffect(() => { localStorage.setItem(LAST_KEY, String(last)); }, [last]);

  // Programma l'avviso vocale/notifica quando il promemoria è attivo.
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!remind) return;
    const delay = next - Date.now();
    if (delay > 0 && delay < 24 * 3600 * 1000) {
      timerRef.current = setTimeout(() => {
        speak(t("sv_voice"), lang);
        toast(t("sv_due"), { icon: "🌾", duration: 8000 });
        try {
          if ("Notification" in window && Notification.permission === "granted")
            new Notification(t("sv_title"), { body: t("sv_due"), tag: "mikilab-lm" });
        } catch { /* ignore */ }
      }, delay);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [remind, next, lang, t]);

  const markDone = () => { setLast(Date.now()); toast.success(t("sv_done")); };

  const toggleRemind = async () => {
    const nv = !remind;
    setRemind(nv);
    localStorage.setItem(ON_KEY, nv ? "1" : "0");
    if (nv) {
      primeVoice();
      try {
        if ("Notification" in window && Notification.permission === "default") await Notification.requestPermission();
      } catch { /* ignore */ }
      toast.success(t("sv_saved"));
    }
  };

  const remainText = () => {
    if (due) return t("sv_due");
    const h = Math.floor(remainMs / 3600000);
    const m = Math.floor((remainMs % 3600000) / 60000);
    return `${h}h ${m}m`;
  };

  return (
    <div className="pb-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-2xl bg-[#B34A26] flex items-center justify-center">
          <Wheat className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-[#2C221E] dark:text-[#F5EFE6]">{t("sv_title")}</h1>
          <p className="text-sm text-[#8C7567]">{t("sv_subtitle")}</p>
        </div>
      </div>

      <div
        data-testid="sv-status"
        className={`rounded-3xl p-6 text-white shadow-lg mb-4 ${due ? "bg-gradient-to-br from-[#B4442A] to-[#8C3A1D]" : "bg-gradient-to-br from-[#6B8E62] to-[#4d6b45]"}`}
      >
        <p className="text-white/80 text-xs uppercase tracking-wider font-semibold">{t("sv_next")}</p>
        <p className="font-mono-data text-3xl font-bold mt-1">{remainText()}</p>
        <p className="text-white/85 text-sm mt-2">{due ? "🌾 " + t("sv_due") : fmt(next, lang)}</p>
      </div>

      <div className="bg-white dark:bg-[#2A211D] border border-[#E8DEC8] dark:border-[#3D302A] rounded-2xl p-4 mb-3">
        <label className="text-xs font-semibold uppercase tracking-wide text-[#8C7567]">{t("sv_interval")}</label>
        <div className="flex items-center gap-2 mt-2">
          <input
            data-testid="sv-interval" type="number" min="1" value={interval}
            onChange={(e) => setIntervalH(Math.max(1, Number(e.target.value) || 1))}
            className="w-20 text-center font-mono-data font-bold text-[#8C3A1D] dark:text-[#E5AC3A] bg-[#F5EFE6] dark:bg-[#332823] border border-[#E8DEC8] dark:border-[#3D302A] rounded-lg px-2 py-2 outline-none"
          />
          <span className="text-sm text-[#8C7567]">h</span>
          <span className="text-xs text-[#8C7567] ml-auto">{t("sv_last")}: {fmt(last, lang)}</span>
        </div>
      </div>

      <button
        data-testid="sv-done-btn" onClick={markDone}
        className="w-full mb-3 bg-[#B34A26] hover:bg-[#963B1C] text-white font-semibold px-5 py-3.5 rounded-2xl shadow-md active:scale-98 transition-all flex items-center justify-center gap-2"
      >
        <Check className="w-5 h-5" /> {t("sv_done")}
      </button>

      <div className="flex items-center gap-2 bg-white dark:bg-[#2A211D] border border-[#E8DEC8] dark:border-[#3D302A] rounded-2xl px-4 py-3">
        <Bell className="w-4 h-4 text-[#B34A26]" />
        <span className="text-sm text-[#4A3B34] dark:text-[#C9BBB0] flex-1">{remind ? t("sv_remind_on") : t("sv_remind_off")}</span>
        <button
          data-testid="sv-remind-toggle" onClick={toggleRemind}
          className={`w-11 h-6 rounded-full transition-colors relative ${remind ? "bg-[#6B8E62]" : "bg-[#C9BBB0] dark:bg-[#3D302A]"}`}
          aria-label={t("sv_remind_on")}
        >
          <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${remind ? "left-[22px]" : "left-0.5"}`} />
        </button>
      </div>
    </div>
  );
}
