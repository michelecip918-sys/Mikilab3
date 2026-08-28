import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FlaskConical, Plus, Trash2, Bluetooth, CheckCircle2, Bell } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { speak, primeVoice } from "@/lib/voice";

const STORE = "mikilab_sourdough_log";
// Finestra ideale per legare i Panettoni: pH 4,1–4,3 a 28–30°C
const PH_MIN = 4.1, PH_MAX = 4.3, T_MIN = 28, T_MAX = 30;

function loadLog() {
  try { return JSON.parse(localStorage.getItem(STORE) || "[]"); } catch { return []; }
}

export default function SourdoughTracker() {
  const { lang } = useLang();
  const tri = (i, d, e) => (lang === "de" ? d : lang === "it" ? i : (e ?? i));
  const [ph, setPh] = useState("");
  const [temp, setTemp] = useState("");
  const [log, setLog] = useState(loadLog);
  const [btBusy, setBtBusy] = useState(false);

  useEffect(() => { localStorage.setItem(STORE, JSON.stringify(log)); }, [log]);

  const inWindow = (p, t) => p >= PH_MIN && p <= PH_MAX && t >= T_MIN && t <= T_MAX;
  const last = log[0];
  const atPeak = last && inWindow(Number(last.ph), Number(last.temp));

  const add = (pVal, tVal) => {
    const p = Number(pVal), t = Number(tVal);
    if (!p || !t) { toast.error(tri("Inserisci pH e temperatura.", "pH und Temperatur eingeben.", "Enter pH and temperature.")); return; }
    const entry = { id: Date.now(), ph: p, temp: t, ts: new Date().toISOString() };
    setLog((l) => [entry, ...l].slice(0, 50));
    setPh(""); setTemp("");
    if (inWindow(p, t)) {
      primeVoice();
      const msg = tri("Picco ideale raggiunto: puoi legare il panettone!", "Idealer Punkt erreicht: du kannst den Panettone binden!", "Ideal peak reached: you can bind the panettone!");
      toast.success(msg);
      speak(msg, lang);
      try {
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("MikiLab · Lievito Madre", { body: msg });
        }
      } catch { /* ignore */ }
    }
  };

  const askNotif = () => {
    try { if ("Notification" in window && Notification.permission === "default") Notification.requestPermission(); } catch { /* */ }
  };

  // Best-effort Web Bluetooth: molti pH-metri non espongono un GATT standard →
  // se non si riesce a leggere, l'utente inserisce i valori a mano.
  const connectBt = async () => {
    askNotif();
    if (!navigator.bluetooth) {
      toast.info(tri("Bluetooth non disponibile: inserisci i valori a mano.", "Bluetooth nicht verfügbar: Werte manuell eingeben.", "Bluetooth unavailable: enter values manually."));
      return;
    }
    setBtBusy(true);
    try {
      await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ["environmental_sensing"],
      });
      toast.success(tri("Dispositivo collegato. Se non arrivano dati, inserisci i valori a mano.", "Gerät verbunden. Falls keine Daten kommen, manuell eingeben.", "Device connected. If no data arrives, enter values manually."));
    } catch {
      toast.info(tri("Nessun dispositivo selezionato: inserimento manuale attivo.", "Kein Gerät gewählt: manuelle Eingabe aktiv.", "No device selected: manual entry active."));
    } finally { setBtBusy(false); }
  };

  return (
    <div className="pb-24">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-2xl bg-[#5aa0cf] flex items-center justify-center">
          <FlaskConical className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-[#2B303B] dark:text-[#e4eff8]">
            {tri("Lievito Madre & pH Tracker", "Lievito Madre & pH-Tracker", "Sourdough & pH Tracker")}
          </h1>
          <p className="text-sm text-[#7E8A93]">{tri("Segui la maturazione fino al punto giusto", "Verfolge die Reife bis zum idealen Punkt", "Track ripening to the ideal point")}</p>
        </div>
      </div>

      {/* Finestra ideale */}
      <div className="rounded-2xl bg-[#6E8CA0]/10 border border-[#6E8CA0]/30 p-3 mb-4 text-sm text-[#234b6e] dark:text-[#8FB0C2]">
        🎯 {tri("Punto per LEGARE il Panettone", "Punkt zum BINDEN des Panettone", "Point to BIND the Panettone")}: <b>pH {PH_MIN}–{PH_MAX}</b> · <b>{T_MIN}–{T_MAX}°C</b>
      </div>

      {/* Stato attuale */}
      {last && (
        <div data-testid="ph-status" className={`rounded-2xl p-4 mb-4 border ${atPeak ? "bg-[#5aa0cf]/15 border-[#5aa0cf]/40" : "bg-white dark:bg-[#232A31] border-[#d5e4f0] dark:border-[#38424B]"}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-[#7E8A93]">{tri("Ultima misura", "Letzte Messung", "Last reading")}</p>
              <p className="font-mono-data text-2xl font-bold text-[#2B303B] dark:text-[#e4eff8]">pH {Number(last.ph).toFixed(1)} · {last.temp}°C</p>
            </div>
            {atPeak
              ? <div className="flex items-center gap-2 text-[#2e6690] dark:text-[#a9d2ec] font-bold"><CheckCircle2 className="w-6 h-6" /> {tri("PRONTO", "BEREIT", "READY")}</div>
              : <span className="text-xs text-[#7E8A93] text-right max-w-[45%]">{tri("Continua a monitorare fino alla finestra ideale.", "Weiter überwachen bis zum Idealfenster.", "Keep monitoring until the ideal window.")}</span>}
          </div>
        </div>
      )}

      {/* Inserimento */}
      <div className="grid grid-cols-2 gap-3 mb-2">
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wide text-[#7E8A93]">pH</label>
          <input data-testid="ph-input" type="number" step="0.1" value={ph} onChange={(e) => setPh(e.target.value)} placeholder="4.2"
            className="mt-1 w-full font-mono-data bg-white dark:bg-[#1F252B] border border-[#d5e4f0] dark:border-[#38424B] rounded-xl p-3 outline-none focus:border-[#5aa0cf]" />
        </div>
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wide text-[#7E8A93]">{tri("Temperatura", "Temperatur", "Temperature")}</label>
          <div className="relative mt-1">
            <input data-testid="ph-temp-input" type="number" value={temp} onChange={(e) => setTemp(e.target.value)} placeholder="28"
              className="w-full font-mono-data bg-white dark:bg-[#1F252B] border border-[#d5e4f0] dark:border-[#38424B] rounded-xl p-3 pr-8 outline-none focus:border-[#5aa0cf]" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#7E8A93]">°C</span>
          </div>
        </div>
      </div>

      <button data-testid="ph-add-btn" onClick={() => add(ph, temp)}
        className="w-full bg-[#5aa0cf] hover:bg-[#336a94] text-white font-semibold px-5 py-3 rounded-2xl active:scale-98 transition-all flex items-center justify-center gap-2 mb-2">
        <Plus className="w-5 h-5" /> {tri("Registra misura", "Messung speichern", "Save reading")}
      </button>

      <button data-testid="ph-bt-btn" onClick={connectBt} disabled={btBusy}
        className="w-full bg-white dark:bg-[#232A31] border border-[#d5e4f0] dark:border-[#38424B] text-[#2B303B] dark:text-[#e4eff8] font-semibold px-5 py-3 rounded-2xl active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
        <Bluetooth className="w-5 h-5 text-[#3F7CAC]" /> {tri("Collega pH-metro (Bluetooth)", "pH-Meter verbinden (Bluetooth)", "Connect pH meter (Bluetooth)")}
      </button>
      <button data-testid="ph-notif-btn" onClick={askNotif} className="w-full mt-2 text-xs text-[#7E8A93] flex items-center justify-center gap-1">
        <Bell className="w-3.5 h-3.5" /> {tri("Attiva le notifiche del picco", "Peak-Benachrichtigungen aktivieren", "Enable peak notifications")}
      </button>

      {/* Storico */}
      {log.length > 0 && (
        <div className="mt-5" data-testid="ph-log">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-display text-sm font-bold uppercase tracking-wide text-[#3f7cac]">{tri("Storico misure", "Messverlauf", "Reading history")}</h2>
            <button data-testid="ph-clear-btn" onClick={() => setLog([])} className="text-xs text-[#C0574D] flex items-center gap-1"><Trash2 className="w-3.5 h-3.5" /> {tri("Svuota", "Leeren", "Clear")}</button>
          </div>
          <div className="space-y-1.5">
            {log.map((e) => {
              const ok = inWindow(Number(e.ph), Number(e.temp));
              return (
                <div key={e.id} className={`flex items-center justify-between rounded-xl px-3 py-2 border text-sm ${ok ? "bg-[#5aa0cf]/12 border-[#5aa0cf]/30" : "bg-white dark:bg-[#232A31] border-[#d5e4f0] dark:border-[#38424B]"}`}>
                  <span className="font-mono-data font-semibold text-[#2B303B] dark:text-[#e4eff8]">pH {Number(e.ph).toFixed(1)} · {e.temp}°C</span>
                  <span className="text-xs text-[#7E8A93]">{new Date(e.ts).toLocaleTimeString(lang === "de" ? "de-DE" : lang === "en" ? "en-GB" : "it-IT", { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
