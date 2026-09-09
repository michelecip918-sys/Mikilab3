import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Check, Gauge, Brush, ShieldAlert, ListChecks, Camera, Loader2, X, ScanLine } from "lucide-react";
import { toast } from "sonner";
import { delegationApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

const KIND = {
  sanificazione: { icon: Brush, c: "#22c55e" },
  regola: { icon: ShieldAlert, c: "#64748B" },
  crisis_override: { icon: Gauge, c: "#f59e0b" },
  produzione: { icon: ListChecks, c: "#FF6B00" },
  generico: { icon: ListChecks, c: "#5EEAD4" },
};

export default function TeamTasks({ operatorName = "" }) {
  const { lang } = useLang();
  const tri = mkTri(lang);
  const [tasks, setTasks] = useState([]);

  const load = useCallback(async () => {
    try { const r = operatorName ? await delegationApi.tasksByRole(operatorName) : await delegationApi.tasks(); setTasks(r.tasks || []); } catch { /* Letz_Passive: nessun errore rumoroso */ }
  }, [operatorName]);
  useEffect(() => { load(); const iv = setInterval(load, 15000); return () => clearInterval(iv); }, [load]);
  // Aggiornamento ISTANTANEO al cambio postazione/ruolo o dispatch del piano dal Capo.
  useEffect(() => {
    const h = () => load();
    window.addEventListener("mikilab-role-changed", h);
    window.addEventListener("mikilab-tasks-updated", h);
    return () => { window.removeEventListener("mikilab-role-changed", h); window.removeEventListener("mikilab-tasks-updated", h); };
  }, [load]);

  const markDone = async (taskId, order) => {
    // aggiornamento ottimistico e silenzioso
    setTasks((ts) => ts.map((t) => t.id === taskId ? { ...t, steps: t.steps.map((s) => s.order === order ? { ...s, done: true } : s) } : t));
    try { await delegationApi.stepDone(taskId, order, operatorName); await load(); } catch { /* */ }
  };

  // Checkpoint AR pulizia (fotocamera → Claude Vision) prima di chiudere un task di sanificazione.
  const [checkTask, setCheckTask] = useState(null);
  const [checking, setChecking] = useState(false);
  const [checkRes, setCheckRes] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const stopCam = useCallback(() => {
    try { if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop()); } catch { /* */ }
    streamRef.current = null;
  }, []);

  const openCheck = useCallback(async (taskId) => {
    setCheckTask(taskId); setCheckRes(null);
    if (!navigator.mediaDevices?.getUserMedia) { toast.error(tri("Fotocamera non supportata", "Kamera nicht unterstützt", "Camera not supported", "Cámara no soportada", "Caméra non supportée", "دوربین پشتیبانی نمی‌شود")); return; }
    try {
      const st = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      streamRef.current = st;
      setTimeout(async () => { if (videoRef.current) { videoRef.current.srcObject = st; await videoRef.current.play().catch(() => {}); } }, 100);
    } catch { toast.error(tri("Permesso fotocamera negato", "Kamera verweigert", "Camera denied", "Cámara denegada", "Caméra refusée", "اجازه رد شد")); }
  }, [tri]);

  const closeCheck = useCallback(() => { stopCam(); setCheckTask(null); setCheckRes(null); }, [stopCam]);

  const runCheck = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !checkTask) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 720; canvas.height = video.videoHeight || 540;
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
    const b64 = canvas.toDataURL("image/jpeg", 0.7);
    setChecking(true); setCheckRes(null);
    try {
      const r = await delegationApi.cleanlinessCheck(checkTask, b64);
      setCheckRes(r);
      if (r.clean) { toast.success(tri("Pulizia validata ✓ task chiuso", "Sauberkeit bestätigt ✓", "Cleanliness validated ✓", "Limpieza validada ✓", "Propreté validée ✓", "پاکیزگی تأیید شد ✓")); stopCam(); await load(); }
    } catch { toast.error(tri("Verifica non riuscita", "Prüfung fehlgeschlagen", "Check failed", "Verificación fallida", "Échec", "بررسی ناموفق")); }
    setChecking(false);
  }, [checkTask, tri, stopCam, load]);

  useEffect(() => () => stopCam(), [stopCam]);

  if (!tasks.length) return null;

  return (
    <div data-testid="team-tasks" className="w-full space-y-2 mb-4">
      <p className="text-[11px] font-black uppercase tracking-widest text-[#94A3B8] flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-[#14b8a6]" /> {tri("Task di squadra dal Capo", "Team-Aufgaben vom Chef", "Team tasks from the Boss", "Tareas de equipo del Jefe", "Tâches d'équipe du Chef", "وظایف تیمی از رئیس")}</p>
      <AnimatePresence>
        {tasks.map((t) => {
          const K = KIND[t.kind] || KIND.generico;
          const total = (t.steps || []).length;
          const doneN = (t.steps || []).filter((s) => s.done).length;
          return (
            <motion.div key={t.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} data-testid={`team-task-${t.id}`} className="rounded-2xl border p-3 text-left" style={{ borderColor: `${K.c}55`, background: `${K.c}0d` }}>
              <div className="flex items-center gap-2 mb-2">
                <K.icon className="w-4 h-4 shrink-0" style={{ color: K.c }} />
                <p className="text-sm font-black text-white flex-1 min-w-0 truncate">{t.title}</p>
                {t.start && <span data-testid={`team-task-start-${t.id}`} className="shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full" style={{ color: K.c, background: `${K.c}1a`, border: `1px solid ${K.c}55` }}>🕐 {t.start}</span>}
                {t.line && <span className="shrink-0 text-[10px] font-bold text-[#94A3B8] uppercase">{t.line}</span>}
                <span className="text-[10px] font-bold text-[#94A3B8]">{doneN}/{total}</span>
              </div>
              {t.kind === "crisis_override" && t.pacing && (
                <div className="mb-2 inline-flex items-center gap-1.5 text-[11px] font-bold text-[#f59e0b] bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-lg px-2.5 py-1"><Gauge className="w-3.5 h-3.5" /> {tri("Ritmo", "Tempo", "Pacing", "Ritmo", "Rythme", "ریتم")}: {t.pacing}{t.pacing_target ? ` · ${t.pacing_target}` : ""}</div>
              )}
              <div className="space-y-1.5">
                {(t.steps || []).map((s) => (
                  <button
                    key={s.order}
                    data-testid={`team-step-${t.id}-${s.order}`}
                    onClick={() => !s.done && markDone(t.id, s.order)}
                    disabled={s.done}
                    className={`w-full flex items-center gap-2 rounded-xl px-3 py-2 border text-left transition-all active:scale-98 ${s.done ? "bg-emerald-500/10 border-emerald-500/40" : "bg-[#030712] border-[#1e293b]"}`}
                  >
                    <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center border-2 ${s.done ? "bg-emerald-500 border-emerald-500 text-[#030712]" : "border-[#334155] text-[#64748B]"}`}>
                      {s.done ? <Check className="w-3.5 h-3.5" /> : s.order}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block text-[13px] font-semibold leading-snug ${s.done ? "text-emerald-300 line-through" : "text-white"}`}>{s.instruction || s.text}</span>
                      {s.assignee && <span className="block text-[10px] text-[#64748B]">{s.assignee}{s.assignee_position ? ` · ${s.assignee_position}` : ""}</span>}
                    </span>
                  </button>
                ))}
              </div>
              {t.kind === "sanificazione" && (t.steps || []).every((s) => s.done) && (
                <button data-testid={`team-clean-check-${t.id}`} onClick={() => openCheck(t.id)} className="mt-2 w-full inline-flex items-center justify-center gap-2 py-2 rounded-xl bg-[#22c55e]/15 border border-[#22c55e]/50 text-[#22c55e] font-black text-[12px] active:scale-98">
                  <Camera className="w-4 h-4" /> {tri("Valida pulizia con foto (checkpoint AR)", "Sauberkeit per Foto prüfen", "Validate cleanliness with photo", "Validar limpieza con foto", "Valider la propreté par photo", "تأیید پاکیزگی با عکس")}
                </button>
              )}
              {t.cleanliness && !t.cleanliness.clean && (
                <p className="mt-1.5 text-[11px] text-[#f59e0b]" data-testid={`team-clean-note-${t.id}`}>⚠ {t.cleanliness.note}</p>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>

      {checkTask && (
        <div data-testid="clean-check-overlay" className="fixed inset-0 z-[90] bg-[#030712]/95 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <button data-testid="clean-check-close" onClick={closeCheck} className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#0b0f19] border border-[#1e293b] flex items-center justify-center text-[#94A3B8]"><X className="w-5 h-5" /></button>
          <p className="text-sm font-black text-[#22c55e] mb-3 flex items-center gap-2"><ScanLine className="w-4 h-4" /> {tri("Checkpoint AR · Pulizia", "AR-Checkpoint · Sauberkeit", "AR Checkpoint · Cleanliness", "Checkpoint AR · Limpieza", "Checkpoint AR · Propreté", "چک‌پوینت AR · پاکیزگی")}</p>
          <div className="relative w-full max-w-sm rounded-2xl overflow-hidden border border-[#22c55e]/40 bg-black" style={{ aspectRatio: "4 / 3" }}>
            <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
            <div className="absolute inset-4 border-2 border-[#22c55e]/60 rounded-xl pointer-events-none" />
            {checking && <div className="absolute inset-0 bg-[#22c55e]/10 flex items-center justify-center"><Loader2 className="w-8 h-8 text-[#22c55e] animate-spin" /></div>}
          </div>
          {checkRes && !checkRes.clean && (
            <div data-testid="clean-check-result" className="mt-3 w-full max-w-sm rounded-xl border border-[#f59e0b]/50 bg-[#f59e0b]/10 p-3 text-[13px] text-[#f59e0b] font-semibold text-center">
              {tri("Non ancora a standard", "Noch nicht Standard", "Not up to standard yet", "Aún no estándar", "Pas encore au standard", "هنوز استاندارد نیست")} ({checkRes.score}%) — {checkRes.note}
            </div>
          )}
          <button data-testid="clean-check-shoot" onClick={runCheck} disabled={checking} className="mt-4 w-full max-w-sm inline-flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-[#16a34a] to-[#15803d] text-white font-black text-sm disabled:opacity-50 active:scale-98">
            {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />} {tri("Scatta e valida", "Foto & prüfen", "Shoot & validate", "Tomar y validar", "Photo & valider", "عکس و تأیید")}
          </button>
        </div>
      )}
    </div>
  );
}
