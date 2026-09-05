import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import { X, Camera, ScanLine, Loader2, Sparkles, MapPin, RefreshCw } from "lucide-react";
import { enterpriseApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

const TYPE_ICON = { oven: "🔥", mixer: "🥣", proofer: "🌡️", fridge: "❄️", divider: "🔪", shaper: "🥖", blast_chiller: "🧊", bench: "🪵", shelf: "🗄️", other: "⚙️" };
const EQ_COLOR = { optimal: "#22c55e", active: "#5EEAD4", warning: "#f59e0b" };

export default function SpatialVisionAR({ onClose }) {
  const { lang } = useLang();
  const tri = mkTri(lang);
  const [sites, setSites] = useState([]);
  const [siteId, setSiteId] = useState("");
  const [layout, setLayout] = useState(null);
  const [camOn, setCamOn] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [insight, setInsight] = useState("");
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    enterpriseApi.sites().then((s) => {
      const list = s.sites || [];
      setSites(list);
      if (list[0]) setSiteId(list[0].site_id);
    }).catch(() => {});
  }, []);

  const loadLayout = useCallback(async (id) => {
    if (!id) return;
    try { const r = await enterpriseApi.getLayout(id); setLayout(r.spatial_layout || null); } catch { setLayout(null); }
  }, []);
  useEffect(() => { loadLayout(siteId); }, [siteId, loadLayout]);

  const stopCam = useCallback(() => {
    try { if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop()); } catch { /* */ }
    streamRef.current = null; setCamOn(false);
  }, []);

  const startCam = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error(tri("Fotocamera non supportata", "Kamera nicht unterstützt", "Camera not supported", "Cámara no soportada", "Caméra non supportée", "دوربین پشتیبانی نمی‌شود"));
      return;
    }
    try {
      const st = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      streamRef.current = st; setCamOn(true);
      if (videoRef.current) { videoRef.current.srcObject = st; await videoRef.current.play().catch(() => {}); }
    } catch {
      toast.error(tri("Permesso fotocamera negato", "Kamera verweigert", "Camera permission denied", "Permiso de cámara denegado", "Caméra refusée", "اجازه دوربین رد شد"));
    }
  }, [tri]);

  useEffect(() => () => stopCam(), [stopCam]);

  const captureAndScan = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !siteId) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 720; canvas.height = video.videoHeight || 960;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const b64 = canvas.toDataURL("image/jpeg", 0.7);
    setScanning(true); setInsight("");
    try {
      const res = await enterpriseApi.visionScan(siteId, b64);
      setLayout(res.spatial_layout || null);
      setInsight(res.bakomix_insight || "");
      toast.success(tri(`${res.detected_count} macchinari riconosciuti`, `${res.detected_count} Maschinen erkannt`, `${res.detected_count} machines detected`, `${res.detected_count} máquinas detectadas`, `${res.detected_count} machines détectées`, `${res.detected_count} دستگاه شناسایی شد`));
      stopCam();
    } catch {
      toast.error(tri("Scansione non riuscita", "Scan fehlgeschlagen", "Scan failed", "Escaneo fallido", "Échec du scan", "اسکن ناموفق"));
    }
    setScanning(false);
  }, [siteId, tri, stopCam]);

  const dims = layout?.room_dimensions_m || { width: 12, length: 18 };
  const equipment = layout?.equipment || [];

  return (
    <div data-testid="spatial-vision-ar" className="fixed inset-0 z-[80] bg-[#030712]/97 backdrop-blur-xl overflow-y-auto">
      <div className="max-w-2xl mx-auto p-4 pb-16">
        <div className="flex items-center justify-between sticky top-0 bg-[#030712]/95 py-2 z-10">
          <h2 className="text-lg font-black text-white flex items-center gap-2"><ScanLine className="w-5 h-5 text-[#c084fc]" /> {tri("Vision AR · Scansiona Lab", "Vision AR · Labor scannen", "Vision AR · Scan Lab", "Vision AR · Escanear Lab", "Vision AR · Scanner Labo", "ویژن AR · اسکن آزمایشگاه")}</h2>
          <button data-testid="vision-close" onClick={() => { stopCam(); onClose(); }} className="w-9 h-9 rounded-full bg-[#0b0f19] border border-[#1e293b] flex items-center justify-center text-[#94A3B8] hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <p className="text-[12px] text-[#94A3B8] mb-4">{tri("Inquadra il laboratorio: l'IA riconosce i macchinari e li posiziona sulla mappa spaziale.", "Filme das Labor: die KI erkennt die Maschinen und platziert sie auf der Karte.", "Point at the lab: the AI recognizes machines and places them on the spatial map.", "Enfoca el laboratorio: la IA reconoce las máquinas y las ubica en el mapa.", "Filme le labo : l'IA reconnaît les machines et les place sur la carte.", "آزمایشگاه را نشانه بگیر: هوش مصنوعی ماشین‌ها را می‌شناسد و روی نقشه می‌گذارد.")}</p>

        {sites.length > 0 && (
          <select data-testid="vision-site-select" value={siteId} onChange={(e) => setSiteId(e.target.value)} className="w-full bg-[#0b0f19] border border-[#1e293b] rounded-xl p-3 text-sm text-white outline-none focus:border-[#c084fc] mb-4">
            {sites.map((s) => (<option key={s.site_id} value={s.site_id}>{s.name}</option>))}
          </select>
        )}

        {/* Fotocamera */}
        <div className="relative rounded-2xl overflow-hidden border border-[#1e293b] bg-black mb-3" style={{ aspectRatio: "3 / 4", maxHeight: "48vh" }}>
          <video ref={videoRef} playsInline muted className={`w-full h-full object-cover ${camOn ? "" : "hidden"}`} data-testid="vision-video" />
          {!camOn && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-[#64748B]">
              <Camera className="w-10 h-10 mb-2" />
              <p className="text-sm">{tri("Fotocamera spenta", "Kamera aus", "Camera off", "Cámara apagada", "Caméra éteinte", "دوربین خاموش")}</p>
            </div>
          )}
          {camOn && (
            <>
              <div className="absolute inset-4 border-2 border-[#c084fc]/60 rounded-xl pointer-events-none" />
              {scanning && <div className="absolute inset-0 bg-[#c084fc]/10 flex items-center justify-center"><Loader2 className="w-8 h-8 text-[#c084fc] animate-spin" /></div>}
            </>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          {!camOn ? (
            <button data-testid="vision-start-cam" onClick={startCam} className="col-span-2 inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-[#0b0f19] border border-[#c084fc]/50 text-[#c084fc] font-black text-sm active:scale-95"><Camera className="w-4 h-4" /> {tri("Accendi fotocamera", "Kamera an", "Turn on camera", "Encender cámara", "Allumer la caméra", "روشن کردن دوربین")}</button>
          ) : (
            <>
              <button data-testid="vision-scan-btn" onClick={captureAndScan} disabled={scanning} className="inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#a855f7] to-[#7c3aed] text-white font-black text-sm disabled:opacity-50 active:scale-95">{scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanLine className="w-4 h-4" />} {tri("Scansiona", "Scannen", "Scan", "Escanear", "Scanner", "اسکن")}</button>
              <button data-testid="vision-stop-cam" onClick={stopCam} className="inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-[#0b0f19] border border-[#1e293b] text-[#94A3B8] font-bold text-sm active:scale-95"><X className="w-4 h-4" /> {tri("Spegni", "Aus", "Off", "Apagar", "Éteindre", "خاموش")}</button>
            </>
          )}
        </div>

        {insight && (
          <div className="rounded-2xl border border-[#c084fc]/40 p-3 mb-4 flex items-start gap-2" style={{ background: "linear-gradient(135deg,#a855f718,transparent)" }} data-testid="vision-insight">
            <Sparkles className="w-4 h-4 text-[#c084fc] mt-0.5 shrink-0" />
            <p className="text-[12px] text-[#cfe0ec]">{insight}</p>
          </div>
        )}

        {/* Mappa spaziale */}
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] font-black uppercase tracking-widest text-[#94A3B8] flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-[#c084fc]" /> {tri("Mappa spaziale", "Raumkarte", "Spatial map", "Mapa espacial", "Carte spatiale", "نقشه فضایی")}</p>
          <button data-testid="vision-reload-map" onClick={() => loadLayout(siteId)} className="text-[#64748B] hover:text-[#c084fc]"><RefreshCw className="w-3.5 h-3.5" /></button>
        </div>
        <div data-testid="vision-map" className="relative w-full rounded-2xl border border-[#1e293b] bg-[#0b0f19] overflow-hidden" style={{ aspectRatio: `${dims.width} / ${dims.length}` }}>
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "linear-gradient(#1e293b 1px,transparent 1px),linear-gradient(90deg,#1e293b 1px,transparent 1px)", backgroundSize: "10% 10%" }} />
          {equipment.length === 0 && <div className="absolute inset-0 flex items-center justify-center text-[11px] text-[#64748B]">{tri("Nessun macchinario. Scansiona per popolare.", "Keine Maschine. Scanne zum Füllen.", "No machines. Scan to populate.", "Sin máquinas. Escanea para poblar.", "Aucune machine. Scanne pour remplir.", "ماشینی نیست. اسکن کن.")}</div>}
          {equipment.map((e) => {
            const c = EQ_COLOR[e.status] || "#5EEAD4";
            const left = Math.max(4, Math.min(96, (Number(e.x || 0) / (dims.width || 12)) * 100));
            const top = Math.max(4, Math.min(96, (Number(e.y || 0) / (dims.length || 18)) * 100));
            return (
              <div key={e.id} data-testid={`vision-eq-${e.id}`} className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center" style={{ left: `${left}%`, top: `${top}%` }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-base shadow-lg" style={{ background: `${c}22`, border: `2px solid ${c}`, boxShadow: `0 0 12px ${c}66` }}>{TYPE_ICON[e.type] || TYPE_ICON.other}</div>
                <span className="mt-0.5 text-[8px] font-bold text-white bg-[#030712]/80 px-1 rounded max-w-[80px] truncate">{e.name}</span>
                {e.source === "vision_ar" && <span className="text-[7px] text-[#c084fc] font-black">AR</span>}
              </div>
            );
          })}
        </div>
        <p className="text-[10px] text-[#64748B] mt-2 text-center">{tri("Locale", "Raum", "Room", "Sala", "Salle", "اتاق")} {dims.width}m × {dims.length}m · {equipment.length} {tri("macchinari", "Maschinen", "machines", "máquinas", "machines", "ماشین")}</p>
      </div>
    </div>
  );
}
