import { useRef, useState, useEffect } from "react";
import { ScaleBridge, OvenPLCBridge, hwSupport } from "@/lib/hardwareBridge";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { Scale, Flame, Bluetooth, Usb, Cpu } from "lucide-react";

// Pannello Bilance & PLC: peso live con semaforo vs grammatura, cicli termici forno.
export default function HardwareBridge() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [target, setTarget] = useState(500);
  const [weight, setWeight] = useState(null);
  const [scaleMode, setScaleMode] = useState(null);
  const [temp, setTemp] = useState(240);
  const [minutes, setMinutes] = useState(18);
  const [steam, setSteam] = useState(true);
  const [ovenMode, setOvenMode] = useState(null);
  const [plcMsg, setPlcMsg] = useState(null);
  const scaleRef = useRef(null);
  const ovenRef = useRef(null);

  useEffect(() => () => { try { scaleRef.current && scaleRef.current.disconnect(); } catch (e) { /* */ } try { ovenRef.current && ovenRef.current.disconnect(); } catch (e) { /* */ } }, []);

  const ensureScale = () => { if (!scaleRef.current) scaleRef.current = new ScaleBridge((w) => setWeight(w), (st, m) => setScaleMode(st === "connected" ? m : null)); return scaleRef.current; };
  const ensureOven = () => { if (!ovenRef.current) ovenRef.current = new OvenPLCBridge((st, m) => setOvenMode(st === "connected" ? m : null)); return ovenRef.current; };

  const diff = weight != null ? weight - target : null;
  const pct = weight != null && target ? Math.abs(diff) / target : null;
  const light = pct == null ? "#334155" : pct <= 0.02 ? "#9aa6b2" : pct <= 0.06 ? "#a4afbb" : "#bb8489";

  const sendCycle = async () => {
    const o = ensureOven(); if (!ovenMode) o.simulate();
    const r = await o.setCycle({ temp_c: Number(temp), minutes: Number(minutes), steam });
    setPlcMsg(`${tri("Ciclo inviato", "Zyklus gesendet", "Cycle sent", "Ciclo enviado", "Cycle envoyé", "چرخه ارسال شد")}: ${r.sent}${r.simulated ? " (sim)" : ""}`);
    setTimeout(() => setPlcMsg(null), 4000);
  };

  return (
    <div className="space-y-7" data-testid="hardware-bridge">
      {/* BILANCIA */}
      <div>
        <p className="flex items-center gap-2 font-mono-data text-[10px] tracking-[0.25em] uppercase text-[#64748B] mb-3"><Scale className="w-3.5 h-3.5" /> {tri("Bilancia di precisione", "Präzisionswaage", "Precision scale", "Balanza de precisión", "Balance de précision", "ترازوی دقیق")}</p>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <label className="flex items-center gap-1 bg-[#0C1019] border border-[#64748B]/30 rounded-lg px-2 py-1.5">
            <span className="text-[10px] text-[#7d97ac] uppercase">{tri("Grammatura", "Zielgewicht", "Target", "Objetivo", "Cible", "هدف")}</span>
            <input data-testid="hw-target-input" type="number" value={target} onChange={(e) => setTarget(Number(e.target.value) || 0)} className="w-20 bg-transparent text-sm text-white outline-none text-center" />
            <span className="text-[10px] text-[#64748b]">g</span>
          </label>
          <button data-testid="hw-scale-serial" onClick={async () => { try { await ensureScale().connectSerial(); } catch (e) { alert(e.message); } }} disabled={!hwSupport.serial} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0C1019] border border-[#64748B]/40 text-[#9fc3dc] text-xs font-bold disabled:opacity-40 active:scale-95"><Usb className="w-3.5 h-3.5" /> Serial</button>
          <button data-testid="hw-scale-ble" onClick={async () => { try { await ensureScale().connectBluetooth(); } catch (e) { alert(e.message); } }} disabled={!hwSupport.bluetooth} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0C1019] border border-[#64748B]/40 text-[#9fc3dc] text-xs font-bold disabled:opacity-40 active:scale-95"><Bluetooth className="w-3.5 h-3.5" /> BLE</button>
          <button data-testid="hw-scale-sim" onClick={() => ensureScale().simulate(target)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#64748B]/20 border border-[#64748B]/50 text-[#9fc3dc] text-xs font-bold active:scale-95"><Cpu className="w-3.5 h-3.5" /> {tri("Simula", "Simulieren", "Simulate", "Simular", "Simuler", "شبیه‌سازی")}</button>
        </div>
        <div className="flex items-center gap-4 bg-[#0C1019]/70 border rounded-xl px-4 py-3" style={{ borderColor: `${light}55` }} data-testid="hw-weight-display">
          <span className="relative flex w-4 h-4"><span className="absolute inline-flex w-full h-full rounded-full animate-ping" style={{ background: light, opacity: 0.5 }} /><span className="relative w-4 h-4 rounded-full" style={{ background: light, boxShadow: `0 0 12px ${light}` }} /></span>
          <div className="flex-1">
            <p className="text-3xl font-black tabular-nums" style={{ color: light }}>{weight != null ? `${weight} g` : "— g"}</p>
            <p className="text-[11px] text-[#7d97ac]">{scaleMode ? `${tri("collegata", "verbunden", "connected", "conectada", "connectée", "متصل")} · ${scaleMode}` : tri("non collegata", "getrennt", "not connected", "no conectada", "non connectée", "قطع")}{diff != null ? ` · Δ ${diff > 0 ? "+" : ""}${Math.round(diff * 10) / 10} g` : ""}</p>
          </div>
        </div>
      </div>

      {/* PLC FORNO */}
      <div>
        <p className="flex items-center gap-2 font-mono-data text-[10px] tracking-[0.25em] uppercase text-[#64748B] mb-3"><Flame className="w-3.5 h-3.5" /> {tri("PLC forno · ciclo termico", "Ofen-SPS · Thermozyklus", "Oven PLC · thermal cycle", "PLC horno · ciclo térmico", "API four · cycle thermique", "پی‌ال‌سی فر")}</p>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1 bg-[#0C1019] border border-[#64748B]/30 rounded-lg px-2 py-1.5"><input data-testid="hw-temp-input" type="number" value={temp} onChange={(e) => setTemp(e.target.value)} className="w-16 bg-transparent text-sm text-white outline-none text-center" /><span className="text-[10px] text-[#64748b]">°C</span></label>
          <label className="flex items-center gap-1 bg-[#0C1019] border border-[#64748B]/30 rounded-lg px-2 py-1.5"><input data-testid="hw-min-input" type="number" value={minutes} onChange={(e) => setMinutes(e.target.value)} className="w-14 bg-transparent text-sm text-white outline-none text-center" /><span className="text-[10px] text-[#64748b]">min</span></label>
          <button data-testid="hw-steam" onClick={() => setSteam((v) => !v)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border active:scale-95 ${steam ? "bg-[#9aa6b2]/15 border-[#9aa6b2]/50 text-[#9aa6b2]" : "bg-[#0C1019] border-[#1e293b] text-[#64748b]"}`}>{tri("Vapore", "Dampf", "Steam", "Vapor", "Vapeur", "بخار")}</button>
          <button data-testid="hw-oven-serial" onClick={async () => { try { await ensureOven().connectSerial(); } catch (e) { alert(e.message); } }} disabled={!hwSupport.serial} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0C1019] border border-[#64748B]/40 text-[#9fc3dc] text-xs font-bold disabled:opacity-40 active:scale-95"><Usb className="w-3.5 h-3.5" /> Serial</button>
          <button data-testid="hw-cycle-send" onClick={sendCycle} className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#a4afbb]/15 border border-[#a4afbb]/50 text-[#a4afbb] text-sm font-bold active:scale-95"><Flame className="w-4 h-4" /> {tri("Avvia ciclo", "Zyklus starten", "Start cycle", "Iniciar ciclo", "Démarrer", "شروع چرخه")}</button>
        </div>
        {plcMsg && <p data-testid="hw-plc-msg" className="mt-2 text-sm font-bold text-[#9aa6b2] font-mono-data">{plcMsg}</p>}
        {ovenMode && <p className="mt-1 text-[11px] text-[#7d97ac]">{tri("PLC collegato", "SPS verbunden", "PLC connected", "PLC conectado", "API connecté", "پی‌ال‌سی متصل")} · {ovenMode}</p>}
      </div>

      {!hwSupport.serial && !hwSupport.bluetooth && (
        <p className="text-[11px] text-[#64748b]">{tri("Questo browser non espone Web Serial/Bluetooth: usa 'Simula' per provare. Sui dispositivi del laboratorio (Chrome/Edge) i pulsanti reali collegano bilancia e PLC.", "Dieser Browser bietet kein Web Serial/Bluetooth: 'Simulieren' nutzen.", "This browser has no Web Serial/Bluetooth: use 'Simulate'. On lab devices (Chrome/Edge) the real buttons connect the scale and PLC.", "Este navegador no expone Web Serial/Bluetooth: usa 'Simular'.", "Ce navigateur n'expose pas Web Serial/Bluetooth : utilise 'Simuler'.", "این مرورگر Web Serial/Bluetooth ندارد: از «شبیه‌سازی» استفاده کن.")}</p>
      )}
    </div>
  );
}
