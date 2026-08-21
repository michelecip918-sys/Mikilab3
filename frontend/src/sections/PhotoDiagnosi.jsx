import { useState } from "react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { Camera, Bug, Sparkles, Upload, RefreshCw, Wheat, Lightbulb, PartyPopper, Cog } from "lucide-react";
import { API } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { speak, primeVoice } from "@/lib/voice";
import Encyclopedia from "@/sections/Encyclopedia";
import { HeroAvatar } from "@/components/MikiAvatar";
import DualPhotoButtons from "@/components/DualPhotoButtons";

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
  const { t, lang } = useLang();

  const MODES = [
    { id: "difetti", label: t("photo_mode_defects"), desc: t("photo_mode_defects_desc"), Icon: Bug },
    { id: "impasto", label: t("photo_mode_dough"), desc: t("photo_mode_dough_desc"), Icon: Wheat },
    { id: "ingredienti", label: t("photo_mode_ing"), desc: t("photo_mode_ing_desc"), Icon: Sparkles },
    { id: "scopri", label: t("photo_mode_discover"), desc: t("photo_mode_discover_desc"), Icon: Lightbulb },
    { id: "macchine", label: t("photo_mode_machines"), desc: t("photo_mode_machines_desc"), Icon: Cog },
  ];

  const onPick = async (file) => {
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
      <div className="relative rounded-3xl overflow-hidden mb-5 bg-gradient-to-br from-[#5E8B7E] to-[#33564E] p-6 text-white">
        <HeroAvatar />
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
                ? "bg-[#5E8B7E] text-white border-[#5E8B7E]"
                : "bg-white dark:bg-[#232A31] text-[#2B303B] dark:text-[#EAF0EC] border-[#D7E1DB] dark:border-[#38424B]"
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="font-semibold text-sm">{label}</span>
            <span className={`text-xs ${mode === id ? "text-white/80" : "text-[#7E8A93]"}`}>{desc}</span>
          </button>
        ))}
      </div>

      <p className="text-xs text-[#7E8A93] mb-4">{t("photo_video_hint")}</p>

      <div className="mb-4">
        <DualPhotoButtons onFile={onPick} allowVideo testid="photo" />
      </div>

      {preview && (
        <div className="rounded-3xl overflow-hidden border border-[#D7E1DB] dark:border-[#38424B] mb-4">
          <img src={preview} alt="anteprima" className="w-full max-h-80 object-cover" />
        </div>
      )}

      <button
        data-testid="photo-analyze-btn"
        onClick={analyze}
        disabled={!preview || analyzing}
        className="w-full bg-[#5E8B7E] hover:bg-[#4C7368] disabled:opacity-50 text-white font-semibold px-5 py-3.5 rounded-2xl shadow-md active:scale-98 transition-all flex items-center justify-center gap-2"
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
        <div data-testid="photo-result" className="markdown-body mt-5 bg-white dark:bg-[#232A31] border border-[#D7E1DB] dark:border-[#38424B] rounded-2xl p-5 text-sm leading-relaxed text-[#2B303B] dark:text-[#EAF0EC]">
          <ReactMarkdown>{result}</ReactMarkdown>
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-[#D7E1DB] dark:border-[#38424B]">
        <Encyclopedia />
      </div>
    </div>
  );
}

