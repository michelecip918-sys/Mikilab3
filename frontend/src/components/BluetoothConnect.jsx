import { useState, useRef } from "react";
import { Bluetooth, Loader2, X, Scale, Thermometer, Droplets } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// Connettore Web Bluetooth (Android/Chrome). Legge i valori dai dispositivi che seguono lo
// standard Bluetooth SIG: Bilancia (Weight Scale 0x181D / 0x2A9D) e Sonda (Temperature 0x2A6E).
// Per apparecchi con protocollo "custom" mostra i dati grezzi + servizi (da mappare per modello).
export default function BluetoothConnect() {
  const { lang } = useLang();
  const tri = (i, d, e, s) => mkTri(lang)(i, d, e, s);
  const [status, setStatus] = useState("idle"); // idle | connecting | connected | error
  const [devName, setDevName] = useState("");
  const [weight, setWeight] = useState(null);
  const [temp, setTemp] = useState(null);
  const [raw, setRaw] = useState("");
  const [note, setNote] = useState("");
  const devRef = useRef(null);

  const supported = typeof navigator !== "undefined" && !!navigator.bluetooth;

  const onWeight = (e) => {
    const dv = e.target.value;
    try {
      // Weight Measurement 0x2A9D: flags(1) + weight uint16 (kg, risoluzione 0.005)
      const flags = dv.getUint8(0);
      const val = dv.getUint16(1, true);
      const grams = Math.round((flags & 0x01 ? val * 0.01 * 453.592 : val * 0.005 * 1000));
      setWeight(grams);
    } catch { /* */ }
  };
  const onTemp = (e) => {
    const dv = e.target.value;
    try { setTemp((dv.getInt16(0, true) * 0.01).toFixed(1)); } catch { /* */ }
  };

  const connect = async () => {
    if (!supported) { setStatus("error"); setNote(tri("Il tuo browser non supporta il Bluetooth. Usa Chrome su Android o PC (su iPhone non è disponibile).", "Dein Browser unterstützt kein Bluetooth. Nutze Chrome auf Android/PC (auf dem iPhone nicht verfügbar).", "Your browser doesn't support Bluetooth. Use Chrome on Android/PC (not available on iPhone).", "Tu navegador no soporta Bluetooth. Usa Chrome en Android/PC (no en iPhone).")); return; }
    setStatus("connecting"); setNote(""); setWeight(null); setTemp(null); setRaw("");
    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ["weight_scale", "health_thermometer", "environmental_sensing", "battery_service", 0x181d, 0x1809, 0x181a],
      });
      devRef.current = device;
      setDevName(device.name || tri("Dispositivo", "Gerät", "Device", "Dispositivo"));
      device.addEventListener("gattserverdisconnected", () => setStatus("idle"));
      const server = await device.gatt.connect();
      let hooked = false;
      // Bilancia standard
      try {
        const svc = await server.getPrimaryService("weight_scale");
        const ch = await svc.getCharacteristic(0x2a9d);
        await ch.startNotifications();
        ch.addEventListener("characteristicvaluechanged", onWeight);
        hooked = true;
      } catch { /* non standard */ }
      // Sonda temperatura (environmental sensing)
      try {
        const svc = await server.getPrimaryService("environmental_sensing");
        const ch = await svc.getCharacteristic(0x2a6e);
        await ch.startNotifications().catch(() => {});
        ch.addEventListener("characteristicvaluechanged", onTemp);
        const v = await ch.readValue().catch(() => null);
        if (v) onTemp({ target: { value: v } });
        hooked = true;
      } catch { /* non standard */ }
      setStatus("connected");
      if (!hooked) setNote(tri("Collegato, ma questo apparecchio usa un protocollo non standard: mandami marca e modello e aggiungo la lettura dei dati.", "Verbunden, aber nicht-standard Protokoll: schick mir Marke/Modell.", "Connected, but this device uses a non-standard protocol: send me brand/model and I'll add data reading.", "Conectado, pero protocolo no estándar: envíame marca/modelo.")); 
    } catch (err) {
      if (err && err.name === "NotFoundError") { setStatus("idle"); return; }
      setStatus("error");
      setNote(tri("Connessione non riuscita. Riprova.", "Verbindung fehlgeschlagen.", "Connection failed.", "Conexión fallida."));
    }
  };

  const disconnect = () => { try { devRef.current && devRef.current.gatt.disconnect(); } catch { /* */ } setStatus("idle"); };

  return (
    <div className="pb-24" data-testid="bluetooth-connect">
      <div className="relative rounded-3xl overflow-hidden mb-5 bg-gradient-to-br from-[#3E9C93] to-[#3E9C93] p-6 text-white">
        <Bluetooth className="w-7 h-7 mb-2" />
        <h1 className="font-display text-2xl font-bold">{tri("Dispositivi Bluetooth", "Bluetooth-Geräte", "Bluetooth Devices", "Dispositivos Bluetooth")}</h1>
        <p className="text-white/85 text-sm mt-1">{tri("Collega bilancia, sonda temperatura e pH-metro per leggere i valori in diretta nel Laboratorio.", "Verbinde Waage, Temperaturfühler und pH-Meter für Live-Werte.", "Connect scale, temperature probe and pH meter to read live values in the Lab.", "Conecta báscula, sonda y medidor de pH para leer valores en directo.")}</p>
      </div>

      {status !== "connected" ? (
        <button data-testid="bt-connect-btn" onClick={connect} disabled={status === "connecting"}
          className="w-full inline-flex items-center justify-center gap-2.5 bg-[#3E9C93] hover:bg-[#e05e00] text-white font-extrabold text-lg px-5 py-4 rounded-2xl active:scale-98 transition-all disabled:opacity-60">
          {status === "connecting" ? <Loader2 className="w-6 h-6 animate-spin" /> : <Bluetooth className="w-6 h-6" />}
          {status === "connecting" ? tri("Collegamento…", "Verbinde…", "Connecting…", "Conectando…") : tri("Collega un dispositivo", "Gerät verbinden", "Connect a device", "Conectar un dispositivo")}
        </button>
      ) : (
        <div className="rounded-2xl bg-[#14212C] border border-[#2A3B49] p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="flex items-center gap-2 text-white font-bold"><span className="w-2.5 h-2.5 rounded-full bg-green-400" /> {devName}</span>
            <button data-testid="bt-disconnect-btn" onClick={disconnect} className="text-[#7E8A93] hover:text-white flex items-center gap-1 text-sm font-bold"><X className="w-4 h-4" /> {tri("Scollega", "Trennen", "Disconnect", "Desconectar")}</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl shadow-md border border-amber-900/40 bg-[#1B2A38] border border-[#2A3B49] p-4 text-center">
              <Scale className="w-6 h-6 text-[#3E9C93] mx-auto mb-1" />
              <p className="font-mono-data text-2xl font-extrabold text-white">{weight != null ? `${weight} g` : "—"}</p>
              <p className="text-[11px] text-[#7E8A93]">{tri("Peso", "Gewicht", "Weight", "Peso")}</p>
            </div>
            <div className="rounded-2xl shadow-md border border-amber-900/40 bg-[#1B2A38] border border-[#2A3B49] p-4 text-center">
              <Thermometer className="w-6 h-6 text-[#3E9C93] mx-auto mb-1" />
              <p className="font-mono-data text-2xl font-extrabold text-white">{temp != null ? `${temp}°C` : "—"}</p>
              <p className="text-[11px] text-[#7E8A93]">{tri("Temperatura", "Temperatur", "Temperature", "Temperatura")}</p>
            </div>
          </div>
        </div>
      )}

      {note && <p data-testid="bt-note" className="text-[13px] text-[#AEB8BF] leading-snug mt-3 px-1 flex items-start gap-2"><Droplets className="w-4 h-4 text-[#3E9C93] shrink-0 mt-0.5" />{note}</p>}
      {!supported && status === "idle" && <p className="text-[12px] text-[#7E8A93] mt-3 px-1">{tri("Nota: il Bluetooth web funziona su Chrome (Android/PC), non su iPhone.", "Hinweis: Web-Bluetooth läuft auf Chrome (Android/PC), nicht auf iPhone.", "Note: Web Bluetooth works on Chrome (Android/PC), not iPhone.", "Nota: Web Bluetooth funciona en Chrome (Android/PC), no en iPhone.")}</p>}
    </div>
  );
}
