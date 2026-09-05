import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import { Activity, X, Volume2, VolumeX, AlertTriangle, AlertOctagon, Info, Moon, AlarmClock, Play, Radio, Users, Sunrise, Globe, Sparkles, Factory, ScanLine, CloudSun, Package, KeyRound, Mic, Snowflake, Flame, History } from "lucide-react";
import { pulseApi, staffingApi, briefingApi, accessApi, delegationApi } from "@/lib/api";
import { playTTS, isTTSMuted } from "@/lib/tts";
import { publishSensor } from "@/lib/sensors";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import LabAura, { auraColor } from "@/components/LabAura";
import FailsafeSwitch from "@/components/FailsafeSwitch";
import ShiftPowerBoard from "@/components/ShiftPowerBoard";
import EnterpriseGrid from "@/components/EnterpriseGrid";
import RecipeAuditMatrix from "@/components/RecipeAuditMatrix";
import ProductionPipeline from "@/components/ProductionPipeline";
import SpatialVisionAR from "@/components/SpatialVisionAR";
import ClimateTimeMachine from "@/components/ClimateTimeMachine";
import ProductionInventory from "@/components/ProductionInventory";
import VoiceDelegation from "@/components/VoiceDelegation";
import ProoferSync from "@/components/ProoferSync";
import BatchPhoenix from "@/components/BatchPhoenix";

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
  const [staffHist, setStaffHist] = useState([]);
  const [briefing, setBriefing] = useState(null);
  const [briefingOpen, setBriefingOpen] = useState(true);
  const [entOpen, setEntOpen] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);
  const [pipelineOpen, setPipelineOpen] = useState(false);
  const [visionOpen, setVisionOpen] = useState(false);
  const [climateOpen, setClimateOpen] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [delegateOpen, setDelegateOpen] = useState(false);
  const [glass, setGlass] = useState(() => { try { const v = Number(localStorage.getItem("mikilab_glass_level")); return Number.isFinite(v) && v > 0 ? v : 62; } catch { return 62; } });
  const setGlassLvl = (v) => { setGlass(v); try { localStorage.setItem("mikilab_glass_level", String(v)); } catch { /* */ } try { window.dispatchEvent(new CustomEvent("mikilab-glass-changed", { detail: v })); } catch { /* */ } };
  const doHandoff = async () => {
    try {
      const r = await delegationApi.handoff(lang);
      toast.success(tri("Handoff turno in riproduzione", "Schichtübergabe wird abgespielt", "Playing shift handoff", "Reproduciendo relevo", "Lecture du relais", "پخش تحویل شیفت"));
      playTTS(r.text, { lang, voice: "bakemix" });
      if (histOpen) loadHist();
    } catch { toast.error(tri("Errore handoff", "Fehler", "Handoff error", "Error", "Erreur", "خطا")); }
  };
  const [prooferOpen, setProoferOpen] = useState(false);
  const [phoenixOpen, setPhoenixOpen] = useState(false);
  const [histOpen, setHistOpen] = useState(false);
  const [hist, setHist] = useState([]);
  const loadHist = () => { delegationApi.handoffHistory().then(setHist).catch(() => setHist([])); };
  const toggleHist = () => { const n = !histOpen; setHistOpen(n); if (n) loadHist(); };
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
      // Sensori live → alimenta l'Aura anche sul dispositivo del Capo
      if (p && p.sensors) {
        if (p.sensors.oven_temp) publishSensor("oven_temp", p.sensors.oven_temp.value);
        if (p.sensors.ph) publishSensor("ph", p.sensors.ph.value);
      }
      // Voce proattiva: SOLO in modalità strategica. In FLOOR = silenzio totale (shadow passivo).
      const top = (p.alerts || []).find((x) => x.level === "critical" || x.level === "warn");
      if (mode !== "floor" && top && top.id !== spokenRef.current) {
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
    briefingApi.get().then(setBriefing).catch(() => {});
  }, [isCapo]);

  // Storia del battito + organico settimana (solo Capo, mentre il pannello è aperto)
  useEffect(() => {
    if (!isCapo || !open) return;
    const load = () => {
      pulseApi.history(240).then((h) => setHistory(h.points || [])).catch(() => {});
      staffingApi.history(7).then((h) => setStaffHist(h.days || [])).catch(() => {});
    };
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

  const applyVolumes = async () => {
    try {
      const r = await staffingApi.applyVolumes();
      toast.success(tri(`Volumi ridotti del ${r.reduce_pct}% su ${r.adjusted} lotti`, `Mengen um ${r.reduce_pct}% reduziert (${r.adjusted} Chargen)`, `Volumes cut ${r.reduce_pct}% on ${r.adjusted} batches`, `Volúmenes -${r.reduce_pct}% en ${r.adjusted} lotes`, `Volumes -${r.reduce_pct}% sur ${r.adjusted} lots`, `حجم −${r.reduce_pct}% روی ${r.adjusted} دسته`));
      refresh();
    } catch { toast.error(tri("Solo il Capo", "Nur der Chef", "Capo only", "Solo el Capo", "Capo seulement", "فقط کاپو")); }
  };

  const doCheckin = async () => {
    try {
      await pulseApi.checkin({ operator: (operator && operator.name) || "Operatore", role: floorRole || "", station: floorRole || "" });
      toast.success(tri("Turno avviato · Capo avvisato", "Schicht gestartet", "Shift started", "Turno iniciado", "Service démarré", "شیفت شروع شد"));
      refresh();
    } catch { /* */ }
  };

  const genAccessInvite = async () => {
    try {
      const r = await accessApi.createInvite(1, 30);
      const link = `${window.location.origin}/?invite=${r.token}`;
      try { await navigator.clipboard.writeText(link); } catch { /* */ }
      toast.success(tri("Invito creato · link copiato", "Einladung erstellt · Link kopiert", "Invite created · link copied", "Invitación creada · enlace copiado", "Invitation créée · lien copié", "دعوت ساخته شد · لینک کپی شد"), { duration: 4000 });
    } catch { toast.error(tri("Solo il Capo può creare inviti", "Nur der Chef", "Capo only", "Solo el Capo", "Capo seulement", "فقط کاپو")); }
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
      {entOpen && <EnterpriseGrid onClose={() => setEntOpen(false)} />}
      {auditOpen && <RecipeAuditMatrix onClose={() => setAuditOpen(false)} />}
      {pipelineOpen && <ProductionPipeline onClose={() => setPipelineOpen(false)} />}
      {visionOpen && <SpatialVisionAR onClose={() => setVisionOpen(false)} />}
      {climateOpen && <ClimateTimeMachine onClose={() => setClimateOpen(false)} />}
      {inventoryOpen && <ProductionInventory onClose={() => setInventoryOpen(false)} />}
      {delegateOpen && <VoiceDelegation onClose={() => setDelegateOpen(false)} />}
      {prooferOpen && <ProoferSync onClose={() => setProoferOpen(false)} />}
      {phoenixOpen && <BatchPhoenix onClose={() => setPhoenixOpen(false)} />}

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
            {/* Briefing del mattino (Capo) */}
            {isCapo && briefing && briefingOpen && (
              <div data-testid="bakomix-briefing" className="rounded-2xl border border-[#f59e0b]/40 p-3" style={{ background: "linear-gradient(135deg, #f59e0b18, transparent)" }}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[12px] font-black text-[#f59e0b] flex items-center gap-1.5"><Sunrise className="w-4 h-4" /> {tri("Briefing del mattino", "Morgen-Briefing", "Morning briefing", "Briefing matutino", "Briefing du matin", "گزارش صبحگاهی")}</p>
                  <button data-testid="bakomix-briefing-close" onClick={() => setBriefingOpen(false)} className="text-[#94A3B8] hover:text-white"><X className="w-3.5 h-3.5" /></button>
                </div>
                <p className="text-[12px] text-white mt-1.5">{briefing.greeting}</p>
                <ul className="mt-1.5 space-y-0.5">
                  {(briefing.night_summary || []).map((l, i) => (<li key={i} className="text-[11px] text-[#94A3B8]">· {l}</li>))}
                </ul>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[11px] text-[#94A3B8]">{tri("Efficienza lab", "Lab-Effizienz", "Lab efficiency", "Eficiencia", "Efficacité", "کارایی")}</span>
                  <span className="text-sm font-black text-[#f59e0b]" data-testid="bakomix-briefing-eff">{briefing.overall_lab_efficiency}</span>
                </div>
                <p className="text-[11px] text-[#5EEAD4] mt-1.5">💡 {briefing.ai_recommendation}</p>
              </div>
            )}

            {/* Controlli rapidi */}
            <div className="flex items-center gap-2">
              <button data-testid="bakomix-aura-toggle" onClick={() => setAura((v) => !v)} className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold border transition-all ${aura ? "text-white" : "text-[#94A3B8] border-[#1e293b] bg-[#030712]"}`} style={aura ? { background: `${color}22`, borderColor: color } : {}}>
                <Radio className="w-4 h-4" /> {tri("Aura Sonora", "Klang-Aura", "Sound Aura", "Aura Sonora", "Aura Sonore", "هاله صوتی")}
              </button>
              <span className="inline-flex items-center gap-1 text-[11px] text-[#94A3B8]">
                {muted ? <VolumeX className="w-4 h-4 text-[#f87171]" /> : <Volume2 className="w-4 h-4" style={{ color }} />}
              </span>
            </div>

            {/* Sensori live (temperatura forno · pH lievito) */}
            {pulse?.sensors && (pulse.sensors.oven_temp || pulse.sensors.ph) && (
              <div data-testid="bakomix-sensors-live" className="grid grid-cols-2 gap-2">
                {pulse.sensors.oven_temp && (
                  <div className="rounded-2xl border p-3 text-center" style={{ borderColor: pulse.sensors.oven_temp.value > 250 ? "#ef4444" : "#1e293b", background: pulse.sensors.oven_temp.value > 250 ? "#ef444412" : "#030712" }}>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">🔥 {tri("Forno", "Ofen", "Oven", "Horno", "Four", "فر")}</p>
                    <p className="text-2xl font-black" style={{ color: pulse.sensors.oven_temp.value > 250 ? "#ef4444" : color }} data-testid="bakomix-sensor-oven">{pulse.sensors.oven_temp.value}°</p>
                  </div>
                )}
                {pulse.sensors.ph && (
                  <div className="rounded-2xl border p-3 text-center" style={{ borderColor: pulse.sensors.ph.value < 3.8 ? "#f59e0b" : "#1e293b", background: pulse.sensors.ph.value < 3.8 ? "#f59e0b12" : "#030712" }}>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">🧪 {tri("pH lievito", "Sauerteig pH", "Sourdough pH", "pH masa", "pH levain", "pH خمیرمایه")}</p>
                    <p className="text-2xl font-black" style={{ color: pulse.sensors.ph.value < 3.8 ? "#f59e0b" : color }} data-testid="bakomix-sensor-ph">{pulse.sensors.ph.value}</p>
                  </div>
                )}
              </div>
            )}

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
                <button data-testid="bakomix-enterprise-btn" onClick={() => setEntOpen(true)} className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-2xl font-black text-sm text-[#030712] active:scale-95 transition-transform" style={{ background: "linear-gradient(90deg, #5EEAD4, #f59e0b)" }}>
                  <Globe className="w-4 h-4" /> {tri("Rete · 100 Panifici", "Netz · 100 Bäckereien", "Grid · 100 Bakeries", "Red · 100 Panaderías", "Réseau · 100 Boulangeries", "شبکه · ۱۰۰ نانوایی")}
                </button>
                <button data-testid="bakomix-audit-btn" onClick={() => setAuditOpen(true)} className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-2xl font-black text-sm border border-[#f59e0b]/50 text-[#f59e0b] bg-[#f59e0b12] active:scale-95 transition-transform">
                  <Sparkles className="w-4 h-4" /> {tri("Audit Ricetta (Matrice Sovrana)", "Rezept-Audit (Matrix)", "Recipe Audit (Sovereign Matrix)", "Auditoría de Receta", "Audit Recette", "بازبینی دستور")}
                </button>
                <div className="grid grid-cols-3 gap-2">
                  <button data-testid="bakomix-pipeline-btn" onClick={() => setPipelineOpen(true)} className="inline-flex flex-col items-center justify-center gap-1 py-2.5 rounded-2xl font-black text-[11px] border border-[#5EEAD4]/40 text-[#5EEAD4] bg-[#5EEAD40d] active:scale-95 transition-transform">
                    <Factory className="w-4 h-4" /> {tri("Linea", "Linie", "Line", "Línea", "Ligne", "خط")}
                  </button>
                  <button data-testid="bakomix-vision-btn" onClick={() => setVisionOpen(true)} className="inline-flex flex-col items-center justify-center gap-1 py-2.5 rounded-2xl font-black text-[11px] border border-[#c084fc]/40 text-[#c084fc] bg-[#a855f70d] active:scale-95 transition-transform">
                    <ScanLine className="w-4 h-4" /> {tri("Vision AR", "Vision AR", "Vision AR", "Vision AR", "Vision AR", "ویژن AR")}
                  </button>
                  <button data-testid="bakomix-climate-btn" onClick={() => setClimateOpen(true)} className="inline-flex flex-col items-center justify-center gap-1 py-2.5 rounded-2xl font-black text-[11px] border border-[#f59e0b]/40 text-[#f59e0b] bg-[#f59e0b0d] active:scale-95 transition-transform">
                    <CloudSun className="w-4 h-4" /> {tri("Clima", "Klima", "Climate", "Clima", "Climat", "اقلیم")}
                  </button>
                </div>
                <button data-testid="bakomix-inventory-btn" onClick={() => setInventoryOpen(true)} className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-2xl font-black text-sm border border-[#22c55e]/50 text-[#22c55e] bg-[#22c55e12] active:scale-95 transition-transform">
                  <Package className="w-4 h-4" /> {tri("Inventario di Produzione (foto)", "Produktions-Inventar (Foto)", "Production Inventory (photo)", "Inventario de Producción (foto)", "Inventaire de Production (photo)", "موجودی تولید (عکس)")}
                </button>
                <button data-testid="bakomix-delegate-btn" onClick={() => setDelegateOpen(true)} className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-2xl font-black text-sm border border-[#14b8a6]/50 text-[#14b8a6] bg-[#14b8a612] active:scale-95 transition-transform">
                  <Mic className="w-4 h-4" /> {tri("Delega Vocale (Eclipse)", "Sprachdelegation", "Voice Delegation", "Delegación por Voz", "Délégation Vocale", "واگذاری صوتی")}
                </button>
                <button data-testid="bakomix-handoff-btn" onClick={doHandoff} className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-2xl font-black text-sm border border-[#5EEAD4]/50 text-[#5EEAD4] bg-[#5EEAD40d] active:scale-95 transition-transform">
                  <Volume2 className="w-4 h-4" /> {tri("Handoff Audio Turno", "Audio-Schichtübergabe", "Shift Audio Handoff", "Relevo de Turno Audio", "Relais Audio de Poste", "تحویل صوتی شیفت")}
                </button>
                <button data-testid="bakomix-handoff-history" onClick={toggleHist} className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-bold text-[#7E8A93] hover:text-[#5EEAD4]">
                  <History className="w-3.5 h-3.5" /> {histOpen ? tri("nascondi storico", "Verlauf ausblenden", "hide history", "ocultar historial", "masquer l'historique", "پنهان") : tri("Storico handoff", "Verlauf", "Handoff history", "Historial", "Historique", "تاریخچه")}
                </button>
                {histOpen && (
                  <div data-testid="handoff-history-list" className="space-y-1.5 -mt-1">
                    {hist.length === 0 && <p className="text-[11px] text-[#64748B] text-center">{tri("Nessun handoff salvato.", "Kein Verlauf.", "No saved handoffs.", "Sin historial.", "Aucun historique.", "چیزی نیست.")}</p>}
                    {hist.slice(0, 6).map((h) => (
                      <div key={h.id} className="flex items-center gap-2 bg-[#0b0f19] border border-[#1e293b] rounded-xl px-3 py-2">
                        <span className="text-[11px] text-[#94A3B8] flex-1 min-w-0 truncate">{new Date(h.at).toLocaleString()} · {h.present}/{h.total}</span>
                        <button data-testid={`handoff-replay-${h.id}`} onClick={() => playTTS(h.text, { lang: h.lang || lang, voice: "bakemix" })} className="shrink-0 w-7 h-7 rounded-full bg-[#5EEAD4]/15 text-[#5EEAD4] flex items-center justify-center"><Play className="w-3.5 h-3.5" /></button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <button data-testid="bakomix-proofer-btn" onClick={() => setProoferOpen(true)} className="inline-flex flex-col items-center justify-center gap-1 py-2.5 rounded-2xl font-black text-[11px] border border-[#5E8CA8]/40 text-[#8FB0C2] bg-[#5E8CA80d] active:scale-95 transition-transform">
                    <Snowflake className="w-4 h-4" /> {tri("Cella/Freezer", "Gärraum", "Proofer", "Cámara", "Chambre", "تخمیر")}
                  </button>
                  <button data-testid="bakomix-phoenix-btn" onClick={() => setPhoenixOpen(true)} className="inline-flex flex-col items-center justify-center gap-1 py-2.5 rounded-2xl font-black text-[11px] border border-[#f97316]/40 text-[#fdba74] bg-[#f973160d] active:scale-95 transition-transform">
                    <Flame className="w-4 h-4" /> Batch Phoenix
                  </button>
                </div>
                <button data-testid="bakomix-invite-btn" onClick={genAccessInvite} className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-2xl font-black text-sm border border-[#8b5cf6]/50 text-[#a78bfa] bg-[#8b5cf612] active:scale-95 transition-transform">
                  <KeyRound className="w-4 h-4" /> {tri("Genera invito d'accesso", "Zugangs-Einladung erstellen", "Generate access invite", "Generar invitación de acceso", "Générer une invitation", "ساخت دعوت دسترسی")}
                </button>
                <div data-testid="bakomix-glass-control" className="rounded-2xl border border-[#5E8CA8]/40 bg-[#5E8CA80d] p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-black uppercase tracking-widest text-[#8FB0C2]">{tri("Intensità vetro & sfondi", "Glas- & Hintergrund-Intensität", "Glass & background intensity", "Intensidad de vidrio y fondos", "Intensité verre & fonds", "شدت شیشه و پس‌زمینه")}</span>
                    <span className="text-[11px] font-mono-data font-bold text-white" data-testid="glass-value">{glass}%</span>
                  </div>
                  <input data-testid="glass-slider" type="range" min="15" max="95" step="1" value={glass} onChange={(e) => setGlassLvl(Number(e.target.value))} className="w-full accent-[#5E8CA8]" />
                  <p className="text-[10px] text-[#64748B] mt-1">{tri("Alza per sfondi più vividi, abbassa per più contrasto sul testo.", "Höher = lebendigere Hintergründe, niedriger = mehr Kontrast.", "Higher = more vivid backgrounds, lower = more text contrast.", "Más alto = fondos vívidos, más bajo = más contraste.", "Plus haut = fonds vifs, plus bas = plus de contraste.", "بالاتر = پس‌زمینه واضح‌تر، پایین‌تر = کنتراست بیشتر.")}</p>
                </div>
                <ShiftPowerBoard editable />
                {/* Organico del giorno → ricalcolo volumi */}
                {pulse?.staffing && (
                  <div data-testid="bakomix-staffing" className="rounded-2xl border border-[#1e293b] bg-[#030712] p-3">
                    <p className="text-[11px] font-black uppercase tracking-wider text-[#94A3B8] mb-2 flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {tri("Organico di oggi", "Heutiges Personal", "Today's staff", "Personal de hoy", "Effectif du jour", "کارکنان امروز")}</p>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[12px] text-white">{tri("Presenti", "Anwesend", "Present", "Presentes", "Présents", "حاضر")}: <b>{pulse.staffing.present}</b> / <span className="text-[#94A3B8]">{tri("totale", "gesamt", "total", "total", "total", "کل")}</span></span>
                      <input data-testid="bakomix-staff-total" type="number" min="1" max="100" defaultValue={pulse.staffing.total} onBlur={(e) => { const v = parseInt(e.target.value || "1", 10); staffingApi.set(v).then(refresh).catch(() => {}); }} className="w-16 bg-[#0b0f19] border border-[#1e293b] rounded-lg px-2 py-1 text-sm text-white outline-none focus:border-[#14b8a6]" />
                    </div>
                    {pulse.staffing.reduce_pct > 0 ? (
                      <>
                        <p data-testid="bakomix-staff-reduce" className="text-[11.5px] mt-2 rounded-lg px-2 py-1.5" style={{ background: "#f59e0b18", color: "#f59e0b" }}>
                          📉 {tri("Volumi consigliati", "Empfohlene Mengen", "Suggested volumes", "Volúmenes sugeridos", "Volumes conseillés", "حجم پیشنهادی")} −{pulse.staffing.reduce_pct}%
                        </p>
                        <button data-testid="bakomix-apply-volumes" onClick={applyVolumes} className="w-full mt-2 py-2 rounded-xl bg-amber-500 text-[#030712] font-black text-xs active:scale-95 transition-transform">
                          {tri("Applica al piano di oggi", "Auf heutigen Plan anwenden", "Apply to today's plan", "Aplicar al plan de hoy", "Appliquer au plan du jour", "روی برنامه امروز اعمال کن")} −{pulse.staffing.reduce_pct}%
                        </button>
                      </>
                    ) : (
                      <p className="text-[11px] text-[#94A3B8] mt-2">{tri("Organico completo · volumi pieni.", "Voll besetzt · volle Mengen.", "Full staff · full volumes.", "Personal completo · volúmenes plenos.", "Effectif complet · volumes pleins.", "کارکنان کامل · حجم کامل.")}</p>
                    )}
                    {staffHist.length >= 2 && (
                      <div data-testid="bakomix-staff-week" className="mt-3">
                        <p className="text-[10px] text-[#94A3B8] mb-1">{tri("Organico · 7 giorni", "Personal · 7 Tage", "Staff · 7 days", "Personal · 7 días", "Effectif · 7 jours", "کارکنان · ۷ روز")}</p>
                        <div className="flex items-end justify-between gap-1 h-12">
                          {staffHist.map((d) => (
                            <div key={d.date} className="flex-1 flex flex-col items-center justify-end h-full" title={`${d.date}: ${d.present}/${pulse.staffing.total}`}>
                              <div className="w-full rounded-t" style={{ height: `${Math.max(6, (d.factor || 0) * 100)}%`, background: d.factor < 0.7 ? "#ef4444" : d.factor < 1 ? "#f59e0b" : color }} />
                              <span className="text-[8px] text-[#64748B] mt-0.5">{d.date.slice(8)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
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

