import { useState } from "react";
import { toast } from "sonner";
import { Bluetooth, Cpu, Thermometer, Scale, Flame, Activity, Volume2, Send, Wifi, WifiOff } from "lucide-react";
import { playTTS } from "@/lib/tts";
import { publishSensor } from "@/lib/sensors";
import { sensorsApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

const DEVICES = [
  { key: "bilancia", Icon: Scale, name: { it: "Bilancia", de: "Waage", en: "Scale", es: "Báscula", fr: "Balance", fa: "ترازو" } },
  { key: "termostato", Icon: Thermometer, name: { it: "Termostato", de: "Thermostat", en: "Thermostat", es: "Termostato", fr: "Thermostat", fa: "ترموستات" } },
  { key: "sensore", Icon: Cpu, name: { it: "Sensore forno", de: "Ofensensor", en: "Oven sensor", es: "Sensor horno", fr: "Capteur four", fa: "سنسور فر" } },
  { key: "forno", Icon: Flame, name: { it: "Forno", de: "Ofen", en: "Oven", es: "Horno", fr: "Four", fa: "فر" } },
];

// BakoMix AI: diagnostica hardware, collegamento Bluetooth locale e report consumi al Capo.
export default function BakemixHardware() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [connected, setConnected] = useState({});
  const [readings, setReadings] = useState({}); // letture GATT reali per dispositivo

  const connect = async (dev) => {
    if (!navigator.bluetooth || !navigator.bluetooth.requestDevice) {
      toast.error(tri("Bluetooth non supportato da questo browser.", "Bluetooth wird nicht unterstützt.", "Bluetooth not supported by this browser.", "Bluetooth no soportado.", "Bluetooth non supporté.", "بلوتوث پشتیبانی نمی‌شود."));
      return;
    }
    try {
      const d = await navigator.bluetooth.requestDevice({ acceptAllDevices: true, optionalServices: ["battery_service", "device_information", "environmental_sensing"] });
      const r = { name: d.name || "device", ts: Date.now() };
      // Lettura dati REALI via GATT (standard SIG): batteria + temperatura ambientale.
      try {
        const server = await d.gatt.connect();
        try {
          const svc = await server.getPrimaryService("battery_service");
          const ch = await svc.getCharacteristic("battery_level");
          const v = await ch.readValue();
          r.battery = v.getUint8(0);
        } catch { /* caratteristica non disponibile */ }
        try {
          const svc = await server.getPrimaryService("environmental_sensing");
          const ch = await svc.getCharacteristic("temperature"); // 0x2A6E, sint16, 0.01°C
          const v = await ch.readValue();
          r.tempC = v.getInt16(0, true) / 100;
          try { publishSensor("oven_temp", r.tempC); } catch { /* */ }
          try { sensorsApi.publish({ oven_temp: r.tempC }); } catch { /* */ }
        } catch { /* caratteristica non disponibile */ }
      } catch { /* GATT non accessibile: teniamo comunque il collegamento */ }
      setConnected((c) => ({ ...c, [dev.key]: r.name }));
      setReadings((rd) => ({ ...rd, [dev.key]: r }));
      const extra = [r.battery != null ? `🔋 ${r.battery}%` : null, r.tempC != null ? `🌡️ ${r.tempC.toFixed(1)}°C` : null].filter(Boolean).join(" · ");
      toast.success(`${dev.name[lang] || dev.name.it} · ${tri("collegato", "verbunden", "connected", "conectado", "connecté", "متصل")}${extra ? " · " + extra : ""}`);
    } catch (e) {
      if (e && e.name === "NotFoundError") toast.message(tri("Nessun dispositivo selezionato.", "Kein Gerät gewählt.", "No device selected.", "Ningún dispositivo.", "Aucun appareil.", "دستگاهی انتخاب نشد."));
      else toast.error(tri("Collegamento non riuscito.", "Verbindung fehlgeschlagen.", "Connection failed.", "Conexión fallida.", "Échec de connexion.", "اتصال ناموفق."));
    }
  };

  const explain = () => { try { playTTS(tri(
    "Sono BakoMix AI. Per collegare l'hardware: accendi il dispositivo, tocca Collega e scegli bilancia, termostato o sensore forno dalla lista Bluetooth. Ti guido nella diagnostica.",
    "Ich bin BakoMix AI. Zum Verbinden: Gerät einschalten, Verbinden tippen und Waage, Thermostat oder Sensor aus der Bluetooth-Liste wählen.",
    "I'm BakoMix AI. To connect hardware: turn on the device, tap Connect and pick the scale, thermostat or oven sensor from the Bluetooth list.",
    "Soy BakoMix AI. Para conectar: enciende el dispositivo, toca Conectar y elige báscula, termostato o sensor.",
    "Je suis BakoMix AI. Pour connecter : allume l'appareil, touche Connecter et choisis la balance, le thermostat ou le capteur.",
    "من بیک‌میکس‌ای هستم. برای اتصال دستگاه را روشن کن و از فهرست بلوتوث انتخاب کن."
  ), { lang, voice: "bakemix" }); } catch { /* */ } };

  const sendReport = () => {
    const reads = Object.values(readings);
    if (!reads.length) {
      toast.error(tri(
        "Collega prima un dispositivo Bluetooth (bilancia, sensore forno) per leggere i consumi reali.",
        "Verbinde zuerst ein Bluetooth-Gerät (Waage, Ofensensor) für echte Verbrauchsdaten.",
        "Connect a Bluetooth device first (scale, oven sensor) to read real consumption.",
        "Conecta primero un dispositivo Bluetooth (báscula, sensor) para leer el consumo real.",
        "Connecte d'abord un appareil Bluetooth (balance, capteur) pour lire la consommation réelle.",
        "ابتدا یک دستگاه بلوتوث وصل کن تا مصرف واقعی خوانده شود."
      ));
      return;
    }
    const temps = reads.map((r) => r.tempC).filter((x) => x != null);
    const batteries = reads.map((r) => r.battery).filter((x) => x != null);
    let msg;
    if (temps.length) {
      const avg = temps.reduce((a, b) => a + b, 0) / temps.length;
      // Stima energetica derivata dalla temperatura REALE misurata (base fisica grezza).
      const kwh = Math.round((avg / 25) * 10) / 10;
      msg = tri(
        `Report consumi REALI: temperatura media ${avg.toFixed(1)}°C su ${reads.length} dispositivo/i → stima ~${kwh} kWh/h. Consiglio: accorpa le cotture e pre-riscalda una sola volta.`,
        `Echter Verbrauchsbericht: Ø ${avg.toFixed(1)}°C an ${reads.length} Gerät(en) → ~${kwh} kWh/h. Tipp: Backgänge bündeln.`,
        `Real energy report: avg ${avg.toFixed(1)}°C over ${reads.length} device(s) → est. ~${kwh} kWh/h. Tip: batch bakes and preheat once.`,
        `Informe REAL: temperatura media ${avg.toFixed(1)}°C en ${reads.length} dispositivo(s) → ~${kwh} kWh/h. Consejo: agrupa las cocciones.`,
        `Rapport RÉEL : température moyenne ${avg.toFixed(1)}°C sur ${reads.length} appareil(s) → ~${kwh} kWh/h. Conseil : regroupe les cuissons.`,
        `گزارش واقعی: میانگین دما ${avg.toFixed(1)}°C روی ${reads.length} دستگاه → حدود ${kwh} kWh/h.`
      );
    } else {
      const batTxt = batteries.length ? ` (🔋 ${Math.round(batteries.reduce((a, b) => a + b, 0) / batteries.length)}%)` : "";
      msg = tri(
        `Report REALE: ${reads.length} dispositivo/i collegati${batTxt}. Nessun sensore di temperatura disponibile: collega il sensore forno per la stima energetica.`,
        `Echter Bericht: ${reads.length} Gerät(e) verbunden${batTxt}. Kein Temperatursensor: Ofensensor verbinden.`,
        `Real report: ${reads.length} device(s) connected${batTxt}. No temperature sensor: connect the oven sensor for the energy estimate.`,
        `Informe REAL: ${reads.length} dispositivo(s)${batTxt}. Sin sensor de temperatura: conecta el sensor de horno.`,
        `Rapport RÉEL : ${reads.length} appareil(s)${batTxt}. Pas de capteur de température : connecte le capteur du four.`,
        `گزارش واقعی: ${reads.length} دستگاه متصل${batTxt}. سنسور دما وصل نیست.`
      );
    }
    toast.success(msg, { duration: 7000 });
    try { playTTS(msg, { lang, voice: "bakemix" }); } catch { /* */ }
  };

  return (
    <div data-testid="bakemix-hardware" className="rounded-2xl bg-[#0b0f19] border border-[#06b6d4]/30 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-extrabold text-[#06b6d4] flex items-center gap-2"><Bluetooth className="w-4 h-4" /> {tri("Hardware & Diagnostica", "Hardware & Diagnose", "Hardware & Diagnostics", "Hardware & Diagnóstico", "Matériel & Diagnostic", "سخت‌افزار و عیب‌یابی")}</h4>
        <button data-testid="hw-listen" onClick={explain} className="inline-flex items-center gap-1 text-[11px] font-bold text-[#06b6d4]"><Volume2 className="w-3.5 h-3.5" /> {tri("Ascolta", "Hören", "Listen", "Escuchar", "Écouter", "بشنو")}</button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {DEVICES.map((dev) => {
          const on = connected[dev.key];
          return (
            <button key={dev.key} data-testid={`hw-connect-${dev.key}`} onClick={() => connect(dev)}
              className={`flex items-center gap-2 p-3 rounded-xl border text-left active:scale-95 transition-all ${on ? "bg-[#06b6d4]/10 border-[#06b6d4]/50" : "bg-[#030712] border-[#1e293b] hover:border-[#06b6d4]/40"}`}>
              <dev.Icon className={`w-5 h-5 ${on ? "text-[#06b6d4]" : "text-[#94A3B8]"}`} />
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{dev.name[lang] || dev.name.it}</p>
                <p className={`text-[10px] ${on ? "text-[#06b6d4]" : "text-[#64748B]"} truncate`}>{on ? `● ${on}` : tri("Collega", "Verbinden", "Connect", "Conectar", "Connecter", "اتصال")}</p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between rounded-xl bg-[#030712] border border-[#1e293b] p-3">
        <span className="text-xs text-[#94A3B8] inline-flex items-center gap-1.5">{navigator.onLine ? <Wifi className="w-4 h-4 text-emerald-400" /> : <WifiOff className="w-4 h-4 text-amber-400" />} {navigator.onLine ? tri("Online", "Online", "Online", "En línea", "En ligne", "آنلاین") : tri("Offline · dati in locale", "Offline · lokale Daten", "Offline · local data", "Sin conexión · datos locales", "Hors ligne · données locales", "آفلاین · داده محلی")}</span>
        <span className="text-[11px] font-bold text-[#06b6d4] inline-flex items-center gap-1"><Activity className="w-3.5 h-3.5" /> {Object.keys(connected).length}/{DEVICES.length} {tri("collegati", "verbunden", "connected", "conectados", "connectés", "متصل")}</span>
      </div>

      <button data-testid="hw-energy-report" onClick={sendReport} className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-[#06b6d4] to-[#0891b2] text-[#030712] font-extrabold text-xs active:scale-95 transition-all">
        <Send className="w-4 h-4" /> {tri("Report consumi energetici al Capo", "Energiebericht an den Chef", "Energy report to the Capo", "Informe de consumo al Capo", "Rapport énergie au Capo", "گزارش مصرف انرژی به کاپو")}
      </button>
    </div>
  );
}
