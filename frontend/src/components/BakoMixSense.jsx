import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import { Activity, X, Volume2, VolumeX, AlertTriangle, AlertOctagon, Info, Moon, AlarmClock, Play, Radio } from "lucide-react";
import { pulseApi } from "@/lib/api";
import { playTTS, isTTSMuted } from "@/lib/tts";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import LabAura, { auraColor } from "@/components/LabAura";
import FailsafeSwitch from "@/components/FailsafeSwitch";

const PUB = process.env.PUBLIC_URL;
const MOOD_LABEL = {
  sereno: ["Sereno", "Ruhig", "Calm", "Sereno", "Serein", "آرام"],
  attivo: ["Attivo", "Aktiv", "Active", "Activo", "Actif", "فعال"],
  teso: ["Teso", "Angespannt", "Tense", "Tenso", "Tendu", "پرتنش"],
  critico: ["Critico", "Kritisch", "Critical", "Crítico", "Critique", "بحرانی"],
};

export default function BakoMixSense({ section, mode, isCapo, operator, floorRole }) {
  const { lang } = useLang();
  const tri = mkTri(lang);
  const active = section === "control" || section === "guida";

  const [pulse, setPulse] = useState(null);
  const [open, setOpen] = useState(false);
  const [aura, setAura] = useState(() => { try { return localStorage.getItem("mikilab_aura") === "1"; } catch { return false; } });
  const [wake, setWake] = useState(null);
  const [rest, setRest] = useState({ active: false, allow_critical: true });
  const [history, setHistory] = useState([]);
  const spokenRef = useRef(null);
  const checkedRef = useRef(false);

  useEffect(() => { try { localStorage.setItem("mikilab_aura", aura ? "1" : "0"); } catch { /* */ } }, [aura]);

  const speak = useCallback((a) => {
    if (!a || isTTSMuted()) return;
    if (rest.active && a.level !== "critical") return; // Riposo blindato: solo emergenze
    const txt = (a.text && a.text[lang]) || (a.text && a.text.it) || "";
    const sug = (a.suggestion && a.suggestion[lang]) || "";
    if (!txt) return;
    playTTS(`${txt} ${sug}`, { lang, voice: "bakemix" });
  }, [lang, rest.active]);

  const refresh = useCallback(async () => {
    try {
      const p = await pulseApi.get();
      setPulse(p);
      if (p && p.rest_mode) setRest(p.rest_mode);
      // Voce proattiva: annuncia il primo alert nuovo (critico/warn)
      const top = (p.alerts || []).find((x) => x.level === "critical" || x.level === "warn");
      if (top && top.id !== spokenRef.current) {
        spokenRef.current = top.id;
        speak(top);
      }
      if (!top) spokenRef.current = null;
    } catch { /* offline: cache */ }
  }, [speak]);

  // Polling mentre la sezione è attiva (in pausa quando la scheda è nascosta)
  useEffect(() => {
    if (!active) return;
    refresh();
    const id = setInterval(() => { if (!document.hidden) refresh(); }, 20000);
    const onVis = () => { if (!document.hidden) refresh(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", onVis); };
  }, [active, refresh]);

  // Config Capo (sveglia + riposo)
  useEffect(() => {
    if (!isCapo) return;
    pulseApi.wakeGet().then(setWake).catch(() => {});
    pulseApi.restGet().then(setRest).catch(() => {});
  }, [isCapo]);

  // Storia del battito (solo Capo, mentre il pannello è aperto)
  useEffect(() => {
    if (!isCapo || !open) return;
    const load = () => pulseApi.history(240).then((h) => setHistory(h.points || [])).catch(() => {});
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [isCapo, open]);

  // Check-in SILENZIOSO automatico quando l'operatore entra in Produzione
  useEffect(() => {
    if (mode !== "floor" || checkedRef.current) return;
    if (!pulse || pulse.checkin?.active) return;
    if (!operator) return;
    checkedRef.current = true;
    pulseApi.checkin({ operator: operator.name || "Operatore", role: floorRole || "", station: floorRole || "" })
      .then(() => { toast.success(tri("Turno avviato · Capo avvisato in silenzio", "Schicht gestartet · Chef leise informiert", "Shift started · Capo quietly notified", "Turno iniciado · Capo avisado", "Service démarré · Capo prévenu", "شیفت شروع شد · کاپو مطلع شد"), { duration: 2500 }); refresh(); })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, pulse, operator, floorRole]);

  const toggleRest = async () => {
    try {
      const next = !rest.active;
      const r = await pulseApi.restSet({ active: next, allow_critical: true });
      setRest(r);
      toast.success(next
        ? tri("Riposo Blindato attivo · solo emergenze", "Ruhemodus aktiv · nur Notfälle", "Rest Mode on · emergencies only", "Modo Descanso · solo emergencias", "Mode Repos · urgences seulement", "حالت استراحت · فقط اورژانس")
        : tri("Riposo disattivato", "Ruhemodus aus", "Rest Mode off", "Modo Descanso apagado", "Mode Repos désactivé", "حالت استراحت خاموش"));
    } catch { toast.error(tri("Solo il Capo può cambiare la modalità", "Nur der Chef darf das", "Capo only", "Solo el Capo", "Capo seulement", "فقط کاپو")); }
  };

  const saveWake = async (patch) => {
    const merged = { enabled: true, first_start: "04:30", prep_minutes: 20, ...(wake || {}), ...patch };
    try { const w = await pulseApi.wakeSet({ enabled: merged.enabled, first_start: merged.first_start, prep_minutes: merged.prep_minutes }); setWake(w); }
    catch { /* */ }
  };

  const doCheckin = async () => {
    try {
      await pulseApi.checkin({ operator: (operator && operator.name) || "Operatore", role: floorRole || "", station: floorRole || "" });
      toast.success(tri("Turno avviato · Capo avvisato", "Schicht gestartet", "Shift started", "Turno iniciado", "Service démarré", "شیفت شروع شد"));
      refresh();
    } catch { /* */ }
  };

  if (!active) return null;
  const mood = pulse?.mood || "sereno";
  const hb = pulse?.heartbeat || 52;
  const color = auraColor(mood);
  const alerts = pulse?.alerts || [];
  const nCrit = alerts.filter((a) => a.level === "critical").length;
  const nAlert = alerts.length;
  const beatSec = (60 / Math.max(40, Math.min(150, hb))).toFixed(2);
  const moodLabel = (MOOD_LABEL[mood] || MOOD_LABEL.sereno);
  const muted = isTTSMuted();

  return (
    <>
      <LabAura enabled={aura} mood={mood} heartbeat={hb} station={mode === "floor" ? (floorRole || "") : ""} />

      {/* Avatar proattivo flottante */}
      <button
        data-testid="bakomix-sense-fab"
        onClick={() => setOpen((v) => !v)}
        className="fixed left-4 bottom-24 z-[55] w-16 h-16 rounded-full active:scale-95 transition-transform"
        title="BakoMix · Sesto Senso"
      >
        <style>{`@keyframes senseRing{0%,100%{transform:scale(1);opacity:.7}50%{transform:scale(1.25);opacity:0}}`}</style>
        <span aria-hidden className="absolute inset-0 rounded-full" style={{ boxShadow: `0 0 0 2px ${color}`, animation: `senseRing ${beatSec}s ease-out infinite`, background: `${color}22` }} />
        <img src={`${PUB}/avatar_bigmix.jpg`} alt="BakoMix" className="relative w-16 h-16 rounded-full object-cover border-2" style={{ borderColor: color }} />
        {nAlert > 0 && (
          <span data-testid="bakomix-sense-badge" className="absolute -top-1 -right-1 min-w-6 h-6 px-1.5 rounded-full text-[11px] font-black flex items-center justify-center text-white shadow-lg" style={{ background: nCrit ? "#ef4444" : "#f59e0b" }}>{nAlert}</span>
        )}
      </button>

      {/* Pannello */}
      {open && (
        <div data-testid="bakomix-sense-panel" className="fixed left-3 right-3 sm:left-4 sm:right-auto sm:w-[380px] bottom-44 z-[56] rounded-3xl bg-[#0b0f19]/95 backdrop-blur-xl border border-[#1e293b] shadow-2xl overflow-hidden animate-fadeIn">
          <div className="p-4 flex items-center justify-between" style={{ background: `linear-gradient(90deg, ${color}22, transparent)` }}>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5" style={{ color }} />
              <div>
                <p className="text-sm font-black text-white leading-none">BakoMix · {tri("Sesto Senso", "Sechster Sinn", "Sixth Sense", "Sexto Sentido", "Sixième Sens", "حس ششم")}</p>
                <p className="text-[11px] font-bold mt-1" style={{ color }}>
                  {tri(...moodLabel)} · {hb} bpm · {pulse?.score ?? 100}%
                </p>
              </div>
            </div>
            <button data-testid="bakomix-sense-close" onClick={() => setOpen(false)} className="w-8 h-8 rounded-full bg-[#030712] border border-[#1e293b] flex items-center justify-center text-[#94A3B8] hover:text-white"><X className="w-4 h-4" /></button>
          </div>

          <div className="max-h-[52vh] overflow-y-auto p-4 space-y-3">
            {/* Controlli rapidi */}
            <div className="flex items-center gap-2">
              <button data-testid="bakomix-aura-toggle" onClick={() => setAura((v) => !v)} className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold border transition-all ${aura ? "text-white" : "text-[#94A3B8] border-[#1e293b] bg-[#030712]"}`} style={aura ? { background: `${color}22`, borderColor: color } : {}}>
                <Radio className="w-4 h-4" /> {tri("Aura Sonora", "Klang-Aura", "Sound Aura", "Aura Sonora", "Aura Sonore", "هاله صوتی")}
              </button>
              <span className="inline-flex items-center gap-1 text-[11px] text-[#94A3B8]">
                {muted ? <VolumeX className="w-4 h-4 text-[#f87171]" /> : <Volume2 className="w-4 h-4" style={{ color }} />}
              </span>
            </div>

            {/* Storia del battito del laboratorio (Capo) */}
            {isCapo && history.length >= 2 && (
              <div data-testid="bakomix-heartbeat-history" className="rounded-2xl border border-[#1e293b] bg-[#030712] p-3">
                <p className="text-[11px] font-black uppercase tracking-wider text-[#94A3B8] mb-2 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" style={{ color }} /> {tri("Storia del battito", "Herzschlag-Verlauf", "Heartbeat history", "Historia del pulso", "Historique du pouls", "تاریخچه ضربان")}</p>
                <Sparkline points={history} color={color} />
                <p className="text-[10px] text-[#94A3B8] mt-1 text-right">{tri("ultime ore", "letzte Stunden", "last hours", "últimas horas", "dernières heures", "ساعات اخیر")}</p>
              </div>
            )}

            {/* Alert proattivi */}
            {alerts.length === 0 ? (
              <div data-testid="bakomix-no-alerts" className="text-center py-6 rounded-2xl border border-[#1e293b] bg-[#030712]">
                <p className="text-sm font-bold" style={{ color }}>{tri("Tutto scorre. Nessuna anomalia.", "Alles läuft. Keine Auffälligkeiten.", "All flowing. No anomalies.", "Todo fluye. Sin anomalías.", "Tout roule. Aucune anomalie.", "همه‌چیز روان است. بدون ناهنجاری.")}</p>
                <p className="text-[11px] text-[#94A3B8] mt-1">{tri("Osservo per te, in silenzio.", "Ich beobachte still für dich.", "I watch for you, silently.", "Observo por ti, en silencio.", "Je veille pour toi, en silence.", "بی‌صدا برایت مراقبم.")}</p>
              </div>
            ) : (
              alerts.map((a) => {
                const c = a.level === "critical" ? "#ef4444" : a.level === "warn" ? "#f59e0b" : "#5E8CA8";
                const Icon = a.level === "critical" ? AlertOctagon : a.level === "warn" ? AlertTriangle : Info;
                return (
                  <div key={a.id} data-testid={`bakomix-alert-${a.code}`} className="rounded-2xl border p-3" style={{ borderColor: `${c}55`, background: `${c}12` }}>
                    <div className="flex items-start gap-2">
                      <Icon className="w-4 h-4 mt-0.5 shrink-0" style={{ color: c }} />
                      <div className="min-w-0">
                        <p className="text-[13px] font-bold text-white leading-snug">{(a.text && a.text[lang]) || a.text?.it}</p>
                        <p className="text-[11.5px] text-[#94A3B8] mt-1 leading-snug">💡 {(a.suggestion && a.suggestion[lang]) || a.suggestion?.it}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* Check-in stato / avvio turno (Produzione) */}
            {mode === "floor" && (
              <div className="rounded-2xl border border-[#1e293b] bg-[#030712] p-3">
                {pulse?.checkin?.active ? (
                  <p className="text-[12px] text-[#94A3B8]">🟢 {tri("Turno avviato da", "Schicht gestartet von", "Shift started by", "Turno iniciado por", "Service démarré par", "شیفت آغاز شد توسط")} <b className="text-white">{pulse.checkin.by}</b></p>
                ) : (
                  <button data-testid="bakomix-checkin-btn" onClick={doCheckin} className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#14b8a6] text-[#030712] font-black text-sm active:scale-95 transition-transform">
                    <Play className="w-4 h-4" /> {tri("Avvia turno (timbra)", "Schicht starten", "Start shift", "Iniciar turno", "Démarrer le service", "شروع شیفت")}
                  </button>
                )}
              </div>
            )}

            {/* Comandi del Capo: Riposo blindato + Sveglia predittiva */}
            {isCapo && (
              <div className="space-y-3 pt-1">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-wider text-[#94A3B8] mb-1.5 flex items-center gap-1.5"><Moon className="w-3.5 h-3.5" /> {tri("Riposo Blindato", "Ruhemodus", "Rest Mode", "Modo Descanso", "Mode Repos", "حالت استراحت")}</p>
                  <FailsafeSwitch
                    testid="bakomix-rest-switch"
                    active={rest.active}
                    onConfirm={toggleRest}
                    labelOn={tri("Riposo attivo · tieni per spegnere", "Ruhe an · halten zum Aus", "Rest on · hold to turn off", "Descanso · mantén para apagar", "Repos · maintenir pour éteindre", "استراحت روشن · نگه‌دار")}
                    labelOff={tri("Tieni premuto per attivare", "Halten zum Aktivieren", "Hold to activate", "Mantén para activar", "Maintenir pour activer", "برای فعال‌سازی نگه‌دار")}
                  />
                  <p className="text-[10.5px] text-[#94A3B8] mt-1.5">{tri("Silenzia tutto tranne le emergenze critiche del laboratorio.", "Alles außer kritischen Notfällen stumm.", "Silences everything except critical lab emergencies.", "Silencia todo salvo emergencias críticas.", "Coupe tout sauf les urgences critiques.", "همه‌چیز جز اورژانس بحرانی خاموش می‌شود.")}</p>
                </div>

                {wake && (
                  <div className="rounded-2xl border border-[#1e293b] bg-[#030712] p-3">
                    <p className="text-[11px] font-black uppercase tracking-wider text-[#94A3B8] mb-2 flex items-center gap-1.5"><AlarmClock className="w-3.5 h-3.5" /> {tri("Sveglia Predittiva", "Vorausschauender Wecker", "Predictive Wake", "Despertador Predictivo", "Réveil Prédictif", "بیدارباش پیش‌بین")}</p>
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-[12px] text-white">{tri("Primo avvio", "Erster Start", "First start", "Primer inicio", "Premier départ", "شروع اول")}</label>
                      <input data-testid="bakomix-wake-start" type="time" value={wake.first_start} onChange={(e) => saveWake({ first_start: e.target.value })} className="bg-[#0b0f19] border border-[#1e293b] rounded-lg px-2 py-1 text-sm text-white outline-none focus:border-[#14b8a6]" />
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-2">
                      <label className="text-[12px] text-white">{tri("Margine prep. (min)", "Vorbereitung (min)", "Prep buffer (min)", "Margen prep. (min)", "Marge prépa (min)", "حاشیه آماده‌سازی")}</label>
                      <input data-testid="bakomix-wake-prep" type="number" min="0" max="240" value={wake.prep_minutes} onChange={(e) => saveWake({ prep_minutes: parseInt(e.target.value || "0", 10) })} className="w-20 bg-[#0b0f19] border border-[#1e293b] rounded-lg px-2 py-1 text-sm text-white outline-none focus:border-[#14b8a6]" />
                    </div>
                    <div className="mt-2 text-center rounded-xl py-2" style={{ background: "#14b8a622", border: "1px solid #14b8a655" }}>
                      <span className="text-[11px] text-[#94A3B8]">{tri("Sveglia consigliata", "Empfohlener Wecker", "Suggested wake", "Despertar sugerido", "Réveil conseillé", "بیدارباش پیشنهادی")}: </span>
                      <span data-testid="bakomix-wake-at" className="text-lg font-black text-[#14b8a6]">{wake.wake_at}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function Sparkline({ points, color }) {
  const vals = points.map((p) => p.heartbeat || 52);
  const W = 320, H = 48, pad = 3;
  const min = Math.min(...vals), max = Math.max(...vals);
  const range = Math.max(1, max - min);
  const step = vals.length > 1 ? (W - pad * 2) / (vals.length - 1) : 0;
  const path = vals.map((v, i) => {
    const x = pad + i * step;
    const y = H - pad - ((v - min) / range) * (H - pad * 2);
    return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const last = vals[vals.length - 1];
  return (
    <svg data-testid="bakomix-sparkline" viewBox={`0 0 ${W} ${H}`} className="w-full h-12" preserveAspectRatio="none">
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path} L${(pad + (vals.length - 1) * step).toFixed(1)},${H} L${pad},${H} Z`} fill="url(#spark-fill)" />
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={(pad + (vals.length - 1) * step).toFixed(1)} cy={(H - pad - ((last - min) / range) * (H - pad * 2)).toFixed(1)} r="3" fill={color} />
    </svg>
  );
}

