import { useEffect, useRef, useState, useCallback } from "react";
import { Radar, ChevronDown, ChevronUp, Volume2, VolumeX } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { toast } from "sonner";
import { playTTS } from "@/lib/tts";
import SpeakingAvatar from "@/components/SpeakingAvatar";
import { PROACTIVE_MODULES, moduleName, moduleMsg } from "@/lib/proactiveModules";
import { loadSensors } from "@/lib/bluetooth";

// Motore proattivo DEMO: le 21 innovazioni girano sempre-attive in sottofondo.
// Quando una soglia SIMULATA viene superata, l'avatar (Lab operativo / Momi tutor)
// interviene a voce. Valori simulati — chiaramente etichettati DEMO.
export default function ProactiveAssistant() {
  const { lang } = useLang();
  const tri = (i, d, e, s) => mkTri(lang)(i, d, e, s);
  const [open, setOpen] = useState(false);
  const [muted, setMuted] = useState(() => { try { return localStorage.getItem("mikilab_proactive_muted") === "1"; } catch { return false; } });
  const [speaking, setSpeaking] = useState(null); // { persona, name }
  const [feed, setFeed] = useState([]);
  const mutedRef = useRef(muted);
  useEffect(() => { mutedRef.current = muted; try { localStorage.setItem("mikilab_proactive_muted", muted ? "1" : "0"); } catch { /* */ } }, [muted]);

  const fire = useCallback((mod) => {
    const m = mod || PROACTIVE_MODULES[Math.floor(Math.random() * PROACTIVE_MODULES.length)];
    const label = moduleName(m, lang);
    const text = moduleMsg(m, lang);
    setFeed((f) => [{ id: Date.now(), persona: m.persona, label, text }, ...f].slice(0, 4));
    if (mutedRef.current) {
      // Voce OFF: feedback solo via toast (nessun overlay).
      toast(`${m.persona === "momi" ? "Momi" : "Mickey Lab"} · ${label}`, { description: text });
      return;
    }
    // Voce ON: mostro l'avatar overlay (che porta già il testo) e parlo.
    setSpeaking({ persona: m.persona, name: label });
    playTTS(text, {
      lang,
      voice: m.persona === "momi" ? "momy" : "michele",
    });
    // Mantengo l'overlay un tempo minimo VISIBILE anche se la TTS non parte (headless/autoplay).
    setTimeout(() => setSpeaking((s) => (s && s.name === label ? null : s)), 5000);
  }, [lang]);

  // Motore REALE: legge i sensori dal backend (Web Bluetooth) e interviene solo su
  // soglie REALI. Se nessuna sonda è collegata, l'assistente resta in silenzio.
  const firedRef = useRef({});
  useEffect(() => {
    const M = (id) => PROACTIVE_MODULES.find((x) => x.id === id);
    const check = async () => {
      const now = Date.now();
      const readings = await loadSensors();
      const canFire = (k) => now - (firedRef.current[k] || 0) > 300000; // cooldown 5 min
      const doFire = (k, m) => { if (!m) return; firedRef.current[k] = now; fire(m); };
      for (const s of readings) {
        let age = Infinity; try { age = now - new Date(s.at).getTime(); } catch { /* */ }
        if (age > 120000) continue; // ignora letture vecchie (>2 min)
        const v = Number(s.value);
        if (s.type === "temperature" && v >= 26 && canFire("temp")) { doFire("temp", M("thermal_dough")); break; }
        if (s.type === "humidity" && v <= 55 && canFire("hum")) { doFire("hum", M("climate_timer")); break; }
        if (s.type === "battery" && v <= 15 && canFire("batt")) { doFire("batt", M("flour_dust")); break; }
      }
    };
    check();
    const iv = setInterval(check, 15000);
    const onSensor = () => check();
    window.addEventListener("mikilab-sensor", onSensor);
    return () => { clearInterval(iv); window.removeEventListener("mikilab-sensor", onSensor); };
  }, [fire]);

  // Trigger programmatico (per i test): window event con { id }.
  useEffect(() => {
    const onTrig = (e) => { const id = e.detail && e.detail.id; const m = PROACTIVE_MODULES.find((x) => x.id === id); if (m) fire(m); };
    window.addEventListener("mikilab-proactive-trigger", onTrig);
    return () => window.removeEventListener("mikilab-proactive-trigger", onTrig);
  }, [fire]);

  return (
    <>
      {/* Avatar 3D vocale in overlay: appare quando un avatar interviene */}
      {speaking && (
        <div data-testid="proactive-avatar-overlay" className="fixed inset-x-0 top-20 z-[70] flex justify-center pointer-events-none px-3">
          <div className="flex items-center gap-3 rounded-2xl bg-[#121722]/95 backdrop-blur border border-[#F26419]/50 px-3.5 py-2.5 shadow-2xl max-w-sm">
            <SpeakingAvatar who={speaking.persona === "momi" ? "momi" : "lab"} active mode="speaking" size={52} testid="proactive-avatar" />
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#F26419]">{speaking.persona === "momi" ? "Momi" : "Mickey Lab"} · <span className="text-white/70">{speaking.name}</span></p>
              <p className="text-[12px] text-white leading-snug truncate">{feed[0]?.text}</p>
            </div>
          </div>
        </div>
      )}

      {/* Pannello "sotto il cofano": stato dei 21 moduli always-on (collassato) */}
      <div data-testid="proactive-panel" className="rounded-2xl bg-white dark:bg-[#18202E] border border-[#26324A] overflow-hidden mb-4">
        <button data-testid="proactive-toggle" onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between gap-2 px-3.5 py-3">
          <span className="flex items-center gap-2 text-sm font-bold text-[#2B303B] dark:text-[#e4eff8]">
            <span className="relative flex w-2.5 h-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-70" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#22c55e]" />
            </span>
            <Radar className="w-4 h-4 text-[#F26419]" />
            {tri("Assistente Proattivo", "Proaktiver Assistent", "Proactive Assistant", "Asistente Proactivo")}
            <span className="text-[9px] font-extrabold bg-[#22c55e] text-white px-1.5 py-0.5 rounded-full uppercase">LIVE</span>
          </span>
          <span className="flex items-center gap-2 text-[11px] text-[#7E8A93]">21 {tri("moduli attivi", "Module aktiv", "modules on", "módulos")}{open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</span>
        </button>
        {open && (
          <div className="px-3.5 pb-3.5 border-t border-[#26324A]">
            <p className="text-[11px] text-[#7E8A93] leading-snug my-2">
              {tri("Sensori e moduli IA collegati alle sonde Bluetooth REALI del laboratorio. Gli avatar intervengono a voce solo su anomalie o consigli reali. Se nessuna sonda è collegata, restano in silenzio.",
                "Sensoren und KI-Module mit ECHTEN Bluetooth-Sonden verbunden. Avatare sprechen nur bei echten Anomalien. Ohne verbundene Sonde bleiben sie still.",
                "Sensors and AI modules connected to the lab's REAL Bluetooth probes. Avatars speak only on real anomalies or tips. With no probe connected they stay silent.",
                "Sensores y módulos IA conectados a sondas Bluetooth REALES. Los avatares intervienen solo ante anomalías reales. Sin sonda, permanecen en silencio.")}
            </p>
            <div className="flex items-center gap-2 mb-3">
              <button data-testid="proactive-mute" onClick={() => setMuted((m) => !m)}
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg active:scale-95 ${muted ? "bg-[#26324A] text-[#AEB8BF]" : "bg-[#F26419] text-white"}`}>
                {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                {muted ? tri("Voce OFF", "Stimme AUS", "Voice OFF", "Voz OFF") : tri("Voce ON", "Stimme AN", "Voice ON", "Voz ON")}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {PROACTIVE_MODULES.map((m) => (
                <div key={m.id} data-testid={`proactive-mod-${m.id}`} className="flex items-center gap-1.5 text-[11px] text-[#7E8A93] bg-[#f5f5f5] dark:bg-[#151515] rounded-lg px-2 py-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${m.persona === "momi" ? "bg-[#F26419]" : "bg-[#3B82F6]"}`} />
                  <span className="truncate">{moduleName(m, lang)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
