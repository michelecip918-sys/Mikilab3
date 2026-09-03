import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { cleanForSpeech } from "@/lib/voice";

const speak = (msg) => {
  if ("speechSynthesis" in window) {
    const u = new SpeechSynthesisUtterance(cleanForSpeech(msg));
    u.lang = "it-IT"; u.rate = 0.98;
    window.speechSynthesis.speak(u);
  }
};

// Parco macchine: 1 manuale (impastatrice) + termiche con sensore IoT simulato live.
const DEFS = [
  { id: "impastatrice", name: "Impastatrice Spirale 50kg", kind: "manual", states: ["Pronta", "In uso", "Ferma"], colors: ["#10b981", "#f59e0b", "#94a3b8"] },
  { id: "forno", name: "Forno Rotativo a Carrello", kind: "thermal", hot: true, base: 210, min: 190, max: 230, unit: "°C" },
  { id: "cella", name: "Armadio Fermo-Lievitazione", kind: "thermal", base: 4, min: 2, max: 6, unit: "°C" },
  { id: "freezer", name: "Freezer", kind: "thermal", base: -18, min: -22, max: -15, unit: "°C" },
  { id: "frigo", name: "Frigorifero", kind: "thermal", base: 4, min: 2, max: 6, unit: "°C" },
];

const thermalStatus = (d, temp, min, max) => {
  const alarm = temp > max;
  if (d.hot) {
    if (alarm) return { status: "Surriscaldato", color: "#E63946", alarm: true };
    if (temp < min) return { status: "In riscaldamento", color: "#f59e0b", alarm: false };
    return { status: "In temperatura", color: "#10b981", alarm: false };
  }
  if (alarm) return { status: "Allarme caldo", color: "#E63946", alarm: true };
  return { status: temp < min ? "Molto fredda" : "OK", color: temp < min ? "#f59e0b" : "#10b981", alarm: false };
};

const lsGet = (k, fb) => { try { return JSON.parse(localStorage.getItem(k) || "null") ?? fb; } catch { return fb; } };

const Ctx = createContext(null);
export const useMachines = () => useContext(Ctx);

export function MachinesProvider({ children }) {
  const [manual, setManual] = useState({ impastatrice: 0 });
  const [temps, setTemps] = useState(() => Object.fromEntries(DEFS.filter((d) => d.kind === "thermal").map((d) => [d.id, d.base])));
  const [faults, setFaults] = useState({});
  const [ranges, setRanges] = useState(() => lsGet("mikilab_sensor_ranges", {}));
  const [history, setHistory] = useState(() => lsGet("mikilab_alarm_history", []));
  const faultsRef = useRef(faults); faultsRef.current = faults;
  const rangesRef = useRef(ranges); rangesRef.current = ranges;
  const prevAlarm = useRef({});

  useEffect(() => { try { localStorage.setItem("mikilab_sensor_ranges", JSON.stringify(ranges)); } catch { /* */ } }, [ranges]);
  useEffect(() => { try { localStorage.setItem("mikilab_alarm_history", JSON.stringify(history)); } catch { /* */ } }, [history]);

  useEffect(() => {
    const iv = setInterval(() => {
      setTemps((prev) => {
        const next = { ...prev };
        DEFS.filter((d) => d.kind === "thermal").forEach((d) => {
          const eMax = rangesRef.current[d.id]?.max ?? d.max;
          const target = faultsRef.current[d.id] ? (d.hot ? eMax + 25 : eMax + 6) : d.base;
          const noise = (Math.random() - 0.5) * (d.hot ? 2 : 0.3);
          next[d.id] = Math.round((prev[d.id] + (target - prev[d.id]) * 0.35 + noise) * 10) / 10;
        });
        return next;
      });
    }, 2500);
    return () => clearInterval(iv);
  }, []);

  const thermal = DEFS.filter((d) => d.kind === "thermal").map((d) => {
    const temp = temps[d.id];
    const min = ranges[d.id]?.min ?? d.min;
    const max = ranges[d.id]?.max ?? d.max;
    const s = thermalStatus(d, temp, min, max);
    return { id: d.id, name: d.name, temp, unit: d.unit, min, max, ...s };
  });

  // Allarme termico in cuffia + storico allarmi (inizio/fine/picco)
  useEffect(() => {
    thermal.forEach((t) => {
      const was = prevAlarm.current[t.id];
      if (t.alarm && !was) {
        speak(`Allarme termico: ${t.name}. Temperatura ${Math.round(t.temp)} gradi.`);
        setHistory((h) => [{ id: t.id, name: t.name, start: Date.now(), end: null, peak: t.temp }, ...h].slice(0, 50));
      } else if (!t.alarm && was) {
        setHistory((h) => { const i = h.findIndex((x) => x.id === t.id && !x.end); if (i < 0) return h; const nx = [...h]; nx[i] = { ...nx[i], end: Date.now() }; return nx; });
      } else if (t.alarm && was) {
        setHistory((h) => { const i = h.findIndex((x) => x.id === t.id && !x.end); if (i < 0 || t.temp <= h[i].peak) return h; const nx = [...h]; nx[i] = { ...nx[i], peak: t.temp }; return nx; });
      }
      prevAlarm.current[t.id] = t.alarm;
    });
  });

  const machines = DEFS.map((d) => {
    if (d.kind === "manual") { const i = manual[d.id] ?? 0; return { id: d.id, name: d.name, kind: "manual", status: d.states[i], color: d.colors[i] }; }
    return { kind: "thermal", ...thermal.find((t) => t.id === d.id) };
  });
  const toolsRow = machines.filter((m) => ["impastatrice", "forno", "cella"].includes(m.id));

  const cycle = useCallback((id) => setManual((p) => { const d = DEFS.find((x) => x.id === id); if (!d || d.kind !== "manual") return p; return { ...p, [id]: ((p[id] ?? 0) + 1) % d.states.length }; }), []);
  const simulateFault = useCallback((id) => setFaults((f) => ({ ...f, [id]: true })), []);
  const clearFault = useCallback((id) => setFaults((f) => ({ ...f, [id]: false })), []);
  const setRange = useCallback((id, min, max) => setRanges((r) => ({ ...r, [id]: { min: Number(min), max: Number(max) } })), []);
  const clearHistory = useCallback(() => setHistory([]), []);

  return <Ctx.Provider value={{ machines, toolsRow, thermal, faults, ranges, history, cycle, simulateFault, clearFault, setRange, clearHistory }}>{children}</Ctx.Provider>;
}
