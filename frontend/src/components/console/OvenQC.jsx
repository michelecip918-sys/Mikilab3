import { useRef, useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { ScanEye, Camera, Upload, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { mikeApi } from "@/lib/api";
import { playTTS } from "@/lib/tts";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

const VERDICT = {
  ok: { c: "#6e9e85", lbl: (t) => t("Conforme", "Konform", "Pass", "Conforme", "Conforme", "تأیید") },
  attenzione: { c: "#a4afbb", lbl: (t) => t("Attenzione", "Achtung", "Attention", "Atención", "Attention", "توجه") },
  scarto: { c: "#b06e78", lbl: (t) => t("Scarto", "Ausschuss", "Reject", "Descarte", "Rebut", "ضایعات") },
};

// v14 · AI Computer Vision — Controllo Qualità Ottico all'uscita dei forni.
export default function OvenQC() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [product, setProduct] = useState("");
  const [cam, setCam] = useState(false);
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileRef = useRef(null);

  const stopCam = useCallback(() => {
    try { if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop()); } catch { /* */ }
    streamRef.current = null; setCam(false);
  }, []);
  useEffect(() => () => stopCam(), [stopCam]);

  const openCam = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) { toast.error(tri("Fotocamera non supportata", "Kamera nicht unterstützt", "Camera not supported", "Cámara no soportada", "Caméra non supportée", "دوربین پشتیبانی نمی‌شود")); return; }
    try {
      const st = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      streamRef.current = st; setCam(true);
      setTimeout(async () => { if (videoRef.current) { videoRef.current.srcObject = st; await videoRef.current.play().catch(() => {}); } }, 100);
    } catch { toast.error(tri("Permesso fotocamera negato", "Kamera verweigert", "Camera denied", "Cámara denegada", "Caméra refusée", "اجازه رد شد")); }
  }, [tri]);

  const analyze = useCallback(async (b64) => {
    setBusy(true); setRes(null);
    try {
      const r = await mikeApi.ovenQc({ image_base64: b64, product, lang });
      setRes(r.result);
      if (r.result?.spoken) { try { playTTS(r.result.spoken, { lang, voice: "bakemix" }); } catch { /* */ } }
    } catch { toast.error(tri("Analisi non riuscita", "Analyse fehlgeschlagen", "Analysis failed", "Análisis fallido", "Échec de l'analyse", "تحلیل ناموفق")); }
    setBusy(false);
  }, [product, lang, tri]);

  const shoot = useCallback(() => {
    const v = videoRef.current; if (!v) return;
    const c = document.createElement("canvas");
    c.width = v.videoWidth || 720; c.height = v.videoHeight || 540;
    c.getContext("2d").drawImage(v, 0, 0, c.width, c.height);
    const b64 = c.toDataURL("image/jpeg", 0.7);
    stopCam(); analyze(b64);
  }, [stopCam, analyze]);

  const onFile = useCallback((e) => {
    const f = e.target.files?.[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = () => analyze(reader.result);
    reader.readAsDataURL(f);
  }, [analyze]);

  const V = res ? (VERDICT[res.verdict] || VERDICT.attenzione) : null;

  return (
    <div data-testid="oven-qc" className="space-y-3">
      <label className="flex items-center gap-2 bg-[#0C1019] border border-[#64748B]/30 rounded-lg px-3 py-2">
        <ScanEye className="w-4 h-4 text-[#64748B]" />
        <input data-testid="qc-product-input" value={product} onChange={(e) => setProduct(e.target.value)} placeholder={tri("Prodotto (es. Baguette)", "Produkt", "Product", "Producto", "Produit", "محصول")} className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-[#4b6070]" />
      </label>

      {cam ? (
        <div className="relative w-full rounded-xl overflow-hidden border border-[#64748B]/40 bg-black" style={{ aspectRatio: "4 / 3" }}>
          <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
          <button data-testid="qc-cam-close" onClick={stopCam} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-[#0b0f19]/90 border border-[#1e293b] flex items-center justify-center text-[#94A3B8]"><X className="w-4 h-4" /></button>
          <button data-testid="qc-shoot" onClick={shoot} className="absolute bottom-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#8a97a6] text-[#060A10] font-black text-sm active:scale-95"><Camera className="w-4 h-4" /> {tri("Scansiona", "Scannen", "Scan", "Escanear", "Scanner", "اسکن")}</button>
        </div>
      ) : (
        <div className="flex gap-2">
          <button data-testid="qc-open-cam" onClick={openCam} className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-[#64748B]/15 border border-[#64748B]/50 text-[#9fc3dc] font-bold text-sm active:scale-95"><Camera className="w-4 h-4" /> {tri("Fotocamera", "Kamera", "Camera", "Cámara", "Caméra", "دوربین")}</button>
          <button data-testid="qc-open-file" onClick={() => fileRef.current?.click()} className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-[#0C1019] border border-[#64748B]/40 text-[#9fc3dc] font-bold text-sm active:scale-95"><Upload className="w-4 h-4" /> {tri("Carica foto", "Foto laden", "Upload photo", "Subir foto", "Charger photo", "بارگذاری عکس")}</button>
          <input ref={fileRef} data-testid="qc-file-input" type="file" accept="image/*" className="hidden" onChange={onFile} />
        </div>
      )}

      {busy && <div className="py-6 text-center text-[#7d97ac] text-sm flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> {tri("Analisi ottica in corso…", "Optische Analyse…", "Optical analysis…", "Análisis óptico…", "Analyse optique…", "تحلیل نوری…")}</div>}

      {res && V && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} data-testid="qc-result" className="rounded-xl border p-3" style={{ borderColor: `${V.c}55`, background: `${V.c}0d` }}>
          <div className="flex items-center gap-2">
            <span data-testid="qc-verdict" className="text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-full" style={{ color: V.c, border: `1px solid ${V.c}66` }}>{V.lbl(tri)}</span>
            <span className="text-sm font-black text-white">{tri("Qualità", "Qualität", "Quality", "Calidad", "Qualité", "کیفیت")}: {res.score}%</span>
          </div>
          {(res.defects || []).length > 0 && (
            <ul className="mt-2 space-y-1 list-disc list-inside">
              {res.defects.map((d, i) => (<li key={i} className="text-[12px] text-[#e6f6fa]">{d}</li>))}
            </ul>
          )}
          {res.notes && <p className="mt-2 text-[12px] text-[#94A3B8]">{res.notes}</p>}
        </motion.div>
      )}
    </div>
  );
}
