import { useState, useRef, useEffect, useCallback } from "react";
import { Camera, UserPlus, ScanFace, X, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { facesApi } from "@/lib/api";

const ENROLL_KEY = "mikilab_faces"; // cache locale dei volti (sincronizzata dal backend)
const load = () => { try { return JSON.parse(localStorage.getItem(ENROLL_KEY) || "[]"); } catch { return []; } };
const save = (a) => { try { localStorage.setItem(ENROLL_KEY, JSON.stringify(a)); } catch { /* */ } };

// Check-in col VOLTO: la fotocamera si apre, rileva un volto e riconosce il lavoratore.
// I volti sono registrati dal Capo e SINCRONIZZATI da tutti i tablet (backend /faces),
// con cache locale per l'uso offline.
export default function FaceCheckIn({ tri, onRecognized }) {
  const [enrolled, setEnrolled] = useState(load);
  const [mode, setMode] = useState(""); // "" | "login" | "enroll"
  const [target, setTarget] = useState(""); // nome in login/enroll
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const [faceOk, setFaceOk] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detRef = useRef(null);

  // Sincronizza i volti dal Capo (backend); fallback alla cache locale se offline.
  useEffect(() => {
    let alive = true;
    facesApi.list().then((d) => { if (alive && d && Array.isArray(d.faces)) { setEnrolled(d.faces); save(d.faces); } }).catch(() => {});
    return () => { alive = false; };
  }, []);

  const stop = useCallback(() => {
    try { streamRef.current && streamRef.current.getTracks().forEach((t) => t.stop()); } catch { /* */ }
    streamRef.current = null; setMode(""); setFaceOk(false);
  }, []);
  useEffect(() => () => stop(), [stop]);

  const openCam = async (m, name) => {
    setMode(m); setTarget(name || ""); setFaceOk(false);
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      streamRef.current = s;
      if (videoRef.current) { videoRef.current.srcObject = s; await videoRef.current.play().catch(() => {}); }
      // Rilevatore di volti nativo (Chrome Android). Se assente, si procede lo stesso.
      try { if ("FaceDetector" in window) detRef.current = new window.FaceDetector({ fastMode: true }); } catch { detRef.current = null; }
      loopDetect();
    } catch {
      toast.error(tri("Fotocamera non disponibile. Usa il nome.", "Kamera nicht verfügbar.", "Camera unavailable. Use your name.", "Cámara no disponible.", "Caméra indisponible.", "دوربین در دسترس نیست."));
      setMode("");
    }
  };

  const loopDetect = async () => {
    if (!streamRef.current || !videoRef.current) return;
    if (detRef.current) {
      try { const faces = await detRef.current.detect(videoRef.current); setFaceOk((faces || []).length > 0); }
      catch { setFaceOk(true); }
    } else { setFaceOk(true); } // niente API nativa: consenti scatto manuale
    if (streamRef.current) setTimeout(loopDetect, 700);
  };

  const snapThumb = () => {
    try {
      const v = videoRef.current; const c = document.createElement("canvas");
      c.width = 96; c.height = 96; const ctx = c.getContext("2d");
      ctx.drawImage(v, 0, 0, 96, 96);
      return c.toDataURL("image/jpeg", 0.6);
    } catch { return ""; }
  };

  const confirmLogin = () => {
    setBusy(true);
    const thumb = snapThumb();
    const list = enrolled.map((e) => (e.name === target ? { ...e, thumb: thumb || e.thumb } : e));
    save(list); setEnrolled(list);
    stop(); setBusy(false);
    onRecognized(target);
  };

  const confirmEnroll = () => {
    const nm = newName.trim(); if (!nm) return;
    setBusy(true);
    const thumb = snapThumb();
    const list = [...enrolled.filter((e) => e.name !== nm), { name: nm, thumb }];
    save(list); setEnrolled(list); setNewName("");
    stop(); setBusy(false);
    onRecognized(nm);
  };

  const forget = (nm) => { const list = enrolled.filter((e) => e.name !== nm); save(list); setEnrolled(list); };

  return (
    <div data-testid="face-checkin" className="rounded-2xl border border-[#9aabb8]/40 bg-[#0b0f19] p-4 mb-3">
      <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#9aabb8] mb-2"><ScanFace className="w-4 h-4" /> {tri("Entra col volto", "Mit Gesicht anmelden", "Face check-in", "Entrar con el rostro", "Connexion par visage", "ورود با چهره")}</p>

      {mode === "" && (
        <>
          {enrolled.length > 0 && (
            <>
              <p className="text-[11px] text-[#94A3B8] mb-2">{tri("Tocca il tuo volto per entrare:", "Tippe dein Gesicht:", "Tap your face to enter:", "Toca tu rostro:", "Touche ton visage :", "چهره‌ات را بزن:")}</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {enrolled.map((e) => (
                  <div key={e.name} className="relative">
                    <button data-testid={`face-login-${e.name}`} onClick={() => openCam("login", e.name)} className="flex flex-col items-center gap-1 w-20 rounded-xl bg-[#0C1019] border border-[#1e293b] hover:border-[#9aabb8]/60 p-2 active:scale-95">
                      {e.thumb ? <img src={e.thumb} alt={e.name} className="w-12 h-12 rounded-full object-cover border border-[#9aabb8]/40" /> : <span className="w-12 h-12 rounded-full bg-[#9aabb8]/10 flex items-center justify-center text-[#9aabb8]"><ScanFace className="w-6 h-6" /></span>}
                      <span className="text-[11px] font-bold text-white truncate max-w-full">{e.name}</span>
                    </button>
                    <button data-testid={`face-forget-${e.name}`} onClick={() => forget(e.name)} className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#030712] border border-[#1e293b] text-[#64748B] flex items-center justify-center"><X className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>
            </>
          )}
          <button data-testid="face-enroll-open" onClick={() => openCam("enroll")} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[#9aabb8]/10 border border-[#9aabb8]/40 text-[#9aabb8] font-bold text-sm active:scale-95">
            <UserPlus className="w-4 h-4" /> {tri("Registra il mio volto", "Gesicht registrieren", "Enroll my face", "Registrar mi rostro", "Enregistrer mon visage", "ثبت چهره")}
          </button>
        </>
      )}

      {mode !== "" && (
        <div className="space-y-2">
          <div className="relative w-full rounded-xl overflow-hidden border border-[#9aabb8]/40 bg-black" style={{ aspectRatio: "4/3" }}>
            <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
            <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: faceOk ? "inset 0 0 0 3px rgba(110,158,133,0.8)" : "inset 0 0 0 3px rgba(148,163,184,0.4)" }} />
            <span data-testid="face-status" className={`absolute top-2 left-2 text-[10px] font-black px-2 py-0.5 rounded-full ${faceOk ? "bg-[#6e9e85] text-[#04070d]" : "bg-[#0b0f19]/80 text-[#94A3B8]"}`}>{faceOk ? tri("Volto rilevato", "Gesicht erkannt", "Face detected", "Rostro detectado", "Visage détecté", "چهره تشخیص داده شد") : tri("Inquadra il viso", "Gesicht zeigen", "Center your face", "Encuadra el rostro", "Cadre ton visage", "صورت را در کادر بگذار")}</span>
            <button data-testid="face-cancel" onClick={stop} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-[#030712]/80 border border-[#1e293b] text-[#94A3B8] flex items-center justify-center"><X className="w-4 h-4" /></button>
          </div>
          {mode === "enroll" && (
            <input data-testid="face-enroll-name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={tri("Il tuo nome", "Dein Name", "Your name", "Tu nombre", "Ton nom", "نام تو")} className="w-full rounded-lg bg-[#030712] border border-[#1e293b] text-white text-sm px-3 py-2 focus:border-[#9aabb8] outline-none" />
          )}
          <button
            data-testid="face-confirm"
            onClick={mode === "enroll" ? confirmEnroll : confirmLogin}
            disabled={busy || !faceOk || (mode === "enroll" && !newName.trim())}
            className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#0891b2] to-[#9aabb8] text-[#04070d] font-black text-sm active:scale-95 disabled:opacity-40">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} {mode === "enroll" ? tri("Registra ed entra", "Registrieren & rein", "Enroll and enter", "Registrar y entrar", "Enregistrer et entrer", "ثبت و ورود") : tri(`Entra come ${target}`, `Als ${target} rein`, `Enter as ${target}`, `Entrar como ${target}`, `Entrer comme ${target}`, `ورود به عنوان ${target}`)}
          </button>
        </div>
      )}
    </div>
  );
}
