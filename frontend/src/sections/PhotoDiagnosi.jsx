import { useRef, useState } from "react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { Camera, Bug, Sparkles, Upload, RefreshCw, Wheat, Lightbulb, PartyPopper, Cog } from "lucide-react";
import { API } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { speak, primeVoice } from "@/lib/voice";
import Encyclopedia from "@/sections/Encyclopedia";

// Downscale + compress an image file to a base64 JPEG (keeps payload small)
function fileToCompressedBase64(file, maxDim = 1024, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxDim) { height = Math.round(height * maxDim / width); width = maxDim; }
        else if (height > maxDim) { width = Math.round(width * maxDim / height); height = maxDim; }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Grab a representative frame from a video file as base64 JPEG.
function videoToFrameBase64(file, maxDim = 1024, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata"; video.muted = true; video.playsInline = true; video.src = url;
    video.onloadeddata = () => { try { video.currentTime = Math.min(1, (video.duration || 2) / 2); } catch { /* */ } };
    video.onseeked = () => {
      let w = video.videoWidth, h = video.videoHeight;
      if (w > h && w > maxDim) { h = Math.round(h * maxDim / w); w = maxDim; }
      else if (h > maxDim) { w = Math.round(w * maxDim / h); h = maxDim; }
      const c = document.createElement("canvas"); c.width = w; c.height = h;
      c.getContext("2d").drawImage(video, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", quality));
    };
    video.onerror = () => { URL.revokeObjectURL(url); reject(new Error("video")); };
  });
}

export default function PhotoDiagnosi() {
  const [mode, setMode] = useState("difetti");
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [praised, setPraised] = useState(false);
  const fileRef = useRef(null);
  const { t, lang } = useLang();

  const MODES = [
    { id: "difetti", label: t("photo_mode_defects"), desc: t("photo_mode_defects_desc"), Icon: Bug },
    { id: "impasto", label: t("photo_mode_dough"), desc: t("photo_mode_dough_desc"), Icon: Wheat },
    { id: "ingredienti", label: t("photo_mode_ing"), desc: t("photo_mode_ing_desc"), Icon: Sparkles },
    { id: "scopri", label: t("photo_mode_discover"), desc: t("photo_mode_discover_desc"), Icon: Lightbulb },
    { id: "macchine", label: t("photo_mode_machines"), desc: t("photo_mode_machines_desc"), Icon: Cog },
  ];

  const onPick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const b64 = file.type.startsWith("video") ? await videoToFrameBase64(file) : await fileToCompressedBase64(file);
      setPreview(b64);
      setResult(""); setPraised(false);
    } catch {
      toast.error(t("toast_img_error"));
    }
  };

  const analyze = async () => {
    if (!preview || analyzing) return;
    primeVoice();
    setAnalyzing(true);
    setResult(""); setPraised(false);
    let full = "";
    try {
      const res = await fetch(`${API}/maestro/vision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ mode, image_base64: preview, lang }),
      });
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop();
        for (const part of parts) {
          const line = part.replace(/^data: ?/, "").trim();
          if (!line) continue;
          let obj;
          try { obj = JSON.parse(line); } catch { continue; }
          if (obj.done) continue;
          if (obj.d) { full += obj.d; setResult((r) => (r + obj.d)); }
        }
      }
      // Complimento vocale se il pane/impasto è fatto bene ([OK] in coda).
      if (/\[OK\]/.test(full) && (mode === "difetti" || mode === "impasto")) {
        setPraised(true);
        speak(t("photo_compliment"), lang);
      }
    } catch {
      toast.error(t("toast_analyze_error"));
    } finally {
      setResult((r) => r.replace(/\[OK\]|\[FIX\]/g, "").trim());
      setAnalyzing(false);
    }
  };

  return (
    <div className="pb-4">
      <div className="relative rounded-3xl overflow-hidden mb-5 bg-gradient-to-br from-[#B34A26] to-[#8C3A1D] p-6 text-white">
        <Camera className="w-7 h-7 mb-2" />
        <h1 className="font-display text-2xl font-bold">{t("photo_title")}</h1>
        <p className="text-white/85 text-sm mt-1">{t("photo_subtitle")}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        {MODES.map(({ id, label, desc, Icon }) => (
          <button
            key={id}
            data-testid={`photo-mode-${id}`}
            onClick={() => { setMode(id); setResult(""); setPraised(false); }}
            className={`flex flex-col items-start gap-1 p-3.5 rounded-2xl border text-left transition-all ${
              mode === id
                ? "bg-[#B34A26] text-white border-[#B34A26]"
                : "bg-white dark:bg-[#2A211D] text-[#2C221E] dark:text-[#F5EFE6] border-[#E8DEC8] dark:border-[#3D302A]"
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="font-semibold text-sm">{label}</span>
            <span className={`text-xs ${mode === id ? "text-white/80" : "text-[#8C7567]"}`}>{desc}</span>
          </button>
        ))}
      </div>

      <p className="text-xs text-[#8C7567] mb-4">{t("photo_video_hint")}</p>

      <input ref={fileRef} data-testid="photo-file-input" type="file" accept="image/*,video/*" capture="environment" onChange={onPick} className="hidden" />

      {preview ? (
        <div className="rounded-3xl overflow-hidden border border-[#E8DEC8] dark:border-[#3D302A] mb-4 relative">
          <img src={preview} alt="anteprima" className="w-full max-h-80 object-cover" />
          <button
            data-testid="photo-change-btn"
            onClick={() => fileRef.current?.click()}
            className="absolute top-3 right-3 bg-black/50 text-white text-sm px-3 py-1.5 rounded-full flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> {t("photo_change")}
          </button>
        </div>
      ) : (
        <button
          data-testid="photo-upload-btn"
          onClick={() => fileRef.current?.click()}
          className="w-full mb-4 border-2 border-dashed border-[#E8DEC8] dark:border-[#3D302A] rounded-3xl py-12 flex flex-col items-center gap-2 text-[#8C7567]"
        >
          <Upload className="w-8 h-8 text-[#D99B26]" />
          <span className="font-medium">{t("photo_upload")}</span>
        </button>
      )}

      <button
        data-testid="photo-analyze-btn"
        onClick={analyze}
        disabled={!preview || analyzing}
        className="w-full bg-[#B34A26] hover:bg-[#963B1C] disabled:opacity-50 text-white font-semibold px-5 py-3.5 rounded-2xl shadow-md active:scale-98 transition-all flex items-center justify-center gap-2"
      >
        {analyzing ? t("photo_analyzing") : t("photo_analyze")}
      </button>

      {praised && (
        <div data-testid="photo-compliment" className="mt-4 flex items-center gap-3 bg-[#6B8E62]/15 border border-[#6B8E62]/40 rounded-2xl p-4">
          <PartyPopper className="w-6 h-6 text-[#4d6b45] dark:text-[#9ec48f] shrink-0" />
          <p className="text-sm font-bold text-[#4d6b45] dark:text-[#9ec48f]">{t("photo_compliment")}</p>
        </div>
      )}

      {result && (
        <div data-testid="photo-result" className="markdown-body mt-5 bg-white dark:bg-[#2A211D] border border-[#E8DEC8] dark:border-[#3D302A] rounded-2xl p-5 text-sm leading-relaxed text-[#2C221E] dark:text-[#F5EFE6]">
          <ReactMarkdown>{result}</ReactMarkdown>
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-[#E8DEC8] dark:border-[#3D302A]">
        <Encyclopedia />
      </div>
    </div>
  );
}

