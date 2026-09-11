import { useState, useRef, useEffect, useCallback } from "react";
import { ScanFace, UserPlus, Trash2, X, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { facesApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// Il Capo registra i volti della squadra UNA volta; vengono sincronizzati su tutti i tablet di reparto.
export default function TeamFaces() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [faces, setFaces] = useState([]);
  const [cam, setCam] = useState(false);
  const [name, setName] = useState("");
  const [dept, setDept] = useState("");
  const [faceOk, setFaceOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detRef = useRef(null);

  const reload = useCallback(() => { facesApi.list().then((d) => setFaces(d.faces || [])).catch(() => {}); }, []);
  useEffect(() => { reload(); }, [reload]);

  const stop = useCallback(() => { try { streamRef.current && streamRef.current.getTracks().forEach((t) => t.stop()); } catch { /* */ } streamRef.current = null; setCam(false); setFaceOk(false); }, []);
  useEffect(() => () => stop(), [stop]);

  const openCam = async () => {
    setCam(true); setFaceOk(false);
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      streamRef.current = s; if (videoRef.current) { videoRef.current.srcObject = s; await videoRef.current.play().catch(() => {}); }
      try { if ("FaceDetector" in window) detRef.current = new window.FaceDetector({ fastMode: true }); } catch { detRef.current = null; }
      loop();
    } catch { toast.error(tri("Fotocamera non disponibile.", "Kamera nicht verfügbar.", "Camera unavailable.", "Cámara no disponible.", "Caméra indisponible.", "دوربین در دسترس نیست.")); setCam(false); }
  };
  const loop = async () => {
    if (!streamRef.current || !videoRef.current) return;
    if (detRef.current) { try { const f = await detRef.current.detect(videoRef.current); setFaceOk((f || []).length > 0); } catch { setFaceOk(true); } } else setFaceOk(true);
    if (streamRef.current) setTimeout(loop, 700);
  };
  const snap = () => { try { const v = videoRef.current, c = document.createElement("canvas"); c.width = 96; c.height = 96; c.getContext("2d").drawImage(v, 0, 0, 96, 96); return c.toDataURL("image/jpeg", 0.6); } catch { return ""; } };

  const enroll = async () => {
    const nm = name.trim(); if (!nm) return;
    setBusy(true);
    try { await facesApi.save({ name: nm, dept, thumb: snap() }); toast.success(tri(`Volto di ${nm} registrato ✓`, `${nm} registriert ✓`, `${nm}'s face enrolled ✓`, `Rostro de ${nm} ✓`, `Visage de ${nm} ✓`, `چهره ${nm} ثبت شد ✓`)); setName(""); setDept(""); stop(); reload(); }
    catch { toast.error(tri("Registrazione non riuscita.", "Fehlgeschlagen.", "Enrollment failed.", "Fallo.", "Échec.", "ناموفق.")); }
    setBusy(false);
  };
  const remove = (nm) => facesApi.remove(nm).then(reload).catch(() => {});

  return (
    <div data-testid="team-faces" className="space-y-3">
      <p className="text-[11px] text-[#94A3B8]">{tri(
        "Registra il volto di ogni membro della squadra: verrà riconosciuto su tutti i tablet di reparto per entrare senza digitare.",
        "Registriere jedes Teammitglied-Gesicht: auf allen Tablets erkannt.",
        "Enroll each team member's face: recognized on all department tablets for typing-free entry.",
        "Registra el rostro de cada miembro: reconocido en todos los tablets.",
        "Enregistre le visage de chaque membre : reconnu sur toutes les tablettes.",
        "چهره هر عضو تیم را ثبت کن: روی همه تبلت‌ها شناخته می‌شود.")}</p>

      {!cam ? (
        <button data-testid="team-faces-add" onClick={openCam} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[#9aabb8]/10 border border-[#9aabb8]/40 text-[#9aabb8] font-bold text-sm active:scale-95"><UserPlus className="w-4 h-4" /> {tri("Registra un volto", "Gesicht registrieren", "Enroll a face", "Registrar rostro", "Enregistrer un visage", "ثبت چهره")}</button>
      ) : (
        <div className="space-y-2">
          <div className="relative w-full rounded-xl overflow-hidden border border-[#9aabb8]/40 bg-black" style={{ aspectRatio: "4/3" }}>
            <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
            <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: faceOk ? "inset 0 0 0 3px rgba(110,158,133,0.8)" : "inset 0 0 0 3px rgba(148,163,184,0.4)" }} />
            <span data-testid="team-faces-status" className={`absolute top-2 left-2 text-[10px] font-black px-2 py-0.5 rounded-full ${faceOk ? "bg-[#6e9e85] text-[#04070d]" : "bg-[#0b0f19]/80 text-[#94A3B8]"}`}>{faceOk ? tri("Volto rilevato", "Erkannt", "Face detected", "Detectado", "Détecté", "تشخیص داده شد") : tri("Inquadra il viso", "Gesicht zeigen", "Center face", "Encuadra", "Cadre", "کادر")}</span>
            <button data-testid="team-faces-cancel" onClick={stop} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-[#030712]/80 border border-[#1e293b] text-[#94A3B8] flex items-center justify-center"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input data-testid="team-faces-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={tri("Nome", "Name", "Name", "Nombre", "Nom", "نام")} className="rounded-lg bg-[#030712] border border-[#1e293b] text-white text-sm px-3 py-2 focus:border-[#9aabb8] outline-none" />
            <input data-testid="team-faces-dept" value={dept} onChange={(e) => setDept(e.target.value)} placeholder={tri("Reparto (facolt.)", "Bereich (opt.)", "Dept (optional)", "Área (opc.)", "Atelier (opt.)", "بخش (اختیاری)")} className="rounded-lg bg-[#030712] border border-[#1e293b] text-white text-sm px-3 py-2 focus:border-[#9aabb8] outline-none" />
          </div>
          <button data-testid="team-faces-save" onClick={enroll} disabled={busy || !faceOk || !name.trim()} className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-[#0891b2] to-[#9aabb8] text-[#04070d] font-black text-sm active:scale-95 disabled:opacity-40">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} {tri("Salva volto", "Speichern", "Save face", "Guardar", "Enregistrer", "ذخیره")}</button>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {faces.length === 0 ? <p className="text-[12px] text-[#64748B]">{tri("Nessun volto registrato.", "Keine Gesichter.", "No faces enrolled.", "Sin rostros.", "Aucun visage.", "چهره‌ای نیست.")}</p> : faces.map((f) => (
          <div key={f.name} data-testid={`team-face-${f.name}`} className="relative flex flex-col items-center gap-1 w-20 rounded-xl bg-[#0C1019] border border-[#1e293b] p-2">
            {f.thumb ? <img src={f.thumb} alt={f.name} className="w-12 h-12 rounded-full object-cover border border-[#9aabb8]/40" /> : <span className="w-12 h-12 rounded-full bg-[#9aabb8]/10 flex items-center justify-center text-[#9aabb8]"><ScanFace className="w-6 h-6" /></span>}
            <span className="text-[11px] font-bold text-white truncate max-w-full">{f.name}</span>
            {f.dept && <span className="text-[9px] text-[#64748B] truncate max-w-full">{f.dept}</span>}
            <button data-testid={`team-face-del-${f.name}`} onClick={() => remove(f.name)} className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#030712] border border-[#1e293b] text-[#64748B] hover:text-rose-400 flex items-center justify-center"><Trash2 className="w-3 h-3" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
