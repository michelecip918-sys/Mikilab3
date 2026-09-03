#!/usr/bin/env python3
"""Simulatore/ponte sonda IoT MikiLab.
Invia letture reali all'endpoint /api/sensors/reading.
Uso reale: sostituisci read_temp() con la lettura della tua sonda (Milesight/Efento/PT100/DS18B20).

Esempi:
  python sensor_simulator.py --url https://TUO-BACKEND --id cella --temp 4.2      # invio singolo
  python sensor_simulator.py --url https://TUO-BACKEND --id freezer --loop 10     # loop ogni 10s con drift
"""
import argparse, time, random, urllib.request, json

def send(url, sid, temp, unit="°C"):
    data = json.dumps({"id": sid, "temp": round(temp, 1), "unit": unit}).encode()
    req = urllib.request.Request(url.rstrip("/") + "/api/sensors/reading", data=data,
                                 headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=10) as r:
        print(f"[{time.strftime('%H:%M:%S')}] {sid}={temp:.1f}{unit} -> {r.read().decode()}")

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--url", required=True, help="Base URL del backend (es. https://xxx.preview.emergentagent.com)")
    p.add_argument("--id", default="cella", help="id sensore: forno|cella|freezer|frigo")
    p.add_argument("--temp", type=float, help="temperatura singola da inviare")
    p.add_argument("--loop", type=int, default=0, help="intervallo secondi per invio continuo (0=singolo)")
    a = p.parse_args()
    base = {"forno": 210, "cella": 4, "freezer": -18, "frigo": 4}.get(a.id, 4)
    t = a.temp if a.temp is not None else base
    if a.loop <= 0:
        send(a.url, a.id, t); return
    while True:
        t += (base - t) * 0.2 + random.uniform(-0.4, 0.4)
        send(a.url, a.id, t)
        time.sleep(a.loop)

if __name__ == "__main__":
    main()
