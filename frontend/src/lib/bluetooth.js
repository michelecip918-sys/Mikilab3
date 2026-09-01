// Integrazione REALE Web Bluetooth (niente demo). Legge sonde BLE standard
// (Environmental Sensing: temperatura 0x2A6E, umidità 0x2A6F, batteria 0x2A19)
// e invia le letture al backend condiviso. Richiede HTTPS + gesto utente + hardware BLE.
// Nota: il routing AUDIO multi-operatore non è possibile via Web Bluetooth (è nativo/Capacitor);
// qui l'operatore viene solo etichettato sulle letture.
import { api } from "@/lib/api";

const ENV = 0x181a, TEMP = 0x2a6e, HUM = 0x2a6f, BATT_S = 0x180f, BATT = 0x2a19;
let devices = [];

export const isBluetoothSupported = () => typeof navigator !== "undefined" && !!navigator.bluetooth;
export const connectedDevices = () => devices.map((d) => ({ id: d.id, name: d.name, operator: d.operator }));

function postReading(r) {
  api.post("/lab/sensors", r).catch(() => {});
  window.dispatchEvent(new CustomEvent("mikilab-sensor", { detail: r }));
}

export async function connectSensor(operator = "") {
  if (!isBluetoothSupported()) throw new Error("unsupported");
  const device = await navigator.bluetooth.requestDevice({
    filters: [{ services: [ENV] }],
    optionalServices: [BATT_S],
  });
  const server = await device.gatt.connect();
  const name = device.name || "Sonda";
  const id = device.id || name;

  device.addEventListener("gattserverdisconnected", () => {
    devices = devices.filter((d) => d.id !== id);
    window.dispatchEvent(new Event("mikilab-sensor"));
  });

  const env = await server.getPrimaryService(ENV);
  const sub = async (uuid, type, unit, parse) => {
    try {
      const ch = await env.getCharacteristic(uuid);
      try { await ch.startNotifications(); ch.addEventListener("characteristicvaluechanged", (e) => postReading({ device_id: id, name, type, value: parse(e.target.value), unit, operator })); } catch { /* no notify */ }
      try { const v = await ch.readValue(); postReading({ device_id: id, name, type, value: parse(v), unit, operator }); } catch { /* no read */ }
    } catch { /* char assente */ }
  };
  await sub(TEMP, "temperature", "°C", (dv) => dv.getInt16(0, true) / 100);
  await sub(HUM, "humidity", "%", (dv) => dv.getUint16(0, true) / 100);
  try {
    const bs = await server.getPrimaryService(BATT_S);
    const bc = await bs.getCharacteristic(BATT);
    const bv = await bc.readValue();
    postReading({ device_id: id, name, type: "battery", value: bv.getUint8(0), unit: "%", operator });
  } catch { /* no battery */ }

  devices.push({ id, name, operator, device });
  window.dispatchEvent(new Event("mikilab-sensor"));
  return { id, name };
}

export function disconnectAll() {
  devices.forEach((d) => { try { d.device.gatt && d.device.gatt.disconnect(); } catch { /* */ } });
  devices = [];
  window.dispatchEvent(new Event("mikilab-sensor"));
}

export async function loadSensors() { try { const { data } = await api.get("/lab/sensors"); return data || []; } catch { return []; } }
