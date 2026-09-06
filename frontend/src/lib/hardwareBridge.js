// Bridge hardware industriale MikiLab Pro — bilance di precisione e PLC forni.
// Web Serial (USB/RS232) + Web Bluetooth (BLE) con FALLBACK SIMULAZIONE integrata,
// così l'interfaccia è testabile senza dispositivi e "funziona" appena colleghi il reale.

export const hwSupport = {
  serial: typeof navigator !== "undefined" && "serial" in navigator,
  bluetooth: typeof navigator !== "undefined" && "bluetooth" in navigator,
};

// Parser generico peso: molte bilance emettono ASCII tipo "ST,GS,+  123.4 g".
export function parseWeight(line) {
  const m = String(line).match(/(-?\d+(?:[.,]\d+)?)\s*(kg|g)?/i);
  if (!m) return null;
  let v = parseFloat(m[1].replace(",", "."));
  if (m[2] && m[2].toLowerCase() === "kg") v *= 1000;
  return isNaN(v) ? null : v;
}

// ---- BILANCIA ----
export class ScaleBridge {
  constructor(onWeight, onStatus) {
    this.onWeight = onWeight || (() => {});
    this.onStatus = onStatus || (() => {});
    this.mode = null; this._stop = false; this._port = null; this._sim = null;
  }
  async connectSerial(baudRate = 9600) {
    if (!hwSupport.serial) throw new Error("Web Serial non supportato");
    const port = await navigator.serial.requestPort();
    await port.open({ baudRate });
    this._port = port; this.mode = "serial"; this.onStatus("connected", "serial");
    const dec = new TextDecoderStream();
    port.readable.pipeTo(dec.writable).catch(() => {});
    const reader = dec.readable.getReader();
    let buf = "";
    (async () => {
      try {
        while (!this._stop) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += value || "";
          let idx;
          while ((idx = buf.search(/[\r\n]/)) >= 0) {
            const line = buf.slice(0, idx); buf = buf.slice(idx + 1);
            const w = parseWeight(line);
            if (w != null) this.onWeight(w);
          }
        }
      } catch (e) { /* */ }
    })();
  }
  async connectBluetooth() {
    if (!hwSupport.bluetooth) throw new Error("Web Bluetooth non supportato");
    // Weight Scale Service standard (0x181D) / Weight Measurement (0x2A9D)
    const dev = await navigator.bluetooth.requestDevice({ filters: [{ services: [0x181d] }], optionalServices: [0x181d] });
    const server = await dev.gatt.connect();
    const svc = await server.getPrimaryService(0x181d);
    const ch = await svc.getCharacteristic(0x2a9d);
    await ch.startNotifications();
    this.mode = "bluetooth"; this.onStatus("connected", "bluetooth");
    ch.addEventListener("characteristicvaluechanged", (ev) => {
      const dv = ev.target.value;
      // campo peso a offset 1, uint16, risoluzione 5g (SIG) → grammi
      try { const raw = dv.getUint16(1, true); this.onWeight(raw * 0.005 * 1000); } catch (e) { /* */ }
    });
  }
  simulate(target = 500) {
    this.mode = "sim"; this.onStatus("connected", "sim");
    let w = 0; const step = Math.max(3, target / 60);
    this._sim = setInterval(() => {
      if (this._stop) return;
      w += step * (0.7 + Math.random() * 0.6);
      if (w > target * 1.02) w = target * (0.98 + Math.random() * 0.04); // oscilla attorno al target
      this.onWeight(Math.round(w * 10) / 10);
    }, 250);
  }
  async disconnect() {
    this._stop = true;
    if (this._sim) clearInterval(this._sim);
    try { if (this._port) await this._port.close(); } catch (e) { /* */ }
    this.mode = null; this.onStatus("disconnected");
  }
}

// ---- PLC FORNO (ciclo termico) ----
export class OvenPLCBridge {
  constructor(onStatus) { this.onStatus = onStatus || (() => {}); this.mode = null; this._port = null; }
  async connectSerial(baudRate = 9600) {
    if (!hwSupport.serial) throw new Error("Web Serial non supportato");
    const port = await navigator.serial.requestPort();
    await port.open({ baudRate });
    this._port = port; this.mode = "serial"; this.onStatus("connected", "serial");
  }
  simulate() { this.mode = "sim"; this.onStatus("connected", "sim"); }
  // Invia il ciclo termico all'avvio ricetta: {temp_c, minutes, steam?}
  async setCycle(cycle) {
    const cmd = `SET TEMP=${cycle.temp_c} TIME=${cycle.minutes}${cycle.steam ? " STEAM=1" : ""}\r\n`;
    if (this.mode === "serial" && this._port && this._port.writable) {
      const w = this._port.writable.getWriter();
      await w.write(new TextEncoder().encode(cmd));
      w.releaseLock();
      return { ok: true, sent: cmd.trim() };
    }
    // simulazione: ack immediato
    return { ok: true, sent: cmd.trim(), simulated: true };
  }
  async disconnect() { try { if (this._port) await this._port.close(); } catch (e) { /* */ } this.mode = null; this.onStatus("disconnected"); }
}
